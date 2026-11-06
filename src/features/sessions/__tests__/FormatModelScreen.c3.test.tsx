import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
const mockDismiss = jest.fn();
let mockModel = "TABATA";
let mockCircuitId: string | null = null;
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
// Pile racine (règle du 06/11/2026 : feuilles de création au-dessus de l'écran appelant) : Catalogue, groupe de création
// (Composition d'une Séance du Catalogue), questionnaire, récapitulatif.
const mockStack = {
  index: 3,
  routes: [
    { name: "(tabs)" },
    { name: "(creation)", params: { screen: "composition", params: { sessionId: "ses-1" } } },
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
    // [Complément du 5 novembre 2026 (§18–§19) : bouton « Enregistrer dans la séance » remplacé par la coche de l’en-tête.]
    expect(within(screen.getByTestId("screen-header")).getByTestId("format-save").props.accessibilityLabel).toBe("Enregistrer dans la séance");
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(shown("seriesCount")).toBe("8");
    expect(shown("workSeconds")).toBe("20 s");
    expect(shown("pauseSeconds")).toBe("10 s");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4 min");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    // Règle du 06/11/2026 (ordre des écrans) : la croix revient à l'écran qui a ouvert le questionnaire.
    fireEvent.press(screen.getByTestId("screen-header-back"));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it("« + Ajouter » ouvre directement le mode catalogue (§19) ; Progression : le choix reste sur le questionnaire, « Valider les paramètres » ouvre le récapitulatif sur place, Retour y revient avec les réponses (MAJ 04/11)", async () => {
    // Recette du 04/11/2026 : les modèles sans tableau s'enregistrent depuis leur questionnaire ; la Progression garde le récapitulatif.
    mockModel = "PROGRESSION";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await screen.findByTestId("format-title");
    // Réglage modifié avant d'ajouter un mouvement : 1 série.
    typeValue("seriesCount", "1");
    // Complément du 5 novembre 2026 (Hermann), §19 : « + Ajouter » ouvre directement le mode catalogue (champ actif, clavier ouvert) ; [saisie intermédiaire avec suggestions et lien « Ouvrir / Fermer le mode catalogue » — remplacés].
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.queryByTestId("format-search")).toBeNull();
    // Demande de Hermann du 05/11/2026 (soir) : « on ne met pas le focus dans la barre de recherche par défaut ».
    expect(screen.getByTestId("format-catalogue-search").props.autoFocus).toBe(false);
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Squ");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
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
    // Recette n° 3 du 03/11 : on dépile jusqu'à la Composition (paramètre `sessionId` conservé), sans `dismissTo` ; règle du
    // 06/11/2026 : les deux feuilles au-dessus du groupe de création se retirent.
    await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith(2));
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Réponse de Hermann du 04/11/2026 : « Tous les modèles sans tableau » s'enregistrent depuis leur questionnaire. Décision du
  // 05/11/2026 (« Récap si tableau ») : le Superset a désormais un tableau, donc un récapitulatif ; les quatre autres, avec un
  // seul mouvement (ou aucun).
  it.each(["TABATA", "INTERVALS_30_30", "STRENGTH", "UNTIL_FAILURE"] as const)("recette du 04/11 : %s (sans tableau) — « Enregistrer dans la séance » dès le questionnaire, sans récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(screen.getByTestId("format-save").props.accessibilityLabel).toBe(t.save); // Complément du 5 novembre 2026 (§18–§19) : coche de l’en-tête, libellé d’accessibilité.
  });

  it.each(["AMRAP", "FOR_TIME", "PROGRESSION", "EMOM", "DEATH_BY"] as const)("recette n° 3 du 03/11, MAJ 04/11 : %s — les choix restent sur le questionnaire ; « Valider les paramètres » ouvre le récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
    // Réponse de Hermann du 06/11/2026 (Q1) : valeurs à saisir au récapitulatif — la coche du questionnaire reste grise.
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    await pick("Squ", "mv-squats");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
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
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
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

  // Complément du 5 novembre 2026 (Hermann), §19 : « + Ajouter » ouvre directement le mode catalogue (champ actif, clavier ouvert) ; [saisie intermédiaire avec suggestions et lien « Ouvrir / Fermer le mode catalogue » — remplacés].
  async function pick(query: string, id: string, section = "format-movements") {
    fireEvent.press(screen.getByTestId(`${section}-link`));
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), query);
    fireEvent.press(await screen.findByTestId(`format-catalogue-card-${id}`));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
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
    // Recette du 06/11/2026 (n-emom, réponse A de Hermann : « Oui retirée partout ») : aucune recopie du premier tour.
    // [Chaque tour prérempli avec la valeur du premier — remplacé.]
    const first = screen.getByTestId("format-superset-0-0-reps");
    fireEvent(first, "focus");
    fireEvent.changeText(first, "12");
    expect(screen.getByTestId("format-superset-0-2-reps").props.value).toBe("");
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
    expect(screen.getByTestId("format-progression-0-charge")).toHaveTextContent(t.table.addLoadShort); // Recette du 05/11 (n-charge-switch) : « (rép, +kg) » sous le nom.
    expect(screen.getByTestId("format-progression-0-unit")).toHaveTextContent("(rép, +kg)");
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

  // [Recette du 05/11 (constat c, g-recherche-vide) sur le cadre des suggestions — étape retirée (§19) ; « Aucun résultat » reste
  // affiché en mode catalogue (k-aucun-resultat).]
  it("recette du 05/11 (k-aucun-resultat) : un texte sans résultat affiche « Aucun résultat » en mode catalogue", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "zzzz");
    expect(screen.getByTestId("format-catalogue-empty")).toHaveTextContent(t.noSearchResult);
    expect(screen.queryByTestId("format-catalogue-card-mv-squats")).toBeNull();
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
    // Récapitulatif : « Changer » efface d'abord le buy-in (contre-recette n° 3 ter), puis ouvre directement le mode catalogue
    // dans la modale (§19) ; on le choisit à nouveau, la coche ramène au récapitulatif.
    toSummary();
    fireEvent.press(screen.getByTestId("format-buy-in-link"));
    expect(screen.getByTestId("format-catalogue-search")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Squ");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(screen.getByTestId("format-summary")).toBeTruthy();
    for (const index of [0, 1, 2]) fireEvent.changeText(screen.getByTestId(`format-amrap-reps-${index}`), "10");
    expect(screen.getByTestId("format-loop-link")).toHaveTextContent(t.add);
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

  // [Recette n° 3 bis du 03/11 (f3s-recherche) : champ de saisie intermédiaire — retiré (§19).]
  it("complément du 05/11 (§19) : « + Ajouter » ouvre le mode catalogue — recherche sans focus (Hermann, 05/11 soir), filtres, tri et piles à côté ; plus de lien Ouvrir / Fermer", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.queryByTestId("format-search")).toBeNull();
    // Demande de Hermann du 05/11/2026 (soir) : « on ne met pas le focus dans la barre de recherche par défaut ».
    expect(screen.getByTestId("format-catalogue-search").props.autoFocus).toBe(false);
    expect(await screen.findByTestId("format-catalogue-filter")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-sort")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-piles")).toBeTruthy();
    // p-ajout / p-coche (05/11 au soir) : « + Ajouter » devient « Revenir aux paramètres ».
    expect(screen.getByTestId("format-movements-link").props.accessibilityLabel).toBe("Revenir aux paramètres");
    expect(screen.queryByText("Ouvrir le mode catalogue")).toBeNull();
    expect(screen.queryByText("Fermer le mode catalogue")).toBeNull();
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

  it("MAJ 04/11 §3 ; recette du 05/11 au soir (p-coche, p-ajout) : mode catalogue — recherche, effacement, Filtrer / Trier / Replier, sélection, « Ajouter X mouvements » en bas ; « Revenir aux paramètres » sans ajout ; la croix quitte le Format", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Squ");
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("format-catalogue-search").props.value).toBe("Squ");
    // Recette du 04/11/2026 (e-cat-recherche) : le champ se rétrécit, puis les trois commandes apparaissent.
    expect(await screen.findByTestId("format-catalogue-filter")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-sort")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-piles")).toBeTruthy();
    expect(screen.queryByTestId("format-parameters")).toBeNull();
    // Effacement : tous les mouvements.
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "");
    expect(await screen.findByTestId("format-catalogue-card-mv-fentes")).toBeTruthy();
    // Recette du 06/11/2026 (s-focus) : sans sélection, « Fermer sans sélectionner », actif. [« Ajouter » grisé — remplacé.]
    expect(screen.getByTestId("format-catalogue-add").props.accessibilityState?.disabled ?? false).toBe(false);
    expect(within(screen.getByTestId("format-bottom-action")).getByText("Fermer sans sélectionner")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-catalogue-card-mv-fentes"));
    expect(screen.getByText("Ajouter 1 mouvement")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-catalogue-card-mv-squats"));
    expect(screen.getByText("Ajouter 2 mouvements")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    // Ordre de présentation du Catalogue, mode refermé, paramètres de retour.
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-movement-card-1")).toBeTruthy();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
    // « Revenir aux paramètres » referme le mode catalogue : aucun ajout, retour au questionnaire.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-fentes"));
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(screen.queryByTestId("format-movement-card-2")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
    expect(mockDismiss).not.toHaveBeenCalled();
    // « Fermer sans sélectionner » (s-focus, 06/11/2026) : même effet, sans ajout.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    await screen.findByTestId("format-catalogue-card-mv-fentes");
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(screen.queryByTestId("format-movement-card-2")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
    // « La croix annule la création du format » (p-ajout), mode catalogue ouvert ou non.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.closeAccessibilityLabel);
    await act(async () => {
      fireEvent.press(screen.getByTestId("screen-header-back"));
    });
    expect(mockDismiss.mock.calls.length + mockDismissTo.mock.calls.length + mockBack.mock.calls.length).toBeGreaterThan(0);
  });

  it("recette du 05/11 au soir (s-fond) : chaque recherche ou filtre ramène la liste à son début, sous la zone de recherche", async () => {
    const scrollTo = jest.fn();
    jest.spyOn(ScrollView.prototype as unknown as { scrollTo: (options: { y: number; animated: boolean }) => void }, "scrollTo").mockImplementation(scrollTo);
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    scrollTo.mockClear();
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "po");
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
    jest.restoreAllMocks();
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
    // Recette du 06/11/2026 (n-emom) : S1 ne se recopie plus ; S2…S6 restent à renseigner, l'enregistrement reste indisponible.
    expect(screen.getByTestId("format-emom-0-1-reps").props.value).toBe("");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    for (let column = 1; column < 6; column += 1) {
      const next = screen.getByTestId(`format-emom-0-${column}-reps`);
      fireEvent(next, "focus");
      fireEvent.changeText(next, "12");
    }
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

  it("recette du 06/11 (n-deathby) : Death by à deux mouvements — « Récupération entre les mouvements » avant « Condition d'arrêt »", async () => {
    mockModel = "DEATH_BY";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    const order = screen.UNSAFE_root.findAll((node) => typeof node.props.testID === "string" && /^format-row-/.test(node.props.testID) && typeof node.type !== "string")
      .map((node) => node.props.testID as string)
      .filter((id, at, all) => all.indexOf(id) === at);
    expect(order.indexOf("format-row-recoveryBetweenSeconds")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("format-row-recoveryBetweenSeconds")).toBeLessThan(order.indexOf("format-row-stop"));
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
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Squ");
    // Demande de Hermann du 05/11/2026 (soir) : « La zone colorée ne doit pas changer de dimension » — recherche figée sous elle.
    expect(within(band).queryByTestId("format-catalogue-search")).toBeNull();
    expect(within(screen.getByTestId("format-search-zone")).getByTestId("format-catalogue-search")).toBeTruthy();
    expect(within(screen.getByTestId("format-search-zone")).getByTestId("format-movements-link").props.accessibilityLabel).toBe("Revenir aux paramètres");
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
    expect(screen.getByTestId("format-save").props.accessibilityLabel).toBe("Enregistrer les modifications"); // Complément du 5 novembre 2026 (§18–§19) : coche de l’en-tête, libellé d’accessibilité.
    expect(screen.getByTestId("format-movement-card-1")).toBeTruthy();
    // Retour : questionnaire du modèle, réponses reconstruites. Décision du 05/11/2026 (« Récap si tableau ») : à deux mouvements,
    // le Tabata repasse par son récapitulatif (tableau par mouvement), qui reprend la Pause commune modifiée.
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    typeValue("pauseSeconds", "15");
    toSummary();
    expect(screen.getByTestId("format-pause-0").props.value).toBe("15 s");
    expect(screen.getByTestId("format-save").props.accessibilityLabel).toBe("Enregistrer les modifications"); // Complément du 5 novembre 2026 (§18–§19) : coche de l’en-tête, libellé d’accessibilité.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [updated] = structureCircuits(draftRef.current.structure!);
    expect(updated!.id).toBe(circuit!.id);
    expect(updated!.exercises).toEqual(ids);
    expect(draftRef.current.exercises.every((exercise) => exercise.executionParameters.series.kind === "UNIFORM" && exercise.executionParameters.series.pauseSeconds === 15)).toBe(true);
  });

  // Complément du 5 novembre 2026 (Hermann), §18–§19, puis recette du 05/11 au soir (p-coche, p-coche-recap) et réponses du 06/11
  // (Q1, Q4) : la coche de l'en-tête enregistre dans la séance, grise tant que paramètres et valeurs ne sont pas tous renseignés ;
  // « Valider les paramètres » reste en bas du questionnaire quand les valeurs se saisissent au récapitulatif.
  describe("coche de l'en-tête (§18–§19, recette du 05/11 au soir)", () => {
    const inHeader = (testID: string) => within(screen.getByTestId("screen-header")).getByTestId(testID);
    const isBlue = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor === colors.wheelActionValidateBackground;

    it("questionnaire à récapitulatif : « Valider les paramètres » en bas (gris sans mouvement, actif ensuite), coche toujours grise ; récapitulatif sans bouton en bas", async () => {
      mockModel = "PROGRESSION";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      expect(within(screen.getByTestId("format-bottom-action")).getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
      expect(screen.getByText(t.validate)).toBeTruthy();
      expect(isBlue("format-save")).toBe(false);
      await pick("Squ", "mv-squats");
      expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
      expect(isBlue("format-save")).toBe(false);
      expect(inHeader("format-save").props.accessibilityState).toMatchObject({ disabled: true });
      toSummary();
      expect(screen.getByTestId("format-summary")).toBeTruthy();
      // Récapitulatif : chevron Retour, coche, pas de bouton en bas (p-coche-recap, Q4).
      expect(screen.queryByTestId("format-bottom-action")).toBeNull();
      expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.backAccessibilityLabel);
    });

    it("questionnaire sans récapitulatif (Tabata à un mouvement) : pas de bouton en bas ; coche grise sans mouvement, bleue ensuite", async () => {
      mockModel = "TABATA";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      expect(screen.queryByTestId("format-bottom-action")).toBeNull();
      expect(isBlue("format-save")).toBe(false);
      await pick("Squ", "mv-squats");
      expect(screen.queryByTestId("format-bottom-action")).toBeNull();
      expect(isBlue("format-save")).toBe(true);
    });

    it("Superset (toujours un récapitulatif) : « Valider les paramètres » actif avec deux mouvements, coche grise au questionnaire", async () => {
      mockModel = "SUPERSET";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      await pick("Squ", "mv-squats");
      expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
      await pick("Fen", "mv-fentes");
      expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
      expect(isBlue("format-save")).toBe(false);
    });

    it("récapitulatif : la coche remplace « Enregistrer dans la séance » ; grise si une cellule requise est vide", async () => {
      mockModel = "AMRAP";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await screen.findByTestId("format-title");
      await pick("Squ", "mv-squats");
      toSummary();
      expect(screen.queryByText(t.save)).toBeNull();
      expect(inHeader("format-save").props.accessibilityLabel).toBe(t.save);
      fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "");
      expect(isBlue("format-save")).toBe(false);
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "10");
      expect(isBlue("format-save")).toBe(true);
    });

    it("EMOM : récapitulatif incomplet ou incohérent (contrôle des fenêtres, même condition) — coche grise", async () => {
      mockModel = "EMOM";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      await pick("Squ", "mv-squats");
      toSummary();
      expect(isBlue("format-save")).toBe(false);
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    });
  });


  // Complément du 5 novembre 2026 (Hermann), §19 : espacements du gabarit commun aux dix Formats.
  it("complément du 05/11 (§19) : « Mouvements » descendue de 8 ; cartes espacées de 6 ; « Paramètres d’exécution » à 16 de la dernière carte", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await screen.findByTestId("format-title");
    const content = () => StyleSheet.flatten(screen.getByTestId("format-questionnaire").props.contentContainerStyle) as { paddingTop: number };
    const withOffset = content().paddingTop;
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    const slots = [0, 1].map((index) => {
      let node = screen.getByTestId(`format-movement-card-${index}`).parent;
      while (node !== null && StyleSheet.flatten(node.props.style ?? {})?.marginBottom === undefined) node = node.parent;
      return StyleSheet.flatten(node!.props.style) as { marginBottom: number };
    });
    expect(slots.map((style) => style.marginBottom)).toEqual([6, 6]);
    expect(StyleSheet.flatten(screen.getByTestId("format-parameters-title").props.style)).toMatchObject({ marginTop: 16 });
    // Demande de Hermann du 05/11/2026 (soir) : zone colorée remontée de 8 (101), ligne « Mouvements » à sa place absolue (101 + 16).
    expect(withOffset).toBe(101 + 16);
    // Mode catalogue : la recherche figée se place à l'emplacement de la ligne « Mouvements ».
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(StyleSheet.flatten(screen.getByTestId("format-search-zone").props.style)).toMatchObject({ top: 101 + 16 });
    // Recette du 06/11/2026 (t-recherche) : blanc opaque depuis le bas de la zone de contexte (101) jusqu'au bas de la recherche.
    const background = StyleSheet.flatten(screen.getByTestId("format-search-zone-background").props.style);
    expect(background).toMatchObject({ top: -16, bottom: 0, backgroundColor: "#FFFFFF" });
    expect(background.opacity).toBeUndefined();
  });


  // Recette du 05/11/2026 (n-cat-format, Hermann : « Questionnaire : Croix > Retour à la modale "Créer un exercice" »).
  it("recette du 05/11 (n-cat-format) : ouvert depuis la modale de création, la croix du questionnaire y revient", async () => {
    const saved = mockStack.routes;
    mockStack.routes = [
      { name: "(tabs)" },
      { name: "formats-window" },
      { name: "format-questionnaire", params: { model: "TABATA" } },
    ] as typeof mockStack.routes;
    try {
      mockModel = "TABATA";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await screen.findByTestId("format-title");
      fireEvent.press(screen.getByTestId("screen-header-back"));
      await waitFor(() => expect(mockBack).toHaveBeenCalled());
      expect(mockDismiss).not.toHaveBeenCalled();
      expect(mockDismissTo).not.toHaveBeenCalled();
    } finally {
      mockStack.routes = saved;
    }
  });

});
