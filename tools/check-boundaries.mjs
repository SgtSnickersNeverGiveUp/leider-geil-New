import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function listFiles(relativeDir, extension) {
  const dir = path.join(root, relativeDir);
  const files = [];

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith(extension)) {
        files.push(path.relative(root, fullPath).replaceAll(path.sep, "/"));
      }
    }
  }

  walk(dir);
  return files.sort();
}

const publicHtml = ["index.html", "bewerben.html", "event-anmeldung.html", "impressum.html"];
const adminHtml = ["admin-login.html", "lg-dashboard.html"];
const publicConfigPath = "assets/js/public/config.js";
const sharedSiteUtilsPath = "assets/js/shared/site-utils.js";
const publicScripts = [
  "assets/js/public/public-core.js",
  "assets/js/public/index.js",
  "assets/js/public/roster-slideshow.js",
  "assets/js/public/community-shouts.js",
  "assets/js/public/public-roster.js",
  "assets/js/public/clan-news-ticker.js",
  "assets/js/public/recruit-form.js",
  "assets/js/public/event-signup.js",
];
const adminConfigPath = "assets/js/admin/admin-config.js";
const adminSharedPath = "assets/js/admin/admin-shared.js";
const adminBrowserFiles = [
  "assets/js/admin/admin-dashboard.js",
  "assets/js/admin/admin-roster.js",
  "assets/js/admin/admin-login.js",
];

function assertOrdered(source, first, second, message) {
  assert(
    source.includes(first) && source.includes(second) && source.indexOf(first) < source.indexOf(second),
    message,
  );
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function selectorPattern(selector) {
  return new RegExp(`(^|[\\s,{>+~])${escapeRegex(selector)}(?![-_a-zA-Z0-9])`, "m");
}

function extractNamedImports(source, modulePath) {
  const imports = [];
  const pattern = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*["']${escapeRegex(modulePath)}["']`, "g");
  let match;

  while ((match = pattern.exec(source))) {
    imports.push(
      ...match[1]
        .split(",")
        .map((name) => name.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean),
    );
  }

  return imports;
}

for (const file of publicHtml) {
  const html = read(file);
  assert(!html.includes("assets/css/admin-dashboard.css"), `${file} must not load admin CSS`);
  assert(!html.includes("assets/js/admin/"), `${file} must not load admin JS`);
  assert(!html.includes("admin-dashboard.js"), `${file} must not load admin dashboard JS`);
  assert(!html.includes("admin-login.js"), `${file} must not load admin login JS`);
  assert(!html.includes("admin-config.js"), `${file} must not load admin config JS`);
}

for (const file of adminHtml) {
  const html = read(file);
  assert(html.includes(`/${adminConfigPath}`), `${file} must load admin config JS`);
  assert(!html.includes("assets/css/styles.css"), `${file} must not load public CSS`);
  assert(!html.includes("assets/js/public/"), `${file} must not load public JS`);
  assert(!html.includes("assets/js/script.js"), `${file} must not load legacy public script.js`);
}

const publicCss = read("assets/css/styles.css");
const adminCss = read("assets/css/admin-dashboard.css");
const adminOnlySelectors = [
  ".admin-layout",
  ".admin-main",
  ".admin-header",
  ".admin-page",
  ".admin-form",
  ".admin-login-card",
  ".admin-login-page",
  ".sidebar",
  ".panel",
  ".stats-row",
  ".modal-overlay",
  ".btn-delete",
];
const publicOnlySelectors = [
  ".navbar",
  ".hero",
  ".header-banner",
  ".top-community",
  ".community-shouts",
  ".roster-slideshow",
  ".live-status",
  ".timeline",
  ".video-gallery-grid",
  ".visitor-counter",
  ".footer",
  ".recruit-form",
  ".event-form",
];

for (const selector of adminOnlySelectors) {
  assert(!selectorPattern(selector).test(publicCss), `public styles.css must not define admin selector ${selector}`);
}

for (const selector of publicOnlySelectors) {
  assert(!selectorPattern(selector).test(adminCss), `admin-dashboard.css must not define public selector ${selector}`);
}

assert(!existsSync(path.join(root, "assets/js/script.js")), "legacy assets/js/script.js must stay removed");
assert(!existsSync(path.join(root, "config.js")), "public config must live under assets/js/public");

const browserScripts = listFiles("assets/js", ".js");
const invalidBrowserScriptLocations = browserScripts.filter(
  (file) => !file.startsWith("assets/js/public/")
    && !file.startsWith("assets/js/admin/")
    && !file.startsWith("assets/js/shared/"),
);
assert(
  invalidBrowserScriptLocations.length === 0,
  `browser scripts must live under public/admin/shared folders: ${invalidBrowserScriptLocations.join(", ")}`,
);

for (const file of publicScripts) {
  assert(existsSync(path.join(root, file)), `${file} must stay in assets/js/public`);
}

for (const file of [adminConfigPath, adminSharedPath, ...adminBrowserFiles]) {
  assert(existsSync(path.join(root, file)), `${file} must stay in assets/js/admin`);
}

const indexHtml = read("index.html");
assert(indexHtml.includes("assets/js/shared/content-urls.js"), "index.html must load shared content URLs");
assert(indexHtml.includes("assets/js/shared/roster-slideshow-settings.js"), "index.html must load shared roster slideshow settings");
assert(indexHtml.includes(sharedSiteUtilsPath), "index.html must load shared site utilities");
assertOrdered(indexHtml, "assets/js/shared/content-urls.js", "assets/js/public/index.js", "index.html must load shared content URLs before index.js");
assertOrdered(indexHtml, "assets/js/public/public-core.js", "assets/js/public/index.js", "index.html must load public-core.js before index.js");
assertOrdered(
  indexHtml,
  "assets/js/public/public-core.js",
  "assets/js/public/roster-slideshow.js",
  "index.html must load public-core.js before roster-slideshow.js",
);
assertOrdered(
  indexHtml,
  "assets/js/public/public-core.js",
  "assets/js/public/community-shouts.js",
  "index.html must load public-core.js before community-shouts.js",
);
assertOrdered(
  indexHtml,
  "assets/js/public/public-core.js",
  "assets/js/public/public-roster.js",
  "index.html must load public-core.js before public-roster.js",
);
assertOrdered(
  indexHtml,
  "assets/js/shared/roster-slideshow-settings.js",
  "assets/js/public/roster-slideshow.js",
  "index.html must load shared roster slideshow settings before roster-slideshow.js",
);
for (const file of [
  "assets/js/public/index.js",
  "assets/js/public/roster-slideshow.js",
  "assets/js/public/community-shouts.js",
  "assets/js/public/public-roster.js",
]) {
  assertOrdered(indexHtml, sharedSiteUtilsPath, file, `index.html must load shared site utilities before ${file}`);
}

const recruitHtml = read("bewerben.html");
assert(recruitHtml.includes(publicConfigPath), "bewerben.html must load public config");
assertOrdered(recruitHtml, "assets/js/public/public-core.js", "assets/js/public/recruit-form.js", "bewerben.html must load public-core.js before recruit-form.js");
assertOrdered(recruitHtml, publicConfigPath, "assets/js/public/recruit-form.js", "bewerben.html must load public config before recruit-form.js");

const eventSignupHtml = read("event-anmeldung.html");
assert(eventSignupHtml.includes(publicConfigPath), "event-anmeldung.html must load public config");
assertOrdered(
  eventSignupHtml,
  "assets/js/public/public-core.js",
  "assets/js/public/event-signup.js",
  "event-anmeldung.html must load public-core.js before event-signup.js",
);
assertOrdered(
  eventSignupHtml,
  publicConfigPath,
  "assets/js/public/event-signup.js",
  "event-anmeldung.html must load public config before event-signup.js",
);

for (const file of publicScripts) {
  const source = read(file);
  if (!source.includes("SITE_CONFIG")) continue;

  const pages = publicHtml.filter((htmlFile) => read(htmlFile).includes(file));
  assert(pages.length > 0, `${file} uses SITE_CONFIG and must be loaded by a public HTML page`);
  for (const htmlFile of pages) {
    const html = htmlFile === "index.html" ? indexHtml : read(htmlFile);
    assertOrdered(html, publicConfigPath, file, `${htmlFile} must load public config before ${file}`);
  }
}

const publicDeliveryEndpointLiterals = ["/api/banner-image", "/api/event-image", "/api/roster-avatar"];
const publicConfigEndpointLiterals = [
  "/api/twitch-status",
  "/api/roster",
  "/api/events",
  "/api/videos",
  "/api/news",
  "/api/settings",
  "/api/community-shouts",
  "/api/event-registrations",
  "/api/applications",
  "/api/visitor-count",
];
const publicContentUrlPaths = {
  bannerImage: "/api/banner-image",
  eventImage: "/api/event-image",
  rosterAvatar: "/api/roster-avatar",
};
const publicFunctionMethodContracts = {
  "/api/applications": ["POST"],
  "/api/community-shouts": ["GET", "POST"],
  "/api/event-registrations": ["POST"],
  "/api/visitor-count": ["GET", "POST"],
};

function extractFunctionRoute(relativePath, source) {
  const literalMatch = source.match(/path:\s*["']([^"']+)["']/);
  if (literalMatch) return literalMatch[1];

  const contentUrlMatch = source.match(/path:\s*PUBLIC_CONTENT_URLS\.([a-zA-Z0-9_]+)/);
  if (contentUrlMatch) {
    const route = publicContentUrlPaths[contentUrlMatch[1]];
    assert(route, `${relativePath} uses unknown PUBLIC_CONTENT_URLS key ${contentUrlMatch[1]}`);
    return route || null;
  }

  return null;
}

function extractComparedMethods(source) {
  return new Set(
    [...source.matchAll(/req\.method\s*(?:[!=]==?)\s*["']([A-Z]+)["']/g)].map((match) => match[1]),
  );
}

function assertPublicMethodContract(relativePath, source, route) {
  const allowedMethods = publicFunctionMethodContracts[route] || ["GET"];
  const comparedMethods = extractComparedMethods(source);

  for (const method of allowedMethods) {
    assert(comparedMethods.has(method), `${relativePath} must explicitly handle public ${method} requests`);
  }

  for (const method of comparedMethods) {
    assert(allowedMethods.includes(method), `${relativePath} must not handle public ${method} requests`);
  }

  assert(
    source.includes("methodNotAllowed") || source.includes("Method not allowed"),
    `${relativePath} must reject unsupported public methods`,
  );
}

const config = read(publicConfigPath);
assert(!config.includes("/api/admin-"), "public config.js must not expose admin endpoints");
assert(!config.includes("applyEndpoint"), "public config.js must not expose the old application admin endpoint key");
for (const endpoint of publicConfigEndpointLiterals) {
  assert(config.includes(endpoint), `public config.js must own public endpoint ${endpoint}`);
}
for (const endpoint of publicDeliveryEndpointLiterals) {
  assert(!config.includes(endpoint), "public config.js must not duplicate shared content delivery URLs");
}

for (const file of publicScripts) {
  const source = read(file);
  assert(!source.includes("/api/"), `${file} must read public API endpoints from public config.js`);
}

const adminConfig = read(adminConfigPath);
assert(adminConfig.includes("window.ADMIN_CONFIG"), "admin-config.js must define window.ADMIN_CONFIG");
assert(adminConfig.includes("/api/admin-"), "admin-config.js must own admin API endpoints");

const adminLoginHtml = read("admin-login.html");
assertOrdered(adminLoginHtml, `/${adminConfigPath}`, "/assets/js/admin/admin-login.js", "admin-login.html must load admin-config.js before admin-login.js");

const dashboardHtml = read("lg-dashboard.html");
assert(dashboardHtml.includes("/assets/js/shared/content-urls.js"), "lg-dashboard.html must load shared content URLs");
assert(
  dashboardHtml.includes("/assets/js/shared/roster-slideshow-settings.js"),
  "lg-dashboard.html must load shared roster slideshow settings",
);
assert(dashboardHtml.includes(`/${sharedSiteUtilsPath}`), "lg-dashboard.html must load shared site utilities");
assert(dashboardHtml.includes(`/${adminSharedPath}`), "lg-dashboard.html must load admin-shared.js");
for (const file of ["/assets/js/admin/admin-roster.js", "/assets/js/admin/admin-dashboard.js"]) {
  assertOrdered(dashboardHtml, `/${adminConfigPath}`, file, "lg-dashboard.html must load admin-config.js before admin dashboard scripts");
  assertOrdered(
    dashboardHtml,
    "/assets/js/shared/content-urls.js",
    file,
    "lg-dashboard.html must load shared content URLs before admin dashboard scripts",
  );
  assertOrdered(dashboardHtml, `/${sharedSiteUtilsPath}`, file, "lg-dashboard.html must load shared site utilities before admin dashboard scripts");
  assertOrdered(dashboardHtml, `/${adminSharedPath}`, file, "lg-dashboard.html must load admin-shared.js before admin dashboard scripts");
}
assertOrdered(
  dashboardHtml,
  "/assets/js/shared/roster-slideshow-settings.js",
  "/assets/js/admin/admin-roster.js",
  "lg-dashboard.html must load shared roster slideshow settings before admin-roster.js",
);

const publicFunctionFiles = [
  "applications.mjs",
  "banner-image.mjs",
  "community-shouts.mjs",
  "event-image.mjs",
  "event-registrations.mjs",
  "events.mjs",
  "news.mjs",
  "roster-avatar.mjs",
  "roster.mjs",
  "settings.mjs",
  "videos.mjs",
  "visitor-count.mjs",
  "twitch-status.mjs",
];

for (const file of publicFunctionFiles) {
  const relativePath = `netlify/functions/${file}`;
  const source = read(relativePath);
  assert(!source.includes("admin-auth.mjs"), `${relativePath} must not import admin auth`);
  assert(!source.includes("requireAdmin"), `${relativePath} must not call requireAdmin`);
}

const routedFunctionFiles = listFiles("netlify/functions", ".mjs").filter(
  (file) => !file.startsWith("netlify/functions/_shared/")
    && file !== "netlify/functions/admin-auth.mjs",
);
const adminAuthEndpointFiles = new Set(["admin-login.mjs", "admin-logout.mjs", "admin-session.mjs"]);
const functionRoutes = new Map();

for (const relativePath of routedFunctionFiles) {
  const source = read(relativePath);
  const fileName = path.basename(relativePath);
  const route = extractFunctionRoute(relativePath, source);

  assert(route, `${relativePath} must expose an explicit Netlify config.path`);
  if (!route) continue;

  assert(route.startsWith("/api/"), `${relativePath} must expose an /api/* route`);
  assert(!functionRoutes.has(route), `${relativePath} duplicates route ${route} from ${functionRoutes.get(route)}`);
  functionRoutes.set(route, relativePath);

  if (route.startsWith("/api/admin-")) {
    assert(fileName.startsWith("admin-"), `${relativePath} must use an admin-* filename for admin route ${route}`);
    assert(source.includes('from "./admin-auth.mjs"'), `${relativePath} must import admin auth`);
    if (!adminAuthEndpointFiles.has(fileName)) {
      assert(source.includes("requireAdmin(req)"), `${relativePath} must guard admin content requests with requireAdmin`);
    }
  } else {
    assert(!fileName.startsWith("admin-"), `${relativePath} must not use an admin-* filename for public route ${route}`);
    assert(!source.includes("admin-auth.mjs"), `${relativePath} must not import admin auth`);
    assert(!source.includes("requireAdmin"), `${relativePath} must not call requireAdmin`);
    assertPublicMethodContract(relativePath, source, route);
  }
}

const expectedPublicRoutes = [...publicConfigEndpointLiterals, ...publicDeliveryEndpointLiterals];
for (const route of expectedPublicRoutes) {
  assert(functionRoutes.has(route), `public route ${route} must be implemented by a Netlify function`);
}

for (const [route, relativePath] of functionRoutes.entries()) {
  if (route.startsWith("/api/admin-")) continue;
  assert(
    expectedPublicRoutes.includes(route),
    `${relativePath} exposes public route ${route}, which must be owned by public config.js or shared content-urls.js`,
  );
}

const publicAllowedSharedStoreImports = new Map([
  ["./_shared/applications-store.mjs", ["createApplication"]],
  ["./_shared/community-shouts-store.mjs", [
    "ALLOWED_SHOUT_TAGS",
    "MAX_SHOUT_MESSAGE_LENGTH",
    "MAX_SHOUT_NAME_LENGTH",
    "listApprovedShouts",
    "savePendingShout",
    "sanitizeText",
  ]],
  ["./_shared/event-registrations-store.mjs", ["createEventRegistration"]],
  ["./_shared/events-store.mjs", ["listEvents"]],
  ["./_shared/news-store.mjs", ["readNews"]],
  ["./_shared/roster-store.mjs", ["listRoster"]],
  ["./_shared/settings-store.mjs", ["readSettings"]],
  ["./_shared/videos-store.mjs", ["listVideos"]],
]);
const publicSubmissionRoutes = new Set(["/api/applications", "/api/community-shouts", "/api/event-registrations"]);

for (const [route, relativePath] of functionRoutes.entries()) {
  if (route.startsWith("/api/admin-")) continue;

  const source = read(relativePath);
  if (publicSubmissionRoutes.has(route)) {
    assert(!source.includes('from "@netlify/blobs"'), `${relativePath} must use public-safe shared store helpers`);
  }

  for (const [modulePath, allowedImports] of publicAllowedSharedStoreImports.entries()) {
    for (const importedName of extractNamedImports(source, modulePath)) {
      assert(
        allowedImports.includes(importedName),
        `${relativePath} must not import admin-capable ${importedName} from ${modulePath}`,
      );
    }
  }
}

const publicSettingsFunction = read("netlify/functions/settings.mjs");
assert(publicSettingsFunction.includes("PUBLIC_SETTINGS_KEYS"), "public settings function must whitelist public fields");
assert(
  !publicSettingsFunction.includes("jsonResponse(await readSettings())"),
  "public settings function must not expose the full settings object",
);

for (const relativePath of listFiles("netlify/functions/_shared", ".mjs")) {
  const source = read(relativePath);
  assert(!source.includes("admin-auth.mjs"), `${relativePath} must not import admin auth`);
  assert(!source.includes("requireAdmin"), `${relativePath} must not call requireAdmin`);
}

for (const file of ["roster.mjs", "admin-roster.mjs"]) {
  const relativePath = `netlify/functions/${file}`;
  assert(!read(relativePath).includes("DEFAULT_ROSTER"), `${relativePath} must use the shared roster store`);
}

for (const file of ["events.mjs", "admin-events.mjs"]) {
  const relativePath = `netlify/functions/${file}`;
  assert(!read(relativePath).includes("DEFAULT_EVENTS"), `${relativePath} must use the shared events store`);
}

const adminContentFunctions = [
  "admin-applications.mjs",
  "admin-banner-image.mjs",
  "admin-community-shouts.mjs",
  "admin-event-image.mjs",
  "admin-event-registrations.mjs",
  "admin-events.mjs",
  "admin-news.mjs",
  "admin-roster-avatar.mjs",
  "admin-roster.mjs",
  "admin-settings.mjs",
  "admin-videos.mjs",
];

for (const file of adminContentFunctions) {
  const relativePath = `netlify/functions/${file}`;
  const source = read(relativePath);
  assert(source.includes('from "./admin-auth.mjs"'), `${relativePath} must import admin auth`);
  assert(source.includes("requireAdmin(req)"), `${relativePath} must guard requests with requireAdmin`);
  assert(source.includes('path: "/api/admin-'), `${relativePath} must expose an /api/admin-* route`);
}

const publicContentEndpoints = [
  "applications",
  "banner-image",
  "community-shouts",
  "event-image",
  "event-registrations",
  "events",
  "news",
  "roster-avatar",
  "roster",
  "settings",
  "videos",
];
const adminEndpointConstantPattern = /const\s+[A-Z0-9_]+\s*=\s*['"]\/api\/([^'"]+)['"]/g;

for (const endpoint of publicContentEndpoints) {
  assert(!adminConfig.includes(`'/api/${endpoint}'`), `admin-config.js must not point admin APIs at public /api/${endpoint}`);
  assert(!adminConfig.includes(`"/api/${endpoint}"`), `admin-config.js must not point admin APIs at public /api/${endpoint}`);
}

for (const file of [adminSharedPath, ...adminBrowserFiles]) {
  const source = read(file);
  assert(!source.includes("/api/admin-"), `${file} must read admin endpoints from admin-config.js`);
  for (const endpoint of publicDeliveryEndpointLiterals) {
    assert(!source.includes(endpoint), `${file} must read public content delivery URLs from shared content-urls.js`);
  }
  let match;
  while ((match = adminEndpointConstantPattern.exec(source))) {
    const endpoint = match[1];
    if (publicContentEndpoints.includes(endpoint)) {
      failures.push(`${file} has admin API constant pointing at public /api/${endpoint}`);
    }
  }
}

const indexJs = read("assets/js/public/index.js");
assert(!/\bconst\s+\$+\s*=/.test(indexJs), "assets/js/public/index.js must not redeclare public DOM helpers");
assert(indexJs.includes("LG_CONTENT_URLS"), "assets/js/public/index.js must read public content delivery URLs from shared content-urls.js");
assert(indexJs.includes("LG_SITE_UTILS"), "assets/js/public/index.js must use shared site utilities");

const sharedContentUrls = read("assets/js/shared/content-urls.js");
for (const endpoint of publicDeliveryEndpointLiterals) {
  assert(sharedContentUrls.includes(endpoint), "shared content-urls.js must own public content delivery URL literals");
}

for (const file of listFiles("assets/js/shared", ".js")) {
  if (file === "assets/js/shared/content-urls.js") continue;
  assert(!read(file).includes("/api/"), `${file} must not own API endpoint literals`);
}

const sharedRosterSlideshowSettings = read("assets/js/shared/roster-slideshow-settings.js");
assert(
  sharedRosterSlideshowSettings.includes("window.LG_ROSTER_SLIDESHOW_SETTINGS"),
  "shared roster slideshow settings must expose LG_ROSTER_SLIDESHOW_SETTINGS",
);
assert(
  read("assets/js/public/roster-slideshow.js").includes("LG_ROSTER_SLIDESHOW_SETTINGS"),
  "public roster slideshow must use shared roster slideshow settings",
);
assert(
  read("assets/js/admin/admin-roster.js").includes("LG_ROSTER_SLIDESHOW_SETTINGS"),
  "admin roster must use shared roster slideshow settings",
);

const sharedSiteUtils = read(sharedSiteUtilsPath);
assert(sharedSiteUtils.includes("window.LG_SITE_UTILS"), "shared site utilities must expose LG_SITE_UTILS");
assert(sharedSiteUtils.includes("escapeHtml"), "shared site utilities must own HTML escaping");
assert(sharedSiteUtils.includes("getGameVariant"), "shared site utilities must own game variant mapping");

for (const file of [
  "assets/js/public/community-shouts.js",
  "assets/js/public/roster-slideshow.js",
  "assets/js/public/public-roster.js",
]) {
  const source = read(file);
  assert(source.includes("LG_SITE_UTILS"), `${file} must use shared site utilities`);
  assert(!source.includes("function escapeHtml"), `${file} must not redeclare HTML escaping`);
  assert(!source.includes("function escapeRosterHtml"), `${file} must not redeclare HTML escaping`);
}

const adminShared = read(adminSharedPath);
assert(adminShared.includes("window.ADMIN_UTILS"), "admin-shared.js must expose admin-only helpers");
assert(adminShared.includes("LG_SITE_UTILS"), "admin-shared.js must wrap shared site utilities for admin-only globals");
assert(!adminShared.includes("document.createElement"), "admin-shared.js must not own separate HTML escaping");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function escapeHtml"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function truncate"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function formatDate"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function getEventGameVariant"), "admin-dashboard.js must not own shared admin helpers");

const serverContentUrls = read("netlify/functions/_shared/content-urls.mjs");
for (const endpoint of publicDeliveryEndpointLiterals) {
  assert(serverContentUrls.includes(endpoint), "server shared content-urls.mjs must own public content delivery URL literals");
}

for (const file of [
  "netlify/functions/admin-banner-image.mjs",
  "netlify/functions/admin-event-image.mjs",
  "netlify/functions/admin-roster-avatar.mjs",
  "netlify/functions/banner-image.mjs",
  "netlify/functions/event-image.mjs",
  "netlify/functions/roster-avatar.mjs",
]) {
  const source = read(file);
  for (const endpoint of publicDeliveryEndpointLiterals) {
    assert(!source.includes(endpoint), `${file} must use shared content URL constants`);
  }
}

for (const file of listFiles("assets/js", ".js")) {
  if (file.startsWith("assets/js/admin/")) continue;
  const source = read(file);
  assert(!source.includes("/api/admin-"), `${file} must not call admin endpoints`);
  assert(!source.includes("admin-dashboard"), `${file} must not reference admin dashboard code`);
}

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.test === "node tools/check-boundaries.mjs", "npm test must run the boundary checker");

const netlifyToml = read("netlify.toml");
assert(netlifyToml.includes('command = "npm test"'), "Netlify build command must run npm test");

if (failures.length > 0) {
  console.error("Boundary check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Boundary check passed.");
