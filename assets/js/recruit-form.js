'use strict';

function initRecruitFormDiscord() {
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
      const apiRes = await fetch(SITE_CONFIG.applicationsApi, {
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
        } catch {}
        throw new Error(message);
      }

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
                `Über mich: ${about}`,
            }),
          });
        } catch (err) {
          console.error('Discord Webhook (Bewerbung) Fehler:', err);
        }
      }

      recruitForm.reset();
      alert('Bewerbung gesendet - vielen Dank!');
    } catch (err) {
      console.error('Bewerbung speichern fehlgeschlagen:', err);
      alert('Bewerbung konnte nicht gespeichert werden. Bitte versuche es später erneut.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initRecruitFormDiscord);
