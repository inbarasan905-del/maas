import { api } from '../api.js';
import { state } from '../state.js';
import { startLiveTracker, stopLiveTracker, formatTimeOnly, formatDurationHuman, formatHHMMSS } from '../timer.js';

export function renderEmployeeView() {
  const container = document.getElementById('view-content');
  const user = state.user;

  container.innerHTML = `
    <div class="employee-dashboard-layout">
      <!-- Profile Header Card -->
      <div class="card" style="margin-bottom: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}"
                 alt="${user.name}"
                 style="width: 72px; height: 72px; border-radius: var(--radius-full); object-fit: cover; border: 3px solid var(--primary); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);" />
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h2 style="font-size: 1.4rem;">${user.name}</h2>
                <span class="badge badge-role">${user.role.toUpperCase()}</span>
                <span class="badge badge-present" id="emp-live-status-badge">PRESENT</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem;">
                ${user.designation} &bull; <strong style="color: var(--text-main);">${user.department}</strong>
              </p>
              <div style="display: flex; gap: 1.25rem; font-size: 0.8rem; color: var(--text-dim); margin-top: 0.4rem; flex-wrap: wrap;">
                <span>🆔 <strong>${user.id}</strong></span>
                <span>📧 ${user.email}</span>
                <span>📱 ${user.phone}</span>
                <span>📅 Joined: ${user.joiningDate || '2023-01-01'}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-secondary btn-sm" id="btn-edit-profile">
              <i data-lucide="user" style="width: 15px; height: 15px;"></i> Edit Contact
            </button>
            <button class="btn btn-danger btn-sm" id="btn-emp-logout">
              <i data-lucide="log-out" style="width: 15px; height: 15px;"></i> End Shift & Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Hero 8-Hour Working Tracker Card -->
      <div class="hero-tracker-card">
        <svg style="position: absolute; width: 0; height: 0;">
          <defs>
            <linearGradient id="trackerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="45%" stop-color="#9333ea" />
              <stop offset="100%" stop-color="#e6007e" />
            </linearGradient>
            <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        <div class="tracker-grid">
          <!-- Circular SVG Progress Dial -->
          <div class="dial-container">
            <svg class="dial-svg" viewBox="0 0 220 220">
              <circle class="dial-bg-circle" cx="110" cy="110" r="90" />
              <circle class="dial-progress-circle" id="dial-ring" cx="110" cy="110" r="90"
                      stroke-dasharray="565.48"
                      stroke-dashoffset="565.48" />
            </svg>
            <div class="dial-center-content">
              <div class="dial-time-display" id="dial-clock-text">00:00:00</div>
              <div class="dial-label-text" id="dial-status-label">HOURS WORKED</div>
              <div class="dial-percent-badge" id="dial-percent-text">0% of 8h</div>
            </div>
          </div>

          <!-- Tracker Information & Controls -->
          <div class="tracker-details">
            <div class="tracker-status-header">
              <div>
                <h3 class="tracker-title">Daily 8-Hour Working Tracker</h3>
                <p style="color: var(--text-muted); font-size: 0.875rem;" id="tracker-subtext">
                  Session started automatically on login. Standard 8h target.
                </p>
              </div>
              <div id="tracker-state-pill">
                <span class="badge badge-inprogress" id="tracker-state-badge">🟢 Actively Working</span>
              </div>
            </div>

            <!-- Key Metrics Strip -->
            <div class="metrics-strip">
              <div class="metric-strip-item">
                <div class="metric-strip-label">Check In Time</div>
                <div class="metric-strip-value" id="metric-checkin-time">--:--</div>
              </div>
              <div class="metric-strip-item">
                <div class="metric-strip-label">Break Duration</div>
                <div class="metric-strip-value" id="metric-break-time" style="color: #fbbf24;">00:00:00</div>
              </div>
              <div class="metric-strip-item">
                <div class="metric-strip-label">Remaining to 8h</div>
                <div class="metric-strip-value" id="metric-remaining-time" style="color: #60a5fa;">8h 00m</div>
              </div>
              <div class="metric-strip-item">
                <div class="metric-strip-label">Overtime</div>
                <div class="metric-strip-value" id="metric-overtime" style="color: #34d399;">00:00:00</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                <span>Daily Completion</span>
                <span id="progress-bar-label">0% (8 Hours Target)</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar-fill" id="tracker-bar-fill" style="width: 0%;"></div>
              </div>
            </div>

            <!-- Action Buttons: Break & Check Out -->
            <div class="tracker-action-buttons">
              <button class="btn btn-warning" id="btn-toggle-break">
                <i data-lucide="coffee" style="width: 18px; height: 18px;"></i>
                <span id="btn-break-text">Take Break (Pause Work)</span>
              </button>
              <button class="btn btn-danger" id="btn-manual-checkout">
                <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
                <span>Check Out (Conclude Today)</span>
              </button>
              <button class="btn btn-primary" id="btn-manual-checkin" style="display: none;">
                <i data-lucide="play" style="width: 18px; height: 18px;"></i>
                <span>Resume / Check In</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs: Attendance History vs Leave Requests -->
      <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <button class="btn btn-secondary ${state.activeTab === 'overview' ? 'active' : ''}" id="tab-history-btn" style="border-radius: var(--radius-sm) var(--radius-sm) 0 0;">
          <i data-lucide="calendar" style="width: 16px; height: 16px;"></i> My Attendance History
        </button>
        <button class="btn btn-secondary ${state.activeTab === 'leaves' ? 'active' : ''}" id="tab-leaves-btn" style="border-radius: var(--radius-sm) var(--radius-sm) 0 0;">
          <i data-lucide="send" style="width: 16px; height: 16px;"></i> Leave Applications
        </button>
      </div>

      <!-- Tab 1: Attendance History Container -->
      <div id="emp-history-tab" style="${state.activeTab === 'overview' ? 'display: block;' : 'display: none;'}">
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title-group">
              <h3>Monthly Attendance & 8-Hour Records</h3>
              <p>Daily breakdown of check-in, check-out, breaks, and compliance.</p>
            </div>
            <div class="table-actions-group">
              <button class="btn btn-secondary btn-sm" id="btn-export-emp-csv">
                <i data-lucide="download" style="width: 15px; height: 15px;"></i> Export Records (CSV)
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Break Duration</th>
                  <th>Total Worked</th>
                  <th>8h Target Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody id="emp-history-tbody">
                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading attendance records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: Leaves Management Container -->
      <div id="emp-leaves-tab" style="${state.activeTab === 'leaves' ? 'display: block;' : 'display: none;'}">
        <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 1.5rem;">
          <!-- Apply Form -->
          <div class="card">
            <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Apply for Leave</h3>
            <form id="apply-leave-form">
              <div class="form-group">
                <label class="form-label">Leave Type</label>
                <select id="leave-type-select" class="form-control no-icon" required>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Start Date</label>
                  <input type="date" id="leave-start-date" class="form-control no-icon" required />
                </div>
                <div class="form-group">
                  <label class="form-label">End Date</label>
                  <input type="date" id="leave-end-date" class="form-control no-icon" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Reason</label>
                <textarea id="leave-reason" class="form-control no-icon" rows="3" placeholder="Brief reason for your leave application..." required></textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Submit Leave Application
              </button>
            </form>
          </div>

          <!-- My Leaves List -->
          <div class="table-card" style="margin-bottom: 0;">
            <div class="table-header-bar">
              <div class="table-title-group">
                <h3>My Leave Requests</h3>
                <p>Status of your submitted requests.</p>
              </div>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="emp-leaves-tbody">
                  <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading leave requests...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  initEmployeeDashboard();
}

async function initEmployeeDashboard() {
  const user = state.user;

  // Set default dates for leave form
  const todayIso = new Date().toISOString().split('T')[0];
  const startDateInput = document.getElementById('leave-start-date');
  const endDateInput = document.getElementById('leave-end-date');
  if (startDateInput) startDateInput.value = todayIso;
  if (endDateInput) endDateInput.value = todayIso;

  // Tab switching
  const tabHistory = document.getElementById('tab-history-btn');
  const tabLeaves = document.getElementById('tab-leaves-btn');
  const divHistory = document.getElementById('emp-history-tab');
  const divLeaves = document.getElementById('emp-leaves-tab');

  tabHistory.addEventListener('click', () => {
    state.setTab('overview');
    tabHistory.classList.add('active');
    tabLeaves.classList.remove('active');
    divHistory.style.display = 'block';
    divLeaves.style.display = 'none';
  });

  tabLeaves.addEventListener('click', () => {
    state.setTab('leaves');
    tabLeaves.classList.add('active');
    tabHistory.classList.remove('active');
    divLeaves.style.display = 'block';
    divHistory.style.display = 'none';
  });

  // Fetch today's attendance record
  await loadTodayRecord();

  // Load history & leaves
  loadAttendanceHistory();
  loadLeavesList();

  // Button handlers
  setupEmployeeActions();
}

async function loadTodayRecord() {
  try {
    const res = await api.getTodayAttendance();
    if (res.exists && res.record) {
      state.setTodayAttendance(res.record);
      bindLiveTracker(res.record);
    } else {
      // Prompt to check in
      bindEmptyTracker();
    }
  } catch (err) {
    console.error('Error fetching today record:', err);
  }
}

function bindLiveTracker(initialRecord) {
  const dialRing = document.getElementById('dial-ring');
  const dialClock = document.getElementById('dial-clock-text');
  const dialStatusLabel = document.getElementById('dial-status-label');
  const dialPercent = document.getElementById('dial-percent-text');
  const checkinTime = document.getElementById('metric-checkin-time');
  const breakTime = document.getElementById('metric-break-time');
  const remainingTime = document.getElementById('metric-remaining-time');
  const overtime = document.getElementById('metric-overtime');
  const barFill = document.getElementById('tracker-bar-fill');
  const barLabel = document.getElementById('progress-bar-label');
  const stateBadge = document.getElementById('tracker-state-badge');
  const breakBtn = document.getElementById('btn-toggle-break');
  const breakBtnText = document.getElementById('btn-break-text');
  const checkOutBtn = document.getElementById('btn-manual-checkout');
  const checkInBtn = document.getElementById('btn-manual-checkin');

  if (initialRecord.checkIn) {
    checkinTime.textContent = formatTimeOnly(initialRecord.checkIn);
  }

  // Ring circumference = 2 * PI * 90 ≈ 565.48
  const CIRCUMFERENCE = 565.48;

  startLiveTracker(
    () => state.todayAttendance || initialRecord,
    (stats, record) => {
      // Clock string
      dialClock.textContent = stats.formattedTime;
      breakTime.textContent = stats.formattedBreak;
      remainingTime.textContent = stats.formattedRemaining;
      overtime.textContent = stats.formattedOvertime;

      // Update ring offset: percent 0 -> 565.48, percent 100 -> 0
      const offset = CIRCUMFERENCE - (stats.percent / 100) * CIRCUMFERENCE;
      dialRing.style.strokeDashoffset = Math.max(0, offset);

      // Percentage and progress bar
      dialPercent.textContent = `${stats.percent}% of 8h`;
      barFill.style.width = `${stats.percent}%`;
      barLabel.textContent = `${stats.percent}% Completed (${stats.formattedTime} / 8h)`;

      // Handle UI depending on state: On Break / Active / Checked Out
      if (record.checkOut) {
        stateBadge.className = 'badge badge-completed';
        stateBadge.textContent = '🏁 Shift Concluded';
        dialStatusLabel.textContent = 'FINAL COMPLETED';
        breakBtn.style.display = 'none';
        checkOutBtn.style.display = 'none';
        checkInBtn.style.display = 'inline-flex';
        checkInBtn.innerHTML = '<i data-lucide="play" style="width: 16px;"></i> Resume Shift';
      } else if (record.isOnBreak) {
        stateBadge.className = 'badge badge-break';
        stateBadge.textContent = '⏸️ On Break';
        dialStatusLabel.textContent = 'WORK PAUSED';
        dialRing.style.stroke = 'url(#breakGrad)';
        breakBtn.className = 'btn btn-success';
        breakBtnText.textContent = 'Resume Work';
        breakBtn.style.display = 'inline-flex';
        checkOutBtn.style.display = 'inline-flex';
        checkInBtn.style.display = 'none';
      } else {
        stateBadge.className = stats.isOvertime ? 'badge badge-approved' : 'badge badge-inprogress';
        stateBadge.textContent = stats.isOvertime ? '⭐ Overtime Active' : '🟢 Actively Working';
        dialStatusLabel.textContent = 'HOURS WORKED';
        dialRing.style.stroke = 'url(#trackerGrad)';
        breakBtn.className = 'btn btn-warning';
        breakBtnText.textContent = 'Take Break';
        breakBtn.style.display = 'inline-flex';
        checkOutBtn.style.display = 'inline-flex';
        checkInBtn.style.display = 'none';
      }
    }
  );
}

function bindEmptyTracker() {
  const dialClock = document.getElementById('dial-clock-text');
  const stateBadge = document.getElementById('tracker-state-badge');
  const breakBtn = document.getElementById('btn-toggle-break');
  const checkOutBtn = document.getElementById('btn-manual-checkout');
  const checkInBtn = document.getElementById('btn-manual-checkin');

  dialClock.textContent = '00:00:00';
  stateBadge.className = 'badge badge-absent';
  stateBadge.textContent = '⏳ Not Checked In';
  breakBtn.style.display = 'none';
  checkOutBtn.style.display = 'none';
  checkInBtn.style.display = 'inline-flex';
  checkInBtn.innerHTML = '<i data-lucide="play" style="width: 16px;"></i> Check In Now';
}

function setupEmployeeActions() {
  // Break Toggle
  document.getElementById('btn-toggle-break').addEventListener('click', async () => {
    const record = state.todayAttendance;
    try {
      if (record && record.isOnBreak) {
        const res = await api.endBreak();
        state.setTodayAttendance(res.record);
        window.showToast('Welcome back! Work timer resumed.', 'success');
      } else {
        const res = await api.startBreak();
        state.setTodayAttendance(res.record);
        window.showToast('Break started. 8h work timer paused.', 'info');
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // Check Out
  document.getElementById('btn-manual-checkout').addEventListener('click', async () => {
    if (!confirm('Are you ready to check out and finalize your working hours for today?')) {
      return;
    }
    try {
      const res = await api.checkOut();
      state.setTodayAttendance(res.record);
      window.showToast('You have checked out successfully! Working hours recorded.', 'success');
      loadAttendanceHistory();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // Check In
  document.getElementById('btn-manual-checkin').addEventListener('click', async () => {
    try {
      const res = await api.checkIn();
      state.setTodayAttendance(res.record);
      bindLiveTracker(res.record);
      window.showToast('Checked in! 8-hour work tracking is running.', 'success');
      loadAttendanceHistory();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // Apply Leave Form
  document.getElementById('apply-leave-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const leaveType = document.getElementById('leave-type-select').value;
    const startDate = document.getElementById('leave-start-date').value;
    const endDate = document.getElementById('leave-end-date').value;
    const reason = document.getElementById('leave-reason').value;

    try {
      await api.applyLeave({ leaveType, startDate, endDate, reason });
      window.showToast('Leave application submitted successfully!', 'success');
      document.getElementById('leave-reason').value = '';
      loadLeavesList();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  // Logout button
  document.getElementById('btn-emp-logout').addEventListener('click', async () => {
    stopLiveTracker();
    try {
      await api.logout(state.user.id);
    } catch (e) {}
    api.setToken(null);
    state.setUser(null);
    state.setView('login');
    window.showToast('Logged out. Your working hours for today have been finalized.', 'info');
  });

  // Export CSV
  document.getElementById('btn-export-emp-csv').addEventListener('click', async () => {
    try {
      window.showToast('Generating your MAAS attendance CSV...', 'info');
      await api.downloadAttendanceCsv();
      window.showToast('Your attendance CSV downloaded successfully!', 'success');
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
}

async function loadAttendanceHistory() {
  const tbody = document.getElementById('emp-history-tbody');
  try {
    const res = await api.getAttendanceHistory({ employeeId: state.user.id });
    if (!res.records || res.records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No historical records found.</td></tr>';
      return;
    }

    tbody.innerHTML = res.records.map(r => {
      const live = r.liveStats || {};
      const workedHrs = (live.netWorkedSeconds / 3600).toFixed(2);
      const breakMins = Math.round((live.totalBreakSeconds || 0) / 60);
      const isCompleted = r.status === 'Completed' || live.netWorkedSeconds >= 28800;

      let badgeClass = 'badge-inprogress';
      if (isCompleted) badgeClass = 'badge-completed';
      if (r.status === 'Short Hours') badgeClass = 'badge-shorthours';

      return `
        <tr>
          <td><strong>${r.date}</strong></td>
          <td>${formatTimeOnly(r.checkIn)}</td>
          <td>${r.checkOut ? formatTimeOnly(r.checkOut) : '<span style="color: #fbbf24;">In Progress</span>'}</td>
          <td>${breakMins} mins</td>
          <td><strong style="color: #38bdf8;">${workedHrs} hrs</strong></td>
          <td><span class="badge ${badgeClass}">${r.status}</span></td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${r.note || '-'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #f87171; text-align: center;">Error loading history: ${err.message}</td></tr>`;
  }
}

async function loadLeavesList() {
  const tbody = document.getElementById('emp-leaves-tbody');
  try {
    const res = await api.getLeaves();
    if (!res.leaves || res.leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No leave requests found.</td></tr>';
      return;
    }

    tbody.innerHTML = res.leaves.map(l => {
      let badge = 'badge-pending';
      if (l.status === 'Approved') badge = 'badge-approved';
      if (l.status === 'Rejected') badge = 'badge-rejected';

      return `
        <tr>
          <td><strong>${l.leaveType}</strong></td>
          <td style="font-size: 0.825rem;">${l.startDate} &rarr; ${l.endDate}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${l.reason}</td>
          <td><span class="badge ${badge}">${l.status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color: #f87171; text-align: center;">Error: ${err.message}</td></tr>`;
  }
}
