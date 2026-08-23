const CACHE_NAME = 'buku-kas-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Install Service Worker dan simpan cache awal
self.addEventListener('install', event => {
    self.skipWaiting(); // Memaksa Service Worker baru untuk langsung aktif
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Hapus cache lama jika ada versi Service Worker yang baru (Penting untuk pembaruan)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Strategi Network First: Selalu ambil dari server untuk mendapat HTML terbaru
self.addEventListener('fetch', event => {
    // Abaikan request API ke Google Apps Script agar data transaksi selalu real-time
    if (event.request.url.includes('script.google.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Jika berhasil ambil versi terbaru dari internet, simpan/update ke cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Jika offline (gagal fetch), gunakan versi cache di HP
                return caches.match(event.request);
            })
    );
});