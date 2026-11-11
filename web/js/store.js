const KEY = 'mq_cart_v2';

export function money(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + 'đ';
}

const SKU_RE = /^[A-Za-z0-9._+-]{1,80}$/;

export function lineKey(item) {
  if (!item?.slots?.length) return item?.sku || '';
  return `${item.sku}~${item.slots.map((sku) => sku || '-').join('.')}`;
}

function cleanSlots(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 12) return null;
  const slots = [];
  for (const value of raw) {
    if (value == null || value === '') {
      slots.push(null);
      continue;
    }
    const sku = String(value).trim();
    if (!SKU_RE.test(sku)) return null;
    slots.push(sku);
  }
  return slots.some(Boolean) ? slots : null;
}

export function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      if (!item || typeof item.sku !== 'string' || !(item.qty > 0) || !SKU_RE.test(item.sku)) return [];
      const next = { sku: item.sku, qty: Math.min(99, Math.floor(Number(item.qty))) };
      if (Array.isArray(item.slots) && item.slots.length) {
        const slots = cleanSlots(item.slots);
        if (!slots) return [];
        next.slots = slots;
      }
      return [next];
    });
  } catch {
    return [];
  }
}

export function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  refresh();
}

export function add(sku, qty = 1, slots = null) {
  const items = read();
  const row = { sku, qty, ...(Array.isArray(slots) && slots.length ? { slots } : {}) };
  const key = lineKey(row);
  const hit = items.find((item) => lineKey(item) === key);
  if (hit) hit.qty = Math.min(99, hit.qty + qty);
  else items.push(row);
  write(items);
}

export function setQty(key, qty) {
  const items = qty > 0
    ? read().map((item) => (lineKey(item) === key ? { ...item, qty: Math.min(99, qty) } : item))
    : read().filter((item) => lineKey(item) !== key);
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
