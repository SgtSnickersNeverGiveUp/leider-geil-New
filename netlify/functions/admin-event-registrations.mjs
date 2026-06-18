import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "event-registrations";
const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

async function listRegistrations(store) {
  const { blobs } = await store.list();
  const registrations = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) registrations.push(data);
  }

  registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return registrations;
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      return jsonResponse(await listRegistrations(store));
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

    await store.delete(id);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Fehler beim Löschen." }, 500);
  }
};

export const config = {
  path: "/api/admin/event-registrations",
};
