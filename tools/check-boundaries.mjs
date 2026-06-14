import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const failures = [];

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
  "assets/js/admin/homepage-content/index.js",
  "assets/js/script.js",
  "config.js",
  "netlify/functions/admin-settings.mjs",
  "netlify/functions/admin-public-settings.mjs",
  "netlify/functions/settings.mjs",
  "netlify/functions/_shared/admin-public-settings-data.mjs",
  "netlify/functions/_shared/settings-data.mjs",
  "netlify/functions/_shared/public-content-settings-schema.mjs",
  "netlify/functions/_shared/media-url-contract.mjs",
];

const ignoredDirectories = new Set([
  ".git",
  ".netlify",
  "node_modules",
]);

const adminHtmlEntries = new Set([
  "admin-login.html",
  "lg-dashboard.html",
]);

const sharedStylesheetAllowList = new Set([
  "/assets/css/tokens.css",
]);

const publicStylesheetAllowList = new Set([
  ...sharedStylesheetAllowList,
  "/assets/css/styles.css",
]);

const adminStylesheetAllowList = new Set([
  ...sharedStylesheetAllowList,
  "/assets/css/admin-dashboard.css",
]);

const publicHandlerProjectionImports = [
  {
    storeImport: "./_shared/news-data.mjs",
    projectionImport: "./_shared/public-news-data.mjs",
  },
  {
    storeImport: "./_shared/videos-data.mjs",
    projectionImport: "./_shared/public-videos-data.mjs",
  },
  {
    storeImport: "./_shared/events-data.mjs",
    projectionImport: "./_shared/public-events-data.mjs",
  },
  {
    storeImport: "./_shared/roster-data.mjs",
    projectionImport: "./_shared/public-roster-data.mjs",
  },
  {
    storeImport: "./_shared/community-shouts-data.mjs",
    projectionImport: "./_shared/public-community-shouts-data.mjs",
  },
];

const adminHandlerProjectionImports = [
  {
    storeImport: "./_shared/news-data.mjs",
    projectionImport: "./_shared/admin-news-data.mjs",
    projectionSymbol: "toAdminNewsItem",
  },
  {
    storeImport: "./_shared/videos-data.mjs",
    projectionImport: "./_shared/admin-videos-data.mjs",
    projectionSymbol: "toAdminVideo",
  },
  {
    storeImport: "./_shared/events-data.mjs",
    projectionImport: "./_shared/admin-events-data.mjs",
    projectionSymbol: "toAdminEvent",
  },
  {
    storeImport: "./_shared/roster-data.mjs",
    projectionImport: "./_shared/admin-roster-data.mjs",
    projectionSymbol: "toAdminRosterMember",
  },
  {
    storeImport: "./_shared/community-shouts-data.mjs",
    projectionImport: "./_shared/admin-community-shouts-data.mjs",
    projectionSymbol: "toAdminCommunityShout",
  },
  {
    storeImport: "./_shared/applications-data.mjs",
    projectionImport: "./_shared/admin-applications-data.mjs",
    projectionSymbol: "toAdminApplication",
  },
  {
    storeImport: "./_shared/event-registrations-data.mjs",
    projectionImport: "./_shared/admin-event-registrations-data.mjs",
    projectionSymbol: "toAdminEventRegistration",
  },
];

async function main() {
  const htmlBoundaryFiles = await discoverHtmlBoundaryFiles();

  await assertAssetsJsLayout();
  await assertPublicJsBoundary();
  await assertPublicAssetBoundary();
  await assertPublicBrowserMarkupBoundary();
  await assertHtmlBoundaries(htmlBoundaryFiles);
  await assertHtmlScriptReferences(htmlBoundaryFiles);
  await assertHtmlStylesheetReferences(htmlBoundaryFiles);
  await assertHtmlInlineBehaviorBoundary(htmlBoundaryFiles);
  await assertCssBoundaries();
  await assertAdminCoreBoundary();
  await assertAdminMediaPreviewBoundary();
  await assertServerMediaContractBoundary();
  await assertAdminHomepageEditorBoundary();
  await assertAdminDashboardShellBoundary();
  await assertNetlifyFunctionBoundary();
  await assertSharedImportBoundary();
  await assertNetlifyBuildBoundary();
  await assertNetlifyRoutingBoundary();
  await assertEdgeFunctionBoundary();
  await assertPublicIndexProjectionBoundary();
  await assertPublicSettingsHelperBoundary();
  await assertSharedContentDataBoundary();
  await assertPublicWriteHandlerBoundary();
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

async function discoverHtmlBoundaryFiles() {
  const htmlFiles = (await listFiles(repoRoot))
    .filter((file) => file.endsWith(".html"))
    .sort();

  return Promise.all(htmlFiles.map(async (file) => {
    const content = await readText(file);
    const relative = path.relative(repoRoot, file);
    const boundary = isAdminHtml(relative) ? "admin" : "public";
    return { file, relative, boundary, content };
  }));
}

function isAdminHtml(relative) {
  return adminHtmlEntries.has(relative);
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
    assertApiPathsMatchBoundary(file, content, "public");
    assertNotContains(file, content, [
      "/api/admin",
      "LG_ADMIN",
      "LGAdmin",
      "assets/js/admin",
    ]);
  }
}

async function assertPublicAssetBoundary() {
  const publicJsFiles = await listFiles(path.join(repoRoot, "assets/js/public"));
  for (const file of publicJsFiles.filter((item) => item.endsWith(".js"))) {
    const content = await readText(file);
    if (/(^|["'`])assets\//.test(content)) {
      failures.push(`${path.relative(repoRoot, file)}: public assets must use root-relative /assets/... paths`);
    }
  }

  const files = await listFiles(repoRoot);
  for (const file of files.filter((item) => /\.(?:css|html|js|mjs)$/.test(item))) {
    const content = await readText(file);
    for (const assetPath of extractAssetImageReferences(content)) {
      await assertFileExists(file, assetPath);
    }
  }
}

async function assertPublicBrowserMarkupBoundary() {
  const publicJsFiles = await listFiles(path.join(repoRoot, "assets/js/public"));
  for (const file of publicJsFiles.filter((item) => item.endsWith(".js"))) {
    const content = await readText(file);
    const relative = path.relative(repoRoot, file);

    if (/<[^>]*\son[a-z]+\s*=/i.test(content)) {
      failures.push(`${relative}: public browser markup must not generate inline event handlers`);
    }
    assertNoPropertyEventHandlers(file, content, "public");

    assertNotContains(file, content, [
      "admin-",
      "admin-homepage-",
      "data-admin-",
    ]);
  }
}

async function assertHtmlBoundaries(htmlBoundaryFiles) {
  for (const { file, content, boundary } of htmlBoundaryFiles) {
    if (boundary !== "public") continue;

    assertNotContains(file, content, [
      "/assets/js/admin/",
      "/assets/css/admin-dashboard.css",
      "/api/admin",
      "LG_ADMIN",
      "LGAdmin",
    ]);
  }

  for (const { file, content, boundary } of htmlBoundaryFiles) {
    if (boundary !== "admin") continue;

    assertNotContains(file, content, [
      "/assets/js/public/",
      "/assets/css/styles.css",
      "/assets/js/admin/public-content/",
      "SITE_CONFIG",
      'data-page="page-news"',
      'data-page="page-banner"',
    ]);
  }
}

async function assertHtmlScriptReferences(htmlBoundaryFiles) {
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
  const publicConfigDependentScripts = [
    "/assets/js/public/application-form.js",
    "/assets/js/public/clan-news-ticker.js",
    "/assets/js/public/community-shouts.js",
    "/assets/js/public/event-signup-form.js",
    "/assets/js/public/index.js",
    "/assets/js/public/roster.js",
    "/assets/js/public/roster-slideshow.js",
  ];
  const adminScriptAllowList = new Set([
    "/assets/js/admin/config.js",
    "/assets/js/admin/media-preview.js",
    "/assets/js/admin/dashboard.js",
    "/assets/js/admin/login.js",
    "/assets/js/admin/roster.js",
    "/assets/js/admin/sections/applications.js",
    "/assets/js/admin/sections/events.js",
    "/assets/js/admin/sections/videos.js",
    "/assets/js/admin/sections/event-registrations.js",
    "/assets/js/admin/sections/community-shouts.js",
    "/assets/js/admin/homepage-content/page.js",
    "/assets/js/admin/homepage-content/banner.js",
    "/assets/js/admin/homepage-content/news-ticker.js",
    "/assets/js/admin/homepage-content/roster-slideshow.js",
  ]);
  const publicPageScriptAllowLists = new Map([
    ["bewerben.html", [
      "/assets/js/public/config.js",
      "/assets/js/public/nav.js",
      "/assets/js/public/application-form.js",
    ]],
    ["event-anmeldung.html", [
      "/assets/js/public/config.js",
      "/assets/js/public/nav.js",
      "/assets/js/public/event-signup-form.js",
    ]],
    ["impressum.html", [
      "/assets/js/public/nav.js",
    ]],
    ["index.html", [
      "/assets/js/public/config.js",
      "/assets/js/public/nav.js",
      "/assets/js/public/index.js",
      "/assets/js/public/roster-slideshow.js",
      "/assets/js/public/community-shouts.js",
      "/assets/js/public/roster.js",
      "/assets/js/public/clan-news-ticker.js",
    ]],
  ]);
  const adminPageScriptAllowLists = new Map([
    ["admin-login.html", [
      "/assets/js/admin/config.js",
      "/assets/js/admin/login.js",
    ]],
    ["lg-dashboard.html", [
      "/assets/js/admin/config.js",
      "/assets/js/admin/media-preview.js",
      "/assets/js/admin/roster.js",
      "/assets/js/admin/sections/applications.js",
      "/assets/js/admin/sections/events.js",
      "/assets/js/admin/sections/videos.js",
      "/assets/js/admin/sections/event-registrations.js",
      "/assets/js/admin/sections/community-shouts.js",
      "/assets/js/admin/homepage-content/roster-slideshow.js",
      "/assets/js/admin/homepage-content/news-ticker.js",
      "/assets/js/admin/homepage-content/banner.js",
      "/assets/js/admin/homepage-content/page.js",
      "/assets/js/admin/dashboard.js",
    ]],
  ]);

  for (const { relative, boundary, content } of htmlBoundaryFiles) {
    if (boundary !== "public") continue;

    const scriptSources = extractScriptSources(content);
    const exactScriptSources = publicPageScriptAllowLists.get(relative);
    if (!exactScriptSources) {
      failures.push(`${relative}: public page must declare an explicit script boundary in tools/check-boundaries.mjs`);
      continue;
    }
    assertScriptSourcesExactly(relative, scriptSources, exactScriptSources, "public");

    for (const scriptSource of scriptSources) {
      if (!publicScriptAllowList.has(scriptSource)) {
        failures.push(`${relative}: public page must not load ${JSON.stringify(scriptSource)}`);
      }
    }

    for (const scriptSource of publicConfigDependentScripts) {
      assertRequiredScriptBefore(relative, scriptSources, "/assets/js/public/config.js", scriptSource);
    }
  }

  for (const { relative, boundary, content } of htmlBoundaryFiles) {
    if (boundary !== "admin") continue;

    const scriptSources = extractScriptSources(content);
    const exactScriptSources = adminPageScriptAllowLists.get(relative);
    if (!exactScriptSources) {
      failures.push(`${relative}: admin page must declare an explicit script boundary in tools/check-boundaries.mjs`);
      continue;
    }
    assertScriptSourcesExactly(relative, scriptSources, exactScriptSources, "admin");

    for (const scriptSource of scriptSources) {
      if (!adminScriptAllowList.has(scriptSource)) {
        failures.push(`${relative}: admin page must not load ${JSON.stringify(scriptSource)}`);
      }
    }

    if (relative === "lg-dashboard.html") {
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/config.js", "/assets/js/admin/media-preview.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/media-preview.js", "/assets/js/admin/roster.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/roster.js", "/assets/js/admin/sections/applications.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/sections/applications.js", "/assets/js/admin/sections/events.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/sections/events.js", "/assets/js/admin/sections/videos.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/sections/videos.js", "/assets/js/admin/sections/event-registrations.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/sections/event-registrations.js", "/assets/js/admin/sections/community-shouts.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/sections/community-shouts.js", "/assets/js/admin/homepage-content/roster-slideshow.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/homepage-content/roster-slideshow.js", "/assets/js/admin/homepage-content/page.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/homepage-content/news-ticker.js", "/assets/js/admin/homepage-content/page.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/homepage-content/banner.js", "/assets/js/admin/homepage-content/page.js");
      assertScriptBefore(relative, scriptSources, "/assets/js/admin/homepage-content/page.js", "/assets/js/admin/dashboard.js");
    }
  }
}

async function assertHtmlStylesheetReferences(htmlBoundaryFiles) {
  for (const { relative, boundary, content } of htmlBoundaryFiles) {
    const stylesheetHrefs = extractStylesheetHrefs(content);
    const allowList = boundary === "admin"
      ? adminStylesheetAllowList
      : publicStylesheetAllowList;

    for (const stylesheetHref of stylesheetHrefs) {
      if (isExternalStylesheet(stylesheetHref)) continue;
      if (!allowList.has(stylesheetHref)) {
        failures.push(`${relative}: ${boundary} page must not load stylesheet ${JSON.stringify(stylesheetHref)}`);
      }
    }
  }
}

async function assertHtmlInlineBehaviorBoundary(htmlBoundaryFiles) {
  for (const { relative, boundary, content } of htmlBoundaryFiles) {
    const inlineScripts = extractInlineScriptBlocks(content);
    if (inlineScripts.length > 0) {
      failures.push(`${relative}: move inline <script> code into the dedicated ${boundary} browser bundle`);
    }

    if (/\son[a-z]+\s*=/i.test(content)) {
      failures.push(`${relative}: ${boundary} pages must not use inline event handlers`);
    }
  }
}

async function assertCssBoundaries() {
  const tokensPath = path.join(repoRoot, "assets/css/tokens.css");
  const tokens = await readText(tokensPath);
  assertOnlyRootTokenRules(tokensPath, tokens);

  const publicStylesPath = path.join(repoRoot, "assets/css/styles.css");
  const publicStyles = await readText(publicStylesPath);
  assertNotContains(publicStylesPath, publicStyles, [
    ".admin-",
    ".admin-layout",
    ".admin-login",
    ".admin-main",
    ".sidebar",
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
    ".header-banner",
    ".clan-news-ticker",
    ".community-shouts",
    ".live-status",
    ".timeline",
    ".video-card",
    ".recruit",
    ".terminal",
    ".roster-grid",
    ".roster-card",
    ".roster-slideshow",
    ".visitor-counter",
    'data-page="page-news"',
    'data-page="page-banner"',
    ".roster-slideshow-admin",
    ".banner-preview-container",
    ".banner-tab-btn",
  ]);
}

async function assertAdminCoreBoundary() {
  const files = await listFiles(path.join(repoRoot, "assets/js/admin"));
  for (const file of files.filter((item) => item.endsWith(".js"))) {
    const content = await readText(file);
    assertApiPathsMatchBoundary(file, content, "admin");
    if (/<[^>]*\son[a-z]+\s*=/i.test(content)) {
      failures.push(`${path.relative(repoRoot, file)}: admin browser markup must not generate inline event handlers`);
    }
    assertNoPropertyEventHandlers(file, content, "admin");

    assertNotContains(file, content, [
      "SITE_CONFIG",
      "/assets/js/public/",
      "/assets/js/admin/public-content/",
      "/api/public-settings",
      "/api/admin/public-settings",
      "/api/event-image",
      "/api/banner-image",
      "/api/roster-avatar",
      "LGAdminPublic",
      "publicContentSettingsApi",
      "publicEventImageApi",
      "publicBannerImageApi",
      "publicRosterAvatarApi",
      ".replace('/api/admin/', '/api/')",
      '.replace("/api/admin/", "/api/")',
    ]);
  }
}

async function assertAdminMediaPreviewBoundary() {
  const adminConfigPath = path.join(repoRoot, "assets/js/admin/config.js");
  const adminConfig = await readText(adminConfigPath);
  assertNotContains(adminConfigPath, adminConfig, [
    "toPublicApiPath",
    "createMediaPreviewEndpoint",
    "getPublicMediaSuffix",
    "toAdminMediaPreviewUrl",
    "isManagedPublicMediaUrl",
    "publicApi",
  ]);

  const adminMediaPreviewPath = path.join(repoRoot, "assets/js/admin/media-preview.js");
  const adminMediaPreview = await readText(adminMediaPreviewPath);
  assertNotContains(adminMediaPreviewPath, adminMediaPreview, [
    "/api/event-image",
    "/api/banner-image",
    "/api/roster-avatar",
    ".replace('/api/admin/', '/api/')",
    '.replace("/api/admin/", "/api/")',
    "toPublicApiPath",
    "createMediaPreviewEndpoint",
    "getPublicMediaSuffix",
    "toAdminMediaPreviewUrl",
    "isManagedPublicMediaUrl",
    "publicApi",
  ]);
}

async function assertServerMediaContractBoundary() {
  const mediaUrlBuilderPath = path.join(repoRoot, "netlify/functions/_shared/media-url-builder.mjs");
  const mediaUrlBuilder = await readText(mediaUrlBuilderPath);
  assertNotContains(mediaUrlBuilderPath, mediaUrlBuilder, [
    "/api/",
    "adminPreviewPath",
    "publicPath",
    "ADMIN_MEDIA_URLS",
    "MEDIA_URLS",
  ]);

  const adminMediaContractPath = path.join(repoRoot, "netlify/functions/_shared/admin-media-url-contract.mjs");
  const adminMediaContract = await readText(adminMediaContractPath);
  assertNotContains(adminMediaContractPath, adminMediaContract, [
    "export const MEDIA_URLS",
    "export function buildMediaUrlPair(",
  ]);
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
    "applications-body",
    "events-list-body",
    "videos-list-body",
    "evt-registrations-body",
    "community-shouts-admin-body",
    "twitch-admin-banner",
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
    "assets/js/admin/homepage-content/page.js",
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
      "document.getElementById('header-banner",
      'id="header-banner',
      'class="header-banner',
      'class="roster-slideshow',
      'id="roster-slideshow',
      "clan-news-ticker",
      "community-shouts__",
      "timeline__",
      "video-card__",
      "visitor-counter",
      ".banner-tab-btn",
      "roster-slideshow-admin",
      "data-index=",
      "data-type-index=",
      "getAttribute('data-index')",
      "getAttribute('data-type-index')",
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
    const imports = extractRelativeImports(content);
    const endpointPath = extractConfiguredFunctionPath(content);
    const isSharedModule = relative.includes("_shared/");
    const isAdminHandler = relative.startsWith("netlify/functions/admin-")
      || endpointPath?.startsWith("/api/admin/");

    if (isSharedModule) continue;

    if (isAdminHandler) {
      assertApiPathsMatchBoundary(file, content, "admin");
      for (const importPath of imports) {
        if (importPath.startsWith("./_shared/public-")) {
          failures.push(`${relative}: admin handler must not import public projection helper ${JSON.stringify(importPath)}`);
        }
      }
      for (const { storeImport, projectionImport, projectionSymbol } of adminHandlerProjectionImports) {
        if (imports.includes(storeImport) && !imports.includes(projectionImport)) {
          failures.push(`${relative}: admin handler importing ${JSON.stringify(storeImport)} must also use ${JSON.stringify(projectionImport)}`);
        }
        if (imports.includes(storeImport) && !content.includes(projectionSymbol)) {
          failures.push(`${relative}: admin handler importing ${JSON.stringify(storeImport)} must project records with ${projectionSymbol}`);
        }
      }
      continue;
    }

    assertApiPathsMatchBoundary(file, content, "public");
    for (const importPath of imports) {
      if (
        importPath === "./admin-auth.mjs"
        || importPath.startsWith("./_shared/admin-")
        || importPath === "./_shared/media-url-contract.mjs"
      ) {
        failures.push(`${relative}: public handler must not import admin helper ${JSON.stringify(importPath)}`);
      }
    }

    for (const { storeImport, projectionImport } of publicHandlerProjectionImports) {
      if (imports.includes(storeImport) && !imports.includes(projectionImport)) {
        failures.push(`${relative}: public handler importing ${JSON.stringify(storeImport)} must also use ${JSON.stringify(projectionImport)}`);
      }
    }
  }

  const publicSettings = await readText(path.join(repoRoot, "netlify/functions/public-settings.mjs"));
  assertNotContains(path.join(repoRoot, "netlify/functions/public-settings.mjs"), publicSettings, [
    "admin-public-settings-data.mjs",
    "admin-homepage-settings-data.mjs",
    "pickAdminHomepageSettings",
    "sanitizeAdminHomepageSettingsPatch",
  ]);

  const adminHomepageSettingsPath = path.join(repoRoot, "netlify/functions/admin-homepage-settings.mjs");
  const adminHomepageSettings = await readText(adminHomepageSettingsPath);
  assertNotContains(adminHomepageSettingsPath, adminHomepageSettings, [
    'path: "/api/admin/settings"',
    'path: "/api/admin/public-settings"',
    "./_shared/public-settings-data.mjs",
  ]);
}

async function assertNetlifyRoutingBoundary() {
  const netlifyTomlPath = path.join(repoRoot, "netlify.toml");
  const netlifyToml = await readText(netlifyTomlPath);
  const adminEdgeRoutes = new Set([
    "/lg-dashboard",
    "/lg-dashboard.html",
    "/api/admin/*",
  ]);
  const protectedRoutes = new Set();

  for (const block of extractNetlifyEdgeFunctionBlocks(netlifyToml)) {
    const routePath = extractTomlValue(block, "path");
    const functionName = extractTomlValue(block, "function");
    if (!routePath || !functionName) {
      failures.push("netlify.toml: each [[edge_functions]] block must declare path and function");
      continue;
    }

    if (functionName === "admin-auth") {
      if (!adminEdgeRoutes.has(routePath)) {
        failures.push(`netlify.toml: admin-auth edge function must not protect non-admin route ${JSON.stringify(routePath)}`);
      }
      protectedRoutes.add(routePath);
    }
  }

  for (const routePath of adminEdgeRoutes) {
    if (!protectedRoutes.has(routePath)) {
      failures.push(`netlify.toml: admin route ${JSON.stringify(routePath)} must be protected by admin-auth edge function`);
    }
  }
}

async function assertNetlifyBuildBoundary() {
  const netlifyTomlPath = path.join(repoRoot, "netlify.toml");
  const netlifyToml = await readText(netlifyTomlPath);
  const buildCommand = extractTomlValue(netlifyToml, "command");

  if (!/\bnpm\s+test\b/.test(buildCommand)) {
    failures.push("netlify.toml: build command must run npm test so admin/public boundary checks gate deploys");
  }
}

async function assertEdgeFunctionBoundary() {
  const edgeFunctionsDir = path.join(repoRoot, "netlify/edge-functions");
  const files = await listFiles(edgeFunctionsDir);

  for (const file of files.filter((item) => item.endsWith(".mjs"))) {
    const relative = path.relative(repoRoot, file);
    const content = await readText(file);
    const boundary = path.basename(file).startsWith("admin-") ? "admin" : "public";
    assertApiPathsMatchBoundary(file, content, boundary);

    if (boundary === "public" && content.includes("lg_admin_session")) {
      failures.push(`${relative}: public edge function must not inspect admin session cookies`);
    }
  }
}

async function assertPublicIndexProjectionBoundary() {
  const publicIndexPath = path.join(repoRoot, "assets/js/public/index.js");
  const publicIndex = await readText(publicIndexPath);
  assertNotContains(publicIndexPath, publicIndex, [
    "getTimelineGameVariant",
    "PUBG NEWS",
    "ARC Raiders NEWS",
    "admin-homepage-",
    "LGAdminHomepage",
  ]);
}

async function assertPublicSettingsHelperBoundary() {
  const publicSettingsHelperPath = path.join(repoRoot, "netlify/functions/_shared/public-settings-data.mjs");
  const publicSettingsHelper = await readText(publicSettingsHelperPath);
  assertNotContains(publicSettingsHelperPath, publicSettingsHelper, [
    "Admin",
    "./admin-public-settings-data.mjs",
    "./admin-homepage-settings-data.mjs",
    "sanitizeAdminHomepageSettingsPatch",
    "mergeAdminHomepageSettings",
  ]);

  const adminSettingsHelperPath = path.join(repoRoot, "netlify/functions/_shared/admin-homepage-settings-data.mjs");
  const adminSettingsHelper = await readText(adminSettingsHelperPath);
  assertNotContains(adminSettingsHelperPath, adminSettingsHelper, [
    "./public-settings-data.mjs",
    "pickPublicSettings",
    "toPublicRosterSlideshow",
  ]);

  const settingsSchemaPath = path.join(repoRoot, "netlify/functions/_shared/homepage-content-settings-schema.mjs");
  const settingsSchema = await readText(settingsSchemaPath);
  assertNotContains(settingsSchemaPath, settingsSchema, [
    "pickPublicSettings",
    "pickAdminHomepageSettings",
    "sanitizeAdminHomepageSettingsPatch",
    "mergeAdminHomepageSettings",
    "toPublicRosterSlideshow",
    "PUBLIC_CONTENT",
    "settings.entries",
    "entry.memberId",
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
      file: "netlify/functions/_shared/events-data.mjs",
      forbidden: ["toPublicEvent"],
    },
    {
      file: "netlify/functions/_shared/roster-data.mjs",
      forbidden: ["toPublicRosterMember"],
    },
    {
      file: "netlify/functions/_shared/community-shouts-data.mjs",
      forbidden: ["toPublicCommunityShout", "requireAdmin"],
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
      file: "netlify/functions/_shared/admin-events-data.mjs",
      forbidden: ["toPublicEvent"],
    },
    {
      file: "netlify/functions/_shared/admin-roster-data.mjs",
      forbidden: ["toPublicRosterMember"],
    },
    {
      file: "netlify/functions/_shared/admin-community-shouts-data.mjs",
      forbidden: ["toPublicCommunityShout"],
    },
    {
      file: "netlify/functions/_shared/applications-data.mjs",
      forbidden: ["toPublicApplication", "toAdminApplication", "requireAdmin"],
    },
    {
      file: "netlify/functions/_shared/event-registrations-data.mjs",
      forbidden: ["toPublicEventRegistration", "toAdminEventRegistration", "requireAdmin"],
    },
    {
      file: "netlify/functions/_shared/admin-applications-data.mjs",
      forbidden: ["toPublicApplication"],
    },
    {
      file: "netlify/functions/_shared/admin-event-registrations-data.mjs",
      forbidden: ["toPublicEventRegistration"],
    },
    {
      file: "netlify/functions/_shared/public-news-data.mjs",
      forbidden: ["writeNews", "requireAdmin"],
    },
    {
      file: "netlify/functions/_shared/public-videos-data.mjs",
      forbidden: ["buildVideoData", "requireAdmin", "createdAt"],
    },
    {
      file: "netlify/functions/_shared/public-events-data.mjs",
      forbidden: ["requireAdmin", "PUBG NEWS", "ARC Raiders NEWS"],
    },
    {
      file: "netlify/functions/_shared/public-roster-data.mjs",
      forbidden: ["requireAdmin", "stats"],
    },
    {
      file: "netlify/functions/_shared/public-community-shouts-data.mjs",
      forbidden: ["requireAdmin", "approved", "createdAt", "moderatedAt"],
    },
  ];

  for (const { file, forbidden } of files) {
    const absolutePath = path.join(repoRoot, file);
    const content = await readText(absolutePath);
    assertNotContains(absolutePath, content, forbidden);
  }
}

async function assertPublicWriteHandlerBoundary() {
  const communityShoutsPath = path.join(repoRoot, "netlify/functions/community-shouts.mjs");
  const communityShouts = await readText(communityShoutsPath);
  assertContains(communityShoutsPath, communityShouts, [
    "createPendingCommunityShout",
    "hasRequiredCommunityShoutFields",
  ]);
  assertNotContains(communityShoutsPath, communityShouts, [
    "approved: false",
    "createdAt: new Date().toISOString()",
  ]);

  const applicationsPath = path.join(repoRoot, "netlify/functions/applications.mjs");
  const applications = await readText(applicationsPath);
  assertContains(applicationsPath, applications, [
    "createApplication",
    "hasRequiredApplicationFields",
  ]);
  assertNotContains(applicationsPath, applications, [
    'const STORE_NAME = "applications"',
    "createdAt: new Date().toISOString()",
  ]);

  const eventRegistrationsPath = path.join(repoRoot, "netlify/functions/event-registrations.mjs");
  const eventRegistrations = await readText(eventRegistrationsPath);
  assertContains(eventRegistrationsPath, eventRegistrations, [
    "createEventRegistration",
    "hasRequiredEventRegistrationFields",
  ]);
  assertNotContains(eventRegistrationsPath, eventRegistrations, [
    'const STORE_NAME = "event-registrations"',
    "createdAt: new Date().toISOString()",
  ]);
}

async function assertSharedImportBoundary() {
  const sharedDir = path.join(repoRoot, "netlify/functions/_shared");
  const files = await listFiles(sharedDir);

  for (const file of files.filter((item) => item.endsWith(".mjs"))) {
    const relative = path.relative(repoRoot, file);
    const basename = path.basename(file);
    const content = await readText(file);
    const imports = extractRelativeImports(content);
    const isAdminHelper = basename.startsWith("admin-");
    const isPublicHelper = basename.startsWith("public-");
    const isNeutralHelper = !isAdminHelper && !isPublicHelper;

    for (const importPath of imports) {
      if (importPath.endsWith("admin-auth.mjs")) {
        failures.push(`${relative}: shared data helpers must not import admin auth ${JSON.stringify(importPath)}`);
      }

      if (isPublicHelper && (importPath.startsWith("./admin-") || importPath === "./media-url-contract.mjs")) {
        failures.push(`${relative}: public shared helper must not import admin/preview helper ${JSON.stringify(importPath)}`);
      }

      if (isAdminHelper && importPath.startsWith("./public-")) {
        failures.push(`${relative}: admin shared helper must not import public projection helper ${JSON.stringify(importPath)}`);
      }

      if (isNeutralHelper && (importPath.startsWith("./admin-") || importPath.startsWith("./public-"))) {
        failures.push(`${relative}: neutral shared helper must not import boundary-specific helper ${JSON.stringify(importPath)}`);
      }
    }
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
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return listFiles(entryPath);
    }
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

function assertContains(file, content, requiredValues) {
  const relative = path.relative(repoRoot, file);
  for (const requiredValue of requiredValues) {
    if (!content.includes(requiredValue)) {
      failures.push(`${relative}: must contain ${JSON.stringify(requiredValue)}`);
    }
  }
}

function assertApiPathsMatchBoundary(file, content, boundary) {
  const relative = path.relative(repoRoot, file);
  for (const apiPath of extractApiPathLiterals(content)) {
    if (boundary === "public" && apiPath.startsWith("/api/admin")) {
      failures.push(`${relative}: public code must not reference admin API path ${JSON.stringify(apiPath)}`);
    }

    if (boundary === "admin" && apiPath.startsWith("/api/") && !apiPath.startsWith("/api/admin")) {
      failures.push(`${relative}: admin code must not reference public API path ${JSON.stringify(apiPath)}`);
    }
  }
}

function assertNoPropertyEventHandlers(file, content, boundary) {
  const relative = path.relative(repoRoot, file);
  const matches = content.matchAll(/\.\s*on[a-z]+\s*=/gi);
  for (const match of matches) {
    failures.push(`${relative}: ${boundary} browser code must use addEventListener instead of property event handlers (${JSON.stringify(match[0].trim())})`);
  }
}

function extractScriptSources(content) {
  return [...content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

function extractStylesheetHrefs(content) {
  return [...content.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\brel=["'][^"']*\bstylesheet\b[^"']*["']/i.test(tag))
    .map((tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
}

function isExternalStylesheet(href) {
  return href.startsWith("https://fonts.googleapis.com/");
}

function extractInlineScriptBlocks(content) {
  return [...content.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function extractApiPathLiterals(content) {
  const paths = new Set();
  const matches = content.matchAll(/["'`](\/api\/[^"'`\s),}]+)/g);
  for (const match of matches) {
    paths.add(match[1].replace(/[;]+$/, ""));
  }
  return paths;
}

function extractRelativeImports(content) {
  const imports = new Set();
  const matches = content.matchAll(/\bimport\s+(?:[^"']+\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g);
  for (const match of matches) {
    imports.add(match[1]);
  }
  return [...imports];
}

function extractConfiguredFunctionPath(content) {
  return content.match(/\bpath:\s*["']([^"']+)["']/)?.[1] || "";
}

function extractNetlifyEdgeFunctionBlocks(content) {
  return content
    .split(/\[\[edge_functions\]\]/)
    .slice(1)
    .map((block) => block.split(/\n\s*\[/)[0]);
}

function extractTomlValue(block, key) {
  return block.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1] || "";
}

function extractAssetImageReferences(content) {
  const references = new Set();
  const matches = content.matchAll(/(?:^|[^A-Za-z0-9_-])(\/?assets\/img\/[A-Za-z0-9._~!$&()+,;=:@/%-]+)/g);
  for (const match of matches) {
    const normalizedPath = match[1].startsWith("/")
      ? match[1].slice(1)
      : match[1];
    references.add(normalizedPath.split(/[?#]/)[0]);
  }
  return references;
}

async function assertFileExists(referencingFile, relativeAssetPath) {
  try {
    await access(path.join(repoRoot, relativeAssetPath));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    failures.push(`${path.relative(repoRoot, referencingFile)}: referenced asset ${JSON.stringify(`/${relativeAssetPath}`)} does not exist`);
  }
}

function assertScriptBefore(file, scriptSources, firstScript, secondScript) {
  const firstIndex = scriptSources.indexOf(firstScript);
  const secondIndex = scriptSources.indexOf(secondScript);

  if (firstIndex === -1 || secondIndex === -1) return;
  if (firstIndex > secondIndex) {
    failures.push(`${file}: ${JSON.stringify(firstScript)} must be loaded before ${JSON.stringify(secondScript)}`);
  }
}

function assertRequiredScriptBefore(file, scriptSources, requiredScript, dependentScript) {
  const requiredIndex = scriptSources.indexOf(requiredScript);
  const dependentIndex = scriptSources.indexOf(dependentScript);

  if (dependentIndex === -1) return;
  if (requiredIndex === -1) {
    failures.push(`${file}: ${JSON.stringify(dependentScript)} requires ${JSON.stringify(requiredScript)}`);
    return;
  }
  if (requiredIndex > dependentIndex) {
    failures.push(`${file}: ${JSON.stringify(requiredScript)} must be loaded before ${JSON.stringify(dependentScript)}`);
  }
}

function assertScriptSourcesExactly(file, actualSources, expectedSources, boundary) {
  if (
    actualSources.length !== expectedSources.length
    || actualSources.some((source, index) => source !== expectedSources[index])
  ) {
    failures.push(`${file}: ${boundary} page scripts must be exactly ${JSON.stringify(expectedSources)}, found ${JSON.stringify(actualSources)}`);
  }
}

function assertOnlyRootTokenRules(file, content) {
  const relative = path.relative(repoRoot, file);
  const uncommented = content.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  const selectors = [...uncommented.matchAll(/(^|})([^{}]+)\{/g)]
    .map((match) => match[2].trim())
    .filter(Boolean);

  for (const selector of selectors) {
    if (selector !== ":root") {
      failures.push(`${relative}: shared tokens must only define :root custom properties, found selector ${JSON.stringify(selector)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
