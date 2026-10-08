/**
 * Farmigo – Super Admin Login Script
 * Handles JWT Authentication, token storage, and secure redirection.
 */

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '5000' ? '' : 'https://farmer-customer.onrender.com')
  : 'https://farmer-customer.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const submitBtn = document.getElementById('btnAdminSubmit');
  const errorBox = document.getElementById('loginError');

  // 1. Initialize default admin account in background on load
  fetch(API + '/api/admin/auth/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.log('Admin init check:', err));

  // 2. Check if already logged in as Admin
  const existingToken = localStorage.getItem('farmigo_admin_token');
  if (existingToken) {
    // Verify if token is still valid
    fetch(API + '/api/admin/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${existingToken}` }
    })
    .then(res => {
      if (res.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        localStorage.removeItem('farmigo_admin_token');
        localStorage.removeItem('farmigo_admin_user');
      }
    })
    .catch(() => {});
  }

  // 3. Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showError('Invalid email or password. Please try again.');
        return;
      }

      // Show loading state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳ Authenticating...</span>';
      hideError();

      try {
        const response = await fetch(API + '/api/admin/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          // Success: Store JWT and admin info
          localStorage.setItem('farmigo_admin_token', data.token);
          localStorage.setItem('farmigo_admin_user', JSON.stringify(data.admin || { email, name: 'Super Admin', role: 'SUPER_ADMIN' }));

          submitBtn.innerHTML = '<span>✅ Access Granted! Redirecting...</span>';
          submitBtn.style.background = '#10b981';

          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 600);
        } else {
          // Error response
          showError('Invalid email or password. Please try again.');
          resetBtn(originalBtnText);
        }
      } catch (err) {
        console.error('Login Error:', err);
        showError('Invalid email or password. Please try again.');
        resetBtn(originalBtnText);
      }
    });
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }
  }

  function hideError() {
    if (errorBox) {
      errorBox.style.display = 'none';
    }
  }

  function resetBtn(text) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = text;
    submitBtn.style.background = '';
  }
});
