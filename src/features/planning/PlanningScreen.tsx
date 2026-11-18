import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
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
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import {
  applySelection,
  draftFromRoutine,
  endDateForWeeks,
  formTitle,
  frequencyLabel,
  initialDraft,
  moveEntry,
  reminderIncomplete,
  reminderLabel,
  toggleWeekday,
  toRoutineDraft,
  weeksUntil,
  type FormDraft,
} from "@/features/planning/planningDraft";
import { requestPlanningSheet } from "@/features/planning/planningSheetRelay";
import { PlanningSelection } from "@/features/planning/PlanningSelection";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatRoutineSummary } from "@/features/planning/planningSummary";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { formatCatalogueSessionDuration, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { ModalHeader } from "@/shared/ui/ModalHeaderActions";
import { InlineStepper, PROFILE_HOLD_POLICY } from "@/shared/ui/ProfileStepper";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import { switchNudge } from "@/shared/ui/switchNudge";
import { colors, layout, minTouchTarget, spacing, switchOffColors, type } from "@/shared/ui/tokens";

/**
 * Planifier (CE-UI-04 + CE-UI-05 + CE-UI-11 ; Figma « Prototype MVP » : création `1992:6838`, date ouverte `1992:6622`,
 * stepper du nombre de semaines `1992:7537`, sans répétition `1992:7716`, rappel personnalisé ouvert `1992:7187` et
 * sélectionné `1992:7369`, parcours `7594:34531`, fréquence `7594:34653`, sélection `7599:14197` / `7594:34809` ;
 * matrice `MATRICE-PLANIFICATION-2026-10-08`).
 *
 * Parcours : Calendrier → Planifier → « Catalogue des séances » (feuille posée sur le formulaire, cases rondes numérotées,
 * coche d'en-tête, D-499) → formulaire
 * « Planifier une séance / un parcours » → coche : Enregistrer. Depuis une occurrence : modification ; Dupliquer :
 * brouillon copié (RM-123) ; depuis le Catalogue : Séance préremplie.
 *
 * Formulaire (ordre CE-UI-05) : Planifié le [date] à [heure] (sélecteurs natifs) ; Répétition (interrupteur, chevron de
 * repli, Jour · Semaine · Mois, « Toutes les », [N] semaines — stepper déroulé au toucher —, [jusqu'au | pendant]
 * convertis l'un en l'autre (RM-047a), [borne], L M M J V S D) ; liste ordonnée sans titre à partir de deux contenus
 * (poignée, nom, fréquence → feuille « Fréquence », fréquence affichée avec la répétition) ; Rappel (interrupteur ;
 * 5' 15' 30' 1h Autre, sans délai présélectionné ; Autre → roues natives d'heure, RM-054c) ; récapitulatif
 * protégé en bas. Programme : non affiché (trois écrans non conçus, D-332 ; non demandé). Jour et Mois : présents,
 * indisponibles (règles ouvertes, chapitre 05).
 */

const t = planningStrings.form;
const tReminder = planningStrings.reminder;
const ENTRY_ROW_HEIGHT = 48;
/**
 * Sélecteurs natifs de date et d'heure. Recette du 17/11/2026 (Hermann : « date et heure : texte en noir ») : texte
 * noir ; la teinte reste celle de l'application dans le calendrier et les roues ouverts (rendu iOS, à vérifier).
 */
/**
 * Recette du 18/11/2026 (k6, k8, k13, Hermann : « La date et l'heure n'ont pas la même taille que "Planifié le" et "à" » ;
 * « Le contraste des modales de sélection de date et d'heure n'est pas bon avec le fond blanc. Mettre un voile grisé en même
 * temps, le temps de la saisie (apparition / disparition en fondu). Centrer horizontalement le calendrier » ; « Appuyer sur
 * Autre doit ouvrir la modale ») : la date et l'heure s'affichent comme les autres valeurs du formulaire ; un appui ouvre le
 * voile standard des roulettes (`WheelPickerOverlay`, fondu) avec, au centre, le calendrier natif (`DatePicker` graphique) ou
 * la roulette native heures / minutes (`DurationWheelPicker`, la même pour l'heure et le rappel « Autre », e2).
 * [Sélecteurs compacts iOS dans la ligne, fenêtre système sans voile — remplacés.]
 */
const CALENDAR_MODIFIERS = [datePickerStyle("graphical"), tint(colors.primary)];
/** Roulette du rappel « Autre » : pas de 5 minutes jusqu'à 24 h (grille de l'ancienne feuille « Rappel personnalisé »). */
const REMINDER_GRID: readonly number[] = Array.from({ length: REMINDER_MAX_MINUTES / 5 }, (_, index) => (index + 1) * 5);
/** Roulette de l'heure : 00:00 à 23:59, à la minute. */
const TIME_MAX_MINUTES = 23 * 60 + 59;
/** Délai présélectionné à l'activation du rappel (k12, 18/11/2026). */
const DEFAULT_REMINDER_MINUTES = 15;
const WHEEL_UNITS = { major: tReminder.hours, minor: tReminder.minutes, majorWidth: 56, minorWidth: 64 } as const;

type Params = { readonly routineId?: string; readonly duplicateOf?: string; readonly sessionId?: string; readonly date?: string };

type Mode = { readonly kind: "create" } | { readonly kind: "edit"; readonly routineId: string };

type OpenStepper = "every" | "count" | null;

function todayLocal(): LocalDate {
  return formatLocalDate(new Date());
}

function timeToDate(date: LocalDate, time: LocalTime): Date {
  return occurrenceInstant(date, time);
}


export function contentHeading(entries: readonly { sessionId: string }[], projections: ReadonlyMap<string, SessionCatalogueProjection>): string {
  const names = entries.map((entry) => projections.get(entry.sessionId)?.name ?? "—");
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return fillTemplate(t.combinedNameTwo, { first: names[0]!, second: names[1]! });
  return fillTemplate(t.combinedName, { first: names[0]!, count: String(names.length - 1) });
}

export function PlanningScreen({ params }: { readonly params: Params }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [repetitionCollapsed, setRepetitionCollapsed] = useState(false);
  const [openStepper, setOpenStepper] = useState<OpenStepper>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // « Autre » touché : roues natives d'heure affichées (e2), même sans délai encore choisi.
  const [customChosen, setCustomChosen] = useState(false);
  const [picker, setPicker] = useState<"START" | "END" | "TIME" | "REMINDER" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const savingRef = useRef(false);
  const [reordering, setReordering] = useState(false);
  // L'écran se ferme par la navigation ; son identité ne doit pas relancer la lecture du brouillon.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload]);

  // « Changer » : « Catalogue des séances » en feuille posée sur ce formulaire déjà présenté (recette du 17/11/2026,
  // f/g). La sélection validée remplace la liste (D-499) ; ✕ conserve la liste antérieure.
  const openSelection = (current: readonly RoutineEntry[]) => {
    requestPlanningSheet({
      kind: "selection",
      initial: current.map((entry) => entry.sessionId),
      onValidate: (selected) =>
        setForm((draft) => (draft === null ? draft : { ...draft, entries: applySelection(draft.entries, selected, () => Crypto.randomUUID()) })),
    });
    router.push("/planning-selection");
  };
  // CE-UI-03 : « + Planifier » ouvre d'abord la sélection à cases, dans cette même feuille. Recette du 18/11/2026
  // (Hermann : « Le catalogue des séances s'ouvre en modale mais avec un bug d'affichage. Et la fenêtre ne peut plus se
  // fermer ») : une seconde feuille poussée pendant la présentation de celle-ci était mal présentée par iOS.
  // [Seconde feuille ouverte dès l'ouverture, ✕ fermant les deux — remplacé.]
  const [selecting, setSelecting] = useState(() => fresh && initialEntries.length === 0);
  const activeSessions = useMemo(
    () => (catalogue.status === "ready" ? catalogue.sessions.filter((projection) => projection.status === "ACTIVE") : []),
    [catalogue],
  );

  // Recette du 17/11/2026 (e3) : notifications retirées dans Réglages → l'interrupteur revient à Non avec le message
  // (RM-053), à l'ouverture d'un rappel déjà enregistré comme au retour dans l'application.
  const reminderOn = form?.reminderOn === true;
  useEffect(() => {
    if (!reminderOn) return undefined;
    let cancelled = false;
    const check = () => {
      planning.reminderPermissionGranted().then(
        (granted) => {
          if (cancelled || granted) return;
          setForm((current) => (current === null ? current : { ...current, reminderOn: false }));
          setPermissionDenied(true);
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

  if (form === null || mode === null) return <ScreenShell>{null}</ScreenShell>;

  // Contenus indisponibles (Séance archivée ou supprimée) : retirés à l'enregistrement, jamais de référence fantôme.
  const availableEntries = catalogue.status === "ready" ? form.entries.filter((entry) => projections.get(entry.sessionId)?.status === "ACTIVE") : form.entries;
  const draft = toRoutineDraft({ ...form, entries: availableEntries });
  const issues = validateRoutineDraft(draft);
  const canSave = issues.length === 0 && !reminderIncomplete(form) && !saving && catalogue.status === "ready";
  const update = (patch: Partial<FormDraft>) => setForm((current) => (current === null ? current : { ...current, ...patch }));

  const close = () => router.back();

  if (selecting) {
    return (
      <PlanningSelection
        sessions={activeSessions}
        loading={catalogue.status === "loading"}
        failed={catalogue.status === "error"}
        initial={[]}
        onCancel={close}
        onValidate={(selected) => {
          update({ entries: applySelection(form.entries, selected, () => Crypto.randomUUID()) });
          setSelecting(false);
        }}
      />
    );
  }

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

  // RM-052 / RM-053 : autorisation demandée à la première activation ; refus → interrupteur sur Non, information.
  // RM-054c, révisée le 18/11/2026 (k12, Hermann : « Remettre 15' par défaut. ») : l'activation présélectionne 15 min.
  // [« l'activation ne présélectionne aucun délai » (17/11/2026) — remplacé.]
  const toggleReminder = (on: boolean) => {
    if (!on) {
      update({ reminderOn: false });
      return;
    }
    setPermissionDenied(false);
    planning.ensureReminderPermission().then(
      (granted) => {
        if (granted) update({ reminderOn: true, ...(form.reminderMinutes === null ? { reminderMinutes: DEFAULT_REMINDER_MINUTES } : {}) });
        else setPermissionDenied(true);
      },
      () => setPermissionDenied(true),
    );
  };

  // d4 : chaque borne de fin garde l'autre à jour (date ↔ nombre de semaines).
  const changeEndDate = (endDate: LocalDate) => update({ endDate, endCount: weeksUntil(form.startDate, endDate) });
  const changeEndCount = (endCount: number) => update({ endCount, endDate: endDateForWeeks(form.startDate, endCount) });
  const changeStartDate = (startDate: LocalDate) => {
    if (form.endKind === "FOR") {
      update({ startDate, endDate: endDateForWeeks(startDate, form.endCount) });
      return;
    }
    const endDate = form.endDate < startDate ? startDate : form.endDate;
    update({ startDate, endDate, endCount: weeksUntil(startDate, endDate) });
  };

  const openFrequency = (entry: RoutineEntry) => {
    requestPlanningSheet({
      kind: "frequency",
      name: projections.get(entry.sessionId)?.name ?? "",
      frequency: entry.frequency,
      onValidate: (frequency) =>
        setForm((current) =>
          current === null ? current : { ...current, entries: current.entries.map((item) => (item.id === entry.id ? { ...item, frequency } : item)) },
        ),
    });
    router.push("/planning-frequency");
  };

  const single = availableEntries.length === 1 ? projections.get(availableEntries[0]!.sessionId) : undefined;
  const summary = formatRoutineSummary(draft);
  const removed = form.entries.length - availableEntries.length;
  const reminder = form.reminderMinutes;
  const customReminder = customChosen || (reminder !== null && !(REMINDER_PRESETS as readonly number[]).includes(reminder));
  const weekUnit = (count: number) => (count === 1 ? planningStrings.weekUnit.singular : planningStrings.weekUnit.plural);

  return (
    <ScreenShell>
      {/* Figma `1992:6838` : titre aligné à gauche après la croix ; coche d'enregistrement (D-499). */}
      {/* Feuille native : haut standard (en-tête, zone de contexte, halos) posé sur la liste (`NativeSheetTop`, recette du 18/11/2026). */}
      <NativeSheetTop
        title={formTitle(availableEntries.length)}
        onClose={close}
        closeAccessibilityLabel={t.cancel}
        validate={{ onPress: save, enabled: canSave, accessibilityLabel: t.save }}
        headerBackground={colors.background}
        band={
          <>
            <View style={styles.contentBand}>
              <View style={styles.contentTexts}>
                <Text style={styles.contentName} numberOfLines={2} testID="planning-content-name">
                  {contentHeading(availableEntries, projections)}
                </Text>
                {single !== undefined ? (
                  <Text style={styles.contentDuration} testID="planning-content-duration">
                    {formatCatalogueSessionDuration(single.duration)}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => openSelection(form.entries)} accessibilityRole="button" hitSlop={12} testID="planning-change">
                <Text style={styles.change}>{t.change}</Text>
              </Pressable>
            </View>
          </>
        }
        renderScroll={(topHeight) => (
          <ScrollView
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingTop: topHeight + spacing[16], paddingBottom: summaryHeight + spacing[24] }]}
            keyboardShouldPersistTaps="handled"
            // Recette du 17/11/2026 (Hermann : « l'écran doit être figé pendant le déplacement d'une carte ») : comme les blocs
            // de la Composition (`ForTimeBlocks`), le défilement est coupé tant qu'une ligne est portée.
            scrollEnabled={!reordering}
            testID="planning-form"
          >
            {removed > 0 ? (
              <Text style={styles.notice} testID="planning-unavailable">
                {fillTemplate(t.unavailableContent, { count: String(removed) })}
              </Text>
            ) : null}

            {/* Bloc sans titre : Planifié le [date] à [heure] (recette du 17/11/2026 ; [« Début le » — remplacé]). */}
            <View style={styles.block} testID="planning-slot">
              <View style={styles.slotRow}>
                <Text style={styles.rowLabel}>{t.start}</Text>
                <Text style={styles.linkWord}>{t.on}</Text>
                <ValuePill plain label={formatShortDate(form.startDate)} onPress={() => setPicker("START")} accessibilityLabel={`${t.datePicker}, ${formatShortDate(form.startDate)}`} testID="planning-start-date" />
                <View style={styles.spacer} />
                <Text style={styles.linkWord}>{t.at}</Text>
                <ValuePill plain label={form.time} onPress={() => setPicker("TIME")} accessibilityLabel={`${t.timePicker}, ${form.time}`} testID="planning-start-time" />
              </View>
            </View>

            {/* Répétition : interrupteur à droite, chevron de repli à côté du titre (chapitre 10). */}
            <View style={styles.sectionRow}>
              <Pressable
                onPress={() => setRepetitionCollapsed((value) => !value)}
                disabled={!form.repetitionOn}
                accessibilityRole="button"
                accessibilityLabel={repetitionCollapsed ? t.expand : t.collapse}
                style={styles.sectionTitleRow}
                testID="planning-repetition-chevron"
              >
                <Text style={styles.sectionTitle}>{t.repetition}</Text>
                <KodjoIcon name={form.repetitionOn && !repetitionCollapsed ? "control-chevron-up" : "control-chevron-down"} />
              </Pressable>
              <Switch
                {...switchOffColors}
                style={switchNudge}
                value={form.repetitionOn}
                onValueChange={(repetitionOn) => {
                  update({ repetitionOn });
                  setRepetitionCollapsed(false);
                }}
                accessibilityLabel={t.repetitionToggle}
                testID="planning-repetition-switch"
              />
            </View>
            {form.repetitionOn && !repetitionCollapsed ? (
              <View style={styles.block} testID="planning-repetition">
                <SegmentedControl
                  options={[
                    { value: "DAY", label: t.units.day, disabled: true, accessibilityLabel: fillTemplate(t.unitUnavailable, { unit: t.units.day }) },
                    { value: "WEEK", label: t.units.week },
                    { value: "MONTH", label: t.units.month, disabled: true, accessibilityLabel: fillTemplate(t.unitUnavailable, { unit: t.units.month }) },
                  ]}
                  value="WEEK"
                  onChange={() => undefined}
                  testID="planning-unit"
                />
                <Text style={styles.every}>{t.every}</Text>
                <View style={styles.phraseRow}>
                  <ValuePill
                    label={String(form.every)}
                    active={openStepper === "every"}
                    onPress={() => setOpenStepper((current) => (current === "every" ? null : "every"))}
                    accessibilityLabel={fillTemplate(t.multiplierAccessibility, { count: String(form.every) })}
                    testID="planning-every"
                  />
                  <Text style={styles.linkWord}>{weekUnit(form.every)}</Text>
                  <ValuePill
                    label={form.endKind === "UNTIL" ? t.until : t.during}
                    onPress={() => {
                      update({ endKind: form.endKind === "UNTIL" ? "FOR" : "UNTIL" });
                      setOpenStepper(null);
                    }}
                    accessibilityLabel={fillTemplate(t.endKindAccessibility, { value: form.endKind === "UNTIL" ? t.until : t.during })}
                    testID="planning-end-kind"
                  />
                  {form.endKind === "UNTIL" ? (
                    <ValuePill plain label={formatShortDate(form.endDate)} onPress={() => setPicker("END")} accessibilityLabel={`${t.endDatePicker}, ${formatShortDate(form.endDate)}`} testID="planning-end-date" />
                  ) : (
                    <View style={styles.inline}>
                      <ValuePill
                        label={String(form.endCount)}
                        active={openStepper === "count"}
                        onPress={() => setOpenStepper((current) => (current === "count" ? null : "count"))}
                        accessibilityLabel={`${form.endCount} ${weekUnit(form.endCount)}`}
                        testID="planning-end-count"
                      />
                      <Text style={styles.linkWord}>{weekUnit(form.endCount)}</Text>
                    </View>
                  )}
                </View>
                {/* Figma `1992:7537` : le stepper se déroule sous la phrase. */}
                {openStepper === "every" ? (
                  <InlineStepper
                    value={form.every}
                    min={WEEK_MULTIPLIER_MIN}
                    max={WEEK_MULTIPLIER_MAX}
                    policy={PROFILE_HOLD_POLICY}
                    formatValue={(value) => String(value ?? "")}
                    onChange={(every) => update({ every })}
                    accessibilityLabel={fillTemplate(t.multiplierAccessibility, { count: String(form.every) })}
                    testID="planning-every-stepper"
                  />
                ) : null}
                {openStepper === "count" && form.endKind === "FOR" ? (
                  <InlineStepper
                    value={form.endCount}
                    min={1}
                    max={520}
                    policy={PROFILE_HOLD_POLICY}
                    formatValue={(value) => String(value ?? "")}
                    onChange={changeEndCount}
                    accessibilityLabel={`${form.endCount} ${weekUnit(form.endCount)}`}
                    testID="planning-end-count-stepper"
                  />
                ) : null}
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
              </View>
            ) : null}

            {/* Liste ordonnée, sans titre, à partir de deux contenus (CE-UI-05 §7) : poignée, nom, fréquence. */}
            {availableEntries.length >= 2 ? (
              <EntryList
                entries={availableEntries}
                nameOf={(entry) => projections.get(entry.sessionId)?.name ?? "—"}
                onMove={(from, to) =>
                  update({ entries: moveEntry(form.entries, form.entries.indexOf(availableEntries[from]!), form.entries.indexOf(availableEntries[to]!)) })
                }
                onFrequency={openFrequency}
                showFrequency={form.repetitionOn}
                onDraggingChange={setReordering}
              />
            ) : null}

            {/* Rappel : même forme que Répétition, interrupteur à droite ; options de même largeur (RM-054a). */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{tReminder.title}</Text>
              <Switch
                {...switchOffColors}
                style={switchNudge}
                value={form.reminderOn}
                onValueChange={toggleReminder}
                accessibilityLabel={tReminder.toggle}
                testID="planning-reminder-switch"
              />
            </View>
            {permissionDenied ? (
              <Text style={styles.notice} accessibilityLiveRegion="polite" testID="planning-reminder-denied">
                {tReminder.permissionDenied}
              </Text>
            ) : null}
            {form.reminderOn ? (
              <View style={styles.block} testID="planning-reminder">
                {/* RM-054c : aucun délai présélectionné ; la coche attend un choix. */}
                <SegmentedControl
                  options={[
                    ...REMINDER_PRESETS.map((minutes) => ({ value: String(minutes), label: reminderLabel(minutes) })),
                    {
                      value: "OTHER",
                      label: customReminder && reminder !== null ? reminderLabel(reminder) : tReminder.other,
                      accessibilityLabel: tReminder.customTitle,
                    },
                  ]}
                  value={customReminder ? "OTHER" : reminder === null ? null : String(reminder)}
                  onChange={(value) => {
                    if (value === "OTHER") {
                      setPicker("REMINDER");
                    } else {
                      setCustomChosen(false);
                      update({ reminderMinutes: Number(value) });
                    }
                  }}
                  labelStyle={styles.reminderOption}
                  testID="planning-reminder-options"
                />
              </View>
            ) : null}

            {saveFailed ? (
              <Text style={styles.error} accessibilityLiveRegion="polite" testID="planning-save-error">
                {t.saveError}
              </Text>
            ) : null}
          </ScrollView>
        )}
      />

      {/* Récapitulatif protégé en bas (D-499) : dégradé de 40 au-dessus, fond opaque jusqu'au bas. */}
      <View style={[styles.summaryZone, { paddingBottom: insets.bottom + spacing[12] }]} onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)} pointerEvents="box-none">
        <View style={styles.summaryFade} pointerEvents="none" />
        <View style={styles.summaryBox} accessibilityLiveRegion="polite" testID="planning-summary">
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>

      <WheelPickerOverlay visible={picker !== null}>
        {picker === "START" || picker === "END" ? (
          <DatePanel
            title={picker === "START" ? t.datePicker : t.endDatePicker}
            value={picker === "START" ? form.startDate : form.endDate}
            minimum={picker === "START" ? todayLocal() : form.startDate}
            onCancel={() => setPicker(null)}
            onValidate={(value) => {
              setPicker(null);
              if (picker === "START") changeStartDate(value);
              else changeEndDate(value);
            }}
          />
        ) : picker === "TIME" ? (
          <DurationWheelPicker
            totalSeconds={timeToDuration(form.time)}
            maxTotalSeconds={TIME_MAX_MINUTES}
            title={t.timePicker}
            units={WHEEL_UNITS}
            minutesAccessibilityLabel={tReminder.hours}
            secondsAccessibilityLabel={tReminder.minutes}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
            onCancel={() => setPicker(null)}
            onValidate={(minutes) => {
              setPicker(null);
              update({ time: durationToTime(minutes) });
            }}
          />
        ) : picker === "REMINDER" ? (
          <DurationWheelPicker
            totalSeconds={reminder ?? DEFAULT_REMINDER_MINUTES}
            valueGrid={REMINDER_GRID}
            title={tReminder.customTitle}
            units={WHEEL_UNITS}
            minutesAccessibilityLabel={tReminder.hours}
            secondsAccessibilityLabel={tReminder.minutes}
            cancelAccessibilityLabel={tReminder.cancel}
            validateAccessibilityLabel={tReminder.validate}
            onCancel={() => setPicker(null)}
            onValidate={(minutes) => {
              setPicker(null);
              setCustomChosen(true);
              update({ reminderMinutes: minutes });
            }}
          />
        ) : null}
      </WheelPickerOverlay>
    </ScreenShell>
  );
}

function ValuePill({
  label,
  onPress,
  active = false,
  plain = false,
  accessibilityLabel,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly active?: boolean;
  /** Date et heure : texte noir (recette du 17/11/2026, « date et heure : texte en noir »). */
  readonly plain?: boolean;
  readonly accessibilityLabel: string;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      hitSlop={6}
      style={styles.valuePill}
      testID={testID}
    >
      <Text style={plain ? styles.valuePlain : styles.value}>{label}</Text>
    </Pressable>
  );
}

/** Déplacement d'une ligne de contenu (geste et décalages), comme `useRowDrag` des blocs de la Composition. */
function useEntryDrag(entries: readonly RoutineEntry[], onMove: (from: number, to: number) => void, onDraggingChange: (dragging: boolean) => void) {
  const [drag, setDrag] = useState<{ readonly index: number; readonly dy: number } | null>(null);
  // Recette du 17/11/2026 (Hermann : « On ne peut plus déplacer les séances, l'appui long fait bouger l'écran, pas la carte ») :
  // même geste que les lignes des blocs de la Composition (`ForTimeBlocks`, `useRowDrag`) — `Pan` natif activé après l'appui
  // long, sur toute la ligne ; la ligne portée suit le doigt, les lignes franchies se décalent. [PanResponder de la poignée,
  // supplanté par le défilement — remplacé.]
  const dragRef = useRef<{ readonly index: number; readonly dy: number } | null>(null);
  const setDragState = (next: { readonly index: number; readonly dy: number } | null) => {
    const was = dragRef.current !== null;
    dragRef.current = next;
    setDrag(next);
    if (was !== (next !== null)) onDraggingChange(next !== null);
  };
  const targetOf = (current: { readonly index: number; readonly dy: number }) =>
    Math.max(0, Math.min(entries.length - 1, current.index + Math.round(current.dy / ENTRY_ROW_HEIGHT)));
  const gesture = (index: number) =>
    Gesture.Pan()
      .enabled(entries.length > 1)
      .activateAfterLongPress(ENTRY_LONG_PRESS_MS)
      .runOnJS(true)
      .onStart(() => setDragState({ index, dy: 0 }))
      .onUpdate((event) => {
        const current = dragRef.current;
        if (current !== null) setDragState({ ...current, dy: event.translationY });
      })
      .onEnd((_event, success) => {
        const current = dragRef.current;
        setDragState(null);
        if (!success || current === null) return;
        const to = targetOf(current);
        if (to !== current.index) onMove(current.index, to);
      })
      .onFinalize(() => {
        if (dragRef.current !== null) setDragState(null);
      })
      .withTestId(`planning-entry-drag-${index}`);
  /** Décalage vertical d'une ligne pendant le geste. */
  const offset = (index: number) => {
    if (drag === null) return 0;
    if (index === drag.index) return drag.dy;
    const to = targetOf(drag);
    if (index > drag.index && index <= to) return -ENTRY_ROW_HEIGHT;
    if (index < drag.index && index >= to) return ENTRY_ROW_HEIGHT;
    return 0;
  };
  return { drag, gesture, offset };
}

/**
 * Lignes de contenus (Figma `7594:34531`) : poignée `icon/poignee` à gauche (glisser pour réordonner), nom, fréquence
 * générique à droite (« à chaque fois », « 2 fois sur 3 ») qui ouvre « Fréquence ». VoiceOver : monter / descendre.
 */
function EntryList({
  entries,
  nameOf,
  onMove,
  onFrequency,
  showFrequency,
  onDraggingChange,
}: {
  readonly entries: readonly RoutineEntry[];
  readonly nameOf: (entry: RoutineEntry) => string;
  readonly onMove: (from: number, to: number) => void;
  readonly onFrequency: (entry: RoutineEntry) => void;
  /** Recette du 17/11/2026 (Hermann : « L'option "à chaque fois" ne doit apparaître que si l'interrupteur de répétition est activé »). */
  readonly showFrequency: boolean;
  /** Une ligne est portée (le formulaire fige son défilement). */
  readonly onDraggingChange: (dragging: boolean) => void;
}) {
  const { drag, gesture, offset } = useEntryDrag(entries, onMove, onDraggingChange);
  return (
    <View style={[styles.block, styles.entriesBlock]} testID="planning-entries">
      {entries.map((entry, index) => {
        const name = nameOf(entry);
        const dragging = drag?.index === index;
        const dy = offset(index);
        return (
          <GestureDetector key={entry.id} gesture={gesture(index)}>
          <View
            style={[styles.entryRow, index > 0 ? styles.entrySeparator : null, dy !== 0 ? { transform: [{ translateY: dy }] } : null, dragging ? styles.entryDragging : null]}
            testID={`planning-entry-${index}`}
          >
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={fillTemplate(t.reorderHandle, { name })}
              accessibilityActions={[
                ...(index > 0 ? [{ name: "moveUp", label: t.moveUp }] : []),
                ...(index < entries.length - 1 ? [{ name: "moveDown", label: t.moveDown }] : []),
              ]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === "moveUp") onMove(index, index - 1);
                if (event.nativeEvent.actionName === "moveDown") onMove(index, index + 1);
              }}
              hitSlop={12}
              style={styles.handle}
              testID={`planning-entry-${index}-handle`}
            >
              <KodjoIcon name="composition-reorder" />
            </View>
            <Text style={styles.entryName} numberOfLines={1}>
              {name}
            </Text>
            {showFrequency ? (
              <Pressable onPress={() => onFrequency(entry)} accessibilityRole="button" hitSlop={8} style={styles.valuePill} testID={`planning-entry-${index}-frequency`}>
                <Text style={styles.frequency}>{frequencyLabel(entry)}</Text>
              </Pressable>
            ) : null}
          </View>
          </GestureDetector>
        );
      })}
    </View>
  );
}

/** Calendrier natif (`DatePicker` graphique) dans le voile standard : en-tête ✕ / titre / coche, brouillon validé par la coche. */
function DatePanel({
  title,
  value,
  minimum,
  onCancel,
  onValidate,
}: {
  readonly title: string;
  readonly value: LocalDate;
  readonly minimum: LocalDate;
  readonly onCancel: () => void;
  readonly onValidate: (value: LocalDate) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <View style={styles.datePanel} testID="planning-date-panel">
      <ModalHeader
        title={title}
        onCancel={onCancel}
        cancelLabel={tReminder.cancel}
        onValidate={() => onValidate(draft)}
        validateEnabled
        validateLabel={tReminder.validate}
        testIDPrefix="planning-date-panel"
      />
      <View style={styles.calendar}>
        <Host matchContents>
          <DatePicker
            selection={timeToDate(draft, "12:00")}
            displayedComponents={["date"]}
            range={{ start: timeToDate(minimum, "00:00") }}
            onDateChange={(date) => setDraft(formatLocalDate(date))}
            modifiers={CALENDAR_MODIFIERS}
          />
        </Host>
      </View>
    </View>
  );
}

/** Date courte de la ligne (« 18 nov. 2026 »), comme l'affichait le sélecteur compact. */
export function formatShortDate(value: LocalDate): string {
  return timeToDate(value, "12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Délai de rappel (minutes) ↔ valeur des roues d'heure (« 01:20 » = 1 h 20). */
export function durationToTime(minutes: number): LocalTime {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
}

export function timeToDuration(time: LocalTime): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Appui long avant le déplacement d'une ligne (même délai que les lignes des blocs de la Composition). */
const ENTRY_LONG_PRESS_MS = 500;

const styles = StyleSheet.create({
  contentBand: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenGutter,
    gap: spacing[12],
  },
  contentTexts: { flex: 1, gap: spacing[4] },
  contentName: { ...type.screenTitle, color: colors.textPrimary },
  contentDuration: { ...type.supporting, color: colors.textSecondary },
  change: { ...type.label, color: colors.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.screenGutter, gap: spacing[12] },
  // Recette du 17/11/2026 (Hermann : « Tous les textes, hors titre de section, doivent avoir la même police et taille de
  // police, celle de "Début" ») : `type.label` pour tout le formulaire. [supporting / body / sectionTitle — remplacés.]
  notice: { ...type.label, color: colors.textSecondary },
  block: { backgroundColor: colors.surfaceSubtle, borderRadius: 12, padding: spacing[16], gap: spacing[12] },
  entriesBlock: { paddingVertical: spacing[4], gap: 0 },
  slotRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  spacer: { flex: 1 },
  rowLabel: { ...type.label, color: colors.textPrimary },
  linkWord: { ...type.label, color: colors.textSecondary },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: minTouchTarget },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[16], minHeight: minTouchTarget },
  sectionTitle: { ...type.sectionTitle, color: colors.textPrimary },
  every: { ...type.label, color: colors.textSecondary },
  phraseRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing[8] },
  valuePill: { minHeight: 32, paddingHorizontal: spacing[8], borderRadius: 8, backgroundColor: colors.background, justifyContent: "center" },
  value: { ...type.label, color: colors.primary },
  valuePlain: { ...type.label, color: colors.textPrimary },
  // Recette du 18/11/2026 (k13, Hermann : « la taille de toutes les valeurs de rappel doit être celle du texte "Progression" »,
  // titre de la carte de Séance) : typographie `listCardTitle` (Semi Bold 15). [`segmentedLabel` Semi Bold 16 — remplacé.]
  reminderOption: { ...type.listCardTitle },
  datePanel: {
    alignSelf: "stretch",
    marginHorizontal: layout.screenGutter,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing[8],
  },
  calendar: { alignItems: "center", paddingHorizontal: spacing[8] },
  weekdays: { flexDirection: "row", justifyContent: "space-between" },
  weekday: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardsBorder,
  },
  weekdaySelected: { backgroundColor: colors.selection, borderColor: colors.selection },
  weekdayLabel: { ...type.label, color: colors.textPrimary },
  weekdayLabelSelected: { color: colors.background },
  entryRow: { flexDirection: "row", alignItems: "center", gap: spacing[12], minHeight: ENTRY_ROW_HEIGHT, backgroundColor: colors.surfaceSubtle },
  entrySeparator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardsBorder },
  entryDragging: { zIndex: 1, opacity: 0.9 },
  handle: { width: 24, alignItems: "center", justifyContent: "center", minHeight: ENTRY_ROW_HEIGHT },
  entryName: { ...type.label, color: colors.textPrimary, flex: 1 },
  frequency: { ...type.label, color: colors.primary },
  error: { ...type.label, color: colors.danger },
  summaryZone: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: layout.screenGutter, backgroundColor: colors.background },
  summaryFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -40,
    height: 40,
    experimental_backgroundImage: `linear-gradient(to bottom, ${colors.background}00 0%, ${colors.background} 100%)`,
  },
  summaryBox: { borderWidth: 1, borderColor: colors.selection, borderRadius: 12, padding: spacing[12], marginTop: spacing[8] },
  summaryText: { ...type.label, color: colors.textPrimary },
});
