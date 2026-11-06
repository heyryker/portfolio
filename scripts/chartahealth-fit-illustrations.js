// Optically centres the Charta concept illustrations. Run after
// scripts/chartahealth-illustrations.py:  node scripts/chartahealth-fit-illustrations.js
//
// Each drawing has a different footprint, so centring the canvas left them
// looking off-centre and at different sizes. This measures the drawn content
// and rewrites the viewBox so every drawing has the same visual size (equal
// geometric-mean width x height), sits a touch above the true centre (the
// optical centre), and keeps the 1000x800 frame proportions.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = path.join(__dirname, '..', 'public', 'chartahealth', 'illustrations');
const W = 1000, H = 800;
const TARGET = 650;      // geometric mean of content width and height, in frame units
const MAX_W = 0.84, MAX_H = 0.88; // never fill more of the frame than this
const LIFT = 0.025;      // content centre sits this fraction of the height above centre

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.svg'))) {
    const file = path.join(DIR, f);
    const src = fs.readFileSync(file, 'utf8');
    // Measure what is actually painted (clip paths make getBBox overestimate):
    // rasterise a generous area around the canvas and find the inked pixels.
    const r = await page.evaluate(async (svgText) => {
      const PAD = 400, S = 0.5;
      const area = { x: -PAD, y: -PAD, w: 1000 + 2 * PAD, h: 800 + 2 * PAD };
      const t = svgText
        .replace(/viewBox="[^"]*"/, `viewBox="${area.x} ${area.y} ${area.w} ${area.h}"`)
        .replace(/width="\d+" height="\d+"/, `width="${area.w * S}" height="${area.h * S}"`);
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t);
      await img.decode();
      const c = document.createElement('canvas');
      c.width = area.w * S; c.height = area.h * S;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let L = c.width, R = 0, T = c.height, B = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y; }
      }
      return { x: area.x + L / S, y: area.y + T / S, w: (R - L + 1) / S, h: (B - T + 1) / S };
    }, src);
    const k = Math.min(TARGET / Math.sqrt(r.w * r.h), (MAX_W * W) / r.w, (MAX_H * H) / r.h);
    const vw = W / k, vh = H / k;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + LIFT * vh;
    const vb = [cx - vw / 2, cy - vh / 2, vw, vh].map((n) => +n.toFixed(1)).join(' ');
    fs.writeFileSync(file, src.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`));
    console.log(f, vb);
  }
  await browser.close();
})();
