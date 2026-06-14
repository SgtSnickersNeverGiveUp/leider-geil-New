import { getStore } from "@netlify/blobs";
import { notifyEventRegistration } from "./_shared/discord-notifications.mjs";

const STORE_NAME = "event-registrations";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  // POST – Submit new event registration
  try {
    const body = await req.json();
    const { name, email, spiel, clan, spielerAnzahl, bemerkungen } = body;

    if (!name || !email || !spiel) {
      return new Response(JSON.stringify({ error: "Pflichtfelder fehlen (Name, E-Mail, Spiel)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = {
      id,
      name,
      email,
      spiel,
      clan: clan || "",
      spielerAnzahl: spielerAnzahl || "",
      bemerkungen: bemerkungen || "",
      createdAt: new Date().toISOString(),
    };

    await store.setJSON(id, registration);
    await notifyEventRegistration(registration);

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fehler beim Speichern." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/event-registrations",
};
