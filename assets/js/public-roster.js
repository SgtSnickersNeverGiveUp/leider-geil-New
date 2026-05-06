(() => {
  'use strict';

  async function loadPublicRoster() {
    const container = document.getElementById('roster-grid');
    if (!container) return;

    container.innerHTML = '<div class="loading">Lade Clan Roster...</div>';

    try {
      const res = await fetch(SITE_CONFIG.rosterApi || '/api/roster');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const members = await res.json();

      if (!Array.isArray(members) || members.length === 0) {
        container.innerHTML = '<div class="empty-state">Noch keine Mitglieder eingetragen.</div>';
        return;
      }

      container.innerHTML = members.map((member) => renderPublicRosterCard(member)).join('');
      initRosterToggle(container);
    } catch (err) {
      console.error('Public roster load failed:', err);
      container.innerHTML = '<div class="empty-state">Fehler beim Laden des Rosters.</div>';
    }
  }

  function escapeRosterHtml(value) {
    if (!value) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderPublicRosterCard(member) {
    const avatarSrc = member.avatar ? escapeRosterHtml(member.avatar) : 'assets/img/default-avatar.png';
    const clanRole = member.clanRole || 'Member';
    const genderLabel = getGenderLabel(member.gender);
    const genderBadge = genderLabel
      ? `<span class="badge badge--gender">${genderLabel}</span>`
      : '';
    const gamesHtml = (member.games || [])
      .map((game) => `<span class="${getGameClass(game)}">${escapeRosterHtml(game)}</span>`)
      .join('');
    const funTagsHtml = (member.funTags || [])
      .map((tag) => `<span class="roster-card-fun-tag">${escapeRosterHtml(tag)}</span>`)
      .join('');
    const bio = member.bio || '';

    return `
      <article class="roster-card">
        <header class="roster-card-header">
          <img class="roster-card-avatar" src="${avatarSrc}" alt="${escapeRosterHtml(member.name)}" loading="lazy">
          <div>
            <div class="roster-card-name-row">
              <span class="roster-card-name">${escapeRosterHtml(member.name)}</span>
              <span class="badge badge--clan-role">${escapeRosterHtml(clanRole)}</span>
              ${genderBadge}
            </div>
            <div class="roster-card-role">${escapeRosterHtml(member.role || '')}</div>
            <div class="roster-card-games">${gamesHtml}</div>
          </div>
        </header>

        <button type="button" class="btn-sm roster-toggle-btn" data-toggle="more">
          Mehr Infos
        </button>

        <div class="roster-card-more">
          ${bio
            ? `<p class="roster-card-bio">${escapeRosterHtml(bio)}</p>`
            : '<p class="roster-card-bio">Noch keine Beschreibung.</p>'}
          ${funTagsHtml
            ? `<div class="roster-card-fun-tags"><span class="roster-card-fun-label">Fun-Tags:</span>${funTagsHtml}</div>`
            : ''}
        </div>
      </article>`;
  }

  function getGenderLabel(gender) {
    if (gender === 'm') return 'M';
    if (gender === 'w') return 'W';
    if (gender === 'd') return 'D';
    return '';
  }

  function getGameClass(game) {
    const lower = (game || '').toLowerCase();
    if (lower.includes('pubg')) return 'roster-card__tag roster-card__tag--pubg';
    if (lower.includes('arc')) return 'roster-card__tag roster-card__tag--arc';
    return 'roster-card__tag roster-card__tag--other';
  }

  function initRosterToggle(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-toggle="more"]');
      if (!btn) return;

      const card = btn.closest('.roster-card');
      const more = card?.querySelector('.roster-card-more');
      if (!more) return;

      const isOpen = more.classList.contains('open');
      more.classList.toggle('open', !isOpen);
      btn.textContent = isOpen ? 'Mehr Infos' : 'Weniger Infos';
    });
  }

  document.addEventListener('DOMContentLoaded', loadPublicRoster);
})();
