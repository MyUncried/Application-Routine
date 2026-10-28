import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { createEmptyExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { validateMovement, type Movement } from "@/domain/activities/Movement";
import { savableMovementPhases, type MovementPhaseList } from "@/domain/activities/movementPhaseList";
import type { MovementSaveDecision } from "@/domain/activities/movementSave";
import { movementLevelPosition, variantLevelPosition, type MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { Category } from "@/domain/categories/Category";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import { DEFAULT_EXERCISE_COUNTDOWN_SECONDS, DEFAULT_EXERCISE_END_SECONDS, type Silhouette } from "@/domain/preferences/Profile";
import {
  ActivityEditorForm,
  editorSideMargin,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type { MovementLevels } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import type { EditorLevel } from "@/features/activities/MovementLevelMenu";
import { MovementLevelsScreen } from "@/features/activities/MovementLevelsScreen";
import type { VariantPlacement } from "@/features/activities/MovementResultCard";
import { MovementSaveDialog } from "@/features/activities/MovementSaveDialog";
import { useMovementOriginChoice } from "@/features/activities/useMovementOriginChoice";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { EditMovementAction, EditorHeader } from "@/features/sessions/ExerciseScreen";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.2, CE-MVT-01, DSF Mouvements §3) — fiche d'un Mouvement depuis le Catalogue
 * des Mouvements : création indépendante, variante explicite, consultation puis modification par
 * le crayon. Contenu partagé SEUL (nom, Catégorie, Zones, Description en étapes, médias dans le
 * gabarit photo, structure des phases) : aucun paramètre d'exécution, aucun Exercice ni Séance
 * créé.
 *
 * Réutilise sans les recopier les mécanismes livrés : éditeur commun (`ActivityEditorForm`,
 * variante `"movement"`), recherche et unicité du nom (`useMovementOriginChoice`, R01–R08, C01),
 * feuilles de Catégorie et de Zones, menu de Niveau, réordonnancement des niveaux existant,
 * dialogue C03 (`MovementSaveDialog`), garde d'abandon, import de médias.
 *
 * - Création : formulaire vierge, pastille « Niveau ». « Utiliser ce mouvement » ouvre la fiche
 *   existante en consultation (aucun doublon) ; « Créer une variante » reprend seulement
 *   Catégorie, Zones et nom commencé, avec l'invite « (compléter le nom) ».
 * - Variante (route `variantOf` + `placement`, ou choix du panneau) : nouvelle identité, insérée
 *   avant (plus facile) ou après (plus difficile) son origine ; aucune seconde confirmation.
 * - Consultation : lecture seule ; crayon → édition ; Niveau → consulter un autre membre (sans
 *   reclassement) ou ajouter un niveau.
 * - Édition : table C03 du Catalogue (`MovementCatalogueService.assessSave`).
 *
 * Terminer revient au contexte appelant ; ✕ protège un brouillon modifié. Une erreur
 * d'enregistrement conserve la saisie pour réessayer.
 */

type Mode = "create" | "consult" | "edit";

/**
 * Recette A/B (F07) : valeur du paramètre de route `mode` qui ouvre la fiche d'un Mouvement existant
 * directement en édition (`/movement?movementId=…&mode=edit`), depuis le Catalogue des Mouvements
 * seulement. Sans ce paramètre, la fiche s'ouvre en consultation (crayon → édition).
 */
export const MOVEMENT_EDIT_MODE_PARAM = "edit";

type Draft = {
  readonly name: string;
  readonly instructionSteps: readonly string[];
  readonly bodyZoneIds: readonly string[];
  readonly media: readonly DraftMediaItem[];
  readonly categoryId: string | null;
  readonly phases: MovementPhaseList;
  readonly aliases: readonly string[];
};

const EMPTY_DRAFT: Draft = {
  name: "",
  instructionSteps: [],
  bodyZoneIds: [],
  media: [],
  categoryId: null,
  phases: { phases: [], nextPhaseId: 1 },
  aliases: [],
};

/** Paramètres neutres exigés par le type de l'éditeur commun ; jamais affichés ni enregistrés ici. */
const UNUSED_PARAMETERS = createEmptyExecutionParameters({
  countdownSeconds: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  endSeconds: DEFAULT_EXERCISE_END_SECONDS,
});

function draftOf(movement: Movement): Draft {
  return {
    name: movement.name,
    instructionSteps: decodeInstructionSteps(movement.description),
    bodyZoneIds: [...movement.bodyZoneIds],
    media: [...movement.media],
    categoryId: movement.categoryId,
    phases: { phases: movement.phases, nextPhaseId: movement.nextPhaseId },
    aliases: movement.aliases,
  };
}

function draftKey(draft: Draft): string {
  return JSON.stringify({
    ...draft,
    instructionSteps: encodeInstructionSteps(draft.instructionSteps),
    phases: savableMovementPhases(draft.phases.phases),
    media: draft.media.map((item) => item.assetId),
    bodyZoneIds: [...draft.bodyZoneIds].sort(),
  });
}

/** Mouvement enregistrable du brouillon, sous l'identité donnée. */
export function movementOfDraft(draft: Draft, id: string, levelGroup: Movement["levelGroup"]): Movement {
  return {
    id,
    name: draft.name.trim(),
    description: encodeInstructionSteps(draft.instructionSteps),
    media: draft.media,
    categoryId: draft.categoryId ?? "",
    bodyZoneIds: draft.bodyZoneIds,
    phases: savableMovementPhases(draft.phases.phases),
    nextPhaseId: draft.phases.nextPhaseId,
    aliases: draft.aliases,
    levelGroup,
  };
}

function toEditorCategory(categoryId: string | null, categories: readonly Category[]): EditorCategory {
  if (!categoryId) return null;
  const found = categories.find((candidate) => candidate.id === categoryId);
  return found ? { name: found.name, color: found.color } : null;
}

export function MovementScreen() {
  const params = useLocalSearchParams<{ movementId?: string; variantOf?: string; placement?: string; mode?: string }>();
  const placement: VariantPlacement = params.placement === "BEFORE_ORIGIN" ? "BEFORE_ORIGIN" : "AFTER_ORIGIN";
  const openInEdit = params.mode === MOVEMENT_EDIT_MODE_PARAM;
  return (
    <MovementSheet
      key={`${params.movementId ?? ""}|${params.variantOf ?? ""}|${placement}|${openInEdit ? "edit" : ""}`}
      movementId={params.movementId ?? null}
      variantOf={params.variantOf ?? null}
      variantPlacement={placement}
      openInEdit={openInEdit}
    />
  );
}

/**
 * Recette A/B (b8-3, ch07) : rang affiché d'un membre de la famille, même règle que le Catalogue
 * (`MovementCatalogueService.listEntries`) — un membre actif est numéroté parmi les seuls actifs ;
 * un membre archivé garde son rang dans la famille complète. `entry.rank` reste la position complète.
 */
function displayedLevelPosition(levels: MovementLevels, movementId: string): MovementLevelPosition | null {
  const entry = levels.levels.find((candidate) => candidate.movement.id === movementId);
  if (entry === undefined) return levels.position;
  const members = levels.levels.filter((candidate) => entry.archived === true || candidate.archived !== true);
  return movementLevelPosition(
    entry.movement,
    members.map((candidate) => candidate.movement),
  );
}

export function MovementSheet({
  movementId,
  variantOf,
  variantPlacement,
  openInEdit = false,
}: {
  readonly movementId: string | null;
  readonly variantOf: string | null;
  readonly variantPlacement: VariantPlacement;
  /** Recette A/B (F07) : fiche ouverte depuis le Catalogue des Mouvements, directement en édition. */
  readonly openInEdit?: boolean;
}) {
  const router = useRouter();
  const service = useActivityDefinitionService();
  // Une seule instance par service : le chargement ne doit pas se relancer à chaque rendu.
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  const t = strings.screens.movement;
  const editorStrings = strings.screens.activities.editor;
  const sideMargin = editorSideMargin(useWindowDimensions().width);

  const [mode, setMode] = useState<Mode>(movementId !== null ? "consult" : "create");
  const [origin, setOrigin] = useState<Movement | null>(null);
  const [initial, setInitial] = useState<Draft>(EMPTY_DRAFT);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    catalogue === null ? "error" : movementId !== null || variantOf !== null ? "loading" : "ready",
  );
  const [levels, setLevels] = useState<MovementLevels | null>(null);
  const [variant, setVariant] = useState<{ readonly originId: string; readonly placement: VariantPlacement; readonly position: MovementLevelPosition } | null>(null);
  const [nameHintVisible, setNameHintVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{ readonly decision: MovementSaveDecision; readonly movement: Movement } | null>(null);
  const [isLevelsScreenOpen, setIsLevelsScreenOpen] = useState(false);
  // PRE-8 (B.8) : un Mouvement archivé s'ouvre en consultation seule (ni crayon, ni ajout de niveau),
  // comme une Séance archivée ; il se restaure depuis les Archives du Catalogue.
  const [isArchived, setIsArchived] = useState(false);
  const [bodyZonesToken, setBodyZonesToken] = useState(0);
  const bodyZones = useBodyZones(bodyZonesToken);
  const { categories, reload: reloadCategories } = useCategories();
  const silhouette = useSilhouette();
  const [mediaDraftId] = useState(() => `movement:${movementId ?? Crypto.randomUUID()}`);
  const categoryAccessRef = useRef<View>(null);
  const categorySheet = useReferenceSheet(categoryAccessRef);
  const nameRef = useRef(draft.name);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      const targetId = movementId ?? variantOf;
      // Sans service de Mouvement, l'état initial est déjà « erreur » (voir `loadState`).
      if (!catalogue || targetId === null) return;
      Promise.all([
        catalogue.findMovement(targetId),
        service.supportsMovementLevels ? service.getMovementLevels(targetId) : null,
        movementId !== null ? catalogue.isArchived(movementId) : false,
      ])
        .then(([movement, movementLevels, archived]) => {
          if (isCancelled()) return;
          if (!movement) {
            setLoadState("error");
            return;
          }
          if (movementId !== null) {
            const loaded = draftOf(movement);
            setOrigin(movement);
            setInitial(loaded);
            setDraft(loaded);
            setLevels(movementLevels);
            setIsArchived(archived);
            // F07 : le Catalogue ouvre la fiche en édition ; un Mouvement archivé reste en consultation (B.8).
            if (openInEdit && !archived) setMode("edit");
          } else {
            // Variante (« Ajouter un niveau ») : Catégorie, Zones et nom commencé seulement.
            const started: Draft = { ...EMPTY_DRAFT, name: movement.name, categoryId: movement.categoryId, bodyZoneIds: [...movement.bodyZoneIds] };
            setInitial(started);
            setDraft(started);
            setNameHintVisible(true);
            setVariant({
              originId: movement.id,
              placement: variantPlacement,
              position: variantLevelPosition(movementLevels?.position ?? null, variantPlacement),
            });
          }
          setLoadState("ready");
        })
        .catch((error: unknown) => {
          if (isCancelled()) return;
          console.error("Le mouvement n'a pas pu être chargé.", error);
          setLoadState("error");
        });
    },
    [catalogue, service, movementId, variantOf, variantPlacement, openInEdit],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isDirty = draftKey(draft) !== draftKey(initial);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(isDirty && !isDone, () => {
    service.abandonMediaDraft(mediaDraftId).catch(() => undefined);
  });

  useEffect(() => {
    if (isDone) router.back();
  }, [isDone, router]);

  const onlyNameEntered = draftKey({ ...draft, name: "", categoryId: null, bodyZoneIds: [] }) === draftKey(EMPTY_DRAFT);
  const searchContext = useMemo(() => ({ categoryId: draft.categoryId, bodyZoneIds: draft.bodyZoneIds }), [draft.categoryId, draft.bodyZoneIds]);
  // Recette A/B B.10 (remarque 7) : la recherche de mouvement similaire vaut aussi pour un nouveau
  // niveau (menu Niveau, Plus facile / Plus difficile du Catalogue), dès que le nom repris est modifié
  // (invite « (compléter le nom) » retirée) — même mécanisme que la création.
  const originChoice = useMovementOriginChoice({
    service,
    name: draft.name,
    available: mode === "create" && !nameHintVisible && loadState === "ready" && onlyNameEntered,
    uniqueness: {
      excludedMovementId: mode === "edit" ? (origin?.id ?? null) : null,
      suspended: mode === "consult",
      messageHidden: nameHintVisible,
    },
    context: searchContext,
    // Recette A/B B.10 (remarque 6) : « Ajouter un niveau » / « Ouvrir ce mouvement ».
    actionLabels: t.suggestion,
    onSameMovement: (choice) => {
      // « Ouvrir ce mouvement » : la fiche existante, en consultation ; aucun duplicata.
      router.replace({ pathname: "/movement", params: { movementId: choice.movement.id } });
    },
    onVariant: (choice, placement) => {
      setSaveError(false);
      setVariant({ originId: choice.movement.id, placement, position: variantLevelPosition(choice.level, placement) });
      setDraft((current) => ({
        ...current,
        categoryId: current.categoryId ?? choice.movement.categoryId,
        bodyZoneIds: current.bodyZoneIds.length === 0 ? [...choice.movement.bodyZoneIds] : current.bodyZoneIds,
      }));
      setNameHintVisible(true);
    },
  });

  function patchForm(next: Partial<ActivityEditorFormValue>) {
    setSaveError(false);
    if (next.name !== undefined) {
      if (next.name !== nameRef.current) setNameHintVisible(false);
      nameRef.current = next.name;
    }
    setDraft((current) => ({
      ...current,
      ...(next.name !== undefined ? { name: next.name } : {}),
      ...(next.instructionSteps !== undefined ? { instructionSteps: next.instructionSteps } : {}),
      ...(next.bodyZoneIds !== undefined ? { bodyZoneIds: next.bodyZoneIds } : {}),
      ...(next.media !== undefined ? { media: next.media } : {}),
    }));
  }

  // Recette A/B B.10 (b2-5, remarque 7) : en création (Mouvement ou niveau), un nom déjà utilisé
  // garde le clavier sur le Nom à l'appui sur Entrée et rend le reste de la fiche non modifiable
  // jusqu'à un nom disponible ; le message d'unicité (`10175:20349`) reste affiché au-dessus.
  const isNameBlocking = mode === "create" && originChoice.nameTaken;
  const candidate = movementOfDraft(draft, origin?.id ?? "draft", origin?.levelGroup ?? null);
  const isValid = validateMovement(candidate).ok;

  async function write(run: () => Promise<{ readonly status: string }>) {
    setIsSaving(true);
    setSaveError(false);
    try {
      const result = await run();
      if (result.status === "SAVED") {
        service.commitMediaDraft(mediaDraftId);
        setIsDone(true);
        return;
      }
      if (result.status === "DUPLICATE_NAME") {
        originChoice.markNameTaken(candidate.name);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Le mouvement n'a pas pu être enregistré.", error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinish() {
    if (!catalogue || isSaving || !isValid) return;
    if (mode === "create") {
      const movement = movementOfDraft(draft, Crypto.randomUUID(), null);
      if (variant !== null) {
        await write(() => catalogue.createVariant(movement, variant.originId, variant.placement === "BEFORE_ORIGIN" ? "EASIER" : "HARDER"));
      } else {
        await write(() => catalogue.createIndependent(movement));
      }
      return;
    }
    if (mode !== "edit" || origin === null) return;
    const movement = movementOfDraft(draft, origin.id, origin.levelGroup);
    try {
      const assessment = await catalogue.assessSave(movement);
      if (assessment.status !== "ASSESSED") {
        setSaveError(true);
        return;
      }
      switch (assessment.decision.kind) {
        case "NONE":
          setIsDone(true);
          return;
        case "SILENT":
          await write(() => catalogue.update(movement));
          return;
        case "CONFIRM":
        case "CHOICE":
          setPendingDecision({ decision: assessment.decision, movement });
          return;
      }
    } catch (error) {
      console.error("La sauvegarde du mouvement n'a pas pu être évaluée.", error);
      setSaveError(true);
    }
  }

  const levelMenu = useMemo<EditorLevel | null>(() => {
    if (variant !== null) return { position: variant.position, menu: null };
    if (mode === "create") return { position: null, menu: null };
    if (levels === null) return { position: null, menu: null };
    // F07 : ouverte en édition depuis le Catalogue, la fiche garde le menu Niveau (consulter un autre
    // membre, ajouter un niveau) ; une édition entrée par le crayon le garde fermé, comme avant.
    if (origin === null) return { position: levels.position, menu: null };
    if (mode === "edit" && !openInEdit) return { position: displayedLevelPosition(levels, origin.id), menu: null };
    const total = levels.position?.total ?? 0;
    return {
      position: displayedLevelPosition(levels, origin.id),
      menu: {
        currentDefinitionId: null,
        // Recette A/B B.10 (q6-2) : un niveau archivé reste consultable, signalé « (archivé) ».
        levels: levels.levels.map((entry) => {
          const displayed = displayedLevelPosition(levels, entry.movement.id);
          return {
            rank: entry.rank,
            displayRank: displayed?.rank ?? entry.rank,
            total: displayed?.total ?? total,
            name: entry.movement.name,
            movementId: entry.movement.id,
            exercises: [],
            archived: entry.archived === true,
          };
        }),
        // Recette A/B B.10 (b2-8) : « Ouvrir un autre niveau », textes réduits (panneau de repli).
        levelsLabel: strings.screens.activities.editor.levelMenu.openOtherLevel,
        compact: true,
        onChangeLevel: () => undefined,
        // « Ajouter un niveau » : variante explicite de ce mouvement, avant ou après lui.
        onAddLevel: isArchived ? null : (placement) => router.push({ pathname: "/movement", params: { variantOf: origin.id, placement } }),
        onReorderLevels: () => setIsLevelsScreenOpen(true),
        movementChoice: {
          currentMovementId: origin.id,
          // « Changer de niveau » : consulter un autre membre, sans reclassement.
          onChangeMovement: (id) => {
            if (id !== origin.id) {
              router.replace({ pathname: "/movement", params: openInEdit ? { movementId: id, mode: MOVEMENT_EDIT_MODE_PARAM } : { movementId: id } });
            }
          },
        },
      },
    };
  }, [variant, mode, levels, origin, router, isArchived, openInEdit]);

  const title = mode === "create" ? t.titles.create : mode === "edit" ? t.titles.edit : t.titles.consult;
  const formValue: ActivityEditorFormValue = {
    name: draft.name,
    instructionSteps: draft.instructionSteps,
    executionParameters: UNUSED_PARAMETERS,
    bodyZoneIds: draft.bodyZoneIds,
    media: draft.media,
  };

  return (
    <ScreenShell>
      <EditorHeader
        title={title}
        onClose={() => router.back()}
        accessibilityLabel={t.close}
        trailing={loadState === "ready" && mode === "consult" && !isArchived ? <EditMovementAction onPress={() => setMode("edit")} /> : null}
      />
      {loadState === "error" ? (
        <View style={[styles.loadErrorBody, { paddingHorizontal: sideMargin }]} testID="movement-load-error">
          <Text style={styles.loadErrorMessage}>{t.loadError}</Text>
          <Pressable
            onPress={() => {
              setLoadState("loading");
              load(() => false);
            }}
            accessibilityRole="button"
            accessibilityLabel={t.retry}
            style={styles.loadErrorRetry}
            testID="movement-load-retry"
          >
            <Text style={styles.loadErrorRetryLabel}>{t.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {loadState === "ready" ? (
        <ActivityEditorForm
          variant="movement"
          value={formValue}
          onChange={patchForm}
          movementPhases={{ value: draft.phases, onChange: (phases) => setDraft((current) => ({ ...current, phases })) }}
          bodyZones={bodyZones}
          onBodyZonesPickerClose={() => setBodyZonesToken((current) => current + 1)}
          silhouette={silhouette}
          category={toEditorCategory(draft.categoryId, categories)}
          onOpenCategory={() => {
            setSaveError(false);
            categorySheet.open();
          }}
          isCategoryPickerOpen={categorySheet.isOpen}
          categoryAccessRef={categoryAccessRef}
          profileSideRecoverySecondsDefault={0}
          contentLocked={mode === "consult"}
          onNameEndEditing={originChoice.onNameEndEditing}
          nameAssist={originChoice.nameAssist}
          // Recette A/B B.10 (q6-2) : un Mouvement archivé est signalé après son nom, en gris.
          nameHint={
            isArchived ? t.archivedNameSuffix : nameHintVisible ? editorStrings.movementSuggestion.completeNameHint : null
          }
          // Recette A/B B.10 (remarque 5) : curseur dans le Nom à l'ouverture d'une création.
          autoFocusName={mode === "create"}
          bodyLocked={isNameBlocking}
          keepNameFocusOnSubmit={isNameBlocking}
          level={levelMenu}
          mediaService={service}
          mediaDraftId={mediaDraftId}
          finishLabel={t.finish}
          onFinish={() => {
            void handleFinish();
          }}
          isFinishDisabled={mode === "consult" || isSaving || !isValid || originChoice.nameTaken}
          errorMessage={saveError ? t.saveError : null}
          finishSlotTestID="movement-finish-slot"
          finishActionTestID="movement-finish-action"
          errorTestID="movement-save-error"
        />
      ) : null}

      {categorySheet.isMounted ? (
        <CategoryPickerModal
          key={categorySheet.generation}
          visible={categorySheet.isOpen}
          onDismissed={categorySheet.dismissed}
          selectedId={draft.categoryId}
          onSelect={(id) => setDraft((current) => ({ ...current, categoryId: id }))}
          onCategoryRetired={(id) => setDraft((current) => (current.categoryId === id ? { ...current, categoryId: null } : current))}
          onClose={() => {
            categorySheet.close();
            reloadCategories();
          }}
        />
      ) : null}

      {isPendingExit ? <ExerciseExitConfirmModal isCreation={mode === "create"} onCancel={cancelExit} onConfirm={confirmExit} /> : null}

      {pendingDecision !== null && catalogue ? (
        pendingDecision.decision.kind === "CHOICE" ? (
          <MovementSaveDialog
            variant="CHOICE"
            otherCount={pendingDecision.decision.otherCount}
            withoutNewMovementDetail
            onConfirm={(choice) => {
              const movement = pendingDecision.movement;
              setPendingDecision(null);
              if (choice === "UPDATE") {
                void write(() => catalogue.update(movement));
              } else if (originChoice.checkDistinctName(movement.name)) {
                // « Créer un nouveau mouvement » : original et Exercices inchangés, nouvelle entrée sans famille.
                void write(() => catalogue.createAsNew(movement, Crypto.randomUUID()));
              }
            }}
            onCancel={() => setPendingDecision(null)}
          />
        ) : (
          <MovementSaveDialog
            variant="CONFIRM"
            otherCount={pendingDecision.decision.kind === "CONFIRM" ? pendingDecision.decision.otherCount : 0}
            onConfirm={() => {
              const movement = pendingDecision.movement;
              setPendingDecision(null);
              void write(() => catalogue.update(movement));
            }}
            onCancel={() => setPendingDecision(null)}
          />
        )
      ) : null}

      {originChoice.overlays}

      {isLevelsScreenOpen && origin !== null ? (
        <MovementLevelsScreen
          service={service}
          movementId={origin.id}
          onClose={() => {
            setIsLevelsScreenOpen(false);
            if (mode === "edit") {
              // F07 : en édition, seuls les rangs sont relus — le brouillon en cours est conservé.
              service
                .getMovementLevels(origin.id)
                .then(setLevels)
                .catch((error: unknown) => console.error("Les niveaux du mouvement n'ont pas pu être relus.", error));
            } else {
              load(() => false);
            }
          }}
        />
      ) : null}
    </ScreenShell>
  );
}

/** Zones corporelles du référentiel persistant (relu à la fermeture de leur feuille). */
function useBodyZones(refreshToken: number): readonly BodyZone[] {
  const service = useActivityDefinitionService();
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    let cancelled = false;
    service.listBodyZones().then(
      (result) => {
        if (!cancelled) setZones(result);
      },
      (error: unknown) => {
        if (!cancelled) console.error("Impossible de charger les Zones corporelles.", error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [service, refreshToken]);
  return zones;
}

/** Catégories (pilule), relues à la fermeture de leur feuille. */
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

/** Silhouette du Profil pour le sélecteur de Zones. */
function useSilhouette(): Silhouette | null {
  const profileService = useProfileService();
  const [silhouette, setSilhouette] = useState<Silhouette | null>(null);
  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (!cancelled) setSilhouette(profile.silhouette);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);
  return silhouette;
}

const styles = StyleSheet.create({
  loadErrorBody: {
    flex: 1,
    justifyContent: "center",
    gap: spacing[12],
  },
  loadErrorMessage: {
    ...type.body,
    color: colors.textPrimary,
    textAlign: "center",
  },
  loadErrorRetry: {
    minHeight: minTouchTarget,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  loadErrorRetryLabel: {
    ...type.button,
    color: colors.primary,
  },
});
