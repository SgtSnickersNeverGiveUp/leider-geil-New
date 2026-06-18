const ADMIN_COOKIE_NAME = "lg_admin_session";
const PUBLIC_ADMIN_API_PATHS = new Set([
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/session",
]);

function getSessionSecret() {
  return Deno.env.get("ADMIN_SESSION_SECRET") || Deno.env.get("ADMIN_PASSWORD") || "";
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

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeEqual(value, expected) {
  if (value.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < value.length; i += 1) {
    diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

async function isAdminAuthenticated(request) {
  const secret = getSessionSecret();
  if (!secret || !Deno.env.get("ADMIN_PASSWORD")) return false;

  const cookies = parseCookies(request.headers.get("cookie"));
  const session = cookies[ADMIN_COOKIE_NAME];
  if (!session) return false;

  const [payload, signature] = session.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = await signPayload(payload, secret);
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    return data.sub === "admin" && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export default async (request, context) => {
  const requestUrl = new URL(request.url);
  const isAdminApiRequest = requestUrl.pathname.startsWith("/api/admin/");

  if (isAdminApiRequest && PUBLIC_ADMIN_API_PATHS.has(requestUrl.pathname)) {
    return context.next();
  }

  if (await isAdminAuthenticated(request)) {
    return context.next();
  }

  if (isAdminApiRequest) {
    return new Response(JSON.stringify({ error: "Admin login required." }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const loginUrl = new URL("/admin-login.html", request.url);
  loginUrl.searchParams.set("redirect", `${requestUrl.pathname}${requestUrl.search}`);

  return Response.redirect(loginUrl, 302);
};
