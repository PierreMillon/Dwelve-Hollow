/* ================================================================
   sim/cadrage.mjs — le garde-fou de la mise en page.

   Deux fois le même défaut : du texte qui se superpose sur un
   téléphone, vu par Pierre sur une capture, invisible ici. La cause
   était à chaque fois un nombre écrit pour un écran d'ordinateur —
   62 pixels en haut, 54 en bas — alors que sur un iPhone l'encoche
   pousse le bandeau, la ligne de saison passe à deux lignes et les
   boutons à deux rangs.

   Ce fichier ouvre la page à trois tailles, force l'encoche, pose le
   nom d'année le plus long, et vérifie que rien ne se chevauche.

       node sim/cadrage.mjs

   env(safe-area-inset-top) n'est pas émulable en navigateur sans
   appareil. Toute la zone sûre du haut passe donc par une seule
   variable, --encoche, et la forcer reproduit exactement l'iPhone.
   `8px + var(--encoche)` vaut `max(8px, env(top))` par construction.
   ================================================================ */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
for (const où of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
  try { ({ chromium } = await import(où)); break; } catch (err) { /* on essaie le suivant */ }
}
if (!chromium) {
  console.log("\n  playwright est introuvable — ce garde-fou a besoin d'un navigateur.");
  console.log('  npm i -D playwright, ou lancez-le depuis un poste qui en a un.\n');
  process.exit(2);
}

const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript',
                '.json': 'application/json', '.webmanifest': 'application/manifest+json',
                '.png': 'image/png', '.mp3': 'audio/mpeg' };

const serveur = createServer(async (req, rep) => {
  const chemin = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  try {
    const corps = await readFile(join(racine, chemin === '/' ? 'index.html' : chemin));
    const ext = chemin.slice(chemin.lastIndexOf('.'));
    rep.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream' });
    rep.end(corps);
  } catch (err) { rep.writeHead(404); rep.end('rien ici'); }
});
await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${serveur.address().port}`;

// L'ENCOCHE de l'iPhone 14 Pro vaut 59 px ; le bandeau en garde 8 de
// marge normale, donc --encoche vaut 51.
const CAS = [
  { nom: 'iPhone 14 Pro (encoche)', w: 393, h: 852, encoche: 51 },
  { nom: 'iPhone SE (sans encoche)', w: 375, h: 667, encoche: 0 },
  { nom: 'ordinateur', w: 1280, h: 800, encoche: 0 },
];

const LONG = "l'année où le dragon revint sur la grange le soir du grand brouillard, et où nul ne dormit";

const nav = await chromium.launch();
let dur = false;

for (const cas of CAS) {
  const page = await nav.newPage({ viewport: { width: cas.w, height: cas.h } });
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.addStyleTag({ content: `:root { --encoche: ${cas.encoche}px }` });
  await page.waitForTimeout(1200);

  // LE CAS LE PLUS LONG DU BANDEAU. Écrire dans #s-annee ne tient pas :
  // la boucle le réécrit à chaque image. On passe par l'état du village,
  // que la boucle relit — c'est le vrai chemin.
  await page.evaluate((nom) => { window.DH.village.annees.push({ nom }); }, LONG);
  await page.waitForTimeout(500);
  const posé = await page.evaluate(() => document.getElementById('s-annee').textContent.length);

  const r = await page.evaluate(() => {
    const b = (id) => document.getElementById(id).getBoundingClientRect();
    const cs = getComputedStyle(document.documentElement);
    return { hud: b('hud'), saison: b('saison'), version: b('version'),
             chronique: b('chronique'), controls: b('controls'),
             haut: cs.getPropertyValue('--haut').trim(), bas: cs.getPropertyValue('--bas').trim(),
             déborde: document.documentElement.scrollWidth > window.innerWidth + 1 };
  });

  const croise = (a, z) => !(a.bottom <= z.top + 0.5 || z.bottom <= a.top + 0.5
                          || a.right <= z.left + 0.5 || z.right <= a.left + 0.5);
  const tests = [
    ["le nom d'année est bien posé", posé > 20],
    ['la saison ne touche pas le bandeau', !croise(r.saison, r.hud)],
    ['la saison ne touche pas la version', !croise(r.saison, r.version)],
    ['la chronique commence sous la saison', r.chronique.top >= r.saison.bottom - 0.5],
    ['la chronique finit sur les boutons', r.chronique.bottom <= r.controls.top + 0.5],
    ['rien ne déborde en largeur', !r.déborde],
    ['aucune erreur de page', erreurs.length === 0],
  ];

  console.log(`\n  ${cas.nom} — ${cas.w}×${cas.h}, --haut ${r.haut}, --bas ${r.bas}`);
  for (const [quoi, ok] of tests) { if (!ok) dur = true; console.log(`    ${ok ? 'ok  ' : 'RATÉ'}  ${quoi}`); }
  if (erreurs.length) console.log('    ' + erreurs.join('\n    '));
  await page.close();
}

await nav.close();
serveur.close();
console.log(dur ? '\n  des choses se superposent.\n' : '\n  rien ne se superpose.\n');
process.exit(dur ? 1 : 0);
