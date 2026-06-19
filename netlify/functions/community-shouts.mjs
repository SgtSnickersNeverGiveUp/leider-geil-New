import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  ALLOWED_SHOUT_TAGS,
  MAX_SHOUT_MESSAGE_LENGTH,
  MAX_SHOUT_NAME_LENGTH,
  listApprovedShouts,
  savePendingShout,
  sanitizeText,
} from "./_shared/community-shouts-store.mjs";

export default async (req) => {
  if (req.method === "GET") {
    try {
      return jsonResponse(await listApprovedShouts());
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

      const shout = await savePendingShout({ name, message, tag });
      return jsonResponse({ success: true, pending: true, id: shout.id }, 201);
    } catch {
      return jsonResponse({ error: "Shout konnte nicht gespeichert werden." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/community-shouts",
};
