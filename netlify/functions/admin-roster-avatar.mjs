import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { serveStoredImage } from "./_shared/media-response.mjs";

const STORE_NAME = "roster-avatars";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getMemberId(req) {
  const url = new URL(req.url);
  return url.searchParams.get("id");
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const memberId = getMemberId(req);
  if (!memberId) return jsonResponse({ error: "Member-ID fehlt." }, 400);

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    return serveStoredImage({
      storeName: STORE_NAME,
      imageKey: memberId,
      metaKey: `${memberId}-meta`,
      missingMessage: "No avatar",
      cacheControl: "private, no-store",
    });
  }

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "image/jpeg";
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
      }

      const buffer = await req.arrayBuffer();
      if (buffer.byteLength === 0) {
        return jsonResponse({ error: "Keine Datei empfangen." }, 400);
      }
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);
      }

      await store.set(memberId, new Uint8Array(buffer));
      await store.setJSON(`${memberId}-meta`, {
        contentType,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      });

      return jsonResponse({
        success: true,
        url: `/api/roster-avatar?id=${encodeURIComponent(memberId)}`,
        previewUrl: `/api/admin/roster-avatar?id=${encodeURIComponent(memberId)}`,
        size: buffer.byteLength,
      });
    } catch {
      return jsonResponse({ error: "Fehler beim Upload." }, 500);
    }
  }

  try {
    await store.delete(memberId);
    await store.delete(`${memberId}-meta`);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Fehler beim Löschen." }, 500);
  }
};

export const config = {
  path: "/api/admin/roster-avatar",
};
