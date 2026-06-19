import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  ALLOWED_SHOUT_TAGS,
  MAX_SHOUT_MESSAGE_LENGTH,
  MAX_SHOUT_NAME_LENGTH,
  getCommunityShoutsStore,
  listApprovedShouts,
  sanitizeText,
} from "./_shared/community-shouts-store.mjs";

export default async (req) => {
  const store = getCommunityShoutsStore();

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

      const name = sanitizeText(body.name, MAX_SHOUT_NAME_LENGTH);
      const message = sanitizeText(body.message, MAX_SHOUT_MESSAGE_LENGTH);
      const tag = ALLOWED_SHOUT_TAGS.has(body.tag) ? body.tag : "Community";

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
