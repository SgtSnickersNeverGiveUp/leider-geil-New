import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { PUBLIC_CONTENT_URLS } from "./_shared/content-urls.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BANNER_BYTES = 5 * 1024 * 1024;

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  if (req.method !== "POST") return methodNotAllowed();

  try {
    const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
    }

    const buffer = await req.arrayBuffer();
    if (buffer.byteLength === 0) return jsonResponse({ error: "Keine Datei empfangen." }, 400);
    if (buffer.byteLength > MAX_BANNER_BYTES) return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);

    const store = getStore(STORE_NAME);
    await store.set(BANNER_KEY, new Uint8Array(buffer));
    await store.setJSON(META_KEY, {
      contentType,
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });

    return jsonResponse({
      success: true,
      url: PUBLIC_CONTENT_URLS.bannerImage,
      size: buffer.byteLength,
    });
  } catch {
    return jsonResponse({ error: "Fehler beim Upload." }, 500);
  }
};

export const config = {
  path: "/api/admin-banner-image",
};
