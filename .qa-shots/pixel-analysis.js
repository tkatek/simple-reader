'use strict';
/* Pixel-level analysis of QA crop PNGs (no vision models).
   Minimal PNG decoder (8-bit, color types 0/2/3/4/6, interlace 0/1, zlib IDAT) + heuristics. */
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

/* ---------- helpers ---------- */
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
const median = a => !a.length ? null : [...a].sort((x, y) => x - y)[a.length >> 1];
const fmt = c => c ? 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')' : 'n/a';

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
      const tot = Object.values(cls).reduce((a, b2) => a + b2, 0);
      const best = Object.entries(cls).sort((a, b2) => b2[1] - a[1])[0][0];
      line += { white: ' ', grey: '.', dark: '#', color: 'O', lav: 'o' }[best === 'white' && tot ? 'white' : best];
    }
    lines.push(String(y).padStart(3) + '|' + line);
  }
  return lines.join('\n');
}

function zoomArt(img, lum, sat, x0, y0, x1, y1, mode) {
  const w = img.width, p = img.pixels;
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let line = String(y).padStart(3) + '|';
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
      if (mode === 'sat') {
        line += sat[i] >= 25 ? '#' : (lum[i] < 245 ? '.' : ' ');
      } else {
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
function meanColor(img, pred) {
  const w = img.width, h = img.height, p = img.pixels;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < w * h; i++) if (pred(i)) { r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; n++; }
  return n ? [r / n, g / n, b / n] : null;
}
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

/* ---------- header analysis ---------- */
function analyzeHeader(file) {
  console.log('================ HEADER: ' + path.basename(file) + ' ================');
  const img = decodePNG(file);
  console.log('meta:', JSON.stringify(img.meta));
  const { width: w, height: h, pixels: p } = img;
  const { lum, sat } = makeMaps(img);
  const idx = (x, y) => y * w + x;

  console.log('\n--- overview (6px blocks: # dark, O colored, o lavender, . grey) ---');
  console.log(overview(img, lum, sat, 6));

  /* 1. icon */
  const satMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (sat[i] >= 25) satMask[i] = 1;
  const iconBlobs = blobs(satMask, w, h, 40).sort((a, b) => b.count - a.count);
  console.log('\n--- 1. colored blobs (sat>=25, area>=40) ---');
  for (const b of iconBlobs.slice(0, 5))
    console.log(`bbox x[${b.minx}..${b.maxx}] y[${b.miny}..${b.maxy}] = ${b.maxx - b.minx + 1}x${b.maxy - b.miny + 1}px, area=${b.count}`);
  const ic = iconBlobs[0];
  if (ic) {
    const L = ic.minx, R = ic.maxx, T = ic.miny, B = ic.maxy;
    const IW = R - L + 1, IH = B - T + 1;
    // per-row extents inside bbox (relaxed sat threshold for AA edges)
    const rowL = [], rowR = [];
    for (let y = T; y <= B; y++) {
      let l = -1, r = -1;
      for (let x = L; x <= R; x++) if (sat[idx(x, y)] >= 18) { if (l < 0) l = x; r = x; }
      rowL[y - T] = l; rowR[y - T] = r;
    }
    const rowW = rowL.map((l, k) => (l < 0 ? 0 : rowR[k] - l + 1));
    const fullW = Math.max(...rowW);
    let rTop = null, rBot = null;
    for (let k = 0; k < rowW.length; k++) if (rowW[k] >= fullW - 2) { rTop = k; break; }
    for (let k = rowW.length - 1; k >= 0; k--) if (rowW[k] >= fullW - 2) { rBot = rowW.length - 1 - k; break; }
    const colT = [], colB = [];
    for (let x = L; x <= R; x++) {
      let t = -1, b2 = -1;
      for (let y = T; y <= B; y++) if (sat[idx(x, y)] >= 18) { if (t < 0) t = y; b2 = y; }
      colT[x - L] = t; colB[x - L] = b2;
    }
    const colH = colT.map((t, k) => (t < 0 ? 0 : colB[k] - t + 1));
    const fullH = Math.max(...colH);
    let rLft = null, rRgt = null;
    for (let k = 0; k < colH.length; k++) if (colH[k] >= fullH - 2) { rLft = k; break; }
    for (let k = colH.length - 1; k >= 0; k--) if (colH[k] >= fullH - 2) { rRgt = colH.length - 1 - k; break; }
    console.log(`icon bbox: x[${L}..${R}] y[${T}..${B}] => ${IW}x${IH}px (aspect ${IW / IH})`);
    console.log('row-width profile (top 14 rows):', rowW.slice(0, 14).join(','));
    console.log('col-height profile (left 14 cols):', colH.slice(0, 14).join(','));
    console.log(`corner-radius estimate: top=${rTop}px bottom=${rBot}px left=${rLft}px right=${rRgt}px => r ~= ${Math.round((rTop + rBot + rLft + rRgt) / 4)}px; rounded-square=${Math.abs(IW - IH) <= 3 ? 'YES' : 'no'}`);
    const m = Math.max(3, Math.round(((rTop + rBot + rLft + rRgt) / 4) * 0.7));
    console.log(`gradient samples (inset ${m}px, 3x3 avg):`);
    console.log('  top-left    ', fmt(avgAt(img, L + m, T + m, 1)));
    console.log('  top-right   ', fmt(avgAt(img, R - m, T + m, 1)));
    console.log('  bottom-left ', fmt(avgAt(img, L + m, B - m, 1)));
    console.log('  bottom-right', fmt(avgAt(img, R - m, B - m, 1)));
    console.log('  center      ', fmt(avgAt(img, (L + R) >> 1, (T + B) >> 1, 1)));
    console.log('  top-center  ', fmt(avgAt(img, (L + R) >> 1, T + m, 1)));
    console.log('  bot-center  ', fmt(avgAt(img, (L + R) >> 1, B - m, 1)));
    console.log('  left-mid    ', fmt(avgAt(img, L + m, (T + B) >> 1, 1)));
    console.log('  right-mid   ', fmt(avgAt(img, R - m, (T + B) >> 1, 1)));
    console.log('--- icon shape art (sat mask) ---');
    console.log(zoomArt(img, lum, sat, L - 1, T - 1, R + 1, B + 1, 'sat'));
  }

  /* 3. lavender pill (before label so label region can exclude it) */
  const lavMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
    if (r >= 222 && r <= 252 && g >= 222 && g <= 252 && b >= 228 && b <= 255 && b - r >= 4 && b >= g) lavMask[i] = 1;
  }
  const lavBlobs = blobs(lavMask, w, h, 40).sort((a, b) => b.count - a.count);
  console.log('\n--- 3. lavender-ish blobs (b-r>=4, area>=40) ---');
  let pill = null, dividerLav = null;
  for (const b of lavBlobs) {
    const bw = b.maxx - b.minx + 1, bh = b.maxy - b.miny + 1;
    console.log(`bbox x[${b.minx}..${b.maxx}] y[${b.miny}..${b.maxy}] = ${bw}x${bh}px area=${b.count} fill=${(b.count / (bw * bh)).toFixed(2)}`);
    if (bw > 300 && bh <= 6) dividerLav = b;
    else if (!pill && bw >= 15 && bh >= 12 && bw <= 200) pill = b;
  }
  if (pill) {
    const bw = pill.maxx - pill.minx + 1, bh = pill.maxy - pill.miny + 1;
    // radius via row widths of lav mask within bbox
    const rl = [], rr = [];
    for (let y = pill.miny; y <= pill.maxy; y++) {
      let l = -1, r = -1;
      for (let x = pill.minx; x <= pill.maxx; x++) if (lavMask[idx(x, y)]) { if (l < 0) l = x; r = x; }
      rl.push(l); rr.push(r);
    }
    const rw = rl.map((l, k) => (l < 0 ? 0 : rr[k] - l + 1));
    const fullP = Math.max(...rw);
    let prT = null;
    for (let k = 0; k < rw.length; k++) if (rw[k] >= fullP - 1) { prT = k; break; }
    console.log(`PILL: bbox x[${pill.minx}..${pill.maxx}] y[${pill.miny}..${pill.maxy}] = ${bw}x${bh}px; row-widths top8: ${rw.slice(0, 8).join(',')}; radius ~${prT}px (capsule if ~${Math.round(bh / 2)})`);
    console.log('  pill bg color (mean):', fmt(meanColor(img, i => lavMask[i])));
    // text inside pill
    const inPill = i => { const x = i % w, y = (i / w) | 0; return x >= pill.minx && x <= pill.maxx && y >= pill.miny && y <= pill.maxy && lum[i] < 175; };
    let tx0 = w, tx1 = -1, ty0 = h, ty1 = -1, n = 0;
    for (let y = pill.miny; y <= pill.maxy; y++) for (let x = pill.minx; x <= pill.maxx; x++) if (inPill(idx(x, y))) {
      tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); n++;
    }
    if (n) {
      console.log(`  pill text bbox x[${tx0}..${tx1}] y[${ty0}..${ty1}] (${tx1 - tx0 + 1}x${ty1 - ty0 + 1}px, ${n}px) darkest=${fmt(darkestColor(img, lum, inPill))} mean=${fmt(meanColor(img, inPill))}`);
      console.log('  --- pill text art ---');
      console.log(zoomArt(img, lum, sat, pill.minx - 2, pill.miny - 2, pill.maxx + 2, pill.maxy + 2, 'lum'));
    } else console.log('  no text found inside pill mask');
  } else console.log('no pill-like lavender blob found');

  /* 2. label text right of icon */
  console.log('\n--- 2. label text (dark, right of icon, left of pill/divider) ---');
  const labX1 = pill ? pill.minx - 4 : w - 4;
  const isLabel = i => { const x = i % w, y = (i / w) | 0; return x > (ic ? ic.maxx + 3 : 0) && x < labX1 && lum[i] < 130; };
  let lx0 = w, lx1 = -1, ly0 = h, ly1 = -1;
  const rowCounts = [];
  for (let y = 0; y < h; y++) {
    let c = 0;
    for (let x = (ic ? ic.maxx + 3 : 0); x < labX1; x++) if (lum[idx(x, y)] < 130) {
      c++; lx0 = Math.min(lx0, x); lx1 = Math.max(lx1, x); ly0 = Math.min(ly0, y); ly1 = Math.max(ly1, y);
    }
    rowCounts.push(c);
  }
  if (lx1 < 0) console.log('no dark label pixels found');
  else {
    const maxRC = Math.max(...rowCounts);
    let t0 = -1, t1 = -1;
    for (let y = ly0; y <= ly1; y++) if (rowCounts[y] >= 0.3 * maxRC) { if (t0 < 0) t0 = y; t1 = y; }
    console.log(`label dark bbox x[${lx0}..${lx1}] y[${ly0}..${ly1}] = ${lx1 - lx0 + 1}x${ly1 - ly0 + 1}px; full height=${ly1 - ly0 + 1}px, density-trimmed height=${t1 - t0 + 1}px (rows y[${t0}..${t1}])`);
    console.log('label darkest color:', fmt(darkestColor(img, lum, isLabel)));
    // glyph column runs
    const colHas = [];
    for (let x = lx0; x <= lx1; x++) { let c = 0; for (let y = ly0; y <= ly1; y++) if (lum[idx(x, y)] < 130) c++; colHas.push(c > 0); }
    const runs = []; let s = -1;
    for (let k = 0; k < colHas.length; k++) {
      if (colHas[k] && s < 0) s = k;
      if (!colHas[k] && s >= 0) { runs.push([lx0 + s, lx0 + k - 1]); s = -1; }
    }
    if (s >= 0) runs.push([lx0 + s, lx1]);
    const widths = runs.map(r => r[1] - r[0] + 1);
    const gaps = [];
    for (let k = 1; k < runs.length; k++) gaps.push(runs[k][0] - runs[k - 1][1] - 1);
    console.log(`glyph runs: ${runs.length}; widths=[${widths.join(',')}]`);
    console.log(`gaps between adjacent glyphs=[${gaps.join(',')}]`);
    const intra = gaps.filter(g => g <= 8);
    console.log(`median glyph width=${median(widths)}px, median intra-word gap=${median(intra)}px, word gaps(>8px)=${gaps.filter(g => g > 8).length}`);
    console.log('--- label art ---');
    console.log(zoomArt(img, lum, sat, Math.max(0, lx0 - 3), Math.max(0, ly0 - 3), Math.min(w - 1, lx1 + 3), Math.min(h - 1, ly1 + 3), 'lum'));
  }

  /* 4. divider */
  console.log('\n--- 4. divider line ---');
  let found = [];
  for (let y = 0; y < h; y++) {
    let bestLen = 0, bs2 = -1, be = -1, runS = -1;
    for (let x = 0; x < w; x++) {
      if (lum[idx(x, y)] < 246) { if (runS < 0) runS = x; }
      else { if (runS >= 0 && x - runS > bestLen) { bestLen = x - runS; bs2 = runS; be = x - 1; } runS = -1; }
    }
    if (runS >= 0 && w - runS > bestLen) { bestLen = w - runS; bs2 = runS; be = w - 1; }
    if (bestLen >= 330) found.push({ y, x0: bs2, x1: be, len: bestLen });
  }
  // merge consecutive
  const divs = [];
  for (const f of found) {
    const prev2 = divs[divs.length - 1];
    if (prev2 && f.y === prev2.yEnd + 1) { prev2.yEnd = f.y; prev2.rows.push(f); }
    else divs.push({ yStart: f.y, yEnd: f.y, rows: [f] });
  }
  for (const d of divs) {
    const f = d.rows[0];
    const col = meanColor(img, i => { const y = (i / w) | 0, x = i % w; return y >= d.yStart && y <= d.yEnd && x >= f.x0 && x <= f.x1 && lum[i] < 246; });
    console.log(`divider: y=${d.yStart}${d.yEnd !== d.yStart ? '..' + d.yEnd : ''} (thickness ${d.yEnd - d.yStart + 1}px), x ${f.x0}..${f.x1} (len ${f.len}px of ${w}), color=${fmt(col)}, spans-full-width=${f.x0 <= 2 && f.x1 >= w - 3 ? 'YES' : 'no'}`);
  }
  if (!divs.length) console.log('no wide horizontal line found');
}

/* ---------- question crop analysis ---------- */
function analyzeQuestion(file) {
  console.log('\n================ QUESTION: ' + path.basename(file) + ' ================');
  const img = decodePNG(file);
  console.log('meta:', JSON.stringify(img.meta));
  const { width: w, height: h } = img;
  const { lum, sat } = makeMaps(img);
  const idx = (x, y) => y * w + x;
  console.log('\n--- overview ---');
  console.log(overview(img, lum, sat, 6));

  const maskTH = 215; // non-white-ish (question dark + helper grey + AA)
  const rowCount = [];
  for (let y = 0; y < h; y++) {
    let c = 0; for (let x = 0; x < w; x++) if (lum[idx(x, y)] < maskTH) c++;
    rowCount.push(c);
  }
  // bands separated by >=3 empty rows
  const bands = [];
  let cur = null;
  for (let y = 0; y < h; y++) {
    const on = rowCount[y] > 0;
    if (on) {
      if (!cur) cur = { y0: y, y1: y };
      else cur.y1 = y;
    } else if (cur && y - cur.y1 >= 3) { bands.push(cur); cur = null; }
  }
  if (cur) bands.push(cur);
  console.log(`\nrow bands (lum<${maskTH}, gap>=3): ${bands.length}`);
  const bandInfo = [];
  for (const b of bands) {
    let x0 = w, x1 = -1, n = 0, empty = true;
    const rcs = [];
    for (let y = b.y0; y <= b.y1; y++) {
      let rc = 0;
      for (let x = 0; x < w; x++) if (lum[idx(x, y)] < maskTH) {
        rc++; n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      }
      rcs.push(rc);
    }
    const maxRC = Math.max(...rcs);
    let t0 = -1, t1 = -1;
    for (let k = 0; k < rcs.length; k++) if (rcs[k] >= 0.35 * maxRC) { if (t0 < 0) t0 = k; t1 = k; }
    const inBand = i => { const x = i % w, y = (i / w) | 0; return y >= b.y0 && y <= b.y1 && x >= x0 && x <= x1 && lum[i] < maskTH; };
    const cx = (x0 + x1) / 2, off = cx - w / 2;
    bandInfo.push({
      y0: b.y0, y1: b.y1, x0, x1, n,
      hFull: b.y1 - b.y0 + 1, hTrim: t1 - t0 + 1,
      mean: meanColor(img, inBand), dark: darkestColor(img, lum, inBand),
      cx, off,
    });
    console.log(`band y[${b.y0}..${b.y1}] x[${x0}..${x1}] = ${x1 - x0 + 1}x${b.y1 - b.y0 + 1}px (${n}px dark) fullH=${b.y1 - b.y0 + 1} trimmedH=${t1 - t0 + 1} center=${cx.toFixed(1)} (crop center ${w / 2}) offset=${off >= 0 ? '+' : ''}${off.toFixed(1)}px mean=${fmt(bandInfo[bandInfo.length - 1].mean)} darkest=${fmt(bandInfo[bandInfo.length - 1].dark)}`);
  }
  if (bandInfo.length >= 2) {
    const q = bandInfo[0], hp = bandInfo[1];
    console.log(`vertical gap question bottom (y=${q.y1}) -> helper top (y=${hp.y0}): ${hp.y0 - q.y1} px edge-to-edge (${hp.y0 - q.y1 - 1} fully-empty rows)`);
  }
  for (const bi of bandInfo) {
    console.log(`\n--- band y[${bi.y0}..${bi.y1}] art ---`);
    console.log(zoomArt(img, lum, sat, Math.max(0, bi.x0 - 4), Math.max(0, bi.y0 - 3), Math.min(w - 1, bi.x1 + 4), Math.min(h - 1, bi.y1 + 3), 'lum'));
  }
}

analyzeHeader('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/r-header2.png');
analyzeQuestion('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/r-question2.png');
