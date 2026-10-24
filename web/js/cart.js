import { money, read, setQty, clearCart } from './store.js';

const root = document.querySelector('#cart-body');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function line(item, gift) {
  const img = item.img ? `<img src="${esc(item.img)}" alt="">` : '<span class="ph"></span>';
  const qty = gift
    ? `<span class="giftqty">× ${item.qty}</span>`
    : `<div class="stepper"><button type="button" data-dec="${item.sku}" aria-label="Giảm">−</button><span>${item.qty}</span><button type="button" data-inc="${item.sku}" aria-label="Tăng">+</button></div>`;
  return `<li class="${gift ? 'giftline' : ''}">
    ${img}
    <div>
      <b>${esc(item.name)}</b>
      <small>${esc(item.w || '')}${gift && item.retail ? ` · giá bán ${money(item.retail)}` : ''}</small>
      ${gift ? '' : `<button type="button" class="textbtn" data-del="${item.sku}">Bỏ</button>`}
    </div>
    ${qty}
    <strong>${gift ? '0đ' : money(item.line)}</strong>
  </li>`;
}

async function draw() {
  const items = read();
  if (!items.length) {
    root.innerHTML = `<div class="empty"><h2>Giỏ đang trống.</h2><p>Bạn chọn cách sấy, rồi cho túi vào giỏ.</p><a class="btn" href="/cua-hang">Vào cửa hàng</a></div>`;
    return;
  }
  const res = await fetch('/api/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    root.innerHTML = `<div class="empty"><h2>Giỏ chưa tính được.</h2><p>${data.error || 'Bạn thử lại giúp.'}</p><button class="btn" type="button" id="cart-clear">Xoá giỏ và chọn lại</button></div>`;
    document.querySelector('#cart-clear')?.addEventListener('click', () => {
      clearCart();
      draw();
    });
    return;
  }
  root.innerHTML = `
    <ul class="cartlines">${data.items.map((item) => line(item, false)).join('')}${(data.gifts || []).map((item) => line(item, true)).join('')}</ul>
    <p class="hint">${data.hint || ''}</p>
    <div class="totals">
      <p><span>Tiền hàng</span><b>${money(data.subtotal)}</b></p>
      <p><span>Giao hàng</span><b>${data.ship ? money(data.ship) : 'Miễn phí'}</b></p>
      <p class="totals__due"><span>Cần trả</span><b>${money(data.total)}</b></p>
    </div>
    <a class="btn btn--wide" href="/thanh-toan">Đặt hàng</a>`;
}

root.addEventListener('click', (event) => {
  const dec = event.target.closest('[data-dec]');
  const inc = event.target.closest('[data-inc]');
  const del = event.target.closest('[data-del]');
  if (dec) {
    const item = read().find((row) => row.sku === dec.dataset.dec);
    setQty(dec.dataset.dec, (item?.qty || 1) - 1);
    draw();
  }
  if (inc) {
    const item = read().find((row) => row.sku === inc.dataset.inc);
    setQty(inc.dataset.inc, (item?.qty || 0) + 1);
    draw();
  }
  if (del) {
    setQty(del.dataset.del, 0);
    draw();
  }
});

draw();
