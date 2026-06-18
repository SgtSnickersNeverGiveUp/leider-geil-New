import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  try {
    const store = getStore(STORE_NAME);
    const contentType = req.headers.get("content-type") || "image/jpeg";
    const buffer = await req.arrayBuffer();

    if (buffer.byteLength === 0) {
      return jsonResponse({ error: "Keine Datei empfangen." }, 400);
    }

    if (buffer.byteLength > 10 * 1024 * 1024) {
      return jsonResponse({ error: "Datei zu groß (max. 10 MB)." }, 400);
    }

    await store.set(BANNER_KEY, new Uint8Array(buffer));
    await store.setJSON(META_KEY, {
      contentType,
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });

    return jsonResponse({
      success: true,
      url: "/api/banner-image",
      size: buffer.byteLength,
    });
  } catch {
    return jsonResponse({ error: "Fehler beim Upload." }, 500);
  }
};

export const config = {
  path: "/api/admin/banner-image",
};
