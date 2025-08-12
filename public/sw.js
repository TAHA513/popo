// LaaBoBo Live - Simple Service Worker
// Minimal service worker to avoid network errors

const CACHE_NAME = 'laababo-live-v2024-08-12-v2';
const MEDIA_CACHE_NAME = 'laababo-media-v2024-08-12-v2';
const CACHE_VERSION = 'v2024_08_12_v2';

// Install event - keep it minimal
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MEDIA_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper function to check if URL is a media file
function isMediaFile(url) {
  return /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?.*)?$/i.test(url) || 
         url.includes('/api/media/') || 
         url.includes('/media/') ||
         url.includes('/public-objects/');
}

// Helper function to check if media has correct version
function hasCorrectVersion(url) {
  return url.includes(`v=${CACHE_VERSION}`);
}

// Fetch event - Cache First for media, Network First for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip WebSocket and non-GET requests
  if (request.url.includes('ws://') || 
      request.url.includes('wss://') || 
      request.method !== 'GET') {
    return;
  }
  
  // For API requests (non-media), always go to network first
  if (request.url.includes('/api/') && !isMediaFile(request.url)) {
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
  
  // For media files: Cache First strategy
  if (isMediaFile(request.url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // If we have a cached version with correct version, use it
          if (cachedResponse && hasCorrectVersion(request.url)) {
            console.log('Cache HIT for media:', request.url);
            return cachedResponse;
          }
          
          // Otherwise fetch from network and cache
          return fetch(request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              cache.put(request, responseClone);
              console.log('Cache MISS - stored media:', request.url);
            }
            return networkResponse;
          }).catch(() => {
            // If network fails and we have any cached version, return it
            if (cachedResponse) {
              console.log('Network FAIL - using stale cache for media:', request.url);
              return cachedResponse;
            }
            // Otherwise return error
            return new Response('Media not available', { status: 404 });
          });
        });
      })
    );
    return;
  }
  
  // For other static assets: Network First with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response to store in cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request);
      })
  );
});