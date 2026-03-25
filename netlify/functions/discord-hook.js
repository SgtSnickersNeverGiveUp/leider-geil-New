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

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("JSON parse error:", e, event.body);
      return {
        statusCode: 400,
        body: "Invalid JSON",
      };
    }

    // Netlify-Form-Webhooks: Daten liegen unter body.payload.data
    const payload = body.payload || {};
    const data = payload.data || {};
    const formName =
      data["form-name"] ||
      payload.form_name ||
      payload.formName ||
      "unknown";

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
        "**Neue Event-Anmeldung**\n" +
        `Name / Gaming-ID: ${data["name-gaming-id"] || "-"}\n` +
        `E-Mail: ${data["email"] || "-"}\n` +
        `Spiel: ${data["spiel"] || "-"}\n` +
        `Clan-Name: ${data["clan-name"] || "-"}\n` +
        `Anzahl Spieler: ${data["anzahl-spieler"] || "-"}\n` +
        `Bemerkungen: ${data["bemerkungen"] || "-"}\n`;
    } else if (formName === "join-resistance") {
      content =
        "**Neue Clan-Bewerbung**\n" +
        `Gaming-ID: ${data["gaming-id"] || "-"}\n` +
        `Alter: ${data["alter"] || "-"}\n` +
        `Hauptspiel: ${data["spiel"] || "-"}\n` +
        `Rolle: ${data["rolle"] || "-"}\n` +
        `Über mich: ${data["ueber-mich"] || "-"}\n`;
    }

    const discordPayload = { content };

    await postToDiscord(webhookUrl, discordPayload);

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
