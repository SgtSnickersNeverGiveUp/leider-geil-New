import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "lg_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret());
}

function safeEqual(value, expected) {
  const valueString = String(value || "");
  const expectedString = String(expected || "");
  const valueBuffer = createHash("sha256").update(valueString).digest();
  const expectedBuffer = createHash("sha256").update(expectedString).digest();

  return timingSafeEqual(valueBuffer, expectedBuffer) && valueString.length === expectedString.length;
}

export function verifyAdminPassword(password) {
  const expected = getAdminPassword();
  if (!expected || typeof password !== "string") return false;
  return safeEqual(password, expected);
}

function signPayload(payload) {
  const secret = getSessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionValue() {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
  })).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return cookies;
      const name = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function isSecureRequest(req) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0].trim() === "https";

  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return true;
  }
}

function cookieSecurityAttribute(req) {
  return isSecureRequest(req) ? "; Secure" : "";
}

export function createAdminSessionCookie(req) {
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(createSessionValue())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_TTL_SECONDS}${cookieSecurityAttribute(req)}`;
}

export function createAdminLogoutCookie(req) {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurityAttribute(req)}`;
}

export function isAdminAuthenticated(req) {
  if (!isAdminAuthConfigured()) return false;

  const cookies = parseCookies(req.headers.get("cookie"));
  const session = cookies[ADMIN_COOKIE_NAME];
  if (!session) return false;

  const [payload, signature] = session.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = signPayload(payload);
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.sub === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function requireAdmin(req) {
  if (isAdminAuthenticated(req)) return null;
  return jsonResponse({ error: "Admin login required." }, 401);
}

export { jsonResponse };
