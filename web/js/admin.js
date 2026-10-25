const loginPanel = document.querySelector('#login-panel');
const dash = document.querySelector('#dash');
const loginErr = document.querySelector('#login-err');
const bankWarn = document.querySelector('#bank-warn');
const panels = {
  orders: document.querySelector('#panel-orders'),
  prices: document.querySelector('#panel-prices'),
  promo: document.querySelector('#panel-promo'),
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
    const lines = order.items.map((item) => `<li>${item.qty} × ${esc(item.name)} · ${esc(item.w)} · ${money(item.line)}</li>`).join('');
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
      <p class="order__total">${money(order.summary.total)}</p>
      <p class="fine" data-saved hidden>Đã lưu trạng thái.</p>
    </article>`;
  }).join('');
}

async function loadPrices() {
  const data = await api('/api/admin/products');
  panels.prices.innerHTML = `<label class="field">Tìm <input id="price-q" placeholder="Tên hoặc mã"></label><div id="price-list"></div>`;
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
        <div><b>${esc(variant.label)}</b><small>${esc(variant.sku)}<br>Giá gốc ${money(variant.catalogPrice)}${variant.overridden ? ' · đang ghi đè' : ''}</small></div>
        <input data-price="${esc(variant.sku)}" inputmode="numeric" value="${variant.price ?? ''}" aria-label="Giá ${esc(variant.sku)}">
        <button class="btn btn--small" type="button" data-save-price="${esc(variant.sku)}">Lưu giá</button>
        <button class="textbtn" type="button" data-reset-price="${esc(variant.sku)}">Về giá gốc</button>
      </div>`).join('')}</div>
    </article>`).join('') || '<p>Không thấy món nào.</p>';
  };
  input.oninput = draw;
  draw();
}

async function loadPromo() {
  const data = await api('/api/admin/settings');
  const s = data.settings;
  panels.promo.innerHTML = `<form id="promo-form" class="fields">
    <p class="lead lead--left">Đơn từ mức bên dưới được 1 gói. Hoặc cứ đủ số túi xoài (từ khối lượng ghi bên dưới) thì được 1 gói. Lấy mức nhiều hơn, không cộng hai cách, và không vượt số gói tối đa.</p>
    <label class="field">Đơn từ (đồng) <input name="giftMin" inputmode="numeric" value="${s.giftMin}" required></label>
    <label class="field">Số túi xoài để tặng 1 gói <input name="giftPair" inputmode="numeric" value="${s.giftPair}" required></label>
    <label class="field">Túi tính là túi lớn, từ (gram) <input name="giftMinG" inputmode="numeric" value="${s.giftMinG}" required></label>
    <label class="field">Tối đa số gói quà <input name="giftMax" inputmode="numeric" value="${s.giftMax}" required></label>
    <label class="field">Mã quà trong danh mục <input name="giftSku" value="${s.giftSku}" required></label>
    <input type="hidden" name="giftProductId" value="${s.giftProductId}">
    <label class="field">Miễn phí giao từ (đồng) <input name="freeShip" inputmode="numeric" value="${s.freeShip}" required></label>
    <label class="field">Phí giao nếu chưa đủ mức (đồng) <input name="shipFee" inputmode="numeric" value="${s.shipFee}" required></label>
    <label class="check"><input type="checkbox" name="codEnabled"${s.codEnabled ? ' checked' : ''}> Cho phép trả khi nhận hàng</label>
    <button class="btn" type="submit">Lưu quy tắc quà</button>
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

async function enter() {
  const me = await api('/api/admin/me');
  loginPanel.hidden = true;
  dash.hidden = false;
  bankWarn.hidden = me.bankReady;
  await Promise.all([loadOrders(), loadPrices(), loadPromo()]);
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

panels.prices.addEventListener('click', async (event) => {
  const savePrice = event.target.closest('[data-save-price]');
  const resetPrice = event.target.closest('[data-reset-price]');
  const saveCopy = event.target.closest('[data-save-copy]');
  try {
    if (savePrice) {
      const sku = savePrice.dataset.savePrice;
      const input = panels.prices.querySelector(`[data-price="${CSS.escape(sku)}"]`);
      await api('/api/admin/variants/' + encodeURIComponent(sku), {
        method: 'PATCH',
        body: JSON.stringify({ price: Number(input.value) }),
      });
      savePrice.textContent = 'Đã lưu';
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

api('/api/admin/me').then(enter).catch(() => {});
