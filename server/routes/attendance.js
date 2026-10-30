import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { calculateCurrentWorkedSeconds } from './auth.js';
import { REQUIRED_WORK_SECONDS, JWT_SECRET } from '../config.js';

const router = express.Router();

// Middleware to authenticate requests (supports Authorization Header or ?token= query)
export function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token: ' + err.message });
  }
}

// GET /api/attendance/today
router.get('/today', requireAuth, (req, res) => {
  try {
    const userId = req.query.employeeId || req.user.id;
    const record = db.getTodayAttendanceRecord(userId);

    if (!record) {
      return res.json({
        exists: false,
        message: 'No active session for today. It will start automatically upon login or manual Check In.'
      });
    }

    const liveStats = calculateCurrentWorkedSeconds(record);
    res.json({
      exists: true,
      record: {
        ...record,
        liveStats
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkin (Manual Check In override or initial start)
router.post('/checkin', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.getUserById(userId);
    const todayStr = new Date().toISOString().split('T')[0];
    let record = db.getTodayAttendanceRecord(userId);

    if (record && !record.checkOut) {
      return res.status(400).json({ error: 'You are already checked in for today!' });
    }

    const nowIso = new Date().toISOString();

    if (!record) {
      record = {
        id: `ATT-${todayStr}-${userId}`,
        employeeId: userId,
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
        note: 'Checked in manually'
      };
    } else {
      record.checkOut = null;
      record.status = 'In Progress';
      record.note = (record.note || '') + ' | Checked back in manually';
    }

    db.upsertAttendance(record);
    db.logAudit(user.name, 'MANUAL_CHECK_IN', `Employee checked in manually.`);

    const liveStats = calculateCurrentWorkedSeconds(record);
    res.json({ success: true, record: { ...record, liveStats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/checkout (Manual Check Out)
router.post('/checkout', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.getUserById(userId);
    const record = db.getTodayAttendanceRecord(userId);

    if (!record || record.checkOut) {
      return res.status(400).json({ error: 'No active check-in found to check out from.' });
    }

    const nowIso = new Date().toISOString();
    record.checkOut = nowIso;

    // Conclude ongoing break if active
    if (record.isOnBreak && record.breakStartTime) {
      const ongoing = Math.max(0, Math.floor((Date.now() - new Date(record.breakStartTime).getTime()) / 1000));
      record.totalBreakSeconds = (record.totalBreakSeconds || 0) + ongoing;
      record.isOnBreak = false;
      record.breakStartTime = null;
    }

    const liveStats = calculateCurrentWorkedSeconds(record);
    record.workedSeconds = liveStats.netWorkedSeconds;
    record.status = record.workedSeconds >= REQUIRED_WORK_SECONDS ? 'Completed' : 'Short Hours';
    record.note = (record.note || '') + ' | Checked out manually';

    db.upsertAttendance(record);
    db.logAudit(user.name, 'MANUAL_CHECK_OUT', `Employee checked out manually. Total time worked: ${(record.workedSeconds / 3600).toFixed(2)}h.`);

    res.json({ success: true, record: { ...record, liveStats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/break/start
router.post('/break/start', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.getUserById(userId);
    const record = db.getTodayAttendanceRecord(userId);

    if (!record || record.checkOut) {
      return res.status(400).json({ error: 'You must be actively checked in to take a break.' });
    }

    if (record.isOnBreak) {
      return res.status(400).json({ error: 'You are already on a break.' });
    }

    record.isOnBreak = true;
    record.breakStartTime = new Date().toISOString();
    db.upsertAttendance(record);
    db.logAudit(user.name, 'BREAK_START', `Employee paused work for a break.`);

    const liveStats = calculateCurrentWorkedSeconds(record);
    res.json({ success: true, record: { ...record, liveStats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/break/end
router.post('/break/end', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.getUserById(userId);
    const record = db.getTodayAttendanceRecord(userId);

    if (!record || !record.isOnBreak) {
      return res.status(400).json({ error: 'You are not currently on a break.' });
    }

    const breakDuration = Math.max(0, Math.floor((Date.now() - new Date(record.breakStartTime).getTime()) / 1000));
    record.totalBreakSeconds = (record.totalBreakSeconds || 0) + breakDuration;
    record.isOnBreak = false;
    record.breakStartTime = null;

    db.upsertAttendance(record);
    db.logAudit(user.name, 'BREAK_END', `Employee resumed work. Break duration: ${Math.round(breakDuration / 60)} mins.`);

    const liveStats = calculateCurrentWorkedSeconds(record);
    res.json({ success: true, record: { ...record, liveStats } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/active-sessions (List of employees currently working)
router.get('/active-sessions', requireAuth, (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const allAttendance = db.getAttendance().filter(a => a.date === todayStr);
    const users = db.getUsers();

    // Map active sessions with live timer calculations
    const activeSessions = allAttendance.map(att => {
      const user = users.find(u => u.id === att.employeeId);
      const liveStats = calculateCurrentWorkedSeconds(att);
      return {
        ...att,
        userAvatar: user ? user.avatar : '',
        userDesignation: user ? user.designation : '',
        liveStats
      };
    });

    res.json({
      success: true,
      count: activeSessions.length,
      sessions: activeSessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/history (Daily & Monthly historical logs)
router.get('/history', requireAuth, (req, res) => {
  try {
    const { employeeId, department, month, date } = req.query;
    let records = db.getAttendance();

    // Role-based visibility: regular employees can only see their own records
    if (req.user.role === 'employee') {
      records = records.filter(r => r.employeeId === req.user.id);
    } else if (req.user.role === 'manager') {
      // Managers see their department or specific employee
      const managerUser = db.getUserById(req.user.id);
      if (employeeId) {
        records = records.filter(r => r.employeeId === employeeId);
      } else {
        records = records.filter(r => r.department === managerUser.department || r.employeeId === req.user.id);
      }
    } else if (employeeId) {
      records = records.filter(r => r.employeeId === employeeId);
    }

    if (department) {
      records = records.filter(r => r.department === department);
    }

    if (date) {
      records = records.filter(r => r.date === date);
    }

    if (month) {
      records = records.filter(r => r.date.startsWith(month));
    }

    // Sort descending by date
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate live stats for any open sessions in the list
    const enriched = records.map(r => {
      const liveStats = calculateCurrentWorkedSeconds(r);
      return {
        ...r,
        liveStats
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      records: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
