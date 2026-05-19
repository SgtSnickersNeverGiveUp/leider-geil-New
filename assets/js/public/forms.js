(() => {
  'use strict';

  const config = window.SITE_CONFIG || {};

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

  async function submitNetlifyForm(formData) {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
    if (!res.ok) throw new Error(`Netlify form ${res.status}`);
  }

  function setSubmitState(form, disabled) {
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = disabled;
  }

  function initRecruitForm() {
    const form = document.getElementById('recruit-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      if (formData.get('website')) return;

      const payload = {
        gamingId: formData.get('gaming-id'),
        alter: formData.get('alter'),
        hauptspiel: formData.get('spiel'),
        rolle: formData.get('rolle'),
        ueberMich: formData.get('ueber-mich'),
      };

      setSubmitState(form, true);
      try {
        await postJson(config.applicationsApi || '/api/applications', payload);
        submitNetlifyForm(formData).catch((err) => {
          console.warn('[Recruit Form] Netlify fallback failed:', err.message);
        });
        form.reset();
        alert('Bewerbung gesendet - vielen Dank!');
      } catch (err) {
        alert('Bewerbung konnte nicht gesendet werden. Bitte spaeter erneut versuchen.');
      } finally {
        setSubmitState(form, false);
      }
    });
  }

  function initEventSignupForm() {
    const form = document.getElementById('event-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name-gaming-id'),
        email: formData.get('email'),
        spiel: formData.get('spiel'),
        clan: formData.get('clan-name'),
        spielerAnzahl: formData.get('anzahl-spieler'),
        bemerkungen: formData.get('bemerkungen'),
      };

      setSubmitState(form, true);
      try {
        await postJson(config.eventRegistrationsApi || '/api/event-registrations', payload);
        submitNetlifyForm(formData).catch((err) => {
          console.warn('[Event Signup Form] Netlify fallback failed:', err.message);
        });
        form.reset();
        const status = document.getElementById('event-form-success');
        if (status) status.style.display = 'block';
      } catch (err) {
        alert('Anmeldung konnte nicht gesendet werden. Bitte spaeter erneut versuchen.');
      } finally {
        setSubmitState(form, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRecruitForm();
    initEventSignupForm();
  });
})();
