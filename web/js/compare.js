// Bảng so sánh Thương hiệu → Nhãn → Khối lượng. Mọi chuỗi đều qua esc() trước khi vào HTML.
const OWN = 'Mộc Quả';
const MAX_PICK = 4;
const WEIGHT_BUCKETS = [
  ['s', '≤ 100g', (g) => g != null && g <= 100],
  ['m', '101–250g', (g) => g > 100 && g <= 250],
  ['l', '251–500g', (g) => g > 250 && g <= 500],
  ['xl', '> 500g', (g) => g > 500],
  ['na', 'Chưa rõ g', (g) => g == null],
];

const rows = JSON.parse(document.querySelector('#price-refs-data')?.textContent || '[]');
const byId = new Map(rows.map((r) => [r.id, r]));
const state = { brand: new Set(), label: new Set(), fruit: new Set(), weight: new Set(), picked: [] };

const $filters = document.querySelector('#cmp-filters');
const $tree = document.querySelector('#cmp-tree');
const $count = document.querySelector('#cmp-count');
const $tray = document.querySelector('#cmp-tray');
const $trayItems = document.querySelector('#cmp-tray-items');
const $dialog = document.querySelector('#cmp-dialog');
const $table = document.querySelector('#cmp-table');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const nf = new Intl.NumberFormat('vi-VN');
const money = (n) => (n == null ? 'Chưa có giá' : nf.format(n) + 'đ');
const per100 = (r) => (r.price != null && r.weightG ? Math.round((r.price * 100) / r.weightG) : null);
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
const viDate = (d) => (d ? d.split('-').reverse().join('/') : '');
const uniq = (list) => [...new Set(list.filter(Boolean))];
const sortVi = (a, b) => a.localeCompare(b, 'vi');
const brandSort = (a, b) => (a === OWN ? -1 : b === OWN ? 1 : sortVi(a, b));

function hue(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.codePointAt(0)) % 360;
  return h;
}
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function median(list) {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// Trung vị giá/100g của các hãng khác theo loại (chỉ dòng có giá và gram, không tính dòng mẫu).
const market = new Map();
for (const fruit of uniq(rows.map((r) => r.fruit))) {
  const vals = rows.filter((r) => r.fruit === fruit && r.brand !== OWN && !r.isExample).map(per100).filter((v) => v != null);
  if (vals.length) market.set(fruit, { median: median(vals), min: Math.min(...vals), max: Math.max(...vals), n: vals.length });
}

function matches(r, skip) {
  if (skip !== 'brand' && state.brand.size && !state.brand.has(r.brand)) return false;
  if (skip !== 'label' && state.label.size && !state.label.has(r.label || r.brand)) return false;
  if (skip !== 'fruit' && state.fruit.size && !state.fruit.has(r.fruit)) return false;
  if (skip !== 'weight' && state.weight.size) {
    const ok = WEIGHT_BUCKETS.some(([key, , test]) => state.weight.has(key) && test(r.weightG));
    if (!ok) return false;
  }
  return true;
}

function chipGroup(key, title, options) {
  const set = state[key];
  const chips = options.map(([value, text, n]) => `<button type="button" class="cmp-chip${set.has(value) ? ' is-on' : ''}" data-f="${esc(key)}" data-v="${esc(value)}" aria-pressed="${set.has(value)}"${n ? '' : ' disabled'}>${esc(text)}<span>${esc(n)}</span></button>`).join('');
  return `<div class="cmp-fgroup"><p class="cmp-ftitle">${esc(title)}${set.size ? ` <button type="button" class="cmp-reset" data-reset="${esc(key)}">Bỏ lọc</button>` : ''}</p><div class="cmp-chips" role="group" aria-label="${esc(title)}">${chips}</div></div>`;
}

function renderFilters() {
  const count = (skip, test) => rows.filter((r) => matches(r, skip) && test(r)).length;
  const brands = uniq(rows.map((r) => r.brand)).sort(brandSort).map((b) => [b, b, count('brand', (r) => r.brand === b)]);
  const labelPool = rows.filter((r) => !state.brand.size || state.brand.has(r.brand));
  const labels = uniq(labelPool.map((r) => r.label || r.brand)).sort(sortVi).map((l) => [l, l, count('label', (r) => (r.label || r.brand) === l)]);
  const fruits = uniq(rows.map((r) => r.fruit)).sort(sortVi).map((f) => [f, f, count('fruit', (r) => r.fruit === f)]);
  const weights = WEIGHT_BUCKETS.map(([key, text, test]) => [key, text, count('weight', (r) => test(r.weightG))]);
  $filters.innerHTML = chipGroup('brand', 'Thương hiệu', brands)
    + chipGroup('label', 'Nhãn', labels)
    + chipGroup('fruit', 'Loại', fruits)
    + chipGroup('weight', 'Khối lượng', weights);
}

function weightChip(r, maxG) {
  const p = per100(r);
  const on = state.picked.includes(r.id);
  const width = r.weightG && maxG ? Math.max(8, Math.round((r.weightG / maxG) * 100)) : 0;
  const url = safeUrl(r.sourceUrl);
  const badges = [
    r.isEstimate ? '<span class="cmp-badge cmp-badge--est">Ước lượng</span>' : '',
    r.isExample ? '<span class="cmp-badge cmp-badge--ex">Dữ liệu mẫu</span>' : '',
  ].join('');
  const m = r.brand === OWN ? market.get(r.fruit) : null;
  const hint = m && r.weightG
    ? `<p class="cmp-hint">Trung vị thị trường ${esc(money(m.median))}/100g (${esc(m.n)} mẫu) → tham khảo ~${esc(money(Math.round((m.median * r.weightG) / 100 / 1000) * 1000))} cho ${esc(r.weightG)}g</p>`
    : '';
  return `<li class="cmp-w${on ? ' is-picked' : ''}">
    <button type="button" class="cmp-w__main" data-pick="${esc(r.id)}" aria-pressed="${on}" aria-label="Chọn để so sánh ${esc(r.product)} ${esc(r.weightG ?? '')}g">
      <span class="cmp-w__g">${r.weightG ? `${esc(r.weightG)}<small>g</small>` : '<small>? g</small>'}</span>
      <span class="cmp-w__bar"><i style="width:${width}%"></i></span>
      <span class="cmp-w__price">${esc(money(r.price))}</span>
      <span class="cmp-w__per">${p != null ? `${esc(money(p))}<small>/100g</small>` : '<small>—/100g</small>'}</span>
      <span class="cmp-w__tick" aria-hidden="true">${on ? '✓' : '+'}</span>
    </button>
    <div class="cmp-w__meta">${badges}${r.code ? `<code>${esc(r.code)}</code>` : ''}${r.pack ? `<span>${esc(r.pack)}</span>` : ''}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener nofollow noreferrer">Nguồn ↗</a>` : ''}${r.checkedAt ? `<span>${esc(viDate(r.checkedAt))}</span>` : ''}</div>
    ${r.note ? `<p class="cmp-note">${esc(r.note)}</p>` : ''}${hint}
  </li>`;
}

function renderTree() {
  const visible = rows.filter((r) => matches(r));
  $count.textContent = `${visible.length} quy cách · ${uniq(visible.map((r) => r.brand)).length} thương hiệu`;
  if (!visible.length) {
    $tree.innerHTML = '<p class="cmp-empty">Không có quy cách nào khớp bộ lọc.</p>';
    return;
  }
  const maxG = Math.max(...visible.map((r) => r.weightG || 0));
  const html = uniq(visible.map((r) => r.brand)).sort(brandSort).map((brand) => {
    const inBrand = visible.filter((r) => r.brand === brand);
    const labels = uniq(inBrand.map((r) => r.label || brand)).sort((a, b) => (a === brand ? -1 : b === brand ? 1 : sortVi(a, b)));
    const labelHtml = labels.map((label) => {
      const inLabel = inBrand.filter((r) => (r.label || brand) === label);
      const products = uniq(inLabel.map((r) => r.product)).sort(sortVi);
      const cards = products.map((product) => {
        const variants = inLabel.filter((r) => r.product === product).sort((a, b) => (a.weightG ?? 1e9) - (b.weightG ?? 1e9));
        return `<article class="cmp-card">
          <header><h4>${esc(product)}</h4>${variants[0].fruit ? `<span class="cmp-tag">${esc(variants[0].fruit)}</span>` : ''}</header>
          <ul class="cmp-ws">${variants.map((r) => weightChip(r, maxG)).join('')}</ul>
        </article>`;
      }).join('');
      return `<section class="cmp-label"><h3><span>Nhãn</span> ${esc(label)} <small>${esc(inLabel.length)}</small></h3><div class="cmp-cards">${cards}</div></section>`;
    }).join('');
    const own = brand === OWN;
    return `<section class="cmp-brand${own ? ' cmp-brand--own' : ''}">
      <header class="cmp-brand__head">
        <span class="cmp-avatar" style="--h:${hue(brand)}">${esc(initials(brand))}</span>
        <div><h2>${esc(brand)}</h2><p>${esc(labels.length)} nhãn · ${esc(inBrand.length)} quy cách${own ? ' · khối lượng ước lượng' : ''}</p></div>
      </header>
      ${labelHtml}
    </section>`;
  }).join('');
  $tree.innerHTML = html;
}

function renderTray() {
  $tray.hidden = !state.picked.length;
  $trayItems.innerHTML = state.picked.map((id) => {
    const r = byId.get(id);
    return `<button type="button" class="cmp-pill" data-unpick="${esc(id)}" aria-label="Bỏ ${esc(r.product)}">${esc(r.label || r.brand)} · ${esc(r.weightG ?? '?')}g ✕</button>`;
  }).join('') + `<span class="cmp-tray__n">${state.picked.length}/${MAX_PICK}</span>`;
}

function renderTable() {
  const items = state.picked.map((id) => byId.get(id)).filter(Boolean)
    .sort((a, b) => (per100(a) ?? Infinity) - (per100(b) ?? Infinity));
  const pers = items.map(per100).filter((v) => v != null);
  const best = pers.length ? Math.min(...pers) : null;
  const row = (title, fn) => `<tr><th scope="row">${esc(title)}</th>${items.map((r) => `<td>${fn(r)}</td>`).join('')}</tr>`;
  $table.innerHTML = `<div class="cmp-tablewrap"><table class="cmp-table">
    <thead><tr><th></th>${items.map((r) => `<th scope="col">${esc(r.brand)}<small>${esc(r.label || '')}</small></th>`).join('')}</tr></thead>
    <tbody>
      ${row('Sản phẩm', (r) => esc(r.product))}
      ${row('Khối lượng', (r) => (r.weightG ? `${esc(r.weightG)}g` : 'Chưa rõ') + (r.isEstimate ? ' <span class="cmp-badge cmp-badge--est">Ước lượng</span>' : ''))}
      ${row('Giá', (r) => esc(money(r.price)))}
      ${row('Giá / 100g', (r) => { const p = per100(r); return p == null ? '—' : `<b class="${p === best && pers.length > 1 ? 'cmp-best' : ''}">${esc(money(p))}</b>${p === best && pers.length > 1 ? '<small>rẻ nhất</small>' : ''}`; })}
      ${row('Chênh so với rẻ nhất', (r) => { const p = per100(r); return p == null || best == null ? '—' : p === best ? '—' : `+${esc(Math.round(((p - best) / best) * 100))}%`; })}
      ${row('Bao bì', (r) => esc(r.pack || '—'))}
      ${row('Nguồn', (r) => (safeUrl(r.sourceUrl) ? `<a href="${esc(safeUrl(r.sourceUrl))}" target="_blank" rel="noopener nofollow noreferrer">Mở ↗</a>` : '—'))}
      ${row('Ngày kiểm', (r) => esc(viDate(r.checkedAt) || '—'))}
    </tbody></table></div>
    <p class="cmp-fine">Giá / 100g = giá ÷ khối lượng × 100. Khối lượng có thể là cân cả bao bì nếu trang nguồn ghi vậy, xem ghi chú từng dòng.</p>`;
}

function render() {
  renderFilters();
  renderTree();
  renderTray();
}

$filters.addEventListener('click', (event) => {
  const reset = event.target.closest('[data-reset]');
  if (reset) {
    state[reset.dataset.reset].clear();
    render();
    return;
  }
  const chip = event.target.closest('[data-f]');
  if (!chip) return;
  const set = state[chip.dataset.f];
  if (set.has(chip.dataset.v)) set.delete(chip.dataset.v);
  else set.add(chip.dataset.v);
  if (chip.dataset.f === 'brand') state.label.clear();
  render();
});

$tree.addEventListener('click', (event) => {
  const pick = event.target.closest('[data-pick]');
  if (!pick) return;
  const id = Number(pick.dataset.pick);
  const at = state.picked.indexOf(id);
  if (at >= 0) state.picked.splice(at, 1);
  else if (state.picked.length >= MAX_PICK) {
    $count.textContent = `Chỉ so sánh tối đa ${MAX_PICK} quy cách. Bỏ bớt một ô trước.`;
    return;
  } else state.picked.push(id);
  renderTree();
  renderTray();
});

$trayItems.addEventListener('click', (event) => {
  const pill = event.target.closest('[data-unpick]');
  if (!pill) return;
  state.picked = state.picked.filter((id) => id !== Number(pill.dataset.unpick));
  renderTree();
  renderTray();
});

document.querySelector('#cmp-clear').addEventListener('click', () => {
  state.picked = [];
  renderTree();
  renderTray();
});
document.querySelector('#cmp-open').addEventListener('click', () => {
  renderTable();
  if ($dialog.showModal) $dialog.showModal();
  else $dialog.setAttribute('open', '');
});
document.querySelector('#cmp-close').addEventListener('click', () => $dialog.close());
$dialog.addEventListener('click', (event) => {
  if (event.target === $dialog) $dialog.close();
});

render();
