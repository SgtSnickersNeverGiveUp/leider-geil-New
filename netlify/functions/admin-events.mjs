import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getEventsStore, listEvents } from "./_shared/events-store.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getEventsStore();

  if (req.method === "GET") {
    try {
      return jsonResponse(await listEvents(store));
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
      return jsonResponse({ success: true, id, event }, 201);
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
      return jsonResponse({ success: true, event: updated });
    } catch {
      return jsonResponse({ error: "Fehler beim Aktualisieren." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);
      await store.delete(id);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-events",
};
