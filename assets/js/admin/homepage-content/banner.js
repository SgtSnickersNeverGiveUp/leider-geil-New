'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_HOMEPAGE_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const HOMEPAGE_SETTINGS_API = ADMIN_CONFIG.homepageSettingsApi || `${ADMIN_HOMEPAGE_API_BASE}/public-settings`;
const BANNER_IMAGE_API = ADMIN_CONFIG.bannerImageApi || `${ADMIN_HOMEPAGE_API_BASE}/banner-image`;
const BANNER_IMAGE_PREVIEW_API = ADMIN_CONFIG.bannerImagePreviewApi || '/api/banner-image';

let currentBannerTab = 'url';
let initialized = false;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setBannerTab(tab) {
  currentBannerTab = tab;
  document.querySelectorAll('.banner-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('banner-tab-url').style.display = tab === 'url' ? '' : 'none';
  document.getElementById('banner-tab-upload').style.display = tab === 'upload' ? '' : 'none';
}

async function loadBannerSettings() {
  const body = document.getElementById('banner-preview-body');
  if (!body) return;
  body.innerHTML = '<div class="loading">Lade Banner</div>';

  try {
    const res = await fetch(HOMEPAGE_SETTINGS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = await res.json();

    if (settings.bannerUrl) {
      const imgUrl = settings.bannerUrl === BANNER_IMAGE_PREVIEW_API
        ? settings.bannerUrl + '?t=' + Date.now()
        : settings.bannerUrl;

      body.innerHTML = `
        <div class="banner-preview-container">
          <span class="banner-preview-label">1920 &times; 600</span>
          <img src="${escapeHtml(imgUrl)}" alt="Header Banner" onerror="this.parentElement.innerHTML='<div class=\\'empty-state\\'><div class=\\'empty-state__icon\\'>&#9888;</div><div class=\\'empty-state__text\\'>Bild konnte nicht geladen werden.</div></div>'">
        </div>
        <p style="font-family:var(--ff-mono);font-size:.75rem;color:var(--clr-text-muted);margin-top:.75rem;">
          Quelle: ${escapeHtml(settings.bannerUrl)}
        </p>`;

      if (settings.bannerUrl !== BANNER_IMAGE_PREVIEW_API) {
        document.getElementById('banner-url').value = settings.bannerUrl;
      }
    } else {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">&#128444;</div>
          <div class="empty-state__text">Kein Banner konfiguriert. Verwende das Formular oben, um ein Banner hinzuzuf&uuml;gen.</div>
        </div>`;
    }
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler: ${err.message}</div></div>`;
  }
}

async function saveBanner(e) {
  e.preventDefault();
  const btn = document.getElementById('banner-submit');
  btn.disabled = true;

  try {
    let bannerUrl = '';

    if (currentBannerTab === 'url') {
      bannerUrl = document.getElementById('banner-url').value.trim();
      if (!bannerUrl) {
        alert('Bitte eine Bild-URL eingeben.');
        btn.disabled = false;
        return;
      }
    } else {
      const fileInput = document.getElementById('banner-file');
      const file = fileInput.files[0];
      if (!file) {
        alert('Bitte eine Datei auswaehlen.');
        btn.disabled = false;
        return;
      }

      const statusEl = document.getElementById('banner-upload-status');
      statusEl.textContent = 'Lade hoch...';
      statusEl.style.color = 'var(--clr-accent-arc)';

      const uploadRes = await fetch(BANNER_IMAGE_API, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || `Upload fehlgeschlagen (HTTP ${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      bannerUrl = uploadData.url;
      statusEl.textContent = 'Upload erfolgreich!';
    }

    const res = await fetch(HOMEPAGE_SETTINGS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl }),
    });

    if (!res.ok) throw new Error('Speichern fehlgeschlagen');

    await loadBannerSettings();
    alert('Banner erfolgreich gespeichert! Die Aenderung ist sofort auf der Startseite sichtbar.');
  } catch (err) {
    alert('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function removeBanner() {
  if (!confirm('Banner wirklich entfernen?')) return;

  try {
    const res = await fetch(HOMEPAGE_SETTINGS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: '' }),
    });

    if (!res.ok) throw new Error('Fehler beim Entfernen');
    document.getElementById('banner-url').value = '';
    document.getElementById('banner-file').value = '';
    await loadBannerSettings();
    alert('Banner wurde entfernt.');
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
}

function initEventListeners() {
  if (initialized) return;
  initialized = true;

  document.querySelectorAll('.banner-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setBannerTab(btn.dataset.tab));
  });
  document.getElementById('banner-form')?.addEventListener('submit', saveBanner);
  document.getElementById('banner-remove')?.addEventListener('click', removeBanner);
  document.getElementById('btn-refresh-banner')?.addEventListener('click', loadBannerSettings);
}

async function load() {
  initEventListeners();
  await loadBannerSettings();
}

window.LGAdminHomepageBanner = {
  load,
};
})();
