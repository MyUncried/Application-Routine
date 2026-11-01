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

- **Réalisation (structure générale D-451).** Pendant le glisser d'une carte d'Exercice, une destination qui reste un Circuit replié (au niveau Séance ou dans un Cycle) pendant `LAYOUT_COLLAPSED_HOVER_DELAY_MS` déploie ce Circuit, par le même déploiement animé que le chevron (`useCircuitCardsReveal`, 700 ms). Un Circuit replié n'offre que sa fin comme destination (`layoutDropCandidates`) : la destination est ce Circuit exactement quand la carte est arrêtée sur lui. Pendant le déploiement, la destination sous le doigt immobile est recalculée à chaque mesure : les cartes du Circuit s'écartent pour faire la place (aperçu de la recette n° 2, `layoutDragShifts`). [Remplacé le 31/10/2026 par la contre-recette n° 3 (cr4-replie, déploiement saccadé) : pendant le déploiement, la destination reste la fin du Circuit ; la destination sous le doigt est recalculée une fois le déploiement terminé — voir « Contre-recette n° 3 ».] Si le Circuit déployé est au-dessus de la carte saisie, la mise en page la fait descendre : la translation du registre qui la porte compense ce déplacement (`layoutSourceDrift`), et le lâcher (dépose, retour, dialogue) part de la position affichée.
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

## Contre-recette n° 3 du 31/10/2026 (iPhone)

Résultats de Hermann recopiés. Départ `4dd8c04a`, aucun commit. Registre : ch07, section « Recette iPhone n° 2 du 31/10/2026 — suggestions de nom, Circuit replié, durée des en-têtes » (deux entrées « Contre-recette n° 3 ») ; annotations datées de l'entrée « Arrêt d'une carte sur un Circuit replié » et de l'entrée b6-deplacer du lot 3.

### cr4-replie — KO (classe A)

> « Comportement globalement correct mais : - le circuit déplie, ses cartes descendent mais avec un mouvement saccadé. Les cartes glissent ensuite normalement. - Si je repose la carte à son emplacement initial elle disparaît et l'emplacement reste vide. Un appui long sur une autre carte par exemple la fait réapparaître. Ce problème n'est pas systématique. »

**a) Déploiement saccadé — cause.** Le déploiement (`useCircuitCardsReveal`, 700 ms, fil UI) fait grandir le Circuit image par image ; chaque image renvoie des mesures au fil JS (`onLayout` → `reportLayoutBox`). À chaque mesure, l'écran recalculait la destination sous le doigt immobile (`retargetLayoutDrag`) puis l'aperçu (`refreshLayoutShifts`). Or la destination d'origine (fin du Circuit replié) portait un seuil d'insertion lu dans la géométrie repliée (`insertY` = bas du Circuit replié) : les cartes qui apparaissaient sous ce seuil recevaient la translation d'insertion (+ hauteur de la carte saisie), puis la destination changeait au fil des mesures intermédiaires (tête, entre deux cartes…) ; chaque changement relançait les animations du registre (320 ms) depuis une position estimée. Les cartes du Circuit « descendaient » donc par à-coups, mesures en retard sur le fil UI, avant que l'aperçu ne se stabilise ; ensuite (mesures stables), les décalages redevenaient fluides — exactement le constat.

**a) Correction.** Pendant le déploiement (`expandingCircuitId`, `CIRCUIT_REVEAL_DURATION_MS` après l'ouverture ; 0 avec « Réduire les animations »), la destination reste la FIN du Circuit qui s'ouvre, relue à chaque mesure dans les boîtes courantes (`circuitEndDrop`, `layoutDrop.ts`) : la place ouverte suit le bas du Circuit (mise en page, fil UI), ses cartes apparaissent à leur place sans translation, ce qui suit garde une translation constante — l'aperçu ne change plus pendant le déploiement (aucun état ni aucune animation relancés). Déploiement terminé : destination sous le doigt et décalages animés une seule fois (registre, 320 ms). Un lâcher pendant le déploiement dépose à la fin du Circuit, place montrée par l'aperçu. Règle appliquée : « la place qui s'ouvre montre la destination » (recette n° 2, aperçu par décalages) ; mouvements progressifs (obs-3 b, 29/10 et 30/10).

**b) Carte reposée à sa place qui disparaît — cause probable (non reproductible sous Jest).** Au lâcher, le rendu qui retire l'état soulevé change la TAILLE de la carte (`activityBlockDragged`, marges négatives) et porte encore la valeur JS de `dragY` (translation du doigt) : `dragY` n'était remis à 0 qu'après ce rendu (effet de mise en page de `CompositionActivityRow`). Sous Fabric iOS, une vue dont la translation est gérée par le pilote natif et dont la taille change recalcule sa translation à partir des propriétés gardées (mécanisme établi en story 7.5, `resyncNative`) ; selon l'ordre, non garanti, entre ce montage et la pose native de 0, la carte restait décalée de la translation du doigt. Cas observé : un Circuit déployé AU-DESSUS de la carte pendant le geste la fait descendre dans la mise en page (compensation `layoutSourceDrift`) ; pour la reposer à sa place, le doigt descend d'autant (translation de 100 à 150 points) : la carte restait décalée de cette valeur, puis passait sous l'élément suivant à la fin du retour (premier plan retiré) — « elle disparaît et l'emplacement reste vide ». Intermittent (course entre deux files natives). Explication de la réapparition non démontrée (une pose native ultérieure de la vue, par un nouveau geste).
- Vérifications du chemin JS, sans défaut trouvé : la dépose à la même place rend `UNCHANGED` → retour (`release`) depuis la position affichée, compensation comprise ; registre ramené à 0, `whenSettled` libère la carte (tests Jest du cas simple et du cas « Circuit déployé au-dessus »).

**b) Correction.** Le relâcher (fin du toucher, interruption) pose `dragY` à 0 AVANT les écritures d'état (`releaseDragY`) : le rendu du lâcher porte 0 et le pilote natif reçoit 0 dans la même tâche que la pose de départ du retour (registre) ; une tâche après le rendu qui retire l'état soulevé, la pose native est renvoyée (comme `resyncNative`). Aucune règle concernée (classe D pour le mécanisme ; constat de classe A : la carte doit revenir à sa place, story 5.2b).

### b6-deplacer — KO (classe A)

> « Exercice dans un cycle / un circuit avec un point d'arrêt en début de cycle / circuit : le déplacement de l'exercice avant le point d'arrêt est interdit. Par contre, le déplacement du point d'arrêt après l'exercice à la fin du cycle / circuit est autorisée. La situation à la fin est pourtant la même mais la solution autorise l'un mais pas l'autre. »

**Recherche.** Le Domaine juge bien la structure obtenue : matrice Circuit / Cycle × N = 1, 2 × un ou deux membres × conteneur en tête, au milieu, en fin de Séance — dépose de l'Exercice devant le Point, « Monter » et déplacement du Point vers la fin donnent la même structure et le même verdict (seule la sanction d'un Point devenu interdit diffère : refus strict du Point, retrait tolérant pour l'Exercice, D-441 / D-442). Les écarts sont dans les emplacements offerts :
1. **Glisser, seul Exercice d'un Circuit (`[P, E]`).** `layoutDropCandidates` n'offrait, pour un Circuit dont toutes les cartes restantes manquent — cas du Circuit replié, mais aussi du Circuit dont la source est le seul membre —, que sa FIN au milieu de sa boîte, sans les emplacements « avant le Point » / « après le Point » (lot 3). Doigt au-dessus du Point : la destination la plus proche était au niveau Séance — l'Exercice sortait du Circuit, qui était retiré avec son Point. Le Cycle (`sequence` avec en-tête) n'avait pas ce défaut (cr3-cycle-point OK).
2. **« Monter », membre qui n'est pas le premier (`[P, A, B]`, B).** `stepLayoutItem` parcourait un seul emplacement par rang (avant les Points) : B passait devant A ET devant P en un pas (`[B, P, A]`), au lieu d'échanger avec son voisin A (`[P, B, A]`), puis de franchir P au pas suivant.

**Corrections.**
- `layoutDrop.ts` : seul membre d'un Circuit déployé qui porte des Points (en-tête et carte mesurés) : mêmes emplacements que dans un Cycle — tête du Circuit (avant le Point) et sa propre place (après le Point). Sans Point, ou Circuit replié : fin seulement (inchangé).
- `layoutMoves.ts` (`stepLayoutItem`) : un rang qui porte des Points offre deux emplacements au pas à pas, avant eux et après eux (`afterStopPoints`), dans l'ordre d'affichage ; « Descendre » est symétrique.
- Règles appliquées, inchangées : RM-219, RM-251, D-441, D-442, ARB-02 (choix « Début / Fin de tour » commun : `choiceFor`), ARB-06 ; « Monter » / « Descendre » : un pas vers l'élément voisin de la séquence, Point ou Exercice (CE-T03-08, PRE-6 story 6.1) ; le Point voisin est franchi d'abord (spec B.6, À CLARIFIER 4 confirmé par Hermann le 31/10). Point inclus dans un périmètre d'enveloppe : « il entre dans le conteneur » (31/10) — non concerné ici.

### Fichiers

- `src/features/sessions/CompositionScreen.tsx` : `expandingCircuitId`, fin de déploiement (`finishLayoutExpansionRef`, minuterie `CIRCUIT_REVEAL_DURATION_MS`), `retargetLayoutDrag` ; `releaseDragY` et renvoi de la pose native (`CompositionActivityRow`).
- `src/features/sessions/layoutDrop.ts` : `circuitEndDrop` ; emplacements du seul membre d'un Circuit à Points.
- `src/domain/sessions/layoutMoves.ts` : `stepLayoutItem` (emplacements avant / après les Points), `hasStopPointsAt`.
- Test existant mis à jour : `layoutStopPoints.b6.test.ts` — [B.6 : « Sans Point voisin […] inséré avant le Point qui occupe ce rang : [e0, e2, P, e1] » — remplacé :] e2 échange avec e1, `[e0, P, e2, e1]` (annotation datée dans le test).
- Tests : `CompositionScreen.recette2composition.test.tsx` (cr4-replie a et b : 4 ; b6-deplacer : 28 — glisser, « Monter », reposé à sa place, Circuit et Cycle, × 1 et × 2, un et deux membres ; 2 tests existants adaptés : destination sous le doigt après la fin du déploiement), `layoutDrop.recette2.test.ts` (4), `layoutMoves.recette2.test.ts` (matrice de 24 cas + pas à pas).
- Preuves d'échec avant correction : b) rendu du lâcher portant la translation du doigt (15 / 100) au lieu de 0 ; b6 glisser `[P, a1]` → `e0 a1 cb[b1] e9` (Circuit et Point retirés) ; b6 « Monter » a2 de `[P, a1, a2]` → `[a2, P, a1]`.

### Vérifications

- `npx jest` ciblé (`--maxWorkers=1`) : `CompositionScreen.*` (13 suites), `layoutDrop.*`, `layoutDragShifts.recette2`, `useAnimatedShift`, `compositionGesture`, `layout*` du Domaine, `composition.test` — 29 suites, 929 tests ; 2 échecs au premier passage : `layoutStopPoints.b6` (attente B.6 « [e0, e2, P, e1] » du pas à pas, remplacée — voir ci-dessous) et `CompositionScreen.recette1` (« disposition générale (deux Circuits) : même comportement », vert repassé seul, 9/9 : instabilité sous charge, fichiers d'un autre lot modifiés en parallèle) ; après mise à jour, `layoutStopPoints.b6`, `CompositionScreen.b4`, `CompositionScreen.b6` : 39/39.
- `npx tsc --noEmit`, `eslint` des fichiers touchés : sans erreur. Garde `legacyModeConfinement` (motif `target`) : aucune occurrence ajoutée.

### À vérifier sur iPhone (Jest ne le prouve pas)

1. Déploiement par l'arrêt : mouvement continu des cartes et du fond du Circuit, puis ouverture douce de la place sous le doigt. Risque résiduel : quand le Circuit déployé est AU-DESSUS de la carte saisie, la compensation (`layoutSourceDrift`) est posée à chaque mesure, depuis le fil JS : la carte peut trembler légèrement sous le doigt pendant les 700 ms ; de même, le fond en trois couches (`CircuitSurface`) est mis à l'échelle d'après une hauteur relevée au fil JS (léger décalage possible à la jointure basse pendant le déploiement).
2. Carte reposée à sa place, avec et sans Circuit déployé pendant le geste, plusieurs fois (défaut intermittent) : elle reste visible et revient à sa place. Si le défaut persiste, la cause est ailleurs (ordre natif à instrumenter sur l'appareil).
3. b6 : Circuit `[P, E]` — glisser E au-dessus du Point (E devant P, dans le Circuit) ; le reposer sous le Point (rien ne change) ; « Monter » E (VoiceOver). Conteneur `[P, E1, E2]` : « Monter » E2 échange avec E1, puis franchit P. Circuit × N ≥ 2 : même dialogue « Début / Fin de tour » que pour le Point quand un conflit est créé.

### Synchronisation code / documentation

- **Classe A** (cr4-replie a et b ; b6-deplacer) : règles citées ci-dessus, aucune règle nouvelle ; ch07 (deux entrées + deux annotations datées). Recherche des formulations contraires : ch07 « ses cartes deviennent des destinations et s'écartent pour faire la place » (annoté : une fois le déploiement terminé) ; section « Arrêt d'une carte » ci-dessus (b, « Pendant le déploiement, la destination sous le doigt immobile est recalculée à chaque mesure » — annoté ci-dessous) ; spec B.6 l. 67 (« franchit d'abord un Point voisin, puis passe d'emplacement d'élément en emplacement d'élément ») reste vraie, précisée par les emplacements avant / après les Points.
- **Classe D** : `releaseDragY` (ordre des poses natives), minuterie de fin de déploiement.
