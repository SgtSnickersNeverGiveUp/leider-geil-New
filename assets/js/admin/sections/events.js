'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_MEDIA_PREVIEW = window.LG_ADMIN_MEDIA_PREVIEW || {};
const ADMIN_EVENTS_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const EVENTS_API = ADMIN_CONFIG.eventsApi || `${ADMIN_EVENTS_API_BASE}/events`;
const EVENT_IMAGE_API = ADMIN_CONFIG.eventImageApi || `${ADMIN_EVENTS_API_BASE}/event-image`;
const EVENT_IMAGE_PREVIEW_API = ADMIN_CONFIG.eventImagePreviewApi || `${ADMIN_EVENTS_API_BASE}/event-image`;
const EVENTS_PAGE_ID = 'page-events';
const EVENT_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 50'%3E%3Crect fill='%231a1a2e' width='80' height='50'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='14'%3E%3F%3C/text%3E%3C/svg%3E";

const EVENT_GAME_OPTIONS = [
  'PUBG',
  'PUBG NEWS',
  'ARC Raiders',
  'ARC Raiders NEWS',
  'NEWS',
  'Mixed',
];

let eventImageFile = null;
let editEventImageFile = null;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

function cacheBustAdminPreview(imageUrl, previewApi) {
  const value = String(imageUrl || '');
  if (!value.startsWith(previewApi)) return value;
  return `${value}${value.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`;
}

function getEventImagePreviewSrc(event) {
  const imageUrl = typeof ADMIN_MEDIA_PREVIEW.getPreviewUrl === 'function'
    ? ADMIN_MEDIA_PREVIEW.getPreviewUrl(event, 'adminImagePreviewUrl', 'image')
    : String(event?.adminImagePreviewUrl || event?.image || '');
  return cacheBustAdminPreview(imageUrl, EVENT_IMAGE_PREVIEW_API);
}

async function loadEvents() {
  const body = document.getElementById('events-list-body');
  if (!body) return;

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
  if (!body) return;

  if (events.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#128197;</div><div class="empty-state__text">Keine Events vorhanden.</div></div>`;
    return;
  }

  body.innerHTML = events.map(ev => {
    const dateStr = new Date(ev.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
    const thumbHtml = ev.image
      ? `<img class="admin-event-thumb" src="${escapeHtml(getEventImagePreviewSrc(ev))}" alt="" loading="lazy" data-admin-events-hide-on-error>`
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
          <button class="btn-sm" data-admin-events-edit="${escapeHtml(ev.id)}">&#9998;</button>
          <button class="btn-delete" data-admin-events-delete="${escapeHtml(ev.id)}">Loeschen</button>
        </div>
      </div>`;
  }).join('');
  bindEventImageFallbacks(body);
}

function bindEventImageFallbacks(container) {
  container.querySelectorAll('[data-admin-events-hide-on-error]').forEach((image) => {
    image.addEventListener('error', () => {
      image.style.display = 'none';
    }, { once: true });
  });
}

function bindEventListActions() {
  const body = document.getElementById('events-list-body');
  body?.addEventListener('click', (e) => {
    const editButton = e.target.closest('[data-admin-events-edit]');
    if (editButton) {
      openEditEvent(editButton.getAttribute('data-admin-events-edit'));
      return;
    }

    const deleteButton = e.target.closest('[data-admin-events-delete]');
    if (deleteButton) {
      deleteEvent(deleteButton.getAttribute('data-admin-events-delete'));
    }
  });
}

async function deleteEvent(id) {
  if (!confirm('Event wirklich loeschen?')) return;
  try {
    try { await fetch(`${EVENT_IMAGE_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch {}
    const res = await fetch(`${EVENTS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadEvents();
  } catch (err) {
    alert('Fehler beim Loeschen: ' + err.message);
  }
}

function openEditEvent(id) {
  fetch(EVENTS_API).then(r => r.json()).then(events => {
    const ev = events.find(x => x.id === id);
    if (!ev) { alert('Event nicht gefunden.'); return; }

    const imgSrc = ev.image
      ? escapeHtml(getEventImagePreviewSrc(ev))
      : EVENT_IMAGE_PLACEHOLDER;

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
            <div class="image-upload-area" id="edit-event-image-area">
              <img class="image-upload-area__preview" id="edit-event-image-preview" src="${imgSrc}" alt="Vorschau">
              <div class="image-upload-area__text">
                <strong>Klicken</strong> um ein neues Bild auszuwaehlen
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
    document.getElementById('edit-event-image-preview')?.addEventListener('error', (e) => {
      e.currentTarget.src = EVENT_IMAGE_PLACEHOLDER;
    }, { once: true });

    const editEventImageInput = document.getElementById('edit-event-image-file');
    editEventImageInput.addEventListener('change', (e) => {
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
        status.textContent = 'Datei zu gross (max. 5 MB).';
        status.style.color = 'var(--clr-danger)';
        return;
      }
      editEventImageFile = file;
      editRemoveEventImage = false;
      document.getElementById('edit-event-image-preview').src = URL.createObjectURL(file);
      status.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      status.style.color = 'var(--clr-accent-arc)';
    });

    const editArea = document.getElementById('edit-event-image-area');
    editArea.addEventListener('click', () => editEventImageInput.click());
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

    document.getElementById('edit-event-image-remove').addEventListener('click', () => {
      editRemoveEventImage = true;
      editEventImageFile = null;
      document.getElementById('edit-event-image-preview').src = EVENT_IMAGE_PLACEHOLDER;
      document.getElementById('edit-event-image-status').textContent = 'Bild wird beim Speichern entfernt.';
      document.getElementById('edit-event-image-status').style.color = 'var(--clr-accent-pubg)';
    });

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

function handleEventImageFileSelect(file) {
  const status = document.getElementById('event-image-status');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    status.textContent = 'Nur JPEG, PNG oder WebP erlaubt.';
    status.style.color = 'var(--clr-danger)';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = 'Datei zu gross (max. 5 MB).';
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

async function handleEventsSubmit(e) {
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

    if (eventImageFile) {
      const uploadResult = await uploadEventImage(eventId, eventImageFile);
      await fetch(EVENTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, image: uploadResult.url }),
      });
    }

    document.getElementById('events-form').reset();
    document.getElementById('event-image-preview').src = EVENT_IMAGE_PLACEHOLDER;
    document.getElementById('event-image-status').textContent = '';
    eventImageFile = null;
    await loadEvents();
  } catch (err) {
    alert('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Event erstellen';
  }
}

function registerEventImageUploadHandlers() {
  const eventImageArea = document.getElementById('event-image-area');
  const eventImageFileInput = document.getElementById('event-image-file');

  eventImageArea?.addEventListener('click', () => eventImageFileInput?.click());
  eventImageArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    eventImageArea.style.borderColor = 'var(--clr-accent-arc)';
  });
  eventImageArea?.addEventListener('dragleave', () => {
    eventImageArea.style.borderColor = '';
  });
  eventImageArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    eventImageArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) handleEventImageFileSelect(file);
  });

  eventImageFileInput?.addEventListener('change', (e) => {
    if (e.target.files[0]) handleEventImageFileSelect(e.target.files[0]);
  });
}

function registerPageLoader() {
  const registration = {
    pageId: EVENTS_PAGE_ID,
    load: loadEvents,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

document.getElementById('btn-refresh-events')?.addEventListener('click', loadEvents);
document.getElementById('events-form')?.addEventListener('submit', handleEventsSubmit);
registerEventImageUploadHandlers();
bindEventListActions();
registerPageLoader();

window.LGAdminEvents = Object.freeze({
  load: loadEvents,
  openEditEvent,
  deleteEvent,
});
})();
