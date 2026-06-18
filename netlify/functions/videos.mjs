import { getStore } from "@netlify/blobs";

const STORE_NAME = "videos";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  // GET – List all videos
  try {
    const { blobs } = await store.list();
    const videos = [];

    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) videos.push(data);
    }

    // Sort newest first
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
