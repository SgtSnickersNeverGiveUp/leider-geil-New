const PUBLIC_SETTINGS_KEYS = [
  "bannerUrl",
  "tickerSpeedSeconds",
  "tickerSeparator",
  "rosterSlideshow",
];

export function toPublicSettings(settings = {}) {
  return PUBLIC_SETTINGS_KEYS.reduce((publicSettings, key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      publicSettings[key] = settings[key];
    }
    return publicSettings;
  }, {});
}

export function toPublicRosterMember(member = {}) {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    avatar: member.avatar,
    games: Array.isArray(member.games) ? member.games : [],
    clanRole: member.clanRole,
    bio: member.bio || "",
    funTags: Array.isArray(member.funTags) ? member.funTags : [],
    gender: member.gender || "",
  };
}

export function toPublicEvent(event = {}) {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    game: event.game,
    description: event.description || "",
    type: event.type || "event",
    image: event.image || "",
  };
}

export function toPublicNewsItem(item = {}) {
  return {
    text: item.text || "",
    type: item.type || "info",
  };
}

export function toPublicVideo(video = {}) {
  return {
    id: video.id,
    title: video.title,
    url: video.url,
    platform: video.platform || "youtube",
    videoId: video.videoId || null,
    thumbnail: video.thumbnail || "",
  };
}
