import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Constat a) de la recette du 18/11/2026 (Hermann, « Concept série / tour de l'EMOM à plusieurs mouvements ») : libellés du
 * questionnaire, des colonnes du tableau et de la modale selon le mode d'exécution. « À la suite » : « Nombre de séries », S1 … SN,
 * « X séries identiques / variables » (inchangés) ; « Dans chaque intervalle » et « En alternance » : « Nombre de tours », T1 … TN,
 * « X tours identiques / variables ». Le libellé suit le mode dès qu'il change. Aucun contrôle visuel.
 */

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({
      getState: () => ({
        index: 2,
        routes: [{ name: "(tabs)" }, { name: "(creation)", params: { screen: "composition", params: { sessionId: "ses-1" } } }, { name: "format-summary", params: { model: "EMOM" } }],
      }),
    }),
    useLocalSearchParams: () => ({ model: "EMOM" }),
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
const BURPEES = movement("mv-burpees", "Burpees");
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS, level: null },
    { movement: FENTES, level: null },
    { movement: BURPEES, level: null },
  ],
} as never;
const t = strings.screens.formatModel;

/**
 * D-603 / D-604 (Hermann, 25/11/2026 ; Formats §§ 9.6 et 9.7) : à la première ouverture, le choix des mouvements s'affiche en premier.
 * Les scénarios qui commencent par les paramètres le quittent d'abord, comme l'utilisateur (« Fermer sans sélectionner »).
 */
async function openedFormat() {
  const title = await screen.findByTestId("format-title");
  const leave = screen.queryByTestId("format-catalogue-add");
  if (leave !== null) {
    await act(async () => {
      fireEvent.press(leave);
    });
  }
  return title;
}

function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft);
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

async function pick(query: string, id: string) {
  fireEvent.press(screen.getByTestId("format-movements-link"));
  fireEvent.changeText(screen.getByTestId("format-catalogue-search"), query);
  fireEvent.press(await screen.findByTestId(`format-catalogue-card-${id}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
}

function setCount(digits: string) {
  fireEvent(screen.getByTestId("format-seriesCount"), "focus");
  fireEvent.changeText(screen.getByTestId("format-seriesCount"), digits);
  fireEvent(screen.getByTestId("format-seriesCount"), "blur");
}

const heads = () => screen.getAllByTestId(/^format-movements-head-\d+$/).map((head) => String(head.props.children));

/** EMOM à trois mouvements, N = 3. */
async function openThree() {
  render(<Harness />);
  await openedFormat();
  await pick("Squ", "mv-squats");
  await pick("Fen", "mv-fentes");
  await pick("Bur", "mv-burpees");
  setCount("3");
}

/**
 * Modale du premier mouvement (unité choisie). D-604 (Hermann, 25/11/2026 ; Formats § 9.7, Figma `8795:14588`, `8598:30515`) : la
 * modale d'un exercice EMOM n'a plus de ligne Séries (nombre de séries ou de tours réglé sur l'écran du format). [Libellé « N tours /
 * séries identiques » de la modale (constat a du 18/11/2026) — remplacé.]
 */
async function sheetSeriesRow() {
  fireEvent.press(screen.getByTestId("format-line-0-name-open"));
  await screen.findByTestId("execution-sheet");
  fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
  return screen.queryByTestId("execution-sheet-row-series-type", { includeHiddenElements: true });
}

describe("Constat a) du 18/11/2026 — EMOM à plusieurs mouvements, libellés série / tour selon le mode", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
  });

  it.each([
    ["EACH_INTERVAL", t.rows.roundCount, ["T1", "T2", "T3"], /3 tours identiques/],
    ["ALTERNATED", t.rows.roundCount, ["T1", "T2", "T3"], /3 tours identiques/],
    ["SEQUENCE", t.rows.seriesCount, ["S1", "S2", "S3"], /3 séries identiques/],
  ] as [string, string, readonly string[], RegExp][])("%s, M = 3, N = 3 : questionnaire, colonnes et modale", async (mode, question, columns, sheet) => {
    await openThree();
    fireEvent.press(screen.getByTestId(`format-execution-${mode}`));
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(question, { exact: false });
    expect(heads()).toEqual([...columns]);
    void sheet;
    expect(await sheetSeriesRow()).toBeNull();
    expect(screen.getByTestId("execution-sheet-row-target", { includeHiddenElements: true })).toBeTruthy();
  });

  it("le libellé du questionnaire et les colonnes suivent le mode dès qu'il change", async () => {
    await openThree();
    // Mode par défaut de l'EMOM : « Dans chaque intervalle ».
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(t.rows.roundCount, { exact: false });
    fireEvent.press(screen.getByTestId("format-execution-SEQUENCE"));
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(t.rows.seriesCount, { exact: false });
    expect(heads()).toEqual(["S1", "S2", "S3"]);
    fireEvent.press(screen.getByTestId("format-execution-ALTERNATED"));
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(t.rows.roundCount, { exact: false });
    expect(heads()).toEqual(["T1", "T2", "T3"]);
  });

  it("EMOM à un seul mouvement : « Nombre de séries » et S1 … SN, inchangés", async () => {
    render(<Harness />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    setCount("3");
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(t.rows.seriesCount, { exact: false });
    expect(heads()).toEqual(["S1", "S2", "S3"]);
  });
});
