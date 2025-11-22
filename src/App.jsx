import React, { useState, useEffect, useRef } from "react";
import deaflympicsLogo from "./assets/deaflympics2025.png";
import { Analytics } from "@vercel/analytics/react";


/* ---------- Configuration ---------- */
// Local/Vercel => "/", GitHub Pages => "/vol-deaflympics/" (détecté auto)
const BASE =
  (import.meta?.env?.BASE_URL) ||
  (location.pathname.startsWith("/vol-deaflympics/") ? "/vol-deaflympics/" : "/");

// Nom du cache (doit matcher public/sw.js)
const CACHE_NAME = "videos-v3";



/* ---------- Helpers vidéos ---------- */
function slugify(str) {
  return (str || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/'/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
async function fetchManifest() {
  try {
    const r = await fetch(`${BASE}videos/manifest.json`, { cache: "no-store" });
    if (!r.ok) return {};
    return await r.json();
  } catch {
    return {};
  }
}
function getVideoUrl(manifest, catId, frWord) {
  const file = slugify(frWord) + ".mp4";
  const list = manifest[catId] || [];
  return list.includes(file) ? `${BASE}videos/${catId}/${file}` : null;
}

/* ---------- Bloc À propos ---------- */
const ABOUT_HTML = `
  <h2 style="color:#2a4b7c; text-align:center; margin-bottom:1rem">À propos des Deaflympics</h2>
  <p>
    Les <strong>Deaflympics</strong> (<em>Jeux olympiques des sourds</em>) ont lieu tous les quatre ans, et constituent la plus ancienne compétition multisports après les Jeux olympiques. Seuls les athlètes ayant un seuil d'audition de moins de 55 décibels et ne disposant pas de dispositif de correction auditif peuvent participer. Les premiers Jeux olympiques des sourds se sont tenus à Paris en 1924.
  </p>
  <h3 style="color:#2a4b7c">Histoire</h3>
  <p>
    Eugène Rubens-Alcais et ses amis ont organisé pour la première fois les Jeux internationaux silencieux à Paris 🇫🇷 en 1924, réunissant 148 athlètes de 9 pays. Le Comité international des sports des sourds (CISS/ICSD) a ensuite été fondé, assurant l'organisation des Deaflympics tous les quatre ans, en alternant été et hiver. Après une interruption due à la Seconde Guerre mondiale, les Jeux d'été ont repris en 1949 à Copenhague 🇩🇰, et les Jeux d'hiver ont été créés la même année à Seefeld in Tirol 🇦🇹.
  </p>
  <h3 style="color:#2a4b7c">Quelques villes hôtes des Deaflympics :</h3>
  <ul style="margin-bottom: 1rem; line-height:1.7">
    <li>1924 : Paris 🇫🇷</li>
    <li>1928 : Amsterdam 🇳🇱</li>
    <li>1931 : Nuremberg 🇩🇪</li>
    <li>1935 : Londres 🇬🇧</li>
    <li>1939 : Stockholm 🇸🇪</li>
    <li>1949 : Copenhague 🇩🇰 (été), Seefeld in Tirol 🇦🇹 (hiver)</li>
    <li>1953 : Bruxelles 🇧🇪 (été), Oslo 🇳🇴 (hiver)</li>
    <li>1957 : Milan 🇮🇹</li>
    <li>1961 : Helsinki 🇫🇮</li>
    <li>1965 : Washington DC 🇺🇸</li>
    <li>1969 : Belgrade 🇷🇸</li>
    <li>1973 : Malmö 🇸🇪</li>
    <li>1977 : Bucarest 🇷🇴</li>
    <li>1981 : Cologne 🇩🇪</li>
    <li>1985 : Los Angeles 🇺🇸</li>
    <li>1989 : Christchurch 🇳🇿</li>
    <li>1993 : Sofia 🇧🇬</li>
    <li>1997 : Copenhague 🇩🇰</li>
    <li>2001 : Rome 🇮🇹</li>
    <li>2005 : Melbourne 🇦🇺</li>
    <li>2009 : Taipei 🇹🇼</li>
    <li>2013 : Sofia 🇧🇬</li>
    <li>2017 : Samsun 🇹🇷</li>
    <li>2021 : Caxias do Sul 🇧🇷</li>
    <li>2025 : Tokyo 🇯🇵</li>
    <li>2027 : Innsbruck 🇦🇹 (hiver)</li>
  </ul>
  <h3 style="color:#2a4b7c">Organisation et symboles</h3>
  <p>
    Le Comité international des sports des sourds (CISS, ou ICSD en anglais) a été créé par Eugène Rubens-Alcais (France) et Antoine Dresse (Belgique) le 16 août 1924. Le siège du CISS est situé dans le Maryland, aux États-Unis. L'actuel président est Adam Rosa (élu en 2022).
  </p>
  <p>
    Le drapeau des Deaflympics représente quatre mains « OK » de couleurs différentes (bleu, rouge, jaune et vert), entrelacées sur fond blanc, symbolisant l'universalité de l'olympisme sourd.
  </p>
  <h3 style="color:#2a4b7c">Conditions de participation</h3>
  <ul style="line-height:1.7">
    <li>Seuil d'audition inférieur à 55 décibels.</li>
    <li>Pas d'audioprothèses ou d'aides auditives pendant les compétitions.</li>
  </ul>
  <h3 style="color:#2a4b7c">Disciplines et programme typique</h3>
  <p>
    Les Deaflympics comprennent une large gamme de sports, similaires à ceux des Jeux olympiques. Voici la liste des 31 sports présents dans la compétition :
  </p>
  <ul style="margin-bottom: 1rem; line-height:1.7">
    <li>Athlétisme</li><li>Badminton</li><li>Basket-ball</li><li>Beach-volley</li><li>Bowling</li>
    <li>Cyclisme sur route</li><li>Cyclisme sur piste</li><li>Échecs</li><li>Escalade sportive</li><li>Football</li>
    <li>Golf</li><li>Handball</li><li>Judo</li><li>Karaté</li><li>Lutte</li><li>Natation</li><li>Orienteering</li><li>Pétanque</li>
    <li>Plongeon</li><li>Rugby à 7</li><li>Taekwondo</li><li>Tennis</li><li>Tennis de table</li><li>Tir</li>
    <li>Tir à l'arc</li><li>Tir sportif</li><li>Triathlon</li><li>Volley-ball</li><li>Water polo</li>
    <li>Aviron</li><li>Escrime</li><li>Gymnastique artistique</li><li>Gymnastique rythmique</li>
  </ul>
  <p>
    Des cérémonies d'ouverture et de clôture, des activités culturelles, et des échanges internationaux font aussi partie du programme. L'édition 2025 des Deaflympics se tiendra à Tokyo 🇯🇵 et réunira des milliers d'athlètes sourds et malentendants du monde entier.
  </p>
  <p>
    Pour plus d'informations et des mises à jour sur le programme détaillé :
    <br />
    <a href="https://www.deaflympics.com/" target="_blank" rel="noopener noreferrer">Site officiel des Deaflympics</a> |
    <a href="https://fr.wikipedia.org/wiki/Deaflympics" target="_blank" rel="noopener noreferrer">Page Wikipedia Deaflympics</a>
  </p>
`;

/* ---------- Données ---------- */
const wordLists = {
  basic: [
    { emoji: "🇫🇷", word: "Air France" },
    { emoji: "🙏", word: "S'il vous plaît" },
    { emoji: "🙏", word: "Merci" },
    { emoji: "🙏", word: "Pardon" },
    { emoji: "👍", word: "Oui" },
    { emoji: "👎", word: "Non" },
    { emoji: "👋", word: "Bonjour" },
    { emoji: "👋", word: "Au revoir" }
  ],
  avion: [
    { emoji: "🤝", word: "Aéroport" },
    { emoji: "🕐", word: "Départ" },
    { emoji: "🕑", word: "Arrivée" },
    { emoji: "📝", word: "Enregistrement" },
    { emoji: "🧳", word: "Bagage" },
    { emoji: "🛂", word: "Passeport" },
    { emoji: "🛡️", word: "Sécurité" },
    { emoji: "🔍", word: "Contrôle" },
    { emoji: "🛃", word: "Douane" },
    { emoji: "✈️", word: "Vol" },
    { emoji: "⏰", word: "Retard" },
    { emoji: "❌", word: "Annulé" },
    { emoji: "🛫", word: "Embarquement" },
    { emoji: "🚕", word: "Taxi" },
    { emoji: "🚆", word: "Train" },
    { emoji: "🚌", word: "Bus" },
    { emoji: "🛩️", word: "Avion" },
    { emoji: "🔗", word: "Ceinture de sécurité" },
    { emoji: "🛫", word: "Décollage" },
    { emoji: "🛬", word: "Atterrissage" },
    { emoji: "👨‍✈️", word: "Pilote" },
    { emoji: "🍽️", word: "Repas" },
    { emoji: "🥤", word: "Boisson" },
    { emoji: "💧", word: "Eau" },
    { emoji: "☕", word: "Café" },
    { emoji: "🍵", word: "Thé" },
    { emoji: "🧃", word: "Jus" },
    { emoji: "🧂", word: "Sucre" },
    { emoji: "🧂", word: "Sel" },
    { emoji: "🍰", word: "Dessert" },
    { emoji: "🛏️", word: "Couverture" },
    { emoji: "🛏️", word: "Oreiller" },
    { emoji: "📺", word: "Écran" },
    { emoji: "🎧", word: "Casque audio" },
    { emoji: "🍴", word: "Manger" },
    { emoji: "🍽️", word: "Faim" },
    { emoji: "🥤", word: "Soif" },
    { emoji: "🍊", word: "Orange" },
    { emoji: "🍎", word: "Pomme" },
    { emoji: "🍅", word: "Tomate" },
    { emoji: "⚠️", word: "Allergie" },
    { emoji: "🚻", word: "Toilettes" },
    { emoji: "💡", word: "Lumière" },
    { emoji: "🚨", word: "Urgence" },
    { emoji: "🆘", word: "Aide" },
    { emoji: "⚠️", word: "Danger" },
    { emoji: "🛑", word: "Arrêt" },
    { emoji: "👮‍♂️", word: "Police" },
    { emoji: "🏥", word: "Hôpital" },
    { emoji: "👨‍⚕️", word: "Médecin" },
    { emoji: "🤒", word: "Malade" },
    { emoji: "🤕", word: "Douleur" },
    { emoji: "💊", word: "Médicament" },
    { emoji: "➡️", word: "Aller" },
    { emoji: "⬅️", word: "Venir" },
    { emoji: "⏳", word: "Attendre" },
    { emoji: "🐢", word: "Lentement" },
    { emoji: "⏰", word: "Maintenant" },
    { emoji: "❓", word: "Où est ?" },
    { emoji: "❗", word: "Problème" },
    { emoji: "🤷‍♂️", word: "Ne pas comprendre" },
    { emoji: "✍️", word: "Écrire" },
    { emoji: "🔤", word: "Traduire" },
    { emoji: "📱", word: "Téléphone" },
    { emoji: "🧭", word: "Perdu" },
    { emoji: "💼", word: "Volé" },
    { emoji: "💶", word: "Argent" },
    { emoji: "💳", word: "Payer" },
    { emoji: "🏙️", word: "Centre-ville" },
    { emoji: "🏛️", word: "Ambassade" },
    { emoji: "🤫", word: "Silence" },
    { emoji: "😌", word: "Calme" },
    { emoji: "⚠️", word: "Attention" },
    { emoji: "🚦", word: "Avertissement" }
  ],
  deaflympics: [
    { emoji: "🎮", word: "Jeux" },
    { emoji: "🏅", word: "Deaflympics" },
    { emoji: "🏃‍♂️", word: "Sport" },
    { emoji: "🏆", word: "Compétition" },
    { emoji: "🤸‍♂️", word: "Athlète" },
    { emoji: "👥", word: "Équipe" },
    { emoji: "🏋️‍♂️", word: "Entraînement" },
    { emoji: "🥇", word: "Victoire" },
    { emoji: "🥈", word: "Défaite" },
    { emoji: "🥉", word: "Médaille" },
    { emoji: "🧑‍⚖️", word: "Arbitre" },
    { emoji: "🏊‍♂️", word: "Nage" },
    { emoji: "🏃‍♂️", word: "Course" },
    { emoji: "⚽", word: "Football" },
    { emoji: "🏀", word: "Basket-ball" },
    { emoji: "🏃‍♀️", word: "Athlétisme" },
    { emoji: "🚴‍♂️", word: "Cyclisme" },
    { emoji: "🏐", word: "Volley-ball" },
    { emoji: "🏸", word: "Badminton" },
    { emoji: "🎾", word: "Tennis" },
    { emoji: "🥋", word: "Judo" },
    { emoji: "🥋", word: "Karaté" },
    { emoji: "🤼‍♂️", word: "Lutte" },
    { emoji: "🏓", word: "Tennis de table" },
    { emoji: "🎳", word: "Bowling" },
    { emoji: "🎉", word: "Cérémonie" },
    { emoji: "🏳️", word: "Drapeau" },
    { emoji: "🎶", word: "Hymne" }
  ],
  countries: [
    { emoji: "🇫🇷", word: "France" },
    { emoji: "🇯🇵", word: "Japon" },
    { emoji: "🇷🇺", word: "Russie" },
    { emoji: "🇩🇪", word: "Allemagne" },
    { emoji: "🇨🇳", word: "Chine" },
    { emoji: "🇬🇧", word: "Angleterre" },
    { emoji: "🇺🇸", word: "États-Unis" },
    { emoji: "🇨🇦", word: "Canada" },
    { emoji: "🇰🇷", word: "Corée du Sud" },
    { emoji: "🇦🇺", word: "Australie" },
    { emoji: "🇮🇳", word: "Inde" },
    { emoji: "🇮🇹", word: "Italie" },
    { emoji: "🇪🇸", word: "Espagne" },
    { emoji: "🇬🇷", word: "Grèce" },
    { emoji: "🇵🇹", word: "Portugal" },
    { emoji: "🇵🇱", word: "Pologne" },
    { emoji: "🇺🇦", word: "Ukraine" },
    { emoji: "🇹🇷", word: "Turquie" },
    { emoji: "🇧🇷", word: "Brésil" }
  ],
};

const groups = [
  { id: "basic", emoji: "🤝", label: "Basic" },
  { id: "avion", emoji: "🛫", label: "Avion" },
  { id: "deaflympics", emoji: "🏅", label: "DEAFLYMPICS" },
  { id: "countries", emoji: "🌍", label: "Pays" },
];

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [videoManifest, setVideoManifest] = useState({});
  const [nowPlaying, setNowPlaying] = useState(null);
  const [nowLabel, setNowLabel] = useState("");
  const [query, setQuery] = useState("");

  // favoris
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favs") || "{}"); }
    catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("favs", JSON.stringify(favs)); }, [favs]);

  // stats
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("stats") || "{}"); }
    catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("stats", JSON.stringify(stats)); }, [stats]);

  // offline (tout)
  const [downloading, setDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => { fetchManifest().then(setVideoManifest); }, []);
  // --- Service Worker (enregistrement pour le mode hors ligne) ---
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${BASE}sw.js`).catch(() => {});
  }
}, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function incStat(cat, word) {
    const key = `${cat}:${word}`;
    setStats(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }

  function openModal(url, label) {
    setNowPlaying(url);
    setNowLabel(label);
    if (selectedGroup) incStat(selectedGroup, label);
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    setNowPlaying(null);
    setNowLabel("");
    document.body.style.overflow = "";
  }
  async function cacheAllCategories() {
  // Vérifie que l’API Cache est dispo
  if (!("caches" in window)) {
    alert("Le cache navigateur n'est pas disponible.");
    return;
  }

  try {
    setDownloading(true);
    setDownloadPct(0);

    // On ouvre (ou crée) le cache dédié
    const cache = await caches.open(CACHE_NAME);

    // Liste de toutes les URLs vidéo à pré-charger
    const entries = Object.entries(videoManifest || {});
    const allUrls = entries.flatMap(([cat, files]) =>
      (files || []).map((f) => `${location.origin}${BASE}videos/${cat}/${f}`)
    );

    let done = 0;

    for (const url of allUrls) {
      try {
        // On force un vrai fetch réseau (pas le cache HTTP)
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          // On stocke la réponse dans le cache à l’URL exacte
          await cache.put(url, res.clone());
        }
      } catch (e) {
        // Si une vidéo échoue, on ignore mais on continue
        console.warn("Impossible de précharger :", url, e);
      }

      done++;
      if (allUrls.length > 0) {
        setDownloadPct(Math.round((done / allUrls.length) * 100));
      }
    }

    setDownloading(false);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1500);

    alert(`Hors-ligne prêt : ${done}/${allUrls.length} vidéos en cache.`);
  } catch (e) {
    console.error(e);
    setDownloading(false);
    alert("Échec du pré-chargement hors-ligne (permissions/espace ?).");
  }
}

  async function clearAllCaches() {
  if (!("caches" in window)) return;
  const ok = confirm("Vider toutes les vidéos hors-ligne ?");
  if (!ok) return;
  try {
    // On supprime le cache courant + d’éventuelles anciennes versions (videos-v1, v2…)
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k === CACHE_NAME || k.startsWith("videos-"))
        .map(k => caches.delete(k))
    );
    alert("Cache vidéos vidé.");
    setDownloadPct(0);
  } catch (e) {
    console.error(e);
    alert("Impossible de vider le cache.");
  }
}

  function toggleFav(cat, word) {
    setFavs(prev => {
      const key = `${cat}:${word}`;
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  }

  function statsArray() {
    return Object.entries(stats)
      .map(([k, v]) => {
        const [cat, ...rest] = k.split(":");
        const word = rest.join(":");
        return { cat, word, count: v };
      })
      .sort((a, b) => b.count - a.count);
  }

  function openContactMail() {
    const subject = encodeURIComponent("Retour sur l'app DeaFLYMPICS (iPad)");
    const body = encodeURIComponent(
`Bonjour,




Je souhaite vous faire un retour :

- Contexte : 

- Signe concerné(s) : 

- Suggestion(s) : 



Infos techniques:
User-Agent: ${navigator.userAgent}
App: DeaFLYMPICS PWA
`);
    window.location.href = `mailto:jubazin@airfrance.fr?subject=${subject}&body=${body}`;
  }

  // Liste + filtre
  const currentList = selectedGroup ? (wordLists[selectedGroup] || []) : [];
  const filtered = currentList.filter(item =>
    item.word.toLowerCase().includes(query.toLowerCase())
  );

  const videoRef = useRef(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Logo */}
      <img
        src={deaflympicsLogo}
        alt="Deaflympics Tokyo 2025 Logo"
        style={{ display: "block", margin: "1.6rem auto 0.4rem auto", maxWidth: "220px", width: "100%" }}
      />

      {/* Titre */}
<div style={{ textAlign: "center", marginBottom: "1.2rem", color: "#274472", fontFamily: "serif" }}>
  <span style={{ fontSize: "2rem", fontWeight: "bold" }}>
    <span style={{ display:"inline-block", animation: celebrate ? "shake .6s ease" : "none" }}>✈️</span>
    {" "}Vol DeaFLYMPICS{" "}
    <span style={{ fontSize: "2.1rem" }}>🧏🏼</span>
  </span>

  {/* Animation du titre */}
  <style>{`
    @keyframes shake {
      10%, 90% { transform: translateX(-1px) rotate(-2deg); }
      20%, 80% { transform: translateX(2px) rotate(2deg); }
      30%, 50%, 70% { transform: translateX(-3px) rotate(-2deg); }
      40%, 60% { transform: translateX(3px) rotate(2deg); }
    }
  `}</style>
</div>

{/* ✅ Styles globaux anti-débordement — place-les juste après le titre */}
<style>{`
  :root { --page-max: 900px; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { width: 100%; max-width: 100%; overflow-x: hidden; }
  img, video { max-width: 100%; height: auto; display: block; }
  .page { width: 100%; max-width: var(--page-max); margin: 0 auto; padding-inline: 1rem; }
  .about { overflow-wrap: anywhere; word-wrap: break-word; }
  @media (max-width: 600px){
    .about ul { columns: 1 !important; }
  }
`}</style>

      {!selectedGroup ? (
        <>

          {/* Grille des catégories (2x2) */}
          <div
            className="page"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1.2rem",
              width: "100%",
              maxWidth: "760px",
              margin: "0 auto",
              padding: "0 1rem 1.5rem",
            }}
          >
            {groups.map((g) => (
              <button
                key={g.id}
                style={{
                  background: "rgba(39,68,114,0.07)",
                  borderRadius: "1.5rem",
                  boxShadow: "0 6px 18px rgba(60, 75, 100, 0.15)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.2s ease",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  minHeight: "180px",
                  padding: "1.8rem",
                  fontSize: "1.2rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onClick={() => setSelectedGroup(g.id)}
              >
                <span style={{ fontSize: "3.2rem" }}>{g.emoji}</span>
                <div style={{ marginTop: ".6rem", color: "#274472", fontWeight: "bold", fontSize: "1.1rem", textAlign:"center" }}>
                  {g.label}
                </div>
              </button>
            ))}
          </div>

          {/* Bloc À propos (toujours visible) */}
          <div
            className="page about"
            style={{
              width: "100%",
              maxWidth: "900px",
              background: "#ffffff",
              borderRadius: "1rem",
              boxShadow: "0 4px 16px rgba(60,75,100,0.08)",
              padding: "1.5rem 1.8rem",
              color: "#274472",
              lineHeight: 1.7,
              margin: "1.5rem auto 2rem",
            }}
            dangerouslySetInnerHTML={{ __html: ABOUT_HTML }}
          />
        </>
      ) : (
        /* Détails d'une catégorie */
        <div
          style={{
            background: "rgba(39,68,114,0.04)",
            padding: "1rem",
            borderRadius: "1rem",
            boxShadow: "0 6px 24px rgba(60, 75, 100, 0.10)",
            maxWidth: "520px",
            width: "100%",
            margin: "0.8rem auto 2rem",
          }}
        >
          <button
            style={{
              marginBottom: "0.6rem",
              background: "#274472",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => setSelectedGroup(null)}
          >
            ← Retour
          </button>

          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".6rem"}}>
            <h2 style={{ color: "#274472", margin: 0 }}>
              {groups.find((g) => g.id === selectedGroup).label}
            </h2>
            <button
              onClick={() => cacheCategory(selectedGroup)}
              style={{ background:"#274472", color:"#fff", border:"none", borderRadius:".5rem", padding:".5rem .8rem", cursor:"pointer" }}
            >
              Télécharger cette catégorie
            </button>
          </div>

          {/* Recherche */}
          <input
            type="search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              margin: "0.2rem 0 0.8rem",
              borderRadius: "0.6rem",
              border: "1px solid #c8d3ea",
              fontSize: "1rem"
            }}
            aria-label="Rechercher un mot"
          />

          {/* Liste des mots */}
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
  {filtered.map((item) => {
    const url = getVideoUrl(videoManifest, selectedGroup, item.word);
    return (
      <li
        key={item.word}
        style={{
          background: "#e0eafc",
          margin: "0.4rem 0",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          color: "#274472",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.4rem" }}>{item.emoji}</span>
          <span>{item.word}</span>
        </div>

        {url && (
          <button
            onClick={() => openModal(url, item.word)}
            style={{
              width: 44, height: 44, minWidth: 44, minHeight: 44,
              borderRadius: "50%", border: "2px solid #274472", background: "#274472",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
            }}
            aria-label={`Lire la vidéo ${item.word}`}
            title="Lire la vidéo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        )}
      </li>
    );
  })}
</ul>
        </div>
      )}

      {/* -------- Modal vidéo centrée -------- */}
      {nowPlaying && (
  <div
    onClick={closeModal}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      zIndex: 9999
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()} // évite de fermer si on clique sur la carte/vidéo
      style={{
        background: "#ffffff",
        borderRadius: "1rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        width: "min(92vw, 820px)",
        maxHeight: "92vh",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: ".75rem"
      }}
    >
      {/* Bouton flottant pour fermer (toujours visible) */}
      <button
        onClick={closeModal}
        aria-label="Fermer la vidéo"
        title="Fermer"
        style={{
          position: "fixed",   // fixé à l’écran
          top: "24px",
          right: "24px",
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "rgba(39,68,114,0.98)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          zIndex: 10000
        }}
      >
        ✕
      </button>

      {/* Titre (facultatif) */}
      <h3 style={{ margin: 0, color: "#274472", textAlign: "center" }}>{nowLabel}</h3>

      {/* Vidéo : contrôles natifs uniquement */}
      <video
        src={nowPlaying}
        controls
        playsInline
        autoPlay
        controlsList="nodownload noplaybackrate"
        style={{ width: "100%", borderRadius: ".5rem", background: "#000" }}
      />
    </div>
  </div>
)}

      {/* 🎉 overlay */}
      {celebrate && (
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:99999, fontSize:"2.2rem" }}>
          <div style={{animation:"pop .8s ease-out"}}>🎉 Téléchargement terminé !</div>
          <style>{`@keyframes pop { 0% { transform: scale(.8); opacity:.2 } 60% { transform: scale(1.1); opacity:1 } 100% { transform: scale(1); } }`}</style>
        </div>
      )}

      {/* Modal Stats */}
      {showStats && (
        <div onClick={()=>setShowStats(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", zIndex:9999 }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"1rem", width:"min(92vw, 720px)", boxShadow:"0 20px 60px rgba(0,0,0,.25)", padding:"1rem" }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".6rem"}}>
              <h3 style={{margin:0, color:"#274472"}}>Statistiques de lecture</h3>
              <button onClick={()=>setShowStats(false)} style={{background:"transparent", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#274472"}}>✕</button>
            </div>

            <div style={{maxHeight:"50vh", overflow:"auto"}}>
              {statsArray().length === 0 ? (
                <div style={{color:"#6b7a99"}}>Aucune lecture enregistrée pour le moment.</div>
              ) : (
                <ul style={{listStyle:"none", padding:0, margin:0}}>
                  {statsArray().slice(0,50).map((s, idx)=>(
                    <li key={idx} style={{display:"flex", justifyContent:"space-between", padding:".4rem .2rem", borderBottom:"1px solid #eef3ff"}}>
                      <span><strong>{s.word}</strong> <span style={{color:"#6b7a99"}}>({s.cat})</span></span>
                      <span style={{color:"#274472"}}>{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{display:"flex", gap:".5rem", justifyContent:"flex-end", marginTop:".8rem"}}>
              <button
                onClick={()=>{
                  const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "stats-deaflympics.json";
                  document.body.appendChild(a); a.click(); a.remove();
                  URL.revokeObjectURL(url);
                }}
                style={{background:"#fff", color:"#274472", border:"1px solid #27447244", borderRadius:".6rem", padding:".5rem .8rem"}}
              >
                Exporter JSON
              </button>
              <button
                onClick={()=>{ localStorage.removeItem("stats"); setStats({}); }}
                style={{background:"#fff", color:"#a40000", border:"1px solid #ffcccc", borderRadius:".6rem", padding:".5rem .8rem"}}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Bloc bas de page : Télécharger + aide iPad --- */}
<div
  style={{
    width: "100%",
    maxWidth: "700px",
    margin: "2rem auto 2.5rem",
    padding: "1rem",
    textAlign: "center",
    borderTop: "2px solid rgba(39,68,114,0.1)",
  }}
>
  <button
    onClick={cacheAllCategories}
    disabled={downloading || !Object.keys(videoManifest || {}).length}
    style={{
      background: "#274472",
      color: "#fff",
      border: "none",
      borderRadius: ".7rem",
      padding: ".7rem 1.2rem",
      cursor: "pointer",
      boxShadow: "0 3px 8px rgba(39,68,114,0.2)",
      fontSize: "1rem",
      fontWeight: "bold",
    }}
  >
    {downloading ? `Téléchargement… ${downloadPct}%` : "Télécharger Hors Ligne"}
  </button>

  {/* Notice iPad */}
  <div
    style={{
      marginTop: "1rem",
      background: "rgba(39,68,114,0.05)",
      borderRadius: ".6rem",
      padding: ".8rem 1rem",
      textAlign: "left",
      color: "#274472",
      fontSize: "0.95rem",
      lineHeight: 1.5,
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    }}
  >
    <strong>📲 Installation sur ton CabinPad/PilotPad</strong>
    <ol style={{ marginTop: ".4rem", marginBottom: ".4rem", paddingLeft: "1.2rem" }}>
      <li>Ouvrir ce site dans <strong>Safari</strong>.</li>
      <li>Appuyer sur le bouton <strong>Partager</strong> ⬆️ (le carré avec la flêche qui monte, en haut à droite.)</li>
      <li>Choisir <strong>“Ajouter sur l’écran d’accueil”</strong> ➕.</li>
      <li>Lancer ensuite l’application depuis l’icône sur l’écran d’accueil.</li>
      <li>Clique sur Télécharger Hors Ligne pour avoir accès aux vidéos pendant le vol ! ✈️</li>
    </ol>
    <p style={{ fontSize: ".9rem", opacity: 0.8 }}>
    </p>
  </div>
  {/* Outils (bas de page) */}
<div style={{
  display:"flex",
  gap:".6rem",
  flexWrap:"wrap",
  justifyContent:"center",
  alignItems:"center",
  margin:"1rem .5rem 1.2rem"
}}>
  <button
    onClick={clearAllCaches}
    style={{ background:"#fff", color:"#274472", border:"1px solid #27447244", borderRadius:".7rem", padding:".6rem 1rem", cursor:"pointer" }}
  >
    Vider le cache
  </button>
  <button
    onClick={() => setShowStats(true)}
    style={{ background:"#fff", color:"#274472", border:"1px solid #27447244", borderRadius:".7rem", padding:".6rem 1rem", cursor:"pointer" }}
  >
    📊 Stats
  </button>
  <button
    onClick={openContactMail}
    style={{ background:"#fff", color:"#274472", border:"1px solid #27447244", borderRadius:".7rem", padding:".6rem 1rem", cursor:"pointer" }}
  >
    ✉️ Contact
  </button>
</div>
  {/* Pied de page / mentions */}
          <footer style={{margin:"0 0 1rem", fontSize:".9rem", color:"#6b7a99", textAlign:"center", maxWidth:900, lineHeight:1.5}}>
            © {new Date().getFullYear()} — Usage interne équipages (PNC/PNT) — Glossaire LSF hors-ligne pour les vols Paris ⇄ Tokyo ⇄ Paris.<br/>
            Vidéos : droits réservés à leurs ayants droit / Julien Bazin / Sources d’origine. Ce contenu n’est pas destiné à un usage commercial extérieur.
          </footer>
</div>
    <Analytics />
    </div>
  );
}
