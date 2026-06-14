/* Public homepage data and widgets. */
'use strict';

(function () {
const VISITOR_COUNTER_STORAGE_KEY = 'lg-homepage-visitor-counted';

const select = (selector, context = document) => context.querySelector(selector);
const selectAll = (selector, context = document) => [...context.querySelectorAll(selector)];

async function renderTimeline() {
  const wrap = select('#timeline');
  if (!wrap) return;

  try {
    const res = await fetch(SITE_CONFIG.eventsApi || '/api/events');
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

    wrap.innerHTML = events.map((event) => {
      const game = event.game || 'Mixed';
      const type = event.type || 'event';
      const gameVariant = event.gameVariant || '';

      const itemClass = gameVariant ? `timeline__item--${gameVariant}` : '';
      const dotClass = gameVariant ? `timeline__dot--${gameVariant}` : '';
      const gameClass = gameVariant ? `timeline__game--${gameVariant}` : '';
      const typeClass = type === 'match' ? 'timeline__type--match' : 'timeline__type--event';

      let dateStr = '';
      if (event.date) {
        const date = new Date(event.date);
        if (!Number.isNaN(date.getTime())) {
          dateStr = date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }

      const imgSrc = event.image
        ? event.image + (event.image.startsWith('/api/event-image')
            ? (event.image.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60000)
            : '')
        : '';
      const imgHtml = imgSrc
        ? `<img class="timeline__image" src="${imgSrc}" alt="${event.title || ''}" loading="lazy" onerror="this.style.display='none'">`
        : '';

      return `
        <div class="timeline__item ${itemClass}" data-id="${event.id || ''}">
          <div class="timeline__dot ${dotClass}"></div>
          <div class="timeline__card">
            ${imgHtml}
            ${dateStr ? `<time class="timeline__date">${dateStr}</time>` : ''}
            <h3 class="timeline__title">${event.title || ''}</h3>
            <p class="timeline__desc">${event.description || ''}</p>
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
  const items = selectAll('.timeline__item');
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

async function renderHeaderBanner() {
  const section = select('#header-banner');
  const img = select('#header-banner-img');
  if (!section || !img) return;

  try {
    const res = await fetch(SITE_CONFIG.settingsApi || '/api/public-settings');
    if (!res.ok) return;
    const settings = await res.json();

    if (settings.bannerUrl) {
      const imgUrl = settings.bannerUrl === '/api/banner-image'
        ? settings.bannerUrl + '?t=' + Math.floor(Date.now() / 60000)
        : settings.bannerUrl;

      img.src = imgUrl;
      img.onload = () => { section.style.display = ''; };
      img.onerror = () => { section.style.display = 'none'; };
    } else {
      section.style.display = 'none';
    }
  } catch (err) {
    console.warn('[Banner]', err.message);
  }
}

async function renderVideoGallery() {
  const grid = select('#video-gallery-grid');
  if (!grid) return;

  try {
    const res = await fetch(SITE_CONFIG.videosApi || '/api/videos');
    if (!res.ok) throw new Error(`Videos fetch ${res.status}`);
    const videos = await res.json();

    if (videos.length === 0) {
      grid.innerHTML = '<p style="color:var(--clr-text-muted);text-align:center;font-family:var(--ff-mono);font-size:.9rem;">Noch keine Videos vorhanden.</p>';
      return;
    }

    grid.innerHTML = videos.map((video) => {
      const platform = (video.platform || 'youtube').toLowerCase();
      const targetUrl = platform === 'twitch'
        ? video.url
        : (video.url || `https://www.youtube.com/watch?v=${video.videoId}`);
      const thumb = video.thumbnail && video.thumbnail.trim()
        ? video.thumbnail
        : (platform === 'twitch'
            ? '/assets/img/twitch-placeholder.svg'
            : '/assets/img/youtube-placeholder.jpg');
      const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';

      return `
        <a class="video-card" href="${targetUrl}" target="_blank" rel="noopener">
          <div class="video-card__thumb-wrap">
            <img class="video-card__thumb" src="${thumb}" alt="${video.title || ''}" loading="lazy">
            <div class="video-card__play">&#9654;</div>
            <span class="video-card__platform">${platformLabel}</span>
          </div>
          <h3 class="video-card__title">${video.title || ''}</h3>
        </a>
      `;
    }).join('');
  } catch (err) {
    console.error('[Videos]', err);
    grid.innerHTML = '';
  }
}

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
  const counter = select('#visitor-counter');
  const countEl = select('#visitor-counter-count');
  if (!counter || !countEl) return;

  const alreadyCounted = hasCountedHomepageVisitor();

  try {
    const res = await fetch(SITE_CONFIG.visitorCounterApi || '/api/visitor-count', {
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

document.addEventListener('DOMContentLoaded', () => {
  renderTimeline();
  renderVideoGallery();
  renderHeaderBanner();
  renderVisitorCounter();
});
})();
