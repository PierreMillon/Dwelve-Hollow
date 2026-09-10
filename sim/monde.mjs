// LE MONDE — la simulation, et rien d'autre.
//
// Aucune ligne de rendu, aucun appel au DOM, aucune dépendance à three.js :
// ce fichier tourne aussi bien dans la page que dans Node. C'est ce qui
// permet à sim/equilibre.mjs de faire vivre des centaines d'années de
// village en quelques secondes, sans dessiner un seul trait.
//
// Pourquoi ça existe : quatre défauts d'équilibrage ont été trouvés à la
// main en une nuit, en instrumentant la page et en la regardant tourner à
// vitesse ×100. C'est lent, c'est peu fiable, et ça a laissé passer un
// voleur qui mangeait toute l'économie du village. Le principe n°6 du
// carnet le disait depuis le début.
//
// creerMonde() rend un monde indépendant : on peut en faire tourner
// plusieurs dans le même processus, chacun avec sa graine.

export function graineDepuis(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Les constantes que l'équilibrage touche vraiment, rassemblées ici et
// surchargeables : c'est ce qui permet au simulateur de balayer des
// valeurs sans éditer le code, et de dire laquelle tient les cibles.
export const REGLAGES = {
  // Ces trois-là ont été trouvées au balayage (sim/balayage.mjs), pas à
  // l'intuition : 18 combinaisons × 6 villages × 45 jours en 31 secondes.
  // Avant, le village manquait de pain 77 % des journées et connaissait la
  // famine une journée sur deux. Ici : 32 % et 10 %, faim moyenne 0,50 —
  // le village mange, la disette existe, la famine reste un événement.
  painParSeconde: 5.0,      // ce qu'une fournée sort pendant que le boulanger est au four
  farineParSeconde: 1.0,    // ce qu'elle consomme
  painParRepas: 1.0,        // ce qu'un pain enlève de faim
  faimParSeconde: 0.007,    // à quelle vitesse on a faim
  meuleParSeconde: 0.26,    // blé changé en farine par moulin
  usureMeule: 0.0005,       // ce que la meule perd en tournant (balayage)
  moissonAvecOutils: 0.8,
  moissonSansOutils: 0.45,
  volParSeconde: 0.35,
  // Trouvées au balayage elles aussi. Le dragon garde TOUTE sa force de
  // nuisance (0,09) : casser les moulins est sa seule violence et toute
  // la chaîne du drame en dépend. C'est l'usure qui ralentit et la
  // réparation qui s'améliore. Avant : moulins cassés 41 % du temps,
  // donc pas de farine, donc pas de pain. Après : 25 %.
  reparationParSeconde: 0.13,   // ce qu'un artisan remet dans une meule
  // Sans dé, c'est la lassitude qui fait la variété : ce qu'on vient de
  // faire pèse moins lourd, ce qu'on délaisse remonte doucement.
  lassitude: 0.055,         // par seconde passée sur une occupation
  oubli: 0.02,              // par seconde, ce qu'une occupation délaissée regagne
  plafondLassitude: 2.2,
  // Les conduites rares ne sont plus tirées au sort : elles doivent
  // l'emporter franchement quand leur moment vient, ou ne jamais venir.
  poidsAccuser: 6,      // trouvé au balayage
  poidsRevolte: 3,
  poidsVol: 4,
  poidsPriere: 1,
  degatDragon: 0.078,   // balayage : au-dessous, les moulins ne cassent plus assez            // sa chance d'arracher une aile, par seconde de survol
};

export function creerMonde(GRAINE = 1, reglages = {}) {
const R = { ...REGLAGES, ...reglages };
const nouveaux = [];        // les habitants arrivés depuis le dernier tour de rendu

// Les événements sonores. Le monde ne joue aucun son — il dit ce qui
// vient d'arriver, et le rendu en fait ce qu'il veut. C'est cette
// séparation qui permet au simulateur de tourner en silence dans Node.
const evenements = [];
function signaler(quoi, x = 0, z = 0) {
  if (evenements.length < 40) evenements.push({ quoi, x, z });
}

/* ================================================================
   1. HASARD REPRODUCTIBLE
   Tout le hasard passe par ce générateur à graine, jamais par
   Math.random() nu : une même graine doit rejouer exactement le même
   village et la même histoire. C'est la règle de Knight Wars, et c'est
   ce qui rendra possible un simulateur sans rendu (principe n°6).
   ================================================================ */
function generateur(graine) {
  let a = graine >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const alea = generateur(GRAINE);
// Un second générateur, réservé à ce qui ne décide de rien : déclencher
// un son, faire tomber la pluie. Sans lui, ajouter un simple bruitage
// consommerait le flux principal et déplacerait TOUTES les décisions
// suivantes — le contrôle de non-régression l'a attrapé du premier coup.
// Le décor ne doit jamais pouvoir changer l'histoire.
const aleaDeco = generateur((GRAINE ^ 0x9e3779b9) >>> 0);
// Un troisième générateur, pour les accidents du monde : un dragon qui
// vient, une femme qui s'installe à la cabane, un colporteur qui passe.
// Ce sont des processus, pas des décisions — et les séparer garantit
// qu'en ajouter un n'a aucun effet sur ce que les gens choisissent.
const aleaEvenements = generateur((GRAINE ^ 0x85ebca6b) >>> 0);
const entre = (a, b) => a + alea() * (b - a);
const entreE = (a, b) => a + aleaEvenements() * (b - a);
const entreDeco = (a, b) => a + aleaDeco() * (b - a);
const parmi = (t) => t[Math.floor(alea() * t.length)];

/* ================================================================
   3. LE TERRAIN, LE RUISSEAU, LA ROUTE, PUIS LE VILLAGE
   Le sol n'est plus un plan : une butte au nord-est, un ruisseau creusé
   qui traverse toute la carte. Tout le reste s'y pose — et rien ne peut
   être bâti sur la route ni dans l'eau.
   ================================================================ */

// --- le ruisseau : une polyligne qui serpente d'ouest en est ---
const RUISSEAU = [];
for (let i = 0; i <= 22; i++) {
  const t = i / 22, x = -110 + 220 * t;
  RUISSEAU.push([x, -6 + 62 * t + 15 * Math.sin(t * 6.1) + 6 * Math.sin(t * 13.7)]);
}
// --- la route : elle vient du nord et s'en va vers les champs ---
const ROUTE = [[-4,-70],[-3,-46],[-1,-20],[0,0],[2,18],[4,42],[6,70]];

function distPolyligne(pts, x, z) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i+1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx*dx + dz*dz;
    let t = l2 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(x - (ax + t*dx), z - (az + t*dz)));
  }
  return best;
}
const distRuisseau = (x, z) => distPolyligne(RUISSEAU, x, z);
const distRoute = (x, z) => distPolyligne(ROUTE, x, z);

// --- le relief ---
const BUTTE = { x: 34, z: -40, r: 30, h: 8 };
const LARGEUR_EAU = 7, PROFONDEUR_EAU = 2.4;
function hauteur(x, z) {
  let y = 0;
  const d = Math.hypot(x - BUTTE.x, z - BUTTE.z);
  if (d < BUTTE.r) y += BUTTE.h * Math.pow(Math.cos(d / BUTTE.r * Math.PI / 2), 2);
  const e = distRuisseau(x, z);
  if (e < LARGEUR_EAU) y -= PROFONDEUR_EAU * Math.pow(Math.cos(e / LARGEUR_EAU * Math.PI / 2), 2);
  return y;
}

// où la route franchit-elle le ruisseau ? le rendu y posera un pont
let POINT_PONT = null;
(function croisement() {
  let best = Infinity;
  for (let z = -70; z <= 70; z += 0.5) {
    const t = (z + 70) / 140, x = -4 + 10 * t;
    const d = distRuisseau(x, z);
    if (d < best) { best = d; POINT_PONT = { x, z }; }
  }
  if (best >= 4) POINT_PONT = null;
})();

// --- les lieux ---
const LIEUX = [];
let MOULIN_EAU = null, MOULIN_VENT = null;
// Un lieu ne connaît plus sa géométrie : il retient le NOM de sa forme,
// et c'est le rendu qui va la chercher. C'est cette séparation qui permet
// au simulateur de faire tourner un village sans rien dessiner.
function lieu(nom, type, x, z, angle = 0, forme = null, args = []) {
  const y = hauteur(x, z);
  const l = { nom, type, x, z, y, angle, forme, args };
  LIEUX.push(l);
  return l;
}
// On ne bâtit ni sur la route, ni dans l'eau, ni sur un voisin — et
// surtout, on ne renonce jamais en posant quand même. La première version
// abandonnait après 300 essais et retombait sur le point de départ SANS
// LE VÉRIFIER : d'où des maisons dans le ruisseau et sur le chemin.
const BATIS = [];
const MARGE_ROUTE = 7, MARGE_EAU = 4;

function placeLibre(x, z, rayon = 7) {
  if (distRoute(x, z) < MARGE_ROUTE + rayon * 0.4) return false;
  if (distRuisseau(x, z) < LARGEUR_EAU + MARGE_EAU + rayon * 0.3) return false;
  if (hauteur(x, z) < -0.05) return false;              // jamais dans le lit creusé
  for (const b of BATIS) if (Math.hypot(b.x - x, b.z - z) < rayon + b.r) return false;
  return true;
}

// pousse un point hors de la route et de l'eau en descendant leur
// gradient — le filet de sécurité quand le tirage au sort ne trouve rien
function repousser(x, z, rayon) {
  for (let pas = 0; pas < 90; pas++) {
    if (placeLibre(x, z, rayon)) return { x, z };
    let dx = 0, dz = 0;
    const E = 1.5;
    const gr = (f) => [(f(x + E, z) - f(x - E, z)) / (2 * E), (f(x, z + E) - f(x, z - E)) / (2 * E)];
    if (distRoute(x, z) < MARGE_ROUTE + rayon * 0.4) { const [a, b] = gr(distRoute); dx += a; dz += b; }
    if (distRuisseau(x, z) < LARGEUR_EAU + MARGE_EAU + rayon * 0.3) { const [a, b] = gr(distRuisseau); dx += a; dz += b; }
    for (const b of BATIS) {
      const d = Math.hypot(b.x - x, b.z - z);
      if (d < rayon + b.r && d > 0.01) { dx += (x - b.x) / d; dz += (z - b.z) / d; }
    }
    const n = Math.hypot(dx, dz);
    if (n < 1e-4) { x += entre(-4, 4); z += entre(-4, 4); continue; }
    x += (dx / n) * 3; z += (dz / n) * 3;
  }
  return null;
}

function chercherPlace(cx, cz, etendue, rayon) {
  // le tirage au sort d'abord, en élargissant si ça coince
  for (let tour = 0; tour < 6; tour++) {
    const port = etendue * (1 + tour * 0.6);
    for (let essai = 0; essai < 250; essai++) {
      const a = alea() * Math.PI * 2, r = Math.sqrt(alea()) * port;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (placeLibre(x, z, rayon)) { BATIS.push({ x, z, r: rayon }); return { x, z }; }
    }
  }
  // puis le filet : on repousse jusqu'à ce que ce soit valide
  const q = repousser(cx, cz, rayon);
  if (q) { BATIS.push({ x: q.x, z: q.z, r: rayon }); return q; }
  // et si même ça échoue, on le dit plutôt que de bâtir dans l'eau
  console.warn('aucun emplacement trouvé autour de', cx, cz);
  BATIS.push({ x: cx, z: cz, r: rayon });
  return { x: cx, z: cz };
}

const PLACE = { nom: 'la place', type: 'place', x: 0, z: 0, y: hauteur(0, 0) };
LIEUX.push(PLACE);
BATIS.push({ x: 0, z: 0, r: 11 });
{
  const q = chercherPlace(6, 4, 5, 3);
  lieu('le puits', 'puits', q.x, q.z, 0, 'puits');
}

const pEglise = chercherPlace(-14, -30, 8, 12);
const EGLISE = lieu("l'église", 'eglise', pEglise.x, pEglise.z, 0.15, 'eglise');
const pManoir = chercherPlace(30, -12, 8, 11);            // adossé à la butte
const MANOIR = lieu('le manoir', 'manoir', pManoir.x, pManoir.z, -0.45, 'manoir');
const pFour = chercherPlace(-17, 8, 6, 8);
const FOUR = lieu('la boulangerie', 'boulangerie', pFour.x, pFour.z, 0.3, 'boulangerie');
const ATELIERS = [];
for (const [cx, cz, nom] of [[16, 12, "l'atelier du charron"], [-15, 20, "l'atelier du forgeron"]]) {
  const q = chercherPlace(cx, cz, 6, 7);
  ATELIERS.push(lieu(nom, 'atelier', q.x, q.z, entre(-0.7, 0.7), 'atelier'));
}
const pCabane = chercherPlace(-40, 34, 7, 6);             // à l'écart, et ça compte
const CABANE = lieu('la cabane', 'cabane', pCabane.x, pCabane.z, 0.9, 'cabane');

const CHAUMIERES = [];
for (let i = 0; i < 7; i++) {
  const a = -0.5 + i * 0.78, r = entre(20, 30);
  const q = chercherPlace(Math.cos(a) * r, Math.sin(a) * r + 6, 9, 7);
  CHAUMIERES.push(lieu('une chaumière', 'chaumiere', q.x, q.z, entre(-0.6, 0.6),
                       'chaumiere', [entre(3.8, 5), entre(5, 6.4)]));
}

// LES DEUX MOULINS. Ils ne sont pas décoratifs : ce sont eux qui
// changent le blé en farine, et le boulanger n'a plus rien sans eux.
// L'un se pose sur le ruisseau (donc il échappe à la règle qui interdit
// de bâtir dans l'eau), l'autre au sommet de la butte — c'est d'ailleurs
// à ça que sert un relief.
const MOULINS = [];
function poserMoulin(nom, type, x, z, angle, forme, mobile, axe) {
  const y = hauteur(x, z);
  const l = { nom, type, x, z, y, angle, etat: 1, tourne: 0, axe, forme, formeMobile: mobile, args: [],
              secousse: 0, fragilite: entre(0.35, 0.7) };
  LIEUX.push(l); MOULINS.push(l);
  BATIS.push({ x, z, r: 8 });
  return l;
}
{
  // le moulin à eau : on le pose sur la rive, à mi-parcours du ruisseau
  const i = Math.floor(RUISSEAU.length * 0.42);
  const [rx, rz] = RUISSEAU[i], [bx, bz] = RUISSEAU[i + 1];
  const ang = Math.atan2(bx - rx, bz - rz);
  const nx = -(bz - rz), nz = (bx - rx), l = Math.hypot(nx, nz);
  MOULIN_EAU = poserMoulin('le moulin à eau', 'moulin', rx + nx/l * 4.6, rz + nz/l * 4.6,
                           ang, 'moulinEau', 'roue', 'roue');
  const qv = chercherPlace(BUTTE.x, BUTTE.z, 7, 8);
  MOULIN_VENT = poserMoulin('le moulin à vent', 'moulin', qv.x, qv.z,
                            0.6, 'moulinVent', 'ailes', 'ailes');
}

const CHAMPS = [];
for (let i = 0; i < 3; i++) {
  const q = chercherPlace(-22 + i * 20, 46, 8, 10);
  CHAMPS.push(lieu('les champs', 'champ', q.x, q.z));
}

/* ================================================================
   4. LES HABITANTS
   Un métier, cinq traits de caractère, des besoins qui montent tout
   seuls. Aucune décision n'est écrite en dur : à chaque re-tirage,
   chaque occupation possible reçoit un poids et on tire dedans. Deux
   habitants aux traits différents ne feront pas les mêmes choix dans
   la même situation — c'est là que naît ce qu'on n'a pas programmé.
   ================================================================ */
const ROLES = [
  ['seigneur', 1], ['dame', 1], ['pretre', 1], ['boulanger', 1],
  ['charpentier', 1], ['tailleur', 1], ['ebeniste', 1], ['forgeron', 1],
  ['voleur', 1], ['sorciere', 1], ['paysan', 7],
];
const NOM_ROLE = {
  seigneur: 'le seigneur', dame: 'la dame', pretre: 'le prêtre', boulanger: 'le boulanger',
  charpentier: 'le charpentier', tailleur: 'le tailleur de pierre', ebeniste: "l'ébéniste",
  forgeron: 'le forgeron', voleur: 'le voleur', sorciere: 'la sorcière',
  paysan: 'le paysan', colporteur: 'le colporteur',
};

const PRENOMS_H = ['Guillaume','Thibaut','Jehan','Renaud','Gautier','Colin','Foulques','Enguerrand',
                   'Aymeric','Bertrand','Girart','Milon'];
const PRENOMS_F = ['Aliénor','Perrine','Mahaut','Blanche','Aude','Isabeau','Ermengarde','Sibylle',
                   'Emmeline','Guibourc'];
const FEMININ = { dame: 1, sorciere: 1 };
let iH = 0, iF = 0;
function prenomPour(role) {
  const f = !!(FEMININ[role] || (role === 'paysan' && alea() < 0.45));
  return { prenom: f ? PRENOMS_F[iF++ % PRENOMS_F.length] : PRENOMS_H[iH++ % PRENOMS_H.length], feminin: f };
}
const e = (h) => (h.feminin ? 'e' : '');   // l'accord, une bonne fois

const habitants = [];

// LES NOMS. Un prénom seul ne suffit pas dans un village : deux Jehan et
// on ne sait plus de qui on parle. On désambiguïse alors par le métier
// (« Jehan le forgeron ») ou par un repère près de chez soi (« Aude du
// pont »). Et au fil du temps, certains gagnent un surnom qui vient de
// leur histoire, pas de leur métier — c'est celui-là qui reste.
function homonymes(h) {
  return habitants.filter(a => a !== h && a.vivant && a.prenom === h.prenom).length > 0;
}
function attacheDe(h) {
  // le repère le plus proche de son logis, quand le métier ne suffit pas
  let best = null, bd = Infinity;
  for (const l of LIEUX) {
    if (l === h.logis || l.type === 'place' || l.type === 'chaumiere') continue;
    const d = Math.hypot(l.x - h.logis.x, l.z - h.logis.z);
    if (d < bd) { bd = d; best = l; }
  }
  if (!best) return null;
  const n = best.nom.replace(/^(le |la |les |l')/, '');
  return (best.nom.startsWith('les ') ? 'des ' : "du ") + n;
}
function nomComplet(h) {
  if (h.surnom) return `${h.prenom} dit${h.feminin ? 'e' : ''} ${h.surnom}`;
  if (!homonymes(h)) return h.prenom;
  if (!h.attache) h.attache = attacheDe(h);
  const metier = NOM_ROLE[h.role] || '';
  return `${h.prenom} ${metier.replace(/^(le |la |l')/, h.feminin ? 'la ' : 'le ')}`.trim();
}
const nommer = (h) => h.surnom ? `${h.prenom} dit${h.feminin ? 'e' : ''} ${h.surnom}`
                               : `${h.prenom}, ${NOM_ROLE[h.role]}`;
// Les vingt et une occupations possibles. Chacun en a une lecture
// légèrement différente, fixée à sa naissance : c'est ce qui remplace le
// dé. Deux paysans dans la même situation ne feront pas le même choix,
// non parce qu'un tirage les sépare, mais parce qu'ils ne sont pas les
// mêmes hommes.
const OCCUPATIONS = ['dormir', 'manger', 'prier', 'flâner', 'fuir', 'accuser',
  'se révolter', 'courtiser', 'suivre', 'voler', 'moissonner', 'cuire',
  'réparer', 'menuiser', 'forger', 'tailler', 'colporter', 'officier',
  'herboriser', 'inspecter', 'visiter'];

let rangSuivant = 0;
function creerHabitant(role, logis) {
  const penchant = {};
  for (const o of OCCUPATIONS) penchant[o] = 0.72 + alea() * 0.56;
  return {
    role, logis, ...prenomPour(role),
    rang: rangSuivant++, penchant,
    cadence: entre(4, 9),
    usage: Object.fromEntries(OCCUPATIONS.map(o => [o, 0])),
    // ce qu'il faut lui offrir pour qu'elle accepte un pas de plus
    exigence: entre(0.20, 0.50),
    cranPeur: 0,
    x: logis.x + entre(-2, 2), z: logis.z + entre(-2, 2), cible: null,
    vitesse: entre(2.4, 3.4),
    // caractère : cinq nombres, jamais une branche de code
    piete: role === 'pretre' ? entre(0.8, 1) : entre(0, 1),
    courage: role === 'seigneur' ? entre(0.6, 1) : entre(0, 1),
    cupidite: role === 'voleur' ? entre(0.8, 1) : entre(0, 1),
    sociabilite: entre(0.1, 1),
    superstition: role === 'pretre' ? entre(0.5, 1) : entre(0, 1),
    // besoins : ils montent seuls, ce sont eux le moteur
    faim: entre(0, 0.4), fatigue: entre(0, 0.3), foi: entre(0, 0.5), peur: 0,
    soupcon: entre(0, 0.15), rancune: 0, chagrin: 0,
    secret: null, secretForce: 0,   // celle dont il n'a jamais rien dit
    courtise: null, deteste: null, suit: null, evite: null, craint: null,  // posé par les règles écrites
    prochainFlirt: 0, rembarrades: 0, aDitPas: false,
    surnom: null, attache: null,          // voir surnommer() et nomComplet()
    compte: { reparations: 0, vols: 0, prieres: 0, rembarrades: 0, accusations: 0,
              moissons: 0, foires: 0, deuils: 0 },
    memoire: [],            // ce qu'il a fait, et ce qu'on lui a fait
    liens: new Map(),       // affinité avec chaque autre, 0 à 1
    aime: null,
    occupation: 'flâner', prochainChoix: 0, vivant: true,
  };
}
{
  let i = 0;
  for (const [role, n] of ROLES) {
    for (let k = 0; k < n; k++) {
      const logis = role === 'sorciere' ? CABANE
                  : (role === 'seigneur' || role === 'dame') ? MANOIR
                  : role === 'pretre' ? EGLISE
                  : role === 'boulanger' ? FOUR
                  : CHAUMIERES[i++ % CHAUMIERES.length];
      habitants.push(creerHabitant(role, logis));
    }
  }
}

/* ================================================================
   5. L'ÉTAT DU VILLAGE
   ================================================================ */
const village = {
  jour: 1, heure: 0.28,          // 0 = minuit, 0.5 = midi
  ble: 12, farine: 5, pain: 8, outils: 6, meubles: 0, chantier: 0,
  volsCetteNuit: 0,
  fourChauffe: false,        // le four est-il allumé ? (la cheminée fume)
  pluie: 0,                  // 0 à 1, tiré chaque matin
  temps: 0,                      // secondes SIMULÉES écoulées — voir la boucle
  tension: 0, calmeDepuis: 0,    // voir metteurEnScene()
  colporteur: null, joursColporteur: 0,
  jourSansSorciere: 0, bucher: null,
  foire: 0,                      // durée restante, en journées
  dragon: null,
  sorciereChassee: false,
  foule: false, fouleRevolte: false,
  repitFoule: 0, repitRevolte: 0,   // en jours : une foule dispersée ne se reforme pas dans la seconde
  etals: [],
  // LE DEUXIÈME ACTE. Une fois la sorcière partie, le village doit
  // continuer à produire du drame tout seul. Deux pouvoirs s'installent
  // dans le vide qu'elle laisse — l'un vit de la peur, l'autre de la
  // richesse — et chacun prélève sa part sur le même village.
  autorite: 0.2,                 // celle du prêtre : la peur la nourrit
  impot: 0,                      // ce que le seigneur a mis de côté au manoir
  accuse: null,                  // celui que le village a désigné, faute de sorcière
  jourDime: 0, jourImpot: 0,
};
const chronique = [];
function noter(txt, fort = false, qui = null) {
  chronique.push({ txt: `jour ${village.jour} — ${txt}`, fort, qui });
  if (chronique.length > 200) chronique.shift();
}

// Un habitant qui accumule un passé devient quelqu'un. Sans ça, il n'y a
// que des bâtonnets qui bougent.
function souvenir(h, txt) {
  h.memoire.push(`jour ${village.jour} — ${txt}`);
  if (h.memoire.length > 14) h.memoire.shift();
}
const lien = (a, b) => a.liens.get(b) || 0;
function rapprocher(a, b, k) {
  a.liens.set(b, Math.min(1, lien(a, b) + k));
  b.liens.set(a, Math.min(1, lien(b, a) + k));
}

const estNuit = () => village.heure < 0.22 || village.heure > 0.86;
const estJour = () => village.heure > 0.28 && village.heure < 0.78;
const lumiere = () => {                 // 0 la nuit, 1 en plein jour
  const h = village.heure;
  if (h < 0.2 || h > 0.9) return 0.05;
  if (h < 0.3) return (h - 0.2) / 0.1;
  if (h > 0.8) return 1 - (h - 0.8) / 0.1;
  return 1;
};

/* ---- le choix d'occupation : le cœur du système ---- */
// Chaque poids porte sa raison en clair : c'est ce que la fiche affiche,
// et c'est ce qui transforme un aquarium en machine dont on lit les
// rouages. Sans le « pourquoi », un villageois n'est qu'un bâtonnet.
const n2 = (x) => x.toFixed(2);
function poidsDes(h) {
  const p = [];
  const nuit = estNuit(), jour = estJour();
  p.push(['dormir', h.fatigue * h.fatigue * (nuit ? 6 : 0.3), `fatigue ${n2(h.fatigue)}${nuit ? ' · il fait nuit' : ''}`]);
  p.push(['manger', h.faim * h.faim * 3 * (village.pain >= 1 ? 1 : 0.04),
          `faim ${n2(h.faim)}${village.pain >= 1 ? '' : ' · plus de pain'}`]);
  p.push(['prier', (h.foi * h.piete * 1.6 + h.peur * h.piete * 4) * R.poidsPriere * (nuit ? 0.3 : 1),
          `piété ${n2(h.piete)} × (foi ${n2(h.foi)} + peur ${n2(h.peur)})`]);
  p.push(['flâner', h.sociabilite * 0.5 * (jour ? 1 : 0.2) * (village.foire > 0 ? 4 : 1),
          `sociabilité ${n2(h.sociabilite)}${village.foire > 0 ? ' · jour de foire' : ''}`]);
  p.push(['fuir', h.peur * h.peur * (1 - h.courage) * 7, `peur ${n2(h.peur)} × peu de courage`]);
  // l'accusation ne demande pas un scénario : il suffit que la peur, la
  // superstition et le soupçon soient hauts en même temps
  const cible = village.sorciereChassee ? village.accuse : habitants.find(a => a.role === 'sorciere' && a.vivant);
  if (cible && cible !== h) {
    // le prêtre écouté rend l'accusation plus facile : son autorité vient
    // s'ajouter à la superstition de chacun
    const poussee = h.superstition + village.autorite * 0.8;
    // on n'accuse pas quelqu'un qu'on aime bien : la foule s'exclut
    // toute seule de ceux qui connaissent la victime, sans qu'aucune
    // règle ne dise « épargner ses amis »
    const proche = Math.max(lien(h, cible), h.secret === cible ? h.secretForce : 0);
    const rancoeur = h.deteste === cible ? 2.5 : 1;   // une règle « déteste » pèse ici
    p.push(['accuser', h.soupcon * poussee * (0.25 + h.peur) * R.poidsAccuser * (1 - proche) * rancoeur,
            `soupçon ${n2(h.soupcon)} × superstition ${n2(h.superstition)}` +
            (village.autorite > 0.4 ? ` · le prêtre est écouté` : '') +
            (proche > 0.2 ? ` · mais il tient à ${cible.prenom}` : '') +
            (rancoeur > 1 ? ` · une règle : il la déteste` : '')]);
  }
  // la rancune, elle, ne cherche pas un coupable faible : elle monte au manoir
  p.push(['se révolter', h.rancune * h.rancune * h.courage * R.poidsRevolte,
          `rancune ${n2(h.rancune)} × courage ${n2(h.courage)}`]);

  // ce que les règles écrites ajoutent au tirage — ni plus ni moins
  // prioritaire que la faim ou la fatigue
  if (h.courtise && h.courtise.vivant) {
    const lasse = Math.max(0, 1 - h.rembarrades * 0.28);   // on n'insiste pas indéfiniment
    p.push(['courtiser', 2.2 * lasse * (1 - h.peur) * (nuit ? 0.25 : 1),
            `une règle : il tient à ${h.courtise.prenom}` +
            (h.rembarrades ? ` · rembarré ${h.rembarrades} fois` : '')]);
  }
  if (h.suit && h.suit.vivant !== false) {
    p.push(['suivre', 1.6 * (1 - h.peur), `une règle : il suit ${h.suit.prenom || h.suit.nom}`]);
  }
  // Voler n'est pas reserve au voleur : n'importe quel cupide s'y met la
  // nuit si la huche est pleine. C'est ce qui fait que le village ne peut
  // JAMAIS savoir qui l'a fait, et qu'il accuse a cote.
  if (h.cupidite > 0.72 && nuit && (village.pain > 3 || village.farine > 6)) {
    p.push(['voler', (h.cupidite - 0.6) * (1 - h.piete) * R.poidsVol,
            `cupidité ${n2(h.cupidite)} · la nuit · la huche est pleine`]);
  }
  if (jour) {
    const travail = 1.1 * (1 - h.fatigue) * (1 - h.peur * 0.9);
    const pourquoiTravail = `son métier${h.peur > 0.3 ? ` · mais peur ${n2(h.peur)}` : ''}` +
                            (h.fatigue > 0.5 ? ` · fatigue ${n2(h.fatigue)}` : '');
    if (h.role === 'paysan') p.push(['moissonner', travail * (village.ble < PLAFOND_BLE ? 1 : 0.08), pourquoiTravail]);
    if (h.role === 'boulanger') {
      // il voit bien que la huche est vide, et plus elle l'est, plus il s'y met
      const urgence = village.pain < 1 ? 5 : (village.pain < 4 ? 3.2 : 1);
      p.push(['cuire', travail * (village.farine > 0 ? 1.6 : 0.2) * urgence, pourquoiTravail + (village.pain < 1 ? ' · la huche est vide' : '')]);
    }
    // réparer passe avant tout dès qu'un moulin faiblit : sans moulin, pas
    // de farine, et sans farine le four ne sert plus à rien
    const casse = MOULINS.reduce((m, x) => Math.min(m, x.etat), 1);
    if (h.role === 'charpentier') { p.push(['réparer', travail * (1 - casse) * 8, `un moulin est à ${n2(casse)}`]); p.push(['menuiser', travail * 0.7, pourquoiTravail]); }
    if (h.role === 'forgeron')    { p.push(['forger', travail * 1.2, pourquoiTravail]); p.push(['réparer', travail * (1 - casse) * 4, `un moulin est à ${n2(casse)}`]); }
    if (h.role === 'ebeniste')    p.push(['menuiser', travail * 1.2, pourquoiTravail]);
    if (h.role === 'tailleur')    p.push(['tailler', travail * 1.2, pourquoiTravail]);
    if (h.role === 'colporteur')  p.push(['colporter', travail * 2, 'il déballe son ballot']);
    if (h.role === 'pretre') p.push(['officier', travail * 1.4, pourquoiTravail]);
    if (h.role === 'sorciere') p.push(['herboriser', travail, pourquoiTravail]);
    if (h.role === 'seigneur') p.push(['inspecter', travail * (0.6 + h.cupidite), `cupidité ${n2(h.cupidite)}`]);
    if (h.role === 'dame') p.push(['visiter', travail * h.sociabilite, `sociabilité ${n2(h.sociabilite)}`]);
  }
  // Le penchant, en dernier : il ne crée aucune envie, il incline celles
  // qui existent. C'est lui qui fait que deux hommes dans la même
  // situation ne tranchent pas pareil — et il est fixé à la naissance,
  // donc la fiche affiche bien le classement qui a décidé.
  for (const q of p) q[1] *= h.penchant[q[0]] / (1 + h.usage[q[0]]);
  return p;
}

// On se lasse de ce qu'on vient de faire. C'est ce qui remplace le dé :
// sans elle, un homme moissonnerait du lever au coucher sans jamais
// passer à l'église, parce que le travail pèserait toujours plus lourd
// que la prière. Avec elle, il travaille, il s'en lasse, et le reste
// remonte à la surface.
function majLassitude(h, dt) {
  for (const o of OCCUPATIONS) {
    if (o === h.occupation) h.usage[o] = Math.min(R.plafondLassitude, h.usage[o] + dt * R.lassitude);
    else if (h.usage[o] > 0) h.usage[o] = Math.max(0, h.usage[o] - dt * R.oubli);
  }
}
// Plus de dé. On prend ce qui pèse le plus lourd, point.
//
// Ce que ça change : un homme ne fait plus « parfois » une chose et
// « parfois » une autre dans la même situation. Il fait toujours la même,
// et il en change quand sa situation change — la faim monte, la peur
// tombe, le moulin casse. La variété ne vient plus du hasard, elle vient
// de ce que deux hommes ne sont jamais tout à fait dans la même
// situation, ni faits du même bois.
function choisirOccupation(h) {
  const p = poidsDes(h);
  let meilleur = 'flâner', meilleurPoids = 0;
  for (const [nom, w] of p) if (w > meilleurPoids) { meilleurPoids = w; meilleur = nom; }
  return meilleur;
}

// Choisir un lieu sans tirer au sort : chacun a son champ, son établi,
// son coin de place. Le rang le distingue de son voisin, le jour fait
// tourner — même homme, même jour, même champ.
function chez(h, liste, sel = 0) {
  return liste[(h.rang * 7 + village.jour * 3 + sel * 11) % liste.length];
}
function lieuDe(h, occ) {
  switch (occ) {
    case 'dormir': case 'fuir': return h.logis;
    // on mange chez soi, sauf si l'on aime la compagnie
    case 'manger': return h.sociabilite > 0.6 ? PLACE : h.logis;
    case 'prier': case 'officier': return EGLISE;
    case 'flâner': return PLACE;
    case 'accuser': {   // on se rassemble d'abord sur la place, on marche ensuite
      if (!village.foule) return PLACE;
      return village.sorciereChassee ? (village.accuse ? village.accuse.logis : PLACE) : CABANE;
    }
    case 'se révolter': return village.fouleRevolte ? MANOIR : PLACE;
    case 'courtiser': return h.courtise;      // une personne a x et z, comme un lieu
    case 'suivre': return h.suit;
    case 'moissonner': return chez(h, CHAMPS);
    case 'cuire': return FOUR;
    case 'forger': return chez(h, ATELIERS, 1);
    case 'réparer': return MOULINS.reduce((a, b) => (a.etat <= b.etat ? a : b));
    case 'menuiser': return chez(h, ATELIERS, 2);
    case 'tailler': return EGLISE;
    // on vole là où il y a à prendre
    case 'voler': return village.pain >= 1 ? FOUR : PLACE;
    case 'colporter': return PLACE;
    case 'herboriser': return CABANE;
    case 'inspecter': return chez(h, [PLACE, ...CHAMPS, FOUR], 3);
    case 'visiter': return chez(h, [PLACE, EGLISE, ...CHAUMIERES], 4);
    default: return PLACE;
  }
}

/* ================================================================
   6. LA SIMULATION
   ================================================================ */
const JOUR = 90;            // secondes réelles pour une journée, à vitesse ×1
const PLAFOND_BLE = 70;     // au-delà, les greniers débordent et les paysans lèvent le pied
const PROCHE = 2.6;

function simuler(dt) {
  village.temps += dt;
  const dtJour = dt / JOUR;
  village.heure += dtJour;
  if (village.heure >= 1) {
    village.heure -= 1; village.jour++;
    finDeJournee();
  }

  if (village.foire > 0) village.foire = Math.max(0, village.foire - dtJour);
  majDragon(dt);

  village.fourChauffe = false;      // remis à vrai si le boulanger est au four
  let peurTotale = 0, vivants = 0;
  for (const h of habitants) {
    if (!h.vivant) continue;
    vivants++;

    // les besoins montent seuls
    h.faim = Math.min(1, h.faim + dt * R.faimParSeconde);
    h.fatigue = Math.min(1, h.fatigue + dt * (estNuit() ? 0.014 : 0.007));
    h.foi = Math.min(1, h.foi + dt * 0.006);
    h.peur = Math.max(0, h.peur - dt * 0.022);
    h.soupcon = Math.max(0, h.soupcon - dt * 0.006);
    h.rancune = Math.max(0, h.rancune - dt * 0.013);
    h.chagrin = Math.max(0, h.chagrin - dt * 0.004);   // il faut du temps
    // avoir faim pendant que le grenier du manoir est plein, ça ne se
    // pardonne pas : c'est le seul endroit où la faim se change en colère
    if (h.faim > 0.8 && village.impot > 10) h.rancune = Math.min(1, h.rancune + dt * 0.02);
    // la faim qui dure cherche un coupable — c'est ce lien qui fait
    // qu'un dragon qui ne tue personne finit quand même en bûcher
    if (h.faim > 0.85) h.soupcon = Math.min(1, h.soupcon + dt * 0.02 * h.superstition);
    // une règle « craint » ne fait rien d'autre que monter la peur à
    // l'approche — tout le reste en découle par les règles existantes
    if (h.craint) {
      const d = Math.hypot(h.craint.x - h.x, h.craint.z - h.z);
      if (d < 22) h.peur = Math.min(1, h.peur + dt * 0.06 * (1 - d / 22));
    }
    peurTotale += h.peur;

    if (village.temps > h.prochainChoix) {
      h.occupation = choisirOccupation(h);
      h.cible = lieuDe(h, h.occupation);
      // Sa cadence lui appartient : certains reviennent sur leur décision
      // toutes les quatre secondes, d'autres s'y tiennent neuf. La peur
      // presse tout le monde.
      h.prochainChoix = village.temps + h.cadence * (1 - h.peur * 0.5);
    }
    majLassitude(h, dt);
    avancer(h, dt);
    agir(h, dt);
  }
  village.peur = vivants ? peurTotale / vivants : 0;

  majMoulins(dt);
  voisinage(dt);
  majRassemblements();
}

function avancer(h, dt) {
  if (!h.cible) return;
  const dx = h.cible.x - h.x, dz = h.cible.z - h.z;
  const d = Math.hypot(dx, dz);
  if (d < PROCHE) return;
  const v = h.vitesse * (h.occupation === 'fuir' ? 2 : 1) * (1 - h.fatigue * 0.4);
  h.x += (dx / d) * v * dt;
  h.z += (dz / d) * v * dt;
  // « évite » : on se détourne sans cesser d'aller où l'on allait
  if (h.evite) {
    const ex = h.x - h.evite.x, ez = h.z - h.evite.z;
    const de = Math.hypot(ex, ez);
    if (de < 12 && de > 0.01) {
      h.x += (ex / de) * v * dt * 1.4;
      h.z += (ez / de) * v * dt * 1.4;
    }
  }
}
const arrive = (h) => h.cible && Math.hypot(h.cible.x - h.x, h.cible.z - h.z) < PROCHE;

// Le flirt : on s'approche, on tente, et ça marche ou pas. Le refus n'est
// pas une punition du joueur — c'est juste l'autre qui a sa propre vie,
// ses propres liens, et parfois déjà quelqu'un.
function tenterFlirt(h) {
  const c = h.courtise;
  if (!c || !c.vivant || village.temps < h.prochainFlirt) return;
  h.prochainFlirt = village.temps + 26;

  // 1. elle en aime un autre. On peut insister une fois, pas trois.
  if (c.aime && c.aime !== h) {
    h.rembarrades++;
    h.chagrin = Math.min(1, h.chagrin + 0.16);
    if (h.rembarrades === 1) {
      noter(`${c.prenom} en aime un autre. ${h.prenom} l'a bien compris.`, false, h);
      souvenir(h, `a compris que ${c.prenom} en aimait un autre`);
      h.prochainFlirt = village.temps + 120;
    } else {
      renoncer(h, c);
    }
    return;
  }

  // 2. déjà ensemble : plus rien à tenter
  if (c.aime === h) { h.courtise = null; return; }

  // Elle ne tire pas à pile ou face. Elle a une exigence, fixée une fois
  // pour toutes, et il la franchit ou il ne la franchit pas. Chaque
  // rebuffade entame un peu cette exigence — il l'use — mais elle le
  // lasse plus vite qu'il ne l'use : voilà pourquoi la plupart des cours
  // s'éteignent, et pourquoi certaines aboutissent.
  const avance = lien(c, h) * 0.7 + c.sociabilite * 0.25;
  if (avance >= c.exigence - h.rembarrades * 0.03) {
    h.rembarrades = 0;
    rapprocher(h, c, 0.2);
    // une seule ligne pour dire que ça avance — pas une à chaque pas
    if (!h.aDitPas) {
      h.aDitPas = true;
      noter(`${h.prenom} et ${c.prenom} ont fait quelques pas ensemble.`, false, h);
      souvenir(h, `a marché avec ${c.prenom}`);
      souvenir(c, `a marché avec ${h.prenom}`);
    }
    // et ça peut aboutir : courtiser quelqu'un rapproche plus vite que
    // simplement le croiser, donc l'engagement arrive pour de bon
    if (lien(h, c) > 0.72 && lien(c, h) > 0.72 && !c.aime && !h.aime) {
      h.aime = c; c.aime = h; h.courtise = null;
      noter(`${h.prenom} et ${c.prenom} se sont promis l'un à l'autre.`, true, h);
      souvenir(h, `s'est promis${e(h)} à ${c.prenom}`);
      souvenir(c, `s'est promis${e(c)} à ${h.prenom}`);
    }
  } else {
    h.rembarrades++;
    h.chagrin = Math.min(1, h.chagrin + 0.1);
    noter(`${h.prenom} s'est fait rembarrer par ${c.prenom}.`, false, h);
    souvenir(h, `s'est fait rembarrer par ${c.prenom}`);
    h.compte.rembarrades++;
    if (h.rembarrades >= 4) renoncer(h, c);
    else h.prochainFlirt = village.temps + 60;
  }
}

// On n'insiste pas indéfiniment. Renoncer est une fin d'histoire, pas un
// échec du joueur : la règle écrite reste, mais cette personne-là a cessé
// d'espérer, et ça se voit sur sa fiche.
function renoncer(h, c) {
  h.courtise = null;
  h.chagrin = Math.min(1, h.chagrin + 0.25);
  h.prochainFlirt = village.temps + 400;
  noter(`${h.prenom} a cessé d'espérer.`, false, h);
  souvenir(h, `a cessé d'espérer pour ${c.prenom}`);
}

function agir(h, dt) {
  if (h.occupation === 'courtiser' && arrive(h)) { tenterFlirt(h); return; }
  if (!arrive(h)) return;
  switch (h.occupation) {
    case 'dormir': h.fatigue = Math.max(0, h.fatigue - dt * 0.09); break;
    case 'manger':
      if (village.pain >= 1 && h.faim > 0.2) {
        village.pain--; h.faim = Math.max(0, h.faim - R.painParRepas);
      }
      break;
    case 'prier': case 'officier':
      h.foi = Math.max(0, h.foi - dt * 0.11);
      h.peur = Math.max(0, h.peur - dt * 0.09);
      // on ne prie jamais autant que quand on a peur, et c'est le prêtre
      // qui encaisse le crédit : son autorité se nourrit de nos frayeurs
      if (h.peur > 0.35) village.autorite = Math.min(1, village.autorite + dt * 0.03);
      if (h.role === 'pretre' && aleaDeco() < dt * 0.05) signaler('cloche', h.x, h.z);
      h.compte.prieres += dt;
      // le prêtre apaise tout le monde autour de lui, pas seulement lui
      if (h.role === 'pretre') for (const a of habitants) {
        if (a.vivant && Math.hypot(a.x - h.x, a.z - h.z) < 14) a.peur = Math.max(0, a.peur - dt * 0.05);
      }
      break;
    case 'moissonner':
      h.compte.moissons += dt;
      // avec de bons outils on moissonne bien mieux ; les outils s'usent
      if (village.ble < PLAFOND_BLE) {
        village.ble += dt * (village.outils > 0 ? R.moissonAvecOutils : R.moissonSansOutils);
        village.outils = Math.max(0, village.outils - dt * 0.02);
      }
      break;
    case 'forger': village.outils = Math.min(20, village.outils + dt * 0.35); break;
    case 'menuiser': village.meubles += dt * 0.25; break;
    case 'tailler':
      // l'église s'embellit, et une belle église se fait mieux écouter
      village.chantier += dt * 0.1;
      village.autorite = Math.min(1, village.autorite + dt * 0.004);
      break;
    case 'voler': {
      // Mesuré : à 3 pains par seconde, le voleur avalait à lui seul toute
      // la production du four (185 pains produits, 90 mangés, et pourtant
      // la huche vide en permanence). Un vol doit se sentir, pas ruiner.
      village.pain = Math.max(0, village.pain - dt * R.volParSeconde);
      village.farine = Math.max(0, village.farine - dt * R.volParSeconde * 0.86);
      village.volsCetteNuit += dt * R.volParSeconde;
      h.compte.vols += dt * R.volParSeconde;
      break;
    }
    case 'colporter': {
      village.ble += dt * 0.6;
      // ce qu'il sort de son ballot n'a pas de nom : on s'attroupe, on
      // écoute, et on repart avec un peu moins peur
      for (const a of habitants) {
        if (!a.vivant || a === h) continue;
        if (Math.hypot(a.x - h.x, a.z - h.z) > 10) continue;
        a.peur = Math.max(0, a.peur - dt * 0.05);
        a.sociabilite = Math.min(1, a.sociabilite + dt * 0.004);
      }
      break;
    }
    case 'cuire':
      village.fourChauffe = true;
      if (village.farine >= dt * R.farineParSeconde) {
        village.farine -= dt * R.farineParSeconde;
        village.pain += dt * R.painParSeconde;
      }
      break;
    case 'réparer':
      if (h.cible && h.cible.etat !== undefined) {
        h.cible.etat = Math.min(1, h.cible.etat + dt * R.reparationParSeconde);
        if (aleaDeco() < dt * 1.4) signaler('marteau', h.x, h.z);
        h.compte.reparations += dt * R.reparationParSeconde;
        if (h.cible.reparationSignalee && h.cible.etat > 0.9) {
          h.cible.reparationSignalee = false;
          noter(`${nommer(h)} a remis ${h.cible.nom} en marche.`, false, h);
          souvenir(h, `a remis ${h.cible.nom} en marche`);
        }
      }
      break;
    case 'herboriser':
      // la sorcière soigne : elle enlève de la fatigue à qui passe la voir
      for (const a of habitants) {
        if (!a.vivant || a === h) continue;
        if (Math.hypot(a.x - h.x, a.z - h.z) >= 8) continue;
        a.fatigue = Math.max(0, a.fatigue - dt * 0.05);
        // Et il arrive qu'on s'attache à celle qui vous soigne quand
        // personne d'autre ne vous parle. Ça ne se déclare jamais — elle
        // ne le saura pas, le village non plus. Mais le jour où on vient
        // la chercher, ceux-là pleurent sans pouvoir dire pourquoi.
        if (!a.aime && (!a.secret || a.secret === h) && a.sociabilite < 0.55) {
          a.secret = h;
          a.secretForce = Math.min(1, a.secretForce + dt * 0.02 * (1 - a.sociabilite));
        }
      }
      break;
    case 'flâner':
      if (h.sociabilite > 0.5) h.foi = Math.max(0, h.foi - dt * 0.01);
      break;
  }
}

// Les moulins sont de l'infrastructure, pas des personnages : l'eau et le
// vent font le travail tout seuls. Mais ils s'usent, et un moulin arrêté
// coupe la chaîne blé → farine → pain d'un coup, sans que personne
// n'ait rien décidé.
function majMoulins(dt) {
  for (const m of MOULINS) {
    const marche = m.etat > 0.12 && village.ble > 0;
    m.tourne += dt * (marche ? (m.axe === 'roue' ? 1.6 : 1.1) : 0);
    if (!marche) continue;
    const debit = dt * R.meuleParSeconde * m.etat;   // plus lent que la moisson, sinon le blé reste à zéro
    village.ble = Math.max(0, village.ble - debit);
    village.farine += debit * 0.92;
    m.etat = Math.max(0, m.etat - dt * R.usureMeule);      // l'usure de la meule
    if (m.etat <= 0.12 && !m.reparationSignalee) {
      m.reparationSignalee = true;
      noter(`${m.nom} s'est arrêté. La meule ne tourne plus.`, true);
    }
  }
}

/* ---- le voisinage : la rumeur ET l'affection passent par le même
       endroit, à savoir deux personnes qui se croisent souvent ---- */
function voisinage(dt) {
  for (let i = 0; i < habitants.length; i++) {
    const a = habitants[i];
    if (!a.vivant) continue;
    for (let j = i + 1; j < habitants.length; j++) {
      const b = habitants[j];
      if (!b.vivant) continue;
      if (Math.hypot(a.x - b.x, a.z - b.z) > 5) continue;

      // se voir souvent, ça rapproche — sauf si une règle dit le contraire
      if (a.deteste === b || b.deteste === a) {
        a.liens.set(b, Math.max(0, lien(a, b) - dt * 0.03));
        b.liens.set(a, Math.max(0, lien(b, a) - dt * 0.03));
      } else {
        rapprocher(a, b, dt * 0.012 * (0.3 + a.sociabilite) * (0.3 + b.sociabilite));
      }

      // deux voisins rapprochent aussi leurs soupçons ; le plus convaincu
      // tire l'autre à lui, jamais l'inverse en entier
      if (a.role !== 'sorciere' && b.role !== 'sorciere' && !village.sorciereChassee) {
        const m = (a.soupcon + b.soupcon) / 2;
        const k = dt * 0.35;
        a.soupcon += (m - a.soupcon) * k * (0.4 + b.sociabilite);
        b.soupcon += (m - b.soupcon) * k * (0.4 + a.sociabilite);
      }

      // et quand deux personnes ne se quittent plus, ça finit par se dire
      if (!a.aime && !b.aime && lien(a, b) > 0.86 && a.role !== 'colporteur' && b.role !== 'colporteur') {
        a.aime = b; b.aime = a;
        noter(`${a.prenom} et ${b.prenom} se sont promis l'un à l'autre.`, true, a);
        souvenir(a, `s'est promis${e(a)} à ${b.prenom}`);
        souvenir(b, `s'est promis${e(b)} à ${a.prenom}`);
      }
    }
  }
}

// SEUIL DE REGROUPEMENT — le motif repris de Bastion Orbit. Personne
// n'écrit « faire une chasse aux sorcières » ni « déclencher une
// révolte » : il suffit qu'assez de gens du même avis se retrouvent au
// même endroit. Deux colères, deux seuils, deux destinations.
const SEUIL_FOULE = 4, SEUIL_REVOLTE = 4;

// Faute de sorcière, le village en désigne un autre. La règle est d'une
// simplicité qui fait froid dans le dos : c'est le moins sociable qui est
// choisi, celui à qui personne ne parlait déjà. Et si c'est le boulanger,
// le village se coupe le pain tout seul.
function designerBouc() {
  // on ne désigne jamais l'étranger : seul, sans terre et sans menace, il
  // intrigue plus qu'il n'inquiète — et c'est précisément ce qui le sauve
  const candidats = habitants.filter(h => h.vivant &&
    h.role !== 'pretre' && h.role !== 'seigneur' && h.role !== 'colporteur');
  if (!candidats.length) return null;
  candidats.sort((a, b) => a.sociabilite - b.sociabilite);
  const bouc = candidats[0];
  village.accuse = bouc;
  if (village.autorite > 0.5) noter(`Du haut de la chaire, on a nommé ${nommer(bouc)}.`, true);
  else noter(`Les regards se sont tournés vers ${nommer(bouc)}.`, true);
  return bouc;
}

function cibleAccusee() {
  if (!village.sorciereChassee) return habitants.find(h => h.role === 'sorciere' && h.vivant) || null;
  if (village.accuse && village.accuse.vivant) return village.accuse;
  return null;
}

function majRassemblements() {
  const visee = cibleAccusee();
  const chauds = habitants.filter(h => h.vivant && h.occupation === 'accuser' && h.soupcon > 0.55);
  if (!visee && chauds.length >= SEUIL_FOULE) designerBouc();

  if (visee) {
    const surLaPlace = chauds.filter(h => h !== visee && Math.hypot(h.x - PLACE.x, h.z - PLACE.z) < 13);
    if (!village.foule && village.jour >= village.repitFoule && surLaPlace.length >= SEUIL_FOULE) {
      village.foule = true;
      village.bucher = { x: PLACE.x - 5, z: PLACE.z - 5 };
      noter(`${surLaPlace.length} villageois se rassemblent. Ils vont chercher du bois.`, true, visee);
      signaler('rumeur', PLACE.x, PLACE.z);
      for (const h of surLaPlace) {
        h.cible = visee.logis; h.prochainChoix += 30;
        souvenir(h, `est allé chercher du bois pour ${visee.prenom}`);
        h.compte.accusations++;
      }
    }
    if (village.foule) {
      const arrives = chauds.filter(h => h !== visee &&
        Math.hypot(h.x - visee.logis.x, h.z - visee.logis.z) < 7);
      if (arrives.length >= 2) {
        // Le seigneur peut s'interposer, mais seulement s'il est brave ET
        // sur place. Deux nombres qui s'opposent, rien de scripté.
        const sgr = habitants.find(h => h.role === 'seigneur' && h.vivant);
        const protege = sgr && sgr.courage > 0.65 &&
          Math.hypot(sgr.x - visee.logis.x, sgr.z - visee.logis.z) < 22;
        village.foule = false; village.bucher = null;
        village.repitFoule = village.jour + 2;
        if (protege) {
          noter(`${nommer(sgr)} s'est interposé. La foule s'est défaite.`, true);
          village.autorite = Math.max(0, village.autorite - 0.2);
          // tout le monde change d'avis, pas seulement les arrivés — sinon
          // les autres relancent une foule dans la seconde
          for (const h of chauds) { h.soupcon *= 0.3; h.prochainChoix = 0; }
        } else {
          const courageMoyen = arrives.reduce((t, h) => t + h.courage, 0) / arrives.length;
          finirAccusation(visee, courageMoyen > 0.5);
        }
      }
    }
  }

  const furieux = habitants.filter(h => h.vivant && h.occupation === 'se révolter');
  if (!village.fouleRevolte && village.jour >= village.repitRevolte && furieux.length >= SEUIL_REVOLTE) {
    village.fouleRevolte = true;
    noter(`${furieux.length} villageois montent vers le manoir.`, true);
    signaler('rumeur', MANOIR.x, MANOIR.z);
    for (const h of furieux) { h.cible = MANOIR; h.prochainChoix += 25; }
  }
  if (village.fouleRevolte) {
    const devant = furieux.filter(h => Math.hypot(h.x - MANOIR.x, h.z - MANOIR.z) < 9);
    if (devant.length >= 2) {
      village.fouleRevolte = false;
      village.repitRevolte = village.jour + 2;
      const sgr = habitants.find(h => h.role === 'seigneur' && h.vivant);
      if (sgr && sgr.courage > 0.6) {
        noter(`${nommer(sgr)} est sorti seul sur le perron. Ils sont redescendus.`);
        for (const h of habitants) if (h.vivant) h.rancune *= 0.5;   // tout le village se calme, pas seulement ceux d'en haut
      } else {
        const rendu = Math.round(village.impot * 0.7);
        village.ble += rendu; village.impot -= rendu;
        noter(`Le manoir a rendu ${rendu} mesures de grain.`, true);
        for (const h of habitants) if (h.vivant) h.rancune *= 0.25;
      }
      // ils redescendent tous : sans ça, ils gardent l'occupation
      // « se révolter » et la foule se reforme à l'image suivante
      for (const h of furieux) h.prochainChoix = 0;
    }
  }
}

function finirAccusation(v, jusquauBout) {
  v.vivant = false;
  // Ceux qui l'aimaient encaissent. C'est ce qui rend le bûcher coûteux :
  // la foule crée les rancunes de demain sans le savoir.
  for (const h of habitants) {
    if (!h.vivant || h === v) continue;
    const tenait = h.secret === v ? h.secretForce : 0;
    const l = Math.max(lien(h, v), tenait);
    if (l < 0.3) continue;
    h.chagrin = Math.min(1, h.chagrin + l);
    h.rancune = Math.min(1, h.rancune + l * 0.45);
    h.soupcon = 0;
    souvenir(h, tenait >= l ? `l'a pleurée sans rien dire` : `a perdu ${v.prenom}`);
    h.compte.deuils++;
    if (tenait > 0.5) { h.secret = null; h.secretForce = 0; }
  }
  if (v.aime && v.aime.vivant) {
    souvenir(v.aime, `est resté${e(v.aime)} seul${e(v.aime)}`);
    v.aime.aime = null;
  }
  if (v.role === 'sorciere') { village.sorciereChassee = true; village.jourSansSorciere = 0; }
  if (village.accuse === v) village.accuse = null;
  if (jusquauBout) noter(`Le bûcher a brûlé sur la place. ${nommer(v)} n'est plus.`, true);
  else noter(`${nommer(v)} a pris la route avant eux. La maison est vide.`, true);
  // le village vient de se priver de ce que cette personne faisait
  const manque = {
    boulanger: 'Il ne reste personne pour tenir le four.',
    charpentier: 'Il ne reste personne pour remonter une meule.',
    forgeron: "Les outils s'useront sans être refaits.",
    sorciere: 'Plus personne ne sait quoi faire des simples.',
  }[v.role];
  if (manque) noter(manque);
  village.autorite = Math.min(1, village.autorite + 0.1);   // le prêtre avait « raison »
  for (const h of habitants) { h.soupcon *= 0.2; h.prochainChoix = 0; }
  souvenir(v, jusquauBout ? `a été brûlé${e(v)} sur la place` : 'a dû quitter le village');
}

// LA SUCCESSION. Une place vide à l'écart ne le reste jamais longtemps :
// une femme que son homme a laissée s'y installe, et tout peut
// recommencer. C'est ce qui empêche l'histoire de s'arrêter au premier
// bûcher.
function succession() {
  village.jourSansSorciere++;
  if (village.jourSansSorciere < 4 || aleaEvenements() > 0.45) return;
  const nouvelle = creerHabitant('sorciere', CABANE);
  nouvelle.superstition = entre(0, 0.3);
  habitants.push(nouvelle);
  nouveaux.push(nouvelle);
  village.sorciereChassee = false;
  village.jourSansSorciere = 0;
  noter(`${nouvelle.prenom}, que son homme a laissée, s'est installée dans la cabane.`, true, nouvelle);
  souvenir(nouvelle, "s'est installée dans la cabane");
  nouvelle.feminin = true;
}

// LE COLPORTEUR. Il n'appartient pas à la foire : il arrive quand il veut
// et repart de même. Il loge à la cabane, chez celle que le village tient
// déjà à distance — les deux à l'écart se tiennent compagnie. Il apporte
// des choses qu'on ne voit pas ailleurs, et on ne l'accuse pas.
function majColporteur() {
  const c = village.colporteur;
  if (c && c.vivant) {
    village.joursColporteur--;
    if (village.joursColporteur <= 0) {
      c.vivant = false;
      village.colporteur = null;
      noter(`${c.prenom} a repris la route avant le jour. Son ballot était plus léger.`);
    }
    return;
  }
  village.colporteur = null;
  if (aleaEvenements() > 0.22) return;
  const venu = creerHabitant('colporteur', CABANE);
  venu.sociabilite = entre(0.6, 1);
  venu.superstition = entre(0, 0.25);
  habitants.push(venu);
  nouveaux.push(venu);
  village.colporteur = venu;
  village.joursColporteur = Math.round(entre(2, 6));
  noter(`${venu.prenom}, colporteur, est entré par la route du nord. Il logera à la cabane.`, true, venu);
  souvenir(venu, 'est arrivé par la route du nord');
}

// Les surnoms ne se distribuent pas : ils se gagnent. Chacun vient d'un
// compteur ou d'un trait poussé loin, et le village met un moment à s'y
// mettre — d'où le seuil, et la ligne dans la chronique le jour où le nom
// prend.
// Un surnom marque celui qui SE DÉTACHE, pas celui qui a duré. Premier
// essai avec des seuils absolus : au bout de cinquante jours, six
// villageois sur neuf s'appelaient « le dévot », parce que le compteur de
// prières monte pour tout le monde. Les scores sont donc relatifs à la
// moyenne du village — il faut faire nettement plus que les autres.
function moyenneDe(champ) {
  let t = 0, n = 0;
  for (const h of habitants) { if (!h.vivant) continue; t += h.compte[champ]; n++; }
  return n ? t / n : 0;
}
// combien de fois au-dessus de la moyenne, moins le seuil de 2 : à 3× la
// moyenne le score vaut 1, ce qui commence à être remarquable
const saillant = (v, moy, seuil = 2) => (moy < 0.5 ? -9 : v / moy - seuil);

const SURNOMS = [
  { f: 'la hargneuse',   m: 'le hargneux',    score: (h) => (h.rancune - 0.82) * 8 },
  { f: "l'éconduite",    m: "l'éconduit",     score: (h, mo) => saillant(h.compte.rembarrades, Math.max(0.6, mo.rembarrades), 2.5) },
  { f: 'la main leste',  m: 'la main leste',  score: (h, mo) => saillant(h.compte.vols, mo.vols, 3) },
  { f: "aux mains d'or", m: "aux mains d'or", score: (h, mo) => saillant(h.compte.reparations, mo.reparations, 3) },
  { f: 'la dévote',      m: 'le dévot',       score: (h, mo) => saillant(h.compte.prieres, mo.prieres, 2.4) + (h.piete > 0.75 ? 0.4 : -1.5) },
  { f: 'la taciturne',   m: 'le taciturne',   score: (h) => (0.12 - h.sociabilite) * 9 - h.liens.size * 0.15 },
  { f: "l'avare",        m: "l'avare",        score: (h, mo) => (h.cupidite - 0.9) * 5 + saillant(h.compte.vols, mo.vols, 2) },
  { f: 'la corbeille',   m: 'outre à vin',    score: (h, mo) => saillant(h.compte.foires, mo.foires, 1.6) + (h.piete < 0.25 ? 0.4 : -3) },
  { f: 'la douloureuse', m: 'le douloureux',  score: (h, mo) => saillant(h.compte.deuils, Math.max(0.4, mo.deuils), 2.5) },
  { f: 'la brûlante',    m: 'le brûlant',     score: (h, mo) => saillant(h.compte.accusations, Math.max(0.8, mo.accusations), 2.5) },
];

// et le village n'en trouve pas un par jour : on ne nomme que le cas le
// plus marquant, et seulement s'il dépasse vraiment
function surnommer() {
  const mo = {};
  for (const c of ['rembarrades', 'vols', 'reparations', 'prieres', 'foires', 'deuils', 'accusations']) {
    mo[c] = moyenneDe(c);
  }
  let meilleur = null, meilleurScore = 1;
  for (const h of habitants) {
    if (!h.vivant || h.surnom) continue;
    for (const su of SURNOMS) {
      const sc = su.score(h, mo);
      if (sc > meilleurScore) { meilleurScore = sc; meilleur = { h, su }; }
    }
  }
  if (!meilleur) return;
  const { h, su } = meilleur;
  h.surnom = h.feminin ? su.f : su.m;
  noter(`On a commencé à l'appeler ${h.surnom}. C'était ${h.prenom}.`, false, h);
  souvenir(h, `a gagné son surnom : ${h.surnom}`);
}

function finDeJournee() {
  surnommer();
  // le temps qu'il fait : la plupart des jours sont secs, il pleut
  // franchement de temps en temps. Aucun effet mécanique — c'est là pour
  // que deux minutes de contemplation soient belles.
  village.pluie = aleaDeco() < 0.26 ? 0.35 + aleaDeco() * 0.65 : 0;
  if (village.pain < 1) noter('Il ne reste plus de pain au village.');

  if (village.volsCetteNuit > 1.2) {
    // le village sait qu'on l'a volé, mais pas par qui — et c'est
    // exactement ce qui nourrit le soupçon de travers
    noter("La huche était plus vide qu'elle n'aurait dû l'être.");
    for (const h of habitants) if (h.vivant) h.soupcon = Math.min(1, h.soupcon + 0.12 * h.superstition);
  }
  village.volsCetteNuit = 0;

  // LA DÎME. Un prêtre écouté prélève sa part, et ceux qui croient le
  // moins le prennent mal. Deux pouvoirs se servent sur le même village.
  const pretre = habitants.find(h => h.role === 'pretre' && h.vivant);
  if (pretre && village.autorite > 0.5 && village.pain > 4 && village.jour >= village.jourDime + 3) {
    village.jourDime = village.jour;
    const part = Math.round(village.pain * 0.22);
    village.pain -= part;
    noter(`La dîme est levée : ${part} pain${part > 1 ? 's' : ''} part${part > 1 ? 'ent' : ''} à l'église.`, false, pretre);
    souvenir(pretre, `a levé la dîme : ${part} pains`);
    for (const h of habitants) if (h.vivant) h.rancune = Math.min(1, h.rancune + 0.09 * (1 - h.piete));
  }

  // L'IMPÔT. Le seigneur ne prélève pas quand il a faim : il prélève
  // quand il voit les greniers pleins. C'est sa cupidité qui décide.
  const sgr = habitants.find(h => h.role === 'seigneur' && h.vivant);
  const reserve = village.ble + village.farine;
  if (sgr && reserve > 24 && village.jour >= village.jourImpot + 4) {
    village.jourImpot = village.jour;
    const taux = 0.15 + sgr.cupidite * 0.2;
    const surBle = Math.round(village.ble * taux), surFarine = Math.round(village.farine * taux);
    const part = surBle + surFarine;
    village.ble -= surBle; village.farine -= surFarine; village.impot += part;
    noter(`Le manoir a levé l'impôt : ${part} mesure${part > 1 ? 's' : ''} de grain.`, false, sgr);
    for (const h of habitants) if (h.vivant && h !== sgr) h.rancune = Math.min(1, h.rancune + 0.10 * h.courage);
    souvenir(sgr, `a levé l'impôt : ${part} mesures`);
  }

  village.autorite = Math.max(0, village.autorite - 0.02);   // elle retombe si rien n'effraie
  if (village.sorciereChassee) succession();
  majColporteur();

  if (village.jour % 6 === 0) lancerFoire();      // la foire est au calendrier, pas au hasard
  else if (village.jour > 3) metteurEnScene();

  const guerisseuse = habitants.find(h => h.role === 'sorciere' && h.vivant);
  if (!guerisseuse && village.jour % 4 === 0) {
    for (const h of habitants) if (h.vivant) h.fatigue = Math.min(1, h.fatigue + 0.18);
    noter('Les fièvres traînent. Plus personne ne sait quoi faire des simples.');
  }
}

// LE METTEUR EN SCÈNE. Jusqu'ici le dragon tombait sur un tirage
// aléatoire chaque jour : soit rien pendant huit jours, soit deux
// catastrophes d'affilée. Le modèle retenu (AI Director de Left 4 Dead,
// déjà cité dans ce carnet) dit l'inverse : on suit une TENSION et on la
// pilote. Un pic ne se ressent comme un pic que s'il y a eu un vrai répit
// avant — et il se passe toujours quelque chose *bientôt*.
function tensionActuelle() {
  let peur = 0, faim = 0, rancune = 0, n = 0;
  for (const h of habitants) {
    if (!h.vivant) continue;
    peur += h.peur; faim += h.faim; rancune += h.rancune; n++;
  }
  if (!n) return 0;
  const casse = MOULINS.reduce((m, x) => Math.min(m, x.etat), 1);
  const disette = village.pain < 2 ? 0.25 : 0;
  return Math.min(1, (peur/n) * 0.45 + (faim/n) * 0.3 + (rancune/n) * 0.3
                     + (1 - casse) * 0.2 + disette + (village.foule ? 0.3 : 0));
}

function metteurEnScene() {
  village.tension = tensionActuelle();
  if (village.tension > 0.6) {           // il se passe déjà bien assez
    village.calmeDepuis = 0;
    return;
  }
  village.calmeDepuis++;
  // plus le calme dure, plus il devient probable que quelque chose arrive
  const chance = Math.max(0, (village.calmeDepuis - 2) * 0.22);
  if (aleaEvenements() < chance) {
    village.calmeDepuis = 0;
    lancerDragon();
  }
}

function lancerFoire() {
  village.foire = 0.55;
  village.etals = [];
  for (let i = 0; i < 5; i++) {
    const a = aleaDeco() * Math.PI * 2, r = entreDeco(5, 9);
    village.etals.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, angle: aleaDeco() * Math.PI });
  }
  village.ble += 10;
  noter('Foire aux bestiaux. Les étals se dressent sur la place.', true);
  signaler('foire', PLACE.x, PLACE.z);
  for (const h of habitants) {
    if (!h.vivant) continue;
    h.prochainChoix = 0;
    h.sociabilite = Math.min(1, h.sociabilite + 0.05);
    h.compte.foires++;
  }
}

function lancerDragon() {
  if (village.dragon) return;
  // D'où il arrive décide de qui il effraie le premier : ce n'est donc
  // pas du décor, c'est un accident du monde.
  const a = aleaEvenements() * Math.PI * 2;
  for (const m of MOULINS) m.secousse = 0;
  village.dragon = { a, r: 120, y: 34, t: 0, parti: false };
  noter('Une ombre passe sur les toits. Un dragon tourne au-dessus du village.', true);
  signaler('souffle');
}
function majDragon(dt) {
  const d = village.dragon;
  if (!d) return;
  d.t += dt;
  d.a += dt * 0.28;
  d.r += (d.parti ? 26 : (34 - d.r) * dt * 0.5);
  d.y += (d.parti ? dt * 5 : (26 - d.y) * dt * 0.4);
  if (!d.parti && d.t > 26) {
    d.parti = true;
    noter("Le dragon s'éloigne. Personne n'a rien tenté.");
    // le prêtre encaisse le crédit de son départ, qu'il y soit pour quelque chose ou non
    village.autorite = Math.min(1, village.autorite + 0.16);
    if (village.autorite > 0.55) noter("À l'église, on dit que les prières y sont pour quelque chose.");
  }
  if (d.parti && d.r > 200) { village.dragon = null; return; }
  if (d.parti) return;
  // Le dragon ne tue personne. Il fait peur — et c'est la peur qui
  // arrête le travail, vide le four, affame le village, et finit par
  // désigner un coupable. Tout le drame tient dans cette seule ligne.
  for (const h of habitants) {
    if (!h.vivant) continue;
    const effroi = dt * 0.5 * (1 - h.courage * 0.7) * (village.foire > 0 ? 1.5 : 1);
    h.peur = Math.min(1, h.peur + effroi);
    h.soupcon = Math.min(0.5, h.soupcon + effroi * h.superstition * 0.3);
    // on change d'avis quand la peur franchit un cran, pas au hasard
    const cran = Math.floor(h.peur * 4);
    if (cran > h.cranPeur) h.prochainChoix = 0;
    h.cranPeur = cran;
  }
  // il ne touche personne, mais il casse : une aile arrachée, une roue
  // fracassée. C'est sa seule violence, et elle suffit à affamer.
  // Il ne casse pas au hasard : il tourne, et la secousse s'accumule sous
  // lui jusqu'à ce que quelque chose lâche. Les deux moulins ne lâchent
  // pas ensemble parce qu'ils ne sont pas au même endroit de son cercle.
  for (const m of MOULINS) {
    m.secousse += dt * R.degatDragon * (1 + Math.sin(d.a * 2 + m.x * 0.3) * 0.5);
    if (m.secousse >= 1 && m.etat > 0.15) {
      m.secousse = 0;
      m.etat = Math.max(0.05, m.etat - m.fragilite);
      if (m.etat <= 0.12 && !m.reparationSignalee) {
        m.reparationSignalee = true;
        noter(`Sur son passage, ${m.nom} a perdu une aile.`, true);
      }
    }
  }
}

const regles = [];
const sansAccent = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const sansArticle = (t) => t.replace(/^(le |la |les |l'|un |une |des )/, '').trim();

const VERBES = {
  aime: 'aime', aimer: 'aime', aiment: 'aime',
  deteste: 'deteste', detester: 'deteste', detestent: 'deteste', hait: 'deteste',
  suit: 'suit', suivre: 'suit', suivent: 'suit',
  evite: 'evite', eviter: 'evite', evitent: 'evite', fuit: 'evite',
  craint: 'craint', craindre: 'craint', craignent: 'craint',
};

// un morceau de phrase peut désigner une personne, un métier, un lieu, ou tout le monde
function resoudre(mot) {
  const m = sansArticle(sansAccent(mot));
  if (!m) return [];
  if (m === 'tous' || m === 'toutes' || m === 'tout le monde' || m === 'village') {
    return habitants.filter(h => h.vivant);
  }
  const parPrenom = habitants.filter(h => h.vivant && sansAccent(h.prenom) === m);
  if (parPrenom.length) return parPrenom;
  const parRole = habitants.filter(h => h.vivant &&
    (sansAccent(h.role) === m || sansArticle(sansAccent(NOM_ROLE[h.role] || '')) === m));
  if (parRole.length) return parRole;
  return LIEUX.filter(l => sansArticle(sansAccent(l.nom)) === m);
}

function analyser(phrase) {
  const brut = phrase.replace(/>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!brut) return null;
  const norm = sansAccent(brut);
  let trouve = null;
  for (const v of Object.keys(VERBES).sort((a, b) => b.length - a.length)) {
    const i = norm.indexOf(' ' + v + ' ');
    if (i >= 0) { trouve = { v, i }; break; }
  }
  if (!trouve) return { erreur: 'verbe inconnu — aime, déteste, suit, évite, craint' };
  const gauche = brut.slice(0, trouve.i).trim();
  const droite = brut.slice(trouve.i + trouve.v.length + 2).trim();
  const sujets = resoudre(gauche), objets = resoudre(droite);
  if (!sujets.length) return { erreur: `qui, « ${gauche} » ?` };
  if (!objets.length) return { erreur: `qui ou quoi, « ${droite} » ?` };
  return { texte: brut, verbe: VERBES[trouve.v], sujets, objet: objets[0] };
}

function appliquerRegles() {
  for (const h of habitants) { h.courtise = null; h.deteste = null; h.suit = null; h.evite = null; h.craint = null; }
  for (const r of regles) {
    for (const h of r.sujets) {
      if (!h.vivant || h === r.objet) continue;
      const estPersonne = !!r.objet.role;
      if (r.verbe === 'aime' && estPersonne) { h.courtise = r.objet; h.prochainFlirt = 0; h.rembarrades = 0; h.aDitPas = false; }
      else if (r.verbe === 'deteste' && estPersonne) h.deteste = r.objet;
      else if (r.verbe === 'suit') h.suit = r.objet;
      else if (r.verbe === 'evite') h.evite = r.objet;
      else if (r.verbe === 'craint') h.craint = r.objet;
    }
  }
}


// ---------------------------------------------------------------- surface
// avancer(dt) : dt en SECONDES SIMULÉES. Le découpage en tranches est du
// ressort de l'appelant (la page le fait pour les vitesses ×10 et ×100,
// le simulateur pour aller vite).
return {
  GRAINE, R, alea, aleaDeco, entre, parmi,
  village, habitants, chronique, nouveaux, evenements, regles,
  LIEUX, MOULINS, CHAMPS, CHAUMIERES, ATELIERS,
  PLACE, EGLISE, MANOIR, FOUR, CABANE,
  RUISSEAU, ROUTE, BUTTE, POINT_PONT, LARGEUR_EAU, PROFONDEUR_EAU,
  hauteur, distRoute, distRuisseau, distPolyligne,
  avancer: simuler,
  poidsDes, choisirOccupation, lieuDe, tensionActuelle,
  nommer, nomComplet, souvenir, noter, lien, e, NOM_ROLE, ROLES,
  estNuit, estJour, lumiere,
  analyser, appliquerRegles, resoudre,
  lancerDragon, lancerFoire, surnommer,
};
}
