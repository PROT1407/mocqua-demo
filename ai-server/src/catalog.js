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
    for (const variant of product?.variants || []) {
      const sku = clean(variant?.code);
      if (!sku) continue;
      const shopId = clean(variant?.shopId);
      const url = shopId ? `${origin}/san-pham/${encodeURIComponent(shopId)}` : '';
      const grams = Number(variant?.weightG);
      const weight = clean(variant?.weightLabel) || (Number.isFinite(grams) && grams > 0 ? `${grams}g` : '');
      const price = Number.isInteger(variant?.price) && variant.price >= 0 ? variant.price : null;
      const aliases = [];
      if (product?.type) aliases.push(clean(String(product.type).replace(/[-_]/g, ' ')));
      if (Array.isArray(product?.aliases)) {
        for (const alias of product.aliases) {
          const text = clean(alias);
          if (text) aliases.push(text);
        }
      }
      lines.push({
        id,
        shopId,
        name,
        brand,
        category,
        sku,
        weight,
        grams: Number.isFinite(grams) ? grams : null,
        price,
        url,
        aliases,
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
  scored.sort((a, b) => b.matched - a.matched || b.score - a.score || a.item.name.localeCompare(b.item.name, 'vi') || String(a.item.sku).localeCompare(String(b.item.sku)));
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
