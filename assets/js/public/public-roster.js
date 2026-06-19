(() => {
  'use strict';

  const escapeRosterHtml = window.LG_SITE_UTILS.escapeHtml;
  let publicRosterMembers = [];
  let activeRosterFilter = '';

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

      publicRosterMembers = members;
      renderPublicRoster(container);
      initRosterToggle(container);
    } catch (err) {
      console.error('Public roster load failed:', err);
      container.innerHTML = '<div class="empty-state">Fehler beim Laden des Rosters.</div>';
    }
  }

  function renderPublicRoster(container) {
    const members = getFilteredMembers();
    const status = activeRosterFilter ? renderRosterFilterStatus(members.length) : '';

    if (members.length === 0) {
      container.innerHTML = `${status}<div class="empty-state">Keine Mitglieder für diesen Filter gefunden.</div>`;
      return;
    }

    container.innerHTML = status + members.map((member) => renderPublicRosterCard(member)).join('');
  }

  function getFilteredMembers() {
    if (!activeRosterFilter) return publicRosterMembers;

    return publicRosterMembers.filter((member) =>
      (member.games || []).some((game) => {
        const normalized = String(game || '').toLowerCase();
        if (activeRosterFilter === 'pubg') return normalized.includes('pubg');
        if (activeRosterFilter === 'arc') return normalized.includes('arc');
        return false;
      })
    );
  }

  function renderRosterFilterStatus(count) {
    const label = activeRosterFilter === 'pubg' ? 'PUBG Squad' : 'ARC Raiders';
    return `
      <div class="roster-filter-status">
        <span>${escapeRosterHtml(label)}: ${count} Member</span>
        <button type="button" class="btn-sm" data-roster-filter-clear>Alle anzeigen</button>
      </div>`;
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
      const clearBtn = e.target.closest('[data-roster-filter-clear]');
      if (clearBtn) {
        activeRosterFilter = '';
        renderPublicRoster(container);
        return;
      }

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

  function initRosterFilterLinks() {
    document.querySelectorAll('[data-roster-filter]').forEach((link) => {
      link.addEventListener('click', () => {
        activeRosterFilter = link.dataset.rosterFilter || '';
        const container = document.getElementById('roster-grid');
        if (container && publicRosterMembers.length > 0) {
          renderPublicRoster(container);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initRosterFilterLinks);
  document.addEventListener('DOMContentLoaded', loadPublicRoster);
})();
