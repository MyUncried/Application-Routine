/**
 * Orchestration applicative du Mouvement et des référentiels (Catégories, Zones, Étiquettes, médias)
 * — même patron que `@/features/sessions/SessionService` : ne dépend que du Domaine et des
 * interfaces de dépôt, jamais de React, Expo ou d'une implémentation concrète (injectées par le
 * constructeur).
 *
 * [PRE-9 A.3 du 04/11/2026 : les opérations des anciennes définitions d'Exercice du Catalogue
 * (création, modification, correction partagée, lecture, sélection) sont retirées avec elles —
 * décision de Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 :
 * les anciens exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. »
 * Le nom du service est conservé (aucun renommage, pour limiter le volume du changement).]
 */

import type { Movement } from "@/domain/activities/Movement";
import { movementLevelPosition, type MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { MovementRepository } from "@/domain/activities/MovementRepository";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import type { Label } from "@/domain/labels/Label";
import type { LabelRepository } from "@/domain/labels/LabelRepository";
import type {
  ActivityMediaImportService,
  ImportItem,
  ImportResult,
} from "@/domain/media/ActivityMediaImportService";
import type { MediaRepository } from "@/domain/media/MediaRepository";

/**
 * PRE-3 (D-333/D-334/D-335) — adaptateurs médias injectés par
 * `SessionServiceProvider` sur la MÊME connexion SQLite (lecture des
 * références) ; l'écriture des assets/liens reste dans la transaction du
 * Repository propriétaire (Terminer/Continuer).
 */
export type ActivityMediaAdapters = {
  readonly importService: ActivityMediaImportService;
  readonly repository: MediaRepository;
};

/**
 * PRE-7 (A2.3, MFN-04, MFN-05, MFN-06) : geste proposé par la recherche ou la suggestion — le geste
 * et sa position de niveau dérivée (`null` sans groupe ou pour un singleton). Rangs calculés, jamais
 * persistés. [PRE-9 A.3 du 04/11/2026 : le nombre d'Exercices du Catalogue (`definitionCount`) est
 * retiré avec les anciennes définitions.]
 */
export type MovementChoice = {
  readonly movement: Movement;
  readonly level: MovementLevelPosition | null;
  /**
   * PRE-8 (B.8, Q6) : Mouvement archivé — jamais proposé pour créer un nouvel Exercice ; reste
   * compté par le contrôle d'unicité du nom (C01).
   */
  readonly archived?: boolean;
};

/**
 * PRE-7 (A3.1, D-439, MFN-05, MFN-07, MFN-10) : un niveau du groupe d'un geste — le geste membre et
 * son rang dérivé (1..total, ordre des clés de tri). [PRE-9 A.3 du 04/11/2026 : ses Exercices du
 * Catalogue (`definitions`) sont retirés avec les anciennes définitions.]
 */
export type MovementLevelEntry = {
  readonly movement: Movement;
  readonly rank: number;
  /** PRE-8 (B.8, Q5, Q6) : membre archivé — garde son rang, n'est pas sélectionnable pour un Exercice. */
  readonly archived?: boolean;
};

/**
 * PRE-7 (A3.1, MFN-05) : niveaux d'un geste. `position` : rang et total dérivés, `null` sans groupe
 * ou pour un singleton (rang masqué, jamais un faux « Niveau 1 ») ; `levels` : membres ordonnés,
 * vide quand `position` est `null`. Rien n'est persisté.
 */
export type MovementLevels = {
  readonly position: MovementLevelPosition | null;
  readonly levels: readonly MovementLevelEntry[];
};

/**
 * PRE-7 (A3.2, MFN-05, MFN/AC07) : issue d'un réordonnancement des niveaux — niveaux relus après
 * l'écriture (rangs recalculés) ; `NOT_FOUND` : geste inconnu, sans groupe, ou service sans
 * `MovementRepository` ; `INVALID_ORDER` : pas une permutation exacte des membres (rien n'est écrit).
 */
export type ReorderMovementLevelsResult =
  | { readonly status: "OK"; readonly levels: MovementLevels }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "INVALID_ORDER" };

export class ActivityDefinitionService {
  /**
   * `categoryRepository` (V2-PRE-1, D-211) reste optionnel pour ne pas
   * casser un appelant construit avant cette tranche (même patron que
   * `SessionService.categoryRepository`) : `listCategories()` est appelée par le
   * sélecteur de Catégorie de l'éditeur d'Activité et, en lecture seule, par
   * `useCategoriesReferential` (cartes de la Composition, PRE-6 story 2.2).
   */
  /**
   * `bodyZoneRepository` (V2-PRE-1, device check Hermann, commentaire
   * 5948936550) : même patron que `categoryRepository` ci-dessus — optionnel
   * pour ne pas casser un appelant construit avant cette correction.
   * `listBodyZones()` est consommée par les écrans qui s'auto-alimentaient
   * jusqu'ici directement via `useSQLiteContext` (toujours en échec en
   * production, ces écrans étant rendus hors de `<SQLiteProvider>` —
   * architecture T01-S05) : le référentiel transite désormais par CE
   * service, déjà accessible depuis tout l'arbre applicatif via
   * `ActivityDefinitionServiceContext`.
   */
  /**
   * `labelRepository` (V2-PRE-1, revue indépendante 5950755410) : même
   * patron que `bodyZoneRepository` ci-dessus — optionnel pour ne pas casser
   * un appelant construit avant cette correction. `listLabels()` est
   * consommée par `CompositionScreen`, qui s'auto-alimentait jusqu'ici
   * directement via `useSQLiteContext`/`SqliteLabelRepository` (toujours en
   * échec en production, cet écran étant rendu hors de `<SQLiteProvider>` —
   * architecture T01-S05) pour dériver, en LECTURE SEULE, la couleur
   * affichée de la Séance depuis son Étiquette associée.
   */
  constructor(
    private readonly categoryRepository?: CategoryRepository,
    private readonly bodyZoneRepository?: BodyZoneRepository,
    private readonly labelRepository?: LabelRepository,
    private readonly media?: ActivityMediaAdapters,
    /**
     * PRE-7 (A1.3) : lecture du Mouvement (usage, structure, niveaux) — optionnel,
     * même patron que les référentiels ci-dessus ; injecté par `SessionServiceProvider`.
     */
    private readonly movementRepository?: MovementRepository,
  ) {}

  /**
   * PRE-8 (B.1, B.2) : services du Mouvement autonome (Catalogue des Mouvements, fiche CE-MVT-01),
   * sur le MÊME `MovementRepository` que les autres opérations du geste — aucune seconde
   * composition SQLite. `null` sans `MovementRepository` (doublures antérieures à MFN).
   */
  get movementCatalogue(): MovementCatalogueService | null {
    return this.movementRepository ? new MovementCatalogueService(this.movementRepository) : null;
  }

  /**
   * PRE-7 (R-4, D-445 C03, C04) : nombre d'exercices enregistrés qui utilisent le Mouvement,
   * vus depuis le brouillon d'une Séance — occurrences persistées des AUTRES Séances
   * (`excludingSessionId` : Séance en cours de modification, dont les occurrences sont celles du
   * brouillon, comptées par l'éditeur). Aucun changement de schéma. Lève sans `MovementRepository`.
   * [PRE-9 A.3 du 04/11/2026 : les anciennes définitions du Catalogue, supprimées, ne sont plus
   * comptées.]
   */
  async countMovementUsage(movementId: string, excludingSessionId: string | null): Promise<number> {
    if (!this.movementRepository) {
      throw new Error("ActivityDefinitionService was constructed without a MovementRepository.");
    }
    return this.movementRepository.countOccurrences(movementId, excludingSessionId ?? undefined);
  }

  /**
   * PRE-7 (A2.2, MFN-08) : l'évaluation d'une correction est disponible (Mouvement injecté) —
   * même patron que `supportsMediaImport`. Faux pour un service construit sans
   * `MovementRepository` (doublures antérieures à MFN) : l'éditeur écrit alors directement.
   */
  get supportsSharedCorrection(): boolean {
    return this.movementRepository !== undefined;
  }

  /**
   * PRE-7 (A2.2, MFN-06, MFN-08) : geste repris par une création (contenu, structure,
   * compteur de phase) — `null` si inconnu ou sans `MovementRepository`.
   */
  async getMovement(movementId: string): Promise<Movement | null> {
    if (!this.movementRepository) {
      return null;
    }
    return this.movementRepository.findById(movementId);
  }

  /**
   * PRE-7 (R-5, D-445 C01, v7 §6 R02 à R05) — TOUS les mouvements disponibles, LOCAUX COMPRIS
   * (créés dans une Séance, sans Exercice au Catalogue, ou dont le dernier exercice a été retiré :
   * « un mouvement peut exister sans exercice et reste recherchable », v7 l.27), lus une fois puis
   * parcourus en mémoire : classement R02 (`rankMovements`) pendant la saisie et contrôle
   * d'unicité C01 (`findMovementNameConflict`). Ordre rendu : celui du repository (nom normalisé).
   * [PRE-9 A.3 du 04/11/2026 : le rang des anciennes définitions du Catalogue, supprimées, n'ordonne
   * plus les mouvements ; ce rang ne s'appliquait déjà plus qu'à ces définitions.] Rangs calculés,
   * jamais persistés. `[]` sans `MovementRepository`
   * (doublures antérieures à MFN). Remplace `searchMovements` (sous-chaîne, A2.3).
   */
  async listMovementChoices(): Promise<readonly MovementChoice[]> {
    const movements = this.movementRepository;
    if (!movements) {
      return [];
    }
    const found = await movements.search("");
    const archivedIds = await movements.listArchivedIds();
    const groups = new Map<string, readonly Movement[]>();
    const choices: MovementChoice[] = [];
    for (const movement of found) {
      let level: MovementLevelPosition | null = null;
      if (movement.levelGroup !== null) {
        const groupId = movement.levelGroup.groupId;
        let members = groups.get(groupId);
        if (members === undefined) {
          members = await movements.listGroup(groupId);
          groups.set(groupId, members);
        }
        level = movementLevelPosition(movement, members);
      }
      choices.push({ movement, level, archived: archivedIds.has(movement.id) });
    }
    return choices;
  }

  /**
   * PRE-7 (R-6, D-445 C06, v7 l.69, MFN-10 l.426) — position de niveau de chaque mouvement d'un
   * groupe d'au moins deux membres, par identifiant : source du suffixe « - Nn » des cartes sans
   * pastille (Catalogue, choix d'exercices, Composition). Rang et total dérivés de l'ordre du groupe
   * (`listGroup`, `movementLevelPosition`), jamais persistés ; un mouvement sans groupe ou seul
   * dans le sien est absent (aucun suffixe). Lecture seule ; table vide sans `MovementRepository`.
   */
  async listMovementLevelPositions(): Promise<ReadonlyMap<string, MovementLevelPosition>> {
    const positions = new Map<string, MovementLevelPosition>();
    const movements = this.movementRepository;
    if (!movements) {
      return positions;
    }
    const groupIds = new Set<string>();
    for (const movement of await movements.search("")) {
      if (movement.levelGroup !== null) groupIds.add(movement.levelGroup.groupId);
    }
    for (const groupId of groupIds) {
      const members = await movements.listGroup(groupId);
      for (const member of members) {
        const position = movementLevelPosition(member, members);
        if (position !== null) positions.set(member.id, position);
      }
    }
    return positions;
  }

  /** PRE-7 (A3.1) : niveaux disponibles (Mouvement injecté) — même patron que `supportsMovementSearch`. */
  get supportsMovementLevels(): boolean {
    return this.movementRepository !== undefined;
  }

  /**
   * PRE-7 (A3.1, D-439, MFN-05, MFN-07) — niveaux du geste (pastille et popover de la fiche) :
   * rang et total dérivés du groupe (`listGroup`, `movementLevelPosition`). Lecture seule. `null` : geste inconnu, ou service sans `MovementRepository`.
   */
  async getMovementLevels(movementId: string): Promise<MovementLevels | null> {
    const movements = this.movementRepository;
    if (!movements) {
      return null;
    }
    const movement = await movements.findById(movementId);
    if (!movement) {
      return null;
    }
    if (movement.levelGroup === null) {
      return { position: null, levels: [] };
    }
    const members = await movements.listGroup(movement.levelGroup.groupId);
    const position = movementLevelPosition(movement, members);
    if (position === null) {
      return { position: null, levels: [] };
    }
    const archivedIds = await movements.listArchivedIds();
    return {
      position,
      levels: members.map((member, index) => ({
        movement: member,
        rank: index + 1,
        archived: archivedIds.has(member.id),
      })),
    };
  }

  /**
   * PRE-7 (A3.2, D-439, MFN-05, MFN/AC07, MFN/AC33) — réordonne le groupe du geste `movementId`
   * (`orderedMovementIds` : tous ses membres, dans le nouvel ordre) par `MovementRepository.reorder`
   * (transaction exclusive, permutation exacte). Un déplacement dans le groupe n'est pas une
   * modification du geste : ni question d'identité, ni contenu, ni Exercice touchés, aucune fusion ;
   * seules les clés de tri (et `updated_at` des gestes) changent. Niveaux relus après l'écriture.
   */
  async reorderMovementLevels(movementId: string, orderedMovementIds: readonly string[]): Promise<ReorderMovementLevelsResult> {
    const movements = this.movementRepository;
    if (!movements) {
      return { status: "NOT_FOUND" };
    }
    const movement = await movements.findById(movementId);
    if (!movement || movement.levelGroup === null) {
      return { status: "NOT_FOUND" };
    }
    const outcome = await movements.reorder(movement.levelGroup.groupId, orderedMovementIds);
    if (outcome.status === "INVALID_ORDER") {
      return { status: "INVALID_ORDER" };
    }
    if (outcome.status !== "OK") {
      return { status: "NOT_FOUND" };
    }
    const levels = await this.getMovementLevels(movementId);
    return levels === null ? { status: "NOT_FOUND" } : { status: "OK", levels };
  }

  /**
   * PRE-7 (A2.3) : la recherche des gestes est disponible (Mouvement injecté) — même patron que
   * `supportsSharedCorrection` ; faux : l'éditeur ne propose ni suggestion ni recherche.
   */
  get supportsMovementSearch(): boolean {
    return this.movementRepository !== undefined;
  }

  /**
   * Catégories disponibles pour le sélecteur de Catégorie de l'éditeur
   * d'Activité (V2-PRE-1, D-211, D-106/D-107) : prédéfinies par
   * `displayOrder`, puis personnalisées par `createdAt` — ordre déjà
   * garanti par `CategoryRepository.listAll()`, jamais retrié ici. Lève
   * explicitement si aucun `CategoryRepository` n'a été fourni au
   * constructeur, plutôt que de renvoyer silencieusement une liste vide
   * trompeuse.
   */
  async listCategories(): Promise<readonly Category[]> {
    if (!this.categoryRepository) {
      throw new Error("ActivityDefinitionService was constructed without a CategoryRepository.");
    }
    return this.categoryRepository.listAll();
  }

  /**
   * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
   * device check Hermann, commentaire 5948936550) — consommé par les écrans
   * qui composent/affichent des Zones (Catalogue, Composition, Sélection,
   * éditeur d'Activité) : jamais `BODY_ZONES` (autorité runtime retirée).
   * Même contrat d'échec explicite que `listCategories()` ci-dessus.
   */
  async listBodyZones(): Promise<readonly BodyZone[]> {
    if (!this.bodyZoneRepository) {
      throw new Error("ActivityDefinitionService was constructed without a BodyZoneRepository.");
    }
    return this.bodyZoneRepository.listAll();
  }

  /**
   * Référentiel persistant des Étiquettes (V2-PRE-1, plan §3.3, revue
   * indépendante 5950755410) — consommé par `CompositionScreen` pour dériver
   * EN LECTURE SEULE la couleur affichée de la Séance depuis son Étiquette
   * éventuelle ; jamais pour écrire `draft.color`, retiré du contrat cible.
   * Même contrat d'échec explicite que `listBodyZones()`/`listCategories()`
   * ci-dessus.
   */
  async listLabels(): Promise<readonly Label[]> {
    if (!this.labelRepository) {
      throw new Error("ActivityDefinitionService was constructed without a LabelRepository.");
    }
    return this.labelRepository.listAll();
  }

  private requireMedia(): ActivityMediaAdapters {
    if (!this.media) {
      throw new Error("ActivityDefinitionService was constructed without media adapters.");
    }
    return this.media;
  }

  /** Les médias sont disponibles (photothèque + copie interne) — sinon la section reste en lecture seule. */
  get supportsMediaImport(): boolean {
    return this.media !== undefined;
  }

  /** Import depuis la photothèque pour le brouillon `draftId` (aucune écriture SQLite). */
  async importMedia(draftId: string, onProgress?: (items: readonly ImportItem[]) => void): Promise<ImportResult> {
    return this.requireMedia().importService.importFromLibrary(draftId, onProgress);
  }

  /** Android : résultat du sélecteur en attente, importé une seule fois. */
  async importPendingMedia(draftId: string, onProgress?: (items: readonly ImportItem[]) => void): Promise<ImportResult | null> {
    return this.media ? this.media.importService.importPendingResult(draftId, onProgress) : null;
  }

  async retryMediaImport(draftId: string, item: ImportItem): Promise<ImportItem> {
    return this.requireMedia().importService.retry(draftId, item);
  }

  /** Prête les assets déjà enregistrés (réouverture, copie) au brouillon actif. */
  leaseDraftMedia(draftId: string, assetIds: readonly string[]): void {
    this.media?.importService.leaseExisting(draftId, assetIds);
  }

  /** Enregistrement réussi du brouillon : ses copies sont désormais référencées. */
  commitMediaDraft(draftId: string): void {
    this.media?.importService.commitDraft(draftId);
  }

  /**
   * Abandon CONFIRMÉ : seules les copies préparées par ce brouillon, sans
   * référence en base (Mouvements et occurrences) et non prêtées à un autre
   * brouillon actif sont supprimées. Une lecture de référence en échec
   * conserve le fichier.
   */
  async abandonMediaDraft(draftId: string): Promise<readonly string[]> {
    if (!this.media) {
      return [];
    }
    const { importService, repository } = this.media;
    const persisted = new Set<string>();
    for (const assetId of importService.preparedAssetIds(draftId)) {
      try {
        if (!repository.countReferences || (await repository.countReferences(assetId)) > 0) {
          persisted.add(assetId);
        }
      } catch {
        persisted.add(assetId);
      }
    }
    return importService.cleanupAbandonedDraft(draftId, persisted);
  }

  /** URI d'affichage d'un média (URI interne relative résolue). */
  resolveMediaUri(uri: string): string {
    return this.media ? this.media.importService.resolveUri(uri) : uri;
  }
}
