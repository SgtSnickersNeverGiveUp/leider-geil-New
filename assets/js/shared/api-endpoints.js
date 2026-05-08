(function (global) {
  'use strict';

  const endpoints = {
    applications: '/api/applications',
    bannerImage: '/api/banner-image',
    communityShouts: '/api/community-shouts',
    eventImage: '/api/event-image',
    eventRegistrations: '/api/event-registrations',
    events: '/api/events',
    news: '/api/news',
    roster: '/api/roster',
    rosterAvatar: '/api/roster-avatar',
    settings: '/api/settings',
    twitchStatus: '/api/twitch-status',
    videos: '/api/videos',
  };

  global.LG_API_ENDPOINTS = Object.freeze({
    ...endpoints,
    ...(global.LG_API_ENDPOINTS || {}),
  });
})(window);
