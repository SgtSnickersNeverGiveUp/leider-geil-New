'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_DASHBOARD_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const ADMIN_SESSION_API = ADMIN_CONFIG.sessionApi || `${ADMIN_DASHBOARD_API_BASE}/session`;
const ADMIN_LOGOUT_API = ADMIN_CONFIG.logoutApi || `${ADMIN_DASHBOARD_API_BASE}/logout`;
const DEFAULT_ADMIN_PAGE_ID = 'page-bewerbungen';

const pageLoaders = new Map();
const navLinks = document.querySelectorAll('.sidebar__link[data-page]');
const pages = document.querySelectorAll('.admin-page');

let modalDeleteHandler = null;

function redirectToAdminLogin() {
  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/admin-login.html?redirect=${encodeURIComponent(redirect)}`);
}

async function ensureAdminSession() {
  try {
    const res = await fetch(ADMIN_SESSION_API, { credentials: 'same-origin' });
    if (!res.ok) {
      redirectToAdminLogin();
      return false;
    }

    const session = await res.json();
    if (!session.authenticated) {
      redirectToAdminLogin();
      return false;
    }

    return true;
  } catch {
    redirectToAdminLogin();
    return false;
  }
}

async function logoutAdmin() {
  try {
    await fetch(ADMIN_LOGOUT_API, {
      method: 'POST',
      credentials: 'same-origin',
    });
  } finally {
    redirectToAdminLogin();
  }
}

function loadAdminRoster() {
  const rosterAdmin = window.LGAdminRoster;
  if (rosterAdmin?.loadRoster) return rosterAdmin.loadRoster();
  console.error('[Admin Dashboard] Roster-Modul ist nicht geladen.');
  return Promise.resolve();
}

function registerPageLoader(registrationOrPageId, maybeLoader) {
  const pageId = typeof registrationOrPageId === 'string'
    ? registrationOrPageId
    : registrationOrPageId?.pageId;
  const loader = typeof registrationOrPageId === 'string'
    ? maybeLoader
    : registrationOrPageId?.load;

  if (!pageId || typeof loader !== 'function') {
    console.error('[Admin Dashboard] Ungueltige Page-Loader-Registrierung.', registrationOrPageId);
    return;
  }

  pageLoaders.set(pageId, loader);
}

function consumeExternalPageLoaders() {
  const externalLoaders = Array.isArray(window.LG_ADMIN_PAGE_LOADERS)
    ? window.LG_ADMIN_PAGE_LOADERS
    : [];

  externalLoaders.forEach(registerPageLoader);
  window.LG_ADMIN_PAGE_LOADERS = Object.freeze({
    register: registerPageLoader,
  });
}

function loadPageData(pageId) {
  const loader = pageLoaders.get(pageId);
  if (!loader) return;

  try {
    const result = loader();
    if (result?.catch) {
      result.catch((err) => console.error(`[Admin Dashboard] ${pageId} konnte nicht geladen werden.`, err));
    }
  } catch (err) {
    console.error(`[Admin Dashboard] ${pageId} konnte nicht geladen werden.`, err);
  }
}

function switchPage(pageId) {
  pages.forEach(page => page.classList.remove('active'));
  navLinks.forEach(link => link.classList.remove('sidebar__link--active'));

  const page = document.getElementById(pageId);
  const link = document.querySelector(`.sidebar__link[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (link) link.classList.add('sidebar__link--active');

  loadPageData(pageId);
}

function showModal({ title, body, onDelete } = {}) {
  const overlay = document.getElementById('modal-overlay');
  const titleNode = document.getElementById('modal-title');
  const bodyNode = document.getElementById('modal-body');
  const deleteButton = document.getElementById('modal-delete');

  if (!overlay || !titleNode || !bodyNode || !deleteButton) return;

  titleNode.textContent = title || 'Details';
  bodyNode.innerHTML = body || '';
  modalDeleteHandler = typeof onDelete === 'function' ? onDelete : null;
  deleteButton.style.display = modalDeleteHandler ? '' : 'none';
  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('active');
  modalDeleteHandler = null;
}

async function handleModalDelete() {
  if (typeof modalDeleteHandler !== 'function') return;
  await modalDeleteHandler();
}

function bindShellEvents() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(link.dataset.page);
    });
  });

  document.getElementById('admin-logout')?.addEventListener('click', logoutAdmin);
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-delete')?.addEventListener('click', handleModalDelete);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

registerPageLoader('page-roster', loadAdminRoster);
consumeExternalPageLoaders();
bindShellEvents();

window.LGAdminDashboard = Object.freeze({
  registerPageLoader,
  showModal,
  closeModal,
});

(async function initAdminDashboard() {
  if (!(await ensureAdminSession())) return;
  loadPageData(DEFAULT_ADMIN_PAGE_ID);
})();
})();
