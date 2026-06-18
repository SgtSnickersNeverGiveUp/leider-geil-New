export function toPublicVideo(video = {}) {
  return {
    id: video.id || "",
    title: video.title || "",
    url: video.url || "",
    platform: video.platform || "youtube",
    videoId: video.videoId || null,
    thumbnail: video.thumbnail || "",
    createdAt: video.createdAt || "",
  };
}
