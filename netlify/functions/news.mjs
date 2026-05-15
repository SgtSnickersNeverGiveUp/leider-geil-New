import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

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

async function writeNews(store, news) {
  await store.setJSON(NEWS_KEY, news, {
    metadata: { type: "clan-news" },
  });
}

export default async (req) => {
  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const news = await readNews(store);
    return jsonResponse(news);
  }

  if (req.method === "POST") {
    const adminGuard = requireAdmin(req);
    if (adminGuard) return adminGuard;

    try {
      const body = await req.json();
      const news = Array.isArray(body) ? body : [];
      await writeNews(store, news);
      return jsonResponse({ ok: true, count: news.length });
    } catch (err) {
      console.error("[News] save failed", err);
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/news",
};
