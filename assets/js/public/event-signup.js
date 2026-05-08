/* Event signup page behaviour only. */
(function (window, document) {
  'use strict';

  const { onReady } = window.LGPublic;

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

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

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

  onReady(initEventSignupDiscord);
})(window, document);
