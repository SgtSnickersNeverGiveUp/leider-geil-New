import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { toAdminCommunityShout } from "./_shared/admin-community-shouts-data.mjs";
import {
  COMMUNITY_SHOUTS_STORE_NAME,
  listCommunityShouts,
  sanitizeCommunityShoutText,
} from "./_shared/community-shouts-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(COMMUNITY_SHOUTS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const shouts = (await listCommunityShouts(store)).map(toAdminCommunityShout);
      return jsonResponse(shouts);
    } catch {
      return jsonResponse({ error: "Shouts konnten nicht geladen werden." }, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const id = sanitizeCommunityShoutText(body.id, 80);
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

      const existing = await store.get(id, { type: "json" });
      if (!existing) return jsonResponse({ error: "Shout nicht gefunden." }, 404);

      const updated = {
        ...existing,
        approved: Boolean(body.approved),
        moderatedAt: new Date().toISOString(),
      };

      await store.setJSON(id, updated);
      return jsonResponse({ success: true, shout: toAdminCommunityShout(updated) });
    } catch {
      return jsonResponse({ error: "Shout konnte nicht aktualisiert werden." }, 500);
    }
  }

  try {
    const url = new URL(req.url);
    const id = sanitizeCommunityShoutText(url.searchParams.get("id"), 80);
    if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

    await store.delete(id);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Shout konnte nicht gelöscht werden." }, 500);
  }
};

export const config = {
  path: "/api/admin/community-shouts",
};
