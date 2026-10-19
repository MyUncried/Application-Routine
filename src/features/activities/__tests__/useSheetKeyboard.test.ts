import { describe, expect, it } from "@jest/globals";

import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { openSheetDraft, removeRow, setLoadEnabled, setSeriesCount } from "@/domain/activities/ExecutionParametersDraft";
import {
  applyLoadEdit,
  KEYBOARD_REVEAL_MARGIN,
  loadEditText,
  loadFieldOrder,
  loadOfField,
  revealDelta,
} from "@/features/activities/useSheetKeyboard";

/**
 * PRE-5 story 2.2 (AC1, AC2, AC8 ; FR-23 à FR-25, AD-19, AD-26) — fonctions pures du hook
 * clavier : ordre de navigation entre les champs de charge et sortie d'un champ
 * (`parseLoadText` : vide → 0, illisible ou négatif → valeur précédente, sans changement →
 * aucune transition).
 */

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 3,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 15, loadKg: 20, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: true,
    ...overrides,
  };
}

const variable = (loads: number[]) =>
  params({
    series: { kind: "VARIABLE", rows: loads.map((loadKg, index) => ({ target: numberTarget(30 + index), pauseSeconds: 10, loadKg })) },
  });

describe("PRE5-2.2 — ordre de navigation des champs de charge (FR-25)", () => {
  it("PRE5-2.2/AC2 — Sans : aucun champ ; identiques effectives : la charge commune ; variables : les lignes dans l'ordre, tableau déplié seulement", () => {
    expect(loadFieldOrder(openSheetDraft(params({ loadEnabled: false })), true)).toEqual([]);
    expect(loadFieldOrder(openSheetDraft(params()), true)).toEqual(["uniform"]);
    expect(loadFieldOrder(openSheetDraft(params()), false)).toEqual(["uniform"]);
    const draft = openSheetDraft(variable([10, 0, 5, 7, 8, 9]));
    expect(loadFieldOrder(draft, true)).toEqual(draft.rowIds);
    expect(loadFieldOrder(draft, true)).toHaveLength(6);
    expect(loadFieldOrder(draft, false)).toEqual([]);
    expect(loadFieldOrder(openSheetDraft(variable([10, 0]), {}), true)).toHaveLength(2);
  });

  it("PRE5-2.2/AC2 — N = 1 en état variable demandé : identiques effectives, la charge commune", () => {
    const single = setSeriesCount(openSheetDraft(variable([10, 20])), 1);
    expect(single.variable).toBe(true);
    expect(loadFieldOrder(single, true)).toEqual(["uniform"]);
  });

  it("PRE5-2.2/AC2 — les lignes sont désignées par leur identité : un retrait garde l'ordre des identités restantes", () => {
    const draft = removeRow(openSheetDraft(variable([10, 20, 30])), 0);
    expect(loadFieldOrder(draft, true)).toEqual(draft.rowIds);
    expect(draft.rowIds).not.toContain(1);
  });
});

describe("PRE5-2.2 — sortie d'un champ de charge (AD-19, §9-10)", () => {
  it("PRE5-2.2/AC1 — « 1,3 » → 1,5 kg ; « 0.01 » → 0,25 kg ; « , » et « . » acceptés", () => {
    const draft = openSheetDraft(params());
    expect(loadOfField(applyLoadEdit(draft, "uniform", "1,3"), "uniform")).toBe(1.5);
    expect(loadOfField(applyLoadEdit(draft, "uniform", "0.01"), "uniform")).toBe(0.25);
    expect(loadOfField(applyLoadEdit(draft, "uniform", "12,75"), "uniform")).toBe(12.75);
  });

  it("PRE5-2.2/AC8 — champ vidé → 0 kg (la règle du zéro reste à la fermeture) ; illisible ou négatif → Brouillon inchangé", () => {
    const draft = openSheetDraft(params());
    const emptied = applyLoadEdit(draft, "uniform", "");
    expect(loadOfField(emptied, "uniform")).toBe(0);
    expect(emptied.loadEnabled).toBe(true);
    for (const text of ["1,2,3", "-2", "abc", "1..2"]) {
      expect({ text, same: applyLoadEdit(draft, "uniform", text) === draft }).toEqual({ text, same: true });
    }
  });

  it("PRE5-2.2/AC1 — sortie sans changement de valeur (« 20 » sur 20 kg, « 19,9 » arrondi à 20) : aucune transition, `pendingRemoval` intact", () => {
    const withPending = removeRow(openSheetDraft(variable([20, 30, 40])), 2);
    expect(withPending.pendingRemoval).not.toBeNull();
    const row = withPending.rowIds[0]!;
    expect(applyLoadEdit(withPending, row, "20")).toBe(withPending);
    expect(applyLoadEdit(withPending, row, "19,9")).toBe(withPending);
    // Un vrai changement est une transition : l'annulation en attente tombe (Q29).
    const changed = applyLoadEdit(withPending, row, "25");
    expect(loadOfField(changed, row)).toBe(25);
    expect(changed.pendingRemoval).toBeNull();
  });

  it("PRE5-2.2/AC1 — saisie d'une ligne : seule cette série change ; identité inconnue → Brouillon inchangé", () => {
    const draft = openSheetDraft(variable([10, 20, 30]));
    const [first, second, third] = draft.rowIds;
    const next = applyLoadEdit(draft, second!, "22,1");
    expect([first, second, third].map((row) => loadOfField(next, row!))).toEqual([10, 22.25, 30]);
    expect(applyLoadEdit(draft, 99, "5")).toBe(draft);
  });

  it("PRE5-2.2/AC1 — texte d'édition : le nombre seul au séparateur « , », vide pour 0 ; kg jamais saisi", () => {
    expect([loadEditText(20), loadEditText(1.25), loadEditText(0.5), loadEditText(0), loadEditText(null)]).toEqual(["20", "1,25", "0,5", "", ""]);
  });

  it("PRE5-2.2/AC5 — première activation : 0,25 kg sur la charge commune (transition 2.1 réutilisée)", () => {
    const draft = setLoadEnabled(openSheetDraft(params({ loadEnabled: false, series: { kind: "UNIFORM", count: 3, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] } })), true);
    expect(loadOfField(draft, "uniform")).toBe(0.25);
  });
});

describe("PRE5-2.2 — révélation de la ligne active au-dessus du clavier (FR-24, AC4)", () => {
  // Corps défilant à partir de y 100 ; haut du clavier (barre comprise) à y 500 ; marge 12.
  const BODY_TOP = 100;
  const KEYBOARD_TOP = 500;

  it("PRE5-2.2/AC4 — ligne sous « haut du clavier − 12 » : défilement de l'écart (bas de ligne − limite)", () => {
    expect(KEYBOARD_REVEAL_MARGIN).toBe(12);
    // Ligne de 36 de 470 à 506 : limite 488, écart 18.
    expect(revealDelta(470, 506, BODY_TOP, KEYBOARD_TOP)).toBe(18);
    // Ligne entièrement sous le clavier.
    expect(revealDelta(600, 636, BODY_TOP, KEYBOARD_TOP)).toBe(148);
  });

  it("PRE5-2.2/AC4 — ligne au-dessus du haut du corps : écart négatif (défilement vers le haut)", () => {
    expect(revealDelta(80, 116, BODY_TOP, KEYBOARD_TOP)).toBe(-20);
  });

  it("PRE5-2.2/AC4 — ligne entièrement visible (bas exactement à la limite compris) : aucun défilement", () => {
    expect(revealDelta(200, 236, BODY_TOP, KEYBOARD_TOP)).toBe(0);
    expect(revealDelta(452, 488, BODY_TOP, KEYBOARD_TOP)).toBe(0);
    expect(revealDelta(100, 136, BODY_TOP, KEYBOARD_TOP)).toBe(0);
  });
});
