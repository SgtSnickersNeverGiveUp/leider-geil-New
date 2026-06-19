import { getStore } from "@netlify/blobs";

export const APPLICATIONS_STORE_NAME = "applications";
export const EVENT_REGISTRATIONS_STORE_NAME = "event-registrations";

export function getApplicationsStore() {
  return getStore(APPLICATIONS_STORE_NAME);
}

export function getEventRegistrationsStore() {
  return getStore(EVENT_REGISTRATIONS_STORE_NAME);
}

export async function listSubmissions(store) {
  const { blobs } = await store.list();
  const submissions = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) submissions.push(data);
  }

  submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return submissions;
}
