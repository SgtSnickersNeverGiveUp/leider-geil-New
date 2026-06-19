'use strict';

(function () {
  const DEFAULT_ROSTER_SLIDESHOW_SPEED_SECONDS = 8;

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

  window.LG_ROSTER_SLIDESHOW_SETTINGS = Object.freeze({
    getDefaultRosterSlideshowSettings,
    normalizeRosterSlideshowSettings,
  });
})();
