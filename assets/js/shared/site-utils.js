(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getGameVariant(game) {
    if (game === 'PUBG' || game === 'PUBG NEWS') return 'pubg';
    if (game === 'ARC Raiders' || game === 'ARC Raiders NEWS') return 'arc';
    if (game === 'NEWS') return 'news';
    return '';
  }

  window.LG_SITE_UTILS = Object.freeze({
    escapeHtml,
    getGameVariant,
  });
})();
