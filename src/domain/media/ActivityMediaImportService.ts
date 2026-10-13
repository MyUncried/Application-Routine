/**
 * PRE-3 (D-333/D-334/D-335) — orchestration PURE de l'import de médias
 * depuis la photothèque : acquisition système → copie interne stable →
 * élément de brouillon. Aucune écriture SQLite ici : l'asset et ses liens
 * sont créés par la transaction de son propriétaire (Terminer/Continuer).
 *
 * Décisions appliquées (D-335, option A) : sélection multiple ; formats
 * compatibles conservés sans conversion systématique ni plafond produit ;
 * annulation sans erreur ; état « Importation » visible puis erreur LOCALE
 * avec Réessayer ; brouillon toujours conservé. Aucune caméra, aucun micro.
 *
 * Les adaptateurs natifs (sélecteur, stockage) sont injectés : ce module
 * reste indépendant d'Expo et testable avec de vrais fichiers temporaires.
 */

import type { DraftMediaItem } from "./ActivityMedia";
import type { MediaAsset, MediaKind } from "./MediaAsset";
import { MediaDraftLeases } from "./MediaDraftLeases";

/** Média renvoyé par le sélecteur système (URI de cache, jamais persistée). */
export type PickedMedia = {
  readonly uri: string;
  readonly kind: MediaKind | null;
  readonly mimeType: string | null;
  readonly fileName: string | null;
  readonly sizeBytes: number | null;
  readonly durationMs: number | null;
  readonly width: number | null;
  readonly height: number | null;
  /** Identifiant natif de la photothèque — peut être `null` sans être fatal. */
  readonly nativeAssetId: string | null;
};

export type PickOutcome =
  | { readonly status: "PICKED"; readonly items: readonly PickedMedia[]; readonly limitedAccess: boolean }
  | { readonly status: "CANCELED" }
  | { readonly status: "PERMISSION_DENIED"; readonly canAskAgain: boolean }
  | { readonly status: "ERROR" };

/** Port du sélecteur système (photothèque seule, D-334). */
export interface MediaPickerPort {
  pickFromLibrary(): Promise<PickOutcome>;
  /** Android : résultat en attente après destruction de l'activité, lu une seule fois. */
  consumePendingResult?(): Promise<PickOutcome | null>;
}

/** Port de copie interne stable. */
export interface MediaCopyPort {
  /** Copie `source` sous un nom dérivé de `assetId` ; retourne l'URI INTERNE relative et la taille. */
  copyToInternal(source: PickedMedia, assetId: string): Promise<{ readonly uri: string; readonly sizeBytes: number | null }>;
  /** Octets disponibles, ou `null` si inconnu. */
  availableBytes(): number | null;
  /** Supprime une copie PRÉPARÉE (jamais un fichier référencé). */
  deletePrepared(uri: string): Promise<void>;
  /** URI absolue d'affichage d'une URI interne relative. */
  resolveUri?(uri: string): string;
}

export type ImportErrorCode = "COPY_FAILED" | "STORAGE_FULL" | "INCOMPATIBLE";

export type ImportItem =
  | { readonly key: string; readonly state: "IMPORTING"; readonly picked: PickedMedia }
  | { readonly key: string; readonly state: "READY"; readonly picked: PickedMedia; readonly media: DraftMediaItem }
  | { readonly key: string; readonly state: "FAILED"; readonly picked: PickedMedia; readonly error: ImportErrorCode };

export type ImportResult =
  | { readonly status: "IMPORTED"; readonly items: readonly ImportItem[]; readonly limitedAccess: boolean }
  | { readonly status: "CANCELED" }
  | { readonly status: "PERMISSION_DENIED"; readonly canAskAgain: boolean }
  | { readonly status: "ERROR" };

function inferKind(picked: PickedMedia): MediaKind | null {
  if (picked.kind) {
    return picked.kind;
  }
  if (picked.mimeType?.startsWith("image/")) {
    return "PHOTO";
  }
  if (picked.mimeType?.startsWith("video/")) {
    return "VIDEO";
  }
  return null;
}

export class ActivityMediaImportService {
  private pendingConsumed = false;
  /** URI des copies préparées (clé = identité stable de l'asset), pour le nettoyage gardé. */
  private readonly preparedUris = new Map<string, string>();

  constructor(
    private readonly picker: MediaPickerPort,
    private readonly store: MediaCopyPort,
    private readonly uuidFactory: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly leases: MediaDraftLeases = new MediaDraftLeases(),
  ) {}

  resolveUri(uri: string): string {
    return this.store.resolveUri?.(uri) ?? uri;
  }

  /** Assets préparés par ce brouillon et encore non enregistrés. */
  preparedAssetIds(draftId: string): readonly string[] {
    return this.leases.preparedByDraft(draftId);
  }

  /** Prête des assets déjà persistés (copie de Séance, réouverture) à un brouillon actif. */
  leaseExisting(draftId: string, assetIds: readonly string[]): void {
    for (const assetId of assetIds) {
      this.leases.lease(draftId, assetId);
    }
  }

  /** Enregistrement réussi : les copies deviennent des références persistées. */
  commitDraft(draftId: string): void {
    for (const assetId of this.leases.preparedByDraft(draftId)) {
      this.preparedUris.delete(assetId);
    }
    this.leases.commitDraft(draftId);
  }

  /**
   * Importe une sélection (ordre du sélecteur conservé). Chaque élément est
   * copié indépendamment : un échec n'affecte ni les autres, ni le brouillon.
   * `onProgress` reçoit l'état courant (Importation → Prêt/Erreur).
   */
  async importFromLibrary(
    draftId: string,
    onProgress?: (items: readonly ImportItem[]) => void,
  ): Promise<ImportResult> {
    const outcome = await this.picker.pickFromLibrary();
    return this.importOutcome(draftId, outcome, onProgress);
  }

  /**
   * Android : un résultat en attente (activité détruite pendant le
   * sélecteur) est importé UNE seule fois, jamais deux.
   */
  async importPendingResult(
    draftId: string,
    onProgress?: (items: readonly ImportItem[]) => void,
  ): Promise<ImportResult | null> {
    if (this.pendingConsumed || !this.picker.consumePendingResult) {
      return null;
    }
    this.pendingConsumed = true;
    const outcome = await this.picker.consumePendingResult();
    return outcome ? this.importOutcome(draftId, outcome, onProgress) : null;
  }

  private async importOutcome(
    draftId: string,
    outcome: PickOutcome,
    onProgress?: (items: readonly ImportItem[]) => void,
  ): Promise<ImportResult> {
    if (outcome.status !== "PICKED") {
      return outcome;
    }
    let items: ImportItem[] = outcome.items.map((picked) => ({
      key: this.uuidFactory(),
      state: "IMPORTING" as const,
      picked,
    }));
    onProgress?.(items);
    for (const [index, item] of items.entries()) {
      const finished = await this.copy(draftId, item.key, item.picked);
      items = items.map((current, position) => (position === index ? finished : current));
      onProgress?.(items);
    }
    return { status: "IMPORTED", items, limitedAccess: outcome.limitedAccess };
  }

  /** Réessayer un élément en erreur : même clé, donc jamais de doublon d'un élément déjà prêt. */
  async retry(draftId: string, item: ImportItem): Promise<ImportItem> {
    if (item.state === "READY") {
      return item;
    }
    return this.copy(draftId, item.key, item.picked);
  }

  private async copy(draftId: string, key: string, picked: PickedMedia): Promise<ImportItem> {
    const kind = inferKind(picked);
    if (!kind) {
      return { key, state: "FAILED", picked, error: "INCOMPATIBLE" };
    }
    const available = this.store.availableBytes();
    if (available !== null && picked.sizeBytes !== null && picked.sizeBytes > available) {
      return { key, state: "FAILED", picked, error: "STORAGE_FULL" };
    }
    try {
      const copied = await this.store.copyToInternal(picked, key);
      const asset: MediaAsset = {
        id: key,
        uri: copied.uri,
        createdAt: this.now(),
        kind,
        mimeType: picked.mimeType,
        fileName: picked.fileName,
        sizeBytes: copied.sizeBytes ?? picked.sizeBytes,
        durationMs: kind === "VIDEO" ? picked.durationMs : null,
        width: picked.width && picked.width > 0 ? picked.width : null,
        height: picked.height && picked.height > 0 ? picked.height : null,
      };
      this.leases.registerPrepared(draftId, key);
      this.preparedUris.set(key, copied.uri);
      return { key, state: "READY", picked, media: { assetId: key, asset } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      return { key, state: "FAILED", picked, error: /space|ENOSPC|full/i.test(message) ? "STORAGE_FULL" : "COPY_FAILED" };
    }
  }

  /**
   * Abandon CONFIRMÉ d'un brouillon : supprime uniquement ses copies
   * préparées non référencées en base et non prêtées ailleurs (jamais une
   * purge globale). Les échecs de suppression sont ignorés : un fichier
   * conservé par erreur est préférable à une référence perdue.
   */
  async cleanupAbandonedDraft(draftId: string, persistedAssetIds: ReadonlySet<string>): Promise<readonly string[]> {
    const eligible = this.leases.releaseDraft(draftId, persistedAssetIds);
    const deleted: string[] = [];
    for (const assetId of eligible) {
      const uri = this.preparedUris.get(assetId);
      this.preparedUris.delete(assetId);
      if (!uri) {
        continue;
      }
      try {
        await this.store.deletePrepared(uri);
        deleted.push(assetId);
      } catch {
        // Conservation plutôt que suppression incertaine.
      }
    }
    return deleted;
  }
}

/** Éléments prêts, dans l'ordre de la sélection — à ajouter EN FIN de la liste du brouillon (D-033). */
export function readyMedia(items: readonly ImportItem[]): readonly DraftMediaItem[] {
  return items.flatMap((item) => (item.state === "READY" ? [item.media] : []));
}
