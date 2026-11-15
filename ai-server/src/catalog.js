import fs from 'node:fs';
import { listPriceForGrams, resolveSale } from './sale.js';

const DEFAULT_URL = 'https://mocqua.onrender.com/api/danh-muc';
const DEFAULT_ORIGIN = 'https://mocqua.onrender.com';

function asInt(value) {
  return Number.isInteger(value) ? value : null;
}

// Lịch khuyến mãi lấy từ dữ liệu danh mục (không chốt số trong câu trả lời).
// Giá gốc ưu tiên originalPrice/compareAt; không có thì tính từ listPer100g.
export function saleSchedule(product, variant) {
  const promo = variant?.promo && typeof variant.promo === 'object' ? variant.promo : null;
  const endsAt = (typeof promo?.endsAt === 'string' && promo.endsAt)
    || (typeof product?.promoEndsAt === 'string' && product.promoEndsAt)
    || '';
  if (!endsAt || !Number.isFinite(Date.parse(endsAt))) return null;
  const grams = asInt(variant?.weightG);
  const explicit = asInt(promo?.originalPrice ?? promo?.compareAt ?? variant?.compareAt);
  const listPer100g = asInt(product?.listPer100g);
  const original = explicit ?? listPriceForGrams(listPer100g, grams);
  const promoPrice = asInt(promo?.price) ?? asInt(variant?.price);
  if (original == null || promoPrice == null) return null;
  return {
    price: promoPrice,
    grams,
    listPer100g,
    promoEndsAt: typeof product?.promoEndsAt === 'string' ? product.promoEndsAt : '',
    promo: {
      price: promoPrice,
      originalPrice: original,
      endsAt,
      ...(typeof promo?.label === 'string' ? { label: promo.label } : {}),
    },
  };
}

export function shopOrigin(env = process.env) {
  return String(env.SHOP_PUBLIC_URL || DEFAULT_ORIGIN).replace(/\/$/, '');
}

export function compactCatalog(payload, { origin = DEFAULT_ORIGIN, now = new Date() } = {}) {
  const cats = new Map((payload?.categories || []).map((c) => [c.id, c.name]));
  const lines = [];
  for (const product of payload?.products || []) {
    const name = clean(product?.name);
    if (!name) continue;
    const id = clean(product?.id);
    const brand = clean(product?.label);
    const category = clean(cats.get(product?.cat) || product?.cat);
    for (const variant of product?.variants || []) {
      const sku = clean(variant?.code);
      if (!sku) continue;
      const shopId = clean(variant?.shopId);
      const url = shopId ? `${origin}/san-pham/${encodeURIComponent(shopId)}` : '';
      const grams = Number(variant?.weightG);
      const weight = clean(variant?.weightLabel) || (Number.isFinite(grams) && grams > 0 ? `${grams}g` : '');
      const price = Number.isInteger(variant?.price) && variant.price >= 0 ? variant.price : null;
      const schedule = saleSchedule(product, variant);
      const sale = schedule ? resolveSale(schedule, now) : { price, compareAt: null, promo: null };
      const aliases = [];
      if (product?.type) aliases.push(clean(String(product.type).replace(/[-_]/g, ' ')));
      if (Array.isArray(product?.aliases)) {
        for (const alias of product.aliases) {
          const text = clean(alias);
          if (text) aliases.push(text);
        }
      }
      const featured = Number.isInteger(product?.featured) ? product.featured : null;
      const bags = Number.isInteger(variant?.bags) && variant.bags > 1 ? variant.bags : null;
      lines.push({
        id,
        shopId,
        name,
        brand,
        category,
        line: clean(product?.line),
        pitch: clean(product?.pitch),
        ...(featured != null ? { featured } : {}),
        sku,
        weight,
        grams: Number.isFinite(grams) ? grams : null,
        price: sale.price,
        ...(bags ? { bags } : {}),
        ...(variant?.limited === true || product?.limited === true ? { limited: true } : {}),
        ...(variant?.oos === true || product?.oos === true ? { oos: true } : {}),
        ...(schedule ? { schedule } : {}),
        url,
        aliases,
      });
    }
  }
  const ownLabel = (row) => fold(row.brand) === 'moc qua' ? 1 : 0;
  lines.sort((a, b) => (a.featured ?? 9999) - (b.featured ?? 9999) || ownLabel(a) - ownLabel(b) || a.category.localeCompare(b.category, 'vi') || a.name.localeCompare(b.name, 'vi') || a.sku.localeCompare(b.sku));
  return lines;
}

function quotedPrice(row, now) {
  const sale = row?.schedule ? resolveSale(row.schedule, now) : { price: row?.price ?? null, promo: null };
  if (sale.price == null) return 'chưa có giá';
  if (!sale.promo) return String(sale.price);
  return `${sale.price} (khuyến mãi ${sale.promo.price}, giá gốc ${sale.promo.originalPrice}, hết ${sale.promo.label})`;
}

export function formatCatalog(lines, now = new Date()) {
  if (!lines?.length) return '';
  return lines.map((row) => {
    const flags = [row.limited ? 'phiên bản giới hạn' : '', row.oos ? 'hết hàng' : ''].filter(Boolean).join(', ');
    return [row.brand, row.line, row.name, row.weight, quotedPrice(row, now), row.pitch, flags, row.url].filter(Boolean).join(' | ');
  }).join('\n');
}

export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

const STOP = new Set(['gia', 'bao', 'nhieu', 'khong', 'cho', 'minh', 'shop', 'cai', 'mot', 'ban', 'em', 'anh', 'chi', 'voi', 'cua', 'va', 'la', 'co', 'the', 'nao', 'hoi', 'giup', 'moc', 'qua', 'xin', 'chao', 'toi', 'muon', 'mua', 'dat', 'ko', 'nhe', 'a']);
const UNITS = new Set(['g', 'gr', 'gram', 'grams', 'kg']);

function tokensOf(value) {
  return fold(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 2 && !STOP.has(word) && !UNITS.has(word));
}

function weightForms(value) {
  const forms = [];
  const source = fold(value);
  for (const token of source.split(/[^a-z0-9]+/).filter(Boolean)) {
    const match = token.match(/^(\d+)(g|gr|gram|grams|kg)?$/);
    if (!match) continue;
    forms.push(match[1], `${match[1]}g`, `${match[1]}gr`, `${match[1]}gram`);
    if (match[2] === 'kg') forms.push(`${match[1]}kg`);
  }
  return forms;
}

function queryTokens(message) {
  const out = new Set();
  for (const token of fold(message).split(/[^a-z0-9]+/).filter(Boolean)) {
    if (STOP.has(token) || UNITS.has(token) || token.length < 2) continue;
    out.add(token);
    for (const form of weightForms(token)) out.add(form);
  }
  return [...out];
}

function itemTokens(item) {
  const bag = new Set();
  const fields = [item?.name, item?.brand, item?.category, item?.weight, item?.sku, ...(item?.aliases || [])];
  for (const field of fields) {
    for (const token of tokensOf(field)) bag.add(token);
    for (const form of weightForms(field)) bag.add(form);
  }
  for (const form of weightForms(item?.grams)) bag.add(form);
  return bag;
}

function tokenHit(hay, token) {
  if (hay.has(token)) return 2;
  if (token.length < 3 || /^\d/.test(token)) return 0;
  for (const have of hay) {
    if (have.length < 3 || /^\d/.test(have)) continue;
    if (have.startsWith(token) || token.startsWith(have)) return 1;
  }
  return 0;
}

export function relatedItems(items, message, limit = 12) {
  const query = queryTokens(message);
  if (!query.length) return [];
  const scored = [];
  for (const item of items || []) {
    const hay = itemTokens(item);
    const nameWords = tokensOf(item?.name);
    let matched = 0;
    let score = 0;
    for (const token of query) {
      const hit = tokenHit(hay, token);
      if (!hit) continue;
      matched += 1;
      score += hit * (token.length >= 4 || /^\d/.test(token) ? 6 : 4);
    }
    if (!matched) continue;
    const nameHits = nameWords.filter((word) => query.some((token) => token === word || (token.length >= 3 && (word.startsWith(token) || token.startsWith(word))))).length;
    score += matched * 10;
    if (nameWords.length) score += Math.round((nameHits / nameWords.length) * 24);
    if (matched === query.length) score += 20;
    scored.push({ item, score, matched });
  }
  scored.sort((a, b) => b.matched - a.matched || b.score - a.score || (a.item.featured ?? 9999) - (b.item.featured ?? 9999) || a.item.name.localeCompare(b.item.name, 'vi') || String(a.item.sku).localeCompare(String(b.item.sku)));
  return scored.map((row) => row.item).slice(0, limit);
}

function clean(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

const BUNDLE_URL = new URL('../../server/data/danh-muc.json', import.meta.url);
const bundleByOrigin = new Map();

function httpError(status) {
  const err = new Error(`catalog-http-${status}`);
  err.status = status;
  return err;
}

// Bản trong repo, dùng khi máy cửa hàng (phía Cloudflare) trả 429 và bộ nhớ còn trống.
function readBundle(origin) {
  if (bundleByOrigin.has(origin)) return bundleByOrigin.get(origin);
  let data = null;
  try {
    const payload = JSON.parse(fs.readFileSync(BUNDLE_URL, 'utf8'));
    if (payload && Array.isArray(payload.products) && payload.products.length) {
      data = { items: compactCatalog(payload, { origin }), updated: clean(payload.updated) || 'bundle' };
    }
  } catch {
    data = null;
  }
  bundleByOrigin.set(origin, data);
  return data;
}

export function createCatalogSource({
  fetchImpl = globalThis.fetch,
  url = process.env.MOCQUA_CATALOG_URL || DEFAULT_URL,
  origin = shopOrigin(),
  ttlMs = Number(process.env.CATALOG_TTL_MS) || 10 * 60 * 1000,
  timeoutMs = Number(process.env.CATALOG_TIMEOUT_MS) || 25_000,
  failCooldownMs = Number(process.env.CATALOG_FAIL_COOLDOWN_MS) || 60_000,
  bundle = true,
} = {}) {
  let cache = null;
  let pending = null;
  let failedAt = 0;

  async function pullOnce() {
    const target = new URL(url);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') throw new Error('catalog-url');
    const response = await fetchImpl(target, {
      headers: { accept: 'application/json', 'user-agent': 'MocQua-ai-server' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw httpError(response.status);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('catalog-shape');
    return { items: compactCatalog(payload, { origin }), updated: clean(payload.updated) };
  }

  async function pull() {
    try {
      return await pullOnce();
    } catch (err) {
      // 429: gọi lại ngay làm Cloudflare siết chặt hơn. Lỗi khác thử một lần.
      if (err?.status === 429) throw err;
      console.error('catalog fetch failed, retrying', err instanceof Error ? err.message : 'error');
      return pullOnce();
    }
  }

  function remember(data, at) {
    cache = { at, data };
    return data;
  }

  return async function loadCatalog(now = Date.now()) {
    if (cache && now - cache.at < ttlMs) return { ok: true, stale: false, ...cache.data };
    if (cache && failedAt && now - failedAt < failCooldownMs) return { ok: true, stale: true, ...cache.data };
    if (!pending) pending = pull().finally(() => { pending = null; });
    try {
      const data = await pending;
      remember(data, now);
      failedAt = 0;
      return { ok: true, stale: false, ...data };
    } catch (err) {
      console.error('catalog fetch failed', err instanceof Error ? err.message : 'error');
      failedAt = now;
      if (cache) return { ok: true, stale: true, ...cache.data };
      const seeded = bundle ? readBundle(origin) : null;
      if (seeded) {
        remember(seeded, now - ttlMs);
        return { ok: true, stale: true, bundled: true, ...seeded };
      }
      return { ok: false, stale: false, items: [], updated: '' };
    }
  };
}
