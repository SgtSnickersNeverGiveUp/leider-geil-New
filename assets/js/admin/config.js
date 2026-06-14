/* =========================================================
   Admin configuration for "Leider Geil".
   This file belongs to the protected admin surface only.
   ========================================================= */

(function () {
  'use strict';

  const apiBase = '/api/admin';
  const mediaPreviewEndpoints = Object.freeze({
    eventImage: createMediaPreviewEndpoint(`${apiBase}/event-image`),
    bannerImage: createMediaPreviewEndpoint(`${apiBase}/banner-image`),
    rosterAvatar: createMediaPreviewEndpoint(`${apiBase}/roster-avatar`),
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

  window.LG_ADMIN_CONFIG = Object.freeze({
    apiBase,
    applicationsApi: `${apiBase}/applications`,
    eventsApi: `${apiBase}/events`,
    eventImageApi: `${apiBase}/event-image`,
    videosApi: `${apiBase}/videos`,
    eventRegistrationsApi: `${apiBase}/event-registrations`,
    newsApi: `${apiBase}/news`,
    homepageSettingsApi: `${apiBase}/public-settings`,
    bannerImageApi: `${apiBase}/banner-image`,
    communityShoutsApi: `${apiBase}/community-shouts`,
    sessionApi: `${apiBase}/session`,
    loginApi: `${apiBase}/login`,
    logoutApi: `${apiBase}/logout`,
    rosterApi: `${apiBase}/roster`,
    rosterAvatarApi: `${apiBase}/roster-avatar`,

    /* Read-only media URLs used only for protected admin previews. */
    eventImagePreviewApi: `${apiBase}/event-image`,
    bannerImagePreviewApi: `${apiBase}/banner-image`,
    rosterAvatarPreviewApi: `${apiBase}/roster-avatar`,

    mediaPreviewEndpoints,
    toAdminMediaPreviewUrl,
    isManagedPublicMediaUrl,
  });
})();
