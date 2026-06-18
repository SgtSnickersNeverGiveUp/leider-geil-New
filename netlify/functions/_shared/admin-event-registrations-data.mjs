export function toAdminEventRegistration(registration = {}) {
  return {
    id: registration.id || "",
    name: registration.name || "",
    email: registration.email || "",
    spiel: registration.spiel || "",
    clan: registration.clan || "",
    spielerAnzahl: registration.spielerAnzahl || "",
    bemerkungen: registration.bemerkungen || "",
    createdAt: registration.createdAt || "",
  };
}
