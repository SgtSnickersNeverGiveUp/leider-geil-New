import { getStore } from "@netlify/blobs";
import { jsonResponse, requireAdmin } from "./admin-auth.mjs";
import { SETTINGS_KEY, SETTINGS_STORE_NAME } from "./_shared/settings-data.mjs";

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(SETTINGS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const settings = await store.get(SETTINGS_KEY, { type: "json" });
      return jsonResponse(settings || {});
    } catch {
      return jsonResponse({});
    }
  }

  try {
    const body = await req.json();

    let existing = {};
    try {
      existing = (await store.get(SETTINGS_KEY, { type: "json" })) || {};
    } catch {
      existing = {};
    }

    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    await store.setJSON(SETTINGS_KEY, updated);

    return jsonResponse({ success: true, settings: updated });
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/admin/settings",
};
