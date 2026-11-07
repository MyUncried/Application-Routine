# A.2 — Créer un Exercice depuis un Mouvement (et menu Créer conforme à Figma)

Story PRE-9, epic A. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026) ; demandes de Hermann du 29/10 avant la recette n° 1 : « Le rendu des options de sélection doit être conforme à Figma » ; « l'option créer un nouvel exercice amène à l'ancien écran d'exercice, il faut impérativement utiliser le nouvel écran » ; « l'option un mouvement existant amène à l'ancienne liste d'exercices, au lieu d'amener à une liste du catalogue des mouvements ». Plan : `../planning-artifacts/epics.md` § A.2. Arbitrages : ARB-22a, ARB-07 (décidés).

## Menu Créer conforme à Figma (correction de B.2)

Rendu de Figma `10705:20223` (valeurs relevées en lecture seule, nœuds `10705:20313`, `10705:20341`, `10705:20315`, `10705:20327`, `10705:20344`, `10774:20132`, `10774:20144`, `10705:20336`, `10705:20312`, `10705:20311`) : voile `rgba(31, 33, 41, 0.42)`, « + » au premier plan, axe vertical gris `#9499A8` sous le « + », pilules 243 × 32 (fond blanc, contour et libellé `#1414F5`, Semi Bold 14, rayon 16, ombre), bouton rond 32 à droite sur l'axe du « + » avec l'icône de Figma (haltère, mouvement, liste, circuit, cycle), « Annuler » gris (`#E5E8F0`, contour `#BABFCC`, libellé `#5C6170`, croix). Composant `CreateMenu.tsx` ; icônes SVG de Figma dans `assets/composition/`. Le choix provisoire de B.2 (ancienne liste blanche, au titre d'ARB-19) est retiré : ARB-19 ne s'applique pas lorsqu'une maquette existe.

## Parcours livrés (classe A : ARB-22a, epics A.2, D-449)

1. **Créer un nouvel exercice** → écran « Créer un mouvement » (CE-MVT-01, `/movement?context=session`) → Terminer enregistre le Mouvement → retour à la Composition, Exercice inséré après le dernier Exercice entré, dans son conteneur (ARB-07) → feuille des paramètres d'exécution sur la Composition. « Utiliser ce mouvement » (suggestion de nom) reprend le Mouvement existant.
2. **Utiliser un mouvement existant** → sélection dans le Catalogue des Mouvements (`/movement-selection` : recherche, Filtrer, liste du Catalogue en mode sélection, Mouvements actifs seulement, Q6) → « Ajouter N exercice(s) » → Exercices insérés (ARB-07, ordre du Catalogue) → feuille des paramètres de chacun, à tour de rôle. [Remplacé le 01/11/2026 — ordre de Hermann « Menu Créer et transformation du bouton », ch13 CE-T03-08 « Menu Créer — état cible » : quatre options, Créer un exercice, Utiliser une séance existante, Ajouter un circuit, Ajouter un cycle ; plus d'entrée « Utiliser un mouvement existant » (Mouvements existants repris par la saisie du nom dans « Créer un exercice ») ni de rangée Annuler (le « + » devient Annuler). Voir `spec-menu-creer-parametres-01-11.md`.]
3. L'ancien écran d'Exercice en création et l'ancienne liste (`ActivitySelectionScreen`, `activity_definitions`) ne sont plus atteignables depuis la Composition (test de garde) ; leur retrait relève d'A.3. Le toucher d'une carte d'Exercice ouvre toujours l'édition de l'Exercice de Séance.

## À CLARIFIER (classe C — choix provisoires en place)

1. [Remplacé le 29/10 par la décision de Hermann (recette n° 1, constat k) : aucune feuille automatique ; toucher une carte « à compléter » ouvre sa feuille — voir `spec-recette-1-corrections.md`.] **Étape des paramètres** : feuille existante (`ExecutionParametersSheet`) sur la Composition, une par Exercice ; ✕ laisse l'Exercice « à compléter » (Continuer inactif, D-389) au lieu d'annuler l'ajout.
2. **Insertion avant configuration**, paramètres par défaut d'une série : l'entrée dans un Circuit alterné ne perd aucune série et ne demande aucune confirmation.
3. **Mouvement créé depuis une Séance enregistré au Catalogue dès Terminer** (comportement de CE-MVT-01) : il reste si la Séance est ensuite abandonnée (l'ancien éditeur ne l'enregistrait qu'avec la Séance).
4. **« Créer une variante » masqué** depuis une Séance (CE-MVT-01 §3 ; ch08 « La création de variante depuis une séance reste exclue »).
5. **Ordre d'une sélection multiple** : ordre de présentation du Catalogue (règle de l'ancienne sélection, V2-CAT-01 §4.4).
6. **Rendus sans maquette** : écran de sélection (en-tête, recherche et filtre sans Créer ni Trier, barre Annuler / Ajouter reprise de l'ancienne sélection) ; état sélectionné d'une carte de Mouvement ; carte de suggestion sans action de variante.
7. Filtre de statut forcé à « Actifs » dans la sélection (l'option « Archivés » reste affichée, sans effet).

## Synchronisation code / documentation

- **Classe A** : ARB-22a, ARB-07, D-449, CE-MVT-01 ; menu conforme à Figma (référence visuelle). Aucun document normatif modifié.
- **Classe C** : points 1 à 7.
- **Classe D** : passage des Mouvements choisis à la Composition par un module en mémoire (`movementExercises.ts`, la route `/movement` étant hors du fournisseur du brouillon) ; `useMovementExerciseIntake`.

## Tests

- Nouveaux : `CompositionMovementFlow.integration.test.tsx` (4, routeur et SQLite réels), `movementExercises.a2.test.ts` (ARB-07 ancien modèle et structure générale, construction de l'Exercice, passage, garde) ; tests du menu (position, voile, ordre). Mis à jour (« PRE-9 A.2 — ARB-22a, D-449 ») : `CompositionScreen`, `CompositionScreen.b2`, `creationLayout`, `CompositionExerciseFlow`, `CompositionSaveFlow`, `ExerciseEditingPaths`.
- Suite complète : voir `sprint-status.yaml`. Aucune vérification sur iPhone (recette n° 1).

## Recette iPhone n° 2 du 31/10/2026 — lot 3 (constat c)

**Demande de Hermann (verbatim)** : « Composition de séance, comportement souhaité : l'appui sur la carte n'ouvre plus la fiche d'exercice mais ouvre la modale des paramètres d'exécution (voile grisé qui apparaît, modale apparaît de bas en haut) ; l'appui sur la photo ouvre la fiche du mouvement. »

**Remplace** (texte d'origine conservé) : décision du 29/10 (recette n° 1, constat k, `spec-recette-1-corrections.md` point 1 ; ch07 l.1190) — [« carte complète : ouverture de l'Exercice » ; « Lorsqu'ensuite les paramètres sont renseignés, appuyer sur la carte l'ouvre dans l'écran initial avec la photo, comme actuellement »].

**Réalisé** (classe B, demande explicite) :
- `CompositionScreen.handleEditActivity` : l'appui court sur une carte d'Exercice (type `EXERCISE`), complète ou à compléter, ouvre `ExecutionParametersSheet` (`useMovementExerciseIntake.openParameters`) — voile en fondu (`Modal` `fade`), feuille qui monte du bas (`sheetEntry`), déjà en place ; une autre Activité ouvre son éditeur comme avant.
- Photo : bouton distinct posé sur le gabarit média de la carte (`composition-exercise-media-button-<id>`), frère de la carte (un élément accessible masque ses descendants sous VoiceOver), qui suit la carte (balayage, glisser) ; appui → `handleOpenMovement` (route `/exercise`, `CompositionExerciseEditor`, ouverte jusque-là par la carte) ; appui long → saisie de la carte ; actions révélées : appui neutre. Ancien modèle (`ActivityZoneList`) et structure générale (`LayoutExerciseRow`).
- Accessibilité : carte = bouton, indication « Modifier les paramètres » (`exerciseRow.editParametersAccessibilityLabel`) ; photo = bouton « Ouvrir le mouvement » (`exerciseRow.openMovementAccessibilityLabel`).
- Feuille ouverte sur un Exercice complet : mêmes règles que l'éditeur — ligne de base AD-13 (paramètres à l'ouverture), N hérité (AD-37), structure des phases verrouillée (MFN-09), entrée de réserve de Circuit retirée si les séries changent (PRE-6 story 3.3, `exitCircuit`). Carte à compléter : comportement du 29/10 inchangé (aucune ligne de base).

**Synchronisation code / documentation** : classe **B** — ch07 « Recette iPhone n° 2 du 31/10/2026 — lot 3 » (citation) et l.1190 annotée ; ch10 RM-021 annoté ; ch13 CE Composition « Gestes » (l.1939) annoté ; `spec-recette-1-corrections.md` point 1 annoté ; cette spec. Recherche ciblée (« appui court sur une carte », « ouvre directement son édition », « la toucher ouvre », « carte complète ») : aucune autre formulation active (copies figées de `docs/preparation/PRE-4` non touchées). Choix (classe D/C) : bouton de la photo frère de la carte ; rendu inchangé (aucun Figma de cet état).

**Tests** : `CompositionScreen.recette1.test.tsx` (carte complète → feuille, photo → éditeur ; annotations datées), `CompositionScreen.b1b.test.tsx` (photo → éditeur, annotation datée), `CompositionScreen.recette2lot3.test.tsx` (libellés accessibles, réserve), `i18n/index.test.ts`.

**À vérifier sur iPhone** : appui sur la carte → voile en fondu puis feuille qui monte ; appui sur la photo → fiche de l'Exercice ; appui long sur la photo → la carte se soulève ; balayage depuis la photo → actions révélées ; VoiceOver : carte « … , Modifier les paramètres », puis bouton « Ouvrir le mouvement ».
