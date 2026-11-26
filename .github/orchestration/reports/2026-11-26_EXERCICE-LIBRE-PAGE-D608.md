# Exercice libre — page de création et choix du mouvement (D-608 point 5) — 26/11/2026

## Identifiant et objectif

- Mission de Hermann du 26/11/2026 : développer la page « Exercice libre » (création) et son écran de choix du mouvement, rien d'autre.
- Sources (lecture seule, branche distante `docs/planification-grille-creneaux`, commit `3524f351`, non fusionnée) : Formats § 9.10,
  paragraphe « Page « Exercice libre » » ; registre ch07 D-571 (2) et D-573 (5). Numérotation de la branche de code : D-571 → **D-606**,
  D-573 → **D-608** (collision technique, lot 20).
- Figma (Prototype MVP) : « Exercice libre — Choix du mouvement » `13259:25991` ; « Exercice libre — Modale de type format » `13269:26160`.

## Branche et commit de départ

- Branche : `feat/exercice-libre-page-20261126`, créée depuis `67b42a24` (`feat/formats-reglages-d607-d608-20261126`, lot 20, non
  fusionnée — elle porte la coque libre de la feuille et la renumérotation D-606/D-608). Worktree `C:\Dev\KODJO-LIBRE-PAGE`.

## PRESERVE / CHANGE / FORBIDDEN (établi avant le code)

| | Élément | Démonstration |
|---|---|---|
| PRESERVE | Formats : écrans, catalogue des formats, règles d'entrée / sortie (D-604) | `FormatModelScreen`, `carrierMembership`, `layoutMoves` non modifiés (diff) ; suites des formats vertes |
| PRESERVE | Navigation de la Composition (carte → modale ; ligne « N tours » → page du format) | `CompositionScreen.tsx` non modifié ; CompositionScreen.* verts |
| PRESERVE | Autres modales « Paramètres d'exécution » | ajouts opt-in (`presentation="page"`, `onChangeMovement`), rendu par défaut inchangé ; suites ExecutionParametersSheet.* vertes |
| PRESERVE | Fiche de création d'un mouvement (contexte Séance, Catalogue) | nouveau contexte `free` seulement ; MovementScreen.b2 vert |
| PRESERVE | En-tête de modale partagé (`ModalHeader`, `CloseCircleAction`) | `cancelIcon` / `icon` optionnels, croix par défaut |
| CHANGE | Carte « Libre » → choix du mouvement → page, dans la feuille native de « Créer un exercice » | `app/formats-window.tsx`, `FreeExerciseScreen.tsx` |
| CHANGE | Carte d'un exercice libre créé → modale « Paramètres d'exécution » commune (plus la modale de type format) | `useMovementExerciseIntake.tsx` |
| FORBIDDEN | Remplacer une primitive native ; réécrire le catalogue des formats ; rebase / reset / force-push ; fusion dans main | respecté |

## Périmètre traité

1. **Écran 1 — choix du mouvement** (`FreeExerciseScreen`) : zone colorée grise `#F1F2F5` fondue, `ModalHeader` partagé (✕, « Exercice
   libre », ✓), accroche ; « Mouvement », recherche avec effacement, Filtrer (feuille native `catalogue-filters`), Trier (inactif, comme
   au catalogue des formats), Replier / déplier les piles ; catalogue (`visibleMovementItems`, cartes `SelectedMovementCard`) ; un seul
   mouvement (toucher une autre carte remplace le choix) ; ✓ inactif sans mouvement ; photo → fiche en lecture seule.
2. **Nom inexistant validé** (touche Entrée du clavier) : ouvre la fiche de création d'un mouvement existante avec ce nom
   (`/movement?context=free&name=…`) ; enregistrée, elle rend le mouvement à l'écran 1 qui ouvre la page ; un nom existant choisit ce
   mouvement. Pas de « + Créer un mouvement ».
3. **Écran 2 — page** : la feuille « Paramètres d'exécution » de l'exercice libre (`freeFormat`, D-608 du lot 20) rendue dans l'écran
   (`presentation="page"` : sans `Modal`, voile ni poignée ; Retour en chevron) — mêmes champs, mêmes règles, aucun second stockage.
   Cadre Mouvement : titre « Mouvement » + **« Changer »** (retour à l'écran 1), ligne du mouvement, ligne des phases seulement si le
   mouvement en a (nombre fixé, `phaseStructureLocked`) ; Mode (Répétitions par défaut) ; Condition d'arrêt (À l'objectif par défaut) ;
   Séries (identiques / variables) et tableau ; Charge ; De chaque côté ; Cadence ; Récupération **30″** par défaut.
4. **✓ de la page** : l'exercice est remis à la Composition (`handFreeExerciseToComposition`) avec les paramètres validés et la
   Récupération ; les modales de création se retirent (Composition ouverte dessous, ou ouverte avec l'exercice depuis le Catalogue).
   La Composition crée l'occurrence du mouvement (`exerciseOfFreePage`) : champs standards, défauts du Profil validés.
5. **Carte de l'exercice créé** : ouvre la modale « Paramètres d'exécution » allégée commune (titre = nom du mouvement), plus la
   modale de type format.
6. **Échange avec les formats** : déjà implémenté (D-604, `withFreeValues` / `freeExerciseOf`) ; démontré sur un exercice créé par la
   page (tests).
7. **Option sélectionnée à droite** : déjà assurée par le segmenté partagé `inline` (test existant `ExecutionParametersSheet.libre.d608`) —
   classe A, aucun changement (une inversion ajoutée puis retirée pendant le développement).

## Synchronisation code / documentation

- Classe **B** (évolution validée, décision explicite de Hermann et texte 3524f351) : registre ch07 D-608 point 5 remplacé par le texte
  de la branche de documentation (ancien texte conservé, annoté) ; D-606 point 2 annoté ; Formats § 9.4 (parcours Exercice libre, deux
  lignes du tableau), § 9.8 (puce Exercice libre) et § 9.10 (paragraphe « Page « Exercice libre » ») ; ch08 et ch13 (puce Exercice
  libre) annotés. `docs/sources/` non touché (archives).
- Classe **D** : canal de remise à usage unique, mode `page` de la feuille, icône Retour de l'en-tête partagé.

## Preuves et tests

- `npx tsc --noEmit` : OK. ESLint sur les fichiers modifiés : 0 erreur (1 avertissement antérieur, `quickValueRow`).
- Nouveau : `src/features/sessions/__tests__/FreeExerciseScreen.d608.test.tsx` (14 tests) — coque, ✓ inactif, un seul mouvement, nom
  inexistant → fiche de création puis page, nom existant → choix, croix ; page : coque et Retour, « Changer », sans / avec phases
  (« 3 phases »), défauts (Répétitions, À l'objectif, identiques, 30″), parcours complet en séries identiques et variables, remise à la
  Composition ; exercice créé : champs standards ; entrée puis sortie d'un format avec retour des valeurs ; sortie sans valeurs libres.
- Complété : `MovementScreen.b2.integration` (contexte `free`), `formatsWindowRoute` (carte Libre dans la feuille).
- Remplacés (règle changée) : `CompositionScreen.d608` — la carte d'un exercice libre ouvre la modale commune.
- Réécrits sur le nouveau parcours (première passe complète : 9 échecs, tous dus à l'ancien parcours carte Libre → fiche de création
  → carte « à compléter ») : `CompositionMovementFlow.integration` (6 tests : nom inexistant → fiche → page → Composition ; mouvement
  existant sans doublon, ARB-07 ; t-fiche-choix depuis la fiche ouverte par un nom ; croix du choix → modale → Catalogue ; Catalogue →
  page → Composition ; deux exercices dans l'ordre, cartes → modale commune), `ExerciseRecovery.integration` (Récupération 30″ de la
  page, jamais celle du Profil), `movementPhaseDurations.a2b.integration` (durées des phases reprises dans la page ; phase sans durée :
  ✓ indisponible). Intentions conservées ; textes d'origine annotés « remplacé ».
- Suites liées (`formatsWindowRoute`, `ExecutionParametersSheet*`, `CompositionScreen*`, `MovementScreen*`, `movementExercises*`,
  `FreeExerciseScreen*`, `src/shared/ui`) : 60 suites, 1 349 tests verts.
- Passe complète (`jest -w 1 --workerIdleMemoryLimit=800MB`), après réécriture : **491 suites, 6 860 tests verts, 33 ignorés,
  aucun échec**.
- Jest ne prouve ni le rendu ni les gestes : vérification sur iPhone.

## Hypothèses non démontrées / À CLARIFIER

1. **Nom inexistant « validé »** : interprété comme la touche Entrée du clavier sur la recherche (le ✓ reste inactif sans mouvement
   choisi, comme demandé). La fiche de création exige une catégorie et des zones : elle s'ouvre avec le nom, comme le parcours actuel.
2. **Récupération 30″** : appliquée à l'exercice créé par la page. Un exercice sorti d'un format sans valeurs libres garde « sans
   Récupération » (`freeExerciseOf`, D-604) — la règle « valeurs par défaut d'un exercice libre » impliquerait 30″ : à trancher.
3. **« Changer » puis même mouvement** : la page repart des valeurs par défaut (réglages de la page non conservés).
4. **Piles** : repli / dépli sans l'animation de glissement des cartes du catalogue des formats.
5. **Accroche « sur deux lignes »** : coupure laissée au texte (largeur), non forcée.
6. **Plus d'exercice « Paramètres à compléter » par la carte Libre** : le ✓ de la page suit les règles de validation de la feuille —
   l'exercice n'entre dans la Composition que réglé (cible renseignée, durées de phases complètes). Avant, la carte Libre posait un
   exercice « à compléter » réglé ensuite depuis sa carte. Conséquence directe du ✓ de la page ; à confirmer sur iPhone.

## Fichiers modifiés

`app/formats-window.tsx` ; `src/features/sessions/FreeExerciseScreen.tsx` (nouveau) ; `src/features/sessions/movementExercises.ts` ;
`src/features/sessions/useMovementExerciseIntake.tsx` ; `src/features/activities/ExecutionParametersSheet.tsx` ;
`src/features/activities/MovementScreen.tsx` ; `src/shared/ui/ModalHeaderActions.tsx` ; `src/shared/ui/HeaderCircleAction.tsx` ;
`src/shared/i18n/resources/{fr,en}ExecutionParameters.ts` ; tests (`FreeExerciseScreen.d608`, `CompositionScreen.d608`,
`formatsWindowRoute`, `MovementScreen.b2.integration`, `ExecutionParametersSheet.libre.d608`) ; documentation (registre ch07, Formats,
ch08, ch13).

## Vérifications restant à faire sur iPhone

Créer un exercice → Libre : écran de choix (coque, recherche, filtre, piles, un seul mouvement, ✓ grisé) ; nom inexistant + Entrée →
fiche de création préremplie → enregistrer → page ; page (cadres, « Changer », Retour, phases, défauts, séries variables, clavier) ;
✓ → Composition avec l'exercice ; carte de l'exercice → modale commune ; depuis le Catalogue « Créer » → Composition ouverte avec
l'exercice.

## Correction de recette du 26/11/2026 — catalogue par-dessus la zone de contexte

- Demande de Hermann : « le catalogue des mouvements chevauche par dessus la zone de contexte » (écran de choix du mouvement).
- Cause : la zone de contexte et la recherche n'avaient ni plan d'empilement ni fond ; dans la feuille native, la liste qui défile se
  peignait au-dessus d'elles.
- Correction (`FreeExerciseScreen.tsx`, seul fichier applicatif) : même patron que le catalogue des formats — zone de contexte au
  premier plan (zIndex 3), son fondu (2), recherche figée sur fond blanc (1), liste et écran rognés (`overflow: hidden`) ; la liste
  passe dessous et disparaît à leur bord. Aucune autre zone touchée (page, formats, Composition).
- Classe A (rendu conforme à Figma ; aucune règle). Documentation : aucune.
- Test ajouté (`FreeExerciseScreen.d608`, 15 tests) : ordre d'empilement et rognage. Suites ciblées : 2 suites, 29 tests verts ; tsc et
  ESLint OK. Le rendu se vérifie sur iPhone.

## Commit final et état Git

Renseignés dans le message de livraison (commit contenant ce rapport, branche poussée).
