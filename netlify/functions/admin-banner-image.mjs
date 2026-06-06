import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  try {
    const contentType = req.headers.get("content-type") || "image/jpeg";
    const buffer = await req.arrayBuffer();

    if (buffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Keine Datei empfangen." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (buffer.byteLength > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Datei zu groß (max. 10 MB)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await store.set(BANNER_KEY, new Uint8Array(buffer));
    await store.setJSON(META_KEY, {
      contentType,
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      url: "/api/banner-image",
      size: buffer.byteLength,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Fehler beim Upload." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/admin/banner-image",
};
