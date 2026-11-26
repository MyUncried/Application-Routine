import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useState } from "react";
import { Alert, Dimensions, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { FormatModelKey } from "@/domain/sessions/formatModels";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import type { MovementCatalogueItem } from "@/features/activities/movementCatalogueView";
import { withoutPinned } from "@/features/sessions/formatCatalogueSelection";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen, MAX_FORMAT_MOVEMENTS, PINNED_ZONE_MAX_RATIO } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-572 point 1 (Hermann, 25/11/2026 ; Formats § 9.9) — choix des mouvements d'un format :
 * - « + Ajouter » devient « + Modifier » dès qu'un mouvement est choisi ; 5 mouvements au plus par format (6e sélection refusée, message) ;
 * - catalogue en modification : sélectionnés figés en haut, en état sélectionné, zone plafonnée à 40 % de la hauteur avec défilement
 *   interne ; la liste dessous ne les montre plus ; désélectionner une carte figée la libère.
 * Contrôle de structure seulement : le rendu (recouvrement, marge) se vérifie sur iPhone.
 */

let mockModel = "TABATA";
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
const MOVES = [
  movement("mv-a", "Burpees"),
  movement("mv-b", "Crunchs"),
  movement("mv-c", "Dips"),
  movement("mv-d", "Fentes avant"),
  movement("mv-e", "Gainage"),
  movement("mv-f", "Squats sautés"),
];
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => MOVES.map((item) => ({ movement: item, level: null })),
} as never;
const t = strings.screens.formatModel;

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

let alert: ReturnType<typeof jest.spyOn>;
beforeEach(() => {
  alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});
afterEach(() => {
  alert.mockRestore();
});

/** Première ouverture : le choix des mouvements s'affiche d'abord (D-603) ; il est quitté sans sélection. */
async function open(model: FormatModelKey) {
  mockModel = model;
  render(<Harness />);
  await screen.findByTestId("format-title");
  await screen.findByTestId(`format-catalogue-card-${MOVES[0]!.id}`);
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
}

const card = (id: string) => screen.getByTestId(`format-catalogue-card-${id}`);
const pinned = (id: string) => screen.getByTestId(`format-catalogue-pinned-${id}`);
const isSelected = (id: string) => (screen.getByTestId(id).props.accessibilityState as { selected?: boolean }).selected === true;
const rows = () => screen.queryAllByTestId(/^format-movement-\d+$/).length;

async function validateCatalogue() {
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
}

/** Ouvre le catalogue de la section par son lien et sélectionne les mouvements donnés dans la liste. */
async function choose(section: string, ids: readonly string[]) {
  fireEvent.press(screen.getByTestId(`${section}-link`));
  await screen.findByTestId("format-catalogue-results");
  for (const id of ids) fireEvent.press(card(id));
}

describe("D-572 — règles pures", () => {
  it("withoutPinned : retire les cartes figées de la liste ; pile réduite à un membre → carte seule ; pile vidée → retirée", () => {
    const entry = (item: Movement): MovementCatalogueEntry => ({ movement: item, level: null, exerciseCount: 0, archived: false });
    const items: MovementCatalogueItem[] = [
      { kind: "SINGLE", key: "a", entry: entry(MOVES[0]!) },
      { kind: "PILE", key: "p1", members: [entry(MOVES[1]!), entry(MOVES[2]!)] },
      { kind: "PILE", key: "p2", members: [entry(MOVES[3]!), entry(MOVES[4]!)] },
      { kind: "PILE", key: "p3", members: [entry(MOVES[5]!), entry(MOVES[0]!)] },
    ];
    expect(withoutPinned(items, new Set())).toBe(items);
    const listed = withoutPinned(items, new Set(["mv-a", "mv-b", "mv-d", "mv-e"]));
    expect(listed.map((item) => [item.kind, item.key])).toEqual([
      ["SINGLE", "p1"],
      ["SINGLE", "p3"],
    ]);
    expect(MAX_FORMAT_MOVEMENTS).toBe(5);
    expect(PINNED_ZONE_MAX_RATIO).toBe(0.4);
  });
});

describe("D-572 — « + Ajouter » / « + Modifier » et plafond de cinq mouvements", () => {
  it("le lien passe de « + Ajouter » à « + Modifier » dès le premier mouvement choisi", async () => {
    await open("TABATA");
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.add);
    await choose("format-movements", ["mv-a"]);
    await validateCatalogue();
    expect(rows()).toBe(1);
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.editMovements);
  });

  it.each([1, 2, 3, 4, 5])("%i sélection(s) acceptée(s), ajoutées au format", async (count) => {
    await open("STRENGTH");
    await choose("format-movements", MOVES.slice(0, count).map((item) => item.id));
    for (const item of MOVES.slice(0, count)) expect(isSelected(`format-catalogue-card-${item.id}`)).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    await validateCatalogue();
    expect(rows()).toBe(count);
  });

  it("la 6e sélection est refusée (message « J'ai compris », catalogue et sélection en place) ; refusée aussi en modification", async () => {
    await open("SUPERSET");
    await choose("format-movements", MOVES.slice(0, 5).map((item) => item.id));
    fireEvent.press(card("mv-f"));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(t.formatLimitTitle);
    expect(alert.mock.calls[0]?.[1]).toBe(t.formatLimitMessage);
    expect(isSelected("format-catalogue-card-mv-f")).toBe(false);
    // « J'ai compris » (constat g du 16/11/2026, conservé) : le catalogue et la sélection restent en place.
    const buttons = alert.mock.calls[0]?.[2] as { text?: string; onPress?: () => void }[];
    expect(buttons[0]?.text).toBe(t.supersetLimitAcknowledge);
    act(() => buttons[0]?.onPress?.());
    expect(screen.getByTestId("format-catalogue-results")).toBeTruthy();
    expect(isSelected("format-catalogue-card-mv-e")).toBe(true);
    // Superset : cinq mouvements admis (D-572 : de deux à cinq). [Plafond de deux — remplacé.]
    await validateCatalogue();
    expect(rows()).toBe(5);
    // Modification : les cinq sont figés ; une sixième carte de la liste est refusée.
    fireEvent.press(screen.getByTestId("format-movements-link"));
    await screen.findByTestId("format-catalogue-pinned");
    fireEvent.press(card("mv-f"));
    expect(alert).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("format-catalogue-pinned-mv-f")).toBeNull();
  });

  it("AMRAP : le plafond compte toutes les sections (buy-in compris)", async () => {
    await open("AMRAP");
    await choose("format-buy-in", ["mv-a", "mv-b"]);
    await validateCatalogue();
    await choose("format-loop", ["mv-c", "mv-d", "mv-e"]);
    expect(alert).not.toHaveBeenCalled();
    fireEvent.press(card("mv-f"));
    expect(alert).toHaveBeenCalledTimes(1);
  });
});

describe("D-572 — catalogue en modification : zone figée", () => {
  it("sélectionnés figés en haut, en état sélectionné, hors de la liste ; zone plafonnée à 40 % avec défilement interne", async () => {
    await open("TABATA");
    await choose("format-movements", ["mv-b", "mv-d"]);
    await validateCatalogue();
    // Hors modification (« + Ajouter ») : aucune zone figée.
    expect(screen.queryByTestId("format-catalogue-pinned")).toBeNull();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    const zone = await screen.findByTestId("format-catalogue-pinned");
    // Zone placée entre la recherche et la liste, plafonnée à 40 % de la hauteur, contenu dans son propre défilement.
    expect(within(screen.getByTestId("format-catalogue-layer")).getByTestId("format-catalogue-pinned")).toBe(zone);
    expect(StyleSheet.flatten(zone.props.style).maxHeight).toBeCloseTo(PINNED_ZONE_MAX_RATIO * Dimensions.get("window").height, 3);
    const scroll = within(zone).getByTestId("format-catalogue-pinned-scroll");
    expect(within(scroll).getAllByTestId(/^format-catalogue-pinned-mv-[a-f]$/).map((node) => node.props.testID)).toEqual([
      "format-catalogue-pinned-mv-b",
      "format-catalogue-pinned-mv-d",
    ]);
    expect(isSelected("format-catalogue-pinned-mv-b")).toBe(true);
    expect(isSelected("format-catalogue-pinned-mv-d")).toBe(true);
    // Aucune carte de la liste entre les cartes figées : la liste ne contient plus les sélectionnés.
    const list = screen.getByTestId("format-catalogue-results");
    expect(within(list).queryByTestId("format-catalogue-card-mv-b")).toBeNull();
    expect(within(list).queryByTestId("format-catalogue-card-mv-d")).toBeNull();
    expect(within(list).getByTestId("format-catalogue-card-mv-a")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-add")).toHaveTextContent(t.applyPicked);
  });

  it("désélectionner une carte figée la libère (retour dans la liste, non sélectionnée) ; une carte choisie dans la liste se fige ; validation", async () => {
    await open("TABATA");
    await choose("format-movements", ["mv-b", "mv-d"]);
    await validateCatalogue();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    await screen.findByTestId("format-catalogue-pinned");
    fireEvent.press(pinned("mv-b"));
    expect(screen.queryByTestId("format-catalogue-pinned-mv-b")).toBeNull();
    expect(isSelected("format-catalogue-card-mv-b")).toBe(false);
    fireEvent.press(card("mv-f"));
    expect(screen.queryByTestId("format-catalogue-card-mv-f")).toBeNull();
    expect(isSelected("format-catalogue-pinned-mv-f")).toBe(true);
    await validateCatalogue();
    expect(rows()).toBe(2);
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent("Fentes avant");
    expect(screen.getByTestId("format-line-1-name-title")).toHaveTextContent("Squats sautés");
  });

  it("dernière carte figée désélectionnée : la zone disparaît", async () => {
    await open("TABATA");
    await choose("format-movements", ["mv-c"]);
    await validateCatalogue();
    fireEvent.press(screen.getByTestId("format-movements-link"));
    await screen.findByTestId("format-catalogue-pinned");
    fireEvent.press(pinned("mv-c"));
    expect(screen.queryByTestId("format-catalogue-pinned")).toBeNull();
    expect(isSelected("format-catalogue-card-mv-c")).toBe(false);
  });

  it("AMRAP : modifier le buy-in ne retire pas les mouvements de la boucle", async () => {
    await open("AMRAP");
    await choose("format-buy-in", ["mv-a"]);
    await validateCatalogue();
    await choose("format-loop", ["mv-c", "mv-d"]);
    await validateCatalogue();
    expect(rows()).toBe(3);
    expect(screen.getByTestId("format-buy-in-link")).toHaveTextContent(t.editMovements);
    fireEvent.press(screen.getByTestId("format-buy-in-link"));
    await screen.findByTestId("format-catalogue-pinned");
    expect(screen.queryByTestId("format-catalogue-pinned-mv-c")).toBeNull();
    fireEvent.press(card("mv-b"));
    fireEvent.press(pinned("mv-a"));
    await validateCatalogue();
    expect(rows()).toBe(3);
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent("Crunchs");
    expect(screen.getByTestId("format-line-1-name-title")).toHaveTextContent("Dips");
    expect(screen.getByTestId("format-line-2-name-title")).toHaveTextContent("Fentes avant");
  });
});
