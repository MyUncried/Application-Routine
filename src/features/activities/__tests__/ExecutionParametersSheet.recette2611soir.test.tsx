import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, StyleSheet } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { failureTarget, numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { incrementCycleRounding } from "@/domain/activities/phaseCycleFit";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import type { FormatSheetContext, FormatSheetRow } from "@/features/activities/FormatSettingsFrame";
import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * Recette iPhone du 26/11/2026 (soir), paquet FORMATS2. Hermann, mot pour mot :
 * - « Death by, champ incrément, bouton clavier +/- : quand + est activé, le - est bleu clair, et inversement quand - est activé le +
 *   est clair » ;
 * - « Death by : Incrément par tour d'un exercice qui a un mouvement avec des phases : l'incrément doit être un multiple de la somme
 *   des phases (message d'information avec proposition inférieure, supérieure, ou annuler). Ce n'est pas une obligation. » ;
 * - AMRAP : « Sélection "à l'échec" dans le tableau : "incrément par tour" dans la modale doit être grisé ».
 * Jest ne prouve que l'arbre JS : rendu et alerte native à vérifier sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const f = strings.executionParameters.format;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const value = (testID: string) => String(get(`${testID}-value`).props.children);

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

function renderSheet(key: FormatSheetContext["key"], rows: readonly FormatSheetRow[], settings: FormatSettings, extra: Partial<FormatSheetContext> = {}, parent = params()) {
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

type AlertButton = { text?: string; style?: string; onPress?: () => void };

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Recette du 26/11/2026 (soir) — FORMATS2", () => {
  it("incrementCycleRounding : inférieur ≥ 1 s seulement, supérieur dans la borne, rien pour un multiple ou sans phases", () => {
    expect(incrementCycleRounding(20, 15, 3600)).toEqual({ lowerSeconds: 15, upperSeconds: 30 });
    // Multiple inférieur nul : l'incrément du Death by est au moins + 1 — seul le supérieur est proposé.
    expect(incrementCycleRounding(10, 15, 3600)).toEqual({ lowerSeconds: null, upperSeconds: 15 });
    expect(incrementCycleRounding(3590, 15, 3590)).toEqual({ lowerSeconds: 3585, upperSeconds: null });
    expect(incrementCycleRounding(30, 15, 3600)).toBeNull();
    expect(incrementCycleRounding(20, null, 3600)).toBeNull();
  });

  describe("Death by en Durée, mouvement à phases (5 s + 10 s = 15 s)", () => {
    const phased = params({
      mode: "DURATION",
      series: {
        kind: "UNIFORM",
        count: 1,
        target: numberTarget(30),
        pauseSeconds: 0,
        loadKg: 0,
        workPhases: [
          { id: 1, label: "A", durationSeconds: 5 },
          { id: 2, label: "B", durationSeconds: 10 },
        ],
      },
    });
    const open = () => renderSheet("DEATH_BY", ["increment", "stopImposed"], { incrementPerRound: 15 }, {}, phased);
    const spy = () => jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const buttons = (alert: ReturnType<typeof spy>) => (alert.mock.calls.at(-1)?.[2] ?? []) as AlertButton[];

    it("incrément non multiple : message d'information, arrondi inférieur, supérieur, ou Annuler (valeur saisie gardée)", () => {
      const alert = spy();
      const { onFormat } = open();
      enterExecutionSheetValue("execution-sheet-format-increment", 20);
      expect(alert).toHaveBeenCalledTimes(1);
      expect(alert.mock.calls[0]?.[0]).toBe(f.incrementCycleTitle);
      expect(alert.mock.calls[0]?.[1]).toBe(
        f.incrementCycleMessage.replace("{increment}", formatPhraseDuration(20)).replace("{cycle}", formatPhraseDuration(15)),
      );
      expect(buttons(alert).map((button) => button.text)).toEqual([
        f.incrementCycleRoundTo.replace("{duration}", formatPhraseDuration(15)),
        f.incrementCycleRoundTo.replace("{duration}", formatPhraseDuration(30)),
        f.incrementCycleKeep,
      ]);
      expect(buttons(alert)[2]?.style).toBe("cancel");
      // Annuler : la saisie reste (ce n'est pas une obligation).
      expect(value("execution-sheet-format-increment")).toBe(`+ ${formatPhraseDuration(20)}`);
      // Arrondi supérieur.
      act(() => buttons(alert)[1]!.onPress!());
      expect(value("execution-sheet-format-increment")).toBe(`+ ${formatPhraseDuration(30)}`);
      fireEvent.press(get("execution-sheet-validate"));
      expect(onFormat).toHaveBeenCalledWith({ incrementPerRound: 30 }, null);
    });

    it("multiple inférieur nul : seul le supérieur est proposé, avec Annuler ; un multiple exact ne demande rien", () => {
      const alert = spy();
      open();
      enterExecutionSheetValue("execution-sheet-format-increment", 10);
      expect(buttons(alert).map((button) => button.text)).toEqual([f.incrementCycleRoundTo.replace("{duration}", formatPhraseDuration(15)), f.incrementCycleKeep]);
      alert.mockClear();
      enterExecutionSheetValue("execution-sheet-format-increment", 45);
      expect(alert).not.toHaveBeenCalled();
    });

    it("en Répétitions, aucun message (les phases ne règlent que les durées)", () => {
      const alert = spy();
      renderSheet("DEATH_BY", ["increment", "stopImposed"], { incrementPerRound: 1 }, {}, params({ series: { kind: "UNIFORM", count: 1, target: numberTarget(5), pauseSeconds: 0, loadKg: 0, workPhases: phased.series.workPhases } }));
      enterExecutionSheetValue("execution-sheet-format-increment", 2, "integer");
      expect(alert).not.toHaveBeenCalled();
    });
  });

  it("AMRAP à l'échec (Tour, incrément jamais saisi) : Incrément par tour grisé — titre et valeur « — », aucun champ", () => {
    renderSheet("AMRAP", ["role", "increment"], {}, { role: { current: "TOUR", admitted: ["BUY_IN", "TOUR"], available: ["BUY_IN", "TOUR"] } }, params({ series: { kind: "UNIFORM", count: 1, target: failureTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] } }));
    expect(query("execution-sheet-format-increment-input")).toBeNull();
    expect(String(get("execution-sheet-format-increment").props.children)).toBe(strings.executionParameters.sheet.unset);
    const labelNode = get("execution-sheet-format-increment-label");
    expect(String(labelNode.props.children)).toBe(f.incrementPerRound);
    expect(StyleSheet.flatten(labelNode.props.style).color).toBe(colors.disabled);
  });

  it("AMRAP à l'objectif : titre de l'Incrément non grisé (aucun titre de remplacement)", () => {
    renderSheet("AMRAP", ["role", "increment"], { incrementPerRound: 1 }, { role: { current: "TOUR", admitted: ["BUY_IN", "TOUR"], available: ["BUY_IN", "TOUR"] } });
    expect(query("execution-sheet-format-increment-label")).toBeNull();
  });

  it("bouton ± de la barre : « + » actif et « − » bleu clair ; inversement quand « − » est actif", () => {
    const bar = (negative: boolean) => (
      <KeyboardAccessoryBar
        keyboardFrame={{ screenY: 500, duration: 0 }}
        containerBottom={800}
        reduceMotion
        animated
        onHeight={() => undefined}
        canPrevious
        canNext
        onPrevious={() => undefined}
        onNext={() => undefined}
        onClose={() => undefined}
        sign={{ negative, onPress: () => undefined }}
      />
    );
    const opacity = (testID: string) => StyleSheet.flatten(get(testID).props.style).opacity ?? 1;
    render(bar(false));
    expect(opacity("keyboard-sign-plus")).toBe(1);
    expect(opacity("keyboard-sign-minus")).toBeLessThan(1);
    screen.rerender(bar(true));
    expect(opacity("keyboard-sign-plus")).toBeLessThan(1);
    expect(opacity("keyboard-sign-minus")).toBe(1);
  });
});
