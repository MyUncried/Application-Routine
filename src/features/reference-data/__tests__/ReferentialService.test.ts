import { describe, expect, it, jest } from "@jest/globals";

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
import { ReferentialService } from "../ReferentialService";

class FakeCategoryRepository implements CategoryRepository {
  listAll = jest.fn(async (): Promise<readonly Category[]> => []);
  create = jest.fn(
    async (_input: CreateCategoryReferentialInput): Promise<CategoryMutationResult> => ({ status: "DUPLICATE" }),
  );
  rename = jest.fn(async (_id: string, _name: string): Promise<CategoryMutationResult> => ({ status: "NOT_FOUND" }));
  recolor = jest.fn(
    async (_id: string, _color: CategoryColor): Promise<CategoryMutationResult> => ({ status: "NOT_FOUND" }),
  );
  retire = jest.fn(async (_id: string): Promise<CategoryMutationResult> => ({ status: "NOT_FOUND" }));
  isUsed = jest.fn(async (_id: string): Promise<boolean> => false);
}

class FakeBodyZoneRepository implements BodyZoneRepository {
  listAll = jest.fn(async (): Promise<readonly BodyZone[]> => []);
  create = jest.fn(async (_input: CreateBodyZoneInput): Promise<BodyZoneMutationResult> => ({ status: "DUPLICATE" }));
  rename = jest.fn(async (_id: string, _name: string): Promise<BodyZoneMutationResult> => ({ status: "NOT_FOUND" }));
  retire = jest.fn(async (_id: string): Promise<BodyZoneMutationResult> => ({ status: "NOT_FOUND" }));
  isUsed = jest.fn(async (_id: string): Promise<boolean> => false);
}

class FakeLabelRepository implements LabelRepository {
  listAll = jest.fn(async (): Promise<readonly Label[]> => []);
  create = jest.fn(async (_input: CreateLabelInput): Promise<LabelMutationResult> => ({ status: "DUPLICATE" }));
  rename = jest.fn(async (_id: string, _name: string): Promise<LabelMutationResult> => ({ status: "NOT_FOUND" }));
  recolor = jest.fn(
    async (_id: string, _color: LabelColor): Promise<LabelMutationResult> => ({ status: "NOT_FOUND" }),
  );
  retire = jest.fn(async (_id: string): Promise<LabelMutationResult> => ({ status: "NOT_FOUND" }));
  isUsed = jest.fn(async (_id: string): Promise<boolean> => false);
}

function makeService() {
  const categoryRepository = new FakeCategoryRepository();
  const bodyZoneRepository = new FakeBodyZoneRepository();
  const labelRepository = new FakeLabelRepository();
  const service = new ReferentialService(categoryRepository, bodyZoneRepository, labelRepository);
  return { service, categoryRepository, bodyZoneRepository, labelRepository };
}

describe("ReferentialService — Catégorie", () => {
  it("delegates listCategories/createCategory/renameCategory/recolorCategory/retireCategory to the Repository", async () => {
    const { service, categoryRepository } = makeService();

    await service.listCategories();
    expect(categoryRepository.listAll).toHaveBeenCalledTimes(1);

    await service.createCategory({ name: "Danse", color: "#3B82F6" });
    expect(categoryRepository.create).toHaveBeenCalledWith({ name: "Danse", color: "#3B82F6" });

    await service.renameCategory("cat-1", "Nouvelle");
    expect(categoryRepository.rename).toHaveBeenCalledWith("cat-1", "Nouvelle");

    await service.recolorCategory("cat-1", "#E5484D");
    expect(categoryRepository.recolor).toHaveBeenCalledWith("cat-1", "#E5484D");

    await service.retireCategory("cat-1");
    expect(categoryRepository.retire).toHaveBeenCalledWith("cat-1");

    await service.isCategoryUsed("cat-1");
    expect(categoryRepository.isUsed).toHaveBeenCalledWith("cat-1");
  });
});

describe("ReferentialService — Zone corporelle", () => {
  it("delegates listBodyZones/createBodyZone/renameBodyZone/retireBodyZone to the Repository", async () => {
    const { service, bodyZoneRepository } = makeService();

    await service.listBodyZones();
    expect(bodyZoneRepository.listAll).toHaveBeenCalledTimes(1);

    await service.createBodyZone({ name: "Avant-bras" });
    expect(bodyZoneRepository.create).toHaveBeenCalledWith({ name: "Avant-bras" });

    await service.renameBodyZone("zone-1", "Nouvelle");
    expect(bodyZoneRepository.rename).toHaveBeenCalledWith("zone-1", "Nouvelle");

    await service.retireBodyZone("zone-1");
    expect(bodyZoneRepository.retire).toHaveBeenCalledWith("zone-1");

    await service.isBodyZoneUsed("zone-1");
    expect(bodyZoneRepository.isUsed).toHaveBeenCalledWith("zone-1");
  });
});

describe("ReferentialService — Étiquette", () => {
  it("delegates listLabels/createLabel/renameLabel/recolorLabel/retireLabel to the Repository", async () => {
    const { service, labelRepository } = makeService();

    await service.listLabels();
    expect(labelRepository.listAll).toHaveBeenCalledTimes(1);

    await service.createLabel({ name: "Sport", color: "#3B82F6" });
    expect(labelRepository.create).toHaveBeenCalledWith({ name: "Sport", color: "#3B82F6" });

    await service.renameLabel("label-1", "Nouvelle");
    expect(labelRepository.rename).toHaveBeenCalledWith("label-1", "Nouvelle");

    await service.recolorLabel("label-1", "#E5484D");
    expect(labelRepository.recolor).toHaveBeenCalledWith("label-1", "#E5484D");

    await service.retireLabel("label-1");
    expect(labelRepository.retire).toHaveBeenCalledWith("label-1");

    await service.isLabelUsed("label-1");
    expect(labelRepository.isUsed).toHaveBeenCalledWith("label-1");
  });
});
