/* =========================================================
   Admin configuration for "Leider Geil".
   This file belongs to the protected admin surface only.
   ========================================================= */

(function () {
  'use strict';

  const apiBase = '/api/admin';

  window.LG_ADMIN_CONFIG = Object.freeze({
    apiBase,
    applicationsApi: `${apiBase}/applications`,
    eventsApi: `${apiBase}/events`,
    eventImageApi: `${apiBase}/event-image`,
    videosApi: `${apiBase}/videos`,
    eventRegistrationsApi: `${apiBase}/event-registrations`,
    newsApi: `${apiBase}/news`,
    settingsApi: `${apiBase}/settings`,
    bannerImageApi: `${apiBase}/banner-image`,
    communityShoutsApi: `${apiBase}/community-shouts`,
    sessionApi: `${apiBase}/session`,
    loginApi: `${apiBase}/login`,
    logoutApi: `${apiBase}/logout`,
    rosterApi: `${apiBase}/roster`,
    rosterAvatarApi: `${apiBase}/roster-avatar`,

    /* Public read-only media URLs used for admin previews. */
    publicEventImageApi: '/api/event-image',
    publicBannerImageApi: '/api/banner-image',
    publicRosterAvatarApi: '/api/roster-avatar',
  });
})();
