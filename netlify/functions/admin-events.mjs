import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { toAdminEvent } from "./_shared/admin-events-data.mjs";
import { EVENTS_STORE_NAME, listEvents } from "./_shared/events-data.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(EVENTS_STORE_NAME);

  if (req.method === "GET") {
    try {
      const events = (await listEvents(store)).map(toAdminEvent);
      return jsonResponse(events);
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { title, date, game } = body;

      if (!title || !date || !game) {
        return jsonResponse({ error: "Titel, Datum und Spiel sind Pflichtfelder." }, 400);
      }

      const id = `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const event = {
        id,
        title,
        date,
        game,
        description: body.description || "",
        type: body.type || "event",
        image: body.image || "",
      };

      await store.setJSON(id, event);
      return jsonResponse({ success: true, id, event: toAdminEvent(event) }, 201);
    } catch {
      return jsonResponse({ error: "Fehler beim Speichern." }, 500);
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { id } = body;
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);

      const existing = await store.get(id, { type: "json" });
      if (!existing) return jsonResponse({ error: "Event nicht gefunden." }, 404);

      const updated = {
        ...existing,
        title: body.title || existing.title,
        date: body.date || existing.date,
        game: body.game || existing.game,
        description: body.description !== undefined ? body.description : existing.description,
        type: body.type || existing.type,
        image: body.image !== undefined ? body.image : existing.image,
      };

      await store.setJSON(id, updated);
      return jsonResponse({ success: true, event: toAdminEvent(updated) });
    } catch {
      return jsonResponse({ error: "Fehler beim Aktualisieren." }, 500);
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
  path: "/api/admin/events",
};
