(function () {
  'use strict';

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value || '');
    return div.innerHTML;
  }

  function truncate(value, max) {
    const str = String(value || '');
    return str.length > max ? `${str.slice(0, max)}...` : str;
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('de-DE');
  }

  function getEventGameVariant(game) {
    if (game === 'PUBG' || game === 'PUBG NEWS') return 'pubg';
    if (game === 'ARC Raiders' || game === 'ARC Raiders NEWS') return 'arc';
    if (game === 'NEWS') return 'news';
    return '';
  }

  window.escapeHtml = escapeHtml;
  window.truncate = truncate;
  window.formatDate = formatDate;
  window.getEventGameVariant = getEventGameVariant;
  window.ADMIN_UTILS = Object.freeze({
    escapeHtml,
    truncate,
    formatDate,
    getEventGameVariant,
  });
})();
