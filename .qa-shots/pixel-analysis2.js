'use strict';
/* Pass 2: focused measurements based on pass-1 findings. */
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(file) {
  const buf = fs.readFileSync(file);
  let off = 8, ihdr = null; const idats = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString('latin1');
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data; else if (type === 'IDAT') idats.push(data); else if (type === 'IEND') break;
    off += 12 + len;
  }
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4, stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let pos = 0, prev = null;
  for (let y = 0; y < height; y++) {
    const f = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[x - bpp + y * stride] : 0;
      const b = prev ? prev[x] : 0;
      const c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v = raw[pos + x];
      if (f === 1) v = (v + a) & 255; else if (f === 2) v = (v + b) & 255;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c))) & 255; }
      out[y * stride + x] = v;
    }
    pos += stride; prev = out.subarray(y * stride, (y + 1) * stride);
  }
  return { width, height, pixels: out };
}

function load(file) {
  const img = decodePNG(file);
  const w = img.width, h = img.height, p = img.pixels;
  const lum = new Float32Array(w * h), sat = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b; sat[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  img.lum = lum; img.sat = sat; return img;
}
const fmt = c => c ? 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')' : 'n/a';
function stats(img, pred) {
  const w = img.width, h = img.height, p = img.pixels;
  let x0 = w, x1 = -1, y0 = h, y1 = -1, n = 0, r = 0, g = 0, b = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (pred(x, y, i)) { n++; r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return n ? { n, x0, x1, y0, y1, mean: [r / n, g / n, b / n] } : null;
}
function rowCounts(img, pred, y0, y1) {
  const w = img.width, arr = [];
  for (let y = y0; y <= y1; y++) { let c = 0; for (let x = 0; x < w; x++) if (pred(x, y, y * w + x)) c++; arr.push(c); }
  return arr;
}
const median = a => !a.length ? null : [...a].sort((x, y) => x - y)[a.length >> 1];
function art2x(img, X0, Y0, X1, Y1, mode) {
  const w = img.width, { lum, sat, pixels: p } = img;
  const rows = [];
  for (let y = Y0; y <= Y1; y++) {
    let line = String(y).padStart(3) + '|';
    for (let x = X0; x <= X1; x++) {
      let ch;
      if (x < 0 || x >= w) ch = '?';
      else {
        const i = y * w + x;
        if (mode === 'lav') ch = (sat[i] >= 25) ? '#' : ((p[i*4+2] - p[i*4] >= 4 && lum[i] >= 200) ? 'o' : (lum[i] < 245 ? '.' : ' '));
        else if (sat[i] >= 25) ch = 'O';
        else if (lum[i] < 120) ch = '#';
        else if (lum[i] < 170) ch = '+';
        else if (lum[i] < 245) ch = '.';
        else ch = ' ';
      }
      line += ch + ch;
    }
    rows.push(line);
  }
  return rows.join('\n');
}

/* ================= HEADER ================= */
{
  const img = load('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/r-header2.png');
  const { width: w, height: h, lum, sat, pixels: p } = img;
  const px = (x, y) => { const i = (y * w + x) * 4; return [p[i], p[i + 1], p[i + 2]]; };

  console.log('### HEADER pass2 ###');

  /* --- icon edge checks --- */
  console.log('\n[icon] left-edge check: colored(sat>=18) rows count per column x=0..6:',
    [0, 1, 2, 3, 4, 5, 6].map(x => { let c = 0; for (let y = 0; y < h; y++) if (sat[y * w + x] >= 18) c++; return c; }).join(','));
  console.log('[icon] color at (0,50):', fmt(px(0, 50)), ' (1,50):', fmt(px(1, 50)), ' (2,50):', fmt(px(2, 50)));
  console.log('[icon] extra gradient samples (row y=24):', [10, 25, 40, 55, 70].map(x => 'x' + x + '=' + fmt(px(x, 24))).join(' '));
  console.log('[icon] extra gradient samples (col x=75):', [26, 40, 55, 70, 90].map(y => 'y' + y + '=' + fmt(px(75, y))).join(' '));
  // radius from top rows using hole-free zone: rows 22..38
  const rowL = [], rowR = [];
  for (let y = 22; y <= 40; y++) { let l = -1, r = -1; for (let x = 0; x < 78; x++) if (sat[y * w + x] >= 18) { if (l < 0) l = x; r = x; } rowL.push(l); rowR.push(r); }
  console.log('[icon] top rows y22..40 left/rightmost colored x:', rowL.map((l, k) => (l < 0 ? '-' : l) + '..' + rowR[k]).join('  '));

  /* --- label --- */
  console.log('\n[label] analysis (x 79..484, y 35..100, lum<170)');
  const labP = (x, y, i) => x >= 79 && x <= 484 && y >= 35 && y <= 100 && lum[i] < 170;
  const st = stats(img, labP);
  console.log('bbox x[' + st.x0 + '..' + st.x1 + '] y[' + st.y0 + '..' + st.y1 + '] = ' + (st.x1 - st.x0 + 1) + 'x' + (st.y1 - st.y0 + 1) + 'px, n=' + st.n);
  const core = (x, y, i) => x >= st.x0 && x <= st.x1 && y >= st.y0 && y <= st.y1 && lum[i] < 140;
  const stc = stats(img, core);
  console.log('core(lum<140) bbox x[' + stc.x0 + '..' + stc.x1 + '] y[' + stc.y0 + '..' + stc.y1 + '] = ' + (stc.x1 - stc.x0 + 1) + 'x' + (stc.y1 - stc.y0 + 1) + 'px mean=' + fmt(stc.mean));
  const rc = rowCounts(img, (x, y, i) => core(x, y, i), st.y0, st.y1);
  const maxRC = Math.max(...rc);
  console.log('row counts (lum<140): ' + rc.map((c, k) => (st.y0 + k) + ':' + c).join(' '));
  let t0 = -1, t1 = -1;
  rc.forEach((c, k) => { if (c >= 0.3 * maxRC) { if (t0 < 0) t0 = k; t1 = k; } });
  console.log('cap/dense band: y[' + (st.y0 + t0) + '..' + (st.y0 + t1) + '] height=' + (t1 - t0 + 1) + 'px');
  // glyph runs
  const colHas = [];
  for (let x = stc.x0; x <= stc.x1; x++) { let c = 0; for (let y = stc.y0; y <= stc.y1; y++) if (lum[y * w + x] < 140) c++; colHas.push(c > 0); }
  const runs = []; let s = -1;
  colHas.forEach((v, k) => { if (v && s < 0) s = k; if (!v && s >= 0) { runs.push([stc.x0 + s, stc.x0 + k - 1]); s = -1; } });
  if (s >= 0) runs.push([stc.x0 + s, stc.x1]);
  const gaps = []; for (let k = 1; k < runs.length; k++) gaps.push(runs[k][0] - runs[k - 1][1] - 1);
  console.log('glyph runs(' + runs.length + '): ' + runs.map(r => r[0] + '-' + r[1] + '(' + (r[1] - r[0] + 1) + ')').join(' '));
  console.log('gaps: [' + gaps.join(',') + ']  median gap=' + median(gaps) + 'px');
  console.log('--- label art part1 (x79..280) ---');
  console.log(art2x(img, 79, st.y0 - 2, 280, st.y1 + 2, 'lum'));
  console.log('--- label art part2 (x281..484) ---');
  console.log(art2x(img, 281, st.y0 - 2, 484, st.y1 + 2, 'lum'));

  /* --- divider --- */
  console.log('\n[divider] per-row stats y100..118 (lum<248):');
  for (let y = 100; y <= 118; y++) {
    let x0 = -1, x1 = -1, n = 0, r = 0, g = 0, b = 0;
    for (let x = 0; x < w; x++) { const i = y * w + x; if (lum[i] < 248) { n++; r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; if (x0 < 0) x0 = x; x1 = x; } }
    if (n > 5) console.log('  y=' + y + ' x[' + x0 + '..' + x1 + '] n=' + n + ' mean=' + fmt(n ? [r / n, g / n, b / n] : null));
  }
  console.log('divider color samples: x2=' + fmt(px(2, 108)) + ' x100=' + fmt(px(100, 108)) + ' x294=' + fmt(px(294, 108)) + ' x450=' + fmt(px(450, 108)) + ' x585=' + fmt(px(585, 108)));
  console.log('rows y107..109 at x294:', [107, 108, 109].map(y => 'y' + y + '=' + fmt(px(294, y))).join(' '));

  /* --- pill --- */
  console.log('\n[pill] refined');
  const lav = (x, y, i) => { const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2]; return r >= 222 && r <= 252 && g >= 222 && g <= 252 && b >= 228 && b <= 255 && b - r >= 4 && b >= g; };
  console.log('pill rightmost lavender x per row:', Array.from({ length: 80 - 26 + 1 }, (_, k) => { const y = 26 + k; let r = -1; for (let x = 486; x < w; x++) if (lav(x, y, y * w + x)) r = x; return r; }).join(','));
  console.log('colors near right edge x583..587 at y=53:', [583, 584, 585, 586, 587].map(x => 'x' + x + '=' + fmt(px(x, 53))).join(' '));
  console.log('colors x486..490 at y=53 (left edge):', [486, 487, 488, 489, 490].map(x => 'x' + x + '=' + fmt(px(x, 53))).join(' '));
  // left radius from column heights of lav mask cols 486..510
  const colH = [];
  for (let x = 486; x <= 510; x++) { let t = -1, b2 = -1; for (let y = 26; y <= 80; y++) if (lav(x, y, y * w + x)) { if (t < 0) t = y; b2 = y; } colH.push(t < 0 ? 0 : b2 - t + 1); }
  console.log('pill column heights x486..510:', colH.join(','));
  // pill text core
  const pt = (x, y, i) => x >= 486 && x <= 587 && y >= 26 && y <= 80 && lum[i] < 150;
  const spt = stats(img, pt);
  console.log('pill text core bbox x[' + spt.x0 + '..' + spt.x1 + '] y[' + spt.y0 + '..' + spt.y1 + '] = ' + (spt.x1 - spt.x0 + 1) + 'x' + (spt.y1 - spt.y0 + 1) + 'px mean=' + fmt(spt.mean));
  const rcpt = rowCounts(img, pt, spt.y0, spt.y1);
  console.log('pill text row counts:', rcpt.map((c, k) => (spt.y0 + k) + ':' + c).join(' '));
  console.log('--- pill text art 2x (x500..587) ---');
  console.log(art2x(img, 500, 38, 587, 70, 'lum'));
}

/* ================= QUESTION ================= */
{
  const img = load('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/r-question2.png');
  const { width: w, height: h, lum, sat, pixels: p } = img;
  const px = (x, y) => { const i = (y * w + x) * 4; return [p[i], p[i + 1], p[i + 2]]; };
  console.log('\n### QUESTION pass2 ###');

  const q = (x, y, i) => y >= 18 && y <= 70 && lum[i] < 120;   // question core
  const sq = stats(img, q);
  console.log('[question core lum<120] bbox x[' + sq.x0 + '..' + sq.x1 + '] y[' + sq.y0 + '..' + sq.y1 + '] = ' + (sq.x1 - sq.x0 + 1) + 'x' + (sq.y1 - sq.y0 + 1) + 'px mean=' + fmt(sq.mean));
  const rcq = rowCounts(img, q, sq.y0, sq.y1);
  console.log('row counts:', rcq.map((c, k) => (sq.y0 + k) + ':' + c).join(' '));
  const mq = Math.max(...rcq);
  let t0 = -1, t1 = -1; rcq.forEach((c, k) => { if (c >= 0.3 * mq) { if (t0 < 0) t0 = k; t1 = k; } });
  console.log('dense band y[' + (sq.y0 + t0) + '..' + (sq.y0 + t1) + '] height=' + (t1 - t0 + 1) + 'px (cap-height approx)');
  console.log('center=' + ((sq.x0 + sq.x1) / 2).toFixed(1) + ' vs crop center ' + w / 2);
  // right edge detail
  let edge = [];
  for (let y = sq.y0; y <= sq.y1; y++) for (let x = 570; x < w; x++) if (lum[y * w + x] < 120) edge.push(x + ',' + y);
  console.log('dark px with x>=570 (first 40):', edge.slice(0, 40).join(' '), ' total:', edge.length);

  const hp = (x, y, i) => y >= 80 && y <= 115 && lum[i] < 160;  // helper core
  const sh = stats(img, hp);
  console.log('\n[helper core lum<160] bbox x[' + sh.x0 + '..' + sh.x1 + '] y[' + sh.y0 + '..' + sh.y1 + '] = ' + (sh.x1 - sh.x0 + 1) + 'x' + (sh.y1 - sh.y0 + 1) + 'px mean=' + fmt(sh.mean));
  const rch = rowCounts(img, hp, sh.y0, sh.y1);
  console.log('row counts:', rch.map((c, k) => (sh.y0 + k) + ':' + c).join(' '));
  const mh = Math.max(...rch);
  let u0 = -1, u1 = -1; rch.forEach((c, k) => { if (c >= 0.3 * mh) { if (u0 < 0) u0 = k; u1 = k; } });
  console.log('dense band y[' + (sh.y0 + u0) + '..' + (sh.y0 + u1) + '] height=' + (u1 - u0 + 1) + 'px (cap-height approx)');
  console.log('center=' + ((sh.x0 + sh.x1) / 2).toFixed(1) + ' vs crop center ' + w / 2);
  console.log('gap question.core bottom y=' + sq.y1 + ' -> helper.core top y=' + sh.y0 + ': ' + (sh.y0 - sq.y1 - 1) + ' empty px (' + (sh.y0 - sq.y1) + ' row-step)');
  // sample colors
  console.log('question darkest sample colors:', [px(sq.x0 + 30, sq.y0 + 10), px((sq.x0 + sq.x1) >> 1, sq.y0 + 10)].map(fmt).join(' '));
  console.log('helper darkest sample colors:', [px(sh.x0 + 30, sh.y0 + 5), px((sh.x0 + sh.x1) >> 1, sh.y0 + 5)].map(fmt).join(' '));
  console.log('--- question art 2x (x24..180, rows 23..46) ---');
  console.log(art2x(img, 24, 23, 180, 46, 'lum'));
  console.log('--- helper art 2x (x80..230) ---');
  console.log(art2x(img, 80, sh.y0 - 2, 230, sh.y1 + 2, 'lum'));
}
