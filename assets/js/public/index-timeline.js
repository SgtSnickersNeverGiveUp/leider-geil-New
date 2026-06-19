(function () {
  'use strict';

  const CONTENT_URLS = window.LG_CONTENT_URLS;
  const SITE_UTILS = window.LG_SITE_UTILS;

  async function renderTimeline() {
    const wrap = $('#timeline');
    if (!wrap) return;

    try {
      const res = await fetch(SITE_CONFIG.eventsApi);
      if (!res.ok) throw new Error(`Events fetch ${res.status}`);
      const events = await res.json();

      if (!Array.isArray(events) || events.length === 0) {
        wrap.innerHTML = '<p style="color:var(--clr-text-muted);">Noch keine Events vorhanden.</p>';
        return;
      }

      events.sort((a, b) => {
        const da = a.date ? new Date(a.date) : 0;
        const db = b.date ? new Date(b.date) : 0;
        return db - da;
      });

      wrap.innerHTML = events.map((e) => {
        const game = e.game || 'Mixed';
        const type = e.type || 'event';
        const gameVariant = SITE_UTILS.getGameVariant(game);

        const itemClass = gameVariant ? `timeline__item--${gameVariant}` : '';
        const dotClass = gameVariant ? `timeline__dot--${gameVariant}` : '';
        const gameClass = gameVariant ? `timeline__game--${gameVariant}` : '';
        const typeClass = type === 'match' ? 'timeline__type--match' : 'timeline__type--event';

        let dateStr = '';
        if (e.date) {
          const d = new Date(e.date);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        }

        const imgSrc = e.image
          ? CONTENT_URLS.withCacheBuster(e.image, 'eventImage')
          : '';
        const imgHtml = imgSrc
          ? `<img class="timeline__image" src="${imgSrc}" alt="${e.title || ''}" loading="lazy" onerror="this.style.display='none'">`
          : '';

        return `
          <div class="timeline__item ${itemClass}" data-id="${e.id || ''}">
            <div class="timeline__dot ${dotClass}"></div>
            <div class="timeline__card">
              ${imgHtml}
              ${dateStr ? `<time class="timeline__date">${dateStr}</time>` : ''}
              <h3 class="timeline__title">${e.title || ''}</h3>
              <p class="timeline__desc">${e.description || ''}</p>
              <div class="timeline__meta">
                <span class="timeline__type ${typeClass}">${type}</span>
                <span class="timeline__game ${gameClass}">${game}</span>
              </div>
            </div>
          </div>`;
      }).join('');

      const items = Array.from(wrap.querySelectorAll('.timeline__item'));
      const moreBtn = document.getElementById('events-more-btn');

      if (items.length > 2 && moreBtn) {
        let expanded = false;

        const updateView = () => {
          items.forEach((item, index) => {
            if (!expanded && index >= 2) {
              item.classList.add('timeline__item--hidden');
            } else {
              item.classList.remove('timeline__item--hidden');
            }
          });
          moreBtn.textContent = expanded
            ? 'Weniger Events anzeigen'
            : 'Mehr Events anzeigen';
        };

        updateView();
        moreBtn.style.display = '';

        moreBtn.onclick = () => {
          expanded = !expanded;
          updateView();
        };
      } else if (moreBtn) {
        moreBtn.style.display = 'none';
      }

      observeTimeline();
    } catch (err) {
      console.error('[Timeline]', err);
      wrap.innerHTML = '<p style="color:var(--clr-danger);">Events konnten nicht geladen werden.</p>';
    }
  }

  function observeTimeline() {
    const items = $$('.timeline__item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((item) => observer.observe(item));
  }

  window.LG_INDEX_TIMELINE = Object.freeze({
    render: renderTimeline,
  });
})();
