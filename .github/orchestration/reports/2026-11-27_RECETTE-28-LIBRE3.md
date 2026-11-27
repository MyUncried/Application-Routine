# Recette iPhone du 27/11/2026 (matin) — paquet LIBRE3

## Identifiant et objectif

- Mission : `RECETTE-28-LIBRE3` (brief commun r28, paquet LIBRE3).
- Objectif : écran « Exercice libre — Choix du mouvement » (`src/features/sessions/FreeExerciseScreen.tsx`). Demandes de Hermann (citation exacte) : « Ajouter le bouton d'action en bas du catalogue "Ajouter ce mouvement". Le bouton "valider" doit rester griser quand le catalogue est ouvert. »

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R28-LIBRE3`, branche `fix/recette-28-libre3`, base `900502584` (recette `recette/agenda-axe-20261124`, lot 23).

## Périmètre

| Point | Demandé | Traité |
|---|---|---|
| 1 | Bouton d'action « Ajouter ce mouvement » en bas du catalogue (composant partagé), inactif sans mouvement, valide le choix et referme le catalogue | Fait |
| 2 | Bouton « Valider » (✓ de l'en-tête) grisé tant que le catalogue est ouvert | Fait |

Hors périmètre, non touchés : page « Exercice libre » (`ExecutionParametersSheet`), `FormatModelScreen`, recherche, zone figée, vue de garde de la feuille native.

## Constats

- Avant : toucher une carte **choisit** le mouvement (première ligne figée, D-572) sans refermer le catalogue ; le ✓ de l'en-tête, actif dès qu'un mouvement est choisi, ouvrait la page. Aucun bouton d'action en bas.
- Catalogue des formats (`FormatModelScreen`, `format-catalogue-add`) : `PrimaryActionZone` + `PrimaryActionButton` ; sélection puis bouton d'ajout. Le comportement retenu ici est le même patron (sélection, puis « Ajouter ce mouvement ») : aucun changement du geste de sélection, donc pas de changement de comportement non cité.
- Libellé : « Ajouter ce mouvement » n'existait pas dans l'i18n (les libellés du catalogue des formats sont « Ajouter 1 mouvement » / « Fermer sans sélectionner ») ; clé ajoutée `executionParameters.sheet.freeChooseAdd` (fr « Ajouter ce mouvement », en « Add this movement »), libellé exact de Hermann.
- Différence assumée avec le catalogue des formats : sans sélection, le bouton des formats est actif (« Fermer sans sélectionner », décision s-focus du 06/11) ; ici, comme demandé par le paquet, il est **inactif** sans mouvement (la croix ferme déjà l'écran). Voir À CLARIFIER.

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** : vue de garde `sheetScrollGuard` premier enfant natif ; zIndex 3/2/1 (contexte, fondu, recherche) ; zone figée D-572 ; sélection par toucher (un seul mouvement, toucher la carte figée la retire) ; Entrée sur nom inexistant → fiche de création, nom existant → choix ; mouvement créé → page directement ; remise en haut de la liste ; page « Exercice libre ».
- **CHANGE** : `FreeExerciseScreen.tsx` : ✓ de l'en-tête toujours inactif (l. 225-228) ; réserve de la zone d'action en fin de liste (l. 111, 341) ; `PrimaryActionZone` + `PrimaryActionButton` « Ajouter ce mouvement » (l. 390-402). i18n fr/en (une clé). Tests : `FreeExerciseScreen.d608.test.tsx`, et les deux tests d'intégration qui passaient par le ✓ (`CompositionMovementFlow.integration`, `ExerciseRecovery.integration`) passent désormais par « Ajouter ce mouvement » (seul le testID pressé change). Documentation ch07 D-608 point 5, Formats § 9.10.
- **FORBIDDEN** : `ExecutionParametersSheet.tsx`, `FormatModelScreen.tsx`, `CompositionScreen.tsx`, `PrimaryActionZone.tsx`, `ModalHeaderActions.tsx`, recherche, toute modification native, tout nouveau numéro de décision.

Vérification : `git diff --stat` ne contient que les fichiers listés plus bas ; les tests existants de zIndex, zone figée, chemin des premiers enfants natifs et recherche passent sans modification.

## Modifications réalisées

Voir CHANGE. La zone d'action est le dernier enfant de la racine (position absolue en bas, via le composant partagé) : le premier enfant natif reste la vue de garde (test « aucune ScrollView sur le chemin des premiers enfants natifs » vert).

## Tests et résultats

- `npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/sessions/__tests__/FreeExerciseScreen.d608.test.tsx src/features/sessions/__tests__/CompositionMovementFlow.integration.test.tsx src/features/sessions/__tests__/ExerciseRecovery.integration.test.tsx` : 3 suites, 30/30 PASS.
  - Nouveau / modifié : « Ajouter ce mouvement » présent, libellé exact, inactif sans mouvement, actif après choix, ✓ toujours grisé (et inopérant) ; le choix ne referme pas le catalogue ; « Ajouter ce mouvement » ouvre la page avec le mouvement choisi et retire le catalogue ; la liste réserve la hauteur de la zone d'action.
- `npx tsc --noEmit` : aucune erreur. `npx eslint` sur les 6 fichiers source/test modifiés : aucune erreur.
- Passe complète : non lancée (brief).
- Une suite Jest verte ne prouve pas le rendu iPhone (position de la zone d'action dans la feuille native, recouvrement par le clavier).

## Classe documentaire et documents touchés

- Points 1 et 2 : **B** (demande explicite de Hermann). Compléments datés « [Recette iPhone du 27/11/2026 (matin) : …] » : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` (D-608 point 5, citation exacte, ancienne règle « ✓ inactif tant qu'aucun mouvement n'est choisi » marquée remplacée) ; `docs/KODJO-Formats-entrainement-2026-11-02.md` § 9.10 (paragraphe « Page « Exercice libre » »).

## À CLARIFIER

1. Sans mouvement choisi, « Ajouter ce mouvement » est **inactif** (lecture du paquet), alors qu'au catalogue des formats le bouton sans sélection est actif et devient « Fermer sans sélectionner » (s-focus, 06/11). À confirmer par Hermann si l'alignement sur les formats est souhaité.
2. Le ✓ de l'en-tête reste affiché (grisé) sur l'écran de choix, sans action : il n'a donc plus de rôle sur cet écran. Conservé visible, lecture littérale de « doit rester griser ».

## Vérifications restant à effectuer sur iPhone

1. Composition → Créer un exercice → Libre : en bas, « Ajouter ce mouvement » grisé ; ✓ en haut grisé.
2. Toucher un mouvement : il passe en première ligne, « Ajouter ce mouvement » devient bleu, ✓ reste grisé ; la fin de la liste défile au-dessus du bouton, sans être cachée.
3. Toucher « Ajouter ce mouvement » : le catalogue se referme, la page « Exercice libre » s'ouvre avec ce mouvement. « Changer » ramène au catalogue avec le mouvement figé et le bouton actif.
4. Clavier de recherche ouvert : le bouton reste sous le clavier (comportement partagé D-349) et réapparaît à sa fermeture.

## Fichiers modifiés

- `src/features/sessions/FreeExerciseScreen.tsx`
- `src/shared/i18n/resources/frExecutionParameters.ts`
- `src/shared/i18n/resources/enExecutionParameters.ts`
- `src/features/sessions/__tests__/FreeExerciseScreen.d608.test.tsx`
- `src/features/sessions/__tests__/CompositionMovementFlow.integration.test.tsx`
- `src/features/sessions/__tests__/ExerciseRecovery.integration.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-28-LIBRE3.md`

## Commit final et état Git

Commit unique sur `fix/recette-28-libre3` contenant code, tests, documentation et ce rapport, poussé vers `origin` (hash communiqué dans le compte rendu de mission).
