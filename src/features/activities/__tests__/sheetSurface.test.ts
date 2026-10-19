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
    expect(INITIAL_SHEET_SURFACE_STATE).toEqual({ open: { kind: "none" }, generation: 0 });
  });

  it("PRE4-3.3/AC7 — T15, T24, T16 : rien d'ouvert, toucher un champ ouvre sa surface avec une nouvelle clé", () => {
    expect(run(touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 1 });
    expect(run(touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 1 });
    expect(run(touch(BEEP)).open).toEqual({ kind: "stepper", field: "beep", key: 1 });
  });

  it("PRE4-3.3/AC7 — second toucher sur le champ de la surface ouverte : fermeture, sans réouverture", () => {
    expect(run(touch(TOTAL), touch(TOTAL)).open).toEqual({ kind: "none" });
    expect(run(touch(PAUSE), touch(PAUSE)).open).toEqual({ kind: "none" });
  });

  // PRE-5 story 2.5 (AD-27) : `popover` est retirée ; T10 est porté sur les Sélecteurs.
  it("PRE4-3.3/AC8 — T10 : Sélecteur ouvert, toucher une autre valeur ferme sans ouvrir le champ touché", () => {
    expect(run(touch(TOTAL), touch(BEEP)).open).toEqual({ kind: "none" });
    expect(run(touch(TARGET), touch(COUNT)).open).toEqual({ kind: "none" });
    expect(run(touch(TOTAL), touch(TARGET)).open).toEqual({ kind: "none" });
    // Le geste suivant ouvre normalement.
    expect(run(touch(TOTAL), touch(BEEP), touch(BEEP)).open).toEqual({ kind: "stepper", field: "beep", key: 2 });
  });

  it("PRE4-3.3/AC8 — T20 : champ ± ouvert, toucher une autre valeur ferme le premier et ouvre le second d'un seul geste", () => {
    const state = run(touch(PAUSE), touch(BEEP));
    expect(state.open).toEqual({ kind: "stepper", field: "beep", key: 2 });
    expect(state.generation).toBe(2);
  });

  it("PRE4-3.3/AC8 — T15, T24 : champ ± ouvert, toucher un Sélecteur l'ouvre dans le même geste", () => {
    expect(run(touch(COUNT), touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 2 });
    expect(run(touch(COUNT), touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 2 });
  });

  it("PRE4-3.3/AC8 — T23 : appui extérieur — un champ ± est rangé ; un panneau ou un Sélecteur ne l'est pas par cet événement", () => {
    expect(run(touch(BEEP), { type: "outside" }).open).toEqual({ kind: "none" });
    expect(run(touch(TOTAL), { type: "outside" }).open).toEqual({ kind: "selector", selector: "total", key: 1 });
    expect(run({ type: "outside" })).toBe(INITIAL_SHEET_SURFACE_STATE);
  });

  it("PRE4-3.3/AC7 — T7, T17, T25, T26 : fermeture par la clé de la surface ouverte", () => {
    const opened = run(touch(TARGET));
    expect(sheetSurfaceReducer(opened, { type: "close", key: 1 }).open).toEqual({ kind: "none" });
  });

  it("PRE4-3.3/AC7 — T8 : rappel tardif d'une autre clé, ou alors que rien n'est ouvert, ignoré", () => {
    const newer = run(touch(TARGET), { type: "close", key: 1 }, touch(TOTAL));
    expect(sheetSurfaceReducer(newer, { type: "close", key: 1 })).toBe(newer);
    const none = run(touch(TARGET), { type: "close", key: 1 });
    expect(sheetSurfaceReducer(none, { type: "close", key: 1 })).toBe(none);
  });

  it("PRE4-3.3/AC7 — T14, T19 et sélection du tableau (Q40) : tout fermer sans appliquer", () => {
    expect(run(touch(BEEP), { type: "closeAll" }).open).toEqual({ kind: "none" });
    expect(run(touch(TOTAL), { type: "closeAll" }).open).toEqual({ kind: "none" });
  });

  it("PRE4-3.3/AC7 — clés strictement croissantes ; `sameSurface` ignore la clé", () => {
    const state = run(touch(TARGET), touch(TARGET), touch(TOTAL), touch(TOTAL), touch(BEEP));
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

  it("PRE4-3.6/T3 — cellule de Cible `UNSET` : même transition ; la roue s'ouvre sur la valeur minimale (00:01 depuis D-430, ou 1)", () => {
    expect(run(touch(ROW(3))).open).toEqual(rowSelector(3, 1));
    expect(selectorOpeningPosition("DURATION", unsetTarget())).toEqual(numberTarget(1));
    expect(selectorOpeningPosition("REPETITIONS", unsetTarget())).toEqual(numberTarget(1));
  });

  it("PRE4-3.6/T5 — ✓ du Sélecteur de ligne : surface fermée", () => {
    expect(run(touch(ROW(3)), { type: "close", key: 1 })).toEqual({ open: NONE, generation: 1 });
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
    expect(run(touch(ROW(2)), touch(ROW(3)))).toEqual({ open: NONE, generation: 1 });
    expect(run(touch(ROW(2)), touch(COUNT))).toEqual({ open: NONE, generation: 1 });
    expect(run(touch(TOTAL), touch(ROW(2))).open).toEqual(NONE);
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

  it("PRE4-3.6/T15 — ouverture d'un Sélecteur hors tableau (PRE-5 story 2.5 : plus aucun popover) : rien d'ouvert ou champ ± ouvert", () => {
    expect(run(touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 1 });
    expect(run(touch(COUNT), touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 2 });
  });

  it("PRE4-3.6/T16 — ouverture d'un champ ± hors tableau", () => {
    expect(run(touch(COUNT)).open).toEqual({ kind: "stepper", field: "count", key: 1 });
  });

  it("PRE4-3.6/T18 — croix active seulement sans surface ni champ ± ouvert ; le réordonnancement (glisser, action accessible) range l'outil ouvert dans le même geste (`closeAll` par `selectTable`), puis déplace la ligne", () => {
    expect(removalEnabled(INITIAL_SHEET_SURFACE_STATE)).toBe(true);
    expect(removalEnabled(run(touch(BEEP)))).toBe(false);
    expect(removalEnabled(run(touch(ROW(2))))).toBe(false);
    expect(removalEnabled(run(touch(TARGET)))).toBe(false);
    // Saisir la poignée, champ ± ouvert : l'outil est rangé, la ligne se déplace ensuite.
    expect(run(touch(BEEP), { type: "closeAll" })).toEqual({ open: NONE, generation: 1 });
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
    expect(run(touch(PAUSE), { type: "outside" })).toEqual({ open: NONE, generation: 1 });
  });

  it("PRE4-3.6/T24 — Cible commune ou Durée totale : Sélecteur, nouvelle clé", () => {
    expect(run(touch(TARGET)).open).toEqual({ kind: "selector", selector: "commonTarget", key: 1 });
    expect(run(touch(COUNT), touch(TOTAL)).open).toEqual({ kind: "selector", selector: "total", key: 2 });
  });

  it("PRE4-3.6/T25 — ✓ du Sélecteur commun ou du total : fermé", () => {
    expect(run(touch(TARGET), { type: "close", key: 1 })).toEqual({ open: NONE, generation: 1 });
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
    expect(run(touch(ROW(3)), { type: "rows", rowIds: [1, 2] })).toEqual({ open: NONE, generation: 1 });
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

  it("PRE4-3.6/AC5 — règle du pas de la Cible (`stepTarget`) du domaine (PRE-5 story 2.6 : les cellules n’ont plus de ± permanents)", () => {
    expect(stepTarget("DURATION", failureTarget(), 1)).toBe("unavailable");
    expect(stepTarget("DURATION", unsetTarget(), -1)).toBe("unavailable");
    expect(stepTarget("DURATION", unsetTarget(), 1)).toEqual(numberTarget(1)); // D-430
  });
});

describe("PRE4-3.8 — ✓ et ✕ de la Feuille avec une surface ouverte (AD-15 T10, T19 ; FR-22-11)", () => {
  it("PRE4-3.8/AC5 — panneau ou roue ouvert : ✓ et ✕ de la Feuille absorbés ; rien d'ouvert ou champ ± ouvert : non absorbés", () => {
    for (const surface of [TARGET, TOTAL, { kind: "selector", selector: "rowTarget", row: 2 } as const]) {
      expect({ surface, absorbed: sheetCommandsAbsorbed(run(touch(surface))) }).toEqual({ surface, absorbed: true });
    }
    expect(sheetCommandsAbsorbed(INITIAL_SHEET_SURFACE_STATE)).toBe(false);
    expect(sheetCommandsAbsorbed(run(touch(BEEP)))).toBe(false);
    // Fermeture explicite : plus rien n'est absorbé.
    expect(sheetCommandsAbsorbed(run(touch(TARGET), { type: "closeAll" }))).toBe(false);
  });
});

describe("PRE5-2.4, PRE5-2.5 — surfaces `popover` retirées (AD-27)", () => {
  it("PRE5-2.4/AC3, AC7 ; PRE5-2.5/AC1, AC2 — plus aucune surface `popover` : Mode, Type de série, Changement de côté et Enchainement sont des segmentés en ligne, sans surface", () => {
    // @ts-expect-error — `popover(mode)` est retirée (2.4 AC3).
    const mode: SheetSurface = { kind: "popover", popover: "mode" };
    // @ts-expect-error — `popover(regime)` est retirée (2.4 AC7).
    const regime: SheetSurface = { kind: "popover", popover: "regime" };
    // @ts-expect-error — `popover(side)` est retirée (2.5 AC1).
    const side: SheetSurface = { kind: "popover", popover: "side" };
    // @ts-expect-error — `popover(order)` est retirée (2.5 AC2).
    const order: SheetSurface = { kind: "popover", popover: "order" };
    expect([mode, regime, side, order]).toHaveLength(4);
    // Les Sélecteurs restants gardent T10.
    expect(run(touch(TARGET), touch(TOTAL)).open).toEqual({ kind: "none" });
  });

  it("PRE5-2.5/AC3 — Autre ouvre (ou referme) `stepper(beep)` : famille ±, sans absorption de ✓ / ✕", () => {
    expect(run(touch(BEEP)).open).toEqual({ kind: "stepper", field: "beep", key: 1 });
    expect(run(touch(BEEP), touch(BEEP)).open).toEqual({ kind: "none" });
    expect(sheetCommandsAbsorbed(run(touch(BEEP)))).toBe(false);
  });
});

/**
 * PRE-5 story 2.6 (AD-27, FR-29) — champ ± de la Pause d'une ligne, `stepper(rowPause(l))` :
 * famille ±, ligne désignée par son identité (`rowIds`), « Ligne disparue » comprise.
 */
describe("PRE5-2.6 — champ ± de la Pause d'une ligne (AD-27)", () => {
  const NONE = { kind: "none" } as const;
  const ROW_PAUSE = (row: number): SheetSurface => ({ kind: "stepper", field: "rowPause", row });
  const ROW_TARGET = (row: number): SheetSurface => ({ kind: "selector", selector: "rowTarget", row });

  it("PRE5-2.6/AC3 — toucher la cellule Pause ouvre le champ de SA ligne ; second toucher : fermeture", () => {
    expect(run(touch(ROW_PAUSE(1))).open).toEqual({ kind: "stepper", field: "rowPause", row: 1, key: 1 });
    expect(run(touch(ROW_PAUSE(1)), touch(ROW_PAUSE(1))).open).toEqual(NONE);
  });

  it("PRE5-2.6/AC3 — `sameSurface` distingue les champs de Pause par leur ligne et des autres champs ±", () => {
    const opened = run(touch(ROW_PAUSE(2))).open;
    expect(sameSurface(opened, ROW_PAUSE(2))).toBe(true);
    expect(sameSurface(opened, ROW_PAUSE(3))).toBe(false);
    expect(sameSurface(opened, PAUSE)).toBe(false);
    expect(sameSurface(run(touch(PAUSE)).open, ROW_PAUSE(2))).toBe(false);
  });

  it("PRE5-2.6/AC3 — famille ± : toucher une autre surface (Cible d'une ligne, autre Pause, champ hors tableau) la ferme et ouvre l'autre dans le même geste", () => {
    expect(run(touch(ROW_PAUSE(1)), touch(ROW_TARGET(2))).open).toEqual({ kind: "selector", selector: "rowTarget", row: 2, key: 2 });
    expect(run(touch(ROW_PAUSE(1)), touch(ROW_PAUSE(2))).open).toEqual({ kind: "stepper", field: "rowPause", row: 2, key: 2 });
    expect(run(touch(ROW_PAUSE(1)), touch(COUNT)).open).toEqual({ kind: "stepper", field: "count", key: 2 });
    // Sélecteur de ligne ouvert : T10 — fermeture sans ouvrir la Pause touchée.
    expect(run(touch(ROW_TARGET(1)), touch(ROW_PAUSE(1))).open).toEqual(NONE);
  });

  it("PRE5-2.6/AC3 — appui extérieur (croix comprise) : rangé ; croix inactive tant qu'il est ouvert ; ✓ / ✕ non absorbés", () => {
    const opened = run(touch(ROW_PAUSE(1)));
    expect(sheetSurfaceReducer(opened, { type: "outside" }).open).toEqual(NONE);
    expect(removalEnabled(opened)).toBe(false);
    expect(sheetCommandsAbsorbed(opened)).toBe(false);
  });

  it("PRE5-2.6/AC3 — « Ligne disparue » : le champ de la Pause d'une ligne retirée se ferme ; un réordonnancement ne change rien", () => {
    expect(run(touch(ROW_PAUSE(3)), { type: "rows", rowIds: [1, 2] })).toEqual({ open: NONE, generation: 1 });
    const opened = run(touch(ROW_PAUSE(3)));
    expect(sheetSurfaceReducer(opened, { type: "rows", rowIds: [3, 1, 2] })).toBe(opened);
  });
});

/**
 * PRE-5 story 2.2 (AD-26, AD-27, Q47) — surface `keyboard(champ)` : ouverte par le focus
 * d'un champ clavier, famille ± (même geste pour ouvrir une autre surface), une seule
 * surface, ✓ / ✕ absorbés, « Ligne disparue » et perte de focus.
 */
describe("PRE5-2.2 — surface clavier (AD-27)", () => {
  const NONE = { kind: "none" } as const;
  const LOAD = (row: number | "uniform"): SheetSurface => ({ kind: "keyboard", field: { kind: "load", row } });
  const ROW_TARGET = (row: number): SheetSurface => ({ kind: "selector", selector: "rowTarget", row });
  const blur = (row: number | "uniform"): SheetSurfaceEvent => ({ type: "blur", field: { kind: "load", row } });

  it("PRE5-2.2/AC8 — ouverture par le focus ; même champ touché à nouveau : état inchangé (pas de fermeture)", () => {
    const opened = run(touch(LOAD(2)));
    expect(opened.open).toEqual({ kind: "keyboard", field: { kind: "load", row: 2 }, key: 1 });
    expect(sheetSurfaceReducer(opened, touch(LOAD(2)))).toBe(opened);
  });

  it("PRE5-2.2/AC8 — une seule surface : Suivant ou une autre surface ouvre l'autre dans le même geste ; un champ ± ouvert cède au clavier", () => {
    expect(run(touch(LOAD(1)), touch(LOAD(2))).open).toEqual({ kind: "keyboard", field: { kind: "load", row: 2 }, key: 2 });
    expect(run(touch(LOAD(1)), touch(ROW_TARGET(2))).open).toEqual({ kind: "selector", selector: "rowTarget", row: 2, key: 2 });
    expect(run(touch(LOAD("uniform")), touch(COUNT)).open).toEqual({ kind: "stepper", field: "count", key: 2 });
    expect(run(touch(COUNT), touch(LOAD("uniform"))).open).toEqual({ kind: "keyboard", field: { kind: "load", row: "uniform" }, key: 2 });
    // Sélecteur ouvert : T10, le champ touché ne s'ouvre pas.
    expect(run(touch(TARGET), touch(LOAD("uniform"))).open).toEqual(NONE);
  });

  it("PRE5-2.2/AC8 — `sameSurface` distingue les champs clavier ; charge commune ≠ ligne ; phase ≠ charge", () => {
    const opened = run(touch(LOAD(2))).open;
    expect(sameSurface(opened, LOAD(2))).toBe(true);
    expect(sameSurface(opened, LOAD(3))).toBe(false);
    expect(sameSurface(opened, LOAD("uniform"))).toBe(false);
    expect(sameSurface(opened, { kind: "keyboard", field: { kind: "phaseLabel", phase: 2 } })).toBe(false);
    expect(sameSurface(opened, ROW_TARGET(2))).toBe(false);
  });

  it("PRE5-2.2/AC1 — ✓ et ✕ absorbés pendant une saisie ; la croix est inactive ; après fermeture, plus rien d'absorbé", () => {
    const opened = run(touch(LOAD("uniform")));
    expect(sheetCommandsAbsorbed(opened)).toBe(true);
    expect(removalEnabled(opened)).toBe(false);
    const closed = sheetSurfaceReducer(opened, { type: "closeAll" });
    expect(closed.open).toEqual(NONE);
    expect(sheetCommandsAbsorbed(closed)).toBe(false);
  });

  it("PRE5-2.2/AC1 — perte du focus : ne ferme que le champ ouvert ; un `blur` tardif d'un autre champ est ignoré", () => {
    expect(run(touch(LOAD(1)), blur(1)).open).toEqual(NONE);
    const next = run(touch(LOAD(1)), touch(LOAD(2)));
    expect(sheetSurfaceReducer(next, blur(1))).toBe(next);
    expect(sheetSurfaceReducer(INITIAL_SHEET_SURFACE_STATE, blur(1))).toBe(INITIAL_SHEET_SURFACE_STATE);
  });

  it("PRE5-2.2/AC1 — appui extérieur : le clavier est rangé ; « Ligne disparue » ferme le champ d'une ligne retirée, jamais la charge commune", () => {
    expect(run(touch(LOAD(2)), { type: "outside" }).open).toEqual(NONE);
    expect(run(touch(LOAD(3)), { type: "rows", rowIds: [1, 2] }).open).toEqual(NONE);
    const reordered = run(touch(LOAD(3)));
    expect(sheetSurfaceReducer(reordered, { type: "rows", rowIds: [3, 1, 2] })).toBe(reordered);
    const uniform = run(touch(LOAD("uniform")));
    expect(sheetSurfaceReducer(uniform, { type: "rows", rowIds: [] })).toBe(uniform);
  });
});
