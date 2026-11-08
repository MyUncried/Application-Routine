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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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
  allowedModes,
  lastRepetitionsLocked,
  emomDurationOverflow,
  hasRequiredRoles,
  initialAnswers,
  initialMovementValues,
  isFormatModelKey,
  modelDuration,
  roleSwitches,
  summaryIssues,
  chargePerSeries,
  deathByFirstRankWarning,
  supersetRecovery,
  withAnswer,
  withMovementMode,
  type FormatModelKey,
  type ModelAnswerKey,
  type ModelAnswers,
  type ModelExecution,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit, type ModelReeditState } from "@/domain/sessions/formatReedit";
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
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { closeCreationModals } from "@/features/sessions/creationNavigation";
import { useFormatModelDraft } from "@/features/sessions/FormatModelDraftContext";
import {
  AmrapTable,
  DeathByTable,
  ObjectivePauseTable,
  SeriesTable,
  TableCell,
  cellKey,
  formatLoad,
  formatPrimeDuration,
  hasSummaryTable,
  parseCellKey,
  tableCellOrder,
  type CellBinding,
} from "@/features/sessions/FormatTables";
import { FormatModelIllustration, formatModelColors } from "@/features/sessions/FormatsWindow";
import { exerciseOfMovement, takeMovementsHandedToFormat, type MovementExerciseDefaults } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
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
const CARD_STEP_DEFAULT = 60 + CARD_GAP;
/** Constat du 06/11/2026 : délai de l'appui long qui soulève une carte (celui de `Pressable`, 500 ms). */
const CARD_LONG_PRESS_MS = 500;
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
function Panel({ children, style, testID, summary = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string; summary?: boolean }) {
  return (
    <View style={[styles.panel, style]} testID={testID}>
      <SummaryRowsContext.Provider value={summary}>
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
const SummaryRowsContext = createContext(false);
const SUMMARY_ROW_HEIGHT = 40;

function Row({ label, children, last = false, testID }: { label: string; children: React.ReactNode; last?: boolean; testID?: string }) {
  const summary = useContext(SummaryRowsContext);
  return (
    <View style={summary ? [styles.row, styles.summaryRow] : [styles.row, last ? null : styles.rowSeparated]} testID={testID}>
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
              <View style={[styles.legendSwatch, { backgroundColor: movementShade(band, index) }]} />
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
  if (model === "TABATA" || model === "INTERVALS_30_30" || model === "STRENGTH" || model === "UNTIL_FAILURE") return movementCount < 2;
  return false;
}

/** Compteur des ouvertures de questionnaire (identité du brouillon de modèle de chaque ouverture). */
let openings = 0;

export function FormatModelScreen({ stage: initialStage }: { readonly stage: Stage }) {
  const [stage, setStage] = useState<Stage>(initialStage);
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
  const routeModel: FormatModelKey = isFormatModelKey(params.model) ? params.model : "TABATA";
  const { draft: modelDraft, start, startWith, setAnswers, setMovements } = useFormatModelDraft();
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
    if (reedit !== null) startWith(routeModel, opening, reedit.opened.answers, reedit.opened.movements);
    else start(routeModel, opening);
    // Une seule fois par ouverture : le brouillon de cette ouverture n'est jamais recréé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening]);
  const model = modelDraft?.model ?? routeModel;
  const answers = useMemo(() => (fresh ? modelDraft?.answers : undefined) ?? initialAnswers(routeModel), [fresh, modelDraft, routeModel]);
  const movements = useMemo(() => (fresh ? modelDraft?.movements : undefined) ?? [], [fresh, modelDraft]);
  const modelName = strings.screens.sessionModels.cards[model].title;
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
  const levelOf = useCallback((movementId: string) => entries.find((entry) => entry.movement.id === movementId)?.level?.rank ?? null, [entries]);

  const addMovements = useCallback(
    (added: readonly Movement[], role: "LOOP" | "BUY_IN" | "BUY_OUT") => {
      if (defaults === null || modelDraft === null) return;
      const entries = added.map((movement) => {
        const exercise = exerciseOfMovement(movement, Crypto.randomUUID(), defaults);
        return { exercise, values: initialMovementValues(model, modelDraft.answers, exercise), movement };
      });
      setMovements((current) => {
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
  const [searchRole, setSearchRole] = useState<"LOOP" | "BUY_IN" | "BUY_OUT" | null>(null);
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
  const [catalogueMode, setCatalogueMode] = useState(false);
  const [catalogueFilters, setCatalogueFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [pilesCollapsed, setPilesCollapsed] = useState(false);
  // Recette du 04/11/2026 (f4-catalogue, Hermann : « le filet bleu à gauche doit être actif et permettre de replier les
  // piles ») : toucher le filet d'une pile la replie ; « Déplier » les rouvre toutes.
  const [collapsedPiles, setCollapsedPiles] = useState<ReadonlySet<string>>(new Set());
  // f4-catalogue (« elle se rétrécit en largeur, le bouton croix apparaît à l'intérieur, et les 3 boutons apparaissent ») :
  // le champ de saisie garde son format ; les commandes apparaissent après son premier rendu, le champ se rétrécit.
  const [commandsShown, setCommandsShown] = useState(false);
  const [catalogueFocus, setCatalogueFocus] = useState(false);
  const [bandHeight, setBandHeight] = useState(CONTEXT_HEIGHT);
  const [picked, setPicked] = useState<ReadonlyMap<string, Movement>>(new Map());
  const catalogueItems = useMemo(() => (catalogueMode ? visibleMovementItems(entries, query, catalogueFilters) : []), [catalogueFilters, catalogueMode, entries, query]);
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
  const catalogueOpacity = useSharedValue(0);
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
    setCommandsShown(false);
  };
  // Recette du 04/11/2026 (x-sans-recap, Hermann : « Superset : questionnaire : il manque la ligne de récupération après
  // la paire ; on ne doit pas pouvoir sélectionner plus de deux exercices, afficher un message ») : deux exercices au plus ; au-delà, message et aucun ajout.
  const supersetFull = (adding: number) => model === "SUPERSET" && movements.length + adding > 2;
  // Recette du 05/11/2026 (g-superset-deux, Hermann : « Remplacer Ok par J'ai compris. Lorsque l'utilisateur a appuyé il faut
  // fermer le clavier, le mode catalogue s'il est ouvert, supprimer le texte de la zone de saisie et revenir à l'écran
  // questionnaire »).
  const warnSupersetFull = () =>
    Alert.alert(t().supersetLimitTitle, t().supersetLimitMessage, [
      {
        text: t().supersetLimitAcknowledge,
        onPress: () => {
          Keyboard.dismiss();
          if (catalogueMode) closeCatalogue();
          setQuery("");
          setSearchRole(null);
        },
      },
    ]);
  const togglePicked = (movement: Movement) => {
    if (!picked.has(movement.id) && searchRole === "LOOP" && supersetFull(picked.size + 1)) {
      warnSupersetFull();
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
    fadeCatalogueOut(() => addMovements(ordered, role));
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
    picked.size === 0 ? t().closeWithoutSelecting : picked.size === 1 ? t().addPickedOne : fillTemplate(t().addPickedMany, { count: String(picked.size) });

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
    if (stage === "summary" && !catalogueMode) {
      Keyboard.dismiss();
      setSearchRole(null);
      setStage("questionnaire");
      return;
    }
    // Recette du 05/11/2026 (n-cat-format, Hermann : « Questionnaire : Croix > Retour à la modale "Créer un exercice" ») : ouvert
    // depuis la modale de création, le questionnaire y revient. [Essai feuille native : la croix ramenait à la Composition, même
    // si la fenêtre Formats était empilée dessous — remplacé.] Réédition (« Modifier le format ») : retour à la Composition.
    // Règle du 06/11/2026 (ordre des écrans) : la croix revient à l'écran qui a ouvert le questionnaire (modale « Créer un
    // exercice », ou Composition pour « Modifier le format »).
    dismissWith(() => router.back());
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
  const readRow = (label: string, text: string, key: string, last = false) => (
    <Row key={key} label={label} last={last} testID={`format-row-${key}`}>
      <Text style={styles.readValue} testID={`format-${key}`}>
        {text}
      </Text>
    </Row>
  );
  const totalRow = (last: boolean) => readRow(t().totalDuration, movements.length === 0 && duration === null ? genericDuration(model, answers, formatDuration) : duration === null ? t().dash : modelDurationText(duration, formatDuration), "total", last);

  const options = executionOptions(model);
  const showExecution = options.length > 0 && movements.length > 1;
  const execution: ModelExecution = answers.execution ?? options[0] ?? "SEQUENCE";
  const executionRow = () => (
    <Row key="execution" label={t().execution} last testID="format-row-execution">
      <ExecutionMenu options={options} execution={execution} onSelect={(option) => setAnswers((current) => ({ ...current, execution: option }))} />
    </Row>
  );

  // Complément du 5 novembre 2026 (Hermann), §13 : Death by à un mouvement — Objectif de départ et Incrément dans l'unité du mouvement.
  const deathByDuration = model === "DEATH_BY" && movements[0]?.values.mode === "DURATION";

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

  /** Complément du 5 novembre 2026 (Hermann), §9 : « (+ kg) » — la charge de ce mouvement apparaît et le clavier s'ouvre sur sa première case. */
  const addLoad = (index: number) => {
    const movement = movements[index];
    if (movement === undefined) return;
    updateValues(index, { ...movement.values, loadOn: true });
    const first = chargePerSeries(model) ? cellKey("load", index, 0) : cellKey("load", index);
    setTimeout(() => focusCell(first), 0);
  };

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
  const tableHere = (stage === "summary" || (model === "DEATH_BY" && movements.length > 1)) && hasSummaryTable(model, movements);
  const BEFORE_TABLE = new Set([answerFieldKey("seriesCount"), answerFieldKey("roundCount"), ...(model === "DEATH_BY" ? [answerFieldKey("intervalSeconds")] : []), ...(model === "AMRAP" ? [answerFieldKey("durationSeconds")] : [])]);
  const isRowBeforeTable = (row: React.ReactNode) => isValidElement(row) && typeof row.key === "string" && BEFORE_TABLE.has(row.key);
  // Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « Progression : il manque la pause » ; « ne pas calculer de durée total sur
  // l'écran Questionnaire » ; « la ligne du mode d'exécution est la dernière, après la durée totale ») ; MAJ 04/11 §6 quater :
  // « Avec charge » au questionnaire seulement, après Pause.
  function progressionTail(): React.ReactNode {
    if (model !== "PROGRESSION") return null;
    return (
      <>
        {stepRow("pauseSeconds", t().rows.pauseSeconds, {
          fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0,
          last: stage === "questionnaire" && !showExecution,
        })}
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
    const single = answers.withLoad === true && movements.length === 1 ? [chargeRow()] : [];
    const byMovement = stage === "summary" && several;
    switch (model) {
      case "TABATA":
      case "INTERVALS_30_30":
        return withExecution([
          stepRow("seriesCount", r.seriesCount),
          ...(byMovement ? [] : [stepRow("workSeconds", r.workSeconds), stepRow("pauseSeconds", r.pauseSeconds)]),
          ...loadSwitch,
          totalRow(!showExecution && single.length === 0),
          ...single,
        ]).concat(model === "TABATA" && several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds, { last: true })] : []);
      case "EMOM":
        // MAJ 04/11 §4.2 : ligne « Repos · jusqu'à la cadence » retirée ; §6 quater bis : « Avec charge » avant la durée totale.
        return withExecution([
          stepRow("seriesCount", r.seriesCount),
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
          ...(several
            ? []
            : [
                stepRow("startRepetitions", r.startRepetitions, { seconds: deathByDuration, format: deathByDuration ? formatDuration : (value) => `${value} ${t().repetitionsUnit}`, placeholder: t().dash }),
                stepRow("increment", r.increment, { seconds: deathByDuration, format: (value) => `+ ${deathByDuration ? formatDuration(value) : `${value} ${t().repetitionsUnit}`}`, placeholder: "+" }),
              ]),
          // Recette du 06/11/2026 (n-deathby, Hermann : « Mettre la ligne "Récupération entre les mouvements avant la ligne condition
          // d'arrêt ») : la récupération précède la condition d'arrêt. [Récupération en dernière ligne — remplacé.]
          ...(several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds)] : []),
          readRow(r.stopCondition, t().atFailure, "stop", !showExecution && loadSwitch.length === 0 && single.length === 0),
          ...loadSwitch,
          ...single,
        ]);
      case "AMRAP": {
        if (stage === "summary") return [stepRow("durationSeconds", (answers.blockCount ?? 1) > 1 || several || (answers.loopRestSeconds ?? 0) > 0 ? r.blockDuration : r.durationSeconds, { last: true })];
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
        return [
          stepRow("roundCount", r.roundCount),
          stepRow("restBetweenRoundsSeconds", r.restBetweenRoundsSeconds),
          stepRow("timeCapSeconds", r.timeCapSeconds, { last: stage === "summary" }),
          ...(stage === "questionnaire" ? [switchRow("buyIn", r.buyIn), switchRow("buyOut", r.buyOut), switchRow("withLoad", r.withLoad)] : []),
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
        return [stepRow("seriesCount", r.seriesCount, { last: stage === "summary" })];
      case "SUPERSET":
        // Recette du 04/11/2026 (x-sans-recap, Hermann : « Superset : questionnaire : il manque la ligne de récupération après
  // la paire ; on ne doit pas pouvoir sélectionner plus de deux exercices, afficher un message ») : la récupération après la paire (portée par le dernier exercice, §9.2) est réglable ; valeur initiale =
        // récupération après l'activité du dernier exercice.
        // Complément du 5 novembre 2026 (Hermann), §11 : « Répétitions par série » retirée (l'objectif dépend du mouvement) ; Circuit (3 tours), « Récupération
        // après le tour » (Récupération du dernier Exercice actuel ; absente : à renseigner, zéro conservé), Durée totale.
        return [
          stepRow("roundCount", r.supersetRounds, { format: (value) => `${value} ${value > 1 ? t().roundUnit.many : t().roundUnit.one}` }),
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

  // Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « L'appui long sur la carte du mouvement
  // devrait permettre de déplacer la carte ») : appui long, la carte se soulève et suit le doigt ; au
  // relâchement elle prend la place atteinte. Même procédé que le Catalogue des Mouvements (suivi du doigt
  // par la liste, défilement suspendu pendant le geste). Le buy-in reste en tête. Actions VoiceOver
  // Monter / Descendre conservées.
  //
  // Constat de Hermann du 06/11/2026 sur iPhone (« Questionnaire / Récapitulatif : on ne peut plus déplacer un
  // mouvement avec l'appui long. La carte est sélectionnée mais ne se déplace pas, c'est l'écran qui se déplace ») :
  // depuis le passage de ces écrans en feuille native iOS (formSheet, 04/11), le geste natif de la feuille prenait le
  // toucher dès que le défilement était coupé et annulait les touchers de React Native (le gestionnaire de touchers
  // de React Native cède à tout geste natif extérieur). Le glisser est désormais porté par un geste natif de
  // react-native-gesture-handler (`Pan` activé après l'appui long) : actif avant tout mouvement du doigt, il garde
  // le toucher pour la carte. Levée, pour ce seul écran, du choix « plan §8 » (pas de react-native-gesture-handler,
  // cf. CompositionScreen) — décision de Hermann du 06/11/2026 (« Oui je l'autorise. »).
  const [drag, setDrag] = useState<{ readonly from: number; readonly dy: number } | null>(null);
  // Valeur courante du geste, lue par les rappels du geste natif (jamais pendant le rendu).
  const dragRef = useRef<{ readonly from: number; readonly dy: number } | null>(null);
  const cardStep = useRef(CARD_STEP_DEFAULT);
  // Buy-in en tête, buy-out en fin (ordre tenu à l'ajout). Recette du 08/11/2026 au soir (plusieurs buy-in / buy-out, comme dans
  // la Composition) : chaque carte se déplace dans sa section (buy-in, boucle, buy-out), sans en sortir.
  // [Buy-in et buy-out jamais déplacés (constat du 06/11/2026) — remplacé le 08/11/2026.]
  const buyInCount = buyIn ? movements.filter((item) => item.buyIn === true).length : 0;
  const buyOutCount = buyOut ? movements.filter((item) => item.buyOut === true).length : 0;
  const sectionBounds = (index: number): readonly [number, number] =>
    index < buyInCount
      ? [0, buyInCount - 1]
      : index >= movements.length - buyOutCount
        ? [movements.length - buyOutCount, movements.length - 1]
        : [buyInCount, movements.length - 1 - buyOutCount];
  const dragTarget = (current: { from: number; dy: number }) => {
    const [first, last] = sectionBounds(current.from);
    return Math.max(first, Math.min(last, current.from + Math.round(current.dy / cardStep.current)));
  };
  const updateDrag = (next: { readonly from: number; readonly dy: number } | null) => {
    dragRef.current = next;
    setDrag(next);
  };
  const startDrag = (index: number) => {
    if (index < 0 || index >= movements.length) return;
    setRevealedId(null);
    updateDrag({ from: index, dy: 0 });
  };
  const moveDrag = (dy: number) => {
    const current = dragRef.current;
    if (current !== null) updateDrag({ ...current, dy });
  };
  const cancelDrag = () => {
    if (dragRef.current !== null) updateDrag(null);
  };
  const endDrag = () => {
    const current = dragRef.current;
    updateDrag(null);
    if (current === null) return;
    const to = dragTarget(current);
    if (to === current.from) return;
    setMovements((list) => {
      const next = [...list];
      const [moved] = next.splice(current.from, 1);
      if (moved === undefined) return list;
      next.splice(to, 0, moved);
      return next;
    });
  };
  const cardList = (items: readonly ModelMovement[], offset: number, isBuyIn: boolean, isBuyOut = false) => (
    <View
      testID={isBuyIn ? "format-buy-in-cards" : isBuyOut ? "format-buy-out-cards" : "format-movement-cards"}
    >
      {items.map((item, at) => movementCard(item, at + offset))}
    </View>
  );

  const tableShown = stage === "summary" || (model === "DEATH_BY" && movements.length > 1);
  const cellOrder = useMemo(() => (tableShown ? tableCellOrder(model, movements, answers) : []), [answers, model, movements, tableShown]);
  // Unité de l'objectif au clavier (MAJ 04/11 §4.5) : barre Répétitions | Durée, puis unité choisie, Précédent, Suivant.
  const focusedCellKey = focusedCell === null ? null : parseCellKey(focusedCell);
  const unitRow = focusedCellKey !== null && focusedCellKey.kind === "obj" ? focusedCellKey.row : null;
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
      : unitRow === null || movements[unitRow] === undefined || model === "TABATA" || model === "INTERVALS_30_30"
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
  const beforeFields = tableHere ? rowFields.filter((key) => BEFORE_TABLE.has(key)) : rowFields;
  const afterFields = tableHere ? rowFields.filter((key) => !BEFORE_TABLE.has(key)) : [];
  const fieldOrder = [...beforeFields, ...cellOrder, ...afterFields, ...(model === "PROGRESSION" ? [answerFieldKey("pauseSeconds")] : [])];
  const focusedAt = focusedCell === null ? -1 : fieldOrder.indexOf(focusedCell);
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
              {query.trim().length > 0 && catalogueItems.length === 0 ? (
                <Text style={styles.noResult} testID="format-catalogue-empty">
                  {t().noSearchResult}
                </Text>
              ) : null}
              {familyCards(
                catalogueItems,
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
        scrollEnabled={drag === null}
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
        {buyIn || buyOut ? (
          <>
            {/* 08/11/2026 au soir : « + Ajouter » aussi quand un buy-in ou un buy-out existe. [« Changer » — remplacé.] */}
            {buyIn ? movementSection("BUY_IN", t().buyInSection, t().add, "format-buy-in") : null}
            {buyIn ? cardList(movements.slice(0, buyInCount), 0, true) : null}
            {movementSection("LOOP", loopLabelOf(), t().add, "format-loop")}
            {cardList(movements.slice(buyInCount, movements.length - buyOutCount), buyInCount, false)}
            {buyOut ? movementSection("BUY_OUT", t().buyOutSection, t().add, "format-buy-out") : null}
            {buyOut ? cardList(movements.slice(movements.length - buyOutCount), movements.length - buyOutCount, false, true) : null}
          </>
        ) : (
          <>
            {movementSection("LOOP", t().movements, t().add, "format-movements")}
            {cardList(movements, 0, false)}
          </>
        )}

        {/* 08/11/2026 : paramètres toujours montés (dessous de la couche du catalogue). [Paramètres démontés en mode catalogue — remplacé.] */}
        {(
        <>
        <Text style={[styles.section, styles.parametersTitle]} testID="format-parameters-title">
          {t().parameters}
        </Text>
        {/* Complément du 5 novembre 2026 (Hermann), §12 : tableau des mouvements isolé dans son propre cadre, entre le cadre du nombre de séries (ou de tours,
            d'intervalle, de durée) et celui des paramètres qui suivent ; cadres séparés de 8. */}
        <Panel testID="format-parameters" summary={stage === "summary"}>
          {tableHere ? rows.filter(isRowBeforeTable) : rows}
          {tableHere ? null : progressionTail()}
        </Panel>
        {tableHere ? (
          <View ref={tableRef} collapsable={false} style={styles.tableFrame} testID="format-objectives">
            {model === "PROGRESSION" ? (
              <SeriesTable model="PROGRESSION" movements={movements} count={answers.seriesCount ?? 1} withLoad={answers.withLoad === true} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} />
            ) : null}
            {model === "AMRAP" ? (
              <AmrapTable movements={movements} increasing={answers.increasingVolume === true} withLoad={answers.withLoad === true} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} />
            ) : null}
            {model === "EMOM" ? (
              <SeriesTable model="EMOM" bare movements={movements} count={answers.seriesCount ?? 1} withLoad={answers.withLoad === true} overflow={emomOverflow} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} />
            ) : null}
            {model === "SUPERSET" ? (
              <SeriesTable model="SUPERSET" bare movements={movements} count={answers.roundCount ?? 3} withLoad={answers.withLoad === true} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} />
            ) : null}
            {model === "DEATH_BY" ? <DeathByTable movements={movements} withLoad={answers.withLoad === true} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} /> : null}
            {model === "TABATA" || model === "INTERVALS_30_30" || model === "STRENGTH" || model === "UNTIL_FAILURE" ? (
              <ObjectivePauseTable
                model={model}
                movements={movements}
                objectiveFallback={model === "STRENGTH" ? answers.repetitions : answers.workSeconds}
                pauseFallback={(index) => answers.pauseSeconds ?? (movements[index] !== undefined ? basePause(movements[index].exercise) : 0)}
                withLoad={answers.withLoad === true}
                onChange={updateValues}
                onAddLoad={addLoad}
                cell={cellBinding}
              />
            ) : null}
            {model === "FOR_TIME" ? (
              // Recette du 04/11/2026 (f4-modale, For time : « le fond du tableau doit être transparent, seules les zones de
              // textes doivent avoir un fond blanc ») : zones de saisie blanches. Recette du 05/11/2026 (constat d) : cadre propre.
              <SeriesTable model="FOR_TIME" bare movements={movements} count={answers.roundCount ?? 1} withLoad={answers.withLoad === true} onChange={updateValues} onAddLoad={addLoad} cell={cellBinding} />
            ) : null}
          </View>
        ) : null}
        {/* Remarque B du 06/11/2026 (Hermann : « le message rouge "les durées atteignent ou dépassent..." doit être juste sous le tableau des
            objectifs ») : contrôle EMOM des durées (MAJ 04/11 §4.4 ; Complément du 5 novembre 2026 (Hermann), §14) — message, cadres rouges,
            validation bloquée. [Message sous le cadre des paramètres qui suit le tableau — remplacé.] */}
        {model === "EMOM" && tableHere && emomOverflow.length > 0 ? (
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
        {tableHere && (rows.some((row) => !isRowBeforeTable(row)) || model === "PROGRESSION") ? (
          <Panel style={styles.panelAfterTable} testID="format-parameters-after" summary={stage === "summary"}>
            {rows.filter((row) => !isRowBeforeTable(row))}
            {progressionTail()}
          </Panel>
        ) : null}
        {/* Complément du 5 novembre 2026 (Hermann), §13 : avertissement non bloquant du Death by, seulement si le premier rang ne tient pas dans l'intervalle. */}
        {model === "DEATH_BY" && deathByFirstRankWarning(answers, movements) ? (
          <Text style={styles.alert} accessibilityRole="alert" testID="format-death-by-warning">
            {t().deathByFirstRankWarning}
          </Text>
        ) : null}

        <View style={styles.spacer} />
        <Text style={styles.section}>{t().timeline}</Text>
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
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={stage === "questionnaire" || catalogueMode ? t().closeAccessibilityLabel : t().backAccessibilityLabel}
                hitSlop={(minTouchTarget - dimensions.backAction.visualCircle) / 2}
                style={styles.headerCircle}
                testID="screen-header-back"
              >
                <KodjoIcon name={stage === "questionnaire" || catalogueMode ? "control-close" : "control-back"} size={dimensions.backAction.icon} testID="screen-header-back-icon" />
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
    </View>
    </GestureHandlerRootView>
  );

  function updateValues(index: number, values: MovementValues) {
    setMovements((current) => current.map((item, at) => (at === index ? { ...item, values } : item)));
  }

  function movementCard(item: ModelMovement, index: number) {
    const movement = movementOf(item);
    // Pendant le geste : carte portée soulevée, cartes franchies décalées d'un pas.
    const lifted = drag !== null && drag.from === index;
    const target = drag === null ? index : dragTarget(drag);
    const shift =
      drag === null || lifted ? 0 : index > drag.from && index <= target ? -cardStep.current : index < drag.from && index >= target ? cardStep.current : 0;
    const remove = () => setMovements((current) => current.filter((_, at) => at !== index));
    const move = (direction: -1 | 1) =>
      setMovements((current) => {
        const target = index + direction;
        const [first, last] = sectionBounds(index);
        if (target < first || target > last) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
      });
    const slot = (
      <View
        key={item.exercise.id}
        style={[styles.cardSlot, lifted ? [styles.liftedCard, { transform: [{ translateY: drag?.dy ?? 0 }] }] : shift !== 0 ? { transform: [{ translateY: shift }] } : null]}
        onLayout={(event) => {
          if (index === 0) cardStep.current = event.nativeEvent.layout.height + CARD_GAP;
        }}
      >
        <SwipeActionsRow
          actions={[{ key: "delete", label: t().delete, backgroundColor: "#E5484D", onPress: remove }]}
          revealed={revealedId === item.exercise.id}
          onReveal={() => setRevealedId(item.exercise.id)}
          onHide={() => setRevealedId(null)}
          // Recette n° 3 du 03/11/2026 (autres constats, Hermann : « un appui court doit ouvrir la fiche du
          // mouvement en modale, par le bas, lecture seule sans possibilité de modification »).
          onPress={() => {
            if (revealedId !== null) {
              setRevealedId(null);
              return;
            }
            if (movement !== null) router.push({ pathname: "/movement-sheet", params: { movementId: movement.id } });
          }}
          accessibilityLabel={item.exercise.name}
          extraAccessibilityActions={[
            { name: "moveUp", label: t().moveUp, onAction: () => move(-1) },
            { name: "moveDown", label: t().moveDown, onAction: () => move(1) },
          ]}
          testID={`format-movement-${index}`}
        >
          {movement !== null ? (
            <SelectedMovementCard movement={movement} levelRank={levelOf(movement.id)} onPhotoPress={() => openSheet(movement)} testID={`format-movement-card-${index}`} />
          ) : (
            <View style={styles.fallbackCard}>
              <Text style={styles.rowLabel}>{item.exercise.name}</Text>
            </View>
          )}
        </SwipeActionsRow>
      </View>
    );
    // [Buy-in et buy-out : jamais déplacés, aucun geste de déplacement — remplacé le 08/11/2026 : geste borné à la section.]
    // Constat du 06/11/2026 : geste natif activé après l'appui long (immobile 500 ms, comme l'appui long de `Pressable`) ;
    // un mouvement du doigt de plus de 10 pt avant ce délai le fait échouer (glisser latéral de suppression et
    // défilement intacts). Actif, il annule l'appui de la carte (pas de fiche ouverte au relâchement).
    const dragGesture = Gesture.Pan()
      .activateAfterLongPress(CARD_LONG_PRESS_MS)
      .runOnJS(true)
      .onStart(() => startDrag(index))
      .onUpdate((event) => moveDrag(event.translationY))
      .onEnd((_event, success) => (success ? endDrag() : cancelDrag()))
      .onFinalize(() => cancelDrag())
      .withTestId(`format-movement-drag-${index}`);
    return (
      <GestureDetector key={item.exercise.id} gesture={dragGesture}>
        {slot}
      </GestureDetector>
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
  panelContent: { marginBottom: -1 },
  row: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, gap: 8 },
  rowSeparated: { borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  // Récapitulatif (spécification de Hermann du 08/11/2026, A §3, B §3) : ligne de 40 et son séparateur de 1, rogné sous la dernière.
  summaryRow: { minHeight: SUMMARY_ROW_HEIGHT + 1, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
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
