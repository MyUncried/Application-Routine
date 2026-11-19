import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { nextCopyName } from "@/domain/sessions/composition";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { canonicalSessionNameKey } from "@/domain/sessions/validation";
import { SESSION_NAME_TAKEN, SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette du 17/11/2026 (Hermann : « actuellement deux séances peuvent avoir le même nom, à corriger, le nom d'une
 * séance doit être unique ») : création et modification refusées (`DUPLICATE` / `session.name`) quand une autre
 * Séance active porte déjà le nom (espaces, casse et accents ignorés) ; la Séance modifiée ne se gêne pas elle-même ;
 * la copie prend un nom libre sous la même clé.
 */

const NOW = "2026-11-17T09:00:00.000Z";

describe("Nom de Séance unique (recette du 17/11/2026)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
  const service = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

  const draftNamed = (name: string): SessionDraft =>
    withLocalMovements({
      ...createEmptyDraft(),
      name,
      exercises: [
        {
          ...createExerciseDraft(`occ-${++sequence}`),
          // Un Mouvement neuf par Séance : son nom doit lui-même être unique (C01).
          name: `Gainage ${sequence}`,
          bodyZoneIds: ["dos"],
          categoryId: "cardio",
          executionParameters: durationParameters(30, 2, 10),
        },
      ],
    });

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("clé de comparaison : espaces, casse et accents ignorés", () => {
    expect(canonicalSessionNameKey("  Séance   JAMBES ")).toBe(canonicalSessionNameKey("seance jambes"));
    expect(canonicalSessionNameKey("Jambes")).not.toBe(canonicalSessionNameKey("Jambes 2"));
  });

  it("création : un second « jambes » (casse, accents, espaces) est refusé, rien n'est écrit", async () => {
    const first = await service().createSession(draftNamed("Jambes été"));
    expect(first.ok).toBe(true);
    const second = await service().createSession(draftNamed("  jambes   ETE "));
    expect(second).toEqual({ ok: false, violations: [SESSION_NAME_TAKEN] });
    expect((await service().listActiveSessions()).map((summary) => summary.name)).toEqual(["Jambes été"]);
    expect((await service().createSession(draftNamed("Jambes 2"))).ok).toBe(true);
  });

  it("modification : garder son propre nom est permis ; prendre celui d'une autre Séance est refusé", async () => {
    const jambes = await service().createSession(draftNamed("Jambes"));
    const bras = await service().createSession(draftNamed("Bras"));
    if (!jambes.ok || !bras.ok) throw new Error("création");
    const own = await service().updateSession(jambes.value.id, { ...toSessionDraft(jambes.value), name: "JAMBES" });
    expect(own.status).toBe("UPDATED");
    const taken = await service().updateSession(bras.value.id, { ...toSessionDraft(bras.value), name: "jambes" });
    expect(taken).toEqual({ status: "INVALID", violations: [SESSION_NAME_TAKEN] });
    expect(await service().isSessionNameTaken("Jambes", jambes.value.id)).toBe(false);
    expect(await service().isSessionNameTaken("Jambes", bras.value.id)).toBe(true);
  });

  it("une Séance archivée ne bloque pas le nom (à confirmer)", async () => {
    const jambes = await service().createSession(draftNamed("Jambes"));
    if (!jambes.ok) throw new Error("création");
    await service().archiveSession(jambes.value.id);
    expect((await service().createSession(draftNamed("Jambes"))).ok).toBe(true);
  });

  it("copie : nom libre sous la même clé que le contrôle", async () => {
    expect(nextCopyName("Jambes", ["jambes (COPIE)"])).toBe("Jambes (copie 2)");
    const jambes = await service().createSession(draftNamed("Jambes"));
    if (!jambes.ok) throw new Error("création");
    expect((await service().createSession(draftNamed("JAMBES (copie)"))).ok).toBe(true);
    const copy = await service().duplicateSession(jambes.value.id, ids("dup"));
    expect(copy.status === "DUPLICATED" && copy.session.name).toBe("Jambes (copie 2)");
  });
});
