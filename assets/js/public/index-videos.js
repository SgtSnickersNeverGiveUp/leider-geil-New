(function () {
  'use strict';

  function initHeroVideos() {
    const pubgFrame = $('#video-pubg');
    const arcFrame = $('#video-arc');
    if (pubgFrame) pubgFrame.src = SITE_CONFIG.videoPUBG;
    if (arcFrame) arcFrame.src = SITE_CONFIG.videoARC;
  }

  async function renderVideoGallery() {
    const grid = $('#video-gallery-grid');
    if (!grid) return;

    try {
      const res = await fetch(SITE_CONFIG.videosApi);
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

  window.LG_INDEX_VIDEOS = Object.freeze({
    initHero: initHeroVideos,
    renderGallery: renderVideoGallery,
  });
})();
