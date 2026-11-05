import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = 'C:/Users/HP/Desktop/soufinae/slides1/simple-reader';
const PORT = 8124;
const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

createServer(async (req, res) => {
    try {
        const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        const path = normalize(join(ROOT, url)).replaceAll('\\', '/');
        if (!path.startsWith(ROOT)) throw new Error('forbidden');
        let file = path;
        try { await readFile(file); } catch { file = join(ROOT, 'reader.html'); }
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
        res.end(body);
    } catch {
        res.writeHead(404); res.end('not found');
    }
}).listen(PORT, () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/`));
