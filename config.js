/* =========================================================
   Public site configuration for "Leider Geil".
   Admin-only routes belong in assets/js/admin/config.js.
   ========================================================= */

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
  twitchStatusApi: "/api/twitch-status",

  /* Public form endpoints */
  applyEndpoint: "/api/applications",
  eventRegistrationsApi: "/api/event-registrations",

  /* Public read APIs */
  rosterApi: "/api/roster",
  eventsApi: "/api/events",
  videosApi: "/api/videos",
  newsApi: "/api/news",
  settingsApi: "/api/settings",
  communityShoutsApi: "/api/community-shouts",

  /* Public fallback data */
  rosterPath: "assets/data/roster.json",
  eventsPath: "assets/data/events.json",

  /* ── Refresh-Intervalle (ms) ─────────────────────────── */
  discordRefreshInterval: 60000,
  twitchRefreshInterval: 60000,
};


