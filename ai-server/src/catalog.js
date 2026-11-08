const DEFAULT_URL = 'https://mocqua.onrender.com/api/danh-muc';

export function compactCatalog(payload) {
  const cats = new Map((payload?.categories || []).map((c) => [c.id, c.name]));
  const lines = [];
  for (const product of payload?.products || []) {
    const name = clean(product?.name);
    if (!name) continue;
    const brand = clean(product?.label);
    const category = clean(cats.get(product?.cat) || product?.cat);
    for (const variant of product?.variants || []) {
      const sku = clean(variant?.code);
      if (!sku) continue;
      const grams = Number(variant?.weightG);
      const weight = clean(variant?.weightLabel) || (Number.isFinite(grams) && grams > 0 ? `${grams}g` : '');
      const price = Number.isInteger(variant?.price) && variant.price >= 0 ? variant.price : null;
      lines.push({ name, brand, category, sku, weight, grams: Number.isFinite(grams) ? grams : null, price });
    }
  }
  lines.sort((a, b) => a.category.localeCompare(b.category, 'vi') || a.name.localeCompare(b.name, 'vi') || a.sku.localeCompare(b.sku));
  return lines;
}

export function formatCatalog(lines) {
  if (!lines.length) return '';
  return lines.map((row) => {
    const price = row.price == null ? 'chưa có giá' : String(row.price);
    return [row.category, row.brand, row.name, row.sku, row.weight, price].join(' | ');
  }).join('\n');
}

function clean(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function createCatalogSource({
  fetchImpl = globalThis.fetch,
  url = process.env.MOCQUA_CATALOG_URL || DEFAULT_URL,
  ttlMs = Number(process.env.CATALOG_TTL_MS) || 5 * 60 * 1000,
  timeoutMs = Number(process.env.CATALOG_TIMEOUT_MS) || 8000,
} = {}) {
  let cache = null;
  let pending = null;

  async function pull() {
    const target = new URL(url);
    if (target.protocol !== 'https:' && target.protocol !== 'http:') throw new Error('catalog-url');
    const response = await fetchImpl(target, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`catalog-http-${response.status}`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('catalog-shape');
    return { items: compactCatalog(payload), updated: clean(payload.updated) };
  }

  return async function loadCatalog(now = Date.now()) {
    if (cache && now - cache.at < ttlMs) return { ok: true, stale: false, ...cache.data };
    if (!pending) {
      pending = pull().finally(() => { pending = null; });
    }
    try {
      const data = await pending;
      cache = { at: now, data };
      return { ok: true, stale: false, ...data };
    } catch (err) {
      console.error('catalog fetch failed', err instanceof Error ? err.message : 'error');
      if (cache) return { ok: true, stale: true, ...cache.data };
      return { ok: false, stale: false, items: [], updated: '' };
    }
  };
}
