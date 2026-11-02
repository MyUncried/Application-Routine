import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
let mockModel = "TABATA";

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo }),
    useLocalSearchParams: () => ({ model: mockModel }),
    useFocusEffect: () => undefined,
  };
});

/**
 * PRE-9 C.3 / C.4 (référence Formats du 02/11/2026 §7 ; CE-FMT-02) — questionnaire (croix), saisie d'un
 * mouvement, récapitulatif (Retour, réponses conservées), « Enregistrer dans la séance » qui ajoute au
 * brouillon de Composition sans sauvegarde définitive.
 */

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
    { movement: SQUATS, definitionCount: 0, level: { rank: 3, total: 3 } },
    { movement: FENTES, definitionCount: 0, level: null },
  ],
} as never;

const t = strings.screens.formatModel;

function Harness({ draftRef }: { draftRef: { current: SessionDraft } }) {
  const [stage, setStage] = useState<"questionnaire" | "summary">("questionnaire");
  const [draft, setDraft] = useState<SessionDraft>(draftRef.current);
  const value = {
    draft,
    updateDraft: (patch: Partial<SessionDraft>) =>
      setDraft((current) => {
        const next = { ...current, ...patch };
        draftRef.current = next;
        return next;
      }),
    suggestDraftName: (name: string) =>
      setDraft((current) => {
        const next = { ...current, name };
        draftRef.current = next;
        return next;
      }),
    resetDraft: jest.fn(),
    hydrateFromSession: jest.fn(),
  } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage={stage} />
            <Pressable onPress={() => setStage(stage === "questionnaire" ? "summary" : "questionnaire")} testID="harness-stage">
              <Text>{stage}</Text>
            </Pressable>
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

describe("FormatModelScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockDismissTo.mockReset();
  });

  it("questionnaire Tabata : croix, paramètres 8 / 20 s / 10 s, durée 4 min, Déroulé générique ; enregistrer impossible sans mouvement", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    expect(await screen.findByText(`${t.titlePrefix} Tabata`)).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount-badge")).toHaveTextContent("8");
    expect(screen.getByTestId("format-workSeconds-badge")).toHaveTextContent("20 s");
    expect(screen.getByTestId("format-pauseSeconds-badge")).toHaveTextContent("10 s");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("« + Ajouter » ouvre le champ et devient « Ouvrir le catalogue » ; la saisie propose les Mouvements ; le choix ouvre le récapitulatif ; Retour : réponses conservées", async () => {
    mockModel = "TABATA";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByText(`${t.titlePrefix} Tabata`);
    // Réglage modifié avant d'ajouter un mouvement : 6 séries.
    fireEvent.press(screen.getByTestId("format-seriesCount-badge"));
    fireEvent.press(screen.getByTestId("format-seriesCount-decrease"));
    fireEvent.press(screen.getByTestId("format-seriesCount-decrease"));
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.getByText(t.openCatalogue)).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("format-search"), "Squ");
    const suggestion = await screen.findByTestId("format-suggestion-mv-squats");
    await act(async () => {
      fireEvent.press(suggestion);
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model: "TABATA" } }));

    // Récapitulatif (même brouillon de modèle) : Retour, carte du mouvement, réponses conservées.
    fireEvent.press(screen.getByTestId("harness-stage"));
    expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.backAccessibilityLabel);
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount-value")).toHaveTextContent("6");

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    // Ajout au brouillon : un Exercice standard de 6 séries ; nom du modèle suggéré ; retour à la Composition.
    expect(draftRef.current.exercises).toHaveLength(1);
    expect(draftRef.current.exercises[0]!).not.toHaveProperty("format");
    expect(draftRef.current.name).toBe("Tabata");
    expect(mockDismissTo).toHaveBeenCalledWith("/composition");
  });

  it("récapitulatif AMRAP à deux mouvements : tableau Mouvement | Rép. | Max ; Circuit porteur ajouté au brouillon", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByText(`${t.titlePrefix} AMRAP`);
    for (const query of ["Squ", "Fen"]) {
      fireEvent.press(screen.getByTestId("format-movements-link"));
      fireEvent.changeText(screen.getByTestId("format-search"), query);
      const id = query === "Squ" ? "mv-squats" : "mv-fentes";
      const suggestion = await screen.findByTestId(`format-suggestion-${id}`);
      await act(async () => {
        fireEvent.press(suggestion);
      });
    }
    fireEvent.press(screen.getByTestId("harness-stage"));
    const table = screen.getByTestId("format-amrap-table");
    expect(within(table).getByText(t.table.max)).toBeTruthy();
    expect(within(table).queryByText(t.table.perRound)).toBeNull();
    fireEvent.press(screen.getByTestId("format-amrap-max-1"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [circuit] = structureCircuits(draftRef.current.structure!);
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 1, format: { key: "AMRAP", settings: { blockSeconds: 720 } } });
    expect(circuit!.exercises).toHaveLength(2);
  });
});
