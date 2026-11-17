import { describe, expect, it, jest } from "@jest/globals";

import { importedMovementViolations } from "@/features/sessions/SessionService";

/**
 * A-2 (11/11/2026) — revue indépendante : la Séance ne doit pas corriger un Mouvement importé
 * (crayon de l'éditeur d'Exercice, puis enregistrement de la Séance). La garde du service refuse
 * toute correction `EDITED` d'un Mouvement rattaché à une fiche installée ; un Mouvement créé (`NEW`)
 * ou personnel passe.
 */
describe("SessionService — garde A-2 des Mouvements importés", () => {
  it("refuse la correction d'un Mouvement importé, admet les autres", async () => {
    const guard = jest.requireMock("@/features/catalogue/importedMovements") as { isImportedMovement: (id: string) => Promise<boolean> };
    const previous = guard.isImportedMovement;
    guard.isImportedMovement = async (id) => id === "importe-1";
    try {
      expect(await importedMovementViolations([{ id: "importe-1", change: "EDITED" }]))
        .toEqual([{ code: "MUST_BE_ABSENT", field: "movement.id" }]);
      expect(await importedMovementViolations([{ id: "perso-1", change: "EDITED" }, { id: "neuf-1", change: "NEW" }])).toEqual([]);
      expect(await importedMovementViolations(undefined)).toEqual([]);
    } finally {
      guard.isImportedMovement = previous;
    }
  });
});
