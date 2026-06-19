export function toAdminCommunityShout(shout = {}) {
  return {
    id: shout.id || "",
    name: shout.name || "",
    message: shout.message || "",
    tag: shout.tag || "Community",
    approved: Boolean(shout.approved),
    createdAt: shout.createdAt || "",
    moderatedAt: shout.moderatedAt || "",
  };
}
