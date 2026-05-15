import { createAdminLogoutCookie, jsonResponse } from "./admin-auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return jsonResponse(
    { success: true },
    200,
    { "Set-Cookie": createAdminLogoutCookie(req) },
  );
};

export const config = {
  path: "/api/admin-logout",
};
