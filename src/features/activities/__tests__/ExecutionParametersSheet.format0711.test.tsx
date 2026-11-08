import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { failureTarget, numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
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
    const { onFormat } = renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 });
    expect(within(get("execution-sheet-frame-series")).getByTestId("execution-sheet-format-interval-row", hidden)).toBeTruthy();
    // Figma `8795:14588`, Formats §14 : l'Intervalle remplace la Pause après chaque série.
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(value("execution-sheet-format-interval")).toBe(formatPhraseDuration(60));
    enterExecutionSheetValue("execution-sheet-format-interval", 90);
    validate();
    expect(onFormat).toHaveBeenCalledWith({ intervalSeconds: 90 }, null);
  });

  describe("EMOM — décisions de Hermann du 07/11/2026 (A2, A3, A5, A8, B, B9 ; Figma `8795:14588`, `8598:30515`)", () => {
    const failure = () => screen.getByLabelText(strings.executionParameters.sheet.stopConditions.FAILURE);
    const target = () => screen.getByLabelText(strings.executionParameters.sheet.stopConditions.TARGET);
    const withRecovery = { recovery: { seconds: 30, onApply: jest.fn() } };

    function renderEmom(rows: readonly FormatSheetRow[], parent = params()) {
      const onRecovery = jest.fn<(seconds: number) => void>();
      render(
        <TestSafeAreaProvider>
          <ExecutionParametersSheet
            parent={parent}
            profileSideRecoverySecondsDefault={0}
            recovery={{ ...withRecovery.recovery, onApply: onRecovery }}
            format={{ key: "EMOM", rows, settings: { intervalSeconds: 60 }, onApply: jest.fn() }}
            onApply={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestSafeAreaProvider>,
      );
      return { onRecovery };
    }

    it("seul ou à la suite : À l'objectif seul (À l'échec grisé, imposé dès l'ouverture), ni Pause ni Durée au cadre Cadence, Durée en lecture seule = N × intervalle sous l'Intervalle, Récupération", () => {
      const parent = params({
        series: { kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 20, loadKg: 0, workPhases: [] },
      });
      renderEmom(["stopTarget", "interval", "durationReadOnly"], parent);
      expect(failure().props.accessibilityState).toMatchObject({ disabled: true });
      expect(target().props.accessibilityState).toMatchObject({ selected: true });
      expect(query("execution-sheet-row-pause")).toBeNull();
      expect(query("execution-sheet-row-total")).toBeNull();
      const series = get("execution-sheet-frame-series");
      expect(within(series).getByTestId("execution-sheet-format-duration-readonly-row", hidden)).toBeTruthy();
      expect(String(get("execution-sheet-format-duration-readonly").props.children)).toBe(formatPhraseDuration(180));
      expect(query("execution-sheet-frame-recovery")).not.toBeNull();
    });

    it("en alternance : Intervalle et Durée en lecture seule, Récupération absente et appliquée à 0 s", () => {
      const { onRecovery } = renderEmom(["stopTarget", "interval", "durationReadOnly", "noRecovery"]);
      expect(query("execution-sheet-format-interval-row")).not.toBeNull();
      expect(query("execution-sheet-frame-recovery")).toBeNull();
      validate();
      expect(onRecovery).toHaveBeenCalledWith(0);
    });

    it("dans chaque intervalle : ni Intervalle, ni Durée de l'exercice, ni Pause, ni Récupération", () => {
      renderEmom(["stopTarget", "noRecovery"]);
      expect(query("execution-sheet-format-interval-row")).toBeNull();
      expect(query("execution-sheet-format-duration-readonly-row")).toBeNull();
      expect(query("execution-sheet-row-total")).toBeNull();
      expect(query("execution-sheet-row-pause")).toBeNull();
      expect(query("execution-sheet-frame-recovery")).toBeNull();
      expect(failure().props.accessibilityState).toMatchObject({ disabled: true });
    });
  });

  it("Death by : Incrément par intervalle et Intervalle dans le cadre Séries ; plus de ligne « Condition d'arrêt » séparée, À l'objectif grisé", () => {
    renderSheet("DEATH_BY", ["seriesUntilFailure", "interval", "increment", "stopImposed"], { intervalSeconds: 60, incrementPerRound: 1 });
    const series = get("execution-sheet-frame-series");
    expect(within(series).getByText(f.incrementPerInterval, hidden)).toBeTruthy();
    expect(within(series).getByText(f.interval, hidden)).toBeTruthy();
    expect(query("execution-sheet-format-stop-row")).toBeNull();
    expect(screen.getByLabelText(strings.executionParameters.sheet.stopConditions.TARGET).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("Death by autonome (Figma `8598:31210`) : À l'échec imposé dès l'ouverture, Séries « Jusqu'à l'échec », Nombre de répétitions, ni Pause ni Durée de l'exercice", () => {
    renderSheet("DEATH_BY", ["seriesUntilFailure", "interval", "increment", "stopImposed"], { intervalSeconds: 60, incrementPerRound: 1 });
    expect(screen.getByLabelText(strings.executionParameters.sheet.stopConditions.FAILURE).props.accessibilityState).toMatchObject({ selected: true });
    const series = get("execution-sheet-frame-series");
    expect(within(series).getByText(f.seriesUntilFailure, hidden)).toBeTruthy();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(within(get("execution-sheet-frame-cadence")).queryByText(strings.executionParameters.sheet.exerciseDuration, hidden)).toBeNull();
  });

  it("Death by dans chaque intervalle (Figma `11373:20396`) : ni ligne Séries ni Intervalle ; Nombre de répétitions et Incrément par intervalle", () => {
    renderSheet("DEATH_BY", ["increment", "stopImposed"], { incrementPerRound: 1 });
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-format-interval-row")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(query("execution-sheet-format-increment-row")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
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

/**
 * Recette iPhone du 07/11/2026 (y-format-cadres), Hermann : « For time - exercice de type Buy in / Buy out : retirer la ligne Pause
 * après chaque série et la ligne Séries. » ; « Death by : […] Paramètres Nombre de répétitions est mis à l'échec au lieu d'accueillir
 * la valeur Départ du tableau. » ; « EMOM : retirer la colonne Pause du tableau » ; AMRAP : lignes Séries, Pause après chaque série et
 * Durée de l'exercice retirées pour les rôles Tour et Buy-in ; Buy-in : « Récupération grisée, à 0 s, non modifiable ».
 */
describe("Recette du 07/11/2026 (y-format-cadres) — lignes propres aux rôles et aux Formats", () => {
  function renderWithRecovery(key: FormatSheetContext["key"], rows: readonly FormatSheetRow[], extra: Partial<FormatSheetContext> = {}, parent = params()) {
    const onRecovery = jest.fn<(seconds: number) => void>();
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={0}
          recovery={{ seconds: 30, onApply: onRecovery }}
          format={{ key, rows, settings: {}, onApply: jest.fn(), ...extra }}
          onApply={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    return { onRecovery };
  }
  const amrapRole = (current: CircuitRole) => ({ role: { current, admitted: ["BUY_IN", "TOUR"] as CircuitRole[], available: ["BUY_IN", "TOUR"] as CircuitRole[] } });

  it("AMRAP, rôle Tour : ni Séries, ni Pause, ni Durée de l'exercice ; Nombre de répétitions et Récupération modifiable", () => {
    renderWithRecovery("AMRAP", ["role", "increment"], amrapRole("TOUR"));
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(value("execution-sheet-recovery")).toBe(formatPhraseDuration(30));
  });

  it("AMRAP, rôle Buy-in : Récupération grisée à 0 s, non modifiable, appliquée à 0 s", () => {
    const { onRecovery } = renderWithRecovery("AMRAP", ["role", "increment"], amrapRole("BUY_IN"));
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(String(get("execution-sheet-recovery").props.children)).toBe(formatPhraseDuration(0));
    expect(query("execution-sheet-recovery-value")).toBeNull();
    validate();
    expect(onRecovery).toHaveBeenCalledWith(0);
  });

  it("For time : Buy-in et Buy-out sans Séries ni Pause ; Tour les garde", () => {
    const forTime = (current: CircuitRole) => ({
      role: { current, admitted: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[], available: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[] },
      inheritedCapText: f.noLimit,
    });
    renderWithRecovery("FOR_TIME", ["role", "inheritedCap"], forTime("BUY_OUT"));
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    screen.unmount();
    renderWithRecovery("FOR_TIME", ["role", "inheritedCap"], forTime("TOUR"));
    expect(query("execution-sheet-row-series-type")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).not.toBeNull();
  });

  it("EMOM, séries variables : tableau sans colonne Pause", () => {
    renderWithRecovery("EMOM", ["stopTarget", "interval", "durationReadOnly"], { settings: { intervalSeconds: 60 } }, params({
      series: { kind: "VARIABLE", rows: [{ target: numberTarget(8), pauseSeconds: 0, loadKg: 0 }, { target: numberTarget(10), pauseSeconds: 0, loadKg: 0 }], workPhases: [] },
    }));
    expect(query("execution-sheet-table-row-1-target-cell")).not.toBeNull();
    expect(query("execution-sheet-table-row-1-pause-cell")).toBeNull();
    expect(query("execution-sheet-table-row-1-load-cell")).not.toBeNull();
    expect(within(get("execution-sheet-table-header")).queryByText(strings.executionParameters.sheet.columns.pause, hidden)).toBeNull();
  });

  it("Death by : À l'échec imposé sans effacer le départ ; un objectif déjà « à l'échec » est à renseigner", () => {
    const deathBy = ["seriesUntilFailure", "interval", "increment", "stopImposed"] as const;
    renderSheet("DEATH_BY", deathBy, { intervalSeconds: 60, incrementPerRound: 1 }, {}, params({
      series: { kind: "UNIFORM", count: 1, target: numberTarget(5), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    }));
    expect(screen.getByLabelText(strings.executionParameters.sheet.stopConditions.FAILURE).props.accessibilityState).toMatchObject({ selected: true });
    expect(value("execution-sheet-target")).toBe(`5 ${strings.executionParameters.sheet.repetitionsUnit}`);
    screen.unmount();
    renderSheet("DEATH_BY", deathBy, { intervalSeconds: 60, incrementPerRound: 1 }, {}, params({
      series: { kind: "UNIFORM", count: 1, target: failureTarget(), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    }));
    expect(value("execution-sheet-target")).toBe(strings.executionParameters.sheet.unset);
  });
});

/**
 * Recette iPhone du 08/11/2026 (Autres constats, Hermann : « EMOM à intervalle dans la composition de séance : si on met 40 + 30 dans
 * deux exercices différents de la même série de la composition de séance, on ne peut sauvegarder (ok) mais il n'y a pas de message
 * d'explication […] Même chose chose pour tout type d'EMOM mais quand on met une durée sur un exercice supérieur à la durée de
 * l'intervalle ») : le message est sous l'en-tête, toujours visible, même sans ligne Intervalle.
 */
describe("Recette du 08/11/2026 — message du dépassement EMOM sous l'en-tête de la feuille", () => {
  const duration = (seconds: number) =>
    params({ mode: "DURATION", series: { kind: "UNIFORM", count: 1, target: numberTarget(seconds), pauseSeconds: 0, loadKg: 0, workPhases: [] } });

  it("membre d'un Circuit EMOM « dans chaque intervalle » (pas de ligne Intervalle) : 30 s + 40 s des autres membres ≥ 60 s → message, ✓ indisponible", () => {
    renderSheet("EMOM", ["stopTarget", "noRecovery"], {}, { emom: { windowSeconds: 60, othersWorkByRank: [40] } }, duration(30));
    expect(query("execution-sheet-format-interval-row")).toBeNull();
    const alert = get("execution-sheet-format-emom-overflow");
    expect(alert.props.children).toBe(strings.screens.composition.emomOverflow);
    // Sous l'en-tête, hors du cadre Séries ; ✓ indisponible.
    expect(within(get("execution-sheet-frame-series")).queryByTestId("execution-sheet-format-emom-overflow", hidden)).toBeNull();
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("EMOM seul : durée de l'exercice ≥ intervalle → message de la feuille sous l'en-tête ; sans dépassement, aucun message", () => {
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, { emom: { windowSeconds: null, othersWorkByRank: [] } }, duration(70));
    expect(get("execution-sheet-format-emom-overflow").props.children).toBe(f.emomOverflow);
    screen.unmount();
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, { emom: { windowSeconds: null, othersWorkByRank: [] } }, duration(30));
    expect(query("execution-sheet-format-emom-overflow")).toBeNull();
  });
});
