import { getStore } from "@netlify/blobs";
import { jsonResponse, requireAdmin } from "./admin-auth.mjs";
import {
  HOMEPAGE_CONTENT_SETTINGS_KEY,
  HOMEPAGE_CONTENT_SETTINGS_STORE_NAME,
  mergeAdminHomepageSettings,
  pickAdminHomepageSettings,
  sanitizeAdminHomepageSettingsPatch,
} from "./_shared/admin-homepage-settings-data.mjs";

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(HOMEPAGE_CONTENT_SETTINGS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const settings = await store.get(HOMEPAGE_CONTENT_SETTINGS_KEY, { type: "json" });
      return jsonResponse(pickAdminHomepageSettings(settings || {}));
    } catch {
      return jsonResponse({});
    }
  }

  try {
    const body = await req.json();
    const homepageSettingsPatch = sanitizeAdminHomepageSettingsPatch(body);

    if (Object.keys(homepageSettingsPatch).length === 0) {
      return jsonResponse({ error: "Keine bekannten Homepage-Settings im Payload." }, 400);
    }

    let existing = {};
    try {
      existing = (await store.get(HOMEPAGE_CONTENT_SETTINGS_KEY, { type: "json" })) || {};
    } catch {
      existing = {};
    }

    const updated = mergeAdminHomepageSettings(existing, homepageSettingsPatch);
    await store.setJSON(HOMEPAGE_CONTENT_SETTINGS_KEY, updated);

    return jsonResponse({ success: true, settings: pickAdminHomepageSettings(updated) });
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/admin/homepage-settings",
};
