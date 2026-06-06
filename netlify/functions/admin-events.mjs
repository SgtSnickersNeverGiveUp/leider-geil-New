import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";

const STORE_NAME = "events";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    try {
      const { blobs } = await store.list();
      const events = [];

      for (const blob of blobs) {
        const data = await store.get(blob.key, { type: "json" });
        if (data) events.push(data);
      }

      events.sort((a, b) => new Date(b.date) - new Date(a.date));

      return new Response(JSON.stringify(events), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { title, date, game } = body;

      if (!title || !date || !game) {
        return new Response(JSON.stringify({ error: "Titel, Datum und Spiel sind Pflichtfelder." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
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

      return new Response(JSON.stringify({ success: true, id, event }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Speichern." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const existing = await store.get(id, { type: "json" });
      if (!existing) {
        return new Response(JSON.stringify({ error: "Event nicht gefunden." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

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

      return new Response(JSON.stringify({ success: true, event: updated }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Aktualisieren." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "ID fehlt." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await store.delete(id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fehler beim Löschen." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/admin/events",
};
