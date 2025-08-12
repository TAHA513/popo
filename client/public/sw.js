
const CACHE_NAME = 'laabolive-pwa-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/src/main.tsx',
  '/src/index.css'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker يتم تثبيته...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 تخزين الملفات في Cache...');
        return cache.addAll(urlsToCache.map(url => {
          // إضافة timestamp لضمان إعادة التحميل
          return url.includes('?') ? url : `${url}?v=${Date.now()}`;
        }));
      })
      .then(() => {
        console.log('✅ Service Worker تم تثبيته بنجاح');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ خطأ في تثبيت Service Worker:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker مُفعل');
  event.waitUntil(
    Promise.all([
      // حذف الكاش القديم
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ حذف cache قديم:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // أخذ السيطرة على جميع العملاء
      self.clients.claim()
    ])
  );
  
  // إشعار العملاء بالتحديث
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  });
});

// التعامل مع الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل WebSocket والطلبات غير GET
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // للـ API، استخدم الشبكة أولاً مع fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // حفظ الاستجابة الناجحة في الكاش
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // في حالة فشل الشبكة، جرب الكاش أولاً
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // إرجاع رد خطأ إذا لم يوجد في الكاش
            return new Response(
              JSON.stringify({ error: 'الشبكة غير متاحة والبيانات غير محفوظة في الكاش' }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }
  
  // للملفات الثابتة، Cache First Strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // تحديث الكاش في الخلفية
          fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // تجاهل أخطاء الشبكة للتحديث في الخلفية
          });
          
          return cachedResponse;
        }
        
        // إذا لم يوجد في الكاش، جلب من الشبكة
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // حفظ في الكاش
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return networkResponse;
          })
          .catch(() => {
            // في حالة فشل الشبكة والملف غير موجود في الكاش
            if (url.pathname === '/' || url.pathname.endsWith('.html')) {
              return caches.match('/index.html');
            }
            throw new Error('الملف غير متاح');
          });
      })
  );
});

// رسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // فحص التحديثات
    self.registration.update();
  }
});

// إشعارات Push (للمستقبل)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'laabolive-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
