import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import type { FormatSheetContext, FormatSheetRow } from "@/features/activities/FormatSettingsFrame";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 07/11/2026. Hermann, mot pour mot : « Paramètres d'exécution : les lignes de texte et champs spécifiques
 * aux formats d'entraînement ne sont pas positionnés dans les cadres conformément à Figma, ni n'ont les couleurs, dimensions,
 * etc adéquats. Ils doivent être intégrés dans les cadres existants. Par ailleurs la mention du nom du format dans un cadre
 * séparé doit disparaître. » — AMRAP (Rôle, Incrément par tour), EMOM (Intervalle), Death by (Intervalle, Incrément par
 * intervalle), For time (Rôle, Durée de l'exercice). Figma : `8598:30873`, `11255:19238`, `8598:31560`, `11312:19699`,
 * `8795:14588`, `8598:31210`. Jest ne prouve que l'arbre JS : rendu réel sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const f = strings.executionParameters.format;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "REPETITIONS",
    series: { kind: "UNIFORM", count: 1, target: numberTarget(10), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
    ...overrides,
  };
}

function renderSheet(
  key: FormatSheetContext["key"],
  rows: readonly FormatSheetRow[],
  settings: FormatSettings,
  extra: Partial<FormatSheetContext> = {},
  parent = params(),
) {
  const onFormat = jest.fn<(settings: FormatSettings, role: CircuitRole | null) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={0}
        format={{ key, rows, settings, onApply: onFormat, ...extra }}
        onApply={jest.fn()}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onFormat };
}

const validate = () => fireEvent.press(get("execution-sheet-validate"));
const value = (testID: string) => String(get(`${testID}-value`).props.children);

describe("Recette du 07/11/2026 — réglages de Format dans les cadres existants des Paramètres d'exécution", () => {
  it("aucun cadre séparé au nom du Format ; nom du Format dans le titre de la feuille", () => {
    renderSheet("AMRAP", ["duration", "increment"], { durationSeconds: 720, incrementPerRound: 0 });
    expect(query("execution-sheet-frame-format")).toBeNull();
    expect(screen.getByText(`${strings.executionParameters.sheet.title} AMRAP`, hidden)).toBeTruthy();
  });

  it("AMRAP dans un circuit : Rôle dans le cadre Exécution, Incrément par tour dans le cadre Séries, saisi au clavier", () => {
    const { onFormat } = renderSheet("AMRAP", ["role", "increment"], { incrementPerRound: 0 }, {
      role: { current: "TOUR", admitted: ["BUY_IN", "TOUR"], available: ["BUY_IN", "TOUR"] },
    });
    expect(within(get("execution-sheet-frame-execution")).getByTestId("execution-sheet-format-role-row", hidden)).toBeTruthy();
    expect(within(get("execution-sheet-frame-series")).getByTestId("execution-sheet-format-increment-row", hidden)).toBeTruthy();
    expect(value("execution-sheet-format-increment")).toBe(`+ 0 ${f.repetitionsUnit}`);
    enterExecutionSheetValue("execution-sheet-format-increment", 2, "integer");
    expect(value("execution-sheet-format-increment")).toBe(`+ 2 ${f.repetitionsUnit}`);
    fireEvent.press(screen.getByLabelText(f.roles.BUY_IN));
    // Buy-in : Incrément grisé, non modifiable (valeur conservée).
    expect(query("execution-sheet-format-increment-input")).toBeNull();
    validate();
    expect(onFormat).toHaveBeenCalledWith({ incrementPerRound: 2 }, "BUY_IN");
  });

  it("AMRAP seul : Durée de l'exercice du Format à la place de la durée calculée, saisie au clavier", () => {
    const { onFormat } = renderSheet("AMRAP", ["duration", "increment"], { durationSeconds: 720, incrementPerRound: 0 });
    expect(within(get("execution-sheet-frame-cadence")).getByTestId("execution-sheet-format-duration-row", hidden)).toBeTruthy();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(value("execution-sheet-format-duration")).toBe(formatPhraseDuration(720));
    enterExecutionSheetValue("execution-sheet-format-duration", 600);
    validate();
    expect(onFormat).toHaveBeenCalledWith({ durationSeconds: 600, incrementPerRound: 0 }, null);
  });

  it("EMOM : Intervalle dans le cadre Séries, saisi au clavier", () => {
    const { onFormat } = renderSheet("EMOM", ["interval"], { intervalSeconds: 60 });
    expect(within(get("execution-sheet-frame-series")).getByTestId("execution-sheet-format-interval-row", hidden)).toBeTruthy();
    expect(value("execution-sheet-format-interval")).toBe(formatPhraseDuration(60));
    enterExecutionSheetValue("execution-sheet-format-interval", 90);
    validate();
    expect(onFormat).toHaveBeenCalledWith({ intervalSeconds: 90 }, null);
  });

  it("Death by : Incrément par intervalle et Intervalle dans le cadre Séries ; plus de ligne « Condition d'arrêt » séparée, À l'objectif grisé", () => {
    renderSheet("DEATH_BY", ["interval", "increment", "stopImposed"], { intervalSeconds: 60, incrementPerRound: 1 });
    const series = get("execution-sheet-frame-series");
    expect(within(series).getByText(f.incrementPerInterval, hidden)).toBeTruthy();
    expect(within(series).getByText(f.interval, hidden)).toBeTruthy();
    expect(query("execution-sheet-format-stop-row")).toBeNull();
    expect(screen.getByLabelText(strings.executionParameters.sheet.stopConditions.TARGET).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("For time dans un circuit : Rôle à trois options ; Durée de l'exercice héritée du Circuit, grisée, à sa place unique", () => {
    renderSheet("FOR_TIME", ["role", "inheritedCap"], {}, {
      role: { current: "TOUR", admitted: ["BUY_IN", "TOUR", "BUY_OUT"], available: ["BUY_IN", "TOUR", "BUY_OUT"] },
      inheritedCapText: f.noLimit,
    });
    expect(within(get("execution-sheet-frame-execution")).getByText(f.roles.BUY_OUT, hidden)).toBeTruthy();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(String(get("execution-sheet-format-inherited-cap").props.children)).toBe(f.noLimit);
    expect(within(get("execution-sheet-frame-cadence")).getAllByText(strings.executionParameters.sheet.exerciseDuration, hidden)).toHaveLength(1);
  });

  it("For time seul : Durée maximum du For time ; vidée → « Aucune »", () => {
    const { onFormat } = renderSheet("FOR_TIME", ["timeCap"], { timeCapSeconds: 600 });
    expect(value("execution-sheet-format-time-cap")).toBe(formatPhraseDuration(600));
    enterExecutionSheetValue("execution-sheet-format-time-cap", "");
    expect(value("execution-sheet-format-time-cap")).toBe(f.noCap);
    validate();
    expect(onFormat).toHaveBeenCalledWith({}, null);
  });
});
