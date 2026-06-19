export const EVENT_REGISTRATIONS_STORE_NAME = "event-registrations";

function createEventRegistrationId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEventRegistrationText(value) {
  return String(value || "");
}

export function createEventRegistration(value = {}) {
  return {
    id: createEventRegistrationId(),
    name: normalizeEventRegistrationText(value.name),
    email: normalizeEventRegistrationText(value.email),
    spiel: normalizeEventRegistrationText(value.spiel),
    clan: normalizeEventRegistrationText(value.clan),
    spielerAnzahl: normalizeEventRegistrationText(value.spielerAnzahl),
    bemerkungen: normalizeEventRegistrationText(value.bemerkungen),
    createdAt: new Date().toISOString(),
  };
}

export function hasRequiredEventRegistrationFields(registration = {}) {
  return Boolean(registration.name && registration.email && registration.spiel);
}

export async function listEventRegistrations(store) {
  const { blobs } = await store.list();
  const registrations = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) registrations.push(data);
  }

  registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return registrations;
}
