// LaaBoBo PWA Service Worker - Advanced PWA Support
const CACHE_NAME = 'laababo-v8';
const RUNTIME_CACHE = 'laababo-runtime-v8';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192-real.png',
  '/icon-512x512-real.png',
  '/apple-touch-icon.png',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/favicon.ico'
];

// Advanced PWA features for standalone experience
const OFFLINE_PAGE = '/';
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first'
};

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

// Advanced fetch strategy for PWA experience
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip WebSocket and non-GET requests
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle images with cache-first strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.match(/\.(js|css|json|html)$/i) || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    return new Response('Service Unavailable', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}