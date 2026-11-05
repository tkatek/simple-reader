// Measure the freshly rendered slide-11 and compare with reference geometry
import { decodePNG, px, hex } from './png-decode.mjs';

const path = process.argv[2];
const img = decodePNG(path);
console.log('render size:', img.width, 'x', img.height);

const W = img.width, H = img.height;
const isWhite = ([r, g, b]) => r >= 253 && g >= 253 && b >= 253;
const isBg = ([r, g, b]) => r >= 242 && g >= 242 && b >= 242;

// Vertical profile at center band
let prev = '';
for (let y = 0; y < H; y += 2) {
    let w = 0, dk = 0;
    for (let x = 620; x < 700; x += 2) {
        const c = px(img, x, y);
        if (isWhite(c)) w++; else if (c[0] + c[1] + c[2] < 480) dk++;
    }
    const st = dk > 1 ? 'dark' : w > 30 ? 'WHITE' : isBg(px(img, 660, y)) ? 'bg' : 'o:' + hex(px(img, 660, y));
    if (st !== prev) { console.log('y=' + y + ' ' + st); prev = st; }
}
