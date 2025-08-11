// LaaBoBo PWA Service Worker
const CACHE_NAME = 'laababo-v6';
const STATIC_CACHE = 'laababo-static-v6';
const DYNAMIC_CACHE = 'laababo-dynamic-v6';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

const DYNAMIC_URLS = [
  '/api/memories/public',
  '/api/auth/user',
  '/api/notifications/unread-count'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v6 - PWA Mode');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] PWA Installation complete!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - network first with fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP(S) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip WebSocket and non-GET requests
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // For API requests, always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              error: 'خدمة غير متاحة حاليا',
              message: 'يرجى التحقق من اتصالك بالإنترنت' 
            }),
            { 
              status: 503,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            }
          );
        })
    );
    return;
  }
  
  // For navigation requests and other resources
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, return the main page
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // For other resources, return a generic error
            return new Response('خدمة غير متاحة', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});