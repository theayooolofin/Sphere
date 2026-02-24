import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "dist-static");

const REQUIRED_FILES = [
  ".htaccess",
  "index.html",
  "about.html",
  "drive-earn.html",
  "contact.html",
  "blog.html",
  "speak-with-someone.html",
  "users-privacy-policy.html",
  "drivers-privacy-policy.html",
  "styles.css",
  "nav.js",
  "robots.txt",
  "sitemap.xml",
  "rss.xml"
];

const REQUIRED_DIRS = ["assets", "blog", "download", "download-driver"];

function ensureExists(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required path: ${relativePath}`);
  }
  return absolutePath;
}

function copyFile(relativePath) {
  const source = ensureExists(relativePath);
  const target = path.join(OUT_DIR, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(relativePath) {
  const source = ensureExists(relativePath);
  const target = path.join(OUT_DIR, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function resetOutDir() {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function countFiles(dirPath) {
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += countFiles(fullPath);
    } else {
      total += 1;
    }
  }
  return total;
}

function run() {
  resetOutDir();

  REQUIRED_FILES.forEach(copyFile);
  REQUIRED_DIRS.forEach(copyDir);

  const totalFiles = countFiles(OUT_DIR);
  console.log(
    `Static package ready in dist-static/ (${totalFiles} files): ${[
      ...REQUIRED_FILES,
      ...REQUIRED_DIRS
    ].join(", ")}`
  );
}

run();
