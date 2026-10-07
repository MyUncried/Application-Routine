# KODJO — Prompt de mise à jour documentaire : affichage de la durée sur les cartes

**Date :** 07/10/2026
**Fichier Figma :** `G6RY5Ebhgwb4AHIOYDwwvg`
**Portée :** composants `DSF / Cards / Exercice` et `DSF / Cards / Séance`, page « Design system — Fondations »

**Objet.** Ce document complète le prompt « Bip de cadence », qui porte sur les règles de calcul de la durée. Celui-ci porte sur son **affichage** : le format, sa présence ou son absence, et les marges des cartes.

**Figma fait foi.** Les composants ont été modifiés avant la rédaction, et toutes les instances ont suivi.

---

## 1. Format d'affichage de la durée

| Propriété | Avant | Après |
|---|---|---|
| Cadre | fond `#F5F7FA`, rayon 5 px | **aucun** |
| Marges intérieures | 8 px à gauche et à droite, 2 px en haut et en bas | **aucune** |
| Police | Inter Semi Bold 12 | **inchangée** |
| Couleur | `#141414` | **inchangée** |
| Alignement | à gauche dans son cadre | **à droite** |
| Position | bord droit de la colonne de texte | **bord droit de la carte, marge de 16 px** |

La durée cesse d'être une pastille et devient un simple texte en gras, calé à droite. Le gain de 16 px de marges intérieures revient aux titres, qui se tronquent moins.

Cela vaut pour les deux cartes et pour leurs trois variantes de catalogue — replié, archivé, déployé.

---

## 2. Présence ou absence de la durée

### 2.1 Nouvelle propriété de composant

Une propriété booléenne **`Durée`** a été ajoutée aux deux composants, vraie par défaut, liée à la visibilité du bloc de durée.

| Composant | Clé | Instances |
|---|---|---|
| `DSF / Cards / Exercice` | `Durée#7344:0` | 82 |
| `DSF / Cards / Séance` | `Durée#7344:11` | 187 |

Masquer une durée est désormais un réglage d'instance, visible dans le panneau des propriétés et réversible. C'est la traduction, au niveau du composant, de la règle établie dans le prompt « Bip de cadence » : **une carte affiche sa durée quand elle en a une.**

Côté développement, cela se lit comme un champ optionnel au rendu de la carte, non comme une valeur à zéro.

### 2.2 Cas d'absence

| Situation | Affichage |
|---|---|
| Mode Durée | la durée |
| Mode Répétitions **avec** bip de cadence | `≈` suivi de la durée |
| Mode Répétitions **sans** bip | **rien** |
| Mode À l'échec | voir le point ouvert ci-dessous |

### 2.3 Point ouvert — l'emplacement accueille aussi un libellé

Dans l'état actuel du fichier, trois cartes du catalogue des exercices montrent trois choses différentes au même endroit :

- « Squat assisté » → `5 min 15 s`, une durée ;
- « Étirement du quadriceps » → **« à l'échec »**, une mention de mode, pas une durée ;
- « Extension du genou » → **rien**, car elle est en Répétitions sans bip.

Si l'emplacement peut accueillir un libellé quand il n'y a pas de durée, alors les répétitions sans bip devraient en recevoir un aussi, plutôt que de laisser un vide. À trancher : soit l'emplacement n'accueille que des durées et « à l'échec » en sort, soit il accueille un libellé d'état et le cas sans bip en reçoit un.

---

## 3. Géométrie des cartes

### 3.1 Colonne de texte de la carte exercice

La colonne `Contenu texte` passe de **207 à 250 px** sur les variantes repliée et archivée, afin que la ligne de titre atteigne le bord droit de la carte.

Cet élargissement ne concerne que la **ligne de titre**. Les deux lignes du dessous — catégorie et zones corporelles d'une part, résumé des séries d'autre part — conservent leur largeur de 207 px, car le bouton de lecture occupe le bas droit de la carte (y 44 à 92 sur un composant de 91 px de haut) et ne laisse pas la place.

**Conséquence sur une règle existante.** Les largeurs de coupe des zones corporelles — 60, 69 et 145 px selon le contexte — restent valides, mais la documentation doit préciser qu'elles dérivent de la **colonne basse à 207 px**, et non de la ligne de titre, désormais plus large. Sans cette précision, un intégrateur recalculera la coupe sur la mauvaise référence.

### 3.2 Marges, et une asymétrie assumée

| Carte | Marge gauche | Marge droite |
|---|---|---|
| Séance | 16 px | 16 px |
| Exercice | **12 px** (gouttière photo) | 16 px |

Les deux cartes sont donc alignées **entre elles** à droite, ce qui est l'essentiel puisqu'elles se succèdent dans l'onglet Catalogues.

La carte exercice reste asymétrique avec elle-même : sa gouttière photo commence à 12 px. **Décision explicite de ne pas corriger** — le recalage supposerait de décaler la gouttière, le bloc texte qui démarre à 88 px, et par ricochet les largeurs de coupe, sur 82 instances. Signalé une fois, acté, on n'y revient pas.

---

## 4. Composants obsolètes

Cinq composants du DSF portent encore un bloc de durée et n'ont **aucune instance** dans le fichier :

| Composant | Identifiant |
|---|---|
| `DSF / Cards / Exercice — catalogue` | `5544:6324` |
| `DSF / Cards / Séance — catalogue` | `5544:6426` |
| `DSF / Cards / Séance — archivée` | `5544:6430` |
| `DSF / Cards / Planification` | `5544:6555` |
| `DSF / Status & Tags / Durée totale` | `5544:6954` |

Ce sont les versions antérieures, remplacées par `DSF / Cards / Exercice` et `DSF / Cards / Séance`. Ils n'ont reçu ni le nouveau format ni la propriété `Durée` : les modifier reviendrait à entretenir du mort. Ils relèvent d'un nettoyage du DSF, à décider séparément.

**Point de vigilance documentaire** : tant qu'ils existent, un lecteur du DSF peut documenter la mauvaise carte. La documentation doit nommer les deux composants vivants sans ambiguïté.

---

## 5. Énoncés devenus faux

| Énoncé | Statut |
|---|---|
| La durée s'affiche dans une pastille à fond gris | faux — plus de cadre |
| La durée est calée sur le bord de la colonne de texte | faux — bord droit de la carte, marge 16 px |
| La colonne de texte de la carte exercice fait 207 px | partiellement faux — 250 px pour la ligne de titre, 207 px pour les lignes basses |
| Toute carte affiche une durée | faux — propriété `Durée`, absente en Répétitions sans bip |
| Les largeurs de coupe dérivent de la largeur de la carte | faux — elles dérivent de la colonne basse à 207 px |

---

## 6. Incident à consigner

Avant l'ajout de la propriété `Durée`, l'absence de durée sur la carte « Extension du genou » avait été obtenue en masquant le bloc directement sur cinq instances, par surcharge locale.

Cette opération s'est révélée **irréversible** : le nœud disparaît de l'arborescence de l'instance et ne peut plus être réatteint. Le seul retour passe par une réinitialisation complète des surcharges, qui efface aussi le titre, la catégorie et les zones corporelles de la carte.

À inscrire comme règle de méthode : **une donnée qui varie d'une instance à l'autre se traite par une propriété de composant, jamais par une surcharge de visibilité.** La propriété se règle, se lit et s'annule ; la surcharge ne s'annule pas.
