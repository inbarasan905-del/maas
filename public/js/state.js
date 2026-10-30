// Global State Management

class AppState {
  constructor() {
    this.user = null;
    this.todayAttendance = null;
    this.currentView = 'login';
    this.activeTab = 'overview';
    this.listeners = new Set();
  }

  setUser(user) {
    this.user = user;
    if (!user) {
      this.currentView = 'login';
      this.todayAttendance = null;
    }
    this.notify('user', user);
  }

  clearUser() {
    this.user = null;
    this.todayAttendance = null;
    this.currentView = 'login';
    this.notify('user', null);
  }

  setTodayAttendance(att) {
    this.todayAttendance = att;
    this.notify('attendance', att);
  }

  setView(view, tab = 'overview') {
    this.currentView = view;
    this.activeTab = tab;
    this.notify('view', { view, tab });
  }

  setTab(tab) {
    this.activeTab = tab;
    this.notify('tab', tab);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    this.listeners.forEach(fn => {
      try {
        fn(event, data, this);
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }

  isAuthenticated() {
    return !!this.user;
  }

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  isManager() {
    return this.user && this.user.role === 'manager';
  }

  isEmployee() {
    return this.user && this.user.role === 'employee';
  }
}

export const state = new AppState();
