import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { failureTarget, numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import type { FormatSheetContext, FormatSheetRow } from "@/features/activities/FormatSettingsFrame";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

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

  // D-604 (Hermann, 25/11/2026 ; Formats § 9.7) : la Durée de l'exercice AMRAP ne figure plus dans la modale (réglée par l'écran du
  // format) ; sa valeur est réappliquée telle quelle. [AMRAP seul : Durée de l'exercice du Format saisie au clavier ; amrap-1 (18/11/2026) :
  // durée inférieure à 1 minute — remplacés.]
  it("D-604 — AMRAP seul : ni Durée de l'exercice ni cadre Cadence ; Nombre de répétitions et Incrément par tour ; durée gardée au ✓", () => {
    const { onFormat } = renderSheet("AMRAP", ["duration", "increment"], { durationSeconds: 720, incrementPerRound: 0 });
    expect(query("execution-sheet-frame-cadence")).toBeNull();
    expect(query("execution-sheet-format-duration-row")).toBeNull();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(query("execution-sheet-frame-phases")).toBeNull();
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(query("execution-sheet-format-increment-row")).not.toBeNull();
    validate();
    expect(onFormat).toHaveBeenCalledWith({ durationSeconds: 720, incrementPerRound: 0 }, null);
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
      const { onRecovery } = renderEmom(["stopTarget", "interval", "durationReadOnly"], parent);
      expect(failure().props.accessibilityState).toMatchObject({ disabled: true });
      expect(target().props.accessibilityState).toMatchObject({ selected: true });
      expect(query("execution-sheet-row-pause")).toBeNull();
      expect(query("execution-sheet-row-total")).toBeNull();
      // D-604 (Hermann, 25/11/2026 ; Figma `8795:14588`) : Mode, Condition d'arrêt, Nombre de répétitions, Intervalle, Charge, De chaque côté.
      // [Durée en lecture seule sous l'Intervalle et Récupération (07/11/2026) — remplacées ; Récupération gardée telle quelle.]
      expect(query("execution-sheet-format-duration-readonly-row")).toBeNull();
      expect(query("execution-sheet-frame-recovery")).toBeNull();
      expect(query("execution-sheet-row-series-type")).toBeNull();
      expect(query("execution-sheet-row-target")).not.toBeNull();
      expect(query("execution-sheet-format-interval-row")).not.toBeNull();
      expect(query("execution-sheet-row-load")).not.toBeNull();
      expect(query("execution-sheet-row-side")).not.toBeNull();
      validate();
      expect(onRecovery).not.toHaveBeenCalled();
    });

    it("en alternance : Intervalle et Durée en lecture seule, Récupération absente et appliquée à 0 s", () => {
      const { onRecovery } = renderEmom(["stopTarget", "interval", "durationReadOnly", "noRecovery"]);
      expect(query("execution-sheet-format-interval-row")).not.toBeNull();
      expect(query("execution-sheet-frame-recovery")).toBeNull();
      validate();
      // D-604 (25/11/2026) : Récupération ni affichée ni réappliquée. [Appliquée à 0 s (07/11/2026) — remplacé.]
      expect(onRecovery).not.toHaveBeenCalled();
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
    // D-604 (Hermann, 25/11/2026 ; Figma `8598:31210`) : plus de ligne Séries « Jusqu'à l'échec ». [Recette du 07/11/2026 — remplacé.]
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(query("execution-sheet-format-increment-row")).not.toBeNull();
    expect(query("execution-sheet-format-interval-row")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(query("execution-sheet-frame-cadence")).toBeNull();
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
    // D-604 (Hermann, 25/11/2026 ; Figma `11312:19699`) : Durée de l'exercice héritée retirée de la modale. [07/11/2026 — remplacé.]
    expect(query("execution-sheet-format-inherited-cap")).toBeNull();
    expect(query("execution-sheet-frame-cadence")).toBeNull();
    expect(query("execution-sheet-row-series-type")).not.toBeNull();
  });

  // D-604 : durée maximum retirée de la modale, gardée telle quelle. [For time seul : Durée maximum saisie, vidée → « Aucune » — remplacé.]
  it("D-604 — For time seul : ni Durée maximum ni cadre Cadence ; Séries ; durée maximum gardée au ✓", () => {
    const { onFormat } = renderSheet("FOR_TIME", ["timeCap"], { timeCapSeconds: 600 });
    expect(query("execution-sheet-format-time-cap-row")).toBeNull();
    expect(query("execution-sheet-frame-cadence")).toBeNull();
    expect(query("execution-sheet-row-series-type")).not.toBeNull();
    validate();
    expect(onFormat).toHaveBeenCalledWith({ timeCapSeconds: 600 }, null);
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
    const { onRecovery } = renderWithRecovery("AMRAP", ["role", "increment"], amrapRole("TOUR"));
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(query("execution-sheet-row-total")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    // D-604 (25/11/2026) : Récupération retirée de la modale, gardée telle quelle. [Récupération modifiable — remplacé.]
    expect(query("execution-sheet-recovery")).toBeNull();
    validate();
    expect(onRecovery).not.toHaveBeenCalled();
  });

  it("AMRAP, rôle Buy-in : Récupération grisée à 0 s, non modifiable, appliquée à 0 s", () => {
    const { onRecovery } = renderWithRecovery("AMRAP", ["role", "increment"], amrapRole("BUY_IN"));
    expect(query("execution-sheet-row-series-type")).toBeNull();
    // D-604 (25/11/2026) : Récupération retirée de la modale, valeur enregistrée inchangée. [Grisée à 0 s, appliquée à 0 s — remplacé.]
    expect(query("execution-sheet-recovery")).toBeNull();
    validate();
    expect(onRecovery).not.toHaveBeenCalled();
  });

  // Règles de Hermann du 14/11/2026 (FT-3, FT-4) : buy-in et buy-out, nombre de séries libre — la ligne Séries revient ; la ligne
  // Pause reste retirée. [« sans Séries ni Pause » (y-format-cadres, 07/11/2026) — remplacé pour la ligne Séries.]
  // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : • Pause après chaque série. […] ») : le Tour perd aussi
  // la Pause. [« Tour garde les deux (FT-4) » — remplacé pour la Pause.]
  it("For time : Buy-in, Buy-out et Tour avec Séries, sans Pause (FT-4 ; recette du 17/11/2026)", () => {
    const forTime = (current: CircuitRole) => ({
      role: { current, admitted: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[], available: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[] },
      inheritedCapText: f.noLimit,
    });
    renderWithRecovery("FOR_TIME", ["role", "inheritedCap"], forTime("BUY_OUT"));
    // D-604 (Hermann, 25/11/2026 ; Figma `11312:19895`) : en buy-in ou buy-out, Nombre de répétitions à la place de Séries.
    // [Buy-in et Buy-out avec Séries (FT-4) — remplacé.]
    expect(query("execution-sheet-row-series-type")).toBeNull();
    expect(query("execution-sheet-row-target")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    screen.unmount();
    renderWithRecovery("FOR_TIME", ["role", "inheritedCap"], forTime("TOUR"));
    expect(query("execution-sheet-row-series-type")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
  });

  /*
   * Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : • Pause après chaque série. • Pause de changement de
   * côté. […] • Récupération après un exercice. […] Les valeurs déjà saisies sont ignorées, sans être effacées ni modifiées »).
   */
  it.each([
    ["autonome", { rows: ["timeCap", "stopTarget"] as FormatSheetRow[] }],
    [
      "membre en tour",
      {
        rows: ["role", "inheritedCap", "stopTarget"] as FormatSheetRow[],
        role: { current: "TOUR" as CircuitRole, admitted: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[], available: ["BUY_IN", "TOUR", "BUY_OUT"] as CircuitRole[] },
        inheritedCapText: f.noLimit,
      },
    ],
  ])("For time %s : ni Pause, ni Pause entre les côtés, ni Récupération ; valeurs gardées au ✓", (_label, extra) => {
    const onApply = jest.fn<(value: ExecutionParametersInput) => void>();
    const onRecovery = jest.fn<(seconds: number) => void>();
    const parent = params({
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 20,
      series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 45, loadKg: 0, workPhases: [] },
    });
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={0}
          recovery={{ seconds: 30, onApply: onRecovery }}
          format={{ key: "FOR_TIME", settings: {}, onApply: jest.fn(), ...extra }}
          onApply={onApply}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(query("execution-sheet-row-side")).not.toBeNull();
    expect(query("execution-sheet-row-pause")).toBeNull();
    expect(query("execution-sheet-row-side-recovery")).toBeNull();
    expect(query("execution-sheet-recovery")).toBeNull();
    validate();
    expect(onRecovery).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sideRecoverySeconds: 20, series: expect.objectContaining({ pauseSeconds: 45 }) }));
  });

  // Recette du 18/11/2026 (emom-9, Hermann : « Le récapitulatif de l'EMOM en répétitions n'affiche plus la ligne « Pause entre les
  // côtés ». La valeur éventuellement saisie reste conservée dans le brouillon, sans effet ») ; EMOM en durée inchangé.
  it("emom-9 : EMOM en Répétitions — pas de ligne Pause entre les côtés, valeur gardée au ✓ ; en Durée, la ligne reste", () => {
    const onApply = jest.fn<(value: ExecutionParametersInput) => void>();
    const parent = params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 20 });
    const { unmount } = render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={parent}
          profileSideRecoverySecondsDefault={0}
          format={{ key: "EMOM", rows: ["stopTarget", "interval", "durationReadOnly"], settings: { intervalSeconds: 60 }, onApply: jest.fn() }}
          onApply={onApply}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(query("execution-sheet-row-side")).not.toBeNull();
    expect(query("execution-sheet-row-side-recovery")).toBeNull();
    validate();
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sideRecoverySeconds: 20 }));
    unmount();
    // D-604 (25/11/2026) : en Durée aussi, la Pause entre les côtés est retirée de la modale (valeur gardée). [En Durée, la ligne reste — remplacé.]
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, {}, params({
      mode: "DURATION",
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 20,
      series: { kind: "UNIFORM", count: 1, target: numberTarget(20), pauseSeconds: 0, loadKg: 0, workPhases: [] },
    }));
    expect(query("execution-sheet-row-side-recovery")).toBeNull();
  });

  // D-604 (25/11/2026) : tout exercice d'un format perd Pause entre les côtés et Récupération dans la modale (valeurs gardées).
  // [AMRAP autonome : Pause entre les côtés et Récupération inchangées — remplacé.]
  it("D-604 — AMRAP autonome : ni Pause entre les côtés ni Récupération ; valeurs gardées au ✓", () => {
    const { onRecovery } = renderWithRecovery("AMRAP", ["duration", "increment"], {}, params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 20 }));
    expect(query("execution-sheet-row-side-recovery")).toBeNull();
    expect(query("execution-sheet-recovery")).toBeNull();
    validate();
    expect(onRecovery).not.toHaveBeenCalled();
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
describe("Recette du 08/11/2026 — message du dépassement EMOM sous le cadre Séries, valeurs en rouge", () => {
  const duration = (seconds: number) =>
    params({ mode: "DURATION", series: { kind: "UNIFORM", count: 1, target: numberTarget(seconds), pauseSeconds: 0, loadKg: 0, workPhases: [] } });
  const variable = (seconds: readonly number[]) =>
    params({
      mode: "DURATION",
      series: { kind: "VARIABLE", rows: seconds.map((value) => ({ target: numberTarget(value), pauseSeconds: 0, loadKg: 0 })), workPhases: [] },
    } as Partial<ExecutionParametersInput>);
  const red = (testID: string) => StyleSheet.flatten(get(testID).props.style).backgroundColor === colors.dangerSurface;
  /** Le message est hors du cadre Séries (rendu juste après lui). */
  function expectBelowSeriesFrame() {
    expect(within(get("execution-sheet-frame-series")).queryByTestId("execution-sheet-format-emom-overflow", hidden)).toBeNull();
  }

  it("membre d'un Circuit EMOM « dans chaque intervalle » : 30 s + 40 s des autres membres ≥ 60 s → message de la somme sous le cadre Séries, cible en rouge, ✓ indisponible", () => {
    renderSheet("EMOM", ["stopTarget", "noRecovery"], {}, { emom: { windowSeconds: 60, othersWorkByRank: [40] } }, duration(30));
    expect(query("execution-sheet-format-interval-row")).toBeNull();
    expect(get("execution-sheet-format-emom-overflow").props.children).toBe(strings.screens.composition.emomOverflow);
    expectBelowSeriesFrame();
    expect(red("execution-sheet-target")).toBe(true);
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("la série de l'Exercice atteint seule l'intervalle → « La durée de la série dépasse la durée de l'intervalle. » (membre comme EMOM seul)", () => {
    renderSheet("EMOM", ["stopTarget", "noRecovery"], {}, { emom: { windowSeconds: 60, othersWorkByRank: [10] } }, duration(70));
    expect(get("execution-sheet-format-emom-overflow").props.children).toBe(f.emomSeriesOverflow);
    screen.unmount();
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, { emom: { windowSeconds: null, othersWorkByRank: [] } }, duration(70));
    expect(get("execution-sheet-format-emom-overflow").props.children).toBe(f.emomSeriesOverflow);
    expectBelowSeriesFrame();
    screen.unmount();
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, { emom: { windowSeconds: null, othersWorkByRank: [] } }, duration(30));
    expect(query("execution-sheet-format-emom-overflow")).toBeNull();
    expect(red("execution-sheet-target")).toBe(false);
  });

  it("séries variables : seules les cibles des séries en dépassement sont en rouge", () => {
    renderSheet("EMOM", ["stopTarget", "interval", "durationReadOnly"], { intervalSeconds: 60 }, { emom: { windowSeconds: null, othersWorkByRank: [] } }, variable([30, 70, 40]));
    expect(get("execution-sheet-format-emom-overflow").props.children).toBe(f.emomSeriesOverflow);
    expect([1, 2, 3].map((n) => red(`execution-sheet-table-row-${n}-target`))).toEqual([false, true, false]);
  });
});

// Recette du 17/11/2026 (Hermann, autres remarques, a : « je suis capable de créer un for time avec deux exercices en durée si j'entre les
// paramètres dans la composition de séance »).
describe("For time — Durée refusée au dernier exercice de la boucle en Répétitions", () => {
  it("Durée grisée et message court sous le cadre Exécution ; sans refus, Durée disponible et aucun message", () => {
    renderSheet("FOR_TIME", ["role", "stopTarget"], {}, { durationRefused: true });
    expect(get("execution-sheet-mode-control-DURATION").props.accessibilityState).toMatchObject({ disabled: true });
    expect(get("execution-sheet-duration-refused")).toHaveTextContent("Au moins un exercice reste en répétitions : la durée n’est pas disponible pour celui-ci.");
    screen.unmount();
    renderSheet("FOR_TIME", ["role", "stopTarget"], {});
    expect(get("execution-sheet-mode-control-DURATION").props.accessibilityState).toMatchObject({ disabled: false });
    expect(query("execution-sheet-duration-refused")).toBeNull();
  });

  it("boucle déjà sans Répétitions (séance antérieure) : erreur en rouge, ✓ refusé ; Répétitions choisi : erreur levée, Durée grisée", () => {
    renderSheet("FOR_TIME", ["role", "stopTarget"], {}, { durationRefused: true }, params({ mode: "DURATION", series: { kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 10 }, pauseSeconds: 0, loadKg: 0, workPhases: [] } } as never));
    expect(get("execution-sheet-loop-without-repetitions")).toHaveTextContent("Au moins un exercice de la boucle doit être en répétitions : choisissez Répétitions.");
    expect(get("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(get("execution-sheet-mode-control-REPETITIONS"));
    expect(query("execution-sheet-loop-without-repetitions")).toBeNull();
    expect(get("execution-sheet-duration-refused")).toBeTruthy();
    expect(get("execution-sheet-mode-control-DURATION").props.accessibilityState).toMatchObject({ disabled: true });
  });
});
