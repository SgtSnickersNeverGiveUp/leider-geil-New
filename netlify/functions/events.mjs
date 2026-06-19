import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { toPublicEvent } from "./_shared/public-dtos.mjs";
import { listEvents } from "./_shared/events-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const events = await listEvents();
    return jsonResponse(events.map(toPublicEvent));
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/events",
};
