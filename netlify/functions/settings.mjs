import { getStore } from "@netlify/blobs";
import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";

const STORE_NAME = "settings";
const SETTINGS_KEY = "site-settings";

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();

  try {
    const settings = await getStore(STORE_NAME).get(SETTINGS_KEY, { type: "json" });
    return jsonResponse(settings || {});
  } catch {
    return jsonResponse({});
  }
};

export const config = {
  path: "/api/settings",
};
