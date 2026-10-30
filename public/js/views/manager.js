import { api } from '../api.js';
import { state } from '../state.js';
import { formatTimeOnly } from '../timer.js';

export function renderManagerView() {
  const container = document.getElementById('view-content');
  const user = state.user;
  if (!user) {
    state.setView('login');
    return;
  }

  container.innerHTML = `
    <div class="manager-dashboard-layout">
      <!-- Title & Department Badge -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 1.6rem; font-weight: 800;">Department Lead Dashboard</h1>
            <span class="badge badge-role" style="font-size: 0.8rem;">${user.department.toUpperCase()} TEAM</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Overseeing ${user.department} team members, 8-hour shift compliance, and department leave approvals.
          </p>
        </div>
        <div>
          <button class="btn btn-secondary" id="btn-export-mgr-csv">
            <i data-lucide="download" style="width: 16px; height: 16px;"></i> Export Team CSV
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards for Department -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-blue">
            <i data-lucide="users"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="mgr-kpi-total">--</span>
            <span class="kpi-title">Team Members</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-green">
            <i data-lucide="user-check"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="mgr-kpi-present" style="color: #34d399;">--</span>
            <span class="kpi-title">Present Today</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-yellow">
            <i data-lucide="activity"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="mgr-kpi-working" style="color: #fbbf24;">--</span>
            <span class="kpi-title">Currently Working</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-purple">
            <i data-lucide="calendar"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-value" id="mgr-kpi-leave" style="color: #c084fc;">--</span>
            <span class="kpi-title">On Approved Leave</span>
          </div>
        </div>
      </div>

      <!-- Live Team Working Sessions -->
      <div class="table-card">
        <div class="table-header-bar">
          <div class="table-title-group">
            <h3>Active ${user.department} Team Members</h3>
            <p>Live real-time 8-hour progress for your direct reports.</p>
          </div>
          <span class="badge badge-active">🟢 Active Tracking</span>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Check In</th>
                <th>Break Taken</th>
                <th>Hours Worked</th>
                <th>8-Hour Target</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody id="mgr-live-sessions-tbody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading team sessions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Team Leave Approvals -->
      <div class="table-card">
        <div class="table-header-bar">
          <div class="table-title-group">
            <h3>Pending ${user.department} Leave Requests</h3>
            <p>Review and grant approval for requested time off.</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="mgr-leaves-tbody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading team leaves...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  initManagerDashboard();
}

async function initManagerDashboard() {
  await loadManagerStats();
  await loadManagerTeamSessions();
  await loadManagerLeaves();

  document.getElementById('btn-export-mgr-csv').addEventListener('click', async () => {
    try {
      window.showToast('Generating MAAS team attendance CSV...', 'info');
      await api.downloadAttendanceCsv();
      window.showToast('Team CSV downloaded successfully!', 'success');
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
}

async function loadManagerStats() {
  try {
    const res = await api.getDashboardStats();
    const stats = res.stats;
    document.getElementById('mgr-kpi-total').textContent = stats.totalEmployees;
    document.getElementById('mgr-kpi-present').textContent = stats.presentToday;
    document.getElementById('mgr-kpi-working').textContent = stats.currentlyWorking;
    document.getElementById('mgr-kpi-leave').textContent = stats.onLeave;
  } catch (err) {
    console.error('Error loading manager stats:', err);
  }
}

async function loadManagerTeamSessions() {
  const tbody = document.getElementById('mgr-live-sessions-tbody');
  const user = state.user;

  try {
    const res = await api.getActiveSessions();
    const teamSessions = (res.sessions || []).filter(s => s.department === user.department);

    if (teamSessions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No team members are currently logged in.</td></tr>';
      return;
    }

    tbody.innerHTML = teamSessions.map(s => {
      const stats = s.liveStats || {};
      const workedHrs = (stats.netWorkedSeconds / 3600).toFixed(2);
      const breakMins = Math.round((stats.totalBreakSeconds || 0) / 60);

      let statusBadge = `<span class="badge badge-inprogress">🟢 Working</span>`;
      if (s.isOnBreak) statusBadge = `<span class="badge badge-break">⏸️ On Break</span>`;
      if (s.checkOut) statusBadge = `<span class="badge badge-completed">🏁 Completed</span>`;

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
          <td>${formatTimeOnly(s.checkIn)}</td>
          <td>${breakMins} mins</td>
          <td><strong style="color: #38bdf8;">${workedHrs} hrs</strong></td>
          <td style="min-width: 140px;">
            <div style="font-size: 0.75rem; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>${stats.percentCompleted || 0}%</span>
              <span>8h goal</span>
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
    tbody.innerHTML = `<tr><td colspan="6" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}

async function loadManagerLeaves() {
  const tbody = document.getElementById('mgr-leaves-tbody');
  const user = state.user;

  try {
    const res = await api.getLeaves();
    const teamLeaves = (res.leaves || []).filter(l => l.department === user.department);

    if (teamLeaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No leave requests found for your department.</td></tr>';
      return;
    }

    tbody.innerHTML = teamLeaves.map(l => {
      let badge = 'badge-pending';
      if (l.status === 'Approved') badge = 'badge-approved';
      if (l.status === 'Rejected') badge = 'badge-rejected';

      const actions = l.status === 'Pending' ? `
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-success btn-sm" onclick="window.mgrReviewLeave('${l.id}', 'Approved')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="window.mgrReviewLeave('${l.id}', 'Rejected')">Reject</button>
        </div>
      ` : `<span style="font-size: 0.8rem; color: var(--text-dim);">${l.status} by ${l.reviewedBy || 'Manager'}</span>`;

      return `
        <tr>
          <td>
            <strong>${l.employeeName}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${l.employeeId}</div>
          </td>
          <td><span class="badge badge-role">${l.leaveType}</span></td>
          <td style="font-size: 0.85rem;">${l.startDate} &rarr; ${l.endDate}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${l.reason}</td>
          <td><span class="badge ${badge}">${l.status}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');

    window.mgrReviewLeave = async (leaveId, status) => {
      const note = prompt(`Enter note for ${status.toLowerCase()} this leave:`);
      try {
        await api.updateLeaveStatus(leaveId, status, note || '');
        window.showToast(`Leave request ${status.toLowerCase()}!`, 'success');
        loadManagerLeaves();
        loadManagerStats();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    };
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}
