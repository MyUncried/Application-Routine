import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Picker as SwiftUIPicker } from "@expo/ui/swift-ui";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Alert, type AlertButton } from "react-native";

import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import type { CatalogueSheet, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { installPilotMovements, preparePilotMovementImport } from "@/features/activities/pilotMovementImport";
import { CatalogueLoadScreen } from "@/features/catalogue/CatalogueLoadScreen";
import { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * CA-4 — écran de recette « Charger un catalogue » sur vraies bases SQLite (principale + registre) :
 * résumé systématique, comparaison détaillée à la demande, conflit sans écriture tant qu'aucun choix
 * explicite n'est fait (sélecteur segmenté natif), reporter / refuser / accepter, rattachement des
 * fiches identiques. Rendu natif réel et ergonomie : recette iPhone (CA-6).
 */

const NOW = "2026-11-10T09:00:00.000Z";
const pilot = JSON.parse(
  readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8"),
) as MovementCatalogueFile;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const FIRST = pilot.sheets[0]!;
const FIRST_ID = "pilot:" + FIRST.sheetId;

let main: NodeSqliteDatabase;
let registryDb: NodeSqliteDatabase;
let sequence = 0;
let alerts: { title: string; message?: string; buttons?: AlertButton[] }[] = [];

const movementRepository = () => new SqliteMovementRepository(main, () => `grp-${++sequence}`, () => NOW);
const catalogue = () => new MovementCatalogueService(movementRepository());

function renderScreen(pickFile: () => Promise<unknown | null>) {
  const service = new ActivityDefinitionService(
    new SqliteCategoryRepository(main),
    new SqliteBodyZoneRepository(main),
    undefined,
    undefined,
    movementRepository(),
  );
  return render(
    <ActivityDefinitionServiceContext.Provider value={service}>
      <CatalogueLoadScreen
        openRegistry={async () => ({ registry: await SqliteCatalogueRegistry.open(registryDb, () => NOW), closeAsync: async () => {} })}
        pickFile={pickFile}
        newMovementId={() => `uuid-${++sequence}`}
      />
    </ActivityDefinitionServiceContext.Provider>,
  );
}

async function settle() {
  await act(async () => { for (let i = 0; i < 20; i++) await new Promise((resolve) => setImmediate(resolve)); });
}
async function press(testID: string) {
  fireEvent.press(screen.getByTestId(testID));
  await settle();
}
/** Appuie sur le bouton nommé de la dernière alerte affichée. */
async function confirm(label: string) {
  const button = alerts.at(-1)?.buttons?.find((candidate) => candidate.text === label);
  if (!button?.onPress) throw new Error("bouton d'alerte absent : " + label + " — " + JSON.stringify(alerts.at(-1)));
  await act(async () => { button.onPress!(); });
  await settle();
}

async function dump(): Promise<string[]> {
  const tables = await main.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  const rows: string[] = [];
  for (const { name } of tables) {
    for (const row of await main.getAllAsync<Record<string, unknown>>(`SELECT * FROM "${name}"`)) rows.push(name + JSON.stringify(row));
  }
  return rows.sort();
}

async function installPilot60() {
  await installPilotMovements(catalogue(), preparePilotMovementImport({
    schemaVersion: "0.1.0", kind: "KODJO_ADMIN_DRAFTS", publicationAllowed: false, movementEdits: {},
    referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
    glossary: [],
  }));
}

/** Révision 2 de la première fiche : une étape ajoutée et une source documentaire modifiée. */
function revisedFile(steps?: string[]): MovementCatalogueFile {
  const file = clone(pilot) as unknown as { sheets: Record<string, any>[] };  
  const sheet = file.sheets[0]!;
  sheet.content.steps = steps ?? [...sheet.content.steps, "Revenir lentement"];
  sheet.sources.documentary.section = "Section révisée";
  sheet.revision = "2";
  sheet.history.push({ revision: "2", date: "2026-11-11", author: null, summary: "Révision" });
  return file as unknown as MovementCatalogueFile;
}

async function loadAndAdopt(file: MovementCatalogueFile = pilot) {
  await settle();
  await press("catalogue-load-pick");
  await press("catalogue-load-adopt-all");
  await confirm("Rattacher");
  return file;
}

beforeEach(async () => {
  main = NodeSqliteDatabase.openInMemory();
  registryDb = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(main);
  alerts = [];
  jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => { alerts.push({ title, message, buttons }); });
});

afterEach(() => {
  jest.restoreAllMocks();
  main.close();
  registryDb.close();
});

describe("CA-4 — écran « Charger un catalogue »", () => {
  it("annuler la sélection : rien n'est lu ni écrit", async () => {
    renderScreen(async () => null);
    await settle();
    const before = await dump();
    await press("catalogue-load-pick");
    expect(screen.getByText(/Rien n’est écrit avant ta décision/)).toBeTruthy();
    expect(await dump()).toEqual(before);
  });

  it("fichier invalide : refusé en entier, problèmes affichés, aucune écriture", async () => {
    renderScreen(async () => ({ ...clone(pilot), catalogue: { ...pilot.catalogue, publicationAllowed: true } }));
    await settle();
    const before = await dump();
    await press("catalogue-load-pick");
    expect(within(screen.getByTestId("catalogue-load-invalid")).getByText(/catalogue.publicationAllowed — INCONSISTENT/)).toBeTruthy();
    expect(await dump()).toEqual(before);
  });

  it("pilote sur la base des 60 : propriétaire inconnu signalé ; rattachement groupé des fiches identiques, sans modifier aucun mouvement", async () => {
    await installPilot60();
    renderScreen(async () => pilot);
    await settle();
    const before = await dump();
    await press("catalogue-load-pick");
    expect(screen.getByText("Déjà présente, identique (60)")).toBeTruthy();
    expect(screen.getByText(/Propriétaire inconnu \(61\) : chargement privé possible, aucune publication/)).toBeTruthy();
    await press("catalogue-load-adopt-all");
    expect(alerts.at(-1)!.title).toBe("Rattacher 60 fiche(s) identique(s) ?");
    expect(alerts.at(-1)!.message).toMatch(/aucun mouvement ne sera modifié/);
    await confirm("Rattacher");
    expect(alerts.at(-1)).toMatchObject({ title: "Fiches rattachées", message: "60 fiche(s) rattachée(s), aucun mouvement modifié." });
    expect(screen.getByText("À jour (60)")).toBeTruthy();
    expect(await dump()).toEqual(before);
  });

  it("nouvelle révision : résumé systématique, comparaison à la demande (toutes propriétés), acceptation après confirmation", async () => {
    await installPilot60();
    let file: MovementCatalogueFile = pilot;
    renderScreen(async () => file);
    await loadAndAdopt();
    file = revisedFile();
    await press("catalogue-load-pick");
    expect(screen.getByText("Nouvelle révision (1)")).toBeTruthy();
    await press(`catalogue-load-item-${FIRST.sheetId}`);

    const summary = within(screen.getByTestId("catalogue-load-summary"));
    expect(summary.getByText("Révision 1 → 2.")).toBeTruthy();
    expect(summary.getByText("2 champ(s) différent(s) : contenu 1, sources 1.")).toBeTruthy();
    expect(summary.getByText("Le mouvement sera modifié : Étapes.")).toBeTruthy();
    expect(screen.queryByTestId("catalogue-load-comparison")).toBeNull();

    await press("catalogue-load-toggle-comparison");
    const comparison = within(screen.getByTestId("catalogue-load-comparison"));
    expect(comparison.getByTestId("catalogue-load-field-sources.documentary.section")).toBeTruthy();
    expect(comparison.getByText("Nouveau : Section révisée")).toBeTruthy();
    expect(comparison.getByTestId("catalogue-load-field-content.steps")).toBeTruthy();

    await press("catalogue-load-accept");
    expect(alerts.at(-1)!.title).toBe(`Accepter « ${FIRST.content.name} » ?`);
    expect(alerts.at(-1)!.message).toContain("Le mouvement sera modifié : Étapes.");
    await confirm("Accepter");
    expect(alerts.at(-1)!.title).toBe("Révision acceptée");
    expect(decodeInstructionSteps((await catalogue().findMovement(FIRST_ID))!.description).at(-1)).toBe("Revenir lentement");
    expect(screen.getByText("À jour (60)")).toBeTruthy();
  });

  it("conflit : visible sans demande, aucune acceptation sans choix ; « Garder ma valeur » ne modifie pas le mouvement", async () => {
    await installPilot60();
    let file: MovementCatalogueFile = pilot;
    renderScreen(async () => file);
    await loadAndAdopt();
    const mine = (await catalogue().findMovement(FIRST_ID))!;
    await catalogue().update({ ...mine, description: encodeInstructionSteps(["Ma propre consigne"]) });
    file = revisedFile(["Consigne officielle"]);
    await press("catalogue-load-pick");
    await press(`catalogue-load-item-${FIRST.sheetId}`);

    expect(within(screen.getByTestId("catalogue-load-summary")).getByText(/Conflit avec tes modifications : Étapes/)).toBeTruthy();
    const field = within(screen.getByTestId("catalogue-load-field-content.steps"));
    expect(field.getByText("Étapes — conflit")).toBeTruthy();
    expect(field.getByText("Sur ce téléphone : 1. Ma propre consigne")).toBeTruthy();
    expect(field.getByText("Nouveau : 1. Consigne officielle")).toBeTruthy();
    expect(screen.getByTestId("catalogue-load-accept").props.accessibilityState).toMatchObject({ disabled: true });

    const before = await dump();
    const picker = screen.UNSAFE_getAllByType(SwiftUIPicker)[0]!;
    expect(picker.props.selection).toBeNull();
    await act(async () => { picker.props.onSelectionChange("KEEP_LOCAL"); });
    expect(screen.getByTestId("catalogue-load-accept").props.accessibilityState).toMatchObject({ disabled: false });
    await press("catalogue-load-accept");
    await confirm("Accepter");
    expect(alerts.at(-1)).toMatchObject({ title: "Révision acceptée", message: "Le mouvement n'a pas été modifié." });
    expect(await dump()).toEqual(before);
  });

  it("conflit : « Prendre la nouvelle » met à jour le mouvement, la valeur locale est sauvegardée au registre", async () => {
    await installPilot60();
    let file: MovementCatalogueFile = pilot;
    renderScreen(async () => file);
    await loadAndAdopt();
    const mine = (await catalogue().findMovement(FIRST_ID))!;
    await catalogue().update({ ...mine, description: encodeInstructionSteps(["Ma propre consigne"]) });
    file = revisedFile(["Consigne officielle"]);
    await press("catalogue-load-pick");
    await press(`catalogue-load-item-${FIRST.sheetId}`);
    await act(async () => { screen.UNSAFE_getAllByType(SwiftUIPicker)[0]!.props.onSelectionChange("TAKE_INCOMING"); });
    await press("catalogue-load-accept");
    await confirm("Accepter");
    expect(decodeInstructionSteps((await catalogue().findMovement(FIRST_ID))!.description)).toEqual(["Consigne officielle"]);
    const saved = await (await SqliteCatalogueRegistry.open(registryDb)).savedLocalValues({ catalogueId: pilot.catalogue.id, sheetId: FIRST.sheetId });
    expect(saved).toMatchObject([{ field: "content.steps", value: ["Ma propre consigne"] }]);
  });

  it("reporter puis refuser : le mouvement n'est jamais modifié", async () => {
    await installPilot60();
    let file: MovementCatalogueFile = pilot;
    renderScreen(async () => file);
    await loadAndAdopt();
    file = revisedFile();
    await press("catalogue-load-pick");
    const before = await dump();
    await press(`catalogue-load-item-${FIRST.sheetId}`);
    await press("catalogue-load-defer");
    expect(alerts.at(-1)!.title).toBe("Révision reportée");
    expect(screen.getByTestId(`catalogue-load-item-${FIRST.sheetId}`)).toBeTruthy();
    expect(screen.getByText(/reportée/)).toBeTruthy();
    await press(`catalogue-load-item-${FIRST.sheetId}`);
    await press("catalogue-load-refuse");
    await confirm("Refuser");
    expect(alerts.at(-1)!.title).toBe("Révision refusée");
    expect(screen.getByText("Révision refusée (1)")).toBeTruthy();
    expect(await dump()).toEqual(before);
  });

  it("fiche créée dans le fichier : installée après résumé et confirmation", async () => {
    const file = clone(pilot) as unknown as { sheets: Record<string, any>[] };  
    const created = clone(file.sheets[1]!);
    created.sheetId = "LOCAL-001";
    created.content.name = "Squat au mur créé dans le fichier";
    created.content.aliases = [];
    created.provenance = { ...created.provenance, origin: "LOCAL_CREATED", upstream: null };
    created.install = { knownLocalMovementIds: [] };
    renderScreen(async () => ({ ...file, sheets: [created] }));
    await settle();
    await press("catalogue-load-pick");
    await press("catalogue-load-item-LOCAL-001");
    expect(within(screen.getByTestId("catalogue-load-summary")).getByText("Nouvelle fiche : un mouvement sera ajouté au Catalogue.")).toBeTruthy();
    await press("catalogue-load-accept");
    await confirm("Accepter");
    expect(alerts.at(-1)!.title).toBe("Fiche installée");
    expect((await catalogue().listEntries()).map((entry) => entry.movement.name)).toEqual(["Squat au mur créé dans le fichier"]);
    expect((created as unknown as CatalogueSheet).sheetId).toBe("LOCAL-001");
  });
});
