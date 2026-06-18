'use strict';

(function () {
const HOMEPAGE_CONTENT_PAGE_ID = 'page-homepage-content';
const HOMEPAGE_CONTENT_ROOT_SELECTOR = '[data-admin-homepage-content-root]';

function renderHomepageContentPage() {
  const page = document.getElementById(HOMEPAGE_CONTENT_PAGE_ID);
  if (!page || page.querySelector(HOMEPAGE_CONTENT_ROOT_SELECTOR)) return;

  page.innerHTML = `
      <div data-admin-homepage-content-root>
        <section class="panel">
          <div class="panel__header">
            <h2 class="panel__title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5h16M4 19h16M4 9h16M4 15h16"/></svg>
              Startseiten-Roster-Diashow
            </h2>
            <div class="panel__actions">
              <button class="btn-sm" id="admin-homepage-refresh-roster-slideshow">Aktualisieren</button>
            </div>
          </div>
          <div class="panel__body">
            <form class="admin-form admin-form--wide admin-homepage-roster-slideshow" id="admin-homepage-roster-slideshow-form">
              <div class="admin-form__section">// Anzeige</div>
              <div class="admin-homepage-roster-slideshow__grid">
                <label class="admin-form__check">
                  <input type="checkbox" id="admin-homepage-roster-slideshow-enabled">
                  <span>Diashow auf der Startseite anzeigen</span>
                </label>
                <label class="admin-form__check">
                  <input type="checkbox" id="admin-homepage-roster-slideshow-autoplay">
                  <span>Automatisch rotieren</span>
                </label>
                <div class="admin-form__group">
                  <label class="admin-form__label" for="admin-homepage-roster-slideshow-speed">Geschwindigkeit in Sekunden</label>
                  <input class="admin-form__input" type="number" id="admin-homepage-roster-slideshow-speed" min="3" max="60" step="1" value="8">
                </div>
                <div class="admin-form__group">
                  <label class="admin-form__label" for="admin-homepage-roster-slideshow-pinned-member">Fix angezeigter Member</label>
                  <select class="admin-form__select" id="admin-homepage-roster-slideshow-pinned-member">
                    <option value="">Automatisch / erster ausgewählter Member</option>
                  </select>
                  <div class="admin-form__hint">Wenn automatische Rotation aus ist, bleibt dieser Member dauerhaft sichtbar.</div>
                </div>
              </div>

              <div class="admin-form__section">// Member auswählen</div>
              <div class="admin-homepage-roster-slideshow__add">
                <select class="admin-form__select" id="admin-homepage-roster-slideshow-add-member">
                  <option value="">Member auswählen</option>
                </select>
                <button type="button" class="btn-sm btn-sm--accent" id="admin-homepage-roster-slideshow-add">Zur Diashow hinzufügen</button>
              </div>
              <div id="admin-homepage-roster-slideshow-selected" class="admin-homepage-roster-slideshow__list">
                <div class="empty-state">
                  <div class="empty-state__text">Noch keine Diashow-Member ausgewählt.</div>
                </div>
              </div>
              <div class="admin-form__hint">Pro Member kannst du einen eigenen Text für Geburtstag, neuen Member oder Spotlight eintragen.</div>
              <button type="submit" class="admin-form__submit" id="admin-homepage-roster-slideshow-save">Diashow speichern</button>
              <div class="admin-form__hint" id="admin-homepage-roster-slideshow-status"></div>
            </form>
          </div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <h2 class="panel__title">Clan News Ticker</h2>
            <div class="panel__actions">
              <button class="btn-sm" id="admin-homepage-news-refresh">Aktualisieren</button>
              <button class="btn-sm btn-sm--accent" id="admin-homepage-news-add">Eintrag</button>
            </div>
          </div>

          <div class="panel__body">
            <div class="admin-form__section">Ticker-Einstellungen</div>

            <div class="admin-form__group">
              <label class="admin-form__label" for="admin-homepage-news-ticker-speed">
                Ticker-Geschwindigkeit (Sekunden für eine Runde)
              </label>
              <input class="admin-form__input" type="number" id="admin-homepage-news-ticker-speed" min="5" max="120" step="5">
              <div class="admin-form__hint">
                Größere Zahl = langsamer, kleinere Zahl = schneller.
              </div>
            </div>

            <div class="admin-form__group">
              <label class="admin-form__label" for="admin-homepage-news-ticker-separator">
                Trenner zwischen Nachrichten
              </label>
              <input class="admin-form__input" type="text" id="admin-homepage-news-ticker-separator" placeholder="   ●   ">
              <div class="admin-form__hint">
                Wird zwischen die Texte gesetzt, z.B. • oder |.
              </div>
            </div>

            <div class="admin-form__section" style="margin-top:1.5rem;">Ticker-Einträge</div>

            <div id="admin-homepage-news-status" class="admin-form__hint">Noch nicht geladen.</div>
            <div id="admin-homepage-news-list" class="admin-form" style="margin-top:1rem"></div>

            <button type="button" class="admin-form__submit" id="admin-homepage-news-save">
              News & Ticker speichern
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <h2 class="panel__title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Startseiten-Header-Banner
            </h2>
          </div>
          <div class="panel__body">
            <p style="font-family:var(--ff-mono);font-size:.8rem;color:var(--clr-text-muted);margin-bottom:1.5rem;">
              Empfohlene Aufl&ouml;sung: <strong style="color:var(--clr-accent-arc);">1920 &times; 600 px</strong>. Das Bild wird als Header-Banner auf der Startseite angezeigt.
            </p>

            <form class="admin-form" id="admin-homepage-banner-form" style="max-width:600px;">
              <div style="display:flex;gap:.5rem;margin-bottom:1rem;">
                <button type="button" class="btn-sm btn-sm--accent admin-homepage-banner-tab-btn active" data-tab="url">Bild-URL</button>
                <button type="button" class="btn-sm admin-homepage-banner-tab-btn" data-tab="upload">Datei hochladen</button>
              </div>

              <div class="admin-form__group admin-homepage-banner-tab" id="admin-homepage-banner-tab-url">
                <label class="admin-form__label" for="admin-homepage-banner-url">Bild-URL</label>
                <input class="admin-form__input" type="url" id="admin-homepage-banner-url" placeholder="https://beispiel.de/banner.jpg">
              </div>

              <div class="admin-form__group admin-homepage-banner-tab" id="admin-homepage-banner-tab-upload" style="display:none;">
                <label class="admin-form__label" for="admin-homepage-banner-file">Bild-Datei</label>
                <input class="admin-form__input" type="file" id="admin-homepage-banner-file" accept="image/*" style="padding:.4rem;">
                <div id="admin-homepage-banner-upload-status" style="font-family:var(--ff-mono);font-size:.75rem;color:var(--clr-text-muted);margin-top:.25rem;"></div>
              </div>

              <button type="submit" class="admin-form__submit" id="admin-homepage-banner-submit">Banner speichern</button>
              <button type="button" class="btn-sm btn-sm--danger" id="admin-homepage-banner-remove" style="margin-top:.5rem;">Banner entfernen</button>
            </form>
          </div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <h2 class="panel__title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Banner-Vorschau
            </h2>
            <div class="panel__actions">
              <button class="btn-sm" id="admin-homepage-banner-refresh">Aktualisieren</button>
            </div>
          </div>
          <div class="panel__body" id="admin-homepage-banner-preview-body">
            <div class="loading">Lade Banner</div>
          </div>
        </section>
      </div>`;
}

function loadEditor(namespace, label) {
  const editor = window[namespace];
  if (editor?.load) return editor.load();
  console.error(`[Admin Homepage Content] ${label}-Modul ist nicht geladen.`);
  return Promise.resolve();
}

async function load() {
  renderHomepageContentPage();
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
