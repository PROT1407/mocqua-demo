import { productGallery } from './gallery-list.js';
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
const oosNote = document.querySelector('#pdp-oos');
const alts = document.querySelector('#pdp-alts');
const tryLine = document.querySelector('#pdp-try');

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
  const custom = data.variantGalleries?.[variant?.sku];
  if (Array.isArray(custom) && custom.length) return productGallery({ ...data, gallery: custom }, variant);
  return productGallery(data, variant);
}

// Ảnh 4:5 nhiều túi đứng cạnh nhau (data.fit45) hiện trọn khung 4:5, không cắt mất túi hai bên; ảnh khác giữ khung cũ.
const saveTag = document.querySelector('#pdp-save');
const fit45 = new Set(data.fit45 || []);
function fitMain() {
  main.classList.toggle('is-45', fit45.has(new URL(main.src, location.href).pathname));
}
fitMain();

function showImage(list, index) {
  const image = list[index] || list[0];
  if (!image) return;
  main.src = image.src;
  fitMain();
  main.alt = image.alt;
  kind.textContent = image.kind;
  thumbs.querySelectorAll('button').forEach((button, i) => button.classList.toggle('is-on', i === index));
}

function render() {
  const images = gallery(current);
  thumbs.innerHTML = images.map((image, index) => `<button type="button" data-i="${index}"><img src="${text(image.src)}" alt="${text(image.alt || data.name)}"><span>${text(image.kind)}</span></button>`).join('');
  showImage(images, 0);
  weights.innerHTML = groups().map((variant) => {
    const sample = pick(variant.group, current.pack);
    const on = variant.group === current.group;
    return `<button type="button" class="choice${on ? ' is-on' : ''}" data-group="${text(variant.group)}"><b>${text(variant.label || variant.w)}</b><small>${sample.price ? money(sample.price) : 'Liên hệ'}</small></button>`;
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
  const deal = data.deals?.[current.sku];
  saveTag.hidden = !deal;
  saveTag.textContent = deal ? `Tiết kiệm ${Math.round(deal.save / 1000)}k` : '';
  if (current.price) {
    const was = current.compareAt > current.price ? ` <span class="was"><s>${money(current.compareAt)}</s></span>` : '';
    const badge = current.promo?.label ? ` <span class="kmbadge">${text(current.promo.label)}</span>` : '';
    const limited = current.limited ? ' <span class="kmbadge">Phiên bản giới hạn</span>' : '';
    price.innerHTML = `${money(current.price)}${was}${badge}${limited}`;
    if (deal) price.insertAdjacentHTML('beforeend', ` <span class="was">mua lẻ <s>${money(deal.sum)}</s></span>`);
    if (current.bags > 1) unit.textContent = `${current.bags} túi · ${money(Math.round(current.price / current.bags))} / túi`;
    else unit.textContent = current.g ? `Khoảng ${money(Math.round(current.price / current.g * 100))} / 100g` : '';
  } else {
    price.textContent = 'Liên hệ';
    unit.textContent = 'Món này chưa có giá trên web.';
  }
  stickyPrice.textContent = current.price ? money(current.price) : 'Liên hệ';
  stickyLabel.textContent = current.label || current.w || '';
  const gone = data.oos || current.oos || !current.price;
  document.querySelectorAll('[data-add]').forEach((button) => {
    button.disabled = gone;
    button.textContent = data.oos || current.oos ? 'Hết hàng' : 'Cho vào giỏ';
  });
  const swaps = (data.oos || current.oos) ? (data.swaps?.[current.sku] || []) : [];
  if (oosNote) oosNote.hidden = !(data.oos || current.oos);
  if (alts) {
    alts.hidden = !swaps.length;
    alts.innerHTML = swaps.length ? `<h2>Gợi ý thay thế</h2><div class="alts__row">${swaps.map((item) => `<article class="alt">
          <a href="${text(item.href)}"><img src="${text(item.img)}" alt="${text(item.name)}" width="64" height="80" loading="lazy"></a>
      <div><a href="${text(item.href)}">${text(item.name)}</a>${item.pitch ? `<small>${text(item.pitch)}</small>` : ''}<b>${money(item.price)}</b></div>
      <button type="button" class="btn btn--small" data-alt-add="${text(item.sku)}">Đặt ngay</button>
    </article>`).join('')}</div>` : '';
  }
  if (tryLine && data.tries) {
    const items = data.tries[current.sku] || [];
    if (!items.length) {
      tryLine.hidden = true;
      tryLine.textContent = '';
    } else {
      tryLine.hidden = false;
      tryLine.innerHTML = `Bạn muốn thử từng vị? ${items.map((item) => `<a href="${text(item.href)}">${text(item.label)} · ${money(item.price)}</a>`).join(' · ')}`;
    }
  }
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
  if (data.oos || current.oos || !current.price) return;
  const count = Math.max(1, Math.min(99, Math.floor(Number(qty.value) || 1)));
  add(current.sku, count);
  toast('Đã cho vào giỏ.', { href: '/gio-hang', label: 'Xem giỏ' });
}

document.querySelector('#pdp-add').addEventListener('click', buy);
document.querySelector('#pdp-add-2').addEventListener('click', buy);
alts?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-alt-add]');
  if (!button) return;
  add(button.dataset.altAdd, 1);
  toast('Đã cho vào giỏ.', { href: '/gio-hang', label: 'Xem giỏ' });
});
render();
