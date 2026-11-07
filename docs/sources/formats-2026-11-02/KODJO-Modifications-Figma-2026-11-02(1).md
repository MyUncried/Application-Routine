# Modifications Figma du 2 novembre 2026 — à reporter dans la documentation

Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`).
Ces modifications font suite à la revue « KODJO-Revue-Claude-Formats-portage-circuit-2026-11-02 » et aux arbitrages A1 à A7 validés par Hermann. Elles complètent l'inventaire Figma (§16) de la spécification consolidée.

## 1. Écrans ajoutés

| Écran | Rangée | Id | Contenu |
|---|---|---|---|
| AMRAP — Questionnaire, plusieurs blocs | Formats, après « AMRAP — Questionnaire, saisie d'un mouvement » | `11410:20361` | Nombre d'AMRAP = 3 ; nouvelle ligne « Repos entre deux AMRAP · 2 min », affichée parce que le Nombre d'AMRAP est supérieur à 1. Déroulé : Bloc 1, repos, Bloc 2, repos, Bloc 3, avec des blocs proportionnels à leur durée et le repos en gris sans libellé ; repère de droite « 40 min » (3 × 12 min + 2 × 2 min). |
| AMRAP — Séance, sortie d'un exercice du circuit (confirmation) | Modales, après « AMRAP — Séance, circuit avec buy-in » | `11410:20123` | Dialogue de sortie d'un format (§13). Composant « DSF / Overlays / Confirmation », variante « Trois actions », sur fond voilé. Titre « Sortir du circuit AMRAP ? » ; message « Fentes avant devient un AMRAP simple de 12 min, ou un exercice libre sans incrément par tour. » ; actions « Conserver le format AMRAP » (principale, bleue, choix par défaut), « Adopter un format libre » (secondaire) et « Annuler ». |
| Death by — Séance, circuit en alternance | Modales, après « Death by — Séance, circuit dans chaque intervalle » | `11411:20181` | Circuit porteur du Format Death by en nature alternées (arbitrage A2). En-tête « Death by · jusqu'à l'échec · alternées », **sans durée** (voir §4). Cartes ~~« 1 → n rép. »~~ (remplacé le 07/11/2026 par « 1 rép. +1/min », D-516). |
| Death by — Récapitulatif, à la suite | Formats, après « Death by — Récapitulatif, en alternance » | `11411:20474` | Exécution « À la suite » et ligne « Récupération entre les mouvements · 1 min », comme pour Tabata et EMOM à la suite. Déroulé : Squats sautés 1, 2, 3, 4, …, n, puis un bloc gris de récupération, puis Fentes avant 1, 2, 3, 4, …, n ; hauteur croissante ; repère « jusqu'à l'échec » ; la légende ajoute « Récupération ». |

L'ajout de ces écrans a décalé vers la droite les écrans suivants de chaque rangée. Aucun écran n'a été supprimé.

## 2. Écrans modifiés

### 2.1 Préconfigurations rendues librement modifiables (N04)

| Écran | Id | Modification |
|---|---|---|
| Tabata — Modale exercice, standard | `8747:14451` | Les options Répétitions (Mode), À l'échec (Condition d'arrêt) et Variables (Séries) ne sont plus grisées. |
| 30/30 — Modale exercice | `8656:34070` | Le bloc des paramètres d'exécution est remplacé par celui de la modale standard Tabata, sans aucun verrouillage. Valeurs : Mode Durée, 6 séries identiques, Objectif de durée 30 s (au lieu de 20 s), Pause 30 s (au lieu d'une Récupération de 30 s), Durée de l'exercice 6 min, Récupération 0 s. Titre « Paramètres d'exécution 30/30 ». Modalités : « 6 séries de 30 secondes, avec une pause de 30 secondes après chaque série. » |
| Tabata — Séance, circuit en alternance | `11294:19682` | L'en-tête du circuit devient « Circuit · 8 tours · alternées » (au lieu de « Tabata »). C'est un circuit standard, sans Format d'origine. |

### 2.2 Cadence en AMRAP et For time (§3)

« Autre » et « 1 s » ne sont plus grisés, « Sans » reste sélectionné par défaut, sur les modales suivantes :
- AMRAP — Modale exercice, buy-in (`11264:19453`) ;
- AMRAP — Modale exercice, dans un circuit (`8598:30873`) ;
- AMRAP — Modale exercice, dans un circuit, durée à l'échec (`11275:19598`) ;
- AMRAP — Modale exercice simple, à la cible (`11255:19238`) ;
- AMRAP — Modale exercice simple, à l'échec (Max) (`11260:19348`) ;
- For time — Modale exercice, standard (`8598:31560`) ;
- For time — Modale exercice, dans un circuit (`11312:19699`) ;
- For time — Modale exercice, buy-in ou buy-out (`11312:19895`).

La cadence reste grisée sur « Sans » en Death by.

### 2.3 Libellés harmonisés (rangées des formats et des modales)

| Ancien libellé | Nouveau libellé | Écrans |
|---|---|---|
| A la cible | À l'objectif | Toutes les modales des deux rangées (Tabata, EMOM, AMRAP, Death by, For time, 30/30), 17 occurrences |
| Nombre de répétitions par tour | Nombre de répétitions | AMRAP — Modale exercice, dans un circuit ; AMRAP — Modale exercice simple, à la cible |
| Repos après chaque tour | Repos après chaque tour de boucle | AMRAP — Questionnaire ; AMRAP — Questionnaire, saisie d'un mouvement |
| Temps limite · Aucun | Temps limite · Sans limite | For time — Questionnaire ; For time — Récapitulatif (valeur recalée à droite) |
| Intervalles (tuile) | 30/30 | P-Formats — Choix du format, deux colonnes (`9977:19613`) |

« A la cible » subsiste sur des écrans situés hors des deux rangées des formats. Ils n'ont pas été modifiés.

### 2.4 AMRAP : libellé « bloc » (arbitrage A7)

| Écran | Id | Modification |
|---|---|---|
| AMRAP — Séance, circuit avec buy-in | `11270:19541` | En-tête « AMRAP · 1 bloc · groupées » (au lieu de « 1 tour »). « Tour » reste réservé aux tours de boucle et au résultat. |

### 2.5 Textes des modalités d'exécution

| Écran | Id | Nouveau texte |
|---|---|---|
| AMRAP — Modale exercice simple, à l'échec (Max) | `11260:19348` | « Autant de répétitions que possible à chaque tour, jusqu'à l'échec. Autant de tours que possible. » |
| For time — Modale exercice, standard | `8598:31560` | « 3 tours de 21 répétitions, le plus vite possible. » (le réglage est 3 séries identiques de 21) |

### 2.6 Durées et déroulés

| Écran | Id | Modification |
|---|---|---|
| AMRAP — Séance, circuit avec buy-in | `11270:19541` | Durée de séance « ≥ 13 min » au lieu de « ≥ 21 min » : compte à rebours 10 s + AMRAP 12 min + étirement 45 s + fin 5 s ; le « ≥ » vient de l'étirement. |
| AMRAP — Récapitulatif, buy-in et incrément | `11195:19094` | Le déroulé se termine par « n » (Fentes avant) puis « max » (Gainage) : un bloc « n » par mouvement de la boucle (§15, règle 6). |

## 3. Arbitrages sans modification d'écran

- **A1, Tabata À la suite à 8 min 50 s** : « P-Tabata — Récapitulatif, à la suite » affichait déjà 8 min 50 s.
- **A3, A5 et A6** : comportements sans écran dédié.
- **A4, Superset** : « Superset — Questionnaire » et « Superset — Récapitulatif » ont déjà « + Ajouter ». Les « — » des répétitions sont conformes au dépôt, qui laisse les paramètres libres (FMT-28, D-24).
- **A5, précision confirmée** : un Death by simple est refusé dans un Circuit standard alterné, car ce cas relève du Circuit porteur Death by alterné (A2). Il reste admis en Circuit standard groupé, où chaque passage rejoue le Death by et où son échec ne termine que ce membre.

## 4. Règle validée : en-tête du Circuit Death by en alternance

Le Circuit porteur du Format Death by en nature **alternées** n'affiche **pas de durée** dans son en-tête : « Death by · jusqu'à l'échec · alternées ». L'intervalle (1 min par défaut) reste porté par chaque Exercice et se règle dans sa modale.

Raison : en alternance, A et B ont chacun leur propre intervalle, et un tour dure la somme des intervalles des membres. Afficher « 1 min » laisserait croire à un tour d'une minute.

À l'inverse, le Circuit Death by en nature **groupées** (« dans chaque intervalle ») affiche la Durée de chaque tour = intervalle commun, en bleu, modifiable.

À reporter dans la spécification : §12 (Death by en alternance), §14 (le Format d'origine Death by s'applique aussi à la nature alternées ; la Durée de chaque tour ne concerne que la nature groupées) et §16 (inventaire).

## 5. Points relevés, non modifiés

- La tagline AMRAP « Aucun repos prescrit, on compte les tours. » est conservée sur « AMRAP — Questionnaire, plusieurs blocs », bien qu'un repos entre blocs y soit réglé. Elle est commune au format ; elle est à revoir si l'on veut l'adapter.
- Les écrans hors des deux rangées des formats gardent « A la cible ».

## 6. Progression : tableau des séries

Règle : la Progression utilise les séries variables standards, avec des répétitions et une charge propres à chaque série et à chaque mouvement. Aucun champ nouveau. La ligne unique « Répétitions par série · 10 · 12 · 14 » est remplacée par un tableau.

| Écran | Id | Modification |
|---|---|---|
| Progression — Questionnaire | `8656:35005` | La ligne « Répétitions par série · 10 · 12 · 14 » est retirée : sans mouvement, des valeurs par série n'ont pas de sens. Paramètres : Nombre de séries, Pause, Durée totale. Déroulé générique : blocs numérotés 1, 2, 3, de hauteur égale. Les répétitions et charges par série se règlent au récapitulatif, mouvement par mouvement. |
| Progression — Récapitulatif | `8656:35062` | **Pas d'interrupteur global** : la Charge (Avec / Sans) est le réglage standard de chaque Exercice. Tableau **« Mouvement »**, placé dans les paramètres d'exécution **juste sous la ligne Nombre de séries** (avant Pause, Durée totale, Exécution), présenté comme le tableau des phases : fond blanc arrondi (rayon 8) inséré dans le cadre gris, en-têtes de colonne gris, séparateurs fins entre les lignes : une ligne par mouvement, une colonne par série. Mouvement sans charge : les répétitions seules (Squats sautés 10, 12, 14). Mouvement avec charge : les répétitions et la charge en dessous (Fentes avant 12 à 10 kg, 10 à 12 kg, 8 à 14 kg). Le déroulé suit le tableau, avec une hauteur proportionnelle aux répétitions. Hauteur d'écran standard (874 px). |

Comportement :
- passer de 3 à 4 séries ajoute une colonne à compléter ; passer à 2 retire la dernière colonne, sans confirmation de perte (cohérent avec B03 et A6) ;
- **saisie directe dans le tableau du récapitulatif** : toucher une case ouvre le clavier sur cette case (numérique pour les répétitions, décimal pour la charge, D-405) ; « Suivant » passe à la case suivante (répétitions S1, charge S1, répétitions S2…) ; le tableau reste visible au-dessus du clavier. La modale du mouvement reste accessible pour les autres réglages, dont Charge Avec / Sans ;
- un trait horizontal sépare la ligne Nombre de séries du tableau.

## 7. Bouton Retour sur tous les récapitulatifs

Sur tous les écrans « … — Récapitulatif », l'en-tête fixe passe de la variante Fermer (croix, « Annuler ») à la variante **Retour** : le bouton ramène au questionnaire du format, avec les réponses conservées. Le titre de l'en-tête est inchangé. Les questionnaires gardent la croix, qui ferme le parcours et ramène à la composition.

Écrans concernés (17) : P-Tabata (à la suite, en alternance) ; EMOM (dans chaque intervalle, en alternance, à la suite) ; AMRAP (incrément et max, suppression glissée ; « buy-in et incrément » était déjà en Retour) ; Death by (un mouvement, dans chaque intervalle, en alternance, à la suite) ; For time ; 30/30 ; Renforcement ; Superset ; Progression ; À l'échec.

## 8. Espace entre le déroulé et le bouton d'action

Sur tous les écrans de la rangée des formats qui ont un déroulé, l'écart entre le bas du cadre du déroulé et le haut du bouton d'action est fixé à **25 px**, la valeur déjà utilisée par la majorité des écrans. Le titre « Déroulé » suit son cadre.

Écrans recalés : P-Tabata — Récapitulatif (à la suite, en alternance), EMOM — Récapitulatif, en alternance, et les récapitulatifs 30/30, Renforcement, Superset, Progression et À l'échec. Sur « Progression — Récapitulatif », le tableau a été légèrement compacté (en-tête de 28 px, ligne avec charge de 44 px) pour garder 12 px au-dessus du déroulé.
