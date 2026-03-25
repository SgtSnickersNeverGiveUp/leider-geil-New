const https = require("https");

function postToDiscord(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(webhookUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk.toString()));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          console.error("Discord error:", res.statusCode, body);
          reject(new Error("Discord webhook error"));
        }
      });
    });

    req.on("error", (err) => {
      console.error("Request error:", err);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    let formPayload;
    try {
      formPayload = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("JSON parse error:", e, event.body);
      return {
        statusCode: 400,
        body: "Invalid JSON",
      };
    }

    // Netlify Outgoing Webhook: { form_name: "...", data: { ...fields... }, ... }
    const formName =
      formPayload.form_name ||
      formPayload["form-name"] ||
      formPayload["form-name"] ||
      "unknown";

    const fields = formPayload.data || formPayload || {};

    console.log("Received form submission:", {
      formName,
      fields,
    });

    let webhookUrl = null;

    if (formName === "event-signup") {
      webhookUrl = process.env.DISCORD_EVENT_WEBHOOK;
    } else if (formName === "join-resistance") {
      webhookUrl = process.env.DISCORD_CLAN_WEBHOOK;
    } else {
      console.log("Unknown form, ignoring:", formName);
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

    let content = "";

    if (formName === "event-signup") {
      content =
        "**📅 Neue Event-Anmeldung**\n" +
        `**Name / Gaming-ID:** ${fields["name-gaming-id"] || "-"}\n` +
        `**E-Mail:** ${fields["email"] || "-"}\n` +
        `**Spiel:** ${fields["spiel"] || "-"}\n` +
        `**Clan-Name:** ${fields["clan-name"] || "-"}\n` +
        `**Anzahl Spieler:** ${fields["anzahl-spieler"] || "-"}\n` +
        `**Bemerkungen:** ${fields["bemerkungen"] || "-"}\n`;
    } else if (formName === "join-resistance") {
      content =
        "**🛡️ Neue Clan-Bewerbung**\n" +
        `**Gaming-ID:** ${fields["gaming-id"] || "-"}\n` +
        `**Alter:** ${fields["alter"] || "-"}\n` +
        `**Hauptspiel:** ${fields["spiel"] || "-"}\n` +
        `**Rolle:** ${fields["rolle"] || "-"}\n` +
        `**Über mich:** ${fields["ueber-mich"] || "-"}\n`;
    }

    const payload = { content };

    await postToDiscord(webhookUrl, payload);

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

