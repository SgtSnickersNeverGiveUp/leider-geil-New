function formatValue(value) {
  const text = String(value || "").trim();
  return text || "-";
}

async function postDiscordMessage(webhookUrl, content, contextLabel) {
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      console.error(`[Discord] ${contextLabel} failed`, response.status, await response.text());
    }
  } catch (err) {
    console.error(`[Discord] ${contextLabel} failed`, err);
  }
}

export function notifyApplicationSubmission(application) {
  const content = [
    "**Neue Clan-Bewerbung**",
    `**Gaming-ID:** ${formatValue(application.gamingId)}`,
    `**Alter:** ${formatValue(application.alter)}`,
    `**Hauptspiel:** ${formatValue(application.hauptspiel)}`,
    `**Rolle:** ${formatValue(application.rolle)}`,
    `**Ueber mich:** ${formatValue(application.ueberMich)}`,
  ].join("\n");

  return postDiscordMessage(process.env.DISCORD_CLAN_WEBHOOK, content, "application notification");
}

export function notifyEventRegistration(registration) {
  const content = [
    "**Neue Event-Anmeldung**",
    `**Name / Gaming-ID:** ${formatValue(registration.name)}`,
    `**E-Mail:** ${formatValue(registration.email)}`,
    `**Spiel:** ${formatValue(registration.spiel)}`,
    `**Clan-Name:** ${formatValue(registration.clan)}`,
    `**Anzahl Spieler:** ${formatValue(registration.spielerAnzahl)}`,
    `**Bemerkungen:** ${formatValue(registration.bemerkungen)}`,
  ].join("\n");

  return postDiscordMessage(process.env.DISCORD_EVENT_WEBHOOK, content, "event registration notification");
}
