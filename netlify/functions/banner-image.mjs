import { methodNotAllowed } from "./_shared/http.mjs";
import { BANNER_IMAGE_KEY, BANNER_META_KEY, getBannerStore } from "./_shared/media-stores.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const store = getBannerStore();
    const meta = await store.get(BANNER_META_KEY, { type: "json" });
    if (!meta) return new Response("No banner uploaded", { status: 404 });

    const imageData = await store.get(BANNER_IMAGE_KEY, { type: "arrayBuffer" });
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
