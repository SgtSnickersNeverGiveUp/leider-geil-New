'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_EVENT_REGISTRATIONS_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const EVENT_REGISTRATIONS_API = ADMIN_CONFIG.eventRegistrationsApi || `${ADMIN_EVENT_REGISTRATIONS_API_BASE}/event-registrations`;
const EVENT_REGISTRATIONS_PAGE_ID = 'page-event-anmeldungen';

let currentEventRegistrations = [];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('de-DE');
}

async function loadEventRegistrations() {
  const body = document.getElementById('evt-registrations-body');
  if (!body) return;

  body.innerHTML = '<div class="loading">Lade Event-Anmeldungen</div>';

  try {
    const res = await fetch(EVENT_REGISTRATIONS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentEventRegistrations = await res.json();
    renderEventRegistrations();
    updateEventRegistrationStats();
  } catch (err) {
    console.error('[Admin-EvtReg]', err);
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler beim Laden: ${err.message}</div></div>`;
  }
}

function renderEventRegistrations() {
  const body = document.getElementById('evt-registrations-body');
  if (!body) return;

  if (currentEventRegistrations.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#128203;</div>
        <div class="empty-state__text">Noch keine Event-Anmeldungen eingegangen.</div>
      </div>`;
    return;
  }

  body.innerHTML = `
    <table class="app-table">
      <thead>
        <tr>
          <th>Name / Gaming-ID</th>
          <th>Spiel</th>
          <th>Clan</th>
          <th>Spieler</th>
          <th>Bemerkungen</th>
          <th>Datum</th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
        ${currentEventRegistrations.map(reg => `
          <tr>
            <td><strong>${escapeHtml(reg.name)}</strong></td>
            <td>${renderEventRegistrationGameBadge(reg.spiel)}</td>
            <td>${escapeHtml(reg.clan || '-')}</td>
            <td>${escapeHtml(reg.spielerAnzahl || '-')}</td>
            <td class="app-about">${escapeHtml(truncate(reg.bemerkungen || '', 60))}</td>
            <td class="app-date">${formatDate(reg.createdAt)}</td>
            <td>
              <button class="btn-sm" data-admin-event-registrations-show-detail="${escapeHtml(reg.id)}">Details</button>
              <button class="btn-delete" data-admin-event-registrations-delete="${escapeHtml(reg.id)}">Loeschen</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function renderEventRegistrationGameBadge(game) {
  if (game === 'PUBG') return '<span class="tag tag--pubg">PUBG</span>';
  if (game === 'ARC Raiders') return '<span class="tag tag--arc">ARC Raiders</span>';
  return '<span class="tag tag--both">Mixed</span>';
}

function updateEventRegistrationStats() {
  const total = document.getElementById('stat-evt-total');
  const pubg = document.getElementById('stat-evt-pubg');
  const arc = document.getElementById('stat-evt-arc');
  if (total) total.textContent = currentEventRegistrations.length;
  if (pubg) pubg.textContent = currentEventRegistrations.filter(r => r.spiel === 'PUBG').length;
  if (arc) arc.textContent = currentEventRegistrations.filter(r => r.spiel === 'ARC Raiders').length;
}

function showDetail(id) {
  const reg = currentEventRegistrations.find(r => r.id === id);
  if (!reg) return;

  window.LGAdminDashboard?.showModal?.({
    title: `Event-Anmeldung: ${reg.name || 'Details'}`,
    body: `
      <div class="modal__field">
        <div class="modal__label">Name / Gaming-ID</div>
        <div class="modal__value">${escapeHtml(reg.name || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">E-Mail</div>
        <div class="modal__value">${escapeHtml(reg.email || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">Spiel</div>
        <div class="modal__value">${escapeHtml(reg.spiel || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">Clan-Name</div>
        <div class="modal__value">${escapeHtml(reg.clan || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">Anzahl Spieler</div>
        <div class="modal__value">${escapeHtml(reg.spielerAnzahl || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">Bemerkungen</div>
        <div class="modal__value" style="white-space:pre-wrap;">${escapeHtml(reg.bemerkungen || '-')}</div>
      </div>
      <div class="modal__field">
        <div class="modal__label">Eingegangen am</div>
        <div class="modal__value">${formatDate(reg.createdAt)}</div>
      </div>`,
    onDelete: () => deleteRegistration(id),
  });
}

async function deleteRegistration(id) {
  if (!confirm('Event-Anmeldung wirklich loeschen?')) return;

  try {
    const res = await fetch(`${EVENT_REGISTRATIONS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    window.LGAdminDashboard?.closeModal?.();
    await loadEventRegistrations();
  } catch (err) {
    alert('Fehler beim Loeschen: ' + err.message);
  }
}

function bindEventRegistrationListActions() {
  const body = document.getElementById('evt-registrations-body');
  body?.addEventListener('click', (e) => {
    const detailButton = e.target.closest('[data-admin-event-registrations-show-detail]');
    if (detailButton) {
      showDetail(detailButton.getAttribute('data-admin-event-registrations-show-detail'));
      return;
    }

    const deleteButton = e.target.closest('[data-admin-event-registrations-delete]');
    if (deleteButton) {
      deleteRegistration(deleteButton.getAttribute('data-admin-event-registrations-delete'));
    }
  });
}

function registerPageLoader() {
  const registration = {
    pageId: EVENT_REGISTRATIONS_PAGE_ID,
    load: loadEventRegistrations,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

document.getElementById('btn-refresh-evt-registrations')?.addEventListener('click', loadEventRegistrations);
bindEventRegistrationListActions();
registerPageLoader();

window.LGAdminEventRegistrations = Object.freeze({
  load: loadEventRegistrations,
  showDetail,
  deleteRegistration,
});
})();
