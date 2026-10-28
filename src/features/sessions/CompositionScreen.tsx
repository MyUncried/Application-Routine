import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { isBilateral } from "@/domain/activities/ExecutionParameters";
import { DuplicateMovementNameError } from "@/domain/activities/MovementRepository";
import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import { DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS } from "@/domain/preferences/Profile";
import { DEFAULT_TOUR_REPEAT_COUNT, SESSION_BOUNDARY_SECONDS_MAX } from "@/domain/sessions/defaults";
import { DEFAULT_SESSION_COLOR, type StructuralPosition } from "@/domain/sessions/Session";
import {
  DEFAULT_CIRCUIT_NATURE,
  applyNatureChange,
  circuitVolumes,
  circuitCountOutcome,
  prepareNatureChange,
  type CircuitCountResolution,
  type CircuitLoss,
  type CircuitNature,
} from "@/domain/sessions/circuit";
import { copyCircuitReserveEntry, settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import {
  STRUCTURAL_ZONES,
  duplicateOccurrence,
  moveOccurrenceInSequence,
  moveStopPoint,
  occurrenceDisplayName,
  removeOccurrenceOutcome,
  stepOccurrence,
  type CompositionOutcome,
  type CompositionState,
  type OccurrenceStepDirection,
} from "@/domain/sessions/composition";
import {
  EMPTY_PLACEMENT_DRAFT,
  applyPlacementDraft,
  deselectPlacementRecovery,
  placementConfirmation,
  placementRecoverySeconds,
  placementSlots,
  selectPlacementRecovery,
  isPlacementStopPointAdded,
  isPlacementStopPointRemoved,
  togglePlacementStopPointOutcome,
  togglePlacementStopPointRemoval,
  type PlacementContext,
  type PlacementDraft,
  type PlacementSlot,
  type PlacementStopPointOutcome,
  type PlacementStopPointSlot,
} from "@/domain/sessions/placement";
import {
  STOP_POINT_SCOPE_ORDER,
  isSequenceSeparator,
  isStopPointProposable,
  occurrenceCountInScope,
  positionInSequence,
  scopeSequence,
  stopPointKey,
  type SequenceItem,
  type StopPoint,
  type StopPointLocation,
  type TourBoundaryChoice,
} from "@/domain/sessions/StopPoint";
import {
  isSessionDraftDirty,
  sessionDraftsEqual,
  toCreateSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { firstMediaPreviewSource } from "@/features/activities/MediaPreview";
import { useCategoriesReferential } from "@/features/activities/useCategoriesReferential";
import { useMovementLevelPositions } from "@/features/activities/useMovementLevelPositions";
import { withLevelSuffix } from "@/features/activities/movementChoicePresentation";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { LabelPickerModal } from "@/features/reference-data/LabelPickerModal";
import { useBodyZonesReferentialVersion } from "@/features/reference-data/ReferentialServiceContext";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { CircuitEntryConfirmModal } from "@/features/sessions/CircuitEntryConfirmModal";
import { CIRCUIT_HEADER_HEIGHT, CircuitHeader } from "@/features/sessions/CircuitHeader";
import { CIRCUIT_NATURE_PANEL_GAP, CircuitNaturePanel } from "@/features/sessions/CircuitNatureMenu";
import { CircuitVolumesSheet } from "@/features/sessions/CircuitVolumesSheet";
import {
  clampSwipeTranslateX,
  isTap,
  LONG_PRESS_DELAY_MS,
  NO_DRAG_SHIFTS,
  resolveDragShifts,
  resolveDropSettleOffset,
  resolveDropTarget,
  resolveInsertionPoses,
  resolveRemovalShifts,
  shouldRevealAfterSwipe,
  type ActivityRowLayout,
  type CompositionDragLayout,
  type DragShifts,
  type DropTarget,
  type StepDirection,
} from "@/features/sessions/compositionGesture";
import {
  isDisplayableRecovery,
  OccurrenceRecovery,
  STOP_POINT_LINE_HEIGHT,
  StopPointLine,
} from "@/features/sessions/ActivityRecoveryLine";
import { CompositionContextHeader } from "@/features/sessions/CompositionContextHeader";
import {
  formatCompactDuration,
  formatBoundarySecondsValue,
  formatCompositionSessionDuration,
  formatExerciseBodyZones,
  formatOccurrenceAccessibilityLabel,
  formatOccurrenceEstimatedDuration,
  formatOccurrenceSummary,
  isIncompleteSummary,
  resolveOccurrenceCategory,
  type OccurrenceCircuitContext,
} from "@/features/sessions/compositionPresentation";
import {
  OCCURRENCE_CARD_MEDIA,
  OCCURRENCE_CARD_RADIUS,
  OccurrenceCard,
  occurrenceCardHeight,
  occurrenceCardIncompleteSurface,
  occurrenceCardInCircuitSurface,
  occurrenceCardSurface,
  occurrenceRecoveryTouchExtent,
} from "@/features/sessions/OccurrenceCard";
import {
  BOUNDARY_RING_TOP,
  BoundaryRail,
  BoundaryStep,
  RAIL_RING_DIAMETER,
  RailDot,
  RailLink,
  RailRing,
  RailSegment,
  SEQUENCE_GAP,
} from "@/features/sessions/CompositionSequence";
import {
  RAIL_KEYS,
  railRowKey,
  railStopKey,
  resolveRailLinks,
  type RailChainItem,
  type RailGeometry,
  type RailSkippedItem,
  type RailLink as RailLinkGeometry,
} from "@/features/sessions/compositionRail";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { STOP_POINT_CHIP_TOUCH_EXTENT } from "@/features/sessions/StopPointChip";
import { formatPlacementConfirmLabel, PlacementBar } from "@/features/sessions/PlacementBar";
import {
  PlacementRecoveryFrame,
  PlacementStopPointRow,
  type PlacementStopPointRowPoint,
  type PlacementTouchExtent,
} from "@/features/sessions/PlacementLayer";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { TourBoundaryChoiceDialog } from "@/features/sessions/TourBoundaryChoiceDialog";
import { type AnimatedShiftRegistry, type ShiftRelease, useAnimatedShiftRegistry } from "@/features/sessions/useAnimatedShift";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { type DragAutoScroll, useDragAutoScroll } from "@/features/sessions/useDragAutoScroll";
import {
  MOTION_APPEAR_DURATION_MS,
  MOTION_EASING,
  MOTION_FADE_DURATION_MS,
  MOTION_FADE_EASING,
  MOTION_FADE_TO_SLIDE_DELAY_MS,
  MOTION_SHIFT_DURATION_MS,
} from "@/features/sessions/compositionMotion";
import { RECOVERY_WHEEL_VALUES, snapToGrid } from "@/features/sessions/wheelPickerMath";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Champ numérique actif — un seul à la fois (CIR-10) : roulettes des bornes, ou panneau du choix
 * de nature du Circuit (story 3.2,
 * Android / web ; sur iOS le menu natif porte seul son ouverture). PRE-6 story 3.4 : feuille
 * « Volumes du circuit » (`circuitVolumes`), ouverte par l'œil — l'ouvrir referme les autres.
 * PRE-6 story 7.3 (D-442) : le stepper du compte du Circuit est toujours affiché et actif ; il
 * n'est plus un champ « révélé » (ancien `circuitCount`, choix D8 remplacé).
 */
type OverlayKind = "countdown" | "finalPhase" | "circuitNature" | "circuitVolumes";

/**
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-CDBCCFD16078) — chargé une seule fois au sommet de l'écran et transmis
 * jusqu'à `CompositionActivityRow` : jamais `BODY_ZONES`, qui n'est plus
 * l'autorité runtime, y compris en repli (revue indépendante 5930269937) —
 * ce module statique ne reste que la source du seed historique consommée
 * par `migration007`.
 *
 * Correction (device check Hermann, commentaire 5948936550) : l'application
 * réelle rend cet écran HORS de `<SQLiteProvider>` (architecture T01-S05,
 * préservée) — un accès direct à `useSQLiteContext` levait donc TOUJOURS en
 * production, dégradant silencieusement vers un référentiel VIDE. Le
 * référentiel transite désormais par `ActivityDefinitionService.listBodyZones`
 * (même connexion SQLite que `SessionService`, construite par
 * `SessionServiceProvider`), accessible ici via `useActivityDefinitionService()`.
 */
function useBodyZonesReferential(
  activityDefinitionService: ActivityDefinitionService,
  // R6 (CE-UI-09 L2784, L2816, L2840) : incrémenté (`useBodyZonesReferentialVersion`,
  // `ReferentialServiceContext`) après une création, un renommage ou une
  // suppression de Zone depuis la modale de l'éditeur d'Exercice (écran
  // distinct) — relit ce référentiel sans fermer ni rouvrir l'Exercice ni
  // remonter la Composition. Même patron exact que `refreshToken` de
  // `useLabelsReferential` ci-dessous.
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
 * Référentiel persistant des Étiquettes (V2-PRE-1, plan §3.3,
 * UI-74BBA70BF09F-AC8AD824374E8) — utilisé UNIQUEMENT pour dériver, en
 * LECTURE SEULE, la couleur affichée de la Séance depuis son Étiquette
 * éventuelle (`draft.labelId`) — jamais pour écrire `draft.color`, retiré du
 * contrat cible.
 *
 * Correction (revue indépendante 5950755410, même famille que le défaut des
 * Zones corporelles, device check Hermann 5948936550) : l'application réelle
 * rend cet écran HORS de `<SQLiteProvider>` (architecture T01-S05,
 * préservée) — un accès direct à `useSQLiteContext`/`SqliteLabelRepository`
 * levait/dégradait donc TOUJOURS vers un référentiel VIDE en production,
 * qu'une Séance Étiquetée affichait systématiquement la présentation
 * neutre. Le référentiel transite désormais par
 * `ActivityDefinitionService.listLabels` (même connexion SQLite que
 * `SessionService`, construite par `SessionServiceProvider`), accessible ici
 * via `useActivityDefinitionService()` — même patron exact que
 * `useBodyZonesReferential` ci-dessus.
 */
function useLabelsReferential(
  activityDefinitionService: ActivityDefinitionService,
  // V2-PRE-2 (plan §6.5, D2/D4) : incrémenté à la fermeture de
  // `LabelPickerModal` pour relire ce référentiel d'affichage après une
  // création/un renommage/un retrait éventuel — jamais pour écrire quoi que
  // ce soit, cette dérivation reste en lecture seule.
  refreshToken: number = 0,
): readonly Label[] {
  const [labels, setLabels] = useState<readonly Label[]>([]);
  useEffect(() => {
    let cancelled = false;
    activityDefinitionService.listLabels().then(
      (result) => {
        if (!cancelled) {
          setLabels(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Étiquettes.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, refreshToken]);
  return labels;
}

/**
 * Recette 3 (T-49, EXT-R3-2) : valeurs reprises de la zone de contexte de l’éditeur
 * (`ActivityEditorForm.tsx`, D-348) — halo figé « Halo blanc — bouton Annuler »
 * (5752:4044, Ø 59,28) et fondu figé sur les 20 % inférieurs, en couches
 * superposées dont l’opacité cumulée suit la rampe 0 → 1.
 */
const BACK_HALO_DIAMETER = 59.28;
const CONTEXT_BAND_FADE_SHARE = "20%";
const CONTEXT_BAND_FADE_LAYER_COUNT = 12;
const CONTEXT_BAND_FADE_LAYERS = Array.from({ length: CONTEXT_BAND_FADE_LAYER_COUNT }, (_, index) => {
  const before = index / CONTEXT_BAND_FADE_LAYER_COUNT;
  const after = (index + 1) / CONTEXT_BAND_FADE_LAYER_COUNT;
  return {
    top: `${((index / CONTEXT_BAND_FADE_LAYER_COUNT) * 100).toFixed(4)}%` as `${number}%`,
    opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)),
  };
});

const EMPTY_STOP_POINTS: CompositionState["stopPoints"] = [];

/**
 * PRE-6 (story 1.2) : occurrences et Points d'arrêt du brouillon, opérés ensemble. Story 7.1
 * (D-442) : avec N du Circuit, contexte des règles de début et de fin de Tour.
 */
function compositionStateOf(
  exercises: SessionDraft["exercises"],
  stopPoints: SessionDraft["stopPoints"],
  tourRepeatCount: SessionDraft["tourRepeatCount"],
): CompositionState {
  return { exercises, stopPoints: stopPoints ?? EMPTY_STOP_POINTS, ...(tourRepeatCount !== undefined ? { tourRepeatCount } : {}) };
}

/**
 * PRE-6 story 7.2 (D-442) : rangée de l'emplacement LIBRE de tête de Circuit en placement — élément de
 * la séquence affichée (rail, écarts, mesures) qui n'est pas un point du brouillon. Identifiant
 * réservé, jamais un UUID.
 */
const CIRCUIT_HEAD_SLOT_ID = "placement-circuit-head";
const CIRCUIT_HEAD_SLOT_POINT: StopPoint = { id: CIRCUIT_HEAD_SLOT_ID, scope: "IN_TOUR", position: 0 };

/** PRE-6 story 6.2 (D-441) : élément affiché d'une zone — une occurrence ou un Point d'arrêt. */
type ZoneItem = SequenceItem<SessionDraftExercise, StopPoint>;
type ZoneItems = Readonly<Record<StructuralPosition, readonly ZoneItem[]>>;

/** Préfixe des clés de rail des rangées de points (`railStopKey`). */
const RAIL_STOP_KEY_PREFIX = railStopKey("");
const RAIL_ROW_KEY_PREFIX = railRowKey("");

/** Clé d'un élément de zone : sa clé de rail (mesures, décalages, chaîne du rail). */
function zoneItemKey(item: ZoneItem): string {
  return item.kind === "OCCURRENCE" ? railRowKey(item.occurrence.id) : railStopKey(item.point.id);
}

function railChainItemOf(item: ZoneItem): RailChainItem {
  return item.kind === "OCCURRENCE" ? item.occurrence.id : { stopPointId: item.point.id };
}

/** Identifiant du point d'une clé de rangée de point, sinon `null`. */
function stopPointIdOfKey(key: string): string | null {
  return key.startsWith(RAIL_STOP_KEY_PREFIX) ? key.slice(RAIL_STOP_KEY_PREFIX.length) : null;
}

/** Identifiant de l'occurrence d'une clé de carte. */
function occurrenceIdOfKey(key: string): string {
  return key.startsWith(RAIL_ROW_KEY_PREFIX) ? key.slice(RAIL_ROW_KEY_PREFIX.length) : key;
}

/** L'élément d'une clé existe-t-il encore dans le brouillon ? */
function sequenceItemExists(draft: SessionDraft, key: string): boolean {
  const stopPointId = stopPointIdOfKey(key);
  return stopPointId !== null
    ? (draft.stopPoints ?? []).some((point) => point.id === stopPointId)
    : draft.exercises.some((exercise) => exercise.id === occurrenceIdOfKey(key));
}

/**
 * PRE-6 story 6.2 : éléments affichés de chaque zone. Hors placement (`placementRowStopPointIds =
 * null`) : séquence mêlée du Domaine (`scopeSequence`, D-441 ; ses règles de bornage et d'ordre).
 * En placement : occurrences, et — story 6.3 (D-441, R3) — les seuls points existants qu'aucun
 * emplacement ne porte (`UNOFFERED_STOP_POINT` : tête de Circuit, hors bornes…), rangées
 * autonomes à leur place dans la séquence mêlée, pour pouvoir être désélectionnés ; les autres
 * points sont portés par les emplacements (story 5.3).
 */
function displayedZoneItems(
  exercises: readonly SessionDraftExercise[],
  stopPoints: readonly StopPoint[],
  placementRowStopPointIds: ReadonlySet<string> | null,
  withCircuitHeadSlot = false,
): ZoneItems {
  const kept =
    placementRowStopPointIds === null ? stopPoints : stopPoints.filter((point) => placementRowStopPointIds.has(point.id));
  // Story 7.2 (D-442) : en placement, l'emplacement libre de tête de Circuit est une rangée en tête du
  // Circuit (`CIRCUIT_HEAD_SLOT_POINT`, jamais un point du brouillon).
  const shown = withCircuitHeadSlot ? [...kept, CIRCUIT_HEAD_SLOT_POINT] : kept;
  const itemsOf = (zone: StructuralPosition): readonly ZoneItem[] => scopeSequence(exercises, shown, zone);
  return { BEFORE_TOUR: itemsOf("BEFORE_TOUR"), IN_TOUR: itemsOf("IN_TOUR"), AFTER_TOUR: itemsOf("AFTER_TOUR") };
}

/**
 * PRE-6 story 6.2 (R2) : emplacement `(scope, position)` d'un point déposé au rang `index` de la
 * séquence mêlée de `zone`, le point lui-même retiré (même compte que le glisser d'une carte).
 */
function stopPointLocationAt(items: readonly ZoneItem[], stopPointId: string, zone: StructuralPosition, index: number): StopPointLocation {
  const others = items.filter((item) => !(item.kind === "STOP_POINT" && item.point.id === stopPointId));
  return { scope: zone, position: positionInSequence(others, index) };
}

/**
 * PRE-6 story 6.2 (revue) : emplacement AFFICHÉ d'un point — celui où `scopeSequence` le dessine :
 * une position héritée hors bornes ou non entière est ramenée à la borne la plus proche (`0..n`,
 * partie entière ; non finie : fin de portée). Sert de point de départ des pas et de référence du
 * « même emplacement » au dépôt.
 */
function displayedStopPointLocation(exercises: readonly SessionDraftExercise[], point: StopPointLocation): StopPointLocation {
  const count = occurrenceCountInScope(exercises, point.scope);
  const raw = Number.isFinite(point.position) ? Math.trunc(point.position) : count;
  return { scope: point.scope, position: Math.max(0, Math.min(raw, count)) };
}

function sameLocation(a: StopPointLocation, b: StopPointLocation): boolean {
  return a.scope === b.scope && a.position === b.position;
}

/**
 * PRE-6 story 6.2 : « Monter » / « Descendre » d'un point — premier emplacement, dans l'ordre
 * structurel des emplacements (`(scope, 0..n)`, portées dans l'ordre) à partir de l'emplacement
 * affiché, que le Domaine ACCEPTE (`moveStopPoint` : proposable, libre, non consécutif) ; le point
 * peut donc en franchir un autre, comme au glisser. Rend l'état produit, ou `null` (action absente).
 * Story 7.2 (D-442) : le premier emplacement atteint qui demande un choix de Tour (`CHOICE_REQUIRED`)
 * offre le pas ; son action ouvre le dialogue « Début de tour / Fin de tour ».
 */
type StopPointStep =
  | { readonly status: "APPLIED"; readonly state: CompositionState }
  | { readonly status: "CHOICE_REQUIRED"; readonly location: StopPointLocation };

function stopPointStepOutcome(
  state: CompositionState,
  stopPointId: string,
  direction: OccurrenceStepDirection,
): StopPointStep | null {
  const point = state.stopPoints.find((candidate) => candidate.id === stopPointId);
  if (point === undefined) return null;
  const current = displayedStopPointLocation(state.exercises, point);
  const locations = STOP_POINT_SCOPE_ORDER.flatMap((scope) =>
    Array.from({ length: occurrenceCountInScope(state.exercises, scope) + 1 }, (_, position) => ({ scope, position })),
  );
  const index = locations.findIndex((location) => sameLocation(location, current));
  if (index === -1) return null;
  const step = direction === "UP" ? -1 : 1;
  for (let candidate = index + step; candidate >= 0 && candidate < locations.length; candidate += step) {
    const location = locations[candidate]!;
    if (!isStopPointProposable(state.exercises, location, state)) continue;
    const outcome = moveStopPoint(state, stopPointId, location);
    // Story 7.1 (revue, D-442) : un choix de Tour requis à l'emplacement voisin arrête la recherche
    // plutôt que de le franchir en silence ; story 7.2 : le pas est offert et demande le choix.
    if (outcome.status === "CHOICE_REQUIRED") return { status: "CHOICE_REQUIRED", location };
    if (outcome.status === "APPLIED" && outcome.state !== state) return { status: "APPLIED", state: outcome.state };
  }
  return null;
}

/** Story 7.2 (D-442) : annonce discrète des Points d'arrêt retirés sans message (singulier / pluriel). */
function removedStopPointsAnnouncement(count: number): string {
  const t = strings.screens.composition.stopPointsRemovedAnnouncement;
  return count === 1 ? t.singular : t.plural.replace("{n}", String(count));
}

/**
 * Story 7.2 (D-442, ch13 CE-T03-08 L1498) : opération suspendue au choix « Début de tour / Fin de
 * tour » — rejouée sur l'état COURANT avec la résolution choisie (« Annuler » : rien ne change).
 * `fromStep` : action accessible « Monter » / « Descendre » (le focus suit l'élément).
 */
type TourChoiceRequest =
  | { readonly kind: "OCCURRENCE_MOVE"; readonly move: OccurrenceMove; readonly fromStep: boolean }
  | {
      readonly kind: "STOP_POINT_MOVE";
      readonly stopPointId: string;
      readonly location: StopPointLocation;
      readonly fromStep: boolean;
    }
  | { readonly kind: "PLACEMENT_STOP_POINT"; readonly location: StopPointLocation }
  | { readonly kind: "PLACEMENT_EXISTING_STOP_POINT"; readonly stopPointId: string }
  | { readonly kind: "CIRCUIT_COUNT"; readonly count: number }
  // Story 7.5 (D-442 amendée) : suppression qui créerait un conflit de Tour.
  | { readonly kind: "OCCURRENCE_DELETE"; readonly activityId: string };

/**
 * Story 7.2 (D-442) : resélection en placement du point existant `stopPointId`, refusée par
 * `togglePlacementStopPointRemoval` parce qu'elle créerait un conflit de Tour avec un AJOUT — le
 * choix requis (conserver le point, ou l'ajout) ; `null` si la resélection n'en demande pas.
 */
function placementReselectionChoice(
  placement: PlacementDraft,
  stopPointId: string,
  context: PlacementContext,
): Extract<PlacementStopPointOutcome, { status: "CHOICE_REQUIRED" }> | null {
  if (!isPlacementStopPointRemoved(placement, stopPointId)) return null;
  const point = (context.stopPoints ?? EMPTY_STOP_POINTS).find((candidate) => candidate.id === stopPointId);
  if (point === undefined) return null;
  const outcome = togglePlacementStopPointOutcome(placement, point, context);
  return outcome.status === "CHOICE_REQUIRED" &&
    (outcome.conflict.headStopPointId === stopPointId || outcome.conflict.tailStopPointId === stopPointId)
    ? outcome
    : null;
}

/**
 * PRE-6 story 7.5 (D-442 amendée, recette J6 d-9) : résultat de la suppression de l'occurrence
 * `activityId` sur `draft` — tolérante (`removeOccurrenceOutcome`) : le patch du brouillon (réserve de
 * Circuit comprise) et les Points d'arrêt retirés ; `"CHOICE"` si un conflit de Tour demande le choix
 * « Début de tour / Fin de tour » (`choice` le tranche) ; `null` si rien n'est supprimé.
 */
function deletionResult(
  draft: SessionDraft,
  activityId: string,
  choice: TourBoundaryChoice | null,
): { readonly patch: Partial<SessionDraft>; readonly removed: readonly string[] } | "CHOICE" | null {
  const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
  const outcome = removeOccurrenceOutcome(state, activityId);
  let next: CompositionState;
  let removed: readonly string[];
  if (outcome.status === "APPLIED") {
    next = outcome.state;
    removed = outcome.removedStopPointIds;
  } else if (outcome.status === "CHOICE_REQUIRED") {
    if (choice === null) return "CHOICE";
    next = outcome.resolutions[choice].state;
    removed = outcome.resolutions[choice].removedStopPointIds;
  } else {
    return null;
  }
  // PRE-6 (story 2.3) : la réserve de Circuit de l'occurrence retirée part avec elle.
  const settled = settleCircuitMembership(draft, next.exercises);
  return { patch: { ...compositionPatch(state, next), ...settled.reservePatch }, removed };
}

/**
 * PRE-6 story 7.5 (recette J6 d-9) : suppression animée en cours — la carte (et les points que la
 * suppression retire) s'efface en fondu (`opacity`), puis ce qui suit glisse pour combler la place
 * (`resolveRemovalShifts` sur `layout`, registre des translations) ; le brouillon n'est écrit qu'à la
 * fin (`commit`, idempotent, aussi appelé pour terminer aussitôt).
 */
type PendingDeletion = {
  readonly key: string;
  readonly fadingKeys: ReadonlySet<string>;
  readonly opacity: Animated.Value;
  readonly layout: CompositionDragLayout;
  readonly phase: "fade" | "slide";
  readonly commit: () => void;
  /** Revue 7.6 : fondu et glissement terminés (commun aux phases ; l'écriture attend les deux). */
  readonly progress: { fadeDone: boolean; slideDone: boolean };
};

/**
 * PRE-6 story 7.5 : durée du fondu de la carte supprimée. Story 7.6 : celle du jeu de mouvements
 * partagé (`compositionMotion.ts`) ; le glissement commence pendant le fondu.
 */
export const DELETE_FADE_DURATION_MS = MOTION_FADE_DURATION_MS;

/** PRE-6 story 6.2 (revue) : focus d'accessibilité demandé sur un élément (clé de rail), et annonce. */
type ItemFocusRequest = { readonly key: string; readonly token: number; readonly announcement?: string };

/** Patch du brouillon : les points ne sont écrits que s'ils ont changé (un brouillon sans point reste sans champ `stopPoints`). */
function compositionPatch(previous: CompositionState, next: CompositionState): Partial<SessionDraft> {
  return {
    exercises: next.exercises,
    ...(next.stopPoints !== previous.stopPoints ? { stopPoints: next.stopPoints } : {}),
  };
}

/**
 * PRE-6 (story 2.3) : intention de déplacement d'une occurrence. PRE-6 story 6.2 (D-441) : glisser
 * — `index` est le rang dans la séquence MÊLÉE de `zone` (occurrences et points), source retirée
 * (`moveOccurrenceInSequence`) ; « Monter » / « Descendre » — échange avec l'élément voisin
 * (`stepOccurrence`). Story 7.2 (D-442) : `tourChoice` — résolution choisie dans le dialogue
 * « Début de tour / Fin de tour », appliquée si le déplacement demande ce choix.
 */
type OccurrenceMove = (
  | { readonly activityId: string; readonly zone: StructuralPosition; readonly index: number }
  | { readonly activityId: string; readonly direction: OccurrenceStepDirection }
) & { readonly tourChoice?: TourBoundaryChoice };

/** Déplacement en attente de confirmation de perte, avec le N affiché par le dialogue. */
type PendingOccurrenceMove = OccurrenceMove & {
  readonly targetCount: number;
  /** Revue 7.2 : pas « Monter » / « Descendre » — focus de la carte avec l'annonce des points retirés. */
  readonly focusKey?: string;
};

/**
 * Plan d'un déplacement sur `draft` : correctif du brouillon (occurrences adaptées au Circuit,
 * points, réserve), pertes et N du Circuit, et — story 7.2 (D-442) — points retirés sans message par
 * le déplacement tolérant ; `CHOICE_REQUIRED` si le déplacement créerait un conflit de Tour et
 * qu'aucun `tourChoice` n'est fourni ; `null` si le Domaine refuse le déplacement ou s'il ne change
 * rien.
 */
type OccurrenceMovePlan =
  | {
      readonly status: "PLAN";
      readonly patch: Partial<SessionDraft>;
      readonly losses: readonly CircuitLoss[];
      readonly targetCount: number;
      readonly removedStopPointIds: readonly string[];
    }
  | { readonly status: "CHOICE_REQUIRED" };

function planOccurrenceMove(draft: SessionDraft, move: OccurrenceMove): OccurrenceMovePlan | null {
  const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
  const outcome =
    "direction" in move
      ? stepOccurrence(state, move.activityId, move.direction)
      : moveOccurrenceInSequence(state, move.activityId, move.zone, move.index);
  let next: CompositionState;
  let removedStopPointIds: readonly string[];
  if (outcome.status === "CHOICE_REQUIRED") {
    if (move.tourChoice === undefined) return { status: "CHOICE_REQUIRED" };
    const resolution = outcome.resolutions[move.tourChoice];
    next = resolution.state;
    removedStopPointIds = resolution.removedStopPointIds;
  } else if (outcome.status === "APPLIED" && outcome.state !== state) {
    next = outcome.state;
    removedStopPointIds = outcome.removedStopPointIds;
  } else {
    return null;
  }
  const settled = settleCircuitMembership(draft, next.exercises);
  return {
    status: "PLAN",
    patch: {
      ...compositionPatch(state, { exercises: settled.exercises, stopPoints: next.stopPoints }),
      ...settled.reservePatch,
    },
    losses: settled.losses,
    targetCount: settled.targetCount,
    removedStopPointIds,
  };
}

export type CompositionScreenProps = {
  /**
   * Identifiant de la Séance ouverte en MODIFICATION, tel que porté par la
   * route (`app/(creation)/composition.tsx`, paramètre `sessionId`) —
   * `null`/omis en création.
   *
   * **Correction non-flash (LOT_3_OF_3)** : cette information doit être
   * connue de l'écran DÈS SON PREMIER RENDU, donc passée en prop par la
   * route plutôt que déduite de `editStatus`. La réhydratation est
   * déclenchée par un `useEffect` (elle ne peut pas l'être autrement :
   * c'est une lecture asynchrone), et un effet s'exécute APRÈS le premier
   * commit — `editStatus` valait donc encore `"creating"` pendant ce
   * premier rendu, qui affichait le formulaire de création et ses valeurs
   * par défaut (nom vide, `00 min 10 s`/`00 min 05 s`, `0 activité · 0
   * min`) le temps d'une frame, avant d'être remplacé par l'état de
   * chargement. La présence de `sessionId` suffit à exclure
   * SYNCHRONIQUEMENT ce rendu (voir `editState` ci-dessous) — aucun effet,
   * aucun état intermédiaire, aucune frame de création possible.
   */
  readonly sessionId?: string | null;
};

/**
 * Écran `Composition d'une séance` (T01-S07, docs §06 Écran 3 ; corrections
 * de conformité — audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * instruction Codex de correction autonome ; consolidation Foundation —
 * `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`,
 * 2026-09-03 ; correction cumulative post contre-recette iPhone —
 * `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE CORRECTION`,
 * 2026-09-03, identifiants `C-01/C-02/T-01…T-05/A-01`) ; REWORK06
 * (`[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA
 * ROULETTE + VERROU DE CAPITALISATION`, 2026-09-04) — Header, zone Context
 * et zone Bottom Action sont désormais une **BASELINE GELÉE** (validation
 * iPhone utilisateur `CONFORME`) : conservées inchangées ce cycle, toute
 * régression de leur position est interdite (voir `.github/
 * AI_ORCHESTRATION.md`, « Conservation des acquis / Change Control »).
 *
 * Le brouillon vient de `SessionDraftProvider` (monté par
 * `app/(creation)/_layout.tsx`, au-dessus de cet écran) — cette route ne
 * connaît ni SQLite ni `SessionService` : aucun enregistrement n'a lieu
 * avant T01-S09.
 *
 * Un seul sélecteur intégré ouvert à la fois (couleur, Compte à rebours,
 * Fin de séance) — état `openOverlay` unique (plan §5).
 *
 * **CMP-01/Racine non interactive + backdrop dédié** (correction
 * consolidée) : l'écran entier n'est plus un `Pressable` racine (défaut
 * D-03 identifié — un `Pressable` plein écran intercepte le geste avant
 * même qu'il n'atteigne un contrôle imbriqué, y compris parfois le
 * contrôle qu'on cherche justement à ouvrir). La racine (`ScreenShell`) est
 * désormais un simple conteneur.
 *
 * **T01-S09, correction VISUAL (point D)** : ce backdrop dédié
 * (`composition-backdrop`, dismissible au toucher) ne reste actif QUE pour
 * la palette de couleur (`ContextBand`, mécanisme d'ancrage local
 * inchangé). Les roulettes numériques (Compte à rebours, Fin de séance)
 * n'utilisent plus ce mécanisme du tout — elles s'ouvrent dans
 * `WheelPickerOverlay`, une superposition plein écran dédiée dont le voile
 * de fond n'est jamais dismissible au toucher (voir plus bas).
 *
 * `+ Ajouter une activité` (T01-S08) navigue vers l'écran Exercice
 * (`/exercise`) ; celui-ci lit lui-même `draft.exercise` pour déterminer
 * s'il s'agit d'un ajout ou d'une modification — aucun paramètre de route
 * n'est nécessaire. Le modèle `SessionDraft.exercise` restant un unique
 * champ nullable (pas un tableau, hors périmètre T01), le bouton d'ajout
 * est masqué dès qu'un Exercice existe : une ligne récapitulative le
 * remplace, pressable pour rouvrir l'écran en modification.
 *
 * Chaque roulette (Compte à rebours, Fin de séance) s'ouvre désormais dans
 * `WheelPickerOverlay` (T01-S09, correction VISUAL point D) — une
 * superposition plein écran TRANSVERSALE à tout sélecteur numérique à
 * roulette de l'application (voir ce composant), qui remplace l'ancien
 * ancrage local en popover (`position: "absolute"` relatif à la ligne,
 * CE-T01-06/07, historique conservé ci-dessous pour `AnchoredRow`/
 * `PopoverAnchor`, retirés de cet écran par cette correction). La
 * validation de la valeur choisie n'a toujours lieu qu'à la fermeture du
 * sélecteur (démontage de `DurationWheelPicker`) — jamais à chaque cran de
 * défilement (D-06) ; seules ses propres actions Annuler/Confirmer ferment
 * désormais la superposition, jamais un toucher en dehors.
 *
 * `Retour` (correction CE-T01-04, AUD-03) : action visible identique au
 * patron déjà validé sur `ExerciseScreen.tsx` — navigation arrière normale,
 * interceptée par `useCompositionExitGuard` exactement comme le geste
 * système.
 */
export function CompositionScreen({ sessionId = null }: CompositionScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // PRE-6 story 7.10 (D-444) : zone d'action principale fixe (Continuer / barre de placement) ; le
  // corps défilant réserve sa hauteur en fin de défilement.
  const actionZone = usePrimaryActionZone();
  const actionZoneReserveRef = useRef(actionZone.scrollReserve);
  useEffect(() => {
    actionZoneReserveRef.current = actionZone.scrollReserve;
  }, [actionZone.scrollReserve]);
  const { draft, updateDraft, resetDraft, editStatus, retryHydration, hydratedBaseline, creationBaseline } =
    useSessionDraft();
  const activityDefinitionService = useActivityDefinitionService();
  const bodyZonesReferentialVersion = useBodyZonesReferentialVersion();
  const bodyZonesReferential = useBodyZonesReferential(
    activityDefinitionService,
    bodyZonesReferentialVersion,
  );
  // PRE-6 (story 2.2) : Catégories des cartes d'occurrence, relues quand l'ensemble des
  // Catégories portées par le brouillon change.
  const draftCategoryKey = Array.from(
    new Set(draft.exercises.map((exercise) => exercise.categoryId ?? "")),
  )
    .sort()
    .join("|");
  // Retour au premier plan (retour de l'éditeur d'Exercice) : relecture, pour refléter une
  // Catégorie créée, renommée ou recolorée ailleurs.
  const [categoriesFocusToken, setCategoriesFocusToken] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setCategoriesFocusToken((current) => current + 1);
    }, []),
  );
  const categoriesReferential = useCategoriesReferential(
    activityDefinitionService,
    `${draftCategoryKey}#${categoriesFocusToken}`,
  );
  // PRE-7 (R-6, D-445 C06) : positions de niveau (suffixe « - Nn » des cartes), relues au retour au
  // premier plan (niveau ajouté ou réordonné depuis un éditeur).
  const levelPositions = useMovementLevelPositions(activityDefinitionService, categoriesFocusToken);
  // V2-PRE-2 (plan §6.5, CE-T03-16, D2/D4) : la pastille devient interactive
  // (`LabelPickerModal`, auto-alimentée via `ReferentialServiceContext`) —
  // `labelsLoadToken` relit ce référentiel d'AFFICHAGE (`sessionColor`
  // dérivée) après une création/un renommage/un retrait éventuel depuis la
  // modale ; l'affectation elle-même (`draft.labelId`) n'est jamais écrite
  // par les opérations du référentiel, seulement par `onSelect` ci-dessous.
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [labelsLoadToken, setLabelsLoadToken] = useState(0);
  const labelsReferential = useLabelsReferential(activityDefinitionService, labelsLoadToken);
  // V2-PRE-1 (plan §3.3, UI-74BBA70BF09F-AC8AD824374E8) : couleur affichée
  // DÉRIVÉE en lecture seule de l'Étiquette associée au brouillon (jamais une
  // écriture de `draft.color`, retiré du contrat cible) — `DEFAULT_SESSION_COLOR`
  // (présentation neutre déjà définie, `Session.ts`) pour un brouillon sans
  // Étiquette ou dont l'Étiquette n'est pas encore chargée.
  const sessionLabel = labelsReferential.find((label) => label.id === draft.labelId) ?? null;
  const sessionColor = sessionLabel?.color ?? DEFAULT_SESSION_COLOR;
  // Q53 (9), décision de Hermann du 2026-10-18 : aucun avis textuel ni annonce VoiceOver pour
  // une Étiquette retirée encore affectée ; la pastille et la feuille restent inchangées.
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);
  // V2-CAT-01 (plan §4.4) : arbre `Ajouter une activité` — `Une nouvelle
  // activité` / `Une activité existante` / `Annuler`.
  const [isAddActivityTreeOpen, setIsAddActivityTreeOpen] = useState(false);
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 7) : même
  // calcul que `CatalogueCreateOptions.menuTop` — la hauteur RÉELLE cumulée
  // de l'en-tête fixe et de la bande Context, jamais seulement
  // `contextBand.height` (qui plaçait l'arbre ~100 pt trop haut, chevauchant
  // l'en-tête). Recette 3 (D-353) : plus de séparateur entre les deux.
  const addActivityTreeTop =
    insets.top +
    dimensions.header.contentHeight +
    dimensions.contextBand.height +
    spacing[8];
  // T02-S01 : une seule carte à la fois révèle ses actions glissées, et une
  // seule carte à la fois est soulevée (CE-T02-01/CE-T02-02).
  const [revealedActionsId, setRevealedActionsId] = useState<string | null>(null);
  /**
   * Élément soulevé (clé de rail : occurrence `railRowKey`, ou, story 6.2, Point d'arrêt
   * `railStopKey`) ; un seul à la fois (CE-T02-01/CE-T02-02).
   */
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  /** Revue 6.2 : élément soulevé, lu de façon synchrone (deux doigts, deux appuis longs). */
  const draggedKeyRef = useRef<string | null>(null);
  /** Revue 6.2 : focus d'accessibilité après un pas qui change de zone, ou une suppression refusée. */
  const [itemFocusRequest, setItemFocusRequest] = useState<ItemFocusRequest | null>(null);
  const requestItemFocus = useCallback((key: string, announcement?: string) => {
    setItemFocusRequest((current) => ({ key, announcement, token: (current?.token ?? 0) + 1 }));
  }, []);
  /** La demande est consommée par l'élément visé, une fois le focus porté (il peut avoir été remonté). */
  const consumeItemFocus = useCallback((token: number) => {
    setItemFocusRequest((current) => (current !== null && current.token === token ? null : current));
  }, []);
  /**
   * PRE-6 (story 2.3b) : réorganisation animée pendant le glisser, en UN seul état mis à jour par
   * une seule écriture à chaque transition (début, changement d'emplacement, dépôt, annulation) —
   * aucun ordre implicite entre plusieurs `setState`. Voir `DragShiftSession`.
   */
  const [dragSession, setDragSession] = useState<DragShiftSession>(IDLE_DRAG_SESSION);
  /** Story 5.2b : registre des translations, pour le début d'un geste (déclaré plus bas). */
  const shiftRegistryRef = useRef<AnimatedShiftRegistry | null>(null);
  /**
   * Fin de l'aperçu (`endDragSession`). PRE-6 story 7.4 (commentaire 14) : sans animation — une
   * nouvelle disposition est rendue (dépôt appliqué, confirmation, entrée en placement) —, les
   * valeurs JS des translations passent à 0 AVANT les écritures d'état
   * (`AnimatedShiftRegistry.prepareLayoutCommit`) : le rendu de la nouvelle disposition porte des
   * translations nulles, au lieu de celles de l'aperçu remises à 0 seulement après lui (le Circuit
   * agrandi ou rétracté s'affichait avec ses bords encore décalés).
   */
  const finishDragPreview = useCallback((animated: boolean, release: ShiftRelease | null = null) => {
    if (!animated) shiftRegistryRef.current?.prepareLayoutCommit();
    setDragSession((current) => endDragSession(current, animated, release));
  }, []);
  /**
   * PRE-6 story 7.6 (recette J6b : « on a l'impression qu'elle saute dans sa position cible ») : fin
   * d'un aperçu par un déplacement APPLIQUÉ (dépôt, « Confirmer », choix de Tour). Avant, l'élément
   * déposé passait sans transition de l'endroit du lâcher à sa place dans la nouvelle disposition
   * (translation remise à 0 avec elle). Désormais il y est posé à la translation qui le garde sous
   * le lâcher (`pose`, `resolveDropSettleOffset`), puis glisse jusqu'à sa place (retour animé du
   * registre, au premier plan et hors de la chaîne du rail le temps du mouvement, comme le retour
   * d'une dépose refusée) ; les autres éléments, déjà à leur place, ne bougent pas. Sans pose (aucun
   * aperçu relevé) : comme avant.
   */
  const finishAppliedDrop = useCallback((pose: ShiftRelease | null) => {
    // Revue 7.6 : les éléments encore en mouvement achèvent leur chemin seulement si la suite est
    // animée (une pose) ; les bords du Circuit, dont la bande s'étire sur la hauteur relevée au début
    // du geste, sont posés à leur place.
    shiftRegistryRef.current?.prepareLayoutCommit(pose, pose === null ? null : CIRCUIT_EDGE_KEYS);
    setDragSession((current) => endDragSession(current, pose !== null));
  }, []);
  /** Story 7.5 : suppression animée en cours (fondu, puis glissement) ; une seule à la fois. */
  const [deletion, setDeletion] = useState<PendingDeletion | null>(null);
  const deletionRef = useRef<PendingDeletion | null>(null);
  /**
   * PRE-6 story 7.7 (D-443) : copie de Dupliquer en cours d'apparition (fondu lent) ; les éléments
   * suivants glissent pendant ce temps pour lui faire place.
   */
  const [appearance, setAppearance] = useState<{ readonly key: string; readonly opacity: Animated.Value } | null>(null);
  /** Revue 7.7 : apparition en cours, lue de façon synchrone (suppression, seconde copie). */
  const appearanceRef = useRef(appearance);
  useLayoutEffect(() => {
    appearanceRef.current = appearance;
  });
  /** Revue 7.7 : termine aussitôt une apparition en cours (copie pleinement affichée). */
  const finishAppearance = useCallback(() => {
    const current = appearanceRef.current;
    if (current === null) return;
    current.opacity.stopAnimation();
    current.opacity.setValue(1);
    appearanceRef.current = null;
    setAppearance(null);
  }, []);
  /** Story 7.5 : termine aussitôt une suppression animée en cours (brouillon écrit). */
  const flushDeletion = useCallback(() => deletionRef.current?.commit(), []);
  /** Revue 7.5 : dernier brouillon rendu, pour rejouer une suppression à son écriture. */
  const draftRef = useRef(draft);
  useLayoutEffect(() => {
    draftRef.current = draft;
  });
  /**
   * PRE-6 story 7.4 (D-442, commentaire 3) : défilement automatique pendant le glisser — le corps
   * défilant (`composition-body`), commandé par `scrollTo` sans animation à chaque trame.
   */
  const bodyScrollRef = useRef<ScrollView>(null);
  const autoScroll = useDragAutoScroll({
    scrollTo: (offset) => bodyScrollRef.current?.scrollTo({ y: offset, animated: false }),
    measure: (callback) => bodyScrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _width, height) => callback(y, height)),
    // Story 7.10 (D-444) : la zone d'action fixe recouvre le bas du corps — la bande du bas du
    // défilement automatique remonte au haut de cette zone (dégradé compris) ; le décalage maximal
    // reste celui du conteneur entier (la réserve est déjà dans la hauteur du contenu).
    bottomObstruction: () => actionZoneReserveRef.current,
  });
  /** Hauteur mesurée du conteneur du Circuit ; `0` tant qu'il n'est pas mesuré (fond statique). */
  const [circuitMeasuredHeight, setCircuitMeasuredHeight] = useState(0);
  // « Réduire les animations » (D-7) : décalages immédiats.
  const reduceMotion = useReduceMotion();
  // PRE-6 (story 2.3) : déplacement vers un Circuit de Séries en attente de confirmation de perte
  // — correctif du brouillon déjà calculé (adapté à N), appliqué seulement par « Confirmer ».
  const [pendingCircuitEntry, setPendingCircuitEntry] = useState<PendingOccurrenceMove | null>(null);
  /**
   * Story 7.2 (D-442) : choix « Début de tour / Fin de tour » en attente (dialogue natif), et garde
   * synchrone — un seul dialogue à la fois (un maintien du compteur rappelle le changement de N).
   */
  const [pendingTourChoice, setPendingTourChoice] = useState<TourChoiceRequest | null>(null);
  const tourChoicePendingRef = useRef(false);
  // Revue 7.2 : chaque demande monte un nouveau dialogue (clé), jamais une demande sans dialogue.
  const [tourChoiceToken, setTourChoiceToken] = useState(0);
  /** `false` : un choix est déjà en attente — la nouvelle opération est refusée (rien n'est tenu). */
  const openTourChoice = useCallback((request: TourChoiceRequest): boolean => {
    if (tourChoicePendingRef.current) return false;
    tourChoicePendingRef.current = true;
    setTourChoiceToken((current) => current + 1);
    setPendingTourChoice(request);
    return true;
  }, []);
  /**
   * Aperçu EFFECTIF (story 2.3b) : un aperçu périmé est ignoré au rendu — l'occurrence glissée a
   * quitté le brouillon, ou l'aperçu survit sans geste en cours ni dialogue de perte en attente.
   * Ses décalages reviennent alors en douceur (`animated` vaut `true` dans ces états). Dérivé au
   * rendu plutôt que réinitialisé par un effet ; l'état est remplacé au prochain glisser, et une
   * carte démontée pendant son glisser annule le geste (`onDragCancel`), ce qui le vide.
   */
  const storedPreview = dragSession.preview;
  const dragPreview =
    storedPreview !== null &&
    sequenceItemExists(draft, storedPreview.key) &&
    // Story 7.2 : aussi pendant le dialogue « Début de tour / Fin de tour » (élément tenu).
    (draggedKey !== null || pendingCircuitEntry !== null || pendingTourChoice !== null)
      ? storedPreview
      : null;
  // PRE-6 (story 3.2, CE-CIR-02) : conversion Tours → Séries avec perte en attente de confirmation.
  // Le garde-fou `ref` n'applique qu'une conversion, même sur un double appui de « Confirmer ».
  const [pendingNatureChange, setPendingNatureChange] = useState<CircuitNature | null>(null);
  const natureChangeConfirmedRef = useRef(false);
  // Demande de focus sur la pastille, seulement quand l'utilisateur ferme le choix ou le dialogue
  // de perte (jamais à l'ouverture d'un dialogue, au début d'une sortie ni à la perte du focus).
  const [natureFocusRequest, setNatureFocusRequest] = useState(0);
  const requestNatureFocus = useCallback(() => setNatureFocusRequest((current) => current + 1), []);
  // PRE-6 (story 3.4) : demande de focus sur l'œil, à la fermeture de la feuille des volumes.
  const [volumesFocusRequest, setVolumesFocusRequest] = useState(0);
  // PRE-6 story 5.1b (revue) : cibles de focus après le retrait du point « après le Circuit » quand
  // aucune occurrence ne le suit — compteur de l'en-tête du Circuit, à défaut la borne de Fin.
  const circuitCounterRef = useRef<View | null>(null);
  const finalBoundaryRef = useRef<View | null>(null);
  // Feuille montée jusqu'à la fin de sa disparition native (`onDismissed`), pour que le focus ne
  // soit rendu à l'œil qu'une fois la `Modal` réellement fermée.
  const [isVolumesSheetMounted, setIsVolumesSheetMounted] = useState(false);
  // Vrai seulement pour une fermeture par l'utilisateur (X, voile, glisser, retour) : une sortie
  // ou la perte du premier plan referme la feuille sans déplacer le focus.
  const volumesClosedByUserRef = useRef(false);
  // Grille du Domaine recalculée seulement quand le brouillon change (la feuille la mémorise).
  const volumes = useMemo(() => circuitVolumes(draft), [draft]);
  // Android / web : position de l'en-tête dans le conteneur Circuit, pour ancrer le panneau du
  // choix dans le corps défilant (un parent qui le contient entièrement).
  const [circuitHeaderLayout, setCircuitHeaderLayout] = useState<{ y: number; height: number } | null>(null);
  const [circuitSectionTop, setCircuitSectionTop] = useState(0);
  // PRE-6 (story 4.1, AD-43) : mode placement — sous-brouillon LOCAL des ajouts (`null` hors
  // placement). Seul « Confirmer » l'applique au brouillon de séance ; seul « Continuer » persiste
  // (D-388). Occurrence dont la roulette « Durée de récupération » est ouverte.
  const [placement, setPlacement] = useState<PlacementDraft | null>(null);
  // Revue 6.3 : effet du dernier toucher en placement, annoncé après le rendu (voir plus bas) ;
  // `withLabel` : suivi du nouveau libellé de « Confirmer » (ajouts, ch13 L1524).
  const placementAnnouncementRef = useRef<{ readonly text: string; readonly withLabel: boolean } | null>(null);
  /**
   * Story 7.2 (D-442) : roulette « Durée de récupération » d'une zone NON sélectionnée du placement —
   * ouverte sur la durée existante (`seconds`), sinon (`null`) sur le défaut du Profil ; ✓ sélectionne
   * la zone à la durée choisie (`selectPlacementRecovery`), ✕ ne change rien.
   */
  const [recoveryWheel, setRecoveryWheel] = useState<{ readonly occurrenceId: string; readonly seconds: number | null } | null>(
    null,
  );
  // D-307 / RM-209 : défaut de récupération du Profil (30 s initialement), relu à chaque entrée
  // en placement ; sans service Profil, la constante du Domaine. `null` tant qu'il n'est pas
  // résolu : la roulette ne s'ouvre qu'une fois la valeur connue. Une réponse tardive (après la
  // sortie du placement, une nouvelle entrée ou le démontage) est ignorée (`profileRequestRef`).
  const profileService = useContext(ProfileServiceContext);
  const [recoveryDefaultSeconds, setRecoveryDefaultSeconds] = useState<number | null>(null);
  const profileRequestRef = useRef(0);
  // Demande de focus sur « Ajouter un arrêt », à la sortie du placement par Confirmer / Annuler.
  const [addStopFocusRequest, setAddStopFocusRequest] = useState(0);
  /*
   * PRE-6 story 7.2 (D-442, qui remplace sur ce point D-435) : la récupération ne se règle plus hors
   * placement — la roulette de modification, la bulle « Retirer la récupération » et les actions
   * accessibles de la carte (stories 4.2, 5.1) sont retirées ; tout passe par le placement.
   */
  /** Sortie du placement sans mutation : sous-brouillon jeté, roulette fermée, défaut en cours ignoré. */
  const leavePlacement = useCallback(() => {
    setRecoveryWheel(null);
    setPlacement(null);
  }, []);
  // Toute sortie du placement (et le démontage) invalide la lecture du défaut en cours.
  useEffect(() => {
    if (placement !== null) return undefined;
    profileRequestRef.current += 1;
    return undefined;
  }, [placement]);
  useEffect(
    () => () => {
      profileRequestRef.current += 1;
    },
    [],
  );

  // Géométrie mesurée du contenu défilant, nécessaire à la résolution d'une
  // dépose (`compositionGesture.ts`). Conservée en `ref` : elle ne doit
  // JAMAIS provoquer de rendu — la mesurer via un état re-déclencherait
  // `onLayout` en boucle.
  const zoneTopsRef = useRef<Partial<Record<StructuralPosition, number>>>({});
  const rowLayoutsRef = useRef(new Map<string, { top: number; height: number; zone: StructuralPosition }>());
  const tourLayoutRef = useRef<{ top: number; height: number }>({ top: 0, height: 0 });

  // T01-S10 (CE-T01-S10-06) : en MODIFICATION, la garde de sortie compare le
  // brouillon à son état RÉHYDRATÉ (le dialogue d'abandon n'apparaît que si
  // quelque chose a changé) ; en création, V2-PRE-2 (T18) la compare au
  // brouillon RÉELLEMENT créé (valeurs du Profil au moment de la création),
  // jamais aux seules constantes du Domaine si le Profil en diffère.
  // PRE-4, décision Q54 de Hermann (2026-10-18) : l'action finale (« Continuer » depuis PRE-6
  // story 2.1, ex-« Enregistrer la séance ») enregistre depuis la Composition (l'écran « Catégories de la séance », vestige, est supprimé). Le service est
  // lu sans exigence de fournisseur : sans lui, l'enregistrement échoue avec le message D-107.
  const sessionService = useContext(SessionServiceContext);
  // PRE-7 (R-5, D-445 C01 ; report R-3) : `nameTaken` — un nom de mouvement de la Séance pris en base
  // entre la saisie et l'enregistrement (`DuplicateMovementNameError`, écriture concurrente),
  // signalé pour ce qu'il est. Deux créations du brouillon de même nom sont empêchées plus tôt, par
  // le contrôle pendant la saisie et par la validation (`DUPLICATE`).
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error" | "nameTaken">("idle");
  const isSavingRef = useRef(false);
  // Enregistrement réussi : la garde de sortie est levée avant la fermeture (effet ci-dessous),
  // pour que `dismissTo` ne soit jamais intercepté comme un abandon.
  const [hasSaved, setHasSaved] = useState(false);
  // PRE-6 (story 4.1) : pendant le placement, toute sortie est interceptée pour annuler d'abord le
  // placement (ci-dessous), même sur un brouillon inchangé.
  const shouldBlockExit =
    !hasSaved &&
    // Revue 7.5 : une suppression animée en cours n'est pas encore écrite dans le brouillon.
    (deletion !== null ||
      placement !== null ||
      (hydratedBaseline ? !sessionDraftsEqual(draft, hydratedBaseline) : isSessionDraftDirty(draft, creationBaseline)));
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    resetDraft,
  );
  // PRE-6 (story 3.1, RC-4) : le dialogue d'abandon (garde de sortie) referme le choix de nature
  // du Circuit (Android / web) — ajustement pendant le rendu, au changement de `isPendingExit` (patron React
  // « ajuster un état sur un changement de prop », sans effet).
  const [observedPendingExit, setObservedPendingExit] = useState(isPendingExit);
  if (isPendingExit !== observedPendingExit) {
    setObservedPendingExit(isPendingExit);
    // Story 3.4 : la feuille des volumes aussi — jamais deux modales empilées.
    if (isPendingExit && (openOverlay === "circuitNature" || openOverlay === "circuitVolumes")) {
      setOpenOverlay(null);
    }
    // Story 3.2 : la sortie annule une conversion en attente — jamais deux dialogues empilés.
    if (isPendingExit && pendingNatureChange !== null) {
      setPendingNatureChange(null);
    }
    // Story 4.1 : une sortie (retour, X, geste iOS) pendant le placement l'annule d'abord, sans
    // mutation et sans dialogue d'abandon par-dessus la barre ; la sortie elle-même est abandonnée.
    if (isPendingExit && placement !== null) {
      leavePlacement();
      cancelExit();
    }
  }

  useEffect(() => {
    if (!hasSaved) return;
    // V2-CAT-01 (UI-CAT-R-005/006) : la cible est déterministement `Catalogue des séances` /
    // segment `Séances` — `catalogueSegment` est un signal PONCTUEL, consommé une seule fois
    // par `CatalogueScreen` (`useFocusEffect`), jamais persisté.
    router.dismissTo({ pathname: "/", params: { catalogueSegment: "sessions" } });
  }, [hasSaved, router]);

  /**
   * Q54 : enregistrement de la Séance, repris de l'ancien `CategoriesScreen.handleSave` —
   * `updateSession` sur la Séance source d'un brouillon réhydraté (T01-S10, plan §7.3), jamais
   * une seconde Séance ; `createSession` sinon. Un seul enregistrement à la fois. Tout échec
   * (validation résiduelle, `NOT_FOUND`, `ARCHIVED`, technique) : brouillon conservé, écran
   * affiché, message D-107, action réactivée (D-107 / CE-T01-S10-09).
   */
  async function handleSave() {
    // PRE-6 (story 3.1, RC-4) : « Continuer » referme le choix de nature du Circuit.
    closeCircuitNatureMenu();
    // Story 7.5 : pendant une suppression animée, le brouillon n'est pas encore écrit — elle est
    // terminée aussitôt, et l'enregistrement demande un nouveau toucher (choix 7.5).
    if (deletionRef.current !== null) {
      flushDeletion();
      return;
    }
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setSaveState("saving");
    try {
      if (!sessionService) {
        throw new Error("SessionService indisponible.");
      }
      const sourceSessionId = draft.sourceSessionId ?? null;
      const saved =
        sourceSessionId !== null
          ? (await sessionService.updateSession(sourceSessionId, draft)).status === "UPDATED"
          : (await sessionService.createSession(draft)).ok;
      if (!saved) {
        isSavingRef.current = false;
        setSaveState("error");
        return;
      }
      setHasSaved(true);
      resetDraft();
    } catch (error) {
      isSavingRef.current = false;
      if (error instanceof DuplicateMovementNameError) {
        setSaveState("nameTaken");
        return;
      }
      console.error("La séance n'a pas pu être enregistrée.", error);
      setSaveState("error");
    }
  }

  const closeOverlay = useCallback(() => setOpenOverlay(null), []);

  const toggleOverlay = useCallback((kind: OverlayKind) => {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }, []);

  // PRE-6 (story 3.1, RC-4 ; story 3.2) : un toucher ailleurs referme le panneau du choix de nature
  // (Android / web), sans rien appliquer ; une roulette de borne éventuellement ouverte n'est pas
  // concernée. Story 7.3 (D-442) : le stepper du compte, toujours affiché, n'a rien à refermer.
  const closeCircuitNatureMenu = useCallback(() => {
    setOpenOverlay((current) => (current === "circuitNature" ? null : current));
  }, []);
  // Écran quitté (perte du premier plan) : le choix de nature se referme.
  // Story 3.2 : une conversion en attente de confirmation est aussi abandonnée (aucune mutation).
  useFocusEffect(
    useCallback(
      () => () => {
        closeCircuitNatureMenu();
        setPendingNatureChange(null);
        // Story 3.4 : la feuille des volumes se referme aussi (aucune mutation).
        setOpenOverlay((current) => (current === "circuitVolumes" ? null : current));
        // Story 4.1 : le placement est abandonné sans mutation.
        leavePlacement();
        // Story 7.5 : une suppression animée en cours est écrite.
        flushDeletion();
      },
      [closeCircuitNatureMenu, flushDeletion, leavePlacement],
    ),
  );

  /**
   * PRE-6 (story 3.4, CE-CIR-03) : l'œil ouvre « Volumes du circuit » et referme, dans le même
   * geste, le choix de nature (un seul contrôle actif, CIR-10).
   * PRE-6 story 5.1b (revue) : l'œil étant dans la zone de contexte, hors de la liste, il referme
   * aussi les actions glissées révélées ; il n'ouvre rien pendant le glisser d'une carte (il y est
   * aussi désactivé).
   */
  const openCircuitVolumes = useCallback(() => {
    if (draggedKey !== null) return;
    Keyboard.dismiss();
    setRevealedActionsId(null);
    volumesClosedByUserRef.current = false;
    setIsVolumesSheetMounted(true);
    setOpenOverlay("circuitVolumes");
  }, [draggedKey]);
  /**
   * Fermeture (X, voile, glisser, retour) : lecture seule, aucune écriture. Sans effet si la
   * feuille n'est plus ouverte (rappel tardif ou répété).
   */
  const closeCircuitVolumes = useCallback(() => {
    if (openOverlay !== "circuitVolumes") return;
    volumesClosedByUserRef.current = true;
    setOpenOverlay(null);
  }, [openOverlay]);
  /** Disparition native terminée : la feuille est démontée ; focus rendu à l'œil après une fermeture par l'utilisateur. */
  const handleCircuitVolumesDismissed = useCallback(() => {
    setIsVolumesSheetMounted(false);
    if (volumesClosedByUserRef.current) {
      volumesClosedByUserRef.current = false;
      setVolumesFocusRequest((current) => current + 1);
    }
  }, []);
  // Glisser (appui long) ou révéler les actions d'une carte referme aussi le choix de nature.
  const handleRevealActions = useCallback(
    (activityId: string | null) => {
      if (activityId !== null) {
        closeCircuitNatureMenu();
      }
      setRevealedActionsId(activityId);
    },
    [closeCircuitNatureMenu],
  );
  const handleDragStart = useCallback(
    (key: string | null) => {
      if (key !== null) {
        closeCircuitNatureMenu();
        // Story 4.2 : le glisser d'un point referme les actions glissées révélées.
        if (key.startsWith(RAIL_STOP_KEY_PREFIX)) setRevealedActionsId(null);
      }
      // Story 7.4 : fin du geste (dépôt, annulation) — le défilement automatique s'arrête.
      if (key === null) autoScroll.end();
      draggedKeyRef.current = key;
      setDraggedKey(key);
    },
    [autoScroll, closeCircuitNatureMenu],
  );

  /**
   * PRE-6 (story 4.1, AD-43, `8328:29270`) — « Ajouter un arrêt » : entrée en placement sur un
   * sous-brouillon vide. Le choix de nature et les actions glissées se referment ; le défaut de
   * récupération du Profil est relu (valeur courante, D-307).
   */
  const isPlacementActive = placement !== null;
  const enterPlacement = useCallback(() => {
    // Revue 6.2 : aucune entrée en placement pendant le glisser d'une carte ou d'un point.
    if (draggedKeyRef.current !== null) return;
    // Story 7.5 : une suppression animée en cours est écrite d'abord.
    flushDeletion();
    Keyboard.dismiss();
    // Toute surface ouverte se referme, comme à la perte du premier plan : roulettes des bornes,
    // compteur et choix de nature, feuille des volumes, dialogues en attente, arbre d'ajout.
    setOpenOverlay(null);
    setPendingNatureChange(null);
    setPendingCircuitEntry(null);
    // Story 5.2b : un aperçu conservé pour le dialogue de perte, ou un retour en cours, se termine
    // aussitôt (translations posées à 0 sans animation).
    finishDragPreview(false);
    setIsAddActivityTreeOpen(false);
    setRevealedActionsId(null);
    setRecoveryWheel(null);
    setPlacement(EMPTY_PLACEMENT_DRAFT);
    profileRequestRef.current += 1;
    const request = profileRequestRef.current;
    if (!profileService) {
      setRecoveryDefaultSeconds(DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS);
      return;
    }
    setRecoveryDefaultSeconds(null);
    profileService.getProfile().then(
      (profile) => {
        if (profileRequestRef.current === request) setRecoveryDefaultSeconds(profile.postActivityRecoverySecondsDefault);
      },
      () => {
        if (profileRequestRef.current === request) setRecoveryDefaultSeconds(DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS);
      },
    );
  }, [finishDragPreview, flushDeletion, profileService]);
  /** « Annuler » (et retour système) : l'état d'entrée est restitué, sans aucune mutation. */
  const cancelPlacement = useCallback(() => {
    leavePlacement();
    setAddStopFocusRequest((current) => current + 1);
  }, [leavePlacement]);
  /**
   * PRE-6 story 6.3 (D-441, RM-251) : composition sur laquelle se jugent les bascules de point et
   * l'applicabilité du sous-brouillon — toujours fournie au Domaine (`togglePlacementStopPoint`,
   * `placementConfirmation`, `placementSlots`) : la forme historique sans contexte n'est plus appelée.
   */
  const placementContext = useMemo<PlacementContext>(
    () => ({ exercises: draft.exercises, stopPoints: draft.stopPoints ?? EMPTY_STOP_POINTS, tourRepeatCount: draft.tourRepeatCount }),
    [draft.exercises, draft.stopPoints, draft.tourRepeatCount],
  );
  /** Story 6.3 : nature de « Confirmer » (libellé, disponibilité) ; `null` hors placement. */
  const confirmation = useMemo(
    () => (placement === null ? null : placementConfirmation(placement, placementContext)),
    [placement, placementContext],
  );
  /**
   * « Confirmer » : une seule mise à jour fonctionnelle du brouillon (`postActivityRecoverySeconds`
   * et `stopPoints`, `applyPlacementDraft` : ajouts, modifications de durée et — story 6.3, D-441 —
   * retraits programmés, en une fois, sans point consécutif), puis sortie du placement. Disponible
   * dès qu'un changement est applicable (`placementConfirmation` ≠ `NONE`). Identifiants des
   * points tirés hors du calcul d'état.
   */
  const confirmPlacement = useCallback(() => {
    if (placement === null || confirmation === null || confirmation.kind === "NONE") return;
    const applied = placement;
    // Rien d'applicable sur le brouillon courant (même brouillon rendu) : aucune mise à jour.
    const preview = applyPlacementDraft(draft, applied, () => "");
    if (preview !== draft) {
      const stopPointIds = applied.stopPoints.map(() => Crypto.randomUUID());
      updateDraft((current) => {
        let next = 0;
        return applyPlacementDraft(current, applied, () => stopPointIds[next++] ?? Crypto.randomUUID());
      });
    }
    leavePlacement();
    // Revue 6.3 : si « Ajouter un arrêt » devient indisponible (dernier point retiré sans autre
    // ajout possible), le focus va à la première carte plutôt qu'à un bouton désactivé.
    const first = STOP_POINT_SCOPE_ORDER.flatMap((scope) =>
      preview.exercises.filter((exercise) => exercise.structuralPosition === scope),
    )[0];
    if (placementOfferOf(placementSlots(preview.exercises, preview.stopPoints ?? EMPTY_STOP_POINTS, EMPTY_PLACEMENT_DRAFT, preview)).any || first === undefined) {
      setAddStopFocusRequest((current) => current + 1);
    } else {
      requestItemFocus(railRowKey(first.id));
    }
  }, [confirmation, draft, leavePlacement, placement, requestItemFocus, updateDraft]);
  /**
   * PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1496) : toucher une zone de récupération — sélectionnée
   * (ajout, ou récupération existante, 0 comprise, conservée) : désélection (`deselectPlacementRecovery` :
   * ajout jeté, ou retrait programmé) ; non sélectionnée : roulette, sur la durée existante sinon
   * sur le défaut du Profil.
   */
  const handlePlacementRecoveryPress = useCallback(
    (occurrenceId: string) => {
      if (placement === null) return;
      const occurrence = draft.exercises.find((exercise) => exercise.id === occurrenceId);
      if (occurrence === undefined || occurrence.type !== "EXERCISE") return;
      if (placementRecoverySeconds(placement, occurrence) !== null) {
        const t = strings.screens.composition.placement;
        // Revue 6.3 (ch13 L1524) : effet, puis libellé de « Confirmer ».
        placementAnnouncementRef.current = {
          text: occurrenceId in placement.recoveries ? t.additionCancelledAnnouncement : t.recoveryRemovedAnnouncement,
          withLabel: true,
        };
        // Revue 7.2 : une roulette en attente du défaut du Profil ne s'ouvre pas plus tard.
        setRecoveryWheel(null);
        setPlacement(deselectPlacementRecovery(placement, occurrenceId, placementContext));
        return;
      }
      setRecoveryWheel({ occurrenceId, seconds: occurrence.postActivityRecoverySeconds ?? null });
    },
    [draft.exercises, placement, placementContext],
  );
  /**
   * Toucher un emplacement libre ou ajouté : bascule du Domaine AVEC contexte (story 6.3, D-441) —
   * ajout s'il est proposé, désélection s'il est ajouté. Story 7.2 (D-442) : un ajout qui ferait se
   * suivre un début et une fin de Tour (N ≥ 2) ouvre le choix « Début de tour / Fin de tour ».
   */
  const handlePlacementStopPointToggle = useCallback(
    (location: StopPointLocation) => {
      if (placement === null) return;
      setRecoveryWheel(null);
      const outcome = togglePlacementStopPointOutcome(placement, location, placementContext);
      if (outcome.status === "CHOICE_REQUIRED") {
        openTourChoice({ kind: "PLACEMENT_STOP_POINT", location });
        return;
      }
      const next = outcome.placement;
      if (next === placement) return;
      // Revue 6.3 (ch13 L1524) : effet, puis nombre d'ajouts (« Point d'arrêt ajouté. Confirmer 2 … »).
      const t = strings.screens.composition.placement;
      placementAnnouncementRef.current = {
        text: isPlacementStopPointAdded(next, location) ? t.stopPointAddedAnnouncement : t.additionCancelledAnnouncement,
        withLabel: true,
      };
      setPlacement(next);
    },
    [openTourChoice, placement, placementContext],
  );
  /**
   * ✓ de la roulette d'une zone de récupération (story 7.2, D-442) : la zone est sélectionnée à la
   * durée choisie (`selectPlacementRecovery` : ajout, ou récupération existante conservée — retrait
   * annulé — et modifiée si la durée diffère), annoncée avec le libellé de « Confirmer » (revue 6.3).
   * Roue non déplacée sur une récupération existante hors grille (donnée historique au-delà de 300 s
   * ou hors pas 1 / 5 / 30) : sa valeur est conservée telle quelle.
   */
  const validatePlacementRecovery = useCallback(
    (totalSeconds: number) => {
      const wheel = recoveryWheel;
      setRecoveryWheel(null);
      if (wheel === null || placement === null) return;
      // Revue 7.2 : seule une valeur existante valide (entière, ≥ 0) est conservée telle quelle.
      const existing = wheel.seconds !== null && Number.isInteger(wheel.seconds) && wheel.seconds >= 0 ? wheel.seconds : null;
      const seconds = existing !== null && totalSeconds === snapToGrid(existing, RECOVERY_WHEEL_VALUES) ? existing : totalSeconds;
      const next = selectPlacementRecovery(placement, wheel.occurrenceId, seconds, placementContext);
      // Revue 7.2 : annoncé seulement si la zone est réellement sélectionnée.
      if (next === placement) return;
      const t = strings.screens.composition.placement;
      placementAnnouncementRef.current = {
        text: wheel.seconds === null ? t.recoveryAddedAnnouncement : t.recoverySelectedAnnouncement,
        withLabel: true,
      };
      setPlacement(next);
    },
    [placement, placementContext, recoveryWheel],
  );
  /**
   * Revue 6.3 (D-441 R3, RM-251) : toucher un point EXISTANT bascule son retrait programmé, visé par
   * son identifiant (deux points hérités sur une même clé restent indépendants). Une annulation
   * refusée par le Domaine (un point ajouté le suivrait) ne change rien ; chaque issue est annoncée.
   * Story 7.2 (D-442) : une resélection refusée parce qu'elle ferait se suivre un début et une fin
   * de Tour avec un AJOUT ouvre le choix « Début de tour / Fin de tour ».
   */
  const handlePlacementExistingStopPointToggle = useCallback(
    (stopPointId: string) => {
      if (placement === null) return;
      const t = strings.screens.composition.placement;
      const next = togglePlacementStopPointRemoval(placement, stopPointId, placementContext);
      if (next === placement) {
        if (placementReselectionChoice(placement, stopPointId, placementContext) !== null) {
          openTourChoice({ kind: "PLACEMENT_EXISTING_STOP_POINT", stopPointId });
          return;
        }
        AccessibilityInfo.announceForAccessibility(t.stopPointKeepRefusedAnnouncement);
        return;
      }
      // Annoncé après le rendu, avec l'éventuel changement de disponibilité de « Confirmer ».
      placementAnnouncementRef.current = {
        text: isPlacementStopPointRemoved(next, stopPointId) ? t.stopPointRemovedAnnouncement : t.stopPointKeptAnnouncement,
        withLabel: false,
      };
      setPlacement(next);
    },
    [openTourChoice, placement, placementContext],
  );
  /**
   * Revue 6.3 : seule source des annonces du placement, en UN message pour ne pas s'interrompre —
   * l'effet du dernier toucher, puis le libellé de « Confirmer » : toujours après un ajout ou une
   * annulation d'ajout (nombre d'ajouts, ch13 L1524), et, pour un point existant, quand la
   * disponibilité change (jamais à l'entrée). La barre n'annonce plus rien d'elle-même.
   */
  const isConfirmAvailable = confirmation === null ? null : confirmation.kind !== "NONE";
  const previousConfirmAvailableRef = useRef<boolean | null>(null);
  useEffect(() => {
    const previous = previousConfirmAvailableRef.current;
    previousConfirmAvailableRef.current = isConfirmAvailable;
    const pending = placementAnnouncementRef.current;
    placementAnnouncementRef.current = null;
    // Story 7.2 : un choix de Tour peut n'avoir aucun effet propre à nommer (texte vide).
    const parts = pending === null || pending.text === "" ? [] : [pending.text];
    if (
      confirmation !== null &&
      ((pending !== null && pending.withLabel) || (previous !== null && previous !== isConfirmAvailable))
    ) {
      parts.push(formatPlacementConfirmLabel(confirmation));
    }
    if (parts.length > 0) AccessibilityInfo.announceForAccessibility(parts.join(". "));
  }, [confirmation, isConfirmAvailable]);
  // Android : le retour système annule le placement (comme « Annuler »).
  useEffect(() => {
    if (!isPlacementActive) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      cancelPlacement();
      return true;
    });
    return () => subscription.remove();
  }, [cancelPlacement, isPlacementActive]);

  // Emplacements du placement (Domaine), par occurrence et après le Circuit. Story 6.3 (D-441,
  // RM-251) : en placement, calculés sur l'état effectif (existants − retraits + ajouts du
  // sous-brouillon) — un retrait programmé libère les emplacements voisins.
  const entrySlots = useMemo(
    () => placementSlots(placementContext.exercises, placementContext.stopPoints, EMPTY_PLACEMENT_DRAFT, placementContext),
    [placementContext],
  );
  const draftSlots = useMemo(
    () => (placement === null ? entrySlots : placementSlots(placementContext.exercises, placementContext.stopPoints, placement, placementContext)),
    [entrySlots, placement, placementContext],
  );
  // « Ajouter un arrêt » est indisponible quand le placement n'aurait rien à proposer (Composition
  // vide, tout est déjà présent). Story 6.3 (D-441, R3) : un point existant IDENTIFIÉ suffit à le
  // rendre disponible — le placement est le seul chemin de son retrait ; un indice le dit quand
  // aucun ajout n'est possible.
  const entryOffer = placementOfferOf(entrySlots);
  const hasPlacementOffer = entryOffer.any;
  const addStopAccessibilityHint =
    entryOffer.any && !entryOffer.additions
      ? entryOffer.recoveries
        ? strings.screens.composition.placement.addStopChangesOnlyHint
        : strings.screens.composition.placement.addStopRemovalOnlyHint
      : undefined;
  const slotByOccurrence = useMemo(
    () =>
      new Map(
        draftSlots.flatMap((slot) =>
          slot.kind === "OCCURRENCE" && slot.occurrenceId !== null ? [[slot.occurrenceId, slot] as const] : [],
        ),
      ),
    [draftSlots],
  );
  const afterCircuitSlot = draftSlots.find((slot) => slot.kind === "AFTER_CIRCUIT") ?? null;
  /**
   * Story 6.3 (D-441, R3) : points existants qu'aucun emplacement ne porte (`UNOFFERED_STOP_POINT` :
   * tête de Circuit, hors bornes, position non entière…), rendus en placement comme rangées
   * autonomes de la séquence (`displayedZoneItems`) ; `null` hors placement.
   */
  // Clé stable (les emplacements sont recalculés à chaque bascule ; l'ensemble, lui, n'en dépend pas).
  const unofferedStopPointKey =
    placement === null
      ? null
      : JSON.stringify(
          // Story 7.1 (D-442) : un point existant en tête de Circuit est porté par l'emplacement
          // `CIRCUIT_HEAD` ; il reste rendu comme rangée autonome de la séquence (à sa place, en tête du
          // Circuit), sélectionné et désélectionnable — story 7.2 : l'emplacement LIBRE de tête est
          // rendu de même (`circuitHeadRowPoint`).
          draftSlots.flatMap((slot) =>
            (slot.kind === "UNOFFERED_STOP_POINT" || slot.kind === "CIRCUIT_HEAD") && slot.stopPoint?.stopPointId !== undefined
              ? [slot.stopPoint.stopPointId]
              : [],
          ),
        );
  const unofferedStopPointIds = useMemo(
    () => (unofferedStopPointKey === null ? null : new Set<string>(JSON.parse(unofferedStopPointKey) as string[])),
    [unofferedStopPointKey],
  );
  /**
   * Revue 6.3 : emplacements où un point non proposé est DESSINÉ (position tronquée ou ramenée aux
   * bornes, comme `scopeSequence`) — aucun emplacement libre n'y est proposé, même une fois ce point
   * désélectionné : deux puces ne se superposent jamais.
   */
  const unofferedDisplayKeys = useMemo(() => {
    if (unofferedStopPointIds === null) return null;
    return new Set(
      (draft.stopPoints ?? EMPTY_STOP_POINTS)
        .filter((point) => unofferedStopPointIds.has(point.id))
        .map((point) => stopPointKey(displayedStopPointLocation(draft.exercises, point))),
    );
  }, [draft.exercises, draft.stopPoints, unofferedStopPointIds]);
  /**
   * Story 6.3 : noms accessibles du placement, par la règle de la story 6.2 (dernier Exercice qui
   * précède, homonymes « n sur m », « après le circuit », têtes de portée) — points existants et
   * (revue 6.3) emplacements à ajouter.
   */
  const placementLabels = useMemo(
    () =>
      isPlacementActive ? placementLabelerOf(draft.exercises, draft.stopPoints ?? EMPTY_STOP_POINTS, levelPositions) : null,
    [draft.exercises, draft.stopPoints, isPlacementActive, levelPositions],
  );
  // Pendant le placement, durées recalculées en direct sur le brouillon tel que « Confirmer » le
  // produirait (R positive remplace la Pause terminale, story 1.3).
  const durationDraft = useMemo(
    () => (placement === null ? draft : applyPlacementDraft(draft, placement, () => "")),
    [draft, placement],
  );
  // PRE-6 story 7.2 (D-442) : D-301 est retirée — plus aucun message d'enchaînement sans pause.
  /** Story 6.3 : ce que `placementRowPointOf` lit (noms, sous-brouillon, contexte, emplacements masqués). */
  const placementRowEnvironment = useMemo<PlacementRowEnvironment>(
    () => ({ labels: placementLabels, placement: placement ?? EMPTY_PLACEMENT_DRAFT, context: placementContext, hiddenKeys: unofferedDisplayKeys }),
    [placement, placementContext, placementLabels, unofferedDisplayKeys],
  );
  /**
   * PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498) : emplacement LIBRE (ou ajouté) de tête de Circuit
   * — début de Tour, `CIRCUIT_HEAD` du Domaine —, dessiné dans le Circuit entre son en-tête et sa
   * première carte, centré et raccordé au rail comme les autres rangées du placement ; `null` hors
   * placement, sans emplacement, ou quand un point existant l'occupe (rangée autonome de ce point).
   */
  const circuitHeadRowPoint = useMemo<PlacementStopPointRowPoint | null>(() => {
    const circuitHeadSlot = draftSlots.find((slot) => slot.kind === "CIRCUIT_HEAD") ?? null;
    return placement === null || circuitHeadSlot?.stopPoint == null || circuitHeadSlot.stopPoint.existing
      ? null
      : placementRowPointOf(circuitHeadSlot.stopPoint, placementRowEnvironment);
  }, [draftSlots, placement, placementRowEnvironment]);
  const hasCircuitHeadRow = circuitHeadRowPoint !== null;
  const placementRowContext = useMemo<PlacementRowContext | null>(
    () =>
      placement === null
        ? null
        : {
            draft: placement,
            slotFor: (occurrenceId) => slotByOccurrence.get(occurrenceId) ?? null,
            rowPointOf: (stopPoint) => placementRowPointOf(stopPoint, placementRowEnvironment),
            circuitHeadRowPoint,
            onPressRecovery: handlePlacementRecoveryPress,
            onToggleStopPoint: handlePlacementStopPointToggle,
            onToggleExistingStopPoint: handlePlacementExistingStopPointToggle,
          },
    [
      circuitHeadRowPoint,
      handlePlacementExistingStopPointToggle,
      placementRowEnvironment,
      handlePlacementRecoveryPress,
      handlePlacementStopPointToggle,
      placement,
      slotByOccurrence,
    ],
  );

  const composition = strings.screens.composition;

  // T02-S01 (CE-T02-01) : la Composition restitue le brouillon réel dans
  // l'ordre structurel — Compte à rebours ; Activités AVANT le Tour ; Tour et
  // ses Activités ; Activités APRÈS le Tour ; Fin de séance.
  /**
   * PRE-6 story 6.2 (D-441) : éléments affichés de chaque zone — hors placement, la séquence mêlée
   * du Domaine (`scopeSequence` : occurrences et Points d'arrêt, chacun une rangée) ; en placement,
   * les occurrences et les seuls points non proposés (story 6.3) — les autres sont portés par les
   * emplacements (story 5.3).
   */
  const inPlacement = placement !== null;
  const zoneItems = useMemo(
    () => displayedZoneItems(draft.exercises, draft.stopPoints ?? EMPTY_STOP_POINTS, unofferedStopPointIds, hasCircuitHeadRow),
    [draft.exercises, draft.stopPoints, hasCircuitHeadRow, unofferedStopPointIds],
  );
  const tourRepeatCount = draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT;
  // PRE-6 (story 2.2) : contexte de Circuit des durées d'occurrence (nom accessible, durée estimée).
  const occurrenceCircuitContext: OccurrenceCircuitContext = {
    circuitNature: draft.circuitNature,
    tourRepeatCount,
  };
  const circuitNature = draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE;

  /**
   * Story 7.2 (D-442) : points retirés sans message (déplacement tolérant d'un Exercice, passage à
   * N = 1, choix de Tour) — leurs mesures de rangée sont oubliées (aucune géométrie de glisser ne
   * les compte plus) et une annonce d'accessibilité discrète les signale ; `focusKey` : élément qui
   * reçoit le focus avec l'annonce (pas « Monter » / « Descendre »), sinon annonce seule.
   */
  const reportRemovedStopPoints = useCallback(
    (ids: readonly string[], focusKey?: string) => {
      if (ids.length === 0) return;
      for (const id of ids) rowLayoutsRef.current.delete(railStopKey(id));
      const text = removedStopPointsAnnouncement(ids.length);
      if (focusKey !== undefined) {
        requestItemFocus(focusKey, text);
      } else {
        AccessibilityInfo.announceForAccessibility(text);
      }
    },
    [requestItemFocus],
  );

  /**
   * PRE-6 (story 3.1, AD-38, report de l'epic 1) : tout changement de N passe par le Domaine — Tours :
   * le compte seul ; Séries : les exercices du Circuit suivent N (diminution en réserve,
   * augmentation par restauration puis copie), sans message. Story 7.2 (D-442) :
   * `circuitCountOutcome` — au passage à N = 1, les points devenus interdits sont retirés (annonce
   * discrète) ; au passage de N = 1 à N ≥ 2 avec un début et une fin de Tour, le choix « Début de
   * tour / Fin de tour » est demandé AVANT tout changement (Annuler : N inchangé). Pendant le
   * dialogue, les pas suivants (maintien) sont ignorés. Story 7.3 (D-442) : le stepper étant toujours
   * affiché, un pas referme le choix de nature éventuellement ouvert (un seul contrôle actif, CIR-10).
   */
  // Forme fonctionnelle : chaque pas (maintien compris) part du brouillon COURANT, jamais de
  // celui du rendu.
  const handleCircuitCountChange = useCallback(
    (count: number) => {
      closeCircuitNatureMenu();
      if (tourChoicePendingRef.current) return;
      // Revue 7.5 : une suppression animée en cours est écrite d'abord (N peut changer ses retraits).
      flushDeletion();
      const outcome = circuitCountOutcome(draft, count);
      if (outcome.status === "CHOICE_REQUIRED") {
        openTourChoice({ kind: "CIRCUIT_COUNT", count });
        return;
      }
      // Revue 7.2 : aucun effet dans le calcul d'état — si le brouillon COURANT demande un choix
      // (mise à jour concurrente), rien n'est appliqué ; un nouveau pas ouvrira le dialogue.
      updateDraft((current) => {
        const replayed = circuitCountOutcome(current, count);
        return replayed.status === "CHOICE_REQUIRED" ? current : replayed.draft;
      });
      reportRemovedStopPoints(outcome.removedStopPointIds);
    },
    [closeCircuitNatureMenu, draft, flushDeletion, openTourChoice, reportRemovedStopPoints, updateDraft],
  );

  /**
   * PRE-6 (story 3.2, CE-CIR-01, CE-CIR-02, AD-37) : nature choisie depuis la pastille. Même
   * nature : rien. Sans perte (`prepareNatureChange(...).losses` vide, dont Séries → Tours) :
   * `applyNatureChange` immédiat, sans message. Avec perte (Tours → Séries, un exercice au-delà
   * de N) : dialogue de confirmation, rien n'est appliqué avant « Confirmer ».
   */
  const openNatureConfirmation = useCallback((nature: CircuitNature) => {
    natureChangeConfirmedRef.current = false;
    setPendingNatureChange(nature);
  }, []);
  const handleSelectNature = useCallback(
    (nature: CircuitNature) => {
      closeCircuitNatureMenu();
      // Sur iOS, le menu natif rend lui-même le focus à son déclencheur.
      const focusPillAfterChoice = Platform.OS !== "ios";
      if (nature === (draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE)) {
        if (focusPillAfterChoice) requestNatureFocus();
        return;
      }
      if (prepareNatureChange(draft, nature).losses.length > 0) {
        openNatureConfirmation(nature);
        return;
      }
      // Story 7.9 (revue) : la nature change, donc le texte de l'unité — sur iOS, le menu natif est
      // remonté (`triggerLayoutKey`) et ne peut plus rendre le focus à son déclencheur : le focus est
      // demandé au conteneur stable de la pastille, sur toutes les plateformes.
      requestNatureFocus();
      // Forme fonctionnelle : appliquée au brouillon COURANT. Si celui-ci porte une perte (mise
      // à jour concurrente), rien n'est appliqué et la confirmation s'ouvre — hors du calcul
      // d'état, qui doit rester pur.
      updateDraft((current) => {
        if (prepareNatureChange(current, nature).losses.length > 0) {
          queueMicrotask(() => openNatureConfirmation(nature));
          return current;
        }
        return applyNatureChange(current, nature);
      });
    },
    [closeCircuitNatureMenu, draft, openNatureConfirmation, requestNatureFocus, updateDraft],
  );

  /** Fermeture du choix par l'utilisateur (Android / web) : rien n'est appliqué, focus à la pastille. */
  const dismissNatureMenu = useCallback(() => {
    closeCircuitNatureMenu();
    requestNatureFocus();
  }, [closeCircuitNatureMenu, requestNatureFocus]);

  /** « Annuler » (ou retour système) du dialogue de perte : rien n'est appliqué. */
  const cancelNatureChange = useCallback(() => {
    setPendingNatureChange(null);
    requestNatureFocus();
  }, [requestNatureFocus]);

  /**
   * « Confirmer » de la conversion avec perte : une seule fois (double appui ignoré), sur le
   * brouillon COURANT — la perte est recalculée par `applyNatureChange` à partir de l'état
   * réel, jamais de celui de l'ouverture du dialogue.
   */
  const confirmNatureChange = useCallback(() => {
    if (pendingNatureChange === null || natureChangeConfirmedRef.current) {
      return;
    }
    natureChangeConfirmedRef.current = true;
    const nature = pendingNatureChange;
    setPendingNatureChange(null);
    updateDraft((current) => applyNatureChange(current, nature));
    requestNatureFocus();
  }, [pendingNatureChange, requestNatureFocus, updateDraft]);

  const handleZoneLayout = useCallback((zone: StructuralPosition, event: LayoutChangeEvent) => {
    zoneTopsRef.current[zone] = event.nativeEvent.layout.y;
  }, []);

  /** Mesure d'une rangée de zone (carte ou point), par clé d'élément. */
  const handleRowLayout = useCallback((key: string, zone: StructuralPosition, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    const previous = rowLayoutsRef.current.get(key);
    rowLayoutsRef.current.set(key, { top: y, height, zone });
    // Story 7.5 (d-17) : taille changée — la translation native de la rangée est renvoyée.
    if (previous !== undefined && previous.height !== height) shiftRegistryRef.current?.resyncNative([key]);
  }, []);

  const handleTourLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    const resized = tourLayoutRef.current.height !== height;
    tourLayoutRef.current = { top: y, height };
    // Story 7.5 (d-17) : le Circuit a changé de taille (dépôt d'une carte entrée ou sortie, suppression,
    // placement) — Fabric recalcule alors la translation de son fond étiré à partir de propriétés
    // gardées, peut-être périmées : les bords du Circuit sont renvoyés au pilote natif.
    if (resized) shiftRegistryRef.current?.resyncNative([RAIL_KEYS.circuitHeader, RAIL_KEYS.circuitEnd]);
    setCircuitSectionTop(y);
    setCircuitMeasuredHeight(height);
  }, []);

  /**
   * Origine d'une liste de zone dans le repère du CONTENU DÉFILANT. Les
   * listes `BEFORE_TOUR`/`AFTER_TOUR` sont des enfants directs de ce contenu
   * — leur `y` mesuré est déjà absolu. La liste `IN_TOUR`, elle, est un
   * enfant de la structure Tour (c'est le contrat : les Activités du Tour
   * sont DANS le Tour) : son `y` est relatif à cette structure, dont il faut
   * donc ajouter la propre origine.
   */
  const zoneBaseTop = useCallback((zone: StructuralPosition): number => {
    const measured = zoneTopsRef.current[zone] ?? 0;
    return zone === "IN_TOUR" ? tourLayoutRef.current.top + measured : measured;
  }, []);

  /**
   * Géométrie absolue (repère du contenu défilant) de toutes les rangées affichées et de la
   * structure Tour — l'entrée de `resolveDropTarget`. PRE-6 story 6.2 : chaque rangée de Point
   * d'arrêt est une ligne, avec sa hauteur mesurée ; l'identifiant d'une ligne est la clé de rail
   * de l'élément. Le rang d'un emplacement compte donc la séquence MÊLÉE de la zone, élément glissé
   * retiré — l'indice attendu par `moveOccurrenceInSequence`.
   */
  const buildDragLayout = useCallback((): CompositionDragLayout | null => {
    const rows: ActivityRowLayout[] = [];
    for (const zone of STRUCTURAL_ZONES) {
      for (const item of zoneItems[zone]) {
        const key = zoneItemKey(item);
        const rowLayout = rowLayoutsRef.current.get(key);
        // Revue 6.2 : une rangée affichée sans mesure, ou mesurée dans une autre zone (montée
        // ailleurs depuis), rendrait la géométrie fausse : aucun relevé, le geste est refusé.
        if (rowLayout === undefined || rowLayout.zone !== zone) {
          return null;
        }
        rows.push({ id: key, zone, top: zoneBaseTop(zone) + rowLayout.top, height: rowLayout.height });
      }
    }
    return {
      tourTop: tourLayoutRef.current.top,
      tourBottom: tourLayoutRef.current.top + tourLayoutRef.current.height,
      rows,
    };
  }, [zoneItems, zoneBaseTop]);

  const itemAbsoluteCenterY = useCallback(
    (key: string, zone: StructuralPosition): number => {
      const rowLayout = rowLayoutsRef.current.get(key);
      if (rowLayout === undefined) {
        return 0;
      }
      return zoneBaseTop(zone) + rowLayout.top + rowLayout.height / 2;
    },
    [zoneBaseTop],
  );

  /**
   * Déplacement d'une occurrence (glisser, « Monter » / « Descendre ») — mêmes règles pour
   * tous les chemins. Story 7.1 (D-442, remplace ARB-3 et le refus de D-441) : les Points d'arrêt
   * restent à leur place ; un dépôt qui en rendrait un interdit ou consécutif est appliqué et le
   * Domaine retire les points en cause (`removedStopPointIds`, annonce et focus : story 7.2) ; un
   * conflit de Tour (choix requis) n'applique rien et ouvre le dialogue « Début de tour / Fin de
   * tour » (story 7.2), la carte lâchée restant tenue jusqu'à la réponse. PRE-6 (story 2.3, AD-39) : entrée dans un Circuit de Séries →
   * adaptation à N, et si des séries sont perdues, confirmation AVANT toute mutation (Annuler
   * restitue la position) ; sortie du Circuit → réserve retirée, nombre et paramètres
   * conservés, sans message.
   */
  const moveActivityTo = useCallback(
    (move: OccurrenceMove, focusKey?: string): "APPLIED" | "REFUSED" | "PENDING" => {
      const plan = planOccurrenceMove(draft, move);
      if (plan === null) {
        return "REFUSED";
      }
      if (plan.status === "CHOICE_REQUIRED") {
        // Story 7.2 (D-442) : conflit de Tour — rien n'est appliqué avant le choix ; la carte lâchée
        // reste tenue là où elle a été lâchée, comme pendant le dialogue de perte (story 5.2b).
        if (!openTourChoice({ kind: "OCCURRENCE_MOVE", move, fromStep: focusKey !== undefined })) return "REFUSED";
        closeCircuitNatureMenu();
        return "PENDING";
      }
      if (plan.losses.length > 0) {
        // Seule l'intention est retenue : « Confirmer » rejoue le déplacement sur le brouillon
        // COURANT (aucun instantané rejoué).
        // PRE-6 (story 3.1, RC-4) : un dialogue de décision referme le choix de nature.
        closeCircuitNatureMenu();
        setPendingCircuitEntry({ ...move, targetCount: plan.targetCount, focusKey });
        return "PENDING";
      }
      // Revue 6.2 : rejoué sur le brouillon COURANT (jamais un état figé au rendu).
      updateDraft((current) => {
        const replayed = planOccurrenceMove(current, move);
        return replayed?.status === "PLAN" ? { ...current, ...replayed.patch } : current;
      });
      // Story 7.2 (D-442) : points retirés par le déplacement tolérant, sans message visuel.
      reportRemovedStopPoints(plan.removedStopPointIds, focusKey);
      return "APPLIED";
    },
    [closeCircuitNatureMenu, draft, openTourChoice, reportRemovedStopPoints, updateDraft],
  );

  /**
   * PRE-6 story 6.2 (D-441, R2) : déplacement autonome d'un Point d'arrêt vers l'emplacement
   * `(scope, position)` du rang visé (`moveStopPoint`, identité conservée). Refus (emplacement non
   * proposable, occupé, RM-251) ou même emplacement : rien n'est écrit.
   */
  const moveStopPointTo = useCallback(
    (stopPointId: string, destination: DropTarget): "APPLIED" | "REFUSED" | "PENDING" => {
      const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
      const point = state.stopPoints.find((candidate) => candidate.id === stopPointId);
      const location = stopPointLocationAt(zoneItems[destination.zone], stopPointId, destination.zone, destination.index);
      // Revue 6.2 : déposé sur son emplacement AFFICHÉ (position héritée ramenée), rien n'est écrit.
      if (point === undefined || sameLocation(displayedStopPointLocation(state.exercises, point), location)) {
        return "REFUSED";
      }
      const outcome: CompositionOutcome = moveStopPoint(state, stopPointId, location);
      if (outcome.status === "CHOICE_REQUIRED") {
        // Story 7.2 (D-442) : tête ou fin de Tour face à l'autre limite (N ≥ 2) — choix demandé, le
        // point lâché reste tenu (story 5.2b).
        return openTourChoice({ kind: "STOP_POINT_MOVE", stopPointId, location, fromStep: false }) ? "PENDING" : "REFUSED";
      }
      if (outcome.status !== "APPLIED" || outcome.state === state) {
        return "REFUSED";
      }
      // Rejoué sur le brouillon COURANT.
      updateDraft((current) => {
        const currentState = compositionStateOf(current.exercises, current.stopPoints, current.tourRepeatCount);
        const replayed = moveStopPoint(currentState, stopPointId, location);
        return replayed.status === "APPLIED" && replayed.state !== currentState
          ? { ...current, ...compositionPatch(currentState, replayed.state) }
          : current;
      });
      return "APPLIED";
    },
    [draft.exercises, draft.stopPoints, draft.tourRepeatCount, openTourChoice, updateDraft, zoneItems],
  );

  /**
   * Dépôt. PRE-6 (story 2.3b) : l'emplacement est calculé sur la géométrie FIGÉE au début du geste
   * (`frozenDropSlot`), exactement comme l'aperçu — le dépôt applique donc l'emplacement montré,
   * même si une mesure `onLayout` a changé pendant le geste. Repli sur la géométrie courante
   * seulement sans aperçu (aucun relevé de début de geste).
   *
   * Ordre explicite : fin de l'état soulevé, déplacement, puis UNE écriture de la session —
   * appliqué : décalages remis à 0 sans animation dans le rendu de la nouvelle disposition (aucun
   * saut) ; refusé : retour en douceur ; confirmation de perte : l'aperçu est CONSERVÉ pendant le
   * dialogue (« Annuler » le ramène en douceur, « Confirmer » le remet à 0 avec la disposition).
   */
  const handleDropItem = useCallback(
    (key: string, zone: StructuralPosition, translationY: number) => {
      const frozen = dragPreview !== null && dragPreview.key === key ? frozenDropSlot(dragPreview, translationY) : null;
      const currentLayout = frozen === null ? buildDragLayout() : null;
      const destination =
        frozen ?? (currentLayout === null ? null : resolveDropTarget(currentLayout, key, itemAbsoluteCenterY(key, zone) + translationY));
      handleDragStart(null);
      if (destination === null) {
        // Revue 6.2 : géométrie incomplète, aucun emplacement fiable : retour, rien d'écrit.
        finishDragPreview(true, { key, from: translationY });
        return;
      }
      // PRE-6 story 6.2 (D-441) : une occurrence est insérée au rang visé de la séquence mêlée
      // (`moveOccurrenceInSequence`, R1 : les points restent en place) ; un point est déplacé seul
      // (`moveStopPoint`, R2) vers l'emplacement `(scope, position)` de ce rang. Refus : retour animé.
      const stopPointId = stopPointIdOfKey(key);
      // Revue 7.6 : points que le dépôt retirera (calculés avant l'écriture, sur le brouillon du rendu).
      const removedAtDrop =
        stopPointId !== null
          ? []
          : removedByMove(draft, { activityId: occurrenceIdOfKey(key), zone: destination.zone, index: destination.index });
      const outcome =
        stopPointId !== null
          ? moveStopPointTo(stopPointId, destination)
          : moveActivityTo({ activityId: occurrenceIdOfKey(key), zone: destination.zone, index: destination.index });
      // Story 5.2b : l'élément relâché est pris là où le doigt l'a laissé (pose de départ de sa
      // translation dans le registre, sans animation) — maintenu pendant le dialogue de perte,
      // ramené à sa place en douceur après un refus.
      const release: ShiftRelease = { key, from: translationY };
      if (outcome === "PENDING") {
        setDragSession((current) =>
          current.preview === null
            ? current
            : {
                ...current,
                preview: { ...current.preview, slot: destination, heldTranslationY: translationY },
                animated: true,
                release,
              },
        );
      } else if (outcome === "REFUSED") {
        finishDragPreview(true, release);
      } else {
        // Story 7.6 : l'élément déposé glisse de l'endroit du lâcher jusqu'à sa place.
        finishAppliedDrop(
          dragPreview === null || dragPreview.key !== key
            ? null
            : dropSettlePose(dragPreview, destination, translationY, draft, removedAtDrop),
        );
      }
    },
    [
      buildDragLayout,
      dragPreview,
      draft,
      finishAppliedDrop,
      finishDragPreview,
      handleDragStart,
      itemAbsoluteCenterY,
      moveActivityTo,
      moveStopPointTo,
    ],
  );

  /**
   * PRE-6 (story 2.3b) : début (relevé des positions, sans décalage) et fin (`null` : décalages
   * remis à 0, en douceur sauf dépôt appliqué) du glisser d'une carte.
   */
  const handleRowDragStart = useCallback(
    (key: string | null, translationY = 0): boolean => {
      if (key === null) {
        // Geste interrompu : retour en douceur depuis la position atteinte (story 5.2b).
        setDragSession((current) =>
          endDragSession(
            current,
            true,
            current.preview === null ? null : { key: current.preview.key, from: translationY },
          ),
        );
      } else {
        // Revue 6.2 : un second soulèvement (autre doigt) pendant qu'un élément est soulevé est
        // ignoré ; une géométrie incomplète (rangée non mesurée, ou mesurée dans une autre zone)
        // refuse le soulèvement — l'élément reste au repos.
        if (draggedKeyRef.current !== null) return false;
        // Story 7.5 : aucun soulèvement pendant une suppression animée (disposition en mouvement).
        if (deletionRef.current !== null) return false;
        const originLayout = buildDragLayout();
        if (originLayout === null) return false;
        // Story 5.2b : un nouveau geste pendant un retour arrête ce retour et pose toutes les
        // translations à 0, de façon synchrone, AVANT le relevé (la mise en page mesurée, que
        // `buildDragLayout` vient de lire, correspond alors à l'écran).
        shiftRegistryRef.current?.reset();
        // Story 7.4 : origine du défilement accumulé pendant ce geste.
        autoScroll.begin();
        setDragSession({
          preview: { key, originLayout, slot: null, heldTranslationY: null },
          animated: true,
          circuitHeight: originLayout.tourBottom - originLayout.tourTop,
          release: null,
          settling: null,
        });
      }
      handleDragStart(key);
      return true;
    },
    [autoScroll, buildDragLayout, handleDragStart],
  );

  /**
   * PRE-6 (story 2.3b) : emplacement d'insertion visé pendant le glisser — `frozenDropSlot`, sur
   * la géométrie figée au début du geste, le même calcul que le dépôt (`handleDropActivity`).
   * Aucune mutation du brouillon ; l'état ne change que si l'emplacement change.
   */
  const handleDragMove = useCallback((key: string, translationY: number) => {
    setDragSession((current) => {
      const preview = current.preview;
      if (preview === null || preview.key !== key) {
        return current;
      }
      const slot = frozenDropSlot(preview, translationY);
      if (slot === null || (preview.slot !== null && preview.slot.zone === slot.zone && preview.slot.index === slot.index)) {
        return current;
      }
      return { ...current, preview: { ...preview, slot } };
    });
  }, []);

  /**
   * Décalages qui montrent la disposition du dépôt à l'emplacement visé (`resolveDragShifts`,
   * fonction pure) : cartes, bords du Circuit (amendement Hermann du 21/10/2026 : il s'agrandit ou
   * se rétracte pendant le geste), ligne après le Circuit.
   */
  const dragShifts = useMemo<DragShifts>(() => {
    if (dragPreview === null || dragPreview.slot === null) {
      return NO_DRAG_SHIFTS;
    }
    const measured = dragPreview.originLayout.rows.find((row) => row.id === dragPreview.key)?.height;
    // Story 6.2 : un point garde sa hauteur mesurée ; une carte, celle que le dépôt produirait.
    const draggedOccurrenceId = stopPointIdOfKey(dragPreview.key) === null ? occurrenceIdOfKey(dragPreview.key) : null;
    const insertionHeight =
      draggedOccurrenceId === null
        ? measured
        : predictedInsertionHeight(
            draft,
            draggedOccurrenceId,
            measured,
            dragPreview.slot,
            // Carte v2 (story 5.1) : 80 quelle que soit la zone ; l'écart de carte est nul.
            () => occurrenceCardHeight(),
          );
    return resolveDragShifts(
      dragPreview.originLayout,
      dragPreview.key,
      dragPreview.slot,
      DRAG_SHIFT_GAPS,
      insertionHeight,
    );
  }, [dragPreview, draft]);
  // Story 7.5 : le glissement d'une suppression est toujours animé (sauf « Réduire les animations »).
  // Story 7.7 : de même pour le glissement qui fait place à une copie.
  const animateDragShifts = (deletion !== null || appearance !== null || dragSession.animated) && !reduceMotion;
  /** Story 7.5 : décalages du glissement qui suit le fondu d'une suppression. */
  const deletionShifts = useMemo<DragShifts | null>(
    () =>
      deletion === null || deletion.phase !== "slide"
        ? null
        : resolveRemovalShifts(deletion.layout, deletion.fadingKeys, DRAG_SHIFT_GAPS),
    [deletion],
  );
  /**
   * PRE-6 (story 5.2) : translations animées de la séquence, une par élément porteur de rail
   * (`compositionRail.ts`), dans un registre PARTAGÉ : le lien de rail d'un élément s'étire de la
   * différence entre sa translation et celle de son prédécesseur, mêmes objets animés que ceux qui
   * translatent les éléments.
   */
  const railShiftTargets = useMemo(() => {
    const targets = new Map<string, number>([[RAIL_KEYS.start, 0]]);
    for (const zone of STRUCTURAL_ZONES) {
      for (const item of zoneItems[zone]) {
        const key = zoneItemKey(item);
        targets.set(key, (deletionShifts ?? dragShifts).rows.get(key) ?? 0);
      }
    }
    // Story 5.2b : pendant le dialogue de perte, la carte relâchée reste où le doigt l'a laissée.
    if (dragPreview !== null && dragPreview.heldTranslationY !== null) {
      targets.set(dragPreview.key, dragPreview.heldTranslationY);
    }
    const shifts = deletionShifts ?? dragShifts;
    targets.set(RAIL_KEYS.circuitHeader, shifts.circuitTop);
    targets.set(RAIL_KEYS.circuitEnd, shifts.circuitBottom);
    targets.set(RAIL_KEYS.afterCircuit, shifts.afterCircuit);
    targets.set(RAIL_KEYS.end, shifts.end);
    return targets;
  }, [deletionShifts, dragPreview, dragShifts, zoneItems]);
  const shiftRegistry = useAnimatedShiftRegistry(railShiftTargets, animateDragShifts, dragSession.release);
  // Story 5.2b : accès du début de geste (`handleRowDragStart`, déclaré plus haut) au registre.
  useLayoutEffect(() => {
    shiftRegistryRef.current = shiftRegistry;
  }, [shiftRegistry]);
  /**
   * Story 5.2b : carte au premier plan (zone, Circuit et rangée relevés) — soulevée, maintenue
   * pendant le dialogue de perte, puis jusqu'à la fin de son retour animé (`settling`, levé par
   * `whenSettled` du registre) : sa carte recouvre le rail qu'elle croise en revenant.
   */
  const settling =
    dragSession.settling !== null && sequenceItemExists(draft, dragSession.settling.key) ? dragSession.settling : null;
  const raisedKey = draggedKey ?? dragPreview?.key ?? settling?.key ?? null;
  const settlingSession = dragSession.settling;
  useEffect(() => {
    if (settlingSession === null) return undefined;
    return shiftRegistry.whenSettled(() =>
      setDragSession((current) => (current.settling === settlingSession ? { ...current, settling: null } : current)),
    );
  }, [settlingSession, shiftRegistry]);
  /**
   * Story 7.5 : fondu de la suppression, démarré après le rendu, une microtâche plus tard (comme le
   * registre : une animation native démarrée dans le rendu d'un démontage — les actions glissées
   * refermées — atteindrait des propriétés encore attachées d'un composant démonté) ; puis glissement.
   */
  useEffect(() => {
    if (deletion === null || deletion.phase !== "fade") return undefined;
    const fading = deletion;
    let cancelled = false;
    let slideTimer: ReturnType<typeof setTimeout> | null = null;
    const startSlide = () => {
      if (deletionRef.current !== fading) return;
      const sliding: PendingDeletion = { ...fading, phase: "slide" };
      deletionRef.current = sliding;
      setDeletion(sliding);
    };
    queueMicrotask(() => {
      if (cancelled || deletionRef.current !== fading) return;
      // Story 7.6 : le glissement commence pendant le fondu (chevauchement) ; l'écriture attend la
      // fin du glissement, plus tardive que celle du fondu.
      slideTimer = setTimeout(startSlide, MOTION_FADE_TO_SLIDE_DELAY_MS);
      Animated.timing(fading.opacity, {
        toValue: 0,
        duration: DELETE_FADE_DURATION_MS,
        easing: MOTION_FADE_EASING,
        useNativeDriver: true,
      }).start(({ finished }) => {
        fading.progress.fadeDone = true;
        // Fondu interrompu (vue détachée) : la suppression est écrite ; sinon, à la fin du glissement.
        if ((!finished || fading.progress.slideDone) && deletionRef.current?.commit === fading.commit) fading.commit();
      });
    });
    return () => {
      cancelled = true;
      if (slideTimer !== null) clearTimeout(slideTimer);
    };
  }, [deletion]);
  /**
   * Story 7.7 : fondu d'apparition de la copie, démarré après le rendu (une microtâche plus tard,
   * comme le fondu de suppression) ; fin : la copie redevient une carte ordinaire.
   */
  useEffect(() => {
    if (appearance === null) return undefined;
    const current = appearance;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      Animated.timing(current.opacity, {
        toValue: 1,
        duration: MOTION_APPEAR_DURATION_MS,
        easing: MOTION_FADE_EASING,
        useNativeDriver: true,
      }).start(() => {
        setAppearance((latest) => (latest === current ? null : latest));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [appearance]);
  // Story 7.5 : fin du glissement d'une suppression — le brouillon est écrit.
  useEffect(() => {
    if (deletion === null || deletion.phase !== "slide") return undefined;
    return shiftRegistry.whenSettled(() => {
      deletion.progress.slideDone = true;
      // Revue 7.6 : l'écriture attend aussi la fin du fondu.
      if (deletion.progress.fadeDone) deletion.commit();
    });
  }, [deletion, shiftRegistry]);
  const railShiftOf = useCallback(
    (key: string) => shiftRegistry.value(key, railShiftTargets.get(key) ?? 0),
    [railShiftTargets, shiftRegistry],
  );
  const circuitTopShift = railShiftOf(RAIL_KEYS.circuitHeader);
  const circuitBottomShift = railShiftOf(RAIL_KEYS.circuitEnd);
  const afterCircuitShift = railShiftOf(RAIL_KEYS.afterCircuit);
  const endShift = railShiftOf(RAIL_KEYS.end);
  /**
   * PRE-6 (story 5.2) : liens du rail segmenté (`resolveRailLinks`, fonction pure) — ordre affiché et
   * écarts de conception ; les translations du glisser sont appliquées par les valeurs animées du
   * registre. L'occurrence soulevée (aperçu en cours) sort seule de la chaîne, avec sa hauteur
   * relevée au début du geste — exacte, le soulèvement ne changeant pas la mise en page (story
   * 5.2b) ; carte non mesurée : hauteur de la carte, rangée de son point d'arrêt comprise (écart de
   * la zone + 22).
   */
  // Revue 5.3 : en placement, rangée « après le Circuit » pour un point existant ou pour la puce à
  // ajouter. Story 6.3 : seul l'emplacement `AFTER_CIRCUIT` la porte (un point « après le Circuit »
  // d'un Circuit vide est non proposé : rangée autonome en tête de la zone après le Circuit).
  const afterCircuitRowPoint: PlacementStopPointRowPoint | null =
    placement === null ? null : placementRowPointOf(afterCircuitSlot?.stopPoint ?? null, placementRowEnvironment);
  // Story 6.2 : hors placement, le point « après le Circuit » est la première rangée de la zone
  // après le Circuit ; la rangée dédiée ne sert plus qu'à l'emplacement du placement.
  const hasAfterCircuitRail = placement !== null && afterCircuitRowPoint !== null;
  // Revue 5.2 : en-tête du Circuit de hauteur minimale 40 (Dynamic Type) — l'anneau et ses segments
  // suivent sa hauteur mesurée ; son haut reste à la marge du Circuit (14), dans le flux.
  const circuitHeaderHeight =
    circuitHeaderLayout !== null && circuitHeaderLayout.height > 0 ? circuitHeaderLayout.height : CIRCUIT_HEADER_HEIGHT;
  const circuitHeaderRingTopY = CIRCUIT_PADDING_VERTICAL + circuitHeaderRingTop(circuitHeaderHeight);
  const railGeometry = railGeometryFor(circuitHeaderHeight);
  /**
   * Revue 5.2 : la Fin suit-elle une rangée de point d'arrêt ? Story 6.2 : dernière rangée de la
   * zone après le Circuit. Hors placement seulement (en placement, la Fin est inactive).
   */
  const finPrecededByStopPoint = placement === null && zoneItems.AFTER_TOUR[zoneItems.AFTER_TOUR.length - 1]?.kind === "STOP_POINT";
  /**
   * Revue 6.2 : le Compte à rebours est-il suivi d'une rangée de point (première rangée de la zone
   * avant le Circuit) ? Seules ces rangées touchent une borne : une rangée du Circuit en est séparée
   * par sa marge (14), une rangée après le Circuit par le Circuit lui-même.
   */
  const countdownFollowedByStopPoint = placement === null && zoneItems.BEFORE_TOUR[0]?.kind === "STOP_POINT";
  // Story 5.2b : sort de la chaîne la carte qui n'est pas à sa place — soulevée, maintenue à sa
  // position de dépôt pendant le dialogue de perte (elle comble l'emplacement ouvert, comme pendant
  // le geste), puis en retour animé (translation du registre vers 0, synchronisée avec ses voisines)
  // jusqu'à ce qu'elle soit revenue. Ses voisines restent reliées entre elles à travers sa place ;
  // elle, au premier plan, recouvre ce qu'elle croise et porte le rail de sa propre surface (voir
  // `CompositionActivityRow`). La garder dans la chaîne pendant le retour étirerait son lien, peint
  // au premier plan, à travers les médias des cartes passées entre elle et son prédécesseur.
  const railSkip =
    dragPreview !== null
      ? {
          key: dragPreview.key,
          measuredHeight: dragPreview.originLayout.rows.find((row) => row.id === dragPreview.key)?.height,
        }
      : settling;
  // Élément non mesuré : hauteur de sa rangée (story 6.2 : la rangée du point n'est plus dans le
  // bloc de la carte).
  const fallbackBlockHeight = (key: string): number =>
    stopPointIdOfKey(key) !== null ? STOP_POINT_LINE_HEIGHT : occurrenceCardHeight();
  /**
   * Éléments sortis de la chaîne du rail. Story 7.5 : pendant une suppression animée, la carte et les
   * points retirés (leurs voisins se relient à travers leur place, qui se referme).
   */
  // Revue 7.5 : une carte en retour animé reste hors de la chaîne pendant une suppression.
  const railSkipped: RailSkippedItem[] = [
    ...(railSkip === null || deletion?.fadingKeys.has(railSkip.key) === true
      ? []
      : [{ key: railSkip.key, height: railSkip.measuredHeight ?? fallbackBlockHeight(railSkip.key) }]),
    ...(deletion === null
      ? []
      : [...deletion.fadingKeys].map((key) => ({
          key,
          height: deletion.layout.rows.find((row) => row.id === key)?.height ?? fallbackBlockHeight(key),
        }))),
  ];
  const railSkippedKeys = new Set(railSkipped.map((item) => item.key));
  const railLinks = resolveRailLinks({
    beforeTour: zoneItems.BEFORE_TOUR.map(railChainItemOf),
    inTour: zoneItems.IN_TOUR.map(railChainItemOf),
    afterTour: zoneItems.AFTER_TOUR.map(railChainItemOf),
    hasAfterCircuit: hasAfterCircuitRail,
    skipped: railSkipped,
    geometry: railGeometry,
  });
  /** Story 7.5 : éléments en cours d'effacement et leur opacité. */
  // Story 7.7 : ou la copie de Dupliquer en cours d'apparition.
  const deletionFading =
    deletion !== null
      ? { keys: deletion.fadingKeys, opacity: deletion.opacity, leaving: true }
      : appearance !== null
        ? { keys: new Set([appearance.key]), opacity: appearance.opacity, leaving: false }
        : null;
  const sequenceRail: SequenceRailContext = { links: railLinks, shiftOf: railShiftOf, skippedKeys: railSkippedKeys };
  /** Lien d'un élément non occurrence (toujours présent : seule une occurrence sort de la chaîne). */
  const railLinkOf = (key: string): RailLinkGeometry | null => railLinks.get(key) ?? null;
  const headerRailLink = railLinkOf(RAIL_KEYS.circuitHeader);
  const circuitEndRailLink = railLinkOf(RAIL_KEYS.circuitEnd);
  const afterCircuitRailLink = railLinkOf(RAIL_KEYS.afterCircuit);
  const endRailLink = railLinkOf(RAIL_KEYS.end);

  // PRE-6 (story 2.3, CE-T03-08 §18) : « Monter » / « Descendre ». PRE-6 story 6.2 (D-441) :
  // échange avec l'élément voisin de la séquence mêlée, point ou occurrence (`stepOccurrence`),
  // en franchissant les limites du Circuit ; même plan que le glisser (adaptation au Circuit de
  // Séries, confirmation de perte). Une action n'est offerte que si le Domaine l'accepte.
  /**
   * Revue 6.2 : table des pas offerts (cartes et points), calculée une fois par brouillon — et non
   * à chaque rendu de chaque rangée.
   */
  const stepAvailability = useMemo(() => {
    const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
    const both = (offered: (direction: StepDirection) => boolean) => ({ UP: offered("UP"), DOWN: offered("DOWN") });
    const cards = new Map(
      draft.exercises.map((exercise) => [
        exercise.id,
        both((direction) => planOccurrenceMove(draft, { activityId: exercise.id, direction }) !== null),
      ]),
    );
    const points = new Map(
      inPlacement
        ? []
        : state.stopPoints.map((point) => [point.id, both((direction) => stopPointStepOutcome(state, point.id, direction) !== null)]),
    );
    return { cards, points };
  }, [draft, inPlacement]);
  const canStepActivity = useCallback(
    (activityId: string, direction: StepDirection) => stepAvailability.cards.get(activityId)?.[direction] ?? false,
    [stepAvailability],
  );
  const handleStepActivity = useCallback(
    (activityId: string, direction: StepDirection) => {
      // Revue 7.5 : pendant une suppression animée (disposition figée), aucune autre opération.
      if (deletionRef.current !== null) return;
      // Comme Dupliquer / Supprimer : les actions glissées révélées se referment.
      setRevealedActionsId(null);
      const key = railRowKey(activityId);
      const fromZone = draft.exercises.find((exercise) => exercise.id === activityId)?.structuralPosition;
      const plan = planOccurrenceMove(draft, { activityId, direction });
      const toZone =
        plan?.status === "PLAN"
          ? plan.patch.exercises?.find((exercise) => exercise.id === activityId)?.structuralPosition
          : undefined;
      // Story 7.2 (D-442) : un point retiré par le pas est annoncé avec le focus porté sur la carte
      // (la clé de focus fait aussi reconnaître un pas après un choix de Tour).
      const removesStopPoints = plan?.status === "PLAN" && plan.removedStopPointIds.length > 0;
      const outcome = moveActivityTo({ activityId, direction }, key);
      if (outcome === "APPLIED" && !removesStopPoints && toZone !== undefined && toZone !== fromZone) {
        // Revue 6.2 : la carte est remontée dans une autre liste — le focus la suit.
        requestItemFocus(key);
      }
    },
    [draft, moveActivityTo, requestItemFocus],
  );
  /**
   * PRE-6 story 6.2 (D-441, AC3) : « Monter » / « Descendre » d'un Point d'arrêt — vers
   * l'emplacement autorisé voisin (`stopPointStepTarget`), proposé seulement si `moveStopPoint`
   * l'accepte (non consécutif, libre) ; `null` sinon (action absente).
   */
  const handleStepStopPoint = useCallback(
    (stopPointId: string, direction: StepDirection) => {
      // Revue 7.5 : pendant une suppression animée (disposition figée), aucune autre opération.
      if (deletionRef.current !== null) return;
      setRevealedActionsId(null);
      const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
      const fromScope = state.stopPoints.find((point) => point.id === stopPointId)?.scope;
      const step = stopPointStepOutcome(state, stopPointId, direction);
      if (step?.status === "CHOICE_REQUIRED") {
        // Story 7.2 (D-442) : le pas ferait se suivre un début et une fin de Tour — choix demandé.
        openTourChoice({ kind: "STOP_POINT_MOVE", stopPointId, location: step.location, fromStep: true });
        return;
      }
      const toScope = step?.state.stopPoints.find((point) => point.id === stopPointId)?.scope;
      // Rejoué sur le brouillon COURANT.
      updateDraft((current) => {
        const currentState = compositionStateOf(current.exercises, current.stopPoints, current.tourRepeatCount);
        const next = stopPointStepOutcome(currentState, stopPointId, direction);
        return next?.status === "APPLIED" ? { ...current, ...compositionPatch(currentState, next.state) } : current;
      });
      if (toScope !== undefined && toScope !== fromScope) {
        // Revue 6.2 : la rangée est remontée dans une autre liste — le focus la suit.
        requestItemFocus(railStopKey(stopPointId));
      }
    },
    [draft.exercises, draft.stopPoints, draft.tourRepeatCount, openTourChoice, requestItemFocus, updateDraft],
  );
  const stopPointStepAction = useCallback(
    (stopPointId: string, direction: StepDirection): (() => void) | null =>
      stepAvailability.points.get(stopPointId)?.[direction] === true ? () => handleStepStopPoint(stopPointId, direction) : null,
    [handleStepStopPoint, stepAvailability],
  );

  /**
   * PRE-6 story 7.5 (D-442 amendée, recette J6 d-9) : suppression animée — fondu de la carte (et des
   * points retirés), puis glissement de ce qui suit (registre des translations, comme l'aperçu du
   * glisser), puis écriture du brouillon, REJOUÉE sur le brouillon courant. « Réduire les
   * animations », ou une disposition non mesurée : écrite aussitôt.
   */
  const startDeletion = useCallback(
    (activityId: string, choice: TourBoundaryChoice | null) => {
      // Revue 7.5 : une seule suppression animée à la fois.
      if (deletionRef.current !== null) return;
      const result = deletionResult(draft, activityId, choice);
      if (result === null || result === "CHOICE") return;
      // Story 7.7 : une copie encore en apparition est affichée pleinement (revue : seulement une fois
      // la suppression lancée).
      finishAppearance();
      const key = railRowKey(activityId);
      const opacity = new Animated.Value(1);
      let done = false;
      const commit = () => {
        if (done) return;
        done = true;
        deletionRef.current = null;
        // Revue 7.5 : rejouée sur le dernier brouillon ; si elle ne supprime plus rien (brouillon
        // changé entre-temps), la carte réapparaît et rien n'est annoncé.
        const replayed = deletionResult(draftRef.current, activityId, choice);
        if (replayed === null || replayed === "CHOICE") {
          opacity.setValue(1);
          setDeletion(null);
          return;
        }
        // Story 7.4 : translations JS à 0 avant les écritures de la nouvelle disposition.
        shiftRegistryRef.current?.prepareLayoutCommit();
        rowLayoutsRef.current.delete(key);
        updateDraft((current) => {
          const latest = deletionResult(current, activityId, choice);
          return latest === null || latest === "CHOICE" ? current : { ...current, ...latest.patch };
        });
        // Story 7.2 : points retirés, sans message visuel (annonce discrète).
        reportRemovedStopPoints(replayed.removed);
        setDeletion(null);
      };
      const layout = reduceMotion ? null : buildDragLayout();
      if (layout === null) {
        commit();
        return;
      }
      const fading: PendingDeletion = {
        key,
        fadingKeys: new Set([key, ...result.removed.map(railStopKey)]),
        opacity,
        layout,
        phase: "fade",
        commit,
        progress: { fadeDone: false, slideDone: false },
      };
      deletionRef.current = fading;
      setDeletion(fading);
    },
    [buildDragLayout, draft, finishAppearance, reduceMotion, reportRemovedStopPoints, updateDraft],
  );

  /**
   * PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498) : réponse au dialogue « Début de tour / Fin de
   * tour » — `choice` : la résolution du Domaine (`resolutions.HEAD` / `.TAIL`) est appliquée, REJOUÉE
   * sur l'état COURANT (sans conflit désormais, l'opération elle-même est appliquée) ; `null`
   * (« Annuler ») : rien ne change — une carte ou un point lâché revient à sa place en douceur, comme
   * après le dialogue de perte (story 5.2b). Les points retirés sont annoncés sans message visuel.
   */
  const resolveTourChoice = useCallback(
    (choice: TourBoundaryChoice | null) => {
      const request = pendingTourChoice;
      tourChoicePendingRef.current = false;
      setPendingTourChoice(null);
      if (request === null) return;
      const placementText = strings.screens.composition.placement;
      switch (request.kind) {
        case "OCCURRENCE_DELETE": {
          // Story 7.5 : « Annuler » ne supprime rien.
          if (choice !== null) startDeletion(request.activityId, choice);
          return;
        }
        case "OCCURRENCE_MOVE": {
          if (choice === null) {
            setDragSession((current) => endDragSession(current, true));
            return;
          }
          const focusKey = request.fromStep ? railRowKey(request.move.activityId) : undefined;
          const outcome = moveActivityTo({ ...request.move, tourChoice: choice }, focusKey);
          // Dialogue de perte ensuite (Séries) : l'élément reste tenu ; sinon fin de l'aperçu.
          if (outcome === "REFUSED") finishDragPreview(true);
          // Story 7.6 : appliqué — l'élément tenu glisse jusqu'à sa place.
          else if (outcome === "APPLIED") {
            finishAppliedDrop(heldDropSettlePose(dragPreview, draft, removedByMove(draft, { ...request.move, tourChoice: choice })));
          }
          return;
        }
        case "STOP_POINT_MOVE": {
          if (choice === null) {
            setDragSession((current) => endDragSession(current, true));
            return;
          }
          const resolve = (state: CompositionState): { readonly state: CompositionState; readonly removed: readonly string[] } | null => {
            const outcome = moveStopPoint(state, request.stopPointId, request.location);
            if (outcome.status === "CHOICE_REQUIRED") {
              const resolution = outcome.resolutions[choice];
              return { state: resolution.state, removed: resolution.removedStopPointIds };
            }
            return outcome.status === "APPLIED" && outcome.state !== state ? { state: outcome.state, removed: [] } : null;
          };
          const rendered = resolve(compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount));
          updateDraft((current) => {
            const currentState = compositionStateOf(current.exercises, current.stopPoints, current.tourRepeatCount);
            const replayed = resolve(currentState);
            return replayed === null ? current : { ...current, ...compositionPatch(currentState, replayed.state) };
          });
          // Story 7.4 : translations JS à 0 (regroupées avec les écritures ci-dessus). Revue 7.6 : le choix
          // peut placer le point ailleurs que l'emplacement lâché — aucune pose de mise en place.
          if (rendered !== null) finishAppliedDrop(null);
          else finishDragPreview(true);
          const kept = rendered?.state.stopPoints.some((point) => point.id === request.stopPointId) ?? true;
          // Pas « Monter » / « Descendre » : le focus suit le point s'il est conservé ; sinon (revue
          // 7.2) la carte qui précède son emplacement, à défaut le compteur du Circuit.
          let focusKey = request.fromStep && kept ? railStopKey(request.stopPointId) : undefined;
          if (request.fromStep && !kept) {
            const preceding = draft.exercises.filter((exercise) => exercise.structuralPosition === request.location.scope)[
              request.location.position - 1
            ];
            if (preceding !== undefined) {
              focusKey = railRowKey(preceding.id);
            } else if (request.location.scope === "IN_TOUR" && rendered !== null) {
              for (const id of rendered.removed) rowLayoutsRef.current.delete(railStopKey(id));
              focusOnNextFrame(() => circuitCounterRef.current, removedStopPointsAnnouncement(rendered.removed.length));
              return;
            }
          }
          if (rendered !== null && rendered.removed.length > 0) {
            reportRemovedStopPoints(rendered.removed, focusKey);
          } else if (focusKey !== undefined) {
            requestItemFocus(focusKey);
          }
          return;
        }
        case "PLACEMENT_STOP_POINT": {
          if (choice === null || placement === null) return;
          const resolve = (current: PlacementDraft): PlacementDraft => {
            const outcome = togglePlacementStopPointOutcome(current, request.location, placementContext);
            return outcome.status === "CHOICE_REQUIRED" ? outcome.resolutions[choice] : outcome.placement;
          };
          const next = resolve(placement);
          // Effet nommé : l'ajout retenu, ou le retrait d'un point existant de l'autre limite.
          // Revue 7.2 : l'effet est toujours nommé — ajout retenu, ou ajout abandonné (l'autre limite
          // est conservée) ; un sous-brouillon inchangé ne rend rien : annonce directe.
          const text = isPlacementStopPointAdded(next, request.location)
            ? placementText.stopPointAddedAnnouncement
            : placementText.additionCancelledAnnouncement;
          if (next === placement) {
            AccessibilityInfo.announceForAccessibility(text);
            return;
          }
          placementAnnouncementRef.current = { text, withLabel: true };
          setPlacement((current) => (current === null ? null : resolve(current)));
          return;
        }
        case "PLACEMENT_EXISTING_STOP_POINT": {
          if (choice === null || placement === null) return;
          const resolve = (current: PlacementDraft): PlacementDraft =>
            placementReselectionChoice(current, request.stopPointId, placementContext)?.resolutions[choice] ??
            togglePlacementStopPointRemoval(current, request.stopPointId, placementContext);
          const next = resolve(placement);
          // Revue 7.2 : point conservé (l'ajout est jeté), ou point non conservé (l'ajout est gardé ;
          // sous-brouillon inchangé : annonce directe).
          if (isPlacementStopPointRemoved(next, request.stopPointId)) {
            AccessibilityInfo.announceForAccessibility(placementText.stopPointKeepRefusedAnnouncement);
            if (next === placement) return;
            setPlacement((current) => (current === null ? null : resolve(current)));
            return;
          }
          placementAnnouncementRef.current = { text: placementText.stopPointKeptAnnouncement, withLabel: true };
          setPlacement((current) => (current === null ? null : resolve(current)));
          return;
        }
        case "CIRCUIT_COUNT": {
          if (choice === null) return;
          const resolve = (current: SessionDraft): CircuitCountResolution => {
            const outcome = circuitCountOutcome(current, request.count);
            return outcome.status === "CHOICE_REQUIRED"
              ? outcome.resolutions[choice]
              : { draft: outcome.draft, removedStopPointIds: outcome.removedStopPointIds };
          };
          const rendered = resolve(draft);
          updateDraft((current) => resolve(current).draft);
          reportRemovedStopPoints(rendered.removedStopPointIds);
          return;
        }
      }
    },
    [
      dragPreview,
      draft,
      finishAppliedDrop,
      finishDragPreview,
      moveActivityTo,
      pendingTourChoice,
      placement,
      placementContext,
      reportRemovedStopPoints,
      requestItemFocus,
      startDeletion,
      updateDraft,
    ],
  );

  // API-COM-06 : duplication et suppression restent des opérations de
  // BROUILLON — aucune écriture persistante avant l'enregistrement final.
  const handleDuplicateActivity = useCallback(
    (activityId: string) => {
      // Revue 7.5 : pendant une suppression animée (disposition figée), aucune autre opération.
      // Revue 7.7 : ni pendant le glisser d'un élément, son aperçu tenu ou sa mise en place.
      if (deletionRef.current !== null || draggedKeyRef.current !== null || dragPreview !== null || dragSession.settling !== null) {
        return;
      }
      setRevealedActionsId(null);
      const state = compositionStateOf(draft.exercises, draft.stopPoints, draft.tourRepeatCount);
      const newId = Crypto.randomUUID();
      // Revue 7.7 : le Domaine d'abord — rien n'est animé si la copie n'est pas créée.
      const duplicated = duplicateOccurrence(state, activityId, newId);
      if (duplicated === state) return;
      // Revue 7.7 : une copie précédente encore en apparition est affichée pleinement.
      finishAppearance();
      /*
       * PRE-6 story 7.7 (D-443) : la copie apparaît en fondu lent et les éléments suivants glissent
       * pour lui faire place. Le brouillon est écrit AUSSITÔT (contrairement à la suppression, écrite
       * à la fin) : la copie doit être dans la mise en page pour être affichée, et l'enregistrement,
       * la garde de sortie et les autres actions voient d'emblée le brouillon final. Avant le rendu,
       * les éléments suivants sont posés là où ils étaient (décalés de la copie), puis glissent vers
       * leur place ; « Réduire les animations » ou disposition non mesurée : sans mouvement.
       */
      const layout = reduceMotion ? null : buildDragLayout();
      const sourceKey = railRowKey(activityId);
      const sourceHeight = layout?.rows.find((row) => row.id === sourceKey)?.height;
      const insertion =
        layout === null || sourceHeight === undefined ? null : resolveInsertionPoses(layout, sourceKey, sourceHeight, DRAG_SHIFT_GAPS);
      if (insertion !== null) {
        const poses = new Map<string, number>(insertion.rows);
        poses.set(RAIL_KEYS.circuitHeader, insertion.circuitTop);
        poses.set(RAIL_KEYS.circuitEnd, insertion.circuitBottom);
        poses.set(RAIL_KEYS.afterCircuit, insertion.afterCircuit);
        poses.set(RAIL_KEYS.end, insertion.end);
        // Revue 7.7 : un élément encore en mouvement (copie précédente) part du reste de son chemin.
        shiftRegistryRef.current?.prepareLayoutCommit(poses, NO_CONTINUATION_EXCEPTIONS);
        setAppearance({ key: railRowKey(newId), opacity: new Animated.Value(0) });
      }
      // PRE-6 story 6.2 (D-441, arbitrage du 22/10/2026) : la copie n'emporte aucun point.
      updateDraft({
        ...compositionPatch(state, duplicated),
        // PRE-6 (story 2.3) : la copie reçoit la réserve de Circuit de sa source (Séries).
        ...copyCircuitReserveEntry(draft, activityId, newId),
      });
    },
    [buildDragLayout, dragPreview, dragSession.settling, draft, finishAppearance, reduceMotion, updateDraft],
  );

  /**
   * Suppression d'une occurrence. PRE-6 story 7.5 (D-442 amendée, remplace le refus doux de la story
   * 6.2) : toujours appliquée — les points qu'elle rendrait interdits ou consécutifs sont retirés sans
   * message ; un conflit de Tour ouvre le choix « Début de tour / Fin de tour » (comme le
   * déplacement). Une seule suppression animée à la fois.
   */
  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      setRevealedActionsId(null);
      // Revue 7.5 : ni pendant une autre suppression animée, ni pendant le glisser d'un élément.
      if (deletionRef.current !== null || draggedKeyRef.current !== null) return;
      const result = deletionResult(draft, activityId, null);
      if (result === null) return;
      if (result === "CHOICE") {
        if (openTourChoice({ kind: "OCCURRENCE_DELETE", activityId })) closeCircuitNatureMenu();
        return;
      }
      startDeletion(activityId, null);
    },
    [closeCircuitNatureMenu, draft, openTourChoice, startDeletion],
  );

  const handleEditActivity = useCallback(
    (activityId: string) => {
      closeCircuitNatureMenu();
      router.push({ pathname: "/exercise", params: { exerciseId: activityId } });
    },
    [closeCircuitNatureMenu, router],
  );
  // PRE-6 (story 2.1, RM-159) : durée de séance de l'en-tête — toutes les occurrences, sans
  // Compte à rebours ni Fin. Story 7.8 (D-443) : estimation arrondie aux 15 s, « ≈ » / « ≥ » ; la
  // durée du Circuit n'est plus affichée (en-tête du Circuit).
  const sessionDuration = formatCompositionSessionDuration({
    exercises: durationDraft.exercises,
    tourRepeatCount,
    circuitNature: draft.circuitNature,
  });

  // T01-S09 (AC-01/AC-02, CE-T01-11) : `Continuer` s'active uniquement pour
  // une Composition valide — `toCreateSessionInput` est la même validation
  // complète que celle utilisée à l'enregistrement final (selectedCategoryIds
  // est nécessairement vide à ce stade du parcours, sans effet sur ce
  // résultat : D-106 n'exige jamais de Catégorie). Un brouillon invalide ne
  // peut donc jamais être poursuivi ni, a fortiori, persisté.
  //
  // **T02-S01 (CE-T02-01, clarification n° 6 du verdict de revue)** : il faut
  // en outre qu'au moins un EXERCICE subsiste — « supprimer le dernier
  // Exercice rend `Continuer` indisponible », même si des Récupérations
  // subsistent. Une Récupération est une Activité structurellement valide
  // pour le Domaine (D-041) : cette exigence est propre au parcours de
  // Composition (CE-T01-04, « au moins un Exercice valide »), et reste donc
  // exprimée ici plutôt qu'en durcissant une validation de persistance qui
  // n'est pas ouverte par cette tranche.
  const hasAtLeastOneExercise = draft.exercises.some((exercise) => exercise.type === "EXERCISE");
  const isCompositionValid = hasAtLeastOneExercise && toCreateSessionInput(draft).ok;

  // T01-S10 (CE-T01-S10-01/02/09) : en MODIFICATION, la réhydratation d'une
  // Séance existante passe par des états intermédiaires. Le formulaire n'est
  // rendu qu'une fois le brouillon prêt (`"creating"` = création classique,
  // `"ready"` = brouillon réhydraté). Les autres états rendent un écran dédié
  // — jamais le formulaire avec des valeurs par défaut de création
  // (CE-T01-S10-09 : « un échec de chargement ne présente jamais les valeurs
  // par défaut d'une nouvelle Séance »). Placé après tous les hooks.
  //
  // **Correction non-flash (LOT_3_OF_3)** : `sessionId` non nul signifie
  // MODIFICATION. Tant que la réhydratation n'a pas produit son propre
  // statut, `editStatus` vaut encore `"creating"` (valeur initiale du
  // provider, l'effet de réhydratation ne s'exécutant qu'après le premier
  // commit) — cet état est ici requalifié `"loading"` de façon purement
  // SYNCHRONE et dérivée (aucun `useState`/`useEffect` supplémentaire, donc
  // aucune frame intermédiaire possible) : avec un `sessionId`, le
  // formulaire de création et ses valeurs par défaut ne peuvent
  // structurellement jamais être rendus avant résolution.
  const resolvedStatus = editStatus ?? "creating";
  const editState =
    sessionId !== null && resolvedStatus === "creating" ? "loading" : resolvedStatus;
  // Recette E du 28/10/2026 (Hermann, e5-12, r2-02) : une Séance archivée s'ouvre dans cette même
  // Composition, en lecture seule — aucun toucher sur le nom, les commandes, les cartes ou les
  // bornes (`ReadOnlyFrame`), défilement conservé ; « Continuer » remplacé par l'avis.
  const readOnly = editState === "consulting";
  if (editState !== "creating" && editState !== "ready" && editState !== "consulting") {
    return (
      <CompositionEditState
        status={editState}
        onRetry={() => retryHydration?.()}
        onBackToCatalogue={() => router.dismissTo("/")}
      />
    );
  }

  const contextHeader = (
    <CompositionContextHeader
      name={draft.name}
      onChangeName={(text) => updateDraft({ name: text })}
      onNameFocus={closeOverlay}
      sessionLabel={sessionLabel}
      sessionColor={sessionColor}
      onOpenLabelPicker={() => {
        closeCircuitNatureMenu();
        setIsLabelPickerOpen(true);
      }}
      sessionDuration={sessionDuration}
      onAdd={() => {
        closeCircuitNatureMenu();
        setIsAddActivityTreeOpen(true);
      }}
      onAddStop={enterPlacement}
      // PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : l'œil des Volumes, dans les
      // commandes contextuelles ; mêmes modales, même retour du focus (story 3.4).
      onOpenVolumes={openCircuitVolumes}
      volumesFocusRequest={volumesFocusRequest}
      isVolumesDisabled={draggedKey !== null}
      isPlacementActive={isPlacementActive}
      isAddStopDisabled={!hasPlacementOffer || draggedKey !== null}
      addStopFocusRequest={addStopFocusRequest}
      addStopAccessibilityHint={addStopAccessibilityHint}
      testID="composition-context-header"
    />
  );

  return (
    <ScreenShell>
      <FixedHeader
        title={composition.title}
        // PRE-6 (story 4.1) : pendant le placement, le X annule d'abord le placement (sans mutation).
        onBack={() => (placement !== null ? cancelPlacement() : router.back())}
        backAccessibilityLabel={composition.closeAccessibilityLabel}
        // PRE-6 (story 2.1, Figma `8328:28730`) : bouton fermer (X) — même action et même
        // garde d’abandon (`useCompositionExitGuard`) que le retour précédent.
        closeIcon
      />
      {/* Recette 3 (T-49, EXT-R3-2, D-353) : plus de trait gris entre l’en-tête et la
          zone de contexte — la courbe blanche sous Retour s’y raccorde directement. */}

      <ContextBand>
        {/* Recette 3 (T-49, EXT-R3-2 autorisée par Hermann le 12/10) : mêmes effets que
            la zone de contexte de l’éditeur (D-348), sur la couleur PROPRE de la
            Composition (bande partagée inchangée) — courbe blanche concentrique au
            bouton Retour (Ø 59,28) et fondu vers le fond blanc sur les 20 % inférieurs,
            en couches superposées (aucun interstice, donc aucun liseré). Dessinés en
            premier (sous le contenu), découpés à la bande, sans interaction ni
            exposition à l’accessibilité. */}
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.contextBandEffects}
          testID="composition-context-band-effects"
        >
          <View style={styles.contextBandFade} testID="composition-context-band-fade">
            {CONTEXT_BAND_FADE_LAYERS.map((layer) => (
              <View key={layer.top} style={[styles.contextBandFadeLayer, { top: layer.top, opacity: layer.opacity }]} />
            ))}
          </View>
          <View style={styles.backHalo} testID="composition-context-band-halo" />
        </View>
        {/*
         * PRE-6 (story 2.1, AD-41, Figma `8328:28608`) : nom, puce Étiquette, durée de séance
         * et bouton « + » (arbre d’ajout existant) — voir `CompositionContextHeader`. La couleur
         * de la Séance reste DÉRIVÉE de son Étiquette (V2-PRE-1), jamais écrite ici.
         */}
        {/* Consultation (recette E, e5-12) : même en-tête, sans toucher ; hors consultation, enfant direct inchangé. */}
        {readOnly ? (
          <View pointerEvents="none" testID="composition-read-only">
            {contextHeader}
          </View>
        ) : (
          contextHeader
        )}
      </ContextBand>

      {/*
       * R4-13 (`Fixed Header + Fixed Context + Scrollable Content + Fixed
       * Bottom Action`, `[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
       * ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `composition-body` est
       * désormais un unique `ScrollView` — le seul conteneur défilant de
       * l'écran. Header/séparateur/bande Context restent au-dessus, hors de
       * ce `ScrollView` (jamais recouverts) ; la zone d'action basse
       * (synthèse + `Continuer`) reste en dessous, également hors de ce
       * `ScrollView` (S-01 à S-04). `keyboardShouldPersistTaps="handled"` :
       * un appui sur une ligne/action de cette liste reste effectif même si
       * le champ Nom a le focus clavier, sans nécessiter un premier appui
       * « perdu » pour seulement fermer le clavier (même patron déjà
       * établi sur `ExerciseScreen.tsx`).
       *
       * **REWORK08-B, superséde par la correction VISUAL T01-S09 (point D)** :
       * les roulettes (Compte à rebours, Fin de séance) n'étaient jusqu'ici
       * pas rendues en flux mais restaient ANCRÉES en popover à l'intérieur
       * de ce `ScrollView` (`AnchoredRow`/`PopoverAnchor`, `position:
       * absolute` relatif à leur ligne). REWORK08-B avait diagnostiqué et
       * corrigé un défaut de portée de `zIndex` propre à ce mécanisme
       * d'ancrage local (un `ScrollView` élevé au-dessus du `backdrop`
       * partagé). La correction VISUAL retire désormais entièrement ce
       * mécanisme d'ancrage pour les roulettes — remplacé par
       * `WheelPickerOverlay`, une superposition plein écran TRANSVERSALE
       * (rendue en dehors de ce `ScrollView`, voir plus bas), dont la
       * position ne dépend structurellement plus ni de la ligne
       * déclenchrice ni du défilement (exigence explicite de la revue,
       * root cause du défaut historique de clipping/`zIndex` évoqué par
       * REWORK08-B, désormais éliminée par construction plutôt que
       * contournée). `AnchoredRow`/`PopoverAnchor`/`bodyElevated` sont
       * donc retirés de cet écran ; seul le mécanisme de superposition
       * dédié à la palette de couleur (`ContextBand.elevated`, gérée par
       * son propre composant, jamais une roulette numérique) reste
       * inchangé — hors périmètre de cette correction (D ne s'applique
       * qu'aux sélecteurs numériques à roulette).
       */}
      <ScrollView
        ref={bodyScrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: actionZone.scrollReserve }]}
        // Story 7.10 (revue) : l'indicateur de défilement s'arrête au haut de la zone d'action.
        scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
        keyboardShouldPersistTaps="handled"
        // T02-S01 (D-127/CE-T02-02) : pendant un déplacement de carte, le
        // défilement PAR L'UTILISATEUR est neutralisé — le geste vertical appartient alors
        // exclusivement à la carte soulevée, jamais à la liste. PRE-6 story 7.4 : la liste défile
        // alors seulement d'elle-même, près de ses bords (`useDragAutoScroll`).
        scrollEnabled={draggedKey === null}
        // Story 7.4 : décalage, contenu et zone visible du défilement automatique.
        onScroll={(event) => autoScroll.handleScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        // Revue 7.4 : sur iOS, le dernier `onScroll` d'un défilement peut être filtré (`scrollEventThrottle`).
        onScrollEndDrag={(event) => autoScroll.handleScroll(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => autoScroll.handleScroll(event.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_width, height) => autoScroll.handleContentSize(height)}
        onLayout={(event) => autoScroll.handleLayout(event.nativeEvent.layout.height)}
        // PRE-6 (story 3.1, RC-4) : faire défiler la liste referme le choix de nature du Circuit.
        onScrollBeginDrag={closeCircuitNatureMenu}
        testID="composition-body"
      >
        <ReadOnlyFrame readOnly={readOnly} style={styles.readOnlyBody}>
        {/* PRE-6 (story 3.1, RC-4) : zone d'appui extérieur du corps — voir `NatureOutsideZone`. */}
        {openOverlay === "circuitNature" ? (
          <NatureOutsideZone onPress={dismissNatureMenu} testID="composition-circuit-nature-outside" />
        ) : null}
        {/* PRE-6 (story 5.2, D-435) : plus de rail continu — chaque élément de la séquence porte ses
            segments (`compositionRail.ts`) ; le Compte à rebours porte son anneau et sa queue. */}
        {/* PRE-6 (story 4.1) : en placement, les bornes sont atténuées et non interactives. */}
        {/* Revue 5.2 : anneau et queue de la borne hors de l'atténuation du placement (opacité
            uniforme du rail), posés sur la rangée. */}
        {/* Story 7.8 (D-443) : cadre aligné à droite sur le bord droit des cartes d'Exercice. */}
        <View style={styles.boundaryTrailingOutset} testID="composition-boundary-countdown-step">
          <PlacementAttenuation active={isPlacementActive} testID="composition-boundary-countdown-placement">
            <BoundaryStep
              kind="start"
              railCenterX={RAIL_CENTER_X_IN_COLUMN}
              // Revue 6.2 : la puce d'un point en tête de séquence déborde dans l'écart.
              neighborSlop={countdownFollowedByStopPoint ? STOP_POINT_CHIP_TOUCH_EXTENT : 0}
              label={composition.countdown.label}
              value={formatBoundarySecondsValue(draft.initialCountdownSeconds)}
              isOpen={openOverlay === "countdown"}
              onPress={() => toggleOverlay("countdown")}
              testID="composition-boundary-countdown"
            />
          </PlacementAttenuation>
          <BoundaryRail kind="start" railCenterX={RAIL_CENTER_X_IN_COLUMN} testID="composition-boundary-countdown" />
        </View>

        {/*
         * UI-COMP-003 : une nouvelle Activité s'insère ICI — entre Compte à
         * rebours initial et Tour (`DEFAULT_STRUCTURAL_POSITION` =
         * `BEFORE_TOUR` depuis T02-S01), jamais après Tour par défaut, puis
         * peut être déplacée.
         *
         * **T02-S01 (CE-T02-01, AC-01)** : les Activités ne forment plus une
         * seule liste implicitement « dans le Tour » — elles sont réparties
         * dans les TROIS zones structurelles réelles, dont deux encadrent la
         * structure Tour et une lui est INTÉRIEURE. Chaque zone conserve son
         * conteneur (`exerciseList`) et sa règle : rendue uniquement si elle
         * contient au moins une Activité, pour ne jamais ajouter un `gap`
         * structurel à vide. **T02-S02 (continuation)** : cet écart et celui
         * de `bodyContent` partagent désormais `COMPOSITION_ROW_GAP`, ce qui
         * rend le rythme vertical régulier de bout en bout. Presser une carte
         * ouvre `/exercise` avec son propre
         * `exerciseId` (édition ciblée par identifiant) — jamais celui d'une
         * autre Activité.
         */}
        <ActivityZoneList
          zone="BEFORE_TOUR"
          testID="composition-zone-before-tour"
          items={zoneItems.BEFORE_TOUR}
          allOccurrences={draft.exercises}
          revealedActionsId={revealedActionsId}
          draggedKey={draggedKey}
          raisedKey={raisedKey}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          levelPositions={levelPositions}
          circuitContext={occurrenceCircuitContext}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          focusRequest={itemFocusRequest}
          onFocusConsumed={consumeItemFocus}
          onEdit={handleEditActivity}
          onRevealActions={handleRevealActions}
          onDragStart={handleRowDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDropItem}
          rail={sequenceRail}
          autoScroll={autoScroll}
          fading={deletionFading}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
          canStep={canStepActivity}
          onStep={handleStepActivity}
          stopPointStepAction={stopPointStepAction}
          placement={placementRowContext}
        />

        {/*
         * Conteneur Circuit (`Composition / Tour Section`, R4-12, REWORK07B) : seule surface du
         * bloc, déborde de `inset` de chaque côté ; il héberge l'en-tête du Circuit puis les
         * occurrences `IN_TOUR` (CE-T02-01). PRE-6 (story 3.1, AD-41, Figma `8328:28667`) :
         * `CircuitHeader` remplace `TourCard` et sa roulette du compte.
         */}
        <View
          style={[
            styles.tourSectionContainer,
            // Story 2.3b : tant que le Circuit n'est pas mesuré, fond statique du conteneur.
            circuitMeasuredHeight > 0 ? null : styles.tourSectionStaticSurface,
            // Correctif 2.3b : le Circuit qui porte la carte soulevée passe au-dessus de ses sœurs.
            zoneItems.IN_TOUR.some((item) => zoneItemKey(item) === raisedKey) ? styles.dragElevated : null,
          ]}
          onLayout={handleTourLayout}
          testID="composition-tour-section"
        >
          {/* PRE-6 (story 2.3b, amendement du 21/10/2026) : fond du conteneur mesuré, qui suit ses
              bords pendant le glisser — voir `CircuitSurface`. */}
          {circuitMeasuredHeight > 0 ? (
            <CircuitSurface
              top={circuitTopShift}
              bottom={circuitBottomShift}
              // Revue 7.5 : pendant une suppression, hauteur du Circuit relevée à son début.
              dragHeight={deletion !== null ? deletion.layout.tourBottom - deletion.layout.tourTop : dragSession.circuitHeight}
              testID="composition-tour-section-surface"
            />
          ) : null}
          {/* Zone propre au conteneur Circuit — voir `NatureOutsideZone`. */}
          {openOverlay === "circuitNature" ? (
            <NatureOutsideZone onPress={dismissNatureMenu} testID="composition-circuit-nature-outside-section" />
          ) : null}
          {/*
           * PRE-6 (story 5.2, Figma `9819:20017`) : rail de l'en-tête du Circuit — lien vers l'élément
           * précédent (marge haute du Circuit et écart de la séquence), anneau centré sur l'en-tête,
           * queue jusqu'au bas de l'en-tête. Story 2.3b : il suit le bord haut du Circuit.
           */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { transform: [{ translateY: circuitTopShift }] }]}
            testID="composition-sequence-marker-circuit-track"
          >
            {headerRailLink !== null ? (
              <RailLink
                centerX={RAIL_CENTER_X_IN_CIRCUIT}
                entryY={circuitHeaderRingTopY}
                length={headerRailLink.length}
                shift={circuitTopShift}
                prevShift={railShiftOf(headerRailLink.prevKey)}
                testID="composition-rail-link-circuit-header"
              />
            ) : null}
            <RailSegment
              centerX={RAIL_CENTER_X_IN_CIRCUIT}
              top={circuitHeaderRingTopY + RAIL_RING_DIAMETER}
              height={CIRCUIT_PADDING_VERTICAL + circuitHeaderHeight - circuitHeaderRingTopY - RAIL_RING_DIAMETER}
              testID="composition-rail-tail-circuit-header"
            />
            <RailRing
              centerX={RAIL_CENTER_X_IN_CIRCUIT}
              centerY={CIRCUIT_PADDING_VERTICAL + circuitHeaderHeight / 2}
              testID="composition-sequence-marker-circuit"
            />
          </Animated.View>
          <CircuitHeader
            nature={circuitNature}
            count={tourRepeatCount}
            // PRE-6 story 7.3 (D-442) : stepper toujours affiché ; chaque pas passe par
            // `circuitCountOutcome` (dialogue de Tour, story 7.2).
            onChangeCount={handleCircuitCountChange}
            // PRE-6 (story 3.2) : un seul contrôle ouvert à la fois (CIR-10).
            isNatureMenuOpen={openOverlay === "circuitNature"}
            onOpenNatureMenu={() => toggleOverlay("circuitNature")}
            onCloseNatureMenu={dismissNatureMenu}
            onSelectNature={handleSelectNature}
            natureFocusRequest={natureFocusRequest}
            counterRef={circuitCounterRef}
            // PRE-6 (story 4.1) : stepper et pastille inactifs en placement. Story 5.1b : l'œil des
            // Volumes est passé dans la zone de contexte (`CompositionContextHeader`).
            isAttenuated={isPlacementActive}
            // Story 7.3 (revue) : un dialogue de Tour en attente arrête un maintien de − / +.
            isChoicePending={pendingTourChoice !== null}
            // PRE-6 (story 2.3b) : l'en-tête suit le bord haut du Circuit pendant le glisser.
            translateY={circuitTopShift}
            // PRE-6 (story 5.2) : le titre laisse la colonne de l'anneau (x 69 à 402).
            titleInset={SEQUENCE_LABEL_INSET}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setCircuitHeaderLayout((current) =>
                current !== null && current.y === y && current.height === height ? current : { y, height },
              );
            }}
            testID="composition-circuit-header"
          />
          <ActivityZoneList
            zone="IN_TOUR"
            testID="composition-zone-in-tour"
            items={zoneItems.IN_TOUR}
            allOccurrences={draft.exercises}
            revealedActionsId={revealedActionsId}
            draggedKey={draggedKey}
            raisedKey={raisedKey}
            bodyZonesReferential={bodyZonesReferential}
            categoriesReferential={categoriesReferential}
            levelPositions={levelPositions}
            circuitContext={occurrenceCircuitContext}
            onLayout={handleZoneLayout}
            onRowLayout={handleRowLayout}
            focusRequest={itemFocusRequest}
            onFocusConsumed={consumeItemFocus}
            onEdit={handleEditActivity}
            onRevealActions={handleRevealActions}
            onDragStart={handleRowDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDropItem}
            rail={sequenceRail}
            autoScroll={autoScroll}
            fading={deletionFading}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
            canStep={canStepActivity}
            onStep={handleStepActivity}
            stopPointStepAction={stopPointStepAction}
            placement={placementRowContext}
          />
          {/*
           * PRE-6 (story 5.2) : bas du Circuit — lien de la dernière ancre du Circuit (média ou anneau
           * de l'en-tête) jusqu'au bord bas, qui suit le bas du Circuit pendant le glisser. Porté par
           * le conteneur : il reste au-dessus de son fond, même quand le Circuit passe au premier plan.
           */}
          {circuitEndRailLink !== null ? (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { transform: [{ translateY: circuitBottomShift }] }]}
              testID="composition-rail-circuit-end-track"
            >
              <RailLink
                centerX={RAIL_CENTER_X_IN_CIRCUIT}
                anchorBottom
                length={circuitEndRailLink.length}
                // Story 5.2b : la marge basse du Circuit est la surface propre de son bas.
                minLength={CIRCUIT_PADDING_VERTICAL}
                shift={circuitBottomShift}
                prevShift={railShiftOf(circuitEndRailLink.prevKey)}
                testID="composition-rail-link-circuit-end"
              />
            </Animated.View>
          ) : null}
        </View>

        {/*
         * Rangée « après le Circuit » : en placement, l'emplacement (point d'arrêt seul, story 4.1) ;
         * hors placement, le point « après le Circuit » (story 4.2, `8328:29428`), centré sous le
         * Circuit (story 5.2, `9819:20018`). Story 2.3b : elle suit le bas du Circuit pendant le
         * glisser. Story 5.2 : le rail la traverse (lien vers le bas du Circuit, queue sur toute sa
         * hauteur, point de raccord au centre d'un point d'arrêt) ; dessiné AVANT son contenu, il
         * passe sous les puces.
         */}
        {hasAfterCircuitRail ? (
          <Animated.View
            style={{ transform: [{ translateY: afterCircuitShift }] }}
            testID="composition-after-circuit-line-track"
          >
            {afterCircuitRailLink !== null ? (
              <RailLink
                centerX={RAIL_CENTER_X_IN_COLUMN}
                entryY={0}
                length={afterCircuitRailLink.length}
                shift={afterCircuitShift}
                prevShift={railShiftOf(afterCircuitRailLink.prevKey)}
                testID="composition-rail-link-after-circuit"
              />
            ) : null}
            <RailSegment centerX={RAIL_CENTER_X_IN_COLUMN} top={0} bottom={0} testID="composition-rail-tail-after-circuit" />
            {/* PRE-6 (story 5.3, `8328:29270`) : puce centrée, cible bornée aux écarts de la
                séquence (Circuit au-dessus, première occurrence après le Circuit en dessous). */}
            {placement !== null && afterCircuitRowPoint !== null ? (
              <PlacementStopPointRow
                point={afterCircuitRowPoint}
                placement={placement}
                onToggleStopPoint={handlePlacementStopPointToggle}
                onToggleExistingStopPoint={handlePlacementExistingStopPointToggle}
                // Revue 6.3 : suivie d'une rangée de point non proposé (tête de la zone après le
                // Circuit), la cible s'arrête au milieu de l'écart.
                touchExtent={{
                  top: SEQUENCE_GAP,
                  bottom: zoneItems.AFTER_TOUR[0]?.kind === "STOP_POINT" ? SEQUENCE_GAP / 2 : SEQUENCE_GAP,
                }}
                testID="composition-placement-slot-after-circuit"
              />
            ) : null}
          </Animated.View>
        ) : null}

        <ActivityZoneList
          zone="AFTER_TOUR"
          precededByPlacementRow={hasAfterCircuitRail}
          testID="composition-zone-after-tour"
          items={zoneItems.AFTER_TOUR}
          allOccurrences={draft.exercises}
          revealedActionsId={revealedActionsId}
          draggedKey={draggedKey}
          raisedKey={raisedKey}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          levelPositions={levelPositions}
          circuitContext={occurrenceCircuitContext}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          focusRequest={itemFocusRequest}
          onFocusConsumed={consumeItemFocus}
          onEdit={handleEditActivity}
          onRevealActions={handleRevealActions}
          onDragStart={handleRowDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDropItem}
          rail={sequenceRail}
          autoScroll={autoScroll}
          fading={deletionFading}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
          canStep={canStepActivity}
          onStep={handleStepActivity}
          stopPointStepAction={stopPointStepAction}
          placement={placementRowContext}
        />

        {/* PRE-6 (story 2.3b) : « Fin de séance » suit le décalage net du geste (`end`). */}
        <Animated.View
          // Story 7.8 (D-443) : cadre aligné à droite sur le bord droit des cartes d'Exercice.
          style={[styles.boundaryTrailingOutset, { transform: [{ translateY: endShift }] }]}
          testID="composition-boundary-final-phase-track"
        >
          <PlacementAttenuation active={isPlacementActive} testID="composition-boundary-final-phase-placement">
            <BoundaryStep
              kind="end"
              railCenterX={RAIL_CENTER_X_IN_COLUMN}
              // Revue 5.2 : la puce d'un point d'arrêt juste au-dessus déborde dans l'écart.
              neighborSlop={finPrecededByStopPoint ? STOP_POINT_CHIP_TOUCH_EXTENT : 0}
              label={composition.finalPhase.label}
              value={formatBoundarySecondsValue(draft.finalPhaseSeconds)}
              isOpen={openOverlay === "finalPhase"}
              onPress={() => toggleOverlay("finalPhase")}
              ref={finalBoundaryRef}
              testID="composition-boundary-final-phase"
            />
          </PlacementAttenuation>
          <BoundaryRail kind="end" railCenterX={RAIL_CENTER_X_IN_COLUMN} testID="composition-boundary-final-phase" />
          {/* PRE-6 (story 5.2) : lien de Fin de séance, hors atténuation, jusqu'au haut de son anneau. */}
          {endRailLink !== null ? (
            <RailLink
              centerX={RAIL_CENTER_X_IN_COLUMN}
              entryY={BOUNDARY_RING_TOP}
              length={endRailLink.length}
              shift={endShift}
              prevShift={railShiftOf(endRailLink.prevKey)}
              testID="composition-rail-link-end"
            />
          ) : null}
        </Animated.View>

        {/*
         * PRE-6 (story 3.2) — Android / web : panneau du choix de nature, hébergé par le contenu
         * défilant (qui le contient entièrement : sur Android, un toucher hors des limites d'un
         * parent n'atteint pas ses enfants), rendu en dernier pour passer au-dessus des étapes.
         * Aligné à droite sur le bord droit du contenu (story 7.8 : le stepper y est calé), sous
         * l'en-tête du Circuit ;
         * jamais rendu avant la mesure de l'en-tête.
         */}
        {openOverlay === "circuitNature" && circuitHeaderLayout !== null && circuitHeaderLayout.height > 0 ? (
          <CircuitNaturePanel
            nature={circuitNature}
            placement={{
              top:
                circuitSectionTop + circuitHeaderLayout.y + circuitHeaderLayout.height + CIRCUIT_NATURE_PANEL_GAP,
              right: styles.bodyContent.paddingRight,
            }}
            onDismiss={dismissNatureMenu}
            onSelect={handleSelectNature}
            testID="composition-circuit-header-counter-nature-panel"
          />
        ) : null}
        </ReadOnlyFrame>
      </ScrollView>

      {/*
       * CMP-06 (contre-recette iPhone, correction consolidée, 2026-09-03) :
       * zone d'action basse (`bottomAction`) — fixe depuis PRE-6 story 7.10.
       *
       * REWORK09 (mission directe utilisateur, 2026-09-04, point 2
       * « CORRECTIONS CONNEXES — COMPOSITION ») : la ligne de synthèse
       * `0 activité · 0 min` précédemment affichée ICI est **supprimée** —
       * devenue redondante depuis REWORK08-C (synthèse affichée sous le titre
       * du Circuit, elle-même retirée par PRE-6 story 7.8 : seule la durée de
       * la Séance, dans la zone de contexte, demeure). `Continuer`
       * reste seul dans cette zone ; le style `summary` (devenu sans
       * consommateur) est supprimé avec elle plutôt que laissé mort.
       */}
      {/*
       * PRE-6 story 7.10 (D-444, remplace le pied de la story 7.9) : zone d'action principale fixe
       * et standard — « Continuer » et la barre de placement au même emplacement, au-dessus de la
       * zone de sécurité, sur le dégradé blanc ; aucun saut au changement de mode (même hauteur 48).
       */}
      <PrimaryActionZone
        onContentHeightChange={actionZone.onContentHeightChange}
        contentStyle={styles.bottomAction}
        testID="composition-bottom-action"
      >
        {/*
         * PRE-4, décision Q54 de Hermann (2026-10-18) : l'action enregistre depuis la Composition
         * (l'écran vestige `Catégories de la séance` est supprimé). PRE-6 (story 2.1, D-388,
         * Figma `8328:28732`) : libellé « Continuer », même flux `handleSave`.
         * Activation conditionnelle inchangée (Composition valide, `isCompositionValid`),
         * inactif pendant l'enregistrement ; échec : message D-107 au-dessus de l'action.
         */}
        {/* PRE-6 (story 4.1, `8328:29423`) : en placement, la barre remplace « Continuer ». */}
        {confirmation !== null ? (
          <PlacementBar
            confirmation={confirmation}
            onConfirm={confirmPlacement}
            onCancel={cancelPlacement}
            testID="composition-placement-bar"
          />
        ) : null}
        {placement === null && (saveState === "error" || saveState === "nameTaken") ? (
          <Text style={styles.saveErrorText} accessibilityLiveRegion="polite" testID="composition-save-error">
            {saveState === "nameTaken" ? composition.nameTakenError : composition.saveError}
          </Text>
        ) : null}
        {readOnly ? (
          <Text style={styles.readOnlyNotice} accessibilityLiveRegion="polite" testID="composition-read-only-notice">
            {composition.consultation.notice}
          </Text>
        ) : null}
        {placement === null && !readOnly ? (
          <PrimaryActionButton
            label={composition.saveAction}
            onPress={handleSave}
            disabled={!isCompositionValid || saveState === "saving"}
            testID="composition-save-action"
          />
        ) : null}
      </PrimaryActionZone>

      {/*
       * T01-S09, correction VISUAL (point D) : chaque roulette numérique
       * s'ouvre désormais dans `WheelPickerOverlay`, une superposition
       * plein écran rendue ici — frère direct de `ScreenShell`, jamais un
       * descendant du `ScrollView` défilant ni ancrée à sa ligne
       * déclenchrice — voir ce composant pour la justification complète.
       */}
      <WheelPickerOverlay visible={openOverlay === "countdown"}>
        {/* PRE-6 story 7.8 (D-443) : 0..60 s, pas 1 s, secondes seulement — une seule colonne. */}
        <NumberWheelPicker
          value={draft.initialCountdownSeconds}
          targetBounds={SESSION_BOUNDARY_WHEEL_BOUNDS}
          onValidate={(seconds) => {
            updateDraft({ initialCountdownSeconds: seconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          // Revue 7.8 : la roulette (une seule colonne) porte le nom de sa borne.
          accessibilityLabel={composition.countdown.label}
          valueAccessibilityLabel={formatBoundarySecondsValue}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>
      <WheelPickerOverlay visible={openOverlay === "finalPhase"}>
        {/* PRE-6 story 7.8 (D-443) : 0..60 s, pas 1 s, secondes seulement — une seule colonne. */}
        <NumberWheelPicker
          value={draft.finalPhaseSeconds}
          targetBounds={SESSION_BOUNDARY_WHEEL_BOUNDS}
          onValidate={(seconds) => {
            updateDraft({ finalPhaseSeconds: seconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          accessibilityLabel={composition.finalPhase.label}
          valueAccessibilityLabel={formatBoundarySecondsValue}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>

      {/*
       * PRE-6 (story 4.1, `8328:28733`) : roulette « Durée de récupération » d'une zone du placement —
       * 0..300 s sur la grille 1 / 5 / 30 s (CE-T03-08 §14). Story 7.2 (D-442) : ouverte par le
       * toucher d'une zone NON sélectionnée, sur la durée existante, sinon sur le défaut du Profil une
       * fois résolu. ✓ sélectionne la zone à la durée choisie (0 conservé comme présent, D-323) ; ✕ la
       * laisse telle qu'elle était.
       */}
      {(() => {
        // Revue 7.2 : une durée existante non finie (donnée corrompue) ouvre sur le défaut du Profil.
        const existingSeconds = recoveryWheel !== null && Number.isFinite(recoveryWheel.seconds) ? recoveryWheel.seconds : null;
        const wheelSeconds = recoveryWheel === null ? null : (existingSeconds ?? recoveryDefaultSeconds);
        const isWheelOpen = placement !== null && wheelSeconds !== null;
        return (
          <WheelPickerOverlay visible={isWheelOpen}>
            {isWheelOpen ? (
              <DurationWheelPicker
                totalSeconds={wheelSeconds}
                valueGrid={RECOVERY_WHEEL_VALUES}
                title={composition.placement.recoveryWheelTitle}
                onValidate={validatePlacementRecovery}
                onCancel={() => setRecoveryWheel(null)}
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
                cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
                validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
              />
            ) : null}
          </WheelPickerOverlay>
        );
      })()}

      {/* PRE-6 story 7.2 (D-442) : choix « Début de tour / Fin de tour » (dialogue natif). */}
      {pendingTourChoice !== null ? (
        <TourBoundaryChoiceDialog
          key={tourChoiceToken}
          onChoose={(choice) => resolveTourChoice(choice)}
          onCancel={() => resolveTourChoice(null)}
        />
      ) : null}

      {/* PRE-6 (story 3.4, CE-CIR-03, Figma `8328:34965` / `8328:35135`) : feuille en lecture
          seule, alimentée par la seule grille du Domaine ; sa fermeture n'écrit rien. */}
      {isVolumesSheetMounted ? (
        <CircuitVolumesSheet
          visible={openOverlay === "circuitVolumes"}
          volumes={volumes}
          onClose={closeCircuitVolumes}
          onDismissed={handleCircuitVolumesDismissed}
          testID="composition-circuit-volumes"
        />
      ) : null}

      {isPendingExit && placement === null ? (
        <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}

      {/* PRE-6 (story 3.2, Figma `8328:34964`) : conversion Tours → Séries avec perte. Annuler (ou
          le retour système) : nature, compte et valeurs inchangés ; le voile ne confirme pas. */}
      {pendingNatureChange !== null ? (
        <CircuitEntryConfirmModal
          kind="NATURE"
          seriesCount={tourRepeatCount}
          onCancel={cancelNatureChange}
          onConfirm={confirmNatureChange}
        />
      ) : null}

      {/* PRE-6 (story 2.3) : perte de séries d'un déplacement dans le Circuit de Séries. */}
      {pendingCircuitEntry !== null ? (
        <CircuitEntryConfirmModal
          kind="MOVE"
          seriesCount={pendingCircuitEntry.targetCount}
          exerciseCount={1}
          onCancel={() => {
            setPendingCircuitEntry(null);
            // Story 2.3b : l'aperçu conservé pendant le dialogue revient en douceur.
            setDragSession((current) => endDragSession(current, true));
          }}
          onConfirm={() => {
            // Déplacement rejoué sur le brouillon courant : une modification survenue pendant
            // le dialogue n'est jamais écrasée.
            const plan = planOccurrenceMove(draft, pendingCircuitEntry);
            setPendingCircuitEntry(null);
            const applied = plan?.status === "PLAN";
            if (plan?.status === "PLAN") {
              updateDraft(plan.patch);
              // Story 7.2 (D-442) : points retirés par le déplacement tolérant (ou le choix de Tour).
              reportRemovedStopPoints(plan.removedStopPointIds, pendingCircuitEntry.focusKey);
            }
            // Story 2.3b, 7.6 : appliqué → la carte tenue glisse jusqu'à sa place ; sinon, retour.
            if (applied) finishAppliedDrop(heldDropSettlePose(dragPreview, draft, plan.removedStopPointIds));
            else finishDragPreview(true);
          }}
        />
      ) : null}

      {/*
       * V2-CAT-01 (plan §4.4), VISUAL_CORRECTION (revue indépendante
       * 5753653735, point 7) : arbre exact `Une nouvelle activité` / `Une
       * activité existante` / `Annuler` — comportement PRÉSERVÉ à
       * l'identique (`Une nouvelle activité` crée une `SessionActivity`
       * locale, route `/exercise` ; `Une activité existante` ouvre la
       * sélection multiple, `/activity-selection` ; `Annuler` ferme sans
       * écriture). Seuls format/dimensions/ordre/scrim/z-order sont
       * corrigés :
       * - `top` inclut désormais la hauteur RÉELLE cumulée de l'en-tête
       *   fixe, de son séparateur et de la bande Context (même calcul que
       *   `CatalogueCreateOptions.menuTop`), jamais seulement
       *   `contextBand.height` (l'arbre chevauchait l'en-tête) ;
       * - le voile porte désormais un fond VISIBLE (`colors.overlayScrim`,
       *   même token que `CatalogueCreateOptions`), jamais transparent
       *   (`styles.backdrop`, partagé avec la palette de couleur, reste lui
       *   inchangé) ;
       * - rendu en DERNIER, après le `ScrollView` et `bottomAction` (React
       *   Native empile par ORDRE DE RENDU, `position: "absolute"` ne
       *   change rien à cet ordre) : l'arbre peint désormais AU-DESSUS de
       *   tout le reste de l'écran, jamais dessous.
       */}
      {isAddActivityTreeOpen ? (
        <>
          <Pressable
            onPress={() => setIsAddActivityTreeOpen(false)}
            accessible={false}
            testID="composition-add-activity-tree-backdrop"
            style={styles.addActivityTreeScrim}
          />
          <View
            style={[styles.addActivityTree, { top: addActivityTreeTop }]}
            testID="composition-add-activity-tree"
          >
            <Pressable
              onPress={() => {
                setIsAddActivityTreeOpen(false);
                router.push("/exercise");
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.newActivity}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-new"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.newActivity}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsAddActivityTreeOpen(false);
                router.push("/activity-selection");
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.existingActivity}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-existing"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.existingActivity}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsAddActivityTreeOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.cancel}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-cancel"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.cancel}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {isLabelPickerOpen ? (
        <LabelPickerModal
          selectedId={draft.labelId}
          onSelect={(labelId) => updateDraft({ labelId })}
          // Q53 (8) : l'Étiquette supprimée depuis la feuille de cette Séance quitte son Brouillon.
          onLabelRetired={(labelId) => {
            if (draft.labelId === labelId) updateDraft({ labelId: null });
          }}
          onClose={() => {
            setIsLabelPickerOpen(false);
            setLabelsLoadToken((current) => current + 1);
          }}
        />
      ) : null}
    </ScreenShell>
  );
}

type ActivityZoneListProps = {
  readonly zone: StructuralPosition;
  readonly testID: string;
  /** PRE-6 story 6.2 (D-441) : éléments de la zone — occurrences et, hors placement, points. */
  readonly items: readonly ZoneItem[];
  /** Revue 6.2 : toutes les occurrences de la Séance (homonymes dans le nom d'un point). */
  readonly allOccurrences: readonly SessionDraftExercise[];
  readonly revealedActionsId: string | null;
  /** Clé de l'élément soulevé (carte ou point). */
  readonly draggedKey: string | null;
  /** Story 5.2b : élément au premier plan (soulevé, maintenu ou en retour). */
  readonly raisedKey: string | null;
  readonly bodyZonesReferential: readonly BodyZone[];
  readonly categoriesReferential: readonly Category[];
  /** PRE-7 (R-6, C06) : positions de niveau par mouvement (suffixe « - Nn »). */
  readonly levelPositions: ReadonlyMap<string, MovementLevelPosition>;
  readonly circuitContext: OccurrenceCircuitContext;
  readonly onLayout: (zone: StructuralPosition, event: LayoutChangeEvent) => void;
  /** Mesure d'une rangée, par clé d'élément et zone (revue 6.2). */
  readonly onRowLayout: (key: string, zone: StructuralPosition, event: LayoutChangeEvent) => void;
  /** Revue 6.2 : focus d'accessibilité demandé sur un élément (clé de rail), consommé une fois porté. */
  readonly focusRequest: ItemFocusRequest | null;
  readonly onFocusConsumed: (token: number) => void;
  readonly onEdit: (activityId: string) => void;
  readonly onRevealActions: (activityId: string | null) => void;
  /**
   * Début (clé) ou interruption (`null`, position atteinte) du glisser d'une carte ou d'un point ;
   * `false` : soulèvement refusé (un autre élément est soulevé, géométrie incomplète).
   */
  readonly onDragStart: (key: string | null, translationY?: number) => boolean;
  /** PRE-6 (story 2.3b) : position de l'élément glissé, à chaque mouvement du doigt. */
  readonly onDragMove: (key: string, translationY: number) => void;
  readonly onDragEnd: (key: string, zone: StructuralPosition, translationY: number) => void;
  /**
   * PRE-6 (story 2.3b, story 5.2) : translations animées partagées (décalage de chaque carte pendant
   * le glisser) et liens du rail segmenté.
   */
  readonly rail: SequenceRailContext;
  /** PRE-6 story 7.4 : défilement automatique pendant le glisser. */
  readonly autoScroll: DragAutoScroll;
  /** PRE-6 story 7.5 : éléments supprimés en cours d'effacement (fondu), ou `null`. */
  readonly fading: DeletionFading | null;
  readonly onDuplicate: (activityId: string) => void;
  readonly onDelete: (activityId: string) => void;
  /** PRE-6 (story 2.3) : « Monter » / « Descendre » possible pour cette occurrence ? */
  readonly canStep: (activityId: string, direction: StepDirection) => boolean;
  readonly onStep: (activityId: string, direction: StepDirection) => void;
  /** PRE-6 story 6.2 : « Monter » / « Descendre » d'un point, `null` si refusé. */
  readonly stopPointStepAction: (stopPointId: string, direction: StepDirection) => (() => void) | null;
  /** PRE-6 (story 4.1) : contexte du mode placement ; `null` hors placement. */
  readonly placement: PlacementRowContext | null;
  /** Revue 6.3 : en placement, la rangée « après le Circuit » précède immédiatement cette zone. */
  readonly precededByPlacementRow?: boolean;
};

/**
 * PRE-6 (story 4.1, AD-43) : ce que chaque occurrence reçoit en placement — sous-brouillon,
 * emplacement de l'occurrence (Domaine, `placementSlots`) et actions des puces.
 */
type PlacementRowContext = {
  readonly draft: PlacementDraft;
  readonly slotFor: (occurrenceId: string) => PlacementSlot | null;
  /** Story 6.3 : point d'arrêt rendu pour un emplacement (existant ou à ajouter), `null` sans point. */
  readonly rowPointOf: (stopPoint: PlacementStopPointSlot | null) => PlacementStopPointRowPoint | null;
  /** Story 7.2 (D-442) : emplacement libre (ou ajouté) de tête de Circuit, `null` s'il n'est pas dessiné. */
  readonly circuitHeadRowPoint: PlacementStopPointRowPoint | null;
  /** Story 7.2 (D-442) : toucher d'une zone de récupération (désélection, ou roulette). */
  readonly onPressRecovery: (occurrenceId: string) => void;
  /** Emplacement libre ou ajouté : bascule de l'ajout. */
  readonly onToggleStopPoint: (location: StopPointLocation) => void;
  /** Revue 6.3 : point existant, bascule de son retrait programmé par identifiant (et annonce). */
  readonly onToggleExistingStopPoint: (stopPointId: string) => void;
};

/** Noms accessibles du placement (story 6.3) : points existants (par identifiant) et emplacements à ajouter. */
type PlacementLabeler = {
  readonly existing: (stopPointId: string) => string;
  readonly available: (location: StopPointLocation) => string;
};

/**
 * PRE-6 story 6.3 : noms du placement par la règle de la story 6.2 (`stopPointAnchor` sur la séquence
 * mêlée de la portée). Revue 6.3 : un emplacement à ajouter suit la même règle — « Ajouter un point
 * d'arrêt après {dernier Exercice qui précède}[, n sur m] », « … après le circuit » sans Exercice.
 */
function placementLabelerOf(
  exercises: readonly SessionDraftExercise[],
  stopPoints: readonly StopPoint[],
  levelPositions: ReadonlyMap<string, MovementLevelPosition>,
): PlacementLabeler {
  const t = strings.screens.composition.placement;
  const existing = new Map<string, string>();
  for (const scope of STOP_POINT_SCOPE_ORDER) {
    const items = scopeSequence(exercises, stopPoints, scope);
    items.forEach((item, index) => {
      if (item.kind === "STOP_POINT") {
        existing.set(item.point.id, stopPointRowAccessibilityLabel(items, index, scope, exercises, levelPositions));
      }
    });
  }
  return {
    existing: (stopPointId) => existing.get(stopPointId) ?? t.stopPoint,
    available: (location) => {
      const candidate: StopPoint = { id: "", scope: location.scope, position: location.position };
      const items = scopeSequence(exercises, [candidate], location.scope);
      const anchor = stopPointAnchor(
        items,
        items.findIndex((item) => item.kind === "STOP_POINT"),
        exercises,
        levelPositions,
      );
      if (anchor !== null) return t.addStopPointAccessibilityLabel.replace("{exercise}", () => anchor);
      // Story 7.2 (D-442) : tête de Circuit (début de Tour) ; sinon « après le circuit ».
      return location.scope === "IN_TOUR" ? t.addStopPointAtCircuitStartAccessibilityLabel : t.addStopPointAfterCircuitAccessibilityLabel;
    },
  };
}

/**
 * Revue 6.3 : ce que le placement offre — un ajout, ou le retrait d'un point existant identifié.
 * Story 7.2 (D-442) : l'emplacement de tête de Circuit est dessiné (un ajout comme un autre) ; une
 * récupération existante (0 comprise) se modifie et se retire en placement, seul chemin de son
 * réglage : elle suffit à l'ouvrir.
 */
function placementOfferOf(slots: readonly PlacementSlot[]): {
  readonly any: boolean;
  readonly additions: boolean;
  /** Une récupération existante (modifiable ou retirable) est offerte. */
  readonly recoveries: boolean;
} {
  const additions = slots.some(
    (slot) => slot.recovery?.kind === "AVAILABLE" || (slot.stopPoint !== null && !slot.stopPoint.existing),
  );
  const recoveries = slots.some((slot) => slot.recovery?.kind === "EXISTING");
  const removals = recoveries || slots.some((slot) => slot.stopPoint?.existing === true && slot.stopPoint.stopPointId !== undefined);
  return { any: additions || removals, additions, recoveries };
}

/** Ce dont `placementRowPointOf` a besoin (story 6.3). */
type PlacementRowEnvironment = {
  readonly labels: PlacementLabeler | null;
  readonly placement: PlacementDraft;
  readonly context: PlacementContext;
  /** Emplacements occupés à l'écran par un point non proposé (`displayedStopPointLocation`). */
  readonly hiddenKeys: ReadonlySet<string> | null;
};

/**
 * PRE-6 story 6.3 (D-441, R3) : point d'arrêt rendu pour l'emplacement `stopPoint` en placement ;
 * `null` sans point. Revue 6.3 :
 * - existant : visé par son identifiant (un point sans identifiant, jamais dans un brouillon, n'est
 *   pas rendu) ; `blocked` si son retrait est programmé et que le Domaine en refuserait l'annulation ;
 * - libre : jamais proposé sur l'emplacement où est dessiné un point non proposé (`hiddenKeys`).
 */
function placementRowPointOf(
  stopPoint: PlacementStopPointSlot | null,
  env: PlacementRowEnvironment,
): PlacementStopPointRowPoint | null {
  if (stopPoint === null || env.labels === null) return null;
  if (!stopPoint.existing) {
    const location = stopPoint.location;
    if (env.hiddenKeys?.has(stopPointKey(location)) === true && !isPlacementStopPointAdded(env.placement, location)) {
      return null;
    }
    return { kind: "AVAILABLE", location, accessibilityLabel: env.labels.available(location) };
  }
  const id = stopPoint.stopPointId;
  if (id === undefined) return null;
  // Story 7.2 (D-442) : une resélection qui demande un choix de Tour n'est pas bloquée (dialogue).
  const blocked =
    isPlacementStopPointRemoved(env.placement, id) &&
    togglePlacementStopPointRemoval(env.placement, id, env.context) === env.placement &&
    placementReselectionChoice(env.placement, id, env.context) === null;
  return { kind: "EXISTING", stopPointId: id, accessibilityLabel: env.labels.existing(id), blocked };
}

/**
 * PRE-6 story 6.2 : repère du nom d'un point au rang `index` de la séquence mêlée `items` — le dernier
 * SÉPARATEUR qui le précède (un Exercice, RM-251 : `isSequenceSeparator`), suivi de sa position
 * « n sur m » dans la zone quand un homonyme existe ; `null` en tête de portée. Revue 6.3 : partagé
 * par les points existants et les emplacements à ajouter.
 */
/**
 * PRE-7 (R-6, D-445 C06) : nom affiché d'une occurrence — suffixe de niveau « - Nn » puis suffixe
 * de copie (Q3) ; même nom pour la carte, son nom accessible et les points d'arrêt qui la suivent.
 */
function occurrenceCardName(
  occurrence: SessionDraftExercise,
  levelPositions: ReadonlyMap<string, MovementLevelPosition>,
): string {
  return occurrenceDisplayName(
    withLevelSuffix(occurrence.name, levelPositions.get(occurrence.sourceMovementId ?? "")),
    occurrence.copyNumber,
  );
}

function stopPointAnchor(
  items: readonly ZoneItem[],
  index: number,
  allOccurrences: readonly SessionDraftExercise[],
  levelPositions: ReadonlyMap<string, MovementLevelPosition>,
): string | null {
  const preceding = items
    .slice(0, Math.max(0, index))
    .reverse()
    .find(
      (item): item is Extract<ZoneItem, { kind: "OCCURRENCE" }> => item.kind === "OCCURRENCE" && isSequenceSeparator(item.occurrence),
    );
  if (preceding === undefined) return null;
  // PRE-7 (R-3, Q3 ; R-6, C06) : nom affiché par la carte, suffixes de niveau et de copie compris.
  const name = occurrenceCardName(preceding.occurrence, levelPositions);
  // Homonymes : la notation de position des cartes (« n sur m » dans la zone) les distingue.
  const homonyms = allOccurrences.filter((occurrence) => occurrenceCardName(occurrence, levelPositions) === name).length > 1;
  if (!homonyms) return name;
  const inZone = items.filter((item) => item.kind === "OCCURRENCE");
  const position = strings.screens.composition.occurrenceCard.accessibilityPosition
    .replace("{position}", String(inZone.indexOf(preceding) + 1))
    .replace("{count}", String(inZone.length));
  return `${name}, ${position}`;
}

/**
 * PRE-6 story 6.2 : nom accessible d'une rangée de point — « Point d'arrêt après {exercice} »
 * (`stopPointAnchor`), « … après le circuit » (tête de la portée après le Circuit), « … au début du
 * circuit » (tête du Circuit, donnée héritée) ou « … au début de la séance » (tête de la portée
 * avant le Circuit, donnée héritée).
 */
function stopPointRowAccessibilityLabel(
  items: readonly ZoneItem[],
  index: number,
  zone: StructuralPosition,
  allOccurrences: readonly SessionDraftExercise[],
  levelPositions: ReadonlyMap<string, MovementLevelPosition>,
): string {
  const t = strings.screens.composition.placement;
  const anchor = stopPointAnchor(items, index, allOccurrences, levelPositions);
  if (anchor !== null) return t.existingStopPointAccessibilityLabel.replace("{exercise}", () => anchor);
  if (zone === "AFTER_TOUR") return t.existingStopPointAfterCircuitAccessibilityLabel;
  return zone === "IN_TOUR" ? t.stopPointAtCircuitStartAccessibilityLabel : t.stopPointAtSessionStartAccessibilityLabel;
}

/**
 * PRE-6 (story 4.1) : en placement, contenu non interactif et masqué à l'accessibilité (la lecture
 * ne passe que par les emplacements). Revue 5.3 (Figma `8328:29270`) : plus atténué. Hors placement,
 * simple conteneur sans effet.
 */
function PlacementAttenuation({
  active,
  children,
  testID,
}: {
  active: boolean;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      pointerEvents={active ? "none" : "auto"}
      accessibilityElementsHidden={active}
      importantForAccessibility={active ? "no-hide-descendants" : "auto"}
    >
      {children}
    </View>
  );
}

/**
 * Liste des Activités d'UNE zone structurelle (T02-S01, CE-T02-01).
 *
 * Conserve exactement le conteneur à écart réduit de la correction compacte
 * LOT_3_OF_3 (`exerciseList`, `gap: 8`) et sa règle : rendu UNIQUEMENT s'il
 * existe au moins une Activité — un conteneur vide resterait un enfant du
 * contenu défilant et ajouterait un second `gap: 16` structurel. La règle
 * est désormais appliquée zone par zone ; une zone vide reste néanmoins une
 * destination de dépose valide, la résolution ne dépendant pas de la hauteur
 * des listes mais de la position de la structure Tour (`compositionGesture
 * .ts`).
 */
function ActivityZoneList({
  zone,
  testID,
  items,
  allOccurrences,
  revealedActionsId,
  draggedKey,
  raisedKey,
  bodyZonesReferential,
  categoriesReferential,
  levelPositions,
  circuitContext,
  onLayout,
  onRowLayout,
  focusRequest,
  onFocusConsumed,
  onEdit,
  onRevealActions,
  onDragStart,
  onDragMove,
  onDragEnd,
  rail,
  autoScroll,
  fading,
  onDuplicate,
  onDelete,
  canStep,
  onStep,
  stopPointStepAction,
  placement,
  precededByPlacementRow = false,
}: ActivityZoneListProps) {
  if (items.length === 0) {
    return null;
  }
  // Nom accessible des cartes : « n sur m » parmi les occurrences de la zone (les points n'y comptent pas).
  const occurrences = items.filter((item) => item.kind === "OCCURRENCE");
  /*
   * Revue 6.3 : en placement, deux rangées de point adjacentes (rangée sous une carte, rangée d'un
   * point non proposé, rangée « après le Circuit » au-dessus de la zone) se partagent l'écart qui
   * les sépare — chaque cible s'arrête en son milieu, jamais l'une sur l'autre.
   */
  const gap = zone === "IN_TOUR" ? CIRCUIT_GAP : SEQUENCE_GAP;
  const hasPlacementRowAt = (index: number): boolean => {
    const neighbor = items[index];
    if (placement === null || neighbor === undefined) return false;
    if (neighbor.kind === "STOP_POINT") return true;
    return placement.rowPointOf(placement.slotFor(neighbor.occurrence.id)?.stopPoint ?? null) !== null;
  };
  const followedByPlacementRow = (index: number): boolean => placement !== null && items[index + 1]?.kind === "STOP_POINT";
  const placementExtentAt = (index: number) => ({
    top: (index === 0 ? precededByPlacementRow : hasPlacementRowAt(index - 1)) ? gap / 2 : gap,
    bottom: followedByPlacementRow(index) ? gap / 2 : gap,
  });
  return (
    <View
      style={[
        styles.exerciseList,
        // PRE-6 (story 5.2, D-435) : écart 9 entre les cartes du Circuit, 8 au dehors.
        zone === "IN_TOUR" ? styles.exerciseListInCircuit : null,
        // Correctif 2.3b (retour Hermann 21/10/2026) : la zone qui porte la carte soulevée passe
        // au-dessus de ses sœurs (Circuit, autres zones, bornes) ; sinon, hors de sa zone, la carte
        // glisse sous leur fond opaque (blanc ou couleur du Circuit).
        // Story 5.2b : aussi pendant le dialogue de perte et le retour animé de la carte.
        items.some((item) => zoneItemKey(item) === raisedKey) ? styles.dragElevated : null,
      ]}
      onLayout={(event) => onLayout(zone, event)}
      testID={testID}
    >
      {items.map((item, itemIndex) => {
        if (item.kind === "STOP_POINT" && placement !== null) {
          // PRE-6 story 6.3 (D-441, R3) : en placement, seul un point non proposé est une rangée
          // autonome — puce de placement sélectionnée, désélectionnable, sans glisser.
          // Story 7.2 (D-442) : l'emplacement libre de tête de Circuit est une rangée de même nature.
          const key = railStopKey(item.point.id);
          const isCircuitHeadSlot = item.point.id === CIRCUIT_HEAD_SLOT_ID;
          const rowPoint = isCircuitHeadSlot
            ? placement.circuitHeadRowPoint
            : placement.rowPointOf({
                location: { scope: item.point.scope, position: item.point.position },
                existing: true,
                stopPointId: item.point.id,
              });
          return rowPoint === null ? null : (
            <PlacementStopPointItemRow
              key={key}
              railKey={key}
              point={rowPoint}
              placement={placement}
              rail={rail}
              touchExtent={placementExtentAt(itemIndex)}
              onLayout={(event) => onRowLayout(key, zone, event)}
              testID={isCircuitHeadSlot ? "composition-placement-slot-circuit-head" : undefined}
            />
          );
        }
        if (item.kind === "STOP_POINT") {
          // PRE-6 story 6.2 (D-441) : rangée autonome du Point d'arrêt, sœur des cartes.
          const key = railStopKey(item.point.id);
          return (
            <StopPointRow
              key={key}
              point={item.point}
              accessibilityLabel={stopPointRowAccessibilityLabel(items, itemIndex, zone, allOccurrences, levelPositions)}
              isDragged={draggedKey === key}
              isRaised={raisedKey === key}
              rail={rail}
              autoScroll={autoScroll}
              fadeOpacity={fading !== null && fading.keys.has(key) ? fading.opacity : null}
          fadeLeaving={fading !== null && fading.keys.has(key) && fading.leaving}
              onLayout={(event) => onRowLayout(key, zone, event)}
              focusRequest={focusRequest !== null && focusRequest.key === key ? focusRequest : null}
              onFocusConsumed={onFocusConsumed}
              onDragStart={() => onDragStart(key)}
              onDragCancel={(translationY) => {
                onDragStart(null, translationY);
              }}
              onDragMove={(translationY) => onDragMove(key, translationY)}
              onDragEnd={(translationY) => onDragEnd(key, zone, translationY)}
              onMoveUp={stopPointStepAction(item.point.id, "UP")}
              onMoveDown={stopPointStepAction(item.point.id, "DOWN")}
            />
          );
        }
        const activity = item.occurrence;
        const key = railRowKey(activity.id);
        return (
        <CompositionActivityRow
          key={activity.id}
          activity={activity}
          position={{ index: occurrences.indexOf(item), count: occurrences.length }}
          areActionsRevealed={revealedActionsId === activity.id}
          isDragged={draggedKey === key}
          isRaised={raisedKey === key}
          isBlockedByOtherReveal={revealedActionsId !== null && revealedActionsId !== activity.id}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          levelPositions={levelPositions}
          circuitContext={circuitContext}
          onLayout={(event) => onRowLayout(key, zone, event)}
          focusRequest={focusRequest !== null && focusRequest.key === key ? focusRequest : null}
          onFocusConsumed={onFocusConsumed}
          onEdit={() => onEdit(activity.id)}
          onRevealActions={() => onRevealActions(activity.id)}
          onHideActions={() => onRevealActions(null)}
          onDragStart={() => onDragStart(key)}
          onDragCancel={(translationY) => {
            onDragStart(null, translationY);
          }}
          onDragMove={(translationY) => onDragMove(key, translationY)}
          // Story 2.3b : le dépôt (`handleDropItem`) met lui-même fin à l'état soulevé, dans
          // un ordre explicite avec la session de décalage.
          onDragEnd={(translationY) => onDragEnd(key, zone, translationY)}
          rail={rail}
          autoScroll={autoScroll}
          fadeOpacity={fading !== null && fading.keys.has(key) ? fading.opacity : null}
              fadeLeaving={fading !== null && fading.keys.has(key) && fading.leaving}
          onDuplicate={() => onDuplicate(activity.id)}
          onDelete={() => onDelete(activity.id)}
          onMoveUp={canStep(activity.id, "UP") ? () => onStep(activity.id, "UP") : null}
          onMoveDown={canStep(activity.id, "DOWN") ? () => onStep(activity.id, "DOWN") : null}
          placement={placement}
          placementRowFollowed={followedByPlacementRow(itemIndex)}
        />
        );
      })}
    </View>
  );
}

type StopPointRowProps = {
  readonly point: StopPoint;
  readonly accessibilityLabel: string;
  readonly isDragged: boolean;
  /** Story 5.2b : au premier plan (soulevée, maintenue ou en retour). */
  readonly isRaised: boolean;
  readonly rail: SequenceRailContext;
  /** PRE-6 story 7.4 : défilement automatique pendant le glisser. */
  readonly autoScroll: DragAutoScroll;
  /** PRE-6 story 7.5 : opacité du fondu quand la suppression d'une carte retire ce point. */
  readonly fadeOpacity: Animated.Value | null;
  /** Story 7.7 : le fondu est une disparition (sans toucher ni accessibilité). */
  readonly fadeLeaving: boolean;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  /** Revue 6.2 : focus d'accessibilité demandé sur ce point (pas d'une zone à l'autre). */
  readonly focusRequest: ItemFocusRequest | null;
  readonly onFocusConsumed: (token: number) => void;
  /** `false` : soulèvement refusé (un autre élément est soulevé, géométrie incomplète). */
  readonly onDragStart: () => boolean;
  readonly onDragCancel: (translationY: number) => void;
  readonly onDragMove: (translationY: number) => void;
  readonly onDragEnd: (translationY: number) => void;
  /** « Monter » / « Descendre » ; `null` : action absente (déplacement refusé). */
  readonly onMoveUp: (() => void) | null;
  readonly onMoveDown: (() => void) | null;
};

/** Actions accessibles d'un point (story 6.2). */
type StopPointAccessibilityActionName = "moveUp" | "moveDown";

/**
 * PRE-6 story 6.2 (D-441, R2, CE-T03-08) : rangée AUTONOME d'un Point d'arrêt hors placement, sœur
 * des cartes dans la liste de sa zone, entre les cartes selon `{scope, position}` (séquence mêlée).
 * Rendu de la story 5.2 inchangé : rangée de 22, puce centrée, écart de la zone au-dessus et
 * au-dessous (celui de la liste) ; nœud du rail (`railStopKey`) — lien vers l'élément précédent
 * (ancre au haut de la rangée), queue sur toute sa hauteur, point de raccord en son centre.
 *
 * Geste : l'appui long sur la puce la soulève ; elle suit alors le doigt (translation locale, comme
 * la carte), ses voisines se décalent (aperçu 2.3b), et le dépôt passe par `moveStopPoint` ; refus
 * : retour animé (5.2b). Aucun balayage ; un toucher court ne fait rien hors placement. Le
 * soulèvement ne change ni la taille ni la mise en page de la rangée ; story 7.2 (D-442) : la puce
 * saisie est marquée soulevée (`StopPointChip.lifted`, style sélectionné et ombre de la carte
 * soulevée — NON VÉRIFIABLE, Figma n'en donne pas pour la puce). Accessibilité : « Monter » / « Descendre »
 * vers l'emplacement autorisé voisin, proposées seulement si le déplacement serait accepté.
 */
function StopPointRow({
  point,
  accessibilityLabel,
  isDragged,
  isRaised,
  rail,
  autoScroll,
  fadeOpacity,
  fadeLeaving,
  onLayout,
  focusRequest,
  onFocusConsumed,
  onDragStart,
  onDragCancel,
  onDragMove,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: StopPointRowProps) {
  const composition = strings.screens.composition;
  const railKey = railStopKey(point.id);
  const shift = rail.shiftOf(railKey);
  // Revue 6.2 : hors de la chaîne (soulevé, tenu, en retour), un point ne dessine AUCUN rail — ni
  // segment ni point de raccord : le lien de ses voisines traverse déjà sa place, et sa puce, centrée
  // sur la page, ne recouvre pas l'axe du rail (contrairement à une carte).
  const railLink = rail.skippedKeys.has(railKey) ? undefined : rail.links.get(railKey);
  const chipRef = useRef<View>(null);
  // Focus demandé (pas d'une zone à l'autre : la rangée vient d'être remontée) ; consommé une fois porté.
  useEffect(() => {
    if (focusRequest === null) return undefined;
    const token = focusRequest.token;
    return focusOnNextFrame(() => chipRef.current, focusRequest.announcement, () => onFocusConsumed(token));
  }, [focusRequest, onFocusConsumed]);
  const originRef = useRef<number | null>(null);
  /** Translation de la puce : déplacement du doigt plus, story 7.4, défilement accumulé. */
  const translationYRef = useRef(0);
  /** Story 7.4 : déplacement du doigt seul (depuis le début du toucher). */
  const fingerDyRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [dragTranslationY, setDragTranslationY] = useState(0);
  // Une rangée démontée pendant son glisser (point retiré du brouillon) annule le geste.
  const onDragCancelRef = useRef(onDragCancel);
  useEffect(() => {
    onDragCancelRef.current = onDragCancel;
  }, [onDragCancel]);
  const onDragMoveRef = useRef(onDragMove);
  useEffect(() => {
    onDragMoveRef.current = onDragMove;
  }, [onDragMove]);
  /** Story 7.4 : translation de la puce soulevée (mouvement du doigt ou trame de défilement). */
  const applyDragTranslation = useCallback((translationY: number) => {
    translationYRef.current = translationY;
    setDragTranslationY(translationY);
    onDragMoveRef.current(translationY);
  }, []);
  useEffect(() => {
    const dragging = isDraggingRef;
    const cancel = onDragCancelRef;
    return () => {
      if (dragging.current) {
        dragging.current = false;
        cancel.current(0);
      }
    };
  }, []);
  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    // Revue 6.2 : un second doigt pendant le glisser ne redéfinit pas l'origine du geste.
    if (isDraggingRef.current) return;
    originRef.current = event.nativeEvent.pageY;
    translationYRef.current = 0;
    fingerDyRef.current = 0;
  }, []);
  const track = useCallback((event: GestureResponderEvent) => {
    const start = originRef.current;
    const dy = start === null ? 0 : event.nativeEvent.pageY - start;
    fingerDyRef.current = dy;
    // Story 7.4 : pendant le glisser, la translation compte aussi le défilement accumulé.
    if (!isDraggingRef.current) translationYRef.current = dy;
    return dy;
  }, []);
  const handleLongPress = useCallback(() => {
    // Revue 6.2 : refusé si un autre élément est soulevé ou si la géométrie est incomplète.
    if (originRef.current === null || !onDragStart()) return;
    isDraggingRef.current = true;
    // Story 7.4 : la puce suit le défilement automatique, même sans mouvement du doigt — et un doigt
    // déjà immobile dans une bande de bord au soulèvement fait défiler (revue 7.4).
    autoScroll.attach((scrollDelta) => applyDragTranslation(fingerDyRef.current + scrollDelta));
    autoScroll.track(originRef.current + fingerDyRef.current);
  }, [applyDragTranslation, autoScroll, onDragStart]);
  // Le glisser engagé capte le mouvement (phase de capture) ; sinon, le défilement reste au parent.
  const handleMoveShouldSetResponderCapture = useCallback(
    (event: GestureResponderEvent) => {
      track(event);
      return isDraggingRef.current;
    },
    [track],
  );
  const handleResponderMove = useCallback(
    (event: GestureResponderEvent) => {
      const dy = track(event);
      if (!isDraggingRef.current) return;
      applyDragTranslation(dy + autoScroll.track(event.nativeEvent.pageY));
    },
    [applyDragTranslation, autoScroll, track],
  );
  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      // Revue 6.2 : le geste ne se termine qu'au dernier doigt levé.
      if ((event.nativeEvent.touches?.length ?? 0) > 0) return;
      originRef.current = null;
      setDragTranslationY(0);
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      onDragEnd(translationYRef.current);
    },
    [onDragEnd],
  );
  const handleResponderTerminate = useCallback(() => {
    setDragTranslationY(0);
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onDragCancel(translationYRef.current);
  }, [onDragCancel]);
  /** Revue 6.2 : toucher annulé par le système — plus d'origine ; un glisser engagé est interrompu. */
  const handleTouchCancel = useCallback(() => {
    originRef.current = null;
    handleResponderTerminate();
  }, [handleResponderTerminate]);
  const handleResponderTerminationRequest = useCallback(() => !isDraggingRef.current, []);
  const actionHandlers: Partial<Record<StopPointAccessibilityActionName, () => void>> = {
    ...(onMoveUp !== null ? { moveUp: onMoveUp } : {}),
    ...(onMoveDown !== null ? { moveDown: onMoveDown } : {}),
  };
  const actionLabels: Record<StopPointAccessibilityActionName, string> = {
    moveUp: composition.activityActions.moveUp,
    moveDown: composition.activityActions.moveDown,
  };
  const accessibilityActions = (Object.keys(actionHandlers) as StopPointAccessibilityActionName[]).map((name) => ({
    name,
    label: actionLabels[name],
  }));
  return (
    <Animated.View
      style={[
        styles.stopPointRow,
        isRaised ? styles.activityRowContainerDragged : null,
        // Décalage de la rangée (aperçu du glisser d'un autre élément, retour 5.2b) : registre partagé.
        { transform: [{ translateY: shift }] },
        // Story 7.5 : fondu quand la suppression d'une carte retire ce point.
        fadeOpacity !== null ? { opacity: fadeOpacity } : null,
      ]}
      pointerEvents={fadeLeaving ? "none" : "auto"}
      accessibilityElementsHidden={fadeLeaving}
      importantForAccessibility={fadeLeaving ? "no-hide-descendants" : "auto"}
      onLayout={onLayout}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMoveShouldSetResponderCapture={handleMoveShouldSetResponderCapture}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleResponderTerminate}
      onResponderTerminationRequest={handleResponderTerminationRequest}
      testID={`composition-stop-point-row-${point.id}`}
    >
      {railLink !== undefined ? (
        <>
          <RailLink
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            entryY={0}
            length={railLink.length}
            shift={shift}
            prevShift={rail.shiftOf(railLink.prevKey)}
            testID={`composition-rail-link-stop-${point.id}`}
          />
          <RailSegment centerX={OCCURRENCE_CARD_MEDIA.centerX} top={0} bottom={0} testID={`composition-rail-tail-stop-${point.id}`} />
        </>
      ) : null}
      {railLink !== undefined ? (
        <RailDot
          centerX={OCCURRENCE_CARD_MEDIA.centerX}
          centerY={STOP_POINT_LINE_HEIGHT / 2}
          testID={`composition-rail-dot-stop-${point.id}`}
        />
      ) : null}
      <StopPointLine
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={composition.pauses.stopPointReorderAccessibilityHint}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={(name) => actionHandlers[name as StopPointAccessibilityActionName]?.()}
        onLongPress={handleLongPress}
        translateY={isDragged ? dragTranslationY : 0}
        // Story 7.2 (D-442) : point saisi marqué soulevé, comme une carte.
        lifted={isDragged}
        chipRef={chipRef}
        testID={`composition-stop-point-${point.id}`}
      />
    </Animated.View>
  );
}

type PlacementStopPointItemRowProps = {
  readonly railKey: string;
  readonly point: PlacementStopPointRowPoint;
  readonly placement: PlacementRowContext;
  readonly rail: SequenceRailContext;
  /** Écart de la zone (8, 9 dans le Circuit), ou sa moitié côté d'une rangée de placement adjacente (revue 6.3). */
  readonly touchExtent: PlacementTouchExtent;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  /** Story 7.2 : identifiant de test imposé (emplacement de tête de Circuit). */
  readonly testID?: string;
};

/**
 * PRE-6 story 6.3 (D-441, R3) : en placement, rangée autonome d'un point existant qu'aucun
 * emplacement ne porte (`UNOFFERED_STOP_POINT` : hors bornes…) ou en tête de Circuit, à sa place dans
 * la séquence mêlée. Story 7.2 (D-442) : aussi l'emplacement LIBRE de tête de Circuit, entre l'en-tête
 * du Circuit et sa première carte. Même rangée de 22 et même puce que les emplacements (`PlacementStopPointRow`,
 * sélectionnée, désélectionnable) ; nœud du rail (lien vers l'élément précédent, queue sur toute sa
 * hauteur), sans point de raccord, comme les rangées du placement (story 5.3). Aucun glisser.
 */
function PlacementStopPointItemRow({
  railKey,
  point,
  placement,
  rail,
  touchExtent,
  onLayout,
  testID: forcedTestID,
}: PlacementStopPointItemRowProps) {
  const shift = rail.shiftOf(railKey);
  const railLink = rail.links.get(railKey);
  const testID = forcedTestID ?? `composition-placement-slot-stop-${point.kind === "EXISTING" ? point.stopPointId : railKey}`;
  return (
    <Animated.View style={[styles.stopPointRow, { transform: [{ translateY: shift }] }]} onLayout={onLayout} testID={`${testID}-row`}>
      {railLink !== undefined ? (
        <>
          <RailLink
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            entryY={0}
            length={railLink.length}
            shift={shift}
            prevShift={rail.shiftOf(railLink.prevKey)}
            testID={`composition-rail-link-${railKey}`}
          />
          <RailSegment centerX={OCCURRENCE_CARD_MEDIA.centerX} top={0} bottom={0} testID={`composition-rail-tail-${railKey}`} />
        </>
      ) : null}
      <PlacementStopPointRow
        point={point}
        placement={placement.draft}
        onToggleStopPoint={placement.onToggleStopPoint}
        onToggleExistingStopPoint={placement.onToggleExistingStopPoint}
        touchExtent={touchExtent}
        testID={testID}
      />
    </Animated.View>
  );
}

type CompositionActivityRowProps = {
  readonly activity: SessionDraftExercise;
  readonly areActionsRevealed: boolean;
  readonly isDragged: boolean;
  /**
   * PRE-6 story 5.2b : carte au premier plan de ses sœurs — soulevée, maintenue pendant le dialogue
   * de perte ou en retour animé (fond transparent, `zIndex`).
   */
  readonly isRaised: boolean;
  /**
   * VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : `true`
   * lorsqu'UNE AUTRE carte de la Composition a ses actions révélées —
   * conformément au contrat existant (CE-T02-02), les interactions de
   * CETTE carte restent bloquées jusqu'à la fermeture de l'autre (appui,
   * appui long, balayage), plutôt que d'ouvrir directement son édition ou
   * d'engager un déplacement pendant qu'une autre carte reste ouverte.
   */
  readonly isBlockedByOtherReveal: boolean;
  readonly bodyZonesReferential: readonly BodyZone[];
  /** PRE-6 (story 2.2) : Catégories (ligne de classement) et contexte de Circuit (durées). */
  readonly categoriesReferential: readonly Category[];
  /** PRE-7 (R-6, C06) : positions de niveau par mouvement (suffixe « - Nn »). */
  readonly levelPositions: ReadonlyMap<string, MovementLevelPosition>;
  readonly circuitContext: OccurrenceCircuitContext;
  /** Position de l'occurrence dans sa zone, pour son nom accessible (« n sur m »). */
  readonly position: { readonly index: number; readonly count: number };
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly onEdit: () => void;
  readonly onRevealActions: () => void;
  readonly onHideActions: () => void;
  /** `false` : soulèvement refusé (revue 6.2 : un autre élément est soulevé, géométrie incomplète). */
  readonly onDragStart: () => boolean;
  /** Revue 6.2 : focus d'accessibilité demandé sur cette carte (pas d'une zone à l'autre, suppression refusée). */
  readonly focusRequest: ItemFocusRequest | null;
  readonly onFocusConsumed: (token: number) => void;
  /** Interruption du glisser, avec la position atteinte (retour animé depuis elle, story 5.2b). */
  readonly onDragCancel: (translationY: number) => void;
  /** PRE-6 (story 2.3b) : déplacement vertical courant de la carte glissée. */
  readonly onDragMove: (translationY: number) => void;
  readonly onDragEnd: (translationY: number) => void;
  /**
   * PRE-6 (story 2.3b) : décalage vertical du bloc (carte, rangée du point d'arrêt, rail) pour
   * libérer l'emplacement visé par une AUTRE carte glissée — valeur animée du registre partagé
   * (`rail.shiftOf`). PRE-6 (story 5.2) : lien du rail vers l'élément précédent.
   */
  readonly rail: SequenceRailContext;
  /** PRE-6 story 7.4 : défilement automatique pendant le glisser. */
  readonly autoScroll: DragAutoScroll;
  /** PRE-6 story 7.5 : opacité du fondu de la carte supprimée (story 7.7 : ou de la copie qui apparaît), ou `null`. */
  readonly fadeOpacity?: Animated.Value | null;
  /** Story 7.7 : le fondu est une disparition (sans toucher ni accessibilité). */
  readonly fadeLeaving?: boolean;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  /** PRE-6 (story 2.3) : action accessible « Monter » / « Descendre » ; `null` = aucune (extrémité de la séquence). */
  readonly onMoveUp: (() => void) | null;
  readonly onMoveDown: (() => void) | null;
  /** PRE-6 (story 4.1) : mode placement — carte atténuée et inactive, puces sous la carte. */
  readonly placement: PlacementRowContext | null;
  /** Revue 6.3 : la rangée sous la carte est suivie d'une rangée de point non proposé (écart partagé). */
  readonly placementRowFollowed?: boolean;
};

/**
 * Noms des actions accessibles d'une carte d'occurrence (CE-T03-08 §18). PRE-6 story 7.2 (D-442) :
 * plus d'actions propres à la récupération (« Modifier » / « Retirer la récupération », story 5.1) —
 * elle se règle seulement en placement.
 */
type OccurrenceAccessibilityActionName = "moveUp" | "moveDown" | "duplicate" | "delete";

/**
 * V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : décalage horizontal MAXIMAL de la
 * carte lorsqu'elle est entièrement ouverte — la largeur du groupe d'actions
 * (`compositionSwipeActions.groupWidth`) PLUS la marge canonique carte/cadre
 * Tour (`compositionTourSection.inset`), pour que cette même marge sépare
 * visuellement la carte ouverte du groupe d'actions et laisse voir le fond
 * du Tour, comme prescrit par le plan (« le gap entre carte et actions égale
 * la marge carte/cadre Tour »). Aucune valeur locale : dérivée des deux
 * tokens DSF déjà canoniques, jamais un littéral.
 */
const SWIPE_REVEAL_OFFSET =
  dimensions.compositionSwipeActions.groupWidth + dimensions.compositionTourSection.inset;

/**
 * PRE-6 story 7.7 (D-443) : la carte d'occurrence reste le même `Pressable` (mécanisme de geste
 * inchangé) ; seule sa translation horizontale devient une valeur animée, pour que l'ouverture, la
 * fermeture et le retour des actions glissées se terminent en douceur (pilote natif).
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `Composition / Activity Row` (`2588:2679`, D-128) et ses deux états T02 —
 * actions glissées (`2028:11808`) et carte soulevée (`3518:4621`, D-129).
 *
 * **Gestes (CE-T02-01/CE-T02-02, D-127)** — quatre états mutuellement
 * exclusifs, arbitrés par un UNIQUE reconnaisseur :
 *
 * | Geste | Résultat |
 * | --- | --- |
 * | Appui court | Ouvre l'Activité en modification. |
 * | Appui long sur TOUTE la carte | Engage la réorganisation, sans ouvrir la modification. |
 * | Déplacement après appui long | Change l'ordre dans la zone, ou de zone. |
 * | Glissement gauche | Révèle `Dupliquer` et `Supprimer`. |
 *
 * **Répartition des primitives natives** (`.github/AI_ORCHESTRATION.md`,
 * « Priorité aux primitives natives de l'OS ») :
 *
 * - l'appui court et l'appui long sont ceux de `Pressable` — la primitive
 *   d'appui de React Native, avec son `delayLongPress`, son annulation
 *   automatique dès qu'un autre responder prend la main, et son rôle
 *   d'accessibilité ; `Pressable` n'appelle JAMAIS `onPress` après un
 *   `onLongPress`, d'où l'exclusivité exigée par AC-02 par construction
 *   plutôt que par un verrou maison ;
 * - le glissement gauche et le déplacement vertical sont arbitrés par le
 *   *responder system* natif du conteneur, en phase de CAPTURE
 *   (`onMoveShouldSetResponderCapture`) : capter en capture annule l'appui
 *   du `Pressable` interne, ce qui garantit qu'un glissement n'ouvre jamais
 *   la modification.
 *
 * Ni `react-native-gesture-handler` ni `react-native-reanimated` ne sont
 * employés — présents dans `package.json`, ils n'ont aucune intégration
 * racine, Babel ni Jest dans ce projet ; les activer élargirait le périmètre
 * sans besoin démontré (plan §8, décision validée). Les seuils et la
 * résolution de dépose vivent dans `compositionGesture.ts`, module pur et
 * testable ; ce composant ne fait que les brancher.
 *
 * **Cohabitation avec le défilement** : le conteneur ne capte un mouvement
 * VERTICAL que lorsqu'un déplacement est déjà engagé par appui long ; tout
 * autre geste vertical reste au `ScrollView` parent, qui continue donc de
 * défiler normalement. Réciproquement, `onResponderTerminationRequest`
 * renvoie `false` pendant un déplacement engagé, et l'écran neutralise le
 * défilement (`scrollEnabled={false}`) tant qu'une carte est soulevée.
 *
 * **`onTouchStart`/`onTouchEnd`** sont dispatchés indépendamment du
 * responder : ils bornent le geste de façon fiable, que le porteur du
 * responder soit le `Pressable`, le conteneur ou le `ScrollView`.
 *
 * **Poignée (AC-03)** : `Icon / Structure / Movable` (`3066:4676`) reste
 * affichée dans son slot `28 × 28` comme AFFORDANCE — elle n'est pas une
 * cible tactile propre : le reconnaisseur couvre tout le bloc.
 *
 * **Actions glissées (D-128, V2-CAT-01 UI-CAT-R-007/010)** : le groupe est
 * SUPERPOSÉ à la partie droite du bloc, DERRIÈRE la carte principale — c'est
 * la carte qui se translate horizontalement (`translateX`) pour le
 * découvrir, jamais l'inverse.
 *
 * ---
 *
 * **T02-S02, révisé par V2-CAT-01 (D-095/D-128/D-138, CE-T01-09,
 * CE-T02-01/CE-T02-02, CE-T03-08).**
 *
 * 1. **Ligne structurelle de récupération (PRE-6 story 2.1, D-303, D-217 ;
 *    remplace la sous-carte attachée de T02-S02).** Sous la carte, dans le
 *    même conteneur gestuel et avec la même translation : « la Récupération
 *    appartient à l'Activité et forme avec elle un bloc indivisible pour la
 *    Composition, la copie, la duplication, le déplacement et la
 *    suppression » (D-138). PRE-6 story 5.1 (D-435) : elle s'affiche en ligne 3 de
 *    la carte si R > 0 ; la rangée sous la carte ne porte plus qu'un point
 *    d'arrêt. Elle n'est jamais une Activité de plus.
 * 2. **Géométrie.** PRE-6 (story 5.1, D-435) : carte v2 de `80` dans toutes les variantes
 *    (remplace `64` / `70`) ; actions glissées `72 × 80`, couvrant toute la hauteur de la
 *    carte. L'état soulevé applique un écart CONSTANT (`widthDelta 8`, `heightDelta 4`) :
 *    `84` de haut.
 * 3. **Balayage PROGRESSIF (V2-CAT-01, CE-T03-08 §§7-20, D-175/D-176).** La
 *    carte SUIT le doigt en temps réel (`swipeTranslateX`, même technique
 *    déjà éprouvée que `dragTranslationY` pour le déplacement vertical —
 *    aucune bibliothèque de geste supplémentaire) ; les actions se révèlent
 *    PROPORTIONNELLEMENT, jamais en tout ou rien. À la relâche, la position
 *    ATTEINTE (pas la distance depuis l'origine) décide de l'aboutissement :
 *    au-delà de la moitié de la course, la carte s'aligne en position
 *    OUVERTE ; en deçà, elle revient en position FERMÉE. Un balayage droit ne
 *    peut jamais faire progresser la carte au-delà de sa position fermée
 *    (`0`), et un balayage gauche jamais au-delà de sa position ouverte
 *    (`-SWIPE_REVEAL_OFFSET`) : la fermeture n'aboutit donc JAMAIS sauf
 *    engagée depuis une carte déjà ouverte, et l'ouverture jamais depuis une
 *    carte déjà fermée par un balayage droit isolé — révise le modèle
 *    « achevé sans suivi » d'un cycle antérieur, désormais explicitement
 *    contredit par le contrat d'écran de cette tranche.
 * 4. **Appui court sur une carte ouverte : NEUTRE.** Un tap sur la carte
 *    encore visible (« hors action ») ne ferme NI n'ouvre rien — seul un
 *    balayage droit véritable, engagé sur la carte ouverte, la referme.
 * 5. **Appui long, seul déclencheur du déplacement.** Inchangé : `Pressable`
 *    n'appelle jamais `onPress` après `onLongPress`, et un balayage capte le
 *    responder en phase de CAPTURE, ce qui annule l'appui en cours. Aucun
 *    autre chemin n'appelle `onDragStart`.
 */
function CompositionActivityRow({
  activity,
  areActionsRevealed,
  isDragged,
  isRaised,
  isBlockedByOtherReveal,
  bodyZonesReferential,
  categoriesReferential,
  levelPositions,
  circuitContext,
  position,
  onLayout,
  onEdit,
  onRevealActions,
  onHideActions,
  onDragStart,
  onDragCancel,
  onDragMove,
  onDragEnd,
  rail,
  autoScroll,
  fadeOpacity = null,
  fadeLeaving = false,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  placement,
  placementRowFollowed = false,
  focusRequest,
  onFocusConsumed,
}: CompositionActivityRowProps) {
  const composition = strings.screens.composition;
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<View>(null);
  // Revue 6.2 : focus demandé sur la carte (pas d'une zone à l'autre — la carte peut avoir été
  // remontée dans une autre liste —, suppression refusée et son annonce) ; consommé une fois porté.
  useEffect(() => {
    if (focusRequest === null) return undefined;
    const token = focusRequest.token;
    return focusOnNextFrame(() => cardRef.current, focusRequest.announcement, () => onFocusConsumed(token));
  }, [focusRequest, onFocusConsumed]);
  /** Translation de la carte soulevée : déplacement du doigt plus, story 7.4, défilement accumulé. */
  const translationYRef = useRef(0);
  /** Story 7.4 : déplacement vertical du doigt seul (depuis le début du toucher). */
  const fingerDyRef = useRef(0);
  const isDraggingRef = useRef(false);
  /**
   * PRE-6 (story 2.3b) : une carte démontée pendant son glisser (occurrence retirée du brouillon)
   * annule le geste — sans quoi l'écran garderait un état soulevé et un aperçu périmés.
   */
  const onDragCancelRef = useRef(onDragCancel);
  useEffect(() => {
    onDragCancelRef.current = onDragCancel;
  }, [onDragCancel]);
  useEffect(() => {
    const dragging = isDraggingRef;
    const cancel = onDragCancelRef;
    return () => {
      if (dragging.current) {
        dragging.current = false;
        cancel.current(0);
      }
    };
  }, []);
  /**
   * `true` dès qu'un balayage horizontal est engagé pendant le geste
   * courant (V2-CAT-01, CE-T03-08) — tant qu'il l'est, le responder n'est
   * jamais cédé (`handleResponderTerminationRequest`) et le toucher n'est
   * pas un appui (`handlePress` reste inerte à la relâche).
   */
  const isSwipingRef = useRef(false);
  /** Position de départ (`0` fermée / `-SWIPE_REVEAL_OFFSET` ouverte) capturée à `handleTouchStart`, à laquelle `dx` s'ajoute pendant le geste. */
  const swipeBaseRef = useRef(0);
  /**
   * Décalage vertical visuel de la carte soulevée, pour qu'elle SUIVE le
   * doigt pendant le déplacement (CE-T02-02, « état transitoire avant et
   * pendant le déplacement »). État LOCAL à la carte : seule celle-ci se
   * re-rend au fil du geste — jamais l'écran entier, dont dépendraient
   * sinon toutes les autres cartes, la structure Tour et la synthèse.
   */
  const [dragTranslationY, setDragTranslationY] = useState(0);
  const onDragMoveRef = useRef(onDragMove);
  useEffect(() => {
    onDragMoveRef.current = onDragMove;
  }, [onDragMove]);
  /**
   * PRE-6 story 7.4 : translation de la carte soulevée, à chaque mouvement du doigt et à chaque
   * trame du défilement automatique (doigt immobile dans la bande de bord).
   */
  const applyDragTranslation = useCallback((translationY: number) => {
    translationYRef.current = translationY;
    setDragTranslationY(translationY);
    onDragMoveRef.current(translationY);
  }, []);
  /**
   * Décalage horizontal visuel de la carte (V2-CAT-01, CE-T03-08) — même
   * technique locale que `dragTranslationY` ci-dessus, étendue au balayage :
   * `0` carte fermée, `-SWIPE_REVEAL_OFFSET` entièrement ouverte, toute
   * valeur intermédiaire pendant le geste (révélation PROPORTIONNELLE).
   */
  const [swipeTranslateX, setSwipeTranslateX] = useState(
    areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0,
  );
  /**
   * PRE-6 story 7.7 (D-443, j6c-4 : « pas d'arrêt brutal ») : translation horizontale AFFICHÉE de la
   * carte — elle suit le doigt pendant le balayage (`setValue`) puis rejoint la position de repos
   * (ouverte ou fermée) par le mouvement partagé (`compositionMotion.ts`, décélération), au lieu d'y
   * être posée d'un coup. `swipeTranslateX` reste la position LOGIQUE (seuils, actions révélées).
   * Le groupe d'actions reste monté jusqu'à la fin d'une fermeture (`isSwipeSettling`).
   */
  const reduceMotion = useReduceMotion();
  const [swipeX] = useState(() => new Animated.Value(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0));
  const [dragY] = useState(() => new Animated.Value(0));
  const cardDragY = isDragged ? dragTranslationY : 0;
  useLayoutEffect(() => {
    dragY.setValue(cardDragY);
  }, [cardDragY, dragY]);
  const [isSwipeSettling, setIsSwipeSettling] = useState(false);
  const swipeSettleTokenRef = useRef(0);
  const settleSwipe = useCallback(
    (target: number) => {
      setSwipeTranslateX(target);
      const token = ++swipeSettleTokenRef.current;
      if (reduceMotion) {
        swipeX.setValue(target);
        setIsSwipeSettling(false);
        return;
      }
      setIsSwipeSettling(true);
      Animated.timing(swipeX, {
        toValue: target,
        duration: MOTION_SHIFT_DURATION_MS,
        easing: MOTION_EASING,
        useNativeDriver: true,
      }).start(() => {
        if (swipeSettleTokenRef.current === token) setIsSwipeSettling(false);
      });
    },
    [reduceMotion, swipeX],
  );

  /**
   * Resynchronise la position de repos lorsque l'état RÉVÉLÉ change pour une
   * cause EXTÉRIEURE au geste courant de cette carte (une autre carte
   * s'ouvre, `Dupliquer`/`Supprimer` referme celle-ci) — jamais pendant le
   * balayage lui-même, qui pilote déjà `swipeTranslateX` en temps réel.
   */
  /** Story 7.7 : position logique lue par l'effet de resynchronisation. */
  const swipeTranslateXRef = useRef(swipeTranslateX);
  useEffect(() => {
    swipeTranslateXRef.current = swipeTranslateX;
  }, [swipeTranslateX]);
  useEffect(() => {
    if (!isSwipingRef.current) {
      const rest = areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0;
      // Story 7.7 : seulement si la position change (pas de mouvement au montage).
      if (rest !== swipeTranslateXRef.current) settleSwipe(rest);
    }
  }, [areActionsRevealed, settleSwipe]);

  /**
   * Enregistre l'origine du toucher ET la position de repos courante — c'est
   * à partir de cette dernière que `dx` sera appliqué pendant tout le geste
   * (`onTouchStart`/`onTouchEnd` sont dispatchés indépendamment du responder
   * system : reçus quelle que soit l'issue du geste, sans avoir à le
   * revendiquer par anticipation, ce qui priverait le `Pressable` interne de
   * ses appuis).
   */
  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      // Revue 6.2 : un second doigt pendant le glisser ne redéfinit pas l'origine du geste.
      if (isDraggingRef.current) return;
      originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      translationYRef.current = 0;
      isSwipingRef.current = false;
      swipeBaseRef.current = areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0;
    },
    [areActionsRevealed],
  );

  const trackMovement = useCallback((event: GestureResponderEvent) => {
    const start = originRef.current;
    if (start === null) {
      return { dx: 0, dy: 0 };
    }
    const dx = event.nativeEvent.pageX - start.x;
    const dy = event.nativeEvent.pageY - start.y;
    fingerDyRef.current = dy;
    // Story 7.4 : pendant le glisser, la translation compte aussi le défilement accumulé.
    if (!isDraggingRef.current) translationYRef.current = dy;
    return { dx, dy };
  }, []);

  /** Applique `dx` à la position de repos, borné à `[-SWIPE_REVEAL_OFFSET, 0]` — la fermeture ne peut donc jamais progresser au-delà de `0`, ni l'ouverture au-delà de `-SWIPE_REVEAL_OFFSET`. */
  const applySwipeMovement = useCallback(
    (dx: number) => {
      isSwipingRef.current = true;
      const x = clampSwipeTranslateX(swipeBaseRef.current + dx, SWIPE_REVEAL_OFFSET);
      setSwipeTranslateX(x);
      // Story 7.7 : la carte suit le doigt (une animation de repos en cours est arrêtée).
      swipeSettleTokenRef.current += 1;
      swipeX.setValue(x);
    },
    [swipeX],
  );

  /**
   * Arbitrage du geste, en phase de CAPTURE — donc avant le `Pressable`
   * interne, dont l'appui est alors annulé (`onPress` ne se déclenche
   * jamais) :
   *
   * - un déplacement déjà engagé par appui long capte tout mouvement ;
   * - un mouvement franchement horizontal, au-delà de la tolérance d'appui,
   *   capte le responder et fait immédiatement SUIVRE la carte (V2-CAT-01) ;
   * - tout le reste est laissé au `Pressable` (appui court/long) et, pour un
   *   geste vertical, au `ScrollView` parent, qui reste seul maître du
   *   défilement de la liste.
   */
  const handleMoveShouldSetResponderCapture = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current) {
        return true;
      }
      if (isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return false;
      }
      applySwipeMovement(dx);
      return true;
    },
    [applySwipeMovement, trackMovement],
  );

  /**
   * Suivi du balayage INDÉPENDANT du responder (V2-CAT-01, hérité de
   * T02-S02) — `onTouchMove`, comme `onTouchStart`/`onTouchEnd`, est
   * dispatché à la vue touchée ET à tous ses ancêtres, que le responder soit
   * ou non détenu par cette carte. C'est la seule voie qui reste vraie une
   * fois les actions révélées : le balayage droit de fermeture commence
   * alors SUR le groupe d'actions superposé, dont les `Pressable`
   * (`Dupliquer`/`Supprimer`) revendiquent le responder dès le contact.
   */
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      applySwipeMovement(dx);
    },
    [applySwipeMovement, trackMovement],
  );

  const handleResponderMove = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current) {
        applyDragTranslation(dy + autoScroll.track(event.nativeEvent.pageY));
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        applySwipeMovement(dx);
      }
    },
    [applyDragTranslation, applySwipeMovement, autoScroll, trackMovement],
  );

  /**
   * Fin du toucher — reçue quel que soit le porteur du responder.
   *
   * - une dépose après appui long applique le déplacement ;
   * - sinon, un balayage engagé s'aligne sur la position atteinte : ouverte
   *   au-delà de la moitié de la course, fermée en deçà (V2-CAT-01,
   *   CE-T03-08) ;
   * - tout autre relâchement laisse le brouillon rigoureusement inchangé
   *   (CE-T02-02 : « l'entrée dans cet état ne persiste rien »).
   */
  const handleTouchEnd = useCallback((event?: GestureResponderEvent) => {
    // Revue 6.2 : le geste ne se termine qu'au dernier doigt levé.
    if ((event?.nativeEvent.touches?.length ?? 0) > 0) return;
    originRef.current = null;
    setDragTranslationY(0);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      isSwipingRef.current = false;
      onDragEnd(translationYRef.current);
      return;
    }
    if (!isSwipingRef.current) {
      return;
    }
    isSwipingRef.current = false;
    const shouldReveal = shouldRevealAfterSwipe(swipeTranslateX, SWIPE_REVEAL_OFFSET);
    // Story 7.7 : la carte rejoint sa position de repos en douceur.
    settleSwipe(shouldReveal ? -SWIPE_REVEAL_OFFSET : 0);
    if (shouldReveal && !areActionsRevealed) {
      onRevealActions();
    } else if (!shouldReveal && areActionsRevealed) {
      onHideActions();
    }
  }, [areActionsRevealed, onDragEnd, onHideActions, onRevealActions, settleSwipe, swipeTranslateX]);

  /**
   * **Hérité de T02-S02** — le balayage engagé ne doit pas être perdu si le
   * responder est repris entre-temps : la relâche du responder applique le
   * geste au même titre que la fin de toucher. `isSwipingRef` étant consommé
   * (remis à `false`) par le premier des deux qui survient, l'opération
   * reste IDEMPOTENTE — jamais appliquée deux fois si les deux événements
   * arrivent.
   */
  const handleResponderRelease = useCallback(
    (event: GestureResponderEvent) => {
      handleTouchEnd(event);
    },
    [handleTouchEnd],
  );

  /**
   * Le responder n'est cédé ni pendant un déplacement engagé (acquis
   * T02-S01), ni pendant un balayage horizontal déjà reconnu — sans quoi le
   * défilement vertical parent pourrait annuler un geste que l'utilisateur a
   * pourtant mené à son terme.
   */
  const handleResponderTerminationRequest = useCallback(
    () => !isDraggingRef.current && !isSwipingRef.current,
    [],
  );

  /**
   * Le responder est repris par une autre vue (typiquement le `ScrollView`
   * parent). Le DÉPLACEMENT est annulé — aucun changement d'ordre
   * (CE-T02-02) — mais le balayage en cours est **CONSERVÉ** : le toucher,
   * lui, n'est pas terminé, et `onTouchMove`/`onTouchEnd` (dispatchés
   * indépendamment du responder) continuent de le piloter. L'effacer ici
   * perdrait un balayage que l'utilisateur mène pourtant à son terme.
   */
  const handleResponderTerminate = useCallback(() => {
    setDragTranslationY(0);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onDragCancel(translationYRef.current);
    }
  }, [onDragCancel]);

  /**
   * Le TOUCHER lui-même est annulé (appel entrant, geste système…) : là, plus
   * aucun `onTouchEnd` ne suivra — tout est remis à zéro, balayage compris,
   * et la carte revient à sa position de repos courante (aucun balayage
   * n'est appliqué par une annulation).
   */
  const handleTouchCancel = useCallback(() => {
    originRef.current = null;
    isSwipingRef.current = false;
    settleSwipe(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0);
    handleResponderTerminate();
  }, [areActionsRevealed, handleResponderTerminate, settleSwipe]);

  /**
   * Appui COURT (D-127) : ouvre l'Activité en modification — sauf lorsque
   * ses actions glissées sont révélées, auquel cas il reste NEUTRE (« un tap
   * hors action ne ferme pas le contexte », V2-CAT-01/CE-T03-08) : seul un
   * véritable balayage droit referme une carte ouverte (`handleTouchEnd`).
   * `Pressable` n'appelle jamais `onPress` après un `onLongPress` : un appui
   * long n'ouvre donc structurellement jamais la modification (AC-02).
   */
  const handlePress = useCallback(() => {
    if (areActionsRevealed) {
      return;
    }
    onEdit();
  }, [areActionsRevealed, onEdit]);

  /**
   * PRE-6 (story 2.3b) : décalage animé du bloc pendant le glisser d'une autre carte (translation
   * seule, pilote natif ; registre partagé de l'écran, story 5.2).
   */
  const railKey = railRowKey(activity.id);
  const dragShiftValue = rail.shiftOf(railKey);
  /**
   * PRE-6 (story 5.2) : rail de l'occurrence — lien vers l'élément précédent, queue du bas du média
   * au bas du bloc (rangée du point d'arrêt ou emplacement de placement compris), point de raccord
   * au centre d'un point d'arrêt. L'occurrence glissée sort de la chaîne : aucun rail.
   */
  const railLink = rail.skippedKeys.has(railKey) ? undefined : rail.links.get(railKey);
  /**
   * Story 5.2b : carte hors de la chaîne mais pas soulevée (maintenue pendant le dialogue de perte,
   * ou en retour animé) — au premier plan, elle recouvre le lien de ses voisines qui traverse sa
   * place ; elle porte donc le rail de sa propre surface : du haut de la carte au haut du média, puis
   * du bas du média au bas du bloc (rangée du point d'arrêt et son point compris). Ces segments sont
   * sur la carte elle-même : ils ne traversent aucun autre média.
   */
  const hasOwnSurfaceRail = railLink === undefined && rail.skippedKeys.has(railKey) && isRaised && !isDragged;
  /** Écart carte → rangée du point d'arrêt / emplacement : celui de la zone (9 dans le Circuit, 8 au dehors). */
  const slotGap = activity.structuralPosition === "IN_TOUR" ? CIRCUIT_GAP : SEQUENCE_GAP;

  /**
   * Appui LONG sur TOUTE la carte (D-127/AC-03) : engage la réorganisation. Revue 6.2 : refusé
   * (aucun état soulevé) si un autre élément est déjà soulevé ou si la géométrie est incomplète.
   */
  const handleLongPress = useCallback(() => {
    if (!onDragStart()) return;
    isDraggingRef.current = true;
    // Story 7.4 : la carte suit le défilement automatique, même sans mouvement du doigt — et un doigt
    // déjà immobile dans une bande de bord au soulèvement fait défiler (revue 7.4).
    autoScroll.attach((scrollDelta) => applyDragTranslation(fingerDyRef.current + scrollDelta));
    const origin = originRef.current;
    if (origin !== null) autoScroll.track(origin.y + fingerDyRef.current);
  }, [applyDragTranslation, autoScroll, onDragStart]);

  const bodyZones = formatExerciseBodyZones(activity.bodyZoneIds, bodyZonesReferential);
  // PRE-7 (R-6, D-445 C06, MFN-10 l.426) : la carte n'a pas de pastille — suffixe dérivé « - Nn » à
  // la suite du nom du mouvement, puis le suffixe de copie (Q3) ; jamais stocké.
  const displayedName = occurrenceCardName(activity, levelPositions);
  // PRE-6 (story 2.2) : contenu de la carte d'occurrence (`5544:6797`).
  const category = resolveOccurrenceCategory(activity.categoryId, categoriesReferential);
  const estimatedDuration = formatOccurrenceEstimatedDuration(activity, circuitContext);
  const summary = formatOccurrenceSummary(activity);
  // PRE-7 (D-448, point 7, recette JA2 nv-5) : synthèse « Paramètres à compléter. » (par exemple une
  // phase sans durée après un changement de rang) → carte sur `colors.dangerSurface`.
  const isIncomplete = isIncompleteSummary(summary);
  /**
   * Hauteur de la CARTE seule : 80 (carte v2, PRE-6 story 5.1, D-435), récupération comprise
   * (ligne 3). La rangée du point d'arrêt, rendue SOUS la carte hors placement, n'entre pas ici.
   */
  const blockHeight = blockHeightFor(isDragged);
  /**
   * PRE-6 (story 5.1) : récupération affichée en ligne 3 — hors placement, celle du brouillon ; en
   * placement (story 7.2, D-442), la durée SÉLECTIONNÉE de la zone (`placementRecoverySeconds` : ajout,
   * ou existante modifiée ou non, sauf retrait programmé), pour ne jamais contredire le cadre.
   */
  const displayedRecoverySeconds =
    placement === null || activity.type !== "EXERCISE"
      ? activity.postActivityRecoverySeconds
      : placementRecoverySeconds(placement.draft, activity);
  /** Bord affiché : hors Circuit, et dans le Circuit à l'état soulevé (`activityBlockDragged`). */
  const isCardBordered = activity.structuralPosition !== "IN_TOUR" || isDragged;
  /**
   * PRE-6 (story 5.3, D-435) : emplacement de l'occurrence en placement (Domaine, `placementSlots`)
   * — zone de récupération en ligne 3 ; point d'arrêt dans la rangée sous la carte.
   */
  const placementSlot = placement === null ? null : placement.slotFor(activity.id);
  const placementRecovery = placementSlot?.recovery ?? null;
  const placementStopPoint = placementSlot?.stopPoint ?? null;
  /**
   * Ligne 3 de la carte. PRE-6 story 7.2 (D-442) : en placement, toute zone de récupération d'un
   * Exercice est le cadre sélectionnable (`PlacementRecoveryFrame` : sélectionnée — ajout, ou
   * récupération existante, 0 comprise, conservée — ou non) ; hors placement, la récupération est un
   * simple affichage (`OccurrenceRecovery`) : le toucher et l'appui long reviennent à la carte.
   */
  let recoveryNode: React.ReactNode;
  if (placement !== null && placementRecovery !== null) {
    recoveryNode = (
      <PlacementRecoveryFrame
        occurrenceId={activity.id}
        exerciseName={displayedName}
        selectedSeconds={displayedRecoverySeconds ?? null}
        existing={placementRecovery.kind === "EXISTING"}
        onPress={placement.onPressRecovery}
        touchExtent={occurrenceRecoveryTouchExtent(isCardBordered)}
        testID={`composition-placement-slot-${activity.id}-recovery`}
      />
    );
  } else {
    recoveryNode = (
      <OccurrenceRecovery
        recoverySeconds={displayedRecoverySeconds}
        hiddenFromAccessibility={placement !== null}
        testID={`composition-activity-recovery-${activity.id}-recovery`}
      />
    );
  }
  /**
   * Rangée sous la carte, en placement seulement (story 5.3). PRE-6 story 6.2 (D-441) : hors
   * placement, le Point d'arrêt n'est plus dans le bloc de la carte (rangée autonome `StopPointRow`).
   * Story 6.3 (D-441, R3) : un point existant sur l'emplacement de la carte (même devenu interdit)
   * est rendu sélectionné, désélectionnable ; sinon, la puce à ajouter si l'emplacement en offre une.
   */
  const placementRowPoint: PlacementStopPointRowPoint | null =
    placement === null ? null : placement.rowPointOf(placementStopPoint);
  const hasRowBelow = placementRowPoint !== null;
  // Même translation pour la carte et sa ligne de récupération : elles font bloc.
  const blockTransform = [{ translateX: swipeTranslateX }, { translateY: isDragged ? dragTranslationY : 0 }];
  /**
   * Story 7.7 : transformation de la carte — translations horizontale (`swipeX`) ET verticale
   * (`dragY`) animées. Revue 7.7 : une fois une animation native passée sur `transform`, Fabric iOS
   * n'applique plus cette propriété depuis les commits (`propKeysManagedByAnimated`) ; le suivi
   * vertical du doigt pendant le glisser passe donc lui aussi par une valeur animée (`setValue`).
   */
  const cardTransform = [{ translateX: swipeX }, { translateY: dragY }];
  /**
   * V2-PRE-1 (plan §3.3) : changement de côté PROPRE à l'Exercice. PRE-6 (story 2.2,
   * RM-243, D-407, ARB-2) : icône neutre seulement, jamais pour un exercice unilatéral.
   */
  const hasSideChange = isBilateral(activity.sideMode);
  /**
   * PRE-6 (story 2.3, CE-T03-08 §18) : alternatives accessibles au glisser et au balayage —
   * « Monter » / « Descendre » (absentes aux extrémités de la séquence), « Dupliquer »,
   * « Supprimer ». Le balayage et l'appui long restent inchangés.
   */
  /** Nom accessible : la récupération affichée y figure (« …, récupération 20 s »), hors placement et en placement. */
  const accessibilityLabel = isDisplayableRecovery(displayedRecoverySeconds)
    ? `${formatOccurrenceAccessibilityLabel(activity, position, circuitContext, displayedName)}, ${composition.occurrenceCard.accessibilityRecovery.replace(
        "{duration}",
        () => formatCompactDuration(displayedRecoverySeconds),
      )}`
    : formatOccurrenceAccessibilityLabel(activity, position, circuitContext, displayedName);
  const accessibilityActionHandlers: Partial<Record<OccurrenceAccessibilityActionName, () => void>> = {
    ...(onMoveUp !== null ? { moveUp: onMoveUp } : {}),
    ...(onMoveDown !== null ? { moveDown: onMoveDown } : {}),
    duplicate: onDuplicate,
    delete: onDelete,
  };
  const accessibilityActionLabels: Record<OccurrenceAccessibilityActionName, string> = {
    moveUp: composition.activityActions.moveUp,
    moveDown: composition.activityActions.moveDown,
    duplicate: composition.activityActions.duplicate,
    delete: composition.activityActions.delete,
  };
  const accessibilityActions = (Object.keys(accessibilityActionHandlers) as OccurrenceAccessibilityActionName[]).map(
    (name) => ({ name, label: accessibilityActionLabels[name] }),
  );

  return (
    <Animated.View
      style={[
        styles.activityRowContainer,
        // VISUAL_CORRECTION (revue indépendante 5753653735, point 6) : le
        // gap révélé par le balayage reste BLANC hors Tour — seule une
        // Activité `IN_TOUR` montre le fond `tourSurface`, jamais une
        // Activité `BEFORE_TOUR`/`AFTER_TOUR`, qui repose elle-même sur un
        // fond blanc.
        {
          // Correctif 2.3b (retour Hermann 21/10/2026) : la rangée soulevée, au premier plan
          // (`zIndex`) mais restée à sa place d'origine (seuls carte, ligne et repère suivent le
          // doigt), devient transparente ; sinon son fond opaque masque la voisine qui remonte dans
          // la place libérée. Aucun balayage n'est possible pendant le glisser.
          // Story 5.2b : de même pendant le dialogue de perte et le retour animé (`isRaised`).
          backgroundColor: isRaised
            ? "transparent"
            : activity.structuralPosition === "IN_TOUR"
              ? CIRCUIT_SURFACE_COLOR
              : colors.background,
        },
        isRaised ? styles.activityRowContainerDragged : null,
        // PRE-6 (story 2.3b) : le bloc entier (carte, ligne, repère du rail) libère la place visée.
        { transform: [{ translateY: dragShiftValue }] },
        // PRE-6 story 7.5 : fondu de la carte supprimée.
        fadeOpacity !== null ? { opacity: fadeOpacity } : null,
      ]}
      onLayout={onLayout}
      // VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : une
      // AUTRE carte a ses actions révélées — cette carte reste bloquée
      // (aucun appui, appui long ni balayage) jusqu'à la fermeture de
      // l'autre, conformément au contrat existant (CE-T02-02).
      // Story 7.5 : la carte en cours de suppression ne répond plus.
      pointerEvents={isBlockedByOtherReveal || fadeLeaving ? "none" : "auto"}
      // Revue 7.5 : la carte qui s'efface n'est plus proposée à VoiceOver (ni actions ni activation).
      accessibilityElementsHidden={fadeLeaving}
      importantForAccessibility={fadeLeaving ? "no-hide-descendants" : "auto"}
      // PRE-6 (story 4.1) : en placement, aucun geste de carte (appui, glisser, balayage) ; seules
      // les puces de l'emplacement répondent.
      {...(placement === null
        ? {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchCancel,
            onMoveShouldSetResponderCapture: handleMoveShouldSetResponderCapture,
            onResponderMove: handleResponderMove,
            onResponderRelease: handleResponderRelease,
            onResponderTerminate: handleResponderTerminate,
            onResponderTerminationRequest: handleResponderTerminationRequest,
          }
        : {})}
      testID={`composition-activity-${activity.id}`}
    >
      {/*
       * V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : le groupe d'actions est
       * désormais un frère PRÉCÉDENT la carte (donc DERRIÈRE elle, un
       * conteneur relatif peignant ses enfants dans l'ordre de déclaration)
       * — c'est la carte qui se translate pour le découvrir PROGRESSIVEMENT,
       * jamais l'inverse. Rendu dès qu'une translation existe (pas
       * seulement une fois l'ouverture ACHEVÉE) : la révélation proportionnelle
       * pendant le geste est elle-même observable, pas seulement son
       * aboutissement.
       */}
      {swipeTranslateX < 0 || isSwipeSettling ? (
        <View
          // Revue 7.7 : pendant le retour d'une fermeture, les actions ne répondent plus.
          pointerEvents={swipeTranslateX < 0 ? "auto" : "none"}
          accessibilityElementsHidden={swipeTranslateX >= 0}
          importantForAccessibility={swipeTranslateX < 0 ? "auto" : "no-hide-descendants"}
          style={[styles.activityRowActions, { height: blockHeight }]}
          accessibilityLabel={composition.activityActions.revealAccessibilityLabel}
          testID={`composition-activity-actions-${activity.id}`}
        >
          <Pressable
            onPress={onDuplicate}
            accessibilityRole="button"
            accessibilityLabel={composition.activityActions.duplicate}
            style={[
              styles.activityRowAction,
              styles.activityRowDuplicateAction,
              { height: blockHeight },
            ]}
            testID={`composition-activity-duplicate-${activity.id}`}
          >
            <Text style={styles.activityRowDuplicateLabel}>
              {composition.activityActions.duplicate}
            </Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={composition.activityActions.delete}
            style={[
              styles.activityRowAction,
              styles.activityRowDeleteAction,
              { height: blockHeight },
            ]}
            testID={`composition-activity-delete-${activity.id}`}
          >
            <Text style={styles.activityRowDeleteLabel}>{composition.activityActions.delete}</Text>
          </Pressable>
        </View>
      ) : null}

      <AnimatedPressable
        ref={cardRef}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={LONG_PRESS_DELAY_MS}
        // PRE-6 (story 4.1) : en placement, carte inactive. Arbitrage D6 (PR #391) : son contenu
        // est grisé par `OccurrenceCard`, hors récupération de ligne 3 ; elle n'est plus un élément accessible (son contenu est masqué par
        // `OccurrenceCard`), pour que VoiceOver atteigne le contrôle de sa ligne 3 (cadre
        // « Récupération » ou récupération existante modifiable).
        disabled={placement !== null}
        accessible={placement === null}
        importantForAccessibility={placement !== null ? "no" : "auto"}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        // Intention d'édition (appui court) puis gestes de réorganisation et d'actions.
        accessibilityHint={`${composition.exerciseRow.editAccessibilityLabel}. ${composition.activityActions.reorderAccessibilityHint}`}
        accessibilityState={{ selected: isDragged }}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={(event) =>
          accessibilityActionHandlers[event.nativeEvent.actionName as OccurrenceAccessibilityActionName]?.()
        }
        style={[
          styles.activityBlock,
          // PRE-6 (story 5.1, D-435) : dans le Circuit, carte sans bord ; l'état soulevé garde le sien.
          activity.structuralPosition === "IN_TOUR" && !isDragged ? occurrenceCardInCircuitSurface : null,
          isIncomplete && !isDragged ? occurrenceCardIncompleteSurface : null,
          isDragged ? styles.activityBlockDragged : null,
          // Hauteur conditionnelle dérivée en un point unique — jamais un
          // littéral par état.
          { height: blockHeight },
          // La carte SUIT le doigt horizontalement (balayage) et
          // verticalement (déplacement soulevé) — les deux restent
          // mutuellement exclusifs en pratique (`isDraggingRef`), mais la
          // transformation est toujours appliquée pour rester continue.
          { transform: cardTransform },
        ]}
        testID={`composition-exercise-row-${activity.id}`}
      >
        {/*
         * PRE-6 (story 5.1, D-435, carte v2 `9798:44464`) : contenu de la carte d’occurrence
         * (média, nom et côté, Catégorie et travail, Zones et récupération). La surface reste
         * portée par ce `Pressable` : à l’état soulevé (CE-T02-02), son fond remplace le blanc
         * derrière le contenu, sans opacité appliquée aux textes.
         *
         * Récupération en ligne 3 : story 7.2 (D-442) — hors placement, simple affichage (le toucher
         * ouvre l’Exercice, l’appui long saisit la carte) ; en placement (story 5.3), cadre
         * sélectionnable ; le reste de la carte est inactif (story 4.1).
         */}
        <OccurrenceCard
          name={displayedName}
          category={category}
          bodyZones={bodyZones}
          summary={summary}
          estimatedDuration={estimatedDuration}
          hasSideChange={hasSideChange}
          bordered={isCardBordered}
          recovery={recoveryNode}
          // PRE-6 (story 5.3) : en placement, seul le contrôle de la ligne 3 reste accessible.
          hideContentFromAccessibility={placement !== null}
          // Arbitrage D6 (PR #391) : en placement, carte grisée, sa récupération de ligne 3 non.
          attenuated={placement !== null}
          // PRE-6 story 5.1b (D3 remplacé) : premier média de l'occurrence, transporté par le
          // brouillon (Catalogue, Séance relue, duplication), sinon l'icône générique.
          media={firstMediaPreviewSource(activity.media)}
          sideChangeTestID={`composition-activity-side-mode-${activity.id}`}
        />

      </AnimatedPressable>

      {/*
       * PRE-6 (story 5.2, D-435) : rail de l'occurrence, peint APRÈS la carte (il passe sur ses
       * marges, jusqu'aux bords du média, sans le traverser) et AVANT la rangée sous la carte. Story
       * 5.3 : il traverse les rangées d'emplacement (22, point posé 24) sur l'axe des médias, à
       * gauche des puces centrées, sans point de raccord (Figma `8328:29270`). Il ne suit ni le
       * balayage ni la carte soulevée : le
       * rail ne glisse pas ; il suit les décalages du bloc (translation du conteneur).
       */}
      {railLink !== undefined ? (
        <>
          <RailLink
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            entryY={OCCURRENCE_CARD_MEDIA.top}
            length={railLink.length}
            shift={dragShiftValue}
            prevShift={rail.shiftOf(railLink.prevKey)}
            testID={`composition-rail-link-${activity.id}`}
          />
          <RailSegment
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            top={OCCURRENCE_CARD_MEDIA.bottom}
            bottom={0}
            testID={`composition-rail-tail-${activity.id}`}
          />
        </>
      ) : null}
      {hasOwnSurfaceRail ? (
        <>
          <RailSegment
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            top={0}
            height={OCCURRENCE_CARD_MEDIA.top}
            testID={`composition-rail-own-top-${activity.id}`}
          />
          <RailSegment
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            top={OCCURRENCE_CARD_MEDIA.bottom}
            bottom={0}
            testID={`composition-rail-tail-${activity.id}`}
          />
        </>
      ) : null}

      {/*
       * Rangée sous l'occurrence, en placement seulement (story 5.3) : emplacement de point d'arrêt
       * à l'écart de la zone sous la carte (`slotGap`). PRE-6 story 6.2 (D-441) : hors placement,
       * le Point d'arrêt est une rangée autonome de la séquence (`StopPointRow`), hors du bloc.
       */}
      {hasRowBelow ? (
        <View
          style={[{ marginTop: slotGap }, { transform: blockTransform }]}
          testID={`composition-activity-recovery-slot-${activity.id}`}
        >
          {placement !== null && placementRowPoint !== null ? (
            // PRE-6 (story 5.3, D-435, `8328:29270`) : emplacement de point d'arrêt centré entre
            // la carte et l'élément suivant, cible étendue aux deux écarts (8, 9 dans le Circuit).
            <PlacementStopPointRow
              point={placementRowPoint}
              placement={placement.draft}
              onToggleStopPoint={placement.onToggleStopPoint}
              onToggleExistingStopPoint={placement.onToggleExistingStopPoint}
              // Revue 6.3 : suivie d'une rangée de point non proposé, la cible s'arrête au milieu.
              touchExtent={{ top: slotGap, bottom: placementRowFollowed ? slotGap / 2 : slotGap }}
              testID={`composition-placement-slot-${activity.id}`}
            />
          ) : null}
        </View>
      ) : null}

    </Animated.View>
  );
}

/**
 * PRE-6 (story 2.3b, amendement Hermann du 21/10/2026) — fond du conteneur du Circuit, en trois
 * couches absolues : haut arrondi, bande centrale sans rayon, bas arrondi. Pendant le glisser, la
 * mise en page reste figée et le Circuit s'agrandit ou se rétracte par translations seules, sur le
 * pilote natif : le haut suit `top`, le bas suit `bottom`, et la bande est étirée (`scaleY`,
 * centrée entre les deux bords) de `bottom - top` rapporté à sa hauteur relevée au début du
 * glisser (`dragHeight` du conteneur moins les deux rayons). Au repos, décalages nuls : la bande
 * couvre exactement le conteneur entre ses deux arrondis, quelle que soit sa hauteur.
 */
function CircuitSurface({
  top,
  bottom,
  dragHeight,
  testID,
}: {
  top: Animated.Value;
  bottom: Animated.Value;
  dragHeight: number;
  testID: string;
}) {
  // Base finie et non nulle : la hauteur relevée moins les deux rayons, au moins 1.
  const bandHeight = Number.isFinite(dragHeight)
    ? Math.max(1, dragHeight - 2 * CIRCUIT_RADIUS)
    : 1;
  const bandTransform = useMemo(
    () => [
      { translateY: Animated.multiply(Animated.add(top, bottom), 0.5) },
      {
        // Jamais négatif : un retrait plus haut que la bande l'écrase à 0 sans la retourner.
        scaleY: Animated.add(1, Animated.divide(Animated.subtract(bottom, top), bandHeight)).interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolateLeft: "clamp",
          extrapolateRight: "extend",
        }),
      },
    ],
    [bandHeight, bottom, top],
  );
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      testID={testID}
    >
      {/* Bande d'abord, arrondis ensuite : les arrondis recouvrent les jointures (`CIRCUIT_SURFACE_SEAM_OVERLAP`). */}
      <Animated.View style={[styles.circuitSurfaceBand, { transform: bandTransform }]} testID={`${testID}-band`} />
      <Animated.View style={[styles.circuitSurfaceTop, { transform: [{ translateY: top }] }]} testID={`${testID}-top`} />
      <Animated.View
        style={[styles.circuitSurfaceBottom, { transform: [{ translateY: bottom }] }]}
        testID={`${testID}-bottom`}
      />
    </View>
  );
}

/**
 * PRE-6 (story 3.1, RC-4) — zone d'appui extérieur qui referme le choix de nature du Circuit
 * (panneau Android / web, story 3.2 ; story 7.3 : le stepper du compte n'est plus révélé), montée
 * seulement pendant l'ouverture, en absolu SOUS le contenu de son parent (hors du flux et
 * de l'écart `gap`) et non accessible (le panneau porte sa propre fermeture accessible).
 *
 * Deux instances, une par parent : le corps défilant (marges et écarts entre étapes) et le
 * conteneur Circuit. Un toucher n'est proposé qu'à la vue touchée puis à ses ANCÊTRES : un appui
 * sur le fond bleu du conteneur Circuit (vue sans répondeur) remonte au conteneur, jamais à la
 * zone du corps, qui en est une sœur placée dessous. Le conteneur porte donc sa propre zone.
 */
function NatureOutsideZone({ onPress, testID }: { onPress: () => void; testID: string }) {
  return <Pressable onPress={onPress} accessible={false} style={styles.natureOutside} testID={testID} />;
}

/**
 * Hauteur de la carte d'occurrence et de ses actions glissées. PRE-6 (story 5.1, D-435) : 80 dans
 * toutes les variantes (`occurrenceCardHeight`), récupération comprise (ligne 3) ; l'état soulevé
 * garde son écart constant (`heightDelta`). La rangée du point d'arrêt est rendue SOUS la carte
 * (`ActivityRecoveryLine`), hors de cette hauteur — les mesures `onLayout` des rangées en
 * tiennent compte d'elles-mêmes.
 */
function blockHeightFor(isDragged: boolean): number {
  const rest = occurrenceCardHeight();
  return isDragged ? rest + dimensions.compositionActivityRow.heightDelta : rest;
}

/**
 * Écran d'état de la réhydratation en MODIFICATION (T01-S10,
 * CE-T01-S10-01/02/09). Conserve le Shell (en-tête + titre `Composition
 * d'une séance` inchangé) ; le corps varie : indicateur de chargement, ou
 * message + actions (Réessayer sur erreur technique, Revenir au catalogue
 * dans tous les cas — destination sûre, aucune mutation).
 */
/**
 * Recette E du 28/10/2026 (e5-12, r2-02) : en consultation, le contenu reste affiché et lu par
 * VoiceOver mais ne reçoit aucun toucher ; hors consultation, aucun élément n'est ajouté (même
 * arbre, même mise en page).
 */
function ReadOnlyFrame({ readOnly, style, children }: { readOnly: boolean; style?: ViewProps["style"]; children: React.ReactNode }) {
  if (!readOnly) return <>{children}</>;
  return (
    <View pointerEvents="none" style={style} testID="composition-read-only">
      {children}
    </View>
  );
}

function CompositionEditState({
  status,
  onRetry,
  onBackToCatalogue,
}: {
  status: "loading" | "not-found" | "archived" | "error";
  onRetry: () => void;
  onBackToCatalogue: () => void;
}) {
  const composition = strings.screens.composition;
  const t = composition.editStates;

  return (
    <ScreenShell>
      <FixedHeader
        title={composition.title}
        onBack={onBackToCatalogue}
        backAccessibilityLabel={composition.backAccessibilityLabel}
      />
      <HeaderSeparator />
      <View style={styles.editStateBody} testID="composition-edit-state">
        {status === "loading" ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel={t.loadingAccessibilityLabel}
          />
        ) : (
          <>
            <Text style={styles.editStateMessage}>
              {status === "not-found"
                ? t.notFoundMessage
                : status === "archived"
                  ? t.archivedMessage
                  : t.errorMessage}
            </Text>
            {status === "error" ? (
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel={t.retry}
                style={styles.editStatePrimaryAction}
              >
                <Text style={styles.editStatePrimaryLabel}>{t.retry}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onBackToCatalogue}
              accessibilityRole="button"
              accessibilityLabel={t.backToCatalogue}
              style={styles.editStateSecondaryAction}
            >
              <Text style={styles.editStateSecondaryLabel}>{t.backToCatalogue}</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenShell>
  );
}

/**
 * **Écart vertical UNIQUE du corps de la Composition** (T02-S02,
 * continuation après recette visuelle).
 *
 * Une seule constante gouverne les trois interstices que la recette exige
 * identiques : `Compte à rebours initial` → première carte, carte → carte, et
 * dernière carte → `Fin de séance`. Les deux premiers relèvent de conteneurs
 * DIFFÉRENTS (`bodyContent` pour les éléments structurels, `exerciseList`
 * pour les cartes d'une même zone) — les faire dépendre d'un token partagé
 * est le seul moyen de garantir leur égalité autrement que par la vigilance
 * de relecture.
 *
 * PRE-6 (story 5.2, D-435, Figma `8328:28605`) : 8 (6 depuis T02-S02), l'écart de la séquence hors
 * Circuit ; dans le Circuit, 9 (`CIRCUIT_GAP`).
 */
const COMPOSITION_ROW_GAP = SEQUENCE_GAP;

/**
 * PRE-6 (story 5.2, D-435, ch13 CE-T03-08 L1478-L1480, Figma Standard `8328:28605`) : géométrie de
 * la séquence à 402 — colonne x 24 (354, marges du corps), cartes de 370 à x 16 (débord de 8 de
 * chaque côté de la colonne), Circuit de 386 à x 8 (débord de 8 au-delà des cartes). Les marges
 * sont constantes : à 360 ou 440, cartes et Circuit suivent la largeur, sans largeur codée en dur.
 */
const CARD_OUTSET = spacing[8];
const CIRCUIT_OUTSET = CARD_OUTSET + spacing[8];
/** Circuit (Figma `9819:19906`, `9819:19947`) : marge verticale 14, écart 9, rayon 18, aplat sans contour. */
const CIRCUIT_PADDING_VERTICAL = spacing[14];
const CIRCUIT_GAP = 9;
const CIRCUIT_RADIUS = 18;
/**
 * Aplat du Circuit (Figma `9819:19906`, `#F3F4F9`) : couleur hors registre ch12, constante locale
 * (choix D5 de l'epic 5 ; ch13 CE-T03-08 L1478). `colors.tourSurface` n'est pas modifié (partagé avec
 * `SessionCard` et `DisclosureControl`) ; ajout au registre proposé au lot documentaire.
 */
const CIRCUIT_SURFACE_COLOR = "#F3F4F9";
/**
 * Haut de l'anneau du Circuit, centré sur la hauteur de l'en-tête (Figma `9819:20017` : y 15 pour
 * 40). Revue 5.2 : l'en-tête a une hauteur MINIMALE de 40 (Dynamic Type) ; l'anneau suit sa hauteur
 * mesurée, 40 tant qu'il n'est pas mesuré.
 */
function circuitHeaderRingTop(headerHeight: number): number {
  return (headerHeight - RAIL_RING_DIAMETER) / 2;
}
/**
 * Axe du rail : centre du média des cartes (Figma : x 56 à 402), exprimé dans chaque repère — carte
 * (`OCCURRENCE_CARD_MEDIA.centerX`), colonne de la séquence (bornes, rangée après le Circuit) et
 * conteneur du Circuit.
 */
const RAIL_CENTER_X_IN_COLUMN = OCCURRENCE_CARD_MEDIA.centerX - CARD_OUTSET;
const RAIL_CENTER_X_IN_CIRCUIT = RAIL_CENTER_X_IN_COLUMN + CIRCUIT_OUTSET;
/** Début du titre du Circuit : bord droit de l'anneau plus 8 (Figma : x 69 à 402, comme les bornes). */
const SEQUENCE_LABEL_INSET = RAIL_CENTER_X_IN_COLUMN + RAIL_RING_DIAMETER / 2 + spacing[8];

/**
 * PRE-6 (story 5.2) : écarts de conception dont dépend la longueur des liens du rail — les MÊMES
 * constantes que les styles (`SEQUENCE_GAP`, `CIRCUIT_GAP`, `CIRCUIT_PADDING_VERTICAL`, ancres du
 * média et des anneaux) ; l'anneau du Circuit suit la hauteur mesurée de l'en-tête.
 */
export function railGeometryFor(circuitHeaderHeight: number): RailGeometry {
  return {
    sequenceGap: SEQUENCE_GAP,
    circuitGap: CIRCUIT_GAP,
    circuitPadding: CIRCUIT_PADDING_VERTICAL,
    rowEntry: OCCURRENCE_CARD_MEDIA.top,
    circuitHeaderEntry: circuitHeaderRingTop(circuitHeaderHeight),
    endEntry: BOUNDARY_RING_TOP,
  };
}

/**
 * PRE-6 (story 5.2) : ce que chaque occurrence reçoit pour son rail — liens (`resolveRailLinks`),
 * translations animées partagées (registre de l'écran) et occurrence sortie de la chaîne.
 */
/** PRE-6 story 7.5 : éléments en cours d'effacement (suppression) et leur opacité partagée. */
type DeletionFading = {
  readonly keys: ReadonlySet<string>;
  readonly opacity: Animated.Value;
  /** Story 7.7 : éléments qui s'effacent (suppression) — sans toucher ni accessibilité ; faux pour une copie qui apparaît. */
  readonly leaving: boolean;
};

type SequenceRailContext = {
  readonly links: ReadonlyMap<string, RailLinkGeometry>;
  readonly shiftOf: (key: string) => Animated.Value;
  /** Clés des éléments sortis de la chaîne (soulevé, tenu ou en retour ; story 7.5 : supprimés). */
  readonly skippedKeys: ReadonlySet<string>;
};

/**
 * PRE-6 (story 2.3b) : session de la réorganisation animée.
 *
 * - `preview` : relevé des positions au début du geste (`originLayout`, figé : aucune mesure
 *   ultérieure n'y entre) et emplacement visé (`slot`, `null` avant le premier mouvement). Il
 *   survit au geste pendant un dialogue de confirmation de perte.
 * - `animated` : `false` après un dépôt appliqué (remise à 0 immédiate, dans le rendu de la
 *   nouvelle disposition) ; `true` sinon (retour en douceur).
 * - `circuitHeight` : hauteur du Circuit relevée au début du dernier geste, base de l'étirement
 *   de son fond ; conservée après le geste, le retour en douceur s'en servant encore.
 *
 * PRE-6 story 5.2b :
 * - `preview.heldTranslationY` : pendant le dialogue de perte, la carte relâchée reste à sa
 *   position de dépôt (translation du doigt, portée par le registre ; aspect au repos) et hors de
 *   la chaîne du rail, comme pendant le geste ; `null` pendant le geste.
 * - `release` : translation de départ de la carte relâchée, posée sans animation par le registre
 *   (une fois) — la carte quitte sa translation locale de doigt pour celle du registre, puis
 *   revient à 0 en douceur, synchronisée avec ses voisines, en restant dans la chaîne du rail.
 * - `settling` : carte en retour animé (hauteur relevée au début du geste), au premier plan et
 *   hors de la chaîne du rail jusqu'à la fin de ce retour (`whenSettled` du registre).
 */
type DragShiftSession = {
  readonly preview: {
    /** Clé de rail de l'élément soulevé (carte ou, story 6.2, point d'arrêt). */
    readonly key: string;
    readonly originLayout: CompositionDragLayout;
    readonly slot: DropTarget | null;
    readonly heldTranslationY: number | null;
  } | null;
  readonly animated: boolean;
  readonly circuitHeight: number;
  readonly release: ShiftRelease | null;
  readonly settling: { readonly key: string; readonly measuredHeight: number | undefined } | null;
};

const IDLE_DRAG_SESSION: DragShiftSession = {
  preview: null,
  animated: true,
  circuitHeight: 0,
  release: null,
  settling: null,
};

/**
 * Fin d'aperçu : décalages remis à 0, en douceur (`animated`) ou immédiatement. En douceur, la
 * carte de l'aperçu (ou celle d'un retour déjà en cours) reste au premier plan jusqu'à la fin du
 * retour ; `release` : sa position de départ, si elle quitte la translation du doigt.
 */
function endDragSession(current: DragShiftSession, animated: boolean, release: ShiftRelease | null = null): DragShiftSession {
  const preview = current.preview;
  if (preview === null && current.animated === animated && release === null && (animated || current.settling === null)) {
    return current;
  }
  const settling = !animated
    ? null
    : preview !== null
      ? {
          key: preview.key,
          measuredHeight: preview.originLayout.rows.find((row) => row.id === preview.key)?.height,
        }
      : current.settling;
  return { ...current, preview: null, animated, release: release ?? current.release, settling };
}

/**
 * PRE-6 story 7.6 : pose de départ de l'élément déposé à l'emplacement `slot` (translation qui le
 * garde sous le lâcher dans la nouvelle disposition), d'après la disposition de l'aperçu ; `null`
 * si elle ne peut être calculée.
 */
function dropSettlePose(
  preview: NonNullable<DragShiftSession["preview"]>,
  slot: DropTarget,
  translationY: number,
  draft: SessionDraft,
  removedStopPointIds: readonly string[],
): ShiftRelease | null {
  // Revue 7.6 : même hauteur d'insertion que l'aperçu (`dragShifts`), points retirés pris en compte.
  const measured = preview.originLayout.rows.find((row) => row.id === preview.key)?.height;
  const occurrenceId = stopPointIdOfKey(preview.key) === null ? occurrenceIdOfKey(preview.key) : null;
  const insertionHeight =
    occurrenceId === null ? measured : predictedInsertionHeight(draft, occurrenceId, measured, slot, () => occurrenceCardHeight());
  const shifts = resolveDragShifts(preview.originLayout, preview.key, slot, DRAG_SHIFT_GAPS, insertionHeight);
  const from = resolveDropSettleOffset(
    preview.originLayout,
    preview.key,
    slot,
    translationY,
    DRAG_SHIFT_GAPS,
    shifts,
    CIRCUIT_PADDING_VERTICAL,
    insertionHeight,
    new Set(removedStopPointIds.map(railStopKey)),
  );
  return from === null ? null : { key: preview.key, from };
}

/** Story 7.6 : pose de l'élément tenu pendant un dialogue (perte, choix de Tour), à son emplacement. */
function heldDropSettlePose(
  preview: DragShiftSession["preview"],
  draft: SessionDraft,
  removedStopPointIds: readonly string[],
): ShiftRelease | null {
  if (preview === null || preview.slot === null || preview.heldTranslationY === null) return null;
  return dropSettlePose(preview, preview.slot, preview.heldTranslationY, draft, removedStopPointIds);
}

/** Revue 7.6 : Points d'arrêt que le déplacement d'une occurrence retirerait (déplacement tolérant). */
function removedByMove(draft: SessionDraft, move: OccurrenceMove): readonly string[] {
  const plan = planOccurrenceMove(draft, move);
  return plan?.status === "PLAN" ? plan.removedStopPointIds : [];
}

/**
 * Emplacement visé sur la géométrie FIGÉE au début du geste : centre relevé de la carte glissée
 * plus son déplacement vertical, résolu par `resolveDropTarget`. Seule source de l'aperçu ET du
 * dépôt. `null` si la carte n'avait pas été mesurée.
 */
function frozenDropSlot(preview: NonNullable<DragShiftSession["preview"]>, translationY: number): DropTarget | null {
  const row = preview.originLayout.rows.find((candidate) => candidate.id === preview.key);
  if (row === undefined) {
    return null;
  }
  return resolveDropTarget(preview.originLayout, preview.key, row.top + row.height / 2 + translationY);
}

/**
 * Hauteur PRÉDITE du bloc glissé dans la zone visée (story 2.3b, point de revue 5) : l'occurrence
 * telle que le dépôt la produirait est donnée par le même plan que le dépôt (`planOccurrenceMove`) ;
 * la hauteur mesurée au début du geste (`measuredHeight`) est corrigée de l'écart de carte entre
 * l'occurrence actuelle et l'occurrence déplacée (`cardHeightOf`, injectée). La ligne de
 * récupération ne change pas (récupération et point d'arrêt suivent l'occurrence, ARB-3). Dépôt
 * refusé ou bloc non mesuré : `undefined` (hauteur mesurée).
 *
 * PRE-6 story 5.1 : la carte v2 fait 80 dans toutes les variantes, l'écart est aujourd'hui nul ;
 * le calcul est conservé, en forme pure, et protégé par un test unitaire à écart non nul.
 */
export function predictedInsertionHeight(
  draft: SessionDraft,
  activityId: string,
  measuredHeight: number | undefined,
  slot: DropTarget,
  cardHeightOf: (exercise: SessionDraftExercise) => number,
): number | undefined {
  const current = draft.exercises.find((exercise) => exercise.id === activityId);
  if (measuredHeight === undefined || current === undefined) {
    return undefined;
  }
  const plan = planOccurrenceMove(draft, { activityId, zone: slot.zone, index: slot.index });
  const moved = plan?.status === "PLAN" ? plan.patch.exercises?.find((exercise) => exercise.id === activityId) : undefined;
  if (moved === undefined) {
    return undefined;
  }
  return measuredHeight - cardHeightOf(current) + cardHeightOf(moved);
}

/**
 * Correctif 2.3b (retour Hermann 21/10/2026) : les arrondis haut et bas du fond du Circuit
 * débordent de 2 points sur la bande centrale. Sans ce chevauchement, l'étirement de la bande
 * (`scaleY`, valeurs fractionnaires) laissait un liseré clair à chaque jointure pendant le glisser.
 */
const CIRCUIT_SURFACE_SEAM_OVERLAP = 2;

/** Story 7.8 (D-443) : bornes de la roulette du Compte à rebours et de la Fin de séance. */
const SESSION_BOUNDARY_WHEEL_BOUNDS = { min: 0, max: SESSION_BOUNDARY_SECONDS_MAX } as const;

/** Revue 7.7 : continuation de tous les éléments en mouvement (copie de Dupliquer). */
const NO_CONTINUATION_EXCEPTIONS: ReadonlySet<string> = new Set();

/** Revue 7.6 : bords du Circuit, jamais continués au dépôt (voir `finishAppliedDrop`). */
const CIRCUIT_EDGE_KEYS: ReadonlySet<string> = new Set([RAIL_KEYS.circuitHeader, RAIL_KEYS.circuitEnd]);

/** PRE-6 (story 2.3b) : écarts qui apparaissent ou disparaissent avec un bloc déplacé. */
const DRAG_SHIFT_GAPS = {
  row: COMPOSITION_ROW_GAP,
  circuitRow: CIRCUIT_GAP,
  zone: COMPOSITION_ROW_GAP,
  circuit: CIRCUIT_GAP,
} as const;

const styles = StyleSheet.create({
  // T01-S10 : corps des états de réhydratation en modification.
  editStateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  editStateMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  editStatePrimaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  editStatePrimaryLabel: {
    ...type.button,
    color: colors.background,
  },
  editStateSecondaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editStateSecondaryLabel: {
    ...type.button,
    color: colors.primary,
  },
  // A-01 (`[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE
  // CORRECTION`, 2026-09-03) : `flex: 1` — le corps occupe tout l'espace
  // vertical restant entre la bande Context et `bottomAction`, poussant
  // mécaniquement ce dernier au bas de la zone utile.
  //
  // R4-13/S-01…S-09 (`[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
  // ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `body` est désormais le
  // `ScrollView` lui-même (style du conteneur défilant, sans padding
  // propre) — le padding/l'écart entre lignes vivent dans `bodyContent`
  // (`contentContainerStyle`), seul appliqué au CONTENU défilant. Header,
  // séparateur, bande Context et `bottomAction` restent hors de ce
  // `ScrollView`, donc jamais recouverts ni déplacés par le défilement.
  body: {
    flex: 1,
  },
  //
  // **T02-S02 (continuation après recette visuelle)** : `gap` passe de `16`
  // à `COMPOSITION_ROW_GAP` (`6`), la MÊME valeur que l'écart entre deux
  // cartes d'Activité (`exerciseList`). La recette a constaté un rythme
  // vertical irrégulier — `Compte à rebours` → première carte et dernière
  // carte → `Fin de séance` étaient nettement plus espacés que deux cartes
  // consécutives, parce que ces deux interstices relèvent de `bodyContent`
  // (structurel) tandis que l'interstice inter-cartes relève de
  // `exerciseList`. Les deux partagent désormais la même constante : la
  // régularité est vraie PAR CONSTRUCTION, pas par coïncidence de deux
  // littéraux.
  // Consultation : la colonne reprend l'écart du corps (`bodyContent`), porté par le cadre.
  readOnlyBody: {
    gap: COMPOSITION_ROW_GAP,
  },
  readOnlyNotice: {
    ...type.supporting,
    color: colors.textSecondary,
    textAlign: "center",
  },
  bodyContent: {
    // PRE-6 (story 5.2, D-435) : colonne de la séquence à x 24 ; le rail est dessiné par chaque
    // élément (bornes, cartes, Circuit), plus aucune marge de repères. A01 (recette PRE-8 A/B) :
    // marge standard `layout.screenGutter` (16).
    paddingLeft: layout.screenGutter,
    paddingRight: layout.screenGutter,
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: COMPOSITION_ROW_GAP,
  },
  // Recette 3 (T-49, EXT-R3-2) : effets de la zone de contexte, découpés à la bande.
  contextBandEffects: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  contextBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTEXT_BAND_FADE_SHARE,
  },
  contextBandFadeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  backHalo: {
    position: "absolute",
    width: BACK_HALO_DIAMETER,
    height: BACK_HALO_DIAMETER,
    borderRadius: BACK_HALO_DIAMETER / 2,
    backgroundColor: colors.background,
    // Centre = centre du bouton Retour de l’en-tête partagé (marge standard `layout.screenGutter`
    // depuis A01, cercle 38, centré dans la hauteur de contenu 48 juste au-dessus de la zone, sans
    // séparateur — D-353).
    left: layout.screenGutter + dimensions.backAction.visualCircle / 2 - BACK_HALO_DIAMETER / 2,
    top: -dimensions.header.contentHeight / 2 - BACK_HALO_DIAMETER / 2,
  },
  // T01-S09, correction VISUAL (point D) : `elevated` (sélecteurs de
  // roulette ancrés en popover, `AnchoredRow`/`PopoverAnchor`,
  // `bodyElevated`) est retiré — ces mécanismes n'ont plus de consommateur,
  // les roulettes numériques passant désormais par `WheelPickerOverlay`
  // (superposition plein écran, hors de ce `ScrollView`). Seul le backdrop
  // dédié à la palette de couleur (`ContextBand`, mécanisme distinct et
  // inchangé) reste actif ci-dessous.
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Correction compacte LOT_3_OF_3 : écart RÉDUIT entre deux cartes
  // Activité consécutives. T02-S02 (continuation) : porté de `8` à
  // `COMPOSITION_ROW_GAP` (`6`, token DSF `spacing/6` ; 8 depuis la story 5.2) — légère réduction
  // demandée par la recette visuelle — et PARTAGÉ avec `bodyContent`, dont
  // il devient la source unique (voir la note de `bodyContent`).
  // PRE-6 (story 5.2, D-435) : cartes de 370 à x 16 — la liste déborde de 8 de chaque côté de la
  // colonne (dans le Circuit aussi : 8 en deçà de son aplat).
  exerciseList: {
    gap: COMPOSITION_ROW_GAP,
    marginHorizontal: -CARD_OUTSET,
  },
  exerciseListInCircuit: {
    gap: CIRCUIT_GAP,
  },
  // T02-S01, révisé V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : conteneur de
  // position d'une carte d'Activité — support du groupe d'actions glissées,
  // DERRIÈRE la carte principale (`position: "absolute"`, D-128), que la
  // carte découvre en se translatant PROGRESSIVEMENT. Le fond du gap
  // (VISUAL_CORRECTION, revue indépendante 5753653735, point 6 : `colors
  // .tourSurface` UNIQUEMENT pour une Activité DANS le Tour — `colors
  // .background` (blanc) pour toute Activité hors Tour, appliqué en ligne
  // selon `activity.structuralPosition`, voir plus bas) reste égal par
  // construction à la marge `compositionTourSection.inset`
  // (`SWIPE_REVEAL_OFFSET` ci-dessus), jamais une valeur locale.
  activityRowContainer: {
    position: "relative",
  },
  // La carte soulevée passe au-dessus de ses voisines pendant le
  // déplacement — porté par le CONTENEUR (les cartes sont dans des
  // conteneurs frères : un `zIndex` sur la carte seule n'ordonnerait rien
  // au-delà du sien).
  // PRE-6 story 6.2 : rangée autonome d'un point (22 : hauteur de sa ligne), repère du rail.
  stopPointRow: {
    position: "relative",
  },
  activityRowContainerDragged: {
    zIndex: 1,
  },
  // PRE-6 story 7.8 (D-443) : Compte à rebours et Fin de séance débordent de la colonne de la
  // séquence comme les cartes (8 à droite), pour que leur cadre s'aligne sur le bord droit des cartes.
  boundaryTrailingOutset: {
    marginRight: -CARD_OUTSET,
  },
  // Correctif 2.3b : zone (liste ou Circuit) qui porte la carte soulevée, au-dessus de ses sœurs
  // du corps défilant.
  dragElevated: {
    zIndex: 1,
  },
  // T02-S02 — carte d'Activité, D-095/D-128/D-138.
  //
  // Le `Pressable` porte la surface de la carte ; `overflow: "hidden"` découpe son
  // contenu au rayon. PRE-6 (story 5.1, D-435, `9798:44464`) : fond blanc, bord 1 `#E4E7EF`
  // hors Circuit (aucun dans le Circuit, `occurrenceCardInCircuitSurface`), rayon 12
  // (`occurrenceCardSurface`) ; la récupération est en ligne 3 du contenu.
  //
  // La HAUTEUR est appliquée par l'écran (`blockHeightFor`) selon l'état soulevé.
  activityBlock: {
    ...occurrenceCardSurface,
    overflow: "hidden",
  },
  // D-129/CE-T02-02 : état soulevé — hauteur de repos + `4` (PRE-6 story 5.1 : `84` pour
  // `80`), largeur + `8`, centré à `x = 6`, fond `#F7F7FF` repris du bandeau
  // supérieur, contour `1` point `#D1D1D6`, rayon de la carte (`OCCURRENCE_CARD_RADIUS`,
  // 12 depuis la carte v2, story 5.1 ; 14 en story 2.2), ombre périphérique
  // `#14171F` à `22 %` (`0 / 0`, flou `10`, étalement `2`).
  //
  // L'agrandissement horizontal est exprimé en ÉCART (marges négatives),
  // jamais en largeur absolue : le bloc au repos occupe la largeur utile
  // réelle de l'écran, pas une constante de canevas. L'écart vertical, lui,
  // est porté par `blockHeightFor` (voir ci-dessus).
  //
  // PRE-6 story 5.2b : l'agrandissement vertical est neutre pour la mise en page — marges
  // négatives de la moitié de l'écart en haut et en bas (`tokens.ts`, « heightDelta / 2 »). La
  // carte reste à 84, centrée sur sa place, mais son conteneur garde la hauteur mesurée au repos :
  // « Les autres cartes et éléments structurels restent inchangés » (ch13, CE-T03-08, section
  // « Composer une séance / Modifier une séance — Réorganisation »). Sans cela, tout ce qui suit descendait de 4 alors que la géométrie figée du geste
  // (`originLayout`), les décalages (`resolveDragShifts`), le rail (`resolveRailLinks`) et le fond
  // du Circuit comptent la hauteur de repos : trou de 4 dans le rail pendant le glisser.
  activityBlockDragged: {
    marginHorizontal: -dimensions.compositionActivityRow.widthDelta / 2,
    marginVertical: -dimensions.compositionActivityRow.heightDelta / 2,
    backgroundColor: colors.exerciseContextBandBackground,
    borderColor: colors.compositionDraggedCardBorder,
    borderRadius: OCCURRENCE_CARD_RADIUS,
    shadowColor: colors.compositionDraggedCardShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: dimensions.compositionActivityRow.draggedShadowOpacity,
    shadowRadius: dimensions.compositionActivityRow.draggedShadowRadius,
    elevation: dimensions.compositionActivityRow.draggedElevation,
  },
  // D-128, révisé V2-CAT-01 (UI-CAT-R-007/010) : groupe superposé à droite
  // (DERRIÈRE la carte, découvert par sa translation), deux actions `72 × H`
  // aux libellés centrés horizontalement et verticalement, `H` valant la
  // hauteur de la CARTE (`80`, carte v2 — PRE-6 story 5.1) — « `Dupliquer` et
  // `Supprimer` couvrent toute la hauteur du bloc ». La hauteur est
  // appliquée par l'écran (`blockHeightFor`), pas ici.
  //
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : les QUATRE
  // coins suivent le même rayon que le bloc (`OCCURRENCE_CARD_RADIUS`, 12 depuis la carte v2,
  // PRE-6 story 5.1) — une correction
  // antérieure ne rendait carrés QUE les coins droits de `Supprimer`
  // (rightmost, flush avec le bord droit du contenu défilant), rompant la
  // silhouette arrondie uniforme que porte, elle, TOUTE autre carte de
  // cette même liste (`activityBlock`, sur ses quatre
  // coins). Le groupe entièrement révélé DEVIENT visuellement le bord droit
  // de la rangée : il doit donc reprendre exactement le même rayon partout,
  // jamais un rayon local inventé.
  activityRowActions: {
    position: "absolute",
    top: 0,
    right: 0,
    width: dimensions.compositionSwipeActions.groupWidth,
    flexDirection: "row",
    borderRadius: OCCURRENCE_CARD_RADIUS,
    overflow: "hidden",
  },
  activityRowAction: {
    width: dimensions.compositionSwipeActions.actionWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  // NON VÉRIFIÉ sur Figma (`2028:11808`) : l'accès MCP Figma n'était pas
  // disponible dans la session de cette tranche — voir le rapport de
  // mission. Seules des valeurs DÉJÀ CANONIQUES du DSF sont employées ici
  // (`colors.surface`/`textPrimary` pour l'action neutre,
  // `colors.danger`/`background` pour l'action destructive, `type.button`
  // pour les deux libellés) : aucune couleur ni typographie locale n'est
  // introduite. La conformité chromatique exacte au nœud reste à valider.
  activityRowDuplicateAction: {
    backgroundColor: colors.surface,
  },
  activityRowDuplicateLabel: {
    ...type.button,
    color: colors.textPrimary,
    textAlign: "center",
  },
  activityRowDeleteAction: {
    backgroundColor: colors.danger,
  },
  activityRowDeleteLabel: {
    ...type.button,
    color: colors.background,
    textAlign: "center",
  },
  // R4-03 (`KODJO / Card / Supporting`, `11/14`) : auparavant
  // `type.supporting` (`12/16`), non conforme au style DSF partagé.
  boundaryRowSecondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  // R4-12 : conteneur Circuit, déborde de `inset` de chaque côté du contenu
  // (`marginHorizontal: -inset`), sans largeur codée en dur. REWORK07B : il
  // porte la seule surface visuelle du bloc (fond, rayon, padding vertical,
  // hauteur minimale). T02-S01 : il héberge aussi les occurrences `IN_TOUR`
  // (CE-T02-01) — `gap` sépare l'en-tête du Circuit (`CircuitHeader`, PRE-6
  // story 3.1) de cette liste.
  //
  // PRE-6 (story 5.2, D-435, Figma `9819:19906`, `9819:19946`) : aplat `#F3F4F9` sans contour,
  // rayon 18, débord de 8 au-delà des cartes (386 à x 8 : 16 de chaque côté de la colonne), marge
  // verticale 14, écart 9 entre l'en-tête et les cartes. Plus de hauteur minimale : le Circuit vide
  // mesure 14 + 40 + 14.
  tourSectionContainer: {
    marginHorizontal: -CIRCUIT_OUTSET,
    paddingHorizontal: CIRCUIT_OUTSET,
    paddingVertical: CIRCUIT_PADDING_VERTICAL,
    // PRE-6 (story 2.3b, amendement du 21/10/2026) : le fond est porté par `CircuitSurface`
    // (trois couches qui suivent les bords pendant le glisser) ; le rayon reste la géométrie de
    // référence de la structure.
    borderRadius: CIRCUIT_RADIUS,
    gap: CIRCUIT_GAP,
  },
  // Story 2.3b : fond du conteneur tant qu'il n'est pas mesuré (sans les couches animées).
  tourSectionStaticSurface: {
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  circuitSurfaceTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CIRCUIT_RADIUS + CIRCUIT_SURFACE_SEAM_OVERLAP,
    borderTopLeftRadius: CIRCUIT_RADIUS,
    borderTopRightRadius: CIRCUIT_RADIUS,
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  circuitSurfaceBand: {
    position: "absolute",
    top: CIRCUIT_RADIUS,
    bottom: CIRCUIT_RADIUS,
    left: 0,
    right: 0,
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  circuitSurfaceBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CIRCUIT_RADIUS + CIRCUIT_SURFACE_SEAM_OVERLAP,
    borderBottomLeftRadius: CIRCUIT_RADIUS,
    borderBottomRightRadius: CIRCUIT_RADIUS,
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  // PRE-6 (story 3.1, RC-4) : zone d'appui extérieur, sous le contenu, qui referme le choix de
  // nature du Circuit. Positionnée en absolu : hors du flux et de l'écart (`gap`).
  natureOutside: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // V2-CAT-01, VISUAL_CORRECTION (revue indépendante 5753653735, point 7) :
  // arbre `Ajouter une activité` — même géométrie de carte que
  // `CatalogueCreateOptions` (rayon `standardCard`, liseré `colors.border`).
  // `top` dépend d'`insets.top` (indisponible dans cette feuille de styles
  // statique) : transmis en ligne (`addActivityTreeTop`).
  addActivityTree: {
    position: "absolute",
    left: layout.screenGutter,
    right: layout.screenGutter,
    backgroundColor: colors.background,
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 7) : voile
  // VISIBLE dédié — même token que `CatalogueCreateOptions.backdrop`
  // (`colors.overlayScrim`), jamais transparent. Distinct de `styles
  // .backdrop` (partagé avec la palette de couleur, qui reste, lui, sans
  // fond visible).
  addActivityTreeScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
  },
  addActivityTreeOption: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  addActivityTreeOptionLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  // CMP-06 : zone d'action basse regroupant la synthèse et `Continuer`.
  // A-01 : plus de `marginTop: "auto"` ici — `body` (`flex: 1`, ci-dessus)
  // absorbe désormais tout l'espace disponible, `bottomAction` suit
  // naturellement juste après. `Continuer` reste centré sur l'axe
  // horizontal de l'écran (`marginHorizontal` symétrique) ; Composition
  // n'affiche aucun cadre de navigation principal (écran de création hors
  // `(tabs)`), le critère « centré sur l'axe du cadre de navigation » de
  // cette revue ne s'applique donc pas ici (condition explicitement posée
  // par la revue elle-même, « lorsqu'il est présent »).
  // PRE-6 story 7.10 : contenu de la zone d'action (message d'échec au-dessus de « Continuer »).
  bottomAction: {
    gap: spacing[12],
  },
  // Q54 : style de l'ancien message d'échec de `CategoriesScreen` (D-107).
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
});
