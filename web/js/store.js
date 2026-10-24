const KEY = 'mq_cart_v2';

export function money(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + 'đ';
}

export function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item.sku === 'string' && item.qty > 0)
      .map((item) => ({ sku: item.sku, qty: Math.min(99, Math.floor(Number(item.qty))) }));
  } catch {
    return [];
  }
}

export function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  refresh();
}

export function add(sku, qty = 1) {
  const items = read();
  const hit = items.find((item) => item.sku === sku);
  if (hit) hit.qty = Math.min(99, hit.qty + qty);
  else items.push({ sku, qty });
  write(items);
}

export function setQty(sku, qty) {
  const items = qty > 0
    ? read().map((item) => (item.sku === sku ? { ...item, qty: Math.min(99, qty) } : item))
    : read().filter((item) => item.sku !== sku);
  write(items.filter((item) => item.qty > 0));
}

export function clearCart() {
  write([]);
}

export function refresh() {
  const count = read().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
  });
}

let timer;
export function toast(message, link) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.replaceChildren(document.createTextNode(message));
  if (link) {
    el.append(document.createTextNode(' '));
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    el.append(a);
  }
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.hidden = true;
  }, 3400);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-sku]');
  if (!button) return;
  add(button.dataset.addSku, 1);
  toast('Đã cho vào giỏ.', { href: '/gio-hang', label: 'Xem giỏ' });
});

refresh();
