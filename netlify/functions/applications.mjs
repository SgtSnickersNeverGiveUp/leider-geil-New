import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { createApplication } from "./_shared/applications-store.mjs";

export default async (req) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const { gamingId, alter, hauptspiel, rolle, ueberMich } = body;

    if (!gamingId || !alter || !hauptspiel || !rolle || !ueberMich) {
      return jsonResponse({ error: "Alle Felder müssen ausgefüllt sein." }, 400);
    }

    const application = await createApplication({ gamingId, alter, hauptspiel, rolle, ueberMich });
    return jsonResponse({ success: true, id: application.id }, 201);
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/applications",
};
