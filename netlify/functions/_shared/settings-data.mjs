export const SETTINGS_STORE_NAME = "settings";
export const SETTINGS_KEY = "site-settings";

export const PUBLIC_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

export function pickPublicSettings(settings = {}) {
  return PUBLIC_SETTING_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      acc[key] = settings[key];
    }
    return acc;
  }, {});
}
