# B.4 — Glisser-déposer entre conteneurs et défilement

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.4 (dépend de B.2 ; arbitrages ARB-06, ARB-09, ARB-24, décidés). Branche `pre9-bmad/dev`, départ `fd22d991`. Aucune migration, aucun changement Figma, `tokens.ts` inchangé (constantes locales). Développement concurrent d'A.2b dans le même arbre : fichiers d'A.2b non touchés.

## Sources appliquées

| Source | Passage appliqué |
|---|---|
| COMP §1 (`docs/KODJO-Composition-conteneurs-2026-10-28.md`) | « Un conteneur naît autour de membres existants, jamais vide. Un conteneur à un membre est conservé. Il disparaît lorsque son dernier membre en sort. » ; tableau D-451 (Séance : Exercices, Circuits, Cycles ; Cycle : Exercices directs et Circuits ; Circuit : Exercices) ; « Aucun cycle dans un cycle, aucun circuit dans un circuit ». |
| COMP §6 (G1–G8) | « Appui long, déplacement, arrêt sur l'emplacement visé, relâchement. Un exercice change de circuit, de cycle ou de niveau séance […]. Un circuit replié se déplace entre cycles ou vers la séance. Un appui long sur l'en-tête d'un circuit déployé commence par le replier puis amorce son déplacement. » ; « L'éclairage de la destination est obligatoire, particulièrement à la frontière dedans/dehors. […] Le départ du dernier membre entraîne la disparition du conteneur. » ; « confirmation en cas de perte, Annuler conserve emplacement et données d'origine, Confirmer réalise déplacement et adaptation ensemble […] La disparition du conteneur source vidé appartient à l'application effective du déplacement. » |
| COMP §7 (CS-D1–CS-D8) | Voir « Écarts » : CS-D1 et CS-D7 tenus ; en-têtes collantes non réalisées. |
| ARB-06 / D-04 | « Il peut ensuite déplacer d'autres contenus dans ce conteneur par glisser-déposer. Ces contenus peuvent provenir de positions non contiguës et de conteneurs différents. Un point d'arrêt peut également être déplacé dans le conteneur, selon les règles applicables à sa position de destination. » ; D-04 : « ni Circuit dans Circuit, ni Cycle dans Cycle ». |
| ARB-09 | « Déplacement d'un Cycle entier autorisé, avec le même geste de glisser-déposer ». |
| ARB-24, D-05, D-12, D-26, §2.4 (Arbitrages consolidés du 30/10, `origin/main`) | Contrôle avant toute mutation ; « Exercice formaté dans un Circuit : conserver Format et réglages propres ; valider la compatibilité […] avant toute mutation. Les combinaisons non compatibles sont refusées sans altération » ; « Une simple dépose d'un Exercice déjà formaté ne provoque aucune adoption » ; « Un Circuit n'a aucun Format à transmettre ». |
| spec C.1 « Correction du 30/10 » (Hermann) | Format porté par l'Exercice seul ; aucun Format transmis à la dépose ; « Circuit formaté » du texte de la story : obsolète. |
| B.3 (`spec-b-3-…`) | `settleLayoutCircuitMembership`, `formattedMemberFits` (matrice D-16), adaptation au N d'un Circuit alterné avec confirmation : réutilisés comme contrôle de dépose. |
| ch07 « Retrait d'un Circuit — précision de Hermann du 30/10/2026 » ; epics B.5 | « effacement progressif et lent du Circuit retiré, puis remontée douce des éléments suivants. Réalisation : stories B.4 / B.5. » |
| ch13 CE Composition (l.1817, l.1838, l.1862) | Défilement automatique pendant le glisser ; « dépose interdite refusée sans modification » ; « Alternatives accessibles au drag/swipe » ; « annonce de la raison d'un refus de dépose ». |

## Réalisé

**Domaine** (`src/domain/sessions/layoutMoves.ts`, nouveau) :
- `moveLayoutItem(draft, source, destination, newId, control?)` : déplacement d'un Exercice, d'un Circuit ou d'un Cycle entier vers un rang du niveau Séance, d'un Cycle ou d'un Circuit (rang compté sans l'élément déplacé). Issues : `APPLIED` (brouillon + conteneurs vidés retirés `removedContainers`), `CONFIRMATION_REQUIRED` (pertes de séries, brouillon proposé à écrire après « Confirmer »), `UNCHANGED`, `REFUSED` (`NOT_FOUND`, `NESTING`, `FORMAT_INCOMPATIBLE`, `STOP_POINTS`, `CONTROL`, `AT_BOUNDARY`).
- Imbrication D-451 : Circuit → Séance ou Cycle seulement ; Cycle → Séance seulement ; sinon `NESTING`, sans altération.
- Conteneurs vidés retirés à l'application (Circuit, puis Cycle devenu vide).
- Entrée en Circuit alterné et Exercices formatés : `settleLayoutCircuitMembership` (B.3) — adaptation à N, confirmation si et seulement si perte, refus de la matrice §2.2 ; Format et réglages de l'Exercice conservés, aucun Format transmis (le Circuit n'en a pas).
- **Point d'appel du contrôle avant dépose** (`LayoutDropControl`, ARB-24) : appelé après les règles de structure et l'adaptation, avant toute écriture, avec brouillon avant / après ; `ACCEPTED` / `CONFIRM` / `REFUSED`. Neutre (`neutralDropControl`) en B.4 ; l'écran l'appelle via `LAYOUT_DROP_CONTROL`, où C.4 branchera ses règles.
- **`stepOccurrence` généralisé** : `layoutSlots` (emplacements admis dans l'ordre d'affichage) et `stepLayoutItem` (« Monter » / « Descendre ») : à la frontière d'un conteneur, l'élément en sort ou y entre (en fin en montant, en tête en descendant), comme entre les zones avant / dans / après de l'ancien modèle ; `stepOccurrence` lui-même est inchangé pour l'ancien modèle.
- `moveExerciseToCircuit` (B.3) conservé tel quel (tests B.3 inchangés).

**Écran** (`CompositionScreen.tsx`, `layoutDrop.ts` et `LayoutDragParts.tsx` nouveaux, `CircuitHeader.tsx`, `CycleHeader.tsx`, `compositionLayout.ts`) — disposition générale seulement (plusieurs Circuits, ou un Cycle) :
- Saisie : appui long sur une carte (G1–G5, même primitive `Pressable` et même répondeur que l'ancien glisser ; balayage Dupliquer / Supprimer toujours inactif, B.5) ; sur le nom / chevron d'un Circuit (G6–G8) — **un Circuit déployé est replié au début du geste** ; sur le titre d'un Cycle (ARB-09).
- Pendant le geste : mise en page figée, l'élément suit le doigt au premier plan (ombre de la carte soulevée), défilement de l'utilisateur neutralisé, **défilement automatique** près des bords (`useDragAutoScroll`, inchangé) ; destination = emplacement admis le plus proche du point de saisie (`resolveLayoutDrop`, mesures `onLayout` rapportées dans le repère du contenu) ; **éclairage** : cadre plein `color/primary` + voile de la désignation d'enveloppe sur le Circuit ou le Cycle visé, et repère d'insertion (trait `color/primary` de 3 pt) à l'emplacement, y compris au niveau Séance.
- Relâchement : `moveLayoutItem` ; refus → aucune modification, raison annoncée à VoiceOver ; perte → dialogue existant `CircuitEntryConfirmModal` (« MOVE ») ; Annuler : rien ne change ; Confirmer : déplacement rejoué sur le brouillon courant, adaptation comprise.
- **Retrait progressif du conteneur vidé** (précision de Hermann du 30/10) : le Circuit (ou Cycle) vidé reste rendu à sa place, inerte, en fondu jusqu'à transparence (**900 ms**, durée du repli `CIRCUIT_HIDE_DURATION_MS`), PUIS sa place se referme (hauteur et écart qui le suit, **700 ms**, durée du déploiement `CIRCUIT_REVEAL_DURATION_MS`) : les éléments suivants remontent sans saut ; courbe `bezier(0.4, 0, 0.2, 1)` du Circuit ; « Réduire les animations » : immédiat. Le brouillon est écrit dès le relâchement. Si la Séance redevient représentable dans l'ancien modèle (dernier membre d'un second Circuit sorti), le rendu par structure est conservé le temps de l'effacement, puis le rendu historique reprend.
- Accessibilité : « Monter » / « Descendre » sur les cartes (et le nom d'un Circuit, le titre d'un Cycle) via `stepLayoutItem`, absents à la frontière de la séquence.
- L'ancien modèle (un seul Circuit au niveau Séance, sans Cycle) garde son glisser historique (cartes, Points d'arrêt, `stepOccurrence`), inchangé.

## Synchronisation code / documentation

- **Classe A** : G1–G8, conteneur vidé retiré, éclairage, défilement automatique, imbrication D-451, adaptation N avec confirmation, refus sans altération, Format conservé sans transmission, `stepOccurrence` généralisé — règles écrites (COMP §1, §6 ; ARB-06, ARB-09, ARB-24 ; D-04, D-05, D-12, D-26, §2.4 ; correction C.1 du 30/10 ; ch13 l.1817, l.1838, l.1862).
- **Classe B (déjà décidée)** : retrait progressif d'un Circuit (ch07 « Retrait d'un Circuit — précision de Hermann du 30/10/2026 ») — réalisé pour les déposes ; B.5 réutilisera `VanishingBlock` pour la suppression.
- **Classe C** : voir « À CLARIFIER » (rendus choisis, durées).
- **Classe D** : `layoutDrop.ts` (résolution par emplacement le plus proche), `useBlockDragGesture`, `resolveRichLayout(…, force)`.
- **Document mis à jour (formulation contredite, annotation datée, texte d'origine conservé)** : COMP §6 l.72 « Aucun geste de déplacement d'un cycle entier n'est spécifié dans G1–G8. » → « [29/10/2026, ARB-09 (registre ch07 « Arbitrages PRE-9 ») : déplacement d'un cycle entier autorisé, par le même geste de glisser-déposer, au niveau de la séance (aucun cycle dans un cycle) ; réalisé par PRE-9 B.4 le 31/10/2026.] » (le plan de révision 1 prévoyait cette annotation, absente du fichier).
- ch07 non modifié par B.4 (fichier en cours de modification par la session A.2b) ; la réalisation du retrait progressif est consignée ici.
- Test existant mis à jour, annotation datée : `CompositionScreen.b1b.test.tsx` « gestes non disponibles (B.4, B.5, B.6) » → glisser et « Monter » / « Descendre » désormais présents ; balayage et placement toujours absents.
- Textes ajoutés (`fr.ts`, `composition.layoutMove.refused`) : annonces VoiceOver des refus, formulations à valider.

## Écarts et reports

1. **En-têtes collantes CS-D2–CS-D6, CS-D8 non réalisées.** Aucun mécanisme d'en-tête collante n'existe dans le code (ni pour l'ancien Circuit) ; leur réalisation (superposition mesurée, relève par poussée, deux niveaux, commandes actives, repli sous le doigt, scroll applicatif sous la zone collante) est un chantier de rendu distinct du glisser. CS-D1 (tout défile, rien n'est collé en bas) et CS-D7 (aucune en-tête collée pendant un déplacement) sont tenus de fait. **Décision attendue** : story dédiée (proposée « B.4c — en-têtes collantes ») ou rattachement à B.6 / Q.1.
2. **Points d'arrêt et conteneurs** : une disposition générale n'accepte aucun Point d'arrêt avant B.6 (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) ; tout déplacement de structure générale sur un brouillon qui en porte est refusé sans altération (`STOP_POINTS`). Dans l'ancien modèle, le glisser d'un Point dans le Circuit (tête comprise, D-442) existe déjà. Dépose d'un Point dans un Cycle ou un Circuit de la structure générale : **B.6**.
3. **Ancien modèle (un Circuit, sans Cycle)** : l'en-tête du Circuit unique n'est pas saisissable (le déplacer parmi les Exercices directs revient à déplacer ces Exercices, déjà possible). À ouvrir si Hermann le demande.
4. **Confirmation demandée par le seul contrôle avant dépose** (C.4) : aucun dialogue en B.4 (contrôle neutre, jamais atteint) ; l'écran refuse sans modification d'ici là. C.4 fournira le dialogue et les règles.
5. Pas de décalage animé des voisins pendant le glisser (contrairement à l'ancien modèle) : la destination est montrée par l'éclairage et le repère d'insertion.

## À CLARIFIER (classe C)

1. **Rendu de l'éclairage** (Figma muet sur le survol, COMP §8) : cadre plein bleu 2 pt + voile lavande (celui de la désignation d'enveloppe) sur le conteneur visé ; trait bleu de 3 pt à l'emplacement. À valider en recette.
2. **Durées du retrait** : 900 ms de fondu puis 700 ms de fermeture (≈ 1,6 s), valeurs de conception alignées sur le repli / déploiement du Circuit.
3. **Copie en effacement** : le conteneur vidé s'efface avec son en-tête « vidé » (sans cartes, sans lettre, durée nulle) ; alternative : figer son dernier rendu.
4. **Saisie d'un Cycle** : appui long sur son titre « Cycle [A] » (pas sur le compteur) ; **Circuit** : sur son nom / chevron (l'appui court replie toujours).
5. **Un Circuit replié reçoit un Exercice** à sa fin (repère au milieu du Circuit) ; il se déplie alors (règle B.1b : un Circuit dont le contenu change se déplie).
6. Annonces VoiceOver des refus (formulations).

## Tests

- `src/domain/sessions/__tests__/layoutMoves.b4.test.ts` (22) : G1–G5 (Séance → Circuit à un rang, non contigu ; Circuit → autre Circuit ; Séance ↔ Cycle ; Circuit de Cycle → Séance avec Circuit vidé retiré ; un membre restant conservé ; réordonnancement ; identité conservée) ; Circuit vers Cycle et vers Séance, Cycle vidé retiré, Cycle entier ; imbrications refusées ; inconnu, Points d'arrêt ; Circuit alterné avec perte (confirmation, brouillon d'origine intact) et sans perte (extension) ; Exercice formaté : Format et réglages conservés, aucun Format transmis ; refus de la matrice (AMRAP, Tabata ≠ 8) ; point d'appel du contrôle (confirmation, refus, appel) ; retour à l'ancien modèle ; pas à pas (emplacements, entrée / sortie de Circuit, seul membre, bornes, Circuit, Cycle, perte).
- `src/features/sessions/__tests__/layoutDrop.b4.test.ts` (5) : emplacements par nature saisie, ordonnées, plus proche, Circuit replié.
- `src/features/sessions/__tests__/CompositionScreen.b4.test.tsx` (7) : dépose d'un Exercice dans un Circuit avec éclairage et repère, rien d'écrit avant le relâchement, défilement neutralisé puis rétabli ; dernier membre sorti → Circuit en effacement à sa place, puis démonté ; perte → dialogue, Annuler sans modification, Confirmer avec adaptation ; Exercice formaté incompatible → refus annoncé sans modification ; Circuit déployé saisi → replié, aucune destination dans un Circuit, déposé au niveau Séance ; Cycle entier ; « Monter » / « Descendre ».
- `CompositionScreen.b1b.test.tsx` mis à jour (voir ci-dessus).
- Exécutions ciblées (`--maxWorkers=1`) : voir le compte rendu de livraison. Suite complète non exécutée ici. Aucune vérification sur iPhone.

## Recette iPhone (build de développement)

Préparer une Séance à deux Circuits : E0, E1, E2, E3 ; poser un Circuit sur E1 (Circuit A), puis un Circuit sur E3 (Circuit B) ; passer B en « alternées », 2 tours ; donner 3 séries à E0.
1. Appui long sur la carte E2, glisser vers le milieu du Circuit A : la carte suit le doigt, le Circuit A est encadré en bleu avec un trait d'insertion ; relâcher : E2 entre dans A à cet endroit.
2. Glisser E2 hors de A, juste sous son bord : trait d'insertion hors du Circuit, A non encadré ; relâcher : E2 au niveau de la Séance.
3. Glisser E0 (3 séries) dans B (alterné, 2 tours) : dialogue de perte ; Annuler : rien ne change ; recommencer, Confirmer : E0 dans B avec 2 séries.
4. Glisser E3 (seul membre initial de B s'il est resté seul, sinon sortir tous les membres) hors de B : B s'efface lentement à sa place (≈ 1 s), puis les éléments suivants remontent en douceur, sans saut.
5. Avec un Cycle (poser un Cycle sur un Circuit) : glisser une carte dans le Cycle (Exercice direct), puis la ressortir ; glisser un Circuit (appui long sur « Circuit A ») : s'il est déployé, il se replie d'abord ; le déposer dans le Cycle, puis hors du Cycle ; essayer de le lâcher dans un autre Circuit : impossible (aucun encadrement de Circuit).
6. Appui long sur le titre « Cycle » : le Cycle entier suit le doigt ; le déposer après le dernier Exercice : comptes et membres conservés.
7. Pendant un glisser, amener l'élément près du haut ou du bas de l'écran : la liste défile ; elle s'arrête hors du bord et au relâchement.
8. Appui court sur une carte : ouverture en modification (inchangé) ; balayage gauche : aucune action (B.5).
9. VoiceOver : sur une carte, actions « Monter » / « Descendre » ; à la frontière d'un Circuit, l'Exercice en sort ou y entre ; mêmes actions sur le nom d'un Circuit et le titre d'un Cycle.
10. « Réduire les animations » activé : le Circuit vidé disparaît immédiatement.
11. Séance à un seul Circuit (ancien modèle) : le glisser historique des cartes et des Points d'arrêt est inchangé.
