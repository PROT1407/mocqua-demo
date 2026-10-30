// Bảng tham chiếu giá: Thương hiệu → Nhãn → Khối lượng.
import { getDb, withTransaction } from './db.js';
import { problem } from './format.js';
import { PRICE_SEED } from './price-seed.js';

export const OWN_BRAND = 'Mộc Quả';
export const PRICE_REF_FIELDS = [
  'id', 'brand', 'label', 'product', 'fruit', 'weightG', 'price', 'pack', 'code',
  'sourceUrl', 'checkedAt', 'isEstimate', 'isExample', 'note', 'updatedAt',
];
const SEED_KEY = 'price_refs_seeded';
const MAX_ROWS = 2000;

function now() {
  return new Date().toISOString();
}

export function ensurePriceSeed() {
  const db = getDb();
  if (db.prepare(`SELECT value FROM settings WHERE key = ?`).get(SEED_KEY)) return;
  withTransaction(() => {
    const count = db.prepare(`SELECT COUNT(*) AS n FROM price_refs`).get().n;
    if (!count) for (const row of PRICE_SEED) insertRow(clean(row));
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(SEED_KEY, now());
  });
}

function toApi(row) {
  return {
    id: row.id,
    brand: row.brand,
    label: row.label,
    product: row.product,
    fruit: row.fruit,
    weightG: row.weight_g,
    price: row.price,
    pack: row.pack,
    code: row.code,
    sourceUrl: row.source_url,
    checkedAt: row.checked_at,
    isEstimate: Boolean(row.is_estimate),
    isExample: Boolean(row.is_example),
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export function listPriceRefs() {
  ensurePriceSeed();
  return getDb()
    .prepare(`SELECT * FROM price_refs ORDER BY CASE WHEN brand = ? THEN 0 ELSE 1 END, brand, label, product, weight_g, id`)
    .all(OWN_BRAND)
    .map(toApi);
}

function text(value, name, max, required = false) {
  const out = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (required && !out) throw problem(400, `Thiếu ${name}.`);
  if (out.length > max) throw problem(400, `${name} quá dài (tối đa ${max} ký tự).`);
  return out;
}

function optInt(value, name, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[.\s]/g, '').replace(/đ$/i, ''));
  if (!Number.isInteger(n) || n < min || n > max) throw problem(400, `${name} không hợp lệ.`);
  return n;
}

function bool(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'có' || value === 'x';
}

export function clean(input) {
  if (!input || typeof input !== 'object') throw problem(400, 'Dòng dữ liệu không hợp lệ.');
  const sourceUrl = text(input.sourceUrl ?? input.source_url, 'Link nguồn', 600);
  if (sourceUrl && !/^https?:\/\/[^\s<>"']+$/i.test(sourceUrl)) throw problem(400, 'Link nguồn phải bắt đầu bằng http:// hoặc https://');
  const checkedAt = text(input.checkedAt ?? input.checked_at, 'Ngày kiểm', 10);
  if (checkedAt && !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) throw problem(400, 'Ngày kiểm phải dạng YYYY-MM-DD.');
  return {
    brand: text(input.brand, 'Thương hiệu', 80, true),
    label: text(input.label, 'Nhãn', 80),
    product: text(input.product, 'Tên sản phẩm', 160, true),
    fruit: text(input.fruit, 'Loại', 60),
    weightG: optInt(input.weightG ?? input.weight_g, 'Khối lượng', 1, 100000),
    price: optInt(input.price, 'Giá', 0, 100000000),
    pack: text(input.pack, 'Bao bì', 160),
    code: text(input.code, 'Mã', 40),
    sourceUrl,
    checkedAt,
    isEstimate: bool(input.isEstimate ?? input.is_estimate),
    isExample: bool(input.isExample ?? input.is_example),
    note: text(input.note, 'Ghi chú', 600),
  };
}

function insertRow(r, id = null) {
  const stmt = getDb().prepare(`INSERT INTO price_refs
    (id, brand, label, product, fruit, weight_g, price, pack, code, source_url, checked_at, is_estimate, is_example, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const out = stmt.run(id, r.brand, r.label, r.product, r.fruit, r.weightG, r.price, r.pack, r.code,
    r.sourceUrl, r.checkedAt, r.isEstimate ? 1 : 0, r.isExample ? 1 : 0, r.note, now());
  return Number(out.lastInsertRowid);
}

function updateRow(id, r) {
  return getDb().prepare(`UPDATE price_refs SET brand = ?, label = ?, product = ?, fruit = ?, weight_g = ?, price = ?,
    pack = ?, code = ?, source_url = ?, checked_at = ?, is_estimate = ?, is_example = ?, note = ?, updated_at = ? WHERE id = ?`)
    .run(r.brand, r.label, r.product, r.fruit, r.weightG, r.price, r.pack, r.code, r.sourceUrl, r.checkedAt,
      r.isEstimate ? 1 : 0, r.isExample ? 1 : 0, r.note, now(), id).changes;
}

export function getPriceRef(id) {
  const row = getDb().prepare(`SELECT * FROM price_refs WHERE id = ?`).get(id);
  return row ? toApi(row) : null;
}

export function createPriceRef(input) {
  ensurePriceSeed();
  if (getDb().prepare(`SELECT COUNT(*) AS n FROM price_refs`).get().n >= MAX_ROWS) throw problem(400, 'Bảng đã đủ 2000 dòng.');
  return getPriceRef(insertRow(clean(input)));
}

export function updatePriceRef(id, input) {
  const current = getPriceRef(id);
  if (!current) throw problem(404, 'Không tìm thấy dòng này.');
  updateRow(id, clean({ ...current, ...input }));
  return getPriceRef(id);
}

export function deletePriceRef(id) {
  ensurePriceSeed();
  const changes = getDb().prepare(`DELETE FROM price_refs WHERE id = ?`).run(id).changes;
  if (!changes) throw problem(404, 'Không tìm thấy dòng này.');
}

// Nhập: merge = dòng có id đã tồn tại thì cập nhật, còn lại thêm mới. replace = xoá hết rồi nạp file.
export function importPriceRefs(rows, mode) {
  if (!Array.isArray(rows)) throw problem(400, 'File không có danh sách dòng.');
  if (rows.length > MAX_ROWS) throw problem(400, 'File quá 2000 dòng.');
  const cleaned = rows.map((row, i) => {
    try {
      const id = Number(row.id);
      return { id: Number.isInteger(id) && id > 0 ? id : null, data: clean(row) };
    } catch (error) {
      throw problem(400, `Dòng ${i + 1}: ${error.message}`);
    }
  });
  ensurePriceSeed();
  let added = 0;
  let updated = 0;
  withTransaction(() => {
    if (mode === 'replace') getDb().prepare(`DELETE FROM price_refs`).run();
    for (const { id, data } of cleaned) {
      if (id && mode !== 'replace' && getPriceRef(id)) {
        updateRow(id, data);
        updated += 1;
      } else {
        insertRow(data, mode === 'replace' ? id : null);
        added += 1;
      }
    }
  });
  return { added, updated };
}

const CSV_COLS = [
  ['id', 'id'], ['brand', 'thuong_hieu'], ['label', 'nhan'], ['product', 'san_pham'], ['fruit', 'loai'],
  ['weightG', 'khoi_luong_g'], ['price', 'gia'], ['pack', 'bao_bi'], ['code', 'ma'], ['sourceUrl', 'link_nguon'],
  ['checkedAt', 'ngay_kiem'], ['isEstimate', 'uoc_luong'], ['isExample', 'du_lieu_mau'], ['note', 'ghi_chu'],
];

function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function priceRefsToCsv(rows) {
  const lines = [CSV_COLS.map(([, h]) => h).join(',')];
  for (const row of rows) {
    lines.push(CSV_COLS.map(([k]) => {
      const v = row[k];
      if (typeof v === 'boolean') return v ? '1' : '0';
      return csvCell(v);
    }).join(','));
  }
  return '\ufeff' + lines.join('\r\n') + '\r\n';
}

export function parseCsv(textValue) {
  const src = String(textValue ?? '').replace(/^\ufeff/, '');
  const records = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) records.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== '')) records.push(row);
  if (!records.length) return [];
  const header = records[0].map((h) => h.trim());
  const keyOf = new Map(CSV_COLS.flatMap(([k, h]) => [[h, k], [k, k]]));
  const keys = header.map((h) => keyOf.get(h));
  if (!keys.includes('brand') || !keys.includes('product')) throw problem(400, 'CSV cần cột thuong_hieu và san_pham.');
  return records.slice(1).map((cells) => {
    const out = {};
    keys.forEach((k, i) => {
      if (!k) return;
      let v = cells[i] ?? '';
      if (/^'[=+\-@]/.test(v)) v = v.slice(1);
      out[k] = v;
    });
    return out;
  });
}
