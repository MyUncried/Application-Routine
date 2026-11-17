import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Button as SwiftUIButton } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { Alert, Platform, StyleSheet } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  PersonalLibraryEditorScreen,
  PersonalLibraryScreen,
  PersonalLibraryShareScreen,
} from "@/features/catalogue/PersonalLibraryScreens";
import { ProfileLibrariesSection } from "@/features/catalogue/ProfileLibrariesSection";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Bibliothèques personnelles (12/11/2026, écrans Figma 12206:26111, 12206:26333, 12210:26150, 12213:26248, 12217:26131,
 * 12217:26236) sur vraies bases SQLite : Profil, création, nom déjà pris, Ma bibliothèque (membres seuls, menu natif),
 * modification, suppression sans perte de Mouvement, Partager. Rendu natif réel : recette iPhone.
 */

const NOW = "2026-11-12T10:00:00.000Z";
let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let mockRegistry: Promise<SqliteCatalogueRegistry>;
let sequence = 0;
let mockParams: Record<string, string> = {};
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react") as typeof import("react");
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, dismissTo: mockDismissTo }),
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});
jest.mock("@/features/catalogue/importedMovements", () => ({
  sharedCatalogueRegistry: () => mockRegistry,
  isImportedMovement: async () => false,
  importedMovementLabel: async () => null,
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
let mockUuid = 0;
jest.mock("@/shared/ui/ScreenShell", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    ScreenShell: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    FixedHeader: ({ title, trailing, onBack }: { title: string; trailing?: ReactNode; onBack?: () => void }) => (
      <View>
        <Pressable onPress={onBack} testID="header-back" />
        <Text testID="header-title">{title}</Text>
        {trailing}
      </View>
    ),
    ContextBand: ({ children, fadeToTransparent, color }: { children: ReactNode; fadeToTransparent?: boolean; color?: string }) => (
      <View testID="context-band" {...{ fadeToTransparent, color }}>
        {children}
      </View>
    ),
    HeaderSeparator: () => null,
    CONTEXT_BAND_FADE_HEIGHT: (jest.requireActual("@/shared/ui/ScreenShell") as typeof import("@/shared/ui/ScreenShell")).CONTEXT_BAND_FADE_HEIGHT,
  };
});

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});
const movements = () => new SqliteMovementRepository(main, () => `grp-${++sequence}`, () => NOW);

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(main);
  await movements().create(movement("planche", "Planche"));
  await movements().create(movement("pompes", "Pompes"));
  await movements().create(movement("fentes", "Fentes avant"));
  mockRegistry = SqliteCatalogueRegistry.open(registryDb, () => NOW);
  mockParams = {};
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  main.close();
  registryDb.close();
});

function renderWith(element: ReactElement) {
  const service = new ActivityDefinitionService(
    new SqliteCategoryRepository(main),
    new SqliteBodyZoneRepository(main),
    undefined,
    undefined,
    movements(),
  );
  return render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>{element}</ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

async function settle() {
  await act(async () => {
    for (let i = 0; i < 30; i++) await new Promise((resolve) => setImmediate(resolve));
  });
}
async function press(testID: string) {
  fireEvent.press(screen.getByTestId(testID));
  await settle();
}
const registry = () => mockRegistry;

describe("Profil — Mes bibliothèques", () => {
  it("« Créer une bibliothèque » ouvre l'écran de création ; les Bibliothèques de l'utilisateur suivent", async () => {
    await (await registry()).savePersonalLibrary({ libraryId: "l1", authorId: "a", title: "Gainage", movementIds: ["planche", "pompes"] });
    renderWith(<ProfileLibrariesSection />);
    await settle();
    await press("profile-libraries-create");
    expect(mockPush).toHaveBeenCalledWith("/library-edit");
    expect(screen.getByTestId("profile-libraries-mine-l1")).toHaveTextContent(/Gainage.*2 mouvements/);
    await press("profile-libraries-mine-l1");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/library-mine", params: { libraryId: "l1" } });
  });
});

describe("Créer une bibliothèque", () => {
  it("vide au départ ; list-plus montre le Catalogue ; Créer (N) enregistre dans l'ordre du Catalogue", async () => {
    renderWith(<PersonalLibraryEditorScreen />);
    await settle();
    expect(screen.getByTestId("header-title")).toHaveTextContent("Créer une bibliothèque");
    expect(screen.queryByTestId("movement-card-planche")).toBeNull();
    expect(screen.getByTestId("personal-library-select-all")).toBeDisabled();
    expect(screen.getByTestId("personal-library-save")).toBeDisabled();

    await press("personal-library-add-movements");
    expect(screen.getByTestId("personal-library-add-movements-icon")).toBeTruthy();
    await press("movement-card-pompes");
    await press("movement-card-planche");
    expect(StyleSheet.flatten(screen.getByTestId("movement-card-surface-planche").props.style)).toMatchObject({
      borderWidth: 1.5,
      borderColor: "#0508E5",
      backgroundColor: "#EAEAFF",
    });
    expect(screen.queryByTestId("movement-card-choice-planche-checked")).toBeNull();
    // Sans nom : « Créer (2) » reste inactif.
    expect(screen.getByText("Créer (2)")).toBeTruthy();
    expect(screen.getByTestId("personal-library-save")).toBeDisabled();

    // Ordre de présentation du Catalogue, pas celui des touchers (pompes puis planche).
    const order = screen.getAllByTestId(/^movement-card-(planche|pompes)$/).map((card) => String(card.props.testID).slice("movement-card-".length));
    fireEvent.changeText(screen.getByTestId("personal-library-name"), "  Gainage ");
    await settle();
    await press("personal-library-save");
    const [saved] = await (await registry()).personalLibraries();
    expect(saved!.title).toBe("Gainage");
    expect(saved!.movementIds).toEqual(order);
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/library-mine", params: { libraryId: saved!.libraryId } });
  });

  it("recette du 13/11 : zone de contexte du Catalogue (lilas, fondue vers la transparence) ; plus de trait bleu sous le nom", async () => {
    renderWith(<PersonalLibraryEditorScreen />);
    await settle();
    expect(screen.getByTestId("context-band").props).toMatchObject({ fadeToTransparent: true, color: "#EAEAFF" });
    fireEvent(screen.getByTestId("personal-library-name"), "focus");
    expect(screen.queryByTestId("personal-library-name-underline")).toBeNull();
  });

  it("« Tout sélectionner » coche les Mouvements affichés, puis devient « Tout désélectionner » (recette du 15/11)", async () => {
    renderWith(<PersonalLibraryEditorScreen />);
    await settle();
    await press("personal-library-add-movements");
    expect(screen.getByText("Tout sélectionner")).toBeTruthy();
    await press("personal-library-select-all");
    expect(screen.getByText("Créer (3)")).toBeTruthy();
    expect(screen.getByText("Tout désélectionner")).toBeTruthy();
    await press("personal-library-select-all");
    expect(screen.getByText("Créer")).toBeTruthy();
    expect(screen.getByText("Tout sélectionner")).toBeTruthy();
    await press("personal-library-select-all");
    await press("movement-card-fentes");
    await press("personal-library-add-movements");
    expect(screen.queryByTestId("movement-card-fentes")).toBeNull();
    expect(screen.getByTestId("movement-card-planche")).toBeTruthy();
  });

  it("refuse un nom déjà porté par une autre Bibliothèque (sans casse)", async () => {
    const reg = await registry();
    const authorId = await reg.localAuthorId(() => "auteur");
    await reg.savePersonalLibrary({ libraryId: "l1", authorId, title: "Gainage", movementIds: ["planche"] });
    renderWith(<PersonalLibraryEditorScreen />);
    await settle();
    await press("personal-library-add-movements");
    await press("movement-card-pompes");
    fireEvent.changeText(screen.getByTestId("personal-library-name"), "GAINAGE");
    await settle();
    await press("personal-library-save");
    expect(Alert.alert).toHaveBeenCalledWith("Nom déjà utilisé", "Vous avez déjà une bibliothèque nommée « GAINAGE ».");
    expect(await reg.personalLibraries()).toHaveLength(1);
  });
});

describe("Ma bibliothèque, Modifier, Supprimer", () => {
  beforeEach(async () => {
    const reg = await registry();
    const authorId = await reg.localAuthorId(() => "auteur");
    await reg.savePersonalLibrary({ libraryId: "l1", authorId, title: "Gainage", movementIds: ["planche", "pompes"] });
    mockParams = { libraryId: "l1" };
  });

  it("recette du 15/11 : membres seuls ; list-plus montre tout le Catalogue sur place ; cocher enregistre aussitôt", async () => {
    renderWith(<PersonalLibraryScreen />);
    await settle();
    expect(screen.getByTestId("header-title")).toHaveTextContent("Ma bibliothèque");
    expect(screen.getByTestId("personal-library-title").props.value).toBe("Gainage");
    // Recette du 13/11 : même zone de contexte que le Catalogue, liste remontée sous sa part fondue.
    expect(screen.getByTestId("context-band").props).toMatchObject({ fadeToTransparent: true, color: "#EAEAFF" });
    expect(StyleSheet.flatten(screen.getByTestId("personal-library-body").props.style).marginTop).toBeLessThan(0);
    expect(screen.getByTestId("movement-card-planche")).toBeTruthy();
    expect(screen.queryByTestId("movement-card-fentes")).toBeNull();
    await press("movement-card-planche");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement", params: { movementId: "planche" } });
    await press("personal-library-edit");
    // Même écran, même titre : tout le Catalogue, membres sélectionnés.
    expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/library-edit" }));
    expect(screen.getByTestId("header-title")).toHaveTextContent("Ma bibliothèque");
    expect(screen.getByTestId("movement-card-fentes")).toBeTruthy();
    await press("movement-card-fentes");
    await settle();
    expect((await (await registry()).personalLibraries())[0]!.movementIds).toEqual(expect.arrayContaining(["fentes"]));
  });

  it("recette du 15/11 : le nom se modifie sur place et s'enregistre à la fin de la saisie", async () => {
    renderWith(<PersonalLibraryScreen />);
    await settle();
    const name = screen.getByTestId("personal-library-title");
    await act(async () => {
      fireEvent.changeText(name, "Gainage du matin");
    });
    await act(async () => {
      fireEvent(name, "endEditing");
    });
    await settle();
    expect((await (await registry()).personalLibraries())[0]!.title).toBe("Gainage du matin");
  });

  it("menu natif : Partager, Exporter (à venir), Supprimer (destructif) ; supprimer garde les Mouvements", async () => {
    const restore = jest.replaceProperty(Platform, "OS", "ios");
    try {
      renderWith(<PersonalLibraryScreen />);
      await settle();
      const buttons = screen.UNSAFE_getAllByType(SwiftUIButton);
      expect(buttons.map((button) => button.props.label)).toEqual([
        "Partager la bibliothèque",
        "Exporter un fichier",
        "Supprimer",
      ]);
      expect(buttons[2]!.props.role).toBe("destructive");
      act(() => buttons[0]!.props.onPress());
      expect(mockPush).toHaveBeenCalledWith({ pathname: "/library-share", params: { libraryId: "l1" } });

      act(() => buttons[2]!.props.onPress());
      const [title, message, actions] = (Alert.alert as jest.Mock).mock.calls[0] as [string, string, { text: string; onPress?: () => void }[]];
      expect(title).toBe("Supprimer « Gainage » ?");
      expect(message).toBe("Les mouvements de cette bibliothèque restent dans votre Catalogue.");
      actions.find((action) => action.text === "Supprimer")!.onPress!();
      await settle();
      expect(await (await registry()).personalLibraries()).toEqual([]);
      expect((await main.getAllAsync<{ id: string }>("SELECT id FROM movements ORDER BY id")).map((row) => row.id)).toEqual([
        "fentes", "planche", "pompes",
      ]);
      expect(mockDismissTo).toHaveBeenCalledWith("/profile-edit");
    } finally {
      restore.restore();
    }
  });

  it("Modifier : membres présélectionnés, nom modifiable, Valider enregistre", async () => {
    renderWith(<PersonalLibraryEditorScreen />);
    await settle();
    expect(screen.getByTestId("header-title")).toHaveTextContent("Modifier");
    expect(screen.getByTestId("personal-library-name").props.value).toBe("Gainage");
    expect(screen.getByTestId("movement-card-fentes")).toBeTruthy();
    expect(screen.getByText("Valider")).toBeTruthy();
    await press("movement-card-pompes");
    await press("movement-card-fentes");
    fireEvent.changeText(screen.getByTestId("personal-library-name"), "Gainage doux");
    await settle();
    await press("personal-library-save");
    const [saved] = await (await registry()).personalLibraries();
    expect(saved!.title).toBe("Gainage doux");
    expect([...saved!.movementIds].sort()).toEqual(["fentes", "planche"]);
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("Partager", () => {
  it("quatre destinations ; celles du compte KODJO sont grisées", async () => {
    renderWith(<PersonalLibraryShareScreen />);
    await settle();
    expect(screen.getByTestId("library-share-pc")).toHaveTextContent(/Vers mon PC/);
    for (const id of ["library-share-users", "library-share-spaces", "library-share-public"]) {
      expect(screen.getByTestId(id)).toHaveTextContent(/Disponible avec un compte KODJO\./);
      expect(screen.getByTestId(id)).toBeDisabled();
    }
  });
});
