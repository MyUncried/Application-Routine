import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { duplicateActivity, moveActivity } from "@/domain/sessions/composition";
import {
  createExerciseDraft,
  exerciseEquals,
  toCreateSessionInput,
  withExerciseRecovery,
  withProfileDefaultsValidated,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 — ordre de Hermann du 01/11/2026, point 2 (ch07 « Récupération de l'Exercice et défauts du
 * Profil ») : la Récupération est une valeur propre à l'Exercice (`postActivityRecoverySeconds`, une
 * seule source), conservée au déplacement et à la duplication ; l'état « défauts du Profil en
 * attente du premier ✓ » n'appartient qu'au brouillon.
 */

const exercise = (id: string, recovery: number | null, pending = false): SessionDraftExercise => ({
  ...createExerciseDraft(id, recovery),
  name: id,
  structuralPosition: "BEFORE_TOUR",
  executionParameters: durationParameters(30),
  ...(pending ? { profileDefaultsPending: true as const } : {}),
});

describe("PRE-9 (01/11/2026) — Récupération de l'Exercice", () => {
  it("withExerciseRecovery : nouvelle valeur appliquée ; ancienne absence gardée si 0 validé (✓ sans réglage) ; valeur invalide ignorée", () => {
    const legacy = exercise("A", null);
    expect(withExerciseRecovery(legacy, 0)).toBe(legacy);
    expect(withExerciseRecovery(legacy, 45).postActivityRecoverySeconds).toBe(45);
    const present = exercise("B", 30);
    expect(withExerciseRecovery(present, 30)).toBe(present);
    expect(withExerciseRecovery(present, 0).postActivityRecoverySeconds).toBe(0);
    for (const seconds of [-1, 2.5, Number.NaN]) {
      expect(withExerciseRecovery(present, seconds)).toBe(present);
    }
  });

  it("déplacement et duplication conservent la Récupération de l'Exercice (et l'attente des défauts du Profil)", () => {
    const list = [exercise("A", 45, true), exercise("B", 0), exercise("C", null)];
    const duplicated = duplicateActivity(list, "A", "A2");
    const copy = duplicated.find((item) => item.id === "A2")!;
    expect(copy.postActivityRecoverySeconds).toBe(45);
    expect(copy.profileDefaultsPending).toBe(true);
    expect(duplicateActivity(list, "B", "B2").find((item) => item.id === "B2")!.postActivityRecoverySeconds).toBe(0);
    const moved = moveActivity(list, "A", "AFTER_TOUR", 0);
    expect(moved.find((item) => item.id === "A")!.postActivityRecoverySeconds).toBe(45);
  });

  it("premier ✓ : l'attente est retirée sans rendre le brouillon modifié ; jamais transmise à l'enregistrement de la Séance", () => {
    const pending = exercise("A", 30, true);
    const validated = withProfileDefaultsValidated(pending);
    expect(validated.profileDefaultsPending).toBeUndefined();
    expect(withProfileDefaultsValidated(validated)).toBe(validated);
    expect(exerciseEquals(pending, validated)).toBe(true);

    const result = toCreateSessionInput(
      withLocalMovements({ name: "Séance", labelId: null, initialCountdownSeconds: 10, finalPhaseSeconds: 5, exercises: [pending] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [saved] = result.value.exercises;
    expect(saved).toMatchObject({ postActivityRecoverySeconds: 30 });
    expect(Object.keys(saved!)).not.toContain("profileDefaultsPending");
  });
});
