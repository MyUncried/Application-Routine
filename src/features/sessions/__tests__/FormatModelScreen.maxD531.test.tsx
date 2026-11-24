import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useEffect, useState } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { maxLocked, type FormatModelKey, type ModelMovement } from "@/domain/sessions/formatModels";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-531 / RM-270 à RM-272 (Hermann, 19/11/2026) — « Max » (À l'échec) : autorisé pour le buy-in de l'AMRAP et l'AMRAP à un seul
 * mouvement ; interdit (grisé, message court) pour un mouvement d'une boucle de plusieurs mouvements, en AMRAP et en For time ; pas de
 * Max en buy-out. Aucun contrôle visuel : la vérification visuelle et tactile est faite par Hermann sur iPhone.
 */

let mockModel = "AMRAP";
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({
      getState: () => ({
        index: 2,
        routes: [{ name: "(tabs)" }, { name: "(creation)", params: { screen: "composition", params: { sessionId: "ses-1" } } }, { name: "format-summary", params: { model: mockModel } }],
      }),
    }),
    useLocalSearchParams: () => ({ model: mockModel }),
    useFocusEffect: () => undefined,
  };
});

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});
const SQUATS = movement("mv-squats", "Squats sautés");
const FENTES = movement("mv-fentes", "Fentes avant");
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS, level: null },
    { movement: FENTES, level: null },
  ],
} as never;
const t = strings.screens.formatModel;

function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft);
  useEffect(() => undefined, [draft]);
  const update = (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const value = { draft, updateDraft: update, suggestDraftName: (name: string) => update({ name }), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage="questionnaire" />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

async function open(model: FormatModelKey) {
  mockModel = model;
  render(<Harness />);
  await screen.findByTestId("format-title");
}

async function pick(query: string, id: string, section: string) {
  fireEvent.press(screen.getByTestId(`${section}-link`));
  fireEvent.changeText(screen.getByTestId("format-catalogue-search"), query);
  fireEvent.press(await screen.findByTestId(`format-catalogue-card-${id}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
}

async function validateSheet() {
  for (let press = 0; press < 2 && screen.queryByTestId("execution-sheet") !== null; press += 1)
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    });
  await waitFor(() => expect(screen.queryByTestId("execution-sheet")).toBeNull(), { timeout: 4000 });
}

/** Répétitions choisies dans la modale du mouvement `index`, objectif 10, incrément renseigné. */
async function repetitions(index: number) {
  fireEvent.press(screen.getByTestId(`format-line-${index}-name-open`));
  await screen.findByTestId("execution-sheet");
  fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
  const hidden = { includeHiddenElements: true };
  if (screen.queryByTestId("execution-sheet-target", hidden) !== null) enterExecutionSheetValue("execution-sheet-target", 10, "integer");
  const increment = screen.queryByTestId("execution-sheet-format-increment", hidden);
  if (increment !== null && within(increment).queryByText("—") !== null) enterExecutionSheetValue("execution-sheet-format-increment", 1, "integer");
  await validateSheet();
}

const disabled = (id: string) => (screen.getByTestId(id).props.accessibilityState as { disabled?: boolean } | undefined)?.disabled === true;

const model = (id: string, role: "TOUR" | "BUY_IN" | "BUY_OUT"): ModelMovement =>
  ({ exercise: { id, name: id }, values: { mode: "REPETITIONS", repetitions: 10 }, ...(role === "BUY_IN" ? { buyIn: true } : role === "BUY_OUT" ? { buyOut: true } : {}) }) as unknown as ModelMovement;

describe("D-531 — disponibilité de « Max » (À l'échec)", () => {
  it("règle : grisé pour un mouvement d'une boucle de plusieurs mouvements (AMRAP, For time) ; libre pour un seul mouvement et pour le buy-in", () => {
    expect(maxLocked("AMRAP", [model("a", "TOUR")], 0)).toBe(false);
    expect(maxLocked("AMRAP", [model("a", "TOUR"), model("b", "TOUR")], 0)).toBe(true);
    expect(maxLocked("FOR_TIME", [model("a", "TOUR"), model("b", "TOUR")], 1)).toBe(true);
    expect(maxLocked("AMRAP", [model("in", "BUY_IN"), model("a", "TOUR")], 0)).toBe(false);
    expect(maxLocked("AMRAP", [model("in", "BUY_IN"), model("a", "TOUR")], 1)).toBe(false);
    expect(maxLocked("EMOM", [model("a", "TOUR"), model("b", "TOUR")], 0)).toBe(false);
  });

  it("AMRAP à un seul mouvement : Max proposé et cochable", async () => {
    await open("AMRAP");
    await pick("Squ", "mv-squats", "format-loop");
    await repetitions(0);
    expect(disabled("format-amrap-max-0")).toBe(false);
    fireEvent.press(screen.getByTestId("format-amrap-max-0"));
    expect((screen.getByTestId("format-amrap-max-0").props.accessibilityState as { checked?: boolean }).checked).toBe(true);
    expect(screen.queryByTestId("format-max-locked")).toBeNull();
  });

  it("AMRAP à deux mouvements en boucle : Max grisé ; l'appui montre le message court sans cocher ; modale : À l'échec grisé avec le même message", async () => {
    await open("AMRAP");
    await pick("Squ", "mv-squats", "format-loop");
    await pick("Fen", "mv-fentes", "format-loop");
    await repetitions(0);
    await repetitions(1);
    expect(disabled("format-amrap-max-0")).toBe(true);
    expect(disabled("format-amrap-max-1")).toBe(true);
    expect(screen.queryByTestId("format-max-locked")).toBeNull();
    fireEvent.press(screen.getByTestId("format-amrap-max-1"));
    expect(screen.getByTestId("format-max-locked")).toHaveTextContent(t.maxLocked);
    expect((screen.getByTestId("format-amrap-max-1").props.accessibilityState as { checked?: boolean }).checked).toBe(false);
    // Modale du mouvement de boucle : « À l'échec » grisé, message court sous le cadre Exécution.
    fireEvent.press(screen.getByTestId("format-line-0-name-open"));
    await screen.findByTestId("execution-sheet");
    expect(screen.getByTestId("execution-sheet-max-refused")).toHaveTextContent(t.maxLocked);
    expect(disabled("execution-sheet-stop-condition-control-FAILURE")).toBe(true);
    expect(disabled("execution-sheet-stop-condition-control-TARGET")).toBe(false);
  });

  it("Max déjà coché, puis un second mouvement en boucle : rien n'est retiré d'office — Max reste coché et décochable", async () => {
    await open("AMRAP");
    await pick("Squ", "mv-squats", "format-loop");
    await repetitions(0);
    fireEvent.press(screen.getByTestId("format-amrap-max-0"));
    await pick("Fen", "mv-fentes", "format-loop");
    const max = () => screen.getByTestId("format-amrap-max-0").props.accessibilityState as { checked?: boolean; disabled?: boolean };
    expect(max()).toMatchObject({ checked: true, disabled: false });
    fireEvent.press(screen.getByTestId("format-amrap-max-0"));
    expect(max()).toMatchObject({ checked: false, disabled: true });
  });

  it("buy-in de l'AMRAP : À l'échec proposé dans la modale (règle existante), sans message", async () => {
    await open("AMRAP");
    await pick("Squ", "mv-squats", "format-buy-in");
    await pick("Fen", "mv-fentes", "format-loop");
    await pick("Squ", "mv-squats", "format-loop");
    fireEvent.press(screen.getByTestId("format-line-0-name-open"));
    await screen.findByTestId("execution-sheet");
    fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
    expect(screen.queryByTestId("execution-sheet-max-refused")).toBeNull();
    expect(disabled("execution-sheet-stop-condition-control-FAILURE")).toBe(false);
  });
});
