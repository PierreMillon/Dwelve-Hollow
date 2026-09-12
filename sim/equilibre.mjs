// LE SIMULATEUR SANS RENDU
//
// Fait vivre des villages entiers sans dessiner un trait, et rend des
// chiffres. C'est l'instrument qui manquait : quatre défauts d'équilibrage
// ont été trouvés à la main en une nuit, en regardant la page tourner à
// ×100 — lent, peu fiable, et ça a laissé passer un voleur qui mangeait
// toute la production du four.
//
//   node sim/equilibre.mjs                     un aperçu, 12 villages × 60 jours
//   node sim/equilibre.mjs --runs=40 --jours=120
//   node sim/equilibre.mjs --detail            le journal du premier village
//   node sim/equilibre.mjs --check             test de non-régression (code de sortie)
//
// Règle pour la suite : toute constante qui touche à la nourriture, à la
// peur, au soupçon ou à l'usure relance --check avant d'être poussée.

import { creerMonde, REGLAGES } from './monde.mjs';

const arg = (nom, defaut) => {
  const t = process.argv.find(a => a.startsWith(`--${nom}=`));
  return t ? Number(t.split('=')[1]) : defaut;
};
const drapeau = (nom) => process.argv.includes(`--${nom}`);

const JOUR = 90;          // secondes simulées par journée, comme dans la page
const TRANCHE = 0.2;      // même pas de simulation que la page

function unVillage(graine, jours) {
  const M = creerMonde(graine);
  const pas = Math.round(jours * JOUR / TRANCHE);

  const s = {
    graine, jours,
    joursSansPain: 0, joursFamine: 0, joursMoulinCasse: 0,
    faimCumul: 0, peurCumul: 0, rancuneCumul: 0, tensionCumul: 0, mesures: 0,
    buchers: 0, departs: 0, revoltes: 0, dragons: 0, foires: 0, successions: 0, noyades: 0,
    surnoms: 0, couples: 0, bloque: false,
  };

  for (let k = 0; k < pas; k++) {
    M.avancer(TRANCHE);

    // On mesure toutes les minutes simulées, pas une fois par jour : la
    // peur retombe en quarante secondes, donc un relevé quotidien à heure
    // fixe la rate complètement et affiche 0,00 alors qu'un dragon vient
    // de passer. C'est le premier défaut que le simulateur a révélé —
    // sur lui-même.
    if (k % Math.round(60 / TRANCHE) === 0) {
      const vivants = M.habitants.filter(h => h.vivant);
      const moy = (f) => vivants.reduce((t, h) => t + f(h), 0) / (vivants.length || 1);
      s.faimCumul += moy(h => h.faim);
      s.peurCumul += moy(h => h.peur);
      s.rancuneCumul += moy(h => h.rancune);
      s.tensionCumul += M.village.tension;
      if (M.village.pain < 1) s.joursSansPain++;
      if (moy(h => h.faim) > 0.85) s.joursFamine++;
      if (M.MOULINS.some(m => m.etat <= 0.12)) s.joursMoulinCasse++;
      s.peurMax = Math.max(s.peurMax || 0, moy(h => h.peur));
      s.mesures++;
    }
  }

  // On lit le décompte du village, pas sa chronique : celle-ci ne garde
  // que ses deux cents dernières lignes, donc au-delà d'une centaine de
  // jours elle perd ses premiers événements — et le balayage comptait un
  // surnom là où il y en avait eu cinq.
  Object.assign(s, M.village.arrive);
  s.couples = M.habitants.filter(h => h.vivant && h.aime).length / 2;
  s.vivants = M.habitants.filter(h => h.vivant).length;
  s.pain = Math.round(M.village.pain);
  s.ble = Math.round(M.village.ble);
  s.farine = Math.round(M.village.farine);
  s.autorite = M.village.autorite;
  s.chronique = M.chronique;
  return s;
}

function agreger(lots) {
  const n = lots.length;
  const m = (f) => lots.reduce((t, s) => t + f(s), 0) / n;
  return {
    villages: n,
    pctSansPain: m(s => s.joursSansPain / s.mesures) * 100,
    pctFamine: m(s => s.joursFamine / s.mesures) * 100,
    pctMoulinCasse: m(s => s.joursMoulinCasse / s.mesures) * 100,
    faim: m(s => s.faimCumul / s.mesures),
    peur: m(s => s.peurCumul / s.mesures),
    rancune: m(s => s.rancuneCumul / s.mesures),
    tension: m(s => s.tensionCumul / s.mesures),
    buchers: m(s => s.buchers), departs: m(s => s.departs),
    revoltes: m(s => s.revoltes), dragons: m(s => s.dragons),
    successions: m(s => s.successions), surnoms: m(s => s.surnoms),
    noyades: m(s => s.noyades),
    naissances: m(s => s.naissances || 0), majorites: m(s => s.majorites || 0),
    vieillesses: m(s => s.vieillesses || 0), loups: m(s => s.loups || 0),
    meurtres: m(s => s.meurtres || 0),
    couples: m(s => s.couples), vivants: m(s => s.vivants),
    autorite: m(s => s.autorite),
    // ce qui ne revient pas, et la mémoire qui décide
    extinctions: m(s => s.extinctions || 0),
    metiersPerdus: m(s => s.metiersPerdus || 0),
    ruines: m(s => s.ruines || 0),
    paroles: m(s => s.paroles || 0),
    sauvetages: m(s => s.sauvetages || 0),
    pertes: m(s => (s.extinctions || 0) + (s.metiersPerdus || 0) + (s.ruines || 0)),
  };
}

const pct = (v) => `${v.toFixed(1).padStart(5)} %`;
const num = (v) => v.toFixed(2).padStart(6);

function afficher(a, titre) {
  console.log(`\n${titre}  (${a.villages} villages)`);
  console.log('  ── la nourriture ─────────────────────────────');
  console.log(`  journées sans pain        ${pct(a.pctSansPain)}`);
  console.log(`  journées de famine        ${pct(a.pctFamine)}   (faim moyenne > 0,85)`);
  console.log(`  faim moyenne              ${num(a.faim)}`);
  console.log(`  journées moulin cassé     ${pct(a.pctMoulinCasse)}`);
  console.log('  ── les tensions ──────────────────────────────');
  console.log(`  peur moyenne              ${num(a.peur)}`);
  console.log(`  rancune moyenne           ${num(a.rancune)}`);
  console.log(`  tension moyenne           ${num(a.tension)}`);
  console.log(`  autorité du prêtre        ${num(a.autorite)}`);
  console.log('  ── ce qui arrive, par village ────────────────');
  console.log(`  dragons                   ${num(a.dragons)}`);
  console.log(`  foires                    ${num(a.foires ?? 0)}`);
  console.log(`  bûchers                   ${num(a.buchers)}`);
  console.log(`  départs avant la foule    ${num(a.departs)}`);
  console.log(`  révoltes                  ${num(a.revoltes)}`);
  console.log(`  successions à la cabane   ${num(a.successions)}`);
  console.log(`  surnoms gagnés            ${num(a.surnoms)}`);
  console.log(`  noyés dans le brouillard  ${num(a.noyades)}`);
  console.log(`  naissances                ${num(a.naissances ?? 0)}`);
  console.log(`  passages à quatorze ans   ${num(a.majorites ?? 0)}`);
  console.log(`  morts de vieillesse       ${num(a.vieillesses ?? 0)}`);
  console.log(`  loups · meurtres          ${num(a.loups ?? 0)} · ${num(a.meurtres ?? 0)}`);
  console.log(`  couples formés            ${num(a.couples)}`);
  console.log('  ── ce qui ne revient pas ─────────────────────');
  console.log(`  lignées éteintes          ${num(a.extinctions ?? 0)}`);
  console.log(`  métiers perdus            ${num(a.metiersPerdus ?? 0)}`);
  console.log(`  maisons tombées           ${num(a.ruines ?? 0)}`);
  console.log('  ── la mémoire qui décide ─────────────────────');
  console.log(`  foules arrêtées d'un mot  ${num(a.paroles ?? 0)}`);
  console.log(`  repêchés du ruisseau      ${num(a.sauvetages ?? 0)}`);
  console.log(`  habitants en vie          ${num(a.vivants)}`);
}

// ---- les cibles de non-régression ----
// Elles disent ce qu'est un village en bonne santé. Un village où l'on
// manque de pain trois jours sur quatre n'en est pas un.
const CIBLES = [
  ['journées sans pain',    (a) => a.pctSansPain,  0,    35,  '%'],
  ['journées de famine',    (a) => a.pctFamine,    0,    20,  '%'],
  ['faim moyenne',          (a) => a.faim,         0.15, 0.70, ''],
  // 32 % et non 25 : un moulin cassé un quart du temps n'est pas un
  // défaut, c'est le dessein. C'est la seule violence du dragon et le
  // premier maillon de la chaîne qui affame le village. La cible dit
  // « ils sont réparés », pas « ils ne cassent jamais ».
  ['journées moulin cassé', (a) => a.pctMoulinCasse, 0,  32,  '%'],
  ['rancune moyenne',       (a) => a.rancune,      0,    0.55, ''],
  ['tension moyenne',       (a) => a.tension,      0.10, 0.60, ''],
  ['habitants en vie',      (a) => a.vivants,      12,   30,  ''],
  // Ces trois-là manquaient, et leur absence a failli coûter cher : au
  // passage du monde sans hasard, les sept cibles du dessus tenaient
  // toutes pendant que le village devenait muet — zéro bûcher, zéro
  // révolte, zéro surnom sur mille journées. On ne mesurait que le pain.
  // bornes rapportées à six années de village, pas à quatre-vingts jours
  ['bûchers par village',   (a) => a.buchers,      0.2,  7,   ''],
  // PAR HABITANT, ET NON PAR VILLAGE. La borne 1,5–26 avait été calée sur
  // un village de dix-sept âmes — un village qui, on le sait maintenant,
  // était en train de s'éteindre sans qu'on le voie. Depuis que la porte
  // des naissances est rouverte, il en compte vingt-quatre, et une foule
  // se compte en têtes : le chiffre absolu montait mécaniquement alors que
  // le village était PLUS calme par personne (1,08 contre 1,50 avant).
  // On mesure donc ce que la cible voulait dire depuis le début.
  ['révoltes par habitant', (a) => a.revoltes / a.vivants, 0.09, 1.55, ''],
  ['surnoms gagnés',        (a) => a.surnoms,      4,    28,  ''],
  // Le brouillard est un accident, pas un piège : au premier réglage il
  // noyait six habitants par village et le village y passait.
  ['noyés dans le brouillard', (a) => a.noyades,   0,    7,   ''],
  ['naissances par village', (a) => a.naissances,  1,    16,  ''],
  // LE TROISIÈME ACTE. Une borne basse à zéro ne dirait rien : c'est
  // justement le risque qu'il ne se passe jamais rien d'irréversible.
  // Une borne haute non plus : un village qui perd trois métiers en six
  // ans ne se raconte pas, il s'effondre.
  ['pertes définitives',    (a) => a.pertes,       0.4,  4,   ''],
  // LA MÉMOIRE QUI DÉCIDE. Si personne ne parle jamais devant la foule,
  // la dette n'est qu'un nombre rangé dans un coin.
  ["foules arrêtées d'un mot", (a) => a.paroles,   0.5,  8,   ''],
];

function verifier(a) {
  console.log('\n  ── non-régression ────────────────────────────');
  let echecs = 0;
  for (const [nom, f, lo, hi, u] of CIBLES) {
    const v = f(a), ok = v >= lo && v <= hi;
    if (!ok) echecs++;
    console.log(`  ${ok ? '  ok' : 'RATÉ'}  ${nom.padEnd(24)} ${v.toFixed(2).padStart(7)}${u}   attendu ${lo}–${hi}${u}`);
  }
  return echecs;
}

// ---- exécution ----
// Depuis les saisons, quatre-vingts jours ne font que deux années et
// demie : trop court pour qu'un hiver compte, et trop court pour voir
// grandir un enfant. Le contrôle passe à 200 jours, soit six années.
const runs = arg('runs', drapeau('check') ? 16 : 12);
const jours = arg('jours', drapeau('check') ? 200 : 60);
const graine0 = arg('graine', 1);

const t0 = Date.now();
const lots = [];
for (let i = 0; i < runs; i++) lots.push(unVillage(graine0 + i * 7919, jours));
const dt = (Date.now() - t0) / 1000;
const a = agreger(lots);
a.foires = lots.reduce((t, s) => t + s.foires, 0) / lots.length;

afficher(a, `${runs} villages × ${jours} jours`);
// Ce compteur disait « années » en comptant des JOURNÉES : une année de
// village en vaut trente-deux. Le chiffre annoncé était donc trente-deux
// fois trop flatteur, et il a été répété tel quel dans plusieurs rapports.
const parAn = 4 * (REGLAGES.joursParSaison || 8);
console.log(`\n  ${(runs * jours / dt).toFixed(0)} journées de village par seconde` +
            `  ·  ${(runs * jours / parAn / dt).toFixed(1)} années  (${dt.toFixed(1)} s au total)`);

if (drapeau('detail')) {
  console.log(`\n  ── le journal du premier village (graine ${lots[0].graine}) ──`);
  for (const e of lots[0].chronique.slice(0, 40)) console.log(`   jour ${e.jour} — ${e.nu}`);
}

// ---- le contrôle de détermination ----
// Deux villages de même graine doivent écrire mot pour mot la même
// chronique, et un tirage de décor ajouté n'a le droit de rien changer.
// C'est le garde-fou de la faute qui a coûté le plus cher : ajouter un
// bruitage avait déplacé toutes les décisions du village.
function memeMonde(graine, tiragesDeDecor) {
  const M = creerMonde(graine);
  const pas = Math.round(60 * JOUR / TRANCHE);
  for (let k = 0; k < pas; k++) {
    M.avancer(TRANCHE);
    for (let j = 0; j < tiragesDeDecor; j++) M.aleaDeco();
    M.evenements.length = 0; M.nouveaux.length = 0;
  }
  return M.chronique.map(e => `jour ${e.jour} — ${e.nu}`).join('\n');
}

function verifierDetermination() {
  console.log('\n  ── détermination ─────────────────────────────');
  const a = memeMonde(7, 0), b = memeMonde(7, 0), c = memeMonde(7, 3);
  let echecs = 0;
  const dire = (nom, ok) => { console.log(`    ${ok ? 'ok ' : 'RATÉ'} ${nom}`); if (!ok) echecs++; };
  dire('même graine, même chronique', a === b);
  dire('le décor ne change pas l\'histoire', a === c);
  return echecs;
}

if (drapeau('determinisme')) process.exit(verifierDetermination() ? 1 : 0);

if (drapeau('check')) {
  const echecs = verifier(a) + verifierDetermination();
  console.log(echecs ? `\n  ${echecs} cible(s) ratée(s).\n` : '\n  toutes les cibles tenues.\n');
  process.exit(echecs ? 1 : 0);
}
