'use strict';

(function () {
  const DEFAULT_ROSTER_SLIDESHOW_SPEED_SECONDS = 8;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getEventGameVariant(game) {
    if (game === 'PUBG' || game === 'PUBG NEWS') return 'pubg';
    if (game === 'ARC Raiders' || game === 'ARC Raiders NEWS') return 'arc';
    if (game === 'NEWS') return 'news';
    return '';
  }

  function addMinuteCacheBust(url, baseUrl) {
    if (!url || !baseUrl || !url.startsWith(baseUrl)) return url || '';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`;
  }

  function getDefaultRosterSlideshowSettings() {
    return {
      enabled: false,
      autoplay: true,
      speedSeconds: DEFAULT_ROSTER_SLIDESHOW_SPEED_SECONDS,
      pinnedMemberId: '',
      entries: [],
    };
  }

  function normalizeRosterSlideshowSettings(value) {
    const defaults = getDefaultRosterSlideshowSettings();
    if (!value || typeof value !== 'object') return defaults;

    const rawEntries = Array.isArray(value.entries)
      ? value.entries
      : Array.isArray(value.members)
        ? value.members
        : [];

    const entries = rawEntries
      .filter((entry) => entry && (entry.memberId || entry.id))
      .map((entry) => ({
        memberId: String(entry.memberId || entry.id),
        text: String(entry.text || ''),
      }));

    return {
      enabled: Boolean(value.enabled),
      autoplay: value.autoplay !== false,
      speedSeconds: Math.max(3, Number(value.speedSeconds) || defaults.speedSeconds),
      pinnedMemberId: value.pinnedMemberId ? String(value.pinnedMemberId) : '',
      entries,
    };
  }

  window.LG_SHARED_UTILS = Object.freeze({
    escapeHtml,
    getEventGameVariant,
    addMinuteCacheBust,
    getDefaultRosterSlideshowSettings,
    normalizeRosterSlideshowSettings,
  });
})();
