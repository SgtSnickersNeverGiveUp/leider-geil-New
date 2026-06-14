export const SETTINGS_STORE_NAME = "settings";
export const SETTINGS_KEY = "site-settings";

export const PUBLIC_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

const MIN_TICKER_SPEED_SECONDS = 5;
const MAX_TICKER_SPEED_SECONDS = 120;
const MIN_SLIDESHOW_SPEED_SECONDS = 3;
const MAX_SLIDESHOW_SPEED_SECONDS = 60;
const MAX_TICKER_SEPARATOR_LENGTH = 40;
const MAX_SLIDESHOW_TEXT_LENGTH = 180;

export function pickPublicSettings(settings = {}) {
  return PUBLIC_SETTING_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      acc[key] = settings[key];
    }
    return acc;
  }, {});
}

export function sanitizePublicSettingsPatch(value = {}) {
  const patch = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sanitized = {};

  if (Object.prototype.hasOwnProperty.call(patch, "bannerUrl")) {
    sanitized.bannerUrl = String(patch.bannerUrl || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(patch, "tickerSpeedSeconds")) {
    sanitized.tickerSpeedSeconds = clampNumber(
      patch.tickerSpeedSeconds,
      MIN_TICKER_SPEED_SECONDS,
      MAX_TICKER_SPEED_SECONDS,
      40,
    );
  }

  if (Object.prototype.hasOwnProperty.call(patch, "tickerSeparator")) {
    sanitized.tickerSeparator = String(patch.tickerSeparator || "   \u25cf   ")
      .slice(0, MAX_TICKER_SEPARATOR_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(patch, "rosterSlideshow")) {
    sanitized.rosterSlideshow = sanitizeRosterSlideshow(patch.rosterSlideshow);
  }

  return sanitized;
}

export function mergePublicSettings(existing = {}, patch = {}) {
  return {
    ...existing,
    ...sanitizePublicSettingsPatch(patch),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeRosterSlideshow(value = {}) {
  const settings = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const members = Array.isArray(settings.members) ? settings.members : [];

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
    members: members
      .filter((entry) => entry && entry.id)
      .map((entry) => ({
        id: String(entry.id),
        text: String(entry.text || "").slice(0, MAX_SLIDESHOW_TEXT_LENGTH),
      })),
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
