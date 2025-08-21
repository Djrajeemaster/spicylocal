// /bagit/sw.js — DEV SAFE (bypass JS & API caching)
const STATIC_CACHE = 'sb-static-v2';
const RUNTIME_CACHE = 'sb-runtime-v2';

// Only precache core HTML/CSS; DO NOT precache JS in dev
const STATIC_ASSETS = [
  '/bagit/index.html',
  '/bagit/style.css',
  '/bagit/global.css',
  '/bagit/header.css',
  '/bagit/header.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    try {
      await cache.addAll(STATIC_ASSETS);
    } catch (_) { /* ignore in dev */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAPI = url.pathname.startsWith('/bagit/api/');
  const isJS  = url.pathname.endsWith('.js');
  const isHTML = event.request.mode === 'navigate' || 
                 (event.request.headers.get('accept') || '').includes('text/html');

  // DEV: JS and API always from network to avoid stale code
  if (isAPI || isJS) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML: network-first, fallback to cache
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const res = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, res.clone());
        return res;
      } catch (_) {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(event.request);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Static assets (images/fonts/etc): stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(event.request);
    const networkPromise = (async () => {
      try {
        const res = await fetch(event.request);
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(event.request, res.clone());
        }
        return res;
      } catch (_) {
        return cached || Promise.reject(_);
      }
    })();
    return cached || networkPromise;
  })());
});