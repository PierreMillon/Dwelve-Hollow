// BALAYAGE — on essaie des combinaisons de constantes et on garde celles
// qui tiennent les cibles. C'est ce que le simulateur permet et que le
// réglage à la main ne permet pas : une nuit entière, quatre passes ont
// été nécessaires pour trouver un seul défaut. Ici on en teste des
// dizaines en une minute.
//
//   node sim/balayage.mjs
//   node sim/balayage.mjs --jours=160 --villages=8
//
// Le balayage mesure aussi le RÉCIT — bûchers, révoltes, surnoms — et pas
// seulement le pain. Le passage au monde sans hasard l'a montré crûment :
// les sept cibles de nourriture tenaient toutes pendant que le village
// devenait muet, sans un seul bûcher en mille journées. Ce qu'on ne
// mesure pas, on le perd sans s'en apercevoir.

import { creerMonde, REGLAGES } from './monde.mjs';

const arg = (nom, defaut) => {
  const t = process.argv.find(a => a.startsWith(`--${nom}=`));
  return t ? Number(t.split('=')[1]) : defaut;
};

const JOUR = 90, TRANCHE = 0.2;
const VILLAGES = arg('villages', 6);
const JOURS = arg('jours', 120);

function mesurer(reglages) {
  const t = { sansPain: 0, famine: 0, faim: 0, rancune: 0, tension: 0, moulin: 0,
              mesures: 0, morts: 0, buchers: 0, revoltes: 0, surnoms: 0, noyades: 0 };
  for (let v = 0; v < VILLAGES; v++) {
    const M = creerMonde(1 + v * 7919, reglages);
    const pas = Math.round(JOURS * JOUR / TRANCHE), tousLes = Math.round(60 / TRANCHE);
    for (let k = 0; k < pas; k++) {
      M.avancer(TRANCHE);
      if (k % tousLes) continue;
      const vv = M.habitants.filter(h => h.vivant);
      const f = vv.reduce((a, h) => a + h.faim, 0) / (vv.length || 1);
      t.faim += f; if (f > 0.85) t.famine++;
      if (M.village.pain < 1) t.sansPain++;
      if (M.MOULINS.some(x => x.etat <= 0.12)) t.moulin++;
      t.rancune += vv.reduce((a, h) => a + h.rancune, 0) / (vv.length || 1);
      t.tension += M.village.tension;
      t.mesures++;
    }
    t.morts += M.habitants.filter(h => !h.vivant).length;
    for (const cle of ['buchers', 'revoltes', 'surnoms', 'noyades']) t[cle] += M.village.arrive[cle];
  }
  return {
    sansPain: t.sansPain / t.mesures * 100,
    famine: t.famine / t.mesures * 100,
    faim: t.faim / t.mesures,
    rancune: t.rancune / t.mesures,
    tension: t.tension / t.mesures,
    moulin: t.moulin / t.mesures * 100,
    morts: t.morts / VILLAGES,
    buchers: t.buchers / VILLAGES,
    revoltes: t.revoltes / VILLAGES,
    surnoms: t.surnoms / VILLAGES,
    noyades: t.noyades / VILLAGES,
  };
}

// Ce qu'un village en bonne santé doit tenir. Les trois dernières lignes
// sont celles qui manquaient : elles disent qu'il s'y passe encore
// quelque chose.
const BORNES = {
  sansPain: [0, 35], famine: [0, 20], faim: [0.15, 0.70], moulin: [0, 32],
  tension: [0.10, 0.60], buchers: [0.4, 8], revoltes: [1, 30], surnoms: [3, 30],
  noyades: [0, 8],
};
const tient = (m) => Object.entries(BORNES).every(([k, [lo, hi]]) => m[k] >= lo && m[k] <= hi);
// de combien on sort, borne par borne, ramené à la largeur de la borne
const ecart = (m) => Object.entries(BORNES).reduce((t, [k, [lo, hi]]) =>
  t + Math.max(0, lo - m[k], m[k] - hi) / (hi - lo || 1), 0);

// ---- la grille du jour -------------------------------------------------
// On ne touche qu'à ce qu'on interroge. Ici : la violence du dragon, et
// le poids des deux conduites qui font l'histoire depuis qu'il n'y a plus
// de dé pour les faire sortir toutes seules.
const GRILLE = {
  usureMeule: [0.0005, 0.00028, 0.00016],
  reparationParSeconde: [0.13, 0.22],
};

const cles = Object.keys(GRILLE);
const combos = [];
(function croiser(i, acc) {
  if (i === cles.length) { combos.push({ ...acc }); return; }
  for (const v of GRILLE[cles[i]]) croiser(i + 1, { ...acc, [cles[i]]: v });
})(0, {});

console.log(`${combos.length} combinaisons × ${VILLAGES} villages × ${JOURS} jours`);
console.log(`leviers : ${cles.join(', ')}\n`);
const entete = cles.map(c => c.slice(0, 7).padStart(7)).join(' ');
console.log(`  ${entete} │ sans pain famine   faim  moulin tension  bûch   rév  surn  morts`);
console.log(`  ${'─'.repeat(entete.length)}─┼───────────────────────────────────────────────────────`);

const t0 = Date.now();
const res = [];
for (const c of combos) {
  const m = mesurer(c);
  res.push({ c, m });
  const gauche = cles.map(k => String(c[k]).padStart(7)).join(' ');
  console.log(
    `  ${gauche} │` +
    `${m.sansPain.toFixed(1).padStart(9)}%${m.famine.toFixed(1).padStart(6)}%` +
    `${m.faim.toFixed(2).padStart(7)}${m.moulin.toFixed(1).padStart(7)}%` +
    `${m.tension.toFixed(2).padStart(8)}` +
    `${m.buchers.toFixed(2).padStart(6)}${m.revoltes.toFixed(1).padStart(6)}` +
    `${m.surnoms.toFixed(1).padStart(6)}${m.morts.toFixed(1).padStart(7)}` +
    (tient(m) ? '   ✓' : ''));
}

console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const bons = res.filter(r => tient(r.m));
if (!bons.length) {
  console.log('  Aucune combinaison ne tient toutes les bornes.');
  const meilleur = res.reduce((a, b) => (ecart(a.m) <= ecart(b.m) ? a : b));
  console.log('  La moins loin :', JSON.stringify(meilleur.c), `écart ${ecart(meilleur.m).toFixed(3)}`);
} else {
  console.log(`  ${bons.length} combinaison(s) tiennent tout :`);
  for (const b of bons) console.log('   ', JSON.stringify(b.c));
}
console.log('\n  valeurs actuelles :', JSON.stringify(
  Object.fromEntries(cles.map(k => [k, REGLAGES[k]]))));
