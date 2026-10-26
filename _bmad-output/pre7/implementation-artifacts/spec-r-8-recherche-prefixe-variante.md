---
title: 'R-8 — Recette JA2 : recherche par début de mot, lien retiré, nom de variante conservé (D-448)'
type: 'bugfix'
created: '2026-10-26'
status: 'done'
baseline_commit: '5197fb71273bda6b904aa4f644450c6aabc66639'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-recette-ja2-d448.md'
  - '{project-root}/docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La recette JA2 (cr-4, remarques générales) montre que la recherche ne fonctionne pas pendant la frappe :
- « Squ », « Squats sau » ne trouvent rien ;
- « Squats » manque « Squats sauté bas » ;
- l'ordre change d'une frappe à l'autre.

La formule R02 mesure la ressemblance de noms complets, sans notion de début de mot. Le lien « Rechercher un mouvement » de l'éditeur est jugé inutile (cr-11). « Créer une variante » ne conserve pas le nom saisi sur l'iPhone (cr-8, écart à R-5).

**Approach:** Ajouter à `rankMovements` une correspondance par début de mot, prioritaire et triée de façon stable, sans toucher au score R02 ni à l'unicité C01. Retirer le lien de l'éditeur en gardant l'écran et la fonction dans le code. Rendre l'étape de variante robuste aux événements de fin de saisie du clavier.

## Boundaries & Constraints

**Always:**
- **Point 1, D-448** :
  - un mouvement est trouvé dès que chaque mot tapé, une fois normalisé (`normalizeSearchText` : accents, casse), est le début d'un mot distinct de son nom ou d'un alias ;
  - pas de rognage de pluriel ni de retrait de mots fonctionnels pour cette règle ; le dernier mot peut être partiel (« Squats sau » → « Squats sautés bas », « Squats sautés haut ») ;
  - ces résultats ouvrent le panneau sous le nom, comme une suggestion, et s'affichent aussi dans l'écran de recherche ;
  - ordre stable : nom identique (normalisé) d'abord, puis correspondances par début de mot, triées par nom normalisé puis par identifiant, puis les autres résultats R02 dans leur ordre actuel ;
  - un seul résultat par mouvement ; limite du panneau de 5 inchangée.
- Garde-fous R07 conservés : « Fente » ne liste pas Pente, « Bainage » ne suggère pas Gainage, « Natation » et « Course » ne renvoient rien. Ajuster seulement les attentes d'ordre que la nouvelle priorité modifie, en le justifiant dans le test.
- **Point 2** : plus aucun lien « Rechercher un mouvement » dans l'éditeur (Catalogue et Séance). `MovementSearchScreen` et la fonction de recherche restent dans le code, sans point d'entrée dans l'interface (précision de Hermann). Leurs tests unitaires restent ; les tests d'intégration qui passaient par le lien sont retirés ou réécrits.
- **cr-8** : après « Créer une variante », le nom saisi reste dans le champ avec l'invite grise « (compléter le nom) ». Ni la fin de saisie (`onEndEditing`, perte du focus, fermeture du clavier) ni un `onChangeText` qui renvoie le même texte n'annulent l'étape de variante, ne masquent l'invite ou ne vident le nom. Seule une modification réelle du texte masque l'invite.
- C01 (`findMovementNameConflict`) inchangé.

**Never:** modifier les coefficients ou seuils R02 ; supprimer `MovementSearchScreen` ; ajouter un autre point d'entrée.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Début de mot | « Squ » ; Squats, Squats sautés bas, Pompes | Squats, Squats sautés bas (par nom) | N/A |
| Deux mots, dernier partiel | « Squats sau » | Squats sautés bas, Squats sautés haut | N/A |
| Ordre stable | « Squats as » puis « Squats ass » | Même ordre relatif des Squats assistés | N/A |
| Alias | « push » ; alias « push-up » de Pompes | Pompes, une fois | N/A |
| Aucun début | « Natation » | `[]` | N/A |
| Variante, fin de saisie | Variante puis `endEditing`, puis Plus facile | Nom « Squats » conservé, invite affichée | N/A |

</frozen-after-approval>

## Code Map

- `src/domain/activities/movementSuggestion.ts:245` `rankMovements` -- les alias entrent dans le score de nom (`:259`) ; filtre `< 0.45` (`:262`) ; `suggested` (`:269`) ; tri (`:279-286`). `:201` composante de préfixe sur la chaîne entière (R02, à laisser). `:60` `normalizeSearchText`.
- `src/features/activities/useMovementOriginChoice.tsx:138-159` -- le panneau ne s'ouvre que si un résultat est `suggested` (`:158-159`) ; les correspondances par début de mot doivent l'ouvrir. `:114` l'étape de variante n'est active que si `variantStep.name === name`. `:184` `setVariantOf`. `:215` `openSearch`, `:195-211` `overlays`. `:218-221` `onNameEndEditing` appelle `setDismissedFor(name)` et `setVariantOf(null)` : cause probable de cr-8, avec un `onChangeText` émis par le clavier iOS à la perte du focus.
- `src/features/sessions/ExerciseScreen.tsx:721-730`, `:742` (`patch` masque l'invite dès que `next.name` est défini), `:1476-1488`, `:1601` (`patchLocal`, même chose) ; liens de recherche à retirer : `:1122-1124`, `:1917-1921`.
- `src/features/activities/ActivityEditorForm.tsx:657-670` -- lien (`movementSearchAction`, testID `activity-editor-movement-search`, prop `:172`, défaut `:334`) ; `:496` `onEndEditing` ; `:503-523` invite.
- Tests : `src/domain/activities/__tests__/movementSearch.r07.test.ts`, `movementSuggestion.a23.test.ts`, `src/features/activities/__tests__/movementSearch.a23.test.ts`, `MovementSuggestionPanel.r5.test.tsx`, `src/features/sessions/__tests__/ExerciseScreen.r5.integration.test.tsx` (lien : L346-352, L450, L475-535, L633-670 ; variante : L431-470, L570-577), `ExerciseScreen.mfn.a31.integration.test.tsx:326`.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/movementSuggestion.ts` -- correspondance par début de mot, prioritaire et triée de façon stable ; drapeau qui ouvre le panneau -- point 1.
- [x] `src/features/activities/useMovementOriginChoice.tsx` -- ouverture du panneau sur ces correspondances ; étape de variante non annulée par la fin de saisie ni par un texte inchangé -- point 1, cr-8.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- `patch` et `patchLocal` ne masquent l'invite que si le nom change réellement ; lien retiré aux deux appels -- cr-8, point 2.
- [x] `src/features/activities/ActivityEditorForm.tsx` -- rendu du lien retiré ; prop supprimée ou inutilisée -- point 2.
- [x] Tests (`.r8`) : matrice I/O ; R07 vert ; variante avec `endEditing` et `changeText` de même texte entre « Créer une variante » et « Plus facile » ; absence du lien dans les deux éditeurs.
- [x] READMEs de `src/features/activities` et `src/features/sessions` mis à jour si le lien ou la recherche y sont décrits.

**Acceptance Criteria:**
- Given le Catalogue avec Squats et Squats sautés bas, when on tape « Squ » dans le nom, then le panneau s'ouvre avec ces deux cartes.
- Given l'éditeur, when il s'affiche au Catalogue ou en Séance, then aucun lien « Rechercher un mouvement » n'est présent.
- Given les trois contrôles, when ils s'exécutent, then ils passent.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `5197fb71`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | ECH, BH, VG | Après une fin de saisie pendant l'étape de variante, « Retour » laisse le panneau ouvert clavier fermé | low | `onNameEndEditing` ne note plus `dismissedFor` ; correction directe : noter la fin de saisie, l'étape de variante l'emportant tant qu'elle est ouverte | patch |
| 2 | ECH, BH | `patch` / `patchLocal` comparent le nom à la valeur du dernier rendu | low | Deux événements avant un nouveau rendu (fin de saisie puis même texte) ; comparaison dans la fonction de mise à jour | patch |
| 3 | BH | JSDoc de `rankMovements` : « par pertinence décroissante » et « non suggéré sous les suggérés » ne sont plus vrais | low | Paliers 0 et 1 avant le score | patch |
| 4 | BH | Commentaire JSX laissé à la place du lien retiré | low | Suppression directe | patch |
| 5 | VG | Nom identique par alias en tête : aucune assertion d'ordre | low | Gap filé | patch (test) |
| 6 | BH, VG | Tests manquants : fin de saisie hors variante (panneau fermé), changement réel de nom pendant la variante, « Squats sau » en second rang et limite de 5 | low | Gaps | patch (tests) |
| 7 | BH | Import `minTouchTarget` devenu inutile | false | Encore employé (`ActivityEditorForm.tsx:694`, `:1264`) | reject |
| 8 | BH, ECH | Une seule lettre ouvre le panneau | false | Lettre de D-448 point 1 : « un mot tapé qui est le début d'un mot du nom suffit » ; une seule lecture | reject (signalé en recette) |
| 9 | BH, ECH | Les bonus Catégorie et Zones ne réordonnent plus les paliers nom identique et début de mot ; ces paliers peuvent écarter des rapprochements R02 du panneau | false | Conséquence de l'ordre stable demandé par D-448 point 1 (« Les résultats sont triés de façon stable ») ; R02 inchangé pour le palier 2 | reject (signalé en recette) |
| 10 | BH | Retour arrière de `matchesWordPrefixes` non borné | low | Nombre de mots tapés au plus égal à celui du nom (garde en tête) ; noms de quelques mots ; aucune lenteur démontrée | reject |
| 11 | ECH | Étape de variante restée active quand la recherche se désactive puis se réactive | low | Séquence improbable ; garde supplémentaire | reject |
| 12 | ECH, BH | `openSearch`, `overlays`, `canSearch` sans point d'entrée ni test d'intégration | low | Voulu par Hermann (écran conservé sans accès) ; test d'écran conservé | defer |
| 13 | BH | Fichiers de suivi absents du diff | false | Exclus du diff par construction ; suivi mis à jour au commit | reject |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes les suites vertes
