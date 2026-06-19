(function () {
  'use strict';

  const DEFAULT_SPEED_SECONDS = 8;

  function getDefaultRosterSlideshowSettings() {
    return {
      enabled: false,
      autoplay: true,
      speedSeconds: DEFAULT_SPEED_SECONDS,
      pinnedMemberId: '',
      entries: [],
    };
  }

  function normalizeRosterSlideshowSettings(value) {
    const defaults = getDefaultRosterSlideshowSettings();
    const settings = value && typeof value === 'object' ? value : {};
    const rawEntries = Array.isArray(settings.entries)
      ? settings.entries
      : Array.isArray(settings.members)
        ? settings.members
        : [];

    const entries = rawEntries
      .filter((entry) => entry && (entry.memberId || entry.id))
      .map((entry) => ({
        memberId: String(entry.memberId || entry.id),
        text: String(entry.text || ''),
      }));

    return {
      enabled: Boolean(settings.enabled),
      autoplay: settings.autoplay !== false,
      speedSeconds: Math.max(3, Number(settings.speedSeconds) || defaults.speedSeconds),
      pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : '',
      entries,
    };
  }

  window.LG_ROSTER_SLIDESHOW_SETTINGS = Object.freeze({
    defaultSpeedSeconds: DEFAULT_SPEED_SECONDS,
    getDefaultRosterSlideshowSettings,
    normalizeRosterSlideshowSettings,
  });
})();
