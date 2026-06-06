import { getStore } from "@netlify/blobs";

const STORE_NAME = "clan-news";
const NEWS_KEY = "news.json";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const news = await readNews(store);
    return jsonResponse(news);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/news",
};
