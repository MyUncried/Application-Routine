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
 * Hors premier lot (A-4) : désinstallation, Bibliothèques personnelles et partagées.
 */
import type { CatalogueIssue, CatalogueLibrary, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import {
  libraryTargetKey,
  planLibrary,
  type InstalledLibraryRecord,
  type LibraryKey,
  type LibraryOperation,
  type LibraryPreview,
} from "@/domain/catalogue/libraryPlan";
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
  >;
  readonly load: Pick<CatalogueLoadService, "prepare" | "accept">;
};

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
    const prepared = await this.deps.load.prepare(raw);
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
