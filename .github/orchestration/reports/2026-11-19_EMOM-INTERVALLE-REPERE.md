# 2026-11-19 — EMOM-INTERVALLE-REPERE

## Identifiant et objectif

Constat e) de la recette du 18/11/2026 (cahier en ligne, « Autres remarques », ligne n° 50 — Circuit EMOM « dans chaque intervalle », A puis B dans la même minute). Texte de Hermann :

> « - deux exercices : le numéro de série ne bouge pas. Il faut qu'on passe d'une série +1 à chaque changement de mouvement, par intervalle, le total de série = nombre de mouvements par intervalle.
> lorsqu'on appui sur suivant pour une changement de mouvement, il faut figer un cercle sur l'anneau pour marquer l'instant de changement d'exercice.
> - pendant le repos le nombre de tours disparait. Il faut le nombre de tours visible. »

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-EMOM-DUREE`, branche `recette/emom-intervalle-repere-20261119`, créée depuis `fdf0a278` (`recette/emom-serie-tour-20261119`, D-532). Branches empilées : `8c006ee7` (coins) → `5e8c7082` (emom-9) → `fdf0a278` (D-532) → cette branche. Pas de fusion, pas de PR.

## Périmètre demandé

1. Série +1 à chaque changement de mouvement dans l'intervalle, total = nombre de mouvements.
2. Cercle figé sur l'anneau à l'instant du « Suivant » qui change de mouvement.
3. Nombre de tours visible pendant le repos.

## Périmètre traité

| Point | Résultat |
|---|---|
| 1. Série | Déjà satisfait par D-532 (`countersOf`, projection.ts) : A « 1/2 », B « 2/2 », tour inchangé. Aucun code ; tests ajoutés (projection et écran). |
| 2. Repère | Implémenté : `advanceMoveMarks` (ExecutionScreen.tsx) note l'instant (temps de l'intervalle) où une étape de travail d'un autre mouvement remplace la précédente dans le même intervalle ; `ExecutionTimerRing` reçoit `marks` et dessine un cercle fixe par repère (pastille de position : rayon `RING.knobRadius`, couleur `RING.progressColor`, contour blanc `RING.knobStroke`). Effacé au changement d'intervalle. EMOM seulement. |
| 3. Tours au repos | Non reproduit : le compteur Tour reste affiché pendant le repos, au premier comme au dernier tour, sur la version livrée et avec la projection d'avant D-532 (`5e8c7082`, essai local remis en place). Test d'écran de non-régression ajouté. |

## Constats

- Le changement de mouvement dans une même fenêtre n'existe qu'en Circuit porteur EMOM « dans chaque intervalle » (À la suite et En alternance : un mouvement par fenêtre) ; la détection « autre mouvement dans le même intervalle » vise donc exactement ce cas.
- Cas voisins non traités (règle « pas de changement extrapolé ») : Death by à membres « dans chaque intervalle » (même écran, même situation) — pas de repère ; changement de côté d'un même mouvement — pas de repère.
- Point 3 : l'écran utilise `previousCounters` (compteurs de la Série terminée) pendant le repos ; la projection les fournit pour chaque `WINDOW_REST`. Cause de l'observation iPhone indéterminée (composition différente ? version servie ?).

## Preuves et tests

- `npx tsc --noEmit` : 0 erreur.
- eslint sur les 4 fichiers touchés : 0 problème.
- Nouveaux tests :
  - `src/domain/execution/__tests__/emom.intervalleRepere.test.ts` (2) : séquence A S1/2 T1/3, B S2/2 T1/3… ; tour présent à chaque repos ;
  - `src/features/execution/__tests__/ExecutionScreen.emomIntervalle.test.tsx` (3) : séries 1/2 puis 2/2 dans la minute, repère à 0,25 (Suivant à 15 s sur 60) conservé au repos, effacé au tour suivant, tour visible au repos (tours 1 et 2) ; `advanceMoveMarks` (changement de côté et hors EMOM : aucun repère).
- `npx jest src/features/execution src/domain/execution --maxWorkers=2` : 31 suites, 217 tests réussis.
- Suite complète non lancée (prévue à la fin de la série).

## Hypothèses non démontrées

- Le rendu du cercle figé (SVG) n'est pas vérifiable en Jest (`hasSvg()` faux) : seul le passage des positions à l'anneau est testé.
- L'instant noté est le temps de l'intervalle à la première projection de la nouvelle étape (immédiatement après l'appui).

## Modifications réalisées

- `src/features/execution/ExecutionScreen.tsx` : état `moveMarks`, `advanceMoveMarks`, passage `marks` à l'anneau.
- `src/features/execution/ExecutionTimerRing.tsx` : propriété `marks` (cercles figés).
- Tests : 2 fichiers nouveaux.
- Documentation (classe B) : registre ch07, complément de D-532 (texte de Hermann recopié) ; ch13 CE-FMT-05 complété ; spec PRE-11 §5 point 37. Chapitres 09 et 12 non modifiés.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE — moteur de fenêtres, policies, plan, projection : aucun fichier de `src/domain` modifié hors tests (`git diff --stat fdf0a278` ne liste que les fichiers ci-dessus). Autres formats : `moveKey` est `null` hors EMOM ; repères vides hors changement de mouvement. Portions colorées existantes (`segments`) inchangées ; les 217 tests d'exécution existants passent.
- CHANGE — repère sur l'anneau ; tests du compteur de séries et des tours au repos.
- FORBIDDEN — aucune réécriture de tests existants, aucune primitive remplacée (même `react-native-svg`), aucune bibliothèque ajoutée.

## Non corrigé / hors périmètre

- Point 3 non reproduit : aucune correction de code sans cause démontrée.
- Style du repère à valider par Hermann (pastille figée, bleu de l'anneau, contour blanc).

## À vérifier sur iPhone

- Circuit EMOM « dans chaque intervalle », 2 mouvements, 2 tours : Série 1/2 sur A, 2/2 sur B ; cercle figé à l'instant du Suivant sur A ; il reste pendant B et le repos, disparaît à la minute suivante.
- Pendant le repos : Tour 1/2 (puis 2/2) toujours affiché. Si le tour disparaît encore, noter la composition exacte (nombre de mouvements, côtés, durée/répétitions).

## Fichiers modifiés

- `src/features/execution/ExecutionScreen.tsx`
- `src/features/execution/ExecutionTimerRing.tsx`
- `src/domain/execution/__tests__/emom.intervalleRepere.test.ts` (nouveau)
- `src/features/execution/__tests__/ExecutionScreen.emomIntervalle.test.tsx` (nouveau)
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/13 – …` (CE-FMT-05)
- `_bmad-output/pre11/spec-pre11-formats.md`
- ce rapport

## Commit final et état Git

Voir le commit qui contient ce rapport (branche `recette/emom-intervalle-repere-20261119`, poussée) ; arbre propre attendu après le commit.
