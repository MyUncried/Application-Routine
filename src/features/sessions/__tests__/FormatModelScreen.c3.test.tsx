import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { structureCircuits } from "@/domain/sessions/structure";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { expectSwipeRevealRule } from "@/shared/gestures/testing/fireSwipeReveal";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { colors } from "@/shared/ui/tokens";
import { valueFieldColors } from "@/shared/ui/valueField";

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

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("questionnaire Tabata en modale : croix, nom du Format, aucun nom de Séance ; paramètres 8 / 20″ / 10″, durée 4′00″ ; « Enregistrer dans la séance » (recette du 04/11) indisponible sans mouvement", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    expect(await openedFormat()).toHaveTextContent("Tabata");
    expect(screen.getByTestId("format-sheet")).toBeTruthy();
    expect(screen.queryByTestId("format-name")).toBeNull();
    // Recette du 04/11/2026 (Hermann : « Tabata : après sélection des mouvements, le bouton d'action doit directement être
    // "Enregistrer dans la séance" ») : pas de récapitulatif. [MAJ 04/11 §2 « Valider les paramètres » — remplacé pour le Tabata.]
    // [Complément du 5 novembre 2026 (§18–§19) : bouton « Enregistrer dans la séance » remplacé par la coche de l’en-tête.]
    expect(within(screen.getByTestId("screen-header")).getByTestId("format-save").props.accessibilityLabel).toBe("Enregistrer dans la séance");
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(shown("seriesCount")).toBe("8");
    expect(shown("workSeconds")).toBe("20″");
    expect(shown("pauseSeconds")).toBe("10″");
    expect(screen.getByTestId("format-total")).toHaveTextContent("4′00″");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("4′00″");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    // Règle du 06/11/2026 (ordre des écrans) : la croix revient à l'écran qui a ouvert le questionnaire.
    fireEvent.press(screen.getByTestId("screen-header-back"));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("« + Ajouter » ouvre directement le mode catalogue (§19) ; Progression : le choix reste sur le questionnaire, « Valider les paramètres » ouvre le récapitulatif sur place, Retour y revient avec les réponses (MAJ 04/11)", async () => {
    // Recette du 04/11/2026 : les modèles sans tableau s'enregistrent depuis leur questionnaire ; la Progression garde le récapitulatif.
    mockModel = "PROGRESSION";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await openedFormat();
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
    await openedFormat();
    expect(screen.queryByTestId("format-validate")).toBeNull();
    expect(screen.getByTestId("format-save").props.accessibilityLabel).toBe(t.save); // Complément du 5 novembre 2026 (§18–§19) : coche de l’en-tête, libellé d’accessibilité.
  });

  // [For time compris — retiré le 15/11/2026 : le For time n'a plus de questionnaire (décision de Hermann, registre ch07, « For time —
  // tableau unique, sans questionnaire »).]
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // plus de questionnaire ni de « Valider les paramètres ». Test d’origine conservé, désactivé.]
  it.skip.each(["AMRAP", "PROGRESSION", "EMOM", "DEATH_BY"] as const)("recette n° 3 du 03/11, MAJ 04/11 : %s — les choix restent sur le questionnaire ; « Valider les paramètres » ouvre le récapitulatif", async (model) => {
    mockModel = model;
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("récapitulatif AMRAP à deux mouvements : tableau Mouvement | Rép. | Max ; Circuit porteur ajouté au brouillon", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await openedFormat();
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
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("complément du 05/11 : Superset — « Récupération après le tour », 3 tours ; « + Ajouter » désactivé à deux ; récapitulatif par tour", async () => {
    mockModel = "SUPERSET";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("complément du 05/11 (§9, §16) : « Avec charge » dans tous les questionnaires ; (+ kg) par mouvement ; (− kg) puis (+ kg) retrouve la valeur ; interrupteur coupé puis rétabli aussi", async () => {
    // [For time compris — retiré le 15/11/2026 : plus d'interrupteur « Avec charge » pour le For time, la charge se décide par
    // mouvement (décision de Hermann, « For time — tableau unique, sans questionnaire »).]
    for (const model of ["TABATA", "INTERVALS_30_30", "SUPERSET", "STRENGTH", "UNTIL_FAILURE", "DEATH_BY", "AMRAP", "EMOM", "PROGRESSION"]) {
      mockModel = model;
      const view = render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      expect(screen.getByTestId("format-withLoad").props.value).toBe(false);
      view.unmount();
    }
    mockModel = "PROGRESSION";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    fireEvent(screen.getByTestId("format-withLoad"), "valueChange", true);
    await pick("Squ", "mv-squats");
    toSummary();
    // Activation globale : aucune ligne de charge tant que « (+ kg) » n'est pas touché.
    expect(screen.queryByTestId("format-progression-0-0-load")).toBeNull();
    expect(screen.getByTestId("format-progression-0-charge")).toHaveTextContent(t.table.addLoadShort); // Recette du 05/11 (n-charge-switch) : « (rép, +kg) » sous le nom.
    expect(screen.getByTestId("format-progression-0-unit")).toHaveTextContent("(rép., +kg)"); // Spécification de Hermann du 08/11/2026 (A §4.4).
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
    await openedFormat();
    expect(screen.queryByTestId("format-roundCount-increase")).toBeNull();
    expect(screen.getByTestId("format-roundCount").props.keyboardType).toBe("number-pad");
    typeValue("roundCount", "5");
    expect(shown("roundCount")).toBe("5");
    // Durée « MM:SS » remplie par la droite : 1, 2, 0, 0 → 12:00.
    typeValue("timeCapSeconds", "1200");
    expect(shown("timeCapSeconds")).toBe("12′00″");
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
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette du 05/11 (k-aucun-resultat) : un texte sans résultat affiche « Aucun résultat » en mode catalogue", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "zzzz");
    expect(screen.getByTestId("format-catalogue-empty")).toHaveTextContent(t.noSearchResult);
    expect(screen.queryByTestId("format-catalogue-card-mv-squats")).toBeNull();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (autres constats) : AMRAP Buy-in — sections Buy-in et En boucle dès le questionnaire ; buy-in choisi requis ; jamais un mouvement de boucle", async () => {
    mockModel = "AMRAP";
    const draftRef = { current: createEmptyDraft() };
    render(<Harness draftRef={draftRef} />);
    await openedFormat();
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
    // Recette du 08/11/2026 au soir : « + Ajouter » reste affiché (plusieurs buy-in). [« Changer » — remplacé.]
    expect(screen.getByTestId("format-buy-in-link")).toHaveTextContent(t.add);
    expect(within(screen.getByTestId("format-buy-in-cards")).getByText("Squats sautés")).toBeTruthy();
    expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
    // Récapitulatif : « + Ajouter » ouvre directement le mode catalogue dans la modale (§19) et ajoute un second buy-in, sans
    // retirer le premier. [« Changer » effaçait d'abord le buy-in (contre-recette n° 3 ter) — remplacé le 08/11/2026.]
    toSummary();
    fireEvent.press(screen.getByTestId("format-buy-in-link"));
    expect(screen.getByTestId("format-catalogue-search")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Fen");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(screen.getByTestId("format-summary")).toBeTruthy();
    const buyIns = within(screen.getByTestId("format-buy-in-cards"));
    expect(buyIns.getByText("Squats sautés")).toBeTruthy();
    expect(buyIns.getByText("Fentes avant")).toBeTruthy();
    for (const index of [0, 1, 2, 3]) fireEvent.changeText(screen.getByTestId(`format-amrap-reps-${index}`), "10");
    expect(screen.getByTestId("format-loop-link")).toHaveTextContent(t.add);
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const [circuit] = structureCircuits(draftRef.current.structure!);
    expect(circuit!.exercises).toHaveLength(4);
    // MAJ 04/11 §6 bis 2 : Rôle dans le circuit (1 = Buy-in) ; deux buy-in, dans l'ordre d'ajout, puis la boucle.
    expect(draftRef.current.exercises.map((exercise) => [exercise.name, exercise.format?.settings.circuitRole ?? 0])).toEqual([
      ["Squats sautés", 1],
      ["Fentes avant", 1],
      ["Squats sautés", 0],
      ["Fentes avant", 0],
    ]);
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (autres constats) : Buy-in désactivé — la section disparaît avec son mouvement", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", true);
    await pick("Squ", "mv-squats", "format-buy-in");
    await pick("Fen", "mv-fentes", "format-loop");
    fireEvent(screen.getByTestId("format-buyIn"), "valueChange", false);
    expect(screen.queryByText(t.buyInSection)).toBeNull();
    expect(screen.queryByText("Squats sautés")).toBeNull();
    expect(screen.getByText("Fentes avant")).toBeTruthy();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (autres constats) : appui court sur un mouvement choisi — fiche en lecture seule", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    fireEvent.press(screen.getByTestId("format-movement-0"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement-sheet", params: { movementId: "mv-squats" } });
    // MAJ 04/11 §3 bis : l'appui sur la photo ouvre la Fiche du mouvement en consultation.
    mockPush.mockReset();
    fireEvent.press(screen.getByTestId("format-movement-card-0-photo-press"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement-sheet", params: { movementId: "mv-squats" } });
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (f3-depart) : Renforcement — la Pause est affichée et réglable", async () => {
    mockModel = "STRENGTH";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    expect(screen.getByTestId("format-row-pauseSeconds")).toBeTruthy();
    expect(shown("pauseSeconds")).toBe("0″");
    typeValue("pauseSeconds", "5");
    expect(shown("pauseSeconds")).toBe("5″");
  });

  // [Recette n° 3 bis du 03/11 (f3s-recherche) : champ de saisie intermédiaire — retiré (§19).]
  it("complément du 05/11 (§19) : « + Ajouter » ouvre le mode catalogue — recherche sans focus (Hermann, 05/11 soir), filtres, tri et piles à côté ; plus de lien Ouvrir / Fermer", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    expect(screen.queryByTestId("format-search")).toBeNull();
    // Demande de Hermann du 05/11/2026 (soir) : « on ne met pas le focus dans la barre de recherche par défaut ».
    expect(screen.getByTestId("format-catalogue-search").props.autoFocus).toBe(false);
    expect(await screen.findByTestId("format-catalogue-filter")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-sort")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-piles")).toBeTruthy();
    // p-ajout / p-coche (05/11 au soir) : « + Ajouter » devient « Revenir aux paramètres ».
    // D-604 (Hermann, 25/11/2026 ; Formats § 9.7) : le lien du haut s'intitule « Paramètres ». [« Revenir aux paramètres » — remplacé.]
    expect(screen.getByTestId("format-movements-link").props.accessibilityLabel).toBe("Paramètres");
    expect(screen.queryByText("Ouvrir le mode catalogue")).toBeNull();
    expect(screen.queryByText("Fermer le mode catalogue")).toBeNull();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 bis du 03/11 (f3s-clavier) : cellules des tableaux sans touche « Next » — navigation par la barre", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    const cell = screen.getByTestId("format-amrap-reps-0");
    expect(cell.props.keyboardType).toBe("number-pad");
    expect(cell.props.returnKeyType).toBeUndefined();
    expect(cell.props.onSubmitEditing).toBeUndefined();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (f3-depart) : À l'échec — aucune ligne de durée totale", async () => {
    mockModel = "UNTIL_FAILURE";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    expect(screen.getByTestId("format-row-target")).toBeTruthy();
    expect(screen.queryByTestId("format-row-total")).toBeNull();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 du 03/11 (f3-depart) : Progression — Pause affichée, pas de durée au questionnaire, Exécution en dernier ; tableau à noms fixes et séries défilantes", async () => {
    mockModel = "PROGRESSION";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    const rowsOf = () => within(screen.getByTestId("format-parameters")).getAllByTestId(/^format-row-/).map((row) => row.props.testID);
    // MAJ 04/11 §6 quater : « Avec charge » après Pause, au questionnaire seulement.
    expect(rowsOf()).toEqual(["format-row-seriesCount", "format-row-pauseSeconds", "format-row-withLoad"]);
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    expect(rowsOf()).toEqual(["format-row-seriesCount", "format-row-pauseSeconds", "format-row-withLoad", "format-row-execution"]);
    toSummary();
    // Complément du 5 novembre 2026 (§12) : nombre de séries, tableau dans son propre cadre, puis Pause, durée totale, Exécution.
    expect(rowsOf()).toEqual(["format-row-seriesCount"]);
    // Remarque B du 06/11 : « supprimer la barre horizontale d'un cadre si elle existe (ex. après nombre de séries tout seul) » — le cadre
    // rogne le trait de sa dernière ligne.
    for (const id of ["format-parameters", "format-parameters-after"]) {
      const panel = screen.getByTestId(id);
      expect(StyleSheet.flatten(panel.props.style)).toMatchObject({ overflow: "hidden" });
      expect(StyleSheet.flatten(panel.children[0] && typeof panel.children[0] !== "string" ? panel.children[0].props.style : {})).toMatchObject({ marginBottom: -1 });
    }
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

  it("recette n° 3 (f3-tabata) : Tabata À la suite à deux mouvements — durée exacte « 8′50″ », sans arrondi", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-total")).toHaveTextContent("8′50″");
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent("8′50″");
    expect(shown("recoveryBetweenSeconds")).toBe("1′00″");
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette n° 3 (f3-emom) : EMOM dans chaque intervalle — un cadre par intervalle avec les deux mouvements", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    const groups = screen.getAllByTestId(/^format-timeline-group-/);
    expect(groups).toHaveLength(6);
    expect(groups[0]!.props.children).toHaveLength(2);
  });

  // Spécification de Hermann du 08/11/2026 (A §1, §3, §4.2) — récapitulatif EMOM : durées M′SS″ (Intervalle, Durée totale, repère de fin du
  // Déroulé, début « 0 ») ; lignes de paramètres de 40 + séparateur de 1 (rogné sous la dernière) ; cadre du tableau sans marge haute.
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("spécification du 08/11 (A) : récapitulatif EMOM — durées M′SS″, lignes de paramètres de 40, cadre du tableau sans marge", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    toSummary();
    expect(screen.getByTestId("format-intervalSeconds").props.value).toBe("1′00″");
    expect(screen.getByTestId("format-total")).toHaveTextContent(/^\d+′\d{2}″$/u);
    expect(screen.getByTestId("format-timeline-end")).toHaveTextContent(/^\d+′\d{2}″$/u);
    for (const id of ["format-row-seriesCount", "format-row-intervalSeconds", "format-row-total"]) {
      expect(StyleSheet.flatten(screen.getByTestId(id).props.style)).toMatchObject({ minHeight: 41, paddingVertical: 0, borderBottomWidth: 1 });
    }
    expect(StyleSheet.flatten(screen.getByTestId("format-objectives").props.style).paddingVertical).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId("format-emom-table").props.style)).toMatchObject({ paddingBottom: 3.5 });
  });

  // Constat de Hermann du 06/11/2026 sur iPhone (« La carte est sélectionnée mais ne se déplace pas, c'est l'écran qui
  // se déplace ») : le glisser est porté par un geste natif (Pan après appui long). Jest simule les états du geste ; il ne
  // prouve pas que la feuille native iOS reste immobile (vérification sur iPhone).
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("constat du 06/11 : appui long puis glisser — la carte suit le doigt et prend la place atteinte", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-movement-card-0")).toHaveTextContent(/Squats sautés/);
    // `fireGestureHandler` joue la séquence entière (il termine le geste) : l'état intermédiaire n'est pas observable ici.
    act(() => {
      fireGestureHandler(getByGestureTestId("format-movement-drag-0"), [
        { state: State.BEGAN },
        { state: State.ACTIVE, translationY: 0 },
        { translationY: 40 },
        { translationY: 70 },
        { state: State.END, translationY: 70 },
      ]);
    });
    expect(screen.getByTestId("format-movement-card-0")).toHaveTextContent(/Fentes avant/);
    expect(screen.getByTestId("format-movement-card-1")).toHaveTextContent(/Squats sautés/);
    expect(screen.getByTestId("format-questionnaire").props.scrollEnabled).toBe(true);
    // Aucun appui court déclenché par le geste (pas de fiche ouverte).
    expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/movement-sheet" }));
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("constat du 06/11 : geste interrompu (annulé) — l'ordre reste inchangé", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    act(() => {
      fireGestureHandler(getByGestureTestId("format-movement-drag-0"), [
        { state: State.BEGAN },
        { state: State.ACTIVE, translationY: 0 },
        { translationY: 70 },
        { state: State.CANCELLED, translationY: 70 },
      ]);
    });
    expect(screen.getByTestId("format-movement-card-0")).toHaveTextContent(/Squats sautés/);
    expect(screen.getByTestId("format-questionnaire").props.scrollEnabled).toBe(true);
  });

  // [Constat du 06/11 : buy-in et buy-out sans geste de déplacement — remplacé le 08/11/2026 au soir (plusieurs buy-in / buy-out) :
  // chaque carte se déplace dans sa section, sans en sortir ; une carte de boucle ne dépasse toujours ni les buy-in ni les buy-out.]
  // [Recette du 08/11 au soir : cartes des buy-in et buy-out déplacées par appui long dans leur section — cartes remplacées le
  // 15/11/2026 par les lignes des trois blocs (décision de Hermann, « For time — tableau unique, sans questionnaire »). Monter /
  // Descendre (VoiceOver) et Supprimer (glissement) restent bornés au bloc.]
  it("recette du 08/11 au soir, décision du 15/11 : For time — plusieurs buy-in et buy-out (sélection multiple) ; Monter / Descendre et Supprimer dans le bloc", async () => {
    mockModel = "FOR_TIME";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    // D-572 (25/11/2026) : cinq mouvements au plus par format — une boucle d'un mouvement, deux buy-in, deux buy-out. [Boucle de deux
    // mouvements (six au total) — remplacée.]
    await pick("Squ", "mv-squats", "format-loop");
    // Sélection multiple dans le bloc Buy-in, puis dans le bloc Buy-out ; le lien devient « + Modifier » (D-572). [« + Ajouter » reste
    // affiché — remplacé.]
    for (const section of ["format-buy-in", "format-buy-out"]) {
      fireEvent.press(screen.getByTestId(`${section}-link`));
      fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
      fireEvent.press(screen.getByTestId("format-catalogue-card-mv-fentes"));
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-catalogue-add"));
      });
      expect(screen.getByTestId(`${section}-link`)).toHaveTextContent(t.editMovements);
    }
    const named = /^(Squats sautés|Fentes avant)$/;
    for (const block of ["format-buy-in", "format-buy-out"]) expect(within(screen.getByTestId(block)).getAllByText(named)).toHaveLength(2);
    expect(within(screen.getByTestId("format-loop")).getAllByText(named)).toHaveLength(1);
    // Ordre : buy-in (0, 1), boucle (2), buy-out (3, 4).
    const text = (index: number) => String(screen.getByTestId(`format-for-time-${index}-name-title`).props.children);
    const [in0, in1, out0, out1] = [text(0), text(1), text(3), text(4)];
    expect(in0).not.toBe(in1);
    expect(out0).not.toBe(out1);
    expect(text(2)).toBe("Squats sautés");
    // VoiceOver : Monter sur le premier buy-out ne le fait pas entrer dans la boucle ; Descendre l'échange avec le second.
    fireEvent(screen.getByTestId("format-movement-3-card"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect([text(2), text(3)]).toEqual(["Squats sautés", out0]);
    fireEvent(screen.getByTestId("format-movement-3-card"), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect([text(3), text(4)]).toEqual([out1, out0]);
    // Retrait d'un buy-in (action Supprimer du glissement) : l'autre reste.
    fireEvent(screen.getByTestId("format-movement-0-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(within(screen.getByTestId("format-buy-in")).getAllByText(named)).toHaveLength(1);
    expect(within(screen.getByTestId("format-buy-in")).getByText(in1)).toBeTruthy();
  });

  it("recette du 26/11/2026 (après-midi) : lignes du For time — règle unique du glisser-pour-options (geste court, lancer, diagonale, sans rebond)", async () => {
    mockModel = "FOR_TIME";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats", "format-loop");
    expectSwipeRevealRule("format-movement-0");
    // Le glisser ne déplace pas la ligne (le déplacement reste à l'appui long) et ne la retire pas.
    expect(screen.getByTestId("format-for-time-0-name-title").props.children).toBe("Squats sautés");
  });

  it("recette du 16/11/2026 (Déroulé, légende) : la pastille d'un buy-in ou d'un buy-out a la couleur de ses cadres ; celle d'un tour garde sa nuance", async () => {
    mockModel = "FOR_TIME";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats", "format-loop");
    for (const [section, card] of [["format-buy-in", "mv-fentes"], ["format-buy-out", "mv-squats"]] as const) {
      fireEvent.press(screen.getByTestId(`${section}-link`));
      fireEvent.press(await screen.findByTestId(`format-catalogue-card-${card}`));
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-catalogue-add"));
      });
    }
    const swatch = (index: number) => (StyleSheet.flatten(screen.getByTestId(`format-timeline-legend-${index}`).props.style as object) as { backgroundColor?: string }).backgroundColor;
    // Ordre : buy-in (0), tour (1), buy-out (2).
    expect(swatch(0)).toBe("#7984C7");
    expect(swatch(2)).toBe("#7984C7");
    expect(swatch(1)).not.toBe("#7984C7");
  });

  it("recette n° 3 (f3-questionnaire) : le dernier mouvement se supprime, l'enregistrement devient indisponible", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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
    await openedFormat();
    await pick("Squ", "mv-squats");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    fireEvent.press(screen.getByTestId("harness-reopen"));
    // D-603 / D-604 : nouvelle ouverture — choix des mouvements d'abord.
    await openedFormat();
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

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("MAJ 04/11 §3 ; recette du 05/11 au soir (p-coche, p-ajout) : mode catalogue — recherche, effacement, Filtrer / Trier / Replier, sélection, « Ajouter X mouvements » en bas ; « Revenir aux paramètres » sans ajout ; la croix quitte le Format", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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
    // Remarque E du 07/11/2026 : fermeture en fondu (fin de fondu signalée au fil JS), puis retour aux paramètres.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(screen.queryByTestId("format-movement-card-2")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
    expect(mockDismiss).not.toHaveBeenCalled();
    // « Fermer sans sélectionner » (s-focus, 06/11/2026) : même effet, sans ajout.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    await screen.findByTestId("format-catalogue-card-mv-fentes");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
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
    await openedFormat();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    scrollTo.mockClear();
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "po");
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Recette iPhone du 04/11/2026 (cahier « Recette Formats 04/11 », écarts un par ligne)
  // ---------------------------------------------------------------------------

  // [Recette du 04/11 (e-fortime-buyin) : interrupteurs puis lignes Buy-in / Buy-out du questionnaire, « Valider les paramètres » —
  // remplacés le 15/11/2026 (décision de Hermann, registre ch07, « For time — tableau unique, sans questionnaire »).]
  /**
   * Mission FORMATS-MODALE-PARAMS-20261116 (décision de Hermann du 16/11/2026) : la zone du nom ouvre la modale des paramètres
   * d'exécution ; `steps` y agit, puis ✓ (un premier appui range un champ resté ouvert) — fermeture animée achevée.
   */
  async function inSheet(index: number, steps: () => void) {
    fireEvent.press(screen.getByTestId(`format-for-time-${index}-name-open`));
    await screen.findByTestId("execution-sheet");
    steps();
    for (let press = 0; press < 2 && screen.queryByTestId("execution-sheet") !== null; press += 1)
      await act(async () => {
        fireEvent.press(screen.getByTestId("execution-sheet-validate"));
      });
    await waitFor(() => expect(screen.queryByTestId("execution-sheet")).toBeNull(), { timeout: 4000 });
  }

  /**
   * For time (16/11/2026) : unité et valeurs de chaque série saisies dans la modale ; `count` : nombre de séries du buy-in ou du
   * buy-out réglé dans la modale. [Unité au popover, valeurs au tableau (15/11/2026) — remplacé.]
   */
  async function fillForTime(index: number, values: readonly string[], mode: "REPETITIONS" | "DURATION" = "REPETITIONS", count?: number) {
    await inSheet(index, () => {
      fireEvent.press(screen.getByTestId(`execution-sheet-mode-control-${mode}`));
      if (count !== undefined) enterExecutionSheetValue("execution-sheet-series", count, "integer");
      const kind = mode === "DURATION" ? "duration" : "integer";
      // Une seule série : objectif commun de la modale (pas de tableau des séries).
      if (screen.queryByTestId("execution-sheet-table-row-1-target", { includeHiddenElements: true }) === null) enterExecutionSheetValue("execution-sheet-target", Number(values[0]), kind);
      else values.forEach((value, at) => enterExecutionSheetValue(`execution-sheet-table-row-${at + 1}-target`, Number(value), kind));
    });
  }

  const parametersLine = (index: number) => screen.getByTestId(`format-for-time-${index}-parameters`);

  describe("For time — tableau unique, sans questionnaire (décision de Hermann du 15/11/2026)", () => {
    const rowIds = () => screen.getAllByTestId(/^format-row-/).map((row) => String(row.props.testID).replace("format-row-", ""));

    it("état vide : récapitulatif direct, ni questionnaire ni « Valider les paramètres », ni interrupteurs ; trois blocs sans colonne ; coche grise ; Retour quitte sans ajout", async () => {
      mockModel = "FOR_TIME";
      const draftRef = { current: createEmptyDraft() };
      // Même ouvert par la route du questionnaire, le For time s'affiche en récapitulatif.
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
      expect(screen.getByTestId("format-summary")).toBeTruthy();
      expect(screen.queryByTestId("format-validate")).toBeNull();
      for (const id of ["format-withLoad", "format-buyIn", "format-buyOut"]) expect(screen.queryByTestId(id)).toBeNull();
      // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time ») : plus de « Repos entre les tours ».
      expect(rowIds()).toEqual(["roundCount", "timeCapSeconds"]);
      // Demande de Hermann du 15/11/2026 (Figma `12341:27052`) : carte des paramètres pleine largeur, sans rayon, retrait de 12,
      // lignes de 31 — comme les trois blocs.
      expect(StyleSheet.flatten(screen.getByTestId("format-parameters").props.style)).toMatchObject({ marginHorizontal: 0, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 4 });
      expect(StyleSheet.flatten(screen.getByTestId("format-row-roundCount").props.style)).toMatchObject({ height: 31 });
      expect(shown("roundCount")).toBe("3");
      expect(screen.getByTestId("format-timeCapSeconds").props.placeholder).toBe(t.noLimit);
      for (const block of ["format-buy-in", "format-loop", "format-buy-out"]) {
        expect(screen.getByTestId(`${block}-link`)).toHaveTextContent(t.forTimeTable.add);
        expect(screen.queryByTestId(`${block}-columns`)).toBeNull();
        expect(screen.queryByTestId(`${block}-add-column`)).toBeNull();
        expect(screen.queryByTestId(`${block}-remove-column`)).toBeNull();
      }
      expect([t.forTimeTable.buyIn, t.forTimeTable.loop, t.forTimeTable.buyOut].map((title) => screen.getByText(title))).toHaveLength(3);
      expect(screen.queryByTestId("format-movement-cards")).toBeNull();
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
      // Recette du 16/11/2026 (constat b) : croix « Fermer ». [Flèche « Retour » — remplacée.]
      expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.closeAccessibilityLabel);
      await pick("Squ", "mv-squats", "format-loop");
      fireEvent.press(screen.getByTestId("screen-header-back"));
      await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
      expect(draftRef.current.exercises).toHaveLength(0);
      expect(mockDismiss).not.toHaveBeenCalled();
    });

    it("premier mouvement : S1 à droite, ni « − » ni « + » ; « Paramètres à compléter » en rouge, cases désactivées ; buy-in : Nombre de répétitions dans la modale (D-604) ; boucle : « tours » (écart b), nombre de tours imposé ; charge activée dans la modale ; enregistrement", async () => {
      mockModel = "FOR_TIME";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-buy-in");
      expect(screen.getByTestId("format-buy-in-head-0")).toHaveTextContent("S1");
      expect(screen.queryByTestId("format-buy-in-head-1")).toBeNull();
      // Mission du 16/11/2026, règle 4 : plus de « − » ni de « + » dans l'en-tête.
      expect(screen.queryByTestId("format-buy-in-remove-column")).toBeNull();
      expect(screen.queryByTestId("format-buy-in-add-column")).toBeNull();
      expect(screen.queryByTestId("format-loop-columns")).toBeNull();
      // Règle 1 : « Paramètres à compléter » en rouge ; « – » grisé à la place de la case ; ni popover ni « + kg ».
      expect(parametersLine(0)).toHaveTextContent(t.table.parametersToComplete);
      expect(StyleSheet.flatten(parametersLine(0).props.style).color).toBe(colors.danger);
      expect(screen.getByTestId("format-for-time-0-0")).toHaveTextContent(t.forTimeTable.disabledValue);
      expect(screen.queryByTestId("format-for-time-0-charge")).toBeNull();
      expect(screen.queryByTestId("format-for-time-0-unit-menu-REPETITIONS")).toBeNull();
      // Boucle : Tour 1…3 (Nombre de tours, ligne dédiée).
      await pick("Fen", "mv-fentes", "format-loop");
      expect(screen.getByTestId("format-loop-head-2")).toHaveTextContent("Tour 3");
      // Écart (a) : le nombre de séries du buy-in se règle dans la modale ; à deux séries, « Variables » est disponible.
      // Décision du 16/11/2026 : même modale que dans la Composition — ligne Rôle (Buy-in). Recette du 17/11/2026 (Hermann : « Temps de
      // repos supprimés en For time : […] Récupération après un exercice. ») : pas de ligne Récupération. [Ligne Récupération — remplacé.]
      await inSheet(0, () => {
        expect(screen.getByTestId("execution-sheet-format-role-row")).toBeTruthy();
        expect(screen.queryByTestId("execution-sheet-recovery", { includeHiddenElements: true })).toBeNull();
        fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
        // D-604 (Hermann, 25/11/2026 ; Figma `11312:19895`) : en buy-in, Nombre de répétitions à la place de Séries. [Écart (a) du
        // 16/11/2026 — nombre de séries du buy-in réglé dans la modale, « Variables » dès deux séries, tableau des séries — remplacé.]
        expect(screen.queryByTestId("execution-sheet-row-series-type", { includeHiddenElements: true })).toBeNull();
        enterExecutionSheetValue("execution-sheet-target", 50, "integer");
        // D-607 (D-572 point 7) : For time toujours à l’objectif — ligne Condition d’arrêt non affichée.
        expect(screen.queryByTestId("execution-sheet-row-stop-condition", { includeHiddenElements: true })).toBeNull();
      });
      expect(screen.queryByTestId("format-buy-in-head-1")).toBeNull();
      expect(shown("for-time-0-0")).toBe("50");
      // Règle 2 : l'unité, en bleu.
      expect(parametersLine(0)).toHaveTextContent(/^rép\.$/);
      expect(StyleSheet.flatten(parametersLine(0).props.style).color).toBe(valueFieldColors.editable);
      // La modale de la boucle compte en tours (écart b), nombre imposé par le Nombre de tours.
      fireEvent(screen.getByTestId("format-roundCount"), "focus");
      fireEvent.changeText(screen.getByTestId("format-roundCount"), "4");
      fireEvent(screen.getByTestId("format-roundCount"), "blur");
      expect(screen.getByTestId("format-loop-more", { includeHiddenElements: true })).toBeTruthy();
      fireEvent(screen.getByTestId("format-roundCount"), "focus");
      fireEvent.changeText(screen.getByTestId("format-roundCount"), "3");
      fireEvent(screen.getByTestId("format-roundCount"), "blur");
      expect(screen.queryByTestId("format-loop-more", { includeHiddenElements: true })).toBeNull();
      // Unité requise : coche grise tant que la ligne de boucle n'a ni unité ni valeurs.
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
      await inSheet(1, () => {
        fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
        expect(screen.getByTestId("execution-sheet-series-value", { includeHiddenElements: true })).toHaveTextContent("3 tours variables");
        ["21", "15", "9"].forEach((value, at) => enterExecutionSheetValue(`execution-sheet-table-row-${at + 1}-target`, Number(value), "integer"));
        // Règle 5 : la charge s'active dans la modale ; décision du 16/11/2026 : cases « — » sur fond rouge jusqu'à la saisie.
        fireEvent.press(screen.getByTestId("execution-sheet-load-control-WITH"));
        expect(screen.getByTestId("execution-sheet-table-row-1-load-value", { includeHiddenElements: true })).toHaveTextContent("—");
        expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
        enterExecutionSheetValue("execution-sheet-table-row-1-load", 40, "integer");
      });
      // Charge propre au mouvement, valeur sous la colonne.
      expect(screen.getByTestId("format-for-time-1-0-load").props.value).toBe("(40 kg)");
      expect(parametersLine(1)).not.toHaveTextContent(/kg/);
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      const [circuit] = structureCircuits(draftRef.current.structure!);
      expect(circuit).toMatchObject({ repeatCount: 3, format: { key: "FOR_TIME" } });
      expect(draftRef.current.exercises.map((exercise) => [exercise.name, exercise.format?.settings.circuitRole ?? 0])).toEqual([
        ["Squats sautés", 1],
        ["Fentes avant", 0],
      ]);
      const rows = (index: number) => seriesRowsOf(draftRef.current.exercises[index]!.executionParameters);
      expect(rows(0).map((row) => (row.target.kind === "NUMBER" ? row.target.value : null))).toEqual([50]);
      expect(rows(1).map((row) => (row.target.kind === "NUMBER" ? row.target.value : null))).toEqual([21, 15, 9]);
      expect(rows(1)[0]!.loadKg).toBe(40);
      await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith(2));
    });

    it("unité dans la modale : Durée possible tant qu'un autre exercice reste en Répétitions ; le dernier en Répétitions garde son unité, avec le message court", async () => {
      mockModel = "FOR_TIME";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-loop");
      await pick("Fen", "mv-fentes", "format-loop");
      await fillForTime(0, ["30", "30", "30"], "DURATION");
      expect(parametersLine(0)).toHaveTextContent(/^durée$/);
      // Recette du 17/11/2026 (autres remarques, a) : modale commune à la Composition — pour le dernier exercice en Répétitions, l'option
      // Durée est grisée, avec le message court sous le cadre Exécution (règle du 05/11/2026). [Durée choisie puis refusée par une
      // alerte au ✓ — remplacé.]
      fireEvent.press(screen.getByTestId("format-for-time-1-name-open"));
      await screen.findByTestId("execution-sheet");
      expect(screen.getByTestId("execution-sheet-mode-control-DURATION").props.accessibilityState).toMatchObject({ disabled: true });
      expect(screen.getByTestId("execution-sheet-duration-refused")).toHaveTextContent(t.lastRepetitionsLocked);
      await act(async () => {
        fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
      });
      await waitFor(() => expect(screen.queryByTestId("execution-sheet")).toBeNull(), { timeout: 4000 });
      expect(parametersLine(1)).toHaveTextContent(t.table.parametersToComplete);
    });

    // Recette iPhone du 15/11/2026 (Hermann : « Ajout d'un buy in : mis à jour de l'unité : seul le nombre de répétition est
    // proposé » ; « lorsque l'unité est choisie l'ecran est figé, aucun bouton ne fonctionne »).
    it("recette du 15/11 : buy-in seul — Répétitions et Durée admises ; l'exercice en tour ajouté ensuite porte les Répétitions ; la ligne des paramètres est dans la ligne glissable, « + Ajouter » reste actif après le choix", async () => {
      mockModel = "FOR_TIME";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-buy-in");
      // Ligne des paramètres : texte de la ligne (plus de menu natif au-dessus de la ligne glissable).
      expect(within(screen.getByTestId("format-movement-0")).getByTestId("format-for-time-0-parameters")).toBeTruthy();
      // Mouvement seul : exercice seul, une série par tour (3), comme dans la Composition.
      await fillForTime(0, ["45", "45", "45"], "DURATION");
      expect(parametersLine(0)).toHaveTextContent(/^durée$/);
      await pick("Fen", "mv-fentes", "format-loop");
      // Seul exercice de la boucle : il reste en Répétitions (au moins un en Répétitions, FMT-31) — Durée grisée dans la modale
      // (recette du 17/11/2026, autres remarques, a). [Durée refusée par une alerte au ✓ — remplacé.]
      await fillForTime(1, ["21", "15", "9"]);
      expect(parametersLine(1)).toHaveTextContent(/^rép\.$/);
    });
  });

  // Décision de Hermann du 16/11/2026 : « la modale des paramètres d'exécution doit être la même qu'on l'ouvre de la composition de
  // séance ou de l'écran d'un format, les effets de changement de rôle sont aussi identiques ».
  describe("For time — modale identique à celle de la Composition (16/11/2026)", () => {
    // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : […] Récupération après un exercice. ») : plus de ligne
    // Récupération dans la modale For time. [« ligne Récupération : valeur propre au mouvement enregistrée » — remplacé.]
    it("ligne Rôle : passer un exercice de la boucle en Buy-out le déplace dans le bloc Buy-out ; pas de ligne Récupération", async () => {
      mockModel = "FOR_TIME";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-loop");
      await pick("Fen", "mv-fentes", "format-loop");
      await fillForTime(0, ["21", "15", "9"]);
      await inSheet(1, () => {
        fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
        fireEvent.press(screen.getByTestId("execution-sheet-format-role-control-BUY_OUT"));
        const kind = "integer";
        if (screen.queryByTestId("execution-sheet-table-row-1-target", { includeHiddenElements: true }) === null) enterExecutionSheetValue("execution-sheet-target", 30, kind);
        else for (let n = 1; screen.queryByTestId(`execution-sheet-table-row-${n}-target`, { includeHiddenElements: true }) !== null; n += 1) enterExecutionSheetValue(`execution-sheet-table-row-${n}-target`, 30, kind);
        expect(screen.queryByTestId("execution-sheet-recovery", { includeHiddenElements: true })).toBeNull();
      });
      await waitFor(() => expect(within(screen.getByTestId("format-buy-out")).getByText("Fentes avant")).toBeTruthy());
      expect(within(screen.getByTestId("format-loop")).queryByText("Fentes avant")).toBeNull();
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      const fentes = draftRef.current.exercises.find((exercise) => exercise.name === "Fentes avant")!;
      expect(fentes.format?.settings.circuitRole).toBe(2);
    });
  });

  // Corrections 1 et 2 de Hermann du 14/11/2026 (For time) : tests (b) et (e) au niveau de l'écran.
  // Décision de Hermann du 14/11/2026 (« Correction — For time : ajouter le mode d’exécution « En alternance » / « À la suite » »,
  // FT-20 à FT-23). Décision du 15/11/2026 (« For time — tableau unique, sans questionnaire », Figma `12341:27002`, `12428:26360`) :
  // plus de questionnaire ; « Exécution » en dernière ligne de la carte des paramètres ; unité choisie ligne par ligne.
  // [« Exécution » au-dessus de « Nombre de tours » au récapitulatif (Figma `8624:30672`, archivé) — remplacé.]
  describe("For time — mode d'exécution « En alternance » / « À la suite »", () => {
    const rowIds = () => screen.getAllByTestId(/^format-row-/).map((row) => String(row.props.testID).replace("format-row-", ""));

    it("un seul exercice en tour (avec buy-in) : ligne Exécution masquée, mode alternance", async () => {
      mockModel = "FOR_TIME";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-buy-in");
      await pick("Fen", "mv-fentes", "format-loop");
      expect(screen.queryByTestId("format-row-execution")).toBeNull();
      await fillForTime(0, ["30"]);
      await fillForTime(1, ["21", "15", "9"]);
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      expect(structureCircuits(draftRef.current.structure!)[0]!.nature).toBe("SERIES");
    });

    // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : […] Repos entre les tours. • Repos entre les séries
    // (mode « À la suite »). ») : ni l'une ni l'autre ligne. [« Repos entre les tours » / « Repos entre les séries » affichés — remplacé.]
    it("deux exercices : « Exécution » en dernière ligne, « En alternance » ; « À la suite » : « Nombre de séries », sans repos, colonnes S1…, séries groupées enregistrées, séries = tours", async () => {
      mockModel = "FOR_TIME";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-loop");
      await pick("Fen", "mv-fentes", "format-loop");
      expect(rowIds()).toEqual(["roundCount", "timeCapSeconds", "execution"]);
      expect(screen.getByTestId("format-row-execution")).toHaveTextContent(t.executions.ALTERNATED, { exact: false });
      expect(screen.getByTestId("format-row-roundCount")).toHaveTextContent(t.rows.roundCount, { exact: false });
      expect(screen.queryByTestId("format-row-restBetweenRoundsSeconds")).toBeNull();
      expect(screen.getByTestId("format-loop-head-0")).toHaveTextContent("Tour 1");
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-execution-SEQUENCE"));
      });
      expect(screen.getByTestId("format-row-execution")).toHaveTextContent(t.executions.SEQUENCE, { exact: false });
      expect(screen.getByTestId("format-row-roundCount")).toHaveTextContent(t.rows.seriesCount, { exact: false });
      expect(screen.queryByTestId("format-row-restBetweenRoundsSeconds")).toBeNull();
      expect(screen.getByTestId("format-loop-head-0")).toHaveTextContent("S1");
      await fillForTime(0, ["21", "15", "9"]);
      await fillForTime(1, ["21", "15", "9"]);
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      const [circuit] = structureCircuits(draftRef.current.structure!);
      expect(circuit).toMatchObject({ nature: "TOURS", repeatCount: 3 });
      expect(draftRef.current.exercises.map((exercise) => seriesRowsOf(exercise.executionParameters).length)).toEqual([3, 3]);
    });
  });

  describe("For time — valeurs par tour et séries des blocs (corrections 1 et 2 du 14/11/2026)", () => {
    const targetsOf = (draft: SessionDraft, index: number) =>
      seriesRowsOf(draft.exercises[index]!.executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));

    it("(b) tours 2 et 3 modifiés au récapitulatif : une valeur par tour enregistrée, retrouvée à la réouverture", async () => {
      mockModel = "FOR_TIME";
      const first = { current: createEmptyDraft() };
      const view = render(<Harness draftRef={first} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-loop");
      await pick("Fen", "mv-fentes", "format-loop");
      await fillForTime(0, ["10", "10", "10"]);
      await fillForTime(1, ["21", "15", "9"]);
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      // (a) 10 répétitions sur 3 tours : trois valeurs enregistrées, jamais « identiques + une valeur ».
      expect(first.current.exercises[0]!.executionParameters.series.kind).toBe("VARIABLE");
      expect(targetsOf(first.current, 0)).toEqual([10, 10, 10]);
      view.unmount();
      const [circuit] = structureCircuits(first.current.structure!);
      mockCircuitId = circuit!.id;
      const second = { current: first.current };
      const reopened = render(<Harness draftRef={second} initialStage="summary" />);
      expect(await screen.findByTestId("format-summary")).toBeTruthy();
      // Réouverture (« Modifier le format ») : unité et valeurs relues, cases actives.
      expect(parametersLine(0)).toHaveTextContent(/^rép\.$/);
      typeValue("for-time-0-1", "12");
      typeValue("for-time-0-2", "14");
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      // Composition : la configuration de l'exercice porte les valeurs des tours 2 et 3.
      expect(targetsOf(second.current, 0)).toEqual([10, 12, 14]);
      reopened.unmount();
      render(<Harness draftRef={{ current: second.current }} initialStage="summary" />);
      expect(await screen.findByTestId("format-summary")).toBeTruthy();
      expect(["0", "1", "2"].map((at) => shown(`for-time-0-${at}`))).toEqual(["10", "12", "14"]);
    });

    // [« Sans » à la ligne Buy-in retirant le bloc après confirmation (correction 2 du 14/11/2026 ; i7, 15/11/2026) — remplacé le
    // 15/11/2026 : plus de ligne Buy-in / Buy-out, le nombre de séries est le nombre de colonnes (− / +) ; un mouvement se retire par
    // le glissement de sa ligne.]
    // D-604 (Hermann, 25/11/2026 ; Formats § 9.7) : en buy-in ou buy-out, la modale présente Nombre de répétitions à la place de Séries.
    it("(e) D-604 — buy-in et buy-out : Nombre de répétitions dans la modale (une série), valeurs conservées et retrouvées à la réouverture", async () => {
      mockModel = "FOR_TIME";
      const first = { current: createEmptyDraft() };
      const view = render(<Harness draftRef={first} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-buy-in");
      await pick("Fen", "mv-fentes", "format-loop");
      await pick("Squ", "mv-squats", "format-buy-out");
      await fillForTime(0, ["30"]);
      await fillForTime(1, ["21", "15", "9"]);
      await fillForTime(2, ["5"]);
      expect(screen.queryByTestId("format-buy-in-head-1")).toBeNull();
      expect(screen.queryByTestId("format-buy-out-head-1")).toBeNull();
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      expect(targetsOf(first.current, 0)).toEqual([30]);
      expect(targetsOf(first.current, 2)).toEqual([5]);
      view.unmount();
      const [circuit] = structureCircuits(first.current.structure!);
      mockCircuitId = circuit!.id;
      render(<Harness draftRef={{ current: first.current }} initialStage="summary" />);
      expect(await screen.findByTestId("format-summary")).toBeTruthy();
      expect([shown("for-time-0-0"), shown("for-time-2-0")]).toEqual(["30", "5"]);
    });

    // [Remplacé le 25/11/2026 — D-604 : plus de Séries dans la modale d'un buy-in ou d'un buy-out. Test d'origine conservé, désactivé.]
    it.skip("(e) buy-in à 2 séries, buy-out à 3 (dans la modale, 16/11/2026) : S1-S2 et S1-S3, valeurs conservées et retrouvées à la réouverture", async () => {
      mockModel = "FOR_TIME";
      const first = { current: createEmptyDraft() };
      const view = render(<Harness draftRef={first} />);
      await openedFormat();
      await pick("Squ", "mv-squats", "format-buy-in");
      await pick("Fen", "mv-fentes", "format-loop");
      await pick("Squ", "mv-squats", "format-buy-out");
      await fillForTime(0, ["30", "40"], "REPETITIONS", 2);
      await fillForTime(1, ["21", "15", "9"]);
      await fillForTime(2, ["1", "2", "5"], "REPETITIONS", 3);
      expect(screen.getByTestId("format-buy-in-head-1")).toHaveTextContent("S2");
      expect(screen.queryByTestId("format-buy-in-head-2")).toBeNull();
      expect(screen.getByTestId("format-buy-out-head-2")).toHaveTextContent("S3");
      await act(async () => {
        fireEvent.press(screen.getByTestId("format-save"));
      });
      expect(targetsOf(first.current, 0)).toEqual([30, 40]);
      expect(targetsOf(first.current, 2)).toEqual([1, 2, 5]);
      view.unmount();
      const [circuit] = structureCircuits(first.current.structure!);
      mockCircuitId = circuit!.id;
      render(<Harness draftRef={{ current: first.current }} initialStage="summary" />);
      expect(await screen.findByTestId("format-summary")).toBeTruthy();
      expect([shown("for-time-0-0"), shown("for-time-0-1"), shown("for-time-2-2")]).toEqual(["30", "40", "5"]);
      expect(screen.queryByTestId("format-buy-in-head-2")).toBeNull();
      expect(screen.getByTestId("format-buy-out-head-2")).toHaveTextContent("S3");
    });
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette du 04/11 (e-emom-mode, e-emom-trait) : EMOM — aucune unité par défaut, objectif vide en rouge (trait), enregistrement indisponible", async () => {
    mockModel = "EMOM";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette du 04/11 (e-amrap-trait) : AMRAP — objectif vide affiché par un trait", async () => {
    mockModel = "AMRAP";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    toSummary();
    fireEvent.changeText(screen.getByTestId("format-amrap-reps-0"), "");
    expect(screen.getByTestId("format-amrap-reps-0").props.placeholder).toBe(t.dash);
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette du 04/11 (e-deathby) : Death by — le tableau Départ | Incrément apparaît au questionnaire dès le deuxième mouvement", async () => {
    mockModel = "DEATH_BY";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    expect(screen.queryByTestId("format-death-by-table")).toBeNull();
    expect(screen.getByTestId("format-row-startRepetitions")).toBeTruthy();
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-questionnaire")).toBeTruthy();
    expect(screen.getByTestId("format-death-by-table")).toBeTruthy();
    expect(screen.queryByTestId("format-row-startRepetitions")).toBeNull();
    // Spécification de Hermann du 08/11/2026 (B §4.4, « Unité retirée des cellules ») : valeurs sans unité, « rép. » dans l'étiquette
    // sous le nom. [« 1 rép. », « + 1 rép. » (Hermann, 04/11/2026) — remplacés le 08/11/2026.]
    expect(screen.getByTestId("format-death-by-start-0").props.value).toBe("1");
    expect(screen.getByTestId("format-death-by-increment-0").props.value).toBe("+ 1");
    expect(screen.getByTestId("format-death-by-0-unit")).toHaveTextContent("(rép.)");
    // Retour à un mouvement : le tableau disparaît.
    fireEvent(screen.getByTestId("format-movement-1-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    expect(screen.queryByTestId("format-death-by-table")).toBeNull();
  });

  it("recette du 06/11 (n-deathby) : Death by à deux mouvements — « Récupération entre les mouvements » avant « Condition d'arrêt »", async () => {
    mockModel = "DEATH_BY";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    const order = screen.UNSAFE_root.findAll((node) => typeof node.props.testID === "string" && /^format-row-/.test(node.props.testID) && typeof node.type !== "string")
      .map((node) => node.props.testID as string)
      .filter((id, at, all) => all.indexOf(id) === at);
    expect(order.indexOf("format-row-recoveryBetweenSeconds")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("format-row-recoveryBetweenSeconds")).toBeLessThan(order.indexOf("format-row-stop"));
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("recette du 04/11 (e-contexte-fixe, e-cat-fixe, e-cat-recherche) : zone de contexte figée ; en mode catalogue elle porte l'en-tête et la recherche (même champ, croix intérieure)", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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
    // 08/11/2026 (b-cat-fondu) : résultats dans le défilement propre de la couche du catalogue. [Dans `format-questionnaire` — remplacé.]
    expect(within(screen.getByTestId("format-catalogue-scroll")).getByTestId("format-catalogue-results")).toBeTruthy();
    // Défilement conservé avec un texte saisi (e-cat-defiler).
    expect(screen.getByTestId("format-catalogue-scroll").props.scrollEnabled ?? true).toBe(true);
    fireEvent.press(screen.getByTestId("format-catalogue-search-clear"));
    expect(screen.getByTestId("format-catalogue-search").props.value).toBe("");
    expect(screen.queryByTestId("format-catalogue-search-clear")).toBeNull();
  });

  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("MAJ 04/11 §6 sexies : Modifier le format — récapitulatif prérempli, « Enregistrer les modifications », Retour au questionnaire ; mise à jour en place", async () => {
    mockModel = "TABATA";
    // Séance avec un Circuit Tabata en alternance (créé par le parcours).
    const first = { current: createEmptyDraft() };
    const view = render(<Harness draftRef={first} />);
    await openedFormat();
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
    expect(screen.getByTestId("format-pause-0").props.value).toBe("15″"); // Spécification de Hermann du 08/11/2026 (B §1) : M′SS″ / S″.
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

    // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
    // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
    // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
    it.skip("questionnaire à récapitulatif : « Valider les paramètres » en bas (gris sans mouvement, actif ensuite), coche toujours grise ; récapitulatif sans bouton en bas", async () => {
      mockModel = "PROGRESSION";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
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
      // Recette du 16/11/2026 (constat b) : croix « Fermer ». [Flèche « Retour » — remplacée.]
      expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.closeAccessibilityLabel);
    });

    it("questionnaire sans récapitulatif (Tabata à un mouvement) : pas de bouton en bas ; coche grise sans mouvement, bleue ensuite", async () => {
      mockModel = "TABATA";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      expect(screen.queryByTestId("format-bottom-action")).toBeNull();
      expect(isBlue("format-save")).toBe(false);
      await pick("Squ", "mv-squats");
      expect(screen.queryByTestId("format-bottom-action")).toBeNull();
      expect(isBlue("format-save")).toBe(true);
    });

    // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
    // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
    // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
    it.skip("Superset (toujours un récapitulatif) : « Valider les paramètres » actif avec deux mouvements, coche grise au questionnaire", async () => {
      mockModel = "SUPERSET";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      await pick("Squ", "mv-squats");
      expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: true });
      await pick("Fen", "mv-fentes");
      expect(screen.getByTestId("format-validate").props.accessibilityState).toMatchObject({ disabled: false });
      expect(isBlue("format-save")).toBe(false);
    });

    // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
    // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
    // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
    it.skip("récapitulatif : la coche remplace « Enregistrer dans la séance » ; grise si une cellule requise est vide", async () => {
      mockModel = "AMRAP";
      const draftRef = { current: createEmptyDraft() };
      render(<Harness draftRef={draftRef} />);
      await openedFormat();
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

    // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
    // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
    // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
    it.skip("EMOM : récapitulatif incomplet ou incohérent (contrôle des fenêtres, même condition) — coche grise", async () => {
      mockModel = "EMOM";
      render(<Harness draftRef={{ current: createEmptyDraft() }} />);
      await openedFormat();
      await pick("Squ", "mv-squats");
      toSummary();
      expect(isBlue("format-save")).toBe(false);
      expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    });
  });


  // Complément du 5 novembre 2026 (Hermann), §19 : espacements du gabarit commun aux dix Formats.
  // [Remplacé le 15/11/2026 — décision de Hermann, registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » :
  // questionnaire, cartes de mouvement et tableau entre deux cadres supprimés ; couverture reprise dans
  // FormatModelScreen.tableauUnique.test.tsx. Test d’origine conservé, désactivé.]
  it.skip("complément du 05/11 (§19) : « Mouvements » descendue de 8 ; cartes espacées de 6 ; « Paramètres d’exécution » à 16 de la dernière carte", async () => {
    mockModel = "TABATA";
    render(<Harness draftRef={{ current: createEmptyDraft() }} />);
    await openedFormat();
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
    // 08/11/2026 (b-cat-fondu) : recherche en tête de la couche du catalogue, à la même place. [`top` absolu — remplacé.]
    expect(StyleSheet.flatten(screen.getByTestId("format-search-zone").props.style)).toMatchObject({ marginTop: 101 + 16 });
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
      await openedFormat();
      fireEvent.press(screen.getByTestId("screen-header-back"));
      await waitFor(() => expect(mockBack).toHaveBeenCalled());
      expect(mockDismiss).not.toHaveBeenCalled();
      expect(mockDismissTo).not.toHaveBeenCalled();
    } finally {
      mockStack.routes = saved;
    }
  });

});
