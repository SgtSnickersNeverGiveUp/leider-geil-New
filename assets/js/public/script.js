/* ── Public site interactions ───────────────────────────────────────── */
'use strict';

/* ── Helper: DOM‑Abfrage ───────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const SHARED = window.LGShared;
const PUBLIC_API = SHARED?.API_PATHS || {};
const escapeHtml = SHARED?.escapeHtml || ((value) => String(value ?? ''));
const appendMinuteCacheBust = SHARED?.appendMinuteCacheBust || ((url) => String(url || ''));

/* ── 1. Video‑Quellen setzen ───────────────────────────────────────── */
function initVideos() {
  const pubgFrame = $('#video-pubg');
  const arcFrame  = $('#video-arc');
  if (pubgFrame) pubgFrame.src = SITE_CONFIG.videoPUBG;
  if (arcFrame)  arcFrame.src = SITE_CONFIG.videoARC;
}

/* ── 2. Discord API – Member Count (öffentliches Widget) ────────────── */
async function fetchDiscordStatus() {
  const el = $('#discord-count');
  if (!el) return;

  try {
    const res = await fetch(SITE_CONFIG.discordWidgetApi);
    if (!res.ok) throw new Error(`Discord API ${res.status}`);
    const data = await res.json();
    const online = data.presence_count ?? '–';
    el.textContent = `${online} Online`;
    const dot = $('#discord-dot');
    if (dot && online > 0) dot.classList.add('live-status__dot--online');
  } catch (err) {
    console.warn('[Discord]', err.message);
    el.textContent = 'Keine Verbindung';
  }
}

/* ── 3. Twitch API – Live‑Status (via Netlify Function) ─────────────── */
async function fetchTwitchStatus() {
  const el = $('#twitch-status');
  if (!el) return;

  try {
    const res = await fetch(SITE_CONFIG.twitchStatusApi || PUBLIC_API.twitchStatus || '/api/twitch-status');
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

/* ── 4. Event Timeline Rendering + IntersectionObserver ─────────────── */
async function renderTimeline() {
  const wrap = $('#timeline');
  if (!wrap) return;

  try {
    let events;
    try {
      const res = await fetch(SITE_CONFIG.eventsApi || '/api/events');
      if (!res.ok) throw new Error('API unavailable');
      events = await res.json();
    } catch {
      const res = await fetch(SITE_CONFIG.eventsPath);
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

    wrap.innerHTML = events.map(e => {
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
        ? appendMinuteCacheBust(e.image, {
            prefixes: [SITE_CONFIG.eventImageApi || PUBLIC_API.eventImage || '/api/event-image'],
          })
        : '';
      const imgHtml = imgSrc
        ? `<img class="timeline__image" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(e.title || '')}" loading="lazy" onerror="this.style.display='none'">`
        : '';

      return `
        <div class="timeline__item" data-id="${escapeHtml(e.id || '')}">
          <div class="timeline__dot ${dotClass}"></div>
          <div class="timeline__card">
            ${imgHtml}
            ${dateStr ? `<time class="timeline__date">${dateStr}</time>` : ''}
            <h3 class="timeline__title">${escapeHtml(e.title || '')}</h3>
            <p class="timeline__desc">${escapeHtml(e.description || '')}</p>
            <div class="timeline__meta">
              <span class="timeline__type ${typeClass}">${escapeHtml(type)}</span>
              <span class="timeline__game">${escapeHtml(game)}</span>
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

/* ── 5. Header Banner ─────────────────────────────────────────────────── */
async function renderHeaderBanner() {
  const section = $('#header-banner');
  const img     = $('#header-banner-img');
  if (!section || !img) return;

  try {
    const res = await fetch(SITE_CONFIG.settingsApi || '/api/settings');
    if (!res.ok) return;
    const settings = await res.json();

    if (settings.bannerUrl) {
      const imgUrl = appendMinuteCacheBust(settings.bannerUrl, {
        exact: [SITE_CONFIG.bannerImageApi || PUBLIC_API.bannerImage || '/api/banner-image'],
      });

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

/* ── 6. Video Gallery Rendering ─────────────────────────────────────── */
async function renderVideoGallery() {
  const grid = $('#video-gallery-grid');
  if (!grid) return;

  try {
    const res = await fetch(SITE_CONFIG.videosApi || '/api/videos');
    if (!res.ok) throw new Error(`Videos fetch ${res.status}`);
    const videos = await res.json();

    if (videos.length === 0) {
      grid.innerHTML = '<p style="color:var(--clr-text-muted);text-align:center;font-family:var(--ff-mono);font-size:.9rem;">Noch keine Videos vorhanden.</p>';
      return;
    }

        grid.innerHTML = videos.map(v => {
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
        <a class="video-card" href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener">
          <div class="video-card__thumb-wrap">
            <img class="video-card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(v.title || '')}" loading="lazy">
            <div class="video-card__play">&#9654;</div>
            <span class="video-card__platform">${platformLabel}</span>
          </div>
          <h3 class="video-card__title">${escapeHtml(v.title || '')}</h3>
        </a>
      `;
    }).join('');
  } catch (err) {
    console.error('[Videos]', err);
    grid.innerHTML = '';
  }
}

/* ── 7. Mikro‑Interaktionen ───────────────────────────────────────────── */
function initRipple() {
  $$('.btn').forEach((btn) => {
    if (btn.type === 'submit') return;
    btn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      circle.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  });
}

/* ── 8. Navbar Mobile Toggle ───────────────────────────────────────── */
function initNavbar() {
  const toggle = $('#nav-toggle');
  const links  = $('#nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    const isOpen = links.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  $$('a', links).forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ── 9. Live‑Update Intervalle ─────────────────────────────────────── */
function startLiveUpdates() {
  setInterval(fetchDiscordStatus, SITE_CONFIG.discordRefreshInterval);
  setInterval(fetchTwitchStatus, SITE_CONFIG.twitchRefreshInterval);
}

/* ── 10. Smooth scroll for anchor links ─────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── 11. Event‑Anmeldung Formular ───────────────────────────────────── */
function initEventForm() {
  const form = $('#event-form');
  if (!form) return;
  // … (originaler Code von initEventForm)
}

/* ── 12. Initialisierung – Alles starten wenn DOM bereit ──────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initVideos();
  initNavbar();
  initSmoothScroll();
  initRipple();
  initEventForm();

  /* NEU: Bewerbungs‑ und Event‑Form → Discord */
  initRecruitFormDiscord();
  initEventSignupDiscord();

  /* Daten laden */
  renderTimeline();
  renderVideoGallery();
  renderHeaderBanner();

  /* Live‑Status: sofort + Intervall */
  fetchDiscordStatus();
  fetchTwitchStatus();
  startLiveUpdates();
});

/* ── 13. Bewerbungen über Discord (Netlify Form + Webhook) ────────────── */
function initRecruitFormDiscord() {
  const recruitForm = document.getElementById("recruit-form");
  if (!recruitForm) return;

  recruitForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(recruitForm);
    const honey = formData.get("website");
    if (honey) return; // Bot

    const gamingId = formData.get("gaming-id");
    const alter     = formData.get("alter");
    const spiel     = formData.get("spiel");
    const rolle     = formData.get("rolle");
    const about     = formData.get("ueber-mich");

    /* Netlify‑Form normal abschicken */
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    /* Discord‑Webhook für Bewerbungen */
    if (typeof DISCORD_WEBHOOK_BEWERBUNG === "string" && DISCORD_WEBHOOK_BEWERBUNG) {
      try {
        await fetch(DISCORD_WEBHOOK_BEWERBUNG, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content:
              "**Neue Clan‑Bewerbung**\n" +
              `Gaming‑ID: ${gamingId}\n` +
              `Alter: ${alter}\n` +
              `Spiel: ${spiel}\n` +
              `Rolle: ${rolle}\n` +
              `Über mich: ${about}`,
          }),
        });
      } catch (err) {
        console.error("Discord Webhook (Bewerbung) Fehler:", err);
      }
    }

    recruitForm.reset();
    alert("Bewerbung gesendet – vielen Dank!");
  });
}

/* ── 14. Event‑Anmeldungen über Discord (Netlify Form + Webhook) ──────── */
function initEventSignupDiscord() {
  const eventForm = document.getElementById("event-form");
  if (!eventForm) return;

  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(eventForm);

    const name        = formData.get("name-gaming-id");
    const email       = formData.get("email");
    const spiel       = formData.get("spiel");
    const clan        = formData.get("clan-name");
    const anzahl      = formData.get("anzahl-spieler");
    const bemerkungen = formData.get("bemerkungen");

    /* Netlify‑Form normal abschicken */
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    /* Discord‑Webhook für Event‑Anmeldungen */
    if (typeof DISCORD_WEBHOOK_EVENT === "string" && DISCORD_WEBHOOK_EVENT) {
      try {
        await fetch(DISCORD_WEBHOOK_EVENT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content:
              "**Neue Event‑Anmeldung**\n" +
              `Name / Gaming‑ID: ${name}\n` +
              `E‑Mail: ${email}\n` +
              `Spiel: ${spiel}\n` +
              `Clan: ${clan}\n` +
              `Anzahl Spieler: ${anzahl}\n` +
              `Bemerkungen: ${bemerkungen || "-"}`,
          }),
        });
      } catch (err) {
        console.error("Discord Webhook (Event) Fehler:", err);
      }
    }

    eventForm.reset();
    const status = document.getElementById("event-form-success");
    if (status) status.style.display = "block";
  });
}
