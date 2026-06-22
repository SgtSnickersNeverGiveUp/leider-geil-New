import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { readSettings } from "./_shared/settings-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  return jsonResponse(await readSettings());
};

export const config = {
  path: "/api/settings",
};
