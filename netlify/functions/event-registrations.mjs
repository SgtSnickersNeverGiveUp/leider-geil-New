import { getStore } from "@netlify/blobs";
import {
  EVENT_REGISTRATIONS_STORE_NAME,
  createEventRegistration,
  hasRequiredEventRegistrationFields,
} from "./_shared/event-registrations-data.mjs";
import { notifyEventRegistration } from "./_shared/discord-notifications.mjs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(EVENT_REGISTRATIONS_STORE_NAME);

  try {
    const registration = createEventRegistration(await req.json());
    if (!hasRequiredEventRegistrationFields(registration)) {
      return new Response(JSON.stringify({ error: "Pflichtfelder fehlen (Name, E-Mail, Spiel)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await store.setJSON(registration.id, registration);
    await notifyEventRegistration(registration);

    return new Response(JSON.stringify({ success: true, id: registration.id }), {
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
