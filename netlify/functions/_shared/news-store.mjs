import { getStore } from "@netlify/blobs";

export const NEWS_STORE_NAME = "clan-news";
export const NEWS_KEY = "news.json";

export function getNewsStore() {
  return getStore(NEWS_STORE_NAME);
}

export async function readNews(store = getNewsStore()) {
  try {
    const news = await store.get(NEWS_KEY, { type: "json" });
    return Array.isArray(news) ? news : [];
  } catch (err) {
    console.error("[News] read failed", err);
    return [];
  }
}

export async function writeNews(news, store = getNewsStore()) {
  await store.setJSON(NEWS_KEY, news, {
    metadata: { type: "clan-news" },
  });
}
