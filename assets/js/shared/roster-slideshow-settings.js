(function (window) {
  'use strict';

  const DEFAULT_SPEED_SECONDS = 8;

  function getEntries(settings) {
    if (!settings || typeof settings !== 'object') return [];

    const rawEntries = Array.isArray(settings.entries)
      ? settings.entries
      : Array.isArray(settings.members)
        ? settings.members
        : [];

    return rawEntries
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const memberId = entry.memberId || entry.id;
        if (!memberId) return null;
        return {
          memberId: String(memberId),
          text: String(entry.text || ''),
        };
      })
      .filter(Boolean);
  }

  function normalize(settings) {
    const source = settings && typeof settings === 'object' ? settings : {};

    return {
      enabled: Boolean(source.enabled),
      autoplay: source.autoplay !== false,
      speedSeconds: Math.max(3, Number(source.speedSeconds) || DEFAULT_SPEED_SECONDS),
      pinnedMemberId: source.pinnedMemberId ? String(source.pinnedMemberId) : '',
      entries: getEntries(source),
    };
  }

  function toAdminModel(settings) {
    const normalized = normalize(settings);

    return {
      ...normalized,
      members: normalized.entries.map((entry) => ({
        id: entry.memberId,
        text: entry.text,
      })),
    };
  }

  function toApiPayload(settings) {
    const normalized = normalize({
      ...settings,
      entries: getEntries(settings),
    });

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

  window.LGRosterSlideshowSettings = Object.freeze({
    DEFAULT_SPEED_SECONDS,
    normalize,
    toAdminModel,
    toApiPayload,
  });
})(window);
