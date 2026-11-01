// Nút "Thêm vào giỏ" ở /danh-muc: nối mã danh mục với mã bán ở cửa hàng (js/data.js).
// Mã danh mục trùng mã cửa hàng (hoặc có trong MQ.SKU_ALIAS) thì dùng luôn; còn lại tra bảng CATALOG_TO_SHOP bên dưới.
// Chỉ nối khi cùng hãng, cùng sản phẩm, cùng khối lượng và cùng giá. Không chắc thì để "Liên hệ".
import { getShopCatalog, lookupSku } from './catalog.js';
import { catalogData } from './danhmuc.js';
import { isComboProduct } from './promo.js';

export const CATALOG_TO_SHOP = {
  'VZ-GG-XDMO-200': 'MQ-DXM-200-GG',
  'VZ-GG-XD-200': 'MQ-DXO-200-GG',
  'VZ-GG-KF-100': 'MQ-GSR-100-GG',
  'VZ-GG-THOM-80': 'MQ-DTH-080-GG',
  // Cùng cách SKU_ALIAS đang nối GoodGood 100g (thanh long, mãng cầu, cóc) với túi 80g của cửa hàng.
  'VZ-GG-ME-100': 'MQ-DME-080-GG',
  'VZ-CH-XTH-120': 'MQ-THXO-120-CH',
  'VZ-CH-SRTH-100': 'MQ-THSR-110-CH',
  // Cửa hàng có 1 mã Cheers+ 200g; 3 mẫu túi giao theo hàng có sẵn (khách ghi mẫu muốn ở ô Ghi chú).
  'VZ-CH-XDL-200': 'MQ-DXC-200-CHA',
  'VZ-CH-XDR-200': 'MQ-DXC-200-CHA',
  'VZ-CH-XDT-200': 'MQ-DXC-200-CHA',
  'VZ-YM-SRTH-100': 'MQ-THSR-105-YM',
  'VZ-FH-XD-100': 'MQ-DXO-100-FHX',
  'VZ-FH-XD-500': 'MQ-DXO-500-FHG',
  // Túi hồng cam / túi vàng 100g: cửa hàng có mã riêng trên trang xoai-say-deo (cùng giá 49k mọi mẫu túi 100g).
  'VZ-FH-XDH-100': 'MQ-DXO-100-FHH',
  'VZ-FH-XDV-100': 'MQ-DXO-100-FHV',
  'VZ-FH-MIT-300': 'MQ-GMI-300-FH',
  'VZ-FH-SRTH-XX': 'MQ-THSR-080-FH',
  'VZ-KT-SRTH-100': 'MQ-GSR-100-KT',
  'VZ-VZ-SRS-100': 'MQ-GSR-100-VZ',
  'VZ-VZ-HDI-100': 'MQ-HDR-100-VZ',
  'VZ-VZ-HMC-100': 'MQ-HMC-100-VZ',
  'VZ-VZ-HDC-100': 'MQ-HDC-100-VZ',
  'VZ-VZ-HSE-100': 'MQ-HHS-100-VZ',
  'VZ-VZ-DUA-100': 'MQ-GDU-100-VZ',
  'VZ-VZ-CB5-500': 'MQ-CBH-5X100-VZ',
};

// Tên ngắn khi một món nằm trong nhiều combo cùng cỡ.
const COMBO_LABEL = {
  'VZ-VZ-CB2DM-200': 'Combo 2 điều + macca',
  'VZ-VZ-CB2SK-200': 'Combo 2 dẻ cười + sen',
  'VZ-VZ-CB3DD-300': 'Combo 3 Dinh dưỡng',
  'VZ-VZ-CB3AL-300': 'Combo 3 Tết An Lành',
  'VZ-GG-CB2XC-200': 'Combo 2 xoài + cóc',
  'VZ-FH-CB-350': 'Combo 100g + 250g',
};

// Combo đông túi (trên 3) không nằm trong comboOf: gắn tay vào túi lẻ cùng nhãn, cùng khối lượng.
const EXTRA_COMBOS = {
  'MQ-DXO-100-FHX': [['MQ-CBX-100-FH', 'Combo 6 túi'], ['MQ-CBX-100-MIX', 'Combo 6 trộn 2 nhãn']],
  'MQ-DXO-100-FHG': [['MQ-CBX-100-FH', 'Combo 6 túi'], ['MQ-CBX-100-MIX', 'Combo 6 trộn 2 nhãn']],
  'MQ-DXO-100-GG': [['MQ-CBX-100-GG', 'Combo 6 túi'], ['MQ-CBX-100-MIX', 'Combo 6 trộn 2 nhãn']],
};

function comboSize(product, variant) {
  const m = String(variant.w || '').match(/(\d+)\s*[×x]/);
  return m ? Number(m[1]) : (product.comboOf?.length || 0);
}

// Trả về { [mã danh mục]: { sku, price, options: [{ sku, label, price, title, combo }] } }.
// Hàng cửa hàng đang hết (oos) thì trả { sku, price, oos: true, options: [] }: thẻ danh mục hiện "Hết hàng", không có nút mua.
export function catalogBuyMap(catalog) {
  const shop = getShopCatalog();
  const bySku = new Map();
  for (const p of shop.products) for (const v of p.variants) if (v.price > 0) bySku.set(v.sku, { p, v });
  const combos = shop.products.filter((p) => isComboProduct(p) && p.comboOf?.length);
  const out = {};
  for (const prod of catalog.products) {
    for (const cv of prod.variants) {
      const sku = bySku.has(cv.code) ? cv.code : (CATALOG_TO_SHOP[cv.code] || lookupSku(cv.code)?.sku);
      const hit = sku && bySku.get(sku);
      if (!hit) continue;
      if (hit.p.oos) { out[cv.code] = { sku, price: hit.v.price, oos: true, options: [] }; continue; }
      const options = [{ sku, label: 'Lẻ', price: hit.v.price, title: `${hit.p.name} · ${hit.v.w}`, combo: isComboProduct(hit.p) }];
      if (!isComboProduct(hit.p)) {
        for (const cb of combos) {
          if (!cb.comboOf.includes(sku)) continue;
          for (const v of cb.variants) {
            const n = comboSize(cb, v);
            if (!(v.price > 0) || n < 2 || n > 3) continue;
            const label = COMBO_LABEL[v.sku] || (/vị/.test(v.w) ? `Combo ${n} vị` : `Combo ${n}`);
            options.push({ sku: v.sku, label, price: v.price, title: `${cb.name} · ${v.w}`, combo: true });
          }
        }
        for (const [cbSku, label] of EXTRA_COMBOS[sku] || []) {
          const cb = bySku.get(cbSku);
          if (!cb || cb.p.oos || options.some((o) => o.sku === cbSku)) continue;
          options.push({ sku: cbSku, label, price: cb.v.price, title: `${cb.p.name} · ${cb.v.label || cb.v.w}`, combo: true });
        }
        options.sort((a, b) => a.combo - b.combo || a.price - b.price);
      }
      out[cv.code] = { sku, price: hit.v.price, options };
    }
  }
  return out;
}

// Ảnh chính ở /danh-muc theo mã bán ở cửa hàng, để thẻ /cua-hang dùng chung ảnh (có bản nhỏ -sm.webp).
let heroCache = null;
export function catalogHeroBySku() {
  if (heroCache) return heroCache;
  const shopSkus = new Set(getShopCatalog().products.flatMap((p) => p.variants.map((v) => v.sku)));
  heroCache = new Map();
  for (const p of catalogData().products) {
    const hero = p.images?.[0];
    if (!hero?.src) continue;
    for (const v of p.variants) {
      const sku = shopSkus.has(v.code) ? v.code : (CATALOG_TO_SHOP[v.code] || lookupSku(v.code, { allowHidden: true })?.sku);
      if (sku && !heroCache.has(sku)) heroCache.set(sku, hero);
    }
  }
  return heroCache;
}
