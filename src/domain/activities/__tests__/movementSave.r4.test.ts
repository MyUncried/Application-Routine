import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import {
  decideMovementSave,
  movementContentChanged,
  movementContentOf,
  type MovementContentSnapshot,
} from "@/domain/activities/movementSave";

/**
 * PRE-7 story R-4 (D-445 C03, v7 §3) — matrice de la décision unique de sauvegarde d'un Mouvement
 * existant modifié : nom modifié → choix (toujours), contenu modifié → confirmation avec un autre
 * exercice ou une exécution, sinon silence ; paramètres seuls → aucun dialogue.
 */

const before: MovementContentSnapshot = {
  name: "Squat",
  aliases: ["Flexion"],
  description: "Buste droit",
  mediaAssetIds: ["p1", "p2"],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses", "fessiers"],
  phases: [
    { id: 1, label: "Descente" },
    { id: 2, label: "Remontée" },
  ],
};

const after = (overrides: Partial<MovementContentSnapshot> = {}): MovementContentSnapshot => ({ ...before, ...overrides });

describe("decideMovementSave — matrice C03", () => {
  it("nom modifié : choix, quel que soit le nombre d'autres exercices ou d'exécutions", () => {
    expect(decideMovementSave(before, after({ name: "Squats" }), 0)).toEqual({ kind: "CHOICE", otherCount: 0 });
    expect(decideMovementSave(before, after({ name: "Squats" }), 3, 2)).toEqual({ kind: "CHOICE", otherCount: 3 });
    // Casse seule : nom enregistré modifié (comparaison exacte).
    expect(decideMovementSave(before, after({ name: "squat" }), 0)).toEqual({ kind: "CHOICE", otherCount: 0 });
    // Nom modifié avec d'autres changements : toujours le choix.
    expect(decideMovementSave(before, after({ name: "Squats", description: null }), 1)).toEqual({ kind: "CHOICE", otherCount: 1 });
  });

  it("nom inchangé, contenu modifié, au moins un autre exercice ou une exécution : confirmation", () => {
    expect(decideMovementSave(before, after({ description: "Dos droit" }), 2)).toEqual({ kind: "CONFIRM", otherCount: 2 });
    expect(decideMovementSave(before, after({ description: "Dos droit" }), 0, 1)).toEqual({ kind: "CONFIRM", otherCount: 0 });
  });

  it("nom inchangé, contenu modifié, ni autre exercice ni exécution : sauvegarde silencieuse", () => {
    expect(decideMovementSave(before, after({ bodyZoneIds: ["cuisses"] }), 0)).toEqual({ kind: "SILENT" });
    expect(decideMovementSave(before, after({ categoryId: "force" }), 0, 0)).toEqual({ kind: "SILENT" });
  });

  it("aucun changement de contenu (paramètres seuls) : aucun dialogue, même avec d'autres exercices", () => {
    expect(decideMovementSave(before, after(), 5, 3)).toEqual({ kind: "NONE" });
  });

  it("nombres négatifs ou non entiers : entrée invalide, lève", () => {
    expect(() => decideMovementSave(before, after(), -1)).toThrow();
    expect(() => decideMovementSave(before, after(), 1.5)).toThrow();
    expect(() => decideMovementSave(before, after(), 0, -1)).toThrow();
  });
});

describe("movementContentChanged — contenu concerné", () => {
  it("chaque champ du contenu compte : alias, description, médias (ordre), Catégorie, Zones, phases (identités, libellés, ordre)", () => {
    expect(movementContentChanged(before, after({ aliases: [] }))).toBe(true);
    expect(movementContentChanged(before, after({ description: null }))).toBe(true);
    expect(movementContentChanged(before, after({ mediaAssetIds: ["p2", "p1"] }))).toBe(true);
    expect(movementContentChanged(before, after({ categoryId: null }))).toBe(true);
    expect(movementContentChanged(before, after({ bodyZoneIds: ["cuisses", "dos"] }))).toBe(true);
    expect(movementContentChanged(before, after({ phases: [{ id: 1, label: "Descente" }] }))).toBe(true);
    expect(movementContentChanged(before, after({ phases: [{ id: 1, label: "Descente" }, { id: 3, label: "Remontée" }] }))).toBe(true);
    expect(movementContentChanged(before, after({ phases: [{ id: 1, label: "Bas" }, { id: 2, label: "Remontée" }] }))).toBe(true);
    expect(movementContentChanged(before, after({ phases: [{ id: 2, label: "Remontée" }, { id: 1, label: "Descente" }] }))).toBe(true);
  });

  it("Zones comparées comme un ensemble ; description absente = null", () => {
    expect(movementContentChanged(before, after({ bodyZoneIds: ["fessiers", "cuisses"] }))).toBe(false);
    const withoutDescription = after({ description: null });
    expect(movementContentChanged(withoutDescription, { ...withoutDescription })).toBe(false);
  });
});

describe("movementContentOf — contenu enregistré d'un Mouvement", () => {
  it("reprend nom, alias, description, médias ordonnés, Catégorie, Zones et phases ; ni compteur ni groupe", () => {
    const movement = {
      id: "mov-1",
      name: "Squat",
      description: "Buste droit",
      media: [{ assetId: "p1" }, { assetId: "p2" }],
      categoryId: "cardio",
      bodyZoneIds: ["cuisses", "fessiers"],
      phases: before.phases,
      nextPhaseId: 7,
      aliases: ["Flexion"],
      levelGroup: { groupId: "grp", sortKey: 1 },
    } as unknown as Movement;
    expect(movementContentOf(movement)).toEqual(before);
  });
});
