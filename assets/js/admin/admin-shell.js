(function () {
  'use strict';

  const ADMIN_SHELL_CONFIG = window.ADMIN_CONFIG;
  const navLinks = document.querySelectorAll('.sidebar__link[data-page]');
  const pages = document.querySelectorAll('.admin-page');

  function redirectToAdminLogin() {
    const redirect = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`${ADMIN_SHELL_CONFIG.loginPath}?redirect=${encodeURIComponent(redirect)}`);
  }

  async function ensureAdminSession() {
    try {
      const res = await fetch(ADMIN_SHELL_CONFIG.sessionApi, { credentials: 'same-origin' });
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
      await fetch(ADMIN_SHELL_CONFIG.logoutApi, {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      redirectToAdminLogin();
    }
  }

  function loadPageData(pageId) {
    if (pageId === 'page-bewerbungen') window.loadApplications?.();
    if (pageId === 'page-roster') window.loadRoster?.();
    if (pageId === 'page-events') window.loadEvents?.();
    if (pageId === 'page-videos') window.loadVideos?.();
    if (pageId === 'page-banner') window.loadBannerSettings?.();
    if (pageId === 'page-event-anmeldungen') window.loadEventRegistrations?.();
    if (pageId === 'page-community-shouts') window.loadCommunityShouts?.();
    if (pageId === 'page-news') {
      window.loadTickerSettings?.();
      window.initNewsAdmin?.();
    }
  }

  function switchPage(pageId) {
    pages.forEach((page) => page.classList.remove('active'));
    navLinks.forEach((link) => link.classList.remove('sidebar__link--active'));

    const page = document.getElementById(pageId);
    const link = document.querySelector(`.sidebar__link[data-page="${pageId}"]`);
    if (page) page.classList.add('active');
    if (link) link.classList.add('sidebar__link--active');

    loadPageData(pageId);
  }

  function bindNavigation() {
    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        switchPage(link.dataset.page);
      });
    });
  }

  async function checkTwitchStatus() {
    const banner = document.getElementById('twitch-admin-banner');
    if (!banner) return;

    // Dashboard status only: public Twitch rendering remains in public index modules.
    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:.6rem;">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--clr-text-muted);"></span>
        <strong style="font-family:var(--ff-heading);font-size:.95rem;color:var(--clr-text-muted);">Twitch</strong>
        <span style="color:var(--clr-text-muted);font-size:.8rem;">Konfiguration ausstehend</span>
      </div>
    `;

    console.log('Twitch Status wird aktuell im Dashboard uebersprungen.');
  }

  async function initAdminDashboard() {
    bindNavigation();
    document.getElementById('admin-logout')?.addEventListener('click', logoutAdmin);

    if (!(await ensureAdminSession())) return;

    window.loadApplications?.();
    checkTwitchStatus();
    setInterval(checkTwitchStatus, 60000);
  }

  initAdminDashboard();
})();
