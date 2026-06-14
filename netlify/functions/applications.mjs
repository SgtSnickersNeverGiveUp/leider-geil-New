import { getStore } from "@netlify/blobs";
import { notifyApplicationSubmission } from "./_shared/discord-notifications.mjs";

const STORE_NAME = "applications";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(STORE_NAME);

  // POST – Submit new application
  try {
    const body = await req.json();
    const { gamingId, alter, hauptspiel, rolle, ueberMich } = body;

    if (!gamingId || !alter || !hauptspiel || !rolle || !ueberMich) {
      return new Response(JSON.stringify({ error: "Alle Felder müssen ausgefüllt sein." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const application = {
      id,
      gamingId,
      alter: Number(alter),
      hauptspiel,
      rolle,
      ueberMich,
      createdAt: new Date().toISOString(),
    };

    await store.setJSON(id, application);
    await notifyApplicationSubmission(application);

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
  path: "/api/applications",
};
