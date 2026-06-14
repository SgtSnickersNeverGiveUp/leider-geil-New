import { ADMIN_MEDIA_URLS, toAdminMediaPreviewUrl } from "./admin-media-url-contract.mjs";
import { getEventGameVariant } from "./events-game-data.mjs";

export function toAdminEvent(event = {}) {
  const image = event.image || "";

  return {
    ...event,
    gameVariant: getEventGameVariant(event.game, event.type),
    adminImagePreviewUrl: toAdminMediaPreviewUrl(
      image,
      ADMIN_MEDIA_URLS.eventImage,
      { id: event.id },
    ),
  };
}
