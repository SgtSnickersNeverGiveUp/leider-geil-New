(() => {
  'use strict';

  const MAX_VISIBLE_SHOUTS = 4;

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('community-shouts');
    if (!root) return;

    initCommunityShouts(root);
  });

  function initCommunityShouts(root) {
    const form = document.getElementById('community-shouts-form');
    const status = document.getElementById('community-shouts-status');
    const list = document.getElementById('community-shouts-list');
    const apiUrl = SITE_CONFIG.communityShoutsApi || '/api/community-shouts';

    loadApprovedShouts(apiUrl, list);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form || !status) return;

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        tag: formData.get('tag'),
        message: formData.get('message'),
        website: formData.get('website'),
      };

      status.className = 'community-shouts__status';
      status.textContent = 'Sende Shout...';

      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

        form.reset();
        status.classList.add('community-shouts__status--success');
        status.textContent = 'Shout empfangen. Wartet auf Freigabe, bevor er auf der Wall erscheint.';
      } catch (err) {
        status.classList.add('community-shouts__status--error');
        status.textContent = 'Shout konnte nicht gesendet werden. Bitte später erneut versuchen.';
      }
    });
  }

  async function loadApprovedShouts(apiUrl, list) {
    if (!list) return;

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const shouts = await res.json();
      renderShouts(list, Array.isArray(shouts) ? shouts.slice(0, MAX_VISIBLE_SHOUTS) : []);
    } catch (err) {
      list.innerHTML = '<div class="community-shouts__empty">Shouts konnten nicht geladen werden.</div>';
    }
  }

  function renderShouts(list, shouts) {
    if (shouts.length === 0) {
      list.innerHTML = '<div class="community-shouts__empty">Noch keine freigegebenen Shouts.</div>';
      return;
    }

    list.innerHTML = shouts.map((shout) => `
      <article class="community-shout-card">
        <div class="community-shout-card__head">
          <strong>${escapeHtml(shout.name)}</strong>
          <span>${escapeHtml(shout.tag || 'Community')}</span>
        </div>
        <p>${escapeHtml(shout.message)}</p>
      </article>
    `).join('');
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
