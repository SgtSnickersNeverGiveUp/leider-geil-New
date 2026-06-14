/* Public application form submission. */
'use strict';

(function () {
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recruit-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    if (formData.get('website')) return;

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const apiRes = await fetch(SITE_CONFIG.applyEndpoint || '/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gamingId: formData.get('gaming-id'),
          alter: formData.get('alter'),
          hauptspiel: formData.get('spiel'),
          rolle: formData.get('rolle'),
          ueberMich: formData.get('ueber-mich'),
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

      form.reset();
      alert('Bewerbung gesendet - vielen Dank!');
    } catch (err) {
      console.error('Bewerbung speichern fehlgeschlagen:', err);
      alert('Bewerbung konnte nicht gespeichert werden. Bitte versuche es spaeter erneut.');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
})();
