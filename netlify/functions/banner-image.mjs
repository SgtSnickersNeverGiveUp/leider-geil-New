import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BANNER_BYTES = 5 * 1024 * 1024;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method === "POST") {
    const adminGuard = requireAdmin(req);
    if (adminGuard) return adminGuard;
  }

  const store = getStore(STORE_NAME);

  // GET – Serve the stored banner image
  if (req.method === "GET") {
    try {
      const meta = await store.get(META_KEY, { type: "json" });
      if (!meta) {
        return new Response("No banner uploaded", { status: 404 });
      }

      const imageData = await store.get(BANNER_KEY, { type: "arrayBuffer" });
      if (!imageData) {
        return new Response("No banner uploaded", { status: 404 });
      }

      return new Response(imageData, {
        status: 200,
        headers: {
          "Content-Type": meta.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch (err) {
      return new Response("Banner not found", { status: 404 });
    }
  }

  // POST – Upload a new banner image
  if (req.method === "POST") {
    try {
      const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
      }

      const buffer = await req.arrayBuffer();

      if (buffer.byteLength === 0) {
        return jsonResponse({ error: "Keine Datei empfangen." }, 400);
      }

      // Keep uploads below Netlify's synchronous function body limit.
      if (buffer.byteLength > MAX_BANNER_BYTES) {
        return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);
      }

      // Store image binary
      await store.set(BANNER_KEY, new Uint8Array(buffer));

      // Store metadata
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
    } catch (err) {
      return jsonResponse({ error: "Fehler beim Upload." }, 500);
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/banner-image",
};
