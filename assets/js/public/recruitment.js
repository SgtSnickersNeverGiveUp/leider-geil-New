/* Bewerbung page behaviour only. */
(function (window, document) {
  'use strict';

  const { onReady } = window.LGPublic;

  function initRecruitFormDiscord() {
    const recruitForm = document.getElementById('recruit-form');
    if (!recruitForm) return;

    recruitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(recruitForm);
      const honey = formData.get('website');
      if (honey) return;

      const gamingId = formData.get('gaming-id');
      const alter = formData.get('alter');
      const spiel = formData.get('spiel');
      const rolle = formData.get('rolle');
      const about = formData.get('ueber-mich');

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

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

  onReady(initRecruitFormDiscord);
})(window, document);
