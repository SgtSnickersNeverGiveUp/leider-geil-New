import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "community-shouts";
const MAX_NAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 220;
const ALLOWED_TAGS = new Set(["GG", "PUBG", "ARC", "Event", "Community"]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function listShouts(store, includePending = false) {
  const { blobs } = await store.list();
  const shouts = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data && (includePending || data.approved)) shouts.push(data);
  }

  shouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return shouts;
}

export default async (req) => {
  const url = new URL(req.url);

  if (
    (req.method === "GET" && url.searchParams.get("all") === "1") ||
    req.method === "PUT" ||
    req.method === "DELETE"
  ) {
    const adminGuard = requireAdmin(req);
    if (adminGuard) return adminGuard;
  }

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      const includePending = url.searchParams.get("all") === "1";
      const shouts = await listShouts(store, includePending);
      return jsonResponse(shouts);
    } catch (err) {
      return jsonResponse({ error: "Shouts konnten nicht geladen werden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();

      if (body.website) {
        return jsonResponse({ success: true, pending: true }, 201);
      }

      const name = sanitizeText(body.name, MAX_NAME_LENGTH);
      const message = sanitizeText(body.message, MAX_MESSAGE_LENGTH);
      const tag = ALLOWED_TAGS.has(body.tag) ? body.tag : "Community";

      if (!name || !message) {
        return jsonResponse({ error: "Name und Nachricht sind Pflichtfelder." }, 400);
      }

      const id = `shout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const shout = {
        id,
        name,
        message,
        tag,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, shout);
      return jsonResponse({ success: true, pending: true, id }, 201);
    } catch (err) {
      return jsonResponse({ error: "Shout konnte nicht gespeichert werden." }, 500);
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
    } catch (err) {
      return jsonResponse({ error: "Shout konnte nicht aktualisiert werden." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = sanitizeText(url.searchParams.get("id"), 80);
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

      await store.delete(id);
      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ error: "Shout konnte nicht gelöscht werden." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/community-shouts",
};
