import { describe, expect, it } from "@jest/globals";

import {
  hasMissingPhaseDuration,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import {
  openSheetDraft,
  requestedParameters,
  setWorkPhaseDuration,
  setWorkPhaseLabel,
  setWorkPhasesEnabled,
  sheetDraftResult,
} from "@/domain/activities/ExecutionParametersDraft";
import { computeIntrinsicDuration, computeOccurrenceDuration } from "@/domain/activities/executionCalculations";
import { transferParametersByRank } from "@/domain/activities/Movement";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-7 story R-7 (D-448, recette JA2 du 26/10/2026) — PH-5 (total en Durée indépendant des
 * phases ; Répétitions selon PHC-20261026), point 4 (phases restituées pendant l'édition),
 * point 6 (0 s refusée comme une durée manquante) et NV-3 (durée de rang surnuméraire vide).
 */

const phases = (...durations: (number | null)[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds: durationSeconds ?? 0 }));

const phaseLabel = (position: number) => `Phase ${position}`;

describe("R-7 — PH-5 : durée totale et phases (matrice I/O)", () => {
  it("Durée, phase vide : 3 × 30 s, pause 60 s, phases 3 s / — → total exact, identique au même exercice sans phases ; phase toujours signalée manquante", () => {
    const withMissing = uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 60, workPhases: phases(3, null) });
    const withoutPhases = uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 60 });
    const total = computeIntrinsicDuration(withMissing);
    expect(total.kind).toBe("exact");
    expect(total.seconds).toBe(computeIntrinsicDuration(withoutPhases).seconds);
    expect(computeOccurrenceDuration(withMissing, 45)).toEqual(computeOccurrenceDuration(withoutPhases, 45));
    // La phase vide reste non renseignée (jamais 0 s valide) : signalement et refus conservés.
    expect(hasMissingPhaseDuration(withMissing)).toBe(true);
  });

  it("Répétitions, phase vide : 3 × 10, phases 3 s / — → aucune estimation (incomplete, aucun montant), même avec une cadence", () => {
    for (const cadenceBeepIntervalSeconds of [0, 2]) {
      const parameters = uniformParameters({
        mode: "REPETITIONS",
        count: 3,
        target: 10,
        pauseSeconds: 60,
        cadenceBeepIntervalSeconds,
        workPhases: phases(3, null),
      });
      const result = computeIntrinsicDuration(parameters);
      expect(result.kind).toBe("incomplete");
      expect("seconds" in result).toBe(false);
    }
  });

  it("Répétitions complètes : 3 × 10, phases 3 s / 2 s → estimation 10 × 5 s par série (inchangée)", () => {
    const parameters = uniformParameters({ mode: "REPETITIONS", count: 3, target: 10, pauseSeconds: 60, workPhases: phases(3, 2) });
    const result = computeIntrinsicDuration(parameters);
    expect(result.kind).toBe("estimated");
    const work = result.events.filter((event) => event.kind === "WORK").map((event) => event.seconds);
    expect(work).toEqual([50, 50, 50]);
  });
});

describe("R-7 — point 4 : phases désactivées puis réactivées pendant l'édition", () => {
  const opened = () =>
    openSheetDraft(uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 15, workPhases: phases(5, 2, 3) }));

  it("Sans puis Avec : mêmes trois phases restituées (libellés, durées, identités, nombre) ; compteur d'identités inchangé", () => {
    const edited = setWorkPhaseLabel(setWorkPhaseDuration(opened(), 2, null), 1, "Montée");
    const sans = setWorkPhasesEnabled(edited, false);
    expect(sans.workPhases).toEqual([]);
    // Mémoire volatile : jamais transmise au parent.
    expect(requestedParameters(sans).series.workPhases).toEqual([]);
    const again = setWorkPhasesEnabled(sans, true);
    expect(again.workPhases).toEqual(edited.workPhases);
    expect(again.nextPhaseId).toBe(edited.nextPhaseId);
    expect(again.disabledWorkPhases).toBeNull();
  });

  it("hors édition (nouvelle ouverture) : Avec crée deux phases vides (Q5)", () => {
    const reopened = openSheetDraft(requestedParameters(setWorkPhasesEnabled(opened(), false)));
    const enabled = setWorkPhasesEnabled(reopened, true);
    expect(enabled.workPhases.map((phase) => phase.durationSeconds)).toEqual([null, null]);
    expect(enabled.workPhases.map((phase) => phase.label)).toEqual(["", ""]);
  });
});

describe("R-7 — point 6 : 0 s dans une durée de phase", () => {
  it("0 s reste 0 s dans le Brouillon et refuse le ✓ comme une durée manquante ; une durée vide reste vide", () => {
    const draft = setWorkPhaseDuration(
      openSheetDraft(uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 15, workPhases: phases(5, 2) })),
      2,
      0,
    );
    expect(draft.workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 0]);
    const result = sheetDraftResult(draft, phaseLabel);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual([{ code: "REQUIRED", field: "workPhases", level: "STRUCTURE", phaseId: 2 }]);
    }
    const emptied = setWorkPhaseDuration(draft, 2, null);
    expect(emptied.workPhases[1]!.durationSeconds).toBeNull();
  });
});

describe("R-7 — NV-3 : durées manquantes après un changement de niveau", () => {
  it("rangs communs conservés ; rang surnuméraire ouvert vide (jamais 0 s ni durée inventée)", () => {
    const source = uniformParameters({ mode: "DURATION", count: 3, target: 45, pauseSeconds: 15, workPhases: phases(5, 2) });
    const transferred = transferParametersByRank(source, [
      { id: 10, label: "Montée" },
      { id: 11, label: "Tenue" },
      { id: 12, label: "Descente" },
    ]);
    const draft = openSheetDraft(transferred);
    expect(draft.workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 2, null]);
    expect(hasMissingPhaseDuration(transferred)).toBe(true);
  });
});
