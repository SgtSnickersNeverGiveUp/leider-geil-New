import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { listVideos } from "./_shared/videos-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    return jsonResponse(await listVideos());
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/videos",
};
