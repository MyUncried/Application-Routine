import { Button as SwiftUIButton, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel as swiftUIAccessibilityLabel,
  accessibilityValue as swiftUIAccessibilityValue,
} from "@expo/ui/swift-ui/modifiers";
import { Fragment, useEffect, useReducer, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ScrollView,
  type Insets,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EXECUTION_BOUNDS,
  WORK_PHASE_LIMITS,
  isBilateral,
  numberTarget,
  selectorOpeningPosition,
  seriesRowsOf,
  stopConditionOf,
  unsetTarget,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type ExecutionParametersViolation,
  type SeriesTarget,
  type SideOrder,
} from "@/domain/activities/ExecutionParameters";
import {
  applyRequestedTotal,
  canEnableWorkPhases,
  commitSheetDraft,
  effectiveParameters,
  isRequestedTotalEditable,
  isSingleSeries,
  moveRow,
  moveWorkPhase,
  openSheetDraft,
  removeRow,
  removeWorkPhase,
  setCadenceBeep,
  setCountdown,
  setEnd,
  setMode,
  setLoadEnabled,
  setSeriesCount,
  setSideMode,
  setSideOrder,
  setSideRecovery,
  setStopCondition,
  setUniformPause,
  setUniformTarget,
  setVariable,
  setWorkPhaseCount,
  setWorkPhasesEnabled,
  undoRemoval,
  type DefaultWorkPhaseLabel,
  type ExecutionSheetDraft,
  type StopConditionChoice,
} from "@/domain/activities/ExecutionParametersDraft";
import {
  computeIntrinsicDuration,
  hasDurationAmount,
  isCalculable,
  totalDurationRange,
} from "@/domain/activities/executionCalculations";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { formatLoadKg } from "@/domain/activities/exerciseLoad";
import { AnchoredPanel } from "@/features/activities/AnchoredPanel";
import {
  CADENCE_OPTION_SECONDS,
  CADENCE_OPTIONS,
  cadenceOptionOf,
  type CadenceOption,
} from "@/features/activities/cadenceOption";
import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import { KeyboardField } from "@/features/activities/KeyboardField";
import { loadOptionWidth } from "@/features/activities/loadOptionWidth";
import {
  SERIES_CHEVRON_GAP,
  SERIES_STEPPER_CIRCLE,
  SERIES_STEPPER_GAP,
  SERIES_STEPPER_VALUE_INSET,
  seriesSelectedOptionWidth,
  seriesUnselectedOptionWidth,
} from "@/features/activities/seriesTypeOptionWidths";
import {
  SHEET_MOTION_MS,
  SheetMotionGroupMount,
  SheetMotionProvider,
  SheetMotionScrollView,
  SheetMotionView,
} from "@/features/activities/SheetMotion";
import {
  INITIAL_SHEET_SURFACE_STATE,
  keyboardFieldPhase,
  keyboardFieldRow,
  removalEnabled,
  sameSurface,
  sheetCommandsAbsorbed,
  sheetSurfaceReducer,
  type KeyboardFieldId,
  type SheetStepperField,
  type SheetSurface,
} from "@/features/activities/sheetSurface";
import {
  DraggableRow,
  InsertionGuide,
  RemoveRowButton,
  TABLE_BLOCK_SIDE_INSET,
  TABLE_CELL_ACTIVE_BACKGROUND,
  TABLE_CELL_HEIGHT,
  TABLE_CELL_WIDTH,
  TABLE_ROW_HEIGHT,
  TABLE_ROW_INSET,
  tableCellStyle,
  tableCellValueStyle,
  tableRowIdentity,
  tableStyles,
  UndoMessage,
  type DraggableRowLabels,
} from "@/features/activities/sheetTable";
import { keyboardFieldOrder, useSheetKeyboard } from "@/features/activities/useSheetKeyboard";
import { PHASE_ROW_TEST_ID, WorkPhasesTable, type WorkPhaseCellKind } from "@/features/activities/WorkPhasesTable";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { WHEEL_TOTAL_DURATION_SECONDS_MAX } from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  EXECUTION_ACCELERATED_HOLD_POLICY,
  EXECUTION_UNIT_HOLD_POLICY,
  InlineStepper,
  type InlineStepperProps,
} from "@/shared/ui/ProfileStepper";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import {
  INLINE_OPTION_CONTENT_HEIGHT,
  INLINE_OPTION_CONTENT_RADIUS,
  INLINE_OPTION_WIDTHS,
  SegmentedControl,
  inlineChevronFrameStyle,
  inlineSelectedCompactLabelStyle,
  inlineSelectedLabelStyle,
} from "@/shared/ui/SegmentedControl";
import { TRANSIENT_NOTIFICATION_DURATION_MS } from "@/shared/ui/TransientNotification";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-3 (CE-UI-10, SPECIFICATION-PARAMETRES-MODALE-v13, DSF Séries
 * variables / Bip de cadence) — feuille « Paramètres d'exécution » :
 * sous-brouillon ISOLÉ du parent.
 *
 * - Ouverture : copie des paramètres du parent (`openSheetDraft`).
 * - ✕ / retour système : abandon de toute l'ouverture (`onCancel`).
 * - ✓ : **grisé tant que le mode ou une cible active exigée est invalide**
 *   (v13 §6) ; la cellule concernée est signalée et un message en ligne
 *   nomme la Série à renseigner, même tableau replié. Valide → `onApply`
 *   remplace atomiquement les paramètres du parent, sans écriture SQLite.
 * - Un seul contrôle en place ouvert à la fois (roulette native ou
 *   segmenté), démonté à la fermeture ; en-tête fixe, corps défilant.
 * - Tableau variable rattaché à la ligne « Séries » dans un groupe (story 3.3) : poignée de
 *   glisser, numéro aligné à droite, steppers cible/Pause ; déplacement
 *   aussi offert par actions accessibles (même ordre métier).
 *
 * PRE-4 (story 1.1, adaptation minimale, AC22-AC24) : le Mode n'a plus que
 * deux options (`Durée`, `Répétitions`) ; une Cible `FAILURE` (ancien mode
 * « à l'échec » migré) s'affiche « à l’échec » en lecture, sans stepper ni
 * roulette, dans la Cible commune comme dans chaque cellule ; une Cible
 * `UNSET` s'affiche « — » avec le contour d'invalidité. Le ✓ applique la
 * validation unique `validateForSave` avec la ligne de base (H25). Aucune
 * Durée totale n'est proposée tant qu'une Cible est à l'échec. Le Sélecteur
 * de cible et les popovers viennent avec l'Epic 3.
 *
 * PRE-4 story 3.3 (AD-15, FR-03-05, FR-03-09, FR-04-01) :
 * - une seule surface ouverte dans toute la Feuille (`openSurface`, réducteur pur
 *   `sheetSurface.ts`, état d'interface, jamais dans le Brouillon) : popover du
 *   Mode, panneaux Changement de côté, Ordre des côtés et Régime, roues de la Cible
 *   commune et de la Durée totale, ou un champ ± ;
 * - l'interrupteur « Séries variables » est remplacé par le champ de Régime de la
 *   ligne `Séries` (`identiques` / `variables`) ; même panneau sans flèche que le
 *   Changement de côté et l'Ordre sur iOS (Q43), segmenté en ligne sur Android et
 *   le web ; non modifiable à N = 1 (P16) ;
 * - N, les Pauses, le Bip, le Compte à rebours et la Fin n'affichent au repos que
 *   leur valeur ; l'appui fait apparaître `InlineStepper`, inchangé (AD-16) ;
 * - Changement de côté non renseigné affiché `—` (FR-11-05).
 *
 * PRE-4 story 3.6, réduite par Q44 (Hermann, 2026-10-17 : ni Cellule active ni Pied
 * commun) — Tableau des séries variables (AD-8, AD-15, AD-16, FR-10-03, FR-12-05, Q13,
 * Q26, Q29, Q35, Q41) :
 * - [remplacé par PRE-5 story 2.6 : cellules à valeur seule, sans ± permanents] les
 *   cellules gardent leurs `InlineStepper` permanents ; la règle du pas de la Cible
 *   est celle du domaine (`stepTarget` : `FAILURE` → ± indisponibles, `UNSET` → + donne
 *   la valeur minimale, − indisponible ; hors bornes → valeur voisine dans le sens du geste) ;
 * - toucher la VALEUR d'une cellule de Cible (`30 s`, `à l’échec`, `—`) ouvre le
 *   Sélecteur de la story 3.4 (Durée) ou 3.5 (Répétitions) de cette ligne, dans le
 *   panneau sans flèche sous la cellule (Q41) ; ✓ applique à cette seule ligne, ✕ et
 *   toucher extérieur ferment sans appliquer ; une seule surface ouverte ;
 * - croix de retrait (`removeRow`) active seulement sans surface ni champ ± ouvert, puis
 *   « Série supprimée — Annuler » par le message d'ajustement existant (`undoRemoval`, Q29) ;
 * - glisser PRE-3 (`DraggableRow`) et actions accessibles monter / descendre inchangés.
 *
 * PRE-5 story 2.4 (AD-23, AD-24, AD-27, AD-28 ; FR-19 à FR-22, FR-26 à FR-28, FR-32) :
 * - quatre cadres gris (`SheetMotionView`) : Exécution (Mode, Condition d'arrêt) ;
 *   Séries (Type de série portant le nombre de séries, tableau, Durée ou Répétitions, Pause) ;
 *   Côtés ; Cadence et durée. Les panneaux sont placés par une seule fonction
 *   (`anchorTop` : y du cadre + y dans le cadre) et rendus hors des cadres ;
 * - Mode, Condition d'arrêt et Type de série sont des segmentés `inline` : plus de
 *   popover natif du Mode ni de panneau du Régime (`popover(mode | regime)` retirées) ;
 * - Condition d'arrêt : segmenté en identiques (`setStopCondition`), résultat dérivé
 *   en lecture seule en variables (`stopConditionOf`, seule autorité) ; à l'échec, la
 *   ligne de cible est masquée ; les roues de la Cible commune n'offrent plus
 *   « À l'échec », celle d'une cellule variable la garde en tête (Q8) ;
 * - stepper « Nombre de séries » de PRE-4 : règles, bornes, transitions et accessibilité
 *   inchangées (NR Δ38) ; recette du 20/10 (RC-15) : plus de ligne propre, le nombre est porté
 *   par l'option sélectionnée du Type de série (« 3 séries identiques » / « 3 séries variables »
 *   et chevron du tableau) ; son toucher révèle le stepper « − | 3 séries | + » dans l'option
 *   (Figma `9436:18305`), toucher la valeur le referme (RC-4). Même brique que le nombre de
 *   phases (`SegmentCountField`, story 2.8). Recette du 20/10 (RC-17) : la ligne s'intitule
 *   « Séries » ; stepper ouvert, le chevron du tableau est grisé et indisponible (son appui ferme
 *   le stepper) ; l'activation d'une cellule du tableau ferme le stepper (une seule surface).
 *
 * PRE-5 story 2.6 (AD-27, AD-28, FR-29 ; UX-DR3) — tableau des séries variables : bloc
 * blanc, lignes de 36, cellules à valeur seule (plus de ± permanents : Q44 remplacé).
 * Poignée, croix, repère d'insertion et message d'annulation viennent des briques partagées
 * (`sheetTable.tsx`), réutilisables par le tableau des phases (2.8).
 *
 * PRE-5, D-434 (décision de Hermann du 19/10 ; QD-434-1 à 4) — les cellules Cible (Durée en
 * « MM:SS », Répétitions en entier) et Pause (« MM:SS ») se saisissent au clavier numérique
 * natif, dans la cellule (`KeyboardField` en mode cellule, surface `keyboard`) ; la Charge
 * d'une ligne aussi, au clavier décimal. Plus de roue de cellule (`selector(rowTarget)`) ni
 * de ± de Pause de cellule (`stepper(rowPause)`). La barre du clavier porte « À l'échec »
 * pour une cellule Cible (`toggleRowFailure`) ; Précédent / Suivant parcourent le tableau
 * ligne par ligne, de gauche à droite.
 *
 * PRE-5 story 2.2 (AD-26, AD-27, FR-23 à FR-25, NFR-6) — essai du champ clavier de la
 * charge, posé à sa place définitive : ligne « Charge » (Avec / Sans) en dernier dans le
 * cadre Séries, avec le champ commun en identiques ; colonne Charge du tableau en
 * variables. Saisie au clavier décimal natif (`KeyboardField`), barre Précédent / Suivant /
 * « Fermer » (`KeyboardAccessoryBar`, iOS, rendue par la Feuille au-dessus du clavier depuis
 * la recette du 19/10, RC-1), surface `keyboard` et synchronisation focus /
 * surface / application dans un seul hook (`useSheetKeyboard`) ; la saisie en cours est
 * appliquée (`keyboard.flush`) avant toute autre transition du même geste.
 *
 * PRE-5 story 2.5 (AD-21, AD-24, AD-27, AD-28, D-431 ; FR-15 à FR-17, FR-30, FR-31) :
 * - cadre Côtés : « Changement de côté » en segmenté `inline` Avec / Sans (Avec ⇔
 *   `isBilateral`, Sans → Avec : `setSideMode(…, "RIGHT_LEFT", Profil)`, copie P3-10).
 *   Recette du 19/10 (RC-6, Figma `9462:18987`) : plus de ligne « Enchainement » ni de chevron
 *   de repli ; l'option Avec (N > 1) porte la notation de l'Enchainement (`sideOrderSubtitles`,
 *   nom accessible `sideOrders`) et, sélectionnée, ouvre le menu natif des deux notations
 *   (`SideOrderMenu`). Pause entre les côtés visible sous Avec. `popover(side | order)` retirées ;
 *   recette du 20/10 (RC-13) : la notation n'est affichée que si Avec est sélectionné (N > 1),
 *   dans une option élargie (146) ; sinon Avec affiche « Avec », de 62 comme Sans ;
 * - cadre Cadence et durée : « Cadence » en segmenté Autre / 1 s / Sans (RC-10)
 *   (`cadenceOptionOf`) ; Autre révèle le ± existant (`stepper(beep)`) sous la ligne.
 *   « Durée de l'exercice » porte le `DisclosureControl` existant, replié par défaut, qui
 *   masque Compte à rebours et Fin sans changer leurs valeurs ; ligne absente → signaux
 *   visibles sans chevron ; Exercice ouvert depuis une Séance (`exerciseSignals="absent"`) :
 *   ni signaux, ni chevron.
 *
 * PRE-5 story 2.8 (FR-2 à FR-9, FR-27 à FR-29, FR-32 ; AD-20, AD-24 à AD-27 ; D-432, D-434) —
 * phases de l'exercice, sans nouvelle règle métier (toutes viennent des transitions du
 * Brouillon de la story 2.1) :
 * - ligne « Phases de l'exercice » en tête du cadre Séries, segmenté `inline` Avec / Sans (Sans
 *   par défaut ; Avec disponible si `canEnableWorkPhases` ou si des phases existent). Avec
 *   sélectionné affiche « n phases » (`selectedContent`) et le chevron existant du tableau
 *   (haut déployé, bas replié ; son appui ne fait que replier ou déployer). Toucher « n phases »
 *   révèle le stepper existant (`InlineStepper` sans pilule, 2..6, surface `stepper(phaseCount)`),
 *   toucher sa valeur le referme (RC-4) ; + et − passent par `setWorkPhaseCount`, − retire la
 *   dernière phase avec « Phase supprimée — Annuler » ;
 *   Recette du 20/10 (RC-16) : chevron rendu par le contenu (place réservée), option de 104 /
 *   150 ; réglage ouvert « − | n phases | chevron | + » sur `#EAEAFF`, chevron indisponible ;
 *   RC-17 : l'activation d'un champ du tableau (libellé, durée) ferme le réglage (une seule
 *   surface) et rend le chevron actif ;
 * - tableau des phases (`WorkPhasesTable`) : libellé au clavier texte et durée au clavier
 *   numérique MMSS (`keyboard(phaseLabel | phaseDuration)`), glisser, actions accessibles,
 *   croix (indisponible à deux phases, QR-1) ;
 * - avec des phases, « Durée d'une série » est la somme, en lecture seule ;
 * - ✓ : `commitSheetDraft` reçoit le libellé par défaut « Phase n » (normalisation FR-9).
 */
export type ExecutionParametersSheetProps = {
  readonly parent: ExecutionParametersInput;
  /** PRE-4 (AD-13) : ligne de base relue à l'ouverture de l'Éditeur ; `null` (défaut) en création. */
  readonly baseline?: ExecutionParametersInput | null;
  /** Pause entre les côtés du Profil, copiée à l'ACTIVATION du changement de côté (P3-10). */
  readonly profileSideRecoverySecondsDefault: number;
  /**
   * PRE-5 story 2.5 (AC4, D-409, RM-218) : Compte à rebours et Fin d'exercice. `"present"`
   * (défaut) : rendus, repliés sous « Durée de l'exercice » quand cette ligne existe.
   * `"absent"` (Exercice ouvert depuis une Séance) : ni lignes ni chevron ; les valeurs du
   * Brouillon sont conservées telles quelles.
   */
  readonly exerciseSignals?: "present" | "absent";
  readonly onApply: (parameters: ExecutionParameters) => void;
  readonly onCancel: () => void;
};

const t = strings.executionParameters.sheet;

/** Type de série affiché par la ligne « Type de série » (FR-27) ; le Brouillon garde son booléen `variable`. */
type SeriesType = "VARIABLE" | "UNIFORM";
/** PRE-5 story 2.5 (FR-15) : option du segmenté « Changement de côté » ; le Brouillon garde `sideMode`. */
type SideChoice = "WITH" | "WITHOUT";
/** PRE-5 story 2.8 (FR-4) : option du segmenté « Phases de l'exercice » ; le Brouillon garde `workPhases`. */
type PhaseChoice = "WITH" | "WITHOUT";

/**
 * PRE-5 story 2.8 (FR-9, AD-20, QN-3) : libellé par défaut d'une phase selon sa position
 * (« Phase n »), tiré du lexique et fourni au domaine, qui n'importe pas l'i18n.
 */
const defaultPhaseLabel: DefaultWorkPhaseLabel = (position) => t.phaseDefault.replace("{n}", String(position));
/** PRE-5 story 2.8 (D-432) : valeur affichée du nombre de phases (« 3 phases », n ≥ 2). */
const phaseCountLabel = (count: number | null) =>
  count === null ? t.unset : (count === 1 ? t.workPhaseCountSingular : t.workPhaseCount).replace("{n}", String(count));

/**
 * PRE-5 story 2.8 (D-432) ; recette du 20/10 (RC-16) — largeur de l'option Avec de la ligne
 * « Phases de l'exercice », métriques Inter de l'application, constantes locales (aucun jeton
 * modifié, NFR-3). Le plus large libellé, « 4 phases » Semi Bold 12, mesure 53,0 :
 * - Sans sélectionné : 62 (largeur commune `narrow`, Sans garde toujours 62) ;
 * - Avec, réglage fermé : marge 17 (celle de « Sans », Regular 12 27,9 dans 62) + libellé 53,0 +
 *   écart 6 + chevron 10 + marge 17 = 103,0 → 104 ; la place du chevron est toujours réservée ;
 * - Avec, réglage ouvert (− | n phases | chevron | +) : marge 4 + − 28 + écart 8 + valeur 53,0 +
 *   écart 6 + chevron 10 + écart 8 + + 28 + marge 4 = 149,0 → 150.
 * Relevé à reporter dans Figma (`_bmad-output/pre5/ajustement-figma-phases.md`, § Géométrie).
 */
const PHASE_OPTION_CLOSED_WIDTH = 104;
const PHASE_OPTION_OPEN_WIDTH = 150;

/** Surfaces de la Feuille (AD-15). */
const TARGET_SELECTOR: SheetSurface = { kind: "selector", selector: "commonTarget" };
const TOTAL_SELECTOR: SheetSurface = { kind: "selector", selector: "total" };
const stepperSurface = (field: SheetStepperField): SheetSurface => ({ kind: "stepper", field });

/**
 * D-4 : temps laissé au cadre du segmenté pour rejoindre la valeur choisie, avant
 * le repli du sélecteur. Q40 (Hermann, 2026-10-17, E-14) : porté de 220 à 350 ms,
 * en cohérence avec `SHEET_MOTION_MS` (apparitions plus lentes).
 */
export const SELECTOR_SETTLE_MS = SHEET_MOTION_MS;

/**
 * Réglage iOS « Réduire les animations » (D-4, D-7, D-8). Lu au montage puis
 * suivi en direct ; `false` tant que la lecture n'a pas répondu.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

/**
 * PRE-5 story 2.6 (AD-27, FR-4) : briques du tableau extraites dans `sheetTable.tsx`,
 * ré-exportées ici pour les tests existants.
 */
export { dragDestination, TABLE_ROW_HEIGHT, tableRowIdentity } from "@/features/activities/sheetTable";

/**
 * Q41 : champs dont le contrôle s'ouvre, sur iOS, dans un panneau sans flèche sous le
 * champ. PRE-5 story 2.4 : le Régime (Type de série) n'a plus de panneau (segmenté en ligne) ;
 * PRE-5 story 2.5 : le Changement de côté et l'Enchainement non plus.
 */
type PanelControl = "uniformDuration" | "uniformRepetitions" | "total";
type Box = { readonly y: number; readonly height: number };
const NO_BOX: Box = { y: 0, height: 0 };
const sameBox = (box: Box | undefined, y: number, height: number) => box !== undefined && box.y === y && box.height === height;
/**
 * PRE-5 story 2.4 (FR-26, AD-28) — les quatre cadres de la Feuille, dans l'ordre :
 * Exécution ; Séries ; Côtés ; Cadence et durée.
 */
type SheetFrame = "execution" | "series" | "sides" | "cadence";
const SHEET_FRAMES: readonly SheetFrame[] = ["execution", "series", "sides", "cadence"];
/** Boîte d'un cadre dans le contenu défilant (hôte des panneaux), mesurée par `onLayout`. */
type FrameBox = { readonly y: number; readonly height: number; readonly width: number };
/** AD-28 : cadre de la ligne qui ouvre chaque panneau (repère unique, `anchorTop`). */
const PANEL_FRAME: Readonly<Record<PanelControl, SheetFrame>> = {
  uniformDuration: "series",
  uniformRepetitions: "series",
  total: "cadence",
};
/**
 * Message d'ajustement (D-5) : l'Inversion du total garde l'état d'avant pour `Annuler` ;
 * le retrait d'une ligne (story 3.6) n'en garde aucun, `undoRemoval` du Brouillon suffit.
 */
type Adjustment =
  | { readonly kind: "total"; readonly message: string; readonly previous: ExecutionSheetDraft }
  | { readonly kind: "removal"; readonly message: string }
  /** PRE-5 story 2.8 (FR-8) : « Phase supprimée — Annuler », rendu sous le tableau des phases (`undoRemoval`). */
  | { readonly kind: "phaseRemoval"; readonly message: string };

/** Q41 : écart entre le bas de la ligne du champ et le haut du panneau (valeur d'intégration, non tirée de Figma). */
const PANEL_GAP = spacing[4];
/** Q41 : identifiants des panneaux. */
const PANEL_TEST_IDS: Readonly<Record<PanelControl, string>> = {
  uniformDuration: "execution-sheet-target-panel",
  // Story 3.5 : même panneau de la Cible commune, en Répétitions (un seul Mode affiché).
  uniformRepetitions: "execution-sheet-target-panel",
  total: "execution-sheet-total-panel",
};
/** Q41 : la zone de toucher extérieur couvre aussi les marges du corps défilant (`bodyContent`). */
const PANEL_OUTSIDE_INSETS = { top: spacing[12], right: spacing[24], bottom: spacing[24], left: spacing[24] };

/** Durée de montée de la feuille (prototype figé : ouverture 0,25 s, ease-out). */
const SHEET_ENTRY_DURATION_MS = 250;
/**
 * Hauteur minimale des lignes de la Feuille : 44 pt, pour que les ± et les pastilles
 * aient une cible tactile verticale de 44 pt (NFR-09). Décision Q42 de Hermann du
 * 2026-10-17 (recette iPhone) ; remplace les 42 pt du DSF et du code PRE-3. Aucun jeton
 * modifié (`minTouchTarget` vaut 48 et sert à d’autres surfaces). PRE-5 story 2.6
 * (AD-28) : les lignes des tableaux passent à 36 (`TABLE_ROW_HEIGHT`, `sheetTable.tsx`).
 */
export const SHEET_ROW_MIN_HEIGHT = 44;

/**
 * Largeur DSF des steppers à 402 : premier niveau 137 (D-434 : plus de ± de Pause de
 * cellule ni de sa largeur de tableau, 128).
 */
const STEPPER_WIDTH = 137;

/** PRE-5 story 2.6 : libellés de la ligne déplaçable du tableau des séries (gabarits à `{n}`). */
const SERIES_ROW_LABELS: DraggableRowLabels = { handle: t.moveHandle, row: t.row, moveUp: t.moveUp, moveDown: t.moveDown };
const SERIES_ROW_TEST_ID = "execution-sheet-table-row";
/** PRE-5 story 2.2 (AD-28), D-434 : cellule clavier de 24 (Cible, Pause, Charge), cible tactile de 36. */
const KEYBOARD_CELL_HIT_SLOP = { top: (TABLE_ROW_HEIGHT - TABLE_CELL_HEIGHT) / 2, bottom: (TABLE_ROW_HEIGHT - TABLE_CELL_HEIGHT) / 2 };
/** PRE-5 story 2.2 : champ de la charge commune. */
const UNIFORM_LOAD_FIELD: KeyboardFieldId = { kind: "load", row: "uniform" };
/** D-434 : champs clavier d'une cellule du tableau des séries (ligne d'identité `row`). */
type RowCellKind = "rowTarget" | "rowPause" | "load";
const rowCellField = (kind: RowCellKind, row: number): KeyboardFieldId => ({ kind, row });
/** Option du segmenté de la ligne Charge (FR-23). */
type LoadChoice = "WITH" | "WITHOUT";

function seriesLabel(count: number | null): string {
  if (count === null) return t.unset;
  return `${count} ${count === 1 ? t.seriesSingular : t.seriesPlural}`;
}

/** Recette du 20/10 (RC-15) : option sélectionnée du Type de série (« 3 séries identiques », « 1 série identique »). */
function seriesTypeCountLabel(count: number, seriesType: SeriesType): string {
  const template =
    seriesType === "VARIABLE"
      ? count === 1
        ? t.seriesCountVariableSingular
        : t.seriesCountVariable
      : count === 1
        ? t.seriesCountUniformSingular
        : t.seriesCountUniform;
  return template.replace("{n}", String(count));
}

/** Indice d'accessibilité d'une valeur signalée, selon la violation (PRE-4). */
const invalidHintFor = (code: ExecutionParametersViolation["code"]) =>
  code === "REQUIRED" ? t.invalidHint : t.invalidValueHint;

/** Valeur numérique affichée d'une Cible : `null` pour « — » (`UNSET`) ou une Cible non numérique. */
const targetNumber = (target: SeriesTarget): number | null => (target.kind === "NUMBER" ? target.value : null);
const secondsLabel = (value: number | null) => (value === null ? t.unset : formatPhraseDuration(value));
/**
 * Story 3.8 (AC2, AC4, FR-22-08, H23) : texte annoncé d'une valeur affichée. Le « — »
 * d'une valeur non renseignée est annoncé « aucune valeur » (lexique), jamais lu comme
 * un tiret ; toute autre valeur est annoncée telle qu'affichée.
 */
const spokenValue = (display: string) => (display === t.unset ? t.unsetSpoken : display);
/** Pause (« 0 s » compris) : formateur unique du domaine (AD-5). */
const pauseLabel = (value: number | null) => (value === null ? t.unset : formatPhraseDuration(value));
/** PRE-5 story 2.5 : valeur du ± de la Cadence (0 → « Sans », comme l'option du segmenté). */
const beepLabel = (value: number | null) => (value === null ? t.unset : value === 0 ? t.cadenceOptions.NONE : `${value} s`);
const repetitionsLabel = (value: number | null) => (value === null ? t.unset : `${value} ${t.repetitionsUnit}`);
/** Story 3.5 (AC7, H13) : nombre de la roue annoncé avec son unité (« 1 répétition », « 12 répétitions »). */
const repetitionsSpoken = (value: number) =>
  (value === 1 ? t.repetitionsSpokenSingular : t.repetitionsSpokenPlural).replace("{n}", String(value));

export function ExecutionParametersSheet({
  parent,
  baseline = null,
  profileSideRecoverySecondsDefault,
  exerciseSignals = "present",
  onApply,
  onCancel,
}: ExecutionParametersSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [draft, setDraft] = useState<ExecutionSheetDraft>(() => openSheetDraft(parent));
  // Story 3.3 (AD-15) : surface ouverte unique — roue (panneau sur iOS), champ ± ou clavier.
  const [surface, dispatchSurface] = useReducer(sheetSurfaceReducer, INITIAL_SHEET_SURFACE_STATE);
  const openSurface = surface.open;
  const openKey = openSurface.kind === "none" ? null : openSurface.key;
  const isOpen = (target: SheetSurface) => sameSurface(openSurface, target);
  const [isTableFolded, setIsTableFolded] = useState(false);
  /**
   * PRE-5 story 2.8 (FR-4, FR-28) : tableau des phases replié par le chevron de l'option Avec ;
   * déployé à l'ouverture et à chaque activation. Le nombre et les phases n'en dépendent pas.
   */
  const [isPhasesFolded, setIsPhasesFolded] = useState(false);
  /**
   * PRE-5 story 2.5 (AC4, AD-28) : section « Durée de l'exercice » déployée (Compte à rebours
   * et Fin rendus) ; repliée à l'ouverture de la Feuille. Indépendante de la valeur de durée.
   */
  const [isDurationExpanded, setIsDurationExpanded] = useState(false);
  /**
   * Q40 (Hermann, 2026-10-17, E-14) : tableau des séries variables « sélectionné ».
   * Vrai quand Hermann l'ouvre (passage du Type de série à Variables, dépliage par le
   * chevron) ou agit dedans (cellule, ±, glisser, déplacement) ; faux dès qu'il
   * sélectionne un autre champ hors du tableau (contrôle en place, segmenté du Mode,
   * roue de la Cible commune, ± d'une ligne hors tableau) ou quand le tableau se
   * replie ou se ferme. Faux à l'ouverture de la Feuille : aucun geste encore.
   */
  const [isTableSelected, setIsTableSelected] = useState(false);
  // Recette du 20/10 (RC-14) : texte saisi dans la charge commune pendant son focus (largeur de l'option).
  const [uniformLoadEntry, setUniformLoadEntry] = useState<string | null>(null);
  /**
   * Message d'ajustement existant (D-5, T-58) : Inversion du total (`previous` restauré
   * par Annuler) ou, story 3.6 (AD-8, FR-12-05), « Série supprimée — Annuler »
   * (`undoRemoval` du Brouillon, Q29, sans instantané propre). Toute modification du
   * Brouillon le retire (`update`).
   */
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);
  // Recette 1 (A-04) : le voile apparaît en fondu, sur place (Modal `fade`, prototype
  // figé : aucune translation du voile) ; seule la feuille garde sa montée depuis le bas.
  const reduceMotion = useReduceMotion();
  const [sheetEntry] = useState(() => new Animated.Value(windowHeight));
  // Recette 2 (T-15) : pendant le glisser d’une Série, le corps ne défile pas.
  // Sinon le défilement natif d’iOS prend le geste, déplace la feuille et
  // interrompt le responder : la ligne n’est jamais déposée.
  const [isDraggingRow, setIsDraggingRow] = useState(false);
  // Q41 : géométrie des panneaux sans flèche (relevée à la mise en page, jamais estimée).
  // PRE-5 story 2.4 (AD-28) : boîte de chaque cadre dans le contenu défilant.
  const [frameBoxes, setFrameBoxes] = useState<Partial<Record<SheetFrame, FrameBox>>>({});
  // Boîte de la ligne d'un champ à panneau, relative à SON cadre (`PANEL_FRAME`).
  const [rowBoxes, setRowBoxes] = useState<Partial<Record<PanelControl, Box>>>({});
  const [panelHeight, setPanelHeight] = useState<{ readonly control: PanelControl; readonly height: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeightRef = useRef(0);
  // Recette du 19/10 (RC-1) : bas mesuré de la zone de la `Modal` (fenêtre), sinon la hauteur de la fenêtre.
  const scrimRef = useRef<View>(null);
  const [scrimBottom, setScrimBottom] = useState<number | null>(null);

  /**
   * PRE-5 story 2.2 : application d'une saisie au clavier (mise à jour fonctionnelle du
   * Brouillon) ; un changement retire le message d'ajustement, comme `update`.
   */
  function commitKeyboard(apply: (current: ExecutionSheetDraft) => ExecutionSheetDraft) {
    if (apply(draft) !== draft) setAdjustment(null);
    setDraft((current) => apply(current));
  }
  // PRE-5 story 2.2 (AD-26, AD-27) : hook unique focus / surface / application de la saisie.
  const keyboard = useSheetKeyboard({
    draft,
    surface,
    dispatchSurface,
    commit: commitKeyboard,
    // PRE-5 story 2.8 (D-434) : une durée de phase active ne navigue qu'entre les durées des phases.
    order: keyboardFieldOrder(
      draft,
      !isTableFolded,
      draft.workPhases.length > 0 && !isPhasesFolded,
      openSurface.kind === "keyboard" ? openSurface.field : null,
    ),
    scrollRef,
    reduceMotion,
  });
  useEffect(() => {
    // D-7 : « Réduire les animations » → feuille en place, sans montée.
    if (reduceMotion) {
      sheetEntry.stopAnimation();
      sheetEntry.setValue(0);
      return;
    }
    const animation = Animated.timing(sheetEntry, {
      toValue: 0,
      duration: SHEET_ENTRY_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [sheetEntry, reduceMotion]);

  // Story 3.6 (AD-15, « Ligne disparue ») : après toute transition du Brouillon, une Cellule
  // active ou un Sélecteur de ligne dont la ligne n'existe plus est retiré (règle défensive).
  useEffect(() => {
    dispatchSurface({ type: "rows", rowIds: draft.rowIds });
  }, [draft.rowIds]);
  // PRE-5 story 2.8 (« Phase disparue ») : même règle pour un champ clavier de phase (et le
  // stepper du nombre de phases quand il n'en reste aucune).
  useEffect(() => {
    dispatchSurface({ type: "phases", phaseIds: draft.workPhases.map((phase) => phase.id) });
  }, [draft.workPhases]);

  useEffect(() => {
    if (!adjustment) return;
    const timer = setTimeout(() => setAdjustment(null), TRANSIENT_NOTIFICATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [adjustment]);

  const effective = effectiveParameters(draft);
  const effectiveFirst = seriesRowsOf(effective)[0] ?? { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 };
  const single = isSingleSeries(draft);
  const bilateral = isBilateral(draft.sideMode);
  const showVariableTable = draft.variable && !single;
  // Type de série affiché : Variables seulement à N ≥ 2 ; à N = 1, l'état effectif est uniforme (P16).
  const seriesTypeValue: SeriesType = showVariableTable ? "VARIABLE" : "UNIFORM";
  // PRE-5 story 2.4 (FR-2) : avec des phases, Répétitions, À l'échec et Variables sont
  // indisponibles (valeur réelle affichée) ; le domaine refuse d'ailleurs ces transitions.
  const hasWorkPhases = draft.workPhases.length > 0;
  // AD-23 : seule autorité de la Condition d'arrêt, sur l'état effectif.
  const stopCondition = stopConditionOf(effective);
  // FR-21 : en identiques à l'échec, la ligne de cible (Durée ou Répétitions) est masquée.
  const uniformTargetShown = !showVariableTable && stopCondition !== "FAILURE";
  // Q40 : jamais deux surlignages — le tableau n'est pas surligné tant qu'une surface hors
  // tableau est ouverte.
  // PRE-5 story 2.2, D-434 : le clavier d'une cellule (Cible, Pause, Charge) est une surface
  // DU tableau, qui reste sélectionné.
  const rowKeyboardOpen = openSurface.kind === "keyboard" && keyboardFieldRow(openSurface.field) !== null;
  const tableSelected = isTableSelected && showVariableTable && !isTableFolded && (openSurface.kind === "none" || rowKeyboardOpen);
  // PRE-5 story 2.2 (FR-23) : champ de la charge commune, en identiques effectives avec la charge Avec.
  const uniformLoadShown = draft.loadEnabled && !showVariableTable;
  const uniformLoadActive = isOpen({ kind: "keyboard", field: UNIFORM_LOAD_FIELD });
  // Recette du 20/10 (RC-14) : option Avec de la Charge, de 62 si la charge commune (au repos, et
  // le texte saisi pendant le focus) y tient, sinon élargie au strict nécessaire.
  const uniformLoadText = formatLoadKg(effectiveFirst.loadKg);
  const uniformLoadWidth = loadOptionWidth(uniformLoadText, ...(uniformLoadEntry === null ? [] : [uniformLoadEntry]));
  const totalEditable = isRequestedTotalEditable(draft);

  // PRE-5 story 2.8 (FR-9, AD-25) : disponibilité du ✓ et résultat avec le libellé par défaut
  // « Phase n » (phases à 0 ou à renseigner retirées, une seule restante → Sans).
  const validation = commitSheetDraft(draft, baseline, defaultPhaseLabel);
  // Indice par ligne signalée (rang 0-indexé) ; sa présence vaut signalement.
  const invalidRows = new Map(
    validation.ok
      ? []
      : validation.violations
          .filter((violation) => violation.field === "target" && violation.seriesNumber)
          .map((violation) => [violation.seriesNumber! - 1, invalidHintFor(violation.code)] as const),
  );
  const uniformTargetViolation =
    !validation.ok && !showVariableTable
      ? // PRE-5 story 2.8 (FR-3, revue) : une somme des phases hors de 1..3535 (violation
        // `workPhases`) marque aussi « Durée d'une série », qui l'affiche.
        validation.violations.find((violation) => violation.field === "target" || violation.field === "workPhases")
      : undefined;
  const uniformTargetInvalid = uniformTargetViolation !== undefined;
  const uniformTargetHint = uniformTargetViolation ? invalidHintFor(uniformTargetViolation.code) : undefined;
  // Décision propriétaire D-2 (recette 1) : aucun message « Renseignez … » ; la saisie
  // incomplète reste signalée par le contour figé de la cellule et le ✓ indisponible.

  // Story 3.7 (AC1, AC2, AD-5, FR-14-01, P24) : la forme de la ligne Durée totale se lit
  // dans le domaine — nature du total intrinsèque (`computeIntrinsicDuration`, story 2.1)
  // et disponibilité de l'Inversion (`isRequestedTotalEditable`) ; la Feuille ne calcule
  // ni ne qualifie aucune durée. Montant si la nature en porte un
  // (`hasDurationAmount`) : `exact` (roulette si l'Inversion est disponible, sinon
  // lecture seule), `estimated` (≈, lecture seule), `lowerBound` (≥, mélange calculable,
  // lecture seule) ; aucun montant pour `omitted` et `incomplete` (H10, NFR-06). Recalcul à
  // chaque rendu du Brouillon (AC2). Autre saisie invalide (valeur hors bornes) : ligne
  // conservée avec « — », comportement existant (PRE4-2.1/AC9), aucun montant inventé.
  // D-433 (décision de Hermann du 19/10, AD-28) : la ligne est TOUJOURS affichée, à la même
  // place, en trois états : « Non calculable » quand la configuration seule exclut le calcul,
  // quelles que soient les valeurs (Répétitions sans cadence ; À l'échec en séries identiques ;
  // Mode choisi) — prime sur « — » ; « — » quand des données manquent (Mode non choisi, Cible à renseigner,
  // saisie invalide, ou tableau variable entièrement à l'échec, en attente d'arbitrage) ;
  // sinon la valeur, précédée de son symbole (« ≈ », « ≥ »). Ni formule, ni nature, ni
  // condition de modification changées ; « — » et « Non calculable » ne valent jamais zéro.
  const totalNotCalculable =
    effective.mode !== null &&
    ((effective.mode === "REPETITIONS" && effective.cadenceBeepIntervalSeconds === 0) ||
    (effective.series.kind === "UNIFORM" && effective.series.target.kind === "FAILURE"));
  const totalResult = isCalculable(effective) ? computeIntrinsicDuration(effective) : null;
  const totalNature =
    !totalNotCalculable && totalResult !== null && hasDurationAmount(totalResult.kind) ? totalResult.kind : null;
  const totalSeconds = totalNature !== null && validation.ok ? totalResult?.seconds : undefined;
  // AC8 (AD-5, H8) : montant par le formateur unique ; préfixe `≥ ` du lexique (story 2.2).
  const totalAmount = totalSeconds === undefined ? null : formatPhraseDuration(totalSeconds);
  // D-433 : symbole collé à la valeur, avant elle, dans la même zone (jamais dans le titre).
  const totalText = totalNotCalculable
    ? t.totalNotCalculable
    : totalAmount === null
      ? t.unset
      : totalNature === "lowerBound"
        ? `${strings.shared.durationNature.lowerBoundPrefix}${totalAmount}`
        : totalNature === "estimated"
          ? `${strings.shared.durationNature.estimatedPrefix}${totalAmount}`
          : totalAmount;

  /** Changement venu d'un champ HORS du tableau : le tableau n'est plus sélectionné (Q40). */
  function update(next: ExecutionSheetDraft) {
    setIsTableSelected(false);
    setAdjustment(null);
    setDraft(next);
    // PRE-5 story 2.5 : l'Enchainement n'a plus de surface ; à N = 1 son menu est seulement
    // masqué (Q38, RC-6), le champ ± ouvert (N compris) reste ouvert (T22).
  }

  /**
   * PRE-5 story 2.4 : choix dans un segmenté en ligne hors du tableau (Mode, Condition
   * d'arrêt ; PRE-5 story 2.5 : Changement de côté, Enchainement, Cadence) — appliqué tout
   * de suite ; le tableau est désélectionné (Q40) et la surface ouverte se ferme, comme
   * l'ancien choix en panneau. Re-choisir l'option affichée ne modifie pas le Brouillon : le
   * message « Annuler » d'un retrait reste valable (Q29).
   */
  function chooseInline(transition: (base: ExecutionSheetDraft) => ExecutionSheetDraft) {
    // T10 : un panneau ou un sélecteur ouvert (Android, web : en ligne) se ferme sans
    // appliquer ; le choix touché n'est pas appliqué.
    if (openSurface.kind === "selector") {
      dispatchSurface({ type: "closeAll" });
      return;
    }
    // PRE-5 story 2.2 (AD-27) : la saisie en cours est appliquée avant la transition.
    const next = transition(keyboard.flush(draft));
    if (next === draft) setIsTableSelected(false);
    else update(next);
    dispatchSurface({ type: "closeAll" });
  }

  /**
   * Q40 — sélection unique : le tableau devient la seule sélection visible. Toute
   * surface hors tableau ouverte se referme par son mécanisme habituel (sélecteur en
   * ligne démonté avec sa sortie animée, roulette fermée, champ ± rangé) ; sa ligne
   * n'est plus surlignée. Jamais deux surlignages.
   */
  function selectTable() {
    setIsTableSelected(true);
    dispatchSurface({ type: "closeAll" });
  }

  /** Q40 : action dans le tableau (cellule, glisser, déplacement) — le tableau est sélectionné. */
  function updateInTable(next: ExecutionSheetDraft) {
    update(next);
    selectTable();
  }

  /**
   * Story 3.6 (AD-15, T18, T23, FR-12-05, Q29) : croix de la ligne d'identité `row`.
   * Sans surface ni champ ± ouvert : la ligne est retirée sans confirmation et « Série
   * supprimée — Annuler » s'affiche par le message existant. Sinon, l'appui est un appui
   * extérieur : il range le champ ± sans retirer la ligne (T23 ; un panneau ouvert
   * intercepte l'appui par sa zone extérieure, T10).
   */
  function handleRemove(row: number) {
    setIsTableSelected(true);
    if (!removalEnabled(surface)) {
      // L'appui range l'outil ouvert, quel qu'il soit, sans retirer : un champ ± (T23), un
      // Sélecteur ou un segmenté en ligne (Android, web), ou un panneau atteint directement.
      dispatchSurface(surface.open.kind === "stepper" ? { type: "outside" } : { type: "closeAll" });
      return;
    }
    const next = removeRow(draft, draft.rowIds.indexOf(row));
    if (next === draft) return;
    setDraft(next);
    setAdjustment({ message: t.seriesRemoved, kind: "removal" });
  }

  /**
   * D-5 : `Annuler` du message d'ajustement. Story 3.6 (T27, Q29) : pour un retrait, la
   * ligne est restaurée par `undoRemoval` (position, Cible, Pause, identité) ; l'appui ne
   * range rien : la surface est inchangée.
   */
  function handleAdjustmentUndo() {
    if (adjustment === null) return;
    // PRE-5 story 2.2 (AD-27) : la saisie en cours est appliquée d'abord. Si elle change la
    // charge, c'est une modification du Brouillon : elle est appliquée (message retiré) et
    // rien n'est annulé (Q29 : toute transition invalide l'annulation).
    const base = keyboard.flush(draft);
    if (base !== draft) {
      commitKeyboard(() => base);
      return;
    }
    setAdjustment(null);
    // PRE-5 story 2.8 (FR-8) : le retrait d'une phase s'annule de même (`undoRemoval`, Q29).
    setDraft(adjustment.kind === "total" ? adjustment.previous : undoRemoval(draft));
  }

  /**
   * PRE-5 story 2.8 (FR-8, QR-1, AD-27) : croix de la phase d'identité `phaseId`, sur le modèle
   * de `handleRemove`. Sans surface ouverte : `removeWorkPhase` (refusé à deux phases) et
   * « Phase supprimée — Annuler ». Sinon l'appui range la surface ouverte sans retirer.
   */
  function handleRemovePhase(phaseId: number) {
    setIsTableSelected(false);
    if (!removalEnabled(surface)) {
      dispatchSurface(surface.open.kind === "stepper" ? { type: "outside" } : { type: "closeAll" });
      return;
    }
    const next = removeWorkPhase(draft, phaseId);
    if (next === draft) return;
    setDraft(next);
    setAdjustment({ message: t.phaseRemoved, kind: "phaseRemoval" });
  }

  /**
   * PRE-5 story 2.8 (FR-4, FR-5, FR-8, D-432) : segmenté « Phases de l'exercice ».
   * - Sans → Avec : `setWorkPhasesEnabled(true)` (deux phases), tableau déployé ;
   * - Avec → Sans : `setWorkPhasesEnabled(false)` (la somme devient la durée unique de série) ;
   * - Avec re-choisi (des phases existent) : ouvre ou ferme le réglage du nombre, comme le
   *   toucher de « n phases ».
   */
  function choosePhases(choice: PhaseChoice) {
    // T10 : panneau ou sélecteur ouvert — fermeture sans appliquer.
    if (openSurface.kind === "selector") {
      dispatchSurface({ type: "closeAll" });
      return;
    }
    if (choice === "WITH" && draft.workPhases.length > 0) {
      togglePhaseCount();
      return;
    }
    const enabled = choice === "WITH";
    if (enabled) setIsPhasesFolded(false);
    chooseInline((base) => setWorkPhasesEnabled(base, enabled));
  }

  /** PRE-5 story 2.8 (D-432, RC-4) : ouvre ou referme le stepper du nombre de phases (saisie en cours appliquée d'abord). */
  function togglePhaseCount() {
    const base = keyboard.flush(draft);
    if (base !== draft) commitKeyboard(() => base);
    toggle(stepperSurface("phaseCount"));
  }

  /**
   * PRE-5 story 2.8 (FR-5, FR-8, D-432, QR-1) : pas du stepper du nombre de phases, par la seule
   * transition `setWorkPhaseCount` (+ : ajout en fin à la durée de la dernière ; − : retrait
   * annulable de la dernière, « Phase supprimée — Annuler »). Bornes 2..6 portées par le stepper
   * et par la transition ; le réglage reste ouvert (T22).
   */
  function changePhaseCount(count: number) {
    const next = setWorkPhaseCount(draft, count);
    if (next === draft) return;
    setIsTableSelected(false);
    setDraft(next);
    setAdjustment(next.pendingRemoval?.kind === "phase" ? { message: t.phaseRemoved, kind: "phaseRemoval" } : null);
  }

  /**
   * PRE-5 story 2.8 (FR-4, FR-28) : chevron de l'option Avec — replie ou déploie le tableau des
   * phases sans changer le nombre ni les phases ; la surface ouverte est rangée (T14).
   */
  function togglePhasesTable() {
    setIsTableSelected(false);
    dispatchSurface({ type: "closeAll" });
    setIsPhasesFolded((folded) => !folded);
  }

  /**
   * PRE-5 story 2.2, D-434 : focus d'un champ clavier — une cellule du tableau (Cible, Pause,
   * Charge) sélectionne le tableau, le champ de la charge commune le désélectionne (Q40).
   */
  function focusKeyboardField(field: KeyboardFieldId) {
    setIsTableSelected(keyboardFieldRow(field) !== null);
    keyboard.onFocus(field);
  }

  /**
   * PRE-5 story 2.2 (FR-23, AC5) : segmenté « Avec | Sans » de la ligne Charge. Avec (passage
   * Sans → Avec) : `setLoadEnabled(true)` (0,25 kg à la première activation, restauration
   * ensuite), tableau déplié s'il était replié. Recette du 19/10 (RC-2) : aucun focus, aucune
   * cellule active ; le clavier ne s'ouvre qu'au toucher d'un champ Charge. Recette du 20/10
   * (RC-14) : en séries identiques effectives, Avec ouvre le clavier dans l'option (focus de la
   * charge commune) ; en variables, RC-2 reste.
   */
  function chooseLoad(choice: LoadChoice) {
    // T10 : panneau ou sélecteur ouvert — fermeture sans appliquer.
    if (openSurface.kind === "selector") {
      dispatchSurface({ type: "closeAll" });
      return;
    }
    const enabled = choice === "WITH";
    const activating = enabled && !draft.loadEnabled;
    const next = setLoadEnabled(keyboard.flush(draft), enabled);
    if (activating && showVariableTable && isTableFolded) setIsTableFolded(false);
    if (next === draft) setIsTableSelected(false);
    else update(next);
    dispatchSurface({ type: "closeAll" });
    if (enabled && !showVariableTable) keyboard.focusField(UNIFORM_LOAD_FIELD);
  }

  /**
   * Toucher le champ d'une surface (AD-15) : T15, T16, T20, T24, T10 et second toucher
   * (fermeture), selon la surface déjà ouverte (`sheetSurfaceReducer`).
   */
  function toggle(target: SheetSurface) {
    // Q40 : tous les champs à surface sont hors du tableau.
    setIsTableSelected(false);
    dispatchSurface({ type: "touch", surface: target });
  }

  /** Fermeture de la surface ouverte, par sa clé (✓, ✕, toucher extérieur, rappel natif) ; une autre clé est ignorée (T8). */
  function closeSurface(key: number | null) {
    if (key !== null) dispatchSurface({ type: "close", key });
  }

  /**
   * PRE-5 story 2.5 (AC1, FR-15, FR-16) : segmenté « Changement de côté » Avec / Sans.
   * Sans → Avec écrit `RIGHT_LEFT` et recopie la Pause entre les côtés du Profil (P3-10,
   * `setSideMode`) ; Avec re-choisi sur une valeur bilatérale (`RIGHT_LEFT` ou `LEFT_RIGHT`
   * historique) et Sans re-choisi sur `UNILATERAL` laissent le Brouillon inchangé.
   */
  function chooseSide(choice: SideChoice) {
    chooseInline((base) => {
      if (choice === "WITH") {
        return isBilateral(base.sideMode) ? base : setSideMode(base, "RIGHT_LEFT", profileSideRecoverySecondsDefault);
      }
      return base.sideMode === "UNILATERAL" ? base : setSideMode(base, "UNILATERAL", profileSideRecoverySecondsDefault);
    });
  }

  /**
   * PRE-5 story 2.5 (AC2, FR-17) ; recette du 19/10 (RC-6) : choix dans le menu de l'option
   * Avec ; `setSideOrder` seulement si différent.
   */
  function chooseSideOrder(order: SideOrder) {
    chooseInline((base) => (base.sideOrder === order ? base : setSideOrder(base, order)));
  }

  /**
   * PRE-5 story 2.5 (AC3, AD-24, FR-30) : segmenté « Cadence ». Autre ne change pas la valeur :
   * il ouvre (ou referme) le ± existant, `stepper(beep)`, sous la ligne. 1 s et Sans
   * (recette du 19/10, RC-10 : 2 s et 5 s ne sont plus des options) écrivent leur valeur par
   * `setCadenceBeep` (si elle diffère) et ferment la surface.
   */
  function chooseCadence(option: CadenceOption) {
    if (option !== "OTHER") {
      const seconds = CADENCE_OPTION_SECONDS[option];
      chooseInline((base) => (base.cadenceBeepIntervalSeconds === seconds ? base : setCadenceBeep(base, seconds)));
      return;
    }
    // T10 : un panneau ou un sélecteur ouvert se ferme sans ouvrir le ±.
    if (openSurface.kind === "selector") {
      dispatchSurface({ type: "closeAll" });
      return;
    }
    // PRE-5 story 2.2 (AD-27) : la saisie en cours est appliquée d'abord.
    const base = keyboard.flush(draft);
    if (base !== draft) commitKeyboard(() => base);
    toggle(stepperSurface("beep"));
  }

  /**
   * PRE-5 story 2.5 (AC4, AD-28) : chevron de « Durée de l'exercice » — replie ou déplie
   * Compte à rebours et Fin, sans toucher la durée ni son édition (cible distincte de la
   * pastille). Toute surface ouverte est rangée, comme pour le chevron du tableau (T14).
   */
  function toggleDuration() {
    setIsTableSelected(false);
    dispatchSurface({ type: "closeAll" });
    setIsDurationExpanded((expanded) => !expanded);
  }

  /**
   * Story 3.8 (AC5, FR-22-11 ; AD-15 T10, T19) : avec un popover, un panneau ou une roue
   * ouvert, ✓ et ✕ de la Feuille (et le retour système) ne font que fermer cette surface,
   * sans appliquer sa valeur en cours ; VoiceOver compris, l'en-tête restant hors de la zone
   * de toucher extérieur. Renvoie vrai si l'appui a été absorbé.
   */
  function absorbSheetCommand() {
    if (!sheetCommandsAbsorbed(surface)) return false;
    dispatchSurface({ type: "closeAll" });
    return true;
  }

  function handleValidate() {
    if (absorbSheetCommand()) return;
    if (validation.ok) {
      onApply(validation.value);
    }
  }

  function handleCancel() {
    if (absorbSheetCommand()) return;
    onCancel();
  }

  function handleTotalValidated(requestedSeconds: number) {
    setIsTableSelected(false);
    closeSurface(openKey);
    const applied = applyRequestedTotal(draft, requestedSeconds);
    if (!applied) return;
    setDraft(applied.draft);
    setAdjustment(
      applied.inversion.adjusted
        ? {
            message: t.adjusted.replace("{duration}", formatPhraseDuration(applied.inversion.totalSeconds)),
            kind: "total",
            previous: draft,
          }
        : null,
    );
  }

  const targetLabel = effective.mode === "REPETITIONS" ? repetitionsLabel : secondsLabel;
  const validateDisabled = !validation.ok && !sheetCommandsAbsorbed(surface);
  const validateLabel = validation.ok
    ? t.validateAccessibilityLabel
    : `${t.validateAccessibilityLabel}, ${t.validateUnavailableSuffix}`;

  // Q41 (Hermann, 2026-10-17, recette iPhone, E-15 ; remplace la couche
  // `WheelPickerOverlay` de Q37 pour la Feuille) : sur iOS, le Changement de côté,
  // l'Ordre des côtés, la roue de « Durée d’une série » et celle de la Durée totale
  // s'ouvrent dans un panneau SANS FLÈCHE (`AnchoredPanel`), juste sous le champ
  // sélectionné, aligné à droite sur lui, au-dessus du contenu (aucune ligne ne se
  // décale). Contenus inchangés : `SegmentedControl` (mêmes options, libellés et
  // sous-titres) et `DurationWheelPicker` (roulette native SwiftUI et sa barre ✕ / ✓).
  // Un choix ou le ✓ applique au Brouillon de la Feuille ; le ✕ de la roue et un
  // toucher hors du panneau ferment sans rien appliquer. La roue, démontée à la
  // fermeture, repart de la valeur courante à chaque ouverture (Q12). Aucune `Modal`
  // supplémentaire, aucun `Popover`. Android et web gardent les contrôles en ligne.
  // PRE-5 story 2.4 (AD-27) : le popover natif du Mode est retiré (segmenté en ligne).
  // PRE-5 story 2.5 (AD-27) : les panneaux du Changement de côté et de l'Ordre des côtés
  // aussi (segmentés en ligne) ; seules les roues s'ouvrent encore en panneau.
  const anchoredPanels = Platform.OS === "ios";

  /**
   * Q41 : boîte (position, hauteur) de la ligne d'un champ à panneau, relevée à la mise
   * en page, relative à son cadre (`PANEL_FRAME`).
   */
  function trackRow(control: PanelControl) {
    return (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      setRowBoxes((current) => (sameBox(current[control], y, height) ? current : { ...current, [control]: { y, height } }));
    };
  }

  /** PRE-5 story 2.4 (AD-28) : boîte d'un cadre dans le contenu défilant. */
  function trackFrame(frame: SheetFrame) {
    return (event: LayoutChangeEvent) => {
      const { y, height, width } = event.nativeEvent.layout;
      setFrameBoxes((current) => {
        const known = current[frame];
        return known !== undefined && known.y === y && known.height === height && known.width === width
          ? current
          : { ...current, [frame]: { y, height, width } };
      });
    };
  }

  // Story 3.4 (FR-08-02) ; PRE-5 story 2.4 (FR-21) : la roue de la Cible commune ne
  // s'ouvre que si sa ligne est affichée (masquée à l'échec).
  // PRE-5 story 2.8 (FR-3) : avec des phases, D est la somme, en lecture seule — la roue ne
  // s'ouvre pas.
  const uniformDurationAvailable = uniformTargetShown && effective.mode === "DURATION" && !hasWorkPhases;
  // Story 3.5 (AC1) : même Sélecteur de la Cible commune en Répétitions.
  const uniformRepetitionsAvailable = uniformTargetShown && effective.mode === "REPETITIONS";
  // Story 3.7 (AC3, FR-14-02) : roulette seulement si l'Inversion est disponible (Durée,
  // `identiques`, Cible numérique, N libre) et le montant connu ; sinon lecture seule.
  //
  // Bornes de la roulette (AC4, FR-14-03, H8) : T(1)..T(99) des paramètres courants, lues
  // dans le domaine (`totalDurationRange`), sans aucun calcul ici. Plafond du COMPOSANT,
  // non une règle de durée : la roue PRE-3 `DurationWheelPicker` ne sait afficher que
  // jusqu'à 99:59 (`WHEEL_TOTAL_DURATION_SECONDS_MAX`, deux chiffres de minutes). Choix
  // d'intégration (revue de la story 3.7) : si T(1) ou le total courant dépasse ce
  // plafond, la roue n'est pas proposée — la ligne `exact` reste en lecture seule, annoncée
  // non modifiable — plutôt que d'ouvrir sur une valeur fausse ; sinon les bornes sont
  // T(1)..min(T(99), plafond) et la roue s'ouvre exactement sur le total courant.
  const totalRange = totalEditable && totalSeconds !== undefined ? totalDurationRange(effective) : null;
  const totalBounds =
    totalRange === null ||
    totalSeconds === undefined ||
    totalRange.min > WHEEL_TOTAL_DURATION_SECONDS_MAX ||
    totalSeconds > WHEEL_TOTAL_DURATION_SECONDS_MAX
      ? null
      : { min: totalRange.min, max: Math.min(totalRange.max, WHEEL_TOTAL_DURATION_SECONDS_MAX) };
  const totalWheelSeconds = totalBounds === null ? undefined : totalSeconds;
  // Story 3.7 (AC7, FR-14-05) : une ligne en lecture seule est annoncée d'un seul tenant —
  // libellé, nature (≈ « estimation », ≥ « total prévisionnel partiel »), montant sans
  // symbole, puis « non modifiable » — jamais par un tiret ni par le gris seul (la valeur
  // garde la couleur du texte). Saisie invalide (« — ») : libellé, nature si connue, puis
  // l'annonce dédiée `totalInvalidSpoken`. La ligne modifiable garde l'annonce de sa pastille.
  const totalNatureSpoken =
    totalNature === "estimated" ? t.totalEstimatedSpoken : totalNature === "lowerBound" ? t.totalLowerBoundSpoken : null;
  // D-433 : la ligne toujours présente annonce aussi « Non calculable » et « — » (données
  // manquantes), jamais un tiret ni zéro.
  const totalSpokenLabel = totalNotCalculable
    ? `${t.exerciseDuration}, ${t.totalNotCalculable}`
    : totalNature === null
      ? `${t.exerciseDuration}, ${t.totalMissingSpoken}`
      : totalWheelSeconds !== undefined
        ? undefined
        : [t.exerciseDuration, totalNatureSpoken, totalAmount ?? t.totalInvalidSpoken, totalAmount === null ? null : t.totalReadOnlySpoken]
            .filter((part) => part !== null)
            .join(", ");
  // PRE-5 story 2.5 (AC4, D-409, RM-218, AD-28) : Compte à rebours et Fin — absents pour un
  // Exercice ouvert depuis une Séance (ni lignes ni chevron) ; sinon repliés sous la ligne
  // « Durée de l'exercice », toujours présente (D-433), derrière son chevron.
  const signalsPresent = exerciseSignals === "present";
  const durationDisclosure = signalsPresent;
  const signalsShown = signalsPresent && isDurationExpanded;
  // PRE-5 story 2.5 (AC1) ; recette du 19/10 (RC-6) : Pause entre les côtés visible sous Avec,
  // sans chevron de repli. L'Enchainement, porté par l'option Avec, est masqué à N = 1 (Q38,
  // valeur conservée) : Avec y reprend son libellé.
  const sideSettingsShown = bilateral;
  const sideOrderShown = !single;
  // AC3 : tant que le ± de la Cadence est ouvert, l'option affichée est Autre.
  const beepOpen = isOpen(stepperSurface("beep"));
  const cadenceOption: CadenceOption | null = beepOpen ? "OTHER" : cadenceOptionOf(draft.cadenceBeepIntervalSeconds);
  const panelControl: PanelControl | null = !anchoredPanels
    ? null
    : isOpen(TARGET_SELECTOR) && uniformDurationAvailable
      ? "uniformDuration"
      : isOpen(TARGET_SELECTOR) && uniformRepetitionsAvailable
        ? "uniformRepetitions"
        : isOpen(TOTAL_SELECTOR) && totalWheelSeconds !== undefined
          ? "total"
          : null;
  /**
   * PRE-5 story 2.4 (AD-28) — repère UNIQUE des panneaux, dans les coordonnées du contenu
   * défilant (l'hôte des panneaux, dont les cadres sont les enfants directs) : y du cadre
   * mesuré par `onLayout` + y dans ce cadre. Toute position de panneau passe par elle.
   */
  const anchorTop = (frame: SheetFrame, yInFrame: number) => (frameBoxes[frame]?.y ?? 0) + yInFrame;
  // Q41 : le panneau s'ouvre sous la ligne du champ, aligné à droite sur le champ (bord
  // droit de la ligne, `FRAME_INSET` avant le bord du cadre). Les segmentés gardent la
  // largeur de la ligne (D-341) ; la roue garde sa propre largeur (330), alignée à droite.
  const anchorBox = panelControl === null ? NO_BOX : (rowBoxes[panelControl] ?? NO_BOX);
  // D-434 : plus de Sélecteur de cellule ; seuls les champs hors tableau ouvrent un panneau.
  const panelTop =
    panelControl === null ? 0 : anchorTop(PANEL_FRAME[panelControl], anchorBox.y + anchorBox.height) + PANEL_GAP;
  const measuredPanelHeight = panelHeight !== null && panelHeight.control === panelControl ? panelHeight.height : 0;
  // Place sous le dernier cadre : si le panneau dépasse le bas du contenu (Durée totale,
  // près du bas), une réserve vide est ajoutée après les cadres, sans déplacer aucune ligne.
  const framesBottom = SHEET_FRAMES.reduce((bottom, frame) => {
    const box = frameBoxes[frame];
    return box === undefined ? bottom : Math.max(bottom, box.y + box.height);
  }, 0);
  const panelRoom = panelControl === null ? 0 : Math.max(0, Math.ceil(panelTop + measuredPanelHeight - framesBottom));

  /**
   * AC8 (FR-03-05, FR-10-05) : valeur numérique hors tableau. Au repos, seule la valeur
   * est visible ; l'appui ouvre le champ (`stepper(champ)`, T16, T20) et fait apparaître
   * `InlineStepper`, inchangé (AD-16) ; ses ± ne referment jamais le champ (T22).
   */
  const stepperField = (field: SheetStepperField, fieldLabel: string, stepper: Omit<InlineStepperProps, "width">) => (
    <RevealStepper
      isOpen={isOpen(stepperSurface(field))}
      onToggle={() => toggle(stepperSurface(field))}
      fieldLabel={fieldLabel}
      {...stepper}
      width={STEPPER_WIDTH}
    />
  );

  // PRE-5 story 2.4 (AC3, FR-27, R-01) : Mode en segmenté `inline`, « Répétitions | Durée »
  // (PR-01, Figma `8328:38193`) ; `null` : aucun segment sélectionné. Avec des phases,
  // Répétitions est indisponible et la valeur réelle reste affichée (FR-2).
  const modeControl = (
    <SegmentedControl<ExecutionMode>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.wide}
      options={[
        { value: "REPETITIONS", label: t.modes.REPETITIONS, disabled: hasWorkPhases },
        { value: "DURATION", label: t.modes.DURATION },
      ]}
      value={draft.mode}
      onChange={(mode) => chooseInline((base) => setMode(base, mode))}
      accessibilityLabel={t.mode}
      testID="execution-sheet-mode-control"
    />
  );

  // PRE-5 story 2.4 (AC4, AC5 ; FR-19, FR-20 ; AD-23) : Condition d'arrêt. Identiques
  // effectives → segmenté « À l'échec | À la cible » sur `stopConditionOf` (À la cible
  // par défaut, Mode non renseigné compris), qui appelle `setStopCondition` ; avec des
  // phases, À l'échec est indisponible. Variables → résultat dérivé, recalculé à chaque
  // rendu, en lecture seule (violet atténué, UX-DR2) : deux options si homogène, une seule
  // « À la cible et à l'échec » si mixte ; aucune cellule renseignée → « — », annoncé
  // « Condition d'arrêt, aucune valeur ». Aucune validation ajoutée.
  const stopConditionOptions = [
    { value: "FAILURE" as const, label: t.stopConditions.FAILURE },
    { value: "TARGET" as const, label: t.stopConditions.TARGET },
  ];
  const stopConditionControl = !showVariableTable ? (
    <SegmentedControl<StopConditionChoice>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.wide}
      options={stopConditionOptions.map((option) => (option.value === "FAILURE" ? { ...option, disabled: hasWorkPhases } : option))}
      value={stopCondition === "FAILURE" ? "FAILURE" : "TARGET"}
      onChange={(condition) => chooseInline((base) => setStopCondition(base, condition))}
      accessibilityLabel={t.stopCondition}
      testID="execution-sheet-stop-condition-control"
    />
  ) : stopCondition === "NONE" ? (
    <Text
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${t.stopCondition}, ${t.unsetSpoken}`}
      style={styles.staticValue}
      testID="execution-sheet-stop-condition-none"
    >
      {t.unset}
    </Text>
  ) : (
    <SegmentedControl<StopConditionChoice | "MIXED">
      // Instance distincte selon le nombre d'options : le cadre de sélection n'est jamais
      // animé depuis une position hors du contrôle (deux options → une seule).
      key={stopCondition === "MIXED" ? "mixed" : "pair"}
      variant="inline"
      readOnly
      optionWidth={stopCondition === "MIXED" ? MIXED_STOP_CONDITION_WIDTH : INLINE_OPTION_WIDTHS.wide}
      options={stopCondition === "MIXED" ? [{ value: "MIXED", label: t.stopConditions.MIXED }] : stopConditionOptions}
      value={stopCondition}
      onChange={ignorePress}
      accessibilityLabel={t.stopCondition}
      testID="execution-sheet-stop-condition-control"
    />
  );

  // PRE-5 story 2.4 (AC7, FR-27, FR-28, R-03) : Type de série en segmenté `inline`,
  // « Variables | Identiques ». Variables porte le chevron intérieur quand le tableau
  // existe : haut si déployé, bas si replié ; son appui replie ou déplie sans perte (ancien
  // `DisclosureControl`). Avec des phases, Variables est indisponible (FR-2).
  // Recette du 20/10 (RC-15, Figma `9436:18101`, `9439:18307`, `9436:18305`, `9445:18410`) : le
  // nombre de séries est porté par l'option sélectionnée (« 3 séries identiques », « 3 séries
  // variables » et chevron) ; son toucher révèle le stepper existant (1..99, mêmes pas, même
  // politique de maintien, `setSeriesCount`, surface `stepper(count)`) sur fond `#F2F2FF` dans
  // un segmenté de 34 ; toucher la valeur le referme (RC-4). L'option non sélectionnée garde
  // « Variables » ou « Identiques ». À N = 1 (P16), le Type de série reste non modifiable :
  // Variables indisponible (au lieu du contrôle entier atténué), le nombre reste réglable.
  // Recette du 20/10 (RC-17, décisions de Hermann) : la ligne s'intitule « Séries » ; stepper
  // ouvert, le chevron du tableau est grisé et indisponible (jamais stepper et chevron actifs en
  // même temps) ; activer une cellule du tableau ouvre sa surface clavier, ce qui ferme le stepper
  // (une seule surface ouverte) et rend le chevron actif.
  const seriesCountOpen = isOpen(stepperSurface("count"));
  const seriesChevron = seriesTypeValue === "VARIABLE";
  const seriesSelectedWidth = seriesSelectedOptionWidth({
    label: seriesTypeCountLabel(draft.count, seriesTypeValue),
    stepperValue: seriesLabel(draft.count),
    open: seriesCountOpen,
    chevron: seriesChevron,
  });
  const seriesUnselectedWidth = seriesUnselectedOptionWidth(
    seriesTypeValue === "VARIABLE" ? "UNIFORM" : "VARIABLE",
    seriesSelectedWidth,
    windowWidth - SHEET_ROW_SIDE_WIDTH - spacing[8],
  );
  const seriesCountContent = (
    <SegmentCountField
      isOpen={seriesCountOpen}
      onToggle={toggleSeriesCount}
      count={draft.count}
      min={EXECUTION_BOUNDS.seriesCount.min}
      max={EXECUTION_BOUNDS.seriesCount.max}
      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
      closedLabel={seriesTypeCountLabel(draft.count, seriesTypeValue)}
      formatValue={seriesLabel}
      onChange={(count) => update(setSeriesCount(draft, count))}
      accessibilityLabel={t.series}
      valueStyle={styles.seriesStepperValue}
      fieldStyle={styles.seriesStepperField}
      style={seriesChevron ? styles.seriesCountBeforeChevron : null}
      testID="execution-sheet-series"
      textTestID="execution-sheet-series-value"
    />
  );
  const seriesTypeOption = (seriesType: SeriesType) =>
    seriesType === seriesTypeValue
      ? { width: seriesSelectedWidth, selectedContent: seriesCountContent, ownSurface: seriesCountOpen }
      : { width: seriesUnselectedWidth };
  const seriesTypeControl = (
    <SegmentedControl<SeriesType>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.wide}
      height={seriesCountOpen ? SERIES_CONTROL_OPEN_HEIGHT : undefined}
      options={[
        {
          value: "VARIABLE",
          label: t.seriesTypes.VARIABLE,
          disabled: hasWorkPhases || single,
          accessibilityLabel: single ? `${t.seriesTypes.VARIABLE}, ${t.disabledSuffix}` : undefined,
          chevron: showVariableTable ? (isTableFolded ? "down" : "up") : undefined,
          chevronAccessibilityLabel: isTableFolded ? t.showTable : t.hideTable,
          // Recette du 20/10 (RC-17) : stepper ouvert, chevron visible mais indisponible (comme RC-16).
          chevronDisabled: seriesCountOpen,
          ...seriesTypeOption("VARIABLE"),
        },
        {
          value: "UNIFORM",
          label: t.seriesTypes.UNIFORM,
          ...seriesTypeOption("UNIFORM"),
        },
      ]}
      value={seriesTypeValue}
      onChange={chooseSeriesType}
      // RC-17 : chevron indisponible touché pendant le réglage — fermeture du stepper (« toucher
      // ailleurs »), sans changer le nombre ni l'état déployé / replié du tableau.
      onChevronPress={seriesCountOpen ? toggleSeriesCount : toggleTable}
      accessibilityLabel={t.seriesType}
      testID="execution-sheet-series-type-control"
    />
  );
  // Story 3.4 (AC10, FR-06-05) : « — » (fond #FFF1F0) ou la durée formatée ; PRE-5 story
  // 2.4 (FR-21) : à l'échec, la ligne est masquée (le texte « à l’échec » reste une défense).
  const uniformDurationText =
    effectiveFirst.target.kind === "FAILURE" ? t.failureTarget : secondsLabel(targetNumber(effectiveFirst.target));
  const uniformDurationPill = (
    <ValuePill
      value={uniformDurationText}
      accessibilityLabel={`${t.durationTarget}, ${spokenValue(uniformDurationText)}`}
      expanded={isOpen(TARGET_SELECTOR)}
      invalid={uniformTargetInvalid}
      invalidHint={uniformTargetHint}
      onPress={() => toggle(TARGET_SELECTOR)}
      testID="execution-sheet-target-value"
    />
  );
  // ✓ applique au Brouillon de la Feuille seulement ; ✕ ferme sans rien changer (Q12).
  // Story 3.4 (AD-7, AD-16, Q21, Q25, Q36) : ouverture normalisée par le domaine
  // (`selectorOpeningPosition` : 5999 → 58:55, « — » → 00:01 depuis D-430, échec → option) ; la
  // ligne garde sa valeur d'origine jusqu'au ✓. Bornes de Cible 1..3535 (D-430) : `00:00`
  // reste une position, jamais une Cible (✓ indisponible). L'échec sort en
  // `SeriesTarget` `FAILURE`, jamais en nombre.
  //
  // PRE-5 story 2.4 (AC6, FR-22, R-09, R-10) : la roue de la Cible commune n'a pas d'option
  // « À l'échec » (en identiques, `FAILURE` n'est écrit que par la Condition d'arrêt). D-434 :
  // la roue n'est plus ouverte depuis une cellule du tableau (saisie au clavier).
  const durationTargetWheel = (target: SeriesTarget, apply: (chosen: SeriesTarget) => void) => {
    const wheelLabels = strings.screens.exercise.wheelPicker;
    const opening = selectorOpeningPosition("DURATION", target);
    return (
      <DurationWheelPicker
        totalSeconds={opening.kind === "NUMBER" ? opening.value : 0}
        targetBounds={EXECUTION_BOUNDS.durationTarget}
        onValidate={(seconds) => {
          closeSurface(openKey);
          apply(numberTarget(seconds));
        }}
        onCancel={() => closeSurface(openKey)}
        minutesAccessibilityLabel={wheelLabels.minutesAccessibilityLabel}
        secondsAccessibilityLabel={wheelLabels.secondsAccessibilityLabel}
        cancelAccessibilityLabel={wheelLabels.cancelAccessibilityLabel}
        validateAccessibilityLabel={wheelLabels.validateAccessibilityLabel}
      />
    );
  };
  const uniformDurationWheel = durationTargetWheel(effectiveFirst.target, (chosen) => update(setUniformTarget(draft, chosen)));
  // Story 3.5 (AC2 à AC6, Q8, Q14) : Cible commune en Répétitions — pastille (« à l’échec »,
  // « — » sur #FFF1F0 ou « 12 rép. ») qui ouvre `NumberWheelPicker` à une colonne : ligne
  // de tête « Aucune répétition, à l’échec », puis 1..100. Ouverture normalisée par le
  // domaine (`selectorOpeningPosition` : 150 → 100, « — » → 1, échec → ligne de tête,
  // AD-16, Q21, Q25) ; la ligne garde sa valeur d'origine jusqu'au ✓. ✓ → Brouillon de
  // la Feuille ; ✕ et toucher extérieur ferment sans rien changer (Q12). Remplace
  // l'`InlineStepper` permanent et le texte `FailureTargetText` de cette ligne.
  const uniformRepetitionsText =
    effectiveFirst.target.kind === "FAILURE" ? t.failureTarget : repetitionsLabel(targetNumber(effectiveFirst.target));
  const uniformRepetitionsPill = (
    <ValuePill
      value={uniformRepetitionsText}
      accessibilityLabel={`${t.repetitionsTarget}, ${spokenValue(uniformRepetitionsText)}`}
      expanded={isOpen(TARGET_SELECTOR)}
      invalid={uniformTargetInvalid}
      invalidHint={uniformTargetHint}
      onPress={() => toggle(TARGET_SELECTOR)}
      testID="execution-sheet-target-value"
    />
  );
  // PRE-5 story 2.4 (AC6, FR-22) : la roue de la Cible commune en Répétitions n'a pas de
  // ligne de tête « Aucune répétition, à l’échec ». D-434 (QD-434-1) : la cellule Répétitions
  // du tableau se saisit au clavier numérique ; la roue n'est plus ouverte depuis une cellule.
  const repetitionsTargetWheel = (target: SeriesTarget, apply: (chosen: SeriesTarget) => void, accessibilityLabel: string) => {
    const opening = selectorOpeningPosition("REPETITIONS", target);
    return (
      <NumberWheelPicker
        value={opening.kind === "NUMBER" ? opening.value : EXECUTION_BOUNDS.repetitionTarget.min}
        targetBounds={EXECUTION_BOUNDS.repetitionTarget}
        onValidate={(value: number) => {
          closeSurface(openKey);
          apply(numberTarget(value));
        }}
        onCancel={() => closeSurface(openKey)}
        valueAccessibilityLabel={repetitionsSpoken}
        accessibilityLabel={accessibilityLabel}
        cancelAccessibilityLabel={strings.screens.exercise.wheelPicker.cancelAccessibilityLabel}
        validateAccessibilityLabel={strings.screens.exercise.wheelPicker.validateAccessibilityLabel}
        testID="execution-sheet-repetitions-wheel"
      />
    );
  };
  // Calculés seulement quand la ligne Répétitions est affichée (comme `totalWheel`).
  const uniformRepetitionsWheel = uniformRepetitionsAvailable
    ? repetitionsTargetWheel(effectiveFirst.target, (chosen) => update(setUniformTarget(draft, chosen)), t.repetitionsTarget)
    : null;
  // Story 3.7 (AC4, FR-14-03, H8) : bornes `totalBounds` (voir leur calcul), par la prop
  // `targetBounds` existante de la roulette (story 3.4) : minutes de T(1) à T(99), aucune
  // seconde hors bornes ; sous 60 s de T(1), position `00:00` avec ✓ indisponible. Aucune
  // option échec, aucune colonne ni roulette supplémentaire.
  const totalWheel =
    totalWheelSeconds === undefined || totalBounds === null ? null : (
      <DurationWheelPicker
        totalSeconds={totalWheelSeconds}
        targetBounds={totalBounds}
        onValidate={handleTotalValidated}
        onCancel={() => closeSurface(openKey)}
        minutesAccessibilityLabel={strings.screens.exercise.wheelPicker.minutesAccessibilityLabel}
        secondsAccessibilityLabel={strings.screens.exercise.wheelPicker.secondsAccessibilityLabel}
        cancelAccessibilityLabel={strings.screens.exercise.wheelPicker.cancelAccessibilityLabel}
        validateAccessibilityLabel={strings.screens.exercise.wheelPicker.validateAccessibilityLabel}
      />
    );
  // PRE-5 story 2.5 (AC1, FR-15, FR-16, R-02, R-08) : « Changement de côté » en segmenté
  // `inline`, Avec à gauche, Sans à droite, sans direction ; Avec ⇔ `isBilateral` (un
  // historique `RIGHT_LEFT` ou `LEFT_RIGHT` s'affiche Avec). Non renseigné (`null`) : aucune
  // option sélectionnée ; le ✓ produit Sans (domaine).
  // Recette du 19/10 (RC-6, Figma `9462:18986` / `9462:18987`) : la ligne « Enchainement » est
  // retirée ; l'option Avec porte la notation de l'Enchainement effectif (D-431,
  // police réduite), nom accessible « Avec, <libellé neutre> » (D-407). Sélectionnée, son contenu
  // est le déclencheur du menu natif des deux notations (`SideOrderMenu`). À N = 1, Avec reprend
  // son libellé, sans menu (Q38, valeur conservée). Recette du 19/10 (RC-11 puis RC-12) : Sans de 62
  // (`narrow`, comme les autres Sans de la page), Avec de 146 (`notation`) portant la notation D-431
  // complète. Recette du 20/10 (RC-13, remplace RC-11 et RC-12 pour les largeurs) : Avec non
  // sélectionné (Sans, ou non renseigné) affiche « Avec », sans chevron, de 62 comme Sans ;
  // sélectionné à N > 1, il porte la notation et le chevron du menu dans 146 ; à N = 1, « Avec »
  // de 62. La largeur du segmenté varie (132 ou 216, comme le segment Phases) ; la ligne réserve
  // la plus grande (216, `SIDE_CONTROL_RESERVED_WIDTH`) : le libellé reste sur deux lignes.
  const sideChoice: SideChoice | null = draft.sideMode === null ? null : bilateral ? "WITH" : "WITHOUT";
  const sideOrder = effective.sideOrder;
  const sideControl = (
    <SegmentedControl<SideChoice>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.narrow}
      options={[
        sideOrderShown && sideChoice === "WITH"
          ? {
              value: "WITH",
              label: t.sideOrderSubtitles[sideOrder],
              accessibilityLabel: `${t.sideModeChoices.WITH}, ${t.sideOrders[sideOrder]}`,
              width: INLINE_OPTION_WIDTHS.notation,
              compact: true,
              selectedContent: (
                <SideOrderMenu value={sideOrder} onChange={chooseSideOrder} testID="execution-sheet-side-order-menu" />
              ),
            }
          : { value: "WITH", label: t.sideModeChoices.WITH },
        { value: "WITHOUT", label: t.sideModeChoices.WITHOUT },
      ]}
      value={sideChoice}
      onChange={chooseSide}
      accessibilityLabel={t.sideMode}
      testID="execution-sheet-side-control"
    />
  );
  // PRE-5 story 2.5 (AC3, AD-24, R-11) : « Cadence » en segmenté `inline` ; recette du 19/10
  // (RC-10) : Autre / 1 s / Sans, options de 62 comme celles de la Charge ; option affichée par
  // `cadenceOptionOf` (Autre tant que le ± est ouvert ; 2 s, 5 s et toute autre valeur → Autre).
  const cadenceControl = (
    <SegmentedControl<CadenceOption>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.narrow}
      options={CADENCE_OPTIONS.map((option) => ({ value: option, label: t.cadenceOptions[option] }))}
      value={cadenceOption}
      onChange={chooseCadence}
      accessibilityLabel={t.cadence}
      testID="execution-sheet-cadence-control"
    />
  );
  // PRE-5 story 2.4 (AC7, FR-04-01 de PRE-4) : choix du Type de série — même logique que
  // l'ancien panneau du Régime, sans cadre D-4 : le choix passe par `setVariable` (Brouillon,
  // inchangé) et ferme la surface ouverte.
  function chooseSeriesType(seriesType: SeriesType) {
    // T10 : panneau ou sélecteur ouvert — fermeture sans appliquer.
    if (openSurface.kind === "selector") {
      dispatchSurface({ type: "closeAll" });
      return;
    }
    // Recette du 20/10 (RC-15) : re-choisir le type affiché (zone de l'option hors valeur) ouvre ou
    // ferme le stepper du nombre de séries, comme le toucher de la valeur (même logique que
    // l'option Avec des phases) ; Brouillon et repli du tableau inchangés.
    if (seriesType === seriesTypeValue) {
      toggleSeriesCount();
      return;
    }
    const variable = seriesType === "VARIABLE";
    // PRE-5 story 2.2 (AD-27) : la saisie en cours est appliquée avant la transition.
    const base = keyboard.flush(draft);
    // Seul un passage effectif change le Brouillon et l'affichage.
    if (variable !== (seriesTypeValue === "VARIABLE")) {
      // Recette 1 (A-01) : passer en Variables présente le tableau déployé ; les données
      // restent celles du Brouillon.
      if (variable) setIsTableFolded(false);
      update(setVariable(base, variable));
      // Q40 : passer en Variables ouvre le tableau sélectionné.
      if (variable) setIsTableSelected(true);
    } else if (base !== draft) {
      commitKeyboard(() => base);
    }
    dispatchSurface({ type: "closeAll" });
  }

  /**
   * Recette du 20/10 (RC-15, RC-4) : ouvre ou referme le stepper du nombre de séries (surface
   * `stepper(count)` existante), saisie en cours appliquée d'abord.
   */
  function toggleSeriesCount() {
    const base = keyboard.flush(draft);
    if (base !== draft) commitKeyboard(() => base);
    toggle(stepperSurface("count"));
  }

  // PRE-5 story 2.4 (AC7, FR-28) : chevron de Variables — reprend l'ancien
  // `DisclosureControl` : replier ou déplier sans perte de valeurs ni de mode.
  // RC-15 : il n'ouvre pas le stepper du nombre de séries (une surface ouverte est rangée, T14).
  // RC-17 : stepper ouvert, le chevron est indisponible et son appui ferme le stepper seulement
  // (`toggleSeriesCount`), au lieu d'appeler cette fonction.
  function toggleTable() {
    // Q40 : déplier sélectionne le tableau ; replier le désélectionne.
    // T14 : toute surface ouverte (champ ± compris) est rangée.
    if (isTableFolded) selectTable();
    else {
      setIsTableSelected(false);
      dispatchSurface({ type: "closeAll" });
    }
    setIsTableFolded(!isTableFolded);
  }

  // D-5 : toucher le message le ferme SANS annuler l’ajustement ; seul « Annuler » (cadre
  // clair sur le fond sombre) restaure les valeurs précédant l’ajustement. Le conteneur
  // n’est pas un élément VoiceOver : texte et Annuler restent accessibles séparément.
  // Q41 : apparition et disparition par le bas, sans fondu (`SheetMotionView`, fil UI).
  // Story 3.6 (AD-8) : même message, même durée, pour « Série supprimée — Annuler », rendu
  // sous le tableau (sous la ligne `Séries` si le retrait ramène N à 1) au lieu de sous la
  // Durée totale.
  // PRE-5 story 2.6 (AD-27, FR-4) : message partagé avec le tableau des phases (`UndoMessage`).
  const adjustmentMessage =
    adjustment === null ? null : (
      <UndoMessage
        message={adjustment.message}
        undoLabel={strings.screens.exercise.adjustedTotalDurationUndoAction}
        onDismiss={() => setAdjustment(null)}
        onUndo={handleAdjustmentUndo}
        testID="execution-sheet-adjusted"
      />
    );

  /**
   * D-434 (décision de Hermann du 19/10 ; QD-434-1, QD-434-4) — cellule clavier `kind` de la
   * ligne d'identité `row` (numéro affiché `number`) : Cible (« MM:SS » en Durée, entier en
   * Répétitions ; au repos « 1 min 5 s », « 12 rép. », « à l’échec » ou « — » sur #FFF1F0),
   * Pause (« MM:SS » ; au repos « 0 s », « 1 min 30 s ») et Charge (clavier décimal). Le
   * focus sélectionne le tableau ; la saisie est appliquée à la sortie (`useSheetKeyboard`).
   */
  const keyboardCell = (kind: RowCellKind, row: number, number: number): ReactNode => {
    const index = draft.rowIds.indexOf(row);
    const seriesRow = draft.rows[index];
    if (seriesRow === undefined || (kind === "rowTarget" && effective.mode === null)) {
      return <View style={tableStyles.emptyCell} />;
    }
    const field = rowCellField(kind, row);
    const common = {
      editText: keyboard.editText(field),
      active: isOpen({ kind: "keyboard", field }),
      onFocus: () => focusKeyboardField(field),
      onBlur: () => keyboard.onBlur(field),
      onChangeText: (text: string) => keyboard.onChangeText(field, text),
      inputRef: keyboard.register(field, TABLE_ROW_HEIGHT),
      // AD-28 : cible tactile de 36 (24 + 6 en haut et en bas).
      hitSlop: KEYBOARD_CELL_HIT_SLOP,
      style: [tableCellStyle, styles.keyboardCell],
      valueStyle: tableCellValueStyle,
      entryGeneration: keyboard.entryGeneration,
    };
    const prefix = `${SERIES_ROW_TEST_ID}-${number}`;
    if (kind === "rowTarget") {
      const mode = effective.mode === "REPETITIONS" ? "REPETITIONS" : "DURATION";
      // Story 3.6 (FR-06-05) : « à l’échec » pour une Cible à l'échec, sinon la valeur ou « — ».
      const text = seriesRow.target.kind === "FAILURE" ? t.failureTarget : targetLabel(targetNumber(seriesRow.target));
      const hint = invalidRows.get(index);
      return (
        <KeyboardField
          {...common}
          mode={mode === "DURATION" ? "cellDuration" : "cellInteger"}
          displayValue={text}
          // Story 3.8 (AC2) : une Cible « — » est annoncée « aucune valeur », jamais « tiret ».
          spokenDisplayValue={spokenValue(text)}
          invalid={hint !== undefined}
          accessibilityHint={hint}
          accessibilityLabel={t.rowTarget.replace("{n}", String(number)).replace("{field}", t.columns[mode])}
          testID={`${prefix}-target`}
        />
      );
    }
    if (kind === "rowPause") {
      return (
        <KeyboardField
          {...common}
          mode="cellDuration"
          displayValue={pauseLabel(seriesRow.pauseSeconds)}
          accessibilityLabel={t.rowPause.replace("{n}", String(number))}
          testID={`${prefix}-pause`}
        />
      );
    }
    return (
      <KeyboardField
        {...common}
        mode="cellDecimal"
        displayValue={formatLoadKg(seriesRow.loadKg)}
        accessibilityLabel={t.rowLoad.replace("{n}", String(number))}
        testID={`${prefix}-load`}
      />
    );
  };

  /**
   * PRE-5 story 2.8 (FR-6, D-434, AD-26) — cellule clavier `kind` de la phase d'identité
   * `phaseId` (numéro affiché `number`) :
   * - Libellé : `KeyboardField` en mode `text` (clavier texte, 20 points de code, Retour ferme,
   *   sans barre) ; au repos, le libellé ou « Phase n » s'il est vide (position courante) ;
   * - Durée : `KeyboardField` en mode `cellDuration` (« MM:SS » au focus) ; au repos « 9 s »,
   *   « 1 min 5 s » ou « — » sur #FFF1F0 (à renseigner).
   * La saisie est appliquée à la sortie (`useSheetKeyboard` : `setWorkPhaseLabel`,
   * `setWorkPhaseDuration`).
   */
  const phaseCell = (kind: WorkPhaseCellKind, phaseId: number, number: number): ReactNode => {
    const phase = draft.workPhases.find((current) => current.id === phaseId);
    if (phase === undefined) return null;
    const field: KeyboardFieldId = { kind, phase: phaseId };
    const common = {
      editText: keyboard.editText(field),
      active: isOpen({ kind: "keyboard", field }),
      onFocus: () => focusKeyboardField(field),
      onBlur: () => keyboard.onBlur(field),
      onChangeText: (text: string) => keyboard.onChangeText(field, text),
      inputRef: keyboard.register(field, TABLE_ROW_HEIGHT),
      // AD-28 : cible tactile de 36 (24 + 6 en haut et en bas).
      hitSlop: KEYBOARD_CELL_HIT_SLOP,
    };
    const prefix = `${PHASE_ROW_TEST_ID}-${number}`;
    if (kind === "phaseLabel") {
      return (
        <KeyboardField
          {...common}
          mode="text"
          displayValue={phase.label.trim() === "" ? defaultPhaseLabel(number) : phase.label}
          accessibilityLabel={t.phaseLabel.replace("{n}", String(number))}
          style={[tableCellValueStyle, styles.phaseLabelInput]}
          testID={`${prefix}-label`}
        />
      );
    }
    const text = secondsLabel(phase.durationSeconds);
    const missing = phase.durationSeconds === null;
    return (
      <KeyboardField
        {...common}
        mode="cellDuration"
        displayValue={text}
        // Story 3.8 (AC2) : « — » annoncé « aucune valeur », jamais « tiret ».
        spokenDisplayValue={spokenValue(text)}
        invalid={missing}
        accessibilityHint={missing ? t.invalidHint : undefined}
        accessibilityLabel={t.phaseDuration.replace("{n}", String(number))}
        style={[tableCellStyle, styles.keyboardCell]}
        valueStyle={tableCellValueStyle}
        entryGeneration={keyboard.entryGeneration}
        testID={`${prefix}-duration`}
      />
    );
  };

  // PRE-5 story 2.8 (FR-2, FR-4, FR-27, FR-28, D-432) : segmenté « Phases de l'exercice ».
  // Avec n'est disponible que si `canEnableWorkPhases` (Mode Durée, À la cible, séries
  // identiques effectives) ou si des phases existent ; sinon indisponible, Sans affiché.
  // Sélectionné, Avec affiche « n phases » (réglage du nombre révélé au toucher) et le chevron
  // du tableau ; sa largeur suit l'état (constantes `PHASE_OPTION_*`).
  const phaseCountOpen = isOpen(stepperSurface("phaseCount"));
  const phasesControl = (
    <SegmentedControl<PhaseChoice>
      variant="inline"
      optionWidth={INLINE_OPTION_WIDTHS.narrow}
      // Recette du 20/10 (RC-16) : réglage ouvert, segmenté de 34 (fond clair de 28, comme RC-15).
      height={hasWorkPhases && phaseCountOpen ? PHASE_CONTROL_OPEN_HEIGHT : undefined}
      options={[
        hasWorkPhases
          ? {
              value: "WITH",
              label: t.workPhaseChoices.WITH,
              width: phaseCountOpen ? PHASE_OPTION_OPEN_WIDTH : PHASE_OPTION_CLOSED_WIDTH,
              // RC-16 : réglage ouvert, l'option dessine son fond clair (`#EAEAFF`, comme la charge active).
              ownSurface: phaseCountOpen,
              selectedContent: (
                <PhaseCountField
                  isOpen={phaseCountOpen}
                  onToggle={togglePhaseCount}
                  count={draft.workPhases.length}
                  onChange={changePhaseCount}
                  folded={isPhasesFolded}
                  onChevronPress={togglePhasesTable}
                />
              ),
            }
          : { value: "WITH", label: t.workPhaseChoices.WITH, disabled: !canEnableWorkPhases(draft) },
        { value: "WITHOUT", label: t.workPhaseChoices.WITHOUT },
      ]}
      value={hasWorkPhases ? "WITH" : "WITHOUT"}
      onChange={choosePhases}
      accessibilityLabel={t.workPhases}
      testID="execution-sheet-phases-control"
    />
  );
  const activePhase = openSurface.kind === "keyboard" ? keyboardFieldPhase(openSurface.field) : null;

  // Q41 : un seul panneau ouvert à la fois ; la roue garde sa propre surface
  // (`DurationWheelPicker`). PRE-5 story 2.5 : plus aucun segmenté en panneau.
  const panel =
    panelControl === null ? null : (
      <AnchoredPanel
        key={panelControl}
        placement={{ top: panelTop, right: FRAME_INSET }}
        onDismiss={() => closeSurface(openKey)}
        outsideInsets={PANEL_OUTSIDE_INSETS}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setPanelHeight((current) =>
            current !== null && current.control === panelControl && current.height === height ? current : { control: panelControl, height },
          );
        }}
        testID={PANEL_TEST_IDS[panelControl]}
      >
        {panelControl === "uniformDuration" ? <View testID="execution-sheet-target-wheel">{uniformDurationWheel}</View> : null}
        {panelControl === "uniformRepetitions" ? <View testID="execution-sheet-target-wheel">{uniformRepetitionsWheel}</View> : null}
        {panelControl === "total" ? <View testID="execution-sheet-total-wheel">{totalWheel}</View> : null}
      </AnchoredPanel>
    );

  return (
    <Modal transparent visible animationType="fade" onRequestClose={handleCancel} testID="execution-sheet-modal">
      <View
        ref={scrimRef}
        style={styles.scrim}
        // RC-1 : bas réel de la zone de la `Modal` (coordonnées de la fenêtre), repère de la barre du clavier.
        onLayout={() => {
          scrimRef.current?.measureInWindow((_x, y, _width, height) => {
            if (height > 0) setScrimBottom((current) => (current === y + height ? current : y + height));
          });
        }}
        testID="execution-sheet-scrim"
      >
        {/* Q39 (Hermann, 2026-10-17, E-13) : la montée (`sheetEntry`, fil natif, inchangée)
            porte sur un cadre transparent plein écran ; la surface blanche, ancrée en bas
            à l'intérieur, glisse vers sa nouvelle hauteur (Reanimated, fil UI) quand une
            ligne apparaît ou disparaît, au lieu de sauter. */}
        <Animated.View
          style={[styles.sheetFrame, { transform: [{ translateY: sheetEntry }] }]}
          accessibilityViewIsModal
          testID="execution-sheet"
        >
          <SheetMotionProvider reduceMotion={reduceMotion}>
            <SheetMotionView
              appear={false}
              style={[styles.sheet, { maxHeight: windowHeight - insets.top - spacing[24], paddingBottom: insets.bottom }]}
              testID="execution-sheet-surface"
            >
              <View style={styles.handle} />
              <View style={styles.header} testID="execution-sheet-header">
                <Pressable
                  onPress={handleCancel}
                  accessibilityRole="button"
                  accessibilityLabel={t.cancelAccessibilityLabel}
                  hitSlop={(minTouchTarget - 38) / 2}
                  style={styles.cancelCircle}
                  testID="execution-sheet-cancel"
                >
                  <KodjoIcon name="wheel-action-cancel" />
                </Pressable>
                <Text style={styles.title} accessibilityRole="header">
                  {t.title}
                </Text>
                <Pressable
                  onPress={handleValidate}
                  // Story 3.8 (AC5) : ✓ grisé (Brouillon invalide) mais surface ouverte — l'appui
                  // reste reçu pour fermer la surface (`absorbSheetCommand`) ; l'état d'accessibilité
                  // suit l'activabilité réelle, le libellé garde « indisponible… » et le rendu reste grisé.
                  disabled={validateDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={validateLabel}
                  accessibilityState={{ disabled: validateDisabled }}
                  hitSlop={(minTouchTarget - 38) / 2}
                  style={[styles.validateCircle, validation.ok ? null : styles.validateCircleDisabled]}
                  testID="execution-sheet-validate"
                >
                  <KodjoIcon name="wheel-action-validate" />
                </Pressable>
              </View>
              <View style={styles.headerDivider} />

              <SheetMotionScrollView
                ref={scrollRef}
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
                // PRE-5 story 2.2 (FR-24, AD-26) : course de défilement sous le clavier (prop
                // standard iOS) et offset suivi pour ramener la ligne active au-dessus du clavier.
                automaticallyAdjustKeyboardInsets
                onScroll={keyboard.onScroll}
                scrollEventThrottle={16}
                scrollEnabled={!isDraggingRow}
                onLayout={(event) => {
                  viewportHeightRef.current = event.nativeEvent.layout.height;
                }}
                onContentSizeChange={(_width, height) => {
                  // Q41 : feuille à sa hauteur maximale et réserve ajoutée sous le groupe :
                  // le corps défile jusqu'au bas pour montrer le panneau en entier.
                  if (panelRoom > 0 && height > viewportHeightRef.current + 1) {
                    scrollRef.current?.scrollToEnd({ animated: !reduceMotion });
                  }
                }}
                testID="execution-sheet-body"
              >
                {/* Q41 : hôte des panneaux sans flèche — le groupe, la réserve éventuelle
                    sous le groupe, puis la zone de toucher extérieur et le panneau, rendus
                    au-dessus des lignes.
                    Story 3.3 (AD-15, T23) : un appui dans le corps qui n'atteint aucun
                    contrôle (libellé, fond du groupe, marge) range un champ ± ouvert, sans
                    bouton Annuler ; les valeurs restent dans le Brouillon de la Feuille.
                    Non accessible : n'altère pas le parcours VoiceOver des lignes. */}
                <Pressable
                  onPress={() => dispatchSurface({ type: "outside" })}
                  accessible={false}
                  testID="execution-sheet-panel-host"
                >
                {/* T23 : la zone d'appui extérieur couvre aussi les marges du corps défilant
                    (dessus, côtés, et sous la dernière ligne), sous toutes les lignes. */}
                <Pressable
                  onPress={() => dispatchSurface({ type: "outside" })}
                  accessible={false}
                  style={styles.bodyOutside}
                  testID="execution-sheet-body-outside"
                />
                {/* PRE-5 story 2.4 (FR-26, AD-28) : quatre cadres gris arrondis, espacés de 8,
                    enfants directs de l'hôte des panneaux (repère `anchorTop`). Chaque cadre
                    glisse quand son contenu change (Q39) ; séparateurs seulement entre les
                    lignes d'un même cadre. */}
                {/* Cadre Exécution : Mode, Condition d'arrêt. */}
                <SheetMotionView
                  appear={false}
                  onLayout={trackFrame("execution")}
                  style={styles.frame}
                  testID="execution-sheet-frame-execution"
                >
                  <Row label={t.mode} testID="execution-sheet-row-mode">
                    {modeControl}
                  </Row>
                  <Separator />
                  <Row label={t.stopCondition} testID="execution-sheet-row-stop-condition">
                    {stopConditionControl}
                  </Row>
                </SheetMotionView>

                {/* Cadre Séries : Phases, Type de série (portant le nombre de séries, RC-15) et
                    tableau, puis Durée ou Répétitions et Pause en identiques. */}
                <SheetMotionView
                  appear={false}
                  onLayout={trackFrame("series")}
                  style={[styles.frame, styles.frameSpaced]}
                  testID="execution-sheet-frame-series"
                >
                  {/* PRE-5 story 2.8 (FR-4, FR-26, D-432) : ligne « Phases de l'exercice » en tête
                      du cadre Séries, puis le tableau des phases (déployé) et le message de
                      retrait d'une phase. Même groupe à découpe que le tableau des séries (E-20 :
                      une seule animation à l'apparition du tableau), découpe levée pendant un
                      glisser. */}
                  <SheetMotionView
                    appear={false}
                    style={[styles.variableGroup, isDraggingRow ? null : styles.variableGroupClip]}
                    testID="execution-sheet-phases-group"
                  >
                    <Row label={t.workPhases} selected={phaseCountOpen} testID="execution-sheet-row-phases">
                      {phasesControl}
                    </Row>
                    {hasWorkPhases && !isPhasesFolded ? <Separator /> : null}
                    {hasWorkPhases && !isPhasesFolded ? (
                      <WorkPhasesTable
                        phases={draft.workPhases}
                        activePhase={activePhase}
                        onRemove={handleRemovePhase}
                        removalActive={removalEnabled(surface)}
                        onMove={(from, to) => update(moveWorkPhase(keyboard.flush(draft), from, to))}
                        onDraggingChange={(dragging) => {
                          setIsDraggingRow(dragging);
                          if (dragging) {
                            // AD-27 : saisie appliquée avant le glisser ; la surface ouverte est rangée.
                            const base = keyboard.flush(draft);
                            if (base !== draft) commitKeyboard(() => base);
                            setIsTableSelected(false);
                            dispatchSurface({ type: "closeAll" });
                          }
                        }}
                        cell={phaseCell}
                        bleed={TABLE_BLOCK_BLEED}
                        style={styles.tableBlock}
                      />
                    ) : null}
                    {adjustment?.kind === "phaseRemoval" ? adjustmentMessage : null}
                  </SheetMotionView>
                  {/* Story 2.8 (AC3b, PR-02, Figma `9207:18817`) : aucun séparateur après le tableau
                      des phases déployé ; sinon, séparateur entre les deux lignes. */}
                  {hasWorkPhases && !isPhasesFolded ? null : <Separator />}
                  {/* Recette du 20/10 (RC-15) : plus de ligne « Nombre de séries » ; le nombre est
                      porté par le segmenté du Type de série (NR Δ38 : règles et accessibilité du
                      stepper conservées, présentation remplacée). */}
                  {/* Q40 (Hermann, 2026-10-17, E-14) : tableau sélectionné (ouvert, ou action
                      dedans) = fond d'une ligne sélectionnée, sans contour, qui couvre la ligne
                      « Type de série » et le tableau ; sinon état normal. Le séparateur reste à
                      sa place (transparent si sélectionné) : rien ne bouge quand la sélection
                      change. Q39 : le groupe glisse quand le tableau apparaît ou disparaît. */}
                  <SheetMotionView
                    appear={false}
                    // E-20 (recette du 2026-10-18) : une seule animation à l'apparition du tableau —
                    // le groupe découpe son contenu et le révèle en s'agrandissant (transition de
                    // place), le tableau n'a plus de révélation propre (`enter={false}`). Découpe
                    // levée pendant un glisser, pour que la ligne portée suive le doigt.
                    style={[
                      styles.variableGroup,
                      tableSelected ? styles.variableGroupSelected : null,
                      isDraggingRow ? null : styles.variableGroupClip,
                    ]}
                    testID="execution-sheet-variable-group"
                  >
                    <Row label={t.seriesType} testID="execution-sheet-row-series-type">
                      {single ? (
                        // P16, T23 : l'information non modifiable (Variables indisponible) absorbe
                        // l'appui (comme l'ancienne pastille du Régime) ; un champ ± ouvert reste
                        // ouvert. RC-15 : le nombre de séries, dans Identiques, reste réglable.
                        <Pressable onPress={ignorePress} accessible={false} testID="execution-sheet-series-type-absorb">
                          {seriesTypeControl}
                        </Pressable>
                      ) : (
                        seriesTypeControl
                      )}
                    </Row>
                    {/* Story 3.6 (AC1) : le tableau suit la grille à cellules du DSF du 12/10,
                        sans retrait x52 : il commence au bord des lignes de premier niveau. */}
                    {showVariableTable && !isTableFolded ? <Separator hidden={tableSelected} /> : null}
                    {showVariableTable && !isTableFolded ? (
                      <VariableTable
                        draft={draft}
                        mode={effective.mode}
                        onRemove={handleRemove}
                        removalActive={removalEnabled(surface)}
                        onMove={(from, to) => updateInTable(moveRow(keyboard.flush(draft), from, to))}
                        onDraggingChange={(dragging) => {
                          setIsDraggingRow(dragging);
                          if (dragging) {
                            // PRE-5 story 2.2 (AD-27) : saisie appliquée avant le glisser.
                            const base = keyboard.flush(draft);
                            if (base !== draft) commitKeyboard(() => base);
                            selectTable();
                          }
                        }}
                        cell={keyboardCell}
                        loadColumn={draft.loadEnabled}
                      />
                    ) : null}
                    {adjustment?.kind === "removal" ? adjustmentMessage : null}
                  </SheetMotionView>

                  {/* PRE-5 story 2.4 (FR-21) : à l'échec, la ligne de cible est masquée ; la
                      Pause reste visible. */}
                  {uniformTargetShown && effective.mode === "DURATION" ? (
                    <>
                      <Separator />
                      <Row
                        label={t.durationTarget}
                        selected={isOpen(TARGET_SELECTOR)}
                        // PRE-5 story 2.8 (FR-3) : avec des phases, valeur annoncée non modifiable.
                        accessibilityLabel={
                          hasWorkPhases
                            ? [t.durationTarget, spokenValue(uniformDurationText), t.totalReadOnlySpoken, uniformTargetInvalid ? uniformTargetHint : null]
                                .filter((part) => part !== null && part !== undefined)
                                .join(", ")
                            : undefined
                        }
                        onLayout={trackRow("uniformDuration")}
                        below={
                          // Q41 : Android et web — roulette en ligne, dans le cadre de sélection.
                          !anchoredPanels && isOpen(TARGET_SELECTOR) && uniformDurationAvailable ? (
                            <SheetMotionView style={styles.inlineControl} testID="execution-sheet-target-wheel">
                              {uniformDurationWheel}
                            </SheetMotionView>
                          ) : null
                        }
                        testID="execution-sheet-row-target"
                      >
                        {/* PRE-5 story 2.8 (FR-3, AC6) : D = Σ des phases, sans roue ni pastille modifiable. */}
                        {hasWorkPhases ? (
                          // Valeur en violation (✓ indisponible) : marquée comme une valeur à renseigner (Q35).
                          <View
                            style={uniformTargetInvalid ? [styles.valuePill, styles.valuePillInvalid] : null}
                            testID="execution-sheet-target-static"
                          >
                            <Text style={styles.staticValue} testID="execution-sheet-target-text">
                              {uniformDurationText}
                            </Text>
                          </View>
                        ) : (
                          uniformDurationPill
                        )}
                      </Row>
                    </>
                  ) : null}
                  {uniformTargetShown && effective.mode === "REPETITIONS" ? (
                    <>
                      <Separator />
                      <Row
                        label={t.repetitionsTarget}
                        selected={isOpen(TARGET_SELECTOR)}
                        onLayout={trackRow("uniformRepetitions")}
                        below={
                          // Q41 : Android et web — roulette en ligne, dans le cadre de sélection.
                          !anchoredPanels && isOpen(TARGET_SELECTOR) && uniformRepetitionsAvailable ? (
                            <SheetMotionView style={styles.inlineControl} testID="execution-sheet-target-wheel">
                              {uniformRepetitionsWheel}
                            </SheetMotionView>
                          ) : null
                        }
                        testID="execution-sheet-row-target"
                      >
                        {/* Story 3.5 (AC2) : plus de stepper en ligne ; la pastille ouvre le Sélecteur. */}
                        {uniformRepetitionsPill}
                      </Row>
                    </>
                  ) : null}
                  {!showVariableTable ? (
                    <>
                      <Separator />
                      <Row label={t.pause} selected={isOpen(stepperSurface("pause"))} testID="execution-sheet-row-pause">
                        {stepperField("pause", t.pause, {
                          value: effectiveFirst.pauseSeconds,
                          min: EXECUTION_BOUNDS.pauseSeconds.min,
                          max: EXECUTION_BOUNDS.pauseSeconds.max,
                          policy: EXECUTION_ACCELERATED_HOLD_POLICY,
                          formatValue: pauseLabel,
                          onChange: (value) => update(setUniformPause(draft, value)),
                          accessibilityLabel: `${t.pause}, ${t.secondsUnit}`,
                          testID: "execution-sheet-pause",
                        })}
                      </Row>
                    </>
                  ) : null}
                  {/* PRE-5 story 2.2 (FR-23, AC5) : ligne « Charge » en dernier dans le cadre
                      Séries — après la Pause en identiques, sous le groupe du tableau en
                      variables. PRE-5 story 2.7 (AC1, AD-28, Figma `9289:17849`) : en
                      identiques, le champ commun est le contenu de l'option Avec sélectionnée
                      (« 20 kg » dans le segment) ; son toucher lui donne le focus. En variables,
                      l'option garde « Avec » (`9290:17953`). Recette du 20/10 (RC-14) : même
                      saisie que les cellules (D-434, `cellDecimal`) ; Avec ouvre le clavier dans
                      l'option, élargie au strict nécessaire si la valeur ne tient pas dans 62. */}
                  <Separator />
                  <Row label={t.load} testID="execution-sheet-row-load">
                    <SegmentedControl<LoadChoice>
                      variant="inline"
                      optionWidth={INLINE_OPTION_WIDTHS.narrow}
                      options={[
                        {
                          value: "WITH",
                          label: t.loadWith,
                          width: uniformLoadShown ? uniformLoadWidth : undefined,
                          // Le segment sous le champ annonce aussi la valeur affichée.
                          accessibilityLabel: uniformLoadShown
                            ? `${t.loadWith}, ${formatLoadKg(effectiveFirst.loadKg)}`
                            : undefined,
                          selectedContent: uniformLoadShown ? (
                            <KeyboardField
                              mode="cellDecimal"
                              displayValue={uniformLoadText}
                              editText={keyboard.editText(UNIFORM_LOAD_FIELD)}
                              active={uniformLoadActive}
                              onFocus={() => {
                                setUniformLoadEntry(keyboard.editText(UNIFORM_LOAD_FIELD));
                                focusKeyboardField(UNIFORM_LOAD_FIELD);
                              }}
                              onBlur={() => {
                                setUniformLoadEntry(null);
                                keyboard.onBlur(UNIFORM_LOAD_FIELD);
                              }}
                              onChangeText={(text) => {
                                setUniformLoadEntry(text);
                                keyboard.onChangeText(UNIFORM_LOAD_FIELD, text);
                              }}
                              inputRef={keyboard.register(UNIFORM_LOAD_FIELD, SHEET_ROW_MIN_HEIGHT)}
                              accessibilityLabel={t.loadValue}
                              hitSlop={LOAD_SEGMENT_HIT_SLOP}
                              style={[styles.loadSegmentInput, { width: uniformLoadWidth }]}
                              valueStyle={[inlineSelectedLabelStyle, uniformLoadActive ? styles.loadSegmentInputActive : null]}
                              entryGeneration={keyboard.entryGeneration}
                              testID="execution-sheet-load-input"
                            />
                          ) : undefined,
                        },
                        { value: "WITHOUT", label: t.loadWithout },
                      ]}
                      value={draft.loadEnabled ? "WITH" : "WITHOUT"}
                      onChange={chooseLoad}
                      accessibilityLabel={t.load}
                      testID="execution-sheet-load-control"
                    />
                  </Row>
                </SheetMotionView>

                {/* Cadre Côtés : Changement de côté (portant l'Enchainement, RC-6), Pause entre
                    les côtés. PRE-5 story 2.5 (AC1, AC2 ; Figma `9230:19534`) : lignes non
                    indentées (marge 12, comme le cadre Séries), libellés Regular 12, lignes de 44. */}
                <SheetMotionView
                  appear={false}
                  onLayout={trackFrame("sides")}
                  style={[styles.frame, styles.frameSpaced]}
                  testID="execution-sheet-frame-sides"
                >
                  <Row label={t.sideMode} testID="execution-sheet-row-side">
                    {/* RC-13 : place du segmenté le plus large réservée, segmenté aligné à droite. */}
                    <View style={styles.sideControlSlot} testID="execution-sheet-side-control-slot">
                      {sideControl}
                    </View>
                  </Row>
                  {sideSettingsShown ? (
                    <>
                      {/* Q38 (Hermann, 2026-10-17, E-12) ; RC-6 : à N = 1, l'option Avec n'a ni
                          notation ni menu ; l'Enchainement choisi reste dans le Brouillon
                          (`draft.sideOrder`) et réapparaît dès N ≥ 2 ; la normalisation
                          effective « Un côté après l’autre » à N = 1 est inchangée (FR-12-04).
                          Le stepper du nombre de séries n'en est pas modifié (NR Δ38). */}
                      <Separator />
                      <Row
                        label={t.sideRecovery}
                        longLabel
                        selected={isOpen(stepperSurface("sideRecovery"))}
                        testID="execution-sheet-row-side-recovery"
                      >
                        {stepperField("sideRecovery", t.sideRecovery, {
                          value: draft.sideRecoverySeconds,
                          min: EXECUTION_BOUNDS.sideRecoverySeconds.min,
                          max: EXECUTION_BOUNDS.sideRecoverySeconds.max,
                          policy: EXECUTION_ACCELERATED_HOLD_POLICY,
                          formatValue: pauseLabel,
                          onChange: (value) => update(setSideRecovery(draft, value)),
                          accessibilityLabel: `${t.sideRecovery}, ${t.secondsUnit}`,
                          testID: "execution-sheet-side-recovery",
                        })}
                      </Row>
                    </>
                  ) : null}
                </SheetMotionView>

                {/* Cadre Cadence et durée : Cadence, Durée de l'exercice, Compte à rebours, Fin. */}
                <SheetMotionView
                  appear={false}
                  onLayout={trackFrame("cadence")}
                  style={[styles.frame, styles.frameSpaced]}
                  testID="execution-sheet-frame-cadence"
                >
                  {/* PRE-5 story 2.5 (AC3) : Cadence ; Autre révèle sous la ligne, aligné à
                      droite, le ± existant (0..10, pas 1, sans accélération). */}
                  <Row
                    label={t.cadence}
                    selected={beepOpen}
                    below={
                      beepOpen ? (
                        <SheetMotionView style={styles.revealedStepperLine} testID="execution-sheet-beep-motion">
                          <RevealedStepperField
                            onClose={() => toggle(stepperSurface("beep"))}
                            value={draft.cadenceBeepIntervalSeconds}
                            min={EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.min}
                            max={EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.max}
                            policy={EXECUTION_UNIT_HOLD_POLICY}
                            formatValue={beepLabel}
                            onChange={(value) => update(setCadenceBeep(draft, value))}
                            accessibilityLabel={`${t.cadence}, ${t.secondsUnit}`}
                            width={STEPPER_WIDTH}
                            testID="execution-sheet-beep"
                          />
                        </SheetMotionView>
                      ) : null
                    }
                    testID="execution-sheet-row-beep"
                  >
                    {cadenceControl}
                  </Row>

                  {/* D-433 : ligne « Durée de l'exercice » toujours présente, même place. */}
                  <>
                    <Separator />
                    <Row
                      label={t.exerciseDuration}
                      // PRE-5 story 2.5 (AC4, AD-28) : chevron à 12 du libellé, cible distincte
                      // de la pastille ; absent pour un Exercice ouvert depuis une Séance.
                      labelAccessory={
                        durationDisclosure ? (
                          <DisclosureControl
                            expanded={isDurationExpanded}
                            onPress={toggleDuration}
                            accessibilityLabel={isDurationExpanded ? t.hideExerciseSignals : t.showExerciseSignals}
                            testID="execution-sheet-duration-disclosure"
                          />
                        ) : null
                      }
                      accessibilityLabel={totalSpokenLabel}
                      selected={isOpen(TOTAL_SELECTOR)}
                      onLayout={trackRow("total")}
                      below={
                        // Q41 : Android et web — roulette en ligne, dans le cadre de sélection.
                        !anchoredPanels && isOpen(TOTAL_SELECTOR) && totalWheel !== null ? (
                          <SheetMotionView style={styles.inlineControl} testID="execution-sheet-total-wheel">
                            {totalWheel}
                          </SheetMotionView>
                        ) : null
                      }
                      testID="execution-sheet-row-total"
                    >
                      {totalWheelSeconds !== undefined ? (
                        <ValuePill
                          value={totalText}
                          accessibilityLabel={`${t.exerciseDurationEditAccessibilityLabel}, ${totalText}`}
                          expanded={isOpen(TOTAL_SELECTOR)}
                          onPress={() => toggle(TOTAL_SELECTOR)}
                          testID="execution-sheet-total"
                        />
                      ) : (
                        <Text style={styles.staticValue} testID="execution-sheet-total-text">
                          {totalText}
                        </Text>
                      )}
                    </Row>
                    {adjustment?.kind === "total" ? adjustmentMessage : null}
                  </>

                  {/* PRE-5 story 2.5 (AC4) : repliés, Compte à rebours et Fin ne sont pas rendus ;
                      leurs valeurs restent dans le Brouillon. */}
                  {signalsShown ? (
                    <>
                      <Separator />
                      <Row label={t.countdown} selected={isOpen(stepperSurface("countdown"))} testID="execution-sheet-row-countdown">
                        {stepperField("countdown", t.countdown, {
                          value: draft.countdownSeconds,
                          min: EXECUTION_BOUNDS.countdownSeconds.min,
                          max: EXECUTION_BOUNDS.countdownSeconds.max,
                          policy: EXECUTION_UNIT_HOLD_POLICY,
                          formatValue: pauseLabel,
                          onChange: (value) => update(setCountdown(draft, value)),
                          accessibilityLabel: `${t.countdown}, ${t.secondsUnit}`,
                          testID: "execution-sheet-countdown",
                        })}
                      </Row>
                      <Separator />
                      <Row label={t.end} selected={isOpen(stepperSurface("end"))} testID="execution-sheet-row-end">
                        {stepperField("end", t.end, {
                          value: draft.endSeconds,
                          min: EXECUTION_BOUNDS.endSeconds.min,
                          max: EXECUTION_BOUNDS.endSeconds.max,
                          policy: EXECUTION_UNIT_HOLD_POLICY,
                          formatValue: pauseLabel,
                          onChange: (value) => update(setEnd(draft, value)),
                          accessibilityLabel: `${t.end}, ${t.secondsUnit}`,
                          testID: "execution-sheet-end",
                        })}
                      </Row>
                    </>
                  ) : null}
                </SheetMotionView>
                {panelRoom > 0 ? <View style={{ height: panelRoom }} testID="execution-sheet-panel-room" /> : null}
                {panel}
                </Pressable>
              </SheetMotionScrollView>
            </SheetMotionView>
          </SheetMotionProvider>
          {/* PRE-5 story 2.2 (FR-25), recette du 19/10 (RC-1) : barre du clavier décimal rendue
              par la Feuille, juste au-dessus du clavier, pendant la saisie d'un champ Charge
              (iOS). Dans le cadre de la Feuille (`accessibilityViewIsModal`) : atteinte par
              VoiceOver ; le cadre couvre la zone de la `Modal`, dont le bas est mesuré. */}
          {keyboard.accessoryVisible && keyboard.keyboardFrame !== null ? (
            <KeyboardAccessoryBar
              keyboardFrame={keyboard.keyboardFrame}
              containerBottom={scrimBottom ?? windowHeight}
              reduceMotion={reduceMotion}
              onHeight={keyboard.setAccessoryHeight}
              canPrevious={keyboard.canPrevious}
              canNext={keyboard.canNext}
              onPrevious={keyboard.previous}
              onNext={keyboard.next}
              onClose={keyboard.close}
              failure={
                keyboard.failureAvailable ? { selected: keyboard.failureSelected, onPress: keyboard.toggleFailure } : null
              }
            />
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * PRE-5 story 2.6 (AD-27, AD-28, FR-29, UX-DR3) — tableau des séries variables : bloc
 * blanc, lignes de 36, cellules à valeur seule, sans stepper permanent. Glisser PRE-3,
 * actions accessibles, croix et « Série supprimée — Annuler » viennent des briques partagées
 * (`sheetTable.tsx`).
 *
 * D-434 (décision de Hermann du 19/10) : les cellules Cible, Pause et Charge sont des champs
 * clavier, rendus par la Feuille (`cell`) ; plus de roue de cellule ni de ± de Pause révélé
 * sous la ligne.
 */
function VariableTable({
  draft,
  mode,
  onRemove,
  removalActive,
  onMove,
  onDraggingChange,
  cell,
  loadColumn,
}: {
  draft: ExecutionSheetDraft;
  mode: ExecutionMode | null;
  onRemove: (row: number) => void;
  /** Story 3.6 (T18, T23) : la croix retire ; sinon son appui range d'abord l'outil ouvert. */
  removalActive: boolean;
  onMove: (from: number, to: number) => void;
  onDraggingChange: (dragging: boolean) => void;
  /** D-434 : cellule clavier `kind` de la ligne d'identité `row` (numéro affiché `number`). */
  cell: (kind: RowCellKind, row: number, number: number) => ReactNode;
  /** PRE-5 story 2.2 (FR-23, AC5) : charge Avec — colonne Charge après la Pause. */
  loadColumn: boolean;
}) {
  const rows = draft.rows;
  // Recette 2 (T-15, demande de Hermann) : repère d’insertion pendant le glisser.
  const [drag, setDrag] = useState<{ readonly from: number; readonly to: number } | null>(null);
  const guideBefore = drag === null || drag.to === drag.from ? null : drag.to < drag.from ? drag.to : drag.to + 1;
  function handleDrag(next: { readonly from: number; readonly to: number } | null) {
    setDrag(next);
    onDraggingChange(next !== null);
  }
  // Recette du 19/10 (RC-5) : ligne saisie (identité), de l'appui sur la poignée à la fin de son insertion.
  const [liftedRow, setLiftedRow] = useState<number | null>(null);
  const unclipped = drag !== null || liftedRow !== null;
  const insertionGuide = (before: number) => <InsertionGuide testID={`execution-sheet-table-insertion-guide-before-${before}`} />;
  return (
    // Q39 : la hauteur du tableau suit les lignes en glissant. Q41 : le tableau et
    // chaque ligne ajoutée ou retirée (N change) sont révélés par le bas, sans fondu.
    // Recette du 19/10 (RC-5) : les lignes portent une transition de place (les autres
    // lignes se décalent visiblement à la dépose), sauf la ligne saisie, portée par
    // `DraggableRow` jusqu'à la fin de son insertion ; pendant le glisser et l'insertion,
    // la découpe est levée pour que la ligne portée suive le doigt.
    // PRE-5 story 2.6 (UX-DR3) : le cadre de découpe déborde de la marge du groupe jusqu'à
    // `TABLE_BLOCK_SIDE_INSET` du contour (`bleed`) ; le bloc blanc le remplit.
    <SheetMotionView
      enter={false}
      clip={!unclipped}
      bleed={TABLE_BLOCK_BLEED}
      style={[tableStyles.block, styles.tableBlock]}
      testID="execution-sheet-table"
    >
      {/* E-20 : à l'apparition du tableau, ses lignes ne se révèlent pas séparément. */}
      <SheetMotionGroupMount>
      <View style={tableStyles.header} testID="execution-sheet-table-header">
        <View style={tableStyles.headerLead} />
        {/* PRE-5 story 2.7 : même écart d'amorce rétrécissable que les lignes. */}
        <View style={tableStyles.leadGap} testID="execution-sheet-table-header-lead-gap" />
        {mode !== null ? (
          <Text style={tableStyles.columnHeader}>{t.columns[mode]}</Text>
        ) : (
          <View style={tableStyles.emptyCell} />
        )}
        <View style={tableStyles.cellGap} />
        <Text style={tableStyles.columnHeader}>{t.columns.pause}</Text>
        {/* PRE-5 story 2.2 : colonne Charge (titre non interactif), après la Pause. */}
        {loadColumn ? (
          <>
            <View style={tableStyles.cellGap} />
            <Text style={tableStyles.columnHeader}>{t.columns.load}</Text>
          </>
        ) : null}
        <View style={tableStyles.spacer} />
        {/* Story 3.6 : place de la colonne des croix de retrait. */}
        <View style={tableStyles.removeColumn} />
      </View>
      {rows.map((row, index) => {
        // Identité de la ligne (AD-2), jamais son rang : sans identité (Brouillon incohérent),
        // la ligne reste affichée, mais sans champ ni croix, qui la désignent.
        const rowId = tableRowIdentity(draft.rowIds, index);
        return (
          <Fragment key={rowId === null ? `rank-${index}` : `row-${rowId}`}>
            {guideBefore === index ? insertionGuide(index + 1) : null}
            <SeriesTableRow
              index={index}
              rowId={rowId}
              count={rows.length}
              mode={mode}
              onRemove={onRemove}
              removalActive={removalActive}
              onMove={onMove}
              onDrag={handleDrag}
              lifted={rowId !== null && liftedRow === rowId}
              onLiftedChange={(lifted) => {
                if (rowId === null) return;
                setLiftedRow((current) => (lifted ? rowId : current === rowId ? null : current));
              }}
              clip={!unclipped}
              cell={(kind) => (rowId === null ? <View style={tableStyles.emptyCell} /> : cell(kind, rowId, index + 1))}
              loadColumn={loadColumn}
            />
          </Fragment>
        );
      })}
      {guideBefore === rows.length ? insertionGuide(rows.length + 1) : null}
      </SheetMotionGroupMount>
    </SheetMotionView>
  );
}

/**
 * PRE-5 story 2.6 — ligne du tableau des séries : poignée et numéro (`DraggableRow`),
 * cellule Cible, cellule Pause, cellule Charge (charge Avec), croix. D-434 : les cellules
 * sont des champs clavier (`cell`), sans contrôle révélé sous la ligne.
 */
function SeriesTableRow({
  index,
  rowId,
  count,
  mode,
  onRemove,
  removalActive,
  onMove,
  onDrag,
  lifted,
  onLiftedChange,
  clip,
  cell,
  loadColumn,
}: {
  index: number;
  rowId: number | null;
  count: number;
  mode: ExecutionMode | null;
  onRemove: (row: number) => void;
  removalActive: boolean;
  onMove: (from: number, to: number) => void;
  onDrag: (state: { readonly from: number; readonly to: number } | null) => void;
  /** Recette du 19/10 (RC-5) : ligne saisie (cadre au-dessus des autres, sans transition de place). */
  lifted: boolean;
  onLiftedChange: (lifted: boolean) => void;
  clip: boolean;
  /** D-434 : cellule clavier de cette ligne. */
  cell: (kind: RowCellKind) => ReactNode;
  /** PRE-5 story 2.2 : colonne Charge (après la Pause, écart de 7). */
  loadColumn: boolean;
}) {
  const number = index + 1;
  const testID = `${SERIES_ROW_TEST_ID}-${number}`;
  return (
    <SheetMotionView
      // RC-5 : les autres lignes se décalent visiblement ; la ligne saisie est portée par `DraggableRow`.
      transition={lifted ? false : "row"}
      raised={lifted}
      clip={clip}
      // La marge des lignes porte la zone tactile de la poignée (AD-28).
      bleed={TABLE_ROW_INSET}
      testID={`${testID}-motion`}
    >
      <DraggableRow
        index={index}
        count={count}
        onMove={(to) => onMove(index, to)}
        onDrag={onDrag}
        onLiftedChange={onLiftedChange}
        labels={SERIES_ROW_LABELS}
        testIDPrefix={SERIES_ROW_TEST_ID}
      >
        {mode !== null ? (
          <View style={styles.tableCellSlot} testID={`${testID}-target-cell`}>
            {cell("rowTarget")}
          </View>
        ) : (
          <View style={tableStyles.emptyCell} />
        )}
        <View style={tableStyles.cellGap} />
        <View style={styles.tableCellSlot} testID={`${testID}-pause-cell`}>
          {cell("rowPause")}
        </View>
        {/* PRE-5 story 2.2 (FR-23) : cellule Charge au clavier décimal, après un écart de 7. */}
        {loadColumn ? (
          <>
            <View style={tableStyles.cellGap} />
            <View style={styles.tableCellSlot} testID={`${testID}-load-cell`}>
              {cell("load")}
            </View>
          </>
        ) : null}
        <View style={tableStyles.spacer} />
        <RemoveRowButton
          accessibilityLabel={t.removeRow.replace("{n}", String(number))}
          closesFieldHint={t.removeRowClosesFieldHint}
          disabled={count <= 1 || rowId === null}
          active={removalActive}
          onPress={() => {
            if (rowId !== null) onRemove(rowId);
          }}
          testID={`${testID}-remove`}
        />
      </DraggableRow>
    </SheetMotionView>
  );
}

/**
 * Ligne de la Feuille. Q39, Q41 : elle est révélée par le bas sans fondu et glisse
 * quand sa place change (fil UI).
 *
 * Q41 (Hermann, 2026-10-17, E-15) — cadre de sélection :
 * - le fond de sélection est un calque d'arrière-plan en position absolue
 *   (`${testID}-selection`), qui déborde de `GROUP_PADDING` de part et d'autre :
 *   sélectionner ou désélectionner ne change ni marge, ni padding, ni largeur, ni
 *   position du texte, et ne déclenche donc aucune transition de place (le
 *   mouvement « droite-gauche-droite » venait des marges négatives de Q40 animées
 *   par la transition de place) ;
 * - `below` : contrôle affiché sur une ligne en dessous (sélecteur ou roulette en
 *   ligne, Android et web), rendu DANS le même cadre : un seul fond couvre la ligne
 *   et son contrôle.
 *
 * PRE-5 story 2.5 (AC4, AD-28) — `labelAccessory` : contrôle placé à 12 du libellé (chevron
 * de « Durée de l'exercice »), cible distincte de la valeur. Avec une annonce regroupée
 * (`accessibilityLabel`), le regroupement passe du trait entier à la valeur seule (libellé
 * masqué pour l'accessibilité, annonce inchangée) : le chevron reste un élément à part.
 */
function Row({
  label,
  labelAccessory = null,
  selected = false,
  longLabel = false,
  below = null,
  onLayout,
  accessibilityLabel,
  children,
  testID,
}: {
  label: string;
  labelAccessory?: ReactNode;
  selected?: boolean;
  longLabel?: boolean;
  below?: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  /**
   * Story 3.7 (AC7) : présent, la ligne (libellé et valeur) devient un seul élément
   * d'accessibilité portant cette annonce ; absent, rendu et accessibilité inchangés.
   */
  accessibilityLabel?: string;
  children: ReactNode;
  testID: string;
}) {
  const grouped = accessibilityLabel === undefined ? null : { accessible: true, accessibilityRole: "text" as const, accessibilityLabel };
  const labelText = (
    <Text
      style={[styles.label, longLabel ? styles.longLabel : null]}
      // Regroupement porté par la valeur : le libellé n'est pas annoncé une seconde fois.
      accessibilityElementsHidden={labelAccessory !== null && grouped !== null ? true : undefined}
      importantForAccessibility={labelAccessory !== null && grouped !== null ? "no" : undefined}
    >
      {label}
    </Text>
  );
  return (
    <SheetMotionView bleed={GROUP_PADDING} onLayout={onLayout} testID={testID}>
      <View
        pointerEvents="none"
        style={[styles.selectionBackground, selected ? styles.selectionBackgroundSelected : null]}
        testID={`${testID}-selection`}
      />
      {labelAccessory === null ? (
        <View style={styles.row} {...grouped} testID={`${testID}-line`}>
          {labelText}
          {children}
        </View>
      ) : (
        <View style={styles.row} testID={`${testID}-line`}>
          <View style={styles.labelGroup}>
            {labelText}
            {labelAccessory}
          </View>
          <View {...grouped} testID={`${testID}-value-group`}>
            {children}
          </View>
        </View>
      )}
      {below}
    </SheetMotionView>
  );
}

/** Appui absorbé sans effet (pastille non modifiable ; segmenté en lecture seule). */
const ignorePress = () => undefined;

function ValuePill({
  value,
  accessibilityLabel,
  expanded,
  disabled = false,
  invalid = false,
  invalidHint = t.invalidHint,
  onPress,
  testID,
}: {
  value: string;
  accessibilityLabel: string;
  expanded: boolean;
  disabled?: boolean;
  invalid?: boolean;
  invalidHint?: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    // Story 3.3 : une pastille non modifiable reste un élément tactile qui
    // absorbe l'appui sans effet (il ne remonte pas à l'appui extérieur de la Feuille, T23),
    // annoncée indisponible et atténuée (`UNSELECTED_OPACITY`, AD-11).
    <Pressable
      onPress={disabled ? ignorePress : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={invalid ? invalidHint : undefined}
      accessibilityState={{ expanded, disabled }}
      hitSlop={{ top: 10, bottom: 10 }}
      style={[styles.valuePill, invalid ? styles.valuePillInvalid : null, disabled ? styles.unselected : null]}
      testID={testID}
    >
      <Text style={styles.valuePillText} testID={`${testID}-text`}>
        {value}
      </Text>
    </Pressable>
  );
}

/**
 * Focus VoiceOver d'un champ ± révélé (H13). À l'ouverture, le focus passe au champ
 * ouvert ; à une fermeture demandée par l'action accessible du champ, il revient au
 * bouton qui l'ouvre. PRE-5 story 2.6 : extrait de `RevealStepper`, sans changement, pour
 * servir aussi au champ ± de la Pause d'une ligne du tableau.
 */
function useOpenFieldFocus(isOpen: boolean, onToggle: () => void) {
  const fieldRef = useRef<View>(null);
  const toggleRef = useRef<View>(null);
  // Fermeture demandée par l'action accessible du champ : le focus revient à la valeur (H13).
  const closedByAccessibilityRef = useRef(false);
  useEffect(() => {
    // VoiceOver : le focus passe au champ ouvert (le bouton touché peut être démonté).
    const target = isOpen ? fieldRef.current : closedByAccessibilityRef.current ? toggleRef.current : null;
    closedByAccessibilityRef.current = false;
    // `sendAccessibilityEvent(…, "focus")` : équivalent, sur une vue hôte, de
    // `setAccessibilityFocus` (iOS et Android).
    if (target) AccessibilityInfo.sendAccessibilityEvent(target, "focus");
  }, [isOpen]);
  const closeFromAccessibility = () => {
    closedByAccessibilityRef.current = true;
    onToggle();
  };
  return { fieldRef, toggleRef, closeFromAccessibility };
}

/**
 * Champ ± ouvert (AD-15, AD-16) : `InlineStepper`, rendu et mécanisme inchangés. Le
 * conteneur retient tout toucher qui n'atteint pas un ± actif (± à la borne) : ce toucher
 * ne remonte pas à l'appui extérieur de la Feuille, et les ± d'un champ ouvert ne le
 * ferment jamais (T22). Recette du 19/10 (RC-4) : toucher la valeur le referme. Il se range sans toucher l'extérieur par le geste
 * d'échappement, Magic Tap ou l'action nommée « Fermer » (lexique). PRE-5 story 2.6 :
 * extrait de `RevealStepper`, partagé avec la Pause d'une ligne du tableau.
 */
function OpenStepperField({
  fieldRef,
  onClose,
  fieldTestID,
  style,
  ...stepper
}: InlineStepperProps & {
  fieldRef: RefObject<View | null>;
  onClose: () => void;
  fieldTestID: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      ref={fieldRef}
      onStartShouldSetResponder={() => true}
      accessibilityActions={[{ name: "escape" }, { name: "magicTap" }, { name: "close", label: t.closeField }]}
      onAccessibilityAction={(event) => {
        if (["escape", "magicTap", "close"].includes(event.nativeEvent.actionName)) onClose();
      }}
      onAccessibilityEscape={onClose}
      onMagicTap={onClose}
      style={style}
      testID={fieldTestID}
    >
      {/* Story 3.8 (AC2) : limites annoncées ; un « — » éventuel annoncé « aucune valeur ».
          Recette du 19/10 (RC-4) : toucher la valeur du champ ouvert le referme (action
          « activer » pour VoiceOver, le focus revient alors à la valeur fermée). */}
      <InlineStepper
        {...stepper}
        onValuePress={onClose}
        announceLimits
        spokenValue={(value) => spokenValue(stepper.formatValue(value))}
      />
    </View>
  );
}

/**
 * Story 3.3 (AC8, FR-03-05, AD-16) — valeur numérique hors tableau réglée par ±.
 *
 * Fermé : seule la valeur est visible, dans la pastille de valeur modifiable
 * (`DSF / Forms / Valeur modifiable`, comme les autres valeurs de la Feuille) ;
 * l'appui ouvre le champ. Ouvert : `InlineStepper`, rendu et mécanisme inchangés
 * (pas, maintien, politiques `EXECUTION_*`, accessibilité ajustable), à la largeur
 * fixe du premier niveau : la valeur recule d'une translation constante.
 *
 * Le conteneur du champ ouvert retient tout toucher qui n'atteint pas un ± actif
 * (valeur, ± à la borne) : ce toucher ne remonte pas à l'appui extérieur de la
 * Feuille, et les ± d'un champ ouvert ne le ferment jamais (AD-15, T22).
 */
function RevealStepper({
  isOpen,
  onToggle,
  fieldLabel,
  ...stepper
}: InlineStepperProps & { isOpen: boolean; onToggle: () => void; fieldLabel: string }) {
  const { fieldRef, toggleRef, closeFromAccessibility } = useOpenFieldFocus(isOpen, onToggle);
  // Même largeur et même centrage fermé et ouvert : la valeur garde exactement sa position
  // horizontale (Q41, aucun mouvement du texte) ; la zone de toucher fermée couvre toute
  // cette largeur sur au moins 44 de haut (NFR-09, Q42), la pastille seule étant plus petite.
  const frame = { width: stepper.width ?? STEPPER_WIDTH };
  if (!isOpen) {
    const display = stepper.formatValue(stepper.value);
    return (
      <Pressable
        ref={toggleRef}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${fieldLabel}, ${spokenValue(display)}`}
        accessibilityState={{ expanded: false }}
        style={[styles.stepperFrame, frame]}
        testID={`${stepper.testID}-toggle`}
      >
        <View style={styles.valuePill} testID={`${stepper.testID}-pill`}>
          <Text style={styles.valuePillText} testID={`${stepper.testID}-value`}>
            {display}
          </Text>
        </View>
      </Pressable>
    );
  }
  return (
    <OpenStepperField
      {...stepper}
      fieldRef={fieldRef}
      onClose={closeFromAccessibility}
      fieldTestID={`${stepper.testID}-field`}
      style={[styles.stepperFrame, frame]}
    />
  );
}

/**
 * PRE-5 story 2.5 (AC3, AD-24) — ± existant de la Cadence, révélé sous la ligne quand Autre
 * est touché (`stepper(beep)` ouvert) : `OpenStepperField`, rendu et mécanisme inchangés
 * (0..10, pas 1, `EXECUTION_UNIT_HOLD_POLICY`). Monté seulement ouvert : le focus VoiceOver
 * passe au champ à son apparition ; l'action accessible « Fermer » le range (`onClose`).
 */
function RevealedStepperField({ onClose, ...stepper }: InlineStepperProps & { onClose: () => void }) {
  const { fieldRef, closeFromAccessibility } = useOpenFieldFocus(true, onClose);
  return (
    <OpenStepperField
      {...stepper}
      fieldRef={fieldRef}
      onClose={closeFromAccessibility}
      fieldTestID={`${stepper.testID}-field`}
      style={[styles.stepperFrame, { width: stepper.width ?? STEPPER_WIDTH }]}
    />
  );
}

/**
 * PRE-5 story 2.8 (FR-4, FR-5, D-432, RC-4, AD-16) ; recette du 20/10 (RC-15) — contenu de l'option
 * sélectionnée d'un segmenté `inline` qui porte un nombre (le chevron éventuel est rendu après lui
 * par `SegmentedControl`) : « n phases » (Avec des Phases de l'exercice) ou « n séries identiques /
 * variables » (Type de série) :
 * - fermé : le libellé (Semi Bold 12 blanc) ; son toucher révèle le réglage ;
 * - ouvert : `InlineStepper` existant sans pilule (`appearance="bare"`), bornes, pas et politique
 *   de l'appelant ; − et + indisponibles aux bornes ; toucher la valeur (ou l'action « activer »)
 *   le referme ; mêmes actions d'échappement et même focus VoiceOver que les autres champs ±
 *   (`OpenStepperField`, `useOpenFieldFocus`). Phases : valeur blanche sur le violet de l'option ;
 *   séries (RC-15, Figma `9436:18506`) : surface propre `#F2F2FF` (`fieldStyle`) et valeur primaire.
 */
function SegmentCountField({
  isOpen,
  onToggle,
  count,
  min,
  max,
  policy,
  closedLabel,
  formatValue,
  onChange,
  accessibilityLabel,
  valueStyle,
  fieldStyle,
  style,
  testID,
  textTestID,
  closedAccessory,
  openAccessory,
  openHint,
  closedHitSlop,
}: {
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  min: number;
  max: number;
  policy: InlineStepperProps["policy"];
  closedLabel: string;
  formatValue: (count: number | null) => string;
  onChange: (count: number) => void;
  accessibilityLabel: string;
  valueStyle?: StyleProp<TextStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID: string;
  textTestID: string;
  /** RC-16 : contenu après le libellé fermé (chevron du tableau des phases). */
  closedAccessory?: ReactNode;
  /** RC-16 : élément du réglage ouvert entre la valeur et le + (chevron indisponible), et son indice. */
  openAccessory?: ReactNode;
  openHint?: string;
  /** RC-16 : marge de toucher du libellé fermé (par défaut 44 de haut). */
  closedHitSlop?: Insets;
}) {
  const { fieldRef, toggleRef, closeFromAccessibility } = useOpenFieldFocus(isOpen, onToggle);
  if (!isOpen) {
    const toggleButton = (
      <Pressable
        ref={toggleRef}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}, ${closedLabel}`}
        accessibilityState={{ expanded: false }}
        hitSlop={closedHitSlop ?? SEGMENT_COUNT_HIT_SLOP}
        style={style}
        testID={`${testID}-toggle`}
      >
        <Text style={inlineSelectedLabelStyle} testID={textTestID}>
          {closedLabel}
        </Text>
      </Pressable>
    );
    return closedAccessory === undefined ? (
      toggleButton
    ) : (
      <View style={styles.phaseCountClosed}>
        {toggleButton}
        {closedAccessory}
      </View>
    );
  }
  return (
    <OpenStepperField
      value={count}
      min={min}
      max={max}
      policy={policy}
      formatValue={formatValue}
      onChange={onChange}
      accessibilityLabel={accessibilityLabel}
      appearance="bare"
      valueStyle={valueStyle}
      accessory={openAccessory}
      hint={openHint}
      testID={testID}
      fieldRef={fieldRef}
      onClose={closeFromAccessibility}
      fieldTestID={`${testID}-field`}
      style={[fieldStyle, style]}
    />
  );
}

/**
 * PRE-5 story 2.8 ; recette du 20/10 (RC-16) — nombre de phases (2..6) dans l'option Avec
 * sélectionnée, chevron du tableau rendu par le contenu (place toujours réservée) :
 * - fermé : « n phases » (son toucher ouvre le réglage) puis le chevron, actif (replie / déploie le
 *   tableau sans ouvrir le réglage) ;
 * - ouvert : « − | n phases | chevron | + » sur le fond clair de la charge active (`#EAEAFF`,
 *   texte primaire) ; − et + règlent le nombre ; le chevron reste visible mais indisponible (son
 *   toucher, comme celui de la valeur ou d'ailleurs, ferme le réglage sans toucher au tableau).
 */
function PhaseCountField({
  isOpen,
  onToggle,
  count,
  onChange,
  folded,
  onChevronPress,
}: {
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  onChange: (count: number) => void;
  folded: boolean;
  onChevronPress: () => void;
}) {
  const chevronTestID = "execution-sheet-phases-control-WITH-chevron";
  const chevronLabel = folded ? t.showPhases : t.hidePhases;
  const icon = (
    <KodjoIcon
      name={folded ? "control-chevron-down" : "control-chevron-up"}
      size={dimensions.catalogueDisclosure.chevronDisplaySize}
      tintColor={isOpen ? colors.disabled : colors.background}
      testID={`${chevronTestID}-icon`}
    />
  );
  const chevron = (
    <Pressable
      // Ouvert : indisponible pour le tableau ; son toucher ferme le réglage (RC-16, « appui ailleurs »).
      onPress={isOpen ? onToggle : onChevronPress}
      accessibilityRole="button"
      accessibilityLabel={chevronLabel}
      accessibilityState={{ expanded: !folded, disabled: isOpen }}
      hitSlop={isOpen ? PHASE_CHEVRON_OPEN_HIT_SLOP : PHASE_CHEVRON_CLOSED_HIT_SLOP}
      style={[inlineChevronFrameStyle, isOpen ? styles.phaseChevronOpen : styles.phaseChevronClosed]}
      testID={chevronTestID}
    >
      {icon}
    </Pressable>
  );
  return (
    <SegmentCountField
      isOpen={isOpen}
      onToggle={onToggle}
      count={count}
      min={WORK_PHASE_LIMITS.controlMinCount}
      max={WORK_PHASE_LIMITS.maxCount}
      policy={EXECUTION_UNIT_HOLD_POLICY}
      closedLabel={phaseCountLabel(count)}
      formatValue={phaseCountLabel}
      onChange={onChange}
      accessibilityLabel={t.workPhaseCountLabel}
      valueStyle={isOpen ? [inlineSelectedLabelStyle, styles.phaseStepperValue] : inlineSelectedLabelStyle}
      fieldStyle={styles.phaseStepperField}
      closedHitSlop={PHASE_COUNT_CLOSED_HIT_SLOP}
      closedAccessory={chevron}
      openAccessory={chevron}
      openHint={t.phasesTableToggleUnavailableHint}
      testID="execution-sheet-phase-count"
      textTestID="execution-sheet-phase-count-text"
    />
  );
}

const SIDE_ORDERS: readonly SideOrder[] = ["BY_SIDE", "BY_SERIES"];

/**
 * Recette du 19/10 (RC-6, Figma `9462:18987`) — contenu de l'option Avec sélectionnée du
 * Changement de côté (N > 1) : notation de l'Enchainement (D-431, Semi Bold 10, blanc) et
 * chevron existant de `KodjoIcon`, à 6 l'un de l'autre, sur toute l'option (146 × 26, RC-12).
 *
 * Choix (priorité aux primitives natives, AGENTS.md) : sur iOS, ce contenu est le déclencheur
 * du menu natif SwiftUI `Menu` d'`@expo/ui` (déjà installé, aucun nouveau module natif),
 * hébergé par `RNHostView` comme le menu contextuel de la galerie (`ActivityMediaList`). Le
 * toucher ouvre le menu des deux notations, la notation choisie cochée ; le choix appelle
 * `setSideOrder` ; un toucher extérieur ferme sans rien changer. Figma dessine un déroulant
 * sous l'option (notation choisie en violet, chevron vers le haut, autre notation dessous) :
 * le menu natif en tient lieu, avec son propre rendu ; le chevron reste vers le bas, l'état
 * ouvert étant porté par le menu. Ailleurs (Android, web) : `Alert` native aux deux notations.
 *
 * VoiceOver : nom « Enchainement », valeur et options annoncées par leurs libellés neutres
 * (`sideOrders`, D-407), la notation n'étant pas lue.
 */
function SideOrderMenu({ value, onChange, testID }: { value: SideOrder; onChange: (order: SideOrder) => void; testID: string }) {
  const trigger = (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.sideOrderTrigger}
    >
      <Text style={inlineSelectedCompactLabelStyle} testID={`${testID}-notation`}>
        {t.sideOrderSubtitles[value]}
      </Text>
      <View style={inlineChevronFrameStyle}>
        <KodjoIcon
          name="control-chevron-down"
          size={dimensions.catalogueDisclosure.chevronDisplaySize}
          tintColor={colors.background}
        />
      </View>
    </View>
  );
  if (Platform.OS !== "ios") {
    const openAlert = () =>
      Alert.alert(t.sideSequence, undefined, [
        ...SIDE_ORDERS.map((order) => ({ text: t.sideOrderSubtitles[order], onPress: () => onChange(order) })),
        { text: t.sideSequenceCancel, style: "cancel" as const },
      ]);
    return (
      <Pressable
        onPress={openAlert}
        accessibilityRole="button"
        accessibilityLabel={t.sideSequence}
        accessibilityValue={{ text: t.sideOrders[value] }}
        testID={testID}
      >
        {trigger}
      </Pressable>
    );
  }
  return (
    <Host style={styles.sideOrderTrigger} testID={testID}>
      <Menu
        label={<RNHostView matchContents>{trigger}</RNHostView>}
        modifiers={[swiftUIAccessibilityLabel(t.sideSequence), swiftUIAccessibilityValue(t.sideOrders[value])]}
      >
        {SIDE_ORDERS.map((order) => (
          <SwiftUIButton
            key={order}
            label={t.sideOrderSubtitles[order]}
            systemImage={order === value ? "checkmark" : undefined}
            modifiers={[swiftUIAccessibilityLabel(t.sideOrders[order])]}
            onPress={() => onChange(order)}
            testID={`${testID}-${order}`}
          />
        ))}
      </Menu>
    </Host>
  );
}

/** Q40 : `hidden` garde la place du séparateur, rendu transparent (groupe sélectionné). */
function Separator({ hidden = false }: { hidden?: boolean }) {
  return <SheetMotionView style={[styles.separator, hidden ? styles.separatorHidden : null]} />;
}

/**
 * Géométrie de référence (402) : groupe à x24 (354), lignes à x36 (séparateur 330) —
 * traduites en marges relatives pour 360/440. PRE-5 story 2.5 : plus aucune ligne
 * indentée (cadre Côtés à la marge 12, Figma `9230:19534`).
 */
const GROUP_PADDING = 12;
/** PRE-5 story 2.5 (AC4, FR-31) : écart entre le libellé « Durée de l'exercice » et son chevron. */
const LABEL_ACCESSORY_GAP = 12;

/**
 * PRE-5 story 2.4 (UX-DR1, PR-03 ; relevé Figma en lecture seule du 19/10, cadres
 * `9230:19461`, `9230:44699`) — constantes locales, aucun jeton modifié (NFR-3) :
 * fond des cadres `#EFF0F2`, contour blanc de 1, rayon 12, cadres espacés de 8 ;
 * libellés de ligne Inter Regular 12 (plus petits que les valeurs). Les lignes gardent
 * 44 de haut (Q42 ; 41 dans Figma).
 */
const FRAME_BACKGROUND = "#EFF0F2";
const FRAME_BORDER_WIDTH = 1;
const FRAME_RADIUS = 12;
const FRAME_GAP = 8;
const ROW_LABEL_FONT_SIZE = 12;
/** Bord des lignes depuis le bord extérieur d'un cadre (contour + marge) : alignement des panneaux. */
const FRAME_INSET = FRAME_BORDER_WIDTH + GROUP_PADDING;
/**
 * PRE-5 story 2.6 (UX-DR3) : débord du tableau dans la marge du groupe, pour que le bloc
 * blanc soit à `TABLE_BLOCK_SIDE_INSET` du contour du cadre.
 */
const TABLE_BLOCK_BLEED = GROUP_PADDING - TABLE_BLOCK_SIDE_INSET;
/**
 * FR-20 : option unique « À la cible et à l'échec » du résultat dérivé mixte — même
 * largeur totale que les deux options (2 × 106 + l'écart de 2 du segmenté), choix
 * d'intégration (le libellé ne tient pas dans 106).
 */
const MIXED_STOP_CONDITION_WIDTH = INLINE_OPTION_WIDTHS.wide * 2 + 2;
/** RC-6 (Figma `9462:18988`) : écart entre la notation de l'Enchainement et son chevron. */
const SIDE_ORDER_CHEVRON_GAP = 6;
/**
 * Recette du 20/10 (RC-13) : place réservée au segmenté « Changement de côté » dans sa ligne, celle
 * du plus large (Avec 146 + Sans 62 + écart 2 + marges 2 × 3 = 216, RC-12), pour que le libellé
 * reste sur deux lignes quand le segmenté se réduit à 132 (Avec et Sans de 62).
 */
const SIDE_CONTROL_RESERVED_WIDTH = INLINE_OPTION_WIDTHS.notation + INLINE_OPTION_WIDTHS.narrow + 2 + 3 * 2;
/** Recette du 20/10 (RC-14) : charge commune (option de 26) portée à une cible de 44 de haut, dans la ligne de 44. */
const LOAD_SEGMENT_HIT_SLOP = { top: 9, bottom: 9 };
/**
 * PRE-5 story 2.8 (NFR-7) : « n phases » (texte de 16) porté à une cible de 44 de haut, dans la
 * ligne de 44, sans agrandir le dessin ; le reste de l'option Avec (re-choisie) a le même effet.
 */
const SEGMENT_COUNT_HIT_SLOP = { top: 14, bottom: 14 };
/**
 * Recette du 20/10 (RC-16) : géométrie du contenu de l'option Avec des phases (voir
 * `PHASE_OPTION_*_WIDTH`). Fermé : marges 17, écart 6 libellé–chevron ; le libellé (16 de haut)
 * touche jusqu'au bord gauche de l'option et sur 44 de haut ; le chevron (10) jusqu'au bord droit,
 * 44 de haut, sans recouvrir le libellé (écart partagé 3 / 3). Ouvert : marges 4 ; − [8] valeur [6]
 * chevron [8] + ; les cercles gardent leur marge de 8 (44 de large) ; le chevron indisponible ne
 * prend que l'écart de 6 à sa gauche. Segmenté de 34 et fond de 28 (rayon 5 des options).
 */
const PHASE_OPTION_INSET = 17;
const PHASE_CHEVRON_GAP = 6;
const PHASE_CONTROL_OPEN_HEIGHT = 34;
const PHASE_COUNT_CLOSED_HIT_SLOP = { top: 14, bottom: 14, left: PHASE_OPTION_INSET, right: PHASE_CHEVRON_GAP / 2 };
const PHASE_CHEVRON_CLOSED_HIT_SLOP = { top: 17, bottom: 17, left: PHASE_CHEVRON_GAP / 2, right: PHASE_OPTION_INSET };
const PHASE_CHEVRON_OPEN_HIT_SLOP = { top: 17, bottom: 17, left: PHASE_CHEVRON_GAP, right: 0 };
/**
 * Recette du 20/10 (RC-15, Figma `9436:18348`) : segmenté du Type de série de 34 quand le stepper du
 * nombre de séries (28) est ouvert, 32 au repos ; stepper sur fond `#F2F2FF` (`colors.stepperSurface`),
 * rayon 14 (moitié de sa hauteur).
 */
const SERIES_CONTROL_OPEN_HEIGHT = 34;
const SERIES_STEPPER_RADIUS = SERIES_STEPPER_CIRCLE / 2;
/**
 * RC-15 : place d'une ligne de premier niveau hors libellé et contrôle — marges du corps (2 × 24),
 * contour (2 × 1) et marge (2 × 12) du cadre : 74 (328 à 402, 301 à 375).
 */
const SHEET_ROW_SIDE_WIDTH = spacing[24] * 2 + FRAME_BORDER_WIDTH * 2 + GROUP_PADDING * 2;
/** PRE-5 story 2.8 (Figma `9207:18817`) : cellule Libellé de 24 de haut, rayon 8 (gabarit des cellules). */
const PHASE_LABEL_CELL_RADIUS = 8;

const styles = StyleSheet.create({
  // RC-16 : contenu fermé de l'option Avec des phases — libellé, écart 6, chevron.
  phaseCountClosed: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseChevronClosed: {
    marginLeft: PHASE_CHEVRON_GAP,
  },
  // Ouvert : chevron entre la valeur (écart 6, porté par la valeur) et le + (écart 8 = 6 + 2 d'`InlineStepper`).
  phaseChevronOpen: {
    marginRight: spacing[6],
  },
  // RC-16 : réglage ouvert — fond clair de la charge active (`#EAEAFF`, rayon 5 des options), 28 de haut.
  phaseStepperField: {
    backgroundColor: TABLE_CELL_ACTIVE_BACKGROUND,
    borderRadius: INLINE_OPTION_CONTENT_RADIUS,
    height: SERIES_STEPPER_CIRCLE,
    width: PHASE_OPTION_OPEN_WIDTH,
    paddingHorizontal: spacing[4],
    alignItems: "center",
    justifyContent: "center",
  },
  // RC-16 : valeur primaire (comme la charge en saisie), à 8 du − (2 + 6) et à 6 du chevron (2 + 4).
  phaseStepperValue: {
    color: colors.primary,
    minWidth: 0,
    paddingHorizontal: 0,
    marginLeft: spacing[6],
    marginRight: spacing[4],
  },
  // RC-15 (Figma `9436:18506`) : stepper du nombre de séries ouvert, pilule `#F2F2FF` de 28.
  seriesStepperField: {
    backgroundColor: colors.stepperSurface,
    borderRadius: SERIES_STEPPER_RADIUS,
  },
  // RC-15 : valeur « 3 séries » (Semi Bold 13 primaire d'`InlineStepper`) avec sa marge de 8, à 8
  // des cercles (écart 2 d'`InlineStepper` + 6).
  seriesStepperValue: {
    paddingHorizontal: SERIES_STEPPER_VALUE_INSET,
    marginHorizontal: SERIES_STEPPER_GAP - spacing[2],
  },
  // RC-15 (Figma `9445:18450`) : écart de 6 entre la valeur et le chevron (4 du segmenté + 2).
  seriesCountBeforeChevron: {
    marginRight: SERIES_CHEVRON_GAP - spacing[4],
  },
  // RC-13 : place du segmenté le plus large, segmenté aligné à droite et centré verticalement.
  sideControlSlot: {
    minWidth: SIDE_CONTROL_RESERVED_WIDTH,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  // RC-6 : déclencheur du menu de l'Enchainement, sur toute l'option Avec (146 × 26, RC-12).
  sideOrderTrigger: {
    width: INLINE_OPTION_WIDTHS.notation,
    height: INLINE_OPTION_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIDE_ORDER_CHEVRON_GAP,
  },
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  // Q39 : cadre transparent de la montée ; la surface reste ancrée en bas à l'intérieur.
  sheetFrame: {
    flex: 1,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  // DSF : feuille blanche ancrée en bas, coins supérieurs 24, rognage.
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 2,
    marginTop: spacing[8],
    backgroundColor: colors.disabled,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Recette 1 (T-61) : hauteur minimale, jamais fixe — le titre agrandi n’est pas rogné.
    minHeight: 56,
    paddingHorizontal: spacing[12] + 5,
  },
  title: {
    ...type.modalTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  cancelCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionCancelBackground,
  },
  validateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionValidateBackground,
  },
  validateCircleDisabled: {
    backgroundColor: colors.disabled,
  },
  headerDivider: {
    height: 1,
    marginHorizontal: spacing[12],
    backgroundColor: colors.divider,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    gap: spacing[8],
  },
  // PRE-5 story 2.4 (FR-26, UX-DR1) : cadre gris arrondi, contour blanc.
  frame: {
    backgroundColor: FRAME_BACKGROUND,
    borderWidth: FRAME_BORDER_WIDTH,
    borderColor: colors.background,
    borderRadius: FRAME_RADIUS,
    paddingHorizontal: GROUP_PADDING,
    paddingVertical: spacing[4],
  },
  // Cadres espacés de 8 (FR-26).
  frameSpaced: {
    marginTop: FRAME_GAP,
  },
  // DSF Séries variables : ligne « Type de série » (ex-« Séries », story 3.3) + tableau. Q40 (Hermann, 2026-10-17, E-14)
  // remplace le cadre fixe X-3 (contour 1,5 + fond 6665:24616) : état normal sans
  // fond ni contour ; marges négatives compensées, aucun texte ne bouge.
  variableGroup: {
    marginHorizontal: -GROUP_PADDING,
    paddingHorizontal: GROUP_PADDING,
    borderRadius: fixedRadii[12],
  },
  // Q40 : tableau sélectionné — fond d'une ligne sélectionnée, sans contour.
  variableGroupSelected: {
    backgroundColor: colors.stepperSurface,
  },
  variableGroupClip: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: SHEET_ROW_MIN_HEIGHT,
    gap: spacing[8],
  },
  // DSF : ligne sélectionnée (roulette ou segmenté), rayon 12. Q40 (Hermann,
  // 2026-10-17, E-14) : liseré foncé retiré ; le fond reste. Q41 (E-15) : le fond
  // est un calque absolu sous la ligne (et son contrôle en ligne), débordant de
  // `GROUP_PADDING` de chaque côté ; la ligne elle-même garde le même style,
  // sélectionnée ou non (aucune marge ni padding de sélection).
  selectionBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -GROUP_PADDING,
    right: -GROUP_PADDING,
    borderRadius: fixedRadii[12],
  },
  selectionBackgroundSelected: {
    backgroundColor: colors.stepperSurface,
  },
  // Story 3.3 (T23) : zone d'appui extérieur étendue aux marges de `bodyContent`.
  bodyOutside: {
    position: "absolute",
    top: -PANEL_OUTSIDE_INSETS.top,
    right: -PANEL_OUTSIDE_INSETS.right,
    bottom: -PANEL_OUTSIDE_INSETS.bottom,
    left: -PANEL_OUTSIDE_INSETS.left,
  },
  // Story 3.3 : cadre d'un champ ± hors tableau, fermé comme ouvert (même largeur, valeur
  // centrée au même endroit ; zone de toucher d'au moins 44 de haut).
  stepperFrame: {
    minHeight: SHEET_ROW_MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  // AD-11 : élément sans effet (croix de retrait indisponible).
  unselected: {
    opacity: UNSELECTED_OPACITY,
  },
  // PRE-5 story 2.4 (PR-03) : libellé de ligne Inter Regular 12.
  label: {
    fontFamily: type.supporting.fontFamily,
    fontWeight: type.supporting.fontWeight,
    fontSize: ROW_LABEL_FONT_SIZE,
    lineHeight: type.supporting.lineHeight,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  // PRE-5 story 2.5 (AC4) : libellé suivi de son chevron, à 12 (« Durée de l'exercice »).
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: LABEL_ACCESSORY_GAP,
  },
  // PRE-5 story 2.5 (AC3) : ± de la Cadence révélé sous la ligne, aligné à droite.
  revealedStepperLine: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingBottom: spacing[4],
  },
  // DSF : « Pause entre les côtés » sur deux lignes, largeur 180 à 402.
  longLabel: {
    maxWidth: 180,
  },
  flex: {
    flex: 1,
  },
  valuePill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  // Valeur à renseigner : fond rouge léger, sans liseré (Q35, 2026-10-17 ; jeton
  // `color.dangerSurface`, #FFF1F0).
  valuePillInvalid: {
    backgroundColor: colors.dangerSurface,
  },
  valuePillText: {
    ...type.editableValue,
    color: colors.primary,
  },
  staticValue: {
    ...type.body,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  separatorHidden: {
    backgroundColor: "transparent",
  },
  inlineControl: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },

  // PRE-5 story 2.6 (UX-DR3) : le bloc blanc remplit le cadre de découpe élargi par `bleed`.
  tableBlock: {
    marginHorizontal: -TABLE_BLOCK_BLEED,
  },
  // Colonne d'une cellule du tableau (71, rétrécissable sur un écran étroit).
  tableCellSlot: {
    width: TABLE_CELL_WIDTH,
    flexShrink: 1,
  },
  // D-434 : cellule clavier (gabarit `TableCell` 71 × 24, rayon 8) à la largeur de sa colonne.
  keyboardCell: {
    width: "100%",
  },
  // PRE-5 story 2.8 (FR-6, Figma `9207:18817`) : cellule Libellé au clavier texte — `TextInput`
  // visible de 76 × 24 (largeur de sa colonne), rayon 8, valeur Semi Bold 13 primaire centrée ;
  // fond `#EAEAFF` en saisie (posé par `KeyboardField`). iOS : la hauteur de ligne du texte est
  // retirée (texte et curseur décentrés sinon), comme le champ de la charge commune.
  phaseLabelInput: {
    width: "100%",
    height: TABLE_CELL_HEIGHT,
    borderRadius: PHASE_LABEL_CELL_RADIUS,
    lineHeight: undefined,
    paddingVertical: 0,
    paddingHorizontal: spacing[4],
    textAlign: "center",
  },
  // PRE-5 story 2.7 (AC1, AD-28, Figma `9289:17849`) : champ de la charge commune dans
  // l'option Avec sélectionnée — plein cadre de l'option (62 × 26, rayon 5), texte centré ;
  // au repos, libellé blanc Semi Bold 12 de l'option sélectionnée sur le cadre violet. Recette
  // du 20/10 (RC-14) : cellule `cellDecimal` (D-434 : valeur dessinée par un `Text`, entrée
  // native transparente), de la largeur de l'option (élargie si la valeur ne tient pas).
  loadSegmentInput: {
    height: INLINE_OPTION_CONTENT_HEIGHT,
    borderRadius: INLINE_OPTION_CONTENT_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  // Actif : fond `#EAEAFF` du champ actif (posé par `KeyboardField`) et texte primaire (le
  // blanc serait illisible sur ce fond clair).
  loadSegmentInputActive: {
    color: colors.primary,
  },
});
