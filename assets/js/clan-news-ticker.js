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

      // Separator nur als Abstand, Punkt kommt per CSS (span + span::before)
      const separator = settings.tickerSeparator || '   ';

      // Texte in einzelne <span>-Items umwandeln,
      // [PUBG] / [ARC] am Anfang erkennen und als farbigen Tag ausgeben
      const html = texts
        .map((raw) => {
          let text = String(raw).trim();
          let gameClass = '';
          let gameLabel = '';

          if (/^\[PUBG\]/i.test(text)) {
            gameClass = 'tag-pubg';
            gameLabel = 'PUBG';
            text = text.replace(/^\[PUBG\]\s*/i, '');
          } else if (/^\[ARC\]/i.test(text)) {
            gameClass = 'tag-arc';
            gameLabel = 'ARC Raiders';
            text = text.replace(/^\[ARC\]\s*/i, '');
          }

          // Aufbau:
          // <span>
          //   (optional) <span class="tag-pubg">PUBG</span>
          //   eigentlicher Text
          // </span>
          const tagPart = gameClass
            ? `<span class="${gameClass}">${gameLabel}</span>&nbsp;`
            : '';

          return `<span>${tagPart}${text}</span>`;
        })
        .join(separator);

      tickerItemsEl.innerHTML = html;
      tickerItemsEl.style.animationDuration = `${speedSeconds}s`;
    })
    .catch((err) => {
      console.error('[Clan News Ticker] Fehler beim Laden von Settings/News:', err);
    });
});
