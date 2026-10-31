import { esc, vnd } from './format.js';
import { brandOrder } from './catalog.js';
import { STATUSES } from './db.js';
import { shopContact } from './contact.js';
import { bankConfig } from './vietqr.js';

const PROC = ['deo', 'thanghoa', 'gion', 'kho'];
const EXTRA = ['omai', 'set', 'hat'];

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

function header(page) {
  return `<header class="top">
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

export function productCard(product) {
  const href = `/san-pham/${encodeURIComponent(product.id)}`;
  const img = product.cardImg || '/assets/img/xoai.jpg';
  const canBuy = product.defaultSku && product.priceFrom > 0 && !product.oos;
  return `<article class="card">
    <a class="card__img" href="${href}">
      <img src="${esc(img)}" alt="${esc(product.name)}" loading="lazy" width="800" height="800">
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
        : `<a class="textlink" href="${href}">${product.oos ? 'Xem hàng' : 'Xem chi tiết'}</a>`}
    </div>
  </article>`;
}

function giftCopy(catalog) {
  const s = catalog.settings;
  const retail = catalog.giftRetail ? ` Gói đó bán lẻ ${vnd(catalog.giftRetail)}.` : '';
  return `Đơn từ ${vnd(s.giftMin)}, hoặc mua ${s.giftPair} túi xoài từ ${s.giftMinG}g, được tặng gói nhỏ xoài muối ớt. Hai cách không cộng dồn, lấy mức nhiều hơn, tối đa ${s.giftMax} gói.${retail}`;
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
      <p class="kicker">Quà kèm</p>
      <h2>Gói nhỏ xoài muối ớt, tính 0đ</h2>
      <p>${esc(giftCopy(catalog))}</p>
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

function shopHref({ cat = '', fruit = '', line = '', q = '' }) {
  const u = new URLSearchParams();
  if (cat) u.set('cat', cat);
  if (fruit) u.set('fruit', fruit);
  if (line) u.set('line', line);
  if (q) u.set('q', q);
  const s = u.toString();
  return '/cua-hang' + (s ? '?' + s : '');
}

function chip(href, label, on, count) {
  return `<a class="chip${on ? ' is-on' : ''}" href="${href}"${on ? ' aria-current="true"' : ''}>${esc(label)}${count != null ? `<em>${count}</em>` : ''}</a>`;
}

export function shopPage(catalog, query) {
  const q = String(query.q || '').trim().slice(0, 80);
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
  const groups = [];
  const grouped = new Map();
  for (const p of final) {
    const key = p.cat + '|' + (p.fruit || '');
    if (!grouped.has(key)) {
      const g = { cat: p.cat, fruit: p.fruit, fruitName: p.fruitName, items: [] };
      grouped.set(key, g);
      groups.push(g);
    }
    grouped.get(key).items.push(p);
  }
  const catOrder = [...PROC, ...EXTRA];
  groups.sort((a, b) => {
    const ia = catOrder.indexOf(a.cat);
    const ib = catOrder.indexOf(b.cat);
    return (ia < 0 ? 20 : ia) - (ib < 0 ? 20 : ib) || a.fruitName.localeCompare(b.fruitName, 'vi');
  });
  for (const g of groups) {
    g.items.sort((a, b) => brandOrder(a.brandKey) - brandOrder(b.brandKey) || a.rank - b.rank || a.name.localeCompare(b.name, 'vi'));
  }
  const multiCat = new Set(final.map((p) => p.cat)).size > 1;
  let html = '';
  let lastCat = '';
  for (const g of groups) {
    if (multiCat && g.cat !== lastCat) {
      html += `<h2 class="ghead">${esc(catMeta[g.cat]?.name || g.cat)} <small>${final.filter((p) => p.cat === g.cat).length} món</small></h2>`;
      lastCat = g.cat;
    }
    if (g.fruitName && !wantedFruit) html += `<h3 class="fhead">${esc(g.fruitName)}</h3>`;
    html += `<div class="grid">${g.items.map(productCard).join('')}</div>`;
  }
  if (!final.length) {
    html = `<div class="empty"><h2>Chưa có món nào khớp.</h2><p>Bỏ bớt bộ lọc, hoặc tìm một tên quả khác.</p><a class="btn" href="/cua-hang">Xem tất cả</a></div>`;
  }

  const procChips = chip(shopHref({ q }), 'Tất cả', !wantedCat, pool.length)
    + catOrder
      .filter((id) => catMeta[id] && pool.some((p) => p.cat === id))
      .map((id) => chip(shopHref({ cat: id, q }), catMeta[id].short, wantedCat === id, pool.filter((p) => p.cat === id).length))
      .join('');
  const fruitChips = chip(shopHref({ cat: wantedCat, q }), 'Tất cả', !wantedFruit, afterCat.length)
    + fruits.map(([id, name]) => chip(
      shopHref({ cat: wantedCat, fruit: id, q }),
      name,
      wantedFruit === id,
      afterCat.filter((p) => p.fruit === id).length,
    )).join('');
  const brandChips = chip(shopHref({ cat: wantedCat, fruit: wantedFruit, q }), 'Tất cả', !wantedLine, afterFruit.length)
    + lines.map(([id, name]) => chip(
      shopHref({ cat: wantedCat, fruit: wantedFruit, line: id, q }),
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
      <p>${esc(sub)}</p>
    </header>
    <div class="filters">
      <form class="find find--bar" action="/cua-hang" method="get">
        ${wantedCat ? `<input type="hidden" name="cat" value="${esc(wantedCat)}">` : ''}
        <label class="sr" for="sq">Tìm trong cửa hàng</label>
        <input id="sq" name="q" value="${esc(q)}" placeholder="Tìm trong cửa hàng" autocomplete="off">
        <button class="btn btn--small" type="submit">Tìm</button>
      </form>
      <div class="chiprow"><span class="chiprow__k">Cách sấy</span><div class="chiprow__s">${procChips}</div></div>
      <div class="chiprow"><span class="chiprow__k">Loại quả</span><div class="chiprow__s">${fruitChips}</div></div>
      <div class="chiprow"><span class="chiprow__k">Hãng</span><div class="chiprow__s">${brandChips}</div></div>
    </div>
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
    product.fruit === 'xoai'
      ? `Túi từ ${catalog.settings.giftMinG}g: mua ${catalog.settings.giftPair} túi tặng gói nhỏ xoài muối ớt`
      : giftCopy(catalog),
  ];
  const sections = [
    product.intro ? `<section><h2>Người bán nói</h2><p>${esc(product.intro)}</p></section>` : '',
    ...(product.sections || []).map((s) => `<section><h2>${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}${s.li ? `<ul>${s.li.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}${specTable(s.spec)}</section>`),
    !product.intro && product.long ? `<section><h2>Mô tả</h2><p>${esc(product.long)}</p></section>` : '',
  ].join('');
  const picked = (product.related || []).map((id) => catalog.products.find((p) => p.id === id && p.priceFrom > 0)).filter(Boolean);
  const related = [...picked, ...catalog.products
    .filter((p) => p.id !== product.id && p.priceFrom > 0 && !picked.includes(p))
    .sort((a, b) => (b.fruit === product.fruit) - (a.fruit === product.fruit) || (b.cat === product.cat) - (a.cat === product.cat) || a.rank - b.rank)]
    .slice(0, 4);
  const client = {
    id: product.id,
    name: product.name,
    oos: product.oos,
    defaultSku: product.defaultSku,
    packs: product.packs,
    pknote: product.pknote,
    open: product.open,
    shelf: product.shelf,
    variants: product.variants.map((v) => ({
      sku: v.sku, w: v.w, g: v.g, price: v.price, pack: v.pack, label: v.label, group: v.group, img: v.img, back: v.back,
    })),
  };
  const body = `<main id="main" class="wrap">
    ${crumbs}
    <article class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__stage">
          <img id="pdp-main" src="${esc(product.cardImg || '')}" alt="${esc(product.name)}" width="900" height="1125">
          <span class="pdp__kind" id="pdp-kind">Bao bì</span>
        </div>
        <div class="pdp__thumbs" id="pdp-thumbs"></div>
      </div>
      <div class="pdp__info">
        <p class="kicker">${esc(product.catName)}${product.flavourName ? ' · ' + esc(product.flavourName) : ''}</p>
        <h1>${esc(product.name)}</h1>
        <p class="brandline">${esc(product.brandName)}${product.makerName && product.makerName !== product.brandName ? ' · ' + esc(product.makerName) : ''}</p>
        <p class="lead lead--left">${esc(product.short)}</p>
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
    ${related.length ? `<section class="related"><h2>${picked.length ? 'Thường mua kèm' : 'Cùng kệ'}</h2>${product.relatedNote ? `<p class="lead lead--left">${esc(product.relatedNote)}</p>` : ''}<div class="grid">${related.map(productCard).join('')}</div></section>` : ''}
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
      <p class="sumrow"><span>Giao hàng</span><b>${order.summary.ship ? vnd(order.summary.ship) : 'Miễn phí'}</b></p>
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
            <label class="check"><input type="checkbox" name="restoreShop"> Khôi phục luôn giá đã sửa và mức quà trong file</label>
            <button class="btn btn--small" type="submit">Nhập bản sao</button>
            <p class="fine" id="restore-msg" role="status"></p>
          </form>
        </details>
      </section>
      <div class="tabs" role="tablist">
        <button type="button" data-tab="orders" class="is-on">Đơn hàng</button>
        <button type="button" data-tab="prices">Giá bán</button>
        <button type="button" data-tab="promo">Quà tặng</button>
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
      <p class="dm-foot">Viza Food (Công ty CP Viza Food) chỉ để tham khảo, không bán tại Mộc Quả. Không ghi giá khuyến mãi trên tem. Giá đối thủ sẽ so chủ yếu với các trang dacsancaocap. Mã: ${esc(data.codeScheme)}</p>
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
    ${jsonScript('dm-data', data)}
  </main>`;
  return layout({
    title: 'Danh mục tra cứu | Mộc Quả',
    description: 'Tra cứu sản phẩm Mộc Quả và nhãn tham khảo theo thương hiệu, nhãn, sản phẩm, khối lượng.',
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
