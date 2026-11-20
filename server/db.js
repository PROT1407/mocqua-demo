import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ROOT } from './paths.js';

export const DEFAULT_SETTINGS = {
  giftMin: 199000,
  giftPair: 2,
  giftMinG: 200,
  giftMax: 3,
  giftSku: 'MQ-DXM-S-GG',
  giftProductId: 'xoai-say-deo-muoi-ot-goodgood',
  freeShip: 300000,
  shipFee: 30000,
  codEnabled: true,
};

export const STATUSES = [
  ['cho_ck', 'Chờ CK'],
  ['da_nhan', 'Đã nhận'],
  ['dang_giao', 'Đang giao'],
  ['xong', 'Xong'],
];

const STATUS_IDS = new Set(STATUSES.map(([id]) => id));

let db;

export function getDb() {
  if (db) return db;
  const file = process.env.DB_PATH || path.join(ROOT, 'data', 'mocqua.sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS variant_overrides (
      sku TEXT PRIMARY KEY,
      price INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_overrides (
      id TEXT PRIMARY KEY,
      hidden INTEGER NOT NULL DEFAULT 0,
      short TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      pay_method TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      gifts_json TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog_prices (
      code TEXT PRIMARY KEY,
      price INTEGER,
      source TEXT NOT NULL DEFAULT '',
      checked_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS price_refs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      product TEXT NOT NULL,
      fruit TEXT NOT NULL DEFAULT '',
      weight_g INTEGER,
      price INTEGER,
      pack TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      checked_at TEXT NOT NULL DEFAULT '',
      is_estimate INTEGER NOT NULL DEFAULT 0,
      is_example INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS variant_flags (
      sku TEXT PRIMARY KEY,
      oos INTEGER,
      compare_at INTEGER,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_gallery (
      product_id TEXT NOT NULL,
      file TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      alt TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL,
      hero INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, file)
    );
  `);
  const existing = db.prepare(`SELECT value FROM settings WHERE key = 'shop'`).get();
  if (!existing) {
    db.prepare(`INSERT INTO settings (key, value) VALUES ('shop', ?)`).run(JSON.stringify(DEFAULT_SETTINGS));
  }
  return db;
}

export function getSettings() {
  const row = getDb().prepare(`SELECT value FROM settings WHERE key = 'shop'`).get();
  const saved = row ? JSON.parse(row.value) : {};
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(next) {
  const merged = { ...DEFAULT_SETTINGS, ...getSettings(), ...next };
  getDb().prepare(`UPDATE settings SET value = ? WHERE key = 'shop'`).run(JSON.stringify(merged));
  return getSettings();
}

export function getOverrides() {
  const prices = new Map();
  for (const row of getDb().prepare(`SELECT sku, price FROM variant_overrides`).all()) {
    prices.set(row.sku, row.price);
  }
  const products = new Map();
  for (const row of getDb().prepare(`SELECT id, hidden, short FROM product_overrides`).all()) {
    products.set(row.id, { hidden: !!row.hidden, short: row.short || null });
  }
  const flags = new Map();
  for (const row of getDb().prepare(`SELECT sku, oos, compare_at FROM variant_flags`).all()) {
    flags.set(row.sku, {
      oos: row.oos == null ? null : !!row.oos,
      compareAt: row.compare_at == null ? null : row.compare_at,
    });
  }
  const galleries = new Map();
  for (const row of getDb().prepare(`SELECT product_id, file, label, alt, sort, hero FROM product_gallery ORDER BY product_id, sort, file`).all()) {
    const list = galleries.get(row.product_id) || [];
    list.push({ file: row.file, label: row.label || '', alt: row.alt || '', sort: row.sort, hero: !!row.hero });
    galleries.set(row.product_id, list);
  }
  return { prices, products, flags, galleries };
}

export function setVariantPrice(sku, price) {
  const now = new Date().toISOString();
  if (price == null) {
    getDb().prepare(`DELETE FROM variant_overrides WHERE sku = ?`).run(sku);
    return;
  }
  getDb().prepare(`
    INSERT INTO variant_overrides (sku, price, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at
  `).run(sku, price, now);
}

export function listVariantFlagRows() {
  return getDb().prepare(`SELECT sku, oos, compare_at, updated_at FROM variant_flags ORDER BY sku`).all().map((row) => ({
    sku: row.sku,
    oos: row.oos == null ? null : !!row.oos,
    compareAt: row.compare_at == null ? null : row.compare_at,
    updatedAt: row.updated_at,
  }));
}

export function setVariantFlag(sku, patch) {
  const current = getOverrides().flags.get(sku) || { oos: null, compareAt: null };
  const next = {
    oos: patch.oos === undefined ? current.oos : patch.oos,
    compareAt: patch.compareAt === undefined ? current.compareAt : patch.compareAt,
  };
  if (next.oos == null && next.compareAt == null) {
    getDb().prepare(`DELETE FROM variant_flags WHERE sku = ?`).run(sku);
    return;
  }
  getDb().prepare(`
    INSERT INTO variant_flags (sku, oos, compare_at, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET oos = excluded.oos, compare_at = excluded.compare_at, updated_at = excluded.updated_at
  `).run(sku, next.oos == null ? null : (next.oos ? 1 : 0), next.compareAt, new Date().toISOString());
}

export function listGalleryGroups() {
  return [...getOverrides().galleries.entries()]
    .map(([id, items]) => ({ id, items }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function setGallery(productId, items) {
  const previous = getOverrides().galleries.get(productId) || [];
  withTransaction((database) => {
    database.prepare(`DELETE FROM product_gallery WHERE product_id = ?`).run(productId);
    const insert = database.prepare(`INSERT INTO product_gallery (product_id, file, label, alt, sort, hero) VALUES (?, ?, ?, ?, ?, ?)`);
    items.forEach((item, index) => {
      insert.run(productId, item.file, item.label || '', item.alt || '', index, item.hero ? 1 : 0);
    });
  });
  const kept = new Set(items.map((item) => item.file));
  return previous
    .map((item) => item.file)
    .filter((file) => file.startsWith('upload:') && !kept.has(file))
    .filter((file) => !getDb().prepare(`SELECT 1 AS ok FROM product_gallery WHERE file = ?`).get(file))
    .map((file) => file.slice('upload:'.length));
}

export function setProductOverride(id, patch) {
  const current = getOverrides().products.get(id) || { hidden: false, short: null };
  const next = {
    hidden: patch.hidden == null ? current.hidden : !!patch.hidden,
    short: patch.short === undefined ? current.short : patch.short,
  };
  const now = new Date().toISOString();
  if (!next.hidden && !next.short) {
    getDb().prepare(`DELETE FROM product_overrides WHERE id = ?`).run(id);
    return;
  }
  getDb().prepare(`
    INSERT INTO product_overrides (id, hidden, short, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET hidden = excluded.hidden, short = excluded.short, updated_at = excluded.updated_at
  `).run(id, next.hidden ? 1 : 0, next.short, now);
}

const INSERT_ORDER = `
  INSERT INTO orders (code, status, pay_method, customer_json, items_json, gifts_json, summary_json, note, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

function orderParams(order) {
  return [
    order.code,
    order.status,
    order.payMethod,
    JSON.stringify(order.customer),
    JSON.stringify(order.items),
    JSON.stringify(order.gifts || []),
    JSON.stringify(order.summary),
    order.note || '',
    order.createdAt,
    order.updatedAt,
  ];
}

export function insertOrder(order) {
  getDb().prepare(INSERT_ORDER).run(...orderParams(order));
}

export function withTransaction(fn) {
  const database = getDb();
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
    throw error;
  }
}

function mapOrder(row) {
  if (!row) return null;
  return {
    code: row.code,
    status: row.status,
    payMethod: row.pay_method,
    customer: JSON.parse(row.customer_json),
    items: JSON.parse(row.items_json),
    gifts: JSON.parse(row.gifts_json),
    summary: JSON.parse(row.summary_json),
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getOrder(code) {
  return mapOrder(getDb().prepare(`SELECT * FROM orders WHERE code = ?`).get(code));
}

export function listOrders(limit = 200) {
  return getDb().prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`).all(limit).map(mapOrder);
}

export function listAllOrders() {
  return getDb().prepare(`SELECT * FROM orders ORDER BY created_at ASC, code ASC`).all().map(mapOrder);
}

export function listVariantPriceRows() {
  return getDb().prepare(`SELECT sku, price, updated_at FROM variant_overrides ORDER BY sku`).all().map((row) => ({
    sku: row.sku,
    price: row.price,
    updatedAt: row.updated_at,
  }));
}

export function listProductOverrideRows() {
  return getDb().prepare(`SELECT id, hidden, short, updated_at FROM product_overrides ORDER BY id`).all().map((row) => ({
    id: row.id,
    hidden: !!row.hidden,
    short: row.short || null,
    updatedAt: row.updated_at,
  }));
}

export function applyBackup(payload, { mode, restoreShop }) {
  return withTransaction((database) => {
    let added = 0;
    let skipped = 0;
    if (mode === 'replace') database.prepare(`DELETE FROM orders`).run();
    const insert = database.prepare(INSERT_ORDER);
    const has = database.prepare(`SELECT 1 AS ok FROM orders WHERE code = ?`);
    for (const order of payload.orders) {
      if (mode === 'merge' && has.get(order.code)) {
        skipped += 1;
        continue;
      }
      insert.run(...orderParams(order));
      added += 1;
    }
    let restoredShop = false;
    if (restoreShop && payload.settings) {
      const merged = { ...DEFAULT_SETTINGS, ...payload.settings };
      database.prepare(`UPDATE settings SET value = ? WHERE key = 'shop'`).run(JSON.stringify(merged));
      restoredShop = true;
    }
    if (restoreShop && payload.variantPrices) {
      if (mode === 'replace') database.prepare(`DELETE FROM variant_overrides`).run();
      const upsert = database.prepare(`
        INSERT INTO variant_overrides (sku, price, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(sku) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at
      `);
      for (const row of payload.variantPrices) upsert.run(row.sku, row.price, row.updatedAt);
      restoredShop = true;
    }
    if (restoreShop && payload.productOverrides) {
      if (mode === 'replace') database.prepare(`DELETE FROM product_overrides`).run();
      const upsert = database.prepare(`
        INSERT INTO product_overrides (id, hidden, short, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET hidden = excluded.hidden, short = excluded.short, updated_at = excluded.updated_at
      `);
      const remove = database.prepare(`DELETE FROM product_overrides WHERE id = ?`);
      for (const row of payload.productOverrides) {
        if (!row.hidden && !row.short) {
          remove.run(row.id);
          continue;
        }
        upsert.run(row.id, row.hidden ? 1 : 0, row.short, row.updatedAt);
      }
      restoredShop = true;
    }
    if (restoreShop && payload.variantFlags) {
      if (mode === 'replace') database.prepare(`DELETE FROM variant_flags`).run();
      const upsert = database.prepare(`
        INSERT INTO variant_flags (sku, oos, compare_at, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(sku) DO UPDATE SET oos = excluded.oos, compare_at = excluded.compare_at, updated_at = excluded.updated_at
      `);
      const remove = database.prepare(`DELETE FROM variant_flags WHERE sku = ?`);
      for (const row of payload.variantFlags) {
        if (row.oos == null && row.compareAt == null) {
          remove.run(row.sku);
          continue;
        }
        upsert.run(row.sku, row.oos == null ? null : (row.oos ? 1 : 0), row.compareAt, row.updatedAt);
      }
      restoredShop = true;
    }
    if (restoreShop && payload.galleries) {
      if (mode === 'replace') database.prepare(`DELETE FROM product_gallery`).run();
      const clear = database.prepare(`DELETE FROM product_gallery WHERE product_id = ?`);
      const insert = database.prepare(`INSERT INTO product_gallery (product_id, file, label, alt, sort, hero) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const group of payload.galleries) {
        clear.run(group.id);
        group.items.forEach((item, index) => {
          insert.run(group.id, item.file, item.label || '', item.alt || '', index, item.hero ? 1 : 0);
        });
      }
      restoredShop = true;
    }
    const orders = database.prepare(`SELECT COUNT(*) AS n FROM orders`).get().n;
    return { added, skipped, orders, restoredShop };
  });
}

export function updateOrderStatus(code, status) {
  if (!STATUS_IDS.has(status)) return null;
  const now = new Date().toISOString();
  const result = getDb().prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE code = ?`).run(status, now, code);
  if (!result.changes) return null;
  return getOrder(code);
}

export function isStatus(status) {
  return STATUS_IDS.has(status);
}

function cleanSku(value) {
  const sku = String(value || '');
  return /^[A-Za-z0-9._+-]{1,80}$/.test(sku) ? sku : '';
}

function cleanProductId(value) {
  const id = String(value || '');
  return /^[a-z0-9-]{1,120}$/.test(id) ? id : '';
}

// Thay phần giá, ảnh và cờ bằng bản kéo từ GitHub. Không đụng đơn hàng hay cài đặt giao hàng.
export function replaceDurableRows(snapshot) {
  if (!snapshot || snapshot.version !== 1) throw new Error('catalog-snapshot');
  const now = new Date().toISOString();
  withTransaction((database) => {
    database.prepare(`DELETE FROM variant_overrides`).run();
    database.prepare(`DELETE FROM product_overrides`).run();
    database.prepare(`DELETE FROM variant_flags`).run();
    database.prepare(`DELETE FROM product_gallery`).run();
    database.prepare(`DELETE FROM catalog_prices`).run();
    const price = database.prepare(`INSERT INTO variant_overrides (sku, price, updated_at) VALUES (?, ?, ?)`);
    for (const row of snapshot.variantPrices || []) {
      const sku = cleanSku(row?.sku);
      if (!sku || !Number.isInteger(row?.price)) continue;
      price.run(sku, row.price, typeof row.updatedAt === 'string' ? row.updatedAt : now);
    }
    const product = database.prepare(`INSERT INTO product_overrides (id, hidden, short, updated_at) VALUES (?, ?, ?, ?)`);
    for (const row of snapshot.productOverrides || []) {
      const id = cleanProductId(row?.id);
      if (!id || (!row.hidden && !row.short)) continue;
      product.run(id, row.hidden ? 1 : 0, row.short || null, typeof row.updatedAt === 'string' ? row.updatedAt : now);
    }
    const flag = database.prepare(`INSERT INTO variant_flags (sku, oos, compare_at, updated_at) VALUES (?, ?, ?, ?)`);
    for (const row of snapshot.variantFlags || []) {
      const sku = cleanSku(row?.sku);
      if (!sku || (row.oos == null && row.compareAt == null)) continue;
      flag.run(sku, row.oos == null ? null : (row.oos ? 1 : 0), Number.isInteger(row.compareAt) ? row.compareAt : null, typeof row.updatedAt === 'string' ? row.updatedAt : now);
    }
    const shot = database.prepare(`INSERT INTO product_gallery (product_id, file, label, alt, sort, hero) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const group of snapshot.galleries || []) {
      const id = cleanProductId(group?.id);
      if (!id || !Array.isArray(group.items)) continue;
      group.items.forEach((item, index) => {
        const file = String(item?.file || '');
        if (!/^(asset:[\w./-]{1,180}|upload:[a-z0-9-]{1,60}\.(jpg|png|webp))$/.test(file)) return;
        shot.run(id, file, String(item.label || '').slice(0, 80), String(item.alt || '').slice(0, 180), index, item.hero ? 1 : 0);
      });
    }
    const catalog = database.prepare(`INSERT INTO catalog_prices (code, price, source, checked_at, updated_at) VALUES (?, ?, ?, ?, ?)`);
    for (const row of snapshot.catalogPrices || []) {
      const code = String(row?.code || '').toUpperCase();
      if (!/^[A-Z0-9._+-]{1,80}$/.test(code)) continue;
      catalog.run(code, Number.isInteger(row.price) ? row.price : null, String(row.source || '').slice(0, 600), String(row.checkedAt || '').slice(0, 10), typeof row.updatedAt === 'string' ? row.updatedAt : now);
    }
  });
}
