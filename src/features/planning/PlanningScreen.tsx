import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Alert, AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import {
  CYCLE_MAX,
  DAY_MULTIPLIER_MAX,
  DAY_MULTIPLIER_MIN,
  formatLocalDate,
  occurrenceInstant,
  REMINDER_MAX_MINUTES,
  REMINDER_PRESETS,
  validateRoutineDraft,
  WEEK_MULTIPLIER_MAX,
  WEEK_MULTIPLIER_MIN,
  WEEKDAYS,
  type LocalDate,
  type LocalTime,
  type RoutineEntry,
  type Weekday,
} from "@/domain/planning/Routine";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { normalizeRoutineName } from "@/features/planning/PlanningService";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import {
  applySelection,
  draftFromRoutine,
  effectiveName,
  END_COUNT_MAX,
  END_COUNT_MIN,
  everyLabel,
  formTitle,
  initialDraft,
  reminderLabel,
  toggleWeekday,
  toRoutineDraft,
  unitLabel,
  withEndCount,
  withEndDate,
  withEndKind,
  withSelection,
  withStartDate,
  withUnit,
  type FormDraft,
} from "@/features/planning/planningDraft";
import { gridIssues, rowMention, togglePoint, withCycle, type PlanningGrid } from "@/features/planning/planningGrid";
import { requestPlanningSheet } from "@/features/planning/planningSheetRelay";
import { PlanningSelection } from "@/features/planning/PlanningSelection";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatPlanningSynthesis } from "@/features/planning/planningSummary";
import { PlanningPopover, PlanningWheelPopover, type PopoverAnchor } from "@/features/planning/PlanningWheelPopover";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { formatCatalogueSessionDuration, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Planifier un parcours / une séance (CE-UI-12, D-519 à D-526, RM-253 à RM-264 ; 18/11/2026). Figma « Prototype MVP » :
 * grille `12650:27854`, cycle étendu `12624:29713`, séance seule `12652:28035`, date `12652:28155`, Rappel personnalisé
 * `12652:28306`, nombre de semaines `12652:28447`.
 *
 * Feuille native iOS (modale, D-522) : en-tête standard (✕, titre, coche) ; zone de contexte avec le nom de la
 * planification (texte libre, unique, RM-258 / RM-261) et la synthèse en 14 (RM-259) ; quatre cartes grises (D-521) :
 * Programme et Début le ; Répétition (D-520, RM-257) ; Séance par créneau (grille, D-519) ; Rappel (D-524).
 *
 * Parcours : Calendrier → Planifier → « Catalogue des séances » (cases rondes numérotées, coche d'en-tête, D-499) →
 * formulaire → coche : Enregistrer. Depuis une occurrence : modification ; Dupliquer : brouillon copié (RM-123) ; depuis
 * une Séance (« Planifier » du glisser à gauche) : Séance préremplie, nom copié (RM-258).
 *
 * Date, heure, nombre de semaines, « pendant » et Rappel « Autre » : sélecteur natif en popover près du champ, sans titre
 * ni bouton, fermé par un toucher sur le voile (D-520 ; recette du 19/11/2026, k19, k13, e2 : unités des roues du rappel
 * et de l'heure). Valeurs en bleu KODJO (recette du 19/11/2026, k8 : « mettre les textes de date et d'heure en bleu
 * Kodjo »). Borne « pendant » rétablie (recette du 19/11/2026, d4).
 *
 * [Remplacés le 18/11/2026 (D-523) : interrupteurs Répétition et Rappel, unité segmentée Jour · Semaine · Mois, stepper du
 * nombre de semaines, « pendant », liste réordonnable et feuille « Fréquence » (CE-UI-11), récapitulatif protégé en bas.]
 */

const t = planningStrings.form;
const tReminder = planningStrings.reminder;
/** Calendrier natif de « Début le » et de « jusqu'au » (recette du 18/11/2026, k8). */
const CALENDAR_MODIFIERS = [datePickerStyle("graphical"), tint(colors.primary)];
/** Roulette de l'heure : 00:00 à 23:59, à la minute. */
const TIME_MAX_MINUTES = 23 * 60 + 59;
const TIME_UNITS = { major: tReminder.hours, minor: tReminder.minutes, majorWidth: 56, minorWidth: 64 } as const;
const TIME_HOURS = Array.from({ length: 24 }, (_, index) => index);
const TIME_MINUTES = Array.from({ length: 60 }, (_, index) => index);
const END_COUNTS = Array.from({ length: END_COUNT_MAX - END_COUNT_MIN + 1 }, (_, index) => END_COUNT_MIN + index);
/** Largeur du calendrier graphique d'iOS dans son panneau. */
const DATE_PANEL_WIDTH = 360;
const twoDigits = (value: number) => String(value).padStart(2, "0");
/** D-524 : délai présélectionné quand les notifications sont déjà autorisées (recette du 18/11/2026, k12 « Remettre 15' par défaut »). */
const DEFAULT_REMINDER_MINUTES = 15;
/** Rappel « Autre » : heures 0..24, minutes par pas de 5 (grille de l'ancienne feuille), 24 h au plus (D-243). */
const REMINDER_HOURS = Array.from({ length: 25 }, (_, index) => index);
const REMINDER_MINUTES_STEP = Array.from({ length: 12 }, (_, index) => index * 5);
const POINT_SIZE = 18;
const COLUMN_WIDTH = 26;

type Params = { readonly routineId?: string; readonly duplicateOf?: string; readonly sessionId?: string; readonly date?: string };

type Mode = { readonly kind: "create" } | { readonly kind: "edit"; readonly routineId: string };

type Popover = { readonly kind: "EVERY" | "END_COUNT" | "REMINDER" | "TIME" | "START" | "END"; readonly anchor: PopoverAnchor };

function todayLocal(): LocalDate {
  return formatLocalDate(new Date());
}

function timeToDate(date: LocalDate, time: LocalTime): Date {
  return occurrenceInstant(date, time);
}

/**
 * Durée de la synthèse (RM-259) : séances jouées au premier créneau du cycle. Une séance : libellé de sa carte ; plusieurs :
 * somme, précédée de « ≥ » si une durée n'est pas exacte. [Hypothèse technique, 18/11/2026 : RM-259 ne dit pas quelle durée
 * afficher quand les créneaux d'un parcours diffèrent ; le premier créneau est celui de la première occurrence.]
 */
export function slotDurationLabel(
  entries: readonly RoutineEntry[],
  grid: PlanningGrid,
  projections: ReadonlyMap<string, SessionCatalogueProjection>,
): string {
  const played = entries.filter((_, row) => grid.points[row]?.[0] === true).map((entry) => projections.get(entry.sessionId));
  const known = played.filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
  if (known.length === 0) return "";
  if (known.length === 1) return formatCatalogueSessionDuration(known[0]!.duration, known[0]!.forTimeBound);
  if (known.some((projection) => projection.forTimeBound === null)) return "";
  const seconds = known.reduce((total, projection) => total + (projection.forTimeBound ?? Math.max(0, projection.duration.seconds)), 0);
  const exact = known.every((projection) => projection.forTimeBound === undefined && projection.duration.kind === "exact");
  return exact ? formatPhraseDuration(seconds) : `${strings.shared.durationNature.lowerBoundPrefix}${formatPhraseDuration(seconds)}`;
}

function measure(ref: RefObject<View | null>, then: (anchor: PopoverAnchor) => void) {
  const node = ref.current;
  if (node === null) return;
  node.measureInWindow((x, y, width, height) => then({ x, y, width, height }));
}

export function PlanningScreen({ params }: { readonly params: Params }) {
  const router = useRouter();
  const planning = usePlanningService();
  const { state: catalogue, reload } = useSessionCatalogue();
  // Nouvelle planification : brouillon immédiat ; modification et duplication : brouillon lu ci-dessous.
  const fresh = params.routineId === undefined && params.duplicateOf === undefined;
  const [initialEntries] = useState(() =>
    fresh && params.sessionId !== undefined ? applySelection([], [params.sessionId], () => Crypto.randomUUID()) : [],
  );
  const [mode, setMode] = useState<Mode | null>(() => (fresh ? { kind: "create" } : null));
  const [form, setForm] = useState<FormDraft | null>(() =>
    fresh ? initialDraft(params.date !== undefined && params.date >= todayLocal() ? params.date : todayLocal(), initialEntries, new Date()) : null,
  );
  // « Autre » choisi : la valeur personnalisée remplace le libellé « Autre », même si elle vaut un délai proposé.
  const [customChosen, setCustomChosen] = useState(false);
  const [popover, setPopover] = useState<Popover | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [otherNames, setOtherNames] = useState<readonly { readonly id: string; readonly key: string }[]>([]);
  // RM-259 : la synthèse dont les jours ne tenaient pas, mémorisée pour passer à « X jours par semaine ».
  const [overflowing, setOverflowing] = useState<string | null>(null);
  const savingRef = useRef(false);
  const reminderTouched = useRef(false);
  // Délai choisi pendant que les notifications étaient refusées : appliqué au retour de Réglages s'il est autorisé.
  const pendingReminder = useRef<(() => void) | null>(null);
  const everyRef = useRef<View>(null);
  const endCountRef = useRef<View>(null);
  const reminderRef = useRef<View>(null);
  const startDateRef = useRef<View>(null);
  const timeRef = useRef<View>(null);
  const endDateRef = useRef<View>(null);
  // L'écran se ferme par la navigation ; son identité ne doit pas relancer la lecture du brouillon.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload]);

  // RM-261 : noms des autres planifications, pour signaler un nom déjà pris sous le champ.
  useEffect(() => {
    let cancelled = false;
    planning.listRoutines().then(
      (routines) => {
        if (!cancelled) setOtherNames(routines.map((routine) => ({ id: routine.id, key: normalizeRoutineName(routine.name) })));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [planning]);

  // D-524 : nouvelle planification — 15 min présélectionnées si les notifications sont déjà autorisées ; sinon « Sans »,
  // l'autorisation n'étant demandée qu'au premier choix d'un délai (RM-052).
  useEffect(() => {
    if (!fresh) return undefined;
    let cancelled = false;
    planning.reminderPermissionGranted().then(
      (granted) => {
        if (cancelled || !granted || reminderTouched.current) return;
        setForm((current) => (current === null || current.reminderMinutes !== null ? current : { ...current, reminderMinutes: DEFAULT_REMINDER_MINUTES }));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [fresh, planning]);

  // Retour de Réglages : le délai choisi s'applique si les notifications sont désormais autorisées (recette du 19/11/2026, k14).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      const pending = pendingReminder.current;
      if (state !== "active" || pending === null) return;
      pendingReminder.current = null;
      planning.reminderPermissionGranted().then((granted) => (granted ? pending() : undefined), () => undefined);
    });
    return () => subscription.remove();
  }, [planning]);

  // Recette du 17/11/2026 (e3) : notifications retirées dans Réglages → le rappel revient à « Sans » (RM-053 ; recette du
  // 19/11/2026, k14 : sans texte sous la carte).
  const reminderOn = form !== null && form.reminderMinutes !== null;
  useEffect(() => {
    if (!reminderOn) return undefined;
    let cancelled = false;
    const check = () => {
      planning.reminderPermissionGranted().then(
        (granted) => {
          if (cancelled || granted) return;
          setForm((current) => (current === null ? current : { ...current, reminderMinutes: null }));
        },
        () => undefined,
      );
    };
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [reminderOn, planning]);

  // Chargement du brouillon d'une modification ou d'une duplication.
  useEffect(() => {
    let cancelled = false;
    if (params.routineId !== undefined) {
      const routineId = params.routineId;
      planning.getRoutine(routineId).then((routine) => {
        if (cancelled) return;
        if (routine === null) {
          routerRef.current.back();
          return;
        }
        setMode({ kind: "edit", routineId });
        setForm(draftFromRoutine(routine));
      }, () => routerRef.current.back());
    } else if (params.duplicateOf !== undefined) {
      planning.prepareDuplicate(params.duplicateOf).then((draft) => {
        if (cancelled) return;
        if (draft === null) {
          routerRef.current.back();
          return;
        }
        setMode({ kind: "create" });
        setForm(draftFromRoutine(draft));
      }, () => routerRef.current.back());
    }
    return () => {
      cancelled = true;
    };
  }, [params.routineId, params.duplicateOf, planning]);

  const projections = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);
  const activeSessions = useMemo(
    () => (catalogue.status === "ready" ? catalogue.sessions.filter((projection) => projection.status === "ACTIVE") : []),
    [catalogue],
  );
  // CE-UI-03 : « + Planifier » ouvre d'abord la sélection à cases, dans cette même feuille (recette du 18/11/2026).
  const [selecting, setSelecting] = useState(() => fresh && initialEntries.length === 0);

  if (form === null || mode === null) return <ScreenShell>{null}</ScreenShell>;

  const update = (patch: Partial<FormDraft>) => setForm((current) => (current === null ? current : { ...current, ...patch }));
  const close = () => router.back();
  const nameOf = (sessionId: string) => projections.get(sessionId)?.name;

  if (selecting) {
    return (
      <PlanningSelection
        sessions={activeSessions}
        loading={catalogue.status === "loading"}
        failed={catalogue.status === "error"}
        initial={[]}
        onCancel={close}
        onValidate={(selected) => {
          setForm((current) => (current === null ? current : withSelection(current, selected, () => Crypto.randomUUID())));
          setSelecting(false);
        }}
      />
    );
  }

  // Contenus indisponibles (Séance archivée ou supprimée) : retirés à l'enregistrement, jamais de référence fantôme.
  const available = (entry: RoutineEntry) => catalogue.status !== "ready" || projections.get(entry.sessionId)?.status === "ACTIVE";
  const rows = form.entries.flatMap((entry, row) => (available(entry) ? [{ entry, points: form.grid.points[row] ?? [] }] : []));
  const shown: FormDraft = { ...form, entries: rows.map((item) => item.entry), grid: { cycle: form.grid.cycle, points: rows.map((item) => item.points) } };
  const removed = form.entries.length - rows.length;
  const name = effectiveName(shown, nameOf);
  const draft = toRoutineDraft(shown, name);
  const nameKey = normalizeRoutineName(name);
  const nameTaken = nameKey !== "" && otherNames.some((other) => other.key === nameKey && (mode.kind !== "edit" || other.id !== mode.routineId));
  const nameMissing = name.trim() === "";
  const blocking = [...validateRoutineDraft(draft), ...gridIssues(shown.grid)];
  const canSave = blocking.length === 0 && !nameTaken && !saving && catalogue.status === "ready";

  const save = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    const request = mode.kind === "edit" ? planning.updateRoutine(mode.routineId, draft) : planning.createRoutine(draft);
    request.then(
      (result) => {
        savingRef.current = false;
        setSaving(false);
        if (result.status === "SAVED") router.back();
        else setSaveFailed(true);
      },
      (error: unknown) => {
        console.error("La planification n'a pas pu être enregistrée.", error);
        savingRef.current = false;
        setSaving(false);
        setSaveFailed(true);
      },
    );
  };

  // « Changer » : « Catalogue des séances » en feuille posée sur ce formulaire (recette du 17/11/2026, f/g). La sélection
  // validée remplace la liste (D-499) ; ✕ conserve la liste antérieure.
  const openSelection = () => {
    requestPlanningSheet({
      kind: "selection",
      initial: form.entries.map((entry) => entry.sessionId),
      onValidate: (selected) => setForm((current) => (current === null ? current : withSelection(current, selected, () => Crypto.randomUUID()))),
    });
    router.push("/planning-selection");
  };

  /**
   * RM-052 / RM-053 : autorisation demandée au premier choix d'un délai ; refus → « Sans ». Recette du 19/11/2026 (k14,
   * e3) : choisir de nouveau un délai alors que les notifications sont refusées ouvre un message natif proposant de les
   * autoriser. iOS ne repose jamais sa demande d'autorisation après un refus : « Autoriser » ouvre directement la page des
   * notifications de Routine dans Réglages, et le délai s'applique au retour si elles y ont été autorisées.
   */
  const withReminderPermission = (apply: () => void) => {
    if (form.reminderMinutes !== null) {
      apply();
      return;
    }
    planning.reminderPermissionStatus().then(
      (status) => {
        if (status === "granted") apply();
        else if (status === "undetermined") planning.ensureReminderPermission().then((granted) => (granted ? apply() : undefined), () => undefined);
        else
          Alert.alert(tReminder.deniedTitle, tReminder.deniedMessage, [
            { text: tReminder.deniedCancel, style: "cancel" },
            {
              text: tReminder.deniedSettings,
              onPress: () => {
                pendingReminder.current = apply;
                Linking.openSettings().catch(() => {
                  pendingReminder.current = null;
                });
              },
            },
          ]);
      },
      () => undefined,
    );
  };

  const chooseReminder = (minutes: number | null, custom: boolean) => {
    reminderTouched.current = true;
    if (minutes === null) {
      setCustomChosen(false);
      update({ reminderMinutes: null });
      return;
    }
    withReminderPermission(() => {
      setCustomChosen(custom);
      update({ reminderMinutes: minutes });
    });
  };

  const openReminderWheel = () => {
    reminderTouched.current = true;
    const start = form.reminderMinutes ?? DEFAULT_REMINDER_MINUTES;
    withReminderPermission(() => {
      setCustomChosen(true);
      update({ reminderMinutes: start });
      measure(reminderRef, (rect) => setPopover({ kind: "REMINDER", anchor: { x: rect.x + (rect.width * 4) / 5, y: rect.y, width: rect.width / 5, height: rect.height } }));
    });
  };

  const openPopover = (kind: Popover["kind"], ref: RefObject<View | null>) => measure(ref, (anchor) => setPopover({ kind, anchor }));
  const changeStartDate = (startDate: LocalDate) => setForm((current) => (current === null ? current : withStartDate(current, startDate)));
  const multiplierBounds = form.unit === "WEEK" ? [WEEK_MULTIPLIER_MIN, WEEK_MULTIPLIER_MAX] : [DAY_MULTIPLIER_MIN, DAY_MULTIPLIER_MAX];
  const everyValues = Array.from({ length: multiplierBounds[1]! - multiplierBounds[0]! + 1 }, (_, index) => multiplierBounds[0]! + index);
  const reminder = form.reminderMinutes;
  const customReminder = reminder !== null && (customChosen || !(REMINDER_PRESETS as readonly number[]).includes(reminder));
  const fullSynthesis = formatPlanningSynthesis(draft, slotDurationLabel(shown.entries, shown.grid, projections));
  const synthesis = overflowing === fullSynthesis ? formatPlanningSynthesis(draft, slotDurationLabel(shown.entries, shown.grid, projections), true) : fullSynthesis;
  const setReminderParts = (hours: number, minutes: number) =>
    update({ reminderMinutes: Math.max(5, Math.min(REMINDER_MAX_MINUTES, hours * 60 + (hours === 24 ? 0 : minutes))) });

  return (
    <ScreenShell>
      <NativeSheetTop
        title={formTitle(rows.length)}
        onClose={close}
        closeAccessibilityLabel={t.cancel}
        validate={{ onPress: save, enabled: canSave, accessibilityLabel: t.save }}
        headerBackground={colors.background}
        band={
          <View style={styles.contextBand}>
            {/* D-522 / RM-258 : nom libre, unique ; copié de la séance quand une seule est planifiée. */}
            <TextInput
              value={name}
              onChangeText={(value) => update({ name: value, nameEdited: true })}
              placeholder={t.namePlaceholder}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.nameAccessibility}
              style={styles.name}
              returnKeyType="done"
              testID="planning-name"
            />
            {nameMissing || nameTaken ? (
              <Text style={styles.nameError} accessibilityLiveRegion="polite" testID="planning-name-error">
                {nameTaken ? t.nameTaken : t.nameRequired}
              </Text>
            ) : null}
            {/* RM-259 : synthèse en 14 ; « X jours par semaine » quand les jours ne tiennent pas. */}
            <Text
              style={styles.synthesis}
              onTextLayout={(event) => {
                if (synthesis === fullSynthesis && event.nativeEvent.lines.length > 2 && overflowing !== fullSynthesis) setOverflowing(fullSynthesis);
              }}
              accessibilityLiveRegion="polite"
              testID="planning-synthesis"
            >
              {synthesis}
            </Text>
          </View>
        }
        renderScroll={(topHeight) => (
          <ScrollView
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingTop: topHeight + spacing[8] }]}
            keyboardShouldPersistTaps="handled"
            testID="planning-form"
          >
            {removed > 0 ? (
              <Text style={styles.notice} testID="planning-unavailable">
                {fillTemplate(t.unavailableContent, { count: String(removed) })}
              </Text>
            ) : null}

            {/* Carte 1 (D-521) : Programme ; Début le [date] à [heure]. Programme : aucune notion de programme dans KODJO. */}
            <View style={styles.card} testID="planning-slot">
              <View style={styles.line}>
                <Text style={styles.label}>{t.program}</Text>
                <View style={styles.pill} accessible accessibilityLabel={`${t.program} : ${t.programNone}`} testID="planning-program">
                  <Text style={styles.pillText}>{t.programNone}</Text>
                </View>
              </View>
              <View style={styles.line}>
                <Text style={styles.label}>{t.start}</Text>
                <Text style={styles.label}>{t.on}</Text>
                <View ref={startDateRef} collapsable={false}>
                  <Pill label={formatShortDate(form.startDate)} onPress={() => openPopover("START", startDateRef)} accessibilityLabel={`${t.datePicker}, ${formatShortDate(form.startDate)}`} testID="planning-start-date" />
                </View>
                <Text style={styles.label}>{t.at}</Text>
                <View ref={timeRef} collapsable={false}>
                  <Pill label={form.time} onPress={() => openPopover("TIME", timeRef)} accessibilityLabel={`${t.timePicker}, ${form.time}`} testID="planning-start-time" />
                </View>
              </View>
            </View>

            {/* Carte 2 (D-520, RM-257) : Répétition sans interrupteur. */}
            <View style={styles.card} testID="planning-repetition">
              <View style={styles.repetition}>
                <Text style={[styles.label, styles.repetitionLabel]}>{t.repetition}</Text>
                <View style={styles.repetitionValues}>
                  <View style={styles.wrapLine}>
                    <Pill
                      label={form.repetitionOn ? everyLabel(form.unit) : t.none}
                      onPress={() => update({ repetitionOn: !form.repetitionOn })}
                      accessibilityLabel={fillTemplate(t.repetitionKindAccessibility, { value: form.repetitionOn ? everyLabel(form.unit) : t.none })}
                      testID="planning-repetition-kind"
                    />
                    {form.repetitionOn ? (
                      <>
                        <View ref={everyRef} collapsable={false}>
                          <Pill
                            label={String(form.every)}
                            onPress={() => openPopover("EVERY", everyRef)}
                            accessibilityLabel={`${form.every} ${unitLabel(form.unit, form.every)}`}
                            testID="planning-every"
                          />
                        </View>
                        <Pill
                          label={unitLabel(form.unit, form.every)}
                          onPress={() => setForm((current) => (current === null ? current : withUnit(current, current.unit === "WEEK" ? "DAY" : "WEEK")))}
                          accessibilityLabel={fillTemplate(t.unitAccessibility, { value: unitLabel(form.unit, form.every) })}
                          testID="planning-unit"
                        />
                      </>
                    ) : null}
                  </View>
                  {form.repetitionOn ? (
                    <View style={styles.wrapLine}>
                      {/* Recette du 19/11/2026 (d4) : « jusqu'au » ↔ « pendant » (D-331), pour les semaines et, depuis la recette
                          du 19/11/2026 au soir, pour les jours. */}
                      <Pill
                        label={form.endKind === "UNTIL" ? t.until : t.during}
                        onPress={() => setForm((current) => (current === null ? current : withEndKind(current)))}
                        accessibilityLabel={fillTemplate(t.endKindAccessibility, { value: form.endKind === "UNTIL" ? t.until : t.during })}
                        testID="planning-end-kind"
                      />
                      {form.endKind === "FOR" ? (
                        <>
                          <View ref={endCountRef} collapsable={false}>
                            <Pill
                              label={String(form.endCount)}
                              onPress={() => openPopover("END_COUNT", endCountRef)}
                              accessibilityLabel={fillTemplate(t.endCountAccessibility, { count: String(form.endCount), unit: unitLabel(form.unit, form.endCount) })}
                              testID="planning-end-count"
                            />
                          </View>
                          <Text style={[styles.pillText, styles.untilWord]}>{unitLabel(form.unit, form.endCount)}</Text>
                        </>
                      ) : (
                        <View ref={endDateRef} collapsable={false}>
                          <Pill label={formatShortDate(form.endDate)} onPress={() => openPopover("END", endDateRef)} accessibilityLabel={`${t.endDatePicker}, ${formatShortDate(form.endDate)}`} testID="planning-end-date" />
                        </View>
                      )}
                    </View>
                  ) : null}
                  {/* D-520 : jours de la semaine pour l'unité semaines seulement, de « toutes les » au bord droit. */}
                  {form.repetitionOn && form.unit === "WEEK" ? (
                    <View style={styles.weekdays} testID="planning-weekdays">
                      {WEEKDAYS.map((day: Weekday) => {
                        const selected = form.weekdays.includes(day);
                        return (
                          <Pressable
                            key={day}
                            onPress={() => update({ weekdays: toggleWeekday(form.weekdays, day) })}
                            accessibilityRole="checkbox"
                            accessibilityLabel={planningStrings.weekdayNames[day - 1]}
                            accessibilityState={{ checked: selected }}
                            style={[styles.weekday, selected ? styles.weekdaySelected : null]}
                            testID={`planning-weekday-${day}`}
                          >
                            <Text style={[styles.weekdayLabel, selected ? styles.weekdayLabelSelected : null]}>{planningStrings.weekdayLetters[day - 1]}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Carte 3 (D-519, RM-253 à RM-256) : Séance par créneau. */}
            <View style={styles.card} testID="planning-grid">
              <Text style={styles.label}>{t.slotsTitle}</Text>
              <SlotGrid
                grid={shown.grid}
                names={shown.entries.map((entry) => nameOf(entry.sessionId) ?? "—")}
                onChange={(grid) => {
                  // Les lignes affichées sont celles des séances disponibles : la grille du brouillon suit les mêmes lignes.
                  const points = form.entries.map((entry, row) => {
                    const index = shown.entries.indexOf(entry);
                    return index >= 0 ? grid.points[index]! : form.grid.points[row]!;
                  });
                  update({ grid: { cycle: grid.cycle, points } });
                }}
                onCycle={(cycle) => update({ grid: withCycle(form.grid, cycle) })}
                onChangeSessions={openSelection}
              />
              {shown.grid.cycle > CYCLE_MAX ? (
                <Text style={styles.notice} testID="planning-cycle-too-long">
                  {fillTemplate(t.cycleTooLong, { n: String(shown.grid.cycle) })}
                </Text>
              ) : null}
            </View>

            {/* Carte 4 (D-524) : Rappel sans interrupteur — Sans / 15' / 30' / 1h / Autre, de même largeur. */}
            <View style={[styles.card, styles.reminderCard]} testID="planning-reminder">
              <Text style={styles.label}>{tReminder.title}</Text>
              <View ref={reminderRef} collapsable={false} style={styles.reminderOptions}>
                <SegmentedControl
                  options={[
                    { value: "NONE", label: tReminder.none },
                    ...REMINDER_PRESETS.map((minutes) => ({ value: String(minutes), label: reminderLabel(minutes) })),
                    { value: "OTHER", label: customReminder ? reminderLabel(reminder) : tReminder.other, accessibilityLabel: tReminder.customTitle },
                  ]}
                  value={reminder === null ? "NONE" : customReminder ? "OTHER" : String(reminder)}
                  onChange={(value) => {
                    if (value === "OTHER") openReminderWheel();
                    else chooseReminder(value === "NONE" ? null : Number(value), false);
                  }}
                  labelStyle={styles.reminderOption}
                  testID="planning-reminder-options"
                />
              </View>
            </View>

            {saveFailed ? (
              <Text style={styles.error} accessibilityLiveRegion="polite" testID="planning-save-error">
                {t.saveError}
              </Text>
            ) : null}
          </ScrollView>
        )}
      />

      {/* D-520 : roulettes natives en popover près du champ — fond grisé, ni titre, ni bouton. */}
      <PlanningWheelPopover
        anchor={popover?.kind === "EVERY" ? popover.anchor : null}
        columns={[{ values: everyValues, selected: form.every, onChange: (every) => update({ every }), accessibilityLabel: t.repetition, testID: "planning-every-wheel" }]}
        onDismiss={() => setPopover(null)}
        android={
          <NumberWheelPicker
            value={form.every}
            accessibilityLabel={t.repetition}
            onCancel={() => setPopover(null)}
            onValidate={(every) => {
              setPopover(null);
              update({ every: Math.max(multiplierBounds[0]!, Math.min(multiplierBounds[1]!, every)) });
            }}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
          />
        }
        testID="planning-every-popover"
      />
      <PlanningWheelPopover
        anchor={popover?.kind === "END_COUNT" ? popover.anchor : null}
        columns={[
          {
            values: END_COUNTS,
            selected: form.endCount,
            onChange: (count) => setForm((current) => (current === null ? current : withEndCount(current, count))),
            accessibilityLabel: t.during,
            testID: "planning-end-count-wheel",
          },
        ]}
        onDismiss={() => setPopover(null)}
        android={
          <NumberWheelPicker
            value={form.endCount}
            accessibilityLabel={t.during}
            onCancel={() => setPopover(null)}
            onValidate={(count) => {
              setPopover(null);
              setForm((current) => (current === null ? current : withEndCount(current, count)));
            }}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
          />
        }
        testID="planning-end-count-popover"
      />
      <PlanningWheelPopover
        anchor={popover?.kind === "REMINDER" ? popover.anchor : null}
        columns={[
          {
            values: REMINDER_HOURS,
            selected: Math.floor((reminder ?? DEFAULT_REMINDER_MINUTES) / 60),
            onChange: (hours) => setReminderParts(hours, (reminder ?? DEFAULT_REMINDER_MINUTES) % 60),
            unit: tReminder.hours,
            accessibilityLabel: tReminder.hours,
            testID: "planning-reminder-hours",
          },
          {
            values: REMINDER_MINUTES_STEP,
            selected: ((reminder ?? DEFAULT_REMINDER_MINUTES) % 60) - (((reminder ?? DEFAULT_REMINDER_MINUTES) % 60) % 5),
            onChange: (minutes) => setReminderParts(Math.floor((reminder ?? DEFAULT_REMINDER_MINUTES) / 60), minutes),
            format: twoDigits,
            unit: tReminder.minutes,
            accessibilityLabel: tReminder.minutes,
            testID: "planning-reminder-minutes",
          },
        ]}
        onDismiss={() => setPopover(null)}
        android={
          <DurationWheelPicker
            totalSeconds={reminder ?? DEFAULT_REMINDER_MINUTES}
            valueGrid={Array.from({ length: REMINDER_MAX_MINUTES / 5 }, (_, index) => (index + 1) * 5)}
            units={TIME_UNITS}
            minutesAccessibilityLabel={tReminder.hours}
            secondsAccessibilityLabel={tReminder.minutes}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
            onCancel={() => setPopover(null)}
            onValidate={(minutes) => {
              setPopover(null);
              update({ reminderMinutes: minutes });
            }}
          />
        }
        testID="planning-reminder-popover"
      />

      {/* Heure (recette du 19/11/2026, k19) : roulette native heures / minutes en popover, sans titre ni bouton. */}
      <PlanningWheelPopover
        anchor={popover?.kind === "TIME" ? popover.anchor : null}
        columns={[
          {
            values: TIME_HOURS,
            selected: Math.floor(timeToDuration(form.time) / 60),
            onChange: (hours) => update({ time: durationToTime(hours * 60 + (timeToDuration(form.time) % 60)) }),
            format: twoDigits,
            unit: tReminder.hours,
            accessibilityLabel: tReminder.hours,
            testID: "planning-time-hours",
          },
          {
            values: TIME_MINUTES,
            selected: timeToDuration(form.time) % 60,
            onChange: (minutes) => update({ time: durationToTime(Math.floor(timeToDuration(form.time) / 60) * 60 + minutes) }),
            format: twoDigits,
            unit: tReminder.minutes,
            accessibilityLabel: tReminder.minutes,
            testID: "planning-time-minutes",
          },
        ]}
        onDismiss={() => setPopover(null)}
        android={
          <DurationWheelPicker
            totalSeconds={timeToDuration(form.time)}
            maxTotalSeconds={TIME_MAX_MINUTES}
            units={TIME_UNITS}
            minutesAccessibilityLabel={tReminder.hours}
            secondsAccessibilityLabel={tReminder.minutes}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
            onCancel={() => setPopover(null)}
            onValidate={(minutes) => {
              setPopover(null);
              update({ time: durationToTime(minutes) });
            }}
          />
        }
        testID="planning-time-popover"
      />
      {/* Dates (recette du 19/11/2026, k19) : calendrier natif en popover, sans titre ni bouton ; le jour touché s'applique. */}
      <PlanningPopover
        anchor={popover?.kind === "START" || popover?.kind === "END" ? popover.anchor : null}
        width={DATE_PANEL_WIDTH}
        onDismiss={() => setPopover(null)}
        testID="planning-date-popover"
      >
        {popover?.kind === "START" || popover?.kind === "END" ? (
          <DateCalendar
            value={popover.kind === "START" ? form.startDate : form.endDate}
            minimum={popover.kind === "START" ? todayLocal() : form.startDate}
            onChange={(value) => {
              if (popover.kind === "START") changeStartDate(value);
              else setForm((current) => (current === null ? current : withEndDate(current, value)));
            }}
          />
        ) : null}
      </PlanningPopover>
    </ScreenShell>
  );
}

/** Valeur modifiable, en bleu KODJO — dates et heure comprises (recette du 19/11/2026, k8, remplace le noir du 17/11). */
function Pill({
  label,
  onPress,
  accessibilityLabel,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly testID: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={6} style={styles.pill} testID={testID}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Grille créneaux × rotation (D-519, Figma `12650:27854`, `12624:29713`) : en-tête « Changer » (toujours visible) et
 * colonnes #1 à #7 — actives jusqu'à la longueur du cycle ; une ligne par séance avec sa mention calculée ; un point par
 * créneau joué. Toucher un numéro de colonne règle la longueur du cycle (RM-253, RM-260) ; toucher un point le bascule,
 * sauf s'il est le dernier de sa ligne ou de sa colonne (RM-254, RM-262).
 * [Interprétation, 18/11/2026 : « toucher un numéro de colonne ouvre le sélecteur numéroté » — le numéro touché devient
 * la longueur du cycle, comme une case numérotée ; aucune fenêtre supplémentaire. À confirmer sur iPhone.]
 */
function SlotGrid({
  grid,
  names,
  onChange,
  onCycle,
  onChangeSessions,
}: {
  readonly grid: PlanningGrid;
  readonly names: readonly string[];
  readonly onChange: (grid: PlanningGrid) => void;
  readonly onCycle: (cycle: number) => void;
  readonly onChangeSessions: () => void;
}) {
  const columns = Array.from({ length: CYCLE_MAX }, (_, index) => index);
  return (
    <View testID="planning-slot-grid">
      <View style={styles.gridHeader}>
        <Pressable onPress={onChangeSessions} accessibilityRole="button" hitSlop={8} style={styles.gridNames} testID="planning-change">
          <Text style={styles.change}>{t.change}</Text>
        </Pressable>
        {columns.map((column) => {
          const active = column < grid.cycle;
          return (
            <Pressable
              key={column}
              onPress={() => onCycle(column + 1)}
              accessibilityRole="button"
              accessibilityLabel={fillTemplate(t.columnAccessibility, { n: String(column + 1) })}
              accessibilityState={{ selected: column + 1 === grid.cycle }}
              hitSlop={4}
              style={styles.gridColumn}
              testID={`planning-column-${column + 1}`}
            >
              <Text style={[styles.columnLabel, active ? null : styles.columnInactive]}>{fillTemplate(t.column, { n: String(column + 1) })}</Text>
            </Pressable>
          );
        })}
      </View>
      {names.map((name, row) => {
        const line = grid.points[row] ?? [];
        return (
          <View key={`${row}-${name}`} style={[styles.gridRow, row > 0 ? styles.gridSeparator : null]} testID={`planning-row-${row}`}>
            <View style={styles.gridNames}>
              <Text style={styles.rowName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.rowMention} testID={`planning-row-${row}-mention`}>
                {`(${rowMention(line.slice(0, grid.cycle))})`}
              </Text>
            </View>
            {columns.map((column) => {
              const active = column < grid.cycle;
              const played = active && line[column] === true;
              return (
                <Pressable
                  key={column}
                  disabled={!active}
                  onPress={() => onChange(togglePoint(grid, row, column))}
                  accessibilityRole="checkbox"
                  accessibilityLabel={fillTemplate(t.pointAccessibility, { name, n: String(column + 1) })}
                  accessibilityState={{ checked: played, disabled: !active }}
                  hitSlop={4}
                  style={styles.gridColumn}
                  testID={`planning-point-${row}-${column + 1}`}
                >
                  <View style={[styles.point, played ? styles.pointPlayed : null]} />
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Calendrier natif (`DatePicker` graphique) du popover de date : le jour touché s'applique. Apparence claire forcée : le
 * panneau est blanc, et en mode sombre le calendrier écrivait en blanc sur blanc (recette du 19/11/2026, k19 : « on ne
 * voit rien … aucun texte, sauf la date du jour »).
 */
function DateCalendar({ value, minimum, onChange }: { readonly value: LocalDate; readonly minimum: LocalDate; readonly onChange: (value: LocalDate) => void }) {
  if (Platform.OS !== "ios") return null;
  return (
    <View style={styles.calendar} testID="planning-date-panel">
      <Host matchContents colorScheme="light">
        <DatePicker
          selection={timeToDate(value, "12:00")}
          displayedComponents={["date"]}
          range={{ start: timeToDate(minimum, "00:00") }}
          onDateChange={(date) => onChange(formatLocalDate(date))}
          modifiers={CALENDAR_MODIFIERS}
        />
      </Host>
    </View>
  );
}

/** Date courte (« 18 nov. 2026 »), comme l'affichait le sélecteur compact. */
export function formatShortDate(value: LocalDate): string {
  return timeToDate(value, "12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Minutes depuis minuit ↔ heure (« 08:00 »). */
export function durationToTime(minutes: number): LocalTime {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
}

export function timeToDuration(time: LocalTime): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}


const styles = StyleSheet.create({
  contextBand: { paddingHorizontal: layout.screenGutter, gap: spacing[8] },
  name: { ...type.screenTitle, color: colors.textPrimary, padding: 0 },
  nameError: { ...type.supporting, color: colors.danger },
  // D-521 : synthèse en 14 px.
  synthesis: { ...type.body, color: colors.textSecondary },
  scroll: { flex: 1 },
  // D-521 : marges d'écran 16, cartes espacées de 12.
  scrollContent: { paddingHorizontal: layout.screenGutter, paddingBottom: spacing[24], gap: spacing[12] },
  notice: { ...type.label, color: colors.textSecondary },
  // D-521 : fond et trait de la carte du Profil (`GuidanceSettingsForm`, variante écran), rayon 12, marges 12.
  card: { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.background, borderRadius: 12, padding: spacing[12], gap: spacing[12] },
  line: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  wrapLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  // Figma `12650:27854` : libellés 16 regular, valeurs 16 semi-bold.
  label: { ...type.body, fontSize: 16, lineHeight: 20, color: colors.textPrimary },
  pill: { minHeight: 32, paddingHorizontal: spacing[8], borderRadius: 8, backgroundColor: colors.border, justifyContent: "center" },
  pillText: { ...type.segmentedLabel, color: colors.primary },
  untilWord: { paddingHorizontal: spacing[8] },
  repetition: { flexDirection: "row", alignItems: "flex-start", gap: spacing[8] },
  repetitionLabel: { paddingTop: 6 },
  repetitionValues: { flex: 1, gap: spacing[12] },
  weekdays: { flexDirection: "row", justifyContent: "space-between" },
  weekday: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.cardsBorder,
  },
  weekdaySelected: { backgroundColor: colors.selection, borderColor: colors.selection },
  weekdayLabel: { ...type.label, color: colors.textSecondary },
  weekdayLabelSelected: { color: colors.background },
  gridHeader: { flexDirection: "row", alignItems: "center", minHeight: 32 },
  gridNames: { flex: 1, paddingRight: spacing[4] },
  gridColumn: { width: COLUMN_WIDTH, alignItems: "center", justifyContent: "center", minHeight: 32 },
  change: { ...type.listCardTitle, color: colors.primary },
  columnLabel: { ...type.supporting, fontFamily: type.listCardTitle.fontFamily, color: colors.textPrimary },
  columnInactive: { color: colors.textSecondary, opacity: 0.6 },
  gridRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing[4] },
  gridSeparator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardsBorder },
  rowName: { ...type.supporting, fontFamily: type.listCardTitle.fontFamily, color: colors.textPrimary },
  rowMention: { ...type.supporting, fontSize: 10, lineHeight: 13, color: colors.textSecondary },
  point: { width: POINT_SIZE, height: POINT_SIZE, borderRadius: POINT_SIZE / 2, borderWidth: 1.5, borderColor: colors.cardsBorder },
  pointPlayed: { backgroundColor: colors.selection, borderColor: colors.selection },
  reminderCard: { flexDirection: "row", alignItems: "center" },
  reminderOptions: { flex: 1 },
  reminderOption: { ...type.listCardTitle },
  error: { ...type.label, color: colors.danger },
  calendar: { alignItems: "center" },
});
