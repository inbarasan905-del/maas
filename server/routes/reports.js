import express from 'express';
import { db } from '../db.js';
import { requireAuth } from './attendance.js';
import { calculateCurrentWorkedSeconds } from './auth.js';
import { REQUIRED_WORK_SECONDS } from '../config.js';

const router = express.Router();

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', requireAuth, (req, res) => {
  try {
    let users = db.getUsers().filter(u => u.status === 'active');
    const todayStr = new Date().toISOString().split('T')[0];
    let todayAttendance = db.getAttendance().filter(a => a.date === todayStr);
    let leaves = db.getLeaves();

    // If manager, filter by department
    if (req.user.role === 'manager') {
      const manager = db.getUserById(req.user.id);
      users = users.filter(u => u.department === manager.department);
      const userIds = new Set(users.map(u => u.id));
      todayAttendance = todayAttendance.filter(a => userIds.has(a.employeeId));
      leaves = leaves.filter(l => userIds.has(l.employeeId));
    }

    const totalEmployees = users.length;

    // Active employees today (currently clocked in or finished)
    const presentTodayCount = todayAttendance.filter(a => a.checkIn).length;
    const currentlyWorkingCount = todayAttendance.filter(a => a.checkIn && !a.checkOut && !a.isOnBreak).length;
    const onBreakCount = todayAttendance.filter(a => a.checkIn && a.isOnBreak).length;

    // Approved leaves for today
    const onLeaveEmployees = leaves.filter(l => {
      return l.status === 'Approved' && todayStr >= l.startDate && todayStr <= l.endDate;
    });
    const onLeaveCount = onLeaveEmployees.length;

    // Absent today: active employees who are NOT present today and NOT on approved leave
    const presentOrLeaveIds = new Set([
      ...todayAttendance.map(a => a.employeeId),
      ...onLeaveEmployees.map(l => l.employeeId)
    ]);
    const absentTodayCount = Math.max(0, users.filter(u => !presentOrLeaveIds.has(u.id)).length);

    // Calculate total & average working hours today
    let totalWorkedSeconds = 0;
    let completed8hCount = 0;

    todayAttendance.forEach(a => {
      const live = calculateCurrentWorkedSeconds(a);
      totalWorkedSeconds += live.netWorkedSeconds;
      if (live.netWorkedSeconds >= REQUIRED_WORK_SECONDS) {
        completed8hCount++;
      }
    });

    const avgHoursToday = presentTodayCount > 0 ? (totalWorkedSeconds / presentTodayCount / 3600).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday: presentTodayCount,
        currentlyWorking: currentlyWorkingCount,
        onBreak: onBreakCount,
        absentToday: absentTodayCount,
        onLeave: onLeaveCount,
        requiredHoursPerDay: 8,
        completed8hCount,
        avgHoursToday: Number(avgHoursToday)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export-csv
router.get('/export-csv', requireAuth, (req, res) => {
  try {
    let records = db.getAttendance();

    if (req.user.role === 'employee') {
      records = records.filter(r => r.employeeId === req.user.id);
    } else if (req.user.role === 'manager') {
      const manager = db.getUserById(req.user.id);
      records = records.filter(r => r.department === manager.department);
    }

    // Format as CSV
    const headers = ['Record ID', 'Employee ID', 'Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Break (Mins)', 'Total Worked (Hours)', 'Status', 'Notes'];
    
    const rows = records.map(r => {
      const live = calculateCurrentWorkedSeconds(r);
      const hoursWorked = (live.netWorkedSeconds / 3600).toFixed(2);
      const breakMins = Math.round(live.totalBreakSeconds / 60);
      const checkInFormatted = r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : 'N/A';
      const checkOutFormatted = r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : (r.checkIn ? 'In Progress' : 'N/A');

      return [
        r.id,
        r.employeeId,
        `"${r.employeeName}"`,
        `"${r.department}"`,
        r.date,
        `"${checkInFormatted}"`,
        `"${checkOutFormatted}"`,
        breakMins,
        hoursWorked,
        `"${r.status}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="MAAS_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/audit-logs
router.get('/audit-logs', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Permission denied: Audit logs are restricted to Admins and Managers.' });
    }

    const logs = db.getAuditLogs().slice(0, 50);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
