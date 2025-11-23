// public/sw.js – Service Worker vidéos offline (v4 - CORRIGÉ)
const CACHE_VIDEOS = "videos-v4";
const CACHE_STATIC = "static-v2";

// --- install / activate ---
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installé (v4)");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker activé (v4)");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Supprimer les anciens caches
      await Promise.all(
        keys
          .filter(k => ![CACHE_VIDEOS, CACHE_STATIC].includes(k))
          .map(k => {
            console.log("🗑️ Suppression ancien cache:", k);
            return caches.delete(k);
          })
      );
      await self.clients.claim();
    })()
  );
});

// --- fetch handler ---
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // On ne traite que les requêtes GET
  if (req.method !== "GET") return;

  const pathname = url.pathname;

  // 🎥 VIDÉOS : Détection améliorée pour gérer /videos/ ET /vol-deaflympics/videos/
  if (pathname.includes("/videos/") && pathname.endsWith(".mp4")) {
    event.respondWith(handleVideoRequest(req));
    return;
  }

  // 📄 FICHIERS STATIQUES (HTML, CSS, JS, manifest, etc.)
  event.respondWith(
    caches.open(CACHE_STATIC).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) {
        console.log("📦 Cache hit (static):", pathname);
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok) {
          cache.put(req, res.clone());
          console.log("💾 Mise en cache (static):", pathname);
        }
        return res;
      } catch (err) {
        console.log("❌ Erreur réseau:", pathname);
        return cached || new Response("Offline", { status: 503 });
      }
    })
  );
});

// 🎥 GESTION DES VIDÉOS AVEC SUPPORT DES RANGE REQUESTS
async function handleVideoRequest(req) {
  const cache = await caches.open(CACHE_VIDEOS);
  
  // Nettoyer l'URL (enlever les query params)
  const cleanUrl = req.url.split("?")[0];
  const pathname = new URL(cleanUrl).pathname;
  
  console.log("🎬 Requête vidéo:", pathname);
  
  const rangeHeader = req.headers.get("range");
  
  // 1️⃣ Chercher dans le cache
  const cached = await cache.match(cleanUrl);
  
  if (cached) {
    console.log("✅ Vidéo trouvée en cache:", pathname);
    
    if (rangeHeader) {
      // Safari/iOS demande des ranges
      return respondWithRange(cached, rangeHeader);
    }
    
    // Réponse complète
    const headers = new Headers(cached.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Type", "video/mp4");
    headers.set("Cache-Control", "public, max-age=31536000");
    
    return new Response(await cached.blob(), { 
      status: 200, 
      headers 
    });
  }

  // 2️⃣ Pas en cache : télécharger
  console.log("📥 Téléchargement vidéo:", pathname);
  
  try {
    const res = await fetch(req);
    
    if (res.ok) {
      // Mettre en cache pour la prochaine fois
      const cloneForCache = res.clone();
      await cache.put(cleanUrl, cloneForCache);
      console.log("💾 Vidéo mise en cache:", pathname);
    }
    
    return res;
  } catch (err) {
    console.error("❌ Erreur téléchargement vidéo:", pathname, err);
    // Hors ligne et pas de cache
    return new Response("Video not available offline", { 
      status: 504,
      statusText: "Gateway Timeout" 
    });
  }
}

// 🎯 GESTION DES RANGE REQUESTS (pour iOS/Safari)
async function respondWithRange(response, rangeHeader) {
  const blob = await response.blob();
  const size = blob.size;
  
  // Parser le range header : "bytes=0-1023"
  const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  
  if (!match) {
    // Range invalide, retourner la vidéo complète
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": String(size)
      }
    });
  }
  
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  
  // Extraire le chunk demandé
  const chunk = blob.slice(start, end + 1);
  
  const headers = new Headers();
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(chunk.size));
  headers.set("Content-Type", "video/mp4");
  headers.set("Cache-Control", "public, max-age=31536000");
  
  console.log(`📦 Range response: ${start}-${end}/${size}`);
  
  return new Response(chunk, { 
    status: 206,  // Partial Content
    headers 
  });
}