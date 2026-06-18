import { MEDIA_URLS, toAdminMediaPreviewUrl } from "./media-url-contract.mjs";

export function toAdminRosterMember(member = {}) {
  const avatar = member.avatar || "";

  return {
    ...member,
    adminAvatarPreviewUrl: toAdminMediaPreviewUrl(
      avatar,
      MEDIA_URLS.rosterAvatar,
      { id: member.id },
    ),
  };
}
