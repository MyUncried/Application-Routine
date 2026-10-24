/**
 * PRE-4 story 3.3 (AD-15, FR-03-05, FR-03-10, FR-10-05) — surface ouverte de la
 * Feuille Paramètres d'exécution : réducteur d'interface pur, testable sans rendu.
 *
 * `open` porte AU PLUS une surface : un Sélecteur (roue de la Cible commune ou de
 * la Durée de l'exercice) ou un champ ± hors tableau (`stepper`). PRE-5 story 2.4
 * (AD-27) : le Mode et le Type de série (ex-Régime) sont des segmentés en ligne,
 * sans surface ; `popover(mode)` et `popover(regime)` sont retirées. PRE-5 story 2.5
 * (AD-27) : le Changement de côté et l'Enchainement aussi ; `popover(side | order)`
 * est retirée et la famille `popover` n'existe plus. C'est un état
 * d'interface de la Feuille, jamais une donnée du Brouillon du domaine (AD-2) :
 * aucune transition de ce réducteur ne modifie le Brouillon, donc aucune
 * n'invalide l'annulation d'un retrait (Q29).
 *
 * Chaque ouverture reçoit une clé (`key`) tirée d'un compteur strictement
 * croissant de la Feuille (`generation`). Une fermeture qui porte une autre clé,
 * ou qui arrive alors que rien n'est ouvert, est ignorée (rappel tardif, T8).
 *
 * Familles (AD-15, Q41) :
 * - Sélecteurs (`selector`) : panneau sans flèche (iOS) ou contrôle en ligne
 *   (Android, web). Un toucher sur un autre champ pendant qu'ils sont ouverts les
 *   ferme sans appliquer et n'ouvre pas le champ touché (T10) ;
 * - champ ± (`stepper`) : état React Native. Toucher une autre valeur ou une ligne
 *   de Sélecteur le ferme et ouvre l'autre surface dans le même
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
 *
 * PRE-5 story 2.2 (AD-26, AD-27) : surface `keyboard(champ)`, un champ clavier focalisé
 * (charge commune ou d'une ligne ; libellé de phase en 2.8). Elle suit la famille ± : une
 * autre surface touchée s'ouvre dans le même geste, un appui extérieur la range, « Ligne
 * disparue » la ferme ; toucher le même champ ne la ferme pas (le champ garde le focus).
 * La perte du focus natif (`blur`) ne ferme que si ce champ est la surface ouverte. ✓ et ✕
 * sont absorbés pendant une saisie (Q47 : premier appui = sortie du champ).
 *
 * PRE-5, D-434 (décision de Hermann du 19/10, QD-434-1) : les cellules Cible et Pause du
 * tableau des séries variables se saisissent au clavier numérique, dans la cellule ; elles
 * deviennent des champs de la famille `keyboard` (`rowTarget`, `rowPause`). Les surfaces
 * `selector(rowTarget)` (roue de cellule, story 3.6) et `stepper(rowPause)` (± de la Pause
 * d'une cellule, story 2.6) décrites ci-dessus sont retirées.
 *
 * PRE-5 story 2.8 (AD-27, D-432, D-434) : phases de l'exercice. `stepper(phaseCount)` : le
 * stepper du nombre de phases, révélé dans l'option Avec de la ligne « Phases de l'exercice »
 * (famille ±). `keyboard(phaseLabel)` et `keyboard(phaseDuration)` : libellé (clavier texte) et
 * durée (clavier numérique MMSS, D-434 : remplace `selector(phaseDuration)`) de la phase
 * d'identité `phase` (`id` du Brouillon, jamais un rang). « Phase disparue » (`phases`) : un
 * champ clavier de phase dont la phase n'existe plus se ferme, comme « Ligne disparue ».
 */

/**
 * PRE-7 story B.3 (B5, D-445) : `sideOrder`, le déroulant de l'Enchainement ouvert depuis l'option
 * Avec sélectionnée du Changement de côté (remplace le menu natif de RC-6). Famille Sélecteur : un
 * toucher ailleurs le ferme sans appliquer et n'ouvre pas le champ touché (T10), ✓ et ✕ sont
 * absorbés tant qu'il est ouvert, sa fermeture passe par sa clé.
 */
export type SheetSelector = "commonTarget" | "total" | "sideOrder";
/** Valeurs numériques hors tableau réglées par ± (FR-10-05) ; PRE-5 story 2.8 : nombre de phases. */
export type SheetStepperField = "count" | "pause" | "sideRecovery" | "beep" | "countdown" | "end" | "phaseCount";

/**
 * PRE-5 story 2.2 : champ clavier de la Feuille — charge commune (`"uniform"`) ou d'une ligne
 * d'identité `row` (`rowIds`, jamais un rang) ; libellé de la phase d'identité `phase` (2.8).
 * D-434 : Cible et Pause de la ligne d'identité `row` ; durée de la phase d'identité `phase` (2.8).
 */
export type KeyboardFieldId =
  | { readonly kind: "load"; readonly row: number | "uniform" }
  | { readonly kind: "rowTarget"; readonly row: number }
  | { readonly kind: "rowPause"; readonly row: number }
  | { readonly kind: "phaseLabel"; readonly phase: number }
  | { readonly kind: "phaseDuration"; readonly phase: number };

/** PRE-5 story 2.8 : champ clavier d'une phase (libellé ou durée). */
export type PhaseKeyboardFieldId = Extract<KeyboardFieldId, { readonly phase: number }>;

/** PRE-5 story 2.8 : le champ est un champ d'une phase (libellé ou durée). */
export function isPhaseKeyboardField(field: KeyboardFieldId): field is PhaseKeyboardFieldId {
  return field.kind === "phaseLabel" || field.kind === "phaseDuration";
}

/** Même champ clavier. */
export function sameKeyboardField(a: KeyboardFieldId, b: KeyboardFieldId): boolean {
  if (isPhaseKeyboardField(a)) return isPhaseKeyboardField(b) && b.kind === a.kind && a.phase === b.phase;
  return !isPhaseKeyboardField(b) && b.kind === a.kind && b.row === a.row;
}

/** D-434 : ligne d'identité d'un champ clavier du tableau des séries, ou `null` (charge commune, phase). */
export function keyboardFieldRow(field: KeyboardFieldId): number | null {
  if (isPhaseKeyboardField(field) || field.row === "uniform") return null;
  return field.row;
}

/** PRE-5 story 2.8 : phase d'identité d'un champ clavier de phase, ou `null`. */
export function keyboardFieldPhase(field: KeyboardFieldId): number | null {
  return isPhaseKeyboardField(field) ? field.phase : null;
}

export type SheetSurface =
  | { readonly kind: "selector"; readonly selector: SheetSelector }
  | { readonly kind: "stepper"; readonly field: SheetStepperField }
  /** PRE-5 story 2.2 : champ clavier focalisé (D-434 : Cible et Pause d'une ligne comprises). */
  | { readonly kind: "keyboard"; readonly field: KeyboardFieldId };

export type OpenSurface = { readonly kind: "none" } | (SheetSurface & { readonly key: number });

export type SheetSurfaceState = {
  readonly open: OpenSurface;
  /** Dernière clé attribuée (compteur strictement croissant). */
  readonly generation: number;
};

export type SheetSurfaceEvent =
  /** Toucher le champ d'une surface (pastille de valeur, valeur d'une cellule de Cible). */
  | { readonly type: "touch"; readonly surface: SheetSurface }
  /** Fermeture sans application ou après application immédiate (✓, ✕, toucher extérieur d'un panneau, `onIsPresentedChange(false)`). */
  | { readonly type: "close"; readonly key: number }
  /** Appui extérieur dans le corps de la Feuille : range un champ ± ouvert (T23). */
  | { readonly type: "outside" }
  /** Tout fermer sans appliquer (action dans le tableau, repli par le chevron). */
  | { readonly type: "closeAll" }
  /** Story 3.6 (« Ligne disparue ») : identités des lignes du Brouillon après une transition. */
  | { readonly type: "rows"; readonly rowIds: readonly number[] }
  /** PRE-5 story 2.8 (« Phase disparue ») : identités des phases du Brouillon après une transition. */
  | { readonly type: "phases"; readonly phaseIds: readonly number[] }
  /** PRE-5 story 2.2 : perte du focus natif d'un champ clavier ; ne ferme que si ce champ est ouvert. */
  | { readonly type: "blur"; readonly field: KeyboardFieldId };

export const INITIAL_SHEET_SURFACE_STATE: SheetSurfaceState = { open: { kind: "none" }, generation: 0 };

const NONE: OpenSurface = { kind: "none" };

/** Même surface (genre et cible), clé ignorée. */
export function sameSurface(a: OpenSurface | SheetSurface, b: SheetSurface): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "selector":
      return b.kind === "selector" && a.selector === b.selector;
    case "stepper":
      return b.kind === "stepper" && a.field === b.field;
    case "keyboard":
      return b.kind === "keyboard" && sameKeyboardField(a.field, b.field);
    default:
      return false;
  }
}

function openNew(state: SheetSurfaceState, surface: SheetSurface): SheetSurfaceState {
  const key = state.generation + 1;
  return { open: { ...surface, key }, generation: key };
}

const closeAll = (state: SheetSurfaceState): SheetSurfaceState =>
  state.open.kind === "none" ? state : { ...state, open: NONE };

export function sheetSurfaceReducer(state: SheetSurfaceState, event: SheetSurfaceEvent): SheetSurfaceState {
  const open = state.open;
  switch (event.type) {
    case "touch": {
      // T15, T16, T24 ; story 3.6 T2, T3 : rien d'ouvert — la surface touchée s'ouvre.
      if (open.kind === "none") return openNew(state, event.surface);
      // PRE-5 story 2.2 : même champ clavier (focus redonné, ou Précédent / Suivant déjà
      // annoncé) — état inchangé, le champ reste ouvert.
      if (open.kind === "keyboard" && sameSurface(open, event.surface)) return state;
      // Second toucher sur le champ de la surface ouverte : fermeture sans application.
      if (sameSurface(open, event.surface)) return closeAll(state);
      // T20, T15, T24 ; story 3.6 T21 : champ ± ouvert — il se ferme et l'autre surface
      // s'ouvre d'un seul geste. PRE-5 story 2.2 : un champ clavier suit la même famille.
      if (open.kind === "stepper" || open.kind === "keyboard") return openNew(state, event.surface);
      // T10 : Sélecteur ouvert — fermeture sans application ; le champ touché ne s'ouvre pas.
      return closeAll(state);
    }
    case "close":
      // T5, T6, T7, T17, T25, T26 ; T8 : une autre clé, ou rien d'ouvert, est ignorée.
      return open.kind !== "none" && open.key === event.key ? closeAll(state) : state;
    case "outside":
      // T23 : seul un champ ± est rangé par un appui extérieur dans le corps ; les
      // panneaux ont leur propre fermeture extérieure (T7).
      // PRE-5 story 2.2 : un champ clavier aussi.
      return open.kind === "stepper" || open.kind === "keyboard" ? closeAll(state) : state;
    case "closeAll":
      return closeAll(state);
    case "rows": {
      // « Ligne disparue » (AD-15) : règle défensive après toute transition du Brouillon ;
      // PRE-5 story 2.2, D-434 : vaut pour les champs clavier d'une ligne (Cible, Pause, charge).
      const row = open.kind === "keyboard" ? keyboardFieldRow(open.field) : null;
      return row !== null && !event.rowIds.includes(row) ? closeAll(state) : state;
    }
    case "phases": {
      // PRE-5 story 2.8 (« Phase disparue ») : un champ clavier de phase dont la phase n'existe
      // plus se ferme ; le stepper du nombre de phases aussi quand il n'y a plus de phase (Sans).
      if (open.kind === "stepper") {
        return open.field === "phaseCount" && event.phaseIds.length === 0 ? closeAll(state) : state;
      }
      const phase = open.kind === "keyboard" ? keyboardFieldPhase(open.field) : null;
      return phase !== null && !event.phaseIds.includes(phase) ? closeAll(state) : state;
    }
    case "blur":
      return open.kind === "keyboard" && sameKeyboardField(open.field, event.field) ? closeAll(state) : state;
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
 * système) sont absorbés tant qu'un panneau ou une roue est ouvert : l'appui
 * ferme la surface sans appliquer sa valeur en cours et ne valide ni n'abandonne la
 * Feuille. Un champ ± ouvert n'absorbe rien (T19 : rangé dans le même geste). PRE-5 story
 * 2.5 : plus aucun choix à cadre D-4 (`choose`, `closed`, `closingKey` retirés avec les
 * derniers sélecteurs segmentés), ni `prune` (l'Enchainement n'a plus de surface).
 */
export function sheetCommandsAbsorbed(state: SheetSurfaceState): boolean {
  const open = state.open;
  // PRE-5 story 2.2 (AD-27, Q47) : une saisie au clavier absorbe aussi ✓ et ✕ (premier
  // appui = sortie du champ, valeur appliquée).
  if (open.kind === "keyboard") return true;
  return open.kind === "selector";
}
