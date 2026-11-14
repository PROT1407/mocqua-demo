// Giá đang bán theo lịch khuyến mãi. Giá gốc, nếu không ghi sẵn, = listPer100g × gram / 100,
// làm tròn tới nghìn đồng gần nhất (250g của 33.000đ/100g = 83.000đ).
// Hết hạn khi now >= endsAt. endsAt nên là 00:00 ICT ngày hôm sau (hết 30/11 = 2026-12-01T00:00:00+07:00).

function asInt(value) {
  return Number.isInteger(value) ? value : null;
}

export function listPriceForGrams(per100g, grams) {
  if (!Number.isInteger(per100g) || per100g <= 0 || !Number.isInteger(grams) || grams <= 0) return null;
  const scaled = per100g * grams;
  const step = 100000;
  const down = Math.floor(scaled / step);
  const rem = scaled % step;
  return (rem >= step / 2 ? down + 1 : down) * 1000;
}

export function promoLabel(endsAt) {
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end)) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date(end - 1));
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return day && month ? `KM đến ${day}/${month}` : '';
}

function cleanLabel(value) {
  const text = String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 40);
}

function atMs(now) {
  if (now instanceof Date) return now.getTime();
  const parsed = Date.parse(now);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

// input: { price, grams, listPer100g, promoEndsAt, promo: { price, originalPrice|compareAt, endsAt, label } }
// Trả về { price, compareAt, promo }. promo chỉ có khi còn hạn và giá khuyến mãi thấp hơn giá gốc.
export function resolveSale(input = {}, now = new Date()) {
  const stored = asInt(input.price);
  const promo = input.promo && typeof input.promo === 'object' ? input.promo : null;
  const endsAt = (typeof promo?.endsAt === 'string' && promo.endsAt)
    || (typeof input.promoEndsAt === 'string' && input.promoEndsAt)
    || '';
  const promoPrice = asInt(promo?.price) ?? stored;
  const explicit = asInt(promo?.originalPrice ?? promo?.compareAt);
  const original = explicit ?? listPriceForGrams(asInt(input.listPer100g), asInt(input.grams));
  const endMs = endsAt ? Date.parse(endsAt) : NaN;
  if (!Number.isFinite(endMs) || original == null || promoPrice == null) {
    return { price: stored, compareAt: null, promo: null };
  }
  if (atMs(now) >= endMs) return { price: original, compareAt: null, promo: null };
  if (!(promoPrice < original)) return { price: promoPrice, compareAt: null, promo: null };
  const label = cleanLabel(promo?.label) || promoLabel(endsAt);
  return {
    price: promoPrice,
    compareAt: original,
    promo: { price: promoPrice, originalPrice: original, endsAt, label },
  };
}
