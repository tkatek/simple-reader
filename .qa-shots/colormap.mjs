import { decodePNG, px, hex } from './png-decode.mjs';

const img = decodePNG(process.argv[2] || '.qa-shots/target-slide7.png');
const W = img.width, H = img.height;
const cellW = +(process.argv[3] || 16); // sample block size

function classify(c) {
    const [r, g, b] = c;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = max - min;
    if (lum < 90) return 'D';                       // dark text/icon
    if (lum < 150) return 'd';                       // mid dark
    if (r > 235 && g > 235 && b > 235) return '.';   // white bg
    if (chroma < 12 && lum >= 200) return ',';       // light grey / shadow
    // hue families
    if (b > r && b > g) return 'B';                  // blue-ish
    if (r > g && b > g) return 'P';                  // purple-ish (r&b high vs g)
    if (r > g && g > b) return 'O';                  // warm
    if (g >= r && g >= b) return 'G';                // green-ish
    return '?';
}

let out = '';
for (let y = 0; y < H; y += cellW) {
    let line = '';
    for (let x = 0; x < W; x += cellW) {
        // average 4 samples per cell
        const cs = [px(img, x, y), px(img, Math.min(x + cellW >> 1, W - 1), y), px(img, x, Math.min(y + cellW >> 1, H - 1)), px(img, Math.min(x + (cellW >> 1), W - 1), Math.min(y + (cellW >> 1), H - 1))];
        const avg = [0, 1, 2].map(i => Math.round((cs[0][i] + cs[1][i] + cs[2][i] + cs[3][i]) / 4));
        line += classify(avg);
    }
    out += line + '\n';
}
console.log(out);
console.log('cell = ' + cellW + 'px, image ' + W + 'x' + H);
