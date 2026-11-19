import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueGrid } from "@/features/activities/MovementCatalogueGrid";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { EMPTY_MOVEMENT_FILTERS } from "@/features/activities/movementCatalogueView";

/**
 * Vignette du Catalogue des Mouvements (recette iPhone du 19/11/2026, Hermann : « Je vois des photos quand j'ouvre la
 * fiche, mais pas la miniature ») : un Mouvement installé sans média local montre la photo de sa fiche de catalogue,
 * en liste et en grille ; un média local reste prioritaire (même règle que la fiche ouverte). Le rendu se juge sur iPhone.
 */

jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const mockIllustrations = jest.fn<() => Promise<ReadonlyMap<string, string>>>();
jest.mock("@/features/catalogue/importedMovements", () => ({
  catalogueIllustrationsByMovement: () => mockIllustrations(),
  importedMovementInfo: async () => null,
  isImportedMovement: async () => false,
}));

const PHOTO = "data:image/webp;base64,UklGRg==";

const movement = (id: string, name: string, media: Movement["media"] = []): Movement => ({
  id,
  name,
  description: "Première étape",
  media,
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});

const entry = (value: Movement): MovementCatalogueEntry => ({ movement: value, level: null, exerciseCount: 0, archived: false });

const ENTRIES: readonly MovementCatalogueEntry[] = [
  entry(movement("chat", "Marjaryasana (chat)")),
  entry(movement("local", "Mouvement avec photo locale", [
    { assetId: "p1", asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "2026-11-19T00:00:00.000Z", kind: "PHOTO" } },
  ])),
  entry(movement("perso", "Mouvement personnel")),
];

const service = {
  movementCatalogue: { listEntries: async () => ENTRIES },
  resolveMediaUri: (uri: string) => "file:///docs/" + uri,
} as unknown as ActivityDefinitionService;

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  mockIllustrations.mockReset();
  mockIllustrations.mockResolvedValue(new Map([["chat", PHOTO], ["local", "data:image/webp;base64,AAAA"]]));
});

afterEach(() => {
  jest.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

const sourceOf = (testID: string) => {
  const source = screen.getByTestId(testID).props.source as { uri?: string } | readonly { uri?: string }[];
  return Array.isArray(source) ? source[0]?.uri : (source as { uri?: string }).uri;
};

describe("Vignette du Catalogue des Mouvements — photo de la fiche de catalogue", () => {
  it("liste : photo de catalogue sans média local ; média local prioritaire ; Mouvement personnel sans photo", async () => {
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <MovementCatalogueList reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={jest.fn()} onCreateVariant={jest.fn()} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await settle();
    expect(sourceOf("movement-card-image-chat")).toBe(PHOTO);
    expect(sourceOf("movement-card-image-local")).toBe("file:///docs/kodjo-media/p1.jpg");
    expect(screen.getByTestId("movement-card-empty-perso")).toBeTruthy();
  });

  it("grille : même règle", async () => {
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <MovementCatalogueGrid reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={jest.fn()} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await settle();
    expect(sourceOf("movement-grid-image-chat")).toBe(PHOTO);
    expect(sourceOf("movement-grid-image-local")).toBe("file:///docs/kodjo-media/p1.jpg");
    expect(screen.getByTestId("movement-grid-empty-perso")).toBeTruthy();
  });

  it("registre indisponible : le Catalogue se charge, sans photo de catalogue", async () => {
    mockIllustrations.mockRejectedValue(new Error("registre fermé"));
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <MovementCatalogueList reloadToken={0} query="" filters={EMPTY_MOVEMENT_FILTERS} onOpenMovement={jest.fn()} onCreateVariant={jest.fn()} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    await settle();
    expect(screen.getByTestId("movement-card-empty-chat")).toBeTruthy();
    expect(sourceOf("movement-card-image-local")).toBe("file:///docs/kodjo-media/p1.jpg");
  });
});
