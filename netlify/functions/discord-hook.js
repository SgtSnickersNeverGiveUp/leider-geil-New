exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    const formData = JSON.parse(event.body || "{}");
    const formName = formData["form-name"] || formData.form_name || "unknown";

    // Wähle Discord-Webhook je nach Formular
    let webhookUrl = null;

    if (formName === "event-signup") {
      webhookUrl = process.env.DISCORD_EVENT_WEBHOOK;
    } else if (formName === "join-resistance") {
      webhookUrl = process.env.DISCORD_CLAN_WEBHOOK;
    } else {
      // unbekanntes Formular – nichts machen
      return {
        statusCode: 200,
        body: "Ignored form",
      };
    }

    if (!webhookUrl) {
      console.error("Missing Discord webhook URL for form:", formName);
      return {
        statusCode: 500,
        body: "Missing Discord webhook URL",
      };
    }

    // Nachrichtentext für Discord bauen
    let content = "";

    if (formName === "event-signup") {
      content =
        "**Neue Event-Anmeldung**\n" +
        `Name / Gaming-ID: ${formData["name-gaming-id"] || "-"}\n` +
        `E-Mail: ${formData["email"] || "-"}\n` +
        `Spiel: ${formData["spiel"] || "-"}\n` +
        `Clan-Name: ${formData["clan-name"] || "-"}\n` +
        `Anzahl Spieler: ${formData["anzahl-spieler"] || "-"}\n` +
        `Bemerkungen: ${formData["bemerkungen"] || "-"}\n`;
    } else if (formName === "join-resistance") {
      content =
        "**Neue Clan-Bewerbung**\n" +
        `Gaming-ID: ${formData["gaming-id"] || "-"}\n` +
        `Alter: ${formData["alter"] || "-"}\n` +
        `Hauptspiel: ${formData["spiel"] || "-"}\n` +
        `Rolle: ${formData["rolle"] || "-"}\n` +
        `Über mich: ${formData["ueber-mich"] || "-"}\n`;
    }

    const payload = {
      content,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Discord webhook error:", response.status, text);
      return {
        statusCode: 500,
        body: "Discord webhook error",
      };
    }

    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: "Server error",
    };
  }
};
