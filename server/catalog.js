import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './paths.js';
import { getOverrides, getSettings } from './db.js';
import { mediaExists } from './media.js';
import { problem } from './format.js';
import { resolveSale } from '../ai-server/src/sale.js';
import { catalogData } from './danhmuc.js';
import { CATALOG_TO_SHOP } from './dm-buy.js';

const BRAND_ORDER = ['fh', 'goodgood', 'cheers', 'yummy', 'kita', 'vizafood', 'vizabox', 'psdd', 'ycnuts', 'mq', 'other'];

const SHELF_CAPS = [
  ['viza-ke-01', 'Kệ trái cây sấy Viza Food: xoài, mít, sầu riêng'],
  ['viza-ke-02', 'Sầu riêng sấy thăng hoa Yummy và Cheers+ trong tủ kệ'],
  ['viza-ke-03', 'Sầu riêng Cheers+ và mít sấy Fresh & Healthy'],
  ['viza-ke-04', 'Xoài sấy dẻo Fresh & Healthy trên kệ'],
  ['viza-ke-05', 'Xoài sấy dẻo Cheers+, GoodGood, Fresh & Healthy tại siêu thị'],
  ['viza-ke-06', 'Quầy xoài, mít sấy Viza Food tại siêu thị'],
  ['viza-ke-07', 'Giá treo xoài sấy dẻo Fresh & Healthy'],
  ['viza-ke-08', 'Xoài sấy dẻo Fresh & Healthy tại cửa hàng'],
  ['viza-ke-09', 'Sầu riêng sấy và mít sấy trên kệ'],
  ['viza-ke-10', 'Sầu riêng sấy Viza Food tại siêu thị'],
  ['viza-ke-11', 'Kệ sầu riêng sấy Viza Food'],
  ['viza-ke-12', 'Thanh long sấy Viza Food tại siêu thị'],
  ['viza-ke-13', 'Xoài sấy dẻo muối ớt Fresh & Healthy trên kệ siêu thị'],
  ['viza-ke-14', 'Xoài muối ớt, thơm, cóc sấy GoodGood trên kệ'],
  ['viza-ke-15', 'Bàn trưng bày sầu riêng, mít, xoài sấy tại cửa hàng'],
  ['viza-ke-16', 'Sầu riêng sấy GoodGood King Fruit trên kệ'],
  ['viza-ke-17', 'Kệ xoài sấy dẻo, xoài muối ớt, mít sấy Fresh & Healthy'],
  ['viza-ke-18', 'Kiosk trái cây sấy Viza Food tại trung tâm thương mại'],
  ['viza-ke-19', 'Sầu riêng sấy GoodGood và mít sấy trong tủ kính'],
  ['viza-ke-20', 'Sầu riêng KITA, xoài sấy dẻo, mít sấy trên kệ siêu thị'],
];

// Ảnh kệ: chỉ theo bảng MQ.SHELF_FOR trong js/data.js (trang nào có túi của chính nó trên ảnh kệ thì mới gắn ảnh đó).

const existsCache = new Map();

function fileExists(abs) {
  if (existsCache.has(abs)) return existsCache.get(abs);
  const ok = fs.existsSync(abs);
  existsCache.set(abs, ok);
  return ok;
}

const GALLERY_FILE = /^(asset:[\w./-]{1,180}|upload:[a-z0-9-]{1,60}\.(?:jpg|png|webp))$/;

export function gallerySrc(file) {
  const key = String(file || '');
  if (key.startsWith('upload:')) {
    const name = key.slice('upload:'.length);
    return mediaExists(name) ? `/media/${name}` : null;
  }
  if (key.startsWith('asset:')) return resolveImg(key.slice('asset:'.length), true);
  return null;
}

export function defaultGallery(product) {
  const items = [];
  const push = (img, label) => {
    if (!img) return;
    const src = resolveImg(img, true);
    if (!src?.startsWith('/assets/')) return;
    const file = `asset:${src.slice('/assets/'.length)}`;
    if (items.some((item) => item.file === file)) return;
    items.push({ file, label: label || 'Ảnh', alt: product.name || '', hero: items.length === 0 });
  };
  const variants = product?.variants || [];
  const lead = variants.find((variant) => variant.sku === product?.def) || variants[0];
  if (lead?.img) push(lead.img, 'Bao bì');
  for (const variant of variants) {
    push(variant.img, 'Bao bì');
    push(variant.back, variant.backKind || 'Mặt sau');
  }
  for (const photo of product?.photos || []) push(photo[0], photo[1] || 'Ảnh');
  if (!items.length) push(product?.img, 'Ảnh');
  return items;
}

export function normalizeGallery(product, input) {
  if (!Array.isArray(input) || input.length > 24) throw problem(400, 'Danh sách ảnh chưa đúng.');
  const items = [];
  const seen = new Set();
  for (const row of input) {
    const file = String(row?.file || '');
    if (!GALLERY_FILE.test(file) || seen.has(file) || !gallerySrc(file)) throw problem(400, 'Một ảnh không dùng được.');
    seen.add(file);
    items.push({
      file,
      label: String(row?.label || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      alt: String(row?.alt || product?.name || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      hero: row?.hero === true,
    });
  }
  const heroes = items.filter((item) => item.hero);
  if (items.length && heroes.length !== 1) {
    for (const item of items) item.hero = false;
    items[0].hero = true;
  }
  return items;
}

export function resolveImg(f, portrait = false) {
  if (!f) return null;
  let rel = String(f).replace(/^\/?assets\//, '');
  if (rel.startsWith('desc/')) {
    const abs = path.join(ROOT, 'assets', rel);
    return fileExists(abs) ? '/assets/' + rel : null;
  }
  if (!rel.startsWith('products/') && !rel.startsWith('img/') && !rel.startsWith('shelf/')) {
    rel = 'img/' + rel;
  }
  if (/\.\w+$/.test(rel)) {
    return fileExists(path.join(ROOT, 'assets', rel)) ? '/assets/' + rel : null;
  }
  const candidates = portrait
    ? [rel + '-45.jpg', rel + '.jpg', rel + '.webp', rel + '-45.webp']
    : [rel + '.jpg', rel + '-45.jpg', rel + '.webp', rel + '-45.webp'];
  for (const c of candidates) {
    if (fileExists(path.join(ROOT, 'assets', c))) return '/assets/' + c;
  }
  return null;
}

let baseCache;

function loadBase() {
  if (baseCache) return baseCache;
  const code = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const g = { console };
  g.window = g;
  vm.createContext(g);
  vm.runInContext(code, g, { filename: 'js/data.js' });
  const mq = g.MQ;
  if (!mq?.PRODUCTS?.length) throw new Error('Không đọc được danh mục trong js/data.js');
  const bySku = new Map();
  const byId = new Map();
  for (const product of mq.PRODUCTS) {
    byId.set(product.id, product);
    for (const variant of product.variants || []) {
      if (variant.sku) bySku.set(variant.sku, { product, variant });
    }
  }
  baseCache = { mq, bySku, byId };
  return baseCache;
}

function lineName(mq, key) {
  return mq.LINES?.[key]?.name || '';
}

function brandKeyOf(product) {
  const lines = product.lines || [];
  if (product.own || lines.includes('mq')) return 'mq';
  for (const key of BRAND_ORDER) if (lines.includes(key)) return key;
  return lines[0] || 'other';
}

function weightLabel(variants) {
  if (variants.length === 1) return variants[0].w;
  const grams = variants.map((v) => v.g).filter((g) => g > 0);
  if (!grams.length) return variants.length + ' quy cách';
  const min = Math.min(...grams);
  const max = Math.max(...grams);
  const fmt = (g) => (g >= 1000 && g % 1000 === 0 ? g / 1000 + 'kg' : g + 'g');
  return min === max ? fmt(min) : fmt(min) + ' – ' + fmt(max);
}

function saleFor(product, variant, price, overridden, now) {
  if (overridden || !(price > 0)) return { price, compareAt: null, promo: null };
  return resolveSale({
    price,
    grams: variant.g || variant.weightG || null,
    listPer100g: product.listPer100g,
    promoEndsAt: product.promoEndsAt,
    promo: variant.promo,
  }, now);
}

function applyCompare(sale, flag) {
  if (!flag || !Number.isInteger(flag.compareAt) || !(sale.price > 0) || flag.compareAt <= sale.price) return sale;
  return {
    price: sale.price,
    compareAt: flag.compareAt,
    promo: { price: sale.price, originalPrice: flag.compareAt, endsAt: '', label: 'Khuyến mãi' },
  };
}

function flagOos(variant, flag) {
  if (flag && flag.oos != null) return flag.oos;
  return variant.oos === true;
}

function catalogStoryBySku() {
  const { mq, bySku } = loadBase();
  const map = new Map();
  const shopSku = (code) => {
    if (bySku.has(code)) return code;
    const alias = mq.SKU_ALIAS?.[code];
    if (alias && bySku.has(alias)) return alias;
    const mapped = CATALOG_TO_SHOP[code];
    if (mapped && bySku.has(mapped)) return mapped;
    return '';
  };
  for (const product of catalogData().products || []) {
    const featured = Number.isInteger(product.featured) ? product.featured : null;
    const line = typeof product.line === 'string' ? product.line : '';
    const pitch = typeof product.pitch === 'string' ? product.pitch : '';
    if (featured == null && !line && !pitch) continue;
    const story = { featured, line, pitch };
    for (const variant of product.variants || []) {
      const sku = shopSku(variant?.code);
      if (sku && !map.has(sku)) map.set(sku, story);
    }
  }
  return map;
}

function storyOf(product, stories) {
  let best = null;
  for (const variant of product.variants || []) {
    const story = stories.get(variant.sku);
    if (!story) continue;
    if (!best || (story.featured != null && (best.featured == null || story.featured < best.featured))) best = story;
  }
  return best;
}

function presentVariant(mq, product, variant, sale, oos) {
  const packs = product.packs || null;
  return {
    sku: variant.sku,
    w: variant.w,
    g: variant.g || 0,
    line: variant.line || '',
    lineName: lineName(mq, variant.line),
    price: sale.price,
    ...(sale.compareAt != null ? { compareAt: sale.compareAt } : {}),
    ...(sale.promo ? { promo: sale.promo } : {}),
    pack: variant.pk || '',
    bags: Number.isInteger(variant.bags) && variant.bags > 1 ? variant.bags : null,
    limited: variant.limited === true,
    oos: oos === true,
    note: variant.note || '',
    img: resolveImg(variant.img, true),
    back: resolveImg(variant.back, true),
    ...(variant.backKind ? { backKind: variant.backKind } : {}),
    group: packs ? variant.w : variant.sku,
  };
}

let storyCache;
function stories() {
  if (!storyCache) storyCache = catalogStoryBySku();
  return storyCache;
}

function presentProduct(mq, product, { detail = false, now = new Date() } = {}) {
  const overrides = getOverrides();
  const over = overrides.products.get(product.id);
  const variants = (product.variants || []).filter((v) => v.sku).map((variant) => {
    const flag = overrides.flags.get(variant.sku);
    const overridden = overrides.prices.has(variant.sku);
    const price = overridden ? overrides.prices.get(variant.sku) : (variant.p ?? null);
    const sale = applyCompare(saleFor(product, variant, price, overridden, now), flag);
    return presentVariant(mq, product, variant, sale, flagOos(variant, flag));
  });
  const multiLine = new Set(variants.map((v) => v.line).filter(Boolean)).size > 1;
  for (const variant of variants) {
    variant.label = variant.w + (!product.packs && multiLine && variant.lineName ? ' · ' + variant.lineName : '');
  }
  const priced = variants.filter((v) => v.price > 0);
  const def = variants.find((v) => v.sku === product.def && v.price > 0) || priced[0] || variants[0];
  const prices = priced.map((v) => v.price);
  const cat = mq.CATS[product.cat] || { name: product.cat, short: product.cat, desc: '' };
  const fruit = product.fruit ? mq.FRUITS[product.fruit] : null;
  const flavour = product.flavour ? mq.FLAVOURS[product.flavour] : null;
  const maker = mq.MAKERS[product.maker] || {};
  const lines = product.lines || [];
  const brandKey = brandKeyOf(product);
  const real = product.real?.img ? { src: resolveImg(product.real.img), cap: product.real.cap || 'Ảnh mở túi' } : null;
  const shelfIds = Array.isArray(mq.SHELF_FOR?.[product.id]) ? mq.SHELF_FOR[product.id] : [];
  const shelves = shelfIds
    .filter((id) => SHELF_CAPS.some(([k]) => k === id))
    .map((id) => ({
      src: `/assets/shelf/${id}.webp`,
      thumb: `/assets/shelf/${id}-t.webp`,
      cap: SHELF_CAPS.find(([k]) => k === id)[1],
      ...(mq.SHELF_BAGS?.[product.id] ? { bags: [...(mq.SHELF_BAGS[product.id][id] || mq.SHELF_BAGS[product.id]['*'] || [])] } : {}),
    }));
  const story = storyOf(product, stories()) || {};
  const out = {
    id: product.id,
    name: product.name,
    cat: product.cat,
    catName: cat.name,
    catShort: cat.short,
    catDesc: cat.desc || '',
    fruit: product.fruit || '',
    fruitName: fruit?.name || '',
    flavourName: flavour?.name || '',
    maker: product.maker || '',
    makerName: maker.name || '',
    makerNote: maker.note || '',
    lines,
    lineNames: lines.map((k) => lineName(mq, k)).filter(Boolean),
    brandKey,
    brandName: lineName(mq, brandKey) || maker.name || 'Khác',
    own: !!product.own,
    featured: story.featured ?? null,
    pitch: story.pitch || '',
    line: story.line || '',
    badge: product.badge || '',
    oos: !!product.oos,
    rank: product.rank || 99,
    short: over?.short || product.short || '',
    catalogShort: product.short || '',
    shortOverride: over?.short || '',
    // Ẩn khỏi cửa hàng: cờ hide:true trong js/data.js (giữ qua mỗi lần deploy) hoặc nút Ẩn ở /admin.
    hidden: !!over?.hidden || !!product.hide,
    packs: product.packs
      ? Object.fromEntries(Object.entries(product.packs).map(([k, v]) => [k, { name: v.name, colors: v.c || [] }]))
      : null,
    pknote: product.pknote || '',
    // Ghi chú cho khách trên trang sản phẩm (vd. mẫu bao bì đã hết, đang giao túi khác).
    notice: product.notice || '',
    related: Array.isArray(product.related) ? product.related : [],
    relatedNote: product.relatedNote || '',
    comboOf: Array.isArray(product.comboOf) ? product.comboOf : [],
    combo: product.combo && product.combo.id ? { id: product.combo.id, label: product.combo.label || '' } : null,
    // Combo trộn vị (trang /combo): không xếp vào lưới /cua-hang, không gắn vào thẻ lẻ ở /danh-muc.
    mixed: !!product.mixed,
    kem: Array.isArray(product.kem) ? product.kem : [],
    variants,
    defaultSku: def?.sku || '',
    priceFrom: prices.length ? Math.min(...prices) : null,
    priceVaries: new Set(prices).size > 1,
    weightLabel: variants.length ? weightLabel(variants) : '',
    cardImg: def?.img || resolveImg(product.img, false) || resolveImg(cat.img, false),
    open: real?.src ? real : null,
    shelves,
    shelf: shelves[0] || null,
    // Ảnh khung 4:5 cần hiện trọn (ảnh nhiều túi đứng cạnh nhau); ảnh khác giữ khung PDP như cũ.
    // Ảnh kệ cũng hiện trọn (không cắt giữa) để khách thấy rõ túi của sản phẩm trên kệ.
    fit45: [
      ...(Array.isArray(product.fit45) ? product.fit45 : []).map((f) => resolveImg(f, true)).filter(Boolean),
      ...((mq.GALLERY_AS_IS || []).includes(product.id) ? [] : shelves.map((s) => s.src)),
    ],
    // Ảnh thêm sau ảnh bao bì (vd. combo: từng túi trong combo): [đường dẫn, nhãn ngắn, alt].
    photos: (Array.isArray(product.photos) ? product.photos : [])
      .map(([img, kind, alt]) => ({ src: resolveImg(img, true), kind: kind || 'Ảnh', alt: alt || product.name }))
      .filter((x) => x.src),
  };
  const saved = overrides.galleries.get(product.id);
  if (saved?.length) {
    const shots = saved.map((item) => ({
      src: gallerySrc(item.file),
      kind: item.label || (item.hero ? 'Ảnh chính' : 'Ảnh'),
      alt: item.alt || product.name,
      hero: !!item.hero,
    })).filter((item) => item.src);
    if (shots.length) {
      const hero = shots.find((item) => item.hero) || shots[0];
      out.cardImg = hero.src;
      out.gallery = shots;
    }
  }
  if (detail) {
    out.long = product.long || '';
    const desc = product.desc;
    out.intro = desc?.intro || '';
    out.sections = (desc?.sec || [])
      .filter((s) => ['huong', 'spec', 'dung', 'qua', 'nguon'].includes(s.k))
      .map((s) => ({
        h: s.h,
        p: (s.p || []).slice(0, 3),
        li: s.li || null,
        spec: s.spec || null,
      }));
  }
  return out;
}

export function getShelf() {
  return SHELF_CAPS.map(([id, cap]) => ({
    src: `/assets/shelf/${id}.webp`,
    thumb: `/assets/shelf/${id}-t.webp`,
    cap,
  }));
}

const RI6 = /ri\s*6/i;

function inStockVariant(variant) {
  return Boolean(variant && variant.price > 0 && !variant.oos);
}

function safePitch(text) {
  const value = String(text || '').trim();
  if (!value || /đã hết|hết hàng/i.test(value)) return '';
  return value;
}

function isRi6(product) {
  return RI6.test(product?.id || '') || RI6.test(product?.name || '');
}

function isSetCombo(product) {
  return Boolean(product?.mixed || product?.comboOf?.length || /^combo\b/i.test(product?.name || ''));
}

// Món còn hàng cùng loại, nổi bật trước. Không gồm Ri6. Biến thể khác của chính món hết hàng (ví dụ bộ 2 túi) được giữ lại.
export function replacementsFor(sku, catalog = getShopCatalog()) {
  let source = null;
  for (const product of catalog.products) {
    if (product.variants.some((variant) => variant.sku === sku)) {
      source = product;
      break;
    }
  }
  if (!source) return [];
  const pick = (product) => product.variants.find((variant) => variant.sku === product.defaultSku && inStockVariant(variant))
    || product.variants.find(inStockVariant);
  const singles = [];
  const siblings = [];
  for (const product of catalog.products) {
    if (product.hidden || product.oos || isRi6(product)) continue;
    if (source.fruit ? product.fruit !== source.fruit : product.cat !== source.cat) continue;
    const variant = pick(product);
    if (!variant || variant.sku === sku) continue;
    const card = {
      sku: variant.sku,
      name: product.name,
      w: variant.w || '',
      price: variant.price,
      img: variant.img || product.cardImg || '',
      href: `/san-pham/${encodeURIComponent(product.id)}?sku=${encodeURIComponent(variant.sku)}`,
      pitch: safePitch(product.pitch),
    };
    if (product.id === source.id) {
      card.name = `${product.brandName} · ${variant.w}`;
      if (!card.pitch && variant.bags > 1) card.pitch = `${variant.bags} túi, còn hàng.`;
      siblings.push(card);
    } else if (!isSetCombo(product)) {
      singles.push({ card, product, featured: product.featured ?? 999, name: product.name });
    }
  }
  const later = (product) => (/monthong/i.test(product.name) ? 2 : product.brandKey === 'goodgood' ? 0 : 1);
  singles.sort((a, b) => a.featured - b.featured || later(a.product) - later(b.product) || a.name.localeCompare(b.name, 'vi'));
  const room = siblings.length ? 3 : 4;
  return [...singles.slice(0, room).map((row) => row.card), ...siblings].slice(0, 4);
}

export function getShopCatalog(now = new Date()) {
  const { mq } = loadBase();
  const settings = getSettings();
  const products = mq.PRODUCTS
    .filter((p) => !p.soon)
    .map((p) => presentProduct(mq, p, { now }))
    .filter((p) => !p.hidden && p.variants.length);
  const gift = products.flatMap((p) => p.variants).find((v) => v.sku === settings.giftSku);
  return {
    products,
    cats: Object.entries(mq.CATS).filter(([, c]) => !c.soon).map(([id, c]) => ({
      id,
      name: c.name,
      short: c.short,
      desc: c.desc || '',
      img: resolveImg(c.img, true),
    })),
    settings,
    giftRetail: gift?.price ?? null,
    giftLabel: gift?.w || '80g',
    provinces: mq.PROVINCES || [],
    shelf: getShelf(),
  };
}

export function getRawProduct(id) {
  const { byId } = loadBase();
  return byId.get(id) || null;
}

export function getProductPage(id, now = new Date()) {
  const { mq, byId } = loadBase();
  const alias = mq.ID_ALIAS || {};
  const realId = alias[id] || id;
  const product = byId.get(realId);
  if (!product || product.soon) return { redirect: alias[id] ? realId : null, product: null };
  const view = presentProduct(mq, product, { detail: true, now });
  if (view.hidden) return { redirect: null, product: null };
  if (alias[id]) return { redirect: realId, product: view };
  return { redirect: null, product: view };
}

export function adminProducts() {
  const { mq } = loadBase();
  const overrides = getOverrides();
  return mq.PRODUCTS.filter((p) => !p.soon).map((product) => {
    const view = presentProduct(mq, product);
    return {
      ...view,
      gallery: (overrides.galleries.get(product.id) || defaultGallery(product)).map((item) => ({
        file: item.file,
        label: item.label || '',
        alt: item.alt || '',
        hero: !!item.hero,
        src: gallerySrc(item.file) || '',
      })).filter((item) => item.src),
      variants: (product.variants || []).filter((v) => v.sku).map((variant) => {
        const current = view.variants.find((v) => v.sku === variant.sku);
        const flag = overrides.flags.get(variant.sku);
        return {
          sku: variant.sku,
          w: variant.w,
          label: current?.label || variant.w,
          catalogPrice: variant.p ?? null,
          price: current?.price ?? null,
          overridden: overrides.prices.has(variant.sku),
          oos: current?.oos === true,
          catalogOos: variant.oos === true,
          compareAt: flag?.compareAt ?? null,
        };
      }),
    };
  });
}

export function lookupSku(sku, { allowHidden = false, now = new Date() } = {}) {
  const { mq, bySku } = loadBase();
  const key = (mq.SKU_ALIAS || {})[sku] || sku;
  const hit = bySku.get(key);
  if (!hit) return null;
  const overrides = getOverrides();
  const hidden = !!overrides.products.get(hit.product.id)?.hidden || !!hit.product.hide;
  if (hidden && !allowHidden) return null;
  const flag = overrides.flags.get(key);
  const overridden = overrides.prices.has(key);
  const stored = overridden ? overrides.prices.get(key) : (hit.variant.p ?? null);
  const sale = applyCompare(saleFor(hit.product, hit.variant, stored, overridden, now), flag);
  const oos = flagOos(hit.variant, flag);
  return {
    sku: key,
    price: sale.price,
    ...(sale.compareAt != null ? { compareAt: sale.compareAt } : {}),
    ...(sale.promo ? { promo: sale.promo } : {}),
    product: hit.product,
    variant: oos === (hit.variant.oos === true) ? hit.variant : { ...hit.variant, oos },
    name: hit.product.name,
    w: hit.variant.w,
    g: hit.variant.g || 0,
    img: resolveImg(hit.variant.img, false),
    fruit: hit.product.fruit || '',
    id: hit.product.id,
  };
}

export function skuExists(sku) {
  return !!lookupSku(sku, { allowHidden: true });
}

export function brandOrder(key) {
  const i = BRAND_ORDER.indexOf(key);
  return i < 0 ? 50 : i;
}
