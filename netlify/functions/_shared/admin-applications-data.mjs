export function toAdminApplication(application = {}) {
  return {
    id: application.id || "",
    gamingId: application.gamingId || "",
    alter: application.alter ?? "",
    hauptspiel: application.hauptspiel || "",
    rolle: application.rolle || "",
    ueberMich: application.ueberMich || "",
    createdAt: application.createdAt || "",
  };
}
