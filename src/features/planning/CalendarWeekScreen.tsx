import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";

import { addDays, formatLocalDate, mondayOf, occurrenceInstant, parseLocalDate, weekdayOf, type LocalDate, type Routine } from "@/domain/planning/Routine";
import { groupOccurrenceExecutions, occurrenceExecutionKey, occurrenceExecutionStatus, type OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { firstDayOfShiftedMonth, formatAgendaMonth, formatAgendaTime, sessionsDurationLabel, zonesLine } from "@/features/planning/agendaFormat";
import { AGENDA_ROW_HEIGHT, RoutineAgendaCard, type AgendaStatus } from "@/features/planning/RoutineAgendaCard";
import { executionParams } from "@/features/execution/executionChain";
import { useBodyZonesReferential } from "@/features/activities/useBodyZonesReferential";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { CALENDAR_PALETTE, calendarTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CommandCircle } from "@/shared/ui/CatalogueCommands";
import { TodayIcon } from "@/features/planning/TodayIcon";
import { requestPlanningSheet } from "@/features/planning/planningSheetRelay";
import { agendaRoutineFilter, setAgendaRoutineFilter } from "@/features/planning/agendaRoutineFilter";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

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
/** D-538 : point de 4 par séance du jour. [5 — remplacé.] */
const DOT_SIZE = 4;
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

/** Liste continue de l'Agenda (constat C, 20/11/2026) : semaines chargées d'abord, ajoutées en fin de défilement, au plus. [Choix technique.] */
const AGENDA_WEEKS_INITIAL = 4;
const AGENDA_WEEKS_STEP = 4;
const AGENDA_WEEKS_MAX = 52;
type AgendaRange = { readonly start: LocalDate; readonly weeks: number };

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
  // Recette du 20/11/2026 (constat C — Hermann : « Quand on défile les routines de l'agenda, la liste s'arrête à la fin de
  // la semaine. Elle doit continuer à la semaine suivante, et le carrousel de jours se mettre à jour. ») : la liste couvre
  // `range.weeks` semaines depuis `range.start`, prolongée en fin de défilement ; `monday` (carrousel) suit le défilement.
  // [Liste limitée à la semaine du carrousel — remplacé.]
  const [range, setRange] = useState<AgendaRange>(() => ({ start: mondayOf(initialDay ?? todayLocal()), weeks: AGENDA_WEEKS_INITIAL }));
  const rangeRef = useRef(range);
  const [selectedDay, setSelectedDay] = useState<LocalDate>(() => initialDay ?? todayLocal());
  // D-539 (20/11/2026) : filtre par routine — `null` sans filtre. Il reste actif en changeant de semaine, de mois, avec
  // « Aujourd'hui », et tant qu'il n'est pas retiré [durée retenue par Claude, D-539 ; conservé pour la session de
  // l'application, en mémoire : interprétation technique].
  const [routineFilter, setRoutineFilterState] = useState<ReadonlySet<string> | null>(() => agendaRoutineFilter());
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
  // Recette du 20/11/2026 (constat A — Hermann : « Quand on fait glisser gauche dans le journal ou l'agenda, la liste doit
  // rester figée. ») : verrou partagé des cartes à actions glissées (`SwipeScrollLockContext`), comme les Catalogues.
  const [swipeLocked, setSwipeLocked] = useState(false);
  const lockList = useCallback((locked: boolean) => {
    try {
      scrollRef.current?.setNativeProps({ scrollEnabled: !locked });
    } catch {
      // Vue native indisponible (tests, démontage) : l'état de l'écran suffit.
    }
    setSwipeLocked(locked);
  }, []);
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
    (window: AgendaRange) => {
      const id = ++requestId.current;
      Promise.all([
        planning.listRoutines(),
        planning.rangeOccurrences(window.start, addDays(window.start, window.weeks * 7 - 1), () => true),
        planning.listOccurrenceExecutions(),
      ]).then(
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
      load(rangeRef.current);
      return () => {
        cancelPending();
        setRevealed(null);
      };
    }, [reloadCatalogue, cancelPending, load]),
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
  /** Jours de la liste continue (constat C). */
  const listDays = useMemo(() => Array.from({ length: range.weeks * 7 }, (_, index) => addDays(range.start, index)), [range]);

  const itemsByDay = useMemo(() => {
    const map = new Map<LocalDate, CardItem[]>();
    for (const occurrence of occurrences) {
      // D-539 : seules les routines du filtre ; les points des cartes de jour suivent la même liste.
      if (routineFilter !== null && !routineFilter.has(occurrence.routineId)) continue;
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
  }, [occurrences, isPlannable, projections, routinesById, routineFilter]);

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
    const window = { start: next, weeks: AGENDA_WEEKS_INITIAL };
    rangeRef.current = window;
    setMonday(next);
    setSelectedDay(day);
    setRange(window);
    setExpanded(new Set());
    setRevealed(null);
    sectionOffsets.current.clear();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    load(window);
  };

  /** Fin de la liste approchée : semaines suivantes (constat C), jusqu'à `AGENDA_WEEKS_MAX`. */
  const extendRange = () => {
    const current = rangeRef.current;
    if (current.weeks >= AGENDA_WEEKS_MAX) return;
    const window = { start: current.start, weeks: Math.min(AGENDA_WEEKS_MAX, current.weeks + AGENDA_WEEKS_STEP) };
    rangeRef.current = window;
    setRange(window);
    load(window);
  };

  const selectDay = (day: LocalDate) => {
    setSelectedDay(day);
    // RM-046 : la section du jour (ou la suivante s'il est vide) passe en tête de liste.
    const target = listDays.filter((candidate) => candidate >= day).find((candidate) => sectionOffsets.current.has(candidate));
    const y = target === undefined ? undefined : sectionOffsets.current.get(target);
    if (y !== undefined) {
      programmaticScroll.current = true;
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Moins d'un écran de contenu sous la vue (réserve basse exclue) : semaines suivantes.
    if (contentOffset.y + 2 * layoutMeasurement.height >= contentSize.height - listPaddingBottom) extendRange();
    if (programmaticScroll.current) return;
    const y = contentOffset.y + spacing[8];
    let top: LocalDate | null = null;
    for (const day of listDays) {
      const offset = sectionOffsets.current.get(day);
      if (offset !== undefined && offset <= y) top = day;
    }
    if (top === null || top === selectedDay) return;
    setSelectedDay(top);
    // Le carrousel passe à la semaine du jour en tête de liste, sans recharger ni replacer la liste.
    if (mondayOf(top) !== monday) setMonday(mondayOf(top));
  };

  /** D-539 : sélection validée dans la modale ; vide = filtre retiré. */
  const changeRoutineFilter = (selected: readonly string[]) => {
    const next = selected.length === 0 ? null : new Set(selected);
    setAgendaRoutineFilter(next);
    setRoutineFilterState(next);
    setExpanded(new Set());
    setRevealed(null);
  };

  /**
   * D-536, point 4 (20/11/2026) : depuis l'Agenda, toute modification ne concerne que l'occurrence, sans choix ; la routine
   * entière se modifie depuis le Journal. Une occurrence commencée n'est pas modifiable (point 1). [Ouverture de la
   * planification entière — remplacé.]
   */
  const openOccurrence = (item: CardItem) => {
    setRevealed(null);
    if (item.occurrence.started) return;
    router.push({ pathname: "/planning", params: { routineId: item.occurrence.routineId, occurrenceKey: item.occurrence.key } });
  };

  const duplicate = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { duplicateOf: routineId } });
  };

  const runAction = (action: () => Promise<unknown>) => {
    setDeleteCandidate(null);
    setActionFailed(false);
    action().then(
      () => load(rangeRef.current),
      (error: unknown) => {
        console.error("L'action de planification a échoué.", error);
        setActionFailed(true);
        load(rangeRef.current);
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
  // Message « semaine vide » : première semaine de la liste sans occurrence ; les semaines suivantes s'affichent dessous.
  const anyItem = listDays.slice(0, 7).some((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
  const lastDay = [...listDays].reverse().find((day) => (itemsByDay.get(day)?.length ?? 0) > 0);
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
          // D-538 (20/11/2026, DSF Agenda § 2 ; Figma `12765:24572`) : deux lignes dans la bande 402 × 115, la rangée des sept
          // jours dans la bande. Positions de la maquette, relatives au contenu de la bande (marges de 16 portées par la bande).
          // [Trois lignes (mois, semaine « du 16 au 22 », « Aujourd'hui » en texte et Planifier) et rangée de cartes 46 × 64 sous
          // la bande — remplacé.]
          <View style={styles.context} pointerEvents="box-none" testID="calendar-context">
            {/* Ligne 1, à gauche : « Aujourd'hui », calendrier portant le numéro du jour courant, zone de tap 34 × 34. */}
            <Pressable
              onPress={() => {
                const today = todayLocal();
                changeWeek(mondayOf(today), today);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.calendar.today}
              style={styles.todayButton}
              testID="calendar-today"
            >
              <TodayIcon day={parseLocalDate(todayLocal()).getDate()} current={selectedDay === todayLocal()} testID="calendar-today-icon" />
            </Pressable>
            {/* Ligne 1, au centre de l'écran : mois entre deux doubles flèches, à 10 du libellé. */}
            <View style={styles.monthNavigation} pointerEvents="box-none">
              <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel={t.calendar.previousMonth} hitSlop={6} testID="calendar-previous-month">
                <DoubleChevron source={require("../../../assets/icons/icon-precedent.svg")} />
              </Pressable>
              <Text style={styles.periodLabel} accessibilityRole="header" maxFontSizeMultiplier={1.2} numberOfLines={1} testID="calendar-month-label">
                {formatAgendaMonth(selectedDay)}
              </Text>
              <Pressable onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel={t.calendar.nextMonth} hitSlop={6} testID="calendar-next-month">
                <DoubleChevron source={require("../../../assets/icons/icon-suivant.svg")} />
              </Pressable>
            </View>
            {/* Ligne 1, à droite : filtre par routine (D-539, DSF Agenda § 9), entonnoir sans cercle, zone de tap 34 × 34 ;
                contour gris sans filtre, silhouette pleine bleue filtre actif. */}
            <Pressable
              onPress={() => {
                setRevealed(null);
                requestPlanningSheet({ kind: "routineFilter", initial: routineFilter === null ? [] : [...routineFilter], onValidate: changeRoutineFilter });
                router.push("/agenda-routine-filter");
              }}
              accessibilityRole="button"
              accessibilityLabel={t.routineFilter.open}
              accessibilityState={{ selected: routineFilter !== null }}
              {...(routineFilter !== null ? { accessibilityValue: { text: t.routineFilter.active } } : {})}
              style={styles.filterSlot}
              testID="calendar-routine-filter"
            >
              <Image
                source={routineFilter === null ? require("../../../assets/icons/icon-filtre-routine.svg") : require("../../../assets/icons/icon-filtre-routine-actif.svg")}
                style={styles.filterIcon}
                accessible={false}
                testID={`calendar-routine-filter-${routineFilter === null ? "inactive" : "active"}`}
              />
            </Pressable>
            {/* Ligne 2 : flèche de semaine, sept cartes de jour, flèche de semaine, Planifier. */}
            <Pressable
              onPress={() => changeWeek(addDays(monday, -7), addDays(monday, -7))}
              accessibilityRole="button"
              accessibilityLabel={t.calendar.previousWeek}
              hitSlop={6}
              style={styles.previousWeek}
              testID="calendar-previous-week"
            >
              <Image source={require("../../../assets/icons/icon-precedent.svg")} style={styles.chevron} accessible={false} />
            </Pressable>
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
                    <Text style={[styles.dayShort, selected ? styles.dayTextSelected : null]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
                      {t.weekdayShort[index]}
                    </Text>
                    <Text style={[styles.dayNumber, selected ? styles.dayTextSelected : null]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
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
            <Pressable
              onPress={() => changeWeek(addDays(monday, 7), addDays(monday, 7))}
              accessibilityRole="button"
              accessibilityLabel={t.calendar.nextWeek}
              hitSlop={6}
              style={styles.nextWeek}
              testID="calendar-next-week"
            >
              <Image source={require("../../../assets/icons/icon-suivant.svg")} style={styles.chevron} accessible={false} />
            </Pressable>
            {/* Planifier : cercle de commande standard des zones de contexte (`CommandCircle`), x = 352, y = 149. */}
            <View style={styles.planSlot}>
              <CommandCircle
                label={t.calendar.plan}
                icon="plan"
                onPress={() => router.push({ pathname: "/planning", params: { date: selectedDay < todayLocal() ? todayLocal() : selectedDay } })}
                testID="calendar-plan"
              />
            </View>
          </View>
        ),
      }}
    >

      <SwipeScrollLockContext.Provider value={lockList}>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={!swipeLocked}
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
        {listDays.map((day) => {
          const items = itemsByDay.get(day) ?? [];
          if (items.length === 0) return null;
          const first = day === listDays.find((candidate) => (itemsByDay.get(candidate)?.length ?? 0) > 0);
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
                // D-537, point 1 : une occurrence commencée n'est jamais supprimée — pas d'action Supprimer.
                const actions: readonly SwipeAction[] = [
                  { key: "duplicate", label: t.calendar.duplicate, backgroundColor: colors.movementLevelAction, onPress: () => duplicate(item.occurrence.routineId) },
                  ...(item.occurrence.started
                    ? []
                    : [
                        {
                          key: "delete",
                          label: t.calendar.delete,
                          backgroundColor: colors.danger,
                          onPress: () => {
                            setRevealed(null);
                            if (routine !== undefined) setDeleteCandidate({ routine, occurrenceKey: item.occurrence.key });
                          },
                        },
                      ]),
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
                      onPress={() => openOccurrence(item)}
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
                        parcours={(item.routine?.entries.length ?? 0) > 1}
                        detail={detailOf(item)}
                        status={status}
                        expanded={isExpanded}
                        onOpen={() => openOccurrence(item)}
                        onToggleExpanded={toggle}
                        onStart={() => start(item)}
                        testID={`calendar-item-${item.key}-card`}
                      />
                    </SwipeActionsRow>
                    {isExpanded ? (
                      // DSF Agenda § 6 : complément de composition du catalogue sous la carte (filet, puis séances).
                      // Recette du 19/11/2026 au soir (constat A) : la ligne de récapitulation des jours planifiés passe au Journal.
                      // Recette du 20/11/2026 (r20-recap — Hermann) : « retirer toute séparation verticale et l'espace vertical
                      // associé, s'il n'y a pas de texte avant » ; « toujours mettre le nom de la séance, même lorsqu'il n'y en
                      // n'a qu'une dans la routine ». [Filet en tête ; nom seulement pour un parcours — remplacé.]
                      <Pressable onPress={toggle} accessible={false} style={styles.expanded} testID={`calendar-item-${item.key}-expanded`}>
                        {item.projections.map((projection, rank) => (
                          <View key={`${projection.id}-${rank}`} testID={`calendar-item-${item.key}-session-${rank}`}>
                            <Text style={styles.expandedSession} testID={`calendar-item-${item.key}-session-${rank}-name`}>
                              {projection.name}
                            </Text>
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
      </SwipeScrollLockContext.Provider>

      {/* Recette du 20/11/2026 (constat D — Hermann : « Dans l'agenda on ne supprime que l'occurrence ») : un seul
          dialogue, titre seul ; l'occurrence est retirée, la routine reste (au Journal, grise s'il n'y a plus rien à venir).
          [Planification unique supprimée en entier ; choix « Seulement cette occurrence » / « Toutes les occurrences à
          venir » — remplacé.] */}
      {deleteCandidate !== null ? (
        <DecisionDialog
          cancelOnTop
          title={t.deleteOccurrence.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message=""
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.deleteOccurrence.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.deleteOccurrence.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => {
            const { routine, occurrenceKey } = deleteCandidate;
            runAction(() => planning.excludeOccurrence(routine.id, occurrenceKey));
          }}
          testIDPrefix="planning-delete-occurrence"
        />
      ) : null}
    </TabbedScreen>
  );
}

const styles = StyleSheet.create({
  // DSF Barre de titre à onglets § 2 : en-tête et barre d'état teintés #F7F7FF, comme le Catalogue des séances.
  // DSF Agenda § 2 : trois lignes centrées, espacées de 6. Marges gauche et droite de 16 portées par la bande (`ContextBand`).
  // [Avant : 16 de plus ici, soit 32 de chaque côté — remplacé le 19/11/2026.]
  // D-538 : bande de 115, centres des lignes à y = 23 (ligne 1) et y = 74 (ligne 2) dans la bande ; x relatifs au contenu (16).
  context: { height: 115 },
  todayButton: { position: "absolute", left: -5, top: 6, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  monthNavigation: { position: "absolute", left: 40, right: 40, top: 11, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  doubleChevron: { width: 30, height: 24 },
  chevron: { width: 24, height: 24 },
  chevronFirst: { position: "absolute", left: 0, top: 0 },
  chevronSecond: { position: "absolute", left: 7, top: 0 },
  // Mois : Inter 18 semi-gras.
  periodLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary, textAlign: "center", flexShrink: 1 },
  filterSlot: { position: "absolute", left: 345, top: 6, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  filterIcon: { width: 24, height: 24 },
  previousWeek: { position: "absolute", left: -5.75, top: 62 },
  nextWeek: { position: "absolute", left: 302, top: 62 },
  planSlot: { position: "absolute", left: 336, top: 57 },
  // Rangée des jours : sept cartes 36 × 46, rayon 10, écart 3 (270), à x = 41 de l'écran.
  dayBar: { position: "absolute", left: 25, top: 51, width: 270, height: 46, flexDirection: "row", gap: 3 },
  dayCell: { width: 36, height: 46, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.3)", alignItems: "center", overflow: "hidden" },
  dayCellSelected: { backgroundColor: colors.selection },
  dayShort: { position: "absolute", top: 3, left: 0, right: 0, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 11, lineHeight: 14, color: colors.textLabel, textAlign: "center" },
  dayNumber: { position: "absolute", top: 14, left: 0, right: 0, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 22, color: colors.textLabel, textAlign: "center" },
  dayTextSelected: { color: colors.background },
  // Un point de 4 par séance du jour en bas de la carte (y = 39), écart 3.
  dots: { position: "absolute", top: 39, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 3 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  list: { flex: 1 },
  // D-538 : premier en-tête de jour à y = 215 (8 sous la bande), son texte à 11,5 du haut de l'en-tête ; cartes pleine
  // largeur d'écran. [Liste à 14 sous la rangée des jours — remplacé.]
  listContent: { paddingTop: spacing[8] },
  daySeparator: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E8F0", marginHorizontal: layout.screenGutter, marginTop: spacing[16] },
  sectionHeader: { paddingHorizontal: layout.screenGutter, paddingTop: 5, paddingBottom: spacing[8] },
  sectionHeaderFirst: { paddingTop: 11 },
  // En-tête de jour : Inter 13 semi-gras gris.
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: colors.textSecondary },
  // DSF Agenda § 4 : 8 entre deux routines, aucun trait.
  item: { paddingBottom: spacing[8] },
  expanded: { marginHorizontal: layout.screenGutter, marginTop: spacing[8], gap: spacing[8] },
  expandedSession: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: colors.textPrimary },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8], paddingHorizontal: layout.screenGutter },
});
