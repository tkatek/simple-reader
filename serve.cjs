const http = require('http');
const { createReadStream, existsSync, statSync } = require('fs');
const { join, extname } = require('path');
const root = __dirname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.webp': 'image/webp' };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let p = join(root, urlPath === '/' ? 'reader.html' : urlPath);
  if (!existsSync(p)) { res.writeHead(404); res.end('nf: ' + p); return; }
  res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream', 'Content-Length': statSync(p).size });
  createReadStream(p).pipe(res);
}).listen(8125, () => console.log('reader on 8125'));
