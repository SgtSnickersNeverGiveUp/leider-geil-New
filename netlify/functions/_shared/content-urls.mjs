export const PUBLIC_CONTENT_URLS = Object.freeze({
  bannerImage: "/api/banner-image",
  eventImage: "/api/event-image",
  rosterAvatar: "/api/roster-avatar",
});

export function buildEventImageUrl(eventId) {
  return `${PUBLIC_CONTENT_URLS.eventImage}?id=${encodeURIComponent(eventId)}`;
}

export function buildRosterAvatarUrl(memberId) {
  return `${PUBLIC_CONTENT_URLS.rosterAvatar}?id=${encodeURIComponent(memberId)}`;
}
