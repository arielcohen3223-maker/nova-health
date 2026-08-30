/**
 * Generates NOVA app icons (1024 PNG) for App Store / Play Store.
 * Run: node scripts/generate-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const TEAL = { r: 13, g: 148, b: 136 };
const TEAL_DARK = { r: 15, g: 118, b: 110 };
const WHITE = { r: 255, g: 255, b: 255 };

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillCircle(png, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(png, x, y, color.r, color.g, color.b);
    }
  }
}

function fillRoundRect(png, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const inHoriz = px >= x + radius && px < x + w - radius;
      const inVert = py >= y + radius && py < y + h - radius;
      const corners = [
        [x + radius, y + radius, radius],
        [x + w - radius, y + radius, radius],
        [x + radius, y + h - radius, radius],
        [x + w - radius, y + h - radius, radius],
      ];
      let inside = inHoriz || inVert;
      if (!inside) {
        for (const [cx, cy, r] of corners) {
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy <= r * r) {
            inside = true;
            break;
          }
        }
      }
      if (inside) setPixel(png, px, py, color.r, color.g, color.b);
    }
  }
}

function drawPulse(png, cx, cy, scale) {
  const w = 180 * scale;
  const h = 80 * scale;
  const startX = cx - w / 2;
  const midY = cy;
  const points = [
    [0, 0],
    [0.15, 0],
    [0.22, -0.55],
    [0.28, 0.65],
    [0.34, -0.35],
    [0.42, 0.15],
    [0.55, 0],
    [0.68, 0],
    [0.75, -0.7],
    [0.82, 0.85],
    [0.88, -0.2],
    [1, 0],
  ];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const steps = Math.ceil(w * (x1 - x0));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      const px = Math.round(startX + w * lerp(x0, x1, t));
      const py = Math.round(midY + h * lerp(y0, y1, t));
      for (let dy = -Math.round(5 * scale); dy <= Math.round(5 * scale); dy++) {
        setPixel(png, px, py + dy, WHITE.r, WHITE.g, WHITE.b);
      }
    }
  }
}

function createIcon(size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2);
      setPixel(
        png,
        x,
        y,
        Math.round(lerp(TEAL.r, TEAL_DARK.r, t)),
        Math.round(lerp(TEAL.g, TEAL_DARK.g, t)),
        Math.round(lerp(TEAL.b, TEAL_DARK.b, t)),
      );
    }
  }
  const scale = size / 1024;
  fillRoundRect(png, size * 0.18, size * 0.18, size * 0.64, size * 0.64, size * 0.14, {
    r: Math.min(255, TEAL.r + 20),
    g: Math.min(255, TEAL.g + 20),
    b: Math.min(255, TEAL.b + 20),
  });
  drawPulse(png, size / 2, size / 2, scale);
  return png;
}

function writePng(png, filename) {
  const out = path.join(assetsDir, filename);
  fs.writeFileSync(out, PNG.sync.write(png));
  console.log("Wrote", out);
}

writePng(createIcon(1024), "icon.png");
writePng(createIcon(1024), "adaptive-icon.png");
writePng(createIcon(512), "splash-icon.png");
writePng(createIcon(48), "favicon.png");
