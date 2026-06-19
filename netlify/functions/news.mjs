import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { readNews } from "./_shared/news-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  return jsonResponse(await readNews());
};

export const config = {
  path: "/api/news",
};
