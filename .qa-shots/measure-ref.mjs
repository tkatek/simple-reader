// Measure the slide-11 reference crop geometry (ref-slide11-crop.png, 1382x793)
import { decodePNG, px, hex } from './png-decode.mjs';

const img = decodePNG('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/ref-slide11-crop.png');
const W = img.width, H = img.height;
const isWhite = ([r, g, b]) => r >= 253 && g >= 253 && b >= 253;
const isDark = ([r, g, b]) => r + g + b < 480;

function runs(y, pred, minLen = 6, label = '') {
    const out = [];
    let start = -1;
    for (let x = 0; x < W; x++) {
        const m = pred(px(img, x, y));
        if (m && start < 0) start = x;
        if ((!m || x === W - 1) && start >= 0) {
            const end = m ? x : x - 1;
            if (end - start + 1 >= minLen) out.push([start, end, end - start + 1]);
            start = -1;
        }
    }
    console.log(`${label} y=${y}: ` + out.map(([a, b, w]) => `${a}-${b}(${w})`).join('  '));
    return out;
}

// badge pill: light lavender rows 56..100 — measure at y=78 with "not bg" predicate
const isBg = ([r, g, b]) => r >= 243 && g >= 243 && b >= 243 && b - r < 6;
runs(78, c => !isBg(c) && !isDark(c), 6, 'BADGE');

// heading extents (done before): 430-949

// stat pills at y=240 — pills are white with border; interior white runs split by text
runs(240, isWhite, 8, 'STAT');

// card interior row (between top border and track): y=340 — but avoid text: use y=300 (just inside card top)
runs(300, c => !isBg(c), 40, 'CARD-top-area');
runs(360, c => !isBg(c), 40, 'CARD-mid');

// card left/right via border detection: scan y=340 for border color ~ (226,232,240)±8
const isBorder = ([r, g, b]) => Math.abs(r - 226) < 10 && Math.abs(g - 232) < 10 && Math.abs(b - 240) < 12;
for (let x = 0; x < W; x++) if (isBorder(px(img, x, 340))) { console.log('CARD border-left px at x=' + x + ' ' + hex(px(img, x, 340))); break; }
for (let x = W - 1; x >= 0; x--) if (isBorder(px(img, x, 340))) { console.log('CARD border-right px at x=' + x + ' ' + hex(px(img, x, 340))); break; }

// answer buttons row: white interiors at y=530 (button text breaks runs but interiors are wide)
runs(505, isWhite, 10, 'ANS-top');   // above text line
runs(530, isWhite, 10, 'ANS-mid');

// nav buttons at y=645: detect non-bg runs (buttons have distinct bgs)
runs(645, c => !isBg(c) && !isWhite(c), 20, 'NAV-nonbg');
runs(648, isWhite, 12, 'NAV-white');

// vertical fine-scan of specific columns for internal rows
function vscan(x, y0, y1, label) {
    console.log(`--- vscan ${label} x=${x} ---`);
    let prev = '';
    for (let y = y0; y < y1; y++) {
        const c = px(img, x, y);
        const key = isWhite(c) ? 'W' : isBg(c) ? 'bg' : isDark(c) ? 'dk' : 'o:' + hex(c);
        if (key !== prev) { console.log('  y=' + y + ' ' + key); prev = key; }
    }
}
vscan(300, 296, 480, 'card-left-interior');   // crosses instruction text left area
vscan(660, 296, 480, 'card-center');          // crosses track + question
vscan(1000, 296, 480, 'card-right');          // crosses "1 of 5" pill
vscan(660, 480, 720, 'lower-center');         // buttons + feedback + nav
vscan(300, 600, 720, 'nav-left');             // restart button area
