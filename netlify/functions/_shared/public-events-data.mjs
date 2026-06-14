import {
  getEventDisplayGame,
  getEventGameVariant,
  getEventType,
} from "./events-game-data.mjs";

export function toPublicEvent(event = {}) {
  const game = getEventDisplayGame(event.game);
  const type = getEventType(event);

  return {
    id: event.id || "",
    title: event.title || "",
    date: event.date || "",
    game,
    gameVariant: getEventGameVariant(game, type),
    description: event.description || "",
    type,
    image: event.image || "",
  };
}
