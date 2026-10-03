import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 8080);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  try {
    const requestPath = req.url && req.url !== '/' ? req.url.split('?')[0] : '/';
    const safePath = decodeURIComponent(requestPath);
    let filePath = path.join(__dirname, safePath);

    if (safePath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }

    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(resolvedPath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        res.writeHead(500);
        res.end('Internal server error');
        return;
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    });
  } catch {
    res.writeHead(500);
    res.end('Internal server error');
  }
});

server.listen(port, () => {
  console.log(`Passport reader running on http://localhost:${port}`);
});
