// Câu chữ xem trước: tắt = chỉ chủ shop (đăng nhập admin) thấy, bật = khách cũng thấy.
import { getSettings } from './db.js';

export const COPY_KEYS = [
  'cheers3', 'incombo', 'oos', 'alts', 'cartswap', 'freeship', 'emptycart', 'giftbox', 'wholesale', 'thanks', 'kitaxmi',
];

export const COPY_LABELS = {
  cheers3: 'Combo 3 túi xoài Cheers+: thử một túi',
  incombo: 'Trang lẻ: gợi ý thêm combo',
  oos: 'Hết hàng và câu còn túi Premium',
  alts: 'Gợi ý thay thế sầu riêng thăng hoa',
  cartswap: 'Giỏ: gợi ý ghép combo',
  freeship: 'Giỏ: câu gần mức miễn ship',
  emptycart: 'Giỏ trống',
  giftbox: 'Hộp quà: đổi vị và thiệp',
  wholesale: 'Hộp quà: dòng giá sỉ',
  thanks: 'Trang đặt xong: nhắn Zalo',
  kitaxmi: 'Combo 4 túi KITA: gợi ý combo xoài mít',
};

export function readCopyPreview(settings = getSettings()) {
  const raw = settings.copyPreview && typeof settings.copyPreview === 'object' ? settings.copyPreview : {};
  const out = {};
  for (const key of COPY_KEYS) out[key] = raw[key] === true;
  return out;
}

export function normalizeCopyPreview(input) {
  const out = {};
  const raw = input && typeof input === 'object' ? input : {};
  for (const key of COPY_KEYS) out[key] = raw[key] === true;
  return out;
}

// 'public' khi đã bật cho khách, 'preview' khi chỉ chủ shop đang xem, '' khi ẩn.
export function showCopy(settings, key, owner) {
  if (readCopyPreview(settings)[key]) return 'public';
  if (owner) return 'preview';
  return '';
}

export function previewTag(mode) {
  return mode === 'preview' ? '<span class="previewtag">xem trước</span>' : '';
}

export function skuInStock(catalog, sku) {
  for (const product of catalog.products || []) {
    const variant = product.variants.find((item) => item.sku === sku);
    if (!variant) continue;
    return !!(variant.price > 0 && !variant.oos && !product.oos);
  }
  return false;
}

export function premiumTruth(text, product, catalog) {
  let out = String(text || '');
  if (!out || !String(product?.id || '').startsWith('vz-ps-')) return out;
  const two = skuInStock(catalog, 'VZ-PS-CB2-200');
  const singles = ['VZ-PS-GD-100', 'VZ-PS-RY-100', 'VZ-PS-YD-100'].filter((sku) => skuInStock(catalog, sku));
  const own = product.variants?.find((variant) => variant.sku === product.defaultSku) || product.variants?.[0];
  const ownOk = own ? skuInStock(catalog, own.sku) : false;
  if (!two) out = out.replace(/Bộ 2 túi vẫn còn\.?\s*/g, '').replace(/Bộ hai túi vẫn còn[^.]*\.\s*/g, '');
  if (product.id === 'vz-ps-cb3' ? !singles.length : !ownOk) {
    out = out.replace(/Túi lẻ 100g vẫn còn\.?\s*/g, '').replace(/Túi lẻ 100g đang bán\.?\s*/g, '');
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.])/g, '$1').trim();
}

const ALT_PITCH = {
  'sau-rieng-say-thang-hoa-yummy': 'múi nguyên, vị đậm',
  'sau-rieng-say-thang-hoa-cheers': 'chia sẵn gói nhỏ, dễ mang',
};

export function dressAlts(items) {
  const rank = (href) => {
    if (href.includes('/sau-rieng-say-thang-hoa-yummy')) return 0;
    if (href.includes('/sau-rieng-say-thang-hoa-cheers')) return 1;
    return 2;
  };
  return [...items].map((item) => {
    const href = item.href || '';
    const key = Object.keys(ALT_PITCH).find((id) => href.includes('/' + id));
    return key ? { ...item, pitch: ALT_PITCH[key] } : item;
  }).sort((a, b) => rank(a.href || '') - rank(b.href || ''));
}
