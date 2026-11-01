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

**a) Correction.** Pendant le déploiement (`expandingCircuitId`, `CIRCUIT_REVEAL_DURATION_MS` après l'ouverture ; 0 avec « Réduire les animations »), la destination reste la FIN du Circuit qui s'ouvre, relue à chaque mesure dans les boîtes courantes (`circuitEndDrop`, `layoutDrop.ts`) : la place ouverte suit le bas du Circuit (mise en page, fil UI), ses cartes apparaissent à leur place sans translation, ce qui suit garde une translation constante — l'aperçu ne change plus pendant le déploiement (aucun état ni aucune animation relancés). Déploiement terminé : destination sous le doigt et décalages animés une seule fois (registre, 320 ms). Un lâcher pendant le déploiement dépose à la fin du Circuit, place montrée par l'aperçu. [01/11/2026, contre-recette n° 4 (cr5-replie) : remplacé en partie — la place n'est plus ouverte pendant l'arrêt ni pendant le déploiement (le cadre grandit avec ses cartes, puis la place s'ouvre) ; destination et dépose inchangées ; voir « Contre-recette n° 4 du 01/11/2026 ».] Règle appliquée : « la place qui s'ouvre montre la destination » (recette n° 2, aperçu par décalages) ; mouvements progressifs (obs-3 b, 29/10 et 30/10).

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

1. Déploiement par l'arrêt : mouvement continu des cartes et du fond du Circuit, puis ouverture douce de la place sous le doigt. Risque résiduel : quand le Circuit déployé est AU-DESSUS de la carte saisie, la compensation (`layoutSourceDrift`) est posée à chaque mesure, depuis le fil JS : la carte peut trembler légèrement sous le doigt pendant les 700 ms [01/11/2026, contre-recette n° 5 : constaté (« plusieurs soubresauts ») et corrigé — compensation lancée avec le déploiement, sur le pilote natif] ; de même, le fond en trois couches (`CircuitSurface`) est mis à l'échelle d'après une hauteur relevée au fil JS (léger décalage possible à la jointure basse pendant le déploiement).
2. Carte reposée à sa place, avec et sans Circuit déployé pendant le geste, plusieurs fois (défaut intermittent) : elle reste visible et revient à sa place. Si le défaut persiste, la cause est ailleurs (ordre natif à instrumenter sur l'appareil).
3. b6 : Circuit `[P, E]` — glisser E au-dessus du Point (E devant P, dans le Circuit) ; le reposer sous le Point (rien ne change) ; « Monter » E (VoiceOver). Conteneur `[P, E1, E2]` : « Monter » E2 échange avec E1, puis franchit P. Circuit × N ≥ 2 : même dialogue « Début / Fin de tour » que pour le Point quand un conflit est créé.

### Synchronisation code / documentation

- **Classe A** (cr4-replie a et b ; b6-deplacer) : règles citées ci-dessus, aucune règle nouvelle ; ch07 (deux entrées + deux annotations datées). Recherche des formulations contraires : ch07 « ses cartes deviennent des destinations et s'écartent pour faire la place » (annoté : une fois le déploiement terminé) ; section « Arrêt d'une carte » ci-dessus (b, « Pendant le déploiement, la destination sous le doigt immobile est recalculée à chaque mesure » — annoté ci-dessous) ; spec B.6 l. 67 (« franchit d'abord un Point voisin, puis passe d'emplacement d'élément en emplacement d'élément ») reste vraie, précisée par les emplacements avant / après les Points.
- **Classe D** : `releaseDragY` (ordre des poses natives), minuterie de fin de déploiement.

## Incident du 01/11/2026 (iPhone) — « Maximum update depth exceeded » au repli d'un Circuit

**Constat** (Hermann) : « J'ai ouvert une séance, replié une carte et ai eu cette erreur. » — écran rouge `Maximum update depth exceeded`, source `CompositionScreen.tsx` 8799:18, `onLayout` du bloc extérieur de `LayoutCycleBlock` (`setCycleY`). Geste confirmé : repli d'un Circuit par son chevron (hors glisser, feuille fermée), Circuit vraisemblablement dans un Cycle. Non systématique : les replis suivants n'ont rien produit.

**Cause** (mécanisme reproduit sous Jest, moteur Fabric non instrumenté sur l'appareil) : sous Fabric, l'événement `layout` est distribué en priorité discrète (indicateur natif `fixMappingOfEventPrioritiesBetweenFabricAndReact` à `false` : catégorie `Unspecified` → `Discrete`) ; l'état qu'il pose est rendu et validé sur la voie synchrone. Pendant le repli (900 ms) ou le déploiement (700 ms), l'animation des cartes et de la ligne des noms (`useCircuitCardsReveal`, `CollapsedNamesLine`, fil UI, Reanimated) avance entre deux validations React, et chaque validation reprend la hauteur animée la plus récente. Le Cycle range sa position et sa hauteur dans son état (`setCycleY`, `setCycleHeight`) : chaque mesure rend tout le Cycle (tous ses membres). Quand ce rendu dure plus d'une image, chaque validation porte une nouvelle hauteur, donc un nouvel événement `layout`, donc une nouvelle mise à jour synchrone imbriquée ; au-delà de 50, React lève l'erreur (50 × ~17 ms ≈ la durée du repli). D'où le caractère intermittent : il dépend de la durée du rendu (taille de la séance, charge, ramasse-miettes, mode développement). Aucune des mesures en cause n'agit sur la mise en page du Cycle (rail et fond positionnés en absolu) : il n'y a pas d'oscillation, mais une suite de mesures nouvelles tant que l'animation dure. Les lots 4dd8c04a / 0196c566 (marges négatives de la durée, surface orange, déploiement par l'arrêt) n'introduisent pas cette boucle ; ils peuvent seulement alourdir le rendu. Hypothèses écartées : oscillation de la ligne d'en-tête (marges négatives compensées par un remplissage égal : hauteur de ligne inchangée, `rowHeight` ne modifie que des éléments absolus), `natureAnchor` (mis à jour dans un effet, voie par défaut, panneau absolu).

**Correction — classe D** (aucun comportement visible modifié) : mesures des blocs de la disposition générale (`LayoutCycleBlock`, `LayoutCircuitBlock`, `LayoutCircuitCard`, `useReportedBox`) :
- position et hauteur d'un bloc en un seul état (`useMeasuredFrame`), valeurs isolées par `useMeasuredValue` (`rowHeight`, `headerBottom`, `listY`, `motionY`) ;
- mesure ignorée si elle ne change pas d'au moins `LAYOUT_MEASURE_TOLERANCE` (0,5 pt) ;
- au repos (aucun élément saisi, tenu ou en retour, `lift === null`), mesure appliquée en transition (`startTransition`) : hors de la voie synchrone, elle ne s'imbrique plus et ne retient pas l'animation ; ces mesures ne servent au repos qu'à la géométrie du prochain glisser (boîtes, rail) ; pendant le glisser, appliquée aussitôt comme avant.

**Tests** : `CompositionScreen.incident0111.test.tsx` (2) — un `Profiler` transmet à chaque validation une nouvelle mesure du Cycle, du Circuit et de l'Exercice suivant pendant le repli (image d'animation simulée) : avant correction, l'erreur est levée à la même ligne (8799:18, `setCycleY`) ; après, 120 mesures sans erreur. Une mesure qui oscille d'un quart de point n'entraîne aucune chaîne de rendus.

**Risque résiduel** : pendant un glisser, les mesures restent synchrones (aperçu sous le doigt) ; un Circuit qui se déploie par l'arrêt (700 ms) ou se replie à la saisie (900 ms) produit la même suite de mesures, chacune rendant l'écran (`reportLayoutBox` → `refreshLayoutShifts` → `setLayoutLift`). Non observé ; à surveiller sur iPhone.

**À vérifier sur iPhone** : replier et déployer plusieurs fois un Circuit dans un Cycle (séance chargée, cartes « à vérifier ») ; puis saisir aussitôt une carte ou un Circuit : la destination et le rail sont justes.

**Synchronisation code / documentation** : classe D ; documents fonctionnels : aucun.

## Contre-recette n° 4 du 01/11/2026 (iPhone)

Résultats de Hermann recopiés (testés sur `0196c566`, avant `8e45fcd8`). Départ `8e45fcd8`, aucun commit. Registre : ch07, section « Recette iPhone n° 2 du 31/10/2026 — suggestions de nom, Circuit replié, durée des en-têtes » (quatre entrées « Contre-recette n° 4 », annotations datées de « Arrêt d'une carte sur un Circuit replié » et de « Contre-recette n° 3 — cr4-replie ») et section « … — lot 3 (Composition) » (b4b-etendre). Item 5 (b4b-etendre, bord du cadre qui suit le trait) : `spec-b-4b-enveloppe-multiple-perimetre.md`, « Contre-recette n° 4 du 01/11/2026 ».

### 1. cr5-replie — KO (classe A ; À CLARIFIER 1)

> « 1. le cadre du circuit se déplie jusqu'à la hauteur qu'il aurait avec les cartes qui le constitue, mais sans qu'elles n'apparaissent. 2. le cadre du circuit a des soubresauts : le bord bas remonte et redescend un peu, remonte un peu et redescend. 3. Les cartes du circuit existantes apparaissent dans le circuit en descendant, puis le cadre continue de descendre jusqu'à laisser un emplacement vide pour la carte à déposer. 4. La carte s'insère naturellement à son emplacement »

**Causes** (la première prouvée sous Jest, les autres établies par lecture du code) :
1. **Place ouverte sans cartes** : dès l'arrêt sur le Circuit replié (avant le délai de 500 ms), puis pendant son déploiement (contre-recette n° 3), la destination « fin du Circuit » ouvrait sa place : le bord bas du Circuit (`motion.bottom`, registre) descendait de la hauteur de la carte saisie plus l'écart (89 dans le test) sans aucune carte — « le cadre se déplie […] sans qu'elles n'apparaissent ». Test : avant correction, bord bas à 89 pendant l'arrêt (attendu 0).
2. **Soubresauts du bord bas** : pendant le glisser, le fond du Circuit est en trois couches (`CircuitSurface`) ; la bande est étirée de `bottom − top` rapporté à la hauteur du Circuit relevée au fil JavaScript (`blockHeight`, mesures `onLayout`), en retard sur le déploiement (fil UI). Bord bas translaté (place ouverte) et hauteur de mise en page qui grandit : l'échelle de la bande était calculée d'après une hauteur périmée, puis corrigée mesure après mesure — la jointure basse dépassait puis revenait. Sans translation de bord pendant le déploiement (correction 1), l'échelle reste 1 quelle que soit la hauteur relevée : la source disparaît.
3. **Cadre à pleine hauteur, cartes absentes** : la hauteur naturelle des cartes, base de l'animation (`useCircuitCardsReveal`), n'était relevée que sur la liste AU REPOS (`onLayout` ignoré pendant l'animation). La liste d'un Circuit montée pendant un déploiement (Circuit monté replié — déplacé dans ou hors d'un Cycle, contenu changé pendant le repli —, puis déployé) n'était plus mesurée au repos : hauteur 0, donc `maxHeight` libre — liste à pleine hauteur d'un coup, cartes en fondu (opacité 0 → 1), « en descendant » (marge haute de la liste, −9 → 0). Cause la plus probable de ce point (elle dépend de l'historique du Circuit pendant la recette) ; même cause que le constat c (item 4).
4. `8e45fcd8` (mesures au repos appliquées en transition) ne touche pas la mesure du dépliage (`useCircuitCardsReveal.onLayout`, valeur partagée posée directement) ; pendant le glisser, les mesures restent immédiates : aucun effet sur 1 à 3.

**Corrections** :
- `refreshLayoutShifts` : pendant l'arrêt sur un Circuit replié (`hoverCircuitId`) et pendant son déploiement (`expandingCircuitId`), l'aperçu referme la place de l'élément saisi mais n'en ouvre aucune (`layoutDragShifts(…, null)`) : le cadre grandit avec ses cartes, par la seule mise en page ; à la fin du déploiement (`finishLayoutExpansionRef`), la place s'ouvre sous le doigt (registre, 320 ms), juste après le même mouvement. [01/11/2026, contre-recette n° 5 : « et pendant son déploiement » remplacé — la place s'ouvre au départ du déploiement, avec lui (`startLayoutExpansion`) ; voir « Contre-recette n° 5 (01/11) ».] La destination de dépose pendant ce temps reste la fin du Circuit (un lâcher y dépose, inchangé).
- `useCircuitCardsReveal(…, measuresContent)` : hauteur naturelle relevée sur le CONTENU de la liste (`onContentLayout`, vue intérieure non contrainte par `maxHeight`, `-exercises-content`), à chaque mesure, pendant l'animation comme au repos ; inconnue, la liste animée reste fermée (`circuitRevealMaxHeight` : 0) au lieu d'être libre. Structure générale seulement ; l'ancien modèle garde la mesure au repos.
- Règles appliquées : mouvements progressifs du repli et du déploiement (obs-3 b, 29/10 et 30/10) ; « la place qui s'ouvre montre la destination » (recette n° 2), appliquée à la fin du déploiement.

**Remplace** (texte conservé) : contre-recette n° 3, « a) Correction » [« la destination reste la FIN du Circuit qui s'ouvre, relue à chaque mesure dans les boîtes courantes : la place ouverte suit le bas du Circuit »] — la destination reste la fin du Circuit, mais sa place n'est plus ouverte pendant l'arrêt ni pendant le déploiement ; [« Un lâcher pendant le déploiement dépose à la fin du Circuit, place montrée par l'aperçu »] — dépose inchangée, place non montrée.

### 2. cr5-reposer — KO, régression de `0196c566` (classe A ; mécanisme classe D)

> « lorsqu'on lâche la carte elle disparait et réapparait immédiatement, très vite avant de se placer. Cela arrive systématiquement aussi si je déplace un point d'arrêt. »

**Cause** (prouvée sous Jest au niveau des valeurs rendues ; l'ordre des images natives n'est pas observable) : la position affichée de l'élément saisi est la somme de deux translations — celle de sa rangée (registre) et celle du doigt (carte : `dragY` ; Point : translation de la puce). `releaseDragY` (`0196c566`) posait 0 sur la translation du doigt, aussitôt, dans la tâche du lâcher ; la rangée ne prenait la position affichée (pose de départ `release`, ou pose du dépôt appliqué) que dans l'effet du rendu du lâcher, une ou plusieurs images plus tard : entre-temps, l'élément était affiché à sa place d'origine — à CHAQUE lâcher (retour, refus, dépôt appliqué). Point d'arrêt : même défaut, plus ancien — la translation de la puce était une valeur rendue (état), remise à 0 au rendu du lâcher, avant la pose native de la rangée. Tests : avant correction, somme rendue au lâcher = 0 (attendu 15 pour la carte, 5 pour le Point) ; aucune pose de la rangée au lâcher (attendu la position affichée, −490).

**Correction** : dans la tâche même du lâcher, la rangée est posée à la position affichée (`AnimatedShiftRegistry.pose`) — `layoutSettleFor` pour toute source (auparavant Circuit et Cycle seulement), `handleDropItem` dans l'ancien modèle — et la translation du doigt revient à 0 ; cette translation (`dragY` de la carte, `chipY` de la puce du Point ; `StopPointLine` accepte une valeur animée) est rendue native juste avant (`makeAnimatedValueNative`) : les deux poses partent dans le même lot du pilote natif, la somme affichée ne change pas. Le rendu du lâcher porte 0 (doigt) et la position affichée (rangée), cohérents avec le pilote natif. Native au lâcher seulement, pas dès la création : `dragY` partage sa transformation avec `swipeX` (balayage), dont l'animation ne doit pas en dépendre. Correctif de la contre-recette n° 3 conservé (rendu du lâcher à translation de doigt nulle ; renvoi de la pose native une tâche après) ; son test reste significatif (`seen` = [0]) ; deux de ses lectures pendant le geste lisent désormais la valeur animée vivante (`translationOf`) au lieu du dernier rendu.

### 3. Constat a — glisser d'un Circuit (classe B pour le repli ; classe A pour le rail)

> « - la partie du rail qui va du cercle au bord haut du circuit disparait pendant le mouvement - dans la situation où lorsque le circuit se déplace vers le bas lorsqu'il se replie, il n'est plus aligné avec le doigt pendant le déplacement. lorsqu'on replie un circuit son positionnement haut ne doit pas bouger, uniquement la partie basse doit remonter. »

**a1, rail — cause** : saisi, tenu ou en retour (`motion.held`), le Circuit ne rendait aucun lien (`link = motion.held ? null : …`) : le segment de son bord haut à son anneau, dans le Circuit, disparaissait avec le lien vers son prédécesseur. **Correction (classe A ; story 5.2b : l'élément hors de la chaîne garde le rail de sa propre surface)** : saisi, le Circuit (et le Cycle) dessine le segment de son bord haut (0) à son anneau ; seul le lien au-dessus de son bord haut disparaît.

**a2, repli du Circuit saisi — cause retenue (hypothèse 1, non reproductible sous Jest)** : à la saisie, le Circuit se replie (COMP §6, 900 ms) ; le contenu défilant raccourcit d'autant. Liste défilée près de son bas (« dans la situation où »), le décalage de défilement dépasse le nouveau maximum et iOS le ramène dans les bornes : tout le contenu, Circuit compris, descend sous le doigt immobile. Écartées : compensation `layoutSourceDrift` (le haut du Circuit saisi ne change pas dans la mise en page) ; animation du repli (hauteur et marges de la liste, sous l'en-tête : le haut ne bouge pas). Hypothèse 2, non traitée : une mesure en transition (`8e45fcd8`) appliquée après la saisie — sans effet attendu sur la position affichée.
**Règle (classe B, décision explicite de Hermann du 01/11/2026)** : « lorsqu'on replie un circuit son positionnement haut ne doit pas bouger, uniquement la partie basse doit remonter. » **Correction** : pendant le glisser d'un Circuit et jusqu'à la fin de son retour, le contenu défilant garde au moins sa hauteur du début du geste (`layoutContentFloor`, `minHeight` du contenu) : le repli ne déclenche plus le recadrage du défilement ; le haut du Circuit reste sous le doigt, seul son bas remonte. Repli par le chevron : le haut ne bouge déjà pas. Risque résiduel : à la fin du geste, la hauteur gardée est rendue ; liste défilée tout en bas, le contenu peut alors se recadrer d'un coup (hors geste).

### 4. Constat c — deux Circuits, deux replis différents (classe A)

> « Deux circuits, avec chacun trois cartes, replie d'un circuit : l'un des deux se replie normalement avec la bonne animation, pour l'autre les cartes s'effacent d'abord, le circuit est vide, puis il se replie. Les animations ne sont pas identiques... »

**Cause** (item 1, cause 3) : hauteur naturelle inconnue (0) pour la liste d'un Circuit monté replié puis déployé (ou périmée après un changement de contenu pendant le repli) : `maxHeight` libre pendant le repli — les cartes s'effacent (opacité 1 → 0) dans un Circuit qui garde sa hauteur, puis la liste est démontée : saut. Les deux Circuits ont des historiques différents (l'un mesuré au repos, l'autre non). `8e45fcd8` n'y est pour rien. **Correction** : mesure du contenu à chaque mise en page (item 1) ; jamais libre pendant l'animation quand le contenu est mesuré (`circuitRevealMaxHeight`). Règles appliquées : obs-3 b (29/10, 30/10), b4-cycle (recette n° 2).

### Fichiers

- `src/features/sessions/CircuitHeader.tsx` : `useCircuitCardsReveal(…, measuresContent)`, `onContentLayout`, `circuitRevealMaxHeight`.
- `src/features/sessions/CompositionScreen.tsx` : `refreshLayoutShifts` ; `LayoutCircuitBlock` (contenu intérieur `-exercises-content`, styles `layoutCircuitCardsClip` / `layoutCircuitCards`, segment de rail du Circuit saisi) ; `LayoutCycleBlock` (segment de rail) ; `layoutSettleFor`, `handleDropItem` (pose de la rangée au lâcher) ; `CompositionActivityRow` (`releaseDragY`) ; `StopPointRow` (`chipY`, `releaseChipY`) ; `layoutContentFloor` ; enveloppe (item 5 : `EnvelopeContext.edgeDrag`, `EnvelopeFrame`).
- `src/features/sessions/ActivityRecoveryLine.tsx` : `StopPointLine` accepte une valeur animée.
- `src/features/sessions/useAnimatedShift.ts` : `makeAnimatedValueNative`.
- `src/features/sessions/EnvelopePerimeter.tsx` : item 5.
- Tests : `CompositionScreen.recette2composition.test.tsx` (7 nouveaux ; 2 lectures adaptées dans cr4-replie b), `CircuitHeader.test.tsx` (3), `EnvelopePerimeter.test.ts` (3), `CompositionScreen.recette2lot3.test.tsx` (1).
- Preuves d'échec avant correction (sources remises à `8e45fcd8`, tests nouveaux de `recette2composition`) : 6 échecs sur 7 — bord bas à 89 pendant l'arrêt ; somme au lâcher 0 (carte, Point) ; aucune pose de rangée ; aucun segment de rail ni hauteur gardée ; aucun contenu intérieur. Le 7e (lâcher pendant l'arrêt → fin du Circuit) passe avant et après (comportement conservé).

### Vérifications

- `npx jest` ciblé (`--maxWorkers=1`) : `CompositionScreen.{b1b,b2,b4,b4b,b5,b6,recette1,recette2,recette2lot3,recette2composition,incident0111}`, `layoutDrop*`, `layoutDragShifts*`, `useAnimatedShift`, `CircuitHeader`, `compositionGesture`, `EnvelopePerimeter`, `legacyModeConfinement` : 19 suites, 260 tests ; 1 échec au passage groupé, `CompositionScreen.recette1` (« disposition générale (deux Circuits) : même comportement », instabilité sous charge déjà relevée à la contre-recette n° 3), vert repassé seul (9/9). Ancien modèle : `CompositionScreen.test` 470/470 ; `.r7`, `.b3`, `CompositionPausesFlow.integration` verts. Premier essai (valeur du doigt native dès sa création) : 41 échecs de l'ancien modèle (animation du balayage `swipeX` sur une transformation devenue native) — d'où la conversion au lâcher seulement.
- `npx tsc --noEmit`, `eslint` des fichiers touchés : sans erreur. Garde `legacyModeConfinement` (motif `target`) : aucune occurrence ajoutée.

### À vérifier sur iPhone (Jest ne le prouve pas)

1. cr5-replie : un seul mouvement — le cadre grandit avec ses cartes (comme au chevron), sans soubresaut du bord bas, puis la place s'ouvre sous le doigt ; aussi pour un Circuit déplacé dans puis hors d'un Cycle avant le test, et pour un Circuit dans un Cycle.
2. cr5-reposer : aucune image à la place d'origine au lâcher — carte reposée, déposée ailleurs, refusée ; Point d'arrêt de même ; plusieurs fois ; l'ancien défaut (« elle disparaît et l'emplacement reste vide ») ne revient pas ; ancien modèle (Circuit unique) de même.
3. Constat a : rail du Circuit saisi (anneau → bord haut) visible ; liste défilée tout en bas, saisie d'un Circuit déployé : le haut reste sous le doigt pendant le repli ; à la fin du geste, recadrage éventuel (risque résiduel).
4. Constat c : deux Circuits de trois cartes, dont l'un déplacé dans puis hors d'un Cycle : replis et déploiements identiques, continus.

### À CLARIFIER

1. Pendant l'arrêt (500 ms) et le déploiement (700 ms) d'un Circuit replié, la destination (fin du Circuit) n'est plus montrée par une place ouverte ; un lâcher y dépose toujours. Lecture prudente du constat (« le cadre se déplie […] sans qu'elles n'apparaissent ») ; ouvrir la place en même temps que le déploiement reste possible si Hermann le préfère. [01/11/2026 : tranché par Hermann — « Oui, ouvrir la place pendant le déploiement. » ; voir « Contre-recette n° 5 (01/11) ».]

### Synchronisation code / documentation

- **Classe B** (item 3, repli ; item 5) : règle recopiée textuellement dans ch07 (entrée « constat a ») ; complète COMP §6 (G4). Recherche des formulations contraires (« replie », « se replie », « replié d'abord », « commence par le replier ») : ch03, ch04, COMP §6, ch07 — aucune ne fixe le bord qui bouge au repli ; aucune annotation nécessaire. Item 5 : voir la spec B.4b (écart 1 et « Réalisé » annotés ; ch07, lot 3).
- **Classe A** (items 1, 2, 4 ; rail de l'item 3) : règles citées ; ch07 (entrées ajoutées, annotations datées) ; cette spec (contre-recette n° 3 remplacée en partie, voir « Remplace » ci-dessus).
- **Classe D** : poses natives simultanées au lâcher, mesure du contenu, hauteur gardée du contenu défilant.

## Contre-recette n° 5 (01/11) (iPhone)

Résultat de Hermann recopié (testé sur `bc3d409e`). Départ `bc3d409e`, aucun commit. Registre : ch07, section « Recette iPhone n° 2 du 31/10/2026 — suggestions de nom, Circuit replié, durée des en-têtes » (entrée « Contre-recette n° 5 du 01/11/2026 — cr6-replie » ; annotations datées de « Arrêt d'une carte sur un Circuit replié », « Contre-recette n° 3 — cr4-replie » et « Contre-recette n° 4 — cr5-replie », dont son « À clarifier »).

> cr6-replie KO : « Oui, ouvrir la place pendant le déploiement. le circuit s'ouvre proprement mais la carte elle fait encore plusieurs soubresauts qu'il faut éliminer. »

### 1. Place ouverte pendant le déploiement (classe B — réponse à l'À CLARIFIER 1 de la contre-recette n° 4)

**Règle** (décision explicite de Hermann du 01/11/2026) : « Oui, ouvrir la place pendant le déploiement. » — pendant le déploiement d'un Circuit replié ouvert par l'arrêt, la place s'ouvre à sa fin dans le même mouvement : le cadre et ses cartes grandissent, la place à la fin du Circuit grandit avec eux ; aucun rebond du bord bas (ce qui rendait cr6 « s'ouvre proprement » est gardé). Pendant l'arrêt (500 ms, avant le déploiement) : toujours aucune place (inchangé, la réponse ne porte que sur le déploiement). Déploiement terminé : destination sous le doigt calculée une fois, décalages animés une fois (inchangé).

**Remplace** (texte conservé, annotations datées) : contre-recette n° 4, item 1, « Corrections » — [« pendant l'arrêt sur un Circuit replié (`hoverCircuitId`) et pendant son déploiement (`expandingCircuitId`), l'aperçu referme la place de l'élément saisi mais n'en ouvre aucune »] : vrai pendant l'arrêt et jusqu'au départ du déploiement ; pendant le déploiement, la place s'ouvre avec lui. ch07 : « ni pendant l'arrêt ni pendant le déploiement, aucune place n'est ouverte » (entrées « Arrêt d'une carte », « cr4-replie », « cr5-replie ») annoté.

**Réalisation** :
- `useCircuitCardsReveal(…, measuresContent, onRevealStart)` (`CircuitHeader.tsx`) : un déploiement part quand la hauteur naturelle du contenu est connue (déjà relevée ; sinon à la première mesure du contenu monté ; au plus tard après `CIRCUIT_REVEAL_START_FALLBACK_MS`, 120 ms) — il part de 0 avec sa hauteur finale (auparavant, hauteur inconnue au départ : liste fermée jusqu'à la mesure, puis rattrapage d'un coup). `onRevealStart(hauteur)` est appelé dans la tâche même du départ.
- `LayoutCircuitBlock` : croissance prévue du Circuit = hauteur des cartes + écart `CIRCUIT_GAP` − marge basse réduite `CIRCUIT_CARDS_BOTTOM_OVERLAP` − ligne des noms du Circuit replié (en-tête replié moins sa ligne, relevé replié) ; transmise à l'écran (`LayoutDragContext.onCircuitReveal`).
- `startLayoutExpansion` (écran) : si ce Circuit est celui ouvert par l'arrêt, l'aperçu du déploiement est calculé une fois — place ouverte à la fin du Circuit (`layoutDragShifts` avec la destination « fin du Circuit », géométrie repliée : bord bas du Circuit, de son Cycle, éléments suivants ; ses cartes, non encore mesurées, ne reçoivent rien) — et lancé par le registre, dans la même tâche que le déploiement, avec sa durée et sa courbe (`AnimatedShiftRegistry.retarget`, `CIRCUIT_REVEAL_SHIFT_TIMING` : 700 ms, Bézier 0,4 / 0 / 0,2 / 1, `CIRCUIT_REVEAL_BEZIER` partagé avec Reanimated). La fin du déploiement est comptée depuis ce départ (`finishLayoutExpansionRef`).
- `refreshLayoutShifts` : déploiement lancé (`expansion`), l'aperçu n'est plus recalculé à chaque mesure.
- `CircuitSurface` (disposition générale seulement, `extendsOnSpread` ; Circuit et Cycle) et `LayoutRailTail` (fond en trois couches, queue du rail) : quand les bords s'écartent (place ouverte), la bande et la piste gardent leur hauteur de mise en page (fil UI) et suivent le bord haut ; un prolongement d'un point, posé sous elles, est étiré de l'écart — aucune hauteur relevée au fil JS (cause n° 2 de cr5-replie : bord bas qui « remonte et redescend »). Quand les bords se rapprochent (place refermée), resserrement d'après la hauteur relevée, comme avant.

### 2. Soubresauts de la carte portée pendant le déploiement (classe A)

**Mécanismes examinés** (ce qui déplace la carte portée pendant les 700 ms) :
1. **Croissance du Circuit au-dessus d'elle — cause retenue.** Cas de la recette (carte sous le Circuit replié, remontée sur lui ; `cr5-replie` de `recette2composition` reproduit cette géométrie) : la croissance du Circuit (fil UI, Reanimated, image par image) fait descendre la carte dans la mise en page ; la compensation (`layoutSourceDrift`, registre) n'était posée qu'à la mesure suivante, depuis le fil JS (`onLayout` → `reportLayoutBox` → `refreshLayoutShifts` → `pose`) : à chaque image, la carte descendait puis remontait une ou plusieurs images plus tard. Chaque mesure changeait la compensation, donc l'aperçu : `setLayoutLift` à chaque mesure, rendu de l'écran entier sur la voie synchrone (incident du 01/11) — le fil JS chargé regroupait les mesures, d'où des pas plus grands, irréguliers : « plusieurs soubresauts ». Prouvé sous Jest au niveau des valeurs : avant correction, la translation de la carte suit chaque mesure (−2, −17, −33…), une pose par mesure.
2. Place ouverte (part 1) : translations du registre, sans effet sur la mise en page de la carte (elle est exclue de l'aperçu, `layoutDragShifts`).
3. Translation du doigt (`dragY`, valeur JS posée au rendu de la carte) : immobile pendant l'arrêt ; mais retardée quand le fil JS est saturé par les rendus du point 1 — corrigé par la même mesure (plus aucun rendu de l'écran par mesure).
4. `layoutContentFloor` : glisser d'un Circuit seulement ; défilement automatique : seulement doigt dans la bande de bord — non concernés par le cas de la recette (voir « À vérifier »).
5. Re-rendus de `setLayoutLift` réappliquant une transformation périmée : la carte est portée par des valeurs natives (registre, `nativeShiftKey`) ; supprimés de toute façon pendant le déploiement.

**Correction** : la compensation de tout le déploiement est lancée une seule fois, au départ du déploiement, sur le pilote natif, avec sa durée et sa courbe : −(déplacement déjà mesuré + croissance prévue du Circuit si la carte est sous lui, même dans son Cycle) (`startLayoutExpansion`). Pendant le déploiement, aucune mesure ne la repose ni ne rend l'aperçu. À la fin, la destination sous le doigt est recalculée et, si la mesure réelle diffère de la prévision, l'écart est posé une seule fois (`refreshLayoutShifts`, `pose`). Un lâcher pendant le déploiement part de la position affichée estimée sur la courbe du registre (`AnimatedShiftRegistry.estimate`), non de la dernière mesure (en retard).

**Option écartée** : carte portée dans une couche au-dessus du contenu (indépendante de la mise en page) — refonte du rendu du glisser (copie de la carte, rail, retour, poses au lâcher), risque élevé de régression sur les corrections de cr5-reposer ; compensation calculée sur le fil UI (Reanimated) — exacte pendant le déploiement, mais son relais par le registre (pilote natif d'Animated) ne peut pas être fait dans la même image : saut de la carte à la fin du déploiement ou au lâcher.

Règles appliquées : la carte portée reste sous le doigt (recette n° 2, arrêt sur un Circuit replié) ; mouvements progressifs (obs-3 b, 29/10 et 30/10) ; « la place qui s'ouvre montre la destination » (recette n° 2).

### Fichiers

- `src/features/sessions/CircuitHeader.tsx` : `CIRCUIT_REVEAL_BEZIER`, `CIRCUIT_REVEAL_START_FALLBACK_MS`, `useCircuitCardsReveal(…, onRevealStart)` (départ à hauteur connue).
- `src/features/sessions/useAnimatedShift.ts` : `ShiftTiming`, `AnimatedShiftRegistry.retarget`, `estimate` ; durée et courbe gardées par mouvement (`position`).
- `src/features/sessions/CompositionScreen.tsx` : `LayoutDragGesture.expansion`, `startLayoutExpansion`, `refreshLayoutShifts`, `finishLayoutExpansionRef`, `layoutSettleFor`, `LayoutDragContext.onCircuitReveal`, `LayoutCircuitBlock` (croissance prévue), `CircuitSurface`, `LayoutRailTail`, `CIRCUIT_REVEAL_SHIFT_TIMING`.
- Tests : `CompositionScreen.recette2composition.test.tsx` (4 nouveaux ; test cr5-replie renommé et annoté — il ne fournit pas la mesure du contenu, donc vérifie l'arrêt et l'attente du départ), `CircuitHeader.test.tsx` (2 nouveaux).
- Preuves d'échec avant correction (sources remises à `bc3d409e`, tests nouveaux) : 6 échecs sur 6 — bord bas à 0 au départ du déploiement (attendu 89) ; translation de la carte 0 au départ (attendu −61, puis elle suivait chaque mesure) ; aucun départ signalé (`onRevealStart`).

### Vérifications

- `npx jest` ciblé (`--maxWorkers=1`) : `CompositionScreen.{b1b,b2,b4,b4b,b5,b6,recette1,recette2,recette2lot3,recette2composition,incident0111}`, `layoutDrop.{b4,recette2}`, `layoutDragShifts.recette2`, `useAnimatedShift`, `CircuitHeader`, `EnvelopePerimeter`, `compositionGesture`, `legacyModeConfinement` : 19 suites, 266 tests, verts. Ancien modèle : `CompositionScreen.test` 470/470 — premier passage : 2 échecs (bande du fond du Circuit unique, `CircuitSurface` partagé : translation et échelle attendues de la bande étirée) ; le prolongement est réservé à la disposition générale (`extendsOnSpread`), l'ancien modèle garde la bande étirée, inchangée.
- `npx tsc --noEmit`, `eslint` des fichiers touchés : sans erreur. Garde `legacyModeConfinement` (motif `target`) : aucune occurrence ajoutée.

### À vérifier sur iPhone (Jest ne le prouve pas)

1. cr6-replie : carte sous un Circuit replié, remontée et arrêtée sur lui — pendant le déploiement, la carte reste immobile sous le doigt (aucun soubresaut) ; le cadre et ses cartes grandissent et la place à la fin du Circuit grandit avec eux, sans rebond du bord bas ni de la queue du rail ; puis la place se déplace une fois sous le doigt. Aussi : carte au-dessus du Circuit (descendue sur lui), Circuit dans un Cycle, Circuit déplacé dans puis hors d'un Cycle avant le test (hauteur des cartes inconnue au départ : départ retardé d'une ou deux images).
2. Risque résiduel : la croissance du Circuit (Reanimated) et la compensation (pilote natif d'Animated) partent dans la même tâche mais sur deux mécanismes distincts — un décalage d'une image au départ donnerait un léger glissement continu de la carte (quelques points au plus, sans à-coup) ; si la prévision de croissance est fausse (ligne des noms sur deux lignes, taille de texte), un petit saut unique à la fin du déploiement. Défilement automatique (doigt dans la bande de bord pendant le déploiement) : non traité.
3. Lâcher pendant le déploiement : la carte part de là où elle est vers la fin du Circuit, sans saut.

### Synchronisation code / documentation

- **Classe B** (item 1) : réponse de Hermann recopiée textuellement dans ch07 (entrée « Contre-recette n° 5 du 01/11/2026 — cr6-replie ») et ci-dessus. Recherche des formulations contraires (« aucune place », « pendant le déploiement », « n'en ouvre aucune ») : ch07 (trois entrées annotées, « À clarifier » de cr5-replie marqué tranché) ; cette spec (contre-recette n° 4, item 1 et À CLARIFIER 1, annotés) ; COMP §6, ch13 : aucune mention du déploiement par l'arrêt.
- **Classe A** (item 2) : règles citées ; ch07 (même entrée).
- **Classe D** : départ du déploiement à hauteur connue, `retarget` / `estimate` du registre, fond et rail sans hauteur relevée à l'écartement.
