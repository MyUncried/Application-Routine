# KODJO — Circuits et cycles dans la composition de séance

Synthèse des décisions et des réalisations Figma de la nuit du 27 au 28 octobre 2026.

Périmètre : l'en-tête des conteneurs, le repli d'un circuit, l'apparition du cycle, le vocabulaire des natures de circuit, et le menu de création. Les écrans d'exécution, le catalogue et la fiche du mouvement ne sont pas touchés.

---

## 1. Écrans

**Créés**, en bout de la ligne Composition de séance, dans cet ordre :

| Écran | Ce qu'il montre |
| --- | --- |
| `Composition séance — Deux circuits repliés` | Deux circuits repliés dans une même séance, exercices hors circuit avant et après |
| `Composition séance — Deux circuits Un replié` | Le premier circuit déployé, le second replié |
| `Composition séance — Cycle` | Un cycle contenant les deux circuits, exercices hors cycle avant et après |
| `Composition séance — Base (sans circuit)` | Une séance sans conteneur, compte à rebours et fin de séance seuls |
| `Composition séance — Ajouter un circuit (emplacement)` | Le choix des membres que le circuit va envelopper : enveloppe choisie en trait plein, enveloppe candidate en pointillé, barre de placement en bas |
| `Composition séance — Circuit créé` | Le circuit après confirmation |
| `Composition séance — Circuit — Extension par la borne` | Un circuit étendu à l'exercice suivant |
| `Composition séance — Ajouter un cycle (emplacement)` | Le même geste un niveau plus haut : les membres enveloppés sont des circuits, Circuit A choisi et Circuit B candidat |

Les deux écrans d'emplacement portent le même vocabulaire visuel, et c'est le point : **on ajoute un cycle comme on ajoute un circuit**, en désignant les membres qu'il enveloppe. Seule la nature des membres change, des exercices pour un circuit, des circuits ou des exercices pour un cycle depuis D-450.

**Modifiés :**

| Écran | Ce qui change |
| --- | --- |
| `Composition séance — Créer (menu)` | Deux options ajoutées, Ajouter un circuit et Ajouter un cycle, et l'icône de séance resserrée |
| `Composition séance — Circuit — Nature (popover)` | Vocabulaire des deux natures |
| `Composition séance — Circuit — Nature (confirmation générique)` | Vocabulaire du titre et des deux natures |

**Déployés le 28/10 : 40 écrans.** Les 25 de la ligne Composition de séance et les 15 de la ligne Modèles portent désormais le nouvel en-tête. La nature a été déduite de l'ancienne unité : « tours » devient *groupées*, « séries » devient *alternées*. Un seul écran a demandé un ajustement, `Composition séance — Fin de séance`, dont la séquence a une marge différente et sur lequel la colonne fixe du compteur tombait sur le chevron.

---

## 2. L'en-tête d'un conteneur

Même grammaire pour un circuit et pour un cycle.

**Ligne 1**, de gauche à droite : le nom du conteneur, le chevron de repli, le compteur, la durée.

- Le nom est en 15 points Semi Bold, **la police d'un nom d'exercice sur sa carte**.
- Le chevron est accolé au nom et non aligné à droite de la ligne, conformément à la règle retenue pour les sections du panneau de filtres : un chevron aligné à droite se lit comme une navigation, un chevron accolé se lit comme un dépliement.
- Le bloc nom plus chevron a une **largeur fixe**, de sorte que les chevrons de tous les conteneurs d'un écran forment une colonne.
- Le compteur est posé à une **abscisse fixe**, commune à tous les conteneurs, et non centré dans l'espace restant. Un centrage ferait dépendre sa position de la longueur du nom et de celle de l'adjectif de nature, et les valeurs ne s'aligneraient plus d'un conteneur à l'autre.
- La durée est alignée sur la marge droite.

**Ligne 2**, uniquement quand le circuit est replié : les **noms de ses exercices**, séparés par un point médian, sur une seule ligne tronquée par des points de suspension.

Le décompte d'exercices a été écarté : il dit combien, pas quoi, et le repli cache précisément le contenu. Les noms sont la seule information que le repli fait perdre.

**Interligne** entre les deux lignes : 7 points.

---

## 3. Le compteur n'est plus un stepper

Le stepper permanent disparaît de l'en-tête. À sa place :

- le **nombre** reste affiché en permanence, au format `DSF / Forms / Valeur modifiable`, donc en `color/primary` ;
- l'**unité**, « tours » ou « répétitions », passe en noir et **cesse d'être un contrôle** ;
- l'**adjectif de nature**, pour un circuit, reste en `color/primary` et ouvre le choix de nature.

Un appui sur le nombre ouvrira le stepper. **L'écran du stepper n'est pas dessiné.**

**L'unité s'accorde** : « 1 tour », « 3 tours », « 1 répétition », « 2 répétitions ». L'adjectif de nature, lui, reste au féminin pluriel quelle que soit la valeur, puisqu'il porte sur les séries.

### Ce que cela remplace

D-442 du 22/10/2026 impose, mot pour mot, que « le stepper est toujours affiché et actif, `−` et `+` autour du nombre, sans toucher préalable », que « les cibles tactiles du `−`, du `+` et de la pastille d'unité sont espacées et d'au moins 44 pt », et que « tous les textes de la ligne, nombre, unité, durée, ont la taille du titre Circuit ».

Les trois dispositions sont contredites :

1. **Le stepper n'est plus affiché.** C'est le gain de place qui le justifie : l'en-tête n'est plus contraint par les 36 points du stepper, et le bloc d'un circuit replié passe de 76 à 68 points.
2. **Les cibles tactiles ne font plus 44 points de haut.** Elles mesurent 48 sur 33 sur un circuit replié, bornées par la hauteur du bloc. Revenir à 44 en hauteur coûterait 10 points par conteneur, soit l'essentiel du gain. Le compromis est une compensation en largeur.
3. **Les textes de la ligne n'ont plus tous la taille du titre.** Nombre en 15, unité en 13, durée en 12.

Ces trois écarts appellent une décision de registre qui nomme D-442 et précise la portée du remplacement.

---

## 4. Vocabulaire : séries groupées et séries alternées

### La correspondance, vérifiée

Le chapitre 10 pose : « Un circuit de tours répète les exercices complets ; un circuit de séries entrelace leurs séries de même indice », avec les deux exemples `(A1 A2 A3 B1 B2 B3) × 3` et `A1 B1 A2 B2 A3 B3`.

Donc, sans ambiguïté :

| Terme du référentiel | Déroulement | Nouveau libellé |
| --- | --- | --- |
| circuit **de tours** | toutes les séries d'un exercice, puis l'exercice suivant | **séries groupées** |
| circuit **de séries** | une série de chaque exercice, puis on reprend | **séries alternées** |

### Pourquoi changer

Dans les deux natures, `N` compte la même chose : **le nombre de passages dans le circuit**. Ce qui change est le contenu d'un passage. Or l'interface écrivait « 3 tours » puis « 3 séries », ce qui laisse croire que l'unité varie, alors que le chapitre 10 dit lui-même que « le nombre affiché ne change pas : 3 tours devient 3 séries ». On faisait donc varier le mot invariant et on taisait le mot variable.

S'ajoute une collision : sur une carte d'exercice, `3 × 1 min 30` désigne déjà trois séries. « 3 séries » dans un en-tête de circuit désignait autre chose.

### Les libellés retenus

- **En-tête**, forme courte, contrainte par la place : `3 tours · alternées` et `3 tours · groupées`. L'accord au féminin pluriel suffit à indiquer que l'adjectif porte sur les séries et non sur les tours, « tours » étant masculin. La forme complète `3 tours · séries alternées` demande 174 points pour 171 disponibles entre le chevron et la durée, elle ne passe pas, y compris en réduisant le titre.
- **Sélecteur de nature** : `Séries groupées`, sous-titre « toutes les séries d'un exercice exécutées à chaque tour ». `Séries alternées`, sous-titre « une série de chaque exercice exécutée à chaque tour ». Les deux sous-titres passent à la ligne dans la carte, qui grandit de 117 à 143 points. La contrainte de largeur est assumée et reste à arbitrer au développement.
- **Confirmation de conversion** : « Passer en séries alternées ? ». Son corps reste valable, il parle bien de séries.

### Portée documentaire

Le vocabulaire « circuit de tours » et « circuit de séries » figure aux chapitres 06, 09, 10 et 13, dans la matrice des formats, et dans D-442 qui nomme explicitement la pastille « tours » ou « séries ».

**Recommandation : renommer partout**, plutôt que de garder « Tours » et « Séries » comme valeurs de modèle et d'afficher autre chose. Deux vocabulaires pour une même notion sont la cause directe des confusions constatées.

---

## 4 bis. Point B de la clôture : tranché, pas d'assouplissement

Le point B — « lever ou non le nombre de séries imposé par un circuit de séries » — est **fermé le 28/10 sur le maintien de la contrainte**. Les deux natures sont conservées, les séries restent portées par l'exercice, et le nombre reste identique pour tous les membres d'un circuit alterné. La conversion reste destructrice, donc **l'écran de confirmation est conservé** et ne doit pas être supprimé.

### Pourquoi la contrainte ne peut pas être levée

Le nombre imposé n'est pas une restriction ajoutée, c'est la condition de l'alternance progressive. Deux lectures possibles du mot « séries » :

- **Par tour.** Le volume d'un exercice se répète à l'identique à chaque tour. Pour obtenir une progression, la cible devrait changer d'un tour à l'autre, donc être indexée par passage. C'est précisément la table que **SU-08 interdit** et que D-449 a retirée en v2. L'alternance progressive devient inexprimable.
- **Au total.** Trois séries de cibles 10, 12, 14 distribuées une par tour. L'alternance progressive fonctionne, mais le nombre de tours **est** alors le nombre de séries, nécessairement pour tous les exercices du circuit. On retombe exactement sur le circuit de séries actuel et son N imposé.

Le document de concept le dit par son usage : le circuit de séries est « réservé aux progressions et aux pyramides, où la charge évolue d'une série à l'autre ». Lever la contrainte supprimerait le cas qui justifie son existence.

### Deux notions différentes derrière le mot « passage »

À distinguer, leur confusion ayant produit des allers-retours : une **table de cibles indexée par passage**, interdite par SU-08 et retirée ; et un **circuit qui intercale les séries propres de chaque exercice**, chaque série gardant sa cible. Seule la première est écartée.

---

## 4 ter. Séries à zéro

**Décision du 28/10.** Une cible de série peut valoir **zéro**, en durée comme en répétitions, **à n'importe quelle position de la liste**. Elle signifie : *cet exercice ne participe pas à ce tour*.

- **Le tiret et le zéro sont deux états distincts.** Une nouvelle ligne arrive avec un tiret, jamais avec zéro. Le tiret vaut « à renseigner » et bloque l'enregistrement ; le zéro vaut « délibérément absent » et l'autorise. Ils doivent rester visuellement distincts dans le tableau des séries, faute de quoi le vide sera traité comme un zéro.
- **Le zéro est intentionnel**, puisqu'il ne peut pas arriver par initialisation.
- **Plancher.** Un exercice dont le **total vaut zéro est refusé**, comme tout exercice sans volume. Aucune règle nouvelle, la notion de total existe déjà.
- **Exécution.** L'étape et sa pause sont **sautées**.
- **Bornes à ouvrir** : RM-234, D-232 et D-430, qui fixent aujourd'hui répétitions `1..100` et durée par série `1 s..58 min 55 s`. Seules les pauses acceptent zéro.

### Ce que cela réhabilite

D-442 décrit à l'exécution « un passage partiel (le dernier Exercice n'a plus de série) ». Ce cas, impossible sous la contrainte seule, devient exactement ce que produit une série à zéro en fin de circuit alterné. La règle d'exécution était donc déjà écrite ; elle attendait que la valeur devienne saisissable. Rien à supprimer, tout au plus à préciser que l'exercice a bien une série, de valeur nulle.

---

## 5. Identifiants des conteneurs : des lettres

`Circuit A`, `Circuit B`, `Cycle A`.

- **Pas d'identifiant quand il n'y a qu'un seul conteneur.** L'écran affiche alors simplement « Circuit » ou « Cycle ». La lettre sert à désigner, et il n'y a rien à distinguer tant qu'il n'y a qu'un conteneur ; l'imposer à la séance la plus courante serait un vocabulaire d'inventaire inutile.
- **Numérotation continue** sur toute la séance dès qu'il y en a plusieurs, sans repartir à A dans chaque cycle.
- Les lettres évitent la collision avec les comptes. « Circuit 2 · 2 tours » fait hésiter, surtout quand les deux nombres coïncident, et la lecture vocale « Circuit 2, 2 tours, alternées » est illisible.
- L'identifiant ne sert plus à distinguer visuellement deux blocs, puisque les noms d'exercices le font mieux. Il sert à **désigner** un conteneur ailleurs : confirmation de suppression, message après déplacement, lecture vocale.

---

## 6. Le cycle

### Ce que dit la règle

**SU-04**, amendée par **D-450** le 28/10 : « Plusieurs cycles successifs, chacun composé de circuits et d'exercices et muni de son compte ; un exercice peut être membre direct d'un cycle ; aucun cycle, circuit ou séance imbriqué. »

D-450 fait en outre entrer le cycle dans le MVP avec ses valeurs propres. **La notion de cycle technique disparaît du référentiel** : plus de cycle non affiché, plus de répétition imposée à 1, plus de cycle conservé pour la seule évolutivité du modèle. Les passages des chapitres 01 à 13, des trois annexes, de `PRODUCT.md` et d'`INDEX.md` qui décrivaient encore le cycle technique invisible ont été réécrits le 28/10 ; ils ne portent plus seulement la bannière D-449.

### Pourquoi l'exercice est membre direct

SU-04 disait « composé de circuits » sans mentionner les exercices. Pris au mot, un cas aussi banal que « trois fois : dix burpees puis le circuit » devenait inexprimable, et l'utilisateur le contournait en créant un circuit d'un seul exercice.

Le besoin est plus précis que cela, et c'est ce qui l'a emporté : un exercice placé **avant** un cycle n'est joué qu'une fois, un exercice placé **dans** un circuit s'enchaîne avec ses tours. Aucune des deux positions ne dit « la mobilisation, refaite à chaque reprise du cycle ». Seule l'appartenance directe au cycle l'exprime, et elle est exécutée une fois par répétition du cycle (RM-252).

Les exercices qui ne sont dans aucun cycle restent au niveau de la séance.

### Le rendu

La hiérarchie passe par les fonds et **non par des retraits**, l'indentation étant impossible sur 402 points sans sacrifier la largeur des cartes.

- Cycle : bande **pleine largeur**, gris le plus soutenu, coins arrondis au même rayon que les blocs de circuit, sur les quatre coins.
- Circuit : bloc de 386 points, gris intermédiaire.
- Exercice : carte blanche de 370 points.

Trois tons, du plus foncé au plus clair en descendant dans la structure.

**Frange de dégradé** : la bande du cycle est transparente sur **4 points en haut et 4 points en bas**. À exprimer en points et non en pourcentage de la hauteur : un dégradé Figma raisonne en proportion, donc la frange s'épaissirait sur un cycle plus grand.

### Le compteur et le repli

- Unité : **répétitions**. Pas d'adjectif de nature, un cycle n'ayant pas deux façons de se dérouler.
- Bornes du compte : **1 à 99, défaut 1**, alignées sur celles du circuit (RM-028).
- **Un cycle ne se replie pas.** Pas de chevron, pas de zone tactile de repli.

### Les bornes

Le cycle porte une **borne haute**, marquée par un anneau concentrique autour du repère de rail : anneau de 16 points pour un repère de 10, trait de 1 point aligné à l'extérieur. La borne basse n'est pas dessinée.

**Ces bornes sont un repère de lecture, pas un contrôle.** On n'étend pas un cycle en tirant son bord : un cycle change d'étendue parce que ses membres y entrent et en sortent, par le geste unique décrit en section 6 bis. Les poignées de bord dessinées le 28/10 ont été retirées pour cette raison.

---

## 6 bis. Un seul geste : l'appui long

Aucun contrôle sur le bord d'un conteneur. Un conteneur change d'étendue parce que ses membres y entrent et en sortent, et c'est le même geste à tous les niveaux.

**G1. Le geste.** Appui long, déplacement, arrêt sur l'emplacement visé, relâchement.

**G2. Un exercice se déplace entre circuits**, y compris entre circuits portés par des cycles différents, et au niveau de la séance. Il peut passer directement d'un circuit à un autre : un conteneur de composition est une position, pas une identité. La restriction posée pour les familles de mouvements, où l'on ne peut pas sortir un mouvement d'une famille pour le mettre directement dans une autre, ne se transpose donc pas.

**G3. Un circuit replié se déplace entre cycles** et au niveau de la séance. Le repli est ce qui rend un circuit manipulable comme un tout : le chevron gagne là une seconde fonction.

**G4. Un appui long sur l'en-tête d'un circuit déployé le replie d'abord**, puis démarre le déplacement. C'est le symétrique de la famille de mouvements qui se déplie d'abord avant un réordonnancement.

**G5. Un conteneur ne naît jamais vide.** Il est créé autour de membres existants, en les désignant : écrans `Ajouter un circuit (emplacement)` et `Ajouter un cycle (emplacement)`.

**G6. Il n'existe aucune action « supprimer le conteneur ».** Un conteneur vidé de tous ses membres disparaît. Un conteneur à un seul membre est conservé en composition, son compte le justifiant.

**G7. L'éclairage du conteneur visé pendant le déplacement est obligatoire.** À la dernière position d'un conteneur, dedans et dehors sont à deux points l'un de l'autre. C'est le seul signal qui lève l'ambiguïté avant le relâchement, et c'est ce qui remplace la poignée de bord. Sa forme visuelle reste à dessiner, voir section 9.3.

**G8. Pendant un déplacement, les en-têtes collées se décollent**, voir la règle D7.

### Pourquoi aucune poignée de bord

Les membres d'un circuit sont des cartes déjà déplaçables. Les membres d'un cycle sont des circuits, que le repli rend déplaçables de la même manière. Une poignée de bord serait donc un second moyen de faire ce que l'appui long fait déjà, avec sa propre grammaire à apprendre et son propre vocabulaire visuel à dessiner, pour un résultat identique.

---

## 7. Couleurs

Deux couleurs seulement dans les en-têtes de conteneur, toutes deux liées au token :

| Token | Valeur | Emploi |
| --- | --- | --- |
| `color/text-primary` | 20, 20, 20 | nom, unité, durée, séparateur, noms d'exercices |
| `color/primary` | 5, 8, 229 | compteur, adjectif de nature |

Le bleu est la convention des **valeurs modifiables**, établie par `DSF / Forms / Valeur modifiable`, qui expose une variante grisée pour l'état inactif. Ce n'est pas une couleur de lien.

Vingt et un textes ont été liés à la variable, qui étaient auparavant en valeur figée.

Point restant : l'adjectif de nature est en bleu alors que ce n'est pas une valeur modifiable au sens du composant, mais un choix dans une liste. À trancher si le bleu doit rester strictement réservé aux valeurs modifiables.

---

## 8. Le menu de création

État actuel, de haut en bas : Créer un nouvel exercice, Utiliser un mouvement existant, Utiliser une séance existante, Ajouter un circuit, Ajouter un cycle, Annuler.

Le verbe distingue les deux familles : les trois premières produisent du contenu, les deux dernières posent un conteneur.

Icônes : l'icône de circuit est reprise de `HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187`, l'icône de cycle est le sigle KODJO en blanc.

### Réserve de conception, à arbitrer

Ce menu propose cinq choix avant toute action, dont deux parlent de structure à quelqu'un qui n'a encore aucun exercice à structurer. Et « Ajouter un circuit » depuis le bouton plus crée un **conteneur vide**, cas que la revue concurrentielle n'a trouvé documenté nulle part.

Sur dix-huit applications lues, **aucune ne crée un groupe depuis un bouton global**. Toutes le créent à partir d'éléments déjà posés : lien entre deux voisins, sélection multiple, ou dépôt d'une carte sur une autre. Everfit fait exception avec son bouton « Add Section », et c'est un outil de coach.

**Piste proposée.** Un format est une porte d'entrée vers le circuit, pas une fonction à côté : choisir EMOM, AMRAP ou Tabata donne d'un coup un conteneur, son compte, sa nature et sa condition de fin, sans jamais rencontrer les mots circuit, cycle, tours ou séries. Le même objet, deux portes.

Cela donnerait un bouton plus à trois entrées de contenu plus une entrée « partir d'un format », et des conteneurs créés depuis les objets eux-mêmes : deux exercices sélectionnés deviennent un circuit, le cycle s'étend par ses bornes.

Cette piste n'a pas été confrontée à ce que le référentiel dit aujourd'hui des formats. **À vérifier avant toute décision.**

---

## 9. Déroulement au défilement

Rédigé le 28/10/2026, validé par Hermann. Les identifiants définitifs seront attribués à l'intégration au chapitre 10.

### 9.0 Le budget est fixé par la règle d'imbrication

SU-04 interdit toute imbrication au delà de cycle puis circuit. Il n'y a donc **jamais plus de deux en-têtes empilées**, et la zone collante a une hauteur maximale connue, de l'ordre de 60 points, que l'implémentation peut réserver une fois pour toutes. C'est la contrainte la plus utile de cette section : elle transforme un comportement potentiellement récursif en un cas fini.

### 9.1 Les huit règles

**D1. Ce qui ne colle jamais.** Les cartes d'exercice, le compte à rebours initial, la fin de séance et les points d'arrêt sont des contenus : ils défilent. Rien ne colle en bas de la zone visible, un élément collé en bas entrant en concurrence avec le bouton Créer et avec la zone de défilement automatique du déplacement.

**D2. Ce qui colle, et à quelle condition exacte.** L'en-tête d'un conteneur colle quand son bord haut est passé au dessus de la zone collante et que son bord bas est encore en dessous. On voit donc l'en-tête du conteneur dans lequel on se trouve, et celui là seulement. Sa raison d'être est de répondre à « où suis-je », pas d'occuper le haut de l'écran.

**D3. La relève entre deux conteneurs frères se fait par poussée, pas par fondu.** Quand le bord haut du conteneur suivant atteint le bas de l'en-tête collée, il la pousse hors de la zone visible et prend sa place. On déroule dans un circuit, son en-tête ne bouge pas, et c'est l'arrivée du suivant qui la déplace vers le haut. La poussée montre la succession ; le fondu l'effacerait.

**D4. Les deux niveaux collent ensemble, et les deux sont nécessaires.** Dans un cycle qui contient des circuits, l'en-tête du cycle reste en haut et celle du circuit se cale juste en dessous. Aucune des deux n'est redondante, parce que **les deux comptes se multiplient** : trois répétitions de cycle sur un circuit de trois tours font neuf passages, et l'utilisateur qui règle un paramètre doit voir les deux nombres en même temps. La différence de largeur, 402 pleine largeur pour la bande du cycle et 386 pour le bloc du circuit, fait lire l'emboîtement sans ajouter de décor.

**D5. Une en-tête collée est l'en-tête, pas sa copie.** Les trois zones tactiles restent actives en position collée : le nombre, la nature, le chevron de repli. Sinon on crée deux sources de vérité pour la même valeur, et l'utilisateur qui voit le nombre devant lui sans pouvoir le toucher en conclut que c'est devenu un affichage.

**D6. Replier depuis une en-tête collée déplace le défilement.** C'est le seul cas où la position de défilement change d'elle-même, et il doit être écrit sous peine de produire un saut. Au repli, le bloc passe à 80 points de haut, cesse de dépasser la zone visible et retomberait brutalement à sa place dans le flux. La règle est que le défilement est ajusté pour amener le bloc replié exactement là où le doigt a touché : l'en-tête ne bouge pas sous le doigt, c'est le reste qui se réorganise.

**D7. Pendant un déplacement, les en-têtes se décollent.** Pendant un appui long, la question n'est plus « où suis-je » mais « où est-ce que ça va atterrir ». Des en-têtes collées masquent physiquement les emplacements de dépôt les plus hauts d'un conteneur et occupent la bande où doit vivre le défilement automatique. L'information nécessaire est portée par autre chose : l'éclairage du conteneur visé, rendu obligatoire par la suppression des poignées, section 6. Les en-têtes reviennent au relâchement.

**D8. Tout défilement provoqué par l'application vise la ligne située sous la zone collante.** Création d'un circuit ou d'un cycle, ajout d'un membre, retour depuis une feuille de paramètres : l'élément concerné est amené juste sous les en-têtes collées, jamais en haut de la zone d'affichage, sinon il naît caché.

### 9.2 Un point à vérifier au montage, non par le raisonnement

Le filet vertical passe à 31 points, c'est à dire dans la marge gauche de l'en-tête, dont le texte commence à 45. En position collée, un fond opaque couperait donc le fil de la séance à chaque en-tête. Il faut que le segment de filet passe devant l'en-tête collée, comme il passe aujourd'hui devant le fond du bloc. Cela ne peut pas être affirmé sans le voir monté.

### 9.3 Ce qui reste à concevoir

- **L'éclairage du conteneur visé pendant un déplacement.** Sa forme visuelle n'est pas dessinée. Elle est devenue porteuse depuis que les poignées ont disparu : à la dernière position d'un conteneur, dedans et dehors sont à deux points l'un de l'autre, et c'est l'éclairage seul qui lève l'ambiguïté avant le relâchement.
- **Les formats comme porte d'entrée du circuit**, section 8, reporté à la définition des formats.

---

## 10. Points ouverts antérieurs : aucun ne reste ouvert

Les quatre décisions isolées lors de la clôture fonctionnelle du 27/10 sont toutes traitées.

- **B.** Fermé le 28/10 sur le maintien de la contrainte, voir la section 4 bis.
- **A. Portée du format quand une séance contient plusieurs circuits ou plusieurs cycles.** Reporté à la définition des formats, décision d'Hermann du 28/10 : la structure d'une composition n'y sera pas remise en question.
- **C. Archivage d'un mouvement : quels exercices comptent comme usage.** **Point périmé, retiré.** Le référentiel y répond déjà. RM-120 : « Un élément archivé reste valable dans ses usages existants mais n'est plus proposé à un nouvel usage. » Et la clarification validée le 27/10, chapitre 10 : archiver ou restaurer conserve l'appartenance et la clé de tri, le membre archivé restant pris en compte dans le calcul des niveaux de la famille complète, seule la visibilité changeant. Ma question venait d'une analogie avec l'archivage d'une séance, qui demande une confirmation conditionnelle parce qu'il **supprime** les routines futures dont la séance est l'unique contenu (RM-008, D-023). Cette analogie ne tient pas : archiver un mouvement ne détruit rien, donc il n'y a rien à confirmer ni aucun usage à compter.
- **D. Contrat de l'action Partager.** Reporté aux discussions sur la communauté, décision d'Hermann du 28/10.
