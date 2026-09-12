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
  // Balayage du 12 septembre, après que la porte des naissances s'est
  // rouverte : le village est passé de dix-sept âmes à vingt-quatre, il
  // moud donc bien plus, et l'ancienne usure le laissait sans farine un
  // jour sur trois. Ce n'est pas le champ le goulot, c'est la meule.
  usureMeule: 0.00028,      // ce que la meule perd en tournant (balayage)
  moissonAvecOutils: 0.62,  // balayage, après l'arrivée des saisons et des enfants
  moissonSansOutils: 0.45,
  volParSeconde: 0.35,
  // Trouvées au balayage elles aussi. Le dragon garde TOUTE sa force de
  // nuisance (0,09) : casser les moulins est sa seule violence et toute
  // la chaîne du drame en dépend. C'est l'usure qui ralentit et la
  // réparation qui s'améliore. Avant : moulins cassés 41 % du temps,
  // donc pas de farine, donc pas de pain. Après : 25 %.
  reparationParSeconde: 0.22,   // ce qu'un artisan remet dans une meule (balayage)
  reparationMaladroite: 0.34,   // ce qu'y remet quelqu'un qui n'a jamais appris
  // Sans dé, c'est la lassitude qui fait la variété : ce qu'on vient de
  // faire pèse moins lourd, ce qu'on délaisse remonte doucement.
  lassitude: 0.055,         // par seconde passée sur une occupation
  oubli: 0.02,              // par seconde, ce qu'une occupation délaissée regagne
  plafondLassitude: 2.2,
  // Les conduites rares ne sont plus tirées au sort : elles doivent
  // l'emporter franchement quand leur moment vient, ou ne jamais venir.
  poidsAccuser: 9,      // balayage : 26 était le réglage d'avant le soupçon ciblé
  seuilFoule: 3,        // balayage : à 4, un village amoindri ne fait plus jamais foule
  cycleLune: 8,         // jours d'un cycle lunaire complet
  joursParSaison: 8,    // quatre saisons, donc une année de 32 jours et 4 lunes
  ageAdulte: 14,        // on prend un métier à quatorze ans
  esperanceMax: 84,     // sans accident et sans misère, on va loin
  usureVie: 39,         // ce que la faim, la peur et la fatigue coûtent d'années
  // On ne peut pas engranger indéfiniment : c'est ce plafond qui fait que
  // l'abondance d'automne ne dure pas jusqu'au printemps.
  plafondBle: 45,      // balayage : à 70, l'automne nourrit tout l'hiver
  // LE BOUT DE LA CHAÎNE N'AVAIT PAS DE FREIN. Le four cuisait sans
  // plafond, donc la farine partait, donc les meules broyaient sans fin,
  // donc le blé restait à zéro en permanence — et la naissance, qui exige
  // vingt-deux mesures de blé, ne pouvait plus jamais se produire. Mesuré
  // sur deux mille journées : 6 639 pains en réserve et quatre survivants.
  // Un village meurt de faim au milieu de ses miches.
  plafondPain: 85,     // balayage : le four s'arrête au-delà, et le blé peut enfin s'accumuler
  plafondFarine: 30,   // la farine aussi : au-delà, les meules tournent à vide
  // Il ne doit sortir qu'une pleine lune sur trois : à chaque fois, il
  // cesse d'être un événement. Le seuil a dû monter quand la souvenance
  // a fait grimper les rancunes.
  seuilLoup: 1.45,     // mesuré : une pleine lune sur trois
  oubliSoupcon: 0.005,   // balayage : c'est LE levier des bûchers
  boisParSeconde: 0.30,   // ce qu'un bûcheron rapporte
  boisRepare: 0.25,       // ce qu'une réparation consomme
  boisChauffe: 0.9,       // par jour d'hiver, pour tout le village
  ratsCroissance: 0.010,  // ils prospèrent sur ce qu'on entasse
  ratsMangent: 0.055,     // ce qu'un rat prend par seconde
  ratsChasses: 0.020,     // ce qu'un chat en retire
  gelSeuil: 0.85,       // au-delà, le ruisseau prend et la roue s'arrête
  poidsRevolte: 3,
  poidsVol: 4,
  poidsPriere: 1,
  degatDragon: 0.078,   // balayage : au-dessous, les moulins ne cassent plus assez            // sa chance d'arracher une aile, par seconde de survol
  // LE TROISIÈME ACTE. Un métier ne se reprend que s'il reste quelqu'un
  // pour l'avoir appris. C'est ce nombre-là qui décide si un village
  // peut perdre son boulanger pour de bon.
  apprentissage: 4,     // journées passées près d'un maître pour savoir son métier
  ruineApres: 6,        // journées avant qu'une maison vide commence à tomber
  // LA MÉMOIRE. Ce qu'on doit à quelqu'un divise ce qu'on lui soupçonne.
  poidsDette: 5,
  detteQuiSauve: 0.55,  // au-delà, on parle devant la foule
  // Un étranger sur cinquante sait un métier que le village a perdu.
  // À ce taux-là c'est une légende et non une réparation : mesuré, zéro
  // fois en 96 années de village. Le chemin est vérifié à part.
  etrangerSavant: 0.02,
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
// LA PORTE. On entrait dans les maisons par les murs. Chaque bâtiment
// reçoit un point d'entrée sur sa façade — celle qui regarde le centre du
// village, parce qu'un village se tourne vers sa place — et c'est ce
// point qu'on vise, pas le milieu du bâtiment. Le détour se voit : les
// gens contournent la maison avant d'entrer.
const PROFONDEUR = { chaumiere: 5.6, boulangerie: 6.6, atelier: 5.2, eglise: 13,
                     manoir: 7.5, cabane: 3.6, grange: 7.4, auberge: 5.4 };

function poserPorte(l) {
  const p = PROFONDEUR[l.type];
  if (!p) return l;                       // un champ, une forêt : on y entre par où l'on veut
  const c = Math.cos(l.angle || 0), sn = Math.sin(l.angle || 0);
  const d = p / 2 + 0.9;
  const cotes = [[0, d], [0, -d]].map(([x, z]) =>
    ({ x: x * c + z * sn + l.x, z: -x * sn + z * c + l.z }));
  const versLaPlace = (q) => q.x * q.x + q.z * q.z;
  l.porte = versLaPlace(cotes[0]) <= versLaPlace(cotes[1]) ? cotes[0] : cotes[1];
  l.porte.y = hauteur(l.porte.x, l.porte.z);
  // le côté, dans le repère du bâtiment : le rendu en a besoin pour
  // dessiner la porte au bon endroit
  l.porteSud = l.porte === cotes[0];
  return l;
}

function lieu(nom, type, x, z, angle = 0, forme = null, args = []) {
  const y = hauteur(x, z);
  const l = { nom, type, x, z, y, angle, forme, args };
  LIEUX.push(l);
  return poserPorte(l);
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
// le pont devient un lieu à part entière : c'est là qu'on se noie, et
// c'est donc là qu'il y a une histoire à lire
if (POINT_PONT) LIEUX.push({ nom: 'le pont', type: 'pont',
  x: POINT_PONT.x, z: POINT_PONT.z, y: hauteur(POINT_PONT.x, POINT_PONT.z) });
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
// La forêt : pas un bâtiment, un bord de carte où l'on va chercher le
// bois. On voit le bûcheron partir et revenir.
const pForet = chercherPlace(-34, -30, 10, 9);
const FORET = lieu('la forêt', 'foret', pForet.x, pForet.z, 0, 'foret');
// La grange : la réserve du village, visible de loin. On y lit d'un coup
// d'œil si l'hiver se passera bien — et c'est là que vont les rats.
// L'AUBERGE. Elle héberge ceux dont on ne sait rien : les vagabonds de
// passage et les chasseurs de monstres. C'est le seul toit du village
// qui ne soit à personne.
const pAuberge = chercherPlace(-13, 8, 14, 9);
const AUBERGE = lieu("l'auberge", 'auberge', pAuberge.x, pAuberge.z, entre(-0.4, 0.4), 'auberge');
const pGrange = chercherPlace(9, -13, 12, 9);
const GRANGE = lieu('la grange', 'grange', pGrange.x, pGrange.z, entre(-0.5, 0.5), 'grange');

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
  ['voleur', 1], ['sorciere', 1], ['bucheron', 1], ['aubergiste', 1], ['paysan', 5],
];
// ce qu'un enfant devenu grand peut reprendre : ni seigneur, ni dame, ni
// sorcière — ces trois-là ne se transmettent pas comme un métier
const ROLES_UTILES = ['paysan', 'paysan', 'paysan', 'boulanger', 'charpentier',
                      'forgeron', 'tailleur', 'ebeniste', 'pretre', 'bucheron'];
const NOM_ROLE = {
  seigneur: 'le seigneur', dame: 'la dame', pretre: 'le prêtre', boulanger: 'le boulanger',
  charpentier: 'le charpentier', tailleur: 'le tailleur de pierre', ebeniste: "l'ébéniste",
  forgeron: 'le forgeron', voleur: 'le voleur', sorciere: 'la sorcière',
  paysan: 'le paysan', colporteur: 'le colporteur', enfant: "l'enfant",
  bucheron: 'le bûcheron', etranger: "l'étranger", chasseur: 'le chasseur de monstres',
  aubergiste: "l'aubergiste",
};

const PRENOMS_H = ['Guillaume','Thibaut','Jehan','Renaud','Gautier','Colin','Foulques','Enguerrand',
                   'Aymeric','Bertrand','Girart','Milon'];
const PRENOMS_F = ['Aliénor','Perrine','Mahaut','Blanche','Aude','Isabeau','Ermengarde','Sibylle',
                   'Emmeline','Guibourc'];
const FEMININ = { dame: 1, sorciere: 1 };

// LES LIGNÉES. Un prénom se réemploie, un nom de maison non : quand le
// dernier qui le portait meurt, il ne revient jamais. C'est la première
// chose de ce village qui soit vraiment sans retour. Le prêtre et la
// guérisseuse n'en ont pas — ils n'ont personne après eux, et c'est déjà
// une façon de le dire.
const LIGNEES = ['Beaufort', 'Roquemaure', 'Aiguebelle', 'Fontcaude', 'Bellegarde',
                 'Malaunay', 'Vaugrenier', 'Quintefeuille', 'Hautfaye', 'Craonne'];
const SANS_LIGNEE = { pretre: 1, sorciere: 1, colporteur: 1, etranger: 1, chasseur: 1 };
let iH = 0, iF = 0;
function prenomPour(role) {
  const f = !!(FEMININ[role] || ((role === 'paysan' || role === 'enfant') && alea() < 0.45));
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
// « de Beaufort », mais « d'Aiguebelle » : la particule s'élide.
const deLignee = (nom) => (/^[AEIOUYÉÈÊ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

// L'ORDRE DES NOMS. Le surnom gagné l'emporte toujours — c'est celui
// qui vient de l'histoire et non de l'état civil. Vient ensuite le nom
// de maison, porté du berceau à la tombe : on l'a lu cent fois avant le
// jour où la chronique écrit qu'il n'y a plus personne pour le porter,
// et c'est de là que vient le coup. Le métier ne sert plus qu'à ceux
// qui n'ont pas de maison — le prêtre, la guérisseuse, ceux qui passent.
function nomComplet(h) {
  if (h.surnom) return `${h.prenom} dit${h.feminin ? 'e' : ''} ${h.surnom}`;
  if (h.lignee) return `${h.prenom} ${deLignee(h.lignee)}`;
  if (!homonymes(h)) return h.prenom;
  if (!h.attache) h.attache = attacheDe(h);
  return `${h.prenom} ${metierDe(h)}`.trim();
}
// le métier s'accorde : « Aliénor, la colportrice » et non « le colporteur »
// LE MÉTIER SE MET AU FÉMININ. On écrivait « la paysan », « la
// boulanger ». Un métier n'a pas qu'un article : il a une forme. Celles
// qui ne changent pas (ébéniste, aubergiste) n'apparaissent pas ici.
const NOM_ROLE_F = {
  paysan: 'paysanne', boulanger: 'boulangère', charpentier: 'charpentière',
  forgeron: 'forgeronne', bucheron: 'bûcheronne', tailleur: 'tailleuse de pierre',
  voleur: 'voleuse', colporteur: 'colportrice', etranger: 'étrangère',
  chasseur: 'chasseuse de monstres', pretre: 'prêtresse', seigneur: 'dame',
};
// et deux métiers écrits au féminin dans la table, qu'il faut savoir
// remettre au masculin le jour où un homme les tient
const NOM_ROLE_M = { sorciere: 'sorcier', dame: 'seigneur' };
const metierDe = (h) => {
  const nu = h.feminin
           ? (NOM_ROLE_F[h.role] || (NOM_ROLE[h.role] || '').replace(/^(le |la |l')/, ''))
           : (NOM_ROLE_M[h.role] || (NOM_ROLE[h.role] || '').replace(/^(le |la |l')/, ''));
  if (/^[aeiouyéèê]/i.test(nu)) return "l'" + nu;       // l'étranger, l'ébéniste, l'aubergiste
  return (h.feminin ? 'la ' : 'le ') + nu;
};
const nommer = (h) => h.surnom ? `${h.prenom} dit${h.feminin ? 'e' : ''} ${h.surnom}`
                    : h.lignee ? `${h.prenom} ${deLignee(h.lignee)}`
                               : `${h.prenom}, ${metierDe(h)}`;
// Les vingt et une occupations possibles. Chacun en a une lecture
// légèrement différente, fixée à sa naissance : c'est ce qui remplace le
// dé. Deux paysans dans la même situation ne feront pas le même choix,
// non parce qu'un tirage les sépare, mais parce qu'ils ne sont pas les
// mêmes hommes.
const OCCUPATIONS = ['dormir', 'manger', 'prier', 'flâner', 'fuir', 'accuser',
  'se révolter', 'courtiser', 'suivre', 'voler', 'moissonner', 'cuire',
  'réparer', 'menuiser', 'forger', 'tailler', 'colporter', 'officier',
  'herboriser', 'inspecter', 'visiter', 'veiller', 'jouer', 'bûcheronner',
  'servir', 'guetter'];

let rangSuivant = 0;
function creerHabitant(role, logis) {
  const penchant = {};
  for (const o of OCCUPATIONS) penchant[o] = 0.72 + alea() * 0.56;
  return {
    role, logis, ...prenomPour(role),
    rang: rangSuivant++, penchant,
    // L'ÂGE. Une année de village vaut une année de vie : à ×100, on
    // regarde une vie entière en une demi-heure. C'est ce qui rend
    // tenable l'idée de suivre quelqu'un du berceau à la tombe.
    age: entre(19, 44), mere: null,
    // L'usure n'est pas la fatigue : c'est la moyenne lente de ce que la
    // vie a coûté. Elle seule décide de qui s'éteint à quarante ans et de
    // qui en voit quatre-vingts.
    usure: entre(0.05, 0.3),
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
    // Quatre de plus, et aucun ne porte de nom de trouble : un village de
    // 1300 n'a pas ces mots, il dit « le taciturne ». Nommer, ce serait
    // transformer une personne en mécanisme.
    regularite: entre(0, 1),      // le besoin que les jours se ressemblent
    absorption: entre(0, 1),      // la capacité à ne faire qu'une chose, longtemps
    seuil: entre(0, 1),           // ce que coûtent la foule et le bruit — bas, on fuit
    // « souvenance » et non « mémoire » : h.memoire est déjà la liste de
    // ce qu'il a vécu. La collision a donné des NaN partout et le contrôle
    // l'a vue au premier passage.
    souvenance: entre(0, 1),      // certains n'oublient ni les dettes ni les bontés
    // besoins : ils montent seuls, ce sont eux le moteur
    faim: entre(0, 0.4), fatigue: entre(0, 0.3), foi: entre(0, 0.5), peur: 0,
    soupcon: entre(0, 0.15), rancune: 0, chagrin: 0,
    // Deux choses différentes, et c'est tout l'intérêt de les séparer :
    // le REMORDS est ce qu'on se reproche, il monte qu'on soit vu ou non ;
    // la HONTE est ce que les autres ont vu, elle ne monte qu'avec un
    // témoin. Le brouillard ne change rien au premier et tout au second.
    remords: 0, honte: 0,
    secret: null, secretForce: 0,   // celle dont il n'a jamais rien dit
    courtise: null, deteste: null, suit: null, evite: null, craint: null,  // posé par les règles écrites
    prochainFlirt: 0, rembarrades: 0, aDitPas: false,
    surnom: null, surnomIdx: null, attache: null,
    jourMetier: 0,          // depuis quand il tient ce métier — voir reprendreUnMetier()
    lignee: null,           // le nom de maison, hérité de la mère — voir majLignees()
    // CE QU'IL SAIT FAIRE. Un rôle est ce qu'on fait aujourd'hui ; le
    // savoir est ce qu'on pourrait encore transmettre demain. Les deux se
    // séparent le jour où le dernier qui savait meurt.
    savoir: new Set(), appris: {},
    // CE QU'ON DOIT. Pas de l'affection : une dette. On n'accuse pas
    // celle qui a soigné votre mère, et si la foule vient quand même,
    // c'est celui qui lui doit le plus qui parle.
    dette: new Map(),
    torche: 0, rallume: 0,        // voir majTorche()
    egare: false, fou: 0,         // la pleine lune fait perdre le nord          // voir surnommer() et nomComplet()
    compte: { reparations: 0, vols: 0, prieres: 0, rembarrades: 0, accusations: 0,
              moissons: 0, foires: 0, deuils: 0 },
    memoire: [],            // ce qu'il a fait, et ce qu'on lui a fait
    liens: new Map(),       // affinité avec chaque autre, 0 à 1
    // LE SOUPÇON A UN DESTINATAIRE. Avant, chacun avait « du soupçon »
    // sans soupçonner personne, et le village accusait mécaniquement le
    // moins sociable. Maintenant chacun tient sa propre liste, et deux
    // habitants peuvent ne pas soupçonner le même. C'est ce qui permet
    // qu'un chasseur de monstres se trompe.
    soupconne: new Map(),
    pire: { qui: null, valeur: 0 },   // le plus soupçonné, recalculé une fois par pas
    aime: null,
    occupation: 'flâner', prochainChoix: 0, vivant: true,
  };
}
{
  let i = 0, iLignee = 0;
  for (const [role, n] of ROLES) {
    for (let k = 0; k < n; k++) {
      const logis = role === 'sorciere' ? CABANE
                  : (role === 'seigneur' || role === 'dame') ? MANOIR
                  : role === 'pretre' ? EGLISE
                  : role === 'boulanger' ? FOUR
                  : CHAUMIERES[i++ % CHAUMIERES.length];
      const h = creerHabitant(role, logis);
      if (ROLES_UTILES.includes(role)) h.savoir.add(role);
      // ET CELUI DE SON PÈRE. Un village de dix-sept âmes ne tient pas sur
      // un unique porteur par métier : mesuré, le charpentier se perdait
      // au trentième jour, plus personne ne remontait les meules, et le
      // village mourait de faim en six mois. Chaque fondateur sait donc
      // aussi le métier d'à côté — ce qui rend la perte d'un métier rare
      // et grave, au lieu d'un tirage fatal le premier mois.
      h.savoir.add(ROLES_UTILES[(i + k) % ROLES_UTILES.length]);
      if (!SANS_LIGNEE[role]) {
        if (!logis.lignee) logis.lignee = LIGNEES[iLignee++ % LIGNEES.length];
        h.lignee = logis.lignee;
      }
      habitants.push(h);
    }
  }
}

/* ================================================================
   5. L'ÉTAT DU VILLAGE
   ================================================================ */
const village = {
  jour: 1, heure: 0.28,          // 0 = minuit, 0.5 = midi
  annee: 1, saison: 0,           // 0 printemps, 1 été, 2 automne, 3 hiver
  froid: 0, gel: false,          // le grand froid ne vient qu'en hiver
  ble: 12, farine: 5, pain: 8, outils: 6, meubles: 0, chantier: 0,
  bois: 10,                      // ce que le bûcheron a rapporté
  rats: 0.5,                     // ils vivent de ce qu'on entasse
  betes: [],                     // chats, chiens, chevaux, rats — voir majBetes()
  aboiement: 0,                  // les chiens ont-ils senti quelque chose cette nuit
  volsCetteNuit: 0,
  fourChauffe: false,        // le four est-il allumé ? (la cheminée fume)
  vent: 0,                   // 0 à 1, il monte et retombe tout seul
  brouillard: 0,             // il se forme à l'aube, et le vent le chasse
  lune: 0,                   // 0 nouvelle lune, 1 pleine lune
  sabbat: false,             // les nuits de pleine lune, on veille à la cabane
  loupAgi: false,            // il n'abîme le village qu'une fois par nuit
  noyadeCetteNuit: false,    // le ruisseau non plus ne prend qu'une fois
  chasseur: null, joursChasseur: 0,   // celui qu'on loge à l'auberge
  jourVampire: -99,          // la dernière fois qu'on a parlé du seigneur
  loup: null,                // celui que la pleine lune a fait sortir de lui-même
  // Le décompte de ce qui est arrivé DEPUIS LE PREMIER JOUR. La chronique
  // ne garde que ses deux cents dernières lignes — parfait pour lire par
  // -dessus l'épaule du village, inutilisable pour mesurer. Un balayage
  // sur 120 jours comptait 1 surnom là où il y en avait eu 5 : les
  // premiers étaient tombés hors du journal. On compte à la source.
  arrive: { buchers: 0, departs: 0, revoltes: 0, dragons: 0, foires: 0,
            successions: 0, surnoms: 0, noyades: 0, colporteurs: 0,
            sabbats: 0, loups: 0, betes: 0, meurtres: 0, egares: 0, fous: 0,
            naissances: 0, vieillesses: 0, majorites: 0,
            etrangers: 0, chasseurs: 0, imposteurs: 0, vampire: 0,
            extinctions: 0, metiersPerdus: 0, ruines: 0,
            sauvetages: 0, paroles: 0, etablis: 0, reprises: 0 },
  // LE TROISIÈME ACTE. Tout le reste de ce village revient : la faim
  // passe, la peur retombe, le moulin se répare, un enfant reprend le
  // métier. Voici la liste de ce qui ne reviendra pas. Elle ne fait que
  // s'allonger, et c'est ce qui distingue un village d'une boucle.
  pertes: [],
  lignees: new Map(),        // nom de maison → { nom, logis, eteinte, jour }
  perdus: new Set(),         // les métiers dont plus personne ne sait rien
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
  // LA FIN. Elle n'est pas scriptée : elle arrive le jour où il ne reste
  // personne. Le village peut tenir des années ou s'éteindre en une
  // génération, et on ne le sait qu'en regardant.
  eteint: 0,                 // le jour où le dernier s'en est allé, 0 tant qu'il vit
};
// on enregistre les maisons fondatrices : ce sont elles qui peuvent
// s'éteindre, et la maison qui va avec
for (const h of habitants) {
  if (!h.lignee || village.lignees.has(h.lignee)) continue;
  village.lignees.set(h.lignee, { nom: h.lignee, logis: h.logis, eteinte: false, jour: 0 });
}
// LA MÉMOIRE DU VILLAGE. La chronique n'était qu'un fil qui défilait :
// deux cents lignes, puis l'oubli. Or c'est la mémoire qui doit décider —
// on n'accuse pas celle qui a soigné votre mère. Alors chaque ligne porte
// maintenant son jour et son GENRE, on la garde longtemps, et on peut la
// relire par le bout qu'on veut.
const GENRES = ['mort', 'naissance', 'bienfait', 'peur', 'perte', 'legende', 'village'];
const chronique = [];
// OÙ ÇA S'EST PASSÉ. Une chronique qui défile se perd ; une chronique
// attachée aux lieux se relit. On clique sur le moulin et on lit tout ce
// qui est arrivé au moulin. Le lieu se déduit de la position de la
// personne concernée quand on ne le donne pas — aucun tirage, donc aucun
// effet sur l'histoire.
function lieuProche(x, z, portee = 11) {
  let best = null, bd = portee;
  for (const l of LIEUX) {
    const d = Math.hypot(l.x - x, l.z - z);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}

function noter(txt, fort = false, qui = null, genre = 'village', ou = null) {
  if (!ou && qui && qui.x !== undefined) ou = lieuProche(qui.x, qui.z);
  // On stockait « jour 412 — ... » ET le texte nu : deux fois la même
  // phrase en mémoire, pour une chronique qu'on garde désormais entière.
  chronique.push({ nu: txt, jour: village.jour, fort, qui, genre, ou });
  // On ne jette plus rien. Pierre veut pouvoir emporter TOUTE l'histoire
  // de son village le jour où il s'éteint ; une chronique tronquée n'est
  // pas une histoire, c'est un extrait. Mesuré : cent journées de village
  // pèsent environ trois cents lignes, soit trente kilo-octets — une
  // session de huit heures à ×100 en fait deux mille, c'est tenable.
  if (chronique.length > 200000) chronique.shift();
}

// Un habitant qui accumule un passé devient quelqu'un. Sans ça, il n'y a
// que des bâtonnets qui bougent.
function souvenir(h, txt) {
  h.memoire.push(`jour ${village.jour} — ${txt}`);
  if (h.memoire.length > 14) h.memoire.shift();
}
const lien = (a, b) => a.liens.get(b) || 0;

/* ---- CE QU'ON DOIT ---- */
// Une dette n'est pas de l'affection : on peut devoir beaucoup à
// quelqu'un qu'on n'aime pas, et c'est justement ce cas-là qui est
// intéressant. Elle se transmet un peu aux proches — celui dont on a
// soigné la mère doit lui aussi, sans l'avoir demandé.
const detteDe = (qui, envers) => (qui.dette.get(envers) || 0);

function devoir(qui, envers, montant, raison = null) {
  if (!qui || !envers || qui === envers) return;
  if (!qui.vivant || !envers.vivant) return;
  const avant = detteDe(qui, envers);
  const apres = Math.min(1, avant + montant);
  qui.dette.set(envers, apres);
  // on ne note que le moment où ça devient une dette dont on parle
  if (raison && avant < 0.5 && apres >= 0.5) {
    noter(`${nommer(envers)} ${raison} ${qui.prenom}.`, false, envers, 'bienfait');
    souvenir(qui, `doit quelque chose à ${envers.prenom}`);
    // les siens l'apprennent, et le doivent à moitié
    for (const b of habitants) {
      if (!b.vivant || b === qui || b === envers) continue;
      if (b.mere !== qui && qui.mere !== b && b.aime !== qui) continue;
      b.dette.set(envers, Math.min(1, detteDe(b, envers) + apres * 0.5));
    }
  }
}
// à qui doit-on le plus, parmi les vivants
function creancier(h) {
  let qui = null, v = 0;
  for (const [a, d] of h.dette) if (a.vivant && d > v) { v = d; qui = a; }
  return { qui, valeur: v };
}
/* ---- LE SOUPÇON, ET SUR QUI ---- */
// combien « qui » soupçonne « cible »
const soupconDe = (qui, cible) => qui.soupconne.get(cible) || 0;

function soupconner(qui, cible, montant) {
  if (!qui || !cible || qui === cible || !qui.vivant || !cible.vivant) return;
  // on ne soupçonne pas volontiers celui qu'on aime, ni celui qu'on tait
  // Ce qu'on lui doit compte AUTANT que ce qu'on ressent pour lui. C'est
  // le point où la mémoire du village entre dans ses décisions.
  const proche = Math.max(lien(qui, cible), qui.secret === cible ? qui.secretForce : 0,
                          detteDe(qui, cible) * (R.poidsDette / 6));
  const v = Math.min(1, soupconDe(qui, cible) + montant * (1 - proche * 0.85));
  qui.soupconne.set(cible, v);
  // soupçonner quelqu'un, c'est aussi être inquiet en général
  qui.soupcon = Math.min(1, Math.max(qui.soupcon, v * 0.9));
}

// celui que « qui » soupçonne le plus, et de combien
function plusSoupconne(qui) {
  let pire = null, score = 0;
  for (const [c, v] of qui.soupconne) if (c.vivant && v > score) { score = v; pire = c; }
  return { qui: pire, valeur: score };
}

// celui que TOUT le village soupçonne le plus — la somme des soupçons,
// pas une règle qui désignerait le plus faible
function soupconneDuVillage(exclus = () => false) {
  const total = new Map();
  for (const h of habitants) {
    if (!h.vivant) continue;
    for (const [c, v] of h.soupconne) {
      if (!c.vivant || exclus(c)) continue;
      total.set(c, (total.get(c) || 0) + v);
    }
  }
  let pire = null, score = 0;
  for (const [c, v] of total) if (v > score) { score = v; pire = c; }
  return { qui: pire, valeur: score };
}

// LE MALHEUR CHERCHE UN VISAGE. Quand quelque chose de mauvais arrive,
// ceux qui sont là soupçonnent celui qui était le plus près — et si
// personne n'était près, celui qu'on voit le moins.
function malheur(x, z, force, sauf = null) {
  let proche = null, d2 = 26 * 26;
  for (const h of habitants) {
    if (!h.vivant || h === sauf) continue;
    const d = (h.x - x) ** 2 + (h.z - z) ** 2;
    if (d < d2) { d2 = d; proche = h; }
  }
  if (!proche) {
    // personne sur les lieux : le village se rabat sur celui qui n'y est
    // jamais. C'est la même injustice qu'avant, mais elle a une raison.
    proche = habitants.filter(h => h.vivant && h.role !== 'pretre' && h.role !== 'seigneur')
      .sort((a, b) => (a.sociabilite + a.seuil) - (b.sociabilite + b.seuil))[0];
  }
  if (!proche) return;
  for (const h of habitants) {
    if (!h.vivant || h === proche) continue;
    soupconner(h, proche, force * (0.4 + h.superstition));
  }
}

function rapprocher(a, b, k) {
  a.liens.set(b, Math.min(1, lien(a, b) + k));
  b.liens.set(a, Math.min(1, lien(b, a) + k));
}

const estNuit = () => village.heure < 0.22 || village.heure > 0.86;
// l'aube : la fin de la nuit, quand le brouillard se forme
const estAube = () => village.heure > 0.16 && village.heure < 0.34;
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
  // le remords pousse à l'église : c'est la seule chose qui l'efface vite
  p.push(['prier', (h.foi * h.piete * 1.6 + h.peur * h.piete * 4 + h.remords * 3) * R.poidsPriere * (nuit ? 0.3 : 1),
          `piété ${n2(h.piete)} × (foi ${n2(h.foi)} + peur ${n2(h.peur)})` +
          (h.remords > 0.2 ? ` · remords ${n2(h.remords)}` : '')]);
  // on ne traîne pas sur la place quand on rase les murs
  p.push(['flâner', h.sociabilite * 0.5 * (jour ? 1 : 0.2) * (village.foire > 0 ? 4 : 1) * (1 - h.honte * 0.8),
          `sociabilité ${n2(h.sociabilite)}${village.foire > 0 ? ' · jour de foire' : ''}` +
          (h.honte > 0.25 ? ` · mais il rase les murs` : '')]);
  p.push(['fuir', (h.peur * h.peur * (1 - h.courage) * 7) + h.honte * h.honte * 2.5,
          `peur ${n2(h.peur)} × peu de courage` + (h.honte > 0.25 ? ` · honte ${n2(h.honte)}` : '')]);
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
  // on ne veille à la cabane que les nuits de pleine lune, et seulement
  // si l'on croit plus aux choses qu'à l'église
  if (village.sabbat) {
    p.push(['veiller', (h.superstition * 2.4 + (1 - h.piete) * 1.2) * (h.role === 'sorciere' ? 3 : 1),
            `la lune est pleine · superstition ${n2(h.superstition)}`]);
  }
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
  // UN ENFANT. Il suit sa mère, il joue avec les autres enfants, et dès
  // qu'il tient debout il aide aux champs — à moitié de la vitesse d'un
  // adulte. Les trois à la fois, comme demandé.
  if (h.role === 'enfant') {
    const petits = habitants.filter(a => a.vivant && a.role === 'enfant' && a !== h).length;
    p.push(['jouer', 1.4 + petits * 0.5, `il a ${Math.floor(h.age)} ans` + (petits ? ` · ${petits} autres enfants` : '')]);
    if (h.mere && h.mere.vivant) p.push(['suivre', 2.2 * (1 - h.age / R.ageAdulte), `il suit sa mère`]);
    if (jour && h.age > 6) p.push(['moissonner', 0.9 * (h.age / R.ageAdulte), `il aide aux champs`]);
  }

  if (jour && h.role !== 'enfant') {
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
    // LE PIÈGE SANS SORTIE, TROUVÉ EN MESURANT DEUX MILLE JOURNÉES.
    // Les meules cassent, personne ne les remonte, donc plus de farine,
    // donc plus de pain, donc tout le monde a faim — et « travail » vaut
    // (1 - fatigue) × (1 - peur), qui s'effondre justement quand on a
    // faim. Le village se retrouvait avec mille sept cents mesures de blé
    // et un pain, incapable d'en sortir.
    //
    // La faim ne doit donc pas éteindre cette conduite-là : elle doit
    // l'allumer. Une meule morte dans un village affamé est la chose la
    // plus urgente du monde, et on y monte même épuisé.
    if (casse < 0.3 && h.role !== 'enfant') {
      const grenierPlein = village.ble > 20 && village.farine < 4;
      const urgence = (village.pain < 4 ? 3.5 : 1) * (grenierPlein ? 2.5 : 1);
      const sait = h.savoir.has('charpentier') || h.role === 'charpentier' || h.role === 'forgeron';
      // on n'y va pas parce qu'on est frais, on y va parce qu'il le faut
      if (!sait) p.push(['réparer', (0.5 + h.faim) * (1 - casse) * 1.4 * urgence,
                         'le moulin est mort et plus personne ne sait']);
      else if (h.role !== 'charpentier' && h.role !== 'forgeron')
        p.push(['réparer', (0.5 + h.faim) * (1 - casse) * 2.6 * urgence,
                'il a vu faire, autrefois']);
    }
    if (h.role === 'ebeniste')    p.push(['menuiser', travail * 1.2, pourquoiTravail]);
    if (h.role === 'tailleur')    p.push(['tailler', travail * 1.2, pourquoiTravail]);
    if (h.role === 'bucheron')    p.push(['bûcheronner', travail * (village.bois < 40 ? 1.6 : 0.2),
                                          pourquoiTravail + (village.bois < 6 ? ' · il ne reste presque plus de bois' : '')]);
    if (h.role === 'colporteur')  p.push(['colporter', travail * 2, 'il déballe son ballot']);
    if (h.role === 'aubergiste')  p.push(['servir', travail * 1.6, 'il tient l\'auberge']);
    if (h.role === 'etranger')    p.push(['flâner', travail * 1.4, 'il regarde le village']);
    if (h.role === 'chasseur')    p.push(['guetter', travail * 2.2, 'il guette ce qui rôde']);
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

  // LE SEUIL. La foule et le bruit coûtent, et pas également à tout le
  // monde. Un seuil bas ne rend personne meilleur ni pire : il rend la
  // place difficile un jour de foire, et il tient à l'écart des bûchers —
  // ce que le village finit par remarquer.
  const bruyant = (village.foire > 0 ? 1 : 0) + (village.foule ? 1 : 0);
  if (bruyant) {
    const cout = 1 - (1 - h.seuil) * 0.75 * bruyant / 2;
    for (const q of p) if (q[0] === 'flâner' || q[0] === 'accuser' || q[0] === 'se révolter') q[1] *= cout;
    for (const q of p) if (q[0] === 'fuir' || q[0] === 'dormir') q[1] *= 1 + (1 - h.seuil) * 0.5 * bruyant / 2;
  }

  // LA RÉGULARITÉ. On ne change pas d'occupation de gaieté de cœur.
  for (const q of p) if (q[0] === h.occupation) q[1] *= 1 + h.regularite * 0.9;
  return p;
}

// On se lasse de ce qu'on vient de faire. C'est ce qui remplace le dé :
// sans elle, un homme moissonnerait du lever au coucher sans jamais
// passer à l'église, parce que le travail pèserait toujours plus lourd
// que la prière. Avec elle, il travaille, il s'en lasse, et le reste
// remonte à la surface.
// LA TORCHE. Tout le monde n'en porte pas, et celle qu'on porte
// s'éteint. Trois façons : le vent, la pluie, et soi-même — on ne
// s'éclaire pas quand on préfère ne pas être vu.
//
// L'abri et le fait d'en porter une se déduisent du rang, jamais d'un
// tirage : ajouter un tirage à la naissance décalerait tout le flux de
// fabrication et changerait le village entier.
// Combien de vivants pourraient le voir d'ici. Le brouillard aveugle le
// village : c'est le seul endroit du code où l'on demande qui regarde.
function temoins(h, portee = 13) {
  if (village.brouillard > 0.55) return 0;      // on ne voit plus à dix pas
  // De nuit on ne voit qu'à bout portant — sauf sous la pleine lune, où
  // le village voit presque comme en plein jour. D'où la conséquence que
  // Pierre voulait : on ne vole pas impunément un soir de pleine lune.
  const p = estNuit() ? portee * (0.4 + village.lune * 0.6) : portee;
  let n = 0;
  for (const a of habitants) {
    if (!a.vivant || a === h) continue;
    if (Math.hypot(a.x - h.x, a.z - h.z) < p) n++;
  }
  return n;
}

// Ce qu'on se reproche, et ce qu'on a laissé voir. Le remords se confesse,
// la honte se cache — d'où deux décroissances différentes.
function fauter(h, poids, vu = null) {
  h.remords = Math.min(1, h.remords + poids * (0.3 + h.piete * 1.4));
  const n = vu === null ? temoins(h) : vu;
  if (n > 0) h.honte = Math.min(1, h.honte + poids * (0.5 + Math.min(n, 4) * 0.5));
}

function majTorche(h) {
  const loin = h.logis && Math.hypot(h.x - h.logis.x, h.z - h.logis.z) > 9;
  const discret = h.occupation === 'voler' || h.occupation === 'fuir' || h.occupation === 'accuser';
  const porteur = h.rang % 3 === 0;      // tout le monde n'en porte pas
  if (!h.vivant || !estNuit() || !loin || discret || !porteur) { h.torche = 0; return; }

  // Personne ne l'abrite parfaitement : au vent fort, toutes finissent
  // par s'éteindre, simplement pas au même moment.
  const abri = 0.15 + (h.rang % 5) * 0.10;
  const souffle = village.vent * (1.15 - abri * 0.8) + village.pluie * 0.9 + village.brouillard * 0.5;
  if (h.torche > 0) {
    if (souffle > 0.55) { h.torche = 0; h.rallume = village.temps + 10 + (h.rang % 4) * 5; }
  } else if (village.temps >= h.rallume && souffle < 0.44) {
    h.torche = 1;
  }
}

// SE PERDRE DANS LE BROUILLARD. Le ruisseau ne se voit plus, et qui le
// traverse sans lumière peut y tomber. Le pont reste sûr, une torche
// allumée aussi — c'est la première fois dans ce village qu'en porter
// une sauve la vie, et ça vaut mieux que de le dire dans un texte.
// LA PLEINE LUNE. Trois choses arrivent, et aucune n'est annoncée : le
// village les découvre comme nous, par ce qu'il voit.
function majPleineLune(dt) {
  const pleine = estNuit() && village.lune > 0.80;

  if (!pleine) {
    if (village.loup) {
      const l = village.loup;
      village.loup = null;
      village.loupAgi = false;
      village.noyadeCetteNuit = false;
      l.remords = Math.min(1, l.remords + 0.55);
      souvenir(l, "s'est réveillé sans savoir où il avait passé la nuit");
    }
    if (village.sabbat) village.sabbat = false;
    return;
  }

  // CE QU'ON TROUVE AU MATIN. Il ne tue pas d'homme, ou presque jamais :
  // il égorge une bête, il défonce une porte, il vide la huche. Le village
  // compte ses pertes et cherche un coupable — c'est tout ce qu'il faut.
  if (village.loup && !village.loupAgi && village.lune > 0.93) {
    village.loupAgi = true;
    village.arrive.betes++;
    village.pain = Math.max(0, village.pain - 3);
    const m = MOULINS[village.jour % MOULINS.length];
    m.etat = Math.max(0.1, m.etat - 0.2);
    noter('Au matin, une bête égorgée, une porte défoncée, la huche vide.', true);
    malheur(village.loup.x, village.loup.z, 0.30);

    // LE PRINCIPE DE JACK L'ÉVENTREUR. Très rarement, quelqu'un meurt —
    // et ce n'est pas toujours le loup. Un homme que la rancune ronge se
    // sert de la nuit et laisse la légende porter le poids. Le village
    // n'a aucun moyen de faire la différence, et la chronique non plus :
    // seule la fiche du coupable garde la trace.
    if (aleaEvenements() < 0.08) {
      const vivants = habitants.filter(h => h.vivant && h !== village.loup);
      if (vivants.length > 6) {
        let profiteur = null, pire = 0.85;
        for (const h of vivants) {
          const sc = h.rancune * 1.3 + (1 - h.piete) * 0.5 + h.egare * 0.3;
          if (sc > pire) { pire = sc; profiteur = h; }
        }
        const auteur = profiteur || village.loup;
        const victime = vivants.reduce((a, b) => (lien(auteur, a) <= lien(auteur, b) ? a : b));
        victime.vivant = false;
        village.arrive.meurtres++;
        noter(`${nommer(victime)} a été trouvé${e(victime)} au petit jour. On dit que c'est la bête.`, true, victime);
        souvenir(auteur, profiteur ? "a profité de cette nuit-là, et personne ne l'a jamais su"
                                   : "ne se souvient pas de cette nuit-là");
        for (const h of habitants) {
          if (!h.vivant || h === victime) continue;
          h.peur = Math.min(1, h.peur + 0.35);
          h.soupcon = Math.min(1, h.soupcon + 0.25 * h.superstition);
          const li = Math.max(lien(h, victime), h.secret === victime ? h.secretForce : 0);
          if (li >= 0.3) { h.chagrin = Math.min(1, h.chagrin + li); h.compte.deuils++; }
        }
        if (profiteur) fauter(profiteur, 0.9, 0);   // du remords, aucune honte : personne n'a vu
      }
    }
  }

  // LE SABBAT. La sorcière veille, et ceux qui croient plus aux choses
  // qu'à l'église la rejoignent. Le village voit des lumières à la
  // cabane — c'est le sabbat lui-même qui nourrit le soupçon, donc le
  // bûcher. La boucle se referme toute seule.
  const sorciere = habitants.find(h => h.vivant && h.role === 'sorciere');
  if (sorciere && !village.sabbat) { village.sabbat = true; village.arrive.sabbats++; }
  if (village.sabbat) {
    const veillent = habitants.filter(h => h.vivant && h.occupation === 'veiller').length;
    const auSabbat = habitants.filter(h => h.vivant && h.occupation === 'veiller');
    if (veillent >= 2) for (const h of habitants) {
      if (!h.vivant || h.occupation === 'veiller') continue;
      h.soupcon = Math.min(1, h.soupcon + dt * 0.008 * h.superstition * veillent);
      // et on soupçonne ceux qu'on a vus monter à la cabane
      for (const v of auSabbat) soupconner(h, v, dt * 0.010 * h.superstition);
    }
  }

  // LE LOUP. La rancune, le courage et le peu de foi désignent toujours
  // quelqu'un. Le village n'apprend jamais qui c'était — il entend, c'est
  // tout, et il en soupçonne un autre.
  if (!village.loup && village.lune > 0.93) {
    let pire = null, score = R.seuilLoup;   // mesuré : à 1,15 il ne sortait qu'une fois tous les soixante jours
    for (const h of habitants) {
      if (!h.vivant || h.role === 'sorciere') continue;
      const sc = h.rancune + h.courage * 0.6 + (1 - h.piete) * 0.6;
      if (sc > score) { score = sc; pire = h; }
    }
    if (pire) {
      village.loup = pire;
      village.arrive.loups++;
      noter('Quelque chose a hurlé du côté des champs. Personne ne veut savoir quoi.', true);
      signaler('souffle', pire.x, pire.z);
      souvenir(pire, "n'a aucun souvenir de cette nuit-là");
    }
  }
  // L'ÉGAREMENT. Les plus peureux errent, changent d'avis sans arrêt, et
  // se réveillent loin de chez eux. Rien de définitif — sauf une fois sur
  // mille, où ça ne redescend plus.
  for (const h of habitants) {
    if (!h.vivant) continue;
    const perdu = h.peur > 0.42 && h.courage < 0.42 && village.lune > 0.86;
    if (perdu && !h.egare) { h.egare = true; village.arrive.egares++; }
    if (!perdu) { h.egare = false; continue; }
    h.prochainChoix = 0;                       // il ne tient pas en place
    if (!h.fou && aleaEvenements() < dt * 0.002) {
      h.fou = 1;
      village.arrive.fous++;
      noter(`${nommer(h)} n'est pas revenu${e(h)} le même. On l'évite maintenant.`, true, h);
      souvenir(h, "a perdu la tête une nuit de pleine lune");
    }
  }

  const l = village.loup;
  if (l && l.vivant) {
    l.faim = Math.max(0, l.faim - dt * 0.01);
    for (const h of habitants) {
      if (!h.vivant || h === l) continue;
      const d = Math.hypot(h.x - l.x, h.z - l.z);
      if (d > 18) continue;
      const pres = 1 - d / 18;
      h.peur = Math.min(1, h.peur + dt * 0.09 * pres * (1 - h.courage * 0.6));
      h.soupcon = Math.min(1, h.soupcon + dt * 0.02 * pres * h.superstition);
    }
  }
}

// UNE MORT, ET CE QU'ELLE LAISSE. Écrit une fois, pour que le chagrin
// n'ait pas trois versions différentes selon la façon dont on meurt.
function mourir(h, texte) {
  h.vivant = false;
  noter(texte, true, h, 'mort');
  for (const a of habitants) {
    if (!a.vivant || a === h) continue;
    const l = Math.max(lien(a, h), a.secret === h ? a.secretForce : 0);
    if (l < 0.3) continue;
    a.chagrin = Math.min(1, a.chagrin + l);
    a.compte.deuils++;
    souvenir(a, `a perdu ${h.prenom}`);
  }
  if (h.aime && h.aime.vivant) { souvenir(h.aime, `est resté${e(h.aime)} seul${e(h.aime)}`); h.aime.aime = null; }
  for (const a of habitants) if (a.mere === h && a.vivant) souvenir(a, `a perdu sa mère`);
}

const ANNEE = () => JOUR * R.joursParSaison * 4;      // secondes simulées dans une année

// VIEILLIR. L'usure est la moyenne lente de ce que la vie coûte : avoir
// faim, avoir peur, être épuisé. Elle décide de tout — on s'éteint à
// quarante-cinq ans quand elle est haute, et on en voit quatre-vingts
// quand on a eu de la chance et de quoi manger.
function majAge(h, dt) {
  h.age += dt / ANNEE();
  const dur = h.faim * 0.6 + h.fatigue * 0.25 + h.peur * 0.3 + h.chagrin * 0.15;
  h.usure += (Math.min(1, dur) - h.usure) * dt * 0.0004;

  if (h.role === 'enfant' && h.age >= R.ageAdulte) {
    // Il prend le métier qui manque le plus au village — mais seulement
    // parmi ceux qu'il reste quelqu'un pour savoir. On n'improvise pas
    // boulanger parce que la place est libre : il faut avoir regardé
    // faire. C'est là que le village peut perdre quelque chose pour de
    // bon.
    const su = savoirsVivants();
    const compte = {};
    for (const a of habitants) if (a.vivant && a.role !== 'enfant') compte[a.role] = (compte[a.role] || 0) + 1;
    let manque = 'paysan', pire = 99;
    for (const r of ROLES_UTILES) {
      if (!su.has(r)) continue;
      const n = compte[r] || 0; if (n < pire) { pire = n; manque = r; }
    }
    h.role = manque;
    h.savoir.add(manque);
    h.suit = null;
    village.arrive.majorites++;
    noter(`${h.prenom} a pris le métier de ${NOM_ROLE[manque]}. ${h.feminin ? 'Elle' : 'Il'} a quatorze ans.`, true, h, 'naissance');
    souvenir(h, `est devenu${e(h)} ${NOM_ROLE[manque]}`);
    return;
  }

  const esperance = R.esperanceMax - h.usure * R.usureVie;
  if (h.age > esperance) {
    mourir(h, `${nommer(h)} s'est éteint${e(h)} à ${Math.floor(h.age)} ans.`);
    village.arrive.vieillesses++;
  }
}

function majNoyade(h) {
  // Quatre conditions, et il en faut quatre : le brouillard le plus
  // épais, aucune lumière, le milieu du courant, loin du pont — et la
  // fatigue, parce qu'on ne se noie pas frais et dispos. Premier
  // réglage mesuré : six noyés par village, le village y passait. Ce
  // n'est pas un piège, c'est un accident.
  // LE RUISSEAU NE PREND QU'UNE FOIS PAR NUIT. Sans ce frein, il prenait
  // tous ceux qui passaient au même endroit dans la même brume : vingt-
  // trois noyés sur deux mille journées, devant la vieillesse. Un accident
  // se produit ; une hécatombe est un défaut de réglage.
  if (village.noyadeCetteNuit) return;
  // sous la pleine lune on voit le ruisseau, même à travers la brume
  if (village.lune > 0.55) return;
  if (village.brouillard < 0.79 || h.torche > 0 || h.fatigue < 0.62) return;
  if (Math.abs(distRuisseau(h.x, h.z)) > LARGEUR_EAU * 0.16) return;
  if (Math.hypot(h.x - POINT_PONT.x, h.z - POINT_PONT.z) < 11) return;
  // ON PEUT ÊTRE REPÊCHÉ. S'il y a quelqu'un à portée de voix avec une
  // torche, il voit et il tire. C'est la plus grosse dette que ce
  // village sache créer — et elle vaut plus tard, devant un bûcher.
  const sauveur = habitants.find(a => a.vivant && a !== h && a.role !== 'enfant' &&
    Math.hypot(a.x - h.x, a.z - h.z) < (a.torche > 0 ? 14 : 5));
  if (sauveur) {
    h.fatigue = Math.max(0, h.fatigue - 0.5);
    h.peur = Math.min(1, h.peur + 0.4);
    village.noyadeCetteNuit = true;
    village.arrive.sauvetages++;
    devoir(h, sauveur, 1, 'a tiré du ruisseau');
    noter(`${nommer(sauveur)} a entendu remuer dans l'eau. ${h.prenom} a eu de la chance.`, true, sauveur, 'bienfait');
    souvenir(sauveur, `a repêché ${h.prenom} dans le brouillard`);
    return;
  }
  h.vivant = false;
  village.noyadeCetteNuit = true;
  village.arrive.noyades++;
  noter(`${nommer(h)} n'a pas vu le ruisseau. On l'a retrouvé${e(h)} au petit jour.`, true, h, 'mort');
  for (const a of habitants) {
    if (!a.vivant || a === h) continue;
    const l = Math.max(lien(a, h), a.secret === h ? a.secretForce : 0);
    if (l < 0.3) continue;
    a.chagrin = Math.min(1, a.chagrin + l);
    a.compte.deuils++;
    souvenir(a, `a perdu ${h.prenom}, noyé${e(h)} dans le brouillard`);
  }
  if (h.aime && h.aime.vivant) { souvenir(h.aime, `est resté${e(h.aime)} seul${e(h.aime)}`); h.aime.aime = null; }
}

function majLassitude(h, dt) {
  // L'absorption annule la lassitude : on peut forger tout le jour sans
  // s'en fatiguer. Elle ne donne aucun talent — elle donne de la durée,
  // et c'est ce qui fait le meilleur forgeron du village.
  const tenue = dt * R.lassitude * (1 - h.absorption * 0.85);
  for (const o of OCCUPATIONS) {
    if (o === h.occupation) h.usage[o] = Math.min(R.plafondLassitude, h.usage[o] + tenue);
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
  // Qui a besoin que les jours se ressemblent retourne au même endroit,
  // toujours. Les autres tournent avec le calendrier.
  const rotation = h.regularite > 0.6 ? 0 : village.jour * 3;
  return liste[(h.rang * 7 + rotation + sel * 11) % liste.length];
}
function lieuDe(h, occ) {
  switch (occ) {
    case 'dormir': case 'fuir': return h.logis;
    // on mange chez soi, sauf si l'on aime la compagnie
    case 'manger': return h.sociabilite > 0.6 ? PLACE : h.logis;
    case 'prier': case 'officier': return EGLISE;
    case 'flâner': case 'jouer': return PLACE;
    case 'accuser': {   // on se rassemble d'abord sur la place, on marche ensuite
      if (!village.foule) return PLACE;
      return village.sorciereChassee ? (village.accuse ? village.accuse.logis : PLACE) : CABANE;
    }
    case 'se révolter': return village.fouleRevolte ? MANOIR : PLACE;
    case 'courtiser': return h.courtise;      // une personne a x et z, comme un lieu
    case 'suivre': return h.role === 'enfant' && h.mere ? h.mere : h.suit;
    case 'moissonner': return chez(h, CHAMPS);
    case 'cuire': return FOUR;
    case 'forger': return chez(h, ATELIERS, 1);
    case 'réparer': return MOULINS.reduce((a, b) => (a.etat <= b.etat ? a : b));
    case 'menuiser': return chez(h, ATELIERS, 2);
    case 'tailler': return EGLISE;
    // on vole là où il y a à prendre
    case 'voler': return village.pain >= 1 ? FOUR : PLACE;
    case 'colporter': return PLACE;
    case 'herboriser': case 'veiller': return CABANE;
    case 'bûcheronner': return FORET;
    case 'servir': return AUBERGE;
    case 'guetter': return chez(h, [PLACE, FORET, GRANGE, CABANE], 5);
    case 'inspecter': return chez(h, [PLACE, ...CHAMPS, FOUR], 3);
    case 'visiter': return chez(h, [PLACE, EGLISE, ...CHAUMIERES], 4);
    default: return PLACE;
  }
}

/* ================================================================
   6. LA SIMULATION
   ================================================================ */
const JOUR = 90;            // secondes réelles pour une journée, à vitesse ×1
const PLAFOND_BLE = R.plafondBle;   // au-delà, les greniers débordent
const PROCHE = 2.6;

function simuler(dt) {
  village.temps += dt;
  // LE VENT. Trois sinusoïdes de périodes non multiples : il monte et
  // retombe sur des heures sans jamais se répéter à l'œil, et il ne
  // consomme aucun tirage. Il n'a qu'un effet, mais il compte : il
  // souffle les torches.
  village.vent = 0.5 + 0.5 * (0.55 * Math.sin(village.temps * 0.019)
                            + 0.30 * Math.sin(village.temps * 0.0073 + 1.7)
                            + 0.15 * Math.sin(village.temps * 0.041 + 0.9));

  // LE BROUILLARD. Il monte du ruisseau à l'aube, et seulement les
  // matins calmes : le vent le chasse. Il ne se tire pas au sort, il se
  // déduit — c'est ce qui fait qu'on peut le voir venir.
  const vise = estAube() && !village.pluie ? Math.max(0, 1 - village.vent * 1.6) : 0;
  village.brouillard += (vise - village.brouillard) * Math.min(1, dt * 0.25);

  // LA LUNE. Huit jours de cycle : faux, mais on la voit grossir et
  // maigrir en dix minutes de contemplation, et les nuits noires
  // reviennent assez souvent pour compter. Aucun tirage, encore : elle se
  // calcule à partir du jour et de l'heure.
  village.lune = 0.5 - 0.5 * Math.cos(2 * Math.PI * (village.jour + village.heure) / R.cycleLune);
  majPleineLune(dt);
  majRats(dt);
  majBetes(dt);

  // LES SAISONS. Huit jours chacune, donc une année de trente-deux jours
  // et quatre lunes — les deux cycles se répondent.
  const jourAn = (village.jour - 1) % (R.joursParSaison * 4);
  village.saison = Math.floor(jourAn / R.joursParSaison);
  village.annee = 1 + Math.floor((village.jour - 1) / (R.joursParSaison * 4));

  // LE FROID. Il ne descend qu'en hiver, et le grand froid est un
  // événement dans l'hiver, pas l'hiver entier : le ruisseau prend, la
  // roue s'arrête, et il ne reste que les ailes du moulin à vent.
  const base = [0.3, 0.05, 0.4, 0.75][village.saison];
  village.froid = base + 0.22 * Math.sin(village.temps * 0.0061 + 2.3)
                       + 0.10 * Math.sin(village.temps * 0.017);
  const gelait = village.gel;
  village.gel = village.froid > R.gelSeuil;
  if (village.gel && !gelait) noter('Le ruisseau a pris pendant la nuit. La roue est muette.', true);
  if (!village.gel && gelait) noter('La glace a cédé. La roue repart.');
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
    // qui n'oublie rien ne pardonne pas non plus : la rancune et le
    // chagrin s'effacent d'autant moins vite que la mémoire est bonne
    const oubli = 1 / (1 + h.souvenance * 2.5);
    // les soupçons s'effacent aussi — moins vite chez qui retient tout
    if (h.soupconne.size) for (const [c, v] of h.soupconne) {
      const n = v - dt * R.oubliSoupcon * oubli;
      if (n <= 0.01 || !c.vivant) h.soupconne.delete(c); else h.soupconne.set(c, n);
    }
    h.rancune = Math.max(0, h.rancune - dt * 0.013 * oubli);
    h.chagrin = Math.max(0, h.chagrin - dt * 0.004 * oubli);   // il faut du temps
    // Le remords s'use lentement et se confesse : prier l'efface plus
    // vite que le temps. La honte, elle, ne s'efface pas en priant — il
    // faut que le village finisse par regarder ailleurs.
    h.remords = Math.max(0, h.remords - dt * (h.occupation === 'prier' ? 0.05 : 0.006));
    h.honte = Math.max(0, h.honte - dt * 0.004);
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
    majTorche(h);
    majAge(h, dt);
    majNoyade(h);
    if (!h.vivant) continue;
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
  // ON VISE LA PORTE, PAS LE MUR. Tant qu'on n'est pas sur le seuil, c'est
  // lui qu'on cherche ; une fois passé, on peut aller au cœur du lieu.
  const porte = h.cible.porte;
  let but = h.cible;
  if (porte) {
    const dSeuil = Math.hypot(porte.x - h.x, porte.z - h.z);
    if (dSeuil > PROCHE * 0.8) but = porte;
  }
  const dx = but.x - h.x, dz = but.z - h.z;
  const d = Math.hypot(dx, dz);
  if (d < PROCHE) return;
  const v = h.vitesse * (h.occupation === 'fuir' ? 2 : 1)
            * (h === village.loup ? 1.9 : 1) * (1 - h.fatigue * 0.4);
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
      // LA CLOCHE EST SUPPRIMÉE. Elle sonnait à chaque office, donc sans
      // arrêt, et sur une session de plusieurs heures en fond d'écran
      // c'était insupportable. Un village contemplatif ne doit jamais
      // réclamer l'attention par le son.
      h.compte.prieres += dt;
      // le prêtre apaise tout le monde autour de lui, pas seulement lui
      if (h.role === 'pretre') for (const a of habitants) {
        if (a.vivant && Math.hypot(a.x - h.x, a.z - h.z) < 14) a.peur = Math.max(0, a.peur - dt * 0.05);
      }
      break;
    case 'moissonner':
      h.compte.moissons += dt;
      // avec de bons outils on moissonne bien mieux ; les outils s'usent
      // On sème au printemps, on entretient l'été, on moissonne à
      // l'automne, et l'hiver on ne récolte rien du tout. La moyenne sur
      // l'année vaut 1 : c'est la répartition qui change, pas le total.
      const saisonnier = [0.7, 1.3, 2.0, 0][village.saison]
                       * (h.role === 'enfant' ? 0.5 : 1);
      if (village.ble < PLAFOND_BLE && saisonnier > 0) {
        village.ble += dt * saisonnier * (village.outils > 0 ? R.moissonAvecOutils : R.moissonSansOutils);
        village.outils = Math.max(0, village.outils - dt * 0.02);
      }
      break;
    case 'bûcheronner': village.bois = Math.min(60, village.bois + dt * R.boisParSeconde); break;
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
      // On se le reproche toujours. On n'en a honte que si quelqu'un
      // regardait — et dans le brouillard, personne ne regarde.
      fauter(h, dt * 0.05);
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
      // on ne cuit pas dans une huche pleine : le pain rassit, et surtout
      // c'est ce frein qui laisse le blé s'accumuler en amont
      if (village.pain < R.plafondPain && village.farine >= dt * R.farineParSeconde) {
        village.farine -= dt * R.farineParSeconde;
        village.pain += dt * R.painParSeconde;
      }
      break;
    case 'réparer':
      if (h.cible && h.cible.etat !== undefined) {
        // Perdre le charpentier doit dégrader le village, pas le tuer.
        // Sans lui on étaye quand même la meule, mal et lentement — le
        // moulin tourne au tiers et il faut y passer trois fois plus de
        // temps. La perte se voit dans la farine, pas dans un cadavre.
        const adroit = h.savoir.has('charpentier') || h.role === 'charpentier' ? 1 : R.reparationMaladroite;
        // on ne répare pas sans bois : le bûcheron devient un maillon
        if (village.bois > 0) {
          h.cible.etat = Math.min(1, h.cible.etat + dt * R.reparationParSeconde * adroit);
          village.bois = Math.max(0, village.bois - dt * R.boisRepare);
        }
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
        const avant = a.fatigue;
        a.fatigue = Math.max(0, a.fatigue - dt * 0.05);
        // On ne doit rien à qui vous soulage d'un rien : c'est celui
        // qu'elle a relevé de très bas qui lui doit, et les siens avec.
        if (avant > 0.45) devoir(a, h, dt * 0.12, 'a soigné');
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
    // LE VENT FAIT TOURNER LE MOULIN. Les deux moulins ne se valent plus :
    // la roue a le courant, qui ne s'arrête jamais ; les ailes ont le
    // vent, qui va et vient. Le village dépend donc d'un moulin fiable et
    // d'un moulin capricieux, et c'est le second qui fait les disettes.
    // la roue a le courant — sauf quand le courant est pris par la glace
    const force = m.axe === 'roue' ? (village.gel ? 0 : 1) : 0.3 + village.vent * 1.4;
    const marche = m.etat > 0.12 && village.ble > 0 && force > 0.35 &&
                   village.farine < R.plafondFarine;
    m.tourne += dt * (marche ? (m.axe === 'roue' ? 1.6 : 1.1 * force) : 0);
    if (!marche) continue;
    const debit = dt * R.meuleParSeconde * m.etat * force;
    village.ble = Math.max(0, village.ble - debit);
    village.farine = Math.min(R.plafondFarine, village.farine + debit * 0.92);
    m.etat = Math.max(0, m.etat - dt * R.usureMeule);      // l'usure de la meule
    if (m.etat <= 0.12 && !m.reparationSignalee) {
      m.reparationSignalee = true;
      noter(`${m.nom} s'est arrêté. La meule ne tourne plus.`, true);
      malheur(m.x, m.z, 0.16);
    }
  }
}

/* ---- le voisinage : la rumeur ET l'affection passent par le même
       endroit, à savoir deux personnes qui se croisent souvent ---- */
/* ---- LA GRILLE ----
   Comparer chaque habitant à tous les autres coûtait le carré : mesuré,
   doubler la population divisait la vitesse par quatre, et le plafond
   tombait à 250 habitants à ×100.
   Or deux personnes n'interagissent qu'à moins de cinq mètres. On range
   donc tout le monde dans des cases de cinq mètres, et on ne compare que
   ce qui est dans la même case ou dans les huit voisines. Le coût
   redevient proportionnel au nombre de gens, pas à son carré. */
const CASE = 5;
const grille = new Map();
const clefCase = (x, z) => ((Math.floor(x / CASE) + 512) << 10) | (Math.floor(z / CASE) + 512);

function rangerDansLaGrille() {
  grille.clear();
  for (const h of habitants) {
    if (!h.vivant) continue;
    const k = clefCase(h.x, h.z);
    const seau = grille.get(k);
    if (seau) seau.push(h); else grille.set(k, [h]);
  }
}

function voisinage(dt) {
  rangerDansLaGrille();
  // On relit la table de soupçons UNE FOIS par personne et par pas, pas
  // une fois par paire. Mesuré : c'était là le vrai coût quadratique, et
  // non la boucle des voisins — la grille seule n'avait presque rien
  // gagné.
  for (const h of habitants) if (h.vivant) h.pire = plusSoupconne(h);
  for (const [k, seau] of grille) {
    for (let i = 0; i < seau.length; i++) {
      const a = seau[i];
      if (!a.vivant) continue;
      // les neuf cases : la sienne et les huit d'autour. On ne regarde
      // que vers l'avant pour ne pas traiter chaque paire deux fois.
      for (let dc = 0; dc < 9; dc++) {
        const ox = (dc % 3) - 1, oz = ((dc / 3) | 0) - 1;
        const voisin = (ox === 0 && oz === 0) ? seau
                     : grille.get(k + (ox << 10) + oz);
        if (!voisin) continue;
        const debut = (ox === 0 && oz === 0) ? i + 1 : 0;
        for (let j = debut; j < voisin.length; j++) {
      const b = voisin[j];
      if (!b.vivant || b === a) continue;
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

        // ET UN NOM PASSE AVEC. On se dit qui l'on soupçonne, et l'autre
        // en garde une part. C'est ainsi qu'un soupçon né d'un seul
        // regard devient l'affaire de tout le village.
        const pa = a.pire, pb = b.pire;
        if (pa.qui && pa.qui !== b) soupconner(b, pa.qui, dt * 0.05 * pa.valeur * (0.3 + a.sociabilite));
        if (pb.qui && pb.qui !== a) soupconner(a, pb.qui, dt * 0.05 * pb.valeur * (0.3 + b.sociabilite));
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
  }
}

// SEUIL DE REGROUPEMENT — le motif repris de Bastion Orbit. Personne
// n'écrit « faire une chasse aux sorcières » ni « déclencher une
// révolte » : il suffit qu'assez de gens du même avis se retrouvent au
// même endroit. Deux colères, deux seuils, deux destinations.
// combien il en faut pour que ça devienne une foule — réglable, parce
// qu'un village qui perd des habitants n'en rassemble plus autant
const SEUIL_FOULE = R.seuilFoule, SEUIL_REVOLTE = 4;

// Faute de sorcière, le village en désigne un autre. La règle est d'une
// simplicité qui fait froid dans le dos : c'est le moins sociable qui est
// choisi, celui à qui personne ne parlait déjà. Et si c'est le boulanger,
// le village se coupe le pain tout seul.
function designerBouc() {
  // on ne désigne jamais l'étranger : seul, sans terre et sans menace, il
  // intrigue plus qu'il n'inquiète — et c'est précisément ce qui le sauve
  const epargne = (h) => h.role === 'pretre' || h.role === 'seigneur' ||
                         h.role === 'colporteur' || h.role === 'enfant';
  // Ce n'est plus une règle qui désigne le plus faible : c'est la somme
  // de ce que chacun soupçonne. Le village peut donc tomber juste, et il
  // peut se tromper — les deux arrivent, et pour de vraies raisons.
  const { qui: vise } = soupconneDuVillage(epargne);
  const bouc = vise || habitants.filter(h => h.vivant && !epargne(h))
                                .sort((a, b) => a.sociabilite - b.sociabilite)[0];
  if (!bouc) return null;
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
          noter(`${nommer(sgr)} s'est interposé. La foule s'est défaite.`, true, sgr, 'bienfait');
          // On lui doit d'être encore là. Le seigneur ne le fait pas pour
          // ça, mais le village s'en souviendra le jour de la révolte.
          devoir(visee, sgr, 0.9);
          village.autorite = Math.max(0, village.autorite - 0.2);
          // tout le monde change d'avis, pas seulement les arrivés — sinon
          // les autres relancent une foule dans la seconde
          for (const h of chauds) { h.soupcon *= 0.3; h.prochainChoix = 0; }
        } else if (rappeler(visee)) {
          // quelqu'un a parlé : voir rappeler()
          for (const h of chauds) { h.soupcon *= 0.35; h.prochainChoix = 0; }
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
    village.arrive.revoltes++;
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
  if (jusquauBout) {
    noter(`Le bûcher a brûlé sur la place. ${nommer(v)} n'est plus.`, true, v, 'mort');
    village.arrive.buchers++;
    // Ceux qui ont crié avec les autres s'en veulent après coup, et
    // d'autant plus qu'ils étaient pieux. La honte, elle, ne vient que
    // s'il y avait du monde — et il y en avait.
    for (const h of habitants) {
      if (!h.vivant || h === v) continue;
      if (h.occupation !== 'accuser') continue;
      fauter(h, 0.5 + lien(h, v) * 0.5, 3);
      souvenir(h, `était sur la place quand le bûcher a brûlé`);
    }
  }
  else { noter(`${nommer(v)} a pris la route avant eux. La maison est vide.`, true, v, 'mort'); village.arrive.departs++; }
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

/* ================================================================
   LES LÉGENDES
   Rien de surnaturel n'existe ici. Ce qui existe, c'est un village qui
   a peur et qui a besoin d'un nom à mettre sur sa peur. L'étranger dont
   on ne sait rien, le chasseur qui vend une certitude, le seigneur qui
   prend le blé — chacun devient le monstre qu'il faut au moment voulu.
   ================================================================ */

// L'ÉTRANGER. Il arrive, il loge à l'auberge, il repart. On ne sait rien
// de lui, et c'est exactement pour ça qu'on le soupçonne — ou qu'il en
// profite.
// CELUI QUI POSE SON BALLOT. Un étranger sur cinquante sait un métier
// que le village a perdu. Presque jamais : à ce taux-là c'est une
// légende, pas une mécanique de réparation. Et il ne repart pas — un
// savoir qui passe et s'en va n'aurait rien rendu du tout. Il s'établit,
// il reprend une maison vide s'il en reste une debout, et il fonde un
// nom. C'est le seul contrepoids à l'extinction, et il est plus rare
// qu'elle.
function etablir(h) {
  const r = [...village.perdus][0];          // le plus anciennement perdu
  if (!r) return false;
  village.perdus.delete(r);
  h.role = r;
  h.savoir.add(r);
  h.joursRestants = Infinity;
  const vide = LIEUX.find(l => l.type === 'chaumiere' && l.vide && !l.ruine);
  if (vide) { h.logis = vide; vide.vide = false; vide.abandon = 0; }
  else h.logis = CHAUMIERES[h.rang % CHAUMIERES.length];
  h.x = h.logis.x; h.z = h.logis.z; h.cible = null;
  const libre = LIGNEES.find(n => !village.lignees.has(n));
  if (libre) {
    h.lignee = libre;
    h.logis.lignee = h.logis.lignee || libre;
    village.lignees.set(libre, { nom: libre, logis: h.logis, eteinte: false, jour: 0 });
  }
  village.arrive.etablis++;
  noter(`${h.prenom} a posé son ballot et n'est pas reparti. Il sait ${NOM_ROLE[r]}.`, true, h, 'perte');
  suiteDe(r, `${nommer(h)} l'a rapporté d'ailleurs.`);
  return true;
}

function majEtrangers() {
  for (const h of habitants) {
    if (!h.vivant || h.role !== 'etranger') continue;
    h.joursRestants--;
    if (h.joursRestants <= 0) {
      h.vivant = false;
      noter(`${h.prenom} a repris la route. On n'a jamais su d'où il venait.`);
    }
  }
  const combien = habitants.filter(h => h.vivant && h.role === 'etranger').length;
  if (combien >= 2 || aleaEvenements() > 0.05) return;   // mesuré : à 0,12 il en passait un tous les deux jours
  const venu = creerHabitant('etranger', AUBERGE);
  venu.joursRestants = Math.round(entre(3, 9));
  venu.sociabilite = entre(0.1, 0.5);
  habitants.push(venu);
  nouveaux.push(venu);
  village.arrive.etrangers++;
  noter(`Un homme est descendu à l'auberge. Personne ne sait qui c'est.`, true, venu);
  // et une fois sur cinquante, ce qu'il sait faire manquait ici
  if (village.perdus.size && aleaEvenements() < R.etrangerSavant && etablir(venu)) return;
  // le village se méfie de ce qu'il ne connaît pas
  for (const h of habitants) if (h.vivant && h !== venu) soupconner(h, venu, 0.10 * h.superstition);
}

// LE CHASSEUR DE MONSTRES. Il vient quand le village a peur, il est logé
// gratuitement à l'auberge, et il désigne un coupable. Il peut se
// tromper. Il peut être un escroc qui ne cherche que le gîte. Le village
// n'a aucun moyen de faire la différence — et nous non plus, sauf dans sa
// fiche.
function majChasseur() {
  const c = village.chasseur;
  if (c && c.vivant) {
    village.joursChasseur--;
    if (village.joursChasseur > 0) return;
    village.chasseur = null;
    if (c.imposteur) {
      c.vivant = false;
      village.arrive.imposteurs++;
      noter(`${c.prenom} est parti avant l'aube, sans rien avoir chassé. L'aubergiste n'a pas été payé.`, true);
      for (const h of habitants) if (h.vivant) h.foi = Math.max(0, h.foi - 0.1);
    } else {
      c.vivant = false;
      noter(`${c.prenom} a repris la route. Il a juré que la chose ne reviendrait pas.`, true);
      for (const h of habitants) if (h.vivant) h.peur = Math.max(0, h.peur - 0.25);
    }
    return;
  }
  // il ne vient que si l'on a peur, et pas deux fois de suite
  if (village.peur < 0.20 || village.jour < 12 || aleaEvenements() > 0.35) return;
  const venu = creerHabitant('chasseur', AUBERGE);
  venu.courage = entre(0.7, 1);
  venu.superstition = entre(0.6, 1);
  venu.imposteur = aleaEvenements() < 0.45;      // presque un sur deux
  venu.joursRestants = 99;
  habitants.push(venu);
  nouveaux.push(venu);
  village.chasseur = venu;
  village.joursChasseur = Math.round(entre(4, 10));
  village.arrive.chasseurs++;
  noter(`Un homme armé s'est présenté. Il dit chasser ce qui rôde, et l'auberge le loge.`, true, venu);
  souvenir(venu, venu.imposteur ? "n'a jamais chassé quoi que ce soit"
                                : 'est venu chasser ce qui rôde');

  // IL DÉSIGNE. Le vrai chasseur suit ce que le village soupçonne déjà ;
  // l'escroc désigne le plus commode — celui qu'on voit le moins.
  const epargne = (h) => h.role === 'seigneur' || h.role === 'enfant' || h === venu;
  let vise;
  if (venu.imposteur) {
    vise = habitants.filter(h => h.vivant && !epargne(h))
      .sort((a, b) => (a.sociabilite + a.seuil) - (b.sociabilite + b.seuil))[0];
  } else {
    vise = soupconneDuVillage(epargne).qui;
  }
  if (!vise) return;
  noter(`Il a regardé longuement ${nommer(vise)}, et n'a rien dit.`, true, vise);
  for (const h of habitants) {
    if (!h.vivant || h === vise) continue;
    soupconner(h, vise, 0.45 * (0.5 + h.superstition));
  }
}

// LE SEIGNEUR QUI BOIT LE SANG. Aucune mécanique nouvelle : il lève
// l'impôt, c'est tout. Mais quand la faim dure et que le manoir est
// plein, le village trouve l'image juste — et à partir de là, il le
// soupçonne comme il soupçonnerait n'importe qui.
function majVampire() {
  if (village.jour < village.jourVampire + 20) return;
  const sgr = habitants.find(h => h.vivant && h.role === 'seigneur');
  if (!sgr || village.impot < 14) return;
  const affames = habitants.filter(h => h.vivant && h.faim > 0.6).length;
  if (affames < 4) return;
  village.jourVampire = village.jour;
  village.arrive.vampire++;
  noter(`On dit tout bas que le seigneur boit le sang du village. Le grenier du manoir est plein.`, true, sgr);
  for (const h of habitants) {
    if (!h.vivant || h === sgr) continue;
    soupconner(h, sgr, 0.28 * (0.4 + h.superstition));
    h.rancune = Math.min(1, h.rancune + 0.12);
  }
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
  village.arrive.successions++;
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
// Moyenne ET écart-type du village sur un compteur. Le rapport à la
// seule moyenne ne valait rien : un compteur qui monte pour tout le monde
// (les prières) et un compteur rare (les vols) n'ont pas la même échelle,
// donc c'était toujours le même surnom qui gagnait la comparaison — quatre
// « avare » sur cinq à la dernière mesure. L'écart-type remet les dix
// surnoms sur le même pied.
function statsDe(champ) {
  let t = 0, n = 0;
  for (const h of habitants) { if (!h.vivant) continue; t += h.compte[champ]; n++; }
  const moy = n ? t / n : 0;
  let v = 0;
  for (const h of habitants) { if (!h.vivant) continue; v += (h.compte[champ] - moy) ** 2; }
  return { moy, ecart: n > 1 ? Math.sqrt(v / n) : 0 };
}
// combien de fois au-dessus de la moyenne, moins le seuil de 2 : à 3× la
// moyenne le score vaut 1, ce qui commence à être remarquable
// Combien d'écarts-types au-dessus des autres, moins le seuil. Dans un
// village de dix-sept, une conduite que personne d'autre n'a vaut environ
// quatre écarts ; à trois personnes elle n'en vaut plus que deux. Le seuil
// dit donc, en clair : « pas plus de deux ou trois à le faire ».
const saillant = (v, st, seuil = 1.3) => (st.ecart < 0.35 ? -9 : (v - st.moy) / st.ecart - seuil);

const SURNOMS = [
  { f: 'la hargneuse',   m: 'le hargneux',    score: (h) => (h.rancune - 0.82) * 8 },
  { f: "l'éconduite",    m: "l'éconduit",     score: (h, mo) => saillant(h.compte.rembarrades, mo.rembarrades, 1.5) },
  { f: 'la main leste',  m: 'la main leste',  score: (h, mo) => saillant(h.compte.vols, mo.vols, 1.6) },
  { f: "aux mains d'or", m: "aux mains d'or", score: (h, mo) => saillant(h.compte.reparations, mo.reparations, 1.6) },
  { f: 'la dévote',      m: 'le dévot',       score: (h, mo) => saillant(h.compte.prieres, mo.prieres, 1.4) + (h.piete > 0.75 ? 0.4 : -1.5) },
  { f: 'la taciturne',   m: 'le taciturne',   score: (h) => (0.12 - h.sociabilite) * 9 - h.liens.size * 0.15 },
  { f: "l'avare",        m: "l'avare",        score: (h, mo) => (h.cupidite - 0.9) * 5 + saillant(h.compte.vols, mo.vols, 1.2) },
  { f: 'la corbeille',   m: 'outre à vin',    score: (h, mo) => saillant(h.compte.foires, mo.foires, 1.1) + (h.piete < 0.25 ? 0.4 : -3) },
  { f: 'la douloureuse', m: 'le douloureux',  score: (h, mo) => saillant(h.compte.deuils, mo.deuils, 1.5) },
  { f: 'la brûlante',    m: 'le brûlant',     score: (h, mo) => saillant(h.compte.accusations, mo.accusations, 1.5) },
];

// et le village n'en trouve pas un par jour : on ne nomme que le cas le
// plus marquant, et seulement s'il dépasse vraiment
function surnommer() {
  const mo = {};
  for (const c of ['rembarrades', 'vols', 'reparations', 'prieres', 'foires', 'deuils', 'accusations']) {
    mo[c] = statsDe(c);
  }
  // Un surnom ne se porte pas à deux dans le même village : il sert
  // justement à distinguer. Le second plus avare devra trouver autre
  // chose, ou n'avoir aucun surnom.
  const pris = new Set();
  for (const h of habitants) if (h.vivant && h.surnomIdx != null) pris.add(h.surnomIdx);

  let meilleur = null, meilleurScore = 1;
  for (const h of habitants) {
    if (!h.vivant || h.surnom) continue;
    for (let i = 0; i < SURNOMS.length; i++) {
      if (pris.has(i)) continue;
      const sc = SURNOMS[i].score(h, mo);
      if (sc > meilleurScore) { meilleurScore = sc; meilleur = { h, su: SURNOMS[i], i }; }
    }
  }
  if (!meilleur) return;
  const { h, su } = meilleur;
  h.surnomIdx = meilleur.i;
  h.surnom = h.feminin ? su.f : su.m;
  village.arrive.surnoms++;
  noter(`On a commencé à l'appeler ${h.surnom}. C'était ${h.prenom}.`, false, h);
  souvenir(h, `a gagné son surnom : ${h.surnom}`);
}

// NAÎTRE. Pierre a tranché : quand la nourriture le permet. Le village
// grossit les bonnes années et se vide les mauvaises — ce qui rend
// l'hiver, les moulins et le pain soudain beaucoup plus importants.
function naissances() {
  // LA PORTE LISAIT LE BLÉ, QUI N'EST JAMAIS UN STOCK. Les meules le
  // broient aussi vite qu'on le moissonne : mesuré, `ble` reste à zéro du
  // centième jour à la fin, et la porte ne s'ouvrait donc plus jamais —
  // cinq naissances en soixante-deux années, pendant que le village
  // s'éteignait. On regarde ce que le village a VRAIMENT à manger, c'est-
  // à-dire tout ce qui est dans la chaîne, pain compris.
  if (village.pain < 10) return;
  if (village.ble + village.farine + village.pain < 30) return;
  const vivants = habitants.filter(h => h.vivant);
  if (vivants.length >= 26) return;
  for (const m of vivants) {
    if (!m.feminin || m.role === 'enfant' || !m.aime || !m.aime.vivant) continue;
    if (m.age < 17 || m.age > 42) continue;
    if (village.jour < (m.prochainEnfant || 0)) continue;
    m.prochainEnfant = village.jour + R.joursParSaison * 4;      // une par année au plus
    const bebe = creerHabitant('enfant', m.logis);
    bebe.age = 0;
    bebe.mere = m;
    bebe.suit = m;
    bebe.usure = Math.min(1, m.usure * 0.5);
    // le nom de maison vient de la mère, et à défaut du père
    bebe.lignee = m.lignee || (m.aime && m.aime.lignee) || null;
    habitants.push(bebe);
    nouveaux.push(bebe);
    village.arrive.naissances++;
    noter(`${m.prenom} a eu un enfant. On l'appelle ${bebe.prenom}.`, true, bebe, 'naissance');
    souvenir(m, `a mis ${bebe.prenom} au monde`);
    souvenir(m.aime, `est devenu${e(m.aime)} parent de ${bebe.prenom}`);
    return;                       // une naissance par jour, pas davantage
  }
}

// LES RATS. Ils vivent de ce qu'on entasse — donc plus la grange est
// pleine, plus ils prospèrent, et plus ils en prennent. Les chats les
// tiennent. C'est la première boucle du jeu où l'abondance se punit
// elle-même, et elle se voit : le tas qu'on regarde est celui qu'ils
// mangent.
/* ================================================================
   LES BÊTES
   Elles ne sont pas du décor. Les rats mangent ce qu'on entasse, les
   chats tiennent les rats, et les chiens sentent le loup avant qu'on
   l'ait vu — donc la peur monte sans que personne ait rien vu, ce qui
   est exactement la façon dont ce village fabrique ses monstres.
   Aucune ne consomme de tirage : leurs allées et venues sont des
   sinusoïdes, comme le vent et la flamme.
   ================================================================ */
function poserBete(type, ancre, rayon) {
  village.betes.push({
    type, ancre, rayon,
    x: ancre.x + entre(-rayon, rayon), z: ancre.z + entre(-rayon, rayon),
    p: entre(0, 6.28), q: entre(0, 6.28),
    v: entre(0.6, 1.4), vivant: true, suit: null, alerte: 0,
  });
}
{
  for (let i = 0; i < 3; i++) poserBete('chat', CHAUMIERES[i % CHAUMIERES.length], 7);
  for (let i = 0; i < 3; i++) poserBete('chien', PLACE, 12);
  for (let i = 0; i < 2; i++) poserBete('cheval', MANOIR, 6);
  for (let i = 0; i < 8; i++) poserBete('rat', GRANGE, 5);
}

function majBetes(dt) {
  const loup = village.loup;
  let aboie = false;
  for (const b of village.betes) {
    if (!b.vivant) continue;

    if (b.type === 'rat') {
      // ils ne sortent qu'à proportion de ce qu'il y a à prendre
      b.vivant = true;
      b.visible = village.rats > 0.4 + village.betes.indexOf(b) * 0.25;
      b.x = b.ancre.x + Math.sin(village.temps * 0.6 * b.v + b.p) * b.rayon;
      b.z = b.ancre.z + Math.cos(village.temps * 0.45 * b.v + b.q) * b.rayon * 0.7;
      continue;
    }

    if (b.type === 'chien') {
      // Il sent le loup bien avant les hommes, et il aboie. C'est le
      // village qui décide ensuite que c'était un monstre.
      const d = loup && loup.vivant ? Math.hypot(b.x - loup.x, b.z - loup.z) : 999;
      b.alerte = d < 34 ? Math.min(1, b.alerte + dt * 0.5) : Math.max(0, b.alerte - dt * 0.2);
      if (b.alerte > 0.5) {
        aboie = true;
        for (const h of habitants) {
          if (!h.vivant) continue;
          const dh = Math.hypot(h.x - b.x, h.z - b.z);
          if (dh > 22) continue;
          h.peur = Math.min(1, h.peur + dt * 0.05 * (1 - dh / 22) * (1 - h.courage * 0.5));
        }
        // il court vers ce qu'il a senti — s'il est encore là. Le chien
        // continue d'aboyer un moment après que la chose est partie, et
        // c'est justement ce qui laisse le village inventer la suite.
        if (loup && loup.vivant) {
          b.x += (loup.x - b.x) * dt * 0.25;
          b.z += (loup.z - b.z) * dt * 0.25;
        }
        continue;
      }
      // sinon il suit quelqu'un
      if (!b.suit || !b.suit.vivant) b.suit = habitants.find(h => h.vivant && h.role !== 'enfant') || null;
      if (b.suit) {
        const cible = { x: b.suit.x + Math.sin(village.temps * 0.7 + b.p) * 2.2,
                        z: b.suit.z + Math.cos(village.temps * 0.7 + b.p) * 2.2 };
        b.x += (cible.x - b.x) * dt * 1.4;
        b.z += (cible.z - b.z) * dt * 1.4;
      }
      continue;
    }

    if (b.type === 'chat') {
      // il rôde là où il y a des rats, c'est-à-dire près de la grange
      const vers = village.rats > 1.2 ? GRANGE : b.ancre;
      const cx = vers.x + Math.sin(village.temps * 0.22 * b.v + b.p) * 6;
      const cz = vers.z + Math.cos(village.temps * 0.19 * b.v + b.q) * 6;
      b.x += (cx - b.x) * dt * 0.7;
      b.z += (cz - b.z) * dt * 0.7;
      continue;
    }

    // les chevaux : au manoir, et sur la place les jours de foire
    const chez = village.foire > 0 ? PLACE : b.ancre;
    b.x += (chez.x + Math.sin(village.temps * 0.11 + b.p) * 5 - b.x) * dt * 0.5;
    b.z += (chez.z + Math.cos(village.temps * 0.09 + b.q) * 5 - b.z) * dt * 0.5;
  }

  if (aboie && !village.aboiement) {
    noter("Les chiens n'ont pas cessé d'aboyer vers les champs.", true);
    signaler('rumeur');
    // Ils ont aboyé quelque part, et le village regarde qui était là.
    const chien = village.betes.find(b => b.type === 'chien' && b.alerte > 0.5);
    if (chien) malheur(chien.x, chien.z, 0.18);
  }
  village.aboiement = aboie ? 1 : 0;
}

function majRats(dt) {
  const chats = village.betes.reduce((t, b) => t + (b.type === 'chat' && b.vivant ? 1 : 0), 0);
  const nourriture = Math.min(3, village.ble / 30);
  village.rats = Math.max(0.1, village.rats
    + dt * (nourriture * R.ratsCroissance - village.rats * (0.0008 + chats * R.ratsChasses * 0.01)));
  village.ble = Math.max(0, village.ble - dt * village.rats * R.ratsMangent * 0.02);
}

/* ================================================================
   LE TROISIÈME ACTE — CE QUI NE REVIENT PAS
   Tout le reste de ce village se répare. La faim passe, la peur
   retombe, le moulin se remonte, un enfant reprend le métier. Un jeu
   fait de ça seul est une boucle : on peut le regarder longtemps sans
   que rien ne soit jamais en jeu. Ici trois choses ne reviennent pas —
   un nom de maison qui s'éteint, un métier que plus personne ne sait,
   une maison vide qui finit par tomber. Elles ne s'annoncent pas ;
   elles se constatent, un matin, dans la chronique.
   ================================================================ */

function perdre(quoi, texte, cle = null) {
  village.pertes.push({ jour: village.jour, annee: village.annee, quoi, texte, cle, suite: null });
  noter(texte, true, null, 'perte');
}

// La perte ne s'efface pas de la liste quand elle trouve une suite : elle
// a eu lieu, et elle a duré. On écrit la suite en dessous.
function suiteDe(cle, texte) {
  for (let i = village.pertes.length - 1; i >= 0; i--) {
    const p = village.pertes[i];
    if (p.cle === cle && !p.suite) { p.suite = { jour: village.jour, annee: village.annee, texte }; return; }
  }
}

// ---- LES LIGNÉES ----
// Le nom de maison est enregistré à la fondation. On regarde chaque soir
// s'il reste quelqu'un pour le porter.
function majLignees() {
  const compte = new Map();
  for (const h of habitants) if (h.vivant && h.lignee) compte.set(h.lignee, (compte.get(h.lignee) || 0) + 1);
  for (const [nom, l] of village.lignees) {
    if (l.eteinte) continue;
    if (compte.get(nom)) continue;
    l.eteinte = true; l.jour = village.jour;
    village.arrive.extinctions++;
    perdre('lignee', `Il n'y a plus de ${nom} au village. La maison restera vide.`);
    // la maison ne se relouera pas : personne n'arrive jamais ici pour
    // s'installer, et c'est exactement pour ça que le vide se voit
    if (l.logis && !habitants.some(h => h.vivant && h.logis === l.logis)) {
      l.logis.vide = true;
      if (l.logis.abandon === undefined) l.logis.abandon = 0;
    }
  }
}

// ---- LES MAISONS VIDES ----
// Une maison sans personne dedans ne tombe pas le lendemain. Elle se
// tait d'abord — pas de fumée, pas de lumière — puis le toit cède.
function majRuines() {
  for (const l of LIEUX) {
    if (!l.vide || l.ruine) continue;
    if (habitants.some(h => h.vivant && h.logis === l)) { l.vide = false; l.abandon = 0; continue; }
    l.abandon = (l.abandon || 0) + 1;
    if (l.abandon >= R.ruineApres) {
      l.ruine = true;
      village.arrive.ruines++;
      perdre('ruine', `Le toit de la maison vide a cédé. On passe devant sans plus la regarder.`);
    }
  }
}

// ---- LES MÉTIERS ----
// Ce que le village sait encore faire, ce soir. Le travail de la terre
// n'est jamais perdu : tout le monde a vu faire.
function savoirsVivants() {
  const su = new Set(['paysan']);
  for (const h of habitants) if (h.vivant) for (const r of h.savoir) su.add(r);
  return su;
}

// UN ENFANT APPREND EN REGARDANT. Pas un rôle : quelqu'un. C'est
// l'adulte dont il est le plus proche qui lui transmet, et si cet
// adulte meurt avant le terme, l'apprentissage s'arrête là.
function apprendre() {
  for (const h of habitants) {
    // Les enfants apprennent, et les paysans aussi. Un village n'a pas
    // d'école : on regarde faire son voisin, et le jour où il meurt on
    // sait à peu près. Restreint aux paysans parce qu'ils sont les seuls
    // dont le travail laisse le loisir de regarder ailleurs.
    if (!h.vivant || (h.role !== 'enfant' && h.role !== 'paysan')) continue;
    let maitre = null, meilleur = 0.25;
    for (const a of habitants) {
      if (!a.vivant || a === h || a.role === 'enfant') continue;
      if (!ROLES_UTILES.includes(a.role)) continue;
      const l = lien(h, a) + (a === h.mere ? 0.4 : 0);
      if (l > meilleur) { meilleur = l; maitre = a; }
    }
    if (!maitre) continue;
    const r = maitre.role;
    h.appris[r] = (h.appris[r] || 0) + 1;
    if (h.appris[r] === R.apprentissage && !h.savoir.has(r)) {
      h.savoir.add(r);
      souvenir(h, `a appris ${NOM_ROLE[r]} en regardant ${maitre.prenom}`);
      souvenir(maitre, `a montré son métier à ${h.prenom}`);
    }
  }
}

// Et le soir où plus personne ne sait, on ne l'apprend pas tout de
// suite : on s'en aperçoit à la première meule cassée.
function majMetiers() {
  const su = savoirsVivants();
  for (const r of ROLES_UTILES) {
    if (su.has(r) || village.perdus.has(r)) continue;
    village.perdus.add(r);
    village.arrive.metiersPerdus++;
    const suite = {
      boulanger: 'Le four ne rallumera pas.',
      charpentier: 'Aucune meule ne sera plus remontée.',
      forgeron: "Les outils s'useront jusqu'au dernier.",
      pretre: "L'église restera fermée.",
      bucheron: 'On ira chercher son bois soi-même, et moins loin.',
      tailleur: 'Le chantier de l\'église s\'arrête ici.',
      ebeniste: 'Plus personne ne travaille le bois pour le plaisir.',
    }[r] || '';
    perdre('metier', `Plus personne ne sait ${NOM_ROLE[r]}. ${suite}`.trim(), r);
  }
}

// ---- LA PAROLE QUI SAUVE ----
// La foule est devant la porte. S'il y a là quelqu'un qui doit
// vraiment quelque chose à l'accusé, il le dit — et parler contre les
// siens coûte : les autres le regarderont de travers ensuite.
function rappeler(visee) {
  // Pas parmi les accusateurs : la dette empêche précisément d'accuser,
  // donc celui qui doit n'est jamais dans la foule. Il est sur le pas de
  // sa porte, il regarde, et à un moment il ne peut plus se taire.
  let qui = null, dette = R.detteQuiSauve;
  const temoins = habitants.filter(h => h.vivant && h !== visee && h.role !== 'enfant' &&
    Math.hypot(h.x - visee.logis.x, h.z - visee.logis.z) < 20);
  for (const h of temoins) { const d = detteDe(h, visee); if (d > dette) { dette = d; qui = h; } }
  if (!qui) return false;
  village.arrive.paroles++;
  noter(`${nommer(qui)} a rappelé devant tous ce que ${visee.prenom} avait fait pour ${qui.feminin ? 'elle' : 'lui'}. On s'est tu.`,
        true, qui, 'bienfait');
  souvenir(qui, `a parlé pour ${visee.prenom} devant la foule`);
  souvenir(visee, `a été défendu${e(visee)} par ${qui.prenom}`);
  // celui qui défend l'accusé devient un peu suspect à son tour
  for (const h of temoins) if (h !== qui) soupconner(h, qui, 0.18);
  return true;
}

// Le dernier vivant s'en va, et le village devient un lieu. On note le
// jour, une seule fois, et la chronique s'arrête là.
function majExtinction() {
  if (village.eteint) return;
  if (habitants.some(h => h.vivant)) return;
  village.eteint = village.jour;
  noter(`Il ne reste plus personne à ${'Dwelve Hollow'}. ` +
        `Le village aura vécu ${village.annee} années.`, true, null, 'perte');
  village.pertes.push({ jour: village.jour, annee: village.annee, quoi: 'village',
                        texte: 'Le village s\'est éteint.', cle: null, suite: null });
}

// REPRENDRE LE MÉTIER DU MORT.
// Il manquait au village la chose la plus simple du monde : quand le
// boulanger meurt, quelqu'un reprend le four. Sans ça, mesuré sur deux
// mille journées, le village finissait avec neuf cents mesures de blé et
// zéro pain — la chaîne coupée à un maillon que plus personne n'avait le
// droit de tenir. Un adulte ne changeait jamais de métier de sa vie.
//
// Ça ne rend pas les métiers impérissables : il faut avoir appris. Ce qui
// est perdu reste perdu ; ce qui est su se reprend.
const VITAUX = ['boulanger', 'charpentier', 'paysan'];
function reprendreUnMetier() {
  const vivants = habitants.filter(h => h.vivant);
  for (const r of ROLES_UTILES) {
    if (vivants.some(h => h.role === r)) continue;           // quelqu'un le fait déjà
    // celui qui sait, et qui peut être détaché : un paysan avant tout
    const candidats = vivants.filter(h => h.savoir.has(r) && h.role !== 'enfant' &&
      h.role !== 'seigneur' && h.role !== 'dame' && h.role !== 'pretre' && h.role !== 'sorciere' &&
      // ON NE CHANGE PAS DE MÉTIER TOUS LES HUIT JOURS. Sans ce délai, la
      // reprise creusait le trou qu'elle venait de combler : 277 reprises
      // en deux mille journées, un village entier jouant aux chaises
      // musicales. On prend un métier pour des années.
      village.jour >= (h.jourMetier || 0) + R.joursParSaison * 4);
    if (!candidats.length) continue;
    // on ne déshabille pas Pierre pour habiller Paul : on ne prend un
    // artisan que si le métier vacant est vital et le sien ne l'est pas
    const libres = candidats.filter(h => h.role === 'paysan' &&
      vivants.filter(a => a.role === 'paysan').length > 1);   // jamais le dernier paysan
    const pris = libres.length ? libres
               : (VITAUX.includes(r) ? candidats.filter(h => !VITAUX.includes(h.role)) : []);
    if (!pris.length) continue;
    // le plus âgé d'abord : c'est lui qui a vu faire le plus longtemps
    const qui = pris.reduce((a, b) => (a.age >= b.age ? a : b));
    const avant = qui.role;
    qui.role = r;
    qui.jourMetier = village.jour;
    qui.attache = null;
    village.arrive.reprises++;
    noter(`${qui.prenom} a repris ${NOM_ROLE[r]}. ${qui.feminin ? 'Elle' : 'Il'} avait vu faire.`,
          true, qui, 'village');
    souvenir(qui, `a laissé ${NOM_ROLE[avant]} pour reprendre ${NOM_ROLE[r]}`);
    return;                                                   // une reprise par jour
  }
}

function finDeJournee() {
  naissances();
  majExtinction();
  reprendreUnMetier();
  apprendre();
  majLignees();
  majRuines();
  majMetiers();
  // CELUI QU'ON NE VOIT JAMAIS. Chaque jour, un peu de soupçon se porte
  // sur qui n'est pas venu sur la place. Ce n'est pas une punition de
  // l'écart : c'est ce que fait un village.
  {
    const dehors = habitants.filter(h => h.vivant && h.role !== 'enfant' &&
      Math.hypot(h.x - PLACE.x, h.z - PLACE.z) > 22);
    for (const abs of dehors) for (const h of habitants) {
      if (!h.vivant || h === abs) continue;
      soupconner(h, abs, 0.006 * h.superstition);
    }
  }
  // L'HIVER SE CHAUFFE. Sans bois on ne meurt pas de froid, mais l'usure
  // monte — et l'usure décide de l'âge auquel on s'éteint.
  if (village.saison === 3) {
    const besoin = R.boisChauffe;
    if (village.bois >= besoin) village.bois -= besoin;
    else {
      village.bois = 0;
      for (const h of habitants) if (h.vivant) h.usure = Math.min(1, h.usure + 0.012);
      noter("On a manqué de bois cette nuit. Le froid est entré dans les maisons.", true);
    }
  }
  surnommer();
  // le temps qu'il fait : la plupart des jours sont secs, il pleut
  // franchement de temps en temps. Aucun effet mécanique — c'est là pour
  // que deux minutes de contemplation soient belles.
  // La pluie a changé de camp. Elle était du décor tant qu'elle ne
  // faisait que tomber ; depuis qu'elle éteint les torches et qu'elle
  // empêche le brouillard — donc qu'elle décide de qui est vu et de qui
  // a honte —, c'est un accident du monde. Le contrôle de détermination
  // l'a attrapé à la première exécution.
  village.pluie = aleaEvenements() < 0.26 ? 0.35 + aleaEvenements() * 0.65 : 0;
  if (village.pain < 1) noter('Il ne reste plus de pain au village.');

  if (village.volsCetteNuit > 1.2) {
    // le village sait qu'on l'a volé, mais pas par qui — et c'est
    // exactement ce qui nourrit le soupçon de travers
    noter("La huche était plus vide qu'elle n'aurait dû l'être.");
    // On regarde qui rôdait près du four. Parfois c'est le voleur —
    // le village a le droit de tomber juste.
    malheur(FOUR.x, FOUR.z, 0.22);
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
  majEtrangers();
  majChasseur();
  majVampire();

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
  village.arrive.foires++;
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
  village.arrive.dragons++;
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
  GRAINE, R, alea, aleaDeco, aleaEvenements, entre, parmi,
  village, habitants, chronique, nouveaux, evenements, regles,
  LIEUX, MOULINS, CHAMPS, CHAUMIERES, ATELIERS, GRANGE, FORET, AUBERGE,
  PLACE, EGLISE, MANOIR, FOUR, CABANE,
  RUISSEAU, ROUTE, BUTTE, POINT_PONT, LARGEUR_EAU, PROFONDEUR_EAU,
  hauteur, distRoute, distRuisseau, distPolyligne,
  avancer: simuler,
  poidsDes, choisirOccupation, lieuDe, tensionActuelle,
  nommer, nomComplet, souvenir, noter, lien, e, NOM_ROLE, ROLES, metierDe,
  ligneChronique: (ev) => `jour ${ev.jour} — ${ev.nu}`,
  detteDe, creancier, savoirsVivants, GENRES, LIGNEES,
  estNuit, estJour, lumiere,
  analyser, appliquerRegles, resoudre,
  lancerDragon, lancerFoire, surnommer,
};
}
