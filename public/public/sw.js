// public/sw.js — Service Worker pour les vidéos offline
const CACHE_VIDEOS = 'videos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // On gère uniquement les GET vers /videos/
  if (req.method !== 'GET' || !url.pathname.startsWith('/videos/')) return;

  event.respondWith(handleVideoRequest(req));
});

async function handleVideoRequest(req) {
  const cache = await caches.open(CACHE_VIDEOS);
  const cached = await cache.match(req.url);
  const rangeHeader = req.headers.get('range');

  // Si déjà en cache
  if (cached) {
    if (rangeHeader) return respondWithRange(cached, rangeHeader);
    const headers = new Headers(cached.headers);
    if (!headers.has('Accept-Ranges')) headers.set('Accept-Ranges', 'bytes');
    return new Response(await cached.blob(), { status: 200, headers });
  }

  // Sinon on va au réseau, on met en cache, et on répond
  try {
    const res = await fetch(req);
    if (res.ok) {
      const clone = res.clone();
      await cache.put(req.url, clone);
    }
    if (rangeHeader) return respondWithRange(res, rangeHeader);
    return res;
  } catch {
    // Hors-ligne et pas de cache
    return new Response('Video not available offline.', { status: 504 });
  }
}

async function respondWithRange(response, rangeHeader) {
  const blob = await response.blob();
  const size = blob.size;
  const m = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  const start = m ? parseInt(m[1], 10) : 0;
  const end = (m && m[2]) ? parseInt(m[2], 10) : size - 1;
  const chunk = blob.slice(start, end + 1);

  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(chunk.size));
  if (!headers.get('Content-Type')) headers.set('Content-Type', 'video/mp4');

  return new Response(chunk, { status: 206, headers });
}
