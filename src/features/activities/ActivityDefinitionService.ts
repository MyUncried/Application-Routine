/**
 * Orchestration applicative du cycle de vie d'une `ActivityDefinition`
 * (V2-CAT-01) — même patron que `@/features/sessions/SessionService` : ne
 * dépend que du Domaine (`@/domain/activities`) et de l'interface
 * `ActivityDefinitionRepository`, jamais de React, Expo ou d'une
 * implémentation concrète (injectée par le constructeur).
 */

import {
  assessSharedCorrection,
  groupDefinitionsByMovement,
  MovementNotFoundError,
  SharedCorrectionRefusedError,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type ActivityDefinitionGroup,
  type ActivityDefinitionOrigin,
  type ActivityDefinitionRepository,
  type ActivityDefinitionValidationViolation,
  type CorrectionAssessment,
  type CreateActivityDefinitionInput,
  type SharedCorrectionRefusal,
  type SiblingCompletion,
  type SiblingGap,
} from "@/domain/activities";
import { allocatePhaseIdentities, type Movement, type MovementPhase } from "@/domain/activities/Movement";
import { movementLevelPosition, type MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { MovementRepository } from "@/domain/activities/MovementRepository";
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

export type CreateActivityDefinitionResult =
  | { readonly ok: true; readonly value: ActivityDefinition }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

/**
 * PRE-7 (A1.3, MFN-08) : refus d'une correction partagée, sans écriture —
 * complétion des frères attendue (étape distincte de saisie des durées
 * manquantes), frère inéligible à la nouvelle structure, ou durée fournie
 * invalide.
 */
export type SharedCorrectionRefusedResult =
  | { readonly status: "SIBLING_COMPLETION_REQUIRED"; readonly siblings: readonly SiblingGap[] }
  | { readonly status: "INELIGIBLE_SIBLINGS"; readonly definitionIds: readonly string[] }
  | { readonly status: "INVALID_SIBLING_COMPLETION"; readonly definitionIds: readonly string[] };

export type UpdateActivityDefinitionResult =
  | { readonly status: "UPDATED"; readonly value: ActivityDefinition }
  | { readonly status: "INVALID"; readonly violations: readonly ActivityDefinitionValidationViolation[] }
  | { readonly status: "NOT_FOUND" }
  | SharedCorrectionRefusedResult;

/** PRE-7 (A1.3, MFN-06, MFN-07) : issue d'une création avec origine explicite. */
export type CreateActivityDefinitionWithOriginResult =
  | { readonly status: "CREATED"; readonly value: ActivityDefinition }
  | { readonly status: "INVALID"; readonly violations: readonly ActivityDefinitionValidationViolation[] }
  /** Mouvement du même geste ou d'origine de la variante introuvable. */
  | { readonly status: "MOVEMENT_NOT_FOUND" }
  | SharedCorrectionRefusedResult;

/** Cible d'une évaluation : Exercice du Catalogue modifié, ou création sur un geste repris. */
export type CorrectionTarget =
  | { readonly kind: "UPDATE"; readonly definitionId: string }
  | { readonly kind: "SAME_MOVEMENT"; readonly movementId: string };

export type AssessCorrectionResult =
  | {
      readonly status: "ASSESSED";
      readonly assessment: CorrectionAssessment;
      /**
       * PRE-7 (A2.2, MFN-08) : structure du geste après allocation des identités par le
       * compteur du Mouvement — libellés des phases manquantes présentées à l'étape de
       * complétion, par `phaseId`.
       */
      readonly phases: readonly MovementPhase[];
    }
  | { readonly status: "INVALID"; readonly violations: readonly ActivityDefinitionValidationViolation[] }
  /** Définition (`UPDATE`) ou Mouvement (`SAME_MOVEMENT`) introuvable. */
  | { readonly status: "NOT_FOUND" };

/**
 * PRE-7 (A2.3, MFN-04, MFN-05, MFN-06) : geste proposé par la recherche ou la suggestion — le geste,
 * le nombre d'Exercices du Catalogue qui le référencent et sa position de niveau dérivée (`null` sans
 * groupe ou pour un singleton). Comptes et rangs calculés, jamais persistés.
 */
export type MovementChoice = {
  readonly movement: Movement;
  readonly definitionCount: number;
  readonly level: MovementLevelPosition | null;
};

/**
 * PRE-7 (A3.1, D-439, MFN-05, MFN-07, MFN-10) : un niveau du groupe d'un geste — le geste membre,
 * son rang dérivé (1..total, ordre des clés de tri) et ses Exercices du Catalogue (ordre de la
 * liste, `updatedAt DESC`) ; un geste local du groupe n'en a aucun.
 */
export type MovementLevelEntry = {
  readonly movement: Movement;
  readonly rank: number;
  readonly definitions: readonly ActivityDefinition[];
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

function refusedResult(refusal: SharedCorrectionRefusal): SharedCorrectionRefusedResult {
  switch (refusal.kind) {
    case "SIBLING_COMPLETION_REQUIRED":
      return { status: refusal.kind, siblings: refusal.siblings };
    case "INELIGIBLE_SIBLINGS":
    case "INVALID_SIBLING_COMPLETION":
      return { status: refusal.kind, definitionIds: refusal.definitionIds };
  }
}

export class ActivityDefinitionService {
  /**
   * `categoryRepository` (V2-PRE-1, D-211) reste optionnel pour ne pas
   * casser un appelant construit avant cette tranche (même patron que
   * `SessionService.categoryRepository`) : `listCategories()` est appelée par le
   * sélecteur de Catégorie de l'éditeur d'Activité et, en lecture seule, par
   * `useCategoriesReferential` (cartes de la Composition et de la sélection, PRE-6
   * story 2.2), jamais par
   * `createActivityDefinition`/`updateActivityDefinition` (la résolution
   * réelle de la Catégorie du brouillon reste entièrement à la charge du
   * Repository, à l'intérieur de la transaction d'enregistrement — voir
   * `SqliteActivityDefinitionRepository.resolveCategoryId`).
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
    private readonly repository: ActivityDefinitionRepository,
    private readonly categoryRepository?: CategoryRepository,
    private readonly bodyZoneRepository?: BodyZoneRepository,
    private readonly labelRepository?: LabelRepository,
    private readonly media?: ActivityMediaAdapters,
    /**
     * PRE-7 (A1.3) : lecture du Mouvement (usage durable, structure, compteur)
     * pour `assessActivityDefinitionCorrection` — optionnel, même patron que
     * les référentiels ci-dessus ; injecté par `SessionServiceProvider`.
     */
    private readonly movementRepository?: MovementRepository,
  ) {}

  /**
   * Convertit l'entrée via `validateActivityDefinitionInput` (Domaine). En
   * cas d'échec, aucune tentative d'écriture n'est faite : le résultat
   * structuré est renvoyé tel quel — même contrat que
   * `SessionService.createSession`.
   */
  async createActivityDefinition(
    input: CreateActivityDefinitionInput,
  ): Promise<CreateActivityDefinitionResult> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      return validated;
    }
    const value = await this.repository.create(validated.value);
    return { ok: true, value };
  }

  /**
   * Modification d'une `ActivityDefinition` persistante. En cas d'échec de
   * validation, aucune tentative d'appel au Repository. Une erreur de
   * sauvegarde du Repository (ou un identifiant inconnu) conserve le
   * brouillon appelant : aucune modification partielle n'est jamais laissée
   * (le Repository applique sa propre transaction).
   */
  async updateActivityDefinition(
    id: string,
    input: CreateActivityDefinitionInput,
    siblingCompletions?: readonly SiblingCompletion[],
  ): Promise<UpdateActivityDefinitionResult> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }
    // PRE-3 : un appelant qui n'envoie pas `media` conserve les liens
    // existants — la valeur par défaut `[]` de la validation ne doit jamais
    // les effacer implicitement en modification.
    const { media: _media, ...withoutMedia } = validated.value;
    // PRE-7 (A1.3, MFN-08) : « Corriger cet exercice » — le contenu partagé
    // vaut pour tous les Exercices du geste ; les durées des frères suivent
    // `siblingCompletions` (`null` = complétion explicitement passée). Un
    // refus est rendu en union, sans écriture.
    let value: ActivityDefinition | null;
    try {
      value = await this.repository.update(id, input.media === undefined ? withoutMedia : validated.value, siblingCompletions);
    } catch (error) {
      if (error instanceof SharedCorrectionRefusedError) {
        return refusedResult(error.refusal);
      }
      throw error;
    }
    if (!value) {
      return { status: "NOT_FOUND" };
    }
    return { status: "UPDATED", value };
  }

  /**
   * PRE-7 (A1.3, MFN-06, MFN-07, MFN-08) — création avec origine EXPLICITE
   * (`ActivityDefinitionOrigin`) : geste indépendant, même geste (contenu
   * appliqué comme correction partagée), variante (rattachement au groupe
   * d'origine selon le choix transmis, jamais automatique). Même contrat de
   * validation que `createActivityDefinition` ; une erreur technique du
   * repository se propage, aucune écriture partielle.
   */
  async createActivityDefinitionWithOrigin(
    input: CreateActivityDefinitionInput,
    origin: ActivityDefinitionOrigin,
  ): Promise<CreateActivityDefinitionWithOriginResult> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }
    // Même geste : sans `media`, les médias du geste repris sont conservés.
    const { media: _media, ...withoutMedia } = validated.value;
    const value = origin.kind === "SAME_MOVEMENT" && input.media === undefined ? withoutMedia : validated.value;
    try {
      return { status: "CREATED", value: await this.repository.create(value, origin) };
    } catch (error) {
      if (error instanceof SharedCorrectionRefusedError) {
        return refusedResult(error.refusal);
      }
      if (error instanceof MovementNotFoundError) {
        return { status: "MOVEMENT_NOT_FOUND" };
      }
      throw error;
    }
  }

  /**
   * PRE-7 (A1.3, MFN-08 ; ch11 « Vérifier usage durable et champs sensibles ;
   * transmettre le choix et le nombre de définitions touchées ») — évaluation
   * SANS écriture d'une correction, avant l'enregistrement : la question
   * d'identité est due si le geste est « déjà utilisé » et que son nom, sa
   * description, ses médias ou sa structure de phases changent ; l'évaluation
   * donne aussi le nombre de définitions qui le partagent et les durées
   * manquantes des frères. Le choix « Corriger » se transmet par
   * `updateActivityDefinition` (ou l'origine `SAME_MOVEMENT`), « Créer un
   * nouvel exercice » par l'origine `VARIANT`. Lève sans `MovementRepository`.
   */
  async assessActivityDefinitionCorrection(
    target: CorrectionTarget,
    input: CreateActivityDefinitionInput,
  ): Promise<AssessCorrectionResult> {
    if (!this.movementRepository) {
      throw new Error("ActivityDefinitionService was constructed without a MovementRepository.");
    }
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }
    let movementId: string;
    if (target.kind === "UPDATE") {
      const definition = await this.repository.findById(target.definitionId);
      if (!definition) {
        return { status: "NOT_FOUND" };
      }
      movementId = definition.movementId;
    } else {
      movementId = target.movementId;
    }
    const movement = await this.movementRepository.findById(movementId);
    if (!movement) {
      return { status: "NOT_FOUND" };
    }
    const sharing = (await this.repository.listAll()).filter((definition) => definition.movementId === movementId);
    const editedId = target.kind === "UPDATE" ? target.definitionId : null;
    const allocation = allocatePhaseIdentities(movement, validated.value.executionParameters);
    const assessment = assessSharedCorrection(
      movement,
      {
        name: validated.value.name,
        description: validated.value.description,
        ...(input.media !== undefined ? { mediaAssetIds: input.media.map((item) => item.assetId) } : {}),
        phases: allocation.movement.phases,
      },
      sharing
        .filter((definition) => definition.id !== editedId)
        .map((definition) => ({ definitionId: definition.id, parameters: definition.executionParameters })),
      sharing.length,
    );
    return { status: "ASSESSED", assessment, phases: allocation.movement.phases };
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
   * PRE-7 (A2.3, MFN-04, MFN-06, D-439) — recherche spécialisée des gestes disponibles, LOCAUX
   * COMPRIS (créés dans une Séance, absents du Catalogue) : nom normalisé contenant la requête,
   * requête vide = tous (`MovementRepository.search`). Ce n'est pas une recherche dans les listes
   * Catalogue (D-221 inchangée) : rien n'est créé ni publié. `[]` sans `MovementRepository`
   * (doublures antérieures à MFN).
   */
  async searchMovements(query: string): Promise<readonly MovementChoice[]> {
    const movements = this.movementRepository;
    if (!movements) {
      return [];
    }
    const found = await movements.search(query);
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
      choices.push({ movement, definitionCount: await movements.countDefinitions(movement.id), level });
    }
    return choices;
  }

  /** PRE-7 (A3.1) : niveaux disponibles (Mouvement injecté) — même patron que `supportsMovementSearch`. */
  get supportsMovementLevels(): boolean {
    return this.movementRepository !== undefined;
  }

  /**
   * PRE-7 (A3.1, D-439, MFN-05, MFN-07) — niveaux du geste (pastille et popover de la fiche) :
   * rang et total dérivés du groupe (`listGroup`, `movementLevelPosition`), et, pour chaque membre,
   * ses Exercices du Catalogue (« la navigation vers un niveau affiche ses exercices disponibles »).
   * Lecture seule. `null` : geste inconnu, ou service sans `MovementRepository`.
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
    const definitions = await this.repository.listAll();
    return {
      position,
      levels: members.map((member, index) => ({
        movement: member,
        rank: index + 1,
        definitions: definitions.filter((definition) => definition.movementId === member.id),
      })),
    };
  }

  /**
   * PRE-7 (A2.3) : la recherche des gestes est disponible (Mouvement injecté) — même patron que
   * `supportsSharedCorrection` ; faux : l'éditeur ne propose ni suggestion ni recherche.
   */
  get supportsMovementSearch(): boolean {
    return this.movementRepository !== undefined;
  }

  /**
   * PRE-7 (A1.3, MFN-10) — Catalogue regroupé par geste : groupes dans l'ordre
   * de première apparition de la liste (`updatedAt DESC`), définitions dans
   * cet ordre (`groupDefinitionsByMovement`).
   */
  async listActivityDefinitionsByMovement(): Promise<readonly ActivityDefinitionGroup[]> {
    return groupDefinitionsByMovement(await this.repository.listAll());
  }

  /** Liste des `ActivityDefinition` persistantes, déjà triées par `updatedAt DESC` (Repository). */
  async listActivityDefinitions(): Promise<readonly ActivityDefinition[]> {
    return this.repository.listAll();
  }

  /** `ActivityDefinition` par identifiant — `null` si inconnu, jamais une exception pour ce cas attendu (préremplissage de l'éditeur en modification). */
  async getActivityDefinition(id: string): Promise<ActivityDefinition | null> {
    return this.repository.findById(id);
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
   * référence en base (définitions et occurrences) et non prêtées à un autre
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
