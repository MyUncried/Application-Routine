/**
 * CA-3 — Service de chargement d'un catalogue autonome (`KODJO_MOVEMENT_CATALOGUE` v1).
 *
 * - `prepare` : valide le fichier, reprend les opérations interrompues, classe chaque fiche
 *   (états, résumé systématique, comparaison détaillée) ; aucune écriture de Mouvement.
 * - `accept`, `defer`, `refuse` : une décision explicite du destinataire, fiche par fiche.
 *
 * Décisions de Hermann du 10/11/2026 : aucune fusion automatique ; en conflit, la modification
 * locale est conservée et la révision reportée tant que le destinataire n'a pas choisi, champ par
 * champ, de garder sa valeur ou de prendre la nouvelle (sa valeur est alors sauvegardée au
 * registre). Les Mouvements sont écrits par le service Catalogue existant (mêmes validations que
 * les écrans) ; médias, phases, famille et archivage locaux ne sont jamais modifiés.
 *
 * L'interface utilisateur relève de CA-4.
 */
import type { Movement } from "@/domain/activities/Movement";
import {
  parseMovementCatalogueFile,
  projectSheetToMovement,
  sheetFingerprint,
  type CatalogueIssue,
  type CatalogueSheet,
  type CatalogueWarning,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  PROJECTED_FIELDS,
  localValueOf,
  planCatalogueLoad,
  withProjectedValue,
  type CatalogueLoadPlan,
  type LocalMovement,
  type LocalReferentials,
  type ProjectedField,
  type SavedLocalValue,
  type SheetBlocker,
  type SheetLoadItem,
  type SheetLoadState,
} from "@/domain/catalogue/catalogueLoadPlan";
import type { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";

export type CatalogueLoadDependencies = {
  readonly registry: Pick<SqliteCatalogueRegistry, "state" | "beginPending" | "abandonPending" | "commit" | "recordDecision">;
  /** Écritures par le service Catalogue existant (mêmes validations que les écrans). */
  readonly movements: Pick<MovementCatalogueService, "createIndependent" | "updateFromSource">;
  /** Mouvements locaux, archivés compris, lus de façon fraîche (`freshLocalMovementReader`). */
  readonly readLocalMovements: () => Promise<readonly LocalMovement[]>;
  /** Catégories et Zones présentes sur le téléphone (aucune création implicite). */
  readonly listReferentials: () => Promise<LocalReferentials>;
  /** Identifiant d'un Mouvement nouvellement installé (application : `Crypto.randomUUID`). */
  readonly newMovementId: () => string;
};

export type RecoveryReport = {
  /** Opérations dont l'écriture avait eu lieu : confirmées au registre. */
  readonly completed: readonly string[];
  /** Opérations dont l'écriture n'avait pas eu lieu : abandonnées, la fiche est reproposée. */
  readonly abandoned: readonly string[];
};

export type PreparedCatalogueLoad =
  | { readonly ok: false; readonly issues: readonly CatalogueIssue[] }
  | {
      readonly ok: true;
      readonly file: MovementCatalogueFile;
      readonly warnings: readonly CatalogueWarning[];
      readonly recovery: RecoveryReport;
      readonly plan: CatalogueLoadPlan;
    };

/** Choix explicite du destinataire pour un champ en conflit. */
export type ConflictResolution = "KEEP_LOCAL" | "TAKE_INCOMING";
export type ConflictResolutions = Partial<Record<ProjectedField, ConflictResolution>>;

export type AcceptOutcome =
  | { readonly status: "INSTALLED" | "ADOPTED" | "UPDATED" | "REGISTERED"; readonly movementId: string }
  | { readonly status: "RESOLUTION_REQUIRED"; readonly fields: readonly ProjectedField[] }
  | { readonly status: "BLOCKED"; readonly blockers: readonly SheetBlocker[] }
  | { readonly status: "NOT_APPLICABLE"; readonly state: SheetLoadState }
  | { readonly status: "MOVEMENT_REFUSED"; readonly reason: string }
  | { readonly status: "UNKNOWN_SHEET" };

export type DecisionOutcome =
  | { readonly status: "RECORDED" }
  | { readonly status: "NOT_APPLICABLE"; readonly state: SheetLoadState }
  | { readonly status: "UNKNOWN_SHEET" };

/** États pour lesquels une décision du destinataire est attendue. */
const DECIDABLE: ReadonlySet<SheetLoadState> = new Set(["NEW", "ADOPTABLE", "TO_RECONCILE", "NEW_REVISION"]);

const sameProjected = (a: Movement, b: Movement) =>
  PROJECTED_FIELDS.every((field) => JSON.stringify(normal(field, localValueOf(a, field))) ===
    JSON.stringify(normal(field, localValueOf(b, field))));
const normal = (field: ProjectedField, value: unknown) =>
  field === "classification.bodyZoneIds" ? [...(value as string[])].sort() : value;

export class CatalogueLoadService {
  constructor(private readonly deps: CatalogueLoadDependencies) {}

  /** Validation, reprise des interruptions, classification. Aucune écriture de Mouvement. */
  async prepare(raw: unknown): Promise<PreparedCatalogueLoad> {
    const parsed = parseMovementCatalogueFile(raw);
    if (!parsed.ok) return { ok: false, issues: parsed.issues };
    const recovery = await this.recoverInterrupted(parsed.file.catalogue.id);
    const plan = await this.plan(parsed.file);
    return { ok: true, file: parsed.file, warnings: parsed.warnings, recovery, plan };
  }

  /**
   * Reprise après interruption (entre l'écriture du Mouvement et la confirmation du registre) :
   * confirme ce qui a été écrit, abandonne ce qui ne l'a pas été. Aucune écriture de Mouvement.
   */
  async recoverInterrupted(catalogueId: string): Promise<RecoveryReport> {
    const snapshot = await this.deps.registry.state(catalogueId);
    if (snapshot.pending.length === 0) return { completed: [], abandoned: [] };
    const local = new Map((await this.deps.readLocalMovements()).map((entry) => [entry.movement.id, entry.movement]));
    const completed: string[] = [];
    const abandoned: string[] = [];
    for (const operation of snapshot.pending) {
      const current = local.get(operation.movementId);
      if (current && sameProjected(current, operation.movement)) {
        await this.deps.registry.commit({
          catalogueId: operation.catalogueId,
          sheetId: operation.sheetId,
          movementId: operation.movementId,
          revision: operation.sheet.revision,
          fingerprint: sheetFingerprint(operation.sheet),
          sheet: operation.sheet,
          savedLocalValues: operation.savedLocalValues,
        });
        completed.push(operation.sheetId);
      } else {
        await this.deps.registry.abandonPending(operation);
        abandoned.push(operation.sheetId);
      }
    }
    return { completed, abandoned };
  }

  /** Accepte une fiche ; en conflit, chaque champ concerné exige un choix explicite. */
  async accept(file: MovementCatalogueFile, sheetId: string, resolutions: ConflictResolutions = {}): Promise<AcceptOutcome> {
    const found = await this.freshItem(file, sheetId);
    if (!found) return { status: "UNKNOWN_SHEET" };
    const { item, sheet, local, referentials } = found;
    const key = { catalogueId: item.catalogueId, sheetId };

    switch (item.state) {
      case "ADOPTABLE":
        await this.deps.registry.commit(this.commitOf(key, sheet, item.movementId as string, []));
        return { status: "ADOPTED", movementId: item.movementId as string };

      case "NEW": {
        if (item.blockers.length > 0) return { status: "BLOCKED", blockers: item.blockers };
        const movement = projectSheetToMovement(sheet, this.deps.newMovementId());
        return this.write(key, sheet, "INSTALL", movement, [], "INSTALLED");
      }

      case "TO_RECONCILE":
      case "NEW_REVISION": {
        const current = local as Movement;
        const conflicts = item.summary.conflicts;
        const missing = conflicts.filter((field) => resolutions[field] === undefined);
        if (missing.length > 0) return { status: "RESOLUTION_REQUIRED", fields: missing };
        let target = current;
        const saved: SavedLocalValue[] = [];
        for (const entry of item.comparison) {
          if (!entry.projected) continue;
          const field = entry.path as ProjectedField;
          const take = entry.conflict
            ? resolutions[field] === "TAKE_INCOMING"
            : entry.incomingChanged && !entry.localModified;
          if (!take) continue;
          if (entry.conflict) saved.push({ field, value: localValueOf(current, field) });
          target = withProjectedValue(target, sheet, field);
        }
        if (sameProjected(target, current)) {
          await this.deps.registry.commit(this.commitOf(key, sheet, current.id, []));
          return { status: "REGISTERED", movementId: current.id };
        }
        const blockers = targetBlockers(target, referentials);
        if (blockers.length > 0) return { status: "BLOCKED", blockers };
        return this.write(key, sheet, "UPDATE", target, saved, "UPDATED");
      }

      default:
        return { status: "NOT_APPLICABLE", state: item.state };
    }
  }

  /** Reporte la révision : elle sera reproposée à chaque chargement. */
  defer(file: MovementCatalogueFile, sheetId: string): Promise<DecisionOutcome> {
    return this.decide(file, sheetId, "DEFERRED");
  }

  /** Refuse la révision : plus proposée jusqu'à une révision ultérieure. */
  refuse(file: MovementCatalogueFile, sheetId: string): Promise<DecisionOutcome> {
    return this.decide(file, sheetId, "REFUSED");
  }

  private async decide(file: MovementCatalogueFile, sheetId: string, decision: "DEFERRED" | "REFUSED"): Promise<DecisionOutcome> {
    const found = await this.freshItem(file, sheetId);
    if (!found) return { status: "UNKNOWN_SHEET" };
    if (!DECIDABLE.has(found.item.state)) return { status: "NOT_APPLICABLE", state: found.item.state };
    await this.deps.registry.recordDecision({ catalogueId: found.item.catalogueId, sheetId }, found.sheet.revision, decision);
    return { status: "RECORDED" };
  }

  private async plan(file: MovementCatalogueFile): Promise<CatalogueLoadPlan> {
    const [registry, entries, referentials] = await Promise.all([
      this.deps.registry.state(file.catalogue.id),
      this.deps.readLocalMovements(),
      this.deps.listReferentials(),
    ]);
    return planCatalogueLoad(file, registry, entries, referentials);
  }

  /** Recalcule l'état de la fiche à partir des données actuelles (jamais d'un plan ancien). */
  private async freshItem(file: MovementCatalogueFile, sheetId: string): Promise<{
    item: SheetLoadItem; sheet: CatalogueSheet; local: Movement | null; referentials: LocalReferentials;
  } | null> {
    const sheet = file.sheets.find((candidate) => candidate.sheetId === sheetId);
    if (!sheet) return null;
    const [registry, entries, referentials] = await Promise.all([
      this.deps.registry.state(file.catalogue.id),
      this.deps.readLocalMovements(),
      this.deps.listReferentials(),
    ]);
    const plan = planCatalogueLoad(
      { ...file, sheets: [sheet] },
      registry,
      entries,
      referentials,
    );
    const item = plan.items[0] as SheetLoadItem;
    const local = entries.find((entry) => entry.movement.id === item.movementId)?.movement ?? null;
    return { item, sheet, local, referentials };
  }

  /** Intention durable → écriture du Mouvement → confirmation atomique du registre. */
  private async write(
    key: { catalogueId: string; sheetId: string },
    sheet: CatalogueSheet,
    kind: "INSTALL" | "UPDATE",
    movement: Movement,
    saved: readonly SavedLocalValue[],
    success: "INSTALLED" | "UPDATED",
  ): Promise<AcceptOutcome> {
    await this.deps.registry.beginPending({ ...key, kind, movementId: movement.id, sheet, movement, savedLocalValues: saved });
    // Une exception laisse l'opération en cours : `recoverInterrupted` la confirmera ou l'abandonnera.
    const result = kind === "INSTALL"
      ? await this.deps.movements.createIndependent(movement)
      : await this.deps.movements.updateFromSource(movement);
    if (result.status !== "SAVED") {
      await this.deps.registry.abandonPending(key);
      return { status: "MOVEMENT_REFUSED", reason: result.status };
    }
    await this.deps.registry.commit(this.commitOf(key, sheet, result.movement.id, saved));
    return { status: success, movementId: result.movement.id };
  }

  private commitOf(
    key: { catalogueId: string; sheetId: string },
    sheet: CatalogueSheet,
    movementId: string,
    saved: readonly SavedLocalValue[],
  ) {
    return {
      ...key,
      movementId,
      revision: sheet.revision,
      fingerprint: sheetFingerprint(sheet),
      sheet,
      savedLocalValues: saved,
    };
  }
}

function targetBlockers(target: Movement, referentials: LocalReferentials): SheetBlocker[] {
  const blockers: SheetBlocker[] = [];
  if (!referentials.categoryIds.has(target.categoryId)) {
    blockers.push({ code: "LOCAL_REFERENCE_MISSING", field: "categoryId", ids: [target.categoryId] });
  }
  const zones = target.bodyZoneIds.filter((id) => !referentials.bodyZoneIds.has(id));
  if (zones.length > 0) blockers.push({ code: "LOCAL_REFERENCE_MISSING", field: "bodyZoneIds", ids: zones });
  return blockers;
}
