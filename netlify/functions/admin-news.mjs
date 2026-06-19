import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getNewsStore, readNews, writeNews } from "./_shared/news-store.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getNewsStore();

  if (req.method === "GET") {
    return jsonResponse(await readNews(store));
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const news = Array.isArray(body) ? body : [];
      await writeNews(news, store);
      return jsonResponse({ ok: true, count: news.length });
    } catch (err) {
      console.error("[News] save failed", err);
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-news",
};
