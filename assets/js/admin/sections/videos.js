'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_VIDEOS_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const VIDEOS_API = ADMIN_CONFIG.videosApi || `${ADMIN_VIDEOS_API_BASE}/videos`;
const VIDEOS_PAGE_ID = 'page-videos';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadVideos() {
  const body = document.getElementById('videos-list-body');
  if (!body) return;

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
  if (!body) return;

  if (videos.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#127909;</div><div class="empty-state__text">Keine Videos vorhanden.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="admin-video-grid">${videos.map(v => `
    <div class="admin-video-card">
      <img class="admin-video-card__thumb" src="${escapeHtml(v.thumbnail)}" alt="${escapeHtml(v.title)}" loading="lazy">
      <div class="admin-video-card__body">
        <span class="admin-video-card__title">${escapeHtml(v.title)}</span>
        <button class="btn-delete" data-admin-videos-delete="${escapeHtml(v.id)}">&#10005;</button>
      </div>
    </div>
  `).join('')}</div>`;
}

async function deleteVideo(id) {
  if (!confirm('Video wirklich loeschen?')) return;
  try {
    const res = await fetch(`${VIDEOS_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadVideos();
  } catch (err) {
    alert('Fehler beim Loeschen: ' + err.message);
  }
}

async function handleVideosSubmit(e) {
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
}

function bindVideoListActions() {
  const body = document.getElementById('videos-list-body');
  body?.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('[data-admin-videos-delete]');
    if (!deleteButton) return;
    deleteVideo(deleteButton.getAttribute('data-admin-videos-delete'));
  });
}

function registerPageLoader() {
  const registration = {
    pageId: VIDEOS_PAGE_ID,
    load: loadVideos,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

document.getElementById('btn-refresh-videos')?.addEventListener('click', loadVideos);
document.getElementById('videos-form')?.addEventListener('submit', handleVideosSubmit);
bindVideoListActions();
registerPageLoader();

window.LGAdminVideos = Object.freeze({
  load: loadVideos,
  deleteVideo,
});
})();
