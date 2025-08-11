// LaaBoBo Live - PWA Service Worker (Enhanced)
const CACHE_NAME = 'laababo-live-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache important resources
self.addEventListener('install', (event) => {
  console.log('🚀 LaaBoBo PWA Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All resources cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
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

// Fetch event - simple network-first strategy
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
        // Clone the response to store in cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request);
      })
  );
});