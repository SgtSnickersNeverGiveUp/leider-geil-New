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

    let formData;
    try {
      formData = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("JSON parse error:", e, event.body);
      return {
        statusCode: 400,
        body: "Invalid JSON",
      };
    }

    const formName = formData["form-name"] || formData.form_name || "unknown";

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
