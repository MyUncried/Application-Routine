import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { rankMovements } from "@/domain/activities/movementSuggestion";
import {
  answerBounds,
  appendModelToDraft,
  buildModelElements,
  executionOptions,
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
import { modelTimeline, type Timeline } from "@/domain/sessions/formatTimeline";
import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { SelectedMovementCard } from "@/features/activities/SelectedMovementCard";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { useFormatModelDraft } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelIllustration, formatModelColors } from "@/features/sessions/FormatsWindow";
import { exerciseOfMovement, takeMovementsHandedToFormat, type MovementExerciseDefaults } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { FINAL_ACTION_TOP_MARGIN } from "@/shared/ui/finalAction";

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
/** Bas du cadre Déroulé à 25 px du haut du bouton (référence §15). */
const TIMELINE_TO_BUTTON = 25;

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`;
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

function TimelineFrame({ timeline, endLabel, band, names, testID }: { timeline: Timeline; endLabel: string; band: string; names: readonly string[]; testID: string }) {
  const height = 22;
  return (
    <View style={styles.timeline} testID={testID}>
      <View style={styles.timelineBlocks}>
        {timeline.blocks.map((block, index) => {
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
            <View key={index} style={[styles.timelineBlock, { flex: block.weight, height: Math.max(8, height * block.height), backgroundColor: color }]}>
              {block.label !== null ? (
                <Text style={[styles.timelineLabel, block.buyIn === true ? styles.timelineLabelOnDark : null]} numberOfLines={1}>
                  {block.label}
                </Text>
              ) : null}
            </View>
          );
        })}
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

export function FormatModelScreen({ stage }: { readonly stage: Stage }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ model?: string }>();
  const routeModel: FormatModelKey = isFormatModelKey(params.model) ? params.model : "TABATA";
  const { draft: modelDraft, start, setAnswers, setMovements, setName } = useFormatModelDraft();
  const sessionDraft = useSessionDraft();
  const service = useActivityDefinitionService();
  const profileService = useContext(ProfileServiceContext);
  const actionZone = usePrimaryActionZone();

  // Questionnaire ouvert depuis la fenêtre Formats : brouillon de modèle neuf.
  useEffect(() => {
    if (stage === "questionnaire" && (modelDraft === null || modelDraft.model !== routeModel)) start(routeModel);
  }, [modelDraft, routeModel, stage, start]);
  const model = modelDraft?.model ?? routeModel;
  const answers = useMemo(() => modelDraft?.answers ?? ({} as ModelAnswers), [modelDraft]);
  const movements = useMemo(() => modelDraft?.movements ?? [], [modelDraft]);
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
        // Buy-in : premier mouvement (choisi d'abord, §7.3), remplacé par « Changer » (§7.4).
        if (role === "BUY_IN") return current.length > 0 && hasBuyIn.current ? [...mapped.slice(0, 1), ...current.slice(1)] : [...mapped.slice(0, 1), ...current];
        return [...current, ...mapped];
      });
      for (const { movement } of entries) movementsById.current.set(movement.id, movement);
      if (role === "BUY_IN") hasBuyIn.current = true;
      if (stage === "questionnaire") router.push({ pathname: "/format-summary", params: { model } });
    },
    [defaults, model, modelDraft, router, setMovements, stage],
  );

  // Mouvements remis par la modale du Catalogue au retour sur l'écran.
  const movementsById = useRef(new Map<string, Movement>());
  // Buy-in déjà choisi : « Changer » le remplace (le premier mouvement reste le buy-in).
  const hasBuyIn = useRef(answers.buyIn === true && movements.length > 0);
  useFocusEffect(
    useCallback(() => {
      const handed = takeMovementsHandedToFormat();
      if (handed !== null) addMovements(handed.movements, handed.role);
    }, [addMovements]),
  );

  // Champ de saisie d'un mouvement (§7.1).
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
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
    setSearchOpen(false);
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
          ? formatSessionDurationEstimate(duration)
          : genericDuration(model, answers);

  const busyRef = useRef(false);
  const save = () => {
    if (busyRef.current || movements.length === 0) return;
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
    router.dismissTo("/composition");
  };

  const close = () => router.back();

  // Lignes de paramètres du modèle.
  const stepRow = (id: ModelAnswerKey, label: string, options: { last?: boolean; format?: (value: number) => string } = {}) => {
    const value = answers[id];
    const bounds = answerBounds(id);
    const isSeconds = SECONDS_KEYS.has(id);
    const numeric = typeof value === "number" ? value : null;
    const text = numeric === null ? t().noLimit : options.format !== undefined ? options.format(numeric) : isSeconds ? formatSeconds(numeric) : String(numeric);
    const onStep = (direction: 1 | -1) =>
      setAnswers((current) => {
        const raw = current[id];
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
        onValueChange={(value) => setAnswers((current) => withAnswer(current, id, value))}
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
  const totalRow = (last: boolean) => readRow(t().totalDuration, movements.length === 0 && duration === null ? genericDuration(model, answers) : duration === null ? t().dash : formatSessionDurationEstimate(duration), "total", last);

  const options = executionOptions(model);
  const showExecution = options.length > 0 && movements.length > 1;
  const execution: ModelExecution = answers.execution ?? options[0] ?? "SEQUENCE";
  const executionRow = () => (
    <Row key="execution" label={t().execution} last testID="format-row-execution">
      <Pressable
        onPress={() => {
          const labels = options.map((option) => t().executions[option]);
          const pick = (index: number) => {
            const option = options[index];
            if (option !== undefined) setAnswers((current) => ({ ...current, execution: option }));
          };
          if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions({ options: [...labels, strings.screens.activities.addToSession.cancel], cancelButtonIndex: labels.length, title: t().execution }, (index) => {
              if (index < labels.length) pick(index);
            });
          } else {
            pick((options.indexOf(execution) + 1) % options.length);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t().execution}, ${t().executions[execution]}`}
        style={styles.chip}
        testID="format-execution"
      >
        <Text style={styles.chipText}>{t().executions[execution]}</Text>
        <Text style={styles.chipChevron}>⌃</Text>
      </Pressable>
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
        return withExecution([stepRow("seriesCount", r.seriesCount), stepRow("repetitions", r.repetitions), ...(answers.pauseSeconds !== undefined ? [stepRow("pauseSeconds", r.pauseSeconds)] : []), totalRow(!showExecution)]);
      case "UNTIL_FAILURE":
        return withExecution([stepRow("seriesCount", r.seriesCount), readRow(r.targetPerSeries, t().atFailure, "target"), totalRow(!showExecution)]);
      case "PROGRESSION":
        return withExecution([stepRow("seriesCount", r.seriesCount, { last: stage === "summary" })]);
      case "SUPERSET":
        return [stepRow("roundCount", r.supersetRounds, { format: (value) => `${value} ${value > 1 ? t().roundUnit.many : t().roundUnit.one}` }), readRow(r.repetitions, t().dash, "repetitions"), totalRow(true)];
      default: {
        const unreachable: never = model;
        return unreachable;
      }
    }
  }

  const buyIn = model === "AMRAP" && answers.buyIn === true;
  const scrollRef = useRef<ScrollView>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  return (
    <ScreenShell>
      <FixedHeader
        title={`${t().titlePrefix} ${modelName}`}
        onBack={close}
        backAccessibilityLabel={stage === "questionnaire" ? t().closeAccessibilityLabel : t().backAccessibilityLabel}
        closeIcon={stage === "questionnaire"}
      />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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
        {buyIn && stage === "summary" ? (
          <>
            <SectionHeader label={t().buyInSection} link={t().change} onLink={() => openCatalogue("format-buy-in")} testID="format-buy-in" />
            {movements.slice(0, 1).map((item, index) => movementCard(item, index, true))}
            <SectionHeader label={t().loopSection} link={t().add} onLink={() => openCatalogue("format-loop")} testID="format-loop" />
            {movements.slice(1).map((item, index) => movementCard(item, index + 1, false))}
          </>
        ) : (
          <>
            <SectionHeader
              label={t().movements}
              link={searchOpen ? t().openCatalogue : t().add}
              onLink={() => (searchOpen ? openCatalogue(buyIn && movements.length === 0 ? "format-buy-in" : "format-loop") : setSearchOpen(true))}
              testID="format-movements"
            />
            {searchOpen ? (
              <View style={styles.search}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  placeholder={t().searchPlaceholder}
                  onBlur={() => {
                    if (query.trim().length === 0) setSearchOpen(false);
                  }}
                  style={styles.searchInput}
                  accessibilityLabel={t().searchPlaceholder}
                  testID="format-search"
                />
                {ranked.length > 0 ? (
                  <View style={styles.suggestions} testID="format-suggestions">
                    {ranked.map((choice) => (
                      <SelectedMovementCard
                        key={choice.movement.id}
                        movement={choice.movement}
                        levelRank={choice.level?.rank ?? null}
                        onPress={() => {
                          setSearchOpen(false);
                          setQuery("");
                          addMovements([choice.movement], buyIn && movements.length === 0 ? "BUY_IN" : "LOOP");
                        }}
                        testID={`format-suggestion-${choice.movement.id}`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {movements.map((item, index) => movementCard(item, index, false))}
          </>
        )}

        <Text style={styles.section}>{t().parameters}</Text>
        <View style={styles.panel} testID="format-parameters">
          {rows}
          {model === "PROGRESSION" && stage === "summary" ? <ProgressionTable movements={movements} onChange={updateValues} /> : null}
          {model === "PROGRESSION" ? (
            <>
              {answers.pauseSeconds !== undefined ? stepRow("pauseSeconds", t().rows.pauseSeconds) : null}
              {totalRow(!showExecution)}
            </>
          ) : null}
        </View>
        {model === "AMRAP" && stage === "summary" ? <AmrapTable movements={movements} buyIn={buyIn} increasing={answers.increasingVolume === true} onChange={updateValues} /> : null}
        {model === "FOR_TIME" && stage === "summary" ? <ForTimeTable movements={movements} rounds={answers.roundCount ?? 1} onChange={updateValues} /> : null}

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
        <PrimaryActionButton label={t().save} onPress={save} disabled={movements.length === 0} testID="format-save" />
      </PrimaryActionZone>
    </ScreenShell>
  );

  function updateValues(index: number, values: MovementValues) {
    setMovements((current) => current.map((item, at) => (at === index ? { ...item, values } : item)));
  }

  function movementCard(item: ModelMovement, index: number, isBuyInCard: boolean) {
    const movement = movementOf(item);
    // Variante « Suppression = Bloquée » pour le dernier mouvement de la boucle (§7.4).
    const loopCount = movements.length - (buyIn ? 1 : 0);
    const blocked = !isBuyInCard && loopCount <= 1;
    const remove = () => setMovements((current) => current.filter((_, at) => at !== index));
    const move = (direction: -1 | 1) =>
      setMovements((current) => {
        const target = index + direction;
        if (target < (buyIn ? 1 : 0) || target >= current.length || isBuyInCard) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
      });
    return (
      <View key={item.exercise.id} style={styles.cardSlot}>
        <SwipeActionsRow
          actions={[{ key: "delete", label: t().delete, backgroundColor: "#E5484D", disabled: blocked, onPress: remove }]}
          revealed={revealedId === item.exercise.id}
          onReveal={() => setRevealedId(item.exercise.id)}
          onHide={() => setRevealedId(null)}
          onPress={() => setRevealedId(null)}
          accessibilityLabel={item.exercise.name}
          {...(blocked ? { accessibilityHint: t().lastLoopMovement } : {})}
          extraAccessibilityActions={[
            { name: "moveUp", label: t().moveUp, onAction: () => move(-1) },
            { name: "moveDown", label: t().moveDown, onAction: () => move(1) },
          ]}
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
  onSubmit,
  testID,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  decimal?: boolean;
  disabled?: boolean;
  prefix?: string;
  label: string;
  inputRef?: (input: TextInput | null) => void;
  onSubmit?: () => void;
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
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      returnKeyType={onSubmit !== undefined ? "next" : "done"}
      onSubmitEditing={onSubmit}
      submitBehavior={onSubmit !== undefined ? "submit" : "blurAndSubmit"}
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
}: {
  movements: readonly ModelMovement[];
  buyIn: boolean;
  increasing: boolean;
  onChange: (index: number, values: MovementValues) => void;
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
        const isBuyIn = buyIn && index === 0;
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

function ForTimeTable({ movements, rounds, onChange }: { movements: readonly ModelMovement[]; rounds: number; onChange: (index: number, values: MovementValues) => void }) {
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
function ProgressionTable({ movements, onChange }: { movements: readonly ModelMovement[]; onChange: (index: number, values: MovementValues) => void }) {
  const tt = t().table;
  const count = Math.max(0, ...movements.map((item) => item.values.cells?.length ?? 0));
  const columns = Array.from({ length: count }, (_, index) => index);
  const inputs = useRef(new Map<string, TextInput | null>());
  const order: string[] = [];
  movements.forEach((item, index) =>
    columns.forEach((column) => {
      order.push(`${index}-${column}-r`);
      if (item.exercise.executionParameters.loadEnabled) order.push(`${index}-${column}-l`);
    }),
  );
  const next = (key: string) => () => {
    const at = order.indexOf(key);
    const following = order[at + 1];
    if (following !== undefined) inputs.current.get(following)?.focus();
  };
  return (
    <View style={styles.progressionTable} testID="format-progression-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        {columns.map((column) => (
          <Text key={column} style={styles.tableHead}>
            {tt.series.replace("{n}", String(column + 1))}
          </Text>
        ))}
      </View>
      {movements.map((item, index) => {
        const withLoad = item.exercise.executionParameters.loadEnabled;
        const setCell = (column: number, patch: { repetitions?: number | null; loadKg?: number | null }) => {
          const cells = (item.values.cells ?? []).map((cell, at) => (at === column ? { ...cell, ...patch } : cell));
          onChange(index, { ...item.values, cells });
        };
        return (
          <View key={item.exercise.id} style={[styles.tableRow, withLoad ? styles.tableRowLoad : null]}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {item.exercise.name}
            </Text>
            {columns.map((column) => {
              const cell = item.values.cells?.[column] ?? { repetitions: null, loadKg: null };
              const column1 = tt.series.replace("{n}", String(column + 1));
              return (
                <View key={column} style={styles.progressionCell}>
                  <NumberCell
                    value={cell.repetitions}
                    onChange={(value) => setCell(column, { repetitions: value })}
                    inputRef={(input) => inputs.current.set(`${index}-${column}-r`, input)}
                    onSubmit={next(`${index}-${column}-r`)}
                    label={tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", column1).replace("{kind}", tt.repetitionsKind)}
                    testID={`format-progression-${index}-${column}-reps`}
                  />
                  {withLoad ? (
                    <NumberCell
                      value={cell.loadKg}
                      decimal
                      onChange={(value) => setCell(column, { loadKg: value })}
                      inputRef={(input) => inputs.current.set(`${index}-${column}-l`, input)}
                      onSubmit={next(`${index}-${column}-l`)}
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
  suggestions: { gap: 8, padding: 8, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E8F0" },
  cardSlot: { marginHorizontal: 16, marginBottom: 8 },
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
  cell: { width: 56, textAlign: "center", fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: VALUE_COLOR, paddingVertical: 2 },
  cellDisabled: { color: DISABLED_VALUE },
  progressionCell: { width: 56, alignItems: "center" },
  radioSlot: { width: 56, alignItems: "center", justifyContent: "center", minHeight: 36 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: VALUE_COLOR, backgroundColor: VALUE_COLOR },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  spacer: { flexGrow: 1, minHeight: 12 },
  timeline: { marginHorizontal: 16, borderRadius: 16, backgroundColor: PANEL, paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  timelineBlocks: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 22 },
  timelineBlock: { minWidth: 4, borderRadius: 3, alignItems: "center", justifyContent: "center", overflow: "hidden" },
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
