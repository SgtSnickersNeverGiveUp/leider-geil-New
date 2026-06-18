import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { NEWS_STORE_NAME, readNews, writeNews } from "./_shared/news-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(NEWS_STORE_NAME);

  if (req.method === "GET") {
    return jsonResponse(await readNews(store, "Admin News"));
  }

  try {
    const body = await req.json();
    const news = Array.isArray(body) ? body : [];
    await writeNews(store, news);
    return jsonResponse({ ok: true, count: news.length });
  } catch (err) {
    console.error("[Admin News] save failed", err);
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
};

export const config = {
  path: "/api/admin/news",
};
