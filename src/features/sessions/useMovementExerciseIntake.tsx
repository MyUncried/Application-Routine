import * as Crypto from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { validateForSave } from "@/domain/activities/ExecutionParameters";
import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
} from "@/domain/preferences/Profile";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import {
  exerciseOfMovement,
  inheritsCircuitSeriesCount,
  isPersistedMovementOccurrence,
  takeMovementsHandedToComposition,
  withMovementExercises,
} from "@/features/sessions/movementExercises";
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

function profileDefaultsOf(profile: {
  readonly exerciseCountdownSecondsDefault: number;
  readonly exerciseEndSecondsDefault: number;
  readonly sideChangeRecoverySecondsDefault: number;
}): ProfileDefaults {
  return {
    countdownSeconds: profile.exerciseCountdownSecondsDefault,
    endSeconds: profile.exerciseEndSecondsDefault,
    sideRecoverySeconds: profile.sideChangeRecoverySecondsDefault,
  };
}

export type MovementExerciseIntake = {
  /** Feuille de paramètres ouverte (`null` : aucune), à rendre par-dessus la Composition. */
  readonly sheet: ReactNode;
  /** Ouvre directement la feuille de paramètres de l'Exercice (carte « Paramètres à compléter »). */
  readonly openParameters: (exerciseId: string) => void;
};

/**
 * PRE-9 A.2 (ARB-22a, ARB-07) — au retour au premier plan de la Composition, les Mouvements remis
 * par la création de Mouvement ou par la sélection du Catalogue deviennent des Exercices du
 * brouillon, insérés après le dernier Exercice entré, dans son conteneur.
 *
 * Demande de Hermann du 29/10/2026 (recette iPhone n° 1, remplace l'ouverture automatique des
 * feuilles l'une après l'autre) : « Les cartes se posent dans la composition de séance, elles sont
 * rouges avec écrit Paramètres à compléter, aucune modale ne s'ouvre - Appuyer sur chaque carte
 * ouvre directement la modale du paramètre sans ouvrir la carte. » Aucune feuille ne s'ouvre donc à
 * l'insertion ; `openParameters` ouvre la feuille existante (`ExecutionParametersSheet`, celle de
 * l'éditeur d'Exercice en Séance) sur l'Exercice touché, par-dessus la Composition.
 *
 * ✓ applique les paramètres à l'Exercice ; ✕ le laisse tel quel (paramètres à compléter, signalés
 * sur sa carte, `Continuer` indisponible — D-389). Réglages de la feuille repris de l'éditeur en
 * Séance : Compte à rebours et Fin absents (Séance), N hérité d'un Circuit de Séries, structure des
 * phases verrouillée pour l'occurrence d'un Mouvement enregistré (MFN-09), Pause entre les côtés du
 * Profil.
 */
export function useMovementExerciseIntake(): MovementExerciseIntake {
  const { draft, updateDraft } = useSessionDraft();
  const profileService = useContext(ProfileServiceContext);
  const [defaults, setDefaults] = useState<ProfileDefaults>(DOMAIN_DEFAULTS);
  const [opened, setOpened] = useState<{ readonly exerciseId: string; readonly nextPhaseId: number | undefined } | null>(null);
  /** Prochain identifiant de phase des Mouvements remis, par Exercice inséré (MFN-09). */
  const nextPhaseIdsRef = useRef(new Map<string, number>());
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const readProfile = useCallback(
    (): Promise<ProfileDefaults> =>
      profileService
        ? profileService.getProfile().then(profileDefaultsOf, (error: unknown) => {
            console.error("Impossible de charger le Profil.", error);
            return DOMAIN_DEFAULTS;
          })
        : Promise.resolve(DOMAIN_DEFAULTS),
    [profileService],
  );

  useFocusEffect(
    useCallback(() => {
      const movements = takeMovementsHandedToComposition();
      if (movements === null) return;
      void readProfile().then((profile) => {
        if (!mountedRef.current) return;
        const exercises = movements.map((movement) => exerciseOfMovement(movement, Crypto.randomUUID(), profile));
        exercises.forEach((exercise, index) => nextPhaseIdsRef.current.set(exercise.id, movements[index]!.nextPhaseId));
        setDefaults(profile);
        updateDraft((current) => withMovementExercises(current, exercises));
      });
    }, [readProfile, updateDraft]),
  );

  const openParameters = useCallback(
    (exerciseId: string) => {
      const nextPhaseId = nextPhaseIdsRef.current.get(exerciseId);
      // Pause entre les côtés : valeur courante du Profil, lue avant l'ouverture de la feuille.
      void readProfile().then((profile) => {
        if (!mountedRef.current) return;
        setDefaults(profile);
        setOpened({ exerciseId, nextPhaseId });
      });
    },
    [readProfile],
  );

  const exercise = opened === null ? null : (draft.exercises.find((candidate) => candidate.id === opened.exerciseId) ?? null);
  // Exercice retiré entre-temps : rien à régler.
  if (opened !== null && exercise === null) {
    setOpened(null);
  }
  if (opened === null || exercise === null) {
    return { sheet: null, openParameters };
  }
  const close = () => setOpened(null);
  const movementId = (exercise.sourceMovementId ?? "").trim();
  const nextPhaseId = opened.nextPhaseId ?? draft.movements?.[movementId]?.nextPhaseId;
  return {
    openParameters,
    sheet: (
      <ExecutionParametersSheet
        key={exercise.id}
        parent={exercise.executionParameters}
        baseline={null}
        profileSideRecoverySecondsDefault={defaults.sideRecoverySeconds}
        exerciseSignals="absent"
        inheritedSeriesCount={inheritsCircuitSeriesCount(draft, exercise)}
        phaseStructureLocked={isPersistedMovementOccurrence(exercise, draft.movements)}
        {...(nextPhaseId !== undefined ? { nextPhaseId } : {})}
        onApply={(parameters) => {
          const validated = validateForSave(parameters, null);
          const applied = validated.ok ? validated.value : parameters;
          updateDraft((current) => ({
            exercises: current.exercises.map((candidate) =>
              candidate.id === exercise.id ? { ...candidate, executionParameters: applied, sideMode: applied.sideMode } : candidate,
            ),
          }));
          close();
        }}
        onCancel={close}
      />
    ),
  };
}
