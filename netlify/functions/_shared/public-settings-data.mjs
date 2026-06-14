import {
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
  normalizeStoredRosterSlideshow,
  pickStoredPublicContentSettings,
} from "./public-content-settings-schema.mjs";

export {
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
} from "./public-content-settings-schema.mjs";

export function pickPublicSettings(settings = {}) {
  const publicSettings = pickStoredPublicContentSettings(settings);
  if (Object.prototype.hasOwnProperty.call(publicSettings, "rosterSlideshow")) {
    publicSettings.rosterSlideshow = toPublicRosterSlideshow(publicSettings.rosterSlideshow);
  }
  return publicSettings;
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
