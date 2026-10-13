/**
 * PRE-3 (D-333, `schema-et-ecritures.md` §Médias) — registre des PRÊTS de
 * fichiers préparés aux brouillons actifs.
 *
 * Un fichier copié par l'import appartient d'abord au brouillon qui l'a
 * préparé. Tant qu'un brouillon (définition ou copie de Séance) le
 * référence, il est prêté et ne peut pas être nettoyé. Après un abandon
 * CONFIRMÉ, seuls les fichiers préparés par CE brouillon, non référencés en
 * base et non prêtés à un autre brouillon actif, deviennent éligibles au
 * nettoyage. Aucune purge globale n'existe : un orphelin après crash est
 * conservé plutôt que de risquer la suppression d'une référence non observée.
 */
export class MediaDraftLeases {
  private readonly preparedBy = new Map<string, string>();
  private readonly leases = new Map<string, Set<string>>();

  /** Enregistre un fichier fraîchement préparé par ce brouillon (et le lui prête). */
  registerPrepared(draftId: string, assetId: string): void {
    if (!this.preparedBy.has(assetId)) {
      this.preparedBy.set(assetId, draftId);
    }
    this.lease(draftId, assetId);
  }

  /** Prête un asset (déjà persisté ou préparé) à un brouillon actif. */
  lease(draftId: string, assetId: string): void {
    const owners = this.leases.get(assetId) ?? new Set<string>();
    owners.add(draftId);
    this.leases.set(assetId, owners);
  }

  isLeased(assetId: string, exceptDraftId?: string): boolean {
    const owners = this.leases.get(assetId);
    if (!owners) {
      return false;
    }
    return [...owners].some((owner) => owner !== exceptDraftId);
  }

  /** Assets préparés par ce brouillon (dans l'ordre d'enregistrement). */
  preparedByDraft(draftId: string): readonly string[] {
    return [...this.preparedBy.entries()].filter(([, owner]) => owner === draftId).map(([assetId]) => assetId);
  }

  /**
   * Abandon confirmé : libère les prêts de ce brouillon et retourne les seuls
   * fichiers ÉLIGIBLES au nettoyage — préparés par lui, absents de
   * `persistedAssetIds` (liens Catalogue/copies observés en base) et non
   * prêtés à un autre brouillon actif.
   */
  releaseDraft(draftId: string, persistedAssetIds: ReadonlySet<string>): readonly string[] {
    const eligible = this.preparedByDraft(draftId).filter(
      (assetId) => !persistedAssetIds.has(assetId) && !this.isLeased(assetId, draftId),
    );
    for (const [assetId, owners] of this.leases) {
      owners.delete(draftId);
      if (owners.size === 0) {
        this.leases.delete(assetId);
      }
    }
    for (const assetId of this.preparedByDraft(draftId)) {
      this.preparedBy.delete(assetId);
    }
    return eligible;
  }

  /** Enregistrement réussi : les fichiers deviennent des références persistées, plus des préparations. */
  commitDraft(draftId: string): void {
    for (const assetId of this.preparedByDraft(draftId)) {
      this.preparedBy.delete(assetId);
    }
    for (const [assetId, owners] of this.leases) {
      owners.delete(draftId);
      if (owners.size === 0) {
        this.leases.delete(assetId);
      }
    }
  }
}
