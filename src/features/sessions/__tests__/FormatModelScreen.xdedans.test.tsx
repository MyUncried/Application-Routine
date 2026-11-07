import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect, useState } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { releaseFilterSheet, useFilterSheetRequest, type FilterSheetRequest } from "@/features/activities/filterSheetRelay";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { sheetDetentForTop } from "@/shared/ui/nativeSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette du 06/11/2026 (x-dedans, KO). Test : « Dans la feuille : clavier et sa barre (tableaux), suggestions de saisie, mode
 * catalogue, filtre arrêté sous la zone de contexte, fiche d'un mouvement ouverte par-dessus. » Hermann, mot pour mot :
 * « Problème le filtre est arrêté au milieu de la zone de recherche. Il doit s'arrêter » ; « Corriger - Ouvrir toutes les
 * modales de filtre comme une modale iOS, pareil pour les modales de catégorie, d'étiquette et de zone corporelle. »
 * Précision validée : « L'arrêter en fait sous le bouton Annuler de la fenêtre du questionnaire. »
 *
 * Jest ne joue pas la présentation native : il vérifie la route (feuille native `catalogue-filters`), la demande transmise
 * (haut de la feuille sous la croix : y = 95 + 10 + (40 + 38) / 2 = 144) et l'application des filtres choisis.
 */

const mockPush = jest.fn();
jest.mock("expo-crypto", () => ({ randomUUID: () => "uuid" }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({ getState: () => ({ index: 1, routes: [{ name: "(creation)" }, { name: "format-questionnaire", params: { model: "TABATA" } }] }) }),
    useLocalSearchParams: () => ({ model: "TABATA" }),
    useFocusEffect: () => undefined,
  };
});

const SQUATS: Movement = {
  id: "mv-squats",
  name: "Squats sautés",
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
};

const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [{ movement: SQUATS, level: null }],
  listCategories: async () => [],
  listBodyZones: async () => [],
} as never;

const relay: { request: FilterSheetRequest | null } = { request: null };
function RelayProbe() {
  const request = useFilterSheetRequest();
  useEffect(() => {
    relay.request = request;
  });
  return null;
}

function Harness() {
  const [draft] = useState<SessionDraft>(createEmptyDraft());
  const value = { draft, updateDraft: jest.fn(), suggestDraftName: jest.fn(), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage="questionnaire" />
            <RelayProbe />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

describe("x-dedans — Filtrer du mode catalogue d'un Format : feuille native arrêtée sous la croix du questionnaire", () => {
  beforeEach(() => {
    mockPush.mockReset();
    releaseFilterSheet();
  });

  it("« Filtrer » ouvre la feuille native `catalogue-filters` (aucune feuille dessinée), haut à y = 144 ; ✓ applique les filtres au mode catalogue", async () => {
    render(<Harness />);
    await screen.findByTestId("format-title");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.press(await screen.findByTestId("format-catalogue-filter"));

    expect(mockPush).toHaveBeenCalledWith("/catalogue-filters");
    // [Feuille dessinée `docked` (recette du 04/11, f4-catalogue) — remplacée :] aucune feuille de filtres dans la fenêtre.
    expect(screen.queryByTestId("movement-filter-panel")).toBeNull();
    expect(screen.queryByTestId("movement-filter-sheet")).toBeNull();
    const request = relay.request;
    expect(request?.kind).toBe("movements");
    // Croix du questionnaire : haut de la fenêtre 95, en-tête à 10, hauteur 40, cercle de 38 centré → bas à 144.
    expect(request?.sheetTop).toBe(144);

    // ✓ de la feuille : les filtres choisis s'appliquent au mode catalogue (résumé de la commande).
    act(() => {
      if (request?.kind === "movements") request.onApply({ ...request.filters, categoryIds: new Set(["cardio"]) }, ["Cardio"]);
    });
    expect(screen.getByText("Cardio")).toBeTruthy();
  });
});

describe("sheetDetentForTop — détent d'une feuille dont le haut est posé à une ordonnée donnée", () => {
  it("iPhone 874 pt, zone sûre 62 : haut à 144 → (874 − 144) / (874 − 62 − 10) ; même calibrage que le questionnaire (y = 95)", () => {
    expect(sheetDetentForTop(874, 144, 62)).toBe(Math.round(((874 - 144) / 802) * 1000) / 1000);
    expect(sheetDetentForTop(874, 95, 62)).toBe(Math.round(((874 - 95) / 802) * 1000) / 1000);
    // Bornes : jamais au-delà de la grande hauteur.
    expect(sheetDetentForTop(874, 0, 62)).toBe(1);
  });
});
