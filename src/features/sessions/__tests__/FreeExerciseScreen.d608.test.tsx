import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { numberTarget, stopConditionOf, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { freeExerciseOf, withFreeValues } from "@/domain/sessions/carrierMembership";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { FreeExerciseScreen } from "@/features/sessions/FreeExerciseScreen";
import {
  exerciseOfFreePage,
  FREE_EXERCISE_RECOVERY_SECONDS,
  handMovementToFreeExercise,
  takeFreeExerciseHandedToComposition,
  type FreeExerciseHandoff,
} from "@/features/sessions/movementExercises";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-608 (D-573 point 5 et D-571 point 2 de la branche de documentation `docs/planification-grille-creneaux` 3524f351, Hermann,
 * 26/11/2026 ; Formats § 9.10, paragraphe « Page « Exercice libre » » ; Figma « Exercice libre — Choix du mouvement » `13259:25991` et
 * « Exercice libre — Modale de type format » `13269:26160`) — création d'un exercice libre :
 * carte Libre → choix du mouvement (un seul, ✓ inactif sans mouvement ; nom inexistant validé → fiche de création) → page (cadre
 * Mouvement avec « Changer », phases seulement si le mouvement en a, Mode Répétitions et « À l'objectif » par défaut, Séries, Charge,
 * De chaque côté, Cadence, Récupération 30″) → ✓ : exercice remis à la Composition avec ses champs standards.
 * Jest ne prouve que l'arbre JS : le rendu et les gestes se vérifient sur iPhone.
 */

const mockPush = jest.fn();
const focusEffects: (() => void)[] = [];
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: jest.fn(), dismiss: jest.fn() }),
    useFocusEffect: (effect: () => void) => {
      focusEffects.push(effect);
    },
  };
});

const hidden = { includeHiddenElements: true } as const;

const movement = (id: string, name: string, phases: Movement["phases"] = []): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "jambes",
  bodyZoneIds: ["cuisses"],
  phases,
  nextPhaseId: phases.length + 1,
  aliases: [],
  levelGroup: null,
});
const SQUATS = movement("mv-squats", "Squats sautés");
const GAINAGE = movement("mv-gainage", "Gainage lent", [
  { id: 1, label: "Descente", defaultDurationSeconds: 3 },
  { id: 2, label: "Maintien", defaultDurationSeconds: 2 },
  { id: 3, label: "Remontée", defaultDurationSeconds: 1 },
] as unknown as Movement["phases"]);
const entry = (value: Movement): MovementCatalogueEntry => ({ movement: value, level: null, exerciseCount: 0, archived: false });
const service = { supportsMovementSearch: true, movementCatalogue: { listEntries: async () => [entry(SQUATS), entry(GAINAGE)] } } as never;

function renderScreen() {
  const onClose = jest.fn();
  const onDone = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <FreeExerciseScreen onClose={onClose} onDone={onDone} />
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { onClose, onDone };
}

const validate = () => screen.getByTestId("free-exercise-choice-validate");
const isSelected = (testID: string) => screen.getByTestId(testID).props.accessibilityState?.selected === true;

async function openPage(card: string) {
  fireEvent.press(await screen.findByTestId(card));
  await act(async () => {
    fireEvent.press(validate());
  });
  await screen.findByTestId("free-exercise-page");
}

describe("D-608 — écran « Exercice libre — Choix du mouvement »", () => {
  beforeEach(() => {
    mockPush.mockReset();
    focusEffects.length = 0;
    takeFreeExerciseHandedToComposition();
  });

  it("coque du format : zone grise, titre « Exercice libre », accroche ; recherche, filtre, tri ; catalogue ; aucun « + Créer un mouvement »", async () => {
    renderScreen();
    expect(screen.getByTestId("free-exercise-choice-context")).toHaveStyle({ backgroundColor: "#F1F2F5" });
    expect(screen.getByTestId("free-exercise-choice-title")).toHaveTextContent("Exercice libre");
    expect(screen.getByTestId("free-exercise-choice-tagline")).toHaveTextContent("Réglez librement chaque paramètre de l’exercice.");
    expect(screen.getByTestId("free-exercise-search")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-filter")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-sort")).toBeTruthy();
    expect(await screen.findByTestId("free-exercise-card-mv-squats")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-card-mv-gainage")).toBeTruthy();
    expect(screen.queryByText(/Créer un mouvement/)).toBeNull();
  });

  it("✓ inactif tant qu'aucun mouvement n'est choisi ; un seul mouvement à la fois", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    expect(validate().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(validate());
    expect(screen.queryByTestId("free-exercise-page")).toBeNull();
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-squats"));
    expect(isSelected("free-exercise-card-mv-squats")).toBe(true);
    expect(validate().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-gainage"));
    expect(isSelected("free-exercise-card-mv-gainage")).toBe(true);
    expect(isSelected("free-exercise-card-mv-squats")).toBe(false);
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-gainage"));
    expect(validate().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("nom inexistant validé : la fiche de création s'ouvre avec ce nom ; le mouvement créé revient et ouvre la page", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.changeText(screen.getByTestId("free-exercise-search"), "Burpees croisés");
    expect(screen.getByTestId("free-exercise-empty")).toBeTruthy();
    fireEvent(screen.getByTestId("free-exercise-search"), "submitEditing");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement", params: { context: "free", name: "Burpees croisés" } });
    // Fiche enregistrée : le mouvement revient à l'écran (retour au premier plan).
    handMovementToFreeExercise(movement("mv-new", "Burpees croisés"));
    await act(async () => {
      focusEffects[focusEffects.length - 1]!();
    });
    expect(await screen.findByTestId("free-exercise-page")).toBeTruthy();
    expect(screen.getByText("Burpees croisés", hidden)).toBeTruthy();
  });

  it("nom existant validé : le mouvement est choisi, sans fiche de création", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.changeText(screen.getByTestId("free-exercise-search"), "squats sautés");
    fireEvent(screen.getByTestId("free-exercise-search"), "submitEditing");
    expect(mockPush).not.toHaveBeenCalled();
    expect(isSelected("free-exercise-card-mv-squats")).toBe(true);
  });

  it("croix : retour à la fenêtre « Créer un exercice »", async () => {
    const { onClose } = renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.press(screen.getByTestId("free-exercise-choice-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("D-608 — page « Exercice libre »", () => {
  beforeEach(() => {
    mockPush.mockReset();
    focusEffects.length = 0;
    takeFreeExerciseHandedToComposition();
  });

  it("coque : titre « Exercice libre », accroche, Retour ; cadres dans l'ordre ; Mouvement avec « Changer » ; sans phases : aucune ligne de phases", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    expect(screen.getByTestId("execution-sheet-page", hidden)).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-modal", hidden)).toBeNull();
    expect(screen.getByTestId("execution-sheet-title", hidden)).toHaveTextContent("Exercice libre");
    expect(screen.getByTestId("execution-sheet-free-context", hidden)).toHaveStyle({ backgroundColor: "#F1F2F5" });
    expect(screen.getByTestId("execution-sheet-free-tagline", hidden)).toHaveTextContent("Réglez librement chaque paramètre de l’exercice.");
    const pageIcon: unknown = screen.getByTestId("execution-sheet-cancel-icon", hidden).props.source;
    expect(screen.getByTestId("execution-sheet-change-movement", hidden)).toHaveTextContent("Changer");
    expect(screen.getByText("Squats sautés", hidden)).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-row-phases", hidden)).toBeNull();
    for (const id of [
      "execution-sheet-row-mode",
      "execution-sheet-row-stop-condition",
      "execution-sheet-row-series-type",
      "execution-sheet-row-load",
      "execution-sheet-row-side",
      "execution-sheet-row-beep",
      "execution-sheet-row-recovery",
    ]) {
      expect(screen.getByTestId(id, hidden)).toBeTruthy();
    }
    // Retour (chevron) à la place de la croix (Figma `13269:26160`) — icônes de référence rendues en dernier (nouveau rendu).
    const back: unknown = render(<KodjoIcon name="control-back" testID="reference-back" />).getByTestId("reference-back").props.source;
    const close: unknown = render(<KodjoIcon name="control-close" testID="reference-close" />).getByTestId("reference-close").props.source;
    expect(pageIcon).toEqual(back);
    expect(pageIcon).not.toEqual(close);
  });

  it("mouvement avec phases : ligne « Phases du mouvement » avec « 3 phases »", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-gainage");
    expect(screen.getByTestId("execution-sheet-row-phases", hidden)).toBeTruthy();
    expect(screen.getByText("3 phases", hidden)).toBeTruthy();
  });

  it("valeurs par défaut : Mode Répétitions, Condition d'arrêt « À l'objectif », séries identiques, Récupération 30″", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-stop-condition-control-TARGET", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-series-type-control-UNIFORM", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-row-recovery", hidden)).toHaveTextContent(/30/);
    expect(FREE_EXERCISE_RECOVERY_SECONDS).toBe(30);
  });

  it("« Changer » et Retour : retour au choix du mouvement", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    fireEvent.press(screen.getByTestId("execution-sheet-change-movement", hidden));
    expect(await screen.findByTestId("free-exercise-choice")).toBeTruthy();
    expect(isSelected("free-exercise-card-mv-squats")).toBe(true);
    await openPage("free-exercise-card-mv-gainage");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel", hidden));
    expect(await screen.findByTestId("free-exercise-choice")).toBeTruthy();
  });

  it("parcours complet, séries identiques : ✓ remet l'exercice à la Composition (paramètres, Récupération 30″) et retire les modales", async () => {
    const { onDone } = renderScreen();
    await openPage("free-exercise-card-mv-squats");
    enterExecutionSheetValue("execution-sheet-target", 12, "integer");
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate", hidden));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    const handed = takeFreeExerciseHandedToComposition();
    expect(handed?.movement.id).toBe("mv-squats");
    expect(handed?.recoverySeconds).toBe(30);
    expect(handed?.parameters.mode).toBe("REPETITIONS");
    expect(stopConditionOf(handed!.parameters)).toBe("TARGET");
    expect(handed?.parameters.series).toMatchObject({ kind: "UNIFORM", count: 1, target: { kind: "NUMBER", value: 12 } });
  });

  it("séries variables : le tableau s'affiche et les séries variables sont remises", async () => {
    const { onDone } = renderScreen();
    await openPage("free-exercise-card-mv-squats");
    enterExecutionSheetValue("execution-sheet-target", 10, "integer");
    enterExecutionSheetValue("execution-sheet-series", 3, "integer");
    fireEvent.press(screen.getByTestId("execution-sheet-series-type-control-VARIABLE", hidden));
    await waitFor(() => expect(screen.getByTestId("execution-sheet-series-type-control-VARIABLE", hidden).props.accessibilityState).toMatchObject({ selected: true }));
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate", hidden));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    const handed = takeFreeExerciseHandedToComposition();
    expect(handed?.parameters.series.kind).toBe("VARIABLE");
    expect(handed?.parameters.series.kind === "VARIABLE" && handed.parameters.series.rows.length).toBe(3);
  });
});

describe("D-608 — exercice créé : champs standards ; échange avec les formats (D-604)", () => {
  const parameters = (): ExecutionParameters =>
    ({
      version: 5,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 4, target: numberTarget(12), pauseSeconds: 45, loadKg: 0, workPhases: [] },
      sideMode: "BILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    }) as unknown as ExecutionParameters;
  const handoff = (): FreeExerciseHandoff => ({ movement: SQUATS, parameters: parameters(), recoverySeconds: 30 });

  it("exercice de la Composition : occurrence du mouvement, paramètres de la page, Récupération 30″, défauts du Profil validés", () => {
    const exercise = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    expect(exercise).toMatchObject({ id: "e1", name: "Squats sautés", sourceMovementId: "mv-squats", postActivityRecoverySeconds: 30, sideMode: "BILATERAL" });
    expect(exercise.executionParameters).toEqual(parameters());
    expect(exercise.profileDefaultsPending).toBeUndefined();
    expect(exercise.format).toBeUndefined();
  });

  it("entrée dans un format : valeurs libres conservées, masquées ; sortie : elles réapparaissent", () => {
    const created = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    const entered = { ...withFreeValues(created), format: { key: "EMOM" as const, settings: {} }, executionParameters: { ...parameters(), mode: "DURATION" as const } };
    expect(entered.freeValues?.executionParameters).toEqual(parameters());
    const exited = freeExerciseOf(entered as never);
    expect(exited.executionParameters).toEqual(parameters());
    expect(exited.postActivityRecoverySeconds).toBe(30);
    expect(exited.format).toBeUndefined();
  });

  it("exercice sorti d'un format sans valeurs libres : défauts d'un exercice libre (Répétitions, « À l'objectif »)", () => {
    const created = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    const exited = freeExerciseOf({ ...created, format: { key: "EMOM", settings: {} } } as never);
    expect(exited.executionParameters.mode).toBe("REPETITIONS");
    expect(stopConditionOf(exited.executionParameters)).toBe("TARGET");
  });
});
