import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { AccessibilityInfo, Image as RNImage, StyleSheet } from "react-native";
import * as Reanimated from "react-native-reanimated";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 07/11/2026 (Hermann) — mode catalogue d'un Format (« + Ajouter ») :
 * A) carte du dessus d'une pile repliée : déplie sans sélectionner ; carte d'une pile dépliée : sélection ;
 * B) Niveau en noir, sur la ligne de base du nom ; H) carte sans famille au retrait des cartes d'une pile ;
 * D) pastille des zones préchargée, liste en fondu, glissement des cartes au repli / dépli ;
 * E) fermeture en fondu lent (« Fermer sans sélectionner », « Ajouter X mouvement », « Revenir aux paramètres »).
 * Aucun de ces tests ne valide le rendu visuel (couleurs, mouvements) : ils vérifient les règles et les mécanismes demandés.
 */

jest.mock("expo-crypto", () => ({ randomUUID: () => "uuid" }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({ getState: () => ({ index: 0, routes: [{ name: "format-questionnaire" }] }) }),
    useLocalSearchParams: () => ({ model: "TABATA" }),
    useFocusEffect: () => undefined,
  };
});

const movement = (id: string, name: string, groupId: string | null): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: groupId === null ? null : { groupId, sortKey: 0 },
});

const SQUATS_1 = movement("sq-1", "Squats assistés", "grp-squats");
const SQUATS_2 = movement("sq-2", "Squats", "grp-squats");
const SQUATS_3 = movement("sq-3", "Squats sautés", "grp-squats");
const FENTES = movement("fentes", "Fentes avant", null);

const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS_1, level: { rank: 1, total: 3 } },
    { movement: SQUATS_2, level: { rank: 2, total: 3 } },
    { movement: SQUATS_3, level: { rank: 3, total: 3 } },
    { movement: FENTES, level: null },
  ],
} as never;

function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft());
  const value = {
    draft,
    updateDraft: (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch })),
    suggestDraftName: jest.fn(),
    resetDraft: jest.fn(),
    hydrateFromSession: jest.fn(),
  } as unknown as SessionDraftContextValue;
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

async function openCatalogue() {
  render(<Harness />);
  await screen.findByTestId("format-title");
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-movements-link"));
  });
  await screen.findByTestId("format-catalogue-card-fentes");
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);
const bottomLabel = () => within(screen.getByTestId("format-bottom-action"));

describe("Recette iPhone du 07/11/2026 — mode catalogue d'un Format", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("A : la carte du dessus d'une pile repliée la déplie sans la sélectionner ; une carte de la pile dépliée se sélectionne", async () => {
    await openCatalogue();
    // Pile dépliée à l'ouverture : toucher le filet la replie.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-rail"));
    });
    expect(screen.getByTestId("format-family-grp-squats-collapsed")).toBeTruthy();
    expect(screen.queryByTestId("format-catalogue-card-sq-2")).toBeNull();
    // Carte du dessus de la pile repliée : la pile se déplie, aucune sélection.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-card-sq-3"));
    });
    expect(screen.queryByTestId("format-family-grp-squats-collapsed")).toBeNull();
    expect(screen.getByTestId("format-family-grp-squats")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-card-sq-3").props.accessibilityState).toMatchObject({ selected: false });
    expect(bottomLabel().getByText("Fermer sans sélectionner")).toBeTruthy();
    // Carte de la pile dépliée (la carte du dessus comprise) : sélection.
    fireEvent.press(screen.getByTestId("format-catalogue-card-sq-3"));
    expect(screen.getByTestId("format-catalogue-card-sq-3").props.accessibilityState).toMatchObject({ selected: true });
    expect(bottomLabel().getByText("Ajouter 1 mouvement")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-catalogue-card-sq-1"));
    expect(bottomLabel().getByText("Ajouter 2 mouvements")).toBeTruthy();
  });

  it("B : Niveau en noir (couleur du nom), aligné sur la ligne de base du nom — dans le mode catalogue seulement", async () => {
    await openCatalogue();
    expect(flat("format-catalogue-card-sq-3-level").color).toBe("#14171C");
    expect(flat("format-catalogue-card-sq-3-first-line").alignItems).toBe("baseline");
  });

  it("H : une carte sans famille prend le retrait de 8 des cartes d'une pile", async () => {
    await openCatalogue();
    const family = flat("format-family-grp-squats");
    expect(flat("format-catalogue-item-fentes").paddingLeft).toBe(family.paddingLeft);
    expect(family.paddingLeft).toBe(8);
  });

  it("D : pastille des zones préchargée ; repli / dépli au filet — les cartes glissent depuis la carte du dessus, les suivantes changent de place", async () => {
    const prefetch = jest.spyOn(Image, "prefetch").mockResolvedValue(true as never);
    // Sous Jest, les assets n'ont pas d'adresse (`testUri`) : adresse simulée, comme celle servie par Metro ou le paquet.
    jest
      .spyOn(RNImage, "resolveAssetSource")
      .mockImplementation((source) => ({ uri: `asset:/${(source as unknown as { testUri: string }).testUri}`, width: 13, height: 13, scale: 1 }));
    await openCatalogue();
    expect(prefetch).toHaveBeenCalledWith([expect.stringContaining("icon-pastille-zone-corporelle")], "memory-disk");
    // Au repos : ni glissement ni transition de place.
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.entering).toBeUndefined();
    expect(screen.getByTestId("format-catalogue-item-fentes").props.layout).toBeUndefined();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-rail"));
    });
    expect(screen.getByTestId("format-catalogue-item-fentes").props.layout).toBeDefined();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-expand"));
    });
    expect(screen.getByTestId("format-family-grp-squats-member-sq-3").props.entering).toBeUndefined();
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.entering).toBeDefined();
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.exiting).toBeDefined();
  });

  it("E : « Fermer sans sélectionner », « Ajouter X mouvement » et « Revenir aux paramètres » ferment en fondu de 450 ms, puis les paramètres reviennent", async () => {
    const timing = jest.spyOn(Reanimated, "withTiming");
    await openCatalogue();
    const fadesOut = () => timing.mock.calls.filter(([toValue, config]) => toValue === 0 && (config as { duration?: number })?.duration === 450);

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fadesOut()).toHaveLength(1);
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    fireEvent.press(await screen.findByTestId("format-catalogue-card-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fadesOut()).toHaveLength(2);
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    await screen.findByTestId("format-catalogue-card-fentes");
    await act(async () => {
      // En mode catalogue, le lien de la section est « Revenir aux paramètres ».
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    expect(fadesOut()).toHaveLength(3);
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
  });

  it("E : sous « Réduire les animations », la fermeture est immédiate, sans fondu", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const timing = jest.spyOn(Reanimated, "withTiming");
    await openCatalogue();
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(timing.mock.calls.some(([toValue]) => toValue === 0)).toBe(false);
  });
});
