/* =========================================================
   Protected admin media preview helpers.
   Admin APIs provide protected preview fields next to stored URLs.
   ========================================================= */

(function () {
  'use strict';

  function getPreviewUrl(resource, previewField, fallbackField) {
    if (!resource || typeof resource !== 'object') return '';
    return String(resource[previewField] || resource[fallbackField] || '');
  }

  window.LG_ADMIN_MEDIA_PREVIEW = Object.freeze({
    getPreviewUrl,
  });
})();
