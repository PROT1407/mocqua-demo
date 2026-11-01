import { esc, vnd } from './format.js';
import { brandOrder } from './catalog.js';
import { STATUSES, getSettings } from './db.js';
import { bannerText, ORDER_TIERS, isComboProduct } from './promo.js';
import { shopContact } from './contact.js';
import { catalogHeroBySku } from './dm-buy.js';
import { bankConfig } from './vietqr.js';

const PROC = ['deo', 'thanghoa', 'gion', 'kho'];
// Câu mở đầu cho băng tiêu đề từng nhóm ở /cua-hang (chỉ trang Cửa hàng dùng).
const CAT_INTRO = {
  deo: 'Dẻo mềm, ngọt chua tự nhiên của trái chín: xoài, mít, thơm, mãng cầu.',
  thanghoa: 'Sấy lạnh thăng hoa: giòn tan, giữ trọn màu và mùi trái chín, nổi nhất là sầu riêng.',
  gion: 'Giòn rụm, ít ngọt, món nhâm nhi bán chạy, đứng đầu là mít Thái.',
  kho: 'Sấy khô truyền thống, vị đậm, để được lâu.',
  omai: 'Ô mai, xí muội chua cay mặn ngọt, vị Tết và vị tuổi thơ.',
  set: 'Set quà và hộp mứt Tết đóng sẵn, gói đẹp để biếu.',
  hat: 'Hạt dinh dưỡng rang mộc: mắc ca, điều, hạt sen, dẻ cười.',
};
const BAND_MIN = 4;
const EXTRA = ['omai', 'set', 'hat'];
// Khối "Nổi bật" đầu /cua-hang (chỉ khi chưa lọc) và món đứng đầu mỗi cách sấy. Theo thứ tự này; id ẩn/không có thì bỏ qua.
// Chỉ đổi thứ tự hiển thị — không đụng mã, giá hay nút mua ở /danh-muc.
const FEATURED = [
  'mqz-sau-rieng-ri6-thang-hoa',
  'sau-rieng-say-thang-hoa-cheers',
  'vz-ps-cb3',
  'xoai-say-deo',
  'mqz-mit-say-gion',
  'xoai-chin-cay',
  'combo-xoai-say-deo-100g',
  'mit-say-gion',
];

function layout({ title, description, page, body, scripts = [], styles = [] }) {
  const tags = ['/static/js/store.js', '/static/js/pwa.js', ...scripts]
    .map((src) => `<script type="module" src="${src}"></script>`)
    .join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F7F1E8">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Mộc Quả">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/css/shop.css">${styles.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join('')}
</head>
<body class="page-${esc(page)}">
<a class="skip" href="#main">Tới nội dung</a>
${header(page)}
${body}
${footer()}
${tags}
</body>
</html>`;
}

function promoBar(page) {
  if (page === 'admin') return '';
  let text;
  try {
    text = bannerText(getSettings());
  } catch {
    text = 'Miễn phí giao từ 300k · Giảm 5% đơn từ 500k · Giảm 8% đơn từ 1 triệu';
  }
  return `<div class="promobar" role="note"><div class="wrap"><b>${esc(text)}</b> <small>Combo đã có giá riêng, không giảm thêm.</small></div></div>`;
}

function header(page) {
  return `${promoBar(page)}<header class="top">
  <div class="wrap top__in">
    <a class="logo" href="/">Mộc Quả <small>trái cây sấy</small></a>
    <nav class="top__nav" aria-label="Điều hướng">
      <a href="/cua-hang"${page === 'shop' ? ' aria-current="page"' : ''}>Cửa hàng</a>
      <a href="/danh-muc"${page === 'catalog' ? ' aria-current="page"' : ''}>Danh mục</a>
      <a href="/so-sanh"${page === 'compare' ? ' aria-current="page"' : ''}>So sánh</a>
      <a href="/tra-cuu"${page === 'track' ? ' aria-current="page"' : ''}>Tra cứu</a>
    </nav>
    <a class="cartbtn" href="/gio-hang">Giỏ <span data-cart-count>0</span></a>
  </div>
</header>`;
}

function footer() {
  const bank = bankConfig();
  const phones = shopContact.phones
    .map((p) => `<a href="tel:${esc(p.tel)}">${esc(p.display)}</a>`)
    .join(' · ');
  const zalos = shopContact.phones
    .map((p) => `<a href="https://zalo.me/${esc(p.tel)}" target="_blank" rel="noopener">Zalo ${esc(p.display)}</a>`)
    .join('');
  const bankLine = bank.ready
    ? `<p>Chuyển khoản: ${esc(bank.bankName || 'Ngân hàng')} · STK ${esc(bank.accountNo)} · ${esc(bank.accountName)}</p>`
    : '';
  return `<footer class="foot">
  <div class="wrap foot__in">
    <div>
      <b>Mộc Quả</b>
      <p>${esc(shopContact.address)}</p>
      <p>${phones}<br><a href="mailto:${esc(shopContact.email)}">${esc(shopContact.email)}</a><br>${esc(shopContact.hours)}</p>
      ${bankLine}
    </div>
    <nav aria-label="Chân trang">
      <a href="/cua-hang">Cửa hàng</a>
      <a href="/cau-chuyen.html">Câu chuyện</a>
      <a href="/chinh-sach.html">Chính sách</a>
      <a href="/lien-he.html">Liên hệ</a>
      <a href="${esc(shopContact.facebook)}" target="_blank" rel="noopener">Facebook</a>
      <a href="${esc(shopContact.tiktok)}" target="_blank" rel="noopener">TikTok</a>
      ${zalos}
      <a href="/admin">Quản lý đơn</a>
    </nav>
  </div>
</footer>`;
}

function jsonScript(id, data) {
  return `<script type="application/json" id="${esc(id)}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function priceLabel(product) {
  if (product.priceFrom == null) return 'Liên hệ';
  return (product.priceVaries ? 'từ ' : '') + vnd(product.priceFrom);
}

// "Thường mua kèm": combo chứa món này trước, rồi cùng dòng + cùng loại, rồi cùng loại, rồi quà dễ tặng.
function crossSell(product, catalog) {
  const live = catalog.products.filter((p) => p.id !== product.id && p.priceFrom > 0 && !p.oos && !p.hidden && p.defaultSku);
  const skus = new Set(product.variants.map((v) => v.sku));
  const priceOf = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.sku, v.price])));
  const out = [];
  const comboInfo = (p) => {
    if (!p.comboOf.length) return null;
    const def = p.variants.find((v) => v.sku === p.defaultSku);
    const sum = p.comboOf.reduce((t, sku) => t + (priceOf.get(sku) || 0), 0);
    return { save: def && p.comboOf.every((sku) => priceOf.get(sku) > 0) && def.price < sum ? sum - def.price : 0 };
  };
  const push = (p) => { if (p && out.length < 4 && !out.some((o) => o.p.id === p.id)) out.push({ p, combo: comboInfo(p) }); };
  const byKey = (key) => live.find((p) => p.id === key || p.variants.some((v) => v.sku === key));
  (product.kem || []).forEach((key) => push(byKey(key)));
  const combos = live.filter((p) => p.comboOf.some((sku) => skus.has(sku)));
  combos.sort((a, b) => a.comboOf.length - b.comboOf.length || a.rank - b.rank).slice(0, 2).forEach((p) => push(p));
  if (product.comboOf.length) product.comboOf.forEach((sku) => push(byKey(sku)));
  (product.related || []).forEach((id) => push(byKey(id)));
  const rank = (a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'vi');
  live.filter((p) => p.brandKey === product.brandKey && p.cat === product.cat).sort(rank).forEach((p) => push(p));
  live.filter((p) => p.cat === product.cat).sort((a, b) => (b.fruit === product.fruit) - (a.fruit === product.fruit) || rank(a, b)).forEach((p) => push(p));
  live.filter((p) => p.cat === 'hat' || p.fruit === 'xoai').sort(rank).forEach((p) => push(p));
  return out;
}

function kemBlock(product, kem) {
  if (!kem.length) return '';
  const k = (n) => Math.round(n / 1000) + 'k';
  const items = kem.map(({ p, combo }) => {
    const href = `/san-pham/${encodeURIComponent(p.id)}`;
    const def = p.variants.find((v) => v.sku === p.defaultSku);
    const price = def?.price || p.priceFrom;
    return `<li class="kem__it${combo ? ' kem__it--combo' : ''}">
      <a class="kem__img" href="${href}"><img src="${esc(p.cardImg || '/assets/img/xoai.jpg')}" alt="" loading="lazy" width="160" height="160"></a>
      <div class="kem__body">
        ${combo ? `<p class="kem__tag">Combo${combo.save ? ` · Tiết kiệm ${k(combo.save)}` : ''}</p>` : ''}
        <a class="kem__name" href="${href}">${esc(p.name)}</a>
        <p class="kem__meta">${esc(def?.w || p.weightLabel)} · <b>${esc(vnd(price))}</b></p>
      </div>
      <button type="button" class="btn btn--small kem__add" data-add-sku="${esc(p.defaultSku)}" aria-label="Thêm ${esc(p.name)} vào giỏ">${combo ? '+ Thêm combo' : '+ Thêm'}</button>
    </li>`;
  }).join('');
  return `<section class="related kem" aria-labelledby="kem-h"><h2 id="kem-h">Thường mua kèm</h2>${product.relatedNote ? `<p class="lead lead--left">${esc(product.relatedNote)}</p>` : ''}<ul class="kem__list">${items}</ul></section>`;
}

// Ảnh thẻ: 4:5 dựng sẵn (-45.jpg) giữ nguyên; ảnh khác tỉ lệ thì dùng ảnh chính ở /danh-muc (cùng ảnh, có bản nhỏ) nếu có.
function cardImage(product) {
  const own = product.cardImg || '/assets/img/xoai.jpg';
  const hero = /-45\.jpg$/.test(own) ? null : (product.variants || []).map((v) => catalogHeroBySku().get(v.sku)).find(Boolean);
  const img = hero?.src || own;
  return { hero, img, src: hero?.thumb || img, native45: /-45\.jpg$/.test(img) };
}

export function productCard(product, { eager = false, cls = '' } = {}) {
  const href = `/san-pham/${encodeURIComponent(product.id)}`;
  const { hero, img } = cardImage(product);
  const srcset = hero?.thumb ? ` srcset="${esc(hero.thumb)} 480w, ${esc(hero.src)} 1000w" sizes="(max-width: 719px) 50vw, (max-width: 979px) 33vw, 300px"` : '';
  const canBuy = product.defaultSku && product.priceFrom > 0 && !product.oos;
  // Ảnh không phải 4:5 dựng sẵn (ảnh vuông/ngang/dọc mượn từ /danh-muc): hiện trọn ảnh, căn giữa trong khung 4:5, không cắt.
  const fit = /-45\.jpg$/.test(img) ? '' : ' card__img--fit';
  return `<article class="card${cls ? ` ${cls}` : ''}">
    <a class="card__img${fit}" href="${href}">
      <img src="${esc(hero?.thumb || img)}"${srcset} alt="${esc(product.name)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="480" height="600">
      <span class="badge badge--${esc(product.cat)}">${esc(product.catShort)}</span>
      ${product.oos ? '<span class="badge badge--oos">Hết hàng</span>' : ''}
    </a>
    <div class="card__body">
      <p class="card__brand">${esc(product.brandName)}</p>
      <h3><a href="${href}">${esc(product.name)}</a></h3>
      <p class="card__meta">${esc(product.weightLabel)}</p>
      <p class="card__price">${esc(priceLabel(product))}</p>
      ${canBuy
        ? `<button type="button" class="btn btn--small" data-add-sku="${esc(product.defaultSku)}">Cho vào giỏ</button>`
        : `<a class="btn btn--small btn--ghost" href="${href}">${product.oos ? 'Hết hàng · Xem' : 'Xem chi tiết'}</a>`}
    </div>
  </article>`;
}

function tierCopy(catalog) {
  const s = catalog.settings;
  const tiers = [...ORDER_TIERS].sort((x, y) => x.min - y.min);
  return `Tiền hàng từ ${vnd(s.freeShip)} được miễn phí giao. ${tiers.map((t) => `Từ ${vnd(t.min)} giảm ${t.pct}%`).join(', ')} — tự trừ trong giỏ. Combo đã có giá riêng nên không giảm thêm, nhưng vẫn được tính vào mức đơn.`;
}

export function homePage(catalog) {
  const byCat = Object.fromEntries(catalog.cats.map((c) => [c.id, { ...c, count: catalog.products.filter((p) => p.cat === c.id).length }]));
  const tiles = PROC.map((id) => byCat[id]).filter(Boolean);
  const picks = [...catalog.products].filter((p) => p.priceFrom > 0 && !p.oos).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'vi')).slice(0, 8);
  const shots = catalog.shelf.map((s, i) => `<button type="button" class="shot" data-shot="${esc(s.src)}" data-cap="${esc(s.cap)}">
      <img src="${esc(s.thumb)}" alt="${esc(s.cap)}" loading="lazy" width="640" height="480">
      <span>${esc(s.cap)}</span>
    </button>`).join('');
  const body = `<main id="main">
  <section class="wrap hero">
    <div class="hero__copy">
      <p class="kicker">Trái cây sấy</p>
      <h1>Chọn theo cách sấy, rồi mới chọn quả.</h1>
      <p class="lead">Cùng một loại quả, túi dẻo với túi thăng hoa ăn khác nhau hẳn. Chúng tôi xếp cửa hàng theo cách làm — dẻo, thăng hoa, giòn, khô — để bạn khỏi lạc giữa hàng chục túi.</p>
      <div class="hero__actions">
        <a class="btn" href="/cua-hang">Vào cửa hàng</a>
        <a class="btn btn--ghost" href="#tren-ke">Xem hàng trên kệ</a>
      </div>
      <form class="find" action="/cua-hang" method="get">
        <label class="sr" for="q">Tìm sản phẩm</label>
        <input id="q" name="q" placeholder="Tìm xoài, sầu riêng, mít…" autocomplete="off">
        <button class="btn" type="submit">Tìm</button>
      </form>
    </div>
    <div class="hero__photo">
      <img src="/assets/products/real/xoai-deo-muoi-ot.webp" alt="Xoài sấy dẻo muối ớt, mở túi, chụp tại xưởng" width="1200" height="900">
      <p class="hero__cap">Ảnh thật, mở túi tại xưởng.</p>
      <a class="hero__inset" href="#tren-ke">
        <img src="/assets/shelf/viza-ke-05.webp" alt="Kệ xoài sấy tại siêu thị" width="800" height="600">
        <span>Trên kệ siêu thị</span>
      </a>
    </div>
  </section>
  <section class="wrap band" aria-label="Bốn cách sấy">
    <div class="band__h">
      <h2>Bốn cách sấy</h2>
      <p>Bấm vào cách bạn muốn ăn. Trong mỗi cách có từng loại quả, rồi tới hãng và khối lượng.</p>
    </div>
    <div class="tiles">
      ${tiles.map((t) => `<a class="tile" href="/cua-hang?cat=${esc(t.id)}">
        <img src="${esc(t.img || '/assets/img/xoai.jpg')}" alt="" width="800" height="800">
        <span class="badge badge--${esc(t.id)}">${esc(t.short)}</span>
        <b>${esc(t.name)}</b>
        <small>${esc(t.desc)}</small>
        <em>${t.count} món</em>
      </a>`).join('')}
    </div>
  </section>
  <section class="wrap">
    <div class="band__h">
      <h2>Hay được hỏi</h2>
      <a href="/cua-hang">Xem tất cả</a>
    </div>
    <div class="grid">${picks.map(productCard).join('')}</div>
  </section>
  <section class="wrap giftband">
    <div>
      <p class="kicker">Ưu đãi theo đơn</p>
      <h2>Đơn càng lớn, giá càng mềm</h2>
      <p>${esc(tierCopy(catalog))}</p>
    </div>
  </section>
  <section class="wrap shelfsec" id="tren-ke">
    <div class="band__h">
      <h2>Hàng trên kệ siêu thị và sân bay</h2>
    </div>
    <p class="lead lead--left">Các dòng trái cây sấy Viza Food được bày tại siêu thị và cửa hàng ở sân bay. Dưới đây là ảnh kệ chúng tôi chụp. Túi gửi tới bạn là đúng loại hàng đó: chính hãng, nguyên bao bì, không san chiết.</p>
    <div class="shots">${shots}</div>
  </section>
  <dialog class="shotbox" id="shotbox">
    <form method="dialog"><button class="shotbox__x" aria-label="Đóng">Đóng</button></form>
    <img alt="" id="shotbox-img">
    <p id="shotbox-cap"></p>
  </dialog>
</main>`;
  return layout({
    title: 'Mộc Quả — trái cây sấy',
    description: 'Cửa hàng trái cây sấy Mộc Quả. Chọn theo cách sấy: dẻo, thăng hoa, giòn, khô.',
    page: 'home',
    body,
    scripts: ['/static/js/home.js'],
  });
}

function shopHref({ cat = '', fruit = '', line = '', q = '', kieu = '' }) {
  const u = new URLSearchParams();
  if (cat) u.set('cat', cat);
  if (fruit) u.set('fruit', fruit);
  if (line) u.set('line', line);
  if (q) u.set('q', q);
  if (kieu === '2') u.set('kieu', '2');
  const s = u.toString();
  return '/cua-hang' + (s ? '?' + s : '');
}

function chip(href, label, on, count) {
  return `<a class="chip${on ? ' is-on' : ''}" href="${href}"${on ? ' aria-current="true"' : ''}>${esc(label)}${count != null ? `<em>${count}</em>` : ''}</a>`;
}

export function shopPage(catalog, query) {
  const q = String(query.q || '').trim().slice(0, 80);
  // Hai kiểu bố cục để chủ shop so sánh: 1 = lưới đều (mặc định), 2 = kiểu tạp chí (?kieu=2). Bộ lọc giữ nguyên kiểu đang xem.
  const kieu = String(query.kieu || '') === '2' ? '2' : '1';
  const link = (o) => shopHref({ ...o, kieu });
  const nq = q ? q.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd') : '';
  let pool = catalog.products;
  if (nq) {
    pool = pool.filter((p) => [p.name, p.brandName, p.fruitName, p.catName, p.catShort, p.short]
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/đ/g, 'd')
      .includes(nq));
  }
  const catIds = [...PROC, ...EXTRA];
  const wantedCat = catIds.includes(query.cat) ? query.cat : '';
  const afterCat = wantedCat ? pool.filter((p) => p.cat === wantedCat) : pool;
  const fruitMap = new Map();
  for (const p of afterCat) if (p.fruit) fruitMap.set(p.fruit, p.fruitName);
  const fruits = [...fruitMap.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  const wantedFruit = fruitMap.has(query.fruit) ? query.fruit : '';
  const afterFruit = wantedFruit ? afterCat.filter((p) => p.fruit === wantedFruit) : afterCat;
  const lineMap = new Map();
  for (const p of afterFruit) {
    const keys = p.lines.length ? p.lines : ['other'];
    for (const key of keys) {
      const name = key === 'mq' ? 'Mộc Quả' : (p.lineNames[p.lines.indexOf(key)] || (key === 'other' ? 'Khác' : p.brandName));
      if (!lineMap.has(key)) lineMap.set(key, name);
    }
  }
  const lines = [...lineMap.entries()].sort((a, b) => brandOrder(a[0]) - brandOrder(b[0]) || a[1].localeCompare(b[1], 'vi'));
  const wantedLine = lineMap.has(query.line) ? query.line : '';
  const final = wantedLine
    ? afterFruit.filter((p) => p.lines.includes(wantedLine) || (wantedLine === 'other' && !p.lines.length) || p.brandKey === wantedLine)
    : afterFruit;

  const catMeta = Object.fromEntries(catalog.cats.map((c) => [c.id, c]));
  const catOrder = [...PROC, ...EXTRA];
  // Mỗi cách sấy là MỘT lưới liền. Trước đây mỗi loại quả là một lưới riêng nên quả chỉ có 1–2 món để lại nửa hàng trống.
  // Trong một cách sấy: món Nổi bật trước, rồi theo quả (quả có món rank tốt nhất lên trước), hãng, rank; combo xếp cuối.
  const featIdx = (p) => { const i = FEATURED.indexOf(p.id); return i < 0 ? 99 : i; };
  const fruitRank = new Map();
  for (const p of final) {
    if (isComboProduct(p)) continue;
    const key = p.cat + '|' + (p.fruit || '');
    fruitRank.set(key, Math.min(fruitRank.get(key) ?? 999, p.rank));
  }
  const fruitKey = (p) => (p.fruit === 'mix' ? 900 : (fruitRank.get(p.cat + '|' + (p.fruit || '')) ?? 950));
  const byCat = new Map();
  for (const p of final) {
    if (!byCat.has(p.cat)) byCat.set(p.cat, []);
    byCat.get(p.cat).push(p);
  }
  const cats = [...byCat.keys()].sort((a, b) => {
    const ia = catOrder.indexOf(a);
    const ib = catOrder.indexOf(b);
    return (ia < 0 ? 20 : ia) - (ib < 0 ? 20 : ib);
  });
  const multiCat = cats.length > 1;
  const filtered = !!(q || wantedCat || wantedFruit || wantedLine);
  // Không lọc: mỗi nhóm có băng tiêu đề kiểu tạp chí, mobile vuốt ngang. Đang lọc: lưới thường.
  const editorial = kieu === '2' && !filtered && multiCat;
  let bandNo = 0;
  let html = '';
  for (const cat of cats) {
    const items = byCat.get(cat).sort((a, b) => featIdx(a) - featIdx(b)
      || isComboProduct(a) - isComboProduct(b)
      || fruitKey(a) - fruitKey(b)
      || a.fruitName.localeCompare(b.fruitName, 'vi')
      || brandOrder(a.brandKey) - brandOrder(b.brandKey)
      || a.rank - b.rank
      || a.name.localeCompare(b.name, 'vi'));
    const name = catMeta[cat]?.name || cat;
    if (editorial && items.length >= BAND_MIN) {
      // Băng tạp chí: tên nhóm + một câu giới thiệu + ảnh 3 món tiêu biểu (ưu tiên ảnh 4:5 dựng sẵn, không lấy combo).
      const pics = [...items.filter((p) => !isComboProduct(p) && cardImage(p).native45), ...items]
        .filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);
      const all = link({ cat });
      html += `<section class="gband gband--${esc(cat)}" id="nhom-${esc(cat)}" aria-labelledby="gh-${esc(cat)}">
      <div class="gband__txt">
        <p class="gband__k">Nhóm ${String(++bandNo).padStart(2, '0')} · ${items.length} món</p>
        <h2 id="gh-${esc(cat)}">${esc(name)}</h2>
        <p class="gband__intro">${esc(CAT_INTRO[cat] || catMeta[cat]?.desc || '')}</p>
        <a class="gband__all" href="${esc(all)}">Xem tất cả ${items.length} món <span aria-hidden="true">→</span></a>
      </div>
      <div class="gband__pics" aria-hidden="true">${pics.map((p) => `<img src="${esc(cardImage(p).src)}" alt="" loading="lazy" decoding="async" width="480" height="600"${cardImage(p).native45 ? '' : ' class="fit"'}>`).join('')}</div>
    </section>
    <div class="grid grid--row">${items.map((p) => productCard(p)).join('')}<a class="rowmore" href="${esc(all)}">Xem tất cả<br><b>${items.length} món</b> <span aria-hidden="true">→</span></a></div>`;
      continue;
    }
    if (multiCat) html += `<h2 class="ghead" id="nhom-${esc(cat)}">${esc(name)} <small>${items.length} món</small></h2>`;
    html += `<div class="grid${editorial ? ' grid--row' : ''}">${items.map((p) => productCard(p)).join('')}</div>`;
  }
  const featured = filtered ? [] : FEATURED.map((id) => final.find((p) => p.id === id)).filter(Boolean);
  const featHtml = featured.length
    ? `<section class="feat" aria-labelledby="feat-h">
      <div class="feat__h"><h2 id="feat-h">Nổi bật</h2><p>Món tiêu biểu của Mộc Quả và hàng hãng bán chạy.</p></div>
      <div class="grid grid--feat${kieu === '2' ? ' bento' : ''}">${featured.map((p, i) => productCard(p, { eager: i < 4, cls: kieu !== '2' ? '' : i === 0 ? 'card--hero' : (i === featured.length - 1 && featured.length === 8 ? 'card--wide' : '') })).join('')}</div>
    </section>`
    : '';
  const tiers = [...ORDER_TIERS].sort((x, y) => x.min - y.min);
  const short = (n) => (n >= 1000000 && n % 1000000 === 0 ? `${n / 1000000} triệu` : n >= 1000 ? `${Math.round(n / 1000)}k` : vnd(n));
  const tierBox = `<ul class="tiers" aria-label="Ưu đãi theo đơn">
      <li><b>Miễn phí giao</b><span>đơn từ ${esc(short(catalog.settings.freeShip))}</span></li>
      ${tiers.map((t) => `<li><b>Giảm ${esc(t.pct)}%</b><span>đơn từ ${esc(short(t.min))}</span></li>`).join('')}
    </ul>`;
  if (!final.length) {
    html = `<div class="empty"><h2>Chưa có món nào khớp.</h2><p>Bỏ bớt bộ lọc, hoặc tìm một tên quả khác.</p><a class="btn" href="/cua-hang">Xem tất cả</a></div>`;
  }

  const procChips = chip(link({ q }), 'Tất cả', !wantedCat, pool.length)
    + catOrder
      .filter((id) => catMeta[id] && pool.some((p) => p.cat === id))
      .map((id) => chip(link({ cat: id, q }), catMeta[id].short, wantedCat === id, pool.filter((p) => p.cat === id).length))
      .join('');
  const fruitChips = chip(link({ cat: wantedCat, q }), 'Tất cả', !wantedFruit, afterCat.length)
    + fruits.map(([id, name]) => chip(
      link({ cat: wantedCat, fruit: id, q }),
      name,
      wantedFruit === id,
      afterCat.filter((p) => p.fruit === id).length,
    )).join('');
  const brandChips = chip(link({ cat: wantedCat, fruit: wantedFruit, q }), 'Tất cả', !wantedLine, afterFruit.length)
    + lines.map(([id, name]) => chip(
      link({ cat: wantedCat, fruit: wantedFruit, line: id, q }),
      name,
      wantedLine === id,
      afterFruit.filter((p) => p.lines.includes(id) || (id === 'other' && !p.lines.length) || p.brandKey === id).length,
    )).join('');

  const title = q
    ? `Tìm “${q}”`
    : (wantedCat ? (catMeta[wantedCat]?.name || 'Cửa hàng') : 'Cửa hàng');
  const sub = wantedCat
    ? (catMeta[wantedCat]?.desc || '')
    : 'Chọn cách sấy, rồi đến quả, rồi đến hãng. Một hãng nhiều khối lượng nằm chung một trang.';

  const body = `<main id="main" class="wrap shop">
    <header class="pagehead">
      <h1>${esc(title)}</h1>
      <nav class="kieu" aria-label="Kiểu bố cục"><a href="${esc(shopHref({ cat: wantedCat, fruit: wantedFruit, line: wantedLine, q }))}"${kieu === '1' ? ' aria-current="true"' : ''}>Kiểu 1 · Lưới đều</a><a href="${esc(shopHref({ cat: wantedCat, fruit: wantedFruit, line: wantedLine, q, kieu: '2' }))}"${kieu === '2' ? ' aria-current="true"' : ''}>Kiểu 2 · Tạp chí</a></nav>
      <p>${esc(sub)}</p>
      ${tierBox}
      <p class="tiers__note">Tự trừ trong giỏ. Combo đã có giá riêng, không giảm thêm nhưng vẫn tính vào mức đơn.</p>
    </header>
    <div class="filters">
      <form class="find find--bar" action="/cua-hang" method="get">
        ${wantedCat ? `<input type="hidden" name="cat" value="${esc(wantedCat)}">` : ''}
        ${kieu === '2' ? '<input type="hidden" name="kieu" value="2">' : ''}
        <label class="sr" for="sq">Tìm trong cửa hàng</label>
        <input id="sq" name="q" value="${esc(q)}" placeholder="Tìm trong cửa hàng" autocomplete="off">
        <button class="btn btn--small" type="submit">Tìm</button>
      </form>
      <div class="chiprow"><span class="chiprow__k">Cách sấy</span><div class="chiprow__s">${procChips}</div></div>
      <div class="chiprow"><span class="chiprow__k">Loại quả</span><div class="chiprow__s">${fruitChips}</div></div>
      <div class="chiprow"><span class="chiprow__k">Hãng</span><div class="chiprow__s">${brandChips}</div></div>
    </div>
    ${featHtml}
    <p class="count">${final.length} món</p>
    ${html}
  </main>`;
  return layout({
    title: `${title} | Mộc Quả`,
    description: sub,
    page: 'shop',
    body,
  });
}

function specTable(rows) {
  if (!rows?.length) return '';
  return `<table class="spec"><tbody>${rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`;
}

export function productPage(product, catalog) {
  const crumbs = `<nav class="crumbs" aria-label="Đường dẫn"><a href="/cua-hang">Cửa hàng</a> <a href="/cua-hang?cat=${esc(product.cat)}">${esc(product.catShort)}</a>${product.fruit ? ` <a href="/cua-hang?cat=${esc(product.cat)}&fruit=${esc(product.fruit)}">${esc(product.fruitName)}</a>` : ''}</nav>`;
  const trust = [
    product.own ? 'Đóng túi Mộc Quả, nhìn rõ quả qua cửa sổ' : 'Nguyên bao bì nhà sản xuất, không san chiết',
    'Đổi trong 7 ngày nếu ẩm, mốc hoặc giao sai',
    `Giao toàn quốc · miễn phí từ ${vnd(catalog.settings.freeShip)}`,
    isComboProduct(product)
      ? 'Combo đã có giá riêng, không giảm thêm — vẫn được tính vào mức giảm của đơn'
      : 'Đơn từ 500.000đ giảm 5%, từ 1.000.000đ giảm 8% (tự trừ trong giỏ)',
  ];
  const sections = [
    product.intro ? `<section><h2>Người bán nói</h2><p>${esc(product.intro)}</p></section>` : '',
    ...(product.sections || []).map((s) => `<section><h2>${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}${s.li ? `<ul>${s.li.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}${specTable(s.spec)}</section>`),
    !product.intro && product.long ? `<section><h2>Mô tả</h2><p>${esc(product.long)}</p></section>` : '',
  ].join('');
  const kem = crossSell(product, catalog);
  const client = {
    id: product.id,
    name: product.name,
    oos: product.oos,
    defaultSku: product.defaultSku,
    packs: product.packs,
    pknote: product.pknote,
    open: product.open,
    shelves: product.shelves || [],
    photos: product.photos || [],
    fit45: product.fit45 || [],
    variants: product.variants.map((v) => ({
      sku: v.sku, w: v.w, g: v.g, price: v.price, pack: v.pack, label: v.label, group: v.group, img: v.img, back: v.back,
    })),
  };
  const body = `<main id="main" class="wrap">
    ${crumbs}
    <article class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__stage">
          <img id="pdp-main"${(product.fit45 || []).includes(product.cardImg) ? ' class="is-45"' : ''} src="${esc(product.cardImg || '')}" alt="${esc(product.name)}" width="900" height="1125">
          <span class="pdp__kind" id="pdp-kind">Bao bì</span>
        </div>
        <div class="pdp__thumbs" id="pdp-thumbs"></div>
      </div>
      <div class="pdp__info">
        <p class="kicker">${esc(product.catName)}${product.flavourName ? ' · ' + esc(product.flavourName) : ''}</p>
        <h1>${esc(product.name)}</h1>
        <p class="brandline">${esc(product.brandName)}${product.makerName && product.makerName !== product.brandName ? ' · ' + esc(product.makerName) : ''}</p>
        <p class="lead lead--left">${esc(product.short)}</p>
        ${product.notice ? `<p class="pdp__notice" role="note">${esc(product.notice)}</p>` : ''}
        <p class="price" id="pdp-price"></p>
        <p class="unit" id="pdp-unit"></p>
        <fieldset class="choiceset">
          <legend>Khối lượng</legend>
          <div class="choices" id="pdp-weights"></div>
        </fieldset>
        <fieldset class="choiceset" id="pdp-pack-wrap" hidden>
          <legend>Mẫu bao bì</legend>
          <div class="swatches" id="pdp-packs"></div>
          ${product.pknote ? `<p class="fine">${esc(product.pknote)}</p>` : '<p class="fine">Cùng khối lượng thì cùng giá, chỉ khác màu túi.</p>'}
        </fieldset>
        <div class="buyrow">
          <label class="qty"><span class="sr">Số lượng</span><input id="pdp-qty" type="number" min="1" max="99" value="1" inputmode="numeric"></label>
          <button class="btn" type="button" id="pdp-add" data-add>${product.oos ? 'Hết hàng đợt này' : 'Cho vào giỏ'}</button>
        </div>
        <ul class="trust">${trust.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
    </article>
    <div class="prose">${sections}</div>
    ${kemBlock(product, kem)}
    <div class="buysticky">
      <div><b id="pdp-sticky-price"></b><span id="pdp-sticky-label"></span></div>
      <button class="btn" type="button" id="pdp-add-2" data-add>${product.oos ? 'Hết hàng' : 'Cho vào giỏ'}</button>
    </div>
    ${jsonScript('product-data', client)}
  </main>`;
  return layout({
    title: `${product.name} | Mộc Quả`,
    description: product.short || product.name,
    page: 'product',
    body,
    scripts: ['/static/js/product.js'],
  });
}

export function cartPage() {
  const body = `<main id="main" class="wrap narrow">
    <h1>Giỏ hàng</h1>
    <div id="cart-body"><p>Đang mở giỏ…</p></div>
  </main>`;
  return layout({
    title: 'Giỏ hàng | Mộc Quả',
    description: 'Giỏ hàng Mộc Quả.',
    page: 'cart',
    body,
    scripts: ['/static/js/cart.js'],
  });
}

function stkCard(bank) {
  if (!bank.ready) return '';
  return `<div class="stkcard">
    <p class="stk__bank">${esc(bank.bankName || 'Ngân hàng')}</p>
    <p class="stk__no">${esc(bank.accountNo)}</p>
    <p class="stk__name">${esc(bank.accountName)}</p>
    <p class="fine">Số này để bạn biết trước. Mã QR đúng số tiền nằm ở trang sau.</p>
  </div>`;
}

export function checkoutPage(catalog) {
  const provinces = catalog.provinces.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  const bank = bankConfig();
  const bankLine = bank.ready
    ? 'Mã QR hiện ngay sau khi đặt, đúng số tiền. Nội dung là mã đơn — giữ nguyên.'
    : 'Shop chưa gắn tài khoản nhận tiền. Bạn vẫn đặt được; shop gửi số tài khoản sau.';
  const cod = catalog.settings.codEnabled
    ? `<label class="radio"><input type="radio" name="pay" value="cod"><span><b>Trả khi nhận hàng</b><small>Shipper thu tiền mặt. Shop gọi xác nhận trước khi gửi.</small></span></label>`
    : '';
  const body = `<main id="main" class="wrap narrow page-checkout">
    <p class="kicker">Một bước</p>
    <h1>Đặt hàng</h1>
    <form id="co-form" novalidate>
      <section>
        <h2>Người nhận</h2>
        <div class="fields">
          <label class="field">Họ tên <input name="name" required autocomplete="name" maxlength="80"></label>
          <label class="field">Điện thoại <input name="phone" required autocomplete="tel" inputmode="tel" placeholder="09xxxxxxxx" maxlength="15"></label>
          <label class="field">Tỉnh thành
            <select name="province" required>
              <option value="">Chọn tỉnh thành</option>
              ${provinces}
            </select>
          </label>
          <label class="field">Phường xã <input name="ward" autocomplete="address-level3" maxlength="80"></label>
          <label class="field">Địa chỉ <input name="address" required autocomplete="street-address" maxlength="180" placeholder="Số nhà, đường"></label>
          <label class="field">Ghi chú <textarea name="note" rows="3" maxlength="400" placeholder="Giờ nhận, lời nhắn trên thiệp…"></textarea></label>
        </div>
      </section>
      <section>
        <h2>Thanh toán</h2>
        <div class="radios">
          <label class="radio"><input type="radio" name="pay" value="vietqr" checked><span><b>Chuyển khoản</b><small>${bankLine}</small></span></label>
          ${stkCard(bank)}
          ${cod}
        </div>
      </section>
      <section>
        <h2>Đơn của bạn</h2>
        <div id="co-summary"><p>Đang tính tiền…</p></div>
      </section>
      <p class="formerr" id="co-err" role="alert"></p>
      <div class="paybar">
        <p class="paybar__due"><span>Cần trả</span><b id="co-due">…</b></p>
        <button class="btn" type="submit" id="co-submit">Đặt và hiện mã QR</button>
      </div>
    </form>
  </main>`;
  return layout({
    title: 'Đặt hàng | Mộc Quả',
    description: 'Đặt hàng trái cây sấy Mộc Quả.',
    page: 'checkout',
    body,
    scripts: ['/static/js/checkout.js'],
  });
}

const STATUS_LABEL = Object.fromEntries(STATUSES);

function customerStatus(order) {
  if (order.payMethod === 'cod' && order.status === 'da_nhan') return 'Trả khi nhận hàng';
  const labels = {
    cho_ck: 'Chờ chuyển khoản',
    da_nhan: 'Đã nhận tiền',
    dang_giao: 'Đang giao',
    xong: 'Đã giao',
  };
  return labels[order.status] || STATUS_LABEL[order.status] || order.status;
}

function copyButton(value, label) {
  return `<button type="button" class="btn btn--small btn--ghost" data-copy="${esc(value)}">${esc(label)}</button>`;
}

export function orderPage(order, qr) {
  const lines = order.items.map((item) => `<li><span><b>${esc(item.name)}</b><small>${esc(item.w)} · × ${item.qty}</small></span><b>${vnd(item.line)}</b></li>`).join('');
  const gifts = (order.gifts || []).map((g) => `<li class="giftline"><span><b>${esc(g.name)}</b><small>${esc(g.w)} · × ${g.qty}${g.retail ? ' · giá bán ' + vnd(g.retail) : ''}</small></span><b>0đ</b></li>`).join('');
  const due = `<p class="due"><span>Cần trả</span><b data-amount="${order.summary.total}">${vnd(order.summary.total)}</b></p>`;
  let pay = '';
  if (order.payMethod === 'cod') {
    pay = `<section class="paybox"><h2>Trả khi nhận hàng</h2><p>Bạn không cần chuyển khoản. Shop gọi xác nhận rồi gửi hàng, shipper thu ${vnd(order.summary.total)}.</p></section>`;
  } else if (qr.ready) {
    const bankLabel = qr.bankName || `Ngân hàng BIN ${qr.bin}`;
    pay = `<section class="paybox">
      <h2>Chuyển khoản</h2>
      <ol class="paysteps">
        <li>Quét mã bằng app ngân hàng.</li>
        <li>Kiểm tra số tiền và nội dung. Giữ nguyên nội dung.</li>
        <li>Giữ trang này. Shop đối soát theo mã đơn.</li>
      </ol>
      ${due}
      <div class="paybox__grid">
        <div class="qr"><img src="${esc(qr.url)}" alt="Mã VietQR ${esc(vnd(order.summary.total))}, nội dung ${esc(order.code)}" width="360" height="360"></div>
        <div class="stkcard">
          <p class="fine">Ngân hàng</p>
          <p class="stk__bank">${esc(bankLabel)}</p>
          <p class="fine">Số tài khoản</p>
          <p class="stk__no">${esc(qr.accountNo)}</p>
          ${copyButton(qr.accountNo, 'Chép số tài khoản')}
          <p class="fine">Chủ tài khoản</p>
          <p class="stk__name">${esc(qr.accountName)}</p>
          <p class="fine">Nội dung chuyển khoản</p>
          <p class="stk__code"><code>${esc(order.code)}</code></p>
          ${copyButton(order.code, 'Chép nội dung')}
          ${copyButton(String(order.summary.total), 'Chép số tiền')}
        </div>
      </div>
      <p class="fine">Biên lai gửi shop khi cần. Chưa có chỗ tải ảnh lên web.</p>
    </section>`;
  } else {
    pay = `<section class="paybox">
      <h2>Chờ số tài khoản</h2>
      <p>Đơn đã ghi. Shop chưa gắn tài khoản trên web, nên mã QR chưa hiện. Giữ mã đơn và số tiền — khi shop gửi số, chuyển đúng nội dung là mã đơn.</p>
      ${due}
      <div class="stkcard">
        <p class="fine">Nội dung chuyển khoản</p>
        <p class="stk__code"><code>${esc(order.code)}</code></p>
        ${copyButton(order.code, 'Chép nội dung')}
      </div>
    </section>`;
  }
  const body = `<main id="main" class="wrap narrow">
    <p class="status status--${esc(order.status)}">${esc(customerStatus(order))}</p>
    <h1>Đơn ${esc(order.code)}</h1>
    <p class="lead lead--left">Cảm ơn ${esc(order.customer.name)}.</p>
    ${order.payMethod === 'cod' ? due : ''}
    ${pay}
    <section>
      <h2>Trong đơn</h2>
      <ul class="lines">${lines}${gifts}</ul>
      <p class="sumrow"><span>Tiền hàng</span><b>${vnd(order.summary.subtotal)}</b></p>
      ${order.summary.discount ? `<p class="sumrow sumrow--discount"><span>Giảm ${order.summary.discountPct ? order.summary.discountPct + '% ' : ''}theo đơn<small> (không áp cho combo)</small></span><b>−${vnd(order.summary.discount)}</b></p>` : ''}
      <p class="sumrow"><span>Giao hàng</span><b>${order.summary.ship ? vnd(order.summary.ship) : 'Miễn phí'}</b></p>
      <p class="sumrow sumrow--total"><span>Tổng</span><b>${vnd(order.summary.total)}</b></p>
    </section>
    <section>
      <h2>Giao tới</h2>
      <p>${esc(order.customer.name)} · ${esc(order.customer.phone)}<br>${esc([order.customer.address, order.customer.ward, order.customer.province].filter(Boolean).join(', '))}</p>
      ${order.note ? `<p class="fine">Ghi chú: ${esc(order.note)}</p>` : ''}
    </section>
    <p><a class="btn btn--ghost" href="/cua-hang">Tiếp tục xem hàng</a></p>
  </main>`;
  return layout({
    title: `Đơn ${order.code} | Mộc Quả`,
    description: `Đơn hàng ${order.code} tại Mộc Quả.`,
    page: 'order',
    body,
    scripts: ['/static/js/order.js'],
  });
}

export function trackPage(message = '') {
  const body = `<main id="main" class="wrap narrow">
    <h1>Tra cứu đơn</h1>
    <p class="lead lead--left">Điền mã đơn shop gửi sau khi đặt, dạng MQ251024-AB12CD.</p>
    <form class="find" action="/tra-cuu" method="get">
      <label class="sr" for="code">Mã đơn</label>
      <input id="code" name="code" required placeholder="MQ…" autocapitalize="characters">
      <button class="btn" type="submit">Xem đơn</button>
    </form>
    ${message ? `<p class="formerr">${esc(message)}</p>` : ''}
  </main>`;
  return layout({
    title: 'Tra cứu đơn | Mộc Quả',
    description: 'Tra cứu đơn hàng Mộc Quả.',
    page: 'track',
    body,
  });
}

export function adminPage() {
  const body = `<main id="main" class="wrap admin">
    <section id="login-panel">
      <p class="kicker">Chủ shop</p>
      <h1>Quản lý đơn</h1>
      <p class="lead lead--left">Mật khẩu đặt trong biến môi trường ADMIN_PASSWORD trên máy chủ, không lưu trong trình duyệt của khách.</p>
      <form id="login-form" class="fields">
        <label class="field">Mật khẩu <input type="password" name="password" required autocomplete="current-password"></label>
        <button class="btn" type="submit">Vào</button>
        <p class="formerr" id="login-err" role="alert"></p>
      </form>
    </section>
    <section id="dash" hidden>
      <div class="dashhead">
        <h1>Đơn và giá</h1>
        <button class="btn btn--ghost btn--small" type="button" id="logout">Thoát</button>
      </div>
      <p class="notice" id="bank-warn" hidden>Chưa cấu hình BANK_BIN, ACCOUNT_NO, ACCOUNT_NAME. Khách đặt chuyển khoản vẫn có mã đơn và số tiền, nhưng chưa thấy QR.</p>
      <section class="backup">
        <h2>Bản sao đơn</h2>
        <p class="fine" id="backup-note">Gói miễn phí không giữ file. Sau mỗi đợt đơn, và trước khi deploy, xuất JSON rồi cất trên máy. Danh sách bên dưới là 200 đơn mới. File xuất gồm mọi đơn.</p>
        <div class="backup-actions">
          <a class="btn btn--small" href="/api/admin/backup.json">Xuất tất cả (JSON)</a>
          <a class="btn btn--small btn--ghost" href="/api/admin/backup.csv">Xuất đơn (CSV)</a>
        </div>
        <p class="fine">JSON để nhập lại. CSV chỉ để mở bằng Excel.</p>
        <details>
          <summary>Nhập lại từ file JSON</summary>
          <form id="restore-form" class="fields">
            <label class="field">File JSON đã xuất <input type="file" name="file" accept="application/json,.json" required></label>
            <label class="check"><input type="radio" name="mode" value="merge" checked> Thêm đơn còn thiếu</label>
            <label class="check"><input type="radio" name="mode" value="replace"> Thay toàn bộ đơn bằng file</label>
            <label class="check" id="replace-confirm" hidden><input type="checkbox" name="confirm"> Tôi hiểu: đơn hiện tại sẽ bị xoá và thay bằng file này.</label>
            <label class="check"><input type="checkbox" name="restoreShop"> Khôi phục luôn giá đã sửa và cài đặt giao hàng trong file</label>
            <button class="btn btn--small" type="submit">Nhập bản sao</button>
            <p class="fine" id="restore-msg" role="status"></p>
          </form>
        </details>
      </section>
      <div class="tabs" role="tablist">
        <button type="button" data-tab="orders" class="is-on">Đơn hàng</button>
        <button type="button" data-tab="prices">Giá bán</button>
        <button type="button" data-tab="promo">Giao hàng &amp; ưu đãi</button>
        <button type="button" data-tab="refs">So sánh giá</button>
        <button type="button" data-tab="catalog">Danh mục</button>
      </div>
      <div id="panel-orders"></div>
      <div id="panel-prices" hidden></div>
      <div id="panel-promo" hidden></div>
      <div id="panel-refs" hidden></div>
      <div id="panel-catalog" hidden></div>
    </section>
  </main>`;
  return layout({
    title: 'Quản lý | Mộc Quả',
    description: 'Trang quản trị Mộc Quả.',
    page: 'admin',
    body,
    scripts: ['/static/js/admin.js'],
  });
}

export function comparePage(rows) {
  const brands = new Set(rows.map((r) => r.brand)).size;
  const priced = rows.filter((r) => r.price != null && r.weightG).length;
  const dates = rows.map((r) => r.checkedAt).filter(Boolean).sort();
  const last = dates.length ? dates[dates.length - 1].split('-').reverse().join('/') : '';
  const body = `<main id="main" class="cmp">
    <section class="cmp-hero">
      <div class="wrap">
        <p class="cmp-kicker">Bảng tham chiếu giá</p>
        <h1>Thương hiệu → Nhãn → Khối lượng</h1>
        <p class="cmp-lead">${esc(brands)} thương hiệu · ${esc(rows.length)} quy cách · ${esc(priced)} có giá${last ? ` · kiểm ${esc(last)}` : ''}. Giá là giá niêm yết trên trang nguồn. Mỗi ô có link và ngày xem.</p>
        <p class="cmp-warn">Khối lượng Mộc Quả là <b>ước lượng</b> theo kích thước hũ, chưa cân thật.</p>
      </div>
    </section>
    <section class="wrap cmp-body">
      <div class="cmp-filters" id="cmp-filters" aria-label="Bộ lọc"></div>
      <p class="cmp-count" id="cmp-count" role="status"></p>
      <div id="cmp-tree" class="cmp-tree"><p class="fine">Đang tải bảng…</p></div>
    </section>
    <div class="cmp-tray" id="cmp-tray" hidden>
      <div class="wrap cmp-tray__in">
        <div class="cmp-tray__items" id="cmp-tray-items"></div>
        <button type="button" class="cmp-btn" id="cmp-open">So sánh</button>
        <button type="button" class="cmp-btn cmp-btn--ghost" id="cmp-clear" aria-label="Bỏ chọn tất cả">Bỏ</button>
      </div>
    </div>
    <dialog class="cmp-dialog" id="cmp-dialog" aria-labelledby="cmp-dialog-title">
      <div class="cmp-dialog__head">
        <h2 id="cmp-dialog-title">So sánh giá / 100g</h2>
        <button type="button" class="cmp-btn cmp-btn--ghost" id="cmp-close">Đóng</button>
      </div>
      <div id="cmp-table"></div>
    </dialog>
    ${jsonScript('price-refs-data', rows)}
  </main>`;
  return layout({
    title: 'So sánh giá theo thương hiệu | Mộc Quả',
    description: 'Bảng so sánh giá trái cây sấy, hạt theo thương hiệu, nhãn và khối lượng.',
    page: 'compare',
    body,
    scripts: ['/static/js/compare.js'],
  });
}

export function catalogPage(data) {
  const variants = data.products.flatMap((p) => p.variants);
  const own = data.products.filter((p) => data.brands.find((b) => b.id === p.brand)?.kind === 'own').length;
  const verify = data.products.filter((p) => p.verify || p.variants.some((v) => v.verify)).length;
  const labels = new Set(data.products.map((p) => p.label)).size;
  const body = `<main id="main" class="dm">
    <section class="dm-hero">
      <div class="wrap dm-hero__in">
        <div>
          <p class="dm-kicker">Danh mục tra cứu</p>
          <h1>Thương hiệu <i>→</i> Nhãn <i>→</i> Sản phẩm <i>→</i> Khối lượng</h1>
          <p class="dm-slogan">Quả của đất · Quà của tình</p>
        </div>
        <dl class="dm-stats">
          <div><dt>Sản phẩm</dt><dd>${esc(data.products.length)}</dd></div>
          <div><dt>Mã khối lượng</dt><dd>${esc(variants.length)}</dd></div>
          <div><dt>Nhãn</dt><dd>${esc(labels)}</dd></div>
          <div><dt>Mộc Quả</dt><dd>${esc(own)}</dd></div>
          <div class="is-warn"><dt>Cần kiểm tra</dt><dd>${esc(verify)}</dd></div>
        </dl>
      </div>
    </section>
    <section class="dm-bar" aria-label="Tìm và lọc">
      <div class="wrap">
        <div class="dm-bar__row">
          <label class="dm-search"><span class="sr">Tìm sản phẩm</span>
            <input id="dm-q" type="search" placeholder="Tìm tên, nhãn hoặc mã (vd: xoài, VZ-GG, 100g)" autocomplete="off">
          </label>
          <div class="dm-view" role="tablist" aria-label="Kiểu xem">
            <button type="button" role="tab" data-view="grid" class="is-on" aria-selected="true">Danh mục</button>
            <button type="button" role="tab" data-view="compare" aria-selected="false">So sánh</button>
          </div>
        </div>
        <div class="dm-chips" id="dm-brand" aria-label="Thương hiệu"></div>
        <div class="dm-chips" id="dm-cat" aria-label="Nhóm sản phẩm"></div>
        <div class="dm-chips dm-chips--labels" id="dm-label" aria-label="Nhãn"></div>
      </div>
    </section>
    <section class="wrap dm-body">
      <p class="dm-count" id="dm-count" role="status"></p>
      <div id="dm-grid"><p class="fine">Đang tải danh mục…</p></div>
      <div id="dm-compare" hidden></div>
      <section class="dm-gallery" id="dm-gallery" aria-labelledby="dm-gallery-title"></section>
      <p class="dm-foot">Nút “Thêm vào giỏ” dùng giá bán ở cửa hàng và giỏ hàng chung; mã hiện “Liên hệ” chưa bán online (chưa có giá hoặc chưa có trong cửa hàng), nhắn Zalo để hỏi. Không ghi giá khuyến mãi trên tem. Giá thị trường chỉ so với các hãng bên ngoài như dacsancaocap; Viza Food là đối tác phân phối độc quyền của Mộc Quả, không phải đối thủ. Mã: ${esc(data.codeScheme)}</p>
    </section>
    <dialog class="dm-lb" id="dm-lb" aria-labelledby="dm-lb-title">
      <div class="dm-lb__head"><div><small id="dm-lb-sub"></small><h2 id="dm-lb-title"></h2></div><span class="dm-lb__count" id="dm-lb-count" aria-live="polite"></span><button type="button" class="dm-lb__x" id="dm-lb-x">Đóng</button></div>
      <div class="dm-lb__stage">
        <div class="dm-lb__track" id="dm-lb-track" tabindex="0" aria-label="Ảnh sản phẩm, vuốt ngang để xem tiếp"></div>
        <button type="button" class="dm-lb__nav dm-lb__nav--prev" id="dm-lb-prev" aria-label="Ảnh trước">‹</button>
        <button type="button" class="dm-lb__nav dm-lb__nav--next" id="dm-lb-next" aria-label="Ảnh sau">›</button>
      </div>
      <p class="dm-lb__cap" id="dm-lb-cap"></p>
      <div class="dm-lb__thumbs" id="dm-lb-thumbs"></div>
    </dialog>
    ${jsonScript('dm-data', { ...data, contact: `https://zalo.me/${shopContact.phones[0]?.tel || ''}` })}
  </main>`;
  return layout({
    title: 'Danh mục tra cứu | Mộc Quả',
    description: 'Tra cứu sản phẩm Mộc Quả và Viza Food (Mộc Quả là đối tác phân phối độc quyền) theo thương hiệu, nhãn, sản phẩm, khối lượng.',
    page: 'catalog',
    body,
    scripts: ['/static/js/danh-muc.js'],
    styles: ['/static/css/danh-muc.css'],
  });
}

export function offlinePage() {
  const body = `<main id="main" class="wrap narrow">
    <p class="kicker">Mộc Quả</p>
    <h1>Đang không có mạng</h1>
    <p class="lead lead--left">Giỏ vẫn nằm trên máy. Khi có mạng, mở lại cửa hàng để tính tiền và đặt. Mã chuyển khoản cần mạng.</p>
    <p><a class="btn" href="/">Thử lại</a></p>
  </main>`;
  return layout({
    title: 'Không có mạng | Mộc Quả',
    description: 'Mộc Quả cần mạng để đặt hàng.',
    page: 'offline',
    body,
  });
}

export function errorPage(message, status = 404) {
  const body = `<main id="main" class="wrap narrow">
    <h1>${status === 404 ? 'Không thấy trang' : 'Có lỗi'}</h1>
    <p class="lead lead--left">${esc(message)}</p>
    <p><a class="btn" href="/">Về trang chủ</a></p>
  </main>`;
  return layout({
    title: 'Mộc Quả',
    description: message,
    page: 'error',
    body,
  });
}

export { bankConfig };
