# Journal des modifications du Design System Figma de KODJO

Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg` — pages « Prototype MVP » (`510:101`), « Design system — Fondations » (`2291:2`), « Communautaire — Conception — Hors MVP » et autres.
Période : 2026-10-05 (une seule session de travail). Auteur des modifications : une IA, sous la direction et avec les validations du propriétaire du produit.
Ce journal remplace l'annexe G du brief d'alignement du code.

## 0. Conventions et limites

- Les volumes proviennent des comptes rendus de chaque opération (simulation puis application), reconstitués à la fin de la session : **ils sont fiables pour les ordres de grandeur et les totaux par lot, mais le détail de certaines sous-lignes (origines exactes des valeurs fusionnées, décomptes par famille d'opacités) n'a pas pu être revérifié nœud par nœud**. Une sous-ligne dont l'origine exacte n'est pas certaine est décrite de façon générique plutôt que chiffrée. Le contrôle indépendant du DSF (tranche T-0 du brief) fait foi en cas de désaccord.
- « Écrans » = écrans de la page Prototype MVP (128 écrans plus 3 jeux de variantes) hors contenu des instances ; « DSF » = définitions de composants de la page Design system — Fondations.
- **Contrôle d'identité** = comparaison avant et après d'au moins les couleurs, dimensions, rayons et espacements du nœud modifié ; une valeur modifiée volontairement est signalée comme « effet visuel ».
- Ce journal décrit des modifications, pas des règles de conception : aucune règle fonctionnelle n'en découle.
- **Limite connue de l'outil de modification** : lier une couleur à une variable remet l'opacité du remplissage ou du trait à 100 % ; elle a été rétablie après coup à chaque fois que c'était nécessaire (§ 9). Les interactions de prototype ne sont pas reportées sur un nœud remplacé (§ 7).

## 1. Synthèse chiffrée

| Indicateur (écrans) | Départ | Fin | Source |
|---|---:|---:|---|
| Fonds liés à une variable | 7 % | 90,3 % | audit indépendant (définition de l'audit) |
| Contours liés | 11 % | 95,4 % | idem |
| Rayons liés | 14 % | 93,5 % | idem |
| Gaps liés | 8 % | 96,8 % | idem |
| Paddings liés | 9 % | 96,6 % | idem |
| Textes avec style | 0 % | 99,0 % | idem |
| Instances dont le composant principal est supprimé | 480 | 0 | mesure interne |
| Barres d'état et icônes réseau collées dans les écrans | 519 icônes | 0 | mesure interne |
| Interactions de prototype | 429 | 410 (dont 285 Smart Animate) | voir § 7 |

Les taux de départ (mesure interne) et ceux de fin (audit) ne reposent pas sur la même définition du dénominateur : la comparaison est indicative.

## 2. Liaison aux variables (lots 1, 1b et décisions A/B/C)

| Opération | Volume | Règle appliquée | Effet visuel | Contrôle |
|---|---|---|---|---|
| Lot 1, écrans | 1 607 fonds, 375 contours, 1 003 rayons, 1 097 gaps, 2 885 paddings (6 967 liaisons) | Valeur identique à un token canonique unique (hors « observed »), scope compatible, remplissages opaques uniquement ; rayons 6, 8, 10, 12, 16, 20, 24 ; espacements de l'échelle existante | Aucun | 0 erreur, 0 écart de géométrie |
| Décisions 1 à 3, écrans | 1 965 fonds : 1 526 blancs de formes vers `color/background`, 59 blancs dans les cartes vers `color/card-surface`, 292 bleus `#0508E5` de formes vers `color/primary`, 88 textes `#595E66` vers `color/text-secondary` | Choix par rôle quand plusieurs tokens avaient la même valeur ; glyphes blancs de vecteurs laissés pour plus tard | Aucun | idem |
| Lot 1b, définitions DSF | 152 fonds, 38 contours, 290 rayons, 326 gaps, 304 paddings | Même règle que le lot 1 | Aucun | idem |
| Fusion `#14171C` vers `color/text-primary` | 321 textes (291 écrans, 30 DSF) | Écart de couleur 9, validé par le propriétaire | Imperceptible | 0 écart de dimensions |
| Rôles validés (lot 4, 1ʳᵉ vague) | 3 567 liaisons, détaillées au § 2.1 | Fusion d'écart de couleur ≤ 7 et rôles créés | Imperceptible à écart ≤ 7 | 0 écart de géométrie |
| Familles A, B, C (couleurs) | 1 082 liaisons (annexe A du brief pour les valeurs) | Valeurs identiques, fusions d'écart ≤ 7, quasi-noirs et gris par rôle ; scrim à 34 % laissé local | Légères nuances pour les fusions d'écart > 7 (quasi-noirs, `#C7C9D1`, `#D6D6DE`) | opacités réparées (§ 9) |
| `#6B6E7A` vers `color/text-muted`, `#1F1F24` vers `color/text-primary` | 149 textes, 21 textes (170 nœuds) | Rôle créé / fusion validée | `#1F1F24` : écart de couleur 22 (fusion validée) ; `text-muted` a depuis été fusionné dans `text-tertiary` (§ 5.3) | 0 écart de dimensions |

### 2.1 Détail de la 1ʳᵉ vague de rôles (3 567 liaisons)

| Token cible | Liaisons | Origine |
|---|---:|---|
| `color/cards/surface` | 195 | `#FCFCFE` (formes) |
| `color/stroke-inverse` | 352 | traits `#FFFFFF` |
| `color/cards/badge` | 421 | `#F4F4F8` (formes) |
| `spacing/10` | 645 | 454 paddings et 191 gaps de 10 |
| `color/divider` | 205 | `#DEDEE5` (formes) |
| `color/calendar-marker` | 57 | `#1F9E7A` (formes) |
| `color/text-label` | 201 | textes `#46464C` et variantes proches (écart ≤ 7) |
| `color/border` | 333 | `#E0E3EB`, `#E4E4EB`, `#E5E5EB` et voisines (traits et formes, écart ≤ 7) |
| `color/primary-soft` | 74 | `#8283F2` (formes) et `#8282F2` |
| `color/text-primary` | 172 | `#14141A` (67 traits, 105 textes) |
| `color/progress-track` | 304 | traits `#BABDD1` |
| `color/text-tertiary` | 146 | textes `#7A7A80` |
| `spacing/14` | 462 | 3 gaps et 459 paddings de 14 |

(Plusieurs de ces tokens ont été supprimés ensuite : voir § 5.3.)

## 3. Géométrie : rayons et espacements (lot 4, 2ᵉ vague)

| Opération | Volume | Règle | Effet visuel |
|---|---|---|---|
| Tokens créés | `radius/14`, `radius/17`, `spacing/20`, `color/text-muted` (et la primitive `dimension/17`) | — | — |
| Rayons liés | 646 : 14 → `radius/14` (222), 17 → `radius/17` (164), 15 → `radius/16` (82), 11 → `radius/12` (94), 19 → `radius/20` (42), 7 → `radius/8` (42) | Fusion à ±1 px vers le palier le plus proche, arrondi vers le haut en cas d'égalité | ≤ 1 px |
| Espacements liés | 763 : gaps 236, paddings 527 (20 → `spacing/20` ; 15 → `spacing/16` ; 3 → `spacing/4` ; 5 → `spacing/6` ; 7 → `spacing/8` ; 9 → `spacing/10` ; 11 → `spacing/12`) | idem | ≤ 1 px par espacement |
| Écarts non fusionnés | rayon 18 et petits rayons 0,9375 / 1 / 2 / 4,5 / 5 | Hors échelle ou glyphes | — |
| **Réparation** | 26 rangées horizontales à largeur fixe (jours de la semaine : 8, choix du ressenti : 6, lignes de clavier : 12) rétablies à leur gap d'origine ; 37 galeries de médias remises à 8 (modifiées à tort par ma réparation) | Ces rangées débordaient après la fusion | Retour au rendu d'origine |

Instances laissées hors de ces fusions : éléments à opacité 0 ou masqués, jeux de retournement.

## 4. Styles de texte (lot 2, option A)

Règle : Figma fait foi pour le rendu ; l'interligne « auto » est conservé ; un style n'est appliqué que s'il reproduit exactement la police, la taille, l'interligne, le crénage, la casse et la décoration du texte.

| Opération | Volume | Détail |
|---|---|---|
| Styles créés | 28 « KODJO / Texte / … » (interligne conservé) ; puis `Inter Medium 10` ; puis `Inter Semi Bold 17` (30 au total) | Noms typographiques neutres : ils ne désignent pas un rôle |
| Styles existants réutilisés par égalité exacte | 12 groupes (1 031 textes) | Voir § 9 pour un cas de rôle trompeur |
| Liaisons | 4 172 textes : 909 + 970 + 1 151 (écrans) et 1 142 (DSF) | 0 erreur, 0 écart de dimensions persistant |
| Textes Semi Bold 14 / 18 px (contexte) | 91 : 8 « Button » (sous « Modal / Bottom Action »), 83 « Picker / Action » | Règle de contexte validée |
| Textes à polices mélangées | 93 (52 écrans, 41 DSF), par segments : Semi Bold 12 + « DSF / Card metadata » | Pas de variation de dimensions |
| Tailles fractionnaires | 6 « Personnalisé » de 9,4 à 10 px ; 7 textes déjà à 10 px rattachés | Changement de 0,6 px accepté ; largeur et position inchangées |
| Glyphe « ↕ » en texte | 24 remplacés par `icon/tri` (voir § 6) | — |
| Textes restants sans style | 69 à l'époque (38 glyphes « photo » depuis remplacés, 31 usages rares) | — |
| Aligner « DSF / Card title » | 40 textes de composants DSF de 17 à 15 px ; style marqué « OBSOLÈTE » ; texte `5017:6051` rebranché sur `Texte / Inter Semi Bold 17` | Les instances affichaient déjà 15 px par surcharge : aucun changement visible |

## 5. Tokens (variables)

### 5.1 Créés
`color/primary-soft` (`#8283F2`), `color/text-tertiary` (`#7A7A80`), `color/text-label` (`#46464C`), `color/calendar-marker` (`#1F9E7A`), `color/action/breakpoint` (`#ED7314`), `color/icon-on-primary`, `spacing/10`, `spacing/14`, `spacing/20`, `radius/14`, `radius/17`, `color/text-muted`, `color/progress-track`, `color/stroke-inverse`, primitives `dimension/17` et `color/observed/ed7314`.

### 5.2 Renommé
`color/text-on-primary` → **`color/on-primary`** (usages élargis au texte, aux formes et aux traits).

### 5.3 Fusionnés et supprimés (rationalisation des neutres)

| Token supprimé | Cible | Écart | Liaisons rebranchées (écrans + autres pages) |
|---|---|---:|---:|
| `color/cards/badge` | `color/surface` | 4 | 563 + 21 |
| `color/cards/surface` | `color/surface-subtle` | 4 | 292 + 27 |
| `color/cards/archive-surface` | `color/surface` | 4 | 11 + 2 |
| `color/progress-track` | `color/disabled` | 8 | 389 + 0 |
| `color/text-muted` | `color/text-tertiary` | 20 | 173 + 0 |
| `color/card-surface` | `color/background` | 0 | 62 + 6 |
| `color/stroke-inverse` | `color/on-primary` | 0 | 340 + 23 |
| `color/icon-on-primary` | `color/on-primary` | 0 | 38 + 2 |

Total : 1 868 liaisons sur Prototype MVP et 81 sur les autres pages (1 949), opacité d'origine conservée. Aucun nœud ni alias n'utilisait plus ces tokens avant suppression.

### 5.4 Alias conservés (noms cités par la spécification), valeur modifiée

| Token | Même valeur que | Effet |
|---|---|---|
| `color/divider` | `color/border` (`#E0E3E8`) | 290 usages, écart 6 |
| `color/icon-neutral` | `color/text-secondary` (`#595E66`) | 16 usages, écart 10 |
| `color/media/surface` | `color/surface` (`#F5F7FA`) | 37 usages, écart 5 |
| `color/navigation/pill` | `color/surface-subtle` (`#F9FAFC`) | 0 usage sur les écrans |

### 5.5 Rouge des dialogues
Tous les nœuds en `#E62B1E` et `#DB2E2E` (35 au recensement : 13 Prototype MVP, 12 Communautaire, 10 DSF) reliés à **`color/danger`** (`#D92D20`), écart 13 et 14 ; variables `color/observed/e62b1e` et `color/observed/db2e2e` supprimées. Les boutons « Confirmer » (suppression d'une séance archivée) et « Supprimer » (étiquette) ont le même rouge ; une surcharge de couleur brique `#B1503C` sur le premier a été retirée.

### 5.6 Scopes élargis
`color/icon-neutral` (texte), `color/text-primary` (formes), `color/divider` (texte).

## 6. Composants et icônes

### 6.1 Créés ou modifiés (DSF)

| Composant | Modification | Remplacements |
|---|---|---|
| `DSF / Forms / Valeur modifiable` | Jeu de 4 variantes (Taille × Texte) puis **2** (`Texte = 13`, `Texte = 14`) après abandon du compact ; propriété `Valeur` ; fond lié | 213 copies locales remplacées (6 pilote + 207), 12 masquées laissées ; 25 copies parasites créées par erreur puis supprimées |
| `DSF / Navigation / Barre d'état (décor)` | Créé ; imbriqué dans les 3 variantes de `En-tête fixe` | 67 barres collées remplacées (54 en vrac, 7 groupées, 6 d'exécution) ; icônes importées de 519 à 0 |
| `DSF / Navigation / En-tête fixe` | Propriété `Titre` ; propriété booléenne `Démarcation` (masquée par défaut) ; faute « Mofification » corrigée | 106 copies remplacées (51 Standard, 53 Fermer, 2 Retour) ; 1 laissée (décalage d'1 px) et 5 en-têtes d'exécution |
| `DSF / Overlays / Poignée de modale` | Créé (50 × 4, rayon 2) | 48 poignées |
| `DSF / Controls / Progression par tours` | Jeu `État = En cours / Initial` | 7 copies des écrans (5 laissées dans les jeux de retournement) |
| `icon/suivant`, `/précédent`, `/ajouter`, `/fermer`, `/retour` | Créés (24 × 24) | 120 cadres d'icônes locaux (91 + 29) ; 23 restants (19 masqués, 4 visibles) |
| `icon/tri` | Créé (20 × 20) ; master `DSF / Controls / Tri` aligné sur 34 × 34 / rayon 17 / fond 72 % / trait 75 % | 24 caractères « ↕ » remplacés |
| `icon/photo-ajouter` | Créé (24 × 24, trait 1,8) | 38 glyphes « photo.badge.plus » remplacés |

### 6.2 Composants supprimés puis restaurés
31 familles « Source exact » dont le composant principal avait été supprimé (480 instances orphelines) ont été réintégrées avec leurs identifiants d'origine dans le cadre « DSF V2 — Primitives et gabarits (ex-« Source exact ») » ; zéro instance orpheline ensuite.

### 6.3 Fusion avec les équivalents DSF (lot 5)

| Famille | Instances | Variantes ajoutées / retirées |
|---|---:|---|
| Interrupteur, Accordéon, Action d'en-tête de modale, Bouton Son, Bouton Voix | 44, 75, 47, 45, 45 | aucune (signatures identiques) |
| Indicateur de côté | 9 | aucune |
| Dialogue de décision | 19 sur 25 | 6 laissées (message long) |
| Bouton principal | 28 + 9 | 2 variantes ajoutées puis les 2 d'origine supprimées |
| Contrôle segmenté | 61 + 51 + 1 | 4 ajoutées ; 5 d'origine inutilisées supprimées (« Deux détaillé » conservées) |
| Champ de nom | 62 | 1 ajoutée, suffixe retiré |
| Étiquette de catégorie | 133 | 2 ajoutées, suffixe retiré |
| Badge de statut | 47 (dont 12 imbriquées) | 7 états ; 3 d'origine supprimées |

Total : 659 instances. 13 familles archivées (cadre « DSF V2 — Archive / Composants fusionnés (lot 5) »), 18 composants renommés (`DSF / Primitives / …`, `DSF / Gabarits / …`) ; 10 variantes en double supprimées après vérification d'absence d'instance. Les noms exacts figurent dans le brief (annexe G.3).

### 6.4 Nettoyages
3 masters surnuméraires de « Valeur modifiable » (`6944:26411`, `:26415`, `:26419`), résidus de mon script, archivés et renommés « copie résiduelle — à supprimer ».

## 7. Éléments masqués, transparents et interactions

| Opération | Volume |
|---|---|
| Gabarits « Shell Instance » invisibles supprimés | 117 (92 + 17 + 8) |
| Éléments masqués ou à opacité 0 sans usage supprimés | 160 (sans jumeau d'animation) puis 48 (hors famille du retournement) |
| Conservés | 313 (12 masqués, 301 à opacité 0) dans le jeu « Zone d'exécution — retournements », « Cadre bas — retournement », 4 écrans de retournement, ou porteurs d'interaction |
| Interactions | 429 (290 Smart Animate) puis **410 (285)** : 19 clics perdus lors de remplacements de nœuds ; **à recréer manuellement par le propriétaire**, sans impact sur le développement |
| Écrans devenus isolés | « Création activité — Avant Paramètres d'exécution », « Profil — Stepper Pause changement de côté », « Profil — Stepper Récupération après activité », « Composition séance — Standard — Séries variables », « Résumé — 15 », « Résumé — 17 » |

### 7.1 Chronomètre
- Repère de 6 h remonté de 55 px dans les 12 variantes de « Zone d'exécution — retournements » (Prototype MVP et copie Communautaire) : il se cachait derrière le panneau inférieur.
- Repères principaux (3 h, 6 h, 9 h) à `#BEC2CC` (`color/disabled`) à 62 % partout ; 16 petits traits à 40 % dans les 4 variantes visibles (64 traits ; les 128 des variantes masquées restent à 0).
- 6 repères imbriqués remis à 62 % (suite à un constat d'audit).

## 8. Corrections de contenu

| Opération | Volume | Détail |
|---|---|---|
| Zones corporelles rétablies | 133 textes : Prototype MVP (3 écrans « Ajouter un exercice », 33 ; filtre des exercices, 13) ; Communautaire (3 écrans, 33 ; 2 filtres, 15) ; DSF Classification (22) et Filtres (15) ; filtre des séances Prototype MVP (2) | Liste : Cou, Épaules, Bras, Poignets et mains, Dos, Hanches et bassin, Cuisses, Fessier, Genoux, Jambes, Chevilles et pieds (reconstitution contrôlée : largeur de chaque étiquette = largeur du nom + 24 px ; ordre du composant DSF « Filtres ») ; pastilles « Actives » et « Archivées » d'après le nom de l'instance |
| « Parcours » → « Circuit » | 17 textes dans les 17 écrans de composition de séance (« Circuit », « 3 circuits ») | Noms de calques inchangés ; les 26 autres occurrences gardent « Parcours » |
| Faute de frappe | « Mofification d'une séance » corrigée (composant et écran) | — |

## 9. Incidents et réparations

| Incident | Cause | Réparation | Reste |
|---|---|---|---|
| Opacités perdues (183 remplissages et traits semi-transparents) | Limite de l'outil à la liaison d'une couleur | Rétablies d'après les jumeaux non modifiés de la page Communautaire. Familles concernées : contrôles segmentés (50 %), contrôle de tri (fond 72 %, trait 75 %), repères du chronomètre (62 %), `Rappel / Option` (82 %), libellés à 75 %, textes de roulette (20 % et 45 %) | Cas rencontrés ensuite : repères imbriqués (6), master Tri |
| Rangées débordantes après fusion de gaps | Gaps de 5, 11 arrondis vers le haut | 26 rangées rétablies ; 37 galeries restaurées | — |
| 25 copies parasites de « Valeur modifiable » | Instruction de copie non permise dans une zone sans mise en page automatique | Supprimées après vérification de leur jumeau visible | — |
| 3 masters surnuméraires | Script de variantes | Archivés | À supprimer par le propriétaire |
| Interactions perdues (19) | Remplacements de nœuds sans report des interactions | Aucune (décision du propriétaire) | Recréation manuelle |
| Rôle de style trompeur | « DSF / Card title » rapproché par égalité de corps | Rebranché, masters alignés | Voir rapport de clôture |
| Hypothèse fausse | Texte en police système pris pour l'horloge de la barre d'état | Remplacé par `icon/photo-ajouter` (38) | — |

## 10. Écarts connus et assumés

6 dialogues de décision sur l'ancien composant (message long) ; en-tête « Modification d'une séance » décalé d'1 px ; 4 icônes locales visibles ; palette d'étiquettes (`#8FB8FF`, `#8052C7`, `#6E40C7`, `#A60F1F`) et illustration « Squat assisté » laissées locales ; scrim `#1F2129` à 34 % (9) local ; `cards/calendar-day-border` et `cards/archive-border` non fusionnées ; ancres d'animation du retournement conservées ; barre d'état = décor non implémenté.

## 11. Ce que ce journal ne couvre pas

Les corrections de code, de documentation et le contenu de la spécification 12 relèvent du brief d'alignement et de la liste des points à réintégrer. Le détail ligne à ligne de chaque nœud modifié n'a pas été conservé (une version nommée de Figma, créée par le propriétaire, en serait le seul témoin complet).
