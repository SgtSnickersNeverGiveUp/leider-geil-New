(function () {
  'use strict';

  const SHARED_UTILS = window.LG_SITE_UTILS;

  function escapeHtml(value) {
    return SHARED_UTILS.escapeHtml(value);
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
    return SHARED_UTILS.getGameVariant(game);
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
