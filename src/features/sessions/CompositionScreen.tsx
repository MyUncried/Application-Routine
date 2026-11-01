import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { startTransition, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";
import Reanimated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { isBilateral } from "@/domain/activities/ExecutionParameters";
import { DuplicateMovementNameError } from "@/domain/activities/MovementRepository";
import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
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
  adjustEnvelopeSpan,
  applyLayoutNatureChange,
  containerLetters,
  envelopeCandidates,
  envelopeSpanReach,
  layoutCircuitCountOutcome,
  layoutCycleCountOutcome,
  prepareLayoutNatureChange,
  toggleEnvelopeDesignation,
  wrapSpansInContainers,
  type EnvelopeEdge,
  type EnvelopeSpan,
  type EnvelopeTarget,
  type EnvelopeUnit,
} from "@/domain/sessions/layoutOperations";
import {
  type EnvelopeEdgeDrag,
  EnvelopeHandle,
  EnvelopeMovingSegment,
  envelopeTargetKey,
  useEnvelopePerimeterDrag,
} from "@/features/sessions/EnvelopePerimeter";
import {
  duplicateLayoutExercise,
  moveLayoutItem,
  moveLayoutStopPoint,
  neutralDropControl,
  removeLayoutExercise,
  stepLayoutItem,
  stepLayoutStopPoint,
  type LayoutContainerRef,
  type LayoutDropControl,
  type LayoutItemMoveOutcome,
  type LayoutItemMoveRefusal,
  type LayoutItemRef,
  type LayoutStopPointMoveOutcome,
} from "@/domain/sessions/layoutMoves";
import {
  applyLayoutPlacementDraft,
  layoutPlacementConfirmation,
  layoutPlacementSlots,
  toggleLayoutPlacementStopPointOutcome,
  toggleLayoutPlacementStopPointRemoval,
  type LayoutPlacementSlot,
  type LayoutPlacementStopPointOutcome,
} from "@/domain/sessions/layoutPlacement";
import { layoutStopPointId, sameStopPointContainer, stopPointContainerOf, stopPointLocationIn, type StopPointContainer } from "@/domain/sessions/layoutStopPoints";
import { legacyFromStructure, structureCircuits, type StructureCircuit, type StructureCycle, type StructureCycleMember } from "@/domain/sessions/structure";
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
  placementConfirmation,
  placementSlots,
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
import { MOVEMENT_SESSION_CONTEXT } from "@/features/activities/MovementScreen";
import { useCategoriesReferential } from "@/features/activities/useCategoriesReferential";
import { useMovementLevelPositions } from "@/features/activities/useMovementLevelPositions";
import { withLevelSuffix } from "@/features/activities/movementChoicePresentation";
import { LabelPickerModal } from "@/features/reference-data/LabelPickerModal";
import { useBodyZonesReferentialVersion } from "@/features/reference-data/ReferentialServiceContext";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { CircuitEntryConfirmModal } from "@/features/sessions/CircuitEntryConfirmModal";
import {
  CIRCUIT_HEADER_HEIGHT,
  CIRCUIT_REVEAL_BEZIER,
  CIRCUIT_REVEAL_DURATION_MS,
  CircuitHeader,
  useCircuitCardsReveal,
  type CircuitCardsReveal,
} from "@/features/sessions/CircuitHeader";
import { CIRCUIT_NATURE_PANEL_GAP, CircuitNaturePanel } from "@/features/sessions/CircuitNatureMenu";
import { CircuitVolumesSheet } from "@/features/sessions/CircuitVolumesSheet";
import { formatLayoutDuration, resolveRichLayout, type ResolvedLayout, type ResolvedLayoutElement } from "@/features/sessions/compositionLayout";
import { CardMotionBlock, useBlockDragGesture, VanishingBlock, type CardMotionMode } from "@/features/sessions/LayoutDragParts";
import {
  circuitEndDrop,
  hoveredCollapsedCircuit,
  LAYOUT_COLLAPSED_HOVER_DELAY_MS,
  layoutDropCandidates,
  layoutHeaderKey,
  layoutItemKey,
  layoutStopBoxKey,
  resolveLayoutDrop,
  sameLayoutDrop,
  type LayoutBox,
  type LayoutDropStopPoint,
  type LayoutDropTarget,
} from "@/features/sessions/layoutDrop";
import {
  layoutBlockShiftKey,
  layoutDragShifts,
  layoutEdgeShiftKey,
  layoutSessionRailLinks,
  layoutSettleOffset,
  layoutShiftKeys,
  layoutShiftPieces,
  liftedPiece,
  liftedShiftKey,
  resolveDropOverCollapsedCircuits,
  sameLayoutDragShifts,
  type LayoutDragShifts,
  type LayoutLiftedSource,
  type LayoutRailLink,
  type LayoutShiftPiece,
} from "@/features/sessions/layoutDragShifts";
import { CycleHeader } from "@/features/sessions/CycleHeader";
import { sessionNamePromptShown } from "@/domain/sessions/sessionNaming";
import {
  StickyHeaderFrame,
  StickyScrollContext,
  stickyCollapseOffset,
  stickyRange,
  useStickyScroll,
  type StickyRange,
  type StickyScroll,
} from "@/features/sessions/StickyHeader";
import { CreateMenu } from "@/features/sessions/CreateMenu";
import { isExerciseParametersIncomplete, markMovementsInSession } from "@/features/sessions/movementExercises";
import { useMovementExerciseIntake } from "@/features/sessions/useMovementExerciseIntake";
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
  formatCircuitDuration,
  formatCompositionSessionDuration,
  formatExerciseBodyZones,
  formatOccurrenceAccessibilityLabel,
  formatOccurrenceEstimatedDuration,
  formatOccurrenceSummary,
  isIncompleteSummary,
  isToVerifySummary,
  resolveOccurrenceCategory,
  type OccurrenceCircuitContext,
} from "@/features/sessions/compositionPresentation";
import {
  OCCURRENCE_CARD_HEIGHT,
  OCCURRENCE_CARD_MEDIA,
  OCCURRENCE_CARD_RADIUS,
  OccurrenceCard,
  occurrenceCardHeight,
  occurrenceCardIncompleteSurface,
  occurrenceCardInCircuitSurface,
  occurrenceCardSurface,
  occurrenceCardToVerifySurface,
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
  TEXT_TERTIARY,
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
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { STOP_POINT_CHIP_TOUCH_EXTENT } from "@/features/sessions/StopPointChip";
import { formatPlacementConfirmLabel, PlacementBar } from "@/features/sessions/PlacementBar";
import {
  PlacementStopPointRow,
  type PlacementStopPointRowPoint,
  type PlacementTouchExtent,
} from "@/features/sessions/PlacementLayer";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { TourBoundaryChoiceDialog } from "@/features/sessions/TourBoundaryChoiceDialog";
import {
  type AnimatedShiftRegistry,
  makeAnimatedValueNative,
  nativeShiftKey,
  type ShiftRelease,
  type ShiftTiming,
  useAnimatedShiftRegistry,
} from "@/features/sessions/useAnimatedShift";
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
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { CONTEXT_BAND_FADE_HEIGHT, ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Champ numérique actif — un seul à la fois (CIR-10) : roulettes des bornes, ou panneau du choix
 * de nature du Circuit (story 3.2,
 * Android / web ; sur iOS le menu natif porte seul son ouverture). PRE-6 story 3.4 : feuille
 * « Volumes du circuit » (`circuitVolumes`), ouverte par l'œil — l'ouvrir referme les autres.
 * PRE-6 story 7.3 (D-442) : le stepper du compte du Circuit est toujours affiché et actif ; il
 * n'est plus un champ « révélé » (ancien `circuitCount`, choix D8 remplacé).
 * PRE-9 B.1a (D-451, complément du 28/10, qui remplace D-442 sur ce point ; RM-027) : le stepper
 * est de nouveau révélé au toucher du nombre (`circuitCounter`), un seul contrôle ouvert à la fois.
 */
type OverlayKind =
  | "countdown"
  | "finalPhase"
  | "circuitCounter"
  | "circuitNature"
  | "circuitVolumes"
  | LayoutControlKind;

/**
 * PRE-9 B.1b (RM-027, D-451) : contrôles des en-têtes d'une disposition générale (plusieurs Circuits,
 * Cycles), clés par identifiant de conteneur — toujours un seul contrôle ouvert à la fois.
 */
type LayoutControlKind =
  | `layout-circuit-counter:${string}`
  | `layout-circuit-nature:${string}`
  | `layout-cycle-counter:${string}`;

/** PRE-9 B.2 (ARB-06) : mode enveloppe — conteneur à poser et contenus désignés. */
type EnvelopeContainer = "CIRCUIT" | "CYCLE";
/**
 * PRE-9 B.4b : périmètres désignés (`spans`, un conteneur par périmètre ; sélection multiple) et noms
 * des contenus touchés (annonces). [B.2 : « un seul contenu désigné » — remplacé par B.4b.]
 */
type EnvelopeState = {
  readonly container: EnvelopeContainer;
  readonly spans: readonly EnvelopeSpan[];
  readonly names: Readonly<Record<string, string>>;
};

/** PRE-9 B.4b : place d'un contenu dans un périmètre désigné (cadre continu, traits de bord). */
type EnvelopeSpanPlacement = {
  readonly span: EnvelopeSpan;
  readonly first: boolean;
  readonly last: boolean;
  /** Le périmètre contient un Circuit : cadre à la largeur du Circuit pour tous ses contenus. */
  readonly wide: boolean;
  /** Bords déplaçables (au moins un contenu atteignable au-delà, ou plus d'un contenu) : traits affichés. */
  readonly adjustable: boolean;
};

/**
 * PRE-9 B.2 : ce que chaque rangée ou bloc reçoit en mode enveloppe — éligibilité (Domaine,
 * `envelopeCandidates`), désignation et toucher de désignation. `null` hors mode. B.4b : place dans
 * un périmètre, traits de bord (pas à pas et glisser), mesure des cadres.
 */
type EnvelopeContext = {
  readonly container: EnvelopeContainer;
  readonly isCandidate: (target: EnvelopeTarget) => boolean;
  /**
   * Recette iPhone n° 2 du 31/10/2026 (b4b-saisie, b6-enveloppe) : place d'une UNITÉ — contenu ou Point
   * d'arrêt — dans un périmètre désigné ; un Point du périmètre porte sa part du cadre continu (bords
   * gauche et droit) et, au bord, son trait. [B.4b : contenus seuls.]
   */
  readonly placementOf: (target: EnvelopeUnit) => EnvelopeSpanPlacement | null;
  readonly onDesignate: (target: EnvelopeTarget, name: string) => void;
  readonly onStepEdge: (span: EnvelopeSpan, edge: EnvelopeEdge, direction: 1 | -1) => void;
  readonly onEdgeDragStart: (span: EnvelopeSpan, edge: EnvelopeEdge, translation: Animated.Value) => void;
  readonly onEdgeDragEnd: (pageY?: number) => void;
  readonly registerFrame: (key: string, view: View | null) => void;
  /** Recette n° 2 (b4b-etendre) : défilement automatique pendant le glisser d'un trait. */
  readonly autoScroll: DragAutoScroll;
  /** Contre-recette n° 4 du 01/11/2026 (b4b-etendre) : glisser d'un trait en cours, le bord du cadre le suit. */
  readonly edgeDrag: EnvelopeEdgeDrag | null;
};

const NO_ENVELOPE_SPANS: readonly EnvelopeSpan[] = [];

function sameEnvelopeTarget(a: EnvelopeTarget | null, b: EnvelopeTarget): boolean {
  return a !== null && a.kind === b.kind && a.id === b.id;
}

/**
 * PRE-9 B.2 (ARB-06) / B.4b : brouillon après « Confirmer » — un conteneur par périmètre désigné
 * (`wrapSpansInContainers`, qui donne d'abord sa disposition à un brouillon de l'ancien modèle jamais
 * enregistré).
 */
function draftAfterEnvelope(current: SessionDraft, container: EnvelopeContainer, spans: readonly EnvelopeSpan[]): SessionDraft {
  return wrapSpansInContainers(current, spans, container, () => Crypto.randomUUID());
}

const LAYOUT_CIRCUIT_NATURE_PREFIX ="layout-circuit-nature:";
const layoutCircuitCounterKind = (circuitId: string): LayoutControlKind => `layout-circuit-counter:${circuitId}`;
const layoutCircuitNatureKind = (circuitId: string): LayoutControlKind => `layout-circuit-nature:${circuitId}`;
const layoutCycleCounterKind = (cycleId: string): LayoutControlKind => `layout-cycle-counter:${cycleId}`;

/**
 * Contrôles de l'en-tête du Circuit refermés par un toucher ailleurs (RC-4) : stepper révélé, choix de
 * nature. PRE-9 B.1b : aussi ceux des en-têtes d'une disposition générale (Circuits, Cycles).
 */
function isCircuitControl(kind: OverlayKind | null): boolean {
  return kind === "circuitCounter" || kind === "circuitNature" || (kind !== null && kind.startsWith("layout-"));
}

/** PRE-9 B.1b : Circuit de la disposition dont le choix de nature est ouvert, sinon `null`. */
function layoutNatureCircuitOf(kind: OverlayKind | null): string | null {
  return kind !== null && kind.startsWith(LAYOUT_CIRCUIT_NATURE_PREFIX) ? kind.slice(LAYOUT_CIRCUIT_NATURE_PREFIX.length) : null;
}

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
 * (5752:4044, Ø 59,28). Recette iPhone du 29/10/2026 : le fondu des 20 % inférieurs (vers la
 * transparence, ch. 12 / D-224) est porté par `ContextBand` (`fadeToTransparent`).
 */
const BACK_HALO_DIAMETER = 59.28;

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
  | { readonly kind: "OCCURRENCE_DELETE"; readonly activityId: string }
  /**
   * PRE-9 B.6 (D-442, ARB-02 règle 5, ARB-02b) : opération d'une disposition générale (déplacement,
   * suppression, compte, Point déplacé, placement) qui ferait se suivre début et fin de Tour d'un
   * Circuit (`scope` CIRCUIT) ou de répétition d'un Cycle (`scope` CYCLE) — même dialogue ;
   * `apply` rejoue l'opération sur l'état COURANT avec la résolution choisie ; `cancel` : « Annuler ».
   */
  | {
      readonly kind: "LAYOUT";
      readonly scope: "CIRCUIT" | "CYCLE";
      readonly apply: (choice: TourBoundaryChoice) => void;
      readonly cancel?: () => void;
    };

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
  // PRE-9 A.2 (ARB-22a, ARB-07) : Mouvements remis par la création ou la sélection, devenus
  // Exercices du brouillon au retour au premier plan. Demande de Hermann du 29/10/2026 : aucune
  // feuille à l'insertion ; la carte « Paramètres à compléter » ouvre la feuille de paramètres.
  const { sheet: movementExerciseSheet, openParameters: openExerciseParameters } = useMovementExerciseIntake();
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
  /** Contre-recette du 30/10 : « + » de la zone de contexte, mesuré par le menu Créer. */
  const addActionRef = useRef<View>(null);
  /**
   * PRE-9 B.2 (ARB-06, COMP §5 ; Figma `10819:20344`, `10836:20478`) : mode enveloppe — conteneur à
   * poser (Circuit ou Cycle) et premier contenu désigné (`null` tant qu'aucun ne l'est) ; `null` hors
   * mode. État de l'écran seul : seul « Confirmer » écrit dans le brouillon.
   */
  const [envelope, setEnvelope] = useState<EnvelopeState | null>(null);
  /** Contre-recette du 30/10 : Cycles connus avant la pose d'un Cycle (apparition progressive du nouveau). */
  const [cycleReveal, setCycleReveal] = useState<{ readonly known: ReadonlySet<string> } | null>(null);
  /**
   * Contre-recette du 30/10 (constat b) : Exercices déjà dans un Circuit avant la pose d'un Circuit —
   * le Circuit qui naît (sur un Exercice qui n'était dans aucun Circuit) apparaît progressivement.
   * Les Exercices servent de repère : l'identifiant d'un Circuit de l'ancien modèle n'existe qu'une
   * fois la structure générale écrite.
   */
  const [circuitReveal, setCircuitReveal] = useState<{ readonly knownMembers: ReadonlySet<string> } | null>(null);
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
  /**
   * PRE-9 B.5 : carte d'une disposition générale en mouvement — supprimée (fondu, puis fermeture de sa
   * place ; brouillon écrit à la fin, `commit`, comme la suppression de l'ancien modèle) ou copie qui
   * apparaît (brouillon écrit aussitôt, comme la copie de l'ancien modèle).
   */
  const [layoutCardMotion, setLayoutCardMotion] = useState<{ readonly id: string; readonly mode: Exclude<CardMotionMode, "IDLE"> } | null>(null);
  /** PRE-9 B.5 : suppression animée en cours dans une disposition générale ; une seule à la fois. */
  const layoutDeletionRef = useRef<{ readonly id: string; readonly commit: () => void } | null>(null);
  /** Story 7.5 : termine aussitôt une suppression animée en cours (brouillon écrit). PRE-9 B.5 : de même dans une disposition générale. */
  const flushDeletion = useCallback(() => {
    deletionRef.current?.commit();
    layoutDeletionRef.current?.commit();
  }, []);
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
  /**
   * PRE-9 B.4c (COMP §7) : décalage de défilement du corps, sur le pilote natif, partagé par les
   * en-têtes collantes (`StickyHeaderFrame`) ; dernier décalage connu côté JS (CS-D6).
   */
  const bodyScrollY = useRef(new Animated.Value(0)).current;
  const bodyOffsetRef = useRef(0);
  const autoScroll = useDragAutoScroll({
    scrollTo: (offset) => bodyScrollRef.current?.scrollTo({ y: offset, animated: false }),
    measure: (callback) => bodyScrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _width, height) => callback(y, height)),
    // Story 7.10 (D-444) : la zone d'action fixe recouvre le bas du corps — la bande du bas du
    // défilement automatique remonte au haut de cette zone (dégradé compris) ; le décalage maximal
    // reste celui du conteneur entier (la réserve est déjà dans la hauteur du contenu).
    bottomObstruction: () => actionZoneReserveRef.current,
  });
  const autoScrollRef = useRef(autoScroll);
  useLayoutEffect(() => {
    autoScrollRef.current = autoScroll;
  });
  const handleBodyScroll = useCallback((offset: number) => {
    bodyOffsetRef.current = offset;
    autoScrollRef.current.handleScroll(offset);
  }, []);
  // PRE-9 B.4c : le décalage alimente les en-têtes collantes sur le pilote natif ; l'écouteur garde le
  // défilement automatique (story 7.4) et le dernier décalage connu.
  const bodyScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: bodyScrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => handleBodyScroll(event.nativeEvent.contentOffset.y),
      }),
    [bodyScrollY, handleBodyScroll],
  );
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
  // PRE-9 B.1b : `circuitId` désigne le Circuit d'une disposition générale ; `null` : le Circuit
  // unique de l'ancien modèle (flux inchangé).
  const [pendingNatureChange, setPendingNatureChange] = useState<{
    readonly nature: CircuitNature;
    readonly circuitId: string | null;
  } | null>(null);
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
  /**
   * PRE-9 B.1a : hauteur mesurée de la seule ligne d'en-tête du Circuit (nom, chevron, compteur,
   * durée) — l'anneau du rail y est centré, la ligne des noms du Circuit replié étant dessous.
   */
  const [circuitHeaderRowHeight, setCircuitHeaderRowHeight] = useState<number | null>(null);
  /**
   * PRE-9 B.1a (ARB-12 : état replié/déplié NON persisté, Circuit déplié à l'ouverture, aucun
   * contenu du brouillon perdu pendant un repli) : `null` = Circuit déplié ; sinon, Circuit replié,
   * avec la liste de ses éléments (clés) au moment du repli. Un état local de l'écran : le brouillon
   * n'en sait rien. Voir `isCircuitCollapsed`.
   */
  const [circuitCollapsedContent, setCircuitCollapsedContent] = useState<string | null>(null);
  const [circuitSectionTop, setCircuitSectionTop] = useState(0);
  // PRE-6 (story 4.1, AD-43) : mode placement — sous-brouillon LOCAL des ajouts (`null` hors
  // placement). Seul « Confirmer » l'applique au brouillon de séance ; seul « Continuer » persiste
  // (D-388). Occurrence dont la roulette « Durée de récupération » est ouverte.
  const [placement, setPlacement] = useState<PlacementDraft | null>(null);
  // Revue 6.3 : effet du dernier toucher en placement, annoncé après le rendu (voir plus bas) ;
  // `withLabel` : suivi du nouveau libellé de « Confirmer » (ajouts, ch13 L1524).
  const placementAnnouncementRef = useRef<{ readonly text: string; readonly withLabel: boolean } | null>(null);
  /*
   * [Story 7.2 (D-442) : roulette « Durée de récupération » du placement et défaut du Profil relu à
   * l'entrée en placement — retirés le 01/11/2026 (ordre de Hermann, point 2 ; ch07 « Récupération
   * de l'Exercice et défauts du Profil ») : le placement ne porte que les Points d'arrêt ; la
   * récupération de l'Exercice se règle dans Paramètres d'exécution.]
   */
  // Demande de focus sur « Ajouter un arrêt », à la sortie du placement par Confirmer / Annuler.
  const [addStopFocusRequest, setAddStopFocusRequest] = useState(0);
  /*
   * PRE-6 story 7.2 (D-442, qui remplace sur ce point D-435) : la récupération ne se règle plus hors
   * placement — la roulette de modification, la bulle « Retirer la récupération » et les actions
   * accessibles de la carte (stories 4.2, 5.1) sont retirées ; tout passe par le placement.
   */
  /** Sortie du placement sans mutation : sous-brouillon jeté. */
  const leavePlacement = useCallback(() => {
    setPlacement(null);
  }, []);

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
    // PRE-9 B.2 : le mode enveloppe aussi, annulé d'abord comme le placement.
    (deletion !== null ||
      placement !== null ||
      envelope !== null ||
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
    if (isPendingExit && (isCircuitControl(openOverlay) || openOverlay === "circuitVolumes")) {
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
    // PRE-9 B.2 : de même, une sortie pendant le mode enveloppe l'annule d'abord, sans mutation.
    if (isPendingExit && envelope !== null) {
      setEnvelope(null);
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
    closeCircuitControls();
    // Story 7.5 : pendant une suppression animée, le brouillon n'est pas encore écrit — elle est
    // terminée aussitôt, et l'enregistrement demande un nouveau toucher (choix 7.5).
    if (deletionRef.current !== null || layoutDeletionRef.current !== null) {
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
  // concernée. PRE-9 B.1a (RM-027) : referme aussi le stepper révélé du compte du Circuit.
  const closeCircuitControls = useCallback(() => {
    setOpenOverlay((current) => (isCircuitControl(current) ? null : current));
  }, []);
  // Écran quitté (perte du premier plan) : le stepper révélé et le choix de nature se referment.
  // Story 3.2 : une conversion en attente de confirmation est aussi abandonnée (aucune mutation).
  useFocusEffect(
    useCallback(
      () => () => {
        closeCircuitControls();
        setPendingNatureChange(null);
        // Story 3.4 : la feuille des volumes se referme aussi (aucune mutation).
        setOpenOverlay((current) => (current === "circuitVolumes" ? null : current));
        // Story 4.1 : le placement est abandonné sans mutation.
        leavePlacement();
        // PRE-9 B.2 : le mode enveloppe aussi.
        setEnvelope(null);
        // Story 7.5 : une suppression animée en cours est écrite.
        flushDeletion();
      },
      [closeCircuitControls, flushDeletion, leavePlacement],
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
        closeCircuitControls();
      }
      setRevealedActionsId(activityId);
    },
    [closeCircuitControls],
  );
  const handleDragStart = useCallback(
    (key: string | null) => {
      if (key !== null) {
        closeCircuitControls();
        // Story 4.2 : le glisser d'un point referme les actions glissées révélées.
        if (key.startsWith(RAIL_STOP_KEY_PREFIX)) setRevealedActionsId(null);
      }
      // Story 7.4 : fin du geste (dépôt, annulation) — le défilement automatique s'arrête.
      if (key === null) autoScroll.end();
      draggedKeyRef.current = key;
      setDraggedKey(key);
    },
    [autoScroll, closeCircuitControls],
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
    // PRE-9 B.1a : les emplacements du Circuit (début de Tour, après ses exercices) doivent être
    // visibles — le Circuit replié se déplie à l'entrée en placement.
    setCircuitCollapsedContent(null);
    setPlacement(EMPTY_PLACEMENT_DRAFT);
  }, [finishDragPreview, flushDeletion]);
  /** « Annuler » (et retour système) : l'état d'entrée est restitué, sans aucune mutation. */
  const cancelPlacement = useCallback(() => {
    leavePlacement();
    setAddStopFocusRequest((current) => current + 1);
  }, [leavePlacement]);

  /**
   * PRE-9 B.2 (ARB-06, COMP §5, D-451) — « Ajouter un circuit / un cycle » : contenus éligibles du
   * Domaine (`envelopeCandidates` : pour un Circuit, un Exercice du niveau Séance ou d'un Cycle ; pour
   * un Cycle, un Exercice ou un Circuit du niveau Séance ; jamais une Séance qui sortirait de l'ancien
   * modèle tant qu'elle porte des Points d'arrêt, B.6). Sans contenu éligible, l'action du menu est
   * indisponible.
   */
  const circuitEnvelopeCandidates = useMemo(() => envelopeCandidates(draft, "CIRCUIT"), [draft]);
  const cycleEnvelopeCandidates = useMemo(() => envelopeCandidates(draft, "CYCLE"), [draft]);
  const isEnvelopeActive = envelope !== null;
  /**
   * Entrée en mode enveloppe, comme l'entrée en placement : toute surface ouverte se referme, un
   * aperçu de glisser se termine, une suppression animée est écrite ; rien n'est désigné.
   */
  const enterEnvelope = useCallback(
    (container: EnvelopeContainer) => {
      if (draggedKeyRef.current !== null || placement !== null) return;
      flushDeletion();
      Keyboard.dismiss();
      setOpenOverlay(null);
      setPendingNatureChange(null);
      setPendingCircuitEntry(null);
      finishDragPreview(false);
      setIsAddActivityTreeOpen(false);
      setRevealedActionsId(null);
      setCycleReveal(null);
      setCircuitReveal(null);
      setEnvelope({ container, spans: [], names: {} });
    },
    [finishDragPreview, flushDeletion, placement],
  );
  /**
   * PRE-9 B.4b (sélection multiple ; Hermann, 29/10 et 31/10 : « Un Circuit par Exercice ») : toucher
   * un contenu éligible libre le désigne (un nouveau périmètre, donc un conteneur de plus) ; toucher un
   * contenu d'un périmètre désigné retire ce périmètre. [B.2 : « un seul ; un autre toucher le déplace »
   * — remplacé.]
   */
  const designateEnvelopeTarget = useCallback(
    (target: EnvelopeTarget, name: string) => {
      if (envelope === null) return;
      const spans = toggleEnvelopeDesignation(draft, envelope.container, envelope.spans, target);
      if (spans === envelope.spans) return;
      const added = spans.length > envelope.spans.length;
      setEnvelope({ ...envelope, spans, names: { ...envelope.names, [envelopeTargetKey(target)]: name } });
      const t = strings.screens.composition.envelope;
      AccessibilityInfo.announceForAccessibility((added ? t.designatedAnnouncement : t.undesignatedAnnouncement).replace("{name}", name));
    },
    [draft, envelope],
  );
  /** PRE-9 B.4b : un périmètre remplacé par son extension ou sa réduction ; annonce de son étendue. */
  const replaceEnvelopeSpan = useCallback((previous: EnvelopeSpan, next: EnvelopeSpan) => {
    setEnvelope((current) => (current === null ? current : { ...current, spans: current.spans.map((span) => (span === previous ? next : span)) }));
    const t = strings.screens.composition.envelope;
    AccessibilityInfo.announceForAccessibility(
      next.members.length === 1 ? t.perimeterOne : t.perimeterMany.replace("{count}", String(next.members.length)),
    );
  }, []);
  const perimeterDrag = useEnvelopePerimeterDrag({
    draft,
    container: envelope?.container ?? "CIRCUIT",
    spans: envelope?.spans ?? NO_ENVELOPE_SPANS,
    onReplace: replaceEnvelopeSpan,
  });
  const { begin: beginPerimeterDrag, end: endPerimeterDrag } = perimeterDrag;
  /**
   * Recette iPhone n° 2 du 31/10/2026 (b4b-etendre, Hermann : « Lorsqu'on bouge un trait l'écran bouge
   * avec. […] l'écran doit rester figé et se déplacer avec le défilement du train uniquement s'il
   * dépasse le cadre de l'écran ») : pendant le glisser d'un trait, le défilement par l'utilisateur est
   * coupé (comme pour une carte saisie, T02-S01) — tout de suite sur la vue native, puis par l'état de
   * l'écran ; seul le défilement automatique près des bords déplace la liste (`EnvelopeHandle`).
   */
  const [isEnvelopeEdgeDragging, setIsEnvelopeEdgeDragging] = useState(false);
  const lockBodyScroll = useCallback((locked: boolean) => {
    try {
      bodyScrollRef.current?.setNativeProps({ scrollEnabled: !locked });
    } catch {
      // Vue native indisponible (tests, démontage) : l'état de l'écran suffit.
    }
    setIsEnvelopeEdgeDragging(locked);
  }, []);
  const beginEnvelopeEdgeDrag = useCallback(
    (span: EnvelopeSpan, edge: EnvelopeEdge, translation: Animated.Value) => {
      lockBodyScroll(true);
      beginPerimeterDrag(span, edge, translation);
    },
    [beginPerimeterDrag, lockBodyScroll],
  );
  const endEnvelopeEdgeDrag = useCallback(
    (pageY?: number) => {
      lockBodyScroll(false);
      endPerimeterDrag(pageY);
    },
    [endPerimeterDrag, lockBodyScroll],
  );
  /** PRE-9 B.4b : trait de bord, pas à pas (VoiceOver) — étendre (`1`) ou réduire (`-1`) d'un contenu. */
  const stepEnvelopeEdge = useCallback(
    (span: EnvelopeSpan, edge: EnvelopeEdge, direction: 1 | -1) => {
      if (envelope === null) return;
      const delta = edge === "TOP" ? -direction : direction;
      const next = adjustEnvelopeSpan(draft, envelope.container, span, edge, delta, envelope.spans);
      if (next !== span) replaceEnvelopeSpan(span, next);
    },
    [draft, envelope, replaceEnvelopeSpan],
  );
  /** « Annuler » (et retour système, X, perte du premier plan) : sortie sans aucune mutation. */
  const cancelEnvelope = useCallback(() => setEnvelope(null), []);
  /** « Confirmer le circuit / le cycle » (B.4b : « les circuits / les cycles ») : un conteneur par périmètre désigné, puis sortie du mode. */
  const confirmEnvelope = useCallback(() => {
    if (envelope === null || envelope.spans.length === 0) return;
    const { container, spans, names } = envelope;
    // Contre-recette du 30/10 : Cycles présents avant la pose — celui qui naît apparaît progressivement.
    if (container === "CYCLE") setCycleReveal({ known: new Set(layoutCycleIds(resolveRichLayout(draft))) });
    // Contre-recette du 30/10 (constat b) : de même pour le Circuit qui naît.
    if (container === "CIRCUIT") setCircuitReveal({ knownMembers: new Set(draftCircuitMembers(draft)) });
    updateDraft((current) => draftAfterEnvelope(current, container, spans));
    setEnvelope(null);
    const t = strings.screens.composition.envelope;
    const first = spans[0]!.members[0]!;
    AccessibilityInfo.announceForAccessibility(
      spans.length > 1
        ? (container === "CIRCUIT" ? t.circuitsCreatedAnnouncement : t.cyclesCreatedAnnouncement).replace("{count}", String(spans.length))
        : (container === "CIRCUIT" ? t.circuitCreatedAnnouncement : t.cycleCreatedAnnouncement).replace("{name}", names[envelopeTargetKey(first)] ?? ""),
    );
  }, [draft, envelope, updateDraft]);
  const envelopeContext = useMemo<EnvelopeContext | null>(() => {
    if (envelope === null) return null;
    const { container, spans } = envelope;
    const candidates = container === "CIRCUIT" ? circuitEnvelopeCandidates : cycleEnvelopeCandidates;
    const placements = new Map<string, EnvelopeSpanPlacement>();
    for (const span of spans) {
      const reach = envelopeSpanReach(draft, container, span, spans);
      const wide = span.members.some((member) => member.kind === "CIRCUIT");
      const adjustable = reach !== null && reach.run.length > 1;
      // Recette iPhone n° 2 du 31/10/2026 (b4b-saisie, b6-enveloppe) : les unités du périmètre — ses
      // contenus et les Points d'arrêt qu'il contient (entre ses contenus ou à son bord) — portent
      // chacune leur part du cadre continu ; le premier et le dernier, les traits. [B.4b : contenus seuls.]
      const units: readonly EnvelopeUnit[] = reach === null ? span.members : reach.run.slice(reach.start, reach.end + 1);
      units.forEach((unit, index) =>
        placements.set(envelopeTargetKey(unit), { span, first: index === 0, last: index === units.length - 1, wide, adjustable }),
      );
    }
    return {
      container,
      isCandidate: (target) => candidates.some((candidate) => sameEnvelopeTarget(candidate, target)),
      placementOf: (target) => placements.get(envelopeTargetKey(target)) ?? null,
      onDesignate: designateEnvelopeTarget,
      onStepEdge: stepEnvelopeEdge,
      onEdgeDragStart: beginEnvelopeEdgeDrag,
      onEdgeDragEnd: endEnvelopeEdgeDrag,
      registerFrame: perimeterDrag.registerFrame,
      autoScroll,
      edgeDrag: perimeterDrag.edgeDrag,
    };
  }, [
    autoScroll,
    beginEnvelopeEdgeDrag,
    circuitEnvelopeCandidates,
    cycleEnvelopeCandidates,
    designateEnvelopeTarget,
    draft,
    endEnvelopeEdgeDrag,
    envelope,
    perimeterDrag.edgeDrag,
    perimeterDrag.registerFrame,
    stepEnvelopeEdge,
  ]);
  /** Circuit unique de l'ancien modèle, tel que le Domaine le désigne parmi les contenus éligibles d'un Cycle. */
  const legacyCircuitTarget: EnvelopeTarget = cycleEnvelopeCandidates.find((candidate) => candidate.kind === "CIRCUIT") ?? {
    kind: "CIRCUIT",
    id: "",
  };
  /**
   * PRE-6 story 6.3 (D-441, RM-251) : composition sur laquelle se jugent les bascules de point et
   * l'applicabilité du sous-brouillon — toujours fournie au Domaine (`togglePlacementStopPoint`,
   * `placementConfirmation`, `placementSlots`) : la forme historique sans contexte n'est plus appelée.
   */
  const placementContext = useMemo<PlacementContext>(
    () => ({ exercises: draft.exercises, stopPoints: draft.stopPoints ?? EMPTY_STOP_POINTS, tourRepeatCount: draft.tourRepeatCount }),
    [draft.exercises, draft.stopPoints, draft.tourRepeatCount],
  );
  /**
   * PRE-9 B.6 (ARB-02, ch08 « Placement des récupérations et des points d'arrêt ») : disposition
   * générale — le placement s'y applique sur tous les niveaux (`layoutPlacement.ts`), mêmes règles,
   * même sous-brouillon, même barre ; sinon le placement de l'ancien modèle, inchangé.
   */
  const isGeneralLayout = draft.structure !== undefined && legacyFromStructure(draft.structure) === null;
  /** Story 6.3 : nature de « Confirmer » (libellé, disponibilité) ; `null` hors placement. */
  const confirmation = useMemo(
    () =>
      placement === null
        ? null
        : isGeneralLayout
          ? layoutPlacementConfirmation(placement, draft)
          : placementConfirmation(placement, placementContext),
    [draft, isGeneralLayout, placement, placementContext],
  );
  /**
   * « Confirmer » : une seule mise à jour fonctionnelle du brouillon (`stopPoints` [récupérations :
   * retiré le 01/11/2026], `applyPlacementDraft` : ajouts, modifications de durée et — story 6.3, D-441 —
   * retraits programmés, en une fois, sans point consécutif), puis sortie du placement. Disponible
   * dès qu'un changement est applicable (`placementConfirmation` ≠ `NONE`). Identifiants des
   * points tirés hors du calcul d'état.
   */
  const confirmPlacement = useCallback(() => {
    if (placement === null || confirmation === null || confirmation.kind === "NONE") return;
    const applied = placement;
    // PRE-9 B.6 : disposition générale — application sur toute la structure (`applyLayoutPlacementDraft`).
    const apply = isGeneralLayout ? applyLayoutPlacementDraft : applyPlacementDraft;
    // Rien d'applicable sur le brouillon courant (même brouillon rendu) : aucune mise à jour.
    const preview = apply(draft, applied, () => "");
    if (preview !== draft) {
      const stopPointIds = applied.stopPoints.map(() => Crypto.randomUUID());
      updateDraft((current) => {
        let next = 0;
        return apply(current, applied, () => stopPointIds[next++] ?? Crypto.randomUUID());
      });
    }
    leavePlacement();
    if (isGeneralLayout) {
      // PRE-9 B.6 : focus rendu à « Ajouter un arrêt ».
      setAddStopFocusRequest((current) => current + 1);
      return;
    }
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
  }, [confirmation, draft, isGeneralLayout, leavePlacement, placement, requestItemFocus, updateDraft]);
  /**
   * Contre-recette iPhone du 30/10 (Hermann : « Appuyer de nouveau sur le bouton d'action point
   * d'arrêt referme l'écran de sélection (même comportement sur confirmer) ») : hors placement,
   * « Ajouter un arrêt » y entre ; en placement, le même bouton referme la sélection comme
   * « Confirmer » (changements appliqués). Sans changement applicable (« Confirmer » inactif), il n'y
   * a rien à appliquer : la sélection se referme sans mutation.
   */
  const toggleAddStop = useCallback(() => {
    if (placement === null) {
      enterPlacement();
      return;
    }
    if (confirmation !== null && confirmation.kind !== "NONE") confirmPlacement();
    else cancelPlacement();
  }, [cancelPlacement, confirmPlacement, confirmation, enterPlacement, placement]);
  /**
   * Toucher un emplacement libre ou ajouté : bascule du Domaine AVEC contexte (story 6.3, D-441) —
   * ajout s'il est proposé, désélection s'il est ajouté. Story 7.2 (D-442) : un ajout qui ferait se
   * suivre un début et une fin de Tour (N ≥ 2) ouvre le choix « Début de tour / Fin de tour ».
   */
  const handlePlacementStopPointToggle = useCallback(
    (location: StopPointLocation) => {
      if (placement === null) return;
      const t = strings.screens.composition.placement;
      if (isGeneralLayout) {
        // PRE-9 B.6 (ARB-02b) : même choix, Circuit (« de tour ») ou Cycle (« de répétition »).
        const general = toggleLayoutPlacementStopPointOutcome(placement, location, draft);
        if (general.status === "CHOICE_REQUIRED") {
          openTourChoice({
            kind: "LAYOUT",
            scope: general.scope.kind,
            apply: (choice) => {
              const resolved = general.resolutions[choice];
              placementAnnouncementRef.current = {
                text: isPlacementStopPointAdded(resolved, location) ? t.stopPointAddedAnnouncement : t.additionCancelledAnnouncement,
                withLabel: true,
              };
              setPlacement(resolved);
            },
          });
          return;
        }
        if (general.placement === placement) return;
        placementAnnouncementRef.current = {
          text: isPlacementStopPointAdded(general.placement, location) ? t.stopPointAddedAnnouncement : t.additionCancelledAnnouncement,
          withLabel: true,
        };
        setPlacement(general.placement);
        return;
      }
      const outcome = togglePlacementStopPointOutcome(placement, location, placementContext);
      if (outcome.status === "CHOICE_REQUIRED") {
        openTourChoice({ kind: "PLACEMENT_STOP_POINT", location });
        return;
      }
      const next = outcome.placement;
      if (next === placement) return;
      // Revue 6.3 (ch13 L1524) : effet, puis nombre d'ajouts (« Point d'arrêt ajouté. Confirmer 2 … »).
      placementAnnouncementRef.current = {
        text: isPlacementStopPointAdded(next, location) ? t.stopPointAddedAnnouncement : t.additionCancelledAnnouncement,
        withLabel: true,
      };
      setPlacement(next);
    },
    [draft, isGeneralLayout, openTourChoice, placement, placementContext],
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
      const next = isGeneralLayout
        ? toggleLayoutPlacementStopPointRemoval(placement, stopPointId, draft)
        : togglePlacementStopPointRemoval(placement, stopPointId, placementContext);
      if (next === placement) {
        // PRE-9 B.6 : disposition générale — resélection en conflit de répétition avec un ajout : choix.
        const choice = isGeneralLayout ? layoutReselectionChoice(placement, stopPointId, draft) : null;
        if (choice !== null) {
          openTourChoice({
            kind: "LAYOUT",
            scope: choice.scope.kind,
            apply: (keep) => {
              const resolved = choice.resolutions[keep];
              if (isPlacementStopPointRemoved(resolved, stopPointId)) AccessibilityInfo.announceForAccessibility(t.stopPointKeepRefusedAnnouncement);
              else placementAnnouncementRef.current = { text: t.stopPointKeptAnnouncement, withLabel: true };
              setPlacement(resolved);
            },
          });
          return;
        }
        if (!isGeneralLayout && placementReselectionChoice(placement, stopPointId, placementContext) !== null) {
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
    [draft, isGeneralLayout, openTourChoice, placement, placementContext],
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
  // PRE-9 B.6 : disposition générale — emplacements de toute la structure (`layoutPlacementSlots`),
  // vus par l'offre d'« Ajouter un arrêt » comme ceux de l'ancien modèle (`layoutOfferSlots`).
  const entrySlots = useMemo(
    () =>
      isGeneralLayout
        ? layoutOfferSlots(draft, EMPTY_PLACEMENT_DRAFT)
        : placementSlots(placementContext.exercises, placementContext.stopPoints, EMPTY_PLACEMENT_DRAFT, placementContext),
    [draft, isGeneralLayout, placementContext],
  );
  const draftSlots = useMemo(
    () =>
      placement === null || isGeneralLayout
        ? entrySlots
        : placementSlots(placementContext.exercises, placementContext.stopPoints, placement, placementContext),
    [entrySlots, isGeneralLayout, placement, placementContext],
  );
  /** PRE-9 B.6 : emplacements de Point de la disposition générale sur l'état effectif du placement. */
  const generalSlots = useMemo(
    () => (isGeneralLayout ? layoutPlacementSlots(draft, placement ?? EMPTY_PLACEMENT_DRAFT) : NO_LAYOUT_PLACEMENT_SLOTS),
    [draft, isGeneralLayout, placement],
  );
  // « Ajouter un arrêt » est indisponible quand le placement n'aurait rien à proposer (Composition
  // vide, tout est déjà présent). Story 6.3 (D-441, R3) : un point existant IDENTIFIÉ suffit à le
  // rendre disponible — le placement est le seul chemin de son retrait ; un indice le dit quand
  // aucun ajout n'est possible.
  const entryOffer = placementOfferOf(entrySlots);
  const hasPlacementOffer = entryOffer.any;
  const addStopAccessibilityHint =
    entryOffer.any && !entryOffer.additions ? strings.screens.composition.placement.addStopRemovalOnlyHint : undefined;
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
    () => (placement === null ? draft : (isGeneralLayout ? applyLayoutPlacementDraft : applyPlacementDraft)(draft, placement, () => "")),
    [draft, isGeneralLayout, placement],
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
            onToggleStopPoint: handlePlacementStopPointToggle,
            onToggleExistingStopPoint: handlePlacementExistingStopPointToggle,
          },
    [
      circuitHeadRowPoint,
      handlePlacementExistingStopPointToggle,
      placementRowEnvironment,
      handlePlacementStopPointToggle,
      placement,
      slotByOccurrence,
    ],
  );
  /**
   * PRE-9 B.6 (ch08 « Placement des récupérations et des points d'arrêt », D-441, D-442, ARB-02) —
   * placement d'une disposition générale : la carte porte sa zone de récupération et l'emplacement de
   * Point qui la suit dans son conteneur (même rendu que l'ancien modèle) ; les emplacements de tête
   * (Circuit, Cycle) et d'après un conteneur sont des rangées autonomes (`layoutStops.rowsAt`).
   */
  const generalSlotAfter = useMemo(
    () => new Map(generalSlots.flatMap((slot) => (slot.afterExerciseId === null ? [] : [[slot.afterExerciseId, slot] as const]))),
    [generalSlots],
  );
  const generalLabels = useMemo(
    () => (isGeneralLayout ? layoutPlacementLabels(draft, generalSlots, levelPositions) : null),
    [draft, generalSlots, isGeneralLayout, levelPositions],
  );
  const generalRowPointOf = useCallback(
    (slot: LayoutPlacementSlot | undefined): PlacementStopPointRowPoint | null =>
      slot === undefined || placement === null || generalLabels === null ? null : layoutRowPointOf(slot, placement, draft, generalLabels),
    [draft, generalLabels, placement],
  );
  const generalPlacementRowContext = useMemo<PlacementRowContext | null>(() => {
    if (placement === null || !isGeneralLayout) return null;
    const bySlotKey = new Map(generalSlots.map((slot) => [stopPointKey(slot.designation), slot]));
    return {
      draft: placement,
      slotFor: (occurrenceId) => {
        const occurrence = draft.exercises.find((exercise) => exercise.id === occurrenceId);
        if (occurrence === undefined) return null;
        const after = generalSlotAfter.get(occurrenceId);
        return { kind: "OCCURRENCE", occurrenceId: occurrence.id, stopPoint: after?.stopPoint ?? null };
      },
      rowPointOf: (stopPoint) => (stopPoint === null ? null : generalRowPointOf(bySlotKey.get(stopPointKey(stopPoint.location)))),
      circuitHeadRowPoint: null,
      onToggleStopPoint: handlePlacementStopPointToggle,
      onToggleExistingStopPoint: handlePlacementExistingStopPointToggle,
    };
  }, [
    draft.exercises,
    generalRowPointOf,
    generalSlotAfter,
    generalSlots,
    handlePlacementExistingStopPointToggle,
    handlePlacementStopPointToggle,
    isGeneralLayout,
    placement,
  ]);

  const composition = strings.screens.composition;
  const addToSession = strings.screens.activities.addToSession;

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
  /**
   * PRE-9 B.1a (ARB-12) : Circuit replié. Le repli ne vaut que pour le contenu qu'il masquait : si
   * le contenu du Circuit change pendant le repli (exercice entré ou sorti par « Monter » /
   * « Descendre », point d'arrêt retiré au passage à N = 1…), le Circuit se déplie, pour qu'aucun
   * changement du brouillon ne reste caché (ajustement pendant le rendu, patron React « ajuster un
   * état sur un changement de prop »). Jamais replié en placement (emplacements du Circuit visibles).
   */
  /**
   * PRE-9 B.2 (D-451, COMP §1 : « une Séance commence sans Circuit », « un conteneur n'est jamais
   * vide », « il disparaît lorsque son dernier membre en sort ») : le Circuit de l'ancien modèle n'est
   * rendu que s'il contient au moins un Exercice. Sans lui, les zones avant et après se suivent en une
   * seule séquence ; un Circuit naît par « Ajouter un circuit » (mode enveloppe), jamais par un dépôt
   * dans un Circuit vide.
   */
  const hasLegacyCircuit = zoneItems.IN_TOUR.some((item) => item.kind === "OCCURRENCE");
  const circuitContentKey = zoneItems.IN_TOUR.map(zoneItemKey).join(" ");
  if (circuitCollapsedContent !== null && circuitCollapsedContent !== circuitContentKey) {
    setCircuitCollapsedContent(null);
  }
  const isCircuitCollapsed = circuitCollapsedContent === circuitContentKey && placement === null;
  /** Recette du 29/10 (obs-3 b) : dévoilement / repli animé des cartes du Circuit. */
  const circuitCardsReveal = useCircuitCardsReveal(isCircuitCollapsed, CIRCUIT_GAP, CIRCUIT_CARDS_BOTTOM_OVERLAP);
  /**
   * PRE-9 B.1b (D-451, COMP §1 et §4) : disposition générale (plusieurs Circuits, Cycles) — rendue
   * selon sa structure à la place des zones de l'ancien modèle ; `null` : rendu historique inchangé.
   */
  /**
   * PRE-9 B.4 (précision de Hermann du 30/10/2026) : conteneurs vidés par une dépose, en effacement.
   * Tant qu'il en reste, la disposition est rendue selon sa structure même si elle est redevenue
   * représentable dans l'ancien modèle (dernier membre d'un second Circuit sorti) : l'effacement
   * se joue à sa place, puis le rendu historique reprend.
   */
  const [vanishing, setVanishing] = useState<readonly VanishingContainer[]>([]);
  const isVanishing = vanishing.length > 0;
  const richLayout = useMemo(() => resolveRichLayout(draft, isVanishing), [draft, isVanishing]);
  /**
   * Contre-recette du 30/10 : Cycles posés à l'instant (absents avant « Confirmer le cycle »).
   * L'apparition (`entering`) ne joue qu'au montage du Cycle ; la demande est levée à l'entrée
   * suivante en mode enveloppe.
   */
  const appearingCycleIds = useMemo<ReadonlySet<string>>(() => {
    if (cycleReveal === null) return NO_APPEARING_CYCLES;
    return new Set(layoutCycleIds(richLayout).filter((id) => !cycleReveal.known.has(id)));
  }, [cycleReveal, richLayout]);
  /**
   * Contre-recette du 30/10 (constat b) : Circuits posés à l'instant (« Confirmer le circuit ») —
   * ceux dont aucun Exercice n'était dans un Circuit auparavant. Même cycle de vie que les Cycles.
   */
  const appearingCircuitIds = useMemo<ReadonlySet<string>>(() => {
    if (circuitReveal === null || draft.structure === undefined) return NO_APPEARING_CONTAINERS;
    return new Set(
      structureCircuits(draft.structure)
        .filter((circuit) => circuit.exercises.length > 0 && circuit.exercises.every((id) => !circuitReveal.knownMembers.has(id)))
        .map((circuit) => circuit.id),
    );
  }, [circuitReveal, draft.structure]);
  /** Contre-recette du 30/10 (constat b) : le Circuit de l'ancien modèle vient d'être posé. */
  const isLegacyCircuitAppearing =
    draft.structure !== undefined && structureCircuits(draft.structure).some((circuit) => appearingCircuitIds.has(circuit.id));
  /** ARB-13 : lettres des Circuits et des Cycles (aucune pour un conteneur seul de sa nature). */
  const layoutLetters = useMemo(
    () => (richLayout === null || draft.structure === undefined ? new Map<string, string>() : containerLetters(draft.structure)),
    [draft.structure, richLayout],
  );
  const layoutCircuitById = useMemo(
    () => new Map((richLayout === null ? [] : structureCircuits(richLayout)).map((circuit) => [circuit.id, circuit])),
    [richLayout],
  );
  /**
   * PRE-9 B.1b (ARB-12) : Circuits repliés d'une disposition générale — identifiant → contenu (ses
   * Exercices) au moment du repli. État de l'écran seul, non persisté ; tous dépliés à l'ouverture.
   * Comme pour le Circuit unique (B.1a), un Circuit dont le contenu change se déplie (ajustement
   * pendant le rendu).
   */
  const [layoutCollapsed, setLayoutCollapsed] = useState<ReadonlyMap<string, string>>(() => new Map());
  const layoutContentKeyOf = (circuit: StructureCircuit<SessionDraftExercise>) => circuit.exercises.map((exercise) => exercise.id).join(" ");
  const staleCollapsed = [...layoutCollapsed].filter(([id, key]) => {
    const circuit = layoutCircuitById.get(id);
    return circuit === undefined || layoutContentKeyOf(circuit) !== key;
  });
  if (staleCollapsed.length > 0) {
    setLayoutCollapsed((current) => {
      const next = new Map(current);
      for (const [id] of staleCollapsed) next.delete(id);
      return next;
    });
  }
  /** Recette n° 2 du 31/10 (arrêt sur un Circuit replié) : repli lu par le geste en cours. */
  const layoutCollapsedRef = useRef(layoutCollapsed);
  useLayoutEffect(() => {
    layoutCollapsedRef.current = layoutCollapsed;
  });
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
   * PRE-9 B.1a (RM-027) : le stepper est révélé ; un pas le laisse ouvert (VoiceOver peut aussi
   * régler N sans le révéler) et referme seulement le choix de nature.
   */
  // Forme fonctionnelle : chaque pas (maintien compris) part du brouillon COURANT, jamais de
  // celui du rendu.
  const handleCircuitCountChange = useCallback(
    (count: number) => {
      setOpenOverlay((current) => (current === "circuitNature" ? null : current));
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
    [draft, flushDeletion, openTourChoice, reportRemovedStopPoints, updateDraft],
  );

  /**
   * PRE-6 (story 3.2, CE-CIR-01, CE-CIR-02, AD-37) : nature choisie depuis la pastille. Même
   * nature : rien. Sans perte (`prepareNatureChange(...).losses` vide, dont Séries → Tours) :
   * `applyNatureChange` immédiat, sans message. Avec perte (Tours → Séries, un exercice au-delà
   * de N) : dialogue de confirmation, rien n'est appliqué avant « Confirmer ».
   */
  const openNatureConfirmation = useCallback((nature: CircuitNature, circuitId: string | null = null) => {
    natureChangeConfirmedRef.current = false;
    setPendingNatureChange({ nature, circuitId });
  }, []);
  /**
   * PRE-9 B.1b : demandes de focus sur l'adjectif de chaque Circuit d'une disposition générale, par
   * identifiant (chaque menu ne réagit qu'à un changement de SA demande).
   */
  const [layoutNatureFocus, setLayoutNatureFocus] = useState<Readonly<Record<string, number>>>({});
  const requestLayoutNatureFocus = useCallback((circuitId: string) => {
    setLayoutNatureFocus((current) => ({ ...current, [circuitId]: (current[circuitId] ?? 0) + 1 }));
  }, []);
  /** Focus rendu à l'adjectif du Circuit concerné : celui de l'ancien modèle (`null`) ou de la disposition. */
  const requestNatureFocusOf = useCallback(
    (circuitId: string | null) => (circuitId === null ? requestNatureFocus() : requestLayoutNatureFocus(circuitId)),
    [requestLayoutNatureFocus, requestNatureFocus],
  );
  const handleSelectNature = useCallback(
    (nature: CircuitNature) => {
      closeCircuitControls();
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
    [closeCircuitControls, draft, openNatureConfirmation, requestNatureFocus, updateDraft],
  );

  /** Fermeture du choix par l'utilisateur (Android / web) : rien n'est appliqué, focus à l'adjectif. */
  const dismissNatureMenu = useCallback(() => {
    closeCircuitControls();
    requestNatureFocus();
  }, [closeCircuitControls, requestNatureFocus]);
  /**
   * PRE-9 B.1b (COMP §2, D-451) : nature choisie pour un Circuit d'une disposition générale — mêmes
   * règles que `handleSelectNature`, appliquées au Circuit désigné (`prepareLayoutNatureChange` /
   * `applyLayoutNatureChange`) : perte annoncée par le même dialogue avant toute mutation ; sans
   * perte, appliquée aussitôt.
   */
  const handleLayoutSelectNature = useCallback(
    (circuitId: string, nature: CircuitNature) => {
      closeCircuitControls();
      const circuit = draft.structure === undefined ? undefined : structureCircuits(draft.structure).find((item) => item.id === circuitId);
      if (circuit === undefined) return;
      if (nature === circuit.nature) {
        if (Platform.OS !== "ios") requestLayoutNatureFocus(circuitId);
        return;
      }
      if (prepareLayoutNatureChange(draft, circuitId, nature).losses.length > 0) {
        openNatureConfirmation(nature, circuitId);
        return;
      }
      requestLayoutNatureFocus(circuitId);
      updateDraft((current) => {
        if (prepareLayoutNatureChange(current, circuitId, nature).losses.length > 0) {
          queueMicrotask(() => openNatureConfirmation(nature, circuitId));
          return current;
        }
        return applyLayoutNatureChange(current, circuitId, nature);
      });
    },
    [closeCircuitControls, draft, openNatureConfirmation, requestLayoutNatureFocus, updateDraft],
  );
  /** PRE-9 B.1b : fermeture du choix d'un Circuit de la disposition (Android / web), sans mutation. */
  const dismissLayoutNatureMenu = useCallback(
    (circuitId: string) => {
      closeCircuitControls();
      requestLayoutNatureFocus(circuitId);
    },
    [closeCircuitControls, requestLayoutNatureFocus],
  );
  // PRE-9 B.1a (RC-4) : un toucher ailleurs referme le contrôle ouvert de l'en-tête du Circuit.
  // B.1b : de même pour les en-têtes d'une disposition générale.
  const openLayoutNatureCircuit = layoutNatureCircuitOf(openOverlay);
  const handleCircuitOutsidePress =
    openOverlay === "circuitNature"
      ? dismissNatureMenu
      : openLayoutNatureCircuit !== null
        ? () => dismissLayoutNatureMenu(openLayoutNatureCircuit)
        : closeCircuitControls;

  /** « Annuler » (ou retour système) du dialogue de perte : rien n'est appliqué. */
  const cancelNatureChange = useCallback(() => {
    const circuitId = pendingNatureChange?.circuitId ?? null;
    setPendingNatureChange(null);
    requestNatureFocusOf(circuitId);
  }, [pendingNatureChange, requestNatureFocusOf]);

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
    const { nature, circuitId } = pendingNatureChange;
    setPendingNatureChange(null);
    updateDraft((current) =>
      circuitId === null ? applyNatureChange(current, nature) : applyLayoutNatureChange(current, circuitId, nature),
    );
    requestNatureFocusOf(circuitId);
  }, [pendingNatureChange, requestNatureFocusOf, updateDraft]);

  /**
   * PRE-9 B.1b (D-451, AD-38) : compte d'un Circuit ou d'un Cycle d'une disposition générale, 1..99,
   * appliqué au seul conteneur désigné (`setLayoutCircuitCount` : en séries alternées, les Exercices
   * du Circuit suivent N, réserve AD-38 ; `setLayoutCycleCount`). Forme fonctionnelle : chaque pas
   * (maintien compris) part du brouillon COURANT. Un pas referme le choix de nature éventuellement
   * ouvert. [B.1b : « Aucun Point d'arrêt dans une disposition générale avant B.6 : aucun choix de
   * Tour. » — remplacé le 31/10/2026 par B.6 :] PRE-9 B.6 (D-442, ARB-02b) : au passage à 1, les Points
   * devenus interdits sont retirés (annonce discrète) ; au passage de 1 à 2 ou plus avec un Point de
   * début et un Point de fin, le choix « Début de tour / Fin de tour » (Cycle : « de répétition ») est
   * demandé AVANT tout changement (Annuler : compte inchangé).
   */
  const handleLayoutCount = useCallback(
    (kind: "CIRCUIT" | "CYCLE", id: string, count: number) => {
      setOpenOverlay((current) => (layoutNatureCircuitOf(current) !== null ? null : current));
      if (tourChoicePendingRef.current) return;
      const outcomeOf = (current: SessionDraft) => (kind === "CIRCUIT" ? layoutCircuitCountOutcome(current, id, count) : layoutCycleCountOutcome(current, id, count));
      const probe = outcomeOf(draftRef.current);
      if (probe.status === "CHOICE_REQUIRED") {
        openTourChoice({
          kind: "LAYOUT",
          scope: probe.conflict.scope.kind,
          apply: (choice) => {
            const replay = outcomeOf(draftRef.current);
            const resolution = replay.status === "CHOICE_REQUIRED" ? replay.resolutions[choice] : replay;
            updateDraft(() => resolution.draft);
            reportRemovedStopPoints(resolution.removedStopPointIds);
          },
        });
        return;
      }
      updateDraft((current) => {
        const outcome = outcomeOf(current);
        return outcome.status === "APPLIED" ? outcome.draft : current;
      });
      reportRemovedStopPoints(probe.removedStopPointIds);
    },
    [openTourChoice, reportRemovedStopPoints, updateDraft],
  );
  const handleLayoutCircuitCount = useCallback((circuitId: string, count: number) => handleLayoutCount("CIRCUIT", circuitId, count), [handleLayoutCount]);
  const handleLayoutCycleCount = useCallback((cycleId: string, count: number) => handleLayoutCount("CYCLE", cycleId, count), [handleLayoutCount]);
  /** PRE-9 B.1b (ARB-12) : repli d'un Circuit de la disposition — état de l'écran, brouillon inchangé. */
  const toggleLayoutCircuitCollapsed = useCallback(
    (circuit: StructureCircuit<SessionDraftExercise>) => {
      closeCircuitControls();
      setLayoutCollapsed((current) => {
        const next = new Map(current);
        if (next.has(circuit.id)) next.delete(circuit.id);
        else next.set(circuit.id, circuit.exercises.map((exercise) => exercise.id).join(" "));
        return next;
      });
    },
    [closeCircuitControls],
  );

  // ---------------------------------------------------------------------------
  // PRE-9 B.4 (COMP §6 G1–G8, ARB-06, ARB-09, ARB-24) — glisser-déposer et pas à pas dans une
  // disposition générale. L'ancien modèle garde son glisser historique (zones, Points d'arrêt).
  // ---------------------------------------------------------------------------
  /** Boîtes mesurées des éléments et en-têtes rendus (repère du contenu défilant). */
  const layoutBoxesRef = useRef(new Map<string, LayoutBox>());
  const richLayoutRef = useRef(richLayout);
  useLayoutEffect(() => {
    richLayoutRef.current = richLayout;
  });
  /**
   * Recette iPhone n° 2 du 31/10/2026 (Hermann : « le comportement tel qu'il a été défini initialement
   * […] : déplacement des bords des circuits / cycle et déplacement des cartes pour faire la place à la
   * carte déplacée ») : éléments affichés de la disposition, dans l'ordre d'affichage — chacun reçoit
   * une translation de l'aperçu (`layoutDragShifts.ts`), registre partagé de l'ancien modèle.
   */
  const layoutPieces = useMemo(
    () => (richLayout === null ? NO_LAYOUT_PIECES : layoutShiftPieces(richLayout, (exercise) => exercise.id)),
    [richLayout],
  );
  const layoutPiecesRef = useRef(layoutPieces);
  useLayoutEffect(() => {
    layoutPiecesRef.current = layoutPieces;
  });
  /** Bords des conteneurs : posés à leur place au dépôt (leur fond s'étire sur la hauteur mesurée), comme `CIRCUIT_EDGE_KEYS`. */
  const layoutEdgeKeys = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        layoutPieces.flatMap((piece) =>
          piece.kind === "CIRCUIT" || piece.kind === "CYCLE" ? [nativeShiftKey(piece.topKey), nativeShiftKey(piece.bottomKey)] : [],
        ),
      ),
    [layoutPieces],
  );
  const layoutEdgeKeysRef = useRef(layoutEdgeKeys);
  useLayoutEffect(() => {
    layoutEdgeKeysRef.current = layoutEdgeKeys;
  });
  /**
   * Élément saisi (rendu) : en glisser, tenu pendant un dialogue (perte, choix de Tour), ou en retour
   * jusqu'à sa place ; la référence porte l'ordonnée de saisie et la destination courante.
   * PRE-9 B.6 (D-441, ARB-06) : `stopPointId` — Point d'arrêt saisi (la source est alors un repère
   * d'Exercice fictif : un Point peut aller partout où un Exercice irait, chaque emplacement d'un
   * conteneur étant un emplacement de Point). [B.4 : destination « éclairée » (cadre, repère
   * d'insertion) — remplacé par la recette iPhone n° 2 du 31/10/2026 : aperçu par décalages.]
   */
  const [layoutLift, setLayoutLift] = useState<LayoutLift | null>(null);
  /**
   * Contre-recette n° 4 du 01/11/2026 (constat a, Hermann : « lorsque le circuit se déplace vers le bas
   * lorsqu'il se replie, il n'est plus aligné avec le doigt pendant le déplacement. lorsqu'on replie un
   * circuit son positionnement haut ne doit pas bouger, uniquement la partie basse doit remonter. ») —
   * cause retenue : le Circuit saisi se replie (COMP §6) ; le contenu défilant raccourcit d'autant ;
   * liste défilée vers son bas, le décalage de défilement dépasse le nouveau maximum et iOS le ramène
   * dans les bornes : tout le contenu, Circuit compris, descend sous le doigt immobile. Pendant le
   * geste et jusqu'à la fin du retour, le contenu garde au moins sa hauteur du début du geste
   * (`minHeight`) : le haut du Circuit reste sous le doigt, seul son bas remonte.
   */
  const [layoutContentFloor, setLayoutContentFloor] = useState<number | null>(null);
  const bodyContentHeightRef = useRef<number | null>(null);
  if (layoutLift === null && layoutContentFloor !== null) setLayoutContentFloor(null);
  const layoutLiftRef = useRef(layoutLift);
  useLayoutEffect(() => {
    layoutLiftRef.current = layoutLift;
  });
  const layoutDragRef = useRef<LayoutDragGesture | null>(null);
  /** Recette n° 2 : pose de départ de la carte ou du Point relâché (story 5.2b), consommée par le registre. */
  const [layoutRelease, setLayoutRelease] = useState<ShiftRelease | null>(null);
  /** Aperçu du geste en cours, recalculé (destination ou mesure changée) ; l'état ne change que si les translations changent. */
  const refreshLayoutShifts = useCallback(() => {
    const current = layoutDragRef.current;
    if (current === null) return;
    // Contre-recette n° 5 du 01/11/2026 (Hermann : « Oui, ouvrir la place pendant le déploiement. le
    // circuit s'ouvre proprement mais la carte elle fait encore plusieurs soubresauts qu'il faut
    // éliminer. ») : déploiement lancé — l'aperçu reste celui posé à son départ (`startLayoutExpansion`,
    // place ouverte et compensation animées avec lui, fil natif) ; aucune mesure ne le modifie, aucune
    // pose de compensation depuis le fil JS, aucun rendu de l'écran par mesure.
    if (current.expansion !== null) return;
    // Contre-recette du 01/11/2026 (m12-levee : « il a tendance à fuir en bas ou en haut ») : pendant
    // l'arrêt sur un Circuit replié, l'aperçu reste celui d'avant (place ouverte à côté de lui) — il ne
    // bouge pas sous le doigt ; la place passe à sa fin au départ de son déploiement
    // (`startLayoutExpansion`, animé avec lui). [Remplace, pendant l'arrêt, « la place n'est pas
    // ouverte » de la contre-recette n° 4 ci-dessous.]
    if (current.hoverCircuitId !== null && current.expandingCircuitId === null && current.shifts !== null) return;
    const slot = current.target;
    // Contre-recette n° 4 du 01/11/2026 (cr5-replie, Hermann : « le cadre du circuit se déplie […] mais
    // sans qu'elles n'apparaissent » ; « le bord bas remonte et redescend ») : pendant l'arrêt sur un
    // Circuit replié (avant son déploiement) et pendant son déploiement, la place n'est pas ouverte —
    // le cadre grandit avec ses cartes (mise en page, `useCircuitCardsReveal`), sans translation de ses
    // bords qui s'ajouterait à cette croissance (fond étiré d'après une hauteur relevée au fil JS, en
    // retard) ; la place s'ouvre aussitôt après, sous le doigt (`finishLayoutExpansionRef`). Un lâcher
    // entre-temps dépose toujours à la fin du Circuit (`current.target`). [Pendant le déploiement :
    // remplacé par la contre-recette n° 5 du 01/11/2026 — la place s'ouvre avec le déploiement
    // (`startLayoutExpansion`) ; reste vrai pendant l'arrêt et jusqu'au départ du déploiement.]
    const opensPlace = current.hoverCircuitId === null && current.expandingCircuitId === null;
    const computed =
      slot === null
        ? null
        : layoutDragShifts(
            layoutPiecesRef.current,
            layoutBoxesRef.current,
            current.lifted,
            // Place de l'élément saisi refermée ; aucune place ouverte tant que le Circuit n'est pas déployé.
            opensPlace ? { insertY: slot.insertY, insertTop: slot.insertTop, gap: layoutContainerGap(slot.container) } : null,
          );
    // Recette iPhone n° 2 du 31/10/2026 (arrêt sur un Circuit replié) : un Circuit déployé AU-DESSUS de
    // l'élément saisi le déplace dans la mise en page ; la translation du registre qui le porte compense
    // ce déplacement (`layoutSourceDrift`), posée sans animation : il reste sous le doigt.
    const drift = layoutSourceDrift(current, layoutBoxesRef.current);
    const next =
      drift === 0 ? computed : { shifts: new Map(computed?.shifts ?? []).set(current.liftedKey, -drift), end: computed?.end ?? 0 };
    if (sameLayoutDragShifts(next, current.shifts)) return;
    if ((current.shifts?.shifts.get(current.liftedKey) ?? 0) !== -drift) shiftRegistryRef.current?.pose(nativeShiftKey(current.liftedKey), -drift);
    current.shifts = next;
    setLayoutLift((lift) => (lift === null || lift.phase !== "DRAGGING" ? lift : { ...lift, shifts: next }));
  }, []);
  /**
   * Recette iPhone n° 2 du 31/10/2026 (Hermann : « L'arrêt d'une carte sur un circuit replié doit
   * l'ouvrir ») : une destination qui reste un Circuit replié pendant `LAYOUT_COLLAPSED_HOVER_DELAY_MS`
   * déploie ce Circuit (même déploiement animé que le chevron, `useCircuitCardsReveal`) ; ses cartes
   * deviennent des destinations. Il reste déployé après le geste, comme déplié au toucher.
   */
  const layoutHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearLayoutHover = useCallback(() => {
    if (layoutHoverTimerRef.current !== null) clearTimeout(layoutHoverTimerRef.current);
    layoutHoverTimerRef.current = null;
  }, []);
  useEffect(() => clearLayoutHover, [clearLayoutHover]);
  /** « Réduire les animations » lu par le geste en cours (fin du déploiement d'un Circuit, contre-recette n° 3). */
  const reduceMotionRef = useRef(reduceMotion);
  useLayoutEffect(() => {
    reduceMotionRef.current = reduceMotion;
  });
  /** Contre-recette n° 3 : fin du déploiement d'un Circuit ouvert par l'arrêt (posée plus bas). */
  const finishLayoutExpansionRef = useRef<(current: LayoutDragGesture) => void>(() => {});
  /** Destination sous le doigt (`handleY` + translation, repère du contenu), dans les boîtes courantes. */
  const retargetLayoutDrag = useCallback(
    (current: LayoutDragGesture, translationY: number) => {
      const layout = richLayoutRef.current;
      if (layout === null) return;
      current.lastTranslationY = translationY;
      // Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : un rang qui porte des Points d'arrêt offre
      // à l'élément saisi deux emplacements, avant eux et après eux (un Point saisi n'en a qu'un).
      const stopPoints = current.stopPointId === undefined ? layoutDropStopPointsOf(layout) : NO_LAYOUT_DROP_STOP_POINTS;
      if (current.expandingCircuitId !== null) {
        // Contre-recette n° 3 du 31/10/2026 (cr4-replie, « ses cartes descendent mais avec un mouvement
        // saccadé ») : pendant le déploiement, la destination reste la fin du Circuit qui s'ouvre, relue
        // dans les boîtes courantes — la place ouverte suit son bas, ses cartes ne reçoivent aucune
        // translation ; l'aperçu ne change pas à chaque mesure. La destination sous le doigt est
        // recalculée à la fin du déploiement (`finishLayoutExpansionRef`).
        const candidates = layoutDropCandidates(layout, current.source, layoutBoxesRef.current, (exercise) => exercise.id, layoutContainerGap, stopPoints);
        const end = circuitEndDrop(candidates, current.expandingCircuitId);
        if (end !== null) current.target = end;
        return;
      }
      const pointerY = current.handleY + translationY;
      // Contre-recette du 01/11/2026 (m12-levee : le Circuit replié « a tendance à fuir ») : une carte
      // d'Exercice vise un Circuit replié tel qu'il est affiché (`resolveDropOverCollapsedCircuits`).
      const slot =
        current.stopPointId === undefined && current.source.kind === "EXERCISE" && layoutCollapsedRef.current.size > 0
          ? resolveDropOverCollapsedCircuits(
              layoutDropCandidates(layout, current.source, layoutBoxesRef.current, (exercise) => exercise.id, layoutContainerGap, stopPoints),
              pointerY,
              layoutCollapsedRef.current.keys(),
              layoutBoxesRef.current,
              current.shifts?.shifts ?? null,
            )
          : resolveLayoutDrop(layout, current.source, pointerY, layoutBoxesRef.current, (exercise) => exercise.id, layoutContainerGap, stopPoints);
      if (!(sameLayoutDrop(slot, current.target) && slot?.lineY === current.target?.lineY)) current.target = slot;
      // Lecture la plus prudente du constat (« l'arrêt d'une carte ») : une carte d'Exercice seulement,
      // pas un Point d'arrêt saisi (À CLARIFIER, spec-recette-2-corrections-composition.md).
      const isCollapsed = (id: string) => current.stopPointId === undefined && layoutCollapsedRef.current.has(id);
      const hovered = hoveredCollapsedCircuit(current.target, isCollapsed);
      if (hovered === current.hoverCircuitId) return;
      clearLayoutHover();
      current.hoverCircuitId = hovered;
      if (hovered === null) return;
      layoutHoverTimerRef.current = setTimeout(() => {
        layoutHoverTimerRef.current = null;
        if (layoutDragRef.current !== current || hoveredCollapsedCircuit(current.target, isCollapsed) !== hovered) return;
        current.hoverCircuitId = null;
        current.expandedOnHover = true;
        // Contre-recette n° 3 : un seul mouvement continu — le déploiement (fil UI, `useCircuitCardsReveal`),
        // la place ouverte à la fin du Circuit et ce qui le suit portés par la mise en page ; puis,
        // déploiement terminé, la destination sous le doigt et ses décalages animés (registre).
        current.expandingCircuitId = hovered;
        setLayoutCollapsed((collapsed) => {
          if (!collapsed.has(hovered)) return collapsed;
          const next = new Map(collapsed);
          next.delete(hovered);
          return next;
        });
        layoutHoverTimerRef.current = setTimeout(
          () => {
            layoutHoverTimerRef.current = null;
            if (layoutDragRef.current === current) finishLayoutExpansionRef.current(current);
          },
          reduceMotionRef.current ? 0 : CIRCUIT_REVEAL_DURATION_MS,
        );
      }, LAYOUT_COLLAPSED_HOVER_DELAY_MS);
    },
    [clearLayoutHover],
  );
  useLayoutEffect(() => {
    finishLayoutExpansionRef.current = (current) => {
      current.expandingCircuitId = null;
      current.expansion = null;
      if (current.lastTranslationY !== null) retargetLayoutDrag(current, current.lastTranslationY);
      refreshLayoutShifts();
    };
  });
  /**
   * Contre-recette n° 5 du 01/11/2026 — départ du déploiement d'un Circuit ouvert par l'arrêt
   * (`useCircuitCardsReveal`, `onRevealStart`, dans la tâche même de son départ ; `growth` : croissance
   * prévue du Circuit, d'après la hauteur de ses cartes).
   *
   * 1. Classe B, réponse de Hermann à la question de la contre-recette n° 4 : « Oui, ouvrir la place
   *    pendant le déploiement. » — la place s'ouvre à la fin du Circuit pendant son déploiement, dans le
   *    même mouvement : bord bas du Circuit (et de son Cycle) et éléments suivants translatés de la place
   *    de l'élément saisi, avec la courbe et la durée du déploiement (`CIRCUIT_REVEAL_SHIFT_TIMING`). Le
   *    déploiement terminé (`finishLayoutExpansionRef`), la destination sous le doigt est calculée une
   *    fois et ses décalages animés une fois (inchangé).
   * 2. Classe A (« la carte elle fait encore plusieurs soubresauts ») — cause : un Circuit déployé
   *    AU-DESSUS de l'élément saisi le fait descendre dans la mise en page, image par image (fil UI) ;
   *    la compensation (`layoutSourceDrift`) était reposée depuis le fil JS à chaque mesure, après coup,
   *    et chaque mesure rendait l'écran entier (`setLayoutLift`) : la carte descendait puis remontait
   *    à chaque pas, plus encore quand le fil JS, chargé, regroupait les mesures. Désormais la
   *    compensation de tout le déploiement est lancée une seule fois, sur le pilote natif, avec la même
   *    courbe et la même durée que la croissance du Circuit, partie dans la même tâche ; pendant le
   *    déploiement, aucune mesure ne la repose (`refreshLayoutShifts`) ; à sa fin, l'écart résiduel
   *    éventuel (mesure réelle) est posé une fois.
   */
  const startLayoutExpansion = useCallback(
    (circuitId: string, growth: number) => {
      const current = layoutDragRef.current;
      if (current === null || current.expandingCircuitId !== circuitId || current.expansion !== null) return;
      const boxes = layoutBoxesRef.current;
      const slot = current.target;
      const opening =
        slot === null
          ? null
          : layoutDragShifts(layoutPiecesRef.current, boxes, current.lifted, {
              insertY: slot.insertY,
              insertTop: slot.insertTop,
              gap: layoutContainerGap(slot.container),
            });
      const circuitBox = boxes.get(layoutItemKey({ kind: "CIRCUIT", id: circuitId }));
      const liftedBox = boxes.get(current.lifted.boxKey);
      // L'élément saisi est sous le Circuit (même dans son Cycle) : la croissance le fait descendre.
      const below =
        circuitBox !== undefined && liftedBox !== undefined && liftedBox.top >= circuitBox.top + circuitBox.height - LAYOUT_MEASURE_TOLERANCE;
      const compensation = -(layoutSourceDrift(current, boxes) + (below ? growth : 0));
      const next: LayoutDragShifts = { shifts: new Map(opening?.shifts ?? []).set(current.liftedKey, compensation), end: opening?.end ?? 0 };
      current.expansion = next;
      current.shifts = next;
      const timed = new Map<string, number>([[nativeShiftKey(RAIL_KEYS.end), next.end]]);
      for (const [key, value] of next.shifts) timed.set(nativeShiftKey(key), value);
      shiftRegistryRef.current?.retarget(timed, reduceMotionRef.current ? null : CIRCUIT_REVEAL_SHIFT_TIMING);
      setLayoutLift((lift) => (lift === null || lift.phase !== "DRAGGING" ? lift : { ...lift, shifts: next }));
      // Fin du déploiement comptée depuis son départ réel (après la mesure du contenu).
      clearLayoutHover();
      layoutHoverTimerRef.current = setTimeout(
        () => {
          layoutHoverTimerRef.current = null;
          if (layoutDragRef.current === current) finishLayoutExpansionRef.current(current);
        },
        reduceMotionRef.current ? 0 : CIRCUIT_REVEAL_DURATION_MS,
      );
    },
    [clearLayoutHover],
  );
  const reportLayoutBox = useCallback(
    (key: string, box: LayoutBox | null) => {
      if (box === null) layoutBoxesRef.current.delete(key);
      else layoutBoxesRef.current.set(key, box);
      const current = layoutDragRef.current;
      // Recette n° 2 : une mesure changée pendant le geste (Circuit saisi qui se replie) recalcule l'aperçu.
      // Arrêt sur un Circuit replié (31/10) : la destination sous le doigt immobile est aussi recalculée
      // (ses cartes apparaissent) — [pendant son déploiement : remplacé par la contre-recette n° 3 :]
      // pendant le déploiement, la fin du Circuit relue ; après, la destination sous le doigt.
      if (box !== null && current !== null) {
        if (current.expandedOnHover && current.lastTranslationY !== null) retargetLayoutDrag(current, current.lastTranslationY);
        refreshLayoutShifts();
      }
    },
    [refreshLayoutShifts, retargetLayoutDrag],
  );
  /**
   * Recette n° 2 (PRE-6 stories 5.2b, 7.4, 7.6) : suite visuelle du lâcher — `hold` : dialogue ouvert,
   * l'élément reste où le doigt l'a laissé et l'aperçu est conservé ; `release` : rien n'est appliqué,
   * retour animé à sa place ; `applied` : la nouvelle disposition est rendue avec des translations
   * nulles, sauf l'élément déposé, posé sous le lâcher puis amené à sa place. Un Circuit ou un Cycle
   * lâché est aussitôt porté par la translation du registre (`pose`), qui relaie celle du doigt.
   */
  const layoutSettleFor = useCallback((current: LayoutDragGesture, fingerTranslationY: number): LayoutSettle => {
    // Recette n° 2 du 31/10 (arrêt sur un Circuit replié) : position affichée, compensation comprise.
    // Contre-recette n° 5 : pendant un déploiement, la compensation est celle qu'anime le registre
    // (estimée sur sa courbe), non la dernière mesure (en retard sur le fil UI).
    const animatedCompensation =
      current.expansion === null ? null : (shiftRegistryRef.current?.estimate(nativeShiftKey(current.liftedKey)) ?? null);
    const translationY =
      animatedCompensation === null
        ? fingerTranslationY - layoutSourceDrift(current, layoutBoxesRef.current)
        : fingerTranslationY + animatedCompensation;
    const piece = liftedPiece(layoutPiecesRef.current, current.lifted.boxKey);
    const key = piece === undefined ? null : liftedShiftKey(piece);
    const block = piece !== undefined && (piece.kind === "CIRCUIT" || piece.kind === "CYCLE");
    const slot = current.target;
    const offset =
      slot === null
        ? null
        : layoutSettleOffset(
            layoutBoxesRef.current,
            current.lifted,
            { insertY: slot.insertY, insertTop: slot.insertTop, gap: layoutContainerGap(slot.container) },
            translationY,
          );
    // [Recette n° 2 : seul un Circuit ou un Cycle lâché était aussitôt porté par le registre — étendu
    // par la contre-recette n° 4 du 01/11/2026 (cr5-reposer, « elle disparait et réapparait ») :] une
    // carte ou un Point d'arrêt aussi, dans la même tâche que la remise à 0 de sa translation de doigt
    // (`releaseDragY`, puce du Point) : aucune image à sa place dans la mise en page.
    if (key !== null) shiftRegistryRef.current?.pose(nativeShiftKey(key), translationY);
    let held = false;
    const toPhase = (phase: "HELD" | "SETTLING") =>
      setLayoutLift((lift) =>
        lift === null
          ? null
          : { ...lift, phase, shifts: phase === "HELD" ? lift.shifts : null, heldTranslationY: phase === "HELD" ? translationY : null },
      );
    return {
      hold: () => {
        held = true;
        if (!block && key !== null) setLayoutRelease({ key: nativeShiftKey(key), from: translationY });
        toPhase("HELD");
      },
      release: () => {
        if (!held && !block && key !== null) setLayoutRelease({ key: nativeShiftKey(key), from: translationY });
        toPhase("SETTLING");
      },
      applied: () => {
        if (key !== null && offset !== null) shiftRegistryRef.current?.prepareLayoutCommit(new Map([[nativeShiftKey(key), offset]]), layoutEdgeKeysRef.current);
        else shiftRegistryRef.current?.prepareLayoutCommit();
        toPhase("SETTLING");
      },
    };
  }, []);
  /** Déplacement avec perte de séries en attente (COMP §6 : Annuler conserve tout ; Confirmer applique ensemble). */
  const [pendingLayoutMove, setPendingLayoutMove] = useState<{
    readonly run: () => LayoutItemMoveOutcome;
    readonly targetCount: number;
    readonly settle?: LayoutSettle;
  } | null>(null);
  const handleVanished = useCallback((key: string) => setVanishing((current) => current.filter((item) => item.key !== key)), []);
  const announceLayoutRefusal = useCallback((reason: LayoutItemMoveRefusal) => {
    const text = strings.screens.composition.layoutMove.refused[reason];
    if (text !== "") AccessibilityInfo.announceForAccessibility(text);
  }, []);
  /**
   * Écrit un déplacement accepté ; les conteneurs vidés restent rendus le temps de leur effacement.
   * PRE-9 B.5 : `keepMembers` — suppression du dernier membre : le conteneur s'efface avec ce qu'il
   * contenait (la carte supprimée), au lieu d'un conteneur vide (dépose : le membre est ailleurs).
   */
  const commitLayoutMove = useCallback(
    (next: SessionDraft, removed: readonly LayoutItemRef[], keepMembers = false) => {
      const before = richLayoutRef.current;
      if (before !== null && removed.length > 0) {
        const items = vanishingContainers(before, removed, keepMembers);
        setVanishing((current) => [...current.filter((item) => !items.some((added) => added.key === item.key)), ...items]);
      }
      updateDraft(() => next);
    },
    [updateDraft],
  );
  /**
   * Issue d'un déplacement (dépose ou pas à pas) : appliqué, confirmation de perte, refus annoncé sans
   * modification. PRE-9 B.6 (D-442) : Points retirés sans message annoncés discrètement ; un conflit de
   * début et de fin de Tour (ou de répétition) ouvre le choix, puis l'opération est rejouée sur le
   * brouillon courant avec la résolution choisie (« Annuler » : rien ne change).
   */
  // Recette n° 2 du 31/10 : `settle` — suite visuelle d'une dépose (voir `layoutSettleFor`) ; absente
  // pour un pas à pas.
  const runLayoutMoveRef = useRef<(run: () => LayoutItemMoveOutcome, settle?: LayoutSettle) => void>(() => {});
  const runLayoutMove = useCallback(
    (run: () => LayoutItemMoveOutcome, settle?: LayoutSettle) => {
      const outcome = run();
      switch (outcome.status) {
        case "APPLIED":
          settle?.applied();
          commitLayoutMove(outcome.draft, outcome.removedContainers);
          reportRemovedStopPoints(outcome.removedStopPointIds);
          return;
        case "CONFIRMATION_REQUIRED":
          // Confirmation demandée par le seul contrôle avant dépose : dialogue propre à C.4 (ARB-24) ;
          // d'ici là, aucun contrôle ne la demande (contrôle neutre) — refus sans modification.
          if (outcome.losses.length > 0) {
            settle?.hold();
            setPendingLayoutMove({ run, targetCount: outcome.targetCount, ...(settle !== undefined ? { settle } : {}) });
          } else {
            settle?.release();
            announceLayoutRefusal("CONTROL");
          }
          return;
        case "CHOICE_REQUIRED": {
          const opened = openTourChoice({
            kind: "LAYOUT",
            scope: outcome.conflict.scope.kind,
            apply: (choice) =>
              runLayoutMoveRef.current(() => {
                const replay = run();
                return replay.status === "CHOICE_REQUIRED" ? replay.resolutions[choice] : replay;
              }, settle),
            cancel: () => settle?.release(),
          });
          if (opened) settle?.hold();
          else settle?.release();
          return;
        }
        case "REFUSED":
          settle?.release();
          announceLayoutRefusal(outcome.reason);
          return;
        case "UNCHANGED":
          settle?.release();
          return;
        default: {
          const unreachable: never = outcome;
          return unreachable;
        }
      }
    },
    [announceLayoutRefusal, commitLayoutMove, openTourChoice, reportRemovedStopPoints, setPendingLayoutMove],
  );
  useLayoutEffect(() => {
    runLayoutMoveRef.current = runLayoutMove;
  });
  /**
   * PRE-9 B.6 (D-441, ARB-06) : issue d'un déplacement de Point d'arrêt (dépose, « Monter » /
   * « Descendre ») — appliqué ; choix de début ou de fin de répétition ; refus annoncé sans mutation.
   * Recette n° 2 du 31/10 : `settle`, comme pour un élément.
   */
  const runLayoutStopPointMove = useCallback(
    (run: () => LayoutStopPointMoveOutcome, focusId?: string, settle?: LayoutSettle) => {
      const outcome = run();
      switch (outcome.status) {
        case "APPLIED":
          settle?.applied();
          updateDraft(() => outcome.draft);
          if (focusId !== undefined) requestItemFocus(layoutStopFocusKey(focusId));
          return;
        case "CHOICE_REQUIRED": {
          const opened = openTourChoice({
            kind: "LAYOUT",
            scope: outcome.conflict.scope.kind,
            apply: (choice) => {
              const replay = run();
              if (replay.status === "CHOICE_REQUIRED") {
                const next = replay.resolutions[choice];
                settle?.applied();
                updateDraft(() => next);
                const kept = (next.structure?.stopPoints ?? []).length;
                const before = (draftRef.current.structure?.stopPoints ?? []).length;
                if (kept < before) AccessibilityInfo.announceForAccessibility(removedStopPointsAnnouncement(before - kept));
              } else if (replay.status === "APPLIED") {
                settle?.applied();
                updateDraft(() => replay.draft);
              } else {
                settle?.release();
              }
            },
            cancel: () => settle?.release(),
          });
          if (opened) settle?.hold();
          else settle?.release();
          return;
        }
        case "REFUSED":
          settle?.release();
          if (outcome.reason !== "NOT_FOUND" && outcome.reason !== "AT_BOUNDARY") {
            AccessibilityInfo.announceForAccessibility(strings.screens.composition.layoutMove.stopPointRefused);
          }
          return;
        case "UNCHANGED":
          settle?.release();
          return;
        default: {
          const unreachable: never = outcome;
          return unreachable;
        }
      }
    },
    [openTourChoice, requestItemFocus, updateDraft],
  );
  const startLayoutDrag = useCallback(
    (source: LayoutItemRef, stopPointId?: string): boolean => {
      // PRE-9 B.5 : ni pendant une suppression animée (mise en page figée). Recette n° 2 : ni pendant
      // qu'un élément lâché est tenu (dialogue).
      if (layoutDragRef.current !== null || richLayoutRef.current === null || layoutDeletionRef.current !== null) return false;
      if (layoutLiftRef.current?.phase === "HELD") return false;
      const handleKey =
        stopPointId !== undefined ? layoutStopBoxKey(stopPointId) : source.kind === "EXERCISE" ? layoutItemKey(source) : layoutHeaderKey(source.kind, source.id);
      const handle = layoutBoxesRef.current.get(handleKey);
      if (handle === undefined) return false;
      // Boîte de l'élément saisi (sa place dans la disposition) et écart du conteneur qu'il quitte.
      const boxKey = stopPointId !== undefined ? layoutStopBoxKey(stopPointId) : layoutItemKey(source);
      const box = layoutBoxesRef.current.get(boxKey);
      const piece = liftedPiece(layoutPiecesRef.current, boxKey);
      if (box === undefined || piece === undefined) return false;
      // Story 5.2b : un nouveau geste pendant un retour arrête ce retour (translations à 0, synchrone).
      if (layoutLiftRef.current !== null) shiftRegistryRef.current?.reset();
      const lifted: LayoutLiftedSource = { boxKey, gap: layoutContainerGap(piece.container) };
      clearLayoutHover();
      layoutDragRef.current = {
        source,
        handleY: handle.top + handle.height / 2,
        target: null,
        lifted,
        shifts: null,
        ...(stopPointId !== undefined ? { stopPointId } : {}),
        sourceTop: box.top,
        liftedKey: liftedShiftKey(piece),
        lastTranslationY: null,
        hoverCircuitId: null,
        expandedOnHover: false,
        expandingCircuitId: null,
        expansion: null,
      };
      setLayoutLift({
        source,
        stopPointId: stopPointId ?? null,
        phase: "DRAGGING",
        shifts: null,
        heldTranslationY: null,
        sourceBoxKey: boxKey,
        sourceKey: liftedShiftKey(piece),
        height: box.height,
      });
      closeCircuitControls();
      setRevealedActionsId(null);
      autoScroll.begin();
      if (source.kind === "CIRCUIT" && stopPointId === undefined) {
        // Contre-recette n° 4 (constat a) : le repli ne raccourcit pas le contenu défilant pendant le geste.
        setLayoutContentFloor(bodyContentHeightRef.current);
        // COMP §6 : « Un appui long sur l'en-tête d'un circuit déployé commence par le replier puis
        // amorce son déplacement. »
        const circuit = structureCircuits(richLayoutRef.current).find((item) => item.id === source.id);
        if (circuit !== undefined) {
          const contentKey = circuit.exercises.map((exercise) => exercise.id).join(" ");
          setLayoutCollapsed((current) => (current.get(source.id) === contentKey ? current : new Map(current).set(source.id, contentKey)));
        }
      }
      return true;
    },
    [autoScroll, clearLayoutHover, closeCircuitControls],
  );
  const moveLayoutDrag = useCallback(
    (translationY: number) => {
      const current = layoutDragRef.current;
      if (current === null || richLayoutRef.current === null) return;
      retargetLayoutDrag(current, translationY);
      // Recette n° 2 : la place visée s'ouvre, celle de l'élément saisi se referme (registre animé).
      refreshLayoutShifts();
    },
    [refreshLayoutShifts, retargetLayoutDrag],
  );
  const endLayoutDrag = useCallback(
    (translationY: number) => {
      moveLayoutDrag(translationY);
      const current = layoutDragRef.current;
      layoutDragRef.current = null;
      clearLayoutHover();
      autoScroll.end();
      if (current === null) return;
      const settle = layoutSettleFor(current, translationY);
      // `dropTarget` : emplacement de dépose (B.4), à ne pas confondre avec la Cible d'une série
      // (garde PRE4-1.1/AC1 de `legacyModeConfinement`).
      const dropTarget = current.target;
      if (dropTarget === null) {
        settle.release();
        return;
      }
      const stopPointId = current.stopPointId;
      if (stopPointId !== undefined) {
        // PRE-9 B.6 (ARB-06) : le Point va à l'emplacement (conteneur, rang) visé, selon ses règles.
        runLayoutStopPointMove(
          () => moveLayoutStopPoint(draftRef.current, stopPointId, stopPointLocationIn(dropTarget.container, dropTarget.index), () => Crypto.randomUUID()),
          undefined,
          settle,
        );
        return;
      }
      runLayoutMove(() => moveLayoutItem(draftRef.current, current.source, dropTarget, () => Crypto.randomUUID(), LAYOUT_DROP_CONTROL), settle);
    },
    [autoScroll, clearLayoutHover, layoutSettleFor, moveLayoutDrag, runLayoutMove, runLayoutStopPointMove],
  );
  const cancelLayoutDrag = useCallback(
    (translationY = 0) => {
      const current = layoutDragRef.current;
      layoutDragRef.current = null;
      clearLayoutHover();
      autoScroll.end();
      // Story 5.2b : geste interrompu — retour en douceur depuis la position atteinte.
      if (current !== null) layoutSettleFor(current, translationY).release();
    },
    [autoScroll, clearLayoutHover, layoutSettleFor],
  );
  /** Recette n° 2 : fin du retour (ou de la mise en place) de l'élément lâché — il rejoint la chaîne du rail. */
  useEffect(() => {
    if (layoutLift === null || layoutLift.phase !== "SETTLING") return undefined;
    const settling = layoutLift;
    const registry = shiftRegistryRef.current;
    if (registry === null) {
      setLayoutLift((current) => (current === settling ? null : current));
      return undefined;
    }
    return registry.whenSettled(() => setLayoutLift((current) => (current === settling ? null : current)));
  }, [layoutLift]);
  /** `stepOccurrence` généralisé (« Monter » / « Descendre »), `null` à la frontière de la séquence. */
  const layoutStepAction = useCallback(
    (source: LayoutItemRef, direction: "UP" | "DOWN"): (() => void) | null => {
      const probe = stepLayoutItem(draft, source, direction, () => "probe", LAYOUT_DROP_CONTROL);
      // [B.4 : refus `STOP_POINTS` aussi écarté — retiré le 31/10/2026 par B.6.]
      if (probe.status === "REFUSED" && (probe.reason === "AT_BOUNDARY" || probe.reason === "NOT_FOUND")) return null;
      return () => runLayoutMove(() => stepLayoutItem(draftRef.current, source, direction, () => Crypto.randomUUID(), LAYOUT_DROP_CONTROL));
    },
    [draft, runLayoutMove],
  );
  /**
   * PRE-9 B.6 (D-441 ; ch13 CE-T03-08, story 6.2 : « Monter » / « Descendre » d'un Point, « proposées
   * seulement si le déplacement serait accepté ») — généralisé à la structure (`stepLayoutStopPoint`).
   */
  const layoutStopPointStepAction = useCallback(
    (stopPointId: string, direction: "UP" | "DOWN"): (() => void) | null => {
      const probe = stepLayoutStopPoint(draft, stopPointId, direction, () => "probe");
      if (probe.status !== "APPLIED" && probe.status !== "CHOICE_REQUIRED") return null;
      return () => runLayoutStopPointMove(() => stepLayoutStopPoint(draftRef.current, stopPointId, direction, () => Crypto.randomUUID()), stopPointId);
    },
    [draft, runLayoutStopPointMove],
  );
  /**
   * PRE-9 B.5 (epics B.5 ; D-442 amendée : suppression toujours appliquée ; COMP §1 : « Il disparaît
   * lorsque son dernier membre en sort » ; précision de Hermann du 30/10/2026, ch07 « Retrait d'un
   * Circuit ») — Supprimer d'une carte d'une disposition générale :
   * - membre parmi d'autres : la carte s'efface en fondu, puis sa place se referme et les éléments
   *   suivants remontent (`CardMotionBlock`, durées de l'ancien modèle) ; le brouillon est écrit à la
   *   fin (`commit`, aussi appelé par `flushDeletion` : enregistrement, perte du premier plan…) ;
   * - dernier membre d'un Circuit (et d'un Cycle vidé par ce retrait) : le brouillon est écrit aussitôt
   *   et le conteneur, rendu tel qu'avant avec la carte, s'efface lentement à sa place puis sa place se
   *   referme (`VanishingBlock`, 900 + 700 ms, B.4) ; « Réduire les animations » : immédiat.
   * [B.5 : « Aucun Point d'arrêt dans une disposition générale avant B.6 : rien d'autre n'est retiré. »
   * — remplacé le 31/10/2026 par B.6 :] les Points devenus interdits ou consécutifs sont retirés sans
   * message (annonce discrète, D-442) ; une suppression qui ferait se suivre début et fin de Tour (ou
   * de répétition) demande le choix d'abord, puis est appliquée sans effacement animé.
   */
  const handleLayoutDelete = useCallback(
    (exerciseId: string) => {
      setRevealedActionsId(null);
      if (layoutDragRef.current !== null || layoutDeletionRef.current !== null) return;
      const outcome = removeLayoutExercise(draftRef.current, exerciseId, () => Crypto.randomUUID());
      if (outcome.status === "CHOICE_REQUIRED") {
        openTourChoice({
          kind: "LAYOUT",
          scope: outcome.conflict.scope.kind,
          apply: (choice) => {
            const replay = removeLayoutExercise(draftRef.current, exerciseId, () => Crypto.randomUUID());
            const resolution = replay.status === "CHOICE_REQUIRED" ? replay.resolutions[choice] : replay;
            if (resolution.status !== "APPLIED") return;
            commitLayoutMove(resolution.draft, resolution.removedContainers, true);
            reportRemovedStopPoints(resolution.removedStopPointIds);
          },
        });
        return;
      }
      if (outcome.status !== "APPLIED") return;
      // « Réduire les animations » : aucun mouvement, le brouillon est écrit aussitôt.
      if (reduceMotion) {
        updateDraft(() => outcome.draft);
        reportRemovedStopPoints(outcome.removedStopPointIds);
        return;
      }
      if (outcome.removedContainers.length > 0) {
        commitLayoutMove(outcome.draft, outcome.removedContainers, true);
        reportRemovedStopPoints(outcome.removedStopPointIds);
        return;
      }
      const pending = {
        id: exerciseId,
        commit: () => {
          if (layoutDeletionRef.current !== pending) return;
          layoutDeletionRef.current = null;
          setLayoutCardMotion((current) => (current?.id === exerciseId ? null : current));
          // Rejouée sur le brouillon courant ; un conteneur vidé entre-temps s'efface vide (la carte
          // s'est déjà effacée). B.6 : un choix devenu nécessaire entre-temps garde le début.
          const replay = removeLayoutExercise(draftRef.current, exerciseId, () => Crypto.randomUUID());
          const settled = replay.status === "CHOICE_REQUIRED" ? replay.resolutions.HEAD : replay;
          if (settled.status === "APPLIED") {
            commitLayoutMove(settled.draft, settled.removedContainers);
            reportRemovedStopPoints(settled.removedStopPointIds);
          }
        },
      };
      layoutDeletionRef.current = pending;
      setLayoutCardMotion({ id: exerciseId, mode: "LEAVING" });
    },
    [commitLayoutMove, openTourChoice, reduceMotion, reportRemovedStopPoints, updateDraft],
  );
  /**
   * PRE-9 B.5 (D-441 ; ARB-17 ; correction C.1 du 30/10) — Dupliquer d'une carte d'une disposition
   * générale : copie juste après la source dans le même conteneur (`duplicateLayoutExercise` : Format
   * et réglages conservés, N d'un Circuit alterné conservé) ; brouillon écrit aussitôt, la copie
   * apparaît (ouverture de sa place et fondu, comme la copie de l'ancien modèle, D-443). Aucune
   * duplication de Circuit ni de Cycle (ARB-08). PRE-9 B.6 (D-441) : la copie est insérée avant le
   * Point qui suivait sa source ; aucun Point n'est copié.
   */
  const handleLayoutDuplicate = useCallback(
    (exerciseId: string) => {
      setRevealedActionsId(null);
      if (layoutDragRef.current !== null || layoutDeletionRef.current !== null) return;
      const newId = Crypto.randomUUID();
      const outcome = duplicateLayoutExercise(draftRef.current, exerciseId, newId, () => Crypto.randomUUID());
      if (outcome.status !== "APPLIED") return;
      if (!reduceMotion) setLayoutCardMotion({ id: newId, mode: "APPEARING" });
      updateDraft(() => outcome.draft);
    },
    [reduceMotion, updateDraft],
  );
  /** PRE-9 B.5 : fin du mouvement d'une carte — suppression écrite, ou copie pleinement affichée. */
  const handleLayoutCardMotionDone = useCallback((id: string, mode: Exclude<CardMotionMode, "IDLE">) => {
    if (mode === "LEAVING") {
      if (layoutDeletionRef.current?.id === id) layoutDeletionRef.current.commit();
      return;
    }
    setLayoutCardMotion((current) => (current?.id === id && current.mode === "APPEARING" ? null : current));
  }, []);
  // PRE-9 B.6 : un Point d'arrêt saisi est porté par un repère d'Exercice fictif (voir `layoutLift`).
  const startLayoutStopPointDrag = useCallback((stopPointId: string) => startLayoutDrag(STOP_POINT_DRAG_SOURCE, stopPointId), [startLayoutDrag]);
  /** Élément en cours de glisser (aspect soulevé, suivi du doigt) ; tenu ou en retour : `layoutLiftView`. */
  const draggingSource = layoutLift !== null && layoutLift.phase === "DRAGGING" ? layoutLift.source : null;
  const draggingStopPointId = layoutLift !== null && layoutLift.phase === "DRAGGING" ? layoutLift.stopPointId : null;
  const liftSource = layoutLift?.source ?? null;
  const liftStopPointId = layoutLift?.stopPointId ?? null;
  const liftDragging = layoutLift?.phase === "DRAGGING";
  const liftSourceBoxKey = layoutLift?.sourceBoxKey ?? null;
  const liftSourceKey = layoutLift?.sourceKey ?? null;
  const liftHeight = layoutLift?.height ?? 0;
  /** Recette n° 2 : élément saisi, tenu ou en retour (premier plan, hors de la chaîne du rail). */
  const layoutLiftView = useMemo<LayoutLiftView | null>(
    () => (liftSource === null || liftSourceKey === null ? null : { source: liftSource, stopPointId: liftStopPointId, dragging: liftDragging, sourceKey: liftSourceKey }),
    [liftDragging, liftSource, liftSourceKey, liftStopPointId],
  );
  /**
   * Recette n° 2 (PRE-6 story 5.2) : liens du rail au niveau Séance ; l'élément saisi, tenu ou en retour
   * sort de la chaîne (son successeur se relie à travers sa place).
   */
  const layoutSessionLinks = useMemo(
    () => layoutSessionRailLinks(layoutPieces, liftSourceBoxKey === null ? null : { boxKey: liftSourceBoxKey, extra: liftHeight + SEQUENCE_GAP }),
    [layoutPieces, liftHeight, liftSourceBoxKey],
  );
  const layoutDragContext = useMemo<LayoutDragContext | null>(
    () =>
      // PRE-9 B.6 : ni glisser ni pas à pas en placement (seuls les emplacements répondent).
      richLayout === null || envelope !== null || placement !== null || pendingLayoutMove !== null || pendingNatureChange !== null
        ? null
        : {
            source: draggingSource,
            stopPointId: draggingStopPointId,
            reportBox: reportLayoutBox,
            onCircuitReveal: startLayoutExpansion,
            onStart: startLayoutDrag,
            onStartStopPoint: startLayoutStopPointDrag,
            onMove: moveLayoutDrag,
            onEnd: endLayoutDrag,
            onCancel: cancelLayoutDrag,
            stepAction: layoutStepAction,
            stopPointStepAction: layoutStopPointStepAction,
          },
    [
      cancelLayoutDrag,
      endLayoutDrag,
      draggingSource,
      draggingStopPointId,
      envelope,
      layoutStepAction,
      layoutStopPointStepAction,
      moveLayoutDrag,
      pendingLayoutMove,
      pendingNatureChange,
      placement,
      reportLayoutBox,
      richLayout,
      startLayoutDrag,
      startLayoutExpansion,
      startLayoutStopPointDrag,
    ],
  );
  /**
   * PRE-9 B.6 (D-441, ARB-02, ARB-06) : Points d'arrêt d'une disposition générale — hors placement,
   * chaque Point est une rangée autonome à sa place (niveau Séance, Cycle, Circuit), saisie par appui
   * long, « Monter » / « Descendre » accessibles ; en placement, les emplacements de tête et d'après un
   * conteneur sont des rangées autonomes (ceux d'après un Exercice sont portés par sa carte).
   */
  const layoutStops = useMemo<LayoutStopsContext>(() => {
    const points = draft.structure?.stopPoints ?? [];
    const labels = generalLabels;
    return {
      placement: generalPlacementRowContext,
      rowsAt: (container, position) => {
        if (placement !== null) {
          const slot = generalSlots.find(
            (item) => item.afterExerciseId === null && item.position === position && sameStopPointContainer(item.container, container),
          );
          const point = generalRowPointOf(slot);
          return slot === undefined || point === null ? [] : [{ kind: "PLACEMENT", key: `layout-slot-${slot.rank}`, point }];
        }
        return points.flatMap((item): LayoutStopRow[] => {
          const own = stopPointContainerOf(item);
          if (own === null || item.position !== position || !sameStopPointContainer(own, container)) return [];
          const id = layoutStopPointId(item);
          return [{ kind: "POINT", id, accessibilityLabel: labels?.existing(id) ?? strings.screens.composition.placement.stopPoint }];
        });
      },
      focusRequest: itemFocusRequest,
      onFocusConsumed: consumeItemFocus,
    };
  }, [consumeItemFocus, draft.structure, generalLabels, generalPlacementRowContext, generalRowPointOf, generalSlots, itemFocusRequest, placement]);

  /** PRE-9 B.5 : actions glissées des cartes d'une disposition générale ; inactives quand le glisser l'est. */
  const layoutActionsContext = useMemo<LayoutActionsContext | null>(
    () =>
      richLayout === null || envelope !== null || pendingLayoutMove !== null || pendingNatureChange !== null
        ? null
        : placement !== null
          ? null
          : { revealedId: revealedActionsId, onReveal: handleRevealActions, onDuplicate: handleLayoutDuplicate, onDelete: handleLayoutDelete },
    [envelope, handleLayoutDelete, handleLayoutDuplicate, handleRevealActions, pendingLayoutMove, pendingNatureChange, placement, revealedActionsId, richLayout],
  );

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
  const buildDragLayout = useCallback((collapsedAsBlock = false): CompositionDragLayout | null => {
    // PRE-9 B.1a : Circuit replié — ses rangées ne sont pas affichées (leurs mesures sont celles
    // d'avant le repli) : aucune géométrie fiable, comme une rangée non mesurée.
    // Recette iPhone du 01/11/2026 (cr7-carte) : pour le soulèvement d'un élément hors du Circuit
    // replié (`collapsedAsBlock`), le Circuit replié est un bloc — ses rangées masquées sont omises,
    // ses bornes sont celles de sa boîte repliée ; une dépose sur lui vise sa fin (`frozenDropSlot`).
    if (isCircuitCollapsed && !collapsedAsBlock) return null;
    const rows: ActivityRowLayout[] = [];
    for (const zone of STRUCTURAL_ZONES) {
      if (isCircuitCollapsed && zone === "IN_TOUR") continue;
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
    if (!hasLegacyCircuit) {
      // PRE-9 B.2 (D-451, COMP §1) : sans Circuit, aucune dépose n'entre dans le Circuit — la
      // frontière avant / après est la limite entre les deux zones, qui se suivent : le haut de la
      // première rangée après, à défaut le bas de la dernière rangée avant (moitié de l'écart).
      const afterTops = rows.filter((row) => row.zone === "AFTER_TOUR").map((row) => row.top);
      const beforeBottoms = rows.filter((row) => row.zone === "BEFORE_TOUR").map((row) => row.top + row.height);
      const boundary =
        afterTops.length > 0
          ? Math.min(...afterTops) - SEQUENCE_GAP / 2
          : beforeBottoms.length > 0
            ? Math.max(...beforeBottoms) + SEQUENCE_GAP / 2
            : 0;
      return { tourTop: boundary, tourBottom: boundary, rows };
    }
    return {
      tourTop: tourLayoutRef.current.top,
      tourBottom: tourLayoutRef.current.top + tourLayoutRef.current.height,
      rows,
    };
  }, [hasLegacyCircuit, isCircuitCollapsed, zoneItems, zoneBaseTop]);

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
        closeCircuitControls();
        return "PENDING";
      }
      if (plan.losses.length > 0) {
        // Seule l'intention est retenue : « Confirmer » rejoue le déplacement sur le brouillon
        // COURANT (aucun instantané rejoué).
        // PRE-6 (story 3.1, RC-4) : un dialogue de décision referme le choix de nature.
        closeCircuitControls();
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
    [closeCircuitControls, draft, openTourChoice, reportRemovedStopPoints, updateDraft],
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
   * Recette iPhone du 01/11/2026 (cr7-carte) — Circuit unique replié (ancien modèle) : un élément hors
   * du Circuit est soulevé sans le déplier ; une carte amenée sur lui et arrêtée
   * `LAYOUT_COLLAPSED_HOVER_DELAY_MS` le déploie (recette n° 2 du 31/10 : « L'arrêt d'une carte sur un
   * circuit replié doit l'ouvrir », même délai que la structure générale) ; le déploiement terminé
   * (`CIRCUIT_REVEAL_DURATION_MS`), la géométrie du geste est relevée de nouveau, ses cartes
   * deviennent des destinations. Aperçu courant (`legacyPreviewRef`), dernière translation, minuterie.
   */
  const legacyPreviewRef = useRef<DragShiftSession["preview"]>(null);
  useLayoutEffect(() => {
    legacyPreviewRef.current = dragSession.preview;
  });
  const legacyLastTranslationRef = useRef(0);
  /** Contre-recette du 01/11/2026 (m12-levee) : translations affichées (`dragShifts`), base de la visée du Circuit replié. */
  const legacyDragShiftsRef = useRef<DragShifts | null>(null);
  const buildDragLayoutRef = useRef(buildDragLayout);
  useLayoutEffect(() => {
    buildDragLayoutRef.current = buildDragLayout;
  });
  const legacyHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Déploiement lancé par l'arrêt, géométrie pas encore relevée de nouveau. */
  const legacyExpandingRef = useRef(false);
  const clearLegacyHover = useCallback(() => {
    if (legacyHoverTimerRef.current !== null) clearTimeout(legacyHoverTimerRef.current);
    legacyHoverTimerRef.current = null;
    legacyExpandingRef.current = false;
  }, []);
  useEffect(() => clearLegacyHover, [clearLegacyHover]);
  useEffect(() => {
    if (draggedKey === null) clearLegacyHover();
  }, [clearLegacyHover, draggedKey]);
  /** Fin du déploiement : géométrie relevée de nouveau (Circuit affiché), l'élément soulevé gardé sous le doigt. */
  const refreezeAfterLegacyExpansion = useCallback(
    (key: string) => {
      legacyExpandingRef.current = false;
      const preview = legacyPreviewRef.current;
      if (preview === null || preview.key !== key || draggedKeyRef.current !== key) return;
      // Géométrie du rendu courant (Circuit affiché), non celle du rendu qui a lancé la minuterie.
      const layout = buildDragLayoutRef.current();
      const before = preview.originLayout.rows.find((row) => row.id === key);
      const after = layout?.rows.find((row) => row.id === key);
      // Géométrie incomplète : celle du Circuit replié reste (une dépose vise sa fin).
      if (layout === null || before === undefined || after === undefined) return;
      const { collapsedTourEnd: _collapsed, ...rest } = preview;
      // L'origine du pointeur reste celle du début du geste (repère du contenu) ; le déplacement de
      // l'élément dans la mise en page (Circuit déployé au-dessus de lui) est compensé (`sourceDrift`).
      const relayout = { ...layout, rows: layout.rows.map((row) => (row.id === key ? before : row)) };
      const unsettled = { ...rest, originLayout: relayout, sourceDrift: after.top - before.top };
      const next = { ...unsettled, slot: frozenDropSlot(unsettled, legacyLastTranslationRef.current) };
      setDragSession((current) =>
        current.preview !== preview ? current : { ...current, preview: next, circuitHeight: layout.tourBottom - layout.tourTop },
      );
    },
    [],
  );
  const armLegacyHover = useCallback(
    (key: string) => {
      legacyHoverTimerRef.current = setTimeout(() => {
        legacyHoverTimerRef.current = null;
        const preview = legacyPreviewRef.current;
        if (preview === null || preview.key !== key || preview.collapsedTourEnd === undefined || draggedKeyRef.current !== key) return;
        if (frozenDropSlot(preview, legacyLastTranslationRef.current, legacyDragShiftsRef.current)?.zone !== "IN_TOUR") return;
        legacyExpandingRef.current = true;
        setCircuitCollapsedContent(null);
        legacyHoverTimerRef.current = setTimeout(
          () => {
            legacyHoverTimerRef.current = null;
            refreezeAfterLegacyExpansion(key);
          },
          reduceMotionRef.current ? 0 : CIRCUIT_REVEAL_DURATION_MS,
        );
      }, LAYOUT_COLLAPSED_HOVER_DELAY_MS);
    },
    [refreezeAfterLegacyExpansion],
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
      // Contre-recette n° 4 du 01/11/2026 (cr5-reposer) : l'élément lâché est aussitôt porté par le
      // registre, dans la tâche même où sa translation de doigt revient à 0 (voir `releaseDragY`).
      shiftRegistryRef.current?.pose(key, translationY);
      clearLegacyHover();
      const frozen = dragPreview !== null && dragPreview.key === key ? frozenDropSlot(dragPreview, translationY, legacyDragShiftsRef.current) : null;
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
          dragPreview === null ||
            dragPreview.key !== key ||
            // Recette du 01/11/2026 (cr7-carte) : déposé à la fin du Circuit replié — ses rangées ne sont
            // pas dans la géométrie du geste : aucune pose calculable (le Circuit se déplie, ARB-12).
            (dragPreview.collapsedTourEnd !== undefined && destination.zone === "IN_TOUR")
            ? null
            : dropSettlePose(dragPreview, destination, translationY, draft, removedAtDrop),
        );
      }
    },
    [
      buildDragLayout,
      clearLegacyHover,
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
        clearLegacyHover();
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
        // PRE-9 B.1a : Circuit replié — un dépôt pourrait viser ses rangées masquées. Le soulèvement
        // est refusé (rien ne bouge, rien n'est écrit) et le Circuit se déplie : un nouvel appui
        // long saisit l'élément, le Circuit visible.
        // [Remplacé par la recette iPhone du 01/11/2026 (cr7-carte, Hermann : « appui long sur un des
        // exercices hors circuit, sans aucun mouvement, cela déplie le Circuit » — KO) : l'élément est
        // soulevé, le Circuit reste replié ; replié, il n'offre que sa fin (`collapsedTourEnd`) ; il
        // ne se déplie qu'à l'arrêt d'une carte amenée sur lui (recette n° 2 du 31/10 : « L'arrêt
        // d'une carte sur un circuit replié doit l'ouvrir »), voir `handleDragMove`.]
        const originLayout = buildDragLayout(true);
        if (originLayout === null) return false;
        legacyLastTranslationRef.current = 0;
        // Story 5.2b : un nouveau geste pendant un retour arrête ce retour et pose toutes les
        // translations à 0, de façon synchrone, AVANT le relevé (la mise en page mesurée, que
        // `buildDragLayout` vient de lire, correspond alors à l'écran).
        shiftRegistryRef.current?.reset();
        // Story 7.4 : origine du défilement accumulé pendant ce geste.
        autoScroll.begin();
        setDragSession({
          preview: {
            key,
            originLayout,
            slot: null,
            heldTranslationY: null,
            ...(isCircuitCollapsed ? { collapsedTourEnd: collapsedTourEndIndex(zoneItems.IN_TOUR) } : {}),
          },
          animated: true,
          circuitHeight: originLayout.tourBottom - originLayout.tourTop,
          release: null,
          settling: null,
        });
      }
      handleDragStart(key);
      return true;
    },
    [autoScroll, buildDragLayout, clearLegacyHover, handleDragStart, isCircuitCollapsed, zoneItems.IN_TOUR],
  );

  /**
   * PRE-6 (story 2.3b) : emplacement d'insertion visé pendant le glisser — `frozenDropSlot`, sur
   * la géométrie figée au début du geste, le même calcul que le dépôt (`handleDropActivity`).
   * Aucune mutation du brouillon ; l'état ne change que si l'emplacement change.
   */
  const handleDragMove = useCallback(
    (key: string, translationY: number) => {
      legacyLastTranslationRef.current = translationY;
      // Recette du 01/11/2026 (cr7-carte) : arrêt d'une carte sur le Circuit unique replié.
      const stored = legacyPreviewRef.current;
      if (stored !== null && stored.key === key && stored.collapsedTourEnd !== undefined && !legacyExpandingRef.current) {
        const over = stopPointIdOfKey(key) === null && frozenDropSlot(stored, translationY, legacyDragShiftsRef.current)?.zone === "IN_TOUR";
        if (!over) clearLegacyHover();
        else if (legacyHoverTimerRef.current === null) armLegacyHover(key);
      }
      setDragSession((current) => {
        const preview = current.preview;
        if (preview === null || preview.key !== key) {
          return current;
        }
        const slot = frozenDropSlot(preview, translationY, legacyDragShiftsRef.current);
        if (slot === null || (preview.slot !== null && preview.slot.zone === slot.zone && preview.slot.index === slot.index)) {
          return current;
        }
        // Contre-recette du 01/11/2026 (m12-levee) : arrivée sur le Circuit replié — l'aperçu d'avant reste.
        const entersCollapsed = preview.collapsedTourEnd !== undefined && slot.zone === "IN_TOUR" && preview.slot?.zone !== "IN_TOUR";
        return { ...current, preview: { ...preview, slot, ...(entersCollapsed ? { hoverBaseSlot: preview.slot } : {}) } };
      });
    },
    [armLegacyHover, clearLegacyHover],
  );

  /**
   * Décalages qui montrent la disposition du dépôt à l'emplacement visé (`resolveDragShifts`,
   * fonction pure) : cartes, bords du Circuit (amendement Hermann du 21/10/2026 : il s'agrandit ou
   * se rétracte pendant le geste), ligne après le Circuit.
   */
  const dragShifts = useMemo<DragShifts>(() => {
    if (dragPreview === null || dragPreview.slot === null) {
      return NO_DRAG_SHIFTS;
    }
    // Recette du 01/11/2026 (cr7-carte) : arrêt sur le Circuit replié — [aucune place ouverte (comme la
    // structure générale, contre-recette n° 4, cr5-replie) — remplacé par la contre-recette du 01/11
    // (m12-levee, « il a tendance à fuir en bas ou en haut ») :] l'aperçu d'avant l'arrêt reste
    // (`hoverBaseSlot`) ; un lâcher dépose à sa fin.
    const shownSlot =
      dragPreview.collapsedTourEnd !== undefined && dragPreview.slot.zone === "IN_TOUR" ? (dragPreview.hoverBaseSlot ?? null) : dragPreview.slot;
    if (shownSlot === null) {
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
            shownSlot,
            // Carte v2 (story 5.1) : 80 quelle que soit la zone ; l'écart de carte est nul.
            () => occurrenceCardHeight(),
          );
    const shifts = resolveDragShifts(
      dragPreview.originLayout,
      dragPreview.key,
      shownSlot,
      DRAG_SHIFT_GAPS,
      insertionHeight,
    );
    // Recette du 01/11/2026 (cr7-carte) : Circuit déployé par l'arrêt AU-DESSUS de l'élément soulevé —
    // sa translation de registre compense son déplacement dans la mise en page (sous le doigt).
    const drift = dragPreview.sourceDrift ?? 0;
    return drift === 0 ? shifts : { ...shifts, rows: new Map(shifts.rows).set(dragPreview.key, -drift) };
  }, [dragPreview, draft]);
  useLayoutEffect(() => {
    legacyDragShiftsRef.current = dragShifts;
  });
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
    // Recette iPhone n° 2 du 31/10/2026 : disposition générale — cartes, Points d'arrêt, bords et blocs
    // des Circuits et des Cycles (au repos : 0 ; aperçu du glisser : `layoutDragShifts`), Fin de séance ;
    // l'élément lâché tenu pendant un dialogue reste où le doigt l'a laissé.
    if (layoutPieces.length > 0) {
      // Valeurs natives dès leur création (`nativeShiftKey`, espace propre à la disposition générale).
      for (const key of layoutShiftKeys(layoutPieces)) targets.set(nativeShiftKey(key), layoutLift?.shifts?.shifts.get(key) ?? 0);
      targets.set(nativeShiftKey(RAIL_KEYS.start), 0);
      targets.set(nativeShiftKey(RAIL_KEYS.end), layoutLift?.shifts?.end ?? 0);
      if (layoutLift !== null && layoutLift.heldTranslationY !== null) targets.set(nativeShiftKey(layoutLift.sourceKey), layoutLift.heldTranslationY);
    }
    return targets;
  }, [deletionShifts, dragPreview, dragShifts, layoutLift, layoutPieces, zoneItems]);
  // Recette n° 2 : la disposition générale anime toujours ses translations (aperçu, retour, mise en place).
  const shiftRegistry = useAnimatedShiftRegistry(
    railShiftTargets,
    animateDragShifts || (richLayout !== null && !reduceMotion),
    richLayout !== null ? layoutRelease : dragSession.release,
  );
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
  /**
   * Recette n° 2 du 31/10 : translations d'une disposition générale, dans leur propre espace de clés
   * (`nativeShiftKey`) — les composants demandent les clés de l'ancien modèle (`railRowKey`…).
   */
  const layoutShiftOf = useCallback((key: string) => railShiftOf(nativeShiftKey(key)), [railShiftOf]);
  /**
   * Recette n° 2 du 31/10 : rail des cartes d'une disposition générale — liens étirables au niveau
   * Séance ; carte saisie, tenue ou en retour hors de la chaîne (story 5.2b).
   */
  const layoutCardSkipKey = layoutLift === null || layoutLift.stopPointId !== null || layoutLift.source.kind !== "EXERCISE" ? null : layoutLift.sourceKey;
  const layoutSessionRail = useMemo<SequenceRailContext>(
    () => ({ links: cardRailLinks(layoutSessionLinks), shiftOf: layoutShiftOf, skippedKeys: skippedKeysOf(layoutCardSkipKey) }),
    [layoutCardSkipKey, layoutSessionLinks, layoutShiftOf],
  );
  const circuitTopShift = railShiftOf(RAIL_KEYS.circuitHeader);
  const circuitBottomShift = railShiftOf(RAIL_KEYS.circuitEnd);
  const afterCircuitShift = railShiftOf(RAIL_KEYS.afterCircuit);
  // Recette n° 2 : disposition générale — Fin de séance dans l'espace de la disposition.
  const endShift = richLayout !== null ? layoutShiftOf(RAIL_KEYS.end) : railShiftOf(RAIL_KEYS.end);
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
  /**
   * PRE-9 B.4c (COMP §7) : en-têtes collantes. Seuil sous la part fondue de la zone de contexte (le
   * corps remonte dessous). CS-D7 : décollées pendant un déplacement (carte, Circuit, Cycle, trait de
   * périmètre) ; aussi en mode enveloppe, où les mesures sont relatives aux cadres (voir spec B.4c).
   */
  const stickyEnabled = draggedKey === null && layoutLift === null && !isEnvelopeEdgeDragging && !isEnvelopeActive;
  const stickyScroll = useMemo<StickyScroll>(
    () => ({
      scrollY: bodyScrollY,
      offset: () => bodyOffsetRef.current,
      scrollTo: (offset) => {
        bodyScrollRef.current?.scrollTo({ y: offset, animated: false });
        handleBodyScroll(offset);
      },
      top: CONTEXT_BAND_FADE_HEIGHT,
      enabled: stickyEnabled,
    }),
    [bodyScrollY, handleBodyScroll, stickyEnabled],
  );
  // Circuit unique (rendu historique) : géométrie de son en-tête collant.
  const legacyStickyRange = stickyRange({
    containerY: circuitMeasuredHeight > 0 ? circuitSectionTop : null,
    containerHeight: circuitMeasuredHeight > 0 ? circuitMeasuredHeight : null,
    headerBottom: circuitHeaderLayout === null ? null : circuitHeaderLayout.y + circuitHeaderLayout.height,
    bottomInset: CIRCUIT_PADDING_VERTICAL,
    stickTop: CONTEXT_BAND_FADE_HEIGHT,
  });
  // PRE-9 B.1a : l'anneau est centré sur la ligne d'en-tête — tout l'en-tête quand le Circuit est
  // déplié ; replié, la seule première ligne (mesurée), la ligne des noms étant dessous. La queue
  // de l'anneau descend toujours jusqu'au bas de l'en-tête (rail continu).
  const circuitHeaderRingRowHeight = isCircuitCollapsed
    ? circuitHeaderRowHeight !== null && circuitHeaderRowHeight > 0
      ? circuitHeaderRowHeight
      : CIRCUIT_HEADER_HEIGHT
    : circuitHeaderHeight;
  const circuitHeaderRingTopY = CIRCUIT_PADDING_VERTICAL + circuitHeaderRingTop(circuitHeaderRingRowHeight);
  const railGeometry = railGeometryFor(circuitHeaderRingRowHeight);
  /**
   * Revue 5.2 : la Fin suit-elle une rangée de point d'arrêt ? Story 6.2 : dernière rangée de la
   * zone après le Circuit. Hors placement seulement (en placement, la Fin est inactive).
   */
  // PRE-9 B.2 : sans Circuit ni rangée après lui, la dernière rangée de la zone avant.
  const lastSequenceZone = hasLegacyCircuit || zoneItems.AFTER_TOUR.length > 0 ? zoneItems.AFTER_TOUR : zoneItems.BEFORE_TOUR;
  const finPrecededByStopPoint = placement === null && lastSequenceZone[lastSequenceZone.length - 1]?.kind === "STOP_POINT";
  /**
   * Revue 6.2 : le Compte à rebours est-il suivi d'une rangée de point (première rangée de la zone
   * avant le Circuit) ? Seules ces rangées touchent une borne : une rangée du Circuit en est séparée
   * par sa marge (14), une rangée après le Circuit par le Circuit lui-même.
   */
  // PRE-9 B.2 : sans Circuit ni rangée avant, la première rangée de la zone après.
  const firstSequenceZone = hasLegacyCircuit || zoneItems.BEFORE_TOUR.length > 0 ? zoneItems.BEFORE_TOUR : zoneItems.AFTER_TOUR;
  const countdownFollowedByStopPoint = placement === null && firstSequenceZone[0]?.kind === "STOP_POINT";
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
    // PRE-9 B.1a : Circuit replié — ses rangées ne sont pas affichées ; l'anneau de l'en-tête se
    // relie directement au bas du Circuit.
    inTour: isCircuitCollapsed ? [] : zoneItems.IN_TOUR.map(railChainItemOf),
    afterTour: zoneItems.AFTER_TOUR.map(railChainItemOf),
    // PRE-9 B.2 (D-451, COMP §1) : sans Exercice, le Circuit n'est pas rendu ni chaîné.
    hasCircuit: hasLegacyCircuit,
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
        case "LAYOUT": {
          if (choice === null) request.cancel?.();
          else request.apply(choice);
          return;
        }
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
        if (openTourChoice({ kind: "OCCURRENCE_DELETE", activityId })) closeCircuitControls();
        return;
      }
      startDeletion(activityId, null);
    },
    [closeCircuitControls, draft, openTourChoice, startDeletion],
  );

  const handleEditActivity = useCallback(
    (activityId: string) => {
      closeCircuitControls();
      // Demande de Hermann du 29/10/2026 : carte « Paramètres à compléter » → feuille de paramètres
      // directement, sans ouvrir la carte ; [« complète → éditeur de l'Exercice, comme avant » —
      // remplacé par la recette iPhone n° 2 du 31/10/2026 (constat c, Hermann : « l'appui sur la carte
      // n'ouvre plus la fiche d'exercice mais ouvre la modale des paramètres d'exécution (voile grisé
      // qui apparaît, modale apparaît de bas en haut) ; l'appui sur la photo ouvre la fiche du
      // mouvement. »)] : toute carte d'Exercice ouvre la feuille des paramètres ; la photo ouvre
      // l'Exercice (`handleOpenMovement`). Une autre Activité (sans paramètres d'exécution) ouvre son
      // éditeur, comme avant.
      const touched = draft.exercises.find((exercise) => exercise.id === activityId);
      if (touched !== undefined && (touched.type === "EXERCISE" || isExerciseParametersIncomplete(touched))) {
        openExerciseParameters(activityId);
        return;
      }
      router.push({ pathname: "/exercise", params: { exerciseId: activityId } });
    },
    [closeCircuitControls, draft.exercises, openExerciseParameters, router],
  );
  /** Recette iPhone n° 2 du 31/10/2026 (constat c) : photo d'une carte d'Exercice — fiche de l'Exercice / du Mouvement. */
  const handleOpenMovement = useCallback(
    (activityId: string) => {
      closeCircuitControls();
      router.push({ pathname: "/exercise", params: { exerciseId: activityId } });
    },
    [closeCircuitControls, router],
  );
  // PRE-6 (story 2.1, RM-159) : durée de séance de l'en-tête — toutes les occurrences, sans
  // Compte à rebours ni Fin. Story 7.8 (D-443) : estimation arrondie aux 15 s, « ≈ » / « ≥ » ; la
  // durée du Circuit n'est plus affichée (en-tête du Circuit).
  // PRE-9 B.1b : disposition générale — même calcul sur sa structure (Circuits, Cycles, RM-252), même
  // format (l'arrondi du Cycle reste à qualifier, B.7).
  const sessionDuration =
    richLayout !== null
      ? formatLayoutDuration(richLayout.elements)
      : formatCompositionSessionDuration({
          exercises: durationDraft.exercises,
          tourRepeatCount,
          circuitNature: draft.circuitNature,
        });
  // PRE-9 B.1a (D-451, complément du 28/10, qui remplace la clause de D-443 masquant la durée) :
  // durée du Circuit, à droite de son en-tête — mêmes calculs (zone `IN_TOUR`, nature, N), même
  // brouillon que la durée de séance (recalculée en direct pendant le placement).
  const circuitDuration = formatCircuitDuration({
    exercises: durationDraft.exercises,
    tourRepeatCount,
    circuitNature: draft.circuitNature,
  });
  // PRE-9 B.1a (référence §4) : ligne du Circuit replié — noms de ses exercices, dans l'ordre, tels
  // que sur leurs cartes (`occurrenceCardName`).
  const circuitMemberNames = zoneItems.IN_TOUR.flatMap((item) =>
    item.kind === "OCCURRENCE" ? [occurrenceCardName(item.occurrence, levelPositions)] : [],
  );
  /**
   * PRE-9 B.1a (ARB-12) : le nom ou le chevron replie ou déplie le Circuit — état de l'écran seul,
   * sans écriture du brouillon. Le stepper révélé et le choix de nature se referment (un seul
   * contrôle ouvert). Sans effet pendant le glisser ; une suppression animée est écrite d'abord.
   */
  const toggleCircuitCollapsed = useCallback(() => {
    if (draggedKeyRef.current !== null) return;
    flushDeletion();
    closeCircuitControls();
    setRevealedActionsId(null);
    setCircuitCollapsedContent((current) => (current === null ? circuitContentKey : null));
  }, [circuitContentKey, closeCircuitControls, flushDeletion]);

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
      namePrompt={sessionNamePromptShown(draft.exercises)}
      sessionLabel={sessionLabel}
      sessionColor={sessionColor}
      onOpenLabelPicker={() => {
        closeCircuitControls();
        setIsLabelPickerOpen(true);
      }}
      sessionDuration={sessionDuration}
      onAdd={() => {
        closeCircuitControls();
        setIsAddActivityTreeOpen(true);
      }}
      onAddStop={toggleAddStop}
      addActionRef={addActionRef}
      // Recette du 01/11/2026 (m11-annuler) : le « + » s'efface pendant le menu (Annuler à sa place).
      isCreateMenuOpen={isAddActivityTreeOpen}
      // PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : l'œil des Volumes, dans les
      // commandes contextuelles ; mêmes modales, même retour du focus (story 3.4).
      onOpenVolumes={openCircuitVolumes}
      volumesFocusRequest={volumesFocusRequest}
      // PRE-9 B.1b : disposition générale — les Volumes (Circuit unique) et le placement des pauses
      // (B.6) ne s'appliquent pas encore à plusieurs Circuits ni aux Cycles : indisponibles.
      isVolumesDisabled={draggedKey !== null || richLayout !== null}
      isPlacementActive={isPlacementActive}
      // PRE-9 B.6 : « Ajouter un arrêt » s'applique aussi à une disposition générale. [B.1b : « ||
      // richLayout !== null » (placement indisponible) — retiré le 31/10/2026 par B.6.]
      isAddStopDisabled={!hasPlacementOffer || draggedKey !== null || layoutLift !== null}
      addStopFocusRequest={addStopFocusRequest}
      addStopAccessibilityHint={addStopAccessibilityHint}
      testID="composition-context-header"
    />
  );

  return (
    <ScreenShell>
      <FixedHeader
        title={readOnly ? composition.consultation.title : composition.title}
        // PRE-6 (story 4.1) : pendant le placement, le X annule d'abord le placement (sans mutation).
        // PRE-9 B.2 : de même, en mode enveloppe, le X l'annule d'abord.
        onBack={() => (placement !== null ? cancelPlacement() : envelope !== null ? cancelEnvelope() : router.back())}
        backAccessibilityLabel={composition.closeAccessibilityLabel}
        // PRE-6 (story 2.1, Figma `8328:28730`) : bouton fermer (X) — même action et même
        // garde d’abandon (`useCompositionExitGuard`) que le retour précédent.
        closeIcon
      />
      {/* Recette 3 (T-49, EXT-R3-2, D-353) : plus de trait gris entre l’en-tête et la
          zone de contexte — la courbe blanche sous Retour s’y raccorde directement. */}

      {/* Recette iPhone du 29/10/2026 : fondu des 20 % inférieurs vers la TRANSPARENCE (ch. 12,
          D-224), porté par `ContextBand` — plus de voile blanc posé sur la couleur de la bande. */}
      <ContextBand fadeToTransparent>
        {/* Recette 3 (T-49, EXT-R3-2 autorisée par Hermann le 12/10) : mêmes effets que
            la zone de contexte de l’éditeur (D-348), sur la couleur PROPRE de la
            Composition (bande partagée inchangée) — courbe blanche concentrique au
            bouton Retour (Ø 59,28). Dessinée en premier (sous le contenu), découpée à la
            bande, sans interaction ni exposition à l’accessibilité. */}
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.contextBandEffects}
          testID="composition-context-band-effects"
        >
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
        ) : isEnvelopeActive ? (
          // PRE-9 B.2 : en mode enveloppe, nom, Étiquette et commandes sont inactifs (comme le
          // contenu hors emplacements en placement) ; seuls les contenus éligibles et la barre répondent.
          <PlacementAttenuation active testID="composition-envelope-context-header">
            {contextHeader}
          </PlacementAttenuation>
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
      <StickyScrollContext.Provider value={stickyScroll}>
      <Animated.ScrollView
        ref={bodyScrollRef}
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: actionZone.scrollReserve },
          // Contre-recette n° 4 (constat a) : hauteur gardée pendant le glisser d'un Circuit (voir `layoutContentFloor`).
          layoutContentFloor !== null ? { minHeight: layoutContentFloor } : null,
        ]}
        // Story 7.10 (revue) : l'indicateur de défilement s'arrête au haut de la zone d'action.
        scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
        keyboardShouldPersistTaps="handled"
        // T02-S01 (D-127/CE-T02-02) : pendant un déplacement de carte, le
        // défilement PAR L'UTILISATEUR est neutralisé — le geste vertical appartient alors
        // exclusivement à la carte soulevée, jamais à la liste. PRE-6 story 7.4 : la liste défile
        // alors seulement d'elle-même, près de ses bords (`useDragAutoScroll`).
        scrollEnabled={draggedKey === null && draggingSource === null && !isEnvelopeEdgeDragging}
        // Story 7.4 : décalage, contenu et zone visible du défilement automatique.
        // PRE-9 B.4c : aussi le décalage des en-têtes collantes (pilote natif).
        onScroll={bodyScrollEvent}
        scrollEventThrottle={16}
        // Revue 7.4 : sur iOS, le dernier `onScroll` d'un défilement peut être filtré (`scrollEventThrottle`).
        onScrollEndDrag={(event) => handleBodyScroll(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => handleBodyScroll(event.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_width, height) => {
          bodyContentHeightRef.current = height;
          autoScroll.handleContentSize(height);
        }}
        onLayout={(event) => autoScroll.handleLayout(event.nativeEvent.layout.height)}
        // PRE-6 (story 3.1, RC-4) : faire défiler la liste referme le choix de nature du Circuit.
        onScrollBeginDrag={closeCircuitControls}
        testID="composition-body"
      >
        <ReadOnlyFrame readOnly={readOnly} style={styles.readOnlyBody}>
        {/* PRE-6 (story 3.1, RC-4) : zone d'appui extérieur du corps — voir `NatureOutsideZone`.
            PRE-9 B.1a : elle referme aussi le stepper révélé du compte. */}
        {isCircuitControl(openOverlay) ? (
          <NatureOutsideZone onPress={handleCircuitOutsidePress} testID="composition-circuit-nature-outside" />
        ) : null}
        {/* PRE-6 (story 5.2, D-435) : plus de rail continu — chaque élément de la séquence porte ses
            segments (`compositionRail.ts`) ; le Compte à rebours porte son anneau et sa queue. */}
        {/* PRE-6 (story 4.1) : en placement, les bornes sont atténuées et non interactives. */}
        {/* Revue 5.2 : anneau et queue de la borne hors de l'atténuation du placement (opacité
            uniforme du rail), posés sur la rangée. */}
        {/* Story 7.8 (D-443) : cadre aligné à droite sur le bord droit des cartes d'Exercice. */}
        <View style={styles.boundaryTrailingOutset} testID="composition-boundary-countdown-step">
          <PlacementAttenuation active={isPlacementActive || isEnvelopeActive} testID="composition-boundary-countdown-placement">
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
         * PRE-9 B.1b (D-451, COMP §1 et §4 ; Figma `10725:20142`, `10744:20108`) : une disposition
         * générale (plusieurs Circuits, Cycles) est rendue selon sa structure — Exercices directs,
         * Circuits, Cycles — entre les deux bornes ; sinon, rendu historique par zones, inchangé.
         */}
        {richLayout !== null ? (
          <LayoutSequence
            layout={richLayout}
            letters={layoutLetters}
            openOverlay={openOverlay}
            onToggleOverlay={toggleOverlay}
            onCircuitCount={handleLayoutCircuitCount}
            onCycleCount={handleLayoutCycleCount}
            onSelectNature={handleLayoutSelectNature}
            onDismissNature={dismissLayoutNatureMenu}
            natureFocusRequests={layoutNatureFocus}
            onOutsidePress={handleCircuitOutsidePress}
            isChoicePending={pendingNatureChange !== null}
            collapsed={layoutCollapsed}
            onToggleCollapsed={toggleLayoutCircuitCollapsed}
            bodyZonesReferential={bodyZonesReferential}
            categoriesReferential={categoriesReferential}
            levelPositions={levelPositions}
            onEdit={handleEditActivity}
            onOpenMovement={handleOpenMovement}
            railShiftOf={layoutShiftOf}
            autoScroll={autoScroll}
            envelope={envelopeContext}
            appearingCycleIds={appearingCycleIds}
            appearingCircuitIds={appearingCircuitIds}
            drag={layoutDragContext}
            vanishing={vanishing}
            onVanished={handleVanished}
            actions={layoutActionsContext}
            stops={layoutStops}
            cardMotion={layoutCardMotion}
            onCardMotionDone={handleLayoutCardMotionDone}
            lift={layoutLiftView}
            sessionLinks={layoutSessionLinks}
            sessionRail={layoutSessionRail}
            panelRight={styles.bodyContent.paddingRight}
          />
        ) : null}
        {richLayout === null ? (
        <>
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
          envelope={envelopeContext}
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
          onOpenMovement={handleOpenMovement}
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
        {/*
         * PRE-9 B.2 (D-451, COMP §1) : sans Exercice, le Circuit n'est pas rendu (aucun conteneur
         * vide). En mode enveloppe, il est un bloc : éligible pour « Ajouter un cycle » (contour
         * pointillé, désignable), inactif sinon — ses cartes ne sont jamais éligibles (déjà dans un
         * Circuit).
         */}
        {hasLegacyCircuit ? (
        <EnvelopeFrame
          envelope={envelopeContext}
          target={legacyCircuitTarget}
          name={composition.envelope.circuitName}
          testID="composition-envelope-circuit"
          outset={CIRCUIT_OUTSET}
          radius={CIRCUIT_RADIUS}
        >
        <View
          style={[
            styles.tourSectionContainer,
            // Correctif 2.3b : le Circuit qui porte la carte soulevée passe au-dessus de ses sœurs.
            zoneItems.IN_TOUR.some((item) => zoneItemKey(item) === raisedKey) ? styles.dragElevated : null,
          ]}
          // PRE-9 B.2 : dans le cadre du mode enveloppe, la mesure serait relative au cadre — ignorée
          // (aucun glisser dans ce mode ; le Circuit est remonté et remesuré à la sortie).
          onLayout={isEnvelopeActive ? undefined : handleTourLayout}
          testID="composition-tour-section"
        >
          {/*
           * PRE-6 (story 2.3b, amendement du 21/10/2026) : fond du conteneur mesuré, qui suit ses
           * bords pendant le glisser — voir `CircuitSurface` ; tant que le Circuit n'est pas mesuré,
           * fond statique. Contre-recette du 30/10 (constat b) : les deux dans une couche qui apparaît
           * progressivement quand le Circuit vient d'être posé.
           */}
          <Reanimated.View
            entering={isLegacyCircuitAppearing ? CIRCUIT_ENTERING : undefined}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            testID="composition-tour-section-reveal"
          >
            {circuitMeasuredHeight > 0 ? (
              <CircuitSurface
                top={circuitTopShift}
                bottom={circuitBottomShift}
                // Revue 7.5 : pendant une suppression, hauteur du Circuit relevée à son début.
                dragHeight={deletion !== null ? deletion.layout.tourBottom - deletion.layout.tourTop : dragSession.circuitHeight}
                testID="composition-tour-section-surface"
              />
            ) : (
              <View
                style={[StyleSheet.absoluteFill, styles.tourSectionStaticSurface]}
                testID="composition-tour-section-static-surface"
              />
            )}
          </Reanimated.View>
          {/* Zone propre au conteneur Circuit — voir `NatureOutsideZone`. */}
          {isCircuitControl(openOverlay) ? (
            <NatureOutsideZone onPress={handleCircuitOutsidePress} testID="composition-circuit-nature-outside-section" />
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
            {/* Contre-recette du 30/10 (constat b) : l'anneau apparaît avec le Circuit posé. */}
            <Reanimated.View
              entering={isLegacyCircuitAppearing ? CIRCUIT_ENTERING : undefined}
              style={StyleSheet.absoluteFill}
              testID="composition-sequence-marker-circuit-reveal"
            >
              <RailRing
                centerX={RAIL_CENTER_X_IN_CIRCUIT}
                centerY={CIRCUIT_PADDING_VERTICAL + circuitHeaderRingRowHeight / 2}
                testID="composition-sequence-marker-circuit"
              />
            </Reanimated.View>
          </Animated.View>
          {/* PRE-9 B.4c (COMP §7, CS-D2) : en-tête collant ; la mesure de l'en-tête est portée par son cadre. */}
          <StickyHeaderFrame
            range={legacyStickyRange}
            enabled
            color={CIRCUIT_SURFACE_COLOR}
            outsetLeft={CIRCUIT_OUTSET}
            outsetRight={CIRCUIT_OUTSET}
            insetTop={CIRCUIT_PADDING_VERTICAL}
            extension={CONTEXT_BAND_FADE_HEIGHT}
            rail={{ centerX: RAIL_CENTER_X_IN_CIRCUIT, ringY: circuitHeaderRingRowHeight / 2 }}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setCircuitHeaderLayout((current) =>
                current !== null && current.y === y && current.height === height ? current : { y, height },
              );
            }}
            testID="composition-circuit-header-sticky"
          >
          <CircuitHeader
            nature={circuitNature}
            count={tourRepeatCount}
            duration={circuitDuration}
            // PRE-9 B.1a (RM-027, remplace D-442 sur ce point) : stepper révélé au toucher du nombre,
            // un seul contrôle ouvert à la fois ; chaque pas passe par `circuitCountOutcome`
            // (dialogue de Tour, story 7.2).
            isCounterOpen={openOverlay === "circuitCounter"}
            onToggleCounter={() => toggleOverlay("circuitCounter")}
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
            // Contre-recette du 30/10 (constat b) : apparition progressive du Circuit posé.
            entering={isLegacyCircuitAppearing ? CIRCUIT_ENTERING : undefined}
            // PRE-6 (story 5.2) : le titre laisse la colonne de l'anneau (x 69 à 402).
            titleInset={SEQUENCE_LABEL_INSET}
            // PRE-9 B.1a (ARB-12) : repli non persisté, déplié à l'ouverture de l'écran.
            isCollapsed={isCircuitCollapsed}
            // B.4c (CS-D6) : replié collé, l'en-tête reste sous le doigt (hauteur réelle, aucune constante).
            onToggleCollapsed={() => {
              alignStuckHeader(stickyScroll, legacyStickyRange, isCircuitCollapsed);
              toggleCircuitCollapsed();
            }}
            memberNames={circuitMemberNames}
            onRowLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setCircuitHeaderRowHeight((current) => (current === height ? current : height));
            }}
            testID="composition-circuit-header"
          />
          </StickyHeaderFrame>
          {/*
           * PRE-9 B.1a (référence §4) : Circuit replié — ses cartes et ses points sont masqués.
           * Recette du 29/10 (obs-3 b) : dévoilement et repli animés (`useCircuitCardsReveal`).
           */}
          {circuitCardsReveal.mounted ? (
            <ActivityZoneList
              reveal={circuitCardsReveal}
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
              onOpenMovement={handleOpenMovement}
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
          ) : null}
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
                // Contre-recette du 30/10 (obs-3) : 8 sous des cartes déployées, 14 replié.
                minLength={isCircuitCollapsed ? CIRCUIT_PADDING_VERTICAL : CONTAINER_PADDING_BOTTOM}
                shift={circuitBottomShift}
                prevShift={railShiftOf(circuitEndRailLink.prevKey)}
                testID="composition-rail-link-circuit-end"
              />
            </Animated.View>
          ) : null}
        </View>
        </EnvelopeFrame>
        ) : null}

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
          envelope={envelopeContext}
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
          onOpenMovement={handleOpenMovement}
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
        </>
        ) : null}

        {/* PRE-6 (story 2.3b) : « Fin de séance » suit le décalage net du geste (`end`). */}
        <Animated.View
          // Story 7.8 (D-443) : cadre aligné à droite sur le bord droit des cartes d'Exercice.
          style={[styles.boundaryTrailingOutset, { transform: [{ translateY: endShift }] }]}
          testID="composition-boundary-final-phase-track"
        >
          <PlacementAttenuation active={isPlacementActive || isEnvelopeActive} testID="composition-boundary-final-phase-placement">
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
          {/* PRE-9 B.1b : disposition générale — lien à travers l'écart de la séquence. Recette n° 2 du
              31/10 : il s'étire avec les translations de l'aperçu (dernier élément du niveau Séance). */}
          {richLayout !== null ? (
            <RailLink
              centerX={RAIL_CENTER_X_IN_COLUMN}
              entryY={BOUNDARY_RING_TOP}
              length={SEQUENCE_GAP + BOUNDARY_RING_TOP + (layoutSessionLinks.get(RAIL_KEYS.end)?.extra ?? 0)}
              shift={endShift}
              prevShift={layoutShiftOf(layoutSessionLinks.get(RAIL_KEYS.end)?.prevKey ?? RAIL_KEYS.end)}
              testID="composition-rail-link-end"
            />
          ) : endRailLink !== null ? (
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
      </Animated.ScrollView>
      </StickyScrollContext.Provider>

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
        {/* PRE-9 B.2 (ARB-06, ARB-19 ; Figma `10819:20344`, `10836:20478`) : en mode enveloppe, la même barre
            porte « Confirmer le circuit / le cycle », disponible une fois un contenu désigné, et « Annuler ». */}
        {envelope !== null ? (
          <PlacementBar
            // PRE-9 B.4b : plusieurs périmètres désignés — « Confirmer les circuits / les cycles » (libellé choisi, à valider).
            confirmLabel={
              envelope.container === "CIRCUIT"
                ? envelope.spans.length > 1
                  ? composition.envelope.confirmCircuits
                  : composition.envelope.confirmCircuit
                : envelope.spans.length > 1
                  ? composition.envelope.confirmCycles
                  : composition.envelope.confirmCycle
            }
            isConfirmDisabled={envelope.spans.length === 0}
            onConfirm={confirmEnvelope}
            onCancel={cancelEnvelope}
            testID="composition-envelope-bar"
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
        {placement === null && envelope === null && !readOnly ? (
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

      {/* PRE-6 story 7.2 (D-442) : choix « Début de tour / Fin de tour » (dialogue natif). */}
      {pendingTourChoice !== null ? (
        <TourBoundaryChoiceDialog
          key={tourChoiceToken}
          // PRE-9 B.6 (ARB-02b) : Cycle répété — « Début de répétition / Fin de répétition ».
          scope={pendingTourChoice.kind === "LAYOUT" ? pendingTourChoice.scope : "CIRCUIT"}
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

      {isPendingExit && placement === null && envelope === null ? (
        <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}

      {/* PRE-6 (story 3.2, Figma `8328:34964`) : conversion Tours → Séries avec perte. Annuler (ou
          le retour système) : nature, compte et valeurs inchangés ; le voile ne confirme pas. */}
      {pendingNatureChange !== null ? (
        <CircuitEntryConfirmModal
          kind="NATURE"
          // PRE-9 B.1b : N du Circuit concerné (disposition générale) ou du Circuit unique.
          seriesCount={
            pendingNatureChange.circuitId === null
              ? tourRepeatCount
              : (layoutCircuitById.get(pendingNatureChange.circuitId)?.repeatCount ?? tourRepeatCount)
          }
          onCancel={cancelNatureChange}
          onConfirm={confirmNatureChange}
        />
      ) : null}

      {/* PRE-9 B.4 (COMP §6) : dépose (ou pas à pas) vers un Circuit alterné avec perte de séries. Annuler :
          emplacement et données d'origine conservés ; Confirmer : déplacement et adaptation ensemble,
          rejoués sur le brouillon courant. */}
      {pendingLayoutMove !== null ? (
        <CircuitEntryConfirmModal
          kind="MOVE"
          seriesCount={pendingLayoutMove.targetCount}
          exerciseCount={1}
          onCancel={() => {
            // Recette n° 2 du 31/10 (story 5.2b) : l'élément tenu revient à sa place en douceur.
            pendingLayoutMove.settle?.release();
            setPendingLayoutMove(null);
          }}
          onConfirm={() => {
            const outcome = pendingLayoutMove.run();
            setPendingLayoutMove(null);
            if (outcome.status === "APPLIED" || outcome.status === "CONFIRMATION_REQUIRED") {
              // Recette n° 2 (story 7.6) : l'élément tenu glisse jusqu'à sa place.
              pendingLayoutMove.settle?.applied();
              commitLayoutMove(outcome.draft, outcome.removedContainers);
              // PRE-9 B.6 (D-442) : Points retirés sans message, annonce discrète.
              reportRemovedStopPoints(outcome.removedStopPointIds);
            } else {
              pendingLayoutMove.settle?.release();
              if (outcome.status === "REFUSED") announceLayoutRefusal(outcome.reason);
            }
          }}
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
       * locale, route de l'ancien éditeur ; `Une activité existante` ouvre la
       * sélection multiple des anciennes définitions ; `Annuler` ferme sans
       * écriture) [routes remplacées le 29/10/2026 par PRE-9 A.2, ARB-22a :
       * création d'un Mouvement, sélection des Mouvements du Catalogue]. Seuls format/dimensions/ordre/scrim/z-order sont
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
        /*
         * PRE-9 B.2 (COMP §5) : menu Créer au rendu de Figma `10705:20223` (`CreateMenu`) — cinq
         * actions puis Annuler, dans l'ordre observé. « Utiliser une séance existante » relève de
         * B.8 : visible, indisponible d'ici là. « Ajouter un circuit / un cycle » ouvre le mode
         * enveloppe ; sans contenu éligible (Séance vide…), l'action est indisponible, non masquée.
         * La sixième entrée, « Format » (ARB-23), sera branchée par C.4.
         * [Remplacé le 01/11/2026 — ordre de Hermann « Menu Créer et transformation du bouton », règle
         * écrite ch13 CE-T03-08 « Menu Créer — état cible » : exactement quatre options — « Créer un
         * exercice » (icône silhouette, ex-« Utiliser un mouvement existant »), « Utiliser une séance
         * existante », « Ajouter un circuit », « Ajouter un cycle » ; plus d'entrée « Utiliser un
         * mouvement existant » (la recherche des Mouvements reste dans la saisie du nom de « Créer un
         * exercice ») ni de rangée « Annuler » : le « + » devient Annuler. Pas d'entrée Format
         * (MENU-FMT-01, À CLARIFIER).]
         * [Remplacé en partie le 01/11/2026 — recette iPhone (m11-menu), Hermann : « il faut intégrer de
         * nouveau l'option du menu « utiliser un mouvement existant » » ; position « 2e, après Créer » ;
         * icône « Haltère (ancienne) » : cinq options — Créer un exercice, Utiliser un mouvement
         * existant (sélection des Mouvements du Catalogue, action d'avant le 01/11), Utiliser une séance
         * existante, Ajouter un circuit, Ajouter un cycle. Annuler reste le « + » transformé.]
         */
        <CreateMenu
          top={addActivityTreeTop}
          // Contre-recette du 30/10 : un seul « + », reposé exactement sur celui de la zone de contexte.
          plusAnchorRef={addActionRef}
          options={[
            {
              key: "new",
              label: addToSession.newActivity,
              icon: "exercise",
              onPress: () => {
                setIsAddActivityTreeOpen(false);
                // PRE-9 A.2 (ARB-22a, D-449) : création d'un Mouvement (CE-MVT-01) en contexte Séance,
                // puis Exercice posé « Paramètres à compléter » (`useMovementExerciseIntake`) ; plus l'ancien éditeur.
                router.push({ pathname: "/movement", params: { context: MOVEMENT_SESSION_CONTEXT } });
              },
              testID: "composition-add-activity-tree-new",
            },
            {
              key: "existing",
              label: addToSession.existingActivity,
              icon: "movement",
              onPress: () => {
                setIsAddActivityTreeOpen(false);
                // PRE-9 A.2 (ARB-22a, Q6) : sélection des Mouvements actifs par le Catalogue des
                // Mouvements ; plus la sélection des anciennes définitions (`activity_definitions`).
                // Contre-recette du 30/10 : Mouvements déjà dans la Séance marqués « Dans la séance ».
                // Recette du 01/11/2026 (m11-menu) : entrée rétablie (retirée le même jour).
                markMovementsInSession(
                  draft.exercises.flatMap((exercise) => (exercise.sourceMovementId !== undefined ? [exercise.sourceMovementId] : [])),
                );
                router.push("/movement-selection");
              },
              testID: "composition-add-activity-tree-existing",
            },
            { key: "session", label: addToSession.existingSession, icon: "session", testID: "composition-add-activity-tree-existing-session" },
            {
              key: "circuit",
              label: addToSession.addCircuit,
              icon: "circuit",
              onPress: circuitEnvelopeCandidates.length > 0 ? () => enterEnvelope("CIRCUIT") : undefined,
              testID: "composition-add-activity-tree-circuit",
            },
            {
              key: "cycle",
              label: addToSession.addCycle,
              icon: "cycle",
              onPress: cycleEnvelopeCandidates.length > 0 ? () => enterEnvelope("CYCLE") : undefined,
              testID: "composition-add-activity-tree-cycle",
            },
          ]}
          onCancel={() => setIsAddActivityTreeOpen(false)}
          cancelLabel={addToSession.cancel}
          cancelTestID="composition-add-activity-tree-cancel"
        />
      ) : null}

      {/* PRE-9 A.2 (ARB-22a) : paramètres des Exercices créés depuis des Mouvements. */}
      {movementExerciseSheet}

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
  /** Recette iPhone n° 2 du 31/10/2026 (constat c) : photo d'une carte d'Exercice (fiche de l'Exercice). */
  readonly onOpenMovement: (activityId: string) => void;
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
  /** PRE-9 B.2 : mode enveloppe — cartes éligibles désignables, tout le reste inactif ; `null` hors mode. */
  readonly envelope?: EnvelopeContext | null;
  /** Recette du 29/10 (obs-3 b) : dévoilement / repli animé des cartes du Circuit (`useCircuitCardsReveal`). */
  readonly reveal?: CircuitCardsReveal;
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
 * Story 7.2 (D-442) : l'emplacement de tête de Circuit est dessiné (un ajout comme un autre).
 * [« une récupération existante […] suffit à l'ouvrir » — retiré le 01/11/2026 (ordre de Hermann,
 * point 2) : le placement ne porte que les Points d'arrêt.]
 */
function placementOfferOf(slots: readonly PlacementSlot[]): {
  readonly any: boolean;
  readonly additions: boolean;
} {
  const additions = slots.some((slot) => slot.stopPoint !== null && !slot.stopPoint.existing);
  const removals = slots.some((slot) => slot.stopPoint?.existing === true && slot.stopPoint.stopPointId !== undefined);
  return { any: additions || removals, additions };
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
 * PRE-9 B.2 (ARB-06, COMP §5 ; Figma `10819:20344`, `10836:20478`) — cadre d'un contenu en mode
 * enveloppe : le contenu lui-même est inactif et masqué à l'accessibilité (comme en placement) ;
 * éligible, il porte une cible qui le désigne — contour pointillé ; désigné, contour plein et fond
 * lavande. Bouton accessible « Envelopper {nom} dans le circuit / le cycle », état sélectionné.
 * Hors mode (`envelope` nul), le contenu est rendu tel quel.
 */
function EnvelopeFrame({
  envelope,
  target,
  name,
  testID,
  outset = 0,
  radius = dimensions.standardCard.radius,
  gap = SEQUENCE_GAP,
  children,
}: {
  envelope: EnvelopeContext | null;
  /** Recette n° 2 du 31/10 : aussi un Point d'arrêt (jamais désignable seul ; cadre s'il est dans un périmètre). */
  target: EnvelopeUnit;
  /** Nom du contenu (carte d'Exercice, « le circuit [A] »), pour le nom accessible et les annonces. */
  name: string;
  testID: string;
  /**
   * Contre-recette iPhone du 30/10 (Hermann : « le cadre avec liseré bleu n'entoure pas correctement
   * le circuit, les bords gauche et droit ne suivent pas le cadre du circuit ») : le cadre du Circuit
   * déborde de sa boîte de mise en page par des marges négatives (`CIRCUIT_OUTSET`, 16 de chaque
   * côté ; dans un Cycle, `LAYOUT_CIRCUIT_IN_CYCLE_OUTSET`) ; la cible, posée sur la boîte, restait 16
   * en retrait de chaque bord. `outset` la fait déborder d'autant ; `radius` reprend l'arrondi du
   * contenu (Circuit : 18).
   */
  outset?: number;
  radius?: number;
  /**
   * PRE-9 B.4b : écart jusqu'au contenu frère suivant (niveau Séance : `SEQUENCE_GAP` ; dans un Cycle :
   * `LAYOUT_CYCLE_GAP`) — le cadre d'un périmètre de plusieurs contenus le franchit (moitié de chaque
   * côté) pour former un seul cadre continu.
   */
  gap?: number;
  children: React.ReactNode;
}) {
  if (envelope === null) {
    return <>{children}</>;
  }
  const isStopPoint = target.kind === "STOP_POINT";
  const isCandidate = !isStopPoint && envelope.isCandidate(target);
  // Recette n° 2 du 31/10 : un Point d'arrêt n'est jamais désignable seul, mais il appartient au
  // périmètre qui le contient (entre deux contenus ou au bord) : il en porte le cadre.
  const placement = isCandidate || isStopPoint ? envelope.placementOf(target) : null;
  const isDesignated = placement !== null;
  const t = strings.screens.composition.envelope;
  const label = (
    target.kind === "CIRCUIT"
      ? t.circuitInCycleAccessibilityLabel
      : envelope.container === "CIRCUIT"
        ? t.exerciseInCircuitAccessibilityLabel
        : t.exerciseInCycleAccessibilityLabel
  ).replace("{name}", name);
  // B.4b : un périmètre qui contient un Circuit prend sa largeur et son arrondi pour tous ses contenus.
  const frameOutset = placement?.wide ? Math.max(outset, CIRCUIT_OUTSET) : outset;
  const frameRadius = placement?.wide ? CIRCUIT_RADIUS : radius;
  const joinsAbove = placement !== null && !placement.first;
  const joinsBelow = placement !== null && !placement.last;
  const count = placement === null ? 0 : placement.span.members.length;
  const value = count === 1 ? t.perimeterOne : t.perimeterMany.replace("{count}", String(count));
  const frameStyle = [
    styles.envelopeTarget,
    frameOutset === 0 ? { borderRadius: frameRadius } : { left: -frameOutset, right: -frameOutset, borderRadius: frameRadius },
    isDesignated ? styles.envelopeTargetDesignated : styles.envelopeTargetCandidate,
    // B.4b : périmètre de plusieurs unités — un seul cadre, continu à travers les écarts.
    joinsAbove ? { top: -gap / 2, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 } : null,
    joinsBelow ? { bottom: -gap / 2, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : null,
  ];
  /**
   * Contre-recette n° 4 du 01/11/2026 (b4b-etendre, Hermann : « ce n'est pas seulement le trait qui doit
   * se déplacer mais le bord du cadre avec le trait ») : pendant le glisser d'un trait de ce périmètre
   * (unités mesurées), la part du cadre de cette unité suit le trait (`EnvelopeMovingSegment`) à la
   * place de son aplat ; au relâchement, le périmètre se cale comme avant.
   */
  const edgeDrag = envelope.edgeDrag;
  const dragRect = placement === null || edgeDrag === null || edgeDrag.span !== placement.span ? undefined : edgeDrag.rects.get(envelopeTargetKey(target));
  let moving: React.ReactNode = null;
  if (placement !== null && edgeDrag !== null && dragRect !== undefined) {
    const segmentTop = joinsAbove ? -gap / 2 : 0;
    const segmentBottom = joinsBelow ? gap / 2 : 0;
    const edgeY = edgeDrag.edge === "BOTTOM" ? edgeDrag.bottom : edgeDrag.top;
    const minimum = 2 * frameRadius;
    moving = (
      <View
        pointerEvents="none"
        style={[
          styles.envelopeMovingFrame,
          { top: segmentTop, bottom: -segmentBottom },
          frameOutset === 0 ? null : { left: -frameOutset, right: -frameOutset },
        ]}
        testID={`${testID}-moving`}
      >
        <EnvelopeMovingSegment
          edge={edgeDrag.edge}
          translation={edgeDrag.translation}
          height={dragRect.bottom - dragRect.top - segmentTop + segmentBottom}
          radius={frameRadius}
          first={placement.first}
          last={placement.last}
          edgeOffset={edgeY - (dragRect.top + segmentTop)}
          limit={edgeDrag.edge === "BOTTOM" ? edgeDrag.top + minimum - edgeDrag.bottom : edgeDrag.bottom - minimum - edgeDrag.top}
          fill={ENVELOPE_DESIGNATED_FILL}
          borderColor={colors.primary}
          borderWidth={ENVELOPE_FRAME_BORDER_WIDTH}
          testID={`${testID}-moving-segment`}
        />
      </View>
    );
  }
  const shownFrameStyle = moving === null ? frameStyle : [...frameStyle, styles.envelopeTargetMoving];
  const handle = (edge: EnvelopeEdge) =>
    placement === null ? null : (
      <EnvelopeHandle
        edge={edge}
        label={
          envelope.container === "CIRCUIT"
            ? edge === "TOP"
              ? t.circuitTopEdge
              : t.circuitBottomEdge
            : edge === "TOP"
              ? t.cycleTopEdge
              : t.cycleBottomEdge
        }
        value={value}
        extendLabel={edge === "TOP" ? t.extendUp : t.extendDown}
        reduceLabel={edge === "TOP" ? t.reduceFromTop : t.reduceFromBottom}
        onStep={(direction) => envelope.onStepEdge(placement.span, edge, direction)}
        onDragStart={(translation) => envelope.onEdgeDragStart(placement.span, edge, translation)}
        onDragEnd={envelope.onEdgeDragEnd}
        autoScroll={envelope.autoScroll}
        testID={`${testID}-handle-${edge === "TOP" ? "top" : "bottom"}`}
      />
    );
  return (
    <View
      ref={(view) => envelope.registerFrame(envelopeTargetKey(target), view)}
      // B.4b : le contenu qui porte le trait bas passe au-dessus de ses frères suivants (zone tactile).
      style={placement?.last === true && placement.adjustable ? styles.envelopeFrameRaised : null}
      testID={testID}
    >
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {/* PRE-9 B.2 : un Point d'arrêt hors périmètre reste inactif et atténué. */}
        {isStopPoint && placement === null ? <PlacementAttenuation active>{children}</PlacementAttenuation> : children}
      </View>
      {isCandidate && !isStopPoint ? (
        <Pressable
          onPress={() => envelope.onDesignate(target, name)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: isDesignated }}
          style={shownFrameStyle}
          testID={`${testID}-target`}
        />
      ) : isStopPoint && placement !== null ? (
        <View pointerEvents="none" style={shownFrameStyle} testID={`${testID}-frame`} />
      ) : null}
      {moving}
      {placement?.adjustable === true && placement.first ? handle("TOP") : null}
      {placement?.adjustable === true && placement.last ? handle("BOTTOM") : null}
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
  onOpenMovement,
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
  envelope = null,
  reveal,
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
    <Reanimated.View
      style={[
        styles.exerciseList,
        // PRE-6 (story 5.2, D-435) : écart 9 entre les cartes du Circuit, 8 au dehors.
        zone === "IN_TOUR" ? styles.exerciseListInCircuit : null,
        // Correctif 2.3b (retour Hermann 21/10/2026) : la zone qui porte la carte soulevée passe
        // au-dessus de ses sœurs (Circuit, autres zones, bornes) ; sinon, hors de sa zone, la carte
        // glisse sous leur fond opaque (blanc ou couleur du Circuit).
        // Story 5.2b : aussi pendant le dialogue de perte et le retour animé de la carte.
        items.some((item) => zoneItemKey(item) === raisedKey) ? styles.dragElevated : null,
        reveal?.style,
      ]}
      onLayout={(event) => {
        onLayout(zone, event);
        reveal?.onLayout(event);
      }}
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
          const stopPointRow = (
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
          // PRE-9 B.2 : en mode enveloppe, un Point d'arrêt n'est jamais éligible — inactif. Recette iPhone
          // n° 2 du 31/10 (b4b-saisie, b6-enveloppe) : il porte sa part du cadre du périmètre qui le contient.
          return envelope === null ? (
            stopPointRow
          ) : (
            <EnvelopeFrame
              key={key}
              envelope={envelope}
              target={{ kind: "STOP_POINT", id: item.point.id }}
              name=""
              gap={zone === "IN_TOUR" ? CIRCUIT_GAP : SEQUENCE_GAP}
              testID={`composition-envelope-stop-point-${item.point.id}`}
            >
              {stopPointRow}
            </EnvelopeFrame>
          );
        }
        const activity = item.occurrence;
        const key = railRowKey(activity.id);
        const row = (
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
          // Recette iPhone n° 2 du 31/10/2026 (constat c) : la photo d'une carte d'Exercice ouvre sa fiche.
          onOpenMovement={activity.type === "EXERCISE" ? () => onOpenMovement(activity.id) : null}
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
        // PRE-9 B.2 (ARB-06) : en mode enveloppe, la carte est désignable si elle est éligible, inactive sinon.
        return envelope === null ? (
          row
        ) : (
          <EnvelopeFrame
            key={activity.id}
            envelope={envelope}
            target={{ kind: "EXERCISE", id: activity.id }}
            name={occurrenceCardName(activity, levelPositions)}
            testID={`composition-envelope-exercise-${activity.id}`}
          >
            {row}
          </EnvelopeFrame>
        );
      })}
    </Reanimated.View>
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
  /**
   * Contre-recette n° 4 du 01/11/2026 (cr5-reposer, Hermann : « Cela arrive systématiquement aussi si
   * je déplace un point d'arrêt ») — translation de la puce soulevée, valeur animée native dès sa
   * création (comme `dragY` d'une carte) : au lâcher, elle revient à 0 dans la même tâche que la pose
   * de la rangée par le registre (`layoutSettleFor`, `handleDropItem`) — même lot du pilote natif, la
   * puce ne passe par aucune image à sa place. [Auparavant, translation rendue (état) : la puce revenait
   * à sa place au rendu du lâcher, avant la pose de départ de la rangée par le registre.] Rendue native au
   * lâcher (`releaseChipY`), comme `dragY` d'une carte.
   */
  const [chipY] = useState(() => new Animated.Value(0));
  const releaseChipY = useCallback(() => {
    makeAnimatedValueNative(chipY);
    chipY.setValue(0);
  }, [chipY]);
  const chipDragY = isDragged ? dragTranslationY : 0;
  useLayoutEffect(() => {
    chipY.setValue(chipDragY);
  }, [chipDragY, chipY]);
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
      // Contre-recette n° 4 : voir `chipY`.
      releaseChipY();
      onDragEnd(translationYRef.current);
    },
    [onDragEnd, releaseChipY],
  );
  const handleResponderTerminate = useCallback(() => {
    setDragTranslationY(0);
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    releaseChipY();
    onDragCancel(translationYRef.current);
  }, [onDragCancel, releaseChipY]);
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
      ) : rail.skippedKeys.has(railKey) ? (
        // Recette iPhone n° 2 du 31/10/2026 (b6-ancien, b6-glisser ; Hermann : « le cercle plein sur le
        // rail ne se déplace pas en même temps, il apparaît lorsque le point est déposé ») : hors de la
        // chaîne, le point de raccord reste sur l'axe du rail et suit la puce — le doigt pendant le
        // glisser, puis la rangée (registre) pendant le dialogue et le retour. [Revue 6.2 : « aucun
        // rail — ni segment ni point de raccord » hors de la chaîne — remplacé pour le point de raccord.]
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: chipY }] }]}
          testID={`composition-rail-dot-stop-${point.id}-lifted`}
        >
          <RailDot
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            centerY={STOP_POINT_LINE_HEIGHT / 2}
            testID={`composition-rail-dot-stop-${point.id}`}
          />
        </Animated.View>
      ) : null}
      <StopPointLine
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={composition.pauses.stopPointReorderAccessibilityHint}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={(name) => actionHandlers[name as StopPointAccessibilityActionName]?.()}
        onLongPress={handleLongPress}
        translateY={chipY}
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
  /**
   * PRE-9 B.1b : carte d'une disposition générale (`LayoutSequence`) — écart au-dessus d'elle dans sa
   * liste, que son rail traverse. Défini : seul l'appui court (modification) est actif ; glisser,
   * balayage (Dupliquer / Supprimer) et leurs actions accessibles relèvent de B.4 et B.5 ; rail
   * simplifié porté par la carte (lien à travers l'écart au-dessus, queue sous le média). [Glisser :
   * B.4 ; balayage et « Dupliquer » / « Supprimer » : B.5 (`layoutSwipeable`).]
   */
  /**
   * PRE-9, recette iPhone n° 2 du 31/10/2026 (constat c, Hermann : « l'appui sur la carte n'ouvre plus la
   * fiche d'exercice mais ouvre la modale des paramètres d'exécution […] ; l'appui sur la photo ouvre la
   * fiche du mouvement ») : toucher de la photo (gabarit média) — ouvre l'Exercice / le Mouvement.
   * `null` ou absent : la photo fait partie de la carte (son appui est celui de la carte).
   */
  readonly onOpenMovement?: (() => void) | null;
  readonly layoutRailGap?: number;
  /**
   * PRE-9 B.4 (COMP §6, G1–G5) : dans une disposition générale, appui long puis glisser actifs
   * (`onDragStart` / `onDragMove` / `onDragEnd`), ainsi que « Monter » / « Descendre »
   * (`onMoveUp` / `onMoveDown`). [B.4 : « le balayage (Dupliquer / Supprimer) reste réservé à B.5 »
   * — remplacé par B.5 le 31/10/2026 : voir `layoutSwipeable`.]
   */
  readonly layoutDraggable?: boolean;
  /**
   * PRE-9 B.5 (D-441, D-442) : dans une disposition générale, balayage gauche (Dupliquer / Supprimer)
   * et ses actions accessibles « Dupliquer » / « Supprimer » actifs.
   */
  readonly layoutSwipeable?: boolean;
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
  onOpenMovement = null,
  layoutRailGap,
  layoutDraggable = false,
  layoutSwipeable = false,
}: CompositionActivityRowProps) {
  /** PRE-9 B.1b : carte d'une disposition générale — voir `layoutRailGap`. */
  const inLayout = layoutRailGap !== undefined;
  /** PRE-9 B.4 : glisser actif (ancien modèle, ou disposition générale). B.5 : balayage de même. */
  const canSwipe = !inLayout || layoutSwipeable;
  const canDrag = !inLayout || layoutDraggable || canSwipe;
  const composition = strings.screens.composition;
  // Recette iPhone n° 2 du 31/10/2026 (constat c) : carte d'Exercice — l'appui ouvre les paramètres.
  const editHint = onOpenMovement !== null ? composition.exerciseRow.editParametersAccessibilityLabel : composition.exerciseRow.editAccessibilityLabel;
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
  /**
   * Contre-recette n° 3 du 31/10/2026 (cr4-replie, Hermann : « Si je repose la carte à son emplacement
   * initial elle disparaît et l'emplacement reste vide. Un appui long sur une autre carte par exemple la
   * fait réapparaître. Ce problème n'est pas systématique. ») — cause probable (non reproductible sous
   * Jest) : au lâcher, le rendu qui retire l'état soulevé change la TAILLE de la carte
   * (`activityBlockDragged`, marges négatives) et porte encore, dans ses propriétés, la valeur JS de
   * `dragY` (translation du doigt) : `dragY` n'était remis à 0 qu'après ce rendu (effet ci-dessus). Sous
   * Fabric iOS, une vue dont la translation est gérée par le pilote natif et dont la taille change
   * recalcule sa translation à partir de ces propriétés gardées (story 7.5, `resyncNative`) : selon
   * l'ordre, non garanti, entre ce montage et la pose native de 0, la carte restait décalée de la
   * translation du doigt — grande quand un Circuit déployé au-dessus d'elle pendant le geste l'avait fait
   * descendre (compensation `layoutSourceDrift`) —, cachée sous l'élément suivant une fois son premier
   * plan rendu. Le relâcher pose désormais 0 AVANT le rendu (pilote natif et valeur JS), puis la pose
   * native est renvoyée une tâche après ce rendu.
   *
   * [Contre-recette n° 4 du 01/11/2026 (cr5-reposer, Hermann : « lorsqu'on lâche la carte elle disparait
   * et réapparait immédiatement, très vite avant de se placer. Cela arrive systématiquement aussi si je
   * déplace un point d'arrêt. ») — la pose à 0 ci-dessus, faite seule, ramenait la carte à sa place
   * dans la mise en page jusqu'à ce que le registre reprenne la translation (pose de départ appliquée
   * dans l'effet du rendu du lâcher, une ou plusieurs images plus tard) : image à un autre endroit à
   * CHAQUE lâcher. Complété :] dans la même tâche, l'écran pose aussitôt la translation du registre de
   * la carte à la position affichée (`layoutSettleFor`, `handleDropItem`) ; `dragY` est rendu natif au
   * lâcher, avant sa remise à 0 : les deux poses partent dans le même lot du pilote natif — la somme affichée ne change
   * pas ; le rendu du lâcher porte 0 (carte) et la position affichée (registre), cohérents avec le
   * pilote natif (le correctif de la contre-recette n° 3 reste en place).
   */
  const releaseDragY = useCallback(() => {
    // Contre-recette n° 4 : valeur rendue native au lâcher (idempotent) — sa remise à 0 part dans le même
    // lot du pilote natif que la pose de la rangée par le registre, faite dans cette même tâche. (Pas dès
    // la création : elle partage sa transformation avec `swipeX`, animée par ailleurs.)
    makeAnimatedValueNative(dragY);
    dragY.setValue(0);
  }, [dragY]);
  const wasDraggedRef = useRef(isDragged);
  useEffect(() => {
    const was = wasDraggedRef.current;
    wasDraggedRef.current = isDragged;
    if (!was || isDragged) return undefined;
    const resync = setTimeout(() => dragY.setValue(0), 0);
    return () => clearTimeout(resync);
  }, [dragY, isDragged]);
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
      if (!canSwipe || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return false;
      }
      applySwipeMovement(dx);
      return true;
    },
    [applySwipeMovement, canSwipe, trackMovement],
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
      if (!canSwipe || isDraggingRef.current || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      applySwipeMovement(dx);
    },
    [applySwipeMovement, canSwipe, trackMovement],
  );

  const handleResponderMove = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current) {
        applyDragTranslation(dy + autoScroll.track(event.nativeEvent.pageY));
        return;
      }
      if (canSwipe && Math.abs(dx) > Math.abs(dy)) {
        applySwipeMovement(dx);
      }
    },
    [applyDragTranslation, applySwipeMovement, autoScroll, canSwipe, trackMovement],
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
      // Contre-recette n° 3 du 31/10/2026 (cr4-replie, « Si je repose la carte à son emplacement initial
      // elle disparaît ») : voir `releaseDragY`.
      releaseDragY();
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
  }, [areActionsRevealed, onDragEnd, onHideActions, onRevealActions, releaseDragY, settleSwipe, swipeTranslateX]);

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
      // Contre-recette n° 3 : voir `releaseDragY`.
      releaseDragY();
      onDragCancel(translationYRef.current);
    }
  }, [onDragCancel, releaseDragY]);

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
  // PRE-9, recette iPhone n° 2 du 31/10/2026 (constat e) : « Paramètre à vérifier » → carte orange
  // (« Paramètres à compléter » prime : la synthèse ne vaut jamais les deux).
  const isToVerify = isToVerifySummary(summary);
  /**
   * Hauteur de la CARTE seule : 80 (carte v2, PRE-6 story 5.1, D-435), récupération comprise
   * (ligne 3). La rangée du point d'arrêt, rendue SOUS la carte hors placement, n'entre pas ici.
   */
  const blockHeight = blockHeightFor(isDragged);
  /**
   * PRE-6 (story 5.1) : récupération affichée en ligne 3. PRE-9 (01/11/2026, ordre de Hermann,
   * point 2) : exactement la Récupération de l'Exercice (même champ que Paramètres d'exécution),
   * en placement comme hors placement [la durée sélectionnée en placement, story 7.2, est retirée].
   */
  const displayedRecoverySeconds = activity.postActivityRecoverySeconds;
  /**
   * Bord affiché : hors Circuit, et dans le Circuit à l'état soulevé (`activityBlockDragged`) ou
   * incomplète (recette du 29/10 : liseré rouge, `occurrenceCardIncompleteSurface`).
   */
  const isCardBordered = activity.structuralPosition !== "IN_TOUR" || isDragged || isIncomplete || isToVerify;
  /**
   * PRE-6 (story 5.3, D-435) : emplacement de l'occurrence en placement (Domaine, `placementSlots`)
   * — zone de récupération en ligne 3 ; point d'arrêt dans la rangée sous la carte.
   */
  const placementSlot = placement === null ? null : placement.slotFor(activity.id);
  const placementStopPoint = placementSlot?.stopPoint ?? null;
  /**
   * Ligne 3 de la carte. PRE-6 story 7.2 (D-442) : en placement, toute zone de récupération d'un
   * Exercice est le cadre sélectionnable (`PlacementRecoveryFrame` : sélectionnée — ajout, ou
   * récupération existante, 0 comprise, conservée — ou non) ; hors placement, la récupération est un
   * simple affichage (`OccurrenceRecovery`) : le toucher et l'appui long reviennent à la carte.
   */
  const recoveryNode: React.ReactNode = (
    <OccurrenceRecovery
      recoverySeconds={displayedRecoverySeconds}
      hiddenFromAccessibility={placement !== null}
      testID={`composition-activity-recovery-${activity.id}-recovery`}
    />
  );
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
  // PRE-9 B.4 : « Monter » / « Descendre » sur les positions de l'arbre (`stepLayoutItem`). [B.1b : « dans
  // une disposition générale, ni duplication ni suppression (B.5) » — remplacé par B.5 le 31/10/2026.]
  // B.5 : « Dupliquer » / « Supprimer » (`duplicateLayoutExercise`, `removeLayoutExercise`).
  const accessibilityActionHandlers: Partial<Record<OccurrenceAccessibilityActionName, () => void>> = inLayout
    ? {
        ...(layoutDraggable && onMoveUp !== null ? { moveUp: onMoveUp } : {}),
        ...(layoutDraggable && onMoveDown !== null ? { moveDown: onMoveDown } : {}),
        ...(layoutSwipeable ? { duplicate: onDuplicate, delete: onDelete } : {}),
      }
    : {
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
          // Contre-recette iPhone du 30/10 (constat c, Hermann : « Une carte d'exercice se trouvant
          // directement dans un cycle : […] le fond du cadre a un fond blanc rectangulaire (coins
          // carrés) ») : dans une disposition générale, la rangée est transparente, la carte seule
          // (coins arrondis) repose sur le fond du Cycle. PRE-9 B.5 : le balayage y découvre donc le
          // fond de son conteneur (Séance, Cycle ou Circuit), comme le fond du Tour dans l'ancien modèle.
          backgroundColor: isRaised || inLayout
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
      // PRE-9 B.1b : ni glisser ni balayage dans une disposition générale (B.4, B.5). B.4 : glisser
      // actif (`layoutDraggable`). B.5 : balayage actif (`layoutSwipeable`, `canSwipe`).
      {...(placement === null && canDrag
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
        onLongPress={canDrag ? handleLongPress : undefined}
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
        // Intention d'édition (appui court) puis gestes de réorganisation et d'actions. Recette iPhone
        // n° 2 du 31/10/2026 (constat c) : l'appui court d'une carte d'Exercice ouvre les paramètres
        // d'exécution (« Modifier les paramètres ») ; sa photo est un bouton distinct (« Ouvrir le mouvement »).
        accessibilityHint={
          inLayout && !layoutDraggable
            ? editHint
            : `${editHint}. ${composition.activityActions.reorderAccessibilityHint}`
        }
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
          isToVerify && !isDragged ? occurrenceCardToVerifySurface : null,
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
       * PRE-9, recette iPhone n° 2 du 31/10/2026 (constat c, Hermann : « l'appui sur la photo ouvre la
       * fiche du mouvement ») : la photo (gabarit média) est un bouton distinct, posé sur elle et qui
       * suit la carte (balayage, glisser) ; frère de la carte — et non son enfant — pour rester un
       * élément VoiceOver propre (un élément accessible masque ses descendants). L'appui long y saisit
       * la carte comme ailleurs ; actions révélées : appui neutre, comme la carte. Hors placement.
       */}
      {onOpenMovement !== null && placement === null ? (
        <Animated.View
          pointerEvents={fadeLeaving ? "none" : "box-none"}
          style={[styles.activityMediaButtonTrack, { transform: cardTransform }]}
          testID={`composition-exercise-media-track-${activity.id}`}
        >
          <Pressable
            onPress={() => {
              if (!areActionsRevealed) onOpenMovement();
            }}
            onLongPress={canDrag ? handleLongPress : undefined}
            delayLongPress={LONG_PRESS_DELAY_MS}
            accessibilityRole="button"
            accessibilityLabel={composition.exerciseRow.openMovementAccessibilityLabel}
            style={styles.activityMediaButton}
            testID={`composition-exercise-media-button-${activity.id}`}
          />
        </Animated.View>
      ) : null}

      {/*
       * PRE-6 (story 5.2, D-435) : rail de l'occurrence, peint APRÈS la carte (il passe sur ses
       * marges, jusqu'aux bords du média, sans le traverser) et AVANT la rangée sous la carte. Story
       * 5.3 : il traverse les rangées d'emplacement (22, point posé 24) sur l'axe des médias, à
       * gauche des puces centrées, sans point de raccord (Figma `8328:29270`). Il ne suit ni le
       * balayage ni la carte soulevée : le
       * rail ne glisse pas ; il suit les décalages du bloc (translation du conteneur).
       */}
      {/* PRE-9 B.1b : rail simplifié d'une carte de disposition générale (voir `LayoutSequence`). */}
      {/* Recette iPhone n° 2 du 31/10 : saisie, tenue ou en retour — hors de la chaîne (story 5.2b) ;
          au niveau Séance, le lien s'étire jusqu'à l'élément qui la précède (aperçu du glisser). */}
      {layoutRailGap !== undefined ? (
        rail.skippedKeys.has(railKey) ? null : (
        <>
          {railLink !== undefined ? (
            <RailLink
              centerX={OCCURRENCE_CARD_MEDIA.centerX}
              entryY={OCCURRENCE_CARD_MEDIA.top}
              length={railLink.length}
              shift={dragShiftValue}
              prevShift={rail.shiftOf(railLink.prevKey)}
              testID={`composition-rail-link-${activity.id}`}
            />
          ) : (
            <RailSegment
              centerX={OCCURRENCE_CARD_MEDIA.centerX}
              top={-layoutRailGap}
              height={layoutRailGap + OCCURRENCE_CARD_MEDIA.top}
              testID={`composition-rail-link-${activity.id}`}
            />
          )}
          <RailSegment
            centerX={OCCURRENCE_CARD_MEDIA.centerX}
            top={OCCURRENCE_CARD_MEDIA.bottom}
            bottom={0}
            testID={`composition-rail-tail-${activity.id}`}
          />
        </>
        )
      ) : railLink !== undefined ? (
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
 * PRE-9 B.4 (ARB-24) : contrôle avant dépose appelé par chaque déplacement de la disposition générale
 * (accepté / accepté après confirmation / refusé sans mutation). Neutre en B.4 : les refus de la
 * matrice §2.2 et l'adaptation au N d'un Circuit alterné sont déjà appliqués par le Domaine (B.3) ;
 * C.4 branche ici les règles des éléments formatés.
 */
const LAYOUT_DROP_CONTROL: LayoutDropControl = neutralDropControl;

/**
 * PRE-9 B.4 : conteneurs retirés par un déplacement, à leur place dans la disposition d'avant (parent,
 * élément suivant encore présent), vidés — rendus le temps de leur effacement. Un Circuit d'un Cycle
 * lui-même retiré n'est pas rendu séparément. PRE-9 B.5 : `keepMembers` (suppression du dernier
 * membre) — rendus tels qu'avant, avec la carte supprimée, qui s'efface avec eux.
 */
function vanishingContainers(before: ResolvedLayout, removed: readonly LayoutItemRef[], keepMembers = false): VanishingContainer[] {
  const gone = new Set(removed.map((item) => `${item.kind === "CIRCUIT" ? "circuit" : "cycle"}:${item.id}`));
  const result: VanishingContainer[] = [];
  const visit = (siblings: readonly (ResolvedLayoutElement | StructureCycleMember<SessionDraftExercise>)[], parentCycleId: string | null) => {
    siblings.forEach((element, at) => {
      const key = layoutElementKey(element);
      if (!gone.has(key)) {
        if (element.kind === "CYCLE") visit(element.cycle.members, element.cycle.id);
        return;
      }
      const beforeKey = siblings.slice(at + 1).map(layoutElementKey).find((next) => !gone.has(next)) ?? null;
      if (element.kind === "CIRCUIT") {
        result.push({ key, parentCycleId, beforeKey, element: { kind: "CIRCUIT", circuit: keepMembers ? element.circuit : { ...element.circuit, exercises: [] } } });
      } else if (element.kind === "CYCLE") {
        result.push({ key, parentCycleId, beforeKey, element: { kind: "CYCLE", cycle: keepMembers ? element.cycle : { ...element.cycle, members: [] } } });
      }
    });
  };
  visit(before.elements, null);
  return result;
}

/**
 * PRE-9 B.4 (COMP §6 G1–G8, ARB-06, ARB-09) : glisser-déposer d'une disposition générale, fourni par
 * l'écran ; `null` : inactif (mode enveloppe, consultation, dialogue en attente).
 */
type LayoutDragContext = {
  /** Élément saisi, `null` hors glisser. */
  readonly source: LayoutItemRef | null;
  /*
   * [B.4 : « `target` : destination courante (conteneur éclairé, repère d'insertion) » — retiré par la
   * recette iPhone n° 2 du 31/10/2026 : plus d'éclairage ; la destination est montrée par les
   * translations de l'aperçu (`layoutDragShifts.ts`).]
   */
  /** Boîte mesurée d'un élément ou d'un en-tête (repère du contenu défilant) ; `null` : oubliée. */
  readonly reportBox: (key: string, box: LayoutBox | null) => void;
  /**
   * Contre-recette n° 5 du 01/11/2026 : départ du déploiement d'un Circuit (`growth` : croissance
   * prévue de sa hauteur), dans la tâche même de ce départ — voir `startLayoutExpansion`.
   */
  readonly onCircuitReveal: (circuitId: string, growth: number) => void;
  /** Appui long sur une carte ou un en-tête ; `false` : refusé (autre élément saisi, mesure absente). */
  readonly onStart: (source: LayoutItemRef) => boolean;
  /** PRE-9 B.6 : Point d'arrêt saisi (`null` : aucun) et son appui long ; même mouvement, même dépose. */
  readonly stopPointId: string | null;
  readonly onStartStopPoint: (stopPointId: string) => boolean;
  /** PRE-9 B.6 : « Monter » / « Descendre » d'un Point (`stepLayoutStopPoint`), `null` si aucun déplacement accepté. */
  readonly stopPointStepAction: (stopPointId: string, direction: "UP" | "DOWN") => (() => void) | null;
  readonly onMove: (translationY: number) => void;
  readonly onEnd: (translationY: number) => void;
  /** Geste interrompu ; `translationY` : position atteinte, d'où l'élément revient (story 5.2b). */
  readonly onCancel: (translationY?: number) => void;
  /** « Monter » / « Descendre » d'un élément (`stepLayoutItem`), `null` à la frontière de la séquence. */
  readonly stepAction: (source: LayoutItemRef, direction: "UP" | "DOWN") => (() => void) | null;
};

/**
 * Recette iPhone n° 2 du 31/10/2026 — élément saisi d'une disposition générale : en glisser
 * (`DRAGGING`, aperçu `shifts`), tenu pendant un dialogue (`HELD`, à `heldTranslationY`), ou en retour
 * / mise en place jusqu'à sa place (`SETTLING`). `sourceKey` : translation du registre qui le porte
 * après le lâcher (rangée de la carte ou du Point, bloc du Circuit ou du Cycle).
 */
type LayoutLift = {
  readonly source: LayoutItemRef;
  readonly stopPointId: string | null;
  readonly phase: "DRAGGING" | "HELD" | "SETTLING";
  readonly shifts: LayoutDragShifts | null;
  readonly heldTranslationY: number | null;
  readonly sourceBoxKey: string;
  readonly sourceKey: string;
  readonly height: number;
};

/** Geste en cours (référence) : point de saisie, destination courante, aperçu calculé. */
type LayoutDragGesture = {
  readonly source: LayoutItemRef;
  readonly handleY: number;
  target: LayoutDropTarget | null;
  readonly stopPointId?: string;
  readonly lifted: LayoutLiftedSource;
  shifts: LayoutDragShifts | null;
  /** Recette n° 2 du 31/10 (arrêt sur un Circuit replié) : haut de l'élément saisi au début du geste. */
  readonly sourceTop: number;
  /** Translation du registre qui porte l'élément saisi (`liftedShiftKey`). */
  readonly liftedKey: string;
  /** Dernière translation du doigt (`null` : aucun déplacement encore). */
  lastTranslationY: number | null;
  /** Circuit replié sur lequel l'élément est arrêté (délai en cours), `null` : aucun. */
  hoverCircuitId: string | null;
  /** Un Circuit replié a été déployé par un arrêt pendant ce geste. */
  expandedOnHover: boolean;
  /**
   * Contre-recette n° 3 du 31/10/2026 : Circuit en cours de déploiement (`CIRCUIT_REVEAL_DURATION_MS`)
   * après un arrêt — la destination reste sa fin jusqu'à la fin du déploiement ; `null` : aucun.
   */
  expandingCircuitId: string | null;
  /**
   * Contre-recette n° 5 du 01/11/2026 : aperçu figé du déploiement en cours (`startLayoutExpansion`) —
   * place ouverte à la fin du Circuit et compensation de l'élément saisi, lancées avec le déploiement ;
   * `null` : aucun déploiement lancé.
   */
  expansion: LayoutDragShifts | null;
};

/**
 * Recette iPhone n° 2 du 31/10/2026 (arrêt sur un Circuit replié) : déplacement, dans la mise en page,
 * de l'élément saisi depuis le début du geste (un Circuit déployé au-dessus de lui le fait descendre) ;
 * 0 si sa boîte n'est pas mesurée.
 */
function layoutSourceDrift(current: LayoutDragGesture, boxes: ReadonlyMap<string, LayoutBox>): number {
  const box = boxes.get(current.lifted.boxKey);
  return box === undefined ? 0 : box.top - current.sourceTop;
}

/** Suite visuelle d'une dépose (voir `layoutSettleFor`). */
type LayoutSettle = { readonly applied: () => void; readonly hold: () => void; readonly release: () => void };

/** Ce que les blocs lisent de l'élément saisi, tenu ou en retour. */
type LayoutLiftView = {
  readonly source: LayoutItemRef;
  readonly stopPointId: string | null;
  /** En glisser (suit le doigt) ; sinon tenu ou en retour (porté par le registre). */
  readonly dragging: boolean;
  readonly sourceKey: string;
};

const NO_LAYOUT_PIECES: readonly LayoutShiftPiece[] = [];
const NO_SESSION_LINKS: ReadonlyMap<string, LayoutRailLink> = new Map();
/** Recette n° 2 : translation nulle et fixe d'une copie en effacement (hors du registre). */
const GHOST_SHIFT = new Animated.Value(0);
const ghostShiftOf = (): Animated.Value => GHOST_SHIFT;
const GHOST_RAIL: SequenceRailContext = { links: new Map(), shiftOf: ghostShiftOf, skippedKeys: new Set() };

/** Recette n° 2 : liens des cartes du niveau Séance (longueur de conception plus la place franchie). */
function cardRailLinks(sessionLinks: ReadonlyMap<string, LayoutRailLink>): ReadonlyMap<string, RailLinkGeometry> {
  return new Map(
    [...sessionLinks].map(([key, link]) => [key, { prevKey: link.prevKey, length: SEQUENCE_GAP + OCCURRENCE_CARD_MEDIA.top + link.extra }]),
  );
}

function skippedKeysOf(key: string | null): ReadonlySet<string> {
  return key === null ? NO_SKIPPED_KEYS : new Set([key]);
}

/** L'élément saisi (tenu, en retour) est-il ce Circuit ou ce Cycle entier ? */
function liftHoldsBlock(lift: LayoutLiftView | null, kind: "CIRCUIT" | "CYCLE", id: string): boolean {
  return lift !== null && lift.stopPointId === null && lift.source.kind === kind && lift.source.id === id;
}

/**
 * PRE-9 B.4 (précision de Hermann du 30/10/2026, ch07 « Retrait d'un Circuit ») : conteneur vidé par
 * une dépose, rendu à sa place d'avant (avant l'élément `beforeKey` de son parent, ou en fin) le
 * temps de son effacement progressif (`VanishingBlock`), puis retiré.
 */
type VanishingContainer = {
  readonly key: string;
  /** Cycle parent, `null` au niveau de la Séance. */
  readonly parentCycleId: string | null;
  readonly beforeKey: string | null;
  /** Conteneur vidé (Circuit sans cartes, Cycle sans membres). */
  readonly element: ResolvedLayoutElement;
};

/** Clé de rendu d'un élément de la disposition (niveau Séance ou membre de Cycle). */
function layoutElementKey(element: ResolvedLayoutElement | StructureCycleMember<SessionDraftExercise>): string {
  switch (element.kind) {
    case "EXERCISE":
      return `exercise:${element.exercise.id}`;
    case "CIRCUIT":
      return `circuit:${element.circuit.id}`;
    case "CYCLE":
      return `cycle:${element.cycle.id}`;
    default: {
      const unreachable: never = element;
      return unreachable;
    }
  }
}

/** L'élément saisi est-il cet élément ou l'un de ses membres (rangée à placer au premier plan) ? */
function layoutElementHolds(element: ResolvedLayoutElement | StructureCycleMember<SessionDraftExercise>, source: LayoutItemRef | null): boolean {
  if (source === null) return false;
  const inCircuit = (circuit: StructureCircuit<SessionDraftExercise>) =>
    (source.kind === "CIRCUIT" && circuit.id === source.id) || (source.kind === "EXERCISE" && circuit.exercises.some((exercise) => exercise.id === source.id));
  switch (element.kind) {
    case "EXERCISE":
      return source.kind === "EXERCISE" && element.exercise.id === source.id;
    case "CIRCUIT":
      return inCircuit(element.circuit);
    case "CYCLE":
      return (source.kind === "CYCLE" && element.cycle.id === source.id) || element.cycle.members.some((member) => layoutElementHolds(member, source));
    default: {
      const unreachable: never = element;
      return unreachable;
    }
  }
}

/**
 * PRE-9 B.4 : mesure d'une vue (position dans son parent) rapportée dans le repère du contenu
 * défilant (`frameY` : ordonnée du parent) ; oubliée au démontage.
 */
function useReportedBox(
  key: string,
  frameY: number | null,
  report: ((key: string, box: LayoutBox | null) => void) | undefined,
  urgent: boolean,
) {
  const [local, onLayout] = useMeasuredFrame(urgent);
  useEffect(() => {
    if (report === undefined || local === null || frameY === null) return undefined;
    report(key, { top: frameY + local.y, height: local.height });
    return () => report(key, null);
  }, [frameY, key, local, report]);
  return onLayout;
}

/**
 * Incident iPhone du 01/11/2026 (Hermann : « J'ai ouvert une séance, replié une carte et ai eu cette
 * erreur. » — « Maximum update depth exceeded », `onLayout` du Cycle ; non systématique). Sous Fabric,
 * un événement `layout` est distribué en priorité discrète : l'état qu'il pose est rendu et validé
 * aussitôt (voie synchrone). Pendant un repli ou un déploiement de Circuit (`useCircuitCardsReveal`,
 * `CollapsedNamesLine`, fil UI), chaque validation React reprend la hauteur animée la plus récente :
 * quand un rendu dure plus d'une image (Cycle entier rendu à chaque mesure), chaque validation produit
 * une nouvelle mesure, donc une nouvelle mise à jour synchrone imbriquée — au-delà de 50, React lève
 * l'erreur. Les mesures des blocs de la disposition générale sont donc :
 * - ignorées si elles ne changent pas de plus de `LAYOUT_MEASURE_TOLERANCE` (arrondis, sous-pixels) ;
 * - au repos (aucun élément saisi, tenu ou en retour), appliquées en transition (`startTransition`) :
 *   jamais sur la voie synchrone, elles ne s'imbriquent pas et ne retiennent pas l'animation ; elles ne
 *   servent alors qu'à la géométrie du prochain glisser (boîtes, rail), lue après leur application ;
 * - pendant le glisser (`urgent`), appliquées aussitôt, comme avant (aperçu sous le doigt).
 */
const LAYOUT_MEASURE_TOLERANCE = 0.5;

type MeasuredFrame = { readonly y: number; readonly height: number };

function sameMeasure(a: number, b: number): boolean {
  return Math.abs(a - b) < LAYOUT_MEASURE_TOLERANCE;
}

/** Applique une mise à jour de mesure : aussitôt pendant le glisser, en transition au repos. */
function useMeasureUpdate(urgent: boolean): (update: () => void) => void {
  const urgentRef = useRef(urgent);
  useLayoutEffect(() => {
    urgentRef.current = urgent;
  });
  return useCallback((update: () => void) => {
    if (urgentRef.current) update();
    else startTransition(update);
  }, []);
}

/** Position et hauteur d'une vue dans son parent (`onLayout`), voir `LAYOUT_MEASURE_TOLERANCE`. */
function useMeasuredFrame(urgent: boolean): readonly [MeasuredFrame | null, (event: LayoutChangeEvent) => void] {
  const [frame, setFrame] = useState<MeasuredFrame | null>(null);
  const apply = useMeasureUpdate(urgent);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      apply(() =>
        setFrame((current) => (current !== null && sameMeasure(current.y, y) && sameMeasure(current.height, height) ? current : { y, height })),
      );
    },
    [apply],
  );
  return [frame, onLayout] as const;
}

/** Une seule valeur mesurée (`onLayout`), voir `LAYOUT_MEASURE_TOLERANCE`. */
function useMeasuredValue<T extends number | null>(initial: T, urgent: boolean): readonly [number | T, (value: number) => void] {
  const [value, setValue] = useState<number | T>(initial);
  const apply = useMeasureUpdate(urgent);
  const set = useCallback(
    (next: number) => apply(() => setValue((current) => (current !== null && sameMeasure(current, next) ? current : next))),
    [apply],
  );
  return [value, set] as const;
}

/** PRE-9 B.1b : ce que chaque bloc d'une disposition générale reçoit de l'écran. */
type LayoutRenderContext = {
  readonly letters: ReadonlyMap<string, string>;
  readonly openOverlay: OverlayKind | null;
  readonly onToggleOverlay: (kind: OverlayKind) => void;
  readonly onCircuitCount: (circuitId: string, count: number) => void;
  readonly onCycleCount: (cycleId: string, count: number) => void;
  readonly onSelectNature: (circuitId: string, nature: CircuitNature) => void;
  readonly onDismissNature: (circuitId: string) => void;
  readonly natureFocusRequests: Readonly<Record<string, number>>;
  /** Toucher hors du contrôle ouvert (RC-4) : le referme. */
  readonly onOutsidePress: () => void;
  /** Dialogue de perte en attente : un maintien de − / + s'arrête. */
  readonly isChoicePending: boolean;
  /** Circuits repliés : identifiant → contenu au moment du repli (ARB-12). */
  readonly collapsed: ReadonlyMap<string, string>;
  readonly onToggleCollapsed: (circuit: StructureCircuit<SessionDraftExercise>) => void;
  readonly bodyZonesReferential: readonly BodyZone[];
  readonly categoriesReferential: readonly Category[];
  readonly levelPositions: ReadonlyMap<string, MovementLevelPosition>;
  readonly onEdit: (activityId: string) => void;
  /** Recette iPhone n° 2 du 31/10/2026 (constat c) : photo d'une carte d'Exercice (fiche de l'Exercice). */
  readonly onOpenMovement: (activityId: string) => void;
  readonly railShiftOf: (key: string) => Animated.Value;
  readonly autoScroll: DragAutoScroll;
  /** PRE-9 B.2 : mode enveloppe (contenus éligibles désignables, le reste inactif) ; `null` hors mode. */
  readonly envelope: EnvelopeContext | null;
  /** Contre-recette du 30/10 : Cycles qui viennent d'être posés (« Confirmer le cycle »), apparition progressive. */
  readonly appearingCycleIds: ReadonlySet<string>;
  /** Contre-recette du 30/10 (constat b) : Circuits qui viennent d'être posés (« Confirmer le circuit »), apparition progressive. */
  readonly appearingCircuitIds: ReadonlySet<string>;
  /** PRE-9 B.4 : glisser-déposer ; `null` : inactif. */
  readonly drag: LayoutDragContext | null;
  /** PRE-9 B.4 : conteneurs vidés par une dépose, en cours d'effacement. */
  readonly vanishing: readonly VanishingContainer[];
  readonly onVanished: (key: string) => void;
  /** PRE-9 B.5 : actions glissées des cartes (Dupliquer / Supprimer) ; `null` : inactives. */
  readonly actions: LayoutActionsContext | null;
  /** PRE-9 B.6 : Points d'arrêt et placement de la disposition générale. */
  readonly stops: LayoutStopsContext;
  /** PRE-9 B.5 : carte en mouvement (supprimée, ou copie qui apparaît) ; `null` : aucune. */
  readonly cardMotion: { readonly id: string; readonly mode: Exclude<CardMotionMode, "IDLE"> } | null;
  readonly onCardMotionDone: (id: string, mode: Exclude<CardMotionMode, "IDLE">) => void;
  /** Recette n° 2 du 31/10 : élément saisi, tenu ou en retour ; `null` : aucun. */
  readonly lift: LayoutLiftView | null;
  /** Recette n° 2 : liens du rail au niveau Séance (prédécesseur, longueur ajoutée), par clé de translation. */
  readonly sessionLinks: ReadonlyMap<string, LayoutRailLink>;
  /** Recette n° 2 : rail des cartes (liens du niveau Séance, carte hors de la chaîne). */
  readonly sessionRail: SequenceRailContext;
};

// ---------------------------------------------------------------------------
// PRE-9 B.6 — Points d'arrêt et placement d'une disposition générale (D-441, D-442, ARB-02, ARB-06)
// ---------------------------------------------------------------------------

/** Repère d'Exercice fictif d'un Point d'arrêt saisi : aucun élément ne le porte (voir `layoutLift`). */
const STOP_POINT_DRAG_SOURCE: LayoutItemRef = { kind: "EXERCISE", id: "\u0000point-d-arret" };

/** Clé de focus d'une rangée de Point (celle de l'ancien modèle). */
function layoutStopFocusKey(stopPointId: string): string {
  return railStopKey(stopPointId);
}

const NO_LAYOUT_PLACEMENT_SLOTS: readonly LayoutPlacementSlot[] = [];
const NO_STOP_ROWS: readonly never[] = [];

/** Rangée autonome d'un emplacement : Point existant (hors placement) ou emplacement du placement. */
type LayoutStopRow =
  | { readonly kind: "POINT"; readonly id: string; readonly accessibilityLabel: string }
  | { readonly kind: "PLACEMENT"; readonly key: string; readonly point: PlacementStopPointRowPoint };

/** Ce que les blocs d'une disposition générale reçoivent pour les Points d'arrêt (B.6). */
type LayoutStopsContext = {
  /** En placement : emplacement sous chaque carte ; `null` hors placement. */
  readonly placement: PlacementRowContext | null;
  /** Rangées autonomes à rendre à l'emplacement `position` du conteneur. */
  readonly rowsAt: (container: StopPointContainer, position: number) => readonly LayoutStopRow[];
  readonly focusRequest: ItemFocusRequest | null;
  readonly onFocusConsumed: (token: number) => void;
};

/** Conteneur en effacement : aucun Point, aucun emplacement (rendu inerte). */
const NO_LAYOUT_STOPS: LayoutStopsContext = { placement: null, rowsAt: () => NO_STOP_ROWS, focusRequest: null, onFocusConsumed: () => {} };

/** Offre du placement d'une disposition générale, dans la forme lue par `placementOfferOf`. */
function layoutOfferSlots(draft: SessionDraft, placement: PlacementDraft): readonly PlacementSlot[] {
  const points = layoutPlacementSlots(draft, placement).flatMap((slot): PlacementSlot[] =>
    slot.stopPoint === null ? [] : [{ kind: "OCCURRENCE", occurrenceId: null, stopPoint: slot.stopPoint }],
  );
  return points;
}

/** Noms accessibles du placement d'une disposition générale : Points existants, emplacements à ajouter. */
type LayoutPlacementLabels = {
  readonly existing: (stopPointId: string) => string;
  readonly available: (rank: number) => string;
};

/**
 * Noms par la règle de la story 6.2 (dernier Exercice qui précède dans le conteneur), étendue aux
 * Cycles : « … au début du circuit / du cycle », « … après le circuit / le cycle », « … au début de la
 * séance ». Formulations des Cycles à valider.
 */
function layoutPlacementLabels(
  draft: SessionDraft,
  slots: readonly LayoutPlacementSlot[],
  levelPositions: ReadonlyMap<string, MovementLevelPosition>,
): LayoutPlacementLabels {
  const t = strings.screens.composition.placement;
  const byId = new Map(draft.exercises.map((exercise) => [exercise.id, exercise]));
  const elements = draft.structure?.elements ?? [];
  const previousKind = (slot: LayoutPlacementSlot): "EXERCISE" | "CIRCUIT" | "CYCLE" | null => {
    if (slot.position === 0) return null;
    const { container } = slot;
    if (container.kind === "CIRCUIT") return "EXERCISE";
    if (container.kind === "SESSION") return elements[slot.position - 1]?.kind ?? null;
    const cycle = elements.find((element) => element.kind === "CYCLE" && element.cycle.id === container.id);
    return cycle?.kind === "CYCLE" ? (cycle.cycle.members[slot.position - 1]?.kind ?? null) : null;
  };
  const labelOf = (slot: LayoutPlacementSlot, existing: boolean): string => {
    const exercise = slot.afterExerciseId === null ? undefined : byId.get(slot.afterExerciseId);
    if (exercise !== undefined) {
      const name = occurrenceCardName(exercise, levelPositions);
      return (existing ? t.existingStopPointAccessibilityLabel : t.addStopPointAccessibilityLabel).replace("{exercise}", () => name);
    }
    if (slot.position === 0) {
      if (slot.container.kind === "CIRCUIT") return existing ? t.stopPointAtCircuitStartAccessibilityLabel : t.addStopPointAtCircuitStartAccessibilityLabel;
      if (slot.container.kind === "CYCLE") return existing ? t.stopPointAtCycleStartAccessibilityLabel : t.addStopPointAtCycleStartAccessibilityLabel;
      return t.stopPointAtSessionStartAccessibilityLabel;
    }
    return previousKind(slot) === "CYCLE"
      ? existing
        ? t.existingStopPointAfterCycleAccessibilityLabel
        : t.addStopPointAfterCycleAccessibilityLabel
      : existing
        ? t.existingStopPointAfterCircuitAccessibilityLabel
        : t.addStopPointAfterCircuitAccessibilityLabel;
  };
  const existingById = new Map(slots.flatMap((slot) => (slot.stopPoint?.stopPointId === undefined ? [] : [[slot.stopPoint.stopPointId, labelOf(slot, true)] as const])));
  const availableByRank = new Map(slots.map((slot) => [slot.rank, labelOf(slot, false)] as const));
  return {
    existing: (stopPointId) => existingById.get(stopPointId) ?? t.stopPoint,
    available: (rank) => availableByRank.get(rank) ?? t.stopPoint,
  };
}

/**
 * PRE-9 B.6 : resélection en placement du Point existant `stopPointId`, refusée parce qu'elle créerait
 * un conflit de répétition avec un AJOUT — le choix requis ; `null` sinon.
 */
function layoutReselectionChoice(
  placement: PlacementDraft,
  stopPointId: string,
  draft: SessionDraft,
): Extract<LayoutPlacementStopPointOutcome, { status: "CHOICE_REQUIRED" }> | null {
  if (!isPlacementStopPointRemoved(placement, stopPointId)) return null;
  const slot = layoutPlacementSlots(draft, placement).find((item) => item.stopPoint?.stopPointId === stopPointId);
  if (slot === undefined) return null;
  const outcome = toggleLayoutPlacementStopPointOutcome(placement, slot.designation, draft);
  return outcome.status === "CHOICE_REQUIRED" ? outcome : null;
}

/** Point rendu pour un emplacement du placement d'une disposition générale (voir `placementRowPointOf`). */
function layoutRowPointOf(
  slot: LayoutPlacementSlot,
  placement: PlacementDraft,
  draft: SessionDraft,
  labels: LayoutPlacementLabels,
): PlacementStopPointRowPoint | null {
  const stopPoint = slot.stopPoint;
  if (stopPoint === null) return null;
  if (!stopPoint.existing) return { kind: "AVAILABLE", location: slot.designation, accessibilityLabel: labels.available(slot.rank) };
  const id = stopPoint.stopPointId;
  if (id === undefined) return null;
  const blocked =
    isPlacementStopPointRemoved(placement, id) &&
    toggleLayoutPlacementStopPointRemoval(placement, id, draft) === placement &&
    layoutReselectionChoice(placement, id, draft) === null;
  return { kind: "EXISTING", stopPointId: id, accessibilityLabel: labels.existing(id), blocked };
}

/** Clé de test d'un conteneur d'emplacement. */
function stopContainerTestKey(container: StopPointContainer): string {
  return container.kind === "SESSION" ? "session" : `${container.kind.toLowerCase()}-${container.id}`;
}

/**
 * PRE-9 B.6 (D-441, CE-T03-08 ; ARB-02a) : rangées autonomes de l'emplacement `position` du conteneur —
 * hors placement, ses Points d'arrêt (`StopPointRow` de l'ancien modèle : puce centrée, rail, appui long
 * pour saisir, « Monter » / « Descendre ») ; en placement, l'emplacement de tête ou d'après un
 * conteneur. `gap` : écart de la liste qui les contient (lien du rail au-dessus de la rangée).
 */
function LayoutStopRows({
  container,
  position,
  gap,
  frameY,
  context,
}: {
  container: StopPointContainer;
  position: number;
  gap: number;
  /** Ordonnée de la liste qui les contient dans le contenu défilant ; `null` inconnue. */
  frameY: number | null;
  context: LayoutRenderContext;
}) {
  const rows = context.stops.rowsAt(container, position);
  if (rows.length === 0) return null;
  // Recette iPhone n° 2 du 31/10 (b6-glisser, « deux rails […] décalé à droite du premier ») : hors
  // Circuit, la rangée déborde de la colonne comme les cartes (`exerciseList`) — son rail et son point
  // de raccord, posés sur l'axe des médias des cartes, rejoignent le rail unique.
  const outset = container.kind !== "CIRCUIT";
  return (
    <>
      {rows.map((row) =>
        row.kind === "POINT" ? (
          <LayoutStopPointRow key={row.id} row={row} gap={gap} frameY={frameY} outset={outset} context={context} />
        ) : context.stops.placement === null ? null : (
          <View key={row.key} style={outset ? styles.layoutStopRowOutset : null}>
            <LayoutPlacementStopRow
              row={row}
              gap={gap}
              placement={context.stops.placement}
              context={context}
              testID={`composition-layout-placement-${stopContainerTestKey(container)}-${position}`}
            />
          </View>
        ),
      )}
    </>
  );
}

/**
 * Rail d'une rangée de Point : lien à travers l'écart qui la précède, queue sur sa hauteur. Recette
 * n° 2 du 31/10 : au niveau Séance (`sessionLink`), le lien s'étire jusqu'au bas de l'élément qui la
 * précède pendant l'aperçu ; dans un conteneur, il suit la rangée (la queue du conteneur, qui suit ses
 * bords, porte le rail derrière) ; saisi, tenu ou en retour : hors de la chaîne.
 */
function useStopRowRail(key: string, gap: number, context: LayoutRenderContext, sessionLink?: LayoutRailLink): SequenceRailContext {
  const { railShiftOf, lift } = context;
  const prevKey = sessionLink?.prevKey ?? key;
  const length = gap + (sessionLink?.extra ?? 0);
  const skipped = lift !== null && lift.sourceKey === key;
  return useMemo(
    () => ({ links: new Map([[key, { prevKey, length }]]), shiftOf: railShiftOf, skippedKeys: skipped ? new Set([key]) : NO_SKIPPED_KEYS }),
    [key, length, prevKey, railShiftOf, skipped],
  );
}

function LayoutStopPointRow({
  row,
  gap,
  frameY,
  outset,
  context,
}: {
  row: Extract<LayoutStopRow, { kind: "POINT" }>;
  gap: number;
  frameY: number | null;
  outset: boolean;
  context: LayoutRenderContext;
}) {
  const { drag, stops, lift } = context;
  const id = row.id;
  const railKey = railStopKey(id);
  const rail = useStopRowRail(railKey, gap, context, context.sessionLinks.get(railKey));
  // Recette n° 2 : mesure de la rangée dans sa liste (l'enveloppe ci-dessous en est l'élément ; la
  // rangée intérieure serait toujours à 0).
  const onLayout = useReportedBox(layoutStopBoxKey(id), frameY, drag?.reportBox, lift !== null);
  const point = useMemo<StopPoint>(() => ({ id, scope: "BEFORE_TOUR", position: 0 }), [id]);
  const isDragged = drag?.stopPointId === id;
  // Recette n° 2 : tenu pendant un dialogue ou en retour — au premier plan.
  const isRaised = isDragged || (lift !== null && lift.stopPointId === id);
  const focusKey = layoutStopFocusKey(id);
  const node = (
    <StopPointRow
      point={point}
      accessibilityLabel={row.accessibilityLabel}
      isDragged={isDragged}
      isRaised={isRaised}
      rail={rail}
      autoScroll={context.autoScroll}
      fadeOpacity={null}
      fadeLeaving={false}
      onLayout={noop}
      focusRequest={stops.focusRequest !== null && stops.focusRequest.key === focusKey ? stops.focusRequest : null}
      onFocusConsumed={stops.onFocusConsumed}
      onDragStart={() => drag?.onStartStopPoint(id) ?? false}
      onDragCancel={(translationY) => drag?.onCancel(translationY)}
      onDragMove={(translationY) => drag?.onMove(translationY)}
      onDragEnd={(translationY) => drag?.onEnd(translationY)}
      onMoveUp={drag?.stopPointStepAction(id, "UP") ?? null}
      onMoveDown={drag?.stopPointStepAction(id, "DOWN") ?? null}
    />
  );
  // En mode enveloppe, un Point d'arrêt n'est jamais éligible : inactif (comme dans l'ancien modèle).
  return (
    <View
      style={[outset ? styles.layoutStopRowOutset : null, isRaised ? styles.dragElevated : null]}
      onLayout={onLayout}
      testID={`composition-layout-stop-point-${id}`}
    >
      {/* Recette iPhone n° 2 du 31/10 (b4b-saisie, b6-enveloppe) : en mode enveloppe, le Point porte sa
          part du cadre du périmètre qui le contient (bords gauche et droit, trait de bord) ; hors
          périmètre, inactif et atténué (B.2). */}
      <EnvelopeFrame
        envelope={context.envelope}
        target={{ kind: "STOP_POINT", id }}
        name=""
        gap={gap}
        testID={`composition-envelope-stop-point-${id}`}
      >
        {node}
      </EnvelopeFrame>
    </View>
  );
}

function LayoutPlacementStopRow({
  row,
  gap,
  placement,
  context,
  testID,
}: {
  row: Extract<LayoutStopRow, { kind: "PLACEMENT" }>;
  gap: number;
  placement: PlacementRowContext;
  context: LayoutRenderContext;
  testID: string;
}) {
  const railKey = `placement:${row.key}`;
  const rail = useStopRowRail(railKey, gap, context);
  return (
    <PlacementStopPointItemRow
      railKey={railKey}
      point={row.point}
      placement={placement}
      rail={rail}
      touchExtent={{ top: gap / 2, bottom: gap / 2 }}
      onLayout={noop}
      testID={testID}
    />
  );
}

/** PRE-9 B.5 : actions glissées des cartes d'une disposition générale (D-441, D-442 ; ARB-08 : Exercice seulement). */
type LayoutActionsContext = {
  /** Carte dont les actions sont révélées (une seule à la fois), `null` : aucune. */
  readonly revealedId: string | null;
  readonly onReveal: (exerciseId: string | null) => void;
  readonly onDuplicate: (exerciseId: string) => void;
  readonly onDelete: (exerciseId: string) => void;
};

type LayoutSequenceProps = LayoutRenderContext & {
  readonly layout: ResolvedLayout;
  /** Marge droite du contenu défilant : ancrage du panneau du choix de nature (Android / web). */
  readonly panelRight: number;
};

const NO_SKIPPED_KEYS: ReadonlySet<string> = new Set();
const NO_APPEARING_CYCLES: ReadonlySet<string> = new Set();
/** Identifiants des Cycles d'une disposition générale (niveau Séance) ; aucun sans disposition. */
function layoutCycleIds(layout: ResolvedLayout | null): string[] {
  return layout === null ? [] : layout.elements.flatMap((element) => (element.kind === "CYCLE" ? [element.cycle.id] : []));
}
const NO_APPEARING_CONTAINERS: ReadonlySet<string> = new Set();
/**
 * Contre-recette du 30/10 (constat b) : Exercices placés dans un Circuit — de la structure générale
 * (Circuits des Cycles compris), ou à défaut de l'ancien modèle (zone `IN_TOUR`).
 */
function draftCircuitMembers(draft: Pick<SessionDraft, "structure" | "exercises">): string[] {
  return draft.structure !== undefined
    ? structureCircuits(draft.structure).flatMap((circuit) => circuit.exercises)
    : draft.exercises.flatMap((exercise) => (exercise.structuralPosition === "IN_TOUR" ? [exercise.id] : []));
}
const noop = () => {};

/**
 * PRE-9 B.4 : conteneurs en effacement à rendre avant l'élément `key` d'un parent (`null` : en fin
 * de parent, ou dont l'élément de repère n'y est plus).
 */
function vanishingAt(
  vanishing: readonly VanishingContainer[],
  parentCycleId: string | null,
  key: string | null,
  keys: readonly string[],
): readonly VanishingContainer[] {
  return vanishing.filter(
    (item) => item.parentCycleId === parentCycleId && (key === null ? item.beforeKey === null || !keys.includes(item.beforeKey) : item.beforeKey === key),
  );
}

/**
 * PRE-9 B.1b (D-451, COMP §1 et §4, ARB-12, ARB-13, ARB-19 ; Figma `10725:20142`, `10744:20108`) —
 * rendu d'une disposition générale, élément par élément, entre les deux bornes (qui restent hors de
 * tout conteneur) : Exercices directs de la Séance, Circuits (en-tête B.1a avec sa lettre, repli),
 * Cycles (`CycleHeader`, jamais repliés) avec leurs Exercices directs et leurs Circuits.
 *
 * Hiérarchie par les fonds (COMP §4) : Cycle pleine largeur sur un aplat lavande plus soutenu,
 * Circuit sur l'aplat du Circuit (dans un Cycle, en retrait de 4 de chaque côté pour que le fond du
 * Cycle l'encadre), cartes de la largeur habituelle, sans indentation supplémentaire.
 *
 * Gestes : appui court d'une carte (modification). [B.1b : « glisser-déposer (B.4), Dupliquer /
 * Supprimer (B.5) et le placement des pauses (B.6) ne s'appliquent pas encore ici » — remplacé pour le
 * glisser par B.4.] PRE-9 B.4 (COMP §6 G1–G8, ARB-06, ARB-09) : appui long sur une carte, sur
 * l'en-tête d'un Circuit (déployé : replié d'abord) ou sur le titre d'un Cycle, puis glisser : la mise
 * en page reste figée, l'élément suit le doigt, la destination la plus proche est éclairée (conteneur
 * bordé, repère d'insertion), la liste défile près des bords (`useDragAutoScroll`) ; au relâchement,
 * `moveLayoutItem` (refus sans altération, confirmation de perte, conteneur vidé effacé
 * progressivement). « Monter » / « Descendre » accessibles (`stepLayoutItem`). [B.4 : « Dupliquer /
 * Supprimer (B.5) et les pauses (B.6) restent hors de ce rendu » — remplacé pour Dupliquer / Supprimer
 * par B.5.] PRE-9 B.5 : balayage gauche d'une carte (Dupliquer / Supprimer) et actions accessibles ;
 * carte supprimée effacée puis sa place refermée, copie qui apparaît (`CardMotionBlock`) ; dernier
 * membre supprimé : conteneur effacé lentement (`VanishingBlock`). Les pauses (B.6) restent hors de
 * ce rendu.
 *
 * Rail simplifié : chaque élément porte ses segments — lien à travers l'écart qui le précède, anneau
 * sur l'en-tête d'un conteneur, queue jusqu'à son bas ; un conteneur trace sa queue derrière ses
 * membres (visible dans leurs écarts), chaque carte trace le sien sur sa surface. [B.1b / B.4 : « Pas
 * de liens mesurés (`resolveRailLinks`) ni d'animation de glisser » ; « la mise en page reste figée
 * […] la destination la plus proche est éclairée (conteneur bordé, repère d'insertion) » — remplacé
 * par la recette iPhone n° 2 du 31/10/2026 (Hermann : « Je ne veux pas d'encadré bleu et de trait
 * d'insertion, mais le comportement tel qu'il a été défini initialement […] : déplacement des bords
 * des circuits / cycle et déplacement des cartes pour faire la place à la carte déplacée ») :]
 * pendant le glisser, les cartes, les Points d'arrêt et les bords des Circuits et des Cycles se
 * déplacent pour faire la place (`layoutDragShifts.ts`, registre partagé de l'ancien modèle, mêmes
 * durée et courbe) ; le fond d'un conteneur suit ses deux bords (`CircuitSurface`) et sa queue de rail
 * s'étire ; au niveau Séance, chaque lien s'étire jusqu'à l'élément qui le précède, l'élément saisi
 * sortant de la chaîne (story 5.2b) ; l'élément lâché revient ou glisse jusqu'à sa place (stories
 * 5.2b, 7.6). Aucun éclairage ni repère d'insertion.
 */
function LayoutSequence({ layout, panelRight, ...context }: LayoutSequenceProps) {
  // Android / web : bas de l'en-tête de chaque Circuit dans le contenu défilant (panneau de nature).
  const [anchors, setAnchors] = useState<Readonly<Record<string, number>>>({});
  const reportAnchor = useCallback((circuitId: string, y: number) => {
    setAnchors((current) => (current[circuitId] === y ? current : { ...current, [circuitId]: y }));
  }, []);
  // Recette n° 2 : liens étirables des cartes du niveau Séance ; carte saisie, tenue ou en retour hors de la chaîne.
  const { lift, sessionRail: rail } = context;
  const directExercises = layout.elements.flatMap((element) => (element.kind === "EXERCISE" ? [element.exercise] : []));
  const natureCircuitId = layoutNatureCircuitOf(context.openOverlay);
  const natureCircuit =
    natureCircuitId === null ? undefined : structureCircuits(layout).find((circuit) => circuit.id === natureCircuitId);
  const natureAnchor = natureCircuitId === null ? undefined : anchors[natureCircuitId];
  const keys = layout.elements.map(layoutElementKey);
  const ghosts = (key: string | null) =>
    vanishingAt(context.vanishing, null, key, keys).map((item) => (
      <LayoutVanishing key={`vanishing:${item.key}`} item={item} gap={COMPOSITION_ROW_GAP} rail={rail} context={context} onAnchor={reportAnchor} />
    ));
  // Élément saisi, tenu ou en retour : son bloc passe au premier plan.
  const source = lift?.source ?? null;
  const session: StopPointContainer = { kind: "SESSION" };
  return (
    <>
      {layout.elements.map((element, elementIndex) => {
        const key = layoutElementKey(element);
        const raised = layoutElementHolds(element, source);
        // PRE-9 B.6 : Points d'arrêt (ou emplacements du placement) avant l'élément, au niveau Séance.
        const stops = (
          <LayoutStopRows key={`stops:session:${elementIndex}`} container={session} position={elementIndex} gap={COMPOSITION_ROW_GAP} frameY={0} context={context} />
        );
        let node: React.ReactNode;
        switch (element.kind) {
          case "EXERCISE":
            node = (
              <LayoutDirectExercise
                key={key}
                exercise={element.exercise}
                position={{ index: directExercises.indexOf(element.exercise), count: directExercises.length }}
                frameY={0}
                railGap={SEQUENCE_GAP}
                listGap={COMPOSITION_ROW_GAP}
                raised={raised}
                rail={rail}
                context={context}
              />
            );
            break;
          case "CIRCUIT":
            node = (
              // PRE-9 B.2 : Circuit du niveau Séance — éligible pour un Cycle, en bloc.
              <EnvelopeFrame
                key={key}
                envelope={context.envelope}
                target={{ kind: "CIRCUIT", id: element.circuit.id }}
                name={layoutCircuitName(element.circuit.id, context.letters)}
                testID={`composition-envelope-circuit-${element.circuit.id}`}
                outset={CIRCUIT_OUTSET}
                radius={CIRCUIT_RADIUS}
              >
              <LayoutCircuitBlock
                key={key}
                circuit={element.circuit}
                inCycle={false}
                offsetY={0}
                railGap={SEQUENCE_GAP}
                raised={raised}
                rail={rail}
                context={context}
                onAnchor={reportAnchor}
              />
              </EnvelopeFrame>
            );
            break;
          case "CYCLE":
            node = (
              <LayoutCycleBlock
                key={key}
                cycle={element.cycle}
                raised={raised}
                rail={rail}
                context={context}
                onAnchor={reportAnchor}
              />
            );
            break;
          default: {
            const unreachable: never = element;
            return unreachable;
          }
        }
        const before = ghosts(key);
        return [stops, ...before, node];
      })}
      {ghosts(null)}
      <LayoutStopRows container={session} position={layout.elements.length} gap={COMPOSITION_ROW_GAP} frameY={0} context={context} />
      {/* [PRE-9 B.4 (COMP §6 : « L'éclairage de la destination est obligatoire ») : repère d'insertion —
          retiré par la recette iPhone n° 2 du 31/10/2026 ; la place qui s'ouvre montre la destination.] */}
      {/*
       * Android / web : panneau du choix de nature, dans une couche qui couvre tout le contenu
       * défilant (un toucher hors des limites d'un parent n'atteint pas ses enfants sur Android),
       * au-dessus des éléments suivants ; jamais rendu avant la mesure de l'en-tête.
       */}
      {natureCircuit !== undefined && natureAnchor !== undefined ? (
        <View pointerEvents="box-none" style={styles.layoutPanelLayer} testID="composition-layout-nature-panel-layer">
          <CircuitNaturePanel
            nature={natureCircuit.nature}
            placement={{ top: natureAnchor + CIRCUIT_NATURE_PANEL_GAP, right: panelRight }}
            onDismiss={() => context.onDismissNature(natureCircuit.id)}
            onSelect={(nature) => context.onSelectNature(natureCircuit.id, nature)}
            testID={`composition-layout-circuit-${natureCircuit.id}-header-counter-nature-panel`}
          />
        </View>
      ) : null}
    </>
  );
}

/** PRE-9 B.4 : conteneur vidé par une dépose, en effacement (`VanishingBlock`), inerte. */
function LayoutVanishing({
  item,
  gap,
  rail,
  context,
  onAnchor,
}: {
  item: VanishingContainer;
  gap: number;
  rail: SequenceRailContext;
  context: LayoutRenderContext;
  onAnchor: (circuitId: string, y: number) => void;
}) {
  const { onVanished } = context;
  const done = useCallback(() => onVanished(item.key), [item.key, onVanished]);
  // Recette n° 2 du 31/10 : copie inerte, hors du registre (translations nulles et fixes).
  const ghostContext = useMemo<LayoutRenderContext>(
    () => ({
      ...context,
      drag: null,
      vanishing: [],
      actions: null,
      cardMotion: null,
      stops: NO_LAYOUT_STOPS,
      railShiftOf: ghostShiftOf,
      lift: null,
      sessionLinks: NO_SESSION_LINKS,
      sessionRail: GHOST_RAIL,
    }),
    [context],
  );
  const ghostRail = GHOST_RAIL;
  const testID = `composition-layout-vanishing-${item.key.replace(":", "-")}`;
  return (
    <VanishingBlock gap={gap} onDone={done} testID={testID}>
      {item.element.kind === "CIRCUIT" ? (
        <LayoutCircuitBlock
          circuit={item.element.circuit}
          inCycle={item.parentCycleId !== null}
          offsetY={null}
          railGap={gap}
          raised={false}
          rail={ghostRail}
          context={ghostContext}
          onAnchor={onAnchor}
          ghost
        />
      ) : item.element.kind === "CYCLE" ? (
        <LayoutCycleBlock cycle={item.element.cycle} raised={false} rail={ghostRail} context={ghostContext} onAnchor={onAnchor} ghost />
      ) : null}
    </VanishingBlock>
  );
}

/**
 * PRE-9 B.5 : mouvement de la carte `exerciseId` (suppression, copie qui apparaît), `IDLE` au repos,
 * et son rappel de fin.
 */
function useLayoutCardMotion(exerciseId: string, context: LayoutRenderContext): { readonly mode: CardMotionMode; readonly onDone: () => void } {
  const motion = context.cardMotion !== null && context.cardMotion.id === exerciseId ? context.cardMotion.mode : null;
  const { onCardMotionDone } = context;
  const onDone = useCallback(() => {
    if (motion !== null) onCardMotionDone(exerciseId, motion);
  }, [exerciseId, motion, onCardMotionDone]);
  return { mode: motion ?? "IDLE", onDone };
}

/**
 * PRE-9 B.2 / B.4 : Exercice direct de la Séance ou d'un Cycle — enveloppe, mesure, carte. B.5 : la
 * vue de l'Exercice, élément de sa liste, porte le mouvement de la carte (`CardMotionBlock`,
 * `listGap` : écart de la liste qui la contient).
 */
function LayoutDirectExercise({
  exercise,
  position,
  frameY,
  railGap,
  listGap,
  raised,
  rail,
  context,
}: {
  exercise: SessionDraftExercise;
  position: { readonly index: number; readonly count: number };
  /** Ordonnée du parent (Cycle) dans le contenu défilant ; 0 au niveau de la Séance ; `null` inconnue. */
  frameY: number | null;
  railGap: number;
  listGap: number;
  raised: boolean;
  rail: SequenceRailContext;
  context: LayoutRenderContext;
}) {
  const onLayout = useReportedBox(layoutItemKey({ kind: "EXERCISE", id: exercise.id }), frameY, context.drag?.reportBox, context.lift !== null);
  const motion = useLayoutCardMotion(exercise.id, context);
  return (
    <CardMotionBlock
      mode={motion.mode}
      gap={listGap}
      onDone={motion.onDone}
      style={[styles.exerciseList, raised ? styles.dragElevated : null]}
      onLayout={onLayout}
      testID={`composition-layout-exercise-${exercise.id}`}
    >
      {/* PRE-9 B.2 : Exercice direct (Séance : éligible pour un Circuit ou un Cycle ; Cycle : pour un Circuit). */}
      <EnvelopeFrame
        envelope={context.envelope}
        target={{ kind: "EXERCISE", id: exercise.id }}
        name={occurrenceCardName(exercise, context.levelPositions)}
        testID={`composition-envelope-exercise-${exercise.id}`}
        gap={railGap}
      >
        <LayoutExerciseRow exercise={exercise} circuit={null} position={position} railGap={railGap} rail={rail} context={context} />
      </EnvelopeFrame>
    </CardMotionBlock>
  );
}

/**
 * PRE-9 B.5 : carte d'un Circuit, dans l'enveloppe de son mouvement (`CardMotionBlock`, élément de la
 * liste des cartes) ; la position de la carte dans la liste est celle de l'enveloppe (`motionY`) plus
 * la sienne dans l'enveloppe (0).
 */
function LayoutCircuitCard({
  exercise,
  circuit,
  position,
  rail,
  context,
  cardsFrameY,
}: {
  exercise: SessionDraftExercise;
  circuit: StructureCircuit<SessionDraftExercise>;
  position: { readonly index: number; readonly count: number };
  rail: SequenceRailContext;
  context: LayoutRenderContext;
  cardsFrameY: number | null;
}) {
  const motion = useLayoutCardMotion(exercise.id, context);
  // Incident du 01/11/2026 : mesure filtrée, en transition au repos (`LAYOUT_MEASURE_TOLERANCE`).
  const [motionY, setMotionY] = useMeasuredValue(0, context.lift !== null);
  const onMotionLayout = useCallback((event: LayoutChangeEvent) => setMotionY(event.nativeEvent.layout.y), [setMotionY]);
  return (
    <CardMotionBlock
      mode={motion.mode}
      gap={CIRCUIT_GAP}
      onDone={motion.onDone}
      onLayout={onMotionLayout}
      testID={`composition-layout-card-motion-${exercise.id}`}
    >
      <LayoutExerciseRow
        exercise={exercise}
        circuit={circuit}
        position={position}
        railGap={CIRCUIT_GAP}
        rail={rail}
        context={context}
        measureFrameY={cardsFrameY === null ? null : cardsFrameY + motionY}
      />
    </CardMotionBlock>
  );
}

/** PRE-9 B.2 : nom d'un Circuit dans le mode enveloppe — « le circuit », ou « le circuit A » (ARB-13). */
function layoutCircuitName(circuitId: string, letters: ReadonlyMap<string, string>): string {
  const t = strings.screens.composition.envelope;
  const letter = letters.get(circuitId);
  return letter === undefined ? t.circuitName : t.circuitNameWithLetter.replace("{letter}", letter);
}

/**
 * PRE-9 B.1b : carte d'occurrence d'une disposition générale — `CompositionActivityRow`. B.4 : appui
 * long et glisser, « Monter » / « Descendre » ; carte d'un Circuit : sa boîte est rapportée
 * (`measureFrameY`, ordonnée de la liste des cartes).
 */
function LayoutExerciseRow({
  exercise,
  circuit,
  position,
  railGap,
  rail,
  context,
  measureFrameY,
}: {
  exercise: SessionDraftExercise;
  /** Circuit qui la contient, ou `null` (Exercice direct de la Séance ou d'un Cycle). */
  circuit: StructureCircuit<SessionDraftExercise> | null;
  position: { readonly index: number; readonly count: number };
  railGap: number;
  rail: SequenceRailContext;
  context: LayoutRenderContext;
  /** Carte d'un Circuit : ordonnée de la liste des cartes dans le contenu défilant (`null` inconnue). */
  measureFrameY?: number | null;
}) {
  // La carte lit sa position structurelle pour son aplat (dans un Circuit : sans bord, fond du
  // Circuit) et sa durée (Circuit alterné : total de ses passages) — celle de son conteneur réel.
  const displayed = useMemo<SessionDraftExercise>(
    () => ({ ...exercise, structuralPosition: circuit === null ? "BEFORE_TOUR" : "IN_TOUR" }),
    [circuit, exercise],
  );
  const circuitContext: OccurrenceCircuitContext =
    circuit === null ? {} : { circuitNature: circuit.nature, tourRepeatCount: circuit.repeatCount };
  const { onEdit, onOpenMovement, drag } = context;
  const edit = useCallback(() => onEdit(exercise.id), [exercise.id, onEdit]);
  // Recette iPhone n° 2 du 31/10/2026 (constat c) : la photo d'une carte d'Exercice ouvre sa fiche.
  const openMovement = useCallback(() => onOpenMovement(exercise.id), [exercise.id, onOpenMovement]);
  const source = useMemo<LayoutItemRef>(() => ({ kind: "EXERCISE", id: exercise.id }), [exercise.id]);
  const onLayout = useReportedBox(
    layoutItemKey(source),
    measureFrameY ?? null,
    measureFrameY === undefined ? undefined : drag?.reportBox,
    context.lift !== null,
  );
  const isDragged = drag?.source?.kind === "EXERCISE" && drag.source.id === exercise.id;
  // Recette n° 2 du 31/10 (story 5.2b) : tenue pendant un dialogue ou en retour — au premier plan,
  // hors de la chaîne du rail (elle porte le rail de sa propre surface).
  const { lift } = context;
  const isRaised = isDragged || (lift !== null && lift.stopPointId === null && lift.source.kind === "EXERCISE" && lift.source.id === exercise.id);
  const onDragStart = useCallback(() => drag?.onStart(source) ?? false, [drag, source]);
  const onDragCancel = useCallback((translationY: number) => drag?.onCancel(translationY), [drag]);
  const onDragMove = useCallback((translationY: number) => drag?.onMove(translationY), [drag]);
  const onDragEnd = useCallback((translationY: number) => drag?.onEnd(translationY), [drag]);
  // PRE-9 B.5 : balayage (Dupliquer / Supprimer) et ses actions accessibles ; une carte à la fois.
  const { actions } = context;
  const revealedId = actions === null ? null : actions.revealedId;
  const onRevealActions = useCallback(() => actions?.onReveal(exercise.id), [actions, exercise.id]);
  const onHideActions = useCallback(() => actions?.onReveal(null), [actions]);
  const onDuplicate = useCallback(() => actions?.onDuplicate(exercise.id), [actions, exercise.id]);
  const onDelete = useCallback(() => actions?.onDelete(exercise.id), [actions, exercise.id]);
  return (
    <CompositionActivityRow
      activity={displayed}
      position={position}
      areActionsRevealed={revealedId === exercise.id}
      isDragged={isDragged}
      isRaised={isRaised}
      isBlockedByOtherReveal={revealedId !== null && revealedId !== exercise.id}
      bodyZonesReferential={context.bodyZonesReferential}
      categoriesReferential={context.categoriesReferential}
      levelPositions={context.levelPositions}
      circuitContext={circuitContext}
      onLayout={measureFrameY === undefined ? noop : onLayout}
      focusRequest={null}
      onFocusConsumed={noop}
      onEdit={edit}
      onOpenMovement={exercise.type === "EXERCISE" ? openMovement : null}
      onRevealActions={onRevealActions}
      onHideActions={onHideActions}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      rail={rail}
      autoScroll={context.autoScroll}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onMoveUp={drag?.stepAction(source, "UP") ?? null}
      onMoveDown={drag?.stepAction(source, "DOWN") ?? null}
      // PRE-9 B.6 : en placement, zone de récupération et emplacement de Point sous la carte.
      placement={context.stops.placement}
      layoutRailGap={railGap}
      layoutDraggable={drag !== null}
      layoutSwipeable={actions !== null}
    />
  );
}

/*
 * [PRE-9 B.4 : `LayoutDropHighlight`, « cadre de la destination éclairée (Circuit ou Cycle) » — retiré
 * par la recette iPhone n° 2 du 31/10/2026 (Hermann : « Je ne veux pas d'encadré bleu et de trait
 * d'insertion […] les conteneurs ont un liseré bleu ») : le conteneur visé s'agrandit pour faire la
 * place (`useLayoutContainerMotion`).]
 */

/**
 * Recette iPhone n° 2 du 31/10/2026 (amendement de Hermann du 21/10/2026, story 2.3b : le Circuit
 * « s'agrandit ou se rétracte pendant le geste ») — translations d'un Circuit ou d'un Cycle de la
 * disposition générale, dans le registre partagé : bord haut (en-tête, anneau, lien du rail), bord bas
 * (fond, queue du rail) et bloc entier (saisi : retour ou mise en place après le lâcher, ajouté à la
 * translation du doigt). `active` : un élément est saisi, tenu ou en retour (fond en trois couches).
 */
function useLayoutContainerMotion(kind: "CIRCUIT" | "CYCLE", id: string, context: LayoutRenderContext, translation: Animated.Value, ghost: boolean) {
  const { railShiftOf, lift, sessionLinks } = context;
  const topKey = layoutEdgeShiftKey(kind, id, "top");
  const top = railShiftOf(topKey);
  const bottom = railShiftOf(layoutEdgeShiftKey(kind, id, "bottom"));
  const block = railShiftOf(layoutBlockShiftKey(kind, id));
  const blockTranslation = useMemo(() => Animated.add(translation, block), [block, translation]);
  return {
    top,
    bottom,
    blockTranslation,
    /** Ce bloc est l'élément saisi, tenu ou en retour : hors de la chaîne du rail. */
    held: liftHoldsBlock(lift, kind, id),
    active: !ghost && lift !== null,
    sessionLink: sessionLinks.get(topKey),
  };
}

/**
 * Recette n° 2 : queue du rail d'un conteneur (de son anneau à son bas) — pendant l'aperçu, son haut
 * suit le bord haut et son bas le bord bas (étirement par transformations seules, comme la bande de
 * `CircuitSurface`) ; au repos, segment ordinaire.
 */
function LayoutRailTail({
  centerX,
  top,
  containerHeight,
  topShift,
  bottomShift,
  active,
  testID,
}: {
  centerX: number;
  top: number;
  containerHeight: number | null;
  topShift: Animated.Value;
  bottomShift: Animated.Value;
  active: boolean;
  testID: string;
}) {
  const height = containerHeight === null ? 0 : containerHeight - top;
  const base = Math.max(1, height);
  /**
   * Contre-recette n° 5 du 01/11/2026 : comme la bande de `CircuitSurface` — la piste garde sa hauteur
   * de mise en page (`bottom: 0`, fil UI) et suit le bord haut quand les bords s'écartent ; un
   * prolongement d'un point, sous elle, est étiré de l'écart (aucune hauteur relevée au fil JS) ; quand
   * ils se rapprochent, elle se resserre comme avant, d'après la hauteur relevée.
   */
  const { transform, extensionTransform } = useMemo(() => {
    const spread = Animated.subtract(bottomShift, topShift);
    const closing = spread.interpolate({ inputRange: [-1, 0], outputRange: [-1, 0], extrapolateLeft: "extend", extrapolateRight: "clamp" });
    const opening = spread.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: "clamp", extrapolateRight: "extend" });
    const scale = Animated.add(1, Animated.divide(closing, base)).interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
    return {
      // Haut posé sur le bord haut ; la mise à l'échelle autour du centre est compensée.
      transform: [{ translateY: Animated.add(topShift, Animated.multiply(Animated.subtract(scale, 1), base / 2)) }, { scaleY: scale }],
      extensionTransform: [{ translateY: Animated.add(topShift, Animated.add(Animated.multiply(opening, 0.5), -0.5)) }, { scaleY: opening }],
    };
  }, [base, bottomShift, topShift]);
  if (!active || height <= 0) return <RailSegment centerX={centerX} top={top} bottom={0} testID={testID} />;
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.layoutRailTailTrack, { top, bottom: 0, transform }]} testID={`${testID}-track`}>
        <RailSegment centerX={centerX} top={0} bottom={0} testID={testID} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.layoutRailTailTrack, styles.layoutRailTailExtension, { transform: extensionTransform }]}
        testID={`${testID}-extension`}
      >
        <RailSegment centerX={centerX} top={0} bottom={0} testID={`${testID}-extension-segment`} />
      </Animated.View>
    </>
  );
}

/**
 * PRE-9 B.1b : Circuit d'une disposition générale — en-tête B.1a (lettre, compteur, nature, repli) et
 * cartes. B.4 : saisi par appui long sur son en-tête (`useBlockDragGesture`), il suit le doigt au
 * premier plan ; ses boîtes (bloc, en-tête, cartes) sont rapportées pour la résolution de la
 * destination. [B.4 : « destination éclairée par un cadre » — remplacé par la recette iPhone n° 2 du
 * 31/10/2026 :] ses bords se déplacent pour faire la place (`useLayoutContainerMotion`), son fond les
 * suit (`CircuitSurface`). `ghost` : copie inerte en effacement.
 */
/**
 * PRE-9 B.4c (COMP §7) : en-tête collé ramené à sa place dans le flux, sous le doigt — avant de
 * replier son Circuit (CS-D6 : le recalage tient à la hauteur réelle du conteneur, sans constante),
 * ou avant sa saisie (CS-D7 : décollé sans saut). Sans effet s'il n'est pas collé, ou s'il se déplie.
 */
function alignStuckHeader(sticky: StickyScroll | null, range: StickyRange | null, expanding: boolean): void {
  if (sticky === null || !sticky.enabled || expanding) return;
  const offset = stickyCollapseOffset(range, sticky.offset());
  if (offset !== null) sticky.scrollTo(offset);
}

function LayoutCircuitBlock({
  circuit,
  inCycle,
  offsetY,
  railGap,
  raised,
  rail,
  context,
  onAnchor,
  ghost = false,
  stickBelow = 0,
}: {
  circuit: StructureCircuit<SessionDraftExercise>;
  inCycle: boolean;
  /** Ordonnée du parent (Cycle) dans le contenu défilant ; 0 au niveau de la Séance ; `null` inconnue. */
  offsetY: number | null;
  railGap: number;
  /** PRE-9 B.4 : le bloc porte l'élément saisi (au premier plan). */
  raised: boolean;
  rail: SequenceRailContext;
  context: LayoutRenderContext;
  onAnchor: (circuitId: string, y: number) => void;
  ghost?: boolean;
  /** PRE-9 B.4c (CS-D4) : dans un Cycle, bas de l'en-tête collé du Cycle, sous lequel il colle. */
  stickBelow?: number;
}) {
  // Incident du 01/11/2026 : mesures filtrées, en transition au repos (`LAYOUT_MEASURE_TOLERANCE`).
  const urgent = context.lift !== null;
  const [rowHeight, setRowHeight] = useMeasuredValue(CIRCUIT_HEADER_HEIGHT, urgent);
  const [blockFrame, onBlockFrame] = useMeasuredFrame(urgent);
  const blockY = blockFrame === null ? null : blockFrame.y;
  const blockHeight = blockFrame === null ? null : blockFrame.height;
  const [headerBottom, setHeaderBottom] = useMeasuredValue<number | null>(null, urgent);
  const [listY, setListY] = useMeasuredValue<number | null>(null, urgent);
  useEffect(() => {
    if (!ghost && offsetY !== null && blockY !== null && headerBottom !== null) onAnchor(circuit.id, offsetY + blockY + headerBottom);
  }, [blockY, circuit.id, ghost, headerBottom, offsetY, onAnchor]);
  const { openOverlay, onToggleOverlay, drag } = context;
  const report = ghost ? undefined : drag?.reportBox;
  const source = useMemo<LayoutItemRef>(() => ({ kind: "CIRCUIT", id: circuit.id }), [circuit.id]);
  const reportBlock = useReportedBox(layoutItemKey(source), offsetY, report, urgent);
  const reportHeader = useReportedBox(
    layoutHeaderKey("CIRCUIT", circuit.id),
    offsetY === null || blockY === null ? null : offsetY + blockY,
    report,
    urgent,
  );
  const gesture = useBlockDragGesture({
    onStart: () => drag?.onStart(source) ?? false,
    onMove: (translationY) => drag?.onMove(translationY),
    onEnd: (translationY) => drag?.onEnd(translationY),
    onCancel: (translationY) => drag?.onCancel(translationY),
    autoScroll: context.autoScroll,
  });
  const motion = useLayoutContainerMotion("CIRCUIT", circuit.id, context, gesture.translation, ghost);
  const isDragged = drag?.source?.kind === "CIRCUIT" && drag.source.id === circuit.id;
  const counterKind = layoutCircuitCounterKind(circuit.id);
  const natureKind = layoutCircuitNatureKind(circuit.id);
  const contentKey = circuit.exercises.map((exercise) => exercise.id).join(" ");
  // PRE-9 B.6 : jamais replié en placement (emplacements du Circuit visibles), comme le Circuit unique (B.1a).
  const isCollapsed = context.collapsed.get(circuit.id) === contentKey && context.stops.placement === null;
  const circuitContainer = useMemo<StopPointContainer>(() => ({ kind: "CIRCUIT", id: circuit.id }), [circuit.id]);
  const inPlacement = context.stops.placement !== null;
  /**
   * Contre-recette n° 5 du 01/11/2026 : hauteur de la ligne des noms du Circuit replié (en-tête replié
   * moins sa ligne), relevée replié ; elle disparaît au déploiement.
   */
  const collapsedNamesHeightRef = useRef(0);
  useLayoutEffect(() => {
    if (isCollapsed && headerBottom !== null) collapsedNamesHeightRef.current = Math.max(0, headerBottom - CIRCUIT_PADDING_VERTICAL - rowHeight);
  });
  const onCircuitReveal = drag?.onCircuitReveal;
  /**
   * Contre-recette n° 5 : départ du déploiement — croissance prévue du Circuit : ses cartes (hauteur
   * naturelle du contenu) et l'écart qui les précède, moins la marge basse réduite et la ligne des noms
   * qui se referme (`useCircuitCardsReveal`, `CollapsedNamesLine` : même progression).
   */
  const onRevealStart = useCallback(
    (naturalHeight: number) =>
      onCircuitReveal?.(circuit.id, naturalHeight + CIRCUIT_GAP - CIRCUIT_CARDS_BOTTOM_OVERLAP - collapsedNamesHeightRef.current),
    [circuit.id, onCircuitReveal],
  );
  // Contre-recette n° 4 du 01/11/2026 : hauteur naturelle relevée sur le contenu (`measuresContent`).
  const reveal = useCircuitCardsReveal(isCollapsed, CIRCUIT_GAP, CIRCUIT_CARDS_BOTTOM_OVERLAP, true, ghost ? undefined : onRevealStart);
  const railX = RAIL_CENTER_X_IN_COLUMN + (inCycle ? LAYOUT_CIRCUIT_IN_CYCLE_OUTSET : CIRCUIT_OUTSET);
  const ringTop = CIRCUIT_PADDING_VERTICAL + circuitHeaderRingTop(rowHeight);
  const testID = ghost ? `composition-layout-vanishing-circuit-${circuit.id}-block` : `composition-layout-circuit-${circuit.id}`;
  // PRE-9 B.4c (COMP §7) : en-tête collant — sous la zone de contexte, ou sous l'en-tête collé du Cycle.
  const sticky = useStickyScroll();
  const stickyContainerY = offsetY === null || blockY === null ? null : offsetY + blockY;
  const circuitStickyRange = useMemo(
    () =>
      stickyRange({
        containerY: stickyContainerY,
        containerHeight: blockHeight,
        headerBottom,
        bottomInset: CIRCUIT_PADDING_VERTICAL,
        stickTop: (sticky?.top ?? 0) + stickBelow,
      }),
    [blockHeight, headerBottom, stickBelow, sticky, stickyContainerY],
  );
  const horizontalInset = inCycle ? LAYOUT_CIRCUIT_IN_CYCLE_OUTSET : CIRCUIT_OUTSET;
  // Contre-recette du 30/10 (constat b) : le Circuit qui vient d'être posé apparaît progressivement
  // (fond, anneau et en-tête) ; ses cartes, déjà visibles, restent.
  const entering = context.appearingCircuitIds.has(circuit.id) ? CIRCUIT_ENTERING : undefined;
  const cardsFrameY = offsetY === null || blockY === null || listY === null ? null : offsetY + blockY + listY;
  // Recette n° 2 : fond en trois couches qui suivent les bords pendant l'aperçu ; au repos, aplat.
  const layered = motion.active && blockHeight !== null && blockHeight > 0;
  // Contre-recette n° 4 du 01/11/2026 (constat a, Hermann : « la partie du rail qui va du cercle au bord
  // haut du circuit disparait pendant le mouvement ») : saisi, tenu ou en retour, le Circuit sort de la
  // chaîne du rail — [« aucun lien » : remplacé :] seul le lien vers son prédécesseur (au-dessus de son
  // bord haut) disparaît ; le segment de son bord haut à son anneau, dans le Circuit, reste dessiné.
  const link = motion.held ? (
    <RailSegment centerX={railX} top={0} height={ringTop} testID={`${testID}-rail-link`} />
  ) : !inCycle && motion.sessionLink !== undefined ? (
    <RailLink
      centerX={railX}
      entryY={ringTop}
      length={railGap + ringTop + motion.sessionLink.extra}
      shift={motion.top}
      prevShift={context.railShiftOf(motion.sessionLink.prevKey)}
      testID={`${testID}-rail-link`}
    />
  ) : (
    <RailSegment centerX={railX} top={-railGap} height={railGap + ringTop} testID={`${testID}-rail-link`} />
  );
  return (
    <Animated.View
      style={[
        styles.tourSectionContainer,
        inCycle ? styles.layoutCircuitInCycle : null,
        raised ? styles.dragElevated : null,
        isDragged ? styles.layoutBlockDragged : null,
        // B.4 : il suit le doigt ; recette n° 2 : puis revient ou glisse jusqu'à sa place (registre).
        { transform: [{ translateY: motion.blockTranslation }] },
      ]}
      onLayout={(event) => {
        onBlockFrame(event);
        reportBlock(event);
      }}
      {...(drag !== null && !ghost ? gesture.handlers : {})}
      testID={testID}
    >
      <Reanimated.View
        entering={entering}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, layered ? null : styles.layoutCircuitSurface]}
        testID={`${testID}-surface`}
      >
        {layered ? (
          <CircuitSurface top={motion.top} bottom={motion.bottom} dragHeight={blockHeight} extendsOnSpread testID={`${testID}-surface-layers`} />
        ) : null}
      </Reanimated.View>
      {isCircuitControl(openOverlay) ? <NatureOutsideZone onPress={context.onOutsidePress} testID={`${testID}-outside`} /> : null}
      <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`${testID}-rail`}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: motion.top }] }]} testID={`${testID}-rail-head`}>
          {link}
          <Reanimated.View entering={entering} style={StyleSheet.absoluteFill} testID={`${testID}-rail-ring-reveal`}>
            <RailRing centerX={railX} centerY={CIRCUIT_PADDING_VERTICAL + rowHeight / 2} testID={`${testID}-rail-ring`} />
          </Reanimated.View>
        </Animated.View>
        <LayoutRailTail
          centerX={railX}
          top={ringTop + RAIL_RING_DIAMETER}
          containerHeight={blockHeight}
          topShift={motion.top}
          bottomShift={motion.bottom}
          active={motion.active}
          testID={`${testID}-rail-tail`}
        />
      </View>
      {/* PRE-9 B.6 : en placement, l'en-tête est inactif et masqué à l'accessibilité (seuls les emplacements répondent). */}
      {/* Recette n° 2 : l'en-tête suit le bord haut. */}
      <Animated.View
        pointerEvents={inPlacement ? "none" : "box-none"}
        accessibilityElementsHidden={inPlacement}
        importantForAccessibility={inPlacement ? "no-hide-descendants" : "auto"}
        style={[styles.stickyHeaderLayer, { transform: [{ translateY: motion.top }] }]}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setHeaderBottom(y + height);
          reportHeader(event);
        }}
        testID={`${testID}-header-frame`}
      >
      <StickyHeaderFrame
        range={circuitStickyRange}
        enabled={!ghost}
        color={CIRCUIT_SURFACE_COLOR}
        outsetLeft={horizontalInset}
        outsetRight={horizontalInset}
        insetTop={CIRCUIT_PADDING_VERTICAL}
        // Dans un Cycle, le fond au-dessus passe sous l'en-tête collé du Cycle.
        extension={inCycle ? 0 : (sticky?.top ?? 0)}
        rail={{ centerX: railX, ringY: rowHeight / 2 }}
        testID={`${testID}-header-sticky`}
      >
      <CircuitHeader
        entering={entering}
        nature={circuit.nature}
        letter={context.letters.get(circuit.id)}
        count={circuit.repeatCount}
        duration={formatLayoutDuration([{ kind: "CIRCUIT", circuit }])}
        isCounterOpen={openOverlay === counterKind}
        onToggleCounter={() => onToggleOverlay(counterKind)}
        onChangeCount={(count) => context.onCircuitCount(circuit.id, count)}
        isNatureMenuOpen={openOverlay === natureKind}
        onOpenNatureMenu={() => onToggleOverlay(natureKind)}
        onCloseNatureMenu={() => context.onDismissNature(circuit.id)}
        onSelectNature={(nature) => context.onSelectNature(circuit.id, nature)}
        natureFocusRequest={context.natureFocusRequests[circuit.id] ?? 0}
        isChoicePending={context.isChoicePending}
        titleInset={SEQUENCE_LABEL_INSET}
        isCollapsed={isCollapsed}
        // PRE-9 B.4c (CS-D6) : replié collé, l'en-tête reste sous le doigt.
        onToggleCollapsed={() => {
          alignStuckHeader(sticky, circuitStickyRange, isCollapsed);
          context.onToggleCollapsed(circuit);
        }}
        memberNames={circuit.exercises.map((exercise) => occurrenceCardName(exercise, context.levelPositions))}
        // PRE-9 B.4 (COMP §6) : appui long sur l'en-tête — le Circuit déployé est replié, puis suit le doigt.
        // B.4c (CS-D7) : collé, il est d'abord ramené à sa place dans le flux, sous le doigt, puis décollé.
        onLongPress={
          drag !== null && !ghost
            ? () => {
                alignStuckHeader(sticky, circuitStickyRange, false);
                gesture.begin();
              }
            : undefined
        }
        moveActions={
          drag !== null && !ghost ? { moveUp: drag.stepAction(source, "UP"), moveDown: drag.stepAction(source, "DOWN") } : undefined
        }
        onRowLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0) setRowHeight(height);
        }}
        testID={`${testID}-header`}
      />
      </StickyHeaderFrame>
      </Animated.View>
      {/* ARB-12 : Circuit replié — ses cartes sont masquées, le brouillon est inchangé. */}
      {/* Recette du 29/10 (obs-3 b) : dévoilement et repli animés (`useCircuitCardsReveal`). */}
      {!reveal.mounted || circuit.exercises.length === 0 ? null : (
        <Reanimated.View
          style={[styles.layoutCircuitCardsClip, reveal.style]}
          onLayout={(event) => setListY(event.nativeEvent.layout.y)}
          testID={`${testID}-exercises`}
        >
          {/* Contre-recette n° 4 du 01/11/2026 (cr5-replie, constat c) : contenu non contraint, dont la
              hauteur naturelle est relevée à chaque mesure (`onContentLayout`), base du dépliage et du repli. */}
          <View style={styles.layoutCircuitCards} onLayout={reveal.onContentLayout} testID={`${testID}-exercises-content`}>
          {circuit.exercises.map((exercise, index) => [
            // PRE-9 B.6 (RM-220, ARB-02a) : Points d'arrêt du Circuit avant cette carte (rencontrés à chaque Tour).
            <LayoutStopRows
              key={`stops:${circuit.id}:${index}`}
              container={circuitContainer}
              position={index}
              gap={CIRCUIT_GAP}
              frameY={cardsFrameY}
              context={context}
            />,
            <LayoutCircuitCard
              key={exercise.id}
              exercise={exercise}
              circuit={circuit}
              position={{ index, count: circuit.exercises.length }}
              rail={rail}
              context={context}
              cardsFrameY={cardsFrameY}
            />,
          ])}
          <LayoutStopRows container={circuitContainer} position={circuit.exercises.length} gap={CIRCUIT_GAP} frameY={cardsFrameY} context={context} />
          </View>
        </Reanimated.View>
      )}
    </Animated.View>
  );
}

/**
 * PRE-9 B.1b : Cycle d'une disposition générale — en-tête (jamais replié), Exercices directs et
 * Circuits. B.4 (ARB-09) : Cycle entier saisi par appui long sur son titre. [B.4 : « destination
 * éclairée » — remplacé par la recette iPhone n° 2 du 31/10/2026 :] ses bords se déplacent pour faire
 * la place (`useLayoutContainerMotion`), son fond les suit.
 */
function LayoutCycleBlock({
  cycle,
  raised,
  rail,
  context,
  onAnchor,
  ghost = false,
}: {
  cycle: StructureCycle<SessionDraftExercise>;
  raised: boolean;
  rail: SequenceRailContext;
  context: LayoutRenderContext;
  onAnchor: (circuitId: string, y: number) => void;
  ghost?: boolean;
}) {
  // Incident du 01/11/2026 (« Maximum update depth exceeded » au repli d'un Circuit du Cycle) :
  // position et hauteur en un seul état, filtrées, en transition au repos (`LAYOUT_MEASURE_TOLERANCE`).
  const urgent = context.lift !== null;
  const [rowHeight, setRowHeight] = useMeasuredValue(CIRCUIT_HEADER_HEIGHT, urgent);
  const [cycleFrame, onCycleFrame] = useMeasuredFrame(urgent);
  const cycleY = cycleFrame === null ? null : cycleFrame.y;
  const cycleHeight = cycleFrame === null ? null : cycleFrame.height;
  const { openOverlay, onToggleOverlay, drag } = context;
  const report = ghost ? undefined : drag?.reportBox;
  const source = useMemo<LayoutItemRef>(() => ({ kind: "CYCLE", id: cycle.id }), [cycle.id]);
  const reportBlock = useReportedBox(layoutItemKey(source), ghost ? null : 0, report, urgent);
  const reportHeader = useReportedBox(layoutHeaderKey("CYCLE", cycle.id), cycleY, report, urgent);
  // PRE-9 B.4c (COMP §7) : en-tête collant du Cycle ; ses Circuits collent sous lui (CS-D4).
  const [headerBottom, setHeaderBottom] = useMeasuredValue<number | null>(null, urgent);
  const sticky = useStickyScroll();
  const cycleStickyRange = useMemo(
    () =>
      stickyRange({
        containerY: cycleY,
        containerHeight: cycleHeight,
        headerBottom,
        bottomInset: CONTAINER_PADDING_BOTTOM,
        stickTop: sticky?.top ?? 0,
      }),
    [cycleHeight, cycleY, headerBottom, sticky],
  );
  const gesture = useBlockDragGesture({
    onStart: () => drag?.onStart(source) ?? false,
    onMove: (translationY) => drag?.onMove(translationY),
    onEnd: (translationY) => drag?.onEnd(translationY),
    onCancel: (translationY) => drag?.onCancel(translationY),
    autoScroll: context.autoScroll,
  });
  const motion = useLayoutContainerMotion("CYCLE", cycle.id, context, gesture.translation, ghost);
  const isDragged = drag?.source?.kind === "CYCLE" && drag.source.id === cycle.id;
  const counterKind = layoutCycleCounterKind(cycle.id);
  const railX = RAIL_CENTER_X_IN_CIRCUIT;
  const ringTop = CIRCUIT_PADDING_VERTICAL + circuitHeaderRingTop(rowHeight);
  const directExercises = cycle.members.flatMap((member) => (member.kind === "EXERCISE" ? [member.exercise] : []));
  const testID = ghost ? `composition-layout-vanishing-cycle-${cycle.id}-block` : `composition-layout-cycle-${cycle.id}`;
  const cycleContainer = useMemo<StopPointContainer>(() => ({ kind: "CYCLE", id: cycle.id }), [cycle.id]);
  const memberKeys = cycle.members.map(layoutElementKey);
  const ghosts = (key: string | null) =>
    vanishingAt(context.vanishing, cycle.id, key, memberKeys).map((item) => (
      <LayoutVanishing key={`vanishing:${item.key}`} item={item} gap={LAYOUT_CYCLE_GAP} rail={rail} context={context} onAnchor={onAnchor} />
    ));
  const header = (
    <CycleHeader
      letter={context.letters.get(cycle.id)}
      count={cycle.repeatCount}
      duration={formatLayoutDuration([{ kind: "CYCLE", cycle }])}
      isCounterOpen={openOverlay === counterKind}
      onToggleCounter={() => onToggleOverlay(counterKind)}
      onChangeCount={(count) => context.onCycleCount(cycle.id, count)}
      isChoicePending={context.isChoicePending}
      titleInset={SEQUENCE_LABEL_INSET}
      onRowLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) setRowHeight(height);
      }}
      // PRE-9 B.4 (ARB-09) : appui long sur le titre — le Cycle entier suit le doigt.
      // B.4c (CS-D7) : collé, il est d'abord ramené à sa place dans le flux, sous le doigt.
      onLongPress={
        drag !== null && !ghost
          ? () => {
              alignStuckHeader(sticky, cycleStickyRange, false);
              gesture.begin();
            }
          : undefined
      }
      moveActions={
        drag !== null && !ghost ? { moveUp: drag.stepAction(source, "UP"), moveDown: drag.stepAction(source, "DOWN") } : undefined
      }
      testID={`${testID}-header`}
    />
  );
  // Contre-recette du 30/10 : le Cycle qui vient d'être posé apparaît progressivement (fond, anneau
  // et en-tête), comme les cartes d'un Circuit qui se déploie ; ses membres, déjà visibles, restent.
  const entering = context.appearingCycleIds.has(cycle.id) ? CYCLE_ENTERING : undefined;
  // Recette n° 2 : fond en trois couches qui suivent les bords pendant l'aperçu ; au repos, aplat.
  const layered = motion.active && cycleHeight !== null && cycleHeight > 0;
  const linkLength = SEQUENCE_GAP + ringTop - CYCLE_RING_OUTSET;
  return (
    <Animated.View
      style={[
        styles.layoutCycleContainer,
        raised ? styles.dragElevated : null,
        isDragged ? styles.layoutBlockDragged : null,
        // B.4 : il suit le doigt ; recette n° 2 : puis revient ou glisse jusqu'à sa place (registre).
        { transform: [{ translateY: motion.blockTranslation }] },
      ]}
      onLayout={(event) => {
        onCycleFrame(event);
        reportBlock(event);
      }}
      {...(drag !== null && !ghost ? gesture.handlers : {})}
      testID={testID}
    >
      <Reanimated.View
        entering={entering}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, layered ? null : styles.layoutCycleSurface]}
        testID={`${testID}-surface`}
      >
        {layered ? (
          <CircuitSurface
            top={motion.top}
            bottom={motion.bottom}
            dragHeight={cycleHeight}
            color={CYCLE_SURFACE_COLOR}
            extendsOnSpread
            testID={`${testID}-surface-layers`}
          />
        ) : null}
      </Reanimated.View>
      {isCircuitControl(openOverlay) ? <NatureOutsideZone onPress={context.onOutsidePress} testID={`${testID}-outside`} /> : null}
      <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`${testID}-rail`}>
        {/* Recette n° 2 : anneaux et lien suivent le bord haut. */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: motion.top }] }]} testID={`${testID}-rail-head`}>
          {/* Recette du 29/10 (obs-3 c) : le rail s'arrête à l'anneau extérieur du Cycle. */}
          {/* Contre-recette n° 4 (constat a) : saisi, le segment du bord haut à l'anneau reste dessiné. */}
          {motion.held ? (
            <RailSegment centerX={railX} top={0} height={ringTop - CYCLE_RING_OUTSET} testID={`${testID}-rail-link`} />
          ) : motion.sessionLink !== undefined ? (
            <RailLink
              centerX={railX}
              entryY={ringTop - CYCLE_RING_OUTSET}
              length={linkLength + motion.sessionLink.extra}
              shift={motion.top}
              prevShift={context.railShiftOf(motion.sessionLink.prevKey)}
              testID={`${testID}-rail-link`}
            />
          ) : (
            <RailSegment centerX={railX} top={-SEQUENCE_GAP} height={linkLength} testID={`${testID}-rail-link`} />
          )}
          <RailRing centerX={railX} centerY={CIRCUIT_PADDING_VERTICAL + rowHeight / 2} testID={`${testID}-rail-ring`} />
          {/*
           * Recette du 29/10 (obs-3 c, « deux cercles concentriques ») : anneau extérieur de 16 (Figma
           * `10748:20132`, « Anneau — Cycle », trait 1 `#7A7A80`) autour du repère de 10 (`10745:20132`).
           */}
          <Reanimated.View
            entering={entering}
            style={[
              styles.cycleOuterRing,
              { left: railX - CYCLE_OUTER_RING_DIAMETER / 2, top: CIRCUIT_PADDING_VERTICAL + rowHeight / 2 - CYCLE_OUTER_RING_DIAMETER / 2 },
            ]}
            testID={`${testID}-rail-outer-ring`}
          />
        </Animated.View>
        <LayoutRailTail
          centerX={railX}
          top={ringTop + RAIL_RING_DIAMETER + CYCLE_RING_OUTSET}
          containerHeight={cycleHeight}
          topShift={motion.top}
          bottomShift={motion.bottom}
          active={motion.active}
          testID={`${testID}-rail-tail`}
        />
      </View>
      {/* PRE-9 B.2 : en mode enveloppe, l'en-tête du Cycle est inactif (jamais éligible : aucun Cycle dans un Cycle). */}
      {/* Recette n° 2 : l'en-tête suit le bord haut (mesure portée par l'enveloppe, élément du Cycle). */}
      <Animated.View
        style={[styles.stickyHeaderLayer, { transform: [{ translateY: motion.top }] }]}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setHeaderBottom(y + height);
          reportHeader(event);
        }}
        testID={`${testID}-header-track`}
      >
        <StickyHeaderFrame
          range={cycleStickyRange}
          enabled={!ghost}
          color={CYCLE_SURFACE_COLOR}
          outsetLeft={CIRCUIT_OUTSET}
          outsetRight={CIRCUIT_OUTSET}
          insetTop={CIRCUIT_PADDING_VERTICAL}
          extension={sticky?.top ?? 0}
          rail={{ centerX: railX, ringY: rowHeight / 2, outerRing: CYCLE_OUTER_RING_DIAMETER }}
          testID={`${testID}-header-sticky`}
        >
        <Reanimated.View entering={entering} testID={`${testID}-header-reveal`}>
          {/* PRE-9 B.6 : en placement, l'en-tête est inactif (seuls les emplacements répondent). */}
          {context.envelope === null && context.stops.placement === null ? header : <PlacementAttenuation active>{header}</PlacementAttenuation>}
        </Reanimated.View>
        </StickyHeaderFrame>
      </Animated.View>
      {cycle.members.map((member, memberIndex) => {
        const key = layoutElementKey(member);
        const memberRaised = layoutElementHolds(member, context.lift?.source ?? null);
        // PRE-9 B.6 (ARB-02a) : Points d'arrêt du Cycle avant ce membre (rencontrés à chaque répétition).
        const stops = (
          <LayoutStopRows
            key={`stops:${cycle.id}:${memberIndex}`}
            container={cycleContainer}
            position={memberIndex}
            gap={LAYOUT_CYCLE_GAP}
            frameY={cycleY}
            context={context}
          />
        );
        const node =
          member.kind === "EXERCISE" ? (
            <LayoutDirectExercise
              key={key}
              exercise={member.exercise}
              position={{ index: directExercises.indexOf(member.exercise), count: directExercises.length }}
              frameY={cycleY}
              railGap={LAYOUT_CYCLE_GAP}
              listGap={LAYOUT_CYCLE_GAP}
              raised={memberRaised}
              rail={rail}
              context={context}
            />
          ) : (
            // PRE-9 B.2 : Circuit d'un Cycle — jamais éligible (un Cycle ne s'imbrique pas), inactif.
            <EnvelopeFrame
              key={key}
              envelope={context.envelope}
              target={{ kind: "CIRCUIT", id: member.circuit.id }}
              name={layoutCircuitName(member.circuit.id, context.letters)}
              testID={`composition-envelope-circuit-${member.circuit.id}`}
              outset={LAYOUT_CIRCUIT_IN_CYCLE_OUTSET}
              radius={CIRCUIT_RADIUS}
            >
              <LayoutCircuitBlock
                key={key}
                circuit={member.circuit}
                inCycle
                offsetY={cycleY}
                railGap={LAYOUT_CYCLE_GAP}
                raised={memberRaised}
                rail={rail}
                context={context}
                onAnchor={onAnchor}
                stickBelow={headerBottom ?? 0}
              />
            </EnvelopeFrame>
          );
        const before = ghosts(key);
        return [stops, ...before, node];
      })}
      {ghosts(null)}
      <LayoutStopRows container={cycleContainer} position={cycle.members.length} gap={LAYOUT_CYCLE_GAP} frameY={cycleY} context={context} />
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
  color,
  extendsOnSpread = false,
  testID,
}: {
  top: Animated.Value;
  bottom: Animated.Value;
  dragHeight: number;
  /**
   * Contre-recette n° 5 du 01/11/2026 : disposition générale — écartement des bords porté par un
   * prolongement (voir plus bas) ; sans (ancien modèle, Circuit unique) : bande étirée, comme avant.
   */
  extendsOnSpread?: boolean;
  /** Recette n° 2 du 31/10 : aplat d'un conteneur de la disposition générale (Cycle) ; par défaut, celui du Circuit. */
  color?: string;
  testID: string;
}) {
  const fill = color === undefined ? null : { backgroundColor: color };
  // Base finie et non nulle : la hauteur relevée moins les deux rayons, au moins 1.
  const bandHeight = Number.isFinite(dragHeight)
    ? Math.max(1, dragHeight - 2 * CIRCUIT_RADIUS)
    : 1;
  /**
   * Contre-recette n° 5 du 01/11/2026 (place ouverte pendant le déploiement, sans soubresaut du bord
   * bas) — la bande n'est plus étirée d'après la hauteur relevée au fil JS (`dragHeight`, en retard
   * pendant un déploiement) quand les bords s'écartent : elle garde sa hauteur de mise en page (fil UI)
   * et suit le bord haut ; un prolongement d'un point, posé sur le bas de la bande dans la mise en page,
   * est étiré de l'écart entre les bords (translations seules). Quand les bords se rapprochent
   * (place refermée), la bande se resserre comme avant (`dragHeight`). [Recette n° 2 : bande toujours
   * étirée de `bottom − top` rapporté à `dragHeight` — remplacé pour l'écartement.]
   */
  const { bandTransform, extensionTransform } = useMemo(() => {
    const spread = Animated.subtract(bottom, top);
    // Rapprochement seul (≤ 0) et écartement seul (≥ 0) ; ancien modèle : tout écart étire la bande.
    const closing = extendsOnSpread
      ? spread.interpolate({ inputRange: [-1, 0], outputRange: [-1, 0], extrapolateLeft: "extend", extrapolateRight: "clamp" })
      : spread;
    const opening = extendsOnSpread
      ? spread.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: "clamp", extrapolateRight: "extend" })
      : Animated.multiply(spread, 0);
    return {
      bandTransform: [
        { translateY: Animated.add(top, Animated.multiply(closing, 0.5)) },
        {
          // Jamais négatif : un retrait plus haut que la bande l'écrase à 0 sans la retourner ; 1 à l'écartement.
          scaleY: Animated.add(1, Animated.divide(closing, bandHeight)).interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolateLeft: "clamp",
            extrapolateRight: extendsOnSpread ? "clamp" : "extend",
          }),
        },
      ],
      extensionTransform: [
        // Prolongement (1 point, sous le bas de la bande) : de bas de bande + `top` à bas de bande + `bottom`.
        { translateY: Animated.add(top, Animated.add(Animated.multiply(opening, 0.5), -0.5)) },
        { scaleY: opening },
      ],
    };
  }, [bandHeight, bottom, extendsOnSpread, top]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      testID={testID}
    >
      {/* Bande d'abord, arrondis ensuite : les arrondis recouvrent les jointures (`CIRCUIT_SURFACE_SEAM_OVERLAP`). */}
      <Animated.View style={[styles.circuitSurfaceBand, fill, { transform: bandTransform }]} testID={`${testID}-band`} />
      {extendsOnSpread ? (
        <Animated.View style={[styles.circuitSurfaceExtension, fill, { transform: extensionTransform }]} testID={`${testID}-extension`} />
      ) : null}
      <Animated.View style={[styles.circuitSurfaceTop, fill, { transform: [{ translateY: top }] }]} testID={`${testID}-top`} />
      <Animated.View
        style={[styles.circuitSurfaceBottom, fill, { transform: [{ translateY: bottom }] }]}
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
/**
 * Contre-recette iPhone du 30/10 (obs-3, Hermann : « Réduire la marge entre le bord bas du cadre d'un
 * exercice et le bord du circuit ou d'un cycle ; le bord bas du cadre d'un circuit et le bord du
 * cycle. Cette marge doit être égale à celle entre le bord bas du gabarit photo et le cadre d'un
 * exercice ») : marge basse d'un Circuit sous ses cartes et d'un Cycle sous son dernier membre =
 * écart entre le bas du média et le bas de la carte (80 − 72 = 8), par construction. La marge haute
 * (14) et le Circuit replié (14 sous l'en-tête, 68 au total) sont inchangés.
 */
const CONTAINER_PADDING_BOTTOM = OCCURRENCE_CARD_HEIGHT - OCCURRENCE_CARD_MEDIA.bottom;
/** Circuit déployé : réduction de sa marge basse (14 → 8), portée par la liste de ses cartes. */
const CIRCUIT_CARDS_BOTTOM_OVERLAP = CIRCUIT_PADDING_VERTICAL - CONTAINER_PADDING_BOTTOM;
const CIRCUIT_GAP = 9;
const CIRCUIT_RADIUS = 18;
/**
 * Aplat du Circuit (Figma `9819:19906`, `#F3F4F9`) : couleur hors registre ch12, constante locale
 * (choix D5 de l'epic 5 ; ch13 CE-T03-08 L1478). `colors.tourSurface` n'est pas modifié (partagé avec
 * `SessionCard` et `DisclosureControl`) ; ajout au registre proposé au lot documentaire.
 * [Remplacé par la recette iPhone du 29/10 (obs-3 b, Hermann : « la couleur du circuit ne contraste
 * pas suffisamment avec le blanc du fond des cartes ») : `#EBEDF5`, plus soutenu que `#F3F4F9` de
 * Figma, et toujours plus clair que l'aplat du Cycle (`#E0E2EF`) — valeur de conception à valider
 * sur iPhone ; la demande de Hermann prime sur Figma.]
 */
const CIRCUIT_SURFACE_COLOR = "#EBEDF5";
/**
 * PRE-9 B.1b (COMP §4 : « cycle pleine largeur, circuit 386, exercice 370 ; fonds du plus soutenu au
 * plus clair » ; Figma `10744:20108`) — valeurs locales NON ÉCRITES dans les sources, à confirmer :
 * - aplat du Cycle : lavande plus soutenu que celui du Circuit (`#EAEAFF`, valeur du jeton existant
 *   `segmentedInactiveSurface`), pleine largeur, sans rayon ; la frange de dégradé de 4 (COMP §4)
 *   n'est pas rendue ;
 * - Circuit dans un Cycle : en retrait de 4 de chaque côté (le fond du Cycle l'encadre), les cartes
 *   gardant leur largeur ;
 * - écart entre les membres d'un Cycle et sous son en-tête : celui du Circuit (9).
 * [Remplacé par la recette iPhone du 29/10 (obs-3 c, Hermann : « Couleurs de fond du cycle : elle
 * n'est pas conforme à Figma » ; « les 4 bords doivent être arrondis ») : aplat `#E0E2EF` (Figma
 * `10744:20282`, « Fond — Cycle ») et rayon 18 (même nœud) ; la frange de dégradé (1,9 % en haut et
 * en bas, Figma) reste non rendue.]
 */
const CYCLE_SURFACE_COLOR = "#E0E2EF";
/**
 * Contre-recette iPhone du 30/10 (Hermann : « Animation : à la validation il faut que le cycle
 * apparaisse progressivement ») : fondu d'entrée du Cycle posé, à la durée du dévoilement des cartes
 * d'un Circuit (`CIRCUIT_REVEAL_DURATION_MS`, 450 ms) — valeur de conception, Figma muet ; immédiat
 * si « Réduire les animations » est actif. [Contre-recette du 30/10, constat b : le dévoilement du
 * Circuit passe à 700 ms ; le Cycle garde 450 ms (`MOTION_FADE_DURATION_MS`), non visé par le constat.]
 */
const CYCLE_ENTERING = FadeIn.duration(MOTION_FADE_DURATION_MS).reduceMotion(ReduceMotion.System);
/**
 * Contre-recette iPhone du 30/10 (constat b, Hermann : « Circuit : l'apparition et la disparition du
 * circuit doivent se faire progressivement et plus lentement ») : fondu d'entrée du Circuit posé
 * (« Confirmer le circuit ») — fond, anneau et en-tête ; ses cartes, déjà visibles, restent. Durée du
 * déploiement de ses cartes (`CIRCUIT_REVEAL_DURATION_MS`, 700 ms) — valeur de conception, Figma
 * muet ; immédiat si « Réduire les animations » est actif.
 */
const CIRCUIT_ENTERING = FadeIn.duration(CIRCUIT_REVEAL_DURATION_MS).reduceMotion(ReduceMotion.System);
/**
 * Contre-recette n° 5 du 01/11/2026 : translations du registre lancées avec le déploiement d'un
 * Circuit pendant un glisser (place ouverte à sa fin, compensation de l'élément saisi) — même durée et
 * même courbe que ce déploiement (`useCircuitCardsReveal`), sur le pilote natif.
 */
const CIRCUIT_REVEAL_SHIFT_TIMING: ShiftTiming = { duration: CIRCUIT_REVEAL_DURATION_MS, easing: Easing.bezier(...CIRCUIT_REVEAL_BEZIER) };
/**
 * Recette du 29/10 (obs-3 c) : anneau extérieur du Cycle (Figma `10748:20132`, 16 de diamètre, trait
 * 1), concentrique au repère de 10 ; le rail s'arrête à son bord (3 au-delà du repère).
 */
const CYCLE_OUTER_RING_DIAMETER = 16;
const CYCLE_RING_OUTSET = (CYCLE_OUTER_RING_DIAMETER - RAIL_RING_DIAMETER) / 2;
/** PRE-9 B.2 : fond du contenu désigné en mode enveloppe — lavande du Cycle, translucide (valeur locale). */
const ENVELOPE_DESIGNATED_FILL = "rgba(234, 234, 255, 0.6)";
/** Épaisseur du contour du cadre du mode enveloppe (B.2). */
const ENVELOPE_FRAME_BORDER_WIDTH = 2;
const LAYOUT_CIRCUIT_IN_CYCLE_OUTSET = CARD_OUTSET + spacing[4];
const LAYOUT_CYCLE_GAP = CIRCUIT_GAP;
/** Recette n° 2 du 31/10 : écart entre les membres d'un conteneur (place ouverte ou refermée par l'aperçu). */
function layoutContainerGap(container: LayoutContainerRef): number {
  return container.kind === "SESSION" ? SEQUENCE_GAP : container.kind === "CYCLE" ? LAYOUT_CYCLE_GAP : CIRCUIT_GAP;
}
const NO_LAYOUT_DROP_STOP_POINTS: readonly LayoutDropStopPoint[] = [];
/** Recette iPhone n° 2 du 31/10/2026 (b6-deplacer) : Points d'arrêt de la disposition, lus par `resolveLayoutDrop`. */
function layoutDropStopPointsOf(layout: ResolvedLayout): readonly LayoutDropStopPoint[] {
  return layout.stopPoints.flatMap((point) => {
    const container = stopPointContainerOf(point);
    return container === null ? [] : [{ container, position: point.position, id: layoutStopPointId(point) }];
  });
}
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
    circuitPaddingBottom: CONTAINER_PADDING_BOTTOM,
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
    /**
     * Recette iPhone du 01/11/2026 (cr7-carte) : élément soulevé hors du Circuit replié — rang de
     * la fin du Circuit dans sa séquence mêlée (après sa dernière occurrence, avant ses Points de
     * fin), seule destination qu'il offre replié ; absent : Circuit affiché (ou déployé par l'arrêt
     * et sa géométrie relevée de nouveau).
     */
    readonly collapsedTourEnd?: number;
    /**
     * Même recette : déplacement, dans la mise en page, de l'élément soulevé depuis le début du geste
     * (Circuit déployé par l'arrêt AU-DESSUS de lui) — compensé par sa translation de registre.
     */
    readonly sourceDrift?: number;
    /**
     * Contre-recette du 01/11/2026 (m12-levee, cr7-carte : le Circuit replié « fuit ») : emplacement
     * visé juste avant l'arrêt sur le Circuit replié — son aperçu (place ouverte à côté du Circuit) reste
     * affiché pendant l'arrêt : le Circuit ne bouge pas sous le doigt.
     */
    readonly hoverBaseSlot?: DropTarget | null;
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
    CONTAINER_PADDING_BOTTOM,
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
 * Recette iPhone du 01/11/2026 (cr7-carte) : rang de la fin d'un Circuit replié dans sa séquence
 * mêlée — après sa dernière occurrence, avant ses Points d'arrêt de fin (comme `circuitEndDrop` de
 * la structure générale).
 */
function collapsedTourEndIndex(items: readonly ZoneItem[]): number {
  let end = 0;
  items.forEach((item, index) => {
    if (item.kind === "OCCURRENCE") end = index + 1;
  });
  return end;
}

/**
 * Emplacement visé sur la géométrie FIGÉE au début du geste : centre relevé de la carte glissée
 * plus son déplacement vertical, résolu par `resolveDropTarget`. Seule source de l'aperçu ET du
 * dépôt. `null` si la carte n'avait pas été mesurée.
 */
function frozenDropSlot(
  preview: NonNullable<DragShiftSession["preview"]>,
  translationY: number,
  shown: DragShifts | null = null,
): DropTarget | null {
  const row = preview.originLayout.rows.find((candidate) => candidate.id === preview.key);
  if (row === undefined) {
    return null;
  }
  // Contre-recette du 01/11/2026 (m12-levee, cr7-carte : le Circuit replié « fuit ») : replié, le
  // Circuit est visé tel qu'il est affiché (`shown` : translations courantes de ses bords), non à sa
  // place d'origine.
  const layout =
    preview.collapsedTourEnd === undefined || shown === null
      ? preview.originLayout
      : {
          ...preview.originLayout,
          tourTop: preview.originLayout.tourTop + shown.circuitTop,
          tourBottom: preview.originLayout.tourBottom + shown.circuitBottom,
        };
  const slot = resolveDropTarget(layout, preview.key, row.top + row.height / 2 + translationY);
  // Recette du 01/11/2026 (cr7-carte) : un Circuit replié n'offre que sa fin (comme dans la
  // structure générale, `layoutDropCandidates`).
  return preview.collapsedTourEnd !== undefined && slot.zone === "IN_TOUR" ? { zone: "IN_TOUR", index: preview.collapsedTourEnd } : slot;
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
    // Contre-recette n° 2 du 30/10/2026 (Hermann : « Liste qui défile derrière ») : la séquence
    // remonte sous la part fondue de la zone de contexte et défile derrière son dégradé ; au repos,
    // son haut garde sa place (`bodyContent.paddingTop`).
    marginTop: -CONTEXT_BAND_FADE_HEIGHT,
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
    paddingTop: spacing[16] + CONTEXT_BAND_FADE_HEIGHT,
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
  // Contre-recette n° 4 du 01/11/2026 : liste des cartes d'un Circuit de la disposition générale —
  // découpe animée (`useCircuitCardsReveal`, marges et hauteur) autour d'un contenu non contraint qui
  // porte l'écart entre les cartes (mêmes positions des cartes qu'auparavant).
  layoutCircuitCardsClip: {
    marginHorizontal: -CARD_OUTSET,
  },
  layoutCircuitCards: {
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
  // Recette iPhone n° 2 du 31/10/2026 (constat c) : bouton de la photo, sur le gabarit média de la carte.
  activityMediaButtonTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: OCCURRENCE_CARD_MEDIA.bottom + OCCURRENCE_CARD_MEDIA.top,
  },
  activityMediaButton: {
    position: "absolute",
    top: OCCURRENCE_CARD_MEDIA.top,
    left: OCCURRENCE_CARD_MEDIA.centerX - (OCCURRENCE_CARD_MEDIA.bottom - OCCURRENCE_CARD_MEDIA.top) / 2,
    width: OCCURRENCE_CARD_MEDIA.bottom - OCCURRENCE_CARD_MEDIA.top,
    height: OCCURRENCE_CARD_MEDIA.bottom - OCCURRENCE_CARD_MEDIA.top,
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
  // PRE-9 B.4c : l'en-tête (collant) passe au-dessus des membres de son conteneur, qui défilent dessous.
  stickyHeaderLayer: {
    zIndex: 2,
  },
  dragElevated: {
    zIndex: 1,
  },
  // PRE-9 B.4 : Circuit ou Cycle saisi — au premier plan, ombre de la carte soulevée.
  layoutBlockDragged: {
    zIndex: 2,
    shadowColor: colors.compositionDraggedCardShadow,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  // [PRE-9 B.4 (COMP §6, éclairage de la destination) : `layoutDropTarget`, cadre du Circuit ou du Cycle
  // visé — retiré par la recette iPhone n° 2 du 31/10/2026 (« Je ne veux pas d'encadré bleu »).]
  // Recette n° 2 (b6-glisser) : rangée de Point hors Circuit, débord des cartes (rail sur l'axe des médias).
  layoutStopRowOutset: {
    marginHorizontal: -CARD_OUTSET,
  },
  // Recette n° 2 : queue du rail d'un conteneur, étirée entre ses deux bords pendant l'aperçu.
  layoutRailTailTrack: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  /** Contre-recette n° 5 : prolongement de la queue du rail (1 point sous le bas du conteneur), étiré à l'écartement. */
  layoutRailTailExtension: {
    bottom: -1,
    height: 1,
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
  // Contre-recette du 30/10 (constat b) : porté par une couche (apparition progressive à la pose).
  tourSectionStaticSurface: {
    borderRadius: CIRCUIT_RADIUS,
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  // Contre-recette du 30/10 (constat b) : aplat du Circuit d'une disposition générale, porté par une
  // couche (apparition progressive à la pose).
  layoutCircuitSurface: {
    borderRadius: CIRCUIT_RADIUS,
    backgroundColor: CIRCUIT_SURFACE_COLOR,
  },
  // PRE-9 B.1b : Circuit dans un Cycle — en retrait de 4 de chaque côté, même colonne de contenu.
  layoutCircuitInCycle: {
    marginHorizontal: -LAYOUT_CIRCUIT_IN_CYCLE_OUTSET,
    paddingHorizontal: LAYOUT_CIRCUIT_IN_CYCLE_OUTSET,
  },
  // PRE-9 B.1b : Cycle pleine largeur (débord du Circuit), aplat plus soutenu, sans rayon.
  layoutCycleContainer: {
    marginHorizontal: -CIRCUIT_OUTSET,
    paddingHorizontal: CIRCUIT_OUTSET,
    paddingTop: CIRCUIT_PADDING_VERTICAL,
    // Contre-recette du 30/10 (obs-3) : 8 sous le dernier membre (carte ou Circuit), comme sous le média.
    paddingBottom: CONTAINER_PADDING_BOTTOM,
    gap: LAYOUT_CYCLE_GAP,
    // Recette du 29/10 (obs-3 c) : quatre coins arrondis (Figma `10744:20282` : 18).
    borderRadius: CIRCUIT_RADIUS,
  },
  // Contre-recette du 30/10 : aplat du Cycle porté par une couche (apparition progressive à la pose).
  layoutCycleSurface: {
    borderRadius: CIRCUIT_RADIUS,
    backgroundColor: CYCLE_SURFACE_COLOR,
  },
  // Recette du 29/10 (obs-3 c) : anneau extérieur du Cycle, concentrique au repère du rail.
  cycleOuterRing: {
    position: "absolute",
    width: CYCLE_OUTER_RING_DIAMETER,
    height: CYCLE_OUTER_RING_DIAMETER,
    borderRadius: CYCLE_OUTER_RING_DIAMETER / 2,
    borderWidth: 1,
    borderColor: TEXT_TERTIARY,
  },
  // PRE-9 B.1b : couche du panneau du choix de nature (Android / web), sur tout le contenu défilant.
  layoutPanelLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
  /** Contre-recette n° 5 : prolongement de la bande (1 point sous son bas), étiré quand les bords s'écartent. */
  circuitSurfaceExtension: {
    position: "absolute",
    bottom: CIRCUIT_RADIUS - 1,
    height: 1,
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
  // PRE-9 B.2 : action indisponible — mêmes valeurs que `CatalogueCreateOptions` (`optionDisabled`).
  addActivityTreeOptionDisabled: {
    opacity: 0.5,
  },
  addActivityTreeOptionLabelDisabled: {
    color: colors.disabled,
  },
  // PRE-9 B.2 (Figma `10819:20344`, `10836:20478`) : cible d'un contenu éligible du mode enveloppe,
  // posée sur lui — contour bleu pointillé ; désigné, contour plein et fond lavande. Épaisseur 2, fond
  // lavande translucide (le contenu reste lisible dessous) : valeurs locales NON ÉCRITES dans les
  // sources, à confronter au rendu iPhone (ARB-19).
  envelopeTarget: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: dimensions.standardCard.radius,
    borderWidth: ENVELOPE_FRAME_BORDER_WIDTH,
    borderColor: colors.primary,
  },
  envelopeTargetCandidate: {
    borderStyle: "dashed",
  },
  envelopeTargetDesignated: {
    borderStyle: "solid",
    backgroundColor: ENVELOPE_DESIGNATED_FILL,
  },
  // Contre-recette n° 4 du 01/11/2026 (b4b-etendre) : pendant le glisser d'un trait, l'aplat du cadre
  // laisse place à la part qui suit le trait (`EnvelopeMovingSegment`) ; la cible tactile reste.
  envelopeTargetMoving: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  envelopeMovingFrame: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  // PRE-9 B.4b : contenu portant le trait bas d'un périmètre, au-dessus de ses frères suivants.
  envelopeFrameRaised: {
    zIndex: 1,
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

/**
 * PRE-9 B.2 (COMP §5, ARB-19) : option du menu Créer de la Composition — sans action (`onPress`
 * absent), indisponible selon le traitement existant (« Un circuit » du menu du Catalogue,
 * `CatalogueCreateOptions`) : atténuée, inactive, nom accessible suivi de « indisponible ».
 */
