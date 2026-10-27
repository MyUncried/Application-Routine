import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import {
  EMPTY_MOVEMENT_FILTERS,
  countActiveFilters,
  visibleMovementItems,
  type MovementCatalogueFilters,
  type MovementCatalogueItem,
} from "@/features/activities/movementCatalogueView";

/**
 * PRE-8 (stories B.5 et B.7) — vue du Catalogue des Mouvements, arbitrages de Hermann du
 * 27/10/2026 : Q-B2 (rang le plus haut en tête), Q1 (OU dans un groupe, ET entre groupes), Q2
 * (Actifs par défaut), Q3 définitif (statut d'abord, puis pile entière de ses membres autorisés
 * dès qu'un membre correspond ; indépendants filtrés seuls), Q4 (recherche ET filtres), Q5 (rangs
 * de la famille complète).
 */

function entry(
  id: string,
  name: string,
  options: {
    readonly group?: string;
    readonly rank?: number;
    readonly total?: number;
    readonly archived?: boolean;
    readonly exercises?: number;
    readonly categoryId?: string;
    readonly zones?: readonly string[];
    readonly aliases?: readonly string[];
  } = {},
): MovementCatalogueEntry {
  const movement: Movement = {
    id,
    name,
    description: null,
    media: [],
    categoryId: options.categoryId ?? "renfo",
    bodyZoneIds: [...(options.zones ?? ["cuisses"])],
    phases: [],
    nextPhaseId: 1,
    aliases: [...(options.aliases ?? [])],
    levelGroup: options.group !== undefined ? { groupId: options.group, sortKey: (options.rank ?? 1) - 1 } : null,
  } as Movement;
  return {
    movement,
    level: options.group !== undefined ? { rank: options.rank ?? 1, total: options.total ?? 3 } : null,
    exerciseCount: options.exercises ?? 0,
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

/** Lecture compacte : pile → ids dans l'ordre affiché, carte simple → id. */
const shape = (items: readonly MovementCatalogueItem[]) =>
  items.map((item) => (item.kind === "PILE" ? item.members.map((member) => member.movement.id) : item.entry.movement.id));

// Famille Squats : assisté (1), squat (2, archivé), sauté (3) ; indépendants Fentes et Gainage.
const SQUATS = [
  entry("assist", "Squats assistés", { group: "g", rank: 1, categoryId: "mobilite" }),
  entry("squat", "Squats", { group: "g", rank: 2, archived: true, exercises: 0 }),
  entry("jump", "Squats sautés", { group: "g", rank: 3, exercises: 2, categoryId: "cardio" }),
];
const FENTES = entry("fentes", "Fentes avant", { zones: ["genoux"], exercises: 1 });
const GAINAGE = entry("gainage", "Gainage", { archived: true, categoryId: "cardio", aliases: ["Planche"] });
const ALL = [FENTES, ...SQUATS, GAINAGE];

describe("PRE-8 B.5/B.7 — piles, recherche et filtres du Catalogue des Mouvements", () => {
  it("Q2 : par défaut, Actifs seul — un archivé est exclu, même dans une pile ; pile au rang le plus haut en tête", () => {
    const items = visibleMovementItems(ALL, "", EMPTY_MOVEMENT_FILTERS);
    expect(shape(items)).toEqual(["fentes", ["jump", "assist"]]);
    expect(shape(visibleMovementItems(ALL, "", filters({ statuses: ["ACTIVE"] })))).toEqual(shape(items));
  });

  it("Q3 : Archivés seul — uniquement les archivés ; les deux statuts — tout, rangs de la famille complète", () => {
    const archived = visibleMovementItems(ALL, "", filters({ statuses: ["ARCHIVED"] }));
    expect(shape(archived)).toEqual(["squat", "gainage"]);
    // Membre seul affiché : carte simple qui garde son rang réel « Niveau 2 sur 3 ».
    expect(archived[0]).toMatchObject({ kind: "SINGLE", entry: { level: { rank: 2, total: 3 } } });
    const both = visibleMovementItems(ALL, "", filters({ statuses: ["ACTIVE", "ARCHIVED"] }));
    expect(shape(both)).toEqual(["fentes", ["jump", "squat", "assist"], "gainage"]);
  });

  it("Q3 définitif : un membre autorisé qui correspond affiche TOUS les membres autorisés de la pile", () => {
    // Seul « Squats sautés » est en Cardio ; la pile garde aussi « Squats assistés » (Mobilité).
    expect(shape(visibleMovementItems(ALL, "", filters({ categoryIds: ["cardio"] })))).toEqual([["jump", "assist"]]);
    // Utilisation « Sans exercice » : « assist » correspond → pile entière ; Fentes (1 exercice) exclu.
    expect(shape(visibleMovementItems(ALL, "", filters({ usage: ["WITHOUT"] })))).toEqual([["jump", "assist"]]);
    // Aucun filtre autre que Statut ne rend visible un archivé : Gainage (Cardio, archivé) reste caché.
    expect(shape(visibleMovementItems(ALL, "", filters({ categoryIds: ["cardio"] })))).not.toContain("gainage");
  });

  it("Q1 : OU dans un groupe, ET entre groupes ; Zones : au moins une valeur commune ; indépendants filtrés seuls", () => {
    expect(shape(visibleMovementItems(ALL, "", filters({ categoryIds: ["mobilite", "renfo"] })))).toEqual([
      "fentes",
      ["jump", "assist"],
    ]);
    expect(shape(visibleMovementItems(ALL, "", filters({ bodyZoneIds: ["genoux", "epaules"] })))).toEqual(["fentes"]);
    expect(shape(visibleMovementItems(ALL, "", filters({ bodyZoneIds: ["genoux"], usage: ["WITHOUT"] })))).toEqual([]);
    expect(shape(visibleMovementItems(ALL, "", filters({ levels: ["WITHOUT"] })))).toEqual(["fentes"]);
    expect(shape(visibleMovementItems(ALL, "", filters({ levels: ["WITH", "WITHOUT"] })))).toEqual(["fentes", ["jump", "assist"]]);
  });

  it("Q4 : recherche ET filtres ; la recherche présente des piles dépliables, ordre R02", () => {
    // « sautes » ne correspond qu'à un membre : la pile entière de ses membres autorisés s'affiche.
    expect(shape(visibleMovementItems(ALL, "sautes", EMPTY_MOVEMENT_FILTERS))).toEqual([["jump", "assist"]]);
    expect(shape(visibleMovementItems(ALL, "sautes", filters({ categoryIds: ["renfo"] })))).toEqual([]);
    // Alias d'un archivé : invisible sans « Archivés », visible avec.
    expect(shape(visibleMovementItems(ALL, "planche", EMPTY_MOVEMENT_FILTERS))).toEqual([]);
    expect(shape(visibleMovementItems(ALL, "planche", filters({ statuses: ["ARCHIVED"] })))).toEqual(["gainage"]);
  });

  it("compte les valeurs de filtre choisies (résumé de la commande Filtres)", () => {
    expect(countActiveFilters(EMPTY_MOVEMENT_FILTERS)).toBe(0);
    expect(countActiveFilters(filters({ statuses: ["ARCHIVED"], categoryIds: ["a", "b"] }))).toBe(3);
  });
});
