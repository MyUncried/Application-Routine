import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import {
  projectSheetToMovement,
  sheetFingerprint,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  compareSheet,
  planCatalogueLoad,
  type InstalledSheetRecord,
  type LocalMovement,
  type LocalReferentials,
  type RegistrySnapshot,
  type SheetLoadItem,
} from "@/domain/catalogue/catalogueLoadPlan";

/**
 * CA-3 — classification pure : un test par cas du plan (§ 5), résumé systématique, comparaison
 * détaillée de toutes les propriétés éditoriales et identification précise des conflits.
 */

const pilot = JSON.parse(
  readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8"),
) as MovementCatalogueFile;
const CATALOGUE = pilot.catalogue.id;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const referentials: LocalReferentials = {
  categoryIds: new Set(pilot.references.categories.map((entry) => entry.id)),
  bodyZoneIds: new Set(pilot.references.bodyZones.map((entry) => entry.id)),
};
const EMPTY: RegistrySnapshot = { installed: [], pending: [], decisions: [] };

const sheetA = () => clone(pilot.sheets[0]!);
const sheetB = () => clone(pilot.sheets[1]!);
const fileOf = (...sheets: CatalogueSheet[]): MovementCatalogueFile => ({ ...pilot, sheets });
const localOf = (sheet: CatalogueSheet, id = sheet.install.knownLocalMovementIds[0]!, archived = false): LocalMovement =>
  ({ movement: projectSheetToMovement(sheet, id), archived });
const installedOf = (sheet: CatalogueSheet, movementId: string): InstalledSheetRecord => ({
  catalogueId: CATALOGUE, sheetId: sheet.sheetId, movementId, revision: sheet.revision,
  fingerprint: sheetFingerprint(sheet), sheet, installedAt: "t", updatedAt: "t",
});
/** Nouvelle révision « 2 » de la fiche, modifiée par `change`. */
function revise(sheet: CatalogueSheet, change: (draft: Mutable) => void): CatalogueSheet {
  const draft = clone(sheet) as Mutable;
  change(draft);
  draft.revision = "2";
  draft.history = [...draft.history, { revision: "2", date: "2026-11-11", author: null, summary: "Révision" }];
  return draft as unknown as CatalogueSheet;
}
type Mutable = { -readonly [K in keyof CatalogueSheet]: any };

function only(file: MovementCatalogueFile, registry: RegistrySnapshot, locals: LocalMovement[]): SheetLoadItem {
  const plan = planCatalogueLoad(file, registry, locals, referentials);
  expect(plan.items).toHaveLength(file.sheets.length);
  return plan.items[0]!;
}
const edit = (movement: Movement, change: Partial<Movement>): Movement => ({ ...movement, ...change });

describe("CA-3 — classification d'un chargement (pure)", () => {
  it("fiche nouvelle : installation proposée, résumé complet de la fiche", () => {
    const item = only(fileOf(sheetA()), EMPTY, []);
    expect(item).toMatchObject({ state: "NEW", movementId: null, blockers: [], recommended: null });
    expect(item.summary.movementFields).toEqual(["content.name", "content.aliases", "content.steps", "classification.categoryId", "classification.bodyZoneIds"]);
    expect(item.summary.bySection.provenance).toBeGreaterThan(0);
    expect(item.summary.bySection.sources).toBeGreaterThan(0);
    expect(item.summary.bySection.validation).toBeGreaterThan(0);
  });

  it("pilote : les 60 Mouvements pilot:* existants sont adoptables, sans aucun changement de Mouvement", () => {
    const plan = planCatalogueLoad(pilot, EMPTY, pilot.sheets.map((sheet) => localOf(sheet)), referentials);
    expect(plan.items.map((item) => item.state)).toEqual(Array(60).fill("ADOPTABLE"));
    plan.items.forEach((item, index) => {
      expect(item.movementId).toBe("pilot:" + pilot.sheets[index]!.sheetId);
      expect(item.summary.movementFields).toEqual([]);
      expect(item.summary.conflicts).toEqual([]);
    });
  });

  it("identifiant connu au contenu différent : à rapprocher, chaque différence est un conflit explicite", () => {
    const sheet = sheetA();
    const local = localOf(sheet);
    const changed = { ...local, movement: edit(local.movement, { aliases: ["Alias personnel"] }) };
    const item = only(fileOf(sheet), EMPTY, [changed]);
    expect(item.state).toBe("TO_RECONCILE");
    expect(item.summary.conflicts).toEqual(["content.aliases"]);
    expect(item.comparison.find((entry) => entry.path === "content.aliases")).toMatchObject({
      local: ["Alias personnel"], incoming: sheet.content.aliases, conflict: true,
    });
    expect(item.recommended).toBe("DEFER");
  });

  it("registre perdu, homonyme local : à rapprocher (jamais adopté par le seul nom)", () => {
    const sheet = sheetA();
    const item = only(fileOf(sheet), EMPTY, [localOf(sheet, "uuid-perdu")]);
    expect(item).toMatchObject({ state: "TO_RECONCILE", movementId: "uuid-perdu" });
    expect(item.summary.conflicts).toEqual([]);
  });

  it("identique : à jour ; modification locale sans révision : conservée et signalée", () => {
    const sheet = sheetA();
    const local = localOf(sheet);
    const registry = { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] };
    expect(only(fileOf(sheet), registry, [local])).toMatchObject({ state: "UP_TO_DATE", summary: { changedFields: 0 } });
    const modified = { ...local, movement: edit(local.movement, { name: "Mon nom" }) };
    const item = only(fileOf(sheet), registry, [modified]);
    expect(item.state).toBe("UP_TO_DATE");
    expect(item.summary.keptLocal).toEqual(["content.name"]);
  });

  it("révision incohérente : même révision et empreinte différente, ou filiation rompue", () => {
    const sheet = sheetA();
    const local = localOf(sheet);
    const registry = { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] };
    const silent = clone(sheet);
    (silent.content as { notes: string }).notes = "modifiée sans révision";
    expect(only(fileOf(silent), registry, [local]).state).toBe("INCOHERENT_REVISION");
    const orphan = { ...clone(sheet), revision: "9", history: [{ revision: "9", date: "2026-11-11", author: null, summary: "?" }] };
    expect(only(fileOf(orphan), registry, [local]).state).toBe("INCOHERENT_REVISION");
  });

  it("révision antérieure : ignorée", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => { draft.content.notes = "v2"; });
    const local = localOf(next);
    const registry = { ...EMPTY, installed: [installedOf(next, local.movement.id)] };
    expect(only(fileOf(sheet), registry, [local]).state).toBe("OLDER_REVISION");
  });

  it("nouvelle révision purement éditoriale : suivie sur toutes les propriétés, sans écriture de Mouvement", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => {
      draft.provenance.owner = { kind: "ORGANIZATION", id: "ankusha" };
      draft.sources.documentary.section = "Nouvelle section";
      draft.validation.clinical = "REVIEWED";
      draft.classification.specialtyIds = [];
      draft.media = [{ ...{ id: "media-0001aa", kind: "PHOTO", storage: "REMOTE", url: "https://exemple.fr/a.webp", fileName: "a.webp", caption: "", alt: "Alt", sourceUrl: "https://exemple.fr", attribution: "", license: "", rightsStatus: "UNVERIFIED" } }];
    });
    const local = localOf(sheet);
    const item = only(fileOf(next), { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] }, [local]);
    expect(item.state).toBe("NEW_REVISION");
    expect(item.summary).toMatchObject({ editorialOnly: true, movementFields: [], conflicts: [] });
    expect(item.comparison.map((entry) => entry.path)).toEqual(expect.arrayContaining([
      "provenance.owner", "sources.documentary.section", "validation.clinical", "classification.specialtyIds", "media",
    ]));
    expect(item.comparison.find((entry) => entry.path === "provenance.owner")).toMatchObject({ installed: null, incoming: { kind: "ORGANIZATION", id: "ankusha" } });
  });

  it("nouvelle révision, Mouvement non modifié : changements de Mouvement résumés, sans conflit", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => { draft.content.steps = [...draft.content.steps, "Nouvelle étape"]; });
    const local = localOf(sheet);
    const item = only(fileOf(next), { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] }, [local]);
    expect(item.state).toBe("NEW_REVISION");
    expect(item.summary).toMatchObject({ movementFields: ["content.steps"], conflicts: [], editorialOnly: false });
    expect(item.recommended).toBeNull();
  });

  it("conflit : identifié précisément par champ, valeur locale montrée, report recommandé", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => {
      draft.content.steps = ["Étape officielle"];
      draft.content.aliases = ["Alias officiel"];
    });
    const local = localOf(sheet);
    const mine = { ...local, movement: edit(local.movement, { description: "Mon étape", name: "Mon nom" }) };
    const item = only(fileOf(next), { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] }, [mine]);
    expect(item.summary.conflicts).toEqual(["content.steps"]);
    expect(item.summary.movementFields).toEqual(["content.aliases"]);
    expect(item.summary.keptLocal).toEqual(["content.name"]);
    expect(item.comparison.find((entry) => entry.path === "content.steps")).toEqual({
      path: "content.steps", section: "content", installed: sheet.content.steps, incoming: ["Étape officielle"],
      local: ["Mon étape"], projected: true, incomingChanged: true, localModified: true, conflict: true,
    });
    expect(item.recommended).toBe("DEFER");
  });

  it("convergence : modification locale égale à la nouvelle valeur, aucun conflit", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => { draft.content.name = "Nom convergent"; });
    const local = localOf(sheet);
    const mine = { ...local, movement: edit(local.movement, { name: "Nom convergent" }) };
    const item = only(fileOf(next), { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] }, [mine]);
    expect(item.summary).toMatchObject({ conflicts: [], movementFields: [], editorialOnly: true });
  });

  it("décisions : révision reportée reproposée, révision refusée écartée jusqu'à la suivante", () => {
    const sheet = sheetA();
    const next = revise(sheet, (draft) => { draft.content.notes = "v2"; });
    const local = localOf(sheet);
    const installed = [installedOf(sheet, local.movement.id)];
    const decided = (decision: "DEFERRED" | "REFUSED", revision = "2") =>
      ({ ...EMPTY, installed, decisions: [{ catalogueId: CATALOGUE, sheetId: sheet.sheetId, revision, decision, decidedAt: "t" }] });
    expect(only(fileOf(next), decided("DEFERRED"), [local])).toMatchObject({ state: "NEW_REVISION", deferred: true });
    expect(only(fileOf(next), decided("REFUSED"), [local]).state).toBe("REFUSED_REVISION");
    const third = { ...clone(next), revision: "3", history: [...next.history, { revision: "3", date: "2026-11-12", author: null, summary: "v3" }] };
    expect(only(fileOf(third), decided("REFUSED"), [local]).state).toBe("NEW_REVISION");
  });

  it("retrait local : Mouvement archivé ou supprimé, ni réinstallé ni modifié", () => {
    const sheet = sheetA();
    const registry = { ...EMPTY, installed: [installedOf(sheet, "pilot:" + sheet.sheetId)] };
    expect(only(fileOf(sheet), registry, []).state).toBe("WITHDRAWN_LOCALLY");
    expect(only(fileOf(sheet), registry, [localOf(sheet, undefined, true)]).state).toBe("WITHDRAWN_LOCALLY");
    expect(only(fileOf(sheet), EMPTY, [localOf(sheet, undefined, true)]).state).toBe("WITHDRAWN_LOCALLY");
  });

  it("empêchements : référentiel absent du téléphone, nom déjà pris par un autre Mouvement", () => {
    const sheet = sheetA();
    const foreign = clone(sheet);
    (foreign.classification as { categoryId: string }).categoryId = "categorie-inconnue";
    const item = only(fileOf(foreign), EMPTY, []);
    expect(item.blockers).toEqual([{ code: "LOCAL_REFERENCE_MISSING", field: "categoryId", ids: ["categorie-inconnue"] }]);
    const other = sheetB();
    const homonym = { ...localOf(other), movement: edit(localOf(other).movement, { name: sheet.content.name }) };
    const installed = { ...EMPTY, installed: [installedOf(other, homonym.movement.id)] };
    expect(only(fileOf(sheet), installed, [homonym]).blockers).toEqual([{ code: "NAME_CONFLICT", movementId: homonym.movement.id }]);
  });

  it("opération interrompue signalée ; fiche absente du fichier jamais proposée à la suppression", () => {
    const sheet = sheetA();
    const local = localOf(sheet);
    const pending = { ...EMPTY, pending: [{ catalogueId: CATALOGUE, sheetId: sheet.sheetId, kind: "INSTALL" as const, movementId: "x", sheet, movement: local.movement, savedLocalValues: [], createdAt: "t" }] };
    expect(only(fileOf(sheet), pending, []).state).toBe("INTERRUPTED");
    const plan = planCatalogueLoad(fileOf(), { ...EMPTY, installed: [installedOf(sheet, local.movement.id)] }, [local], referentials);
    expect(plan.items).toEqual([]);
  });

  it("comparaison : ordre des Zones indifférent, ordre des étapes significatif", () => {
    const sheet = sheetA();
    const zones = clone(sheet);
    (zones.classification as { bodyZoneIds: readonly string[] }).bodyZoneIds = [...sheet.classification.bodyZoneIds].reverse();
    expect(compareSheet(sheet, zones, null)).toEqual([]);
    const steps = clone(sheet);
    (steps.content as { steps: readonly string[] }).steps = [...sheet.content.steps].reverse();
    expect(compareSheet(sheet, steps, null).map((entry) => entry.path)).toEqual(["content.steps"]);
  });
});
