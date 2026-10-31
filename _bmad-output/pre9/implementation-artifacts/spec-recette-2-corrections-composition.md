# Recette iPhone n° 2 — corrections : suggestions de nom, Circuit replié, durée des en-têtes (31/10/2026)

Constats de Hermann du 31/10/2026 (iPhone), recopiés. Décisions recopiées au registre : ch07 « Recette iPhone n° 2 du 31/10/2026 — suggestions de nom, Circuit replié, durée des en-têtes ». Les autres corrections de la même recette (fiche Mouvement, Feuille des paramètres, « Paramètre à vérifier ») sont suivies dans `spec-recette-2-corrections.md`.

Branche `pre9-bmad/dev`, départ `70dae5f4`. Aucun commit.

## a) Suggestions de nom après Entrée — classe A

> « Créer un nouveau mouvement > entrer Squat : les noms similaires apparaissent > appuyer sur entrée : la liste de recherche disparaît > effacer des lettres et réécrire Squat : la liste de recherche n'affiche rien »

- **Cause.** `useMovementOriginChoice` mémorisait la fermeture du panneau par la fin de saisie (`onEndEditing`, Entrée) sous la forme du texte fermé (`dismissedFor = "Squat"`) et masquait le panneau tant que le nom valait ce texte. Effacer des lettres le rouvrait (« Squa » ≠ « Squat ») ; revenir à « Squat » le refermait, la fermeture n'ayant jamais été oubliée. Même défaut pour l'étape « Niveau » (`variantStep.name`) : ouverte sur un nom, elle reparaissait quand ce nom était retapé.
- **Correction.** Toute modification du nom oublie la fermeture et l'étape « Niveau » (ajustement d'état pendant le rendu). Une nouvelle fin de saisie referme le panneau, comme avant ; un nom déjà utilisé le garde ouvert, comme avant.
- **Règle appliquée.** R03 (`docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md`) : « La saisie du nom déclenche la recherche. Ce n'est pas une faculté : au dessus du seuil haut, la suggestion est présentée. » ; étape « Niveau » : « toute frappe revient à la liste » (PRE-7 R-8, cr-8). Aucune modification de spécification.
- **Hypothèse non démontrée.** Le constat e de la recette n° 1 (« Squat », non reproduit, `spec-recette-1-corrections.md`, question ouverte 2) pourrait avoir cette cause.
- Les deux parcours qui utilisent le crochet sont corrigés : fiche Mouvement (Catalogue) et « Créer un nouveau mouvement » depuis la Composition / un Exercice (`ExerciseScreen`).

## b) Arrêt d'une carte sur un Circuit replié — classe B

> « L'arrêt d'une carte sur un circuit replié doit l'ouvrir »

- **Réalisation (structure générale D-451).** Pendant le glisser d'une carte d'Exercice, une destination qui reste un Circuit replié (au niveau Séance ou dans un Cycle) pendant `LAYOUT_COLLAPSED_HOVER_DELAY_MS` déploie ce Circuit, par le même déploiement animé que le chevron (`useCircuitCardsReveal`, 700 ms). Un Circuit replié n'offre que sa fin comme destination (`layoutDropCandidates`) : la destination est ce Circuit exactement quand la carte est arrêtée sur lui. Pendant le déploiement, la destination sous le doigt immobile est recalculée à chaque mesure : les cartes du Circuit s'écartent pour faire la place (aperçu de la recette n° 2, `layoutDragShifts`). Si le Circuit déployé est au-dessus de la carte saisie, la mise en page la fait descendre : la translation du registre qui la porte compense ce déplacement (`layoutSourceDrift`), et le lâcher (dépose, retour, dialogue) part de la position affichée.
- **Rendu choisi (Figma muet).** Délai d'arrêt 500 ms (`LAYOUT_COLLAPSED_HOVER_DELAY_MS`, `layoutDrop.ts`), aligné sur le délai de l'appui long (`LONG_PRESS_DELAY_MS`). À juger sur iPhone.
- **Comportements conservés.** Passage sans arrêt (la destination change avant le délai) : rien ne se déploie. Lâcher avant le délai : dépose en fin du Circuit replié, comme avant (puis déplié par le changement de contenu, ARB-12). Le minuteur est annulé au lâcher, à l'interruption et au démontage.
- **Analogie citée.** Familles de mouvements : « Une famille repliée se déplie avant de choisir la position ou à l'approche d'un mouvement entrant [à l'arrêt de la carte portée sur la famille, recette du 28/10/2026] » (ch10 l.416, ch13 l.51).
- **Ancien modèle (Circuit unique).** Non concerné : un appui long sur une carte pendant que le Circuit unique est replié le déplie et refuse le soulèvement (PRE-9 B.1a) ; aucune carte ne peut donc s'arrêter sur lui.

## c) Appui long sur la durée d'un Circuit ou d'un Cycle — classe B

> « Appui long sur la zone de la durée d'un circuit ou d'un cycle doit permettre de le déplacer »

- **Réalisation.** La durée de l'en-tête (`CircuitHeader`, `CycleHeader`) porte le même appui long que le titre (`durationGrabProps`) : Circuit déployé replié d'abord puis déplacé (COMP §6) ; Cycle entier (ARB-09). Primitive native : appui long du `Text` (délai système 500 ms = `LONG_PRESS_DELAY_MS`), sans surbrillance. Zone de toucher étendue au-dessus et au-dessous de la ligne comme la cible du titre (44 de haut), marges négatives : mise en page inchangée.
- **Appui court.** La durée n'avait aucune action au toucher ; elle n'en a toujours aucune.
- **VoiceOver.** Inchangé : la durée reste hors de l'accessibilité (lue avec le nom) ; « Monter » / « Descendre » restent sur le titre.
- **Ancien modèle (Circuit unique).** Aucun appui long sur son en-tête (pas de glisser de conteneur) : durée inchangée.

## Fichiers

- `src/features/activities/useMovementOriginChoice.tsx` (a).
- `src/features/sessions/layoutDrop.ts` (`LAYOUT_COLLAPSED_HOVER_DELAY_MS`, `hoveredCollapsedCircuit`), `src/features/sessions/CompositionScreen.tsx` (minuteur d'arrêt, `retargetLayoutDrag`, compensation `layoutSourceDrift`, lâcher depuis la position affichée) (b).
- `src/features/sessions/CircuitHeader.tsx` (`durationGrabProps`), `src/features/sessions/CycleHeader.tsx` (c).
- Tests : `src/features/activities/__tests__/MovementScreen.recette2.integration.test.tsx` (a, base SQLite réelle ; échoue sans la correction), `src/features/sessions/__tests__/CompositionScreen.recette2composition.test.tsx` (b et c), `src/features/sessions/__tests__/layoutDrop.recette2.test.ts` (`hoveredCollapsedCircuit`).

## Vérifications

- `npx jest` ciblé (`--maxWorkers=1`) : nouveaux tests 2 + 8 + 2 verts ; non-régression verte : `CompositionScreen.b1b`, `b2`, `b4`, `b4b`, `b6`, `recette1`, `recette2`, `recette2lot3`, `CircuitHeader`, `layoutDrop.b4`, `layoutDrop.recette2`, `layoutDragShifts.recette2`, `MovementSuggestionPanel.r5`, `MovementSearchScreen.r8`, `ExerciseScreen.r5` / `r8` (intégration), `legacyModeConfinement`.
- `npx tsc --noEmit`, `eslint` des fichiers touchés : sans erreur.
- Jest ne prouve ni le rendu, ni le geste, ni le délai ressenti sur iPhone (déploiement pendant le glisser, carte qui reste sous le doigt, zone d'appui long de la durée).

## À CLARIFIER (lectures prudentes en place)

1. **Délai d'arrêt** : 500 ms choisi (Figma muet). À confirmer en recette.
2. **Point d'arrêt saisi** : le constat dit « carte » ; un Point d'arrêt glissé sur un Circuit replié ne le déploie pas (il peut toujours être déposé à sa fin). Faut-il l'étendre aux Points ?
3. **Circuit déployé par l'arrêt puis quitté sans dépose** : il reste déployé (comme déplié au chevron). Faut-il le replier quand la carte s'en va ou quand le geste se termine ailleurs ?

## Synchronisation code / documentation

- **Classe A** (a) : R03, PRE-7 R-8 cr-8 ; aucun document modifié.
- **Classe B** (b, c) : registre ch07 (nouvelle section, textes recopiés) ; annotation datée de `docs/KODJO-Composition-conteneurs-2026-10-28.md` §6 (COMP §6, G1–G8). Recherche des formulations contraires : ch13 ne spécifie pas le geste de saisie d'un conteneur ; « Un appui long sur l'en-tête d'un circuit déployé commence par le replier » (COMP §6, source G4) reste vrai, complété ; aucune formulation ne réserve l'appui long au seul titre ni n'interdit le déploiement pendant un glisser.
- **Classe D** : compensation du déplacement de la carte saisie (registre animé), recalcul de la destination pendant le déploiement, zone d'appui étendue.
