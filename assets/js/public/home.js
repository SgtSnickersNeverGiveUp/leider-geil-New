/* Index page behaviour only. */
(function (window, document) {
  'use strict';

  const { $, $$, onReady } = window.LGPublic;
  const config = window.SITE_CONFIG;
  const api = window.LG_API_ENDPOINTS || {};

  function initVideos() {
    const pubgFrame = $('#video-pubg');
    const arcFrame = $('#video-arc');
    if (pubgFrame) pubgFrame.src = config.videoPUBG;
    if (arcFrame) arcFrame.src = config.videoARC;
  }

  async function fetchDiscordStatus() {
    const el = $('#discord-count');
    if (!el) return;

    try {
      const res = await fetch(config.discordWidgetApi);
      if (!res.ok) throw new Error(`Discord API ${res.status}`);
      const data = await res.json();
      const online = data.presence_count ?? '-';
      el.textContent = `${online} Online`;
      const dot = $('#discord-dot');
      if (dot && online > 0) dot.classList.add('live-status__dot--online');
    } catch (err) {
      console.warn('[Discord]', err.message);
      el.textContent = 'Keine Verbindung';
    }
  }

  async function fetchTwitchStatus() {
    const el = $('#twitch-status');
    if (!el) return;

    try {
      const res = await fetch(config.twitchStatusApi || api.twitchStatus || '/api/twitch-status');
      if (!res.ok) throw new Error(`Twitch API ${res.status}`);
      const data = await res.json();
      const dot = $('#twitch-dot');

      if (data.live) {
        el.innerHTML = '<span class="twitch-live-label">● LIVE</span>&nbsp; ' + data.viewer_count + ' Zuschauer';
        if (dot) {
          dot.classList.add('live-status__dot--live');
          dot.classList.remove('live-status__dot--online');
        }
      } else {
        el.textContent = 'OFFLINE';
        if (dot) {
          dot.classList.remove('live-status__dot--live');
          dot.classList.remove('live-status__dot--online');
        }
        if (data.error) console.warn('[Twitch] API returned error:', data.errorType, data.error);
      }
    } catch (err) {
      console.warn('[Twitch]', err.message);
      el.textContent = 'OFFLINE';
    }
  }

  async function renderTimeline() {
    const wrap = $('#timeline');
    if (!wrap) return;

    try {
      let events;
      try {
        const res = await fetch(config.eventsApi || api.events || '/api/events');
        if (!res.ok) throw new Error('API unavailable');
        events = await res.json();
      } catch {
        const res = await fetch(config.eventsPath);
        if (!res.ok) throw new Error(`Events fetch ${res.status}`);
        events = await res.json();
      }

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

        const dotClass = game === 'PUBG' ? 'timeline__dot--pubg'
          : game === 'ARC Raiders' ? 'timeline__dot--arc'
            : '';

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
          ? e.image + (e.image.startsWith(api.eventImage || '/api/event-image')
            ? (e.image.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60000)
            : '')
          : '';
        const imgHtml = imgSrc
          ? `<img class="timeline__image" src="${imgSrc}" alt="${e.title || ''}" loading="lazy" onerror="this.style.display='none'">`
          : '';

        return `
        <div class="timeline__item" data-id="${e.id || ''}">
          <div class="timeline__dot ${dotClass}"></div>
          <div class="timeline__card">
            ${imgHtml}
            ${dateStr ? `<time class="timeline__date">${dateStr}</time>` : ''}
            <h3 class="timeline__title">${e.title || ''}</h3>
            <p class="timeline__desc">${e.description || ''}</p>
            <div class="timeline__meta">
              <span class="timeline__type ${typeClass}">${type}</span>
              <span class="timeline__game">${game}</span>
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

  async function renderHeaderBanner() {
    const section = $('#header-banner');
    const img = $('#header-banner-img');
    if (!section || !img) return;

    try {
      const res = await fetch(config.settingsApi || api.settings || '/api/settings');
      if (!res.ok) return;
      const settings = await res.json();

      if (settings.bannerUrl) {
        const bannerImageApi = api.bannerImage || '/api/banner-image';
        const imgUrl = settings.bannerUrl === bannerImageApi
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
    const grid = $('#video-gallery-grid');
    if (!grid) return;

    try {
      const res = await fetch(config.videosApi || api.videos || '/api/videos');
      if (!res.ok) throw new Error(`Videos fetch ${res.status}`);
      const videos = await res.json();

      if (videos.length === 0) {
        grid.innerHTML = '<p style="color:var(--clr-text-muted);text-align:center;font-family:var(--ff-mono);font-size:.9rem;">Noch keine Videos vorhanden.</p>';
        return;
      }

      grid.innerHTML = videos.map((v) => {
        const platform = (v.platform || 'youtube').toLowerCase();

        const targetUrl =
          platform === 'twitch'
            ? v.url
            : (v.url || `https://www.youtube.com/watch?v=${v.videoId}`);

        const thumb = v.thumbnail && v.thumbnail.trim()
          ? v.thumbnail
          : (platform === 'twitch'
            ? '/assets/img/twitch-placeholder.jpg'
            : '/assets/img/youtube-placeholder.jpg');

        const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';

        return `
        <a class="video-card" href="${targetUrl}" target="_blank" rel="noopener">
          <div class="video-card__thumb-wrap">
            <img class="video-card__thumb" src="${thumb}" alt="${v.title || ''}" loading="lazy">
            <div class="video-card__play">&#9654;</div>
            <span class="video-card__platform">${platformLabel}</span>
          </div>
          <h3 class="video-card__title">${v.title || ''}</h3>
        </a>
      `;
      }).join('');
    } catch (err) {
      console.error('[Videos]', err);
      grid.innerHTML = '';
    }
  }

  function startLiveUpdates() {
    setInterval(fetchDiscordStatus, config.discordRefreshInterval);
    setInterval(fetchTwitchStatus, config.twitchRefreshInterval);
  }

  onReady(() => {
    initVideos();
    renderTimeline();
    renderVideoGallery();
    renderHeaderBanner();
    fetchDiscordStatus();
    fetchTwitchStatus();
    startLiveUpdates();
  });
})(window, document);
