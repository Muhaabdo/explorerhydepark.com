/* Minimal static file server for local testing only — not part of the deployed site. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.argv[2] || 8843;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer(function (req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  urlPath = urlPath.replace(/\/+$/, '') || '/index.html';
  var filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  // Same as .htaccess rule 3 on the live server: /projects/x -> /projects/x.html,
  // so the site's extensionless links work locally too.
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';
  fs.readFile(filePath, function (err, data) {
    if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    var ext = path.extname(filePath);
    // Local visits must not reach Google Analytics (they were showing up as
    // localhost page views). The GTM loader gets an empty script instead;
    // dataLayer pushes still happen, so you can inspect them in the console.
    // To test GTM itself (Preview mode): GTM=1 node tools/dev-server.js
    if (ext === '.html' && !process.env.GTM) {
      data = Buffer.from(String(data).replace(
        /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=/g,
        'data:text/javascript,//gtm-off-locally?id='));
    }
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('dev server listening on http://localhost:' + PORT);
});
