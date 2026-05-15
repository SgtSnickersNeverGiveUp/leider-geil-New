import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "videos";

export default async (req) => {
  if (req.method === "POST" || req.method === "DELETE") {
    const adminGuard = requireAdmin(req);
    if (adminGuard) return adminGuard;
  }

  const store = getStore(STORE_NAME);

  // POST – Add new video
    // POST – Add new video
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { url, title, platform: rawPlatform } = body;

      if (!url || !title) {
        return new Response(JSON.stringify({ error: "URL und Titel sind Pflichtfelder." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const platform = (rawPlatform || "youtube").toLowerCase();

      let videoId = null;
      let thumbnail = "";
      
      if (platform === "youtube") {
        // YouTube: wie bisher ID + Thumbnail aus der URL ziehen
        try {
          const parsed = new URL(url);
          if (parsed.hostname.includes("youtu.be")) {
            videoId = parsed.pathname.slice(1);
          } else if (parsed.hostname.includes("youtube.com")) {
            videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
          }
        } catch {
          // not a valid URL
        }

        if (!videoId) {
          return new Response(JSON.stringify({ error: "Ungültiger YouTube-Link." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else if (platform === "twitch") {
        // Twitch: keine YouTube-Prüfung, nur grob checken, dass es ein Twitch-Link ist
        try {
          const parsed = new URL(url);
          if (!parsed.hostname.includes("twitch.tv")) {
            return new Response(JSON.stringify({ error: "Ungültiger Twitch-Link." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          return new Response(JSON.stringify({ error: "Ungültiger Twitch-Link." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        videoId = null; // für Twitch nicht benötigt
        thumbnail = ""; // kannst du später mit Twitch API befüllen, jetzt leer lassen
      } else {
        return new Response(JSON.stringify({ error: "Unbekannte Plattform." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
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

      return new Response(JSON.stringify({ success: true, id, video }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Fehler beim Speichern." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET – List all videos
  if (req.method === "GET") {
    try {
      const { blobs } = await store.list();
      const videos = [];

      for (const blob of blobs) {
        const data = await store.get(blob.key, { type: "json" });
        if (data) videos.push(data);
      }

      // Sort newest first
      videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return new Response(JSON.stringify(videos), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE – Remove video by id
  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await store.delete(id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Fehler beim Löschen." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/videos",
};
