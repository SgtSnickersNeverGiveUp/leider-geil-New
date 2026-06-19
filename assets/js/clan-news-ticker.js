document.addEventListener('DOMContentLoaded', () => {
  const tickerItemsEl = document.querySelector('#clan-news-ticker .clan-news-ticker__items');
  if (!tickerItemsEl) return;

  const settingsApi = SITE_CONFIG.settingsApi;
  const newsApi = SITE_CONFIG.newsApi;

  Promise.all([
    fetch(settingsApi).then((r) => r.json()),
    fetch(newsApi).then((r) => r.json())
  ])
    .then(([settings, items]) => {
      if (!Array.isArray(items) || items.length === 0) return;

      const texts = items
        .map((n) => n.text)
        .filter((t) => t && t.trim().length > 0);
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
