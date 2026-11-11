// Hộp quà / set quà: ngăn lấy từ contents đang có trong js/data.js.
// Vị thay được phải có giá trong danh mục, không nằm ở mục parked, và nối được tới món đang bán (shopId).
// Giá luôn đọc lúc tính (lookupSku / catalogWithPrices), không chốt số trong code.
import { getRawProduct, getShopCatalog, lookupSku } from './catalog.js';
import { catalogWithPrices } from './danhmuc.js';
import { CATALOG_TO_SHOP } from './dm-buy.js';
import { problem, norm } from './format.js';
import { boxPrice, slotRetail, wholesalePct } from '../web/js/giftbox-core.js';

function isCombo(product) {
  if (!product) return false;
  if (Array.isArray(product.comboOf) && product.comboOf.length > 0) return true;
  if (String(product.id || '').startsWith('combo-')) return true;
  return /^combo\s/i.test(String(product.name || '').trim());
}

// Nhãn ngăn (đã bỏ dấu) → loại trái cây trong cửa hàng. Không có túi tương ứng thì ngăn khóa.
const RULES = [
  { re: /kiwi/, fixed: true, kind: 'qua' },
  { re: /nho kho/, fixed: true, kind: 'qua' },
  { re: /hanh nhan/, fixed: true, kind: 'hat' },
  { re: /oc cho/, fixed: true, kind: 'hat' },
  { re: /hat dieu/, fruit: 'dieu', kind: 'hat' },
  { re: /hat sen/, fruit: 'hatsen', kind: 'hat' },
  { re: /macca|mac ca/, fruit: 'macca', kind: 'hat' },
  { re: /xi muoi/, fruit: 'ximuoi', kind: 'qua' },
  { re: /dau tam/, fruit: 'dautam', kind: 'qua' },
  { re: /dau tay/, fruit: 'dautay', kind: 'qua', preferCat: 'deo' },
  { re: /thap cam/, fruit: 'mix', kind: 'qua', preferCat: 'gion' },
  { re: /me ngao|^me /, fruit: 'me', kind: 'qua', preferCat: 'omai' },
  { re: /xoai/, fruit: 'xoai', kind: 'qua', preferCat: 'deo' },
  { re: /thom/, fruit: 'thom', kind: 'qua', preferCat: 'deo' },
  { re: /du du/, fruit: 'dudu', kind: 'qua', preferCat: 'deo' },
  { re: /gung/, fruit: 'gung', kind: 'qua', preferCat: 'deo' },
  { re: /cam lat|^cam /, fruit: 'cam', kind: 'qua', preferCat: 'deo' },
  { re: /chanh day/, fruit: 'chanhday', kind: 'qua', preferCat: 'deo' },
  { re: /dua non/, fruit: 'duanon', kind: 'qua', preferCat: 'deo' },
  { re: /mit/, fruit: 'mit', kind: 'qua' },
  { re: /chuoi/, fruit: 'chuoi', kind: 'qua', preferCat: 'gion' },
  { re: /khoai mon/, fruit: 'khoaimon', kind: 'qua', preferCat: 'gion' },
  { re: /thanh long/, fruit: 'thanhlong', kind: 'qua', preferCat: 'deo' },
  { re: /^hong |hong deo|hong say/, fruit: 'hong', kind: 'qua', preferCat: 'deo' },
  { re: /^oi /, fruit: 'oi', kind: 'qua', preferCat: 'deo' },
  { re: /^mo |mo deo/, fruit: 'mo', kind: 'qua' },
  { re: /sung/, fruit: 'sung', kind: 'qua' },
  { re: /nhan/, fruit: 'nhan', kind: 'qua' },
  { re: /mang cau/, fruit: 'mangcau', kind: 'qua', preferCat: 'deo' },
];

export function ruleFor(label) {
  const n = norm(label);
  if (/,/.test(label) || /hu \d/.test(n)) return { fixed: true, kind: 'qua', mixed: true };
  const rule = RULES.find((row) => row.re.test(n)) || { fixed: true, kind: 'qua' };
  const out = { ...rule };
  if (/muoi ot/.test(n)) out.muoiot = true;
  if (/thang hoa/.test(n)) out.preferCat = 'thanghoa';
  else if (/gion/.test(n)) out.preferCat = 'gion';
  else if (/deo/.test(n) && !out.preferCat) out.preferCat = 'deo';
  return out;
}

function linkedSkus() {
  const linked = new Set();
  for (const product of catalogWithPrices().products) {
    for (const variant of product.variants || []) {
      if (!(variant.price > 0)) continue;
      const code = String(variant.code || '');
      const direct = lookupSku(code);
      if (direct?.price > 0) linked.add(direct.sku);
      const mapped = CATALOG_TO_SHOP[code];
      if (!mapped) continue;
      const hit = lookupSku(mapped);
      if (hit?.price > 0) linked.add(hit.sku);
    }
  }
  return linked;
}

// Túi / hũ đang bán, có giá danh mục, có mã cửa hàng. Bỏ combo, set, hàng parked (không nằm trong products).
export function swapPool() {
  const linked = linkedSkus();
  const out = [];
  for (const product of getShopCatalog().products) {
    if (product.cat === 'set' || product.oos || product.hidden) continue;
    const raw = getRawProduct(product.id);
    if (!raw || raw.giftbox || raw.cat === 'set' || isCombo(raw)) continue;
    for (const variant of product.variants) {
      if (!(variant.price > 0) || !(variant.g > 0) || !linked.has(variant.sku)) continue;
      out.push({
        sku: variant.sku,
        name: product.name,
        w: variant.w,
        grams: variant.g,
        price: variant.price,
        img: variant.img || product.cardImg || '',
        fruit: product.fruit || '',
        cat: product.cat,
        flavour: raw.flavour || '',
        kind: product.cat === 'hat' ? 'hat' : 'qua',
        shopId: product.id,
        own: product.own ? 1 : 0,
      });
    }
  }
  return out;
}

function pickDefault(pool, rule, grams) {
  if (rule.fixed || !rule.fruit) return null;
  let cands = pool.filter((row) => row.fruit === rule.fruit && row.kind === rule.kind);
  if (rule.muoiot) {
    const salty = cands.filter((row) => row.flavour === 'muoiot');
    if (salty.length) cands = salty;
  } else {
    const plain = cands.filter((row) => row.flavour !== 'muoiot');
    if (plain.length) cands = plain;
  }
  if (rule.preferCat) {
    const same = cands.filter((row) => row.cat === rule.preferCat);
    if (same.length) cands = same;
  }
  if (!cands.length) return null;
  cands.sort((a, b) => Math.abs(a.grams - grams) - Math.abs(b.grams - grams) || b.own - a.own || (a.sku < b.sku ? -1 : 1));
  return cands[0];
}

function slotFrom(pool, label, grams, index) {
  const rule = ruleFor(label);
  const picked = Number.isFinite(grams) && grams > 0 ? pickDefault(pool, rule, grams) : null;
  const locked = !picked;
  return {
    i: index,
    label,
    grams,
    kind: rule.kind || 'qua',
    locked,
    sku: picked?.sku || '',
    name: picked?.name || label,
    img: picked?.img || '',
    w: picked?.w || '',
    price: picked?.price || 0,
    packGrams: picked?.grams || 0,
    retail: picked ? slotRetail(picked.price, picked.grams, grams) : 0,
  };
}

export function listGiftBoxes(pool = swapPool()) {
  const boxes = [];
  for (const product of getShopCatalog().products) {
    if (product.cat !== 'set' || product.oos || !(product.priceFrom > 0)) continue;
    const raw = getRawProduct(product.id);
    const contents = raw?.contents;
    if (!Array.isArray(contents) || contents.length < 2) continue;
    const variant = product.variants.find((row) => row.sku === product.defaultSku && row.price > 0)
      || product.variants.find((row) => row.price > 0);
    if (!variant) continue;
    const slots = contents.map((row, index) => slotFrom(pool, String(row[0] || '').trim(), Number(row[1]), index));
    const open = slots.filter((slot) => !slot.locked);
    if (open.length < 2) continue;
    boxes.push({
      id: product.id,
      sku: variant.sku,
      name: product.name,
      img: product.cardImg || variant.img || '',
      listed: variant.price,
      w: variant.w,
      rank: product.rank || 99,
      baseFruit: open.reduce((sum, slot) => sum + slot.retail, 0),
      slots,
    });
  }
  boxes.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'vi'));
  return boxes;
}

export function giftBox(id, pool = swapPool()) {
  return listGiftBoxes(pool).find((box) => box.id === id) || null;
}

export function chooserOptions(pool, boxes) {
  const prefer = new Set(boxes.flatMap((box) => box.slots.map((slot) => slot.sku).filter(Boolean)));
  const sorted = [...pool].sort((a, b) => (prefer.has(b.sku) - prefer.has(a.sku)) || a.name.localeCompare(b.name, 'vi') || a.sku.localeCompare(b.sku));
  const map = new Map();
  for (const row of sorted) {
    const key = [row.shopId, row.grams, row.price, row.flavour, row.kind].join('|');
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()]
    .map((row) => ({ sku: row.sku, name: row.name, w: row.w, grams: row.grams, price: row.price, img: row.img || '', kind: row.kind }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi') || a.grams - b.grams);
}

function normalizeChoice(slots, count) {
  if (!Array.isArray(slots) || slots.length !== count) throw problem(400, 'Hộp quà chưa đủ ngăn.');
  return slots.map((value) => {
    if (value == null || value === '') return null;
    const sku = String(value).trim();
    if (!/^[A-Za-z0-9._+-]{1,80}$/.test(sku)) throw problem(400, 'Một vị trong hộp chưa đúng.');
    return sku;
  });
}

export function resolveGiftLine({ sku, slots, qty }) {
  const pool = swapPool();
  const box = listGiftBoxes(pool).find((row) => row.sku === sku);
  if (!box) throw problem(400, 'Hộp này không đổi vị được.');
  const choice = normalizeChoice(slots, box.slots.length);
  const chosen = box.slots.map((slot, index) => {
    const code = choice[index];
    if (slot.locked) {
      if (code) throw problem(400, 'Một ngăn của hộp này không đổi được.');
      return { ...slot };
    }
    const opt = pool.find((row) => row.sku === code && row.kind === slot.kind);
    if (!opt) throw problem(400, 'Một vị không có trong danh mục hoặc không hợp ngăn này.');
    return {
      ...slot,
      sku: opt.sku,
      name: opt.name,
      img: opt.img,
      w: opt.w,
      price: opt.price,
      packGrams: opt.grams,
      retail: slotRetail(opt.price, opt.grams, slot.grams),
      locked: false,
    };
  });
  const fruit = chosen.filter((slot) => !slot.locked).reduce((sum, slot) => sum + slot.retail, 0);
  const unit = boxPrice({ listed: box.listed, baseFruit: box.baseFruit, fruit });
  const contents = chosen.map((slot) => ({ name: slot.name, grams: slot.grams, ...(slot.sku ? { sku: slot.sku } : {}) }));
  const si = wholesalePct(qty);
  return {
    box,
    chosen,
    unit,
    fruit,
    contents,
    item: {
      sku: box.sku,
      id: box.id,
      name: box.name,
      w: box.w,
      qty,
      price: unit,
      img: box.img,
      combo: false,
      line: unit * qty,
      contents,
      slots: chosen.map((slot) => (slot.locked ? null : slot.sku)),
      custom: true,
      wholesalePct: si,
    },
  };
}
