# 2026-11-19 — EMOM-COTES-ANNEAU

## Mission

- **Identifiant :** EMOM-COTES-ANNEAU (cahier de recette en ligne, ligne emom-9, KO, note de Hermann du 18/11/2026).
- **Objectif :** (1) plus de pause entre les côtés dans l'EMOM en répétitions ; (2) au changement de côté, seuls les segments de l'anneau changent de couleur.
- **Branche :** `recette/emom-cotes-anneau-20261119`, créée depuis `recette/coins-chrono-20261119` (commit de départ `8c006ee7`), branches empilées (toutes les missions de la recette touchent l'écran d'exécution). Pas de fusion, pas de PR.

## Périmètre demandé (baseline gelée)

- **PRESERVE :** l'EMOM en durée et ses pauses entre côtés, l'anneau unique, le centre commun avec le For time, les autres formats, le moteur de fenêtres.
- **CHANGE :** l'EMOM en répétitions avec changement de côté (récapitulatif, enchaînement des côtés, calcul de durée), la couleur de l'anneau au changement de côté.
- **FORBIDDEN :** réécrire les tests en masse, remplacer une primitive native ; hors périmètre → SCOPE_EXPANSION_REQUIRED.

## Périmètre réellement traité

- **Plan (`src/domain/execution/plan.ts`, `emitEmomOccurrence`) :** la pause entre les côtés n'est plus émise dans une fenêtre EMOM quand l'Exercice est en Répétitions (`sidePause` = 0). Seule la planification de cette pause est touchée : ni la politique EMOM (`policies/emom.ts`), ni le noyau, ni les fenêtres. Le Death by (`deathByMemberLeaves`) n'est pas touché.
- **Modale (`ExecutionParametersSheet.tsx`) :** la ligne « Pause entre les côtés » est masquée pour un Exercice EMOM en Répétitions (`sideSettingsShown`), exactement comme pour le For time (recette du 17/11/2026). La valeur reste dans le Brouillon et est rendue au ✓.
- **Anneau (`ExecutionScreen.tsx`) :** les notes de bascule de la fenêtre (`advanceHoldMarks`, déjà utilisées pour la retenue de l'EMOM en durée) sont étendues à toute fenêtre (EMOM et Death by). La pause entre les côtés est notée comme une portion orange, le travail comme une portion bleue. Les segments passés (`holdSegments`) sont dessinés dès qu'une pause a été notée. La fonction `holdSegments`, le composant `ExecutionTimerRing` et la structure des segments ne changent pas.

## Constats

- **Segments de l'anneau avant correction (relevé) :** l'anneau EMOM est celui de la fenêtre (un tour par intervalle). Le trait principal prend la couleur de l'étape en cours (`ringColorOf(phase)`, orange en pause entre côtés, en retenue et au repos). Des portions colorées (`segments`) se superposent aux parties passées :
  - au repos, la portion de travail en bleu (`emomRing`, PRE-11 T2) ;
  - en EMOM en durée, les portions effort / retenue (`holdSegments`, précision du 18/11).
  Rien ne notait la pause entre les côtés. Le trait entier passait donc à l'orange pendant la pause, puis entièrement au bleu au côté 2 : c'est le défaut relevé.
- **Correction 1 et défaut 2 :** en Répétitions, la correction 1 supprime la pause, donc le changement de couleur au changement de côté disparaît. Le défaut subsistait en Durée (pause gardée) et dans le Death by (pause entre côtés de ses membres) : c'est le même écran et le même composant, donc ils sont corrigés du même coup (consigne : « sauf si c'est le même composant »).
- **Autres formats :**
  - For time et AMRAP : anneau déjà segmenté par phase (`ringSegmentsOf`, FT-15) ; de toute façon, le For time n'a pas de pause entre les côtés.
  - Exercice hors Format : la pause entre les côtés est une étape à part entière, avec son propre compte à rebours. L'anneau recommence à chaque étape, ce n'est pas le même défaut ; rien n'est changé.
- **Calcul de durée :** déjà conforme. `plannedWorkOfParameters` et `plannedWorkOfTarget` (contrôle EMOM des durées) valent 0 en Répétitions. La durée estimée d'un EMOM est N × W, sans pause entre côtés. Testé.

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint` sur les 6 fichiers touchés : aucune erreur.
- Jest ciblé (`--maxWorkers=2`) :
  - `emom.pre11.test.ts`, `ExecutionScreen.emomDuree.test.tsx`, `ExecutionParametersSheet.format0711.test.tsx` : 3 suites, 45 tests réussis ;
  - dossiers `src/domain/execution`, `src/features/execution` et `src/features/activities` : résultat en section « Tests (complément) ».
- Tests ajoutés ou modifiés :
  - `emom.pre11.test.ts` : « Q5 : exercice bilatéral… » est remplacé par « emom-9 : exercice bilatéral en Répétitions ». Il vérifie l'enchaînement par « Suivant » sans pause, le repos jusqu'à l'échéance et une durée de 2 × 60 s. Un nouveau test, « emom-9 : exercice bilatéral en Durée », vérifie que la pause est gardée. Le test Q5 encodait la règle remplacée : un seul test est modifié.
  - `ExecutionParametersSheet.format0711.test.tsx` : la ligne est absente en Répétitions, la valeur 20 s est gardée au ✓, et la ligne est présente en Durée.
  - `ExecutionScreen.emomDuree.test.tsx` : la fonction `setup` est paramétrée (aucun test existant n'est changé). Nouveau test d'anneau : côté 1 en bleu ; pendant la pause, seule la portion en cours est orange ; au côté 2, la pause reste orange et le côté 1 reste bleu ; au repos, trois portions.
- La suite complète n'est pas lancée : elle le sera à la fin de la série de missions, avec `--maxWorkers=2`.

## Hypothèses non démontrées

- Le Death by bilatéral bénéficie de la même correction de l'anneau (même code), mais aucun test écran Death by n'a été ajouté.

## PRESERVE / CHANGE / FORBIDDEN démontrés

- **PRESERVE :**
  - EMOM en durée : pause entre les côtés toujours planifiée (nouveau test « … en Durée »), contrôle des durées inchangé (`formatModels.ts` non touché), test emom-6 de l'anneau inchangé et réussi.
  - Anneau unique et centre commun : aucun changement dans `ExecutionTimerRing.tsx` ni dans la zone du centre ; le test « la zone du centre est la même que celle du For time » réussit.
  - Autres formats : For time (`ringSegmentsOf`) non touché ; la modale garde la même règle For time.
  - Moteur de fenêtres : `policies/emom.ts`, `kernel.ts` et `projection.ts` non touchés.
- **CHANGE :** les deux corrections, comme décrit ci-dessus.
- **FORBIDDEN :** un seul test existant est remplacé (Q5, règle remplacée) ; aucune primitive native n'est touchée.

## Modifications réalisées

- **Code :**
  - `src/domain/execution/plan.ts`
  - `src/features/activities/ExecutionParametersSheet.tsx`
  - `src/features/execution/ExecutionScreen.tsx`
- **Tests :**
  - `src/domain/execution/__tests__/emom.pre11.test.ts`
  - `src/features/activities/__tests__/ExecutionParametersSheet.format0711.test.tsx`
  - `src/features/execution/__tests__/ExecutionScreen.emomDuree.test.tsx`
- **Documentation (classe B, demande explicite de Hermann) :**
  - Registre ch07 : nouvelle entrée « EMOM en répétitions — pas de pause entre les côtés ; couleur des segments au changement de côté (18/11/2026) », texte de Hermann recopié. La phrase Q5 de l'entrée « EMOM — exécution (18/11/2026) » est annotée comme remplacée pour la Répétition.
  - `_bmad-output/pre11/spec-pre11-formats.md` : point 35.
  - Chapitres 09 et 12 non modifiés. Recherche ciblée de « pause entre les côtés » (ch06, ch08, ch10, ch12, ch13, Formats) : les formulations restantes portent sur la Durée (contrôle des durées), donc elles restent valables.

## Éléments non corrigés ou hors périmètre

- **Phrase de la carte de Composition :** elle affiche toujours « avec 20 s de pause au changement de côté » pour un Exercice EMOM en Répétitions qui en a une. C'était déjà le cas pour le For time. Non modifiée (non demandé) ; à arbitrer.
- **Mot « récapitulatif » :** compris comme la modale des paramètres d'exécution. Le récapitulatif du Format EMOM n'a pas de ligne « Pause entre les côtés ». À confirmer.
- **Copie du défaut du Profil :** elle a toujours lieu quand on active « Avec » dans la modale (valeur au Brouillon). Elle reste sans effet en Répétitions, comme demandé.

## Vérifications restant à faire sur iPhone

1. EMOM en Répétitions, avec « De chaque côté : Avec » et une Pause entre les côtés de 20 s : la ligne est absente de la modale. À l'exécution, « Suivant » sur le côté 1 ouvre directement le côté 2, sans compte à rebours. Après le côté 2, repos jusqu'à la minute.
2. Même exercice repassé en Durée dans la modale : la ligne « Pause entre les côtés » revient, avec 20 s.
3. EMOM en Durée, de chaque côté, avec une pause de 5 s : pendant la pause, seule la portion en cours est orange ; au côté 2, la portion de la pause reste orange et le côté 1 reste bleu.
4. Death by bilatéral avec une pause entre les côtés : même comportement de l'anneau.

## Commit final et état Git

- **Commit :** voir la section « Commit (complément) ».
- **État Git :** voir la section « Commit (complément) ».

## Tests (complément)

- Jest `--maxWorkers=2` sur `src/domain/execution`, `src/features/execution`, `src/features/activities` : 84 suites, 1 162 tests réussis, aucun échec.

## Commit (complément)

- Commit de livraison sur `recette/emom-cotes-anneau-20261119` (code, tests, documentation et ce rapport), poussé sur `origin` ; arbre propre après le push. Pas de PR, pas de fusion.
