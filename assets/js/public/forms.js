'use strict';

(() => {
  const config = window.SITE_CONFIG || {};

  document.addEventListener('DOMContentLoaded', () => {
    initRecruitForm();
    initEventSignupForm();
  });

  function initRecruitForm() {
    const form = document.getElementById('recruit-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      if (formData.get('website')) return;

      try {
        const payload = {
          gamingId: formData.get('gaming-id'),
          alter: formData.get('alter'),
          hauptspiel: formData.get('spiel'),
          rolle: formData.get('rolle'),
          ueberMich: formData.get('ueber-mich'),
        };

        await postJson(config.applyEndpoint || '/api/applications', payload);
        postNetlifyForm(formData);
        form.reset();
        alert('Bewerbung gesendet - vielen Dank!');
      } catch (err) {
        console.error('[Recruit Form]', err);
        alert('Bewerbung konnte nicht gesendet werden. Bitte spaeter erneut versuchen.');
      }
    });
  }

  function initEventSignupForm() {
    const form = document.getElementById('event-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const status = document.getElementById('event-form-success');

      try {
        const payload = {
          name: formData.get('name-gaming-id'),
          email: formData.get('email'),
          spiel: formData.get('spiel'),
          clan: formData.get('clan-name'),
          spielerAnzahl: formData.get('anzahl-spieler'),
          bemerkungen: formData.get('bemerkungen'),
        };

        await postJson(config.eventRegistrationsApi || '/api/event-registrations', payload);
        postNetlifyForm(formData);
        form.reset();
        if (status) status.style.display = 'block';
      } catch (err) {
        console.error('[Event Signup Form]', err);
        if (status) {
          status.style.display = 'block';
          status.textContent = 'Anmeldung konnte nicht gesendet werden. Bitte spaeter erneut versuchen.';
        } else {
          alert('Anmeldung konnte nicht gesendet werden. Bitte spaeter erneut versuchen.');
        }
      }
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

  function postNetlifyForm(formData) {
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    }).catch((err) => {
      console.warn('[Netlify Form]', err.message);
    });
  }
})();
