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

## 📜 Historique

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
