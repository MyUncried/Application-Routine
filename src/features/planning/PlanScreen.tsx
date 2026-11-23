import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addDays, formatLocalDate, mondayOf, parseLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { takePlanningNotice } from "@/features/planning/planningNotice";
import { PlanningNoticeHost } from "@/features/planning/PlanningNoticeHost";
import { executedProjections, mergeAgendaExecutions } from "@/features/planning/agendaCards";
import { formatAgendaMonth, sessionsDurationLabel } from "@/features/planning/agendaFormat";
import { DoubleChevron, formatDayTitle } from "@/features/planning/CalendarWeekScreen";
import { CALENDAR_PALETTE, calendarTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import { routineTitle } from "@/features/planning/journal";
import { ParcoursBadge } from "@/features/planning/ParcoursBadge";
import {
  buildPlanWeek,
  firstWeekOfShiftedMonth,
  formatPlanTotal,
  isoWeekNumber,
  monthOfWeek,
  weekDaysLabel,
  weeksOfMonth,
  type PlanRow,
  type PlanTint,
} from "@/features/planning/planWeek";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { TodayIcon } from "@/features/planning/TodayIcon";
import type { CatalogueCategoryRef, SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { CommandCircle } from "@/shared/ui/CatalogueCommands";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import type { Program } from "@/domain/programs/Program";
import { useOptionalProgramService } from "@/features/programs/ProgramServiceContext";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Calendrier — Plan (D-554, 21/11/2026 ; DSF Plan ; CE-UI-16 ; Figma « P-Calendrier — Plan » `12983:19`, mois de cinq semaines
 * `13005:14750`, case vide touchée `13005:14584`). Grille d'une semaine : routines regroupées par programme, cases de créneau,
 * ligne Total, légende. Calcul de la grille : `planWeek.ts`.
 *
 * Gestes (DSF Plan § 7) :
 * - case vide : ajoute un créneau de la routine ce jour-là (modale du créneau pré-remplie ; parcours : le créneau entier) ;
 * - case pleine : modification du créneau (pour un parcours, tout le créneau) ; un créneau commencé ne s'ouvre pas ;
 * - « + Routine » : planification habituelle, programme du groupe pré-sélectionné (aucun sous « Sans programme »).
 *
 * Programmes (intégration de PROG-CAT-01, 23/11/2026) : une routine rattachée à un programme figure sous sa bande ; les autres sous
 * « Sans programme ». [Toutes les routines « Sans programme » tant que les programmes n'étaient pas sur cette branche — remplacé.]
 */

const t = planningStrings;
/** Figma `12983:39` : colonnes de jour de 38 à partir de x = 128, cases 34 × 20, marge gauche 8. */
const LEFT = 8;
const NAMES_WIDTH = 120;
const COLUMN = 38;
const CELL_WIDTH = 34;
const CELL_HEIGHT = 20;
const CELL_GAP = 2;
const ROW_HEIGHT = 32;
const TITLE_HEIGHT = 22;
const BAND_HEIGHT = 26;
const WEEK_WIDTH = 51;
const WEEK_GAP = 3;
const LINE = 0.5;

/**
 * Teintes des cases (Figma `12983:74` et suivantes) et de la légende (`12983:100`). Recette du 21/11/2026 (p32-cases) : à venir
 * en bleu, fond et trait de l'Agenda (`RoutineAgendaCard`, #E3ECFF / #8EAAE8) ; le gris reste pour « Arrêtée ».
 * [Texte bleu #2D4F9E : choix de Claude, à valider.]
 */
const TINTS: Readonly<Record<PlanTint, { readonly background: string; readonly text: string; readonly border: string }>> = {
  COMPLETED: { background: "#E0F5E8", text: "#1A7340", border: "#8FCCA8" },
  PARTIAL: { background: "#FCEDD6", text: "#A6610D", border: "#EBB26B" },
  MISSED: { background: "#FCE5E5", text: "#B23838", border: "#E58F8F" },
  UPCOMING: { background: "#E3ECFF", text: "#2D4F9E", border: "#8EAAE8" },
  STOPPED: { background: "#F0F0F5", text: "#595E66", border: "#B8BAC9" },
  // Lot 5, 23/11/2026 (x11-trace — Hermann : « Le plan doit montrer la case avec l'heure supprimée texte gris sur fond gris ») :
  // gris de la pastille « Supprimée » de l'Agenda (D-568, `RoutineAgendaCard`, #EDF0F2 / #737882), trait gris de sa carte
  // (#D9DBE3). Hors légende (non demandé).
  DELETED: { background: "#EDF0F2", text: "#737882", border: "#D9DBE3" },
};
/** Ordre de la légende (sans « Supprimée », lot 5 : non demandé). */
const LEGEND: readonly Exclude<PlanTint, "DELETED">[] = ["COMPLETED", "PARTIAL", "MISSED", "UPCOMING", "STOPPED"];
/** Glisser horizontal sur le tableau : distance minimale pour changer de semaine (recette du 21/11/2026, constat a). */
const SWIPE_DISTANCE = 50;

const SEPARATOR = "#E0E3EB";
const DAY_SEPARATOR = "#E3E5EB";
const TODAY_COLUMN = "rgba(94, 97, 237, 0.06)";
const TODAY_BADGE = "#5E61ED";

function todayLocal(): LocalDate {
  return formatLocalDate(new Date());
}

/**
 * Hauteur minimale d'une ligne de cases : 32, agrandie pour des créneaux empilés (deux créneaux : 50). Le nom (deux lignes au
 * plus) et la durée de la Séance peuvent l'agrandir encore (recette du 21/11/2026, constats b et c).
 */
export function planRowHeight(row: PlanRow): number {
  if (row.kind === "TITLE") return TITLE_HEIGHT;
  const stacked = Math.max(1, ...row.cells.map((list) => list.length));
  return Math.max(ROW_HEIGHT, stacked * CELL_HEIGHT + (stacked - 1) * CELL_GAP + 8);
}

/** Glisser horizontal du tableau (recette du 21/11/2026, constat a) : `Pan` natif, horizontal seulement. */
function useWeekSwipe(onShift: (shift: 1 | -1) => void) {
  return useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-12, 12])
        .runOnJS(true)
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_DISTANCE) onShift(1);
          else if (event.translationX >= SWIPE_DISTANCE) onShift(-1);
        })
        .withTestId("plan-swipe"),
    [onShift],
  );
}

export function PlanScreen({
  initialDay,
  onChangeView = () => undefined,
}: {
  readonly initialDay?: LocalDate;
  readonly onChangeView?: (view: CalendarView) => void;
} = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [planningNotice, setPlanningNotice] = useState<string | null>(null);
  const planning = usePlanningService();
  const { state: catalogue, reload: reloadCatalogue, cancelPending } = useSessionCatalogue();
  const [monday, setMonday] = useState<LocalDate>(() => mondayOf(initialDay ?? todayLocal()));
  const mondayRef = useRef(monday);
  const [routines, setRoutines] = useState<readonly Routine[]>([]);
  const [occurrences, setOccurrences] = useState<readonly Occurrence[]>([]);
  // Lot 5, 23/11/2026 (x11-trace) : créneaux supprimés avec trace (D-568), cases grises.
  const [deletedOccurrences, setDeletedOccurrences] = useState<readonly Occurrence[]>([]);
  const [linked, setLinked] = useState<readonly OccurrenceExecution[]>([]);
  const [executions, setExecutions] = useState<readonly AgendaExecution[]>([]);
  const [snapshots, setSnapshots] = useState<ReadonlyMap<string, SessionSnapshot>>(new Map());
  // Programmes (intégration de PROG-CAT-01) : bandes « Programme · nom » (DSF Plan § 3). Sans service (tests isolés) : aucun.
  const programService = useOptionalProgramService();
  const [programs, setPrograms] = useState<readonly Program[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loadedMonday, setLoadedMonday] = useState<LocalDate | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Case vide touchée (DSF Plan § 7, Figma `13005:14584`) : pointillés bleus et « + » pendant le toucher.
  const [touched, setTouched] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    (week: LocalDate) => {
      const id = ++requestId.current;
      programService?.listPrograms().then(
        (list) => {
          if (id === requestId.current) setPrograms(list);
        },
        (error: unknown) => console.error("Les programmes n'ont pas pu être chargés.", error),
      );
      planning.agendaData(week, addDays(week, 6)).then(
        (data) => {
          if (id !== requestId.current) return;
          setRoutines(data.routines);
          setOccurrences(data.occurrences);
          setDeletedOccurrences(data.deletedOccurrences ?? []);
          setLinked(data.executions);
          setExecutions(data.allExecutions);
          setSnapshots(data.snapshots);
          setLoadedAt(Date.now());
          setLoadedMonday(week);
          setLoadFailed(false);
        },
        (error: unknown) => {
          if (id !== requestId.current) return;
          console.error("Le plan n'a pas pu être chargé.", error);
          setLoadFailed(true);
        },
      );
    },
    [planning, programService],
  );

  useFocusEffect(
    useCallback(() => {
      reloadCatalogue();
      load(mondayRef.current);
      // d3 (23/11) : message laissé par une feuille qui vient de se fermer.
      const pendingNotice = takePlanningNotice();
      if (pendingNotice !== null) setPlanningNotice(pendingNotice);
      return () => {
        cancelPending();
        setTouched(null);
      };
    }, [reloadCatalogue, cancelPending, load]),
  );

  const changeWeek = (next: LocalDate) => {
    mondayRef.current = next;
    setMonday(next);
    load(next);
  };
  /** Semaine suivante (`1`) ou précédente (`-1`) depuis la semaine affichée (glisser horizontal). */
  const shiftWeek = useCallback(
    (shift: 1 | -1) => {
      const next = addDays(mondayRef.current, shift * 7);
      mondayRef.current = next;
      setMonday(next);
      load(next);
    },
    [load],
  );

  const projections = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);
  const isPlannable = useCallback((sessionId: string) => projections.get(sessionId)?.status === "ACTIVE", [projections]);

  // Recette du 22/11/2026 (constat b) : Séance telle qu'exécutée (instantané), Catégories du référentiel déjà chargé.
  const executionProjections = useMemo(() => {
    const categories = new Map<string, CatalogueCategoryRef>();
    for (const projection of projections.values()) for (const category of projection.categories) categories.set(category.id, category);
    return executedProjections(snapshots, categories);
  }, [snapshots, projections]);
  const week = useMemo(
    () =>
      buildPlanWeek({
        monday,
        routines,
        occurrences,
        executions: mergeAgendaExecutions(executions, linked),
        projections,
        isPlannable,
        now: loadedAt,
        displayName: (routine) =>
          routineTitle(
            routine,
            routine.entries.map((entry) => projections.get(entry.sessionId)).filter((projection): projection is SessionCatalogueProjection => projection !== undefined),
          ),
        // Programme de la routine (intégration de PROG-CAT-01) ; inconnu : « Sans programme ».
        // D-564 : avec sa période (occurrences hors période sous « Sans programme »).
        programmeOf: (routine) => {
          const program = routine.programId === undefined || routine.programId === null ? undefined : programs.find((item) => item.id === routine.programId);
          return program === undefined ? null : { id: program.id, name: program.name, start: program.startDate, end: program.endDate };
        },
        // D-561 : bande d'un programme actif dont la période recouvre la semaine, même sans créneau.
        programmes: programs
          .filter((program) => program.terminatedAt === null)
          .map((program) => ({ id: program.id, name: program.name, start: program.startDate, end: program.endDate })),
        executionProjections,
        deletedOccurrences,
      }),
    [monday, routines, occurrences, executions, linked, projections, isPlannable, loadedAt, executionProjections, programs, deletedOccurrences],
  );

  const today = todayLocal();
  const todayIndex = week.days.indexOf(today);
  const weeks = weeksOfMonth(monthOfWeek(monday));
  const blockWidth = weeks.length * WEEK_WIDTH + (weeks.length - 1) * WEEK_GAP;

  /** Case vide : ajout d'un créneau ; jour où la routine a déjà un créneau (séance désactivée d'un parcours) : ce créneau. */
  const touchEmpty = (routine: Routine, day: LocalDate) => {
    const existing = week.occurrencesOf(routine.id, day);
    if (existing.length > 0) {
      openOccurrence(existing[0]!);
      return;
    }
    router.push({ pathname: "/planning", params: { addTo: routine.id, date: day } });
  };
  /** Case pleine : modification de tout le créneau ; un créneau commencé ne s'ouvre pas (D-536). */
  const openOccurrence = (occurrence: Occurrence | undefined) => {
    if (occurrence === undefined || occurrence.started) return;
    router.push({ pathname: "/planning", params: { routineId: occurrence.routineId, occurrenceKey: occurrence.key } });
  };
  const planFrom = () => (monday > today ? monday : today);
  // Recette du 21/11/2026 (constat a — Hermann : « Glisser horizontalement sur le tableau change de semaine : vers la gauche
  // pour la semaine suivante, vers la droite pour la précédente ») : geste natif `Pan`, horizontal seulement (le défilement
  // vertical du tableau reste libre).
  const swipe = useWeekSwipe(shiftWeek);
  /** Durée estimée de la Séance d'une ligne, sous son nom (recette du 21/11/2026, constat b). */
  const durationOf = (row: PlanRow) => {
    const projection = row.sessionId === undefined || row.sessionId === null ? undefined : projections.get(row.sessionId);
    return projection === undefined ? "" : sessionsDurationLabel([projection]);
  };

  // Lignes verticales sur toute la hauteur de la ligne (qui suit son contenu).
  const renderGridLines = () => (
    <>
      {todayIndex >= 0 ? <View style={[styles.todayColumn, styles.fullHeight, { left: LEFT + NAMES_WIDTH + todayIndex * COLUMN }]} pointerEvents="none" /> : null}
      {week.days.map((day, index) => (
        <View key={day} style={[styles.dayLine, styles.fullHeight, { left: LEFT + NAMES_WIDTH + index * COLUMN - LINE / 2 }]} pointerEvents="none" />
      ))}
    </>
  );

  const renderRow = (row: PlanRow) => {
    const height = planRowHeight(row);
    if (row.kind === "TITLE") {
      return (
        <View key={row.key} style={{ height }} testID={`plan-row-${row.key}`}>
          {todayIndex >= 0 ? <View style={[styles.todayColumn, { left: LEFT + NAMES_WIDTH + todayIndex * COLUMN, height }]} pointerEvents="none" /> : null}
          {/* Lien noir fin : du bas du Ⓟ jusqu'au bas de la dernière séance (Figma `12983:130`). */}
          <View style={[styles.parcoursLink, { top: 21, height: height - 21 }]} testID={`plan-row-${row.key}-link`} />
          <View style={styles.titleLine}>
            <ParcoursBadge placement="alone" stroke={1.333} testID={`plan-row-${row.key}-badge`} />
            <Text style={styles.parcoursName} numberOfLines={1} testID={`plan-row-${row.key}-name`}>
              {row.title}
            </Text>
          </View>
        </View>
      );
    }
    const session = row.kind === "SESSION";
    const routine = row.routine;
    const duration = durationOf(row);
    return (
      <View key={row.key} style={{ minHeight: height }} testID={`plan-row-${row.key}`}>
        {renderGridLines()}
        {/* Séance d'un parcours : filet court au-dessus (depuis l'alignement des noms) et lien du Ⓟ. */}
        {session ? <View style={[styles.rowLine, styles.shortLine, { top: 0 }]} /> : null}
        {session ? <View style={[styles.parcoursLink, styles.fullHeight]} testID={`plan-row-${row.key}-link`} /> : null}
        {/* Recette du 22/11/2026 (c33-plan-duree et constat e — Hermann : « Mettre la durée à la suite du nom, séparée par un
            point centré verticalement » ; « le nom de la séance + la durée doivent rester sur deux lignes ») : un seul texte de
            deux lignes au plus. [Nom sur deux lignes, durée en dessous (21/11/2026, constats b et c) — remplacé.] */}
        <View style={[styles.rowNameBlock, session ? styles.sessionNameBlock : null]}>
          <Text style={styles.rowName} numberOfLines={2} testID={`plan-row-${row.key}-name`}>
            {row.title}
            {duration !== "" ? (
              <Text style={styles.rowDuration} testID={`plan-row-${row.key}-duration`}>
                {` · ${duration}`}
              </Text>
            ) : null}
          </Text>
        </View>
        {week.days.map((day, index) => {
          const cells = row.cells[index] ?? [];
          const left = LEFT + NAMES_WIDTH + index * COLUMN;
          if (cells.length === 0) {
            // Ligne « Hors planification » : aucune routine, une case vide ne s'ouvre pas.
            if (routine === undefined) return null;
            const touchKey = `${routine.id}|${day}`;
            const highlighted = touched === touchKey;
            return (
              <Pressable
                key={day}
                onPressIn={() => setTouched(touchKey)}
                onPressOut={() => setTouched((current) => (current === touchKey ? null : current))}
                onPress={() => touchEmpty(routine, day)}
                accessibilityRole="button"
                accessibilityLabel={fillTemplate(t.plan.addAccessibility, { routine: routine.name, day: formatDayTitle(day) })}
                style={[styles.emptyCell, styles.fullHeight, { left }]}
                testID={`plan-cell-${row.key}-${day}-empty`}
              >
                {highlighted ? (
                  <View style={styles.touchedCell} testID={`plan-cell-${row.key}-${day}-touched`}>
                    <Text style={styles.touchedPlus}>+</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }
          return (
            <View key={day} style={[styles.cellColumn, styles.fullHeight, { left }]} pointerEvents="box-none">
              {cells.map((cell) => {
                const tint = TINTS[cell.tint];
                return (
                  <Pressable
                    key={cell.key}
                    // D-568 : comme à l'Agenda, une occurrence « Supprimée » ne s'ouvre pas.
                    onPress={() => openOccurrence(cell.card.occurrence)}
                    disabled={cell.card.deleted === true}
                    accessibilityRole="button"
                    accessibilityLabel={
                      cell.unplanned === true
                        ? `${cell.card.title}, ${cell.label}, ${t.plan.unplanned}`
                        : cell.card.deleted === true
                          ? `${cell.card.title}, ${cell.label}, ${t.calendar.status.deleted}`
                          : `${cell.card.title}, ${cell.label}`
                    }
                    style={[styles.cell, { backgroundColor: tint.background }]}
                    testID={`plan-cell-${cell.key}`}
                  >
                    <Text style={[styles.cellLabel, { color: tint.text }]} numberOfLines={1} allowFontScaling={false} testID={`plan-cell-${cell.key}-label`}>
                      {cell.label}
                      {/* Recette du 22/11/2026 (constat a) : exécution hors planification — petite astérisque. */}
                      {cell.unplanned === true ? <Text style={styles.cellMark} testID={`plan-cell-${cell.key}-unplanned`}>*</Text> : null}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        {/* Filet pleine largeur sous une routine ; le parcours se ferme par un filet pleine largeur sous sa dernière séance. */}
        {!session || row.last === true ? <View style={[styles.rowLine, styles.fullLine, { bottom: 0 }]} /> : null}
      </View>
    );
  };

  return (
    <TabbedScreen
      title={t.calendar.title}
      palette={CALENDAR_PALETTE}
      tabs={calendarTabs("plan", onChangeView)}
      context={{
        kind: "custom",
        layout: "centered",
        content: (
          // DSF Plan § 2 (Figma `12983:19`) : ligne 1, « Aujourd'hui » et le mois centré sur le bloc des semaines, sans filtre ;
          // ligne 2, flèches de semaine, semaines du mois en cadres de 51 × 46, Planifier. Positions de l'Agenda (D-538, D-555).
          <View style={styles.context} pointerEvents="box-none" testID="plan-context">
            <Pressable
              onPress={() => changeWeek(mondayOf(today))}
              accessibilityRole="button"
              accessibilityLabel={t.calendar.today}
              style={styles.todayButton}
              testID="plan-today"
            >
              <TodayIcon day={parseLocalDate(today).getDate()} current={monday === mondayOf(today)} testID="plan-today-icon" />
            </Pressable>
            <View style={styles.monthNavigation} pointerEvents="box-none" testID="plan-month-navigation">
              <Pressable onPress={() => changeWeek(firstWeekOfShiftedMonth(monday, -1))} accessibilityRole="button" accessibilityLabel={t.calendar.previousMonth} hitSlop={6} testID="plan-previous-month">
                <DoubleChevron source={require("../../../assets/icons/icon-precedent.svg")} />
              </Pressable>
              <Text style={styles.monthLabel} accessibilityRole="header" maxFontSizeMultiplier={1.2} numberOfLines={1} testID="plan-month-label">
                {formatAgendaMonth(monthOfWeek(monday))}
              </Text>
              <Pressable onPress={() => changeWeek(firstWeekOfShiftedMonth(monday, 1))} accessibilityRole="button" accessibilityLabel={t.calendar.nextMonth} hitSlop={6} testID="plan-next-month">
                <DoubleChevron source={require("../../../assets/icons/icon-suivant.svg")} />
              </Pressable>
            </View>
            <Pressable onPress={() => changeWeek(addDays(monday, -7))} accessibilityRole="button" accessibilityLabel={t.calendar.previousWeek} hitSlop={6} style={styles.previousWeek} testID="plan-previous-week">
              <Image source={require("../../../assets/icons/icon-precedent.svg")} style={styles.chevron} accessible={false} />
            </Pressable>
            <View style={[styles.weeks, { left: 160 - blockWidth / 2, width: blockWidth }]} accessibilityRole="tablist" testID="plan-weeks">
              {weeks.map((weekMonday) => {
                const selected = weekMonday === monday;
                return (
                  <Pressable
                    key={weekMonday}
                    onPress={() => changeWeek(weekMonday)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={fillTemplate(t.plan.weekAccessibility, { number: String(isoWeekNumber(weekMonday)), days: weekDaysLabel(weekMonday) })}
                    style={[styles.weekCell, selected ? styles.weekCellSelected : null]}
                    testID={`plan-week-${weekMonday}`}
                  >
                    <Text style={[styles.weekNumber, selected ? styles.weekTextSelected : null]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                      {`S${isoWeekNumber(weekMonday)}`}
                    </Text>
                    <Text style={[styles.weekDays, selected ? styles.weekTextSelected : null]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                      {weekDaysLabel(weekMonday)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => changeWeek(addDays(monday, 7))} accessibilityRole="button" accessibilityLabel={t.calendar.nextWeek} hitSlop={6} style={styles.nextWeek} testID="plan-next-week">
              <Image source={require("../../../assets/icons/icon-suivant.svg")} style={styles.chevron} accessible={false} />
            </Pressable>
            <View style={styles.planSlot}>
              <CommandCircle label={t.calendar.plan} icon="plan" onPress={() => router.push({ pathname: "/planning", params: { date: planFrom() } })} testID="plan-plan" />
            </View>
          </View>
        ),
      }}
    >
      <GestureHandlerRootView style={styles.body}>
      <GestureDetector gesture={swipe}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: navigationBarTotalHeight() + insets.bottom + spacing[24] }}
        showsVerticalScrollIndicator={false}
        // Recette du 23/11/2026 (Hermann : « Plan : la ligne des dates du tableau doit rester figée, et les lignes du tableau
        // doivent défiler dessous lorsqu'on fait défiler l'écran verticalement. Le défilement vertical de l'écran ne doit être
        // activé que lorsque la taille du tableau le justifie. ») : en-tête collant natif du `ScrollView` (premier enfant, part
        // fondue de la bande comprise, pour qu'il reste à sa place dès le premier point de défilement) ; aucun rebond quand le
        // tableau tient dans l'écran (iOS ; un `ScrollView` Android ne défile pas un contenu plus court que lui).
        // [Lignes défilant derrière la part fondue de la bande au-dessus des dates (22/11/2026) — remplacé pour le Plan.]
        stickyHeaderIndices={[0]}
        alwaysBounceVertical={false}
        testID="plan-grid"
      >
        <View style={styles.headerZone} testID="plan-header-zone">
          {/* En-tête des jours : jour abrégé et numéro ; jour courant sur fond bleu. */}
          <View style={styles.header} testID="plan-header">
            {week.days.map((day, index) => {
              const current = day === today;
              return (
                <View key={day} style={[styles.headerDay, { left: LEFT + NAMES_WIDTH + index * COLUMN + 2 }, current ? styles.headerToday : null]} testID={`plan-day-${day}`}>
                  <Text style={[styles.headerShort, current ? styles.headerTextToday : null]}>{t.plan.weekdays[index]}</Text>
                  <Text style={[styles.headerNumber, current ? styles.headerTextToday : null]}>{parseLocalDate(day).getDate()}</Text>
                </View>
              );
            })}
            <View style={[styles.rowLine, styles.fullLine, { bottom: 0 }]} />
          </View>
        </View>
        {loadFailed ? (
          <Text style={styles.message} testID="plan-load-error">
            {t.calendar.loadError}
          </Text>
        ) : null}
        {!loadFailed && loadedMonday === monday && week.groups.length === 0 ? (
          <Text style={styles.message} testID="plan-week-empty">
            {t.calendar.emptyWeek}
          </Text>
        ) : null}
        {week.groups.map((group) => (
          <View key={group.key} testID={`plan-group-${group.key}`}>
            <View style={[styles.band, group.programme !== null ? styles.bandProgramme : styles.bandNone]} testID={`plan-group-${group.key}-band`}>
              {todayIndex >= 0 ? <View style={[styles.todayColumn, { left: LEFT + NAMES_WIDTH + todayIndex * COLUMN, height: BAND_HEIGHT }]} pointerEvents="none" /> : null}
              <Text style={[styles.bandLabel, group.programme !== null ? styles.bandLabelProgramme : styles.bandLabelNone]} numberOfLines={1} testID={`plan-group-${group.key}-label`}>
                {group.programme !== null ? fillTemplate(t.plan.programme, { name: group.programme.name }) : group.unplanned === true ? t.plan.unplanned : t.plan.noProgramme}
              </Text>
              {group.unplanned === true ? null : (
              <Pressable
                onPress={() => router.push({ pathname: "/planning", params: { date: planFrom(), ...(group.programme !== null ? { programId: group.programme.id } : {}) } })}
                accessibilityRole="button"
                hitSlop={8}
                testID={`plan-group-${group.key}-add`}
              >
                <Text style={styles.addRoutine}>{t.plan.addRoutine}</Text>
              </Pressable>
              )}
            </View>
            {group.rows.map((row) => renderRow(row))}
          </View>
        ))}
        {week.groups.length > 0 ? (
          <>
            {/* DSF Plan § 6 : double filet, ligne Total sur fond bleu clair, en gras. */}
            <View style={[styles.totalSeparator]} />
            <View style={styles.total} testID="plan-total">
              {todayIndex >= 0 ? <View style={[styles.todayColumn, { left: LEFT + NAMES_WIDTH + todayIndex * COLUMN, height: 25.5 }]} pointerEvents="none" /> : null}
              {week.days.map((day, index) => (
                <View key={day} style={[styles.dayLine, { left: LEFT + NAMES_WIDTH + index * COLUMN - LINE / 2, height: 25.5 }]} pointerEvents="none" />
              ))}
              <Text style={styles.totalWeek} testID="plan-total-week">
                {fillTemplate(t.plan.total, { duration: formatPlanTotal(week.weekTotal) })}
              </Text>
              {week.dayTotals.map((value, index) => (
                <Text key={week.days[index]} style={[styles.totalDay, { left: LEFT + NAMES_WIDTH + index * COLUMN + 2 }]} testID={`plan-total-${week.days[index]}`}>
                  {formatPlanTotal(value)}
                </Text>
              ))}
              <View style={[styles.rowLine, styles.fullLine, { bottom: 0 }]} />
            </View>
            {/* Légende des quatre états. */}
            <View style={styles.legend} testID="plan-legend">
              {LEGEND.map((tint) => (
                <View key={tint} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: TINTS[tint].background, borderColor: TINTS[tint].border }]} />
                  <Text style={styles.legendLabel}>{t.plan.legend[tint]}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      </GestureDetector>
      </GestureHandlerRootView>
      <PlanningNoticeHost message={planningNotice} onDismiss={() => setPlanningNotice(null)} testID="plan-notice" />
    </TabbedScreen>
  );
}

const styles = StyleSheet.create({
  // Zone de contexte : mêmes positions que l'Agenda (D-538, D-555) ; contenu relatif à la marge de 16 de la bande.
  context: { height: 115 },
  todayButton: { position: "absolute", left: -5, top: 6, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  // Mois centré sur le bloc des semaines (x = 176 de l'écran, 160 du contenu).
  monthNavigation: { position: "absolute", left: 0, width: 320, top: 11, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  monthLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary, textAlign: "center", flexShrink: 1 },
  chevron: { width: 24, height: 24 },
  previousWeek: { position: "absolute", left: -5.75, top: 62 },
  nextWeek: { position: "absolute", left: 302, top: 62 },
  planSlot: { position: "absolute", left: 336, top: 57 },
  weeks: { position: "absolute", top: 51, height: 46, flexDirection: "row", gap: WEEK_GAP },
  weekCell: { width: WEEK_WIDTH, height: 46, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.3)", alignItems: "center", overflow: "hidden" },
  weekCellSelected: { backgroundColor: colors.selection },
  weekNumber: { position: "absolute", top: 8, left: 0, right: 0, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, lineHeight: 18, color: colors.textLabel, textAlign: "center" },
  weekDays: { position: "absolute", top: 26, left: 0, right: 0, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 10, lineHeight: 12, color: colors.textLabel, opacity: 0.75, textAlign: "center" },
  weekTextSelected: { color: colors.background },
  list: { flex: 1 },
  // Recette du 22/11/2026 (Hermann : « la zone de contexte des écrans Agenda et Plan n'ont PAS le dégressif transparent ») : le
  // tableau remonte sous la part fondue de `ContextBand` et y défile, comme le Journal (contrat de la bande). [Tableau sous la
  // bande — remplacé.]
  body: { flex: 1, marginTop: -CONTEXT_BAND_FADE_HEIGHT },
  // En-tête des jours (Figma `12983:54` et suivants) : 40 de haut, à 8 sous la bande.
  // Zone collante (recette du 23/11/2026, constat e) : part fondue de la bande et 8 au-dessus des dates, fond de l'écran opaque
  // pour que les lignes passent dessous.
  headerZone: { paddingTop: CONTEXT_BAND_FADE_HEIGHT + spacing[8], backgroundColor: colors.background },
  header: { height: 40 },
  headerDay: { position: "absolute", top: 0, width: CELL_WIDTH, height: 38, borderRadius: 9, alignItems: "center", paddingTop: 4 },
  headerToday: { backgroundColor: TODAY_BADGE },
  headerShort: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 10, lineHeight: 12, color: "#595E66" },
  headerNumber: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, lineHeight: 16, marginTop: 1, color: "#141414" },
  headerTextToday: { color: "#FFFFFF" },
  todayColumn: { position: "absolute", top: 0, width: COLUMN, backgroundColor: TODAY_COLUMN },
  dayLine: { position: "absolute", top: 0, width: LINE, backgroundColor: DAY_SEPARATOR },
  rowLine: { position: "absolute", height: LINE, backgroundColor: SEPARATOR },
  fullLine: { left: LEFT, right: LEFT },
  shortLine: { left: 30, right: LEFT },
  band: { height: BAND_HEIGHT, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: LEFT },
  bandProgramme: { backgroundColor: "#EFE8FF" },
  bandNone: { backgroundColor: "#F3F4F9" },
  bandLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, flexShrink: 1 },
  bandLabelProgramme: { color: "#5C40B8" },
  bandLabelNone: { color: "#6B7080" },
  addRoutine: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 11, color: colors.primary },
  // Ligne « Ⓟ nom » : Ⓟ de 16 à x = 8, nom à x = 30 (Figma `12983:110`, `12983:79`).
  titleLine: { position: "absolute", left: LEFT, top: 5, right: LEFT, flexDirection: "row", alignItems: "center", gap: 6 },
  parcoursName: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, color: "#141414", flexShrink: 1 },
  parcoursLink: { position: "absolute", left: 15.5, width: 1, backgroundColor: "#000000" },
  fullHeight: { top: 0, bottom: 0 },
  // Nom et durée dans le flux : la ligne prend la hauteur du nom sur deux lignes et de la durée.
  rowNameBlock: { marginLeft: LEFT, width: 116, paddingVertical: 6, justifyContent: "center", flexGrow: 1 },
  sessionNameBlock: { marginLeft: 30, width: 94 },
  rowName: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 10, lineHeight: 12, color: "#141414" },
  // Durée à la suite du nom (recette du 22/11/2026) : texte imbriqué, sans marge ni hauteur de ligne propres.
  rowDuration: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 9, color: "#595E66" },
  emptyCell: { position: "absolute", width: COLUMN, alignItems: "center", justifyContent: "center" },
  touchedCell: { width: CELL_WIDTH, height: CELL_HEIGHT, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: colors.primary, backgroundColor: "rgba(5, 8, 229, 0.06)", alignItems: "center", justifyContent: "center" },
  touchedPlus: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 13, lineHeight: 16, color: colors.primary },
  cellColumn: { position: "absolute", width: COLUMN, alignItems: "center", justifyContent: "center", gap: CELL_GAP },
  cell: { width: CELL_WIDTH, height: CELL_HEIGHT, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cellLabel: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 9 },
  // Recette du 22/11/2026 (constat a) : « une petite astérisque » à la suite de l'heure. [Taille : choix de Claude.]
  cellMark: { fontSize: 7 },
  totalSeparator: { height: 2.5, marginHorizontal: LEFT, borderTopWidth: LINE, borderBottomWidth: LINE, borderColor: SEPARATOR },
  total: { height: 25.5, backgroundColor: colors.catalogueSessionsContext, justifyContent: "center" },
  totalWeek: { position: "absolute", left: LEFT, top: 6, fontFamily: "Inter_700Bold", fontWeight: "700", fontSize: 10, color: "#333333" },
  totalDay: { position: "absolute", top: 6.5, width: CELL_WIDTH, textAlign: "center", fontFamily: "Inter_700Bold", fontWeight: "700", fontSize: 9, color: "#333333" },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6, paddingHorizontal: LEFT, marginTop: 18 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  legendLabel: { ...type.supporting, lineHeight: undefined, color: "#595E66" },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
});
