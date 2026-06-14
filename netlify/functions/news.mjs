import { getStore } from "@netlify/blobs";
import { NEWS_STORE_NAME, readNews, toPublicNewsItem } from "./_shared/news-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const store = getStore(NEWS_STORE_NAME);
  const news = (await readNews(store)).map(toPublicNewsItem);
  return jsonResponse(news);
};

export const config = {
  path: "/api/news",
};
