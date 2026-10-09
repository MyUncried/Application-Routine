import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { resolveDefinitionExecutionParameters } from "@/domain/activities";
import {
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  executionParametersEqual,
  projectLegacyScalars,
  resolveExecutionParameters,
  validateExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { draftMediaEqual, toDraftMediaItems } from "@/domain/media/ActivityMedia";
import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
  type Silhouette,
} from "@/domain/preferences/Profile";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { createExerciseDraft, exerciseEquals, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles, chargé via
 * `ActivityDefinitionService` (même connexion SQLite que `SessionService`) —
 * jamais `BODY_ZONES`. `refreshToken` relit le référentiel à la fermeture du
 * sélecteur de Zones (R6).
 */
function useBodyZonesReferential(
  activityDefinitionService: ActivityDefinitionService,
  refreshToken: number = 0,
): readonly BodyZone[] {
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    let cancelled = false;
    activityDefinitionService.listBodyZones().then(
      (result) => {
        if (!cancelled) {
          setZones(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Zones corporelles.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, refreshToken]);
  return zones;
}

/**
 * Catégories (affichage de la pilule) — rechargées à la fermeture du
 * sélecteur, pour refléter une création / un renommage / un retrait.
 */
function useCategories() {
  const referentialService = useReferentialService();
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const reload = useCallback(() => {
    referentialService.listCategories().then(setCategories, (error: unknown) => {
      console.error("Impossible de charger les catégories.", error);
    });
  }, [referentialService]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { categories, reload };
}

/**
 * Défauts du Profil lus une seule fois : Pause entre les côtés (copiée à
 * l'ACTIVATION du changement de côté), Compte à rebours et Fin (copiés à la
 * création d'un nouvel Exercice uniquement — jamais relus pour un objet
 * existant, P3-10), silhouette du sélecteur de Zones.
 */
function useProfileDefaults() {
  const profileService = useProfileService();
  const [defaults, setDefaults] = useState<{
    readonly loaded: boolean;
    readonly sideRecovery: number;
    readonly countdown: number;
    readonly end: number;
    readonly silhouette: Silhouette | null;
  }>({
    loaded: false,
    sideRecovery: DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
    countdown: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
    end: DEFAULT_EXERCISE_END_SECONDS,
    silhouette: null,
  });
  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (!cancelled) {
          setDefaults({
            loaded: true,
            sideRecovery: profile.sideChangeRecoverySecondsDefault,
            countdown: profile.exerciseCountdownSecondsDefault,
            end: profile.exerciseEndSecondsDefault,
            silhouette: profile.silhouette,
          });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger le Profil.", error);
          setDefaults((current) => ({ ...current, loaded: true }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);
  return defaults;
}

function toEditorCategory(categoryId: string | null, categories: readonly Category[]): EditorCategory {
  if (!categoryId) return null;
  const found = categories.find((candidate) => candidate.id === categoryId);
  return found ? { name: found.name, color: found.color } : null;
}

function createEmptyFormValue(): ActivityEditorFormValue {
  return {
    name: "",
    instruction: null,
    executionParameters: createEmptyExecutionParameters({
      countdownSeconds: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
      endSeconds: DEFAULT_EXERCISE_END_SECONDS,
    }),
    bodyZoneIds: [],
    media: [],
  };
}

/**
 * Nouveau brouillon : Compte à rebours et Fin reçoivent les défauts du
 * Profil dès leur lecture — uniquement si le brouillon est encore intact
 * (aucune rétroactivité sur une saisie déjà commencée, P3-10).
 */
function withProfilePhases(parameters: ExecutionParametersInput, countdown: number, end: number): ExecutionParametersInput {
  return { ...parameters, countdownSeconds: countdown, endSeconds: end };
}

function formValueEquals(left: ActivityEditorFormValue, right: ActivityEditorFormValue): boolean {
  return (
    left.name === right.name &&
    left.instruction === right.instruction &&
    executionParametersEqual(left.executionParameters, right.executionParameters) &&
    left.bodyZoneIds.length === right.bodyZoneIds.length &&
    left.bodyZoneIds.every((id, index) => right.bodyZoneIds[index] === id) &&
    draftMediaEqual(left.media, right.media)
  );
}

/**
 * Route « Créer / Modifier un exercice » — point d'entrée unique de
 * `app/(creation)/exercise.tsx`, quatre parcours :
 *
 * - `catalogueDefinitionId=new` / `<id>` : définition Catalogue, écrite par
 *   `ActivityDefinitionService` à « Terminer » (et seulement là) ;
 * - sans paramètre / `exerciseId` : copie de Séance, appliquée au brouillon
 *   de Composition à « Terminer » ; « Continuer » (Composition) reste seul à
 *   persister la Séance.
 *
 * Commun : ✓ de la feuille Paramètres n'applique qu'au brouillon parent
 * (aucune écriture) ; garde d'abandon (Annuler conserve tout, Confirmer
 * abandonne et nettoie uniquement les copies préparées non référencées) ;
 * une seule opération en vol ; aucune Récupération automatique.
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

function CatalogueActivityEditorScreen({ definitionId }: { definitionId: string | null }) {
  const router = useRouter();
  const activityDefinitionService = useActivityDefinitionService();
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
  const { categories, reload: reloadCategories } = useCategories();
  const profile = useProfileDefaults();
  const isEditingExisting = definitionId !== null;
  const [mediaDraftId] = useState(() => `definition:${definitionId ?? Crypto.randomUUID()}`);

  const [initial, setInitial] = useState<ActivityEditorFormValue | null>(() =>
    definitionId === null ? createEmptyFormValue() : null,
  );
  const [value, setValue] = useState<ActivityEditorFormValue | null>(initial);
  const [profileApplied, setProfileApplied] = useState(definitionId !== null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    definitionId === null ? "ready" : "loading",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isSavingRef = useRef(false);
  const t = strings.screens.activities.editor;
  const loadErrorStrings = strings.screens.activities.error;

  const fetchDefinition = useCallback(
    (isCancelled: () => boolean) => {
      if (definitionId === null) {
        return;
      }
      activityDefinitionService
        .getActivityDefinition(definitionId)
        .then((definition) => {
          if (isCancelled()) return;
          if (!definition) {
            setLoadState("error");
            return;
          }
          const loaded: ActivityEditorFormValue = {
            name: definition.name,
            instruction: definition.description,
            executionParameters: cloneExecutionParameters(resolveDefinitionExecutionParameters(definition)),
            bodyZoneIds: [...definition.bodyZoneIds],
            media: toDraftMediaItems(definition.media ?? []),
          };
          setInitial(loaded);
          setValue(loaded);
          setCategoryId(definition.categoryId ?? null);
          setInitialCategoryId(definition.categoryId ?? null);
          setLoadState("ready");
        })
        .catch((error: unknown) => {
          if (isCancelled()) return;
          console.error("L'activité n'a pas pu être chargée.", error);
          setLoadState("error");
        });
    },
    [activityDefinitionService, definitionId],
  );

  useEffect(() => {
    let cancelled = false;
    fetchDefinition(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchDefinition]);

  // Nouveau : Compte à rebours et Fin copiés du Profil au moment réel de la
  // création (P3-10) — ajustement d'état pendant le rendu, une seule fois.
  if (!profileApplied && profile.loaded && initial !== null && value !== null) {
    setProfileApplied(true);
    if (formValueEquals(value, initial)) {
      const created = {
        ...initial,
        executionParameters: withProfilePhases(initial.executionParameters, profile.countdown, profile.end),
      };
      setInitial(created);
      setValue(created);
    }
  }

  const isDirty =
    value !== null && initial !== null && (!formValueEquals(value, initial) || categoryId !== initialCategoryId);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(isDirty && !isDone, () => {
    activityDefinitionService.abandonMediaDraft(mediaDraftId).catch(() => undefined);
  });

  useEffect(() => {
    if (isDone) {
      router.back();
    }
  }, [isDone, router]);

  function patch(next: Partial<ActivityEditorFormValue>) {
    setSaveError(false);
    setValue((current) => (current ? { ...current, ...next } : current));
  }

  async function handleFinish() {
    if (isSavingRef.current || value === null) {
      return;
    }
    const validated = validateExecutionParameters(value.executionParameters);
    if (!validated.ok) {
      setSaveError(true);
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(false);
    const scalars = projectLegacyScalars(validated.value);
    const definitionInput = {
      name: value.name,
      description: value.instruction,
      executionMode: scalars.executionMode,
      durationSeconds: scalars.durationSeconds,
      repetitionCount: scalars.repetitionCount,
      seriesCount: scalars.seriesCount,
      pauseSeconds: scalars.pauseSeconds,
      category: { kind: "EXISTING" as const, categoryId: categoryId ?? "" },
      bodyZoneIds: value.bodyZoneIds,
      sideMode: scalars.sideMode,
      sideRecoverySeconds: scalars.sideRecoverySeconds,
      executionParameters: validated.value,
      media: value.media.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    };
    try {
      const succeeded =
        definitionId !== null
          ? (await activityDefinitionService.updateActivityDefinition(definitionId, definitionInput)).status === "UPDATED"
          : (await activityDefinitionService.createActivityDefinition(definitionInput)).ok;
      if (!succeeded) {
        isSavingRef.current = false;
        setIsSaving(false);
        setSaveError(true);
        return;
      }
      activityDefinitionService.commitMediaDraft(mediaDraftId);
      setIsDone(true);
    } catch (error) {
      // Rollback complet côté Repository : brouillon et médias conservés,
      // verrou réarmé pour une nouvelle tentative (aucun doublon partiel).
      console.error("L'activité n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setIsSaving(false);
      setSaveError(true);
    }
  }

  const isValid =
    value !== null &&
    isActivityEditorFormValid(value, { requireReferences: true, hasCategory: categoryId !== null && categoryId !== "" });

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />
      {loadState === "error" ? (
        <View style={styles.loadErrorBody} testID="activity-editor-load-error">
          <Text style={styles.loadErrorMessage}>{loadErrorStrings.message}</Text>
          <Pressable
            onPress={() => {
              setLoadState("loading");
              fetchDefinition(() => false);
            }}
            accessibilityRole="button"
            accessibilityLabel={loadErrorStrings.retry}
            style={styles.loadErrorRetry}
            testID="activity-editor-load-retry"
          >
            <Text style={styles.loadErrorRetryLabel}>{loadErrorStrings.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {loadState === "ready" && value !== null ? (
        <ActivityEditorForm
          value={value}
          onChange={patch}
          bodyZones={bodyZonesReferential}
          onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
          silhouette={profile.silhouette}
          category={toEditorCategory(categoryId, categories)}
          onOpenCategory={() => {
            setSaveError(false);
            setIsCategoryPickerOpen(true);
          }}
          profileSideRecoverySecondsDefault={profile.sideRecovery}
          mediaService={activityDefinitionService}
          mediaDraftId={mediaDraftId}
          finishLabel={t.finishAction}
          onFinish={handleFinish}
          isFinishDisabled={isSaving || !isValid}
          errorMessage={saveError ? t.saveError : null}
          finishSlotTestID="activity-editor-finish-slot"
          finishActionTestID="activity-editor-finish-action"
          errorTestID="activity-editor-save-error"
        />
      ) : null}

      {isCategoryPickerOpen ? (
        <CategoryPickerModal
          selectedId={categoryId}
          onSelect={(id) => setCategoryId(id)}
          onClose={() => {
            setIsCategoryPickerOpen(false);
            reloadCategories();
          }}
        />
      ) : null}

      {isPendingExit ? <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </ScreenShell>
  );
}

/** Paramètres canoniques d'une occurrence (adaptateur conservateur pour une ancienne occurrence). */
function occurrenceParameters(exercise: SessionDraftExercise): ExecutionParametersInput {
  return resolveExecutionParameters({
    executionMode: exercise.executionMode,
    durationSeconds: exercise.durationSeconds,
    repetitionCount: exercise.repetitionCount,
    seriesCount: exercise.seriesCount,
    pauseSeconds: exercise.pauseSeconds,
    sideMode: exercise.sideMode,
    executionParameters: exercise.executionParameters,
  });
}

/**
 * Copie de Séance (D-137) — écrit exclusivement dans le brouillon de
 * Composition (`SessionDraftContext`), jamais dans une définition Catalogue.
 * Une nouvelle occurrence ne reçoit AUCUNE Récupération automatique
 * (spécification du 07/10) ; une occurrence existante conserve la sienne.
 */
function CompositionExerciseEditor() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const activityDefinitionService = useActivityDefinitionService();
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
  const { categories, reload: reloadCategories } = useCategories();
  const profile = useProfileDefaults();
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  const requestedExerciseId = params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null;

  const [initialSnapshot, setInitialSnapshot] = useState<SessionDraftExercise>(() =>
    existingExercise
      ? { ...existingExercise, executionParameters: occurrenceParameters(existingExercise) }
      : {
          // Nouvelle occurrence : AUCUNE Récupération automatique (R = 0).
          ...createExerciseDraft(Crypto.randomUUID(), 0),
          executionParameters: createEmptyFormValue().executionParameters,
          categoryId: null,
          media: [],
        },
  );
  const [local, setLocal] = useState<SessionDraftExercise | null>(initialSnapshot);
  const [profileApplied, setProfileApplied] = useState(isEditingExisting);
  const [mediaDraftId] = useState(() => `occurrence:${existingExercise?.id ?? Crypto.randomUUID()}`);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);

  // Nouvelle occurrence : défauts CR/Fin du Profil appliqués à leur lecture
  // si le brouillon est intact — ajustement d'état pendant le rendu, une fois.
  if (!profileApplied && profile.loaded && local !== null) {
    setProfileApplied(true);
    if (exerciseEquals(local, initialSnapshot)) {
      const created = {
        ...initialSnapshot,
        executionParameters: withProfilePhases(
          initialSnapshot.executionParameters ?? occurrenceParameters(initialSnapshot),
          profile.countdown,
          profile.end,
        ),
      };
      setInitialSnapshot(created);
      setLocal(created);
    }
  }

  const shouldBlockExit = !isFinishing && local !== null && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlockExit, () => {
    activityDefinitionService.abandonMediaDraft(mediaDraftId).catch(() => undefined);
  });

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function patchLocal(next: Partial<ActivityEditorFormValue>) {
    setLocal((current) => {
      if (!current) return current;
      const merged: SessionDraftExercise = {
        ...current,
        ...(next.name !== undefined ? { name: next.name } : {}),
        ...(next.instruction !== undefined ? { instruction: next.instruction } : {}),
        ...(next.bodyZoneIds !== undefined ? { bodyZoneIds: next.bodyZoneIds } : {}),
        ...(next.media !== undefined ? { media: next.media } : {}),
      };
      if (next.executionParameters === undefined) {
        return merged;
      }
      // ✓ de la feuille : paramètres valides ; projections scalaires DÉRIVÉES.
      const validated = validateExecutionParameters(next.executionParameters);
      if (!validated.ok) {
        return { ...merged, executionParameters: next.executionParameters };
      }
      const scalars = projectLegacyScalars(validated.value);
      return {
        ...merged,
        executionParameters: validated.value,
        executionMode: scalars.executionMode,
        durationSeconds: scalars.durationSeconds,
        repetitionCount: scalars.repetitionCount,
        seriesCount: scalars.seriesCount,
        pauseSeconds: scalars.pauseSeconds,
        sideMode: scalars.sideMode,
      };
    });
  }

  function handleTerminer() {
    if (finishingRef.current || local === null) {
      return;
    }
    finishingRef.current = true;
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : appendActivityAfterLastDisplayed(draft.exercises, local);
    updateDraft({ exercises: nextExercises });
    // Les copies préparées deviennent des références du brouillon de Séance ;
    // « Continuer » (Composition) les persiste dans sa transaction.
    activityDefinitionService.commitMediaDraft(mediaDraftId);
    setIsFinishing(true);
  }

  const t = strings.screens.exercise;
  const value: ActivityEditorFormValue | null = local
    ? {
        name: local.name,
        instruction: local.instruction,
        executionParameters: local.executionParameters ?? occurrenceParameters(local),
        bodyZoneIds: local.bodyZoneIds,
        media: local.media ?? [],
      }
    : null;
  const isValid =
    value !== null &&
    isActivityEditorFormValid(value, {
      requireReferences: !isEditingExisting,
      hasCategory: Boolean(local?.categoryId),
    });

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      {value !== null ? (
        <ActivityEditorForm
          value={value}
          onChange={patchLocal}
          bodyZones={bodyZonesReferential}
          onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
          silhouette={profile.silhouette}
          category={toEditorCategory(local?.categoryId ?? null, categories)}
          onOpenCategory={() => setIsCategoryPickerOpen(true)}
          profileSideRecoverySecondsDefault={profile.sideRecovery}
          mediaService={activityDefinitionService}
          mediaDraftId={mediaDraftId}
          finishLabel={t.finishAction}
          onFinish={handleTerminer}
          isFinishDisabled={!isValid}
          finishSlotTestID="exercise-finish-action-slot"
          finishActionTestID="exercise-finish-action"
        />
      ) : null}

      {isCategoryPickerOpen ? (
        <CategoryPickerModal
          selectedId={local?.categoryId ?? null}
          onSelect={(id) => setLocal((current) => (current ? { ...current, categoryId: id } : current))}
          onClose={() => {
            setIsCategoryPickerOpen(false);
            reloadCategories();
          }}
        />
      ) : null}

      {isPendingExit ? <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadErrorBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  loadErrorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadErrorRetry: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  loadErrorRetryLabel: {
    ...type.button,
    color: colors.background,
  },
});
