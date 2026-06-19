import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  getCommunityShoutsStore,
} from "./_shared/community-shouts-store.mjs";
import {
  buildPendingShout,
  listVisibleShouts,
} from "./_shared/community-shouts-public.mjs";

export default async (req) => {
  const store = getCommunityShoutsStore();

  if (req.method === "GET") {
    try {
      return jsonResponse(await listVisibleShouts(store));
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

      const shout = buildPendingShout(body);
      if (!shout) {
        return jsonResponse({ error: "Name und Nachricht sind Pflichtfelder." }, 400);
      }

      await store.setJSON(shout.id, shout);
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
