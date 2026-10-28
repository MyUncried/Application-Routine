import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { SessionStatus } from "@/domain/sessions/SessionRepository";
import {
  countActiveSessionFilters,
  EMPTY_SESSION_FILTERS,
  initiallyOpenSections,
  matchesSessionFilters,
  type SessionCatalogueFilters,
} from "@/features/sessions/sessionCatalogueFilters";
import { projectSessionForCatalogue, type CatalogueCategoryRef } from "@/features/sessions/sessionCatalogueProjection";
import { commandRowLayout, matchesView, toggledView } from "@/features/sessions/sessionCatalogueView";

/**
 * PRE-8 (epic E, stories E.4 et E.6) — vues « Un exercice | Plusieurs », rangée responsive (Q-E4) et
 * sémantique des filtres (Q-E3 option B, Q-E5 option A).
 */

const CATEGORIES = new Map<string, CatalogueCategoryRef>([
  ["mobilite", { id: "mobilite", name: "Mobilité", color: "#2E9B62" }],
  ["renfo", { id: "renfo", name: "Renforcement", color: "#E5484D" }],
]);

let sequence = 0;
const exercise = (categoryId: string, bodyZoneIds: readonly string[]): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: "Ex",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds,
  categoryId,
  media: [],
});

const session = (
  exercises: readonly Activity[],
  overrides: { status?: SessionStatus; labelId?: string | null } = {},
) =>
  projectSessionForCatalogue(
    {
      id: `s-${++sequence}`,
      name: "S",
      color: "#3B82F6",
      labelId: overrides.labelId ?? null,
      status: overrides.status ?? "ACTIVE",
      archivedAt: null,
      updatedAt: "2026-10-28T08:00:00.000Z",
      structure: { elements: exercises.map((item) => ({ kind: "EXERCISE" as const, exercise: item })), stopPoints: [] },
    },
    CATEGORIES,
  );

const filters = (patch: Partial<Record<keyof SessionCatalogueFilters, readonly string[]>>): SessionCatalogueFilters => ({
  statuses: new Set((patch.statuses ?? []) as never),
  categoryIds: new Set(patch.categoryIds ?? []),
  bodyZoneIds: new Set(patch.bodyZoneIds ?? []),
  labelIds: new Set(patch.labelIds ?? []),
  formats: new Set((patch.formats ?? []) as never),
});

describe("PRE-8 E.4 — vues", () => {
  const one = session([exercise("renfo", [])]);
  const many = session([exercise("renfo", []), exercise("mobilite", [])]);
  const empty = session([]);

  it("aucune option : collection complète ; Un exercice ; Plusieurs", () => {
    expect([one, many, empty].filter((item) => matchesView(item, null))).toHaveLength(3);
    expect([one, many, empty].filter((item) => matchesView(item, "SINGLE"))).toEqual([one]);
    expect([one, many, empty].filter((item) => matchesView(item, "MULTIPLE"))).toEqual([many]);
  });

  it("toucher l'option active la désélectionne", () => {
    expect(toggledView(null, "SINGLE")).toBe("SINGLE");
    expect(toggledView("SINGLE", "MULTIPLE")).toBe("MULTIPLE");
    expect(toggledView("MULTIPLE", "MULTIPLE")).toBeNull();
  });
});

describe("PRE-8 E.4 — rangée responsive (Q-E4)", () => {
  // Mesures Figma : bascule ≈ 150, commande étendue 132, rond 34, écart 12 → ≈ 382 pour la rangée.
  const measures = { toggle: 150, extendedFilter: 132, compactFilter: 34 + 12 + 34, circle: 34, gap: 12 };
  const at = (width: number, filterActive: boolean) => commandRowLayout({ ...measures, available: width - 32, filterActive });

  it("filtre inactif : une ligne à 360, 402 et 440", () => {
    for (const width of [360, 402, 440]) expect(at(width, false)).toEqual({ lines: 1, filter: "ROUND" });
  });

  it("filtre actif : étendu à 440 ; compact à 402 ; deux lignes à 360 (étendu seul sur sa ligne)", () => {
    expect(at(440, true)).toEqual({ lines: 1, filter: "EXTENDED" });
    expect(at(402, true)).toEqual({ lines: 1, filter: "COMPACT" });
    expect(at(360, true)).toEqual({ lines: 2, filter: "EXTENDED" });
  });

  it("texte agrandi : deux lignes, compact si l'étendu ne tient même pas seul", () => {
    expect(commandRowLayout({ ...measures, toggle: 260, extendedFilter: 260, available: 328, filterActive: true })).toEqual({
      lines: 2,
      filter: "COMPACT",
    });
    expect(commandRowLayout({ ...measures, toggle: 260, available: 328, filterActive: false })).toEqual({ lines: 2, filter: "ROUND" });
  });
});

describe("PRE-8 E.6 — filtres (Q-E3 option B)", () => {
  const mobilityKnees = session([exercise("mobilite", ["dos"]), exercise("renfo", ["genoux"])]);
  const strengthOnly = session([exercise("renfo", ["dos"])], { labelId: "hyrox" });
  const archived = session([exercise("mobilite", ["genoux"])], { status: "ARCHIVED" });
  const all = [mobilityKnees, strengthOnly, archived];
  const visible = (value: SessionCatalogueFilters) => all.filter((item) => matchesSessionFilters(item, value));

  it("aucun filtre : Actives seules", () => {
    expect(visible(EMPTY_SESSION_FILTERS)).toEqual([mobilityKnees, strengthOnly]);
  });

  it("Catégorie = Mobilité ET Zone = Genoux : portées par deux exercices différents de la même Séance", () => {
    expect(visible(filters({ categoryIds: ["mobilite"], bodyZoneIds: ["genoux"] }))).toEqual([mobilityKnees]);
  });

  it("OU dans une section", () => {
    expect(visible(filters({ categoryIds: ["mobilite", "renfo"] }))).toEqual([mobilityKnees, strengthOnly]);
  });

  it("une Séance archivée n'apparaît que si le Statut l'admet", () => {
    expect(visible(filters({ categoryIds: ["mobilite"] }))).toEqual([mobilityKnees]);
    expect(visible(filters({ statuses: ["ARCHIVED"] }))).toEqual([archived]);
    expect(visible(filters({ statuses: ["ACTIVE", "ARCHIVED"], bodyZoneIds: ["genoux"] }))).toEqual([mobilityKnees, archived]);
  });

  it("Étiquette de la Séance ; Format Libre = toutes les Séances (aucun format persisté)", () => {
    expect(visible(filters({ labelIds: ["hyrox"] }))).toEqual([strengthOnly]);
    expect(visible(filters({ formats: ["FREE"] }))).toEqual([mobilityKnees, strengthOnly]);
    expect(visible(filters({ formats: ["EMOM"] }))).toEqual([]);
  });

  it("sections ouvertes à l'ouverture : celles qui portent un filtre ; sans filtre, Statut seul", () => {
    expect([...initiallyOpenSections(EMPTY_SESSION_FILTERS)]).toEqual(["STATUS"]);
    expect([...initiallyOpenSections(filters({ labelIds: ["hyrox"], formats: ["FREE"] }))]).toEqual(["LABELS", "FORMAT"]);
    expect(countActiveSessionFilters(filters({ labelIds: ["hyrox"], formats: ["FREE"] }))).toBe(2);
  });
});
