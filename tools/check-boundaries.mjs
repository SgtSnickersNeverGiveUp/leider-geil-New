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
];

const removedFiles = [
  "netlify/functions/admin-settings.mjs",
  "netlify/functions/_shared/settings-data.mjs",
];

async function main() {
  await assertPublicJsBoundary();
  await assertHtmlBoundaries();
  await assertAdminCoreBoundary();
  await assertNetlifyFunctionBoundary();
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
    "pickAdminPublicContentSettings",
    "sanitizePublicContentSettingsPatch",
  ]);

  const adminPublicSettings = await readText(path.join(repoRoot, "netlify/functions/admin-public-settings.mjs"));
  assertNotContains(path.join(repoRoot, "netlify/functions/admin-public-settings.mjs"), adminPublicSettings, [
    'path: "/api/admin/settings"',
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
