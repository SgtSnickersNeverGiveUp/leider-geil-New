import { buildMediaUrl, parseMediaUrl } from "./media-url-builder.mjs";

export const ADMIN_MEDIA_URLS = Object.freeze({
  eventImage: Object.freeze({
    publicPath: "/api/event-image",
    adminPreviewPath: "/api/admin/event-image",
  }),
  bannerImage: Object.freeze({
    publicPath: "/api/banner-image",
    adminPreviewPath: "/api/admin/banner-image",
  }),
  rosterAvatar: Object.freeze({
    publicPath: "/api/roster-avatar",
    adminPreviewPath: "/api/admin/roster-avatar",
  }),
});

export function buildAdminMediaUrlPair(media, searchParams = {}) {
  return {
    publicUrl: buildMediaUrl(media.publicPath, searchParams),
    adminPreviewUrl: buildMediaUrl(media.adminPreviewPath, searchParams),
  };
}

export function isManagedPublicMediaUrl(value, media, searchParams = {}) {
  const parsed = parseMediaUrl(value);
  if (!parsed || parsed.pathname !== media.publicPath) return false;

  return Object.entries(searchParams).every(([key, expectedValue]) =>
    parsed.searchParams.get(key) === String(expectedValue)
  );
}

export function toAdminMediaPreviewUrl(value, media, searchParams = {}) {
  const mediaUrl = String(value || "");
  if (!isManagedPublicMediaUrl(mediaUrl, media, searchParams)) return mediaUrl;
  return buildMediaUrl(media.adminPreviewPath, searchParams);
}
