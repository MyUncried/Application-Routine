import type { BodyZone, CreateBodyZoneInput } from "@/domain/body-zones/BodyZone";
import type { BodyZoneMutationResult, BodyZoneRepository } from "@/domain/body-zones/BodyZoneRepository";
import type { Category, CategoryColor } from "@/domain/categories/Category";
import type {
  CategoryMutationResult,
  CategoryRepository,
  CreateCategoryReferentialInput,
} from "@/domain/categories/CategoryRepository";
import type { CreateLabelInput, Label, LabelColor } from "@/domain/labels/Label";
import type { LabelMutationResult, LabelRepository } from "@/domain/labels/LabelRepository";

/**
 * Orchestration applicative des trois référentiels (Catégorie, Zone,
 * Étiquette — V2-PRE-2, plan §6.3) : listes et opérations explicites
 * (créer/renommer/recolorer/retirer, avec réactivation D2). Ne dépend que
 * du Domaine et des interfaces de Repository, jamais de React, Expo ou
 * d'une implémentation concrète (même patron que `SessionService`).
 */
export class ReferentialService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly bodyZoneRepository: BodyZoneRepository,
    private readonly labelRepository: LabelRepository,
  ) {}

  listCategories(): Promise<readonly Category[]> {
    return this.categoryRepository.listAll();
  }

  createCategory(input: CreateCategoryReferentialInput): Promise<CategoryMutationResult> {
    return this.categoryRepository.create(input);
  }

  renameCategory(id: string, name: string): Promise<CategoryMutationResult> {
    return this.categoryRepository.rename(id, name);
  }

  recolorCategory(id: string, color: CategoryColor): Promise<CategoryMutationResult> {
    return this.categoryRepository.recolor(id, color);
  }

  retireCategory(id: string): Promise<CategoryMutationResult> {
    return this.categoryRepository.retire(id);
  }

  isCategoryUsed(id: string): Promise<boolean> {
    return this.categoryRepository.isUsed(id);
  }

  listBodyZones(): Promise<readonly BodyZone[]> {
    return this.bodyZoneRepository.listAll();
  }

  createBodyZone(input: CreateBodyZoneInput): Promise<BodyZoneMutationResult> {
    return this.bodyZoneRepository.create(input);
  }

  renameBodyZone(id: string, name: string): Promise<BodyZoneMutationResult> {
    return this.bodyZoneRepository.rename(id, name);
  }

  retireBodyZone(id: string): Promise<BodyZoneMutationResult> {
    return this.bodyZoneRepository.retire(id);
  }

  isBodyZoneUsed(id: string): Promise<boolean> {
    return this.bodyZoneRepository.isUsed(id);
  }

  listLabels(): Promise<readonly Label[]> {
    return this.labelRepository.listAll();
  }

  createLabel(input: CreateLabelInput): Promise<LabelMutationResult> {
    return this.labelRepository.create(input);
  }

  renameLabel(id: string, name: string): Promise<LabelMutationResult> {
    return this.labelRepository.rename(id, name);
  }

  recolorLabel(id: string, color: LabelColor): Promise<LabelMutationResult> {
    return this.labelRepository.recolor(id, color);
  }

  retireLabel(id: string): Promise<LabelMutationResult> {
    return this.labelRepository.retire(id);
  }

  isLabelUsed(id: string): Promise<boolean> {
    return this.labelRepository.isUsed(id);
  }
}
