import { describe, expect, it } from "@jest/globals";

import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import {
  isSessionCatalogueFiltered,
  matchesSessionQuery,
  sessionCatalogueContext,
} from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { countLabel, pluralFormOf } from "@/shared/ui/catalogueContext";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §4 et §5,
 * CE-CAT-CTX-01) — Catalogue des Séances : recherche, nombres de vue réels, « N résultats » dérivés
 * de la liste affichée, accords 0 / 1 / 2.
 */

const projection = (id: string, name: string, exerciseCount: number, status: "ACTIVE" | "ARCHIVED" = "ACTIVE") =>
  ({ id, name, exerciseCount, status, labelId: null, categories: [], bodyZoneIds: [], format: "FREE" }) as unknown as SessionCatalogueProjection;

const SESSIONS = [
  projection("a", "Renforcement du genou", 5),
  projection("b", "EMOM du matin", 1),
  projection("c", "Tabata gainage", 1),
  projection("d", "Mobilité du matin", 3, "ARCHIVED"),
  projection("e", "Étirements après course", 1, "ARCHIVED"),
  projection("f", "Séance vide", 0),
];
const archived: SessionCatalogueFilters = { ...EMPTY_SESSION_FILTERS, statuses: new Set(["ARCHIVED"]) };
const ids = (list: readonly SessionCatalogueProjection[]) => list.map((session) => session.id);

describe("PRE-9 CAT.1 — zone de contexte du Catalogue des Séances", () => {
  it("recherche : nom, sans casse ni diacritiques ; requête vide : tout", () => {
    expect(matchesSessionQuery(SESSIONS[0]!, "")).toBe(true);
    expect(matchesSessionQuery(SESSIONS[0]!, "  GENOU ")).toBe(true);
    expect(matchesSessionQuery(SESSIONS[4]!, "etirements")).toBe(true);
    expect(matchesSessionQuery(SESSIONS[0]!, "matin")).toBe(false);
  });

  it("nombres de vue réels (collection courante, avant le choix de la vue) ; la Séance sans Exercice n'appartient à aucune vue", () => {
    const context = sessionCatalogueContext(SESSIONS, { query: "", filters: EMPTY_SESSION_FILTERS, view: null });
    expect(ids(context.visible)).toEqual(["a", "b", "c", "f"]);
    expect(context).toMatchObject({ singleCount: 2, multipleCount: 1 });
    // Le choix de la vue restreint la liste, pas les nombres.
    const single = sessionCatalogueContext(SESSIONS, { query: "", filters: EMPTY_SESSION_FILTERS, view: "SINGLE" });
    expect(ids(single.visible)).toEqual(["b", "c"]);
    expect(single).toMatchObject({ singleCount: 2, multipleCount: 1 });
  });

  it("archives, recherche et vue combinées sur la même liste", () => {
    const context = sessionCatalogueContext(SESSIONS, { query: "", filters: archived, view: null });
    expect(ids(context.visible)).toEqual(["d", "e"]);
    expect(context).toMatchObject({ singleCount: 1, multipleCount: 1 });
    const searched = sessionCatalogueContext(SESSIONS, { query: "matin", filters: archived, view: "MULTIPLE" });
    expect(ids(searched.visible)).toEqual(["d"]);
    expect(searched).toMatchObject({ singleCount: 0, multipleCount: 1 });
    const none = sessionCatalogueContext(SESSIONS, { query: "zzz", filters: archived, view: null });
    expect(none).toEqual({ visible: [], singleCount: 0, multipleCount: 0 });
  });

  it("état filtré ou archivé : au moins un critère du panneau Filtre", () => {
    expect(isSessionCatalogueFiltered(EMPTY_SESSION_FILTERS)).toBe(false);
    expect(isSessionCatalogueFiltered(archived)).toBe(true);
    expect(isSessionCatalogueFiltered({ ...EMPTY_SESSION_FILTERS, categoryIds: new Set(["renfo"]) })).toBe(true);
  });

  it("accords exacts : « 0 résultat », « 1 résultat », « 2 résultats »", () => {
    const templates = { one: strings.screens.catalogueContext.resultsOne, many: strings.screens.catalogueContext.resultsMany };
    expect(countLabel(0, templates)).toBe("0 résultat");
    expect(countLabel(1, templates)).toBe("1 résultat");
    expect(countLabel(2, templates)).toBe("2 résultats");
    expect(countLabel(12, templates)).toBe("12 résultats");
    expect([0, 1, 2].map(pluralFormOf)).toEqual(["ONE", "ONE", "MANY"]);
  });
});
