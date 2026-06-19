import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getSettingsStore, mergeSettings, readSettings } from "./_shared/settings-store.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getSettingsStore();

  if (req.method === "GET") {
    return jsonResponse(await readSettings(store));
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const updated = await mergeSettings(body, store);
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
