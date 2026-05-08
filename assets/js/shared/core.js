(() => {
  'use strict';

  const API_PATHS = Object.freeze({
    applications: '/api/applications',
    roster: '/api/roster',
    rosterAvatar: '/api/roster-avatar',
    events: '/api/events',
    eventImage: '/api/event-image',
    videos: '/api/videos',
    eventRegistrations: '/api/event-registrations',
    news: '/api/news',
    settings: '/api/settings',
    bannerImage: '/api/banner-image',
    communityShouts: '/api/community-shouts',
    twitchStatus: '/api/twitch-status',
  });

  const DEFAULT_ROSTER_SLIDESHOW_SPEED = 8;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function appendMinuteCacheBust(url, options = {}) {
    const value = String(url || '');
    if (!value) return '';

    const prefixes = Array.isArray(options.prefixes) ? options.prefixes : [];
    const exact = Array.isArray(options.exact) ? options.exact : [];
    const shouldBust = exact.includes(value) || prefixes.some((prefix) => value.startsWith(prefix));
    if (!shouldBust) return value;

    return `${value}${value.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`;
  }

  function normalizeRosterSlideshowSettings(value) {
    const settings = value && typeof value === 'object' ? value : {};
    const rawEntries = Array.isArray(settings.entries)
      ? settings.entries
      : Array.isArray(settings.members)
        ? settings.members
        : [];

    const entries = rawEntries
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const memberId = entry.memberId ?? entry.id;
        if (!memberId) return null;
        return {
          memberId: String(memberId),
          text: String(entry.text || ''),
        };
      })
      .filter(Boolean);

    return {
      enabled: Boolean(settings.enabled),
      autoplay: settings.autoplay !== false,
      speedSeconds: Math.max(3, Number(settings.speedSeconds) || DEFAULT_ROSTER_SLIDESHOW_SPEED),
      pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : '',
      entries,
    };
  }

  function normalizeRosterSlideshowForAdmin(value) {
    const normalized = normalizeRosterSlideshowSettings(value);
    return {
      enabled: normalized.enabled,
      autoplay: normalized.autoplay,
      speedSeconds: normalized.speedSeconds,
      pinnedMemberId: normalized.pinnedMemberId,
      members: normalized.entries.map((entry) => ({
        id: entry.memberId,
        text: entry.text,
      })),
    };
  }

  function normalizeRosterSlideshowForStorage(value) {
    const normalized = normalizeRosterSlideshowSettings(value);
    return {
      enabled: normalized.enabled,
      autoplay: normalized.autoplay,
      speedSeconds: normalized.speedSeconds,
      pinnedMemberId: normalized.pinnedMemberId,
      members: normalized.entries.map((entry) => ({
        id: entry.memberId,
        text: entry.text,
      })),
    };
  }

  window.LGShared = Object.freeze({
    API_PATHS,
    escapeHtml,
    appendMinuteCacheBust,
    normalizeRosterSlideshowSettings,
    normalizeRosterSlideshowForAdmin,
    normalizeRosterSlideshowForStorage,
  });
})();
