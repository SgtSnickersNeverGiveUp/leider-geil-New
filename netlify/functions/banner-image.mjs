import { getStore } from "@netlify/blobs";
import { methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const store = getStore(STORE_NAME);
    const meta = await store.get(META_KEY, { type: "json" });
    if (!meta) return new Response("No banner uploaded", { status: 404 });

    const imageData = await store.get(BANNER_KEY, { type: "arrayBuffer" });
    if (!imageData) return new Response("No banner uploaded", { status: 404 });

    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": meta.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("Banner not found", { status: 404 });
  }
};

export const config = {
  path: "/api/banner-image",
};
