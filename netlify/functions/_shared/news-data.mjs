export const NEWS_STORE_NAME = "clan-news";
export const NEWS_KEY = "news.json";

export async function readNews(store, logLabel = "News") {
  try {
    const news = await store.get(NEWS_KEY, { type: "json" });
    return Array.isArray(news) ? news : [];
  } catch (err) {
    console.error(`[${logLabel}] read failed`, err);
    return [];
  }
}

export async function writeNews(store, news) {
  await store.setJSON(NEWS_KEY, news, {
    metadata: { type: "clan-news" },
  });
}

export function toPublicNewsItem(item = {}) {
  return {
    text: item.text || "",
    type: item.type || "info",
  };
}
