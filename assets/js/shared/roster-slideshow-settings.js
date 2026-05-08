(() => {
  'use strict';

  const DEFAULT_SPEED_SECONDS = 8;

  function normalize(settings) {
    const source = settings && typeof settings === 'object' ? settings : {};
    const entries = getRawEntries(source)
      .filter((entry) => entry && (entry.memberId || entry.id))
      .map((entry) => ({
        memberId: String(entry.memberId || entry.id),
        text: String(entry.text || ''),
        enabled: entry.enabled !== false,
        pinned: Boolean(entry.pinned),
      }));

    return {
      enabled: Boolean(source.enabled),
      autoplay: source.autoplay !== false,
      speedSeconds: Math.max(3, Number(source.speedSeconds) || DEFAULT_SPEED_SECONDS),
      pinnedMemberId: source.pinnedMemberId ? String(source.pinnedMemberId) : '',
      entries,
    };
  }

  function getRawEntries(source) {
    if (Array.isArray(source.entries)) return source.entries;
    if (Array.isArray(source.members)) return source.members;
    return [];
  }

  function normalizeForPublic(settings) {
    return normalize(settings);
  }

  function normalizeForAdmin(settings) {
    const normalized = normalize(settings);
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

  function getDefaultAdminSettings() {
    return {
      enabled: false,
      autoplay: true,
      speedSeconds: DEFAULT_SPEED_SECONDS,
      pinnedMemberId: '',
      members: [],
    };
  }

  function serializeAdminSettings(settings) {
    const normalized = normalizeForAdmin({
      enabled: settings?.enabled,
      autoplay: settings?.autoplay,
      speedSeconds: settings?.speedSeconds,
      pinnedMemberId: settings?.pinnedMemberId,
      members: settings?.members,
    });

    return {
      enabled: normalized.enabled,
      autoplay: normalized.autoplay,
      speedSeconds: normalized.speedSeconds,
      pinnedMemberId: normalized.pinnedMemberId,
      members: normalized.members,
    };
  }

  window.LG_ROSTER_SLIDESHOW_SETTINGS = {
    DEFAULT_SPEED_SECONDS,
    getDefaultAdminSettings,
    normalizeForAdmin,
    normalizeForPublic,
    serializeAdminSettings,
  };
})();
