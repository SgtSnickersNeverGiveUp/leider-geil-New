import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "community-shouts";

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function listShouts(store) {
  const { blobs } = await store.list();
  const shouts = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) shouts.push(data);
  }
  shouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return shouts;
}

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      return jsonResponse(await listShouts(store));
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
