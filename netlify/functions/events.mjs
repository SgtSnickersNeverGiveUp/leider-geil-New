import { getStore } from "@netlify/blobs";

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
  if (blobs.length === 0) {
    for (const event of DEFAULT_EVENTS) {
      await store.setJSON(event.id, event);
    }
  }
}

export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  // GET – List all events
  try {
    await seedIfEmpty(store);
    const { blobs } = await store.list();
    const events = [];

    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) events.push(data);
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fehler beim Laden." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/events",
};
