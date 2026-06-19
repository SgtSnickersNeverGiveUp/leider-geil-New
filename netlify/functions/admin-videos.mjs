import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "videos";

async function listVideos(store) {
  const { blobs } = await store.list();
  const videos = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) videos.push(data);
  }
  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return videos;
}

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      return jsonResponse(await listVideos(store));
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { url, title, platform: rawPlatform } = body;

      if (!url || !title) {
        return jsonResponse({ error: "URL und Titel sind Pflichtfelder." }, 400);
      }

      const platform = (rawPlatform || "youtube").toLowerCase();
      let videoId = null;
      let thumbnail = "";

      if (platform === "youtube") {
        try {
          const parsed = new URL(url);
          if (parsed.hostname.includes("youtu.be")) {
            videoId = parsed.pathname.slice(1);
          } else if (parsed.hostname.includes("youtube.com")) {
            videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
          }
        } catch {}

        if (!videoId) return jsonResponse({ error: "Ungültiger YouTube-Link." }, 400);
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (platform === "twitch") {
        try {
          const parsed = new URL(url);
          if (!parsed.hostname.includes("twitch.tv")) {
            return jsonResponse({ error: "Ungültiger Twitch-Link." }, 400);
          }
        } catch {
          return jsonResponse({ error: "Ungültiger Twitch-Link." }, 400);
        }
      } else {
        return jsonResponse({ error: "Unbekannte Plattform." }, 400);
      }

      const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const video = {
        id,
        title,
        url,
        platform,
        videoId,
        thumbnail,
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, video);
      return jsonResponse({ success: true, id, video }, 201);
    } catch {
      return jsonResponse({ error: "Fehler beim Speichern." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);
      await store.delete(id);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-videos",
};
