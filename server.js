/**
 * THRINETHRA - Local Web & Neon Database Server
 * Zero-dependency server that serves the Thrinethra frontend
 * and securely proxies SQL queries to the Neon PostgreSQL database.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_kCrMU0l9LViJ@ep-rapid-sunset-a54uayxa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEON_ENDPOINT = 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers for all incoming requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Neon-Connection-String, Neon-Raw-Text-Output, Neon-Array-Mode');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Neon SQL Proxy Endpoint (/api/neon-sql)
  if (req.url.startsWith('/api/neon-sql') && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const neonRes = await fetch(NEON_ENDPOINT, {
          method: 'POST',
          headers: {
            'Neon-Connection-String': NEON_CONNECTION_STRING,
            'Neon-Raw-Text-Output': 'true',
            'Neon-Array-Mode': 'true',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: payload.query,
            params: payload.params || []
          })
        });

        const data = await neonRes.json();
        res.writeHead(neonRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('Neon proxy error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: err.message || 'Neon database proxy error' }));
      }
    });
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/login.html';
  }

  const safePath = path.normalize(path.join(__dirname, reqPath));
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  THRINETHRA Command Center is running!`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Login Page:  http://localhost:${PORT}/login.html`);
  console.log(`  Neon DB:     Connected via Serverless Proxy`);
  console.log(`======================================================\n`);
});