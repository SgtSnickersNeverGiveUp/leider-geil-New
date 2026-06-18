'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_APPLICATIONS_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const APPLICATIONS_API = ADMIN_CONFIG.applicationsApi || `${ADMIN_APPLICATIONS_API_BASE}/applications`;
const APPLICATIONS_PAGE_ID = 'page-bewerbungen';

let currentApplications = [];

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

async function loadApplications() {
  const body = document.getElementById('applications-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Lade Bewerbungen</div>';

  try {
    const res = await fetch(APPLICATIONS_API);
    if (!res.ok) throw new Error('API error ' + res.status);
    currentApplications = await res.json();
  } catch (err) {
    console.error('[Applications] Laden fehlgeschlagen', err);
    body.innerHTML = '<div class="empty-state__text">Fehler beim Laden der Bewerbungen.</div>';
    return;
  }

  renderApplications();
  updateStats();
}

function renderApplications() {
  const body = document.getElementById('applications-body');
  if (!body) return;

  if (currentApplications.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#128221;</div>
        <div class="empty-state__text">Noch keine Bewerbungen eingegangen.</div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <table class="app-table">
      <thead>
        <tr>
          <th>Gaming-ID</th>
          <th>Alter</th>
          <th>Spiel</th>
          <th>Rolle</th>
          <th>Ueber mich</th>
          <th>Datum</th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
        ${currentApplications.map((app) => {
          const id = escapeHtml(app.id);
          const about = app.ueberMich || '';
          return `
          <tr>
            <td><strong>${escapeHtml(app.gamingId)}</strong></td>
            <td>${escapeHtml(app.alter)}</td>
            <td>${renderApplicationGameBadge(app.hauptspiel)}</td>
            <td>${escapeHtml(app.rolle)}</td>
            <td class="app-about">${escapeHtml(about.substring(0, 80))}${about.length > 80 ? '...' : ''}</td>
            <td class="app-date">${formatDate(app.createdAt)}</td>
            <td>
              <button class="btn-sm" onclick="LGAdminApplications.openDetails('${id}')">Details</button>
              <button class="btn-delete" onclick="LGAdminApplications.deleteApplication('${id}')">Loeschen</button>
            </td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>`;
}

function renderApplicationGameBadge(game) {
  if (game === 'PUBG') return '<span class="tag tag--pubg">PUBG</span>';
  if (game === 'ARC Raiders') return '<span class="tag tag--arc">ARC</span>';
  return `<span class="tag tag--both">${escapeHtml(game || 'PUBG + ARC')}</span>`;
}

function openDetails(id) {
  const app = currentApplications.find((item) => item.id === id);
  if (!app) return;

  window.LGAdminDashboard?.showModal?.({
    title: `Bewerbung: ${app.gamingId || 'Details'}`,
    body: `
      <p><strong>Gaming-ID:</strong> ${escapeHtml(app.gamingId)}</p>
      <p><strong>Alter:</strong> ${escapeHtml(app.alter)}</p>
      <p><strong>Hauptspiel:</strong> ${escapeHtml(app.hauptspiel)}</p>
      <p><strong>Rolle:</strong> ${escapeHtml(app.rolle)}</p>
      <p><strong>Eingegangen:</strong> ${formatDate(app.createdAt)}</p>
      <p><strong>Ueber mich:</strong><br>${escapeHtml(app.ueberMich)}</p>
    `,
    onDelete: () => deleteApplication(id),
  });
}

async function deleteApplication(id) {
  if (!confirm('Bewerbung wirklich loeschen?')) return;

  try {
    const res = await fetch(`${APPLICATIONS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    window.LGAdminDashboard?.closeModal?.();
    await loadApplications();
  } catch (err) {
    alert('Fehler beim Loeschen: ' + err.message);
  }
}

function updateStats() {
  const total = document.getElementById('stat-total');
  const pubg = document.getElementById('stat-pubg');
  const arc = document.getElementById('stat-arc');
  if (total) total.textContent = currentApplications.length;
  if (pubg) pubg.textContent = currentApplications.filter(a => a.hauptspiel === 'PUBG' || a.hauptspiel === 'Beides').length;
  if (arc) arc.textContent = currentApplications.filter(a => a.hauptspiel === 'ARC Raiders' || a.hauptspiel === 'Beides').length;
}

function registerPageLoader() {
  const registration = {
    pageId: APPLICATIONS_PAGE_ID,
    load: loadApplications,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

document.getElementById('btn-refresh')?.addEventListener('click', loadApplications);
registerPageLoader();

window.LGAdminApplications = Object.freeze({
  load: loadApplications,
  openDetails,
  deleteApplication,
});
})();
