# Dwelve Hollow

Un univers médiéval en vie autonome. On donne des règles à chaque
personnage et on regarde ce qui se passe. Contemplatif : on observe plus
qu'on n'agit. Rendu filaire vert sur fond noir, esprit terminal.

**État : test technique.** Le jeu n'existe pas encore.

## Ce qu'il y a pour l'instant

`index.html` — la page de test 3D. Charge un modèle OBJ et le dessine en
filaire vert. Trois réglages : arêtes vives contre filaire brut, seuil
d'angle des arêtes, rotation. Un bouton et le glisser-déposer permettent
de charger n'importe quel `.obj` depuis le disque, sans passer par le
dépôt — c'est la boucle prévue pour tester un export Blender.

`models/maison.obj` — modèle de test écrit à la main, commenté : le
format OBJ tient en deux directives, un sommet et une face.

`vendor/three/` — Three.js r186, copié dans le dépôt plutôt que chargé
depuis un CDN (aucune dépendance externe, fonctionne hors ligne).
Licence MIT, incluse.

## La suite

Tout est dans [BACKLOG.md](BACKLOG.md) : le concept, le choix du nom,
l'analyse de l'IA des trois jeux précédents, les principes retenus et ce
qui reste à faire.
