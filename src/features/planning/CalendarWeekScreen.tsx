import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addDays, formatLocalDate, mondayOf, occurrenceInstant, parseLocalDate, weekdayOf, type LocalDate, type Routine } from "@/domain/planning/Routine";
import { groupOccurrenceExecutions, occurrenceExecutionKey, occurrenceExecutionStatus, type OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { OccurrenceDeleteDialog } from "@/features/planning/OccurrenceDeleteDialog";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { firstDayOfShiftedMonth, formatAgendaMonth, formatAgendaTime, formatAgendaWeek, sessionsDurationLabel, zonesLine } from "@/features/planning/agendaFormat";
import { AGENDA_ROW_HEIGHT, RoutineAgendaCard, type AgendaStatus } from "@/features/planning/RoutineAgendaCard";
import { executionParams } from "@/features/execution/executionChain";
import { useBodyZonesReferential } from "@/features/activities/useBodyZonesReferential";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { CALENDAR_PALETTE, calendarTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CommandCircle } from "@/shared/ui/CatalogueCommands";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Calendrier — vue Agenda (ancienne vue Semaine, CE-UI-03 ; D-532 à D-534, CE-UI-15, DSF Agenda — Planning du
 * 19/11/2026 ; Figma « Agenda — Planning (proposition) » `12580:27335`).
 *
 * [Remplacé le 19/11/2026 (D-533, D-534) : la bande à deux lignes (intervalle « 3 – 9 août 2026 », Aujourd'hui en
 * pilule), les sections « N prévue(s) » et une carte de séance par contenu retenu. Désormais : zone de contexte à trois
 * lignes (mois en doubles flèches, semaine « du 16 au 22 » en flèches simples, « Aujourd'hui » en texte et Planifier) ;
 * rangée de sept cartes 46 × 64 ; liste regroupée par jour (trait fin entre deux jours) ; une carte par occurrence de
 * routine (`RoutineAgendaCard`), séances dans le déployé ; Dupliquer / Supprimer glissés pour la routine. Le reste
 * ci-dessous décrit le comportement conservé.]
 *
 * - En-tête : navigation Jour | Semaine | Mois (composant partagé des Catalogues). Jour et Mois sont hors de cette
 *   tranche : présents, indisponibles.
 * - Bande : semaine précédente/suivante, intervalle « 3 – 9 août 2026 », Aujourd'hui, Planifier.
 * - Barre des 7 jours (colonnes égales, points d'occurrence) ; sections journalières chronologiques « N prévue(s) ».
 *   RM-046 : toucher un jour place sa section en tête ; le défilement sélectionne le jour en tête.
 * - Une carte par contenu retenu d'une occurrence, dans l'ordre de la liste de la Routine (RM-043). Zone
 *   principale → modification de la Routine ; chevron → déployer (récurrence et composition) ; Démarrer → Exécution
 *   (contrat PRE-10 `/execution?sessionId=`) ; glissé → Dupliquer / Supprimer (CE-UI-03 §12).
 * - Occurrences passées présentées et rejouables (D-525, remplace RM-049) ; une Séance archivée ou supprimée n'est
 *   plus proposée.
 */

const t = planningStrings;
const DOT_SIZE = 5;
const MAX_DOTS = 3;
/** DSF Agenda § 6 : actions glissées de 90 × 52. */
const AGENDA_ACTION_WIDTH = 90;

/** D-534 : une carte par occurrence de routine ; ses séances (contenus retenus, dans l'ordre de la liste) au déployé. */
type CardItem = {
  readonly key: string;
  readonly occurrence: Occurrence;
  readonly projections: readonly SessionCatalogueProjection[];
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

/** Doubles flèches du mois (Figma « icon/mois précédent / suivant », 30 × 24 : deux flèches décalées de 7). */
function DoubleChevron({ source }: { readonly source: number }) {
  return (
    <View style={styles.doubleChevron}>
      <Image source={source} style={[styles.chevron, styles.chevronFirst]} accessible={false} />
      <Image source={source} style={[styles.chevron, styles.chevronSecond]} accessible={false} />
    </View>
  );
}

export function CalendarWeekScreen({
  initialDay,
  onChangeView = () => undefined,
}: {
  readonly initialDay?: LocalDate;
  /** D-535 : onglet Journal de la barre de titre. */
  readonly onChangeView?: (view: CalendarView) => void;
} = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const planning = usePlanningService();
  const { state: catalogue, reload: reloadCatalogue, cancelPending } = useSessionCatalogue();
  const [monday, setMonday] = useState<LocalDate>(() => mondayOf(initialDay ?? todayLocal()));
  const [selectedDay, setSelectedDay] = useState<LocalDate>(() => initialDay ?? todayLocal());
  const [routines, setRoutines] = useState<readonly Routine[]>([]);
  const [occurrences, setOccurrences] = useState<readonly Occurrence[]>([]);
  const [executions, setExecutions] = useState<readonly OccurrenceExecution[]>([]);
  // Instant du dernier chargement : sépare les occurrences passées (rouge) des occurrences à venir (bleu).
  const [loadedAt, setLoadedAt] = useState(0);
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
      Promise.all([planning.listRoutines(), planning.weekOccurrences(week, () => true), planning.listOccurrenceExecutions()]).then(
        ([list, weekItems, linked]) => {
          if (id !== requestId.current) return;
          setRoutines(list);
          setOccurrences(weekItems);
          setExecutions(linked);
          setLoadedAt(Date.now());
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
  const executionsByOccurrence = useMemo(() => groupOccurrenceExecutions(executions), [executions]);

  /**
   * Recette du 19/11/2026 au soir (constat D, s19-passees, s19-arret) : statut d'exécution de l'occurrence, sinon passée
   * (rouge) ou à venir (bleu) selon son heure.
   */
  const statusOf = (item: CardItem): AgendaStatus => {
    const linked = executionsByOccurrence.get(occurrenceExecutionKey(item.occurrence.routineId, item.occurrence.key)) ?? [];
    const status = occurrenceExecutionStatus(item.projections.length, linked);
    if (status !== "NONE") return status;
    return occurrenceInstant(item.occurrence.date, item.occurrence.time).getTime() < loadedAt ? "MISSED" : "UPCOMING";
  };

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(monday, index)), [monday]);

  const itemsByDay = useMemo(() => {
    const map = new Map<LocalDate, CardItem[]>();
    for (const occurrence of occurrences) {
      const shown = occurrence.contents
        .filter((content) => isPlannable(content.sessionId))
        .map((content) => projections.get(content.sessionId))
        .filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
      if (shown.length === 0) continue;
      const list = map.get(occurrence.date) ?? [];
      list.push({ key: `${occurrence.routineId}|${occurrence.key}`, occurrence, projections: shown, routine: routinesById.get(occurrence.routineId) });
      map.set(occurrence.date, list);
    }
    return map;
  }, [occurrences, isPlannable, projections, routinesById]);

  const bodyZones = useBodyZonesReferential();
  const zoneName = useMemo(() => new Map(bodyZones.map((zone) => [zone.id, zone.name])), [bodyZones]);
  /** Titre : nom de la routine ; une routine sans nom (antérieure au 18/11/2026, RM-264) montre ses séances. */
  const titleOf = (item: CardItem) => {
    const name = item.routine?.name.trim() ?? "";
    return name !== "" ? name : item.projections.map((projection) => projection.name).join(", ");
  };
  const detailOf = (item: CardItem) =>
    zonesLine(item.projections.flatMap((projection) => projection.bodyZoneIds.map((id) => zoneName.get(id)).filter((value): value is string => value !== undefined)));

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
  const changeMonth = (shift: -1 | 1) => {
    const first = firstDayOfShiftedMonth(selectedDay, shift);
    changeWeek(mondayOf(first), first);
  };

  /**
   * « Démarrer » (D-534) : première séance de la liste ordonnée de l'occurrence (contrat PRE-10 `/execution?sessionId=`) ;
   * plusieurs séances : la chaîne et le rang accompagnent la route, les suivantes s'enchaînent à la fin de chacune.
   */
  const start = (item: CardItem) => {
    setRevealed(null);
    // Recette du 19/11/2026 au soir : l'Exécution est rattachée à l'occurrence (routine, date/heure d'origine, rang).
    router.push({
      pathname: "/execution",
      params: executionParams(
        item.projections.map((projection) => projection.id),
        1,
        { routineId: item.occurrence.routineId, occurrenceKey: item.occurrence.key },
      ),
    });
  };

  const bottomReserve = navigationBarTotalHeight() + insets.bottom + spacing[24];
  const anyItem = days.some((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
  const lastDay = [...days].reverse().find((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
  const listPaddingBottom = Math.max(bottomReserve, listHeight - lastSectionHeight);

  return (
    // Haut d'écran partagé `TabbedScreen` (Hermann, 19/11/2026) : même en-tête à onglets et même bande que le Journal et les
    // Catalogues. DSF Agenda § 2 : trois lignes centrées verticalement dans la bande, espacées de 6 — mois, semaine,
    // « Aujourd'hui » et Planifier.
    <TabbedScreen
      title={t.calendar.title}
      palette={CALENDAR_PALETTE}
      tabs={calendarTabs("agenda", onChangeView)}
      context={{
        kind: "custom",
        layout: "centered",
        content: (
          <View style={styles.contextLines}>
            <View style={styles.monthNavigation}>
              <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel={t.calendar.previousMonth} hitSlop={10} testID="calendar-previous-month">
                <DoubleChevron source={require("../../../assets/icons/icon-precedent.svg")} />
              </Pressable>
              <Text style={styles.periodLabel} accessibilityRole="header" maxFontSizeMultiplier={1.4} testID="calendar-month-label">
                {formatAgendaMonth(selectedDay)}
              </Text>
              <Pressable onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel={t.calendar.nextMonth} hitSlop={10} testID="calendar-next-month">
                <DoubleChevron source={require("../../../assets/icons/icon-suivant.svg")} />
              </Pressable>
            </View>
            {/* Flèches simples rapprochées du centre (centres à 96 et 306) : entonnoir sous la ligne du mois. */}
            <View style={styles.weekNavigation}>
              <Pressable
                onPress={() => changeWeek(addDays(monday, -7), addDays(monday, -7))}
                accessibilityRole="button"
                accessibilityLabel={t.calendar.previousWeek}
                hitSlop={12}
                testID="calendar-previous-week"
              >
                <Image source={require("../../../assets/icons/icon-precedent.svg")} style={styles.chevron} accessible={false} />
              </Pressable>
              <Text style={[styles.periodLabel, styles.weekLabel]} maxFontSizeMultiplier={1.4} numberOfLines={1} adjustsFontSizeToFit testID="calendar-week-label">
                {formatAgendaWeek(monday)}
              </Text>
              <Pressable
                onPress={() => changeWeek(addDays(monday, 7), addDays(monday, 7))}
                accessibilityRole="button"
                accessibilityLabel={t.calendar.nextWeek}
                hitSlop={12}
                testID="calendar-next-week"
              >
                <Image source={require("../../../assets/icons/icon-suivant.svg")} style={styles.chevron} accessible={false} />
              </Pressable>
            </View>
            <View style={styles.todayLine}>
              {/* « Aujourd'hui » en texte seul (DSF § 2). Sa condition d'affichage reste À CLARIFIER : toujours présent. */}
              <Pressable
                onPress={() => {
                  const today = todayLocal();
                  changeWeek(mondayOf(today), today);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.calendar.today}
                hitSlop={10}
                testID="calendar-today"
              >
                <Text style={styles.todayLabel} maxFontSizeMultiplier={1.4}>
                  {t.calendar.today}
                </Text>
              </Pressable>
              {/* Planifier : cercle de commande standard des zones de contexte (`CommandCircle`, 19/11/2026). */}
              <View style={styles.planSlot}>
                <CommandCircle
                  label={t.calendar.plan}
                  icon="plan"
                  onPress={() => router.push({ pathname: "/planning", params: { date: selectedDay < todayLocal() ? todayLocal() : selectedDay } })}
                  testID="calendar-plan"
                />
              </View>
            </View>
          </View>
        ),
      }}
    >

      {/* DSF Agenda § 3 : sept cartes 46 × 64 (écart 8), jour sélectionné plein, un point par séance du jour. */}
      <View style={styles.dayBar} accessibilityRole="tablist" testID="calendar-day-bar">
        {days.map((day, index) => {
          const items = itemsByDay.get(day) ?? [];
          const sessionsOfDay = items.flatMap((item) => item.projections.map((projection, rank) => ({ key: `${item.key}|${rank}`, projection })));
          const selected = day === selectedDay;
          return (
            <Pressable
              key={day}
              onPress={() => selectDay(day)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                sessionsOfDay.length > 0
                  ? fillTemplate(t.calendar.dayAccessibility, { day: formatDayTitle(day), count: plannedCountLabel(sessionsOfDay.length) })
                  : fillTemplate(t.calendar.dayEmptyAccessibility, { day: formatDayTitle(day) })
              }
              style={[styles.dayCell, selected ? styles.dayCellSelected : null]}
              testID={`calendar-day-${day}`}
            >
              {/* Recette du 19/11/2026 (h2) : texte agrandi — l'abrégé et le numéro rétrécissent pour tenir dans la carte. */}
              <Text style={[styles.dayShort, selected ? styles.dayTextSelected : null]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
                {t.weekdayShort[index]}
              </Text>
              <Text style={[styles.dayNumber, selected ? styles.dayTextSelected : null]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>
                {parseLocalDate(day).getDate()}
              </Text>
              <View style={styles.dots}>
                {sessionsOfDay.slice(0, MAX_DOTS).map((session) => (
                  <View
                    key={session.key}
                    style={[styles.dot, { backgroundColor: selected ? colors.background : dotColor(session.projection) }]}
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
          const first = day === days.find((candidate) => (itemsByDay.get(candidate)?.length ?? 0) > 0);
          return (
            <View
              key={day}
              onLayout={(event) => {
                sectionOffsets.current.set(day, event.nativeEvent.layout.y);
                if (day === lastDay) setLastSectionHeight(event.nativeEvent.layout.height);
              }}
              testID={`calendar-section-${day}`}
            >
              {/* DSF Agenda § 4 : un trait fin pleine largeur sépare deux jours, à 5 au-dessus de la date. */}
              {first ? null : <View style={styles.daySeparator} testID={`calendar-section-${day}-separator`} />}
              <View style={[styles.sectionHeader, first ? styles.sectionHeaderFirst : null]}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {formatDayTitle(day)}
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
                const title = titleOf(item);
                const duration = sessionsDurationLabel(item.projections);
                const status = statusOf(item);
                const startable = status === "UPCOMING" || status === "MISSED";
                return (
                  <View key={item.key} style={styles.item} testID={`calendar-item-${item.key}`}>
                    {/* DSF Agenda § 6 : la carte glisse de 180 et découvre Dupliquer (gris) et Supprimer (rouge), 90 × 52. */}
                    <SwipeActionsRow
                      actions={actions}
                      revealed={revealed === item.key}
                      onReveal={() => setRevealed(item.key)}
                      onHide={() => setRevealed((current) => (current === item.key ? null : current))}
                      onPress={() => openRoutine(item.occurrence.routineId)}
                      accessibilityLabel={[title, fillTemplate(t.calendar.timeAccessibility, { time: formatAgendaTime(item.occurrence.time) }), duration].filter((part) => part !== "").join(", ")}
                      accessibilityHint={t.calendar.openRoutine}
                      accessibilityState={{ expanded: isExpanded }}
                      extraAccessibilityActions={[
                        { name: "toggle", label: isExpanded ? t.calendar.collapseRoutine : t.calendar.expandRoutine, onAction: toggle },
                        ...(startable ? [{ name: "start", label: t.calendar.start, onAction: () => start(item) }] : []),
                      ]}
                      actionsHeight={AGENDA_ROW_HEIGHT}
                      actionWidth={AGENDA_ACTION_WIDTH}
                      // Recette du 19/11/2026 au soir (s19-glisse) : coins arrondis du bloc d'actions standard et marge de 16
                      // avec le bord droit de l'écran. [Coins droits (`actionsRadius={0}`), collé au bord — remplacé.]
                      actionsRightMargin={layout.screenGutter}
                      testID={`calendar-item-${item.key}-swipe`}
                    >
                      <RoutineAgendaCard
                        time={formatAgendaTime(item.occurrence.time)}
                        duration={duration}
                        name={title}
                        detail={detailOf(item)}
                        status={status}
                        expanded={isExpanded}
                        onOpen={() => openRoutine(item.occurrence.routineId)}
                        onToggleExpanded={toggle}
                        onStart={() => start(item)}
                        testID={`calendar-item-${item.key}-card`}
                      />
                    </SwipeActionsRow>
                    {isExpanded ? (
                      // DSF Agenda § 6 : complément de composition du catalogue sous la carte (filet, puis séances).
                      // Recette du 19/11/2026 au soir (constat A) : la ligne de récapitulation des jours planifiés passe au Journal.
                      <Pressable onPress={toggle} accessible={false} style={styles.expanded} testID={`calendar-item-${item.key}-expanded`}>
                        {item.projections.map((projection, rank) => (
                          <View key={`${projection.id}-${rank}`} testID={`calendar-item-${item.key}-session-${rank}`}>
                            {item.projections.length > 1 ? <Text style={styles.expandedSession}>{projection.name}</Text> : null}
                            <SessionCompositionTree tree={projection.tree} testID={`calendar-item-${item.key}-composition-${rank}`} />
                          </View>
                        ))}
                      </Pressable>
                    ) : null}
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
    </TabbedScreen>
  );
}

const styles = StyleSheet.create({
  // DSF Barre de titre à onglets § 2 : en-tête et barre d'état teintés #F7F7FF, comme le Catalogue des séances.
  // DSF Agenda § 2 : trois lignes centrées, espacées de 6. Marges gauche et droite de 16 portées par la bande (`ContextBand`).
  // [Avant : 16 de plus ici, soit 32 de chaque côté — remplacé le 19/11/2026.]
  contextLines: { gap: 6 },
  monthNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  doubleChevron: { width: 30, height: 24 },
  chevron: { width: 24, height: 24 },
  chevronFirst: { position: "absolute", left: 0, top: 0 },
  chevronSecond: { position: "absolute", left: 7, top: 0 },
  // Mois et semaine : Inter 18 semi-gras.
  periodLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary, textAlign: "center" },
  // Flèches de semaine aux centres x = 96 et x = 306 (bande de 370 : 68 + 24 + 186 + 24 + 68).
  weekNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  weekLabel: { width: 186, flexShrink: 1 },
  todayLine: { minHeight: dimensions.catalogueCommand.visual, alignItems: "center", justifyContent: "center" },
  todayLabel: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 14, color: "#333333" },
  // Planifier à droite de la ligne 3 (bord droit à 16 de l'écran), cercle de commande standard.
  planSlot: { position: "absolute", right: 0 },
  // DSF Agenda § 3 : sept cartes 46 × 64, écart 8, rayon 12.
  dayBar: {
    flexDirection: "row",
    gap: spacing[8],
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
  },
  dayCell: {
    flex: 1,
    flexBasis: 0,
    minHeight: 64,
    minWidth: 0,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: spacing[4],
  },
  dayCellSelected: { backgroundColor: colors.selection },
  dayShort: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, color: "#46464C" },
  dayNumber: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 22, color: "#46464C" },
  dayTextSelected: { color: colors.background },
  dots: { flexDirection: "row", gap: 2, marginTop: 2, minHeight: DOT_SIZE },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  list: { flex: 1 },
  // DSF Agenda § 4 : liste à 14 sous la rangée des jours ; cartes pleine largeur d'écran.
  listContent: { paddingTop: 14 },
  daySeparator: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E8F0", marginHorizontal: layout.screenGutter, marginTop: spacing[16] },
  sectionHeader: { paddingHorizontal: layout.screenGutter, paddingTop: 5, paddingBottom: spacing[8] },
  sectionHeaderFirst: { paddingTop: 0 },
  // En-tête de jour : Inter 13 semi-gras gris.
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: colors.textSecondary },
  // DSF Agenda § 4 : 8 entre deux routines, aucun trait.
  item: { paddingBottom: spacing[8] },
  expanded: { marginHorizontal: layout.screenGutter, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardsBorder, marginTop: spacing[8], paddingTop: spacing[8], gap: spacing[8] },
  expandedSession: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: colors.textPrimary },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8], paddingHorizontal: layout.screenGutter },
});
