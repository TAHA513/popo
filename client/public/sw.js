// Advanced PWA Service Worker for LaaBoBo
const CACHE_NAME = 'laabolive-v2.0';
const STATIC_CACHE = 'laabolive-static-v2.0';
const DYNAMIC_CACHE = 'laabolive-dynamic-v2.0';
const IMAGE_CACHE = 'laabolive-images-v2.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap'
];

// API routes to cache with Network First strategy
const API_ROUTES = [
  '/api/auth/user',
  '/api/notifications/unread-count',
  '/api/memories/public'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v2.0')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback
    event.respondWith(networkFirstWithFallback(request));
  } else if (isImageRequest(request)) {
    // Images - Cache First with network fallback
    event.respondWith(cacheFirstForImages(request));
  } else if (isStaticAsset(request)) {
    // Static assets - Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // HTML pages - Network First with cache fallback
    event.respondWith(networkFirstForPages(request));
  }
});

// Strategy: Network First with Cache Fallback (for API calls)
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // If successful, update cache and return response
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If API call and no cache, return offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'متصل خارج الإنترنت', 
          offline: true 
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }
    
    throw error;
  }
}

// Strategy: Cache First for Images
async function cacheFirstForImages(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline image placeholder
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f3f4f6"/><text x="150" y="100" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">صورة غير متاحة</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Strategy: Cache First for Static Assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Strategy: Network First for HTML Pages
async function networkFirstForPages(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/') || new Response('متصل خارج الإنترنت');
  }
}

// Helper functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/static/') || 
         url.pathname.includes('/assets/') ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

// Background Sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync functions
async function syncMessages() {
  try {
    console.log('[SW] Syncing messages...');
    // This would typically sync pending messages when back online
    const response = await fetch('/api/messages/sync');
    if (response.ok) {
      console.log('[SW] Messages synced successfully');
    }
  } catch (error) {
    console.log('[SW] Failed to sync messages:', error);
  }
}

async function syncNotifications() {
  try {
    console.log('[SW] Syncing notifications...');
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      console.log('[SW] Notifications synced successfully');
    }
  } catch (error) {
    console.log('[SW] Failed to sync notifications:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'لديك رسالة جديدة في LaaBoBo',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ],
    requireInteraction: true,
    lang: 'ar',
    dir: 'rtl'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (error) {
      console.log('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('LaaBoBo', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Cache size management
async function cleanupCaches() {
  const cacheNames = [IMAGE_CACHE, DYNAMIC_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    if (requests.length > 100) {
      // Remove oldest 20 entries
      const toDelete = requests.slice(0, 20);
      await Promise.all(toDelete.map(request => cache.delete(request)));
      console.log(`[SW] Cleaned up ${toDelete.length} entries from ${cacheName}`);
    }
  }
}

// Periodic cleanup
setInterval(cleanupCaches, 30 * 60 * 1000); // Every 30 minutes

// Message handling for service worker communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    // Send cache status back to client
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        caches: cacheNames,
        version: 'v2.0'
      });
    });
  }
});

// Periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

async function performPeriodicSync() {
  try {
    console.log('[SW] Performing periodic sync...');
    
    // Clean up old caches
    await cleanupCaches();
    
    // Try to fetch fresh data for critical resources
    const criticalResources = ['/api/auth/user', '/api/notifications/unread-count'];
    
    for (const resource of criticalResources) {
      try {
        const response = await fetch(resource);
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(resource, response.clone());
        }
      } catch (error) {
        console.log('[SW] Failed to sync resource:', resource);
      }
    }
    
    console.log('[SW] Periodic sync completed');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}