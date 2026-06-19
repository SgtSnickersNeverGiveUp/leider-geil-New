import { serveStoredImage } from "./_shared/media-response.mjs";

const STORE_NAME = "roster-avatars";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const memberId = url.searchParams.get("id");

  if (!memberId) {
    return new Response(JSON.stringify({ error: "Member-ID fehlt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return serveStoredImage({
    storeName: STORE_NAME,
    imageKey: memberId,
    metaKey: `${memberId}-meta`,
    missingMessage: "No avatar",
  });
};

export const config = {
  path: "/api/roster-avatar",
};
