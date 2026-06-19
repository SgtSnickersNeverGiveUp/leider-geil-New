(function () {
  'use strict';

  const CONTENT_URLS = window.LG_CONTENT_URLS;

  async function renderHeaderBanner() {
    const section = $('#header-banner');
    const img = $('#header-banner-img');
    if (!section || !img) return;

    try {
      const res = await fetch(SITE_CONFIG.settingsApi);
      if (!res.ok) return;
      const settings = await res.json();

      if (settings.bannerUrl) {
        const imgUrl = CONTENT_URLS.withCacheBuster(settings.bannerUrl, 'bannerImage');

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

  window.LG_INDEX_BANNER = Object.freeze({
    render: renderHeaderBanner,
  });
})();
