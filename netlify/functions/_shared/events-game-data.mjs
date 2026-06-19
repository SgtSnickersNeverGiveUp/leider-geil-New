export const EVENT_GAME_STORAGE_OPTIONS = [
  "PUBG",
  "PUBG NEWS",
  "ARC Raiders",
  "ARC Raiders NEWS",
  "NEWS",
  "Mixed",
];

export function getEventDisplayGame(rawGame = "") {
  const game = String(rawGame || "Mixed");
  if (game.endsWith(" NEWS")) return game.slice(0, -5) || "News";
  if (game === "NEWS") return "News";
  return game;
}

export function getEventType(event = {}) {
  const game = String(event.game || "");
  if (game === "NEWS" || game.endsWith(" NEWS")) return "news";
  return event.type || "event";
}

export function getEventGameVariant(game = "", type = "") {
  const normalized = String(game || "").toLowerCase();
  if (normalized.includes("pubg")) return "pubg";
  if (normalized.includes("arc raiders")) return "arc";
  if (type === "news" || normalized === "news") return "news";
  return "";
}
