const CACHE_NAME = 'laabolive-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching resources...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.warn('Failed to cache resources:', error);
      })
  );
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all pages
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'رسالة جديدة في LaaBoBo',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'laabolive-notification',
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'عرض',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'إغلاق'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'LaaBoBo Live', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync pending messages, likes, etc.
    console.log('Performing background sync...');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Network first for HTML pages
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback to cache if network fails
            return caches.match('/') || new Response('تطبيق LaaBoBo غير متوفر حالياً', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/html; charset=UTF-8' }
            });
          });
      })
  );
});