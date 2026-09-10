// BALAYAGE — on essaie des combinaisons de constantes et on garde celles
// qui tiennent les cibles. C'est ce que le simulateur permet et que le
// réglage à la main ne permet pas : cette nuit, quatre passes ont été
// nécessaires pour trouver un seul défaut. Ici on en teste des dizaines
// en quelques secondes.
//
//   node sim/balayage.mjs

import { creerMonde, REGLAGES } from './monde.mjs';

const JOUR = 90, TRANCHE = 0.2;
const VILLAGES = 6, JOURS = 45;

function mesurer(reglages) {
  let sansPain = 0, famine = 0, faim = 0, mesures = 0, morts = 0, rancune = 0, tension = 0, moulin = 0;
  for (let v = 0; v < VILLAGES; v++) {
    const M = creerMonde(1 + v * 7919, reglages);
    const pas = Math.round(JOURS * JOUR / TRANCHE), tousLes = Math.round(60 / TRANCHE);
    for (let k = 0; k < pas; k++) {
      M.avancer(TRANCHE);
      if (k % tousLes) continue;
      const vv = M.habitants.filter(h => h.vivant);
      const f = vv.reduce((t, h) => t + h.faim, 0) / (vv.length || 1);
      faim += f; if (f > 0.85) famine++;
      if (M.village.pain < 1) sansPain++;
      if (M.MOULINS.some(x => x.etat <= 0.12)) moulin++;
      rancune += vv.reduce((t, h) => t + h.rancune, 0) / (vv.length || 1);
      tension += M.village.tension;
      mesures++;
    }
    morts += M.habitants.filter(h => !h.vivant).length;
  }
  return {
    sansPain: sansPain / mesures * 100,
    famine: famine / mesures * 100,
    faim: faim / mesures,
    rancune: rancune / mesures,
    tension: tension / mesures,
    moulin: moulin / mesures * 100,
    morts: morts / VILLAGES,
  };
}

// on garde le reste tel quel et on ne touche qu'aux trois leviers de la
// nourriture : ce que le four sort, ce qu'un pain calme, et la vitesse
// à laquelle on a faim
const GRILLE = {
  usureMeule: [0.0016, 0.0009, 0.0005],
  reparationParSeconde: [0.07, 0.13, 0.22],
  degatDragon: [0.09, 0.05],
};

const combos = [];
for (const a of GRILLE.usureMeule)
  for (const b of GRILLE.reparationParSeconde)
    for (const c of GRILLE.degatDragon)
      combos.push({ usureMeule: a, reparationParSeconde: b, degatDragon: c });

console.log(`${combos.length} combinaisons × ${VILLAGES} villages × ${JOURS} jours\n`);
console.log('   usure  répar dragon │ sans pain  famine   faim  moulin  tension  morts');
console.log('  ─────────────────────┼──────────────────────────────────────────────');

const t0 = Date.now();
const res = [];
for (const c of combos) {
  const m = mesurer(c);
  res.push({ c, m });
  const bon = m.sansPain <= 32 && m.famine <= 18 && m.faim >= 0.15 && m.faim <= 0.70 && m.moulin <= 25;
  console.log(
    `  ${c.usureMeule.toFixed(4)}  ${c.reparationParSeconde.toFixed(2)}  ${c.degatDragon.toFixed(2)}  │` +
    `${m.sansPain.toFixed(1).padStart(9)}% ${m.famine.toFixed(1).padStart(6)}% ${m.faim.toFixed(2).padStart(7)}` +
    ` ${m.moulin.toFixed(1).padStart(6)}% ${m.tension.toFixed(2).padStart(7)} ${m.morts.toFixed(1).padStart(6)}` +
    (bon ? '   ← tient' : ''));
}
console.log(`\n  ${(Date.now() - t0) / 1000} s`);

const bons = res.filter(r => r.m.sansPain <= 32 && r.m.famine <= 18 && r.m.faim >= 0.15 && r.m.faim <= 0.70 && r.m.moulin <= 25);
if (!bons.length) { console.log('\n  aucune combinaison ne tient les cibles.\n'); process.exit(0); }
bons.sort((a, b) => Math.abs(a.m.faim - 0.45) - Math.abs(b.m.faim - 0.45));
const g = bons[0];
console.log(`\n  la plus équilibrée (faim visée ~0,45) :`);
console.log('    ' + Object.entries(g.c).map(([k, v]) => `${k} ${v}`).join('  ·  '));
console.log(`    sans pain ${g.m.sansPain.toFixed(1)} %  ·  famine ${g.m.famine.toFixed(1)} %  ·  faim ${g.m.faim.toFixed(2)}\n`);
