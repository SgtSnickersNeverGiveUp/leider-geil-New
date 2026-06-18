import { getStore } from "@netlify/blobs";

export async function serveStoredImage({
  storeName,
  imageKey,
  metaKey,
  missingMessage,
  fallbackContentType = "image/jpeg",
  cacheControl = "public, max-age=60",
}) {
  const store = getStore(storeName);

  try {
    const meta = await store.get(metaKey, { type: "json" });
    if (!meta) {
      return new Response(missingMessage, { status: 404 });
    }

    const imageData = await store.get(imageKey, { type: "arrayBuffer" });
    if (!imageData) {
      return new Response(missingMessage, { status: 404 });
    }

    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": meta.contentType || fallbackContentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch {
    return new Response(missingMessage, { status: 404 });
  }
}
