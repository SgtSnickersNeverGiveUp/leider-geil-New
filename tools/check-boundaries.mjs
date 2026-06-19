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

for (const file of publicHtml) {
  const html = read(file);
  assert(!html.includes("assets/css/admin-dashboard.css"), `${file} must not load admin CSS`);
  assert(!html.includes("assets/js/admin"), `${file} must not load admin JS`);
  assert(!html.includes("admin-dashboard.js"), `${file} must not load admin dashboard JS`);
  assert(!html.includes("admin-login.js"), `${file} must not load admin login JS`);
  assert(!html.includes("admin-config.js"), `${file} must not load admin config JS`);
}

for (const file of adminHtml) {
  const html = read(file);
  assert(html.includes("/assets/js/admin-config.js"), `${file} must load admin config JS`);
  assert(!html.includes("assets/css/styles.css"), `${file} must not load public CSS`);
  assert(!html.includes("assets/js/public-core.js"), `${file} must not load public core JS`);
  assert(!html.includes("assets/js/index.js"), `${file} must not load index JS`);
  assert(!html.includes("assets/js/recruit-form.js"), `${file} must not load recruit form JS`);
  assert(!html.includes("assets/js/event-signup.js"), `${file} must not load event signup JS`);
  assert(!html.includes("assets/js/script.js"), `${file} must not load legacy public script.js`);
}

const publicBrowserFiles = listFiles("assets/js", ".js")
  .filter((file) => !file.startsWith("assets/js/admin-"));
const publicScriptsRequiringConfig = publicBrowserFiles
  .filter((file) => read(file).includes("SITE_CONFIG"));

for (const htmlFile of publicHtml) {
  const html = read(htmlFile);
  for (const scriptFile of publicScriptsRequiringConfig) {
    if (!html.includes(scriptFile)) continue;
    assert(html.includes("config.js"), `${htmlFile} must load public config.js before ${scriptFile}`);
    assert(
      html.indexOf("config.js") < html.indexOf(scriptFile),
      `${htmlFile} must load public config.js before ${scriptFile}`,
    );
  }
}

assert(!existsSync(path.join(root, "assets/js/script.js")), "legacy assets/js/script.js must stay removed");

const config = read("config.js");
assert(!config.includes("/api/admin-"), "public config.js must not expose admin endpoints");
assert(!config.includes("applyEndpoint"), "public config.js must not expose the old application admin endpoint key");

const publicEndpointConfigKeys = [
  "applicationsApi",
  "bannerImageApi",
  "communityShoutsApi",
  "eventImageApi",
  "eventRegistrationsApi",
  "eventsApi",
  "newsApi",
  "rosterAvatarApi",
  "rosterApi",
  "settingsApi",
  "twitchStatusApi",
  "videosApi",
  "visitorCounterApi",
];
for (const key of publicEndpointConfigKeys) {
  assert(config.includes(`${key}: "/api/`), `config.js must own public endpoint ${key}`);
}

const adminConfig = read("assets/js/admin-config.js");
assert(adminConfig.includes("window.ADMIN_CONFIG"), "admin-config.js must define window.ADMIN_CONFIG");
assert(adminConfig.includes("/api/admin-"), "admin-config.js must own admin API endpoints");
assert(adminConfig.includes("publicAssetUrls"), "admin-config.js must document public asset URLs used by admin previews");

const adminLoginHtml = read("admin-login.html");
assert(
  adminLoginHtml.indexOf("/assets/js/admin-config.js") < adminLoginHtml.indexOf("/assets/js/admin-login.js"),
  "admin-login.html must load admin-config.js before admin-login.js",
);

const dashboardHtml = read("lg-dashboard.html");
assert(
  dashboardHtml.indexOf("/assets/js/admin-config.js") < dashboardHtml.indexOf("/assets/js/admin-roster.js")
    && dashboardHtml.indexOf("/assets/js/admin-config.js") < dashboardHtml.indexOf("/assets/js/admin-dashboard.js"),
  "lg-dashboard.html must load admin-config.js before admin dashboard scripts",
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

const adminBrowserFiles = ["assets/js/admin-dashboard.js", "assets/js/admin-roster.js", "assets/js/admin-login.js"];

for (const file of adminBrowserFiles) {
  const source = read(file);
  assert(!source.includes("/api/"), `${file} must read all API endpoints from admin-config.js`);
}

const indexJs = read("assets/js/index.js");
assert(!/\bconst\s+\$+\s*=/.test(indexJs), "assets/js/index.js must not redeclare public DOM helpers");

for (const file of publicBrowserFiles) {
  const source = read(file);
  assert(!source.includes("/api/"), `${file} must read public endpoints from config.js`);
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
