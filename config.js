/* =========================================================
   Public site configuration for "Leider Geil".
   Admin-only scripts keep their endpoints under assets/js/admin/.
   ========================================================= */

window.SITE_CONFIG = {
  clanName: 'Leider Geil',
  clanTagline: 'PC-Clan - PUBG & ARC Raiders & Co.',
  heroHeading: 'Willkommen bei Leider Geil',

  videoPUBG: 'https://www.youtube.com/embed/VIDEO_ID_PUBG?autoplay=1&mute=1&loop=1&controls=0&playlist=VIDEO_ID_PUBG',
  videoARC: 'https://www.youtube.com/embed/VIDEO_ID_ARC?autoplay=1&mute=1&loop=1&controls=0&playlist=VIDEO_ID_ARC',

  discordServerId: '1123970503435100211',
  discordInviteUrl: 'https://discord.gg/dCxDZnMXbu',
  discordWidgetApi: 'https://discord.com/api/guilds/1123970503435100211/widget.json',

  twitchChannel: 'sgtsnickersnevergiveup',
  twitchStatusApi: '/api/twitch-status',

  applyEndpoint: '/api/applications',
  communityShoutsApi: '/api/community-shouts',
  eventRegistrationsApi: '/api/event-registrations',
  eventsApi: '/api/events',
  newsApi: '/api/news',
  rosterApi: '/api/roster',
  settingsApi: '/api/settings',
  videosApi: '/api/videos',

  rosterPath: 'assets/data/roster.json',
  eventsPath: 'assets/data/events.json',

  discordRefreshInterval: 60000,
  twitchRefreshInterval: 60000,
};

const SITE_CONFIG = window.SITE_CONFIG;


