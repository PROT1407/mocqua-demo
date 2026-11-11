import { add, money, toast } from './store.js';
import { boxPrice, quoteBox, slotRetail } from './giftbox-core.js';

const data = JSON.parse(document.querySelector('#gift-data').textContent);
const state = {
  qty: 1,
  slots: data.slots.map((slot) => (slot.locked ? null : slot.sku)),
};
let openIndex = -1;

const unitEl = document.querySelector('#gift-unit');
const lineEl = document.querySelector('#gift-line');
const wasEl = document.querySelector('#gift-was');
const noteEl = document.querySelector('#gift-note');
const qtyEl = document.querySelector('#gift-qty');
const dialog = document.querySelector('#gift-chooser');
const listEl = document.querySelector('#gift-options');
const searchEl = document.querySelector('#gift-q');

function slotView(slot, index) {
  if (slot.locked) return { ...slot, retail: 0 };
  const sku = state.slots[index];
  const opt = data.options.find((row) => row.sku === sku);
  const source = opt || slot;
  return {
    ...slot,
    sku,
    name: source.name,
    img: source.img || '',
    w: source.w || slot.w,
    price: source.price,
    packGrams: source.grams || slot.packGrams,
    retail: slotRetail(source.price, source.grams || slot.packGrams, slot.grams),
  };
}

function paintSlot(slot, index) {
  const row = document.querySelector(`[data-slot="${index}"]`);
  if (!row) return;
  const img = row.querySelector('.gslot__img');
  const name = row.querySelector('b');
  const meta = row.querySelector('small');
  if (img) img.innerHTML = slot.img ? `<img src="${slot.img}" alt="" width="64" height="64">` : '';
  if (name) name.textContent = slot.name;
  if (meta) meta.textContent = slot.locked ? `${slot.label} · ${slot.grams}g` : `${slot.w || ''} · ngăn ${slot.grams}g`;
}

function render() {
  const slots = data.slots.map(slotView);
  slots.forEach(paintSlot);
  const fruit = slots.reduce((sum, slot) => sum + (slot.locked ? 0 : slot.retail), 0);
  const unit = boxPrice({ listed: data.listed, baseFruit: data.baseFruit, fruit });
  const quote = quoteBox({ unit, qty: state.qty, tiers: data.tiers });
  const each = Math.round(quote.pay / quote.qty);
  unitEl.textContent = money(each);
  lineEl.textContent = money(quote.pay);
  if (quote.pct > 0) {
    wasEl.hidden = false;
    wasEl.textContent = money(quote.unit);
  } else {
    wasEl.hidden = true;
  }
  noteEl.textContent = quote.note;
  document.querySelectorAll('[data-qty]').forEach((button) => {
    button.classList.toggle('is-on', Number(button.dataset.qty) === state.qty);
  });
  return { slots, quote };
}

function setQty(next) {
  const qty = Math.min(99, Math.max(1, Math.floor(Number(next) || 1)));
  state.qty = qty;
  qtyEl.value = String(qty);
  render();
}

function openChooser(index) {
  const slot = data.slots[index];
  if (!slot || slot.locked) return;
  openIndex = index;
  searchEl.value = '';
  fillOptions('');
  document.querySelector('#gift-chooser-title').textContent = `Đổi vị · ngăn ${slot.grams}g`;
  dialog.showModal();
  searchEl.focus();
}

function fillOptions(query) {
  const slot = data.slots[openIndex];
  if (!slot) return;
  const q = query.trim().toLowerCase();
  const rows = data.options.filter((row) => row.kind === slot.kind && (!q || row.name.toLowerCase().includes(q) || row.w.toLowerCase().includes(q)));
  listEl.replaceChildren();
  for (const row of rows) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'opt' + (row.sku === state.slots[openIndex] ? ' is-on' : '');
    const part = slotRetail(row.price, row.grams, slot.grams);
    button.innerHTML = `${row.img ? `<img src="${row.img}" alt="" width="56" height="56">` : '<span class="ph"></span>'}<span><b></b><small></small></span>`;
    button.querySelector('b').textContent = row.name;
    button.querySelector('small').textContent = `${row.w} · ngăn này khoảng ${money(part)}`;
    button.addEventListener('click', () => {
      state.slots[openIndex] = row.sku;
      dialog.close();
      render();
    });
    listEl.append(button);
  }
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'fine';
    empty.textContent = 'Không thấy vị phù hợp.';
    listEl.append(empty);
  }
}

document.querySelector('.gslots').addEventListener('click', (event) => {
  const button = event.target.closest('[data-swap]');
  if (!button) return;
  openChooser(Number(button.dataset.swap));
});

document.querySelector('.qtyrow').addEventListener('click', (event) => {
  if (event.target.closest('[data-qty-dec]')) setQty(state.qty - 1);
  if (event.target.closest('[data-qty-inc]')) setQty(state.qty + 1);
  const chip = event.target.closest('[data-qty]');
  if (chip) setQty(chip.dataset.qty);
});

qtyEl.addEventListener('change', () => setQty(qtyEl.value));
searchEl.addEventListener('input', () => fillOptions(searchEl.value));

document.querySelector('#gift-add').addEventListener('click', () => {
  const { slots, quote } = render();
  add(data.sku, quote.qty, slots.map((slot) => (slot.locked ? null : slot.sku)));
  toast('Đã cho hộp vào giỏ.', { href: '/gio-hang', label: 'Xem giỏ' });
});

render();
