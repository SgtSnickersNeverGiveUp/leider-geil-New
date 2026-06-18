import { getStore } from "@netlify/blobs";
import { VIDEOS_STORE_NAME, listVideos } from "./_shared/videos-data.mjs";
import { toPublicVideo } from "./_shared/public-videos-data.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(VIDEOS_STORE_NAME);

  // GET – List all videos
  try {
    const videos = (await listVideos(store)).map(toPublicVideo);

    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/videos",
};
