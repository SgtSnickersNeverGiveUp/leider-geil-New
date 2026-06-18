import { serveStoredImage } from "./_shared/media-response.mjs";

const STORE_NAME = "event-images";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const eventId = url.searchParams.get("id");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Event-ID fehlt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return serveStoredImage({
    storeName: STORE_NAME,
    imageKey: eventId,
    metaKey: `${eventId}-meta`,
    missingMessage: "No image",
  });
};

export const config = {
  path: "/api/event-image",
};
