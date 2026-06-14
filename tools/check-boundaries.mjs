import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const failures = [];

const publicHtmlFiles = [
  "index.html",
  "bewerben.html",
  "event-anmeldung.html",
  "impressum.html",
];

const adminHtmlFiles = [
  "lg-dashboard.html",
  "admin-login.html",
];

const adminCoreJsFiles = [
  "assets/js/admin/config.js",
  "assets/js/admin/dashboard.js",
  "assets/js/admin/login.js",
  "assets/js/admin/roster.js",
  "assets/js/admin/public-content/banner.js",
  "assets/js/admin/public-content/news-ticker.js",
  "assets/js/admin/public-content/roster-slideshow.js",
];

const removedFiles = [
  "assets/data/events.json",
  "assets/data/news.json",
  "assets/data/roster.json",
  "assets/js/admin-dashboard.js",
  "assets/js/admin-login.js",
  "assets/js/admin-roster.js",
  "assets/js/clan-news-ticker.js",
  "assets/js/community-shouts.js",
  "assets/js/public-roster.js",
  "assets/js/roster-slideshow.js",
  "assets/js/script.js",
  "config.js",
  "netlify/functions/admin-settings.mjs",
  "netlify/functions/settings.mjs",
  "netlify/functions/_shared/settings-data.mjs",
];

async function main() {
  await assertAssetsJsLayout();
  await assertPublicJsBoundary();
  await assertHtmlBoundaries();
  await assertHtmlScriptReferences();
  await assertAdminCoreBoundary();
  await assertNetlifyFunctionBoundary();
  await assertPublicSettingsHelperBoundary();
  await assertRemovedFilesStayRemoved();

  if (failures.length > 0) {
    console.error("Boundary checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Boundary checks passed.");
}

async function assertAssetsJsLayout() {
  const jsRoot = path.join(repoRoot, "assets/js");
  const jsRootFiles = (await listFiles(jsRoot))
    .filter((file) => path.dirname(file) === jsRoot);

  for (const file of jsRootFiles) {
    failures.push(`${path.relative(repoRoot, file)}: browser code must live under assets/js/public or assets/js/admin`);
  }
}

async function assertPublicJsBoundary() {
  const files = await listFiles(path.join(repoRoot, "assets/js/public"));
  for (const file of files) {
    const content = await readText(file);
    assertNotContains(file, content, [
      "/api/admin",
      "LG_ADMIN",
      "LGAdmin",
      "assets/js/admin",
    ]);
  }
}

async function assertHtmlBoundaries() {
  for (const file of publicHtmlFiles) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, [
      "/assets/js/admin/",
      "/assets/css/admin-dashboard.css",
      "/api/admin",
      "LG_ADMIN",
      "LGAdmin",
    ]);
  }

  for (const file of adminHtmlFiles) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, [
      "/assets/js/public/",
      "/assets/css/styles.css",
      "SITE_CONFIG",
    ]);
  }
}

async function assertHtmlScriptReferences() {
  const publicScriptAllowList = new Set([
    "/assets/js/public/application-form.js",
    "/assets/js/public/clan-news-ticker.js",
    "/assets/js/public/community-shouts.js",
    "/assets/js/public/config.js",
    "/assets/js/public/event-signup-form.js",
    "/assets/js/public/index.js",
    "/assets/js/public/nav.js",
    "/assets/js/public/roster.js",
    "/assets/js/public/roster-slideshow.js",
  ]);
  const adminScriptAllowList = new Set([
    "/assets/js/admin/config.js",
    "/assets/js/admin/dashboard.js",
    "/assets/js/admin/login.js",
    "/assets/js/admin/roster.js",
    "/assets/js/admin/public-content/banner.js",
    "/assets/js/admin/public-content/news-ticker.js",
    "/assets/js/admin/public-content/roster-slideshow.js",
  ]);

  for (const file of publicHtmlFiles) {
    const scriptSources = extractScriptSources(await readText(path.join(repoRoot, file)));
    for (const scriptSource of scriptSources) {
      if (!publicScriptAllowList.has(scriptSource)) {
        failures.push(`${file}: public page must not load ${JSON.stringify(scriptSource)}`);
      }
    }
  }

  for (const file of adminHtmlFiles) {
    const scriptSources = extractScriptSources(await readText(path.join(repoRoot, file)));
    for (const scriptSource of scriptSources) {
      if (!adminScriptAllowList.has(scriptSource)) {
        failures.push(`${file}: admin page must not load ${JSON.stringify(scriptSource)}`);
      }
    }
  }
}

async function assertAdminCoreBoundary() {
  for (const file of adminCoreJsFiles) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, [
      "SITE_CONFIG",
      "/assets/js/public/",
      "/api/public-settings",
    ]);
  }
}

async function assertNetlifyFunctionBoundary() {
  const functionsDir = path.join(repoRoot, "netlify/functions");
  const files = await listFiles(functionsDir);

  for (const file of files.filter((item) => item.endsWith(".mjs"))) {
    const relative = path.relative(repoRoot, file);
    const content = await readText(file);

    if (relative.includes("_shared/")) continue;
    if (relative.startsWith("netlify/functions/admin-")) continue;

    assertNotContains(file, content, [
      "requireAdmin",
      "./admin-auth.mjs",
    ]);
  }

  const publicSettings = await readText(path.join(repoRoot, "netlify/functions/public-settings.mjs"));
  assertNotContains(path.join(repoRoot, "netlify/functions/public-settings.mjs"), publicSettings, [
    "admin-public-settings-data.mjs",
    "pickAdminPublicContentSettings",
    "sanitizePublicContentSettingsPatch",
  ]);

  const adminPublicSettings = await readText(path.join(repoRoot, "netlify/functions/admin-public-settings.mjs"));
  assertNotContains(path.join(repoRoot, "netlify/functions/admin-public-settings.mjs"), adminPublicSettings, [
    'path: "/api/admin/settings"',
    "./_shared/public-settings-data.mjs",
  ]);
}

async function assertPublicSettingsHelperBoundary() {
  const publicSettingsHelperPath = path.join(repoRoot, "netlify/functions/_shared/public-settings-data.mjs");
  const publicSettingsHelper = await readText(publicSettingsHelperPath);
  assertNotContains(publicSettingsHelperPath, publicSettingsHelper, [
    "Admin",
    "sanitizePublicContentSettingsPatch",
    "mergePublicContentSettings",
  ]);

  const adminSettingsHelperPath = path.join(repoRoot, "netlify/functions/_shared/admin-public-settings-data.mjs");
  const adminSettingsHelper = await readText(adminSettingsHelperPath);
  assertNotContains(adminSettingsHelperPath, adminSettingsHelper, [
    "pickPublicSettings",
    "toPublicRosterSlideshow",
  ]);
}

async function assertRemovedFilesStayRemoved() {
  for (const file of removedFiles) {
    try {
      await readText(path.join(repoRoot, file));
      failures.push(`${file}: removed mixed-boundary file exists again`);
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    if (entry.isFile()) return entryPath;
    return [];
  }));
  return files.flat();
}

async function readText(file) {
  return readFile(file, "utf8");
}

function assertNotContains(file, content, forbiddenValues) {
  const relative = path.relative(repoRoot, file);
  for (const forbiddenValue of forbiddenValues) {
    if (content.includes(forbiddenValue)) {
      failures.push(`${relative}: must not contain ${JSON.stringify(forbiddenValue)}`);
    }
  }
}

function extractScriptSources(content) {
  return [...content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
