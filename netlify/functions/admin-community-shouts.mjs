import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  getCommunityShoutsStore,
} from "./_shared/community-shouts-store.mjs";
import {
  deleteModerationShout,
  listModerationShouts,
  setShoutVisibility,
} from "./_shared/community-shouts-admin.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getCommunityShoutsStore();

  if (req.method === "GET") {
    try {
      return jsonResponse(await listModerationShouts(store));
    } catch {
      return jsonResponse({ error: "Shouts konnten nicht geladen werden." }, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const visible = typeof body.visible === "boolean" ? body.visible : Boolean(body.approved);
      const result = await setShoutVisibility(store, body.id, visible);
      if (result.error) {
        return jsonResponse({ error: result.error.message }, result.error.status);
      }

      return jsonResponse({ success: true, shout: result.shout });
    } catch {
      return jsonResponse({ error: "Shout konnte nicht aktualisiert werden." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await deleteModerationShout(store, new URL(req.url).searchParams.get("id"));
      if (result.error) {
        return jsonResponse({ error: result.error.message }, result.error.status);
      }

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
