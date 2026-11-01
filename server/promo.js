import { getSettings } from './db.js';
import { lookupSku, getShopCatalog } from './catalog.js';
import { comboDeals, cartNudges, shipBar, shipSingles } from './deals.js';
import { vnd, problem } from './format.js';

// Chiết khấu theo giá trị đơn (chủ shop duyệt 01/11/2026: từ 300k −3% + miễn ship, từ 500k −7%, từ 1 triệu −12%). Không còn quà tặng 0đ.
// - Mức tính trên tiền hàng trước giảm, chưa cộng phí giao.
// - Kế hoạch A (chủ shop duyệt 01/11/2026 22:00): % giảm trên toàn bộ tiền hàng, combo cũng được giảm theo đơn và vẫn tính vào mức đơn.
//   (Kế hoạch B để thử sau 1–3 tháng — xem research/gia-vizafood.md; chưa làm.)
// - Tiền giảm làm tròn xuống tới nghìn đồng.
export const ORDER_TIERS = Object.freeze([
  Object.freeze({ min: 1000000, pct: 12 }),
  Object.freeze({ min: 500000, pct: 7 }),
  Object.freeze({ min: 300000, pct: 3 }),
]);

export function isComboProduct(product) {
  if (!product) return false;
  if (Array.isArray(product.comboOf) && product.comboOf.length > 0) return true;
  if (String(product.id || '').startsWith('combo-')) return true;
  // Combo đóng sẵn của hãng (vd. YC Nuts Combo 4) không có comboOf nhưng tên bắt đầu bằng "Combo".
  return /^combo\s/i.test(String(product.name || '').trim());
}

export function tierFor(subtotal, tiers = ORDER_TIERS) {
  return tiers.find((t) => subtotal >= t.min) || null;
}

export function nextTier(subtotal, tiers = ORDER_TIERS) {
  return [...tiers].sort((a, b) => a.min - b.min).find((t) => subtotal < t.min) || null;
}

// lines: [{ line, combo }]
export function orderDiscount(lines, tiers = ORDER_TIERS) {
  const subtotal = lines.reduce((sum, l) => sum + l.line, 0);
  const comboSubtotal = lines.filter((l) => l.combo).reduce((sum, l) => sum + l.line, 0);
  const base = subtotal; // kế hoạch A: combo cũng được giảm theo đơn
  const tier = tierFor(subtotal, tiers);
  const discount = tier ? Math.floor((base * tier.pct) / 100 / 1000) * 1000 : 0;
  return { subtotal, base, comboSubtotal, pct: tier ? tier.pct : 0, discount };
}

export function shipFor(subtotal, settings) {
  return subtotal === 0 || subtotal >= settings.freeShip ? 0 : settings.shipFee;
}

export function kfmt(n) {
  const k = Math.ceil(n / 1000);
  return `${k.toLocaleString('vi-VN')}k`;
}

export function shortMoney(n) {
  return n >= 1000000 && n % 1000000 === 0 ? `${n / 1000000} triệu` : kfmt(n);
}

// Các mức ưu đãi theo thứ tự tăng dần; mức trùng ngưỡng miễn ship gộp thành "Giảm 3% + miễn ship".
// [{ min, pct, ship }] — dòng chỉ miễn ship (pct 0) khi ngưỡng miễn ship không trùng mức nào.
export function promoTiers(settings) {
  const tiers = [...ORDER_TIERS].sort((a, b) => a.min - b.min).map((t) => ({ min: t.min, pct: t.pct, ship: t.min === settings.freeShip }));
  if (settings.freeShip > 0 && !tiers.some((t) => t.ship)) tiers.push({ min: settings.freeShip, pct: 0, ship: true });
  return tiers.sort((a, b) => a.min - b.min);
}

export function tierTitle(t) {
  return t.pct ? `Giảm ${t.pct}%${t.ship ? ' + miễn ship' : ''}` : 'Miễn phí giao';
}

export function bannerText(settings, fmt = shortMoney) {
  return promoTiers(settings).map((t) => `${tierTitle(t)} đơn từ ${fmt(t.min)}`).join(' · ');
}

function mergeItems(items) {
  const map = new Map();
  for (const item of items) {
    const sku = String(item?.sku || '').trim();
    const qty = Math.floor(Number(item?.qty));
    if (!sku || !Number.isFinite(qty) || qty < 1 || qty > 99) {
      throw problem(400, 'Số lượng trong giỏ chưa đúng.');
    }
    map.set(sku, Math.min(99, (map.get(sku) || 0) + qty));
  }
  if (!map.size) throw problem(400, 'Giỏ đang trống.');
  if (map.size > 40) throw problem(400, 'Giỏ có quá nhiều món.');
  return [...map.entries()].map(([sku, qty]) => ({ sku, qty }));
}

function publicSettings(settings) {
  return {
    freeShip: settings.freeShip,
    shipFee: settings.shipFee,
    codEnabled: !!settings.codEnabled,
    tiers: ORDER_TIERS.map((t) => ({ ...t })),
  };
}

export function hintText({ settings, subtotal, pct, hasCombo, base, ship = true }) {
  if (!subtotal) return `${bannerText(settings)}. Combo cũng được giảm theo đơn.`;
  const bits = [];
  const next = nextTier(subtotal);
  const both = ship && next && subtotal < settings.freeShip && next.min === settings.freeShip;
  if (both) bits.push(`Thêm ${kfmt(next.min - subtotal)} để được giảm ${next.pct}% và miễn phí giao hàng.`);
  else if (ship) bits.push(subtotal < settings.freeShip ? `Thêm ${kfmt(settings.freeShip - subtotal)} để được miễn phí giao.` : 'Đơn được miễn phí giao.');
  if (pct) bits.push(`Đang giảm ${pct}%.`);
  if (!both) bits.push(next ? `Thêm ${kfmt(next.min - subtotal)} để được giảm ${next.pct}%.` : 'Đã đạt mức giảm cao nhất.');
  if (hasCombo) bits.push('Combo cũng được giảm theo đơn và tính vào mức đơn.');
  return bits.join(' ');
}

export function priceItems(rawItems, { allowEmpty = false, extras = false } = {}) {
  const settings = getSettings();
  let pairs;
  try {
    pairs = mergeItems(rawItems || []);
  } catch (err) {
    if (allowEmpty && err.status === 400 && /trống/.test(err.message)) {
      return emptyQuote(settings);
    }
    throw err;
  }
  const items = [];
  for (const line of pairs) {
    const hit = lookupSku(line.sku);
    if (!hit) throw problem(400, 'Một món trong giỏ không còn bán. Bạn mở giỏ và bỏ món đó giúp.');
    if (hit.product.oos) throw problem(400, `${hit.name} đang hết hàng đợt này.`);
    if (!(hit.price > 0)) throw problem(400, `${hit.name} chưa có giá bán.`);
    items.push({
      sku: hit.sku,
      id: hit.id,
      name: hit.name,
      w: hit.w,
      qty: line.qty,
      price: hit.price,
      img: hit.img,
      combo: isComboProduct(hit.product),
      line: hit.price * line.qty,
    });
  }
  const d = orderDiscount(items);
  const ship = shipFor(d.subtotal, settings);
  const total = d.subtotal - d.discount + ship;
  const next = nextTier(d.subtotal);
  const hasCombo = items.some((i) => i.combo);
  const out = {
    items,
    gifts: [],
    subtotal: d.subtotal,
    discount: d.discount,
    discountPct: d.pct,
    discountBase: d.base,
    comboSubtotal: d.comboSubtotal,
    discountLabel: d.pct ? `Giảm ${d.pct}% đơn từ ${vnd(tierFor(d.subtotal).min)}${hasCombo ? ' (gồm cả combo)' : ''}` : '',
    ship,
    total,
    next: next ? { ...next, need: next.min - d.subtotal } : null,
    hint: hintText({ settings, subtotal: d.subtotal, pct: d.pct, hasCombo, base: d.base }),
    banner: bannerText(settings),
    settings: publicSettings(settings),
  };
  if (extras) Object.assign(out, cartExtras(pairs, items, d, settings, hasCombo));
  return out;
}

// Tổng phải trả của một giỏ giả định (không báo lỗi; món không bán được thì trả Infinity để bỏ gợi ý đó).
function quickQuote(list, settings) {
  const lines = [];
  for (const it of list) {
    const hit = lookupSku(it.sku);
    if (!hit || hit.product.oos || !(hit.price > 0)) return null;
    lines.push({ line: hit.price * it.qty, combo: isComboProduct(hit.product) });
  }
  const d = orderDiscount(lines);
  const ship = shipFor(d.subtotal, settings);
  return { total: d.subtotal - d.discount + ship, pct: d.pct, freeShip: ship === 0 };
}
function quickTotal(list, settings) {
  const q = quickQuote(list, settings);
  return q ? q.total : Infinity;
}
// Mức ưu đãi của giỏ (để gợi ý combo không bao giờ làm rớt mức % hay mất miễn ship).
function quickLevel(list, settings) {
  const q = quickQuote(list, settings);
  return q ? { pct: q.pct, freeShip: q.freeShip } : null;
}

// Chỉ cho /api/quote (trang giỏ): gợi ý combo + thanh miễn ship. Đơn hàng không cần.
function cartExtras(pairs, items, d, settings, hasCombo) {
  const catalog = getShopCatalog();
  const deals = comboDeals(catalog);
  const nameOf = (sku) => { const h = lookupSku(sku); return h ? `${h.name} ${h.w}`.trim() : sku; };
  return {
    nudges: cartNudges(pairs, deals, (list) => quickTotal(list, settings), { nameOf, comboSkus: new Set(items.filter((i) => i.combo).map((i) => i.sku)), levelOf: (list) => quickLevel(list, settings) }).slice(0, 2),
    shipBar: shipBar(d.subtotal, settings.freeShip, { deals, singles: shipSingles(catalog), inCart: new Set(pairs.map((p) => p.sku)), withPct: (ORDER_TIERS.find((t) => t.min === settings.freeShip) || {}).pct || 0 }),
    cartHint: hintText({ settings, subtotal: d.subtotal, pct: d.pct, hasCombo, base: d.base, ship: false }),
  };
}

function emptyQuote(settings) {
  return {
    items: [],
    gifts: [],
    subtotal: 0,
    discount: 0,
    discountPct: 0,
    discountBase: 0,
    comboSubtotal: 0,
    discountLabel: '',
    ship: 0,
    total: 0,
    next: { ...ORDER_TIERS[ORDER_TIERS.length - 1], need: ORDER_TIERS[ORDER_TIERS.length - 1].min },
    hint: hintText({ settings, subtotal: 0 }),
    banner: bannerText(settings),
    settings: publicSettings(settings),
  };
}
