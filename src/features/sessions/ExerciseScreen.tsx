import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  executionParametersEqual,
  validateForSave,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
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
  EDITOR_HEADER,
  editorSideMargin,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
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
  // Q53 (8) : une Catégorie retirée encore affectée reste affichée (nom et pastille) ; Q53 (9) :
  // sans avis textuel dans l'Éditeur.
  return found ? { name: found.name, color: found.color } : null;
}

function createEmptyFormValue(): ActivityEditorFormValue {
  return {
    name: "",
    instructionSteps: [],
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

/**
 * PRE-4 story 4.2 (FR-02-03, FR-02-04 ; AC4, AC5) : en-tête fixe de l'Éditeur —
 * ✕ circulaire par la prop locale `closeIcon` de `FixedHeader` (composant partagé,
 * autres écrans inchangés) et marge latérale de l'Éditeur (24, ou 16 sous 390).
 * Libellé accessible : celui du code de départ (`Retour`), inchangé.
 */
function EditorHeader({ title, onClose, accessibilityLabel }: { title: string; onClose: () => void; accessibilityLabel: string }) {
  const { width } = useWindowDimensions();
  return (
    <FixedHeader
      title={title}
      onBack={onClose}
      backAccessibilityLabel={accessibilityLabel}
      closeIcon
      horizontalPadding={editorSideMargin(width)}
      // PRE-5 story 3.2, arbitrage G-1 de Hermann du 19/10 : en-tête de l'Éditeur selon Figma
      // `5544:4503` (✕ à 12 du bord, titre Inter Medium 17), sans changer les autres écrans.
      layoutStyle={{ paddingLeft: EDITOR_HEADER.paddingLeft, gap: EDITOR_HEADER.gap }}
      backCircleStyle={EDITOR_HEADER.backCircle}
      titleStyle={EDITOR_HEADER.title}
      backIconTintColor={EDITOR_HEADER.closeIconTint}
    />
  );
}

/**
 * PRE-5 story 3.1 (AC4, AC5, AD-22) : la Description se compare par ses
 * encodages — une étape vide créée par Entrée n'est pas une modification, ni
 * une ancienne Description à lignes vides ou à fins de ligne CRLF non modifiée.
 */
function formValueEquals(left: ActivityEditorFormValue, right: ActivityEditorFormValue): boolean {
  return (
    left.name === right.name &&
    encodeInstructionSteps(left.instructionSteps) === encodeInstructionSteps(right.instructionSteps) &&
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
 *
 * PRE-4 (story 1.1, AD-13) : le ✓ de la Feuille et `Terminer` appellent la
 * validation unique `validateForSave` avec la ligne de base relue à
 * l'ouverture de l'Éditeur (aucune en création) : une valeur héritée hors
 * bornes non modifiée reste enregistrable (H25), une Cible `UNSET` bloque.
 * Les paramètres typés sont la seule donnée transmise (aucune projection
 * scalaire dans l'écran).
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
  // Story 4.2 (FR-02-04) : l'écran d'erreur de chargement suit la marge de l'Éditeur.
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const [mediaDraftId] = useState(() => `definition:${definitionId ?? Crypto.randomUUID()}`);

  const [initial, setInitial] = useState<ActivityEditorFormValue | null>(() =>
    definitionId === null ? createEmptyFormValue() : null,
  );
  // PRE-4 (AD-13) : ligne de base des paramètres relue à l'ouverture (aucune en création).
  const [baselineParameters, setBaselineParameters] = useState<ExecutionParametersInput | null>(null);
  const [value, setValue] = useState<ActivityEditorFormValue | null>(initial);
  const [profileApplied, setProfileApplied] = useState(definitionId !== null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  // Story 4.6 (FR-22-10, AC9) : feuille de Catégorie, focus rendu à l'accès après sa fermeture.
  const categoryAccessRef = useRef<View>(null);
  const categorySheet = useReferenceSheet(categoryAccessRef);
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
            // PRE-5 story 3.1 (FR-35) : relue par le même décodage, sans migration ni conversion.
            instructionSteps: decodeInstructionSteps(definition.description),
            executionParameters: cloneExecutionParameters(definition.executionParameters),
            bodyZoneIds: [...definition.bodyZoneIds],
            media: toDraftMediaItems(definition.media ?? []),
          };
          setBaselineParameters(cloneExecutionParameters(definition.executionParameters));
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
    const validated = validateForSave(value.executionParameters, baselineParameters);
    if (!validated.ok) {
      setSaveError(true);
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(false);
    const definitionInput = {
      name: value.name,
      // PRE-5 story 3.1 (AC4) : encodage à `Terminer` seulement (étapes vides retirées).
      description: encodeInstructionSteps(value.instructionSteps),
      category: { kind: "EXISTING" as const, categoryId: categoryId ?? "" },
      bodyZoneIds: value.bodyZoneIds,
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
    isActivityEditorFormValid(value, {
      requireReferences: true,
      hasCategory: categoryId !== null && categoryId !== "",
      baseline: baselineParameters,
    });

  return (
    <ScreenShell>
      <EditorHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onClose={() => router.back()}
        accessibilityLabel={t.backAccessibilityLabel}
      />
      {loadState === "error" ? (
        <View style={[styles.loadErrorBody, { paddingHorizontal: sideMargin }]} testID="activity-editor-load-error">
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
            categorySheet.open();
          }}
          isCategoryPickerOpen={categorySheet.isOpen}
          categoryAccessRef={categoryAccessRef}
          profileSideRecoverySecondsDefault={profile.sideRecovery}
          baselineParameters={baselineParameters}
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

      {categorySheet.isMounted ? (
        <CategoryPickerModal
          key={categorySheet.generation}
          visible={categorySheet.isOpen}
          onDismissed={categorySheet.dismissed}
          selectedId={categoryId}
          onSelect={(id) => setCategoryId(id)}
          // Q53 (8) : Catégorie supprimée depuis la feuille de cet Exercice : elle quitte le Brouillon.
          onCategoryRetired={(id) => setCategoryId((current) => (current === id ? null : current))}
          onClose={() => {
            categorySheet.close();
            reloadCategories();
          }}
        />
      ) : null}

      {/* Q18 (FR-02-12) : textes de création en CC, de modification en MC. */}
      {isPendingExit ? (
        <ExerciseExitConfirmModal isCreation={!isEditingExisting} onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}

/**
 * PRE-5 story 3.1 (AC4, AC5) : comparaison d'une occurrence en cours d'édition à son
 * état initial, la Description comparée par ses encodages (une étape vide n'est pas une
 * modification ; une ancienne Description non modifiée non plus).
 */
function occurrenceEquals(
  local: SessionDraftExercise,
  instructionSteps: readonly string[],
  initial: SessionDraftExercise,
): boolean {
  return exerciseEquals(
    { ...local, instruction: encodeInstructionSteps(instructionSteps) },
    { ...initial, instruction: encodeInstructionSteps(decodeInstructionSteps(initial.instruction)) },
  );
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
  // Story 4.2 (Q18, revue) : le texte du dialogue d'abandon suit l'INTENTION de la
  // route — création seulement sans `exerciseId` (ou `new`) ; un `exerciseId` absent
  // du Brouillon reste une modification et n'annonce jamais « ne sera pas créé ».
  const isCreationRoute = typeof requestedExerciseId !== "string" || requestedExerciseId === "new";

  // PRE-4 (AD-13) : ligne de base des paramètres d'une occurrence existante,
  // relue à l'ouverture ; aucune pour une nouvelle occurrence.
  const [baselineParameters] = useState<ExecutionParametersInput | null>(() =>
    existingExercise ? cloneExecutionParameters(existingExercise.executionParameters) : null,
  );
  const [initialSnapshot, setInitialSnapshot] = useState<SessionDraftExercise>(() =>
    existingExercise
      ? existingExercise
      : {
          // Nouvelle occurrence : AUCUNE Récupération automatique (R = 0).
          ...createExerciseDraft(Crypto.randomUUID(), 0),
          executionParameters: createEmptyFormValue().executionParameters,
          categoryId: null,
          media: [],
        },
  );
  const [local, setLocal] = useState<SessionDraftExercise | null>(initialSnapshot);
  // PRE-5 story 3.1 (AD-22, FR-35) : étapes décodées de l'occurrence à l'ouverture ;
  // l'occurrence ne reçoit leur encodage qu'à `Terminer`.
  const [instructionSteps, setInstructionSteps] = useState<readonly string[]>(() =>
    decodeInstructionSteps(initialSnapshot.instruction),
  );
  // Q53 (8) : la Catégorie de cette Copie a été supprimée depuis sa feuille.
  const [categoryClearedByDeletion, setCategoryClearedByDeletion] = useState(false);
  const [profileApplied, setProfileApplied] = useState(isEditingExisting);
  const [mediaDraftId] = useState(() => `occurrence:${existingExercise?.id ?? Crypto.randomUUID()}`);
  // Story 4.6 (FR-22-10, AC9) : feuille de Catégorie, focus rendu à l'accès après sa fermeture.
  const categoryAccessRef = useRef<View>(null);
  const categorySheet = useReferenceSheet(categoryAccessRef);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);

  // Nouvelle occurrence : défauts CR/Fin du Profil appliqués à leur lecture
  // si le brouillon est intact — ajustement d'état pendant le rendu, une fois.
  if (!profileApplied && profile.loaded && local !== null) {
    setProfileApplied(true);
    if (occurrenceEquals(local, instructionSteps, initialSnapshot)) {
      const created = {
        ...initialSnapshot,
        executionParameters: withProfilePhases(initialSnapshot.executionParameters, profile.countdown, profile.end),
      };
      setInitialSnapshot(created);
      setLocal(created);
    }
  }

  const shouldBlockExit = !isFinishing && local !== null && !occurrenceEquals(local, instructionSteps, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlockExit, () => {
    activityDefinitionService.abandonMediaDraft(mediaDraftId).catch(() => undefined);
  });

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function patchLocal(next: Partial<ActivityEditorFormValue>) {
    if (next.instructionSteps !== undefined) {
      setInstructionSteps(next.instructionSteps);
    }
    setLocal((current) => {
      if (!current) return current;
      const merged: SessionDraftExercise = {
        ...current,
        ...(next.name !== undefined ? { name: next.name } : {}),
        ...(next.bodyZoneIds !== undefined ? { bodyZoneIds: next.bodyZoneIds } : {}),
        ...(next.media !== undefined ? { media: next.media } : {}),
      };
      if (next.executionParameters === undefined) {
        return merged;
      }
      // ✓ de la feuille : paramètres validés avec la ligne de base (AD-13) ;
      // la direction de l'occurrence suit celle des paramètres.
      const validated = validateForSave(next.executionParameters, baselineParameters);
      if (!validated.ok) {
        return { ...merged, executionParameters: next.executionParameters };
      }
      return {
        ...merged,
        executionParameters: validated.value,
        sideMode: validated.value.sideMode,
      };
    });
  }

  function handleTerminer() {
    if (finishingRef.current || local === null) {
      return;
    }
    finishingRef.current = true;
    // PRE-5 story 3.1 (AC4) : l'occurrence reçoit l'encodage des étapes à `Terminer` seulement.
    const finished: SessionDraftExercise = { ...local, instruction: encodeInstructionSteps(instructionSteps) };
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === finished.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === finished.id ? finished : exercise))
      : appendActivityAfterLastDisplayed(draft.exercises, finished);
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
        instructionSteps,
        executionParameters: local.executionParameters,
        bodyZoneIds: local.bodyZoneIds,
        media: local.media ?? [],
      }
    : null;
  // Q53 (8) : une Copie existante n'exige pas de Catégorie (données antérieures), sauf si la
  // sienne vient d'être supprimée depuis sa feuille : il faut alors en choisir une autre.
  const isValid =
    value !== null &&
    isActivityEditorFormValid(value, {
      requireReferences: !isEditingExisting,
      hasCategory: Boolean(local?.categoryId),
      baseline: baselineParameters,
    }) &&
    !(categoryClearedByDeletion && !local?.categoryId);

  return (
    <ScreenShell>
      <EditorHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onClose={() => router.back()}
        accessibilityLabel={t.backAccessibilityLabel}
      />

      {value !== null ? (
        <ActivityEditorForm
          value={value}
          onChange={patchLocal}
          bodyZones={bodyZonesReferential}
          onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
          silhouette={profile.silhouette}
          category={toEditorCategory(local?.categoryId ?? null, categories)}
          onOpenCategory={() => categorySheet.open()}
          isCategoryPickerOpen={categorySheet.isOpen}
          categoryAccessRef={categoryAccessRef}
          profileSideRecoverySecondsDefault={profile.sideRecovery}
          // PRE-5 story 2.5 (AC4, D-409, RM-218) : Exercice ouvert depuis une Séance — la
          // Feuille ne présente ni Compte à rebours ni Fin d'exercice (valeurs conservées).
          exerciseSignals="absent"
          baselineParameters={baselineParameters}
          mediaService={activityDefinitionService}
          mediaDraftId={mediaDraftId}
          finishLabel={t.finishAction}
          onFinish={handleTerminer}
          isFinishDisabled={!isValid}
          finishSlotTestID="exercise-finish-action-slot"
          finishActionTestID="exercise-finish-action"
        />
      ) : null}

      {categorySheet.isMounted ? (
        <CategoryPickerModal
          key={categorySheet.generation}
          visible={categorySheet.isOpen}
          onDismissed={categorySheet.dismissed}
          selectedId={local?.categoryId ?? null}
          onSelect={(id) => setLocal((current) => (current ? { ...current, categoryId: id } : current))}
          // Q53 (8) : Catégorie de la Copie supprimée depuis sa feuille : elle quitte le Brouillon,
          // et `Terminer` reste inactif tant qu'aucune Catégorie n'est choisie.
          onCategoryRetired={(id) => {
            if (local?.categoryId === id) setCategoryClearedByDeletion(true);
            setLocal((current) => (current && current.categoryId === id ? { ...current, categoryId: null } : current));
          }}
          onClose={() => {
            categorySheet.close();
            reloadCategories();
          }}
        />
      ) : null}

      {/* Q18 (FR-02-12) : textes de création en CS, de modification en MS (intention de la route). */}
      {isPendingExit ? (
        <ExerciseExitConfirmModal isCreation={isCreationRoute} onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadErrorBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // Marge latérale appliquée au rendu (`editorSideMargin`, story 4.2).
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
