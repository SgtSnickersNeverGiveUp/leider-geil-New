'use strict';

/* Public form handling only. Admin review/edit flows stay in admin scripts. */

function getOptionalWebhook(name) {
  const hooks = window.LG_PUBLIC_WEBHOOKS || {};
  return typeof hooks[name] === 'string' ? hooks[name] : '';
}

function postNetlifyForm(formData, label) {
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData).toString(),
  }).catch((err) => {
    console.error(`Netlify Form (${label}) Fehler:`, err);
  });
}

function initRecruitForm() {
  const recruitForm = document.getElementById('recruit-form');
  if (!recruitForm) return;

  recruitForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(recruitForm);
    const honey = formData.get('website');
    if (honey) return;

    const submitBtn = recruitForm.querySelector('button[type="submit"]');
    const gamingId = formData.get('gaming-id');
    const alter = formData.get('alter');
    const spiel = formData.get('spiel');
    const rolle = formData.get('rolle');
    const about = formData.get('ueber-mich');

    if (submitBtn) submitBtn.disabled = true;

    try {
      const apiRes = await fetch(SITE_CONFIG.applyEndpoint || '/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gamingId,
          alter,
          hauptspiel: spiel,
          rolle,
          ueberMich: about,
        }),
      });

      if (!apiRes.ok) {
        let message = `HTTP ${apiRes.status}`;
        try {
          const data = await apiRes.json();
          if (data.error) message = data.error;
        } catch {
          // Keep the HTTP status if the server did not return JSON.
        }
        throw new Error(message);
      }

      postNetlifyForm(formData, 'Bewerbung');

      const webhook = getOptionalWebhook('bewerbung');
      if (webhook) {
        fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content:
              '**Neue Clan-Bewerbung**\n' +
              `Gaming-ID: ${gamingId}\n` +
              `Alter: ${alter}\n` +
              `Spiel: ${spiel}\n` +
              `Rolle: ${rolle}\n` +
              `Ueber mich: ${about}`,
          }),
        }).catch((err) => {
          console.error('Discord Webhook (Bewerbung) Fehler:', err);
        });
      }

      recruitForm.reset();
      alert('Bewerbung gesendet - vielen Dank!');
    } catch (err) {
      console.error('Bewerbung speichern fehlgeschlagen:', err);
      alert('Bewerbung konnte nicht gespeichert werden. Bitte versuche es spaeter erneut.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function initEventSignup() {
  const eventForm = document.getElementById('event-form');
  if (!eventForm) return;

  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(eventForm);
    const submitBtn = eventForm.querySelector('button[type="submit"]');
    const status = document.getElementById('event-form-success');

    const name = formData.get('name-gaming-id');
    const email = formData.get('email');
    const spiel = formData.get('spiel');
    const clan = formData.get('clan-name');
    const anzahl = formData.get('anzahl-spieler');
    const bemerkungen = formData.get('bemerkungen');

    if (status) status.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const apiRes = await fetch(SITE_CONFIG.eventRegistrationsApi || '/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          spiel,
          clan,
          spielerAnzahl: anzahl,
          bemerkungen,
        }),
      });

      if (!apiRes.ok) {
        let message = `HTTP ${apiRes.status}`;
        try {
          const data = await apiRes.json();
          if (data.error) message = data.error;
        } catch {
          // Keep the HTTP status if the server did not return JSON.
        }
        throw new Error(message);
      }

      postNetlifyForm(formData, 'Event');

      const webhook = getOptionalWebhook('event');
      if (webhook) {
        fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content:
              '**Neue Event-Anmeldung**\n' +
              `Name / Gaming-ID: ${name}\n` +
              `E-Mail: ${email}\n` +
              `Spiel: ${spiel}\n` +
              `Clan: ${clan}\n` +
              `Anzahl Spieler: ${anzahl}\n` +
              `Bemerkungen: ${bemerkungen || '-'}`,
          }),
        }).catch((err) => {
          console.error('Discord Webhook (Event) Fehler:', err);
        });
      }

      eventForm.reset();
      if (status) status.style.display = 'block';
    } catch (err) {
      console.error('Event-Anmeldung speichern fehlgeschlagen:', err);
      alert('Anmeldung konnte nicht gespeichert werden. Bitte versuche es spaeter erneut.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRecruitForm();
  initEventSignup();
});
