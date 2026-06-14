(() => {
  'use strict';

  const DEFAULT_SPEED_SECONDS = 8;
  const DEFAULT_AVATAR = '/assets/img/default-avatar.svg';

  document.addEventListener('DOMContentLoaded', initRosterSlideshow);

  async function initRosterSlideshow() {
    const root = document.getElementById('roster-slideshow');
    if (!root) return;

    try {
      const [settings, members] = await Promise.all([
        fetchJson(SITE_CONFIG.settingsApi || '/api/public-settings', {}),
        fetchJson(SITE_CONFIG.rosterApi || '/api/roster', []),
      ]);
      const config = normalizeSlideshowSettings(settings.rosterSlideshow);
      if (!config.enabled || !Array.isArray(members) || members.length === 0) return;

      const slides = buildSlides(config, members);
      if (slides.length === 0) return;

      startSlideshow(root, slides, config);
    } catch (err) {
      console.warn('[Roster Slideshow]', err.message);
    }
  }

  async function fetchJson(url, fallback) {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  }

  function normalizeSlideshowSettings(value) {
    const settings = value && typeof value === 'object' ? value : {};
    const entries = Array.isArray(settings.entries) ? settings.entries : [];
    return {
      enabled: Boolean(settings.enabled),
      autoplay: settings.autoplay !== false,
      speedSeconds: Math.max(3, Number(settings.speedSeconds) || DEFAULT_SPEED_SECONDS),
      pinnedMemberId: settings.pinnedMemberId || '',
      entries: entries.map((entry) => ({
        memberId: String(entry.memberId || ''),
        text: entry.text || '',
      })),
    };
  }

  function buildSlides(config, members) {
    const memberById = new Map(members.map((member) => [member.id, member]));
    const entries = config.entries
      .filter((entry) => entry && entry.enabled !== false && memberById.has(entry.memberId));

    if (!config.autoplay && config.pinnedMemberId) {
      const pinnedEntry = entries.find((entry) => entry.memberId === config.pinnedMemberId);
      return pinnedEntry ? [createSlide(memberById.get(pinnedEntry.memberId), pinnedEntry)] : [];
    }

    return entries.map((entry) => createSlide(memberById.get(entry.memberId), entry));
  }

  function createSlide(member, entry) {
    return {
      id: member.id,
      name: member.name || 'Clan Member',
      role: member.clanRole || member.role || 'Member',
      avatar: member.avatar || DEFAULT_AVATAR,
      games: member.games || [],
      text: entry.text || member.bio || 'Leider Geil Member im Spotlight.',
      pinned: Boolean(entry.pinned),
    };
  }

  function startSlideshow(root, slides, config) {
    const elements = {
      avatar: document.getElementById('roster-slideshow-avatar'),
      eyebrow: document.getElementById('roster-slideshow-eyebrow'),
      name: document.getElementById('roster-slideshow-name'),
      role: document.getElementById('roster-slideshow-role'),
      games: document.getElementById('roster-slideshow-games'),
      text: document.getElementById('roster-slideshow-text'),
      progress: document.getElementById('roster-slideshow-progress'),
    };

    let index = 0;
    const speedMs = config.speedSeconds * 1000;
    const canRotate = config.autoplay && slides.length > 1;

    const showSlide = () => {
      renderSlide(elements, slides[index], canRotate ? 'Member Spotlight' : 'Fixer Spotlight');
      root.hidden = false;
      root.style.setProperty('--roster-slideshow-speed', `${config.speedSeconds}s`);
      root.classList.toggle('is-playing', canRotate);
      root.classList.toggle('roster-slideshow--pinned', !canRotate);
      index = (index + 1) % slides.length;
    };

    showSlide();
    if (canRotate) {
      setInterval(showSlide, speedMs);
    }
  }

  function renderSlide(elements, slide, eyebrow) {
    if (elements.avatar) {
      elements.avatar.src = slide.avatar;
      elements.avatar.alt = slide.name;
      elements.avatar.onerror = () => { elements.avatar.src = DEFAULT_AVATAR; };
    }
    if (elements.eyebrow) elements.eyebrow.textContent = eyebrow;
    if (elements.name) elements.name.textContent = slide.name;
    if (elements.role) elements.role.textContent = slide.role;
    if (elements.text) elements.text.textContent = slide.text;
    if (elements.games) {
      elements.games.innerHTML = slide.games
        .map((game) => `<span>${escapeHtml(game)}</span>`)
        .join('');
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
