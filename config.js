/* =========================================================
   config.js – Zentrale Konfiguration für „Leider Geil"
   Alle Platzhalter hier anpassen, kein Quellcode-Ändern nötig.
   ========================================================= */

const API_ENDPOINTS = window.LG_API_ENDPOINTS || {
  applications: "/api/applications",
  roster: "/api/roster",
  rosterAvatar: "/api/roster-avatar",
  events: "/api/events",
  eventImage: "/api/event-image",
  videos: "/api/videos",
  news: "/api/news",
  settings: "/api/settings",
  communityShouts: "/api/community-shouts",
  eventRegistrations: "/api/event-registrations",
  twitchStatus: "/api/twitch-status",
};

const SITE_CONFIG = {

  /* ── Clan-Infos ──────────────────────────────────────── */
  clanName: "Leider Geil",
  clanTagline: "PC-Clan – PUBG & ARC Raiders & Co.",
  heroHeading: "Willkommen bei Leider Geil",

  /* ── Hero-Videos (Embed-URLs) ────────────────────────── */
  videoPUBG: "https://www.youtube.com/embed/VIDEO_ID_PUBG?autoplay=1&mute=1&loop=1&controls=0&playlist=VIDEO_ID_PUBG",
  videoARC: "https://www.youtube.com/embed/VIDEO_ID_ARC?autoplay=1&mute=1&loop=1&controls=0&playlist=VIDEO_ID_ARC",

  /* ── Discord ─────────────────────────────────────────── */
  discordServerId: "1123970503435100211",
  discordInviteUrl: "https://discord.gg/dCxDZnMXbu",
  // Öffentliches Widget – kein Token nötig
  discordWidgetApi: "https://discord.com/api/guilds/1123970503435100211/widget.json",

  /* ── Twitch ──────────────────────────────────────────── */
  twitchChannel: "sgtsnickersnevergiveup",
  twitchStatusApi: API_ENDPOINTS.twitchStatus,

  /* ── Bewerbungs-Endpoint ─────────────────────────────── */
  applyEndpoint: API_ENDPOINTS.applications,

  /* ── API-Endpunkte ──────────────────────────────────── */
  rosterApi: API_ENDPOINTS.roster,
  rosterAvatarApi: API_ENDPOINTS.rosterAvatar,
  eventsApi: API_ENDPOINTS.events,
  eventImageApi: API_ENDPOINTS.eventImage,
  videosApi: API_ENDPOINTS.videos,
  newsApi: API_ENDPOINTS.news,
  settingsApi: API_ENDPOINTS.settings,
  communityShoutsApi: API_ENDPOINTS.communityShouts,
  eventRegistrationsApi: API_ENDPOINTS.eventRegistrations,

  /* ── Datenpfade (Fallback) ─────────────────────────── */
  rosterPath: "assets/data/roster.json",
  eventsPath: "assets/data/events.json",

  /* ── Refresh-Intervalle (ms) ─────────────────────────── */
  discordRefreshInterval: 60000,
  twitchRefreshInterval: 60000,
};

window.SITE_CONFIG = SITE_CONFIG;


