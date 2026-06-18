import { getStore } from "@netlify/blobs";

const STORE_NAME = "event-images";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);
  const url = new URL(req.url);
  const eventId = url.searchParams.get("id");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Event-ID fehlt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET – Serve the stored event image
  try {
    const meta = await store.get(`${eventId}-meta`, { type: "json" });
    if (!meta) {
      return new Response("No image", { status: 404 });
    }

    const imageData = await store.get(eventId, { type: "arrayBuffer" });
    if (!imageData) {
      return new Response("No image", { status: 404 });
    }

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
