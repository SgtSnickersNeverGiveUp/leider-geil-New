import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  BANNER_IMAGE_KEY,
  BANNER_META_KEY,
  getBannerStore,
  MAX_IMAGE_BYTES,
  PUBLIC_BANNER_IMAGE_URL,
} from "./_shared/media-stores.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  if (req.method !== "POST") return methodNotAllowed();

  try {
    const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
      return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
    }

    const buffer = await req.arrayBuffer();
    if (buffer.byteLength === 0) return jsonResponse({ error: "Keine Datei empfangen." }, 400);
    if (buffer.byteLength > MAX_IMAGE_BYTES) return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);

    const store = getBannerStore();
    await store.set(BANNER_IMAGE_KEY, new Uint8Array(buffer));
    await store.setJSON(BANNER_META_KEY, {
      contentType,
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });

    return jsonResponse({
      success: true,
      url: PUBLIC_BANNER_IMAGE_URL,
      size: buffer.byteLength,
    });
  } catch {
    return jsonResponse({ error: "Fehler beim Upload." }, 500);
  }
};

export const config = {
  path: "/api/admin-banner-image",
};
