import { getStore } from "@netlify/blobs";

const STORE_NAME = "settings";
const SETTINGS_KEY = "site-settings";
const PUBLIC_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

function pickPublicSettings(settings) {
  return PUBLIC_SETTING_KEYS.reduce((publicSettings, key) => {
    if (settings && Object.prototype.hasOwnProperty.call(settings, key)) {
      publicSettings[key] = settings[key];
    }
    return publicSettings;
  }, {});
}

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  // Public GET – Return only settings used by public pages.
  try {
    const settings = await store.get(SETTINGS_KEY, { type: "json" });
    return new Response(JSON.stringify(pickPublicSettings(settings || {})), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/settings",
};
