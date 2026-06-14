/* Public event signup form submission. */
'use strict';

(function () {
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('event-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const status = document.getElementById('event-form-success');

    if (status) status.style.display = 'none';
    if (submitButton) submitButton.disabled = true;

    try {
      const apiRes = await fetch(SITE_CONFIG.eventRegistrationsApi || '/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name-gaming-id'),
          email: formData.get('email'),
          spiel: formData.get('spiel'),
          clan: formData.get('clan-name'),
          spielerAnzahl: formData.get('anzahl-spieler'),
          bemerkungen: formData.get('bemerkungen'),
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

      submitNetlifyForm(formData);
      form.reset();
      if (status) status.style.display = 'block';
    } catch (err) {
      console.error('Event-Anmeldung speichern fehlgeschlagen:', err);
      alert('Anmeldung konnte nicht gespeichert werden. Bitte versuche es spaeter erneut.');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

function submitNetlifyForm(formData) {
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData).toString(),
  }).catch((err) => {
    console.error('Netlify Form (Event) Fehler:', err);
  });
}
})();
