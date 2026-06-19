export function toPublicRosterMember(member = {}) {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    avatar: member.avatar,
    games: Array.isArray(member.games) ? member.games : [],
    clanRole: member.clanRole || "Member",
    bio: member.bio || "",
    funTags: Array.isArray(member.funTags) ? member.funTags : [],
    gender: member.gender || "",
  };
}
