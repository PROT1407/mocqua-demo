// Danh mục tra cứu: lọc, tìm, xem lưới theo Thương hiệu → Nhãn, và bảng so sánh cùng loại, cùng khối lượng.
import { add, refresh, toast } from './store.js';
const data = JSON.parse(document.querySelector('#dm-data').textContent);
const $ = (s) => document.querySelector(s);
const brands = new Map(data.brands.map((b) => [b.id, b]));
const cats = new Map(data.categories.map((c) => [c.id, c]));
const labelRank = new Map(data.labels.map((l, i) => [l, i]));
const state = { q: '', brand: 'all', cat: 'all', label: 'all', view: 'grid', onlyVerify: false, type: '', weight: 'all' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
const money = (n) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const dateVi = (d) => (d ? d.split('-').reverse().join('/') : '');
const needsCheck = (p) => p.verify || p.variants.some((v) => v.verify);
const isOwn = (p) => brands.get(p.brand)?.kind === 'own';
const KIND = { hero: 'Ảnh chính', 'nen-trang': 'Nền trắng', 'nen-den': 'Nền đen', 'thuc-te': 'Ảnh thực tế', 'lo-hang': 'Lô hàng', 'phoi-canh': 'Phối cảnh', 'dia-trung-bay': 'Đĩa trưng bày', 'mau-bao-bi-2': 'Mẫu bao bì khác', 'mat-sau': 'Mặt sau (thông tin)', combo: 'Combo:', phu: 'Ảnh phụ' };
const thumbOf = (im) => im.thumb || im.src;

function readUrl() {
  const u = new URLSearchParams(location.search);
  for (const k of ['q', 'brand', 'cat', 'label', 'view', 'type', 'weight']) if (u.get(k)) state[k] = u.get(k);
  state.onlyVerify = u.get('kiem') === '1';
  $('#dm-q').value = state.q;
}
function writeUrl() {
  const u = new URLSearchParams();
  if (state.q) u.set('q', state.q);
  for (const k of ['brand', 'cat', 'label', 'weight']) if (state[k] !== 'all') u.set(k, state[k]);
  if (state.view !== 'grid') u.set('view', state.view);
  if (state.view === 'compare' && state.type) u.set('type', state.type);
  if (state.onlyVerify) u.set('kiem', '1');
  history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
}

function matches(p, { skip = '' } = {}) {
  if (skip !== 'brand' && state.brand !== 'all' && p.brand !== state.brand) return false;
  if (skip !== 'cat' && state.cat !== 'all' && p.cat !== state.cat) return false;
  if (skip !== 'label' && state.label !== 'all' && p.label !== state.label) return false;
  if (state.onlyVerify && !needsCheck(p)) return false;
  if (state.q) {
    const hay = norm([p.name, p.label, brands.get(p.brand)?.name, cats.get(p.cat)?.name, data.types[p.type], p.pack,
      ...p.variants.flatMap((v) => [v.code, v.weightLabel])].join(' '));
    if (!norm(state.q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function chip(group, value, text, count, on) {
  return `<button type="button" class="dm-chip${on ? ' is-on' : ''}" data-${group}="${esc(value)}" aria-pressed="${on}"${count === 0 && !on ? ' disabled' : ''}>${esc(text)}${count != null ? ` <span>${count}</span>` : ''}</button>`;
}

function renderChips() {
  const byBrand = (id) => data.products.filter((p) => (id === 'all' || p.brand === id) && matches(p, { skip: 'brand' })).length;
  $('#dm-brand').innerHTML = `<span class="dm-chips__k">Thương hiệu</span>` + chip('brand', 'all', 'Tất cả', byBrand('all'), state.brand === 'all')
    + data.brands.map((b) => chip('brand', b.id, b.kind === 'own' ? `${b.name} ★` : `${b.name} · tham khảo`, byBrand(b.id), state.brand === b.id)).join('')
    + `<button type="button" class="dm-chip dm-chip--warn${state.onlyVerify ? ' is-on' : ''}" data-verify aria-pressed="${state.onlyVerify}">Cần kiểm tra</button>`;
  const byCat = (id) => data.products.filter((p) => (id === 'all' || p.cat === id) && matches(p, { skip: 'cat' })).length;
  $('#dm-cat').innerHTML = `<span class="dm-chips__k">Nhóm</span>` + chip('cat', 'all', 'Tất cả', byCat('all'), state.cat === 'all')
    + data.categories.map((c) => chip('cat', c.id, c.name, byCat(c.id), state.cat === c.id)).join('');
  const labels = [...new Set(data.products.filter((p) => state.brand === 'all' || p.brand === state.brand).map((p) => p.label))]
    .sort((a, b) => (labelRank.get(a) ?? 99) - (labelRank.get(b) ?? 99));
  const byLabel = (l) => data.products.filter((p) => (l === 'all' || p.label === l) && matches(p, { skip: 'label' })).length;
  $('#dm-label').innerHTML = `<span class="dm-chips__k">Nhãn</span>` + chip('label', 'all', 'Tất cả', null, state.label === 'all')
    + labels.map((l) => chip('label', l, l, byLabel(l), state.label === l)).join('');
}

function placeholder(p) {
  const initials = p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="dm-ph" role="img" aria-label="Chưa có ảnh ${esc(p.name)}"><b>${esc(initials)}</b><span>Chưa có ảnh</span></div>`;
}

// Nút mua: data.buy nối mã danh mục với mã bán ở cửa hàng (server/dm-buy.js). Không nối được thì hiện "Liên hệ".
function buyOptions(p) {
  const sellable = p.variants.filter((v) => data.buy?.[v.code]);
  const seen = new Set();
  const out = [];
  for (const v of sellable) {
    for (const o of data.buy[v.code].options) {
      if (seen.has(o.sku)) continue;
      seen.add(o.sku);
      out.push({ ...o, label: sellable.length > 1 && o.label === 'Lẻ' ? `Lẻ ${v.weightLabel}` : o.label });
    }
  }
  return out;
}

function buyBlock(p) {
  const opts = buyOptions(p);
  if (!opts.length) {
    const why = p.variants.every((v) => v.price == null) ? 'Chưa có giá' : 'Chưa bán online';
    return `<div class="dm-buy dm-buy--ask"><a class="dm-buy__ask" href="${esc(data.contact)}" target="_blank" rel="noopener">Liên hệ</a><span>${why}</span></div>`;
  }
  const first = opts[0];
  return `<div class="dm-buy" data-buy-card="${esc(p.id)}">
    ${opts.length > 1 ? `<div class="dm-buy__opts" role="radiogroup" aria-label="Chọn lẻ hoặc combo">${opts.map((o, i) => `<label class="dm-buy__opt" title="${esc(o.title)}"><input type="radio" name="buy-${esc(p.id)}" value="${esc(o.sku)}" data-price="${esc(o.price)}" data-title="${esc(o.title)}"${i ? '' : ' checked'}><span>${esc(o.label)}<em>${money(o.price)}</em></span></label>`).join('')}</div>` : ''}
    <button type="button" class="dm-buy__add" data-add="${esc(first.sku)}" data-title="${esc(first.title)}">Thêm vào giỏ<b>${money(first.price)}</b></button>
  </div>`;
}

function card(p) {
  const hero = p.images[0];
  const extra = p.images.slice(1);
  const check = needsCheck(p);
  return `<article class="dm-card${isOwn(p) ? ' dm-card--own' : ''}" id="sp-${esc(p.id)}">
    <div class="dm-card__media">
      ${hero ? `<button type="button" class="dm-card__img" data-gal="${esc(p.id)}" aria-label="Xem ${p.images.length > 1 ? `${p.images.length} ảnh` : 'ảnh'} ${esc(p.name)}"><img src="${esc(thumbOf(hero))}" srcset="${esc(thumbOf(hero))} 480w, ${esc(hero.src)} 1000w" sizes="(max-width: 520px) 50vw, 300px" alt="${esc(hero.alt)}" loading="lazy" decoding="async" width="480" height="600"></button>` : placeholder(p)}
      <span class="dm-tag dm-tag--cat">${esc(cats.get(p.cat)?.name || '')}</span>
      ${check ? '<span class="dm-tag dm-tag--warn" title="Thông tin chưa xác nhận">Cần kiểm tra</span>' : ''}
      ${extra.length ? `<span class="dm-galdot" aria-hidden="true"><i class="is-on"></i>${extra.map(() => '<i></i>').join('')}<b>${p.images.length} ảnh</b></span>` : ''}
    </div>
    <div class="dm-card__body">
      <p class="dm-card__label">${p.label === brands.get(p.brand)?.name ? `<span>${esc(p.label)}</span>` : `<span>${esc(brands.get(p.brand)?.name)}</span> · ${esc(p.label)}`}</p>
      <h3>${esc(p.name)}</h3>
      ${p.pack ? `<p class="dm-card__pack">${esc(p.pack)}</p>` : ''}
      <ul class="dm-weights" aria-label="Khối lượng">
        ${p.variants.map((v) => `<li class="dm-w${v.verify ? ' dm-w--warn' : ''}">
          <button type="button" data-cmp-type="${esc(p.type)}" data-cmp-w="${esc(v.weightG ?? 'x')}" title="So sánh ${esc(data.types[p.type] || '')} ${esc(v.weightLabel)}">
            <b>${esc(v.weightLabel)}</b><code>${esc(v.code)}</code>
            <em>${v.price != null ? `${money(v.price)}${v.per100g != null ? ` · ${money(v.per100g)}/100g` : ''}` : 'Chưa có giá'}</em>
          </button></li>`).join('')}
      </ul>
      ${p.note ? `<p class="dm-card__note">${esc(p.note)}</p>` : ''}
      ${buyBlock(p)}
    </div>
  </article>`;
}

function renderGrid(list) {
  const out = [];
  for (const b of data.brands) {
    const inBrand = list.filter((p) => p.brand === b.id);
    if (!inBrand.length) continue;
    const labels = [...new Set(inBrand.map((p) => p.label))].sort((a, c) => (labelRank.get(a) ?? 99) - (labelRank.get(c) ?? 99));
    out.push(`<section class="dm-brand dm-brand--${esc(b.kind)}">
      <header class="dm-brand__head">
        <div class="dm-brand__mark">${b.kind === 'own' ? 'MQ' : 'VZ'}</div>
        <div><p class="dm-brand__kind">${esc(b.kindLabel)}</p><h2>${esc(b.name)}</h2><p class="dm-brand__owner">${esc(b.owner)} · ${inBrand.length} sản phẩm · ${labels.length} nhãn</p></div>
      </header>
      ${labels.map((l) => {
        const items = inBrand.filter((p) => p.label === l);
        return `<div class="dm-label">${b.kind === 'own' && labels.length === 1 ? '' : `<h3 class="dm-label__h">${esc(l)} <span>${items.length}</span></h3>`}
          <div class="dm-grid">${items.map(card).join('')}</div></div>`;
      }).join('')}
    </section>`);
  }
  $('#dm-grid').innerHTML = out.join('') || '<p class="dm-empty">Không có sản phẩm khớp bộ lọc. Thử bỏ bớt chip hoặc đổi từ khoá.</p>';
}

function typeOptions(list) {
  const counts = new Map();
  for (const p of list) counts.set(p.type, (counts.get(p.type) || 0) + p.variants.length);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (data.types[a[0]] || '').localeCompare(data.types[b[0]] || '', 'vi'));
}

function renderCompare(list) {
  const types = typeOptions(list);
  if (!types.length) { $('#dm-compare').innerHTML = '<p class="dm-empty">Không có sản phẩm khớp bộ lọc.</p>'; return; }
  if (!types.some(([t]) => t === state.type)) state.type = types[0][0];
  const rows = list.filter((p) => p.type === state.type).flatMap((p) => p.variants.map((v) => ({ p, v })));
  const weights = [...new Set(rows.map((r) => r.v.weightG ?? 'x'))].sort((a, b) => (a === 'x') - (b === 'x') || a - b);
  if (state.weight !== 'all' && !weights.map(String).includes(String(state.weight))) state.weight = 'all';
  const shown = rows.filter((r) => state.weight === 'all' || String(r.v.weightG ?? 'x') === String(state.weight))
    .sort((a, b) => isOwn(b.p) - isOwn(a.p) || (a.v.weightG ?? 1e9) - (b.v.weightG ?? 1e9) || (a.v.per100g ?? 1e12) - (b.v.per100g ?? 1e12));
  const best = Math.min(...shown.map((r) => r.v.per100g ?? Infinity));
  $('#dm-compare').innerHTML = `<div class="dm-cmp__ctl">
      <label class="dm-select">Loại sản phẩm
        <select id="dm-type">${types.map(([t, n]) => `<option value="${esc(t)}"${t === state.type ? ' selected' : ''}>${esc(data.types[t] || t)} (${n})</option>`).join('')}</select>
      </label>
      <div class="dm-chips" aria-label="Khối lượng"><span class="dm-chips__k">Khối lượng</span>
        ${chip('weight', 'all', 'Tất cả', rows.length, state.weight === 'all')}
        ${weights.map((w) => chip('weight', w, w === 'x' ? 'Chưa rõ' : `${w}g`, rows.filter((r) => String(r.v.weightG ?? 'x') === String(w)).length, String(state.weight) === String(w))).join('')}
      </div>
    </div>
    <div class="dm-cmp__wrap"><table class="dm-cmp">
      <thead><tr><th scope="col">Sản phẩm</th><th scope="col">Khối lượng</th><th scope="col">Mã</th><th scope="col" class="num">Giá bán lẻ</th><th scope="col" class="num">Giá/100g</th><th scope="col">Nguồn · ngày</th></tr></thead>
      <tbody>${shown.map(({ p, v }) => {
        const src = v.priceSource ? (/^https?:\/\//.test(v.priceSource) ? `<a href="${esc(v.priceSource)}" target="_blank" rel="noopener nofollow">${esc(new URL(v.priceSource).hostname.replace(/^www\./, ''))}</a>` : esc(v.priceSource)) : '—';
        const hero = p.images[0];
        return `<tr class="${isOwn(p) ? 'is-own' : ''}">
          <th scope="row"><div class="dm-cmp__p">${hero ? `<img src="${esc(thumbOf(hero))}" alt="" width="44" height="55" loading="lazy">` : '<span class="dm-cmp__ph"></span>'}
            <div><small>${esc(brands.get(p.brand)?.name)} · ${esc(p.label)}${isOwn(p) ? ' <i>★ của shop</i>' : ''}</small><b>${esc(p.name)}</b>${needsCheck(p) ? '<span class="dm-mini-warn">Cần kiểm tra</span>' : ''}</div></div></th>
          <td><span class="dm-wchip${v.verify ? ' dm-wchip--warn' : ''}">${esc(v.weightLabel)}</span></td>
          <td><code>${esc(v.code)}</code></td>
          <td class="num">${money(v.price)}</td>
          <td class="num${v.per100g != null && v.per100g === best ? ' is-best' : ''}">${v.per100g != null ? money(v.per100g) : '—'}</td>
          <td class="dm-cmp__src">${src}${v.priceCheckedAt ? `<br><small>${esc(dateVi(v.priceCheckedAt))}</small>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <p class="fine dm-cmp__hint">${rows.some((r) => r.v.price != null) ? 'Ô trống là mã chưa có giá.' : 'Chưa nhập giá nên cột giá đang trống.'} Chủ shop sửa giá, nguồn và ngày kiểm ở trang quản trị (tab Danh mục). Giá/100g tự tính; ô viền vàng là rẻ nhất trên 100g.</p>`;
}

function renderGallery() {
  if (!data.gallery?.length) return;
  $('#dm-gallery').innerHTML = `<h2 id="dm-gallery-title">Ảnh đĩa trưng bày</h2><p class="fine">Ảnh phụ để chụp bài, chưa gắn mã bán.</p>
    <div class="dm-gal">${data.gallery.map((g) => `<figure class="dm-gal__it"><button type="button" class="dm-card__img" data-plate="${esc(g.img.src)}" aria-label="Phóng to ảnh ${esc(g.title)}"><img src="${esc(thumbOf(g.img))}" alt="${esc(g.img.alt)}" loading="lazy" decoding="async" width="480" height="480"></button>
      <figcaption><b>${esc(g.title)}</b>${g.verify ? ' <span class="dm-mini-warn">Cần kiểm tra</span>' : ''}<small>${esc(g.note)}</small></figcaption></figure>`).join('')}</div>`;
}

function render() {
  const list = data.products.filter((p) => matches(p));
  renderChips();
  const nV = list.reduce((n, p) => n + p.variants.length, 0);
  $('#dm-count').textContent = `${list.length} sản phẩm · ${nV} mã khối lượng`;
  document.querySelectorAll('[data-view]').forEach((b) => { const on = b.dataset.view === state.view; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
  $('#dm-grid').hidden = state.view !== 'grid';
  $('#dm-compare').hidden = state.view !== 'compare';
  $('#dm-gallery').hidden = state.view !== 'grid';
  if (state.view === 'grid') renderGrid(list); else renderCompare(list);
  writeUrl();
}

let timer;
$('#dm-q').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 120); });
document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.add) {
    add(t.dataset.add, 1);
    toast(`Đã cho vào giỏ: ${t.dataset.title}`, { href: '/gio-hang', label: 'Xem giỏ' });
    return;
  }
  if (t.dataset.brand) { state.brand = t.dataset.brand; state.label = 'all'; render(); }
  else if (t.dataset.cat) { state.cat = t.dataset.cat; render(); }
  else if (t.dataset.label) { state.label = t.dataset.label; render(); }
  else if (t.dataset.weight) { state.weight = t.dataset.weight; render(); }
  else if (t.hasAttribute('data-verify')) { state.onlyVerify = !state.onlyVerify; render(); }
  else if (t.dataset.view) { state.view = t.dataset.view; render(); }
  else if (t.dataset.cmpType) {
    Object.assign(state, { view: 'compare', type: t.dataset.cmpType, weight: t.dataset.cmpW, brand: 'all', label: 'all', cat: 'all', q: '' });
    $('#dm-q').value = '';
    render();
    $('#dm-compare').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (t.dataset.gal) {
    const p = data.products.find((x) => x.id === t.dataset.gal);
    if (p) openGallery(p.images, p.name, [...new Set([brands.get(p.brand)?.name, p.label])].join(' · ') + ' · ' + p.variants.map((v) => v.code).join(', '));
  } else if (t.dataset.plate) {
    const g = data.gallery.find((x) => x.img.src === t.dataset.plate);
    if (g) openGallery([g.img], g.title, 'Ảnh đĩa trưng bày');
  } else if (t.dataset.go) goTo(Number(t.dataset.go));
  else if (t.id === 'dm-lb-prev') goTo(lb.i - 1);
  else if (t.id === 'dm-lb-next') goTo(lb.i + 1);
  else if (t.id === 'dm-lb-x') $('#dm-lb').close();
});

// Thư viện ảnh: vuốt ngang (scroll-snap), nút trước/sau, phím mũi tên, ảnh nhỏ bên dưới.
const lb = { imgs: [], i: 0 };
function openGallery(imgs, title, sub) {
  lb.imgs = imgs; lb.i = 0;
  $('#dm-lb-title').textContent = title;
  $('#dm-lb-sub').textContent = sub;
  $('#dm-lb-track').innerHTML = imgs.map((im, i) => `<figure class="dm-lb__slide"><img src="${esc(i === 0 ? im.src : thumbOf(im))}" data-full="${esc(im.src)}" alt="${esc(im.alt)}" decoding="async"${i ? ' loading="lazy"' : ''}></figure>`).join('');
  $('#dm-lb-thumbs').innerHTML = imgs.length > 1 ? imgs.map((im, i) => `<button type="button" class="dm-lb__th" data-go="${i}" aria-label="Ảnh ${i + 1}: ${esc(KIND[im.kind] || '')}"><img src="${esc(thumbOf(im))}" alt="" loading="lazy" width="56" height="70"></button>`).join('') : '';
  $('#dm-lb').classList.toggle('is-single', imgs.length < 2);
  $('#dm-lb').showModal();
  $('#dm-lb-track').scrollLeft = 0;
  sync(0);
}
function sync(i) {
  lb.i = i;
  const im = lb.imgs[i];
  if (!im) return;
  const slide = $('#dm-lb-track').children[i]?.querySelector('img');
  if (slide && slide.getAttribute('src') !== slide.dataset.full) slide.src = slide.dataset.full;
  $('#dm-lb-count').textContent = lb.imgs.length > 1 ? `${i + 1} / ${lb.imgs.length}` : '';
  $('#dm-lb-cap').innerHTML = `<b>${esc(KIND[im.kind] || 'Ảnh')}</b> ${esc(im.alt)}`;
  document.querySelectorAll('.dm-lb__th').forEach((b, k) => b.classList.toggle('is-on', k === i));
  $('#dm-lb-prev').disabled = i === 0;
  $('#dm-lb-next').disabled = i === lb.imgs.length - 1;
}
function goTo(i) {
  if (i < 0 || i >= lb.imgs.length) return;
  const tr = $('#dm-lb-track');
  tr.scrollTo({ left: i * tr.clientWidth, behavior: 'smooth' });
  sync(i);
}
let scrollT;
$('#dm-lb-track').addEventListener('scroll', (e) => {
  clearTimeout(scrollT);
  scrollT = setTimeout(() => { const tr = e.target; const i = Math.round(tr.scrollLeft / tr.clientWidth); if (i !== lb.i) sync(i); }, 80);
});
$('#dm-lb').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(lb.i + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(lb.i - 1); }
});
document.addEventListener('change', (e) => {
  const r = e.target.closest('.dm-buy__opts input');
  if (!r) return;
  const btn = r.closest('.dm-buy').querySelector('.dm-buy__add');
  btn.dataset.add = r.value;
  btn.dataset.title = r.dataset.title;
  btn.querySelector('b').textContent = money(Number(r.dataset.price));
});
refresh();
document.addEventListener('change', (e) => { if (e.target.id === 'dm-type') { state.type = e.target.value; state.weight = 'all'; render(); } });
$('#dm-lb').addEventListener('click', (e) => { if (e.target.id === 'dm-lb') e.target.close(); });

readUrl();
renderGallery();
render();
