import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import {
  applyMovementCounter,
  displayedCardCount,
  movementCatalogueSummary,
  toggledMovementCounter,
} from "@/features/activities/movementCatalogueCounters";
import { EMPTY_MOVEMENT_FILTERS, visibleMovementItems, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §3, CE-CAT-CTX-01) —
 * compteurs « N familles · N mouvements » : bascule exclusive, familles = familles ayant au moins une
 * carte affichée, mouvements = cartes affichées (pile repliée : sa seule carte du dessus), cumul avec
 * recherche et filtres, archives, listes vides.
 */

function entry(
  id: string,
  name: string,
  options: { readonly group?: string; readonly rank?: number; readonly archived?: boolean; readonly categoryId?: string } = {},
): MovementCatalogueEntry {
  const movement = {
    id,
    name,
    description: null,
    media: [],
    categoryId: options.categoryId ?? "renfo",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: options.group !== undefined ? { groupId: options.group, sortKey: (options.rank ?? 1) - 1 } : null,
  } as Movement;
  return {
    movement,
    level: options.group !== undefined ? { rank: options.rank ?? 1, total: 3 } : null,
    exerciseCount: 0,
    archived: options.archived ?? false,
  };
}

const filters = (partial: Partial<{ [K in keyof MovementCatalogueFilters]: readonly string[] }>): MovementCatalogueFilters =>
  ({
    statuses: new Set(partial.statuses ?? []),
    levels: new Set(partial.levels ?? []),
    usage: new Set(partial.usage ?? []),
    categoryIds: new Set(partial.categoryIds ?? []),
    bodyZoneIds: new Set(partial.bodyZoneIds ?? []),
  }) as MovementCatalogueFilters;

// Famille Squats (g1) : assisté (1), squat (2, archivé), sauté (3) ; famille Pompes (g2) : genoux (1),
// pompes (2) ; indépendants Fentes et Gainage (archivé).
const ALL = [
  entry("fentes", "Fentes avant"),
  entry("assist", "Squats assistés", { group: "g1", rank: 1, categoryId: "mobilite" }),
  entry("squat", "Squats", { group: "g1", rank: 2, archived: true }),
  entry("jump", "Squats sautés", { group: "g1", rank: 3, categoryId: "cardio" }),
  entry("genoux", "Pompes sur les genoux", { group: "g2", rank: 1 }),
  entry("pompes", "Pompes", { group: "g2", rank: 2 }),
  entry("gainage", "Gainage", { archived: true }),
];
const NONE = new Set<string>();

describe("PRE-9 CAT.1 — compteurs du Catalogue des Mouvements", () => {
  it("bascule exclusive : toucher l'inactif l'active (et désactive l'autre) ; toucher l'actif le désactive", () => {
    expect(toggledMovementCounter(null, "FAMILIES")).toBe("FAMILIES");
    expect(toggledMovementCounter("FAMILIES", "MOVEMENTS")).toBe("MOVEMENTS");
    expect(toggledMovementCounter("MOVEMENTS", "FAMILIES")).toBe("FAMILIES");
    expect(toggledMovementCounter("FAMILIES", "FAMILIES")).toBeNull();
    expect(toggledMovementCounter("MOVEMENTS", "MOVEMENTS")).toBeNull();
  });

  it("piles repliées : une seule carte par pile ; les membres masqués ne sont pas comptés", () => {
    const items = visibleMovementItems(ALL, "", EMPTY_MOVEMENT_FILTERS);
    // Fentes, pile Squats (jump, assist), pile Pompes (pompes, genoux).
    expect(movementCatalogueSummary(items, NONE)).toEqual({ families: 2, movements: 3 });
  });

  it("piles déployées : chaque membre affiché est une carte ; familles inchangées", () => {
    const items = visibleMovementItems(ALL, "", EMPTY_MOVEMENT_FILTERS);
    expect(movementCatalogueSummary(items, new Set(["g1"]))).toEqual({ families: 2, movements: 4 });
    expect(movementCatalogueSummary(items, new Set(["g1", "g2"]))).toEqual({ families: 2, movements: 5 });
    const pile = items.find((item) => item.kind === "PILE")!;
    expect(displayedCardCount(pile, NONE)).toBe(1);
    expect(displayedCardCount(pile, new Set([pile.key]))).toBe(2);
  });

  it("une famille dont un seul membre est affiché (carte simple) reste une famille affichée", () => {
    const cardio = visibleMovementItems(ALL, "", filters({ categoryIds: ["cardio"] }));
    expect(cardio).toEqual([expect.objectContaining({ kind: "SINGLE", key: "jump" })]);
    expect(movementCatalogueSummary(cardio, NONE)).toEqual({ families: 1, movements: 1 });
  });

  it("archives : seules les cartes archivées affichées sont comptées", () => {
    const archived = visibleMovementItems(ALL, "", filters({ statuses: ["ARCHIVED"] }));
    // « Squats » (membre archivé de g1, carte simple) et « Gainage » (indépendant).
    expect(movementCatalogueSummary(archived, NONE)).toEqual({ families: 1, movements: 2 });
  });

  it("liste vide : 0 famille, 0 mouvement", () => {
    expect(movementCatalogueSummary(visibleMovementItems(ALL, "zzz", EMPTY_MOVEMENT_FILTERS), NONE)).toEqual({
      families: 0,
      movements: 0,
    });
    expect(movementCatalogueSummary([], NONE)).toEqual({ families: 0, movements: 0 });
  });

  it("compteur « familles » actif : seules les cartes appartenant à une famille ; « mouvements » : toutes les cartes affichées", () => {
    const items = visibleMovementItems(ALL, "", EMPTY_MOVEMENT_FILTERS);
    const families = applyMovementCounter(items, "FAMILIES");
    expect(families.map((item) => item.key)).toEqual(["g1", "g2"]);
    expect(movementCatalogueSummary(families, NONE)).toEqual({ families: 2, movements: 2 });
    expect(applyMovementCounter(items, "MOVEMENTS")).toEqual(items);
    expect(applyMovementCounter(items, null)).toEqual(items);
  });

  it("cumul recherche + filtre du panneau + compteur actif, sans réinitialiser les autres critères", () => {
    // Recherche « squats » + Archivés et Actifs : pile g1 (jump, squat, assist) ; compteur Familles.
    const items = applyMovementCounter(
      visibleMovementItems(ALL, "squats", filters({ statuses: ["ACTIVE", "ARCHIVED"] })),
      "FAMILIES",
    );
    expect(items.map((item) => item.key)).toEqual(["g1"]);
    expect(movementCatalogueSummary(items, NONE)).toEqual({ families: 1, movements: 1 });
    expect(movementCatalogueSummary(items, new Set(["g1"]))).toEqual({ families: 1, movements: 3 });
    // Recherche « fentes » : aucun membre de famille ; compteur Familles → liste vide.
    const fentes = applyMovementCounter(visibleMovementItems(ALL, "fentes", EMPTY_MOVEMENT_FILTERS), "FAMILIES");
    expect(movementCatalogueSummary(fentes, NONE)).toEqual({ families: 0, movements: 0 });
  });
});
