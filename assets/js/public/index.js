'use strict';

document.addEventListener('DOMContentLoaded', () => {
  window.LG_INDEX_VIDEOS?.initHero();
  window.LG_INDEX_TIMELINE?.render();
  window.LG_INDEX_VIDEOS?.renderGallery();
  window.LG_INDEX_BANNER?.render();
  window.LG_INDEX_VISITOR_COUNTER?.render();
  window.LG_INDEX_LIVE_STATUS?.init();
});
