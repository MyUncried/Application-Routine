import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
  sideRecoveryOnSideModeChange,
} from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category, CreateCategoryInput } from "@/domain/categories/Category";
import { DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS, type Silhouette } from "@/domain/preferences/Profile";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { DEFAULT_SIDE_MODE } from "@/domain/sessions/defaults";
import type { SideMode } from "@/domain/sessions/sideMode";
import { createExerciseDraft, exerciseEquals, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  type ActivityEditorFormValue,
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
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-1652FFC3B512) — partagé par les deux adaptateurs de cet écran
 * (`CatalogueActivityEditorScreen`/`CompositionExerciseEditor`), tous deux
 * fournissant `bodyZones` à `ActivityEditorForm` : jamais `BODY_ZONES`, qui
 * n'est plus l'autorité runtime.
 *
 * Correction (device check Hermann, commentaire 5948936550) : l'application
 * réelle monte `ActivityDefinitionServiceProvider`/`SessionServiceContext`
 * AUTOUR du `children` applicatif, mais celui-ci est rendu HORS de
 * `<SQLiteProvider>` (architecture T01-S05, préservée) — un accès direct à
 * `useSQLiteContext` depuis cet écran levait donc TOUJOURS en production,
 * dégradant silencieusement vers un référentiel VIDE (jamais une erreur
 * visible). Le référentiel transite désormais par `ActivityDefinitionService`
 * (`listBodyZones`, même connexion SQLite que `SessionService`, construite
 * par `SessionServiceProvider`), déjà accessible ici via
 * `useActivityDefinitionService()` — même patron de chargement que
 * `listCategories()` ci-dessous. Jamais `BODY_ZONES` (revue indépendante
 * 5930269937) — ce module statique n'est plus l'autorité runtime, y compris
 * en repli ; il ne reste que la source du seed historique consommée par
 * `migration007`.
 */
function useBodyZonesReferential(
  activityDefinitionService: ActivityDefinitionService,
  // R6 (CE-UI-09 L2784, L2816, L2840) : incrémenté à la fermeture de
  // `BodyZonePickerModal` pour relire ce référentiel après une création, un
  // renommage ou une suppression éventuels — même patron exact que
  // `refreshToken` de `useLabelsReferential` (`CompositionScreen.tsx`).
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
  const referentialService = useReferentialService();
  const profileService = useProfileService();
  // R6 : incrémenté à la fermeture de `BodyZonePickerModal` (via
  // `ActivityEditorForm`), pour que ce référentiel reflète immédiatement une
  // Zone créée, renommée ou supprimée dans la modale.
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
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
      bodyZoneIds: draft.bodyZoneIds,
      sideMode: draft.sideMode ?? DEFAULT_SIDE_MODE,
    };
  });
  // V2-PRE-1 (plan §3.1, D-211) : la Catégorie et la pause de changement de
  // côté n'appartiennent pas à `ActivityEditorFormValue` (formulaire commun,
  // partagé avec la Composition qui n'en a pas besoin) — transportées ici,
  // séparément, jamais affectées automatiquement (`category: null` tant
  // qu'aucune sélection explicite n'a eu lieu).
  const [category, setCategory] = useState<CreateCategoryInput | null>(null);
  const [sideRecoverySeconds, setSideRecoverySeconds] = useState(0);
  const [categoriesState, setCategoriesState] = useState<
    | { status: "loading" }
    | { status: "ready"; categories: readonly Category[] }
    | { status: "error" }
  >({ status: "loading" });
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  // V2-PRE-2 (plan §6.1/§7, T21) : valeur COURANTE du Profil (snapshot — la
  // seule lecture d'un changement de côté, jamais rederivée), et silhouette
  // pour l'icône de Zone de `BodyZonePickerModal` (CE-UI-09 L2805).
  const [profileSideChangeRecoveryDefault, setProfileSideChangeRecoveryDefault] = useState<number>(
    DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
  );
  const [silhouette, setSilhouette] = useState<Silhouette | null>(null);
  // V2-CAT-01 (UI-CAT-R-008) : `"error"` couvre à la fois une définition
  // ABSENTE (`getActivityDefinition` résolu à `null` — supprimée ou
  // identifiant invalide) et un échec TECHNIQUE de chargement (promesse
  // rejetée) — dans les deux cas, l'écran ne doit jamais rester bloqué en
  // chargement indéfini ; `Réessayer` relance exactement le même chargement.
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    isEditingExisting ? "loading" : "ready",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isSavingRef = useRef(false);
  const t = strings.screens.activities.editor;
  const loadErrorStrings = strings.screens.activities.error;

  /**
   * N'appelle JAMAIS `setLoadState("loading")` elle-même — l'appelant en
   * décide : l'effet de montage part déjà de `"loading"` (initialiseur de
   * `useState` ci-dessus), et `handleRetryLoad` la redemande explicitement
   * avant d'invoquer cette fonction, pour rester hors d'un corps d'effet
   * (`react-hooks/set-state-in-effect`).
   */
  const fetchDefinition = useCallback(
    (isCancelled: () => boolean) => {
      if (definitionId === null) {
        return;
      }
      activityDefinitionService
        .getActivityDefinition(definitionId)
        .then((definition) => {
          if (isCancelled()) {
            return;
          }
          if (!definition) {
            setLoadState("error");
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
            bodyZoneIds: input.bodyZoneIds,
            sideMode: input.sideMode ?? DEFAULT_SIDE_MODE,
          });
          setCategory(input.category);
          setSideRecoverySeconds(input.sideRecoverySeconds);
          setLoadState("ready");
        })
        .catch((error: unknown) => {
          if (isCancelled()) {
            return;
          }
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

  /**
   * Catégories disponibles — nécessaires uniquement à l'affichage du nom
   * sur la pilule (D-211) ; `CategoryPickerModal` s'auto-alimente de son
   * côté. Rechargée à chaque fermeture de la modale, pour refléter une
   * création/un renommage/une suppression éventuels (D2/D4).
   */
  const reloadCategories = useCallback(() => {
    referentialService.listCategories().then(
      (categories) => setCategoriesState({ status: "ready", categories }),
      (error: unknown) => {
        console.error("Impossible de charger les catégories.", error);
        setCategoriesState({ status: "error" });
      },
    );
  }, [referentialService]);

  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  // V2-PRE-2 (plan §6.1/§7, T21) : lu une seule fois — la Pause entre les
  // côtés n'est copiée qu'à l'activation bilatérale (`patch` ci-dessous),
  // jamais rederivée après.
  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (!cancelled) {
          setProfileSideChangeRecoveryDefault((current) =>
            current === profile.sideChangeRecoverySecondsDefault
              ? current
              : profile.sideChangeRecoverySecondsDefault,
          );
          setSilhouette((current) => (current === profile.silhouette ? current : profile.silhouette));
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger le Profil.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  const handleRetryLoad = useCallback(() => {
    setLoadState("loading");
    fetchDefinition(() => false);
  }, [fetchDefinition]);

  /**
   * T21 : à l'activation bilatérale (`Sans changement` → `D→G`/`G→D`), la
   * Pause entre les côtés copie la valeur COURANTE du Profil ; toute autre
   * transition conserve la valeur stockée inchangée.
   */
  function patch(next: Partial<ActivityEditorFormValue>) {
    setSaveError(false);
    if (next.sideMode !== undefined && next.sideMode !== value.sideMode) {
      const nextSideMode: SideMode = next.sideMode;
      setSideRecoverySeconds((current) =>
        sideRecoveryOnSideModeChange(
          value.sideMode,
          nextSideMode,
          current,
          profileSideChangeRecoveryDefault,
        ),
      );
    }
    setValue((current) => ({ ...current, ...next }));
  }

  const selectedExistingCategory =
    category?.kind === "EXISTING" && categoriesState.status === "ready"
      ? categoriesState.categories.find((candidate) => candidate.id === category.categoryId)
      : undefined;

  const selectedCategoryName =
    category?.kind === "EXISTING"
      ? selectedExistingCategory?.name
      : category?.kind === "NEW"
        ? category.name
        : undefined;

  // R5 (CE-UI-09 L2804 ; C09 L926) : pastille colorée 26 avant le nom dans
  // la pilule Catégorie, suivie après recoloration — seule la Catégorie
  // EXISTING (toujours le cas après sélection ou création via la modale)
  // porte une couleur résolue depuis le référentiel.
  const selectedCategoryColor =
    category?.kind === "EXISTING" ? selectedExistingCategory?.color : undefined;

  function openCategoryPicker() {
    setSaveError(false);
    setIsCategoryPickerOpen(true);
  }

  function closeCategoryPicker() {
    setIsCategoryPickerOpen(false);
    reloadCategories();
  }

  function selectCategory(id: string) {
    setCategory({ kind: "EXISTING", categoryId: id });
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
      category: category ?? { kind: "EXISTING" as const, categoryId: "" },
      bodyZoneIds: value.bodyZoneIds,
      sideMode: value.sideMode,
      sideRecoverySeconds,
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
      {loadState === "loading" ? null : null}
      {loadState === "error" ? (
        <View style={styles.loadErrorBody} testID="activity-editor-load-error">
          <Text style={styles.loadErrorMessage}>{loadErrorStrings.message}</Text>
          <Pressable
            onPress={handleRetryLoad}
            accessibilityRole="button"
            accessibilityLabel={loadErrorStrings.retry}
            style={styles.loadErrorRetry}
            testID="activity-editor-load-retry"
          >
            <Text style={styles.loadErrorRetryLabel}>{loadErrorStrings.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {loadState === "ready" ? (
        <>
          {/*
           * V2-PRE-1 (plan §3.1, D-211 ; `08` l.978 / `13` §4.10) : bouton
           * ouvrant la modale de sélection de Catégorie — icône dans l'état
           * non renseigné, pilule avec le nom après sélection. Contrat de
           * modale déjà validé (appui court = sélectionner), réutilisé sans
           * nouvelle conception.
           */}
          <View style={styles.categoryRow} testID="activity-editor-category-row">
            <Pressable
              onPress={openCategoryPicker}
              accessibilityRole="button"
              accessibilityLabel={
                selectedCategoryName
                  ? `${t.category.label} ${selectedCategoryName}`
                  : t.category.unsetAccessibilityLabel
              }
              style={[styles.categoryPill, selectedCategoryName ? styles.categoryPillSet : null]}
              testID="activity-editor-category-button"
            >
              {selectedCategoryName ? (
                <>
                  {selectedCategoryColor ? (
                    <View
                      style={[styles.categoryPillSwatch, { backgroundColor: selectedCategoryColor }]}
                      testID="activity-editor-category-swatch"
                    />
                  ) : null}
                  <Text style={styles.categoryPillLabel}>{selectedCategoryName}</Text>
                </>
              ) : (
                <KodjoIcon name="icon-tour" testID="activity-editor-category-icon" />
              )}
            </Pressable>
          </View>

          <ActivityEditorForm
            value={value}
            onChange={patch}
            bodyZones={bodyZonesReferential}
            onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
            silhouette={silhouette}
            showMediaSection
            finishLabel={t.finishAction}
            onFinish={handleFinish}
            isFinishDisabled={isSaving || category === null}
            errorMessage={saveError ? t.saveError : null}
            finishSlotTestID="activity-editor-finish-slot"
            finishActionTestID="activity-editor-finish-action"
            errorTestID="activity-editor-save-error"
          />
        </>
      ) : null}

      {isCategoryPickerOpen ? (
        <CategoryPickerModal
          selectedId={category?.kind === "EXISTING" ? category.categoryId : null}
          onSelect={selectCategory}
          onClose={closeCategoryPicker}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  // V2-CAT-01 (UI-CAT-R-008) : définition absente ou échec de chargement —
  // jamais un chargement indéfini. `Réessayer` relance le même chargement ;
  // `Retour` (en-tête, toujours visible) reste la sortie garantie.
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
  // V2-PRE-1 (plan §3.1, D-211) : rangée portant le bouton/pilule de
  // Catégorie, au-dessus du formulaire commun.
  categoryRow: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[12],
  },
  categoryPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    height: dimensions.categoryTag.visualHeight,
    paddingHorizontal: spacing[12],
    borderRadius: dimensions.categoryTag.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryPillSet: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  // R5 (CE-UI-09 L2804 ; C09 L926) : pastille colorée de 26 avant le nom.
  categoryPillSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  categoryPillLabel: {
    ...type.label,
    color: colors.selection,
  },
});

/**
 * Flux Composition (T02-S02, D-137) — écrit exclusivement dans le brouillon
 * `SessionActivity` (`SessionDraftContext`), jamais dans une
 * `ActivityDefinition` persistante : aucune Activité créée directement
 * depuis la Composition ne crée jamais de définition Catalogue (plan §4.4).
 */
function CompositionExerciseEditor() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const activityDefinitionService = useActivityDefinitionService();
  // R6 : incrémenté à la fermeture de `BodyZonePickerModal`, pour que ce
  // référentiel reflète immédiatement une Zone créée, renommée ou
  // supprimée dans la modale.
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  const requestedExerciseId = params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null;

  const [initialSnapshot, setInitialSnapshot] = useState<SessionDraftExercise>(
    () => existingExercise ?? createExerciseDraft(Crypto.randomUUID()),
  );
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);
  const localRef = useRef(local);
  useEffect(() => {
    localRef.current = local;
  }, [local]);

  const profileService = useProfileService();
  const [silhouette, setSilhouette] = useState<Silhouette | null>(null);
  const appliedProfileDefaultRef = useRef(false);
  // V2-PRE-2 (plan §6.1/§7, D-171/D-213) : une occurrence créée ici (jamais
  // en modification d'une Activité déjà présente dans le brouillon) reçoit
  // la Récupération du Profil, lue une seule fois — sans rétroactivité si
  // l'utilisateur a déjà modifié sa copie de travail avant la résolution de
  // cette lecture asynchrone (`localRef`, toujours à jour, comparé à
  // `initialSnapshot`, capturé une seule fois au montage).
  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (cancelled) {
          return;
        }
        setSilhouette((current) => (current === profile.silhouette ? current : profile.silhouette));
        if (!isEditingExisting && !appliedProfileDefaultRef.current) {
          appliedProfileDefaultRef.current = true;
          if (
            exerciseEquals(localRef.current, initialSnapshot) &&
            initialSnapshot.postActivityRecoverySeconds !== profile.postActivityRecoverySecondsDefault
          ) {
            const next = {
              ...initialSnapshot,
              postActivityRecoverySeconds: profile.postActivityRecoverySecondsDefault,
            };
            setInitialSnapshot(next);
            setLocal(next);
          }
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger le Profil.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileService, isEditingExisting]);

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
        bodyZones={bodyZonesReferential}
        onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
        silhouette={silhouette}
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
