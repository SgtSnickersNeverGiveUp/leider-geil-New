export const PUBLIC_CONTENT_SETTINGS_STORE_NAME = "settings";
export const PUBLIC_CONTENT_SETTINGS_KEY = "site-settings";

export const PUBLIC_CONTENT_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

const MIN_SLIDESHOW_SPEED_SECONDS = 3;
const MAX_SLIDESHOW_SPEED_SECONDS = 60;
const MAX_SLIDESHOW_TEXT_LENGTH = 180;

export function pickPublicSettings(settings = {}) {
  const publicSettings = pickStoredPublicContentSettings(settings);
  if (Object.prototype.hasOwnProperty.call(publicSettings, "rosterSlideshow")) {
    publicSettings.rosterSlideshow = toPublicRosterSlideshow(publicSettings.rosterSlideshow);
  }
  return publicSettings;
}

function pickStoredPublicContentSettings(settings = {}) {
  return PUBLIC_CONTENT_SETTING_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      acc[key] = settings[key];
    }
    return acc;
  }, {});
}

function normalizeStoredRosterSlideshow(value = {}) {
  const settings = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const storedEntries = Array.isArray(settings.members)
    ? settings.members
    : Array.isArray(settings.entries)
      ? settings.entries
      : [];

  return {
    enabled: Boolean(settings.enabled),
    autoplay: settings.autoplay !== false,
    speedSeconds: clampNumber(
      settings.speedSeconds,
      MIN_SLIDESHOW_SPEED_SECONDS,
      MAX_SLIDESHOW_SPEED_SECONDS,
      8,
    ),
    pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : "",
    members: storedEntries
      .filter((entry) => entry && (entry.id || entry.memberId))
      .map((entry) => ({
        id: String(entry.id || entry.memberId),
        text: String(entry.text || "").slice(0, MAX_SLIDESHOW_TEXT_LENGTH),
      })),
  };
}

function toPublicRosterSlideshow(value = {}) {
  const settings = normalizeStoredRosterSlideshow(value);
  return {
    enabled: settings.enabled,
    autoplay: settings.autoplay,
    speedSeconds: settings.speedSeconds,
    pinnedMemberId: settings.pinnedMemberId,
    entries: settings.members.map((entry) => ({
      memberId: entry.id,
      text: entry.text,
    })),
  };
}

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
