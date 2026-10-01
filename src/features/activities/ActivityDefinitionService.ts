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
import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";

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
  constructor(
    private readonly repository: ActivityDefinitionRepository,
    private readonly categoryRepository?: CategoryRepository,
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
}
