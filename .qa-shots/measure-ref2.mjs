// Fine measurement of stat pills + nav buttons + badge in ref-slide11-crop.png
import { decodePNG, px, hex } from './png-decode.mjs';

const img = decodePNG('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/ref-slide11-crop.png');
const W = img.width;

// Classify horizontal segments at a row
function classifyRow(y, x0, x1, label) {
    console.log(`--- ${label} y=${y} ---`);
    let prev = '', start = 0;
    const segs = [];
    for (let x = x0; x <= x1; x++) {
        const [r, g, b] = px(img, x, y);
        let k;
        if (r >= 253 && g >= 253 && b >= 253) k = 'white';
        else if (r >= 242 && g >= 242 && b >= 242) k = 'bg';
        else if (g > r + 30 && g > b + 20) k = 'GREEN';
        else if (r > g + 40 && b < g + 30) k = 'RED';
        else if (b > r + 30 && b >= g + 20) k = 'BLUE';
        else if (r + g + b < 500) k = 'dark';
        else k = 'lt:' + hex([r, g, b]);
        if (k !== prev) { if (prev) segs.push([start, x - 1, prev]); start = x; prev = k; }
    }
    segs.push([start, x1, prev]);
    // merge tiny segments into neighbors for readability
    const out = [];
    for (const s of segs) {
        if (out.length && s[1] - s[0] < 4 && out[out.length - 1][2] === out.length && false) {}
        out.push(s);
    }
    for (const [a, b, k] of out) if (b - a >= 2) console.log(`  x=${a}-${b} (${b - a + 1}) ${k}`);
}

// stat pill row through label text (upper part of pill) and value (lower)
classifyRow(230, 320, 1060, 'STAT-upper');
classifyRow(252, 320, 1060, 'STAT-lower');

// vertical extent of pill 1 at x=380
function vscan(x, y0, y1, label) {
    console.log(`--- vscan ${label} x=${x} ---`);
    let prev = '';
    for (let y = y0; y < y1; y++) {
        const [r, g, b] = px(img, x, y);
        const k = (r >= 253 && g >= 253 && b >= 253) ? 'W' : (r >= 242 && g >= 242 && b >= 242) ? 'bg' : hex([r, g, b]);
        if (k !== prev) { console.log('  y=' + y + ' ' + k); prev = k; }
    }
}
vscan(380, 195, 285, 'pill1-left-interior');
vscan(690, 195, 285, 'pill2-center');

// nav buttons above text
classifyRow(622, 200, 1250, 'NAV-top');
// nav button gradient check: sample colors across Next button
for (const x of [810, 850, 900, 950, 1000, 1050, 1100, 1150, 1200]) {
    console.log('nav y=640 x=' + x + ' ' + hex(px(img, x, 640)));
}
// nav text rows for Previous (grey) — sample
console.log('prev-btn bg y=640: ' + hex(px(img, 700, 640)));
console.log('restart bg y=640: ' + hex(px(img, 450, 640)));

// badge pill vertical + bg color
vscan(500, 40, 115, 'badge-left-edge');
console.log('badge bg y=79 x=490: ' + hex(px(img, 490, 79)));

// answer button radius estimate: find corner curve of button 2 (531..836, 494..562)
// walk the top edge of button 2: first y where border color appears, per x
console.log('--- button2 top-edge y per x ---');
for (let x = 531; x <= 836; x += 8) {
    for (let y = 488; y <= 500; y++) {
        const [r, g, b] = px(img, x, y);
        if (r + g + b < 740 && !(r >= 242)) { console.log('x=' + x + ' edgeY=' + y); break; }
    }
}
