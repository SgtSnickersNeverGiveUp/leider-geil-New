import { getStore } from "@netlify/blobs";

export const SETTINGS_STORE_NAME = "settings";
export const SETTINGS_KEY = "site-settings";

export function getSettingsStore() {
  return getStore(SETTINGS_STORE_NAME);
}

export async function readSettings(store = getSettingsStore()) {
  try {
    return (await store.get(SETTINGS_KEY, { type: "json" })) || {};
  } catch {
    return {};
  }
}

export async function readPublicSettings(store = getSettingsStore()) {
  const settings = await readSettings(store);
  return {
    bannerUrl: settings.bannerUrl || "",
    rosterSlideshow: settings.rosterSlideshow || {},
    tickerSpeedSeconds: settings.tickerSpeedSeconds,
    tickerSeparator: settings.tickerSeparator,
  };
}

export async function mergeSettings(update, store = getSettingsStore()) {
  const existing = await readSettings(store);
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  await store.setJSON(SETTINGS_KEY, updated);
  return updated;
}
