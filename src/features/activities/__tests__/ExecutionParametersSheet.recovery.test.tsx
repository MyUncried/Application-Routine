import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { numberTarget, type ExecutionParameters, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { chooseExecutionSide, showExerciseDurationSignals } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";

/**
 * PRE-9 — ordre de Hermann du 01/11/2026, point 2 (ch07 « Récupération de l'Exercice et défauts du
 * Profil », CE-UI-10 ligne 14, DSF-PARAMETRES-MODALE « Défauts Profil et Récupération ») :
 * - bloc 6 « Récupération » après Cadence et durée, seule ligne, contrôle de durée existant (roulette
 *   0..300 s), valeur de l'Exercice (0 s sans récupération antérieure), appliquée par ✓ seulement ;
 * - valeurs reprises des défauts du Profil sur fond orange jusqu'au premier ✓
 *   (`profileDefaultsPending`), sans changer valeur ni couleur du texte.
 * Jest ne prouve que l'arbre JS : rendu réel et VoiceOver relèvent de la recette iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const ORANGE = toVerifyColors.surface;

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 15, loadKg: 0, workPhases: [] },
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

type Options = {
  readonly parent?: ExecutionParametersInput;
  readonly recoverySeconds?: number | null;
  readonly withRecovery?: boolean;
  readonly pending?: boolean;
  readonly exerciseSignals?: "present" | "absent";
};

function renderSheet({ parent = params(), recoverySeconds = 30, withRecovery = true, pending, exerciseSignals = "absent" }: Options = {}) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  const onCancel = jest.fn();
  const onRecovery = jest.fn<(seconds: number) => void>();
  const calls: string[] = [];
  onApply.mockImplementation(() => calls.push("parameters"));
  onRecovery.mockImplementation(() => calls.push("recovery"));
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        profileSideRecoverySecondsDefault={12}
        exerciseSignals={exerciseSignals}
        {...(withRecovery ? { recovery: { seconds: recoverySeconds, onApply: onRecovery } } : {})}
        {...(pending !== undefined ? { profileDefaultsPending: pending } : {})}
        onApply={onApply}
        onCancel={onCancel}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply, onCancel, onRecovery, calls };
}

const recoveryText = () => String(get("execution-sheet-recovery-text").props.children);
const background = (testID: string) => StyleSheet.flatten(get(testID).props.style).backgroundColor;
const validate = () => fireEvent.press(get("execution-sheet-validate"));
const cancel = () => fireEvent.press(get("execution-sheet-cancel"));
/** Roulette de la Récupération (panneau sur iOS, en ligne ailleurs) : minute puis seconde de la grille 1 / 5 / 30 s. */
function chooseOnWheel(minuteIndex: number, secondIndex: number) {
  fireEvent.press(get("execution-sheet-recovery"));
  const wheel = within(get("execution-sheet-recovery-wheel"));
  fireEvent(wheel.getByTestId("duration-wheel-minutes"), "selectionChange", { nativeEvent: { selection: minuteIndex } });
  fireEvent(wheel.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: secondIndex } });
  fireEvent.press(wheel.getByTestId("duration-wheel-validate"));
}

describe("PRE-9 (01/11/2026, point 2) — bloc Récupération de Paramètres d'exécution", () => {
  it("bloc 6 après Cadence et durée, seule ligne « Récupération », valeur de l'Exercice ; même apparence de cadre", () => {
    renderSheet({ recoverySeconds: 45 });
    const host = get("execution-sheet-panel-host");
    const frames = host.children
      .filter((child): child is ReturnType<typeof screen.getByTestId> => typeof child !== "string" && /^execution-sheet-frame-/.test(String(child.props.testID)))
      .map((frame) => String(frame.props.testID));
    expect(frames).toEqual([
      "execution-sheet-frame-execution",
      "execution-sheet-frame-phases",
      "execution-sheet-frame-series",
      "execution-sheet-frame-sides",
      "execution-sheet-frame-cadence",
      "execution-sheet-frame-recovery",
    ]);
    const rows = within(get("execution-sheet-frame-recovery"))
      .queryAllByTestId(/^execution-sheet-row-[a-z-]+$/, hidden)
      .map((node) => String(node.props.testID))
      .filter((id) => !/-(selection|line|content|value-group)$/.test(id));
    expect(rows).toEqual(["execution-sheet-row-recovery"]);
    expect(within(get("execution-sheet-frame-recovery")).getByText(t.recovery, hidden)).toBeTruthy();
    expect(recoveryText()).toBe(formatPhraseDuration(45));
    expect(StyleSheet.flatten(get("execution-sheet-frame-recovery").props.style)).toMatchObject({
      backgroundColor: "#EFF0F2",
      borderRadius: 12,
      marginTop: 8,
    });
  });

  it("ancien Exercice sans récupération : 0 s affiché ; aucun bloc sans `recovery` (Catalogue, fiche Mouvement)", () => {
    renderSheet({ recoverySeconds: null });
    expect(recoveryText()).toBe(formatPhraseDuration(0));
    screen.unmount();
    renderSheet({ withRecovery: false });
    expect(query("execution-sheet-frame-recovery")).toBeNull();
  });

  it("roulette existante (grille 0..300 s) : la valeur choisie s'affiche ; ✓ l'applique au parent avant les paramètres", () => {
    const { onRecovery, onApply, calls } = renderSheet({ recoverySeconds: 30 });
    // Minute 1, première seconde de la grille : 60 s.
    chooseOnWheel(1, 0);
    expect(recoveryText()).toBe(formatPhraseDuration(60));
    expect(onRecovery).not.toHaveBeenCalled();
    validate();
    expect(onRecovery).toHaveBeenCalledWith(60);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["recovery", "parameters"]);
  });

  it("0 s se choisit (aucune récupération exécutée) ; ✕ n'applique rien", () => {
    const { onRecovery, onCancel } = renderSheet({ recoverySeconds: 30 });
    chooseOnWheel(0, 0);
    expect(recoveryText()).toBe(formatPhraseDuration(0));
    cancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRecovery).not.toHaveBeenCalled();
  });

  it("valeur historique hors grille (7 s) : ✓ de la roulette sans la tourner la conserve telle quelle", () => {
    const { onRecovery } = renderSheet({ recoverySeconds: 7 });
    fireEvent.press(get("execution-sheet-recovery"));
    fireEvent.press(within(get("execution-sheet-recovery-wheel")).getByTestId("duration-wheel-validate"));
    expect(recoveryText()).toBe(formatPhraseDuration(7));
    validate();
    expect(onRecovery).toHaveBeenCalledWith(7);
  });
});

describe("PRE-9 (01/11/2026, point 2) — défauts du Profil sur fond orange jusqu'au premier ✓", () => {
  it("Exercice en attente : la Récupération reprise du Profil est sur fond orange, texte inchangé ; sinon rendu normal", () => {
    renderSheet({ pending: true });
    expect(background("execution-sheet-recovery")).toBe(ORANGE);
    const pendingText = StyleSheet.flatten(get("execution-sheet-recovery-text").props.style);
    expect(get("execution-sheet-recovery").props.accessibilityHint).toBe(t.profileDefaultHint);
    screen.unmount();
    renderSheet({ pending: false });
    expect(background("execution-sheet-recovery")).not.toBe(ORANGE);
    expect(get("execution-sheet-recovery").props.accessibilityHint).toBeUndefined();
    expect(StyleSheet.flatten(get("execution-sheet-recovery-text").props.style)).toEqual(pendingText);
  });

  it("changer la valeur avant ✓ garde l'orange (valeur initialisée depuis le Profil jusqu'au premier ✓) ; la valeur appliquée est celle choisie", () => {
    const { onRecovery } = renderSheet({ pending: true, recoverySeconds: 30 });
    chooseOnWheel(1, 0);
    expect(background("execution-sheet-recovery")).toBe(ORANGE);
    validate();
    expect(onRecovery).toHaveBeenCalledWith(60);
  });

  it("Pause entre les côtés copiée du Profil à l'activation avant le premier ✓ : orange ; déjà bilatéral à l'ouverture : normal", () => {
    renderSheet({ pending: true });
    chooseExecutionSide("Avec");
    expect(String(get("execution-sheet-side-recovery-value").props.children)).toBe(formatPhraseDuration(12));
    expect(background("execution-sheet-side-recovery-pill")).toBe(ORANGE);
    screen.unmount();
    renderSheet({ pending: true, parent: params({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 20 }) });
    expect(background("execution-sheet-side-recovery-pill")).not.toBe(ORANGE);
    screen.unmount();
    renderSheet({ pending: false });
    chooseExecutionSide("Avec");
    expect(background("execution-sheet-side-recovery-pill")).not.toBe(ORANGE);
  });

  it("Compte à rebours et Fin affichés (Exercice du Catalogue) : orange avant le premier ✓, normal ensuite", () => {
    renderSheet({ pending: true, withRecovery: false, exerciseSignals: "present" });
    showExerciseDurationSignals();
    expect(background("execution-sheet-countdown-pill")).toBe(ORANGE);
    expect(background("execution-sheet-end-pill")).toBe(ORANGE);
    screen.unmount();
    renderSheet({ pending: false, withRecovery: false, exerciseSignals: "present" });
    showExerciseDurationSignals();
    expect(background("execution-sheet-countdown-pill")).not.toBe(ORANGE);
    expect(background("execution-sheet-end-pill")).not.toBe(ORANGE);
  });

  it("une valeur à renseigner garde son rouge : l'orange n'est jamais posé sur la Cible manquante", () => {
    renderSheet({ pending: true, parent: params({ series: { kind: "UNIFORM", count: 1, target: { kind: "UNSET" }, pauseSeconds: 0, loadKg: 0, workPhases: [] } }) });
    expect(background("execution-sheet-recovery")).toBe(ORANGE);
    expect(query("execution-sheet-target-value") === null || background("execution-sheet-target-value") !== ORANGE).toBe(true);
  });
});
