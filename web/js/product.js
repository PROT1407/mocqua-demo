import { add, money, toast } from './store.js';

const data = JSON.parse(document.querySelector('#product-data').textContent);
const params = new URLSearchParams(location.search);
let current = data.variants.find((v) => v.sku === params.get('sku'))
  || data.variants.find((v) => v.sku === data.defaultSku)
  || data.variants[0];

const main = document.querySelector('#pdp-main');
const kind = document.querySelector('#pdp-kind');
const thumbs = document.querySelector('#pdp-thumbs');
const price = document.querySelector('#pdp-price');
const unit = document.querySelector('#pdp-unit');
const weights = document.querySelector('#pdp-weights');
const packs = document.querySelector('#pdp-packs');
const packWrap = document.querySelector('#pdp-pack-wrap');
const qty = document.querySelector('#pdp-qty');
const stickyPrice = document.querySelector('#pdp-sticky-price');
const stickyLabel = document.querySelector('#pdp-sticky-label');

function text(value) {
  return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function groups() {
  const seen = new Map();
  for (const variant of data.variants) {
    if (!seen.has(variant.group)) seen.set(variant.group, variant);
  }
  return [...seen.values()];
}

function pick(group, pack) {
  const same = data.variants.filter((v) => v.group === group);
  if (pack) {
    const hit = same.find((v) => v.pack === pack);
    if (hit) return hit;
  }
  return same.find((v) => v.sku === data.defaultSku) || same[0];
}

function gallery(variant) {
  const list = [];
  if (variant.img) list.push({ src: variant.img, alt: `${data.name}, bao bì ${variant.label}`, kind: 'Bao bì' });
  if (variant.back && variant.back !== variant.img) list.push({ src: variant.back, alt: `${data.name}, mặt sau`, kind: 'Mặt sau' });
  if (data.open?.src) list.push({ src: data.open.src, alt: data.open.cap || 'Mở túi', kind: 'Mở túi' });
  if (data.shelf?.src) list.push({ src: data.shelf.src, alt: data.shelf.cap || 'Trên kệ', kind: 'Trên kệ' });
  if (!list.length && data.open?.src) list.push({ src: data.open.src, alt: data.name, kind: 'Ảnh' });
  return list;
}

function showImage(list, index) {
  const image = list[index] || list[0];
  if (!image) return;
  main.src = image.src;
  main.alt = image.alt;
  kind.textContent = image.kind;
  thumbs.querySelectorAll('button').forEach((button, i) => button.classList.toggle('is-on', i === index));
}

function render() {
  const images = gallery(current);
  thumbs.innerHTML = images.map((image, index) => `<button type="button" data-i="${index}"><img src="${text(image.src)}" alt=""><span>${text(image.kind)}</span></button>`).join('');
  showImage(images, 0);
  weights.innerHTML = groups().map((variant) => {
    const sample = pick(variant.group, current.pack);
    const on = variant.group === current.group;
    return `<button type="button" class="choice${on ? ' is-on' : ''}" data-group="${text(variant.group)}"><b>${text(variant.label)}</b><small>${sample.price ? money(sample.price) : 'Liên hệ'}</small></button>`;
  }).join('');
  if (data.packs) {
    packWrap.hidden = false;
    packs.innerHTML = Object.entries(data.packs).map(([key, pack]) => {
      const has = data.variants.some((v) => v.group === current.group && v.pack === key);
      const on = current.pack === key;
      const c0 = pack.colors?.[0] || '#fff';
      const c1 = pack.colors?.[1] || c0;
      return `<button type="button" class="swatch${on ? ' is-on' : ''}" data-pack="${text(key)}" ${has ? '' : 'disabled'}><i style="background:linear-gradient(180deg, ${text(c0)} 0 52%, ${text(c1)} 52%)"></i><span>${text(pack.name)}</span></button>`;
    }).join('');
  } else {
    packWrap.hidden = true;
  }
  if (current.price) {
    price.textContent = money(current.price);
    unit.textContent = current.g ? `Khoảng ${money(Math.round(current.price / current.g * 100))} / 100g` : '';
  } else {
    price.textContent = 'Liên hệ';
    unit.textContent = 'Món này chưa có giá trên web.';
  }
  stickyPrice.textContent = current.price ? money(current.price) : 'Liên hệ';
  stickyLabel.textContent = current.label;
  document.querySelectorAll('[data-add]').forEach((button) => {
    button.disabled = data.oos || !current.price;
  });
  const url = new URL(location.href);
  url.searchParams.set('sku', current.sku);
  history.replaceState(null, '', url);
}

weights.addEventListener('click', (event) => {
  const button = event.target.closest('[data-group]');
  if (!button) return;
  current = pick(button.dataset.group, current.pack);
  render();
});

packs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-pack]');
  if (!button || button.disabled) return;
  current = pick(current.group, button.dataset.pack);
  render();
});

thumbs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-i]');
  if (!button) return;
  showImage(gallery(current), Number(button.dataset.i));
});

function buy() {
  if (data.oos || !current.price) return;
  const count = Math.max(1, Math.min(99, Math.floor(Number(qty.value) || 1)));
  add(current.sku, count);
  toast('Đã cho vào giỏ.', { href: '/gio-hang', label: 'Xem giỏ' });
}

document.querySelector('#pdp-add').addEventListener('click', buy);
document.querySelector('#pdp-add-2').addEventListener('click', buy);
render();
