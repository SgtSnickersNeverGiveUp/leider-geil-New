import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { toAdminEventRegistration } from "./_shared/admin-event-registrations-data.mjs";
import {
  EVENT_REGISTRATIONS_STORE_NAME,
  listEventRegistrations,
} from "./_shared/event-registrations-data.mjs";

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export default async (req) => {
  if (req.method !== "GET" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(EVENT_REGISTRATIONS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const registrations = (await listEventRegistrations(store)).map(toAdminEventRegistration);
      return jsonResponse(registrations);
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
