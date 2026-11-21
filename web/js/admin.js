const loginPanel = document.querySelector('#login-panel');
const dash = document.querySelector('#dash');
const loginErr = document.querySelector('#login-err');
const bankWarn = document.querySelector('#bank-warn');
let durableOn = false;
const panels = {
  orders: document.querySelector('#panel-orders'),
  prices: document.querySelector('#panel-prices'),
  promo: document.querySelector('#panel-promo'),
  refs: document.querySelector('#panel-refs'),
  catalog: document.querySelector('#panel-catalog'),
  content: document.querySelector('#panel-content'),
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Không thực hiện được.');
  return data;
}

function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.classList.toggle('is-on', button.dataset.tab === name);
  });
  for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== name;
}

async function loadOrders() {
  const data = await api('/api/admin/orders');
  if (!data.orders.length) {
    panels.orders.innerHTML = '<p class="empty-inline">Chưa có đơn.</p>';
    return;
  }
  panels.orders.innerHTML = data.orders.map((order) => {
    const options = data.statuses.map(([id, label]) => `<option value="${id}"${id === order.status ? ' selected' : ''}>${label}</option>`).join('');
    const when = new Date(order.createdAt).toLocaleString('vi-VN', { hour12: false });
    const pay = order.payMethod === 'cod' ? 'Khi nhận' : 'Chuyển khoản';
    const lines = order.items.map((item) => {
      const taste = Array.isArray(item.contents) && item.contents.length
        ? ` — ${item.contents.map((row) => `${row.name} ${row.grams}g`).join(', ')}`
        : '';
      return `<li>${item.qty} × ${esc(item.name)} · ${esc(item.w)} · ${money(item.line)}${item.combo ? ' · combo' : ''}${esc(taste)}</li>`;
    }).join('');
    const gifts = (order.gifts || []).map((item) => `<li>${item.qty} × ${esc(item.name)} · 0đ</li>`).join('');
    const c = order.customer;
    return `<article class="order" data-code="${esc(order.code)}">
      <header>
        <div><b>${esc(order.code)}</b><small>${esc(when)} · ${esc(pay)}</small></div>
        <label class="sr">Trạng thái ${esc(order.code)}</label>
        <select data-status="${esc(order.code)}">${options}</select>
      </header>
      <p>${esc(c.name)} · ${esc(c.phone)}<br>${esc([c.address, c.ward, c.province].filter(Boolean).join(', '))}</p>
      ${order.note ? `<p class="fine">Ghi chú: ${esc(order.note)}</p>` : ''}
      <ul>${lines}${gifts}</ul>
      <p class="fine">Tiền hàng ${money(order.summary.subtotal)}${order.summary.discount ? ` · Giảm ${order.summary.discountPct || ''}% theo đơn −${money(order.summary.discount)}` : ''} · Giao ${order.summary.ship ? money(order.summary.ship) : 'miễn phí'}</p>
      <p class="order__total">${money(order.summary.total)}</p>
      <p class="fine" data-saved hidden>Đã lưu trạng thái.</p>
    </article>`;
  }).join('');
}

function durableLine(result) {
  if (result?.durable) return 'Đã lưu';
  if (result?.reason === 'github') return 'Đã lưu trên máy, chưa ghi được lên GitHub';
  return 'Đã lưu';
}

async function loadPrices() {
  const data = await api('/api/admin/products');
  const keep = document.querySelector('#price-q')?.value || '';
  const storeNote = durableOn
    ? 'Giá, hết hàng và ảnh được ghi lên GitHub, còn sau khi máy chủ khởi động lại.'
    : 'Chưa có CATALOG_GITHUB_TOKEN trên Render. Sửa có hiệu lực ngay, nhưng mất khi máy chủ khởi động lại.';
  panels.prices.innerHTML = `<p class="fine">${storeNote}</p><label class="field">Tìm <input id="price-q" placeholder="Tên hoặc mã" value="${esc(keep)}"></label><div id="price-list"></div>`;
  const list = document.querySelector('#price-list');
  const input = document.querySelector('#price-q');
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const products = data.products.filter((product) => {
      if (!q) return true;
      const blob = (product.name + ' ' + product.variants.map((v) => v.sku).join(' ')).toLowerCase();
      return blob.includes(q);
    });
    list.innerHTML = products.map((product) => `<article class="pricebox" data-id="${esc(product.id)}">
      <header>
        <div>
          <b>${esc(product.name)}</b>
          <small>${esc(product.brandName)} · ${esc(product.catShort)}</small>
        </div>
        <label class="check"><input type="checkbox" data-hide="${esc(product.id)}"${product.hidden ? ' checked' : ''}> Ẩn khỏi cửa hàng</label>
      </header>
      <label class="field">Câu ngắn trên trang
        <textarea data-short="${esc(product.id)}" rows="2">${esc(product.shortOverride || '')}</textarea>
      </label>
      <button class="btn btn--small" type="button" data-save-copy="${esc(product.id)}">Lưu câu và trạng thái ẩn</button>
      <div class="vars">${product.variants.map((variant) => `<div class="varrow">
        <div><b>${esc(variant.label)}</b><small>${esc(variant.sku)}<br>Giá niêm yết ${money(variant.catalogPrice)}${variant.overridden ? ' · đang ghi đè' : ''}</small></div>
        <label class="field">Giá bán <input data-price="${esc(variant.sku)}" inputmode="numeric" value="${variant.price ?? ''}" aria-label="Giá ${esc(variant.sku)}"></label>
        <label class="field">Giá gốc gạch ngang <input data-was="${esc(variant.sku)}" inputmode="numeric" value="${variant.compareAt ?? ''}" placeholder="Để trống nếu không gạch" aria-label="Giá gốc ${esc(variant.sku)}"></label>
        <label class="check"><input type="checkbox" data-oos="${esc(variant.sku)}" data-catalog-oos="${variant.catalogOos ? '1' : '0'}"${variant.oos ? ' checked' : ''}> Hết hàng</label>
        <button class="btn btn--small" type="button" data-save-price="${esc(variant.sku)}">Lưu</button>
        <button class="textbtn" type="button" data-reset-price="${esc(variant.sku)}">Về giá niêm yết</button>
      </div>`).join('')}</div>
      <div class="gallery-edit" data-gallery="${esc(product.id)}">
        <b>Ảnh</b>
        <div class="shots-edit">${(product.gallery || []).map((shot, index) => `<div class="shot${shot.hero ? ' is-hero' : ''}" data-shot="${esc(shot.file)}" data-label="${esc(shot.label)}" data-alt="${esc(shot.alt)}">
          <img src="${esc(shot.src)}" alt="">
          <div>
            <label class="check"><input type="radio" name="hero-${esc(product.id)}" data-hero${shot.hero ? ' checked' : ''}> Ảnh chính</label>
            <label class="field">Chữ thay ảnh <input data-alt-input value="${esc(shot.alt)}" maxlength="180"></label>
            <div class="shot__actions">
              <button class="btn btn--small btn--ghost" type="button" data-photo-up="${index}">Lên</button>
              <button class="btn btn--small btn--ghost" type="button" data-photo-down="${index}">Xuống</button>
              <button class="btn btn--small btn--ghost" type="button" data-photo-del>Xoá</button>
            </div>
          </div>
        </div>`).join('')}</div>
        <div class="shot__actions">
          <label class="btn btn--small btn--ghost">Thêm ảnh<input data-photo-file="${esc(product.id)}" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
          <button class="btn btn--small" type="button" data-save-gallery="${esc(product.id)}">Lưu thứ tự ảnh</button>
        </div>
      </div>
    </article>`).join('') || '<p>Không thấy món nào.</p>';
  };
  input.oninput = draw;
  draw();
}

async function loadPromo() {
  const data = await api('/api/admin/settings');
  const s = data.settings;
  panels.promo.innerHTML = `<form id="promo-form" class="fields">
    <p class="lead lead--left">Ưu đãi theo đơn (tự tính trong giỏ và trên máy chủ): tiền hàng từ 300.000đ giảm 3% và miễn phí giao, từ 500.000đ giảm 7%, từ 1.000.000đ giảm 12%. Mức tính trên tiền hàng trước giảm, chưa cộng phí giao. Combo cũng được giảm theo đơn (kế hoạch A, % trên toàn bộ tiền hàng) và vẫn tính vào mức đơn. Không còn quà tặng 0đ.</p>
    <input type="hidden" name="giftMin" value="${s.giftMin}">
    <input type="hidden" name="giftPair" value="${s.giftPair}">
    <input type="hidden" name="giftMinG" value="${s.giftMinG}">
    <input type="hidden" name="giftMax" value="${s.giftMax}">
    <input type="hidden" name="giftSku" value="${s.giftSku}">
    <input type="hidden" name="giftProductId" value="${s.giftProductId}">
    <label class="field">Miễn phí giao từ (đồng) <input name="freeShip" inputmode="numeric" value="${s.freeShip}" required></label>
    <label class="field">Phí giao nếu chưa đủ mức (đồng) <input name="shipFee" inputmode="numeric" value="${s.shipFee}" required></label>
    <label class="check"><input type="checkbox" name="codEnabled"${s.codEnabled ? ' checked' : ''}> Cho phép trả khi nhận hàng</label>
    <button class="btn" type="submit">Lưu phí giao</button>
    <p class="fine" id="promo-msg"></p>
  </form>`;
  document.querySelector('#promo-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = {
      giftMin: Number(form.giftMin.value),
      giftPair: Number(form.giftPair.value),
      giftMinG: Number(form.giftMinG.value),
      giftMax: Number(form.giftMax.value),
      giftSku: form.giftSku.value.trim(),
      giftProductId: form.giftProductId.value.trim(),
      freeShip: Number(form.freeShip.value),
      shipFee: Number(form.shipFee.value),
      codEnabled: form.codEnabled.checked,
    };
    const msg = document.querySelector('#promo-msg');
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
      msg.textContent = 'Đã lưu. Đơn mới sẽ tính theo mức này.';
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

const CONTENT_FIELDS = [
  ['heroKicker', 'Dòng nhỏ trên ảnh đầu'],
  ['heroTitle', 'Tiêu đề trang chủ'],
  ['heroLead', 'Đoạn giới thiệu'],
  ['heroCta', 'Nút chính'],
  ['heroSecondary', 'Nút phụ'],
  ['featuredTitle', 'Tiêu đề nổi bật'],
  ['waysTitle', 'Tiêu đề cách sấy'],
  ['waysLead', 'Đoạn cách sấy'],
  ['offerKicker', 'Dòng nhỏ ưu đãi'],
  ['offerTitle', 'Tiêu đề ưu đãi'],
  ['shelfTitle', 'Tiêu đề kệ hàng'],
  ['shelfLead', 'Đoạn kệ hàng'],
  ['footerTagline', 'Dòng chân trang'],
  ['banner', 'Dòng thông báo trên cùng (để trống = tự tính phí giao)'],
  ['homeTitle', 'Tiêu đề SEO trang chủ (để trống = tự soạn)'],
  ['homeDescription', 'Mô tả SEO trang chủ (để trống = tự soạn)'],
];
const PAGE_FIELDS = [
  ['shop', 'Cửa hàng'],
  ['thanghoa', 'Sấy thăng hoa'],
  ['gion', 'Mít sấy Thái / sấy giòn'],
  ['deo', 'Sấy dẻo'],
  ['combo', 'Combo'],
  ['gift', 'Hộp quà'],
  ['catalog', 'Danh mục'],
  ['kho', 'Sấy khô'],
  ['omai', 'Ô mai'],
  ['set', 'Set quà'],
  ['hat', 'Hạt'],
];
const SECTION_LABEL = { hero: 'Ảnh đầu', featured: 'Nổi bật', ways: 'Cách sấy', offer: 'Ưu đãi', shelf: 'Kệ hàng' };
const BADGE_OPTIONS = ['', 'Bán chạy', 'Khuyến mãi', 'Phiên bản giới hạn', 'Combo tiết kiệm', 'Mới', 'Giới hạn'];

function field(name, label, value, rows) {
  const control = rows
    ? `<textarea name="${name}" rows="${rows}">${esc(value || '')}</textarea>`
    : `<input name="${name}" value="${esc(value || '')}">`;
  return `<label class="field">${esc(label)} ${control}</label>`;
}

async function loadContent() {
  if (!panels.content) return;
  const data = await api('/api/admin/content');
  const site = data.site;
  const sections = (site.sections || []).map((section, index) => `<div class="varrow" data-section="${esc(section.id)}">
    <b>${esc(SECTION_LABEL[section.id] || section.id)}</b>
    <label class="check"><input type="checkbox" data-hide-section${section.hidden ? ' checked' : ''}> Ẩn mục này</label>
    <div class="shot__actions">
      <button class="btn btn--small btn--ghost" type="button" data-sec-up="${index}">Lên</button>
      <button class="btn btn--small btn--ghost" type="button" data-sec-down="${index}">Xuống</button>
    </div>
  </div>`).join('');
  const pages = PAGE_FIELDS.map(([key, label]) => {
    const row = site.pages?.[key] || {};
    return `<fieldset class="pricebox"><legend>${esc(label)}</legend>
      ${field(`page-title-${key}`, 'Tiêu đề', row.title)}
      ${field(`page-desc-${key}`, 'Mô tả', row.description, 2)}
    </fieldset>`;
  }).join('');
  const versions = (data.versions || []).map((row) => `<option value="${row.index}">${esc(row.at)}</option>`).join('');
  const products = data.products || [];
  panels.content.innerHTML = `<form id="content-form" class="fields">
    <p class="fine">Chữ thuần, không dán mã HTML. Để trống thì trang dùng câu sẵn. Ảnh và chữ thay ảnh nằm ở tab Giá và ảnh, kể cả combo.</p>
    ${CONTENT_FIELDS.map(([key, label]) => field(key, label, site[key], key.endsWith('Lead') || key.endsWith('Description') ? 3 : 0)).join('')}
    <h2>Thứ tự trang chủ</h2>
    <div id="content-sections">${sections}</div>
    <h2>Tiêu đề từng trang</h2>
    ${pages}
    <div class="shot__actions">
      <button class="btn" type="submit">Lưu nội dung trang</button>
      <button class="btn btn--ghost" type="button" id="content-preview">Xem trước</button>
    </div>
    <p class="fine" id="content-msg" role="status"></p>
    <label class="field">Bản đã lưu <select id="content-version"><option value="">Chọn bản để khôi phục</option>${versions}</select></label>
    <button class="btn btn--small btn--ghost" type="button" id="content-restore">Khôi phục</button>
  </form>
  <h2>Từng món và combo</h2>
  <label class="field">Tìm <input id="content-q" placeholder="Tên món"></label>
  <div id="content-products"></div>`;
  const list = document.querySelector('#content-products');
  const draw = () => {
    const q = document.querySelector('#content-q').value.trim().toLowerCase();
    list.innerHTML = products.filter((product) => !q || product.name.toLowerCase().includes(q) || product.id.includes(q)).map((product) => {
      const copy = product.copy || {};
      return `<article class="pricebox" data-copy="${esc(product.id)}">
        <header><b>${esc(product.name)}</b><small>${product.mixed ? 'Combo · ' : ''}${esc(product.id)}</small></header>
        ${field('name', 'Tên hiển thị', copy.name)}
        ${field('pitch', 'Câu ngắn', copy.pitch, 2)}
        ${field('description', 'Mô tả đầy đủ', copy.description, 4)}
        ${field('seoTitle', 'Tiêu đề SEO', copy.seoTitle)}
        ${field('seoDescription', 'Mô tả SEO', copy.seoDescription, 2)}
        <label class="field">Huy hiệu <select name="badge"><option value="__default">Theo danh mục${product.badge ? ` (${esc(product.badge)})` : ''}</option>${BADGE_OPTIONS.map((badge) => `<option value="${esc(badge)}"${copy.badge === badge ? ' selected' : ''}>${badge ? esc(badge) : 'Không gắn'}</option>`).join('')}</select></label>
        <label class="field">Nổi bật (1 đến 99, để trống = theo danh mục) <input name="featured" inputmode="numeric" value="${copy.featured === false ? '' : (copy.featured ?? '')}"></label>
        <label class="check"><input type="checkbox" name="featuredOff"${copy.featured === false ? ' checked' : ''}> Không đưa vào nổi bật</label>
        <button class="btn btn--small" type="button" data-save-copy-text="${esc(product.id)}">Lưu chữ món này</button>
      </article>`;
    }).join('') || '<p>Không thấy món nào.</p>';
  };
  document.querySelector('#content-q').oninput = draw;
  draw();
  document.querySelector('#content-form').onsubmit = async (event) => {
    event.preventDefault();
    const msg = document.querySelector('#content-msg');
    try {
      const result = await api('/api/admin/content/site', { method: 'PUT', body: JSON.stringify(readSiteForm()) });
      msg.textContent = result.durable ? 'Đã lưu.' : 'Đã lưu trên máy.';
    } catch (error) {
      msg.textContent = error.message;
    }
  };
}

function focusEditTarget() {
  const query = new URLSearchParams(location.search);
  if (query.get('tab') === 'prices') {
    showTab('prices');
    const id = query.get('product');
    const card = id ? document.querySelector(`[data-id="${CSS.escape(id)}"]`) : null;
    card?.scrollIntoView({ block: 'start' });
    card?.classList.add('is-edit-target');
    return;
  }
  const edit = query.get('edit');
  if (!edit) return;
  showTab('content');
  if (edit === 'home') {
    document.querySelector('[name="heroTitle"]')?.closest('.field')?.classList.add('is-edit-target');
    document.querySelector('#content-sections')?.scrollIntoView({ block: 'start' });
    return;
  }
  if (edit === 'page') {
    const box = document.querySelector(`[name="page-title-${query.get('page')}"]`)?.closest('fieldset');
    box?.classList.add('is-edit-target');
    box?.scrollIntoView({ block: 'center' });
    return;
  }
  if (edit === 'product') {
    const id = query.get('id') || '';
    const input = document.querySelector('#content-q');
    if (input) {
      input.value = id;
      input.dispatchEvent(new Event('input'));
    }
    const card = document.querySelector(`[data-copy="${CSS.escape(id)}"]`);
    if (!card) return;
    card.classList.add('is-edit-target');
    const jump = document.createElement('p');
    const link = document.createElement('a');
    link.href = '/admin?tab=prices&product=' + encodeURIComponent(id);
    link.textContent = 'Sửa ảnh và giá';
    jump.append(link);
    card.prepend(jump);
    card.scrollIntoView({ block: 'start' });
  }
}

function readSiteForm() {
  const form = document.querySelector('#content-form');
  const body = { pages: {}, sections: [] };
  for (const [key] of CONTENT_FIELDS) body[key] = form.elements[key].value;
  for (const [key] of PAGE_FIELDS) {
    body.pages[key] = {
      title: form.elements[`page-title-${key}`].value,
      description: form.elements[`page-desc-${key}`].value,
    };
  }
  document.querySelectorAll('#content-sections [data-section]').forEach((row) => {
    body.sections.push({ id: row.dataset.section, hidden: row.querySelector('[data-hide-section]').checked });
  });
  return body;
}

async function enter() {
  const me = await api('/api/admin/me');
  durableOn = !!me.durable;
  loginPanel.hidden = true;
  dash.hidden = false;
  bankWarn.hidden = me.bankReady;
  await Promise.all([loadOrders(), loadPrices(), loadPromo(), loadRefs(), loadCatalog(), loadContent()]);
  focusEditTarget();
}

const restoreForm = document.querySelector('#restore-form');
restoreForm.addEventListener('change', (event) => {
  if (event.target.name !== 'mode') return;
  const confirmRow = document.querySelector('#replace-confirm');
  const replacing = event.target.value === 'replace';
  confirmRow.hidden = !replacing;
  if (!replacing) confirmRow.querySelector('input').checked = false;
});

restoreForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const msg = document.querySelector('#restore-msg');
  const button = form.querySelector('button');
  msg.textContent = '';
  const file = form.file.files[0];
  if (!file) return;
  const mode = new FormData(form).get('mode');
  if (mode === 'replace' && !form.confirm.checked) {
    msg.textContent = 'Tick xác nhận trước khi thay toàn bộ đơn.';
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    msg.textContent = 'File không phải JSON. Dùng file Xuất tất cả (JSON) để nhập lại.';
    return;
  }
  const params = new URLSearchParams({ mode });
  if (mode === 'replace') params.set('confirm', 'THAY-HET');
  if (form.restoreShop.checked) params.set('restoreShop', '1');
  button.disabled = true;
  try {
    const result = await api('/api/admin/backup?' + params.toString(), {
      method: 'POST',
      body: JSON.stringify(parsed),
    });
    const shop = result.restoredShop
      ? ' Đã khôi phục giá và mức quà.'
      : (form.restoreShop.checked ? ' File không có giá hoặc mức quà để khôi phục.' : '');
    msg.textContent = mode === 'replace'
      ? `Đã thay bằng file: ${result.added} đơn.${shop}`
      : `Đã thêm ${result.added} đơn, bỏ qua ${result.skipped} đơn đã có.${shop}`;
    await loadOrders();
  } catch (error) {
    msg.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  loginErr.textContent = '';
  const password = new FormData(event.currentTarget).get('password');
  try {
    await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    await enter();
  } catch (error) {
    loginErr.textContent = error.message;
  }
});

document.querySelector('#logout').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST', body: '{}' });
  location.reload();
});

document.querySelector('.tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-tab]');
  if (button) showTab(button.dataset.tab);
});

panels.orders.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-status]');
  if (!select) return;
  const card = select.closest('.order');
  try {
    await api('/api/admin/orders/' + select.dataset.status, {
      method: 'PATCH',
      body: JSON.stringify({ status: select.value }),
    });
    const note = card.querySelector('[data-saved]');
    note.hidden = false;
  } catch (error) {
    alert(error.message);
  }
});

panels.content?.addEventListener('click', async (event) => {
  const up = event.target.closest('[data-sec-up]');
  const down = event.target.closest('[data-sec-down]');
  const row = event.target.closest('[data-section]');
  if ((up || down) && row) {
    if (up && row.previousElementSibling) row.parentElement.insertBefore(row, row.previousElementSibling);
    if (down && row.nextElementSibling) row.parentElement.insertBefore(row.nextElementSibling, row);
  }
  const preview = event.target.closest('#content-preview');
  if (preview) {
    try {
      const result = await api('/api/admin/content/preview', { method: 'POST', body: JSON.stringify(readSiteForm()) });
      const view = window.open('', '_blank');
      if (!view) throw new Error('Trình duyệt chặn cửa sổ xem trước.');
      view.document.open();
      view.document.write(result.html);
      view.document.close();
    } catch (error) {
      document.querySelector('#content-msg').textContent = error.message;
    }
  }
  const restore = event.target.closest('#content-restore');
  if (restore) {
    const index = document.querySelector('#content-version').value;
    if (index === '') return;
    try {
      await api('/api/admin/content/restore', { method: 'POST', body: JSON.stringify({ index: Number(index) }) });
      await loadContent();
    } catch (error) {
      document.querySelector('#content-msg').textContent = error.message;
    }
  }
  const saveProduct = event.target.closest('[data-save-copy-text]');
  if (saveProduct) {
    const box = saveProduct.closest('[data-copy]');
    const badge = box.querySelector('[name="badge"]').value;
    const featuredOff = box.querySelector('[name="featuredOff"]').checked;
    const featuredRaw = box.querySelector('[name="featured"]').value.trim();
    const body = {
      name: box.querySelector('[name="name"]').value,
      pitch: box.querySelector('[name="pitch"]').value,
      description: box.querySelector('[name="description"]').value,
      seoTitle: box.querySelector('[name="seoTitle"]').value,
      seoDescription: box.querySelector('[name="seoDescription"]').value,
      badge: badge === '__default' ? null : badge,
      featured: featuredOff ? false : (featuredRaw === '' ? null : Number(featuredRaw)),
    };
    try {
      await api('/api/admin/content/products/' + encodeURIComponent(saveProduct.dataset.saveCopyText), { method: 'PUT', body: JSON.stringify(body) });
      saveProduct.textContent = 'Đã lưu';
    } catch (error) {
      alert(error.message);
    }
  }
});

panels.prices.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-photo-file]');
  if (!input?.files?.[0]) return;
  const id = input.dataset.photoFile;
  const file = input.files[0];
  input.value = '';
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
      reader.readAsDataURL(file);
    });
    const result = await api('/api/admin/products/' + encodeURIComponent(id) + '/photos', {
      method: 'POST',
      body: JSON.stringify({ data: dataUrl }),
    });
    if (result.reason === 'github') alert('Ảnh đã lưu trên máy, chưa ghi được lên GitHub.');
    await loadPrices();
  } catch (error) {
    alert(error.message);
  }
});

panels.prices.addEventListener('click', async (event) => {
  const savePrice = event.target.closest('[data-save-price]');
  const resetPrice = event.target.closest('[data-reset-price]');
  const saveCopy = event.target.closest('[data-save-copy]');
  try {
    if (savePrice) {
      const sku = savePrice.dataset.savePrice;
      const input = panels.prices.querySelector(`[data-price="${CSS.escape(sku)}"]`);
      const was = panels.prices.querySelector(`[data-was="${CSS.escape(sku)}"]`);
      const oosBox = panels.prices.querySelector(`[data-oos="${CSS.escape(sku)}"]`);
      const catalogOos = oosBox?.dataset.catalogOos === '1';
      const checked = !!oosBox?.checked;
      const result = await api('/api/admin/variants/' + encodeURIComponent(sku), {
        method: 'PATCH',
        body: JSON.stringify({
          price: input.value.trim() === '' ? null : Number(input.value),
          compareAt: was.value.trim() === '' ? null : Number(was.value),
          oos: checked === catalogOos ? null : checked,
        }),
      });
      savePrice.textContent = durableLine(result);
    }
    const up = event.target.closest('[data-photo-up]');
    const down = event.target.closest('[data-photo-down]');
    const del = event.target.closest('[data-photo-del]');
    if (up || down || del) {
      const shot = event.target.closest('[data-shot]');
      const list = shot?.parentElement;
      if (up && shot.previousElementSibling) list.insertBefore(shot, shot.previousElementSibling);
      if (down && shot.nextElementSibling) list.insertBefore(shot.nextElementSibling, shot);
      if (del) {
        const wasHero = shot.querySelector('[data-hero]')?.checked;
        shot.remove();
        if (wasHero) {
          const first = list.querySelector('[data-hero]');
          if (first) first.checked = true;
        }
      }
    }
    const saveGallery = event.target.closest('[data-save-gallery]');
    if (saveGallery) {
      const id = saveGallery.dataset.saveGallery;
      const box = saveGallery.closest('[data-gallery]');
      const items = [...box.querySelectorAll('[data-shot]')].map((shot) => ({
        file: shot.dataset.shot,
        label: shot.dataset.label || '',
        alt: shot.querySelector('[data-alt-input]')?.value || '',
        hero: !!shot.querySelector('[data-hero]')?.checked,
      }));
      const result = await api('/api/admin/products/' + encodeURIComponent(id) + '/gallery', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      saveGallery.textContent = durableLine(result);
    }
    if (resetPrice) {
      const sku = resetPrice.dataset.resetPrice;
      await api('/api/admin/variants/' + encodeURIComponent(sku), {
        method: 'PATCH',
        body: JSON.stringify({ price: null }),
      });
      await loadPrices();
    }
    if (saveCopy) {
      const id = saveCopy.dataset.saveCopy;
      const box = saveCopy.closest('.pricebox');
      await api('/api/admin/products/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify({
          hidden: box.querySelector('[data-hide]').checked,
          short: box.querySelector('[data-short]').value,
        }),
      });
      saveCopy.textContent = 'Đã lưu';
    }
  } catch (error) {
    alert(error.message);
  }
});

// ---------- Tab So sánh giá ----------
const REF_FIELDS = [
  ['brand', 'Thương hiệu *', 'text'], ['label', 'Nhãn', 'text'], ['product', 'Sản phẩm *', 'text'], ['fruit', 'Loại (xoài, macca…)', 'text'],
  ['weightG', 'Khối lượng (g)', 'number'], ['price', 'Giá (đ, để trống nếu chưa biết)', 'number'], ['pack', 'Bao bì', 'text'], ['code', 'Mã', 'text'],
  ['sourceUrl', 'Link nguồn (https://…)', 'url'], ['checkedAt', 'Ngày kiểm', 'date'], ['note', 'Ghi chú', 'text'],
];
let refRows = [];

function refForm(r = {}) {
  const inputs = REF_FIELDS.map(([key, label, type]) => `<label class="field">${esc(label)} <input name="${key}" type="${type}" value="${esc(r[key] ?? '')}"${type === 'number' ? ' min="0" step="1" inputmode="numeric"' : ''}></label>`).join('');
  return `<form id="ref-form" class="refs-form" data-id="${esc(r.id ?? '')}">
    ${inputs}
    <label class="check"><input type="checkbox" name="isEstimate"${r.isEstimate ? ' checked' : ''}> Ước lượng</label>
    <label class="check"><input type="checkbox" name="isExample"${r.isExample ? ' checked' : ''}> Dữ liệu mẫu</label>
    <button class="btn btn--small" type="submit">${r.id ? 'Lưu dòng #' + esc(r.id) : 'Thêm dòng'}</button>
    ${r.id ? '<button class="btn btn--small btn--ghost" type="button" data-ref-cancel>Huỷ sửa</button>' : ''}
    <p class="fine" id="ref-msg" role="status"></p>
  </form>`;
}

async function loadRefs(editing = null) {
  const data = await api('/api/admin/price-refs');
  refRows = data.rows;
  const list = refRows.map((r) => `<tr>
    <td>${esc(r.brand)}<br><small>${esc(r.label)}</small></td>
    <td>${esc(r.product)}${r.code ? `<br><code>${esc(r.code)}</code>` : ''}</td>
    <td>${r.weightG ? esc(r.weightG) + 'g' : '—'}${r.isEstimate ? '<br><small>ước lượng</small>' : ''}${r.isExample ? '<br><small>dữ liệu mẫu</small>' : ''}</td>
    <td>${esc(money(r.price))}</td>
    <td>${/^https?:\/\//i.test(r.sourceUrl) ? `<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener nofollow noreferrer">Nguồn</a>` : '—'}<br><small>${esc(r.checkedAt)}</small></td>
    <td><button class="btn btn--small btn--ghost" type="button" data-ref-edit="${esc(r.id)}">Sửa</button> <button class="btn btn--small btn--ghost" type="button" data-ref-del="${esc(r.id)}">Xoá</button></td>
  </tr>`).join('');
  panels.refs.innerHTML = `
    <p class="fine">Bảng hiện ở trang <a href="/so-sanh" target="_blank" rel="noopener">/so-sanh</a>. Chỉ ghi số đã thấy trên trang thật, kèm link và ngày. Chưa biết giá thì để trống.</p>
    <div class="refs-tools">
      <a class="btn btn--small" href="/api/admin/price-refs.json">Xuất bảng (JSON)</a>
      <a class="btn btn--small btn--ghost" href="/api/admin/price-refs.csv">Xuất bảng (CSV)</a>
    </div>
    <details>
      <summary>Nhập bảng từ file JSON hoặc CSV</summary>
      <form id="refs-import" class="fields">
        <label class="field">File JSON hoặc CSV đã xuất <input type="file" name="file" accept=".json,.csv,application/json,text/csv" required></label>
        <label class="check"><input type="radio" name="mode" value="merge" checked> Gộp: dòng cùng id thì cập nhật, còn lại thêm mới</label>
        <label class="check"><input type="radio" name="mode" value="replace"> Thay toàn bộ bảng bằng file</label>
        <label class="check" data-refs-confirm hidden><input type="checkbox" name="confirm"> Tôi hiểu: bảng hiện tại sẽ bị xoá và thay bằng file này.</label>
        <button class="btn btn--small" type="submit">Nhập</button>
        <p class="fine" id="refs-import-msg" role="status"></p>
      </form>
    </details>
    <h3>${editing ? 'Sửa dòng' : 'Thêm dòng'}</h3>
    ${refForm(editing || {})}
    <p class="fine">${esc(refRows.length)} dòng.</p>
    <div class="refs-wrap"><table class="refs-table">
      <thead><tr><th>Thương hiệu / Nhãn</th><th>Sản phẩm</th><th>KL</th><th>Giá</th><th>Nguồn</th><th></th></tr></thead>
      <tbody>${list}</tbody>
    </table></div>`;
}

panels.refs.addEventListener('change', (event) => {
  if (event.target.name !== 'mode' || !event.target.closest('#refs-import')) return;
  const row = panels.refs.querySelector('[data-refs-confirm]');
  row.hidden = event.target.value !== 'replace';
  if (row.hidden) row.querySelector('input').checked = false;
});

panels.refs.addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-ref-edit]');
  const del = event.target.closest('[data-ref-del]');
  const cancel = event.target.closest('[data-ref-cancel]');
  try {
    if (edit) {
      const row = refRows.find((r) => String(r.id) === edit.dataset.refEdit);
      await loadRefs(row);
      panels.refs.querySelector('#ref-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (cancel) await loadRefs();
    if (del) {
      const row = refRows.find((r) => String(r.id) === del.dataset.refDel);
      if (!row || !confirm(`Xoá dòng "${row.brand} · ${row.product} ${row.weightG ?? ''}g"?`)) return;
      await api('/api/admin/price-refs/' + encodeURIComponent(row.id), { method: 'DELETE' });
      await loadRefs();
    }
  } catch (error) {
    alert(error.message);
  }
});

panels.refs.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'ref-form') {
    const msg = form.querySelector('#ref-msg');
    const data = Object.fromEntries(REF_FIELDS.map(([key]) => [key, form.elements[key].value.trim()]));
    data.weightG = data.weightG === '' ? null : Number(data.weightG);
    data.price = data.price === '' ? null : Number(data.price);
    data.isEstimate = form.elements.isEstimate.checked;
    data.isExample = form.elements.isExample.checked;
    const id = form.dataset.id;
    try {
      await api('/api/admin/price-refs' + (id ? '/' + encodeURIComponent(id) : ''), {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      });
      await loadRefs();
      panels.refs.querySelector('#ref-msg').textContent = id ? 'Đã lưu.' : 'Đã thêm.';
    } catch (error) {
      msg.textContent = error.message;
    }
    return;
  }
  if (form.id === 'refs-import') {
    const msg = form.querySelector('#refs-import-msg');
    const file = form.file.files[0];
    if (!file) return;
    const mode = new FormData(form).get('mode');
    if (mode === 'replace' && !form.confirm.checked) {
      msg.textContent = 'Tick xác nhận trước khi thay toàn bộ bảng.';
      return;
    }
    const raw = await file.text();
    let body;
    if (/\.csv$/i.test(file.name) || file.type === 'text/csv') body = { csv: raw };
    else {
      try {
        body = JSON.parse(raw);
      } catch {
        msg.textContent = 'File không đọc được. Dùng file Xuất bảng (JSON hoặc CSV).';
        return;
      }
    }
    const params = new URLSearchParams({ mode });
    if (mode === 'replace') params.set('confirm', 'THAY-HET');
    try {
      const result = await api('/api/admin/price-refs/import?' + params.toString(), { method: 'POST', body: JSON.stringify(body) });
      await loadRefs();
      panels.refs.querySelector('#refs-import-msg').textContent = `Đã thêm ${result.added} dòng, cập nhật ${result.updated} dòng.`;
    } catch (error) {
      msg.textContent = error.message;
    }
  }
});

api('/api/admin/me').then(enter).catch(() => {});

function channelStatus(status) {
  if (status === 'ok') return 'ok';
  if (status === 'unconfigured') return 'không cấu hình';
  return 'lỗi';
}

document.querySelector('#tg-test')?.addEventListener('click', async () => {
  const msg = document.querySelector('#tg-test-msg');
  const button = document.querySelector('#tg-test');
  if (msg) msg.textContent = 'Đang gửi…';
  if (button) button.disabled = true;
  try {
    const data = await api('/api/admin/telegram-test', { method: 'POST', body: '{}' });
    const telegram = channelStatus(data.telegram?.status);
    const sheets = channelStatus(data.sheets?.status);
    if (msg) msg.textContent = `Telegram: ${telegram}. Google Sheet: ${sheets}.`;
  } catch (error) {
    if (msg) msg.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

// Danh mục tra cứu: giá bán lẻ, nguồn giá, ngày kiểm theo từng mã khối lượng.
async function loadCatalog() {
  const data = await api('/api/danh-muc');
  const rows = data.products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  const brandName = new Map(data.brands.map((b) => [b.id, b.name]));
  const today = new Date().toISOString().slice(0, 10);
  panels.catalog.innerHTML = `<p class="fine">Giá hiện ở trang <a href="/danh-muc" target="_blank" rel="noopener">/danh-muc</a> (xem So sánh). Nhập giá bán lẻ thường, không nhập giá khuyến mãi trên tem. Nguồn có thể là link hoặc ghi chú ngắn. Để trống cả 3 ô rồi Lưu là xoá giá.</p>
    <div class="backup-actions">
      <a class="btn btn--small" href="/api/admin/catalog-prices.json">Xuất giá danh mục (JSON)</a>
      <label class="btn btn--small btn--ghost">Nhập lại file giá <input type="file" id="cat-import" accept="application/json,.json" hidden></label>
    </div>
    <p class="fine" id="cat-msg" role="status"></p>
    <label class="field">Tìm <input id="cat-q" placeholder="Tên, nhãn hoặc mã"></label>
    <div class="refs-wrap"><table class="refs-table">
      <thead><tr><th>Mã</th><th>Sản phẩm</th><th>KL</th><th>Giá bán lẻ (đ)</th><th>Nguồn giá</th><th>Ngày kiểm</th><th></th></tr></thead>
      <tbody>${rows.map(({ p, v }) => `<tr data-code="${esc(v.code)}" data-hay="${esc((v.code + ' ' + p.name + ' ' + p.label + ' ' + brandName.get(p.brand)).toLowerCase())}">
        <td><code>${esc(v.code)}</code></td>
        <td><small>${esc(brandName.get(p.brand))} · ${esc(p.label)}</small><br>${esc(p.name)}</td>
        <td>${esc(v.weightLabel)}</td>
        <td><input name="price" inputmode="numeric" value="${v.price ?? ''}" size="9" aria-label="Giá ${esc(v.code)}"></td>
        <td><input name="source" value="${esc(v.priceSource)}" placeholder="https://…" aria-label="Nguồn giá ${esc(v.code)}"></td>
        <td><input name="checkedAt" type="date" value="${esc(v.priceCheckedAt)}" aria-label="Ngày kiểm ${esc(v.code)}"></td>
        <td><button class="btn btn--small" type="button" data-save-cat>Lưu</button> <span class="fine" data-cat-ok hidden>Đã lưu</span></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  panels.catalog.querySelector('#cat-q').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    panels.catalog.querySelectorAll('tbody tr').forEach((tr) => { tr.hidden = q && !tr.dataset.hay.includes(q); });
  });
  panels.catalog.querySelector('#cat-import').addEventListener('change', async (e) => {
    const msg = panels.catalog.querySelector('#cat-msg');
    const file = e.target.files[0];
    if (!file) return;
    try {
      const body = JSON.parse(await file.text());
      const r = await api('/api/admin/catalog-prices/import', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = `Đã nhập ${r.saved} mã, bỏ qua ${r.skipped} mã không còn trong danh mục.`;
      await loadCatalog();
    } catch (error) {
      msg.textContent = error.message;
    }
  });
  panels.catalog.onclick = async (e) => {
    const btn = e.target.closest('[data-save-cat]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const get = (n) => tr.querySelector(`[name="${n}"]`);
    if (get('price').value && !get('checkedAt').value) get('checkedAt').value = today;
    btn.disabled = true;
    try {
      await api('/api/admin/catalog-prices/' + encodeURIComponent(tr.dataset.code), {
        method: 'PUT',
        body: JSON.stringify({ price: get('price').value, source: get('source').value, checkedAt: get('checkedAt').value }),
      });
      tr.querySelector('[data-cat-ok]').hidden = false;
    } catch (error) {
      alert(error.message);
    } finally {
      btn.disabled = false;
    }
  };
}
