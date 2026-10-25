import { getSettings } from './db.js';
import { lookupSku } from './catalog.js';
import { vnd, problem } from './format.js';

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

function isMangoBag(hit, settings) {
  if (hit.fruit !== 'xoai') return false;
  if (!(hit.price > 0)) return false;
  if (hit.sku === settings.giftSku) return false;
  if (!(hit.g >= settings.giftMinG)) return false;
  if (String(hit.id).startsWith('combo-')) return false;
  if (/\+/.test(hit.w || '')) return false;
  return true;
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
      g: hit.g,
      qty: line.qty,
      price: hit.price,
      img: hit.img,
      fruit: hit.fruit,
      line: hit.price * line.qty,
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.line, 0);
  const bags = items.filter((item) => isMangoBag(item, settings)).reduce((sum, item) => sum + item.qty, 0);
  const byPair = Math.floor(bags / settings.giftPair);
  const byOrder = subtotal >= settings.giftMin ? 1 : 0;
  const giftQty = Math.min(settings.giftMax, Math.max(byPair, byOrder));
  const gifts = [];
  if (giftQty > 0) {
    const gift = lookupSku(settings.giftSku, { allowHidden: true });
    const why = byPair >= byOrder && byPair > 0
      ? `Mua ${settings.giftPair} túi xoài từ ${settings.giftMinG}g tặng 1 gói nhỏ`
      : `Đơn từ ${vnd(settings.giftMin)} tặng 1 gói nhỏ`;
    gifts.push({
      sku: settings.giftSku,
      name: gift ? `${gift.name} · ${gift.w}` : 'Xoài sấy dẻo muối ớt · gói nhỏ',
      w: why,
      qty: giftQty,
      price: 0,
      retail: gift?.price || 0,
      img: gift?.img || null,
    });
  }
  const ship = subtotal === 0 || subtotal >= settings.freeShip ? 0 : settings.shipFee;
  const total = subtotal + ship;
  return {
    items: items.map(({ fruit, g, ...item }) => item),
    gifts,
    subtotal,
    ship,
    total,
    giftQty,
    bags,
    hint: hintText({ settings, subtotal, giftQty, bags }),
    settings: {
      giftMin: settings.giftMin,
      giftPair: settings.giftPair,
      giftMinG: settings.giftMinG,
      giftMax: settings.giftMax,
      freeShip: settings.freeShip,
      shipFee: settings.shipFee,
      codEnabled: !!settings.codEnabled,
    },
  };
}

function emptyQuote(settings) {
  return {
    items: [],
    gifts: [],
    subtotal: 0,
    ship: 0,
    total: 0,
    giftQty: 0,
    bags: 0,
    hint: `Đơn từ ${vnd(settings.giftMin)}, hoặc ${settings.giftPair} túi xoài từ ${settings.giftMinG}g, được tặng gói nhỏ xoài muối ớt. Tối đa ${settings.giftMax} gói.`,
    settings: {
      giftMin: settings.giftMin,
      giftPair: settings.giftPair,
      giftMinG: settings.giftMinG,
      giftMax: settings.giftMax,
      freeShip: settings.freeShip,
      shipFee: settings.shipFee,
      codEnabled: !!settings.codEnabled,
    },
  };
}

function hintText({ settings, subtotal, giftQty, bags }) {
  if (!subtotal) return emptyQuote(settings).hint;
  const bits = [];
  if (giftQty > 0) {
    bits.push(`Đơn này được tặng ${giftQty} gói nhỏ xoài muối ớt, tính 0đ.`);
  } else if (subtotal < settings.giftMin) {
    const need = settings.giftMin - subtotal;
    const bagsNeed = Math.max(1, settings.giftPair - bags);
    bits.push(`Thêm ${vnd(need)} nữa, hoặc thêm ${bagsNeed} túi xoài từ ${settings.giftMinG}g, là được tặng gói nhỏ.`);
  }
  if (subtotal < settings.freeShip) bits.push(`Thêm ${vnd(settings.freeShip - subtotal)} để được miễn phí giao hàng.`);
  else bits.push('Đơn này được miễn phí giao hàng.');
  return bits.join(' ');
}
