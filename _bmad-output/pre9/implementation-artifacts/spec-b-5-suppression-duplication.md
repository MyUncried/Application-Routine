# B.5 — Suppression et duplication

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.5 (dépend de B.2 ; arbitrages ARB-08, ARB-17, décidés). Branche `pre9-bmad/dev`, départ `d4182be8`. Aucune migration, aucun changement Figma (aucune lecture nécessaire : actions glissées et mouvements repris de l'ancien modèle), `tokens.ts` inchangé (constantes locales).

## Sources appliquées

| Source | Passage appliqué |
|---|---|
| epics § B.5 | « Suppression d'un Exercice (dernier membre : conteneur retiré ; points d'arrêt devenus interdits retirés sans message) ; duplication d'un Exercice (D-441), Format et paramètres conservés pour un Exercice formaté (ARB-17). » ; « Pas de duplication de Circuit ni de Cycle dans PRE-9 (ARB-08). » |
| epics § B.5 et ch07 « Retrait d'un Circuit — précision de Hermann du 30/10/2026 » | « Circuit : l'apparition et la disparition du circuit doivent se faire progressivement et plus lentement » — « la disparition vise aussi le retrait d'un Circuit de la Séance (« b) et ok pour le traiter en B.4 / B.5 ») : effacement progressif et lent du Circuit retiré, puis remontée douce des éléments suivants. Réalisation : stories B.4 / B.5. » |
| COMP §1 (`docs/KODJO-Composition-conteneurs-2026-10-28.md`) | « Un conteneur à un membre est conservé. Il disparaît lorsque son dernier membre en sort. » ; tableau D-451. |
| ch07 ARB-08 (l.1163) | « Pas de duplication de Circuit ni de Cycle dans PRE-9. » |
| ch07 ARB-16, ARB-17 (l.1155) ; ch09 l.596 | « Insérer un élément formaté dans une autre Séance, ou le dupliquer, conserve son Format et ses paramètres. » ; correction C.1 du 30/10 : « Format et réglages appartiennent à l'Exercice […] aucun Format transmis aux membres. » |
| D-441 (arbitrage du 22/10/2026, `duplicateOccurrenceOutcome`) | La copie est insérée juste après la source ; aucun Point n'est copié ; récupération copiée. |
| D-442 (ch07 l.127, recette J6 du 22/10) | « la suppression est appliquée et les Points en cause sont retirés sans message ». |
| D-443 / story 7.7 (`compositionMotion.ts`, j6c-4) | Fondu de disparition de 450 ms, glissement des suivantes à partir de 200 ms en 320 ms ; « la copie de Dupliquer apparaît en fondu de 450 ms pendant que les éléments suivants glissent (320 ms) ». |
| Correction Format du 30/10 (spec C.1) | Format porté par l'Exercice seul ; la copie garde le Format et les réglages de l'Exercice ; rien n'est transmis. |
| ch13 CE Composition (l.1862) | « Alternatives accessibles au drag/swipe » : « Dupliquer » / « Supprimer » en actions accessibles. |

## Réalisé

**Domaine** (`src/domain/sessions/layoutMoves.ts`, section B.5) :
- `removeLayoutExercise(draft, exerciseId, newContainerId)` : retire l'Exercice où qu'il soit (niveau Séance, Exercice direct d'un Cycle, Circuit de la Séance ou d'un Cycle) ; conteneurs vidés retirés — Circuit, puis Cycle devenu vide (`removedContainers`, même `pruneEmpty` que B.4) ; réserve de séries du Circuit quitté retirée (`settleLayoutCircuitMembership`) ; autres Exercices inchangés (même référence). Séance redevenue représentable dans l'ancien modèle : zones réécrites (`withLayout`). Aucune confirmation (D-442 amendée : toujours appliquée).
- `duplicateLayoutExercise(draft, exerciseId, newId, newContainerId)` : copie (`duplicateActivity` : même Mouvement, numéro de copie, paramètres indépendants, récupération, **Format et réglages conservés**) insérée **juste après la source dans le même conteneur** ; Circuit alterné : la copie garde le nombre de séries de sa source (déjà à N) et reçoit sa réserve (`copyCircuitReserveEntry`) ; rien n'est transmis aux autres éléments ; identifiant de copie déjà pris : exception (convention de `duplicateOccurrenceOutcome`).
- **ARB-08** : aucune opération de duplication de Circuit ni de Cycle (un identifiant de conteneur est refusé, `NOT_FOUND`).
- Points d'arrêt : refus `STOP_POINTS` si la disposition en porte — elle est alors dans l'ancien modèle (aucune disposition générale n'en porte avant B.6), où les opérations historiques s'appliquent.

**Écran** (`CompositionScreen.tsx`, `LayoutDragParts.tsx`) — disposition générale (plusieurs Circuits, ou un Cycle) :
- Cartes : **balayage gauche** révélant « Dupliquer » / « Supprimer » (même composant, même geste et mêmes règles que l'ancien modèle : une carte ouverte à la fois, les autres bloquées, appui court neutre sur la carte ouverte, balayage droit pour fermer) ; actions accessibles « Dupliquer » / « Supprimer » ajoutées à « Monter » / « Descendre ». Inactifs en mode enveloppe et pendant un dialogue (mêmes conditions que le glisser B.4). Le balayage découvre le fond du conteneur (rangée transparente, B.1b).
- En-têtes de Circuit et de Cycle : **aucune** action de duplication ni de suppression (ARB-08).
- **Supprimer, membre parmi d'autres** : la carte s'efface en fondu (450 ms), sa place se referme à partir de 200 ms (320 ms) et les éléments suivants remontent (`CardMotionBlock`, durées et courbes de l'ancien modèle) ; brouillon écrit à la fin (comme l'ancien modèle) ; `flushDeletion` l'écrit aussitôt avant l'enregistrement, à la perte du premier plan, à l'entrée en placement / enveloppe ; aucun glisser, ni autre suppression / duplication pendant ce temps.
- **Supprimer le dernier membre** (Circuit, et Cycle vidé par ce retrait) : brouillon écrit aussitôt ; le conteneur, rendu tel qu'avant **avec sa carte**, s'efface lentement à sa place puis sa place se referme (`VanishingBlock` de B.4 : 900 ms puis 700 ms), les éléments suivants remontent sans saut ; inerte et caché à VoiceOver pendant ce temps.
- **Dupliquer** : brouillon écrit aussitôt ; la copie apparaît juste après sa source : sa place s'ouvre (320 ms) pendant qu'elle apparaît en fondu (450 ms).
- **« Réduire les animations »** : suppression et duplication appliquées immédiatement, sans effacement ni apparition.
- L'ancien modèle (un seul Circuit au niveau Séance, sans Cycle) garde ses actions historiques (D-441, D-442 : Points devenus interdits ou consécutifs retirés sans message, choix « Début de tour / Fin de tour »), inchangées.

## Synchronisation code / documentation

- **Classe A** : suppression (conteneur vidé retiré, COMP §1), duplication juste après la source (D-441), Format et réglages conservés (ARB-17, correction C.1), aucune duplication de Circuit / Cycle (ARB-08), actions accessibles (ch13 l.1862), mouvements de carte (D-442, D-443 / story 7.7) — règles écrites, citées ci-dessus.
- **Classe B (déjà décidée, déjà écrite)** : retrait progressif d'un Circuit (ch07 « Retrait d'un Circuit — précision de Hermann du 30/10/2026 ») — réalisé pour la suppression du dernier membre dans la disposition générale. Aucune nouvelle règle : aucune source normative à modifier.
- **Classe C** : voir « À CLARIFIER ».
- **Classe D** : `CardMotionBlock` (enveloppe toujours présente pour ne pas remonter la carte), mesure de la carte d'un Circuit = position de l'enveloppe + position dans l'enveloppe, `vanishingContainers(…, keepMembers)`.
- **Documents mis à jour** : aucun (A / B déjà écrite). Recherche ciblée des formulations contraires (« Dupliquer », « duplication », « ARB-08 », « ARB-17 », « Retrait d'un Circuit » dans `docs/`) : aucune formulation contraire trouvée.
- **Code et tests annotés (texte d'origine conservé, annotation datée)** : commentaires de `CompositionActivityRow` (« le balayage (Dupliquer / Supprimer) reste réservé à B.5 », « ni duplication ni suppression (B.5) ») et de `LayoutSequence` ; tests `CompositionScreen.b1b.test.tsx` (« ni balayage, ni Dupliquer / Supprimer » → actions présentes) et `CompositionScreen.b4.test.tsx` (`["moveDown"]` → `["moveDown", "duplicate", "delete"]`).

## Écarts et reports

1. **Ancien modèle (un seul Circuit, sans Cycle) : suppression du dernier membre du Circuit** — comportement historique conservé : la carte s'efface (D-442), puis le cadre du Circuit disparaît sans effacement lent. La précision de Hermann du 30/10 (« retrait d'un Circuit de la Séance ») peut viser aussi ce cas ; le rendu historique (registre de translations, zones) n'a pas de mécanisme d'effacement de conteneur, et basculer vers le rendu par structure le temps de l'effacement changerait le rendu au début du geste. **Décision attendue** (voir À CLARIFIER 1).
2. **Points d'arrêt en structure générale** : aucun avant B.6. La règle « points d'arrêt devenus interdits retirés sans message » s'applique là où ils existent (ancien modèle, inchangé). **Reste pour B.6** : à la suppression d'un Exercice de la structure générale, évaluer RM-219 / RM-251 / D-441 / D-442 sur la séquence de toute la structure (frontières de chaque conteneur, Cycle répété) et retirer sans message les Points devenus interdits ou consécutifs (le premier conservé), choix de Tour le cas échéant ; à la duplication, copie insérée avant le Point qui suivait la source, aucun Point copié (D-441).
3. Pas d'annonce VoiceOver propre après une suppression ou une duplication en disposition générale (l'ancien modèle n'annonce que les Points retirés) ; focus non déplacé.

## À CLARIFIER (classe C)

1. **Circuit unique de l'ancien modèle** : son dernier membre supprimé doit-il aussi faire disparaître le Circuit lentement (900 + 700 ms) ? (Écart 1.)
2. **Conteneur effacé avec sa carte** : à la suppression du dernier membre, le Circuit (ou le Cycle) s'efface avec la carte supprimée encore visible (un seul effacement lent), au lieu d'un fondu de la carte puis du conteneur vide (≈ 2 s). À valider en recette.
3. **Durées de la carte** : celles de l'ancien modèle (450 / 200 + 320 ms) ; copie : ouverture 320 ms et fondu 450 ms simultanés (l'ancien modèle fait glisser les suivantes par translations ; ici la place s'ouvre).

## Tests

- `src/domain/sessions/__tests__/layoutMoves.b5.test.ts` (16) : suppression d'un membre (Circuit conservé), d'un Exercice direct de la Séance et d'un Cycle ; dernier membre d'un Circuit de la Séance (Circuit retiré) ; dernier membre d'un Circuit de Cycle gardant d'autres membres (Circuit seul retiré) ; dernier membre du seul Circuit d'un Cycle (Circuit puis Cycle retirés) ; dernier Exercice direct d'un Cycle (Cycle retiré) ; réserve retirée, autres Exercices inchangés (Format non touché) ; retour à l'ancien modèle ; inconnu ; Points d'arrêt ; duplication dans un Circuit groupé, au niveau Séance, Exercice direct d'un Cycle, Circuit alterné d'un Cycle (N et réserve) ; Exercice formaté (Format et réglages conservés, paramètres indépendants, rien transmis) ; inconnu / identifiant pris ; ARB-08 (aucune duplication de conteneur exposée ni acceptée).
- `src/features/sessions/__tests__/CompositionScreen.b5.test.tsx` (8) : balayage gauche (actions révélées, une carte à la fois, appui court neutre) ; actions accessibles sur les cartes, aucune sur les en-têtes (ARB-08) ; suppression d'un membre (carte inerte et cachée pendant l'effacement, brouillon écrit à la fin) ; dernier membre d'un Circuit (brouillon écrit, Circuit effacé avec sa carte, puis démonté) ; dernier membre du seul Circuit d'un Cycle (Cycle effacé) ; duplication dans un Circuit alterné (copie juste après, N conservé, apparition) ; Exercice formaté dupliqué ; « Réduire les animations » (aucun effacement, écrit aussitôt).
- Mis à jour : `CompositionScreen.b1b.test.tsx`, `CompositionScreen.b4.test.tsx` (annotations datées).
- Exécutions ciblées (`--maxWorkers=1`) : voir le compte rendu de livraison. Suite complète non exécutée ici. Aucune vérification sur iPhone ; le simulacre de Reanimated termine les animations aussitôt (Jest ne prouve ni durées ni rendu).

## Recette iPhone (build de développement)

Préparer une Séance : E0, E1, E2, E3, E4 ; poser un Circuit sur E1 et E2 (Circuit A), un Circuit sur E3 (Circuit B) ; passer B en « alternées », 2 tours ; poser un Cycle sur le Circuit B.
1. Balayer vers la gauche la carte E1 : « Dupliquer » et « Supprimer » apparaissent progressivement derrière la carte, sur le fond du Circuit ; toucher une autre carte : rien ne se passe ; balayer E1 vers la droite : les actions se referment.
2. Sur E1, « Dupliquer » : la copie de E1 (avec son suffixe de copie) apparaît juste sous E1, dans le Circuit A, en fondu lent, les cartes suivantes descendent en douceur.
3. Sur E3 (Circuit B alterné, dans le Cycle), « Dupliquer » : la copie est dans le Circuit B, juste après E3, avec 2 séries.
4. Donner un Format à un Exercice (si disponible), le dupliquer : la copie garde le même Format et ses réglages ; les autres Exercices sont inchangés.
5. Sur la copie de E1, « Supprimer » : la carte s'efface en fondu, puis sa place se referme et les cartes suivantes remontent sans saut.
6. Supprimer la copie de E3, puis E3 (dernier membre du Circuit B, seul membre du Cycle) : le Cycle et son Circuit s'effacent lentement (≈ 1 s) à leur place, puis les éléments suivants remontent en douceur.
7. Supprimer E2 puis E1 (Circuit A) : à la suppression de E1, dernier membre, le Circuit A s'efface lentement avec la carte, puis la liste remonte.
8. Appui long sur l'en-tête d'un Circuit ou le titre d'un Cycle, et balayage sur ces en-têtes : aucune action « Dupliquer » ni « Supprimer ».
9. VoiceOver : sur une carte, actions « Monter », « Descendre », « Dupliquer », « Supprimer » ; « Supprimer » retire la carte ; sur un en-tête de Circuit ou de Cycle, ni « Dupliquer » ni « Supprimer ».
10. « Réduire les animations » activé : suppression et duplication immédiates, sans fondu ni effacement.
11. Pendant l'effacement d'une carte, toucher « Continuer » : la suppression est écrite, un second toucher enregistre.
12. Séance à un seul Circuit (ancien modèle) : balayage, Dupliquer, Supprimer inchangés (Points d'arrêt retirés sans message si besoin) ; noter si le Circuit vidé doit s'effacer lentement (À CLARIFIER 1).

## Recette iPhone n° 2 du 31/10/2026 — lot 3

**Constat de Hermann (verbatim, b6-supprimer)** : « Exercice dans un cycle avec un point d'arrêt à la fin du cycle, un deuxième exercice après le cycle : dupliquer l'exercice le positionne sur le point d'arrêt, les deux se chevauchent. Le cadre du cycle ne s'allonge pas, et la copie de l'exercice se retrouve aussi à cheval avec l'exercice après le cycle. »

**Cause (déduite du code ; Jest ne joue ni la mesure native ni l'animation)** : `CardMotionBlock` (copie qui apparaît) lançait l'ouverture de sa place au montage, sur le fil UI, avant de connaître sa hauteur (mesure `onLayout` rapportée au fil JS, en retard quand l'écran est chargé — écriture du brouillon et rendu de toute la disposition) : la hauteur bornée restait 0 pendant l'ouverture ; à la fin, `maxHeight: undefined` n'est pas appliqué par Reanimated (la dernière valeur, 0, reste). La découpe retirée à la fin du fondu, la copie, dans une place de hauteur nulle, débordait sur le Point et sur l'élément suivant ; le Cycle ne s'agrandissait pas. Le registre des décalages du lot 1 n'intervient pas (aucun glisser).

**Correction** (classe A : D-441, D-443, B.5 « la place s'ouvre ») : l'ouverture de la place de la copie attend sa hauteur mesurée ; au repos, hauteur libre explicite (`CARD_MOTION_UNCONSTRAINED_HEIGHT`) au lieu de `undefined`. Domaine inchangé (copie avant le Point qui suivait la source).

**Synchronisation** : classe **A** ; aucune règle modifiée ; commentaire de `CardMotionBlock` annoté ; ch07 section « Recette iPhone n° 2 du 31/10/2026 — lot 3 ».

**Tests** : `CompositionScreen.b5.test.tsx` (inchangé) ; `layoutMoves.recette2.test.ts` (duplication de chaque Exercice : aucun conteneur vide).

**À vérifier sur iPhone** : Cycle `[E, P]` puis E2 — dupliquer E : la copie apparaît entre E et P, le Cycle s'agrandit, P et E2 descendent, aucun chevauchement ; idem au niveau Séance et dans un Circuit.
