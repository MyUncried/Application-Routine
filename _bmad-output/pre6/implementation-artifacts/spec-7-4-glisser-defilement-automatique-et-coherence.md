---
title: 'Story 7.4 — Glisser : défilement automatique et cohérence après placement et changement de zone'
type: 'bugfix'
created: '2026-10-22'
status: 'review'
baseline_commit: '54821450'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-2-3b-reorganisation-animee-au-glisser.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-5-2b-correction-du-rail-pendant-le-deplacement.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-6-2-glisser-deposer-d-un-point-d-arret.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-2-ecran-recuperation-en-placement-etiquette-d301-point-souleve.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette iPhone du 22/10, mot pour mot :
- (3) « Quand on a sélectionné une carte en appui long, son déplacement hors du cadre visible doit faire défiler l'écran pour permettre d'atteindre les cartes / emplacements qui ne sont pas visibles. »
- (13) « Ajouter un point d'arrêt peut casser le format (rail discontinu, carte figée au mauvais emplacement). Ce n'est pas systématique, le même mouvement peut ne pas provoquer le problème. Sélectionner une carte remet le format en place. »
- (14) « Déplacer une carte dans ou hors circuit provoque un affichage incorrect au niveau du cadre du circuit. »

Aujourd'hui le défilement est coupé pendant un glisser (`scrollEnabled={draggedKey === null}`) : rien hors de l'écran n'est atteignable.

**Approach:** défilement automatique de la liste près de ses bords pendant le glisser (carte ou Point d'arrêt), sans bibliothèque : `scrollTo` sans animation à chaque trame, défilement accumulé ajouté à la translation de l'élément soulevé (repère du contenu). Pour 13 et 14 : causes trouvées dans la cohérence entre le registre des translations (`AnimatedShiftRegistry`) et le pilote natif sous Fabric, corrigées dans le registre et aux fins d'aperçu qui produisent une nouvelle disposition.

## Boundaries & Constraints

**Always:**
- Sources : D-437 (ch07, « Défilement pendant un glisser ») ; epics.md « Epic 7 », story 7.4 ; specs 2.3b, 5.2b, 6.2, 7.2.
- **AC1** (3) : pendant le glisser d'une carte OU d'un Point d'arrêt, quand le doigt approche du bord haut ou bas de la zone visible de la liste, la liste défile — vitesse progressive selon la profondeur dans la bande de bord ; arrêt hors de la bande, au bord du contenu, à la dépose, à l'annulation (et donc au dialogue, qui n'apparaît qu'après la dépose). L'élément soulevé reste sous le doigt ; l'emplacement prévisualisé, les décalages des voisines, le rail et le cadre du Circuit tiennent compte du défilement accumulé (repère du contenu). Le défilement par l'utilisateur reste coupé pendant le geste.
- **AC2** (13) : cause trouvée et prouvée par un test qui échoue avant le correctif ; aucun décalage arbitraire.
- **AC3** (14) : cadre du Circuit correct pendant et après un glisser qui entre dans le Circuit ou en sort ; cause trouvée, corrigée, testée.
- **AC4** : rien d'autre ne change (règles, styles, dimensions validés).
- Fins de ligne préservées par fichier.

**Never:**
- Aucune nouvelle dépendance (ni `react-native-gesture-handler`, ni `react-native-reanimated`) ; aucun changement du Domaine, de migration, de `docs/`, `.github/`, `tokens.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|----------|--------------|---------------------------|
| Doigt dans la bande du bas | carte soulevée, contenu plus long que la zone | défilement vers le bas, d'autant plus rapide que le doigt est proche du bord |
| Doigt immobile dans la bande | — | défilement continu ; carte sous le doigt ; emplacement mis à jour |
| Doigt hors de la bande | — | arrêt |
| Bord du contenu atteint | — | arrêt |
| Dépose / annulation | — | arrêt ; défilement par l'utilisateur rétabli |
| Liste plus courte que la zone | — | aucun défilement |
| Point d'arrêt soulevé | — | même défilement ; puce sous le doigt |
| Dépôt pendant le décalage animé des voisines | animation native en cours | aucune carte ni lien de rail figés à mi-course |
| Nouveau soulèvement pendant un retour animé | — | voisines à leur place |
| Dépôt entrant dans le Circuit / sortant | — | nouvelle disposition rendue avec un cadre du Circuit sans décalage |

</frozen-after-approval>

## Code Map

- `src/features/sessions/useAnimatedShift.ts` : `guardNativeEcho` (13), `prepareLayoutCommit` (14).
- `src/features/sessions/useDragAutoScroll.ts` (nouveau) : contrôleur du défilement automatique.
- `src/features/sessions/compositionGesture.ts` : `autoScrollVelocity`, `clampScrollOffset`, constantes.
- `src/features/sessions/CompositionScreen.tsx` : `finishDragPreview`, branchement du défilement (corps défilant, cartes, points).
- Tests : `useAnimatedShift.test.ts`, `useDragAutoScroll.test.ts` (nouveau), `CompositionScreen.test.tsx` (« story 7.4 »).
- `src/features/sessions/README.md`.

## Tasks & Acceptance

**Execution:**
- [x] AC2 : cause prouvée (test registre, sémantique du pilote natif) ; correctif `guardNativeEcho` ; test écran.
- [x] AC3 : cause prouvée (test écran, `setValue` natif) ; correctif `prepareLayoutCommit` aux fins d'aperçu sans animation.
- [x] AC1 : défilement automatique (cartes et points) + tests unitaires et écran.
- [x] README.

**Acceptance Criteria:**
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit` et `npm run lint` sont lancés, then tout est vert.
- Given un iPhone, when la recette J6 est menée, then les commentaires 3, 13 et 14 de la recette du 22/10 sont conformes.

## Implementation Notes

**Cause du commentaire 13 (prouvée).** Le registre arrête une animation en cours puis pose aussitôt une valeur (`AnimatedShiftRegistry.apply` sans animation au dépôt appliqué, `reset` au soulèvement suivant, `prepareLayoutCommit`) : `cancel` → `animation.stop()` → `shift.setValue(cible)`. Sur le pilote natif, l'arrêt appelle aussitôt le rappel de fin (`animations/TimingAnimation.js` l. 168-175), mais le module natif renvoie PLUS TARD la valeur atteinte au moment de l'arrêt (`RCTFrameAnimation`) ; React Native la recopie alors dans la valeur JS (`node_modules/react-native/Libraries/Animated/animations/Animation.js` l. 144-151 → `AnimatedValue.__onAnimatedValueUpdateReceived`, `nodes/AnimatedValue.js` l. 293), puis rerend les vues animées (`src/private/animated/createAnimatedPropsHook.js` l. 135-143 : « synchronise Fiber and Shadow tree » sous Fabric, tant que le drapeau `cxxNativeAnimatedEnabled` est faux, sa valeur par défaut en 0.86). Le rendu porte la valeur JS (`AnimatedProps.__getValueWithStaticProps`) : la carte (et ses liens de rail, et les bords du Circuit) se figent à mi-course. Le registre croit la clé à sa cible (`applied`), ne la repose jamais : seul le `reset` du soulèvement suivant la corrige — « sélectionner une carte remet le format en place ». Non systématique : il faut que le dépôt (ou le soulèvement) survienne pendant les 180 ms d'une animation. Le défaut devient visible au rendu suivant de la vue — l'entrée en placement (« Ajouter un arrêt ») rerend toutes les rangées. Avant le correctif, `useAnimatedShift.test.ts` « pose immédiate pendant une animation » rend 44 au lieu de 0, « reset pendant un retour animé » 60 au lieu de 0, et le test écran « dépôt pendant le décalage animé des voisines » laisse B décalée.
Correctif : `guardNativeEcho` (`useAnimatedShift.ts`) — chaque valeur du registre filtre la recopie native : reçue alors qu'aucune animation de la clé n'est en cours ni en attente, une valeur différente de la cible posée est ramenée à cette cible, de façon synchrone, avant le rendu que la recopie déclenche (le module natif a déjà reçu la cible par `setValue`). Non couvert : la relecture asynchrone de `AnimatedValue.__detach` (vues détachées pendant une animation), qu'aucun parcours du glisser ne produit.

**Cause du commentaire 14 (prouvée).** Au dépôt appliqué (et à « Confirmer » d'un dialogue de perte ou de Tour), la nouvelle disposition (Circuit agrandi ou rétracté) était RENDUE avec les translations de l'aperçu — remises à 0 seulement après, dans l'effet de mise en page du registre. Sous Fabric, ce rendu porte la valeur JS des translations : le Circuit agrandi s'affichait avec son bord haut, son en-tête, son anneau et son bord bas encore décalés ; sur le pilote natif, la pose à 0 (`setValue`, opération native exécutée immédiatement, `RCTNativeAnimatedTurboModule.mm` `queueFlushedOperationBlock`) ne rerend pas la vue et n'est pas synchronisée avec le montage. Avant le correctif, les deux tests écran « commentaire 14 » (avec `setValue` sans rendu, comme sur le pilote natif) relèvent le bord haut à −78 (entrée) et le bord bas à −79 (sortie) après le dépôt.
Correctif : `prepareLayoutCommit` (`useAnimatedShift.ts`), appelé par `finishDragPreview` (`CompositionScreen.tsx`) AVANT les écritures d'état de toute fin d'aperçu sans animation (dépôt appliqué, entrée en placement, choix de Tour) et avant « Confirmer » (dialogue de perte, point déplacé par choix de Tour) : animations arrêtées, valeurs JS à 0 sans opération native (le pilote natif garde l'aperçu affiché jusqu'au montage), pose native par l'`apply` qui suit le rendu (à défaut, une tâche plus tard).

**Défilement automatique (AC1).** `DragAutoScrollController` (`useDragAutoScroll.ts`) : début au soulèvement accepté (`handleRowDragStart`), fin à `handleDragStart(null)` (dépôt, annulation, démontage pendant le geste) ; l'élément soulevé appelle `track(pageY)` à chaque mouvement et s'abonne aux trames (`attach`) pour suivre le défilement doigt immobile. Translation = déplacement du doigt + défilement accumulé ; elle alimente `onDragMove` / `onDragEnd` comme avant : aperçu, dépôt, rail et Circuit restent dans le repère du contenu (`originLayout`, `frozenDropSlot`) sans autre changement. Zone visible : `measureInWindow` du défilant (`getNativeScrollRef`) au layout et au soulèvement ; contenu : `onContentSizeChange` ; décalage : `onScroll` (ignoré pendant le geste, le contrôleur tenant lui-même le décalage).

**Choix non dictés (réversibles, à signaler à Hermann)**
1. Bande de bord de 64 pt (moitié de la zone si elle fait moins de 128) ; vitesse linéaire de 0 (limite intérieure) à 720 pt/s (12 pt par trame à 60 Hz) au bord et au-delà.
2. `scrollTo` sans animation à chaque trame (`requestAnimationFrame`), première trame comptée 1/60 s, trame tardive bornée à 50 ms ; aucun pilote natif possible pour un défilement commandé pendant un geste du responder system.
3. Le défilement par l'utilisateur reste coupé pendant le glisser (`scrollEnabled`), comme avant.
4. Lecture, pose et filtrage de la seule valeur JS d'une `Animated.Value` par deux internes de React Native (`__getValue`, `__onAnimatedValueUpdateReceived`, ce dernier enveloppé par instance), sans API publique équivalente ; s'ils disparaissent : repli sur `setValue`, filtrage inactif.
5. Le défilement relève son décalage à `onScroll` (toutes les 16 ms, aussi hors geste : un événement JS par trame pendant un défilement de l'utilisateur), `onScrollEndDrag` et `onMomentumScrollEnd`.

## Spec Change Log

## Review Triage Log

Trois revues indépendantes du 22/10/2026 (aveugle, cas limites, écarts de vérification), sous-agents en lecture seule. Triage du développeur, sous la délégation de Hermann.

**Corrigés**
1. Haut (aveugle 1) — la première version (`resyncAfterStop`, microtâche après le rappel de fin) était sans effet sur appareil : `TimingAnimation.stop` appelle le rappel de fin aussitôt, la recopie native arrive après. Remplacée par `guardNativeEcho` (filtre de la recopie elle-même) ; simulations corrigées (rappel synchrone, recopie plus tard) ; preuve par mutation : sans le filtre, 2 tests registre (44 et 60 au lieu de 0) et le test écran « commentaire 13 » (B à −39) échouent.
2. Moyen (cas limites 2) — doigt déjà immobile dans une bande au soulèvement : `track` appelé au soulèvement ; test.
3. Bas→Moyen (aveugle 3, cas limites 3) — décalage de départ périmé (dernier `onScroll` filtré sur iOS) : `onScrollEndDrag`, `onMomentumScrollEnd` ; test.
4. Bas (aveugle 4, 5) — `prepareLayoutCommit` limité aux clés déplacées ou en mouvement ; minuterie de repli annulée quand plus rien n'est à poser.
5. Moyen (vérification c1) — aperçu, cadre du Circuit et voisines vérifiés pendant le défilement doigt immobile.
6. Bas (vérification, divers) — JSDoc de la story 5.2 rendu à son `describe`.

**Acceptés / soumis à Hermann (recette J6)**
- Aveugle 2, cas limites 1 — décalage possible d'une trame entre `scrollTo` (commande native) et la translation de la carte (rendu React) pendant le défilement : à juger sur iPhone ; piste si visible : translation de la carte par une `Animated.Value`.
- Aveugle 6 — hauteur de contenu prise au layout : l'aperçu (Circuit agrandi) peut dépasser le bas mesuré de quelques dizaines de points ; la dernière place reste atteignable (contenu paddé de 16, dépôt au-delà de la dernière rangée).
- Aveugle 7 — repère de `measureInWindow` et de `pageY` : identiques pour un écran plein (pile) ; à vérifier sur iPhone.
- Cas limites 4 — deux doigts : comportement antérieur (le `dy` suit déjà le toucher qui bouge), étendu au défilement ; non corrigé.
- Cas limites 5 — clavier ouvert : bande du bas sous le clavier ; rare, non corrigé.
- Vérification c2 — « Confirmer » des dialogues de perte et de Tour, entrée en placement : même appel `prepareLayoutCommit` que le dépôt (prouvé), sans test écran dédié.
- Vérification (d) — `onScroll` permanent, rendu de l'élément soulevé à chaque trame : coût à observer en recette.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2`
- `npx tsc --noEmit`
- `npm run lint`

**Manual checks** : recette iPhone au jalon J6 — glisser une carte vers le bas et vers le haut d'une Composition plus haute que l'écran (doigt immobile près du bord, puis plus près ; emplacement atteint hors écran) ; même chose avec un Point d'arrêt ; déposer rapidement juste après un changement d'emplacement (plusieurs fois) puis « Ajouter un arrêt » ; entrer dans le Circuit et en sortir en déposant juste après le franchissement de son bord.
