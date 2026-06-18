import { isAdminAuthenticated, isAdminAuthConfigured, jsonResponse } from "./admin-auth.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return jsonResponse({
    configured: isAdminAuthConfigured(),
    authenticated: isAdminAuthenticated(req),
  });
};

export const config = {
  path: "/api/admin/session",
};
