document.addEventListener('DOMContentLoaded', () => {
  const tickerItemsEl = document.querySelector('#clan-news-ticker .items');
  if (!tickerItemsEl) return;

  Promise.all([
    fetch('/api/settings').then((r) => r.json()),
    fetch('/.netlify/functions/news').then((r) => r.json())
  ])
    .then(([settings, items]) => {
      if (!Array.isArray(items) || items.length === 0) return;

      const texts = items
        .map((n) => n.text)
        .filter((t) => t && t.trim().length > 0);
      if (texts.length === 0) return;

      const speedSeconds = Number(settings.tickerSpeedSeconds) || 40;
      const separator = settings.tickerSeparator || '   ●   ';

      tickerItemsEl.innerHTML = texts.join(separator);
      tickerItemsEl.style.animationDuration = `${speedSeconds}s`;
    })
    .catch((err) => {
      console.error('[Clan News Ticker] Fehler beim Laden von Settings/News:', err);
    });
});
