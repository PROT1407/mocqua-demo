// Combo "Tiết kiệm" + gợi ý trong giỏ (thêm 1 món thành combo / đổi sang combo) + thanh miễn ship.
// Mọi con số tính từ giá lẻ thật đang bán: tiết kiệm = tổng giá lẻ hiện tại − giá combo. Không có giá gốc ảo.
import { isComboProduct } from './promo.js';

// Combo không ghi comboOf (6 túi cùng loại): món lẻ theo từng mã combo.
// Mỗi phần tử là một "ô": mã lẻ tham chiếu (để tính giá, để thêm vào giỏ) + mã khác cùng ô được chấp nhận.
const GG100 = 'MQ-DXO-100-GG';
const FH100 = 'MQ-DXO-100-FHX';
export const COMBO_SLOTS_BY_SKU = {
  'MQ-CBX-100-GG': Array(6).fill([GG100]),
  'MQ-CBX-100-FH': Array(6).fill([FH100]),
  // Trộn 2 nhãn: khách ghi số túi mỗi màu, ô nào cũng nhận túi 100g của một trong hai nhãn.
  'MQ-CBX-100-MIX': Array(6).fill([GG100, FH100]),
  // Combo 3 vị xoài dẻo F&H + măng cụt thăng hoa 100g + sầu riêng sấy 100g. Cùng khối lượng xoài = cùng giá, trắng hay vàng.
  'MQ-CB3-XMS-100': [['MQ-DXO-100-FHV'], ['MQ-THMC-100-GG'], ['MQ-GSR-100-GG']],
  'MQ-CB3-XMS-200-T': [['MQ-DXO-200-FHT'], ['MQ-THMC-100-GG'], ['MQ-GSR-100-GG']],
  'MQ-CB3-XMS-200-V': [['MQ-DXO-200-FHV'], ['MQ-THMC-100-GG'], ['MQ-GSR-100-GG']],
  'MQ-CB3-XMS-300-T': [['MQ-DXO-300-FHT'], ['MQ-THMC-100-GG'], ['MQ-GSR-100-GG']],
  'MQ-CB3-XMS-300-V': [['MQ-DXO-300-FHV'], ['MQ-THMC-100-GG'], ['MQ-GSR-100-GG']],
};

function skuIndex(catalog) {
  const m = new Map();
  for (const p of catalog.products) for (const v of p.variants) m.set(v.sku, { p, v });
  return m;
}

// Mã cùng sản phẩm, cùng cỡ, cùng giá (khác màu túi) tính như nhau khi ghép combo.
function siblings(idx, sku) {
  const hit = idx.get(sku);
  if (!hit) return [sku];
  return hit.p.variants.filter((v) => v.group === hit.v.group && v.w === hit.v.w && v.price === hit.v.price).map((v) => v.sku);
}

function slotsFor(p, v) {
  if (COMBO_SLOTS_BY_SKU[v.sku]) return COMBO_SLOTS_BY_SKU[v.sku];
  // comboOf mô tả mã mặc định; mã combo khác của cùng sản phẩm (vd. 2 vị khách tự chọn) không rõ món nên bỏ qua.
  if (v.sku !== p.defaultSku || !p.comboOf?.length) return null;
  return p.comboOf.map((sku) => [sku]);
}

// Danh sách combo đang bán có tiết kiệm thật.
// { id, sku, name, w, img, href, price, sum, save, isDefault, slots: [{ ref, accept:Set }] }
export function comboDeals(catalog) {
  const idx = skuIndex(catalog);
  const out = [];
  for (const p of catalog.products) {
    if (p.oos || p.hidden || !isComboProduct(p)) continue;
    for (const v of p.variants) {
      if (!(v.price > 0)) continue;
      const raw = slotsFor(p, v);
      if (!raw) continue;
      const slots = [];
      let sum = 0;
      let ok = true;
      for (const refs of raw) {
        const ref = idx.get(refs[0]);
        if (!ref || ref.p.oos || !(ref.v.price > 0) || isComboProduct(ref.p)) { ok = false; break; }
        sum += ref.v.price;
        slots.push({ ref: refs[0], accept: new Set(refs.flatMap((s) => siblings(idx, s))) });
      }
      if (!ok || !(v.price < sum)) continue;
      out.push({
        id: p.id, sku: v.sku, name: p.name, w: v.w, img: v.img || p.cardImg, href: `/san-pham/${encodeURIComponent(p.id)}`,
        price: v.price, sum, save: sum - v.price, isDefault: v.sku === p.defaultSku, slots,
      });
    }
  }
  return out;
}

// Theo mã combo: { sum, save } để hiện "mua lẻ" gạch ngang và nhãn tiết kiệm.
export function dealBySku(catalog) {
  return new Map(comboDeals(catalog).map((d) => [d.sku, d]));
}

// Ghép giỏ (chỉ món lẻ) vào các ô của combo. Trả về { used: Map(sku→qty), missing: [ô còn thiếu] }.
export function matchDeal(deal, counts) {
  const left = new Map(counts);
  const used = new Map();
  const missing = [];
  // Ô hẹp (ít mã chấp nhận) ghép trước để ô rộng không lấy mất túi của ô hẹp.
  const order = deal.slots.map((s, i) => i).sort((a, b) => deal.slots[a].accept.size - deal.slots[b].accept.size);
  for (const i of order) {
    const slot = deal.slots[i];
    // Ưu tiên đúng mã tham chiếu, sau đó mã cùng ô còn nhiều nhất.
    const cands = [...slot.accept].filter((s) => (left.get(s) || 0) > 0)
      .sort((a, b) => (b === slot.ref) - (a === slot.ref) || left.get(b) - left.get(a));
    const sku = cands[0];
    if (!sku) { missing.push(slot); continue; }
    left.set(sku, left.get(sku) - 1);
    used.set(sku, (used.get(sku) || 0) + 1);
  }
  return { used, missing };
}

// Áp một gợi ý lên giỏ [{ sku, qty }]: bớt các món lẻ đã ghép, thêm 1 combo. Hàm thuần, client dùng chung (web/js/cart-core.js).
export { applyNudge } from '../web/js/cart-core.js';
import { applyNudge as apply } from '../web/js/cart-core.js';

// Gợi ý trong giỏ. totalOf(items) trả tổng phải trả (đã trừ giảm theo đơn, cộng phí giao) của một giỏ giả định.
// - "swap": giỏ đã đủ món lẻ của một combo → đổi sang combo, tiết kiệm = tổng hiện tại − tổng sau khi đổi.
// - "add": thiếu đúng 1 món → so với mua lẻ thêm món đó, lấy combo rẻ hơn bao nhiêu.
// Chỉ gợi ý khi tổng thật sự giảm (tính cả mất % giảm theo đơn và phí giao). Sắp: đổi trước, rồi tiết kiệm nhiều hơn.
// levelOf(items) → { pct, freeShip }: không bao giờ gợi ý đổi/ghép làm rớt mức % hoặc mất miễn ship (so với giỏ hiện tại / mua lẻ thêm món đó).
export function cartNudges(cart, deals, totalOf, { nameOf = () => '', comboSkus = new Set(), levelOf = null } = {}) {
  const counts = new Map();
  for (const it of cart) if (!comboSkus.has(it.sku)) counts.set(it.sku, (counts.get(it.sku) || 0) + it.qty);
  if (!counts.size) return [];
  const now = totalOf(cart);
  const out = [];
  for (const deal of deals) {
    if (deal.slots.length < 2) continue;
    const { used, missing } = matchDeal(deal, counts);
    const have = [...used.values()].reduce((a, b) => a + b, 0);
    if (missing.length > 1 || have < 1) continue;
    const remove = [...used.entries()].map(([sku, qty]) => ({ sku, qty }));
    const nudge = { kind: missing.length ? 'add' : 'swap', sku: deal.sku, id: deal.id, name: deal.name, w: deal.w, img: deal.img, href: deal.href, price: deal.price, sum: deal.sum, remove };
    const next = apply(cart, nudge);
    const after = totalOf(next);
    const ref = nudge.kind === 'swap' ? cart : apply(cart, { remove: [], sku: missing[0].ref });
    if (levelOf) {
      const a = levelOf(ref), b = levelOf(next);
      if (!a || !b || b.pct < a.pct || (a.freeShip && !b.freeShip)) continue;
    }
    if (nudge.kind === 'swap') {
      nudge.save = now - after;
    } else {
      nudge.addSku = missing[0].ref;
      nudge.addName = nameOf(missing[0].ref);
      nudge.save = totalOf(ref) - after;
    }
    if (nudge.save >= 1000) out.push(nudge);
  }
  // Trùng sản phẩm combo (vd. 6 túi GG / FH / trộn): giữ gợi ý tốt nhất.
  out.sort((a, b) => (a.kind === 'swap' ? 0 : 1) - (b.kind === 'swap' ? 0 : 1) || b.save - a.save || a.price - b.price);
  const seen = new Set();
  return out.filter((n) => (seen.has(n.id) ? false : seen.add(n.id)));
}

// Thanh miễn ship: còn bao nhiêu, và một món/combo vừa đủ khoảng thiếu (rẻ nhất mà vẫn ≥ khoảng thiếu).
// Ưu tiên combo nếu giá combo không hơn món lẻ vừa đủ quá 30k; không thì món lẻ.
// withPct: % giảm theo đơn bắt đầu cùng ngưỡng miễn ship (vd. 3%) để thanh ghi "giảm 3% + miễn ship".
export function shipBar(subtotal, freeShip, { deals = [], singles = [], inCart = new Set(), withPct = 0 } = {}) {
  if (!(subtotal > 0) || !(freeShip > 0)) return null;
  if (subtotal >= freeShip) return { freeShip, withPct, need: 0, pct: 100, suggest: null };
  const need = freeShip - subtotal;
  const fit = (list) => list.filter((x) => x.price >= need && !inCart.has(x.sku)).sort((a, b) => a.price - b.price || (a.rank || 99) - (b.rank || 99))[0];
  const combo = fit(deals.filter((d) => d.isDefault).map((d) => ({ ...d, combo: true })));
  const single = fit(singles);
  // Combo chỉ thắng khi không đắt hơn món lẻ vừa đủ quá 30k (khách không bị đẩy mua quá tay).
  const suggest = combo && (!single || combo.price <= single.price + 30000) ? combo : (single || null);
  return {
    freeShip, withPct, need, pct: Math.max(4, Math.min(99, Math.round((subtotal / freeShip) * 100))),
    suggest: suggest ? { sku: suggest.sku, name: suggest.name, w: suggest.w, img: suggest.img, href: suggest.href, price: suggest.price, save: suggest.save || 0, combo: !!suggest.combo } : null,
  };
}

// Món lẻ gợi ý cho thanh miễn ship: mã mặc định của sản phẩm lẻ đang bán (không set/hộp quà).
export function shipSingles(catalog) {
  return catalog.products
    .filter((p) => !p.oos && !p.hidden && !isComboProduct(p) && p.defaultSku && ['deo', 'thanghoa', 'gion', 'kho', 'omai', 'hat'].includes(p.cat))
    .map((p) => {
      const v = p.variants.find((x) => x.sku === p.defaultSku);
      return v && v.price > 0 ? { sku: v.sku, name: p.name, w: v.w, img: v.img || p.cardImg, href: `/san-pham/${encodeURIComponent(p.id)}`, price: v.price, rank: p.rank } : null;
    })
    .filter(Boolean);
}
