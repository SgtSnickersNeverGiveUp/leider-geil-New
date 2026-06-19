import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { toPublicVideo } from "./_shared/public-dtos.mjs";
import { listVideos } from "./_shared/videos-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const videos = await listVideos();
    return jsonResponse(videos.map(toPublicVideo));
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/videos",
};
