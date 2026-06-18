import {
  DEFAULT_SLIDESHOW_SPEED_SECONDS,
  DEFAULT_TICKER_SEPARATOR,
  DEFAULT_TICKER_SPEED_SECONDS,
  MAX_SLIDESHOW_SPEED_SECONDS,
  MAX_SLIDESHOW_TEXT_LENGTH,
  MAX_TICKER_SEPARATOR_LENGTH,
  MAX_TICKER_SPEED_SECONDS,
  MIN_SLIDESHOW_SPEED_SECONDS,
  MIN_TICKER_SPEED_SECONDS,
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
  clampNumber,
  normalizeStoredRosterSlideshow,
  pickStoredPublicContentSettings,
} from "./homepage-content-settings-schema.mjs";
import { ADMIN_MEDIA_URLS, toAdminMediaPreviewUrl } from "./admin-media-url-contract.mjs";

export {
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
} from "./homepage-content-settings-schema.mjs";

export function pickAdminPublicContentSettings(settings = {}) {
  const picked = pickStoredPublicContentSettings(settings);
  const bannerUrl = picked.bannerUrl || "";

  if (bannerUrl) {
    const adminBannerPreviewUrl = toAdminMediaPreviewUrl(
      bannerUrl,
      ADMIN_MEDIA_URLS.bannerImage,
    );

    if (adminBannerPreviewUrl !== bannerUrl) {
      picked.adminBannerPreviewUrl = adminBannerPreviewUrl;
    }
  }

  return picked;
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
      DEFAULT_TICKER_SPEED_SECONDS,
    );
  }

  if (Object.prototype.hasOwnProperty.call(patch, "tickerSeparator")) {
    sanitized.tickerSeparator = String(patch.tickerSeparator || DEFAULT_TICKER_SEPARATOR)
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
  const settings = normalizeStoredRosterSlideshow(value);
  return {
    enabled: settings.enabled,
    autoplay: settings.autoplay,
    speedSeconds: clampNumber(
      settings.speedSeconds,
      MIN_SLIDESHOW_SPEED_SECONDS,
      MAX_SLIDESHOW_SPEED_SECONDS,
      DEFAULT_SLIDESHOW_SPEED_SECONDS,
    ),
    pinnedMemberId: settings.pinnedMemberId,
    members: settings.members
      .filter((entry) => entry && entry.id)
      .map((entry) => ({
        id: String(entry.id),
        text: String(entry.text || "").slice(0, MAX_SLIDESHOW_TEXT_LENGTH),
      })),
  };
}
