import { getStore } from "@netlify/blobs";
import {
  APPLICATIONS_STORE_NAME,
  createApplication,
  hasRequiredApplicationFields,
} from "./_shared/applications-data.mjs";
import { notifyApplicationSubmission } from "./_shared/discord-notifications.mjs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore(APPLICATIONS_STORE_NAME);

  // POST – Submit new application
  try {
    const application = createApplication(await req.json());
    if (!hasRequiredApplicationFields(application)) {
      return new Response(JSON.stringify({ error: "Alle Felder müssen ausgefüllt sein." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await store.setJSON(application.id, application);
    await notifyApplicationSubmission(application);

    return new Response(JSON.stringify({ success: true, id: application.id }), {
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
