/**
 * IndexNow: tells Bing (and Yandex, Seznam, Naver...) that pages changed, so
 * they recrawl now instead of whenever they next pass by. Bing feeds Copilot
 * and ChatGPT search, so this matters for AI answers too.
 *
 *   node tools/indexnow.js                 every URL in sitemap.xml
 *   node tools/indexnow.js --changed       only URLs whose <lastmod> is today
 *   node tools/indexnow.js /en/ /projects/hyde-park-tawny   specific paths
 *
 * Run it AFTER the push has deployed (the pages must already be live).
 * The key below must match the file <key>.txt in the site root — Bing reads
 * that file to confirm the site is ours. Don't rename or delete it.
 * Needs Node 18+ (built-in fetch).
 */
const fs = require('fs');
const path = require('path');

const HOST = 'www.explorerhydepark.com';
const KEY = '4e0dd8f2e973d2cb85fbb5f68adc6232';

const args = process.argv.slice(2);
const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const entries = [];
const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
let m;
while ((m = re.exec(sitemap))) entries.push({ loc: m[1], lastmod: m[2] });

let urls;
if (args.includes('--changed')) {
  const today = new Date().toISOString().slice(0, 10);
  urls = entries.filter((e) => e.lastmod === today).map((e) => e.loc);
} else if (args.length) {
  urls = args.map((p) => 'https://' + HOST + (p.startsWith('/') ? p : '/' + p));
} else {
  urls = entries.map((e) => e.loc);
}

if (!urls.length) {
  console.log('Nothing to submit.');
  process.exit(0);
}

fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList: urls }),
}).then(async (res) => {
  // 200 = accepted, 202 = accepted (key check pending). 403 = key file not found/invalid,
  // 422 = a URL isn't on this host. Anything else: try again later.
  console.log('IndexNow ' + res.status + ' — ' + urls.length + ' URL(s)');
  urls.forEach((u) => console.log('  ' + u));
  if (res.status >= 300) console.log(await res.text());
}).catch((err) => {
  console.error('IndexNow request failed:', err.message);
  process.exit(1);
});
