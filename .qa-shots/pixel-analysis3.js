'use strict';
/* pixel-analysis3.js — pixel-level analysis of r-buttons.png, r-card-bottom.png, r-subtitle.png.
   Reuses the minimal PNG decoder from pixel-analysis.js (8-bit, color types 0/2/3/4/6, interlace 0/1). */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function decodePNG(file) {
  const buf = fs.readFileSync(file);
  const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG (bad signature)');
  let off = 8, ihdr = null;
  const idats = [];
  let plte = null, trns = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString('latin1');
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idats.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error('missing IHDR');
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8], colorType = ihdr[9];
  const interlace = ihdr[12];
  const meta = { width, height, bitDepth, colorType, compression: ihdr[10], filterMethod: ihdr[11], interlace };
  if (bitDepth !== 8) throw new Error(`unsupported bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`);
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[colorType];
  if (!channels) throw new Error(`unsupported colorType=${colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = channels;
  const rgba = new Uint8Array(width * height * 4);

  function unfilterBlock(offset, w, h) {
    const stride = w * bpp;
    const out = Buffer.alloc(h * stride);
    let pos = offset, prev = null;
    for (let y = 0; y < h; y++) {
      if (pos + 1 + stride > raw.length) throw new Error('IDAT data truncated');
      const f = raw[pos++];
      const curOff = y * stride;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? out[curOff + x - bpp] : 0;
        const b = prev ? prev[x] : 0;
        const c = (prev && x >= bpp) ? prev[x - bpp] : 0;
        let v = raw[pos + x];
        if (f === 1) v = (v + a) & 255;
        else if (f === 2) v = (v + b) & 255;
        else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
        else if (f === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = (v + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c))) & 255;
        } else if (f !== 0) throw new Error('bad filter type ' + f);
        out[curOff + x] = v;
      }
      pos += stride;
      prev = out.subarray(curOff, curOff + stride);
    }
    return { out, next: pos };
  }

  function setPx(x, y, src, i) {
    const o = (y * width + x) * 4;
    if (colorType === 6) { rgba[o] = src[i]; rgba[o + 1] = src[i + 1]; rgba[o + 2] = src[i + 2]; rgba[o + 3] = src[i + 3]; }
    else if (colorType === 2) { rgba[o] = src[i]; rgba[o + 1] = src[i + 1]; rgba[o + 2] = src[i + 2]; rgba[o + 3] = 255; }
    else if (colorType === 0) { rgba[o] = rgba[o + 1] = rgba[o + 2] = src[i]; rgba[o + 3] = 255; }
    else if (colorType === 4) { rgba[o] = rgba[o + 1] = rgba[o + 2] = src[i]; rgba[o + 3] = src[i + 1]; }
    else if (colorType === 3) {
      const pi = src[i] * 3;
      if (!plte || pi + 3 > plte.length) throw new Error('palette index out of PLTE range');
      rgba[o] = plte[pi]; rgba[o + 1] = plte[pi + 1]; rgba[o + 2] = plte[pi + 2];
      rgba[o + 3] = (trns && src[i] < trns.length) ? trns[src[i]] : 255;
    }
  }

  if (interlace === 0) {
    const expected = height * (1 + width * bpp);
    if (raw.length < expected) throw new Error(`IDAT too short: ${raw.length} < ${expected}`);
    const { out } = unfilterBlock(0, width, height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        setPx(x, y, out, (y * width + x) * bpp);
  } else if (interlace === 1) {
    const passes = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
    let pos = 0;
    for (const [xs, ys, xst, yst] of passes) {
      const pw = Math.ceil((width - xs) / xst), ph = Math.ceil((height - ys) / yst);
      if (pw <= 0 || ph <= 0) continue;
      const { out, next } = unfilterBlock(pos, pw, ph);
      pos = next;
      for (let py = 0; py < ph; py++)
        for (let pxi = 0; pxi < pw; pxi++)
          setPx(xs + pxi * xst, ys + py * yst, out, (py * pw + pxi) * bpp);
    }
  } else throw new Error(`unsupported interlace=${interlace}`);

  return { width, height, pixels: rgba, meta };
}

/* ---------- helpers (from pixel-analysis.js) ---------- */
function makeMaps(img) {
  const w = img.width, h = img.height, p = img.pixels;
  const lum = new Float32Array(w * h), sat = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    sat[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  return { lum, sat };
}
function blobs(mask, w, h, minArea) {
  const seen = new Uint8Array(w * h);
  const out = [], stack = [];
  for (let i = 0; i < w * h; i++) {
    if (mask[i] && !seen[i]) {
      seen[i] = 1; stack.push(i);
      let minx = w, maxx = 0, miny = h, maxy = 0, count = 0;
      while (stack.length) {
        const j = stack.pop(); count++;
        const x = j % w, y = (j / w) | 0;
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
        if (x > 0 && mask[j - 1] && !seen[j - 1]) { seen[j - 1] = 1; stack.push(j - 1); }
        if (x < w - 1 && mask[j + 1] && !seen[j + 1]) { seen[j + 1] = 1; stack.push(j + 1); }
        if (y > 0 && mask[j - w] && !seen[j - w]) { seen[j - w] = 1; stack.push(j - w); }
        if (y < h - 1 && mask[j + w] && !seen[j + w]) { seen[j + w] = 1; stack.push(j + w); }
      }
      if (count >= minArea) out.push({ minx, maxx, miny, maxy, count });
    }
  }
  return out;
}
const fmt = c => c ? 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')' : 'n/a';
const hex = c => c ? '#' + [c[0], c[1], c[2]].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() : 'n/a';
function avgAt(img, x, y, r2) {
  let rr = 0, g = 0, b = 0, n = 0;
  for (let dy = -r2; dy <= r2; dy++) for (let dx = -r2; dx <= r2; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= img.width || yy >= img.height) continue;
    const i = (yy * img.width + xx) * 4;
    rr += img.pixels[i]; g += img.pixels[i + 1]; b += img.pixels[i + 2]; n++;
  }
  return n ? [rr / n, g / n, b / n] : null;
}
function meanColor(img, pred) {
  const w = img.width, h = img.height, p = img.pixels;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < w * h; i++) if (pred(i)) { r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; n++; }
  return n ? [r / n, g / n, b / n] : null;
}
function darkestColor(img, lum, pred) {
  const w = img.width, h = img.height, p = img.pixels;
  let minL = 1e9; const idxs = [];
  for (let i = 0; i < w * h; i++) if (pred(i)) {
    if (lum[i] < minL) { minL = lum[i]; idxs.length = 0; idxs.push(i); }
    else if (lum[i] <= minL + 6) idxs.push(i);
  }
  if (!idxs.length) return null;
  let r = 0, g = 0, b = 0;
  for (const i of idxs) { r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; }
  return [r / idxs.length, g / idxs.length, b / idxs.length];
}
function brightestColor(img, lum, pred) {
  const w = img.width, h = img.height, p = img.pixels;
  let maxL = -1; const idxs = [];
  for (let i = 0; i < w * h; i++) if (pred(i)) {
    if (lum[i] > maxL) { maxL = lum[i]; idxs.length = 0; idxs.push(i); }
    else if (lum[i] >= maxL - 6) idxs.push(i);
  }
  if (!idxs.length) return null;
  let r = 0, g = 0, b = 0;
  for (const i of idxs) { r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; }
  return [r / idxs.length, g / idxs.length, b / idxs.length];
}
function overview(img, lum, sat, bs) {
  const w = img.width, h = img.height, p = img.pixels;
  const lines = [];
  for (let y = 0; y < h; y += bs) {
    let line = '';
    for (let x = 0; x < w; x += bs) {
      const cls = { white: 0, grey: 0, dark: 0, color: 0, lav: 0 };
      for (let dy = 0; dy < bs && y + dy < h; dy++) for (let dx = 0; dx < bs && x + dx < w; dx++) {
        const i = (y + dy) * w + (x + dx);
        const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
        if (sat[i] >= 25) cls.color++;
        else if (b - r >= 4 && lum[i] >= 200) cls.lav++;
        else if (lum[i] < 110) cls.dark++;
        else if (lum[i] < 245) cls.grey++;
        else cls.white++;
      }
      const best = Object.entries(cls).sort((a, b2) => b2[1] - a[1])[0][0];
      line += { white: ' ', grey: '.', dark: '#', color: 'O', lav: 'o' }[best];
    }
    lines.push(String(y).padStart(3) + '|' + line);
  }
  return lines.join('\n');
}
function zoomArt(img, lum, sat, x0, y0, x1, y1, mode, xstep) {
  const w = img.width, p = img.pixels;
  xstep = xstep || 1;
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let line = String(y).padStart(3) + '|';
    for (let x = x0; x <= x1; x += xstep) {
      const i = y * w + x;
      if (mode === 'sat') line += sat[i] >= 25 ? '#' : (lum[i] < 245 ? '.' : ' ');
      else if (mode === 'diff') line += lum[i] < 244 ? '#' : (lum[i] < 251 ? '.' : ' ');
      else {
        if (lum[i] < 120) line += '#';
        else if (lum[i] < 190) line += '+';
        else if (lum[i] < 245) line += '.';
        else line += ' ';
      }
    }
    rows.push(line);
  }
  return rows.join('\n');
}

const DIR = 'C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/';

/* ================= A) r-buttons.png ================= */
function analyzeButtons(file) {
  console.log('\n================ A) BUTTONS: ' + path.basename(file) + ' ================');
  const img = decodePNG(file);
  const w = img.width, h = img.height;
  console.log('meta:', JSON.stringify(img.meta), ' crop center x=' + (w / 2));
  const { lum, sat } = makeMaps(img);
  const idx = (x, y) => y * w + x;

  console.log('\n--- overview (3px blocks) ---');
  console.log(overview(img, lum, sat, 3));

  /* --- 1. buttons --- */
  const bgTL = avgAt(img, 6, 6, 2), bgTR = avgAt(img, w - 7, 6, 2);
  console.log('\n--- 1. buttons ---');
  console.log('card bg samples: TL', hex(bgTL), ' TR', hex(bgTR));

  const BY0 = 18, BY1 = 110;
  const diffMask = new Uint8Array(w * h);
  for (let y = BY0; y <= BY1; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y);
    const r = img.pixels[i * 4], g = img.pixels[i * 4 + 1], b = img.pixels[i * 4 + 2];
    // differ from card white FEFEFE by >=8 in any channel
    if (Math.abs(r - 254) >= 8 || Math.abs(g - 254) >= 8 || Math.abs(b - 254) >= 8) diffMask[i] = 1;
  }
  const rawBlobs = blobs(diffMask, w, h, 40).sort((a, b) => a.minx - b.minx);
  console.log('raw blobs (area>=40):');
  for (const b of rawBlobs)
    console.log(`  x[${b.minx}..${b.maxx}] y[${b.miny}..${b.maxy}] ${b.maxx - b.minx + 1}x${b.maxy - b.miny + 1} area=${b.count}`);
  // cluster into buttons
  const groups = [];
  for (const b of rawBlobs) {
    let g = null;
    for (const gg of groups) {
      const yOver = Math.min(gg.maxy, b.maxy) - Math.max(gg.miny, b.miny);
      const yMin = Math.min(gg.maxy - gg.miny, b.maxy - b.miny) + 1;
      if (b.minx <= gg.maxx + 14 && yOver > 0.4 * yMin) { g = gg; break; }
    }
    if (g) { g.minx = Math.min(g.minx, b.minx); g.maxx = Math.max(g.maxx, b.maxx); g.miny = Math.min(g.miny, b.miny); g.maxy = Math.max(g.maxy, b.maxy); g.parts.push(b); }
    else groups.push({ minx: b.minx, maxx: b.maxx, miny: b.miny, maxy: b.maxy, parts: [b] });
  }
  const buttons = groups.filter(g => (g.maxx - g.minx + 1) >= 40).sort((a, b) => a.minx - b.minx);
  console.log(`button groups (width>=40): ${buttons.length}`);
  buttons.forEach((g, k) => {
    const BW = g.maxx - g.minx + 1, BH = g.maxy - g.miny + 1;
    const cx = (g.minx + g.maxx) / 2, midY = (g.miny + g.maxy) >> 1;
    console.log(`\nBUTTON ${k + 1}: bbox x[${g.minx}..${g.maxx}] y[${g.miny}..${g.maxy}] = ${BW}x${BH}px  hCenter=${cx.toFixed(1)} (off ${cx - w / 2 >= 0 ? '+' : ''}${(cx - w / 2).toFixed(1)} vs ${w / 2})  parts=${g.parts.length}`);
    console.log(`  fill samples: L=${hex(avgAt(img, g.minx + 9, midY, 1))} R=${hex(avgAt(img, g.maxx - 9, midY, 1))} C=${hex(avgAt(img, (g.minx + g.maxx) >> 1, g.miny + 5, 1))} midC=${hex(avgAt(img, (g.minx + g.maxx) >> 1, midY - 4, 1))}`);
    // border scan: horizontal strip at midY
    let strip = '  hscan midY=' + midY + ': ';
    for (let x = Math.max(0, g.minx - 2); x <= Math.min(w - 1, g.minx + 9); x++) {
      const i = idx(x, midY) * 4;
      strip += hex([img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]]) + ' ';
    }
    console.log(strip);
    let vscan = '  vscan cx: ';
    const cxI = (g.minx + g.maxx) >> 1;
    for (let y = Math.max(0, g.miny - 2); y <= Math.min(h - 1, g.miny + 9); y++) {
      const i = idx(cxI, y) * 4;
      vscan += hex([img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]]) + ' ';
    }
    console.log(vscan);
    // interior glyph pixels: darkest + brightest
    const inside = i => {
      const x = i % w, y = (i / w) | 0;
      return x > g.minx + 2 && x < g.maxx - 2 && y > g.miny + 2 && y < g.maxy - 2;
    };
    console.log(`  interior darkest=${hex(darkestColor(img, lum, inside))} brightest=${hex(brightestColor(img, lum, inside))}`);
    // glyph runs: columns where interior has pixels lum<fill-35 or >fill+35
    const fillLum = lum[idx(g.minx + 9, midY)];
    const colHas = [];
    for (let x = g.minx + 3; x <= g.maxx - 3; x++) {
      let c = false;
      for (let y = g.miny + 3; y <= g.maxy - 3; y++) { const l = lum[idx(x, y)]; if (Math.abs(l - fillLum) >= 30) { c = true; break; } }
      colHas.push(c);
    }
    const runs = []; let s = -1;
    for (let k = 0; k < colHas.length; k++) {
      if (colHas[k] && s < 0) s = k;
      if (!colHas[k] && s >= 0) { runs.push([g.minx + 3 + s, g.minx + 3 + k - 1]); s = -1; }
    }
    if (s >= 0) runs.push([g.minx + 3 + s, g.maxx - 3]);
    console.log(`  glyph/feature runs (${runs.length}): ` + runs.map(r => `x[${r[0]}..${r[1]}]w${r[1] - r[0] + 1}`).join(' '));
    console.log('  art (lum):');
    console.log(zoomArt(img, lum, sat, g.minx - 2, g.miny - 2, g.maxx + 2, g.maxy + 2, 'lum'));
    // last run = possible chevron
    const last = runs[runs.length - 1];
    if (last) {
      const d = last[1] - last[0] + 1;
      console.log(`  last-run dist to right edge: ${g.maxx - 2 - last[1]}px, width=${d}px`);
      const lumIn = i => { const x = i % w, y = (i / w) | 0; return x >= last[0] && x <= last[1] && y >= g.miny + 3 && y <= g.maxy - 3; };
      console.log(`  last-run darkest=${hex(darkestColor(img, lum, lumIn))} mean=${hex(meanColor(img, i => { const x = i % w, y = (i / w) | 0; return lumIn(i) && Math.abs(lum[i] - fillLum) >= 30; }))}`);
    }
  });
  if (buttons.length >= 2) {
    const a = buttons[0], b = buttons[1];
    console.log(`\nGAP between buttons: ${b.minx - a.maxx - 1}px (right edge B1=${a.maxx}, left edge B2=${b.minx})`);
    const pairCx = (a.minx + b.maxx) / 2;
    console.log(`button pair span x[${a.minx}..${b.maxx}] center=${pairCx.toFixed(1)} (off ${(pairCx - w / 2).toFixed(1)} vs ${w / 2})`);
  }
  // art of right 56px of rightmost button (chevron/circle check)
  if (buttons.length) {
    const rb = buttons[buttons.length - 1];
    console.log('\n  --- right end of rightmost button (x ' + (rb.maxx - 52) + '..' + (rb.maxx + 2) + ') ---');
    console.log(zoomArt(img, lum, sat, rb.maxx - 52, rb.miny - 2, rb.maxx + 2, rb.maxy + 2, 'lum'));
  }

  /* --- 3. dots row --- */
  console.log('\n--- 3. dots row ---');
  const DY0 = 115, DY1 = 158;
  const dotMask = new Uint8Array(w * h);
  for (let y = DY0; y <= DY1 && y < h; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y) * 4;
    const r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
    // differ from BOTH page bg F8F8FC and card white FEFEFE by >=6
    const dPage = Math.max(Math.abs(r - 248), Math.abs(g - 248), Math.abs(b - 252));
    const dCard = Math.max(Math.abs(r - 254), Math.abs(g - 254), Math.abs(b - 254));
    if (dPage >= 6 && dCard >= 6) dotMask[idx(x, y)] = 1;
  }
  const dotBlobs = blobs(dotMask, w, h, 3).sort((a, b) => a.minx - b.minx);
  console.log(`mask blobs in y[${DY0}..${DY1}] (area>=3): ${dotBlobs.length}`);
  for (const d of dotBlobs)
    console.log(`  x[${d.minx}..${d.maxx}] y[${d.miny}..${d.maxy}] ${d.maxx - d.minx + 1}x${d.maxy - d.miny + 1} area=${d.count}`);
  const dots = dotBlobs.filter(d => {
    const dw = d.maxx - d.minx + 1, dh = d.maxy - d.miny + 1;
    return dw >= 4 && dw <= 26 && dh >= 3 && dh <= 26 && dw / dh > 0.5 && dw / dh < 2;
  });
  console.log(`dot-like blobs: ${dots.length}`);
  const dcs = [];
  dots.forEach((d, k) => {
    const cx = (d.minx + d.maxx) / 2, cy = (d.miny + d.maxy) / 2;
    const dw = d.maxx - d.minx + 1, dh = d.maxy - d.miny + 1;
    const col = avgAt(img, Math.round(cx), Math.round(cy), dw >= 8 ? 1 : 0);
    dcs.push(cx);
    console.log(`dot ${k + 1}: bbox x[${d.minx}..${d.maxx}] y[${d.miny}..${d.maxy}] w=${dw} h=${dh} diam~${((dw + dh) / 2).toFixed(1)}px center=(${cx.toFixed(1)},${cy.toFixed(1)}) fill=${hex(col)} (${fmt(col)})`);
  });
  for (let k = 1; k < dots.length; k++) {
    const gap = dots[k].minx - dots[k - 1].maxx - 1;
    console.log(`spacing dot${k}->dot${k + 1}: edge gap=${gap}px center-to-center=${(dcs[k] - dcs[k - 1]).toFixed(1)}px`);
  }
  if (dots.length) {
    const gc = (dots[0].minx + dots[dots.length - 1].maxx) / 2;
    console.log(`dot group: x[${dots[0].minx}..${dots[dots.length - 1].maxx}] center=${gc.toFixed(1)} vs crop center ${w / 2} (off ${(gc - w / 2).toFixed(1)}px)`);
  }
  console.log('dots area art:');
  console.log(zoomArt(img, lum, sat, 0, DY0 - 4, w - 1, Math.min(h - 1, DY1 + 2), 'lum', 4));
}

/* ================= B) r-card-bottom.png ================= */
function analyzeCardBottom(file) {
  console.log('\n================ B) CARD BOTTOM: ' + path.basename(file) + ' ================');
  const img = decodePNG(file);
  const w = img.width, h = img.height;
  console.log('meta:', JSON.stringify(img.meta), ' crop center x=' + (w / 2));
  const { lum, sat } = makeMaps(img);
  const idx = (x, y) => y * w + x;

  console.log('\n--- overview (3px blocks) ---');
  console.log(overview(img, lum, sat, 3));

  /* --- 4a. band y 129-140 --- */
  console.log('\n--- 4. band y 124..146 ---');
  for (let y = 124; y <= 146 && y < h; y++) {
    let n = 0, x0 = w, x1 = -1, run = null;
    for (let x = 0; x < w; x++) {
      const i = idx(x, y) * 4;
      const r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
      const dPage = Math.max(Math.abs(r - 248), Math.abs(g - 248), Math.abs(b - 252));
      const dCard = Math.max(Math.abs(r - 254), Math.abs(g - 254), Math.abs(b - 254));
      if (dPage >= 6 && dCard >= 6) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    }
    const col = n ? meanColor(img, i => {
      const x = i % w, yy = (i / w) | 0;
      if (yy !== y) return false;
      const j = i * 4;
      const dPage = Math.max(Math.abs(img.pixels[j] - 248), Math.abs(img.pixels[j + 1] - 248), Math.abs(img.pixels[j + 2] - 252));
      const dCard = Math.max(Math.abs(img.pixels[j] - 254), Math.abs(img.pixels[j + 1] - 254), Math.abs(img.pixels[j + 2] - 254));
      return dPage >= 6 && dCard >= 6;
    }) : null;
    console.log(`y=${y}: n=${n}${n ? ' x[' + x0 + '..' + x1 + '] span=' + (x1 - x0 + 1) + ' mean=' + hex(col) : ''}`);
  }
  // blobs in the band
  const bandMask = new Uint8Array(w * h);
  for (let y = 124; y <= 146 && y < h; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y) * 4;
    const r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
    const dPage = Math.max(Math.abs(r - 248), Math.abs(g - 248), Math.abs(b - 252));
    const dCard = Math.max(Math.abs(r - 254), Math.abs(g - 254), Math.abs(b - 254));
    if (dPage >= 6 && dCard >= 6) bandMask[idx(x, y)] = 1;
  }
  const bandBlobs = blobs(bandMask, w, h, 3).sort((a, b) => a.minx - b.minx);
  console.log(`band blobs: ${bandBlobs.length}`);
  for (const d of bandBlobs) {
    const col = avgAt(img, (d.minx + d.maxx) >> 1, (d.miny + d.maxy) >> 1, 0);
    console.log(`  x[${d.minx}..${d.maxx}] y[${d.miny}..${d.maxy}] ${d.maxx - d.minx + 1}x${d.maxy - d.miny + 1} area=${d.count} center=${hex(col)}`);
  }
  console.log('band art (2px x-step):');
  console.log(zoomArt(img, lum, sat, 0, 122, w - 1, 148, 'lum', 2));

  /* --- 4b. column x=294 scan --- */
  console.log('\n--- column x=294, y=100..170 (rgb / lum), card->bg transition ---');
  let prevState = null;
  for (let y = 100; y <= Math.min(170, h - 1); y++) {
    const i = idx(294, y) * 4;
    const r = img.pixels[i], g = img.pixels[i + 1], b = img.pixels[i + 2];
    const l = lum[idx(294, y)];
    let tag = '';
    if (r >= 252 && g >= 252 && b >= 252) tag = 'CARD-WHITE';
    else if (Math.abs(r - 248) <= 3 && Math.abs(g - 248) <= 3 && Math.abs(b - 252) <= 3) tag = 'PAGE-BG';
    else if (l < 244) tag = 'darker';
    else tag = 'transition?';
    if (tag !== prevState) { console.log('  -- change at y=' + y + ': ' + prevState + ' -> ' + tag); prevState = tag; }
    console.log(`  y=${y}: ${r},${g},${b} lum=${l.toFixed(1)} ${tag}`);
  }
}

/* ================= C) r-subtitle.png ================= */
function analyzeSubtitle(file) {
  console.log('\n================ C) SUBTITLE: ' + path.basename(file) + ' ================');
  const img = decodePNG(file);
  const w = img.width, h = img.height;
  console.log('meta:', JSON.stringify(img.meta), ' crop center x=' + (w / 2));
  const { lum, sat } = makeMaps(img);
  const idx = (x, y) => y * w + x;

  console.log('\n--- overview (4px blocks) ---');
  console.log(overview(img, lum, sat, 4));

  function lineReport(name, y0, y1, darkTH) {
    console.log(`\n--- ${name} (y[${y0}..${y1}], dark mask lum<${darkTH}) ---`);
    let bx0 = w, bx1 = -1, by0 = h, by1 = -1, n = 0;
    const rowC = [];
    for (let y = y0; y <= y1 && y < h; y++) {
      let c = 0;
      for (let x = 0; x < w; x++) if (lum[idx(x, y)] < darkTH) {
        c++; n++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      }
      rowC.push(c);
    }
    if (!n) { console.log('no dark pixels'); return; }
    const inBox = i => {
      const x = i % w, y = (i / w) | 0;
      return y >= y0 && y <= y1 && lum[i] < darkTH;
    };
    console.log(`dark bbox x[${bx0}..${bx1}] y[${by0}..${by1}] = ${bx1 - bx0 + 1}x${by1 - by0 + 1}px (${n}px dark)`);
    console.log(`darkest=${hex(darkestColor(img, lum, inBox))} mean=${hex(meanColor(img, inBox))}`);
    const cx = (bx0 + bx1) / 2;
    console.log(`bbox center x=${cx.toFixed(1)} vs crop center ${w / 2} (off ${(cx - w / 2).toFixed(1)}px); coverage ${(bx1 - bx0 + 1) / w * 100 | 0}% of ${w}px`);
    // glyph runs
    const colHas = [];
    for (let x = bx0; x <= bx1; x++) { let c = 0; for (let y = by0; y <= by1; y++) if (lum[idx(x, y)] < darkTH) c++; colHas.push(c > 0); }
    const runs = []; let s = -1;
    for (let k = 0; k < colHas.length; k++) {
      if (colHas[k] && s < 0) s = k;
      if (!colHas[k] && s >= 0) { runs.push([bx0 + s, bx0 + k - 1]); s = -1; }
    }
    if (s >= 0) runs.push([bx0 + s, bx1]);
    const heights = runs.map(r => {
      let t = h, b = -1;
      for (let x = r[0]; x <= r[1]; x++) for (let y = by0; y <= by1; y++) if (lum[idx(x, y)] < darkTH) { t = Math.min(t, y); b = Math.max(b, y); }
      return b - t + 1;
    });
    const gaps = [];
    for (let k = 1; k < runs.length; k++) gaps.push(runs[k][0] - runs[k - 1][1] - 1);
    console.log(`glyph runs: ${runs.length}; widths=[${runs.map(r => r[1] - r[0] + 1).join(',')}]`);
    console.log(`run heights=[${heights.join(',')}]`);
    const sorted = [...heights].sort((a, b) => a - b);
    const q75 = sorted[Math.floor(sorted.length * 0.75)] || sorted[sorted.length - 1];
    const tall = heights.filter(v => v >= q75);
    const capH = tall.reduce((a, b) => a + b, 0) / tall.length;
    console.log(`gaps=[${gaps.join(',')}]`);
    console.log(`height distribution: min=${sorted[0]} med=${sorted[sorted.length >> 1]} max=${sorted[sorted.length - 1]}; tall-glyph (cap/ascender) height ~${capH.toFixed(1)}px`);
    console.log(`font-size estimate: capH/0.72 ~ ${(capH / 0.72).toFixed(1)}px ; capH/0.70 ~ ${(capH / 0.70).toFixed(1)}px ; bbox-based (incl descenders) ${((by1 - by0 + 1) / 0.95).toFixed(1)}..${((by1 - by0 + 1) / 1.0).toFixed(1)}px`);
    // card-white detection in the same band (r,g,b >= 252)
    let wn = 0, wx0 = w, wx1 = -1, wy0 = h, wy1 = -1;
    for (let y = y0; y <= y1 && y < h; y++) for (let x = 0; x < w; x++) {
      const i = idx(x, y) * 4;
      if (img.pixels[i] >= 252 && img.pixels[i + 1] >= 252 && img.pixels[i + 2] >= 252) { wn++; wx0 = Math.min(wx0, x); wx1 = Math.max(wx1, x); wy0 = Math.min(wy0, y); wy1 = Math.max(wy1, y); }
    }
    console.log(`card-white pixels (>=252,252,252) in band: ${wn}${wn ? ' bbox x[' + wx0 + '..' + wx1 + '] y[' + wy0 + '..' + wy1 + '] (' + (wx1 - wx0 + 1) + 'x' + (wy1 - wy0 + 1) + ')' : ''}`);
    // vertical profile condensed
    let prof = 'row counts: ';
    for (let y = by0; y <= by1; y++) prof += rowC[y - y0] + ' ';
    console.log(prof);
    console.log('art:');
    console.log(zoomArt(img, lum, sat, Math.max(0, bx0 - 4), Math.max(0, by0 - 3), Math.min(w - 1, bx1 + 4), Math.min(h - 1, by1 + 3), 'lum', 3));
    return { bx0, bx1, by0, by1, n, capH };
  }

  const l1 = lineReport('5. LINE 1', 10, 58, 215);
  const l2 = lineReport('6. LINE 2', 58, 118, 215);
  if (l1 && l2) {
    console.log(`\nline1->line2 vertical gap: ${l2.by0 - l1.by1}px edge-to-edge`);
    const d1 = darkestColor(img, lum, i => (i / w | 0) >= l1.by0 && (i / w | 0) <= l1.by1 && lum[i] < 215);
    const d2 = darkestColor(img, lum, i => (i / w | 0) >= l2.by0 && (i / w | 0) <= l2.by1 && lum[i] < 215);
    const m1 = meanColor(img, i => (i / w | 0) >= l1.by0 && (i / w | 0) <= l1.by1 && lum[i] < 215);
    const m2 = meanColor(img, i => (i / w | 0) >= l2.by0 && (i / w | 0) <= l2.by1 && lum[i] < 215);
    console.log(`contrast: line1 darkest=${hex(d1)} mean=${hex(m1)} | line2 darkest=${hex(d2)} mean=${hex(m2)}`);
    console.log(`density: line1 ${l1.n}px over ${(l1.bx1 - l1.bx0 + 1)}px width; line2 ${l2.n}px over ${(l2.bx1 - l2.bx0 + 1)}px width`);
  }
}

analyzeButtons(DIR + 'r-buttons.png');
analyzeCardBottom(DIR + 'r-card-bottom.png');
analyzeSubtitle(DIR + 'r-subtitle.png');
