import { getStore } from "@netlify/blobs";
import {
  HOMEPAGE_CONTENT_SETTINGS_KEY,
  HOMEPAGE_CONTENT_SETTINGS_STORE_NAME,
  pickPublicSettings,
} from "./_shared/public-settings-data.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const store = getStore(HOMEPAGE_CONTENT_SETTINGS_STORE_NAME);
    const settings = (await store.get(HOMEPAGE_CONTENT_SETTINGS_KEY, { type: "json" })) || {};
    const publicSettings = pickPublicSettings(settings);

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
