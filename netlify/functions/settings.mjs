import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { toPublicSettings } from "./_shared/public-dtos.mjs";
import { readSettings } from "./_shared/settings-store.mjs";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  const settings = await readSettings();
  return jsonResponse(toPublicSettings(settings));
};

export const config = {
  path: "/api/settings",
};
