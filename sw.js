// public/sw.js – Service Worker vidéos offline (v6 - AVEC PRÉ-CACHE)
const CACHE_VIDEOS = "videos-v6";
const CACHE_STATIC = "static-v6";
const CACHE_APP = "app-v6";

// Fichiers essentiels à pré-cacher pour que l'app fonctionne hors ligne
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// --- install ---
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installé (v6 - avec pré-cache)");
  
  event.waitUntil(
    (async () => {
      // Pré-cacher l'app shell
      const cache = await caches.open(CACHE_APP);
      try {
        await cache.addAll(APP_SHELL);
        console.log("📦 App shell pré-cachée:", APP_SHELL);
      } catch (e) {
        console.warn("⚠️ Erreur pré-cache app shell:", e);
      }
      
      // Activer immédiatement
      await self.skipWaiting();
    })()
  );
});

// --- activate ---
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker activé (v6)");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Supprimer les anciens caches
      await Promise.all(
        keys
          .filter(k => ![CACHE_VIDEOS, CACHE_STATIC, CACHE_APP].includes(k))
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

  // 🎥 VIDÉOS
  if (pathname.includes("/videos/") && pathname.endsWith(".mp4")) {
    event.respondWith(handleVideoRequest(req));
    return;
  }

  // 📄 NAVIGATION (HTML) - Cache First avec Network Fallback
  if (req.mode === 'navigate' || pathname === '/' || pathname.endsWith('.html')) {
    event.respondWith(
      (async () => {
        // D'abord chercher dans le cache app
        const cachedApp = await caches.match(req);
        if (cachedApp) {
          console.log("📦 Navigation depuis cache:", pathname);
          return cachedApp;
        }
        
        // Sinon essayer le réseau
        try {
          const response = await fetch(req);
          if (response.ok) {
            const cache = await caches.open(CACHE_APP);
            cache.put(req, response.clone());
          }
          return response;
        } catch (e) {
          console.log("❌ Navigation hors ligne échouée pour:", pathname);
          // Retourner la page principale en fallback
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          
          return new Response(
            '<html><body><h1>Hors ligne</h1><p>Cette page nécessite une connexion.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // 📦 AUTRES FICHIERS STATIQUES (JS, CSS, images, etc.)
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

// 🎥 GESTION DES VIDÉOS - OPTIMISÉ POUR IOS
async function handleVideoRequest(req) {
  const cache = await caches.open(CACHE_VIDEOS);
  
  // Nettoyer l'URL
  const url = new URL(req.url);
  const cleanUrl = url.origin + url.pathname;
  
  console.log("🎬 Requête vidéo:", url.pathname);
  
  const rangeHeader = req.headers.get("range");
  console.log("📊 Range demandé:", rangeHeader || "FULL");
  
  // 1️⃣ Chercher dans le cache
  let cached = await cache.match(cleanUrl);
  
  // Si pas trouvé, essayer sans l'origin
  if (!cached) {
    cached = await cache.match(url.pathname);
  }
  
  if (cached) {
    console.log("✅ Vidéo trouvée en cache");
    
    // Pour iOS, il FAUT toujours supporter les ranges
    if (rangeHeader) {
      return await createRangeResponse(cached, rangeHeader);
    }
    
    // Même sans range, iOS peut en demander plus tard
    const blob = await cached.blob();
    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Length", String(blob.size));
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000");
    
    return new Response(blob, {
      status: 200,
      statusText: "OK",
      headers
    });
  }

  // 2️⃣ Pas en cache : télécharger
  console.log("📥 Téléchargement vidéo depuis le réseau");
  
  try {
    const res = await fetch(req);
    
    if (res.ok && res.status === 200) {
      // Mettre en cache
      const cloneForCache = res.clone();
      await cache.put(cleanUrl, cloneForCache);
      console.log("💾 Vidéo mise en cache");
      
      // Si range demandé, reconstruire la réponse
      if (rangeHeader) {
        const blob = await res.blob();
        const mockResponse = new Response(blob, {
          status: 200,
          headers: { "Content-Type": "video/mp4" }
        });
        return await createRangeResponse(mockResponse, rangeHeader);
      }
    }
    
    return res;
  } catch (err) {
    console.error("❌ Erreur téléchargement vidéo:", err);
    return new Response("Video not available offline", { 
      status: 504,
      statusText: "Gateway Timeout" 
    });
  }
}

// 🎯 CRÉER UNE RÉPONSE RANGE - VERSION iOS COMPATIBLE
async function createRangeResponse(response, rangeHeader) {
  try {
    const fullBlob = await response.blob();
    const fullSize = fullBlob.size;
    
    console.log("📏 Taille totale vidéo:", fullSize);
    
    // Parser le range: "bytes=0-1023" ou "bytes=0-"
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    
    if (!rangeMatch) {
      console.warn("⚠️ Range header invalide");
      return new Response(fullBlob, {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(fullSize),
          "Accept-Ranges": "bytes"
        }
      });
    }
    
    const start = parseInt(rangeMatch[1], 10);
    let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fullSize - 1;
    
    // Validation
    if (start >= fullSize) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fullSize}` }
      });
    }
    
    if (end >= fullSize) {
      end = fullSize - 1;
    }
    
    // Extraire le chunk
    const chunk = fullBlob.slice(start, end + 1);
    const chunkSize = chunk.size;
    
    console.log(`📦 Range response: bytes ${start}-${end}/${fullSize} (${chunkSize} bytes)`);
    
    // Headers pour iOS
    const headers = new Headers();
    headers.set("Content-Range", `bytes ${start}-${end}/${fullSize}`);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Length", String(chunkSize));
    headers.set("Content-Type", "video/mp4");
    headers.set("Cache-Control", "public, max-age=31536000");
    
    return new Response(chunk, {
      status: 206,
      statusText: "Partial Content",
      headers
    });
    
  } catch (error) {
    console.error("❌ Erreur dans createRangeResponse:", error);
    const blob = await response.blob();
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes"
      }
    });
  }
}