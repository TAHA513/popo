// LaaBoBo PWA Service Worker - Optimized for PWA Installation
const CACHE_NAME = 'laababo-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - required for PWA
self.addEventListener('install', (event) => {
  console.log('LaaBoBo Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential PWA assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('PWA assets cached successfully');
        self.skipWaiting(); // Force activate immediately
      })
      .catch((error) => {
        console.error('Failed to cache PWA assets:', error);
        self.skipWaiting(); // Still activate even if caching fails
      })
  );
});

// Activate event - required for PWA
self.addEventListener('activate', (event) => {
  console.log('LaaBoBo Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy for better performance
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip WebSocket and non-GET requests
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // For API requests, always go to network
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }
  
  // For static assets, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});