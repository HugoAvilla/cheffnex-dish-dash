const CACHE_NAME = 'cheffnex-v1';
const ASSETS_TO_CACHE = [
  '/manifest.json'
];

let currentVersion = null;

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('version.json')) return;

  // NAO interceptar chunks JS/CSS do Vite
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.includes('.js') ||
      url.pathname.includes('.css') ||
      url.pathname.includes('node_modules')) {
    return; // deixa o navegador buscar normalmente
  }

  // Apenas cachear app shell (HTML, manifest, icones)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Version polling every 60 seconds
async function checkForUpdates() {
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    if (currentVersion === null) {
      currentVersion = data.version;
    } else if (data.version !== currentVersion) {
      currentVersion = data.version;
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
    }
  } catch (e) {
    // silently fail
  }
}

checkForUpdates();
setInterval(checkForUpdates, 60000);
