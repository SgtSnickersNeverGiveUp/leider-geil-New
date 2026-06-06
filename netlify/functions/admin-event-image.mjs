import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "event-images";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);
  const url = new URL(req.url);
  const eventId = url.searchParams.get("id");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Event-ID fehlt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "image/jpeg";
      const allowed = ["image/jpeg", "image/png", "image/webp"];

      if (!allowed.includes(contentType)) {
        return new Response(JSON.stringify({ error: "Nur JPEG, PNG oder WebP erlaubt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const buffer = await req.arrayBuffer();

      if (buffer.byteLength === 0) {
        return new Response(JSON.stringify({ error: "Keine Datei empfangen." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (buffer.byteLength > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Datei zu groß (max. 5 MB)." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await store.set(eventId, new Uint8Array(buffer));
      await store.setJSON(`${eventId}-meta`, {
        contentType,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      });

      const imageUrl = `/api/event-image?id=${encodeURIComponent(eventId)}`;

      return new Response(JSON.stringify({ success: true, url: imageUrl, size: buffer.byteLength }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Upload." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      await store.delete(eventId);
      await store.delete(`${eventId}-meta`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
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
  path: "/api/admin/event-image",
};
