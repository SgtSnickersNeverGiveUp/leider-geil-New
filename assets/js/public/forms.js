(function () {
  'use strict';

  const config = window.SITE_CONFIG || {};

  function submitNetlifyForm(formData) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function initRecruitForm() {
    const recruitForm = document.getElementById('recruit-form');
    if (!recruitForm) return;

    recruitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(recruitForm);
      if (formData.get('website')) return;

      const payload = {
        gamingId: formData.get('gaming-id'),
        alter: formData.get('alter'),
        hauptspiel: formData.get('spiel'),
        rolle: formData.get('rolle'),
        ueberMich: formData.get('ueber-mich'),
      };

      try {
        await postJson(config.applyEndpoint || '/api/applications', payload);
        // Keep Netlify's form hook as the server-side Discord notification path.
        submitNetlifyForm(formData).catch((err) => console.warn('[Recruit Form] Netlify hook failed:', err));
        recruitForm.reset();
        alert('Bewerbung gesendet - vielen Dank!');
      } catch (err) {
        console.error('[Recruit Form]', err);
        alert('Bewerbung konnte nicht gesendet werden. Bitte versuche es spaeter erneut.');
      }
    });
  }

  function initEventSignupForm() {
    const eventForm = document.getElementById('event-form');
    if (!eventForm) return;

    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(eventForm);
      const payload = {
        name: formData.get('name-gaming-id'),
        email: formData.get('email'),
        spiel: formData.get('spiel'),
        clan: formData.get('clan-name'),
        spielerAnzahl: formData.get('anzahl-spieler'),
        bemerkungen: formData.get('bemerkungen'),
      };

      try {
        await postJson(config.eventRegistrationsApi || '/api/event-registrations', payload);
        // Keep Netlify's form hook as the server-side Discord notification path.
        submitNetlifyForm(formData).catch((err) => console.warn('[Event Form] Netlify hook failed:', err));
        eventForm.reset();
        const status = document.getElementById('event-form-success');
        if (status) status.style.display = 'block';
      } catch (err) {
        console.error('[Event Form]', err);
        alert('Anmeldung konnte nicht gesendet werden. Bitte versuche es spaeter erneut.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRecruitForm();
    initEventSignupForm();
  });
})();
