import { clearCart, money, read } from './store.js';

const form = document.querySelector('#co-form');
const summary = document.querySelector('#co-summary');
const err = document.querySelector('#co-err');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function rows(data) {
  const items = data.items.map((item) => `<li><span><b>${esc(item.name)}</b><small>${esc(item.w)} · × ${item.qty}${item.combo ? ' · combo' : ''}</small></span><b>${money(item.line)}</b></li>`).join('');
  const gifts = (data.gifts || []).map((item) => `<li class="giftline"><span><b>${esc(item.name)}</b><small>${esc(item.w)} · × ${item.qty}</small></span><b>0đ</b></li>`).join('');
  return `<ul class="lines">${items}${gifts}</ul>
    <p class="hint">${data.hint || ''}</p>
    <p class="sumrow"><span>Tiền hàng</span><b>${money(data.subtotal)}</b></p>
    ${data.discount ? `<p class="sumrow sumrow--discount"><span>Giảm ${data.discountPct}% theo đơn${data.comboSubtotal ? ' <small>(không áp cho combo)</small>' : ''}</span><b>−${money(data.discount)}</b></p>` : ''}
    <p class="sumrow"><span>Giao hàng</span><b>${data.ship ? money(data.ship) : 'Miễn phí'}</b></p>
    <p class="sumrow sumrow--due"><span>Cần trả</span><b>${money(data.total)}</b></p>`;
}

function ctaLabel() {
  const pay = form.querySelector('input[name="pay"]:checked');
  return pay && pay.value === 'cod' ? 'Đặt hàng' : 'Đặt và hiện mã QR';
}

async function load() {
  const items = read();
  const due = document.querySelector('#co-due');
  if (!items.length) {
    form.innerHTML = `<div class="empty"><h2>Giỏ đang trống.</h2><p>Chọn món trước khi đặt.</p><a class="btn" href="/cua-hang">Vào cửa hàng</a></div>`;
    return;
  }
  let res;
  try {
    res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  } catch {
    summary.innerHTML = '<p class="formerr">Chưa có mạng. Giỏ vẫn còn. Khi có mạng, tải lại trang để tính tiền.</p>';
    if (due) due.textContent = 'Cần mạng';
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    summary.innerHTML = `<p class="formerr">${data.error || 'Chưa tính được giỏ.'}</p>`;
    return;
  }
  summary.innerHTML = rows(data);
  if (due) due.textContent = money(data.total);
  const button = document.querySelector('#co-submit');
  if (button) button.textContent = ctaLabel();
}

form.addEventListener('change', (event) => {
  if (event.target.name !== 'pay') return;
  const button = document.querySelector('#co-submit');
  if (button) button.textContent = ctaLabel();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  err.textContent = '';
  const body = Object.fromEntries(new FormData(form).entries());
  body.items = read();
  const button = form.querySelector('[type="submit"]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Đang ghi đơn…';
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Chưa đặt được đơn.');
    clearCart();
    location.href = data.url;
  } catch (error) {
    const lost = error.name === 'TypeError' || error.message === 'Failed to fetch';
    err.textContent = lost ? 'Chưa có mạng. Giỏ vẫn còn. Khi có mạng, bấm đặt lại.' : error.message;
    button.disabled = false;
    button.textContent = ctaLabel();
  }
});

load();
