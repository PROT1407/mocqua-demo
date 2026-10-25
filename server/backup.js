import { STATUSES, isStatus } from './db.js';
import { problem } from './format.js';
import { skuExists } from './catalog.js';

export const BACKUP_VERSION = 1;
export const REPLACE_CONFIRM = 'THAY-HET';
const MAX_ORDERS = 5000;
const CODE_RE = /^MQ\d{6}-[A-Z0-9]{6}$/;
const SKU_RE = /^[A-Za-z0-9._+-]{1,80}$/;
const PRODUCT_RE = /^[a-z0-9-]{1,120}$/;

const STATUS_LABEL = new Map(STATUSES);

function fail(message) {
  throw problem(400, message);
}

function plain(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value, max, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) fail('File sao lưu thiếu một mục chữ bắt buộc.');
    return '';
  }
  if (typeof value !== 'string') fail('File sao lưu có mục chữ không đúng dạng.');
  const trimmed = value.trim();
  if (required && !trimmed) fail('File sao lưu thiếu một mục chữ bắt buộc.');
  if (trimmed.length > max) fail('Một mục trong file sao lưu quá dài.');
  return trimmed;
}

function intField(value, min, max, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) fail(`${label} trong file sao lưu chưa đúng.`);
  return n;
}

function iso(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${label} trong file sao lưu chưa đúng.`);
  }
  return value;
}

function lineItem(item, label) {
  if (!plain(item)) fail(`${label} trong file sao lưu không đúng dạng.`);
  const sku = text(item.sku, 80, { required: true });
  if (!SKU_RE.test(sku)) fail(`Mã món trong ${label} chưa đúng.`);
  const qty = intField(item.qty, 1, 99, `Số lượng ${label}`);
  const price = intField(item.price, 0, 100000000, `Giá ${label}`);
  const line = item.line == null ? price * qty : intField(item.line, 0, 100000000, `Thành tiền ${label}`);
  const next = {
    sku,
    name: text(item.name, 180, { required: true }),
    w: text(item.w, 240),
    qty,
    price,
    line,
  };
  const id = text(item.id, 120);
  if (id) next.id = id;
  const img = text(item.img, 400);
  if (img) next.img = img;
  if (item.retail != null) next.retail = intField(item.retail, 0, 100000000, `Giá gốc ${label}`);
  return next;
}

function readOrder(order, index, seen) {
  if (!plain(order)) fail(`Đơn số ${index + 1} không đúng dạng.`);
  const code = text(order.code, 40, { required: true }).toUpperCase();
  if (!CODE_RE.test(code)) fail(`Mã đơn không đúng ở vị trí ${index + 1}.`);
  if (seen.has(code)) fail(`File có mã đơn trùng ${code}.`);
  seen.add(code);
  if (!isStatus(order.status)) fail(`Trạng thái của ${code} không có trong danh sách.`);
  if (order.payMethod !== 'vietqr' && order.payMethod !== 'cod') fail(`Cách thanh toán của ${code} chưa đúng.`);
  if (!plain(order.customer)) fail(`Khách của ${code} không đúng dạng.`);
  if (!Array.isArray(order.items) || !order.items.length || order.items.length > 40) {
    fail(`Danh sách món của ${code} chưa đúng.`);
  }
  if (order.gifts != null && (!Array.isArray(order.gifts) || order.gifts.length > 10)) {
    fail(`Quà của ${code} chưa đúng.`);
  }
  if (!plain(order.summary)) fail(`Tiền của ${code} không đúng dạng.`);
  const customer = {
    name: text(order.customer.name, 80, { required: true }),
    phone: text(order.customer.phone, 16, { required: true }),
    province: text(order.customer.province, 80),
    ward: text(order.customer.ward, 80),
    address: text(order.customer.address, 180),
    note: text(order.customer.note, 400),
  };
  if (!/^0\d{8,10}$/.test(customer.phone)) fail(`Số điện thoại của ${code} chưa đúng.`);
  return {
    code,
    status: order.status,
    payMethod: order.payMethod,
    customer,
    items: order.items.map((item, itemIndex) => lineItem(item, `món ${itemIndex + 1} của ${code}`)),
    gifts: (order.gifts || []).map((item, itemIndex) => lineItem(item, `quà ${itemIndex + 1} của ${code}`)),
    summary: {
      subtotal: intField(order.summary.subtotal, 0, 100000000, `Tạm tính ${code}`),
      ship: intField(order.summary.ship, 0, 500000, `Phí giao ${code}`),
      total: intField(order.summary.total, 0, 100000000, `Tổng ${code}`),
      giftQty: intField(order.summary.giftQty ?? 0, 0, 10, `Số quà ${code}`),
      hint: text(order.summary.hint, 400),
    },
    note: text(order.note, 400),
    createdAt: iso(order.createdAt, `Ngày đặt ${code}`),
    updatedAt: iso(order.updatedAt, `Ngày cập nhật ${code}`),
  };
}

function readSettings(input) {
  if (!plain(input)) fail('Mục cài đặt trong file sao lưu không đúng dạng.');
  const next = {
    giftMin: intField(input.giftMin, 0, 100000000, 'Mức đơn tặng quà'),
    giftPair: intField(input.giftPair, 1, 20, 'Số túi xoài để tặng 1 gói'),
    giftMinG: intField(input.giftMinG, 1, 5000, 'Khối lượng túi tính quà'),
    giftMax: intField(input.giftMax, 0, 10, 'Số gói quà tối đa'),
    freeShip: intField(input.freeShip, 0, 100000000, 'Mức miễn phí giao'),
    shipFee: intField(input.shipFee, 0, 500000, 'Phí giao'),
    giftSku: text(input.giftSku, 80, { required: true }),
    giftProductId: text(input.giftProductId, 120, { required: true }),
    codEnabled: input.codEnabled === true || input.codEnabled === false ? input.codEnabled : fail('Mục trả khi nhận hàng trong file chưa đúng.'),
  };
  if (!SKU_RE.test(next.giftSku) || !skuExists(next.giftSku)) fail('Không thấy mã quà của file sao lưu trong danh mục.');
  if (!PRODUCT_RE.test(next.giftProductId)) fail('Mã sản phẩm quà trong file sao lưu chưa đúng.');
  return next;
}

function readVariantPrices(input) {
  if (!Array.isArray(input) || input.length > 5000) fail('Mục giá trong file sao lưu chưa đúng.');
  const seen = new Set();
  return input.map((row) => {
    if (!plain(row)) fail('Một dòng giá trong file sao lưu không đúng dạng.');
    const sku = text(row.sku, 80, { required: true });
    if (!SKU_RE.test(sku)) fail(`Mã giá ${sku} chưa đúng.`);
    if (seen.has(sku)) fail(`File có giá trùng mã ${sku}.`);
    seen.add(sku);
    return {
      sku,
      price: intField(row.price, 1000, 100000000, `Giá ${sku}`),
      updatedAt: iso(row.updatedAt, `Ngày sửa giá ${sku}`),
    };
  });
}

function readProductOverrides(input) {
  if (!Array.isArray(input) || input.length > 5000) fail('Mục sản phẩm trong file sao lưu chưa đúng.');
  const seen = new Set();
  return input.map((row) => {
    if (!plain(row)) fail('Một dòng sản phẩm trong file sao lưu không đúng dạng.');
    const id = text(row.id, 120, { required: true });
    if (!PRODUCT_RE.test(id)) fail(`Mã sản phẩm ${id} trong file chưa đúng.`);
    if (seen.has(id)) fail(`File có sản phẩm trùng ${id}.`);
    seen.add(id);
    const hidden = row.hidden === true || row.hidden === 1 ? true : row.hidden === false || row.hidden === 0 ? false : fail(`Trạng thái ẩn của ${id} chưa đúng.`);
    const short = row.short == null || row.short === '' ? null : text(row.short, 280);
    return {
      id,
      hidden,
      short,
      updatedAt: iso(row.updatedAt, `Ngày sửa ${id}`),
    };
  });
}

export function parseBackup(body, { restoreShop = false } = {}) {
  if (!plain(body)) fail('File không phải bản sao JSON của Mộc Quả.');
  if (body.version !== BACKUP_VERSION) fail('File không phải bản sao Mộc Quả (sai phiên bản). Dùng file Xuất tất cả (JSON).');
  if (!Array.isArray(body.orders)) fail('File sao lưu không có danh sách đơn.');
  if (body.orders.length > MAX_ORDERS) fail('File có quá nhiều đơn.');
  const seen = new Set();
  const orders = body.orders.map((order, index) => readOrder(order, index, seen));
  const parsed = { orders };
  if (restoreShop) {
    if (body.settings != null) parsed.settings = readSettings(body.settings);
    if (body.variantPrices != null) parsed.variantPrices = readVariantPrices(body.variantPrices);
    if (body.productOverrides != null) parsed.productOverrides = readProductOverrides(body.productOverrides);
  }
  return parsed;
}

export function backupStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '00';
  return `${get('year')}${get('month')}${get('day')}-${get('hour')}${get('minute')}`;
}

function csvCell(value) {
  let textValue = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(textValue)) textValue = `'${textValue}`;
  if (/[",\n\r]/.test(textValue)) return `"${textValue.replace(/"/g, '""')}"`;
  return textValue;
}

function payLabel(payMethod) {
  if (payMethod === 'cod') return 'Khi nhận';
  if (payMethod === 'vietqr') return 'Chuyển khoản';
  return payMethod || '';
}

function csvRow(order, line, kind) {
  const customer = order.customer || {};
  const summary = order.summary || {};
  return [
    order.code,
    order.createdAt,
    order.updatedAt,
    STATUS_LABEL.get(order.status) || order.status,
    payLabel(order.payMethod),
    customer.name,
    customer.phone,
    customer.address,
    customer.ward,
    customer.province,
    order.note || customer.note || '',
    kind,
    line?.sku || '',
    line?.name || '',
    line?.w || '',
    line?.qty ?? '',
    line?.price ?? '',
    line?.line ?? '',
    summary.subtotal ?? '',
    summary.ship ?? '',
    summary.total ?? '',
  ].map(csvCell).join(',');
}

export function ordersToCsv(orders) {
  const header = [
    'Mã đơn',
    'Thời gian đặt',
    'Cập nhật',
    'Trạng thái',
    'Thanh toán',
    'Khách',
    'Điện thoại',
    'Địa chỉ',
    'Phường xã',
    'Tỉnh',
    'Ghi chú',
    'Loại dòng',
    'Mã món',
    'Tên món',
    'Khối lượng',
    'Số lượng',
    'Đơn giá',
    'Thành tiền dòng',
    'Tạm tính',
    'Phí giao',
    'Tổng đơn',
  ];
  const rows = [header.map(csvCell).join(',')];
  for (const order of orders) {
    const items = order.items?.length ? order.items : [null];
    for (const item of items) rows.push(csvRow(order, item, item ? 'Hàng' : ''));
    for (const gift of order.gifts || []) rows.push(csvRow(order, gift, 'Quà'));
  }
  return `\uFEFF${rows.join('\n')}\n`;
}
