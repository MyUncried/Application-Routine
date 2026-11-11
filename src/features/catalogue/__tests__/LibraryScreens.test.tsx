import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";

import type { CatalogueLibrary, CatalogueSheet, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { installPilotMovements, preparePilotMovementImport } from "@/features/activities/pilotMovementImport";
import { AdminClient, type FetchLike } from "@/features/catalogue/adminClient";
import { CatalogueLoadService } from "@/features/catalogue/CatalogueLoadService";
import { LibraryService } from "@/features/catalogue/LibraryService";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import {
  LibraryAddScreen,
  LibraryAvailableScreen,
  LibraryConnectScreen,
  LibraryInvalidScreen,
  LibraryPreviewScreen,
  LibraryResumeScreen,
  LibrarySendScreen,
} from "@/features/catalogue/LibraryScreens";
import { librarySession } from "@/features/catalogue/librarySession";
import { ProfileLibrariesSection } from "@/features/catalogue/ProfileLibrariesSection";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * A1 — écrans Profil → Bibliothèques (Figma page 510:101) sur vraies bases SQLite (principale +
 * registre v2) : ajout par fichier, fichier invalide refusé en entier, aperçu et installation avec
 * rattachement des 60 sans doublon, mise à jour (Reporter), connexion à l'administration (code
 * refusé, PC introuvable, connecté), reprise après interruption. Rendu natif réel : recette iPhone.
 */

const NOW = "2026-11-11T09:00:00.000Z";
const PILOT = "kodjo.pilote-60";
const pilot = JSON.parse(
  readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8"),
) as MovementCatalogueFile;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
  isImportedMovement: async (id: string) => (await mockRegistry).isInstalledMovement(id),
  importedMovementLabel: async () => null,
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` }));
jest.mock("expo-device", () => ({ deviceName: "iPhone de test" }));
jest.mock("@/shared/ui/ScreenShell", () => {
  const { Text, View } = jest.requireActual("react-native") as typeof import("react-native");
  return {
    ScreenShell: ({ children }: { children: ReactElement }) => <View>{children}</View>,
    FixedHeader: ({ title }: { title: string }) => <Text testID="header-title">{title}</Text>,
    HeaderSeparator: () => null,
  };
});

const movementRepository = () => new SqliteMovementRepository(main, () => `grp-${++sequence}`, () => NOW);

function renderWith(element: ReactElement) {
  const service = new ActivityDefinitionService(
    new SqliteCategoryRepository(main),
    new SqliteBodyZoneRepository(main),
    undefined,
    undefined,
    movementRepository(),
  );
  return render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>{element}</ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

async function settle() {
  await act(async () => { for (let i = 0; i < 30; i++) await new Promise((resolve) => setImmediate(resolve)); });
}
async function press(testID: string) {
  fireEvent.press(screen.getByTestId(testID));
  await settle();
}
const movementCount = async () => (await main.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM movements"))!.n;

async function installPilot60() {
  await installPilotMovements(new MovementCatalogueService(movementRepository()), preparePilotMovementImport({
    schemaVersion: "0.1.0", kind: "KODJO_ADMIN_DRAFTS", publicationAllowed: false, movementEdits: {},
    referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
    glossary: [],
  }));
}

/** Révision 2 : fiche 0 révisée. */
function revisedPilot(): MovementCatalogueFile {
  const file = clone(pilot) as unknown as { sheets: Record<string, any>[]; libraries: CatalogueLibrary[] };
  const sheet = file.sheets[0]!;
  sheet.content.steps = [...sheet.content.steps, "Revenir lentement"];
  sheet.revision = "2";
  sheet.history.push({ revision: "2", date: "2026-11-11", author: null, summary: "Étape ajoutée" });
  return file as unknown as MovementCatalogueFile;
}

/** Administration simulée : ping, appairage (code 482913), liste et fichier. */
function fakeAdmin(file: MovementCatalogueFile, options: { reachable?: boolean; mediaWithheld?: boolean } = {}) {
  const fetchImpl: FetchLike = async (url, init) => {
    const reply = (status: number, body: unknown) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
    if (options.reachable === false) throw new Error("injoignable");
    const path = new URL(url).pathname;
    if (path === "/phone/v1/ping") return url.includes("192.168.1.20") ? reply(200, { ok: true, name: "PC-Hermann" }) : reply(404, {});
    if (path === "/phone/v1/pair") {
      const body = JSON.parse(init!.body!) as { code: string };
      return body.code === "482913" ? reply(200, { token: "t".repeat(43), expiresAt: "2026-11-11T21:00:00Z", name: "PC-Hermann" }) : reply(401, {});
    }
    if (init?.headers?.Authorization !== "Bearer " + "t".repeat(43)) return reply(401, {});
    if (path === "/phone/v1/libraries") {
      return reply(200, { libraries: file.libraries.map((library) => ({
        catalogueId: file.catalogue.id, libraryId: library.libraryId, title: library.title,
        description: library.description, revision: library.revision, memberCount: library.members.length,
      })) });
    }
    if (path === "/phone/v1/catalogues/" + encodeURIComponent(file.catalogue.id)) {
      return options.mediaWithheld ? reply(409, { error: "MEDIA_RIGHTS_UNCONFIRMED", sheets: ["X"] }) : reply(200, file);
    }
    return reply(404, {});
  };
  return new AdminClient({ fetch: fetchImpl, localAddress: async () => "192.168.1.10" });
}

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  mockRegistry = SqliteCatalogueRegistry.open(registryDb, () => NOW);
  await migrateDatabase(main);
  librarySession.reset();
  mockParams = {};
  [mockPush, mockReplace, mockBack, mockDismissTo].forEach((mock) => mock.mockReset());
});

afterEach(() => {
  main.close();
  registryDb.close();
});

describe("A1 — Profil → Bibliothèques", () => {
  it("Profil : « Ajouter une bibliothèque » et « Envoyer mes mouvements » ; ni « Mes bibliothèques » ni « Bibliothèques partagées » (A-4)", async () => {
    renderWith(<ProfileLibrariesSection />);
    await settle();
    expect(screen.getByText("Ajouter une bibliothèque")).toBeTruthy();
    expect(screen.getByText("Depuis un fichier ou l'administration (PC)")).toBeTruthy();
    expect(screen.getByText("Envoyer mes mouvements")).toBeTruthy();
    expect(screen.queryByText("Mes bibliothèques")).toBeNull();
    expect(screen.queryByText("Bibliothèques partagées")).toBeNull();
    expect(screen.queryByTestId("profile-libraries-installed")).toBeNull();
    await press("profile-libraries-add");
    expect(mockPush).toHaveBeenCalledWith("/library-add");
  });

  it("depuis un fichier : Bibliothèques disponibles, aperçu (60 déjà présentes, propriétaire inconnu), installation sans doublon", async () => {
    await installPilot60();
    renderWith(<LibraryAddScreen pickFile={async () => clone(pilot)} />);
    await settle();
    expect(screen.getByText("Choisissez d'où provient la bibliothèque à ajouter.")).toBeTruthy();
    await press("library-add-file");
    expect(mockPush).toHaveBeenCalledWith("/library-available");
    screen.unmount();

    renderWith(<LibraryAvailableScreen />);
    await settle();
    expect(screen.getByText(`Depuis le fichier · ${pilot.catalogue.title}`)).toBeTruthy();
    expect(screen.getByText("60 fiches · non installée")).toBeTruthy();
    expect(screen.getByText("Installer")).toBeTruthy();
    await press(`library-available-${PILOT}`);
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/library-preview", params: { catalogueId: PILOT, libraryId: PILOT } });
    screen.unmount();

    mockParams = { catalogueId: PILOT, libraryId: PILOT };
    renderWith(<LibraryPreviewScreen />);
    await settle();
    expect(screen.getByText("60 fiches dans cette bibliothèque")).toBeTruthy();
    expect(screen.getByText("0 nouvelle")).toBeTruthy();
    expect(screen.getByText("60 déjà présentes")).toBeTruthy();
    expect(screen.getByText("rattachées à vos mouvements, sans doublon")).toBeTruthy();
    expect(screen.getByText("Vos mouvements existants ne sont ni copiés, ni modifiés.")).toBeTruthy();
    expect(screen.getByText("Propriétaire inconnu : usage privé")).toBeTruthy();
    await press("library-preview-install");
    expect(screen.getByText(`${pilot.libraries[0]!.title} est installée`)).toBeTruthy();
    expect(screen.getByText("60 fiches rattachées, sans doublon")).toBeTruthy();
    expect(await movementCount()).toBe(60);
    screen.unmount();

    renderWith(<ProfileLibrariesSection />);
    await settle();
    expect(screen.getByText(pilot.libraries[0]!.title)).toBeTruthy();
    expect(screen.getByText("60 mouvements · à jour")).toBeTruthy();
  });

  it("mise à jour : aperçu par fiche (Modifiée, résumé), « Reporter » sans écriture", async () => {
    await installPilot60();
    const opened = await mockRegistry;
    const load = new CatalogueLoadService({
      registry: opened,
      movements: new MovementCatalogueService(movementRepository()),
      readLocalMovements: freshLocalMovementReader(new SqliteMovementRepository(main)),
      listReferentials: async () => ({
        categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((category) => category.id)),
        bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((zone) => zone.id)),
      }),
      newMovementId: () => `uuid-${++sequence}`,
    });
    await new LibraryService({ registry: opened, load }).apply(pilot, PILOT);
    const revised = revisedPilot();
    librarySession.setSource({ kind: "FILE", file: revised });
    mockParams = { catalogueId: PILOT, libraryId: PILOT };
    renderWith(<LibraryPreviewScreen />);
    await settle();
    expect(screen.getByText(`Mise à jour de ${pilot.libraries[0]!.title}`)).toBeTruthy();
    expect(screen.getByText("Fiches révisées · détail par fiche")).toBeTruthy();
    expect(screen.getByTestId(`library-preview-modified-${pilot.sheets[0]!.sheetId}`)).toBeTruthy();
    expect(screen.getByText(/^Étapes : \d+ étapes? → \d+ étapes · Catégorie inchangée$/)).toBeTruthy();
    expect(screen.getByText("Les fiches modifiées sont mises à jour dans toutes vos bibliothèques qui les contiennent. La composition de vos autres bibliothèques ne change pas.")).toBeTruthy();
    const steps = (await main.getFirstAsync<{ description: string }>("SELECT description FROM movements WHERE id = ?",
      [pilot.sheets[0]!.install.knownLocalMovementIds[0]!]))!.description;
    await press("library-preview-defer");
    expect(screen.getByText("Mise à jour reportée")).toBeTruthy();
    expect((await main.getFirstAsync<{ description: string }>("SELECT description FROM movements WHERE id = ?",
      [pilot.sheets[0]!.install.knownLocalMovementIds[0]!]))!.description).toBe(steps);
  });

  it("fichier invalide : refusé en entier, problèmes lisibles, aucune écriture", async () => {
    const broken = clone(pilot) as unknown as { sheets: Record<string, any>[] };
    broken.sheets[11]!.classification.bodyZoneIds = ["mollets-bas"];
    broken.sheets[30]!.content.name = "";
    renderWith(<LibraryAddScreen pickFile={async () => broken} />);
    await settle();
    await press("library-add-file");
    expect(mockPush).toHaveBeenCalledWith("/library-invalid");
    screen.unmount();
    renderWith(<LibraryInvalidScreen />);
    await settle();
    expect(screen.getByText("Fichier refusé en entier")).toBeTruthy();
    expect(screen.getByText("Aucune fiche n'a été importée. Corrigez le fichier, puis réessayez.")).toBeTruthy();
    expect(screen.getByText(/^Problèmes détectés \(\d+\)$/)).toBeTruthy();
    expect(screen.getByText(new RegExp(`^Fiche 12 « ${(pilot.sheets[11] as CatalogueSheet).content.name.replace(/[()]/g, ".")} » — Zones : référence inconnue`))).toBeTruthy();
    expect(await movementCount()).toBe(0);
  });

  it("connexion : code refusé, puis connecté, puis Bibliothèques disponibles de l'administration", async () => {
    const client = fakeAdmin(pilot);
    renderWith(<LibraryConnectScreen client={client} deviceName="iPhone de test" />);
    await settle();
    expect(screen.getByText("Le téléphone et le PC doivent être sur le même Wi-Fi.")).toBeTruthy();
    expect(screen.getByTestId("library-connect-submit").props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId("library-connect-code"), "111111");
    await press("library-connect-submit");
    expect(screen.getByText("Code refusé ou expiré")).toBeTruthy();
    await press("library-connect-retry");
    fireEvent.changeText(screen.getByTestId("library-connect-code"), "482913");
    await press("library-connect-submit");
    expect(screen.getByText("Connecté à « PC-Hermann »")).toBeTruthy();
    await press("library-connect-continue");
    expect(mockReplace).toHaveBeenCalledWith("/library-available");
    screen.unmount();

    renderWith(<LibraryAvailableScreen client={client} />);
    await settle();
    expect(screen.getByText("Reçues de l'administration · PC-Hermann")).toBeTruthy();
    expect(screen.getByText("60 fiches · non installée")).toBeTruthy();
    expect(screen.getByText("Actualisée à l'instant")).toBeTruthy();
  });

  it("MOUV-D2 : Bibliothèque non transférée (média aux droits non confirmés) signalée, sans « connexion perdue »", async () => {
    const client = fakeAdmin(pilot, { mediaWithheld: true });
    const session = await client.pair({ host: "192.168.1.20", port: 4739, name: "PC-Hermann" }, "482913", "iPhone");
    librarySession.setSource({ kind: "ADMIN", session, entries: [], refreshedAt: 0 });
    renderWith(<LibraryAvailableScreen client={client} />);
    await settle();
    expect(screen.getByText("Bibliothèques non transférées")).toBeTruthy();
    expect(screen.queryByText("Liste indisponible")).toBeNull();
    expect(screen.getByTestId("library-available-empty")).toBeTruthy();
  });

  it("connexion : PC introuvable sur le Wi-Fi, avec repli « Importer depuis un fichier »", async () => {
    renderWith(<LibraryConnectScreen client={fakeAdmin(pilot, { reachable: false })} deviceName="iPhone de test" />);
    await settle();
    fireEvent.changeText(screen.getByTestId("library-connect-code"), "482913");
    await press("library-connect-submit");
    expect(screen.getByText("PC introuvable sur le Wi-Fi")).toBeTruthy();
    expect(screen.getByTestId("library-connect-file")).toBeTruthy();
    expect(screen.getByTestId("library-connect-retry")).toBeTruthy();
  });

  it("reprise après interruption : progression, puis reprise sans doublon", async () => {
    const opened = await mockRegistry;
    const file = clone(pilot);
    await opened.beginLibraryOperation({ catalogueId: PILOT, libraryId: PILOT, kind: "INSTALL", targetKey: "x", file });
    mockParams = { catalogueId: PILOT, libraryId: PILOT };
    renderWith(<LibraryResumeScreen />);
    await settle();
    expect(screen.getByText("Installation interrompue")).toBeTruthy();
    expect(screen.getByText("0 fiches sur 60 déjà appliquées")).toBeTruthy();
    expect(screen.getByText("Rien n'est perdu : les fiches déjà appliquées sont conservées, la reprise continue là où elle s'est arrêtée.")).toBeTruthy();
    await press("library-resume-continue");
    expect(await movementCount()).toBe(60);
    expect(await opened.libraryOperations()).toEqual([]);
  });
});

describe("A2 — Envoyer mes mouvements", () => {
  it("sans appairage : connexion d’abord ; puis seuls les Mouvements personnels sont proposés et envoyés, sans modification locale", async () => {
    renderWith(<LibrarySendScreen deviceName="iPhone de test" />);
    await settle();
    await press("library-send-connect");
    expect(mockReplace).toHaveBeenCalledWith({ pathname: "/library-connect", params: { next: "send" } });
    screen.unmount();

    await installPilot60();
    const own = new MovementCatalogueService(movementRepository());
    const zone = pilot.sheets[0]!.classification;
    await own.createIndependent({
      id: "perso-1", name: "Gainage maison", aliases: [], description: null, categoryId: zone.categoryId!,
      bodyZoneIds: [...zone.bodyZoneIds], media: [], phases: [], nextPhaseId: 1, levelGroup: null,
    });
    // Les 60 sont importés (Bibliothèque installée) : ils ne sont pas proposés à l’envoi.
    const opened = await mockRegistry;
    const load = new CatalogueLoadService({
      registry: opened,
      movements: own,
      readLocalMovements: freshLocalMovementReader(new SqliteMovementRepository(main)),
      listReferentials: async () => ({
        categoryIds: new Set((await new SqliteCategoryRepository(main).listAll()).map((category) => category.id)),
        bodyZoneIds: new Set((await new SqliteBodyZoneRepository(main).listAll()).map((entry) => entry.id)),
      }),
      newMovementId: () => "uuid-x",
    });
    await new LibraryService({ registry: opened, load }).apply(pilot, PILOT);
    const before = await main.getAllAsync("SELECT * FROM movements ORDER BY id");

    let posted: { movements: { movementId: string; name: string }[] } | null = null;
    const client = new AdminClient({
      localAddress: async () => null,
      fetch: async (_url, init) => {
        posted = JSON.parse(init!.body!);
        const reply = { received: 1, stored: 1, duplicates: 0 };
        return { ok: true, status: 200, json: async () => reply, text: async () => JSON.stringify(reply) };
      },
    });
    librarySession.setSource({ kind: "ADMIN", session: { host: "192.168.1.20", port: 4739, name: "PC-Hermann", token: "t".repeat(43), expiresAt: null }, entries: [], refreshedAt: 0 });
    renderWith(<LibrarySendScreen client={client} deviceName="iPhone de test" />);
    await settle();
    expect(screen.getByText("Vers l’administration · PC-Hermann".replace("’", "'"))).toBeTruthy();
    expect(screen.getByTestId("library-send-item-perso-1")).toBeTruthy();
    expect(screen.queryByTestId(`library-send-item-${pilot.sheets[0]!.install.knownLocalMovementIds[0]}`)).toBeNull();
    expect(screen.getByTestId("library-send-submit").props.accessibilityState.disabled).toBe(true);
    await press("library-send-item-perso-1");
    await press("library-send-submit");
    expect(posted!.movements.map((movement) => movement.movementId)).toEqual(["perso-1"]);
    expect(screen.getByText("1 mouvement envoyé à « PC-Hermann »")).toBeTruthy();
    expect(await main.getAllAsync("SELECT * FROM movements ORDER BY id")).toEqual(before);
  });
});
