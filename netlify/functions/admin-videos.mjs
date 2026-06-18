import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "videos";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

function buildVideoData({ url, title, platform: rawPlatform }) {
  if (!url || !title) {
    return { error: "URL und Titel sind Pflichtfelder." };
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
    } catch {
      // Invalid URLs are handled by the missing videoId branch below.
    }

    if (!videoId) return { error: "Ungültiger YouTube-Link." };
    thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (platform === "twitch") {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes("twitch.tv")) {
        return { error: "Ungültiger Twitch-Link." };
      }
    } catch {
      return { error: "Ungültiger Twitch-Link." };
    }
  } else {
    return { error: "Unbekannte Plattform." };
  }

  return { title, url, platform, videoId, thumbnail };
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

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
      const videoData = buildVideoData(await req.json());
      if (videoData.error) return jsonResponse({ error: videoData.error }, 400);

      const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const video = {
        id,
        ...videoData,
        createdAt: new Date().toISOString(),
      };

      await store.setJSON(id, video);
      return jsonResponse({ success: true, id, video }, 201);
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
