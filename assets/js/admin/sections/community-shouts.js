'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_COMMUNITY_SHOUTS_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const COMMUNITY_SHOUTS_API = ADMIN_CONFIG.communityShoutsApi || `${ADMIN_COMMUNITY_SHOUTS_API_BASE}/community-shouts`;
const COMMUNITY_SHOUTS_PAGE_ID = 'page-community-shouts';

let currentCommunityShouts = [];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('de-DE');
}

async function loadCommunityShouts() {
  const body = document.getElementById('community-shouts-admin-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Lade Community Shouts</div>';

  try {
    const res = await fetch(`${COMMUNITY_SHOUTS_API}?all=1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentCommunityShouts = await res.json();
    renderCommunityShoutsAdmin();
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler beim Laden: ${err.message}</div></div>`;
  }
}

function renderCommunityShoutsAdmin() {
  const body = document.getElementById('community-shouts-admin-body');
  if (!body) return;

  if (currentCommunityShouts.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#128172;</div>
        <div class="empty-state__text">Noch keine Community Shouts vorhanden.</div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <table class="app-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>Tag</th>
          <th>Nachricht</th>
          <th>Datum</th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
        ${currentCommunityShouts.map((shout) => `
          <tr>
            <td>${shout.approved ? '<span class="tag tag--arc">Live</span>' : '<span class="tag tag--pubg">Wartet</span>'}</td>
            <td><strong>${escapeHtml(shout.name)}</strong></td>
            <td>${escapeHtml(shout.tag || 'Community')}</td>
            <td class="app-about">${escapeHtml(shout.message)}</td>
            <td class="app-date">${formatDate(shout.createdAt)}</td>
            <td>
              <button class="btn-sm" onclick="LGAdminCommunityShouts.setApproval('${escapeHtml(shout.id)}', ${!shout.approved})">
                ${shout.approved ? 'Ausblenden' : 'Freigeben'}
              </button>
              <button class="btn-delete" onclick="LGAdminCommunityShouts.deleteShout('${escapeHtml(shout.id)}')">Loeschen</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function setApproval(id, approved) {
  try {
    const res = await fetch(COMMUNITY_SHOUTS_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadCommunityShouts();
  } catch (err) {
    alert('Fehler beim Aktualisieren: ' + err.message);
  }
}

async function deleteShout(id) {
  if (!confirm('Community Shout wirklich loeschen?')) return;

  try {
    const res = await fetch(`${COMMUNITY_SHOUTS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadCommunityShouts();
  } catch (err) {
    alert('Fehler beim Loeschen: ' + err.message);
  }
}

function registerPageLoader() {
  const registration = {
    pageId: COMMUNITY_SHOUTS_PAGE_ID,
    load: loadCommunityShouts,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

document.getElementById('btn-refresh-community-shouts')?.addEventListener('click', loadCommunityShouts);
registerPageLoader();

window.LGAdminCommunityShouts = Object.freeze({
  load: loadCommunityShouts,
  setApproval,
  deleteShout,
});
})();
