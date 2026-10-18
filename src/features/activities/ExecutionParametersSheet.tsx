import {
  Button as SwiftUIButton,
  Divider as SwiftUIDivider,
  Host,
  Popover,
  Spacer,
  VStack,
} from "@expo/ui/swift-ui";
import { accessibilityAddTraits, frame, padding } from "@expo/ui/swift-ui/modifiers";
import { Fragment, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EXECUTION_BOUNDS,
  isBilateral,
  numberTarget,
  selectorOpeningPosition,
  seriesRowsOf,
  stepTarget,
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
  commitSheetDraft,
  effectiveParameters,
  isRequestedTotalEditable,
  isSingleSeries,
  moveRow,
  openSheetDraft,
  removeRow,
  setCadenceBeep,
  setCountdown,
  setEnd,
  setMode,
  setRowPause,
  setRowTarget,
  setSeriesCount,
  setSideMode,
  setSideOrder,
  setSideRecovery,
  setUniformPause,
  setUniformTarget,
  setVariable,
  undoRemoval,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";
import {
  computeIntrinsicDuration,
  hasDurationAmount,
  isCalculable,
  totalDurationRange,
} from "@/domain/activities/executionCalculations";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { SideMode } from "@/domain/sessions/sideMode";
import { AnchoredPanel } from "@/features/activities/AnchoredPanel";
import {
  SHEET_MOTION_MS,
  SheetMotionGroupMount,
  SheetMotionProvider,
  SheetMotionScrollView,
  SheetMotionView,
} from "@/features/activities/SheetMotion";
import {
  INITIAL_SHEET_SURFACE_STATE,
  removalEnabled,
  sameSurface,
  sheetCommandsAbsorbed,
  sheetSurfaceReducer,
  type SheetStepperField,
  type SheetSurface,
} from "@/features/activities/sheetSurface";
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
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
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
 * - les cellules gardent leurs `InlineStepper` permanents ; la règle du pas de la Cible
 *   est celle du domaine (`stepTarget` : `FAILURE` → ± indisponibles, `UNSET` → + donne
 *   la valeur minimale, − indisponible ; hors bornes → valeur voisine dans le sens du geste) ;
 * - toucher la VALEUR d'une cellule de Cible (`30 s`, `à l’échec`, `—`) ouvre le
 *   Sélecteur de la story 3.4 (Durée) ou 3.5 (Répétitions) de cette ligne, dans le
 *   panneau sans flèche sous la cellule (Q41) ; ✓ applique à cette seule ligne, ✕ et
 *   toucher extérieur ferment sans appliquer ; une seule surface ouverte ;
 * - croix de retrait (`removeRow`) active seulement sans surface ni champ ± ouvert, puis
 *   « Série supprimée — Annuler » par le message d'ajustement existant (`undoRemoval`, Q29) ;
 * - glisser PRE-3 (`DraggableRow`) et actions accessibles monter / descendre inchangés.
 */
export type ExecutionParametersSheetProps = {
  readonly parent: ExecutionParametersInput;
  /** PRE-4 (AD-13) : ligne de base relue à l'ouverture de l'Éditeur ; `null` (défaut) en création. */
  readonly baseline?: ExecutionParametersInput | null;
  /** Pause entre les côtés du Profil, copiée à l'ACTIVATION du changement de côté (P3-10). */
  readonly profileSideRecoverySecondsDefault: number;
  readonly onApply: (parameters: ExecutionParameters) => void;
  readonly onCancel: () => void;
};

const t = strings.executionParameters.sheet;

/** Régime des séries affiché par le champ de la ligne `Séries` (FR-04-01) ; le Brouillon garde son booléen `variable`. */
type Regime = "UNIFORM" | "VARIABLE";

/** Surfaces de la Feuille (AD-15). */
const MODE_POPOVER: SheetSurface = { kind: "popover", popover: "mode" };
const SIDE_POPOVER: SheetSurface = { kind: "popover", popover: "side" };
const ORDER_POPOVER: SheetSurface = { kind: "popover", popover: "order" };
const REGIME_POPOVER: SheetSurface = { kind: "popover", popover: "regime" };
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
 * D-4 — sélecteur en place qui, après un choix, laisse la valeur choisie visible
 * (le cadre glisse vers elle), puis se replie en fondu. « Réduire les animations » :
 * fermeture immédiate.
 *
 * Q39 (Hermann, 2026-10-17, E-13) : le repli n'anime plus `height` sur le fil JS
 * (`Animated.timing`, `useNativeDriver: false`, saccadé). Après `SELECTOR_SETTLE_MS`,
 * `onClosed` est appelé et le sélecteur est démonté : sa sortie (fondu + repli) et
 * le glissement des lignes voisines sont joués sur le fil UI par Reanimated
 * (`SheetMotionView`). Contrat inchangé : `onClosed` après la fermeture, tout de
 * suite si « Réduire les animations » ou si le sélecteur n'a jamais été mis en page.
 *
 * Q41 (Hermann, 2026-10-17, E-15) : `presentation="inline"` (Android, web) garde le
 * sélecteur en ligne, révélé par le bas sans fondu (`SheetMotionView`), DANS le cadre
 * de sélection de sa ligne ; `presentation="panel"` (iOS, Changement de côté et Ordre
 * des côtés) le rend tel quel dans un `AnchoredPanel` sous le champ : même contrat
 * D-4 (valeur choisie visible `SELECTOR_SETTLE_MS`, puis fermeture du panneau).
 */
function ClosingSelector({
  closing,
  reduceMotion,
  onClosed,
  children,
  testID,
  presentation = "inline",
}: {
  closing: boolean;
  reduceMotion: boolean;
  onClosed: () => void;
  children: ReactNode;
  testID: string;
  presentation?: "inline" | "panel";
}) {
  const [laidOut, setLaidOut] = useState(false);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });
  useEffect(() => {
    if (!closing) return;
    if (reduceMotion || !laidOut) {
      onClosedRef.current();
      return;
    }
    const timer = setTimeout(() => onClosedRef.current(), SELECTOR_SETTLE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing, reduceMotion]);
  const handleLayout = () => {
    if (!laidOut) setLaidOut(true);
  };
  if (presentation === "panel") {
    return (
      <View onLayout={handleLayout} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <SheetMotionView onLayout={handleLayout} style={styles.inlineControl} testID={testID}>
      {children}
    </SheetMotionView>
  );
}

/**
 * PRE-4 story 3.1 (S0, AD-7, FR-03-10, FR-03-11) — prototype de faisabilité,
 * iOS seulement : `Popover` SwiftUI de `@expo/ui` 57.0.13 rendu dans un
 * `Host` placé dans le `ScrollView` de la Feuille (la `Modal` en fondu est
 * conservée).
 *
 * Pastille hors SwiftUI : la pastille de valeur existante (`ValuePill`) est
 * rendue comme un élément React Native ordinaire de la `Row`, avec le même
 * centrage vertical que sur Android ; son `onPress` bascule l'ouverture. Le
 * `Popover` n'est piloté que par `isPresented` : son déclencheur n'est qu'une
 * ancre. Cette ancre est un `Host` superposé à la pastille, de même taille
 * (conteneur `StyleSheet.absoluteFill`, `pointerEvents="none"` : aucun toucher
 * ne lui parvient, tous atteignent la pastille), dont `Popover.Trigger` est un
 * `Spacer` SwiftUI transparent étendu à tout le `Host` (`frame` maximal). Une
 * première version hébergeait la pastille par `RNHostView` dans
 * `Popover.Trigger` : sur iPhone, son toucher ne passait pas et le double
 * hébergement à taille calculée la décentrait dans la ligne.
 *
 * La bulle est ancrée aux bornes de la pastille et suit le défilement de la
 * ligne. Le système choisit la flèche (`arrowEdge` par défaut)
 * ; `@expo/ui` force `presentationCompactAdaptation(.popover)`, sans quoi
 * l'iPhone la présenterait en feuille.
 *
 * Fermeture par appui extérieur (FR-03-10, P9) : SwiftUI émet
 * `onIsPresentedChange(false)` ; `onDismiss` ferme sans rien appliquer.
 *
 * Contenu : toujours monté, y compris pendant l'animation de fermeture, et
 * remonté à chaque ouverture par une clé de génération incrémentée : la
 * roulette repart ainsi de la valeur courante (Q12). À vérifier sur iPhone
 * (R-3.1-01, R-3.1-02), sans conclusion tirée de Jest : que la bulle ne se
 * vide ni ne se replie à l'ouverture ou à la fermeture, et que le remontage
 * à l'ouverture n'affecte pas son dimensionnement. Également à vérifier sur
 * iPhone : que la bulle s'ancre bien à l'ancre transparente (position, flèche),
 * que l'appui extérieur la ferme sans appliquer, que le contenu (options du
 * Mode, roulette) reste touchable malgré le `pointerEvents="none"` de l'ancre,
 * et que la pastille est de nouveau centrée sur le libellé. Aucune `Modal`, aucun
 * `Pressable` de voile ni assemblage de `ScrollView` ne s'y substitue
 * (NFR-02, NFR-03 ; test PRE4-3.1/AC6).
 *
 * Depuis Q37 (Hermann, 2026-10-17), seule la ligne « Mode d’exécution »
 * l'utilise. Depuis Q41 (E-15), la roue de « Durée d’une série », celle de la
 * Durée totale, le Changement de côté et l'Ordre des côtés s'ouvrent dans un
 * `AnchoredPanel` sans flèche, sous le champ ; le popover natif du Mode, validé,
 * est inchangé.
 */
function NativeRowPopover({
  isPresented,
  onDismiss,
  trigger,
  children,
  testID,
}: {
  isPresented: boolean;
  onDismiss: () => void;
  trigger: ReactNode;
  children: ReactNode;
  testID: string;
}) {
  // Génération du contenu, incrémentée à chaque ouverture (état dérivé des props).
  const [generation, setGeneration] = useState(0);
  const [wasPresented, setWasPresented] = useState(isPresented);
  if (isPresented !== wasPresented) {
    setWasPresented(isPresented);
    if (isPresented) setGeneration((current) => current + 1);
  }
  return (
    <View testID={`${testID}-frame`}>
      {trigger}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={`${testID}-anchor`}>
        <Host style={StyleSheet.absoluteFill} testID={testID}>
          <Popover
            isPresented={isPresented}
            onIsPresentedChange={(presented) => {
              if (!presented) onDismiss();
            }}
            testID={`${testID}-popover`}
          >
            <Popover.Trigger>
              <Spacer modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]} testID={`${testID}-trigger`} />
            </Popover.Trigger>
            <Popover.Content>
              <Fragment key={generation}>{children}</Fragment>
            </Popover.Content>
          </Popover>
        </Host>
      </View>
    </View>
  );
}

/**
 * Marges internes des options du popover de Mode : valeurs PROVISOIRES du
 * prototype S0, non tirées de Figma, NON VÉRIFIABLE à ce stade ; relevées par
 * la story 3.3 sur `8328:37092` (P33).
 */
const POPOVER_OPTION_PADDING = { top: spacing[8], bottom: spacing[8], leading: spacing[16], trailing: spacing[16] };

/**
 * Story 3.1 (AC2) — contenu du popover de Mode : `Durée` puis `Répétitions`,
 * boutons SwiftUI natifs. L'option courante porte le trait `isSelected`.
 */
function ModePopoverOptions({
  value,
  onChoose,
}: {
  value: ExecutionMode | null;
  onChoose: (mode: ExecutionMode) => void;
}) {
  const options: readonly ExecutionMode[] = ["DURATION", "REPETITIONS"];
  return (
    <VStack spacing={0} modifiers={[padding({ top: spacing[4], bottom: spacing[4] })]}>
      {options.map((mode, index) => (
        <Fragment key={mode}>
          {index > 0 ? <SwiftUIDivider /> : null}
          <SwiftUIButton
            label={t.modes[mode]}
            onPress={() => onChoose(mode)}
            modifiers={[
              frame({ minHeight: minTouchTarget, alignment: "leading" }),
              padding(POPOVER_OPTION_PADDING),
              ...(value === mode ? [accessibilityAddTraits(["isSelected"])] : []),
            ]}
            testID={`execution-sheet-mode-option-${mode}`}
          />
        </Fragment>
      ))}
    </VStack>
  );
}

/**
 * Recette 2 (T-15) — repère d’insertion : trait bleu Kodjo de 2 entre deux lignes,
 * à l’endroit où la Série sera déposée. Hauteur nulle dans le flux : les lignes
 * ne bougent pas.
 */
function InsertionGuide({ before }: { before: number }) {
  return (
    <View
      style={styles.insertionGuideSlot}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`execution-sheet-table-insertion-guide-before-${before}`}
    >
      <View style={styles.insertionGuideLine} />
    </View>
  );
}

/** T-58 : marge égale entre la capsule Annuler et les bords droit, haut et bas du message. */
const ADJUSTMENT_ACTION_INSET = 8;

/** D-341 : hauteur MINIMALE du segmenté Ordre des côtés (figé 330×60) ; grandit avec le texte. */
const SIDE_ORDER_MIN_HEIGHT = 60;

/**
 * Q41 : champs dont le contrôle s'ouvre, sur iOS, dans un panneau sans flèche sous le
 * champ. Q43 (story 3.3) : le Régime, par cohérence avec le Changement de côté et l'Ordre.
 */
type PanelControl = "uniformDuration" | "uniformRepetitions" | "sideMode" | "sideOrder" | "regime" | "total" | "rowTarget";
type Box = { readonly y: number; readonly height: number };
const NO_BOX: Box = { y: 0, height: 0 };
const sameBox = (box: Box | undefined, y: number, height: number) => box !== undefined && box.y === y && box.height === height;
/** Story 3.6 : boîte du tableau (position dans le groupe « Séries », largeur des lignes). */
type TableBox = { readonly y: number; readonly width: number };
const NO_TABLE_BOX: TableBox = { y: 0, width: 0 };
/** Story 3.6 : boîte de la cellule de Cible dans sa ligne (même géométrie pour toutes les lignes). */
type CellBox = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
/**
 * Message d'ajustement (D-5) : l'Inversion du total garde l'état d'avant pour `Annuler` ;
 * le retrait d'une ligne (story 3.6) n'en garde aucun, `undoRemoval` du Brouillon suffit.
 */
type Adjustment =
  | { readonly kind: "total"; readonly message: string; readonly previous: ExecutionSheetDraft }
  | { readonly kind: "removal"; readonly message: string };

/**
 * Story 3.6 — identité de la ligne de rang `index` (AD-2). Les identités et les lignes du
 * Brouillon sont alignées ; si elles ne l'étaient pas (`rowIds` plus court), la ligne n'a
 * pas d'identité : `null`, jamais son rang (un rang ne se mélange pas à une identité).
 */
export function tableRowIdentity(rowIds: readonly number[], index: number): number | null {
  return Number.isInteger(index) && index >= 0 && index < rowIds.length ? rowIds[index]! : null;
}

const sameCellBox = (a: CellBox, b: CellBox) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
/** Q41 : écart entre le bas de la ligne du champ et le haut du panneau (valeur d'intégration, non tirée de Figma). */
const PANEL_GAP = spacing[4];
/** Q41 : identifiants des panneaux. */
const PANEL_TEST_IDS: Readonly<Record<PanelControl, string>> = {
  uniformDuration: "execution-sheet-target-panel",
  // Story 3.5 : même panneau de la Cible commune, en Répétitions (un seul Mode affiché).
  uniformRepetitions: "execution-sheet-target-panel",
  sideMode: "execution-sheet-side-panel",
  sideOrder: "execution-sheet-order-panel",
  regime: "execution-sheet-regime-panel",
  total: "execution-sheet-total-panel",
  // Story 3.6 (Q41, cohérence) : Sélecteur de la Cible d'une ligne, sous sa cellule.
  rowTarget: "execution-sheet-cell-panel",
};
/** Panneaux qui portent un segmenté : largeur de la ligne, fond et ombre de panneau flottant. */
const isSegmentedPanel = (control: PanelControl) => control === "sideMode" || control === "sideOrder" || control === "regime";
/** Q41 : la zone de toucher extérieur couvre aussi les marges du corps défilant (`bodyContent`). */
const PANEL_OUTSIDE_INSETS = { top: spacing[12], right: spacing[24], bottom: spacing[24], left: spacing[24] };

/** Durée de montée de la feuille (prototype figé : ouverture 0,25 s, ease-out). */
const SHEET_ENTRY_DURATION_MS = 250;
/**
 * Story 3.6, réduite par Q44 — croix de retrait (maître `8129:31604`, relevé sur
 * `8328:38632`) : disque de 28 (`#FCFCFE`, liseré blanc), croix bleu Kodjo, au bord droit
 * de la ligne. Figma ne fixe que le rendu (D-255). Pour loger la croix sans réduire les
 * steppers acceptés (128), le tableau n'a plus de retrait x52 (AC1) et l'écart entre
 * colonnes passe de 4 à 2 : 40 + 2 + 128 + 2 + 128 + 2 + 28 = 330 à 402 (choix
 * d'intégration, à juger sur iPhone).
 */
const TABLE_REMOVE_DISC = 28;
const TABLE_COLUMN_GAP = 2;
/**
 * NFR-09, AC13 : cibles tactiles d'au moins 44 × 44 sans agrandir le dessin. Poignée
 * 12 × 18 : +13 en haut et en bas, 12 à gauche (dans la marge du groupe, `bleed`) et 20
 * à droite (sur le numéro, non tactile). Croix 28 × 28 : +8 de chaque côté.
 */
const HANDLE_HIT_SLOP = { top: 13, bottom: 13, left: 12, right: 20 };
const REMOVE_HIT_SLOP = 8;

/**
 * Hauteur minimale des lignes de la Feuille et des lignes du tableau des séries
 * variables : 44 pt, pour que les ± et les pastilles aient une cible tactile
 * verticale de 44 pt (NFR-09). Décision Q42 de Hermann du 2026-10-17 (recette
 * iPhone) ; remplace les 42 pt du DSF et du code PRE-3. Aucun jeton modifié
 * (`minTouchTarget` vaut 48 et sert à d’autres surfaces).
 */
export const SHEET_ROW_MIN_HEIGHT = 44;

/** Hauteur de ligne du tableau variable (Q42 : 44 ; DSF d’origine : 42 à 402). */
export const TABLE_ROW_HEIGHT = SHEET_ROW_MIN_HEIGHT;
/** Largeurs DSF des steppers à 402 : premier niveau 137, tableau 128. */
const STEPPER_WIDTH = 137;
const TABLE_STEPPER_WIDTH = 128;

/** Destination d'un glisser vertical de `dy` points depuis la ligne `from`, bornée au tableau. */
export function dragDestination(from: number, dy: number, rowHeight: number, count: number): number {
  return Math.min(count - 1, Math.max(0, from + Math.round(dy / rowHeight)));
}

function seriesLabel(count: number | null): string {
  if (count === null) return t.unset;
  return `${count} ${count === 1 ? t.seriesSingular : t.seriesPlural}`;
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
const beepLabel = (value: number | null) => (value === null || value === 0 ? t.beepNone : `${value} s`);
const repetitionsLabel = (value: number | null) => (value === null ? t.unset : `${value} ${t.repetitionsUnit}`);
/** Story 3.5 (AC7, H13) : nombre de la roue annoncé avec son unité (« 1 répétition », « 12 répétitions »). */
const repetitionsSpoken = (value: number) =>
  (value === 1 ? t.repetitionsSpokenSingular : t.repetitionsSpokenPlural).replace("{n}", String(value));

export function ExecutionParametersSheet({
  parent,
  baseline = null,
  profileSideRecoverySecondsDefault,
  onApply,
  onCancel,
}: ExecutionParametersSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<ExecutionSheetDraft>(() => openSheetDraft(parent));
  // Story 3.3 (AD-15) : surface ouverte unique — popover, panneau, roue ou champ ±.
  const [surface, dispatchSurface] = useReducer(sheetSurfaceReducer, INITIAL_SHEET_SURFACE_STATE);
  const openSurface = surface.open;
  const openKey = openSurface.kind === "none" ? null : openSurface.key;
  const isOpen = (target: SheetSurface) => sameSurface(openSurface, target);
  const isClosing = (target: SheetSurface) => isOpen(target) && surface.closingKey === openKey;
  const [isTableFolded, setIsTableFolded] = useState(false);
  /**
   * Q40 (Hermann, 2026-10-17, E-14) : tableau des séries variables « sélectionné ».
   * Vrai quand Hermann l'ouvre (passage du Régime à `variables`, dépliage par le
   * chevron) ou agit dedans (cellule, ±, glisser, déplacement) ; faux dès qu'il
   * sélectionne un autre champ hors du tableau (contrôle en place, popover du Mode,
   * roue de la Cible commune, ± d'une ligne hors tableau) ou quand le tableau se
   * replie ou se ferme. Faux à l'ouverture de la Feuille : aucun geste encore.
   */
  const [isTableSelected, setIsTableSelected] = useState(false);
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
  const [groupBox, setGroupBox] = useState<Box>(NO_BOX);
  // Position du groupe « Séries » + tableau dans le groupe Paramètres (repère de la ligne Séries).
  const [variableGroupY, setVariableGroupY] = useState(0);
  const [rowBoxes, setRowBoxes] = useState<Partial<Record<PanelControl, Box>>>({});
  const [panelHeight, setPanelHeight] = useState<{ readonly control: PanelControl; readonly height: number } | null>(null);
  // Story 3.6 (Q41) : géométrie du tableau pour placer le Sélecteur d'une ligne sous sa cellule —
  // largeur du groupe, boîte du tableau dans le groupe « Séries », boîte de chaque ligne
  // (par identité) dans le tableau, boîte de la cellule de Cible dans sa ligne, largeur
  // mesurée du panneau.
  const [groupWidth, setGroupWidth] = useState(0);
  const [tableBox, setTableBox] = useState<TableBox>(NO_TABLE_BOX);
  const [tableRowBoxes, setTableRowBoxes] = useState<Readonly<Record<number, Box>>>({});
  const [targetCellBoxes, setTargetCellBoxes] = useState<Readonly<Record<number, CellBox>>>({});
  // Largeur mesurée du panneau, liée à la clé de son ouverture : une autre ouverture (autre
  // ligne, autre Mode) repart de la largeur par défaut de la roue montée.
  const [panelWidth, setPanelWidth] = useState<{ readonly key: number; readonly width: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeightRef = useRef(0);
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

  useEffect(() => {
    if (!adjustment) return;
    const timer = setTimeout(() => setAdjustment(null), TRANSIENT_NOTIFICATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [adjustment]);

  const effective = effectiveParameters(draft);
  const effectiveFirst = seriesRowsOf(effective)[0] ?? { target: unsetTarget(), pauseSeconds: 0 };
  const single = isSingleSeries(draft);
  const bilateral = isBilateral(draft.sideMode);
  const showVariableTable = draft.variable && !single;
  // Régime affiché : `variables` seulement à N ≥ 2 ; à N = 1, l'état effectif est uniforme (P16).
  const regimeValue: Regime = showVariableTable ? "VARIABLE" : "UNIFORM";
  // Q40 : jamais deux surlignages — le tableau n'est pas surligné tant qu'une surface hors
  // tableau est ouverte (par exemple le panneau du Régime pendant son cadre D-4).
  // Story 3.6 : le Sélecteur d'une ligne est une surface DU tableau, qui reste sélectionné.
  const rowSelectorOpen = openSurface.kind === "selector" && openSurface.selector === "rowTarget";
  const tableSelected =
    isTableSelected && showVariableTable && !isTableFolded && (openSurface.kind === "none" || rowSelectorOpen);
  const totalEditable = isRequestedTotalEditable(draft);

  const validation = commitSheetDraft(draft, baseline);
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
      ? validation.violations.find((violation) => violation.field === "target")
      : undefined;
  const uniformTargetInvalid = uniformTargetViolation !== undefined;
  const uniformTargetHint = uniformTargetViolation ? invalidHintFor(uniformTargetViolation.code) : undefined;
  // Décision propriétaire D-2 (recette 1) : aucun message « Renseignez … » ; la saisie
  // incomplète reste signalée par le contour figé de la cellule et le ✓ indisponible.

  // Story 3.7 (AC1, AC2, AD-5, FR-14-01, P24) : la forme de la ligne Durée totale se lit
  // dans le domaine — nature du total intrinsèque (`computeIntrinsicDuration`, story 2.1)
  // et disponibilité de l'Inversion (`isRequestedTotalEditable`) ; la Feuille ne calcule
  // ni ne qualifie aucune durée. Ligne présente si et seulement si la nature porte un
  // montant (`hasDurationAmount`) : `exact` (roulette si l'Inversion est disponible, sinon
  // lecture seule), `estimated` (≈, lecture seule), `lowerBound` (≥, mélange calculable,
  // lecture seule). Absente pour `omitted` (Répétitions sans Bip, tout à l'échec,
  // `identiques` à l'échec) et `incomplete` (une Cible `UNSET` : ni ligne ni montant,
  // H10, NFR-06) ; le Bip passe alors juste avant Compte à rebours (FR-03-02). Recalcul à
  // chaque rendu du Brouillon (AC2). Autre saisie invalide (valeur hors bornes) : ligne
  // conservée avec « — », comportement existant (PRE4-2.1/AC9), aucun montant inventé.
  const totalResult = isCalculable(effective) ? computeIntrinsicDuration(effective) : null;
  const totalNature = totalResult !== null && hasDurationAmount(totalResult.kind) ? totalResult.kind : null;
  const totalSeconds = totalNature !== null && validation.ok ? totalResult?.seconds : undefined;
  // AC8 (AD-5, H8) : montant par le formateur unique ; préfixe `≥ ` du lexique (story 2.2).
  const totalAmount = totalSeconds === undefined ? null : formatPhraseDuration(totalSeconds);
  const totalText =
    totalAmount === null
      ? t.unset
      : totalNature === "lowerBound"
        ? `${strings.shared.durationNature.lowerBoundPrefix}${totalAmount}`
        : totalAmount;

  /** Changement venu d'un champ HORS du tableau : le tableau n'est plus sélectionné (Q40). */
  function update(next: ExecutionSheetDraft) {
    setIsTableSelected(false);
    setAdjustment(null);
    setDraft(next);
    // Q38 : un sélecteur d'Ordre ouvert se ferme quand N passe à 1 (ligne masquée) ;
    // il ne se rouvre pas de lui-même quand N remonte. P16 : de même pour le Régime,
    // figé à N = 1. Un champ ± ouvert (N compris) reste ouvert (T22).
    // Défense seulement : N ne change que par son champ ± ou par l'Inversion du total, et
    // toucher l'un ou l'autre ferme d'abord tout popover ou panneau (T10) ; aucun geste
    // nominal n'atteint donc ce cas aujourd'hui.
    if (isSingleSeries(next)) {
      dispatchSurface({ type: "prune", removed: [ORDER_POPOVER, REGIME_POPOVER] });
    }
  }

  /**
   * Q40 — sélection unique : le tableau devient la seule sélection visible. Toute
   * surface hors tableau ouverte se referme par son mécanisme habituel (sélecteur en
   * ligne démonté avec sa sortie animée, popover du Mode fermé, roulette fermée, champ
   * ± rangé) ; sa ligne n'est plus surlignée. Jamais deux surlignages.
   */
  function selectTable() {
    setIsTableSelected(true);
    dispatchSurface({ type: "closeAll" });
  }

  /** Q40 : action dans le tableau (cellule, ±, glisser, déplacement) — le tableau est sélectionné. */
  function updateInTable(next: ExecutionSheetDraft) {
    update(next);
    selectTable();
  }

  /**
   * Story 3.6 (AD-15, FR-10-03, Q13, Q41) : toucher la valeur d'une cellule de Cible ouvre
   * le Sélecteur de SA ligne (T2, T3 ; T21 si un champ ± est ouvert, fermé dans le même
   * geste ; T10 si un popover ou un Sélecteur est ouvert). L'ouverture ne modifie pas le
   * Brouillon : `Annuler` d'un retrait reste valable (Q29).
   */
  function openRowSelector(row: number) {
    setIsTableSelected(true);
    dispatchSurface({ type: "touch", surface: { kind: "selector", selector: "rowTarget", row } });
  }

  /**
   * Story 3.6 (AD-16, FR-09-05, Q13, Q26, Q36, P38) : règle de pas des ± d'une cellule de
   * Cible, celle du domaine (`stepTarget`) ; `stepSize` porte les paliers du maintien
   * (`EXECUTION_ACCELERATED_HOLD_POLICY`). `FAILURE` : ± indisponibles ; `UNSET` : +
   * donne la valeur minimale, − indisponible.
   */
  const targetStepRule = (mode: ExecutionMode, target: SeriesTarget) => (
    value: number | null,
    direction: 1 | -1,
    stepSize: number,
  ): number | "unavailable" => {
    // La valeur courante du stepper (relue à chaque pas d'un maintien) prime : `null` est
    // la Cible rendue (`UNSET` ou `FAILURE`), un nombre une Cible numérique.
    const next = stepTarget(mode, value === null ? target : numberTarget(value), direction, stepSize);
    return next === "unavailable" ? next : next.value;
  };

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
    // Les mesures de la ligne retirée sont élaguées : restaurée par `Annuler`, elle est
    // remesurée à son nouveau montage avant que son panneau puisse s'ouvrir.
    const omit = <T,>(boxes: Readonly<Record<number, T>>): Readonly<Record<number, T>> => {
      if (!(row in boxes)) return boxes;
      const { [row]: _removed, ...kept } = boxes;
      return kept;
    };
    setTableRowBoxes(omit);
    setTargetCellBoxes(omit);
    setAdjustment({ message: t.seriesRemoved, kind: "removal" });
  }

  /**
   * D-5 : `Annuler` du message d'ajustement. Story 3.6 (T27, Q29) : pour un retrait, la
   * ligne est restaurée par `undoRemoval` (position, Cible, Pause, identité) ; l'appui ne
   * range rien : la surface est inchangée.
   */
  function handleAdjustmentUndo() {
    if (adjustment === null) return;
    setAdjustment(null);
    setDraft(adjustment.kind === "removal" ? undoRemoval(draft) : adjustment.previous);
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

  /** D-4 : la valeur choisie est appliquée tout de suite, puis le sélecteur se referme. */
  function closeAfterChoice(key: number | null) {
    if (key !== null) dispatchSurface({ type: "choose", key });
  }

  function handleSelectorClosed(key: number | null) {
    if (key !== null) dispatchSurface({ type: "closed", key });
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

  // Story 3.1 (S0, AD-7) : popover natif du Mode, iOS seulement. Android et web
  // gardent le segmenté et la roulette en ligne.
  //
  // Q41 (Hermann, 2026-10-17, recette iPhone, E-15 ; remplace la couche
  // `WheelPickerOverlay` de Q37 pour la Feuille) : sur iOS, le Changement de côté,
  // l'Ordre des côtés, la roue de « Durée d’une série » et celle de la Durée totale
  // s'ouvrent dans un panneau SANS FLÈCHE (`AnchoredPanel`), juste sous le champ
  // sélectionné, aligné à droite sur lui, au-dessus du contenu (aucune ligne ne se
  // décale). Contenus inchangés : `SegmentedControl` (mêmes options, libellés et
  // sous-titres) et `DurationWheelPicker` (roulette native SwiftUI et sa barre ✕ / ✓).
  // Un choix ou le ✓ applique au Brouillon de la Feuille ; le ✕ de la roue et un
  // toucher hors du panneau ferment sans rien appliquer. La roue, démontée à la
  // fermeture, repart de la valeur courante à chaque ouverture (Q12). Le popover
  // natif du Mode, validé, est inchangé. Aucune `Modal` supplémentaire, aucun
  // `Popover` : la roue de la Durée totale n'a plus d'animation de hauteur.
  const nativePopovers = Platform.OS === "ios";
  const anchoredPanels = nativePopovers;


  /** Q41 : boîte (position, hauteur) de la ligne d'un champ à panneau, relevée à la mise en page. */
  function trackRow(control: PanelControl) {
    return (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      setRowBoxes((current) => (sameBox(current[control], y, height) ? current : { ...current, [control]: { y, height } }));
    };
  }

  // Story 3.4 (FR-08-02) : la roue de la Cible commune s'ouvre aussi sur une Cible à l'échec.
  const uniformDurationAvailable = !showVariableTable && effective.mode === "DURATION";
  // Story 3.5 (AC1) : même Sélecteur de la Cible commune en Répétitions, échec compris.
  const uniformRepetitionsAvailable = !showVariableTable && effective.mode === "REPETITIONS";
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
  const totalSpokenLabel =
    totalNature === null || totalWheelSeconds !== undefined
      ? undefined
      : [t.total, totalNatureSpoken, totalAmount ?? t.totalInvalidSpoken, totalAmount === null ? null : t.totalReadOnlySpoken]
          .filter((part) => part !== null)
          .join(", ");
  const panelControl: PanelControl | null = !anchoredPanels
    ? null
    : isOpen(SIDE_POPOVER)
      ? "sideMode"
      : isOpen(ORDER_POPOVER) && bilateral && !single
        ? "sideOrder"
        : isOpen(REGIME_POPOVER) && !single
          ? "regime"
          : isOpen(TARGET_SELECTOR) && uniformDurationAvailable
            ? "uniformDuration"
            : isOpen(TARGET_SELECTOR) && uniformRepetitionsAvailable
              ? "uniformRepetitions"
              : isOpen(TOTAL_SELECTOR) && totalWheelSeconds !== undefined
                ? "total"
                : rowSelectorOpen &&
                    showVariableTable &&
                    !isTableFolded &&
                    draft.rowIds.includes(openSurface.row) &&
                    tableRowBoxes[openSurface.row] !== undefined &&
                    targetCellBoxes[openSurface.row] !== undefined
                  ? "rowTarget"
                  : null;
  // Q41 : le panneau s'ouvre sous la ligne du champ (repère : l'hôte des panneaux, dont
  // le groupe est le premier enfant), aligné à droite sur le champ (bord droit de la
  // ligne, `GROUP_PADDING` avant le bord du groupe). Les segmentés gardent la largeur
  // de la ligne (D-341) ; la roue garde sa propre largeur (330), alignée à droite.
  const anchorBox = panelControl === null || panelControl === "rowTarget" ? NO_BOX : (rowBoxes[panelControl] ?? NO_BOX);
  const anchorY = panelControl === "regime" ? variableGroupY + anchorBox.y : anchorBox.y;
  // Story 3.6 (Q41, cohérence) : le Sélecteur d'une ligne s'ouvre sous SA cellule de Cible
  // (bas de la cellule : groupe « Séries » → tableau → ligne → cellule), aligné à droite
  // sur elle. Une roue de 330 plus large que l'espace à gauche de la cellule est ramenée
  // dans le groupe, son bord gauche au bord des lignes (`GROUP_PADDING`) : choix
  // d'intégration, à juger sur iPhone (R-3.6-01).
  // La ligne et sa cellule sont mesurées une à une (par identité) ; tant qu'une mesure manque,
  // le panneau n'est pas rendu (aucun saut en tête de tableau, voir `panelControl`).
  const cellRowBox = rowSelectorOpen ? tableRowBoxes[openSurface.row] : undefined;
  const cellBox = rowSelectorOpen ? targetCellBoxes[openSurface.row] : undefined;
  const cellBottom = variableGroupY + tableBox.y + (cellRowBox?.y ?? 0) + (cellBox?.y ?? 0) + (cellBox?.height ?? 0);
  const cellRight = GROUP_PADDING + Math.max(0, tableBox.width - ((cellBox?.x ?? 0) + (cellBox?.width ?? 0)));
  // Largeur par défaut de la roue montée : Durée (`durationWidth`, 330) ; la roue Répétitions
  // à ligne de tête prend la même largeur (story 3.5, `NumberWheelPicker` avec `failureOption`).
  const rowPanelDefaultWidth = dimensions.wheelPicker.durationWidth;
  const rowPanelWidth = panelWidth !== null && panelWidth.key === openKey ? panelWidth.width : rowPanelDefaultWidth;
  const rowPanelRight =
    groupWidth > 0 ? Math.max(0, Math.min(cellRight, groupWidth - GROUP_PADDING - rowPanelWidth)) : cellRight;
  const panelTop = panelControl === "rowTarget" ? groupBox.y + cellBottom + PANEL_GAP : groupBox.y + anchorY + anchorBox.height + PANEL_GAP;
  const measuredPanelHeight = panelHeight !== null && panelHeight.control === panelControl ? panelHeight.height : 0;
  // Place sous le groupe : si le panneau dépasse le bas du contenu (Durée totale, près du
  // bas), une réserve vide est ajoutée après le groupe, sans déplacer aucune ligne.
  const panelRoom =
    panelControl === null ? 0 : Math.max(0, Math.ceil(panelTop + measuredPanelHeight - (groupBox.y + groupBox.height)));

  const modePopoverKey = isOpen(MODE_POPOVER) ? openKey : null;

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

  // Story 3.3 (AC6, FR-04-01, P16) : champ de Régime de la ligne `Séries` ; à N = 1, non
  // modifiable, état uniforme, atténué (`UNSELECTED_OPACITY`, AD-11).
  const regimeText = t.regimes[regimeValue];
  const regimeField = (
    <ValuePill
      value={regimeText}
      accessibilityLabel={single ? `${t.regime}, ${regimeText}, ${t.disabledSuffix}` : `${t.regime}, ${regimeText}`}
      expanded={isOpen(REGIME_POPOVER)}
      disabled={single}
      onPress={() => toggle(REGIME_POPOVER)}
      testID="execution-sheet-regime-value"
    />
  );

  const modeValueText = effective.mode === null ? t.unset : t.modes[effective.mode];
  const modeValuePill = (
    <ValuePill
      value={modeValueText}
      accessibilityLabel={`${t.mode}, ${spokenValue(modeValueText)}`}
      expanded={isOpen(MODE_POPOVER)}
      onPress={() => toggle(MODE_POPOVER)}
      testID="execution-sheet-mode-value"
    />
  );
  // Story 3.4 (AC10, FR-06-05) : « à l’échec », « — » (fond #FFF1F0) ou la durée formatée.
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
  // (`selectorOpeningPosition` : 5999 → 58:55, « — » → 00:05, échec → option) ; la
  // ligne garde sa valeur d'origine jusqu'au ✓. Bornes de Cible 5..3535 : `00:00`
  // reste une position, jamais une Cible (✓ indisponible). L'échec sort en
  // `SeriesTarget` `FAILURE`, jamais en nombre.
  //
  // Story 3.6 (Q13, AD-7) : la même roue sert au Sélecteur d'une ligne du tableau ; seul
  // le dispatch au ✓ diffère (`apply`). ✓ et ✕ ferment par `close` (T5, T6, T25, T26).
  const durationTargetWheel = (target: SeriesTarget, apply: (chosen: SeriesTarget) => void, context?: string) => {
    const wheelLabels = strings.screens.exercise.wheelPicker;
    // Story 3.6 (AC13) : la roue d'une ligne porte son contexte (« Série n, Durée, … »), comme la roue Répétitions.
    const withContext = (label: string) => (context === undefined ? label : `${context}, ${label}`);
    const opening = selectorOpeningPosition("DURATION", target);
    return (
      <DurationWheelPicker
        totalSeconds={opening.kind === "NUMBER" ? opening.value : 0}
        targetBounds={EXECUTION_BOUNDS.durationTarget}
        failureOption={{
          label: t.durationFailureOption,
          initiallySelected: opening.kind === "FAILURE",
          onValidateFailure: (chosen) => {
            closeSurface(openKey);
            apply(chosen);
          },
        }}
        onValidate={(seconds) => {
          closeSurface(openKey);
          apply(numberTarget(seconds));
        }}
        onCancel={() => closeSurface(openKey)}
        minutesAccessibilityLabel={withContext(wheelLabels.minutesAccessibilityLabel)}
        secondsAccessibilityLabel={withContext(wheelLabels.secondsAccessibilityLabel)}
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
  // Story 3.6 (Q13) : même roue pour le Sélecteur d'une ligne du tableau (`apply` seul diffère).
  const repetitionsTargetWheel = (target: SeriesTarget, apply: (chosen: SeriesTarget) => void, accessibilityLabel: string) => {
    const opening = selectorOpeningPosition("REPETITIONS", target);
    return (
      <NumberWheelPicker
        value={opening.kind === "NUMBER" ? opening.value : EXECUTION_BOUNDS.repetitionTarget.min}
        targetBounds={EXECUTION_BOUNDS.repetitionTarget}
        failureOption={{
          label: t.repetitionsFailureOption,
          initiallySelected: opening.kind === "FAILURE",
          onValidateFailure: (chosen) => {
            closeSurface(openKey);
            apply(chosen);
          },
        }}
        onValidate={(value) => {
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

  // Story 3.6 (FR-10-03, Q13, Q21, Q25, Q41) : Sélecteur d'une ligne du tableau — la roue de
  // la story 3.4 (Durée) ou 3.5 (Répétitions), ouverte sur `selectorOpeningPosition` de la
  // Cible de SA ligne ; ✓ remplace la seule Cible de cette ligne (T5), ✕ ne change rien (T6).
  const rowSelectorIndex = rowSelectorOpen ? draft.rowIds.indexOf(openSurface.row) : -1;
  const rowSelectorRow = rowSelectorIndex >= 0 && showVariableTable && !isTableFolded ? draft.rows[rowSelectorIndex] : undefined;
  const applyRowTarget = (chosen: SeriesTarget) => updateInTable(setRowTarget(draft, rowSelectorIndex, chosen));
  const rowTargetWheel =
    rowSelectorRow === undefined || effective.mode === null
      ? null
      : effective.mode === "DURATION"
        ? durationTargetWheel(
            rowSelectorRow.target,
            applyRowTarget,
            t.rowTarget.replace("{n}", String(rowSelectorIndex + 1)).replace("{field}", t.columns.DURATION),
          )
        : repetitionsTargetWheel(
            rowSelectorRow.target,
            applyRowTarget,
            t.rowTarget.replace("{n}", String(rowSelectorIndex + 1)).replace("{field}", t.columns.REPETITIONS),
          );
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
  // AC9 (FR-03-04, FR-11-05) : un Changement de côté non renseigné s'affiche « — » ;
  // le ✓ le produit `Sans changement` (domaine, story 3.2).
  const sideText = draft.sideMode === null ? t.unset : t.sideModes[draft.sideMode];
  const sideSelector = (presentation: "inline" | "panel") => (
    <ClosingSelector
      closing={isClosing(SIDE_POPOVER)}
      reduceMotion={reduceMotion}
      onClosed={() => handleSelectorClosed(openKey)}
      presentation={presentation}
      testID="execution-sheet-side-selector"
    >
      <SegmentedControl<SideMode>
        variant="parameters"
        labelStyle={type.segmentedCompactLabel}
        options={(["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"] as const).map((side) => ({
          value: side,
          label: t.sideModeOptions[side],
          accessibilityLabel: t.sideModes[side],
        }))}
        value={draft.sideMode}
        onChange={(side) => {
          update(setSideMode(draft, side, profileSideRecoverySecondsDefault));
          closeAfterChoice(openKey);
        }}
        accessibilityLabel={t.sideMode}
        testID="execution-sheet-side-control"
      />
    </ClosingSelector>
  );
  const orderSelector = (presentation: "inline" | "panel") => (
    <ClosingSelector
      closing={isClosing(ORDER_POPOVER)}
      reduceMotion={reduceMotion}
      onClosed={() => handleSelectorClosed(openKey)}
      presentation={presentation}
      testID="execution-sheet-order-selector"
    >
      <SegmentedControl<SideOrder>
        variant="parameters"
        labelStyle={type.body}
        minHeight={SIDE_ORDER_MIN_HEIGHT}
        options={(["BY_SIDE", "BY_SERIES"] as const).map((order) => ({
          value: order,
          label: t.sideOrders[order],
          subtitle: t.sideOrderSubtitles[order],
          accessibilityLabel: `${t.sideOrders[order]} ${t.sideOrderSubtitles[order]}`,
        }))}
        value={draft.sideOrder}
        onChange={(order) => {
          update(setSideOrder(draft, order));
          closeAfterChoice(openKey);
        }}
        accessibilityLabel={t.sideOrder}
        testID="execution-sheet-order-control"
      />
    </ClosingSelector>
  );
  // Story 3.3 (FR-04-01, Q43) : Régime des séries — `identiques` / `variables` avec leurs
  // sous-titres de référence ; même segmenté accepté et même contrat D-4 que l'Ordre.
  // Le choix passe par `setVariable` (Brouillon, story 3.2), inchangé.
  const regimeSelector = (presentation: "inline" | "panel") => (
    <ClosingSelector
      closing={isClosing(REGIME_POPOVER)}
      reduceMotion={reduceMotion}
      onClosed={() => handleSelectorClosed(openKey)}
      presentation={presentation}
      testID="execution-sheet-regime-selector"
    >
      <SegmentedControl<Regime>
        variant="parameters"
        labelStyle={type.body}
        minHeight={SIDE_ORDER_MIN_HEIGHT}
        options={(["UNIFORM", "VARIABLE"] as const).map((regime) => ({
          value: regime,
          label: t.regimes[regime],
          subtitle: t.regimeSubtitles[regime],
          accessibilityLabel: `${t.regimes[regime]}, ${t.regimeSubtitles[regime]}`,
        }))}
        value={regimeValue}
        onChange={(regime) => {
          const variable = regime === "VARIABLE";
          // Seul un passage effectif change le Brouillon et l'affichage : re-choisir
          // `variables`, tableau replié, le laisse replié.
          if (variable !== (regimeValue === "VARIABLE")) {
            // Recette 1 (A-01) : passer en `variables` présente le tableau déployé ; les
            // données restent celles du Brouillon.
            if (variable) setIsTableFolded(false);
            update(setVariable(draft, variable));
            // Q40 : passer en `variables` ouvre le tableau sélectionné ; son fond n'apparaît
            // qu'une fois le panneau du Régime refermé (`tableSelected`, sélection unique).
            if (variable) setIsTableSelected(true);
          }
          closeAfterChoice(openKey);
        }}
        accessibilityLabel={t.regime}
        testID="execution-sheet-regime-control"
      />
    </ClosingSelector>
  );

  // D-5 : toucher le message le ferme SANS annuler l’ajustement ; seul « Annuler » (cadre
  // clair sur le fond sombre) restaure les valeurs précédant l’ajustement. Le conteneur
  // n’est pas un élément VoiceOver : texte et Annuler restent accessibles séparément.
  // Q41 : apparition et disparition par le bas, sans fondu (`SheetMotionView`, fil UI).
  // Story 3.6 (AD-8) : même message, même durée, pour « Série supprimée — Annuler », rendu
  // sous le tableau (sous la ligne `Séries` si le retrait ramène N à 1) au lieu de sous la
  // Durée totale.
  const adjustmentMessage =
    adjustment === null ? null : (
      <SheetMotionView testID="execution-sheet-adjusted-motion">
        <Pressable
          onPress={() => setAdjustment(null)}
          accessible={false}
          style={styles.adjustment}
          accessibilityLiveRegion="polite"
          testID="execution-sheet-adjusted"
        >
          <Text style={styles.adjustmentText}>{adjustment.message}</Text>
          <Pressable
            onPress={handleAdjustmentUndo}
            accessibilityRole="button"
            accessibilityLabel={strings.screens.exercise.adjustedTotalDurationUndoAction}
            hitSlop={8}
            style={styles.adjustmentActionFrame}
            testID="execution-sheet-adjusted-undo"
          >
            <Text style={styles.adjustmentAction}>{strings.screens.exercise.adjustedTotalDurationUndoAction}</Text>
          </Pressable>
        </Pressable>
      </SheetMotionView>
    );

  // Q41 : un seul panneau ouvert à la fois ; les segmentés ont un fond et une ombre de
  // panneau flottant, la roue garde sa propre surface (`DurationWheelPicker`).
  const panel =
    panelControl === null ? null : (
      <AnchoredPanel
        key={panelControl}
        placement={
          isSegmentedPanel(panelControl)
            ? { top: panelTop, right: GROUP_PADDING, left: GROUP_PADDING }
            : { top: panelTop, right: panelControl === "rowTarget" ? rowPanelRight : GROUP_PADDING }
        }
        onDismiss={() => closeSurface(openKey)}
        outsideInsets={PANEL_OUTSIDE_INSETS}
        onLayout={(event) => {
          const { height, width } = event.nativeEvent.layout;
          setPanelHeight((current) =>
            current !== null && current.control === panelControl && current.height === height ? current : { control: panelControl, height },
          );
          if (panelControl === "rowTarget" && openKey !== null) {
            setPanelWidth((current) => (current !== null && current.key === openKey && current.width === width ? current : { key: openKey, width }));
          }
        }}
        style={isSegmentedPanel(panelControl) ? styles.selectorPanel : null}
        testID={PANEL_TEST_IDS[panelControl]}
      >
        {panelControl === "sideMode" ? sideSelector("panel") : null}
        {panelControl === "sideOrder" ? orderSelector("panel") : null}
        {panelControl === "regime" ? regimeSelector("panel") : null}
        {panelControl === "uniformDuration" ? <View testID="execution-sheet-target-wheel">{uniformDurationWheel}</View> : null}
        {panelControl === "uniformRepetitions" ? <View testID="execution-sheet-target-wheel">{uniformRepetitionsWheel}</View> : null}
        {panelControl === "total" ? <View testID="execution-sheet-total-wheel">{totalWheel}</View> : null}
        {panelControl === "rowTarget" ? <View testID="execution-sheet-cell-wheel">{rowTargetWheel}</View> : null}
      </AnchoredPanel>
    );

  return (
    <Modal transparent visible animationType="fade" onRequestClose={handleCancel} testID="execution-sheet-modal">
      <View style={styles.scrim} testID="execution-sheet-scrim">
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
                <SheetMotionView
                  appear={false}
                  onLayout={(event) => {
                    const { y, height, width } = event.nativeEvent.layout;
                    setGroupBox((current) => (sameBox(current, y, height) ? current : { y, height }));
                    setGroupWidth((current) => (current === width ? current : width));
                  }}
                  style={styles.group}
                  testID="execution-sheet-group"
                >
                  {/* Mode d'exécution */}
                  <Row
                    label={t.mode}
                    selected={isOpen(MODE_POPOVER)}
                    below={
                      !nativePopovers && isOpen(MODE_POPOVER) ? (
                        <ClosingSelector
                          closing={isClosing(MODE_POPOVER)}
                          reduceMotion={reduceMotion}
                          onClosed={() => handleSelectorClosed(openKey)}
                          testID="execution-sheet-mode-selector"
                        >
                          <SegmentedControl<ExecutionMode>
                            variant="parameters"
                            labelStyle={type.body}
                            options={[
                              { value: "DURATION", label: t.modes.DURATION },
                              { value: "REPETITIONS", label: t.modes.REPETITIONS },
                            ]}
                            value={draft.mode}
                            onChange={(mode) => {
                              update(setMode(draft, mode));
                              closeAfterChoice(openKey);
                            }}
                            accessibilityLabel={t.mode}
                            testID="execution-sheet-mode-control"
                          />
                        </ClosingSelector>
                      ) : null
                    }
                    testID="execution-sheet-row-mode"
                  >
                    {nativePopovers ? (
                      <NativeRowPopover
                        isPresented={isOpen(MODE_POPOVER)}
                        // FR-03-10, T7 : fermeture extérieure sans application. T8 : la clé est
                        // celle de la présentation du Mode ; un rappel tardif reçu alors qu'une
                        // autre surface est ouverte (ou aucune) est ignoré.
                        onDismiss={() => closeSurface(modePopoverKey)}
                        trigger={modeValuePill}
                        testID="execution-sheet-mode-host"
                      >
                        <ModePopoverOptions
                          value={effective.mode}
                          onChoose={(mode) => {
                            closeSurface(modePopoverKey);
                            update(setMode(draft, mode));
                          }}
                        />
                      </NativeRowPopover>
                    ) : (
                      modeValuePill
                    )}
                  </Row>
                  <Separator />

                  {/* Ligne « Séries » et tableau des séries variables (DSF).
                      Q40 (Hermann, 2026-10-17, E-14) remplace le cadre fixe X-3 / A-05 :
                      tableau sélectionné (ouvert, ou action dedans) = fond d'une ligne
                      sélectionnée, sans contour ; sinon état normal, sans fond ni contour.
                      Le séparateur reste à sa place (transparent si sélectionné) : rien
                      ne bouge quand la sélection change (Q41 : seule la couleur change,
                      ni marge, ni padding, donc aucune transition de place). */}
                  {/* Q39 : le groupe glisse quand le tableau apparaît ou disparaît (fil UI). */}
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
                    onLayout={(event) => {
                      // Q43 : la ligne « Séries » est dans le groupe ; sa boîte est relative à lui.
                      const { y } = event.nativeEvent.layout;
                      setVariableGroupY((current) => (current === y ? current : y));
                    }}
                    testID="execution-sheet-variable-group"
                  >
                    {/* Q40 : la ligne « Séries » (champ de Régime et chevron, qui ouvrent le
                        tableau) fait partie du groupe : sélectionné, son fond la couvre aussi. */}
                    {/* Séries */}
                    {/* Story 3.3 (AC2, AC6, FR-03-02, FR-04-01) : ligne `Séries` — champ de
                        Régime (`identiques` / `variables`), chevron en `variables`, puis le
                        nombre. L'interrupteur « Séries variables » est retiré (FR-04-01). */}
                    <Row
                      label={t.series}
                      selected={isOpen(REGIME_POPOVER) || isOpen(stepperSurface("count"))}
                      onLayout={trackRow("regime")}
                      below={!anchoredPanels && isOpen(REGIME_POPOVER) && !single ? regimeSelector("inline") : null}
                      testID="execution-sheet-row-series"
                    >
                      <View style={styles.regimeGroup} testID="execution-sheet-regime">
                        {regimeField}
                        {showVariableTable ? (
                          <DisclosureControl
                            expanded={!isTableFolded}
                            onPress={() => {
                              // Q40 : déplier sélectionne le tableau ; replier le désélectionne.
                              // T14 : toute surface ouverte (champ ± compris) est rangée.
                              if (isTableFolded) selectTable();
                              else {
                                setIsTableSelected(false);
                                dispatchSurface({ type: "closeAll" });
                              }
                              setIsTableFolded(!isTableFolded);
                            }}
                            accessibilityLabel={isTableFolded ? t.showTable : t.hideTable}
                            testID="execution-sheet-table-toggle"
                          />
                        ) : null}
                      </View>
                      <View style={styles.spacer} />
                      {stepperField("count", t.series, {
                        value: draft.count,
                        min: EXECUTION_BOUNDS.seriesCount.min,
                        max: EXECUTION_BOUNDS.seriesCount.max,
                        policy: EXECUTION_ACCELERATED_HOLD_POLICY,
                        formatValue: seriesLabel,
                        onChange: (count) => update(setSeriesCount(draft, count)),
                        accessibilityLabel: t.series,
                        testID: "execution-sheet-series",
                      })}
                    </Row>
                    {/* Story 3.6 (AC1) : le tableau suit la grille à cellules du DSF du 12/10,
                        sans retrait x52 : il commence au bord des lignes de premier niveau. */}
                    {showVariableTable && !isTableFolded ? <Separator hidden={tableSelected} /> : null}
                    {showVariableTable && !isTableFolded ? (
                      <VariableTable
                        draft={draft}
                        mode={effective.mode}
                        formatTarget={targetLabel}
                        invalidRows={invalidRows}
                        stepRuleFor={(target) => (effective.mode === null ? undefined : targetStepRule(effective.mode, target))}
                        selectorRow={rowSelectorOpen ? openSurface.row : null}
                        onOpenSelector={openRowSelector}
                        onRemove={handleRemove}
                        removalActive={removalEnabled(surface)}
                        onDraft={updateInTable}
                        inlineSelector={
                          // Q41 : Android et web — Sélecteur de la cellule en ligne, sous sa ligne.
                          !anchoredPanels && rowSelectorOpen && rowTargetWheel !== null
                            ? { row: openSurface.row, wheel: rowTargetWheel }
                            : null
                        }
                        onTableLayout={(box) => setTableBox((current) => (current.y === box.y && current.width === box.width ? current : box))}
                        onRowLayout={(row, box) =>
                          setTableRowBoxes((current) => (sameBox(current[row], box.y, box.height) ? current : { ...current, [row]: box }))
                        }
                        onTargetCellLayout={(row, box) =>
                          setTargetCellBoxes((current) => {
                            const known = current[row];
                            return known !== undefined && sameCellBox(known, box) ? current : { ...current, [row]: box };
                          })
                        }
                        onMove={(from, to) => updateInTable(moveRow(draft, from, to))}
                        onDraggingChange={(dragging) => {
                          setIsDraggingRow(dragging);
                          if (dragging) selectTable();
                        }}
                      />
                    ) : null}
                    {adjustment?.kind === "removal" ? adjustmentMessage : null}
                  </SheetMotionView>

                  {!showVariableTable ? (
                    <>
                      {effective.mode === "DURATION" ? (
                        <>
                          <Separator indented />
                          <Row
                            label={t.durationTarget}
                            indented
                            selected={isOpen(TARGET_SELECTOR)}
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
                            {/* Story 3.4 : à l'échec, la pastille affiche « à l’échec » et rouvre le Sélecteur. */}
                            {uniformDurationPill}
                          </Row>
                        </>
                      ) : null}
                      {effective.mode === "REPETITIONS" ? (
                        <>
                          <Separator indented />
                          <Row
                            label={t.repetitionsTarget}
                            indented
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
                      <Separator indented />
                      <Row label={t.pause} indented selected={isOpen(stepperSurface("pause"))} testID="execution-sheet-row-pause">
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
                  <Separator />

                  {/* Changement de côté */}
                  <Row
                    label={t.sideMode}
                    selected={isOpen(SIDE_POPOVER)}
                    onLayout={trackRow("sideMode")}
                    below={!anchoredPanels && isOpen(SIDE_POPOVER) ? sideSelector("inline") : null}
                    testID="execution-sheet-row-side"
                  >
                    <ValuePill
                      value={sideText}
                      accessibilityLabel={`${t.sideMode}, ${spokenValue(sideText)}`}
                      expanded={isOpen(SIDE_POPOVER)}
                      onPress={() => toggle(SIDE_POPOVER)}
                      testID="execution-sheet-side-value"
                    />
                  </Row>
                  {bilateral ? (
                    <>
                      {/* Q38 (Hermann, 2026-10-17, recette iPhone, E-12) : à N = 1, la ligne
                          « Ordre des côtés », son séparateur et son sélecteur ne sont pas
                          rendus (plus de rendu atténué) ; un seul séparateur reste avant la
                          Pause au changement de côté. L'Ordre choisi reste dans le Brouillon
                          (`draft.sideOrder`) et réapparaît dès N ≥ 2 ; la normalisation
                          effective « Un côté après l’autre » à N = 1 est inchangée (FR-12-04). */}
                      {!single ? (
                        <>
                          <Separator indented />
                          <Row
                            label={t.sideOrder}
                            indented
                            selected={isOpen(ORDER_POPOVER)}
                            onLayout={trackRow("sideOrder")}
                            below={!anchoredPanels && isOpen(ORDER_POPOVER) ? orderSelector("inline") : null}
                            testID="execution-sheet-row-order"
                          >
                            <ValuePill
                              value={t.sideOrders[effective.sideOrder]}
                              accessibilityLabel={`${t.sideOrder}, ${t.sideOrders[effective.sideOrder]}`}
                              expanded={isOpen(ORDER_POPOVER)}
                              onPress={() => toggle(ORDER_POPOVER)}
                              testID="execution-sheet-order-value"
                            />
                          </Row>
                        </>
                      ) : null}
                      <Separator indented />
                      <Row
                        label={t.sideRecovery}
                        indented
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
                  <Separator />

                  {/* Bip : premier niveau, immédiatement avant le total applicable, sinon avant Compte à rebours. */}
                  <Row label={t.beep} selected={isOpen(stepperSurface("beep"))} testID="execution-sheet-row-beep">
                    {stepperField("beep", t.beep, {
                      value: draft.cadenceBeepIntervalSeconds,
                      min: EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.min,
                      max: EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.max,
                      policy: EXECUTION_UNIT_HOLD_POLICY,
                      formatValue: beepLabel,
                      onChange: (value) => update(setCadenceBeep(draft, value)),
                      accessibilityLabel: `${t.beep}, ${t.secondsUnit}`,
                      testID: "execution-sheet-beep",
                    })}
                  </Row>

                  {totalNature !== null ? (
                    <>
                      <Separator />
                      <Row
                        label={totalNature === "estimated" ? t.totalEstimated : t.total}
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
                            accessibilityLabel={`${t.totalEditAccessibilityLabel}, ${totalText}`}
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
                  ) : null}
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
                </SheetMotionView>
                {panelRoom > 0 ? <View style={{ height: panelRoom }} testID="execution-sheet-panel-room" /> : null}
                {panel}
                </Pressable>
              </SheetMotionScrollView>
            </SheetMotionView>
          </SheetMotionProvider>
        </Animated.View>
      </View>
    </Modal>
  );
}

function VariableTable({
  draft,
  mode,
  formatTarget,
  invalidRows,
  stepRuleFor,
  selectorRow,
  onOpenSelector,
  onRemove,
  removalActive,
  onDraft,
  inlineSelector,
  onTableLayout,
  onRowLayout,
  onTargetCellLayout,
  onMove,
  onDraggingChange,
}: {
  draft: ExecutionSheetDraft;
  mode: ExecutionMode | null;
  formatTarget: (value: number | null) => string;
  invalidRows: ReadonlyMap<number, string>;
  /** Story 3.6 (AD-16) : règle de pas des ± d'une cellule de Cible (`stepTarget` du domaine). */
  stepRuleFor: (target: SeriesTarget) => InlineStepperProps["stepRule"];
  /** Story 3.6 : identité de la ligne dont le Sélecteur est ouvert, sinon `null`. */
  selectorRow: number | null;
  onOpenSelector: (row: number) => void;
  onRemove: (row: number) => void;
  /** Story 3.6 (T18, T23) : la croix retire ; sinon son appui range d'abord l'outil ouvert. */
  removalActive: boolean;
  onDraft: (next: ExecutionSheetDraft) => void;
  /** Q41 : Android et web — Sélecteur de la cellule rendu en ligne, sous sa ligne. */
  inlineSelector: { readonly row: number; readonly wheel: ReactNode } | null;
  onTableLayout: (box: TableBox) => void;
  onRowLayout: (row: number, box: Box) => void;
  onTargetCellLayout: (row: number, box: CellBox) => void;
  onMove: (from: number, to: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const rows = draft.rows;
  // Recette 2 (T-15, demande de Hermann) : repère d’insertion pendant le glisser.
  const [drag, setDrag] = useState<{ readonly from: number; readonly to: number } | null>(null);
  const guideBefore = drag === null || drag.to === drag.from ? null : drag.to < drag.from ? drag.to : drag.to + 1;
  function handleDrag(next: { readonly from: number; readonly to: number } | null) {
    setDrag(next);
    onDraggingChange(next !== null);
  }
  const hasTarget = mode === "DURATION" || mode === "REPETITIONS";
  return (
    // Q39 : la hauteur du tableau suit les lignes en glissant. Q41 : le tableau et
    // chaque ligne ajoutée ou retirée (N change) sont révélés par le bas, sans fondu.
    // Les lignes ne portent PAS de transition de place : le déplacement par glisser
    // reste celui de `DraggableRow`, sans seconde animation après la dépose ; pendant
    // un glisser, la découpe est levée pour que la ligne portée suive le doigt.
    <SheetMotionView
      enter={false}
      clip={drag === null}
      style={styles.table}
      onLayout={(event) => {
        const { y, width } = event.nativeEvent.layout;
        onTableLayout({ y, width });
      }}
      testID="execution-sheet-table"
    >
      {/* E-20 : à l'apparition du tableau, ses lignes ne se révèlent pas séparément. */}
      <SheetMotionGroupMount>
      <View style={styles.tableHeader}>
        <View style={styles.rowNumberColumn} />
        {hasTarget ? <Text style={styles.columnHeader}>{t.columns[mode]}</Text> : <View style={styles.flex} />}
        <Text style={styles.columnHeader}>{t.columns.pause}</Text>
        {/* Story 3.6 : place de la colonne des croix de retrait. */}
        <View style={styles.removeColumn} />
      </View>
      {rows.map((row, index) => {
        // Identité de la ligne (AD-2), jamais son rang : sans identité (Brouillon incohérent),
        // la ligne reste affichée et réglable, mais sans Sélecteur ni croix, qui la désignent.
        const rowId = tableRowIdentity(draft.rowIds, index);
        const number = index + 1;
        // Story 3.6 (FR-06-05, AC1) : « à l’échec » pour une Cible à l'échec, sinon la valeur ou « — ».
        const targetText = (value: number | null) => (row.target.kind === "FAILURE" ? t.failureTarget : formatTarget(value));
        return (
          <Fragment key={rowId === null ? `rank-${index}` : `row-${rowId}`}>
            {guideBefore === index ? <InsertionGuide before={number} /> : null}
            <SheetMotionView
              transition={false}
              clip={drag === null}
              // AC13 : la marge du groupe porte la zone tactile de la poignée et de la croix.
              bleed={GROUP_PADDING}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                if (rowId !== null) onRowLayout(rowId, { y, height });
              }}
              testID={`execution-sheet-table-row-${number}-motion`}
            >
              <DraggableRow index={index} count={rows.length} onMove={(to) => onMove(index, to)} onDrag={handleDrag}>
                {hasTarget ? (
                  // Story 3.6 (Q44) : ± permanents conservés ; la valeur ouvre le Sélecteur de la
                  // ligne (FR-10-03) ; règle du pas du domaine (`stepTarget`, Q13, Q26).
                  <View
                    onLayout={(event) => {
                      if (rowId !== null) onTargetCellLayout(rowId, event.nativeEvent.layout);
                    }}
                    testID={`execution-sheet-table-row-${number}-target-cell`}
                  >
                    <InlineStepper
                      value={targetNumber(row.target)}
                      min={mode === "DURATION" ? EXECUTION_BOUNDS.durationTarget.min : EXECUTION_BOUNDS.repetitionTarget.min}
                      max={mode === "DURATION" ? EXECUTION_BOUNDS.durationTarget.max : EXECUTION_BOUNDS.repetitionTarget.max}
                      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                      formatValue={targetText}
                      // Story 3.8 (AC2) : une Cible « — » est annoncée « aucune valeur », jamais « tiret ».
                      spokenValue={(value) => spokenValue(targetText(value))}
                      announceLimits
                      onChange={(value) => onDraft(setRowTarget(draft, index, numberTarget(value)))}
                      accessibilityLabel={t.rowTarget.replace("{n}", String(number)).replace("{field}", t.columns[mode])}
                      width={TABLE_STEPPER_WIDTH}
                      invalid={invalidRows.has(index)}
                      invalidHint={invalidRows.get(index)}
                      stepRule={stepRuleFor(row.target)}
                      onValuePress={rowId === null ? undefined : () => onOpenSelector(rowId)}
                      testID={`execution-sheet-table-row-${number}-target`}
                    />
                  </View>
                ) : (
                  <View style={styles.flex} />
                )}
                <InlineStepper
                  value={row.pauseSeconds}
                  min={EXECUTION_BOUNDS.pauseSeconds.min}
                  max={EXECUTION_BOUNDS.pauseSeconds.max}
                  policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                  formatValue={pauseLabel}
                  // Story 3.8 (AC2) : « — » (`pauseLabel(null)`) jamais annoncé ; limites annoncées.
                  spokenValue={(value) => spokenValue(pauseLabel(value))}
                  announceLimits
                  onChange={(value) => onDraft(setRowPause(draft, index, value))}
                  accessibilityLabel={t.rowPause.replace("{n}", String(number))}
                  width={TABLE_STEPPER_WIDTH}
                  testID={`execution-sheet-table-row-${number}-pause`}
                />
                <RemoveRowButton
                  number={number}
                  disabled={rows.length <= 1 || rowId === null}
                  active={removalActive}
                  onPress={() => {
                    if (rowId !== null) onRemove(rowId);
                  }}
                  testID={`execution-sheet-table-row-${number}-remove`}
                />
              </DraggableRow>
              {inlineSelector !== null && rowId !== null && inlineSelector.row === rowId ? (
                <SheetMotionView style={styles.inlineControl} testID="execution-sheet-cell-wheel">
                  {inlineSelector.wheel}
                </SheetMotionView>
              ) : null}
            </SheetMotionView>
          </Fragment>
        );
      })}
      {guideBefore === rows.length ? <InsertionGuide before={rows.length + 1} /> : null}
      </SheetMotionGroupMount>
    </SheetMotionView>
  );
}

/**
 * Story 3.6 (FR-12-05, AC9, AC13 ; maître `8129:31604`) — croix de retrait d'une ligne :
 * disque 28 (`#FCFCFE`, liseré blanc), croix bleu Kodjo, portée à 44 par `hitSlop`.
 * Indisponible à N = 1. Son effet (retrait, ou rangement de l'outil ouvert) est décidé
 * par la Feuille (T18, T23) ; non active (`active` faux), elle annonce qu'un appui ferme
 * d'abord le champ ouvert, au lieu d'un retrait.
 */
function RemoveRowButton({
  number,
  disabled,
  active,
  onPress,
  testID,
}: {
  number: number;
  disabled: boolean;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t.removeRow.replace("{n}", String(number))}
      accessibilityHint={active || disabled ? undefined : t.removeRowClosesFieldHint}
      accessibilityState={{ disabled }}
      hitSlop={REMOVE_HIT_SLOP}
      style={[styles.removeDisc, disabled ? styles.unselected : null]}
      testID={testID}
    >
      <KodjoIcon name="wheel-action-cancel" tintColor={colors.primary} />
    </Pressable>
  );
}
/**
 * Ligne du tableau : poignée de glisser (geste vertical, destination bornée)
 * + numéro aligné à droite. La poignée expose aussi les actions accessibles
 * Monter / Descendre, qui produisent exactement le même déplacement métier.
 */
function DraggableRow({
  index,
  count,
  onMove,
  onDrag,
  children,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onDrag: (state: { readonly from: number; readonly to: number } | null) => void;
  children: ReactNode;
}) {
  const number = index + 1;
  // Même mécanique que la Composition : responder natif + état de translation, sans bibliothèque.
  // Le renderer recycle l'événement du responder (`nativeEvent` remis à null
  // après le gestionnaire) : la position est lue de façon synchrone, jamais
  // dans une mise à jour d'état différée (recette 1, F-01).
  const [dragDy, setDragDy] = useState<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const actions = [
    ...(index > 0 ? [{ name: "moveUp", label: t.moveUp.replace("{n}", String(number)) }] : []),
    ...(index < count - 1 ? [{ name: "moveDown", label: t.moveDown.replace("{n}", String(number)) }] : []),
  ];
  return (
    <View
      style={[styles.tableRow, dragDy !== null ? { transform: [{ translateY: dragDy }] } : null]}
      testID={`execution-sheet-table-row-${number}`}
    >
      <View style={styles.rowNumberColumn}>
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(event) => {
            startYRef.current = event.nativeEvent.pageY;
            setDragDy(0);
            onDrag({ from: index, to: index });
          }}
          onResponderMove={(event) => {
            const startY = startYRef.current;
            if (startY === null) return;
            const dy = event.nativeEvent.pageY - startY;
            setDragDy(dy);
            onDrag({ from: index, to: dragDestination(index, dy, TABLE_ROW_HEIGHT, count) });
          }}
          onResponderRelease={(event) => {
            const startY = startYRef.current;
            const dy = startY === null ? 0 : event.nativeEvent.pageY - startY;
            startYRef.current = null;
            setDragDy(null);
            onDrag(null);
            const to = dragDestination(index, dy, TABLE_ROW_HEIGHT, count);
            if (to !== index) onMove(to);
          }}
          onResponderTerminate={() => {
            startYRef.current = null;
            setDragDy(null);
            onDrag(null);
          }}
          accessible
          accessibilityLabel={t.moveHandle.replace("{n}", String(number))}
          accessibilityActions={actions}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "moveUp") onMove(index - 1);
            if (event.nativeEvent.actionName === "moveDown") onMove(index + 1);
          }}
          // AC13 : poignée dessinée 12 × 18, cible tactile 44 × 44.
          hitSlop={HANDLE_HIT_SLOP}
          style={styles.dragHandle}
          testID={`execution-sheet-table-row-${number}-handle`}
        >
          {[0, 1, 2].map((line) => (
            <View key={line} style={styles.dragDotsLine}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          ))}
        </View>
        <Text style={styles.rowNumber} accessibilityLabel={t.row.replace("{n}", String(number))}>
          {number}
        </Text>
      </View>
      {children}
    </View>
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
 */
function Row({
  label,
  indented = false,
  selected = false,
  longLabel = false,
  below = null,
  onLayout,
  accessibilityLabel,
  children,
  testID,
}: {
  label: string;
  indented?: boolean;
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
  return (
    <SheetMotionView bleed={GROUP_PADDING} onLayout={onLayout} style={indented ? styles.indented : null} testID={testID}>
      <View
        pointerEvents="none"
        style={[styles.selectionBackground, selected ? styles.selectionBackgroundSelected : null]}
        testID={`${testID}-selection`}
      />
      <View style={styles.row} {...grouped} testID={`${testID}-line`}>
        <Text style={[styles.label, longLabel ? styles.longLabel : null]}>{label}</Text>
        {children}
      </View>
      {below}
    </SheetMotionView>
  );
}

/** Appui absorbé sans effet (pastille non modifiable). */
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
    // Story 3.3 : une pastille non modifiable (Régime à N = 1) reste un élément tactile qui
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
  const fieldRef = useRef<View>(null);
  const toggleRef = useRef<View>(null);
  // Fermeture demandée par l'action accessible du champ : le focus revient à la valeur (H13).
  const closedByAccessibilityRef = useRef(false);
  useEffect(() => {
    // VoiceOver : le bouton touché est démonté à l'ouverture ; le focus passe au champ ouvert.
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
    <View
      ref={fieldRef}
      onStartShouldSetResponder={() => true}
      // Ranger le champ sans toucher l'extérieur : geste d'échappement, Magic Tap ou action
      // nommée « Fermer » (lexique).
      accessibilityActions={[{ name: "escape" }, { name: "magicTap" }, { name: "close", label: t.closeField }]}
      onAccessibilityAction={(event) => {
        if (["escape", "magicTap", "close"].includes(event.nativeEvent.actionName)) closeFromAccessibility();
      }}
      onAccessibilityEscape={closeFromAccessibility}
      onMagicTap={closeFromAccessibility}
      style={[styles.stepperFrame, frame]}
      testID={`${stepper.testID}-field`}
    >
      {/* Story 3.8 (AC2) : limites annoncées ; un « — » éventuel annoncé « aucune valeur ». */}
      <InlineStepper {...stepper} announceLimits spokenValue={(value) => spokenValue(stepper.formatValue(value))} />
    </View>
  );
}


/** Q40 : `hidden` garde la place du séparateur, rendu transparent (groupe sélectionné). */
function Separator({ indented = false, hidden = false }: { indented?: boolean; hidden?: boolean }) {
  return (
    <SheetMotionView
      style={[styles.separator, indented ? styles.separatorIndented : null, hidden ? styles.separatorHidden : null]}
    />
  );
}

/**
 * Géométrie de référence (402) : groupe à x24 (354), lignes de premier niveau
 * à x36 (séparateur 330), lignes indentées à x52 (séparateur 314) — traduites
 * en marges relatives pour 360/440.
 */
const GROUP_PADDING = 12;
const INDENT = 16;

const styles = StyleSheet.create({
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
  group: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: fixedRadii[12],
    paddingHorizontal: GROUP_PADDING,
    paddingVertical: spacing[4],
  },
  // DSF Séries variables : ligne « Séries » (story 3.3) + tableau. Q40 (Hermann, 2026-10-17, E-14)
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
  // Q41 : habillage du panneau sans flèche des segmentés (iOS) — fond, rayon et
  // ombre de la surface de la roue (`DurationWheelPicker`), pour un panneau flottant.
  selectorPanel: {
    backgroundColor: colors.background,
    borderRadius: fixedRadii[12],
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  indented: {
    marginLeft: INDENT,
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
  // Story 3.3 : champ de Régime et chevron, juste après le libellé `Séries`.
  regimeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  // AD-11 : élément sans effet (Régime à N = 1, P16).
  unselected: {
    opacity: UNSELECTED_OPACITY,
  },
  label: {
    ...type.label,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  // DSF : « Pause entre les côtés » sur deux lignes, largeur 180 à 402.
  longLabel: {
    maxWidth: 180,
  },
  spacer: {
    flex: 1,
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
  separatorIndented: {
    marginLeft: INDENT,
  },
  separatorHidden: {
    backgroundColor: "transparent",
  },
  inlineControl: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },

  // DSF : message temporaire sous la ligne concernée, à 4 pt ; fond snackbar, rayon 16.
  // Recette 2 (T-58) : la capsule Annuler s’étire sur la hauteur intérieure, avec
  // des marges droite, haute et basse égales (ADJUSTMENT_ACTION_INSET).
  adjustment: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.snackbar,
    borderRadius: fixedRadii[16],
    paddingVertical: ADJUSTMENT_ACTION_INSET,
    paddingRight: ADJUSTMENT_ACTION_INSET,
    paddingLeft: spacing[16],
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[12],
  },
  adjustmentText: {
    ...type.body,
    color: colors.background,
    flex: 1,
    alignSelf: "center",
    paddingVertical: spacing[2],
  },
  adjustmentAction: {
    ...type.button,
    color: colors.background,
  },
  // D-5 précisé par la recette 2 (T-58) : capsule sans contour, blanc transparent
  // à 90 %, extrémités en demi-cercle, plus grande.
  adjustmentActionFrame: {
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[16],
    borderRadius: 999,
    backgroundColor: colors.snackbarActionSurface,
  },
  // Story 3.6 (AC1) : sans retrait x52 (Q44 : la place libérée loge la croix de retrait).
  table: {
    paddingBottom: spacing[8],
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: TABLE_COLUMN_GAP,
    paddingVertical: spacing[4],
  },
  columnHeader: {
    ...type.supporting,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
    textAlign: "center",
  },
  // Story 3.6 : colonne des croix (en-tête vide de même largeur que la croix).
  removeColumn: {
    width: TABLE_REMOVE_DISC,
  },
  // Story 3.6 (`8129:31604`) : disque 28 `#FCFCFE` à liseré blanc, croix centrée.
  removeDisc: {
    width: TABLE_REMOVE_DISC,
    height: TABLE_REMOVE_DISC,
    borderRadius: TABLE_REMOVE_DISC / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.parametersSegmentedOption,
    borderWidth: 1,
    borderColor: colors.background,
  },
  insertionGuideSlot: {
    height: 0,
    zIndex: 2,
  },
  insertionGuideLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: TABLE_ROW_HEIGHT,
    gap: TABLE_COLUMN_GAP,
  },
  rowNumberColumn: {
    width: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  dragHandle: {
    width: 12,
    height: 18,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  dragDotsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textSecondary,
  },
  rowNumber: {
    ...type.label,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
});
