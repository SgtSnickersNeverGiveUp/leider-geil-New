'use strict';

(() => {
  const config = window.SITE_CONFIG || {};
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  document.addEventListener('DOMContentLoaded', initHomePage);

  function initHomePage() {
    initVideos();
    renderTimeline();
    renderVideoGallery();
    renderHeaderBanner();
    fetchDiscordStatus();
    fetchTwitchStatus();
    startLiveUpdates();
  }

  function initVideos() {
    const pubgFrame = $('#video-pubg');
    const arcFrame = $('#video-arc');
    if (pubgFrame) pubgFrame.src = config.videoPUBG || '';
    if (arcFrame) arcFrame.src = config.videoARC || '';
  }

  async function fetchDiscordStatus() {
    const el = $('#discord-count');
    if (!el || !config.discordWidgetApi) return;

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
      const res = await fetch(config.twitchStatusApi || '/api/twitch-status');
      if (!res.ok) throw new Error(`Twitch API ${res.status}`);
      const data = await res.json();
      const dot = $('#twitch-dot');

      if (data.live) {
        el.innerHTML = `<span class="twitch-live-label">&#9679; LIVE</span>&nbsp; ${data.viewer_count} Zuschauer`;
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
      const events = await loadEvents();

      if (!Array.isArray(events) || events.length === 0) {
        wrap.innerHTML = '<p style="color:var(--clr-text-muted);">Noch keine Events vorhanden.</p>';
        return;
      }

      events.sort((a, b) => {
        const da = a.date ? new Date(a.date) : 0;
        const db = b.date ? new Date(b.date) : 0;
        return db - da;
      });

      wrap.innerHTML = events.map(renderTimelineItem).join('');
      initTimelineLimit(wrap);
      observeTimeline();
    } catch (err) {
      console.error('[Timeline]', err);
      wrap.innerHTML = '<p style="color:var(--clr-danger);">Events konnten nicht geladen werden.</p>';
    }
  }

  async function loadEvents() {
    try {
      const res = await fetch(config.eventsApi || '/api/events');
      if (!res.ok) throw new Error('API unavailable');
      return await res.json();
    } catch {
      const res = await fetch(config.eventsPath || 'assets/data/events.json');
      if (!res.ok) throw new Error(`Events fetch ${res.status}`);
      return await res.json();
    }
  }

  function renderTimelineItem(event) {
    const game = event.game || 'Mixed';
    const type = event.type || 'event';
    const dotClass = game === 'PUBG'
      ? 'timeline__dot--pubg'
      : game === 'ARC Raiders'
        ? 'timeline__dot--arc'
        : '';
    const typeClass = type === 'match' ? 'timeline__type--match' : 'timeline__type--event';
    const dateStr = formatEventDate(event.date);
    const imgSrc = getCacheSafeImageUrl(event.image, '/api/event-image');
    const imgHtml = imgSrc
      ? `<img class="timeline__image" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(event.title || '')}" loading="lazy" onerror="this.style.display='none'">`
      : '';

    return `
      <div class="timeline__item" data-id="${escapeHtml(event.id || '')}">
        <div class="timeline__dot ${dotClass}"></div>
        <div class="timeline__card">
          ${imgHtml}
          ${dateStr ? `<time class="timeline__date">${dateStr}</time>` : ''}
          <h3 class="timeline__title">${escapeHtml(event.title || '')}</h3>
          <p class="timeline__desc">${escapeHtml(event.description || '')}</p>
          <div class="timeline__meta">
            <span class="timeline__type ${typeClass}">${escapeHtml(type)}</span>
            <span class="timeline__game">${escapeHtml(game)}</span>
          </div>
        </div>
      </div>`;
  }

  function initTimelineLimit(wrap) {
    const items = Array.from(wrap.querySelectorAll('.timeline__item'));
    const moreBtn = document.getElementById('events-more-btn');
    if (!moreBtn) return;

    if (items.length <= 2) {
      moreBtn.style.display = 'none';
      return;
    }

    let expanded = false;
    const updateView = () => {
      items.forEach((item, index) => {
        item.classList.toggle('timeline__item--hidden', !expanded && index >= 2);
      });
      moreBtn.textContent = expanded ? 'Weniger Events anzeigen' : 'Mehr Events anzeigen';
    };

    updateView();
    moreBtn.style.display = '';
    moreBtn.onclick = () => {
      expanded = !expanded;
      updateView();
    };
  }

  function observeTimeline() {
    const items = $$('.timeline__item');
    if (items.length === 0 || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    items.forEach((item) => observer.observe(item));
  }

  async function renderHeaderBanner() {
    const section = $('#header-banner');
    const img = $('#header-banner-img');
    if (!section || !img) return;

    try {
      const res = await fetch(config.settingsApi || '/api/settings');
      if (!res.ok) return;
      const settings = await res.json();

      if (settings.bannerUrl) {
        img.src = getCacheSafeImageUrl(settings.bannerUrl, '/api/banner-image');
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
      const res = await fetch(config.videosApi || '/api/videos');
      if (!res.ok) throw new Error(`Videos fetch ${res.status}`);
      const videos = await res.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        grid.innerHTML = '<p style="color:var(--clr-text-muted);text-align:center;font-family:var(--ff-mono);font-size:.9rem;">Noch keine Videos vorhanden.</p>';
        return;
      }

      grid.innerHTML = videos.map(renderVideoCard).join('');
    } catch (err) {
      console.error('[Videos]', err);
      grid.innerHTML = '';
    }
  }

  function renderVideoCard(video) {
    const platform = (video.platform || 'youtube').toLowerCase();
    const targetUrl = platform === 'twitch'
      ? video.url
      : (video.url || `https://www.youtube.com/watch?v=${video.videoId || ''}`);
    const thumb = video.thumbnail && video.thumbnail.trim()
      ? video.thumbnail
      : (platform === 'twitch'
        ? '/assets/img/twitch-placeholder.jpg'
        : '/assets/img/youtube-placeholder.jpg');
    const platformLabel = platform === 'twitch' ? 'Twitch' : 'YouTube';

    return `
      <a class="video-card" href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener">
        <div class="video-card__thumb-wrap">
          <img class="video-card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(video.title || '')}" loading="lazy">
          <div class="video-card__play">&#9654;</div>
          <span class="video-card__platform">${platformLabel}</span>
        </div>
        <h3 class="video-card__title">${escapeHtml(video.title || '')}</h3>
      </a>`;
  }

  function startLiveUpdates() {
    if ($('#discord-count')) {
      setInterval(fetchDiscordStatus, Number(config.discordRefreshInterval) || 60000);
    }
    if ($('#twitch-status')) {
      setInterval(fetchTwitchStatus, Number(config.twitchRefreshInterval) || 60000);
    }
  }

  function getCacheSafeImageUrl(url, apiPath) {
    if (!url) return '';
    if (url.startsWith(apiPath)) {
      return url + (url.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60000);
    }
    return url;
  }

  function formatEventDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
