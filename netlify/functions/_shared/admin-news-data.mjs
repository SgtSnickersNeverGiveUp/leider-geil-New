import { NEWS_KEY } from "./news-data.mjs";

export async function writeNews(store, news) {
  await store.setJSON(NEWS_KEY, news, {
    metadata: { type: "clan-news" },
  });
}
