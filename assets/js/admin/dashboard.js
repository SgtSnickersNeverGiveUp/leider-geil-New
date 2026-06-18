'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_DASHBOARD_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const API_URL = ADMIN_CONFIG.applicationsApi || `${ADMIN_DASHBOARD_API_BASE}/applications`;
const EVENTS_API = ADMIN_CONFIG.eventsApi || `${ADMIN_DASHBOARD_API_BASE}/events`;
const EVENT_IMAGE_API = ADMIN_CONFIG.eventImageApi || `${ADMIN_DASHBOARD_API_BASE}/event-image`;
const VIDEOS_API = ADMIN_CONFIG.videosApi || `${ADMIN_DASHBOARD_API_BASE}/videos`;
const EVT_REGISTRATIONS_API = ADMIN_CONFIG.eventRegistrationsApi || `${ADMIN_DASHBOARD_API_BASE}/event-registrations`;
const COMMUNITY_SHOUTS_API = ADMIN_CONFIG.communityShoutsApi || `${ADMIN_DASHBOARD_API_BASE}/community-shouts`;
const ADMIN_SESSION_API = ADMIN_CONFIG.sessionApi || `${ADMIN_DASHBOARD_API_BASE}/session`;
const ADMIN_LOGOUT_API = ADMIN_CONFIG.logoutApi || `${ADMIN_DASHBOARD_API_BASE}/logout`;
const EVENT_IMAGE_PREVIEW_API = ADMIN_CONFIG.eventImagePreviewApi || '/api/event-image';

const EVENT_GAME_OPTIONS = [
  'PUBG',
  'PUBG NEWS',
  'ARC Raiders',
  'ARC Raiders NEWS',
  'NEWS',
  'Mixed',
];

function renderEventGameOptions(selectedGame) {
  return EVENT_GAME_OPTIONS
    .map((game) => `<option value="${escapeHtml(game)}" ${selectedGame === game ? 'selected' : ''}>${escapeHtml(game)}</option>`)
    .join('');
}

function getEventGameVariant(game) {
  if (game === 'PUBG' || game === 'PUBG NEWS') return 'pubg';
  if (game === 'ARC Raiders' || game === 'ARC Raiders NEWS') return 'arc';
  if (game === 'NEWS') return 'news';
  return '';
}

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

const pageLoaders = new Map();

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

// ══════════════════════════════════════════════════════════
// PAGE NAVIGATION
// ══════════════════════════════════════════════════════════
const navLinks = document.querySelectorAll('.sidebar__link[data-page]');
const pages = document.querySelectorAll('.admin-page');

registerPageLoader('page-bewerbungen', loadApplications);
registerPageLoader('page-roster', loadAdminRoster);
registerPageLoader('page-events', loadEvents);
registerPageLoader('page-videos', loadVideos);
registerPageLoader('page-event-anmeldungen', loadEventRegistrations);
registerPageLoader('page-community-shouts', loadCommunityShouts);
consumeExternalPageLoaders();

function switchPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('sidebar__link--active'));

  const page = document.getElementById(pageId);
  const link = document.querySelector(`.sidebar__link[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (link) link.classList.add('sidebar__link--active');

  loadPageData(pageId);
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});
// ══════════════════════════════════════════════════════════
// BEWERBUNGEN (Applications) – KOMPLETT FUNKTIONAL
// ══════════════════════════════════════════════════════════

let currentApplications = [];
let currentModalId = null;
let currentEvtModalId = null;

async function loadApplications() {
  const body = document.getElementById('applications-body');
  body.innerHTML = '<div class="loading">Lade Bewerbungen</div>';

  try {
    const res = await fetch(API_URL);
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
  if (currentApplications.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
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
          <th>Über mich</th>
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
  <button class="btn-sm" onclick="LGAdminDashboard.openApplicationDetails('${id}')">Details</button>
  <button class="btn-delete" onclick="LGAdminDashboard.deleteApplication('${id}')">Löschen</button>
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

function openApplicationDetails(id) {
  const app = currentApplications.find((item) => item.id === id);
  if (!app) return;

  currentModalId = id;
  currentEvtModalId = null;
  document.getElementById('modal-title').textContent = `Bewerbung: ${app.gamingId || 'Details'}`;
  document.getElementById('modal-body').innerHTML = `
    <p><strong>Gaming-ID:</strong> ${escapeHtml(app.gamingId)}</p>
    <p><strong>Alter:</strong> ${escapeHtml(app.alter)}</p>
    <p><strong>Hauptspiel:</strong> ${escapeHtml(app.hauptspiel)}</p>
    <p><strong>Rolle:</strong> ${escapeHtml(app.rolle)}</p>
    <p><strong>Eingegangen:</strong> ${formatDate(app.createdAt)}</p>
    <p><strong>Über mich:</strong><br>${escapeHtml(app.ueberMich)}</p>
  `;
  document.getElementById('modal-overlay')?.classList.add('active');
}

async function deleteApplication(id) {
  if (!confirm('Bewerbung wirklich löschen?')) return;

  try {
    const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    closeModal();
    await loadApplications();
  } catch (err) {
    alert('Fehler beim Löschen: ' + err.message);
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = currentApplications.length;
  document.getElementById('stat-pubg').textContent = currentApplications.filter(a => a.hauptspiel === 'PUBG' || a.hauptspiel === 'Beides').length;
  document.getElementById('stat-arc').textContent = currentApplications.filter(a => a.hauptspiel === 'ARC Raiders' || a.hauptspiel === 'Beides').length;
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('active');
  currentModalId = null;
  currentEvtModalId = null;
}
// ══════════════════════════════════════════════════════════
// EVENT IMAGE UPLOAD (mirrors roster avatar upload)
// ══════════════════════════════════════════════════════════
let eventImageFile = null;
let editEventImageFile = null;

const eventImageArea = document.getElementById('event-image-area');
eventImageArea.addEventListener('dragover', (e) => { e.preventDefault(); eventImageArea.style.borderColor = 'var(--clr-accent-arc)'; });
eventImageArea.addEventListener('dragleave', () => { eventImageArea.style.borderColor = ''; });
eventImageArea.addEventListener('drop', (e) => {
  e.preventDefault();
  eventImageArea.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) handleEventImageFileSelect(file);
});

document.getElementById('event-image-file').addEventListener('change', (e) => {
  if (e.target.files[0]) handleEventImageFileSelect(e.target.files[0]);
});

function handleEventImageFileSelect(file) {
  const status = document.getElementById('event-image-status');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    status.textContent = 'Nur JPEG, PNG oder WebP erlaubt.';
    status.style.color = 'var(--clr-danger)';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = 'Datei zu groß (max. 5 MB).';
    status.style.color = 'var(--clr-danger)';
    return;
  }
  eventImageFile = file;
  const preview = document.getElementById('event-image-preview');
  preview.src = URL.createObjectURL(file);
  status.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
  status.style.color = 'var(--clr-accent-arc)';
}

async function uploadEventImage(eventId, file) {
  const res = await fetch(`${EVENT_IMAGE_API}?id=${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Upload fehlgeschlagen (HTTP ${res.status})`);
  }
  return await res.json();
}

// ══════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════
async function loadEvents() {
  const body = document.getElementById('events-list-body');
  body.innerHTML = '<div class="loading">Lade Events</div>';

  try {
    const res = await fetch(EVENTS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();
    renderEventsAdmin(events);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler: ${err.message}</div></div>`;
  }
}

function renderEventsAdmin(events) {
  const body = document.getElementById('events-list-body');

  if (events.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#128197;</div><div class="empty-state__text">Keine Events vorhanden.</div></div>`;
    return;
  }

  body.innerHTML = events.map(ev => {
    const dateStr = new Date(ev.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
    const thumbHtml = ev.image
      ? `<img class="admin-event-thumb" src="${escapeHtml(ev.image)}${ev.image.startsWith(EVENT_IMAGE_PREVIEW_API) ? (ev.image.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60000) : ''}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : '';
    const game = ev.game || 'Mixed';
    const gameVariant = getEventGameVariant(game);
    const gameClass = gameVariant ? ` admin-event-game--${gameVariant}` : '';
    return `
      <div class="admin-event-item">
        ${thumbHtml}
        <div class="admin-event-info">
          <div class="admin-event-title">${escapeHtml(ev.title)}</div>
          <div class="admin-event-meta">
            <span>${dateStr}</span>
            <span class="admin-event-game${gameClass}">${escapeHtml(game)}</span>

          </div>
        </div>
        <div class="admin-event-actions">
          <button class="btn-sm" onclick="LGAdminDashboard.openEditEvent('${ev.id}')">&#9998;</button>
          <button class="btn-delete" onclick="LGAdminDashboard.deleteEvent('${ev.id}')">Löschen</button>
        </div>
      </div>`;
  }).join('');
}

async function deleteEvent(id) {
  if (!confirm('Event wirklich löschen?')) return;
  try {
    // Delete event image too
    try { await fetch(`${EVENT_IMAGE_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch {}
    const res = await fetch(`${EVENTS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadEvents();
  } catch (err) {
    alert('Fehler beim Löschen: ' + err.message);
  }
}

function openEditEvent(id) {
  fetch(EVENTS_API).then(r => r.json()).then(events => {
    const ev = events.find(x => x.id === id);
    if (!ev) { alert('Event nicht gefunden.'); return; }

    const imgSrc = ev.image
      ? escapeHtml(ev.image) + (ev.image.startsWith(EVENT_IMAGE_PREVIEW_API) ? (ev.image.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60000) : '')
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 50'%3E%3Crect fill='%231a1a2e' width='80' height='50'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='14'%3E%3F%3C/text%3E%3C/svg%3E";

    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'edit-event-overlay';
    overlay.innerHTML = `
      <div class="edit-modal">
        <div class="edit-modal__title">Event bearbeiten</div>
        <form class="admin-form" id="edit-event-form">
          <input type="hidden" id="edit-event-id" value="${escapeHtml(ev.id)}">
          <div class="admin-form__group">
            <label class="admin-form__label">Titel</label>
            <input class="admin-form__input" type="text" id="edit-event-title" value="${escapeHtml(ev.title)}" required>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Datum</label>
            <input class="admin-form__input" type="date" id="edit-event-date" value="${escapeHtml(ev.date)}" required>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Spiel</label>
            <select class="admin-form__select" id="edit-event-game" required>
              ${renderEventGameOptions(ev.game || 'Mixed')}
            </select>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label" for="edit-event-desc">Beschreibung</label>
            <textarea class="admin-form__textarea admin-form__textarea--event-description" id="edit-event-desc" rows="8">${escapeHtml(ev.description || '')}</textarea>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Bild</label>
            <div class="image-upload-area" id="edit-event-image-area" onclick="document.getElementById('edit-event-image-file').click()">
              <img class="image-upload-area__preview" id="edit-event-image-preview" src="${imgSrc}" alt="Vorschau"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 80 50%27%3E%3Crect fill=%27%231a1a2e%27 width=%2780%27 height=%2750%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 text-anchor=%27middle%27 fill=%27%237a7a8e%27 font-size=%2714%27%3E%3F%3C/text%3E%3C/svg%3E'">
              <div class="image-upload-area__text">
                <strong>Klicken</strong> um ein neues Bild auszuwählen
              </div>
            </div>
            <input type="file" id="edit-event-image-file" accept="image/jpeg,image/png,image/webp" style="display:none">
            <div class="avatar-upload-status" id="edit-event-image-status"></div>
            <div class="avatar-upload-actions">
              <button type="button" class="btn-sm" id="edit-event-image-remove" style="color:var(--clr-danger);border-color:var(--clr-danger);">Bild entfernen</button>
            </div>
          </div>
          <div class="edit-modal__footer">
            <button type="submit" class="admin-form__submit" id="edit-event-save">Speichern</button>
            <button type="button" class="btn-sm" id="edit-event-cancel">Abbrechen</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);
    editEventImageFile = null;
    let editRemoveEventImage = false;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeEditEvent(); });
    document.getElementById('edit-event-cancel').addEventListener('click', closeEditEvent);

    // File select
    document.getElementById('edit-event-image-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const status = document.getElementById('edit-event-image-status');
      if (!allowed.includes(file.type)) {
        status.textContent = 'Nur JPEG, PNG oder WebP erlaubt.';
        status.style.color = 'var(--clr-danger)';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        status.textContent = 'Datei zu groß (max. 5 MB).';
        status.style.color = 'var(--clr-danger)';
        return;
      }
      editEventImageFile = file;
      editRemoveEventImage = false;
      document.getElementById('edit-event-image-preview').src = URL.createObjectURL(file);
      status.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      status.style.color = 'var(--clr-accent-arc)';
    });

    // Drag & drop on edit area
    const editArea = document.getElementById('edit-event-image-area');
    editArea.addEventListener('dragover', (e) => { e.preventDefault(); editArea.style.borderColor = 'var(--clr-accent-arc)'; });
    editArea.addEventListener('dragleave', () => { editArea.style.borderColor = ''; });
    editArea.addEventListener('drop', (e) => {
      e.preventDefault();
      editArea.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        document.getElementById('edit-event-image-file').files = dt.files;
        document.getElementById('edit-event-image-file').dispatchEvent(new Event('change'));
      }
    });

    // Remove image
    document.getElementById('edit-event-image-remove').addEventListener('click', () => {
      editRemoveEventImage = true;
      editEventImageFile = null;
      document.getElementById('edit-event-image-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 50'%3E%3Crect fill='%231a1a2e' width='80' height='50'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='14'%3E%3F%3C/text%3E%3C/svg%3E";
      document.getElementById('edit-event-image-status').textContent = 'Bild wird beim Speichern entfernt.';
      document.getElementById('edit-event-image-status').style.color = 'var(--clr-accent-pubg)';
    });

    // Save
    document.getElementById('edit-event-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('edit-event-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Speichern...';

      try {
        const eventId = document.getElementById('edit-event-id').value;
        const title = document.getElementById('edit-event-title').value.trim();
        const date = document.getElementById('edit-event-date').value;
        const game = document.getElementById('edit-event-game').value;
        const description = document.getElementById('edit-event-desc').value.trim();

        let imageUrl = ev.image || '';

        if (editEventImageFile) {
          const uploadResult = await uploadEventImage(eventId, editEventImageFile);
          imageUrl = uploadResult.url;
        } else if (editRemoveEventImage) {
          await fetch(`${EVENT_IMAGE_API}?id=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
          imageUrl = '';
        }

        const updateRes = await fetch(EVENTS_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId, title, date, game, description, image: imageUrl }),
        });
        if (!updateRes.ok) {
          const data = await updateRes.json();
          throw new Error(data.error || `HTTP ${updateRes.status}`);
        }

        closeEditEvent();
        await loadEvents();
      } catch (err) {
        alert('Fehler: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Speichern';
      }
    });
  }).catch(err => alert('Fehler beim Laden: ' + err.message));
}

function closeEditEvent() {
  const overlay = document.getElementById('edit-event-overlay');
  if (overlay) overlay.remove();
  editEventImageFile = null;
}

document.getElementById('events-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('events-submit');
  btn.disabled = true;
  btn.textContent = 'Wird gespeichert...';

  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const game = document.getElementById('event-game').value;
  const description = document.getElementById('event-desc').value.trim();

  try {
    const res = await fetch(EVENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, game, description }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const result = await res.json();
    const eventId = result.id;

    // Upload image if selected
    if (eventImageFile) {
      const uploadResult = await uploadEventImage(eventId, eventImageFile);
      // Update event with image URL
      await fetch(EVENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, image: uploadResult.url }),
      });
    }

    document.getElementById('events-form').reset();
    document.getElementById('event-image-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 50'%3E%3Crect fill='%231a1a2e' width='80' height='50'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='14'%3E%3F%3C/text%3E%3C/svg%3E";
    document.getElementById('event-image-status').textContent = '';
    eventImageFile = null;
    await loadEvents();
  } catch (err) {
    alert('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Event erstellen';
  }
});

// ══════════════════════════════════════════════════════════
// VIDEOS
// ══════════════════════════════════════════════════════════
async function loadVideos() {
  const body = document.getElementById('videos-list-body');
  body.innerHTML = '<div class="loading">Lade Videos</div>';

  try {
    const res = await fetch(VIDEOS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const videos = await res.json();
    renderVideosAdmin(videos);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler: ${err.message}</div></div>`;
  }
}

function renderVideosAdmin(videos) {
  const body = document.getElementById('videos-list-body');

  if (videos.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#127909;</div><div class="empty-state__text">Keine Videos vorhanden.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="admin-video-grid">${videos.map(v => `
    <div class="admin-video-card">
      <img class="admin-video-card__thumb" src="${escapeHtml(v.thumbnail)}" alt="${escapeHtml(v.title)}" loading="lazy">
      <div class="admin-video-card__body">
        <span class="admin-video-card__title">${escapeHtml(v.title)}</span>
        <button class="btn-delete" onclick="LGAdminDashboard.deleteVideo('${v.id}')">&#10005;</button>
      </div>
    </div>
  `).join('')}</div>`;
}

async function deleteVideo(id) {
  if (!confirm('Video wirklich löschen?')) return;
  try {
    const res = await fetch(`${VIDEOS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadVideos();
  } catch (err) {
    alert('Fehler beim Löschen: ' + err.message);
  }
}

document.getElementById('videos-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('videos-submit');
  btn.disabled = true;

  const title = document.getElementById('video-title').value.trim();
  const platform = document.getElementById('video-platform').value;
  const url = document.getElementById('video-url').value.trim();

  if (!title || !platform || !url) {
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch(VIDEOS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, url }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    document.getElementById('videos-form').reset();
    await loadVideos();
  } catch (err) {
    alert('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

// ══════════════════════════════════════════════════════════
// EVENT-ANMELDUNGEN (Event Registrations)
// ══════════════════════════════════════════════════════════
let currentEventRegistrations = [];

async function loadEventRegistrations() {
  const body = document.getElementById('evt-registrations-body');
  body.innerHTML = '<div class="loading">Lade Event-Anmeldungen</div>';

  try {
    const res = await fetch(EVT_REGISTRATIONS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentEventRegistrations = await res.json();
    renderEventRegistrations();
    updateEvtStats();
  } catch (err) {
    console.error('[Admin-EvtReg]', err);
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler beim Laden: ${err.message}</div></div>`;
  }
}

function renderEventRegistrations() {
  const body = document.getElementById('evt-registrations-body');

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
<td>${
  reg.spiel === 'PUBG'
    ? '<span class="tag tag--pubg">PUBG</span>'
    : reg.spiel === 'ARC Raiders'
      ? '<span class="tag tag--arc">ARC Raiders</span>'
      : '<span class="tag tag--both">Mixed</span>'
}</td>
<td>${escapeHtml(reg.clan || '–')}</td>
<td>${escapeHtml(reg.spielerAnzahl || '–')}</td>
<td class="app-about">${escapeHtml(truncate(reg.bemerkungen || '', 60))}</td>
<td class="app-date">${formatDate(reg.createdAt)}</td>
<td>
  <button class="btn-sm" onclick="LGAdminDashboard.showEvtDetail('${reg.id}')">Details</button>
  <button class="btn-delete" onclick="LGAdminDashboard.deleteEventRegistration('${reg.id}')">Löschen</button>
</td>

          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function updateEvtStats() {
  document.getElementById('stat-evt-total').textContent = currentEventRegistrations.length;
  document.getElementById('stat-evt-pubg').textContent = currentEventRegistrations.filter(r => r.spiel === 'PUBG').length;
  document.getElementById('stat-evt-arc').textContent = currentEventRegistrations.filter(r => r.spiel === 'ARC Raiders').length;
}

function showEvtDetail(id) {
  const reg = currentEventRegistrations.find(r => r.id === id);
  if (!reg) return;
  currentEvtModalId = id;
  currentModalId = null;

  document.getElementById('modal-title').textContent = `Event-Anmeldung: ${reg.name || 'Details'}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal__field">
      <div class="modal__label">Name / Gaming-ID</div>
      <div class="modal__value">${escapeHtml(reg.name || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">E-Mail</div>
      <div class="modal__value">${escapeHtml(reg.email || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">Spiel</div>
      <div class="modal__value">${escapeHtml(reg.spiel || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">Clan-Name</div>
      <div class="modal__value">${escapeHtml(reg.clan || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">Anzahl Spieler</div>
      <div class="modal__value">${escapeHtml(reg.spielerAnzahl || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">Bemerkungen</div>
      <div class="modal__value" style="white-space:pre-wrap;">${escapeHtml(reg.bemerkungen || '–')}</div>
    </div>
    <div class="modal__field">
      <div class="modal__label">Eingegangen am</div>
      <div class="modal__value">${formatDate(reg.createdAt)}</div>
    </div>`;

  document.getElementById('modal-overlay').classList.add('active');
}

async function deleteEventRegistration(id) {
  if (!confirm('Event-Anmeldung wirklich l\u00f6schen?')) return;

  try {
    const res = await fetch(`${EVT_REGISTRATIONS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    closeModal();
    await loadEventRegistrations();
  } catch (err) {
    alert('Fehler beim L\u00f6schen: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════
// COMMUNITY SHOUTS
// ══════════════════════════════════════════════════════════
let currentCommunityShouts = [];

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
              <button class="btn-sm" onclick="LGAdminDashboard.setCommunityShoutApproval('${shout.id}', ${!shout.approved})">
                ${shout.approved ? 'Ausblenden' : 'Freigeben'}
              </button>
              <button class="btn-delete" onclick="LGAdminDashboard.deleteCommunityShout('${shout.id}')">Löschen</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

async function setCommunityShoutApproval(id, approved) {
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

async function deleteCommunityShout(id) {
  if (!confirm('Community Shout wirklich löschen?')) return;

  try {
    const res = await fetch(`${COMMUNITY_SHOUTS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadCommunityShouts();
  } catch (err) {
    alert('Fehler beim Löschen: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '\u2026' : str;
}

function formatDate(value) {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleString('de-DE');
}

// ══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════
document.getElementById('btn-refresh').addEventListener('click', loadApplications);
document.getElementById('btn-refresh-roster').addEventListener('click', loadAdminRoster);
document.getElementById('btn-refresh-events').addEventListener('click', loadEvents);
document.getElementById('btn-refresh-videos').addEventListener('click', loadVideos);
document.getElementById('btn-refresh-evt-registrations').addEventListener('click', loadEventRegistrations);
document.getElementById('btn-refresh-community-shouts')?.addEventListener('click', loadCommunityShouts);
document.getElementById('admin-logout')?.addEventListener('click', logoutAdmin);

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('modal-delete').addEventListener('click', () => {
  if (currentEvtModalId) deleteEventRegistration(currentEvtModalId);
  else if (currentModalId) deleteApplication(currentModalId);
});
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// TWITCH STATUS CHECK (TEMPORÄR UMGEHEND – Admin Dashboard Fix)
async function checkTwitchStatus() {
  const banner = document.getElementById('twitch-admin-banner');
  if (!banner) return;
  
  // Banner verstecken + neutrale Nachricht (Twitch später fixen)
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
// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
(async function initAdminDashboard() {
  if (!(await ensureAdminSession())) return;

  loadPageData('page-bewerbungen');
  checkTwitchStatus();
  setInterval(checkTwitchStatus, 60000);
})();

window.LGAdminDashboard = {
  registerPageLoader,
  openApplicationDetails,
  deleteApplication,
  openEditEvent,
  deleteEvent,
  deleteVideo,
  showEvtDetail,
  deleteEventRegistration,
  setCommunityShoutApproval,
  deleteCommunityShout,
};
})();
