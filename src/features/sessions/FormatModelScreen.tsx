import { Button as SwiftUIButton, Host, Image as SwiftUIImage, Menu, RNHostView, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as swiftUIAccessibilityLabel, accessibilityValue as swiftUIAccessibilityValue } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
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

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { SessionDurationResult } from "@/domain/activities/executionCalculations";
import type { Movement } from "@/domain/activities/Movement";
import { rankMovements } from "@/domain/activities/movementSuggestion";
import {
  answerBounds,
  appendModelToDraft,
  basePause,
  buildModelElements,
  executionOptions,
  hasChosenBuyIn,
  initialAnswers,
  initialMovementValues,
  isFormatModelKey,
  modelDuration,
  withAnswer,
  type FormatModelKey,
  type ModelAnswerKey,
  type ModelAnswers,
  type ModelExecution,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { modelTimeline, type Timeline, type TimelineBlock } from "@/domain/sessions/formatTimeline";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import { SelectedMovementCard } from "@/features/activities/SelectedMovementCard";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { useFormatModelDraft } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelIllustration, formatModelColors } from "@/features/sessions/FormatsWindow";
import { exerciseOfMovement, takeMovementsHandedToFormat, type MovementExerciseDefaults } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { FINAL_ACTION_TOP_MARGIN } from "@/shared/ui/finalAction";
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
 * Écart signalé : la police d'accroche « Mali Medium Italic » n'est pas embarquée — Inter italique.
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
const PROGRESSION_NAME_WIDTH = 112;
const PROGRESSION_COLUMN_WIDTH = 56;
const PROGRESSION_ROW_HEIGHT = 36;
const PROGRESSION_LOAD_ROW_HEIGHT = 72;

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

/**
 * Ordre de saisie des cellules des tableaux du récapitulatif (Suivant / Précédent) — recette iPhone n° 3 du
 * 03/11/2026 (autres constats, Hermann : « Il faut pouvoir entrer les valeurs du nombre de répétition et de
 * l'incrément : clavier ouvert, boutons précédent / suivant / fermer identique au clavier du tableau des séries
 * variables »). Cellules désactivées (Max) exclues.
 */
function tableCellOrder(model: FormatModelKey, movements: readonly ModelMovement[], answers: ModelAnswers): string[] {
  const order: string[] = [];
  movements.forEach((item, index) => {
    switch (model) {
      case "AMRAP": {
        const isBuyIn = answers.buyIn === true && item.buyIn === true;
        if (!isBuyIn && item.values.max === true) return;
        order.push(`amrap-${index}-r`);
        if (answers.increasingVolume === true && !isBuyIn) order.push(`amrap-${index}-i`);
        return;
      }
      case "FOR_TIME":
        for (let column = 0; column < (answers.roundCount ?? 1); column += 1) order.push(`fortime-${index}-${column}`);
        return;
      case "PROGRESSION":
        (item.values.cells ?? []).forEach((_, column) => {
          order.push(`progression-${index}-${column}-r`);
          if (item.exercise.executionParameters.loadEnabled) order.push(`progression-${index}-${column}-l`);
        });
        return;
      default:
        return;
    }
  });
  return order;
}

/** Branchement d'une cellule de tableau sur la navigation au clavier. */
type CellBinding = (key: string) => {
  readonly inputRef: (input: TextInput | null) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
};

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
  testID,
}: {
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
          <Pressable onPress={() => setOpen(false)} style={styles.badge} testID={`${testID}-value`}>
            <Text style={styles.badgeText}>{text}</Text>
          </Pressable>
          <Pressable onPress={() => onStep(1)} disabled={!canIncrease} hitSlop={8} accessibilityLabel={t().increase} testID={`${testID}-increase`}>
            <Text style={[styles.stepperSign, !canIncrease ? styles.stepperSignDisabled : null]}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} style={styles.badge} hitSlop={6} testID={`${testID}-badge`}>
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
      <View style={styles.timelineBlocks}>
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

/**
 * Décision de Hermann du 03/11/2026 : « Il faut être homogène entre tous les écrans similaires, "Valider ces
 * paramètres" pour passer du questionnaire initial au récapitulatif avec les données à compléter,
 * "Enregistrer dans la séance" lorsque le prochain écran est la séance. » Récapitulatif à compléter
 * (tableaux) : AMRAP, For time, Progression. Les autres modèles enregistrent depuis le questionnaire.
 */
const validatesFirst = (model: FormatModelKey) => model === "AMRAP" || model === "FOR_TIME" || model === "PROGRESSION";

/** Compteur des ouvertures de questionnaire (identité du brouillon de modèle de chaque ouverture). */
let openings = 0;

export function FormatModelScreen({ stage }: { readonly stage: Stage }) {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ model?: string }>();
  const routeModel: FormatModelKey = isFormatModelKey(params.model) ? params.model : "TABATA";
  const { draft: modelDraft, start, setAnswers, setMovements, setName } = useFormatModelDraft();
  const sessionDraft = useSessionDraft();
  const service = useActivityDefinitionService();
  const profileService = useContext(ProfileServiceContext);
  const actionZone = usePrimaryActionZone();

  // Questionnaire ouvert depuis la fenêtre Formats : brouillon de modèle neuf, à chaque ouverture —
  // recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « ajouter un deuxième format ouvre le
  // questionnaire déjà validé avec ses mouvements et ses paramètres au lieu d'ouvrir un questionnaire
  // vierge »). Le retour depuis le récapitulatif ne remonte pas le questionnaire : réponses conservées.
  const [opening] = useState(() => `opening-${++openings}`);
  const fresh = stage === "summary" || modelDraft?.opening === opening;
  useEffect(() => {
    if (stage === "questionnaire" && modelDraft?.opening !== opening) start(routeModel, opening);
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

  // Niveaux des Mouvements (cartes) et suggestions de saisie.
  const [choices, setChoices] = useState<readonly MovementChoice[]>([]);
  useEffect(() => {
    if (!service.supportsMovementSearch) return;
    let cancelled = false;
    service.listMovementChoices().then(
      (found) => {
        if (!cancelled) setChoices(found.filter((choice) => choice.archived !== true));
      },
      (error: unknown) => console.error("Les mouvements n'ont pas pu être lus.", error),
    );
    return () => {
      cancelled = true;
    };
  }, [service]);
  const levelOf = useCallback((movementId: string) => choices.find((choice) => choice.movement.id === movementId)?.level?.rank ?? null, [choices]);

  const addMovements = useCallback(
    (added: readonly Movement[], role: "LOOP" | "BUY_IN") => {
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
        return [...current, ...mapped];
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
  const [searchRole, setSearchRole] = useState<"LOOP" | "BUY_IN" | null>(null);
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
  const ranked = useMemo(() => {
    if (query.trim().length === 0) return [];
    const byId = new Map(choices.map((choice) => [choice.movement.id, choice]));
    return rankMovements(query, choices.map((choice) => choice.movement)).flatMap((item) => {
      const choice = byId.get(item.id);
      return choice === undefined ? [] : [choice];
    });
  }, [choices, query]);
  const openCatalogue = (purpose: "format-loop" | "format-buy-in") => {
    router.push({ pathname: "/movement-selection", params: { purpose, ...(query.trim().length > 0 ? { query } : {}) } });
    setSearchRole(null);
    setQuery("");
  };

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
  const buyIn = model === "AMRAP" && answers.buyIn === true;
  const canSave = buyIn ? hasChosenBuyIn(answers, movements) : movements.length > 0;
  const save = () => {
    if (busyRef.current || !canSave) return;
    busyRef.current = true;
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
    // B.9 : un nom saisi ici est personnalisé ; sinon le nom du modèle est suggéré (jamais imposé).
    const typed = modelDraft?.name.trim() ?? "";
    if (typed.length > 0) sessionDraft.updateDraft({ name: typed });
    else sessionDraft.suggestDraftName?.(modelName);
    backToComposition();
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

  const validate = () => {
    if (!canSave) return;
    router.push({ pathname: "/format-summary", params: { model } });
  };
  const validating = stage === "questionnaire" && validatesFirst(model);

  const close = () => router.back();

  // Lignes de paramètres du modèle.
  // `fallback` : valeur héritée affichée tant que la réponse n'est pas fixée (Pause du Renforcement : pause des Exercices).
  const stepRow = (id: ModelAnswerKey, label: string, options: { last?: boolean; format?: (value: number) => string; fallback?: number } = {}) => {
    const value = answers[id] ?? options.fallback;
    const bounds = answerBounds(id);
    const isSeconds = SECONDS_KEYS.has(id);
    const numeric = typeof value === "number" ? value : null;
    const text = numeric === null ? t().noLimit : options.format !== undefined ? options.format(numeric) : isSeconds ? formatSeconds(numeric) : String(numeric);
    const onStep = (direction: 1 | -1) =>
      setAnswers((current) => {
        const raw = current[id] ?? options.fallback;
        if (typeof raw !== "number") return direction > 0 ? withAnswer(current, id, bounds.min) : current;
        const next = raw + direction * (isSeconds ? durationStep(raw, direction) : 1);
        // Temps limite (§11) : sous le minimum, « Sans limite ».
        if (id === "timeCapSeconds" && next < bounds.min) return withAnswer(current, id, null);
        return withAnswer(current, id, next);
      });
    return (
      <Row key={id} label={label} last={options.last === true} testID={`format-row-${id}`}>
        <ValueStepper
          label={label}
          text={text}
          onStep={onStep}
          canDecrease={numeric !== null && (numeric > bounds.min || id === "timeCapSeconds")}
          canIncrease={numeric === null || numeric < bounds.max}
          testID={`format-${id}`}
        />
      </Row>
    );
  };
  const switchRow = (id: "buyIn" | "increasingVolume", label: string) => (
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
        return withExecution([stepRow("seriesCount", r.seriesCount), stepRow("intervalSeconds", r.intervalSeconds), readRow(r.rest, t().untilCadence, "rest"), totalRow(!showExecution)]).concat(
          several && sequence ? [stepRow("recoveryBetweenSeconds", r.recoveryBetweenSeconds, { last: true })] : [],
        );
      case "DEATH_BY":
        return withExecution([
          stepRow("intervalSeconds", r.intervalSeconds),
          stepRow("startRepetitions", r.startRepetitions, { format: (value) => `${value} ${t().repetitionsUnit}` }),
          stepRow("increment", r.increment, { format: (value) => `+ ${value} ${t().repetitionsUnit}` }),
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
        ];
      }
      case "FOR_TIME":
        return [stepRow("roundCount", r.roundCount), stepRow("restBetweenRoundsSeconds", r.restBetweenRoundsSeconds), stepRow("timeCapSeconds", r.timeCapSeconds, { last: true })];
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
  const buyInCount = buyIn && movements[0]?.buyIn === true ? 1 : 0;
  const firstMovable = buyInCount;
  const dragTarget = (current: { from: number; dy: number }) =>
    Math.max(firstMovable, Math.min(movements.length - 1, current.from + Math.round(current.dy / cardStep.current)));
  const startDrag = (index: number) => {
    if (index < firstMovable) return;
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
  const cardList = (items: readonly ModelMovement[], offset: number, isBuyIn: boolean) => (
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
      testID={isBuyIn ? "format-buy-in-cards" : "format-movement-cards"}
    >
      {items.map((item, at) => movementCard(item, at + offset, isBuyIn))}
    </View>
  );

  // Cellules des tableaux : focus, Suivant / Précédent, révélation au-dessus du clavier et de sa barre.
  const cellInputs = useRef(new Map<string, TextInput | null>());
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [barHeight, setBarHeight] = useState(KEYBOARD_BAR_HEIGHT);
  const cellOrder = useMemo(() => (stage === "summary" ? tableCellOrder(model, movements, answers) : []), [answers, model, movements, stage]);
  const focusCell = (key: string | undefined) => {
    if (key !== undefined) cellInputs.current.get(key)?.focus();
  };
  const cellBinding: CellBinding = (key) => ({
    inputRef: (input) => {
      cellInputs.current.set(key, input);
    },
    onFocus: () => setFocusedCell(key),
    onBlur: () => setFocusedCell((current) => (current === key ? null : current)),
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

  // Section de mouvements : en-tête, lien « + Ajouter » / « Changer » (champ de saisie), puis « Ouvrir le catalogue ».
  const movementSection = (role: "LOOP" | "BUY_IN", label: string, link: string, testID: string) => {
    const open = searchRole === role;
    const purpose = role === "BUY_IN" ? "format-buy-in" : "format-loop";
    return (
      <>
        <SectionHeader
          label={label}
          link={open ? t().openCatalogue : link}
          onLink={() => {
            if (open) openCatalogue(purpose);
            else {
              setQuery("");
              setSuggestionsTop(null);
              setSearchRole(role);
            }
          }}
          testID={testID}
        />
        {open ? (
          <View style={styles.search}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder={t().searchPlaceholder}
              // Recette n° 3 du 03/11/2026 (f3r-recherche : « appuyer sur entrée fait disparaître le clavier […]
              // Le clavier ne doit pas disparaître ») : Entrée ne retire pas le focus.
              submitBehavior="submit"
              onBlur={() => {
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
                  {ranked.map((choice) => (
                    <SelectedMovementCard
                      key={choice.movement.id}
                      movement={choice.movement}
                      levelRank={choice.level?.rank ?? null}
                      onPress={() => {
                        setSearchRole(null);
                        setQuery("");
                        addMovements([choice.movement], role);
                      }}
                      testID={`format-suggestion-${choice.movement.id}`}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <ScreenShell>
      <FixedHeader
        title={t().titles[model]}
        onBack={close}
        backAccessibilityLabel={stage === "questionnaire" ? t().closeAccessibilityLabel : t().backAccessibilityLabel}
        closeIcon={stage === "questionnaire"}
      />
      <ScrollView
        ref={scrollRef}
        // Recette n° 3 (f3-questionnaire : « L'écran doit rester fixe et le résultat défiler dans son cadre ») :
        // écran figé pendant la saisie d'un mouvement avec suggestions, et pendant le déplacement d'une carte.
        scrollEnabled={drag === null && !(searchOpen && ranked.length > 0)}
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
        contentContainerStyle={[styles.content, { paddingBottom: actionZone.scrollReserve - FINAL_ACTION_TOP_MARGIN + TIMELINE_TO_BUTTON }]}
        testID={`format-${stage}`}
      >
        {/* Zone de contexte : couleur et motif du modèle, nom, accroche (Figma `8624:29980`). */}
        <View style={[styles.context, { backgroundColor: colors.background }]}>
          <FormatModelIllustration model={model} />
          <TextInput
            value={modelDraft?.name ?? ""}
            onChangeText={setName}
            placeholder={t().namePlaceholder}
            placeholderTextColor={LABEL}
            accessibilityLabel={t().namePlaceholder}
            style={styles.name}
            testID="format-name"
          />
          <Text style={styles.tagline}>{t().taglines[model]}</Text>
        </View>

        {/* Mouvements (§7.1 à §7.4). */}
        {/* Recette n° 3 du 03/11/2026 (autres constats, Hermann : « Activer Buy-in : la section Buy-in apparaît, le
            nom de l'autre section change (en boucle...) ») : sections Buy-in et En boucle dès le questionnaire. */}
        {buyIn ? (
          <>
            {movementSection("BUY_IN", t().buyInSection, buyInCount > 0 ? t().change : t().add, "format-buy-in")}
            {cardList(movements.slice(0, buyInCount), 0, true)}
            {movementSection("LOOP", t().loopSection, t().add, "format-loop")}
            {cardList(movements.slice(buyInCount), buyInCount, false)}
          </>
        ) : (
          <>
            {movementSection("LOOP", t().movements, t().add, "format-movements")}
            {cardList(movements, 0, false)}
          </>
        )}

        <Text style={styles.section}>{t().parameters}</Text>
        <View style={styles.panel} testID="format-parameters">
          {rows}
          {model === "PROGRESSION" && stage === "summary" ? <ProgressionTable movements={movements} onChange={updateValues} cell={cellBinding} /> : null}
          {/* Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « Progression : il manque la pause » ; « ne pas calculer de
              durée total sur l'écran Questionnaire, l'utilisateur ne voit pas les valeur par défaut utilisées » ; « la ligne
              du mode d'exécution est la dernière, après la durée totale »). */}
          {model === "PROGRESSION" ? (
            <>
              {stepRow("pauseSeconds", t().rows.pauseSeconds, {
                fallback: movements[0] !== undefined ? basePause(movements[0].exercise) : 0,
                last: stage === "questionnaire" && !showExecution,
              })}
              {stage === "summary" ? totalRow(!showExecution) : null}
              {showExecution ? executionRow() : null}
            </>
          ) : null}
        </View>
        {model === "AMRAP" && stage === "summary" ? (
          <AmrapTable movements={movements} buyIn={buyIn} increasing={answers.increasingVolume === true} onChange={updateValues} cell={cellBinding} />
        ) : null}
        {model === "FOR_TIME" && stage === "summary" ? <ForTimeTable movements={movements} rounds={answers.roundCount ?? 1} onChange={updateValues} cell={cellBinding} /> : null}

        <View style={styles.spacer} />
        <Text style={styles.section}>{t().timeline}</Text>
        <TimelineFrame
          timeline={timeline}
          endLabel={endLabel}
          band={colors.band}
          names={movements.map((_, index) => movementName(index))}
          testID="format-timeline"
        />
      </ScrollView>
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="format-bottom-action">
        {validating ? (
          <PrimaryActionButton label={t().validate} onPress={validate} disabled={!canSave} testID="format-validate" />
        ) : (
          <PrimaryActionButton label={t().save} onPress={save} disabled={!canSave} testID="format-save" />
        )}
      </PrimaryActionZone>
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
        />
      ) : null}
    </ScreenShell>
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
        if (target < firstMovable || target >= current.length || isBuyInCard) return current;
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
            <SelectedMovementCard movement={movement} levelRank={levelOf(movement.id)} testID={`format-movement-card-${index}`} />
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
    return movementsById.current.get(id) ?? choices.find((choice) => choice.movement.id === id)?.movement ?? null;
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

// ---------------------------------------------------------------------------
// Tableaux du récapitulatif
// ---------------------------------------------------------------------------

function NumberCell({
  value,
  onChange,
  decimal = false,
  disabled = false,
  prefix = "",
  label,
  inputRef,
  onFocus,
  onBlur,
  testID,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  decimal?: boolean;
  disabled?: boolean;
  prefix?: string;
  label: string;
  inputRef?: (input: TextInput | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  testID: string;
}) {
  // Saisie directe au clavier numérique (répétitions) ou décimal (charge, D-405).
  const [text, setText] = useState(value === null ? "" : String(value));
  // Valeur changée hors de la saisie (adaptation à N, Max) : texte resynchronisé pendant le rendu.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    const parsed = decimal ? Number.parseFloat(text) : Number.parseInt(text, 10);
    if (!(value !== null && parsed === value)) setText(value === null ? "" : String(value));
  }
  return (
    <TextInput
      ref={inputRef}
      value={text === "" ? "" : `${prefix}${text}`}
      onChangeText={(raw) => {
        const cleaned = raw.replace(prefix, "").replace(",", ".");
        setText(cleaned);
        const parsed = decimal ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10);
        onChange(cleaned.trim() === "" || Number.isNaN(parsed) ? null : Math.max(0, parsed));
      }}
      editable={!disabled}
      // Recette n° 3 bis du 03/11/2026 (f3s-clavier, Hermann : « Supprimer le bouton "Next" du clavier ») :
      // pavé numérique sans touche de retour, comme le tableau des séries variables ; Précédent / Suivant /
      // Fermer dans la barre au-dessus du clavier.
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={t().dash}
      placeholderTextColor={DISABLED_VALUE}
      accessibilityLabel={label}
      style={[styles.cell, disabled ? styles.cellDisabled : null]}
      testID={testID}
    />
  );
}

function AmrapTable({
  movements,
  buyIn,
  increasing,
  onChange,
  cell,
}: {
  movements: readonly ModelMovement[];
  buyIn: boolean;
  increasing: boolean;
  onChange: (index: number, values: MovementValues) => void;
  cell: CellBinding;
}) {
  const tt = t().table;
  return (
    <View style={styles.table} testID="format-amrap-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={styles.tableHead}>{tt.repetitions}</Text>
        {increasing ? <Text style={styles.tableHead}>{tt.perRound}</Text> : null}
        <Text style={styles.tableHead}>{tt.max}</Text>
      </View>
      {movements.map((item, index) => {
        const isBuyIn = buyIn && item.buyIn === true;
        const max = !isBuyIn && item.values.max === true;
        const name = `${item.exercise.name}${isBuyIn ? tt.buyInSuffix : ""}`;
        return (
          <View key={item.exercise.id} style={styles.tableRow} testID={`format-amrap-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <NumberCell
              value={item.values.repetitions ?? null}
              disabled={max}
              onChange={(value) => onChange(index, { ...item.values, repetitions: value })}
              {...cell(`amrap-${index}-r`)}
              label={`${name}, ${tt.repetitions}`}
              testID={`format-amrap-reps-${index}`}
            />
            {increasing ? (
              isBuyIn ? (
                <Text style={styles.tableDash}>{t().dash}</Text>
              ) : (
                <NumberCell
                  value={item.values.increment ?? 0}
                  prefix="+ "
                  disabled={max}
                  onChange={(value) => onChange(index, { ...item.values, increment: value ?? 0 })}
                  {...cell(`amrap-${index}-i`)}
                  label={`${name}, ${tt.perRound}`}
                  testID={`format-amrap-increment-${index}`}
                />
              )
            ) : null}
            {isBuyIn ? (
              <View style={styles.radioSlot} />
            ) : (
              <Pressable
                onPress={() => onChange(index, { ...item.values, max: !max })}
                accessibilityRole="radio"
                accessibilityState={{ checked: max }}
                accessibilityLabel={`${name}, ${tt.max}`}
                style={styles.radioSlot}
                testID={`format-amrap-max-${index}`}
              >
                <View style={[styles.radio, max ? styles.radioOn : null]}>{max ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ForTimeTable({
  movements,
  rounds,
  onChange,
  cell,
}: {
  movements: readonly ModelMovement[];
  rounds: number;
  onChange: (index: number, values: MovementValues) => void;
  cell: CellBinding;
}) {
  const tt = t().table;
  const columns = Array.from({ length: rounds }, (_, index) => index);
  return (
    <View style={styles.table} testID="format-for-time-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        {columns.map((column) => (
          <Text key={column} style={styles.tableHead}>
            {tt.round.replace("{n}", String(column + 1))}
          </Text>
        ))}
      </View>
      {movements.map((item, index) => (
        <View key={item.exercise.id} style={styles.tableRow}>
          <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
            {item.exercise.name}
          </Text>
          {columns.map((column) => (
            <NumberCell
              key={column}
              value={item.values.volumes?.[column] ?? null}
              onChange={(value) => {
                const volumes = Array.from({ length: rounds }, (_, at) => (at === column ? value : (item.values.volumes?.[at] ?? null)));
                onChange(index, { ...item.values, volumes });
              }}
              {...cell(`fortime-${index}-${column}`)}
              label={`${item.exercise.name}, ${tt.round.replace("{n}", String(column + 1))}, ${tt.repetitionsKind}`}
              testID={`format-for-time-${index}-${column}`}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Tableau Progression (§9.3, CE-FMT-02) : une ligne par mouvement, une colonne par série ; répétitions,
 * et charge sous les répétitions si l'Exercice est « Avec » charge (réglage propre à chaque Exercice).
 * Toucher une cellule ouvre le clavier ; Suivant parcourt répétitions S1, charge S1, répétitions S2…
 */
/**
 * Recette n° 3 du 03/11/2026 (f3-depart, Hermann : « ajout de séries : réserver une largeur de zone protégée pour le
 * titre des mouvements, décaler les séries vers la gauche, mais elles disparaissent à la limite de la zone protégée,
 * faire défiler à droite et à gauche permet d'afficher les colonnes des séries ») : colonne des noms fixe ; colonnes
 * des séries calées à droite dans un défilement horizontal, qui suit la série ajoutée et la cellule saisie.
 */
function ProgressionTable({
  movements,
  onChange,
  cell,
}: {
  movements: readonly ModelMovement[];
  onChange: (index: number, values: MovementValues) => void;
  cell: CellBinding;
}) {
  const tt = t().table;
  const count = Math.max(0, ...movements.map((item) => item.values.cells?.length ?? 0));
  const columns = Array.from({ length: count }, (_, index) => index);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const viewport = useRef(0);
  const shownCount = useRef(count);
  // Série ajoutée : les colonnes se décalent vers la gauche, la dernière reste visible.
  useEffect(() => {
    if (count > shownCount.current) scrollRef.current?.scrollToEnd({ animated: false });
    shownCount.current = count;
  }, [count]);
  // Cellule saisie (Suivant / Précédent) : sa colonne est amenée dans la partie visible.
  const revealColumn = (column: number) => {
    const left = column * PROGRESSION_COLUMN_WIDTH;
    const right = left + PROGRESSION_COLUMN_WIDTH;
    if (left < scrollX.current) scrollRef.current?.scrollTo({ x: left, animated: false });
    else if (right > scrollX.current + viewport.current) scrollRef.current?.scrollTo({ x: right - viewport.current, animated: false });
  };
  const bind = (key: string, column: number) => {
    const binding = cell(key);
    return {
      ...binding,
      onFocus: () => {
        revealColumn(column);
        binding.onFocus();
      },
    };
  };
  const rowHeight = (item: ModelMovement) => (item.exercise.executionParameters.loadEnabled ? PROGRESSION_LOAD_ROW_HEIGHT : PROGRESSION_ROW_HEIGHT);
  return (
    <View style={[styles.progressionTable, styles.progressionColumns]} testID="format-progression-table">
      <View style={styles.progressionNames} testID="format-progression-names">
        <View style={styles.progressionHeader}>
          <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        </View>
        {movements.map((item) => (
          <View key={item.exercise.id} style={[styles.progressionRow, { height: rowHeight(item) }]}>
            <Text style={styles.tableCellText} numberOfLines={1}>
              {item.exercise.name}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.progressionScroll}
        contentContainerStyle={styles.progressionScrollContent}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.width;
        }}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        testID="format-progression-series"
      >
        <View style={styles.progressionSeries}>
          <View style={[styles.progressionHeader, styles.progressionCells]}>
            {columns.map((column) => (
              <Text key={column} style={styles.tableHead}>
                {tt.series.replace("{n}", String(column + 1))}
              </Text>
            ))}
          </View>
          {movements.map((item, index) => {
            const withLoad = item.exercise.executionParameters.loadEnabled;
            const setCell = (column: number, patch: { repetitions?: number | null; loadKg?: number | null }) => {
              const cells = (item.values.cells ?? []).map((entry, at) => (at === column ? { ...entry, ...patch } : entry));
              onChange(index, { ...item.values, cells });
            };
            return (
              <View key={item.exercise.id} style={[styles.progressionRow, styles.progressionCells, { height: rowHeight(item) }]}>
                {columns.map((column) => {
                  const entry = item.values.cells?.[column] ?? { repetitions: null, loadKg: null };
                  const column1 = tt.series.replace("{n}", String(column + 1));
                  return (
                    <View key={column} style={styles.progressionCell}>
                      <NumberCell
                        value={entry.repetitions}
                        onChange={(value) => setCell(column, { repetitions: value })}
                        {...bind(`progression-${index}-${column}-r`, column)}
                        label={tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", column1).replace("{kind}", tt.repetitionsKind)}
                        testID={`format-progression-${index}-${column}-reps`}
                      />
                      {withLoad ? (
                        <NumberCell
                          value={entry.loadKg}
                          decimal
                          onChange={(value) => setCell(column, { loadKg: value })}
                          {...bind(`progression-${index}-${column}-l`, column)}
                          label={tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", column1).replace("{kind}", tt.loadKind)}
                          testID={`format-progression-${index}-${column}-load`}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  context: { height: CONTEXT_HEIGHT, paddingHorizontal: 16, paddingTop: 20 },
  name: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 20, color: LABEL, padding: 0 },
  tagline: { fontFamily: "Inter_500Medium", fontStyle: "italic", fontSize: 13, lineHeight: 18, color: TAGLINE, marginTop: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginTop: 5, marginBottom: 8 },
  sectionLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  section: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION, marginHorizontal: 16, marginTop: 22, marginBottom: 8 },
  link: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, color: VALUE_COLOR },
  search: { marginHorizontal: 16, gap: 8, marginBottom: 8 },
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
  table: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: PANEL, overflow: "hidden" },
  progressionTable: { marginVertical: 8, borderRadius: 8, backgroundColor: "#FFFFFF", overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", height: 28, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  tableHead: { width: 56, textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  tableName: { flex: 1, textAlign: "left", width: undefined },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 36, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  tableRowLoad: { minHeight: 44 },
  tableCellText: { fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  tableDash: { width: 56, textAlign: "center", color: DISABLED_VALUE },
  // Recette n° 3 du 03/11/2026 (autres constats : « le champ Rép. n'est pas modifiable ») : zone tactile de la hauteur de la ligne.
  cell: { width: 56, minHeight: 36, textAlign: "center", fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: VALUE_COLOR, paddingVertical: 2 },
  cellDisabled: { color: DISABLED_VALUE },
  progressionCell: { width: PROGRESSION_COLUMN_WIDTH, alignItems: "center" },
  progressionColumns: { flexDirection: "row" },
  progressionNames: { width: PROGRESSION_NAME_WIDTH, paddingLeft: 12, paddingRight: 8 },
  progressionHeader: { flexDirection: "row", alignItems: "center", height: 28, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  progressionRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  // Colonnes calées à droite : une série ajoutée décale les précédentes vers la gauche.
  progressionCells: { justifyContent: "flex-end" },
  progressionSeries: { flexGrow: 1 },
  progressionScroll: { flex: 1 },
  progressionScrollContent: { flexGrow: 1, paddingRight: 12 },
  radioSlot: { width: 56, alignItems: "center", justifyContent: "center", minHeight: 36 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: VALUE_COLOR, backgroundColor: VALUE_COLOR },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  spacer: { flexGrow: 1, minHeight: 12 },
  timeline: { marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  timelineBlocks: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 22 },
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
