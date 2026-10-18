import { describe, expect, it } from "@jest/globals";

import {
  failureTarget,
  numberTarget,
  selectorOpeningPosition,
  stepTarget,
  unsetTarget,
} from "@/domain/activities/ExecutionParameters";
import {
  INITIAL_SHEET_SURFACE_STATE,
  removalEnabled,
  sameSurface,
  sheetCommandsAbsorbed,
  sheetSurfaceReducer,
  type SheetSurface,
  type SheetSurfaceEvent,
  type SheetSurfaceState,
} from "@/features/activities/sheetSurface";

/**
 * PRE-4 story 3.3 (AD-15) — réducteur d'interface de la surface ouverte de la
 * Feuille, testé sans rendu : transitions T7, T8, T10, T15 à T17, T19, T20, T22,
 * T23 et T24 (une ligne de la table par test, attendus littéraux).
 */

const MODE: SheetSurface = { kind: "popover", popover: "mode" };
const SIDE: SheetSurface = { kind: "popover", popover: "side" };
const ORDER: SheetSurface = { kind: "popover", popover: "order" };
const REGIME: SheetSurface = { kind: "popover", popover: "regime" };
const TARGET: SheetSurface = { kind: "selector", selector: "commonTarget" };
const TOTAL: SheetSurface = { kind: "selector", selector: "total" };
const COUNT: SheetSurface = { kind: "stepper", field: "count" };
const PAUSE: SheetSurface = { kind: "stepper", field: "pause" };
const BEEP: SheetSurface = { kind: "stepper", field: "beep" };

const run = (...events: SheetSurfaceEvent[]): SheetSurfaceState =>
  events.reduce(sheetSurfaceReducer, INITIAL_SHEET_SURFACE_STATE);
const touch = (surface: SheetSurface): SheetSurfaceEvent => ({ type: "touch", surface });

describe("PRE4-3.3 — réducteur de surface (AD-15)", () => {
  it("PRE4-3.3/AC7 — T1 : à l'ouverture de la Feuille, aucune surface ouverte", () => {
    expect(INITIAL_SHEET_SURFACE_STATE).toEqual({ open: { kind: "none" }, closingKey: null, generation: 0 });
  });

  it("PRE4-3.3/AC7 — T15, T24, T16 : rien d'ouvert, toucher un champ ouvre sa surface avec une nouvelle clé", () => {
    expect(run(touch(REGIME)).open).toEqual({ kind: "popover", popover: "regime", key: 1 });
    expect(run(touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 1 });
    expect(run(touch(BEEP)).open).toEqual({ kind: "stepper", field: "beep", key: 1 });
  });

  it("PRE4-3.3/AC7 — second toucher sur le champ de la surface ouverte : fermeture, sans réouverture", () => {
    expect(run(touch(MODE), touch(MODE)).open).toEqual({ kind: "none" });
    expect(run(touch(PAUSE), touch(PAUSE)).open).toEqual({ kind: "none" });
  });

  it("PRE4-3.3/AC8 — T10 : popover ou Sélecteur ouvert, toucher une autre valeur ferme sans ouvrir le champ touché", () => {
    expect(run(touch(SIDE), touch(BEEP)).open).toEqual({ kind: "none" });
    expect(run(touch(TARGET), touch(COUNT)).open).toEqual({ kind: "none" });
    expect(run(touch(MODE), touch(REGIME)).open).toEqual({ kind: "none" });
    // Le geste suivant ouvre normalement.
    expect(run(touch(SIDE), touch(BEEP), touch(BEEP)).open).toEqual({ kind: "stepper", field: "beep", key: 2 });
  });

  it("PRE4-3.3/AC8 — T20 : champ ± ouvert, toucher une autre valeur ferme le premier et ouvre le second d'un seul geste", () => {
    const state = run(touch(PAUSE), touch(BEEP));
    expect(state.open).toEqual({ kind: "stepper", field: "beep", key: 2 });
    expect(state.generation).toBe(2);
  });

  it("PRE4-3.3/AC8 — T15, T24 : champ ± ouvert, toucher un popover ou un Sélecteur l'ouvre dans le même geste", () => {
    expect(run(touch(COUNT), touch(ORDER)).open).toEqual({ kind: "popover", popover: "order", key: 2 });
    expect(run(touch(COUNT), touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 2 });
  });

  it("PRE4-3.3/AC8 — T22 : les ± ne déclenchent aucun événement de surface ; le champ reste ouvert, même clé, y compris après le − de N", () => {
    // Un pas ± ne modifie que le Brouillon ; seule la règle de N = 1 émet `prune`, qui ne vise
    // jamais un champ ± : le champ de N reste ouvert avec sa clé.
    const state = run(touch(COUNT), { type: "prune", removed: [ORDER, REGIME] });
    expect(state.open).toEqual({ kind: "stepper", field: "count", key: 1 });
  });

  it("PRE4-3.3/AC8 — T23 : appui extérieur — un champ ± est rangé ; un popover, un panneau ou un Sélecteur ne l'est pas par cet événement", () => {
    expect(run(touch(BEEP), { type: "outside" }).open).toEqual({ kind: "none" });
    expect(run(touch(SIDE), { type: "outside" }).open).toEqual({ kind: "popover", popover: "side", key: 1 });
    expect(run({ type: "outside" })).toBe(INITIAL_SHEET_SURFACE_STATE);
  });

  it("PRE4-3.3/AC7 — T7, T17, T25, T26 : fermeture par la clé de la surface ouverte", () => {
    const opened = run(touch(MODE));
    expect(sheetSurfaceReducer(opened, { type: "close", key: 1 }).open).toEqual({ kind: "none" });
  });

  it("PRE4-3.3/AC7 — T8 : rappel tardif d'une autre clé, ou alors que rien n'est ouvert, ignoré", () => {
    const newer = run(touch(MODE), { type: "close", key: 1 }, touch(SIDE));
    expect(sheetSurfaceReducer(newer, { type: "close", key: 1 })).toBe(newer);
    const none = run(touch(MODE), { type: "close", key: 1 });
    expect(sheetSurfaceReducer(none, { type: "close", key: 1 })).toBe(none);
  });

  it("PRE4-3.3/AC4 — D-4 : choix appliqué, la surface reste ouverte le temps du cadre, puis se ferme ; un `closed` périmé est ignoré", () => {
    const choosing = run(touch(SIDE), { type: "choose", key: 1 });
    expect(choosing).toEqual({ open: { kind: "popover", popover: "side", key: 1 }, closingKey: 1, generation: 1 });
    expect(sheetSurfaceReducer(choosing, { type: "closed", key: 1 })).toEqual({ open: { kind: "none" }, closingKey: null, generation: 1 });
    expect(sheetSurfaceReducer(choosing, { type: "closed", key: 7 })).toBe(choosing);
  });

  it("PRE4-3.3/AC5 — Q38 : un popover d'Ordre (ou de Régime) ouvert se ferme quand N passe à 1 ; une autre surface reste", () => {
    expect(run(touch(ORDER), { type: "prune", removed: [ORDER, REGIME] }).open).toEqual({ kind: "none" });
    expect(run(touch(REGIME), { type: "prune", removed: [ORDER, REGIME] }).open).toEqual({ kind: "none" });
    expect(run(touch(SIDE), { type: "prune", removed: [ORDER, REGIME] }).open).toEqual({ kind: "popover", popover: "side", key: 1 });
  });

  it("PRE4-3.3/AC7 — T14, T19 et sélection du tableau (Q40) : tout fermer sans appliquer", () => {
    expect(run(touch(BEEP), { type: "closeAll" }).open).toEqual({ kind: "none" });
    expect(run(touch(TOTAL), { type: "closeAll" }).open).toEqual({ kind: "none" });
  });

  it("PRE4-3.3/AC7 — clés strictement croissantes ; `sameSurface` ignore la clé", () => {
    const state = run(touch(MODE), touch(MODE), touch(SIDE), touch(SIDE), touch(BEEP));
    expect(state.open).toEqual({ kind: "stepper", field: "beep", key: 3 });
    expect(sameSurface(state.open, BEEP)).toBe(true);
    expect(sameSurface(state.open, PAUSE)).toBe(false);
    expect(sameSurface({ kind: "none" }, BEEP)).toBe(false);
  });
});

/**
 * PRE-4 story 3.6, réduite par Q44 (Hermann, 2026-10-17 : ni Cellule active ni Pied
 * commun) — transitions d'AD-15 encore applicables avec le Sélecteur de la Cible d'une
 * ligne, `selector(rowTarget(l))` ; un test par transition (attendus littéraux). Sans
 * objet (Q44) : T4, T9, T11, T12, R-3.6-08, et la partie `activeCell` de T5, T6, T7,
 * T13, T21 et T27. La ligne est désignée par son IDENTITÉ (`rowIds`).
 */
describe("PRE4-3.6 — table de transitions d'AD-15 avec le Sélecteur de ligne (Q44)", () => {
  const NONE = { kind: "none" } as const;
  const ROW = (row: number): SheetSurface => ({ kind: "selector", selector: "rowTarget", row });
  const rowSelector = (row: number, key: number) => ({ kind: "selector", selector: "rowTarget", row, key });

  it("PRE4-3.6/T1 — ouverture de la Feuille : aucune surface ; croix de retrait active", () => {
    expect(INITIAL_SHEET_SURFACE_STATE.open).toEqual(NONE);
    expect(removalEnabled(INITIAL_SHEET_SURFACE_STATE)).toBe(true);
  });

  it("PRE4-3.6/T2 — toucher la valeur d'une cellule de Cible (`NUMBER` ou `FAILURE`) : Sélecteur de sa ligne, nouvelle clé", () => {
    expect(run(touch(ROW(2))).open).toEqual(rowSelector(2, 1));
  });

  it("PRE4-3.6/T3 — cellule de Cible `UNSET` : même transition ; la roue s'ouvre sur la valeur minimale (00:05 ou 1)", () => {
    expect(run(touch(ROW(3))).open).toEqual(rowSelector(3, 1));
    expect(selectorOpeningPosition("DURATION", unsetTarget())).toEqual(numberTarget(5));
    expect(selectorOpeningPosition("REPETITIONS", unsetTarget())).toEqual(numberTarget(1));
  });

  it("PRE4-3.6/T5 — ✓ du Sélecteur de ligne : surface fermée", () => {
    expect(run(touch(ROW(3)), { type: "close", key: 1 })).toEqual({ open: NONE, closingKey: null, generation: 1 });
  });

  it("PRE4-3.6/T6 — ✕ du Sélecteur de ligne : surface fermée, rien n'est appliqué (le réducteur ne touche jamais le Brouillon)", () => {
    const state = run(touch(ROW(3)), { type: "close", key: 1 });
    expect(state.open).toEqual(NONE);
    expect(removalEnabled(state)).toBe(true);
  });

  it("PRE4-3.6/T7 — toucher hors du panneau ou geste d'échappement (même clé) : fermeture sans application", () => {
    expect(run(touch(ROW(2)), { type: "close", key: 1 }).open).toEqual(NONE);
  });

  it("PRE4-3.6/T8 — rappel tardif après ✕, ou d'une autre clé : ignoré", () => {
    const closed = run(touch(ROW(3)), { type: "close", key: 1 });
    expect(sheetSurfaceReducer(closed, { type: "close", key: 1 })).toBe(closed);
    const newer = run(touch(ROW(3)), { type: "close", key: 1 }, touch(ROW(2)));
    expect(sheetSurfaceReducer(newer, { type: "close", key: 1 })).toBe(newer);
  });

  it("PRE4-3.6/T10 — Sélecteur de ligne ouvert : toucher une autre valeur ou un autre champ ferme sans appliquer, sans rien ouvrir", () => {
    expect(run(touch(ROW(2)), touch(ROW(3)))).toEqual({ open: NONE, closingKey: null, generation: 1 });
    expect(run(touch(ROW(2)), touch(COUNT))).toEqual({ open: NONE, closingKey: null, generation: 1 });
    expect(run(touch(MODE), touch(ROW(2))).open).toEqual(NONE);
    expect(run(touch(TARGET), touch(ROW(2))).open).toEqual(NONE);
  });

  it("PRE4-3.6/T13 — appui extérieur sans surface : rien à ranger, état inchangé ; la croix reste active", () => {
    const state = run(touch(ROW(2)), { type: "close", key: 1 });
    expect(sheetSurfaceReducer(state, { type: "outside" })).toBe(state);
    expect(removalEnabled(state)).toBe(true);
  });

  it("PRE4-3.6/T14 — repli du tableau par le chevron : le Sélecteur de ligne se ferme", () => {
    expect(run(touch(ROW(2)), { type: "closeAll" }).open).toEqual(NONE);
  });

  it("PRE4-3.6/T15 — ouverture d'un popover : rien d'ouvert ou champ ± ouvert", () => {
    expect(run(touch(SIDE)).open).toEqual({ kind: "popover", popover: "side", key: 1 });
    expect(run(touch(COUNT), touch(REGIME)).open).toEqual({ kind: "popover", popover: "regime", key: 2 });
  });

  it("PRE4-3.6/T16 — ouverture d'un champ ± hors tableau", () => {
    expect(run(touch(COUNT)).open).toEqual({ kind: "stepper", field: "count", key: 1 });
  });

  it("PRE4-3.6/T17 — choix dans un popover : appliqué puis fermé (cadre D-4)", () => {
    expect(run(touch(REGIME), { type: "choose", key: 1 }, { type: "closed", key: 1 })).toEqual({ open: NONE, closingKey: null, generation: 1 });
  });

  it("PRE4-3.6/T18 — croix active seulement sans surface ni champ ± ouvert ; le réordonnancement (glisser, action accessible) range l'outil ouvert dans le même geste (`closeAll` par `selectTable`), puis déplace la ligne", () => {
    expect(removalEnabled(INITIAL_SHEET_SURFACE_STATE)).toBe(true);
    expect(removalEnabled(run(touch(BEEP)))).toBe(false);
    expect(removalEnabled(run(touch(ROW(2))))).toBe(false);
    expect(removalEnabled(run(touch(MODE)))).toBe(false);
    // Saisir la poignée, champ ± ouvert : l'outil est rangé, la ligne se déplace ensuite.
    expect(run(touch(BEEP), { type: "closeAll" })).toEqual({ open: NONE, closingKey: null, generation: 1 });
  });

  it("PRE4-3.6/T19 — ✓ ou ✕ de la Feuille : un champ ± ouvert est rangé dans le même geste", () => {
    expect(run(touch(COUNT), { type: "closeAll" }).open).toEqual(NONE);
  });

  it("PRE4-3.6/T20 — champ ± ouvert, toucher une autre valeur : le second s'ouvre d'un seul geste", () => {
    expect(run(touch(COUNT), touch(PAUSE)).open).toEqual({ kind: "stepper", field: "pause", key: 2 });
  });

  it("PRE4-3.6/T21 — champ ± ouvert, toucher la valeur d'une cellule de Cible : stepper fermé et Sélecteur ouvert dans le même geste", () => {
    expect(run(touch(COUNT), touch(ROW(2))).open).toEqual(rowSelector(2, 2));
  });

  it("PRE4-3.6/T22 — − de N avec son champ ouvert : même clé ; « Ligne disparue » sans effet sur un stepper", () => {
    expect(run(touch(COUNT), { type: "rows", rowIds: [1, 2] }).open).toEqual({ kind: "stepper", field: "count", key: 1 });
  });

  it("PRE4-3.6/T23 — appui extérieur (croix comprise) pendant qu'un stepper est ouvert : il est rangé", () => {
    expect(run(touch(PAUSE), { type: "outside" })).toEqual({ open: NONE, closingKey: null, generation: 1 });
  });

  it("PRE4-3.6/T24 — Cible commune ou Durée totale : Sélecteur, nouvelle clé", () => {
    expect(run(touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 1 });
    expect(run(touch(COUNT), touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 2 });
  });

  it("PRE4-3.6/T25 — ✓ du Sélecteur commun ou du total : fermé", () => {
    expect(run(touch(TARGET), { type: "close", key: 1 })).toEqual({ open: NONE, closingKey: null, generation: 1 });
  });

  it("PRE4-3.6/T26 — ✕ du Sélecteur commun ou du total : fermé ; rappel tardif ignoré", () => {
    const closed = run(touch(TOTAL), { type: "close", key: 1 });
    expect(closed.open).toEqual(NONE);
    expect(sheetSurfaceReducer(closed, { type: "close", key: 1 })).toBe(closed);
  });

  it("PRE4-3.6/T27 — `Annuler` du retrait : la ligne revient (nouvelle liste de lignes) ; la surface est inchangée", () => {
    const stepper = run(touch(BEEP));
    expect(sheetSurfaceReducer(stepper, { type: "rows", rowIds: [1, 2, 3] })).toBe(stepper);
    expect(sheetSurfaceReducer(INITIAL_SHEET_SURFACE_STATE, { type: "rows", rowIds: [1, 2, 3] })).toBe(INITIAL_SHEET_SURFACE_STATE);
  });

  it("PRE4-3.6/S4 — T16, T22, T21 : champ de N ouvert, −, puis valeur de la Cible de la ligne 2 d'un seul geste ; variante T10", () => {
    let state = run(touch(COUNT));
    state = sheetSurfaceReducer(state, { type: "rows", rowIds: [1, 2] });
    expect(state.open).toEqual({ kind: "stepper", field: "count", key: 1 });
    state = sheetSurfaceReducer(state, touch(ROW(2)));
    expect(state.open).toEqual(rowSelector(2, 2));
    expect(run(touch(ROW(2)), touch(COUNT)).open).toEqual(NONE);
  });

  it("PRE4-3.6 — « Ligne disparue » : un Sélecteur de ligne dont la ligne n'existe plus se ferme ; un réordonnancement ne change rien", () => {
    expect(run(touch(ROW(3)), { type: "rows", rowIds: [1, 2] })).toEqual({ open: NONE, closingKey: null, generation: 1 });
    const opened = run(touch(ROW(3)));
    expect(sheetSurfaceReducer(opened, { type: "rows", rowIds: [3, 1, 2] })).toBe(opened);
  });

  it("PRE4-3.6 — `sameSurface` distingue les Sélecteurs de ligne par leur ligne", () => {
    const opened = run(touch(ROW(2))).open;
    expect(sameSurface(opened, ROW(2))).toBe(true);
    expect(sameSurface(opened, ROW(3))).toBe(false);
    expect(sameSurface(opened, TARGET)).toBe(false);
    // Second toucher sur la même valeur : fermeture sans application.
    expect(run(touch(ROW(2)), touch(ROW(2))).open).toEqual(NONE);
  });

  it("PRE4-3.6/AC5 — règle du pas de la Cible (`stepTarget`), utilisée par les ± permanents des cellules", () => {
    expect(stepTarget("DURATION", failureTarget(), 1)).toBe("unavailable");
    expect(stepTarget("DURATION", unsetTarget(), -1)).toBe("unavailable");
    expect(stepTarget("DURATION", unsetTarget(), 1)).toEqual(numberTarget(5));
  });
});

describe("PRE4-3.8 — ✓ et ✕ de la Feuille avec une surface ouverte (AD-15 T10, T19 ; FR-22-11)", () => {
  it("PRE4-3.8/AC5 — popover, panneau ou roue ouvert : ✓ et ✕ de la Feuille absorbés ; rien d'ouvert, champ ± ouvert ou cadre D-4 d'un choix appliqué : non absorbés", () => {
    for (const surface of [MODE, SIDE, ORDER, REGIME, TARGET, TOTAL, { kind: "selector", selector: "rowTarget", row: 2 } as const]) {
      expect({ surface, absorbed: sheetCommandsAbsorbed(run(touch(surface))) }).toEqual({ surface, absorbed: true });
    }
    expect(sheetCommandsAbsorbed(INITIAL_SHEET_SURFACE_STATE)).toBe(false);
    expect(sheetCommandsAbsorbed(run(touch(BEEP)))).toBe(false);
    // D-4 : la valeur choisie est déjà dans le Brouillon ; ✓ ou ✕ de la Feuille agissent.
    expect(sheetCommandsAbsorbed(run(touch(SIDE), { type: "choose", key: 1 }))).toBe(false);
    // Fermeture explicite : plus rien n'est absorbé.
    expect(sheetCommandsAbsorbed(run(touch(TARGET), { type: "closeAll" }))).toBe(false);
  });
});
