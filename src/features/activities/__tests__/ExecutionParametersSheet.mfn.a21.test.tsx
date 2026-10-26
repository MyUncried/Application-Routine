import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import {
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { CELL_BACKSPACE, typeInExecutionSheetCell } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-7 story A2.1 (D-438, D-384, MFN-02, MFN-09, MFN/AC15, AC25, AC26, AC28, AC30 ; CE-UI-10) —
 * Feuille des paramètres MFN : croix active à deux phases (2 → Sans), « Durée d'une série » à
 * renseigner tant qu'une durée manque, structure verrouillée d'une occurrence (durées seules
 * modifiables) et compteur de phase du Mouvement. Matrice de la spec
 * `spec-a2-1-feuille-parametres-mfn.md`. Gestes et rendu simulés : la recette visuelle et tactile
 * reste à faire sur iPhone (jalon JA) ; l'état verrouillé n'a pas de frame Figma (NON VÉRIFIABLE).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
const stateOf = (testID: string) => get(testID).props.accessibilityState as { selected?: boolean; disabled?: boolean };

const CONTROL = "execution-sheet-phases-control";
const WITH = `${CONTROL}-WITH`;
const WITHOUT = `${CONTROL}-WITHOUT`;
const CHEVRON = `${CONTROL}-WITH-chevron`;
const COUNT_TOGGLE = "execution-sheet-phase-count-toggle";
const STEPPER = "execution-sheet-phase-count";
const TABLE = "execution-sheet-phases-table";
const row = (n: number) => `execution-sheet-phase-row-${n}`;
const label = (n: number) => `${row(n)}-label`;
const duration = (n: number) => `${row(n)}-duration`;
const remove = (n: number) => `${row(n)}-remove`;
const handle = (n: number) => `${row(n)}-handle`;
const phaseRows = () => screen.queryAllByTestId(/^execution-sheet-phase-row-\d+$/, hidden);
const shownDuration = (n: number) => String(get(`${duration(n)}-value`).props.children);
const shownLabel = (n: number) => String(get(label(n)).props.value);
/** PRE-7 (D-446) : « Durée d'une série » garde sa pastille modifiable avec des phases. */
const seriesDurationText = () => String(get("execution-sheet-target-value-text").props.children);
const validate = () => fireEvent.press(get("execution-sheet-validate"));
const validateDisabled = () => stateOf("execution-sheet-validate").disabled === true;

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(9), pauseSeconds: 15, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

/** Paramètres résolus à phases ; une durée 0 représente une durée non renseignée (frère incomplet, Cible `UNSET`). */
function withPhases(phases: readonly (readonly [number, string, number])[]): ExecutionParametersInput {
  const workPhases: WorkPhase[] = phases.map(([id, phaseLabel, seconds]) => ({ id, label: phaseLabel, durationSeconds: seconds }));
  const incomplete = phases.some(([, , seconds]) => seconds < 1);
  const sum = phases.reduce((total, [, , seconds]) => total + seconds, 0);
  const target = incomplete ? unsetTarget() : numberTarget(sum);
  return params({ series: { kind: "UNIFORM", count: 3, target, pauseSeconds: 15, loadKg: 0, workPhases } });
}

function renderSheet(
  parent: ExecutionParametersInput,
  options: { readonly phaseStructureLocked?: boolean; readonly nextPhaseId?: number } = {},
) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        baseline={parent}
        profileSideRecoverySecondsDefault={10}
        {...options}
        onApply={onApply}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls.at(-1)![0];

function enterDuration(n: number, keys: string) {
  fireEvent(get(`${duration(n)}-input`), "focus");
  typeInExecutionSheetCell(duration(n), keys);
  fireEvent(get(`${duration(n)}-input`), "blur");
}

function stepperTap(button: "increment" | "decrement") {
  fireEvent(get(`${STEPPER}-${button}`), "pressIn");
  fireEvent(get(`${STEPPER}-${button}`), "pressOut");
}

describe("ExecutionParametersSheet — PRE-7 story A2.1 : croix à deux phases (D-438, MFN/AC26)", () => {
  it("[A 6 s, B 3 s], croix de B : Sans ; PRE-7 (D-446 §4) : « Durée d'une série » 9 s inchangée, modifiable ; « Phase supprimée — Annuler » ; Annuler restitue les deux phases", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]));
    expect(stateOf(remove(1)).disabled).toBe(false);
    expect(stateOf(remove(2)).disabled).toBe(false);
    fireEvent.press(get(remove(2)));
    expect(stateOf(WITHOUT)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
    // D-446 §4 remplace « durée restante = durée de série » (D-438) : la Cible est inchangée.
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe("9 s");
    expect(within(get("execution-sheet-adjusted")).getByText(t.phaseRemoved, hidden)).toBeTruthy();
    fireEvent.press(get("execution-sheet-adjusted-undo"));
    expect(phaseRows()).toHaveLength(2);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["A", "B"]);
    expect([shownDuration(1), shownDuration(2)]).toEqual(["6 s", "3 s"]);
    expect(seriesDurationText()).toBe("9 s");
    fireEvent.press(get(remove(1)));
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: numberTarget(9), workPhases: [] });
  });

  it("PRE-7 (D-446) — croix à deux phases, durée restante non renseignée : Sans, Cible conservée — « — » seulement si elle était déjà à renseigner (aucune durée inventée)", () => {
    // Fixture `withPhases` : frère incomplet antérieur à D-446, Cible lue `UNSET` — elle reste « — ».
    renderSheet(withPhases([[1, "A", 6], [2, "B", 0]]));
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe(t.unset);
    fireEvent.press(get(remove(1)));
    expect(stateOf(WITHOUT)).toMatchObject({ selected: true });
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe(t.unset);
    expect(validateDisabled()).toBe(true);
  });

  it("PRE-7 (D-446) — croix à deux phases, durée restante non renseignée, Cible chiffrée 6 s : Sans, Cible 6 s conservée, ✓ disponible", () => {
    const { onApply } = renderSheet(
      params({
        series: {
          kind: "UNIFORM",
          count: 3,
          target: numberTarget(6),
          pauseSeconds: 15,
          loadKg: 0,
          workPhases: [
            { id: 1, label: "A", durationSeconds: 6 },
            { id: 2, label: "B", durationSeconds: 0 },
          ],
        },
      }),
    );
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe("6 s");
    fireEvent.press(get(remove(1)));
    expect(stateOf(WITHOUT)).toMatchObject({ selected: true });
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe("6 s");
    expect(validateDisabled()).toBe(false);
    validate();
    expect(applied(onApply).series).toMatchObject({ kind: "UNIFORM", target: numberTarget(6), workPhases: [] });
  });

  it("phase unique relue des données : croix indisponible (Sans reste le geste)", () => {
    renderSheet(withPhases([[1, "Seule", 9]]));
    expect(stateOf(remove(1)).disabled).toBe(true);
  });
});

describe("ExecutionParametersSheet — PRE-7 story A2.1 : durée manquante (D-438, D-384, MFN/AC15, AC25)", () => {
  it("[9 s, —], Cible lue « — » (frère incomplet antérieur) : D « — » à renseigner, cellule « — » rouge pâle, Durée de l'exercice « — », ✓ indisponible, phases conservées ; PRE-7 (D-446) : compléter la durée ne renseigne pas D", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 9], [2, "B", 0]]));
    expect(shownDuration(2)).toBe(t.unset);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(seriesDurationText()).toBe(t.unset);
    expect(styleOf("execution-sheet-target-value").backgroundColor).toBe(colors.dangerSurface);
    expect(String(get("execution-sheet-total-text").props.children)).toBe(t.unset);
    expect(validateDisabled()).toBe(true);
    validate();
    expect(onApply).not.toHaveBeenCalled();
    expect(phaseRows()).toHaveLength(2);
    enterDuration(2, "4");
    // D-446 : D n'est plus la somme ; elle reste à renseigner, ✓ toujours indisponible.
    expect(seriesDurationText()).toBe(t.unset);
    expect(validateDisabled()).toBe(true);
  });

  it("Avec → Sans avec une durée manquante : durée de série « — » à renseigner, jamais la somme partielle", () => {
    renderSheet(withPhases([[1, "A", 9], [2, "B", 0]]));
    fireEvent.press(get(WITHOUT));
    expect(stateOf(WITHOUT)).toMatchObject({ selected: true });
    expect(String(get("execution-sheet-target-value-text").props.children)).toBe(t.unset);
  });
});

describe("ExecutionParametersSheet — PRE-7 story A2.1 : structure verrouillée d'une occurrence (D-438, MFN-09, MFN/AC28)", () => {
  it("avec phases : Sans, nombre, croix, poignées et libellés indisponibles ; chevron actif ; durées modifiables, D inchangée (D-446)", () => {
    const { onApply } = renderSheet(withPhases([[1, "Descente", 6], [2, "Maintien", 3]]), { phaseStructureLocked: true });
    expect(stateOf(WITHOUT).disabled).toBe(true);
    fireEvent.press(get(WITHOUT));
    expect(stateOf(WITH)).toMatchObject({ selected: true });
    // Nombre affiché indisponible (état existant `unselected`), sans réglage, même en re-choisissant Avec.
    expect(stateOf(COUNT_TOGGLE).disabled).toBe(true);
    expect(styleOf(COUNT_TOGGLE).opacity).toBe(UNSELECTED_OPACITY);
    fireEvent.press(get(COUNT_TOGGLE));
    fireEvent.press(get(WITH));
    expect(query(`${STEPPER}-increment`)).toBeNull();
    // Croix et poignées indisponibles, sans action Monter / Descendre.
    for (const n of [1, 2]) {
      expect(stateOf(remove(n)).disabled).toBe(true);
      expect(stateOf(handle(n)).disabled).toBe(true);
      expect(get(handle(n)).props.accessibilityActions).toEqual([]);
      expect(styleOf(handle(n)).opacity).toBe(UNSELECTED_OPACITY);
    }
    fireEvent.press(get(remove(2)));
    fireEvent(get(handle(1)), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    // Aucun répondeur : le geste de glisser n'est jamais saisi (ni au départ, ni en mouvement).
    expect(get(handle(1)).props.onStartShouldSetResponder()).toBe(false);
    expect(get(handle(1)).props.onMoveShouldSetResponder()).toBe(false);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Descente", "Maintien"]);
    // Libellés : champ natif non modifiable.
    expect(get(label(1)).props.editable).toBe(false);
    expect(stateOf(label(1)).disabled).toBe(true);
    // Chevron du tableau : actif (replie et déploie sans changer la structure).
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    // Durées modifiables ; PRE-7 (D-446) : D inchangée.
    enterDuration(1, "8");
    expect(seriesDurationText()).toBe("9 s");
    validate();
    expect(applied(onApply).series).toMatchObject({
      kind: "UNIFORM",
      target: numberTarget(9),
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 8 },
        { id: 2, label: "Maintien", durationSeconds: 3 },
      ],
    });
  });

  it("avec phases, durée vidée : ✓ indisponible, phase conservée (une durée vide empêche seulement d'enregistrer)", () => {
    renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]), { phaseStructureLocked: true });
    fireEvent(get(`${duration(2)}-input`), "focus");
    typeInExecutionSheetCell(duration(2), CELL_BACKSPACE.repeat(String(get(`${duration(2)}-input`).props.value).length));
    fireEvent(get(`${duration(2)}-input`), "blur");
    expect(phaseRows()).toHaveLength(2);
    expect(validateDisabled()).toBe(true);
  });

  it("avec phases, re-choisir Avec pendant une saisie de durée : la saisie est appliquée, aucune surface ne reste ouverte (aucun réglage du nombre)", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]), { phaseStructureLocked: true });
    fireEvent(get(`${duration(2)}-input`), "focus");
    typeInExecutionSheetCell(duration(2), "5");
    fireEvent.press(get(WITH));
    // PRE-7 (D-446) : D inchangée ; la saisie appliquée au Brouillon se lit ci-dessous, dans les
    // paramètres validés (le focus natif simulé n'est pas rendu par Jest).
    expect(seriesDurationText()).toBe("9 s");
    expect(phaseRows()).toHaveLength(2);
    // Aucune surface cachée : le premier toucher d'une autre durée ouvre directement sa saisie.
    fireEvent(get(`${duration(1)}-input`), "focus");
    expect(styleOf(duration(1)).backgroundColor).toBe("#EAEAFF");
    fireEvent(get(`${duration(1)}-input`), "blur");
    validate();
    expect(applied(onApply).series).toMatchObject({
      target: numberTarget(9),
      workPhases: [
        { id: 1, label: "A", durationSeconds: 6 },
        { id: 2, label: "B", durationSeconds: 5 },
      ],
    });
  });

  it("sans phase : Avec indisponible, Sans sélectionné", () => {
    renderSheet(params(), { phaseStructureLocked: true });
    expect(stateOf(WITH).disabled).toBe(true);
    fireEvent.press(get(WITH));
    expect(stateOf(WITHOUT)).toMatchObject({ selected: true });
    expect(query(TABLE)).toBeNull();
  });

  it("sans verrou (Catalogue, création locale) : structure modifiable", () => {
    renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]));
    expect(stateOf(WITHOUT).disabled).toBe(false);
    expect(stateOf(COUNT_TOGGLE).disabled).toBeFalsy();
    // Poignée : arbre antérieur (aucun état exposé), glisser et actions accessibles disponibles.
    expect(get(handle(1)).props.accessibilityState).toBeUndefined();
    expect(get(handle(1)).props.onStartShouldSetResponder()).toBe(true);
    expect(get(handle(1)).props.accessibilityActions).toEqual([{ name: "moveDown", label: expect.any(String) }]);
    expect(get(label(1)).props.editable).toBeUndefined();
  });
});

describe("ExecutionParametersSheet — PRE-7 story A2.1 : compteur de phase du Mouvement (MFN-02, MFN/AC30)", () => {
  it("structure [1, 2, 3], compteur 5 : retrait de 3, ✓, réouverture, + → nouvelle phase d'identité 5", () => {
    const parent = withPhases([[1, "A", 6], [2, "B", 3], [3, "C", 5]]);
    const first = renderSheet(parent, { nextPhaseId: 5 });
    fireEvent.press(get(remove(3)));
    validate();
    const reopened = applied(first.onApply);
    screen.unmount();
    const second = renderSheet(reopened, { nextPhaseId: 5 });
    fireEvent.press(get(COUNT_TOGGLE));
    stepperTap("increment");
    validate();
    const series = applied(second.onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.id) : []).toEqual([1, 2, 5]);
  });

  it("sans compteur : max + 1 (comportement antérieur)", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]));
    fireEvent.press(get(COUNT_TOGGLE));
    stepperTap("increment");
    validate();
    const series = applied(onApply).series;
    expect(series.kind === "UNIFORM" ? series.workPhases.map((phase) => phase.id) : []).toEqual([1, 2, 3]);
  });
});
