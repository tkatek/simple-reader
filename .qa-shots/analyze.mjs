import { decodePNG, px, hex } from './png-decode.mjs';

const img = decodePNG(process.argv[2] || '.qa-shots/target-slide7.png');
console.log('size', img.width + 'x' + img.height);

// Background guess: corner pixel
console.log('corner colors:', hex(px(img, 3, 3)), hex(px(img, img.width - 4, 3)), hex(px(img, 3, img.height - 4)), hex(px(img, img.width - 4, img.height - 4)));
console.log('center:', hex(px(img, img.width >> 1, img.height >> 1)));

// Row profile: for each row, count non-background pixels (distance from corner color > 12)
const bg = px(img, 3, 3);
const isBG = (c) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) < 30;
let rows = [];
for (let y = 0; y < img.height; y++) {
    let n = 0;
    for (let x = 0; x < img.width; x += 2) if (!isBG(px(img, x, y))) n++;
    rows.push(n);
}
// find content bands (consecutive rows with >2 non-bg samples)
let bands = [], start = -1;
for (let y = 0; y < img.height; y++) {
    const on = rows[y] > 2;
    if (on && start < 0) start = y;
    if ((!on || y === img.height - 1) && start >= 0) { bands.push([start, y]); start = -1; }
}
console.log('content bands (y ranges):');
for (const [a, b] of bands) console.log('  ', a, '-', b, ' h=' + (b - a));

// For each band, horizontal extent + sample colors
for (const [a, b] of bands) {
    let minX = 1e9, maxX = -1;
    for (let y = a; y <= b; y += 2) for (let x = 0; x < img.width; x++) if (!isBG(px(img, x, y))) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    const my = (a + b) >> 1;
    const samples = [];
    for (let f = 0.05; f <= 0.95; f += 0.225) samples.push(hex(px(img, Math.round(minX + (maxX - minX) * f), my)));
    console.log(`  band ${a}-${b}: x ${minX}-${maxX}  midrow colors: ${samples.join(' ')}`);
}
