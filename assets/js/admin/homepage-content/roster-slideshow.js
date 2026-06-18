'use strict';

(function () {
const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
const ADMIN_HOMEPAGE_API_BASE = ADMIN_CONFIG.apiBase || '/api/admin';
const HOMEPAGE_SETTINGS_API = ADMIN_CONFIG.homepageSettingsApi || `${ADMIN_HOMEPAGE_API_BASE}/public-settings`;
const ROSTER_API = ADMIN_CONFIG.rosterApi || `${ADMIN_HOMEPAGE_API_BASE}/roster`;

let currentRosterMembers = [];
let currentRosterSlideshowSettings = getDefaultRosterSlideshowSettings();
let initialized = false;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDefaultRosterSlideshowSettings() {
  return {
    enabled: false,
    autoplay: true,
    speedSeconds: 8,
    pinnedMemberId: '',
    members: [],
  };
}

async function loadRosterMembers() {
  try {
    const res = await fetch(ROSTER_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const members = await res.json();
    currentRosterMembers = Array.isArray(members) ? members : [];
  } catch (err) {
    console.warn('[Homepage Roster Slideshow Admin] Roster konnte nicht geladen werden:', err);
    currentRosterMembers = [];
  }
}

async function loadRosterSlideshowSettings() {
  try {
    const res = await fetch(HOMEPAGE_SETTINGS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = await res.json();
    currentRosterSlideshowSettings = normalizeRosterSlideshowSettings(settings.rosterSlideshow);
  } catch (err) {
    console.warn('[Homepage Roster Slideshow Admin] Settings konnten nicht geladen werden:', err);
    currentRosterSlideshowSettings = getDefaultRosterSlideshowSettings();
  }
}

function normalizeRosterSlideshowSettings(settings) {
  const defaults = getDefaultRosterSlideshowSettings();
  if (!settings || typeof settings !== 'object') return defaults;

  const members = Array.isArray(settings.members)
    ? settings.members
        .filter((entry) => entry && entry.id)
        .map((entry) => ({
          id: String(entry.id),
          text: String(entry.text || ''),
        }))
    : [];

  return {
    enabled: Boolean(settings.enabled),
    autoplay: settings.autoplay !== false,
    speedSeconds: Math.max(3, Number(settings.speedSeconds) || defaults.speedSeconds),
    pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : '',
    members,
  };
}

function render() {
  const selectedBody = document.getElementById('admin-homepage-roster-slideshow-selected');
  const addSelect = document.getElementById('admin-homepage-roster-slideshow-add-member');
  const pinnedSelect = document.getElementById('admin-homepage-roster-slideshow-pinned-member');
  if (!selectedBody || !addSelect || !pinnedSelect) return;

  const settings = currentRosterSlideshowSettings;
  const selectedIds = new Set(settings.members.map((entry) => entry.id));

  document.getElementById('admin-homepage-roster-slideshow-enabled').checked = settings.enabled;
  document.getElementById('admin-homepage-roster-slideshow-autoplay').checked = settings.autoplay;
  document.getElementById('admin-homepage-roster-slideshow-speed').value = settings.speedSeconds;

  addSelect.innerHTML = '<option value="">Member ausw&auml;hlen...</option>' + currentRosterMembers
    .filter((member) => !selectedIds.has(member.id))
    .map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`)
    .join('');

  pinnedSelect.innerHTML = '<option value="">Automatisch erster aktiver Member</option>' + settings.members
    .map((entry) => {
      const member = currentRosterMembers.find((item) => item.id === entry.id);
      if (!member) return '';
      const selected = settings.pinnedMemberId === entry.id ? ' selected' : '';
      return `<option value="${escapeHtml(entry.id)}"${selected}>${escapeHtml(member.name)}</option>`;
    })
    .join('');

  if (settings.members.length === 0) {
    selectedBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#9733;</div>
        <div class="empty-state__text">Noch keine Member f&uuml;r die Diashow ausgew&auml;hlt.</div>
      </div>`;
    return;
  }

  selectedBody.innerHTML = settings.members.map((entry) => {
    const member = currentRosterMembers.find((item) => item.id === entry.id);
    if (!member) return '';
    const avatarSrc = member.avatar ? escapeHtml(member.avatar) : '';
    return `
      <div class="admin-homepage-roster-slideshow__item" data-admin-homepage-slideshow-member-id="${escapeHtml(entry.id)}">
        <img class="admin-homepage-roster-slideshow__avatar" src="${avatarSrc}" alt="${escapeHtml(member.name)}" loading="lazy"
             onerror="this.style.display='none'">
        <div>
          <div class="admin-homepage-roster-slideshow__name">${escapeHtml(member.name)}</div>
          <div class="admin-homepage-roster-slideshow__meta">${escapeHtml(member.clanRole || member.role || 'Member')}</div>
          <label class="admin-form__label" for="admin-homepage-slideshow-text-${escapeHtml(entry.id)}">Diashow-Text</label>
          <textarea class="admin-form__textarea admin-homepage-roster-slideshow__text"
                    id="admin-homepage-slideshow-text-${escapeHtml(entry.id)}"
                    data-admin-homepage-slideshow-text="${escapeHtml(entry.id)}"
                    maxlength="180"
                    placeholder="z.B. Alles Gute zum Geburtstag oder Willkommen im Clan!">${escapeHtml(entry.text)}</textarea>
        </div>
        <button type="button" class="btn-delete" data-admin-homepage-slideshow-remove="${escapeHtml(entry.id)}">Entfernen</button>
      </div>`;
  }).join('');
}

function addRosterSlideshowMember() {
  const select = document.getElementById('admin-homepage-roster-slideshow-add-member');
  const memberId = select?.value;
  if (!memberId) return;

  currentRosterSlideshowSettings = collectRosterSlideshowSettingsFromForm();
  if (currentRosterSlideshowSettings.members.some((entry) => entry.id === memberId)) return;

  currentRosterSlideshowSettings.members.push({ id: memberId, text: '' });
  render();
}

function removeRosterSlideshowMember(memberId) {
  currentRosterSlideshowSettings = collectRosterSlideshowSettingsFromForm();
  currentRosterSlideshowSettings.members = currentRosterSlideshowSettings.members
    .filter((entry) => entry.id !== memberId);
  if (currentRosterSlideshowSettings.pinnedMemberId === memberId) {
    currentRosterSlideshowSettings.pinnedMemberId = '';
  }
  render();
}

function collectRosterSlideshowSettingsFromForm() {
  const textFields = document.querySelectorAll('[data-admin-homepage-slideshow-text]');
  const textById = new Map([...textFields].map((field) => [field.dataset.adminHomepageSlideshowText, field.value.trim()]));
  const speed = Number(document.getElementById('admin-homepage-roster-slideshow-speed')?.value) || 8;

  return {
    enabled: Boolean(document.getElementById('admin-homepage-roster-slideshow-enabled')?.checked),
    autoplay: Boolean(document.getElementById('admin-homepage-roster-slideshow-autoplay')?.checked),
    speedSeconds: Math.max(3, speed),
    pinnedMemberId: document.getElementById('admin-homepage-roster-slideshow-pinned-member')?.value || '',
    members: currentRosterSlideshowSettings.members.map((entry) => ({
      id: entry.id,
      text: textById.get(entry.id) || '',
    })),
  };
}

async function saveRosterSlideshowSettings() {
  const btn = document.getElementById('admin-homepage-roster-slideshow-save');
  const status = document.getElementById('admin-homepage-roster-slideshow-status');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Speichert...';
  if (status) status.textContent = '';

  try {
    const rosterSlideshow = collectRosterSlideshowSettingsFromForm();
    const res = await fetch(HOMEPAGE_SETTINGS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rosterSlideshow }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    currentRosterSlideshowSettings = rosterSlideshow;
    if (status) {
      status.textContent = 'Diashow gespeichert.';
      status.style.color = 'var(--clr-accent-arc)';
    }

    render();
  } catch (err) {
    if (status) {
      status.textContent = 'Fehler beim Speichern: ' + err.message;
      status.style.color = 'var(--clr-danger)';
    } else {
      alert('Fehler beim Speichern: ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Diashow speichern';
  }
}

function initEventListeners() {
  if (initialized) return;

  const addButton = document.getElementById('admin-homepage-roster-slideshow-add');
  const form = document.getElementById('admin-homepage-roster-slideshow-form');
  const refreshButton = document.getElementById('admin-homepage-refresh-roster-slideshow');
  const selectedList = document.getElementById('admin-homepage-roster-slideshow-selected');
  if (!addButton || !form || !selectedList) return;

  initialized = true;
  addButton.addEventListener('click', addRosterSlideshowMember);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRosterSlideshowSettings();
  });
  refreshButton?.addEventListener('click', load);
  selectedList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-admin-homepage-slideshow-remove]');
    if (!btn) return;
    removeRosterSlideshowMember(btn.dataset.adminHomepageSlideshowRemove);
  });
}

async function load() {
  initEventListeners();
  await Promise.all([
    loadRosterMembers(),
    loadRosterSlideshowSettings(),
  ]);
  render();
}

document.addEventListener('lg-admin-roster:loaded', (e) => {
  if (!Array.isArray(e.detail?.members)) return;
  currentRosterMembers = e.detail.members;
  render();
});

window.LGAdminHomepageRosterSlideshow = {
  load,
};
})();
