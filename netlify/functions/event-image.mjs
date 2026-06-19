import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getEventImagesStore, mediaMetaKey } from "./_shared/media-stores.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  const store = getEventImagesStore();
  const eventId = new URL(req.url).searchParams.get("id");

  if (!eventId) {
    return jsonResponse({ error: "Event-ID fehlt." }, 400);
  }

  try {
    const meta = await store.get(mediaMetaKey(eventId), { type: "json" });
    if (!meta) return new Response("No image", { status: 404 });

    const imageData = await store.get(eventId, { type: "arrayBuffer" });
    if (!imageData) return new Response("No image", { status: 404 });

    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": meta.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
};

export const config = {
  path: "/api/event-image",
};
