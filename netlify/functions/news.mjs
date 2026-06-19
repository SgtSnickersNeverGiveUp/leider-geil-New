import { getStore } from "@netlify/blobs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "clan-news";
const NEWS_KEY = "news.json";

async function readNews(store) {
  try {
    const news = await store.get(NEWS_KEY, { type: "json" });
    return Array.isArray(news) ? news : [];
  } catch (err) {
    console.error("[News] read failed", err);
    return [];
  }
}

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  return jsonResponse(await readNews(getStore(STORE_NAME)));
};

export const config = {
  path: "/api/news",
};
