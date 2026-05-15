import {
  createAdminSessionCookie,
  isAdminAuthConfigured,
  jsonResponse,
  verifyAdminPassword,
} from "./admin-auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!isAdminAuthConfigured()) {
    return jsonResponse({ error: "Admin login is not configured." }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  if (!verifyAdminPassword(body?.password)) {
    return jsonResponse({ error: "Invalid password." }, 401);
  }

  return jsonResponse(
    { success: true },
    200,
    { "Set-Cookie": createAdminSessionCookie(req) },
  );
};

export const config = {
  path: "/api/admin-login",
};
