import { getStore } from "@netlify/blobs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "community-shouts";
const MAX_NAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 220;
const ALLOWED_TAGS = new Set(["GG", "PUBG", "ARC", "Event", "Community"]);

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function listApprovedShouts(store) {
  const { blobs } = await store.list();
  const shouts = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data?.approved) shouts.push(data);
  }
  shouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return shouts;
}

export default async (req) => {
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      return jsonResponse(await listApprovedShouts(store));
    } catch {
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
    } catch {
      return jsonResponse({ error: "Shout konnte nicht gespeichert werden." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/community-shouts",
};
