import { getStore } from "@netlify/blobs";

const STORE_NAME = "settings";
const SETTINGS_KEY = "site-settings";

const PUBLIC_SETTING_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const store = getStore(STORE_NAME);
    const settings = (await store.get(SETTINGS_KEY, { type: "json" })) || {};
    const publicSettings = PUBLIC_SETTING_KEYS.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        acc[key] = settings[key];
      }
      return acc;
    }, {});

    return new Response(JSON.stringify(publicSettings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/public-settings",
};
