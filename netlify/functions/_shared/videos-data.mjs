export const VIDEOS_STORE_NAME = "videos";

export async function listVideos(store) {
  const { blobs } = await store.list();
  const videos = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) videos.push(data);
  }

  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return videos;
}

export function buildVideoData({ url, title, platform: rawPlatform }) {
  if (!url || !title) {
    return { error: "URL und Titel sind Pflichtfelder." };
  }

  const platform = (rawPlatform || "youtube").toLowerCase();
  let videoId = null;
  let thumbnail = "";

  if (platform === "youtube") {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.hostname.includes("youtube.com")) {
        videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
      }
    } catch {
      // Invalid URLs are handled by the missing videoId branch below.
    }

    if (!videoId) return { error: "Ungueltiger YouTube-Link." };
    thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (platform === "twitch") {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes("twitch.tv")) {
        return { error: "Ungueltiger Twitch-Link." };
      }
    } catch {
      return { error: "Ungueltiger Twitch-Link." };
    }
  } else {
    return { error: "Unbekannte Plattform." };
  }

  return { title, url, platform, videoId, thumbnail };
}

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
