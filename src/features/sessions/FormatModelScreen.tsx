import { Button as SwiftUIButton, Host, Image as SwiftUIImage, Menu, RNHostView, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as swiftUIAccessibilityLabel, accessibilityValue as swiftUIAccessibilityValue } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Reanimated, { FadeIn, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
  emomDurationOverflow,
  hasRequiredRoles,
  initialAnswers,
  initialMovementValues,
  isFormatModelKey,
  modelDuration,
  roleSwitches,
  summaryIssues,
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
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { EMPTY_MOVEMENT_FILTERS, visibleMovementItems, type MovementCatalogueFilters, type MovementCatalogueItem } from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SelectedMovementCard } from "@/features/activities/SelectedMovementCard";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { useFormatModelDraft } from "@/features/sessions/FormatModelDraftContext";
import {
  AmrapTable,
  DeathByTable,
  EmomTable,
  SeriesTable,
  emomFixedLoad,
  hasSummaryTable,
  parseCellKey,
  tableCellOrder,
  type CellBinding,
} from "@/features/sessions/FormatTables";
import { FORMATS_SCRIM, FormatModelIllustration, formatModelColors } from "@/features/sessions/FormatsWindow";
import { exerciseOfMovement, takeMovementsHandedToFormat, type MovementExerciseDefaults } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FINAL_ACTION_TOP_MARGIN } from "@/shared/ui/finalAction";
import { colors as tokenColors, dimensions, minTouchTarget } from "@/shared/ui/tokens";
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
const TAGLINE = "#5C636E";
const DISABLED_VALUE = "#B4B8C2";
const RECOVERY_BLOCK = "#D9DBE0";
const BUY_IN_BLOCK = "#7984C7";
const CHIP = "#5B5BF0";
const CONTEXT_HEIGHT = 109;
/** Écart entre deux cartes de mouvement ; pas de déplacement par défaut (carte 60 + écart) avant mesure. */
const CARD_GAP = 8;
const CARD_STEP_DEFAULT = 68;
/** Bas du cadre Déroulé à 25 px du haut du bouton (référence §15). */
const TIMELINE_TO_BUTTON = 25;
/** Hauteur minimale du cadre des suggestions ; écart laissé au-dessus du clavier. */
const SUGGESTIONS_MIN_HEIGHT = 160;
const SUGGESTIONS_TO_KEYBOARD = 8;
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
function modelDurationText(duration: SessionDurationResult): string {
  const text = formatSeconds(Number.isFinite(duration.seconds) ? duration.seconds : 0);
  return duration.kind === "lowerBound" ? `${strings.shared.durationNature.lowerBoundPrefix}${text}` : text;
}

/** Pas d'un réglage de durée : 5 s sous la minute, 15 s jusqu'à 5 min, puis la minute. */
function durationStep(seconds: number, direction: 1 | -1): number {
  const probe = direction > 0 ? seconds : seconds - 1;
  return probe < 60 ? 5 : probe < 300 ? 15 : 60;
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
// Valeur modifiable et pas à pas
// ---------------------------------------------------------------------------

function ValueStepper({
  label,
  text,
  onStep,
  canDecrease,
  canIncrease,
  alert = false,
  testID,
}: {
  /** Valeur en cause (contrôle EMOM des durées, MAJ 04/11 §4.4) : cadre rouge. */
  alert?: boolean;
  label: string;
  text: string;
  onStep: (direction: 1 | -1) => void;
  canDecrease: boolean;
  canIncrease: boolean;
  testID: string;
}) {
  // « L'ouverture d'un stepper remplace le badge en place » (DSF / Forms / Valeur modifiable).
  const [open, setOpen] = useState(false);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "increment" && canIncrease) onStep(1);
        if (event.nativeEvent.actionName === "decrement" && canDecrease) onStep(-1);
      }}
      style={styles.stepperHost}
      testID={testID}
    >
      {open ? (
        <View style={styles.stepper}>
          <Pressable onPress={() => onStep(-1)} disabled={!canDecrease} hitSlop={8} accessibilityLabel={t().decrease} testID={`${testID}-decrease`}>
            <Text style={[styles.stepperSign, !canDecrease ? styles.stepperSignDisabled : null]}>−</Text>
          </Pressable>
          <Pressable onPress={() => setOpen(false)} style={[styles.badge, alert ? styles.badgeAlert : null]} testID={`${testID}-value`}>
            <Text style={styles.badgeText}>{text}</Text>
          </Pressable>
          <Pressable onPress={() => onStep(1)} disabled={!canIncrease} hitSlop={8} accessibilityLabel={t().increase} testID={`${testID}-increase`}>
            <Text style={[styles.stepperSign, !canIncrease ? styles.stepperSignDisabled : null]}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} style={[styles.badge, alert ? styles.badgeAlert : null]} hitSlop={6} testID={`${testID}-badge`}>
          <Text style={styles.badgeText}>{text}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Row({ label, children, last = false, testID }: { label: string; children: React.ReactNode; last?: boolean; testID?: string }) {
  return (
    <View style={[styles.row, last ? null : styles.rowSeparated]} testID={testID}>
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
/** Montée et descente de la modale dans le voile resté en place (recette du 04/11/2026). */
const SHEET_IN = { duration: 320, reduceMotion: ReduceMotion.System };
const SHEET_OUT = { duration: 260, reduceMotion: ReduceMotion.System };

/** Compteur des ouvertures de questionnaire (identité du brouillon de modèle de chaque ouverture). */
let openings = 0;

export function FormatModelScreen({ stage: initialStage }: { readonly stage: Stage }) {
  const [stage, setStage] = useState<Stage>(initialStage);
  // Recette du 04/11/2026 (f4-modale) : ouverte depuis la fenêtre Formats (questionnaire), le voile est déjà là et reste ;
  // ouverte depuis la Composition (réédition, récapitulatif), il apparaît en fondu. La modale monte du bas.
  const screenHeight = useWindowDimensions().height;
  const veilOpacity = useSharedValue(initialStage === "questionnaire" ? 1 : 0);
  const sheetY = useSharedValue(screenHeight);
  useEffect(() => {
    sheetY.value = withTiming(0, SHEET_IN);
    veilOpacity.value = withTiming(1, SHEET_IN);
    // Une seule montée, à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const veilStyle = useAnimatedStyle(() => ({ opacity: veilOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const leaving = useRef(false);
  /** Descente de la modale et effacement du voile, puis `then` (retour à la Composition). */
  const dismissWith = (then: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    Keyboard.dismiss();
    veilOpacity.set(withTiming(0, SHEET_OUT));
    sheetY.set(
      withTiming(screenHeight, SHEET_OUT, (finished) => {
        if (finished === true) scheduleOnRN(then);
      }),
    );
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
  const actionZone = usePrimaryActionZone();

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
        // Buy-in : choix explicite de la section Buy-in, toujours en tête, remplacé par « Changer » (§7.3, §7.4 ;
        // recette n° 3 du 03/11/2026 : jamais un mouvement de boucle pris pour le buy-in).
        if (role === "BUY_IN") {
          const [chosen] = mapped;
          return chosen === undefined ? current : [{ ...chosen, buyIn: true as const }, ...current.filter((item) => item.buyIn !== true)];
        }
        // For time (recette du 04/11/2026) : buy-out choisi dans sa section, toujours en fin, remplacé par « Changer ».
        if (role === "BUY_OUT") {
          const [chosen] = mapped;
          return chosen === undefined ? current : [...current.filter((item) => item.buyOut !== true), { ...chosen, buyOut: true as const }];
        }
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
  const searchInput = useRef<TextInput>(null);
  const submitting = useRef(false);
  const searchOpen = searchRole !== null;
  const [query, setQuery] = useState("");
  const windowHeight = useWindowDimensions().height;
  const keyboardFrame = useKeyboardFrame();
  const reduceMotion = useReduceMotion();
  // Cadre des suggestions : il défile seul — recette n° 3 du 03/11/2026 (autres constats, Hermann : « taper des
  // lettres : la zone de recherche apparaît. Il faut qu'elle descende jusqu'au clavier au minimum par défaut ») :
  // son bas rejoint le haut du clavier. [Hauteur maximale d'un tiers de l'écran — remplacée.]
  const suggestionsRef = useRef<View>(null);
  const [suggestionsTop, setSuggestionsTop] = useState<number | null>(null);
  const measureSuggestions = useCallback(() => {
    suggestionsRef.current?.measureInWindow((_x, y) => setSuggestionsTop(y));
  }, []);
  useEffect(() => {
    if (keyboardFrame !== null) measureSuggestions();
  }, [keyboardFrame, measureSuggestions]);
  const suggestionsHeight =
    keyboardFrame !== null && suggestionsTop !== null
      ? Math.max(SUGGESTIONS_MIN_HEIGHT, keyboardFrame.screenY - suggestionsTop - SUGGESTIONS_TO_KEYBOARD)
      : Math.max(SUGGESTIONS_MIN_HEIGHT, Math.round(windowHeight * 0.32));
  // Mode catalogue (mise à jour consolidée du 04/11/2026 §3 ; référence Formats §7.1 à §7.3) : « Ouvrir le mode
  // catalogue » reste dans la modale — recherche détachée avec croix d'effacement, Filtrer, Trier (inactif, comme au
  // Catalogue) et Replier / déplier les piles, petites cartes avec filet des niveaux, sans compteur ; « Ajouter »
  // applique la sélection (unique pour le buy-in), « Fermer le mode catalogue » revient à la saisie sans ajout.
  // [Modale du Catalogue séparée (`/movement-selection`), ouverte en fondu — remplacée.]
  const [catalogueMode, setCatalogueMode] = useState(false);
  const [catalogueFilters, setCatalogueFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const suggestionItems = useMemo(() => (query.trim().length === 0 ? [] : visibleMovementItems(entries, query, EMPTY_MOVEMENT_FILTERS)), [entries, query]);
  const ranked = useMemo(() => suggestionItems.flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry])), [suggestionItems]);
  const catalogueItems = useMemo(() => (catalogueMode ? visibleMovementItems(entries, query, catalogueFilters) : []), [catalogueFilters, catalogueMode, entries, query]);
  const openCatalogue = () => {
    setPicked(new Map());
    setCatalogueFocus(searchInput.current?.isFocused() === true);
    setCommandsShown(false);
    setCatalogueMode(true);
    requestAnimationFrame(() => setCommandsShown(true));
  };
  const closeCatalogue = () => {
    setCatalogueMode(false);
    setPicked(new Map());
    setIsFilterOpen(false);
    setCommandsShown(false);
  };
  const togglePicked = (movement: Movement) =>
    setPicked((current) => {
      const next = new Map(searchRole === "BUY_IN" ? [...current].filter(([id]) => id === movement.id) : current);
      if (next.has(movement.id)) next.delete(movement.id);
      else next.set(movement.id, movement);
      return next;
    });
  const addPicked = () => {
    if (picked.size === 0 || searchRole === null) return;
    // Ordre de présentation du Catalogue (sans recherche ni filtre), jamais l'ordre des touchers (V2-CAT-01 §4.4).
    const ordered = visibleMovementItems(entries, "", EMPTY_MOVEMENT_FILTERS)
      .flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry]))
      .filter((entry) => picked.has(entry.movement.id))
      .map((entry) => entry.movement);
    const role = searchRole;
    closeCatalogue();
    setSearchRole(null);
    setQuery("");
    Keyboard.dismiss();
    addMovements(ordered, role);
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
  const endLabel =
    timeline.end.kind === "UNTIL_FAILURE"
      ? t().untilFailure
      : timeline.end.kind === "MEASURED"
        ? t().measured
        : duration !== null
          ? modelDurationText(duration)
          : genericDuration(model, answers);

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
  const backToComposition = () => {
    const state = navigation.getState();
    const routes = state?.routes ?? [];
    const at = routes.map((route) => route.name).lastIndexOf("composition");
    if (state !== undefined && at >= 0 && state.index > at) router.dismiss(state.index - at);
    else router.dismissTo("/composition");
  };

  // « Valider les paramètres » : récapitulatif sur place, sans ajout ; Retour : questionnaire, réponses conservées.
  const validate = () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSearchRole(null);
    setStage("summary");
  };
  // Recette du 04/11/2026 (f4-modale, Hermann : « Tabata : Après sélection des mouvements, le bouton d'action doit
  // directement être "Enregistrer dans la séance" ») : le Tabata s'enregistre depuis son questionnaire, sans récapitulatif.
  // [MAJ 04/11 §2 : « Valider les paramètres » pour tous les modèles — remplacé pour le Tabata.]
  const validating = stage === "questionnaire" && model !== "TABATA";

  const close = () => {
    if (stage === "summary") {
      Keyboard.dismiss();
      setSearchRole(null);
      setStage("questionnaire");
    } else dismissWith(() => router.back());
  };

  // Lignes de paramètres du modèle.
  // `fallback` : valeur héritée affichée tant que la réponse n'est pas fixée (Pause du Renforcement : pause des Exercices).
  const stepRow = (id: ModelAnswerKey, label: string, options: { last?: boolean; format?: (value: number) => string; fallback?: number } = {}) => {
    const value = answers[id] ?? options.fallback;
    const bounds = answerBounds(id);
    const isSeconds = SECONDS_KEYS.has(id);
    const numeric = typeof value === "number" ? value : null;
    const isVariable = variable.has(id);
    const text = isVariable ? t().variable : numeric === null ? t().noLimit : options.format !== undefined ? options.format(numeric) : isSeconds ? formatSeconds(numeric) : String(numeric);
    const applyStep = (direction: 1 | -1) =>
      setAnswers((current) => {
        const raw = current[id] ?? options.fallback;
        if (typeof raw !== "number") return direction > 0 ? withAnswer(current, id, bounds.min) : current;
        const next = raw + direction * (isSeconds ? durationStep(raw, direction) : 1);
        // Temps limite (§11) : sous le minimum, « Sans limite ».
        if (id === "timeCapSeconds" && next < bounds.min) return withAnswer(current, id, null);
        return withAnswer(current, id, next);
      });
    // §6 sexies.7 : remplacer un réglage « variable » écrase des valeurs personnalisées — confirmation courte.
    const onStep = (direction: 1 | -1) => {
      if (!isVariable) {
        applyStep(direction);
        return;
      }
      Alert.alert(t().variableConfirmTitle, t().variableConfirmMessage, [
        { text: t().variableConfirmCancel, style: "cancel" },
        {
          text: t().variableConfirmReplace,
          onPress: () => {
            setVariable((current) => new Set([...current].filter((key) => key !== id)));
            setAnswers((current) => withAnswer(current, id, (initialAnswers(model)[id] as number | undefined) ?? bounds.min));
          },
        },
      ]);
    };
    return (
      <Row key={id} label={label} last={options.last === true} testID={`format-row-${id}`}>
        <ValueStepper
          alert={id === "intervalSeconds" && stage === "summary" && emomOverflow.length > 0}
          label={label}
          text={text}
          onStep={onStep}
          canDecrease={isVariable || (numeric !== null && (numeric > bounds.min || id === "timeCapSeconds"))}
          canIncrease={isVariable || numeric === null || numeric < bounds.max}
          testID={`format-${id}`}
        />
      </Row>
    );
  };
  const switchRow = (id: "buyIn" | "buyOut" | "increasingVolume" | "withLoad", label: string) => (
    <Row key={id} label={label} testID={`format-row-${id}`}>
      <Switch
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
  const totalRow = (last: boolean) => readRow(t().totalDuration, movements.length === 0 && duration === null ? genericDuration(model, answers) : duration === null ? t().dash : modelDurationText(duration), "total", last);

  const options = executionOptions(model);
  const showExecution = options.length > 0 && movements.length > 1;
  const execution: ModelExecution = answers.execution ?? options[0] ?? "SEQUENCE";
  const executionRow = () => (
    <Row key="execution" label={t().execution} last testID="format-row-execution">
      <ExecutionMenu options={options} execution={execution} onSelect={(option) => setAnswers((current) => ({ ...current, execution: option }))} />
    </Row>
  );

  const rows = parameterRows();
  function parameterRows(): React.ReactNode[] {
    const several = movements.length > 1;
    const sequence = execution === "SEQUENCE";
    const withExecution = (items: React.ReactNode[]) => (showExecution ? [...items, executionRow()] : items);
    const r = t().rows;
    switch (model) {
      case "TABATA":
      case "INTERVALS_30_30":
        return withExecution([
          stepRow("seriesCount", r.seriesCount),
          stepRow("workSeconds", r.workSeconds),
          stepRow("pauseSeconds", r.pauseSeconds),
          totalRow(!showExecution),
          ...(model === "TABATA" && several && sequence && showExecution ? [] : []),
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
        return withExecution([
          stepRow("intervalSeconds", r.intervalSeconds),
          ...(several
            ? []
            : [
                stepRow("startRepetitions", r.startRepetitions, { format: (value) => `${value} ${t().repetitionsUnit}` }),
                stepRow("increment", r.increment, { format: (value) => `+ ${value} ${t().repetitionsUnit}` }),
              ]),
          readRow(r.stopCondition, t().atFailure, "stop", !showExecution),
        ]).concat(several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds, { last: true })] : []);
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
        return withExecution([stepRow("seriesCount", r.seriesCount), stepRow("repetitions", r.repetitions), stepRow("pauseSeconds", r.pauseSeconds, { fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0 }), totalRow(!showExecution)]);
      case "UNTIL_FAILURE":
        // Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « A l'échec : ne pas mettre le champ de la durée totale,
        // retirer la ligne »).
        return withExecution([stepRow("seriesCount", r.seriesCount), readRow(r.targetPerSeries, t().atFailure, "target", !showExecution)]);
      case "PROGRESSION":
        // Suivies du tableau (récapitulatif), de la Pause, de la durée totale et de l'Exécution (sous le tableau).
        return [stepRow("seriesCount", r.seriesCount, { last: stage === "summary" })];
      case "SUPERSET":
        return [stepRow("roundCount", r.supersetRounds, { format: (value) => `${value} ${value > 1 ? t().roundUnit.many : t().roundUnit.one}` }), readRow(r.repetitions, t().dash, "repetitions"), totalRow(true)];
      default: {
        const unreachable: never = model;
        return unreachable;
      }
    }
  }

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  // Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « L'appui long sur la carte du mouvement
  // devrait permettre de déplacer la carte ») : appui long, la carte se soulève et suit le doigt ; au
  // relâchement elle prend la place atteinte. Même procédé que le Catalogue des Mouvements (suivi du doigt
  // par la liste, défilement suspendu pendant le geste). Le buy-in reste en tête. Actions VoiceOver
  // Monter / Descendre conservées.
  const [drag, setDrag] = useState<{ readonly from: number; readonly dy: number } | null>(null);
  const touchY = useRef(0);
  const dragStartY = useRef<number | null>(null);
  const cardStep = useRef(CARD_STEP_DEFAULT);
  // Buy-in choisi : en tête, jamais déplacé ni dépassé.
  // Buy-in en tête, buy-out en fin (ordre tenu à l'ajout) : jamais déplacés ni dépassés.
  const buyInCount = buyIn ? movements.filter((item) => item.buyIn === true).length : 0;
  const buyOutCount = buyOut ? movements.filter((item) => item.buyOut === true).length : 0;
  const firstMovable = buyInCount;
  const lastMovable = movements.length - 1 - buyOutCount;
  const dragTarget = (current: { from: number; dy: number }) =>
    Math.max(firstMovable, Math.min(lastMovable, current.from + Math.round(current.dy / cardStep.current)));
  const startDrag = (index: number) => {
    if (index < firstMovable || index > lastMovable) return;
    setRevealedId(null);
    dragStartY.current = touchY.current;
    setDrag({ from: index, dy: 0 });
  };
  const endDrag = () => {
    const current = drag;
    setDrag(null);
    dragStartY.current = null;
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
      onTouchStart={(event) => {
        touchY.current = event.nativeEvent.pageY;
      }}
      onTouchMove={
        drag !== null
          ? (event) => {
              const start = dragStartY.current ?? event.nativeEvent.pageY;
              setDrag({ ...drag, dy: event.nativeEvent.pageY - start });
            }
          : undefined
      }
      onTouchEnd={drag !== null ? endDrag : undefined}
      onTouchCancel={drag !== null ? () => setDrag(null) : undefined}
      testID={isBuyIn ? "format-buy-in-cards" : isBuyOut ? "format-buy-out-cards" : "format-movement-cards"}
    >
      {items.map((item, at) => movementCard(item, at + offset, isBuyIn || isBuyOut))}
    </View>
  );

  // Cellules des tableaux : focus, Suivant / Précédent, révélation au-dessus du clavier et de sa barre.
  const cellInputs = useRef(new Map<string, TextInput | null>());
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [barHeight, setBarHeight] = useState(KEYBOARD_BAR_HEIGHT);
  const tableShown = stage === "summary" || (model === "DEATH_BY" && movements.length > 1);
  const cellOrder = useMemo(() => (tableShown ? tableCellOrder(model, movements, answers) : []), [answers, model, movements, tableShown]);
  // Unité de l'objectif au clavier (MAJ 04/11 §4.5) : barre Répétitions | Durée, puis unité choisie, Précédent, Suivant.
  const [unitPicking, setUnitPicking] = useState(false);
  const focusedCellKey = focusedCell === null ? null : parseCellKey(focusedCell);
  const unitRow = focusedCellKey !== null && focusedCellKey.kind === "obj" ? focusedCellKey.row : null;
  const unitsBar =
    unitRow === null || movements[unitRow] === undefined
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
  const focusCell = (key: string | undefined) => {
    if (key !== undefined) cellInputs.current.get(key)?.focus();
  };
  const cellBinding: CellBinding = (key) => ({
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
  const focusedAt = focusedCell === null ? -1 : cellOrder.indexOf(focusedCell);
  useEffect(() => {
    if (focusedCell === null || keyboardFrame === null) return;
    const input = cellInputs.current.get(focusedCell);
    input?.measureInWindow((_x, y, _width, height) => {
      const limit = keyboardFrame.screenY - (Platform.OS === "ios" ? barHeight : 0) - CELL_REVEAL_MARGIN;
      const delta = y + height - limit;
      if (delta > 0) scrollRef.current?.scrollTo({ y: scrollY.current + delta, animated: !reduceMotion });
    });
  }, [barHeight, focusedCell, keyboardFrame, reduceMotion]);

  // Familles de Niveaux : cartes reliées par le filet des niveaux (suggestions et mode catalogue).
  const familyCards = (items: readonly MovementCatalogueItem[], card: (entry: MovementCatalogueEntry) => React.ReactNode, collapsed: boolean, railActive = false) =>
    items.map((item) =>
      item.kind === "PILE" && !collapsed && !(railActive && collapsedPiles.has(item.key)) ? (
        <View key={item.key} style={styles.family} testID={`format-family-${item.key}`}>
          {railActive ? (
            <Pressable
              onPress={() => setCollapsedPiles((current) => new Set([...current, item.key]))}
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
          {item.members.map((entry) => card(entry))}
        </View>
      ) : (
        card(item.kind === "PILE" ? item.members[0]! : item.entry)
      ),
    );

  // Section de mouvements : en-tête, lien « + Ajouter » / « Changer » (champ de saisie), puis « Ouvrir le mode
  // catalogue » / « Fermer le mode catalogue ».
  const sectionLink = (role: "LOOP" | "BUY_IN" | "BUY_OUT", link: string) => {
    const open = searchRole === role;
    const inCatalogue = open && catalogueMode;
    return {
      text: inCatalogue ? t().closeCatalogue : open ? t().openCatalogue : link,
      onPress: () => {
        if (inCatalogue) closeCatalogue();
        else if (open) openCatalogue();
        else {
          // Contre-recette n° 3 ter du 03/11/2026 (Hermann : « changer de Buy-in doit effacer le mouvement avant de
          // positionner le curseur sur le champ ») : « Changer » retire le buy-in (ou le buy-out) choisi, puis ouvre le champ.
          if (role === "BUY_IN") setMovements((current) => current.filter((item) => item.buyIn !== true));
          if (role === "BUY_OUT") setMovements((current) => current.filter((item) => item.buyOut !== true));
          setQuery("");
          setSuggestionsTop(null);
          setSearchRole(role);
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
    const link = sectionLink(role, t().add);
    const testID = role === "BUY_IN" ? "format-buy-in" : role === "BUY_OUT" ? "format-buy-out" : buyIn || buyOut ? "format-loop" : "format-movements";
    return (
      <>
        <SectionHeader label={label} link={link.text} onLink={link.onPress} testID={testID} />
        <View style={[styles.search, styles.catalogueHead]} testID="format-catalogue">
          <View style={styles.catalogueCommands}>
            <Reanimated.View layout={LinearTransition.duration(220)} style={styles.catalogueField}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                autoFocus={catalogueFocus}
                placeholder={t().searchPlaceholder}
                returnKeyType="search"
                submitBehavior="submit"
                style={[styles.searchInput, query.length > 0 ? styles.searchInputWithClear : null]}
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
              <Reanimated.View entering={FadeIn.duration(220)} style={styles.catalogueButtons}>
                <FilterCommand
                  label={strings.screens.sessions.filterAction}
                  title={strings.screens.movement.catalogue.filters.command}
                  summary={filterSummary}
                  clearLabel={strings.screens.movement.catalogue.filters.clearAccessibility}
                  editLabel={strings.screens.movement.catalogue.filters.editAccessibility}
                  onOpen={() => setIsFilterOpen(true)}
                  onClear={() => {
                    setCatalogueFilters(EMPTY_MOVEMENT_FILTERS);
                    setFilterLabels([]);
                  }}
                  testID="format-catalogue-filter"
                />
                <CommandCircle label={strings.screens.sessions.sortAction} icon="sort" disabled testID="format-catalogue-sort" />
                <Pressable
                  onPress={() => {
                    setPilesCollapsed((value) => !value);
                    setCollapsedPiles(new Set());
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
  const movementSection = (role: "LOOP" | "BUY_IN" | "BUY_OUT", label: string, link: string, testID: string) => {
    const open = searchRole === role;
    const inCatalogue = open && catalogueMode;
    const sectionAction = sectionLink(role, link);
    return (
      <>
        {inCatalogue ? null : <SectionHeader label={label} link={sectionAction.text} onLink={sectionAction.onPress} testID={testID} />}
        {inCatalogue ? (
          <View style={styles.search}>
            <View style={styles.catalogueList} testID="format-catalogue-results">
              {familyCards(
                catalogueItems,
                (entry) => (
                  <SelectedMovementCard
                    key={entry.movement.id}
                    movement={entry.movement}
                    levelRank={entry.level?.rank ?? null}
                    selected={picked.has(entry.movement.id)}
                    onPress={() => togglePicked(entry.movement)}
                    onPhotoPress={() => openSheet(entry.movement)}
                    testID={`format-catalogue-card-${entry.movement.id}`}
                  />
                ),
                pilesCollapsed,
                true,
              )}
            </View>
          </View>
        ) : open ? (
          <View style={styles.search}>
            <TextInput
              ref={searchInput}
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder={t().searchPlaceholder}
              // Recette n° 3 du 03/11/2026 (f3r-recherche : « appuyer sur entrée fait disparaître le clavier […]
              // Le clavier ne doit pas disparaître ») : Entrée ne retire pas le focus. Contre-recette n° 3 ter
              // (f3t-recherche, Hermann : « Appuyer sur entrée fermé le clavier ») : cause non reproduite hors appareil ;
              // après Entrée, le champ reprend le focus s'il l'a perdu, sans se refermer.
              submitBehavior="submit"
              returnKeyType="search"
              onSubmitEditing={() => {
                submitting.current = true;
                requestAnimationFrame(() => {
                  submitting.current = false;
                  if (searchInput.current?.isFocused() === false) searchInput.current.focus();
                });
              }}
              onBlur={() => {
                if (submitting.current) return;
                if (query.trim().length === 0) setSearchRole((current) => (current === role ? null : current));
              }}
              style={styles.searchInput}
              accessibilityLabel={t().searchPlaceholder}
              testID="format-search"
            />
            {ranked.length > 0 ? (
              <View ref={suggestionsRef} onLayout={measureSuggestions} collapsable={false}>
                <ScrollView
                  style={[styles.suggestions, { height: suggestionsHeight }]}
                  contentContainerStyle={styles.suggestionsContent}
                  // f3r-recherche : « faire défiler la liste vers le haut puis vers le bas […] fait disparaître le
                  // clavier […] Le clavier ne doit pas disparaître avec ces mouvements. »
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="none"
                  nestedScrollEnabled
                  testID="format-suggestions"
                >
                  {familyCards(
                    suggestionItems,
                    (choice) => (
                      <SelectedMovementCard
                        key={choice.movement.id}
                        movement={choice.movement}
                        levelRank={choice.level?.rank ?? null}
                        onPress={() => {
                          setSearchRole(null);
                          setQuery("");
                          addMovements([choice.movement], role);
                        }}
                        onPhotoPress={() => openSheet(choice.movement)}
                        testID={`format-suggestion-${choice.movement.id}`}
                      />
                    ),
                    false,
                  )}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.modalRoot} testID="format-modal">
      <Reanimated.View style={[styles.veil, veilStyle]} testID="format-veil" />
      <Reanimated.View style={[styles.sheet, { top: MODAL_TOP }, sheetStyle]} testID="format-sheet">
      <ScrollView
        ref={scrollRef}
        // Recette n° 3 (f3-questionnaire : « L'écran doit rester fixe et le résultat défiler dans son cadre ») :
        // écran figé pendant la saisie d'un mouvement avec suggestions, et pendant le déplacement d'une carte. Recette du
        // 04/11/2026 (f4-catalogue : « lorsqu'un texte est tapé dans la zone de recherche on doit pouvoir continuer de faire
        // défiler la liste des mouvements ») : jamais figé en mode catalogue.
        scrollEnabled={drag === null && (catalogueMode || !(searchOpen && ranked.length > 0))}
        // Recette n° 3 bis du 03/11/2026 (f3s-recherche, Hermann : « appuyer sur entrer ou sur une autre partie de
        // l'écran ne change rien, le clavier reste ouvert » ; « faire défiler vers le bas et le haut ne ferme pas le
        // clavier ») : pendant la saisie d'un mouvement, un toucher hors du champ ne le quitte plus (avec
        // « handled », l'écran figé prenait le toucher et retirait le clavier, y compris en fin de défilement
        // des suggestions).
        keyboardShouldPersistTaps={searchOpen ? "always" : "handled"}
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingTop: bandHeight, paddingBottom: actionZone.scrollReserve - FINAL_ACTION_TOP_MARGIN + TIMELINE_TO_BUTTON }]}
        testID={`format-${stage}`}
      >
        {/* Mouvements (§7.1 à §7.4). */}
        {/* Recette n° 3 du 03/11/2026 (autres constats, Hermann : « Activer Buy-in : la section Buy-in apparaît, le
            nom de l'autre section change (en boucle...) ») : sections Buy-in et En boucle dès le questionnaire. */}
        {catalogueMode && searchRole !== null ? (
          // Mode catalogue : seule la section concernée, ses résultats jusqu'au bas de la modale (en-tête et recherche
          // dans la zone fixe).
          movementSection(searchRole, "", t().add, "format-catalogue-section")
        ) : buyIn || buyOut ? (
          <>
            {buyIn ? movementSection("BUY_IN", t().buyInSection, buyInCount > 0 ? t().change : t().add, "format-buy-in") : null}
            {buyIn ? cardList(movements.slice(0, buyInCount), 0, true) : null}
            {movementSection("LOOP", loopLabelOf(), t().add, "format-loop")}
            {cardList(movements.slice(buyInCount, movements.length - buyOutCount), buyInCount, false)}
            {buyOut ? movementSection("BUY_OUT", t().buyOutSection, buyOutCount > 0 ? t().change : t().add, "format-buy-out") : null}
            {buyOut ? cardList(movements.slice(movements.length - buyOutCount), movements.length - buyOutCount, false, true) : null}
          </>
        ) : (
          <>
            {movementSection("LOOP", t().movements, t().add, "format-movements")}
            {cardList(movements, 0, false)}
          </>
        )}

        {catalogueMode ? null : (
        <>
        <Text style={styles.section}>{t().parameters}</Text>
        <View style={styles.panel} testID="format-parameters">
          {rows}
          {model === "PROGRESSION" && stage === "summary" ? (
            <SeriesTable model="PROGRESSION" movements={movements} count={answers.seriesCount ?? 1} withLoad={answers.withLoad === true} onChange={updateValues} cell={cellBinding} />
          ) : null}
          {/* Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « Progression : il manque la pause » ; « ne pas calculer de
              durée total sur l'écran Questionnaire, l'utilisateur ne voit pas les valeur par défaut utilisées » ; « la ligne
              du mode d'exécution est la dernière, après la durée totale »). */}
          {model === "PROGRESSION" ? (
            <>
              {stepRow("pauseSeconds", t().rows.pauseSeconds, {
                fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0,
                last: stage === "questionnaire" && !showExecution,
              })}
              {/* MAJ 04/11 §6 quater : « Avec charge » au questionnaire seulement, après Pause (pas de durée totale au
                  questionnaire, contre-recette n° 3 bis). */}
              {stage === "questionnaire" ? switchRow("withLoad", t().rows.withLoad) : null}
              {stage === "summary" ? totalRow(!showExecution) : null}
              {showExecution ? executionRow() : null}
            </>
          ) : null}
        </View>
        {(stage === "summary" || model === "DEATH_BY") && hasSummaryTable(model, movements) ? (
          <>
            {model === "AMRAP" ? (
              <AmrapTable movements={movements} increasing={answers.increasingVolume === true} withLoad={answers.withLoad === true} onChange={updateValues} cell={cellBinding} />
            ) : null}
            {model === "EMOM" ? <EmomTable movements={movements} withLoad={answers.withLoad === true} fixedLoad={emomFixedLoad(movements, answers)} overflow={emomOverflow} onChange={updateValues} cell={cellBinding} /> : null}
            {model === "DEATH_BY" ? <DeathByTable movements={movements} onChange={updateValues} cell={cellBinding} /> : null}
            {model === "FOR_TIME" ? (
              // Recette du 04/11/2026 (f4-modale, For time : « le fond du tableau doit être transparent, seules les zones de
              // textes doivent avoir un fond blanc ») : tableau sans cadre.
              <View style={styles.tableBare}>
                <SeriesTable model="FOR_TIME" bare movements={movements} count={answers.roundCount ?? 1} withLoad={answers.withLoad === true} onChange={updateValues} cell={cellBinding} />
              </View>
            ) : null}
            {/* Contrôle EMOM des durées (MAJ 04/11 §4.4) : message sous le tableau, cadres rouges, validation bloquée. */}
            {model === "EMOM" && emomOverflow.length > 0 ? (
              <Text style={styles.alert} accessibilityRole="alert" testID="format-emom-overflow">
                {t().emomOverflow.replace("{interval}", formatSeconds(answers.intervalSeconds ?? 60))}
              </Text>
            ) : null}
          </>
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
                accessibilityLabel={stage === "questionnaire" ? t().closeAccessibilityLabel : t().backAccessibilityLabel}
                hitSlop={(minTouchTarget - dimensions.backAction.visualCircle) / 2}
                style={styles.headerCircle}
                testID="screen-header-back"
              >
                <KodjoIcon name={stage === "questionnaire" ? "control-close" : "control-back"} size={dimensions.backAction.icon} testID="screen-header-back-icon" />
              </Pressable>
              <Text style={styles.modalTitle} accessibilityRole="header" numberOfLines={1} testID="format-title">
                {modelName}
              </Text>
            </View>
            <Text style={styles.tagline}>{t().taglines[model]}</Text>
          </View>
          {catalogueMode ? catalogueHead() : null}
        </View>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.bandFade} testID="format-context-fade">
          {CONTEXT_FADE_LAYERS.map((layer) => (
            <View key={layer.height} style={[styles.bandFadeLayer, { height: layer.height, opacity: layer.opacity, backgroundColor: colors.background }]} />
          ))}
        </View>
      </View>
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="format-bottom-action">
        {catalogueMode ? (
          <PrimaryActionButton label={t().addPicked} onPress={addPicked} disabled={picked.size === 0} testID="format-catalogue-add" />
        ) : validating ? (
          <PrimaryActionButton label={t().validate} onPress={validate} disabled={!canSave} testID="format-validate" />
        ) : (
          <PrimaryActionButton label={reedit !== null ? t().saveChanges : t().save} onPress={save} disabled={!canSave} testID="format-save" />
        )}
      </PrimaryActionZone>
      </Reanimated.View>
      {isFilterOpen ? (
        <MovementFilterSheet
          // Recette du 04/11/2026 (f4-catalogue) : feuille arrêtée à la limite de la zone de contexte, montée et descente lentes.
          docked={{ top: MODAL_TOP + bandHeight }}
          filters={catalogueFilters}
          onApply={(next, labels) => {
            setCatalogueFilters(next);
            setFilterLabels(labels);
            setIsFilterOpen(false);
          }}
          onClose={() => setIsFilterOpen(false)}
        />
      ) : null}
      {/* Barre du clavier des tableaux, identique à celle du tableau des séries variables (iOS). */}
      {Platform.OS === "ios" && focusedCell !== null && keyboardFrame !== null ? (
        <KeyboardAccessoryBar
          keyboardFrame={keyboardFrame}
          containerBottom={windowHeight}
          reduceMotion={reduceMotion}
          onHeight={setBarHeight}
          canPrevious={focusedAt > 0}
          canNext={focusedAt >= 0 && focusedAt < cellOrder.length - 1}
          onPrevious={() => focusCell(cellOrder[focusedAt - 1])}
          onNext={() => focusCell(cellOrder[focusedAt + 1])}
          onClose={() => Keyboard.dismiss()}
          units={unitsBar}
        />
      ) : null}
    </View>
  );

  function updateValues(index: number, values: MovementValues) {
    setMovements((current) => current.map((item, at) => (at === index ? { ...item, values } : item)));
  }

  function movementCard(item: ModelMovement, index: number, isBuyInCard: boolean) {
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
        if (target < firstMovable || target > lastMovable || isBuyInCard) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
      });
    return (
      <View
        key={item.exercise.id}
        style={[styles.cardSlot, lifted ? [styles.liftedCard, { transform: [{ translateY: drag?.dy ?? 0 }] }] : shift !== 0 ? { transform: [{ translateY: shift }] } : null]}
        onLayout={(event) => {
          if (index === firstMovable) cardStep.current = event.nativeEvent.layout.height + CARD_GAP;
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
          {...(isBuyInCard ? {} : { onLongPress: () => startDrag(index) })}
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

function SectionHeader({ label, link, onLink, testID }: { label: string; link: string; onLink: () => void; testID: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Pressable onPress={onLink} hitSlop={10} accessibilityRole="button" accessibilityLabel={link} testID={`${testID}-link`}>
        <Text style={styles.link}>{link}</Text>
      </Pressable>
    </View>
  );
}

/** Durée du Déroulé générique d'un questionnaire sans mouvement (modèles à durée calculable). */
function genericDuration(model: FormatModelKey, answers: ModelAnswers): string {
  switch (model) {
    case "TABATA":
    case "INTERVALS_30_30":
      return formatSeconds((answers.seriesCount ?? 0) * ((answers.workSeconds ?? 0) + (answers.pauseSeconds ?? 0)));
    case "EMOM":
      return formatSeconds((answers.seriesCount ?? 0) * (answers.intervalSeconds ?? 0));
    case "AMRAP": {
      const blocks = answers.blockCount ?? 1;
      return formatSeconds(blocks * (answers.durationSeconds ?? 0) + (blocks - 1) * (answers.restBetweenBlocksSeconds ?? 0));
    }
    default:
      return t().dash;
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  modalRoot: { flex: 1, backgroundColor: "transparent" },
  // Même voile que la fenêtre Formats, qui reste en place à l'ouverture (recette du 04/11/2026).
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: FORMATS_SCRIM },
  band: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 },
  bandFade: { height: CONTEXT_FADE_HEIGHT },
  bandFadeLayer: { position: "absolute", top: 0, left: 0, right: 0 },
  catalogueHead: { marginBottom: 10 },
  catalogueField: { flex: 1, justifyContent: "center" },
  catalogueButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchInputWithClear: { paddingRight: 36 },
  searchClear: { position: "absolute", right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: "#DDE0E6", alignItems: "center", justifyContent: "center" },
  familyRailZone: { position: "absolute", left: -6, top: 26, bottom: 26, width: 16, alignItems: "center", zIndex: 1 },
  familyRailLine: { width: 2, flex: 1, borderRadius: 1, backgroundColor: "#B9BDF5" },
  tableBare: { marginTop: 12, marginHorizontal: 16 },
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
  modalTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: LABEL, textAlign: "center", paddingHorizontal: 48 },
  // Mise à jour du 04/11/2026 §1 : accroche 14/20 centrée, sur deux lignes, en Mali Medium Italic (Figma).
  tagline: { fontFamily: "Mali_500Medium_Italic", fontSize: 14, lineHeight: 20, color: TAGLINE, marginTop: 4, textAlign: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginTop: 5, marginBottom: 8 },
  sectionLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  section: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION, marginHorizontal: 16, marginTop: 22, marginBottom: 8 },
  link: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, color: VALUE_COLOR },
  search: { marginHorizontal: 16, gap: 8, marginBottom: 8 },
  catalogueCommands: { flexDirection: "row", alignItems: "center", gap: 8 },
  catalogueList: { gap: 8, paddingTop: 4 },
  family: { gap: 8, paddingLeft: 8 },
  familyLine: { position: "absolute", left: 2, top: 26, bottom: 26, width: 2, borderRadius: 1, backgroundColor: "#B9BDF5" },
  pilesToggle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#C9CDD6", alignItems: "center", justifyContent: "center", gap: 2 },
  pilesToggleOn: { borderColor: VALUE_COLOR },
  pilesGlyph: { width: 14, height: 3, borderRadius: 1.5, borderWidth: 1, borderColor: "#7A7F8C" },
  pilesGlyphOn: { borderColor: VALUE_COLOR },
  searchInput: { height: 44, borderRadius: 12, backgroundColor: PANEL, paddingHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 16, color: LABEL },
  suggestions: { flexGrow: 0, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E8F0" },
  suggestionsContent: { gap: 8, padding: 8 },
  cardSlot: { marginHorizontal: 16, marginBottom: CARD_GAP },
  liftedCard: { zIndex: 2, shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fallbackCard: { minHeight: 52, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, backgroundColor: PANEL },
  panel: { marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, paddingHorizontal: 16 },
  row: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, gap: 8 },
  rowSeparated: { borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  rowLabel: { flexShrink: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  readValue: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: LABEL },
  stepperHost: { minHeight: 26, justifyContent: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperSign: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: VALUE_COLOR, minWidth: 18, textAlign: "center" },
  stepperSignDisabled: { color: DISABLED_VALUE },
  badge: { backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: VALUE_COLOR },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CHIP, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, color: "#FFFFFF" },
  chipChevron: { fontSize: 12, color: "#FFFFFF" },
  spacer: { flexGrow: 1, minHeight: 12 },
  tablePanel: { marginTop: 12, paddingHorizontal: 0 },
  alert: { marginHorizontal: 16, marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, color: tokenColors.danger },
  badgeAlert: { backgroundColor: tokenColors.dangerSurface },
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
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4, marginTop: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 12, color: LABEL },
});
