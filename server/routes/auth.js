import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, REQUIRED_WORK_SECONDS } from '../config.js';

const router = express.Router();

// In-memory OTP storage for password resets: { identifier: { otp, expiresAt } }
const otpStore = new Map();

// Helper to sanitize user object (remove hashed password)
function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// Compute worked seconds for an attendance record up to right now
export function calculateCurrentWorkedSeconds(record) {
  if (!record || !record.checkIn) return 0;
  
  const checkInTime = new Date(record.checkIn).getTime();
  const endTime = record.checkOut ? new Date(record.checkOut).getTime() : Date.now();
  const totalElapsedSeconds = Math.max(0, Math.floor((endTime - checkInTime) / 1000));
  
  // Account for ongoing break
  let currentBreakSeconds = record.totalBreakSeconds || 0;
  if (record.isOnBreak && record.breakStartTime) {
    const ongoingBreak = Math.max(0, Math.floor((Date.now() - new Date(record.breakStartTime).getTime()) / 1000));
    currentBreakSeconds += ongoingBreak;
  }

  const netWorkedSeconds = Math.max(0, totalElapsedSeconds - currentBreakSeconds);
  return {
    netWorkedSeconds,
    totalBreakSeconds: currentBreakSeconds,
    remainingSeconds: Math.max(0, REQUIRED_WORK_SECONDS - netWorkedSeconds),
    percentCompleted: Math.min(100, Math.round((netWorkedSeconds / REQUIRED_WORK_SECONDS) * 100))
  };
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your email or mobile phone number, and password.' });
    }

    const user = db.getUserByEmailOrPhone(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact your administrator.' });
    }

    // Verify password (also allow plain match for demo accounts if bcrypt fails)
    const passwordMatch = bcrypt.compareSync(password, user.password) || (user.plainDemoPassword && password === user.plainDemoPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials or use Forgot Password.' });
    }

    // AUTOMATIC 8-HOUR TRACKING ON LOGIN:
    // When employee or manager logs in, auto check them in for today
    const todayStr = new Date().toISOString().split('T')[0];
    let attendanceRecord = db.getTodayAttendanceRecord(user.id);
    const nowIso = new Date().toISOString();

    if (!attendanceRecord) {
      attendanceRecord = {
        id: `ATT-${todayStr}-${user.id}`,
        employeeId: user.id,
        employeeName: user.name,
        department: user.department,
        date: todayStr,
        checkIn: nowIso,
        checkOut: null,
        isOnBreak: false,
        breakStartTime: null,
        totalBreakSeconds: 0,
        workedSeconds: 0,
        status: 'In Progress',
        note: 'Auto-clocked in upon login'
      };
      db.upsertAttendance(attendanceRecord);
      db.logAudit(user.name, 'AUTO_CHECK_IN', `User logged in. Automatic 8h work timer started at ${new Date().toLocaleTimeString()}.`);
    } else if (attendanceRecord.checkOut) {
      // User is logging back in after checking out earlier today: resume work session
      attendanceRecord.checkOut = null;
      attendanceRecord.status = 'In Progress';
      attendanceRecord.note = (attendanceRecord.note || '') + ' | Resumed on re-login';
      db.upsertAttendance(attendanceRecord);
      db.logAudit(user.name, 'RESUME_WORK', `User logged back in. Resumed today's work session.`);
    } else {
      db.logAudit(user.name, 'LOGIN', `User logged in. Active work session continues.`);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = sanitizeUser(user);
    const stats = calculateCurrentWorkedSeconds(attendanceRecord);

    res.json({
      success: true,
      token,
      user: safeUser,
      attendance: {
        ...attendanceRecord,
        liveStats: stats
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      const user = db.getUserById(userId);
      const todayRecord = db.getTodayAttendanceRecord(userId);

      if (todayRecord && !todayRecord.checkOut) {
        // AUTOMATIC 8-HOUR TRACKING ON LOGOUT:
        // Finalize working hours and mark Check Out
        const nowIso = new Date().toISOString();
        todayRecord.checkOut = nowIso;
        
        // If they were on break when logging out, end the break
        if (todayRecord.isOnBreak && todayRecord.breakStartTime) {
          const ongoingBreak = Math.max(0, Math.floor((Date.now() - new Date(todayRecord.breakStartTime).getTime()) / 1000));
          todayRecord.totalBreakSeconds = (todayRecord.totalBreakSeconds || 0) + ongoingBreak;
          todayRecord.isOnBreak = false;
          todayRecord.breakStartTime = null;
        }

        const stats = calculateCurrentWorkedSeconds(todayRecord);
        todayRecord.workedSeconds = stats.netWorkedSeconds;
        todayRecord.status = todayRecord.workedSeconds >= REQUIRED_WORK_SECONDS ? 'Completed' : 'Short Hours';
        todayRecord.note = (todayRecord.note || '') + ' | Auto-clocked out upon logout';

        db.upsertAttendance(todayRecord);
        db.logAudit(user ? user.name : userId, 'AUTO_CHECK_OUT', `User logged out. Working session concluded. Total: ${(todayRecord.workedSeconds / 3600).toFixed(2)}h.`);
      }
    }

    res.json({ success: true, message: 'Logged out successfully. Working hours finalized.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout error: ' + err.message });
  }
});

// POST /api/auth/forgot-password (Simulates sending OTP to registered email or mobile)
router.post('/forgot-password', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Please provide registered email or mobile number.' });
    }

    const user = db.getUserByEmailOrPhone(identifier);
    if (!user) {
      return res.status(404).json({ error: 'No employee account found with this email or mobile number.' });
    }

    // Generate 6-digit OTP (for easy testing, we also return it in response)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(user.email.toLowerCase(), { otp, expiresAt, userId: user.id });
    otpStore.set(user.phone.replace(/[\s\-\(\)]/g, ''), { otp, expiresAt, userId: user.id });

    db.logAudit(user.name, 'PASSWORD_RESET_OTP_SENT', `Password reset OTP generated for ${user.email} / ${user.phone}`);

    res.json({
      success: true,
      message: `Verification OTP has been dispatched to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')} and ${user.phone.slice(-4)}.`,
      // Return simulated OTP in demo mode for instant testing!
      demoOtp: otp,
      identifier
    });
  } catch (err) {
    res.status(500).json({ error: 'Forgot password error: ' + err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and OTP are required.' });
    }

    const cleanKey = identifier.includes('@') ? identifier.toLowerCase().trim() : identifier.replace(/[\s\-\(\)]/g, '');
    const entry = otpStore.get(cleanKey);

    if (!entry) {
      return res.status(400).json({ error: 'OTP expired or not requested. Please request a new OTP.' });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanKey);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (entry.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP entered. Please try again.' });
    }

    res.json({ success: true, message: 'OTP verified successfully.', verified: true });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed: ' + err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanKey = identifier.includes('@') ? identifier.toLowerCase().trim() : identifier.replace(/[\s\-\(\)]/g, '');
    const entry = otpStore.get(cleanKey);

    if (!entry || entry.otp !== otp.trim() || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP session. Please restart password reset.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    const updatedUser = db.updateUser(entry.userId, {
      password: hashedPassword,
      plainDemoPassword: newPassword
    });

    otpStore.delete(cleanKey);
    db.logAudit(updatedUser.name, 'PASSWORD_RESET_SUCCESS', `Password successfully updated.`);

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Password reset error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User no longer exists' });
    }

    const todayRecord = db.getTodayAttendanceRecord(user.id);
    const stats = todayRecord ? calculateCurrentWorkedSeconds(todayRecord) : null;

    res.json({
      user: sanitizeUser(user),
      attendance: todayRecord ? { ...todayRecord, liveStats: stats } : null
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
