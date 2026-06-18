function getPublicEventGameVariant(game = "") {
  if (game === "PUBG" || game === "PUBG NEWS") return "pubg";
  if (game === "ARC Raiders" || game === "ARC Raiders NEWS") return "arc";
  if (game === "NEWS") return "news";
  return "";
}

export function toPublicEvent(event = {}) {
  const game = event.game || "Mixed";

  return {
    id: event.id || "",
    title: event.title || "",
    date: event.date || "",
    game,
    gameVariant: getPublicEventGameVariant(game),
    description: event.description || "",
    type: event.type || "event",
    image: event.image || "",
  };
}
