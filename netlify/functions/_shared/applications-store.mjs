import { getStore } from "@netlify/blobs";

export const APPLICATIONS_STORE_NAME = "applications";

export function getApplicationsStore() {
  return getStore(APPLICATIONS_STORE_NAME);
}

export async function createApplication(data, store = getApplicationsStore()) {
  const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const application = {
    id,
    gamingId: data.gamingId,
    alter: Number(data.alter),
    hauptspiel: data.hauptspiel,
    rolle: data.rolle,
    ueberMich: data.ueberMich,
    createdAt: new Date().toISOString(),
  };

  await store.setJSON(id, application);
  return application;
}

export async function listApplications(store = getApplicationsStore()) {
  const { blobs } = await store.list();
  const applications = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) applications.push(data);
  }

  applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return applications;
}

export async function deleteApplication(id, store = getApplicationsStore()) {
  await store.delete(id);
}
