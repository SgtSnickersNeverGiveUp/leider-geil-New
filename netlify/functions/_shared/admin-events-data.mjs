import { ADMIN_MEDIA_URLS, toAdminMediaPreviewUrl } from "./admin-media-url-contract.mjs";

export function toAdminEvent(event = {}) {
  const image = event.image || "";

  return {
    ...event,
    adminImagePreviewUrl: toAdminMediaPreviewUrl(
      image,
      ADMIN_MEDIA_URLS.eventImage,
      { id: event.id },
    ),
  };
}
