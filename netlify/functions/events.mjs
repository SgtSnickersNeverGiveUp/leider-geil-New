import { getStore } from "@netlify/blobs";
import { EVENTS_STORE_NAME, listEvents, toPublicEvent } from "./_shared/events-data.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(EVENTS_STORE_NAME);

  // GET – List all events
  try {
    const events = (await listEvents(store)).map(toPublicEvent);

    return new Response(JSON.stringify(events), {
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
  path: "/api/events",
};
