import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
} from "@/domain/activities";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { DEFAULT_SIDE_MODE, DEFAULT_TOUR_SIDE_MODE } from "@/domain/sessions/defaults";
import { createExerciseDraft, exerciseEquals, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  type ActivityEditorFormValue,
} from "@/features/activities/ActivityEditorForm";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";

/**
 * Route `Ajouter / Modifier une activité` (T02-S02 ; V2-CAT-01, revue
 * indépendante 5732014381, obligation 5 — formulaire commun) : point
 * d'entrée unique de `app/(creation)/exercise.tsx`. Un paramètre
 * `catalogueDefinitionId` bascule vers l'adaptateur Catalogue
 * (`CatalogueActivityEditorScreen`, persistance dans une
 * `ActivityDefinition`) ; son absence préserve le flux Composition
 * (`CompositionExerciseEditor`, écriture dans le brouillon `SessionActivity`
 * uniquement). `"new"` signifie une création ; toute autre valeur est
 * l'identifiant d'une `ActivityDefinition` à modifier.
 *
 * Les deux adaptateurs partagent désormais un SEUL formulaire
 * (`@/features/activities/ActivityEditorForm` — roulettes, sections
 * repliables, rangée de paramètres, contrôle `Côté`, pilotage `Séries ↔
 * Durée totale`, synthèse) : aucune règle de validation ou de présentation
 * n'est dupliquée entre les deux éditeurs.
 */
export function ExerciseScreen() {
  const params = useLocalSearchParams<{ exerciseId?: string; catalogueDefinitionId?: string }>();
  if (params.catalogueDefinitionId !== undefined) {
    return (
      <CatalogueActivityEditorScreen
        definitionId={params.catalogueDefinitionId === "new" ? null : params.catalogueDefinitionId}
      />
    );
  }
  return <CompositionExerciseEditor />;
}

/**
 * Adaptateur Catalogue (V2-CAT-01) : crée ou modifie une `ActivityDefinition`
 * persistante via `ActivityDefinitionService` — jamais le brouillon de
 * Séance. Préremplie exactement en modification (`activityDefinitionToInput`).
 *
 * Revue 5732014381, obligation 4 : toute exception LEVÉE par le service
 * (échec technique du Repository, ex. transaction annulée) est désormais
 * CAPTURÉE — jamais seulement les résultats structurés `{ok:false}`/
 * `{status:"INVALID"}` — le brouillon local reste intact, un message
 * d'erreur devient visible et le verrou de sauvegarde est RÉARMÉ, permettant
 * une nouvelle tentative immédiate.
 */
function CatalogueActivityEditorScreen({ definitionId }: { definitionId: string | null }) {
  const router = useRouter();
  const activityDefinitionService = useActivityDefinitionService();
  const isEditingExisting = definitionId !== null;
  const [value, setValue] = useState<ActivityEditorFormValue>(() => {
    const draft = createEmptyActivityDefinitionDraft();
    return {
      name: draft.name,
      instruction: draft.description,
      executionMode: draft.executionMode,
      durationSeconds: draft.durationSeconds,
      repetitionCount: draft.repetitionCount,
      seriesCount: draft.seriesCount,
      pauseSeconds: draft.pauseSeconds,
      recoverySeconds: draft.recoverySeconds,
      bodyZoneIds: draft.bodyZoneIds,
      sideMode: draft.sideMode ?? DEFAULT_SIDE_MODE,
    };
  });
  const [loadState, setLoadState] = useState<"loading" | "ready">(
    isEditingExisting ? "loading" : "ready",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isSavingRef = useRef(false);
  const t = strings.screens.activities.editor;

  useEffect(() => {
    if (definitionId === null) {
      return;
    }
    let cancelled = false;
    activityDefinitionService.getActivityDefinition(definitionId).then((definition) => {
      if (cancelled || !definition) {
        return;
      }
      const input = activityDefinitionToInput(definition);
      setValue({
        name: input.name,
        instruction: input.description,
        executionMode: input.executionMode,
        durationSeconds: input.durationSeconds,
        repetitionCount: input.repetitionCount,
        seriesCount: input.seriesCount,
        pauseSeconds: input.pauseSeconds,
        recoverySeconds: input.recoverySeconds,
        bodyZoneIds: input.bodyZoneIds,
        sideMode: input.sideMode ?? DEFAULT_SIDE_MODE,
      });
      setLoadState("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, definitionId]);

  function patch(next: Partial<ActivityEditorFormValue>) {
    setSaveError(false);
    setValue((current) => ({ ...current, ...next }));
  }

  async function handleFinish() {
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(false);

    const definitionInput = {
      name: value.name,
      description: value.instruction,
      executionMode: value.executionMode,
      durationSeconds: value.durationSeconds,
      repetitionCount: value.repetitionCount,
      seriesCount: value.seriesCount,
      pauseSeconds: value.pauseSeconds,
      recoverySeconds: value.recoverySeconds,
      bodyZoneIds: value.bodyZoneIds,
      sideMode: value.sideMode,
    };

    try {
      const succeeded =
        definitionId !== null
          ? (await activityDefinitionService.updateActivityDefinition(definitionId, definitionInput))
              .status === "UPDATED"
          : (await activityDefinitionService.createActivityDefinition(definitionInput)).ok;

      if (!succeeded) {
        isSavingRef.current = false;
        setIsSaving(false);
        setSaveError(true);
        return;
      }
      router.back();
    } catch (error) {
      // Défense de dernier recours (même patron que `CategoriesScreen.handleSave`) :
      // une erreur TECHNIQUE du service (ex. transaction annulée) ne doit
      // jamais laisser l'écran bloqué ni perdre le brouillon local — le
      // verrou de sauvegarde est réarmé, une nouvelle tentative reste
      // possible.
      console.error("L'activité n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setIsSaving(false);
      setSaveError(true);
    }
  }

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />
      {loadState === "loading" ? null : (
        <ActivityEditorForm
          value={value}
          onChange={patch}
          showMediaSection
          finishLabel={t.finishAction}
          onFinish={handleFinish}
          isFinishDisabled={isSaving}
          errorMessage={saveError ? t.saveError : null}
          finishSlotTestID="activity-editor-finish-slot"
          finishActionTestID="activity-editor-finish-action"
          errorTestID="activity-editor-save-error"
        />
      )}
    </ScreenShell>
  );
}

/**
 * Flux Composition (T02-S02, D-137) — écrit exclusivement dans le brouillon
 * `SessionActivity` (`SessionDraftContext`), jamais dans une
 * `ActivityDefinition` persistante : aucune Activité créée directement
 * depuis la Composition ne crée jamais de définition Catalogue (plan §4.4).
 */
function CompositionExerciseEditor() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  const requestedExerciseId = params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null;

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => existingExercise ?? createExerciseDraft(Crypto.randomUUID()),
  );
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);

  const shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    () => {},
  );

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function patchLocal(patch: Partial<SessionDraftExercise>) {
    setLocal((current) => ({ ...current, ...patch }));
  }

  function handleTerminer() {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : appendActivityAfterLastDisplayed(draft.exercises, local);
    updateDraft({ exercises: nextExercises });
    setIsFinishing(true);
  }

  const t = strings.screens.exercise;

  /**
   * V2-BILAT-01 (plan `## UI`) : le contrôle `Côté` est désactivé — la
   * direction propre de l'Activité devient sans effet — pour une Activité
   * `IN_TOUR` gouvernée par un Tour déjà bilatéral.
   */
  const isSideModeInherited =
    local.structuralPosition === "IN_TOUR" &&
    (draft.tourSideMode ?? DEFAULT_TOUR_SIDE_MODE) !== "UNILATERAL";

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <ActivityEditorForm
        value={local}
        onChange={patchLocal}
        isSideModeInherited={isSideModeInherited}
        finishLabel={t.finishAction}
        onFinish={handleTerminer}
        finishSlotTestID="exercise-finish-action-slot"
        finishActionTestID="exercise-finish-action"
      />

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}
