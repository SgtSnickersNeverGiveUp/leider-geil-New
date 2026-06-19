export const APPLICATIONS_STORE_NAME = "applications";

const MAX_GAMING_ID_LENGTH = 80;
const MAX_GAME_LENGTH = 80;
const MAX_ROLE_LENGTH = 80;
const MAX_ABOUT_LENGTH = 2000;

function createApplicationId() {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeApplicationText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeApplicationAbout(value) {
  return String(value || "")
    .trim()
    .slice(0, MAX_ABOUT_LENGTH);
}

export function createApplication(value = {}) {
  const age = Number(value.alter);

  return {
    id: createApplicationId(),
    gamingId: sanitizeApplicationText(value.gamingId, MAX_GAMING_ID_LENGTH),
    alter: Number.isFinite(age) ? age : null,
    hauptspiel: sanitizeApplicationText(value.hauptspiel, MAX_GAME_LENGTH),
    rolle: sanitizeApplicationText(value.rolle, MAX_ROLE_LENGTH),
    ueberMich: sanitizeApplicationAbout(value.ueberMich),
    createdAt: new Date().toISOString(),
  };
}

export function hasRequiredApplicationFields(application = {}) {
  return Boolean(
    application.gamingId
      && application.alter
      && application.hauptspiel
      && application.rolle
      && application.ueberMich,
  );
}

export async function listApplications(store) {
  const { blobs } = await store.list();
  const applications = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) applications.push(data);
  }

  applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return applications;
}
