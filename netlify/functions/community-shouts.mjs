import { getStore } from "@netlify/blobs";
import {
  COMMUNITY_SHOUTS_STORE_NAME,
  createPendingCommunityShout,
  hasRequiredCommunityShoutFields,
  listApprovedCommunityShouts,
} from "./_shared/community-shouts-data.mjs";
import { toPublicCommunityShout } from "./_shared/public-community-shouts-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const store = getStore(COMMUNITY_SHOUTS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const shouts = (await listApprovedCommunityShouts(store)).map(toPublicCommunityShout);
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

      const shout = createPendingCommunityShout(body);
      if (!hasRequiredCommunityShoutFields(shout)) {
        return jsonResponse({ error: "Name und Nachricht sind Pflichtfelder." }, 400);
      }

      await store.setJSON(shout.id, shout);
      return jsonResponse({ success: true, pending: true, id: shout.id }, 201);
    } catch (err) {
      return jsonResponse({ error: "Shout konnte nicht gespeichert werden." }, 500);
    }
  }
};

export const config = {
  path: "/api/community-shouts",
};
