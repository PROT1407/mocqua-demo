// Giá, hết hàng và ảnh do chủ shop sửa không nằm trên đĩa Render (đĩa đó bị xoá mỗi lần ngủ hoặc deploy).
// Một nhánh GitHub riêng (mặc định catalog-live) giữ store.json và file ảnh. Nhánh này không phải nhánh deploy,
// nên mỗi lần lưu không kéo một lần deploy mới. Máy chủ kéo bản này khi khởi động, rồi phục vụ web và bot từ bộ nhớ.
import { listGalleryGroups, listProductOverrideRows, listVariantFlagRows, listVariantPriceRows, replaceDurableRows } from './db.js';
import { listCatalogPrices } from './danhmuc.js';
import { mediaExists, writeMedia } from './media.js';
import { getContentBundle, replaceContentBundle } from './content.js';

const API = 'https://api.github.com';

export function durableConfig(env = process.env) {
  const token = String(env.CATALOG_GITHUB_TOKEN || '').trim();
  const repo = String(env.CATALOG_GITHUB_REPO || 'PROT1407/mocqua-demo').trim();
  const branch = String(env.CATALOG_GITHUB_BRANCH || 'catalog-live').trim();
  if (token && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return { enabled: false, reason: 'repo' };
  }
  if (token && !/^[A-Za-z0-9._-]{1,80}$/.test(branch)) {
    return { enabled: false, reason: 'branch' };
  }
  return { enabled: Boolean(token), token, repo, branch };
}

export function collectSnapshot() {
  return {
    version: 1,
    variantPrices: listVariantPriceRows(),
    productOverrides: listProductOverrideRows(),
    variantFlags: listVariantFlagRows(),
    galleries: listGalleryGroups(),
    catalogPrices: listCatalogPrices(),
    content: getContentBundle(),
  };
}

function contentPath(filePath) {
  return String(filePath).split('/').map((part) => encodeURIComponent(part)).join('/');
}

async function gh(cfg, fetchImpl, pathname, { method = 'GET', body } = {}) {
  const response = await fetchImpl(`${API}${pathname}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${cfg.token}`,
      'user-agent': 'mocqua-shop',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }
  return { ok: response.ok, status: response.status, data };
}

function decodeContent(data) {
  const raw = String(data?.content || '').replace(/\n/g, '');
  return Buffer.from(raw, 'base64');
}

async function ensureBranch(cfg, fetchImpl) {
  const branch = encodeURIComponent(cfg.branch);
  const existing = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/git/ref/heads/${branch}`);
  if (existing.ok) return;
  if (existing.status !== 404 && existing.status !== 409) throw new Error(`github-branch-${existing.status}`);
  const main = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/git/ref/heads/main`);
  if (!main.ok || !main.data?.object?.sha) throw new Error(`github-main-${main.status}`);
  const created = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${cfg.branch}`, sha: main.data.object.sha },
  });
  if (!created.ok && created.status !== 422) throw new Error(`github-ref-${created.status}`);
}

async function fileSha(cfg, fetchImpl, filePath) {
  const got = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/contents/${contentPath(filePath)}?ref=${encodeURIComponent(cfg.branch)}`);
  if (got.status === 404) return '';
  if (!got.ok) throw new Error(`github-read-${got.status}`);
  return got.data?.sha || '';
}

async function putFile(cfg, fetchImpl, filePath, bytes, message) {
  const sha = await fileSha(cfg, fetchImpl, filePath);
  const put = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/contents/${contentPath(filePath)}`, {
    method: 'PUT',
    body: {
      message,
      content: Buffer.from(bytes).toString('base64'),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    },
  });
  if (!put.ok) throw new Error(`github-write-${put.status}`);
}

async function deleteFile(cfg, fetchImpl, filePath, message) {
  const sha = await fileSha(cfg, fetchImpl, filePath);
  if (!sha) return;
  const removed = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/contents/${contentPath(filePath)}`, {
    method: 'DELETE',
    body: { message, sha, branch: cfg.branch },
  });
  if (!removed.ok && removed.status !== 404) throw new Error(`github-delete-${removed.status}`);
}

function uploadNames(snapshot) {
  const names = new Set();
  for (const group of snapshot?.galleries || []) {
    for (const item of group.items || []) {
      const file = String(item?.file || '');
      if (file.startsWith('upload:')) names.add(file.slice('upload:'.length));
    }
  }
  return [...names];
}

let chain = Promise.resolve();

async function persistNow({ uploads = [], removals = [], fetchImpl }) {
  const cfg = durableConfig();
  if (!cfg.enabled) return { durable: false, reason: cfg.reason || 'unset' };
  await ensureBranch(cfg, fetchImpl);
  for (const file of uploads) {
    await putFile(cfg, fetchImpl, `media/${file.name}`, file.bytes, 'Thêm ảnh sản phẩm');
  }
  for (const name of removals) {
    await deleteFile(cfg, fetchImpl, `media/${name}`, 'Gỡ ảnh sản phẩm');
  }
  await putFile(cfg, fetchImpl, 'store.json', Buffer.from(JSON.stringify(collectSnapshot())), 'Cập nhật giá, hết hàng và ảnh');
  return { durable: true };
}

export function persistEdits(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const run = chain.then(() => persistNow({ ...options, fetchImpl }), () => persistNow({ ...options, fetchImpl }));
  chain = run.then(() => {}, () => {});
  return run.catch((error) => {
    console.error('catalog store failed', error instanceof Error ? error.message : 'error');
    return { durable: false, reason: 'github' };
  });
}

export async function hydrateEdits({ fetchImpl = globalThis.fetch } = {}) {
  const cfg = durableConfig();
  if (!cfg.enabled) return { durable: false, reason: cfg.reason || 'unset' };
  try {
    const got = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/contents/store.json?ref=${encodeURIComponent(cfg.branch)}`);
    if (got.status === 404) return { durable: true, empty: true };
    if (!got.ok) throw new Error(`github-store-${got.status}`);
    const snapshot = JSON.parse(decodeContent(got.data).toString('utf8'));
    replaceDurableRows(snapshot);
    if (snapshot.content) replaceContentBundle(snapshot.content);
    for (const name of uploadNames(snapshot)) {
      if (!/^[a-z0-9-]{1,60}\.(jpg|png|webp)$/.test(name) || mediaExists(name)) continue;
      const file = await gh(cfg, fetchImpl, `/repos/${cfg.repo}/contents/${contentPath(`media/${name}`)}?ref=${encodeURIComponent(cfg.branch)}`);
      if (file.ok) writeMedia(name, decodeContent(file.data));
    }
    return { durable: true };
  } catch (error) {
    console.error('catalog hydrate failed', error instanceof Error ? error.message : 'error');
    return { durable: false, reason: 'github' };
  }
}
