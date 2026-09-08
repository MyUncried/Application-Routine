# T02 — Correctif ciblé post-test-utilisateur (2026-09-08)

## Identification

| Élément | Valeur |
| --- | --- |
| Mission | Correctif ciblé T02 après test utilisateur — reprise de session existante |
| Nature | Correction (5 points explicitement listés par l'utilisateur, hors plan/réimplémentation T02) |
| Branche | `feat/creation-seance-catalogue` |
| Commit de départ | `739a825b5d755c009c55e751ce50990977bbab37` |
| Statut | **IMPLÉMENTÉ ET VÉRIFIÉ** — suite ciblée puis suite complète vertes (870/870), `tsc --noEmit` sans erreur |

## Périmètre demandé

Exactement les cinq points listés par l'utilisateur : (1) métriques du Tour strictement `IN_TOUR` ; (2) vérification (sans modification si déjà correct) des invariants structurels de déplacement `BEFORE_TOUR ↔ IN_TOUR ↔ AFTER_TOUR` + sauvegarde/réouverture ; (3) désactivation du geste horizontal global de retour, préservation des gestes de carte ; (4) ordre et représentation des contrôles Activité (Série puis mode/paramètre, badge « À l'échec ») ; (5) icône `+` du bouton Média (jamais un caractère de texte). Explicitement hors périmètre : toutes les autres remarques UX listées par l'utilisateur (espacements, icônes de cartes fixes, temps estimé sur carte, tailles Retour/Annuler/Valider, fluidité/animations swipe, swipe droit, fermeture/animations des actions, drag dynamique, animation de transition après validation). Ni le plan T02 ni sa documentation n'ont été relus ou refaits ; le point de départ a été le code déjà présent dans l'arbre de travail (implémentation T02-S01 non committée, cf. `.github/orchestration/reports/2026-09-08_T02-S01.md`, déjà présent avant cette mission).

## Périmètre réellement traité

Les cinq points ont été traités intégralement. Le point 2 n'a nécessité **aucune modification de code** — les invariants demandés sont déjà corrects et déjà couverts par les tests existants de la tranche T02-S01, désormais exécutés et vérifiés verts pour la première fois (ils ne l'avaient jamais été : la session T02-S01 n'avait pas pu exécuter `jest`/`tsc`, permissions refusées dans son environnement). Un test préexistant hors des cinq points (`CatalogueCompositionEditFlow.integration.test.tsx`, test n°1) s'est révélé dépasser de façon reproductible son délai par défaut sous charge complète de la suite (47 suites en parallèle) ; corrigé par l'ajout d'un délai explicite, seule intervention hors périmètre strict, nécessaire pour obtenir une suite complète verte.

## Constats

### Point 1 — Métriques du Tour

**Constat.** `formatCompositionSummary` (`compositionPresentation.ts`), qui alimente la synthèse `N activité(s) · durée` affichée **sous `Nombre de tours`, dans le conteneur Tour**, sommait à tort le nombre ET une partie de la durée sur les **trois zones structurelles** (`BEFORE_TOUR`/`IN_TOUR`/`AFTER_TOUR`) au lieu de la seule zone `IN_TOUR`. Seule la part `IN_TOUR` de la durée était correctement multipliée par `tourRepeatCount` ; les zones hors Tour contribuaient quand même au nombre affiché et à une part non multipliée de la durée. Le défaut était bien à la source du calcul (cette fonction), pas seulement à l'affichage — aucune autre fonction ne re-filtre son résultat.

**Correction.** La fonction ne considère plus que les Activités dont `structuralPosition === "IN_TOUR"`, aussi bien pour le nombre que pour la durée (multipliée par `tourRepeatCount`) ; `BEFORE_TOUR`/`AFTER_TOUR` sont exclues à la source. Le Catalogue (`computeActivityCount`, `calculations.ts`), qui compte légitimement les trois zones pour une métrique distincte (« Nombre d'Activités de la Composition », RM-074), n'a pas été touché.

### Point 2 — Invariants structurels

**Constat après vérification** (aucune modification de code) : les invariants demandés sont déjà corrects.
- *Aucune Activité perdue ou dupliquée lors d'un déplacement* : démontré par `domain/sessions/__tests__/composition.test.ts`, test explicite « never creates, duplicates nor loses an Activity », plus les tests de conservation d'identité/paramètres et de bornes d'indice.
- *`structuralZone` correctement persistée* : démontrée par `infrastructure/database/__tests__/SqliteSessionRepository.test.ts`, notamment « creates the three structural zones with per-zone positions, a NULL tour_id outside the Tour and the real tour repeat count » et le test de mise à jour déplaçant une Activité entre les trois zones puis relisant l'agrégat.
- *Positions recalculées/persistées par zone* : mêmes tests, colonne `position` vérifiée par zone après création et après mise à jour.
- *Ordre restauré après réouverture* : `SqliteSessionRepository.test.ts`, « preserves collection order across a connection close and reopen (real SQLite file) » (vraie connexion fermée/rouverte, pas seulement le même `Database` en mémoire) et le test de mise à jour multi-zones relisant l'agrégat complet.

Le Compte à rebours initial et la Fin de séance restent non déplaçables — comportement non modifié, conforme à la confirmation de l'utilisateur.

### Point 3 — Navigation

**Constat.** Le `Stack` de `app/(creation)/_layout.tsx` ne désactivait pas le geste natif iOS de retour par glissement (bord gauche → droite) de `react-native-screens`/native-stack. Ce reconnaisseur de gestes est natif, extérieur à l'arbre React Native : il n'est jamais arrêté par la capture de responder JS de `compositionGesture.ts` qui gère les gestes horizontaux propres aux cartes d'Activité.

**Correction.** `gestureEnabled: false` ajouté aux `options` de l'écran `composition` du `Stack`. Les gestes propres aux cartes (glissement gauche pour révéler `Dupliquer`/`Supprimer`, glissement inverse pour refermer) ne dépendent jamais de ce geste natif de navigation — ils restent inchangés, uniquement portés par le responder system interne à l'écran, déjà couvert par `compositionGesture.test.ts` et les tests de gestuelle de `CompositionScreen.test.tsx`.

**Limite de preuve.** Un `gestureEnabled: false` sur un écran de navigateur natif ne peut pas être vérifié par Jest (comportement natif de gestion de gestes, hors du DOM simulé) — conforme à la réserve déjà posée par le rapport T02-S01 (§ RT-001/RM-070) sur les comportements natifs sensibles : validation sur appareil réel nécessaire.

### Point 4 — Contrôles Activité

**Constat.** Deux écarts dans `ExerciseScreen.tsx`, rangée `Activity / Parameter Row` :
1. l'ordre affiché était `[Durée ou Répétitions], Pause, Séries` — `Séries` en dernier, pas en tête ;
2. en mode « À l'échec », l'emplacement du paramètre de mode restait vide (ni Durée ni Répétitions n'y étaient rendues, et rien ne le remplaçait).

**Correction.** Nouvel ordre `Séries, [paramètre du mode], Pause`. En mode « À l'échec », un nouveau composant statique non pressable (`ToFailureField`) occupe désormais cet emplacement : même cadre visuel que les autres colonnes (fond, bordure, rayon, largeur), sans chevron, texte `À l'échec` dans le token violet déjà canonique du Design System (`colors.selection`, `#5F60EE`) — aucune nouvelle valeur de couleur n'a été introduite.

**Point à clarifier explicitement (voir section dédiée plus bas).** L'instruction précise « l'ordre Série puis mode/paramètre correspondant » sans préciser la position exacte de `Pause` ; en l'absence d'accès Figma dans cette session, `Pause` a été placée en dernier (après le paramètre de mode), lecture la plus directe de l'instruction. Cette position doit être confirmée visuellement contre Figma/T02.

### Point 5 — Ajouter un média

**Constat.** Le libellé `t.addMedia` valait littéralement `"+ Ajouter un média"` — le caractère `+` faisait partie du texte affiché, jamais une icône.

**Correction.** Le libellé devient `"Ajouter un média"` (sans `+`) ; l'icône vectorielle canonique du Design System `action-add` (`KodjoIcon`, déjà utilisée par `+ Ajouter une activité` de `CompositionScreen.tsx`) est rendue séparément, avant le texte. La règle MVP est inchangée : le bouton reste visible mais désactivé (`disabled`, aucun `onPress`, aucune section Médias).

## Preuves et tests

### Tests ciblés exécutés en premier (zones et composants concernés)

| Fichier | Résultat |
| --- | --- |
| `domain/sessions/__tests__/composition.test.ts` | PASS (invariants de zone, point 2) |
| `features/sessions/__tests__/compositionGesture.test.ts` | PASS (seuils/résolution de geste, point 2/3) |
| `domain/sessions/__tests__/calculations.test.ts` | PASS |
| `features/sessions/__tests__/compositionPresentation.test.ts` | PASS après correction des fixtures obsolètes (point 1) — 65/65 |
| `infrastructure/database/__tests__/SqliteSessionRepository.test.ts` | PASS (persistance/réouverture, point 2) — 60/60 |
| `domain/sessions/__tests__/SessionDraft.test.ts` | PASS |
| `domain/sessions/__tests__/validation.test.ts` | PASS |
| `features/sessions/__tests__/CompositionScreen.test.tsx` | PASS après correction de 4 fixtures obsolètes (point 1) — 120/120 |
| `features/sessions/__tests__/ExerciseScreen.test.tsx` | PASS avec 5 tests nouveaux (points 4/5) — 63/63 |
| `shared/i18n/index.test.ts` | PASS après correction d'une assertion obsolète (point 5) |

### Suite complète

```
npx jest --silent
Test Suites: 47 passed, 47 total
Tests:       870 passed, 870 total
```

```
npx tsc --noEmit
(aucune sortie — aucune erreur)
```

`npm run lint` (`expo lint`) rapporte **une erreur préexistante, hors périmètre** dans `src/features/sessions/SessionDraftProvider.tsx:48` (« Cannot access refs during render », `react-hooks/refs`) — fichier non touché par cette mission ni par aucun des cinq points ; laissée telle quelle conformément à la consigne de modification minimale et à la liste des points hors périmètre. Signalée ici pour information, non corrigée.

### Tests corrigés parce qu'ils supposaient encore l'ancien périmètre (obsolètes, jamais le code corrigé régressé)

- `compositionPresentation.test.ts` : la quasi-totalité des fixtures d'un seul Exercice utilisaient `createExerciseDraft(id)` sans préciser `structuralPosition` ; comme cette fonction positionne par défaut `BEFORE_TOUR` (T02-S01), ces fixtures produisaient `"0 activité · 0 min"` sous le correctif. Un alias local `inTourExercise(id)` les positionne désormais explicitement `IN_TOUR`. Le bloc « trois zones structurelles » a été réécrit pour affirmer et démontrer le comportement corrigé (exclusion effective de `BEFORE_TOUR`/`AFTER_TOUR`, y compris un nouveau test dédié).
- `CompositionScreen.test.tsx` : quatre tests seedaient une Activité unique sans `structuralPosition` explicite (même cause) ; un cinquième (« an out-of-Tour Activity is never multiplied by the tour count ») testait une Activité `BEFORE_TOUR` seule et attendait qu'elle apparaisse comptée une fois dans la synthèse du Tour — comportement désormais faux par construction (elle doit être totalement exclue). Réécrit avec une Activité `BEFORE_TOUR` **et** une `IN_TOUR`, pour prouver à la fois l'exclusion et la non-multiplication du nombre.
- `CompositionExerciseFlow.integration.test.tsx` : attendait qu'ajouter une Activité (insérée `BEFORE_TOUR` par défaut, D-078/RM-020, « entre Compte à rebours et Tour ») fasse passer la synthèse du Tour de l'état vide à `"1 activité · ..."`. Sous le correctif, cette Activité restant `BEFORE_TOUR`, la synthèse du Tour doit rester à l'état vide — réécrit en ce sens.
- `shared/i18n/index.test.ts` : asserait littéralement l'ancien libellé `"+ Ajouter un média"`.

Aucun test n'a été affaibli ou supprimé pour faire passer la suite : chaque correction remplace une assertion qui décrivait l'ancien comportement (bug) par une assertion décrivant le comportement corrigé, avec un commentaire explicite daté.

### Test non lié aux cinq points, corrigé pour obtenir une suite complète verte

`CatalogueCompositionEditFlow.integration.test.tsx`, test n°1 : dépassait de façon reproductible le délai par défaut de 5000 ms **uniquement sous charge complète de la suite** (47 suites Jest en parallèle) ; passait de façon fiable en isolation, et passait aussi à 30000 ms sous charge sans qu'aucune assertion n'échoue jamais. Diagnostic : coût réel du tout premier rendu `renderRouter` (vrai navigateur, vraie initialisation SQLite) dans ce fichier, pas une régression logique — confirmé en isolant successivement chacun des cinq points (aucun n'a, seul, reproduit ce dépassement en dehors de la charge complète). Corrigé par l'ajout d'un délai explicite de 20000 ms, même palier que `CategoriesSaveFlow.integration.test.tsx`, déjà porté à cette valeur pour la même raison antérieurement.

## Hypothèses non démontrées

1. **Position exacte de `Pause après Série` dans l'ordre corrigé du point 4** (voir « à clarifier » ci-dessous) — placée en dernier faute d'accès Figma direct dans cette session.
2. **Teinte violette exacte du badge « À l'échec »** — `colors.selection` (`#5F60EE`) réutilisé comme seul token « violet » déjà canonique du Design System pour du texte sur fond clair ; sa conformité exacte au nœud Figma T02 n'a pas pu être vérifiée directement (pas d'accès MCP Figma dans cette session).
3. **`gestureEnabled: false` (point 3)** : la suppression du geste natif de retour ne peut être prouvée que sur appareil réel ou simulateur — non vérifiable par Jest.
4. Les deux tests intégration à délai dépassé (`CatalogueCompositionEditFlow`, `CategoriesSaveFlow`) sont traités comme un effet de charge de la suite complète, pas comme une régression logique — hypothèse appuyée par une réexécution isolée systématique de chaque point, mais non par une mesure de profilage formelle.

## Point restant à clarifier

**Position de `Pause après Série` dans la rangée de paramètres corrigée (point 4).** L'instruction précise littéralement « l'ordre Série puis mode/paramètre correspondant » sans se prononcer sur `Pause`. Ce correctif a retenu `Séries → [mode/paramètre] → Pause`, lecture la plus directe du texte reçu, sans accès Figma pour la confirmer visuellement dans cette session. Si l'ordre exact attendu diffère (par exemple `Séries → Pause → [mode/paramètre]`), seule la réorganisation des trois `ParameterField`/`ToFailureField` dans `ExerciseScreen.tsx` est à revoir — la largeur, le style et le contenu de chaque colonne restent inchangés.

## Fichiers modifiés

```
M app/(creation)/_layout.tsx
M src/features/sessions/ExerciseScreen.tsx
M src/features/sessions/compositionPresentation.ts
M src/shared/i18n/resources/fr.ts
M src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx
M src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx
M src/features/sessions/__tests__/CompositionScreen.test.tsx
M src/features/sessions/__tests__/ExerciseScreen.test.tsx
M src/features/sessions/__tests__/compositionPresentation.test.ts
M src/shared/i18n/index.test.ts
```

Aucun autre fichier de l'arbre de travail n'a été touché par cette mission. L'arbre contenait, avant cette mission et indépendamment d'elle, l'implémentation non committée de la tranche `T02-S01` (`.github/orchestration/reports/2026-09-08_T02-S01.md`, ~25 fichiers applicatifs) ainsi que plusieurs fichiers `.github/orchestration/KODJO_PROTOCOL_V2_*` non trackés apparus pendant cette session sans action de ma part — ni les uns ni les autres ne sont inclus dans le commit de cette mission (voir « État Git »).

## Commit

Seuls les dix fichiers listés ci-dessus, plus le présent rapport, ont été indexés et committés par cette mission — jamais le reste de l'arbre de travail (implémentation T02-S01 en cours, non revue, non mienne à committer). Hash renseigné après commit dans le message de clôture de la conversation.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant mission : `739a825b5d755c009c55e751ce50990977bbab37`
- Le reste de l'arbre de travail (implémentation T02-S01 non committée + fichiers `KODJO_PROTOCOL_V2_*` non trackés apparus pendant cette session) reste **intact et non committé**, exactement dans l'état où cette mission l'a trouvé.
