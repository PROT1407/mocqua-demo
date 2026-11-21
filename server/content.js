import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';
import { getDb } from './db.js';
import { problem } from './format.js';

const FILE = path.join(ROOT, 'server', 'data', 'noi-dung.json');
const SECTION_IDS = ['hero', 'featured', 'ways', 'offer', 'shelf'];
const PAGE_KEYS = ['shop', 'deo', 'thanghoa', 'gion', 'kho', 'omai', 'set', 'hat', 'combo', 'gift', 'catalog', 'compare'];
export const BADGES = ['', 'Bán chạy', 'Khuyến mãi', 'Phiên bản giới hạn', 'Combo tiết kiệm', 'Mới', 'Giới hạn'];

const SITE_LIMITS = {
  heroKicker: 40,
  heroTitle: 120,
  heroLead: 400,
  heroCta: 40,
  heroSecondary: 40,
  featuredTitle: 80,
  waysTitle: 80,
  waysLead: 300,
  offerKicker: 40,
  offerTitle: 80,
  shelfTitle: 80,
  shelfLead: 400,
  footerTagline: 120,
  banner: 240,
  promoText: 400,
  promoEnds: 10,
  homeTitle: 70,
  homeDescription: 160,
};
const PAGE_TITLE = 70;
const PAGE_DESC = 160;

function readDefaults() {
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return normalizeSite(raw, { loose: true });
}

function plain(value, max, label) {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > max) throw problem(400, `${label} quá dài (tối đa ${max} ký tự).`);
  return text;
}

function normalizeSections(input, { loose = false } = {}) {
  const rows = Array.isArray(input) ? input : [];
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const id = String(row?.id || '');
    if (!SECTION_IDS.includes(id) || seen.has(id)) {
      if (!loose) throw problem(400, 'Mục trang chủ không hợp lệ.');
      continue;
    }
    seen.add(id);
    out.push({ id, hidden: row?.hidden === true });
  }
  for (const id of SECTION_IDS) {
    if (!seen.has(id)) out.push({ id, hidden: false });
  }
  return out;
}

export function normalizeSite(input = {}, options = {}) {
  const site = {
    sections: normalizeSections(input.sections, options),
    pages: {},
  };
  for (const [key, max] of Object.entries(SITE_LIMITS)) {
    site[key] = input[key] ? plain(input[key], max, 'Nội dung') : '';
  }
  if (site.promoEnds && !/^\d{4}-\d{2}-\d{2}$/.test(site.promoEnds)) {
    throw problem(400, 'Ngày hết khuyến mãi chưa đúng.');
  }
  const pages = input.pages && typeof input.pages === 'object' ? input.pages : {};
  for (const key of PAGE_KEYS) {
    const row = pages[key];
    if (!row || typeof row !== 'object') continue;
    const title = row.title ? plain(row.title, PAGE_TITLE, 'Tiêu đề trang') : '';
    const description = row.description ? plain(row.description, PAGE_DESC, 'Mô tả trang') : '';
    if (title || description) site.pages[key] = { title, description };
  }
  return site;
}

export function normalizeProductCopy(input = {}) {
  const badge = input.badge == null ? null : String(input.badge);
  if (badge != null && !BADGES.includes(badge)) throw problem(400, 'Huy hiệu không nằm trong danh sách.');
  let featured = null;
  if (input.featured === false) featured = false;
  else if (input.featured != null && input.featured !== '') {
    const order = Number(input.featured);
    if (!Number.isInteger(order) || order < 1 || order > 99) throw problem(400, 'Thứ tự nổi bật từ 1 đến 99.');
    featured = order;
  }
  return {
    name: plain(input.name, 180, 'Tên'),
    pitch: plain(input.pitch, 280, 'Câu ngắn'),
    description: plain(input.description, 2000, 'Mô tả'),
    seoTitle: plain(input.seoTitle, 70, 'Tiêu đề SEO'),
    seoDescription: plain(input.seoDescription, 160, 'Mô tả SEO'),
    badge,
    featured,
  };
}

function emptyBundle() {
  return { site: {}, products: {}, versions: [] };
}

function readBundle() {
  const row = getDb().prepare(`SELECT json FROM content_bundle WHERE id = 1`).get();
  if (!row) return emptyBundle();
  try {
    const data = JSON.parse(row.json);
    return {
      site: data.site && typeof data.site === 'object' ? data.site : {},
      products: data.products && typeof data.products === 'object' ? data.products : {},
      versions: Array.isArray(data.versions) ? data.versions.slice(0, 10) : [],
    };
  } catch {
    return emptyBundle();
  }
}

function writeBundle(bundle) {
  const json = JSON.stringify(bundle);
  getDb().prepare(`
    INSERT INTO content_bundle (id, json, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at
  `).run(json, new Date().toISOString());
}

export function getContentBundle() {
  return readBundle();
}

export function replaceContentBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') return;
  writeBundle({
    site: bundle.site && typeof bundle.site === 'object' ? bundle.site : {},
    products: bundle.products && typeof bundle.products === 'object' ? bundle.products : {},
    versions: Array.isArray(bundle.versions) ? bundle.versions.slice(0, 10) : [],
  });
}

function remember(bundle) {
  const snap = { at: new Date().toISOString(), site: bundle.site, products: bundle.products };
  const versions = [snap, ...(bundle.versions || [])].slice(0, 10);
  return versions;
}

let draftSite = null;

export function previewing(site, fn) {
  draftSite = normalizeSite(site);
  try {
    return fn();
  } finally {
    draftSite = null;
  }
}

export function getSiteCopy() {
  const defaults = readDefaults();
  const saved = draftSite || readBundle().site || {};
  const merged = { ...defaults, pages: { ...(defaults.pages || {}) } };
  for (const [key, value] of Object.entries(saved)) {
    if (key === 'pages' || key === 'sections') continue;
    if (typeof value === 'string' && value) merged[key] = value;
  }
  for (const [key, row] of Object.entries(saved.pages || {})) {
    if (!row || typeof row !== 'object') continue;
    const base = merged.pages[key] || { title: '', description: '' };
    merged.pages[key] = {
      title: row.title || base.title || '',
      description: row.description || base.description || '',
    };
  }
  merged.sections = normalizeSections(saved.sections?.length ? saved.sections : defaults.sections, { loose: true });
  return merged;
}

export function getProductCopy(id) {
  return readBundle().products?.[id] || null;
}

export function saveSiteCopy(input) {
  const site = normalizeSite(input);
  const bundle = readBundle();
  const versions = remember(bundle);
  writeBundle({ ...bundle, site, versions });
  return getSiteCopy();
}

export function saveProductCopy(id, input) {
  if (!/^[a-z0-9-]{1,120}$/.test(String(id || ''))) throw problem(400, 'Mã sản phẩm không hợp lệ.');
  const copy = normalizeProductCopy(input);
  const empty = !copy.name && !copy.pitch && !copy.description && !copy.seoTitle && !copy.seoDescription && copy.badge == null && copy.featured == null;
  const bundle = readBundle();
  const products = { ...bundle.products };
  if (empty) delete products[id];
  else products[id] = copy;
  writeBundle({ ...bundle, products, versions: remember(bundle) });
  return copy;
}

export function listContentVersions() {
  return readBundle().versions.map((row, index) => ({ index, at: row.at || '' }));
}

export function restoreContentVersion(index) {
  const bundle = readBundle();
  const version = bundle.versions[Number(index)];
  if (!version) throw problem(404, 'Không thấy bản cũ này.');
  const versions = remember(bundle).filter((_, i) => i !== Number(index) + 1);
  writeBundle({
    site: version.site || {},
    products: version.products || {},
    versions,
  });
  return getSiteCopy();
}

export function applyCopy(view, rawName, rawBadge, rawFeatured, rawPitch) {
  const copy = getProductCopy(view.id);
  view.catalogName = rawName;
  view.catalogBadge = rawBadge || '';
  view.catalogFeatured = rawFeatured ?? null;
  view.catalogPitch = rawPitch || '';
  if (!copy) return view;
  if (copy.name) view.name = copy.name;
  if (copy.pitch) {
    view.pitch = copy.pitch;
    view.short = copy.pitch;
  }
  if (copy.description) view.descriptionOverride = copy.description;
  if (copy.badge != null) {
    view.badge = copy.badge;
    view.badgeOverride = true;
  }
  if (copy.featured === false) view.featured = null;
  else if (Number.isInteger(copy.featured)) view.featured = copy.featured;
  view.seoTitle = copy.seoTitle || '';
  view.seoDescription = copy.seoDescription || '';
  return view;
}

export function applyContentToCatalog(data) {
  const products = readBundle().products;
  if (!data?.products) return data;
  return {
    ...data,
    products: data.products.map((product) => {
      const copy = products[product.shopId] || products[product.id];
      if (!copy) return product;
      return {
        ...product,
        ...(copy.name ? { name: copy.name } : {}),
        ...(copy.pitch ? { pitch: copy.pitch } : {}),
      };
    }),
  };
}

export function publicContent() {
  const site = getSiteCopy();
  const products = readBundle().products;
  return { site, products };
}
