export function toPublicNewsItem(item = {}) {
  return {
    text: item.text || "",
    type: item.type || "info",
  };
}
