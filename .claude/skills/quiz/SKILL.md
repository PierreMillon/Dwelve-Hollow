---
name: quiz
description: Pose des questions à Pierre sous forme de boutons cliquables plutôt qu'en texte, pour qu'il tranche vite. Deux usages — trancher les décisions ouvertes d'un projet, ou réviser un sujet de maths avec difficulté progressive. À invoquer quand Pierre écrit /quiz, quand il demande un quiz, un QCM, des questions à cliquer, ou quand plusieurs décisions attendent sa réponse.
---

# Quiz

Pierre lit vite et tape lentement. Une question posée en texte lui coûte
un paragraphe de réponse ; la même question posée en boutons lui coûte un
clic. **Toujours passer par l'outil `AskUserQuestion`**, jamais par une
liste numérotée dans le texte.

## Deux usages

### `/quiz` seul — trancher

Rassembler ce qui attend une décision : les points ouverts du
`BACKLOG.md` du projet en cours (sections « Réserve », « point ouvert »,
« à traiter »), les questions restées sans réponse dans la conversation,
et les choix qu'un travail en cours impose.

Une question par décision réelle. Rien d'inventé pour remplir.

### `/quiz <sujet>` — réviser

Exemples : `/quiz logique`, `/quiz algèbre linéaire`, `/quiz limites`,
`/quiz dénombrement`.

Objectif : L1 Mathématiques, redoublement visé à 16/20. Donc pas la
perfection — la solidité.

## Les règles de l'outil

- Au plus **4 questions** par appel, **2 à 4 réponses** par question.
- L'en-tête (`header`) fait **12 caractères au maximum**.
- Ne jamais écrire une option « Autre » : elle est ajoutée toute seule.
- Quand il y a une recommandation, elle est **la première option** et
  porte `(Recommandé)` à la fin du libellé.
- Chaque option a une `description` courte qui dit ce que ce choix
  implique — c'est là que se joue la rapidité de lecture.

## Réviser : comment poser

**Progressivité.** Premier lot facile, du niveau où l'on est sûr. Chaque
lot monte d'un cran. Si un lot est raté à moitié, le suivant redescend.

**Une seule notion par question.** Une question qui teste deux choses ne
dit pas laquelle a manqué.

**Des distracteurs qui veulent dire quelque chose.** Chaque mauvaise
réponse correspond à une erreur qu'on fait vraiment — signe oublié,
quantificateurs inversés, hypothèse non vérifiée. Une mauvaise réponse
absurde n'apprend rien.

**Après chaque lot**, en trois lignes maximum : ce qui est juste, ce qui
ne l'est pas, et pourquoi. Pour une erreur, **guider, ne pas résoudre** —
rappeler la définition qui manquait, ou proposer le cas le plus simple
(2 éléments, dimension 2) plutôt que dérouler la correction.

**Le score.** Le tenir d'un lot à l'autre. À la fin : « 9 sur 12, 75 % ».
Sans commentaire moral.

**Trois lots**, puis on s'arrête, sauf demande contraire.

## Mise en page des réponses

Minimaliste, très aéré. Markdown standard. Pas de blocs denses, pas
d'encadrés, aucune question de relance à la fin.

Les fractions s'écrivent avec une barre horizontale. Le LaTeX et les
symboles mathématiques sont réservés aux exercices — jamais dans le texte
de liaison.

## Exemple d'appel

Quatre questions, en-têtes courts, recommandation en premier :

```
AskUserQuestion({ questions: [
  {
    header: "Torches",
    question: "Comment éclaire-t-on la nuit ?",
    multiSelect: false,
    options: [
      { label: "Lumière par sommet (Recommandé)",
        description: "Chaque arête calcule sa clarté. Ouvre la lune, le bûcher, le dragon." },
      { label: "Halo dessiné",
        description: "Des anneaux devant la scène. Une heure de travail, aucun risque." }
    ]
  }
]})
```
