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

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
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

function assertLoadsBefore(html, earlier, later, file) {
  assert(html.includes(earlier), `${file} must load ${earlier}`);
  assert(html.includes(later), `${file} must load ${later}`);
  assert(
    html.indexOf(earlier) < html.indexOf(later),
    `${file} must load ${earlier} before ${later}`,
  );
}

function assertNoApiLiterals(source, file, allowedEndpoints = []) {
  const allowed = new Set(allowedEndpoints);
  const apiLiteralPattern = /["']\/api\/([^"']+)["']/g;
  let match;
  while ((match = apiLiteralPattern.exec(source))) {
    const endpoint = `/api/${match[1]}`;
    assert(allowed.has(endpoint), `${file} must not own API endpoint literal ${endpoint}`);
  }
}

const publicHtml = ["index.html", "bewerben.html", "event-anmeldung.html", "impressum.html"];
const adminHtml = ["admin-login.html", "lg-dashboard.html"];
const publicCssPath = "assets/css/public/styles.css";
const adminCssPath = "/assets/css/admin/dashboard.css";
const publicConfigPath = "assets/js/public/config.js";
const adminConfigPath = "/assets/js/admin/admin-config.js";
const sharedContentUrlsPath = "assets/js/shared/content-urls.js";
const sharedRosterSlideshowPath = "assets/js/shared/roster-slideshow-settings.js";

for (const file of publicHtml) {
  const html = read(file);
  assert(html.includes(publicCssPath), `${file} must load public CSS from assets/css/public`);
  assert(!html.includes("assets/css/admin/") && !html.includes("/assets/css/admin/"), `${file} must not load admin CSS`);
  assert(!html.includes("assets/js/admin/") && !html.includes("/assets/js/admin/"), `${file} must not load admin JS`);
  assert(!html.includes("admin-dashboard.js"), `${file} must not load admin dashboard JS`);
  assert(!html.includes("admin-login.js"), `${file} must not load admin login JS`);
  assert(!html.includes("admin-config.js"), `${file} must not load admin config JS`);
}

for (const file of adminHtml) {
  const html = read(file);
  assert(html.includes(adminCssPath), `${file} must load admin CSS from assets/css/admin`);
  assert(html.includes(adminConfigPath), `${file} must load admin config JS`);
  assert(!html.includes(publicCssPath), `${file} must not load public CSS`);
  assert(!html.includes("assets/js/public/") && !html.includes("/assets/js/public/"), `${file} must not load public JS`);
  assert(!html.includes("assets/js/script.js"), `${file} must not load legacy public script.js`);
}

for (const removedPath of [
  "config.js",
  "assets/js/script.js",
  "assets/css/styles.css",
  "assets/css/admin-dashboard.css",
]) {
  assert(!exists(removedPath), `${removedPath} must stay removed from the mixed/root asset surface`);
}

for (const entry of readdirSync(path.join(root, "assets/js"))) {
  const fullPath = path.join(root, "assets/js", entry);
  const stat = statSync(fullPath);
  assert(stat.isDirectory(), `assets/js/${entry} must live inside public, admin, or shared`);
  if (stat.isDirectory()) {
    assert(["public", "admin", "shared"].includes(entry), `assets/js/${entry} is not an allowed browser code boundary`);
  }
}

for (const entry of readdirSync(path.join(root, "assets/css"))) {
  const fullPath = path.join(root, "assets/css", entry);
  const stat = statSync(fullPath);
  assert(stat.isDirectory(), `assets/css/${entry} must live inside public or admin`);
  if (stat.isDirectory()) {
    assert(["public", "admin"].includes(entry), `assets/css/${entry} is not an allowed stylesheet boundary`);
  }
}

const indexHtml = read("index.html");
assertLoadsBefore(indexHtml, publicConfigPath, "assets/js/public/index.js", "index.html");
assertLoadsBefore(indexHtml, sharedContentUrlsPath, "assets/js/public/index.js", "index.html");
assertLoadsBefore(indexHtml, sharedRosterSlideshowPath, "assets/js/public/roster-slideshow.js", "index.html");

for (const [file, script] of [
  ["bewerben.html", "assets/js/public/recruit-form.js"],
  ["event-anmeldung.html", "assets/js/public/event-signup.js"],
]) {
  assertLoadsBefore(read(file), publicConfigPath, script, file);
}

const publicConfig = read(publicConfigPath);
assert(!publicConfig.includes("/api/admin-"), "public config.js must not expose admin endpoints");
assert(!publicConfig.includes("applyEndpoint"), "public config.js must not expose the old application admin endpoint key");
assert(!publicConfig.includes("rosterPath"), "public config.js must not expose static roster fallback paths");

const publicDeliveryEndpointLiterals = ["/api/banner-image", "/api/event-image", "/api/roster-avatar"];
for (const endpoint of publicDeliveryEndpointLiterals) {
  assert(!publicConfig.includes(endpoint), "public config.js must not own public content delivery URL literals");
}

const adminConfig = read("assets/js/admin/admin-config.js");
assert(adminConfig.includes("window.ADMIN_CONFIG"), "admin-config.js must define window.ADMIN_CONFIG");
assert(adminConfig.includes("/api/admin-"), "admin-config.js must own admin API endpoints");

const adminLoginHtml = read("admin-login.html");
assertLoadsBefore(adminLoginHtml, adminConfigPath, "/assets/js/admin/admin-login.js", "admin-login.html");

const dashboardHtml = read("lg-dashboard.html");
assert(dashboardHtml.includes("/assets/js/shared/content-urls.js"), "lg-dashboard.html must load shared content URLs");
assert(dashboardHtml.includes("/assets/js/shared/roster-slideshow-settings.js"), "lg-dashboard.html must load shared roster slideshow settings");
assert(dashboardHtml.includes("/assets/js/admin/admin-shared.js"), "lg-dashboard.html must load admin-shared.js");
assertLoadsBefore(dashboardHtml, adminConfigPath, "/assets/js/admin/admin-roster.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, adminConfigPath, "/assets/js/admin/admin-dashboard.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, "/assets/js/shared/content-urls.js", "/assets/js/admin/admin-roster.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, "/assets/js/shared/content-urls.js", "/assets/js/admin/admin-dashboard.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, "/assets/js/shared/roster-slideshow-settings.js", "/assets/js/admin/admin-roster.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, "/assets/js/admin/admin-shared.js", "/assets/js/admin/admin-roster.js", "lg-dashboard.html");
assertLoadsBefore(dashboardHtml, "/assets/js/admin/admin-shared.js", "/assets/js/admin/admin-dashboard.js", "lg-dashboard.html");

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

const discordFormHook = read("netlify/functions/discord-form-hook.js");
assert(!discordFormHook.includes("admin-auth.mjs"), "netlify/functions/discord-form-hook.js must not import admin auth");
assert(!discordFormHook.includes("requireAdmin"), "netlify/functions/discord-form-hook.js must not call requireAdmin");

const publicDtoFunctionRequirements = {
  "settings.mjs": "toPublicSettings",
  "roster.mjs": "toPublicRosterMember",
  "events.mjs": "toPublicEvent",
  "news.mjs": "toPublicNewsItem",
  "videos.mjs": "toPublicVideo",
};
const rawPublicResponsePattern = /jsonResponse\(\s*(?:await\s+)?(?:readSettings|readNews|listRoster|listEvents|listVideos)\(|jsonResponse\(\s*(?:members|events|videos|news|settings)\s*\)/;

for (const [file, mapper] of Object.entries(publicDtoFunctionRequirements)) {
  const relativePath = `netlify/functions/${file}`;
  const source = read(relativePath);
  assert(source.includes('from "./_shared/public-dtos.mjs"'), `${relativePath} must import public DTO mappers`);
  assert(source.includes(mapper), `${relativePath} must map store data through ${mapper}`);
  assert(!rawPublicResponsePattern.test(source), `${relativePath} must not return raw store data`);
}

const publicDtos = read("netlify/functions/_shared/public-dtos.mjs");
assert(publicDtos.includes("PUBLIC_SETTINGS_KEYS"), "public DTOs must whitelist public settings fields");
for (const privateField of ["stats", "createdAt", "updatedAt", "email", "approved"]) {
  assert(!new RegExp(`\\b${privateField}\\b`).test(publicDtos), `public DTOs must not expose ${privateField}`);
}

assert(!read("assets/data/roster.json").includes('"stats"'), "public roster fallback data must not expose stats");

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

const adminAuthFunctions = ["admin-auth.mjs", "admin-login.mjs", "admin-logout.mjs", "admin-session.mjs"];
for (const file of adminAuthFunctions) {
  const relativePath = `netlify/functions/${file}`;
  const source = read(relativePath);
  assert(source.includes('path: "/api/admin-') || file === "admin-auth.mjs", `${relativePath} must expose an /api/admin-* auth route`);
}

const adminBrowserFiles = [
  "assets/js/admin/admin-dashboard.js",
  "assets/js/admin/admin-roster.js",
  "assets/js/admin/admin-login.js",
];
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

for (const file of adminBrowserFiles) {
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

const sharedContentUrls = read("assets/js/shared/content-urls.js");
for (const endpoint of publicDeliveryEndpointLiterals) {
  assert(sharedContentUrls.includes(endpoint), "shared content-urls.js must own public content delivery URL literals");
}
assertNoApiLiterals(sharedContentUrls, "assets/js/shared/content-urls.js", publicDeliveryEndpointLiterals);

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

const adminShared = read("assets/js/admin/admin-shared.js");
assert(adminShared.includes("window.ADMIN_UTILS"), "admin-shared.js must expose admin-only helpers");
for (const helper of ["escapeHtml", "truncate", "formatDate", "getEventGameVariant"]) {
  assert(!adminShared.includes(`window.${helper} =`), `admin-shared.js must not expose window.${helper}`);
}
assert(read("assets/js/admin/admin-dashboard.js").includes("window.ADMIN_UTILS"), "admin-dashboard.js must read helpers from ADMIN_UTILS");
assert(read("assets/js/admin/admin-roster.js").includes("window.ADMIN_UTILS"), "admin-roster.js must read helpers from ADMIN_UTILS");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function escapeHtml"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function truncate"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function formatDate"), "admin-dashboard.js must not own shared admin helpers");
assert(!read("assets/js/admin/admin-dashboard.js").includes("function getEventGameVariant"), "admin-dashboard.js must not own shared admin helpers");

const adminCss = read("assets/css/admin/dashboard.css");
assert(!adminCss.includes(".btn-sm"), "admin CSS must use admin-prefixed small button classes");
assert(!adminCss.includes(".btn-delete"), "admin CSS must use admin-prefixed delete button classes");
assert(adminCss.includes(".admin-btn-sm"), "admin CSS must define admin-prefixed small buttons");
assert(adminCss.includes(".admin-btn-delete"), "admin CSS must define admin-prefixed delete buttons");

for (const file of ["lg-dashboard.html", "assets/js/admin/admin-dashboard.js", "assets/js/admin/admin-roster.js"]) {
  const source = read(file);
  assert(!/(^|["'`\s])btn-sm(["'`\s]|$)/.test(source), `${file} must not use public btn-sm utility class`);
  assert(!/(^|["'`\s])btn-delete(["'`\s]|$)/.test(source), `${file} must not use public btn-delete utility class`);
}

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

for (const file of listFiles("assets/js/public", ".js")) {
  const source = read(file);
  assert(!source.includes("/api/admin-"), `${file} must not call admin endpoints`);
  assert(!source.includes("ADMIN_CONFIG"), `${file} must not read admin config`);
  assert(!source.includes("ADMIN_UTILS"), `${file} must not read admin helpers`);
  assert(!source.includes("admin-dashboard"), `${file} must not reference admin dashboard code`);
  assert(!source.includes("DISCORD_WEBHOOK_"), `${file} must not expose direct Discord webhook hooks`);
  if (file !== publicConfigPath) {
    assertNoApiLiterals(source, file);
  }
}

for (const file of listFiles("assets/js/shared", ".js")) {
  const source = read(file);
  assert(!source.includes("/api/admin-"), `${file} must not call admin endpoints`);
  assert(!source.includes("ADMIN_CONFIG"), `${file} must not read admin config`);
  assert(!source.includes("ADMIN_UTILS"), `${file} must not read admin helpers`);
  assert(!source.includes("SITE_CONFIG"), `${file} must not read public config`);
}

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.main === publicConfigPath, "package.json main must point at the public config path");
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
