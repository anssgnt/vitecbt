// CBT Online - single offline-first service worker
const APP_CACHE = `cbt-app-${CACHE_VERSION}`;
const IMAGE_CACHE = `cbt-images-${CACHE_VERSION}`;
const API_CACHE = `cbt-api-${CACHE_VERSION}`;
const MAX_IMAGE_CACHE_BYTES = 50 * 1024 * 1024;

const APP_SHELL = [
  '/',
  '/index.html',
  '/exam.html',
  '/result.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-512.png',
  '/assets/icon-512.png',
  '/cbt-lite-icons.min.css',
  '/style-core.min.css',
  '/style-login-lite.min.css',
  '/style-login.min.css',
  '/style-dashboard.min.css',
  '/style-menu-icons.css',
  '/style-sync.min.css',
  '/style-index-modals.min.css',
  '/style-modals.min.css',
  '/style-exam-lite.min.css',
  '/style-exam-footer.min.css',
  '/style-exam.min.css',
  '/style-result.min.css',
  '/rate-limiter.min.js',
  '/sync-optimizer.min.js',
  '/bandwidth-optimizer.min.js',
  '/css-lazy-loader.min.js',
  '/image-optimizer.min.js',
  '/supabase-adapter.min.js',
  '/firebase-mock.min.js',
  '/supabase-patch.min.js',
  '/script.min.js',
  '/admin-auth.min.js',
  '/mobile-core.min.js',
  '/cbt-schedule-table.min.js',
  '/cbt-empty-state.min.js',
  '/exam-core.min.js',
  '/result-core.min.js',
  '/cbt-static-runtime.min.js',
  '/cbt-performance-hardening.min.js',
  '/cbt-admin-signals.min.js'
];

const isImageUrl = url => /\.(jpe?g|png|gif|webp|svg)$/i.test(url.pathname);
const isSupabaseUrl = url => url.hostname.includes('supabase.co');
const isLocalGet = request => request.method === 'GET' && new URL(request.url).origin === self.location.origin;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
      .then(results => {
        const failed = results.filter(result => result.status === 'rejected').length;
        if (failed) console.warn(`[SW] ${failed} app-shell assets failed to pre-cache`);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const keep = new Set([APP_CACHE, IMAGE_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => keep.has(key) ? null : caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isSupabaseUrl(url)) return;

  if (isImageUrl(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, createOfflineImage));
    return;
  }

  if (isLocalGet(request)) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, API_CACHE));
});

self.addEventListener('message', event => {
  const message = event.data || {};
  const port = event.ports && event.ports[0];

  if (message.type === 'PRELOAD_URLS') {
    event.waitUntil(
      preloadMixedUrls(message.urls || [])
        .then(count => reply(port, { success: true, count }))
        .catch(error => reply(port, { success: false, error: error.message }))
    );
    return;
  }

  if (message.type === 'PRELOAD_IMAGES') {
    const urls = collectQuestionImages(message.data && message.data.question);
    event.waitUntil(
      preloadUrls(urls, IMAGE_CACHE)
        .then(count => reply(port, { success: true, count }))
        .catch(error => reply(port, { success: false, error: error.message }))
    );
    return;
  }

  if (message.type === 'GET_CACHE_STATS') {
    event.waitUntil(getCacheStats().then(stats => reply(port, { success: true, stats })));
    return;
  }

  if (message.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(message.cacheName || APP_CACHE)
        .then(() => reply(port, { success: true }))
        .catch(error => reply(port, { success: false, error: error.message }))
    );
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetched = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetched || offlineResponse(request);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return await cache.match(request) || offlineResponse(request);
  }
}

async function cacheFirst(request, cacheName, fallbackFactory) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await trimImageCacheIfNeeded();
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return fallbackFactory ? fallbackFactory() : offlineResponse(request);
  }
}

async function preloadUrls(urls, cacheName = APP_CACHE) {
  const cache = await caches.open(cacheName);
  const normalized = [...new Set(urls.filter(Boolean))];
  const results = await Promise.allSettled(normalized.map(async url => {
    const request = new Request(url, { cache: 'reload' });
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
  }));
  return results.filter(result => result.status === 'fulfilled').length;
}

async function preloadMixedUrls(urls) {
  const appUrls = [];
  const imageUrls = [];
  urls.forEach(url => {
    try {
      const parsed = new URL(url, self.location.origin);
      (isImageUrl(parsed) ? imageUrls : appUrls).push(url);
    } catch (error) {
      appUrls.push(url);
    }
  });
  const appCount = appUrls.length ? await preloadUrls(appUrls, APP_CACHE) : 0;
  const imageCount = imageUrls.length ? await preloadUrls(imageUrls, IMAGE_CACHE) : 0;
  return appCount + imageCount;
}

function collectQuestionImages(question) {
  if (!question) return [];
  const urls = [];
  if (question.gambar) urls.push(question.gambar);
  if (Array.isArray(question.opsi)) {
    question.opsi.forEach(option => {
      if (option && option.gambar) urls.push(option.gambar);
    });
  }
  return urls;
}

async function trimImageCacheIfNeeded() {
  const cache = await caches.open(IMAGE_CACHE);
  const keys = await cache.keys();
  let total = 0;
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) total += (await response.blob()).size;
  }
  if (total <= MAX_IMAGE_CACHE_BYTES) return;
  const deleteCount = Math.ceil(keys.length * 0.2);
  await Promise.all(keys.slice(0, deleteCount).map(key => cache.delete(key)));
}

async function getCacheStats() {
  const stats = {};
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    let size = 0;
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) size += (await response.blob()).size;
    }
    stats[name] = { itemCount: keys.length, size };
  }
  return stats;
}

function createOfflineImage() {
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-family="Arial" font-size="16">Gambar belum tersedia offline</text></svg>',
    { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' } }
  );
}

function offlineResponse(request) {
  if (request.mode === 'navigate') {
    return caches.match('/index.html');
  }
  return new Response('Offline - resource not cached', { status: 503, statusText: 'Service Unavailable' });
}

function reply(port, payload) {
  if (port) port.postMessage(payload);
}

console.log('[SW] single offline-first service worker loaded');
