(function () {
  'use strict';

  window.ADMIN_CONFIG = Object.freeze({
    applicationsApi: '/api/admin-applications',
    rosterApi: '/api/admin-roster',
    rosterAvatarApi: '/api/admin-roster-avatar',
    eventsApi: '/api/admin-events',
    eventImageApi: '/api/admin-event-image',
    videosApi: '/api/admin-videos',
    eventRegistrationsApi: '/api/admin-event-registrations',
    newsApi: '/api/admin-news',
    settingsApi: '/api/admin-settings',
    bannerImageApi: '/api/admin-banner-image',
    communityShoutsApi: '/api/admin-community-shouts',
    sessionApi: '/api/admin-session',
    loginApi: '/api/admin-login',
    logoutApi: '/api/admin-logout',
    loginPath: '/admin-login.html',
    dashboardPath: '/lg-dashboard.html',
    // Only used by admin previews/cache-busting for assets that are published publicly.
    publicAssetUrls: Object.freeze({
      eventImage: '/api/event-image',
      bannerImage: '/api/banner-image',
      rosterAvatar: '/api/roster-avatar',
    }),
  });
})();
