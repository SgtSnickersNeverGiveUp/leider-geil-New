import { getStore } from "@netlify/blobs";

export const COMMUNITY_SHOUTS_STORE_NAME = "community-shouts";
export const MAX_SHOUT_NAME_LENGTH = 32;
export const MAX_SHOUT_MESSAGE_LENGTH = 220;
export const ALLOWED_SHOUT_TAGS = new Set(["GG", "PUBG", "ARC", "Event", "Community"]);

export function getCommunityShoutsStore() {
  return getStore(COMMUNITY_SHOUTS_STORE_NAME);
}

export function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function listAllShouts(store = getCommunityShoutsStore()) {
  const { blobs } = await store.list();
  const shouts = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) shouts.push(data);
  }

  shouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return shouts;
}

export async function listApprovedShouts(store = getCommunityShoutsStore()) {
  return (await listAllShouts(store)).filter((shout) => shout?.approved);
}
