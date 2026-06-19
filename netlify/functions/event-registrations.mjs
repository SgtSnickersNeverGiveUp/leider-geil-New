import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { createEventRegistration } from "./_shared/event-registrations-store.mjs";

export default async (req) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const { name, email, spiel, clan, spielerAnzahl, bemerkungen } = body;

    if (!name || !email || !spiel) {
      return jsonResponse({ error: "Pflichtfelder fehlen (Name, E-Mail, Spiel)." }, 400);
    }

    const registration = await createEventRegistration({ name, email, spiel, clan, spielerAnzahl, bemerkungen });
    return jsonResponse({ success: true, id: registration.id }, 201);
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/event-registrations",
};
