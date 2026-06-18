/* =========================================================
   Protected admin media preview bridge.
   Converts stored public media URLs back to admin preview URLs.
   ========================================================= */

(function () {
  'use strict';

  const ADMIN_CONFIG = window.LG_ADMIN_CONFIG || {};
  const apiBase = ADMIN_CONFIG.apiBase || '/api/admin';

  const mediaPreviewEndpoints = Object.freeze({
    eventImage: createMediaPreviewEndpoint(ADMIN_CONFIG.eventImagePreviewApi || `${apiBase}/event-image`),
    bannerImage: createMediaPreviewEndpoint(ADMIN_CONFIG.bannerImagePreviewApi || `${apiBase}/banner-image`),
    rosterAvatar: createMediaPreviewEndpoint(ADMIN_CONFIG.rosterAvatarPreviewApi || `${apiBase}/roster-avatar`),
  });

  function toPublicApiPath(adminApiPath) {
    const value = String(adminApiPath || '');
    const marker = '/admin/';
    const markerIndex = value.indexOf(marker);
    if (markerIndex === -1) return value;
    return `${value.slice(0, markerIndex)}/${value.slice(markerIndex + marker.length)}`;
  }

  function createMediaPreviewEndpoint(adminApiPath) {
    return Object.freeze({
      publicApi: toPublicApiPath(adminApiPath),
      previewApi: adminApiPath,
    });
  }

  function getSameOriginUrl(path) {
    if (!path || /^https?:\/\//i.test(path)) return path;
    return `${window.location.origin}${path}`;
  }

  function getPublicMediaSuffix(mediaUrl, mediaKey) {
    const endpoint = mediaPreviewEndpoints[mediaKey];
    const value = String(mediaUrl || '');
    if (!endpoint || !value) return null;

    const publicPrefixes = [
      endpoint.publicApi,
      getSameOriginUrl(endpoint.publicApi),
    ].filter(Boolean);

    for (const prefix of publicPrefixes) {
      if (value === prefix || value.startsWith(`${prefix}?`) || value.startsWith(`${prefix}/`)) {
        return value.slice(prefix.length);
      }
    }

    return null;
  }

  function toAdminMediaPreviewUrl(mediaUrl, mediaKey) {
    const endpoint = mediaPreviewEndpoints[mediaKey];
    const value = String(mediaUrl || '');
    const publicSuffix = getPublicMediaSuffix(value, mediaKey);

    if (!endpoint || publicSuffix === null) return value;
    return `${endpoint.previewApi}${publicSuffix}`;
  }

  function isManagedPublicMediaUrl(mediaUrl, mediaKey) {
    return getPublicMediaSuffix(mediaUrl, mediaKey) !== null;
  }

  window.LG_ADMIN_MEDIA_PREVIEW = Object.freeze({
    endpoints: mediaPreviewEndpoints,
    toAdminMediaPreviewUrl,
    isManagedPublicMediaUrl,
  });
})();
