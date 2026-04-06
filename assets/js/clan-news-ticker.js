document.addEventListener('DOMContentLoaded', () => {
  const tickerItemsEl = document.querySelector('#clan-news-ticker .items');
  if (!tickerItemsEl) return;

  // Relativer Pfad, damit es auf GitHub Pages UND Netlify funktioniert
  fetch('assets/data/news.json')
    .then((res) => res.json())
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) return;

      const texts = items
        .map((n) => n.text)
        .filter((t) => t && t.trim().length > 0);

      if (texts.length === 0) return;

      // HTML erlauben (für <br>) statt nur textContent
      tickerItemsEl.innerHTML = texts.join('  -   ');
      console.log('[Clan News Ticker] Geladene Einträge:', texts);
    })
    .catch((err) => {
      console.error('[Clan News Ticker] Fehler beim Laden der News:', err);
    });
});
