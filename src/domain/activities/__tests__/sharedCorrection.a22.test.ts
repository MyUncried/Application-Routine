import { describe, expect, it } from "@jest/globals";

import { createEmptyExecutionParameters } from "../ExecutionParameters";
import { repriseExecutionParameters, type Movement } from "../Movement";
import {
  buildSiblingCompletions,
  completionEntriesReady,
  initialCompletionEntries,
  type SiblingGap,
} from "../sharedCorrection";

/**
 * PRE-7 story A2.2 (D-438, MFN-02, MFN-06, MFN-08 ; relevé Figma MFN du 23/10) — états dérivés
 * du domaine pour l'Éditeur : brouillon de l'étape de complétion (aucune valeur inventée,
 * complétion passée explicite) et paramètres initiaux d'une création sur un geste repris.
 * PRE-7 (R-4) : la portée de l'ancienne question d'identité (`correctionScope`) est retirée avec
 * elle ; la portée du dialogue C03 est le nombre d'autres exercices (`decideMovementSave`).
 */

const GAPS: readonly SiblingGap[] = [
  { definitionId: "def-a", missingPhaseIds: [3, 4], missingSeriesDuration: false },
  { definitionId: "def-b", missingPhaseIds: [], missingSeriesDuration: true },
];

describe("étape de complétion des durées manquantes (MFN-08, MFN/AC24)", () => {
  it("brouillon initial : toutes les durées vides, aucun frère passé ; Terminer indisponible", () => {
    const entries = initialCompletionEntries(GAPS);
    expect(entries).toEqual([
      { definitionId: "def-a", skipped: false, phaseDurations: [{ phaseId: 3, durationSeconds: null }, { phaseId: 4, durationSeconds: null }], seriesDurationSeconds: null },
      { definitionId: "def-b", skipped: false, phaseDurations: [], seriesDurationSeconds: null },
    ]);
    expect(completionEntriesReady(GAPS, entries)).toBe(false);
    expect(() => buildSiblingCompletions(GAPS, entries)).toThrow();
  });

  it("durées saisies (≥ 1 s) ou frère passé : prêt ; un frère passé reçoit null partout (conservé incomplet)", () => {
    const [a, b] = initialCompletionEntries(GAPS);
    const entries = [
      { ...a!, phaseDurations: [{ phaseId: 3, durationSeconds: 5 }, { phaseId: 4, durationSeconds: 7 }] },
      { ...b!, skipped: true },
    ];
    expect(completionEntriesReady(GAPS, entries)).toBe(true);
    expect(buildSiblingCompletions(GAPS, entries)).toEqual([
      { definitionId: "def-a", phaseDurations: [{ phaseId: 3, durationSeconds: 5 }, { phaseId: 4, durationSeconds: 7 }] },
      { definitionId: "def-b", seriesDurationSeconds: null },
    ]);
  });

  it("une durée partielle ou nulle n'est jamais prête ; passer ignore les saisies du frère", () => {
    const [a, b] = initialCompletionEntries(GAPS);
    const partial = [{ ...a!, phaseDurations: [{ phaseId: 3, durationSeconds: 5 }, { phaseId: 4, durationSeconds: 0 }] }, { ...b!, seriesDurationSeconds: 30 }];
    expect(completionEntriesReady(GAPS, partial)).toBe(false);
    const skipped = [{ ...partial[0]!, skipped: true }, partial[1]!];
    expect(buildSiblingCompletions(GAPS, skipped)).toEqual([
      { definitionId: "def-a", phaseDurations: [{ phaseId: 3, durationSeconds: null }, { phaseId: 4, durationSeconds: null }] },
      { definitionId: "def-b", seriesDurationSeconds: 30 },
    ]);
  });
});

describe("repriseExecutionParameters — création sur un geste repris (MFN-06)", () => {
  const base = createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 });
  const movement = (phases: Movement["phases"]): Movement => ({
    id: "mov-1",
    name: "Squat",
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases,
    nextPhaseId: 6,
    aliases: [],
    levelGroup: null,
  });

  it("geste sans phase : brouillon vide inchangé (paramètres à saisir)", () => {
    expect(repriseExecutionParameters(movement([]), base)).toBe(base);
  });

  it("geste à phases : structure reprise (identités, libellés, ordre) en Durée, durées et Cible à renseigner", () => {
    const reprise = repriseExecutionParameters(
      movement([
        { id: 2, label: "Descente" },
        { id: 5, label: "Remontée" },
      ]),
      base,
    );
    expect(reprise.mode).toBe("DURATION");
    expect(reprise.series).toEqual({
      ...base.series,
      target: { kind: "UNSET" },
      workPhases: [
        { id: 2, label: "Descente", durationSeconds: 0 },
        { id: 5, label: "Remontée", durationSeconds: 0 },
      ],
    });
    expect(reprise.countdownSeconds).toBe(10);
    expect(reprise.sideMode).toBeNull();
  });
});
