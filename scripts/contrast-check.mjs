#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const cssPath = path.resolve(process.cwd(), 'src/index.css');
const css = fs.readFileSync(cssPath, 'utf8');

const lightBlockMatch = css.match(/\[data-theme="light"\]\s*\{([\s\S]*?)\}/m);
if (!lightBlockMatch) {
  console.error('✖ Light theme block not found in src/index.css');
  process.exit(1);
}

const block = lightBlockMatch[1];

function parseVars(blockCss) {
  const vars = {};
  for (const line of blockCss.split('\n')) {
    // Remove comments
    const cleaned = line.replace(/\/\*.*?\*\//g, '').trim();
    const m = cleaned.match(/^--([a-z0-9\-]+):\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%\s*;/i);
    if (m) {
      vars[m[1]] = { h: Number(m[2]), s: Number(m[3]) / 100, l: Number(m[4]) / 100 };
    }
  }
  return vars;
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hp && hp < 6) [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m];
}

function relLum([r, g, b]) {
  const f = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(a, b) {
  const L1 = relLum(hslToRgb(a));
  const L2 = relLum(hslToRgb(b));
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

const vars = parseVars(block);

const checks = [
  { a: 'background', b: 'foreground', min: 4.5, label: 'base text' },
  { a: 'card', b: 'card-foreground', min: 4.5, label: 'card text' },
  { a: 'popover', b: 'popover-foreground', min: 4.5, label: 'popover text' },
  { a: 'secondary', b: 'secondary-foreground', min: 4.5, label: 'secondary text' },
  { a: 'muted', b: 'muted-foreground', min: 4.5, label: 'muted text' },
  { a: 'accent', b: 'accent-foreground', min: 4.5, label: 'accent text' },
  { a: 'destructive', b: 'destructive-foreground', min: 4.5, label: 'destructive text' },
  { a: 'primary', b: 'primary-foreground', min: 4.5, label: 'primary button text' },
  // Non-text (UI graphics) recommended >= 3:1
  { a: 'background', b: 'border', min: 3.0, label: 'border vs background' },
  { a: 'background', b: 'input', min: 3.0, label: 'input vs background' },
  { a: 'background', b: 'ring', min: 3.0, label: 'focus ring vs background' },
];

let failed = 0;
for (const c of checks) {
  const A = vars[c.a];
  const B = vars[c.b];
  if (!A || !B) {
    console.warn(`! Skipping ${c.label} – missing vars: ${!A ? c.a : ''} ${!B ? c.b : ''}`);
    continue;
  }
  const ratio = contrast(A, B);
  const ok = ratio >= c.min;
  const ratioStr = ratio.toFixed(2);
  if (!ok) {
    failed++;
    console.error(`✖ ${c.label}: ${c.a} vs ${c.b} = ${ratioStr} (min ${c.min})`);
  } else {
    console.log(`✔ ${c.label}: ${c.a} vs ${c.b} = ${ratioStr}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} contrast checks failed. Please adjust Light theme tokens in src/index.css.`);
  process.exit(1);
}

console.log('\nAll contrast checks passed for Light theme.');
