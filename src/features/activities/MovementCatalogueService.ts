import { validateMovement, type Movement } from "@/domain/activities/Movement";
import {
  DuplicateMovementNameError,
  type MovementFamilyOutcome,
  type MovementPriorMemberships,
  type MovementRepository,
} from "@/domain/activities/MovementRepository";
import { decideMovementSave, movementContentOf, type MovementSaveDecision } from "@/domain/activities/movementSave";
import { movementLevelPosition, type MovementLevelPosition } from "@/domain/activities/movementSuggestion";

/**
 * PRE-8 (story B.1, CE-MVT-01, DSF Mouvements §3) — services du Mouvement autonome, depuis le
 * Catalogue des Mouvements. Aucun Exercice ni Séance n'est créé ; un Mouvement peut exister sans
 * Exercice.
 *
 * - **Création indépendante** : sans groupe (pastille « Niveau »), nom disponible (C01).
 * - **Variante** : explicitement choisie, plus facile (avant l'origine) ou plus difficile (après),
 *   dans une seule transaction ; le groupe naît au deuxième membre ; aucune seconde
 *   confirmation de correction.
 * - **Sauvegarde C03 depuis le Catalogue** : aucun Exercice n'est l'objet édité ; tous les
 *   Exercices liés (définitions du Catalogue et Exercices de Séance) sont comptés une fois
 *   chacun ; les exécutions sont vérifiées par identité (0 tant que le moteur T04 n'existe pas).
 * - **Créer un nouveau mouvement** : l'original et ses Exercices restent inchangés ; la nouvelle
 *   entrée est indépendante, sans rattachement automatique à la famille (Q10 de v7).
 *
 * Le rang d'un membre est dérivé de l'ordre de sa famille (`movementLevelPosition`), jamais de sa
 * place dans une vue filtrée. PRE-8, recette A/B du 27/10 (b8-3) : le rang AFFICHÉ d'un membre actif
 * est recalculé sur les seuls membres actifs (archiver un niveau renumérote les autres) ; un membre
 * archivé garde son rang dans la famille complète. L'ordre des piles suit toujours la famille
 * complète (`familyPosition`).
 */

/** Un Mouvement du Catalogue avec sa position de Niveau et son nombre d'Exercices liés. */
export type MovementCatalogueEntry = {
  readonly movement: Movement;
  /** Rang affiché (b8-3) ; `null` : Mouvement indépendant (pastille « Niveau »). */
  readonly level: MovementLevelPosition | null;
  /** Position dans la famille complète, archivés compris (ordre des piles) ; absente : `level`. */
  readonly familyPosition?: MovementLevelPosition | null;
  /** Exercices liés, chacun une fois (définitions du Catalogue et Exercices de Séance). */
  readonly exerciseCount: number;
  /** PRE-8 (B.8) : Mouvement archivé ; il garde sa famille et sa position (Q5). */
  readonly archived: boolean;
};

/** Famille de Niveaux (pile) ou Mouvement indépendant : membres dans l'ordre de la famille. */
export type MovementFamily = {
  /** Identifiant du groupe, ou du Mouvement pour une entrée indépendante. */
  readonly key: string;
  readonly members: readonly MovementCatalogueEntry[];
};

export type MovementWriteResult =
  | { readonly status: "SAVED"; readonly movement: Movement }
  | { readonly status: "DUPLICATE_NAME" }
  | { readonly status: "INVALID" }
  | { readonly status: "NOT_FOUND" };

export type MovementSaveAssessment =
  | { readonly status: "ASSESSED"; readonly decision: MovementSaveDecision; readonly executionCount: number }
  | { readonly status: "NOT_FOUND" };

/**
 * PRE-8 (B.8, Q8) : issue d'une action de cycle de vie depuis le Catalogue. `REFERENCED` : refus,
 * rien n'est écrit ; `exerciseCount` alimente le message « utilisé par N exercices ».
 * `STALE` : l'état a changé entre-temps (déjà archivé, déjà restauré, introuvable) ; la liste est relue.
 */
export type MovementLifecycleResult =
  | { readonly status: "DONE" }
  | { readonly status: "REFERENCED"; readonly exerciseCount: number }
  | { readonly status: "STALE" };

/** Difficulté choisie pour une variante (DSF « Variante et niveau »). */
export type VariantDifficulty = "EASIER" | "HARDER";

/** Exécutions enregistrées d'un Mouvement, par identité : aucune avant le moteur T04. */
export type MovementExecutionCounter = (movementId: string) => Promise<number>;

const NO_EXECUTIONS: MovementExecutionCounter = async () => 0;

export class MovementCatalogueService {
  constructor(
    private readonly movements: MovementRepository,
    private readonly countExecutions: MovementExecutionCounter = NO_EXECUTIONS,
  ) {}

  /** Mouvement par identifiant (fiche), `null` s'il est inconnu. */
  findMovement(movementId: string): Promise<Movement | null> {
    return this.movements.findById(movementId);
  }

  /** Exercices liés au Mouvement, chacun une fois, sans multiplier séries, tours ni planifications. */
  async countLinkedExercises(movementId: string): Promise<number> {
    return (await this.movements.countDefinitions(movementId)) + (await this.movements.countOccurrences(movementId));
  }

  /** Tous les Mouvements, Mouvements sans Exercice compris, avec rang dérivé et Exercices liés. */
  async listEntries(): Promise<readonly MovementCatalogueEntry[]> {
    const all = await this.movements.search("");
    const archivedIds = await this.movements.listArchivedIds();
    const groups = new Map<string, readonly Movement[]>();
    const entries: MovementCatalogueEntry[] = [];
    for (const movement of all) {
      let level: MovementLevelPosition | null = null;
      let familyPosition: MovementLevelPosition | null = null;
      const archived = archivedIds.has(movement.id);
      if (movement.levelGroup !== null) {
        let members = groups.get(movement.levelGroup.groupId);
        if (members === undefined) {
          members = await this.movements.listGroup(movement.levelGroup.groupId);
          groups.set(movement.levelGroup.groupId, members);
        }
        familyPosition = movementLevelPosition(movement, members);
        level = archived
          ? familyPosition
          : movementLevelPosition(
              movement,
              members.filter((member) => !archivedIds.has(member.id)),
            );
      }
      entries.push({
        movement,
        level,
        familyPosition,
        exerciseCount: await this.countLinkedExercises(movement.id),
        archived,
      });
    }
    return entries;
  }

  /**
   * Familles du Catalogue : un groupe d'au moins deux membres forme une pile (membres dans
   * l'ordre de la famille, rang croissant) ; un Mouvement indépendant, ou seul dans son groupe,
   * forme une entrée simple. Ordre des familles : celui du repository (nom normalisé) de leur
   * premier membre rencontré.
   */
  async listFamilies(): Promise<readonly MovementFamily[]> {
    return groupFamilies(await this.listEntries());
  }

  /**
   * Recette A/B (B08, MFN-05, D-445) : réordonne une famille depuis une pile déployée
   * (`orderedIds` : tous ses membres, rang croissant, archivés compris) par
   * `MovementRepository.reorder` (permutation exacte, transaction exclusive). Identités, contenus,
   * Exercices et résultats historiques inchangés ; seuls les rangs dérivés changent.
   */
  async reorderFamily(groupId: string, orderedIds: readonly string[]): Promise<boolean> {
    return (await this.movements.reorder(groupId, orderedIds)).status === "OK";
  }

  /**
   * PRE-8, familles de niveaux (règles A et C du 28/10/2026) : pose un Mouvement juste au-dessus
   * (niveau supérieur) ou en dessous de l'ancre — réordonnancement dans sa famille, entrée dans une
   * famille, ou création d'une famille avec un Mouvement sans famille. Appliqué immédiatement (E1).
   */
  placeInFamily(movementId: string, anchorId: string, side: "ABOVE" | "BELOW"): Promise<MovementFamilyOutcome> {
    return this.movements.placeInFamily(movementId, anchorId, side);
  }

  /** PRE-8, familles (règles B et D) : sortie d'une famille ; dissolution du dernier couple. */
  leaveFamily(movementId: string): Promise<MovementFamilyOutcome> {
    return this.movements.leaveFamily(movementId);
  }

  /** PRE-8, familles (règle E) : Annuler — rétablit les appartenances d'avant l'opération. */
  restoreFamilyMemberships(previous: MovementPriorMemberships): Promise<boolean> {
    return this.movements.restoreFamilyMemberships(previous);
  }

  /** PRE-8 (B.8) : le Mouvement est-il archivé ? (fiche en consultation seule). */
  async isArchived(movementId: string): Promise<boolean> {
    return (await this.movements.listArchivedIds()).has(movementId);
  }

  /**
   * PRE-8 (B.8, Q5, Q8) : archive un Mouvement actif, refusé tant qu'un Exercice persisté le
   * référence ; aucune suppression d'Exercice, de Séance ni de planification, famille et rangs
   * inchangés. Aussi l'annulation immédiate d'une restauration.
   */
  async archive(movementId: string): Promise<MovementLifecycleResult> {
    const outcome = await this.movements.archive(movementId);
    if (outcome.status === "ARCHIVED") return { status: "DONE" };
    if (outcome.status === "REFERENCED") return { status: "REFERENCED", exerciseCount: outcome.exerciseCount };
    return { status: "STALE" };
  }

  /** PRE-8 (B.8, Q7, Q8) : restaure un Mouvement archivé ; aussi l'annulation immédiate d'un archivage. */
  async restore(movementId: string): Promise<MovementLifecycleResult> {
    const outcome = await this.movements.restore(movementId);
    return outcome.status === "RESTORED" ? { status: "DONE" } : { status: "STALE" };
  }

  /** PRE-8 (B.8, Q8) : suppression définitive d'un Mouvement archivé, sans cascade, après confirmation. */
  async deleteArchived(movementId: string): Promise<MovementLifecycleResult> {
    const outcome = await this.movements.deleteArchived(movementId);
    if (outcome.status === "DELETED") return { status: "DONE" };
    if (outcome.status === "REFERENCED") return { status: "REFERENCED", exerciseCount: outcome.exerciseCount };
    return { status: "STALE" };
  }

  /** Création indépendante (sans groupe), après validation et contrôle d'unicité. */
  async createIndependent(movement: Movement): Promise<MovementWriteResult> {
    return this.write(() => this.movements.create({ ...movement, levelGroup: null }), movement);
  }

  /** Variante explicitement choisie, insérée avant (plus facile) ou après (plus difficile) l'origine. */
  async createVariant(movement: Movement, originId: string, difficulty: VariantDifficulty): Promise<MovementWriteResult> {
    if (!validateMovement({ ...movement, levelGroup: null }).ok) {
      return { status: "INVALID" };
    }
    try {
      const outcome = await this.movements.createVariant(
        { ...movement, levelGroup: null },
        originId,
        difficulty === "EASIER" ? "BEFORE_ORIGIN" : "AFTER_ORIGIN",
      );
      return outcome.status === "CREATED" ? { status: "SAVED", movement: outcome.movement } : { status: "NOT_FOUND" };
    } catch (error) {
      if (error instanceof DuplicateMovementNameError) {
        return { status: "DUPLICATE_NAME" };
      }
      throw error;
    }
  }

  /** Décision C03 (sans écriture) pour une modification depuis le Catalogue. */
  async assessSave(draft: Movement): Promise<MovementSaveAssessment> {
    const current = await this.movements.findById(draft.id);
    if (!current) {
      return { status: "NOT_FOUND" };
    }
    const executionCount = await this.countExecutions(draft.id);
    return {
      status: "ASSESSED",
      decision: decideMovementSave(movementContentOf(current), movementContentOf(draft), await this.countLinkedExercises(draft.id), executionCount),
      executionCount,
    };
  }

  /** « Mettre à jour ce mouvement » (ou mise à jour silencieuse) : même identité, groupe conservé. */
  async update(movement: Movement): Promise<MovementWriteResult> {
    return this.write(() => this.movements.update(movement), movement);
  }

  /**
   * « Créer un nouveau mouvement » depuis le Catalogue : nouvelle identité indépendante, sans
   * groupe ; l'original et ses Exercices restent inchangés.
   */
  async createAsNew(movement: Movement, newId: string): Promise<MovementWriteResult> {
    return this.createIndependent({ ...movement, id: newId, levelGroup: null });
  }

  private async write(run: () => Promise<Movement | null>, movement: Movement): Promise<MovementWriteResult> {
    if (!validateMovement(movement).ok) {
      return { status: "INVALID" };
    }
    try {
      const saved = await run();
      return saved ? { status: "SAVED", movement: saved } : { status: "NOT_FOUND" };
    } catch (error) {
      if (error instanceof DuplicateMovementNameError) {
        return { status: "DUPLICATE_NAME" };
      }
      throw error;
    }
  }
}

/** Position d'une entrée dans sa famille complète (b8-3 : distincte du rang affiché). */
export function familyPositionOf(entry: MovementCatalogueEntry): MovementLevelPosition | null {
  return entry.familyPosition === undefined ? entry.level : entry.familyPosition;
}

/** Regroupe les entrées en familles (voir `listFamilies`), pure. */
export function groupFamilies(entries: readonly MovementCatalogueEntry[]): readonly MovementFamily[] {
  const families: { key: string; members: MovementCatalogueEntry[] }[] = [];
  const byKey = new Map<string, { key: string; members: MovementCatalogueEntry[] }>();
  for (const entry of entries) {
    const key =
      familyPositionOf(entry) !== null && entry.movement.levelGroup !== null ? entry.movement.levelGroup.groupId : entry.movement.id;
    let family = byKey.get(key);
    if (!family) {
      family = { key, members: [] };
      byKey.set(key, family);
      families.push(family);
    }
    family.members.push(entry);
  }
  for (const family of families) {
    family.members.sort((left, right) => (familyPositionOf(left)?.rank ?? 0) - (familyPositionOf(right)?.rank ?? 0));
  }
  return families;
}
