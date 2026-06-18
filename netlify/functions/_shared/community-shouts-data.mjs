export const COMMUNITY_SHOUTS_STORE_NAME = "community-shouts";
export const COMMUNITY_SHOUT_MAX_NAME_LENGTH = 32;
export const COMMUNITY_SHOUT_MAX_MESSAGE_LENGTH = 220;

const ALLOWED_TAGS = new Set(["GG", "PUBG", "ARC", "Event", "Community"]);

export function sanitizeCommunityShoutText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeCommunityShoutTag(value) {
  return ALLOWED_TAGS.has(value) ? value : "Community";
}

export async function listCommunityShouts(store) {
  const { blobs } = await store.list();
  const shouts = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) shouts.push(data);
  }

  shouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return shouts;
}

export async function listApprovedCommunityShouts(store) {
  return (await listCommunityShouts(store)).filter((shout) => shout.approved);
}
