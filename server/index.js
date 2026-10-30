import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import { ROOT } from './paths.js';
import { problem } from './format.js';
import { getShopCatalog, getProductPage, adminProducts, skuExists } from './catalog.js';
import { priceItems } from './promo.js';
import { placeOrder, readCustomer } from './orders.js';
import { applyBackup, getOrder, getSettings, isStatus, listAllOrders, listOrders, listProductOverrideRows, listVariantPriceRows, saveSettings, setProductOverride, setVariantPrice, STATUSES, updateOrderStatus } from './db.js';
import { BACKUP_VERSION, backupStamp, ordersToCsv, parseBackup } from './backup.js';
import { bankConfig, vietqrFor } from './vietqr.js';
import { adminPasswordIssue, checkPassword, clearLoginFailures, isAdmin, loginBlocked, loginCookie, logoutCookie, passwordConfigured, recordLoginFailure, requireAdmin } from './auth.js';
import { createPriceRef, deletePriceRef, importPriceRefs, listPriceRefs, parseCsv, priceRefsToCsv, updatePriceRef } from './pricerefs.js';
import { catalogWithPrices, importCatalogPrices, listCatalogPrices, setCatalogPrice } from './danhmuc.js';
import { adminSameOrigin, securityHeaders } from './guard.js';
import { adminPage, cartPage, checkoutPage, errorPage, homePage, offlinePage, orderPage, productPage, shopPage, trackPage, comparePage, catalogPage } from './pages.js';

dotenv.config({ path: path.join(ROOT, '.env') });

const LEGACY = [
  'cau-chuyen.html',
  'chinh-sach.html',
  'lien-he.html',
  'hop-qua.html',
  'goc-am-thuc.html',
  'bai-viet.html',
  '404.html',
  'yeu-thich.html',
  'tai-khoan.html',
  'favicon.svg',
  'robots.txt',
  'CREDITS.md',
];

function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || 'local';
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      res.status(429).json({ error: 'Bạn thao tác hơi nhanh. Đợi một lát rồi thử lại.' });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function html(res, status, body) {
  res.status(status).set('Cache-Control', 'no-store').type('html').send(body);
}

function intField(value, { min, max, label }) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw problem(400, `${label} chưa đúng.`);
  }
  return n;
}

function buildBackup() {
  return {
    version: BACKUP_VERSION,
    shop: 'Mộc Quả',
    exportedAt: new Date().toISOString(),
    note: 'Bản sao đơn Mộc Quả. Nhập lại ở /admin. Thêm đơn còn thiếu thì giữ đơn đang có. Thay toàn bộ thì xoá đơn hiện tại rồi ghi file này.',
    orders: listAllOrders(),
    settings: getSettings(),
    variantPrices: listVariantPriceRows(),
    productOverrides: listProductOverrideRows(),
  };
}

function sendBackup(res, body, filename, type) {
  res.set('Cache-Control', 'no-store');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.type(type);
  res.send(body);
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  const parseJson = express.json({ limit: '200kb' });
  const parseBackupBody = express.json({ limit: '8mb' });
  app.use((req, res, next) => {
    if (req.method === 'POST' && (req.path === '/api/admin/backup' || req.path === '/api/admin/price-refs/import' || req.path === '/api/admin/catalog-prices/import')) return next();
    return parseJson(req, res, next);
  });
  app.use(securityHeaders);
  app.use(adminSameOrigin);

  app.get('/manifest.webmanifest', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.type('application/manifest+json');
    res.sendFile(path.join(ROOT, 'web', 'manifest.webmanifest'));
  });
  app.get('/sw.js', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.type('application/javascript; charset=utf-8');
    res.sendFile(path.join(ROOT, 'web', 'sw.js'));
  });
  app.use('/icons', express.static(path.join(ROOT, 'web', 'icons'), { index: false, maxAge: '7d' }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, bankReady: bankConfig().ready });
  });

  app.post('/api/quote', wrap((req, res) => {
    const priced = priceItems(req.body?.items, { allowEmpty: true });
    res.json(priced);
  }));

  app.post('/api/orders', limiter(30, 60 * 60 * 1000), wrap((req, res) => {
    const catalog = getShopCatalog();
    const customer = readCustomer(req.body, catalog.provinces);
    const order = placeOrder({
      items: req.body?.items,
      customer,
      pay: req.body?.pay,
    });
    const qr = vietqrFor(order.summary.total, order.code);
    res.status(201).json({
      code: order.code,
      url: '/don/' + order.code,
      total: order.summary.total,
      pay: order.payMethod,
      vietqr: qr,
    });
  }));

  app.get('/api/orders/:code', wrap((req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const order = getOrder(code);
    if (!order) throw problem(404, 'Không thấy đơn này.');
    res.json({
      code: order.code,
      status: order.status,
      payMethod: order.payMethod,
      summary: order.summary,
      createdAt: order.createdAt,
    });
  }));

  app.post('/api/admin/login', (req, res) => {
    if (!passwordConfigured()) {
      res.status(503).json({ error: 'Chưa đặt ADMIN_PASSWORD trên máy chủ.' });
      return;
    }
    if (loginBlocked(req)) {
      res.status(429).json({ error: 'Nhập sai quá nhiều lần. Đợi khoảng 15 phút rồi thử lại.' });
      return;
    }
    if (!checkPassword(req.body?.password || '')) {
      recordLoginFailure(req);
      res.status(401).json({ error: 'Mật khẩu chưa đúng.' });
      return;
    }
    clearLoginFailures(req);
    res.set('Set-Cookie', loginCookie(req)).json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.set('Set-Cookie', logoutCookie(req)).json({ ok: true });
  });

  app.get('/api/admin/me', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Bạn cần đăng nhập.' });
      return;
    }
    const bank = bankConfig();
    res.json({ ok: true, bankReady: bank.ready, bankName: bank.bankName || '' });
  });

  app.get('/api/admin/orders', requireAdmin, (req, res) => {
    res.json({ statuses: STATUSES, orders: listOrders() });
  });

  app.get('/api/admin/backup.json', requireAdmin, (req, res) => {
    const body = JSON.stringify(buildBackup(), null, 2);
    sendBackup(res, body, `mocqua-backup-${backupStamp()}.json`, 'application/json; charset=utf-8');
  });

  app.get('/api/admin/backup.csv', requireAdmin, (req, res) => {
    sendBackup(res, ordersToCsv(listAllOrders()), `mocqua-orders-${backupStamp()}.csv`, 'text/csv; charset=utf-8');
  });

  app.post('/api/admin/backup', requireAdmin, parseBackupBody, wrap((req, res) => {
    const mode = String(req.query.mode || '');
    if (mode !== 'merge' && mode !== 'replace') {
      throw problem(400, 'Chọn thêm đơn còn thiếu, hoặc thay toàn bộ đơn.');
    }
    if (mode === 'replace' && req.query.confirm !== 'THAY-HET') {
      throw problem(400, 'Muốn thay toàn bộ đơn thì cần xác nhận. Tick ô xác nhận trên trang quản trị rồi nhập lại.');
    }
    const restoreShop = req.query.restoreShop === '1' || req.query.restoreShop === 'true';
    const data = parseBackup(req.body, { restoreShop });
    const result = applyBackup(data, { mode, restoreShop });
    res.json({ ok: true, mode, ...result });
  }));

  // Bảng so sánh giá: Thương hiệu → Nhãn → Khối lượng
  const refId = (req) => intField(req.params.id, { min: 1, max: 1e9, label: 'Mã dòng' });
  app.get('/api/price-refs', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ rows: listPriceRefs() });
  });
  app.get('/api/admin/price-refs', requireAdmin, (req, res) => {
    res.json({ rows: listPriceRefs() });
  });
  app.get('/api/admin/price-refs.json', requireAdmin, (req, res) => {
    const body = JSON.stringify({ kind: 'mocqua-price-refs', version: 1, exportedAt: new Date().toISOString(), rows: listPriceRefs() }, null, 2);
    sendBackup(res, body, `mocqua-so-sanh-gia-${backupStamp()}.json`, 'application/json; charset=utf-8');
  });
  app.get('/api/admin/price-refs.csv', requireAdmin, (req, res) => {
    sendBackup(res, priceRefsToCsv(listPriceRefs()), `mocqua-so-sanh-gia-${backupStamp()}.csv`, 'text/csv; charset=utf-8');
  });
  app.post('/api/admin/price-refs/import', requireAdmin, parseBackupBody, wrap((req, res) => {
    const mode = String(req.query.mode || '');
    if (mode !== 'merge' && mode !== 'replace') throw problem(400, 'Chọn gộp vào bảng, hoặc thay toàn bộ bảng.');
    if (mode === 'replace' && req.query.confirm !== 'THAY-HET') {
      throw problem(400, 'Muốn thay toàn bộ bảng thì cần tick ô xác nhận.');
    }
    const body = req.body || {};
    const rows = typeof body.csv === 'string' ? parseCsv(body.csv) : (Array.isArray(body) ? body : body.rows);
    const result = importPriceRefs(rows, mode);
    res.json({ ok: true, mode, ...result });
  }));
  app.post('/api/admin/price-refs', requireAdmin, wrap((req, res) => {
    res.status(201).json({ row: createPriceRef(req.body) });
  }));
  app.put('/api/admin/price-refs/:id', requireAdmin, wrap((req, res) => {
    res.json({ row: updatePriceRef(refId(req), req.body) });
  }));
  app.patch('/api/admin/price-refs/:id', requireAdmin, wrap((req, res) => {
    res.json({ row: updatePriceRef(refId(req), req.body) });
  }));
  app.delete('/api/admin/price-refs/:id', requireAdmin, wrap((req, res) => {
    deletePriceRef(refId(req));
    res.json({ ok: true });
  }));
  app.get(['/so-sanh', '/so-sanh.html'], (req, res) => {
    html(res, 200, comparePage(listPriceRefs()));
  });

  // Danh mục tra cứu sản phẩm: Thương hiệu → Nhãn → Sản phẩm → Khối lượng
  app.get('/api/danh-muc', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(catalogWithPrices());
  });
  app.get('/api/admin/catalog-prices.json', requireAdmin, (req, res) => {
    const body = JSON.stringify({ kind: 'mocqua-catalog-prices', version: 1, exportedAt: new Date().toISOString(), rows: listCatalogPrices() }, null, 2);
    sendBackup(res, body, `mocqua-gia-danh-muc-${backupStamp()}.json`, 'application/json; charset=utf-8');
  });
  app.post('/api/admin/catalog-prices/import', requireAdmin, parseBackupBody, wrap((req, res) => {
    const body = req.body || {};
    res.json({ ok: true, ...importCatalogPrices(Array.isArray(body) ? body : body.rows) });
  }));
  app.put('/api/admin/catalog-prices/:code', requireAdmin, wrap((req, res) => {
    res.json({ row: setCatalogPrice(req.params.code, req.body) });
  }));
  app.get(['/danh-muc', '/danh-muc.html'], (req, res) => {
    html(res, 200, catalogPage(catalogWithPrices()));
  });

  app.patch('/api/admin/orders/:code', requireAdmin, wrap((req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const status = String(req.body?.status || '');
    if (!isStatus(status)) throw problem(400, 'Trạng thái không có trong danh sách.');
    const order = updateOrderStatus(code, status);
    if (!order) throw problem(404, 'Không thấy đơn này.');
    res.json({ order });
  }));

  app.get('/api/admin/products', requireAdmin, (req, res) => {
    res.json({ products: adminProducts() });
  });

  app.patch('/api/admin/variants/:sku', requireAdmin, wrap((req, res) => {
    const sku = String(req.params.sku || '');
    if (!skuExists(sku)) throw problem(404, 'Không thấy mã này trong danh mục.');
    if (req.body?.price == null) {
      setVariantPrice(sku, null);
    } else {
      const price = intField(req.body.price, { min: 1000, max: 100000000, label: 'Giá' });
      setVariantPrice(sku, price);
    }
    res.json({ ok: true });
  }));

  app.patch('/api/admin/products/:id', requireAdmin, wrap((req, res) => {
    const id = String(req.params.id || '');
    const known = adminProducts().some((p) => p.id === id);
    if (!known) throw problem(404, 'Không thấy sản phẩm.');
    const patch = {};
    if (req.body?.hidden != null) patch.hidden = !!req.body.hidden;
    if (req.body?.short != null) {
      const short = String(req.body.short).trim().slice(0, 280);
      patch.short = short || null;
    }
    setProductOverride(id, patch);
    res.json({ ok: true });
  }));

  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    res.json({ settings: getSettings() });
  });

  app.put('/api/admin/settings', requireAdmin, wrap((req, res) => {
    const body = req.body || {};
    const next = {
      giftMin: intField(body.giftMin, { min: 0, max: 100000000, label: 'Mức đơn tặng quà' }),
      giftPair: intField(body.giftPair, { min: 1, max: 20, label: 'Số túi xoài để tặng 1 gói' }),
      giftMinG: intField(body.giftMinG, { min: 1, max: 5000, label: 'Khối lượng túi tính quà' }),
      giftMax: intField(body.giftMax, { min: 0, max: 10, label: 'Số gói quà tối đa' }),
      freeShip: intField(body.freeShip, { min: 0, max: 100000000, label: 'Mức miễn phí giao' }),
      shipFee: intField(body.shipFee, { min: 0, max: 500000, label: 'Phí giao' }),
      giftSku: String(body.giftSku || '').trim(),
      giftProductId: String(body.giftProductId || '').trim(),
      codEnabled: !!body.codEnabled,
    };
    if (!skuExists(next.giftSku)) throw problem(400, 'Không thấy mã quà trong danh mục.');
    res.json({ settings: saveSettings(next) });
  }));

  app.get('/', (req, res) => {
    html(res, 200, homePage(getShopCatalog()));
  });
  app.get(['/cua-hang', '/cua-hang.html'], (req, res) => {
    html(res, 200, shopPage(getShopCatalog(), req.query));
  });
  app.get('/san-pham.html', (req, res) => {
    const id = String(req.query.id || '');
    if (!/^[a-z0-9-]+$/.test(id)) {
      res.redirect(302, '/cua-hang');
      return;
    }
    const sku = req.query.sku ? '?sku=' + encodeURIComponent(String(req.query.sku)) : '';
    res.redirect(301, '/san-pham/' + id + sku);
  });
  app.get('/san-pham/:id', (req, res) => {
    const id = String(req.params.id || '');
    if (!/^[a-z0-9-]+$/.test(id)) {
      html(res, 404, errorPage('Không thấy sản phẩm này.'));
      return;
    }
    const found = getProductPage(id);
    if (found.redirect && found.redirect !== id) {
      const sku = req.query.sku ? '?sku=' + encodeURIComponent(String(req.query.sku)) : '';
      res.redirect(301, '/san-pham/' + found.redirect + sku);
      return;
    }
    if (!found.product) {
      html(res, 404, errorPage('Không thấy sản phẩm này.'));
      return;
    }
    html(res, 200, productPage(found.product, getShopCatalog()));
  });
  app.get(['/gio-hang', '/gio-hang.html'], (req, res) => {
    html(res, 200, cartPage());
  });
  app.get(['/thanh-toan', '/thanh-toan.html'], (req, res) => {
    html(res, 200, checkoutPage(getShopCatalog()));
  });
  app.get('/don/:code', (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const order = getOrder(code);
    if (!order) {
      html(res, 404, errorPage('Không thấy đơn này. Kiểm tra lại mã đơn.'));
      return;
    }
    html(res, 200, orderPage(order, vietqrFor(order.summary.total, order.code)));
  });
  app.get('/tra-cuu', (req, res) => {
    const code = String(req.query.code || '').trim().toUpperCase();
    if (!code) {
      html(res, 200, trackPage());
      return;
    }
    if (!/^MQ\d{6}-[A-Z0-9]{6}$/.test(code) || !getOrder(code)) {
      html(res, 404, trackPage('Không thấy đơn này. Kiểm tra lại mã.'));
      return;
    }
    res.redirect(302, '/don/' + code);
  });
  app.get('/admin', (req, res) => {
    html(res, 200, adminPage());
  });
  app.get('/offline', (req, res) => {
    html(res, 200, offlinePage());
  });
  app.get('/index.html', (req, res) => res.redirect(302, '/'));

  app.use('/static', express.static(path.join(ROOT, 'web'), { index: false }));
  app.use('/assets', express.static(path.join(ROOT, 'assets'), { index: false, maxAge: '7d' }));
  app.use('/css', express.static(path.join(ROOT, 'css'), { index: false }));
  app.use('/js', express.static(path.join(ROOT, 'js'), { index: false }));

  for (const file of LEGACY) {
    app.get('/' + file, (req, res) => {
      res.sendFile(path.join(ROOT, file));
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Không thấy đường dẫn này.' });
      return;
    }
    html(res, 404, errorPage('Không thấy trang này.'));
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    let message = err.expose ? err.message : 'Có lỗi trên máy chủ. Bạn thử lại giúp.';
    if (status === 413) message = 'Dữ liệu gửi lên quá lớn.';
    if (err.type === 'entity.parse.failed') message = 'Không đọc được JSON. Dùng file Xuất tất cả (JSON) để nhập lại.';
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
      res.status(status).json({ error: message });
      return;
    }
    html(res, status, errorPage(message, status));
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const issue = adminPasswordIssue();
  if (issue) {
    console.error(issue);
    process.exit(1);
  }
  if (!process.env.ADMIN_SECRET) {
    console.warn('ADMIN_SECRET đang trống, cookie quản trị ký bằng ADMIN_PASSWORD. Nên đặt ADMIN_SECRET riêng trên Render.');
  }
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`Mộc Quả đang chạy tại http://localhost:${port}`);
  });
}
