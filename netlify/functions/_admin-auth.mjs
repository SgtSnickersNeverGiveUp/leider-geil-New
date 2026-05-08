const DEFAULT_ADMIN_CREDENTIALS = "clanadmin:MilfHunter";
const ADMIN_REALM = "Leider Geil Admin";

function getExpectedAuthorization() {
  const credentials = process.env.ADMIN_BASIC_AUTH || DEFAULT_ADMIN_CREDENTIALS;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export function requireAdmin(req) {
  if (req.headers.get("authorization") === getExpectedAuthorization()) {
    return null;
  }

  return new Response(JSON.stringify({ error: "Admin authorization required." }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}"`,
    },
  });
}
