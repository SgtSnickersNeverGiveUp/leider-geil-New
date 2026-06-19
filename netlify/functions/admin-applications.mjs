import { requireAdmin } from "./admin-auth.mjs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { deleteApplication, listApplications } from "./_shared/applications-store.mjs";

export default async (req) => {
  const adminGuard = requireAdmin(req);
  if (adminGuard) return adminGuard;

  if (req.method === "GET") {
    try {
      return jsonResponse(await listApplications());
    } catch {
      return jsonResponse({ error: "Fehler beim Laden." }, 500);
    }
  }

  if (req.method === "DELETE") {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return jsonResponse({ error: "ID fehlt." }, 400);
      await deleteApplication(id);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Fehler beim Löschen." }, 500);
    }
  }

  return methodNotAllowed();
};

export const config = {
  path: "/api/admin-applications",
};
