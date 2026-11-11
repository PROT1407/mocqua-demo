// Hàm thuần dùng chung cho giỏ (trình duyệt + server/selfcheck): không đụng localStorage hay DOM.

// Áp gợi ý combo lên giỏ [{ sku, qty }]: bớt các món lẻ trong nudge.remove, thêm 1 combo (nudge.sku).
// Thứ tự món giữ nguyên; món về 0 thì bỏ; combo đã có trong giỏ thì cộng số lượng.
export function applyNudge(items, nudge) {
  const out = items.map((it) => {
    const row = { sku: it.sku, qty: it.qty };
    if (Array.isArray(it.slots) && it.slots.length) row.slots = it.slots;
    return row;
  });
  for (const r of nudge.remove || []) {
    let need = r.qty;
    for (const it of out) {
      if (it.slots || it.sku !== r.sku || need <= 0) continue;
      const take = Math.min(it.qty, need);
      it.qty -= take;
      need -= take;
    }
  }
  const kept = out.filter((it) => it.qty > 0);
  const hit = kept.find((it) => it.sku === nudge.sku);
  if (hit) hit.qty = Math.min(99, hit.qty + 1);
  else kept.push({ sku: nudge.sku, qty: 1 });
  return kept;
}

export const kShort = (n) => {
  const k = Math.round(n / 1000);
  return `${k.toLocaleString('vi-VN')}k`;
};
