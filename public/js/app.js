import { api } from './api.js';
import { state } from './state.js';
import { renderLoginView } from './views/login.js';
import { renderAdminView } from './views/admin.js';
import { renderManagerView } from './views/manager.js';
import { renderEmployeeView } from './views/employee.js';
import { stopLiveTracker } from './timer.js';

// Global Toast Notification Helper
window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
};

// Theme switcher (Dark / Light)
function setupTheme() {
  const themeToggle = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('emp_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('emp_theme', next);
      updateThemeIcon(next);
    });
    updateThemeIcon(savedTheme);
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  toggleBtn.innerHTML = theme === 'dark'
    ? '<i data-lucide="sun" style="width: 18px; height: 18px;"></i>'
    : '<i data-lucide="moon" style="width: 18px; height: 18px;"></i>';
  if (window.lucide) window.lucide.createIcons();
}

// Main View Router
function renderCurrentView() {
  const sidebar = document.getElementById('sidebar-container');
  const topbar = document.getElementById('topbar-container');
  const bottomNav = document.getElementById('mobile-bottom-nav');

  if (state.currentView === 'login') {
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    renderLoginView();
  } else {
    if (sidebar) sidebar.style.display = 'flex';
    if (topbar) topbar.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = 'flex';
    renderSidebar();
    renderTopbar();
    renderMobileBottomNav();

    if (state.currentView === 'admin') {
      renderAdminView();
    } else if (state.currentView === 'manager') {
      renderManagerView();
    } else {
      renderEmployeeView();
    }
  }
}

function renderSidebar() {
  const user = state.user;
  if (!user) return;

  const sidebar = document.getElementById('sidebar-container');
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="maas-sidebar-brand">
        <img src="/images/maas-logo.png" alt="MAAS Group of Companies" class="maas-logo-img-sidebar" />
      </div>
    </div>

    <div class="sidebar-nav">
      ${user.role === 'admin' ? `
        <div class="nav-link ${state.currentView === 'admin' ? 'active' : ''}" id="nav-admin-link">
          <i data-lucide="layout-dashboard" style="width: 18px; height: 18px;"></i>
          <span>Admin Hub</span>
        </div>
      ` : ''}

      ${user.role === 'manager' || user.role === 'admin' ? `
        <div class="nav-link ${state.currentView === 'manager' ? 'active' : ''}" id="nav-manager-link">
          <i data-lucide="briefcase" style="width: 18px; height: 18px;"></i>
          <span>Department Team</span>
        </div>
      ` : ''}

      <div class="nav-link ${state.currentView === 'employee' ? 'active' : ''}" id="nav-employee-link">
        <i data-lucide="timer" style="width: 18px; height: 18px;"></i>
        <span>8h Work Tracker</span>
      </div>
    </div>

    <div class="sidebar-user">
      <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="user-avatar-img" />
      <div class="user-info-text">
        <div class="user-name-title">${user.name}</div>
        <div class="user-role-subtitle">${user.role.toUpperCase()} &bull; ${user.department}</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach navigation links
  const adminLink = document.getElementById('nav-admin-link');
  if (adminLink) adminLink.addEventListener('click', () => state.setView('admin'));

  const mgrLink = document.getElementById('nav-manager-link');
  if (mgrLink) mgrLink.addEventListener('click', () => state.setView('manager'));

  const empLink = document.getElementById('nav-employee-link');
  if (empLink) empLink.addEventListener('click', () => state.setView('employee'));
}

function renderTopbar() {
  const user = state.user;
  const topbar = document.getElementById('topbar-container');
  if (!topbar || !user) return;

  topbar.innerHTML = `
    <div class="topbar-title-group">
      <img src="/images/maas-logo.png" alt="MAAS" class="maas-logo-img-topbar" />
      <div>
        <h2 class="topbar-page-title" style="font-size: 1.15rem; line-height: 1.2;">
          ${state.currentView === 'admin' ? 'MAAS Administration' : state.currentView === 'manager' ? `MAAS ${user.department} Department` : 'MAAS 8-Hour Workstation'}
        </h2>
        <span style="font-size: 0.725rem; color: var(--text-dim); display: block;">MAAS Group of Companies</span>
      </div>
      <span class="badge badge-role">${user.role.toUpperCase()}</span>
    </div>

    <div class="topbar-actions">
      <button class="btn btn-secondary btn-icon" id="theme-toggle-btn" title="Toggle Light/Dark Theme">
        <i data-lucide="moon" style="width: 18px; height: 18px;"></i>
      </button>

      <button class="btn btn-danger btn-sm" id="btn-topbar-logout" title="Auto checks out and finalizes hours">
        <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
        <span class="hide-on-mobile">Check Out & Logout</span>
      </button>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  setupTheme();

  document.getElementById('btn-topbar-logout').addEventListener('click', async () => {
    stopLiveTracker();
    try {
      await api.logout(user.id);
    } catch (e) {}
    api.setToken(null);
    state.setUser(null);
    state.setView('login');
    window.showToast('You have been logged out. Working hours finalized.', 'info');
  });
}

function renderMobileBottomNav() {
  const user = state.user;
  const bottomNav = document.getElementById('mobile-bottom-nav');
  if (!bottomNav || !user) return;

  bottomNav.innerHTML = `
    ${user.role === 'admin' ? `
      <div class="mobile-nav-item ${state.currentView === 'admin' ? 'active' : ''}" id="mob-nav-admin">
        <i data-lucide="shield" style="width: 20px; height: 20px;"></i>
        <span>Admin</span>
      </div>
    ` : ''}

    ${user.role === 'manager' || user.role === 'admin' ? `
      <div class="mobile-nav-item ${state.currentView === 'manager' ? 'active' : ''}" id="mob-nav-mgr">
        <i data-lucide="users" style="width: 20px; height: 20px;"></i>
        <span>Team</span>
      </div>
    ` : ''}

    <div class="mobile-nav-item ${state.currentView === 'employee' ? 'active' : ''}" id="mob-nav-emp">
      <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
      <span>8h Tracker</span>
    </div>

    <div class="mobile-nav-item" id="mob-nav-logout">
      <i data-lucide="log-out" style="width: 20px; height: 20px; color: #f87171;"></i>
      <span style="color: #f87171;">Exit</span>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const mobAdmin = document.getElementById('mob-nav-admin');
  if (mobAdmin) mobAdmin.addEventListener('click', () => state.setView('admin'));

  const mobMgr = document.getElementById('mob-nav-mgr');
  if (mobMgr) mobMgr.addEventListener('click', () => state.setView('manager'));

  const mobEmp = document.getElementById('mob-nav-emp');
  if (mobEmp) mobEmp.addEventListener('click', () => state.setView('employee'));

  const mobLogout = document.getElementById('mob-nav-logout');
  if (mobLogout) {
    mobLogout.addEventListener('click', async () => {
      stopLiveTracker();
      try { await api.logout(user.id); } catch (e) {}
      api.setToken(null);
      state.setUser(null);
      state.setView('login');
    });
  }
}

// App Initialization
async function initApp() {
  setupTheme();

  // Register PWA Service Worker for Mobile installation
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
      }).catch(err => console.log('[PWA] Service Worker error:', err));
    });
  }

  // Subscribe to state changes
  state.subscribe((event, data) => {
    if (event === 'view' || event === 'user') {
      renderCurrentView();
    }
  });

  window.addEventListener('auth:expired', () => {
    state.setUser(null);
    state.setView('login');
    window.showToast('Your session has expired. Please sign in again.', 'warning');
  });

  // Verify stored session token
  const token = api.getToken();
  if (token) {
    try {
      const res = await api.getMe();
      state.setUser(res.user);
      if (res.attendance) {
        state.setTodayAttendance(res.attendance);
      }

      if (res.user.role === 'admin') {
        state.setView('admin');
      } else if (res.user.role === 'manager') {
        state.setView('manager');
      } else {
        state.setView('employee');
      }
      return;
    } catch (e) {
      console.log('Token verification failed, reverting to login.');
      api.setToken(null);
    }
  }

  // Default to Login view
  state.setView('login');
}

document.addEventListener('DOMContentLoaded', initApp);
