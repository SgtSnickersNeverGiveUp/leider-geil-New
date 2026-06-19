import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  getCommunityShoutsStore,
  listAllShouts,
  sanitizeText,
} from "./_shared/community-shouts-store.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getCommunityShoutsStore();

  if (req.method === "GET") {
    try {
      return jsonResponse(await listAllShouts(store));
    } catch {
      return jsonResponse({ error: "Shouts konnten nicht geladen werden." }, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const id = sanitizeText(body.id, 80);
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

      const existing = await store.get(id, { type: "json" });
      if (!existing) return jsonResponse({ error: "Shout nicht gefunden." }, 404);

      const updated = {
        ...existing,
        approved: Boolean(body.approved),
        moderatedAt: new Date().toISOString(),
      };

      await store.setJSON(id, updated);
      return jsonResponse({ success: true, shout: updated });
    } catch {
      return jsonResponse({ error: "Shout konnte nicht aktualisiert werden." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = sanitizeText(new URL(req.url).searchParams.get("id"), 80);
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);
      await store.delete(id);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Shout konnte nicht gelöscht werden." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-community-shouts",
};
