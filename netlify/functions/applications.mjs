import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { getApplicationsStore } from "./_shared/submission-stores.mjs";

export default async (req) => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const { gamingId, alter, hauptspiel, rolle, ueberMich } = body;

    if (!gamingId || !alter || !hauptspiel || !rolle || !ueberMich) {
      return jsonResponse({ error: "Alle Felder müssen ausgefüllt sein." }, 400);
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

    await getApplicationsStore().setJSON(id, application);
    return jsonResponse({ success: true, id }, 201);
  } catch {
    return jsonResponse({ error: "Fehler beim Speichern." }, 500);
  }
};

export const config = {
  path: "/api/applications",
};
