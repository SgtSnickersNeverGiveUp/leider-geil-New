import { getStore } from "@netlify/blobs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "videos";

async function listVideos(store) {
  const { blobs } = await store.list();
  const videos = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) videos.push(data);
  }
  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return videos;
}

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    return jsonResponse(await listVideos(getStore(STORE_NAME)));
  } catch {
    return jsonResponse({ error: "Fehler beim Laden." }, 500);
  }
};

export const config = {
  path: "/api/videos",
};
