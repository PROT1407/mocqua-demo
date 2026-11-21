const PAGE_KEYS = ['deo', 'thanghoa', 'gion', 'kho', 'omai', 'set', 'hat'];

export function findCatalogItem(products, id) {
  const key = String(id || '').trim().toLowerCase();
  if (!key) return null;
  const list = products || [];
  return list.find((product) => String(product?.id || '').toLowerCase() === key)
    || list.find((product) => (product?.variants || []).some((variant) => String(variant?.sku || '').toLowerCase() === key))
    || null;
}

export function filterCatalogItems(products, query, exactId = '') {
  const exact = String(exactId || '').trim().toLowerCase();
  if (exact) {
    const hit = findCatalogItem(products, exact);
    return hit ? [hit] : [];
  }
  const q = String(query || '').trim().toLowerCase();
  if (!q) return products || [];
  const byId = findCatalogItem(products, q);
  if (byId && String(byId.id).toLowerCase() === q) return [byId];
  return (products || []).filter((product) => {
    const blob = `${product.name || ''} ${product.id || ''} ${(product.variants || []).map((variant) => variant.sku || '').join(' ')}`.toLowerCase();
    return blob.includes(q);
  });
}

export function editHref(pathname, search = '') {
  const path = String(pathname || '');
  if (path === '/') return '/admin?edit=home';
  if (path === '/cua-hang') {
    const cat = new URLSearchParams(search).get('cat');
    return '/admin?edit=page&page=' + (PAGE_KEYS.includes(cat) ? cat : 'shop');
  }
  if (path === '/danh-muc') return '/admin?edit=page&page=catalog';
  if (path === '/combo') return '/admin?edit=page&page=combo';
  if (path === '/hop-qua') return '/admin?edit=page&page=gift';
  const product = path.match(/^\/san-pham\/([a-z0-9-]+)$/i);
  if (product) return '/admin?edit=product&id=' + product[1].toLowerCase();
  const gift = path.match(/^\/hop-qua\/([a-z0-9-]+)$/i);
  if (gift) return '/admin?edit=product&id=' + gift[1].toLowerCase();
  return '';
}

async function boot() {
  if (typeof document === 'undefined') return;
  const href = editHref(location.pathname, location.search);
  if (!href) return;
  let ok = false;
  try {
    const res = await fetch('/api/admin/me', { headers: { accept: 'application/json' } });
    ok = res.ok;
  } catch {
    ok = false;
  }
  if (!ok) return;
  const link = document.createElement('a');
  link.className = 'edit-shortcut';
  link.href = href;
  link.textContent = '✏️ Sửa';
  document.body.append(link);
}

boot();
