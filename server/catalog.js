import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './paths.js';
import { getOverrides, getSettings } from './db.js';

const BRAND_ORDER = ['mq', 'fh', 'goodgood', 'cheers', 'yummy', 'kita', 'vizabox', 'other'];

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
];

const SHELF_FOR_FRUIT = {
  xoai: 'viza-ke-05',
  saurieng: 'viza-ke-02',
  mit: 'viza-ke-03',
  thanhlong: 'viza-ke-12',
};

const existsCache = new Map();

function fileExists(abs) {
  if (existsCache.has(abs)) return existsCache.get(abs);
  const ok = fs.existsSync(abs);
  existsCache.set(abs, ok);
  return ok;
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

function presentVariant(mq, product, variant, price) {
  const packs = product.packs || null;
  return {
    sku: variant.sku,
    w: variant.w,
    g: variant.g || 0,
    line: variant.line || '',
    lineName: lineName(mq, variant.line),
    price,
    pack: variant.pk || '',
    note: variant.note || '',
    img: resolveImg(variant.img, true),
    back: resolveImg(variant.back, true),
    group: packs ? variant.w : variant.sku,
  };
}

function presentProduct(mq, product, { detail = false } = {}) {
  const overrides = getOverrides();
  const over = overrides.products.get(product.id);
  const variants = (product.variants || []).filter((v) => v.sku).map((variant) => {
    const price = overrides.prices.has(variant.sku) ? overrides.prices.get(variant.sku) : (variant.p ?? null);
    return presentVariant(mq, product, variant, price);
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
  let shelf = null;
  if (product.maker === 'viza') {
    const id = SHELF_FOR_FRUIT[product.fruit] || 'viza-ke-01';
    const cap = SHELF_CAPS.find(([k]) => k === id)?.[1] || 'Hàng trên kệ';
    shelf = {
      src: `/assets/shelf/${id}.webp`,
      thumb: `/assets/shelf/${id}-t.webp`,
      cap,
    };
  }
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
    badge: product.badge || '',
    oos: !!product.oos,
    rank: product.rank || 99,
    short: over?.short || product.short || '',
    catalogShort: product.short || '',
    shortOverride: over?.short || '',
    hidden: !!over?.hidden,
    packs: product.packs
      ? Object.fromEntries(Object.entries(product.packs).map(([k, v]) => [k, { name: v.name, colors: v.c || [] }]))
      : null,
    pknote: product.pknote || '',
    related: Array.isArray(product.related) ? product.related : [],
    relatedNote: product.relatedNote || '',
    variants,
    defaultSku: def?.sku || '',
    priceFrom: prices.length ? Math.min(...prices) : null,
    priceVaries: new Set(prices).size > 1,
    weightLabel: variants.length ? weightLabel(variants) : '',
    cardImg: def?.img || resolveImg(product.img, false) || resolveImg(cat.img, false),
    open: real?.src ? real : null,
    shelf,
  };
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

export function getShopCatalog() {
  const { mq } = loadBase();
  const settings = getSettings();
  const products = mq.PRODUCTS
    .filter((p) => !p.soon)
    .map((p) => presentProduct(mq, p))
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
    giftLabel: gift?.w || 'Gói nhỏ 50–100g',
    provinces: mq.PROVINCES || [],
    shelf: getShelf(),
  };
}

export function getProductPage(id) {
  const { mq, byId } = loadBase();
  const alias = mq.ID_ALIAS || {};
  const realId = alias[id] || id;
  const product = byId.get(realId);
  if (!product || product.soon) return { redirect: alias[id] ? realId : null, product: null };
  const view = presentProduct(mq, product, { detail: true });
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
      variants: (product.variants || []).filter((v) => v.sku).map((variant) => {
        const current = view.variants.find((v) => v.sku === variant.sku);
        return {
          sku: variant.sku,
          w: variant.w,
          label: current?.label || variant.w,
          catalogPrice: variant.p ?? null,
          price: current?.price ?? null,
          overridden: overrides.prices.has(variant.sku),
        };
      }),
    };
  });
}

export function lookupSku(sku, { allowHidden = false } = {}) {
  const { mq, bySku } = loadBase();
  const key = (mq.SKU_ALIAS || {})[sku] || sku;
  const hit = bySku.get(key);
  if (!hit) return null;
  const overrides = getOverrides();
  const hidden = !!overrides.products.get(hit.product.id)?.hidden;
  if (hidden && !allowHidden) return null;
  const price = overrides.prices.has(key) ? overrides.prices.get(key) : (hit.variant.p ?? null);
  return {
    sku: key,
    price,
    product: hit.product,
    variant: hit.variant,
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
