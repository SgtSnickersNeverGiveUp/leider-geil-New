export function toPublicCommunityShout(shout = {}) {
  return {
    name: shout.name || "",
    message: shout.message || "",
    tag: shout.tag || "Community",
  };
}
