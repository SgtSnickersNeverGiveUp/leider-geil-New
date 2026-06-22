import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "events";

const DEFAULT_EVENTS = [
  {
    id: "e001",
    title: "Clan-Gründung",
    date: "2024-08-25",
    game: "PUBG",
    description: "Leider Geil wurde offiziell gegründet – die ersten Squads stehen!",
    type: "milestone",
  },
  {
    id: "e002",
    title: "Erster PUBG Custom Match",
    date: "2024-09-15",
    game: "PUBG",
    description: "Unser erstes internes Custom-Match mit 24 Teilnehmern.",
    type: "match",
  },
  {
    id: "e003",
    title: "ARC Raiders Early Access",
    date: "2025-01-20",
    game: "ARC Raiders",
    description: "Start der ARC Raiders Division – Recruiting-Phase beginnt.",
    type: "milestone",
  },
  {
    id: "e004",
    title: "Community Night #1",
    date: "2025-03-08",
    game: "Mixed",
    description: "Erste große Community Night mit Giveaways und Turnieren.",
    type: "event",
  },
  {
    id: "e005",
    title: "Saison 2 – Ranked Push",
    date: "2025-06-01",
    game: "PUBG",
    description: "Gemeinsamer Ranked-Push: Ziel ist Top 500 EU.",
    type: "match",
  },
];

async function seedIfEmpty(store) {
  const { blobs } = await store.list();
  if (blobs.length > 0) return;
  for (const event of DEFAULT_EVENTS) {
    await store.setJSON(event.id, event);
  }
}

async function listEvents(store) {
  await seedIfEmpty(store);
  const { blobs } = await store.list();
  const events = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) events.push(data);
  }
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  const store = getStore(STORE_NAME);

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
