const CACHE_NAME = 'soviet-gps-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // Tambah './icon.png' jika anda ada fail ikon
];

// 1. Fasa INSTALL: Simpan semua fail dalam cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SYSTEM_LOG: CACHING_ASSETS_SUCCESS');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Fasa ACTIVATE: Buang cache lama jika ada update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
});

// 3. Fasa FETCH: Guna fail dari cache jika offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika ada dalam cache, guna cache. Jika tak, guna network.
      return response || fetch(event.request);
    }).catch(() => {
      // Jika kedua-duanya gagal (offline & fail tiada dalam cache)
      console.log('SYSTEM_LOG: DATA_FETCH_FAILED_OFFLINE');
    })
  );
});
