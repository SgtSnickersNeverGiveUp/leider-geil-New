import { getStore } from "@netlify/blobs";

export const ALLOWED_IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const BANNER_STORE_NAME = "banner";
export const BANNER_IMAGE_KEY = "header-banner";
export const BANNER_META_KEY = "header-banner-meta";
export const PUBLIC_BANNER_IMAGE_URL = "/api/banner-image";

export const EVENT_IMAGES_STORE_NAME = "event-images";
export const PUBLIC_EVENT_IMAGE_URL = "/api/event-image";

export const ROSTER_AVATARS_STORE_NAME = "roster-avatars";
export const PUBLIC_ROSTER_AVATAR_URL = "/api/roster-avatar";

export function getBannerStore() {
  return getStore(BANNER_STORE_NAME);
}

export function getEventImagesStore() {
  return getStore(EVENT_IMAGES_STORE_NAME);
}

export function getRosterAvatarsStore() {
  return getStore(ROSTER_AVATARS_STORE_NAME);
}

export function mediaMetaKey(id) {
  return `${id}-meta`;
}

export function publicEventImageUrl(eventId) {
  return `${PUBLIC_EVENT_IMAGE_URL}?id=${encodeURIComponent(eventId)}`;
}

export function publicRosterAvatarUrl(memberId) {
  return `${PUBLIC_ROSTER_AVATAR_URL}?id=${encodeURIComponent(memberId)}`;
}
