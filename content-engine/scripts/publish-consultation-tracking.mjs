import fs from 'node:fs/promises';
import path from 'node:path';
import OSS from 'ali-oss';
const root = path.resolve(import.meta.dirname, '../..');
const asset = 'site-assets/consultation-tracking-20261021.js';
const include = `<script defer src="/${asset}"></script>`;
const manifest = JSON.parse(await fs.readFile(path.join(root, 'content-engine/data/core-site-manifest.json'), 'utf8'));
const pages = manifest.files.filter(p => /^(zh-hk|en-gb)\/.+\.html$/.test(p));
const backup = path.join(root, 'tracking-deployment-backup');
const payload = path.join(root, 'tracking-deployment-payload');
await fs.mkdir(backup, { recursive: true });
await fs.mkdir(payload, { recursive: true });
// Fetch the published documents, rather than deploying any unrelated local
// redesign or replacing the current site with an older repository version.
for (const key of pages) {
  const response = await fetch(`https://hwalai.com/${key.replace(/index\.html$/, '')}`, { headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  const html = await response.text();
  if (!/<\/head>/i.test(html) || !html.includes('hwalai.com')) throw new Error(`Unexpected document: ${key}`);
  let next = html.includes(include) ? html : html.replace(/<\/head>/i, `${include}</head>`);
  if (/\/contact\/index\.html$/.test(key)) {
    const navigation = "window.location.href = 'https://wa.me/85262813185?text=' + encodeURIComponent(message);";
    const tracked = "window.hwalaiContactTracking.navigateWhatsApp('https://wa.me/85262813185?text=' + encodeURIComponent(message));";
    if (!next.includes(navigation) && !next.includes(tracked)) throw new Error(`Unexpected WhatsApp form: ${key}`);
    next = next.replace(navigation, tracked);
  }
  await fs.mkdir(path.dirname(path.join(backup, key)), { recursive: true });
  await fs.mkdir(path.dirname(path.join(payload, key)), { recursive: true });
  await fs.writeFile(path.join(backup, key), html);
  await fs.writeFile(path.join(payload, key), next);
}
await fs.writeFile(path.join(backup, 'manifest.json'), JSON.stringify({ pages, asset }, null, 2));
if (process.argv.includes('--prepare-only')) { console.log(`Prepared ${pages.length} live pages without publishing`); process.exit(0); }
for (const name of ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET']) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}
const client = new OSS({ region: 'oss-cn-hongkong', bucket: 'hwalai', secure: true,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET });
await client.put(asset, path.join(root, asset), { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' } });
for (const key of pages) {
  await client.put(key, path.join(payload, key), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, max-age=0, must-revalidate' } });
  console.log(`Tracking installed: ${key}`);
}
console.log(`Published tracking on ${pages.length} pages; original documents saved for rollback.`);
