(function () {
  'use strict';

  const VISITOR_COUNTER_STORAGE_KEY = 'lg-homepage-visitor-counted';

  function hasCountedHomepageVisitor() {
    try {
      return localStorage.getItem(VISITOR_COUNTER_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function markHomepageVisitorCounted() {
    try {
      localStorage.setItem(VISITOR_COUNTER_STORAGE_KEY, '1');
    } catch {
      // Counting still works if browser storage is unavailable.
    }
  }

  function formatVisitorCount(value) {
    const count = Number(value);
    if (!Number.isFinite(count)) return '0';
    return new Intl.NumberFormat('de-DE').format(Math.max(0, Math.floor(count)));
  }

  async function renderVisitorCounter() {
    const counter = $('#visitor-counter');
    const countEl = $('#visitor-counter-count');
    if (!counter || !countEl) return;

    const alreadyCounted = hasCountedHomepageVisitor();

    try {
      const res = await fetch(SITE_CONFIG.visitorCounterApi, {
        method: alreadyCounted ? 'GET' : 'POST',
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(`Visitor counter ${res.status}`);

      const data = await res.json();
      countEl.textContent = formatVisitorCount(data.count);
      counter.classList.add('visitor-counter--ready');
      counter.classList.remove('visitor-counter--error');

      if (!alreadyCounted) {
        markHomepageVisitorCounted();
      }
    } catch (err) {
      console.warn('[VisitorCounter]', err.message);
      countEl.textContent = '--';
      counter.classList.add('visitor-counter--error');
    }
  }

  window.LG_INDEX_VISITOR_COUNTER = Object.freeze({
    render: renderVisitorCounter,
  });
})();
