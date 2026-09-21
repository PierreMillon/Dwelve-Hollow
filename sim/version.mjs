/* ================================================================
   sim/version.mjs — le garde-fou du numéro de version.

   Le cache du service worker porte le numéro de version. S'il n'est
   pas monté à chaque livraison, la nouvelle page ne descend jamais
   chez quelqu'un qui a déjà installé le jeu : il garde l'ancienne
   indéfiniment, et le correctif est invisible là où il comptait.

   C'est arrivé à la v0.38 : le correctif de la loupe iOS était dans
   `index.html`, le cache disait encore `dwelve-v0.37`. Le commentaire
   en haut de `sw.js` le disait déjà en majuscules — un commentaire ne
   retient rien, une mesure si. D'où ce fichier.

       node sim/version.mjs

   Sort 0 si les trois numéros concordent, 1 sinon.
   ================================================================ */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(join(racine, f), 'utf8');

// Le bouton du coin : c'est le numéro que Pierre voit.
const page = lire('index.html');
const bouton = page.match(/<button id="version">\s*v([0-9.]+)\s*<\/button>/);

// La ligne la plus récente de l'historique des versions du menu.
const courante = page.match(/class="v courante"><b>v([0-9.]+)<\/b>/);

// Le nom du cache du service worker.
const cache = lire('sw.js').match(/const CACHE = 'dwelve-v([0-9.]+)';/);

const relevés = [
  ['le bouton de version (index.html)', bouton],
  ["l'entrée courante de l'historique (index.html)", courante],
  ['le nom du cache (sw.js)', cache],
];

let dur = false;
for (const [quoi, m] of relevés) {
  if (!m) { console.log(`  RATÉ  ${quoi} : introuvable`); dur = true; }
}
if (dur) { console.log('\n  le garde-fou ne sait plus où lire — motif à corriger.'); process.exit(1); }

const [a, b, c] = relevés.map(([, m]) => m[1]);
console.log(`\n  ── version ───────────────────────────────────`);
for (const [quoi, m] of relevés) console.log(`    v${m[1].padEnd(6)} ${quoi}`);

if (a === b && b === c) {
  console.log(`\n  les trois concordent : v${a}.`);
  process.exit(0);
}
console.log(`\n  RATÉ  les numéros divergent. Le cache doit porter la version`);
console.log(`        livrée, sinon la page ne descend pas chez les installés.`);
process.exit(1);
