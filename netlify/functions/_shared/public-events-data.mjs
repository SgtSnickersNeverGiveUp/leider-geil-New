function getPublicEventGame(rawGame = "") {
  const game = String(rawGame || "Mixed");
  if (game.endsWith(" NEWS")) return game.slice(0, -5) || "News";
  if (game === "NEWS") return "News";
  return game;
}

function getPublicEventType(event = {}) {
  const game = String(event.game || "");
  if (game === "NEWS" || game.endsWith(" NEWS")) return "news";
  return event.type || "event";
}

function getPublicEventGameVariant(game = "", type = "") {
  const normalized = String(game || "").toLowerCase();
  if (normalized.includes("pubg")) return "pubg";
  if (normalized.includes("arc raiders")) return "arc";
  if (type === "news" || normalized === "news") return "news";
  return "";
}

export function toPublicEvent(event = {}) {
  const game = getPublicEventGame(event.game);
  const type = getPublicEventType(event);

  return {
    id: event.id || "",
    title: event.title || "",
    date: event.date || "",
    game,
    gameVariant: getPublicEventGameVariant(game, type),
    description: event.description || "",
    type,
    image: event.image || "",
  };
}
