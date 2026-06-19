import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "roster-avatars";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);
  const memberId = new URL(req.url).searchParams.get("id");

  if (!memberId) {
    return jsonResponse({ error: "Member-ID fehlt." }, 400);
  }

  if (req.method === "POST") {
    try {
      const contentType = (req.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        return jsonResponse({ error: "Nur JPEG, PNG oder WebP erlaubt." }, 400);
      }

      const buffer = await req.arrayBuffer();
      if (buffer.byteLength === 0) return jsonResponse({ error: "Keine Datei empfangen." }, 400);
      if (buffer.byteLength > MAX_AVATAR_BYTES) return jsonResponse({ error: "Datei zu groß (max. 5 MB)." }, 400);

      await store.set(memberId, new Uint8Array(buffer));
      await store.setJSON(`${memberId}-meta`, {
        contentType,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString(),
      });

      const avatarUrl = `/api/roster-avatar?id=${encodeURIComponent(memberId)}`;
      return jsonResponse({ success: true, url: avatarUrl, size: buffer.byteLength });
    } catch {
      return jsonResponse({ error: "Fehler beim Upload." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      await store.delete(memberId);
      await store.delete(`${memberId}-meta`);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-roster-avatar",
};
