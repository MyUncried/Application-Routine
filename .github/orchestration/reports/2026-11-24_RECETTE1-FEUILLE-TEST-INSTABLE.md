# 2026-11-24 — RECETTE1-FEUILLE-TEST-INSTABLE

## Identifiant et objectif

- **Mission** : `RECETTE1-FEUILLE-TEST-INSTABLE`. Diagnostic et correction de l'instabilité du test
  `src/features/sessions/__tests__/CompositionScreen.recette1.test.tsx`, cas « Demande de Hermann du 29/10/2026 — toucher
  d'une carte « Paramètres à compléter » › ancien modèle : carte à compléter → feuille de paramètres, sans l'éditeur ;
  carte complète → éditeur ». L'attente `expect(screen.queryByTestId("execution-sheet")).toBeNull()` (ligne 260) recevait
  encore la feuille.
- **Type** : diagnostic et correction (test seulement).

## Branche et commit de départ

- Branche : `claude/happy-goodall-j94d3p` (branche dédiée de la session).
- Départ : `6ce2d83` (main du 24/11/2026, « feat(i18n): J1.8 — Programmes, Planification, Confidentialité et rappels traduits »).
- Dépôt cloné en historique partiel (`git rev-parse --is-shallow-repository` = `true`, 415 commits, le plus ancien du 28/10/2026).

## Périmètre demandé

1. Mesurer la fréquence (environ 20 exécutions) sur `fe7d71d` et sur `main`. Établir si le chantier des langues l'a
   aggravée, avec une attribution classée (démontrée, plausible ou indéterminée).
2. Trouver la cause et corriger le test pour qu'il attende l'état final, sans changer ce qu'il vérifie ni le code de
   l'application (sauf défaut démontré de l'application).
3. Prouver la stabilité (20 exécutions vertes) et vérifier que la suite complète reste verte.

## Périmètre réellement traité

Les points 1 à 3 sont traités. Les mesures portent aussi sur trois commits intermédiaires, pour situer l'aggravation.
Les cas D-442 de `CompositionScreen.test.tsx` cités en contexte n'ont pas été instruits séparément : ils n'ont pas échoué
pendant la suite complète lancée ici (une seule exécution ; voir « Hypothèses non démontrées »).

## Constats

### Mécanisme (démontré par instrumentation)

1. Une feuille de paramètres ouverte depuis une carte (`useMovementExerciseIntake.tsx`, `presentation="compositionCard"`)
   se ferme avec une animation (`closeAnimated`, `ExecutionParametersSheet.tsx:829-845`). `onCancel` n'est appelé, et la
   feuille démontée, qu'à la fin de cette animation (`Animated.parallel([...]).start(() => done())`).
2. Sous Jest, cette animation ne dure pas `CARD_SHEET_MOTION_MS` (450 ms). Elle utilise le pilote natif
   (`useNativeDriver: true`) et sa fin est déclenchée par le module natif simulé de React Native :
   `startAnimatingNode: jest.fn((…, endCallback) => { setTimeout(() => endCallback({finished: true}), 16); })`
   (`node_modules/@react-native/jest-preset/jest/mocks/NativeModules.js:96-98`). La fermeture se termine donc sur une
   minuterie réelle d'environ 16 ms, qui démarre au toucher de « Annuler ».
3. Après le **second** « Annuler », le test n'attendait qu'un tour d'`act` (`await act(async () => undefined)`) avant de
   toucher la photo, puis un second tour avant l'assertion. La minuterie de 16 ms n'a la possibilité de s'exécuter
   pendant ces tours que si elle est déjà échue. Le test réussit donc seulement si le rendu synchrone du toucher
   « Annuler » dure au moins environ 16 ms. Sinon, la feuille est encore montée au moment de l'assertion.
4. Mesures de la sonde (temps en ms, sources jetables hors dépôt, puis supprimées) :
   - sur `main`, les échecs correspondent tous à un toucher « Annuler » rendu en 14 ms (`cancelPress` 14, 14, 14), avec
     un `act` qui rend la main en 0 à 1 ms et une feuille encore présente ;
   - les réussites correspondent à des rendus de 16 à 31 ms ; l'`act` dure alors 10 à 22 ms et la feuille a disparu ;
   - la fin de l'animation est mesurée entre 16 et 30 ms après `closeAnimated` (`finished: true`), et non à 450 ms.
5. Le premier « Annuler » du même cas attend déjà 600 ms de temps réel (ajout du 13/11/2026), ce qui suffit toujours.
   Le second cas (« disposition générale (deux Circuits) ») attend `CARD_SHEET_MOTION_MS + 150` après chaque
   « Annuler » (ajout du 08/11/2026). Seul le second « Annuler » du cas en cause n'a jamais reçu d'attente.

L'application n'a pas de défaut : la feuille se ferme comme prévu à la fin de l'animation. Le défaut est l'attente
insuffisante du test.

### Fréquence mesurée

Chaque exécution porte sur le fichier seul (`npx jest src/features/sessions/__tests__/CompositionScreen.recette1.test.tsx --silent`),
avec un cache de transformation déjà chaud, une exécution à la fois et une alternance des commits comparés pour égaliser
la charge. Tous les échecs observés sont à la ligne 260.

| Commit | Situation | Échecs / exécutions |
| --- | --- | --- |
| `fe7d71d` | avant le lot du 24/11 (référence demandée) | 0 / 20 |
| `1dd13c6` | intégration du 24/11, avant les fusions Formats PRE-11 et Langues J1 | 5 / 20 |
| `b3fe5e1` | après la fusion Formats PRE-11, avant la fusion Langues J1 | 11 / 20 |
| `6c067e9` | juste avant la fusion Langues J1 (`7f57801`) | 8 / 20 |
| `7f57801` | fusion Langues J1 | 12 / 20 |
| `6ce2d83` | main du 24/11 | 9 / 20 |
| `d34eabb` | branche corrigée | **0 / 20** |

Constats utilisateur du 24/11 rappelés pour comparaison : `fe7d71d` 1 échec sur 4, `6ce2d83` 3 échecs sur 4.

### Diagnostic historique (règle « Diagnostic historique » de CLAUDE.md)

- **Parcours exact** : cas « ancien modèle » de `CompositionScreen.recette1.test.tsx`, fichier lancé seul.
- **Dernière preuve de succès comparable** : `fe7d71d`, 0 échec sur 20 ici. Le constat utilisateur donne toutefois
  1 échec sur 4 sur ce même commit : l'instabilité y existe déjà, à basse fréquence.
- **Premier échec conservé** : rapport `2026-11-13_PRE11_FORMATS.md`, ligne 158 (« attendait la fermeture animée de la
  feuille sans délai […] passe isolément à HEAD, échouait ici ; attente réelle ajoutée »). Cette correction ne visait
  que le premier « Annuler » (ajout de `setTimeout(resolve, 600)`, publié dans `4d08903` le 16/11/2026). Avant cela,
  `_bmad-output/pre9/implementation-artifacts/spec-menu-creer-parametres-01-11.md` (ligne 248) signalait déjà une
  instabilité du cas « disposition générale (deux Circuits) », corrigée le 08/11/2026 (commentaire dans le test).
- **Mécanisme introduisant le défaut** : la fermeture animée d'une feuille ouverte depuis une carte (recette iPhone n° 2
  du 31/10/2026, constat d), combinée à la ligne du test qui enchaîne « Annuler » puis le toucher de la photo sans
  attendre la fin. Ces deux éléments sont présents dès `3347586` (14/11/2026), commit le plus ancien qui touche le
  fichier dans l'historique partiel. Le commit exact d'introduction est antérieur à cette limite : il n'est **pas
  vérifiable** dans ce clone.
- **Commits correctifs antérieurs** : correction du 08/11/2026 (second cas) ; `4d08903` (16/11/2026, premier « Annuler »
  seulement) ; ce correctif (`f442e72`, commentaire précisé dans `d34eabb`), pour le second « Annuler ».
- **Introduction et détection** : le défaut est introduit avant le 14/11 (au plus tard le 13/11, date de sa première
  détection). Les variations de fréquence observées ensuite ne sont que des variations de détection : la course entre
  le rendu et la minuterie de 16 ms penche selon la durée du rendu.
- **Attribution de l'aggravation au chantier des langues** :
  - **démontré** : la fréquence est plus élevée sur `main` (9/20) que sur `fe7d71d` (0/20) ;
  - **démontré** : l'aggravation est déjà présente **avant** la fusion Langues J1 (`1dd13c6` 5/20, `b3fe5e1` 11/20,
    `6c067e9` 8/20). L'écart entre `6c067e9` (8/20) et `7f57801` (12/20) n'est pas significatif sur 20 exécutions ;
  - **conclusion** : le chantier des langues n'est **pas** la cause démontrée de l'aggravation, ni une cause plausible
    principale. Le changement qui fait basculer la durée de rendu sous les 16 ms entre `fe7d71d` et `1dd13c6` est
    **indéterminé** (bissection non faite) ;
  - la fusion Formats PRE-11 (`b3fe5e1`, qui modifie aussi `ExecutionParametersSheet.tsx`) coïncide avec une hausse
    (5/20 → 11/20). C'est **plausible**, mais pas démontré : l'écart reste dans le bruit attendu sur 20 essais ;
  - quel que soit ce changement, il ne fait que révéler un défaut du test. Aucun correctif de l'application n'est justifié.

## Modifications réalisées

- `src/features/sessions/__tests__/CompositionScreen.recette1.test.tsx` :
  - import de `waitFor` depuis `@testing-library/react-native` ;
  - après le second « Annuler », `await act(async () => undefined)` est remplacé par
    `await waitFor(() => expect(screen.queryByTestId("execution-sheet")).toBeNull(), { timeout: 3000 })`, avec un
    commentaire daté qui décrit le mécanisme.
- Ce que le test vérifie ne change pas. La feuille doit avoir disparu après « Annuler » : c'était déjà l'intention, et
  le premier « Annuler » le vérifie de la même façon. Après le toucher de la photo, les assertions sont inchangées :
  feuille absente et `mockPush` vers `/exercise-sheet`.
- Aucun code de l'application n'est modifié.

### Synchronisation code / documentation

Classe **D** : modification d'un test seulement, sans effet sur un comportement observable, une règle métier ou un
contrat. Aucun document mis à jour, aucun correctif préparé.

## Preuves et tests

- Stabilité du correctif : 20 exécutions du fichier seul sur la branche corrigée, 20 sur 20 vertes (11 tests réussis sur
  11 à chaque fois).
- Suite complète (`npx jest --silent`, configuration du dépôt, 2 workers) sur la branche corrigée :
  `Test Suites: 476 passed, 476 total` ; `Tests: 32 skipped, 6722 passed, 6754 total` ; durée 295,5 s ; code de sortie 0.
- `npx tsc --noEmit` : code de sortie 0.
- Mesures de fréquence : tableau ci-dessus (scripts et journaux dans le répertoire temporaire de la session, hors dépôt).
- Instrumentation : sonde temporaire (horodatages autour de « Annuler », de la photo et des `act`, fin de
  `closeAnimated`) appliquée dans des copies de travail jetables de `fe7d71d` et de `main`. Ces copies ont été
  supprimées et rien n'a été committé.

## Hypothèses non démontrées

- Le commit qui raccourcit le rendu du toucher « Annuler » entre `fe7d71d` et `1dd13c6` n'est pas identifié.
  Vérification ciblée possible : bissection sur ces commits avec environ 20 exécutions par étape, ou sonde `cancelPress`.
- Les échecs intermittents des cas D-442 de `CompositionScreen.test.tsx` sous la charge de la suite complète ne se sont
  pas reproduits pendant l'unique exécution complète de cette mission. Leur cause n'est pas établie. Elle pourrait
  relever du même schéma (attente d'un seul tour d'`act` face à une minuterie réelle), mais ce n'est pas démontré.
  Vérification ciblée possible : exécuter `CompositionScreen.test.tsx` en boucle sous charge (suite complète en
  parallèle) et relever les cas et lignes en échec.

## Éléments non corrigés ou hors périmètre

- Les cas D-442 de `CompositionScreen.test.tsx` (voir ci-dessus) ne sont pas corrigés.
- Le premier « Annuler » du même cas garde son attente fixe de 600 ms : elle est suffisante et hors du défaut constaté.
- Le message du commit `f442e72` attribue la durée de fermeture sous Jest à `CARD_SHEET_MOTION_MS`, ce qui est inexact.
  Le commentaire du test est corrigé dans `d34eabb` ; l'historique déjà poussé n'est pas réécrit.

## Vérifications restant à effectuer sur appareil réel

Aucune : seul un test Jest est modifié. Le comportement de l'application sur iPhone n'est pas touché.

## Fichiers modifiés

- `src/features/sessions/__tests__/CompositionScreen.recette1.test.tsx`
- `.github/orchestration/reports/2026-11-24_RECETTE1-FEUILLE-TEST-INSTABLE.md` (ce rapport)

## Commits

- `f442e72` : correctif du test.
- `d34eabb` : commentaire du correctif (mécanisme réel sous Jest).
- Commit final : celui qui ajoute ce rapport, sur `claude/happy-goodall-j94d3p`. Son hash est communiqué à la livraison :
  un fichier ne peut pas contenir le hash du commit qui l'ajoute.

## État Git

Branche `claude/happy-goodall-j94d3p`, partie de `6ce2d83`. Après le commit du rapport : arbre de travail propre,
branche poussée sur `origin`, aucune copie de travail résiduelle (`git worktree list` : dépôt principal seulement).
