import { getStore } from "@netlify/blobs";

const STORE_NAME = "roster-avatars";

export default async (req) => {
  const store = getStore(STORE_NAME);
  const url = new URL(req.url);
  const memberId = url.searchParams.get("id");

  if (!memberId) {
    return new Response(JSON.stringify({ error: "Member-ID fehlt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET – Serve the stored avatar image
  if (req.method === "GET") {
    try {
      const meta = await store.get(`${memberId}-meta`, { type: "json" });
      if (!meta) {
        return new Response("No avatar", { status: 404 });
      }

      const imageData = await store.get(memberId, { type: "arrayBuffer" });
      if (!imageData) {
        return new Response("No avatar", { status: 404 });
      }

      return new Response(imageData, {
        status: 200,
        headers: {
          "Content-Type": meta.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch {
      return new Response("Avatar not found", { status: 404 });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/roster-avatar",
};
