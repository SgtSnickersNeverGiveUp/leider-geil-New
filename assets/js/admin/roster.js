'use strict';

(function () {
const ADMIN_ROSTER_API_BASE = '/api/admin';
const ROSTER_API = `${ADMIN_ROSTER_API_BASE}/roster`;
const ROSTER_AVATAR_API = `${ADMIN_ROSTER_API_BASE}/roster-avatar`;
const ROSTER_SETTINGS_API = `${ADMIN_ROSTER_API_BASE}/settings`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════════════════════
// CLAN ROSTER
// ══════════════════════════════════════════════════════════
let rosterAvatarFile = null;
let editAvatarFile = null;
let currentRosterSlideshowSettings = getDefaultRosterSlideshowSettings();

// Drag & drop support for new member form
const rosterAvatarArea = document.getElementById('roster-avatar-area');
rosterAvatarArea.addEventListener('dragover', (e) => { e.preventDefault(); rosterAvatarArea.style.borderColor = 'var(--clr-accent-arc)'; });
rosterAvatarArea.addEventListener('dragleave', () => { rosterAvatarArea.style.borderColor = ''; });
rosterAvatarArea.addEventListener('drop', (e) => {
  e.preventDefault();
  rosterAvatarArea.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) handleAvatarFileSelect(file);
});

document.getElementById('roster-avatar-file').addEventListener('change', (e) => {
  if (e.target.files[0]) handleAvatarFileSelect(e.target.files[0]);
});

function handleAvatarFileSelect(file) {
  const status = document.getElementById('roster-avatar-status');
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
  rosterAvatarFile = file;
  const preview = document.getElementById('roster-avatar-preview');
  preview.src = URL.createObjectURL(file);
  status.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
  status.style.color = 'var(--clr-accent-arc)';
}

async function uploadAvatar(memberId, file) {
  const res = await fetch(`${ROSTER_AVATAR_API}?id=${encodeURIComponent(memberId)}`, {
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

async function loadRoster() {
  const body = document.getElementById('roster-list-body');
  body.innerHTML = '<div class="loading">Lade Roster</div>';

  try {
    const res = await fetch(ROSTER_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const members = await res.json();
    currentRosterMembers = members;
    renderRosterAdmin(members);
    await renderRosterSlideshowAdmin(members);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><div class="empty-state__text">Fehler: ${err.message}</div></div>`;
  }
}

function renderRosterAdmin(members) {
  const body = document.getElementById('roster-list-body');

  if (members.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#128101;</div><div class="empty-state__text">Keine Mitglieder vorhanden.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="admin-roster-grid">${members.map(m => {
    const avatarSrc = m.avatar ? escapeHtml(m.avatar) + (m.avatar.startsWith('/api/roster-avatar') ? '&t=' + Math.floor(Date.now() / 60000) : '') : '';

    const gamesHtml = (m.games || []).map(g => {
      const cls = g === 'PUBG' ? 'pubg' : g === 'ARC Raiders' ? 'arc' : 'other';
      return `<span class="admin-roster-card__tag admin-roster-card__tag--${cls}">${escapeHtml(g)}</span>`;
    }).join('');

    // Nur anzeigen, wenn clanRole vorhanden UND anders als role
    const showClanRole = m.clanRole && m.clanRole !== m.role;
    const clanRoleHtml = showClanRole
      ? `<div class="admin-roster-card__clan-role">${escapeHtml(m.clanRole)}</div>`
      : '';

    const bioHtml = m.bio ? `<div class="admin-roster-card__bio">${escapeHtml(m.bio)}</div>` : '';
    const funTagsHtml = (m.funTags || []).length > 0
      ? `<div class="admin-roster-card__fun-tags">${m.funTags.map(t => `<span class="admin-roster-card__fun-tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    return `
    <div class="admin-roster-card" data-id="${escapeHtml(m.id)}">
      <button class="btn-sm admin-roster-card__edit" onclick="LGAdminRoster.openEditMember('${escapeHtml(m.id)}')">&#9998;</button>
      <button class="btn-delete admin-roster-card__delete" onclick="LGAdminRoster.deleteRosterMember('${escapeHtml(m.id)}')">&#10005;</button>
      <img class="admin-roster-cardavatar" src="${avatarSrc}" alt="${escapeHtml(m.name)}" loading="lazy"
     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 80 80%27%3E%3Crect fill=%27%231a1a2e%27 width=%2780%27 height=%2780%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 text-anchor=%27middle%27 fill=%27%237a7a8e%27 font-size=%2724%27%3E${escapeHtml(m.name.slice(0,2).toUpperCase())}%3C/text%3E%3C/svg%3E'">
      <div class="admin-roster-card__name">${escapeHtml(m.name)}</div>
      <div class="admin-roster-card__role">
  ${escapeHtml(m.clanRole || m.role || '')}
</div>
      <div class="admin-roster-card__games">${gamesHtml}</div>
      ${funTagsHtml}
      ${bioHtml}
    </div>`;
  }).join('')}</div>`;
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

async function loadRosterSlideshowSettings() {
  try {
    const res = await fetch(ROSTER_SETTINGS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = await res.json();
    currentRosterSlideshowSettings = normalizeRosterSlideshowSettings(settings.rosterSlideshow);
  } catch (err) {
    console.warn('[Roster Slideshow Admin] Settings konnten nicht geladen werden:', err);
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

async function renderRosterSlideshowAdmin(members, reloadSettings = true) {
  const selectedBody = document.getElementById('roster-slideshow-selected');
  const addSelect = document.getElementById('roster-slideshow-add-member');
  const pinnedSelect = document.getElementById('roster-slideshow-pinned-member');
  if (!selectedBody || !addSelect || !pinnedSelect) return;

  if (reloadSettings) await loadRosterSlideshowSettings();
  const settings = currentRosterSlideshowSettings;
  const selectedIds = new Set(settings.members.map((entry) => entry.id));

  document.getElementById('roster-slideshow-enabled').checked = settings.enabled;
  document.getElementById('roster-slideshow-autoplay').checked = settings.autoplay;
  document.getElementById('roster-slideshow-speed').value = settings.speedSeconds;

  addSelect.innerHTML = '<option value="">Member ausw&auml;hlen...</option>' + members
    .filter((member) => !selectedIds.has(member.id))
    .map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`)
    .join('');

  pinnedSelect.innerHTML = '<option value="">Automatisch erster aktiver Member</option>' + settings.members
    .map((entry) => {
      const member = members.find((item) => item.id === entry.id);
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
    const member = members.find((item) => item.id === entry.id);
    if (!member) return '';
    const avatarSrc = member.avatar ? escapeHtml(member.avatar) : '';
    return `
      <div class="roster-slideshow-admin__item" data-slideshow-member-id="${escapeHtml(entry.id)}">
        <img class="roster-slideshow-admin__avatar" src="${avatarSrc}" alt="${escapeHtml(member.name)}" loading="lazy"
             onerror="this.style.display='none'">
        <div>
          <div class="roster-slideshow-admin__name">${escapeHtml(member.name)}</div>
          <div class="roster-slideshow-admin__meta">${escapeHtml(member.clanRole || member.role || 'Member')}</div>
          <label class="admin-form__label" for="slideshow-text-${escapeHtml(entry.id)}">Diashow-Text</label>
          <textarea class="admin-form__textarea roster-slideshow-text"
                    id="slideshow-text-${escapeHtml(entry.id)}"
                    data-slideshow-text="${escapeHtml(entry.id)}"
                    maxlength="180"
                    placeholder="z.B. Alles Gute zum Geburtstag oder Willkommen im Clan!">${escapeHtml(entry.text)}</textarea>
        </div>
        <button type="button" class="btn-delete" data-slideshow-remove="${escapeHtml(entry.id)}">Entfernen</button>
      </div>`;
  }).join('');
}

function addRosterSlideshowMember() {
  const select = document.getElementById('roster-slideshow-add-member');
  const memberId = select?.value;
  if (!memberId) return;
  currentRosterSlideshowSettings = collectRosterSlideshowSettingsFromForm();
  if (currentRosterSlideshowSettings.members.some((entry) => entry.id === memberId)) return;

  currentRosterSlideshowSettings.members.push({ id: memberId, text: '' });
  renderRosterSlideshowAdmin(currentRosterMembers, false);
}

function removeRosterSlideshowMember(memberId) {
  currentRosterSlideshowSettings = collectRosterSlideshowSettingsFromForm();
  currentRosterSlideshowSettings.members = currentRosterSlideshowSettings.members
    .filter((entry) => entry.id !== memberId);
  if (currentRosterSlideshowSettings.pinnedMemberId === memberId) {
    currentRosterSlideshowSettings.pinnedMemberId = '';
  }
  renderRosterSlideshowAdmin(currentRosterMembers, false);
}

function collectRosterSlideshowSettingsFromForm() {
  const textFields = document.querySelectorAll('[data-slideshow-text]');
  const textById = new Map([...textFields].map((field) => [field.dataset.slideshowText, field.value.trim()]));
  const speed = Number(document.getElementById('roster-slideshow-speed')?.value) || 8;

  return {
    enabled: Boolean(document.getElementById('roster-slideshow-enabled')?.checked),
    autoplay: Boolean(document.getElementById('roster-slideshow-autoplay')?.checked),
    speedSeconds: Math.max(3, speed),
    pinnedMemberId: document.getElementById('roster-slideshow-pinned-member')?.value || '',
    members: currentRosterSlideshowSettings.members.map((entry) => ({
      id: entry.id,
      text: textById.get(entry.id) || '',
    })),
  };
}

async function saveRosterSlideshowSettings() {
  const btn = document.getElementById('roster-slideshow-save');
  const status = document.getElementById('roster-slideshow-status');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Speichert...';
  if (status) status.textContent = '';

  try {
    const rosterSlideshow = collectRosterSlideshowSettingsFromForm();
    const res = await fetch(ROSTER_SETTINGS_API, {
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
    await loadRoster();
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

// Store all members for edit lookups
let currentRosterMembers = [];

async function loadRosterForEdit() {
  try {
    const res = await fetch(ROSTER_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentRosterMembers = await res.json();
  } catch { currentRosterMembers = []; }
}

function openEditMember(id) {
  // Fetch latest data first
  fetch(ROSTER_API).then(r => r.json()).then(members => {
    currentRosterMembers = members;
    const m = members.find(x => x.id === id);
    if (!m) { alert('Mitglied nicht gefunden.'); return; }

    const avatarSrc = m.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%231a1a2e' width='64' height='64'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='22'%3E%3F%3C/text%3E%3C/svg%3E";
    const games = m.games || [];
    const clanRole = m.clanRole || 'Member';
    const bio = m.bio || '';
    const funTags = (m.funTags || []).join(', ');

    // Build custom game checkboxes for any game not in the default list
    const defaultGames = ['PUBG', 'ARC Raiders'];
    const customGames = games.filter(g => !defaultGames.includes(g));
    const customGamesCheckboxes = customGames.map(g =>
      `<label><input type="checkbox" name="edit-games" value="${escapeHtml(g)}" checked> ${escapeHtml(g)}</label>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'edit-member-overlay';
    overlay.innerHTML = `
      <div class="edit-modal">
        <div class="edit-modal__title">Mitglied bearbeiten</div>
        <form class="admin-form" id="edit-member-form">
          <input type="hidden" id="edit-member-id" value="${escapeHtml(m.id)}">
          <div class="admin-form__section">// Basis-Info</div>
          <div class="admin-form__group">
            <label class="admin-form__label">Name</label>
            <input class="admin-form__input" type="text" id="edit-member-name" value="${escapeHtml(m.name)}" required>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Rang im Clan</label>
            <select class="admin-form__input admin-form__select" id="edit-member-clan-role">
              <option value="Leader" ${clanRole === 'Leader' ? 'selected' : ''}>Leader</option>
              <option value="Co-Leader" ${clanRole === 'Co-Leader' ? 'selected' : ''}>Co-Leader</option>
              <option value="Officer" ${clanRole === 'Officer' ? 'selected' : ''}>Officer</option>
              <option value="Member" ${clanRole === 'Member' ? 'selected' : ''}>Member</option>
              <option value="Recruit" ${clanRole === 'Recruit' ? 'selected' : ''}>Recruit</option>
            </select>
          </div>
          <div class="admin-form__section">// Spiele &amp; Steckbrief</div>
          <div class="admin-form__group">
            <label class="admin-form__label">Hauptspiele</label>
            <div class="games-checkboxes" id="edit-games-checkboxes">
              <label><input type="checkbox" name="edit-games" value="PUBG" ${games.includes('PUBG') ? 'checked' : ''}> PUBG</label>
              <label><input type="checkbox" name="edit-games" value="ARC Raiders" ${games.includes('ARC Raiders') ? 'checked' : ''}> ARC Raiders</label>
              ${customGamesCheckboxes}
            </div>
            <div class="custom-game-row">
              <input class="admin-form__input" type="text" id="edit-custom-game" placeholder="Weiteres Spiel hinzufügen…">
              <button type="button" class="btn-sm" onclick="LGAdminRoster.addCustomGame('edit')">+</button>
            </div>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Kurzbeschreibung / Bio</label>
            <textarea class="admin-form__textarea" id="edit-member-bio" maxlength="300">${escapeHtml(bio)}</textarea>
          </div>
          <div class="admin-form__group">
            <label class="admin-form__label">Fun-Tags (kommagetrennt)</label>
            <input class="admin-form__input" type="text" id="edit-member-fun-tags" value="${escapeHtml(funTags)}">
          </div>
          <div class="admin-form__section">// Profilbild</div>
          <div class="admin-form__group">
            <label class="admin-form__label">Profilbild</label>
            <div class="admin-form__hint">Empfehlung: Quadratisch oder 4:5, ca. 500–800 px breit.</div>
            <div class="avatar-upload-area" id="edit-avatar-area" onclick="document.getElementById('edit-avatar-file').click()">
              <img class="avatar-upload-area__preview" id="edit-avatar-preview" src="${escapeHtml(avatarSrc)}" alt="Vorschau"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect fill=%27%231a1a2e%27 width=%2764%27 height=%2764%27/%3E%3Ctext x=%2750%25%27 y=%2755%25%27 text-anchor=%27middle%27 fill=%27%237a7a8e%27 font-size=%2722%27%3E%3F%3C/text%3E%3C/svg%3E'">
              <div class="avatar-upload-area__text">
                <strong>Klicken</strong> um ein neues Bild auszuwählen
              </div>
            </div>
            <input type="file" id="edit-avatar-file" accept="image/jpeg,image/png,image/webp" style="display:none">
            <div class="avatar-upload-status" id="edit-avatar-status"></div>
            <div class="avatar-upload-actions">
              <button type="button" class="btn-sm" id="edit-avatar-remove" style="color:var(--clr-danger);border-color:var(--clr-danger);">Bild entfernen</button>
            </div>
          </div>
          <div class="edit-modal__footer">
            <button type="submit" class="admin-form__submit" id="edit-member-save">Speichern</button>
            <button type="button" class="btn-sm" id="edit-member-cancel">Abbrechen</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);
    editAvatarFile = null;
    let editRemoveAvatar = false;

    // Close on overlay click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeEditModal(); });
    document.getElementById('edit-member-cancel').addEventListener('click', closeEditModal);

    // File select
    document.getElementById('edit-avatar-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const status = document.getElementById('edit-avatar-status');
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
      editAvatarFile = file;
      editRemoveAvatar = false;
      document.getElementById('edit-avatar-preview').src = URL.createObjectURL(file);
      status.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      status.style.color = 'var(--clr-accent-arc)';
    });

    // Drag & drop on edit area
    const editArea = document.getElementById('edit-avatar-area');
    editArea.addEventListener('dragover', (e) => { e.preventDefault(); editArea.style.borderColor = 'var(--clr-accent-arc)'; });
    editArea.addEventListener('dragleave', () => { editArea.style.borderColor = ''; });
    editArea.addEventListener('drop', (e) => {
      e.preventDefault();
      editArea.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) {
        // Trigger the same logic as file input change
        const dt = new DataTransfer();
        dt.items.add(file);
        document.getElementById('edit-avatar-file').files = dt.files;
        document.getElementById('edit-avatar-file').dispatchEvent(new Event('change'));
      }
    });

    // Remove avatar
    document.getElementById('edit-avatar-remove').addEventListener('click', () => {
      editRemoveAvatar = true;
      editAvatarFile = null;
      document.getElementById('edit-avatar-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%231a1a2e' width='64' height='64'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='22'%3E%3F%3C/text%3E%3C/svg%3E";
      document.getElementById('edit-avatar-status').textContent = 'Bild wird beim Speichern entfernt.';
      document.getElementById('edit-avatar-status').style.color = 'var(--clr-accent-pubg)';
    });

    // Save
    document.getElementById('edit-member-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('edit-member-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Speichern...';

      try {
        const memberId = document.getElementById('edit-member-id').value;
        const name = document.getElementById('edit-member-name').value.trim();
        const editGames = [...document.querySelectorAll('input[name="edit-games"]:checked')].map(c => c.value);
        const editClanRole = document.getElementById('edit-member-clan-role').value;
        const editBio = document.getElementById('edit-member-bio').value.trim();
        const editFunTags = document.getElementById('edit-member-fun-tags').value.split(',').map(t => t.trim()).filter(Boolean);

        let avatarUrl = m.avatar;

        // Upload new avatar if selected
        if (editAvatarFile) {
          const uploadResult = await uploadAvatar(memberId, editAvatarFile);
          avatarUrl = uploadResult.url;
        } else if (editRemoveAvatar) {
          // Delete avatar from store
          await fetch(`${ROSTER_AVATAR_API}?id=${encodeURIComponent(memberId)}`, { method: 'DELETE' });
          avatarUrl = `https://via.placeholder.com/160/1a1a2e/0FF2A9?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`;
        }

        // Update member data
        const updateRes = await fetch(ROSTER_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: memberId, name, avatar: avatarUrl, games: editGames, clanRole: editClanRole, bio: editBio, funTags: editFunTags }),
        });
        if (!updateRes.ok) {
          const data = await updateRes.json();
          throw new Error(data.error || `HTTP ${updateRes.status}`);
        }

        closeEditModal();
        await loadRoster();
      } catch (err) {
        alert('Fehler: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Speichern';
      }
    });
  }).catch(err => alert('Fehler beim Laden: ' + err.message));
}

function closeEditModal() {
  const overlay = document.getElementById('edit-member-overlay');
  if (overlay) overlay.remove();
  editAvatarFile = null;
}

async function deleteRosterMember(id) {
  if (!confirm('Mitglied wirklich entfernen?')) return;
  try {
    // Delete avatar too
    try { await fetch(`${ROSTER_AVATAR_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch {}
    const res = await fetch(`${ROSTER_API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadRoster();
  } catch (err) {
    alert('Fehler beim Löschen: ' + err.message);
  }
}

// Add custom game checkbox dynamically
function addCustomGame(prefix) {
  const input = document.getElementById(`${prefix}-custom-game`);
  const gameName = input.value.trim();
  if (!gameName) return;
  const container = document.getElementById(`${prefix}-games-checkboxes`);
  const checkboxName = prefix === 'edit' ? 'edit-games' : 'roster-games';
  // Avoid duplicates
  const existing = [...container.querySelectorAll(`input[name="${checkboxName}"]`)].map(c => c.value.toLowerCase());
  if (existing.includes(gameName.toLowerCase())) { input.value = ''; return; }
  const label = document.createElement('label');
  label.innerHTML = `<input type="checkbox" name="${checkboxName}" value="${escapeHtml(gameName)}" checked> ${escapeHtml(gameName)}`;
  container.appendChild(label);
  input.value = '';
}

document.getElementById('roster-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('roster-submit');
  btn.disabled = true;
  btn.textContent = 'Wird gespeichert...';

  const name = document.getElementById('roster-name').value.trim();
  const role = document.getElementById('roster-role').value.trim();
  const games = [...document.querySelectorAll('input[name="roster-games"]:checked')].map(c => c.value);
  const clanRole = document.getElementById('roster-clan-role').value;
  const bio = document.getElementById('roster-bio').value.trim();
  const funTags = document.getElementById('roster-fun-tags').value.split(',').map(t => t.trim()).filter(Boolean);

  try {
    // Create member first (to get ID)
    const res = await fetch(ROSTER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, games, clanRole, bio, funTags }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const result = await res.json();
    const memberId = result.id;

    // Upload avatar if selected
    if (rosterAvatarFile) {
      const uploadResult = await uploadAvatar(memberId, rosterAvatarFile);
      // Update member with avatar URL
      await fetch(ROSTER_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, avatar: uploadResult.url }),
      });
    }

    document.getElementById('roster-form').reset();
    document.getElementById('roster-avatar-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%231a1a2e' width='64' height='64'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237a7a8e' font-size='22'%3E%3F%3C/text%3E%3C/svg%3E";
    document.getElementById('roster-avatar-status').textContent = '';
    rosterAvatarFile = null;
    await loadRoster();
  } catch (err) {
    alert('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Mitglied hinzufügen';
  }
});

document.getElementById('roster-slideshow-add')?.addEventListener('click', addRosterSlideshowMember);
document.getElementById('roster-slideshow-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveRosterSlideshowSettings();
});
document.getElementById('btn-refresh-roster-slideshow')?.addEventListener('click', loadRoster);
document.getElementById('roster-slideshow-selected')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-slideshow-remove]');
  if (!btn) return;
  removeRosterSlideshowMember(btn.dataset.slideshowRemove);
});

window.LGAdminRoster = {
  loadRoster,
  openEditMember,
  deleteRosterMember,
  addCustomGame,
};
})();
