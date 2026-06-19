(function () {
  'use strict';

  async function fetchDiscordStatus() {
    const el = $('#discord-count');
    if (!el) return;

    try {
      const res = await fetch(SITE_CONFIG.discordWidgetApi);
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
      const res = await fetch(SITE_CONFIG.twitchStatusApi);
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

  function startLiveUpdates() {
    setInterval(fetchDiscordStatus, SITE_CONFIG.discordRefreshInterval);
    setInterval(fetchTwitchStatus, SITE_CONFIG.twitchRefreshInterval);
  }

  function initLiveStatus() {
    fetchDiscordStatus();
    fetchTwitchStatus();
    startLiveUpdates();
  }

  window.LG_INDEX_LIVE_STATUS = Object.freeze({
    init: initLiveStatus,
  });
})();
