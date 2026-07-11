/**
 * Monsoon Preparedness PWA Service Worker
 *
 * Caching strategies:
 * - Static assets (app shell): Cache-first for instant load
 * - Personalized data (checklists, routes, shelters, contacts): Network-first with cache fallback
 * - Offline fallback: Graceful degradation with cached fallback page
 *
 * Safety-critical app: Prioritize cached data over network when offline to ensure
 * citizens can access emergency information even without connectivity.
 */

const STATIC_CACHE_NAME = 'monsoon-static-v1';
const DATA_CACHE_NAME = 'monsoon-data-v1';

// Static assets to precache (app shell)
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API endpoints that contain personalized safety data
const PERSONALIZED_DATA_PATHS = [
  '/api/family',
  '/api/checklists',
  '/api/shelters',
  '/api/evacuation-routes',
  '/api/emergency-contacts',
  '/api/weather-alerts',
];

// Maximum age for cached data (in milliseconds)
const DATA_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const STATIC_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Install event: Precaches static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to precache static assets:', error);
      })
  );
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('monsoon-') &&
                     name !== STATIC_CACHE_NAME &&
                     name !== DATA_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event: Handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle requests based on type
  if (isStaticAsset(url)) {
    // Cache-first for static assets (images, fonts, CSS, JS)
    event.respondWith(cacheFirst(request));
  } else if (isPersonalizedData(url)) {
    // Network-first for personalized data with cache fallback
    event.respondWith(networkFirst(request));
  } else if (isNavigationRequest(request)) {
    // Navigation requests: network-first with offline fallback
    event.respondWith(navigationHandler(request));
  } else {
    // Default: network-first with cache fallback
    event.respondWith(networkFirst(request));
  }
});

/**
 * Determine if URL is a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  const staticPaths = ['/_next/static/', '/icons/', '/images/'];

  return (
    staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
    staticPaths.some(path => url.pathname.startsWith(path))
  );
}

/**
 * Determine if URL is personalized safety data
 */
function isPersonalizedData(url) {
  return PERSONALIZED_DATA_PATHS.some(path => url.pathname.startsWith(path));
}

/**
 * Determine if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Cache-first strategy: Check cache before network
 * Best for: Static assets that don't change often
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is stale
    const cacheDate = cachedResponse.headers.get('x-cache-date');
    if (cacheDate) {
      const age = Date.now() - parseInt(cacheDate, 10);
      if (age < STATIC_MAX_AGE) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const responseToCache = networkResponse.clone();

      // Add cache timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cache-date', Date.now().toString());

      cache.put(request, new Response(await responseToCache.clone().blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      }));
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed, returning offline page:', error);
    return caches.match('/offline');
  }
}

/**
 * Network-first strategy: Try network, fall back to cache
 * Best for: Personalized data that needs to be fresh when available
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      const responseToCache = networkResponse.clone();

      // Add cache timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cache-date', Date.now().toString());

      cache.put(request, new Response(await responseToCache.clone().blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      }));
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check if cached data is too old
      const cacheDate = cachedResponse.headers.get('x-cache-date');
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate, 10);
        if (age > DATA_MAX_AGE) {
          console.log('[SW] Cached data is older than 24 hours:', request.url);
          // Return cached data but trigger background refresh
          backgroundRefresh(request);
          return cachedResponse;
        }
      }
      return cachedResponse;
    }

    // No cache available, return offline response
    console.error('[SW] No cache available for:', request.url);
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached data available. Please connect to the internet.',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Navigation handler: Network-first for HTML, cache for assets
 */
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation network failed, trying cache for:', request.url);

    // Try to return cached page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return cached offline page for navigation failures
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    // Ultimate fallback - inline HTML (no emoji for accessibility)
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Monsoon Preparedness</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container { text-align: center; max-width: 400px; }
          h1 { font-size: 2rem; margin-bottom: 1rem; }
          p { opacity: 0.8; margin-bottom: 1.5rem; line-height: 1.6; }
          .warning {
            background: rgba(255,193,7,0.2);
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }
          .warning-title { color: #ffc107; font-weight: bold; margin-bottom: 0.5rem; }
          button {
            background: #ffc107;
            color: #1e3a5f;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            min-height: 44px;
            min-width: 44px;
          }
          button:hover { background: #ffca2c; }
          button:focus { outline: 2px solid white; outline-offset: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You are Offline</h1>
          <div class="warning">
            <div class="warning-title">Safety Notice</div>
            <p style="margin:0; font-size: 0.9rem;">
              During monsoon season, staying informed is critical.
              Please connect to the internet when possible to receive
              latest weather alerts and safety information.
            </p>
          </div>
          <p>
            Your previously viewed checklists, shelters, and routes
            are still available in the app.
          </p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

/**
 * Background refresh: Update cache in background without blocking
 */
function backgroundRefresh(request) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(DATA_CACHE_NAME).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {
      // Silently fail - we already returned stale cache
    });
}

/**
 * Message handler: Support cache management commands from the app
 */
self.addEventListener('message', (event) => {
  const { action, data } = event.data;

  switch (action) {
    case 'skipWaiting':
      self.skipWaiting();
      break;

    case 'clearDataCache':
      caches.delete(DATA_CACHE_NAME)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    case 'getCacheStatus':
      Promise.all([
        caches.open(STATIC_CACHE_NAME).then(c => c.keys()),
        caches.open(DATA_CACHE_NAME).then(c => c.keys()),
      ]).then(([staticKeys, dataKeys]) => {
        event.ports[0].postMessage({
          staticAssets: staticKeys.length,
          dataEntries: dataKeys.length,
        });
      });
      break;

    case 'cachePersonalizedData':
      // Called when user logs in or data is refreshed
      cachePersonalizedData(data)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    default:
      console.log('[SW] Unknown message action:', action);
  }
});

/**
 * Cache personalized data after login
 */
async function cachePersonalizedData(data) {
  const cache = await caches.open(DATA_CACHE_NAME);

  if (data.checklists) {
    const response = new Response(JSON.stringify(data.checklists), {
      headers: { 'Content-Type': 'application/json', 'x-cache-date': Date.now().toString() },
    });
    await cache.put('/api/checklists', response);
  }

  if (data.shelters) {
    const response = new Response(JSON.stringify(data.shelters), {
      headers: { 'Content-Type': 'application/json', 'x-cache-date': Date.now().toString() },
    });
    await cache.put('/api/shelters', response);
  }

  if (data.evacuationRoutes) {
    const response = new Response(JSON.stringify(data.evacuationRoutes), {
      headers: { 'Content-Type': 'application/json', 'x-cache-date': Date.now().toString() },
    });
    await cache.put('/api/evacuation-routes', response);
  }

  if (data.emergencyContacts) {
    const response = new Response(JSON.stringify(data.emergencyContacts), {
      headers: { 'Content-Type': 'application/json', 'x-cache-date': Date.now().toString() },
    });
    await cache.put('/api/emergency-contacts', response);
  }

  console.log('[SW] Personalized data cached successfully');
}

/**
 * Push notification handler for weather alerts
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.body || 'New weather alert for your area',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'weather-alert',
    data: {
      url: data.url || '/alerts',
      alertId: data.alertId,
      severity: data.severity,
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.severity === 'severe' || data.severity === 'extreme',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Monsoon Alert', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Background sync for offline data mutations
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Log service worker version for debugging
console.log('[SW] Monsoon Preparedness Service Worker loaded');
