document.addEventListener('DOMContentLoaded', () => {
  const tickerItemsEl = document.querySelector('#clan-news-ticker .items');
  if (!tickerItemsEl) return;

  // wichtig: RELATIVER Pfad, kein führender Slash
  fetch('assets/data/news.json')
    .then((res) => res.json())
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) return;

      const texts = items
        .map((n) => n.text)
        .filter((t) => t && t.trim().length > 0);

      if (texts.length === 0) return;

      // HTML erlauben (für <br> im Event-Text)
      tickerItemsEl.innerHTML = texts.join('  -   ');
      console.log('[Clan News Ticker] Geladene Einträge:', texts);
    })
    .catch((err) => {
      console.error('[Clan News Ticker] Fehler beim Laden der News:', err);
    });
});
