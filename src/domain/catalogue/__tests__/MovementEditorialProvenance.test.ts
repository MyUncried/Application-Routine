import { describe, expect, it } from "@jest/globals";

import {
  hasUnknownOwner,
  validateMovementEditorialProvenance,
  type MovementEditorialProvenance,
} from "../MovementEditorialProvenance";

const coach = { kind: "PERSON", id: "coach-martin" } as const;
const local = { kind: "LOCAL_USER", id: "usr-local" } as const;

function original(
  overrides: Partial<MovementEditorialProvenance> = {},
): MovementEditorialProvenance {
  return {
    sheetId: "sheet-local-1",
    gestureId: "squat",
    localMovementId: "mov-1",
    origin: "LOCAL_CREATED",
    upstream: null,
    owner: local,
    authors: [local],
    publisher: null,
    rightsHolder: null,
    license: null,
    revision: "1",
    reviewStatus: "DRAFT",
    visibility: "PRIVATE",
    ...overrides,
  };
}

describe("MovementEditorialProvenance (catalogue indépendant du moteur)", () => {
  it("accepte une création locale sans source et sans partage", () => {
    expect(validateMovementEditorialProvenance(original())).toEqual([]);
  });

  it("accepte un import d'un coach avec source épinglée et propriétaire local", () => {
    expect(
      validateMovementEditorialProvenance(
        original({
          sheetId: "local-copy-coach-1",
          origin: "SHARED_IMPORTED",
          upstream: { catalogueId: "coach-martin", sheetId: "sheet-squat", revision: "2.1" },
          authors: [coach],
          owner: local,
          publisher: coach,
        }),
      ),
    ).toEqual([]);
  });

  it("refuse l'import et la dérivation sans source de version", () => {
    for (const origin of ["SHARED_IMPORTED", "LOCAL_DERIVED", "CATALOGUE_INSTALLED", "EXTERNAL_IMPORTED"] as const) {
      expect(validateMovementEditorialProvenance(original({ origin }))).toContainEqual({
        field: "upstream",
        code: "REQUIRED",
      });
    }
  });

  it("refuse l'attribution d'une provenance pour une création originale", () => {
    expect(
      validateMovementEditorialProvenance(
        original({ upstream: { catalogueId: "ko", sheetId: "x", revision: "1" } }),
      ),
    ).toContainEqual({ field: "upstream", code: "INCONSISTENT" });
  });

  it("conserve des identités éditoriales distinctes pour un même concept", () => {
    const a = original({ sheetId: "coach-a", gestureId: "squat", owner: coach });
    const b = original({
      sheetId: "coach-b",
      gestureId: "squat",
      owner: { kind: "PERSON", id: "coach-sophie" },
    });
    expect(a.sheetId).not.toBe(b.sheetId);
    expect(validateMovementEditorialProvenance(a)).toEqual([]);
    expect(validateMovementEditorialProvenance(b)).toEqual([]);
  });

  it("refuse les auteurs dupliqués et les références source incomplètes", () => {
    const bad = original({
      origin: "LOCAL_DERIVED",
      upstream: { catalogueId: "coach-martin", sheetId: "sheet", revision: "" },
      authors: [coach, coach],
    });
    expect(validateMovementEditorialProvenance(bad)).toEqual(
      expect.arrayContaining([
        { field: "authors", code: "DUPLICATE" },
        { field: "upstream.revision", code: "REQUIRED" },
      ]),
    );
  });

  it("ne suppose pas un auteur ni un ayant droit pour une fiche d'origine inconnue", () => {
    expect(
      validateMovementEditorialProvenance(
        original({ authors: [], rightsHolder: null, publisher: null }),
      ),
    ).toEqual([]);
  });

  it("propriétaire inconnu déclaré (null) : admis en privé, sans identité fictive, refusé à la diffusion", () => {
    const unknown = original({ owner: null, origin: "EXTERNAL_IMPORTED", upstream: { catalogueId: "xlsx:pilote", sheetId: "REED-001", revision: "2026-10-27" } });
    expect(validateMovementEditorialProvenance(unknown)).toEqual([]);
    expect(hasUnknownOwner(unknown)).toBe(true);
    expect(hasUnknownOwner(original())).toBe(false);
    for (const visibility of ["UNLISTED", "PUBLIC"] as const) {
      expect(validateMovementEditorialProvenance({ ...unknown, visibility })).toEqual([{ field: "owner", code: "INCONSISTENT" }]);
    }
    const omitted = { ...unknown, owner: undefined } as unknown as MovementEditorialProvenance;
    expect(validateMovementEditorialProvenance(omitted)).toEqual([{ field: "owner", code: "REQUIRED" }]);
  });

  it("refuse les identifiants et les états invalides", () => {
    const bad = original({
      sheetId: " ",
      owner: { kind: "PERSON", id: "" },
      reviewStatus: "WRONG" as MovementEditorialProvenance["reviewStatus"],
      visibility: "WRONG" as MovementEditorialProvenance["visibility"],
    });
    expect(validateMovementEditorialProvenance(bad)).toEqual(
      expect.arrayContaining([
        { field: "sheetId", code: "REQUIRED" },
        { field: "owner.id", code: "REQUIRED" },
        { field: "reviewStatus", code: "UNRECOGNIZED" },
        { field: "visibility", code: "UNRECOGNIZED" },
      ]),
    );
  });
});
