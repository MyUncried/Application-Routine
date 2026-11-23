/**
 * A1 — Service des Bibliothèques (Profil → Bibliothèques), indépendant de l'interface.
 *
 * Réemploie le chargement CA-3 (`CatalogueLoadService`) fiche par fiche : mêmes validations, même
 * protocole intention durable → écriture du Mouvement → confirmation du registre, même reprise.
 * Aucun second modèle ni seconde logique de persistance.
 *
 * - `available(raw)` : Bibliothèques d'un fichier (sélectionné ou reçu de l'administration) et leur état.
 * - `preview(file, libraryId)` : aperçu avant installation ou mise à jour (Figma 12118:25170, 12118:25251).
 * - `apply(file, libraryId)` : action explicite « Installer » / « Mettre à jour » (BIB-22, F4-D) :
 *   nouvelles fiches installées, fiches identiques rattachées sans doublon, révisions sans conflit
 *   appliquées ; fiches en conflit ou à rapprocher laissées à l'examen fiche par fiche (MOUV-D4).
 * - `resume()` : reprise d'une installation ou d'une mise à jour interrompue (Figma 12119:25245).
 * - `defer` / `refuse` : « Reporter » / « Refuser » une mise à jour de Bibliothèque (Figma 12118:25251).
 *
 * - `uninstallPreview` / `uninstall` : « Désinstaller la bibliothèque » (Figma 12098:115 ; décisions de Hermann du
 *   13/11/2026, ajoutée au lot). Les Mouvements utilisés dans une Séance, dans une autre Bibliothèque installée ou
 *   dans une Bibliothèque personnelle restent dans le Catalogue ; les autres le quittent.
 *
 * [Remplacé le 13/11/2026 : « Hors premier lot (A-4) : désinstallation, Bibliothèques personnelles et partagées. »]
 */
import {
  diffusableCatalogue,
  parseMovementCatalogueFile,
  type CatalogueIssue,
  type CatalogueLibrary,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import {
  libraryTargetKey,
  planLibrary,
  type InstalledLibraryRecord,
  type LibraryKey,
  type LibraryOperation,
  type LibraryPreview,
} from "@/domain/catalogue/libraryPlan";
import type { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import type { AcceptOutcome, CatalogueLoadService, RecoveryReport } from "@/features/catalogue/CatalogueLoadService";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";

export type LibraryServiceDependencies = {
  readonly registry: Pick<
    SqliteCatalogueRegistry,
    | "allInstalledSheets"
    | "installedLibraries"
    | "libraryOperations"
    | "libraryDecisions"
    | "beginLibraryOperation"
    | "commitLibrary"
    | "recordLibraryDecision"
  > & Partial<Pick<SqliteCatalogueRegistry, "personalLibraries" | "uninstallLibrary" | "saveReferences">>;
  readonly load: Pick<CatalogueLoadService, "prepare" | "accept">;
  /** Désinstallation : absent, `uninstall` est indisponible (doublures antérieures). */
  readonly movements?: Pick<MovementCatalogueService, "removeForUninstall" | "sessionUseCount">;
};

/** Pourquoi un Mouvement reste au Catalogue après la désinstallation. */
export type UninstallKeepReason = "SESSION" | "OTHER_LIBRARY" | "PERSONAL_LIBRARY";

export type UninstallPreview = LibraryKey & {
  readonly title: string;
  /** Mouvements qui quitteront le Catalogue. */
  readonly removed: number;
  /** Mouvements qui resteront, avec leur raison. */
  readonly kept: number;
  readonly keptBy: Readonly<Record<UninstallKeepReason, number>>;
};

export type UninstallReport = LibraryKey & { readonly title: string; readonly removed: number; readonly kept: number };

export type AvailableLibraries =
  | { readonly ok: false; readonly issues: readonly CatalogueIssue[] }
  | {
      readonly ok: true;
      readonly file: MovementCatalogueFile;
      readonly recovery: RecoveryReport;
      readonly previews: readonly LibraryPreview[];
    };

export type LibraryApplyReport = LibraryKey & {
  readonly title: string;
  readonly revision: string;
  readonly kind: "INSTALL" | "UPDATE";
  readonly added: number;
  readonly attached: number;
  readonly updated: number;
  /** Retirées de la composition : elles restent dans le Catalogue. */
  readonly removed: number;
  /** F4-G : fiches mises à jour aussi présentes dans d'autres Bibliothèques installées. */
  readonly alsoIn: Readonly<Record<string, readonly string[]>>;
  /** Fiches non appliquées : examen fiche par fiche (aucun écrasement). */
  readonly toReview: number;
  /** Fiches refusées pendant l'écriture (Mouvement invalide, nom déjà pris…), sans autre effet. */
  readonly failed: readonly { readonly sheetId: string; readonly outcome: AcceptOutcome }[];
};

export type LibraryProgress = LibraryKey & {
  readonly title: string;
  readonly revision: string;
  readonly kind: "INSTALL" | "UPDATE";
  /** Fiches internes déjà appliquées (à jour), sur le total des fiches internes. */
  readonly applied: number;
  readonly total: number;
  readonly file: MovementCatalogueFile;
};

export class LibraryService {
  constructor(private readonly deps: LibraryServiceDependencies) {}

  /** Bibliothèques installées sur l'appareil (registre). */
  installed(): Promise<readonly InstalledLibraryRecord[]> {
    return this.deps.registry.installedLibraries();
  }

  /** Bibliothèques d'un fichier, avec leur état et leur aperçu. Aucune écriture de Mouvement. */
  async available(raw: unknown): Promise<AvailableLibraries> {
    // MOUV-D2, décision de Hermann du 12/11/2026 : un fichier ne diffuse aucune fiche dont un média n'a
    // pas de droits confirmés, quelle que soit son origine. Ces fiches sont retirées sans message
    // (« L'utilisateur n'a pas besoin de savoir qu'une fiche a été retenue, c'est le problème de l'expéditeur »).
    let source: unknown = raw;
    const parsed = parseMovementCatalogueFile(raw);
    if (parsed.ok) {
      const diffusable = diffusableCatalogue(parsed.file);
      if (!diffusable.ok) return { ok: false, issues: diffusable.issues };
      // Version diffusable dans tous les cas : elle retire aussi les notes internes (format 3.0.0).
      source = diffusable.file;
    }
    const prepared = await this.deps.load.prepare(source);
    if (!prepared.ok) return { ok: false, issues: prepared.issues };
    const context = await this.context(prepared.plan);
    return {
      ok: true,
      file: prepared.file,
      recovery: prepared.recovery,
      previews: prepared.file.libraries.map((library) => planLibrary(prepared.file, library, context)),
    };
  }

  /** Aperçu d'une Bibliothèque du fichier, recalculé sur les données actuelles. */
  async preview(file: MovementCatalogueFile, libraryId: string): Promise<LibraryPreview | null> {
    const library = file.libraries.find((entry) => entry.libraryId === libraryId);
    if (!library) return null;
    const prepared = await this.deps.load.prepare(file);
    if (!prepared.ok) return null;
    return planLibrary(prepared.file, library, await this.context(prepared.plan));
  }

  /**
   * Action explicite « Installer » ou « Mettre à jour ». L'intention est enregistrée avant toute
   * écriture ; chaque fiche suit le protocole CA-3 ; la composition est confirmée à la fin.
   */
  async apply(file: MovementCatalogueFile, libraryId: string): Promise<LibraryApplyReport | null> {
    const library = file.libraries.find((entry) => entry.libraryId === libraryId);
    if (!library) return null;
    const before = await this.preview(file, libraryId);
    if (!before) return null;
    const key: LibraryKey = { catalogueId: file.catalogue.id, libraryId };
    const kind = before.installedRevision === null ? "INSTALL" : "UPDATE";
    const targetKey = libraryTargetKey(file, library);
    await this.deps.registry.beginLibraryOperation({ ...key, kind, targetKey, file });
    return this.run(file, library, kind, before);
  }

  /** Opérations interrompues, avec leur progression (aucune écriture). */
  async interrupted(): Promise<readonly LibraryProgress[]> {
    const operations = await this.deps.registry.libraryOperations();
    const result: LibraryProgress[] = [];
    for (const operation of operations) {
      const progress = await this.progressOf(operation);
      if (progress) result.push(progress);
    }
    return result;
  }

  /** « Reprendre la mise à jour » : continue là où l'opération s'est arrêtée, sans rien refaire. */
  async resume(key: LibraryKey): Promise<LibraryApplyReport | null> {
    const operation = (await this.deps.registry.libraryOperations())
      .find((entry) => entry.catalogueId === key.catalogueId && entry.libraryId === key.libraryId);
    if (!operation) return null;
    const library = operation.file.libraries.find((entry) => entry.libraryId === key.libraryId);
    if (!library) return null;
    const preview = await this.preview(operation.file, key.libraryId);
    if (!preview) return null;
    return this.run(operation.file, library, operation.kind, preview);
  }

  /** « Reporter » : la mise à jour reste proposée ; rien n'est écrit sur les Mouvements. */
  defer(file: MovementCatalogueFile, libraryId: string): Promise<void> {
    return this.decide(file, libraryId, "DEFERRED");
  }

  /** « Refuser » : cette mise à jour précise n'est plus proposée ; une révision ultérieure le sera. */
  refuse(file: MovementCatalogueFile, libraryId: string): Promise<void> {
    return this.decide(file, libraryId, "REFUSED");
  }

  /** Aperçu de « Désinstaller la bibliothèque » (confirmation), sans écriture ; `null` si elle n'est pas installée. */
  async uninstallPreview(key: LibraryKey): Promise<UninstallPreview | null> {
    const plan = await this.uninstallPlan(key);
    if (!plan) return null;
    const movements = this.requireMovements();
    const keptBy: Record<UninstallKeepReason, number> = { SESSION: 0, OTHER_LIBRARY: 0, PERSONAL_LIBRARY: 0 };
    let removed = 0;
    for (const member of plan.members) {
      if (member.movementId === null) continue;
      const reason = member.keep ?? ((await movements.sessionUseCount(member.movementId)) > 0 ? "SESSION" : null);
      if (reason) keptBy[reason] += 1;
      else removed += 1;
    }
    const kept = keptBy.SESSION + keptBy.OTHER_LIBRARY + keptBy.PERSONAL_LIBRARY;
    return { ...key, title: plan.title, removed, kept, keptBy };
  }

  /**
   * « Désinstaller la bibliothèque » : retire du Catalogue les Mouvements qu'aucune Séance, aucune autre Bibliothèque
   * installée ni aucune Bibliothèque personnelle n'utilise, puis la Bibliothèque du registre. Rejouable après interruption.
   */
  async uninstall(key: LibraryKey): Promise<UninstallReport | null> {
    const plan = await this.uninstallPlan(key);
    if (!plan) return null;
    const movements = this.requireMovements();
    const uninstallLibrary = this.deps.registry.uninstallLibrary;
    if (!uninstallLibrary) throw new Error("Désinstallation indisponible : registre incomplet.");
    const removedSheets: { catalogueId: string; sheetId: string }[] = [];
    let removed = 0;
    let kept = 0;
    for (const member of plan.members) {
      const sheet = { catalogueId: member.catalogueId, sheetId: member.sheetId };
      if (member.movementId === null) continue;
      if (member.keep) {
        kept += 1;
        continue;
      }
      const outcome = await movements.removeForUninstall(member.movementId);
      if (outcome.status === "REFERENCED") {
        kept += 1;
        continue;
      }
      removedSheets.push(sheet);
      removed += 1;
    }
    await uninstallLibrary.call(this.deps.registry, key, removedSheets);
    return { ...key, title: plan.title, removed, kept };
  }

  private requireMovements() {
    if (!this.deps.movements) throw new Error("Désinstallation indisponible : service des Mouvements absent.");
    return this.deps.movements;
  }

  /** Membres de la Bibliothèque, leur Mouvement et la raison connue sans la base principale de les garder. */
  private async uninstallPlan(key: LibraryKey) {
    const libraries = await this.deps.registry.installedLibraries();
    const record = libraries.find((entry) => entry.catalogueId === key.catalogueId && entry.libraryId === key.libraryId);
    if (!record) return null;
    const sheetKey = (catalogueId: string, sheetId: string) => catalogueId + "/" + sheetId;
    const movementOf = new Map((await this.deps.registry.allInstalledSheets())
      .map((sheet) => [sheetKey(sheet.catalogueId, sheet.sheetId), sheet.movementId]));
    const inOtherLibrary = new Set(libraries
      .filter((entry) => entry !== record)
      .flatMap((entry) => entry.library.members.map((member) => sheetKey(member.catalogueId, member.sheetId))));
    const personal = this.deps.registry.personalLibraries ? await this.deps.registry.personalLibraries.call(this.deps.registry) : [];
    const inPersonalLibrary = new Set(personal.flatMap((library) => library.movementIds));
    const members = record.library.members.map((member) => {
      const key2 = sheetKey(member.catalogueId, member.sheetId);
      const movementId = movementOf.get(key2) ?? null;
      const keep: UninstallKeepReason | null = inOtherLibrary.has(key2)
        ? "OTHER_LIBRARY"
        : movementId !== null && inPersonalLibrary.has(movementId) ? "PERSONAL_LIBRARY" : null;
      return { catalogueId: member.catalogueId, sheetId: member.sheetId, movementId, keep };
    });
    return { title: record.library.title, members };
  }

  private async decide(file: MovementCatalogueFile, libraryId: string, decision: "DEFERRED" | "REFUSED"): Promise<void> {
    const library = file.libraries.find((entry) => entry.libraryId === libraryId);
    if (!library) return;
    await this.deps.registry.recordLibraryDecision(
      { catalogueId: file.catalogue.id, libraryId }, libraryTargetKey(file, library), decision);
  }

  private async run(
    file: MovementCatalogueFile,
    library: CatalogueLibrary,
    kind: "INSTALL" | "UPDATE",
    preview: LibraryPreview,
  ): Promise<LibraryApplyReport> {
    const failed: { sheetId: string; outcome: AcceptOutcome }[] = [];
    const counts = { added: 0, attached: 0, updated: 0 };
    const steps: [readonly { sheetId: string }[], keyof typeof counts][] = [
      [preview.added, "added"],
      [preview.attached, "attached"],
      [preview.modified, "updated"],
    ];
    for (const [items, counter] of steps) {
      for (const item of items) {
        let outcome: AcceptOutcome;
        try {
          outcome = await this.deps.load.accept(file, item.sheetId);
        } catch (error) {
          // Revue du 11/11 : une erreur déterministe sur une fiche ne bloque pas toute la Bibliothèque. Le protocole
          // CA-3 laisse l'opération de la fiche en attente ; elle est reprise ou abandonnée au prochain chargement.
          outcome = { status: "MOVEMENT_REFUSED", reason: error instanceof Error ? error.message : String(error) };
        }
        if (outcome.status === "INSTALLED" || outcome.status === "ADOPTED" || outcome.status === "UPDATED" ||
            outcome.status === "REGISTERED") {
          counts[counter] += 1;
        } else {
          failed.push({ sheetId: item.sheetId, outcome });
        }
      }
    }
    const key: LibraryKey = { catalogueId: file.catalogue.id, libraryId: library.libraryId };
    // Référentiels de classification du catalogue, pour les filtres validés (format 3.0.0).
    await this.deps.registry.saveReferences?.(file.catalogue.id, file.references);
    await this.deps.registry.commitLibrary(key, library, libraryTargetKey(file, library));
    return {
      ...key,
      title: library.title,
      revision: library.revision,
      kind,
      ...counts,
      removed: preview.removed.length,
      alsoIn: preview.alsoIn,
      toReview: preview.toReview.length,
      failed,
    };
  }

  private async progressOf(operation: LibraryOperation): Promise<LibraryProgress | null> {
    const library = operation.file.libraries.find((entry) => entry.libraryId === operation.libraryId);
    if (!library) return null;
    const preview = await this.preview(operation.file, operation.libraryId);
    if (!preview) return null;
    const total = preview.added.length + preview.attached.length + preview.modified.length + preview.unchanged.length +
      preview.toReview.length;
    return {
      catalogueId: operation.catalogueId,
      libraryId: operation.libraryId,
      title: library.title,
      revision: library.revision,
      kind: operation.kind,
      applied: preview.unchanged.length,
      total,
      file: operation.file,
    };
  }

  private async context(plan: Parameters<typeof planLibrary>[2]["plan"]) {
    // Lectures successives : une transaction exclusive à la fois sur la base du registre.
    const installedSheets = await this.deps.registry.allInstalledSheets();
    const installedLibraries = await this.deps.registry.installedLibraries();
    const operations = await this.deps.registry.libraryOperations();
    const decisions = await this.deps.registry.libraryDecisions();
    return { plan, installedSheets, installedLibraries, operations, decisions };
  }
}
