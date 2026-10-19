/**
 * PRE-4 story 3.3 (AD-15, FR-03-05, FR-03-10, FR-10-05) — surface ouverte de la
 * Feuille Paramètres d'exécution : réducteur d'interface pur, testable sans rendu.
 *
 * `open` porte AU PLUS une surface : un panneau de choix (Changement de côté,
 * Ordre des côtés), un Sélecteur (roue de la Cible commune ou de la Durée
 * totale) ou un champ ± hors tableau (`stepper`). PRE-5 story 2.4 (AD-27) : le
 * Mode et le Type de série (ex-Régime) sont des segmentés en ligne, sans
 * surface ; `popover(mode)` et `popover(regime)` sont retirées. C'est un état
 * d'interface de la Feuille, jamais une donnée du Brouillon du domaine (AD-2) :
 * aucune transition de ce réducteur ne modifie le Brouillon, donc aucune
 * n'invalide l'annulation d'un retrait (Q29).
 *
 * Chaque ouverture reçoit une clé (`key`) tirée d'un compteur strictement
 * croissant de la Feuille (`generation`). Une fermeture qui porte une autre clé,
 * ou qui arrive alors que rien n'est ouvert, est ignorée (rappel tardif, T8).
 *
 * Familles (AD-15, Q41) :
 * - surfaces de choix et Sélecteurs (`popover`, `selector`) : panneau sans
 *   flèche (iOS) ou contrôle en ligne (Android, web). Un
 *   toucher sur un autre champ pendant qu'elles sont ouvertes les ferme sans
 *   appliquer et n'ouvre pas le champ touché (T10) ;
 * - champ ± (`stepper`) : état React Native. Toucher une autre valeur, une ligne
 *   de popover ou de Sélecteur le ferme et ouvre l'autre surface dans le même
 *   geste (T15, T20, T24) ; ses ± ne le ferment jamais (T22) ; un appui
 *   extérieur le range (T23).
 *
 * Story 3.6, réduite par Q44 (Hermann, 2026-10-17 : ni Cellule active ni Pied
 * commun ; les cellules gardent leurs ± permanents) — seule extension, sans second
 * réducteur : le Sélecteur de la Cible d'une ligne, `selector(rowTarget(l))`, ouvert
 * en touchant la valeur de la cellule de Cible ; mêmes règles que les autres
 * Sélecteurs (T2, T3, T5, T6, T7, T8, T10, T21). La ligne `l` est l'IDENTITÉ de
 * ligne du Brouillon (`rowIds`, AD-2), jamais son rang. « Ligne disparue »
 * (`rows`) : un Sélecteur de ligne dont la ligne n'existe plus se ferme. La croix
 * de retrait lit l'état sans le modifier (`removalEnabled`, T18).
 *
 * PRE-5 story 2.6 (AD-27, FR-29) : les cellules du tableau n'ont plus de ± permanents.
 * La cellule Pause d'une ligne ouvre `stepper(rowPause(l))`, le champ ± de cette seule
 * cellule ; il suit la famille ± (même geste pour ouvrir une autre surface, ses ± ne le
 * ferment jamais, appui extérieur qui le range, ✓ / ✕ non absorbés). `l` est l'identité
 * de ligne (`rowIds`) ; « Ligne disparue » le ferme aussi.
 */

export type SheetPopover = "side" | "order";
export type SheetSelector = "commonTarget" | "total";
/** Valeurs numériques hors tableau réglées par ± (FR-10-05). */
export type SheetStepperField = "count" | "pause" | "sideRecovery" | "beep" | "countdown" | "end";

export type SheetSurface =
  | { readonly kind: "popover"; readonly popover: SheetPopover }
  | { readonly kind: "selector"; readonly selector: SheetSelector }
  /** Story 3.6 : Sélecteur de la Cible de la ligne d'identité `row`. */
  | { readonly kind: "selector"; readonly selector: "rowTarget"; readonly row: number }
  | { readonly kind: "stepper"; readonly field: SheetStepperField }
  /** PRE-5 story 2.6 : champ ± de la Pause de la ligne d'identité `row`. */
  | { readonly kind: "stepper"; readonly field: "rowPause"; readonly row: number };

export type OpenSurface = { readonly kind: "none" } | (SheetSurface & { readonly key: number });

export type SheetSurfaceState = {
  readonly open: OpenSurface;
  /** Clé de la surface dont le choix est appliqué et qui se referme après le cadre D-4. */
  readonly closingKey: number | null;
  /** Dernière clé attribuée (compteur strictement croissant). */
  readonly generation: number;
};

export type SheetSurfaceEvent =
  /** Toucher le champ d'une surface (pastille de valeur, valeur d'une cellule de Cible). */
  | { readonly type: "touch"; readonly surface: SheetSurface }
  /** Fermeture sans application ou après application immédiate (✓, ✕, toucher extérieur d'un panneau, `onIsPresentedChange(false)`). */
  | { readonly type: "close"; readonly key: number }
  /** D-4 : choix appliqué ; la surface reste visible le temps du cadre, puis `closed`. */
  | { readonly type: "choose"; readonly key: number }
  /** D-4 : fin du cadre ; la surface se ferme. */
  | { readonly type: "closed"; readonly key: number }
  /** Appui extérieur dans le corps de la Feuille : range un champ ± ouvert (T23). */
  | { readonly type: "outside" }
  /** Tout fermer sans appliquer (action dans le tableau, repli par le chevron). */
  | { readonly type: "closeAll" }
  /** Ferme la surface ouverte si elle n'existe plus (Q38 : Ordre masqué à N = 1). */
  | { readonly type: "prune"; readonly removed: readonly SheetSurface[] }
  /** Story 3.6 (« Ligne disparue ») : identités des lignes du Brouillon après une transition. */
  | { readonly type: "rows"; readonly rowIds: readonly number[] };

export const INITIAL_SHEET_SURFACE_STATE: SheetSurfaceState = { open: { kind: "none" }, closingKey: null, generation: 0 };

const NONE: OpenSurface = { kind: "none" };

/** Même surface (genre et cible), clé ignorée. */
export function sameSurface(a: OpenSurface | SheetSurface, b: SheetSurface): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "popover":
      return b.kind === "popover" && a.popover === b.popover;
    case "selector":
      if (b.kind !== "selector" || a.selector !== b.selector) return false;
      // Story 3.6 : deux Sélecteurs de ligne ne sont la même surface que pour la même ligne.
      return a.selector !== "rowTarget" || (b.selector === "rowTarget" && a.row === b.row);
    case "stepper":
      if (b.kind !== "stepper" || a.field !== b.field) return false;
      // PRE-5 story 2.6 : deux champs de Pause de ligne ne sont la même surface que pour la même ligne.
      return a.field !== "rowPause" || (b.field === "rowPause" && a.row === b.row);
    default:
      return false;
  }
}

function openNew(state: SheetSurfaceState, surface: SheetSurface): SheetSurfaceState {
  const key = state.generation + 1;
  return { open: { ...surface, key }, closingKey: null, generation: key };
}

const closeAll = (state: SheetSurfaceState): SheetSurfaceState =>
  state.open.kind === "none" && state.closingKey === null ? state : { ...state, open: NONE, closingKey: null };

export function sheetSurfaceReducer(state: SheetSurfaceState, event: SheetSurfaceEvent): SheetSurfaceState {
  const open = state.open;
  switch (event.type) {
    case "touch": {
      // T15, T16, T24 ; story 3.6 T2, T3 : rien d'ouvert — la surface touchée s'ouvre.
      if (open.kind === "none") return openNew(state, event.surface);
      // Second toucher sur le champ de la surface ouverte : fermeture sans application.
      if (sameSurface(open, event.surface)) return closeAll(state);
      // T20, T15, T24 ; story 3.6 T21 : champ ± ouvert — il se ferme et l'autre surface
      // s'ouvre d'un seul geste.
      if (open.kind === "stepper") return openNew(state, event.surface);
      // T10 : popover ou Sélecteur ouvert — fermeture sans application ; le champ touché ne s'ouvre pas.
      return closeAll(state);
    }
    case "close":
      // T5, T6, T7, T17, T25, T26 ; T8 : une autre clé, ou rien d'ouvert, est ignorée.
      return open.kind !== "none" && open.key === event.key ? closeAll(state) : state;
    case "choose":
      return open.kind !== "none" && open.key === event.key ? { ...state, closingKey: event.key } : state;
    case "closed":
      if (open.kind !== "none" && open.key === event.key) return closeAll(state);
      return state.closingKey === event.key ? { ...state, closingKey: null } : state;
    case "outside":
      // T23 : seul un champ ± est rangé par un appui extérieur dans le corps ; les
      // popovers et panneaux ont leur propre fermeture extérieure (T7).
      return open.kind === "stepper" ? closeAll(state) : state;
    case "closeAll":
      return closeAll(state);
    case "prune":
      return open.kind !== "none" && event.removed.some((surface) => sameSurface(open, surface)) ? closeAll(state) : state;
    case "rows":
      // « Ligne disparue » (AD-15) : règle défensive après toute transition du Brouillon ;
      // PRE-5 story 2.6 : vaut aussi pour le champ ± de la Pause d'une ligne.
      return (open.kind === "selector" && open.selector === "rowTarget" && !event.rowIds.includes(open.row)) ||
        (open.kind === "stepper" && open.field === "rowPause" && !event.rowIds.includes(open.row))
        ? closeAll(state)
        : state;
  }
}

/**
 * Story 3.6 (AD-15, T18, T23, FR-12-05) — la croix de retrait n'est active que sans
 * surface ouverte, ni champ ± ouvert ; sinon son appui est un appui extérieur qui
 * range l'outil sans retirer la ligne (Q44 : plus de Cellule active à ranger).
 */
export function removalEnabled(state: SheetSurfaceState): boolean {
  return state.open.kind === "none";
}

/**
 * Story 3.8 (AC5, FR-22-11 ; AD-15 T10 et T19) — ✓ et ✕ de la Feuille (et le retour
 * système) sont absorbés tant qu'un popover, un panneau ou une roue est ouvert : l'appui
 * ferme la surface sans appliquer sa valeur en cours et ne valide ni n'abandonne la
 * Feuille. Un champ ± ouvert n'absorbe rien (T19 : rangé dans le même geste). Pendant
 * le cadre D-4 d'un choix déjà appliqué (`closingKey`), rien n'est absorbé : la valeur
 * choisie est déjà dans le Brouillon.
 */
export function sheetCommandsAbsorbed(state: SheetSurfaceState): boolean {
  const open = state.open;
  return (open.kind === "popover" || open.kind === "selector") && state.closingKey !== open.key;
}
