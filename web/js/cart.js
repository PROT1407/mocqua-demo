import { money, read, write, add, setQty, clearCart, refresh, toast, lineKey } from './store.js';
import { applyNudge, kShort } from './cart-core.js';

let nudges = [];

const root = document.querySelector('#cart-body');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Gợi ý combo: một dòng gọn, chỉ hiện khi đổi/thêm thật sự rẻ hơn (server tính cả % giảm theo đơn và phí giao).
function nudgeLine(n, i) {
  const msg = n.kind === 'swap'
    ? `Đổi sang combo, tiết kiệm ${kShort(n.save)}`
    : `Thêm 1 túi ${esc(n.addName)} thành combo, rẻ hơn ${kShort(n.save)}`;
  return `<div class="nudge">
    <a class="nudge__img" href="${esc(n.href)}"><img src="${esc(n.img)}" alt="" width="56" height="56" loading="lazy"></a>
    <p class="nudge__txt"><b>${msg}</b><small>${esc(n.name)} · ${money(n.price)} <s>${money(n.sum)}</s></small></p>
    <button type="button" class="btn btn--small" data-nudge="${i}">${n.kind === 'swap' ? 'Đổi' : 'Thêm'}</button>
  </div>`;
}

function shipLine(bar) {
  if (!bar) return '';
  const perk = bar.withPct ? `giảm ${bar.withPct}% + miễn ship` : 'miễn ship';
  if (!bar.need) return `<div class="shipbar is-done"><p><span>Đơn được miễn ship</span></p><div class="shipbar__track"><i style="width:100%"></i></div></div>`;
  const s = bar.suggest;
  return `<div class="shipbar">
    <p><span>Còn <b>${kShort(bar.need)}</b> nữa được ${perk}</span><small>từ ${kShort(bar.freeShip)}</small></p>
    <div class="shipbar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${bar.pct}" aria-label="Tiến tới miễn ship"><i style="width:${bar.pct}%"></i></div>
    ${s ? `<div class="shipbar__pick"><img src="${esc(s.img)}" alt="" width="40" height="40" loading="lazy"><span>Vừa đủ: <a href="${esc(s.href)}">${esc(s.name)}</a> · ${money(s.price)}${s.save ? ` <em>tiết kiệm ${kShort(s.save)}</em>` : ''}</span><button type="button" class="textbtn" data-ship-add="${esc(s.sku)}">+ Thêm</button></div>` : ''}
  </div>`;
}

function contentsOf(item) {
  if (!Array.isArray(item.contents) || !item.contents.length) return '';
  return `<small class="contents">${esc(item.contents.map((row) => `${row.name} ${row.grams}g`).join(' · '))}</small>`;
}

function line(item, gift) {
  const img = item.img ? `<img src="${esc(item.img)}" alt="">` : '<span class="ph"></span>';
  const key = esc(lineKey(item));
  const qty = gift
    ? `<span class="giftqty">× ${item.qty}</span>`
    : `<div class="stepper"><button type="button" data-dec="${key}" aria-label="Giảm">−</button><span>${item.qty}</span><button type="button" data-inc="${key}" aria-label="Tăng">+</button></div>`;
  const si = !gift && item.wholesalePct ? `<small>Giá sỉ −${item.wholesalePct}%</small>` : '';
  return `<li class="${gift ? 'giftline' : ''}">
    ${img}
    <div>
      <b>${esc(item.name)}</b>
      <small>${esc(item.w || '')}${gift && item.retail ? ` · giá bán ${money(item.retail)}` : ''}${item.combo ? ' · combo, cũng được giảm theo đơn' : ''}</small>
      ${contentsOf(item)}
      ${si}
      ${gift ? '' : `<button type="button" class="textbtn" data-del="${key}">Bỏ</button>`}
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
  let res;
  try {
    res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  } catch {
    root.innerHTML = `<div class="empty"><h2>Chưa có mạng.</h2><p>Giỏ vẫn còn ${items.length} món trên máy. Có mạng thì bấm thử lại để tính tiền.</p><button class="btn" type="button" id="cart-retry">Thử lại</button></div>`;
    document.querySelector('#cart-retry')?.addEventListener('click', () => draw());
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    root.innerHTML = `<div class="empty"><h2>Giỏ chưa tính được.</h2><p>${data.error || 'Bạn thử lại giúp.'}</p><button class="btn" type="button" id="cart-clear">Xoá giỏ và chọn lại</button></div>`;
    document.querySelector('#cart-clear')?.addEventListener('click', () => {
      clearCart();
      draw();
    });
    return;
  }
  nudges = data.nudges || [];
  root.innerHTML = `
    <ul class="cartlines">${data.items.map((item) => line(item, false)).join('')}${(data.gifts || []).map((item) => line(item, true)).join('')}</ul>
    ${nudges.length ? nudgeLine(nudges[0], 0) : ''}
    ${shipLine(data.shipBar)}
    <p class="hint">${(data.shipBar ? data.cartHint : data.hint) || ''}</p>
    <div class="totals">
      <p><span>Tiền hàng</span><b>${money(data.subtotal)}</b></p>
      ${data.discount ? `<p class="totals__discount"><span>${data.siNote && data.discountLabel ? esc(data.discountLabel) : `Giảm ${data.discountPct}% theo đơn${data.comboSubtotal ? ' <small>(gồm cả combo)</small>' : ''}`}</span><b>−${money(data.discount)}</b></p>` : ''}
      ${data.siNote ? `<p class="hint">${esc(data.siNote)}</p>` : ''}
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
    const item = read().find((row) => lineKey(row) === dec.dataset.dec);
    setQty(dec.dataset.dec, (item?.qty || 1) - 1);
    draw();
  }
  if (inc) {
    const item = read().find((row) => lineKey(row) === inc.dataset.inc);
    setQty(inc.dataset.inc, (item?.qty || 0) + 1);
    draw();
  }
  const nudge = event.target.closest('[data-nudge]');
  if (nudge) {
    const n = nudges[Number(nudge.dataset.nudge)];
    if (n) {
      write(applyNudge(read(), n));
      refresh();
      toast(n.kind === 'swap' ? `Đã đổi sang ${n.name}.` : `Đã ghép thành ${n.name}.`);
      draw();
    }
  }
  const shipAdd = event.target.closest('[data-ship-add]');
  if (shipAdd) {
    add(shipAdd.dataset.shipAdd, 1);
    draw();
  }
  if (del) {
    setQty(del.dataset.del, 0);
    draw();
  }
});

draw();
