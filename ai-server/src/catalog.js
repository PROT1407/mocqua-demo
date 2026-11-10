const DEFAULT_URL = 'https://mocqua.onrender.com/api/danh-muc';
const DEFAULT_ORIGIN = 'https://mocqua.onrender.com';

export function shopOrigin(env = process.env) {
  return String(env.SHOP_PUBLIC_URL || DEFAULT_ORIGIN).replace(/\/$/, '');
}

export function compactCatalog(payload, { origin = DEFAULT_ORIGIN } = {}) {
  const cats = new Map((payload?.categories || []).map((c) => [c.id, c.name]));
  const lines = [];
  for (const product of payload?.products || []) {
    const name = clean(product?.name);
    if (!name) continue;
    const id = clean(product?.id);
    const brand = clean(product?.label);
    const category = clean(cats.get(product?.cat) || product?.cat);
    const url = id ? `${origin}/san-pham/${encodeURIComponent(id)}` : '';
    for (const variant of product?.variants || []) {
      const sku = clean(variant?.code);
      if (!sku) continue;
      const grams = Number(variant?.weightG);
      const weight = clean(variant?.weightLabel) || (Number.isFinite(grams) && grams > 0 ? `${grams}g` : '');
      const price = Number.isInteger(variant?.price) && variant.price >= 0 ? variant.price : null;
      lines.push({
        id,
        name,
        brand,
        category,
        sku,
        weight,
        grams: Number.isFinite(grams) ? grams : null,
        price,
        url,
      });
    }
  }
  lines.sort((a, b) => a.category.localeCompare(b.category, 'vi') || a.name.localeCompare(b.name, 'vi') || a.sku.localeCompare(b.sku));
  return lines;
}

export function formatCatalog(lines) {
  if (!lines?.length) return '';
  return lines.map((row) => {
    const price = row.price == null ? 'chưa có giá' : String(row.price);
    return [row.brand, row.name, row.weight, price, row.url].filter(Boolean).join(' | ');
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

const STOP = new Set(['gia', 'bao', 'nhieu', 'khong', 'cho', 'minh', 'shop', 'cai', 'mot', 'ban', 'em', 'anh', 'chi', 'voi', 'cua', 'va', 'la', 'co', 'the', 'nao', 'hoi', 'giup', 'moc', 'qua', 'xin', 'chao', 'toi', 'muon', 'mua', 'dat']);

export function relatedItems(items, message, limit = 6) {
  const msg = fold(message);
  const words = msg.split(/[^a-z0-9]+/).filter((word) => word.length >= 3 && !STOP.has(word));
  const scored = [];
  for (const item of items || []) {
    const nameWords = fold(item.name).split(/[^a-z0-9]+/).filter((word) => word.length >= 3);
    const brand = fold(item.brand);
    let score = 0;
    const hits = nameWords.filter((word) => msg.includes(word));
    score += hits.reduce((sum, word) => sum + word.length, 0);
    if (nameWords.length && hits.length === nameWords.length) score += 40;
    if (brand && words.some((word) => brand.includes(word))) score += 12;
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'vi'));
  return scored.slice(0, limit).map((row) => row.item);
}

function clean(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function createCatalogSource({
  fetchImpl = globalThis.fetch,
  url = process.env.MOCQUA_CATALOG_URL || DEFAULT_URL,
  origin = shopOrigin(),
  ttlMs = Number(process.env.CATALOG_TTL_MS) || 10 * 60 * 1000,
  timeoutMs = Number(process.env.CATALOG_TIMEOUT_MS) || 25_000,
  failCooldownMs = Number(process.env.CATALOG_FAIL_COOLDOWN_MS) || 60_000,
} = {}) {
  let cache = null;
  let pending = null;
  let failedAt = 0;

  async function pullOnce() {
    const target = new URL(url);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') throw new Error('catalog-url');
    const response = await fetchImpl(target, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`catalog-http-${response.status}`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('catalog-shape');
    return { items: compactCatalog(payload, { origin }), updated: clean(payload.updated) };
  }

  async function pull() {
    try {
      return await pullOnce();
    } catch (err) {
      console.error('catalog fetch failed, retrying', err instanceof Error ? err.message : 'error');
      return pullOnce();
    }
  }

  return async function loadCatalog(now = Date.now()) {
    if (cache && now - cache.at < ttlMs) return { ok: true, stale: false, ...cache.data };
    if (cache && failedAt && now - failedAt < failCooldownMs) return { ok: true, stale: true, ...cache.data };
    if (!pending) pending = pull().finally(() => { pending = null; });
    try {
      const data = await pending;
      cache = { at: now, data };
      failedAt = 0;
      return { ok: true, stale: false, ...data };
    } catch (err) {
      console.error('catalog fetch failed', err instanceof Error ? err.message : 'error');
      failedAt = now;
      if (cache) return { ok: true, stale: true, ...cache.data };
      return { ok: false, stale: false, items: [], updated: '' };
    }
  };
}
