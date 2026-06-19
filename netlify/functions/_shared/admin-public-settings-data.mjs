import {
  PUBLIC_CONTENT_SETTING_KEYS,
  clampNumber,
} from "./public-settings-data.mjs";

export {
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
} from "./public-settings-data.mjs";

const MIN_TICKER_SPEED_SECONDS = 5;
const MAX_TICKER_SPEED_SECONDS = 120;
const MIN_SLIDESHOW_SPEED_SECONDS = 3;
const MAX_SLIDESHOW_SPEED_SECONDS = 60;
const MAX_TICKER_SEPARATOR_LENGTH = 40;
const MAX_SLIDESHOW_TEXT_LENGTH = 180;

export function pickAdminPublicContentSettings(settings = {}) {
  return PUBLIC_CONTENT_SETTING_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      acc[key] = settings[key];
    }
    return acc;
  }, {});
}

export function sanitizePublicContentSettingsPatch(value = {}) {
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
    sanitized.rosterSlideshow = sanitizeAdminRosterSlideshow(patch.rosterSlideshow);
  }

  return sanitized;
}

export function mergePublicContentSettings(existing = {}, patch = {}) {
  return {
    ...existing,
    ...sanitizePublicContentSettingsPatch(patch),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeAdminRosterSlideshow(value = {}) {
  const settings = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const editableEntries = Array.isArray(settings.members)
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
    members: editableEntries
      .filter((entry) => entry && (entry.id || entry.memberId))
      .map((entry) => ({
        id: String(entry.id || entry.memberId),
        text: String(entry.text || "").slice(0, MAX_SLIDESHOW_TEXT_LENGTH),
      })),
  };
}
