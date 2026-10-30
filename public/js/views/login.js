import { api } from '../api.js';
import { state } from '../state.js';

export function renderLoginView() {
  const container = document.getElementById('view-content');

  container.innerHTML = `
    <div class="login-page-container">
      <div class="login-card">
        <div style="text-align: center;">
          <img src="/images/maas-logo.png" alt="MAAS Group of Companies" class="maas-logo-img-login" />
        </div>

        <div class="login-header">
          <h1>MAAS Portal Sign In</h1>
          <p>Employee Management & 8-Hour Shift Tracking</p>
        </div>

        <!-- Mode Toggle Tabs (Email / Phone) -->
        <div class="auth-tabs">
          <button type="button" class="auth-tab active" id="tab-email-btn">
            <i data-lucide="mail" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
            Email / Gmail
          </button>
          <button type="button" class="auth-tab" id="tab-phone-btn">
            <i data-lucide="phone" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
            Mobile Phone
          </button>
        </div>

        <form id="login-form">
          <!-- Identifier Input (Email or Phone) -->
          <div class="form-group">
            <label class="form-label" id="identifier-label">Email Address</label>
            <div class="input-wrapper">
              <span class="input-icon" id="identifier-icon">
                <i data-lucide="mail" style="width: 18px; height: 18px;"></i>
              </span>
              <input type="text" id="login-identifier" class="form-control" placeholder="name@company.com" required autocomplete="username" />
            </div>
          </div>

          <!-- Password Input with Show/Hide Toggle -->
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label class="form-label" style="margin-bottom: 0;">Password</label>
              <a href="javascript:void(0)" id="forgot-password-link" style="font-size: 0.8rem; font-weight: 500; color: var(--maas-pink);">Forgot Password?</a>
            </div>
            <div class="input-wrapper">
              <span class="input-icon">
                <i data-lucide="lock" style="width: 18px; height: 18px;"></i>
              </span>
              <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required autocomplete="current-password" />
              <button type="button" class="password-toggle-btn" id="toggle-password-btn" title="Show or hide password">
                <i data-lucide="eye" id="toggle-pwd-icon" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
          </div>

          <!-- Auto-tracking reminder with Pink & Blue styling -->
          <div style="background: rgba(230, 0, 126, 0.08); border: 1px solid rgba(230, 0, 126, 0.25); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: #f43f5e; display: flex; align-items: center; gap: 0.5rem; text-align: left;">
            <i data-lucide="info" style="width: 16px; height: 16px; flex-shrink: 0; color: var(--maas-pink);"></i>
            <span>Signing in automatically starts your MAAS 8-hour working attendance session.</span>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="login-submit-btn">
            <span>Sign In to Dashboard</span>
            <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
          </button>
        </form>

        <!-- Quick 1-Click Demo Accounts -->
        <div class="demo-accounts-section">
          <div class="demo-title">⚡ Quick 1-Click Demo Switcher</div>
          <div class="demo-buttons-grid">
            <button type="button" class="demo-btn" id="demo-admin-btn">
              <span class="demo-role-badge">Admin</span>
              <span class="demo-name">Sarah Connor</span>
            </button>
            <button type="button" class="demo-btn" id="demo-manager-btn">
              <span class="demo-role-badge">Manager</span>
              <span class="demo-name">David Miller</span>
            </button>
            <button type="button" class="demo-btn" id="demo-employee-btn">
              <span class="demo-role-badge">Employee</span>
              <span class="demo-name">Alex Johnson</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div class="modal-backdrop" id="forgot-password-modal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Reset Your Password</h3>
          <button type="button" class="modal-close-btn" id="close-forgot-modal">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        <div class="modal-body">
          <div id="forgot-step-1">
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
              Enter your registered email address or phone number. We'll send a 6-digit OTP verification code.
            </p>
            <div class="form-group">
              <label class="form-label">Registered Email or Phone</label>
              <input type="text" id="reset-identifier-input" class="form-control no-icon" placeholder="admin@company.com or +1 555-0101" />
            </div>
            <button type="button" class="btn btn-primary" style="width: 100%;" id="send-otp-btn">
              Send Verification OTP
            </button>
          </div>

          <div id="forgot-step-2" style="display: none;">
            <div id="otp-demo-alert" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.85rem; color: #6ee7b7;"></div>
            <div class="form-group">
              <label class="form-label">Enter 6-Digit OTP</label>
              <input type="text" id="otp-input" class="form-control no-icon" placeholder="e.g. 123456" maxlength="6" style="letter-spacing: 0.25em; font-size: 1.25rem; text-align: center;" />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" id="new-password-input" class="form-control no-icon" placeholder="Minimum 6 characters" />
            </div>
            <button type="button" class="btn btn-success" style="width: 100%;" id="verify-and-reset-btn">
              Set New Password & Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setupLoginHandlers();
}

function setupLoginHandlers() {
  let isPhoneMode = false;
  const tabEmail = document.getElementById('tab-email-btn');
  const tabPhone = document.getElementById('tab-phone-btn');
  const identifierInput = document.getElementById('login-identifier');
  const identifierLabel = document.getElementById('identifier-label');
  const identifierIcon = document.getElementById('identifier-icon');

  tabEmail.addEventListener('click', () => {
    isPhoneMode = false;
    tabEmail.classList.add('active');
    tabPhone.classList.remove('active');
    identifierLabel.textContent = 'Email / Gmail Address';
    identifierInput.placeholder = 'name@company.com';
    identifierIcon.innerHTML = '<i data-lucide="mail" style="width: 18px; height: 18px;"></i>';
    if (window.lucide) window.lucide.createIcons();
  });

  tabPhone.addEventListener('click', () => {
    isPhoneMode = true;
    tabPhone.classList.add('active');
    tabEmail.classList.remove('active');
    identifierLabel.textContent = 'Mobile Phone Number';
    identifierInput.placeholder = '+1 555-0103';
    identifierIcon.innerHTML = '<i data-lucide="phone" style="width: 18px; height: 18px;"></i>';
    if (window.lucide) window.lucide.createIcons();
  });

  // Password toggle
  const pwdInput = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-password-btn');
  let pwdVisible = false;

  toggleBtn.addEventListener('click', () => {
    pwdVisible = !pwdVisible;
    pwdInput.type = pwdVisible ? 'text' : 'password';
    toggleBtn.innerHTML = pwdVisible 
      ? '<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>' 
      : '<i data-lucide="eye" style="width: 18px; height: 18px;"></i>';
    if (window.lucide) window.lucide.createIcons();
  });

  // Quick Demo Buttons
  document.getElementById('demo-admin-btn').addEventListener('click', () => {
    identifierInput.value = 'admin@company.com';
    pwdInput.value = 'admin123';
    submitLogin('admin@company.com', 'admin123');
  });

  document.getElementById('demo-manager-btn').addEventListener('click', () => {
    identifierInput.value = 'manager@company.com';
    pwdInput.value = 'manager123';
    submitLogin('manager@company.com', 'manager123');
  });

  document.getElementById('demo-employee-btn').addEventListener('click', () => {
    identifierInput.value = 'alex@company.com';
    pwdInput.value = 'employee123';
    submitLogin('alex@company.com', 'employee123');
  });

  // Form submit
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitLogin(identifierInput.value.trim(), pwdInput.value);
  });

  // Forgot Password Modal Handlers
  const modal = document.getElementById('forgot-password-modal');
  const forgotLink = document.getElementById('forgot-password-link');
  const closeModal = document.getElementById('close-forgot-modal');
  let resetIdentifier = '';
  let resetOtp = '';

  forgotLink.addEventListener('click', () => {
    modal.classList.add('show');
    document.getElementById('forgot-step-1').style.display = 'block';
    document.getElementById('forgot-step-2').style.display = 'none';
    document.getElementById('reset-identifier-input').value = identifierInput.value;
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  document.getElementById('send-otp-btn').addEventListener('click', async () => {
    const val = document.getElementById('reset-identifier-input').value.trim();
    if (!val) {
      window.showToast('Please enter your email or phone number', 'warning');
      return;
    }

    try {
      const res = await api.forgotPassword(val);
      resetIdentifier = val;
      resetOtp = res.demoOtp;

      document.getElementById('forgot-step-1').style.display = 'none';
      document.getElementById('forgot-step-2').style.display = 'block';
      document.getElementById('otp-demo-alert').innerHTML = `
        <strong>Simulated SMS / Email OTP:</strong> <code>${res.demoOtp}</code><br/>
        <span style="font-size: 0.75rem;">(Auto-filled for testing convenience)</span>
      `;
      document.getElementById('otp-input').value = res.demoOtp;
      window.showToast('OTP sent successfully!', 'success');
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  document.getElementById('verify-and-reset-btn').addEventListener('click', async () => {
    const otp = document.getElementById('otp-input').value.trim();
    const newPassword = document.getElementById('new-password-input').value;

    if (!otp || !newPassword) {
      window.showToast('Please provide both OTP and a new password', 'warning');
      return;
    }

    try {
      await api.resetPassword(resetIdentifier, otp, newPassword);
      window.showToast('Password changed successfully! You may now sign in.', 'success');
      modal.classList.remove('show');
      identifierInput.value = resetIdentifier;
      pwdInput.value = newPassword;
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });
}

async function submitLogin(identifier, password) {
  const submitBtn = document.getElementById('login-submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Authenticating...';

  try {
    const res = await api.login(identifier, password);
    api.setToken(res.token);
    state.setUser(res.user);
    if (res.attendance) {
      state.setTodayAttendance(res.attendance);
    }

    window.showToast(`Welcome back, ${res.user.name}! 8h Work Session Started.`, 'success');

    // Route based on role
    if (res.user.role === 'admin') {
      state.setView('admin');
    } else if (res.user.role === 'manager') {
      state.setView('manager');
    } else {
      state.setView('employee');
    }
  } catch (err) {
    window.showToast(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
