import { clearCart, money, read } from './store.js';

const form = document.querySelector('#co-form');
const summary = document.querySelector('#co-summary');
const err = document.querySelector('#co-err');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function rows(data) {
  const items = data.items.map((item) => `<li><span><b>${esc(item.name)}</b><small>${esc(item.w)} · × ${item.qty}</small></span><b>${money(item.line)}</b></li>`).join('');
  const gifts = (data.gifts || []).map((item) => `<li class="giftline"><span><b>${esc(item.name)}</b><small>${esc(item.w)} · × ${item.qty}</small></span><b>0đ</b></li>`).join('');
  return `<ul class="lines">${items}${gifts}</ul>
    <p class="hint">${data.hint || ''}</p>
    <p class="sumrow"><span>Tiền hàng</span><b>${money(data.subtotal)}</b></p>
    <p class="sumrow"><span>Giao hàng</span><b>${data.ship ? money(data.ship) : 'Miễn phí'}</b></p>
    <p class="sumrow sumrow--due"><span>Cần trả</span><b>${money(data.total)}</b></p>`;
}

async function load() {
  const items = read();
  if (!items.length) {
    form.innerHTML = `<div class="empty"><h2>Giỏ đang trống.</h2><p>Chọn món trước khi đặt.</p><a class="btn" href="/cua-hang">Vào cửa hàng</a></div>`;
    return;
  }
  const res = await fetch('/api/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    summary.innerHTML = `<p class="formerr">${data.error || 'Chưa tính được giỏ.'}</p>`;
    return;
  }
  summary.innerHTML = rows(data);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  err.textContent = '';
  const body = Object.fromEntries(new FormData(form).entries());
  body.items = read();
  const button = form.querySelector('[type="submit"]');
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
    err.textContent = error.message;
    button.disabled = false;
    button.textContent = 'Đặt hàng';
  }
});

load();
