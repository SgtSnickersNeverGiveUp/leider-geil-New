import { NEWS_KEY } from "./news-data.mjs";

export function toAdminNewsItem(item = {}) {
  return {
    text: item.text || "",
    type: item.type || "info",
  };
}

export async function writeNews(store, news) {
  const adminNews = Array.isArray(news) ? news.map(toAdminNewsItem) : [];
  await store.setJSON(NEWS_KEY, adminNews, {
    metadata: { type: "clan-news" },
  });
}
