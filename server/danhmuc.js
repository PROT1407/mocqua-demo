// Danh mục tra cứu: Thương hiệu → Nhãn → Sản phẩm → Khối lượng.
// Dữ liệu sản phẩm nằm trong server/data/danh-muc.json (sửa bằng tay, có trong git).
// Giá bán lẻ, nguồn giá và ngày kiểm theo từng mã lưu trong SQLite (bảng catalog_prices), sửa ở /admin.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';
import { getDb, withTransaction } from './db.js';
import { problem } from './format.js';

const FILE = path.join(ROOT, 'server', 'data', 'danh-muc.json');
let cached;

export function catalogData() {
  if (!cached) cached = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return cached;
}

export function catalogCodes() {
  return new Set(catalogData().products.flatMap((p) => p.variants.map((v) => v.code)));
}

function priceRows() {
  return getDb().prepare(`SELECT code, price, source, checked_at, updated_at FROM catalog_prices ORDER BY code`).all()
    .map((r) => ({ code: r.code, price: r.price, source: r.source, checkedAt: r.checked_at, updatedAt: r.updated_at }));
}

export function listCatalogPrices() {
  return priceRows();
}

// Gắn giá vào từng khối lượng. Giá/100g tính khi có cả giá và khối lượng.
export function catalogWithPrices() {
  const data = catalogData();
  const prices = new Map(priceRows().map((r) => [r.code, r]));
  const products = data.products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => {
      const pr = prices.get(v.code);
      const price = pr?.price ?? null;
      return {
        ...v,
        price,
        per100g: price != null && v.weightG ? Math.round((price * 100) / v.weightG) : null,
        priceSource: pr?.source || '',
        priceCheckedAt: pr?.checkedAt || '',
      };
    }),
  }));
  return { ...data, products };
}

function cleanPrice(input) {
  const raw = input?.price;
  let price = null;
  if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
    price = Number(String(raw).replace(/[.\s,]/g, '').replace(/đ$/i, ''));
    if (!Number.isInteger(price) || price < 0 || price > 100000000) throw problem(400, 'Giá không hợp lệ.');
  }
  const source = String(input?.source ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (source.length > 600) throw problem(400, 'Nguồn giá quá dài (tối đa 600 ký tự).');
  const checkedAt = String(input?.checkedAt ?? '').trim();
  if (checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) throw problem(400, 'Ngày kiểm phải dạng YYYY-MM-DD.');
  return { price, source, checkedAt };
}

export function setCatalogPrice(code, input) {
  const key = String(code || '').toUpperCase();
  if (!catalogCodes().has(key)) throw problem(404, 'Không có mã này trong danh mục.');
  const r = cleanPrice(input);
  const db = getDb();
  if (r.price == null && !r.source && !r.checkedAt) {
    db.prepare(`DELETE FROM catalog_prices WHERE code = ?`).run(key);
  } else {
    db.prepare(`INSERT INTO catalog_prices (code, price, source, checked_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET price = excluded.price, source = excluded.source, checked_at = excluded.checked_at, updated_at = excluded.updated_at`)
      .run(key, r.price, r.source, r.checkedAt, new Date().toISOString());
  }
  return { code: key, ...r };
}

// Nhập lại file giá đã xuất. Mã không còn trong danh mục thì bỏ qua.
export function importCatalogPrices(rows) {
  if (!Array.isArray(rows)) throw problem(400, 'File không có danh sách giá.');
  const codes = catalogCodes();
  let saved = 0;
  let skipped = 0;
  withTransaction(() => {
    for (const row of rows) {
      if (!codes.has(String(row?.code || '').toUpperCase())) { skipped += 1; continue; }
      setCatalogPrice(row.code, row);
      saved += 1;
    }
  });
  return { saved, skipped };
}
