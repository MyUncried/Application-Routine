import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addDays, formatLocalDate, mondayOf, parseLocalDate, weekdayOf, type LocalDate, type Routine } from "@/domain/planning/Routine";
import type { Occurrence } from "@/domain/planning/occurrences";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { OccurrenceDeleteDialog } from "@/features/planning/OccurrenceDeleteDialog";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { SESSION_CARD_HEADER_HEIGHT, SessionCard } from "@/features/sessions/SessionCard";
import { sessionCardAccessibilityLabel } from "@/features/sessions/SessionCatalogueList";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Calendrier — vue Semaine (CE-UI-03 ; Figma « Prototype MVP » `1992:5101`, déployée `1992:6389`, actions glissées
 * `1992:5962`, suppressions `1992:5365` / `1992:6102`, après suppression `2074:86`).
 *
 * - En-tête : navigation Jour | Semaine | Mois (composant partagé des Catalogues). Jour et Mois sont hors de cette
 *   tranche : présents, indisponibles.
 * - Bande : semaine précédente/suivante, intervalle « 3 – 9 août 2026 », Aujourd'hui, Planifier.
 * - Barre des 7 jours (colonnes égales, points d'occurrence) ; sections journalières chronologiques « N prévue(s) ».
 *   RM-046 : toucher un jour place sa section en tête ; le défilement sélectionne le jour en tête.
 * - Une carte par contenu retenu d'une occurrence, dans l'ordre de la liste de la Routine (RM-043). Zone
 *   principale → modification de la Routine ; chevron → déployer (récurrence et composition) ; Démarrer → Exécution
 *   (contrat PRE-10 `/execution?sessionId=`) ; glissé → Dupliquer / Supprimer (CE-UI-03 §12).
 * - Seules les occurrences futures sont affichées (RM-049) ; une Séance archivée ou supprimée n'est plus proposée.
 */

const t = planningStrings;
const DOT_SIZE = 5;
const MAX_DOTS = 3;

type CardItem = {
  readonly key: string;
  readonly occurrence: Occurrence;
  readonly sessionId: string;
  readonly projection: SessionCatalogueProjection;
  readonly routine: Routine | undefined;
};

type DeleteCandidate = { readonly routine: Routine; readonly occurrenceKey: string };

function todayLocal(): LocalDate {
  return formatLocalDate(new Date());
}

export function formatWeekRange(monday: LocalDate): string {
  const start = parseLocalDate(monday);
  const end = parseLocalDate(addDays(monday, 6));
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  const left = sameMonth ? `${start.getDate()}` : `${start.getDate()} ${t.months[start.getMonth()]}${sameYear ? "" : ` ${start.getFullYear()}`}`;
  return `${left} – ${end.getDate()} ${t.months[end.getMonth()]} ${end.getFullYear()}`;
}

export function formatDayTitle(day: LocalDate): string {
  const date = parseLocalDate(day);
  return `${t.weekdayNames[weekdayOf(day) - 1]} ${date.getDate()} ${t.months[date.getMonth()]}`;
}

export function plannedCountLabel(count: number): string {
  return fillTemplate(count === 1 ? t.calendar.planned.one : t.calendar.planned.other, { count: String(count) });
}

/**
 * En-tête du Calendrier (Figma `1992:5101`, nœuds `10945:19777` à `10945:19781`) : « Jour | Semaine | Mois », vue
 * active en bleu KODJO Semi Bold. Jour et Mois sont hors de cette tranche : affichés, indisponibles.
 */
function CalendarViewTabs() {
  const views = [
    { key: "day", label: t.calendar.views.day, active: false },
    { key: "week", label: t.calendar.views.week, active: true },
    { key: "month", label: t.calendar.views.month, active: false },
  ] as const;
  return (
    <View style={styles.viewTabs} accessibilityRole="tablist" testID="calendar-view-row">
      {views.map((view, index) => (
        <View key={view.key} style={styles.viewTabSlot}>
          {index > 0 ? <View style={styles.viewSeparator} /> : null}
          <Pressable
            disabled={!view.active}
            accessibilityRole="tab"
            accessibilityState={{ selected: view.active, disabled: !view.active }}
            accessibilityLabel={view.active ? view.label : fillTemplate(t.calendar.viewUnavailable, { view: view.label })}
            style={styles.viewTab}
            testID={`calendar-view-row-${view.key}`}
          >
            <Text style={[styles.viewLabel, view.active ? styles.viewLabelActive : null]}>{view.label}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function CalendarWeekScreen({ initialDay }: { readonly initialDay?: LocalDate } = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const planning = usePlanningService();
  const { state: catalogue, reload: reloadCatalogue, cancelPending } = useSessionCatalogue();
  const [monday, setMonday] = useState<LocalDate>(() => mondayOf(initialDay ?? todayLocal()));
  const [selectedDay, setSelectedDay] = useState<LocalDate>(() => initialDay ?? todayLocal());
  const [routines, setRoutines] = useState<readonly Routine[]>([]);
  const [occurrences, setOccurrences] = useState<readonly Occurrence[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [revealed, setRevealed] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DeleteCandidate | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef(new Map<LocalDate, number>());
  const programmaticScroll = useRef(false);
  const requestId = useRef(0);
  // Recette du 17/11/2026 (f3) : la dernière section doit pouvoir monter en tête ; la réserve basse suit sa hauteur.
  const [listHeight, setListHeight] = useState(0);
  const [lastSectionHeight, setLastSectionHeight] = useState(0);

  const projections = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);

  // Une Séance archivée ou supprimée n'est plus proposée (RM-206, même règle que pour un Exercice).
  const isPlannable = useCallback((sessionId: string) => projections.get(sessionId)?.status === "ACTIVE", [projections]);

  const load = useCallback(
    (week: LocalDate) => {
      const id = ++requestId.current;
      Promise.all([planning.listRoutines(), planning.weekOccurrences(week, () => true)]).then(
        ([list, weekItems]) => {
          if (id !== requestId.current) return;
          setRoutines(list);
          setOccurrences(weekItems);
          setLoadFailed(false);
        },
        (error: unknown) => {
          if (id !== requestId.current) return;
          console.error("Le calendrier n'a pas pu être chargé.", error);
          setLoadFailed(true);
        },
      );
    },
    [planning],
  );

  useFocusEffect(
    useCallback(() => {
      reloadCatalogue();
      load(monday);
      return () => {
        cancelPending();
        setRevealed(null);
      };
    }, [reloadCatalogue, cancelPending, load, monday]),
  );

  const routinesById = useMemo(() => new Map(routines.map((routine) => [routine.id, routine])), [routines]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(monday, index)), [monday]);

  const itemsByDay = useMemo(() => {
    const map = new Map<LocalDate, CardItem[]>();
    for (const occurrence of occurrences) {
      for (const content of occurrence.contents) {
        if (!isPlannable(content.sessionId)) continue;
        const projection = projections.get(content.sessionId);
        if (projection === undefined) continue;
        const list = map.get(occurrence.date) ?? [];
        list.push({
          key: `${occurrence.routineId}|${occurrence.key}|${content.entryId}`,
          occurrence,
          sessionId: content.sessionId,
          projection,
          routine: routinesById.get(occurrence.routineId),
        });
        map.set(occurrence.date, list);
      }
    }
    return map;
  }, [occurrences, isPlannable, projections, routinesById]);

  const changeWeek = (next: LocalDate, day: LocalDate) => {
    setMonday(next);
    setSelectedDay(day);
    setExpanded(new Set());
    setRevealed(null);
    sectionOffsets.current.clear();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    load(next);
  };

  const selectDay = (day: LocalDate) => {
    setSelectedDay(day);
    // RM-046 : la section du jour (ou la suivante s'il est vide) passe en tête de liste.
    const target = days.filter((candidate) => candidate >= day).find((candidate) => sectionOffsets.current.has(candidate));
    const y = target === undefined ? undefined : sectionOffsets.current.get(target);
    if (y !== undefined) {
      programmaticScroll.current = true;
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (programmaticScroll.current) return;
    const y = event.nativeEvent.contentOffset.y + spacing[8];
    let top: LocalDate | null = null;
    for (const day of days) {
      const offset = sectionOffsets.current.get(day);
      if (offset !== undefined && offset <= y) top = day;
    }
    if (top !== null && top !== selectedDay) setSelectedDay(top);
  };

  const openRoutine = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { routineId } });
  };

  const duplicate = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { duplicateOf: routineId } });
  };

  const runAction = (action: () => Promise<unknown>) => {
    setDeleteCandidate(null);
    setActionFailed(false);
    action().then(
      () => load(monday),
      (error: unknown) => {
        console.error("L'action de planification a échoué.", error);
        setActionFailed(true);
        load(monday);
      },
    );
  };

  const dotColor = (projection: SessionCatalogueProjection) => projection.categories[0]?.color ?? colors.selection;

  const bottomReserve = navigationBarTotalHeight() + insets.bottom + spacing[24];
  const anyItem = days.some((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
  const lastDay = [...days].reverse().find((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
  const listPaddingBottom = Math.max(bottomReserve, listHeight - lastSectionHeight);

  return (
    <ScreenShell>
      <FixedHeader
        title={t.calendar.title}
        content={<CalendarViewTabs />}
      />
      <ContextBand fadeToTransparent>
        <View style={styles.weekNavigation}>
          <Pressable
            onPress={() => changeWeek(addDays(monday, -7), addDays(monday, -7))}
            accessibilityRole="button"
            accessibilityLabel={t.calendar.previousWeek}
            hitSlop={12}
            testID="calendar-previous-week"
          >
            <Image source={require("../../../assets/icons/icon-precedent.svg")} style={styles.weekChevron} accessible={false} />
          </Pressable>
          <Text style={styles.weekLabel} accessibilityRole="header" testID="calendar-week-label">
            {formatWeekRange(monday)}
          </Text>
          <Pressable
            onPress={() => changeWeek(addDays(monday, 7), addDays(monday, 7))}
            accessibilityRole="button"
            accessibilityLabel={t.calendar.nextWeek}
            hitSlop={12}
            testID="calendar-next-week"
          >
            <Image source={require("../../../assets/icons/icon-suivant.svg")} style={styles.weekChevron} accessible={false} />
          </Pressable>
        </View>
        <View style={styles.weekActions}>
          <Pressable
            onPress={() => {
              const today = todayLocal();
              changeWeek(mondayOf(today), today);
            }}
            accessibilityRole="button"
            accessibilityLabel={t.calendar.today}
            style={styles.todayPill}
            testID="calendar-today"
          >
            <Text style={styles.todayLabel}>{t.calendar.today}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: "/planning", params: { date: selectedDay < todayLocal() ? todayLocal() : selectedDay } })}
            accessibilityRole="button"
            accessibilityLabel={t.calendar.plan}
            style={styles.planButton}
            testID="calendar-plan"
          >
            <Image source={require("../../../assets/icons/icon-planifier.svg")} style={styles.planIcon} accessible={false} />
          </Pressable>
        </View>
      </ContextBand>

      <View style={styles.dayBar} accessibilityRole="tablist" testID="calendar-day-bar">
        {days.map((day, index) => {
          const items = itemsByDay.get(day) ?? [];
          const selected = day === selectedDay;
          return (
            <Pressable
              key={day}
              onPress={() => selectDay(day)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                items.length > 0
                  ? fillTemplate(t.calendar.dayAccessibility, { day: formatDayTitle(day), count: plannedCountLabel(items.length) })
                  : fillTemplate(t.calendar.dayEmptyAccessibility, { day: formatDayTitle(day) })
              }
              style={[styles.dayCell, selected ? styles.dayCellSelected : null]}
              testID={`calendar-day-${day}`}
            >
              <Text style={[styles.dayShort, selected ? styles.dayTextSelected : null]}>{t.weekdayShort[index]}</Text>
              <Text style={[styles.dayNumber, selected ? styles.dayTextSelected : null]}>{parseLocalDate(day).getDate()}</Text>
              <View style={styles.dots}>
                {items.slice(0, MAX_DOTS).map((item) => (
                  <View
                    key={item.key}
                    style={[styles.dot, { backgroundColor: selected ? colors.background : dotColor(item.projection) }]}
                    testID={`calendar-day-${day}-dot`}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
        onScroll={onScroll}
        onMomentumScrollEnd={() => {
          programmaticScroll.current = false;
        }}
        onScrollBeginDrag={() => {
          programmaticScroll.current = false;
        }}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        testID="calendar-week-list"
      >
        {loadFailed ? (
          <Text style={styles.message} testID="calendar-load-error">
            {t.calendar.loadError}
          </Text>
        ) : null}
        {actionFailed ? (
          <Text style={styles.error} accessibilityLiveRegion="polite" testID="calendar-action-error">
            {t.calendar.actionError}
          </Text>
        ) : null}
        {!loadFailed && !anyItem ? (
          <Text style={styles.message} testID="calendar-week-empty">
            {t.calendar.emptyWeek}
          </Text>
        ) : null}
        {days.map((day) => {
          const items = itemsByDay.get(day) ?? [];
          if (items.length === 0) return null;
          return (
            <View
              key={day}
              onLayout={(event) => {
                sectionOffsets.current.set(day, event.nativeEvent.layout.y);
                if (day === lastDay) setLastSectionHeight(event.nativeEvent.layout.height);
              }}
              testID={`calendar-section-${day}`}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {formatDayTitle(day)}
                </Text>
                <Text style={styles.sectionCount} testID={`calendar-section-${day}-count`}>
                  {plannedCountLabel(items.length)}
                </Text>
              </View>
              {items.map((item) => {
                const isExpanded = expanded.has(item.key);
                const routine = item.routine;
                const toggle = () =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(item.key)) next.delete(item.key);
                    else next.add(item.key);
                    return next;
                  });
                const actions: readonly SwipeAction[] = [
                  { key: "duplicate", label: t.calendar.duplicate, backgroundColor: colors.movementLevelAction, onPress: () => duplicate(item.occurrence.routineId) },
                  {
                    key: "delete",
                    label: t.calendar.delete,
                    backgroundColor: colors.danger,
                    onPress: () => {
                      setRevealed(null);
                      if (routine !== undefined) setDeleteCandidate({ routine, occurrenceKey: item.occurrence.key });
                    },
                  },
                ];
                return (
                  <View key={item.key} style={styles.item} testID={`calendar-item-${item.key}`}>
                    <SwipeActionsRow
                      actions={actions}
                      revealed={revealed === item.key}
                      onReveal={() => setRevealed(item.key)}
                      onHide={() => setRevealed((current) => (current === item.key ? null : current))}
                      onPress={() => openRoutine(item.occurrence.routineId)}
                      accessibilityLabel={`${sessionCardAccessibilityLabel(item.projection, isExpanded)}, ${fillTemplate(t.calendar.timeAccessibility, { time: item.occurrence.time })}`}
                      accessibilityHint={t.calendar.openRoutine}
                      accessibilityState={{ expanded: isExpanded }}
                      extraAccessibilityActions={[{ name: "toggle", label: isExpanded ? planningStrings.form.collapse : planningStrings.form.expand, onAction: toggle }]}
                      actionsHeight={SESSION_CARD_HEADER_HEIGHT}
                      testID={`calendar-item-${item.key}-swipe`}
                    >
                      <SessionCard
                        projection={item.projection}
                        expanded={isExpanded}
                        onToggleExpanded={toggle}
                        onOpen={() => openRoutine(item.occurrence.routineId)}
                        onStart={() => router.push({ pathname: "/execution", params: { sessionId: item.sessionId } })}
                        timeLabel={item.occurrence.time}
                      >
                        {routine !== undefined && routine.repetition !== null ? (
                          <View style={styles.recurrenceRow}>
                            <Image source={require("../../../assets/icons/icon-planifier.svg")} style={styles.recurrenceIcon} accessible={false} />
                            <Text style={styles.recurrence} testID={`calendar-item-${item.key}-recurrence`}>
                              {formatRecurrence(routine)}
                            </Text>
                          </View>
                        ) : null}
                        <SessionCompositionTree tree={item.projection.tree} testID={`calendar-item-${item.key}-composition`} />
                      </SessionCard>
                    </SwipeActionsRow>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {deleteCandidate !== null && deleteCandidate.routine.repetition === null ? (
        <DecisionDialog
          title={t.deleteSingle.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.deleteSingle.message}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.deleteSingle.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.deleteSingle.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => {
            const routineId = deleteCandidate.routine.id;
            runAction(() => planning.deleteRoutine(routineId));
          }}
          testIDPrefix="planning-delete-single"
        />
      ) : null}
      {deleteCandidate !== null && deleteCandidate.routine.repetition !== null ? (
        <OccurrenceDeleteDialog
          onThisOne={() => {
            const { routine, occurrenceKey } = deleteCandidate;
            runAction(() => planning.excludeOccurrence(routine.id, occurrenceKey));
          }}
          onAllUpcoming={() => {
            const routineId = deleteCandidate.routine.id;
            runAction(() => planning.deleteRoutine(routineId));
          }}
          onCancel={() => setDeleteCandidate(null)}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  viewTabs: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  viewTabSlot: { flexDirection: "row", alignItems: "center" },
  viewSeparator: { width: 1.5, height: 12, backgroundColor: colors.textPrimary },
  viewTab: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing[14] },
  viewLabel: { ...type.sectionTitle, fontFamily: "Inter_400Regular", fontWeight: "400", color: colors.textPrimary },
  viewLabelActive: { fontFamily: "Inter_600SemiBold", fontWeight: "600", color: colors.primary },
  weekNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenGutter,
  },
  weekChevron: { width: 24, height: 24 },
  weekLabel: { ...type.sectionTitle, color: colors.textPrimary, textAlign: "center", flexShrink: 1 },
  weekActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing[12],
    paddingHorizontal: layout.screenGutter,
    marginTop: spacing[16],
  },
  todayPill: {
    minHeight: 32,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardsBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  todayLabel: { ...type.label, color: colors.textPrimary },
  planButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  planIcon: { width: 18, height: 18 },
  dayBar: {
    flexDirection: "row",
    gap: spacing[4],
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
  },
  dayCell: {
    flex: 1,
    flexBasis: 0,
    minHeight: 64,
    minWidth: 0,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingTop: 10,
  },
  dayCellSelected: { backgroundColor: colors.selection },
  dayShort: { ...type.supporting, color: colors.textSecondary },
  dayNumber: { ...type.sectionTitle, color: colors.textPrimary, marginTop: 4 },
  dayTextSelected: { color: colors.background },
  dots: { flexDirection: "row", gap: 2, marginTop: 4, minHeight: DOT_SIZE, marginBottom: 6 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: layout.screenGutter },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
    marginTop: spacing[12],
    marginBottom: spacing[8],
  },
  sectionTitle: { ...type.sectionTitle, color: colors.textPrimary },
  sectionCount: { ...type.supporting, color: colors.textSecondary },
  item: { paddingBottom: spacing[12] },
  recurrenceRow: { flexDirection: "row", alignItems: "center", gap: spacing[8], paddingHorizontal: spacing[12], paddingTop: spacing[8] },
  recurrenceIcon: { width: 12, height: 12 },
  recurrence: { ...type.supporting, color: colors.textSecondary },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8] },
});
