const CACHE = 'mocqua-shell-v10';

const SHELL = [
  '/',
  '/cua-hang',
  '/gio-hang',
  '/thanh-toan',
  '/tra-cuu',
  '/offline',
  '/static/css/shop.css',
  '/static/js/store.js',
  '/static/js/pwa.js',
  '/static/js/home.js',
  '/static/js/cart.js',
  '/static/js/checkout.js',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

async function keep(cache, request, response) {
  const type = response.headers.get('content-type');
  const headers = new Headers();
  if (type) headers.set('content-type', type);
  const body = await response.clone().arrayBuffer();
  const url = new URL(request.url || request, self.location.origin);
  await cache.put(url.pathname + url.search, new Response(body, { status: 200, headers }));
}

async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(SHELL.map(async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(path);
    await keep(cache, path, response);
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

function isAsset(pathname) {
  return pathname.startsWith('/static/')
    || pathname.startsWith('/assets/')
    || pathname.startsWith('/css/')
    || pathname.startsWith('/js/')
    || pathname.startsWith('/icons/')
    || pathname === '/favicon.svg'
    || pathname === '/manifest.webmanifest';
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  return cache.match(url.pathname + url.search) || cache.match(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) await keep(cache, request, fresh);
    return fresh;
  } catch {
    const cached = await fromCache(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const offline = await cache.match('/offline');
      if (offline) return offline;
    }
    return new Response('Mộc Quả cần mạng để mở trang này.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}

async function asset(request) {
  const cached = await fromCache(request);
  const updating = fetch(request).then(async (fresh) => {
    if (fresh.ok) {
      const cache = await caches.open(CACHE);
      await keep(cache, request, fresh);
    }
    return fresh;
  }).catch(() => null);
  if (cached) {
    updating.catch(() => {});
    return cached;
  }
  const fresh = await updating;
  if (fresh) return fresh;
  return new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js') return;
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isAsset(url.pathname)) event.respondWith(asset(request));
});
