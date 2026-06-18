import { MEDIA_URLS, toAdminMediaPreviewUrl } from "./media-url-contract.mjs";

export function toAdminEvent(event = {}) {
  const image = event.image || "";

  return {
    ...event,
    adminImagePreviewUrl: toAdminMediaPreviewUrl(
      image,
      MEDIA_URLS.eventImage,
      { id: event.id },
    ),
  };
}
