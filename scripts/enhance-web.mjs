import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const assets = path.join(root, "assets");
const publicDir = path.join(root, "public");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function resizeIcon(size, dest) {
  const src = path.join(assets, "icon.png");
  if (!fs.existsSync(src)) return;
  const srcPng = PNG.sync.read(fs.readFileSync(src));
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x / size) * srcPng.width);
      const sy = Math.floor((y / size) * srcPng.height);
      const si = (srcPng.width * sy + sx) << 2;
      const oi = (size * y + x) << 2;
      out.data[oi] = srcPng.data[si];
      out.data[oi + 1] = srcPng.data[si + 1];
      out.data[oi + 2] = srcPng.data[si + 2];
      out.data[oi + 3] = srcPng.data[si + 3];
    }
  }
  fs.writeFileSync(dest, PNG.sync.write(out));
}

// Copy public/ → dist/
copyRecursive(publicDir, dist);

// PWA icons
const iconsDir = path.join(dist, "icons");
fs.mkdirSync(iconsDir, { recursive: true });
resizeIcon(192, path.join(iconsDir, "icon-192.png"));
resizeIcon(512, path.join(iconsDir, "icon-512.png"));
copyFile(path.join(assets, "icon.png"), path.join(iconsDir, "icon-512.png"));

// Patch index.html for PWA + mobile
const indexPath = path.join(dist, "index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  const pwaTags = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="NOVA" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  `;
  if (!html.includes("manifest.webmanifest")) {
    html = html.replace("</head>", `${pwaTags}\n</head>`);
    fs.writeFileSync(indexPath, html);
  }
}

console.log("Enhanced dist/ for PWA (manifest + icons)");
