import * as Crypto from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { validateForSave } from "@/domain/activities/ExecutionParameters";
import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
} from "@/domain/preferences/Profile";
import { DEFAULT_CIRCUIT_NATURE } from "@/domain/sessions/circuit";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { exerciseOfMovement, takeMovementsHandedToComposition, withMovementExercises } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";

type ProfileDefaults = {
  readonly countdownSeconds: number;
  readonly endSeconds: number;
  readonly sideRecoverySeconds: number;
};

const DOMAIN_DEFAULTS: ProfileDefaults = {
  countdownSeconds: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  endSeconds: DEFAULT_EXERCISE_END_SECONDS,
  sideRecoverySeconds: DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
};

/** Exercice créé depuis un Mouvement, dont les paramètres restent à régler. */
type PendingConfiguration = { readonly exerciseId: string; readonly nextPhaseId: number };

/**
 * PRE-9 A.2 (ARB-22a : « les Mouvements choisis deviennent des Exercices configurés dans la
 * Séance » ; ARB-07) — au retour au premier plan de la Composition, les Mouvements remis par la
 * création de Mouvement ou par la sélection du Catalogue deviennent des Exercices du brouillon,
 * insérés après le dernier Exercice entré, dans son conteneur ; puis la feuille de paramètres
 * existante (`ExecutionParametersSheet`, celle de l'éditeur d'Exercice en Séance) s'ouvre sur
 * chacun, dans l'ordre d'insertion, par-dessus la Composition.
 *
 * ✓ applique les paramètres à l'Exercice ; ✕ le laisse tel qu'inséré (paramètres à compléter,
 * signalés sur sa carte, `Continuer` indisponible — D-389) et passe au suivant. Réglages de la
 * feuille repris de l'éditeur en Séance : Compte à rebours et Fin absents (Séance), N hérité d'un
 * Circuit de Séries, structure des phases verrouillée (occurrence d'un Mouvement enregistré,
 * MFN-09), Pause entre les côtés du Profil.
 */
export function useMovementExerciseIntake(): ReactNode {
  const { draft, updateDraft } = useSessionDraft();
  const profileService = useContext(ProfileServiceContext);
  const [defaults, setDefaults] = useState<ProfileDefaults>(DOMAIN_DEFAULTS);
  const [pending, setPending] = useState<readonly PendingConfiguration[]>([]);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const movements = takeMovementsHandedToComposition();
      if (movements === null) return;
      const readProfile: Promise<ProfileDefaults> = profileService
        ? profileService.getProfile().then(
            (profile) => ({
              countdownSeconds: profile.exerciseCountdownSecondsDefault,
              endSeconds: profile.exerciseEndSecondsDefault,
              sideRecoverySeconds: profile.sideChangeRecoverySecondsDefault,
            }),
            (error: unknown) => {
              console.error("Impossible de charger le Profil.", error);
              return DOMAIN_DEFAULTS;
            },
          )
        : Promise.resolve(DOMAIN_DEFAULTS);
      void readProfile.then((profile) => {
        if (!mountedRef.current) return;
        const exercises = movements.map((movement) => exerciseOfMovement(movement, Crypto.randomUUID(), profile));
        setDefaults(profile);
        updateDraft((current) => withMovementExercises(current, exercises));
        setPending((current) => [
          ...current,
          ...exercises.map((exercise, index) => ({ exerciseId: exercise.id, nextPhaseId: movements[index]!.nextPhaseId })),
        ]);
      });
    }, [profileService, updateDraft]),
  );

  const head = pending[0] ?? null;
  const exercise = head === null ? null : (draft.exercises.find((candidate) => candidate.id === head.exerciseId) ?? null);
  // Exercice retiré entre-temps : rien à régler, au suivant.
  if (head !== null && exercise === null) {
    setPending((current) => current.slice(1));
  }
  if (head === null || exercise === null) {
    return null;
  }
  const advance = () => setPending((current) => current.slice(1));
  return (
    <ExecutionParametersSheet
      key={exercise.id}
      parent={exercise.executionParameters}
      baseline={null}
      profileSideRecoverySecondsDefault={defaults.sideRecoverySeconds}
      exerciseSignals="absent"
      inheritedSeriesCount={
        exercise.structuralPosition === "IN_TOUR" &&
        exercise.type === "EXERCISE" &&
        (draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE) === "SERIES"
      }
      phaseStructureLocked
      nextPhaseId={head.nextPhaseId}
      onApply={(parameters) => {
        const validated = validateForSave(parameters, null);
        const applied = validated.ok ? validated.value : parameters;
        updateDraft((current) => ({
          exercises: current.exercises.map((candidate) =>
            candidate.id === head.exerciseId ? { ...candidate, executionParameters: applied, sideMode: applied.sideMode } : candidate,
          ),
        }));
        advance();
      }}
      onCancel={advance}
    />
  );
}
