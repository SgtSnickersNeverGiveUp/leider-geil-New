(function () {
  'use strict';

  const PUBLIC_CONTENT_URLS = Object.freeze({
    bannerImage: '/api/banner-image',
    eventImage: '/api/event-image',
    rosterAvatar: '/api/roster-avatar',
  });

  function normalizeUrl(value) {
    return String(value || '');
  }

  function isContentUrl(value, type) {
    const url = normalizeUrl(value);
    const baseUrl = PUBLIC_CONTENT_URLS[type];
    if (!baseUrl) return false;
    return url === baseUrl || url.startsWith(`${baseUrl}?`);
  }

  function withCacheBuster(value, type, cacheValue = Math.floor(Date.now() / 60000)) {
    const url = normalizeUrl(value);
    if (!url || !isContentUrl(url, type)) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${encodeURIComponent(cacheValue)}`;
  }

  window.LG_CONTENT_URLS = Object.freeze({
    publicContentUrls: PUBLIC_CONTENT_URLS,
    isContentUrl,
    withCacheBuster,
  });
})();
