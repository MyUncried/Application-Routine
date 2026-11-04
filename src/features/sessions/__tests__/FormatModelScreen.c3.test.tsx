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
 * brouillon de Composition sans sauvegarde définitive. Mise à jour consolidée du 04/11/2026 : modale sur la
 * Composition, sans nom de Séance ; « Valider les paramètres » ouvre le récapitulatif de tous les modèles.
 */

function toSummary() {
  fireEvent.press(screen.getByTestId("format-validate"));
}

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
  void setStage;
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

  it("questionnaire Tabata en modale : croix, nom du Format, aucun nom de Séance ; paramètres 8 / 20 s / 10 s, durée 4 min ; « Valider les paramètres » indisponible sans mouvement", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    expect(await screen.findByTestId("format-title")).toHaveTextContent("Tabata");
    expect(screen.getByTestId("format-sheet")).toBeTruthy();
    expect(screen.queryByTestId("format-name")).toBeNull();
    expect(screen.getByTestId("format-validate")).toHaveTextContent("Valider les paramètres");
    expect(screen.queryByTestId("format-save")).toBeNull();
    expect(screen.getByTestId("format-seriesCount-badge")).toHaveTextContent("8");
    expect(screen.getByTestId("format-workSeconds-badge")).toHaveTextContent("20 s");
    expect(screen.getByTestId("format-pauseSeconds-badge")).toHaveTextContent("10 s");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("« + Ajouter » ouvre le champ et devient « Ouvrir le mode catalogue » ; la saisie propose les Mouvements ; Tabata : le choix reste sur le questionnaire, « Valider les paramètres » ouvre le récapitulatif sur place, Retour y revient avec les réponses (MAJ 04/11)", async () => {
    mockModel = "TABATA";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
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
    // MAJ 04/11 §2 bis : le récapitulatif s'ouvre sur place, sans navigation ; Retour revient au questionnaire.
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount-value")).toHaveTextContent("6");
    toSummary();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-summary")).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    expect(screen.getByTestId("format-seriesCount").props.accessibilityValue).toEqual({ text: "6" });
    toSummary();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    // Ajout au brouillon : un Exercice standard ; nom du modèle suggéré ; retour à la Composition.
    expect(draftRef.current.exercises).toHaveLength(1);
    expect(draftRef.current.exercises[0]!).not.toHaveProperty("format");
    expect(draftRef.current.name).toBe("Tabata");
    // Recette n° 3 du 03/11 : on dépile jusqu'à la Composition (paramètre `sessionId` conservé), sans `dismissTo`.
    expect(mockDismiss).toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it.each(["AMRAP", "FOR_TIME", "PROGRESSION", "EMOM", "DEATH_BY", "STRENGTH"] as const)("recette n° 3 du 03/11, MAJ 04/11 : %s — les choix restent sur le questionnaire ; « Valider les paramètres » ouvre le récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByTestId("format-save")).toBeNull();
    await pick("Squ", "mv-squats");
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    toSummary();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-save")).toBeTruthy();
  });

  it("récapitulatif AMRAP à deux mouvements : tableau Mouvement | Rép. | Max ; Circuit porteur ajouté au brouillon", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    for (const query of ["Squ", "Fen"]) {
      fireEvent.press(screen.getByTestId("format-movements-link"));
      fireEvent.changeText(screen.getByTestId("format-search"), query);
      const id = query === "Squ" ? "mv-squats" : "mv-fentes";
      const suggestion = await screen.findByTestId(`format-suggestion-${id}`);
      await act(async () => {
        fireEvent.press(suggestion);
      });
    }
    toSummary();
    const table = screen.getByTestId("format-amrap-table");
    expect(within(table).getByText(t.table.max)).toBeTruthy();
    expect(within(table).getByText(t.table.objective)).toBeTruthy();
    expect(within(table).queryByText(t.table.perRound)).toBeNull();
    fireEvent.press(screen.getByTestId("format-amrap-max-1"));
    // Contre-recette n° 3 ter du 03/11/2026 : récapitulatif complet exigé — Rép. vide en rouge, bouton grisé.
    fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "10");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [circuit] = structureCircuits(draftRef.current.structure!);
    expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 1, format: { key: "AMRAP", settings: { blockSeconds: 720 } } });
    expect(circuit!.exercises).toHaveLength(2);
  });

  async function pick(query: string, id: string, section = "format-movements") {
    fireEvent.press(screen.getByTestId(`${section}-link`));
    fireEvent.changeText(screen.getByTestId("format-search"), query);
    const suggestion = await screen.findByTestId(`format-suggestion-${id}`);
    await act(async () => {
      fireEvent.press(suggestion);
    });
  }

  it("recette n° 3 du 03/11 (autres constats) : AMRAP Buy-in — sections Buy-in et En boucle dès le questionnaire ; buy-in choisi requis ; jamais un mouvement de boucle", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", true);
    expect(screen.getByText(t.buyInSection)).toBeTruthy();
    expect(screen.getByText(t.loopSection)).toBeTruthy();
    expect(screen.queryByTestId("format-movements-link")).toBeNull();
    // Deux mouvements en boucle : le bouton reste indisponible sans buy-in.
    await pick("Squ", "mv-squats", "format-loop");
    await pick("Fen", "mv-fentes", "format-loop");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Buy-in choisi dans sa section (même champ de saisie) : en tête, bouton disponible.
    await pick("Squ", "mv-squats", "format-buy-in");
    expect(screen.getByTestId("format-buy-in-link")).toHaveTextContent(t.change);
    expect(within(screen.getByTestId("format-buy-in-cards")).getByText("Squats sautés")).toBeTruthy();
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
    // Récapitulatif : « Changer » ouvre le même champ, pas le Catalogue — contre-recette n° 3 ter : le buy-in est
    // d'abord effacé ; on le choisit à nouveau.
    toSummary();
    fireEvent.press(screen.getByTestId("format-buy-in-link"));
    expect(screen.getByTestId("format-search")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId("format-buy-in-cards")?.children ?? []).toHaveLength(0);
    fireEvent.changeText(screen.getByTestId("format-search"), "Squ");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-suggestion-mv-squats"));
    });
    for (const index of [0, 1, 2]) fireEvent.changeText(screen.getByTestId(`format-amrap-reps-${index}`), "10");
    fireEvent.press(screen.getByTestId("format-loop-link"));
    expect(screen.getByTestId("format-loop-link")).toHaveTextContent(t.openCatalogue);
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [circuit] = structureCircuits(draftRef.current.structure!);
    expect(circuit!.exercises).toHaveLength(3);
    // MAJ 04/11 §6 bis 2 : Rôle dans le circuit (1 = Buy-in).
    expect(draftRef.current.exercises.map((exercise) => [exercise.name, exercise.format?.settings.circuitRole ?? 0])).toEqual([
      ["Squats sautés", 1],
      ["Squats sautés", 0],
      ["Fentes avant", 0],
    ]);
  });

  it("recette n° 3 du 03/11 (autres constats) : Buy-in désactivé — la section disparaît avec son mouvement", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", true);
    await pick("Squ", "mv-squats", "format-buy-in");
    await pick("Fen", "mv-fentes", "format-loop");
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", false);
    expect(screen.queryByText(t.buyInSection)).toBeNull();
    expect(screen.queryByText("Squats sautés")).toBeNull();
    expect(screen.getByText("Fentes avant")).toBeTruthy();
  });

  it("recette n° 3 du 03/11 (autres constats) : appui court sur un mouvement choisi — fiche en lecture seule", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    fireEvent.press(screen.getByTestId("format-movement-0"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement-sheet", params: { movementId: "mv-squats" } });
    // MAJ 04/11 §3 bis : l'appui sur la photo ouvre la Fiche du mouvement en consultation.
    mockPush.mockReset();
    fireEvent.press(screen.getByTestId("format-movement-card-0-photo-press"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement-sheet", params: { movementId: "mv-squats" } });
  });

  it("recette n° 3 du 03/11 (f3-depart) : Renforcement — la Pause est affichée et réglable", async () => {
    mockModel = "STRENGTH";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-row-pauseSeconds")).toBeTruthy();
    expect(screen.getByTestId("format-pauseSeconds-badge")).toHaveTextContent("0 s");
    fireEvent.press(screen.getByTestId("format-pauseSeconds-badge"));
    fireEvent.press(screen.getByTestId("format-pauseSeconds-increase"));
    expect(screen.getByTestId("format-pauseSeconds-value")).toHaveTextContent("5 s");
  });

  it("recette n° 3 bis du 03/11 (f3s-recherche) : saisie d'un mouvement — un toucher hors du champ ne retire pas le clavier", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-questionnaire").props.keyboardShouldPersistTaps).toBe("handled");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.getByTestId("format-questionnaire").props.keyboardShouldPersistTaps).toBe("always");
    expect(screen.getByTestId("format-questionnaire").props.keyboardDismissMode).toBe("none");
    expect(screen.getByTestId("format-search").props.submitBehavior).toBe("submit");
  });

  it("recette n° 3 bis du 03/11 (f3s-clavier) : cellules des tableaux sans touche « Next » — navigation par la barre", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    const cell = screen.getByTestId("format-amrap-reps-0");
    expect(cell.props.keyboardType).toBe("number-pad");
    expect(cell.props.returnKeyType).toBeUndefined();
    expect(cell.props.onSubmitEditing).toBeUndefined();
  });

  it("recette n° 3 du 03/11 (f3-depart) : À l'échec — aucune ligne de durée totale", async () => {
    mockModel = "UNTIL_FAILURE";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-row-target")).toBeTruthy();
    expect(screen.queryByTestId("format-row-total")).toBeNull();
  });

  it("recette n° 3 du 03/11 (f3-depart) : Progression — Pause affichée, pas de durée au questionnaire, Exécution en dernier ; tableau à noms fixes et séries défilantes", async () => {
    mockModel = "PROGRESSION";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    const rowsOf = () => within(screen.getByTestId("format-parameters")).getAllByTestId(/^format-row-/).map((row) => row.props.testID);
    // MAJ 04/11 §6 quater : « Avec charge » après Pause, au questionnaire seulement.
    expect(rowsOf()).toEqual(["format-row-seriesCount", "format-row-pauseSeconds", "format-row-withLoad"]);
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    expect(rowsOf()).toEqual(["format-row-seriesCount", "format-row-pauseSeconds", "format-row-withLoad", "format-row-execution"]);
    toSummary();
    expect(rowsOf()).toEqual(["format-row-seriesCount", "format-row-pauseSeconds", "format-row-total", "format-row-execution"]);
    const names = screen.getByTestId("format-progression-names");
    expect(within(names).getByText("Squats sautés")).toBeTruthy();
    const series = screen.getByTestId("format-progression-series");
    expect(series.props.horizontal).toBe(true);
    expect(within(series).queryByText("Squats sautés")).toBeNull();
    expect(within(series).getByTestId("format-progression-0-0-reps")).toBeTruthy();
  });

  it("recette n° 3 (f3-tabata) : Tabata À la suite à deux mouvements — durée exacte « 8 min 50 s », sans arrondi", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    expect(screen.getByTestId("format-total")).toHaveTextContent("8 min 50 s");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("8 min 50 s");
    expect(screen.getByTestId("format-recoveryBetweenSeconds-badge")).toHaveTextContent("1 min");
  });

  it("recette n° 3 (f3-emom) : EMOM dans chaque intervalle — un cadre par intervalle avec les deux mouvements", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    const groups = screen.getAllByTestId(/^format-timeline-group-/);
    expect(groups).toHaveLength(6);
    expect(groups[0]!.props.children).toHaveLength(2);
  });

  it("recette n° 3 (f3-questionnaire) : le dernier mouvement se supprime, l'enregistrement devient indisponible", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    toSummary();
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent(screen.getByTestId("format-movement-0-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByTestId("format-movement-card-0")).toBeNull();
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("recette n° 3 (f3-questionnaire) : un deuxième format de la même séance ouvre un questionnaire vierge ; aucune identité d'Exercice partagée", async () => {
    mockModel = "TABATA";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    toSummary();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    fireEvent.press(screen.getByTestId("harness-reopen"));
    await waitFor(() => expect(screen.queryByTestId("format-movement-card-0")).toBeNull());
    expect(screen.getByTestId("format-seriesCount-badge")).toHaveTextContent("8");
    await pick("Squ", "mv-squats");
    toSummary();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const ids = draftRef.current.exercises.map((exercise) => exercise.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("MAJ 04/11 §3 : mode catalogue dans la modale — recherche conservée, effacement, Filtrer / Trier / Replier, sélection, Ajouter ; Fermer revient sans ajout", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-search"), "Squ");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.closeCatalogue);
    expect(screen.getByTestId("format-catalogue-search").props.value).toBe("Squ");
    expect(screen.getByTestId("format-catalogue-filter")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-sort")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-piles")).toBeTruthy();
    expect(screen.queryByTestId("format-parameters")).toBeNull();
    // Effacement : tous les mouvements.
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "");
    expect(await screen.findByTestId("format-catalogue-card-mv-fentes")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-add").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("format-catalogue-card-mv-fentes"));
    fireEvent.press(screen.getByTestId("format-catalogue-card-mv-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    // Ordre de présentation du Catalogue, mode refermé, paramètres de retour.
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-movement-card-1")).toBeTruthy();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
    // Fermer le mode catalogue : aucun ajout.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.press(screen.getByTestId("format-catalogue-card-mv-fentes"));
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.queryByTestId("format-movement-card-2")).toBeNull();
  });
});
