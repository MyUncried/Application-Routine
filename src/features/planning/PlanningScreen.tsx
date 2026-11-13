import { DatePicker, Host } from "@expo/ui/swift-ui";
import { labelsHidden, tint } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  formatLocalDate,
  occurrenceInstant,
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
  DEFAULT_REMINDER_MINUTES,
  draftFromRoutine,
  formTitle,
  frequencyLabel,
  initialDraft,
  moveEntry,
  reminderLabel,
  toggleWeekday,
  toRoutineDraft,
  type FormDraft,
} from "@/features/planning/planningDraft";
import { requestPlanningSheet } from "@/features/planning/planningSheetRelay";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatRoutineSummary } from "@/features/planning/planningSummary";
import { PlanningSelection } from "@/features/planning/PlanningSelection";
import { formatCatalogueSessionDuration, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { InlineStepper, PROFILE_HOLD_POLICY } from "@/shared/ui/ProfileStepper";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, minTouchTarget, spacing, switchOffColors, type } from "@/shared/ui/tokens";

/**
 * Planifier (CE-UI-04 + CE-UI-05 + CE-UI-11 ; Figma « Prototype MVP » : création `1992:6838`, date ouverte `1992:6622`,
 * stepper du nombre de semaines `1992:7537`, sans répétition `1992:7716`, rappel personnalisé ouvert `1992:7187` et
 * sélectionné `1992:7369`, parcours `7594:34531`, fréquence `7594:34653`, sélection `7599:14197` / `7594:34809` ;
 * matrice `MATRICE-PLANIFICATION-2026-10-08`).
 *
 * Parcours : Calendrier → Planifier → « Catalogue des séances » (cases, coche d'en-tête, D-499) → formulaire
 * « Planifier une séance / un parcours » → coche : Enregistrer. Depuis une occurrence : modification ; Dupliquer :
 * brouillon copié (RM-123) ; depuis le Catalogue : Séance préremplie.
 *
 * Formulaire (ordre CE-UI-05) : Début le [date] à [heure] (sélecteurs natifs) ; Répétition (interrupteur, chevron de
 * repli, Jour · Semaine · Mois, « Toutes les », [N] semaines — stepper déroulé au toucher —, [jusqu'au | pendant],
 * [borne], L M M J V S D) ; liste ordonnée sans titre à partir de deux contenus (poignée, nom, fréquence → feuille
 * « Fréquence ») ; Rappel (interrupteur ; 5' 15' 30' 1h Autre ; Autre → « Rappel personnalisé ») ; récapitulatif
 * protégé en bas. Programme : non affiché (trois écrans non conçus, D-332 ; non demandé). Jour et Mois : présents,
 * indisponibles (règles ouvertes, chapitre 05).
 */

const t = planningStrings.form;
const tReminder = planningStrings.reminder;
const ENTRY_ROW_HEIGHT = 48;

type Params = { readonly routineId?: string; readonly duplicateOf?: string; readonly sessionId?: string; readonly date?: string };

type Mode = { readonly kind: "create" } | { readonly kind: "edit"; readonly routineId: string };

type OpenStepper = "every" | "count" | null;

function todayLocal(): LocalDate {
  return formatLocalDate(new Date());
}

function timeToDate(date: LocalDate, time: LocalTime): Date {
  return occurrenceInstant(date, time);
}

function dateToTime(value: Date): LocalTime {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
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
  // CE-UI-03 : « + Planifier » ouvre d'abord la sélection à cases.
  const [selecting, setSelecting] = useState(() => fresh && initialEntries.length === 0);
  const [repetitionCollapsed, setRepetitionCollapsed] = useState(false);
  const [openStepper, setOpenStepper] = useState<OpenStepper>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const savingRef = useRef(false);
  // L'écran se ferme par la navigation ; son identité ne doit pas relancer la lecture du brouillon.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload]);

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

  if (form === null || mode === null) return <ScreenShell>{null}</ScreenShell>;

  // Contenus indisponibles (Séance archivée ou supprimée) : retirés à l'enregistrement, jamais de référence fantôme.
  const availableEntries = catalogue.status === "ready" ? form.entries.filter((entry) => projections.get(entry.sessionId)?.status === "ACTIVE") : form.entries;
  const draft = toRoutineDraft({ ...form, entries: availableEntries });
  const issues = validateRoutineDraft(draft);
  const canSave = issues.length === 0 && !saving && catalogue.status === "ready";
  const update = (patch: Partial<FormDraft>) => setForm((current) => (current === null ? current : { ...current, ...patch }));

  const close = () => router.back();

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
  const toggleReminder = (on: boolean) => {
    if (!on) {
      update({ reminderMinutes: null });
      return;
    }
    setPermissionDenied(false);
    planning.ensureReminderPermission().then(
      (granted) => {
        if (granted) update({ reminderMinutes: DEFAULT_REMINDER_MINUTES });
        else setPermissionDenied(true);
      },
      () => setPermissionDenied(true),
    );
  };

  const openCustomReminder = () => {
    requestPlanningSheet({
      kind: "reminder",
      minutes: form.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
      onValidate: (minutes) => update({ reminderMinutes: minutes }),
    });
    router.push("/planning-reminder");
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

  if (selecting) {
    return (
      <PlanningSelection
        sessions={activeSessions}
        loading={catalogue.status === "loading"}
        failed={catalogue.status === "error"}
        initial={form.entries.map((entry) => entry.sessionId)}
        onCancel={() => {
          // Fermer sans valider conserve la liste antérieure ; sans liste, la planification est abandonnée.
          if (form.entries.length === 0) close();
          else setSelecting(false);
        }}
        onValidate={(selected) => {
          update({ entries: applySelection(form.entries, selected, () => Crypto.randomUUID()) });
          setSelecting(false);
        }}
      />
    );
  }

  const single = availableEntries.length === 1 ? projections.get(availableEntries[0]!.sessionId) : undefined;
  const summary = formatRoutineSummary(draft);
  const removed = form.entries.length - availableEntries.length;
  const reminder = form.reminderMinutes;
  const customReminder = reminder !== null && !(REMINDER_PRESETS as readonly number[]).includes(reminder);
  const weekUnit = (count: number) => (count === 1 ? planningStrings.weekUnit.singular : planningStrings.weekUnit.plural);

  return (
    <ScreenShell>
      {/* Figma `1992:6838` : titre aligné à gauche après la croix ; coche d'enregistrement (D-499). */}
      <FixedHeader
        title={formTitle(availableEntries.length)}
        closeIcon
        centeredTitle={false}
        onBack={close}
        backAccessibilityLabel={t.cancel}
        validate={{ onPress: save, enabled: canSave, accessibilityLabel: t.save }}
      />
      <ContextBand fadeToTransparent>
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
          <Pressable onPress={() => setSelecting(true)} accessibilityRole="button" hitSlop={12} testID="planning-change">
            <Text style={styles.change}>{t.change}</Text>
          </Pressable>
        </View>
      </ContextBand>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: summaryHeight + spacing[24] }]}
        keyboardShouldPersistTaps="handled"
        testID="planning-form"
      >
        {removed > 0 ? (
          <Text style={styles.notice} testID="planning-unavailable">
            {fillTemplate(t.unavailableContent, { count: String(removed) })}
          </Text>
        ) : null}

        {/* Bloc sans titre : Début le [date] à [heure]. */}
        <View style={styles.block} testID="planning-slot">
          <View style={styles.slotRow}>
            <Text style={styles.rowLabel}>{t.start}</Text>
            <Text style={styles.linkWord}>{t.on}</Text>
            <NativeDate
              value={form.startDate}
              minimum={todayLocal()}
              accessibilityLabel={t.datePicker}
              onChange={(startDate) => update({ startDate, endDate: form.endDate < startDate ? startDate : form.endDate })}
              testID="planning-start-date"
            />
            <View style={styles.spacer} />
            <Text style={styles.linkWord}>{t.at}</Text>
            <NativeTime value={form.time} date={form.startDate} onChange={(time) => update({ time })} testID="planning-start-time" />
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
                <NativeDate
                  value={form.endDate}
                  minimum={form.startDate}
                  accessibilityLabel={t.endDatePicker}
                  onChange={(endDate) => update({ endDate })}
                  testID="planning-end-date"
                />
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
                onChange={(endCount) => update({ endCount })}
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
          />
        ) : null}

        {/* Rappel : même forme que Répétition, interrupteur à droite ; options de même largeur (RM-054a). */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{tReminder.title}</Text>
          <Switch
            {...switchOffColors}
            value={reminder !== null}
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
        {reminder !== null ? (
          <View style={styles.block} testID="planning-reminder">
            <SegmentedControl
              options={[
                ...REMINDER_PRESETS.map((minutes) => ({ value: String(minutes), label: reminderLabel(minutes) })),
                { value: "OTHER", label: customReminder ? reminderLabel(reminder) : tReminder.other, accessibilityLabel: tReminder.customTitle },
              ]}
              value={customReminder ? "OTHER" : String(reminder)}
              onChange={(value) => {
                if (value === "OTHER") openCustomReminder();
                else update({ reminderMinutes: Number(value) });
              }}
              testID="planning-reminder-options"
            />
            {/* Toucher « Autre » déjà sélectionné rouvre le réglage personnalisé. */}
            {customReminder ? (
              <Pressable onPress={openCustomReminder} accessibilityRole="button" accessibilityLabel={tReminder.customTitle} style={styles.customHit} testID="planning-reminder-custom" />
            ) : null}
          </View>
        ) : null}

        {saveFailed ? (
          <Text style={styles.error} accessibilityLiveRegion="polite" testID="planning-save-error">
            {t.saveError}
          </Text>
        ) : null}
      </ScrollView>

      {/* Récapitulatif protégé en bas (D-499) : dégradé de 40 au-dessus, fond opaque jusqu'au bas. */}
      <View style={[styles.summaryZone, { paddingBottom: insets.bottom + spacing[12] }]} onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)} pointerEvents="box-none">
        <View style={styles.summaryFade} pointerEvents="none" />
        <View style={styles.summaryBox} accessibilityLiveRegion="polite" testID="planning-summary">
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

function ValuePill({
  label,
  onPress,
  active = false,
  accessibilityLabel,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly active?: boolean;
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
      <Text style={styles.value}>{label}</Text>
    </Pressable>
  );
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
}: {
  readonly entries: readonly RoutineEntry[];
  readonly nameOf: (entry: RoutineEntry) => string;
  readonly onMove: (from: number, to: number) => void;
  readonly onFrequency: (entry: RoutineEntry) => void;
}) {
  const [drag, setDrag] = useState<{ readonly index: number; readonly dy: number } | null>(null);
  const responders = entries.map((_, index) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => setDrag({ index, dy: 0 }),
      onPanResponderMove: (_, gesture) => setDrag({ index, dy: gesture.dy }),
      onPanResponderRelease: (_, gesture) => {
        setDrag(null);
        const to = Math.max(0, Math.min(entries.length - 1, index + Math.round(gesture.dy / ENTRY_ROW_HEIGHT)));
        if (to !== index) onMove(index, to);
      },
      onPanResponderTerminate: () => setDrag(null),
    }),
  );
  return (
    <View style={[styles.block, styles.entriesBlock]} testID="planning-entries">
      {entries.map((entry, index) => {
        const name = nameOf(entry);
        const dragging = drag?.index === index;
        return (
          <View
            key={entry.id}
            style={[styles.entryRow, index > 0 ? styles.entrySeparator : null, dragging ? [styles.entryDragging, { transform: [{ translateY: drag.dy }] }] : null]}
            testID={`planning-entry-${index}`}
          >
            <View
              {...responders[index]!.panHandlers}
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
            <Pressable onPress={() => onFrequency(entry)} accessibilityRole="button" hitSlop={8} style={styles.valuePill} testID={`planning-entry-${index}-frequency`}>
              <Text style={styles.frequency}>{frequencyLabel(entry)}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function NativeDate({
  value,
  minimum,
  onChange,
  accessibilityLabel,
  testID,
}: {
  readonly value: LocalDate;
  readonly minimum?: LocalDate;
  readonly onChange: (value: LocalDate) => void;
  readonly accessibilityLabel: string;
  readonly testID: string;
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID}>
      <Host matchContents>
        <DatePicker
          selection={timeToDate(value, "12:00")}
          displayedComponents={["date"]}
          {...(minimum !== undefined ? { range: { start: timeToDate(minimum, "00:00") } } : {})}
          onDateChange={(date) => onChange(formatLocalDate(date))}
          modifiers={[labelsHidden(), tint(colors.primary)]}
        />
      </Host>
    </View>
  );
}

function NativeTime({ value, date, onChange, testID }: { readonly value: LocalTime; readonly date: LocalDate; readonly onChange: (value: LocalTime) => void; readonly testID: string }) {
  return (
    <View accessibilityLabel={planningStrings.form.timePicker} testID={testID}>
      <Host matchContents>
        <DatePicker
          selection={timeToDate(date, value)}
          displayedComponents={["hourAndMinute"]}
          onDateChange={(next) => onChange(dateToTime(next))}
          modifiers={[labelsHidden(), tint(colors.primary)]}
        />
      </Host>
    </View>
  );
}

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
  scrollContent: { paddingHorizontal: layout.screenGutter, paddingTop: spacing[16], gap: spacing[12] },
  notice: { ...type.supporting, color: colors.textSecondary },
  block: { backgroundColor: colors.surfaceSubtle, borderRadius: 12, padding: spacing[16], gap: spacing[12] },
  entriesBlock: { paddingVertical: spacing[4], gap: 0 },
  slotRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  spacer: { flex: 1 },
  rowLabel: { ...type.label, color: colors.textPrimary },
  linkWord: { ...type.supporting, color: colors.textSecondary },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: minTouchTarget },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[16], minHeight: minTouchTarget },
  sectionTitle: { ...type.sectionTitle, color: colors.textPrimary },
  every: { ...type.supporting, color: colors.textSecondary },
  phraseRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[8] },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing[8] },
  valuePill: { minHeight: 32, paddingHorizontal: spacing[8], borderRadius: 8, backgroundColor: colors.background, justifyContent: "center" },
  value: { ...type.sectionTitle, color: colors.primary },
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
  customHit: { position: "absolute", right: spacing[16], top: spacing[16], width: 64, height: 32 },
  error: { ...type.supporting, color: colors.danger },
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
  summaryText: { ...type.body, color: colors.textPrimary },
});
