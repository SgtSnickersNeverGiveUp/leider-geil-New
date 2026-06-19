import { getStore } from "@netlify/blobs";

export const EVENT_REGISTRATIONS_STORE_NAME = "event-registrations";

export function getEventRegistrationsStore() {
  return getStore(EVENT_REGISTRATIONS_STORE_NAME);
}

export async function createEventRegistration(data, store = getEventRegistrationsStore()) {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const registration = {
    id,
    name: data.name,
    email: data.email,
    spiel: data.spiel,
    clan: data.clan || "",
    spielerAnzahl: data.spielerAnzahl || "",
    bemerkungen: data.bemerkungen || "",
    createdAt: new Date().toISOString(),
  };

  await store.setJSON(id, registration);
  return registration;
}

export async function listEventRegistrations(store = getEventRegistrationsStore()) {
  const { blobs } = await store.list();
  const registrations = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) registrations.push(data);
  }

  registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return registrations;
}

export async function deleteEventRegistration(id, store = getEventRegistrationsStore()) {
  await store.delete(id);
}
