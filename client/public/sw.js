
const CACHE_NAME = 'laabolive-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker يتم تثبيته...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 تخزين الملفات في Cache...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker تم تثبيته بنجاح');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker مُفعل');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف cache قديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// التعامل مع الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // تجاهل WebSocket والطلبات غير GET
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // للـ API، استخدم الشبكة أولاً
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'الشبكة غير متاحة' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // للملفات الثابتة، استخدم Cache أولاً
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// رسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
