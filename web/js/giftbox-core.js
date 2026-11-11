// Tính giá hộp quà tự chọn. Không có giá sản phẩm ở đây — giá niêm yết và giá túi truyền từ danh mục.
// Công thức set (research/bang-gia.md, mục 11): (tổng giá lẻ theo gram + bao bì + công đóng) × (1 − 6%),
// không sâu hơn khoảng 11%, và không dưới 85% tổng giá lẻ phần trái cây.
// Giá sỉ theo chính sách đã đăng: từ 20 hộp −12% (trùng mức giảm đơn từ 1.000.000đ), từ 50 hộp −15%.
// Chỉ một mức. Không cộng thêm % giảm theo đơn lên cùng một dòng.

export const SET_OFF = 0.06;
export const FRUIT_FLOOR = 0.85;
export const MAX_OFF = 0.11;

export const WHOLESALE_TIERS = Object.freeze([
  Object.freeze({ minQty: 50, pct: 15 }),
  Object.freeze({ minQty: 20, pct: 12 }),
]);

export function round1k(n) {
  return Math.round(Number(n) / 1000) * 1000;
}

export function discountAmount(amount, pct) {
  if (!(amount > 0) || !(pct > 0)) return 0;
  return Math.floor((amount * pct) / 100 / 1000) * 1000;
}

export function orderPct(subtotal, tiers) {
  const hit = (tiers || []).find((t) => subtotal >= t.min);
  return hit ? hit.pct : 0;
}

export function wholesalePct(qty) {
  const hit = WHOLESALE_TIERS.find((t) => qty >= t.minQty);
  return hit ? hit.pct : 0;
}

// Giá phần trái cây trong một ngăn: giá túi đang bán × gram ngăn / gram túi.
export function slotRetail(price, packGrams, slotGrams) {
  if (!(price > 0) || !(packGrams > 0) || !(slotGrams > 0)) return 0;
  return Math.round((price * slotGrams) / packGrams);
}

// Hộp giữ nguyên vị niêm yết thì giữ đúng giá set đang bán.
// Đổi vị: cộng phần chênh giá lẻ sau −6%, rồi áp sàn 85% và trần giảm 11%.
export function boxPrice({ listed, baseFruit, fruit }) {
  const base = Number(listed);
  if (!(base > 0)) return 0;
  if (fruit === baseFruit) return base;
  const raw = base + (fruit - baseFruit) * (1 - SET_OFF);
  let price = round1k(raw);
  const pack = Math.max(0, base / (1 - SET_OFF) - baseFruit);
  const minFloor = Math.ceil((fruit * FRUIT_FLOOR) / 1000) * 1000;
  const minCap = Math.ceil(((fruit + pack) * (1 - MAX_OFF)) / 1000) * 1000;
  if (price < minFloor) price = minFloor;
  if (price < minCap) price = minCap;
  return Math.max(1000, price);
}

export function quoteBox({ unit, qty, tiers }) {
  const retail = unit * qty;
  const cartPct = orderPct(retail, tiers);
  const siPct = wholesalePct(qty);
  const pct = Math.max(cartPct, siPct);
  const discount = discountAmount(retail, pct);
  const pay = retail - discount;
  return { unit, qty, retail, cartPct, siPct, pct, discount, pay, note: priceNote(qty) };
}

export function priceNote(qty) {
  if (qty >= 50) return 'Giá sỉ từ 50 hộp: −15%. Mức này thay −12% của đơn, không cộng thêm.';
  if (qty >= 20) return 'Giá sỉ từ 20 hộp: −12%. Trùng mức giảm đơn từ 1.000.000đ, chỉ tính một lần.';
  return 'Từ 20 hộp: giá sỉ −12%. Từ 50 hộp: −15%. Chưa tới số lượng thì vẫn giảm theo đơn như giỏ hàng.';
}
