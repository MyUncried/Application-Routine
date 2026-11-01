# B.6 — Pauses et points d'arrêt sur toute la structure

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.6 (dépend de B.4 ; arbitrages ARB-02, ARB-02a/b validés en révision 2 ; ARB-06). Branche `pre9-bmad/dev`, départ `940e116b`. **Aucune migration** (la colonne `session_stop_points.cycle_id` de la migration 016, A.1, suffit), aucun changement Figma (lecture non nécessaire : puces, rangées et dialogue repris de l'ancien modèle, ARB-19), `tokens.ts` inchangé.

## Sources appliquées

| Source | Passage appliqué |
|---|---|
| epics § B.6 | « Mode Placement sur tous les niveaux ; RM-219, RM-251, D-441, D-442 évalués sur la séquence fonctionnelle de toute la structure, frontières de chaque conteneur comprises (règles retenues ARB-02) ; récupération attachée à l'occurrence (RM-209/210). » ; « Point à l'intérieur d'un Cycle rencontré à chaque répétition ; Point au niveau Séance non répété du fait du Cycle (ARB-02a). » ; « Cycle répété : frontières entre répétitions, exceptions de début et de fin (RM-219), demande de choix entre Point de début et Point de fin de répétition, retraits et annulations comme pour le Circuit (D-442) — même mécanisme, aucun second (ARB-02b). » |
| ARB-02 « Règles retenues » (`arbitrages-pre9.md` §1) | 1. « Contrôles inchangés, appliqués à la séquence fonctionnelle de toute la structure » ; 2. « la définition structurelle de D-441 (« après le dernier Exercice du Circuit » et « après le Circuit » sont consécutifs) s'applique à chaque conteneur, Circuit ou Cycle, et aux conteneurs emboîtés » ; 3. « Après un déplacement entre deux niveaux de Composition (Point, Exercice, Circuit ou Cycle déplacé) : mêmes contrôles 1 et 2 sur la position d'arrivée » ; 4. « Plan développé : déduplication des Points consécutifs (RM-251, ch10 l.2616), sans modifier la Séance enregistrée » ; 5. « Début et fin de Tour : pour un Circuit exécuté N ≥ 2 fois, où qu'il soit placé (niveau Séance ou Cycle), D-442 s'applique tel quel ». |
| ARB-02a (validé, révision 2) | « Un point d'arrêt placé à l'intérieur d'un Cycle est rencontré à chaque répétition du Cycle. Un point d'arrêt placé à l'extérieur du Cycle, au niveau Séance, ne se répète pas du seul fait que le Cycle est répété. » |
| ARB-02b (validé, révision 2) | « Aux Cycles répétés, mêmes principes que RM-219 et D-442 pour les Circuits : frontières entre répétitions, points devenus consécutifs, exceptions au début et à la fin, demande de choix entre point de début et point de fin de répétition, règles existantes de retrait ou d'annulation. « Ne pas introduire un second mécanisme de gestion des points d'arrêt. » » ; détail : « y compris la demande de choix […] (même formulation et mêmes opérations que D-442), plutôt qu'une déduplication silencieuse ». |
| ARB-06 | « Un point d'arrêt peut également être déplacé dans le conteneur, selon les règles applicables à sa position de destination. » |
| ch10 RM-251 (l.779), RM-219, RM-220 (l.2541-2542) ; ch07 D-441, D-442 | Non-consécutivité (séquence fonctionnelle, une Récupération ne sépare pas) ; pas juste après le Compte à rebours ni juste avant la Fin ; exception de début et de fin de Tour à N ≥ 2 ; déplacement / suppression d'un Exercice appliqués, Points en cause retirés sans message, le premier de deux conservé ; choix « Début de tour / Fin de tour / Annuler » au placement, au déplacement d'un Point ou d'un Exercice et au passage de N = 1 à N ≥ 2 ; Point devenu interdit au retour à 1 retiré sans message. |
| ch10 RM-209, RM-210 | Récupération solidaire de l'occurrence (déplacée, copiée, supprimée avec elle) ; « Le Point d'arrêt ne suit pas l'occurrence : il garde sa position lors du déplacement et n'est pas copié lors de la duplication ». |
| D-441 (duplication, arbitrage du 22/10/2026) | « la copie est insérée juste après la source, AVANT le point qui la suivait ([A, P, B] → [A, A′, P, B]) ; aucun point n'est copié ». |
| ch08 « Placement des récupérations et des points d'arrêt », ch13 CE-T03-08 | Mode placement, sous-brouillon, « Confirmer N pauses ajoutées » / « Confirmer les modifications », Annuler ; [30/10, contre-recette n° 1] « un second appui sur « Ajouter un arrêt » applique comme Confirmer ; sans changement, il referme seulement ». |
| Décisions consolidées du 30/10 (`origin/main`) | Aucune disposition sur les Points d'arrêt (vérifié) : rien ne prévaut sur ARB-02. |

## Réalisé

**Domaine — séquence fonctionnelle** (`src/domain/sessions/layoutStopPoints.ts`, nouveau) :
- `analyzeLayoutStopPoints` : la structure lue dans l'ordre d'affichage, sans répétition ; chaque conteneur (Séance, Cycle, Circuit) offre un emplacement avant chaque élément et un après le dernier (`position` de `structure.ts`) ; portées répétées : Circuit (N) et Cycle (k), englobantes (Circuit d'un Cycle : les deux). Séparateur : occurrence `EXERCISE` seulement.
- RM-219 (`isLayoutStopPointAllowed`) avec l'exception de **début ou de fin de répétition** de toute portée répétée (N ≥ 2 ou k ≥ 2) ; début = aucun Exercice de la portée ne le précède en elle ; fin = aucun ne le suit.
- RM-251 (`layoutConsecutivePairs`) : frontières de chaque conteneur et des conteneurs emboîtés consécutives au sens structurel (ARB-02 règle 2).
- Conflit de répétition (`layoutRepetitionConflicts`) : premier Point de début et dernier Point de fin d'une portée répétée.
- Points « à leur place » (D-441) : `stopPointsAfterRemoval`, `stopPointsAfterInsertion` (insertion au rang `i` avant le Point de ce rang, convention de l'ancien modèle), `stopPointsAfterGrouping` (enveloppe multiple).
- Jugements : `settleLayoutStopPoints` (règle **tolérante** de D-442 : Points sans emplacement — conteneur vidé — puis devenus interdits retirés sans message, second de chaque paire nouvelle retiré, doublons ; conflit créé → `CHOICE_REQUIRED` avec résolutions `HEAD` / `TAIL` retirant tous les Points de la limite écartée ; situations héritées non retouchées) ; `judgeLayoutStopPointMove` (règle **stricte** du déplacement d'un Point : refus sans mutation si interdit, occupé ou consécutif ; choix si conflit créé).

**Domaine — opérations** :
- `src/domain/sessions/layoutTree.ts` (nouveau, extrait de `layoutMoves.ts`) : `detach`, `attach`, `pruneEmpty`, `layoutItemLocation` tiennent les Points à jour ; `withSettledStopPoints` applique le jugement et produit le choix.
- `layoutMoves.ts` : `moveLayoutItem` / `stepLayoutItem` (Exercice, Circuit, Cycle entier ; un conteneur déplacé emporte ses Points), `removeLayoutExercise`, `duplicateLayoutExercise` : issues `removedStopPointIds` et `CHOICE_REQUIRED` ; **restrictions B.4 / B.5 levées** (refus `STOP_POINTS` retiré, annoté). « Monter » / « Descendre » d'un élément franchit d'abord le Point voisin du même conteneur (échange, comme `stepOccurrence`, D-441). Nouveau : `moveLayoutStopPoint` (dépose d'un Point à un emplacement de tout conteneur, ARB-06), `stepLayoutStopPoint`, `layoutStopPointSlots`.
- `layoutOperations.ts` : `layoutCircuitCountOutcome` / `layoutCycleCountOutcome` (D-442 : passage à 1 → Points interdits retirés ; passage de 1 à ≥ 2 → choix) ; `setLayoutCircuitCount` / `setLayoutCycleCount` n'appliquent rien quand un choix est requis ; **B.3** `moveExerciseToCircuit` (Circuit alterné compris) sans refus `STOP_POINTS` ; **B.2 / B.4b** : enveloppes proposées et périmètres extensibles dans une Séance à Points (garde `blockedByStopPoints` retirée, annotée) ; `wrapSpansInContainers` fait entrer dans le nouveau conteneur les Points situés entre les contenus réunis ; `insertExerciseInLayout` (ARB-07) insère après le repère et après le Point qui le suit (comme `appendActivityAfterLastDisplayed`) ; `withLayout` vide les Points de l'ancien modèle quand la disposition devient générale.
- `layoutPlacement.ts` (nouveau) : placement d'une disposition générale — `layoutPlacementSlots`, `toggleLayoutPlacementStopPointOutcome` (choix de répétition), `toggleLayoutPlacementStopPointRemoval`, `layoutPlacementConfirmation`, `applyLayoutPlacementDraft` ; même `PlacementDraft` ; emplacement désigné dans le sous-brouillon par son rang dans la séquence (jamais enregistré) ; récupérations : fonctions de l'ancien modèle réutilisées telles quelles (RM-209 / RM-210).

**Écriture, plan, brouillon** :
- `structure.ts` : garde `STRUCTURE_STOP_POINTS_UNSUPPORTED` retirée (annotée) ; `structuredInput.ts` : RM-219 contrôlé sur toute la structure à l'écriture (`FORBIDDEN_PLACEMENT`), Points consécutifs ou conflit hérités tolérés (comme l'ancien modèle).
- Persistance inchangée (`SqliteSessionRepository` écrivait déjà `cycle_id`) : aller-retour prouvé.
- Plan (D.1, `planExpansion.ts`, inchangé) : Point interne à un Cycle produit à chaque répétition, au niveau Séance une fois — prouvé par test.
- `SessionDraft.sessionDraftsEqual` : une disposition générale est comparée (signature : conteneurs, comptes, natures, ordre, Points par emplacement) — un Point ajouté, retiré ou déplacé rend le brouillon modifié (garde de sortie), comme dans l'ancien modèle (story 1.2).

**Écran** (`CompositionScreen.tsx`, `TourBoundaryChoiceDialog.tsx`, `fr.ts`) — disposition générale :
- Points d'arrêt rendus à leur place à tous les niveaux (rangée `StopPointRow` de l'ancien modèle : puce centrée, rail), nommés « Point d'arrêt après {exercice} », « … au début du circuit / du cycle », « … après le circuit / le cycle ».
- Appui long sur un Point : glisser (même résolution de destination que B.4, ligne d'insertion, défilement automatique) puis `moveLayoutStopPoint` ; refus annoncé ; actions accessibles « Monter » / « Descendre ». [Ligne d'insertion remplacée le 31/10/2026 par la recette iPhone n° 2 : décalages des voisins et des bords des conteneurs.]
- « Ajouter un arrêt » disponible ; mode Placement sur tous les niveaux : sous chaque carte (zone de récupération et emplacement qui la suit, rendu de l'ancien modèle), rangées autonomes en tête de Circuit / de Cycle et après un conteneur ; Circuits dépliés, en-têtes inactifs ; même barre, mêmes libellés, Annuler, second appui = Confirmer.
- Choix « Début de tour / Fin de tour » (Circuit) ou « Début de répétition / Fin de répétition » (Cycle) : **même dialogue** (`TourBoundaryChoiceDialog`, prop `scope`), pour le placement, la dépose d'un Point, le déplacement d'un élément, la suppression d'un Exercice et le compte ; « Annuler » ne change rien.
- Points retirés sans message : annonce VoiceOver discrète (« Point d'arrêt retiré »), comme l'ancien modèle.
- L'ancien modèle (un seul Circuit au niveau Séance) garde son code et son comportement, inchangés.

## Synchronisation code / documentation

- **Classe A** : application, sans règle nouvelle, de RM-219, RM-220, RM-251, D-441, D-442 à la séquence de toute la structure, comme ARB-02 l'écrit (règles 1 à 5) ; RM-209 / RM-210 (récupération attachée à l'occurrence) ; D-441 (duplication avant le Point suivant) ; garde de sortie (story 1.2) étendue à la disposition générale.
- **Classe B (déjà décidée, ARB-02a/b et ARB-06, révision 2 du 29/10/2026)** : propagation prévue par `arbitrages-pre9.md` §5 (« Livrée par : B.6 ») — annotations datées entre crochets, texte d'origine conservé :
  - ch10 RM-251 (l.779), RM-219 et RM-220 (tableau l.2541-2542), positions admises (l.990, l.2574) ;
  - ch07 D-441 (non-consécutivité) et D-442 (« Début et fin de Tour ») : « s'applique aussi aux répétitions d'un Cycle » ;
  - ch08 « Placement des récupérations et des points d'arrêt » (placement sur toute la structure) ; ch13 CE-T03-08 (l.1963) ;
  - `KODJO-Composition-conteneurs-2026-10-28.md` §1 (l.15, « pas une extension des positions d'arrêt »).
  Registre ch07 « Arbitrages PRE-9 » : ARB-02a / ARB-02b déjà inscrits (DOC.0), inchangés.
- **Classe C** : voir « À CLARIFIER ».
- **Classe D** : `layoutTree.ts` (extraction sans changement de comportement hors Points), désignation des emplacements par leur rang dans le sous-brouillon, signature de disposition de `sessionDraftsEqual`, enveloppe de mesure de l'en-tête de Circuit.
- **Code et tests annotés** (texte d'origine conservé, annotation datée) : en-têtes de `layoutMoves.ts`, `layoutOperations.ts`, `structure.ts`, `structuredInput.ts` ; `fr.ts` (`STOP_POINTS`) ; tests `layoutMoves.b4/b5`, `layoutOperations.b2/b3/b4b`, `structure.a1/a2`, `CompositionScreen.b1b/b2/b4b/recette1`.
- Recherche ciblée des formulations contraires (« positions d'arrêt », « RM-219 », « RM-251 », « Début et fin de Tour », « avant B.6 », « STOP_POINTS ») dans `docs/` et le code : traitées ci-dessus. COMP l.64 (« le rattachement d'un point d'arrêt [à l'enveloppe] restent réservés ») **non annoté** : voir À CLARIFIER 2.

## Écarts et reports

1. **Glisser d'un Point (disposition générale)** : la mise en page reste figée pendant le geste et la destination est la ligne d'insertion la plus proche (B.4), sans décalage animé des voisins comme dans l'ancien modèle ; refus : la puce revient à sa place sans animation de retour. Non éprouvé sur iPhone. [Remplacé le 31/10/2026 par la recette iPhone n° 2 : voisins et bords des conteneurs qui font la place, retour animé, point de raccord qui suit la puce ; voir « Recette iPhone n° 2 du 31/10 ».]
2. **« Monter » / « Descendre » d'un élément** de la disposition générale : franchit d'abord un Point voisin (échange, D-441), puis passe d'emplacement d'élément en emplacement d'élément (B.4). Changement du pas B.4 quand des Points sont présents.
3. **Suppression avec choix de répétition** : le dialogue précède la suppression, appliquée ensuite sans fondu de la carte (le conteneur vidé s'efface toujours lentement). Une suppression animée dont la réécriture finale demanderait un choix (cas limite : brouillon modifié pendant le fondu) garde le début.
4. Noms accessibles des Points de la disposition générale : sans « n sur m » pour des homonymes ni lettre de conteneur ; focus VoiceOver non déplacé après un retrait (annonce seulement).
5. Duplication qui rendrait un Point interdit ou consécutif : refus (`STOP_POINT_CONFLICT`, refus doux de D-441) — impossible en pratique.
6. Suite Jest complète non exécutée ici (à la charge de Hermann) ; aucune vérification sur iPhone.

## À CLARIFIER (classe C)

1. **Libellés du choix pour un Cycle** : ARB-02b demande « la même formulation » que D-442 ; réalisé avec le même dialogue et « Point d'arrêt en début et en fin de répétition » / « Les deux se suivraient entre deux répétitions du cycle. Lequel conserver ? » / « Début de répétition » / « Fin de répétition » / « Annuler » (à valider en recette).
2. **Enveloppe multiple (B.4b) et Point entre les contenus réunis** : le Point garde sa place dans la séquence (D-441) et se retrouve donc dans le nouveau conteneur (Circuit : rencontré à chaque Tour ; Cycle × 1 : sans effet tant que le compte reste 1). Application de D-441 / ARB-06, non écrite pour ce geste : à confirmer.
3. **Début de répétition fonctionnel** : un Point en tête d'un Circuit (N = 1) premier membre d'un Cycle répété, ou en fin d'un Circuit dernier membre, est traité comme début (fin) de répétition du Cycle (exception de RM-219, conflit) — lecture de « début / fin de répétition » comme « aucun Exercice du Cycle avant / après ».
4. **Pas à pas d'un élément** (écart 2) : conserver l'échange avec le Point voisin (ancien modèle) ou le pas d'élément à élément de B.4 ?

## Tests

- `src/domain/sessions/__tests__/layoutStopPoints.b6.test.ts` (25) : RM-219 à tous les niveaux, bornes et conteneurs invalides ; exception de début / fin de répétition d'un Cycle × 2 qui ouvre ou clôt la Séance, × 1 sans exception ; frontières consécutives (Circuit / Circuit d'un Cycle / Cycle), Récupération non séparatrice ; conflit de répétition ; déplacement (Points à leur place, second retiré, interdit retiré, Cycle déplacé avec ses Points, conteneur vidé et ses Points), choix de répétition ; suppression ; duplication avant le Point ; pas à pas (échange avec le Point voisin) ; B.3 vers un Circuit avec Points ; dépose d'un Point (dans un Cycle, refus interdit / occupé / consécutif, choix) ; « Descendre » d'un Point dans un Cycle ; comptes de Cycle (1 → 2 : choix ; 2 → 1 : retrait) et de Circuit ; enveloppe depuis l'ancien modèle à Points, B.4b ; validation (RM-219 refusé, hérité toléré) ; plan D.1 (Point de Cycle × 3 rencontré trois fois, au niveau Séance une fois) ; brouillon modifié.
- `src/domain/sessions/__tests__/layoutPlacement.b6.test.ts` (9) : emplacements de tous les niveaux, Cycle qui clôt la Séance (× 1 / × 2), rangée sous la carte, Point existant et emplacements consécutifs, ajout et confirmation dans un Circuit de Cycle, choix de répétition (ajout jeté / retrait programmé), désélection / resélection refusée, récupération d'un Exercice de Circuit de Cycle, désignations.
- `src/infrastructure/database/__tests__/stopPointsGeneral.b6.test.ts` (2, SQLite réelle) : création, relecture (`cycle_id`, `tour_id`), déplacement d'un Point dans le Cycle, modification, relecture ; RM-219 refusé sans écriture.
- `src/features/sessions/__tests__/CompositionScreen.b6.test.tsx` (7) : Points rendus à tous les niveaux et nommés ; « Descendre » d'un Point ; compte du Cycle ramené à 1 (retrait annoncé) ; placement sur tous les niveaux et ajout confirmé dans le Cycle ; choix « Début / Fin de répétition » ; Point existant désélectionné puis retiré ; zone de récupération d'une carte de Circuit de Cycle.
- Mis à jour (annotations datées) : `layoutMoves.b4/b5`, `layoutOperations.b2/b3/b4b`, `structure.a1/a2`, `CompositionScreen.b1b/b2/b4b/recette1`, `i18n/index.test.ts`.
- Exécutions ciblées (`--maxWorkers=1`, 31/10/2026) : `src/domain/sessions` 26 suites / 693 tests verts ; écrans de Composition B.1b, B.2, B.3, B.4, B.4b, B.5, B.6, recette 1, R7, flux des pauses, dialogue de choix, `compositionLayout`, i18n : 14 suites / 144 tests verts ; `CompositionScreen.test.tsx` 470 / 470 ; persistance et intégration (`stopPointsGeneral.b6`, `cycleMembers.a1`, `seriesPerCircuit.b3`, `elementFormats.c1`, flux d'enregistrement, garde de sortie, édition depuis le Catalogue, `SessionDraftProvider`, `useCompositionExitGuard`) et garde `legacyModeConfinement` : 12 suites / 109 tests verts. `npx tsc --noEmit -p .` et ESLint des fichiers modifiés : sans erreur ni avertissement. Suite complète non exécutée. Le simulacre de Reanimated termine les animations aussitôt ; Jest ne prouve ni le geste ni le rendu sur iPhone.

## Recette iPhone n° 2 (build de développement) — Points d'arrêt et pauses sur toute la structure

Préparer une Séance : E0, E1, E2, E3, E4, E5. Poser un Circuit sur E1 et E2 (Circuit A, 1 tour). Poser un Cycle sur E3 (Cycle, 1 répétition), puis glisser E4 dans le Cycle, après E3 ; poser un Circuit sur E4 (Circuit B, dans le Cycle). E5 reste au niveau Séance, en dernier.

1. **Disponibilité** : « Ajouter un arrêt » est actif. Le toucher : mode Placement ; cartes grisées, en-têtes des Circuits et du Cycle inactifs, Circuits dépliés, barre « Annuler » / « Confirmer » en bas.
2. **Emplacements** : une puce en pointillés sous E0, en tête du Circuit A, entre E1 et E2, sous E2 (fin de tour), après le Circuit A, en tête du Cycle, sous E3, en tête du Circuit B, sous E4, après le Circuit B (fin du Cycle), après le Cycle. Aucune puce avant E0 ni après E5. Chaque carte montre sa zone de récupération.
3. **Ajout dans le Cycle** : toucher la puce sous E3, puis « Confirmer 1 pause ajoutée » : le Point apparaît entre E3 et le Circuit B, dans le fond du Cycle.
4. **Non-consécutivité aux frontières** : rouvrir le placement ; les emplacements voisins du Point sans Exercice entre eux (en tête du Circuit B) ne sont plus proposés.
5. **Répétition du Cycle (ARB-02a)** : passer le Cycle à 2 répétitions ; le Point sous E3 reste en place (il sera rencontré à chaque répétition).
6. **Choix début / fin de répétition (ARB-02b)** : en placement, ajouter un Point en tête du Cycle (avant E3) puis un Point en fin du Cycle (après le Circuit B) : un dialogue « Point d'arrêt en début et en fin de répétition » propose « Début de répétition », « Fin de répétition », « Annuler ». Annuler : rien ne change ; « Fin de répétition » : seul le Point de fin est retenu. Noter les libellés (À CLARIFIER 1).
7. **Compte du Cycle** : avec un Point en tête et un en fin du Cycle à 1 répétition, passer à 2 : le même dialogue s'ouvre avant tout changement ; Annuler laisse le compte à 1.
8. **Fin de répétition en fin de Séance** : supprimer E5 ; avec le Cycle à 2 répétitions, un Point en fin du Cycle est proposé et accepté ; repasser le Cycle à 1 : ce Point disparaît sans message (VoiceOver : « Point d'arrêt retiré »).
9. **Circuit A à 2 tours** : en tête de Circuit A et en fin de tour, même dialogue « Début de tour / Fin de tour » qu'avec un seul Circuit.
10. **Récupération** : en placement, toucher la zone de récupération de E4 (Circuit B, dans le Cycle) : roulette ; valider 20 s ; « Confirmer » ; la carte affiche la récupération ; déplacer E4 hors du Cycle : la récupération la suit.
11. **Glisser un Point** : hors placement, appui long sur un Point du niveau Séance (puce soulevée), glisser dans le Cycle entre E3 et le Circuit B : ligne d'insertion, défilement près des bords ; relâcher : le Point est dans le Cycle. Le déposer juste après le Compte à rebours : refus annoncé, le Point reste en place. Noter la sensation du geste (écart 1).
12. **VoiceOver sur un Point** : actions « Monter » / « Descendre » ; « Descendre » le fait entrer dans le conteneur suivant à la première position permise.
13. **Déplacement d'un Exercice** : avec un Point après E1 (dans le Circuit A), glisser E1 hors du Circuit après E5 : le Point reste à sa place ; s'il devenait voisin d'un autre Point ou juste avant la Fin, il disparaît sans message.
14. **Monter / Descendre d'une carte** (VoiceOver) : avec un Point juste au-dessus d'une carte, « Monter » fait passer la carte au-dessus du Point (À CLARIFIER 4).
15. **Supprimer** : supprimer E3 (Point juste après) : la carte s'efface, le Point reste ou disparaît selon les règles (jamais en tête de Séance ni deux Points de suite) ; dernier membre d'un conteneur : le conteneur s'efface lentement avec ses Points.
16. **Dupliquer** : dupliquer E3 avec un Point juste après : la copie apparaît entre E3 et le Point ; aucun Point copié.
17. **Enveloppe avec Points** : avec un Point entre E0 et E1 au niveau Séance (avant le Circuit A défait au préalable), « Ajouter un circuit » est disponible ; poser un Circuit sur E0 et étendre son périmètre jusqu'à E1 : après « Confirmer », le Point est dans le nouveau Circuit, entre E0 et E1 (À CLARIFIER 2).
18. **Enregistrer et rouvrir** : « Continuer », rouvrir la Séance : tous les Points sont à leur place (niveau Séance, Cycle, Circuit du Cycle).
19. **Quitter sans enregistrer** après avoir seulement ajouté un Point : la garde d'abandon s'affiche.
20. **Séance à un seul Circuit (ancien modèle)** : placement, Points, choix de tour, glisser : comportement inchangé.

## Réponses de Hermann du 31/10/2026

- À CLARIFIER 4 (Monter / Descendre d'une carte) : « Elle franchit d'abord le point d'arrêt » — comportement livré confirmé.
- À CLARIFIER 1 (libellés) : « Remplacer le terme « répétition » par « passage » dans la composition de séance pour le nombre de cycles, et dans le message » — réalisé (fr.ts : en-tête et stepper du Cycle, dialogue).
- À CLARIFIER 2 (point dans une enveloppe) : « a) il entre dans le conteneur » — comportement livré confirmé ; COMP l.64 à lire avec ch07 « B.6 — vocabulaire du Cycle et enveloppe ».

## Recette iPhone n° 2 du 31/10

**Constats de Hermann (verbatim)** :
- b6-glisser : « aucune animation dynamique des autres éléments pour faire de la place mais des traits d'insertion bleus. Par ailleurs, le cercle plein du rail se retrouve sur un rail parallèle au rail. Il y a donc deux rails, l'initial, et la portion d'un autre avec le cercle plein, décalé à droite du premier. »
- b6-recup : « Le déplacement des cartes et des bords d'un circuit se font correctement lorsqu'il n'y a pas de circuit ou qu'un seul. Dès qu'on ajoute un deuxième circuit, ou un premier cycle, […] Tous les éléments sont figés, les conteneurs ont un liseré bleu, un ligne verticale bleue apparaît lorsqu'on approche d'un emplacement. A corriger, il faut conserver les principes d'animation déjà validés. »
- b6-ancien (un seul Circuit) : « Lorsqu'on déplace le point d'arrêt, le cercle plein sur le rail ne se déplace pas en même temps, il apparaît lorsque le point est déposé ».

**Causes** :
1. Glisser d'un Point (et de tout élément) de la disposition générale sans décalage animé, avec cadre et trait bleus : choix de B.4 (voir la spec B.4, même section).
2. « Deux rails » : hors d'un Circuit (niveau Séance, Cycle), la rangée d'un Point n'avait pas le débord des cartes (`exerciseList`, −8 de chaque côté) ; son rail et son point de raccord, posés sur l'axe des médias des cartes dans le repère de la rangée, se trouvaient 8 points à droite du rail des cartes. Même décalage pour les rangées autonomes du placement hors Circuit.
3. Mesure de la rangée d'un Point (disposition générale) relevée sur la rangée intérieure (toujours à 0 dans son enveloppe) : point de saisie faux, destination calculée trop haut.
4. b6-ancien : un Point hors de la chaîne du rail (soulevé, tenu, en retour) ne dessinait aucun rail, point de raccord compris (revue 6.2) ; le point n'était redessiné qu'à la dépose.

**Corrections** :
- Aperçu par décalages de la spec B.4 appliqué au Point : sa place se referme, celle visée s'ouvre, les bords du Circuit ou du Cycle visé / quitté se déplacent ; retour animé après un refus ; mise en place animée après une dépose ; tenu pendant le choix « Début / Fin de passage ».
- Rangée d'un Point hors Circuit (et rangée de placement) : débord des cartes (`layoutStopRowOutset`, −8) — un seul rail.
- Mesure portée par l'enveloppe de la rangée (`composition-layout-stop-point-<id>`), élément de sa liste.
- Point de raccord hors de la chaîne : dessiné sur l'axe du rail et suivant la puce (translation du doigt, puis de la rangée dans le registre pendant le dialogue et le retour) — ancien modèle (b6-ancien) et disposition générale ; aucune queue ni lien. [Revue 6.2 : « ni point de raccord » — remplacé, annotation datée dans le code, le test de l'ancien modèle et `src/features/sessions/README.md`.]

**Synchronisation code / documentation** : classe **B** (demandes explicites de Hermann du 31/10) pour l'animation et le point de raccord — cette spec (écart 1 et « Écran » annotés), spec B.4, README (story 6.2, revue) ; classe **A** pour le rail unique (le rail est sur l'axe des médias des cartes : story 5.2, D-435, CE-T03-08 L1478) et la mesure (anomalie). Aucune règle de placement des Points modifiée (RM-219, RM-251, D-441, D-442, ARB-02 : `layoutStopPoints.ts` inchangé).

**Tests** : `CompositionScreen.recette2.test.tsx` (Point du niveau Séance glissé dans un Circuit : débord −8, point de raccord qui suit la puce, place refermée et rouverte, bords du Circuit, dépose) ; `layoutDragShifts.recette2.test.ts` (Point d'un Cycle vers un Circuit : le Cycle se rétracte, le Circuit s'agrandit) ; `CompositionScreen.test.tsx` (ancien modèle, R2 : point de raccord qui suit la puce ; vérification « aucun rail hors de la chaîne » annotée). Résultats : voir le compte rendu de livraison.

### Recette iPhone n° 3 (à jouer)

1. Disposition générale (deux Circuits ou un Cycle), Point d'arrêt au niveau Séance : **un seul rail**, le point de raccord sur le rail des cartes (plus de rail parallèle à droite) ; idem pour un Point dans un Cycle, et pour les emplacements du placement hors Circuit.
2. Appui long sur ce Point, glisser dans un Circuit entre deux cartes : **ni trait ni cadre** ; les cartes et le bas du Circuit descendent pour faire la place, la place quittée se referme ; le point de raccord suit la puce sur le rail ; relâcher : le Point glisse jusqu'à sa place.
3. Relâcher le Point juste après le Compte à rebours : refus annoncé, retour animé à sa place.
4. Point en tête d'un Cycle × 2 face à un Point de fin : choix « Début / Fin de passage » ; pendant le dialogue le Point reste où il a été lâché ; Annuler : retour en douceur.
5. Séance à un seul Circuit (ancien modèle) : glisser un Point — le point de raccord se déplace avec la puce pendant tout le geste (b6-ancien) ; le reste du comportement est inchangé.

## Recette iPhone n° 2 du 31/10/2026 — lot 3

**Constats de Hermann (verbatim)** :
- b6-deplacer (KO) : « Exercice dans un cycle, avec un point d'arrêt en début de cycle : le déplacement de l'exercice avant le point d'arrêt, mais dans le cycle, est interdit. Par contre, le déplacement du point d'arrêt après l'exercice et à la fin du cycle est autorisé. La situation à la fin est supposée être la même. »
- b6-enveloppe : voir la spec B.4b, même section (cadre continu autour d'un Point en mode enveloppe).
- b6-supprimer : voir la spec B.5, même section (duplication dans un Cycle).

**Cause (b6-deplacer)** : Cycle `[P, E]` ; déposer E « avant P » vise le rang 0 du Cycle, où E est déjà : l'insertion au rang 0 place bien E devant P (convention de `stopPointsAfterInsertion`), mais `moveLayoutItem` ne comparait que l'ordre des ÉLÉMENTS — inchangé — et rendait `UNCHANGED` : retour animé de la carte, perçu comme un refus. De plus, la dépose ne distinguait pas « avant le Point » de « après le Point » (même rang) : la place d'origine de E n'était pas un emplacement.

**Règle appliquée (inchangée)** : RM-219 et RM-251 jugent la situation finale, quelle que soit l'opération ; une même situation finale reçoit le même jugement. Seule diffère la sanction d'un Point devenu interdit ou consécutif : le déplacement autonome d'un Point est refusé (règle stricte, D-441, ARB-06 « selon les règles applicables à sa position de destination ») ; le déplacement d'un Exercice est appliqué et le Point retiré sans message (règle tolérante, D-442). Dans le cas de Hermann, la situation finale (`[E, P]`, Point en fin de Cycle) est autorisée : les deux opérations l'appliquent.

**Corrections** (classe A ; `layoutStopPoints.ts` : aucune règle modifiée) :
- `moveLayoutItem` : `UNCHANGED` seulement si les éléments ET les emplacements des Points sont inchangés (`sameLayout`) [B.4 : « mêmes éléments → UNCHANGED » — remplacé].
- `LayoutDestination.afterStopPoints` : insertion après les Points du rang (`attach`, `stopPointsAfterInsertion`).
- `layoutDrop.ts` : un rang qui porte des Points offre à un Exercice, un Circuit ou un Cycle saisi deux emplacements — avant eux (au-dessus du premier Point ; la place s'ouvre au-dessus du Point) et après eux (sous le dernier ; le Point reste en place) ; un Point saisi n'en a qu'un (inchangé).

**Synchronisation code / documentation** : classe **A** (anomalie ; RM-219, RM-251, D-441, D-442, ARB-02 inchangés) — cette spec ; ch07 section « Recette iPhone n° 2 du 31/10/2026 — lot 3 » (constat et règle expliquée) ; commentaires de `layoutMoves.ts`, `layoutTree.ts`, `layoutDrop.ts` annotés.

**Tests** : `layoutMoves.recette2.test.ts` (Exercice devant le Point de tête : appliqué, même situation que le déplacement du Point ; déposé après le Point : inchangé ; au niveau Séance, avant / après le Point ; Point de fin interdit : refus du Point, retrait tolérant pour l'Exercice) ; `layoutDrop.recette2.test.ts` (3 : emplacements avant / après, doigt au-dessus / au-dessous, entre deux membres).

**À vérifier sur iPhone** : Cycle `[P, E]` — glisser E au-dessus du Point : le Point descend pendant le geste, E se pose devant lui ; relâcher E sous le Point : retour à sa place, rien ne change.

[31/10/2026, contre-recette n° 3 (b6-deplacer KO pour le Circuit) : seul Exercice d'un Circuit qui porte un Point — emplacements « avant » / « après » le Point offerts comme dans un Cycle ; « Monter » / « Descendre » s'arrêtent aussi avant et après les Points d'un rang (`[P, A, B]`, B monte : `[P, B, A]`, puis franchit P). Classe A, règles inchangées ; voir `spec-recette-2-corrections-composition.md`, « Contre-recette n° 3 ».]
