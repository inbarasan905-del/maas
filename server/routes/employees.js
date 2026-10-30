import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth } from './attendance.js';

const router = express.Router();

// Helper to remove password from user object
function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

// GET /api/employees
router.get('/', requireAuth, (req, res) => {
  try {
    const { department, role, search, status } = req.query;
    let users = db.getUsers();

    // If manager, filter by department unless querying self
    if (req.user.role === 'manager') {
      const managerUser = db.getUserById(req.user.id);
      users = users.filter(u => u.department === managerUser.department || u.id === req.user.id);
    }

    if (department && department !== 'All') {
      users = users.filter(u => u.department.toLowerCase() === department.toLowerCase());
    }

    if (role && role !== 'All') {
      users = users.filter(u => u.role.toLowerCase() === role.toLowerCase());
    }

    if (status && status !== 'All') {
      users = users.filter(u => u.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    }

    // Attach today's working status to each employee
    const todayAttendance = db.getAttendance().filter(a => a.date === new Date().toISOString().split('T')[0]);
    const enriched = users.map(u => {
      const att = todayAttendance.find(a => a.employeeId === u.id);
      return {
        ...sanitizeUser(u),
        todayAttendance: att ? {
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          isOnBreak: att.isOnBreak,
          status: att.status
        } : null
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      employees: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Enforce role visibility
    if (req.user.role === 'employee' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own complete profile' });
    }

    res.json({ success: true, employee: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees (Admin only)
router.post('/', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied: Only Administrators can create new employees.' });
    }

    const { name, email, phone, role, department, designation, salary, password, avatar } = req.body;

    if (!name || !email || !phone || !department || !designation) {
      return res.status(400).json({ error: 'Missing required employee fields.' });
    }

    // Check email uniqueness
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'An employee with this email address already exists.' });
    }

    // Check phone uniqueness
    if (db.getUserByPhone(phone)) {
      return res.status(400).json({ error: 'An employee with this phone number already exists.' });
    }

    const rawPassword = password || 'welcome123';
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(rawPassword, salt);

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const newEmployee = db.createUser({
      name,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      plainDemoPassword: rawPassword,
      role: role || 'employee',
      department,
      designation,
      salary: salary || '$65,000 / yr',
      avatar: defaultAvatar,
      status: 'active'
    });

    db.logAudit(req.user.name, 'CREATE_EMPLOYEE', `Created new employee profile for ${name} (${newEmployee.id}) in ${department}.`);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: sanitizeUser(newEmployee)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const targetUser = db.getUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Role checks
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Permission denied to edit this profile.' });
    }

    const allowedUpdates = {};
    const { name, phone, email, department, designation, salary, role, avatar, password } = req.body;

    if (req.user.role === 'admin') {
      if (name) allowedUpdates.name = name;
      if (email) allowedUpdates.email = email.trim().toLowerCase();
      if (phone) allowedUpdates.phone = phone.trim();
      if (department) allowedUpdates.department = department;
      if (designation) allowedUpdates.designation = designation;
      if (salary) allowedUpdates.salary = salary;
      if (role) allowedUpdates.role = role;
      if (avatar) allowedUpdates.avatar = avatar;
      if (password) {
        allowedUpdates.password = bcrypt.hashSync(password, 10);
        allowedUpdates.plainDemoPassword = password;
      }
    } else {
      // Employee self-update
      if (phone) allowedUpdates.phone = phone.trim();
      if (avatar) allowedUpdates.avatar = avatar;
      if (password) {
        allowedUpdates.password = bcrypt.hashSync(password, 10);
        allowedUpdates.plainDemoPassword = password;
      }
    }

    const updated = db.updateUser(req.params.id, allowedUpdates);
    db.logAudit(req.user.name, 'UPDATE_EMPLOYEE', `Updated profile information for ${targetUser.name} (${targetUser.id}).`);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: sanitizeUser(updated)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employees/:id (Soft delete / deactivate)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can deactivate employees.' });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own admin account.' });
    }

    const toggled = db.deleteUser(req.params.id);
    if (!toggled) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    db.logAudit(req.user.name, 'TOGGLE_STATUS', `Changed status of ${toggled.name} to ${toggled.status}.`);

    res.json({
      success: true,
      message: `Employee is now ${toggled.status}.`,
      employee: sanitizeUser(toggled)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
