import { Button as SwiftUIButton, Host, Image as SwiftUIImage, Menu, RNHostView, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as swiftUIAccessibilityLabel, accessibilityValue as swiftUIAccessibilityValue } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  type StyleProp,
  type ViewStyle,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Reanimated, {
  Easing as ReanimatedEasing,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type LayoutAnimation,
} from "react-native-reanimated";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";
import type { Movement } from "@/domain/activities/Movement";
import {
  answerBounds,
  appendModelToDraft,
  basePause,
  buildModelElements,
  executionOptions,
  showsExecution,
  allowedModes,
  lastRepetitionsLocked,
  maxLocked,
  emomDurationOverflow,
  hasRequiredRoles,
  initialAnswers,
  initialMovementValues,
  isFormatModelKey,
  modelDuration,
  roleSwitches,
  summaryIssues,
  forTimeBlockSeries,
  forTimeInSequence,
  movementRole,
  deathByFirstRankWarning,
  supersetRecovery,
  withAnswer,
  withMovementMode,
  withSeriesValue,
  withUnitToChoose,
  UNIT_CHOICE_AT_ADD,
  type FormatModelKey,
  type ModelAnswerKey,
  type ModelAnswers,
  type ModelExecution,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit, sheetValuesOf, type ModelReeditState } from "@/domain/sessions/formatReedit";
import { circuitRoleOf } from "@/domain/sessions/formats";
import { seriesCountOf } from "@/domain/sessions/forTimeSeries";
import { createEmptyDraft } from "@/domain/sessions/SessionDraft";
import type { ExecutionMode, ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { formatSheetContextOf, quickFormatOf, seriesWordingOf } from "@/features/sessions/formatSheetContext";
import { formatModelName } from "@/features/sessions/carrierPresentation";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { modelTimeline, type Timeline, type TimelineBlock } from "@/domain/sessions/formatTimeline";
import { currentLayout } from "@/domain/sessions/layoutOperations";
import { structureCircuits } from "@/domain/sessions/structure";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { EMPTY_MOVEMENT_FILTERS, visibleMovementItems, type MovementCatalogueFilters, type MovementCatalogueItem } from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SelectedMovementCard } from "@/features/activities/SelectedMovementCard";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { closeCreationModals } from "@/features/sessions/creationNavigation";
import { useFormatModelDraft } from "@/features/sessions/FormatModelDraftContext";
import {
  ChargeValue,
  TABLE_LAYOUT,
  TableCell,
  cellKey,
  formatLoad,
  formatPrimeDuration,
  parseCellKey,
  signedText,
  tableCellOrder,
  valueText,
  type CellBinding,
} from "@/features/sessions/FormatTables";
import { FormatModelIllustration, formatModelColors } from "@/features/sessions/FormatsWindow";
import { DimensionBlock, DimensionCell, DimensionText, ForTimeBlocks, FormatBlocks, SeriesBlock, type BlockRow, type RowKit, type SeriesAccess } from "@/features/sessions/ForTimeBlocks";
import { withoutPinned } from "@/features/sessions/formatCatalogueSelection";
import { exerciseOfMovement, inheritsCircuitSeriesCount, takeMovementsHandedToFormat, type MovementExerciseDefaults } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { pluralOf } from "@/shared/i18n/plural";
import { CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { ModalValidateAction } from "@/shared/ui/ModalHeaderActions";
import { KodjoIcon, preloadKodjoIcons, whenKodjoIconsReady, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { MOTION_FADE_DURATION_MS } from "@/features/sessions/compositionMotion";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { colors as tokenColors, dimensions, minTouchTarget, switchOffColors } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-9 C.3 — questionnaire et récapitulatif d'un modèle de la fenêtre Formats (référence Formats du
 * 02/11/2026 §7, §9 à §12, §15 ; CE-FMT-02 ; Figma \`8624:29980\` et suivants, lecture seule).
 *
 * - **Questionnaire** (\`stage="questionnaire"\`) : croix de fermeture (retour à la Composition, rien
 *   ajouté) ; zone de contexte (couleur, motif, nom, accroche) ; « Mouvements » avec « + Ajouter » — un
 *   appui ouvre un champ de saisie sous le titre et transforme le lien en « Ouvrir le catalogue » ; les
 *   suggestions du Catalogue s'affichent en cartes « Mouvement sélectionné » (variante sans suppression) ;
 *   quitter le champ vide le referme ; le Catalogue reprend le texte saisi. Paramètres indépendants des
 *   mouvements, Déroulé générique, « Enregistrer dans la séance ». Choisir des mouvements ouvre le
 *   récapitulatif.
 * - **Récapitulatif** (\`stage="summary"\`) : bouton Retour vers le questionnaire du même modèle, réponses
 *   conservées, titre inchangé ; cartes des mouvements (suppression par glissement, dernier mouvement de
 *   boucle protégé) ; tableaux du modèle (AMRAP : Rép. / Par tour / Max ; For time : tours ; Progression :
 *   séries, répétitions et charges en saisie directe) ; Déroulé calculé ; « Enregistrer dans la séance ».
 * - **Enregistrer dans la séance** ajoute la structure au brouillon de Composition, puis revient à la
 *   Composition ; la Séance n'est sauvegardée que depuis la Composition.
 *
 * Mise à jour consolidée du 04/11/2026 (§1, §2, §2 bis ; référence Formats §7) : questionnaire et récapitulatif
 * sont une **modale sur la Composition** (par le bas, pleine largeur, sous le titre de la Composition à y = 95 de
 * l'écran de référence, coins hauts 24, voile), sans nom de Séance. Une seule route : l'étape change sur place —
 * « Valider les paramètres » ouvre le récapitulatif de **tous** les modèles, Retour revient au questionnaire,
 * réponses conservées ; « Enregistrer dans la séance » n'appartient qu'au récapitulatif. [Écran plein, champ du
 * nom de Séance et enregistrement depuis le questionnaire des modèles sans tableau — remplacés.] Accroche en
 * « Mali Medium Italic » 14/20 centrée (écart de police de C.3 levé).
 */

const t = () => strings.screens.formatModel;

/** D-572 (Hermann, 25/11/2026 ; Formats § 9.9) : 5 mouvements au plus par format, toutes sections comprises. */
export const MAX_FORMAT_MOVEMENTS = 5;
/**
 * D-572 : zone figée du catalogue en modification plafonnée à environ 40 % de la hauteur, défilement interne ; marge sous sa dernière
 * carte (écart des cartes de la liste).
 */
export const PINNED_ZONE_MAX_RATIO = 0.4;
const PINNED_ZONE_BOTTOM_MARGIN = 8;
type SectionRole = "LOOP" | "BUY_IN" | "BUY_OUT";
/** Section d'un mouvement choisi : Buy-in, Buy-out, sinon Mouvements (ou En boucle). */
const sectionRoleOf = (item: ModelMovement): SectionRole => (item.buyIn === true ? "BUY_IN" : item.buyOut === true ? "BUY_OUT" : "LOOP");

const VALUE_COLOR = "#0508E5";
const PANEL = "#F9FAFC";
const SEPARATOR = "#E0E3E8";
const LABEL = "#141414";
const SECTION = "#595E66";
/** Invite de la recherche du mode catalogue, gris clair (demande de Hermann du 05/11/2026, soir). */
const SEARCH_PLACEHOLDER = "#B4B8C2";
const TAGLINE = "#5C636E";
const RECOVERY_BLOCK = "#D9DBE0";
const BUY_IN_BLOCK = "#7984C7";
const CHIP = "#5F60EE";
/**
 * Zone de contexte (zone colorée) — demande de Hermann du 05/11/2026 (« il faut remonter un le bord bas de la zone colorée, et
 * laisser la ligne Mouvement à sa place (en dimension absolue) ») : 101 au lieu de 109 ; la ligne « Mouvements » reste à 109 + 8.
 */
const CONTEXT_HEIGHT = 101;
/**
 * Écart entre deux cartes de mouvement ; pas de déplacement par défaut (carte 60 + écart) avant mesure. Complément du
 * 5 novembre 2026 (Hermann), §19 : 6 (au lieu de 8).
 */
const CARD_GAP = 6;
/**
 * Complément du 5 novembre 2026 (Hermann), §19 : la ligne « Mouvements » (titre et « + Ajouter ») descend de 8 — elle empiétait
 * sur le bas de la zone de contexte (illustration et accroche). Hors mode catalogue (en-tête et recherche dans la zone figée).
 */
const MOVEMENTS_TOP_OFFSET = 8 + 8;
/**
 * Fond de la zone de recherche du mode catalogue — recette du 06/11/2026 (t-recherche, Hermann : « qui part du bas de la zone de contexte
 * jusqu'en bas de la zone de recherche a un fond transparent, on voit les cartes défiler derrière. IL faut un fond blanc totalement opaque,
 * et dégressif vers le transparent entre le bas de la zone de recherche et une marge de 8 px par exemple ») : blanc opaque du bas de la
 * zone de contexte au bas de la recherche, puis fondu vers le transparent sur 8 (bandes successives, sans bibliothèque de dégradé).
 * [Demande du 05/11/2026 : « blanc avec opacité de 65% en haut jusqu'à 10% en bas de son cadre » — remplacée.]
 */
const SEARCH_ZONE_FADE = 8;
const SEARCH_ZONE_FADE_LAYERS = Array.from({ length: SEARCH_ZONE_FADE }, (_, index) => ({
  top: index,
  opacity: Number((1 - (index + 0.5) / SEARCH_ZONE_FADE).toFixed(4)),
}));
/** Complément du 5 novembre 2026 (Hermann), §18–§19 : plus de bouton en bas ; marge sous le Déroulé, au-dessus de la zone sûre. */
const CONTENT_BOTTOM_MARGIN = 24;
/** Pile repliée du mode catalogue : décalage vertical et retrait latéral de chaque feuille (Catalogue des mouvements). */
const PILE_LEAF_STEP = 6;
const PILE_LEAF_INSET = 8;
/**
 * Recette iPhone du 07/11/2026 (Hermann, remarques D et E : « Afficher la liste des mouvements de manière progressive (la c'est une
 * apparition brute) » ; « appuyer sur le filet de la pile : replier et déplier les mouvements lentement avec un glissement des
 * cartes » ; « "Fermer sans sélectionner", "Ajouter X mouvement", "Revenir aux paramètres" : La fermeture doit se faire en fondu
 * progressif lent. ») : fondus et glissements du mode catalogue à la durée de fondu du projet (`MOTION_FADE_DURATION_MS`,
 * 450 ms), courbes du Catalogue des mouvements ; aucune animation sous « Réduire les animations ».
 */
const CATALOGUE_MOTION_MS = MOTION_FADE_DURATION_MS;
/**
 * Recette iPhone du 08/11/2026 (b-cat-fondu : « puis arrivent les zones corporelles bien après ») : icônes des cartes du mode
 * catalogue, préchargées en image native à l'ouverture du Format ; le fondu d'apparition les attend au plus 300 ms (préchargement
 * normalement terminé bien avant « + Ajouter » ; l'attente maximale évite tout blocage si le chargement échoue).
 */
const CATALOGUE_ICONS: readonly KodjoIconName[] = ["card-body-zone-badge"];
const CATALOGUE_ICON_WAIT_MS = 300;
const CATALOGUE_FADE_TIMING = { duration: CATALOGUE_MOTION_MS, easing: ReanimatedEasing.bezier(0.4, 0, 0.2, 1), reduceMotion: ReduceMotion.System };
const CATALOGUE_SLIDE_TIMING = { duration: CATALOGUE_MOTION_MS, easing: ReanimatedEasing.bezier(0.33, 1, 0.68, 1), reduceMotion: ReduceMotion.System };
const catalogueLayoutTransition = LinearTransition.duration(CATALOGUE_MOTION_MS)
  .easing(ReanimatedEasing.bezier(0.33, 1, 0.68, 1))
  .reduceMotion(ReduceMotion.System);
/** Carte du mode catalogue ; `onPress` remplace la sélection (carte du dessus d'une pile repliée, qui la déplie). */
type CatalogueCard = (entry: MovementCatalogueEntry, onPress?: () => void) => React.ReactNode;
/** Pas d'une carte de pile (carte de 52 et écart de 8, `styles.family`) : un membre glisse depuis la carte du dessus. */
const PILE_MEMBER_STEP = 52 + 8;
function pileMemberEntering(offset: number) {
  return (): LayoutAnimation => {
    "worklet";
    return {
      initialValues: { transform: [{ translateY: offset }] },
      animations: { transform: [{ translateY: withTiming(0, CATALOGUE_SLIDE_TIMING) }] },
    };
  };
}
function pileMemberExiting(offset: number) {
  return (): LayoutAnimation => {
    "worklet";
    return {
      initialValues: { transform: [{ translateY: 0 }] },
      animations: { transform: [{ translateY: withTiming(offset, CATALOGUE_SLIDE_TIMING) }] },
    };
  };
}
/** Au repli, l'épaisseur de la pile (feuilles) n'apparaît qu'une fois les cartes rentrées (modèle du Catalogue des mouvements). */
function pileLeafEntering(): LayoutAnimation {
  "worklet";
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withDelay((CATALOGUE_MOTION_MS * 2) / 3, withTiming(1, { duration: CATALOGUE_MOTION_MS / 3 })) },
  };
}
/** Barre Précédent / Suivant / Fermer des tableaux : hauteur avant mesure ; marge de révélation d'une cellule. */
const KEYBOARD_BAR_HEIGHT = 52;
const CELL_REVEAL_MARGIN = 12;
/** Tableau de la Progression : zone protégée des noms, colonne d'une série, hauteurs des lignes (une ou deux cellules). */

/**
 * Cadre du clavier (haut, en coordonnées de la fenêtre), `null` clavier fermé — événements `Keyboard` standards,
 * comme la feuille des paramètres d'exécution (`useSheetKeyboard`).
 */
function useKeyboardFrame(): KeyboardFrame | null {
  const [frame, setFrame] = useState<KeyboardFrame | null>(null);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      setFrame({ screenY: event.endCoordinates.screenY, duration: event.duration ?? 0 }),
    );
    const change = ios
      ? Keyboard.addListener("keyboardWillChangeFrame", (event) =>
          setFrame((current) => (current === null ? current : { screenY: event.endCoordinates.screenY, duration: event.duration ?? 0 })),
        )
      : null;
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setFrame(null));
    return () => {
      show.remove();
      change?.remove();
      hide.remove();
    };
  }, []);
  return frame;
}


function formatSeconds(seconds: number): string {
  return formatPhraseDuration(Math.max(0, Math.round(seconds)));
}

/**
 * Durée totale du modèle, exacte — recette iPhone n° 3 du 02/11/2026 (f3-tabata : « 8 min 45 » affiché,
 * arrondi au quart de minute de la Composition) : le questionnaire affiche la durée calculée sans arrondi
 * (référence Formats §9.1, FMT-12 : Tabata À la suite « 8 min 50 s »). « ≥ » pour une borne minimale.
 */
function modelDurationText(duration: SessionDurationResult, format: (seconds: number) => string = formatSeconds): string {
  const text = format(Number.isFinite(duration.seconds) ? duration.seconds : 0);
  return duration.kind === "lowerBound" ? `${strings.shared.durationNature.lowerBoundPrefix}${text}` : text;
}

/** Case de saisie d'une ligne de paramètres (clé partagée avec les cases des tableaux pour Précédent / Suivant). */
const ANSWER_FIELD_PREFIX = "ans-";
function answerFieldKey(id: ModelAnswerKey): string {
  return `${ANSWER_FIELD_PREFIX}${id}`;
}

const SECONDS_KEYS: ReadonlySet<ModelAnswerKey> = new Set([
  "workSeconds",
  "pauseSeconds",
  "intervalSeconds",
  "durationSeconds",
  "restBetweenBlocksSeconds",
  "loopRestSeconds",
  "timeCapSeconds",
  "restBetweenRoundsSeconds",
  "recoveryBetweenSeconds",
]);

/** Nuance d'un mouvement dans le Déroulé : la bande du modèle, éclaircie pour les suivants (§15 règle 4). */
function movementShade(band: string, index: number): string {
  const amount = Math.min(0.6, index * 0.32);
  const hex = band.replace("#", "");
  const channel = (at: number) => parseInt(hex.slice(at, at + 2), 16);
  const mix = (value: number) => Math.round(value + (255 - value) * amount);
  // Bande foncie pour le premier mouvement (contraste sur le cadre clair).
  const darken = (value: number) => Math.round(value * 0.9);
  const [r, g, b] = [channel(0), channel(2), channel(4)].map((value) => (index === 0 ? darken(value) : mix(darken(value))));
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------------------------------------------------------
// Ligne de paramètre
// ---------------------------------------------------------------------------

/**
 * Cadre de lignes de paramètres. Remarque B du 06/11/2026 (Hermann : « récapitulatif : supprimer la barre horizontale d'un cadre si
 * elle existe (ex. après nombre de séries tout seul) ») : quelle que soit la dernière ligne d'un cadre, son trait est masqué (le
 * contenu déborde d'un point sous le cadre, qui le rogne).
 */
function Panel({
  children,
  style,
  testID,
  summary = false,
  forTime = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  summary?: boolean;
  /**
   * For time — carte des paramètres (décision de Hermann du 15/11/2026 ; demande du 15/11/2026 : « le premier cadre des paramètres
   * d'exécution prend aussi toute la largeur » ; Figma `12341:27052`) : pleine largeur sans marge ni rayon, comme les trois blocs ;
   * retrait de 12, lignes de 31 (contrôles de 24), marges haute et basse de 4 (CE-FMT-02 §8, cotes).
   */
  forTime?: boolean;
}) {
  return (
    <View style={[styles.panel, forTime ? styles.panelForTime : null, style]} testID={testID}>
      <SummaryRowsContext.Provider value={forTime ? "forTime" : summary}>
        <View style={styles.panelContent}>{children}</View>
      </SummaryRowsContext.Provider>
    </View>
  );
}

/**
 * Spécification de Hermann du 08/11/2026 (A §3, B §3) — cadres de paramètres du récapitulatif : lignes de 40, séparateur de 1 entre deux
 * lignes (hauteur du cadre = 40 × n + (n − 1) : « Nombre de séries » 40, « Intervalle / Durée totale / Exécution » 122), libellé à
 * y = 12, valeur centrée verticalement. Chaque ligne porte son séparateur, celui de la dernière est rogné par le cadre (`Panel`).
 * [Lignes de 34 avec 4 de marge verticale au récapitulatif — remplacées le 08/11/2026 ; questionnaire inchangé.]
 */
const SummaryRowsContext = createContext<boolean | "forTime">(false);
/** For time (Figma `12341:27052`) : lignes de 31, séparateur compris. */
const FOR_TIME_ROW_HEIGHT = 31;
const SUMMARY_ROW_HEIGHT = 40;

function Row({ label, children, last = false, testID }: { label: string; children: React.ReactNode; last?: boolean; testID?: string }) {
  const summary = useContext(SummaryRowsContext);
  return (
    <View
      style={summary === "forTime" ? [styles.row, styles.forTimeRow] : summary ? [styles.row, styles.summaryRow] : [styles.row, last ? null : styles.rowSeparated]}
      testID={testID}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Déroulé
// ---------------------------------------------------------------------------

/**
 * Blocs regroupés par intervalle commun (EMOM / Death by « dans chaque intervalle », Figma `8624:30392`) —
 * recette iPhone n° 3 du 02/11/2026 (f3-emom, Hermann : « Illustration du déroulé "Dans chaque intervalle"
 * incorrect (un seul cadre pour deux mouvements) ») : les blocs des mouvements d'un même intervalle sont
 * accolés dans un cadre unique ; les intervalles sont séparés. « … » reste isolé.
 */
function groupedBlocks(blocks: readonly TimelineBlock[], size: number): (TimelineBlock | readonly TimelineBlock[])[] {
  const result: (TimelineBlock | readonly TimelineBlock[])[] = [];
  let group: TimelineBlock[] = [];
  for (const block of blocks) {
    if (block.kind !== "WORK") {
      if (group.length > 0) result.push(group);
      group = [];
      result.push(block);
      continue;
    }
    group.push(block);
    if (group.length === size) {
      result.push(group);
      group = [];
    }
  }
  if (group.length > 0) result.push(group);
  return result;
}

function TimelineFrame({ timeline, endLabel, band, names, testID }: { timeline: Timeline; endLabel: string; band: string; names: readonly string[]; testID: string }) {
  const height = 22;
  const buyInMovements = new Set(timeline.blocks.flatMap((block) => (block.kind === "WORK" && block.buyIn === true && block.movement !== null ? [block.movement] : [])));
  const renderBlock = (block: TimelineBlock, index: number, inGroup = false) => {
    if (block.kind === "ELLIPSIS") {
      return (
        <Text key={index} style={styles.timelineEllipsis}>
          …
        </Text>
      );
    }
    if (block.kind === "REST") {
      return <View key={index} style={[styles.timelineBlock, { flex: block.weight, height, backgroundColor: RECOVERY_BLOCK }]} />;
    }
    const color = block.buyIn === true ? BUY_IN_BLOCK : movementShade(band, block.movement ?? 0);
    return (
      <View key={index} style={[styles.timelineBlock, inGroup ? styles.timelineBlockInGroup : null, { flex: block.weight, height: Math.max(8, height * block.height), backgroundColor: color }]}>
        {block.label !== null ? (
          <Text style={[styles.timelineLabel, block.buyIn === true ? styles.timelineLabelOnDark : null]} numberOfLines={1}>
            {block.label}
          </Text>
        ) : null}
      </View>
    );
  };
  return (
    <View style={styles.timeline} testID={testID}>
      <View style={[styles.timelineBlocks, timeline.continuous === true ? styles.timelineContinuous : null]} testID={timeline.continuous === true ? `${testID}-continuous` : undefined}>
        {timeline.grouped === true && names.length > 1
          ? groupedBlocks(timeline.blocks, names.length).map((item, index) =>
              Array.isArray(item) ? (
                <View
                  key={index}
                  style={[styles.timelineGroup, { flex: (item as readonly TimelineBlock[]).reduce((sum, block) => sum + (block.kind === "ELLIPSIS" ? 0 : block.weight), 0) }]}
                  testID={`${testID}-group-${index}`}
                >
                  {(item as readonly TimelineBlock[]).map((block, at) => renderBlock(block, at, true))}
                </View>
              ) : (
                renderBlock(item as TimelineBlock, index)
              ),
            )
          : timeline.blocks.map((block, index) => renderBlock(block, index))}
      </View>
      <View style={styles.timelineMarks}>
        <Text style={styles.timelineMark}>0</Text>
        <Text style={styles.timelineMark} testID={`${testID}-end`}>
          {endLabel}
        </Text>
      </View>
      {names.length > 1 || timeline.legendRecovery ? (
        <View style={styles.legend}>
          {names.map((name, index) => (
            <View key={`${name}-${index}`} style={styles.legendItem}>
              {/* Recette du 16/11/2026 (Hermann : « Déroulé (tous formats concernes) : la couleur du cadre de la légende buy In / buy out ne
                  correspond pas a celle du cadre de l'illustration ») : la pastille reprend la couleur des cadres de ce mouvement.
                  [Nuance de rang pour tout mouvement — remplacé.] */}
              <View
                style={[styles.legendSwatch, { backgroundColor: buyInMovements.has(index) ? BUY_IN_BLOCK : movementShade(band, index) }]}
                testID={`${testID}-legend-${index}`}
              />
              <Text style={styles.legendText} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
          {timeline.legendRecovery ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: RECOVERY_BLOCK }]} />
              <Text style={styles.legendText}>{t().recovery}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Écran
// ---------------------------------------------------------------------------

type Stage = "questionnaire" | "summary";

/** Haut de la modale : sous le titre de la Composition (y = 95 sur 874, mise à jour du 04/11/2026 §1). */
const MODAL_TOP = 95;

/**
 * Recette du 04/11/2026 (f4-modale, Hermann : « la zone colorée doit devenir progressivement transparente selon le même
 * format que la zone de contexte du catalogue ou de la composition de séance » ; « La zone colorée doit rester figée sur
 * l'écran ») : zone de contexte fixe, au-dessus du contenu qui défile dessous ; sous sa partie peinte, une part fondue
 * de la même couleur vers la transparence — même rampe de couches que la bande de contexte (`ContextBand`, D-224).
 */
const CONTEXT_FADE_HEIGHT = 22;
const CONTEXT_FADE_LAYERS = Array.from({ length: 12 }, (_, index) => {
  const before = index / 12;
  const after = (index + 1) / 12;
  return { height: Number((CONTEXT_FADE_HEIGHT * (1 - before)).toFixed(4)), opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)) };
});
/** Écart iOS entre la zone sûre haute et le haut d'une feuille à sa plus grande hauteur (comme la fiche du mouvement). */
const LARGE_SHEET_TOP_GAP = 10;

/**
 * ESSAI du 04/11/2026 (feuille native) : fraction de la grande hauteur de feuille qui place le haut de la feuille à
 * y = MODAL_TOP — même calcul que la fiche du mouvement (`movement-sheet`).
 */
export function useFormatSheetDetent(): number {
  const { height } = useWindowDimensions();
  const safeTop = initialWindowMetrics?.insets.top ?? 0;
  const largest = height - safeTop - LARGE_SHEET_TOP_GAP;
  return Math.min(1, Math.round(((height - MODAL_TOP) / largest) * 1000) / 1000);
}

/**
 * Modèles sans tableau de récapitulatif : enregistrés depuis leur questionnaire (recette du 04/11/2026). Décision de Hermann du
 * 05/11/2026 (« Récap si tableau ») : le principe est gardé — le Superset a désormais toujours un tableau (récapitulatif) ;
 * Tabata, 30/30, Renforcement et À l'échec n'en ont qu'à partir de deux mouvements (§15–§16 du complément) : un seul mouvement
 * s'enregistre depuis le questionnaire. [Superset sans récapitulatif — remplacé.]
 */
function savesFromQuestionnaire(model: FormatModelKey, movementCount: number): boolean {
  if (model === "TABATA" || model === "INTERVALS_30_30" || model === "HIIT" || model === "STRENGTH" || model === "UNTIL_FAILURE") return movementCount < 2;
  return false;
}

/** Compteur des ouvertures de questionnaire (identité du brouillon de modèle de chaque ouverture). */
let openings = 0;

/**
 * D-605 (Hermann, 25/11/2026 ; Formats § 9.7) : ouvert depuis la fenêtre « Formats d'entraînement », l'écran du format remplace le contenu de
 * la feuille native de cette fenêtre (`model`, `onClose`) au lieu d'une seconde feuille empilée — la modale des formats n'est plus visible
 * derrière. Sans ces props : route `/format-summary` (réouverture « Modifier le format » depuis la Composition), inchangée.
 */
type FormatModelScreenProps = {
  readonly stage: Stage;
  /** Modèle choisi dans la fenêtre Formats (sinon : paramètre de route `model`). */
  readonly model?: FormatModelKey;
  /** Croix : retour au contenu de la fenêtre Formats (sinon : retour de la pile). */
  readonly onClose?: () => void;
};

export function FormatModelScreen({ stage: initialStage, model: chosenModel, onClose }: FormatModelScreenProps) {
  // Décision de Hermann du 15/11/2026 (« Le questionnaire n’est plus nécessaire » ; registre ch07, « For time — tableau unique, sans
  // questionnaire (15/11/2026) ») : le For time n'a plus de questionnaire, il s'ouvre sur son récapitulatif (état vide).
  // Décision de Hermann du 15/11/2026 (registre ch07, « Formats à tableau — écran unique, sans redondance (15/11/2026) » ; CE-FMT-02 §4) :
  // Tabata, 30/30, Renforcement, À l'échec, Progression, EMOM, Superset, Death by et AMRAP n'ont plus de questionnaire non plus ; l'entrée
  // depuis la Composition ouvre l'écran unique du Format (création et réouverture). [Questionnaire des autres Formats — remplacé.]
  void initialStage;
  const [stage, setStage] = useState<Stage>("summary");
  // ESSAI du 04/11/2026 (feuille native iOS) : montée, descente et voile sont ceux du système.
  const leaving = useRef(false);
  const dismissWith = (then: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    Keyboard.dismiss();
    then();
  };
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ model?: string; circuitId?: string }>();
  const routeModel: FormatModelKey = chosenModel ?? (isFormatModelKey(params.model) ? params.model : "TABATA");
  const { draft: modelDraft, start, startWith, setAnswers, setMovements } = useFormatModelDraft();
  // For time (FT-3, 14/11/2026) : rang du mouvement dont la modale des paramètres est ouverte.
  const [parametersOf, setParametersOf] = useState<number | null>(null);
  const sessionDraft = useSessionDraft();
  /**
   * Mise à jour consolidée du 04/11/2026 (§6 sexies) : « Modifier le format » — récapitulatif du Modèle d'origine
   * prérempli depuis l'état actuel du Circuit (`circuitId`), relu une fois à l'ouverture ; « Enregistrer les
   * modifications » met le Circuit à jour en place ; fermer sans enregistrer ne change rien.
   */
  const [reedit] = useState<{ readonly circuitId: string; readonly opened: ModelReeditState } | null>(() => {
    const circuitId = typeof params.circuitId === "string" ? params.circuitId : null;
    // Disposition courante (y compris une Séance représentable dans l'ancien modèle à Circuit unique).
    const structure = currentLayout(sessionDraft.draft, () => "layout");
    const circuit = circuitId === null ? undefined : structureCircuits(structure).find((item) => item.id === circuitId);
    if (circuitId === null || circuit === undefined) return null;
    const exercises = circuit.exercises.flatMap((id) => sessionDraft.draft.exercises.filter((exercise) => exercise.id === id));
    return { circuitId, opened: modelStateOfCircuit(routeModel, { ...circuit, exercises }) };
  });
  // Réglages communs hétérogènes : « variable » jusqu'à une saisie explicite (§6 sexies.7).
  const [variable, setVariable] = useState<ReadonlySet<ModelAnswerKey>>(() => reedit?.opened.variable ?? new Set());
  const service = useActivityDefinitionService();
  const profileService = useContext(ProfileServiceContext);

  // Questionnaire ouvert depuis la fenêtre Formats : brouillon de modèle neuf, à chaque ouverture —
  // recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « ajouter un deuxième format ouvre le
  // questionnaire déjà validé avec ses mouvements et ses paramètres au lieu d'ouvrir un questionnaire
  // vierge »). Le retour depuis le récapitulatif ne remonte pas le questionnaire : réponses conservées.
  const [opening] = useState(() => `opening-${++openings}`);
  const fresh = modelDraft?.opening === opening;
  useEffect(() => {
    if (modelDraft?.opening === opening) return;
    // For time sans questionnaire (15/11/2026) : plus d'interrupteur « Avec charge », la charge se décide mouvement par mouvement
    // (« (+ kg) » / « (− kg) ») — les commandes locales sont toujours disponibles.
    // Formats à tableau, écran unique (15/11/2026) : de même, « (unité, ±kg) » sur chaque ligne — la charge se décide mouvement par
    // mouvement, sans interrupteur « Avec charge ». AMRAP neuf : colonne « Par tour » présente (CE-FMT-02 §8, « AMRAP : Objectif, Par
    // tour, Max »), faute d'interrupteur « Volume croissant ».
    const forTimeLoads = (answers: ModelAnswers): ModelAnswers => ({ ...answers, withLoad: true });
    if (reedit !== null) startWith(routeModel, opening, forTimeLoads(reedit.opened.answers), reedit.opened.movements);
    else startWith(routeModel, opening, forTimeLoads(routeModel === "AMRAP" ? { ...initialAnswers(routeModel), increasingVolume: true } : initialAnswers(routeModel)), []);
    void start;
    // Une seule fois par ouverture : le brouillon de cette ouverture n'est jamais recréé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening]);
  const model = modelDraft?.model ?? routeModel;
  const answers = useMemo(() => (fresh ? modelDraft?.answers : undefined) ?? initialAnswers(routeModel), [fresh, modelDraft, routeModel]);
  const movements = useMemo(() => (fresh ? modelDraft?.movements : undefined) ?? [], [fresh, modelDraft]);
  // D-607 (Formats § 9.9) : le nom du Superset suit le nombre de mouvements choisis (Superset, Tri-set, Giant set).
  const modelName = formatModelName(model, movements.length);
  const colors = formatModelColors(model);

  // Valeurs du Profil pour les Exercices de base (§14.3 : valeurs initialisées depuis le Profil).
  const [defaults, setDefaults] = useState<MovementExerciseDefaults | null>(null);
  useEffect(() => {
    let cancelled = false;
    const read = profileService ? profileService.getProfile().then(profileDefaultsOf, () => DOMAIN_DEFAULTS) : Promise.resolve(DOMAIN_DEFAULTS);
    void read.then((value) => {
      if (!cancelled) setDefaults(value);
    });
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  // Entrées du Catalogue des Mouvements (familles, Niveaux, archivage) : suggestions de saisie, mode catalogue et
  // Niveau des cartes. Sans service du Catalogue (tests), relecture des choix de mouvements.
  const [entries, setEntries] = useState<readonly MovementCatalogueEntry[]>([]);
  useEffect(() => {
    if (!service.supportsMovementSearch) return;
    let cancelled = false;
    const catalogue = service.movementCatalogue ?? null;
    const read: Promise<readonly MovementCatalogueEntry[]> =
      catalogue !== null
        ? catalogue.listEntries()
        : service.listMovementChoices().then((found: readonly MovementChoice[]) =>
            found.map((choice) => ({ movement: choice.movement, level: choice.level ?? null, exerciseCount: 0, archived: choice.archived === true })),
          );
    read.then(
      (found) => {
        if (!cancelled) setEntries(found);
      },
      (error: unknown) => console.error("Les mouvements n'ont pas pu être lus.", error),
    );
    return () => {
      cancelled = true;
    };
  }, [service]);

  const addMovements = useCallback(
    (added: readonly Movement[], role: "LOOP" | "BUY_IN" | "BUY_OUT") => {
      if (defaults === null || modelDraft === null) return;
      const entries = added.map((movement) => {
        const exercise = exerciseOfMovement(movement, Crypto.randomUUID(), defaults);
        // Règles de Hermann du 14/11/2026 (For time, FT-4) : un buy-in ou un buy-out commence à une série.
        // For time sans questionnaire (15/11/2026, Hermann : « montrer unité, en rouge, à l’ajout de chaque ligne, les champs de valeur ne
        // sont pas activés tant que l’unité n’est pas renseignée ») : ligne sans unité, valeurs à renseigner (aucune valeur inventée).
        // [21-15-9 en Répétitions à l'ajout — remplacé pour le For time.]
        const forTimeRole = role === "LOOP" ? "TOUR" : role;
        const values =
          model === "FOR_TIME"
            ? { volumes: Array.from({ length: forTimeRole === "TOUR" ? (modelDraft.answers.roundCount ?? 3) : forTimeBlockSeries(modelDraft.answers, forTimeRole) }, () => null), loads: [] }
            : withUnitToChoose(model, initialMovementValues(model, modelDraft.answers, exercise, forTimeRole));
        return { exercise, values, movement };
      });
      setMovements((existing) => {
        // Death by : passage de un à plusieurs mouvements — Départ et Incrément communs déjà saisis restent ceux du premier mouvement.
        const first = existing[0];
        const current =
          model === "DEATH_BY" && existing.length === 1 && first !== undefined
            ? [
                {
                  ...first,
                  values: {
                    ...first.values,
                    start: first.values.start ?? modelDraft.answers.startRepetitions ?? null,
                    startIncrement: first.values.startIncrement ?? modelDraft.answers.increment ?? null,
                  },
                },
              ]
            : existing;
        const mapped = entries.map(({ exercise, values }) => ({ exercise, values }));
        // Buy-in : choix explicite de la section Buy-in, toujours en tête (§7.3, §7.4 ; recette n° 3 du 03/11/2026 : jamais un
        // mouvement de boucle pris pour le buy-in). Recette du 08/11/2026 au soir (Hermann : « Il faut retirer la limite d'un
        // exercice dans le questionnaire et le récapitulatif, c'est contradictoire avec la composition de séance ») : plusieurs
        // buy-in, ajoutés après ceux déjà choisis. [Un seul buy-in, remplacé par « Changer » — remplacé le 08/11/2026.]
        if (role === "BUY_IN") {
          const ins = current.filter((item) => item.buyIn === true);
          return [...ins, ...mapped.map((item) => ({ ...item, buyIn: true as const })), ...current.filter((item) => item.buyIn !== true)];
        }
        // For time (recette du 04/11/2026) : buy-out choisi dans sa section, toujours en fin ; plusieurs buy-out (08/11/2026),
        // ajoutés après ceux déjà choisis. [Un seul buy-out, remplacé par « Changer » — remplacé le 08/11/2026.]
        if (role === "BUY_OUT") return [...current, ...mapped.map((item) => ({ ...item, buyOut: true as const }))];
        // Mouvements de la boucle : avant le buy-out.
        const outs = current.filter((item) => item.buyOut === true);
        return [...current.filter((item) => item.buyOut !== true), ...mapped, ...outs];
      });
      for (const { movement } of entries) movementsById.current.set(movement.id, movement);
      // Recette n° 3 du 03/11/2026 : le choix d'un mouvement reste sur l'écran (plus de passage automatique
      // au récapitulatif) — « Valider ces paramètres » ou « Enregistrer dans la séance » (`validatesFirst`).
    },
    [defaults, model, modelDraft, setMovements],
  );

  // For time sans questionnaire (15/11/2026) : « un bloc est actif dès qu’il contient un mouvement » — les réponses Buy-in / Buy-out,
  // lues par la structure produite et la validation, suivent le contenu des blocs. [Interrupteurs Buy-in / Buy-out — remplacés.]
  // AMRAP, écran unique (15/11/2026, CE-FMT-02 §8 : « un bloc Buy-in et un bloc En boucle, chacun avec son « + Ajouter » ») : de même
  // pour le Buy-in. [Interrupteur Buy-in du questionnaire — remplacé.]
  const forTimeBlockState = (model === "FOR_TIME" || model === "AMRAP") && modelDraft !== null && modelDraft.opening === opening ? modelDraft : null;
  useEffect(() => {
    if (forTimeBlockState === null) return;
    const hasIn = forTimeBlockState.movements.some((item) => item.buyIn === true);
    const hasOut = model === "FOR_TIME" && forTimeBlockState.movements.some((item) => item.buyOut === true);
    if ((forTimeBlockState.answers.buyIn === true) === hasIn && (forTimeBlockState.answers.buyOut === true) === hasOut) return;
    setAnswers((current) => ({ ...current, buyIn: hasIn, buyOut: hasOut }));
  }, [forTimeBlockState, model, setAnswers]);

  // Mouvements remis par la modale du Catalogue au retour sur l'écran.
  const movementsById = useRef(new Map<string, Movement>());
  useFocusEffect(
    useCallback(() => {
      const handed = takeMovementsHandedToFormat();
      if (handed !== null) addMovements(handed.movements, handed.role);
    }, [addMovements]),
  );

  // Champ de saisie d'un mouvement (§7.1), ouvert dans une section : Mouvements (ou En boucle) ou Buy-in —
  // recette n° 3 du 03/11/2026 (f3r-recherche, Hermann : « Sur le deuxième écran des valeurs des paramètres,
  // appuyer sur "+ Ajouter" ouvre directement le catalogue alors que le comportement doit être exactement le
  // même que pour le premier écran. Idem pour le bouton "Changer" ») : même champ dans chaque section, aux deux étapes.
  // D-603 / D-604 (Hermann, 25/11/2026 ; Formats §§ 9.6 et 9.7) : à la première ouverture de tout format, sans exception, l'écran de choix
  // des mouvements (mode catalogue du format, section des mouvements) s'affiche en premier ; les paramètres restent accessibles par le lien
  // du haut « Paramètres ». Aucun nouvel écran : seul l'état initial change. La réouverture d'un format (« Modifier le format », `circuitId`)
  // garde ses paramètres en premier.
  const firstOpening = reedit === null;
  const [searchRole, setSearchRole] = useState<"LOOP" | "BUY_IN" | "BUY_OUT" | null>(() => (firstOpening ? "LOOP" : null));
  const [query, setQuery] = useState("");
  const windowHeight = useWindowDimensions().height;
  const keyboardFrame = useKeyboardFrame();
  const reduceMotion = useReduceMotion();
  const safeBottom = initialWindowMetrics?.insets.bottom ?? 0;
  const actionZone = usePrimaryActionZone();
  const rootRef = useRef<View>(null);
  // Mode catalogue (mise à jour consolidée du 04/11/2026 §3 ; référence Formats §7.1 à §7.3) : « Ouvrir le mode
  // catalogue » reste dans la modale — recherche détachée avec croix d'effacement, Filtrer, Trier (inactif, comme au
  // Catalogue) et Replier / déplier les piles, petites cartes avec filet des niveaux, sans compteur ; « Ajouter »
  // applique la sélection (multiple dans chaque section, buy-in et buy-out compris depuis le 08/11/2026 — [unique pour le buy-in :
  // remplacé]), « Fermer le mode catalogue » revient à la saisie sans ajout.
  // [Modale du Catalogue séparée (`/movement-selection`), ouverte en fondu — remplacée.]
  const [catalogueMode, setCatalogueMode] = useState(firstOpening);
  const [catalogueFilters, setCatalogueFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [pilesCollapsed, setPilesCollapsed] = useState(false);
  // Recette du 04/11/2026 (f4-catalogue, Hermann : « le filet bleu à gauche doit être actif et permettre de replier les
  // piles ») : toucher le filet d'une pile la replie ; « Déplier » les rouvre toutes.
  const [collapsedPiles, setCollapsedPiles] = useState<ReadonlySet<string>>(new Set());
  // f4-catalogue (« elle se rétrécit en largeur, le bouton croix apparaît à l'intérieur, et les 3 boutons apparaissent ») :
  // le champ de saisie garde son format ; les commandes apparaissent après son premier rendu, le champ se rétrécit.
  const [commandsShown, setCommandsShown] = useState(firstOpening);
  const [catalogueFocus, setCatalogueFocus] = useState(false);
  const [bandHeight, setBandHeight] = useState(CONTEXT_HEIGHT);
  const [picked, setPicked] = useState<ReadonlyMap<string, Movement>>(new Map());
  // Superset complet, « Modifier » (recette du 16/11/2026, fmt-superset) : la sélection remplace les mouvements du tableau.
  const [replacing, setReplacing] = useState(false);
  const catalogueItems = useMemo(() => (catalogueMode ? visibleMovementItems(entries, query, catalogueFilters) : []), [catalogueFilters, catalogueMode, entries, query]);
  // Catalogue en modification (D-572, Hermann, 25/11/2026 ; Formats § 9.9) : les mouvements sélectionnés sont figés en haut, en état
  // sélectionné, dans l'ordre de la sélection, sans recherche ni filtre ; la liste dessous ne les montre plus. Désélectionner une carte
  // figée la rend à la liste ; sélectionner une carte de la liste la fige. Hors modification (« + Ajouter ») : liste inchangée.
  const pinnedEntries = useMemo(
    () =>
      replacing
        ? [...picked.values()].map((movement) => entries.find((entry) => entry.movement.id === movement.id) ?? { movement, level: null, exerciseCount: 0, archived: false })
        : [],
    [entries, picked, replacing],
  );
  const listedItems = useMemo(() => (replacing ? withoutPinned(catalogueItems, new Set(picked.keys())) : catalogueItems), [catalogueItems, picked, replacing]);
  // Complément du 5 novembre 2026 (Hermann), §19 : « + Ajouter » (ou « Changer ») ouvre directement le mode catalogue — champ de
  // recherche actif, clavier ouvert, filtres, tri et piles à côté du champ. [Étape intermédiaire de saisie avec suggestions et lien
  // « Ouvrir / Fermer le mode catalogue » (recette n° 3 du 03/11/2026, f3r-recherche ; MAJ 04/11 §3) — remplacés.]
  // Recette iPhone du 07/11/2026 (remarques D et E) : opacité commune du contenu défilant, de la zone de recherche et de la zone
  // d'action. Ouverture : la liste, la recherche et « Fermer sans sélectionner » apparaissent ensemble en fondu lent ; fermeture
  // (« Fermer sans sélectionner », « Ajouter X mouvements », « Revenir aux paramètres ») : fondu lent jusqu'à disparition, puis
  // retour aux paramètres, qui réapparaissent en fondu. [Avant : apparition et fermeture d'un coup — remplacé.]
  // Recette iPhone du 08/11/2026 (b-cat-fondu, b-cat-fermer, Hermann : « Appuyer sur Revenir aux paramètres fait disparaître la
  // liste et apparaître le questionnaire avec environs 0.5 secondes entre les deux où la page est blanche » ; « Appuyer sur
  // +Ajouter crée un saut, et la zone de contexte de la page du catalogue n'a plus le transparent progressif ») : fondu enchaîné.
  // Le catalogue est une couche opaque posée sur les paramètres, qui restent montés et immobiles dessous ; seule l'opacité de
  // cette couche varie (0 → 1 à l'ouverture, 1 → 0 à la fermeture) : les deux contenus se croisent, sans page blanche. La zone
  // de contexte, au-dessus de la couche, garde sa place et son fondu. L'ajout s'applique dès le début de la fermeture (les
  // cartes ajoutées apparaissent pendant le fondu). Ouverture : le fondu attend la pastille des zones (image native
  // préchargée), au plus `CATALOGUE_ICON_WAIT_MS`, pour que boutons, cartes et pastilles apparaissent ensemble.
  // [07/11 : un seul fondu du contenu, de la recherche et du bouton du bas — sortie jusqu'à disparition, remplacement du
  // contenu, puis entrée (≈ 2 × 450 ms dont une page blanche) — remplacé le 08/11/2026.]
  const catalogueOpacity = useSharedValue(firstOpening ? 1 : 0);
  const catalogueFadeStyle = useAnimatedStyle(() => ({ opacity: catalogueOpacity.value }));
  const catalogueClosing = useRef(false);
  const [catalogueLeaving, setCatalogueLeaving] = useState(false);
  const [catalogueFade, setCatalogueFade] = useState<{ readonly to: 0 | 1; readonly id: number } | null>(null);
  const catalogueFadeId = useRef(0);
  const afterCatalogueFade = useRef<{ readonly id: number; readonly run: () => void } | null>(null);
  const catalogueScrollRef = useRef<ScrollView>(null);
  // Remarque D (« le symbole de la zone corporelle (pas son cercle) apparait avec un décalage d'une seconde environs ») : la
  // pastille des zones corporelles des cartes est préchargée dès l'ouverture du Format, avant « + Ajouter ».
  useEffect(() => {
    void preloadKodjoIcons(CATALOGUE_ICONS);
  }, []);
  const runAfterCatalogueFade = useCallback((id: number, finished: boolean) => {
    const next = afterCatalogueFade.current;
    if (next === null || next.id !== id) return;
    afterCatalogueFade.current = null;
    if (finished) next.run();
    else catalogueClosing.current = false;
  }, []);
  useEffect(() => {
    if (catalogueFade === null) return undefined;
    const { to, id } = catalogueFade;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      catalogueOpacity.set(
        withTiming(to, CATALOGUE_FADE_TIMING, (finished) => {
          scheduleOnRN(runAfterCatalogueFade, id, finished === true);
        }),
      );
    };
    if (to === 1) void whenKodjoIconsReady(CATALOGUE_ICONS, CATALOGUE_ICON_WAIT_MS).then(run);
    else run();
    return () => {
      cancelled = true;
    };
    // Un fondu par demande (`catalogueFade`) : la valeur partagée et le rappel stable ne relancent pas le fondu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogueFade]);
  const requestCatalogueFade = (to: 0 | 1, then?: () => void) => {
    catalogueFadeId.current += 1;
    const id = catalogueFadeId.current;
    afterCatalogueFade.current = then === undefined ? null : { id, run: then };
    setCatalogueFade({ to, id });
  };
  /**
   * Ferme le mode catalogue en fondu enchaîné : `apply` (ajout éventuel) dès le début, sous la couche qui s'efface ; fermeture à la
   * fin du fondu. Immédiat sous « Réduire les animations ».
   */
  const fadeCatalogueOut = (apply?: () => void) => {
    if (catalogueClosing.current) return;
    const finish = () => {
      catalogueClosing.current = false;
      closeCatalogue();
      setSearchRole(null);
      setQuery("");
    };
    apply?.();
    if (reduceMotion) {
      catalogueOpacity.set(0);
      finish();
      return;
    }
    catalogueClosing.current = true;
    setCatalogueLeaving(true);
    requestCatalogueFade(0, finish);
  };
  // Piles du mode catalogue (remarque D : « replier et déplier les mouvements lentement avec un glissement des cartes ») : les
  // transitions de place ne jouent que juste après un repli ou un dépli, jamais pendant la recherche ou le défilement.
  const [pilesMoving, setPilesMoving] = useState(false);
  // Chaque repli ou dépli relance la fenêtre d'animation (minuterie tenue par l'effet, sans ref lue au rendu).
  const [pileMoves, setPileMoves] = useState(0);
  useEffect(() => {
    if (pileMoves === 0) return undefined;
    const timer = setTimeout(() => setPilesMoving(false), CATALOGUE_MOTION_MS + 100);
    return () => clearTimeout(timer);
  }, [pileMoves]);
  const markPilesMoving = () => {
    if (reduceMotion) return;
    setPilesMoving(true);
    setPileMoves((count) => count + 1);
  };
  const expandPile = (key: string) => {
    markPilesMoving();
    setCollapsedPiles((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };
  const openCatalogue = () => {
    setPicked(new Map());
    // Demande de Hermann du 05/11/2026 (soir) : pas de focus par défaut dans la recherche.
    setCatalogueFocus(false);
    // b-cat-fondu (« Les boutons apparaissent toujours avec un décalage ») : Filtrer, Trier et Replier sont rendus avec la liste,
    // sous la même opacité. [Commandes montées une image plus tard, en fondu propre de 220 ms (f4-catalogue) — remplacé le 08/11.]
    setCommandsShown(true);
    catalogueClosing.current = false;
    setCatalogueLeaving(false);
    setCatalogueMode(true);
    if (reduceMotion) {
      catalogueOpacity.set(1);
      return;
    }
    requestCatalogueFade(1);
  };
  const closeCatalogue = () => {
    // Fermeture directe aussi (message du Superset) : couche retirée, opacité remise à 0 pour le fondu de la prochaine ouverture.
    catalogueClosing.current = false;
    afterCatalogueFade.current = null;
    setCatalogueFade(null);
    catalogueOpacity.set(0);
    setCatalogueMode(false);
    setCatalogueLeaving(false);
    setPicked(new Map());
    setReplacing(false);
    setCommandsShown(false);
  };
  // Recette du 04/11/2026 (x-sans-recap, Hermann : « Superset : questionnaire : il manque la ligne de récupération après
  // la paire ; on ne doit pas pouvoir sélectionner plus de deux exercices, afficher un message ») : deux exercices au plus ; au-delà, message et aucun ajout.
  // [Remplacé le 25/11/2026 (D-572, Formats § 9.9 : « 5 mouvements au plus par format » ; Superset de deux à cinq mouvements) : plafond
  // de deux propre au Superset (`supersetFull`).] Plafond commun : la sélection en cours compte avec les mouvements des autres sections
  // (et, hors modification, avec ceux déjà choisis dans la section).
  const formatFull = (selected: number) => {
    const others = replacing ? movements.filter((item) => sectionRoleOf(item) !== searchRole).length : movements.length;
    return others + selected > MAX_FORMAT_MOVEMENTS;
  };
  // Recette du 05/11/2026 (g-superset-deux, Hermann : « Remplacer Ok par J'ai compris. Lorsque l'utilisateur a appuyé il faut
  // fermer le clavier, le mode catalogue s'il est ouvert, supprimer le texte de la zone de saisie et revenir à l'écran
  // questionnaire »).
  // Recette iPhone du 16/11/2026 (constat g, Hermann : « superset : ouverture du catalogue, sélectionner 3 mouvements > affichage de la
  // fenêtre d'information, lorsque j'ai appuyé sur "J'ai compris" il faut laisser le catalogue ouvert, ne pas le refermer ») : en mode
  // catalogue, le message se referme seul ; catalogue, recherche et sélection restent en place. [Fermeture du mode catalogue — remplacée
  // le 16/11/2026 ; hors mode catalogue, comportement du 05/11/2026 inchangé.]
  // D-572 : même message (« J'ai compris », catalogue laissé ouvert), au libellé du plafond de cinq mouvements.
  const warnFormatFull = () =>
    Alert.alert(t().formatLimitTitle, t().formatLimitMessage, [
      {
        text: t().supersetLimitAcknowledge,
        onPress: () => {
          Keyboard.dismiss();
          if (catalogueMode) return;
          setQuery("");
          setSearchRole(null);
        },
      },
    ]);
  const togglePicked = (movement: Movement) => {
    // D-572 : une sixième sélection est refusée (message), quelle que soit la section. [Superset seul, à deux — remplacé le 25/11/2026.]
    if (!picked.has(movement.id) && formatFull(picked.size + 1)) {
      warnFormatFull();
      return;
    }
    setPicked((current) => {
      // Sélection multiple, buy-in compris (08/11/2026). [Sélection unique pour le buy-in — remplacée.]
      const next = new Map(current);
      if (next.has(movement.id)) next.delete(movement.id);
      else next.set(movement.id, movement);
      return next;
    });
  };
  const addPicked = () => {
    if (picked.size === 0 || searchRole === null) return;
    // Ordre de présentation du Catalogue (sans recherche ni filtre), jamais l'ordre des touchers (V2-CAT-01 §4.4).
    const ordered = visibleMovementItems(entries, "", EMPTY_MOVEMENT_FILTERS)
      .flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry]))
      .filter((entry) => picked.has(entry.movement.id))
      .map((entry) => entry.movement);
    const role = searchRole;
    Keyboard.dismiss();
    // Remarque E du 07/11/2026 et b-cat-fermer du 08/11/2026 : ajout sous la couche du catalogue, qui s'efface en fondu enchaîné.
    if (catalogueClosing.current) return;
    if (replacing) {
      // « Modifier » : les mouvements gardés conservent leurs valeurs ; les retirés disparaissent ; les nouveaux sont ajoutés.
      const kept = new Set(
        movements.flatMap((item) =>
          sectionRoleOf(item) === role && item.exercise.sourceMovementId !== undefined && picked.has(item.exercise.sourceMovementId) ? [item.exercise.sourceMovementId] : [],
        ),
      );
      // D-572 : seule la section modifiée est remplacée ; les mouvements des autres sections (buy-in, boucle, buy-out) restent.
      fadeCatalogueOut(() => {
        setMovements((current) =>
          current.filter((item) => sectionRoleOf(item) !== role || (item.exercise.sourceMovementId !== undefined && kept.has(item.exercise.sourceMovementId))),
        );
        addMovements(
          ordered.filter((movement) => !kept.has(movement.id)),
          role,
        );
      });
      return;
    }
    fadeCatalogueOut(() => addMovements(ordered, role));
  };
  /**
   * « + Modifier » (D-572, 25/11/2026, Formats § 9.9) : le mode catalogue s'ouvre en modification sur les mouvements déjà choisis de la
   * section, sélectionnés et figés en haut. [Superset complet seul, « Modifier » (recette du 16/11/2026, fmt-superset) — étendu à toute
   * section dès un mouvement choisi.]
   */
  const editSection = (role: SectionRole) => {
    setQuery("");
    setSearchRole(role);
    openCatalogue();
    setReplacing(true);
    setPicked(
      new Map(
        movements.flatMap((item) => {
          if (sectionRoleOf(item) !== role) return [];
          const movement = movementOf(item);
          return movement === null ? [] : [[movement.id, movement] as const];
        }),
      ),
    );
  };
  const openSheet = (movement: Movement) => router.push({ pathname: "/movement-sheet", params: { movementId: movement.id } });
  const filterSummary =
    filterLabels.length === 0 ? null : filterLabels.length === 1 ? filterLabels[0]! : fillTemplate(strings.screens.movement.catalogue.filters.activeSummary, { count: String(filterLabels.length) });

  // Structure produite, durée et Déroulé, recalculés à chaque réponse ou cellule (§15).
  const newId = useCallback(() => Crypto.randomUUID(), []);
  const elements = useMemo(() => buildModelElements(model, answers, movements, () => "preview"), [answers, model, movements]);
  const duration = useMemo(() => modelDuration(elements), [elements]);
  const timeline = useMemo(() => modelTimeline(model, answers, movements), [answers, model, movements]);
  const movementName = (index: number) => movements[index]?.exercise.name ?? "";
  // Spécification de Hermann du 08/11/2026 (A §1, B §1) : au récapitulatif, toutes les durées affichées au format M′SS″ (ou S″ sous une
  // minute) — cellules de durée, Intervalle, Durée, Durée totale, repère de fin du Déroulé (le repère de début reste « 0 »).
  // Questionnaire : format inchangé.
  // Demande de Hermann du 08/11/2026 au soir (« Et tu dois encore modifier le format des durées. ») : questionnaire aussi. [Questionnaire
  // en « 1 min », « 30 s » — remplacé le 08/11/2026 au soir.]
  const formatDuration = formatPrimeDuration;
  const endLabel =
    timeline.end.kind === "UNTIL_FAILURE"
      ? t().untilFailure
      : timeline.end.kind === "MEASURED"
        ? t().measured
        : duration !== null
          ? modelDurationText(duration, formatDuration)
          : genericDuration(model, answers, formatDuration);

  const busyRef = useRef(false);
  // Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « Il n'est pas possible de supprimer le
  // dernier mouvement. Il faut pouvoir le faire, mais à ce moment le bouton d'action "Enregistrer dans la
  // séance" doit être grisé. ») : sans mouvement de boucle, l'enregistrement est indisponible. [C.3, §7.4 :
  // dernier mouvement de boucle protégé (variante « Suppression = Bloquée ») — remplacé.]
  // Recette n° 3 du 03/11/2026 (autres constats, Hermann : « Il faut sélectionner le mouvement de Buy-in pour
  // que le bouton d'action soit activé ») : Buy-in activé, il faut le buy-in et au moins un mouvement en boucle.
  const switches = roleSwitches(model);
  const loopLabelOf = () => (model === "FOR_TIME" ? t().forTimeLoopSection : t().loopSection);
  const buyIn = switches.includes("buyIn") && answers.buyIn === true;
  // For time (recette du 04/11/2026, Hermann : « Questionnaire : il manque les interrupteurs Buy-in et Buy-out »).
  const buyOut = switches.includes("buyOut") && answers.buyOut === true;
  // Contre-recette n° 3 ter du 03/11/2026 (Hermann : « on ne doit pas pouvoir "Ajouter à la séance" si toutes les
  // valeurs des paramètres ne sont pas renseignées ») : au récapitulatif, chaque cellule du tableau est renseignée.
  // MAJ 04/11 §4.4 (décision de Hermann du 3 novembre) : récapitulatif complet et cohérent — objectifs renseignés,
  // contrôle EMOM des durées ; une charge vide ne bloque pas.
  const issues = useMemo(() => (stage === "summary" ? summaryIssues(model, answers, movements) : []), [answers, model, movements, stage]);
  // Recette du 05/11/2026 (n-amrap, Hermann : « cette règle des cases rouges non saisies est générale, pas seulement spécifique à
  // l’AMRAP ») : un réglage requis non renseigné est une case vide et rouge, au questionnaire comme au récapitulatif.
  const missingSettings = useMemo(
    () => new Set(summaryIssues(model, answers, movements).flatMap((issue) => (issue.kind === "MISSING_SETTING" ? [issue.id] : []))),
    [answers, model, movements],
  );
  const emomOverflow = useMemo(() => (model === "EMOM" ? emomDurationOverflow(answers, movements) : []), [answers, model, movements]);
  // C.5 (référence Formats §9.2, A4) : le Superset demande deux mouvements choisis.
  const enoughMovements = model === "SUPERSET" ? movements.length >= 2 : movements.length > 0;
  const canSave = enoughMovements && hasRequiredRoles(model, answers, movements) && issues.length === 0;
  const save = () => {
    if (busyRef.current || !canSave) return;
    busyRef.current = true;
    if (reedit !== null) {
      const next = applyModelReedit(sessionDraft.draft, reedit.circuitId, reedit.opened, { model, answers, movements, variable }, newId);
      sessionDraft.updateDraft({ exercises: next.exercises, ...(next.structure !== undefined ? { structure: next.structure } : {}) });
      dismissWith(backToComposition);
      return;
    }
    const built = buildModelElements(model, answers, movements, newId);
    const next = appendModelToDraft(sessionDraft.draft, built, newId);
    sessionDraft.updateDraft({
      exercises: next.exercises,
      ...(next.structure !== undefined ? { structure: next.structure } : {}),
      ...(next.stopPoints !== undefined ? { stopPoints: next.stopPoints } : {}),
      ...(next.tourRepeatCount !== undefined ? { tourRepeatCount: next.tourRepeatCount } : {}),
      ...(next.circuitNature !== undefined ? { circuitNature: next.circuitNature } : {}),
      ...(sessionDraft.draft.origin === undefined || sessionDraft.draft.origin === null ? { origin: model } : {}),
    });
    // B.9 : le nom du modèle est suggéré (jamais imposé). Mise à jour du 04/11/2026 §2 : aucun nom de Séance
    // dans le parcours ; un nom déjà saisi dans la Composition est conservé.
    sessionDraft.suggestDraftName?.(modelName);
    dismissWith(backToComposition);
  };

  // Recette n° 3 du 03/11/2026 (autres constats : « Enregistrer > Cela ouvre un écran de composition de
  // séance vierge ») : `dismissTo("/composition")` remplaçait les paramètres de la Composition — une
  // Séance ouverte depuis le Catalogue perdait son `sessionId` et repartait d'un brouillon vierge. On
  // dépile jusqu'à la Composition, paramètres intacts.
  // Règle de Hermann du 06/11/2026 (registre ch07) : enregistré, le Format retire les feuilles de création ; une Composition ouverte
  // dessous reprend le premier plan, sinon (ouverture par « Créer » du Catalogue) elle s'ouvre alors avec le Format.
  const backToComposition = () => closeCreationModals(router, navigation);

  // « Valider les paramètres » : récapitulatif sur place, sans ajout ; Retour : questionnaire, réponses conservées.
  const validate = () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSearchRole(null);
    setStage("summary");
  };
  // Recette du 04/11/2026 (f4-modale, Hermann : « Tabata : Après sélection des mouvements, le bouton d'action doit
  // directement être "Enregistrer dans la séance" ») : le Tabata s'enregistre depuis son questionnaire, sans récapitulatif.
  // [MAJ 04/11 §2 : « Valider les paramètres » pour tous les modèles — remplacé pour le Tabata.] Réponse de Hermann du 04/11/2026
  // (« Faut-il faire de même pour les autres modèles sans tableau ? » → « Tous les modèles sans tableau ») : 30/30,
  // Renforcement, À l'échec et Superset aussi ; les modèles à tableau (EMOM, AMRAP, For time, Death by, Progression) gardent
  // « Valider les paramètres ».
  const validating = stage === "questionnaire" && !savesFromQuestionnaire(model, movements.length);
  // Recette du 05/11/2026 au soir (p-coche, p-coche-recap, p-ajout ; réponses de Hermann du 06/11/2026, Q1 et Q4) : « la coche est
  // grisée tant que tous les paramètres et les valeurs ne sont pas renseignées, donc on ne peut pas enregistrer directement le format
  // dans la séance ». Deux scénarios : valeurs saisies au questionnaire → pas de bouton, la coche enregistre dans la séance ; valeurs à
  // saisir au récapitulatif → « Valider les paramètres » en bas du questionnaire (coche grise), coche du récapitulatif qui enregistre.
  // Mode catalogue : croix (annule la création du Format), « Ajouter X mouvements » en bas, coche selon la même règle.
  // [§18–§19 : coche « Ajouter » en mode catalogue et coche « Valider les paramètres » au questionnaire — remplacées.]
  const canSaveHere = canSave && !validating;
  // b-cat-fondu du 08/11/2026 : « Ajouter X mouvements » appartient à la couche du catalogue, « Valider les paramètres » aux
  // paramètres (dessous) ; chacun garde sa zone d'action pendant le fondu enchaîné.
  // Recette du 06/11/2026 (s-focus, Hermann : « Le bouton d'action du bas est "Fermer sans sélectionner" si aucun mouvement n'est sélectionné,
  // puis devien "Ajouter X mouvements" lorsque des mouvements sont sélectionnés ») : sans sélection, le bouton est actif et ferme le mode
  // catalogue (comme « Revenir aux paramètres »). [« Ajouter » grisé sans sélection — remplacé.]
  const addPickedLabel =
    picked.size === 0
      ? t().closeWithoutSelecting
      : replacing
        ? t().applyPicked
        : picked.size === 1
          ? t().addPickedOne
          : fillTemplate(t().addPickedMany, { count: String(picked.size) });

  // p-coche / p-ajout : « Revenir aux paramètres » ferme le mode catalogue sans ajout.
  // Remarque E du 07/11/2026 : « Fermer sans sélectionner » et « Revenir aux paramètres » ferment en fondu lent.
  const backToParameters = () => {
    Keyboard.dismiss();
    fadeCatalogueOut();
  };
  const close = () => {
    // Recette du 05/11/2026 au soir (p-ajout, Hermann : « La croix annule la création du format ») : en mode catalogue aussi, la
    // croix quitte le Format. [§18–§19 : la croix du mode catalogue revenait au questionnaire sans ajout — remplacé par « Revenir
    // aux paramètres ».]
    if (catalogueMode) Keyboard.dismiss();
    // For time sans questionnaire (15/11/2026) : « Croix ou Retour → Composition, sans ajout » — le Retour quitte le Format, comme la
    // croix d'un questionnaire (retour à l'écran qui l'a ouvert, règle du 06/11/2026).
    // Formats à tableau, écran unique (15/11/2026, CE-FMT-02 §4 : « Retour » vers un questionnaire n'existe plus) : Retour quitte aussi
    // le Format. [Retour du récapitulatif vers le questionnaire, réponses conservées — remplacé.]
    // Recette du 05/11/2026 (n-cat-format, Hermann : « Questionnaire : Croix > Retour à la modale "Créer un exercice" ») : ouvert
    // depuis la modale de création, le questionnaire y revient. [Essai feuille native : la croix ramenait à la Composition, même
    // si la fenêtre Formats était empilée dessous — remplacé.] Réédition (« Modifier le format ») : retour à la Composition.
    // Règle du 06/11/2026 (ordre des écrans) : la croix revient à l'écran qui a ouvert le questionnaire (modale « Créer un
    // exercice », ou Composition pour « Modifier le format »).
    dismissWith(() => (onClose !== undefined ? onClose() : router.back()));
  };

  // Cases au clavier (lignes de paramètres et tableaux) : focus, Suivant / Précédent, révélation au-dessus du clavier et de sa
  // barre. Déclarées avant les lignes, qui s'y branchent.
  const cellInputs = useRef(new Map<string, TextInput | null>());
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [barHeight, setBarHeight] = useState(KEYBOARD_BAR_HEIGHT);
  const [unitPicking, setUnitPicking] = useState(false);
  const [cellSigns, setCellSigns] = useState<Readonly<Record<string, 1 | -1>>>({});
  const focusCell = (key: string | undefined) => {
    if (key !== undefined) cellInputs.current.get(key)?.focus();
  };
  const cellBinding: CellBinding = (key) => ({
    ...(cellSigns[key] !== undefined ? { sign: cellSigns[key] } : {}),
    inputRef: (input) => {
      cellInputs.current.set(key, input);
    },
    onFocus: () => {
      setUnitPicking(false);
      setFocusedCell(key);
    },
    onBlur: () => setFocusedCell((current) => (current === key ? null : current)),
    active: focusedCell === key,
  });

  // Lignes de paramètres du modèle.
  // `fallback` : valeur héritée affichée tant que la réponse n'est pas fixée (Pause du Renforcement : pause des Exercices).
  const stepRow = (
    id: ModelAnswerKey,
    label: string,
    options: { last?: boolean; format?: (value: number) => string; fallback?: number; seconds?: boolean; placeholder?: string; missing?: boolean } = {},
  ) => {
    const value = answers[id] ?? options.fallback;
    const bounds = answerBounds(id);
    const isSeconds = options.seconds ?? SECONDS_KEYS.has(id);
    const numeric = typeof value === "number" ? value : null;
    const isVariable = variable.has(id);
    const missingNow = !isVariable && numeric === null && missingSettings.has(id);
    // Hermann, 05/11/2026 : « Un point à corriger pour tous les écrans questionnaires, récapitulatif : on utilise
  // systématiquement le clavier pour renseigner les valeurs, plus aucun stepper et de roulette. L'appui sur suivant permet de
  // passer d'une valeur à l'autre, aussi entre deux lignes ou d'une ligne à un tableau. »
    // La valeur se tape dans sa pastille (pavé numérique, durée « MM:SS » remplie par la droite comme dans les tableaux) ;
    // la barre du clavier enchaîne les lignes puis le tableau. Bornes appliquées à la saisie ; une case vidée garde la
    // valeur précédente, sauf le Temps limite qui repasse à « Sans limite ». [Stepper − / + — remplacé.]
    const key = answerFieldKey(id);
    const binding = cellBinding(key);
    // §6 sexies.7 : remplacer un réglage « variable » écrase des valeurs personnalisées — confirmation courte, à l'entrée
    // dans la case ; Annuler quitte la case sans rien changer.
    const confirmVariable = () =>
      Alert.alert(t().variableConfirmTitle, t().variableConfirmMessage, [
        { text: t().variableConfirmCancel, style: "cancel", onPress: () => cellInputs.current.get(key)?.blur() },
        {
          text: t().variableConfirmReplace,
          onPress: () => {
            setVariable((current) => new Set([...current].filter((item) => item !== id)));
            setAnswers((current) => withAnswer(current, id, (initialAnswers(model)[id] as number | undefined) ?? bounds.min));
          },
        },
      ]);
    return (
      <Row key={key} label={label} last={options.last === true} testID={`format-row-${id}`}>
        <TableCell
          kind={isSeconds ? "duration" : "integer"}
          value={isVariable ? null : numeric}
          format={(entered) => (options.format !== undefined ? options.format(entered) : isSeconds ? formatDuration(entered) : String(entered))}
          placeholder={isVariable ? t().variable : missingNow ? "" : (options.placeholder ?? t().noLimit)}
          badge
          durationMin={bounds.min}
          missing={missingNow || options.missing === true || (id === "intervalSeconds" && stage === "summary" && emomOverflow.length > 0) || (model === "DEATH_BY" && (id === "startRepetitions" || id === "increment") && numeric === null)}
          onChange={(entered) => {
            if (entered === null) {
              if (id === "timeCapSeconds") setAnswers((current) => withAnswer(current, id, null));
              return;
            }
            setAnswers((current) => withAnswer(current, id, entered));
          }}
          {...binding}
          onFocus={() => {
            binding.onFocus();
            if (isVariable) confirmVariable();
          }}
          label={label}
          testID={`format-${id}`}
        />
      </Row>
    );
  };
  const switchRow = (id: "buyIn" | "buyOut" | "increasingVolume" | "withLoad", label: string) => (
    <Row key={id} label={label} testID={`format-row-${id}`}>
      <Switch
        {...switchOffColors}
        value={answers[id] === true}
        onValueChange={(value) => {
          setAnswers((current) => withAnswer(current, id, value));
          // Buy-in désactivé : la section Buy-in disparaît avec son mouvement.
          if (id === "buyIn" && !value) {
            setMovements((current) => current.filter((item) => item.buyIn !== true));
            setSearchRole((current) => (current === "BUY_IN" ? null : current));
          }
          if (id === "buyOut" && !value) {
            setMovements((current) => current.filter((item) => item.buyOut !== true));
            setSearchRole((current) => (current === "BUY_OUT" ? null : current));
          }
        }}
        accessibilityLabel={label}
        testID={`format-${id}`}
      />
    </Row>
  );
  // [For time — ligne d’un bloc buy-in ou buy-out, « Sans » ou un nombre de séries (correction 2 du 14/11/2026), retrait annoncé à la
  // fermeture du clavier (recette du 15/11/2026, i7) — remplacé le 15/11/2026 (décision de Hermann, registre ch07, « For time —
  // tableau unique, sans questionnaire ») : le nombre de séries du buy-in et du buy-out est le nombre de colonnes, réglé par − / +.]
  const readRow = (label: string, text: string, key: string, last = false) => (
    <Row key={key} label={label} last={last} testID={`format-row-${key}`}>
      <Text style={styles.readValue} testID={`format-${key}`}>
        {text}
      </Text>
    </Row>
  );
  const totalRow = (last: boolean) => readRow(t().totalDuration, movements.length === 0 && duration === null ? genericDuration(model, answers, formatDuration) : duration === null ? t().dash : modelDurationText(duration, formatDuration), "total", last);

  const options = executionOptions(model);
  // Décision de Hermann du 14/11/2026 (« C'est exactement ça, Buy In, tous les tours de A, tous les tours de B..., Buy out ») : For time, dès deux exercices en tour.
  const showExecution = showsExecution(model, movements);
  const execution: ModelExecution = answers.execution ?? options[0] ?? "SEQUENCE";
  /**
   * Constat a) de la recette du 18/11/2026 (Hermann, « Concept série / tour de l'EMOM à plusieurs mouvements ») : EMOM à plusieurs
   * mouvements joué « Dans chaque intervalle » ou « En alternance » — le nombre N se lit en tours (questionnaire « Nombre de tours »,
   * colonnes T1 … TN). « À la suite » et EMOM à un seul mouvement : séries, inchangé.
   */
  const emomRounds = () => model === "EMOM" && showExecution && execution !== "SEQUENCE";
  const executionRow = (last = true) => (
    <Row key="execution" label={t().execution} last={last} testID="format-row-execution">
      <ExecutionMenu options={options} execution={execution} onSelect={(option) => setAnswers((current) => ({ ...current, execution: option }))} />
    </Row>
  );


  /**
   * Complément du 5 novembre 2026 (Hermann), §15–§16 : un seul mouvement (Tabata, 30/30, Renforcement, À l'échec, Death by) — ligne « Charge » dans le cadre des
   * paramètres, sous Durée totale ; une charge commune, saisie au clavier (pavé décimal) ; vide : sans charge.
   */
  const chargeRow = () => {
    const movement = movements[0];
    if (movement === undefined) return null;
    const key = answerFieldKey("withLoad").replace("withLoad", "charge");
    const binding = cellBinding(key);
    return (
      <Row key={key} label={t().rows.load} last testID="format-row-charge">
        <TableCell
          kind="decimal"
          value={movement.values.loadOn === true ? (movement.values.loadKg ?? null) : null}
          format={formatLoad}
          entrySuffix=" kg"
          placeholder={t().dash}
          badge
          // Recette du 06/11/2026 (t-coche-direct, Hermann : « un mouvement : après activation des charges, le cadre de valeur de la charge
          // doit être orange ») : charge à renseigner, cadre orange.
          pending={movement.values.loadOn !== true || movement.values.loadKg == null}
          onChange={(value) => updateValues(0, { ...movement.values, loadKg: value, loadOn: value !== null })}
          {...binding}
          label={t().rows.load}
          testID="format-charge"
        />
      </Row>
    );
  };

  // [Complément du 5 novembre 2026 (Hermann), §9 : « (+ kg) » sous le nom (`addLoad`, charge activée et clavier sur sa première case)
  // — remplacé le 16/11/2026 (décision de Hermann) : la charge s'active et se retire dans la modale des paramètres d'exécution.]

  // Complément du 5 novembre 2026 (§9) : « Vider toutes les cases retire la ligne à la fermeture du clavier, et « + kg »
  // revient ; il n'y a rien à restaurer. »
  useEffect(() => {
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () =>
      setMovements((current) => {
        let changed = false;
        const next = current.map((movement) => {
          const values = movement.values;
          if (values.loadOn !== true) return movement;
          const loads = values.cells !== undefined ? values.cells.map((cell) => cell.loadKg) : values.loads !== undefined ? values.loads : [values.loadKg ?? null];
          if (loads.some((load) => load !== null && load !== undefined)) return movement;
          changed = true;
          return { ...movement, values: { ...values, loadOn: false } };
        });
        return changed ? next : current;
      }),
    );
    return () => hide.remove();
  }, [setMovements]);

  const rows = parameterRows();
  // Complément du 5 novembre 2026 (Hermann), §12 : lignes posées au-dessus du tableau (nombre de séries, de tours, intervalle du Death by, durée de l'AMRAP),
  // les autres dans le cadre qui le suit.
  // For time sans questionnaire (15/11/2026) : carte des paramètres entière, puis les trois blocs (`ForTimeBlocks`), hors du cadre des
  // tableaux. [Tableaux For time entre « Nombre de tours » et les paramètres qui suivent, « Exécution » au-dessus de « Nombre de
  // tours » (Figma `8624:30672`, archivé) — remplacés.]
  // Formats à tableau, écran unique (15/11/2026 ; Figma `12455:26716` et suivants) : cadre des paramètres entier, puis le tableau des
  // mouvements pleine largeur (`formatBlocks`). [Tableau entre deux cadres de paramètres (Complément du 5 novembre 2026, §12) — remplacé.]
  // Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « Progression : il manque la pause » ; « ne pas calculer de durée total sur
  // l'écran Questionnaire » ; « la ligne du mode d'exécution est la dernière, après la durée totale ») ; MAJ 04/11 §6 quater :
  // « Avec charge » au questionnaire seulement, après Pause.
  function progressionTail(): React.ReactNode {
    if (model !== "PROGRESSION") return null;
    // [Pause commune (recette n° 3 du 03/11/2026) — retirée le 25/11/2026 par D-607 (D-572 point 2, Hermann : « Progression : retirer la
    // pause comme paramètre global ») ; la pause de chaque série reste dans le tableau.]
    return (
      <>
        {stage === "questionnaire" ? switchRow("withLoad", t().rows.withLoad) : null}
        {stage === "summary" ? totalRow(!showExecution) : null}
        {showExecution ? executionRow() : null}
      </>
    );
  }
  function parameterRows(): React.ReactNode[] {
    const several = movements.length > 1;
    const sequence = execution === "SEQUENCE";
    const withExecution = (items: React.ReactNode[]) => (showExecution ? [...items, executionRow()] : items);
    const r = t().rows;
    // Complément du 5 novembre 2026 (Hermann), §16 : « Avec charge » dans les dix questionnaires (désactivé par défaut).
    const loadSwitch = stage === "questionnaire" ? [switchRow("withLoad", r.withLoad)] : [];
    // Complément du 5 novembre 2026 (Hermann), §15–§16 : un seul mouvement — ligne Charge sous Durée totale ; plusieurs : tableau par mouvement (récapitulatif),
    // lignes communes Travail par série / Répétitions par série / Pause retirées des paramètres.
    const single: React.ReactNode[] = [];
    void chargeRow;
    // Formats à tableau, écran unique (15/11/2026) : le tableau porte toujours l'objectif, la pause et la charge de chaque mouvement,
    // même seul — plus de lignes communes Travail / Répétitions / Pause ni de ligne Charge. [Un seul mouvement : lignes communes et ligne
    // Charge sous Durée totale (Complément du 5 novembre 2026, §15–§16) — remplacé.]
    const byMovement = true;
    void several;
    switch (model) {
      case "TABATA":
      case "INTERVALS_30_30":
      case "HIIT":
        return withExecution([
          stepRow("seriesCount", r.seriesCount),
          ...(byMovement ? [] : [stepRow("workSeconds", r.workSeconds), stepRow("pauseSeconds", r.pauseSeconds)]),
          ...loadSwitch,
          totalRow(!showExecution && single.length === 0),
          ...single,
        ]).concat(model === "TABATA" && several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds, { last: true })] : []);
      case "EMOM":
        // MAJ 04/11 §4.2 : ligne « Repos · jusqu'à la cadence » retirée ; §6 quater bis : « Avec charge » avant la durée totale.
        // Constat a) de la recette du 18/11/2026 (Hermann) : « Dans chaque intervalle » et « En alternance », « Nombre de tours » ; le
        // libellé suit le mode sélectionné. « À la suite » et un seul mouvement : « Nombre de séries » (inchangé). La réponse reste
        // `seriesCount`.
        return withExecution([
          stepRow("seriesCount", emomRounds() ? r.roundCount : r.seriesCount),
          stepRow("intervalSeconds", r.intervalSeconds),
          ...(stage === "questionnaire" ? [switchRow("withLoad", r.withLoad)] : []),
          totalRow(!showExecution),
        ]).concat(
          several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds, { last: true })] : [],
        );
      case "DEATH_BY":
        // MAJ 04/11 §4.3 : à plusieurs mouvements, le tableau Départ | Incrément remplace les lignes communes — recette du
        // 04/11/2026 (f4-modale, Hermann : « Il faut que ce soit le cas dès la saisie du deuxième mouvement pour la première
        // fois, pas seulement après la validation des paramètres ») : au questionnaire aussi.
        // Complément du 5 novembre 2026 (Hermann), §13 : « Objectif de départ » et incrément dans l'unité du mouvement (Répétitions ou Durée, au clavier).
        return withExecution([
          stepRow("intervalSeconds", r.intervalSeconds),
          // Formats à tableau (15/11/2026) : un seul mouvement aussi — Départ et Incrément dans le tableau (réponses communes du Format).
          // [Lignes « Objectif de départ » et « Incrément » du questionnaire (§13) — remplacées.]
          // Recette du 06/11/2026 (n-deathby, Hermann : « Mettre la ligne "Récupération entre les mouvements avant la ligne condition
          // d'arrêt ») : la récupération précède la condition d'arrêt. [Récupération en dernière ligne — remplacé.]
          ...(several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds)] : []),
          readRow(r.stopCondition, t().atFailure, "stop", !showExecution && loadSwitch.length === 0 && single.length === 0),
          ...loadSwitch,
          ...single,
        ]);
      case "AMRAP": {
        // Décision de Hermann du 16/11/2026 (registre ch07, « AMRAP — réglages conservés (16/11/2026) » ; CE-FMT-02 §8, « AMRAP — cadre
        // des paramètres ») : Durée ; Nombre d'AMRAP (1 par défaut) ; Repos entre deux AMRAP, seulement au-delà d'un AMRAP ; Repos après
        // chaque tour de boucle (0″ par défaut). [Cadre réduit à la seule ligne « Durée » (15/11/2026) — remplacé.]
        if (stage === "summary")
          return [
            stepRow("durationSeconds", (answers.blockCount ?? 1) > 1 || several || (answers.loopRestSeconds ?? 0) > 0 ? r.blockDuration : r.durationSeconds),
            stepRow("blockCount", r.blockCount),
            ...((answers.blockCount ?? 1) > 1 ? [stepRow("restBetweenBlocksSeconds", r.restBetweenBlocksSeconds)] : []),
            stepRow("loopRestSeconds", r.loopRestSeconds, { last: true }),
          ];
        return [
          stepRow("durationSeconds", r.durationSeconds),
          stepRow("blockCount", r.blockCount),
          ...((answers.blockCount ?? 1) > 1 ? [stepRow("restBetweenBlocksSeconds", r.restBetweenBlocksSeconds)] : []),
          stepRow("loopRestSeconds", r.loopRestSeconds),
          switchRow("buyIn", r.buyIn),
          switchRow("increasingVolume", r.increasingVolume),
          switchRow("withLoad", r.withLoad),
        ];
      }
      case "FOR_TIME":
        // Décision de Hermann du 14/11/2026 (« C'est exactement ça, Buy In, tous les tours de A, tous les tours de B..., Buy out » ;
        // « Correction — For time : ajouter le mode d’exécution « En alternance » / « À la suite » », Figma « For time — Récapitulatif »
        // `8624:30672`, FT-20 à FT-23) : ligne « Exécution » au-dessus de « Nombre de tours », dès deux exercices en tour ; « À la
        // suite » : « Nombre de séries » et « Repos entre les séries ».
        // Recette du 15/11/2026 (Hermann, fx1 : « La ligne Exécution doit être la dernière du questionnaire ») : au questionnaire,
        // dernière ligne ; au récapitulatif, au-dessus de « Nombre de tours » (Figma `8624:30672`). [Au-dessus de « Nombre de tours »
        // au questionnaire aussi — remplacé.]
        // Décision de Hermann du 15/11/2026 (registre ch07, « For time — tableau unique, sans questionnaire » ; CE-FMT-02 §8, Figma
        // `12341:27002`) : carte des paramètres toujours visible — Nombre de tours, Repos entre les tours, Temps limite, puis Exécution
        // (dernière ligne, dès deux exercices en tour). [Questionnaire (lignes Buy-in / Buy-out, « Avec charge ») et Exécution au-dessus
        // de « Nombre de tours » au récapitulatif — remplacés.]
        // Recette du 17/11/2026 (Hermann : « Temps de repos supprimés en For time : […] Repos entre les tours. • Repos entre les séries
        // (mode « À la suite »). […] Ces lignes n'apparaissent ni dans les paramètres d'exécution, ni dans le questionnaire, ni dans le
        // récapitulatif du For time. • Les valeurs déjà saisies sont ignorées, sans être effacées ni modifiées ») : Nombre de tours, Temps
        // limite, puis Exécution ; la réponse `restBetweenRoundsSeconds` reste enregistrée telle quelle. [Ligne « Repos entre les tours » /
        // « Repos entre les séries » entre « Nombre de tours » et « Temps limite » — remplacé.]
        return [
          stepRow("roundCount", showExecution && sequence ? r.seriesCount : r.roundCount),
          stepRow("timeCapSeconds", r.timeCapSeconds, { last: !showExecution }),
          ...(showExecution ? [executionRow()] : []),
        ];
      case "STRENGTH":
        // Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « Il manque le champ de la Pause ») : Pause toujours affichée.
        return withExecution([
          stepRow("seriesCount", r.seriesCount),
          ...(byMovement
            ? []
            : [stepRow("repetitions", r.repetitions), stepRow("pauseSeconds", r.pauseSeconds, { fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0 })]),
          ...loadSwitch,
          totalRow(!showExecution && single.length === 0),
          ...single,
        ]);
      case "UNTIL_FAILURE":
        // Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « A l'échec : ne pas mettre le champ de la durée totale,
        // retirer la ligne »). Complément du 5 novembre 2026 (Hermann), §16 (Figma « À l'échec — Questionnaire ») : Pause et « Avec charge » ; ligne Charge en dernier.
        return withExecution([
          stepRow("seriesCount", r.seriesCount, { last: byMovement && !showExecution }),
          ...(byMovement
            ? []
            : [
                readRow(r.targetPerSeries, t().atFailure, "target"),
                stepRow("pauseSeconds", r.pauseSeconds, { fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0, last: !showExecution && loadSwitch.length === 0 && single.length === 0 }),
              ]),
          ...loadSwitch,
          ...single,
        ]);
      case "PROGRESSION":
        // Suivies du tableau (récapitulatif), de la Pause, de la durée totale et de l'Exécution (sous le tableau).
        // Formats à tableau (15/11/2026, Figma `12445:26518`) : Pause, Durée totale et Exécution dans le même cadre, tableau dessous.
        return [stepRow("seriesCount", r.seriesCount)];
      case "SUPERSET":
        // Recette du 04/11/2026 (x-sans-recap, Hermann : « Superset : questionnaire : il manque la ligne de récupération après
  // la paire ; on ne doit pas pouvoir sélectionner plus de deux exercices, afficher un message ») : la récupération après la paire (portée par le dernier exercice, §9.2) est réglable ; valeur initiale =
        // récupération après l'activité du dernier exercice.
        // Complément du 5 novembre 2026 (Hermann), §11 : « Répétitions par série » retirée (l'objectif dépend du mouvement) ; Circuit (3 tours), « Récupération
        // après le tour » (Récupération du dernier Exercice actuel ; absente : à renseigner, zéro conservé), Durée totale.
        return [
          stepRow("roundCount", r.supersetRounds, { format: (value) => `${value} ${pluralOf(value, { one: t().roundUnit.one, other: t().roundUnit.many })}` }),
          stepRow("recoveryBetweenSeconds", r.recoveryAfterPair, { fallback: movements[movements.length - 1]?.exercise.postActivityRecoverySeconds ?? undefined, placeholder: t().dash, missing: movements.length > 0 && supersetRecovery(answers, movements) === null }),
          ...loadSwitch,
          totalRow(true),
        ];
      default: {
        const unreachable: never = model;
        return unreachable;
      }
    }
  }

  const scrollRef = useRef<ScrollView>(null);
  // Recette du 05/11/2026 au soir (s-fond, Hermann : « Faire défiler la liste vers le haut, puis lancer une recherche [...] La recherche
  // trouve les mouvements mais ils ne sont pas visibles car au dessus de la barre de recherche. Il faut que les résultats soient
  // affichés à partir du bas de la barre de recherche, et qu’ils puissent défiler ensuite vers le haut ou le bas ») : à chaque
  // recherche ou filtre, la liste repart de son début, juste sous la zone de recherche.
  // 08/11/2026 : défilement propre à la couche du catalogue ; les paramètres, dessous, gardent leur position.
  useEffect(() => {
    if (!catalogueMode) return;
    catalogueScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [catalogueFilters, catalogueMode, query]);
  const scrollY = useRef(0);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  /** Ligne dont l'unité vient d'être choisie : sa première case prend le focus après le rendu (recette du 16/11/2026). */
  const unitFocusRow = useRef<number | null>(null);
  /**
   * Recette iPhone du 16/11/2026 (Hermann, fmt-entree : « on devrait pouvoir réordonner les mouvements du tableau avec un appui long ») :
   * déplacement d'un mouvement dans son bloc. [Appui long des cartes de mouvement — retiré le 15/11/2026 avec les cartes, rétabli
   * sur les lignes du tableau.]
   */
  const reorderMovement = (from: number, to: number) =>
    setMovements((current) => {
      const moved = current[from];
      const target = current[to];
      if (moved === undefined || target === undefined || movementRole(moved) !== movementRole(target)) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // [Appui long qui soulève et déplace une carte de mouvement (recette n° 3 du 02/11/2026, constat du 06/11/2026, geste natif de
  // react-native-gesture-handler) — remplacé le 15/11/2026 avec les cartes (écran unique des Formats à tableau, comme le For time) :
  // le déplacement reste offert par les actions VoiceOver Monter / Descendre de chaque ligne.]

  const tableShown = true;
  const cellOrder = useMemo(() => (tableShown ? tableCellOrder(model, movements, answers) : []), [answers, model, movements, tableShown]);
  // Unité de l'objectif au clavier (MAJ 04/11 §4.5) : barre Répétitions | Durée, puis unité choisie, Précédent, Suivant.
  const focusedCellKey = focusedCell === null ? null : parseCellKey(focusedCell);
  const unitRow = focusedCellKey !== null && focusedCellKey.kind === "obj" ? focusedCellKey.row : null;
  // D-531 / RM-271 (Hermann, 19/11/2026) : Max grisé pour un mouvement d'une boucle de plusieurs mouvements ; l'appui sur le Max grisé
  // montre le message court sous le tableau, comme la Durée refusée (n-charge-colonne). Ligne touchée ; `null` : aucun message.
  const [maxNoteRow, setMaxNoteRow] = useState<number | null>(null);
  const maxNoteShown = maxNoteRow !== null && maxLocked(model, movements, maxNoteRow) && movements[maxNoteRow]?.values.max !== true;
  // Recette du 05/11/2026 (constat f, Hermann : « Death by : le clavier du tableau d'objectifs n'a pas d'unité ») : la barre
  // montre l'unité de Départ et d'Incrément. Complément du 5 novembre 2026 (Hermann), §13 : Répétitions ou Durée, choisie au clavier ; un seul mouvement : sur
  // l'Objectif de départ et l'Incrément du questionnaire. [Répétitions seule admise — remplacé.]
  const deathByAnswerField = model === "DEATH_BY" && movements.length === 1 && (focusedCell === answerFieldKey("startRepetitions") || focusedCell === answerFieldKey("increment"));
  const deathByRow =
    deathByAnswerField ? 0 : focusedCellKey !== null && model === "DEATH_BY" && (focusedCellKey.kind === "start" || focusedCellKey.kind === "sinc") ? focusedCellKey.row : null;
  const unitsBar =
    deathByRow !== null && movements[deathByRow] !== undefined
      ? {
          current: movements[deathByRow]!.values.mode ?? ("REPETITIONS" as const),
          picking: unitPicking,
          allowed: ["REPETITIONS" as const, "DURATION" as const],
          onPick: (mode: "REPETITIONS" | "DURATION") => {
            setUnitPicking(false);
            const current = movements[deathByRow]!;
            if ((current.values.mode ?? "REPETITIONS") === mode) return;
            updateValues(deathByRow, withMovementMode(current.values, mode));
            // Un seul mouvement : départ et incrément du questionnaire à renseigner dans la nouvelle unité, sans conversion.
            if (deathByAnswerField)
              setAnswers((answersNow) => {
                const { startRepetitions: _start, increment: _increment, ...rest } = answersNow;
                return rest;
              });
          },
          onReopen: () => setUnitPicking(true),
        }
      : unitRow === null || movements[unitRow] === undefined || model === "TABATA" || model === "INTERVALS_30_30" || model === "HIIT"
      ? null
      : {
          current: movements[unitRow]!.values.mode ?? ("REPETITIONS" as const),
          // Ligne sans unité (EMOM, recette du 04/11/2026) : la barre propose d'abord Répétitions | Durée.
          picking: unitPicking || movements[unitRow]!.values.mode === undefined,
          allowed: allowedModes(model, movements, unitRow),
          onPick: (mode: "REPETITIONS" | "DURATION") => {
            setUnitPicking(false);
            const current = movements[unitRow]!;
            if (!allowedModes(model, movements, unitRow).includes(mode)) return;
            updateValues(unitRow, withMovementMode(current.values, mode));
          },
          onReopen: () => setUnitPicking(true),
        };
  // Complément du 5 novembre 2026 (Hermann), §8 : « ± | Précédent | Suivant | Fermer » sur l'Incrément par tour AMRAP (incrément signé). [EMOM : incrément de
  // charge signé (Hermann, 04/11/2026) — remplacé : l'EMOM n'a plus d'incrément, §14.]
  const signRow = focusedCellKey !== null && focusedCellKey.kind === "inc" && model === "AMRAP" ? focusedCellKey.row : null;
  const signBar =
    signRow === null || focusedCell === null || movements[signRow] === undefined
      ? null
      : (() => {
          const values = movements[signRow]!.values;
          const negative = (cellSigns[focusedCell] ?? ((values.increment ?? 0) < 0 ? -1 : 1)) < 0;
          return {
            negative,
            onPress: () => {
              setCellSigns((current) => ({ ...current, [focusedCell]: negative ? 1 : -1 }));
              if (values.increment != null && values.increment !== 0) updateValues(signRow, { ...values, increment: -values.increment });
            },
          };
        })();
  // Hermann, 05/11/2026 : « Un point à corriger pour tous les écrans questionnaires, récapitulatif : on utilise
  // systématiquement le clavier pour renseigner les valeurs, plus aucun stepper et de roulette. L'appui sur suivant permet de
  // passer d'une valeur à l'autre, aussi entre deux lignes ou d'une ligne à un tableau. »
  // Ordre de Suivant : valeurs des lignes de paramètres dans l'ordre affiché, puis cases du tableau (Progression : tableau
  // entre le nombre de séries et la Pause, rangés dans le même cadre).
  const rowFields = rows.flatMap((node) => (isValidElement(node) && typeof node.key === "string" && node.key.startsWith(ANSWER_FIELD_PREFIX) ? [node.key] : []));
  // Complément du 5 novembre 2026 (Hermann), §12 : lignes du cadre au-dessus du tableau, cases du tableau, puis lignes du cadre qui le suit.
  // Death by à un mouvement : Départ et Incrément du tableau sont les réponses communes du Format.
  const deathBySingleFields =
    model === "DEATH_BY" && movements.length === 1
      ? [answerFieldKey("startRepetitions"), answerFieldKey("increment"), ...(movements[0]!.values.loadOn === true ? [cellKey("load", 0)] : [])]
      : [];
  // Formats à tableau (15/11/2026) : lignes du cadre des paramètres (Progression : Pause comprise), puis cases du tableau.
  const fieldOrder = [...rowFields, ...deathBySingleFields, ...cellOrder];
  const focusedAt = focusedCell === null ? -1 : fieldOrder.indexOf(focusedCell);
  // Recette iPhone du 16/11/2026 (Hermann, fmt-entree : « après le choix de l'unité, le focus doit aller directement sur le premier champ
  // éditable de la ligne ») : une fois la ligne rendue dans sa nouvelle unité, le clavier s'ouvre sur sa première case (Death by à un
  // mouvement : Départ).
  useEffect(() => {
    const row = unitFocusRow.current;
    if (row === null) return;
    unitFocusRow.current = null;
    const first = deathBySingleFields.length > 0 ? deathBySingleFields[0] : cellOrder.find((key) => parseCellKey(key)?.row === row);
    focusCell(first);
  });
  // Hermann, 04/11/2026 : « Ouvrir le clavier doit positionner le bas du tableau des objectifs juste au-dessus du clavier,
  // toutes les lignes du tableau doivent être visibles. » Le bas du tableau est placé au-dessus du clavier et de sa barre ;
  // un tableau plus haut que la place disponible garde au moins la case active visible.
  const tableRef = useRef<View>(null);
  // Hermann, 04/11/2026 : « la dernière ligne du tableau est bien au-dessus du clavier, mais pas au-dessus de la barre
  // optionnelle du clavier ». Mesures relevées sur iPhone : dans la feuille native, `measureInWindow` compte depuis le haut
  // de la feuille (racine à y = 0, hauteur 780 puis 802 quand le clavier s'ouvre), alors que le clavier est situé depuis le
  // haut de l'écran. Chaque mesure est ramenée à l'écran par la position de la feuille relevée au même moment (bas de la
  // feuille au bas de l'écran) ; la barre, elle, part du bas de la fenêtre (placement constaté juste).
  useEffect(() => {
    // Position de clavier parasite (0 relevé sur iPhone) : aucun alignement.
    if (focusedCell === null || keyboardFrame === null || keyboardFrame.screenY <= 0 || keyboardFrame.screenY >= windowHeight) return;
    const limit = keyboardFrame.screenY - (Platform.OS === "ios" ? barHeight : 0) - CELL_REVEAL_MARGIN;
    const scrollBy = (delta: number) => scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: !reduceMotion });
    const align = () => {
      const root = rootRef.current;
      if (root === null) return;
      root.measureInWindow((_rootX, rootY, _rootWidth, rootHeight) => {
        // Décalage du repère mesuré vers l'écran : nul si les mesures sont déjà celles de l'écran.
        const offset = windowHeight - (rootY + rootHeight);
        const revealCell = () =>
          cellInputs.current.get(focusedCell)?.measureInWindow((_x, y, _width, height) => {
            const delta = y + height + offset - limit;
            if (delta > 0) scrollBy(delta);
          });
        const table = tableRef.current;
        if (table === null || focusedCell.startsWith(ANSWER_FIELD_PREFIX)) {
          revealCell();
          return;
        }
        table.measureInWindow((_x, y, _width, height) => {
          const visibleTop = rootY + offset + bandHeight;
          if (height > limit - visibleTop) {
            revealCell();
            return;
          }
          const delta = y + height + offset - limit;
          if (Math.abs(delta) >= 1) scrollBy(delta);
        });
      });
    };
    align();
    // Hermann, 04/11/2026 : « Lorsque le clavier [s'ouvre], la dernière ligne du tableau doit rester au-dessus du clavier. »
    // La feuille grandit et la liste réserve sa marge au clavier après l'annonce : l'alignement est refait une fois en place.
    const settle = setTimeout(align, (keyboardFrame.duration > 0 ? keyboardFrame.duration : 250) + 120);
    return () => clearTimeout(settle);
  }, [bandHeight, barHeight, focusedCell, keyboardFrame, reduceMotion, windowHeight]);

  // Familles de Niveaux : cartes reliées par le filet des niveaux (suggestions et mode catalogue).
  // Recette du 05/11/2026 (e-cat-filet, Hermann : « Les cartes se replient, mais il n'y a pas de pile, seule celle de haut
  // niveau apparaît sans affichage d'une pile. […] le filet reste présent sur la carte du dessus, appuyer sur le filet déplie
  // la pile ; la pile se matérialise avec les deux cartes qui dépassent par le bas (modèle du catalogue des mouvements) ») :
  // en mode catalogue, une pile repliée garde son filet et montre deux feuilles sous la carte du dessus.
  const collapsedPile = (item: Extract<MovementCatalogueItem, { kind: "PILE" }>, card: CatalogueCard) => {
    const leaves = Math.min(item.members.length - 1, 2);
    return (
      <View key={item.key} style={[styles.family, { paddingBottom: leaves * PILE_LEAF_STEP }]} testID={`format-family-${item.key}-collapsed`}>
        {Array.from({ length: leaves }, (_, index) => leaves - index).map((depth) => (
          <Reanimated.View
            key={`leaf-${depth}`}
            entering={reduceMotion ? undefined : pileLeafEntering}
            style={[styles.pileLeaf, { top: depth * PILE_LEAF_STEP, bottom: (leaves - depth) * PILE_LEAF_STEP, left: 8 + depth * PILE_LEAF_INSET, right: depth * PILE_LEAF_INSET }]}
            accessible={false}
            importantForAccessibility="no"
            testID={`format-family-${item.key}-leaf-${depth}`}
          />
        ))}
        <Pressable
          onPress={() => expandPile(item.key)}
          accessibilityRole="button"
          accessibilityLabel={t().expandPiles}
          // Recette du 05/11/2026 (g-cat-pile, Hermann : « Le filet ne reste pas sur la pile ») : le filet longe la carte du
          // dessus (marges de 8), au lieu de partir du milieu de la première carte comme pour une pile dépliée.
          style={[styles.familyRailZone, { top: 8, bottom: 8 + leaves * PILE_LEAF_STEP }]}
          testID={`format-family-${item.key}-expand`}
        >
          <View style={styles.familyRailLine} />
        </Pressable>
        {/* Recette iPhone du 07/11/2026 (Hermann, remarque A : « format > catalogue : appuyer sur la carte d'une pile repliée ne la
            sélectionne pas mais la déplie. Appuyer sur une carte dépliée la sélectionne. ») : la carte du dessus d'une pile
            repliée déplie la pile, sans la cocher. [Avant : elle se cochait — remplacé.] Au-dessus des cartes qui rentrent. */}
        <View style={{ zIndex: item.members.length }}>{card(item.members[0]!, () => expandPile(item.key))}</View>
      </View>
    );
  };
  const familyCards = (items: readonly MovementCatalogueItem[], card: CatalogueCard, collapsed: boolean, railActive = false) =>
    items.map((item) => {
      const rendered =
        item.kind === "PILE" && railActive && collapsedPiles.has(item.key) ? (
          collapsedPile(item, card)
        ) : item.kind === "PILE" && !collapsed ? (
          <View key={item.key} style={styles.family} testID={`format-family-${item.key}`}>
            {railActive ? (
              <Pressable
                onPress={() => {
                  markPilesMoving();
                  setCollapsedPiles((current) => new Set([...current, item.key]));
                }}
                accessibilityRole="button"
                accessibilityLabel={t().collapsePiles}
                style={styles.familyRailZone}
                testID={`format-family-${item.key}-rail`}
              >
                <View style={styles.familyRailLine} />
              </Pressable>
            ) : (
              <View style={styles.familyLine} />
            )}
            {railActive
              ? // Remarque D du 07/11/2026 (« replier et déplier les mouvements lentement avec un glissement des cartes ») : au
                // dépli, chaque carte glisse depuis la carte du dessus jusqu'à sa place ; au repli, elle y remonte, sous elle.
                item.members.map((entry, index) => (
                  <Reanimated.View
                    key={entry.movement.id}
                    entering={index > 0 && pilesMoving ? pileMemberEntering(-index * PILE_MEMBER_STEP) : undefined}
                    exiting={index > 0 && pilesMoving ? pileMemberExiting(-index * PILE_MEMBER_STEP) : undefined}
                    style={{ zIndex: item.members.length - index }}
                    testID={`format-family-${item.key}-member-${entry.movement.id}`}
                  >
                    {card(entry)}
                  </Reanimated.View>
                ))
              : item.members.map((entry) => card(entry))}
          </View>
        ) : (
          card(item.kind === "PILE" ? item.members[0]! : item.entry)
        );
      if (!railActive) return rendered;
      const key = item.key;
      // Mode catalogue : les cartes suivantes glissent pendant un repli ou un dépli (`pilesMoving`). Recette iPhone du 07/11/2026
      // (Hermann, remarque H : « aligner a droite les cartes de mouvement sans famille avec les cartes qui ont une famille ») :
      // une carte sans famille prend le retrait de 8 des cartes d'une pile (place du filet). [Avant : bord gauche de la liste —
      // remplacé.]
      return (
        <Reanimated.View
          key={key}
          layout={pilesMoving ? catalogueLayoutTransition : undefined}
          style={item.kind === "SINGLE" ? styles.familySingle : null}
          testID={`format-catalogue-item-${key}`}
        >
          {rendered}
        </Reanimated.View>
      );
    });

  // Section de mouvements : en-tête et lien « + Ajouter », qui ouvre directement le mode catalogue (§19).
  const sectionLink = (role: "LOOP" | "BUY_IN" | "BUY_OUT", link: string) => {
    return {
      text: link,
      onPress: () => {
        {
          // [Contre-recette n° 3 ter du 03/11/2026 (Hermann : « changer de Buy-in doit effacer le mouvement avant de positionner
          // le curseur sur le champ ») : « Changer » retirait le buy-in (ou le buy-out) choisi — remplacé le 08/11/2026 au soir
          // (plusieurs buy-in / buy-out) : « + Ajouter » ajoute sans retirer ; un mouvement se retire par son glisser.]
          setQuery("");
          setSearchRole(role);
          openCatalogue();
        }
      },
    };
  };
  /**
   * Lien de l'en-tête d'une section (D-572, 25/11/2026, Formats § 9.9) : « + Ajouter » tant qu'aucun mouvement n'y est choisi, puis
   * « + Modifier », qui ouvre le catalogue en modification (`editSection`). [« + Ajouter » qui ajoute sans retirer, sections déjà
   * garnies comprises (08/11/2026 au soir) — remplacé.]
   */
  const sectionAction = (role: SectionRole) =>
    movements.some((item) => sectionRoleOf(item) === role) ? { text: t().editMovements, onPress: () => editSection(role) } : sectionLink(role, t().add);
  // Mode catalogue : en-tête de la section et ligne de recherche, figés dans la zone de contexte (recette du 04/11/2026,
  // f4-catalogue : « la zone colorée jusqu'à la ligne de recherche et avec les boutons de filtre, de tri et de pli doit
  // rester figée, le catalogue doit dérouler par-dessous »).
  const catalogueHead = () => {
    if (searchRole === null) return null;
    const role = searchRole;
    const label = role === "BUY_IN" ? t().buyInPickerTitle : role === "BUY_OUT" ? t().buyOutPickerTitle : buyIn || buyOut ? loopLabelOf() : t().movements;
    const testID = role === "BUY_IN" ? "format-buy-in" : role === "BUY_OUT" ? "format-buy-out" : buyIn || buyOut ? "format-loop" : "format-movements";
    return (
      <>
        <SectionHeader label={label} link={t().backToParameters} onLink={backToParameters} testID={testID} />
        <View style={[styles.search, styles.catalogueHead]} testID="format-catalogue">
          <View style={styles.catalogueCommands}>
            <Reanimated.View layout={LinearTransition.duration(220)} style={styles.catalogueField}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                // Demande de Hermann du 05/11/2026 (soir) : « on ne met pas le focus dans la barre de recherche par défaut ».
                // [§19 : « champ de recherche actif, clavier ouvert » — remplacé.]
                autoFocus={catalogueFocus}
                placeholder={t().searchPlaceholder}
                // « L'invite nom du mouvement est écrite en plus petit et surtout en gris clair, et ensuite en noir. »
                placeholderTextColor={SEARCH_PLACEHOLDER}
                returnKeyType="search"
                // Recette du 05/11/2026 (constat d, Hermann : « appuyer sur "Entrée" / "Bouton de clavier de recherche" devrait
                // afficher le résultat de la recherche, fermer le clavier et enlever le focus de la zone de recherche. Cliquer
                // dans la zone de recherche doit rouvrir le clavier »).
                submitBehavior="blurAndSubmit"
                style={[styles.searchInput, styles.catalogueSearchInput, query.length > 0 ? styles.searchInputWithClear : styles.searchInputEmpty]}
                accessibilityLabel={strings.screens.movement.catalogue.searchAccessibilityLabel}
                testID="format-catalogue-search"
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel={strings.screens.movement.catalogue.searchClear}
                  hitSlop={8}
                  style={styles.searchClear}
                  testID="format-catalogue-search-clear"
                >
                  <KodjoIcon name="control-close" size={12} />
                </Pressable>
              ) : null}
            </Reanimated.View>
            {commandsShown ? (
              <Reanimated.View style={styles.catalogueButtons}>
                <FilterCommand
                  label={strings.screens.sessions.filterAction}
                  title={strings.screens.movement.catalogue.filters.command}
                  summary={filterSummary}
                  clearLabel={strings.screens.movement.catalogue.filters.clearAccessibility}
                  editLabel={strings.screens.movement.catalogue.filters.editAccessibility}
                  onOpen={() => {
                    // Recette du 06/11/2026 (x-dedans, Hermann : « Ouvrir toutes les modales de filtre comme une modale iOS » ;
                    // « L'arrêter en fait sous le bouton Annuler de la fenêtre du questionnaire ») : feuille native (route
                    // `catalogue-filters`) par-dessus cette fenêtre, haut sous la croix. [Feuille dessinée `docked` — remplacée.]
                    requestFilterSheet({
                      kind: "movements",
                      filters: catalogueFilters,
                      onApply: (next, labels) => {
                        setCatalogueFilters(next);
                        setFilterLabels(labels);
                      },
                      sheetTop: MODAL_TOP + styles.context.paddingTop + (styles.modalHeader.height + dimensions.backAction.visualCircle) / 2,
                    });
                    router.push("/catalogue-filters");
                  }}
                  onClear={() => {
                    setCatalogueFilters(EMPTY_MOVEMENT_FILTERS);
                    setFilterLabels([]);
                  }}
                  testID="format-catalogue-filter"
                />
                <CommandCircle label={strings.screens.sessions.sortAction} icon="sort" disabled testID="format-catalogue-sort" />
                <Pressable
                  onPress={() => {
                    // Replier : chaque pile repliée (feuilles et filet, e-cat-filet) ; Déplier : toutes rouvertes.
                    markPilesMoving();
                    setCollapsedPiles(pilesCollapsed ? new Set() : new Set(catalogueItems.flatMap((item) => (item.kind === "PILE" ? [item.key] : []))));
                    setPilesCollapsed((value) => !value);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={pilesCollapsed ? t().expandPiles : t().collapsePiles}
                  accessibilityState={{ selected: pilesCollapsed }}
                  hitSlop={5}
                  style={[styles.pilesToggle, pilesCollapsed ? styles.pilesToggleOn : null]}
                  testID="format-catalogue-piles"
                >
                  <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
                  <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
                  <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
                </Pressable>
              </Reanimated.View>
            ) : null}
          </View>
        </View>
      </>
    );
  };
  // 08/11/2026 : `inCatalogue` — résultats du mode catalogue, rendus dans sa couche ; les paramètres, dessous, gardent l'en-tête.
  const movementSection = (role: "LOOP" | "BUY_IN" | "BUY_OUT", label: string, link: string, testID: string, inCatalogue = false) => {
    const open = searchRole === role;
    const sectionAction = sectionLink(role, link);
    return (
      <>
        {inCatalogue ? null : (
          <SectionHeader
            label={label}
            link={sectionAction.text}
            onLink={sectionAction.onPress}
            // Complément du 5 novembre 2026 (Hermann), §11 : « + Ajouter » se désactive dès que deux mouvements sont choisis (à la réouverture aussi).
            disabled={model === "SUPERSET" && role === "LOOP" && !open && movements.length >= 2}
            testID={testID}
          />
        )}
        {inCatalogue ? (
          <View style={styles.search}>
            <View style={styles.catalogueList} testID="format-catalogue-results">
              {/* Recette du 05/11/2026 (k-aucun-resultat, Hermann : « je ne vois pas de message ») : « Aucun résultat » aussi en
                  mode catalogue. */}
              {query.trim().length > 0 && listedItems.length === 0 ? (
                <Text style={styles.noResult} testID="format-catalogue-empty">
                  {t().noSearchResult}
                </Text>
              ) : null}
              {familyCards(
                // D-572 : en modification, les cartes figées en haut ne figurent plus dans la liste.
                listedItems,
                (entry, onPress) => (
                  <SelectedMovementCard
                    key={entry.movement.id}
                    movement={entry.movement}
                    levelRank={entry.level?.rank ?? null}
                    selected={picked.has(entry.movement.id)}
                    // Remarque A du 07/11/2026 : la carte du dessus d'une pile repliée déplie la pile, sans changer la sélection.
                    onPress={onPress ?? (() => togglePicked(entry.movement))}
                    onPhotoPress={() => openSheet(entry.movement)}
                    testID={`format-catalogue-card-${entry.movement.id}`}
                  />
                ),
                false,
                true,
              )}
            </View>
          </View>
        ) : null}
      </>
    );
  };

  return (
    // Racine des gestes natifs propre à la feuille (formSheet, présentée hors de la vue racine de l'application).
    <GestureHandlerRootView style={styles.modalRoot}>
    <View ref={rootRef} collapsable={false} style={styles.modalRoot} testID="format-modal">
      <View style={styles.nativeSheet} testID="format-sheet">
      <ScrollView
        ref={scrollRef}
        // Recette n° 3 (f3-questionnaire : « L'écran doit rester fixe et le résultat défiler dans son cadre ») :
        // écran figé pendant la saisie d'un mouvement avec suggestions, et pendant le déplacement d'une carte. Recette du
        // 04/11/2026 (f4-catalogue : « lorsqu'un texte est tapé dans la zone de recherche on doit pouvoir continuer de faire
        // défiler la liste des mouvements ») : jamais figé en mode catalogue.
        // Recette n° 3 bis du 03/11/2026 (f3s-recherche, Hermann : « appuyer sur entrer ou sur une autre partie de
        // l'écran ne change rien, le clavier reste ouvert » ; « faire défiler vers le bas et le haut ne ferme pas le
        // clavier ») : pendant la saisie d'un mouvement, un toucher hors du champ ne le quitte plus (avec
        // « handled », l'écran figé prenait le toucher et retirait le clavier, y compris en fin de défilement
        // des suggestions).
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        // b-cat-fondu du 08/11/2026 : sous la couche du catalogue, les paramètres restent montés, immobiles, hors de VoiceOver.
        accessibilityElementsHidden={catalogueMode && !catalogueLeaving}
        importantForAccessibility={catalogueMode && !catalogueLeaving ? "no-hide-descendants" : "auto"}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: bandHeight + MOVEMENTS_TOP_OFFSET,
            paddingBottom: validating ? actionZone.scrollReserve : safeBottom + CONTENT_BOTTOM_MARGIN,
          },
        ]}
        testID={`format-${stage}`}
      >
        {/* [Remarques D et E du 07/11/2026 : fondus d'ouverture et de fermeture appliqués à ce contenu — remplacés le 08/11/2026 par
            la couche du catalogue en fondu enchaîné.] */}
        <View style={styles.fadeContent} testID="format-content-fade">
        {/* Mouvements (§7.1 à §7.4). */}
        {/* Recette n° 3 du 03/11/2026 (autres constats, Hermann : « Activer Buy-in : la section Buy-in apparaît, le
            nom de l'autre section change (en boucle...) ») : sections Buy-in et En boucle dès le questionnaire. */}
        {/* For time sans questionnaire (15/11/2026) : les mouvements sont les lignes des trois blocs, sous les paramètres. */}
        {/* Formats à tableau, écran unique (15/11/2026) : plus de cartes de mouvement, les mouvements sont les lignes du tableau. */}

        {/* 08/11/2026 : paramètres toujours montés (dessous de la couche du catalogue). [Paramètres démontés en mode catalogue — remplacé.] */}
        {(
        <>
        <Text style={[styles.section, styles.parametersTitle]} testID="format-parameters-title">
          {t().parameters}
        </Text>
        {/* Complément du 5 novembre 2026 (Hermann), §12 : tableau des mouvements isolé dans son propre cadre, entre le cadre du nombre de séries (ou de tours,
            d'intervalle, de durée) et celui des paramètres qui suivent ; cadres séparés de 8. */}
        {/* Formats à tableau (15/11/2026, CE-FMT-02 §8 : « Cadre des paramètres pleine largeur (lignes de 31 px, contrôles de 24 px, marges
            de 7 px) ») : même cadre que le For time. */}
        <Panel testID="format-parameters" summary={stage === "summary"} forTime>
          {rows}
          {progressionTail()}
        </Panel>
        {model === "FOR_TIME" ? (
          forTimeBlocks()
        ) : (
          <View ref={tableRef} collapsable={false} testID="format-objectives">
            {formatBlocks()}
          </View>
        )}
        {/* Remarque B du 06/11/2026 (Hermann : « le message rouge "les durées atteignent ou dépassent..." doit être juste sous le tableau des
            objectifs ») : contrôle EMOM des durées (MAJ 04/11 §4.4 ; Complément du 5 novembre 2026 (Hermann), §14) — message, cadres rouges,
            validation bloquée. [Message sous le cadre des paramètres qui suit le tableau — remplacé.] */}
        {model === "EMOM" && movements.length > 0 && emomOverflow.length > 0 ? (
          <Text style={styles.alert} accessibilityRole="alert" testID="format-emom-overflow">
            {t().emomOverflow.replace("{interval}", formatDuration(answers.intervalSeconds ?? 60))}
          </Text>
        ) : null}
        {/* Recette du 05/11/2026 (n-charge-colonne, Hermann) : « Pour le seul exercice restant en Répétitions, l'option Durée est
            désactivée, avec un message court » (AMRAP, For time). */}
        {unitRow !== null && lastRepetitionsLocked(model, movements, unitRow) ? (
          <Text style={styles.unitNote} accessibilityRole="alert" testID="format-last-repetitions">
            {t().lastRepetitionsLocked}
          </Text>
        ) : null}
        {/* D-531 / RM-271 (Hermann, 19/11/2026) : Max grisé dans une boucle de plusieurs mouvements, message court au même endroit. */}
        {maxNoteShown ? (
          <Text style={styles.unitNote} accessibilityRole="alert" testID="format-max-locked">
            {t().maxLocked}
          </Text>
        ) : null}
        {/* Complément du 5 novembre 2026 (Hermann), §13 : avertissement non bloquant du Death by, seulement si le premier rang ne tient pas dans l'intervalle. */}
        {model === "DEATH_BY" && deathByFirstRankWarning(answers, movements) ? (
          <Text style={styles.alert} accessibilityRole="alert" testID="format-death-by-warning">
            {t().deathByFirstRankWarning}
          </Text>
        ) : null}

        <View style={styles.spacer} />
        {/* Recette iPhone du 16/11/2026 (constat h, Hermann : « AMRAP, avec nombre d'AMRAP > 1 : écrire à côté de Déroulé "(N fois)" »). */}
        <Text style={styles.section} testID="format-timeline-title">
          {model === "AMRAP" && (answers.blockCount ?? 1) > 1 ? `${t().timeline} ${t().timelineRepeat.replace("{count}", String(answers.blockCount))}` : t().timeline}
        </Text>
        <TimelineFrame
          timeline={timeline}
          endLabel={endLabel}
          band={colors.band}
          names={movements.map((_, index) => movementName(index))}
          testID="format-timeline"
        />
        </>
        )}
        </View>
      </ScrollView>
      {/* Zone de contexte figée (109 px, prolongée en mode catalogue jusqu'à la ligne de recherche) : couleur et motif du
          modèle ; croix au questionnaire, Retour au récapitulatif, nom du Format centré ; accroche ; part fondue dessous. */}
      <View style={styles.band} pointerEvents="box-none" testID="format-context-band">
        <View style={{ backgroundColor: colors.background }} onLayout={(event) => setBandHeight(event.nativeEvent.layout.height)}>
          <View style={styles.context}>
            <FormatModelIllustration model={model} />
            <View style={styles.modalHeader} testID="screen-header">
              {/* Recette iPhone du 16/11/2026 (constat b, Hermann : « Vérifier le symbole et l'état d'activation des boutons Annuler et
                  Valider pour tous les formats ») : sans questionnaire, l'écran unique est la modale du Format — croix (Annuler, quitte
                  sans ajout) en face de la coche, pour tous les Formats. [Flèche Retour hors questionnaire et hors mode catalogue —
                  remplacée le 16/11/2026.] */}
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={t().closeAccessibilityLabel}
                hitSlop={(minTouchTarget - dimensions.backAction.visualCircle) / 2}
                style={styles.headerCircle}
                testID="screen-header-back"
              >
                <KodjoIcon name="control-close" size={dimensions.backAction.icon} testID="screen-header-back-icon" />
              </Pressable>
              <Text style={styles.modalTitle} accessibilityRole="header" numberOfLines={1} testID="format-title">
                {modelName}
              </Text>
              {/* Complément du 5 novembre 2026 (Hermann), §18–§19 : la coche de l'en-tête, en face de la croix, remplace « Ajouter »
                  (choix des mouvements, buy-in compris), « Valider les paramètres » (questionnaire) et « Enregistrer dans la séance » /
                  « Enregistrer les modifications » (récapitulatif) ; mêmes règles d'activation que les boutons retirés. Bleue si la
                  validation est possible, grise sinon. */}
              <ModalValidateAction
                onPress={save}
                enabled={canSaveHere}
                accessibilityLabel={reedit !== null ? t().saveChanges : t().save}
                style={styles.headerValidate}
                testID="format-save"
              />
            </View>
            <Text style={styles.tagline}>{t().taglines[model]}</Text>
          </View>
        </View>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.bandFade} testID="format-context-fade">
          {CONTEXT_FADE_LAYERS.map((layer) => (
            <View key={layer.height} style={[styles.bandFadeLayer, { height: layer.height, opacity: layer.opacity, backgroundColor: colors.background }]} />
          ))}
        </View>
      </View>
      {/* Demande de Hermann du 05/11/2026 (soir) : « La zone colorée ne doit pas changer de dimension » — en mode catalogue, la ligne
          « Mouvements » et la recherche restent figées sous la zone de contexte, à la place de la ligne « Mouvements » du
          questionnaire ; fond blanc de 65 % (haut) à 10 % (bas). [Zone de contexte prolongée jusqu'à la ligne de recherche
          (recette du 04/11/2026, f4-catalogue) — remplacée.] */}
      {validating ? (
        // « Valider les paramètres » : zone d'action des paramètres, sous la couche du catalogue (masquée à VoiceOver et aux touchers).
        <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} hidden={catalogueMode && !catalogueLeaving} testID="format-bottom-action">
          <PrimaryActionButton label={t().validate} onPress={validate} disabled={!canSave} testID="format-validate" />
        </PrimaryActionZone>
      ) : null}
      {/* Recette iPhone du 08/11/2026 (b-cat-fondu, b-cat-fermer) : couche du mode catalogue — fond blanc opaque, recherche figée,
          résultats dans leur propre défilement, « Fermer sans sélectionner » / « Ajouter X mouvements » ; une seule opacité, posée
          sur les paramètres (fondu enchaîné). Elle passe sous la zone de contexte (zIndex de `styles.band`), dont la part fondue
          reste visible dès l'apparition. [07/11 : recherche et bouton en couches séparées, liste dans le défilement des paramètres ;
          le fond blanc de la recherche, peint au-dessus de la zone de contexte, en masquait la part fondue — remplacé.] */}
      {catalogueMode && searchRole !== null ? (
        <Reanimated.View
          style={[StyleSheet.absoluteFill, styles.catalogueLayer, catalogueFadeStyle]}
          pointerEvents={catalogueLeaving ? "none" : "auto"}
          testID="format-catalogue-layer"
        >
          {/* Demande de Hermann du 05/11/2026 (soir) : « La zone colorée ne doit pas changer de dimension » — la ligne « Mouvements »
              et la recherche restent figées sous la zone de contexte, à la place de la ligne « Mouvements » du questionnaire.
              [Zone de contexte prolongée jusqu'à la ligne de recherche (recette du 04/11/2026, f4-catalogue) — remplacée.] */}
          <View style={[styles.searchZone, { marginTop: bandHeight + MOVEMENTS_TOP_OFFSET }]} pointerEvents="box-none" testID="format-search-zone">
            <View pointerEvents="none" style={styles.searchZoneSolid} testID="format-search-zone-background" />
            <View pointerEvents="none" style={styles.searchZoneFade}>
              {SEARCH_ZONE_FADE_LAYERS.map((layer) => (
                <View key={layer.top} style={[styles.searchZoneLayer, { top: layer.top, opacity: layer.opacity }]} />
              ))}
            </View>
            {catalogueHead()}
          </View>
          {/* D-572 (Hermann, 25/11/2026 ; Formats § 9.9) : catalogue en modification — zone figée des mouvements sélectionnés, sous la
              recherche, fond blanc opaque, plafonnée à environ 40 % de la hauteur avec son propre défilement, cartes contiguës (écart de
              la liste) et marge sous la dernière ; la liste défile dessous et disparaît à son bord. */}
          {pinnedEntries.length > 0 ? (
            <View style={[styles.pinnedZone, { maxHeight: windowHeight * PINNED_ZONE_MAX_RATIO }]} testID="format-catalogue-pinned">
              <ScrollView style={styles.pinnedScroll} contentContainerStyle={styles.pinnedContent} keyboardShouldPersistTaps="handled" testID="format-catalogue-pinned-scroll">
                {pinnedEntries.map((entry) => (
                  <View key={entry.movement.id} style={styles.familySingle}>
                    <SelectedMovementCard
                      movement={entry.movement}
                      levelRank={entry.level?.rank ?? null}
                      selected
                      onPress={() => togglePicked(entry.movement)}
                      onPhotoPress={() => openSheet(entry.movement)}
                      testID={`format-catalogue-pinned-${entry.movement.id}`}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          {/* Recette du 04/11/2026 (f4-catalogue : « lorsqu'un texte est tapé dans la zone de recherche on doit pouvoir continuer de
              faire défiler la liste des mouvements ») : défilement jamais figé ; clavier gardé (f3s-recherche). */}
          <ScrollView
            ref={catalogueScrollRef}
            style={styles.catalogueScroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[styles.content, { paddingBottom: actionZone.scrollReserve }]}
            testID="format-catalogue-scroll"
          >
            {movementSection(searchRole, "", t().add, "format-catalogue-section", true)}
          </ScrollView>
          <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="format-bottom-action">
            <PrimaryActionButton label={addPickedLabel} onPress={picked.size === 0 ? backToParameters : addPicked} testID="format-catalogue-add" />
          </PrimaryActionZone>
        </Reanimated.View>
      ) : null}
      </View>
      {/* [Recette du 04/11/2026 (f4-catalogue) : feuille de filtres dessinée (`MovementFilterSheet docked`), arrêtée à la limite
          de la zone de contexte — remplacée le 06/11/2026 (x-dedans) par la feuille native ouverte depuis « Filtrer ».] */}
      {/* Barre du clavier des tableaux, identique à celle du tableau des séries variables (iOS). */}
      {Platform.OS === "ios" && focusedCell !== null && keyboardFrame !== null ? (
        <KeyboardAccessoryBar
          keyboardFrame={keyboardFrame}
          containerBottom={windowHeight}
          reduceMotion={reduceMotion}
          onHeight={setBarHeight}
          canPrevious={focusedAt > 0}
          canNext={focusedAt >= 0 && focusedAt < fieldOrder.length - 1}
          onPrevious={() => focusCell(fieldOrder[focusedAt - 1])}
          onNext={() => focusCell(fieldOrder[focusedAt + 1])}
          onClose={() => Keyboard.dismiss()}
          animated
          units={unitsBar}
          sign={signBar}
        />
      ) : null}
      {parametersSheet()}
    </View>
    </GestureHandlerRootView>
  );

  function updateValues(index: number, values: MovementValues) {
    setMovements((current) => current.map((item, at) => (at === index ? { ...item, values } : item)));
  }

  /**
   * For time — tableau unique, sans questionnaire (décision de Hermann du 15/11/2026, registre ch07 ; CE-FMT-02 §8 ; Figma
   * `12341:27002`) : blocs Buy-in, En boucle, Buy-out, chacun avec « + Ajouter » (mode catalogue direct, sélection multiple) ;
   * « − » / « + » des colonnes — boucle : Nombre de tours (même valeur que la ligne dédiée, borne existante) ; buy-in et buy-out :
   * nombre de séries du bloc, sans plafond. FT-3 : le nom ouvre la même modale de paramètres que la Composition. [Un tableau par zone
   * présente (règles du 14/11/2026, FT-4, FT-5, FT-12), cartes des mouvements au-dessus — remplacés.]
   */
  function forTimeBlocks() {
    const sequence = forTimeInSequence(answers, movements);
    return (
      <ForTimeBlocks
        movements={movements}
        answers={answers}
        sequence={sequence}
        movementOf={movementOf}
        onAdd={(role) => sectionAction(role).onPress()}
        addTextOf={(role) => sectionAction(role).text}
        onChange={updateValues}
        onOpenParameters={setParametersOf}
        onOpenSheet={openSheet}
        onRemove={(index) => setMovements((current) => current.filter((_, at) => at !== index))}
        onMove={(index, direction) =>
          setMovements((current) => {
            const target = index + direction;
            const moved = current[index];
            const other = current[target];
            if (moved === undefined || other === undefined || movementRole(moved) !== movementRole(other)) return current;
            const next = [...current];
            next[index] = other;
            next[target] = moved;
            return next;
          })
        }
        onReorder={reorderMovement}
        revealedId={revealedId}
        onReveal={setRevealedId}
        cell={cellBinding}
      />
    );
  }

  /**
   * Formats à tableau — écran unique, sans redondance (décision de Hermann du 15/11/2026, registre ch07 ; CE-FMT-02 §8 ; Figma
   * `12455:26716`, `12445:26716`, `12445:27394`, `12445:27143`, `12445:26957`, `12445:26518` et variantes) : tableau pleine largeur des
   * mouvements, en-tête « Mouvements » et « + Ajouter » (AMRAP : blocs Buy-in et En boucle), lignes de 48 (photo 40, nom sur une ligne,
   * ligne des paramètres bleue ou « Paramètres à compléter » rouge, qui ouvrent la modale des paramètres d'exécution — décision du
   * 16/11/2026). Colonnes à dimensions inchangées : Tabata, 30/30, Renforcement, À l'échec (Objectif, Pause, Charge) ; Death by (Départ,
   * Incrément, Charge) ; AMRAP (Objectif, Par tour, Max). Colonnes de séries ou de tours : Progression et EMOM (S1…Sn), Superset
   * (Tour 1…n), nombre réglé sur la ligne « Nombre de séries » (« Nombre de tours ») ou dans la modale. [« (unité, ±kg) » tactiles et
   * « − » / « + » de l'en-tête — remplacés le 16/11/2026.]
   * [Cartes des mouvements au-dessus des paramètres et tableaux AmrapTable, DeathByTable, ObjectivePauseTable, SeriesTable dans un
   * cadre entre deux cadres de paramètres — remplacés pour ces Formats.]
   */
  function formatBlocks() {
    const tt = t().table;
    const unitChoice = UNIT_CHOICE_AT_ADD.has(model);
    const defaultMode: "REPETITIONS" | "DURATION" = model === "TABATA" || model === "INTERVALS_30_30" || model === "HIIT" ? "DURATION" : "REPETITIONS";
    const shownMode = (item: ModelMovement) => item.values.mode ?? (unitChoice ? undefined : defaultMode);
    const single = movements.length === 1;
    const kit: RowKit = {
      movementOf,
      mode: shownMode,
      // Décision de Hermann du 16/11/2026 : l'unité, le côté et la charge se règlent dans la modale des paramètres d'exécution.
      onOpenParameters: setParametersOf,
      // Recette du 16/11/2026 (Autres constats c, Hermann : « Death by - Il faut le même principe d'affichage du texte "Paramètres à compléter" de la modale des paramètres d'exécution. ») : Départ ou
      // Incrément encore vide (mêmes valeurs que les cases du tableau).
      ...(model === "DEATH_BY"
        ? {
            parametersMissing: (item: ModelMovement) =>
              (single ? (answers.startRepetitions ?? item.values.start) : item.values.start) == null ||
              (single ? (answers.increment ?? item.values.startIncrement) : item.values.startIncrement) == null,
          }
        : {}),
      onOpenSheet: openSheet,
      onRemove: (index) => {
        // Death by : passage à un seul mouvement — Départ et Incrément du mouvement restant deviennent les réglages communs.
        if (model === "DEATH_BY" && movements.length === 2) {
          const kept = movements[index === 0 ? 1 : 0]?.values;
          if (kept !== undefined)
            setAnswers((current) => ({
              ...current,
              ...(kept.start != null ? { startRepetitions: kept.start } : {}),
              ...(kept.startIncrement != null ? { increment: kept.startIncrement } : {}),
            }));
        }
        setMovements((current) => current.filter((_, at) => at !== index));
      },
      onReorder: reorderMovement,
      onMove: (index, direction) =>
        setMovements((current) => {
          const target = index + direction;
          const moved = current[index];
          const other = current[target];
          if (moved === undefined || other === undefined || movementRole(moved) !== movementRole(other)) return current;
          const next = [...current];
          next[index] = other;
          next[target] = moved;
          return next;
        }),
      revealedId,
      onReveal: setRevealedId,
      rowTestID: (index) => `format-line-${index}`,
    };
    const rows: BlockRow[] = movements.map((item, index) => ({ item, index }));
    // D-572 : « + Ajouter », puis « + Modifier » dès qu’un mouvement est choisi dans la section.
    const add = (role: "LOOP" | "BUY_IN") => sectionAction(role).onPress;
    const addText = (role: "LOOP" | "BUY_IN") => sectionAction(role).text;
    const label = (name: string, column: string) => `${name}, ${column}`;
    const notYet = t().forTimeTable.disabledValue;
    // Charge : grisée (« — ») sans charge, active avec ; elle s'ouvre au toucher comme une case. Recette du 16/11/2026 (fmt-entree,
    // Hermann : « la police des valeurs charge sont comme celle des objectifs, retirer les parenthèses » ; « la cellule est en orange
    // lorsque la charge est activée mais que la cellule n'a pas d'entrée ») : « 12 kg » dans le cadre des objectifs, orange (à vérifier)
    // tant qu'elle est vide. [« (12 kg) », plus petit, sous la colonne — remplacé.]
    const chargeColumn = ({ item, index }: BlockRow) =>
      item.values.loadOn === true ? (
        <DimensionCell
          key="load"
          cell={
            <TableCell
              kind="decimal"
              value={item.values.loadKg ?? null}
              format={formatLoad}
              entrySuffix=" kg"
              fit
              pending={item.values.loadKg == null}
              onChange={(entered) => updateValues(index, { ...item.values, loadKg: entered })}
              {...cellBinding(cellKey("load", index))}
              label={label(item.exercise.name, tt.load)}
              testID={`format-line-${index}-load`}
            />
          }
        />
      ) : (
        <DimensionText key="load" text={t().dash} testID={`format-line-${index}-load-off`} />
      );
    const numberCell = (
      { item }: BlockRow,
      value: number | null,
      onValue: (value: number | null) => void,
      key: string,
      column: string,
      testID: string,
      signed = false,
    ) => {
      const mode = shownMode(item);
      return (
        <DimensionCell
          key={key}
          cell={
            <TableCell
              kind={mode === "DURATION" ? "duration" : "integer"}
              value={value}
              format={(entered) => (signed ? signedText(entered, mode) : valueText(entered, mode))}
              width={TABLE_LAYOUT.columnWidth}
              missing={value === null}
              onChange={onValue}
              {...cellBinding(key)}
              label={label(item.exercise.name, column)}
              testID={testID}
            />
          }
        />
      );
    };
    // « + Ajouter » à droite de « Mouvements » (Figma `12455:26716`).
    const movementsAddLeft = 99;
    switch (model) {
      case "TABATA":
      case "INTERVALS_30_30":
      case "HIIT":
      case "STRENGTH":
      case "UNTIL_FAILURE": {
        const objectiveFallback = model === "STRENGTH" ? answers.repetitions : answers.workSeconds;
        return (
          <FormatBlocks testID="format-table-blocks">
            <DimensionBlock
              title={t().movements}
              rows={rows}
              heads={[tt.objective, tt.pause, tt.load]}
              onAdd={add("LOOP")}
              addText={addText("LOOP")}
              addLeft={movementsAddLeft}
              kit={kit}
              testID="format-movements"
              columns={(row) => {
                const { item, index } = row;
                const values = item.values;
                const mode = values.mode ?? defaultMode;
                const objective = values.repetitions !== undefined ? values.repetitions : mode === defaultMode ? (objectiveFallback ?? null) : null;
                const pause = values.pause ?? answers.pauseSeconds ?? basePause(item.exercise);
                return [
                  model === "UNTIL_FAILURE" ? (
                    <DimensionText key="obj" strong lines={2} text={t().atFailureTwoLines} testID={`format-objective-${index}`} />
                  ) : (
                    numberCell(row, objective, (value) => updateValues(index, { ...values, mode, repetitions: value }), cellKey("obj", index), tt.objective, `format-objective-${index}`)
                  ),
                  <DimensionCell
                    key="pause"
                    cell={
                      <TableCell
                        kind="duration"
                        durationMin={0}
                        value={pause}
                        format={formatPrimeDuration}
                        width={TABLE_LAYOUT.columnWidth}
                        onChange={(value) => (value === null ? undefined : updateValues(index, { ...values, pause: value }))}
                        {...cellBinding(cellKey("pause", index))}
                        label={label(item.exercise.name, tt.pause)}
                        testID={`format-pause-${index}`}
                      />
                    }
                  />,
                  chargeColumn(row),
                ];
              }}
            />
          </FormatBlocks>
        );
      }
      case "DEATH_BY":
        return (
          <FormatBlocks testID="format-table-blocks">
            <DimensionBlock
              title={t().movements}
              rows={rows}
              heads={[tt.start, tt.increment, tt.load]}
              onAdd={add("LOOP")}
              addText={addText("LOOP")}
              addLeft={movementsAddLeft}
              kit={kit}
              testID="format-movements"
              columns={(row) => {
                const { item, index } = row;
                const values = item.values;
                // Un seul mouvement : Départ et Incrément communs du Format (réponses), comme l'ancien questionnaire ; plusieurs : propres
                // à chaque mouvement (MAJ 04/11 §4.3).
                // Recette du 16/11/2026 (fmt-un-mouvement, Hermann : « Départ et incrément : trait horizontal, fond rouge ») : à défaut de
                // réglage commun (Format rouvert, passage de deux mouvements à un), Départ et Incrément du mouvement.
                const start = single ? (answers.startRepetitions ?? values.start ?? null) : (values.start ?? null);
                const increment = single ? (answers.increment ?? values.startIncrement ?? null) : (values.startIncrement ?? null);
                return [
                  numberCell(
                    row,
                    start,
                    (value) => (single ? (value === null ? undefined : setAnswers((current) => withAnswer(current, "startRepetitions", value))) : updateValues(index, { ...values, start: value })),
                    single ? answerFieldKey("startRepetitions") : cellKey("start", index),
                    tt.start,
                    `format-death-by-start-${index}`,
                  ),
                  numberCell(
                    row,
                    increment,
                    (value) => (single ? (value === null ? undefined : setAnswers((current) => withAnswer(current, "increment", value))) : updateValues(index, { ...values, startIncrement: value })),
                    single ? answerFieldKey("increment") : cellKey("sinc", index),
                    tt.increment,
                    `format-death-by-increment-${index}`,
                    true,
                  ),
                  chargeColumn(row),
                ];
              }}
            />
          </FormatBlocks>
        );
      case "AMRAP": {
        const increasing = answers.increasingVolume === true;
        const amrapColumns = ({ item, index }: BlockRow, loop: boolean) => {
          const values = item.values;
          const mode = shownMode(item);
          const max = values.max === true;
          const charged = values.loadOn === true;
          const name = item.exercise.name;
          const pending = mode === undefined;
          const objective = pending ? (
            <DimensionText key="obj" text={notYet} testID={`format-amrap-reps-${index}`} />
          ) : (
            <DimensionCell
              key="obj"
              charged={charged}
              cell={
                <TableCell
                  kind={mode === "DURATION" ? "duration" : "integer"}
                  value={values.repetitions ?? null}
                  format={(value) => valueText(value, mode)}
                  width={TABLE_LAYOUT.columnWidth}
                  missing={!max && values.repetitions == null}
                  disabled={max}
                  onChange={(value) => updateValues(index, { ...values, repetitions: value })}
                  {...cellBinding(cellKey("obj", index))}
                  label={label(name, tt.objective)}
                  testID={`format-amrap-reps-${index}`}
                />
              }
              charge={
                charged ? (
                  <ChargeValue
                    value={values.loadKg ?? null}
                    onChange={(entered) => updateValues(index, { ...values, loadKg: entered })}
                    binding={cellBinding(cellKey("load", index))}
                    label={label(name, tt.load)}
                    testID={`format-amrap-load-${index}`}
                  />
                ) : null
              }
            />
          );
          if (!loop) return [objective];
          const perRound =
            pending || max ? (
              <DimensionText key="inc" text={max ? t().dash : notYet} testID={`format-amrap-increment-${index}`} />
            ) : (
              <DimensionCell
                key="inc"
                charged={charged}
                cell={
                  <TableCell
                    kind={mode === "DURATION" ? "duration" : "integer"}
                    value={values.increment ?? null}
                    format={(value) => signedText(value, mode)}
                    width={TABLE_LAYOUT.columnWidth}
                    missing={values.increment == null}
                    onChange={(value) => updateValues(index, { ...values, increment: value })}
                    {...cellBinding(cellKey("inc", index))}
                    label={label(name, tt.perRound)}
                    testID={`format-amrap-increment-${index}`}
                  />
                }
              />
            );
          // Max en Répétitions seulement (n-charge-colonne, 05/11/2026). D-531 (19/11/2026) : interdit pour un mouvement d'une boucle de
          // plusieurs mouvements — grisé ; un Max déjà coché reste décochable (aucune donnée retirée d'office).
          const loopLocked = !max && maxLocked(model, movements, index);
          const maxDisabled = mode !== "REPETITIONS" || loopLocked;
          const radio = (
            <Pressable
              key="max"
              onPress={() => (loopLocked ? setMaxNoteRow(index) : updateValues(index, { ...values, max: !max }))}
              // Max grisé dans la boucle : annoncé désactivé, mais l'appui reste reçu pour montrer le message court (sans `disabled`,
              // qui écraserait l'état annoncé).
              disabled={mode !== "REPETITIONS" ? true : undefined}
              accessibilityRole="radio"
              accessibilityState={{ checked: max, disabled: maxDisabled }}
              accessibilityLabel={label(name, tt.max)}
              style={styles.maxRadioZone}
              testID={`format-amrap-max-${index}`}
            >
              <View style={[styles.maxRadio, max ? styles.maxRadioOn : null, maxDisabled ? styles.maxRadioDisabled : null]} testID={`format-amrap-radio-${index}`}>
                {max ? <View style={styles.maxRadioDot} /> : null}
              </View>
            </Pressable>
          );
          return increasing ? [objective, perRound, radio] : [objective, radio];
        };
        return (
          <FormatBlocks testID="format-table-blocks">
            <DimensionBlock
              title={t().forTimeTable.buyIn}
              rows={rows.filter(({ item }) => item.buyIn === true)}
              heads={[tt.objective]}
              onAdd={add("BUY_IN")}
              addText={addText("BUY_IN")}
              kit={kit}
              testID="format-buy-in"
              columns={(row) => amrapColumns(row, false)}
            />
            <DimensionBlock
              title={t().forTimeTable.loop}
              rows={rows.filter(({ item }) => item.buyIn !== true)}
              heads={increasing ? [tt.objective, tt.perRoundHead, tt.max] : [tt.objective, tt.max]}
              onAdd={add("LOOP")}
              addText={addText("LOOP")}
              kit={kit}
              testID="format-loop"
              columns={(row) => amrapColumns(row, true)}
            />
          </FormatBlocks>
        );
      }
      case "EMOM":
      case "PROGRESSION":
      case "SUPERSET": {
        const rounds = model === "SUPERSET";
        const count = (rounds ? answers.roundCount : answers.seriesCount) ?? (rounds ? 3 : 1);
        const prefix = model === "EMOM" ? "format-emom" : model === "SUPERSET" ? "format-superset" : "format-progression";
        const access: SeriesAccess = {
          objective: (values, at) => values.cells?.[at]?.repetitions ?? null,
          load: (values, at) => values.cells?.[at]?.loadKg ?? null,
          write: (values, at, patch) => {
            let cells = values.cells ?? [];
            if (patch.objective !== undefined) cells = withSeriesValue(cells, at, "repetitions", patch.objective, false);
            if (patch.load !== undefined) cells = withSeriesValue(cells, at, "loadKg", patch.load, false);
            return { ...values, cells };
          },
          cellTestID: (index, at) => `${prefix}-${index}-${at}-reps`,
          loadTestID: (index, at) => `${prefix}-${index}-${at}-load`,
          flagged: (index, at) => emomOverflow.some((cellAt) => cellAt.index === index && cellAt.column === at),
        };
        return (
          <FormatBlocks testID="format-table-blocks">
            <SeriesBlock
              title={t().movements}
              rows={rows}
              count={count}
              // Constat a) du 18/11/2026 : EMOM « Dans chaque intervalle » / « En alternance », colonnes T1 … TN.
              heading={(at) => (rounds ? tt.round : emomRounds() ? tt.roundShort : tt.series).replace("{n}", String(at + 1))}
              // Recette du 16/11/2026 (fmt-superset, Hermann : « Superset : après avoir ajouté deux mouvements, "+ ajouter" doit se
              // transformer en "Modifier" et être activé ») : le mode catalogue s'ouvre sur les deux mouvements choisis. [« + Ajouter »
              // grisé dès deux mouvements (Complément du 5 novembre 2026, §11) — remplacé.] D-572 (25/11/2026) : « + Modifier » dès un
              // mouvement, pour tous les formats. [« Modifier » du Superset complet (deux mouvements) — remplacé.]
              addText={addText("LOOP")}
              onAdd={add("LOOP")}
              addLeft={movementsAddLeft}
              kit={kit}
              access={access}
              onChange={updateValues}
              cell={cellBinding}
              testID="format-movements"
            />
          </FormatBlocks>
        );
      }
      default:
        return null;
    }
  }

  /**
   * Unités admises d'une ligne, contrôlées au ✓ de la modale. Tabata et 30/30 : Durée seule ; AMRAP et For time : au moins un exercice
   * en Répétitions. Recette iPhone du 15/11/2026 (Hermann : « Ajout d'un buy in : mis à jour de l'unité : seul le nombre de répétition est
   * proposé ») : au For time, la règle (FMT-31) ne verrouille pas un buy-in ou un buy-out tant qu'aucun exercice en tour n'est ajouté.
   */
  function allowedUnitsOf(index: number): readonly ("REPETITIONS" | "DURATION")[] {
    return allowedModes(model, movements, index);
  }

  /**
   * Modale des paramètres d'exécution d'un mouvement — For time (FT-3, 14/11/2026), puis tous les Formats à tableau (décision de Hermann
   * du 16/11/2026, registre ch07, « Formats — saisie par la modale des paramètres d'exécution » ; CE-FMT-02 §8 ; mission
   * FORMATS-MODALE-PARAMS-20261116) : c'est l'entrée standard (unité, côté, charge, nombre de séries ou de tours), les cases du tableau
   * restant éditables directement.
   *
   * Décision de Hermann du 16/11/2026 (« la modale des paramètres d'exécution doit être la même qu'on l'ouvre de la composition de séance
   * ou de l'écran d'un format, les effets de changement de rôle sont aussi identiques ») : elle s'ouvre sur l'Exercice que le Format
   * produirait pour ce mouvement, placé dans une Composition provisoire (jamais enregistrée), avec exactement les réglages de la carte de
   * la Composition (`useMovementExerciseIntake`) : nombre de séries hérité (`inheritsCircuitSeriesCount`), réglages de Format avec la ligne
   * Rôle (`formatSheetContextOf`), Récupération, décompte en tours (`seriesWordingOf`). Au ✓, la Composition provisoire modifiée est
   * relue : Rôle (le mouvement change de bloc), réglages de Format (Intervalle, Incrément, Durée, borne For time), Récupération propre au
   * mouvement, valeurs du tableau (`sheetValuesOf`) et nombre de séries du Format. [Contexte de Format sans Rôle ni Récupération —
   * remplacé le 16/11/2026.] Sans unité choisie, la modale s'ouvre avec l'unité à renseigner. Une unité refusée par le Format (Tabata et
   * 30/30 : Durée seule ; dernier exercice en Répétitions) laisse l'unité du tableau inchangée.
   */
  function parametersSheet() {
    if (parametersOf === null) return null;
    const movement = movements[parametersOf];
    if (movement === undefined) return null;
    const index = parametersOf;
    const several = movements.length > 1;
    const close = () => setParametersOf(null);
    const sideDefault = (defaults as { readonly sideRecoverySeconds?: number } | null)?.sideRecoverySeconds ?? DOMAIN_DEFAULTS.sideRecoverySeconds;
    // Unité à choisir : la modale s'ouvre sur « — » (Paramètres à compléter), comme un Exercice de la Composition.
    const unitPending = movement.values.mode === undefined && (model === "FOR_TIME" || UNIT_CHOICE_AT_ADD.has(model));
    const accepts = (mode: ExecutionMode | null) => mode !== null && allowedUnitsOf(index).includes(mode);
    // Recette du 05/11/2026 (n-charge-colonne, Hermann : « Pour le seul exercice restant en Répétitions, l'option Durée est désactivée,
    // avec un message court ») : la modale propose les deux unités ; une Durée refusée est annoncée par ce message court, le tableau
    // garde son unité. Tabata et 30/30 : Durée imposée, sans message.
    const refused = (mode: ExecutionMode | null) => {
      if (mode !== null && !accepts(mode) && (model === "FOR_TIME" || model === "AMRAP")) Alert.alert(t().lastRepetitionsLocked);
    };
    // Composition provisoire : l'Exercice produit par le Format pour ce mouvement, à sa place dans sa structure.
    let next = 0;
    const provisionalId = () => `format-sheet-${(next += 1)}`;
    const opening = appendModelToDraft(createEmptyDraft(), buildModelElements(model, answers, movements, provisionalId), provisionalId);
    const exercise = opening.exercises.find((candidate) => candidate.id === movement.exercise.id);
    if (exercise === undefined) return null;
    const parent: ExecutionParametersInput = unitPending ? { ...exercise.executionParameters, mode: null } : exercise.executionParameters;
    // Effets du ✓ sur la Composition provisoire (Rôle, réglages de Format), comme dans la Composition, puis relus en une fois.
    let working = opening;
    const built = formatSheetContextOf(opening, exercise.id, (change) => {
      working = change(working);
    });
    const quick = quickFormatOf(opening, exercise.id, model);
    // Recette du 16/11/2026 (mp-charge, Hermann : « Incrément : il ne faut pas de valeur par défaut dans la modale ») : Incrément
    // vide au tableau (Death by : Départ commun ou du mouvement ; AMRAP : « ± / tour » d'un mouvement en boucle) → à renseigner.
    const incrementMissing =
      model === "DEATH_BY"
        ? (several ? movement.values.startIncrement : (answers.increment ?? movement.values.startIncrement)) == null
        : model === "AMRAP" && movementRole(movement) === "TOUR" && movement.values.max !== true && movement.values.increment == null;
    const context =
      built !== undefined && incrementMissing && built.rows.includes("increment")
        ? (() => {
            const { incrementPerRound: _default, ...settings } = built.settings;
            return { ...built, settings, incrementRequired: true };
          })()
        : built;
    const initialRecovery = exercise.postActivityRecoverySeconds ?? null;
    let recoverySeconds = initialRecovery;
    let applied: ExecutionParametersInput | null = null;
    let pending = false;
    const later = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(commit);
    };
    // Valeurs affichées des tableaux à dimensions : un Objectif ou une Pause inchangés restent communs.
    const defaultMode: ExecutionMode = model === "TABATA" || model === "INTERVALS_30_30" || model === "HIIT" ? "DURATION" : "REPETITIONS";
    const shownObjective =
      movement.values.repetitions !== undefined
        ? movement.values.repetitions
        : (movement.values.mode ?? defaultMode) === defaultMode
          ? ((model === "STRENGTH" ? answers.repetitions : answers.workSeconds) ?? null)
          : null;
    const shownPause = movement.values.pause ?? answers.pauseSeconds ?? basePause(movement.exercise);
    // Nombre de séries (ou de tours, Superset) du Format ; Death by et AMRAP : une série.
    const countKey: "seriesCount" | "roundCount" | null =
      model === "SUPERSET" ? "roundCount" : model === "DEATH_BY" || model === "AMRAP" || model === "FOR_TIME" ? null : "seriesCount";

    function commit() {
      if (applied === null) return;
      const parameters = applied;
      const after = working.exercises.find((candidate) => candidate.id === exercise!.id) ?? exercise!;
      const roles = several && (model === "FOR_TIME" || model === "AMRAP");
      const before = movementRole(movement!);
      const role = roles ? circuitRoleOf(after.format, 0) : before;
      const unitKept = accepts(parameters.mode);
      refused(parameters.mode);
      const count = seriesCountOf(parameters);
      // Réglages de Format modifiés dans la modale.
      const settings = after.format?.settings ?? {};
      const initial = exercise!.format?.settings ?? {};
      const changed = (key: string) =>
        typeof settings[key] === "number" && (settings[key] !== initial[key] || (key === "incrementPerRound" && incrementMissing)) ? (settings[key] as number) : null;
      const interval = changed("intervalSeconds");
      const duration = changed("durationSeconds");
      const increment = changed("incrementPerRound");
      const cap = changed("timeCapSeconds");
      const read = sheetValuesOf(model, movement!.values, { ...exercise!, executionParameters: parameters }, { objective: shownObjective, pause: shownPause });
      // Death by à un mouvement : Départ commun du Format (réponses), comme la case du tableau.
      const commonStart = model === "DEATH_BY" && !several ? (read.start ?? null) : null;
      const values: MovementValues = {
        ...(unitKept ? read : movement!.values),
        ...(recoverySeconds !== null && recoverySeconds !== initialRecovery ? { recovery: recoverySeconds } : {}),
        ...(increment !== null && model === "AMRAP" ? { increment } : {}),
        ...(increment !== null && model === "DEATH_BY" && several ? { startIncrement: increment } : {}),
      };
      setMovements((current) =>
        current.map((item, at) => {
          if (at !== index) return item;
          const { buyIn: _in, buyOut: _out, ...rest } = item;
          const placed: ModelMovement = roles ? { ...rest, ...(role === "BUY_IN" ? { buyIn: true as const } : role === "BUY_OUT" ? { buyOut: true as const } : {}) } : item;
          return { ...placed, exercise: { ...item.exercise, executionParameters: parameters, sideMode: parameters.sideMode ?? item.exercise.sideMode }, values };
        }),
      );
      setAnswers((current) => {
        let updated = model === "FOR_TIME" && parameters.loadEnabled === true && current.withLoad !== true ? { ...current, withLoad: true } : current;
        if (unitKept) {
          if (model === "FOR_TIME") {
            if (role === "TOUR" && !several && count !== (current.roundCount ?? 1)) updated = withAnswer(updated, "roundCount", count);
            // Un mouvement seul est produit en exercice seul, à une série par tour : son nombre ne règle pas le bloc Buy-in ou Buy-out.
            if (several && role !== "TOUR" && count !== forTimeBlockSeries(current, role)) updated = { ...updated, [role === "BUY_IN" ? "buyInSeriesCount" : "buyOutSeriesCount"]: count };
          } else if (countKey !== null && count !== (current[countKey] ?? (countKey === "roundCount" ? 3 : 1))) updated = withAnswer(updated, countKey, count);
          if (commonStart !== null) updated = withAnswer(updated, "startRepetitions", commonStart);
          // Death by à un mouvement, unité changée : Départ et Incrément communs à renseigner dans la nouvelle unité, sans conversion (§13).
          if (model === "DEATH_BY" && !several && commonStart === null && parameters.mode !== (movement!.values.mode ?? "REPETITIONS")) {
            const { startRepetitions: _start, increment: _increment, ...rest } = updated;
            updated = rest;
          }
        }
        if (interval !== null) updated = withAnswer(updated, "intervalSeconds", interval);
        if (duration !== null) updated = withAnswer(updated, "durationSeconds", duration);
        if (cap !== null) updated = withAnswer(updated, "timeCapSeconds", cap);
        if (increment !== null && model === "DEATH_BY" && !several) updated = withAnswer(updated, "increment", increment);
        return updated;
      });
      close();
    }

    return (
      <ExecutionParametersSheet
        key={movement.exercise.id}
        parent={parent}
        baseline={parent}
        profileSideRecoverySecondsDefault={sideDefault}
        exerciseSignals="absent"
        inheritedSeriesCount={inheritsCircuitSeriesCount(opening, exercise)}
        seriesWording={seriesWordingOf(opening, exercise.id)}
        presentation="compositionCard"
        recovery={{
          seconds: exercise.postActivityRecoverySeconds,
          onApply: (seconds) => {
            recoverySeconds = seconds;
            later();
          },
        }}
        {...(context !== undefined ? { format: context } : {})}
        // D-604 (25/11/2026) : exercice d'un format à départ rapide — Charge et De chaque côté seulement.
        {...(context === undefined && quick !== undefined ? { quickFormatName: quick.name, quickFormatUnitOpen: quick.unitOpen, quickFormatKey: quick.key } : {})}
        // D-608 (D-573 points 2 et 7, Hermann, 26/11/2026) : même modale que depuis la Composition — titre = nom du mouvement, en-tête à la
        // couleur du format.
        movementName={exercise.name}
        headerTint={colors.background}
        onApply={(value) => {
          applied = value;
          later();
        }}
        onCancel={close}
      />
    );
  }

  function movementOf(item: ModelMovement): Movement | null {
    const id = item.exercise.sourceMovementId;
    if (id === undefined) return null;
    return movementsById.current.get(id) ?? entries.find((entry) => entry.movement.id === id)?.movement ?? null;
  }
}

/**
 * Choix de l'Exécution — recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « Le format de la
 * fenêtre du popover de l'Exécution est différent de celui utilisé jusqu'à présent dans les autres
 * écrans ») : sur iOS, `Menu` SwiftUI natif d'`@expo/ui` hébergé par `Host` / `RNHostView`, même
 * procédé que le choix de nature du Circuit (`CircuitNatureMenu`) ; option courante cochée, toucher
 * extérieur sans choix. [C.3 : feuille d'actions `ActionSheetIOS` — remplacée.] Android et web : la
 * pastille fait défiler les options.
 */
function ExecutionMenu({ options, execution, onSelect }: { options: readonly ModelExecution[]; execution: ModelExecution; onSelect: (option: ModelExecution) => void }) {
  const chip = (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{t().executions[execution]}</Text>
      <Text style={styles.chipChevron}>⌃</Text>
    </View>
  );
  if (Platform.OS === "ios") {
    return (
      <Host key={execution} matchContents testID="format-execution">
        <Menu
          label={
            <RNHostView matchContents>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {chip}
              </View>
            </RNHostView>
          }
          modifiers={[swiftUIAccessibilityLabel(t().execution), swiftUIAccessibilityValue(t().executions[execution])]}
        >
          {options.map((option) => (
            <SwiftUIButton key={option} onPress={() => onSelect(option)} testID={`format-execution-${option}`}>
              {option === execution
                ? [<SwiftUIText key="title">{t().executions[option]}</SwiftUIText>, <SwiftUIImage key="check" systemName="checkmark" />]
                : [<SwiftUIText key="title">{t().executions[option]}</SwiftUIText>]}
            </SwiftUIButton>
          ))}
        </Menu>
      </Host>
    );
  }
  return (
    <Pressable
      onPress={() => onSelect(options[(options.indexOf(execution) + 1) % options.length] ?? execution)}
      accessibilityRole="button"
      accessibilityLabel={`${t().execution}, ${t().executions[execution]}`}
      testID="format-execution"
    >
      {chip}
    </Pressable>
  );
}

function SectionHeader({ label, link, onLink, disabled = false, testID }: { label: string; link?: string; onLink?: () => void; disabled?: boolean; testID: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {link !== undefined ? (
        <Pressable onPress={onLink} disabled={disabled} hitSlop={10} accessibilityRole="button" accessibilityLabel={link} accessibilityState={{ disabled }} testID={`${testID}-link`}>
          <Text style={[styles.link, disabled ? styles.linkDisabled : null]}>{link}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Durée du Déroulé générique d'un questionnaire sans mouvement (modèles à durée calculable). */
function genericDuration(model: FormatModelKey, answers: ModelAnswers, format: (seconds: number) => string = formatSeconds): string {
  switch (model) {
    case "TABATA":
    case "INTERVALS_30_30":
    case "HIIT":
      return format((answers.seriesCount ?? 0) * ((answers.workSeconds ?? 0) + (answers.pauseSeconds ?? 0)));
    case "EMOM":
      return format((answers.seriesCount ?? 0) * (answers.intervalSeconds ?? 0));
    case "AMRAP": {
      const blocks = answers.blockCount ?? 1;
      return format(blocks * (answers.durationSeconds ?? 0) + (blocks - 1) * (answers.restBetweenBlocksSeconds ?? 0));
    }
    default:
      return t().dash;
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  modalRoot: { flex: 1, backgroundColor: "transparent" },
  // Complément du 5 novembre 2026 (Hermann) (Figma « Superset — Récapitulatif ») : « + Ajouter » grisé.
  linkDisabled: { opacity: 0.4 },
  band: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 },
  nativeSheet: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden" },
  bandFade: { height: CONTEXT_FADE_HEIGHT },
  bandFadeLayer: { position: "absolute", top: 0, left: 0, right: 0 },
  catalogueHead: { marginBottom: 4 },
  // 08/11/2026 : recherche en tête de la couche du catalogue (au-dessus de son défilement, qui passe sous son fondu de 8).
  searchZone: { zIndex: 1 },
  catalogueLayer: { backgroundColor: "#FFFFFF" },
  catalogueScroll: { flex: 1 },
  // D-572 : zone figée du catalogue en modification (même retrait et même écart que les cartes de la liste).
  pinnedZone: { backgroundColor: "#FFFFFF" },
  pinnedScroll: { flexGrow: 0 },
  pinnedContent: { marginHorizontal: 16, gap: 8, paddingTop: 4, paddingBottom: PINNED_ZONE_BOTTOM_MARGIN },
  // Blanc opaque depuis le bas de la zone de contexte (la zone commence 16 plus bas), puis fondu de 8 sous la recherche.
  searchZoneSolid: { position: "absolute", left: 0, right: 0, top: -MOVEMENTS_TOP_OFFSET, bottom: 0, backgroundColor: "#FFFFFF" },
  searchZoneFade: { position: "absolute", left: 0, right: 0, top: "100%", height: SEARCH_ZONE_FADE },
  searchZoneLayer: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#FFFFFF" },
  // Recherche du mode catalogue moins haute (demande de Hermann du 05/11/2026, soir) ; invite plus petite, en gris clair.
  catalogueSearchInput: { height: 36 },
  searchInputEmpty: { fontSize: 14 },
  catalogueField: { flex: 1, justifyContent: "center" },
  catalogueButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchInputWithClear: { paddingRight: 36 },
  searchClear: { position: "absolute", right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: "#DDE0E6", alignItems: "center", justifyContent: "center" },
  familyRailZone: { position: "absolute", left: -6, top: 26, bottom: 26, width: 16, alignItems: "center", zIndex: 1 },
  familyRailLine: { width: 2, flex: 1, borderRadius: 1, backgroundColor: "#B9BDF5" },
  // Complément du 5 novembre 2026 (Hermann), §12 : cadre propre du tableau, séparé de 8 des cadres voisins.
  unitNote: { marginHorizontal: 24, marginTop: 6, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, color: SECTION },
  // Recette du 06/11/2026 (n-cadres, constat d) : le tableau occupe tout le cadre ; ses retraits sont ceux des lignes de paramètres (16).
  // [Retrait intérieur de 8 — remplacé.]
  // Spécification de Hermann du 08/11/2026 (A §4.2, B §4.2) : pas de marge haute, marge basse de 3,5 portée par le tableau.
  // [Marge verticale de 4 — remplacée le 08/11/2026.]
  tableFrame: { marginTop: 8, marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, overflow: "hidden" },
  panelAfterTable: { marginTop: 8 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  context: { height: CONTEXT_HEIGHT, paddingHorizontal: 16, paddingTop: 10 },
  modalHeader: { height: dimensions.backAction.visualCircle + 2, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerCircle: {
    position: "absolute",
    left: 0,
    width: dimensions.backAction.visualCircle,
    height: dimensions.backAction.visualCircle,
    borderRadius: dimensions.backAction.visualCircle / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerValidate: { position: "absolute", right: 0 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: LABEL, textAlign: "center", paddingHorizontal: 48 },
  // Mise à jour du 04/11/2026 §1 : accroche 14/20 centrée, sur deux lignes, en Mali Medium Italic (Figma).
  tagline: { fontFamily: "Mali_500Medium_Italic", fontSize: 14, lineHeight: 20, color: TAGLINE, marginTop: 4, textAlign: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginTop: 5, marginBottom: 8 },
  sectionLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  section: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION, marginHorizontal: 16, marginTop: 22, marginBottom: 8 },
  // Complément du 5 novembre 2026 (Hermann), §19 : écart entre la dernière carte et « Paramètres d'exécution » réduit de 8
  // (24 → 16 dans Figma) : écart des cartes 6 + 16, au lieu de 8 + 22.
  parametersTitle: { marginTop: 16 },
  link: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, color: VALUE_COLOR },
  search: { marginHorizontal: 16, gap: 8, marginBottom: 8 },
  catalogueCommands: { flexDirection: "row", alignItems: "center", gap: 8 },
  catalogueList: { gap: 8, paddingTop: 4 },
  family: { gap: 8, paddingLeft: 8 },
  // Remarque H du 07/11/2026 : carte sans famille du mode catalogue, au retrait des cartes d'une pile.
  familySingle: { paddingLeft: 8 },
  // Remarques D et E du 07/11/2026 : enveloppe du contenu défilant (fondus du mode catalogue), qui garde l'étirement du contenu.
  fadeContent: { flexGrow: 1 },
  // Feuilles d'une pile repliée (modèle du Catalogue des mouvements : blanc, bordure #E0E3ED, rayon 12, retrait de 8 puis 16).
  pileLeaf: { position: "absolute", borderRadius: 12, borderWidth: 1, borderColor: "#E0E3ED", backgroundColor: "#FFFFFF" },
  familyLine: { position: "absolute", left: 2, top: 26, bottom: 26, width: 2, borderRadius: 1, backgroundColor: "#B9BDF5" },
  pilesToggle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#C9CDD6", alignItems: "center", justifyContent: "center", gap: 2 },
  pilesToggleOn: { borderColor: VALUE_COLOR },
  pilesGlyph: { width: 14, height: 3, borderRadius: 1.5, borderWidth: 1, borderColor: "#7A7F8C" },
  pilesGlyphOn: { borderColor: VALUE_COLOR },
  searchInput: { height: 44, borderRadius: 12, backgroundColor: PANEL, paddingHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 16, color: LABEL },
  noResult: { paddingHorizontal: 4, paddingVertical: 4, fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  cardSlot: { marginHorizontal: 16, marginBottom: CARD_GAP },
  liftedCard: { zIndex: 2, shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fallbackCard: { minHeight: 52, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, backgroundColor: PANEL },
  panel: { marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, paddingHorizontal: 16, overflow: "hidden" },
  panelForTime: { marginHorizontal: 0, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 4 },
  panelContent: { marginBottom: -1 },
  row: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, gap: 8 },
  rowSeparated: { borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  // Récapitulatif (spécification de Hermann du 08/11/2026, A §3, B §3) : ligne de 40 et son séparateur de 1, rogné sous la dernière.
  summaryRow: { minHeight: SUMMARY_ROW_HEIGHT + 1, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  forTimeRow: { minHeight: FOR_TIME_ROW_HEIGHT, height: FOR_TIME_ROW_HEIGHT, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  rowLabel: { flexShrink: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  // Recette du 06/11/2026 (constat b, Hermann : « les textes quand ils ne sont pas modifiables (ex. condition d'arrêt ou durée total), doivent
  // être alignés à droite des autres textes, pas de leur cadre ») : retrait du texte des pastilles (10).
  readValue: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: LABEL, paddingRight: 10 },
  // Champ à popover « Exécution » (spécification de Hermann du 08/11/2026, A §3) : hauteur 26, rayon 5, fond #5F60EE.
  // [Rayon 6, marge verticale 4, fond #5B5BF0 — remplacés le 08/11/2026.]
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CHIP, borderRadius: 5, paddingHorizontal: 8, height: 26 },
  chipText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, lineHeight: 16, color: "#FFFFFF" },
  chipChevron: { fontSize: 12, color: "#FFFFFF" },
  spacer: { flexGrow: 1, minHeight: 12 },
  // Radio Max de 20, centré dans sa colonne de 44 et sur la ligne de 48 (B §4.4, Figma `12445:27394`).
  maxRadioZone: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
  maxRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  maxRadioOn: { borderColor: VALUE_COLOR, backgroundColor: VALUE_COLOR },
  maxRadioDisabled: { borderColor: "#BFC2CC", opacity: 0.5 },
  maxRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  tablePanel: { marginTop: 12, paddingHorizontal: 0 },
  alert: { marginHorizontal: 16, marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, color: tokenColors.danger },
  timeline: { marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  timelineBlocks: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 22 },
  // MAJ 04/11 §6 bis 1 : bloc continu, courts séparateurs (1 px) contenus dans la barre.
  timelineContinuous: { gap: 1, borderRadius: 3, overflow: "hidden" },
  timelineBlock: { minWidth: 4, borderRadius: 3, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  timelineGroup: { flexDirection: "row", alignItems: "flex-end", borderRadius: 3, overflow: "hidden" },
  timelineBlockInGroup: { borderRadius: 0, minWidth: 2 },
  timelineLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: LABEL, opacity: 0.8 },
  timelineLabelOnDark: { color: "#FFFFFF", opacity: 1 },
  timelineEllipsis: { fontSize: 10, color: LABEL, paddingHorizontal: 2, alignSelf: "center" },
  timelineMarks: { flexDirection: "row", justifyContent: "space-between" },
  timelineMark: { fontFamily: "Inter_400Regular", fontSize: 11, color: LABEL, opacity: 0.6 },
  // Déroulé (spécification de Hermann du 08/11/2026, A §5) : légende de 18 avec 2 de marge haute, pastille + 6 + nom en Inter Regular
  // 13, 16 entre deux éléments. [Écart de 14 et nom en 12 — remplacés le 08/11/2026.]
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4, marginTop: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 16, color: LABEL },
});
