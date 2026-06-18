/* =========================================================
   Public site configuration for "Leider Geil".
   This file belongs to the public/index surface only.
   ========================================================= */

(function () {
  'use strict';

  window.SITE_CONFIG = Object.freeze({
    /* Clan-Infos */
    clanName: 'Leider Geil',
    clanTagline: 'PC-Clan - PUBG & ARC Raiders & Co.',
    heroHeading: 'Willkommen bei Leider Geil',

    /* Public API-Endpunkte */
    applyEndpoint: '/api/applications',
    rosterApi: '/api/roster',
    eventsApi: '/api/events',
    videosApi: '/api/videos',
    newsApi: '/api/news',
    settingsApi: '/api/public-settings',
    communityShoutsApi: '/api/community-shouts',
    eventRegistrationsApi: '/api/event-registrations',
    visitorCounterApi: '/api/visitor-count',

    /* Public Datenpfade (Fallback) */
    eventsPath: '/assets/data/events.json',
  });
})();
