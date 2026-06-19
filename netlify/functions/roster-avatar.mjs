import { getStore } from "@netlify/blobs";
import { PUBLIC_CONTENT_URLS } from "./_shared/content-urls.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "roster-avatars";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  const store = getStore(STORE_NAME);
  const memberId = new URL(req.url).searchParams.get("id");

  if (!memberId) {
    return jsonResponse({ error: "Member-ID fehlt." }, 400);
  }

  try {
    const meta = await store.get(`${memberId}-meta`, { type: "json" });
    if (!meta) return new Response("No avatar", { status: 404 });

    const imageData = await store.get(memberId, { type: "arrayBuffer" });
    if (!imageData) return new Response("No avatar", { status: 404 });

    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": meta.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("Avatar not found", { status: 404 });
  }
};

export const config = {
  path: PUBLIC_CONTENT_URLS.rosterAvatar,
};
