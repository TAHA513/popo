// LaaBoBo PWA - Advanced Service Worker
const CACHE_NAME = 'laababo-pwa-v3.0';
const API_CACHE = 'laababo-api-v1';
const MEDIA_CACHE = 'laababo-media-v1';

// Critical assets to cache for offline functionality
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/rabbit-icon-192.svg',
  '/rabbit-icon-512.svg',
  '/laabo-rabbit-logo.svg'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🔧 LaaBoBo PWA Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💾 Caching critical assets');
      return cache.addAll(CRITICAL_ASSETS);
    }).then(() => {
      console.log('✅ Critical assets cached');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 LaaBoBo PWA Service Worker activated');
  const cacheWhitelist = [CACHE_NAME, API_CACHE, MEDIA_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🎯 All clients now controlled by new SW');
      self.clients.claim();
    })
  );
});

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip WebSocket and non-GET requests
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // Strategy 1: Critical media files from B2 - Cache First
  if (request.url.includes('/api/media/b2/')) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Return cached version and update in background
            fetch(request).then(fetchResponse => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone());
              }
            }).catch(() => {});
            return response;
          }
          // Not in cache, fetch and cache
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            return new Response('Media offline', { status: 503 });
          });
        });
      })
    );
    return;
  }
  
  // Strategy 2: API requests - Network First with fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(request).then(response => {
          if (response.ok && request.url.includes('memories')) {
            // Cache memories API for offline access
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Try cache for GET requests
          if (request.method === 'GET') {
            return cache.match(request).then(response => {
              if (response) {
                return response;
              }
              return new Response(
                JSON.stringify({ 
                  error: 'لا يوجد اتصال بالإنترنت',
                  offline: true 
                }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
          }
          
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }),
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
  
  // Strategy 3: Static assets - Cache First 
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request).then(fetchResponse => {
          // Cache successful responses
          if (fetchResponse.ok) {
            cache.put(request, fetchResponse.clone());
          }
          return fetchResponse;
        }).catch(() => {
          // For HTML requests, return cached index
          if (request.headers.get('accept').includes('text/html')) {
            return cache.match('/') || new Response('Offline', { status: 503 });
          }
          return new Response('Resource not available offline', { status: 503 });
        });
      });
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  if (event.tag === 'retry-api-calls') {
    event.waitUntil(retryFailedRequests());
  }
});

// Push notifications support
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من LaaBoBo',
    icon: '/rabbit-icon-192.svg',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'laababo-notification',
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق',
        icon: '/rabbit-icon-192.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('LaaBoBo', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Retry failed requests
async function retryFailedRequests() {
  // Implementation for retrying failed API calls
  console.log('🔄 Retrying failed requests...');
}