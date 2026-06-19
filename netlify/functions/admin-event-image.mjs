import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { buildEventImageUrl } from "./_shared/content-urls.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "event-images";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);
  const eventId = new URL(req.url).searchParams.get("id");

  if (!eventId) {
    return jsonResponse({ error: "Event-ID fehlt." }, 400);
  }

  if (req.method === "POST") {
    try {
      const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
      }

      const buffer = await req.arrayBuffer();
      if (buffer.byteLength === 0) return jsonResponse({ error: "Keine Datei empfangen." }, 400);
      if (buffer.byteLength > MAX_IMAGE_BYTES) return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);

      await store.set(eventId, new Uint8Array(buffer));
      await store.setJSON(`${eventId}-meta`, {
        contentType,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      });

      const imageUrl = buildEventImageUrl(eventId);
      return jsonResponse({ success: true, url: imageUrl, size: buffer.byteLength });
    } catch {
      return jsonResponse({ error: "Fehler beim Upload." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      await store.delete(eventId);
      await store.delete(`${eventId}-meta`);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-event-image",
};
