import express from 'express';
import { db } from '../db.js';
import { requireAuth } from './attendance.js';

const router = express.Router();

// GET /api/leaves
router.get('/', requireAuth, (req, res) => {
  try {
    let leaves = db.getLeaves();

    if (req.user.role === 'employee') {
      leaves = leaves.filter(l => l.employeeId === req.user.id);
    } else if (req.user.role === 'manager') {
      const manager = db.getUserById(req.user.id);
      leaves = leaves.filter(l => l.department === manager.department || l.employeeId === req.user.id);
    }

    res.json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaves (Submit a leave request)
router.post('/', requireAuth, (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Please fill in all leave request fields.' });
    }

    const user = db.getUserById(req.user.id);
    const leave = db.createLeave({
      employeeId: user.id,
      employeeName: user.name,
      department: user.department,
      leaveType,
      startDate,
      endDate,
      reason
    });

    db.logAudit(user.name, 'APPLY_LEAVE', `Applied for ${leaveType} from ${startDate} to ${endDate}.`);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully. Awaiting approval.',
      leave
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leaves/:id/status (Approve / Reject)
router.put('/:id/status', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ error: 'Permission denied: Employees cannot approve or reject leaves.' });
    }

    const { status, reviewNote } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either Approved or Rejected.' });
    }

    const targetLeave = db.getLeaves().find(l => l.id === req.params.id);
    if (!targetLeave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    // Manager can only approve department leaves
    if (req.user.role === 'manager') {
      const manager = db.getUserById(req.user.id);
      if (targetLeave.department !== manager.department) {
        return res.status(403).json({ error: 'You can only approve leaves within your department.' });
      }
    }

    const reviewer = db.getUserById(req.user.id);
    const updated = db.updateLeaveStatus(req.params.id, status, reviewer.name, reviewNote);

    db.logAudit(
      reviewer.name,
      status === 'Approved' ? 'LEAVE_APPROVAL' : 'LEAVE_REJECTION',
      `${status} leave ${targetLeave.id} for ${targetLeave.employeeName}. Note: ${reviewNote || 'None'}`
    );

    res.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}.`,
      leave: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
