# KODJO — Évolutions fonctionnelles du 7 octobre 2026

> **Document jumeau du brief d'alignement du code.** Celui-ci porte les **règles métier nouvelles** décidées les 6 et 7 octobre : bip de cadence, règles de durée, modèle de pause, changement de côté, grammaire de la phrase de synthèse.
>
> Il ne contient **aucune valeur de présentation** — ni couleur, ni interligne, ni géométrie, ni jeton. Celles-ci sont dans `BRIEF-ALIGNEMENT-CODE-FIGMA-2026-10-07-v3.md`, qui ne contient lui-même aucune règle fonctionnelle. Les quatre points de contact entre les deux sont au § 2.2 ci-dessous et au § 11.4 du brief, à l'identique.

| | |
|---|---|
| Destinataire | ChatGPT Protocole (orchestration KODJO V2) |
| Demandeur | Hermann (propriétaire du produit) |
| Document jumeau, hors périmètre | `BRIEF-ALIGNEMENT-CODE-FIGMA-2026-10-07-v3.md` |
| Spécification exécutable jointe | `generateur-phrase-activite_v15.xlsx` — 276 combinaisons |
| Figma | fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`) |
| Dépôt | `MyUncried/Application-Routine`, branche `main`, commit de référence `6d03f5b` |
| Prérequis bloquant | migration SQLite `009` — § 3 |
| Préparé le | 2026-10-07 |

**Numérotation.** Les décisions de ce document sont préfixées **DF**, les points à clarifier **CF**. Le brief utilise `D1`–`D13` et une liste numérotée sans préfixe. Les deux espaces de noms sont disjoints : aucun identifiant ne désigne deux choses selon le document où on le lit.

---

## 0. Ce document remplace

Sur le périmètre fonctionnel, il remplace et périme :

| Document | Statut |
|---|---|
| `KODJO_Prompt_MAJ_Documentation_DSF_Developpement.md` (07/10, matin) | périmé — écrit avant le renommage du paramètre |
| `KODJO_Prompt_MAJ_Documentation_Bip_de_cadence.md` | intégré ici |
| `KODJO_Prompt_MAJ_Documentation_Cartes_Duree.md` | partie fonctionnelle intégrée ici ; partie présentation au brief, annexe I |
| `KODJO_Dossier_Cadence_et_Phrase_de_synthese.md` | périmé |
| `KODJO_ALIGNEMENT_UNIFIE_2026-10-07.md` | **abandonné** — fusion impropre des deux périmètres, ne pas utiliser |
| `generateur-phrase-activite_v11` à `v14` | périmés — voir § 8.4 |

Les révisions antérieures du dossier de revue de code (`_V-1`, `_V-2`, `_V-3`) étaient pour deux d'entre elles des copies mal classées du prompt documentaire. Aucune ne fait foi.

---

## 1. Ce qui change, en une page

Le paramètre « Cadence » devient **« Bip de cadence »**. Le renommage n'est pas cosmétique : il dit ce que le paramètre fait — émettre un signal sonore pendant la série — et tout le reste en découle.

1. Le paramètre cesse d'appartenir au mode Répétitions. Il devient **transverse aux trois modes**.
2. C'est le bip qui rend la durée estimable. Sans bip, rien ne cale le rythme : **aucune durée n'est calculée**. L'application n'invente plus de valeur.
3. La convention d'estimation à **2 secondes par répétition est abandonnée**.
4. Il y a une pause **après chaque série, la dernière comprise** — modèle n, et non n − 1. Une récupération posée après une activité **remplace** cette pause finale.
5. Le changement de côté suit deux règles de calcul distinctes selon l'ordre choisi. Cette règle n'avait jamais été écrite ; elle est établie au § 7, et vérifiée sur quatre écrans.

---

## 2. Périmètre

### 2.1 Ce qui est ici

Règles métier : définition des paramètres, calcul des durées, modèle de pause, changement de côté, grammaire de la phrase, règle d'absence de durée sur une carte, états métier des icônes. Modèle de données, validations, comportement moteur.

### 2.2 Ce qui n'est pas ici — les quatre points de contact

Identiques au § 11.4 du brief. Ils sont nommés pour que ni l'une ni l'autre des deux missions ne les traite deux fois ou ne les oublie.

| Point | Ce qui relève du brief | Ce qui relève de ce document |
|---|---|---|
| **Icônes** | existence, tracé, taille, couleur, export, entrée au manifeste | **quand** une icône est au trait ou pleine selon l'état métier — § 10 |
| **Propriété `Durée` des cartes** | la propriété existe et pilote la visibilité du bloc | **la règle qui décide** si une activité a une durée — § 9 |
| **Ligne « Bip de cadence » dans les modales** | sa position, son indentation, son séparateur | **le paramètre lui-même**, sa plage, son effet — § 4 |
| **Jeton `color/action/breakpoint`** | le nom est à revoir | **la fusion** du point d'arrêt et de la récupération sous un concept unique — § 6.1 |

Tout ce qui est couleur, typographie, géométrie, icône au sens graphique, mise en page de modale et format d'affichage de la durée sur les cartes **est au brief**, annexes I et J.

---

## 3. Prérequis bloquant — la migration `009`

Les migrations SQLite s'arrêtent à la **`008`**. `ActivityDefinition` porte encore `repetitionCount`, `seriesCount` et `pauseSeconds` en **propriétés scalaires**. Ces champs ne peuvent représenter ni des séries variables, ni un intervalle de bip, ni des pauses posées à des emplacements choisis.

**La migration `009` — qui introduit `SeriesParameters` et les objets de pause — est le prérequis de tout ce document.** Rien ici n'est implémentable sur le schéma actuel.

Stack de référence confirmée : React Native 0.86, Expo SDK 57, `expo-sqlite`.

**Le brief n'en dépend pas** et peut être exécuté en parallèle. C'est la raison d'être de la séparation en deux documents : fondre les deux aurait fait dépendre l'alignement des couleurs d'une migration de base de données.

---

## 4. Le bip de cadence

### 4.1 Définition

| Propriété | Valeur |
|---|---|
| Libellé affiché | **Bip de cadence** |
| Nature | signal sonore périodique émis **pendant** la série |
| Plage | **0 à 10 secondes** |
| Valeur 0 | s'affiche **« Aucun »** (masculin) |
| Valeur par défaut | Aucun |
| Contrôle | stepper |
| Portée | les **trois** modes d'exécution — Durée, Répétitions, À l'échec |

**Ce que le bip fait** : il émet un signal à intervalle régulier pendant la série, pour que l'utilisateur cale son rythme dessus.

**Ce que le bip ne fait pas** : il n'incrémente pas le compteur de répétitions, ne déclenche aucune transition, et ne termine pas la série. **C'est l'utilisateur qui termine.** Le bip informe le geste, il ne le commande pas.

**Pourquoi la plage s'arrête à 10 secondes.** Une répétition dure entre une et dix secondes : un squat excentrique lent tourne autour de six, un tempo prescrit 3-1-3-1 en fait huit. Au-delà, ce n'est plus un rythme de répétition mais une tenue de position, qui se règle en mode Durée. La plage de 1 à 60 s envisagée précédemment était surdimensionnée et imposait une roulette ; elle est abandonnée.

### 4.2 Modèle de données

| Élément | Nature | Détail |
|---|---|---|
| Intervalle de bip | **renommé et élargi** | L'ancien `repetitionIntervalSeconds` ne décrit plus une propriété des répétitions : le nom doit suivre. Entier **0 à 10**, 0 valant « aucun bip ». Porté par `SeriesParameters`. |
| Validation | **assouplie** | La contrainte « non nul uniquement si mode = Répétitions » **tombe** : le champ est valide dans les trois modes. |
| `estimatedCadenceDurationSeconds` | dérivé | répétitions cibles × intervalle de bip. |
| État moteur | **ajouté** | Ordonnancement du signal périodique pendant la série ; accumulateur de durée réelle distinct du chronomètre. |
| Instantané d'exécution | modifié | Conserve l'intervalle de bip **effectif** de chaque série. |

### 4.3 Comportement à l'exécution

La durée cible s'affiche sur la **ligne de temps écoulé existante**, dans le même style que le compte à rebours. **Aucun écran d'exécution n'est à créer** : l'existant porte déjà toutes les informations.

**Points techniques à qualifier** : précision du signal en arrière-plan sur iOS et Android, comportement écran verrouillé, ordonnancement sans minuteur JavaScript permanent, restauration de l'ancre temporelle après suspension système.

**Ce qui atténue le coût** : l'application porte déjà deux signaux sonores minutés, le compte à rebours et la fin d'exercice. La plomberie audio existe. Ce qui est nouveau, c'est qu'un métronome **se répète pendant plusieurs minutes** là où ces deux-là se déclenchent une fois. C'est ce point précis qu'il faut qualifier, pas l'audio en lui-même.

### 4.4 Place dans l'interface

Le bip appartient à la famille des signaux sonores minutés, qui se lit dans l'ordre temporel : **Compte à rebours** avant l'exercice, **Bip de cadence** pendant, **Fin d'exercice** après.

Dans la modale il est placé **juste au-dessus de « Durée totale »**, parce qu'il en alimente le calcul et que le lecteur doit pouvoir suivre la chaîne du paramètre au résultat. Sur les écrans sans ligne de durée, il se place juste au-dessus de « Compte à rebours ». Il est au **premier niveau**, non indenté. Les valeurs de mise en page sont au brief, annexe J.

### 4.5 Vocabulaire

Le glossaire « cadence / rythme / fréquence » envisagé précédemment **n'a plus d'objet** : le libellé dit maintenant ce que le paramètre fait. **Ne pas l'écrire.**

La phrase de synthèse **conserve ses formulations actuelles** — décision explicite, prise pour ne pas complexifier. Elle continue donc de parler de répétitions « cadencées » là où le libellé dit « bip ». **Écart assumé.**

---

## 5. La durée totale

### 5.1 Au niveau d'une activité

| Mode d'exécution | Bip de cadence | Rendu |
|---|---|---|
| Durée | Aucun | valeur exacte, **aucun symbole** |
| Durée | réglé | valeur exacte, **aucun symbole** |
| Répétitions | Aucun | **durée omise** |
| Répétitions | réglé | `≈` suivi de la valeur |
| À l'échec | Aucun | **durée omise** |
| À l'échec | réglé | **durée omise** |

Trois lectures de ce tableau, à reprendre telles quelles dans la documentation :

**Le bip ne change le résultat qu'en un seul endroit.** Partout ailleurs c'est le mode qui décide : en mode Durée le minuteur impose la valeur, en mode À l'échec la série n'a par définition pas de terme.

**« Omise » signifie que la ligne disparaît** — ni `≥ 0`, ni tiret, ni valeur grisée.

**La présence de pauses ne change jamais le symbole.** Les pauses sont chronométrées, donc toujours déterminables : elles modifient la valeur, pas sa nature.

### 5.2 Au niveau d'une séance

| Composition de la séance | Symbole |
|---|---|
| Toutes les activités en mode Durée | aucun — durée exacte |
| Au moins une activité estimée, aucune sans durée | `≈` |
| Au moins une activité sans durée | `≥` |

**`≥` n'existe pas au niveau d'une activité.** L'asymétrie est voulue : sur une activité, ce qui manque est l'essentiel — le temps de travail — et un minorant construit sur les seules pauses afficherait une minute pour un exercice qui en prend quatre. Sur une séance, ce qui manque est une activité parmi plusieurs : le minorant est alors informatif.

Les `≥` présents dans Figma au niveau séance (`≥ 11 min 3 s` au catalogue des séances, `≥ 21 min` en composition) **restent justifiés** : ces séances contiennent une activité sans durée. Aucun `≥` ne subsiste au niveau activité.

### 5.3 Quatre niveaux de retour, pas un drapeau

La fonction de calcul retourne **quatre niveaux** : `exact`, `estimated`, `lowerBound`, `omitted`.

`omitted` est un **niveau de retour**, pas un zéro accompagné d'un drapeau à interpréter au rendu. Un appelant qui reçoit `omitted` n'affiche pas la ligne ; il ne décide pas d'afficher ou non un zéro.

### 5.4 Convention de calcul

**Durée totale = travail + pauses, à raison d'une pause par série.**

Le compte à rebours et la fin d'exercice **n'y entrent pas**.

Vérification de référence, écran « 13 Répétitions avec cadence » : 4 séries × 15 répétitions × 4 s = 240 s de travail, plus **4** × 15 s de pause = 60 s, soit 300 s, affichés `≈ 5 min`.

---

## 6. Les pauses

### 6.1 Un seul objet, deux types

| Élément | Nature | Détail |
|---|---|---|
| Objet `Pause` | ajouté | Type `recovery` ou `breakpoint`, position dans la séance, et pour `recovery` une durée en secondes |
| `pauseSeconds` sur `ActivityDefinition` | **supprimé** | Remplacé par la collection de pauses de la séance |
| Création automatique de récupération | **supprimée** | Une séance nouvellement composée ne porte **aucune** pause |

L'absence de pause entre deux activités devient un **cas normal**, et non une récupération de durée nulle.

Le moteur doit distinguer « en récupération » de « à l'arrêt sur point d'arrêt » : **deux états, pas un seul avec un drapeau.** C'est le versant fonctionnel du point de contact n° 4 — le jeton `color/action/breakpoint` porte un nom devenu trompeur parce que les deux notions ont fusionné sous un concept unique côté données tout en restant deux états côté moteur.

### 6.2 Pause après chaque série — modèle n

**Il y a une pause après CHAQUE série, la dernière comprise.** Une activité de n séries contient **n** pauses, pas n − 1. Cela vaut aussi avec une seule série et avec un changement de côté.

Le fichier Figma contenait **deux modèles concurrents**, chacun cohérent avec sa propre formulation, maquettés en parallèle sans que la règle ait jamais été arbitrée :

| Formulation | Exemple | Durée | Pauses |
|---|---|---|---|
| « avec 15 s de pause **après chaque série** » | 3 séries de 1 min 30 s | 5 min 15 s | 45 s → **3 pauses (n)** |
| « avec 15 s de pause **entre les séries** » | 3 séries de 1 min 30 s | 5 min | 30 s → **2 pauses (n − 1)** |

La raison du choix n'est pas grammaticale, elle est structurelle : **ce modèle rend l'activité autonome.** Une activité vaut n × (travail + pause), elle se termine par un temps de repos, et c'est ce repos terminal qui la sépare de ce qui suit dans la séance.

### 6.3 Règle de remplacement

Une récupération posée après une activité **remplace** sa pause finale, elle ne s'y ajoute pas. **Il n'y a jamais deux temps de repos consécutifs** : le plus explicite l'emporte.

Exemple déterminant : une activité de 3 × 1 min 30 avec 15 s de pause, suivie d'une récupération de 30 s, vaut **270 + 30 = 300 s**, et non 315 + 30.

**Dernière activité d'une séance** : sa pause finale **ne tombe pas**. Elle ne disparaît que si une récupération la suit et la remplace, selon la même règle.

**Conséquence sur le calcul d'une séance** — ce n'est plus une somme simple :

> séance = Σ [ n × travail + (n − 1) × pause + (récupération si posée, sinon pause) ]

Une activité porte n − 1 pauses internes plus un **temps de repos terminal**, qui vaut la pause de série par défaut et que la récupération écrase. Cette écriture réconcilie les deux modèles observés : l'activité porte bien une pause après chaque série, et c'est la dernière d'entre elles qui sert de point de raccord avec la séance.

**Point de vigilance côté code** : si l'implémentation porte `pause × (séries − 1)` ou un équivalent, **c'est à corriger**.

### 6.4 Placement

Un seul mécanisme pour les deux types. Points de contrôle :

- Entrée en mode placement : les emplacements inter-activités s'affichent en pointillés.
- Chaque emplacement propose **deux blocs côte à côte**, Récupération et Point d'arrêt, de largeur identique et de marges identiques par rapport au cadre de l'exercice.
- **La sélection est multiple** : plusieurs récupérations et plusieurs points d'arrêt en une seule entrée en mode placement. **Le code ne doit pas sortir du mode à la première sélection.**
- La sélection d'une récupération **ouvre immédiatement la modale de durée**, qui doit être renseignée. Valeur proposée `0 min 30 s`.
- Le bouton de confirmation porte le décompte : « Confirmer 2 pauses ajoutées ». Le bouton d'annulation **reste « Annuler »**.
- La valeur de 30 s est un défaut **à l'ajout**, pas un défaut de séance. Ne pas la réintroduire comme valeur d'initialisation.
- Une récupération se supprime comme un point d'arrêt : même geste, même écran de confirmation. **Parité fonctionnelle à vérifier.**

### 6.5 Récupération à zéro — règles d'affichage, non de données

Une récupération à 0 s **existe en base**. Ce qui change, c'est son rendu.

| Cas | Rendu |
|---|---|
| 0 s, aucun point d'arrêt à cet emplacement | ligne entière supprimée, composition réordonnée |
| 0 s, point d'arrêt présent | mention et icône de récupération supprimées, point d'arrêt conservé, trait horizontal étendu à gauche jusqu'au bord gauche de l'emplacement d'icône vide |
| 0 s après la dernière activité | ligne supprimée |

**À tester comme règles d'affichage.** Un test qui vérifierait l'absence de la récupération en base passerait à tort.

### 6.6 Reprise des séances existantes

**Aucune.** Décision explicite : le projet est en conception, la migration des séances déjà composées n'est pas traitée.

---

## 7. Le changement de côté — règle établie le 7 octobre

La règle de calcul du changement de côté **n'avait jamais été écrite**. Elle était signalée comme non vérifiée dans le classeur v13 et v14, avec trois écrans réputés irréconciliables.

Elle est établie ici, et **les quatre écrans concernés tombent juste**.

### 7.1 Les deux règles

Pour une activité de n séries, de travail total Σw, de pauses de série totales Σp, avec une pause de changement de côté q :

| Ordre des côtés | Durée totale | Pourquoi |
|---|---|---|
| **Sans changement** | Σw + Σp | — |
| **Les deux côtés à chaque série** | **2 Σw + Σp + n·q** | une série = côté droit, pause de côté, côté gauche ; **puis une seule pause de série** |
| **Un côté après l'autre** | **2 Σw + 2 Σp + q** | l'activité entière est jouée à droite, **un seul** changement, puis jouée à gauche |

La différence tient à ce que le changement de côté coupe : dans le premier cas il coupe **chaque série**, donc il y a n changements et la pause de série reste unique par série ; dans le second il coupe **l'activité**, donc il n'y a qu'un changement mais chaque moitié porte son jeu complet de pauses de série.

### 7.2 Vérification

| Écran Figma | Paramètres | Calcul | Affiché |
|---|---|---|---|
| « Ordre des côtés — 7 », modales 9 et 9b | 3 × 1 min 30, pause 15 s, un côté après l'autre, q = 10 s | 2×270 + 2×45 + 10 = **640 s** | **10 min 40 s** ✓ |
| « Séries variables + Les deux côtés à chaque série — 9 » (scénario D) | 30/45/60 s, pauses 10/20/30 s, les deux côtés, q = 15 s | 2×135 + 60 + 3×15 = **375 s** | **6 min 15 s** ✓ |
| « Résumé — 15 Durée variable bilatérale Par série » | idem scénario D | **375 s** | **6 min 15 s** ✓ |
| « Une seule série — 10 » | 1 × 1 min 30, pause 15 s, un côté après l'autre, q = 10 s | 2×90 + 2×15 + 10 = **220 s** | **3 min 40 s** ✓ |

Les trois écrans auparavant déclarés irréconciliables le sont donc tous, à la seconde près, dès lors que l'ordre des côtés est pris en compte. **Le point ouvert E9 des documents antérieurs est clos** — à une réserve près, CF1.

### 7.3 La règle était déjà dans la maquette

L'écran « Ordre des côtés — 7 » porte, sous le contrôle segmenté, une légende qui énonce la règle :

> **« Pause entre les côtés ×1 · Pause après chaque série ×6 »**

pour une activité de **3 séries** en « un côté après l'autre » : une seule pause de côté, et six pauses de série — soit 2n. C'est exactement la formule du § 7.1. Les deux sous-titres du contrôle la disent aussi en notation de séquence : `(D1 → D2) → (G1 → G2)` pour « un côté après l'autre », `(D1 → G1) → (D2 → G2)` pour « les deux côtés à chaque série ».

**La règle n'était donc pas à inventer, elle était à lire.** Les documents antérieurs la déclaraient inexistante parce qu'ils avaient cherché dans le texte des spécifications, pas dans la maquette.

**Manque** : la légende n'existe que pour l'option sélectionnée. Son pendant, pour « les deux côtés à chaque série » et 3 séries, doit lire **« Pause entre les côtés ×3 · Pause après chaque série ×3 »**.

---

## 8. La phrase de synthèse

### 8.1 Nature

La phrase est **un texte unique généré à la validation des paramètres**, avec des plages en gras. Plus d'assemblage de segments positionnés.

Ses caractéristiques typographiques sont au brief, annexe J.3. Fonctionnellement, deux points comptent :

**Toute la zone ouvre la modale ; aucun segment n'est cliquable isolément.** Rien dans le rendu ne doit donc promettre une action ciblée — c'est la raison pour laquelle les fonds gris et les valeurs bleues ont été retirés.

**Une virgule ne doit jamais se retrouver isolée en début de ligne.**

### 8.2 Deux points de conception non négociables

**Le générateur retourne des segments, pas une chaîne** : `[{texte, gras}]`, que React Native rend en `<Text>` imbriqués. Une chaîne obligerait à retrouver les plages de gras par recherche de sous-chaînes, ce qui casse dès qu'une valeur apparaît deux fois — et « 15 s » apparaît deux fois dans la plupart des phrases à changement de côté.

**La phrase n'est pas persistée.** Elle se régénère à partir des paramètres à chaque affichage. Stockée, elle resterait fausse dans les séances créées avant un changement de règle — ce qui s'est produit deux fois en une journée.

### 8.3 Grammaire

Cinq groupes, dans cet ordre fixe. Chaque groupe est omis quand sa condition n'est pas remplie.

| Groupe | Condition | Texte |
|---|---|---|
| 1 | toujours | `{N} série` · `{N} séries` |
| 2a | mode Durée, séries uniformes | `de {durée}` |
| 2b | mode Durée, variables, ≤ 3 séries | `de durée variable ({d1}, {d2} puis {d3})` |
| 2b′ | mode Durée, variables, > 3 séries | `variables, de {min} à {max}` |
| 2c | mode Répétitions, séries uniformes | `de {R} répétitions` |
| 2d | mode Répétitions, variables, ≤ 3 séries | `de {r1}, {r2} puis {r3} répétitions` |
| 2d′ | mode Répétitions, variables, > 3 séries | `variables, de {min} à {max} répétitions` |
| 2e | mode Répétitions, bip réglé | suffixe accolé aux répétitions : `cadencées toutes les {bip}` |
| 2f | mode À l'échec | `menée jusqu'à l'échec` · `menées jusqu'à l'échec` |
| 3a | séries uniformes, pause > 0 | `, avec {pause} de pause après chaque série` |
| 3b | plusieurs séries uniformes, pause = 0 | `, enchaînées sans pause` |
| 3c | séries variables | omis — la pause figure dans l'énumération |
| 4a | aucun changement de côté | **omis** |
| 4b | une seule série | `, en faisant le côté droit puis le gauche` |
| 4c | plusieurs séries, les deux côtés à chaque série | `, en alternant le côté droit puis le gauche à chaque série` |
| 4d | plusieurs séries, un côté après l'autre | `, en faisant d'abord toutes les séries à droite, puis à gauche` |
| 4e | changement de côté, pause > 0 | suffixe : `, avec {pause côtés} de pause au changement de côté` |
| 5a | mode Durée | ` Durée totale : {total}.` |
| 5b | mode Répétitions, bip réglé | ` Durée totale : ≈ {total}.` |
| 5c | mode Répétitions, bip à Aucun | **omis** |
| 5d | mode À l'échec | **omis** |
| 5e | une série, mode Durée, sans côté et sans pause | omis — égale à la durée de la série |

**Règles d'arbitrage :**

- Énumération jusqu'à 3 séries variables ; au-delà, intervalle.
- Avec une seule série, la pause **est mentionnée** : le paramètre a un effet. La formulation reste « après chaque série », pour une seule forme dans tous les cas.
- Avec une seule série, l'ordre des côtés n'a pas d'effet **sur le texte** : une seule formulation. Il en a un sur la durée — voir CF1.
- Pour des pauses variables, la liste compte **n valeurs**.
- Le mode d'exécution n'entre pas dans le texte ; il est affiché à part.
- Accords : série/séries, menée/menées.
- **Formulations abandonnées, à ne pas réintroduire** : `D→G` et autres abréviations ; « séparées par » ; « entre les séries » ; « Pause de 15 s par série » dans les formes compactes de carte, remplacée par « Pause de {valeur} par série ».

### 8.4 Le classeur fait référence et sert de jeu de tests

`generateur-phrase-activite_v15.xlsx` porte la grammaire, les **276 combinaisons** et les règles de calcul, sur quatre feuilles : *Grammaire*, *Toutes les phrases*, *Calcul des durées*, *Changements v14 → v15*.

| Version | Statut |
|---|---|
| v11, v12 | périmées |
| v13 | périmée — modèle n − 1, convention de 2 s par répétition |
| v14 | périmée — **convention des côtés fausse**, héritée de la v13 |
| **v15** | **fait référence** |

Ce que la v15 corrige : la v14 calculait tout changement de côté comme « total × 2, plus la pause de côté une fois ». C'est juste pour « un côté après l'autre » **et faux pour « les deux côtés à chaque série »**, où la pause de côté intervient n fois et la pause de série n'est pas doublée. Les durées des cas à changement de côté changent donc entre v14 et v15 ; les phrases, elles, sont inchangées.

**Tâche obligatoire** : un test lit les 276 lignes et compare la sortie du générateur à la colonne « Phrase générée », et sa durée à la colonne « Durée totale ». Le code et la spécification ont divergé deux fois en une journée ; ce test est ce qui l'empêche.

**Répartition des 276 cas** : 140 sans durée (Répétitions sans bip, À l'échec), 46 avec `≈`, 90 avec une durée exacte sans symbole. Aucun `≥`.

**Encombrement maximal** : le cas le plus long atteint **224 caractères**. Mesuré dans Figma à la largeur de 324 px et à l'interligne de 20 px, il occupe **cinq lignes, soit 100 px** — et non six lignes comme estimé auparavant.

L'écran de référence porte désormais ce cas exact et s'appelle **« Création activité — Phrase longue (224 caractères) »**. Vérifié : le bloc et la carte qui le contient s'étendent sans rogner la ligne « Compte à rebours / Fin d'exercice » qui suit. Le point de contrôle « vérifier que le bloc s'étend au-delà de 192 px » est donc **levé**.

### 8.5 Internationalisation — risque à consigner

Une phrase assemblée par morceaux est **intraduisible en l'état** : l'ordre des groupes, les accords et la place des virgules sont du français. Tant que l'application est monolingue le coût est nul ; le jour où elle cesse de l'être, c'est une réécriture vers un format à règles de pluriel et de genre. **À inscrire dans la documentation pour que la décision soit prise les yeux ouverts.**

---

## 9. La durée d'une carte — quand elle est absente

Le brief établit que la durée est un **champ optionnel au rendu** de la carte, piloté par une propriété booléenne. La règle qui décide de sa valeur est ici, et c'est la même que celle du § 5.1 :

| Situation | Affichage |
|---|---|
| Mode Durée | la durée |
| Mode Répétitions **avec** bip | `≈` suivi de la durée |
| Mode Répétitions **sans** bip | **rien** |
| Mode À l'échec | voir CF2 |

**Une carte affiche sa durée quand elle en a une.** Côté développement, cela se lit comme un champ optionnel, non comme une valeur à zéro.

**Règle de méthode, à inscrire** : une donnée qui varie d'une instance à l'autre se traite par une propriété de composant, jamais par une surcharge de visibilité. L'incident qui a motivé cette règle est consigné au brief, § 11.6.

---

## 10. États métier des icônes

Versant fonctionnel du point de contact n° 1. Le tracé, la taille, la couleur et l'export sont au brief, annexe E.

| État métier | Icône | Cercle |
|---|---|---|
| Repos | icône **au trait** | fond blanc, contour fin |
| Activé | icône **pleine**, remplie de bleu `#0508E5` | **inchangé** |

Points de contrôle :

- Le cercle ne change **ni de fond ni d'épaisseur de contour** entre les deux états. Si le code bascule un fond bleu, un contour épaissi ou un fond pâle, **c'est à retirer** : ces trois options ont été explicitement écartées.
- Le couple d'icônes doit être **le même tracé à deux remplissages**, pas deux dessins différents. Un changement de forme au basculement se voit comme un clignotement.
- Le signe `+` n'a pas de version pleine : pas de cas d'usage identifié.

Référence Figma : « Boutons d'action contextuelle — repos et activé » (`7245:13718`). Vérifié : contour et plein y sont bien le même tracé dans chacun des trois couples.

---

## 11. Vérification arithmétique de Figma

Faite le 07/10 sur les 24 modales et les 31 phrases de la page « Prototype MVP ». Chaque durée affichée a été recalculée à partir des paramètres du même écran.

### 11.1 Ce qui tombe juste — le modèle n est confirmé

| Écrans | Paramètres | Calcul | Affiché |
|---|---|---|---|
| Modales 4, 5, 6, 7, 8, 12, 9b et quatre écrans dérivés | 3 × 1 min 30, pause 15 s | 270 + 3×15 = 315 s | 5 min 15 s ✓ |
| « 13 Répétitions avec cadence » | 4 × 15 rép. × 4 s, pause 15 s | 240 + 4×15 = 300 s | ≈ 5 min ✓ |
| Scénario A, « 13 Tableau masqué », « 14 Déplacement » | 30/45/60 s, pauses 10/20/30 s | 135 + 60 = 195 s | 3 min 15 s ✓ |
| Les quatre écrans à changement de côté | § 7.2 | § 7.2 | ✓ |

Le modèle n − 1 aurait donné 5 min, 4 min 45 s et 2 min 45 s. **Aucun écran ne s'y réconcilie.**

### 11.2 Figma est aligné — les 31 phrases sont conformes

L'alignement a été fait le 07/10 : **les 31 phrases de la page sont désormais exactement ce que le générateur v15 produit à partir des paramètres de leur propre écran.** Vingt-cinq ont été réécrites. Aucune formulation abandonnée ne subsiste : zéro occurrence de « entre les séries », « séparées par », « (de … et … ) » ou de clause de côté abrégée.

**Corrections de fond**

| Écran | Constat | Correction |
|---|---|---|
| « Séries variables — 5 Douze séries » | durée totale `5 min 20 s` pour 390 s de travail et 120 s de pauses, soit 510 s. L'écart de 3 minutes exactes trahit une faute de frappe sur un calcul déjà fait en n − 1 (8 min 20 s). | durée portée à **8 min 30 s** |
| idem, phrase | énumérait « de 20 s, 25 s, 30 s… » — forme élidée absente de la grammaire — et annonçait une alternance de côtés que la modale du même écran contredit | réécrite selon 2b′ : **« 12 séries variables, de 20 s à 45 s. Durée totale : 8 min 30 s. »** |
| **Modales 9 et 9b** | la phrase affichait « 5 min 15 s » sans clause de côté quand la modale du même écran affichait un changement de côté, 10 s de pause de côté et **10 min 40 s** | phrase régénérée depuis les paramètres de la modale : clauses 4d et 4e ajoutées, durée **10 min 40 s** |
| **« Résumé — 15 »** | portait la clause 4d quand son nom et son arithmétique disent 4c | clause **4c** |
| **« 14 Déplacement d'une série »** | énumérait 30 s, 45 s, 1 min alors que le tableau du même écran, après déplacement, est dans l'ordre 45 s, 1 min, 30 s | énumération alignée sur le tableau |
| **« Changement de mode — 11 »** | phrase en « durée variable » alors que le mode de l'écran est Répétitions | **« répétitions variables »** |
| **« 13 Répétitions avec cadence »**, champ `Paramètres d'exécution` | affichait `≈ 4 min 45 s` — une durée, calculée en n − 1 — là où les vingt autres écrans affichent le **mode** | **« Répétitions »** |
| **« Phrase longue »**, même champ | affichait « Durée » alors que sa phrase est en mode Répétitions | **« Répétitions »** |

**Corrections de forme**

| Objet | Avant | Après | Écrans |
|---|---|---|---|
| Clause 4e, pause de côté | absente | `, avec {q} de pause au changement de côté` | 5 |
| Énumération variable | « (de 30 s, 45 s **et** 1 min) », « 12, 10 **et** 8 » | « (30 s, 45 s **puis** 1 min) », « 12, 10 **puis** 8 » | 7 |
| Clauses de côté | « droite puis gauche, un côté après l'autre » | forme complète de la grammaire (4b, 4c, 4d) | 3 |
| Point final après la durée | omis | présent, conformément à 5a et 5b | 21 |

**Mise en page.** L'allongement des phrases a fait déborder huit conteneurs, qui rognaient la ligne « Compte à rebours / Fin d'exercice ». Les cadres concernés épousent désormais leur contenu (`primaryAxisSizingMode = AUTO`) au lieu d'une hauteur figée : écrans 9, 9b, « Ordre des côtés — 7 », « Une seule série — 10 », « Résumé — 15 », « Phrase longue », plus deux débordements d'un pixel préexistants sur « Modifier un exercice » et « Ajouter un exercice — Zones corporelles ». Contrôle final : **aucun débordement sur les 31 blocs**.

**Écran de référence.** « Phrase longue » portait un cas de 182 caractères. Il porte désormais le **véritable cas le plus long des 276**, à 224 caractères, et son nom suit. Voir § 8.4.

### 11.3 Ce qui n'a pas été aligné, et pourquoi

Un seul point, et il ne relève pas de la grammaire de la phrase.

**La forme compacte des cartes n'a pas de grammaire écrite.** Seize écrans de composition de séance affichent un changement de côté sous la forme **`D→G`**, accompagné de `3 × 1 min 30`. La grammaire de la phrase proscrit les abréviations, mais elle ne régit pas les formes compactes de carte, qui n'ont jamais été spécifiées et qui disposent de beaucoup moins de place. Les remplacer demanderait d'écrire d'abord cette grammaire-là. **À décider séparément** ; en attendant, `D→G` est conservé tel quel sur les seize écrans.

---

## 12. Énoncés devenus faux, à retirer de la documentation

| Énoncé | Statut |
|---|---|
| « Cadence », comme nom du paramètre | remplacé par « Bip de cadence » |
| Le paramètre n'existe qu'en mode Répétitions | faux — transverse aux trois modes |
| Plage de 1 à 60 secondes | remplacée par 0 à 10 |
| La valeur « Aucune » | devient « Aucun », et vaut 0 sur le stepper |
| Sélection par roulette | remplacée par un stepper |
| Convention de 2 s par répétition | **supprimée** — ni estimation, ni valeur de migration, ni repli |
| En mode Répétitions sans cadence, durée notée `≥` | faux — la durée est omise |
| En mode Répétitions non cadencé, durée notée `≈` | faux — la durée est omise |
| En mode Répétitions avec cadence, aucun symbole | faux — le symbole est `≈` |
| `≥` au niveau d'une activité | n'existe plus ; `≥` ne subsiste qu'au niveau séance |
| Glossaire cadence / rythme / fréquence | sans objet, **ne pas écrire** |
| Cadence indentée sous Répétitions | faux — premier niveau |
| La cadence est un paramètre purement déclaratif, sans effet à l'exécution | faux — le bip est émis pendant la série |
| « avec 15 s de pause **entre les séries** », « **séparées par** 15 s de pause » | remplacés par « après chaque série » |
| Toute durée calculée sur n − 1 pauses | fausse — une pause par série, la dernière comprise |
| La durée d'une séance est la somme des durées d'activités | faux — la récupération remplace la pause finale, § 6.3 |
| Une récupération est créée automatiquement entre deux activités | faux — une séance nouvellement composée ne porte aucune pause |
| Le changement de côté vaut « total × 2 plus une pause de côté » | faux pour « les deux côtés à chaque série » — § 7 |
| La règle de la pause entre côtés n'est pas écrite | **périmé** — elle l'est, § 7 |
| Toute carte affiche une durée | faux — § 9 |
| Écran « 14 Cadence (roulette ouverte) » | supprimé |

---

## 13. Points à clarifier avant le plan (`CLARIFICATION_REQUIRED`)

| N° | Point | Impact |
|---|---|---|
| **CF1** | **Une seule série avec changement de côté.** La grammaire dit que l'ordre des côtés n'a pas d'effet ; c'est vrai du texte, faux de la durée. « Une seule série — 10 » applique le modèle « un côté après l'autre » (2 pauses de série, 220 s) ; le modèle « les deux côtés à chaque série » donnerait 205 s. Le générateur v15 retient le premier. **Confirmer.** | durées, générateur |
| **CF2** | **L'emplacement de la durée sur les cartes accueille aussi un libellé.** Trois cartes voisines du catalogue montrent trois choses au même endroit : une durée (`5 min 15 s`), une mention de mode (`à l'échec`), et rien pour une activité en Répétitions sans bip. **Trancher** : soit l'emplacement n'accueille que des durées et « à l'échec » en sort, soit il accueille un libellé d'état et le cas sans bip en reçoit un. | § 9, rendu des cartes |
| **CF3** | **Forme compacte des cartes.** `D→G` subsiste sur 16 écrans de composition parce que la forme compacte n'a pas de grammaire écrite (§ 11.3). **Écrire cette grammaire, ou acter l'abréviation.** | cartes de composition |
| **CF4** | **Reprise des séances existantes** : décidée à « aucune » (§ 6.6) au motif que le projet est en conception. **Confirmer** que cela vaut encore au moment du développement. | migration 009 |

---

## 14. Ordre d'exécution et articulation avec le brief

| Tranche | Contenu | Dépend de |
|---|---|---|
| **F-0** | **Documentation fonctionnelle** — ce document intégralement | CF1 à CF4 |
| **F-1** | **Migration `009`** — `SeriesParameters`, objets de pause, intervalle de bip | F-0 |
| **F-2** | Bip de cadence : modèle, validation, moteur audio (§ 4) | F-1 |
| **F-3** | Durées : quatre niveaux de retour, règles activité et séance (§ 5) | F-1 |
| **F-4** | Pauses : objet, modèle n, remplacement, placement (§ 6) | F-1 |
| **F-5** | Changement de côté (§ 7) | F-3, F-4 |
| **F-6** | Générateur de phrase et son test sur les 276 cas (§ 8) | F-2 à F-5 |
| **F-7** | Durée optionnelle des cartes (§ 9) | F-3, **et tranche T-I du brief** |
| **F-8** | États métier des icônes (§ 10) | **tranche T-D du brief** |

**F-0 précède tout** : la documentation est mise à jour avant le code.

**Articulation avec le brief** : aucune tranche du brief ne dépend de la migration `009`, et seules F-7 et F-8 attendent une tranche du brief. Les deux missions peuvent donc courir en parallèle, avec deux points de rendez-vous seulement.

---

## 15. Critères d'acceptation et preuves

1. **Test du générateur** : les 276 lignes de `generateur-phrase-activite_v15.xlsx` passent, phrase **et** durée comparées colonne par colonne.
2. Le mot « Cadence » n'apparaît plus seul, ni dans le code ni dans la documentation : le paramètre s'appelle « Bip de cadence ».
3. La convention de 2 s par répétition n'apparaît nulle part — ni estimation, ni valeur de migration, ni repli.
4. Aucune occurrence de `pause × (séries − 1)` ou équivalent : le modèle est n.
5. Aucune occurrence de `total × 2 + pause_côtés` appliquée indistinctement : les deux ordres ont deux formules (§ 7.1).
6. La fonction de durée retourne **quatre niveaux** ; `omitted` n'est jamais un zéro drapeauté.
7. Aucun `≥` produit au niveau d'une activité.
8. Le champ d'intervalle de bip est valide dans les trois modes ; la contrainte « mode = Répétitions » est retirée.
9. Une séance nouvellement composée ne porte **aucune** pause.
10. Les trois règles d'affichage de la récupération à zéro (§ 6.5) sont testées **comme règles d'affichage**, sur la présence en base.
11. Le mode placement ne sort pas à la première sélection.
12. La phrase n'est persistée nulle part.
13. Suites existantes (`jest`, e2e) au vert ; résultats joints.
14. Rapport de mission versionné selon `CLAUDE.md` (chemin, hash du commit, état Git, tests).

---

# Annexe A — Écrans de référence dans Figma

Page « Prototype MVP » (`510:101`). Mesuré le 07/10.

## A.1 Les 24 modales portant la ligne « Bip de cadence »

Les 24 la portent, sans exception. Les 14 marquées **P** portent aussi la ligne « Pause après chaque série ».

| | Écran | Identifiant |
|---|---|---|
| P | Création activité — Paramètres en modale — 2 Modale ouverte (champs vides) | `6407:9551` |
| P | Création activité — Paramètres en modale — 4 Modale complète — mode activé | `6407:9805` |
| P | Création activité — Paramètres en modale — 5 Modale complète — steppers (séries, pauses) | `6407:9966` |
| P | Création activité — Paramètres en modale — 6 Durée activée (roulette ouverte) | `6407:10127` |
| P | Création activité — Paramètres en modale — 8 Changement de côté activé (contrôle segmenté) | `6407:10481` |
| P | Création activité — Paramètres en modale — 7 Durée totale activée (roulette ouverte) | `6411:9546` |
| P | Création activité — Paramètres en modale — 9 Avec changement de côté | `6411:9649` |
| P | Création activité — Paramètres en modale — 10 Répétitions (mode activé) | `6419:9847` |
| P | Création activité — Paramètres en modale — 11 À l'échec (mode activé) | `6419:10028` |
| P | Création activité — Paramètres en modale — 12 Modale complète — durée totale ajustée | `6423:9953` |
| | Séries variables — 2 Durée variable (scénario A) | `6665:24616` |
| | Séries variables — 3 Répétitions variables (scénario E) | `6665:24844` |
| | Séries variables — 4 À l'échec variable (scénario F) | `6665:25072` |
| | Séries variables — 5 Douze séries (défilement — haut) | `6665:25277` |
| P | Ordre des côtés — 7 Sélection : Un côté après l'autre | `6665:26185` |
| | Séries variables + Les deux côtés à chaque série — 9 (scénario D) | `6665:26575` |
| P | Une seule série — 10 Options sans effet | `6665:26822` |
| | Changement de mode — 11 Cibles à renseigner | `6665:27008` |
| | Validation impossible — 12 Série incomplète | `6665:27232` |
| | Séries variables — 13 Tableau masqué | `6665:27458` |
| | Séries variables — 14 Déplacement d'une série | `6665:27608` |
| P | Création activité — Paramètres en modale — 13 Répétitions avec cadence | `7059:13302` |
| P | Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | `7069:13464` |
| P | Création activité — Paramètres en modale — 10b Répétitions (copie) | `7069:13573` |

## A.2 Les 19 écrans portant une phrase avec « de pause après chaque série »

Modifier un exercice · Modal — Abandonner la création de l'activité · Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression · Création activité — Paramètres en modale — 3 Texte affiché · 4 Modale complète — mode activé · 5 Modale complète — steppers · 6 Durée activée · 8 Changement de côté activé · 7 Durée totale activée · 9 Avec changement de côté · 10 Répétitions · 11 À l'échec · 12 Durée totale ajustée · Ordre des côtés — 7 · Une seule série — 10 · 13 Répétitions avec cadence · 9b (copie) · 10b (copie) · Création activité — Phrase longue (182 caractères).

**Aucune formulation abandonnée ne subsiste** : zéro occurrence de « entre les séries » ou « séparées par » sur la page.

## A.3 Écran supprimé

**« Création activité — Paramètres en modale — 14 Cadence (roulette ouverte) »**. Il n'existait que pour montrer la roulette de sélection de la cadence ; le passage au stepper l'a rendu sans objet.

---

# Annexe B — Le classeur, mode d'emploi

`generateur-phrase-activite_v15.xlsx`, quatre feuilles.

| Feuille | Contenu | Usage |
|---|---|---|
| **Grammaire** | les 22 règles de groupe et les 11 règles d'arbitrage | spécification de la phrase |
| **Toutes les phrases** | 276 lignes : 8 colonnes de paramètres, la phrase générée, la durée, le symbole, le nombre de caractères | **jeu de tests** |
| **Calcul des durées** | effort, pauses, changement de côté, symbole, par mode ; les réconciliations avec Figma | spécification du calcul |
| **Changements v14 → v15** | ce que corrige la v15 | revue |

**Espace de combinaisons** : 3 modes × {uniforme, variable} × {1, 3, 6} séries × {Aucun, 4 s} de bip × {0, 15 s} de pause × {aucun côté, les deux à chaque série, un côté après l'autre} × {0, 5 s} de pause de côté, moins les combinaisons impossibles — 276 cas.

**Ce que le classeur ne couvre pas** : les valeurs exactes des écrans Figma, qui emploient des pauses de côté de 10 et 15 s hors de la grille. Les formules du § 7.1 les reproduisent exactement ; le classeur échantillonne, il n'énumère pas.

---

# Annexe C — Écrans à reprendre dans la documentation

**Portée de cette annexe.** Elle liste, écran par écran, **ce qui a changé les 6 et 7 octobre** sur la page « Prototype MVP ». C'est la liste de travail de la mise à jour documentaire : tout écran absent d'ici n'a pas bougé et n'est pas à relire.

L'annexe A, elle, liste les écrans qui *portent* un paramètre. Les deux ne se confondent pas : un écran peut porter le bip de cadence sans avoir changé autrement.

État mesuré dans Figma le 07/10.

## C.1 Écrans créés — 9

| Écran | Identifiant | Raison |
|---|---|---|
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | `7059:13302` | cas de référence du bip réglé |
| Création activité — Paramètres en modale — 9b Avec changement de côté (copie) | `7069:13464` | variante de l'écran 9 |
| Création activité — Paramètres en modale — 10b Répétitions (copie) | `7069:13573` | variante de l'écran 10 |
| Création activité — Phrase longue (224 caractères) | `7119:27855` | essai typographique du cas le plus long |
| Composition d'une séance — Placement d'une pause | `7167:13503` | mécanisme unique récupération / point d'arrêt |
| Composition d'une séance — Durée de récupération (modale) | `7173:13521` | idem |
| Composition séance — Retirer une récupération | `7296:13696` | parité de suppression avec le point d'arrêt |
| Boutons d'action contextuelle — repos et activé | `7245:13718` | **planche de référence** des états d'icône |
| Icônes retenues — Récupération / Durée / Point d'arrêt / Générique | `7174:13554` | **planche de référence** des icônes |

Les deux planches de référence font foi pour le DSF.

## C.2 Écrans supprimés — 2

| Écran | Identifiant | Raison |
|---|---|---|
| Création activité — Paramètres en modale — 14 Cadence (roulette ouverte) | — | n'existait que pour la roulette, remplacée par un stepper |
| Composition d'une séance — Placement d'un point d'arrêt | `4893:6675` | remplacé par « Placement d'une pause » |

## C.3 Écran renommé — 1

| Avant | Après |
|---|---|
| Création activité — Phrase longue (**182** caractères) | Création activité — Phrase longue (**224** caractères) |

## C.4 Écrans modifiés — 29

Légende des changements :
**B** ligne « Bip de cadence » ajoutée · **P** libellé « Pause après chaque série » rétabli et stepper renommé · **T** phrase de synthèse réécrite · **D** durée corrigée · **S** ligne « Durée totale » supprimée · **H** conteneur de phrase recalé · **M** champ « Paramètres d'exécution » corrigé

| Écran | Identifiant | | Détail |
|---|---|---|---|
| 2 Modale ouverte (champs vides) | `6407:9551` | B P | — |
| 3 Texte affiché | `6407:9702` | T | point final après la durée |
| 4 Modale complète — mode activé | `6407:9805` | B P T | — |
| 5 Modale complète — steppers | `6407:9966` | B P T | — |
| 6 Durée activée (roulette ouverte) | `6407:10127` | B P T | — |
| 7 Durée totale activée (roulette ouverte) | `6411:9546` | B P T | — |
| 8 Changement de côté activé | `6407:10481` | B P T | — |
| 9 Avec changement de côté | `6411:9649` | B P T H | phrase contredisait sa modale : clauses de côté ajoutées, durée **5 min 15 s → 10 min 40 s** |
| 10 Répétitions (mode activé) | `6419:9847` | B T **S** | stepper de bip à « Aucun » ; modale raccourcie de 42 px par le haut |
| 11 À l'échec (mode activé) | `6419:10028` | B P | — |
| 12 Modale complète — durée ajustée | `6423:9953` | B P T | — |
| 13 Répétitions avec cadence | `7059:13302` | B P T D **M** | bip converti en stepper (4 s), passé au premier niveau au-dessus de « Durée totale » ; durée **≈ 4 min 45 s → ≈ 5 min** |
| 9b Avec changement de côté (copie) | `7069:13464` | B P T H | idem écran 9 |
| 10b Répétitions (copie) | `7069:13573` | B **S** | idem écran 10 ; trait au-dessus de « Séries variables » corrigé (314 px depuis x = 52) |
| Séries variables — 2 (scénario A) | `6665:24616` | B T | énumération « puis », point final |
| Séries variables — 3 Répétitions variables (scénario E) | `6665:24844` | B T **S** | phrase ramenée à « 3 séries de 12, 10 puis 8 répétitions. » |
| Séries variables — 4 À l'échec variable (scénario F) | `6665:25072` | B | — |
| Séries variables — 5 Douze séries | `6665:25277` | B T **D** | durée **5 min 20 s → 8 min 30 s** ; phrase refaite en forme intervalle, clause de côté retirée (la modale dit « sans changement ») |
| Séries variables — 13 Tableau masqué | `6665:27458` | B T | — |
| Séries variables — 14 Déplacement d'une série | `6665:27608` | B T | énumération alignée sur l'ordre réel du tableau après déplacement |
| Ordre des côtés — 7 | `6665:26185` | B P T H | clauses de côté en forme longue, clause de pause de côté ajoutée |
| Séries variables + Les deux côtés — 9 (scénario D) | `6665:26575` | B T | clause de pause de côté ajoutée |
| Une seule série — 10 Options sans effet | `6665:26822` | B P T H | — |
| Changement de mode — 11 Cibles à renseigner | `6665:27008` | B T **S** | phrase passée de « durée variable » à « répétitions variables » : le mode de l'écran est Répétitions |
| Validation impossible — 12 Série incomplète | `6665:27232` | B T | — |
| Résumé — 15 Durée variable bilatérale Par série | `6665:27862` | T H | clause 4d → **4c**, conforme au nom de l'écran et à son arithmétique |
| Modifier un exercice | `4734:6342` | T H | — |
| Modal — Abandonner la création de l'activité | `4714:6241` | T | — |
| Ajouter un exercice — Zones corporelles — Appui long | `4861:6348` | T H | — |
| Création activité — Phrase longue | `7119:27855` | T H **M** | porté au cas le plus long des 276 : 224 caractères, 5 lignes, 100 px |

**Récapitulatif mesuré** : 24 écrans portent la ligne « Bip de cadence » ; 15 portent le stepper « Pause après chaque série » renommé ; 25 phrases réécrites ; 8 conteneurs recalés ; 0 occurrence des formulations abandonnées.

## C.5 Ce qui n'est pas un écran — changements de composant

Ces changements se propagent à **toutes** les instances. Ils ne se documentent pas écran par écran, mais une fois, au niveau du composant.

| Composant | Changement | Instances |
|---|---|---|
| `DSF / Cards / Exercice` | propriété `Durée#7344:0` ; durée sans cadre, en gras, alignée à droite ; colonne de titre 207 → 250 px | 82 |
| `DSF / Cards / Séance` | propriété `Durée#7344:11` ; même format de durée | 187 |
| `DSF / Forms / Valeur modifiable` | axe `État` (`Normal` / `Grisé`) — 4 variantes | — |
| `DSF / Forms / Roulette` | variante `État=Secondes avec unité` (`7130:13496`) | — |
| `Ressenti` | 48 × 48 → 20 × 20, sans zone tactile | — |

**Conséquence documentaire** : toute capture d'écran de catalogue, de calendrier ou de composition datant d'avant le 6 octobre montre l'ancien format de durée. Les captures sont à refaire, les textes non.

## C.6 Écrans portant une phrase et **non** modifiés — 6

À ne pas relire, et à ne pas croire oubliés : leur phrase était déjà conforme.

Composition séance — Étiquettes — Appui long (forme compacte de carte) · 10 Répétitions (mode activé) · 11 À l'échec (mode activé) · Séries variables — 4 À l'échec variable (scénario F) · Résumé — 17 À l'échec variable · 10b Répétitions (copie).
