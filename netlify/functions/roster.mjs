import { getStore } from "@netlify/blobs";
import { ROSTER_STORE_NAME, listRosterMembers } from "./_shared/roster-data.mjs";
import { toPublicRosterMember } from "./_shared/public-roster-data.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(ROSTER_STORE_NAME);

  // GET – List all members
  try {
    const members = (await listRosterMembers(store)).map(toPublicRosterMember);

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/roster",
};
