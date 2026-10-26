import { describe, expect, it } from "@jest/globals";

import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  numberTarget,
  readCatalogExecutionParameters,
  serializeCatalogExecutionParameters,
  unsetTarget,
  type CatalogExecutionParameters,
  type ExecutionParameters,
  type PhaseDuration,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import {
  commitSheetDraft,
  openSheetDraft,
  removeWorkPhase,
  setWorkPhaseCount,
  setUniformTarget,
  setWorkPhaseDuration,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";
import {
  advancePhaseCounter,
  markMovementUsed,
  resolveCatalogParameters,
  splitResolvedParameters,
  validateCatalogParameters,
  validateMovement,
  withPhaseStructure,
  type Movement,
  type MovementPhase,
} from "@/domain/activities/Movement";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { generateExecutionPhrase } from "@/domain/activities/executionPhrase";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-7 (A1.1, D-437 à D-439, MFN-01 à MFN-05, MFN-08) — Mouvement, scission
 * structure + valeurs, résolution et état exécutable / incomplet.
 */

const phaseLabel = (position: number) => `Phase ${position}`;

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: "movement-1",
    name: "Squat",
    description: null,
    media: [],
    categoryId: "category-1",
    bodyZoneIds: ["legs"],
    phases: [
      { id: 1, label: "Descente" },
      { id: 2, label: "Montée" },
    ],
    nextPhaseId: 3,
    used: false,
    levelGroup: null,
    ...overrides,
  };
}

/** Paramètres résolus à phases (Cible = Σ des durées). */
function resolvedWithPhases(workPhases: readonly WorkPhase[], options: { readonly count?: number } = {}): ExecutionParameters {
  return uniformParameters({
    count: options.count ?? 3,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 15,
    loadKg: 2.5,
    workPhases,
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 8,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: true,
  });
}

function catalogWith(phaseDurations: readonly PhaseDuration[], target = unsetTarget()): CatalogExecutionParameters {
  const { parameters } = splitResolvedParameters(resolvedWithPhases([]));
  const series = parameters.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
  return { ...parameters, series: { ...series, target, phaseDurations } };
}

function committed(draft: ExecutionSheetDraft): ExecutionParameters {
  const result = commitSheetDraft(draft, null, phaseLabel);
  if (!result.ok) {
    throw new Error(JSON.stringify(result.violations));
  }
  return result.value;
}

const durations = (draft: ExecutionSheetDraft) => draft.workPhases.map((phase) => phase.durationSeconds);
const ids = (draft: ExecutionSheetDraft) => draft.workPhases.map((phase) => phase.id);

describe("PRE7-A1.1 — validation du Mouvement (ch09, MFN-02, MFN-05)", () => {
  it("Mouvement valide : nom et description normalisés ; neuf : non utilisé, sans groupe", () => {
    const result = validateMovement(movement({ name: "  Squat   sauté ", description: "  Étape 1  " }));
    expect(result).toEqual({ ok: true, value: movement({ name: "Squat sauté", description: "Étape 1" }) });
    expect(validateMovement(movement({ phases: [], nextPhaseId: 1 })).ok).toBe(true);
    expect(validateMovement(movement({ levelGroup: { groupId: "group-1", sortKey: 2 } })).ok).toBe(true);
  });

  it("chaque champ invalide est signalé ; toutes les violations sont agrégées", () => {
    const cases: readonly [string, Partial<Movement>, string][] = [
      ["identifiant vide", { id: " " }, "movement.id"],
      ["nom vide", { name: "  " }, "movement.name"],
      ["nom trop long", { name: "x".repeat(81) }, "movement.name"],
      ["description trop longue", { description: "x".repeat(1001) }, "movement.description"],
      ["Catégorie absente", { categoryId: "" }, "movement.category"],
      ["Zones vides", { bodyZoneIds: [] }, "movement.bodyZoneIds"],
      ["Zones en double", { bodyZoneIds: ["legs", "legs"] }, "movement.bodyZoneIds"],
      ["libellé vide", { phases: [{ id: 1, label: " " }], nextPhaseId: 2 }, "movement.phases"],
      ["libellé de 21 points de code", { phases: [{ id: 1, label: "x".repeat(21) }], nextPhaseId: 2 }, "movement.phases"],
      ["identité dupliquée", { phases: [{ id: 1, label: "a" }, { id: 1, label: "b" }] }, "movement.phases"],
      ["sept phases", { phases: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, label: `p${id}` })), nextPhaseId: 8 }, "movement.phases"],
      ["compteur ≤ max(id)", { nextPhaseId: 2 }, "movement.nextPhaseId"],
      ["compteur non entier", { nextPhaseId: 3.5 }, "movement.nextPhaseId"],
      ["groupe sans identifiant", { levelGroup: { groupId: "", sortKey: 1 } }, "movement.levelGroup"],
      ["groupe sans clé finie", { levelGroup: { groupId: "g", sortKey: Number.NaN } }, "movement.levelGroup"],
    ];
    for (const [label, patch, field] of cases) {
      const result = validateMovement(movement(patch));
      expect({ label, fields: result.ok ? [] : result.violations.map((violation) => violation.field) }).toEqual({ label, fields: [field] });
    }
    const many = validateMovement(movement({ name: "", categoryId: "", nextPhaseId: 1 }));
    expect(many.ok ? [] : many.violations.map((violation) => violation.field)).toEqual(["movement.name", "movement.category", "movement.nextPhaseId"]);
  });

  it("médias ordonnés : identifiant non vide et cohérent avec l'asset", () => {
    const asset = { id: "asset-1", uri: "kodjo-media/a.jpg", createdAt: "2026-10-24T00:00:00.000Z" };
    expect(validateMovement(movement({ media: [{ assetId: "asset-1", asset }] })).ok).toBe(true);
    const mismatch = validateMovement(movement({ media: [{ assetId: "asset-2", asset }] }));
    expect(mismatch.ok ? [] : mismatch.violations.map((violation) => violation.field)).toEqual(["movement.media"]);
  });
});

describe("PRE7-A1.1 — compteur monotone, structure et « déjà utilisé » (MFN-02, MFN-08)", () => {
  it("advancePhaseCounter ne recule jamais ; le compteur reste > max(id)", () => {
    const base = movement({ nextPhaseId: 5 });
    expect(advancePhaseCounter(base, 3)).toBe(base);
    expect(advancePhaseCounter(base, 7).nextPhaseId).toBe(7);
    expect(advancePhaseCounter(base, 4.5)).toBe(base);
    expect(advancePhaseCounter(movement({ nextPhaseId: 1 }), 0).nextPhaseId).toBe(3);
  });

  it("withPhaseStructure : identité retirée consommée, compteur avancé ; aucune durée portée", () => {
    const next = withPhaseStructure(movement(), [{ id: 1, label: "Descente" }], 3);
    expect(next.phases).toEqual([{ id: 1, label: "Descente" }]);
    expect(next.nextPhaseId).toBe(3);
    const withDurations = withPhaseStructure(movement(), [{ id: 4, label: "x", durationSeconds: 9 } as MovementPhase], 5);
    expect(withDurations.phases).toEqual([{ id: 4, label: "x" }]);
    expect(withDurations.nextPhaseId).toBe(5);
  });

  it("MFN/AC30 : withPhaseStructure refuse de réintroduire une identité retirée ; une identité ≥ compteur est une allocation nouvelle", () => {
    const source = movement({ nextPhaseId: 4 });
    expect(() =>
      withPhaseStructure(source, [{ id: 1, label: "a" }, { id: 2, label: "b" }, { id: 3, label: "c" }], 4),
    ).toThrow();
    const allocated = withPhaseStructure(source, [{ id: 1, label: "a" }, { id: 2, label: "b" }, { id: 4, label: "d" }], 5);
    expect(allocated.phases.map((phase) => phase.id)).toEqual([1, 2, 4]);
    expect(allocated.nextPhaseId).toBe(5);
    // Une identité déjà présente reste admise (déplacement, renommage).
    expect(withPhaseStructure(source, [{ id: 2, label: "B" }, { id: 1, label: "A" }], 4).phases).toEqual([
      { id: 2, label: "B" },
      { id: 1, label: "A" },
    ]);
  });

  it("markMovementUsed : faux au départ, vrai ensuite, irréversible et idempotent ; contenu inchangé", () => {
    const fresh = movement();
    expect(fresh.used).toBe(false);
    const used = markMovementUsed(fresh);
    expect(used).toEqual({ ...fresh, used: true });
    expect(markMovementUsed(used)).toBe(used);
  });

  it("matrice : Mouvement à compteur 5, phases [1, 2] → Brouillon ouvert à 5, phase ajoutée 5, compteur rendu ≥ 6", () => {
    const source = movement({ nextPhaseId: 5 });
    const catalog = splitResolvedParameters(
      resolvedWithPhases([
        { id: 1, label: "Descente", durationSeconds: 6 },
        { id: 2, label: "Montée", durationSeconds: 3 },
      ]),
    ).parameters;
    const resolution = resolveCatalogParameters(source.phases, catalog);
    let draft = openSheetDraft(resolution.parameters, { nextPhaseId: source.nextPhaseId });
    expect(draft.nextPhaseId).toBe(5);
    draft = setWorkPhaseCount(draft, 3);
    expect(ids(draft)).toEqual([1, 2, 5]);
    const split = splitResolvedParameters(committed(draft));
    const updated = withPhaseStructure(source, split.phases, draft.nextPhaseId);
    expect(updated.nextPhaseId).toBeGreaterThanOrEqual(6);
    expect(updated.phases.map((phase) => phase.id)).toEqual([1, 2, 5]);
    expect(validateMovement(updated).ok).toBe(true);
    // Sans compteur, ou avec un compteur sous max(id) + 1 : jamais sous max(id) + 1.
    expect(openSheetDraft(resolution.parameters).nextPhaseId).toBe(3);
    expect(openSheetDraft(resolution.parameters, { nextPhaseId: 1 }).nextPhaseId).toBe(3);
  });

  it("MFN/AC30 : retrait de la phase au plus grand identifiant, fermeture, réouverture et ajout → identifiant retiré non réutilisé", () => {
    let source = movement({
      phases: [
        { id: 1, label: "a" },
        { id: 2, label: "b" },
        { id: 3, label: "c" },
      ],
      nextPhaseId: 4,
    });
    let catalog = splitResolvedParameters(
      resolvedWithPhases([
        { id: 1, label: "a", durationSeconds: 2 },
        { id: 2, label: "b", durationSeconds: 3 },
        { id: 3, label: "c", durationSeconds: 4 },
      ]),
    ).parameters;
    let draft = openSheetDraft(resolveCatalogParameters(source.phases, catalog).parameters, { nextPhaseId: source.nextPhaseId });
    draft = removeWorkPhase(draft, 3);
    let split = splitResolvedParameters(committed(draft));
    source = withPhaseStructure(source, split.phases, draft.nextPhaseId);
    catalog = readCatalogExecutionParameters(serializeCatalogExecutionParameters(split.parameters));
    expect(source.phases.map((phase) => phase.id)).toEqual([1, 2]);
    expect(source.nextPhaseId).toBe(4);
    draft = openSheetDraft(resolveCatalogParameters(source.phases, catalog).parameters, { nextPhaseId: source.nextPhaseId });
    draft = setWorkPhaseCount(draft, 3);
    expect(ids(draft)).toEqual([1, 2, 4]);
    split = splitResolvedParameters(committed(draft));
    source = withPhaseStructure(source, split.phases, draft.nextPhaseId);
    expect(source.nextPhaseId).toBe(5);
  });
});

describe("PRE7-A1.1 — scission et résolution (MFN-02, MFN/AC14, AC35)", () => {
  it("aller-retour complet : split puis resolve rend les paramètres, la phrase et la durée identiques", () => {
    const originals: readonly ExecutionParameters[] = [
      resolvedWithPhases([
        { id: 1, label: "Descente", durationSeconds: 6 },
        { id: 2, label: "Montée", durationSeconds: 3 },
      ]),
      resolvedWithPhases([
        { id: 7, label: "Maintien", durationSeconds: 30 },
        { id: 3, label: "Relâche", durationSeconds: 15 },
        { id: 5, label: "Repos", durationSeconds: 5 },
      ], { count: 1 }),
      uniformParameters({ count: 4, target: 45, pauseSeconds: 20 }),
      uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 60, loadKg: 10, loadEnabled: true }),
      variableParameters({ rows: [[30, 10, 0], [45, 15, 2.5]] }),
    ];
    for (const original of originals) {
      const split = splitResolvedParameters(original);
      expect(JSON.stringify(split.parameters)).not.toContain("label");
      const reread = readCatalogExecutionParameters(serializeCatalogExecutionParameters(split.parameters));
      const resolution = resolveCatalogParameters(split.phases, reread);
      expect(resolution).toEqual({ status: "EXECUTABLE", parameters: original });
      expect(generateExecutionPhrase(resolution.parameters)).toEqual(generateExecutionPhrase(original));
      expect(computeIntrinsicDuration(resolution.parameters)).toEqual(computeIntrinsicDuration(original));
    }
  });

  it("structure : ordre et libellés du Mouvement ; durées associées par phaseId, en tout ordre (MFN/AC14)", () => {
    const structure: readonly MovementPhase[] = [
      { id: 2, label: "Montée" },
      { id: 1, label: "Descente" },
    ];
    const catalog = catalogWith([
      { phaseId: 1, durationSeconds: 6 },
      { phaseId: 2, durationSeconds: 3 },
    ], numberTarget(9));
    const resolution = resolveCatalogParameters(structure, catalog);
    expect(resolution.status).toBe("EXECUTABLE");
    expect(resolution.parameters.series.kind === "UNIFORM" && resolution.parameters.series.workPhases).toEqual([
      { id: 2, label: "Montée", durationSeconds: 3 },
      { id: 1, label: "Descente", durationSeconds: 6 },
    ]);
  });

  it("matrice : frère incomplet [1:6, 2:3, 3:null], Cible UNSET → INCOMPLETE, missingPhaseIds [3], durée manquante à 0, ouverte null", () => {
    const structure: readonly MovementPhase[] = [
      { id: 1, label: "a" },
      { id: 2, label: "b" },
      { id: 3, label: "c" },
    ];
    const catalog = catalogWith([
      { phaseId: 1, durationSeconds: 6 },
      { phaseId: 2, durationSeconds: 3 },
      { phaseId: 3, durationSeconds: null },
    ]);
    const resolution = resolveCatalogParameters(structure, catalog);
    expect(resolution.status).toBe("INCOMPLETE");
    if (resolution.status !== "INCOMPLETE") return;
    expect(resolution.missingPhaseIds).toEqual([3]);
    const { series } = resolution.parameters;
    expect(series.kind === "UNIFORM" && series.workPhases.map((phase) => phase.durationSeconds)).toEqual([6, 3, 0]);
    expect(series.kind === "UNIFORM" && series.target).toEqual(unsetTarget());
    const draft = openSheetDraft(resolution.parameters);
    expect(durations(draft)).toEqual([6, 3, null]);
    // Compléter la durée et — PRE-7 (D-446) : la Cible n'est plus dérivée de Σ — renseigner la
    // durée de série rend l'exercice exécutable ; sa scission ne porte plus de null.
    const completed = committed(setUniformTarget(setWorkPhaseDuration(draft, 3, 4), numberTarget(120)));
    const split = splitResolvedParameters(completed);
    expect(resolveCatalogParameters(split.phases, split.parameters).status).toBe("EXECUTABLE");
    // Et la scission de la forme incomplète la restitue telle quelle.
    expect(splitResolvedParameters(resolution.parameters)).toEqual({ phases: structure, parameters: catalog });
  });

  it("scission d'un exercice résolu incomplet : durée < 1 s → null ; PRE-7 (D-446) : Cible conservée", () => {
    const partial = resolvedWithPhases([
      { id: 1, label: "a", durationSeconds: 9 },
      { id: 2, label: "b", durationSeconds: 0 },
    ]);
    const { parameters } = splitResolvedParameters(partial);
    expect(parameters.version).toBe(CATALOG_EXECUTION_PARAMETERS_VERSION);
    expect(parameters.series).toEqual(
      expect.objectContaining({
        target: numberTarget(9),
        phaseDurations: [
          { phaseId: 1, durationSeconds: 9 },
          { phaseId: 2, durationSeconds: null },
        ],
      }),
    );
  });

  it("matrice : structure ≠ valeurs → ExecutionParametersDataError, jamais une association approchée", () => {
    const structure: readonly MovementPhase[] = [
      { id: 1, label: "a" },
      { id: 2, label: "b" },
    ];
    const variable = splitResolvedParameters(variableParameters({ rows: [[30, 10, 0], [45, 15, 0]] })).parameters;
    const refused: readonly [string, readonly MovementPhase[], CatalogExecutionParameters][] = [
      ["identité absente des valeurs", [...structure, { id: 3, label: "c" }], catalogWith([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 2, durationSeconds: 3 }], numberTarget(9))],
      ["identité absente de la structure", structure, catalogWith([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 3, durationSeconds: 3 }], numberTarget(9))],
      ["valeurs sans structure", [], catalogWith([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 2, durationSeconds: 3 }], numberTarget(9))],
      ["structure sans valeurs", structure, catalogWith([], numberTarget(9))],
      ["structure sur une série variable", structure, variable],
      ["structure invalide", [{ id: 1, label: "" }, { id: 2, label: "b" }], catalogWith([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 2, durationSeconds: 3 }], numberTarget(9))],
      ["durée 0", structure, catalogWith([{ phaseId: 1, durationSeconds: 0 }, { phaseId: 2, durationSeconds: 3 }], numberTarget(3))],
    ];
    // PRE-7 (D-446) : un frère incomplet à Cible chiffrée n'est plus une donnée corrompue ; il
    // reste INCOMPLETE, Cible conservée.
    const chiffre = resolveCatalogParameters(structure, catalogWith([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 2, durationSeconds: null }], numberTarget(6)));
    expect(chiffre.status).toBe("INCOMPLETE");
    expect(chiffre.parameters.series.kind === "UNIFORM" && chiffre.parameters.series.target).toEqual(numberTarget(6));
    for (const [label, phases, catalog] of refused) {
      let error: unknown = null;
      try {
        resolveCatalogParameters(phases, catalog);
      } catch (caught) {
        error = caught;
      }
      expect({ label, dataError: error instanceof ExecutionParametersDataError }).toEqual({ label, dataError: true });
    }
  });
});

describe("PRE7-A1.1 — validation Catalogue : exercice édité et frère incomplet (MFN-08, MFN/AC24, AC25)", () => {
  const structure: readonly MovementPhase[] = [
    { id: 1, label: "a" },
    { id: 2, label: "b" },
    { id: 3, label: "c" },
  ];
  const incomplete = catalogWith([
    { phaseId: 1, durationSeconds: 6 },
    { phaseId: 2, durationSeconds: 3 },
    { phaseId: 3, durationSeconds: null },
  ]);
  const complete = catalogWith([
    { phaseId: 1, durationSeconds: 6 },
    { phaseId: 2, durationSeconds: 3 },
    { phaseId: 3, durationSeconds: 1 },
  ], numberTarget(10));

  it("complet : EXECUTABLE dans les deux portées", () => {
    for (const scope of ["EDITED", "SIBLING_ACCEPTED"] as const) {
      const result = validateCatalogParameters(structure, complete, scope);
      expect(result.ok && result.value.status).toBe("EXECUTABLE");
    }
  });

  it("MFN/AC25 : exercice édité incomplet refusé, REQUIRED workPhases portant le phaseId manquant", () => {
    const result = validateCatalogParameters(structure, incomplete, "EDITED");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 3 });
    }
  });

  it("MFN/AC24 : frère incomplet accepté explicitement → valide et INCOMPLETE, jamais EXECUTABLE", () => {
    const result = validateCatalogParameters(structure, incomplete, "SIBLING_ACCEPTED");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("INCOMPLETE");
      expect(result.value.status === "INCOMPLETE" && result.value.missingPhaseIds).toEqual([3]);
    }
  });

  it("succès incomplet : paramètres effectifs normalisés comme le succès complet (N = 1 → ordre des côtés « Un côté après l'autre »)", () => {
    const series = incomplete.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
    const single = { ...incomplete, sideOrder: "BY_SERIES" as const, series: { ...series, count: 1 } };
    const result = validateCatalogParameters(structure, single, "SIBLING_ACCEPTED");
    expect(result.ok && result.value.status).toBe("INCOMPLETE");
    expect(result.ok && result.value.parameters.sideOrder).toBe("BY_SIDE");
    const completeSeries = complete.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
    const singleComplete = { ...complete, sideOrder: "BY_SERIES" as const, series: { ...completeSeries, count: 1 } };
    const executable = validateCatalogParameters(structure, singleComplete, "EDITED");
    expect(executable.ok && executable.value.parameters.sideOrder).toBe("BY_SIDE");
  });

  it("frère incomplet avec une autre violation : refusé ; structure ≠ valeurs : violation, jamais une exception", () => {
    const series = incomplete.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
    const badPause = { ...incomplete, series: { ...series, pauseSeconds: -1 } };
    const refused = validateCatalogParameters(structure, badPause, "SIBLING_ACCEPTED");
    expect(refused.ok ? [] : refused.violations.map((violation) => violation.field)).toEqual(["pauseSeconds"]);
    expect(validateCatalogParameters(structure.slice(0, 2), incomplete, "SIBLING_ACCEPTED")).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "workPhases", level: "STRUCTURE" }],
    });
  });
});
