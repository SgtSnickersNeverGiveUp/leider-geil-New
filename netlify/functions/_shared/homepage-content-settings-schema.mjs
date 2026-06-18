export const HOMEPAGE_CONTENT_SETTINGS_STORE_NAME = "settings";
export const HOMEPAGE_CONTENT_SETTINGS_KEY = "site-settings";

export const HOMEPAGE_CONTENT_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

export const MIN_TICKER_SPEED_SECONDS = 5;
export const MAX_TICKER_SPEED_SECONDS = 120;
export const DEFAULT_TICKER_SPEED_SECONDS = 40;
export const DEFAULT_TICKER_SEPARATOR = "   \u25cf   ";
export const MAX_TICKER_SEPARATOR_LENGTH = 40;

export const MIN_SLIDESHOW_SPEED_SECONDS = 3;
export const MAX_SLIDESHOW_SPEED_SECONDS = 60;
export const DEFAULT_SLIDESHOW_SPEED_SECONDS = 8;
export const MAX_SLIDESHOW_TEXT_LENGTH = 180;

export function pickStoredHomepageContentSettings(settings = {}) {
  return HOMEPAGE_CONTENT_SETTING_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      acc[key] = settings[key];
    }
    return acc;
  }, {});
}

export function normalizeStoredRosterSlideshow(value = {}) {
  const settings = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const storedMembers = Array.isArray(settings.members) ? settings.members : [];

  return {
    enabled: Boolean(settings.enabled),
    autoplay: settings.autoplay !== false,
    speedSeconds: clampNumber(
      settings.speedSeconds,
      MIN_SLIDESHOW_SPEED_SECONDS,
      MAX_SLIDESHOW_SPEED_SECONDS,
      DEFAULT_SLIDESHOW_SPEED_SECONDS,
    ),
    pinnedMemberId: settings.pinnedMemberId ? String(settings.pinnedMemberId) : "",
    members: storedMembers
      .filter((entry) => entry && entry.id)
      .map((entry) => ({
        id: String(entry.id),
        text: String(entry.text || "").slice(0, MAX_SLIDESHOW_TEXT_LENGTH),
      })),
  };
}

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
