(() => {
  'use strict';

  const config = window.SITE_CONFIG || {};

  document.addEventListener('DOMContentLoaded', () => {
    const tickerItemsEl = document.querySelector('#clan-news-ticker .clan-news-ticker__items');
    if (!tickerItemsEl) return;

    const settingsApi = config.settingsApi || '/api/settings';
    const newsApi = config.newsApi || '/api/news';

    Promise.all([
      fetch(settingsApi).then((res) => res.json()),
      fetch(newsApi).then((res) => res.json()),
    ])
      .then(([settings, items]) => {
        if (!Array.isArray(items) || items.length === 0) return;

        const texts = items
          .map((item) => item.text)
          .filter((text) => text && text.trim().length > 0);
        if (texts.length === 0) return;

        const speedSeconds = Number(settings.tickerSpeedSeconds) || 40;
        const separator = settings.tickerSeparator || '   ●   ';

        tickerItemsEl.textContent = texts.join(separator);
        tickerItemsEl.style.animationDuration = `${speedSeconds}s`;
        tickerItemsEl.closest('.clan-news-ticker')?.classList.add('clan-news-ticker--ready');
      })
      .catch((err) => {
        console.error('[Clan News Ticker] Fehler beim Laden von Settings/News:', err);
      });
  });
})();
