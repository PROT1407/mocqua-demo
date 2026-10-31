import crypto from 'node:crypto';
import { getOrder, getSettings, insertOrder } from './db.js';
import { priceItems } from './promo.js';
import { problem } from './format.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let n = 0; n < 6; n += 1) {
    const bytes = crypto.randomBytes(6);
    let tail = '';
    for (const b of bytes) tail += ALPHABET[b % ALPHABET.length];
    const code = `MQ${stamp}-${tail}`;
    if (!getOrder(code)) return code;
  }
  throw problem(500, 'Chưa tạo được mã đơn. Bạn thử lại giúp.');
}

export function readCustomer(body, provinces) {
  const name = String(body?.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const phone = String(body?.phone || '').replace(/[^\d]/g, '').slice(0, 12);
  const province = String(body?.province || '').trim().slice(0, 80);
  const ward = String(body?.ward || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const address = String(body?.address || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  const note = String(body?.note || '').trim().slice(0, 400);
  if (name.length < 2) throw problem(400, 'Điền họ tên người nhận.');
  if (!/^0\d{8,10}$/.test(phone)) throw problem(400, 'Số điện thoại chưa đúng. Viết dạng 09xxxxxxxx.');
  if (!provinces.includes(province)) throw problem(400, 'Chọn tỉnh thành trong danh sách.');
  if (address.length < 5) throw problem(400, 'Điền địa chỉ nhận hàng.');
  return { name, phone, province, ward, address, note };
}

export function placeOrder({ items, customer, pay }) {
  const settings = getSettings();
  if (pay !== 'vietqr' && pay !== 'cod') throw problem(400, 'Chọn cách thanh toán.');
  if (pay === 'cod' && !settings.codEnabled) throw problem(400, 'Shop đang tắt thanh toán khi nhận hàng.');
  const priced = priceItems(items);
  const now = new Date().toISOString();
  const order = {
    code: makeCode(),
    status: pay === 'cod' ? 'da_nhan' : 'cho_ck',
    payMethod: pay,
    customer,
    items: priced.items,
    gifts: [],
    summary: {
      subtotal: priced.subtotal,
      discount: priced.discount,
      discountPct: priced.discountPct,
      discountBase: priced.discountBase,
      ship: priced.ship,
      total: priced.total,
      hint: priced.hint,
    },
    note: customer.note,
    createdAt: now,
    updatedAt: now,
  };
  insertOrder(order);
  return order;
}
