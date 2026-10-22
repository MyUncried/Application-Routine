/**
 * Décisions PURES de la gestuelle de Composition (T02-S01, CE-T02-01/
 * CE-T02-02, D-127/D-129).
 *
 * Aucune dépendance React Native : ce module ne contient que la
 * classification d'un geste et la résolution d'une destination de dépose à
 * partir de coordonnées déjà mesurées. `CompositionScreen.tsx` se contente
 * de brancher les événements du responder system natif dessus — le
 * comportement décidable est donc testable sans simuler de toucher.
 *
 * **Primitives natives** (`.github/AI_ORCHESTRATION.md`, « Priorité aux
 * primitives natives de l'OS ») : la reconnaissance s'appuie sur le
 * *responder system* de React Native (`onStartShouldSetResponder`/
 * `onResponderGrant`/`onResponderMove`/`onResponderRelease`), pas sur une
 * bibliothèque tierce — `react-native-gesture-handler` et
 * `react-native-reanimated` ne sont ni activés, ni configurés, ni importés
 * (plan §8, décision validée).
 */

import type { StructuralPosition } from "@/domain/sessions/Session";

/**
 * Délai d'appui long avant l'engagement de la réorganisation (D-127). Aligné
 * sur le défaut de `Pressable`/`TouchableWithoutFeedback` de React Native
 * (`500 ms`), pour que l'appui long de cette liste se comporte exactement
 * comme celui du reste du système plutôt qu'avec une durée inventée.
 */
export const LONG_PRESS_DELAY_MS = 500;

/**
 * Tolérance de mouvement d'un appui : en deçà, le geste reste un appui
 * (court ou long) ; au-delà, c'est un déplacement. Même valeur que le
 * `pressRectOffset`/slop usuel des cibles tactiles compactes.
 */
export const TOUCH_SLOP = 8;

/**
 * Déplacement horizontal à partir duquel un balayage est reconnu comme
 * ACHEVÉ (CE-T02-01). Le seuil vaut dans les deux sens : `dx ≤ -40` est un
 * balayage gauche (révèle `Dupliquer`/`Supprimer`), `dx ≥ +40` un balayage
 * droit (les masque).
 */
export const SWIPE_REVEAL_DISTANCE = 40;

export type GestureKind = "TAP" | "SWIPE_LEFT" | "SWIPE_RIGHT" | "VERTICAL" | "NONE";

/**
 * Classe un déplacement `(dx, dy)` tant que l'appui long n'a pas encore
 * abouti :
 *
 * - `NONE` tant que le mouvement reste dans la tolérance (l'appui long peut
 *   donc encore aboutir) ou qu'un geste horizontal n'a pas atteint le seuil ;
 * - `SWIPE_LEFT` / `SWIPE_RIGHT` pour un geste franchement horizontal ayant
 *   atteint `SWIPE_REVEAL_DISTANCE` dans le sens correspondant ;
 * - `VERTICAL` pour un geste à dominante verticale — il appartient alors au
 *   défilement de la liste, jamais à la carte ;
 * - `TAP` n'est jamais renvoyé ici : un appui est reconnu à la RELÂCHE, en
 *   l'absence de tout mouvement significatif (`isTap`).
 *
 * Cette classification ne décrit qu'un état instantané, à un instant `(dx,
 * dy)` donné ; c'est l'appelant qui décide QUAND et COMMENT l'utiliser.
 *
 * **V2-CAT-01 (UI-CAT-R-007, CE-T03-08)** : `CompositionScreen.tsx` suit
 * désormais le doigt EN CONTINU pendant le geste (translation et révélation
 * progressives des actions, via `clampSwipeTranslateX` ci-dessous) — cette
 * fonction reste néanmoins utile telle quelle pour distinguer un mouvement
 * horizontal engagé (capture du responder) d'un mouvement vertical (laissé
 * au défilement de la liste) ou d'un appui encore possible (`isTap`). Ceci
 * révise le modèle antérieur (« balayage achevé, sans suivi progressif »)
 * explicitement contredit par le contrat d'écran de cette tranche.
 */
export function classifyMovement(dx: number, dy: number): GestureKind {
  if (Math.abs(dx) <= TOUCH_SLOP && Math.abs(dy) <= TOUCH_SLOP) {
    return "NONE";
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx <= -SWIPE_REVEAL_DISTANCE) {
      return "SWIPE_LEFT";
    }
    if (dx >= SWIPE_REVEAL_DISTANCE) {
      return "SWIPE_RIGHT";
    }
    return "NONE";
  }
  return "VERTICAL";
}

/**
 * `true` pour un geste horizontal ayant atteint le seuil dans l'un ou
 * l'autre sens — le seul cas où la carte doit CAPTER le responder (et donc
 * annuler l'appui du `Pressable` interne) avant même de savoir ce qu'elle en
 * fera à la relâche.
 */
export function isCompletedHorizontalSwipe(kind: GestureKind): boolean {
  return kind === "SWIPE_LEFT" || kind === "SWIPE_RIGHT";
}

/** `true` tant que le geste n'a pas dépassé la tolérance d'appui (D-127 : l'appui court reste possible). */
export function isTap(dx: number, dy: number): boolean {
  return Math.abs(dx) <= TOUCH_SLOP && Math.abs(dy) <= TOUCH_SLOP;
}

/**
 * Borne la translation horizontale d'une carte de Composition à
 * `[-revealOffset, 0]` (V2-CAT-01, UI-CAT-R-007/010) — `0` carte fermée,
 * `-revealOffset` entièrement ouverte. `revealOffset` reste un paramètre,
 * jamais une constante locale à ce module : sa valeur (largeur du groupe
 * d'actions plus la marge carte/cadre Tour) dépend de tokens DSF
 * (`@/shared/ui/tokens`), hors du périmètre volontairement dépourvu de toute
 * dépendance de présentation de ce module.
 *
 * Appliquée à une position de repos (`0` ou `-revealOffset`) additionnée du
 * déplacement `dx` courant, cette seule borne garantit par construction
 * qu'un balayage droit ne peut jamais faire progresser la carte au-delà de
 * sa position fermée, ni un balayage gauche au-delà de sa position ouverte —
 * la fermeture n'aboutit donc jamais sauf engagée depuis une carte déjà
 * ouverte, et réciproquement pour l'ouverture.
 */
export function clampSwipeTranslateX(x: number, revealOffset: number): number {
  return Math.min(0, Math.max(-revealOffset, x));
}

/**
 * Décide, à la relâche d'un balayage engagé, si la carte doit s'aligner en
 * position OUVERTE ou FERMÉE (V2-CAT-01, UI-CAT-R-007) — au-delà de la
 * MOITIÉ de la course atteignable, la position atteinte l'emporte, jamais la
 * distance parcourue depuis l'origine du geste (une carte déjà largement
 * ouverte qu'on referme partiellement reste ouverte si elle n'a pas
 * repassé la moitié).
 */
export function shouldRevealAfterSwipe(translateX: number, revealOffset: number): boolean {
  return translateX <= -revealOffset / 2;
}

/** Géométrie mesurée d'une carte d'Activité, dans le repère du contenu défilant. */
export type ActivityRowLayout = {
  readonly id: string;
  readonly zone: StructuralPosition;
  readonly top: number;
  readonly height: number;
};

/**
 * Géométrie nécessaire à la résolution d'une dépose. La zone de destination
 * est déterminée par la position du pointeur RELATIVEMENT À LA STRUCTURE
 * TOUR — au-dessus, dedans, en dessous — et non par la hauteur des listes
 * d'Activités elles-mêmes : une zone VIDE reste donc une destination valide
 * sans qu'aucun réceptacle de hauteur minimale n'ait à être ajouté, ce qui
 * déplacerait les autres cartes. Source (PRE-6 story 5.2b, citation vérifiée) :
 * ch13, contrat CE-T03-08, section « Composer une séance / Modifier une
 * séance — Réorganisation » (état soulevé) : « Les autres cartes et éléments
 * structurels restent inchangés. » — l'ancienne paraphrase attribuée à CE-T02-02 n'existe pas
 * telle quelle dans la spécification.
 */
export type CompositionDragLayout = {
  readonly tourTop: number;
  readonly tourBottom: number;
  readonly rows: readonly ActivityRowLayout[];
};

export type DropTarget = {
  readonly zone: StructuralPosition;
  readonly index: number;
};

/** Zone structurelle visée par un pointeur, d'après sa position vis-à-vis de la structure Tour. */
export function resolveDropZone(
  layout: CompositionDragLayout,
  pointerY: number,
): StructuralPosition {
  if (pointerY < layout.tourTop) {
    return "BEFORE_TOUR";
  }
  if (pointerY >= layout.tourBottom) {
    return "AFTER_TOUR";
  }
  return "IN_TOUR";
}

/**
 * Destination d'une dépose : la zone visée et le rang à occuper DANS cette
 * zone, l'Activité déplacée étant exclue du calcul (elle libère sa place).
 *
 * Le rang est le nombre de cartes de la zone dont le CENTRE est au-dessus du
 * pointeur — une carte n'est donc franchie qu'une fois sa moitié dépassée,
 * comportement usuel d'une liste réordonnable.
 */
export function resolveDropTarget(
  layout: CompositionDragLayout,
  draggedActivityId: string,
  pointerY: number,
): DropTarget {
  const zone = resolveDropZone(layout, pointerY);
  const rows = layout.rows
    .filter((row) => row.zone === zone && row.id !== draggedActivityId)
    .slice()
    .sort((a, b) => a.top - b.top);

  let index = 0;
  for (const row of rows) {
    if (pointerY >= row.top + row.height / 2) {
      index += 1;
    }
  }
  return { zone, index };
}

/**
 * PRE-6 (story 2.3b) : écarts de la Composition, pour le pas d'un décalage — entre deux cartes
 * d'une même zone hors Circuit (`row`), entre deux cartes du Circuit (`circuitRow` ; PRE-6 story
 * 5.2, D-435 : 9 dans le Circuit, 8 au dehors), entre une liste de zone et ses voisines dans le
 * corps (`zone` : une liste vide n'est pas rendue, son apparition ajoute la carte et cet écart),
 * entre l'en-tête du Circuit et sa liste (`circuit`).
 */
export type DragShiftGaps = {
  readonly row: number;
  readonly circuitRow: number;
  readonly zone: number;
  readonly circuit: number;
};

/**
 * PRE-6 (story 2.3b, amendement Hermann du 21/10/2026) : décalages verticaux pendant le glisser —
 * par carte (absente = `0`), bords haut et bas du Circuit (l'en-tête et l'anneau suivent le bord
 * haut), éléments structurels entre le Circuit et les occurrences qui le suivent (ligne « après
 * le Circuit ») et contenu qui suit la dernière zone (`end` : « Fin de séance »). `end` est le
 * décalage NET du geste — pas d'insertion moins pas de retrait — : nul quand les deux pas sont
 * égaux, non nul quand l'écart (cartes, liste de zone, Circuit) ou la hauteur prédite du bloc
 * diffère entre l'origine et la cible.
 */
export type DragShifts = {
  readonly rows: ReadonlyMap<string, number>;
  readonly circuitTop: number;
  readonly circuitBottom: number;
  readonly afterCircuit: number;
  readonly end: number;
};

export const NO_DRAG_SHIFTS: DragShifts = {
  rows: new Map(),
  circuitTop: 0,
  circuitBottom: 0,
  afterCircuit: 0,
  end: 0,
};

const ZONE_ORDER: Record<StructuralPosition, number> = { BEFORE_TOUR: 0, IN_TOUR: 1, AFTER_TOUR: 2 };

/**
 * PRE-6 (story 2.3b) : décalages qui montrent, pendant le glisser, la disposition que le dépôt
 * produira à l'emplacement `target` (résolu par `resolveDropTarget` — celui que le dépôt
 * appliquera). Fonction pure : positions relevées au début du geste → décalages. La carte glissée
 * n'y figure jamais (elle suit le doigt).
 *
 * Modèle : le dépôt RETIRE le bloc glissé de son emplacement d'origine (tout ce qui le suit remonte
 * d'un pas) puis l'INSÈRE à l'emplacement visé (tout ce qui suit l'emplacement descend d'un pas).
 * Le pas de retrait est la hauteur mesurée du bloc (carte + ligne de récupération) plus l'écart qui
 * disparaît avec lui (`DragShiftGaps`) ; le pas d'insertion, sa hauteur dans la zone visée
 * (`insertionHeight`, prédite par l'appelant ; par défaut la hauteur mesurée) plus l'écart qui y
 * apparaît. D'où, par construction :
 *
 * - même zone, vers le bas : les cartes traversées remontent ; vers le haut : elles descendent ;
 * - entrée dans le Circuit : il s'agrandit d'un pas (ses bords s'écartent) ; sortie : il se
 *   rétracte ; ce qui le suit se décale d'autant ;
 * - au dépôt, chaque élément est déjà à sa position finale : la mise en page réelle prend le
 *   relais sans saut.
 */
export function resolveDragShifts(
  layout: CompositionDragLayout,
  draggedActivityId: string,
  target: DropTarget,
  gaps: DragShiftGaps,
  insertionHeight?: number,
): DragShifts {
  const dragged = layout.rows.find((row) => row.id === draggedActivityId);
  if (dragged === undefined) {
    return NO_DRAG_SHIFTS;
  }
  const othersIn = (zone: StructuralPosition) =>
    layout.rows
      .filter((row) => row.zone === zone && row.id !== draggedActivityId)
      .slice()
      .sort((a, b) => a.top - b.top);
  const gapIn = (zone: StructuralPosition) => {
    if (zone === "IN_TOUR") {
      return othersIn(zone).length > 0 ? gaps.circuitRow : gaps.circuit;
    }
    return othersIn(zone).length > 0 ? gaps.row : gaps.zone;
  };

  const origin: DropTarget = {
    zone: dragged.zone,
    index: othersIn(dragged.zone).filter((row) => row.top < dragged.top).length,
  };
  const removal = dragged.height + gapIn(origin.zone);
  const insertion = (insertionHeight ?? dragged.height) + gapIn(target.zone);
  /**
   * Décalage d'un élément d'après sa place dans la séquence sans la carte glissée : `atOrAfter`
   * dit s'il suit (ou occupe) un emplacement donné — l'origine (il remonte) et la cible (il descend).
   */
  const shiftAt = (atOrAfter: (point: DropTarget) => boolean) =>
    (atOrAfter(origin) ? -removal : 0) + (atOrAfter(target) ? insertion : 0);

  const rows = new Map<string, number>();
  for (const zone of ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"] as const) {
    othersIn(zone).forEach((row, index) => {
      const shift = shiftAt(
        (point) =>
          ZONE_ORDER[zone] > ZONE_ORDER[point.zone] || (zone === point.zone && index >= point.index),
      );
      if (shift !== 0) {
        rows.set(row.id, shift);
      }
    });
  }
  const circuitBottom = shiftAt((point) => point.zone !== "AFTER_TOUR");
  return {
    rows,
    circuitTop: shiftAt((point) => point.zone === "BEFORE_TOUR"),
    circuitBottom,
    // Rien ne sépare le bas du Circuit de la ligne « après le Circuit ».
    afterCircuit: circuitBottom,
    // Après la dernière zone : toujours après l'origine ET après la cible.
    end: insertion - removal,
  };
}

/** Sens d'une action accessible de déplacement (« Monter » / « Descendre »). */
export type StepDirection = "UP" | "DOWN";
