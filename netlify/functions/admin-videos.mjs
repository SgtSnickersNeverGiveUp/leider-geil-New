import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { buildVideoData, toAdminVideo } from "./_shared/admin-videos-data.mjs";
import { VIDEOS_STORE_NAME, listVideos } from "./_shared/videos-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(VIDEOS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const videos = (await listVideos(store)).map(toAdminVideo);
      return jsonResponse(videos);
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const videoData = buildVideoData(await req.json());
      if (videoData.error) return jsonResponse({ error: videoData.error }, 400);

      const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const video = {
        id,
        ...videoData,
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, video);
      return jsonResponse({ success: true, id, video: toAdminVideo(video) }, 201);
    } catch {
      return jsonResponse({ error: "Fehler beim Speichern." }, 500);
    }
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

    await store.delete(id);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Fehler beim Löschen." }, 500);
  }
};

export const config = {
  path: "/api/admin/videos",
};
