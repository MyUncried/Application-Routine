# 2026-11-06 — PRE-9 — Catalogues, cartes et badge « New » (D-501 à D-510)

## Mission

- **Identifiant :** `PRE9_CATALOGUES_CARTES_BADGE_NOUVEAU`.
- **Objectif :** implémenter les décisions D-501 à D-510 du 06/11/2026, puis livrer sur une branche dédiée avec une PR vers `main`, sans fusion.
  - Couleurs, onglets et zone de contexte des catalogues.
  - Carte Séance.
  - Carte Mouvement et piles.
  - Bandeau commun.
  - Badge « New ».
- **Demandeur :** Hermann (instruction du 06/11/2026).
- **Sources :**
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md` ;
  - `docs/KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06.md` ;
  - chapitres 06, 07, 10, 12 et 13 ;
  - `.github/orchestration/reports/2026-11-06_BADGE_NOUVEAU_INTEGRATION.md` ;
  - Figma `G6RY5Ebhgwb4AHIOYDwwvg`, consulté en lecture seule.

## Branche et point de départ

- **Branche :** `feat/pre9-catalogues-cartes-badge-20261106`.
- **Arbitrage de Hermann sur la base (06/11/2026) :** « pre9-bmad/dev + main (Recommandé) ».
  - `origin/main` (`1a28c7f6`) ne contient pas le code de PRE-9 : 128 commits locaux jamais publiés, 401 fichiers. Partir de `main` seul aurait obligé à refaire la zone de contexte, le mode catalogue des Formats et la première version du badge sur le code de PRE-8.
  - La branche part donc de `pre9-bmad/dev` (`c9096028`), avec fusion de `origin/main` @ `1a28c7f6` (décisions D-499 à D-510, jusqu'à `874b9f80`).
  - Commit de fusion : `81f427ec`.
  - Conflits documentaires résolus aux chapitres 10 et 13 : texte de `main` (D-504/D-505) retenu, annotations antérieures du 03/11 et du 05/11 conservées.
- **Conséquence :** la publication de la branche publie aussi les commits PRE-9 de `pre9-bmad/dev`, et la PR vers `main` les contient.

## Périmètre demandé

- **D-510 :** badge « New » et son cycle de vie, piles, défilement, accessibilité, exclusions.
- **D-508 :** carte Mouvement de 72, feuilles de pile, trois états « Nouveau » dans le composant réutilisable.
- **D-504 à D-507 :** carte Séance (disposition, ligne 3, Démarrer, interactions, contenu déplié).
- **D-501 à D-503 :** jetons par catalogue, fonds, zone de contexte, onglets, séparateur, champ de 34.
- **D-509 :** bande commune hors catalogue à #EAEAFF ; `selectionSurface` réservé à la sélection.
- **Hors périmètre :**
  - écrans Programmes ;
  - Calendrier et Suivi ;
  - parcours et moteur d'exécution des Formats ;
  - VNext.

## Périmètre réellement traité

- **D-501 à D-510 :** implémentés.
- **Répartition du travail :**
  - badge et carte Mouvement : session principale ;
  - carte Séance : agent délégué ;
  - couleurs, onglets et bande : agent délégué.
- **Contrôle des agents :** chaque changement a été repris dans la session principale (tests, types, lint, synchronisation documentaire).
- **Réponses de Hermann aux questions sur la saisie au clavier**, inscrites au registre :
  - question 1 : « Oui » ;
  - question 2 : « Saisie à la seconde » ;
  - question 3 : « Ok ».
  - Leur mise en œuvre n'est **pas** dans cette livraison.
  - La question 4 (cible commune vidée) attend la vérification de Hermann sur iPhone.

## Écarts code / sources constatés avant intervention

| Sujet | Code de départ | Source |
|---|---|---|
| Badge | Pastille « NEW » rouge, en majuscules. Détectée par comparaison de deux lectures du Catalogue, seulement après Créer ou Ajouter un niveau depuis la liste ; Ajouter un niveau depuis la fiche, duplication et Composition non reconnus. | D-510 : « New » vert en onglet, toute création, « New ↓ » sur une pile, défilement |
| Carte Mouvement | 80 pt, photo à 8 du bord, rayon 12, fond `#F9FAFC`, Niveau bleu, sélection par fond bleu | D-508 : 72, 4 / r8, fond blanc, liseré 50 %, Niveau noir, case de sélection |
| Feuilles de pile | 80, liseré 1 `#E0E3ED`, sans ombre | 72, liseré 0,5 à 50 %, même ombre |
| Carte Séance | 80, action lecture ronde, chevron seulement pour plusieurs exercices, format ou volume en ligne 3, sablier | D-504 à D-507 |
| Catalogues | Bande `selectionSurface` #E5F0FF partout, fond blanc, séparateur « \| » pour les Séances, champ de 44 | D-501 à D-503 |
| Bandes hors catalogue | `selectionSurface` #E5F0FF | D-509 : #EAEAFF |

## Modifications réalisées

### D-510 — badge « New »

- **Mémoire du marquage :** `src/features/activities/newMovementMarks.ts`, en mémoire, jamais persisté.
- **Points de marquage :**
  - `MovementCatalogueService.createIndependent` couvre le bouton +, Exercice libre et la duplication « Créer un nouveau mouvement » (`createAsNew`) ;
  - `MovementCatalogueService.createVariant` couvre Ajouter un niveau, depuis la liste comme depuis la fiche ;
  - `SessionService.createSession` / `updateSession` marquent les Mouvements `NEW` du brouillon, après un enregistrement réussi. C'est le cas de la création depuis la Composition.
  - Une réutilisation ou une correction (`EDITED`) ne marque rien.
- **`CatalogueScreen` :**
  - la vue Mouvements, affichée et au premier plan, déclare les marques qu'elle montre ;
  - les onglets du haut et la barre du bas retirent les marques déjà affichées ;
  - ouvrir une fiche puis revenir conserve le marquage ;
  - une fiche créée depuis la Composition reste marquée jusqu'à la visite suivante.
- **`MovementCatalogueList` :**
  - états `NO` / `YES` / `IN_PILE` ;
  - « New ↓ » sur la tête d'une pile repliée dont un niveau caché est nouveau ;
  - pile dépliée : « New » sur chaque fiche nouvelle ;
  - aucun badge en sélection ni hors de l'onglet Mouvements ;
  - défilement vers la fiche créée, ou vers sa pile repliée sans la déployer ;
  - une cible exclue par la recherche ou les filtres est abandonnée.
- **Rendu :**
  - formes d'onglet exportées de Figma : `catalogue-badge-nouveau.svg` (55 × 32) et `catalogue-badge-nouveau-pile.svg` (69 × 32), en vert #1F804F ;
  - libellé Inter Medium 12 blanc, sans majuscules forcées ;
  - découpe à l'arrondi de la carte ;
  - description arrêtée à 8 du corps de l'onglet ;
  - pas de cible tactile.
- **VoiceOver :** « nom, nouveau », et « …, contient un niveau nouveau » sur la tête de pile.

### D-508 — carte Mouvement

- Carte et feuilles de pile de 72, fond blanc, liseré `#CCD1E0` à 50 %, même ombre sur les feuilles.
- Photo à 4 du bord, rayon 8.
- Nom à 8 du haut ; Niveau en `#141414` (Figma), sur la ligne de base, à 12 du bord droit.
- En sélection : case Figma vide ou cochée, Niveau 12 pt avant la case, à la place du fond de sélection.
- Décalages de pile, actions glissées et commandes de niveau dérivent de la nouvelle hauteur.

### D-504 à D-507 — carte Séance (agent délégué)

- **Disposition :**
  - `SessionCard` réécrit : 72, photo 4 / r8, colonne des symboles ;
  - chevron sur toutes les cartes, → replié et ↓ déplié ;
  - durée en haut à droite, sans sablier.
- **Ligne 3 :**
  - « N circuits · N exercices », à partir de `structureCircuits` (projection : `shownCircuitCount`) ;
  - nombre de circuits omis sans circuit ou pour un seul circuit d'un tour ;
  - « 1 exercice » pour une séance à un exercice.
- **Démarrer :**
  - pilule de 24, cible de 48 (jeton `minTouchTarget`, au moins 44) ;
  - masquée sur une carte archivée ou avec `context="planning"`.
- **Zones de toucher :**
  - photo → ouvrir ;
  - Démarrer → `onStart` ;
  - chevron et zone centrale → déployer / replier ;
  - zone déployée → ouvrir.
  - Actions glissées de 72.
- **Contenu déplié :**
  - « Cycle » … « N passages » ;
  - « … · séries groupées / alternées » … « N tours » ;
  - « rép. ».

### D-501 à D-503 et D-509 — catalogues et bande commune (agent délégué)

- **Jetons :** `color.catalogue{Movements,Sessions,Programs}{Context,Background}` et `color.contextBand`, avec `catalogueColors(kind)`.
- **Écrans :**
  - fond de l'écran, de la barre d'état et de l'en-tête dans la couleur `background` du catalogue ;
  - zone de contexte : `context` opaque jusqu'à 80 %, puis fondu vers `background` ;
  - fondu au-dessus de la navigation basse (ajouté, absent du code).
- **Onglets :**
  - trois emplacements égaux, sans séparateurs ;
  - sélectionné en Bold `textPrimary`, les autres en Regular `textSecondary` ;
  - forme arrondie à 12, avec évasements de 10 dessinés en vues (`react-native-svg` n'est pas une dépendance du projet).
- **Zone de contexte :** séparateur « · » à 8 pt, champ Rechercher dessiné sur 34 pt avec une cible de 44.
- **`ScreenShell.ContextBand` :** `color` par défaut `contextBand` (#EAEAFF). La Composition et la sélection d'un mouvement existant passent de #E5F0FF à #EAEAFF ; la fiche Mouvement était déjà à #EAEAFF par son propre jeton.
- **Usages de sélection** conservés avec `selectionSurface`.

### Fichiers et documentation

- **Actifs :** quatre SVG déclarés dans `assets/icons/manifest.json`.
- **Jetons :** documentés au chapitre 12. Empreinte de `tokens.ts` mise à jour dans `pre4Story11Controls.test.ts`, avec historique.

## Synchronisation code / documentation

| Changement | Classe | Documents |
|---|---|---|
| D-501 à D-508, D-510 | A (le code rejoint des règles déjà écrites et intégrées le 06/11) | Aucun changement de règle. Renvoi spec §7 → badge. Chapitre 12 : jetons et choix techniques. |
| D-509, consigne de Hermann pour les bandes hors catalogue (#EAEAFF) | B | Registre D-509 complété par la consigne citée. Spec §3 et §9 annotées (« non modifiées » remplacé). Chapitre 06 annoté. |
| Recette du 06/11 (t-niveau) : pastille « NEW » rouge | Remplacé par D-510 | Registre, entrée de la recette annotée. |
| Réponses 1 à 3 sur la saisie au clavier | B (décisions, non mises en œuvre) | Registre, citées textuellement. |
| CE-CAT-CTX-01, ligne des boutons y=160 | Annotation (D-503) | Chapitre 13. |
| Badge, rendu et choix techniques | D | Chapitre 12. |

### À clarifier

1. **Circuit d'un tour dans un Cycle de plusieurs passages :** l'agent l'a compté comme « 1 circuit », puisqu'il est joué plusieurs fois. Les chapitres 10 et 13 disent seulement « un seul circuit d'un tour », ce qui l'omettrait.
2. **Spec §4 :** « 22 pt de part et d'autre de la cible de 44 » est incompatible avec « 16 pt entre la ligne 1 et les boutons ». Figma a été suivi : environ 11 au-dessus, 22 en dessous.
3. **Séparateur « · » :** 8 pt selon la spécification, environ 6 pt mesurés dans Figma. La spécification a été appliquée.
4. **Démarrer :** aucun écran d'Exécution n'existe, donc la pilule est présente mais désactivée (comportement antérieur de l'action lecture, CE-T03-01).
5. **Durée de For time et Death by :** pas implémentée avant ce lot, et toujours pas. La carte affiche probablement « ≥ 0 s ». Hors lot.
6. **Bouton Retour de `FixedHeader` :** son cercle reste en `selectionSurface`. Ce n'est pas une bande ; à arbitrer.

## Preuves et tests

### Tests ciblés (Jest)

| Fichier | Résultat |
|---|---|
| `MovementCatalogueList.d510.test.tsx` (nouveau) | 12/12 |
| `newMovementMarks.test.ts` (nouveau) | 4/4 |
| `CatalogueScreen.r0611.test.tsx` (badge réécrit) | 7/7 |
| `MovementCatalogueList.r0611.test.tsx` | 8/8 |
| `MovementCatalogueList.fam.test.tsx` (géométrie passée de 80 à 72) | 14/14 |
| `MovementCatalogueService.b1` et `SessionService` (marquage des créations, échec, `EDITED`) | 38/38 |
| `src/shared/ui/__tests__` | 159/159 |
| Fichiers de la carte Séance (agent) | 71/71 |
| Fichiers de la zone de contexte et de la bande (agent) | verts |

### Suite complète, types et lint

- Suite complète `npx jest --testPathIgnorePatterns "\.claude"` : **313 suites, 5 475 tests, tous verts** (aucun échec, `CompositionScreen.recette1` compris).
- `npx tsc --noEmit` : propre.
- `npx eslint` sur les fichiers modifiés : 0 erreur ; 1 avertissement antérieur (`sessionDraftsEqual` inutilisé dans `CompositionScreen.test.tsx`, présent avant la mission).

### Couverture

- Badge :
  - cycle de vie ;
  - retour depuis chaque point de création ;
  - ouverture d'une fiche puis retour ;
  - création depuis la Composition, changement d'onglet et redémarrage (mémoire vidée) ;
  - piles repliées et dépliées, plusieurs nouveautés ;
  - filtres et recherche ;
  - défilement vers une fiche ou une pile.
- Carte Séance :
  - zones de toucher distinctes ;
  - ligne 3 : un exercice, circuits d'un ou plusieurs tours ;
  - Démarrer masqué en planification et pour une carte archivée.
- Couleurs :
  - couleurs des deux catalogues ;
  - bandes hors catalogue à #EAEAFF.

## Hypothèses non démontrées

- **Liste du catalogue sous la zone de contexte :** les cartes restent visibles à travers le fondu, par transparence. Figma montre ce fondu opaque.
- **Défilement vers la fiche créée :** il suppose la mise en page mesurée de l'entrée. Le rendu réel du défilement animé n'est pas démontré.
- **Forme de l'onglet sélectionné, dessinée en vues :** son raccord sans liseré avec la zone n'est pas démontré.

## Vérifications restant à faire sur iPhone

Aucune fidélité visuelle et aucun VoiceOver ne sont validés par les tests automatisés.

- **Badge :**
  - forme d'onglet, raccord au coin arrondi, lisibilité ;
  - description raccourcie ;
  - « New ↓ » ;
  - annonce VoiceOver ;
  - défilement au retour ;
  - disparition par les onglets du haut et la barre du bas, et non à l'ouverture d'une fiche ;
  - fiche créée depuis la Composition, visible à la visite suivante ;
  - disparition après fermeture complète de l'application.
- **Carte Mouvement :**
  - cotes 72 / 4 / 8 / 12 ;
  - Niveau noir sur la ligne de base ;
  - case de sélection (la sélection n'a plus de fond bleu) ;
  - feuilles de pile ombrées ;
  - actions glissées et commandes de niveau.
- **Carte Séance :**
  - ligne de base nom / durée, troncature ;
  - pilule Démarrer (pâle, désactivée) ;
  - chevron pivoté ;
  - aucun déclenchement croisé entre photo, chevron, zone centrale, Démarrer et glissé ;
  - actions glissées de 72 ;
  - cartes rouge et orange ;
  - texte agrandi.
- **Catalogues :**
  - couleurs de fond, de la barre d'état et de la zone ;
  - raccord de l'onglet sélectionné ;
  - fondu de la zone et fondu au-dessus de la navigation ;
  - champ de 34 et cibles ;
  - séparateur.
- **Hors catalogue :** bande #EAEAFF de la Composition et de la sélection d'un mouvement existant.
- **Non-régression :** Calendrier et Suivi, encore provisoires (`PlaceholderScreen`), ne sont touchés par aucun changement.

## Éléments non corrigés ou hors périmètre

- **Mise en œuvre des réponses 1 à 3 sur la saisie au clavier :**
  - réglages de Format au clavier ;
  - Récupération à la seconde ;
  - saisie en heures au-delà de 99:59.
- **Question 4 (cible commune vidée)** : en attente de Hermann.
- **Remarques de la recette du 06/11 au soir, validation demandée et non donnée :**
  - homogénéité des tableaux des Formats ;
  - fondus lents ;
  - clavier de Récupération ;
  - durée de circuit.
- **Écrans Programmes, Calendrier, Suivi ; moteur d'exécution.**
- **Cartes de séance des contextes Calendrier, Suivi et Choix multiple :** non migrées (§9 de la spécification).

## Fichiers modifiés

Voir le commit de livraison : `git show --stat` sur la branche. Principaux :

- **Badge et carte Mouvement :**
  - `src/features/activities/newMovementMarks.ts` (nouveau) ;
  - `MovementCatalogueList.tsx` ;
  - `MovementCatalogueService.ts` ;
  - `src/features/sessions/SessionService.ts`.
- **Carte Séance :**
  - `SessionCard.tsx`, `SessionCatalogueList.tsx` ;
  - `SessionCompositionTree.tsx`, `sessionCatalogueProjection.ts`.
- **Catalogues et bande :**
  - `CatalogueScreen.tsx`, `CatalogueNavigation.tsx` ;
  - `ScreenShell.tsx`, `catalogueContext.ts`, `CatalogueCommands.tsx` ;
  - `SessionViewToggle.tsx`, `MovementCounterToggles.tsx`.
- **Jetons, chaînes et actifs :**
  - `src/shared/ui/tokens.ts`, `src/shared/i18n/resources/fr.ts` ;
  - `assets/icons/*.svg` (quatre), `assets/icons/manifest.json`.
- **Tests :** voir la section « Preuves et tests ».
- **Documentation :**
  - chapitres 06, 07, 12 et 13 ;
  - `docs/KODJO-Catalogues-cartes-modales-2026-11-06.md`.

## Suite complète

313 suites, 5 475 tests : PASS (exécution du 06/11/2026 sur l'arbre de livraison, avant les seules retouches documentaires et la suppression d'un import inutilisé dans un test, relancé ensuite : 8/8).

## Commit final et état Git

À compléter après le commit et la publication.
