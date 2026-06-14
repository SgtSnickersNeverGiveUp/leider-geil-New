'use strict';

(function () {
const HOMEPAGE_CONTENT_PAGE_ID = 'page-homepage-content';

function loadEditor(namespace, label) {
  const editor = window[namespace];
  if (editor?.load) return editor.load();
  console.error(`[Admin Homepage Content] ${label}-Modul ist nicht geladen.`);
  return Promise.resolve();
}

async function load() {
  await Promise.all([
    loadEditor('LGAdminHomepageRosterSlideshow', 'Roster-Diashow'),
    loadEditor('LGAdminHomepageNewsTicker', 'News-Ticker'),
    loadEditor('LGAdminHomepageBanner', 'Banner'),
  ]);
}

function registerPageLoader() {
  const registration = {
    pageId: HOMEPAGE_CONTENT_PAGE_ID,
    load,
  };

  window.LG_ADMIN_PAGE_LOADERS = window.LG_ADMIN_PAGE_LOADERS || [];
  if (Array.isArray(window.LG_ADMIN_PAGE_LOADERS)) {
    window.LG_ADMIN_PAGE_LOADERS.push(registration);
    return;
  }

  window.LG_ADMIN_PAGE_LOADERS.register?.(registration);
}

registerPageLoader();

window.LGAdminHomepageContent = Object.freeze({
  load,
});
})();
