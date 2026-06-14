'use strict';

(function () {
const loginForm = document.getElementById('admin-login-form');
const passwordInput = document.getElementById('admin-password');
const submitButton = document.getElementById('admin-login-submit');
const statusEl = document.getElementById('admin-login-status');
const ADMIN_SESSION_API = '/api/admin/session';
const ADMIN_LOGIN_API = '/api/admin/login';

function getRedirectTarget() {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/lg-dashboard.html';
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/lg-dashboard.html';
  return redirect;
}

function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

async function checkExistingSession() {
  try {
    const res = await fetch(ADMIN_SESSION_API, { credentials: 'same-origin' });
    if (!res.ok) return;

    const session = await res.json();
    if (!session.configured) {
      setStatus('Admin-Passwort ist noch nicht konfiguriert. Setze ADMIN_PASSWORD in Netlify.', 'error');
      submitButton.disabled = true;
      passwordInput.disabled = true;
      return;
    }

    if (session.authenticated) {
      window.location.assign(getRedirectTarget());
    }
  } catch {
    setStatus('Session konnte nicht geprueft werden.', 'error');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  setStatus('Login wird geprueft...');

  try {
    const res = await fetch(ADMIN_LOGIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password: passwordInput.value }),
    });

    if (res.ok) {
      window.location.assign(getRedirectTarget());
      return;
    }

    if (res.status === 503) {
      setStatus('Admin-Passwort ist noch nicht konfiguriert. Setze ADMIN_PASSWORD in Netlify.', 'error');
      return;
    }

    setStatus('Passwort ist falsch.', 'error');
    passwordInput.select();
  } catch {
    setStatus('Login fehlgeschlagen. Bitte spaeter erneut versuchen.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});

checkExistingSession();
})();
