(function (window) {
  'use strict';

  const endpoints = Object.freeze({
    applications: '/api/applications',
    roster: '/api/roster',
    rosterAvatar: '/api/roster-avatar',
    events: '/api/events',
    eventImage: '/api/event-image',
    videos: '/api/videos',
    news: '/api/news',
    settings: '/api/settings',
    bannerImage: '/api/banner-image',
    communityShouts: '/api/community-shouts',
    eventRegistrations: '/api/event-registrations',
    twitchStatus: '/api/twitch-status',
  });

  window.LG_API_ENDPOINTS = endpoints;
})(window);
