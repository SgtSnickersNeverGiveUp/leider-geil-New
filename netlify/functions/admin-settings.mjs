import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "settings";
const SETTINGS_KEY = "site-settings";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      const settings = await store.get(SETTINGS_KEY, { type: "json" });
      return jsonResponse(settings || {});
    } catch {
      return jsonResponse({});
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      let existing = {};
      try {
        existing = (await store.get(SETTINGS_KEY, { type: "json" })) || {};
      } catch {}

      const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
      await store.setJSON(SETTINGS_KEY, updated);
      return jsonResponse({ success: true, settings: updated });
    } catch {
      return jsonResponse({ error: "Fehler beim Speichern." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-settings",
};
