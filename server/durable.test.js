import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-store-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.MEDIA_DIR = path.join(dir, 'media');
process.env.CATALOG_GITHUB_TOKEN = 'test-token';
process.env.CATALOG_GITHUB_REPO = 'owner/repo';
process.env.CATALOG_GITHUB_BRANCH = 'catalog-live';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function githubMock() {
  const files = new Map();
  let branch = '';
  return {
    files,
    async fetch(url, options = {}) {
      const method = options.method || 'GET';
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      if (pathname === '/repos/owner/repo/git/ref/heads/catalog-live') {
        if (!branch) return json(404, { message: 'missing' });
        return json(200, { object: { sha: branch } });
      }
      if (pathname === '/repos/owner/repo/git/ref/heads/main') {
        return json(200, { object: { sha: 'mainsha' } });
      }
      if (pathname === '/repos/owner/repo/git/refs' && method === 'POST') {
        branch = 'mainsha';
        return json(201, {});
      }
      const content = pathname.match(/^\/repos\/owner\/repo\/contents\/(.+)$/);
      if (!content) return json(404, {});
      const filePath = decodeURIComponent(content[1]);
      if (method === 'GET') {
        const hit = files.get(filePath);
        if (!hit) return json(404, { message: 'missing' });
        return json(200, { sha: hit.sha, content: hit.body.toString('base64') });
      }
      const body = JSON.parse(options.body);
      if (method === 'PUT') {
        files.set(filePath, { sha: 'sha-' + filePath, body: Buffer.from(body.content, 'base64') });
        return json(201, {});
      }
      if (method === 'DELETE') {
        files.delete(filePath);
        return json(200, {});
      }
      return json(404, {});
    },
  };
}

function json(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(data); },
  };
}

test('ảnh lạ bị từ chối, ảnh PNG được nhận', async () => {
  const { decodeImage } = await import('./media.js');
  const decoded = decodeImage(PNG);
  assert.equal(decoded.type.ext, 'png');
  assert.throws(() => decodeImage(Buffer.alloc(40, 1).toString('base64')), /JPEG/);
});

test('giá và ảnh sống lại từ nhánh GitHub sau khi đĩa trống', async () => {
  const { setVariantPrice, setVariantFlag, setGallery, getOverrides } = await import('./db.js');
  const { saveUpload, removeMedia, mediaExists } = await import('./media.js');
  const { persistEdits, hydrateEdits, durableConfig } = await import('./durable.js');
  assert.equal(durableConfig().enabled, true);
  setVariantPrice('MQ-DTH-080-GG', 47000);
  setVariantFlag('MQ-DTH-080-GG', { oos: true, compareAt: 69000 });
  setVariantFlag('VZ-GG-THOM-80', { oos: true, compareAt: 69000 });
  const saved = saveUpload('thom-say-deo', decodePng());
  setGallery('thom-say-deo', [{ file: `upload:${saved.name}`, label: 'Ảnh mới', alt: 'Thơm', hero: true }]);
  const github = githubMock();
  const pushed = await persistEdits({ uploads: [saved], fetchImpl: github.fetch });
  assert.equal(pushed.durable, true);
  assert.ok(github.files.has('store.json'));
  assert.ok(github.files.has(`media/${saved.name}`));
  const token = process.env.CATALOG_GITHUB_TOKEN;
  delete process.env.CATALOG_GITHUB_TOKEN;
  assert.equal((await persistEdits({ fetchImpl: github.fetch })).reason, 'unset');
  process.env.CATALOG_GITHUB_TOKEN = token;

  setVariantPrice('MQ-DTH-080-GG', null);
  setVariantFlag('MQ-DTH-080-GG', { oos: null, compareAt: null });
  setVariantFlag('VZ-GG-THOM-80', { oos: null, compareAt: null });
  setGallery('thom-say-deo', []);
  removeMedia(saved.name);
  assert.equal(mediaExists(saved.name), false);

  const pulled = await hydrateEdits({ fetchImpl: github.fetch });
  assert.equal(pulled.durable, true);
  const overrides = getOverrides();
  assert.equal(overrides.prices.get('MQ-DTH-080-GG'), 47000);
  assert.equal(overrides.flags.get('MQ-DTH-080-GG').oos, true);
  assert.equal(overrides.flags.get('VZ-GG-THOM-80').compareAt, 69000);
  assert.equal(overrides.galleries.get('thom-say-deo')[0].file, `upload:${saved.name}`);
  assert.equal(mediaExists(saved.name), true);
});

function decodePng() {
  return { bytes: Buffer.from(PNG, 'base64'), type: { ext: 'png', mime: 'image/png' } };
}
