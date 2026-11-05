// Downscale reference 1672x941 -> 1280x720 (box average) and diff against my render.
import { decodePNG, px } from './png-decode.mjs';
import { writeFileSync } from 'node:fs';

const ref = decodePNG('target-slide7.png');
const mine = decodePNG('mine-1280.png');
const W = 1280, H = 720;
const sx = ref.width / W, sy = ref.height / H;

// box-average downscale
const small = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < W; x++) {
        const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        let r = 0, g = 0, b = 0, n = 0;
        for (let yy = y0; yy < y1 && yy < ref.height; yy++)
            for (let xx = x0; xx < x1 && xx < ref.width; xx++) {
                const c = px(ref, xx, yy); r += c[0]; g += c[1]; b += c[2]; n++;
            }
        const o = (y * W + x) * 3;
        small[o] = r / n; small[o + 1] = g / n; small[o + 2] = b / n;
    }
}
writeFileSync('ref-1280.raw', small);

// diff metrics
let total = 0, count = 0, worst = 0;
const cell = 16; // 80x45 grid
const grid = Array.from({ length: Math.ceil(H / cell) }, () => Array(Math.ceil(W / cell)).fill(0));
const gridN = Array.from({ length: Math.ceil(H / cell) }, () => Array(Math.ceil(W / cell)).fill(0));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const d = (Math.abs(small[o] - mine.data[o]) + Math.abs(small[o + 1] - mine.data[o + 1]) + Math.abs(small[o + 2] - mine.data[o + 2])) / 3;
    total += d; count++;
    const gy = Math.min(Math.floor(y / cell), grid.length - 1), gx = Math.min(Math.floor(x / cell), grid[0].length - 1);
    grid[gy][gx] += d; gridN[gy][gx]++;
    if (d > worst) worst = d;
}
console.log('mean delta:', (total / count).toFixed(2), 'worst:', worst.toFixed(1));
// ASCII severity map: . <4, - <10, + <25, # >=25
let out = '';
for (let gy = 0; gy < grid.length; gy++) {
    let line = '';
    for (let gx = 0; gx < grid[0].length; gx++) {
        const v = grid[gy][gx] / gridN[gy][gx];
        line += v < 4 ? '.' : v < 10 ? '-' : v < 25 ? '+' : '#';
    }
    out += String(gy * cell).padStart(4) + ' ' + line + '\n';
}
console.log(out);
