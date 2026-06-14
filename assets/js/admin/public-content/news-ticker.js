'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_PUBLIC_CONTENT_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const NEWS_API_URL = ADMIN_CONFIG.newsApi || `${ADMIN_PUBLIC_CONTENT_API_BASE}/news`;
const PUBLIC_CONTENT_SETTINGS_API = ADMIN_CONFIG.publicContentSettingsApi || `${ADMIN_PUBLIC_CONTENT_API_BASE}/public-settings`;

let currentNews = [];
let initialized = false;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadTickerSettings() {
  try {
    const res = await fetch(PUBLIC_CONTENT_SETTINGS_API);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const settings = await res.json();

    const speedInput = document.getElementById('ticker-speed');
    const sepInput = document.getElementById('ticker-separator');

    if (speedInput) speedInput.value = settings.tickerSpeedSeconds ?? 40;
    if (sepInput) sepInput.value = settings.tickerSeparator ?? '   \u25cf   ';
  } catch (err) {
    console.error('Ticker Settings laden fehlgeschlagen:', err);
  }
}

async function loadNewsIntoAdmin() {
  const listEl = document.getElementById('news-list');
  const statusEl = document.getElementById('news-status');
  if (!listEl) return;

  if (statusEl) statusEl.textContent = 'Lade News...';
  try {
    const res = await fetch(NEWS_API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentNews = Array.isArray(data) ? data : [];
    renderNewsAdmin();
    if (statusEl) statusEl.textContent = '';
  } catch (err) {
    console.error('[News Admin] load', err);
    if (statusEl) statusEl.textContent = 'Fehler beim Laden der News.';
  }
}

function renderNewsAdmin() {
  const listEl = document.getElementById('news-list');
  if (!listEl) return;

  listEl.innerHTML = currentNews.map((item, i) => {
    const type = item.type || 'info';
    return `
      <div class="admin-form__group news-item">
        <label class="admin-form__label">Eintrag ${i + 1}</label>
        <div style="display:flex;flex-direction:column;gap:.25rem;">
          <textarea class="admin-form__textarea"
                    data-index="${i}"
                    rows="2"
                    placeholder="Ticker-Text...">${escapeHtml(item.text || '')}</textarea>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <select class="admin-form__select" data-type-index="${i}">
              <option value="birthday" ${type === 'birthday' ? 'selected' : ''}>Birthday</option>
              <option value="member" ${type === 'member' ? 'selected' : ''}>Member</option>
              <option value="event" ${type === 'event' ? 'selected' : ''}>Event</option>
              <option value="info" ${type === 'info' ? 'selected' : ''}>Info</option>
              <option value="ranked" ${type === 'ranked' ? 'selected' : ''}>Ranked</option>
            </select>
            <button type="button"
                    class="btn-sm btn-sm--danger"
                    data-news-remove="${i}">L&ouml;schen</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initEventListeners() {
  if (initialized) return;

  const addBtn = document.getElementById('news-add');
  const saveBtn = document.getElementById('news-save');
  const listEl = document.getElementById('news-list');
  const refreshBtn = document.getElementById('btn-refresh-news');
  const statusEl = document.getElementById('news-status');
  if (!addBtn || !saveBtn || !listEl) return;

  initialized = true;

  addBtn.addEventListener('click', () => {
    currentNews.push({ text: '', type: 'info' });
    renderNewsAdmin();
  });

  listEl.addEventListener('input', (e) => {
    const idx = e.target.getAttribute('data-index');
    if (idx !== null && currentNews[Number(idx)]) {
      currentNews[Number(idx)].text = e.target.value;
    }
  });

  listEl.addEventListener('change', (e) => {
    const idx = e.target.getAttribute('data-type-index');
    if (idx !== null && currentNews[Number(idx)]) {
      currentNews[Number(idx)].type = e.target.value;
    }
  });

  listEl.addEventListener('click', (e) => {
    const idx = e.target.getAttribute('data-news-remove');
    if (idx !== null) {
      currentNews.splice(Number(idx), 1);
      renderNewsAdmin();
    }
  });

  saveBtn.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = 'Speichern...';

    const speedInput = document.getElementById('ticker-speed');
    const sepInput = document.getElementById('ticker-separator');
    const tickerSpeedSeconds = speedInput ? Number(speedInput.value) || 40 : 40;
    const tickerSeparator = sepInput ? (sepInput.value || '   \u25cf   ') : '   \u25cf   ';

    try {
      const resNews = await fetch(NEWS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentNews),
      });
      if (!resNews.ok) throw new Error('News HTTP ' + resNews.status);

      const resSettings = await fetch(PUBLIC_CONTENT_SETTINGS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickerSpeedSeconds,
          tickerSeparator,
        }),
      });
      if (!resSettings.ok) throw new Error('Settings HTTP ' + resSettings.status);

      if (statusEl) statusEl.textContent = 'Gespeichert';
    } catch (err) {
      console.error('News/Ticker save', err);
      if (statusEl) statusEl.textContent = 'Fehler beim Speichern';
    }
  });

  refreshBtn?.addEventListener('click', load);
}

async function load() {
  initEventListeners();
  await loadTickerSettings();
  await loadNewsIntoAdmin();
}

window.LGAdminPublicNewsTicker = {
  load,
};
})();
