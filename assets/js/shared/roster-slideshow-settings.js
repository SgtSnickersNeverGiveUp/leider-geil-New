(function (global) {
  'use strict';

  const DEFAULT_SPEED_SECONDS = 8;

  function getDefaultSettings() {
    return {
      enabled: false,
      autoplay: true,
      speedSeconds: DEFAULT_SPEED_SECONDS,
      pinnedMemberId: '',
      members: [],
    };
  }

  function normalize(settings) {
    const defaults = getDefaultSettings();
    if (!settings || typeof settings !== 'object') return defaults;

    const sourceEntries = Array.isArray(settings.members)
      ? settings.members
      : Array.isArray(settings.entries)
        ? settings.entries
        : [];

    const members = sourceEntries
      .filter((entry) => entry && (entry.id || entry.memberId))
      .map((entry) => ({
        id: String(entry.id || entry.memberId),
        text: String(entry.text || ''),
      }));

    return {
      enabled: Boolean(settings.enabled),
      autoplay: settings.autoplay !== false,
      speedSeconds: Math.max(3, Number(settings.speedSeconds) || defaults.speedSeconds),
      pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : '',
      members,
    };
  }

  global.LG_ROSTER_SLIDESHOW_SETTINGS = Object.freeze({
    DEFAULT_SPEED_SECONDS,
    getDefaultSettings,
    normalize,
  });
})(window);
