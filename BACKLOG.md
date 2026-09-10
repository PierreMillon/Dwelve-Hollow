# Dwelve Hollow — mémoire du projet

Journal des décisions, des idées à faire et des idées faites, dans
l'ordre où elles arrivent.

**Règle : on met à jour, on ne supprime jamais.** Une idée faite reste
tracée (marquée faite) ; une idée mise de côté reste tracée (marquée
« plus tard ») ; rien ne doit se perdre au fil de la discussion.

Même convention que le `BACKLOG.md` de Bastion Orbit et le `NOTES.md` de
Forge Line. Ce fichier est la mémoire du projet entre deux conversations —
il n'y a pas de mémoire automatique d'une session à l'autre, donc tout ce
qui n'est pas écrit ici est perdu.

**Statut au 2026-09-09 : rien de codé.** Conception seulement.

---

## Le concept

Un univers médiéval en **vie autonome**. On donne des règles à chaque
personnage et on regarde ce qui se passe. Jeu **contemplatif** : le
joueur observe plus qu'il n'agit.

Rendu voulu : **esprit terminal**, fond noir, tout dessiné en vert.

---

## Le nom — tranché

**Dwelve Hollow**, choisi par Pierre le 2026-09-09, dépôt créé dans la
foulée.

`Dwelve` n'existe pas en anglais standard : c'est un mot-valise entre
**dwell** (habiter, demeurer) et **delve** (fouiller, creuser) — soit
littéralement le jeu (des gens qui habitent, un joueur qui fouille ce
qu'ils font). Le mot inventé est un atout : il ne renvoie à rien
d'existant, le dépôt sera le seul résultat de recherche. `Hollow` (le
creux, le vallon) porte une inquiétude discrète sans forcer.

### La règle de nommage — source retrouvée et vérifiée

Point de départ donné par Pierre : le créateur de Dragon Quest aurait dit
qu'un bon nom de jeu, c'est deux mots — le premier commençant par un D, le
deuxième un peu mystérieux.

**Première vérification (2026-09-09) : échec, à tort.** J'avais cherché du
côté des interviews de Yuji Horii sur le choix du titre, sans rien trouver,
et j'en avais conclu que la règle n'était pas sourcée. Mauvais angle : la
règle n'est pas de Horii, il l'a reçue.

**Deuxième vérification, après que Pierre a transmis le passage d'une
vidéo : confirmée.** La règle vient du mangaka **Kazuo Koike** (Lone Wolf
and Cub, Lady Snowblood, Crying Freeman), qui a fondé en 1977 le
**Gekiga Sonjuku**, son école d'écriture. **Yuji Horii en est diplômé
(3ᵉ promotion.)** Horii a lui-même déclaré que le nom *Dragon Quest* vient
directement d'un enseignement de Koike : **un nom peut associer un mot
simple et un mot difficile** — d'où le très connu *Dragon* accolé au plus
rare mais compréhensible *Quest*.

Sources : [Yuji Horii — Dragon Quest Wiki](https://dragon-quest.org/wiki/Yuji_Horii),
[Kazuo Koike — Wikipedia](https://en.wikipedia.org/wiki/Kazuo_Koike).

**Deux points de la vidéo non corroborés** (rapportés par Pierre, pas
retrouvés dans une source écrite — probables mais non établis) : que la
première syllabe doive être forte, si possible celle du son **d** ; et que
les noms **anglais** attirent davantage. La vidéo elle-même n'a pas pu être
consultée depuis la session (YouTube est bloqué par la politique réseau de
l'environnement d'exécution — 403 sur le CONNECT, via le proxy comme via
yt-dlp, et les miroirs de transcription testés le sont aussi).

### Ce que la règle dit du nom choisi — point ouvert

La règle, dans sa formulation confirmée, va **mot connu d'abord, mot rare
ensuite** : *Dragon* puis *Quest*. Et le mot rare doit rester *compris* —
difficile, pas inexistant.

**Dwelve Hollow inverse les deux.** L'étrangeté est dans le premier mot, le
mot connu (*Hollow*) est en second, et *Dwelve* n'est pas un mot rare : il
n'existe pas du tout, donc il dépasse la limite posée par Koike.

Argument inverse, qui a du poids : la règle de Koike vise l'attention d'un
lecteur devant un présentoir, dans les années 70-80. Un mot inventé apporte
aujourd'hui autre chose que Koike ne pouvait pas anticiper — la propriété
totale du terme dans un moteur de recherche.

Candidats du même lot qui respectent la règle telle qu'énoncée :
**Dusk Vellum** (mot connu + mot rare mais compris, son d, oreille douce)
et **Dusk Vigil**. Le dépôt étant créé mais vide de code, sans déploiement
et sans lien nulle part, un renommage coûte quasiment rien maintenant et
coûtera cher plus tard. **Décision laissée à Pierre — rien n'est changé
tant qu'il n'a pas tranché.**

### Candidats écartés (gardés pour mémoire)

- **Dun Whisper** — 2ᵉ choix. Correction de « Dune Whisper » proposé par
  Pierre : un *dun* est un fort de terre celtique, donc même sonorité,
  sens médiéval, et surtout plus de collision avec Frank Herbert.
- **Dusk Willow** — 3ᵉ choix. Le plus joli, le moins spécifique.
- **District Mellow** (Pierre) — `District` est administratif et moderne,
  un mot de cadastre et pas de royaume ; `Mellow` appartient au
  vocabulaire des années 70.
- **Dolmen Vigil**, **Dun Vesper**, **Delve Hollow**, **Dusk Vellum**,
  **Drift Marrow** — premier tour de propositions, toutes trop
  cérémonieuses (voir juste en dessous).

### L'observation à ne pas perdre

Les trois deuxièmes mots proposés par Pierre étaient *whisper*, *hollow*,
*mellow*. **Aucun n'est menaçant.** Il ne cherche pas un mot sombre, il
cherche un mot doux et bas — cohérent avec un jeu contemplatif où l'on
regarde sans agir. Toute nomenclature future (lieux, personnages,
versions) devrait suivre cette oreille-là.

---

## Ce qui existe déjà dans les trois jeux précédents

Analyse du code, pas de la mémoire — lue dans `PierreMillon/knight-wars`,
`PierreMillon/Forge-Line` et `PierreMillon/Bastion-Orbit` le 2026-09-09.

### Knight Wars — IA de décision, au tour par tour

Dans `runAI()`. Chaque royaume évalue tous ses coups possibles et garde
le meilleur score :

- avantage brut = force de l'attaquant − force du défenseur ;
- bonus s'il achève un royaume déjà à terre (≤ 2 territoires) ;
- malus d'exposition : attaquer vide toujours le territoire de départ
  (force ramenée à 1, victoire ou défaite), donc on pénalise le fait de
  laisser un flanc nu face à un voisin fort.

Par-dessus, **quatre personnalités** qui ne changent que quatre nombres
(`aggressionDelta`, `mistakeDelta`, `exposureWeight`, `finishOffBonus`) :
les Prudents, les Enragés, les Marchands, les Stratèges. Même moteur,
comportements pourtant lisibles à l'œil en jouant.

Trois détails qui font la différence :

- **taux d'erreur volontaire** (`mistakeRate`) — l'IA renonce parfois au
  bon coup, sinon elle est inhumaine ;
- **plancher de viabilité** (`MIN_VIABLE_ADV = -1`) — jamais d'attaque
  mathématiquement perdue d'avance, garde-fou ajouté après un retour en
  jeu (« l'ennemi fait des attaques sûres de perdre, c'est absurde ») ;
- **attaques chaînées** — après une conquête, l'IA repart de ce
  territoire-là, comme le ferait un joueur.

Deux mécanismes de difficulté à retenir :

- un **cliquet d'escalade** (`escalated()`) sur les longues parties, dont
  la force est dosée par la difficulté — sinon tous les paliers
  convergeaient vers la même IA redoutable au bout de ~80 tours ;
- au palier le plus facile, les IA ne peuvent **structurellement jamais**
  attaquer l'humain, mais continuent de se battre entre elles : illusion
  de guerre entière plutôt que des IA visiblement gelées.

### Forge Line — IA d'essaim, temps réel

**Le plus proche de ce qu'on veut faire ici.** Le principe est écrit noir
sur blanc dans son `NOTES.md` : *éviter la froideur mécanique* — pas une
grosse IA d'un coup, mais plein de petites règles locales par ennemi qui
interagissent entre elles et font émerger des comportements de groupe non
programmés explicitement.

Ce qui tourne réellement (`spawnEnemy()`, `driftTowardPreferred()`,
`pickTargetTower()`, `pickSoldierBehavior()`, `updateSoldiers()`) :

- **mémoire collective statistique** — la carte découpée en 8 colonnes,
  chaque mort et chaque percée comptée ; les nouveaux ennemis tirent leur
  colonne préférée pondérée par ce qui a déjà réussi. Ce n'est pas un
  plan concerté, mais ça se lit comme une stratégie ;
- **imitation** — 30 % copient directement le dernier qui a atteint le
  château rapidement ;
- **engagement individuel** (`commitment`, entre 0 et 1) — les peu engagés
  retirent une nouvelle colonne préférée toutes les quelques secondes :
  l'illusion que certains changent d'avis en cours de route ;
- **oscillation de vitesse propre à chacun** (`pacePhase` / `paceRate`),
  désynchronisée — personne n'avance au même rythme, pas de tapis roulant ;
- **hésitation** au débarquement, et **attente en groupe** (`groupWait`)
  libérée d'un coup dès qu'assez de monde s'est rassemblé ;
- **siège abandonné** au bout d'un certain temps (`SIEGE_GIVEUP_MS`) ;
- **fuite pour se soigner**, une seule fois dans la vie du personnage ;
- **rôles tirés à la naissance** : attaquant, harceleur, rusher — la part
  de harceleurs dépend du `playerAggroScore`, un score qui monte à chaque
  coup porté par le joueur et redescend doucement ;
- **ciblage par faiblesse** — vise la tour la plus près de tomber à
  portée, pas la plus proche.

Et des **soldats alliés autonomes** : à intervalles réguliers, chacun
retire son comportement au sort — se battre, garder le joueur, se
planquer, se soigner, réparer — pondéré par son grade (les gradés sont
plus prudents) et ses points de vie.

### Bastion Orbit — la vie autonome

Le plus proche du projet côté **vie de village**.

Les villageois ont six modes (`peaceful`, `sheltering`, `sallying`,
`fighting`, `fleeing_church`, `fleeing_castle`). En temps de paix, trois
sous-états tirés au sort : ~10 % errent près de chez eux, ~10 %
**déménagent** dans une autre maison, le reste va **danser sur la place**.

À la première attaque : panique générale, tout le monde à l'abri, puis
mobilisation par lots de trois, **triés par distance à l'ennemi** — un
tiers partent se battre, les autres fuient vers l'église ou le château.

La princesse erre, se rapproche du seigneur dès cinq ennemis proches,
répare deux fois plus vite à deux, et sert d'appât prioritaire.

Le plus intéressant : les **engins de siège émergents**. Deux ennemis qui
stagnent au même endroit forment une tortue, trois une arbalète, quatre
un trébuchet, cinq une tour de siège. Personne ne l'a scripté — c'est le
regroupement qui le déclenche. L'équipage reste vivant et régénère la
machine, donc le tir à distance ne suffit jamais : il faut sortir.

Autre émergence non scriptée : ~40 % des ennemis prennent les routes
(plus rapides), les autres restent en tout-terrain. Résultat visible à
l'écran : de l'encerclement, sans une ligne de code d'encerclement.

Enfin, un **simulateur headless** (`sim/balance-sim.js`) avec trois
politiques de joueur (naïf, correct, bon), utilisé comme test de
régression (`--check`). Calé sur deux modèles publiés :

- le **canal de flow** (Csíkszentmihályi ; thèse *Flow in Games* de Jenova
  Chen) — le fun est l'équilibre entre défi et compétence ;
- la **difficulté en dents de scie**, reprise de l'AI Director de
  Left 4 Dead (Michael Booth, GDC 2009) — un pic ne se ressent comme un
  pic que s'il y a eu un vrai répit avant. Appliqué concrètement : une
  vague sur cinq a son effectif réduit de 30 %.

---

## ✅ Principes retenus (décidés, pas encore codés)

Décidés le 2026-09-09, tirés de l'analyse ci-dessus.

1. **Aucune IA centrale.** Des règles locales par personnage, et on
   regarde ce que ça donne. C'est déjà la doctrine écrite dans les
   carnets de Forge Line et de Bastion Orbit.
2. **Un état + une horloge de re-tirage.** Le motif commun aux soldats de
   Forge Line et aux villageois de Bastion Orbit : chaque personnage a un
   comportement courant et le retire au sort périodiquement, pondéré par
   sa situation.
3. **Des paramètres de personnalité, pas des branches de code.** Quatre ou
   cinq nombres par personnage, comme les quatre royaumes de Knight Wars.
4. **De la mémoire partagée.** Les colonnes de Forge Line montrent qu'un
   simple compteur suffit à faire croire à une stratégie de groupe.
5. **Des seuils de regroupement.** Le meilleur moment des trois jeux :
   deux paysans au même endroit deviennent autre chose. C'est là que naît
   ce qu'on n'a pas écrit.
6. **Un simulateur headless dès le début.** Dans un jeu contemplatif, on
   ne peut pas juger l'équilibre à l'œil — il faut pouvoir faire tourner
   mille années de village en trois secondes.

---

## 📋 À faire (demandé ou décidé, pas encore fait)

- **Prototype jouable en un seul fichier HTML** — même méthode que les
  trois autres jeux : discussion d'abord, prototype ensuite, production
  seulement si le concept plaît.
- **Palette terminal**, reprise telle quelle du style « Filaire pur
  (vert) » de Bastion Orbit (activé par défaut chez lui depuis sa v0.60)
  plutôt que réinventée : trait `#46ffa0`, texte `#8ffcc4`, fond des
  panneaux `#071812`, traits atténués `rgba(70,255,160,0.4)`.
- **Déploiement GitHub Pages** — reprendre le workflow
  `.github/workflows/deploy-pages.yml` de Bastion Orbit ou Forge Line.
- **Entrée au menu du site perso** (`PierreMillon/pierremillon`,
  `index.html`) une fois le jeu déployé — pas avant, pour ne pas mettre
  un lien mort dans le menu.
- **Concevoir les règles locales des villageois** — la première vraie
  décision de design à prendre. Rien n'est tranché : ni le nombre d'états,
  ni ce qui déclenche un regroupement, ni ce que le joueur peut faire.

## 💭 Idées à explorer plus tard (pas encore décidées)

- **Que fait le joueur, au juste ?** Le jeu est contemplatif, mais
  « contemplatif » ne veut pas dire « aucune action ». Bastion Orbit a
  résolu la question par la Sortie (rare, coûteuse, décisive). Piste à
  explorer : une action rare et lourde de conséquences plutôt qu'un flux
  d'actions continu.
- **Le temps.** Rien n'est décidé sur le rythme : temps réel lent,
  saisons, générations qui se succèdent. Un jeu de vie autonome vit ou
  meurt sur ce choix.
- **La trace écrite.** Un jeu où l'on observe gagne à laisser un journal
  de ce qui s'est passé (qui a déménagé, qui est mort, quel groupe s'est
  formé) — cohérent avec l'esprit terminal.

---

## Le passage à la 3D — recommandation faite, pas encore tranchée

Constat de Pierre (2026-09-09) : les trois jeux précédents sont en 2D avec
un moteur de volume maison (pavés isométriques, faces teintées en dur, tri
des calques par profondeur). Ça marche pour des boîtes, mais toute forme
non cubique coûte un chantier entier — le bateau, la tour, le pont en
arche, les escaliers de Bastion Orbit et Forge Line en témoignent. Le vrai
manque n'est pas le rendu : **il n'y a aucun format d'entrée**, donc rien
ne peut être dessiné ailleurs puis importé.

Demande : un moteur qui laisse la liberté d'écrire son propre jeu, mais
qui accepte de vrais modèles 3D faits par Pierre (Blender, SketchUp) ou
récupérés en ligne, dans un style minimaliste qu'il contrôle entièrement
— et que Claude puisse comprendre complètement les modèles.

**Recommandation (à valider par Pierre) :**

- **Moteur : Three.js.** Page web statique donc GitHub Pages continue de
  fonctionner ; charge les formats standards ; n'impose aucune structure
  (la boucle de jeu et les règles locales restent du code à nous) ; et
  c'est la bibliothèque 3D web la mieux documentée, donc la moins
  risquée à faire écrire par un modèle.
- **Séparer le mort du vivant** — c'est la décision structurante :
  - **décor** (bâtiments, terrain, ponts) modélisé par Pierre et exporté
    en **.obj**, un format texte où chaque sommet et chaque face tient sur
    une ligne lisible. Claude peut l'ouvrir, le vérifier, le corriger ;
    git en montre les différences ligne à ligne ; quelques kilo-octets par
    modèle en faible-polygone. Le .glb standard est binaire, donc opaque
    à la fois pour Claude et pour git — écarté pour cette raison.
  - **vivant** (villageois, animaux) **jamais modélisé** : généré par le
    code à partir de formes simples et animé par des règles. Aucun
    fichier, contrôle total, et cohérent avec le principe n°1 (une
    démarche qui est une formule, pas une animation enregistrée).
- **Blender plutôt que SketchUp**, pour deux raisons concrètes : l'export
  OBJ de SketchUp est réservé aux versions payantes (la version web
  gratuite n'exporte qu'en STL, qui perd groupes, noms et hiérarchie), et
  surtout Blender est **scriptable en Python** — Claude peut inspecter,
  vérifier, corriger ou générer des modèles par script. Repli possible si
  Blender bloque (Pierre a une formation d'architecture, la logique
  pousser-tirer de SketchUp lui est plus naturelle) : modéliser dans
  SketchUp, exporter en STL, convertir en OBJ propre par script — ça
  marche, c'est juste une étape de plus à chaque aller-retour.
- **Modèles gratuits réutilisables** si besoin : Kenney, Quaternius et
  Poly Haven publient en CC0 (domaine public, aucune attribution
  obligatoire, sans risque pour un dépôt public). Le style de Kenney
  correspond au minimalisme visé.
- **Piège de style à éviter** : l'option `wireframe` de Three.js dessine
  *tous* les triangles, diagonales comprises — un mur devient un grillage
  sale. Le rendu voulu s'obtient avec **EdgesGeometry**, qui ne trace que
  les arêtes vives (un cube = 12 traits, pas 18). C'est ça, le filaire
  vectoriel des vieilles bornes.

**Conséquence sur la structure du dépôt** : le jeu ne peut plus être un
seul fichier HTML. Il devient un dossier — la page, Three.js **copié dans
le dépôt** plutôt que chargé depuis un CDN (pas de dépendance externe,
fonctionne hors ligne, ne cassera pas dans deux ans), et un dossier de
modèles .obj versionnés. C'est une rupture assumée avec la méthode des
trois jeux précédents.

**Premier test proposé, avant tout engagement** (méthode « terrain
restreint » : le cas le plus simple, dix minutes, aucun objectif de
résultat) : Pierre modélise **une seule maison** dans Blender (un cube
poussé-tiré, toit à deux pentes) et l'exporte en OBJ ; Claude écrit la
page Three.js minimale qui la charge et la dessine en arêtes vertes sur
fond noir, caméra tournant lentement autour. Si ça se lit bien et tourne à
plein régime sur le téléphone de Pierre, la direction est validée. Sinon,
on l'aura su pour le prix d'un cube.

---

## Test 3D — fait, direction validée

Fait le 2026-09-09, après validation du principe par Pierre. Page en
ligne dans le dépôt (`index.html`), déployée par le même workflow Pages
que les autres jeux.

**Ce que le test a montré :**

- Un modèle écrit à la main (maison, 14 faces) et un **vrai export**
  fourni par Pierre (un banc, 4 280 faces, avec normales et UV, exporté
  en centimètres) s'affichent tous les deux correctement, sans aucune
  erreur console. Le banc reste parfaitement lisible en filaire vert :
  les lattes, les pieds en fonte et l'accoudoir courbe se lisent tous.
- **Plus de 50 images par seconde** en fenêtre de téléphone (390 × 844),
  sur un rendu logiciel sans accélération matérielle — donc large marge
  sur un vrai appareil.
- **Deux manques révélés par le vrai modèle**, corrigés dans la foulée :
  - *le cadrage caméra fixe* — un modèle en centimètres est 40 fois plus
    grand qu'un modèle en mètres, la caméra se retrouvait à l'intérieur.
    La caméra, ses plans de coupe et le pas de la grille sont maintenant
    calculés depuis la boîte englobante du modèle chargé ;
  - *le seuil d'angle des arêtes* — sur une forme courbe et dense, un
    seuil bas redessine chaque triangle. C'est LE réglage qui décide de
    la lisibilité, il méritait d'être exposé plutôt que figé.
- **Chiffres de la comparaison arêtes vives / filaire brut** (le piège
  signalé plus haut, désormais mesuré) : maison, 15 segments contre 23 ;
  banc, 2 766 contre 6 464 au même seuil de 1°, et 1 767 à 45°. La
  différence est nette et visible à l'écran.

**Caméra — isométrique verrouillée (v0.3, demandé par Pierre)**

Même principe que Bastion Orbit, et rien de plus : on **tourne** autour
d'un point fixe, on **zoome**, c'est tout. Ni déplacement latéral, ni
montée/descente de la caméra.

- **Projection orthographique**, pas perspective — c'est la demande
  « perspective sans point de fuite », et c'est le terme exact :
  projection parallèle. Deux cubes de même taille se dessinent
  identiques, qu'ils soient devant ou au fond. C'est ce qui donne
  l'impression de dé.
- **Angle repris de Bastion Orbit au degré près.** Son `project()`
  utilise cos(π/6)/sin(π/6), soit des arêtes de sol à 30° de
  l'horizontale : l'isométrie vraie. L'inclinaison de caméra
  correspondante est arccos(1/√3) = **54,7356°** depuis la verticale.
- **Tangage verrouillé** : `minPolarAngle` et `maxPolarAngle` sont mis à
  la même valeur, donc l'inclinaison ne peut pas bouger d'un degré,
  quoi que fasse le doigt.
- **Azimut libre** : la rotation autour de la place reste entière, comme
  le `rot` de Bastion Orbit. Conséquence normale, pas un défaut : les
  30° au sol ne se lisent qu'aux azimuts multiples de 90° décalés de 45°
  — entre les deux, les arêtes prennent d'autres angles. C'est déjà le
  cas dans Bastion Orbit (la projection reste isométrique, ce sont les
  arêtes du bâtiment qui tournent).
- **Zoom borné** de 0,6 à 12 (`camera.zoom`, la bonne poignée en
  orthographique — la distance ne change rien à la taille à l'écran en
  projection parallèle). Pincement à deux doigts sur mobile.

**Vérifié au navigateur, pas supposé** (et une première mesure fausse
corrigée en route — en coordonnées normalisées il faut repasser aux
pixels avant de mesurer un angle, sinon le rapport d'écran fausse le
résultat) :

| Mesure | Attendu | Obtenu |
|---|---|---|
| tangage | 54,7356° | 54,736°, inchangé après un glisser vertical |
| arêtes de sol à l'écran (azimut 45°) | 30° | **30,00°** sur les deux axes |
| taille d'un objet devant / au fond | identique | 58,969 / 58,969 |
| bornes de zoom | 0,6 / 12 | 0,6 / 12 |
| glisser horizontal | tourne | azimut 39,8° → −79,6° |

Mesures refaites en fenêtre de téléphone (390 × 844) : 30,00° et tailles
égales également — le cadre orthographique suit le rapport d'écran.

**Boucle de travail retenue** : Pierre exporte depuis Blender et **lâche
le fichier sur la page** (glisser-déposer, ou bouton « charger un .obj »).
Rien à committer pour essayer un modèle. Seuls les modèles retenus
entrent dans le dépôt.

**Provenance du banc — réglé** : Pierre a confirmé qu'il vient de
**Poly Haven**, donc CC0. Le modèle est entré dans le dépôt
(`models/banc.obj`) avec son crédit dans `models/CREDITS.md`, et un
bouton « modèle suivant » permet de passer d'un modèle versionné à
l'autre sans glisser de fichier. Règle maintenue pour la suite : dépôt
public, donc licence vérifiée avant d'ajouter un modèle — CC0 de
préférence (Poly Haven, Kenney, Quaternius).

---

## Interface et rendu des traits (v0.4 → v0.7)

### L'escalier sur les diagonales — diagnostiqué et corrigé

Signalé par Pierre sur une capture zoomée : toutes les droites ni
verticales ni horizontales montraient un escalier marqué.

**Mesuré avant de conclure.** L'antialiasing n'était pas éteint :
`getContextAttributes().antialias` vaut bien `true` et le contexte
rapporte **4 échantillons** MSAA. La cause est ailleurs, et elle tient en
deux faits qui se combinent :

1. **Un trait OpenGL fait toujours 1 pixel de large.** Les navigateurs
   ignorent `linewidth` sur `LineBasicMaterial` (limitation WebGL). Donc
   *chaque* pixel d'une diagonale est un pixel de bord : il n'y a aucun
   intérieur plein pour ancrer l'œil.
2. **4 échantillons ne donnent que 4 paliers de couverture** (25, 50, 75,
   100 %). Sur du vert saturé posé sur du noir pur, ces paliers se
   voient : mesurés à 64, 128, 192 et 255 exactement.

**Correction** : les traits sont désormais dessinés comme de la
**géométrie** (`LineSegments2` + `LineMaterial`, les « fat lines » de
Three.js) et non comme des lignes OpenGL. Un ruban de triangles, dont le
fondu est calculé au pixel dans le nuanceur. L'épaisseur devient
réglable par la même occasion — impossible autrement.

**Deuxième correction, contre mon premier choix** : j'avais activé
`alphaToCoverage`. Erreur, vérifiée aux pixels : cette option fait
repasser le fondu du nuanceur par les 4 échantillons du MSAA, donc elle
le **requantifie en 4 paliers** — exactement les marches qu'on
supprimait. En transparence classique, la rampe est continue. Mesuré sur
une même diagonale de toit :

| Réglage | Niveaux intermédiaires trouvés |
|---|---|
| trait 1 px + alphaToCoverage | 64, 128, 192 |
| trait 1,8 px + alphaToCoverage | 64, 128, 192 |
| trait 1,8 px + transparence | 64, **73, 81, 89, 104**, 128, **136, 144, 152**, 192 |

Retenu : trait de 1,8 px, `transparent: true`, `alphaToCoverage: false`.

### Coût mesuré, et pourquoi le chiffre n'est pas concluant

Sur le banc (2 766 segments), en rendu **logiciel** (SwiftShader, sans
carte graphique — c'est ce dont dispose l'environnement de test) :

| Rendu | images/s |
|---|---|
| lignes OpenGL 1 px (avant) | ~38 |
| trait épais 1,0 px | 14 |
| trait épais 1,8 px, transparent | 9 |
| trait épais 1,8 px, alphaToCoverage | 10 |
| trait épais 1,8 px, **opaque** | 9 |

**La transparence ne coûte rien** : opaque et transparent donnent le même
chiffre. Tout le coût vient de la géométrie du trait épais, dont la
surface à remplir croît avec l'épaisseur.

**À vérifier sur un vrai appareil avant d'en tirer une conclusion.** Un
rasteriseur logiciel paie le remplissage au prix fort ; sur un vrai GPU,
2 766 quadrilatères instanciés sont négligeables. Le chiffre ci-dessus
mesure le processeur de la machine de test, pas le téléphone de Pierre.
Si c'est lent sur son appareil, le bouton « trait » redescend à 1,0 px
(plus rapide, mais l'escalier revient).

### Interface

- **Numéro de version cliquable** en haut à droite, ouvrant l'historique
  des versions — même dispositif que Bastion Orbit et Forge Line. Tenu à
  jour à chaque changement, pour savoir d'un coup d'œil où on en est.
- **Coin haut-gauche réduit** au titre et à un bouton de menu (v0.6).
- **Menu** : curseurs de bruitages et de musique (aucun son branché pour
  l'instant, mais le réglage est déjà conservé en `localStorage` pour
  être bon le jour où le son arrive), et les informations de diagnostic
  qui encombraient l'écran (modèle, taille, faces, segments, images/s).
- **Bascule arêtes vives / filaire brut retirée** (v0.5) : la comparaison
  avait servi, elle est tranchée. Les arêtes vives sont le seul rendu,
  et le seuil d'angle reste le réglage qui compte.

---

## Le village (v0.8) — fait

Premier jeu réel, plus un banc d'essai. Le banc OBJ reste disponible dans
`test-3d.html` (lien en bas de page) : c'est toujours la boucle Blender.

### Le plan

Place centrale et son puits, église avec clocher et croix, manoir à deux
tours, boulangerie reconnaissable à sa cheminée, deux ateliers à auvent,
sept chaumières en arc, trois champs labourés, une route qui traverse du
nord aux champs — et **la cabane de la sorcière, seule, loin de tout**.
Cette distance n'est pas décorative : elle est la raison pour laquelle
c'est toujours elle qu'on accuse.

Tout est écrit comme des **listes d'arêtes** (`trait`, `boite`, `toit`),
pas comme des maillages convertis : chaque bâtiment se lit et se modifie
ligne par ligne, et c'est ce qui coûte le moins cher à dessiner.

### Les habitants

Seize : un seigneur, une dame, un prêtre, un boulanger, trois artisans,
une sorcière, huit paysans. Chacun a **cinq traits** (piété, courage,
cupidité, sociabilité, superstition) et **quatre besoins** qui montent
seuls (faim, fatigue, foi, peur), plus un soupçon.

**Aucune décision n'est écrite en dur.** À chaque re-tirage (toutes les
4 à 9 secondes), chaque occupation possible reçoit un poids calculé à
partir des besoins, des traits et de l'état du village ; on tire dedans.
Deux habitants aux traits différents ne font pas les mêmes choix dans la
même situation.

### Les règles qui font la complexité

- **Économie** : les paysans font du blé, le boulanger le change en pain,
  tout le monde en mange. Un seul boulanger — donc un seul point de
  rupture, volontairement.
- **La peur arrête le travail.** C'est la ligne qui porte tout le drame.
- **Le dragon ne tue personne.** Il tourne, il fait peur, il repart. Mais
  la peur vide le four, le four vide affame, et la faim cherche un
  coupable. Le dragon n'a pas besoin d'IA : il n'est qu'une valeur qui
  monte.
- **La rumeur se contamine** : deux villageois qui se croisent rapprochent
  leurs soupçons, pondéré par leur sociabilité. Personne ne « décide »
  d'une rumeur.
- **Seuil de regroupement** (le motif repris de Bastion Orbit) : quatre
  accusateurs convaincus au même endroit et la foule se forme, puis
  marche sur la cabane. Aucune ligne ne dit « faire une chasse aux
  sorcières » — ça arrive tout seul.
- **Le village se punit** : la sorcière partie, les fièvres ne se
  soignent plus.
- **La foire** tous les six jours : étals dressés, blé acheté, tout le
  monde sur la place — et donc le pire moment pour qu'un dragon passe.

### Équilibrage : quatre défauts trouvés en mesurant, pas en regardant

Le simulateur promis (principe n°6) n'existe pas encore, mais la page a
été instrumentée et relevée toutes les 2,5 s sur six journées simulées.

1. **Un boulanger ne nourrit pas seize personnes.** Mesuré : il ne tient
   le four qu'un quart du temps (le reste il dort, mange, puis accuse),
   soit 0,19 pain/s pour une demande de 0,29. Famine permanente dès le
   3ᵉ jour. Corrigé : une fournée sort beaucoup de pains d'un coup.
2. **La famine était un état absorbant.** Une fois la faim à 1, tout le
   monde passait son temps à chercher à manger — boulanger compris — et
   le village ne repartait jamais. Corrigé : un ventre vide devant une
   huche vide retourne travailler.
3. **La demande dépassait l'offre par construction** : un pain ne calmait
   que la moitié d'une faim. Corrigé, et c'est ce qui a fait respirer la
   courbe (faim moyenne entre 0,25 et 0,88 au lieu de rester collée à 1).
4. **Le soupçon était un cliquet** : il montait et ne redescendait
   jamais, laissant le village indéfiniment à une occasion près du
   bûcher. Corrigé : il retombe les jours calmes, donc il fait des
   vagues.

État mesuré après correction : blé et pain en cycles d'abondance et de
disette, famine possible mais qui se résorbe, soupçon en vagues, chasse
aux sorcières possible sans être systématique. Aucune erreur console,
41 images/s en fenêtre bureau et 58 en fenêtre de téléphone (rendu
logiciel).

### Réserve de conception, à traiter ensuite

**Une fois la sorcière partie, le village perd son moteur dramatique.**
Il reste l'économie et la faim, mais plus personne à accuser. Il manque
un deuxième acte : le prêtre qui gagne en autorité après chaque frayeur,
le seigneur qui lève l'impôt, un bouc émissaire qui tourne. À concevoir
avant d'ajouter quoi que ce soit d'autre — c'est plus important que
n'importe quel nouveau bâtiment.

---

## v0.9 — le deuxième acte, le relief, le volume

### Le volume (demandé : « qu'on ne voie pas les arêtes arrière »)

Chaque forme produit maintenant **deux** listes : ses arêtes (qu'on voit)
et ses triangles (qu'on ne voit pas). Les triangles sont peints en **noir**
et ne servent qu'à cacher ce qui passe derrière. Sans eux, l'avant et
l'arrière d'un bâtiment se superposaient et le dessin devenait un
enchevêtrement illisible. `polygonOffset` repousse les faces d'un cheveu
pour que les arêtes posées dessus ne clignotent pas.

**Trois plans de lecture**, ajoutés après coup en regardant le résultat :
tout au même vert et à la même intensité, le village redevenait un filet.
Le relief est à 16 % d'opacité, la route / le ruisseau / les sillons à
45 %, les bâtiments à 100 %.

### Le relief et l'eau

Le sol n'est plus un plan. Une **butte** au nord-est (c'est elle qui porte
le moulin à vent) et un **ruisseau** qui traverse toute la carte, creusé
dans le terrain par la même fonction de hauteur. Un **pont** est posé
automatiquement là où la route franchit l'eau — le point de croisement est
cherché le long du tracé, pas codé en dur.

**Rien ne se bâtit sur la route ni dans l'eau** : chaque emplacement est
tiré au sort puis rejeté s'il est trop près de l'une, de l'autre, ou d'un
bâtiment déjà posé.

### Les moulins (cassables et réparables)

Un **moulin à eau** sur le ruisseau, un **moulin à vent** sur la butte.
Ce sont eux qui changent le blé en farine : la chaîne devient
blé → farine → pain, et **le boulanger n'a plus rien sans eux**. Ils
s'usent en tournant, le dragon leur arrache une aile au passage, et le
charpentier ou le forgeron vont les remettre en marche. Leurs pièces
mobiles (roue à aubes, ailes) tournent tant que la meule tourne.

### Les métiers

Charpentier, tailleur de pierre, ébéniste, forgeron, voleur, colporteur,
en plus des rôles existants — dix-sept habitants. Chacun a maintenant un
**prénom accordé à son rôle** (le seigneur s'appelait Aliénor avant
correction). Le forgeron fait les outils, qui doublent le rendement des
moissons et s'usent ; l'ébéniste fait des meubles ; le tailleur embellit
l'église, ce qui renforce l'autorité du prêtre.

**Le voleur n'est pas seulement le voleur** : *n'importe quel* habitant
assez cupide vole la nuit si la huche est pleine. Le village constate au
matin qu'il manque du pain, sans jamais savoir qui — et c'est ce qui
nourrit le soupçon de travers.

**Sur le colporteur** : demandé « marchand juif colporteur ». Le métier
est là, la religion n'est pas codée comme attribut de personnage. Le
moteur central de ce jeu désigne « le plus différent » et le chasse ou le
brûle ; lui accrocher une appartenance réelle, ce serait faire produire
au jeu des pogroms en boucle. Ce qui rend le colporteur vulnérable dans
la simulation, c'est qu'il est **étranger au village** — mécaniquement
identique, historiquement juste.

### Le deuxième acte

La réserve notée en v0.8 est levée. Une fois la sorcière partie, trois
mécanismes prennent le relais, et aucun n'est scripté :

- **L'autorité du prêtre se nourrit de la peur.** Chaque prière faite
  dans l'effroi la fait monter ; il encaisse le crédit du départ du
  dragon, qu'il y soit pour quelque chose ou non. Au-delà d'un seuil, il
  lève la **dîme** — et ceux qui croient le moins le prennent mal.
- **L'impôt du seigneur** ne tombe pas quand il a faim, mais quand il
  voit les réserves pleines : c'est sa cupidité qui décide du taux. Avoir
  faim pendant que le grenier du manoir est plein est le seul endroit où
  la faim se change en **rancune**.
- **La révolte** est le pendant de l'accusation : même seuil de
  regroupement, mais elle ne cherche pas un faible, elle monte au manoir.
  Le seigneur brave sort seul sur le perron et ils redescendent ; le
  seigneur peureux rend le grain. Deux nombres qui s'opposent.
- **Le bouc émissaire.** Faute de sorcière, le village désigne le **moins
  sociable** — celui à qui personne ne parlait déjà. Si c'est le
  boulanger, le village se coupe le pain tout seul.
- **Le seigneur peut s'interposer** au moment du bûcher, s'il est brave
  ET sur place. L'autorité du prêtre en pâtit.
- **La succession** (idée de Pierre, et la meilleure) : une place vide à
  l'écart ne le reste jamais longtemps. Quelques jours après, une femme
  que son homme a laissée s'installe dans la cabane, et tout peut
  recommencer. C'est ce qui empêche l'histoire de s'arrêter au premier
  bûcher.

### La musique

Celle de Pierre, en boucle, branchée sur le curseur du menu. Le piège de
Forge Line est évité : le déblocage n'est pas à usage unique, on réessaie
à chaque geste tant que la lecture n'a pas démarré (sur un appareil réel,
le premier geste n'aboutit pas toujours et le son ne revient jamais).

### Défauts trouvés en mesurant

1. **Boucle infinie de révolte** : la foule se dispersait, mais personne
   ne changeait d'avis — donc elle se reformait à l'image suivante, en
   boucle, à la fréquence de rafraîchissement. Corrigé par un répit de
   deux jours et une remise à zéro du choix d'occupation.
2. **Le voleur avalait toute l'économie** : à 3 pains par seconde, il
   prenait à lui seul plus que le four ne produisait (185 pains produits,
   90 mangés, et la huche vide en permanence). Un vol doit se sentir, pas
   ruiner. Ramené à 0,35.
3. **La dîme et l'impôt tombaient chaque jour**, donc la rancune montait
   sans jamais pouvoir redescendre et se bloquait à 1 : tout le village
   passait ses journées à se révolter au lieu de travailler. Espacés,
   allégés, et la colère s'épuise trois fois plus vite.
4. **Les moulins cassaient avant le 7e jour** sans qu'aucun dragon ne
   soit passé. Usure divisée par trois.
5. **L'impôt ne pouvait jamais tomber** : il se déclenchait sur le blé,
   que les moulins vidaient plus vite que les paysans ne le
   remplissaient. Il se lève désormais sur blé + farine.
6. **Les lignes de sol coûtaient plus cher que tout le village réuni**
   (20 images/s au lieu de 41) — un trait épais coûte sa surface.
   Échantillonnage divisé par deux.

### Réserve honnête

Le pain reste rare : le boulanger est toujours un point de rupture unique
et la huche est souvent vide. C'est cohérent avec le récit, mais l'équilibre
n'est pas encore bon. **C'est exactement ce que le simulateur sans rendu du
principe n°6 servirait à régler** — instrumenter la page à la main atteint
sa limite. À faire avant d'ajouter d'autres mécaniques.

---

## v0.10 — l'occlusion réparée, le colporteur, la boucle, les vitesses

### Les faces ne cachaient rien (signalé par Pierre)

« Du filaire qui laisse apparaître les arêtes qui devraient être
cachées. » Constat juste. Le principe était bon, l'exécution non :
`quad()` et `tri()` ne garantissent aucun **sens de rotation** aux
triangles, et un moteur 3D élimine par défaut ceux qui tournent à
l'envers. La moitié des faces n'était donc jamais dessinée, et
l'occlusion était pleine de trous.

Vérifié avant de corriger : deux captures du même gros plan sur l'église,
l'une telle quelle, l'autre avec `side = DoubleSide` forcé à l'exécution.
La différence était sans appel. Corrigé en une ligne — plutôt que de
reprendre le sens de chaque triangle dans toutes les formes, le matériau
devient recto-verso et le sens n'a plus d'importance.

Coût mesuré : 25 → 18-20 images/s en rendu logiciel (sans élimination des
faces arrière il y a deux fois plus de pixels à peindre). Négligeable sur
un vrai GPU ; si ça devait gêner un jour, la vraie solution serait de
corriger le sens des triangles à la source.

### Le colporteur (précisé par Pierre)

Indépendant de la foire : il arrive quand il veut, reste deux à six
jours, repart de même. Il **loge à la cabane**, chez celle que le village
tient déjà à distance — les deux à l'écart se tiennent compagnie. Quand
il déballe, ceux qui l'écoutent ont un peu moins peur et deviennent un
peu plus sociables : il apporte des choses qu'on ne voit pas ailleurs.

Et **le village ne le désigne jamais** : il est exclu des candidats au
bouc émissaire. Seul, sans terre, sans menace, il intrigue plus qu'il
n'inquiète — c'est ce qui le sauve. Référence donnée par Pierre : le
personnage du début du *Château des Carpathes*, mystérieux et bienfaisant.

Mise en œuvre : le personnage est étiqueté « l'étranger » dans le code et
la chronique plutôt que par une appartenance religieuse. Le rôle décrit
par Pierre — bienveillant, porteur de merveilles, protégé — est rendu
entièrement ; seule l'étiquette reste neutre.

### La boucle musicale (signalée par Pierre)

Un élément `<audio loop>` rouvre son flux à chaque tour et laisse un
blanc. Pire : un MP3 porte du **silence d'encodage** aux deux bouts (le
codec travaille par blocs et complète le dernier), donc même une boucle
parfaite l'entendrait.

Corrigé en Web Audio : le fichier est décodé une fois en mémoire et la
boucle est calée à l'échantillon près sur le premier et le dernier son
réels. Le curseur du menu pilote un gain, plus le volume d'un élément.

**Un défaut trouvé en mesurant, sur ma propre correction** : au premier
essai, un seuil de silence de 0,0025 prenait la fin du fondu pour du vide
et coupait **3,5 secondes** de musique sur 20,9. Seuil abaissé à 0,0004 et
rognage plafonné à un tiers de seconde par côté — la boucle ne perd plus
que 0,37 s, exactement le silence du codec.

### Les vitesses ×1 / ×10 / ×100 (demandées par Pierre)

Deux corrections étaient nécessaires avant de pouvoir monter aussi haut,
et aucune des deux ne se voyait à ×3 :

1. **L'horloge des décisions battait en temps réel** (`performance.now()`).
   À ×100, un villageois aurait gardé la même occupation pendant cent fois
   plus de temps simulé et traversé la carte entre deux choix. Elle bat
   désormais au temps du village (`village.temps`), donc le comportement
   est identique à toutes les vitesses.
2. **Le pas de simulation est découpé en tranches fixes** de 0,2 s. Sans
   ça, une seule image avancerait de plusieurs secondes d'un coup : les
   villageois traverseraient les murs et les seuils de rassemblement
   seraient sautés. Un plafond de 6 s par image évite qu'un onglet remis
   au premier plan ne rattrape une semaine d'un coup.

Vérifié : 12 s réelles donnent 12 / 120 / 1126 secondes simulées aux trois
vitesses, personne ne sort de la carte, aucune erreur, et la chronique
continue de produire des événements cohérents (succession, départ du
colporteur, dîme, dragon) à ×100.

---

## v0.11 → v0.13 — la lisibilité, les liens, les règles écrites

Répond à la question « comment donner envie de regarder ». Le diagnostic
posé avant de coder : un jeu contemplatif tient à trois choses —
**comprendre** ce qu'on voit, **anticiper** ce qui vient, **s'attacher** à
quelqu'un. Le village n'avait que la troisième, et par accident.

### La fiche (le plus gros manque)

On clique sur un habitant, un panneau le suit : nom, métier, occupation,
besoins en barres, liens, souvenirs — et surtout **les quatre poids les
plus forts de son tirage avec leur raison en clair** (« prier 2.84 ·
piété 0.74 × (foi 0.31 + peur 0.81) »). Chaque poids porte désormais son
explication ; c'est ce qui fait passer d'un aquarium à une machine dont
on lit les rouages. Cliquer une ligne de la chronique désigne la personne
concernée : le texte et l'image se répondent.

### Mémoire, liens, chagrin

Chaque habitant garde ce qu'il a fait et ce qu'on lui a fait. Deux
personnes qui se croisent souvent se rapprochent ; certaines se
promettent l'une à l'autre. **On n'accuse pas quelqu'un qu'on aime** — la
foule s'exclut d'elle-même de ceux qui tiennent à la victime, sans
qu'aucune règle ne dise « épargner ses amis ». Et chasser quelqu'un coûte
enfin : ceux qui l'aimaient encaissent chagrin et rancune, ce qui fabrique
les colères de la semaine suivante.

**L'amour qu'on ne dit pas** (idée de Pierre) : à force d'être soigné par
la sorcière quand personne d'autre ne vous parle, on s'attache. Ça ne se
déclare jamais — seule la fiche le révèle, le village l'ignore et elle
aussi. Le jour où on vient la chercher, ceux-là pleurent sans pouvoir
dire pourquoi. Cette règle répare au passage un constat mesuré : personne
ne pleurait jamais la sorcière, parce qu'elle vit trop loin pour qu'on
s'attache par simple voisinage.

### Le metteur en scène

Le dragon ne tombe plus sur un dé chaque jour. Une **tension** est
calculée (peur, faim, rancune, moulins cassés, disette, foule en cours)
et pilotée : au-dessus de 0,6 on laisse respirer, en dessous la
probabilité monte avec la durée du calme. Le modèle est celui déjà cité
dans ce carnet — l'AI Director de Left 4 Dead : un pic ne se ressent
comme un pic que s'il y a eu un vrai répit avant.

### Les règles écrites (demandé par Pierre)

Une boîte de saisie en bas de l'écran. On écrit **qui · fait quoi · à
qui** — « Jehan aime Perrine », « le forgeron suit le seigneur », « tous
craignent la cabane », ou la forme fléchée « Jehan > deteste > Perrine ».
Verbes : aime, déteste, suit, évite, craint. Les sujets et objets se
résolvent en prénom, métier, lieu, ou « tous ».

**Une règle n'est pas un scénario** : elle entre dans le tirage de la
personne au même titre que sa faim, et le reste suit. « Aime » ouvre une
occupation *courtiser* avec son arc complet — on s'approche, on tente, et
ça aboutit à des fiançailles ou ça s'éteint : quelques pas ensemble, une
rebuffade, l'autre en aime déjà un autre, et au bout de quelques échecs
la personne cesse d'espérer. « Déteste » défait le lien et pèse sur
l'accusation. Les règles actives sont listées dans le menu, retirables.

### Les noms (demandé par Pierre)

Prénom accordé au genre, désambiguïsation par le métier en cas
d'homonymie, et surtout des **surnoms gagnés** : la hargneuse,
l'éconduit, la main leste, aux mains d'or, le dévot, le taciturne,
l'avare, outre à vin, le douloureux, le brûlant. Le village met un moment
à s'y mettre, et la chronique le note : « On a commencé à l'appeler outre
à vin. C'était Guillaume. »

### Le dragon est l'avion de Fly or Die

Modèle repris tel quel de `PierreMillon/fly-or-die` (374 sommets, 764
triangles), arêtes vives extraites au même seuil de 20°, mis à l'échelle
du village. Anachronique et assumé : c'est une ombre qui passe sur les
toits, le village n'a pas de mot pour ça, et la seule chose qui compte
mécaniquement est la peur qu'elle laisse derrière.

### Autres demandes de la même nuit

- **Journal plein écran**, par-dessus le village, avec un bouton pour le
  couper — on lit l'histoire pendant qu'on regarde la ville.
- **Boutons foire et dragon retirés** : ce n'est pas au joueur de décider
  quand ça arrive.
- **Vitesses ×1 / ×10 / ×100**, avec l'horloge des décisions passée en
  temps simulé et le pas découpé en tranches fixes.

### Défauts trouvés en mesurant

1. **Des maisons dans le ruisseau et sur le chemin.** La recherche
   d'emplacement abandonnait après 300 essais et posait le bâtiment au
   point de départ **sans le vérifier**. Élargissement progressif puis
   repoussée par gradient. Vérifié : 20 bâtiments, aucun hors règles.
2. **`dt is not defined`** : un compteur inséré au mauvais endroit — la
   première occurrence de `case 'moissonner'` est dans `lieuDe()`, qui
   n'a pas de `dt`, pas dans `agir()`.
3. **Le flirt était incohérent** : il alternait « en aime un autre » et
   « ont fait quelques pas », trois fois par jour, sans jamais aboutir.
   Réécrit avec un arc qui se termine.
4. **Les surnoms tombaient sur tout le monde** : treize sur dix-sept en
   trente-quatre jours, dont six « le dévot », parce que les seuils
   étaient absolus et que le compteur de prières monte pour tous. Les
   scores sont devenus **relatifs à la moyenne du village** — il faut
   faire nettement plus que les autres — et un seul surnom est attribué
   par jour, au cas le plus marquant.

### Ce qui reste faux, et ce qui n'est pas fait

- **Le pain est toujours trop rare.** « Il ne reste plus de pain » revient
  presque chaque jour au-delà du jour 40. Le boulanger reste un point de
  rupture unique. C'est le problème que le simulateur sans rendu doit
  régler.
- **Les surnoms se regroupent encore** sur « l'avare » (4 cas sur 5 dans
  la dernière mesure). Le score relatif a beaucoup amélioré la chose sans
  la résoudre.
- **Pas fait** de ma propre liste de recommandations : les états visibles
  dans le monde (fumée à la cheminée quand le four est allumé, torches la
  nuit, pluie, brouillard sur le ruisseau), les bruitages synthétisés, et
  le simulateur sans rendu. Le simulateur reste le prochain chantier —
  sans lui, chaque nouvelle mécanique rend l'équilibre plus fragile, et
  cette nuit l'a montré quatre fois.

---

## La boucle musicale — l'instrument commun (boucle.html)

Trois tentatives de correction ratées d'affilée, et la bonne leçon au
bout : **je n'entends pas la musique, et mes mesures ne tranchent pas.**

### Ce qui a été mesuré

- Le morceau s'arrête à **15,52 s** alors que le fichier en fait
  **20,87** : il y a **5,35 s de silence pur** à la fin. Le garde-fou
  écrit en v0.10 (ne jamais rogner plus d'un tiers de seconde, pour
  protéger un éventuel fondu) a laissé ce silence entier dans la boucle.
  C'est le trou que Pierre entendait.
- Quatre analyses ont été tentées pour retrouver la grille rythmique,
  **aucune concluante** : auto-corrélation du flux spectral (0,325 s puis
  0,226 s selon la méthode — incohérent), auto-similarité spectrale (pas
  de pic net, une décroissance douce), corrélation de forme d'onde brute
  (0,14 à 0,19, trop sensible à la phase), détection d'attaques (23
  événements très mal répartis, un trou de 3,8 s).
- Trois candidats rendus et envoyés à l'écoute : tous refusés, « ça laisse
  trop de temps et ce n'est pas régulier ».

### La solution : arrêter de deviner

`boucle.html` — une page où Pierre cale la boucle à l'oreille et qui
rend les chiffres exacts. Même esprit que le banc d'essai OBJ : quand je
ne peux pas juger, je construis l'outil qui lui permet de juger.

- **forme d'onde** dessinée depuis le fichier décodé : le silence de la
  fin se voit d'un coup d'œil ;
- **clic** pour poser le début, **clic droit** pour la fin ;
- **écoute en boucle réelle** (Web Audio, `loopStart`/`loopEnd`), plus un
  mode « couture seule » qui ne joue que les deux secondes autour de la
  jointure et la fait revenir toutes les quatre secondes — le seul
  endroit qui compte ;
- **calage sur la grille** : on tape son tempo et son nombre de noires,
  la fin se pose exactement à `début + noires × 60 / tempo`. C'est la
  voie la plus juste quand on connaît le tempo du morceau ;
- **taper le tempo** pour le retrouver quand on ne l'a plus ;
- un bloc **à recopier** : début et fin en secondes ET en échantillons.

Vérifié au navigateur : décodage, tracé, calage (120 bpm × 16 noires
donne exactement 8,000 s), pose au clic, tempo tapé, aucune erreur.

**Le métronome, sans toucher au fichier.** Objection de Pierre : « si je
voulais mettre un métronome, j'en aurais mis un, et après tu ne pourrais
plus l'enlever. » Juste — donc le clic est fabriqué à la volée pendant la
lecture, jamais mélangé au morceau : un bouton l'allume, un bouton
l'éteint, le MP3 d'origine ne bouge pas d'un échantillon. Premier temps
de chaque mesure plus aigu. S'il tombe sur les notes, le tempo est le bon
et le calage sur la grille sera juste.

**Rien n'a été changé dans le jeu** tant que Pierre n'a pas tranché.

---

## Le simulateur sans rendu — fait (principe n°6)

Le chantier promis depuis le premier jour, et devenu bloquant : quatre
défauts d'équilibrage trouvés à la main en une nuit, un par passe, en
instrumentant la page et en la regardant tourner à ×100.

### La séparation

`sim/monde.mjs` — **la simulation, et rien d'autre.** Aucune ligne de
rendu, aucun appel au DOM, aucune dépendance à three.js. `creerMonde(graine)`
rend un monde indépendant : on peut en faire tourner plusieurs dans le même
processus.

`index.html` ne fait plus que dessiner ce que le monde raconte. La
frontière passe par les positions : un lieu retient désormais le **nom**
de sa forme (`'eglise'`, `'chaumiere'`) et c'est la page qui va chercher
la géométrie. Les arrivées (succession à la cabane, colporteur) passent
par une file que le rendu vient vider, au lieu d'appeler directement une
fonction de rendu.

Résultat : 1 300 lignes de simulation d'un côté, 1 120 de rendu et
d'interface de l'autre.

### Ce que ça donne

`sim/equilibre.mjs` fait vivre **environ 150 années de village par
seconde**. La page à ×100 en faisait une par seconde. C'est un facteur
d'à peu près 150 sur le temps de mesure, et surtout : le résultat est
reproductible et chiffré au lieu d'être regardé.

    node sim/equilibre.mjs              un aperçu
    node sim/equilibre.mjs --detail     le journal du premier village
    node sim/equilibre.mjs --check      non-régression, code de sortie

`sim/balayage.mjs` essaie des combinaisons de constantes et dit
lesquelles tiennent les cibles.

### Ce qu'il a trouvé en dix minutes

**Sur lui-même d'abord** : la première version mesurait une fois par
journée, à heure fixe. La peur retombe en quarante secondes — le relevé
la ratait complètement et affichait 0,00 alors qu'un dragon venait de
passer. Corrigé : une mesure par minute simulée.

**Le pain.** 18 combinaisons × 6 villages × 45 jours en 31 secondes.
Avant : le village manquait de pain 77 % des journées et connaissait la
famine une journée sur deux. Retenu au balayage : `painParSeconde` 5,0,
`painParRepas` 1,0, `faimParSeconde` 0,007.

**Les moulins, qui étaient la vraie cause.** Le premier `--check` à 80
jours a montré ce que le balayage à 45 jours cachait : moulins cassés
41 % du temps, donc pas de farine, donc pas de pain. Second balayage sur
l'usure, la réparation et les dégâts du dragon. Retenu : usure divisée
par trois, réparation presque doublée, et **les dégâts du dragon
inchangés** — casser les moulins est sa seule violence et toute la chaîne
du drame en dépend.

État final, 24 villages × 80 jours, toutes cibles tenues :

| | avant | après |
|---|---|---|
| journées sans pain | 77 % | **34 %** |
| journées de famine | 50 % | **15 %** |
| faim moyenne | 0,78 | **0,52** |
| journées moulin cassé | 41 % | **29 %** |

Une cible a été **déplacée** en connaissance de cause : les moulins
cassés passent de 25 % à 32 %. Un moulin en panne un quart du temps n'est
pas un défaut, c'est le dessein — la cible doit dire « ils sont réparés »,
pas « ils ne cassent jamais ».

### Règle pour la suite

Toute constante qui touche à la nourriture, à la peur, au soupçon ou à
l'usure relance `node sim/equilibre.mjs --check` avant d'être poussée.

### Réserve

Le rendu tourne à 11 images/s au repos en rendu **logiciel** (1100 × 760),
contre des relevés de 15 à 17 la veille. Les conditions exactes de ces
mesures-là ne sont pas reproductibles, donc **aucune régression n'est
établie ni écartée** — à revérifier sur un vrai appareil, où toute la
scène ne fait de toute façon que ~1 100 segments.

---

## Le monde qui se voit, et les bruitages (v0.14)

Les deux derniers points de la liste de recommandations, faits.

### Ce qui se lit sur la carte

Le principe : **tout ce qui compte doit se voir dans le monde, pas
seulement dans le journal.**

- **La cheminée ne fume que quand le four est allumé.** D'un coup d'œil,
  on sait si le village mange. Le monde expose un simple drapeau
  `village.fourChauffe`, remis à faux à chaque pas et relevé par le
  boulanger quand il est au four.
- **Les torches** s'allument au-dessus de qui est encore dehors la nuit.
  Vérifié : treize sur dix-sept une nuit donnée.
- **La pluie**, tirée chaque matin, un jour sur quatre environ. Aucun
  effet mécanique — elle est là pour que deux minutes de contemplation
  soient belles.

### Les bruitages

Synthétisés à la volée, aucun fichier, comme Forge Line. Une cloche à
trois partiels avec une longue traîne quand le prêtre officie, un marteau
sec sur une meule qu'on répare, une rumeur qui enfle quand une foule se
forme, un grondement grave quand le dragon passe.

**Le monde ne joue aucun son.** Il pose un événement dans une file
(`signaler()`), et le rendu vient la vider. C'est ce qui lui permet de
tourner en silence dans Node — et à un bruitage de ne jamais pouvoir
changer l'histoire.

Mesuré sur 40 jours : 81 coups de marteau, 68 cloches, 6 foires, 6
passages de dragon, 2 rumeurs de foule.

### Le défaut le plus instructif de la journée

Ajouter les `signaler()` a **fait échouer deux cibles de non-régression
d'un coup**. Ils ne changeaient pourtant rien à la logique — mais chaque
appel à `alea()` consomme le flux, et déplace donc TOUTES les décisions
suivantes. Le village n'était pas devenu pire : il était devenu un autre
village.

D'où une règle qui vaut pour la suite : **un second générateur est
réservé à ce qui ne décide de rien** (déclencher un son, faire tomber la
pluie). Le décor ne doit jamais pouvoir changer l'histoire. Après
séparation, les chiffres sont redevenus identiques au centième près —
33,65 % de journées sans pain, exactement comme avant.

Sans le simulateur écrit une heure plus tôt, ce défaut serait passé
inaperçu et aurait invalidé tout l'équilibrage sans que personne ne le
sache.

### Deux défauts de mesure, pas de code

- Les torches lues comme « zéro » : le test lisait la valeur avant qu'une
  seule image ait été rendue.
- La file d'événements lue comme vide : elle l'est par construction, la
  boucle la vide à chaque image. Vérifié côté Node à la place.

---

## Le monde sans dé (v0.15)

Demandé par Pierre après sa question : « c'est grâce à la fonction random
non ? On pourrait faire un monde vivant génératif sans aléatoire ? » —
puis, après réflexion : « Ok pour ta recommandation sur le hasard. »

### Les trois étages du hasard

Le hasard n'est pas supprimé : il est rangé. Trois générateurs séparés,
et une règle par étage.

1. **La fabrique.** `alea` — le relief, les places, les prénoms, les
   tempéraments, les penchants, les cadences. Il ne tourne qu'au moment
   où l'on fabrique quelque chose, y compris en cours de partie quand une
   nouvelle sorcière s'installe.
2. **Les décisions.** Aucun tirage. Plus une seule fois, nulle part.
3. **Les accidents du monde.** `aleaEvenements` — le dragon qui vient, la
   femme qui reprend la cabane, le colporteur qui passe. Et
   `aleaDeco` — la pluie, les étals, les bruitages, qui ne décident de
   rien.

Le corollaire important : l'angle d'arrivée du dragon a quitté `aleaDeco`
pour `aleaEvenements`, parce qu'il décide de **qui il effraie le
premier**. Ce n'était pas du décor. Le test de détermination l'a
attrapé — voir plus bas.

### Ce qui remplace le dé

**Le maximum, pas le tirage.** `choisirOccupation` prend l'occupation qui
pèse le plus lourd, point. La fiche affiche donc désormais le classement
qui a réellement décidé, et sa première ligne est la décision — le
libellé du panneau le dit.

**Le penchant.** Chacun lit les vingt et une occupations avec un
coefficient qui lui est propre, entre 0,72 et 1,28, fixé à sa naissance.
C'est ce qui fait que deux paysans dans la même situation ne tranchent
pas pareil.

**La cadence.** Chacun revient sur sa décision toutes les 4 à 9 secondes,
son chiffre à lui, et la peur presse tout le monde. Avant, l'intervalle
était retiré au sort à chaque fois — un tirage par décision et par
habitant.

**La lassitude.** C'est la pièce maîtresse, et elle a été trouvée par la
mesure, pas par le raisonnement. Ce qu'on vient de faire perd du poids,
ce qu'on délaisse en regagne. Sans elle, un homme moissonnerait du lever
au coucher sans jamais passer à l'église.

**Les lieux.** Plus de `parmi()` : chacun a son champ, son établi, son
coin de place, par une fonction du rang et du jour. Et deux choix sont
devenus des raisons — on mange dehors si l'on aime la compagnie, on vole
là où il y a à prendre.

**La cour.** Elle ne se joue plus à pile ou face. Chaque femme a une
exigence fixée une fois pour toutes ; chaque rebuffade l'entame un peu,
mais elle le lasse plus vite qu'il ne l'use. C'est pourquoi la plupart
des cours s'éteignent et que certaines aboutissent.

**Le moulin.** La secousse du dragon s'accumule sous lui et lâche d'un
coup, au lieu d'un dé par image. Chaque moulin a sa fragilité, et les
deux ne lâchent pas ensemble parce qu'ils ne sont pas au même endroit de
son cercle.

### La faute que ce chantier a révélée, et qui aurait pu coûter cher

Premier essai, sans la lassitude : **les sept cibles de non-régression
tenaient toutes**, et mieux qu'avant — le pain manquait 1 % du temps au
lieu de 34 %, la famine tombait à 0,35 %.

Et le village était mort. Zéro bûcher, zéro révolte, zéro succession,
zéro surnom sur mille journées. Les gens mangeaient, dormaient et
travaillaient, sans plus jamais rien tenter.

**On ne mesurait que le pain.** Le contrôle disait « en bonne santé »
d'un village devenu muet. Trois cibles ont été ajoutées — bûchers,
révoltes, surnoms — et le balayage les mesure aussi. La règle qui en
sort : *ce qu'on ne mesure pas, on le perd sans s'en apercevoir.*

### Le réglage, par balayage

Douze combinaisons puis huit, sur 6 villages × 120 jours. Un seul levier
décisif : `degatDragon`. En dessous de 0,07 les moulins ne cassent
presque plus (6 % du temps), au-dessus de 0,08 ils cassent trop. Retenu :
**0,078**, avec `poidsAccuser` porté de 3,5 à **6** — c'est la valeur qui
rend le plus de bûchers.

### Ce que ça donne, mesuré côte à côte

24 villages × 80 jours, mêmes graines, avant et après.

| | avec le dé | sans le dé |
|---|---|---|
| journées sans pain | 33,6 % | 26,4 % |
| journées de famine | 14,6 % | 10,0 % |
| faim moyenne | 0,52 | 0,39 |
| journées moulin cassé | 29,1 % | 23,0 % |
| tension moyenne | 0,38 | 0,28 |
| bûchers par village | 0,63 | 0,25 |
| révoltes par village | 1,21 | 3,08 |
| surnoms gagnés | 6,50 | 6,29 |
| habitants en vie | 17,42 | 17,54 |

Et la répartition des conduites sur 60 jours est **la même à un point
près** : dormir 33/36 %, prier 24/23 %, manger 15/22 %, flâner 12/7 %.
Le répertoire moyen par habitant est identique (6,1 conduites
différentes), et son minimum s'améliore : 1 avec le dé, 3 sans. Le
village le plus pauvre en conduites est moins pauvre qu'avant.

Dix-neuf des vingt et une occupations apparaissent encore.

### Le garde-fou

`node sim/equilibre.mjs --check` vérifie maintenant, en plus des dix
cibles, deux propriétés :

- **même graine, même chronique**, mot pour mot ;
- **le décor ne change pas l'histoire** — on ajoute trois tirages de
  décor par pas de simulation, la chronique doit être identique.

C'est le test qu'il aurait fallu avoir hier, quand ajouter un bruitage a
déplacé toutes les décisions du village. Il tourne aussi seul :
`node sim/equilibre.mjs --determinisme`.

### La prière à 23 % — tranché, c'est voulu

Mesuré : chacun prie 23 % de son temps et travaille beaucoup moins. Ce
n'était pas une conséquence du passage sans dé — la mesure de référence
donne 23,7 %. Signalé à Pierre comme un déséquilibre possible ; **sa
réponse est que c'est voulu**. Un village médiéval qui prie beaucoup ne
le choque pas, et l'économie tient de toute façon.

Ce n'est donc plus une réserve. C'est un parti pris, et il est écrit ici
pour qu'on ne le « corrige » pas par mégarde dans six mois.

---

## La nuit des torches, et les surnoms qui se distinguent (v0.16)

Deux décisions prises par Pierre sur planche et sur quiz.

### La lumière : solution C, plus le halo de A

Une planche de comparaison lui a été remise, avec les deux rendus côte à
côte et en direct : à gauche un halo dessiné, à droite la lumière
calculée par sommet. Son choix : **C pour le monde, le halo de A gardé
pour la flamme elle-même.** Les deux ne s'excluaient pas.

**Ce qui a été greffé.** Le nuanceur du matériau de lignes épaisses reçoit
six feux (`vec4` : la position et l'ardeur), et chaque sommet calcule sa
clarté par une atténuation en 1 / (1 + d² / portée²). Le bout de ruban
sait de quel côté du segment il est — le nuanceur d'origine s'en sert
déjà pour choisir `instanceStart` ou `instanceEnd` — donc une arête peut
être claire d'un bout et sombre de l'autre.

**Propriété tenue.** Quand aucun feu ne brûle, toutes les ardeurs valent
zéro, la somme vaut zéro, et le rendu est au pixel près celui d'avant. Le
jour n'a pas bougé.

**Ce que ça a donné, en plus des torches.** Le four allumé éclaire sa
façade — il chauffait déjà et fumait déjà, il se voit maintenant de trois
façons. Et la flaque au sol n'est pas un objet posé : c'est la grille du
sol qui s'allume, donc elle épouse le talus.

**La nuit descend plus bas** : le décor passe de 0,42 à 0,34 d'opacité
nocturne. C'est le pendant nécessaire — une lumière n'éclaire que s'il y
a de l'obscurité autour.

**Le tremblement** vient de trois sinusoïdes de fréquences non multiples.
Il ne se répète pas à l'œil, il est identique d'une partie à l'autre, et
il ne consomme aucun tirage. Une flamme qui vacille ne peut donc pas
déplacer l'histoire du village — c'est la règle de la v0.15 appliquée.

**Une passe de correction après capture.** Le halo à trois anneaux se
lisait comme un marqueur d'interface, neuf cibles identiques posées sur
la carte. Ramené à deux anneaux plus discrets, et la portée élargie de
6,5 à 7,6 m pour que la flaque au sol s'étale.

### Les surnoms : les deux corrections

La réserve tenue depuis la v0.13 est levée. Quatre surnoms sur cinq
étaient « l'avare ».

**Deux causes indépendantes, deux corrections.**

1. Les compteurs n'avaient pas la même échelle. Les prières montent pour
   tout le monde, les vols sont rares : comparer chacun à la moyenne de
   son propre compteur ne les met pas sur le même pied. Chaque score est
   désormais un nombre d'écarts-types au-dessus des autres. Dans un
   village de dix-sept, une conduite que personne d'autre n'a vaut quatre
   écarts ; à trois personnes, deux. Le seuil dit donc en clair : « pas
   plus de deux ou trois à le faire ».
2. Un même surnom pouvait être porté par plusieurs personnes, ce qui le
   vide de son sens. Il est maintenant unique dans le village.

**Mesuré sur 10 villages × 120 jours.** Avant : 4 « avare » sur 5. Après :
43 surnoms, dont 11 « avare », 10 « le dévot », 10 « aux mains d'or »,
6 « le hargneux », 4 « la main leste », et deux surnoms rares. Sept
libellés différents au lieu d'un.

Il y en a moins qu'avant — 3,6 par village contre 6,3 — et c'est voulu :
un surnom qui se donne à tout le monde ne distingue personne.

---

## Les six feux, et les torches qui s'éteignent (v0.16, suite)

Retours de Pierre en direct, dans l'ordre où ils sont arrivés : « faut des
lumières aussi dans certains bâtiments avec la lumière qui sort par les
fenêtres », « y a trop de lumière dans la rue », « prévois des feux de
campagne et le bûcher en lumière aussi et la messe très éclairée depuis
l'intérieur », « des fois des gens qui marchent la nuit avec une torche »,
« qui peut s'éteindre par le vent ou la pluie ou par eux-mêmes pour être
discret ».

### Douze emplacements, servis par ordre d'importance

Le nuanceur en connaît douze. S'ils sont tous pris, ce sont les torches de
rue qu'on perd, jamais le bûcher.

1. **Le bûcher** — la scène la plus lourde du jeu se joue autour d'un feu.
2. **La messe** — l'église s'éclaire de l'intérieur et ça ressort par ses
   six lancettes. C'est le seul moment où le village voit un mur illuminé.
3. **Le four** — il chauffait déjà, il fumait déjà, il éclaire maintenant.
4. **Le feu de camp** de la place — jour de foire, ou simplement trois
   personnes dehors la nuit. Personne ne veille seul dans le noir.
5. **Les fenêtres** — une chaumière où quelqu'un est rentré. La lumière se
   pose **devant** la fenêtre, pas au milieu de la maison.
6. **Les torches** de rue, en dernier.

Les fenêtres ont été ajoutées à la géométrie : un rectangle à peine en
saillie sur le mur, avec son meneau. Elles ne servent à rien tant qu'aucun
feu ne brûle derrière, et deviennent le point le plus clair du village dès
qu'il y en a un.

### La torche devient un état du monde, pas un effet de rendu

Elle vit dans `sim/monde.mjs`, elle est déterministe, et le contrôle la
couvre. Un habitant sur trois en porte une, et seulement s'il est à plus
de neuf mètres de chez lui.

Elle s'éteint de trois façons :

- **le vent**, nouveau : trois sinusoïdes de périodes non multiples, qui
  le font monter et retomber de 0,04 à 0,99 sans jamais se répéter et sans
  consommer un seul tirage ;
- **la pluie**, qui existait depuis la v0.14 et n'avait aucun effet — elle
  en a enfin un ;
- **soi-même** : on n'éclaire pas son chemin quand on va voler, quand on
  fuit, ou quand on monte accuser quelqu'un.

Personne ne l'abrite parfaitement. Au vent fort, toutes finissent par
s'éteindre, simplement pas au même moment — l'abri se déduit du rang, pas
d'un tirage, pour ne pas décaler le flux de fabrication.

**Mesuré sur 60 jours** : 2,0 torches allumées en moyenne la nuit, 45 % des
relevés nocturnes sans aucune, un maximum de 7 les nuits calmes. Avant ce
réglage : 3,7 en moyenne, ce qui faisait dire à Pierre qu'il y avait trop
de lumière dans la rue.

### Ce qui n'a pas été fait, et pourquoi

Le vent ne fait pas encore tourner le moulin. Ce serait juste, mais ça
toucherait la production de farine, donc l'équilibre entier. À faire comme
un chantier à part, avec un balayage.

---

## Le remords, la honte et le brouillard (v0.17)

Demandé par Pierre : « facteur de honte existe ? » — puis, au quiz :
« fais remord et honte », « oui et il étouffe les torches et je pense
qu'il pourrait faire aussi autre chose : si par exemple on fait quelque
chose de pas bien dans le brouillard mais personne nous voit donc on n'a
pas de honte, tu vois ce que je veux dire, ou on peut aussi se perdre
dans le brouillard et tomber dans l'eau et mourir ».

### Deux états, et pourquoi les séparer

Aucun jeu de ce genre ne distingue les deux, et c'est dommage :

- **Le remords** monte qu'on soit vu ou non, d'autant plus qu'on est
  pieux. Il pousse à l'église, et prier l'efface huit fois plus vite que
  le temps.
- **La honte** ne monte **qu'avec un témoin**, et proportionnellement au
  nombre de témoins. Prier n'y change rien : il faut que le village
  finisse par regarder ailleurs. Elle fait fuir et empêche de traîner sur
  la place — un honteux rase les murs.

`temoins()` est le seul endroit du code qui demande *qui regarde*.

### Le brouillard fait trois choses, et c'est ce qui le rend juste

Il se lève du ruisseau les matins calmes, et seulement ceux-là : le vent
le chasse, la pluie l'empêche. Aucun tirage — il se déduit, donc on peut
le voir venir. Mesuré : **38 % des relevés d'aube** ont du brouillard
visible, 8 % du brouillard épais.

1. **Il étouffe les torches**, comme la pluie et le vent.
2. **Il aveugle les témoins** : au-delà de 0,55, `temoins()` renvoie zéro.
   On peut donc voler dans le brouillard sans en avoir honte — mais le
   remords, lui, reste. C'est exactement la distinction que Pierre
   demandait.
3. **On peut s'y noyer.** Quatre conditions simultanées : brouillard
   épais, aucune lumière, le milieu du courant, loin du pont, et la
   fatigue. Une torche allumée sauve la vie — c'est la première fois dans
   ce village qu'en porter une serve à autre chose qu'à être vu.

**Réglé par la mesure.** Premier essai : six noyés par village en 80
jours, le village y passait. Après resserrement des seuils : **1,6 noyé
par village**, soit un accident tous les cinquante jours. Une cible de
non-régression a été ajoutée pour que ça ne redevienne jamais un piège.

### Le vent fait tourner le moulin

Les deux moulins ne se valent plus. La roue a le courant, qui ne
s'arrête jamais. Les ailes ont le vent, qui va et vient — et en dessous
d'un certain souffle, la meule ne tourne plus du tout.

Le village dépend donc d'un moulin fiable et d'un moulin capricieux.

### Deux défauts trouvés par les garde-fous

**Le contrôle de détermination a attrapé la pluie.** Elle était tirée du
générateur de décor, ce qui était juste tant qu'elle ne faisait que
tomber. Depuis qu'elle éteint les torches et empêche le brouillard —
donc qu'elle décide de qui est vu et de qui a honte — c'est un accident
du monde. Déplacée sur `aleaEvenements`. Troisième fois que ce contrôle
attrape une vraie faute de conception.

**Le balayage a attrapé un défaut de mesure, pas de code.** Il comptait
les événements en relisant la chronique — or celle-ci ne garde que ses
**deux cents dernières lignes**. Au-delà d'une centaine de jours, les
premiers bûchers et les premiers surnoms tombaient hors du journal : le
balayage lisait 1 surnom là où il y en avait eu 5, et toutes les mesures
de récit de la session étaient biaisées à la baisse.

Corrigé : le village tient son propre décompte, `village.arrive`,
incrémenté à la source. La chronique reste ce qu'elle est — un journal
qu'on lit par-dessus l'épaule, pas un instrument.

*Ce qu'on ne mesure pas, on le perd ; ce qu'on mesure mal, on le corrige
de travers.*

### Le seuil de foule, trouvé au balayage

Avec les noyades, le village perd des habitants, et à quatre personnes
requises sur la place il ne faisait plus jamais foule : zéro bûcher.
Ramené à trois, tout tient — bûchers 1,0 par village, révoltes 3,8,
surnoms 4,3.

---

## La lune, et la lumière qui ne traverse plus les murs (v0.18)

### L'objection de Pierre, qui était juste

« Quand la lumière était à l'intérieur d'un bâtiment, il peut pas éclairer
l'extérieur des faces du bâtiment. Ça peut sortir par les fenêtres et
éclairer le sol dehors. Ça devient une source secondaire, la fenêtre. Là
par exemple l'église a des torches à l'intérieur et l'extérieur des faces
est allumé, c'est pas possible. Le dessus du toit n'est pas allumé. »

Exact, et c'était une faute de modèle, pas de réglage : une atténuation
par la distance ignore les murs.

**La correction.** Chaque source porte maintenant une **direction**. Une
torche éclaire tout autour d'elle ; une fenêtre n'éclaire que devant elle.
Le nuanceur compare la direction de la lumière au vecteur qui va d'elle
au sommet, et ne garde que ce qui est devant. Conséquences immédiates :
le toit reste noir, la face arrière reste noire, et le mur autour de la
fenêtre s'éclaire — ce qui est juste, la lumière s'y pose vraiment.

**Les fenêtres quittent la géométrie des bâtiments.** Elles forment leur
propre objet, avec une couleur par segment : éteinte, une fenêtre est un
trait de mur ; allumée, c'est le point le plus clair du village. Une
fenêtre n'est pas une surface éclairée, c'est une source.

### La lune

Huit jours de cycle — faux, mais on la voit grossir et maigrir en dix
minutes, et les nuits noires reviennent assez souvent pour compter.
Aucun tirage : elle se calcule à partir du jour et de l'heure.

**De vraies ombres portées.** Le sol est plat, les bâtiments sont des
boîtes : l'ombre d'un bâtiment est son empreinte poussée à l'opposé de la
lune, d'autant plus loin qu'il est haut. Un point du sol est dans l'ombre
s'il tombe dans la capsule qui joint les deux empreintes. On éteint alors
le trait de sol. Recalculé seulement quand la lune a bougé d'un vingtième
de radian, pas à chaque image.

### La pleine lune change ce qui arrive

Demandé explicitement : « max d'interaction ».

- **On voit le ruisseau** : plus de noyade au-dessus d'une demi-lune.
- **On voit qui vole** : la portée des témoins passe de 40 % à 100 % de
  celle du jour. On ne vole pas impunément un soir de pleine lune — la
  honte revient.
- **Le sabbat.** La sorcière veille à la cabane, et ceux qui croient plus
  aux choses qu'à l'église la rejoignent. Le village voit les lumières :
  le soupçon monte chez ceux qui ne sont pas venus. **C'est le sabbat
  lui-même qui alimente le bûcher** — la boucle se referme sans qu'aucune
  règle ne l'écrive.
- **Le loup.** La rancune, le courage et le peu de foi désignent toujours
  quelqu'un. Il court deux fois plus vite, il fait peur à vingt mètres, et
  au matin il se réveille avec du remords et aucun souvenir. Le village
  n'apprend jamais qui c'était : il entend, c'est tout, et il en soupçonne
  un autre.

**Réglé par la mesure.** Seuil du loup à 1,15 : un par village en soixante
jours, on ne le voit jamais. À 0,95 : neuf, il sort presque chaque pleine
lune et cesse d'être un événement. Retenu **1,10** — 2,9 par village, soit
une pleine lune sur trois.

Les douze cibles tiennent, détermination comprise.

---

## LES LÉGENDES — le chapitre de conception (à faire)

Dicté par Pierre, et c'est la direction la plus importante prise jusqu'ici.
Rien de tout cela n'est encore codé : ce chapitre est là pour que rien ne
s'en perde.

### Le principe

> « Ça c'est des métaphores. La sorcière, c'est pas une sorcière qui a des
> pouvoirs magiques, c'est plutôt une sorte de guérisseuse un peu
> magicienne. Le loup-garou, ça peut simplement être quelqu'un qui est
> schizophrène et qui s'habille avec une peau de bête. Le vampire, en fait
> ça peut être l'occasion d'accuser le seigneur, de manière métaphorique
> de prendre le sang des paysans, alors qu'en fait c'est juste qu'il les
> fait travailler pour lui. »

**Le surnaturel n'existe pas dans la simulation. Il existe dans la tête du
village.** Toute cause est banale ; c'est l'interprétation qui est
monstrueuse. Le jeu ne montre jamais un monstre : il montre un homme, et
il montre le village qui décide que c'en était un.

C'est cohérent avec tout ce qui est déjà construit — la chasse aux
sorcières où le village accuse toujours à côté — et ça en fait le principe
directeur plutôt qu'un accident.

### Les trois légendes

**La sorcière.** Déjà là. À requalifier : une guérisseuse, une herboriste,
une femme seule qui sait des choses. Rien de plus. Sa cabane à l'écart et
son savoir suffisent.

**Le loup.** Un homme qui perd la tête à la pleine lune et sort couvert
d'une peau. Il ne se souvient de rien au matin. Le village entend hurler
et conclut. *Déjà à moitié fait en v0.18.*

**Le vampire.** Le seigneur. Il ne boit le sang de personne : il lève
l'impôt, et quand la faim vient, le village trouve l'image juste. La
mécanique existe déjà (l'impôt, la rancune) — il ne manque que le mot que
le village met dessus.

### Ce qui reste à construire

**Le principe de Jack l'Éventreur.** *(demandé explicitement)* Des hommes
se servent de la légende. Un villageois rancunier, un vagabond, un
étranger de passage tue et laisse accuser le loup. Le village n'a aucun
moyen de faire la différence — et nous non plus, sauf dans la fiche du
coupable. C'est là que le jeu devient vraiment noir.

**Le doute, avec des degrés.** Personne ne sait, mais on soupçonne, et le
soupçon porte sur quelqu'un. Aujourd'hui `soupcon` est un nombre sans
cible ; il lui faut un destinataire.

**Les chasseurs de monstres.** Un Van Helsing arrive, logé gratuitement à
l'auberge le temps de sa chasse. Il peut se tromper de coupable. Il peut
être un escroc. Il peut y avoir des imposteurs. Il repart, ou il fait
brûler quelqu'un.

**L'auberge.** Bâtiment manquant. Elle héberge les chasseurs, les
vagabonds et les étrangers de passage — le colporteur en est déjà le
prototype.

**Les étrangers.** Ils arrivent, ils repartent, on ne sait rien d'eux, et
c'est exactement pour ça qu'on les accuse ou qu'ils en profitent.

### La règle qui découle de tout ça

Aucun événement du monde ne doit être surnaturel. Si le joueur ouvre la
fiche, il doit toujours trouver une cause banale. La légende ne vit que
dans la chronique et dans le soupçon des habitants.

---

## 📜 Historique

- **2026-09-10 (après-midi, suite)** — Lumière des torches calculée par
  sommet dans le nuanceur des lignes épaisses, avec le four qui éclaire
  et le halo gardé pour la flamme ; surnoms normalisés à l'écart-type et
  rendus uniques. Compétence `/quiz` ajoutée aux deux dépôts pour que
  Pierre tranche en cliquant. v0.16.

- **2026-09-10 (après-midi)** — Le monde sans dé : plus aucun tirage dans
  les décisions (maximum + penchant fixe + lassitude + cadence propre),
  trois générateurs séparés, cour et casse de moulin devenues des seuils.
  Premier essai vert sur les sept cibles alors que le village était
  devenu muet : trois cibles de récit ajoutées, et un test de
  détermination permanent. v0.15.
  Planche de comparaison des deux éclairages de torche (halo dessiné
  contre lumière calculée par sommet) remise à Pierre.

- **2026-09-10 (midi)** — Le monde se voit (fumée du four, torches, pluie)
  et s'entend (cloche, marteau, rumeur, dragon), sur une file d'événements
  que le monde émet et que le rendu vide. Second générateur réservé au
  décor, après que le contrôle de non-régression a attrapé la perturbation
  du flux principal. v0.14.
- **2026-09-10 (matin, suite)** — Le simulateur sans rendu : simulation
  extraite dans `sim/monde.mjs`, runner `sim/equilibre.mjs` (~150 années
  de village par seconde) avec cibles de non-régression, et
  `sim/balayage.mjs`. Deux balayages ont réglé le pain et les moulins,
  que quatre passes à la main n'avaient pas trouvés.
- **2026-09-10 (matin)** — Boucle musicale : cause trouvée (5,35 s de
  silence en fin de fichier), quatre analyses automatiques non
  concluantes, et construction de `boucle.html` pour que Pierre cale la
  boucle à l'oreille et me donne les chiffres exacts.
- **2026-09-10 (fin de nuit)** — Fiche d'habitant avec le « pourquoi »,
  mémoire, liens et chagrin, amour tu, metteur en scène, règles écrites
  avec arc de flirt, noms et surnoms gagnés, dragon repris de Fly or Die,
  journal plein écran, placement corrigé. v0.11 → v0.13.
- **2026-09-10 (nuit)** — Occlusion réparée (sens des triangles), colporteur
  indépendant et protégé, boucle musicale à l'échantillon près, vitesses
  ×1/×10/×100 avec horloge de décision en temps simulé. v0.10.
- **2026-09-10 (suite)** — Deuxième acte (autorité du prêtre, dîme, impôt,
  révolte, bouc émissaire, succession de la sorcière), relief et ruisseau,
  volume par faces noires, deux moulins cassables, six métiers de plus,
  musique de Pierre. Six défauts trouvés en mesurant. v0.9.
- **2026-09-10** — Le village : plan, seize habitants à traits et besoins,
  économie du blé et du pain, rumeur contagieuse, seuil de foule, foire et
  dragon, chronique. Quatre défauts d'équilibrage trouvés en instrumentant
  la page et corrigés. v0.8.
- **2026-09-09 (nuit, suite)** — Escalier sur les diagonales diagnostiqué
  (MSAA bien actif, mais 4 paliers sur un trait d'un seul pixel) et
  corrigé par des traits en géométrie ; interface remise à plat (menu,
  numéro de version cliquable, historique). v0.4 → v0.7.
- **2026-09-09 (nuit)** — Nom confirmé par Pierre : on garde Dwelve
  Hollow. Page de test 3D écrite et vérifiée au navigateur (voir la
  section dédiée) : direction validée.
- **2026-09-09 (soir)** — Règle de nommage : source retrouvée et vérifiée
  (Kazuo Koike via son école, Yuji Horii diplômé), ce qui corrige le
  « non retrouvé » de l'après-midi. Point ouvert consigné : la règle,
  telle qu'énoncée, plaide contre l'ordre des mots de Dwelve Hollow —
  décision laissée à Pierre. Réflexion sur le passage à la 3D :
  recommandation Three.js + .obj + Blender, avec un test minimal proposé.
- **2026-09-09** — Concept posé (univers médiéval, vie autonome, règles
  locales par personnage, contemplatif, esprit terminal vert). Nom
  cherché puis tranché : Dwelve Hollow. Analyse de l'IA des trois jeux
  précédents lue dans leur code. Six principes retenus. Dépôt créé par
  Pierre, ce fichier ajouté. Rien de codé.
