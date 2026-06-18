import { serveStoredImage } from "./_shared/media-response.mjs";

const STORE_NAME = "banner";
const BANNER_KEY = "header-banner";
const META_KEY = "header-banner-meta";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  return serveStoredImage({
    storeName: STORE_NAME,
    imageKey: BANNER_KEY,
    metaKey: META_KEY,
    missingMessage: "No banner uploaded",
  });
};

export const config = {
  path: "/api/banner-image",
};
