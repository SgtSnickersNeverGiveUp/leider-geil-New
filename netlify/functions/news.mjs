import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { readNews } from "./_shared/news-store.mjs";
import { toPublicNewsItem } from "./_shared/public-dtos.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  const news = await readNews();
  return jsonResponse(news.map(toPublicNewsItem));
};

export const config = {
  path: "/api/news",
};
