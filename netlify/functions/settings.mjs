import { jsonResponse, methodNotAllowed } from "./_shared/http.mjs";
import { readSettings } from "./_shared/settings-store.mjs";

const PUBLIC_SETTINGS_KEYS = [
  "bannerUrl",
  "rosterSlideshow",
  "tickerSeparator",
  "tickerSpeedSeconds",
];

function pickPublicSettings(settings) {
  return Object.fromEntries(
    PUBLIC_SETTINGS_KEYS
      .filter((key) => Object.hasOwn(settings, key))
      .map((key) => [key, settings[key]]),
  );
}

export default async (req) => {
  if (req.method !== "GET") return methodNotAllowed();
  return jsonResponse(pickPublicSettings(await readSettings()));
};

export const config = {
  path: "/api/settings",
};
