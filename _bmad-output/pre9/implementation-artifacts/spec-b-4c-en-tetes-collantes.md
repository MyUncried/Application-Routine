# B.4c — En-têtes collantes de Circuit et de Cycle

Story PRE-9, epic B. Plan : `../planning-artifacts/epics.md` § B.4c (écart de B.4, ajoutée le 31/10, placée après B.6 ; Hermann : « Ok confirmé »). Branche `pre9-bmad/dev`, départ `7fc264e4`. Aucune migration, aucun changement Figma, `tokens.ts` inchangé.

## Sources appliquées

| Source | Passage | Effet |
|---|---|---|
| COMP §7 CS-D1 | « Cartes, compte à rebours, fin et points défilent. Aucun élément collé en bas. » | Inchangé (tenu depuis B.4) : seuls les en-têtes de Circuit et de Cycle collent, en haut. |
| COMP §7 CS-D2 | « L'en-tête colle lorsque le haut de son conteneur dépasse le seuil et que le bas du conteneur reste sous ce seuil. Le « bord bas » désigne le conteneur entier. » | `stickyRange` : début au passage du haut du conteneur sous le seuil ; fin quand le bas du conteneur (moins sa marge basse) rejoint le bas de l'en-tête. |
| CS-D3 | « Relève entre conteneurs frères par poussée, sans fondu. » | Translation bornée par le bas du conteneur : l'en-tête est poussé par le bas de son conteneur, le suivant prend la place ; aucune opacité animée sur l'en-tête. |
| CS-D4 | « Cycle et circuit peuvent coller simultanément, deux niveaux maximum ; les deux comptes restent visibles. » | Un Circuit d'un Cycle colle sous l'en-tête collé du Cycle (seuil abaissé de la hauteur **mesurée** de l'en-tête du Cycle, `stickBelow`) ; jamais plus de deux niveaux (aucun conteneur plus profond). |
| CS-D5 | « Les commandes existantes restent actives : nombre/nature/chevron pour un circuit ; nombre seul pour un cycle. » | L'en-tête collé est l'en-tête lui-même, translaté (aucune copie) : compte, nature, chevron et appui long répondent. |
| CS-D6 | « Replier le circuit collé ajuste le scroll pour maintenir son en-tête sous le doigt ; utiliser sa hauteur réelle, pas l'ancienne constante 80. » | Au repli d'un Circuit collé, défilement ramené au début de sa zone collante (`stickyCollapseOffset`) : l'en-tête reste au seuil, à la même place à l'écran. Géométrie issue des mesures (aucune constante). |
| CS-D7 | « Pendant un déplacement, décoller les en-têtes ; les rétablir au relâchement. » ; « Priorité CS-D7 pendant un déplacement, y compris lorsqu'un appui long replie d'abord un circuit collé. » | En-têtes décollés pendant tout déplacement (carte, Circuit, Cycle, Point d'arrêt, trait de périmètre). Appui long sur un en-tête collé : défilement ramené à sa place dans le flux **avant** la saisie — décollé sans saut, sous le doigt. |
| CS-D8 | « Tout scroll applicatif amène la cible sous la zone collante, jamais derrière. » | Les seuls défilements applicatifs de l'écran sont le défilement automatique du glisser (en-têtes décollés, CS-D7) et le recalage CS-D6/CS-D7, qui place l'en-tête au seuil. Aucun autre défilement applicatif n'existe ; tenu par construction. |
| COMP §7, note | « mesurer les en-têtes rendues, notamment avec agrandissement du texte. Le rail doit rester lisible à travers la zone collante ; montage à vérifier. » | Hauteurs relevées (`onLayout`), jamais de hauteur universelle ; le fond collé redessine le rail (segment traversant, anneau à la rangée de titre, anneau extérieur pour le Cycle). |

## Réalisé

**`src/features/sessions/StickyHeader.tsx`** (nouveau)
- `StickyScrollContext` : décalage du corps (`Animated.Value`, pilote natif), dernier décalage connu, `scrollTo`, seuil, état actif (CS-D7).
- `stickyRange`, `stickyCollapseOffset` : géométrie pure (testée).
- `StickyHeaderFrame` : translation `interpolate` du décalage, bornée (`extrapolate: "clamp"`) ; fond opaque à la couleur du conteneur, qui couvre la marge haute du conteneur et, au niveau Séance, la part fondue de la zone de contexte (au-dessus du seuil) ; rail redessiné ; fond visible seulement une fois collé.

**`CompositionScreen.tsx`**
- Corps : `Animated.ScrollView`, `onScroll` = `Animated.event` sur le pilote natif (en-têtes sans décalage d'une trame), avec écouteur qui garde le défilement automatique (story 7.4) et le dernier décalage.
- Seuil : bas de la part fondue de la zone de contexte (`CONTEXT_BAND_FADE_HEIGHT`), le corps remontant dessous depuis la contre-recette n° 2 du 30/10.
- Circuit unique (rendu historique), Circuits et Cycles de la disposition générale : en-tête dans un `StickyHeaderFrame`, au premier plan de son conteneur (`zIndex`) ; les membres défilent dessous.
- `alignStuckHeader` : recalage CS-D6 (repli) et CS-D7 (appui long sur un en-tête collé).

## Choix techniques (D)

- Translation de l'en-tête réel plutôt qu'une copie superposée : les commandes restent actives (CS-D5) et l'accessibilité inchangée ; `stickyHeaderIndices` natif écarté (enfants directs seulement, un niveau, sans relève entre conteneurs imbriqués).
- Pilote natif pour la translation (P-4 : défilement natif, aucune boucle JS par trame).

## À CLARIFIER (non bloquant)

1. **Mode enveloppe** (« Ajouter un circuit / un cycle », pose et traits de périmètre) : les en-têtes ne collent pas. Les traits de périmètre sont un déplacement (CS-D7) ; hors glisser d'un trait, le mode n'est pas couvert par COMP §7, et les mesures y sont relatives aux cadres de l'enveloppe. À confirmer à la recette.

## Tests

- `__tests__/StickyHeader.test.tsx` : CS-D2 (début, fin), CS-D4 (seuil abaissé), absence de mesure, CS-D6 (recalage, aucun recalage hors collage), fond et rail, repos (CS-D7), translation bornée (CS-D3).
- Non-régression : dossier `src/features/sessions`.

## Synchronisation documentaire

Classe **A** (conformité à COMP §7 CS-D2 à CS-D8, déjà écrite) ; aucune spécification modifiée. Point « À CLARIFIER » ci-dessus consigné ici, sans règle créée.

## Recette iPhone

À vérifier sur appareil (une suite verte ne vaut pas recette) : collage et relève par poussée entre deux Circuits ; Cycle et Circuit collés ensemble ; commandes de l'en-tête collé ; repli d'un Circuit collé ; appui long sur un en-tête collé ; rail lisible ; agrandissement du texte.

### Recette iPhone n° 3 du 01/11/2026

Tous les points sont validés sauf **r3-cycle** (KO). Hermann : « Le comportement fonctionne mais il faut que l'entête du cycle et du circuit qui reste affiché intègre aussi la marge du dessous qui se trouve juste au dessus du prochain élément (circuit, exercices, point d'arrêt). actuellement l'arrêt se fait juste au niveau de la ligne de texte cycle ou du circuit. »

Correction, classe **B** (précision visuelle demandée explicitement ; elle ne crée aucune règle métier, COMP §7 inchangé) : le fond collé couvre aussi la marge sous l'en-tête, jusqu'à l'élément suivant (`insetBottom` de `StickyHeaderFrame` et de `stickyRange`). La marge est de 9 pt sous l'en-tête d'un Circuit (`CIRCUIT_GAP`) comme sous celui d'un Cycle (`LAYOUT_CYCLE_GAP`). La poussée s'applique au bas de cette marge. Les Circuits d'un Cycle collent sous l'en-tête du Cycle, marge comprise. Tests : `StickyHeader.test.tsx` (deux cas ajoutés). À revérifier sur iPhone.
