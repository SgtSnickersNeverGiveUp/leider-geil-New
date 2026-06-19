import { getStore } from "@netlify/blobs";

export const VIDEOS_STORE_NAME = "videos";

export function getVideosStore() {
  return getStore(VIDEOS_STORE_NAME);
}

export async function listVideos(store = getVideosStore()) {
  const { blobs } = await store.list();
  const videos = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) videos.push(data);
  }

  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return videos;
}
