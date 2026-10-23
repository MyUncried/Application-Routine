/**
 * PRE-6 (story 5.2, D-435, CE-T03-08 ch13 L1478, Figma `8328:28605`, segments `9819:20056` à
 * `9819:20061`) : rail segmenté de la Séquence — décisions PURES, sans React Native.
 *
 * Le rail n'est plus un trait continu : il relie, d'un bord à l'autre, les ANCRES de la séquence —
 * anneau du Compte à rebours, médias des cartes, anneau du Circuit, bas du Circuit, rangée « après
 * le Circuit », anneau de Fin de séance — sans traverser ni médias ni anneaux.
 *
 * Construction (choix d'architecture, voir la spec 5.2) : chaque élément de la séquence porte
 * lui-même ses morceaux de rail, dans son propre repère, et suit donc ses propres translations du
 * glisser (story 2.3b) sans aucun recalcul de mise en page :
 * - sa « queue », de son ancre jusqu'à son bord bas (dans l'élément : longueur donnée par sa mise
 *   en page, rangée du point d'arrêt ou emplacement de placement compris) ;
 * - son « lien », de son ancre vers le HAUT jusqu'au bord bas de l'élément VISIBLE qui le précède
 *   (écart de la séquence, marges du Circuit). Sa longueur au repos est la somme des écarts de
 *   conception entre les deux bords — jamais une coordonnée d'exemple — ; pendant le glisser, il
 *   s'étire ou se rétracte de la différence entre les deux translations (`shift - prevShift`),
 *   portée par transformations sur le pilote natif.
 *
 * Story 6.2 (D-441) : la rangée autonome d'un Point d'arrêt est un nœud de la chaîne (`stop`) :
 * écart de sa zone au-dessus, ancre au haut de la rangée (lien jusqu'au bord bas de l'élément
 * précédent), queue sur toute sa hauteur, point de raccord en son centre.
 *
 * L'élément glissé (occurrence ou point) est sorti de la chaîne (son successeur se relie à son prédécesseur, sa
 * hauteur relevée au début du geste comptée dans le lien) : le rail traverse sa place d'origine
 * pendant qu'elle se referme, et la place d'insertion pendant qu'elle s'ouvre.
 */

import type { StructuralPosition } from "@/domain/sessions/Session";

/** Nature d'un élément de la séquence porteur de rail. */
type RailNodeKind = "start" | "row" | "stop" | "circuitHeader" | "circuitEnd" | "afterCircuit" | "end";

/**
 * Géométrie de conception dont dépend la longueur des liens au repos : les MÊMES constantes que
 * les styles de l'écran (écarts, marges du Circuit, ancres), jamais des valeurs propres au rail.
 */
export type RailGeometry = {
  /** Écart vertical de la séquence hors Circuit (Figma : 8). */
  readonly sequenceGap: number;
  /** Écart entre l'en-tête du Circuit et ses cartes, et entre ses cartes (Figma : 9). */
  readonly circuitGap: number;
  /** Marge verticale intérieure du Circuit (Figma : 14). */
  readonly circuitPadding: number;
  /** Ancre (haut du média) depuis le haut d'une carte (Figma : 8). */
  readonly rowEntry: number;
  /** Ancre (haut de l'anneau) depuis le haut de l'en-tête du Circuit : centré sur sa hauteur mesurée (Figma : 15 pour 40). */
  readonly circuitHeaderEntry: number;
  /** Ancre (haut de l'anneau) depuis le haut de la rangée de Fin de séance (Figma : 7). */
  readonly endEntry: number;
};

/** Lien d'un élément visible vers son prédécesseur visible. */
export type RailLink = {
  /** Clé du prédécesseur visible (une translation de pair est attachée à cette clé). */
  readonly prevKey: string;
  /** Longueur au repos, de l'ancre de l'élément au bord bas du prédécesseur. */
  readonly length: number;
};

/**
 * Élément d'une zone dans l'ordre affiché : une occurrence (son identifiant) ou, PRE-6 story 6.2
 * (D-441), la rangée autonome d'un Point d'arrêt (`{ stopPointId }`).
 */
export type RailChainItem = string | { readonly stopPointId: string };

export type RailChainInput = {
  /** Éléments de chaque zone (occurrences et, hors placement, rangées de points), dans l'ordre affiché. */
  readonly beforeTour: readonly RailChainItem[];
  readonly inTour: readonly RailChainItem[];
  readonly afterTour: readonly RailChainItem[];
  /** Rangée « après le Circuit » rendue (story 6.2 : emplacement du placement seulement). */
  readonly hasAfterCircuit: boolean;
  /**
   * Élément sorti de la chaîne (clé de rail) — soulevé, tenu pendant le dialogue de perte ou en
   * retour animé — et sa hauteur relevée au début du geste. PRE-6 story 7.5 : ou plusieurs — la
   * carte en cours de suppression et les points que la suppression retire (fondu puis glissement).
   */
  readonly skipped: RailSkippedItem | readonly RailSkippedItem[] | null;
  readonly geometry: RailGeometry;
};

/** Élément sorti de la chaîne du rail et sa hauteur. */
export type RailSkippedItem = { readonly key: string; readonly height: number };

/** Clés stables des éléments non occurrences. */
export const RAIL_KEYS = {
  start: "rail:start",
  circuitHeader: "rail:circuit-header",
  circuitEnd: "rail:circuit-end",
  afterCircuit: "rail:after-circuit",
  end: "rail:end",
} as const;

/** Clé d'une occurrence (identifiant de l'exercice). */
export function railRowKey(occurrenceId: string): string {
  return `rail:row:${occurrenceId}`;
}

/** PRE-6 story 6.2 : clé de la rangée autonome d'un Point d'arrêt (identifiant du point). */
export function railStopKey(stopPointId: string): string {
  return `rail:stop:${stopPointId}`;
}

function isStopItem(item: RailChainItem): item is { readonly stopPointId: string } {
  return typeof item === "object" && item !== null;
}

type ChainNode = {
  readonly key: string;
  readonly kind: RailNodeKind;
  readonly zone: StructuralPosition | null;
  readonly id: string | null;
};

/**
 * Liens de chaque élément visible de la séquence (toutes clés sauf `start`, qui n'a pas de
 * prédécesseur, et sauf l'occurrence sortie de la chaîne). Fonction pure : ordre affiché et écarts
 * de conception → prédécesseur et longueur au repos. Les translations du glisser sont appliquées
 * par l'écran (valeurs animées partagées, par clé).
 */
export function resolveRailLinks(input: RailChainInput): ReadonlyMap<string, RailLink> {
  const { geometry: g } = input;
  const rowNode =
    (zone: StructuralPosition) =>
    (item: RailChainItem): ChainNode =>
      isStopItem(item)
        ? { key: railStopKey(item.stopPointId), kind: "stop", zone, id: item.stopPointId }
        : { key: railRowKey(item), kind: "row", zone, id: item };
  const chain: ChainNode[] = [
    { key: RAIL_KEYS.start, kind: "start", zone: null, id: null },
    ...input.beforeTour.map(rowNode("BEFORE_TOUR")),
    { key: RAIL_KEYS.circuitHeader, kind: "circuitHeader", zone: null, id: null },
    ...input.inTour.map(rowNode("IN_TOUR")),
    { key: RAIL_KEYS.circuitEnd, kind: "circuitEnd", zone: null, id: null },
    ...(input.hasAfterCircuit ? [{ key: RAIL_KEYS.afterCircuit, kind: "afterCircuit" as const, zone: null, id: null }] : []),
    ...input.afterTour.map(rowNode("AFTER_TOUR")),
    { key: RAIL_KEYS.end, kind: "end", zone: null, id: null },
  ];

  /** Distance au repos du bord bas de l'élément précédent (dans la chaîne complète) au haut de celui-ci. */
  const gapAbove = (node: ChainNode): number => {
    switch (node.kind) {
      case "start":
        return 0;
      case "row":
      case "stop":
        return node.zone === "IN_TOUR" ? g.circuitGap : g.sequenceGap;
      case "circuitHeader":
        return g.sequenceGap + g.circuitPadding;
      case "circuitEnd":
        return g.circuitPadding;
      case "afterCircuit":
      case "end":
        return g.sequenceGap;
    }
  };
  const entry = (node: ChainNode): number => {
    switch (node.kind) {
      case "row":
        return g.rowEntry;
      case "circuitHeader":
        return g.circuitHeaderEntry;
      case "end":
        return g.endEntry;
      default:
        return 0;
    }
  };
  const skippedItems: readonly RailSkippedItem[] =
    input.skipped === null ? [] : Array.isArray(input.skipped) ? input.skipped : [input.skipped as RailSkippedItem];
  const skippedHeight = (node: ChainNode) => skippedItems.find((item) => item.key === node.key)?.height;
  const isSkipped = (node: ChainNode) => skippedHeight(node) !== undefined;

  const links = new Map<string, RailLink>();
  let previous: ChainNode = chain[0];
  // Hauteur (et écarts) des éléments sortis de la chaîne depuis le dernier élément visible.
  let skippedSpan = 0;
  for (const node of chain.slice(1)) {
    if (isSkipped(node)) {
      skippedSpan += gapAbove(node) + (skippedHeight(node) ?? 0);
      continue;
    }
    links.set(node.key, {
      prevKey: previous.key,
      length: skippedSpan + gapAbove(node) + entry(node),
    });
    previous = node;
    skippedSpan = 0;
  }
  return links;
}
