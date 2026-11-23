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
 * les écrans) ; médias, famille et archivage locaux ne sont jamais modifiés par la projection.
 * [Phases : depuis le format 3.0.0 (18/11/2026, MOUV-UX-20261117), les phases de la fiche source sont un champ
 * projeté — installées, puis mises à jour aux révisions acceptées, avec la même protection des valeurs locales.]
 *
 * [Famille de niveaux — décision de Hermann du 11/11/2026 : la famille portée par la fiche est appliquée
 * après l'acceptation (`catalogueFamilies.ts`), sauf si l'appartenance a été modifiée sur le téléphone
 * depuis l'installation ; médias, phases et archivage locaux restent intouchés.]
 *
 * L'interface utilisateur relève de CA-4.
 */
import type { Movement } from "@/domain/activities/Movement";
import { catalogueFamilyAction, orderedCatalogueFamily, type FamilySlot } from "@/domain/catalogue/catalogueFamilies";
import {
  parseMovementCatalogueFile,
  projectSheetToMovement,
  sheetFingerprint,
  withoutInternalNotes,
  type CatalogueIssue,
  type CatalogueSheet,
  type CatalogueWarning,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  PROJECTED_FIELDS,
  isPendingPersonalAttachment,
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
import { catalogueMediaFiles, sameMediaLinks, withCatalogueMedia, type CatalogueMediaFile } from "@/domain/catalogue/catalogueMedia";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
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
  /** Familles de niveaux des fiches (11/11/2026) ; absent : les familles ne sont pas appliquées. */
  readonly families?: Pick<MovementCatalogueService, "findMovement" | "listFamilyMembers" | "setFamilyOrder" | "leaveFamily">;
  /**
   * Photos de la fiche enregistrées comme médias du Mouvement (décision du 19/11/2026, `catalogueMedia.ts`) : écrit les
   * fichiers internes et rend les médias à relier. Absent : les médias du Mouvement ne sont pas touchés.
   */
  readonly catalogueMedia?: (files: readonly CatalogueMediaFile[]) => Promise<readonly DraftMediaItem[]>;
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
  | { readonly status: "UNKNOWN_SHEET" }
  /** A-2 : rattachement d'un Mouvement personnel non arbitré — rien n'est écrit. */
  | { readonly status: "PERSONAL_RULE_PENDING"; readonly movementId: string };

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
// Les phases sont comparées dans la forme de la fiche (`localValueOf` : durée explicite).

export class CatalogueLoadService {
  constructor(private readonly deps: CatalogueLoadDependencies) {}

  /** Validation, reprise des interruptions, classification. Aucune écriture de Mouvement. */
  async prepare(raw: unknown): Promise<PreparedCatalogueLoad> {
    const parsed = parseMovementCatalogueFile(raw);
    if (!parsed.ok) return { ok: false, issues: parsed.issues };
    // Notes internes de l'administration : jamais reçues par le destinataire (MOUV-ADM n° 5 et 28).
    const file = withoutInternalNotes(parsed.file);
    const recovery = await this.recoverInterrupted(file.catalogue.id);
    const plan = await this.plan(file);
    return { ok: true, file, warnings: parsed.warnings, recovery, plan };
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
      if (current && sameProjected(current, operation.movement) && sameMediaLinks(current, operation.movement)) {
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
    const outcome = await this.acceptItem(file, sheetId, resolutions, found);
    if (outcome.status === "INSTALLED" || outcome.status === "ADOPTED" || outcome.status === "UPDATED" ||
        outcome.status === "REGISTERED") {
      // Base : famille de la fiche installée avant cette acceptation (`undefined` : jamais installée).
      const base = found.installed === null ? undefined : found.installed.levelGroup ?? null;
      await this.applyFamily(file, found.sheet, outcome.movementId, outcome.status === "INSTALLED" ? undefined : base);
    }
    return outcome;
  }

  private async acceptItem(
    file: MovementCatalogueFile,
    sheetId: string,
    resolutions: ConflictResolutions,
    found: NonNullable<Awaited<ReturnType<CatalogueLoadService["freshItem"]>>>,
  ): Promise<AcceptOutcome> {
    const { item, sheet, local, referentials } = found;
    const key = { catalogueId: item.catalogueId, sheetId };
    if (isPendingPersonalAttachment(sheet, item)) return { status: "PERSONAL_RULE_PENDING", movementId: item.movementId as string };

    switch (item.state) {
      case "ADOPTABLE": {
        // Mouvement identique à la fiche : seuls les médias de la fiche peuvent manquer (19/11/2026).
        const adopted = local === null ? null : await this.withSheetMedia(item.catalogueId, sheet, local);
        if (local !== null && adopted !== null && !sameMediaLinks(adopted, local)) {
          return this.write(key, sheet, "UPDATE", adopted, [], "ADOPTED");
        }
        await this.deps.registry.commit(this.commitOf(key, sheet, item.movementId as string, []));
        return { status: "ADOPTED", movementId: item.movementId as string };
      }

      case "NEW": {
        if (item.blockers.length > 0) return { status: "BLOCKED", blockers: item.blockers };
        const movement = await this.withSheetMedia(item.catalogueId, sheet, projectSheetToMovement(sheet, this.deps.newMovementId()));
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
        // Une mise à jour remplace les médias venus de la fiche ; les autres médias du Mouvement restent (19/11/2026).
        target = await this.withSheetMedia(item.catalogueId, sheet, target);
        if (sameProjected(target, current) && sameMediaLinks(target, current)) {
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
    installed: CatalogueSheet | null;
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
    const installed = registry.installed.find((record) => record.sheetId === sheetId)?.sheet ?? null;
    return { item, sheet, local, referentials, installed };
  }

  /**
   * Famille de niveaux de la fiche (décision du 11/11/2026) : identifiant propre au catalogue, membres
   * importés rangés par la clé de leur fiche, appartenance modifiée localement conservée. Une erreur ici
   * n'annule pas l'acceptation déjà confirmée ; la famille sera réappliquée à la prochaine révision.
   */
  private async applyFamily(
    file: MovementCatalogueFile,
    sheet: CatalogueSheet,
    movementId: string,
    base: CatalogueSheet["levelGroup"] | undefined,
  ): Promise<void> {
    const families = this.deps.families;
    if (!families) return;
    try {
      const movement = await families.findMovement(movementId);
      if (!movement) return;
      const incoming = sheet.levelGroup ?? null;
      const action = catalogueFamilyAction({
        catalogueId: file.catalogue.id,
        base: base === undefined ? undefined : base ?? null,
        incoming,
        localGroupId: movement.levelGroup?.groupId ?? null,
      });
      if (action.kind === "NONE" || action.kind === "KEEP_LOCAL") return;
      if (action.kind === "LEAVE" || action.leaveFirst) await families.leaveFamily(movementId);
      if (action.kind === "LEAVE" || incoming === null) return;
      // Clé de fiche de chaque membre importé de la même famille : fichier courant, sinon fiche installée.
      const installed = (await this.deps.registry.state(file.catalogue.id)).installed;
      const sheets = new Map(file.sheets.map((entry) => [entry.sheetId, entry]));
      const keyOf = (memberId: string): number | null => {
        const record = installed.find((entry) => entry.movementId === memberId);
        if (!record) return null;
        const group = (sheets.get(record.sheetId) ?? record.sheet).levelGroup ?? null;
        return group !== null && group.groupId === incoming.groupId ? group.sortKey : null;
      };
      const members = await families.listFamilyMembers(action.groupId);
      const slots: FamilySlot[] = members.map((member) => ({ movementId: member.id, sortKey: keyOf(member.id) }));
      await families.setFamilyOrder(action.groupId, orderedCatalogueFamily(slots, movementId, incoming.sortKey));
    } catch {
      // Voir ci-dessus : l'acceptation reste acquise.
    }
  }

  /** Médias de la fiche reliés au Mouvement (fichiers écrits d'abord) ; sans écrivain injecté : Mouvement inchangé. */
  private async withSheetMedia(catalogueId: string, sheet: CatalogueSheet, movement: Movement): Promise<Movement> {
    const writer = this.deps.catalogueMedia;
    if (!writer) return movement;
    return withCatalogueMedia(movement, await writer(catalogueMediaFiles(catalogueId, sheet)));
  }

  /** Intention durable → écriture du Mouvement → confirmation atomique du registre. */
  private async write(
    key: { catalogueId: string; sheetId: string },
    sheet: CatalogueSheet,
    kind: "INSTALL" | "UPDATE",
    movement: Movement,
    saved: readonly SavedLocalValue[],
    success: "INSTALLED" | "UPDATED" | "ADOPTED",
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
