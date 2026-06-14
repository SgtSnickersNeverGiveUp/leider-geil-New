export const EVENTS_STORE_NAME = "events";

export const DEFAULT_EVENTS = [
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

export async function seedEventsIfEmpty(store) {
  const { blobs } = await store.list();
  if (blobs.length === 0) {
    for (const event of DEFAULT_EVENTS) {
      await store.setJSON(event.id, event);
    }
  }
}

export async function listEvents(store) {
  await seedEventsIfEmpty(store);
  const { blobs } = await store.list();
  const events = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) events.push(data);
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

export function toPublicEvent(event = {}) {
  return {
    id: event.id || "",
    title: event.title || "",
    date: event.date || "",
    game: event.game || "Mixed",
    description: event.description || "",
    type: event.type || "event",
    image: event.image || "",
  };
}
