import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import { ROOT } from './paths.js';
import { problem } from './format.js';
import { getShopCatalog, getProductPage, adminProducts, skuExists } from './catalog.js';
import { priceItems } from './promo.js';
import { placeOrder, readCustomer } from './orders.js';
import { getOrder, getSettings, isStatus, listOrders, saveSettings, setProductOverride, setVariantPrice, STATUSES, updateOrderStatus } from './db.js';
import { bankConfig, vietqrFor } from './vietqr.js';
import { checkPassword, isAdmin, loginCookie, logoutCookie, passwordConfigured, requireAdmin } from './auth.js';
import { adminPage, cartPage, checkoutPage, errorPage, homePage, orderPage, productPage, shopPage, trackPage } from './pages.js';

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

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '200kb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });

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

  app.post('/api/admin/login', limiter(8, 15 * 60 * 1000), (req, res) => {
    if (!passwordConfigured()) {
      res.status(503).json({ error: 'Chưa đặt ADMIN_PASSWORD trên máy chủ.' });
      return;
    }
    if (!checkPassword(req.body?.password || '')) {
      res.status(401).json({ error: 'Mật khẩu chưa đúng.' });
      return;
    }
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
    const message = err.expose ? err.message : 'Có lỗi trên máy chủ. Bạn thử lại giúp.';
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
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Mộc Quả đang chạy tại http://localhost:${port}`);
  });
}
