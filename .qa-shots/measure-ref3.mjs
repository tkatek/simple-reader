import { decodePNG, px, hex } from './png-decode.mjs';
const img = decodePNG('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/ref-slide11-crop.png');

// "1 of 5" pill: scan y=300..380, x=850..1250 for non-white/non-bg pixels (border/text)
let found = [];
for (let y = 300; y <= 380; y += 2) {
    for (let x = 850; x <= 1250; x += 2) {
        const [r, g, b] = px(img, x, y);
        if (!(r >= 242 && g >= 242 && b >= 242)) { found.push([x, y, hex([r, g, b])]); }
    }
}
if (found.length) {
    const xs = found.map(f => f[0]), ys = found.map(f => f[1]);
    console.log(`1of5 region: x ${Math.min(...xs)}-${Math.max(...xs)}  y ${Math.min(...ys)}-${Math.max(...ys)}  n=${found.length}`);
    console.log('samples:', found.slice(0, 6).map(f => f.join('=')).join(' '));
    console.log('samples2:', found.slice(-6).map(f => f.join('=')).join(' '));
} else console.log('1of5: nothing found');

// instruction text extents: dark pixels x=150..700, y=325..365
let mn = 9999, mx = 0;
for (let y = 325; y <= 365; y++) for (let x = 150; x <= 700; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 480) { if (x < mn) mn = x; if (x > mx) mx = x; }
}
console.log(`instruction text x: ${mn}-${mx}`);

// Next button corner walk: BLUE fill (b > r+30). walk top edge from x=812 rightward at increasing y
console.log('--- next-btn top edge ---');
for (let x = 813; x <= 853; x += 4) {
    for (let y = 606; y <= 630; y++) {
        const [r, g, b] = px(img, x, y);
        if (b > r + 40 && b > 150) { console.log(`x=${x} fillY=${y}`); break; }
    }
}
// answer text size check: 'bank statement' cluster y extents at x=560..590
let ty0 = 999, ty1 = 0;
for (let y = 496; y <= 560; y++) for (let x = 525; x <= 595; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 480) { if (y < ty0) ty0 = y; if (y > ty1) ty1 = y; }
}
console.log(`answer2 text y: ${ty0}-${ty1} (h=${ty1 - ty0 + 1})`);
// nav text extents: previous button glyphs
let py0 = 999, py1 = 0, pn = 0;
for (let y = 612; y <= 676; y++) for (let x = 556; x <= 784; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 560) { if (y < py0) py0 = y; if (y > py1) py1 = y; pn++; }
}
console.log(`prev text y: ${py0}-${py1} (h=${py1 - py0 + 1}, n=${pn})`);
// badge text y extents
let by0 = 999, by1 = 0;
for (let y = 50; y <= 110; y++) for (let x = 470; x <= 900; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 460) { if (y < by0) by0 = y; if (y > by1) by1 = y; }
}
console.log(`badge text y: ${by0}-${by1} (h=${by1 - by0 + 1})`);
// stat value row: find value text y extents in pill1 x=500..560
let vy0 = 999, vy1 = 0;
for (let y = 209; y <= 270; y++) for (let x = 495; x <= 565; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 500) { if (y < vy0) vy0 = y; if (y > vy1) vy1 = y; }
}
console.log(`stat value text y: ${vy0}-${vy1} (h=${vy1 - vy0 + 1})`);
// question text x extents
let qmn = 9999, qmx = 0;
for (let y = 430; y <= 460; y++) for (let x = 150; x <= 1240; x++) {
    const [r, g, b] = px(img, x, y);
    if (r + g + b < 430) { if (x < qmn) qmn = x; if (x > qmx) qmx = x; }
}
console.log(`question text x: ${qmn}-${qmx} (w=${qmx - qmn + 1})`);
