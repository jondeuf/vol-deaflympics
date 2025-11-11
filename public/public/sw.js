// public/sw.js — Service Worker vidéos offline
const CACHE_VIDEOS = "videos-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // on ne gère que le même domaine + les chemins contenant /videos/
  const sameOrigin = url.origin === self.location.origin;
  const isVideo = url.pathname.includes("/videos/");
  if (!sameOrigin || !isVideo) return;

  event.respondWith(handleVideoRequest(req));
});

async function handleVideoRequest(req) {
  const cache = await caches.open(CACHE_VIDEOS);
  const cleanUrl = req.url.split("?")[0];     // ignore la query
  const cached = await cache.match(cleanUrl);
  const rangeHeader = req.headers.get("range");

  // Si on a déjà en cache
  if (cached) {
    if (rangeHeader) return respondWithRange(cached, rangeHeader);

    const headers = new Headers(cached.headers);
    if (!headers.has("Accept-Ranges")) headers.set("Accept-Ranges", "bytes");
    if (!headers.get("Content-Type")) headers.set("Content-Type", "video/mp4");
    return new Response(await cached.blob(), { status: 200, headers });
  }

  // Sinon: on va au réseau, on met en cache et on sert
  try {
    const res = await fetch(req);
    if (res.ok) {
      const putable = res.clone();
      await cache.put(cleanUrl, putable);
    }
    if (rangeHeader) return respondWithRange(res, rangeHeader);
    return res;
  } catch {
    // Hors-ligne et pas dans le cache
    return new Response("Video not available offline.", { status: 504 });
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
  if (!headers.get("Content-Type")) headers.set("Content-Type", "video/mp4");

  return new Response(chunk, { status: 206, headers });
}
