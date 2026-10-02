/**
 * Orchestration applicative du cycle de vie d'une `ActivityDefinition`
 * (V2-CAT-01) — même patron que `@/features/sessions/SessionService` : ne
 * dépend que du Domaine (`@/domain/activities`) et de l'interface
 * `ActivityDefinitionRepository`, jamais de React, Expo ou d'une
 * implémentation concrète (injectée par le constructeur).
 */

import {
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type ActivityDefinitionRepository,
  type ActivityDefinitionValidationViolation,
  type CreateActivityDefinitionInput,
} from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import type { Label } from "@/domain/labels/Label";
import type { LabelRepository } from "@/domain/labels/LabelRepository";

export type CreateActivityDefinitionResult =
  | { readonly ok: true; readonly value: ActivityDefinition }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

export type UpdateActivityDefinitionResult =
  | { readonly status: "UPDATED"; readonly value: ActivityDefinition }
  | { readonly status: "INVALID"; readonly violations: readonly ActivityDefinitionValidationViolation[] }
  | { readonly status: "NOT_FOUND" };

export class ActivityDefinitionService {
  /**
   * `categoryRepository` (V2-PRE-1, D-211) reste optionnel pour ne pas
   * casser un appelant construit avant cette tranche (même patron que
   * `SessionService.categoryRepository`) : `listCategories()` n'est appelée
   * que par le sélecteur de Catégorie de l'éditeur d'Activité, jamais par
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
  ): Promise<UpdateActivityDefinitionResult> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }
    const value = await this.repository.update(id, validated.value);
    if (!value) {
      return { status: "NOT_FOUND" };
    }
    return { status: "UPDATED", value };
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
}
