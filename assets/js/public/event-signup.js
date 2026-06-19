'use strict';

function initEventSignupDiscord() {
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
      const apiRes = await fetch(SITE_CONFIG.eventRegistrationsApi, {
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

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      }).catch((err) => {
        console.error('Netlify Form (Event) Fehler:', err);
      });

      if (typeof DISCORD_WEBHOOK_EVENT === 'string' && DISCORD_WEBHOOK_EVENT) {
        fetch(DISCORD_WEBHOOK_EVENT, {
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
      alert('Anmeldung konnte nicht gespeichert werden. Bitte versuche es später erneut.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initEventSignupDiscord);
