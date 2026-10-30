import { api } from '../api.js';
import { state } from '../state.js';
import { formatTimeOnly } from '../timer.js';

export function renderAdminView() {
  const container = document.getElementById('view-content');
  const user = state.user;
  if (!user) {
    state.setView('login');
    return;
  }

  container.innerHTML = `
    <div class="admin-dashboard-layout">
      <!-- Top Title & Quick Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
            <h1 style="font-size: 1.6rem; font-weight: 800;">MAAS Admin Operations Hub</h1>
            <span class="badge badge-maas">MAAS GROUP OF COMPANIES</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Real-time workforce monitoring, 8-hour shift compliance, employee directory, and leaves.
          </p>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="btn-open-add-emp-modal">
            <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i> Add New Employee
          </button>
          <button class="btn btn-secondary" id="btn-export-admin-csv">
            <i data-lucide="file-spreadsheet" style="width: 16px; height: 16px;"></i> Export Attendance CSV
          </button>
          <button class="btn btn-secondary" id="btn-print-report" onclick="window.print()">
            <i data-lucide="printer" style="width: 16px; height: 16px;"></i> Print Report
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards (MAAS Pink & Blue Palette) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-pink">
            <i data-lucide="users"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="kpi-total-emp">--</span>
            <span class="kpi-title">Total Employees</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-green">
            <i data-lucide="user-check"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="kpi-present-today" style="color: #34d399;">--</span>
            <span class="kpi-title">Present Today</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-blue">
            <i data-lucide="activity"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="kpi-currently-working" style="color: #60a5fa;">--</span>
            <span class="kpi-title">Currently Working</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-red">
            <i data-lucide="user-x"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="kpi-absent-today" style="color: #f87171;">--</span>
            <span class="kpi-title">Absent Today</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-purple">
            <i data-lucide="calendar"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="kpi-on-leave" style="color: #c084fc;">--</span>
            <span class="kpi-title">On Leave</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box" style="background: rgba(230, 0, 126, 0.15); color: #f43f5e;">
            <i data-lucide="clock"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">8 Hours</span>
            <span class="kpi-title">Required Working Hours</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs for Admin Sections -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; overflow-x: auto;">
        <button class="btn btn-secondary active" id="admin-tab-live">
          <i data-lucide="radio" style="width: 15px; height: 15px;"></i> Live Working Sessions
        </button>
        <button class="btn btn-secondary" id="admin-tab-directory">
          <i data-lucide="users" style="width: 15px; height: 15px;"></i> Employee Directory
        </button>
        <button class="btn btn-secondary" id="admin-tab-leaves">
          <i data-lucide="file-check" style="width: 15px; height: 15px;"></i> Leave Requests
        </button>
        <button class="btn btn-secondary" id="admin-tab-attendance">
          <i data-lucide="bar-chart-3" style="width: 15px; height: 15px;"></i> Attendance Reports
        </button>
        <button class="btn btn-secondary" id="admin-tab-audit">
          <i data-lucide="shield" style="width: 15px; height: 15px;"></i> Activity Logs
        </button>
      </div>

      <!-- Section 1: Live Working Sessions Table -->
      <div id="section-live-sessions" class="admin-tab-content">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>Live Employee Working Sessions</h3>
              <p>Employees currently clocked in with real-time 8-hour progress.</p>
            </div>
            <div class="table-actions-group">
              <span class="badge badge-active" style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block; animation: pulse 1.5s infinite;"></span>
                LIVE UPDATES
              </span>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In Time</th>
                  <th>Break Taken</th>
                  <th>Net Worked Time</th>
                  <th>Progress towards 8h</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="admin-live-sessions-tbody">
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading live active sessions...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Section 2: Employee Directory -->
      <div id="section-employee-directory" class="admin-tab-content" style="display: none;">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>Employee Directory & Permissions</h3>
              <p>Manage employee records, roles, departments, and credentials.</p>
            </div>
            <div class="table-actions-group">
              <div class="search-input-box">
                <input type="text" id="employee-search-input" class="form-control" placeholder="Search by name, ID, phone..." />
              </div>
              <select id="filter-dept-select" class="form-control no-icon" style="width: auto;">
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department & Designation</th>
                  <th>Contact Info</th>
                  <th>Salary</th>
                  <th>Today's Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="admin-directory-tbody">
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading directory...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Section 3: Leave Management -->
      <div id="section-leave-management" class="admin-tab-content" style="display: none;">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>Employee Leave Requests</h3>
              <p>Review, approve, or reject employee leave applications.</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="admin-leaves-tbody">
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading leaves...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Section 4: Full Attendance Reports -->
      <div id="section-attendance-reports" class="admin-tab-content" style="display: none;">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>Complete Attendance & 8-Hour Work History</h3>
              <p>Organization-wide logs and compliance verification.</p>
            </div>
            <div class="table-actions-group">
              <input type="date" id="filter-attendance-date" class="form-control no-icon" style="width: auto;" />
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Breaks</th>
                  <th>Total Worked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="admin-reports-tbody">
                <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Section 5: Activity Logs -->
      <div id="section-activity-logs" class="admin-tab-content" style="display: none;">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>System Security & Audit Log</h3>
              <p>Chronological record of logins, auto check-in/outs, and administrative actions.</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="admin-audit-tbody">
                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading audit logs...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Employee Modal -->
    <div class="modal-backdrop" id="add-employee-modal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Add New Employee</h3>
          <button type="button" class="modal-close-btn" id="close-add-emp-modal">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        <form id="add-employee-form">
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" id="add-emp-name" class="form-control no-icon" placeholder="e.g. John Doe" required />
              </div>
              <div class="form-group">
                <label class="form-label">Role *</label>
                <select id="add-emp-role" class="form-control no-icon" required>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="add-emp-email" class="form-control no-icon" placeholder="john@company.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="add-emp-phone" class="form-control no-icon" placeholder="+1 555-0199" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Department *</label>
                <select id="add-emp-dept" class="form-control no-icon" required>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Designation *</label>
                <input type="text" id="add-emp-designation" class="form-control no-icon" placeholder="e.g. Software Engineer" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Salary / Rate</label>
                <input type="text" id="add-emp-salary" class="form-control no-icon" placeholder="$75,000 / yr" />
              </div>
              <div class="form-group">
                <label class="form-label">Initial Password</label>
                <input type="password" id="add-emp-pwd" class="form-control no-icon" placeholder="Default: welcome123" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancel-add-emp-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Employee</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  initAdminDashboard();
}

async function initAdminDashboard() {
  setupAdminTabs();
  setupAddEmployeeModal();
  setupFilters();

  await loadKpiStats();
  await loadLiveActiveSessions();
  loadDirectory();
  loadLeaves();
  loadAttendanceReports();
  loadAuditLogs();

  // Polling for live session updates every 15s
  setInterval(() => {
    if (state.currentView === 'admin') {
      loadLiveActiveSessions();
    }
  }, 15000);
}

function setupAdminTabs() {
  const tabs = [
    { btn: 'admin-tab-live', content: 'section-live-sessions' },
    { btn: 'admin-tab-directory', content: 'section-employee-directory' },
    { btn: 'admin-tab-leaves', content: 'section-leave-management' },
    { btn: 'admin-tab-attendance', content: 'section-attendance-reports' },
    { btn: 'admin-tab-audit', content: 'section-activity-logs' }
  ];

  tabs.forEach(t => {
    const btnEl = document.getElementById(t.btn);
    btnEl.addEventListener('click', () => {
      tabs.forEach(other => {
        document.getElementById(other.btn).classList.remove('active');
        document.getElementById(other.content).style.display = 'none';
      });
      btnEl.classList.add('active');
      document.getElementById(t.content).style.display = 'block';
    });
  });

  // Export CSV
  document.getElementById('btn-export-admin-csv').addEventListener('click', async () => {
    try {
      window.showToast('Generating MAAS attendance CSV...', 'info');
      await api.downloadAttendanceCsv();
      window.showToast('MAAS Attendance CSV downloaded successfully!', 'success');
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
}

async function loadKpiStats() {
  try {
    const res = await api.getDashboardStats();
    const stats = res.stats;
    document.getElementById('kpi-total-emp').textContent = stats.totalEmployees;
    document.getElementById('kpi-present-today').textContent = stats.presentToday;
    document.getElementById('kpi-currently-working').textContent = stats.currentlyWorking;
    document.getElementById('kpi-absent-today').textContent = stats.absentToday;
    document.getElementById('kpi-on-leave').textContent = stats.onLeave;
  } catch (err) {
    console.error('Error loading KPI stats:', err);
  }
}

async function loadLiveActiveSessions() {
  const tbody = document.getElementById('admin-live-sessions-tbody');
  try {
    const res = await api.getActiveSessions();
    if (!res.sessions || res.sessions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No employees are currently logged in today.</td></tr>';
      return;
    }

    tbody.innerHTML = res.sessions.map(s => {
      const stats = s.liveStats || {};
      const workedHrs = (stats.netWorkedSeconds / 3600).toFixed(2);
      const breakMins = Math.round((stats.totalBreakSeconds || 0) / 60);

      let statusBadge = `<span class="badge badge-inprogress">🟢 Working</span>`;
      if (s.isOnBreak) {
        statusBadge = `<span class="badge badge-break">⏸️ On Break</span>`;
      } else if (s.checkOut) {
        statusBadge = `<span class="badge badge-completed">🏁 Checked Out</span>`;
      }

      return `
        <tr>
          <td>
            <div class="employee-cell">
              <img src="${s.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="employee-avatar-sm" />
              <div>
                <div class="employee-name-bold">${s.employeeName}</div>
                <div class="employee-id-sub">${s.employeeId} &bull; ${s.userDesignation}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-role">${s.department}</span></td>
          <td>${formatTimeOnly(s.checkIn)}</td>
          <td>${breakMins} mins</td>
          <td><strong style="color: #38bdf8;">${workedHrs} hrs</strong></td>
          <td style="min-width: 140px;">
            <div style="font-size: 0.75rem; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>${stats.percentCompleted || 0}%</span>
              <span>8h target</span>
            </div>
            <div class="progress-container" style="margin-top: 0;">
              <div class="progress-bar-fill" style="width: ${stats.percentCompleted || 0}%;"></div>
            </div>
          </td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #f87171; text-align: center;">Error loading sessions: ${err.message}</td></tr>`;
  }
}

async function loadDirectory(searchTerm = '', department = 'All') {
  const tbody = document.getElementById('admin-directory-tbody');
  try {
    const res = await api.getEmployees({ search: searchTerm, department });
    if (!res.employees || res.employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No employees found.</td></tr>';
      return;
    }

    tbody.innerHTML = res.employees.map(u => {
      const att = u.todayAttendance;
      let statusBadge = '<span class="badge badge-absent">Absent</span>';
      if (att && att.checkIn) {
        statusBadge = att.isOnBreak 
          ? '<span class="badge badge-break">On Break</span>' 
          : '<span class="badge badge-present">Present</span>';
      }

      return `
        <tr>
          <td>
            <div class="employee-cell">
              <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="employee-avatar-sm" />
              <div>
                <div class="employee-name-bold">${u.name}</div>
                <div class="employee-id-sub">${u.id}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-role">${u.role.toUpperCase()}</span></td>
          <td>
            <strong>${u.department}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${u.designation}</div>
          </td>
          <td style="font-size: 0.85rem;">
            <div>📧 ${u.email}</div>
            <div style="color: var(--text-muted);">📱 ${u.phone}</div>
          </td>
          <td><strong style="color: #34d399;">${u.salary || '$70,000'}</strong></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.toggleUserStatus('${u.id}')" title="Toggle active status">
              ${u.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #f87171; text-align: center;">Error loading directory: ${err.message}</td></tr>`;
  }
}

async function loadLeaves() {
  const tbody = document.getElementById('admin-leaves-tbody');
  try {
    const res = await api.getLeaves();
    if (!res.leaves || res.leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No leave requests pending.</td></tr>';
      return;
    }

    tbody.innerHTML = res.leaves.map(l => {
      let badge = 'badge-pending';
      if (l.status === 'Approved') badge = 'badge-approved';
      if (l.status === 'Rejected') badge = 'badge-rejected';

      const actionButtons = l.status === 'Pending' ? `
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-success btn-sm" onclick="window.reviewLeave('${l.id}', 'Approved')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="window.reviewLeave('${l.id}', 'Rejected')">Reject</button>
        </div>
      ` : `<span style="font-size: 0.75rem; color: var(--text-dim);">${l.reviewedAt ? new Date(l.reviewedAt).toLocaleDateString() : 'Reviewed'}</span>`;

      return `
        <tr>
          <td>
            <strong>${l.employeeName}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${l.department} &bull; ${l.employeeId}</div>
          </td>
          <td><span class="badge badge-role">${l.leaveType}</span></td>
          <td style="font-size: 0.85rem;">${l.startDate} &rarr; ${l.endDate}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 200px;">${l.reason}</td>
          <td><span class="badge ${badge}">${l.status}</span></td>
          <td style="font-size: 0.8rem; color: var(--text-dim);">${l.reviewedBy || '-'}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAttendanceReports(selectedDate = '') {
  const tbody = document.getElementById('admin-reports-tbody');
  try {
    const res = await api.getAttendanceHistory(selectedDate ? { date: selectedDate } : {});
    if (!res.records || res.records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No attendance logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = res.records.map(r => {
      const live = r.liveStats || {};
      const workedHrs = (live.netWorkedSeconds / 3600).toFixed(2);
      const breakMins = Math.round((live.totalBreakSeconds || 0) / 60);

      let badge = 'badge-inprogress';
      if (r.status === 'Completed' || live.netWorkedSeconds >= 28800) badge = 'badge-completed';
      if (r.status === 'Short Hours') badge = 'badge-shorthours';

      return `
        <tr>
          <td><strong>${r.date}</strong></td>
          <td>
            <strong>${r.employeeName}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${r.employeeId}</div>
          </td>
          <td><span class="badge badge-role">${r.department}</span></td>
          <td>${formatTimeOnly(r.checkIn)}</td>
          <td>${r.checkOut ? formatTimeOnly(r.checkOut) : '<span style="color: #fbbf24;">In Progress</span>'}</td>
          <td>${breakMins} mins</td>
          <td><strong style="color: #38bdf8;">${workedHrs} hrs</strong></td>
          <td><span class="badge ${badge}">${r.status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadAuditLogs() {
  const tbody = document.getElementById('admin-audit-tbody');
  try {
    const res = await api.getAuditLogs();
    if (!res.logs || res.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No audit logs.</td></tr>';
      return;
    }

    tbody.innerHTML = res.logs.map(log => {
      return `
        <tr>
          <td style="font-size: 0.8rem; color: var(--text-dim); white-space: nowrap;">
            ${new Date(log.timestamp).toLocaleString()}
          </td>
          <td><strong>${log.user}</strong></td>
          <td><span class="badge badge-role">${log.action}</span></td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${log.details}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

function setupAddEmployeeModal() {
  const modal = document.getElementById('add-employee-modal');
  const openBtn = document.getElementById('btn-open-add-emp-modal');
  const closeBtn = document.getElementById('close-add-emp-modal');
  const cancelBtn = document.getElementById('cancel-add-emp-btn');
  const form = document.getElementById('add-employee-form');

  openBtn.addEventListener('click', () => modal.classList.add('show'));
  const close = () => modal.classList.remove('show');
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('add-emp-name').value.trim(),
      role: document.getElementById('add-emp-role').value,
      email: document.getElementById('add-emp-email').value.trim(),
      phone: document.getElementById('add-emp-phone').value.trim(),
      department: document.getElementById('add-emp-dept').value,
      designation: document.getElementById('add-emp-designation').value.trim(),
      salary: document.getElementById('add-emp-salary').value.trim() || '$70,000 / yr',
      password: document.getElementById('add-emp-pwd').value || 'welcome123'
    };

    try {
      await api.createEmployee(data);
      window.showToast(`Employee ${data.name} added successfully!`, 'success');
      close();
      form.reset();
      loadDirectory();
      loadKpiStats();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
}

function setupFilters() {
  const searchInput = document.getElementById('employee-search-input');
  const deptSelect = document.getElementById('filter-dept-select');
  const dateInput = document.getElementById('filter-attendance-date');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadDirectory(searchInput.value.trim(), deptSelect.value);
    }, 300);
  });

  deptSelect.addEventListener('change', () => {
    loadDirectory(searchInput.value.trim(), deptSelect.value);
  });

  if (dateInput) {
    dateInput.addEventListener('change', () => {
      loadAttendanceReports(dateInput.value);
    });
  }

  // Global window helpers for table action buttons
  window.reviewLeave = async (leaveId, status) => {
    const note = prompt(`Enter optional review note for ${status.toLowerCase()} this leave:`);
    try {
      await api.updateLeaveStatus(leaveId, status, note || '');
      window.showToast(`Leave request marked as ${status}.`, 'success');
      loadLeaves();
      loadKpiStats();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  };

  window.toggleUserStatus = async (userId) => {
    if (!confirm('Are you sure you want to change this employee status?')) return;
    try {
      const res = await api.toggleEmployeeActive(userId);
      window.showToast(res.message, 'info');
      loadDirectory();
      loadKpiStats();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  };
}
