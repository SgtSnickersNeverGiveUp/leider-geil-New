(function (global) {
  'use strict';

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function truncate(value, max) {
    const str = value == null ? '' : String(value);
    return str.length > max ? str.slice(0, max) + '\u2026' : str;
  }

  function formatDate(value) {
    if (!value) return '\u2013';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '\u2013';
    return date.toLocaleString('de-DE');
  }

  global.LG_HTML_UTILS = Object.freeze({
    escapeHtml,
    truncate,
    formatDate,
  });

  // Existing admin inline handlers expect these helpers as globals.
  global.escapeHtml = global.escapeHtml || escapeHtml;
  global.truncate = global.truncate || truncate;
  global.formatDate = global.formatDate || formatDate;
})(window);
