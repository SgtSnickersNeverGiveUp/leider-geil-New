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
  "assets/js/admin/homepage-content/index.js",
  "assets/js/admin/homepage-content/banner.js",
  "assets/js/admin/homepage-content/news-ticker.js",
  "assets/js/admin/homepage-content/roster-slideshow.js",
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
  "assets/js/admin/public-content/banner.js",
  "assets/js/admin/public-content/news-ticker.js",
  "assets/js/admin/public-content/roster-slideshow.js",
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
  await assertCssBoundaries();
  await assertAdminCoreBoundary();
  await assertAdminHomepageEditorBoundary();
  await assertAdminDashboardShellBoundary();
  await assertNetlifyFunctionBoundary();
  await assertPublicSettingsHelperBoundary();
  await assertSharedContentDataBoundary();
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
      "/assets/js/admin/public-content/",
      "SITE_CONFIG",
      'data-page="page-news"',
      'data-page="page-banner"',
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
    "/assets/js/admin/homepage-content/index.js",
    "/assets/js/admin/homepage-content/banner.js",
    "/assets/js/admin/homepage-content/news-ticker.js",
    "/assets/js/admin/homepage-content/roster-slideshow.js",
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

async function assertCssBoundaries() {
  const publicStylesPath = path.join(repoRoot, "assets/css/styles.css");
  const publicStyles = await readText(publicStylesPath);
  assertNotContains(publicStylesPath, publicStyles, [
    ".admin-",
    "admin-dashboard",
  ]);

  const adminStylesPath = path.join(repoRoot, "assets/css/admin-dashboard.css");
  const adminStyles = await readText(adminStylesPath);
  assertNotContains(adminStylesPath, adminStyles, [
    ".hero",
    ".navbar",
    ".site-header",
    ".site-footer",
    ".top-community",
    'data-page="page-news"',
    'data-page="page-banner"',
    ".roster-slideshow-admin",
    ".banner-preview-container",
    ".banner-tab-btn",
  ]);
}

async function assertAdminCoreBoundary() {
  for (const file of adminCoreJsFiles) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, [
      "SITE_CONFIG",
      "/assets/js/public/",
      "/assets/js/admin/public-content/",
      "/api/public-settings",
      "/api/event-image",
      "/api/banner-image",
      "/api/roster-avatar",
      "LGAdminPublic",
      "publicContentSettingsApi",
      "publicEventImageApi",
      "publicBannerImageApi",
      "publicRosterAvatarApi",
    ]);
  }
}

async function assertAdminDashboardShellBoundary() {
  const dashboardPath = path.join(repoRoot, "assets/js/admin/dashboard.js");
  const dashboard = await readText(dashboardPath);
  assertNotContains(dashboardPath, dashboard, [
    "LGAdminHomepage",
    "loadHomepage",
    "homepage-content",
    "page-homepage-content",
    "page-news",
    "page-banner",
  ]);
}

async function assertAdminHomepageEditorBoundary() {
  const dashboardHtmlPath = path.join(repoRoot, "lg-dashboard.html");
  const dashboardHtml = await readText(dashboardHtmlPath);
  assertNotContains(dashboardHtmlPath, dashboardHtml, [
    'id="roster-slideshow-',
    'id="ticker-',
    'id="news-',
    'id="banner-',
    'class="roster-slideshow-admin',
    'class="banner-tab',
    'class="banner-preview',
  ]);

  const homepageEditorFiles = [
    "assets/js/admin/homepage-content/index.js",
    "assets/js/admin/homepage-content/banner.js",
    "assets/js/admin/homepage-content/news-ticker.js",
    "assets/js/admin/homepage-content/roster-slideshow.js",
  ];

  for (const file of homepageEditorFiles) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, [
      "document.getElementById('roster-slideshow",
      'id="roster-slideshow-',
      "document.getElementById('ticker-",
      'id="ticker-',
      "document.getElementById('news-",
      'id="news-',
      "document.getElementById('banner-",
      'id="banner-',
      ".banner-tab-btn",
      "roster-slideshow-admin",
      "data-slideshow-",
      "data-news-remove",
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
    "./admin-public-settings-data.mjs",
    "sanitizePublicContentSettingsPatch",
    "mergePublicContentSettings",
  ]);

  const adminSettingsHelperPath = path.join(repoRoot, "netlify/functions/_shared/admin-public-settings-data.mjs");
  const adminSettingsHelper = await readText(adminSettingsHelperPath);
  assertNotContains(adminSettingsHelperPath, adminSettingsHelper, [
    "./public-settings-data.mjs",
    "pickPublicSettings",
    "toPublicRosterSlideshow",
  ]);

  const settingsSchemaPath = path.join(repoRoot, "netlify/functions/_shared/public-content-settings-schema.mjs");
  const settingsSchema = await readText(settingsSchemaPath);
  assertNotContains(settingsSchemaPath, settingsSchema, [
    "pickPublicSettings",
    "pickAdminPublicContentSettings",
    "sanitizePublicContentSettingsPatch",
    "mergePublicContentSettings",
    "toPublicRosterSlideshow",
  ]);
}

async function assertSharedContentDataBoundary() {
  const files = [
    {
      file: "netlify/functions/_shared/news-data.mjs",
      forbidden: ["writeNews", "toPublicNewsItem"],
    },
    {
      file: "netlify/functions/_shared/videos-data.mjs",
      forbidden: ["buildVideoData", "toPublicVideo"],
    },
    {
      file: "netlify/functions/_shared/admin-news-data.mjs",
      forbidden: ["toPublicNewsItem"],
    },
    {
      file: "netlify/functions/_shared/admin-videos-data.mjs",
      forbidden: ["toPublicVideo"],
    },
    {
      file: "netlify/functions/_shared/public-news-data.mjs",
      forbidden: ["writeNews", "requireAdmin"],
    },
    {
      file: "netlify/functions/_shared/public-videos-data.mjs",
      forbidden: ["buildVideoData", "requireAdmin"],
    },
  ];

  for (const { file, forbidden } of files) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, forbidden);
  }
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
