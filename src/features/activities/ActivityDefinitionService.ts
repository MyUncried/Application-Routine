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

export type CreateActivityDefinitionResult =
  | { readonly ok: true; readonly value: ActivityDefinition }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

export type UpdateActivityDefinitionResult =
  | { readonly status: "UPDATED"; readonly value: ActivityDefinition }
  | { readonly status: "INVALID"; readonly violations: readonly ActivityDefinitionValidationViolation[] }
  | { readonly status: "NOT_FOUND" };

export class ActivityDefinitionService {
  constructor(private readonly repository: ActivityDefinitionRepository) {}

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
}
