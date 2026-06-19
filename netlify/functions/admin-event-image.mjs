import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  getEventImagesStore,
  MAX_IMAGE_BYTES,
  mediaMetaKey,
  publicEventImageUrl,
} from "./_shared/media-stores.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getEventImagesStore();
  const eventId = new URL(req.url).searchParams.get("id");

  if (!eventId) {
    return jsonResponse({ error: "Event-ID fehlt." }, 400);
  }

  if (req.method === "POST") {
    try {
      const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
        return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
      }

      const buffer = await req.arrayBuffer();
      if (buffer.byteLength === 0) return jsonResponse({ error: "Keine Datei empfangen." }, 400);
      if (buffer.byteLength > MAX_IMAGE_BYTES) return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);

      await store.set(eventId, new Uint8Array(buffer));
      await store.setJSON(mediaMetaKey(eventId), {
        contentType,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      });

      return jsonResponse({ success: true, url: publicEventImageUrl(eventId), size: buffer.byteLength });
    } catch {
      return jsonResponse({ error: "Fehler beim Upload." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      await store.delete(eventId);
      await store.delete(mediaMetaKey(eventId));
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
