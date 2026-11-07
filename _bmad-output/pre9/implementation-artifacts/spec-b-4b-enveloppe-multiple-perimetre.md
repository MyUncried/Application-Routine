# B.4b — Enveloppe multiple et périmètre ajustable

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.4b (dépend de B.2, B.4 ; ajoutée le 29/10 à la demande de Hermann, recette n° 1, constat i ; placée après B.4 par sa décision du 29/10). Branche `pre9-bmad/dev`, départ `7c54b8ad`. Aucune migration, aucun changement Figma (lecture seule), `tokens.ts` inchangé (constantes locales).

## Décisions de Hermann appliquées (textes recopiés)

| Date / source | Texte | Effet |
|---|---|---|
| 29/10/2026 (epics § B.4b ; ch07 « Recette PRE-9 n° 1 ») | « On doit pouvoir sélectionner plusieurs exercices pour ajouter directement plusieurs circuits, ou plusieurs exercices / circuits pour ajouter plusieurs cycles en une fois. » | Sélection multiple en mode enveloppe. |
| 29/10/2026 (idem) | « Lorsqu'on a sélectionné un exercice pour poser un circuit, deux petits traits horizontaux apparaissent au dessus et en dessous des bords du cadre aux liserés pleins, en haut et en bas, qui permettent de déplacer le périmètre du circuit (idem pour la séance) en faisant glisser les bords en haut et en bas (appui sur les traits puis glissement). » | Traits de périmètre. |
| 31/10/2026 (ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ») | Sélection multiple puis « Ajouter un circuit » : « Un Circuit par Exercice » — chaque Exercice sélectionné devient le premier membre de son propre Circuit. | Un conteneur par contenu désigné. |
| 31/10/2026 (idem) | « idem pour la séance » désigne « Le Cycle » : les traits de périmètre servent aussi au Cycle en cours de création. | Traits pour le Circuit et le Cycle. |

## Autres sources

| Source | Passage appliqué |
|---|---|
| COMP §1, D-451, D-04 | « Un conteneur naît autour de membres existants, jamais vide » ; Séance : Exercices, Circuits, Cycles ; Cycle : Exercices directs et Circuits ; Circuit : Exercices ; « Aucun cycle dans un cycle, aucun circuit dans un circuit ». |
| COMP §5 l.62–64 | Enveloppe choisie en trait plein, candidats en pointillé ; « Confirmer le circuit / le cycle », Annuler ; « La création effective exige au moins un membre » ; sélection contiguë / non contiguë et franchissement de frontière réservés. |
| ARB-06 (ch07) | Création en posant le conteneur sur un premier contenu, puis glisser-déposer pour les autres contenus. |
| ARB-13 | Lettres réattribuées selon l'ordre — inchangées (calculées depuis la disposition). |
| B.2 (`spec-b-2-menu-creer-enveloppe.md`, `envelopeCandidates`) | Éligibilité : Circuit sur un Exercice du niveau Séance ou d'un Cycle ; Cycle sur un Exercice ou un Circuit du niveau Séance ; Exercice formaté refusé (ARB-27, C.4) ; Séance à Points d'arrêt : aucun conteneur qui la ferait sortir de l'ancien modèle (B.6). |
| ch13 CE Composition | Alternatives accessibles aux gestes. |
| P-4 (`EXIGENCES-PRODUIT.md`) | Primitive native : élément « ajustable » de VoiceOver pour l'alternative au glisser. |

Figma (`G6RY5Ebhgwb4AHIOYDwwvg`, lecture seule, `10819:20344` « Ajouter un circuit (emplacement) » et `10836:20478` « Ajouter un cycle (emplacement) ») : « Enveloppe choisie » et « Enveloppe candidate » seulement — **aucun trait de périmètre ni sélection multiple dessinés**. Rendu choisi (ARB-19), voir « À CLARIFIER ».

## Comment fonctionnait l'enveloppe (B.2) et ce qui change

B.2 : un seul contenu désigné (`EnvelopeState.designated`) ; un autre toucher déplaçait la désignation ; `wrapInContainer` posait un conteneur autour de ce seul contenu. B.4b généralise : la sélection est une liste de **périmètres** (`EnvelopeSpan` : contenus frères contigus d'un même parent, au moins un) ; chaque périmètre devient un conteneur à la confirmation. `wrapInContainer` (B.2) est conservé tel quel (tests B.2 inchangés).

## Réalisé

**Domaine** (`src/domain/sessions/layoutOperations.ts`, section « B.4b ») :
- `envelopeSpanReach(draft, container, span, others)` : étendue atteignable — suite contiguë, chez les frères du périmètre (niveau Séance, ou membres d'un Cycle pour un Circuit), des contenus éligibles (`envelopeCandidates`) libres de tout autre périmètre ; `null` si le périmètre est invalide (vide, non contigu, inéligible, chevauchant). Séance à Points d'arrêt : l'étendue se limite au périmètre (aucune extension).
- `adjustEnvelopeSpan(draft, container, span, edge, delta, others)` : déplace le bord haut ou bas de `delta` contenus, borné à l'étendue et à un contenu au moins.
- `toggleEnvelopeDesignation(draft, container, spans, target)` : toucher un contenu libre ajoute un périmètre ; toucher un contenu d'un périmètre retire ce périmètre ; inéligible : inchangé.
- `wrapSpansInContainers(draft, spans, container, newId)` : un conteneur par périmètre (Circuit : 1 tour, séries groupées, membres = Exercices du périmètre ; Cycle : 1 répétition, membres = Exercices et Circuits du périmètre) ; brouillon inchangé si un périmètre est invalide, si une Séance à Points d'arrêt reçoit un périmètre de plus d'un contenu, ou si le résultat la ferait sortir de l'ancien modèle ; un brouillon de l'ancien modèle jamais enregistré reçoit d'abord sa disposition (identifiant du Circuit unique). Un seul Circuit posé : ancien modèle conservé, zones réécrites (`withLayout`).

**Écran** (`CompositionScreen.tsx`, `EnvelopePerimeter.tsx` nouveau, `fr.ts`) :
- Mode enveloppe : toucher désigne / retire ; « Confirmer » disponible dès un périmètre ; libellé « Confirmer les circuits / les cycles » dès deux périmètres ; annonces VoiceOver (désigné, retiré, étendue, « n circuits / cycles créés »).
- Cadre d'un périmètre de plusieurs contenus : un seul cadre plein, continu — chaque contenu ouvre son bord intérieur et franchit la moitié de l'écart (8 au niveau Séance, 9 dans un Cycle) ; un périmètre qui contient un Circuit prend la largeur et l'arrondi du Circuit (débord 16, rayon 18) pour tous ses contenus.
- Traits (`EnvelopeHandle`) : au-dessus du bord haut du premier contenu et sous le bord bas du dernier, seulement si l'étendue compte plus d'un contenu. Appui puis glissement (système de répondeurs natif) : le trait suit le doigt [01/11/2026, contre-recette n° 4 : avec le bord du cadre] ; au relâchement, le bord se cale sur la limite de contenu la plus proche (`edgeIndexAt`, mesures `measureInWindow` prises à l'appui). VoiceOver : élément « ajustable » (balayer vers le haut : étendre, vers le bas : réduire), actions nommées « Étendre vers le haut / le bas », « Réduire par le haut / le bas », valeur « n éléments ».
- Annuler : aucune mutation.

## Synchronisation code / documentation

- **Classe B (évolution validée)** : sélection multiple, un conteneur par contenu désigné, traits de périmètre pour Circuit et Cycle — demandes et précisions de Hermann ci-dessus.
- **Classe A** : règles d'imbrication D-451, éligibilité B.2, lettres ARB-13, conteneur jamais vide (COMP §1, §5).
- **Classe C** : voir « À CLARIFIER ».
- **Classe D** : `edgeIndexAt`, mesure par `measureInWindow`, calage au relâchement (le trait reste monté pendant le geste).
- **Documents mis à jour (annotations datées entre crochets, texte d'origine conservé)** :
  - `docs/KODJO-Composition-conteneurs-2026-10-28.md` §5 (réserve « sélection contiguë/non contiguë ») et §6 (« L'étendue change par entrée/sortie des membres, sans poignée. ») ;
  - ch07 : ARB-06 annoté ; section « A.2b et B.4b — précisions de Hermann du 31/10/2026 » complétée (« B.4b, réalisation ») ;
  - ch13 l.1768 (« La sélection d'enveloppe transfrontière […] restent explicitement réservées ») annotée ;
  - `epics.md` § B.2 (« aucune sélection multiple n'est développée ») annoté ;
  - `sprint-status.yaml` : `b-4b-enveloppe-multiple-perimetre: review`.
- Test existant mis à jour, annotation datée : `CompositionScreen.b2.test.tsx` « un autre toucher déplace la désignation (une seule) » → second toucher du même contenu le retire.
- ch11 l.591 (« Créer un circuit ou un cycle enveloppe des membres existants éligibles ») : compatible, inchangé.

## Écarts et limites

1. **Calage au relâchement**, non en continu : le trait suit le doigt, le cadre se recale au relâchement (un recalage en continu démonterait le trait sous le doigt, porté par le contenu de bord). [01/11/2026, contre-recette n° 4 (b4b-etendre) : précisé — pendant le glisser, le bord du cadre suit le trait sous le doigt ; le calage reste fait au relâchement ; voir « Contre-recette n° 4 du 01/11/2026 ».]
2. **Pas de défilement automatique** pendant le glisser d'un trait : pour étendre au-delà de l'écran, défiler d'abord, ou utiliser les actions VoiceOver. [31/10/2026, recette iPhone n° 2 (b4b-etendre) : remplacé — liste figée pendant le glisser, défilement automatique près des bords ; voir « Recette iPhone n° 2 du 31/10/2026 — lot 3 ».]
3. **Pas de franchissement de frontière** : un périmètre reste chez les frères d'un même parent (un Circuit dans un Cycle ne s'étend pas hors du Cycle) — réserve COMP §5 maintenue.
4. **Séance à Points d'arrêt** : aucune extension (traits absents), comme les déplacements B.3 / B.4 ; sélection multiple limitée par la règle B.2 (aucun conteneur qui ferait sortir de l'ancien modèle). Levée attendue avec B.6.
5. Zone tactile du trait bas : 64 × 28, débordant d'environ 10 pt sur le contenu suivant ; le contenu qui porte le trait passe au-dessus de ses frères (`zIndex`) dans un même parent ; entre zones de l'ancien modèle (avant le Circuit / Circuit / après), ce rehaussement ne franchit pas le parent — à vérifier sur iPhone.

## À CLARIFIER (classe C)

1. **Plusieurs contenus désignés puis « Ajouter un cycle »** : un Cycle par contenu désigné — **interprétation par analogie** avec « Un Circuit par Exercice » (aucune source contraire ; la demande du 29/10 dit « plusieurs cycles en une fois »). Pour un seul Cycle autour de plusieurs contenus contigus : traits de périmètre.
2. **Rendu des traits** (Figma muet) : trait bleu `colors.primary` 32 × 4, arrondi, 4 pt au-delà du bord du cadre, centré ; zone tactile 64 × 28.
3. **Libellés** « Confirmer les circuits / les cycles », « Bord haut / bas du circuit / du cycle », actions et annonces : formulations choisies.
4. **Toucher un contenu d'un périmètre étendu** retire le périmètre entier (et non ce seul contenu) — choix de réalisation.
5. **Périmètre mêlant Exercice(s) et Circuit pour un Cycle** : cadre à la largeur du Circuit pour tous ses contenus — choix de rendu.

## Tests

- `src/domain/sessions/__tests__/layoutOperations.b4b.test.ts` (12) : un Circuit par Exercice ; retrait par second toucher, inéligibles ignorés ; un Cycle par contenu ; Circuits posés au niveau Séance et dans un Cycle en une confirmation ; refus sans altération (vide, inéligible, chevauchant, non contigu, hors parent) ; extension / réduction bornées ; arrêt de l'extension à un Circuit, un Cycle, au bord du Cycle parent, à un autre périmètre, à un Exercice formaté ; Cycle couvrant Exercices et Circuit ; Points d'arrêt ; brouillon de l'ancien modèle jamais enregistré ; enregistrement (`toStructuredSessionInput`).
- `src/features/sessions/__tests__/EnvelopePerimeter.test.ts` (3) : calage du bord haut et bas, bornes, mesures absentes ou partielles.
- `src/features/sessions/__tests__/CompositionScreen.b4b.test.tsx` (9) : « Confirmer les circuits », Circuit A, B, C ; retrait ; plusieurs Cycles ; traits (rôle ajustable, libellés, valeur), cadre continu (bords intérieurs ouverts, écart franchi), extension puis confirmation (ancien modèle, zones) ; réduction et retrait d'un périmètre étendu ; arrêt à un autre périmètre ; Cycle couvrant un Circuit (largeur du Circuit) ; Points d'arrêt sans traits ; Annuler sans mutation.
- Mis à jour : `CompositionScreen.b2.test.tsx`.
- Exécutions ciblées (`--maxWorkers=1`), `tsc --noEmit`, `eslint` des fichiers modifiés : voir le compte rendu de livraison. Suite complète non exécutée ici. Le glisser des traits n'est pas simulé par Jest (mesures natives) : seule la recette iPhone le prouve.

## Recette iPhone (build de développement)

Préparer une Séance de cinq Exercices E1 à E5, sans Circuit.
1. Menu Créer → « Ajouter un circuit » ; toucher E1, E3 et E5 : trois cadres pleins, la barre affiche « Confirmer les circuits » ; toucher de nouveau E3 : il redevient pointillé.
2. Confirmer : un Circuit autour de E1 et un autour de E5, nommés Circuit A et Circuit B, apparition progressive ; E2, E3, E4 restent au niveau de la Séance.
3. « Ajouter un circuit », toucher E2 : deux petits traits bleus apparaissent au-dessus et au-dessous du cadre.
4. Appuyer sur le trait bas et glisser vers le bas jusqu'au milieu de E4, relâcher : le cadre couvre E2, E3, E4 en un seul cadre continu (pas de liseré entre les cartes) ; le trait bas est maintenant sous E4.
5. Glisser le trait haut vers le haut : il ne dépasse pas E2 (le Circuit A au-dessus n'est pas éligible) ; glisser le trait bas vers le haut jusqu'à E3 : le cadre se réduit à E2, E3. Le cadre ne descend jamais sous un contenu.
6. Confirmer : un seul Circuit contenant E2 et E3 ; lettres A, B, C dans l'ordre.
7. « Ajouter un cycle », toucher E4 puis glisser son trait haut vers le haut sur le Circuit précédent : le cadre prend la largeur du Circuit ; confirmer : un Cycle contenant ce Circuit et E4.
8. Dans un Cycle contenant deux Exercices directs : « Ajouter un circuit », toucher le premier, étendre vers le bas : le cadre couvre le second, jamais au-delà du Cycle ; confirmer : Circuit dans le Cycle.
9. Toucher un trait sans glisser : rien ne change. Commencer un glisser du trait puis Annuler dans la barre : rien n'est écrit.
10. VoiceOver : sur un trait, « Bord bas du circuit, 1 élément, ajustable » ; balayer vers le haut : « 2 éléments » ; actions « Étendre vers le bas », « Réduire par le bas ».
11. Séance avec un Point d'arrêt : un contenu désigné n'a pas de traits.
12. Vérifier que le trait bas reste saisissable même s'il touche la carte suivante (zone tactile), notamment à la frontière avant / après le Circuit d'une Séance à un seul Circuit.

## Recette iPhone n° 2 du 31/10/2026 — lot 3

**Constats de Hermann (verbatim)** :
- b4b-etendre (KO) : « Lorsqu'on bouge un trait l'écran bouge avec. Par ailleurs le trait ne reste pas sous le doigt. Le trait doit rester sous le doigt lorsqu'il se déplace, l'écran doit rester figé et se déplacer avec le défilement du train uniquement s'il dépasse le cadre de l'écran. »
- b4b-saisie (KO) : « Exercice suivi d'un point d'arrêt : Ajout d'un circuit et sélection de l'exercice : Les traits n'apparaissent pas, ils devraient et on doit pouvoir intégrer le point d'arrêt avec l'exercice. Ajout d'un cycle et sélection de l'exercice : le trait apparaît, et c'est très bien, mais je ne peux pas sélectionner le point d'arrêt, je devrais pouvoir le faire. »
- b6-enveloppe (KO, voir aussi la spec B.6) : « Le point d'arrêt reste effectivement dans le conteneur, mais en terme d'affichage, le conteneur n'a plus de bord de cadre à gauche et à droite du Point d'arrêt. »
- b4b-cycle (KO) : « Même problème que pour le circuit » — voir la spec B.4, même section.

**Causes** :
1. b4b-etendre : le trait est un répondeur JavaScript dans la liste défilante native ; sur iOS, le défilement natif démarrait sous le doigt (la liste défilait avec le trait) et le trait, déplacé du seul écart du doigt, ne compensait pas ce défilement ; aucun défilement automatique (écart 2).
2. b4b-saisie : l'étendue d'un périmètre ne comptait que des contenus éligibles ; un Point d'arrêt n'était jamais une limite. Exercice suivi d'un Point puis d'un contenu inéligible (un Circuit, pour un Circuit) : étendue d'un seul contenu, pas de traits. Cycle : le pas suivant sautait le Point jusqu'au contenu suivant.
3. b6-enveloppe : en mode enveloppe, la rangée d'un Point située entre deux contenus d'un périmètre restait atténuée, sans cadre : le cadre continu s'interrompait à sa hauteur (bords gauche et droit absents).

**Corrections** :
- Domaine (`layoutOperations.ts`) : un périmètre est une suite d'**unités** — contenus et Points d'arrêt du même parent (`EnvelopeUnit`, `siblingsOf`) ; `EnvelopeSpan` porte en plus les Points de son bord (`leadingStopPointIds`, `trailingStopPointIds`) ; `envelopeSpanReach` rend l'étendue en unités (un Point est libre s'il n'est au bord d'aucun autre périmètre) ; `adjustEnvelopeSpan` avance d'une unité et garde au moins un contenu ; `envelopeSpanUnits` ; `wrapSpansInContainers` fait entrer les Points du bord désignés (`stopPointsAfterGrouping`, `StopPointGroupingBoundary`), en tête (début de tour / de passage) ou en fin.
- Écran : en mode enveloppe, chaque rangée de Point est enveloppée par `EnvelopeFrame` (unité `STOP_POINT`) — dans un périmètre, elle porte sa part du cadre continu (bords gauche et droit) et, au bord, le trait ; hors périmètre, inactive et atténuée (B.2). Ancien modèle (`ActivityZoneList`) et structure générale (`LayoutStopPointRow`).
- Trait (`EnvelopeHandle`) : pendant le glisser, la liste est figée (`scrollEnabled` à faux, posé aussitôt sur la vue native puis par l'état de l'écran) ; près des bords de la zone visible, elle défile d'elle-même (`useDragAutoScroll`, story 7.4) et le trait suit (translation = doigt + défilement accumulé) ; au relâchement, la position du doigt est rapportée au repère des mesures prises à l'appui ; sortie du mode pendant un glisser : liste rendue.

**Remplace** (texte conservé) : écart 2 [« Pas de défilement automatique pendant le glisser d'un trait : pour étendre au-delà de l'écran, défiler d'abord, ou utiliser les actions VoiceOver. »] ; « Réalisé » [`envelopeSpanReach` : « suite contiguë […] des contenus éligibles »] — les Points du parent sont désormais des unités de l'étendue.

**Synchronisation code / documentation** :
- Classe **B** (demandes explicites du 31/10) : b4b-etendre ; b4b-saisie (précision de la règle « il entre dans le conteneur », ch07 « B.6 — vocabulaire du Cycle et enveloppe », étendue au bord du périmètre). Mis à jour : ch07 section « Recette iPhone n° 2 du 31/10/2026 — lot 3 » et ARB-06 annoté ; cette spec ; en-têtes et commentaires de code annotés (`EnvelopePerimeter.tsx`, `layoutStopPoints.ts`, `layoutOperations.ts`, `CompositionScreen.tsx`).
- Classe **A** : b6-enveloppe (« un seul cadre plein, continu », B.4b).
- Règles inchangées : RM-219, RM-251 (un conteneur posé est de compte 1 : séquence fonctionnelle inchangée), D-451, COMP §5 (« au moins un membre »). COMP §6 l.70 (« L'étendue change […] sans poignée ») : déjà annoté par B.4b.

**Tests** : `layoutOperations.recette2.test.ts` (8 : traits sur un Point, Point en fin de tour, sans Point désigné, Cycle — arrêt sur le Point puis le contenu suivant et retour, Point de tête, Point au bord d'un autre périmètre, périmètre invalide, ancien modèle) ; `layoutOperations.b4b.test.ts` (étendue avec le Point, annotation datée) ; `CompositionScreen.recette2lot3.test.tsx` (trait et cadre sur la rangée du Point, Point entre deux contenus encadré, liste figée de l'appui au relâchement).

**À vérifier sur iPhone** : le trait reste sous le doigt ; l'écran ne bouge pas, sauf près des bords (défilement automatique) ; calage correct après un défilement automatique ; rangée du Point encadrée sans jointure.

## Contre-recette n° 4 du 01/11/2026 (iPhone)

**Constat de Hermann (verbatim)**, étape de recette : « Glisser le trait bas jusqu'au milieu de E4, relâcher → un seul cadre continu E2 à E4 ; le trait haut ne dépasse pas un Circuit voisin ; réduire le bas jusqu'à E3 ; jamais moins d'un contenu. Confirmer → Circuit [E2, E3], lettres dans l'ordre. » — b4b-etendre, encore KO depuis la recette n° 2 : « le comportement est correct, mais ce n'est pas seulement le trait qui doit se déplacer mais le bord du cadre avec le trait ».

**Cause** : le correctif du lot 3 gardait le trait sous le doigt ; le cadre (ses parts par unité, `EnvelopeFrame`) n'était recalculé qu'au relâchement (écart 1, « Calage au relâchement ») — pendant le glisser, seul le trait bougeait.

**Correction (classe B, précision du rendu du geste)** : pendant le glisser d'un trait, le bord correspondant du cadre — trait de bord, arrondis, fond et bords gauche et droit — suit le trait sous le doigt :
- au début du glisser, les unités du périmètre sont mesurées (`measureInWindow`, comme pour le calage) ; `useEnvelopePerimeterDrag` publie alors le glisser en cours (`edgeDrag` : périmètre, bord, translation du trait, mesures) ;
- chaque unité du périmètre remplace l'aplat de sa part du cadre par une part animée (`EnvelopeMovingSegment`) : une bande (bords gauche et droit, fond) étirée ou réduite d'après la translation du trait (`envelopeSegmentMotion`), et, à la première et à la dernière unité, les arrondis — celui du côté du trait porté par sa translation, l'autre fixe ; étendu, le cadre recouvre les contenus suivants (ou précédents) ; réduit, les parts des unités dépassées par le trait sont coupées ;
- le cadre garde au moins la hauteur de ses deux arrondis (il ne se retourne pas) ; le trait, lui, suit toujours le doigt ;
- au relâchement : calage sur la limite de contenu la plus proche, inchangé (`edgeIndexAt`, `adjustEnvelopeSpan`) ; « jamais moins d'un contenu » inchangé. VoiceOver (pas à pas) inchangé.

**Remplace** (texte conservé, annoté) : « Réalisé », traits [« le trait suit le doigt »] ; écart 1 [« le trait suit le doigt, le cadre se recale au relâchement »] — précisés.

**Fichiers** : `src/features/sessions/EnvelopePerimeter.tsx` (`EnvelopeEdgeDrag`, `edgeDrag`, `envelopeSegmentMotion`, `EnvelopeMovingSegment` ; `onDragStart` reçoit la translation du trait) ; `src/features/sessions/CompositionScreen.tsx` (`EnvelopeContext.edgeDrag`, `EnvelopeFrame`).

**Tests** : `EnvelopePerimeter.test.ts` (3 : bord bas étendu et réduit, unité coupée par le trait, bord haut) ; `CompositionScreen.recette2lot3.test.tsx` (1 : trait bas tiré de 60 — le bord bas du cadre descend de 60, la bande s'allonge, le bord haut reste ; remonté au-delà du haut, le bord s'arrête ; relâché au milieu de la carte suivante, cadre continu calé comme avant). Avant correction : aucune part animée (seul le trait translaté).

**Synchronisation code / documentation** : classe **B** (demande explicite de Hermann du 01/11/2026) ; ch07, section « Recette iPhone n° 2 du 31/10/2026 — lot 3 » (entrée ajoutée, entrée b4b-etendre annotée) ; cette spec (écart 1 et « Réalisé » annotés). Recherche des formulations contraires (« trait suit le doigt », « cadre se recale », « bord du cadre ») : ch13 et COMP §6 ne décrivent pas le rendu du glisser d'un trait ; aucune autre.

**À vérifier sur iPhone** : bord bas tiré vers le bas puis remonté, sur un et plusieurs contenus, avec un Point d'arrêt dans le périmètre ; bord haut de même ; jointures sans liseré entre les parts ; fond sans double teinte aux jointures ; défilement automatique pendant l'extension (le bord suit le trait).
