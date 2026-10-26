import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import {
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  executionParametersEqual,
  validateForSave,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { repriseExecutionParameters, type Movement, type MovementPhase } from "@/domain/activities/Movement";
import type { CorrectionAssessment, SiblingCompletion, SiblingGap } from "@/domain/activities/sharedCorrection";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { draftMediaEqual, toDraftMediaItems } from "@/domain/media/ActivityMedia";
import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
  type Silhouette,
} from "@/domain/preferences/Profile";
import { DEFAULT_CIRCUIT_NATURE, exitCircuit, type CircuitNature } from "@/domain/sessions/circuit";
import { settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import {
  createExerciseDraft,
  draftMovementOf,
  exerciseEquals,
  withDraftMovement,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  EDITOR_HEADER,
  editorSideMargin,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type {
  ActivityDefinitionService,
  CorrectionTarget,
  MovementLevels,
} from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { IdentityDecisionSheet } from "@/features/activities/IdentityDecisionSheet";
import type { EditorLevel, MovementLevelMenuModel } from "@/features/activities/MovementLevelMenu";
import { MovementLevelsScreen } from "@/features/activities/MovementLevelsScreen";
import { SiblingCompletionStep } from "@/features/activities/SiblingCompletionStep";
import { useMovementOriginChoice } from "@/features/activities/useMovementOriginChoice";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { CircuitEntryConfirmModal } from "@/features/sessions/CircuitEntryConfirmModal";
import { formatExerciseRowSummary } from "@/features/sessions/compositionPresentation";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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
function EditorHeader({
  title,
  onClose,
  accessibilityLabel,
  trailing,
}: {
  title: string;
  onClose: () => void;
  accessibilityLabel: string;
  trailing?: ReactNode;
}) {
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
      trailing={trailing}
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
 * PRE-7 (A2.2, D-437, D-438, MFN-06, MFN-08, MFN-09 ; CE-T03-04 §3) : trois contextes
 * d'édition explicites —
 * - Exercice du Catalogue existant (`catalogueDefinitionId=<id>`) : ouvert directement en
 *   édition ;
 * - création sur un geste repris (`catalogueDefinitionId=new&movementId=<id>`, point d'entrée
 *   branché par la recherche et les suggestions d'A2.3) : contenu du geste en lecture seule,
 *   déverrouillé dans le brouillon par le crayon « Modifier le geste », paramètres modifiables ;
 * - occurrence de Séance portant une filiation : contenu verrouillé, sans crayon ; une création
 *   locale (sans filiation) reste modifiable jusqu'au premier enregistrement de la Séance.
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
  const params = useLocalSearchParams<{
    exerciseId?: string;
    catalogueDefinitionId?: string;
    movementId?: string;
    levelOriginDefinitionId?: string;
  }>();
  if (params.catalogueDefinitionId !== undefined) {
    const isCreation = params.catalogueDefinitionId === "new";
    const repriseMovementId =
      isCreation && typeof params.movementId === "string" && params.movementId.trim().length > 0 ? params.movementId : null;
    // PRE-7 (A3.1, MFN-07) : « Ajouter un niveau » depuis la fiche d'un Exercice du Catalogue.
    const levelOriginDefinitionId =
      isCreation &&
      repriseMovementId === null &&
      typeof params.levelOriginDefinitionId === "string" &&
      params.levelOriginDefinitionId.trim().length > 0
        ? params.levelOriginDefinitionId
        : null;
    return (
      <CatalogueActivityEditorScreen
        definitionId={isCreation ? null : params.catalogueDefinitionId}
        repriseMovementId={repriseMovementId}
        levelOriginDefinitionId={levelOriginDefinitionId}
      />
    );
  }
  return <CompositionExerciseEditor />;
}

/** Issue d'une tentative d'écriture : vrai si enregistrée. */
type SaveOutcome = Promise<boolean>;

/** Entrée d'une écriture Catalogue préparée à `Terminer`, conservée pendant la feuille et l'étape. */
type DefinitionInput = CreateActivityDefinitionInput;

/** PRE-7 (A2.2, D-438) : question d'identité en attente (feuille basse `9952:44349`). */
type PendingIdentityDecision = {
  readonly input: DefinitionInput;
  readonly assessment: CorrectionAssessment;
  readonly phases: readonly MovementPhase[];
};

/** PRE-7 (A2.2, MFN-08) : étape de complétion des durées manquantes des frères, en attente. */
type PendingSiblingCompletion = {
  readonly input: DefinitionInput;
  readonly gaps: readonly SiblingGap[];
  readonly phases: readonly MovementPhase[];
  readonly labels: Readonly<Record<string, string>>;
};

/**
 * PRE-7 (A2.2, D-438, relevé Figma MFN du 23/10 `9952:44374`) : action « Modifier le geste » de
 * l'en-tête — 40 × 32, fond `#F3F4F9`, rayon 10, crayon au trait 20 × 20 ; cible portée à 44 par
 * `hitSlop`. Constantes locales, `tokens.ts` inchangé.
 */
const EDIT_MOVEMENT_ACTION = { width: 40, height: 32, radius: 10, background: "#F3F4F9" } as const;

function EditMovementAction({ onPress }: { onPress: () => void }) {
  const label = strings.screens.activities.editor.editMovement;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{
        top: (minTouchTarget - EDIT_MOVEMENT_ACTION.height) / 2,
        bottom: (minTouchTarget - EDIT_MOVEMENT_ACTION.height) / 2,
        left: (minTouchTarget - EDIT_MOVEMENT_ACTION.width) / 2,
        right: (minTouchTarget - EDIT_MOVEMENT_ACTION.width) / 2,
      }}
      style={styles.editMovementAction}
      testID="activity-editor-edit-movement"
    >
      <KodjoIcon name="edit-movement" testID="activity-editor-edit-movement-icon" />
    </Pressable>
  );
}

/**
 * PRE-7 (A2.3, MFN-06, MFN-07) : champs de contenu VIDES initialisés depuis le geste d'origine
 * d'une variante (description, médias, Zones) ; le nom saisi et toute saisie existante sont
 * conservés — aucune sélection n'écrase silencieusement une information déjà saisie.
 */
function withVariantContent(value: ActivityEditorFormValue, origin: Movement): ActivityEditorFormValue {
  return {
    ...value,
    instructionSteps:
      encodeInstructionSteps(value.instructionSteps) === null ? decodeInstructionSteps(origin.description) : value.instructionSteps,
    media: value.media.length === 0 ? [...origin.media] : value.media,
    bodyZoneIds: value.bodyZoneIds.length === 0 ? [...origin.bodyZoneIds] : value.bodyZoneIds,
  };
}

/**
 * PRE-7 (A3.1, D-439, MFN-05, MFN-07, MFN-10) : modèle de la pastille de Niveau de la fiche — rang
 * dérivé, et popover sur un Exercice existant du Catalogue (niveaux du groupe, Exercices distingués
 * par le résumé de leurs paramètres). Lecture en échec : pastille vide, sans popover.
 */
function editorLevelOf(
  levels: MovementLevels | "error" | null,
  menu: Omit<MovementLevelMenuModel, "levels"> | null,
): EditorLevel | null {
  if (levels === null) return null;
  if (levels === "error") return menu === null ? null : { position: null, menu: null };
  if (menu === null) {
    // Création sur geste repris : même niveau que le geste (MFN-05), affiché sans popover.
    return levels.position === null ? null : { position: levels.position, menu: null };
  }
  const total = levels.position?.total ?? 0;
  return {
    position: levels.position,
    menu: {
      ...menu,
      levels: levels.levels.map((entry) => ({
        rank: entry.rank,
        total,
        name: entry.movement.name,
        exercises: entry.definitions.map((definition) => ({
          definitionId: definition.id,
          summary: formatExerciseRowSummary(definition),
        })),
      })),
    },
  };
}

function CatalogueActivityEditorScreen({
  definitionId,
  repriseMovementId: routeRepriseMovementId,
  levelOriginDefinitionId = null,
}: {
  definitionId: string | null;
  repriseMovementId: string | null;
  levelOriginDefinitionId?: string | null;
}) {
  // PRE-7 (A2.3, MFN-06) : geste repris par la route (A2.2) ou choisi dans l'écran (suggestion,
  // recherche) — la reprise choisie en place garde l'écran monté (aucune navigation, aucun garde
  // d'abandon déclenché) et recharge le contenu du geste.
  const [repriseMovementId, setRepriseMovementId] = useState(routeRepriseMovementId);
  // PRE-7 (A2.3, MFN-06 « Créer une variante / un niveau ») : geste d'origine d'une variante
  // choisie ; `Terminer` crée un nouveau geste (`VARIANT`), sans question d'identité (MFN-08).
  // PRE-7 (A3.1, MFN-07) : `joinOriginGroup` vrai pour « Ajouter un niveau » (rattachement explicite,
  // inséré juste après l'origine) ; faux pour la variante des suggestions (A2.3, aucun rattachement).
  const [variantOrigin, setVariantOrigin] = useState<{ readonly movementId: string; readonly joinOriginGroup: boolean } | null>(
    null,
  );
  const router = useRouter();
  const activityDefinitionService = useActivityDefinitionService();
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
  const { categories, reload: reloadCategories } = useCategories();
  const profile = useProfileDefaults();
  const isEditingExisting = definitionId !== null;
  const isReprise = !isEditingExisting && repriseMovementId !== null;
  const isLevelCreation = !isEditingExisting && !isReprise && levelOriginDefinitionId !== null;
  const needsLoad = isEditingExisting || isReprise || isLevelCreation;
  // Story 4.2 (FR-02-04) : l'écran d'erreur de chargement suit la marge de l'Éditeur.
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const [mediaDraftId] = useState(() => `definition:${definitionId ?? Crypto.randomUUID()}`);

  const [initial, setInitial] = useState<ActivityEditorFormValue | null>(() => (needsLoad ? null : createEmptyFormValue()));
  // PRE-4 (AD-13) : ligne de base des paramètres relue à l'ouverture (aucune en création).
  const [baselineParameters, setBaselineParameters] = useState<ExecutionParametersInput | null>(null);
  // PRE-7 (A2.1, MFN-02, MFN/AC30) : compteur de phase du Mouvement relu avec la définition (ou
  // le geste repris), transmis à la Feuille ; absent en création indépendante (max + 1).
  const [movementNextPhaseId, setMovementNextPhaseId] = useState<number | undefined>(undefined);
  // PRE-7 (A2.2, D-438) : geste d'origine — identité (variante « Créer un nouvel exercice » /
  // « En faire un geste distinct ») et nom AVANT modification (titre de la question d'identité).
  const [origin, setOrigin] = useState<{ readonly movementId: string; readonly name: string } | null>(null);
  // PRE-7 (A2.2, D-438, CE-T03-04 §3) : création sur geste repris — contenu en lecture seule
  // jusqu'au crayon « Modifier le geste » ; le crayon ne persiste rien (brouillon seul).
  const [contentUnlocked, setContentUnlocked] = useState(false);
  const contentLocked = isReprise && !contentUnlocked;
  const [value, setValue] = useState<ActivityEditorFormValue | null>(initial);
  // A3.1 : « Ajouter un niveau » reprend les paramètres de l'Exercice d'origine, Compte à rebours et
  // Fin compris ; les défauts du Profil ne les remplacent pas.
  const [profileApplied, setProfileApplied] = useState(isEditingExisting || isLevelCreation);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  // Story 4.6 (FR-22-10, AC9) : feuille de Catégorie, focus rendu à l'accès après sa fermeture.
  const categoryAccessRef = useRef<View>(null);
  const categorySheet = useReferenceSheet(categoryAccessRef);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(needsLoad ? "loading" : "ready");
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isSavingRef = useRef(false);
  const [pendingDecision, setPendingDecision] = useState<PendingIdentityDecision | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<PendingSiblingCompletion | null>(null);
  const t = strings.screens.activities.editor;
  const loadErrorStrings = strings.screens.activities.error;

  const fetchDefinition = useCallback(
    (isCancelled: () => boolean) => {
      if (definitionId !== null) {
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
            setMovementNextPhaseId(definition.movementNextPhaseId);
            setOrigin({ movementId: definition.movementId, name: definition.name });
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
        return;
      }
      if (repriseMovementId === null && levelOriginDefinitionId !== null) {
        // PRE-7 (A3.1, MFN-07, MFN-05 l.375) : « Ajouter un niveau » — nouveau geste et son Exercice,
        // description, médias, Zones et Catégorie initialisés depuis l'original, paramètres repris
        // (« éventuellement repris de l'original »), tous modifiables ; nom à saisir.
        activityDefinitionService
          .getActivityDefinition(levelOriginDefinitionId)
          .then((definition) => {
            if (isCancelled()) return;
            if (!definition) {
              setLoadState("error");
              return;
            }
            const loaded: ActivityEditorFormValue = {
              name: "",
              instructionSteps: decodeInstructionSteps(definition.description),
              executionParameters: cloneExecutionParameters(definition.executionParameters),
              bodyZoneIds: [...definition.bodyZoneIds],
              media: toDraftMediaItems(definition.media ?? []),
            };
            // AD-13 (H25) : une valeur héritée de l'original, non modifiée, reste enregistrable.
            setBaselineParameters(cloneExecutionParameters(definition.executionParameters));
            setVariantOrigin({ movementId: definition.movementId, joinOriginGroup: true });
            setInitial(loaded);
            setValue(loaded);
            setCategoryId(definition.categoryId ?? null);
            setInitialCategoryId(definition.categoryId ?? null);
            setLoadState("ready");
          })
          .catch((error: unknown) => {
            if (isCancelled()) return;
            console.error("L'exercice d'origine du niveau n'a pas pu être chargé.", error);
            setLoadState("error");
          });
        return;
      }
      if (repriseMovementId === null) {
        return;
      }
      // PRE-7 (A2.2, MFN-06) : contenu du geste RÉELLEMENT repris ; paramètres du nouvel Exercice
      // à saisir, construits sur la structure du geste (`repriseExecutionParameters`).
      activityDefinitionService
        .getMovement(repriseMovementId)
        .then((movement) => {
          if (isCancelled()) return;
          if (!movement) {
            setLoadState("error");
            return;
          }
          const empty = createEmptyFormValue();
          const loaded: ActivityEditorFormValue = {
            name: movement.name,
            instructionSteps: decodeInstructionSteps(movement.description),
            executionParameters: repriseExecutionParameters(movement, empty.executionParameters),
            bodyZoneIds: [...movement.bodyZoneIds],
            media: [...movement.media],
          };
          setMovementNextPhaseId(movement.nextPhaseId);
          setOrigin({ movementId: movement.id, name: movement.name });
          setInitial(loaded);
          setValue(loaded);
          setCategoryId(movement.categoryId);
          setInitialCategoryId(movement.categoryId);
          setLoadState("ready");
        })
        .catch((error: unknown) => {
          if (isCancelled()) return;
          console.error("Le geste repris n'a pas pu être chargé.", error);
          setLoadState("error");
        });
    },
    [activityDefinitionService, definitionId, repriseMovementId, levelOriginDefinitionId],
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

  // PRE-7 (A2.3, MFN-06, ch03 l.152) : suggestion et recherche des gestes en création, avant tout
  // choix d'origine et tant que seul le nom est saisi (« avant la saisie détaillée »).
  const onlyNameEntered =
    value !== null &&
    initial !== null &&
    formValueEquals({ ...value, name: initial.name }, initial) &&
    categoryId === initialCategoryId;
  const originChoice = useMovementOriginChoice({
    service: activityDefinitionService,
    available:
      !isEditingExisting && repriseMovementId === null && variantOrigin === null && loadState === "ready" && onlyNameEntered,
    onSameMovement: (choice) => {
      // Reprise du geste RÉELLEMENT choisi : contenu en lecture seule + crayon (A2.2), Profil
      // réappliqué au brouillon rechargé. Seul le nom saisi est remplacé, par choix explicite.
      setSaveError(false);
      setContentUnlocked(false);
      // Revue : brouillon vidé AVANT de réarmer le Profil — sinon le rendu suivant appliquerait
      // Compte à rebours et Fin à l'ancien brouillon, et non au brouillon rechargé du geste.
      setInitial(null);
      setValue(null);
      setProfileApplied(false);
      setLoadState("loading");
      setRepriseMovementId(choice.movement.id);
    },
    onVariant: (choice) => {
      setSaveError(false);
      setVariantOrigin({ movementId: choice.movement.id, joinOriginGroup: false });
      setValue((current) => (current ? withVariantContent(current, choice.movement) : current));
      // MFN-05 l.375, MFN/AC33 : Catégorie reprise de l'origine, puis librement modifiable.
      setCategoryId((current) => current ?? choice.movement.categoryId);
    },
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

  function beginSave() {
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(false);
  }

  /** Fin d'une tentative sans enregistrement : verrou réarmé, brouillon et médias conservés. */
  function releaseSave(failed: boolean) {
    isSavingRef.current = false;
    setIsSaving(false);
    if (failed) setSaveError(true);
  }

  function completeSave() {
    activityDefinitionService.commitMediaDraft(mediaDraftId);
    setIsDone(true);
  }

  /** Tentative d'écriture : une erreur technique conserve le brouillon (rollback complet côté Repository). */
  async function attempt(write: () => SaveOutcome) {
    try {
      if (await write()) {
        completeSave();
      } else {
        releaseSave(true);
      }
    } catch (error) {
      console.error("L'activité n'a pas pu être enregistrée.", error);
      releaseSave(true);
    }
  }

  /**
   * « Corriger » (ou correction sans question d'identité) : contenu partagé appliqué à tous les
   * Exercices du geste, durées des frères selon `completions` (MFN-08, services A1.3).
   */
  async function writeCorrection(input: DefinitionInput, completions?: readonly SiblingCompletion[]): Promise<boolean> {
    if (definitionId !== null) {
      return (await activityDefinitionService.updateActivityDefinition(definitionId, input, completions)).status === "UPDATED";
    }
    if (origin === null) {
      return false;
    }
    const result = await activityDefinitionService.createActivityDefinitionWithOrigin(input, {
      kind: "SAME_MOVEMENT",
      movementId: origin.movementId,
      ...(completions !== undefined ? { siblingCompletions: completions } : {}),
    });
    return result.status === "CREATED";
  }

  /**
   * « Créer un nouvel exercice » / « En faire un geste distinct » (MFN-08) : nouveau geste et
   * nouvel Exercice portant le brouillon ; l'original et ses autres Exercices restent intacts.
   * Rattachement au groupe de niveaux : aucun (aucun rattachement automatique, MFN-05 ; la
   * proposition sans présélection reste à présenter, point renvoyé à Hermann, spec A2.2).
   */
  async function writeNewIdentity(input: DefinitionInput): Promise<boolean> {
    if (origin === null) {
      return false;
    }
    const result = await activityDefinitionService.createActivityDefinitionWithOrigin(input, {
      kind: "VARIANT",
      originMovementId: origin.movementId,
      joinOriginGroup: false,
    });
    return result.status === "CREATED";
  }

  /**
   * Correction retenue (choix « Corriger », ou aucune question due) : un frère inéligible à la
   * nouvelle structure fait refuser l'écriture (message d'erreur existant) ; des durées manquantes
   * chez les frères ouvrent l'étape de complétion ; sinon écriture directe. Appelée verrou pris.
   */
  async function proceedWithCorrection(input: DefinitionInput, assessment: CorrectionAssessment, phases: readonly MovementPhase[]) {
    if (assessment.ineligibleDefinitionIds.length > 0) {
      releaseSave(true);
      return;
    }
    if (assessment.siblingGaps.length > 0) {
      const labels: Record<string, string> = {};
      for (const gap of assessment.siblingGaps) {
        const sibling = await activityDefinitionService.getActivityDefinition(gap.definitionId);
        labels[gap.definitionId] = sibling ? formatExerciseRowSummary(sibling) : "";
      }
      releaseSave(false);
      setPendingCompletion({ input, gaps: assessment.siblingGaps, phases, labels });
      return;
    }
    await attempt(() => writeCorrection(input));
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
    beginSave();
    const definitionInput: DefinitionInput = {
      name: value.name,
      // PRE-5 story 3.1 (AC4) : encodage à `Terminer` seulement (étapes vides retirées).
      description: encodeInstructionSteps(value.instructionSteps),
      category: { kind: "EXISTING" as const, categoryId: categoryId ?? "" },
      bodyZoneIds: value.bodyZoneIds,
      executionParameters: validated.value,
      media: value.media.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    };
    // PRE-7 (A2.2, MFN-08 ; report A1.3) : toute correction d'un geste existant (Exercice du
    // Catalogue, ou création sur geste repris) est ÉVALUÉE avant l'écriture. Une création
    // indépendante crée un geste neuf : rien à évaluer. Un service sans `MovementRepository`
    // (doublures antérieures à MFN) écrit directement, comme avant.
    const correctionTarget: CorrectionTarget | null =
      definitionId !== null
        ? { kind: "UPDATE", definitionId }
        : isReprise && origin !== null
          ? { kind: "SAME_MOVEMENT", movementId: origin.movementId }
          : null;
    if (correctionTarget === null && variantOrigin !== null) {
      // PRE-7 (A2.3, MFN-06, MFN-08) : variante explicitement choisie — nouveau geste et son
      // Exercice, enregistrés directement (aucune question d'identité : l'original n'est pas
      // touché). Rattachement au groupe d'origine : aucun pour la variante des suggestions (MFN-05,
      // aucun rattachement automatique ; la proposition sans présélection reste à présenter, point
      // renvoyé à Hermann) ; explicite pour « Ajouter un niveau » (A3.1, MFN-07 : inséré juste après
      // l'origine).
      const { movementId: originMovementId, joinOriginGroup } = variantOrigin;
      await attempt(
        async () =>
          (
            await activityDefinitionService.createActivityDefinitionWithOrigin(definitionInput, {
              kind: "VARIANT",
              originMovementId,
              joinOriginGroup,
            })
          ).status === "CREATED",
      );
      return;
    }
    if (correctionTarget === null || !activityDefinitionService.supportsSharedCorrection) {
      await attempt(async () =>
        definitionId !== null
          ? (await activityDefinitionService.updateActivityDefinition(definitionId, definitionInput)).status === "UPDATED"
          : (await activityDefinitionService.createActivityDefinition(definitionInput)).ok,
      );
      return;
    }
    try {
      const assessed = await activityDefinitionService.assessActivityDefinitionCorrection(correctionTarget, definitionInput);
      if (assessed.status !== "ASSESSED") {
        releaseSave(true);
        return;
      }
      if (assessed.assessment.requiresIdentityDecision) {
        // D-438 : une seule question, à l'enregistrement ; rien n'est écrit avant le choix.
        releaseSave(false);
        setPendingDecision({ input: definitionInput, assessment: assessed.assessment, phases: assessed.phases });
        return;
      }
      await proceedWithCorrection(definitionInput, assessed.assessment, assessed.phases);
    } catch (error) {
      console.error("L'activité n'a pas pu être enregistrée.", error);
      releaseSave(true);
    }
  }

  async function chooseCorrection(decision: PendingIdentityDecision) {
    setPendingDecision(null);
    if (isSavingRef.current) return;
    beginSave();
    try {
      await proceedWithCorrection(decision.input, decision.assessment, decision.phases);
    } catch (error) {
      console.error("L'activité n'a pas pu être enregistrée.", error);
      releaseSave(true);
    }
  }

  async function chooseNewIdentity(decision: PendingIdentityDecision) {
    setPendingDecision(null);
    if (isSavingRef.current) return;
    beginSave();
    await attempt(() => writeNewIdentity(decision.input));
  }

  async function finishCompletion(completion: PendingSiblingCompletion, completions: readonly SiblingCompletion[]) {
    setPendingCompletion(null);
    if (isSavingRef.current) return;
    beginSave();
    await attempt(() => writeCorrection(completion.input, completions));
  }

  // PRE-7 (A3.1, D-439, MFN-05) : niveaux du geste de la fiche (Exercice existant) ou du geste
  // repris, relus après le chargement ; rang et total dérivés, jamais persistés.
  // Lecture rattachée au geste lu : une lecture d'un autre geste (reprise rechargée) n'est jamais
  // affichée.
  const [loadedLevels, setLoadedLevels] = useState<{
    readonly movementId: string;
    readonly levels: MovementLevels | "error";
  } | null>(null);
  // Service sans `MovementRepository` (doublures antérieures à MFN) : aucune pastille.
  const levelMovementId =
    loadState === "ready" && (isEditingExisting || isReprise) && activityDefinitionService.supportsMovementLevels === true
      ? (origin?.movementId ?? null)
      : null;
  const levels = loadedLevels !== null && loadedLevels.movementId === levelMovementId ? loadedLevels.levels : null;
  // PRE-7 (A3.2, MFN-05) : écran des niveaux ouvert depuis le popover ; à sa fermeture, les niveaux
  // sont relus (jeton) — la lecture précédente reste affichée jusque-là : le formulaire reste monté.
  const [isLevelsScreenOpen, setIsLevelsScreenOpen] = useState(false);
  const [levelsReloadToken, setLevelsReloadToken] = useState(0);
  useEffect(() => {
    if (levelMovementId === null) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => activityDefinitionService.getMovementLevels(levelMovementId))
      .then(
        (result) => {
          if (!cancelled) setLoadedLevels({ movementId: levelMovementId, levels: result ?? "error" });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error("Les niveaux du geste n'ont pas pu être chargés.", error);
          setLoadedLevels({ movementId: levelMovementId, levels: "error" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, levelMovementId, levelsReloadToken]);
  const editorLevel = editorLevelOf(
    levels,
    isEditingExisting && definitionId !== null
      ? {
          currentDefinitionId: definitionId,
          // MFN-07 : ouvrir l'Exercice choisi (remplacement ; garde d'abandon existante si modifié).
          // Aucune navigation pendant une écriture en vol (revue A3.1).
          onChangeLevel: (id) => {
            if (isSaving) return;
            router.replace({ pathname: "/exercise", params: { catalogueDefinitionId: id } });
          },
          // MFN-07 : création d'un nouveau geste et de son Exercice, jamais d'un niveau seul.
          onAddLevel: () => {
            if (isSaving) return;
            router.replace({
              pathname: "/exercise",
              params: { catalogueDefinitionId: "new", levelOriginDefinitionId: definitionId },
            });
          },
          // PRE-7 (A3.2) : consultation et réordonnancement des niveaux, au-dessus de la fiche.
          onReorderLevels: () => {
            if (isSaving) return;
            setIsLevelsScreenOpen(true);
          },
        }
      : null,
  );
  // Revue A3.1 : le formulaire attend la lecture des niveaux (base locale, quelques millisecondes)
  // pour s'afficher d'emblée avec sa rangée définitive — aucune rangée à deux accès qui se
  // réorganise ensuite en trois.
  const levelsPending = levelMovementId !== null && levels === null;

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
        trailing={
          loadState === "ready" && contentLocked ? <EditMovementAction onPress={() => setContentUnlocked(true)} /> : null
        }
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
      {loadState === "ready" && value !== null && !levelsPending ? (
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
          contentLocked={contentLocked}
          nextPhaseId={movementNextPhaseId}
          onNameEndEditing={() => originChoice.proposeFor(value.name)}
          movementSearchAction={
            originChoice.canSearch ? { label: t.movementSearch.open, onPress: originChoice.openSearch } : null
          }
          level={editorLevel}
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

      {pendingDecision !== null && origin !== null ? (
        <IdentityDecisionSheet
          context={isEditingExisting ? "CATALOGUE" : "REPRISE"}
          movementName={origin.name}
          affectedDefinitionCount={pendingDecision.assessment.affectedDefinitionCount}
          onCorrect={() => {
            void chooseCorrection(pendingDecision);
          }}
          onNewIdentity={() => {
            void chooseNewIdentity(pendingDecision);
          }}
          onCancel={() => setPendingDecision(null)}
        />
      ) : null}

      {pendingCompletion !== null ? (
        <SiblingCompletionStep
          gaps={pendingCompletion.gaps}
          phases={pendingCompletion.phases}
          siblingLabels={pendingCompletion.labels}
          onFinish={(completions) => {
            void finishCompletion(pendingCompletion, completions);
          }}
          onCancel={() => setPendingCompletion(null)}
        />
      ) : null}

      {originChoice.overlays}

      {isLevelsScreenOpen && levelMovementId !== null ? (
        <MovementLevelsScreen
          service={activityDefinitionService}
          movementId={levelMovementId}
          onClose={() => {
            setIsLevelsScreenOpen(false);
            setLevelsReloadToken((current) => current + 1);
          }}
        />
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
 * PRE-6 (story 3.3) : mêmes séries (Régime, nombre, Cibles, Pauses, charges, phases), les
 * autres paramètres étant ignorés.
 */
function seriesEqual(a: ExecutionParametersInput, b: ExecutionParametersInput): boolean {
  return executionParametersEqual(a, { ...a, series: b.series });
}

/**
 * PRE-6 (story 3.3) : contexte d'une occurrence existante à l'ouverture de l'éditeur — N hérité
 * (AD-37, AD-44) et séries ouvertes, sous leur forme lue et sous celle que produit le ✓ de la
 * Feuille (`validateForSave` avec la ligne de base), pour que ✓ sans modification ne compte pas
 * comme un changement. `null` sans occurrence existante.
 */
type OpenedOccurrence = {
  readonly inheritedSeriesCount: boolean;
  readonly openedParameters: readonly ExecutionParametersInput[];
  /**
   * PRE-7 (A2.1, D-437, D-438, MFN-09 ; CE-UI-10) : structure des phases verrouillée — occurrence
   * d'un Mouvement déjà enregistré (copie du Catalogue, Séance enregistrée, reprise).
   * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : une occurrence dont le Mouvement
   * est NOUVEAU dans le brouillon (création locale, original comme copie) a son contenu et sa
   * structure modifiables ; la modification s'inscrit dans ce Mouvement partagé
   * (`withDraftMovement`), sans mécanisme propre aux copies. Le crayon d'un Mouvement enregistré
   * relève de R-4 (C04).
   */
  readonly phaseStructureLocked: boolean;
};

function openedOccurrenceOf(
  exercise: SessionDraftExercise | null,
  nature: CircuitNature | undefined,
  movements: SessionDraft["movements"],
): OpenedOccurrence | null {
  if (exercise === null) {
    return null;
  }
  const opened = cloneExecutionParameters(exercise.executionParameters);
  const validated = validateForSave(opened, opened);
  return {
    inheritedSeriesCount:
      exercise.structuralPosition === "IN_TOUR" &&
      exercise.type === "EXERCISE" &&
      (nature ?? DEFAULT_CIRCUIT_NATURE) === "SERIES",
    openedParameters: validated.ok ? [opened, validated.value] : [opened],
    phaseStructureLocked: isPersistedMovementOccurrence(exercise, movements),
  };
}

/**
 * PRE-7 (R-3, C05) : l'occurrence référence un Mouvement déjà enregistré (et non un Mouvement
 * NOUVEAU de la table du brouillon) — son contenu n'est pas modifiable sans le crayon (R-4).
 */
function isPersistedMovementOccurrence(exercise: SessionDraftExercise, movements: SessionDraft["movements"]): boolean {
  const movementId = (exercise.sourceMovementId ?? "").trim();
  return movementId.length > 0 && movements?.[movementId]?.change !== "NEW";
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
  // PRE-6 (story 3.3, AD-37, AD-44) : contexte de l'occurrence existante, figé dès qu'elle est
  // lue sur le brouillon (au montage, ou dès sa résolution si le brouillon n'est pas encore
  // hydraté), puis pour toute la vie de l'éditeur :
  // - N hérité : occurrence `IN_TOUR`, de type `EXERCISE`, d'un Circuit de Séries. Une occurrence
  //   sortie du Circuit (ou passée en Tours) est donc libre à sa prochaine ouverture. Une nouvelle
  //   occurrence n'est pas encore dans le Circuit : elle y est adaptée à `Terminer` (story 2.3) ;
  // - paramètres à l'ouverture, référence de la règle de réserve (`commitFinished`).
  const [openedOccurrence, setOpenedOccurrence] = useState(() =>
    openedOccurrenceOf(existingExercise, draft.circuitNature, draft.movements),
  );
  if (openedOccurrence === null && existingExercise !== null) {
    setOpenedOccurrence(openedOccurrenceOf(existingExercise, draft.circuitNature, draft.movements));
  }
  const inheritedSeriesCount = openedOccurrence?.inheritedSeriesCount ?? false;
  const phaseStructureLocked = openedOccurrence?.phaseStructureLocked ?? false;
  const [initialSnapshot, setInitialSnapshot] = useState<SessionDraftExercise>(() =>
    existingExercise
      ? existingExercise
      : {
          // Nouvelle occurrence : AUCUNE Récupération automatique — PRE-6
          // (story 1.1, AD-35) : absente (`null`), distincte de « présente à 0 ».
          ...createExerciseDraft(Crypto.randomUUID(), null),
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
  // PRE-6 (story 2.3) : ajout adapté au Circuit de Séries, en attente de confirmation de perte.
  const [pendingCircuitEntry, setPendingCircuitEntry] = useState<{ readonly targetCount: number } | null>(null);

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
  // PRE-7 (A2.3, MFN-04, MFN-06, MFN-09) : création depuis une Séance — mêmes suggestion et
  // recherche qu'au Catalogue, avant tout choix et tant que seul le nom est saisi. « Même geste » :
  // l'occurrence porte la filiation du geste choisi (contenu verrouillé, sans crayon, MFN-09) ;
  // « Variante » : création LOCALE (geste local créé à l'enregistrement de la Séance), champs vides
  // initialisés depuis l'origine. Rien n'est publié au Catalogue ; « Continuer » seul persiste.
  const [variantChosen, setVariantChosen] = useState(false);
  const repriseLocked = !isEditingExisting && (local?.sourceMovementId ?? "").trim().length > 0;
  const occurrenceOnlyNamed =
    local !== null && occurrenceEquals({ ...local, name: initialSnapshot.name }, instructionSteps, initialSnapshot);
  const originChoice = useMovementOriginChoice({
    service: activityDefinitionService,
    available: !isEditingExisting && !repriseLocked && !variantChosen && occurrenceOnlyNamed,
    onSameMovement: ({ movement }) => {
      setInstructionSteps(decodeInstructionSteps(movement.description));
      setLocal((current) =>
        current
          ? {
              ...current,
              name: movement.name,
              instruction: movement.description,
              categoryId: movement.categoryId,
              bodyZoneIds: [...movement.bodyZoneIds],
              media: [...movement.media],
              executionParameters: repriseExecutionParameters(movement, current.executionParameters),
              sourceMovementId: movement.id,
            }
          : current,
      );
    },
    onVariant: ({ movement }) => {
      setVariantChosen(true);
      setInstructionSteps((current) =>
        encodeInstructionSteps(current) === null ? decodeInstructionSteps(movement.description) : current,
      );
      setLocal((current) =>
        current
          ? {
              ...current,
              media: (current.media ?? []).length === 0 ? [...movement.media] : current.media,
              bodyZoneIds: current.bodyZoneIds.length === 0 ? [...movement.bodyZoneIds] : current.bodyZoneIds,
              categoryId: current.categoryId ?? movement.categoryId,
            }
          : current,
      );
    },
  });
  // PRE-6 (story 2.3) : la sortie l'emporte — le dialogue de Circuit en attente est retiré
  // (ajustement d'état pendant le rendu ; `finishingRef` n'est jamais engagé tant qu'il attend).
  if (isPendingExit && pendingCircuitEntry !== null) {
    setPendingCircuitEntry(null);
  }

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

  /**
   * Occurrences du brouillon COURANT après `Terminer`. PRE-6 (story 2.3, AD-39) : une nouvelle
   * occurrence qui arrive dans un Circuit de Séries est adaptée à N ; ses pertes éventuelles
   * sont rendues pour confirmation AVANT toute mutation.
   */
  function planFinish(current: SessionDraftExercise) {
    // PRE-5 story 3.1 (AC4) : l'occurrence reçoit l'encodage des étapes à `Terminer` seulement.
    // PRE-7 (R-3, C05) : une création locale reçoit un Mouvement NOUVEAU à son identifiant.
    const encoded: SessionDraftExercise = { ...current, instruction: encodeInstructionSteps(instructionSteps) };
    const createsMovement = encoded.type === "EXERCISE" && (encoded.sourceMovementId ?? "").trim().length === 0;
    const finished: SessionDraftExercise = createsMovement ? { ...encoded, sourceMovementId: encoded.id } : encoded;
    const plan = draft.exercises.some((exercise) => exercise.id === finished.id)
      ? {
          exercises: draft.exercises.map((exercise) => (exercise.id === finished.id ? finished : exercise)),
          losses: [],
          targetCount: 0,
        }
      : settleCircuitMembership(draft, appendActivityAfterLastDisplayed(draft.exercises, finished));
    if (!createsMovement && isPersistedMovementOccurrence(finished, draft.movements)) {
      return { ...plan, movements: draft.movements };
    }
    // Mouvement NOUVEAU du brouillon : son contenu est celui de l'occurrence terminée, partagé par
    // toutes ses occurrences (original et copies), paramètres de chacune inchangés.
    const previous = draft.movements?.[finished.sourceMovementId!];
    const shared = withDraftMovement(
      { ...draft, exercises: plan.exercises },
      draftMovementOf(finished, "NEW", { nextPhaseId: previous?.nextPhaseId, aliases: previous?.aliases }),
    );
    return { ...plan, exercises: shared.exercises, movements: shared.movements };
  }

  function handleTerminer() {
    if (finishingRef.current || local === null) {
      return;
    }
    const plan = planFinish(local);
    if (plan.losses.length > 0) {
      // Annuler : reste sur l'écran, rien n'est ajouté ; `finishingRef` n'est pas engagé.
      setPendingCircuitEntry({ targetCount: plan.targetCount });
      return;
    }
    finishingRef.current = true;
    commitFinished(plan.exercises, plan.movements);
  }

  function commitFinished(nextExercises: readonly SessionDraftExercise[], nextMovements: SessionDraft["movements"]) {
    // PRE-6 (story 3.3, report de la story 1.4) : une occurrence existante dont les séries
    // diffèrent de celles qu'elle avait à l'ouverture perd son entrée de réserve de Circuit (même
    // retrait que sa sortie du Circuit, `exitCircuit`), dans la MÊME mise à jour, fonctionnelle,
    // que les occurrences. Sans entrée de réserve, mise à jour simple inchangée.
    const occurrence = local;
    const seriesChanged =
      occurrence !== null &&
      openedOccurrence !== null &&
      !openedOccurrence.openedParameters.some((opened) => seriesEqual(occurrence.executionParameters, opened));
    const hasReserveEntry =
      occurrence !== null &&
      draft.circuitSeriesReserve !== undefined &&
      Object.prototype.hasOwnProperty.call(draft.circuitSeriesReserve, occurrence.id);
    if (seriesChanged && hasReserveEntry) {
      updateDraft((current) => ({
        exercises: nextExercises,
        ...(nextMovements !== undefined ? { movements: nextMovements } : {}),
        circuitSeriesReserve: exitCircuit(current, occurrence).circuitSeriesReserve,
      }));
    } else {
      updateDraft({ exercises: nextExercises, ...(nextMovements !== undefined ? { movements: nextMovements } : {}) });
    }
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
      // PRE-7 (R-3, C05) : une occurrence dont le Mouvement est NOUVEAU porte le contenu de ce
      // Mouvement, dont la Catégorie et les Zones sont requises à l'enregistrement.
      requireReferences: !isEditingExisting || (local !== null && !isPersistedMovementOccurrence(local, draft.movements)),
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
          inheritedSeriesCount={inheritedSeriesCount}
          phaseStructureLocked={phaseStructureLocked}
          // PRE-7 (A2.2, D-437, MFN-09, MFN/AC28, MFN/AC29) : même seuil que la structure — une
          // occurrence portant une filiation a son contenu (nom, description, médias, Catégorie,
          // Zones) verrouillé, sans crayon ; une création locale non enregistrée reste modifiable,
          // ainsi que sa copie en attente (recette JA, décision de Hermann du 26/10/2026).
          contentLocked={phaseStructureLocked || repriseLocked}
          onNameEndEditing={() => originChoice.proposeFor(value.name)}
          movementSearchAction={
            originChoice.canSearch
              ? { label: strings.screens.activities.editor.movementSearch.open, onPress: originChoice.openSearch }
              : null
          }
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

      {pendingCircuitEntry !== null ? (
        <CircuitEntryConfirmModal
          kind="ADD"
          seriesCount={pendingCircuitEntry.targetCount}
          exerciseCount={1}
          onCancel={() => setPendingCircuitEntry(null)}
          onConfirm={() => {
            setPendingCircuitEntry(null);
            if (finishingRef.current || local === null) {
              return;
            }
            // Ajout rejoué sur le brouillon courant (aucun instantané rejoué).
            finishingRef.current = true;
            const replayed = planFinish(local);
            commitFinished(replayed.exercises, replayed.movements);
          }}
        />
      ) : null}

      {originChoice.overlays}
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
  editMovementAction: {
    width: EDIT_MOVEMENT_ACTION.width,
    height: EDIT_MOVEMENT_ACTION.height,
    borderRadius: EDIT_MOVEMENT_ACTION.radius,
    backgroundColor: EDIT_MOVEMENT_ACTION.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
