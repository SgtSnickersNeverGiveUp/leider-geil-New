import { getStore } from "@netlify/blobs";
import { jsonResponse, requireAdmin } from "./admin-auth.mjs";
import {
  PUBLIC_CONTENT_SETTINGS_KEY,
  PUBLIC_CONTENT_SETTINGS_STORE_NAME,
  mergePublicContentSettings,
  pickAdminPublicContentSettings,
  sanitizePublicContentSettingsPatch,
} from "./_shared/admin-public-settings-data.mjs";

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(PUBLIC_CONTENT_SETTINGS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const settings = await store.get(PUBLIC_CONTENT_SETTINGS_KEY, { type: "json" });
      return jsonResponse(pickAdminPublicContentSettings(settings || {}));
    } catch {
      return jsonResponse({});
    }
  }

  try {
    const body = await req.json();
    const publicContentPatch = sanitizePublicContentSettingsPatch(body);

    if (Object.keys(publicContentPatch).length === 0) {
      return jsonResponse({ error: "Keine bekannten Public-Content-Settings im Payload." }, 400);
    }

    let existing = {};
    try {
      existing = (await store.get(PUBLIC_CONTENT_SETTINGS_KEY, { type: "json" })) || {};
    } catch {
      existing = {};
    }

    const updated = mergePublicContentSettings(existing, publicContentPatch);
    await store.setJSON(PUBLIC_CONTENT_SETTINGS_KEY, updated);

    return jsonResponse({ success: true, settings: pickAdminPublicContentSettings(updated) });
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/admin/public-settings",
};
