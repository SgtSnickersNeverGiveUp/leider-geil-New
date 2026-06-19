import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { listRoster } from "./_shared/roster-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const members = await listRoster();
    return jsonResponse(members);
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/roster",
};
