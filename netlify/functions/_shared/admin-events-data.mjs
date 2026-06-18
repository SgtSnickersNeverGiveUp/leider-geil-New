import { ADMIN_MEDIA_URLS, toAdminMediaPreviewUrl } from "./admin-media-url-contract.mjs";

function getAdminEventGameVariant(game = "") {
  const normalized = String(game || "").toLowerCase();
  if (normalized.includes("pubg")) return "pubg";
  if (normalized.includes("arc raiders")) return "arc";
  if (normalized === "news") return "news";
  return "";
}

export function toAdminEvent(event = {}) {
  const image = event.image || "";

  return {
    ...event,
    gameVariant: getAdminEventGameVariant(event.game),
    adminImagePreviewUrl: toAdminMediaPreviewUrl(
      image,
      ADMIN_MEDIA_URLS.eventImage,
      { id: event.id },
    ),
  };
}
