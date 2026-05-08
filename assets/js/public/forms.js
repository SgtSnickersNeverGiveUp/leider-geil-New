(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initRecruitFormDiscord();
    initEventSignupDiscord();
  });

  function postNetlifyForm(formData) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
  }

  function initRecruitFormDiscord() {
    const recruitForm = document.getElementById('recruit-form');
    if (!recruitForm) return;

    recruitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(recruitForm);
      if (formData.get('website')) return;

      const gamingId = formData.get('gaming-id');
      const alter = formData.get('alter');
      const spiel = formData.get('spiel');
      const rolle = formData.get('rolle');
      const about = formData.get('ueber-mich');

      await postNetlifyForm(formData);

      if (typeof DISCORD_WEBHOOK_BEWERBUNG === 'string' && DISCORD_WEBHOOK_BEWERBUNG) {
        try {
          await fetch(DISCORD_WEBHOOK_BEWERBUNG, {
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
          });
        } catch (err) {
          console.error('Discord Webhook (Bewerbung) Fehler:', err);
        }
      }

      recruitForm.reset();
      alert('Bewerbung gesendet - vielen Dank!');
    });
  }

  function initEventSignupDiscord() {
    const eventForm = document.getElementById('event-form');
    if (!eventForm) return;

    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(eventForm);
      const name = formData.get('name-gaming-id');
      const email = formData.get('email');
      const spiel = formData.get('spiel');
      const clan = formData.get('clan-name');
      const anzahl = formData.get('anzahl-spieler');
      const bemerkungen = formData.get('bemerkungen');

      await postNetlifyForm(formData);

      if (typeof DISCORD_WEBHOOK_EVENT === 'string' && DISCORD_WEBHOOK_EVENT) {
        try {
          await fetch(DISCORD_WEBHOOK_EVENT, {
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
          });
        } catch (err) {
          console.error('Discord Webhook (Event) Fehler:', err);
        }
      }

      eventForm.reset();
      const status = document.getElementById('event-form-success');
      if (status) status.style.display = 'block';
    });
  }
})();
