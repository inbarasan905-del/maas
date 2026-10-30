// API Client for Employee Management & Attendance System

class ApiClient {
  constructor() {
    this.baseUrl = '/api';
  }

  getToken() {
    return localStorage.getItem('emp_mgmt_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('emp_mgmt_token', token);
    } else {
      localStorage.removeItem('emp_mgmt_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.setToken(null);
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Auth Endpoints ---
  login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  }

  logout(userId) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  forgotPassword(identifier) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    });
  }

  verifyOtp(identifier, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp })
    });
  }

  resetPassword(identifier, otp, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, newPassword })
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // --- Attendance Endpoints ---
  getTodayAttendance(employeeId) {
    const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    return this.request(`/attendance/today${query}`);
  }

  checkIn() {
    return this.request('/attendance/checkin', { method: 'POST' });
  }

  checkOut() {
    return this.request('/attendance/checkout', { method: 'POST' });
  }

  startBreak() {
    return this.request('/attendance/break/start', { method: 'POST' });
  }

  endBreak() {
    return this.request('/attendance/break/end', { method: 'POST' });
  }

  getActiveSessions() {
    return this.request('/attendance/active-sessions');
  }

  getAttendanceHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/attendance/history?${query}`);
  }

  // --- Employee Endpoints ---
  getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/employees?${query}`);
  }

  getEmployee(id) {
    return this.request(`/employees/${encodeURIComponent(id)}`);
  }

  createEmployee(data) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateEmployee(id, data) {
    return this.request(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  toggleEmployeeActive(id) {
    return this.request(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }

  // --- Leaves Endpoints ---
  getLeaves() {
    return this.request('/leaves');
  }

  applyLeave(data) {
    return this.request('/leaves', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateLeaveStatus(id, status, reviewNote) {
    return this.request(`/leaves/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewNote })
    });
  }

  // --- Reports & Stats ---
  getDashboardStats() {
    return this.request('/reports/dashboard-stats');
  }

  getAuditLogs() {
    return this.request('/reports/audit-logs');
  }

  getExportCsvUrl() {
    const token = this.getToken();
    return `/api/reports/export-csv?token=${encodeURIComponent(token)}`;
  }

  async downloadAttendanceCsv() {
    const token = this.getToken();
    if (!token) {
      throw new Error('You must be signed in to download attendance reports.');
    }

    const response = await fetch(`${this.baseUrl}/reports/export-csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errMsg = 'Failed to download attendance CSV';
      try {
        const err = await response.json();
        if (err.error) errMsg = err.error;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAAS_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      window.URL.revokeObjectURL(url);
    }, 200);
  }
}

export const api = new ApiClient();
