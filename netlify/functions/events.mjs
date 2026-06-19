import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { listEvents } from "./_shared/events-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    return jsonResponse(await listEvents());
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/events",
};
