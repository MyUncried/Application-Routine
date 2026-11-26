import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";

import type { Movement } from "@/domain/activities/Movement";
import type { FormatModelKey } from "@/domain/sessions/formatModels";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-603 / D-604 (Hermann, 25/11/2026 ; Formats §§ 9.6 et 9.7 ; numérotés D-568 et D-569 sur la branche de documentation) :
 * - séquence d'ouverture : à la première ouverture de tous les formats, sans exception, l'écran de choix des mouvements (mode catalogue
 *   du format) s'affiche en premier ; les paramètres restent accessibles par le lien du haut, « Paramètres » ; aucun nouvel écran ;
 * - modale « Paramètres d'exécution » d'un exercice d'un format à départ rapide : Charge et De chaque côté (et Mode quand le format
 *   n'impose pas l'unité — interprétation à confirmer).
 * La réouverture d'un format (« Modifier le format », `circuitId`) reste sur ses paramètres (FormatModelScreen.c3, test « (e) D-604 »).
 * Jest ne prouve que l'arbre JS : la vérification visuelle et tactile est faite par Hermann sur iPhone.
 */

let mockModel = "TABATA";
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({ getState: () => ({ index: 1, routes: [{ name: "(tabs)" }, { name: "formats-window" }] }) }),
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
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [{ movement: SQUATS, level: null }],
} as never;
const t = strings.screens.formatModel;
const sheet = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;

function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft);
  const update = (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const value = { draft, updateDraft: update, suggestDraftName: (name: string) => update({ name }), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage="summary" />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

// D-608 : HIIT, nouveau format, compris dans « tous les formats ».
const ALL_FORMATS: readonly FormatModelKey[] = ["TABATA", "INTERVALS_30_30", "HIIT", "STRENGTH", "PROGRESSION", "UNTIL_FAILURE", "SUPERSET", "EMOM", "AMRAP", "DEATH_BY", "FOR_TIME"];

describe("D-603 — séquence d'ouverture : choix des mouvements en premier, lien « Paramètres »", () => {
  it.each(ALL_FORMATS)("%s : première ouverture sur le choix des mouvements ; « Paramètres » rend les paramètres, sans ajout", async (model) => {
    mockModel = model;
    render(<Harness />);
    await screen.findByTestId("format-title");
    // Choix des mouvements au premier plan, sans fondu d'ouverture ; paramètres montés dessous, masqués à VoiceOver.
    expect(screen.getByTestId("format-catalogue-layer")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue")).toBeTruthy();
    expect(screen.getByTestId("format-summary", hidden).props.accessibilityElementsHidden).toBe(true);
    // Section des mouvements, lien du haut « Paramètres ».
    const link = screen.getByTestId("format-movements-link");
    expect(link).toHaveTextContent(t.backToParameters);
    expect(t.backToParameters).toBe("Paramètres");
    await act(async () => {
      fireEvent.press(link);
    });
    await waitFor(() => expect(screen.queryByTestId("format-catalogue-layer")).toBeNull());
    expect(screen.getByTestId("format-summary").props.accessibilityElementsHidden).toBe(false);
    // Aucun mouvement ajouté ; le choix des mouvements se rouvre par « + Ajouter » (section des mouvements ou de la boucle).
    expect(screen.queryByTestId("format-line-0-name-open")).toBeNull();
  });

  it("Tabata : un mouvement choisi à la première ouverture est ajouté, puis les paramètres s'affichent", async () => {
    mockModel = "TABATA";
    render(<Harness />);
    await screen.findByTestId("format-title");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    await waitFor(() => expect(screen.queryByTestId("format-catalogue-layer")).toBeNull());
    expect(screen.getByTestId("format-line-0-name-open")).toBeTruthy();
  });
});

describe("D-604 — modale d'un exercice d'un format à départ rapide, ouverte depuis l'écran du format", () => {
  async function sheetOf(model: FormatModelKey) {
    mockModel = model;
    render(<Harness />);
    await screen.findByTestId("format-title");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    await waitFor(() => expect(screen.queryByTestId("format-catalogue-layer")).toBeNull());
    fireEvent.press(screen.getByTestId("format-line-0-name-open"));
    await screen.findByTestId("execution-sheet");
  }

  const absent = [
    "execution-sheet-frame-phases",
    "execution-sheet-row-series-type",
    "execution-sheet-row-target",
    "execution-sheet-row-pause",
    "execution-sheet-frame-cadence",
    "execution-sheet-frame-recovery",
    "execution-sheet-row-stop-condition",
    "execution-sheet-row-side-recovery",
  ];

  it.each([
    ["TABATA", "Tabata", false],
    ["INTERVALS_30_30", "30/30", false],
    // D-608 : HIIT, comme le 30/30 (Durée imposée).
    ["HIIT", "HIIT", false],
    ["STRENGTH", strings.screens.sessionModels.cards.STRENGTH.title, true],
    ["PROGRESSION", strings.screens.sessionModels.cards.PROGRESSION.title, true],
    ["UNTIL_FAILURE", strings.screens.sessionModels.cards.UNTIL_FAILURE.title, true],
    ["SUPERSET", strings.screens.sessionModels.cards.SUPERSET.title, true],
  ] as [FormatModelKey, string, boolean][])("%s : Charge et De chaque côté (Mode si l'unité est libre : %s) ; nom du format dans le titre", async (model, name, unitOpen) => {
    await sheetOf(model);
    expect(screen.getByText(`${sheet.title} ${strings.screens.sessionModels.cards[model].title}`, hidden)).toBeTruthy();
    void name;
    expect(screen.getByTestId("execution-sheet-row-load", hidden)).toBeTruthy();
    expect(screen.getByTestId("execution-sheet-row-side", hidden)).toBeTruthy();
    for (const testID of absent) expect(screen.queryByTestId(testID, hidden)).toBeNull();
    if (unitOpen) expect(screen.getByTestId("execution-sheet-row-mode", hidden)).toBeTruthy();
    else expect(screen.queryByTestId("execution-sheet-frame-execution", hidden)).toBeNull();
  });
});
