import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { numberTarget, seriesRowsOf, unsetTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import type { FormatSheetContext } from "@/features/activities/FormatSettingsFrame";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-11 — demande de Hermann du 14/11/2026 (soir) : « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou
 * supprimer des séries dans la composition de séance ». Modale d'un exercice du buy-in : nombre de séries réglable (non hérité) ;
 * un retrait qui enlève des valeurs aux autres exercices du bloc est annoncé avant ✓ (« aucune valeur perdue en silence »).
 * [Annonce pour les autres exercices du bloc — retirée : recette du 14/11/2026, m2 et m3, exercices du buy-in et du buy-out
 * indépendants.]
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const f = strings.executionParameters.format;

const twoSeries: ExecutionParametersInput = {
  version: 5,
  mode: "REPETITIONS",
  series: {
    kind: "VARIABLE",
    rows: [
      { target: numberTarget(30), pauseSeconds: 0, loadKg: 0 },
      { target: numberTarget(40), pauseSeconds: 0, loadKg: 0 },
    ],
    workPhases: [],
  },
  sideMode: "UNILATERAL",
  sideOrder: "BY_SIDE",
  sideRecoverySeconds: 0,
  cadenceBeepIntervalSeconds: 0,
  countdownSeconds: 0,
  endSeconds: 0,
  loadEnabled: false,
} as ExecutionParametersInput;

function renderSheet() {
  const onApply = jest.fn<(parameters: ExecutionParametersInput) => void>();
  const format: FormatSheetContext = {
    key: "FOR_TIME",
    rows: ["role", "inheritedCap", "stopTarget"],
    settings: { circuitRole: 1 },
    role: { current: "BUY_IN", admitted: ["BUY_IN", "TOUR", "BUY_OUT"], available: ["BUY_IN", "TOUR", "BUY_OUT"] },
    inheritedCapText: f.noLimit,
    onApply: jest.fn<(settings: FormatSettings, role: CircuitRole | null) => void>(),
  };
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet parent={twoSeries} profileSideRecoverySecondsDefault={0} format={format} onApply={onApply} onCancel={jest.fn()} />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("buy-in : séries ajoutées ou retirées dans la modale (14/11/2026)", () => {
  it("le nombre de séries n'est pas verrouillé : la croix de retrait d'une série est disponible", () => {
    renderSheet();
    expect(get("execution-sheet-table-row-2-remove").props.accessibilityState?.disabled ?? false).toBe(false);
  });

  // Recette du 14/11/2026 (m2, m3) : exercices du buy-in indépendants — rien à annoncer pour les autres.
  it("retrait d'une série puis ✓ : aucune annonce, 1 série validée", async () => {
    const { onApply } = renderSheet();
    fireEvent.press(get("execution-sheet-table-row-2-remove"));
    const alert = jest.spyOn(Alert, "alert");
    fireEvent.press(get("execution-sheet-validate"));
    expect(alert).not.toHaveBeenCalled();
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(seriesRowsOf(onApply.mock.calls[0]![0]).map((row) => row.target)).toEqual([numberTarget(30)]);
  });
});

/**
 * Précision de Hermann du 14/11/2026 (soir) : « le for Time a un nombre de tours. Dans la composition de séance si je transforme un
 * exercice Buy In ou Buy Out en un exercice Tour, il doit héritier du nombre de Tours du circuit ».
 */
describe("buy-in transformé en Tour : nombre de tours du Circuit hérité dans la modale (14/11/2026)", () => {
  function renderWithRounds(rounds: number) {
    const onApply = jest.fn<(parameters: ExecutionParametersInput) => void>();
    const calls: string[] = [];
    onApply.mockImplementation(() => calls.push("parameters"));
    const onFormat = jest.fn<(settings: FormatSettings, role: CircuitRole | null) => void>(() => calls.push("role"));
    const resize = (parameters: ExecutionParametersInput, count: number): ExecutionParametersInput => {
      const rows = seriesRowsOf(parameters);
      return { ...parameters, series: { kind: "VARIABLE", rows: Array.from({ length: count }, (_, index) => rows[index] ?? { ...rows.at(-1)!, target: unsetTarget() }), workPhases: [] } } as ExecutionParametersInput;
    };
    const format: FormatSheetContext = {
      key: "FOR_TIME",
      rows: ["role", "inheritedCap", "stopTarget"],
      settings: { circuitRole: 1 },
      role: { current: "BUY_IN", admitted: ["BUY_IN", "TOUR", "BUY_OUT"], available: ["BUY_IN", "TOUR", "BUY_OUT"] },
      inheritedCapText: f.noLimit,
      roleChangeLoss: (role, parameters) => {
        const lost = role === "TOUR" ? Math.max(0, seriesRowsOf(parameters).length - rounds) : 0;
        return { lost, kept: seriesRowsOf(parameters).length - lost };
      },
      seriesForRole: (role, parameters) => (role === "TOUR" ? resize(parameters, rounds) : parameters),
      onApply: onFormat,
    };
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet parent={twoSeries} profileSideRecoverySecondsDefault={0} format={format} onApply={onApply} onCancel={jest.fn()} />
      </TestSafeAreaProvider>,
    );
    return { onApply, onFormat, calls };
  }
  const tableRows = () => screen.queryAllByTestId(/^execution-sheet-table-row-\d+$/, hidden).length;
  const removeDisabled = () => get("execution-sheet-table-row-1-remove").props.accessibilityState?.disabled === true;

  it("choisir Tour : 3 séries (une par tour), non modifiables ; revenir en Buy-in retrouve les 2 séries modifiables", () => {
    renderWithRounds(3);
    expect(tableRows()).toBe(2);
    expect(removeDisabled()).toBe(false);
    fireEvent.press(screen.getByLabelText(f.roles.TOUR));
    expect(tableRows()).toBe(3);
    expect(removeDisabled()).toBe(true);
    fireEvent.press(screen.getByLabelText(f.roles.BUY_IN));
    expect(tableRows()).toBe(2);
    expect(removeDisabled()).toBe(false);
  });

  // Recette du 14/11/2026 (m5) : la série ajoutée est à renseigner. [Dernière valeur reprise — remplacé.]
  it("Tour de 3 tours : la 3e série est à renseigner, ✓ inactif tant qu'elle est vide", () => {
    const { onApply } = renderWithRounds(3);
    fireEvent.press(screen.getByLabelText(f.roles.TOUR));
    expect(tableRows()).toBe(3);
    expect(get("execution-sheet-validate").props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(get("execution-sheet-validate"));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("✓ en Tour : le Rôle est enregistré d'abord, puis les séries", async () => {
    const { onApply, onFormat, calls } = renderWithRounds(2);
    fireEvent.press(screen.getByLabelText(f.roles.TOUR));
    fireEvent.press(get("execution-sheet-validate"));
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(calls).toEqual(["role", "parameters"]);
    expect(onFormat.mock.calls[0]![1]).toBe("TOUR");
    expect(seriesRowsOf(onApply.mock.calls[0]![0]).map((row) => row.target)).toEqual([numberTarget(30), numberTarget(40)]);
  });

  // Recette du 14/11/2026 (m6 : « Il faut que le message apparaisse au moment de la suppression pas au moment de la validation des
  // paramètres »). [Annonce au ✓ — remplacé.]
  it("moins de tours que de séries : annonce dès le choix de Tour ; Annuler garde Buy-in, Continuer passe en Tour ; ✓ sans nouvelle annonce", async () => {
    const { onApply } = renderWithRounds(1);
    let buttons: Parameters<typeof Alert.alert>[2];
    const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, choices) => {
      buttons = choices;
    });
    fireEvent.press(screen.getByLabelText(f.roles.TOUR));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]![0]).toBe(f.roleLossTitle);
    expect(tableRows()).toBe(2); // rien n'a changé tant que la réponse n'est pas donnée
    act(() => buttons![0]!.onPress?.());
    expect(tableRows()).toBe(2);
    fireEvent.press(screen.getByLabelText(f.roles.TOUR));
    expect(alert).toHaveBeenCalledTimes(2);
    act(() => buttons![1]!.onPress!());
    expect(tableRows()).toBe(0); // une seule série : affichée en séries identiques
    fireEvent.press(get("execution-sheet-validate"));
    expect(alert).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
  });
});
