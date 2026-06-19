'use strict';

(function () {
  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getEventGameVariant(game) {
    if (game === 'PUBG' || game === 'PUBG NEWS') return 'pubg';
    if (game === 'ARC Raiders' || game === 'ARC Raiders NEWS') return 'arc';
    if (game === 'NEWS') return 'news';
    return '';
  }

  function addMinuteCacheBust(url, baseUrl) {
    if (!url || !baseUrl || !url.startsWith(baseUrl)) return url || '';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`;
  }

  window.LG_SHARED_UTILS = Object.freeze({
    escapeHtml,
    getEventGameVariant,
    addMinuteCacheBust,
  });
})();
