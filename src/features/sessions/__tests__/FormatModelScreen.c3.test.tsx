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
const mockDismiss = jest.fn();
let mockModel = "TABATA";
// Pile de création : Composition d'une Séance du Catalogue (`sessionId`), questionnaire, récapitulatif.
const mockStack = {
  index: 2,
  routes: [
    { name: "composition", params: { sessionId: "ses-1" } },
    { name: "format-questionnaire", params: { model: "TABATA" } },
    { name: "format-summary", params: { model: "TABATA" } },
  ],
};

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo, dismiss: mockDismiss }),
    useNavigation: () => ({ getState: () => mockStack }),
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
  // Réouverture du questionnaire depuis la fenêtre Formats : écran remonté, brouillon de modèle conservé par le fournisseur.
  const [opening, setOpening] = useState(0);
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
            <FormatModelScreen key={opening} stage={stage} />
            <Pressable
              onPress={() => {
                setStage("questionnaire");
                setOpening((value) => value + 1);
              }}
              testID="harness-reopen"
            >
              <Text>reopen</Text>
            </Pressable>
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
    mockDismiss.mockReset();
  });

  it("questionnaire Tabata : croix, paramètres 8 / 20 s / 10 s, durée 4 min, Déroulé générique ; enregistrer impossible sans mouvement", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    expect(await screen.findByText("Configurer un Tabata")).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount-badge")).toHaveTextContent("8");
    expect(screen.getByTestId("format-workSeconds-badge")).toHaveTextContent("20 s");
    expect(screen.getByTestId("format-pauseSeconds-badge")).toHaveTextContent("10 s");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("« + Ajouter » ouvre le champ et devient « Ouvrir le catalogue » ; la saisie propose les Mouvements ; Tabata : le choix reste sur le questionnaire, « Enregistrer dans la séance » (décision du 03/11)", async () => {
    mockModel = "TABATA";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByText(t.titles.TABATA);
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
    // Décision du 03/11/2026 : l'écran suivant est la séance — pas de récapitulatif, enregistrement sur place.
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount-value")).toHaveTextContent("6");

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    // Ajout au brouillon : un Exercice standard de 6 séries ; nom du modèle suggéré ; retour à la Composition.
    expect(draftRef.current.exercises).toHaveLength(1);
    expect(draftRef.current.exercises[0]!).not.toHaveProperty("format");
    expect(draftRef.current.name).toBe("Tabata");
    // Recette n° 3 du 03/11 : on dépile jusqu'à la Composition (paramètre `sessionId` conservé), sans `dismissTo`.
    expect(mockDismiss).toHaveBeenCalledWith(2);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it.each(["AMRAP", "FOR_TIME", "PROGRESSION"] as const)("recette n° 3 du 03/11 : %s — les choix restent sur le questionnaire ; « Valider ces paramètres » ouvre le récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByText(t.titles[model]);
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByTestId("format-save")).toBeNull();
    await pick("Squ", "mv-squats");
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-validate"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/format-summary", params: { model } });
    fireEvent.press(screen.getByTestId("harness-stage"));
    expect(screen.getByTestId("format-save")).toBeTruthy();
  });

  it("récapitulatif AMRAP à deux mouvements : tableau Mouvement | Rép. | Max ; Circuit porteur ajouté au brouillon", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByText(t.titles.AMRAP);
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

  async function pick(query: string, id: string) {
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-search"), query);
    const suggestion = await screen.findByTestId(`format-suggestion-${id}`);
    await act(async () => {
      fireEvent.press(suggestion);
    });
  }

  it("recette n° 3 (f3-tabata) : Tabata À la suite à deux mouvements — durée exacte « 8 min 50 s », sans arrondi", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByText(t.titles.TABATA);
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    fireEvent.press(screen.getByTestId("harness-stage"));
    expect(screen.getByTestId("format-total")).toHaveTextContent("8 min 50 s");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("8 min 50 s");
    expect(screen.getByTestId("format-recoveryBetweenSeconds-badge")).toHaveTextContent("1 min");
  });

  it("recette n° 3 (f3-emom) : EMOM dans chaque intervalle — un cadre par intervalle avec les deux mouvements", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByText(t.titles.EMOM);
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    fireEvent.press(screen.getByTestId("harness-stage"));
    const groups = screen.getAllByTestId(/^format-timeline-group-/);
    expect(groups).toHaveLength(6);
    expect(groups[0]!.props.children).toHaveLength(2);
  });

  it("recette n° 3 (f3-questionnaire) : le dernier mouvement se supprime, l'enregistrement devient indisponible", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByText(t.titles.TABATA);
    await pick("Squ", "mv-squats");
    fireEvent.press(screen.getByTestId("harness-stage"));
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent(screen.getByTestId("format-movement-0-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByTestId("format-movement-card-0")).toBeNull();
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("recette n° 3 (f3-questionnaire) : un deuxième format de la même séance ouvre un questionnaire vierge ; aucune identité d'Exercice partagée", async () => {
    mockModel = "TABATA";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByText(t.titles.TABATA);
    await pick("Squ", "mv-squats");
    fireEvent.press(screen.getByTestId("harness-stage"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    fireEvent.press(screen.getByTestId("harness-reopen"));
    await waitFor(() => expect(screen.queryByTestId("format-movement-card-0")).toBeNull());
    expect(screen.getByTestId("format-seriesCount-badge")).toHaveTextContent("8");
    await pick("Squ", "mv-squats");
    fireEvent.press(screen.getByTestId("harness-stage"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const ids = draftRef.current.exercises.map((exercise) => exercise.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
