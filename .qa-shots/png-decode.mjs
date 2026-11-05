// Minimal PNG decoder (8-bit RGB / RGBA / palette, non-interlaced) — enough for QA screenshots.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function decodePNG(path) {
    const buf = readFileSync(path);
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
    let pos = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
    const idat = [];
    let palette = null, trns = null;
    while (pos < buf.length) {
        const len = buf.readUInt32BE(pos);
        const type = buf.toString('ascii', pos + 4, pos + 8);
        const data = buf.subarray(pos + 8, pos + 8 + len);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0); height = data.readUInt32BE(4);
            bitDepth = data[8]; colorType = data[9]; interlace = data[12];
        } else if (type === 'IDAT') idat.push(data);
        else if (type === 'PLTE') palette = data;
        else if (type === 'tRNS') trns = data;
        else if (type === 'IEND') break;
        pos += 12 + len;
    }
    if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth);
    if (interlace !== 0) throw new Error('interlaced unsupported');
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 0 ? 1 : 2;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const out = Buffer.alloc(width * height * 3);
    let prev = Buffer.alloc(stride);
    let p = 0;
    for (let y = 0; y < height; y++) {
        const filter = raw[p++];
        const row = Buffer.from(raw.subarray(p, p + stride)); p += stride;
        const cur = Buffer.alloc(stride);
        for (let x = 0; x < stride; x++) {
            const a = x >= channels ? cur[x - channels] : 0;
            const b = prev[x];
            const c = x >= channels ? prev[x - channels] : 0;
            let v = row[x];
            if (filter === 1) v = (v + a) & 0xff;
            else if (filter === 2) v = (v + b) & 0xff;
            else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
            else if (filter === 4) {
                const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
                v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
            }
            cur[x] = v;
        }
        for (let x = 0; x < width; x++) {
            let r, g, bl;
            if (colorType === 3) {
                const idx = cur[x];
                r = palette[idx * 3]; g = palette[idx * 3 + 1]; bl = palette[idx * 3 + 2];
            } else if (colorType === 0) { r = g = bl = cur[x]; }
            else { r = cur[x * channels]; g = cur[x * channels + 1]; bl = cur[x * channels + 2]; }
            const o = (y * width + x) * 3;
            out[o] = r; out[o + 1] = g; out[o + 2] = bl;
        }
        prev = cur;
    }
    return { width, height, data: out };
}

export function px(img, x, y) {
    const o = (y * img.width + Math.min(x, img.width - 1)) * 3;
    return [img.data[o], img.data[o + 1], img.data[o + 2]];
}
export const hex = ([r, g, b]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
