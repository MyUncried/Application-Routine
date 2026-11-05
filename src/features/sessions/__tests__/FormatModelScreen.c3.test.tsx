import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";

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
let mockCircuitId: string | null = null;
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
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
    useLocalSearchParams: () => ({ model: mockModel, ...(mockCircuitId !== null ? { circuitId: mockCircuitId } : {}) }),
    useFocusEffect: () => undefined,
  };
});

/**
 * PRE-9 C.3 / C.4 (référence Formats du 02/11/2026 §7 ; CE-FMT-02) — questionnaire (croix), saisie d'un
 * mouvement, récapitulatif (Retour, réponses conservées), « Enregistrer dans la séance » qui ajoute au
 * brouillon de Composition sans sauvegarde définitive. Mise à jour consolidée du 04/11/2026 : modale sur la
 * Composition, sans nom de Séance ; « Valider les paramètres » ouvre le récapitulatif de tous les modèles.
 */

/** Valeur d'une ligne de paramètres (saisie au clavier, Hermann, 05/11/2026). */
function shown(id: string): string {
  return screen.getByTestId(`format-${id}`).props.value as string;
}

/** Saisie au clavier d'une ligne de paramètres : focus, chiffres tapés, sortie de la case. */
function typeValue(id: string, digits: string) {
  const input = screen.getByTestId(`format-${id}`);
  fireEvent(input, "focus");
  fireEvent.changeText(screen.getByTestId(`format-${id}`), `${screen.getByTestId(`format-${id}`).props.value as string}${digits}`);
  fireEvent(screen.getByTestId(`format-${id}`), "blur");
}

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
    { movement: SQUATS, level: { rank: 3, total: 3 } },
    { movement: FENTES, level: null },
  ],
} as never;

const t = strings.screens.formatModel;

function Harness({ draftRef, initialStage = "questionnaire" }: { draftRef: { current: SessionDraft }; initialStage?: "questionnaire" | "summary" }) {
  const [stage, setStage] = useState<"questionnaire" | "summary">(initialStage);
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
    mockCircuitId = null;
    mockPush.mockReset();
    mockBack.mockReset();
    mockDismissTo.mockReset();
    mockDismiss.mockReset();
  });

  it("questionnaire Tabata en modale : croix, nom du Format, aucun nom de Séance ; paramètres 8 / 20 s / 10 s, durée 4 min ; « Enregistrer dans la séance » (recette du 04/11) indisponible sans mouvement", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    expect(await screen.findByTestId("format-title")).toHaveTextContent("Tabata");
    expect(screen.getByTestId("format-sheet")).toBeTruthy();
    expect(screen.queryByTestId("format-name")).toBeNull();
    // Recette du 04/11/2026 (Hermann : « Tabata : après sélection des mouvements, le bouton d'action doit directement être
    // "Enregistrer dans la séance" ») : pas de récapitulatif. [MAJ 04/11 §2 « Valider les paramètres » — remplacé pour le Tabata.]
    expect(screen.getByTestId("format-save")).toHaveTextContent("Enregistrer dans la séance");
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(shown("seriesCount")).toBe("8");
    expect(shown("workSeconds")).toBe("20 s");
    expect(shown("pauseSeconds")).toBe("10 s");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    // Essai feuille native : la croix ramène à la Composition (fenêtre Formats empilée dessous comprise).
    fireEvent.press(screen.getByTestId("screen-header-back"));
    await waitFor(() => expect(mockDismiss.mock.calls.length + mockDismissTo.mock.calls.length).toBeGreaterThan(0));
  });

  it("« + Ajouter » ouvre le champ et devient « Ouvrir le mode catalogue » ; la saisie propose les Mouvements ; Progression : le choix reste sur le questionnaire, « Valider les paramètres » ouvre le récapitulatif sur place, Retour y revient avec les réponses (MAJ 04/11)", async () => {
    // Recette du 04/11/2026 : les modèles sans tableau s'enregistrent depuis leur questionnaire ; la Progression garde le récapitulatif.
    mockModel = "PROGRESSION";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    // Réglage modifié avant d'ajouter un mouvement : 1 série.
    typeValue("seriesCount", "1");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.getByText(t.openCatalogue)).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("format-search"), "Squ");
    const suggestion = await screen.findByTestId("format-suggestion-mv-squats");
    await act(async () => {
      fireEvent.press(suggestion);
    });
    // MAJ 04/11 §2 bis : le récapitulatif s'ouvre sur place, sans navigation ; Retour revient au questionnaire.
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(shown("seriesCount")).toBe("1");
    toSummary();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-summary")).toBeTruthy();
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    expect(shown("seriesCount")).toBe("1");
    toSummary();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    // Ajout au brouillon : un Exercice standard ; nom du modèle suggéré ; retour à la Composition.
    expect(draftRef.current.exercises).toHaveLength(1);
    expect(draftRef.current.exercises[0]!).not.toHaveProperty("format");
    expect(draftRef.current.name).toBe(strings.screens.sessionModels.cards.PROGRESSION.title);
    // Recette n° 3 du 03/11 : on dépile jusqu'à la Composition (paramètre `sessionId` conservé), sans `dismissTo`.
    await waitFor(() => expect(mockDismiss).toHaveBeenCalled());
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  // Réponse de Hermann du 04/11/2026 : « Tous les modèles sans tableau » s'enregistrent depuis leur questionnaire. Décision du
  // 05/11/2026 (« Récap si tableau ») : le Superset a désormais un tableau, donc un récapitulatif ; les quatre autres, avec un
  // seul mouvement (ou aucun).
  it.each(["TABATA", "INTERVALS_30_30", "STRENGTH", "UNTIL_FAILURE"] as const)("recette du 04/11 : %s (sans tableau) — « Enregistrer dans la séance » dès le questionnaire, sans récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(screen.getByTestId("format-save")).toHaveTextContent(t.save);
  });

  it.each(["AMRAP", "FOR_TIME", "PROGRESSION", "EMOM", "DEATH_BY"] as const)("recette n° 3 du 03/11, MAJ 04/11 : %s — les choix restent sur le questionnaire ; « Valider les paramètres » ouvre le récapitulatif", async (model) => {
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

  // [Recette du 05/11 (x-sans-recap) : troisième exercice refusé avec un message — complément du 5 novembre 2026 (§11) :
  // « + Ajouter » se désactive dès que deux mouvements sont choisis ; « Valider les paramètres » ne s'active qu'avec deux.]
  it("complément du 05/11 : Superset — « Récupération après le tour », 3 tours ; « + Ajouter » désactivé à deux ; récapitulatif par tour", async () => {
    mockModel = "SUPERSET";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-row-recoveryBetweenSeconds")).toHaveTextContent(t.rows.recoveryAfterPair, { exact: false });
    expect(t.rows.recoveryAfterPair).toBe("Récupération après le tour");
    expect(shown("roundCount")).toBe("3 tours");
    expect(screen.queryByTestId("format-row-repetitions")).toBeNull();
    await pick("Squ", "mv-squats");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-movements-link").props.accessibilityState).toMatchObject({ disabled: true });
    toSummary();
    expect(screen.getByTestId("format-superset-table")).toBeTruthy();
    // Chaque tour prérempli avec la valeur du premier.
    const first = screen.getByTestId("format-superset-0-0-reps");
    fireEvent(first, "focus");
    fireEvent.changeText(first, "12");
    expect(screen.getByTestId("format-superset-0-2-reps").props.value).toBe("12");
  });

  it("complément du 05/11 (§9, §16) : « Avec charge » dans tous les questionnaires ; (+ kg) par mouvement ; (− kg) puis (+ kg) retrouve la valeur ; interrupteur coupé puis rétabli aussi", async () => {
    for (const model of ["TABATA", "INTERVALS_30_30", "SUPERSET", "STRENGTH", "UNTIL_FAILURE", "DEATH_BY", "AMRAP", "EMOM", "FOR_TIME", "PROGRESSION"]) {
      mockModel = model;
      const view = render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      expect(screen.getByTestId("format-withLoad").props.value).toBe(false);
      view.unmount();
    }
    mockModel = "PROGRESSION";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent(screen.getByTestId("format-withLoad"), "valueChange", true);
    await pick("Squ", "mv-squats");
    toSummary();
    // Activation globale : aucune ligne de charge tant que « (+ kg) » n'est pas touché.
    expect(screen.queryByTestId("format-progression-0-0-load")).toBeNull();
    expect(screen.getByTestId("format-progression-0-charge")).toHaveTextContent(t.table.addLoad);
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-progression-0-charge"));
    });
    const load = screen.getByTestId("format-progression-0-0-load");
    fireEvent(load, "focus");
    fireEvent.changeText(screen.getByTestId("format-progression-0-0-load"), "12");
    fireEvent(screen.getByTestId("format-progression-0-0-load"), "blur");
    expect(screen.getByTestId("format-progression-0-0-load").props.value).toBe("(12 kg)");
    // « (− kg) » : ligne retirée, valeur gardée dans le brouillon ; « (+ kg) » la retrouve.
    fireEvent.press(screen.getByTestId("format-progression-0-charge"));
    expect(screen.queryByTestId("format-progression-0-0-load")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-progression-0-charge"));
    });
    expect(screen.getByTestId("format-progression-0-0-load").props.value).toBe("(12 kg)");
  });

  it("Hermann, 05/11 : valeurs au clavier, plus de stepper — bornes à la saisie, Temps limite vidé = « Sans limite »", async () => {
    mockModel = "FOR_TIME";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.queryByTestId("format-roundCount-increase")).toBeNull();
    expect(screen.getByTestId("format-roundCount").props.keyboardType).toBe("number-pad");
    typeValue("roundCount", "5");
    expect(shown("roundCount")).toBe("5");
    // Durée « MM:SS » remplie par la droite : 1, 2, 0, 0 → 12:00.
    typeValue("timeCapSeconds", "1200");
    expect(shown("timeCapSeconds")).toBe("12 min");
    const cap = screen.getByTestId("format-timeCapSeconds");
    fireEvent(cap, "focus");
    fireEvent.changeText(screen.getByTestId("format-timeCapSeconds"), "");
    fireEvent(screen.getByTestId("format-timeCapSeconds"), "blur");
    expect(screen.getByTestId("format-timeCapSeconds").props.placeholder).toBe(t.noLimit);
    // Recette du 05/11 (k-clavier-vide) : « Sans limite » affiché comme une valeur, la pastille prend sa largeur.
    expect(shown("timeCapSeconds")).toBe(t.noLimit);
  });

  it("recette du 05/11 (constat c) : un texte sans résultat garde le cadre des résultats, vide", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-search"), "zzzz");
    // Recette du 05/11 (g-recherche-vide) : « Afficher "aucun résultat" dans le cadre de la zone de recherche ».
    expect(screen.getByTestId("format-suggestions-empty")).toHaveTextContent(t.noSearchResult);
    expect(screen.queryByTestId("format-suggestion-mv-squats")).toBeNull();
  });

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
    expect(shown("pauseSeconds")).toBe("0 s");
    typeValue("pauseSeconds", "5");
    expect(shown("pauseSeconds")).toBe("5 s");
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
    // Complément du 5 novembre 2026 (§12) : nombre de séries, tableau dans son propre cadre, puis Pause, durée totale, Exécution.
    expect(rowsOf()).toEqual(["format-row-seriesCount"]);
    expect(within(screen.getByTestId("format-parameters-after")).getAllByTestId(/^format-row-/).map((row) => row.props.testID)).toEqual([
      "format-row-pauseSeconds",
      "format-row-total",
      "format-row-execution",
    ]);
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
    expect(screen.getByTestId("format-total")).toHaveTextContent("8 min 50 s");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("8 min 50 s");
    expect(shown("recoveryBetweenSeconds")).toBe("1 min");
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
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    fireEvent.press(screen.getByTestId("harness-reopen"));
    await waitFor(() => expect(screen.queryByTestId("format-movement-card-0")).toBeNull());
    expect(shown("seriesCount")).toBe("8");
    await pick("Squ", "mv-squats");
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
    // Recette du 04/11/2026 (e-cat-recherche) : le champ se rétrécit, puis les trois commandes apparaissent.
    expect(await screen.findByTestId("format-catalogue-filter")).toBeTruthy();
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

  // ---------------------------------------------------------------------------
  // Recette iPhone du 04/11/2026 (cahier « Recette Formats 04/11 », écarts un par ligne)
  // ---------------------------------------------------------------------------

  it("recette du 04/11 (e-fortime-buyin) : For time — interrupteurs Buy-in et Buy-out ; sections ; buy-in et buy-out requis ; Rôles écrits", async () => {
    mockModel = "FOR_TIME";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", true);
    fireEvent(screen.getByTestId("format-buyOut"), "valueChange", true);
    expect(screen.getByText(t.buyInSection)).toBeTruthy();
    expect(screen.getByText(t.forTimeLoopSection)).toBeTruthy();
    expect(screen.getByText(t.buyOutSection)).toBeTruthy();
    await pick("Squ", "mv-squats", "format-loop");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    await pick("Fen", "mv-fentes", "format-buy-out");
    await pick("Squ", "mv-squats", "format-buy-in");
    expect(within(screen.getByTestId("format-buy-out-cards")).getByText("Fentes avant")).toBeTruthy();
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
    // Un mouvement ajouté à la boucle se place avant le buy-out.
    await pick("Fen", "mv-fentes", "format-loop");
    expect(within(screen.getByTestId("format-buy-out-cards")).getAllByText("Fentes avant")).toHaveLength(1);
    toSummary();
    // Buy-in et buy-out : une case (une seule exécution).
    fireEvent.changeText(screen.getByTestId("format-for-time-0-0"), "50");
    fireEvent.changeText(screen.getByTestId("format-for-time-3-0"), "20");
    expect(screen.queryByTestId("format-for-time-0-1")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    expect(draftRef.current.exercises.map((exercise) => [exercise.name, exercise.format?.settings.circuitRole ?? 0])).toEqual([
      ["Squats sautés", 1],
      ["Squats sautés", 0],
      ["Fentes avant", 0],
      ["Fentes avant", 2],
    ]);
  });

  it("recette du 04/11 (e-emom-mode, e-emom-trait) : EMOM — aucune unité par défaut, objectif vide en rouge (trait), enregistrement indisponible", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    toSummary();
    // Complément du 5 novembre 2026 (§14) : tableau par série (S1…S6).
    const cell = screen.getByTestId("format-emom-0-0-reps");
    expect(cell.props.value).toBe("");
    expect(cell.props.placeholder).toBe(t.dash);
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent(cell, "focus");
    fireEvent.changeText(cell, "12");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("recette du 04/11 (e-amrap-trait) : AMRAP — objectif vide affiché par un trait", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    toSummary();
    fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "");
    expect(screen.getByTestId("format-amrap-reps-0").props.placeholder).toBe(t.dash);
  });

  it("recette du 04/11 (e-deathby) : Death by — le tableau Départ | Incrément apparaît au questionnaire dès le deuxième mouvement", async () => {
    mockModel = "DEATH_BY";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    expect(screen.queryByTestId("format-death-by-table")).toBeNull();
    expect(screen.getByTestId("format-row-startRepetitions")).toBeTruthy();
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    expect(screen.getByTestId("format-death-by-table")).toBeTruthy();
    expect(screen.queryByTestId("format-row-startRepetitions")).toBeNull();
    // Hermann, 04/11/2026 : « death by, il manque les unités au tableau des objectifs ».
    expect(screen.getByTestId("format-death-by-start-0").props.value).toBe(`1 ${t.repetitionsUnit}`);
    expect(screen.getByTestId("format-death-by-increment-0").props.value).toBe(`+ 1 ${t.repetitionsUnit}`);
    // Retour à un mouvement : le tableau disparaît.
    fireEvent(screen.getByTestId("format-movement-1-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByTestId("format-death-by-table")).toBeNull();
  });

  it("recette du 04/11 (e-contexte-fixe, e-cat-fixe, e-cat-recherche) : zone de contexte figée ; en mode catalogue elle porte l'en-tête et la recherche (même champ, croix intérieure)", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    const band = screen.getByTestId("format-context-band");
    expect(within(band).getByTestId("format-title")).toBeTruthy();
    expect(within(band).getByTestId("format-context-fade", { includeHiddenElements: true })).toBeTruthy();
    expect(within(screen.getByTestId("format-questionnaire")).queryByTestId("format-title")).toBeNull();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-search"), "Squ");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(within(band).getByTestId("format-catalogue-search")).toBeTruthy();
    expect(within(band).getByTestId("format-movements-link")).toHaveTextContent(t.closeCatalogue);
    expect(within(screen.getByTestId("format-questionnaire")).getByTestId("format-catalogue-results")).toBeTruthy();
    // Défilement conservé avec un texte saisi (e-cat-defiler).
    expect(screen.getByTestId("format-questionnaire").props.scrollEnabled).toBe(true);
    fireEvent.press(screen.getByTestId("format-catalogue-search-clear"));
    expect(screen.getByTestId("format-catalogue-search").props.value).toBe("");
    expect(screen.queryByTestId("format-catalogue-search-clear")).toBeNull();
  });

  it("MAJ 04/11 §6 sexies : Modifier le format — récapitulatif prérempli, « Enregistrer les modifications », Retour au questionnaire ; mise à jour en place", async () => {
    mockModel = "TABATA";
    // Séance avec un Circuit Tabata en alternance (créé par le parcours).
    const first = { current: createEmptyDraft() };
    const view = render(<Harness draftRef={first} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    // Décision de Hermann du 05/11/2026 (« Récap si tableau ») : Tabata à deux mouvements → récapitulatif (tableau par mouvement).
    toSummary();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    view.unmount();
    const [circuit] = structureCircuits(first.current.structure!);
    const ids = circuit!.exercises;
    mockCircuitId = circuit!.id;
    const draftRef = { current: first.current };
    render(<Harness draftRef={draftRef} initialStage="summary" />);
    expect(await screen.findByTestId("format-summary")).toBeTruthy();
    expect(screen.getByTestId("format-save")).toHaveTextContent("Enregistrer les modifications");
    expect(screen.getByTestId("format-movement-card-1")).toBeTruthy();
    // Retour : questionnaire du modèle, réponses reconstruites. Décision du 05/11/2026 (« Récap si tableau ») : à deux mouvements,
    // le Tabata repasse par son récapitulatif (tableau par mouvement), qui reprend la Pause commune modifiée.
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    typeValue("pauseSeconds", "15");
    toSummary();
    expect(screen.getByTestId("format-pause-0").props.value).toBe("15 s");
    expect(screen.getByTestId("format-save")).toHaveTextContent("Enregistrer les modifications");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [updated] = structureCircuits(draftRef.current.structure!);
    expect(updated!.id).toBe(circuit!.id);
    expect(updated!.exercises).toEqual(ids);
    expect(draftRef.current.exercises.every((exercise) => exercise.executionParameters.series.kind === "UNIFORM" && exercise.executionParameters.series.pauseSeconds === 15)).toBe(true);
  });
});
