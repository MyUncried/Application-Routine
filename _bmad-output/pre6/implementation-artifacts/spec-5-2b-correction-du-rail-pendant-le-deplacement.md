---
title: 'Story 5.2b — Correction du rail de Composition pendant le déplacement'
type: 'bugfix'
created: '2026-10-22'
status: 'done'
baseline_commit: 'c3795251'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-2-rail-segmente-circuit-bornes-et-points-d-arret.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem (recette iPhone, Hermann) :** « Correction du rail de Composition pendant le déplacement ». Le rail vertical de la Composition (story 5.2, D-435) devient discontinu pendant le réordonnancement ; certains segments restent associés à d'anciennes positions et ne rejoignent plus les éléments suivants ; segments interrompus ou décalés après la dépose ; une fois, le rail traversait complètement le gabarit photo (média 64 × 64) d'un Exercice ; observé notamment en réordonnant plusieurs cartes successivement dans le Circuit.

**Approach :** corriger le rendu et le recalcul du rail seulement, en réutilisant le mécanisme existant (liens portés par chaque élément, registre partagé de translations, géométrie figée au début du geste), à partir de la géométrie mesurée — sans constante de décalage ni segment codé en dur.

## Invariants attendus

- Chaque segment relie les bords des éléments (anneaux, médias, points d'arrêt, bas du Circuit, Fin) et ne traverse jamais un média, y compris pendant l'animation.
- Après dépose ou annulation, la géométrie est correcte immédiatement.
- Correct au défilement et aux changements de hauteur.

## Boundaries & Constraints

**Always :** carte soulevée à 84 × largeur + 8 (Figma, validé) ; `tokens.ts` inchangé ; fins de ligne de chaque fichier conservées ; Jest avec `--maxWorkers=2`.

**Never :** règles de déplacement, positions, RM-251, rattachement des récupérations ; calculs, modèle de données, API ; styles et dimensions validés ; constantes de décalage ou segments en dur ; `git stash`, indexation, commit.

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` -- `activityBlockDragged` : `marginVertical: -heightDelta / 2` (soulèvement neutre) ; rangée du point d'arrêt de la carte soulevée translatée de `heightDelta / 2` (`rowBelowTransform`) ; `DragShiftSession` : `preview.heldTranslationY` (dialogue de perte), `release` (pose de départ de la carte relâchée), `settling` (retour en cours) ; `endDragSession(current, animated, release)` ; `railSkip` (soulevée, tenue ou en retour) ; `raisedActivityId` (zone, Circuit et rangée au premier plan) ; rail de surface propre d'une carte hors chaîne non soulevée ; `handleRowDragStart` (`reset()` avant le relevé ; interruption avec la position atteinte) ; `enterPlacement` (fin immédiate) ; `RailLink` du bas du Circuit (`minLength` 14) ; `railGeometryFor` exporté.
- `src/features/sessions/useAnimatedShift.ts` -- `apply(targets, animated, release)` (pose de départ consommée une fois), `reset()`, `whenSettled` (premier plan de la carte en retour seulement), `ShiftRelease`.
- `src/features/sessions/CompositionSequence.tsx` -- `RailLink.minLength` (surface propre, par défaut `entryY`) remplace l'écrasement à 0.
- `src/features/sessions/compositionGesture.ts` -- commentaire de `CompositionDragLayout` : citation exacte et source de la règle (ch13, CE-T03-08, « Réorganisation »).
- Tests : `__tests__/CompositionScreen.test.tsx`, `__tests__/compositionRail.test.ts`, `__tests__/useAnimatedShift.test.ts`, `__tests__/CompositionSequence.test.tsx`.
- `src/features/sessions/README.md` -- paragraphe story 5.2b.

## Tasks & Acceptance

**Execution :**
- [x] Soulèvement neutre pour la mise en page (marges verticales de `−heightDelta / 2`) ; rangée du point d'arrêt de la carte soulevée gardée à son écart + tests (styles).
- [x] Dialogue de perte : carte tenue à sa position de dépôt, hors de la chaîne, au premier plan + test.
- [x] Retour animé par le registre (refus, interruption, « Annuler ») synchronisé avec les voisines, au premier plan jusqu'à la fin + tests image par image.
- [x] `RailLink` : jamais sous la surface propre + tests.
- [x] Nouveau geste pendant un retour (`reset()` avant le relevé) ; placement pendant un retour ou le dialogue (fin immédiate) + tests.
- [x] Source de la règle « éléments inchangés au soulèvement » vérifiée ; citée par sa section partout.
- [x] Tests purs : aperçu et retour (t = 1, ½, 0), A en dernier, C (dernière) en premier, voisine à rangée de point, hauteur d'insertion ≠ hauteur retirée, dernière avant le Circuit → Circuit, dernière du Circuit → après ; géométrie `railGeometryFor`.
- [x] Test d'écran : déplacements successifs dans le Circuit sans quitter l'écran.
- [x] README de `src/features/sessions/`.

**Acceptance Criteria :**
- Given la suite ciblée, when `npx jest src/features/sessions src/domain/sessions --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then vert.
- Given un iPhone, when on réordonne plusieurs cartes successivement (dans et hors du Circuit, avec et sans point d'arrêt), puis qu'on refuse, interrompt ou annule un déplacement, then le rail reste continu et ne traverse aucun média (vérification Hermann).

## Implementation Notes

Causes prouvées par le code et par simulation des fonctions pures sur un modèle de la mise en page (scénarios Circuit [A, B, C] : A en dernier, puis C en premier ; carte avec rangée de point d'arrêt ; retours).

- **Cause A — la carte soulevée grandissait de 4 dans la mise en page.** `blockHeightFor(isDragged)` donne 84 au `Pressable` de la carte, sans marge compensatrice : son conteneur passait de 80 (+ rangée) à 84 (+ rangée) et tout ce qui le suit descendait de 4. Or `originLayout` est relevé au soulèvement (cartes à 80), et `resolveDragShifts` (`removal`), `resolveRailLinks` (`skipped.height`) et `CircuitSurface` (`circuitHeight`) comptent cette hauteur de repos : trou de 4 sur le lien qui enjambe la carte glissée, pendant tout le geste. La spécification l'excluait déjà : ch13, contrat CE-T03-08, section « Composer une séance / Modifier une séance — Réorganisation » (état soulevé) : « Les autres cartes et éléments structurels restent inchangés. » **Correctif :** `marginVertical: −dimensions.compositionActivityRow.heightDelta / 2` sur `activityBlockDragged` — la carte reste à 84, centrée sur sa place (le jeton documente déjà ce partage symétrique), son conteneur garde la hauteur mesurée au repos. Revue : la carte débordant de 2 en bas, la rangée de son point d'arrêt est translatée de `heightDelta / 2` tant qu'elle est soulevée (écart 8 / 9 conservé, marges intactes).
- **Cause B — la carte relâchée n'était pas à la place que le rail lui supposait.** Au refus, à l'interruption ou au dialogue de perte, `handleDragStart(null)` remettait aussitôt la carte à translation 0 alors que ses voisines restaient décalées (aperçu, puis retour de 180 ms). 1re version (`returning`) : carte exclue de la chaîne alors qu'elle était visible à sa place → le lien de son successeur, peint après elle, traversait son bloc et son média. 2e version (première correction 5.2b) : carte remise dans la chaîne à translation 0 → chevauchements avec les voisines encore décalées, rail coupé (8 à 9 points sur S, environ 29 sur l'en-tête du Circuit, point orphelin sous S, lien qui traverse le média de A depuis l'après / l'après-Circuit — revue).
- **Correctif retenu (revue 5.2b, conception du coordinateur, une adaptation motivée ci-dessous).**
  - *Dialogue de perte* : la carte ne revient plus ; elle reste à sa position de dépôt (la translation du doigt, passée au registre par `release`, cible `preview.heldTranslationY`), **à l'aspect de repos** (choix le plus simple : l'état soulevé est lié au geste, `isDragged`), hors de la chaîne comme pendant le geste : l'aperçu est le même, l'emplacement comblé par la carte, sans chevauchement.
  - *Retour animé* (refus, interruption avec la position atteinte, « Annuler ») : la translation de la carte revient à 0 par le même registre (180 ms, `Easing.out(cubic)`, pilote natif, immédiat sous « Réduire les animations »), synchronisée avec ses voisines ; `railShiftOf(A)` est cette translation. La carte, sa zone (et le Circuit) restent au premier plan (`dragElevated`, `zIndex` de la rangée, fond transparent) jusqu'à la fin du retour (`settling`, levé par `whenSettled`, ramené dans le registre pour ce seul usage).
  - *Adaptation — A hors de la chaîne pendant son retour, avec le rail de sa propre surface.* La conception demandait A dans la chaîne pendant le retour. Le test pur le réfute : A au premier plan, son lien vers son prédécesseur s'étire à travers les cartes passées entre eux et, peint au-dessus d'elles, traverse leurs médias (mutation vérifiée : « rail:row:A traverse le média de B et de C » quand A est relâchée en dernier ; « le bas du Circuit traverse les médias de A et B » quand C part en premier). Retenu : A reste hors de la chaîne jusqu'à la fin de son retour — ses voisines restent reliées entre elles à travers sa place (chaîne continue, prouvée à t = 1, ½, 0) —, et A porte le rail de sa propre surface (haut de la carte → haut du média ; bas du média → bas du bloc, point d'arrêt compris), sur sa carte au premier plan qui recouvre le lien qu'elle croise. Ni trou ni média traversé, à toute fraction (tests purs et d'écran). À la fin du retour, A reprend son lien et sa queue : géométrie identique, aucun saut. Ce n'est pas l'ancien `returning` : la carte suit sa translation animée et reste au premier plan, ce qui supprime le croisement que `returning` produisait.
  - *`RailLink`* : une rétraction ne descend jamais sous la surface propre de l'élément (`minLength` : `entryY` pour une carte — haut de la carte → haut du média —, l'en-tête du Circuit — marge + décalage de l'anneau — et la Fin ; marge basse 14 pour le bas du Circuit ; 0 pour la rangée après le Circuit) ; remplace l'écrasement à 0. Ce morceau, sur l'élément même, ne traverse aucun autre média.
  - *Nouveau geste pendant un retour* : `AnimatedShiftRegistry.reset()` arrête le retour et pose toutes les valeurs à 0 de façon synchrone avant `buildDragLayout` : `originLayout` correspond à l'écran.
  - *Placement pendant un retour ou le dialogue* : `endDragSession(current, false)` — fin immédiate, valeurs posées à 0 sans animation.
- **Écartés :** clés React (rangées et registre par identifiant), remise à 0 au dépôt appliqué (`setValue` dans un effet de mise en page), longueurs au repos (écarts de conception ; queues jusqu'au bas mesuré du conteneur).
- **Commentaire `compositionGesture.ts`.** La phrase attribuée à CE-T02-02 (« ne changent ni de taille ni de position au déclenchement ») n'existe nulle part dans `docs/` ; remplacée par la citation exacte de la section « Réorganisation » (ch13, CE-T03-08).
- **Tests.** Écran (`expectRailJoined`, jonction VISIBLE : haut du lien = bas visible du prédécesseur, ou bord haut de l'élément quand le prédécesseur le chevauche, ou point recouvert par la carte au premier plan ; jamais sous la surface propre ; aucun média d'une carte peinte dessous traversé ; géométrie injectée cohérente avec les constantes) : dialogue (A tenue à sa position de dépôt) puis « Annuler », pour la dernière carte avant le Circuit relâchée dans le Circuit ; refus image par image ; dernière carte du Circuit vers l'après interrompue, voisine à rangée de point d'arrêt (geste interrompu : même chemin de retour que le refus, `endDragSession(…, true, release)` ; aucun refus construit pour ce trajet) ; rangée de point sous la carte soulevée ; nouveau geste pendant un retour ; placement pendant un retour ; déplacements successifs dans le Circuit. Mutation vérifiée : remettre A dans la chaîne pendant le retour fait échouer les trois tests de retour. Purs : `compositionRail.test.ts` (aperçu et retour à t = 1, ½, 0 depuis l'emplacement ouvert et à ±25 ; A en dernier, C — la dernière — en premier, voisine à rangée de point, hauteur d'insertion ≠ hauteur retirée, dernière avant le Circuit → Circuit, dernière du Circuit → après ; `railGeometryFor` exporté au lieu d'une copie de la géométrie) ; `useAnimatedShift.test.ts` (`release`, `reset`, `whenSettled`) ; `CompositionSequence.test.tsx` (surface propre). Le test du soulèvement neutre prouve les styles (hauteur et marges) ; la mise en page elle-même se vérifie sur iPhone.
- **Story 6.2 (rangées de Points d'arrêt autonomes, glissables).** Le correctif se généralise : un élément qui n'est pas à sa place (soulevé, tenu, en retour) sort de la chaîne, reste au premier plan et porte le rail de sa surface ; son soulèvement doit être neutre pour la mise en page ; les rangées deviendront des nœuds de chaîne (clé de registre propre, lien + queue + point, `minLength`) et des lignes de `originLayout`.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | revue 5.2b | La carte relâchée revient à 0 d'un coup pendant que ses voisines restent décalées (dialogue, retour) : chevauchements, rail coupé (8–9 points sur S, ~29 sur l'en-tête), point orphelin, lien qui traverse le média de A | high | patch : tenue à sa position de dépôt pendant le dialogue ; retour animé par le registre, synchronisé, au premier plan jusqu'à la fin ; A hors chaîne avec le rail de sa surface (adaptation motivée : dans la chaîne, son lien traverse des médias — mutation) ; tests. |
| 2 | revue 5.2b | `RailLink` écrasé à 0 : jonction perdue quand un voisin chevauche | medium | patch : `minLength` (surface propre) ; tests. |
| 3 | revue 5.2b | Nouveau geste pendant un retour : `originLayout` ne correspond pas à l'écran | medium | patch : `reset()` synchrone avant le relevé ; test. |
| 4 | revue 5.2b | Placement pendant un retour ou le dialogue | medium | patch : fin immédiate, sans animation ; test. |
| 5 | revue 5.2b | Carte soulevée à rangée de point : la carte déborde de 2, l'écart de la rangée tombe à 6 / 7 | low | patch : rangée translatée de `heightDelta / 2` (marges intactes) ; test. |
| 6 | revue 5.2b | Test d'écran trop faible (longueur seule) ; tests purs incomplets ; géométrie recopiée | medium | patch : `expectRailJoined` (jonction visible, surface propre, médias) ; scénarios demandés ; tests purs (retour, dernière → première, voisine à rangée, insertion ≠ retrait) sur `railGeometryFor` ; test du soulèvement renommé (styles). |
| 7 | revue 5.2b | Source citée par numéro de ligne | low | patch : section « Réorganisation » (ch13, CE-T03-08) dans le commentaire, le style et le README. |

## Verification

- `npx jest src/features/sessions src/domain/sessions --maxWorkers=2` : 53 suites, 1627 tests, verts.
- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : sans avertissement.
- **iPhone (Hermann, non prouvable en Jest) :** carte tenue à sa position de dépôt pendant le dialogue ; retour synchronisé avec les voisines, carte au premier plan, rail continu pendant les 180 ms ; absence de saut au passage de la translation du doigt à celle du registre (`setValue` dans la file NativeAnimated, même commit que la remise à 0 de la translation locale) et au dépôt appliqué ; carte soulevée centrée sur sa place (ombre, bord) sans mouvement des voisines, rangée du point à son écart ; jointures de `scaleY` sur le trait de 1,5 ; défilement pendant le geste ; Dynamic Type sur l'en-tête du Circuit.
