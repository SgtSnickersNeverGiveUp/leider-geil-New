const DEFAULT_ADMIN_USER = "clanadmin";
const DEFAULT_ADMIN_PASSWORD = "MilfHunter";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function getExpectedCredentials() {
  return {
    user: process.env.ADMIN_AUTH_USER || DEFAULT_ADMIN_USER,
    password: process.env.ADMIN_AUTH_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  };
}

function parseBasicAuth(headerValue) {
  if (!headerValue || !headerValue.startsWith("Basic ")) return null;

  try {
    const decoded = Buffer.from(headerValue.slice("Basic ".length), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return null;

    return {
      user: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function isAdminRequest(req) {
  const expected = getExpectedCredentials();
  const actual = parseBasicAuth(req.headers.get("authorization"));

  return Boolean(
    actual &&
    actual.user === expected.user &&
    actual.password === expected.password
  );
}

export function requireAdmin(req) {
  if (isAdminRequest(req)) return null;

  return jsonResponse(
    { error: "Admin authentication required" },
    401,
    { "WWW-Authenticate": 'Basic realm="Leider Geil Admin"' }
  );
}

export { jsonResponse };
