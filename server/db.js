import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_FILE_PATH } from './config.js';
import { getSeedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolvedDbPath = path.resolve(__dirname, '..', DB_FILE_PATH);

class Database {
  constructor() {
    this.path = resolvedDbPath;
    this.data = null;
    this.init();
  }

  init() {
    const dir = path.dirname(this.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.path)) {
      const seed = getSeedData();
      this.data = seed;
      this.persist();
      console.log(`[DB] Database initialized and seeded at: ${this.path}`);
    } else {
      try {
        const raw = fs.readFileSync(this.path, 'utf8');
        this.data = JSON.parse(raw);
        console.log(`[DB] Database loaded from: ${this.path}`);
      } catch (err) {
        console.error('[DB] Error parsing existing db, re-seeding:', err.message);
        this.data = getSeedData();
        this.persist();
      }
    }
  }

  persist() {
    try {
      const tempPath = `${this.path}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.path);
    } catch (err) {
      console.error('[DB] Error persisting database:', err);
    }
  }

  // --- Users ---
  getUsers() {
    return this.data.users || [];
  }

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
  }

  getUserByPhone(phone) {
    if (!phone) return null;
    // Normalize phone numbers by removing spaces, dashes, parentheses
    const cleanInput = phone.replace(/[\s\-\(\)]/g, '');
    return this.getUsers().find(u => u.phone.replace(/[\s\-\(\)]/g, '') === cleanInput);
  }

  getUserByEmailOrPhone(identifier) {
    if (!identifier) return null;
    return this.getUserByEmail(identifier) || this.getUserByPhone(identifier);
  }

  createUser(userData) {
    const id = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id,
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      ...userData
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  deleteUser(id) {
    const user = this.getUserById(id);
    if (!user) return false;
    // Soft delete: toggle to inactive
    user.status = user.status === 'active' ? 'inactive' : 'active';
    this.persist();
    return user;
  }

  // --- Attendance & Working Hours ---
  getAttendance() {
    return this.data.attendance || [];
  }

  getTodayAttendanceRecord(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendance().find(a => a.employeeId === employeeId && a.date === today);
  }

  upsertAttendance(record) {
    const idx = this.data.attendance.findIndex(a => a.id === record.id);
    if (idx === -1) {
      this.data.attendance.push(record);
    } else {
      this.data.attendance[idx] = record;
    }
    this.persist();
    return record;
  }

  // --- Leaves ---
  getLeaves() {
    return this.data.leaves || [];
  }

  createLeave(leaveData) {
    const id = `LV-${Math.floor(100 + Math.random() * 900)}`;
    const newLeave = {
      id,
      appliedAt: new Date().toISOString(),
      status: 'Pending',
      reviewedBy: null,
      reviewNote: null,
      ...leaveData
    };
    this.data.leaves.unshift(newLeave);
    this.persist();
    return newLeave;
  }

  updateLeaveStatus(id, status, reviewedBy, reviewNote = '') {
    const idx = this.data.leaves.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.leaves[idx].status = status;
    this.data.leaves[idx].reviewedBy = reviewedBy;
    this.data.leaves[idx].reviewNote = reviewNote;
    this.data.leaves[idx].reviewedAt = new Date().toISOString();
    this.persist();
    return this.data.leaves[idx];
  }

  // --- Audit Logs ---
  getAuditLogs() {
    return this.data.auditLogs || [];
  }

  logAudit(user, action, details) {
    const log = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    };
    this.data.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.persist();
    return log;
  }
}

export const db = new Database();
