// public/sw.js – Service Worker vidéos offline (v5 - iOS OPTIMISÉ)
const CACHE_VIDEOS = "videos-v5";
const CACHE_STATIC = "static-v3";

// --- install / activate ---
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installé (v5 - iOS optimisé)");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker activé (v5)");
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

  // 🎥 VIDÉOS : Détection pour .mp4
  if (pathname.includes("/videos/") && pathname.endsWith(".mp4")) {
    event.respondWith(handleVideoRequest(req));
    return;
  }

  // 📄 FICHIERS STATIQUES
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
    // On retourne la vidéo complète avec les bons headers
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
      // Mettre en cache pour la prochaine fois
      const cloneForCache = res.clone();
      await cache.put(cleanUrl, cloneForCache);
      console.log("💾 Vidéo mise en cache");
      
      // Si range demandé, on doit reconstruire la réponse
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
    // Récupérer le blob complet
    const fullBlob = await response.blob();
    const fullSize = fullBlob.size;
    
    console.log("📏 Taille totale vidéo:", fullSize);
    
    // Parser le range: "bytes=0-1023" ou "bytes=0-"
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    
    if (!rangeMatch) {
      console.warn("⚠️ Range header invalide, retour vidéo complète");
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
    
    // iOS demande parfois des ranges invalides, on corrige
    if (start >= fullSize) {
      console.warn("⚠️ Range start >= size, retour 416");
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fullSize}`
        }
      });
    }
    
    // Limiter end à la taille max
    if (end >= fullSize) {
      end = fullSize - 1;
    }
    
    // Extraire le chunk
    const chunk = fullBlob.slice(start, end + 1);
    const chunkSize = chunk.size;
    
    console.log(`📦 Range response: bytes ${start}-${end}/${fullSize} (${chunkSize} bytes)`);
    
    // Headers pour iOS (ordre important!)
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
    // En cas d'erreur, retourner la vidéo complète
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