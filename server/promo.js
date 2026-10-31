import { getSettings } from './db.js';
import { lookupSku } from './catalog.js';
import { vnd, problem } from './format.js';

// Chiết khấu theo giá trị đơn (duyệt 31/10/2026). Không còn quà tặng 0đ.
// - Mức tính trên tiền hàng trước giảm, chưa cộng phí giao.
// - % chỉ giảm trên món lẻ, set, hộp quà. Dòng combo đã có giá riêng: không giảm thêm, nhưng vẫn tính vào mức đơn.
// - Tiền giảm làm tròn xuống tới nghìn đồng.
export const ORDER_TIERS = Object.freeze([
  Object.freeze({ min: 1000000, pct: 8 }),
  Object.freeze({ min: 500000, pct: 5 }),
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
  const base = lines.filter((l) => !l.combo).reduce((sum, l) => sum + l.line, 0);
  const tier = tierFor(subtotal, tiers);
  const discount = tier ? Math.floor((base * tier.pct) / 100 / 1000) * 1000 : 0;
  return { subtotal, base, comboSubtotal: subtotal - base, pct: tier ? tier.pct : 0, discount };
}

export function shipFor(subtotal, settings) {
  return subtotal === 0 || subtotal >= settings.freeShip ? 0 : settings.shipFee;
}

export function kfmt(n) {
  const k = Math.ceil(n / 1000);
  return `${k.toLocaleString('vi-VN')}k`;
}

export function bannerText(settings) {
  const [top, low] = [...ORDER_TIERS].sort((a, b) => b.min - a.min);
  return `Miễn phí giao từ ${kfmt(settings.freeShip)} · Giảm ${low.pct}% đơn từ ${kfmt(low.min)} · Giảm ${top.pct}% đơn từ 1 triệu`;
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

export function hintText({ settings, subtotal, pct, hasCombo, base }) {
  if (!subtotal) return `${bannerText(settings)}. Combo đã có giá riêng, không giảm thêm.`;
  const bits = [];
  const next = nextTier(subtotal);
  bits.push(subtotal < settings.freeShip ? `Thêm ${kfmt(settings.freeShip - subtotal)} để được miễn phí giao.` : 'Đơn được miễn phí giao.');
  if (pct) bits.push(`Đang giảm ${pct}%.`);
  bits.push(next ? `Thêm ${kfmt(next.min - subtotal)} để được giảm ${next.pct}%.` : 'Đã đạt mức giảm cao nhất.');
  if (hasCombo) bits.push(base > 0 ? 'Combo đã có giá riêng, không giảm thêm nhưng vẫn tính vào mức đơn.' : 'Combo đã có giá riêng, không giảm thêm.');
  return bits.join(' ');
}

export function priceItems(rawItems, { allowEmpty = false } = {}) {
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
  return {
    items,
    gifts: [],
    subtotal: d.subtotal,
    discount: d.discount,
    discountPct: d.pct,
    discountBase: d.base,
    comboSubtotal: d.comboSubtotal,
    discountLabel: d.pct ? `Giảm ${d.pct}% đơn từ ${vnd(tierFor(d.subtotal).min)}${hasCombo ? ' (không áp cho combo)' : ''}` : '',
    ship,
    total,
    next: next ? { ...next, need: next.min - d.subtotal } : null,
    hint: hintText({ settings, subtotal: d.subtotal, pct: d.pct, hasCombo, base: d.base }),
    banner: bannerText(settings),
    settings: publicSettings(settings),
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
