// public/sw.js — Service Worker vidéos offline (v3)
const CACHE_VIDEOS = "videos-v3";
const CACHE_STATIC = "static-v1";

// --- install / activate ---
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => ![CACHE_VIDEOS, CACHE_STATIC].includes(k))
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// --- fetch handler ---
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // On ne traite que les requêtes GET (les vidéos utilisent Range donc ok)
  if (req.method !== "GET") return;

  // ⚙️ Safari PWA : forcer les chemins relatifs /vol-deaflympics/videos/
  const pathname = url.pathname;

  if (pathname.includes("/videos/")) {
    event.respondWith(handleVideoRequest(req));
    return;
  }

  // Pour le reste (HTML, manifest, etc.)
  event.respondWith(
    caches.open(CACHE_STATIC).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return cached || Response.error();
      }
    })
  );
});

async function handleVideoRequest(req) {
  const cache = await caches.open(CACHE_VIDEOS);
  const cleanUrl = req.url.split("?")[0];
  const cached = await cache.match(cleanUrl);
  const rangeHeader = req.headers.get("range");

  if (cached) {
    if (rangeHeader) return respondWithRange(cached, rangeHeader);
    const headers = new Headers(cached.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Type", "video/mp4");
    return new Response(await cached.blob(), { status: 200, headers });
  }

  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(cleanUrl, res.clone());
    if (rangeHeader) return respondWithRange(res, rangeHeader);
    return res;
  } catch {
    // Hors ligne et pas de cache
    return new Response("", { status: 504 });
  }
}

async function respondWithRange(response, rangeHeader) {
  const blob = await response.blob();
  const size = blob.size;
  const m = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  const start = m ? parseInt(m[1], 10) : 0;
  const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  const chunk = blob.slice(start, end + 1);

  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(chunk.size));
  headers.set("Content-Type", "video/mp4");

  return new Response(chunk, { status: 206, headers });
}
