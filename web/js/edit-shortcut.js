const PAGE_KEYS = ['deo', 'thanghoa', 'gion', 'kho', 'omai', 'set', 'hat'];

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
  const product = path.match(/^\/san-pham\/([a-z0-9-]+)$/);
  if (product) return '/admin?edit=product&id=' + product[1];
  const gift = path.match(/^\/hop-qua\/([a-z0-9-]+)$/);
  if (gift) return '/admin?edit=product&id=' + gift[1];
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
