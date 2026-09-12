/* ================================================================
   LE CACHE DU VILLAGE
   Dwelve Hollow n'a pas de serveur : tout le jeu tient dans une page,
   un simulateur, une bibliothèque et un morceau de musique. Il n'y a
   donc aucune raison qu'il lui faille du réseau une fois installé —
   dans le train, dans la forêt, en avion, le village doit tourner.

   Stratégie : on met la coque en cache à l'installation, puis on sert
   d'abord le cache. Le réseau ne sert qu'à la première visite et aux
   fichiers qu'on n'aurait pas prévus.
   ================================================================ */

// À MONTER À CHAQUE VERSION DU JEU, sans quoi les visiteurs déjà
// installés garderont l'ancienne page indéfiniment.
const CACHE = 'dwelve-v0.29';

const COQUE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'sim/monde.mjs',
  'models/avion.js',
  'assets/musique.mp3',
  'vendor/three/three.module.js',
  'vendor/three/three.core.js',
  'vendor/three/OrbitControls.js',
  'vendor/three/OBJLoader.js',
  'vendor/three/LineMaterial.js',
  'vendor/three/LineSegments2.js',
  'vendor/three/LineSegmentsGeometry.js',
  'icones/dwelve-192.png',
  'icones/dwelve-512.png',
  'icones/dwelve-180.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // un fichier manquant ne doit pas faire échouer toute l'installation
    await Promise.all(COQUE.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    for (const nom of await caches.keys()) if (nom !== CACHE) await caches.delete(nom);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // La page elle-même passe par le réseau d'abord quand il y en a : sans
  // ça, une nouvelle version ne se verrait qu'au deuxième lancement.
  const estPage = req.mode === 'navigate' || url.pathname.endsWith('.html');
  if (estPage) {
    ev.respondWith((async () => {
      try {
        const rep = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, rep.clone());
        return rep;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match('index.html')) ||
               new Response('hors ligne', { status: 503 });
      }
    })());
    return;
  }

  ev.respondWith((async () => {
    const enCache = await caches.match(req);
    if (enCache) return enCache;
    try {
      const rep = await fetch(req);
      if (rep.ok) (await caches.open(CACHE)).put(req, rep.clone());
      return rep;
    } catch (err) {
      return new Response('', { status: 504 });
    }
  })());
});
