import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { isBilateral } from "@/domain/activities/ExecutionParameters";
import { DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS } from "@/domain/preferences/Profile";
import { DEFAULT_TOUR_REPEAT_COUNT } from "@/domain/sessions/defaults";
import { DEFAULT_SESSION_COLOR, type StructuralPosition } from "@/domain/sessions/Session";
import {
  DEFAULT_CIRCUIT_NATURE,
  applyNatureChange,
  circuitVolumes,
  prepareNatureChange,
  setCircuitCount,
  type CircuitLoss,
  type CircuitNature,
} from "@/domain/sessions/circuit";
import { copyCircuitReserveEntry, settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import {
  duplicateOccurrence,
  groupActivitiesByZone,
  moveOccurrence,
  removeOccurrence,
  type CompositionState,
} from "@/domain/sessions/composition";
import {
  EMPTY_PLACEMENT_DRAFT,
  applyPlacementDraft,
  hasPlacementChanges,
  placementAdditionCount,
  placementSlots,
  removePlacementRecovery,
  setOccurrenceRecovery,
  setPlacementRecovery,
  setPlacementRecoveryChange,
  togglePlacementStopPoint,
  type PlacementDraft,
  type PlacementSlot,
} from "@/domain/sessions/placement";
import {
  stopPointDisplay,
  withoutStopPoint,
  type StopPoint,
  type StopPointLocation,
} from "@/domain/sessions/StopPoint";
import {
  isSessionDraftDirty,
  sessionDraftsEqual,
  toCreateSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { hasUnpausedTransition } from "@/domain/sessions/unpausedTransitions";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { firstMediaPreviewSource } from "@/features/activities/MediaPreview";
import { useCategoriesReferential } from "@/features/activities/useCategoriesReferential";
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
  resolveDropTarget,
  resolveStepTarget,
  shouldRevealAfterSwipe,
  type ActivityRowLayout,
  type CompositionDragLayout,
  type DragShifts,
  type DropTarget,
  type StepDirection,
} from "@/features/sessions/compositionGesture";
import {
  ActivityRecoveryLine,
  isDisplayableRecovery,
  OccurrenceRecovery,
  STOP_POINT_LINE_HEIGHT,
} from "@/features/sessions/ActivityRecoveryLine";
import { CompositionContextHeader } from "@/features/sessions/CompositionContextHeader";
import {
  formatCompactDuration,
  formatCompositionSessionDuration,
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseBodyZones,
  formatOccurrenceAccessibilityLabel,
  formatOccurrenceEstimatedDuration,
  formatOccurrenceSummary,
  resolveOccurrenceCategory,
  type OccurrenceCircuitContext,
} from "@/features/sessions/compositionPresentation";
import {
  OCCURRENCE_CARD_HEIGHT,
  OCCURRENCE_CARD_MEDIA,
  OCCURRENCE_CARD_RADIUS,
  OccurrenceCard,
  occurrenceCardHeight,
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
  resolveRailLinks,
  type RailGeometry,
  type RailLink as RailLinkGeometry,
} from "@/features/sessions/compositionRail";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { STOP_POINT_CHIP_TOUCH_EXTENT } from "@/features/sessions/StopPointChip";
import { PlacementBar } from "@/features/sessions/PlacementBar";
import {
  PlacementRecoveryFrame,
  PlacementStopPointRow,
  type PlacementStopPointRowPoint,
} from "@/features/sessions/PlacementLayer";
import { focusOnNextFrame } from "@/features/sessions/deferredAccessibilityFocus";
import { measureAnchor } from "@/features/sessions/measureAnchor";
import { RemovalBubble, type RemovalBubbleAnchor } from "@/features/sessions/RemovalBubble";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { useAnimatedShiftRegistry } from "@/features/sessions/useAnimatedShift";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { RECOVERY_WHEEL_VALUES, snapToGrid } from "@/features/sessions/wheelPickerMath";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { strings } from "@/shared/i18n";
import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Champ numérique actif — un seul à la fois (CIR-10) : roulettes des bornes, ou stepper révélé
 * du compte du Circuit (PRE-6 story 3.1), ou panneau du choix de nature du Circuit (story 3.2,
 * Android / web ; sur iOS le menu natif porte seul son ouverture). PRE-6 story 3.4 : feuille
 * « Volumes du circuit » (`circuitVolumes`), ouverte par l'œil — l'ouvrir referme les autres.
 */
type OverlayKind = "countdown" | "finalPhase" | "circuitCount" | "circuitNature" | "circuitVolumes";

/** Contrôles de l'en-tête du Circuit refermés par un toucher ailleurs (RC-4). */
function isCircuitControl(kind: OverlayKind | null): boolean {
  return kind === "circuitCount" || kind === "circuitNature";
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

/** PRE-6 (story 1.2) : occurrences et Points d'arrêt du brouillon, opérés ensemble. */
function compositionStateOf(
  exercises: SessionDraft["exercises"],
  stopPoints: SessionDraft["stopPoints"],
): CompositionState {
  return { exercises, stopPoints: stopPoints ?? EMPTY_STOP_POINTS };
}

/** Patch du brouillon : les points ne sont écrits que s'ils ont changé (un brouillon sans point reste sans champ `stopPoints`). */
function compositionPatch(previous: CompositionState, next: CompositionState): Partial<SessionDraft> {
  return {
    exercises: next.exercises,
    ...(next.stopPoints !== previous.stopPoints ? { stopPoints: next.stopPoints } : {}),
  };
}

/** PRE-6 (story 2.3) : intention de déplacement d'une occurrence (glisser, « Monter » / « Descendre »). */
type OccurrenceMove = {
  readonly activityId: string;
  readonly zone: StructuralPosition;
  readonly index: number;
};

/** Déplacement en attente de confirmation de perte, avec le N affiché par le dialogue. */
type PendingOccurrenceMove = OccurrenceMove & { readonly targetCount: number };

/**
 * Plan d'un déplacement sur `draft` : correctif du brouillon (occurrences adaptées au Circuit,
 * points, réserve), pertes et N du Circuit ; `null` si `moveOccurrence` refuse le dépôt.
 */
function planOccurrenceMove(
  draft: SessionDraft,
  move: OccurrenceMove,
): { readonly patch: Partial<SessionDraft>; readonly losses: readonly CircuitLoss[]; readonly targetCount: number } | null {
  const state = compositionStateOf(draft.exercises, draft.stopPoints);
  const next = moveOccurrence(state, move.activityId, move.zone, move.index);
  if (next === state) {
    return null;
  }
  const settled = settleCircuitMembership(draft, next.exercises);
  return {
    patch: {
      ...compositionPatch(state, { exercises: settled.exercises, stopPoints: next.stopPoints }),
      ...settled.reservePatch,
    },
    losses: settled.losses,
    targetCount: settled.targetCount,
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
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  /**
   * PRE-6 (story 2.3b) : réorganisation animée pendant le glisser, en UN seul état mis à jour par
   * une seule écriture à chaque transition (début, changement d'emplacement, dépôt, annulation) —
   * aucun ordre implicite entre plusieurs `setState`. Voir `DragShiftSession`.
   */
  const [dragSession, setDragSession] = useState<DragShiftSession>(IDLE_DRAG_SESSION);
  /** Hauteur mesurée du conteneur du Circuit ; `0` tant qu'il n'est pas mesuré (fond statique). */
  const [circuitMeasuredHeight, setCircuitMeasuredHeight] = useState(0);
  // « Réduire les animations » (D-7) : décalages immédiats.
  const reduceMotion = useReduceMotion();
  // PRE-6 (story 2.3) : déplacement vers un Circuit de Séries en attente de confirmation de perte
  // — correctif du brouillon déjà calculé (adapté à N), appliqué seulement par « Confirmer ».
  const [pendingCircuitEntry, setPendingCircuitEntry] = useState<PendingOccurrenceMove | null>(null);
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
    draft.exercises.some((exercise) => exercise.id === storedPreview.activityId) &&
    (draggedActivityId !== null || pendingCircuitEntry !== null)
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
  const [recoveryWheelOccurrenceId, setRecoveryWheelOccurrenceId] = useState<string | null>(null);
  // D-307 / RM-209 : défaut de récupération du Profil (30 s initialement), relu à chaque entrée
  // en placement ; sans service Profil, la constante du Domaine. `null` tant qu'il n'est pas
  // résolu : la roulette ne s'ouvre qu'une fois la valeur connue. Une réponse tardive (après la
  // sortie du placement, une nouvelle entrée ou le démontage) est ignorée (`profileRequestRef`).
  const profileService = useContext(ProfileServiceContext);
  const [recoveryDefaultSeconds, setRecoveryDefaultSeconds] = useState<number | null>(null);
  const profileRequestRef = useRef(0);
  // Demande de focus sur « Ajouter un arrêt », à la sortie du placement par Confirmer / Annuler.
  const [addStopFocusRequest, setAddStopFocusRequest] = useState(0);
  // PRE-6 (story 4.2) : roulette « Durée de récupération » d'une récupération EXISTANTE, ouverte à
  // sa valeur — hors placement (✓ met à jour le brouillon) ou en placement (✓ va dans le
  // sous-brouillon, non compté dans N).
  const [recoveryEdit, setRecoveryEdit] = useState<RecoveryEdit | null>(null);
  // Story 4.2 : bulle « Retirer » ouverte (une seule à la fois) et focus rendu à la ligne après
  // un retrait (`occurrenceId = null` : ligne « après le Circuit »).
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [pauseFocusRequest, setPauseFocusRequest] = useState<PauseFocusRequest | null>(null);
  const closeRemovalBubble = useCallback(() => setRemovalTarget(null), []);
  /** Sortie du placement sans mutation : sous-brouillon jeté, roulette fermée, défaut en cours ignoré. */
  const leavePlacement = useCallback(() => {
    setRecoveryWheelOccurrenceId(null);
    setRecoveryEdit(null);
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
  const rowLayoutsRef = useRef(new Map<string, { top: number; height: number }>());
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const isSavingRef = useRef(false);
  // Enregistrement réussi : la garde de sortie est levée avant la fermeture (effet ci-dessous),
  // pour que `dismissTo` ne soit jamais intercepté comme un abandon.
  const [hasSaved, setHasSaved] = useState(false);
  // PRE-6 (story 4.1) : pendant le placement, toute sortie est interceptée pour annuler d'abord le
  // placement (ci-dessous), même sur un brouillon inchangé.
  const shouldBlockExit =
    !hasSaved &&
    (placement !== null ||
      (hydratedBaseline ? !sessionDraftsEqual(draft, hydratedBaseline) : isSessionDraftDirty(draft, creationBaseline)));
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    resetDraft,
  );
  // PRE-6 (story 3.1, RC-4) : le dialogue d'abandon (garde de sortie) referme le compteur révélé
  // du Circuit — ajustement pendant le rendu, au changement de `isPendingExit` (patron React
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
    // Story 4.2 : la bulle « Retirer » et la roulette de modification se referment sans mutation
    // — jamais le dialogue d'abandon par-dessus.
    if (isPendingExit && removalTarget !== null) {
      setRemovalTarget(null);
    }
    if (isPendingExit && recoveryEdit !== null) {
      setRecoveryEdit(null);
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
    // PRE-6 (story 3.1, RC-4) : « Continuer » referme le compteur révélé du Circuit.
    closeCircuitCounter();
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
      console.error("La séance n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setSaveState("error");
    }
  }

  const closeOverlay = useCallback(() => setOpenOverlay(null), []);

  const toggleOverlay = useCallback((kind: OverlayKind) => {
    Keyboard.dismiss();
    // Story 4.2 : une seule roulette à la fois, jamais sous la bulle « Retirer ».
    setRecoveryEdit(null);
    setRemovalTarget(null);
    setOpenOverlay((current) => (current === kind ? null : kind));
  }, []);

  // PRE-6 (story 3.1, RC-4) : un toucher ailleurs referme le compteur révélé du Circuit ; une
  // roulette de borne éventuellement ouverte n'est pas concernée. Story 3.2 : referme aussi le
  // panneau du choix de nature (Android / web), sans rien appliquer.
  const closeCircuitCounter = useCallback(() => {
    setOpenOverlay((current) => (isCircuitControl(current) ? null : current));
  }, []);
  // Écran quitté (perte du premier plan) : le compteur révélé se referme.
  // Story 3.2 : une conversion en attente de confirmation est aussi abandonnée (aucune mutation).
  useFocusEffect(
    useCallback(
      () => () => {
        closeCircuitCounter();
        setPendingNatureChange(null);
        // Story 3.4 : la feuille des volumes se referme aussi (aucune mutation).
        setOpenOverlay((current) => (current === "circuitVolumes" ? null : current));
        // Story 4.1 : le placement est abandonné sans mutation.
        leavePlacement();
        // Story 4.2 : bulle « Retirer » et roulette de modification refermées sans mutation.
        setRemovalTarget(null);
        setRecoveryEdit(null);
      },
      [closeCircuitCounter, leavePlacement],
    ),
  );

  /**
   * PRE-6 (story 3.4, CE-CIR-03) : l'œil ouvre « Volumes du circuit » et referme, dans le même
   * geste, le compteur révélé et le choix de nature (un seul contrôle actif, CIR-10).
   * PRE-6 story 5.1b (revue) : l'œil étant dans la zone de contexte, hors de la liste, il referme
   * aussi les actions glissées révélées et la bulle « Retirer » ; il n'ouvre rien pendant le glisser
   * d'une carte (il y est aussi désactivé).
   */
  const openCircuitVolumes = useCallback(() => {
    if (draggedActivityId !== null) return;
    Keyboard.dismiss();
    setRevealedActionsId(null);
    setRemovalTarget(null);
    volumesClosedByUserRef.current = false;
    setIsVolumesSheetMounted(true);
    setOpenOverlay("circuitVolumes");
  }, [draggedActivityId]);
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
  // Glisser (appui long) ou révéler les actions d'une carte referme aussi le compteur.
  const handleRevealActions = useCallback(
    (activityId: string | null) => {
      if (activityId !== null) {
        closeCircuitCounter();
        setRemovalTarget(null);
      }
      setRevealedActionsId(activityId);
    },
    [closeCircuitCounter],
  );
  const handleDragStart = useCallback(
    (activityId: string | null) => {
      if (activityId !== null) {
        closeCircuitCounter();
        // Story 4.2 : le glisser d'une carte referme la bulle « Retirer ».
        setRemovalTarget(null);
      }
      setDraggedActivityId(activityId);
    },
    [closeCircuitCounter],
  );

  /**
   * PRE-6 (story 4.1, AD-43, `8328:29270`) — « Ajouter un arrêt » : entrée en placement sur un
   * sous-brouillon vide. Le compteur révélé et les actions glissées se referment ; le défaut de
   * récupération du Profil est relu (valeur courante, D-307).
   */
  const isPlacementActive = placement !== null;
  const enterPlacement = useCallback(() => {
    Keyboard.dismiss();
    // Toute surface ouverte se referme, comme à la perte du premier plan : roulettes des bornes,
    // compteur et choix de nature, feuille des volumes, dialogues en attente, arbre d'ajout.
    setOpenOverlay(null);
    setPendingNatureChange(null);
    setPendingCircuitEntry(null);
    // Story 2.3b : un aperçu conservé pour le dialogue de perte abandonné revient en douceur.
    setDragSession((current) => endDragSession(current, true));
    setIsAddActivityTreeOpen(false);
    setRevealedActionsId(null);
    setRecoveryWheelOccurrenceId(null);
    setRecoveryEdit(null);
    setRemovalTarget(null);
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
  }, [profileService]);
  /** « Annuler » (et retour système) : l'état d'entrée est restitué, sans aucune mutation. */
  const cancelPlacement = useCallback(() => {
    leavePlacement();
    setAddStopFocusRequest((current) => current + 1);
  }, [leavePlacement]);
  /**
   * « Confirmer N pauses ajoutées » : une seule mise à jour fonctionnelle du brouillon
   * (`postActivityRecoverySeconds` et `stopPoints`, `applyPlacementDraft`), puis sortie du
   * placement. Disponible dès que le sous-brouillon porte un ajout ou une modification de
   * récupération existante (story 4.2, `hasPlacementChanges`), même à N = 0. Identifiants des
   * points tirés hors du calcul d'état.
   */
  const confirmPlacement = useCallback(() => {
    // Story 4.2 : une modification seule (non comptée dans N) rend aussi « Confirmer » disponible.
    if (placement === null || !hasPlacementChanges(placement)) return;
    const applied = placement;
    // Rien d'applicable sur le brouillon courant (même brouillon rendu) : aucune mise à jour.
    if (applyPlacementDraft(draft, applied, () => "") !== draft) {
      const stopPointIds = applied.stopPoints.map(() => Crypto.randomUUID());
      updateDraft((current) => {
        let next = 0;
        return applyPlacementDraft(current, applied, () => stopPointIds[next++] ?? Crypto.randomUUID());
      });
    }
    leavePlacement();
    setAddStopFocusRequest((current) => current + 1);
  }, [draft, leavePlacement, placement, updateDraft]);
  /** Récupération à ajouter : roulette ; déjà ajoutée : désélection (retirée du sous-brouillon). */
  const handlePlacementRecoveryPress = useCallback(
    (occurrenceId: string) => {
      if (placement === null) return;
      if (placement.recoveries[occurrenceId] !== undefined) {
        setPlacement((current) => (current === null ? null : removePlacementRecovery(current, occurrenceId)));
        return;
      }
      // Story 4.2 : une seule roulette à la fois.
      setRecoveryEdit(null);
      setRecoveryWheelOccurrenceId(occurrenceId);
    },
    [placement],
  );
  /** Toucher « Point d'arrêt » : bascule son ajout. */
  const handlePlacementStopPointToggle = useCallback((location: StopPointLocation) => {
    setPlacement((current) => (current === null ? null : togglePlacementStopPoint(current, location)));
  }, []);
  /**
   * PRE-6 (story 4.2) — en placement, toucher une récupération existante ouvre sa roulette à sa
   * valeur (celle déjà choisie dans le sous-brouillon, sinon celle du brouillon).
   */
  const handlePlacementExistingRecoveryPress = useCallback(
    (occurrenceId: string) => {
      if (placement === null) return;
      const seconds =
        placement.recoveryChanges[occurrenceId] ??
        draft.exercises.find((exercise) => exercise.id === occurrenceId)?.postActivityRecoverySeconds ??
        null;
      if (seconds === null) return;
      setRecoveryWheelOccurrenceId(null);
      setRemovalTarget(null);
      setRecoveryEdit(recoveryEditOf(occurrenceId, seconds, true));
    },
    [draft.exercises, placement],
  );
  /** Story 4.2 — hors placement, toucher une récupération positive ouvre sa roulette à sa valeur. */
  const handleRecoveryPress = useCallback(
    (occurrenceId: string) => {
      const seconds = draft.exercises.find((exercise) => exercise.id === occurrenceId)?.postActivityRecoverySeconds ?? null;
      if (seconds === null || seconds <= 0) return;
      Keyboard.dismiss();
      // Toute autre roulette, le compteur ou le choix de nature et la bulle se referment.
      setOpenOverlay(null);
      setRecoveryWheelOccurrenceId(null);
      setRemovalTarget(null);
      setRecoveryEdit(recoveryEditOf(occurrenceId, seconds, false));
    },
    [draft.exercises],
  );
  /**
   * ✓ de la roulette de modification : hors placement, mise à jour fonctionnelle du brouillon
   * (0 conservé comme présent, D-323 : la ligne n'affiche plus d'information) ; en placement, la
   * valeur va dans le sous-brouillon (`recoveryChanges`), appliquée par « Confirmer ».
   */
  const validateRecoveryEdit = useCallback(
    (totalSeconds: number) => {
      if (recoveryEdit === null) return;
      const { occurrenceId, inPlacement, openedSeconds } = recoveryEdit;
      setRecoveryEdit(null);
      // Roue non déplacée : rien ne change, même pour une valeur hors grille ramenée sur la grille à
      // l'ouverture (donnée historique au-delà de 300 s ou hors pas 1 / 5 / 30).
      if (totalSeconds === openedSeconds) return;
      if (inPlacement) {
        const original = draft.exercises.find((exercise) => exercise.id === occurrenceId)?.postActivityRecoverySeconds ?? null;
        setPlacement((current) =>
          current === null ? null : setPlacementRecoveryChange(current, occurrenceId, totalSeconds, original),
        );
        return;
      }
      if (setOccurrenceRecovery(draft, occurrenceId, totalSeconds) !== draft) {
        updateDraft((current) => setOccurrenceRecovery(current, occurrenceId, totalSeconds));
      }
    },
    [draft, recoveryEdit, updateDraft],
  );
  /**
   * Story 4.2 — appui long : bulle « Retirer » ancrée à l'élément touché, mesuré dans la fenêtre
   * (la bulle s'affiche dès l'appui ; sa position suit la mesure).
   */
  const openRemovalBubble = useCallback((target: RemovalTargetKey, anchorView: View | null) => {
    Keyboard.dismiss();
    // Actions glissées, roulettes, compteur et choix de nature se referment.
    setRevealedActionsId(null);
    setOpenOverlay(null);
    setRecoveryWheelOccurrenceId(null);
    setRecoveryEdit(null);
    setRemovalTarget({ ...target, anchor: null });
    // La bulle n'est montée qu'une fois l'élément mesuré ; une mesure vide la referme.
    measureAnchor(anchorView, (anchor) => {
      setRemovalTarget((current) =>
        current !== null && sameRemovalTarget(current, target) ? (anchor === null ? null : { ...current, anchor }) : current,
      );
    });
  }, []);
  /**
   * Story 4.2 — retrait d'une récupération positive (bulle ou action accessible) : absente
   * (`null`), la Pause terminale configurée est rétablie dans les durées (RM-038). Une récupération
   * à 0 n'est jamais retirée (aucun élément visible, D-303). PRE-6 story 5.1 : la récupération est
   * dans la carte ; le focus revient à la carte (`cardOnly`), jamais au point d'arrêt voisin, que le
   * retrait vienne de la bulle ou de l'action accessible de la carte.
   */
  const removeRecovery = useCallback(
    (occurrenceId: string) => {
      setRemovalTarget(null);
      const seconds = draft.exercises.find((exercise) => exercise.id === occurrenceId)?.postActivityRecoverySeconds ?? null;
      if (seconds === null || seconds <= 0) return;
      updateDraft((current) => setOccurrenceRecovery(current, occurrenceId, null));
      setPauseFocusRequest((current) => ({ occurrenceId, cardOnly: true, token: (current?.token ?? 0) + 1 }));
    },
    [draft.exercises, updateDraft],
  );
  /**
   * Story 4.2 — retrait d'un point d'arrêt (bulle ou action accessible) ; focus rendu à la ligne,
   * ou à la carte si la ligne disparaît (R absente ou 0 : décision Hermann 21/10/2026).
   */
  const removeStopPoint = useCallback(
    (stopPointId: string, occurrenceId: string | null) => {
      setRemovalTarget(null);
      if (!(draft.stopPoints ?? []).some((point) => point.id === stopPointId)) return;
      updateDraft((current) => {
        const points = current.stopPoints ?? [];
        const next = withoutStopPoint(points, stopPointId);
        return next === points ? current : { ...current, stopPoints: next };
      });
      if (occurrenceId !== null) {
        setPauseFocusRequest((current) => ({ occurrenceId, cardOnly: false, token: (current?.token ?? 0) + 1 }));
        return;
      }
      // Point « après le Circuit » : sa ligne disparaît. Focus sur la première occurrence qui suit
      // le Circuit ; sinon (PRE-6 story 5.1b, revue : l'œil est désormais en haut de l'écran, loin
      // du point retiré) sur le compteur de l'en-tête du Circuit, à défaut sur la borne « Fin de
      // séance » — les deux éléments voisins du point disparu. À l'image suivante (bulle refermée).
      const next = draft.exercises.find((exercise) => exercise.structuralPosition === "AFTER_TOUR");
      if (next !== undefined) {
        setPauseFocusRequest((current) => ({ occurrenceId: next.id, cardOnly: true, token: (current?.token ?? 0) + 1 }));
      } else {
        focusOnNextFrame(() => circuitCounterRef.current ?? finalBoundaryRef.current);
      }
    },
    [draft.exercises, draft.stopPoints, updateDraft],
  );
  /** Choisir « Retirer » dans la bulle ouverte. */
  const confirmRemoval = useCallback(() => {
    if (removalTarget === null) return;
    if (removalTarget.kind === "RECOVERY") {
      removeRecovery(removalTarget.occurrenceId);
    } else {
      removeStopPoint(removalTarget.stopPointId, removalTarget.occurrenceId);
    }
  }, [removalTarget, removeRecovery, removeStopPoint]);
  // Story 4.2 : points d'arrêt affichés hors placement (sous leur occurrence, après le Circuit).
  const displayedStopPoints = useMemo(
    () => stopPointDisplay(draft.exercises, draft.stopPoints ?? []),
    [draft.exercises, draft.stopPoints],
  );
  const pauseRowContext = useMemo<PauseRowContext>(
    () => ({
      stopPointFor: (occurrenceId) => displayedStopPoints.byOccurrenceId.get(occurrenceId) ?? null,
      onPressRecovery: handleRecoveryPress,
      onRequestRecoveryRemoval: (occurrenceId, anchor) => openRemovalBubble({ kind: "RECOVERY", occurrenceId }, anchor),
      onRemoveRecovery: removeRecovery,
      onRequestStopPointRemoval: (stopPointId, occurrenceId, anchor) =>
        openRemovalBubble({ kind: "STOP_POINT", stopPointId, occurrenceId }, anchor),
      onRemoveStopPoint: removeStopPoint,
      focusRequest: pauseFocusRequest,
    }),
    [displayedStopPoints, handleRecoveryPress, openRemovalBubble, pauseFocusRequest, removeRecovery, removeStopPoint],
  );
  // Android : le retour système annule le placement (comme « Annuler »).
  useEffect(() => {
    if (!isPlacementActive) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      cancelPlacement();
      return true;
    });
    return () => subscription.remove();
  }, [cancelPlacement, isPlacementActive]);

  // Emplacements du placement (Domaine), par occurrence et après le Circuit ; « Ajouter un arrêt »
  // est indisponible quand aucun n'offre d'ajout (Composition vide, tout est déjà présent).
  const draftSlots = useMemo(
    () => placementSlots(draft.exercises, draft.stopPoints ?? []),
    [draft.exercises, draft.stopPoints],
  );
  const hasAddableSlot = draftSlots.some(
    (slot) => slot.recovery?.kind === "AVAILABLE" || (slot.stopPoint !== null && !slot.stopPoint.existing),
  );
  const slotByOccurrence = useMemo(
    () => new Map(draftSlots.flatMap((slot) => (slot.occurrenceId === null ? [] : [[slot.occurrenceId, slot] as const]))),
    [draftSlots],
  );
  const afterCircuitSlot = draftSlots.find((slot) => slot.occurrenceId === null) ?? null;
  // Pendant le placement, durées recalculées en direct sur le brouillon tel que « Confirmer » le
  // produirait (R positive remplace la Pause terminale, story 1.3).
  const durationDraft = useMemo(
    () => (placement === null ? draft : applyPlacementDraft(draft, placement, () => "")),
    [draft, placement],
  );
  // PRE-6 (story 4.3, D-301) : avertissement non bloquant d'enchaînement sans pause, lu sur le
  // même brouillon que les durées (en placement : tel que « Confirmer » le produirait).
  const hasUnpausedWarning = useMemo(
    () =>
      hasUnpausedTransition({
        exercises: durationDraft.exercises,
        stopPoints: durationDraft.stopPoints,
        circuitNature: durationDraft.circuitNature,
        tourRepeatCount: durationDraft.tourRepeatCount,
      }),
    [durationDraft],
  );
  // `accessibilityLiveRegion` n'existe que sous Android et n'annonce pas un nœud monté : le
  // message est annoncé explicitement à chaque apparition (absent → présent).
  const wasUnpausedWarningShown = useRef(false);
  useEffect(() => {
    if (hasUnpausedWarning && !wasUnpausedWarningShown.current) {
      AccessibilityInfo.announceForAccessibility(strings.screens.composition.unpausedWarning);
    }
    wasUnpausedWarningShown.current = hasUnpausedWarning;
  }, [hasUnpausedWarning]);
  const placementRowContext = useMemo<PlacementRowContext | null>(
    () =>
      placement === null
        ? null
        : {
            draft: placement,
            slotFor: (occurrenceId) => slotByOccurrence.get(occurrenceId) ?? null,
            onPressRecovery: handlePlacementRecoveryPress,
            onPressExistingRecovery: handlePlacementExistingRecoveryPress,
            onToggleStopPoint: handlePlacementStopPointToggle,
          },
    [
      handlePlacementExistingRecoveryPress,
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
  const zones = groupActivitiesByZone(draft.exercises);
  const tourRepeatCount = draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT;
  // PRE-6 (story 2.2) : contexte de Circuit des durées d'occurrence (nom accessible, durée estimée).
  const occurrenceCircuitContext: OccurrenceCircuitContext = {
    circuitNature: draft.circuitNature,
    tourRepeatCount,
  };
  const circuitNature = draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE;

  /**
   * PRE-6 (story 3.1, AD-38, report de l'epic 1) : tout changement de N passe par
   * `setCircuitCount` — Tours : le compte seul ; Séries : les exercices du Circuit suivent N
   * (diminution en réserve, augmentation par restauration puis copie), sans message.
   */
  // Forme fonctionnelle : chaque pas (maintien compris) part du brouillon COURANT, jamais de
  // celui du rendu, et le résultat complet de `setCircuitCount` est appliqué.
  const handleCircuitCountChange = useCallback(
    (count: number) => {
      updateDraft((current) => setCircuitCount(current, count));
    },
    [updateDraft],
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
      closeCircuitCounter();
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
      if (focusPillAfterChoice) requestNatureFocus();
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
    [closeCircuitCounter, draft, openNatureConfirmation, requestNatureFocus, updateDraft],
  );

  /** Fermeture du choix par l'utilisateur (Android / web) : rien n'est appliqué, focus à la pastille. */
  const dismissNatureMenu = useCallback(() => {
    closeCircuitCounter();
    requestNatureFocus();
  }, [closeCircuitCounter, requestNatureFocus]);

  /** Toucher ailleurs (zones d'appui extérieur) : referme le contrôle de l'en-tête ouvert. */
  const handleCircuitOutsidePress = openOverlay === "circuitNature" ? dismissNatureMenu : closeCircuitCounter;

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

  const handleRowLayout = useCallback((activityId: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    rowLayoutsRef.current.set(activityId, { top: y, height });
  }, []);

  const handleTourLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    tourLayoutRef.current = { top: y, height };
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
   * Géométrie absolue (repère du contenu défilant) de toutes les cartes et
   * de la structure Tour — l'entrée de `resolveDropTarget`.
   */
  const buildDragLayout = useCallback((): CompositionDragLayout => {
    const rows: ActivityRowLayout[] = [];
    for (const activity of draft.exercises) {
      const rowLayout = rowLayoutsRef.current.get(activity.id);
      if (rowLayout === undefined) {
        continue;
      }
      rows.push({
        id: activity.id,
        zone: activity.structuralPosition,
        top: zoneBaseTop(activity.structuralPosition) + rowLayout.top,
        height: rowLayout.height,
      });
    }
    return {
      tourTop: tourLayoutRef.current.top,
      tourBottom: tourLayoutRef.current.top + tourLayoutRef.current.height,
      rows,
    };
  }, [draft.exercises, zoneBaseTop]);

  const activityAbsoluteCenterY = useCallback(
    (activity: SessionDraftExercise): number => {
      const rowLayout = rowLayoutsRef.current.get(activity.id);
      if (rowLayout === undefined) {
        return 0;
      }
      return zoneBaseTop(activity.structuralPosition) + rowLayout.top + rowLayout.height / 2;
    },
    [zoneBaseTop],
  );

  /**
   * Déplacement d'une occurrence (glisser, « Monter » / « Descendre ») — mêmes règles pour
   * tous les chemins. PRE-6 (story 1.2, ARB-3) : les Points d'arrêt suivent leur occurrence ;
   * un dépôt qui en amènerait un sur un emplacement interdit est invalide (état inchangé, la
   * carte reprend sa place). PRE-6 (story 2.3, AD-39) : entrée dans un Circuit de Séries →
   * adaptation à N, et si des séries sont perdues, confirmation AVANT toute mutation (Annuler
   * restitue la position) ; sortie du Circuit → réserve retirée, nombre et paramètres
   * conservés, sans message.
   */
  const moveActivityTo = useCallback(
    (activityId: string, zone: StructuralPosition, index: number): "APPLIED" | "REFUSED" | "PENDING" => {
      const plan = planOccurrenceMove(draft, { activityId, zone, index });
      if (plan === null) {
        return "REFUSED";
      }
      if (plan.losses.length > 0) {
        // Seule l'intention est retenue : « Confirmer » rejoue le déplacement sur le brouillon
        // COURANT (aucun instantané rejoué).
        // PRE-6 (story 3.1, RC-4) : un dialogue de décision referme le compteur révélé.
        closeCircuitCounter();
        setPendingCircuitEntry({ activityId, zone, index, targetCount: plan.targetCount });
        return "PENDING";
      }
      updateDraft(plan.patch);
      return "APPLIED";
    },
    [closeCircuitCounter, draft, updateDraft],
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
  const handleDropActivity = useCallback(
    (activity: SessionDraftExercise, translationY: number) => {
      const frozen = dragPreview !== null && dragPreview.activityId === activity.id ? frozenDropSlot(dragPreview, translationY) : null;
      const destination =
        frozen ?? resolveDropTarget(buildDragLayout(), activity.id, activityAbsoluteCenterY(activity) + translationY);
      handleDragStart(null);
      const outcome = moveActivityTo(activity.id, destination.zone, destination.index);
      if (outcome === "PENDING") {
        setDragSession((current) =>
          current.preview === null ? current : { ...current, preview: { ...current.preview, slot: destination }, animated: true },
        );
      } else {
        setDragSession((current) => endDragSession(current, outcome === "REFUSED"));
      }
    },
    [activityAbsoluteCenterY, buildDragLayout, dragPreview, handleDragStart, moveActivityTo],
  );

  /**
   * PRE-6 (story 2.3b) : début (relevé des positions, sans décalage) et fin (`null` : décalages
   * remis à 0, en douceur sauf dépôt appliqué) du glisser d'une carte.
   */
  const handleRowDragStart = useCallback(
    (activityId: string | null) => {
      if (activityId === null) {
        setDragSession((current) => endDragSession(current, true));
      } else {
        const originLayout = buildDragLayout();
        setDragSession({
          preview: { activityId, originLayout, slot: null },
          animated: true,
          circuitHeight: originLayout.tourBottom - originLayout.tourTop,
          returning: null,
        });
      }
      handleDragStart(activityId);
    },
    [buildDragLayout, handleDragStart],
  );

  /**
   * PRE-6 (story 2.3b) : emplacement d'insertion visé pendant le glisser — `frozenDropSlot`, sur
   * la géométrie figée au début du geste, le même calcul que le dépôt (`handleDropActivity`).
   * Aucune mutation du brouillon ; l'état ne change que si l'emplacement change.
   */
  const handleDragMove = useCallback((activity: SessionDraftExercise, translationY: number) => {
    setDragSession((current) => {
      const preview = current.preview;
      if (preview === null || preview.activityId !== activity.id) {
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
    const measured = dragPreview.originLayout.rows.find((row) => row.id === dragPreview.activityId)?.height;
    const insertionHeight = predictedInsertionHeight(
      draft,
      dragPreview.activityId,
      measured,
      dragPreview.slot,
      // Carte v2 (story 5.1) : 80 quelle que soit la zone ; l'écart de carte est nul.
      () => occurrenceCardHeight(),
    );
    return resolveDragShifts(
      dragPreview.originLayout,
      dragPreview.activityId,
      dragPreview.slot,
      DRAG_SHIFT_GAPS,
      insertionHeight,
    );
  }, [dragPreview, draft]);
  const animateDragShifts = dragSession.animated && !reduceMotion;
  /**
   * PRE-6 (story 5.2) : translations animées de la séquence, une par élément porteur de rail
   * (`compositionRail.ts`), dans un registre PARTAGÉ : le lien de rail d'un élément s'étire de la
   * différence entre sa translation et celle de son prédécesseur, mêmes objets animés que ceux qui
   * translatent les éléments.
   */
  const railShiftTargets = useMemo(() => {
    const targets = new Map<string, number>([[RAIL_KEYS.start, 0]]);
    for (const exercise of draft.exercises) {
      targets.set(railRowKey(exercise.id), dragShifts.rows.get(exercise.id) ?? 0);
    }
    targets.set(RAIL_KEYS.circuitHeader, dragShifts.circuitTop);
    targets.set(RAIL_KEYS.circuitEnd, dragShifts.circuitBottom);
    targets.set(RAIL_KEYS.afterCircuit, dragShifts.afterCircuit);
    targets.set(RAIL_KEYS.end, dragShifts.end);
    return targets;
  }, [dragShifts, draft.exercises]);
  const shiftRegistry = useAnimatedShiftRegistry(railShiftTargets, animateDragShifts);
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
   * registre. L'occurrence glissée (aperçu en cours), puis jusqu'à la fin de son retour en douceur
   * (`returning`), sort de la chaîne avec sa hauteur relevée au début du geste ; carte non mesurée :
   * hauteur de la carte, rangée de son point d'arrêt comprise (écart de la zone + 22).
   */
  // Revue 5.3 : en placement, rangée « après le Circuit » pour un point posé (même à un emplacement
  // que le placement ne propose plus) ou pour la puce à ajouter.
  const afterCircuitRowPoint: PlacementStopPointRowPoint | null =
    placement === null
      ? null
      : displayedStopPoints.afterCircuit !== null || afterCircuitSlot?.stopPoint?.existing === true
        ? { kind: "EXISTING" }
        : afterCircuitSlot !== null && afterCircuitSlot.stopPoint !== null
          ? { kind: "AVAILABLE", location: afterCircuitSlot.stopPoint.location }
          : null;
  const hasAfterCircuitRail =
    placement !== null ? afterCircuitRowPoint !== null : displayedStopPoints.afterCircuit !== null;
  // Revue 5.2 : en-tête du Circuit de hauteur minimale 40 (Dynamic Type) — l'anneau et ses segments
  // suivent sa hauteur mesurée ; son haut reste à la marge du Circuit (14), dans le flux.
  const circuitHeaderHeight =
    circuitHeaderLayout !== null && circuitHeaderLayout.height > 0 ? circuitHeaderLayout.height : CIRCUIT_HEADER_HEIGHT;
  const circuitHeaderRingTopY = CIRCUIT_PADDING_VERTICAL + circuitHeaderRingTop(circuitHeaderHeight);
  const railGeometry = railGeometryFor(circuitHeaderHeight);
  /**
   * Revue 5.2 : la Fin suit-elle une rangée de point d'arrêt (dernière occurrence après le Circuit,
   * ou, sans occurrence après, la rangée « après le Circuit ») ? Hors placement seulement (en
   * placement, la Fin est inactive).
   */
  const lastAfterOccurrence = zones.afterTour[zones.afterTour.length - 1];
  const finPrecededByStopPoint =
    placement === null &&
    (lastAfterOccurrence !== undefined
      ? displayedStopPoints.byOccurrenceId.get(lastAfterOccurrence.id) !== undefined
      : displayedStopPoints.afterCircuit !== null);
  const returningOccurrence = dragSession.returning;
  const railSkip =
    dragPreview !== null
      ? {
          activityId: dragPreview.activityId,
          measuredHeight: dragPreview.originLayout.rows.find((row) => row.id === dragPreview.activityId)?.height,
        }
      : returningOccurrence !== null && draft.exercises.some((exercise) => exercise.id === returningOccurrence.activityId)
        ? returningOccurrence
        : null;
  const railSkippedId = railSkip?.activityId ?? null;
  const fallbackBlockHeight = (activityId: string): number => {
    const exercise = draft.exercises.find((candidate) => candidate.id === activityId);
    const stopRow =
      displayedStopPoints.byOccurrenceId.get(activityId) !== undefined
        ? (exercise?.structuralPosition === "IN_TOUR" ? CIRCUIT_GAP : SEQUENCE_GAP) + STOP_POINT_LINE_HEIGHT
        : 0;
    return occurrenceCardHeight() + stopRow;
  };
  const railLinks = resolveRailLinks({
    beforeTour: zones.beforeTour.map((activity) => activity.id),
    inTour: zones.inTour.map((activity) => activity.id),
    afterTour: zones.afterTour.map((activity) => activity.id),
    hasAfterCircuit: hasAfterCircuitRail,
    skipped:
      railSkip === null
        ? null
        : { id: railSkip.activityId, height: railSkip.measuredHeight ?? fallbackBlockHeight(railSkip.activityId) },
    geometry: railGeometry,
  });
  // Fin du retour en douceur : l'occurrence reprend sa place dans le rail une fois toutes les
  // animations du registre terminées (immédiatement si elles sont posées sans animation).
  useEffect(() => {
    if (returningOccurrence === null) return undefined;
    return shiftRegistry.whenSettled(() =>
      setDragSession((current) => (current.returning === returningOccurrence ? { ...current, returning: null } : current)),
    );
  }, [returningOccurrence, shiftRegistry]);
  const sequenceRail: SequenceRailContext = { links: railLinks, shiftOf: railShiftOf, skippedId: railSkippedId };
  /** Lien d'un élément non occurrence (toujours présent : seule une occurrence sort de la chaîne). */
  const railLinkOf = (key: string): RailLinkGeometry | null => railLinks.get(key) ?? null;
  const headerRailLink = railLinkOf(RAIL_KEYS.circuitHeader);
  const circuitEndRailLink = railLinkOf(RAIL_KEYS.circuitEnd);
  const afterCircuitRailLink = railLinkOf(RAIL_KEYS.afterCircuit);
  const endRailLink = railLinkOf(RAIL_KEYS.end);

  // PRE-6 (story 2.3, CE-T03-08 §18) : « Monter » / « Descendre » — une position dans la
  // séquence affichée, en franchissant les limites du Circuit, mêmes règles que le glisser.
  // Une action n'est offerte que si le déplacement est accepté (`moveOccurrence`, point d'arrêt
  // sur un emplacement interdit compris).
  const stepTargetOf = useCallback(
    (activityId: string, direction: StepDirection) => {
      const destination = resolveStepTarget(draft.exercises, activityId, direction);
      if (destination === null) {
        return null;
      }
      const state = compositionStateOf(draft.exercises, draft.stopPoints);
      return moveOccurrence(state, activityId, destination.zone, destination.index) !== state ? destination : null;
    },
    [draft.exercises, draft.stopPoints],
  );
  const handleStepActivity = useCallback(
    (activityId: string, direction: StepDirection) => {
      // Comme Dupliquer / Supprimer : les actions glissées révélées se referment.
      setRevealedActionsId(null);
      const destination = stepTargetOf(activityId, direction);
      if (destination !== null) {
        moveActivityTo(activityId, destination.zone, destination.index);
      }
    },
    [moveActivityTo, stepTargetOf],
  );

  // API-COM-06 : duplication et suppression restent des opérations de
  // BROUILLON — aucune écriture persistante avant l'enregistrement final.
  const handleDuplicateActivity = useCallback(
    (activityId: string) => {
      setRevealedActionsId(null);
      const state = compositionStateOf(draft.exercises, draft.stopPoints);
      const newId = Crypto.randomUUID();
      // PRE-6 (story 1.2) : identifiant du point copié, tiré seulement si la
      // Séance porte des Points d'arrêt.
      const newStopPointId = state.stopPoints.length > 0 ? Crypto.randomUUID() : "";
      updateDraft({
        ...compositionPatch(state, duplicateOccurrence(state, activityId, newId, newStopPointId)),
        // PRE-6 (story 2.3) : la copie reçoit la réserve de Circuit de sa source (Séries).
        ...copyCircuitReserveEntry(draft, activityId, newId),
      });
    },
    [draft, updateDraft],
  );

  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      setRevealedActionsId(null);
      rowLayoutsRef.current.delete(activityId);
      const state = compositionStateOf(draft.exercises, draft.stopPoints);
      const next = removeOccurrence(state, activityId);
      // PRE-6 (story 2.3) : la réserve de Circuit de l'occurrence retirée part avec elle.
      const settled = settleCircuitMembership(draft, next.exercises);
      updateDraft({ ...compositionPatch(state, next), ...settled.reservePatch });
    },
    [draft, updateDraft],
  );

  const handleEditActivity = useCallback(
    (activityId: string) => {
      closeCircuitCounter();
      router.push({ pathname: "/exercise", params: { exerciseId: activityId } });
    },
    [closeCircuitCounter, router],
  );
  // REWORK08-C (`[ChatGPT] CHANGES_REQUESTED — REWORK08 — roulette native +
  // synthèse Tour`, 2026-09-04, addendum précédemment `QUEUED_FOR_NEXT_
  // COMPOSITION_REWORK` désormais explicitement autorisé) : calculée UNE
  // SEULE FOIS, réutilisée à la fois par `CircuitHeader` (durée sous le titre
  // « Circuit », PRE-6 story 3.1) et par `bottomAction` (synthèse déjà existante) —
  // même contenu canonique (`formatCompositionSummary`), jamais recalculé
  // ni reformulé localement pour l'un ou l'autre emplacement.
  //
  // REWORK13 (R13-02) : `initialCountdownSeconds`/`finalPhaseSeconds` ne
  // sont plus transmis — `Compte à rebours initial`/`Fin de séance` sont
  // des éléments structurels hors Tour, désormais toujours exclus de cette
  // synthèse (voir `compositionPresentation.ts`). Confirmer l'un ou
  // l'autre sélecteur n'actualise donc plus jamais `compositionSummary`,
  // par construction (ces deux champs du brouillon ne sont plus lus par
  // cette fonction).
  //
  // T02-S01 (CE-T02-01 « Calculs ») : la durée développe désormais les
  // répétitions du Tour — `tourRepeatCount` est donc transmis, et chaque pas
  // du compteur du Circuit actualise immédiatement cette synthèse. Le NOMBRE
  // affiché reste celui des Activités réellement composées, chacune une
  // seule fois.
  const compositionSummary = formatCompositionSummary({
    exercises: durationDraft.exercises,
    tourRepeatCount,
    // PRE-6 (story 1.3) : la durée du Circuit suit sa nature (Tours / Séries).
    circuitNature: draft.circuitNature,
  });
  // PRE-6 (story 2.1, RM-159) : durée de séance de l'en-tête — toutes les occurrences, sans
  // Compte à rebours ni Fin ; même formatage que le résumé du Circuit.
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
  if (editState !== "creating" && editState !== "ready") {
    return (
      <CompositionEditState
        status={editState}
        onRetry={() => retryHydration?.()}
        onBackToCatalogue={() => router.dismissTo("/")}
      />
    );
  }

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
        <CompositionContextHeader
          name={draft.name}
          onChangeName={(text) => updateDraft({ name: text })}
          onNameFocus={closeOverlay}
          sessionLabel={sessionLabel}
          sessionColor={sessionColor}
          onOpenLabelPicker={() => {
            closeCircuitCounter();
            setIsLabelPickerOpen(true);
          }}
          sessionDuration={sessionDuration}
          onAdd={() => {
            closeCircuitCounter();
            setIsAddActivityTreeOpen(true);
          }}
          onAddStop={enterPlacement}
          // PRE-6 story 5.1b (D4 remplacé par Hermann le 22/10/2026) : l'œil des Volumes, dans les
          // commandes contextuelles ; mêmes modales, même retour du focus (story 3.4).
          onOpenVolumes={openCircuitVolumes}
          volumesFocusRequest={volumesFocusRequest}
          isVolumesDisabled={draggedActivityId !== null}
          isPlacementActive={isPlacementActive}
          isAddStopDisabled={!hasAddableSlot}
          addStopFocusRequest={addStopFocusRequest}
          testID="composition-context-header"
        />
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
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        // T02-S01 (D-127/CE-T02-02) : pendant un déplacement de carte, le
        // défilement est neutralisé — le geste vertical appartient alors
        // exclusivement à la carte soulevée, jamais à la liste.
        scrollEnabled={draggedActivityId === null}
        // PRE-6 (story 3.1, RC-4) : faire défiler la liste referme le compteur révélé du Circuit.
        // Story 4.2 : il referme aussi la bulle « Retirer ».
        onScrollBeginDrag={() => {
          closeCircuitCounter();
          closeRemovalBubble();
        }}
        testID="composition-body"
      >
        {/* PRE-6 (story 3.1, RC-4) : zone d'appui extérieur du corps — voir `CounterOutsideZone`. */}
        {isCircuitControl(openOverlay) ? (
          <CounterOutsideZone onPress={handleCircuitOutsidePress} testID="composition-circuit-counter-outside" />
        ) : null}
        {/* PRE-6 (story 5.2, D-435) : plus de rail continu — chaque élément de la séquence porte ses
            segments (`compositionRail.ts`) ; le Compte à rebours porte son anneau et sa queue. */}
        {/* PRE-6 (story 4.1) : en placement, les bornes sont atténuées et non interactives. */}
        {/* Revue 5.2 : anneau et queue de la borne hors de l'atténuation du placement (opacité
            uniforme du rail), posés sur la rangée. */}
        <View testID="composition-boundary-countdown-step">
          <PlacementAttenuation active={isPlacementActive} testID="composition-boundary-countdown-placement">
            <BoundaryStep
              kind="start"
              railCenterX={RAIL_CENTER_X_IN_COLUMN}
              label={composition.countdown.label}
              value={formatDurationRowValue(draft.initialCountdownSeconds)}
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
          activities={zones.beforeTour}
          revealedActionsId={revealedActionsId}
          draggedActivityId={draggedActivityId}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          circuitContext={occurrenceCircuitContext}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          onEdit={handleEditActivity}
          onRevealActions={handleRevealActions}
          onDragStart={handleRowDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDropActivity}
          rail={sequenceRail}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
          canStep={(activityId, direction) => stepTargetOf(activityId, direction) !== null}
          onStep={handleStepActivity}
          placement={placementRowContext}
          pauses={pauseRowContext}
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
            zones.inTour.some((activity) => activity.id === draggedActivityId) ? styles.dragElevated : null,
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
              dragHeight={dragSession.circuitHeight}
              testID="composition-tour-section-surface"
            />
          ) : null}
          {/* Zone propre au conteneur Circuit — voir `CounterOutsideZone`. */}
          {isCircuitControl(openOverlay) ? (
            <CounterOutsideZone onPress={handleCircuitOutsidePress} testID="composition-circuit-counter-outside-section" />
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
            duration={compositionSummary}
            isCounterOpen={openOverlay === "circuitCount"}
            onToggleCounter={() => toggleOverlay("circuitCount")}
            onChangeCount={handleCircuitCountChange}
            // PRE-6 (story 3.2) : ouvrir le choix de nature remplace le compteur révélé (un seul
            // contrôle actif, CIR-10).
            isNatureMenuOpen={openOverlay === "circuitNature"}
            onOpenNatureMenu={() => toggleOverlay("circuitNature")}
            onCloseNatureMenu={dismissNatureMenu}
            onSelectNature={handleSelectNature}
            natureFocusRequest={natureFocusRequest}
            counterRef={circuitCounterRef}
            // PRE-6 (story 4.1) : compteur et pastille inactifs en placement. Story 5.1b : l'œil des
            // Volumes est passé dans la zone de contexte (`CompositionContextHeader`).
            isAttenuated={isPlacementActive}
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
            activities={zones.inTour}
            revealedActionsId={revealedActionsId}
            draggedActivityId={draggedActivityId}
            bodyZonesReferential={bodyZonesReferential}
            categoriesReferential={categoriesReferential}
            circuitContext={occurrenceCircuitContext}
            onLayout={handleZoneLayout}
            onRowLayout={handleRowLayout}
            onEdit={handleEditActivity}
            onRevealActions={handleRevealActions}
            onDragStart={handleRowDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDropActivity}
            rail={sequenceRail}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
            canStep={(activityId, direction) => stepTargetOf(activityId, direction) !== null}
            onStep={handleStepActivity}
            placement={placementRowContext}
            pauses={pauseRowContext}
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
                exerciseName={null}
                onToggleStopPoint={handlePlacementStopPointToggle}
                touchExtent={SEQUENCE_GAP}
                testID="composition-placement-slot-after-circuit"
              />
            ) : null}
            {placement === null && displayedStopPoints.afterCircuit !== null ? (
              <>
                <AfterCircuitStopPointLine stopPoint={displayedStopPoints.afterCircuit} pauses={pauseRowContext} />
                <RailDot
                  centerX={RAIL_CENTER_X_IN_COLUMN}
                  centerY={STOP_POINT_LINE_HEIGHT / 2}
                  testID="composition-rail-dot-after-circuit"
                />
              </>
            ) : null}
          </Animated.View>
        ) : null}

        <ActivityZoneList
          zone="AFTER_TOUR"
          testID="composition-zone-after-tour"
          activities={zones.afterTour}
          revealedActionsId={revealedActionsId}
          draggedActivityId={draggedActivityId}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          circuitContext={occurrenceCircuitContext}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          onEdit={handleEditActivity}
          onRevealActions={handleRevealActions}
          onDragStart={handleRowDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDropActivity}
          rail={sequenceRail}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
          canStep={(activityId, direction) => stepTargetOf(activityId, direction) !== null}
          onStep={handleStepActivity}
          placement={placementRowContext}
          pauses={pauseRowContext}
        />

        {/* PRE-6 (story 2.3b) : « Fin de séance » suit le décalage net du geste (`end`). */}
        <Animated.View style={{ transform: [{ translateY: endShift }] }} testID="composition-boundary-final-phase-track">
          <PlacementAttenuation active={isPlacementActive} testID="composition-boundary-final-phase-placement">
            <BoundaryStep
              kind="end"
              railCenterX={RAIL_CENTER_X_IN_COLUMN}
              // Revue 5.2 : la puce d'un point d'arrêt juste au-dessus déborde dans l'écart.
              neighborSlop={finPrecededByStopPoint ? STOP_POINT_CHIP_TOUCH_EXTENT : 0}
              label={composition.finalPhase.label}
              value={formatDurationRowValue(draft.finalPhaseSeconds)}
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
         * Aligné à droite sur la pastille (bord droit du contenu), sous l'en-tête du Circuit ;
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
      </ScrollView>

      {/*
       * CMP-06 (contre-recette iPhone, correction consolidée, 2026-09-03) :
       * zone d'action basse (`bottomAction`), poussée en bas
       * (`marginTop: "auto"`).
       *
       * REWORK09 (mission directe utilisateur, 2026-09-04, point 2
       * « CORRECTIONS CONNEXES — COMPOSITION ») : la ligne de synthèse
       * `0 activité · 0 min` précédemment affichée ICI est **supprimée** —
       * devenue redondante depuis REWORK08-C, qui affiche désormais la même
       * synthèse canonique (`compositionSummary`) directement sous le
       * titre du Circuit (`CircuitHeader`, PRE-6 story 3.1). `Continuer`
       * reste seul dans cette zone ; le style `summary` (devenu sans
       * consommateur) est supprimé avec elle plutôt que laissé mort.
       */}
      <View
        testID="composition-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        {/*
         * PRE-4, décision Q54 de Hermann (2026-10-18) : l'action enregistre depuis la Composition
         * (l'écran vestige `Catégories de la séance` est supprimé). PRE-6 (story 2.1, D-388,
         * Figma `8328:28732`) : libellé « Continuer », même flux `handleSave`.
         * Activation conditionnelle inchangée (Composition valide, `isCompositionValid`),
         * inactif pendant l'enregistrement ; échec : message D-107 au-dessus de l'action.
         */}
        {/*
         * PRE-6 (story 4.3, D-301) : message unique, informatif, au-dessus de l'action finale et de
         * la barre de placement ; il ne bloque ni « Continuer » ni l'enregistrement et disparaît dès
         * qu'aucune frontière entre Exercices ne s'enchaîne sans pause.
         */}
        {hasUnpausedWarning ? (
          <Text style={styles.unpausedWarningText} accessibilityLiveRegion="polite" testID="composition-unpaused-warning">
            {composition.unpausedWarning}
          </Text>
        ) : null}
        {/* PRE-6 (story 4.1, `8328:29423`) : en placement, la barre remplace « Continuer ». */}
        {placement !== null ? (
          <PlacementBar
            count={placementAdditionCount(placement)}
            canConfirm={hasPlacementChanges(placement)}
            onConfirm={confirmPlacement}
            onCancel={cancelPlacement}
            testID="composition-placement-bar"
          />
        ) : null}
        {placement === null && saveState === "error" ? (
          <Text style={styles.saveErrorText} accessibilityLiveRegion="polite" testID="composition-save-error">
            {composition.saveError}
          </Text>
        ) : null}
        {placement === null ? (
          <Pressable
            disabled={!isCompositionValid || saveState === "saving"}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isCompositionValid || saveState === "saving" }}
            accessibilityLabel={composition.saveAction}
            style={[styles.continueAction, !isCompositionValid || saveState === "saving" ? null : styles.continueActionEnabled]}
            testID="composition-save-action"
          >
            <Text style={styles.continueLabel}>{composition.saveAction}</Text>
          </Pressable>
        ) : null}
      </View>

      {/*
       * T01-S09, correction VISUAL (point D) : chaque roulette numérique
       * s'ouvre désormais dans `WheelPickerOverlay`, une superposition
       * plein écran rendue ici — frère direct de `ScreenShell`, jamais un
       * descendant du `ScrollView` défilant ni ancrée à sa ligne
       * déclenchrice — voir ce composant pour la justification complète.
       */}
      <WheelPickerOverlay visible={openOverlay === "countdown"}>
        <DurationWheelPicker
          totalSeconds={draft.initialCountdownSeconds}
          onValidate={(totalSeconds) => {
            updateDraft({ initialCountdownSeconds: totalSeconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>
      <WheelPickerOverlay visible={openOverlay === "finalPhase"}>
        <DurationWheelPicker
          totalSeconds={draft.finalPhaseSeconds}
          onValidate={(totalSeconds) => {
            updateDraft({ finalPhaseSeconds: totalSeconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>

      {/*
       * PRE-6 (story 4.1, `8328:28733`) : roulette « Durée de récupération » d'un emplacement —
       * 0..300 s sur la grille 1 / 5 / 30 s (CE-T03-08 §14), ouverte sur le défaut du Profil une
       * fois résolu (une récupération déjà ajoutée est retirée au toucher, jamais rouverte). ✓
       * ajoute cet emplacement (0 conservé comme présent, D-323) ; ✕ le laisse tel qu'il était.
       */}
      <WheelPickerOverlay
        visible={placement !== null && recoveryWheelOccurrenceId !== null && recoveryDefaultSeconds !== null}
      >
        {placement !== null && recoveryWheelOccurrenceId !== null && recoveryDefaultSeconds !== null ? (
          <DurationWheelPicker
            totalSeconds={recoveryDefaultSeconds}
            valueGrid={RECOVERY_WHEEL_VALUES}
            title={composition.placement.recoveryWheelTitle}
            onValidate={(totalSeconds) => {
              const occurrenceId = recoveryWheelOccurrenceId;
              setPlacement((current) =>
                current === null ? null : setPlacementRecovery(current, occurrenceId, totalSeconds),
              );
              setRecoveryWheelOccurrenceId(null);
            }}
            onCancel={() => setRecoveryWheelOccurrenceId(null)}
            minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
      </WheelPickerOverlay>
      {/*
       * PRE-6 (story 4.2) : même roulette « Durée de récupération » (grille 0..300 de la story 4.1),
       * ouverte à la valeur d'une récupération existante. ✕ ne change rien.
       */}
      <WheelPickerOverlay visible={recoveryEdit !== null}>
        {recoveryEdit !== null ? (
          <DurationWheelPicker
            totalSeconds={recoveryEdit.seconds}
            valueGrid={RECOVERY_WHEEL_VALUES}
            title={composition.placement.recoveryWheelTitle}
            onValidate={validateRecoveryEdit}
            onCancel={() => setRecoveryEdit(null)}
            minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
            secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
            cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
            validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
          />
        ) : null}
      </WheelPickerOverlay>

      {/* PRE-6 (story 4.2, `8328:29133`, `8328:33689`) : bulle « Retirer », sans second dialogue. */}
      {removalTarget !== null && removalTarget.anchor !== null ? (
        <RemovalBubble
          kind={removalTarget.kind}
          anchor={removalTarget.anchor}
          onRemove={confirmRemoval}
          onDismiss={closeRemovalBubble}
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
            if (plan !== null) {
              updateDraft(plan.patch);
            }
            // Story 2.3b : appliqué → remise à 0 sans animation avec la nouvelle disposition.
            setDragSession((current) => endDragSession(current, plan === null));
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
  readonly activities: readonly SessionDraftExercise[];
  readonly revealedActionsId: string | null;
  readonly draggedActivityId: string | null;
  readonly bodyZonesReferential: readonly BodyZone[];
  readonly categoriesReferential: readonly Category[];
  readonly circuitContext: OccurrenceCircuitContext;
  readonly onLayout: (zone: StructuralPosition, event: LayoutChangeEvent) => void;
  readonly onRowLayout: (activityId: string, event: LayoutChangeEvent) => void;
  readonly onEdit: (activityId: string) => void;
  readonly onRevealActions: (activityId: string | null) => void;
  readonly onDragStart: (activityId: string | null) => void;
  /** PRE-6 (story 2.3b) : position de la carte glissée, à chaque mouvement du doigt. */
  readonly onDragMove: (activity: SessionDraftExercise, translationY: number) => void;
  readonly onDragEnd: (activity: SessionDraftExercise, translationY: number) => void;
  /**
   * PRE-6 (story 2.3b, story 5.2) : translations animées partagées (décalage de chaque carte pendant
   * le glisser) et liens du rail segmenté.
   */
  readonly rail: SequenceRailContext;
  readonly onDuplicate: (activityId: string) => void;
  readonly onDelete: (activityId: string) => void;
  /** PRE-6 (story 2.3) : « Monter » / « Descendre » possible pour cette occurrence ? */
  readonly canStep: (activityId: string, direction: StepDirection) => boolean;
  readonly onStep: (activityId: string, direction: StepDirection) => void;
  /** PRE-6 (story 4.1) : contexte du mode placement ; `null` hors placement. */
  readonly placement: PlacementRowContext | null;
  /** PRE-6 (story 4.2) : points d'arrêt, modification et retrait des pauses hors placement. */
  readonly pauses: PauseRowContext;
};

/**
 * PRE-6 (story 4.1, AD-43) : ce que chaque occurrence reçoit en placement — sous-brouillon,
 * emplacement de l'occurrence (Domaine, `placementSlots`) et actions des puces.
 */
type PlacementRowContext = {
  readonly draft: PlacementDraft;
  readonly slotFor: (occurrenceId: string) => PlacementSlot | null;
  readonly onPressRecovery: (occurrenceId: string) => void;
  /** Story 4.2 : modification d'une récupération existante (sous-brouillon, non comptée dans N). */
  readonly onPressExistingRecovery: (occurrenceId: string) => void;
  readonly onToggleStopPoint: (location: StopPointLocation) => void;
};

/** PRE-6 (story 4.2) : roulette de modification d'une récupération existante. */
type RecoveryEdit = {
  readonly occurrenceId: string;
  /** Valeur de la récupération (peut être hors grille : donnée historique). */
  readonly seconds: number;
  /** Valeur affichée par la roue à l'ouverture (`seconds` ramenée sur la grille 0..300). */
  readonly openedSeconds: number;
  /** `true` : en placement, la valeur va dans le sous-brouillon. */
  readonly inPlacement: boolean;
};

function recoveryEditOf(occurrenceId: string, seconds: number, inPlacement: boolean): RecoveryEdit {
  return { occurrenceId, seconds, openedSeconds: snapToGrid(seconds, RECOVERY_WHEEL_VALUES), inPlacement };
}

/** PRE-6 (story 4.2) : objet visé par la bulle « Retirer ». */
type RemovalTargetKey =
  | { readonly kind: "RECOVERY"; readonly occurrenceId: string }
  | { readonly kind: "STOP_POINT"; readonly stopPointId: string; readonly occurrenceId: string | null };
type RemovalTarget = RemovalTargetKey & { readonly anchor: RemovalBubbleAnchor | null };

function sameRemovalTarget(a: RemovalTargetKey, b: RemovalTargetKey): boolean {
  if (a.kind === "RECOVERY") return b.kind === "RECOVERY" && a.occurrenceId === b.occurrenceId;
  return b.kind === "STOP_POINT" && a.stopPointId === b.stopPointId;
}

/**
 * Focus d'accessibilité rendu après un retrait : à la ligne de l'occurrence (`occurrenceId = null` :
 * ligne « après le Circuit »), ou directement à sa carte (`cardOnly`, repli après le retrait du
 * point « après le Circuit »). Si la ligne de l'occurrence disparaît avec le retrait (décision
 * Hermann 21/10/2026), elle n'est plus montée : la rangée reporte le focus sur sa carte.
 */
type PauseFocusRequest = { readonly occurrenceId: string | null; readonly cardOnly: boolean; readonly token: number };

/**
 * PRE-6 (story 4.2) : ce que chaque ligne structurelle reçoit hors placement — point d'arrêt de
 * l'emplacement, modification et retrait des pauses, focus après retrait.
 */
type PauseRowContext = {
  readonly stopPointFor: (occurrenceId: string) => StopPoint | null;
  readonly onPressRecovery: (occurrenceId: string) => void;
  readonly onRequestRecoveryRemoval: (occurrenceId: string, anchor: View | null) => void;
  readonly onRemoveRecovery: (occurrenceId: string) => void;
  readonly onRequestStopPointRemoval: (stopPointId: string, occurrenceId: string | null, anchor: View | null) => void;
  readonly onRemoveStopPoint: (stopPointId: string, occurrenceId: string | null) => void;
  readonly focusRequest: PauseFocusRequest | null;
};

/** « Point d'arrêt après {exercice} » / « … après le circuit ». */
function stopPointAccessibilityLabel(exerciseName: string | null): string {
  const t = strings.screens.composition.placement;
  return exerciseName === null
    ? t.existingStopPointAfterCircuitAccessibilityLabel
    : t.existingStopPointAccessibilityLabel.replace("{exercise}", () => exerciseName);
}

/**
 * PRE-6 (story 4.2, `8328:29428`) : ligne structurelle sous le conteneur du Circuit qui porte le
 * point « après le Circuit » (sans récupération) ; même puce, même bulle, même action accessible.
 */
function AfterCircuitStopPointLine({ stopPoint, pauses }: { stopPoint: StopPoint; pauses: PauseRowContext }) {
  const focusRequest = pauses.focusRequest;
  return (
    <ActivityRecoveryLine
      stopPoint={{
        accessibilityLabel: stopPointAccessibilityLabel(null),
        onLongPress: (anchor) => pauses.onRequestStopPointRemoval(stopPoint.id, null, anchor),
        onRemove: () => pauses.onRemoveStopPoint(stopPoint.id, null),
      }}
      focusRequest={
        focusRequest !== null && focusRequest.occurrenceId === null && !focusRequest.cardOnly ? focusRequest.token : undefined
      }
      testID="composition-after-circuit-line"
    />
  );
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
  activities,
  revealedActionsId,
  draggedActivityId,
  bodyZonesReferential,
  categoriesReferential,
  circuitContext,
  onLayout,
  onRowLayout,
  onEdit,
  onRevealActions,
  onDragStart,
  onDragMove,
  onDragEnd,
  rail,
  onDuplicate,
  onDelete,
  canStep,
  onStep,
  placement,
  pauses,
}: ActivityZoneListProps) {
  if (activities.length === 0) {
    return null;
  }
  return (
    <View
      style={[
        styles.exerciseList,
        // PRE-6 (story 5.2, D-435) : écart 9 entre les cartes du Circuit, 8 au dehors.
        zone === "IN_TOUR" ? styles.exerciseListInCircuit : null,
        // Correctif 2.3b (retour Hermann 21/10/2026) : la zone qui porte la carte soulevée passe
        // au-dessus de ses sœurs (Circuit, autres zones, bornes) ; sinon, hors de sa zone, la carte
        // glisse sous leur fond opaque (blanc ou couleur du Circuit).
        activities.some((activity) => activity.id === draggedActivityId) ? styles.dragElevated : null,
      ]}
      onLayout={(event) => onLayout(zone, event)}
      testID={testID}
    >
      {activities.map((activity, index) => (
        <CompositionActivityRow
          key={activity.id}
          activity={activity}
          position={{ index, count: activities.length }}
          areActionsRevealed={revealedActionsId === activity.id}
          isDragged={draggedActivityId === activity.id}
          isBlockedByOtherReveal={revealedActionsId !== null && revealedActionsId !== activity.id}
          bodyZonesReferential={bodyZonesReferential}
          categoriesReferential={categoriesReferential}
          circuitContext={circuitContext}
          onLayout={(event) => onRowLayout(activity.id, event)}
          onEdit={() => onEdit(activity.id)}
          onRevealActions={() => onRevealActions(activity.id)}
          onHideActions={() => onRevealActions(null)}
          onDragStart={() => onDragStart(activity.id)}
          onDragCancel={() => onDragStart(null)}
          onDragMove={(translationY) => onDragMove(activity, translationY)}
          // Story 2.3b : le dépôt (`handleDropActivity`) met lui-même fin à l'état soulevé, dans
          // un ordre explicite avec la session de décalage.
          onDragEnd={(translationY) => onDragEnd(activity, translationY)}
          rail={rail}
          onDuplicate={() => onDuplicate(activity.id)}
          onDelete={() => onDelete(activity.id)}
          onMoveUp={canStep(activity.id, "UP") ? () => onStep(activity.id, "UP") : null}
          onMoveDown={canStep(activity.id, "DOWN") ? () => onStep(activity.id, "DOWN") : null}
          placement={placement}
          pauses={pauses}
        />
      ))}
    </View>
  );
}

type CompositionActivityRowProps = {
  readonly activity: SessionDraftExercise;
  readonly areActionsRevealed: boolean;
  readonly isDragged: boolean;
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
  readonly circuitContext: OccurrenceCircuitContext;
  /** Position de l'occurrence dans sa zone, pour son nom accessible (« n sur m »). */
  readonly position: { readonly index: number; readonly count: number };
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly onEdit: () => void;
  readonly onRevealActions: () => void;
  readonly onHideActions: () => void;
  readonly onDragStart: () => void;
  readonly onDragCancel: () => void;
  /** PRE-6 (story 2.3b) : déplacement vertical courant de la carte glissée. */
  readonly onDragMove: (translationY: number) => void;
  readonly onDragEnd: (translationY: number) => void;
  /**
   * PRE-6 (story 2.3b) : décalage vertical du bloc (carte, rangée du point d'arrêt, rail) pour
   * libérer l'emplacement visé par une AUTRE carte glissée — valeur animée du registre partagé
   * (`rail.shiftOf`). PRE-6 (story 5.2) : lien du rail vers l'élément précédent.
   */
  readonly rail: SequenceRailContext;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
  /** PRE-6 (story 2.3) : action accessible « Monter » / « Descendre » ; `null` = aucune (extrémité de la séquence). */
  readonly onMoveUp: (() => void) | null;
  readonly onMoveDown: (() => void) | null;
  /** PRE-6 (story 4.1) : mode placement — carte atténuée et inactive, puces sous la carte. */
  readonly placement: PlacementRowContext | null;
  /** PRE-6 (story 4.2) : point d'arrêt de l'occurrence, modification et retrait des pauses. */
  readonly pauses: PauseRowContext;
};

/**
 * Noms des actions accessibles d'une carte d'occurrence (CE-T03-08 §18). PRE-6 story 5.1 (D-435) :
 * `modifyRecovery` / `removeRecovery` reprennent, sur la carte, le toucher et le retrait de la
 * récupération de la ligne 3 — VoiceOver n'atteint pas un bouton imbriqué dans un élément
 * accessible, et la carte en est un.
 */
type OccurrenceAccessibilityActionName =
  | "moveUp"
  | "moveDown"
  | "duplicate"
  | "delete"
  | "modifyRecovery"
  | "removeRecovery";

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
  isBlockedByOtherReveal,
  bodyZonesReferential,
  categoriesReferential,
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
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  placement,
  pauses,
}: CompositionActivityRowProps) {
  const composition = strings.screens.composition;
  const originRef = useRef<{ x: number; y: number } | null>(null);
  // Story 4.2 : focus rendu à la carte après un retrait qui ne laisse pas de point d'arrêt.
  const cardRef = useRef<View>(null);
  /**
   * Rangée sous la carte hors placement. PRE-6 story 5.1 (D-435, choix D1) : la récupération est
   * en ligne 3 de la carte ; la rangée n'existe plus que pour un point d'arrêt (rendu provisoire
   * jusqu'à la story 5.2), sans trait. Sans point : aucune rangée ni hauteur réservée.
   */
  const stopPoint = occurrenceStopPoint(activity, pauses);
  const hasRecoveryLine = stopPoint !== null;
  const pauseFocus =
    pauses.focusRequest !== null && pauses.focusRequest.occurrenceId === activity.id ? pauses.focusRequest : null;
  // Focus après un retrait (story 4.2) : au point de la rangée s'il subsiste ; sinon à la carte —
  // repli après le retrait du point « après le Circuit » (`cardOnly`, première occurrence qui suit
  // le Circuit), après le retrait du point de la rangée, qui n'est alors plus montée, ou après le
  // retrait de la récupération de la ligne 3 sans point (story 5.1). Jamais au premier rendu.
  const lineFocusToken = pauseFocus !== null && !pauseFocus.cardOnly && hasRecoveryLine ? pauseFocus.token : undefined;
  const cardFocusToken =
    pauseFocus !== null && (pauseFocus.cardOnly || (placement === null && !hasRecoveryLine))
      ? pauseFocus.token
      : undefined;
  const handledCardFocusRef = useRef(cardFocusToken);
  useEffect(() => {
    if (cardFocusToken === undefined || cardFocusToken === handledCardFocusRef.current) return undefined;
    handledCardFocusRef.current = cardFocusToken;
    return focusOnNextFrame(() => cardRef.current);
  }, [cardFocusToken]);
  const translationYRef = useRef(0);
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
        cancel.current();
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
   * Resynchronise la position de repos lorsque l'état RÉVÉLÉ change pour une
   * cause EXTÉRIEURE au geste courant de cette carte (une autre carte
   * s'ouvre, `Dupliquer`/`Supprimer` referme celle-ci) — jamais pendant le
   * balayage lui-même, qui pilote déjà `swipeTranslateX` en temps réel.
   */
  useEffect(() => {
    if (!isSwipingRef.current) {
      setSwipeTranslateX(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0);
    }
  }, [areActionsRevealed]);

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
    translationYRef.current = dy;
    return { dx, dy };
  }, []);

  /** Applique `dx` à la position de repos, borné à `[-SWIPE_REVEAL_OFFSET, 0]` — la fermeture ne peut donc jamais progresser au-delà de `0`, ni l'ouverture au-delà de `-SWIPE_REVEAL_OFFSET`. */
  const applySwipeMovement = useCallback((dx: number) => {
    isSwipingRef.current = true;
    setSwipeTranslateX(clampSwipeTranslateX(swipeBaseRef.current + dx, SWIPE_REVEAL_OFFSET));
  }, []);

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
        setDragTranslationY(dy);
        onDragMove(dy);
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        applySwipeMovement(dx);
      }
    },
    [applySwipeMovement, onDragMove, trackMovement],
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
  const handleTouchEnd = useCallback(() => {
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
    setSwipeTranslateX(shouldReveal ? -SWIPE_REVEAL_OFFSET : 0);
    if (shouldReveal && !areActionsRevealed) {
      onRevealActions();
    } else if (!shouldReveal && areActionsRevealed) {
      onHideActions();
    }
  }, [areActionsRevealed, onDragEnd, onHideActions, onRevealActions, swipeTranslateX]);

  /**
   * **Hérité de T02-S02** — le balayage engagé ne doit pas être perdu si le
   * responder est repris entre-temps : la relâche du responder applique le
   * geste au même titre que la fin de toucher. `isSwipingRef` étant consommé
   * (remis à `false`) par le premier des deux qui survient, l'opération
   * reste IDEMPOTENTE — jamais appliquée deux fois si les deux événements
   * arrivent.
   */
  const handleResponderRelease = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

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
      onDragCancel();
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
    setSwipeTranslateX(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0);
    handleResponderTerminate();
  }, [areActionsRevealed, handleResponderTerminate]);

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
  const railLink = rail.skippedId === activity.id ? undefined : rail.links.get(railKey);
  /** Écart carte → rangée du point d'arrêt / emplacement : celui de la zone (9 dans le Circuit, 8 au dehors). */
  const slotGap = activity.structuralPosition === "IN_TOUR" ? CIRCUIT_GAP : SEQUENCE_GAP;

  /** Appui LONG sur TOUTE la carte (D-127/AC-03) : engage la réorganisation. */
  const handleLongPress = useCallback(() => {
    isDraggingRef.current = true;
    onDragStart();
  }, [onDragStart]);

  const bodyZones = formatExerciseBodyZones(activity.bodyZoneIds, bodyZonesReferential);
  // PRE-6 (story 2.2) : contenu de la carte d'occurrence (`5544:6797`).
  const category = resolveOccurrenceCategory(activity.categoryId, categoriesReferential);
  const estimatedDuration = formatOccurrenceEstimatedDuration(activity, circuitContext);
  /**
   * Hauteur de la CARTE seule : 80 (carte v2, PRE-6 story 5.1, D-435), récupération comprise
   * (ligne 3). La rangée du point d'arrêt, rendue SOUS la carte hors placement, n'entre pas ici.
   */
  const blockHeight = blockHeightFor(isDragged);
  /**
   * PRE-6 (story 5.1) : récupération affichée en ligne 3 — hors placement, celle du brouillon ; en
   * placement, la valeur effective du sous-brouillon (ajout ou modification), pour ne jamais
   * contredire la puce de l'emplacement.
   */
  const displayedRecoverySeconds =
    placement === null
      ? activity.postActivityRecoverySeconds
      : (placement.draft.recoveryChanges[activity.id] ??
        placement.draft.recoveries[activity.id] ??
        activity.postActivityRecoverySeconds);
  /**
   * Toucher et appui long de la récupération (revue 5.1) : seulement quand la carte est au repos.
   * Actions glissées révélées, carte bloquée par une autre révélation, glisser en cours ou
   * placement : simple affichage, le toucher revient à la carte (neutre ou inactive).
   */
  /** Bord affiché : hors Circuit, et dans le Circuit à l'état soulevé (`activityBlockDragged`). */
  const isCardBordered = activity.structuralPosition !== "IN_TOUR" || isDragged;
  const isRecoveryInteractive = placement === null && !areActionsRevealed && !isBlockedByOtherReveal && !isDragged;
  /**
   * PRE-6 (story 5.3, D-435) : emplacement de l'occurrence en placement (Domaine, `placementSlots`,
   * inchangé) — récupération à ajouter (cadre en ligne 3), déjà présente (modifiable en ligne 3,
   * story 4.2) ou non proposée ; point d'arrêt dans la rangée sous la carte.
   */
  const placementSlot = placement === null ? null : placement.slotFor(activity.id);
  const placementRecovery = placementSlot?.recovery ?? null;
  const placementStopPoint = placementSlot?.stopPoint ?? null;
  /** Ligne 3 de la carte : cadre, récupération existante modifiable (placement) ou récupération (story 5.1). */
  let recoveryNode: React.ReactNode;
  if (placement !== null && placementRecovery?.kind === "AVAILABLE") {
    recoveryNode = (
      <PlacementRecoveryFrame
        occurrenceId={activity.id}
        exerciseName={activity.name}
        placement={placement.draft}
        onPress={placement.onPressRecovery}
        touchExtent={occurrenceRecoveryTouchExtent(isCardBordered)}
        testID={`composition-placement-slot-${activity.id}-recovery`}
      />
    );
  } else if (placement !== null && placementRecovery?.kind === "EXISTING") {
    // Story 4.2 reprise en ligne 3 : valeur effective du sous-brouillon (modification non comptée
    // dans N), touchable pour rouvrir la roulette ; affichée même à 0 (sinon plus modifiable).
    const seconds = placement.draft.recoveryChanges[activity.id] ?? placementRecovery.seconds;
    recoveryNode = (
      <OccurrenceRecovery
        recoverySeconds={seconds}
        showZero
        onPress={() => placement.onPressExistingRecovery(activity.id)}
        // Revue 5.3 : le nom désigne l'exercice, comme le cadre et la puce (la carte n'est plus lue).
        accessibilityLabel={composition.pauses.modifiableRecoveryAccessibilityLabel
          .replace("{duration}", () => formatCompactDuration(seconds))
          .replace("{exercise}", () => activity.name)}
        touchExtent={occurrenceRecoveryTouchExtent(isCardBordered)}
        testID={`composition-activity-recovery-${activity.id}-recovery`}
      />
    );
  } else {
    recoveryNode = (
      <OccurrenceRecovery
        recoverySeconds={displayedRecoverySeconds}
        {...(isRecoveryInteractive
          ? {
              onPress: () => pauses.onPressRecovery(activity.id),
              onLongPress: (anchor: View | null) => pauses.onRequestRecoveryRemoval(activity.id, anchor),
            }
          : {})}
        touchExtent={occurrenceRecoveryTouchExtent(isCardBordered)}
        testID={`composition-activity-recovery-${activity.id}-recovery`}
      />
    );
  }
  /** Rangée sous la carte : point d'arrêt hors placement (story 4.2 / 5.2), emplacement de point en placement (5.3). */
  // Revue 5.3 : en placement, un point déjà présent reste affiché (puce posée) même à un emplacement
  // que le placement ne propose plus ; sinon, la puce à ajouter si l'emplacement en offre une.
  const placementRowPoint: PlacementStopPointRowPoint | null =
    placement === null
      ? null
      : stopPoint !== null || placementStopPoint?.existing === true
        ? { kind: "EXISTING" }
        : placementStopPoint !== null
          ? { kind: "AVAILABLE", location: placementStopPoint.location }
          : null;
  const hasRowBelow = placement === null ? hasRecoveryLine : placementRowPoint !== null;
  // Même translation pour la carte et sa ligne de récupération : elles font bloc.
  const blockTransform = [{ translateX: swipeTranslateX }, { translateY: isDragged ? dragTranslationY : 0 }];
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
  /**
   * PRE-6 (story 5.1, D-435) : une récupération affichable (R > 0) hors placement ajoute
   * « Modifier la récupération » et « Retirer la récupération », mêmes effets que le toucher et la
   * bulle de la ligne 3.
   */
  const hasDisplayedRecovery = placement === null && isDisplayableRecovery(activity.postActivityRecoverySeconds);
  /** Nom accessible : la récupération affichée y figure (« …, récupération 20 s »), hors placement et en placement. */
  const accessibilityLabel = isDisplayableRecovery(displayedRecoverySeconds)
    ? `${formatOccurrenceAccessibilityLabel(activity, position, circuitContext)}, ${composition.occurrenceCard.accessibilityRecovery.replace(
        "{duration}",
        () => formatCompactDuration(displayedRecoverySeconds),
      )}`
    : formatOccurrenceAccessibilityLabel(activity, position, circuitContext);
  const accessibilityActionHandlers: Partial<Record<OccurrenceAccessibilityActionName, () => void>> = {
    ...(onMoveUp !== null ? { moveUp: onMoveUp } : {}),
    ...(onMoveDown !== null ? { moveDown: onMoveDown } : {}),
    duplicate: onDuplicate,
    delete: onDelete,
    ...(hasDisplayedRecovery
      ? {
          modifyRecovery: () => pauses.onPressRecovery(activity.id),
          removeRecovery: () => pauses.onRemoveRecovery(activity.id),
        }
      : {}),
  };
  const accessibilityActionLabels: Record<OccurrenceAccessibilityActionName, string> = {
    moveUp: composition.activityActions.moveUp,
    moveDown: composition.activityActions.moveDown,
    duplicate: composition.activityActions.duplicate,
    delete: composition.activityActions.delete,
    modifyRecovery: composition.pauses.modifyRecovery,
    removeRecovery: composition.pauses.removeRecovery,
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
          backgroundColor: isDragged
            ? "transparent"
            : activity.structuralPosition === "IN_TOUR"
              ? CIRCUIT_SURFACE_COLOR
              : colors.background,
        },
        isDragged ? styles.activityRowContainerDragged : null,
        // PRE-6 (story 2.3b) : le bloc entier (carte, ligne, repère du rail) libère la place visée.
        { transform: [{ translateY: dragShiftValue }] },
      ]}
      onLayout={onLayout}
      // VISUAL_CORRECTION (revue indépendante 5753653735, point 5) : une
      // AUTRE carte a ses actions révélées — cette carte reste bloquée
      // (aucun appui, appui long ni balayage) jusqu'à la fermeture de
      // l'autre, conformément au contrat existant (CE-T02-02).
      pointerEvents={isBlockedByOtherReveal ? "none" : "auto"}
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
      {swipeTranslateX < 0 ? (
        <View
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

      <Pressable
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
          isDragged ? styles.activityBlockDragged : null,
          // Hauteur conditionnelle dérivée en un point unique — jamais un
          // littéral par état.
          { height: blockHeight },
          // La carte SUIT le doigt horizontalement (balayage) et
          // verticalement (déplacement soulevé) — les deux restent
          // mutuellement exclusifs en pratique (`isDraggingRef`), mais la
          // transformation est toujours appliquée pour rester continue.
          { transform: blockTransform },
        ]}
        testID={`composition-exercise-row-${activity.id}`}
      >
        {/*
         * PRE-6 (story 5.1, D-435, carte v2 `9798:44464`) : contenu de la carte d’occurrence
         * (média, nom et côté, Catégorie et travail, Zones et récupération). La surface reste
         * portée par ce `Pressable` : à l’état soulevé (CE-T02-02), son fond remplace le blanc
         * derrière le contenu, sans opacité appliquée aux textes.
         *
         * Récupération en ligne 3 (story 4.2 reprise) : son `Pressable`, plus profond, prend le
         * toucher et l’appui long à la place de la carte (roulette, bulle Retirer), sans ouvrir
         * l’Exercice. En placement (story 5.3), cadre « Récupération » ou récupération existante
         * modifiable ; le reste de la carte est inactif (story 4.1).
         */}
        <OccurrenceCard
          name={activity.name}
          category={category}
          bodyZones={bodyZones}
          summary={formatOccurrenceSummary(activity)}
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

      </Pressable>

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
          {placement === null && stopPoint !== null ? (
            <RailDot
              centerX={OCCURRENCE_CARD_MEDIA.centerX}
              centerY={OCCURRENCE_CARD_HEIGHT + slotGap + STOP_POINT_LINE_HEIGHT / 2}
              testID={`composition-rail-dot-${activity.id}`}
            />
          ) : null}
        </>
      ) : null}

      {/*
       * Rangée sous l'occurrence. PRE-6 story 5.1 (D-435, choix D1) : la récupération est en
       * ligne 3 de la carte et le trait de démarcation est supprimé ; hors placement, la rangée
       * n'existe que pour un point d'arrêt (story 5.2 : rangée de 22 centrée, à l'écart de la zone
       * sous la carte, `slotGap`) : sinon aucun
       * emplacement, l'élément suivant vient à l'écart normal de la séquence. Elle suit la carte
       * (même translation) et reste dans le conteneur de l'occurrence : elle fait bloc pour le
       * déplacement, dont les mesures (`onLayout` du conteneur) intègrent ou non sa hauteur.
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
              exerciseName={activity.name}
              onToggleStopPoint={placement.onToggleStopPoint}
              touchExtent={slotGap}
              testID={`composition-placement-slot-${activity.id}`}
            />
          ) : placement === null && stopPoint !== null ? (
            // PRE-6 (story 4.2, `8328:29428`) : point d'arrêt de l'emplacement ; story 5.2 : centré.
            <ActivityRecoveryLine
              stopPoint={stopPoint}
              focusRequest={lineFocusToken}
              testID={`composition-activity-recovery-${activity.id}`}
            />
          ) : null}
        </View>
      ) : null}

    </Animated.View>
  );
}

/** PRE-6 (story 4.2) : point d'arrêt rattaché à une occurrence, prêt pour sa ligne structurelle. */
function occurrenceStopPoint(activity: SessionDraftExercise, pauses: PauseRowContext) {
  const stopPoint = pauses.stopPointFor(activity.id);
  if (stopPoint === null) return null;
  return {
    accessibilityLabel: stopPointAccessibilityLabel(activity.name),
    onLongPress: (anchor: View | null) => pauses.onRequestStopPointRemoval(stopPoint.id, activity.id, anchor),
    onRemove: () => pauses.onRemoveStopPoint(stopPoint.id, activity.id),
  };
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
 * PRE-6 (story 3.1, RC-4) — zone d'appui extérieur qui referme le compteur révélé du Circuit,
 * montée seulement pendant l'ouverture, en absolu SOUS le contenu de son parent (hors du flux et
 * de l'écart `gap`) et non accessible (VoiceOver range le champ par ses propres actions).
 *
 * Deux instances, une par parent : le corps défilant (marges et écarts entre étapes) et le
 * conteneur Circuit. Un toucher n'est proposé qu'à la vue touchée puis à ses ANCÊTRES : un appui
 * sur le fond bleu du conteneur Circuit (vue sans répondeur) remonte au conteneur, jamais à la
 * zone du corps, qui en est une sœur placée dessous. Le conteneur porte donc sa propre zone.
 */
function CounterOutsideZone({ onPress, testID }: { onPress: () => void; testID: string }) {
  return <Pressable onPress={onPress} accessible={false} style={styles.counterOutside} testID={testID} />;
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
function railGeometryFor(circuitHeaderHeight: number): RailGeometry {
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
type SequenceRailContext = {
  readonly links: ReadonlyMap<string, RailLinkGeometry>;
  readonly shiftOf: (key: string) => Animated.Value;
  readonly skippedId: string | null;
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
 * - `returning` (PRE-6 story 5.2, revue) : occurrence de l'aperçu terminé EN DOUCEUR (dépôt
 *   refusé, geste interrompu, « Annuler » d'une perte), gardée hors du rail jusqu'à la fin du retour
 *   (`whenSettled` du registre) : sinon son lien et sa queue, rendus à leur place de repos pendant
 *   que les voisines reviennent, laisseraient un trou ou chevaucheraient. Hauteur relevée au début
 *   du geste (`undefined` si la carte n'était pas mesurée).
 */
type DragShiftSession = {
  readonly preview: {
    readonly activityId: string;
    readonly originLayout: CompositionDragLayout;
    readonly slot: DropTarget | null;
  } | null;
  readonly animated: boolean;
  readonly circuitHeight: number;
  readonly returning: { readonly activityId: string; readonly measuredHeight: number | undefined } | null;
};

const IDLE_DRAG_SESSION: DragShiftSession = { preview: null, animated: true, circuitHeight: 0, returning: null };

/**
 * Fin d'aperçu : décalages remis à 0, en douceur (`animated`) ou immédiatement. En douceur,
 * l'occurrence de l'aperçu reste hors du rail jusqu'à la fin du retour (`returning`).
 */
function endDragSession(current: DragShiftSession, animated: boolean): DragShiftSession {
  if (current.preview === null && current.animated === animated) return current;
  const preview = current.preview;
  return {
    ...current,
    preview: null,
    animated,
    returning:
      !animated
        ? null
        : preview !== null
          ? {
              activityId: preview.activityId,
              measuredHeight: preview.originLayout.rows.find((row) => row.id === preview.activityId)?.height,
            }
          : current.returning,
  };
}

/**
 * Emplacement visé sur la géométrie FIGÉE au début du geste : centre relevé de la carte glissée
 * plus son déplacement vertical, résolu par `resolveDropTarget`. Seule source de l'aperçu ET du
 * dépôt. `null` si la carte n'avait pas été mesurée.
 */
function frozenDropSlot(preview: NonNullable<DragShiftSession["preview"]>, translationY: number): DropTarget | null {
  const row = preview.originLayout.rows.find((candidate) => candidate.id === preview.activityId);
  if (row === undefined) {
    return null;
  }
  return resolveDropTarget(preview.originLayout, preview.activityId, row.top + row.height / 2 + translationY);
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
  const moved = plan?.patch.exercises?.find((exercise) => exercise.id === activityId);
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
  bodyContent: {
    // PRE-6 (story 5.2, D-435) : colonne de la séquence à x 24 ; le rail est dessiné par chaque
    // élément (bornes, cartes, Circuit), plus aucune marge de repères.
    paddingLeft: spacing[24],
    paddingRight: spacing[24],
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
    // Centre = centre du bouton Retour de l’en-tête partagé (marge 24, cercle 38, centré
    // dans la hauteur de contenu 48 juste au-dessus de la zone, sans séparateur — D-353).
    left: spacing[24] + dimensions.backAction.visualCircle / 2 - BACK_HALO_DIAMETER / 2,
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
  activityRowContainerDragged: {
    zIndex: 1,
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
  activityBlockDragged: {
    marginHorizontal: -dimensions.compositionActivityRow.widthDelta / 2,
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
  // PRE-6 (story 3.1, RC-4) : zone d'appui extérieur, sous le contenu, qui referme le compteur
  // révélé du Circuit. Positionnée en absolu : hors du flux et de l'écart (`gap`).
  counterOutside: {
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
    left: spacing[24],
    right: spacing[24],
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
  bottomAction: {
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  continueAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.disabled,
  },
  // T01-S09 : même patron que `primaryAction`/`primaryActionDisabled`
  // (`ExerciseScreen.tsx`) — fond `colors.primary` uniquement pour l'état
  // activé, jamais l'inverse (`continueAction.backgroundColor` reste le
  // fond désactivé par défaut).
  continueActionEnabled: {
    backgroundColor: colors.primary,
  },
  // PRE-6 (story 4.3, D-301) : information, non une erreur — même style que l'information de
  // `ActivityMediaList` (`type.body`, `colors.textSecondary`), centrée comme l'action finale.
  unpausedWarningText: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // Q54 : style de l'ancien message d'échec de `CategoriesScreen` (D-107).
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
  continueLabel: {
    ...type.button,
    color: colors.background,
  },
});
