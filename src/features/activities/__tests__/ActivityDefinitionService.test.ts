import { describe, expect, it } from "@jest/globals";

import type {
  ActivityDefinition,
  ActivityDefinitionRepository,
  CreateActivityDefinitionInput,
} from "@/domain/activities";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";

function makeDefinition(overrides: Partial<ActivityDefinition> = {}): ActivityDefinition {
  return {
    id: "def-1",
    name: "Squat",
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 3,
    pauseSeconds: 10,
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    sideMode: "UNILATERAL",
    sideRecoverySeconds: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function validInput(): CreateActivityDefinitionInput {
  return {
    name: "Squat",
    description: null,
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 3,
    pauseSeconds: 10,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses"],
    sideRecoverySeconds: 0,
  };
}

class FakeRepository implements ActivityDefinitionRepository {
  created: CreateActivityDefinitionInput[] = [];
  updated: { id: string; input: CreateActivityDefinitionInput }[] = [];
  private readonly store = new Map<string, ActivityDefinition>();

  async create(input: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    this.created.push(input);
    const definition = makeDefinition({ id: `def-${this.store.size + 1}`, ...input });
    this.store.set(definition.id, definition);
    return definition;
  }

  async findById(id: string): Promise<ActivityDefinition | null> {
    return this.store.get(id) ?? null;
  }

  async listAll(): Promise<readonly ActivityDefinition[]> {
    return [...this.store.values()];
  }

  async update(id: string, input: CreateActivityDefinitionInput): Promise<ActivityDefinition | null> {
    this.updated.push({ id, input });
    const existing = this.store.get(id);
    if (!existing) {
      return null;
    }
    const next = makeDefinition({ ...existing, ...input, id });
    this.store.set(id, next);
    return next;
  }
}

describe("ActivityDefinitionService", () => {
  it("does not attempt to write when the input is invalid", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);

    const result = await service.createActivityDefinition({ ...validInput(), name: "" });

    expect(result.ok).toBe(false);
    expect(repository.created).toHaveLength(0);
  });

  it("delegates persistence to the repository on a valid create", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);

    const result = await service.createActivityDefinition(validInput());

    expect(result.ok).toBe(true);
    expect(repository.created).toHaveLength(1);
  });

  it("returns INVALID without calling the repository on update with an invalid input", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);
    const created = await repository.create(validInput());

    const result = await service.updateActivityDefinition(created.id, {
      ...validInput(),
      name: "",
    });

    expect(result.status).toBe("INVALID");
    expect(repository.updated).toHaveLength(0);
  });

  it("returns NOT_FOUND for an unknown id", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);

    const result = await service.updateActivityDefinition("missing", validInput());

    expect(result.status).toBe("NOT_FOUND");
  });

  it("returns UPDATED on a valid update of an existing definition", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);
    const created = await repository.create(validInput());

    const result = await service.updateActivityDefinition(created.id, {
      ...validInput(),
      name: "Squat modifié",
    });

    expect(result).toEqual({ status: "UPDATED", value: expect.objectContaining({ name: "Squat modifié" }) });
  });

  /**
   * V2-PRE-1 (plan §3.3/§13, REQ-001108DC7F67664C, UI-40094921B202-
   * A2E0666968E44) : le service ne reformule jamais la liste ordonnée de
   * médias — elle transite jusqu'au Repository dans le même ordre, qui en
   * déduit la position stable persistée (`SqliteActivityDefinitionRepository
   * .test.ts` couvre la persistance réelle).
   */
  it("forwards the ordered media list to the repository on create", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);

    await service.createActivityDefinition({
      ...validInput(),
      media: [{ assetId: "asset-2" }, { assetId: "asset-1" }],
    });

    expect(repository.created[0]?.media).toEqual([{ assetId: "asset-2" }, { assetId: "asset-1" }]);
  });

  it("forwards the ordered media list to the repository on update", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);
    const created = await repository.create(validInput());

    await service.updateActivityDefinition(created.id, {
      ...validInput(),
      media: [{ assetId: "asset-1" }],
    });

    expect(repository.updated[0]?.input.media).toEqual([{ assetId: "asset-1" }]);
  });

  it("lists definitions from the repository unchanged", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);
    await repository.create(validInput());

    const listed = await service.listActivityDefinitions();
    expect(listed).toHaveLength(1);
  });

  it("returns a definition by id, or null when unknown", async () => {
    const repository = new FakeRepository();
    const service = new ActivityDefinitionService(repository);
    const created = await repository.create(validInput());

    expect(await service.getActivityDefinition(created.id)).toEqual(created);
    expect(await service.getActivityDefinition("missing")).toBeNull();
  });
});
