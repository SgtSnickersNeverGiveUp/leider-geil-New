import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getEventRegistrationsStore } from "./_shared/submission-stores.mjs";

export default async (req) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const { name, email, spiel, clan, spielerAnzahl, bemerkungen } = body;

    if (!name || !email || !spiel) {
      return jsonResponse({ error: "Pflichtfelder fehlen (Name, E-Mail, Spiel)." }, 400);
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

    await getEventRegistrationsStore().setJSON(id, registration);
    return jsonResponse({ success: true, id }, 201);
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/event-registrations",
};
