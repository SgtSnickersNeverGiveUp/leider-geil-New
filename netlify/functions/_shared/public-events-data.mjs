export function toPublicEvent(event = {}) {
  return {
    id: event.id || "",
    title: event.title || "",
    date: event.date || "",
    game: event.game || "Mixed",
    description: event.description || "",
    type: event.type || "event",
    image: event.image || "",
  };
}
