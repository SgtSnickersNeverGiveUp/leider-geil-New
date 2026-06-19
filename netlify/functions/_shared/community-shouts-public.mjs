import {
  ALLOWED_SHOUT_TAGS,
  MAX_SHOUT_MESSAGE_LENGTH,
  MAX_SHOUT_NAME_LENGTH,
  createShoutId,
  isShoutVisible,
  listStoredShouts,
  sanitizeText,
  toPublicShout,
} from "./community-shouts-store.mjs";

export async function listVisibleShouts(store) {
  return (await listStoredShouts(store))
    .filter(isShoutVisible)
    .map(toPublicShout);
}

export function buildPendingShout(body) {
  const name = sanitizeText(body.name, MAX_SHOUT_NAME_LENGTH);
  const message = sanitizeText(body.message, MAX_SHOUT_MESSAGE_LENGTH);
  const tag = ALLOWED_SHOUT_TAGS.has(body.tag) ? body.tag : "Community";

  if (!name || !message) return null;

  return {
    id: createShoutId(),
    name,
    message,
    tag,
    visible: false,
    createdAt: new Date().toISOString(),
  };
}
