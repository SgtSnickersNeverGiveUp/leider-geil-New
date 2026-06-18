import { ADMIN_MEDIA_URLS, toAdminMediaPreviewUrl } from "./admin-media-url-contract.mjs";

export function toAdminRosterMember(member = {}) {
  const avatar = member.avatar || "";

  return {
    ...member,
    adminAvatarPreviewUrl: toAdminMediaPreviewUrl(
      avatar,
      ADMIN_MEDIA_URLS.rosterAvatar,
      { id: member.id },
    ),
  };
}
