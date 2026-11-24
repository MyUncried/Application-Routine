import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";

import { addDays, formatLocalDate, mondayOf, parseLocalDate, weekdayOf, type LocalDate, type Routine } from "@/domain/planning/Routine";
import type { AgendaExecution, OccurrenceExecution } from "@/domain/planning/occurrenceExecutions";
import type { Occurrence } from "@/domain/planning/occurrences";
import { takePlanningNotice } from "@/features/planning/planningNotice";
import { PlanningNoticeHost } from "@/features/planning/PlanningNoticeHost";
import { buildAgendaGroups, executedProjections, mergeAgendaExecutions, type AgendaCard, type AgendaGroup } from "@/features/planning/agendaCards";
import { routineTitle } from "@/features/planning/journal";
import { ParcoursBadge } from "@/features/planning/ParcoursBadge";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { formatAgendaMonth, zonesLine } from "@/features/planning/agendaFormat";
import { monthOfWeek } from "@/features/planning/planWeek";
import { AGENDA_BAR_WIDTH, AGENDA_PARCOURS_FRAME_OFFSET, AGENDA_ROW_HEIGHT, agendaBarColor, RoutineAgendaCard } from "@/features/planning/RoutineAgendaCard";
import { executionParams } from "@/features/execution/executionChain";
import { useBodyZonesReferential } from "@/features/activities/useBodyZonesReferential";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { CatalogueCategoryRef, SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { CALENDAR_PALETTE, calendarTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { TodayIcon } from "@/features/planning/TodayIcon";
import { requestPlanningSheet } from "@/features/planning/planningSheetRelay";
import { agendaRoutineFilter, setAgendaRoutineFilter } from "@/features/planning/agendaRoutineFilter";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { strings } from "@/shared/i18n";
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

/**
 * Suppression depuis l'Agenda : créneau entier (Routine à une Séance, D-537) ou Séance seule d'un parcours (D-553, arbitrage 9 ;
 * `sessionIndex` : rang dans la liste des séances de l'occurrence).
 */
type DeleteCandidate = { readonly routine: Routine; readonly occurrenceKey: string; readonly sessionIndex: number | null };

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
export function DoubleChevron({ source }: { readonly source: number }) {
  return (
    <View style={styles.doubleChevron}>
      <Image source={source} style={[styles.chevron, styles.chevronFirst]} accessible={false} />
      <Image source={source} style={[styles.chevron, styles.chevronSecond]} accessible={false} />
    </View>
  );
}

/** Liste continue de l'Agenda (constat C, 20/11/2026) : semaines chargées d'abord, ajoutées en fin de défilement, au plus. [Choix technique.] */
// Recette du 21/11/2026 (constat e — « l'Agenda met environ 2 s à s'afficher ») : deux semaines au premier affichage, les suivantes
// en fin de défilement. [Quatre semaines — remplacé ; choix technique.]
const AGENDA_WEEKS_INITIAL = 2;
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
  const [planningNotice, setPlanningNotice] = useState<string | null>(null);
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
  // D-568 / RM-276 : créneaux entièrement supprimés avec trace (cartes grises « Supprimée »).
  const [deletedOccurrences, setDeletedOccurrences] = useState<readonly Occurrence[]>([]);
  const [executions, setExecutions] = useState<readonly OccurrenceExecution[]>([]);
  // D-553 : toutes les Exécutions (Séances exécutées et « Hors planification »).
  const [allExecutions, setAllExecutions] = useState<readonly AgendaExecution[]>([]);
  const [snapshots, setSnapshots] = useState<ReadonlyMap<string, SessionSnapshot>>(new Map());
  // Instant du dernier chargement : sépare les occurrences passées (rouge) des occurrences à venir (bleu).
  const [loadedAt, setLoadedAt] = useState(0);
  // Recette du 20/11/2026 (Hermann : « la liste apparaît avec un temps de décalage. Elle affiche d'abord "Aucune séance
  // planifiée cette semaine", puis affiche la liste ») : début de la fenêtre effectivement chargée ; le message « semaine
  // vide » n'apparaît qu'une fois la semaine affichée chargée.
  const [loadedStart, setLoadedStart] = useState<LocalDate | null>(null);
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
  /**
   * Recette du 22/11/2026 (c33-agenda-ouverture, c33-agenda-catalogue — Hermann : « L'agenda sélectionne Aujourd'hui dans la zone
   * de contexte, mais la liste est positionnée au début de la semaine ») : jour dont la section (ou la suivante s'il est vide)
   * passe en tête de liste dès qu'elle est mise en page (RM-046), à l'ouverture comme après un changement de semaine ou de mois.
   * `null` : rien à placer.
   */
  const [pendingScrollDay, setPendingScrollDay] = useState<LocalDate | null>(() => initialDay ?? todayLocal());
  /** Position (contenu) de la section à placer, mesurée à sa mise en page ; le défilement se fait dans un effet. */
  const [pendingScrollY, setPendingScrollY] = useState<{ readonly y: number } | null>(null);
  useEffect(() => {
    if (pendingScrollY === null) return;
    programmaticScroll.current = true;
    scrollRef.current?.scrollTo({ y: Math.max(0, pendingScrollY.y - CONTEXT_BAND_FADE_HEIGHT), animated: false });
  }, [pendingScrollY]);
  const requestId = useRef(0);
  // Recette du 17/11/2026 (f3) : la dernière section doit pouvoir monter en tête ; la réserve basse suit sa hauteur.
  const [listHeight, setListHeight] = useState(0);
  // Hauteur de chaque section (recette du 23/11/2026) : la réserve basse suit la VRAIE dernière section. [Hauteur de la section
  // dernière au moment de sa mise en page — remplacé : périmée quand des semaines s'ajoutaient, elle réduisait la réserve et la
  // liste ne pouvait plus monter le jour choisi en tête.]
  const [sectionHeights, setSectionHeights] = useState<ReadonlyMap<LocalDate, number>>(new Map());

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
      planning.agendaData(window.start, addDays(window.start, window.weeks * 7 - 1)).then(
        ({ routines: list, occurrences: weekItems, executions: linked, allExecutions: everything, snapshots: executed, deletedOccurrences: traces }) => {
          if (id !== requestId.current) return;
          setRoutines(list);
          setOccurrences(weekItems);
          setDeletedOccurrences(traces ?? []);
          setExecutions(linked);
          setAllExecutions(everything);
          setSnapshots(executed);
          setLoadedAt(Date.now());
          setLoadedStart(window.start);
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
      // d3 (23/11) : message laissé par une feuille qui vient de se fermer.
      const pendingNotice = takePlanningNotice();
      if (pendingNotice !== null) setPlanningNotice(pendingNotice);
      return () => {
        cancelPending();
        setRevealed(null);
      };
    }, [reloadCatalogue, cancelPending, load]),
  );

  // Recette du 22/11/2026 (constat b) : Séance telle qu'exécutée (instantané), Catégories du référentiel déjà chargé.
  const executionProjections = useMemo(() => {
    const categories = new Map<string, CatalogueCategoryRef>();
    for (const projection of projections.values()) for (const category of projection.categories) categories.set(category.id, category);
    return executedProjections(snapshots, categories);
  }, [snapshots, projections]);
  const routinesById = useMemo(() => new Map(routines.map((routine) => [routine.id, routine])), [routines]);
  // Contre-recette du 23/11/2026 (constat i) : routines à plusieurs Séances, parcours à chaque créneau.
  const parcoursRoutines = useMemo(() => new Set(routines.filter((routine) => routine.entries.length > 1).map((routine) => routine.id)), [routines]);
  // D-560 (22/11/2026), développé le 23/11/2026 : routines sans répétition (créneau unique), créneaux marqués hors répétition.
  const singleSlotRoutines = useMemo(() => new Set(routines.filter((routine) => routine.repetition === null).map((routine) => routine.id)), [routines]);

  /**
   * D-553 (21/11/2026) : une carte par Séance (planifiée, exécutée ou hors planification), groupes de parcours sous le jour du
   * créneau (`buildAgendaGroups`). Statut par Séance : exécutée (Complétée, Partielle, Arrêtée), sinon à venir (bleu), manquée
   * (rouge) ou expirée (D-540). [Une carte par occurrence de routine (D-534) — remplacé.]
   */
  const groupsByDay = useMemo(
    () =>
      buildAgendaGroups({
        occurrences,
        executions: mergeAgendaExecutions(allExecutions, executions),
        projections,
        isPlannable,
        routineFilter,
        now: loadedAt,
        executionProjections,
        parcoursRoutines,
        deletedOccurrences,
        singleSlotRoutines,
      }),
    [occurrences, allExecutions, executions, projections, isPlannable, routineFilter, loadedAt, executionProjections, parcoursRoutines, deletedOccurrences, singleSlotRoutines],
  );

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(monday, index)), [monday]);
  /** Jours de la liste continue (constat C). */
  const listDays = useMemo(() => Array.from({ length: range.weeks * 7 }, (_, index) => addDays(range.start, index)), [range]);

  const bodyZones = useBodyZonesReferential();
  const zoneName = useMemo(() => new Map(bodyZones.map((zone) => [zone.id, zone.name])), [bodyZones]);
  const detailOf = (card: AgendaCard) =>
    zonesLine((card.projection?.bodyZoneIds ?? []).map((id) => zoneName.get(id)).filter((value): value is string => value !== undefined));
  /** Ligne « Ⓟ » : nom de la Routine (généré ou personnalisé), jamais celui des Séances. */
  const parcoursNameOf = (group: AgendaGroup) => {
    const routine = group.routineId === null ? undefined : routinesById.get(group.routineId);
    if (routine === undefined) return "";
    const sessions = routine.entries.map((entry) => projections.get(entry.sessionId)).filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
    return routineTitle(routine, sessions);
  };

  const changeWeek = (next: LocalDate, day: LocalDate) => {
    const window = { start: next, weeks: AGENDA_WEEKS_INITIAL };
    rangeRef.current = window;
    setMonday(next);
    setSelectedDay(day);
    setRange(window);
    setExpanded(new Set());
    setRevealed(null);
    // Recette du 23/11/2026 (c35-agenda-jour — Hermann : « Appuyer sur Aujourd'hui sélectionne toujours le bon jour dans la zone
    // de contexte, mais pas dans la liste ») : positions des sections conservées (une section qui bouge les remet à jour) ; le
    // jour choisi reste tenu en tête jusqu'au défilement de l'utilisateur. [Positions effacées à chaque changement de semaine
    // — remplacé : une semaine inchangée ne les remesurait pas, et la liste restait figée.]
    setPendingScrollDay(day);
    const known = Array.from({ length: window.weeks * 7 }, (_, index) => addDays(next, index)).find(
      (candidate) => candidate >= day && (groupsByDay.get(candidate)?.length ?? 0) > 0 && sectionOffsets.current.has(candidate),
    );
    if (known !== undefined) setPendingScrollY({ y: sectionOffsets.current.get(known)! });
    else scrollRef.current?.scrollTo({ y: 0, animated: false });
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
    const target = listDays
      .filter((candidate) => candidate >= day && (groupsByDay.get(candidate)?.length ?? 0) > 0)
      .find((candidate) => sectionOffsets.current.has(candidate));
    const y = target === undefined ? undefined : sectionOffsets.current.get(target);
    // Recette du 23/11/2026 : le jour touché reste tenu en tête si la liste se remet en page (chargement, semaines ajoutées).
    setPendingScrollDay(day);
    if (y !== undefined) {
      programmaticScroll.current = true;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - CONTEXT_BAND_FADE_HEIGHT), animated: true });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Recette du 23/11/2026 (plantage de 00h15 pendant le test de la liste) : seul le défilement de l'utilisateur ajoute des
    // semaines. [Aussi le défilement automatique — remplacé : le jour tenu en tête, replacé à chaque mise en page, pouvait
    // enchaîner les ajouts jusqu'à 52 semaines.]
    if (programmaticScroll.current) return;
    // Moins d'un écran de contenu sous la vue (réserve basse exclue) : semaines suivantes.
    if (contentOffset.y + 2 * layoutMeasurement.height >= contentSize.height - listPaddingBottom) extendRange();
    // Haut visible de la liste : sous la part fondue de la bande (recette du 22/11/2026).
    const y = contentOffset.y + CONTEXT_BAND_FADE_HEIGHT + spacing[8];
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
  const openOccurrence = (card: AgendaCard) => {
    setRevealed(null);
    // D-553 (arbitrage 9) : le cadre gauche d'une Séance de parcours ouvre la modification de tout le créneau ; un créneau
    // commencé ne se modifie pas (D-536) ; une Exécution hors planification n'a pas de créneau.
    const occurrence = card.occurrence;
    // D-568 : une carte « Supprimée » ne s'ouvre pas ; elle se rétablit au glisser.
    if (occurrence === undefined || occurrence.started || card.deleted === true) return;
    router.push({ pathname: "/planning", params: { routineId: occurrence.routineId, occurrenceKey: occurrence.key } });
  };

  const duplicate = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { duplicateOf: routineId } });
  };

  /**
   * D-568 : « Rétablir » (glisser d'une carte « Supprimée »). Fonction appelée depuis les cartes construites au rendu : elle recharge
   * la fenêtre de l'état `range` (miroir de `rangeRef`) sans lire de référence (règle `react-hooks/refs`).
   */
  const restore = (routineId: string, occurrenceKey: string, sessionIndex: number | null) => {
    setActionFailed(false);
    planning.restoreOccurrence(routineId, occurrenceKey, sessionIndex).then(
      () => load(range),
      (error: unknown) => {
        console.error("L'action de planification a échoué.", error);
        setActionFailed(true);
        load(range);
      },
    );
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

  const dotColor = (projection: SessionCatalogueProjection | undefined) => projection?.categories[0]?.color ?? colors.selection;
  /**
   * Recette du 22/11/2026 (c33-agenda-mois — Hermann : « Double flèches : doit être la semaine du premier jour du mois,
   * sélectionné ») : semaine qui contient le 1er du mois précédent ou suivant celui affiché, le 1er sélectionné.
   * [Première semaine du mois voisin, le 1er s'il est dans cette semaine, sinon son lundi (21/11/2026) — remplacé.]
   * Libellé : le mois atteint par les doubles flèches tant que cette semaine reste affichée, même si elle compte plus de jours
   * du mois précédent (1er du mois un vendredi, un samedi ou un dimanche) ; sinon la règle q23-mois. Sans cela, les doubles
   * flèches resteraient bloquées sur la même semaine. [Interprétation de Claude, à valider.]
   */
  const [monthTarget, setMonthTarget] = useState<{ readonly week: LocalDate; readonly month: LocalDate } | null>(null);
  const shownMonth = monthTarget !== null && monthTarget.week === monday ? monthTarget.month : monthOfWeek(monday);
  const changeMonth = (shift: -1 | 1) => {
    const base = parseLocalDate(shownMonth);
    const target = new Date(base.getFullYear(), base.getMonth() + shift, 1);
    const first = formatLocalDate(target);
    const week = mondayOf(first);
    changeWeek(week, first);
    setMonthTarget({ week, month: first });
  };

  /**
   * « Démarrer » (D-534) : première séance de la liste ordonnée de l'occurrence (contrat PRE-10 `/execution?sessionId=`) ;
   * plusieurs séances : la chaîne et le rang accompagnent la route, les suivantes s'enchaînent à la fin de chacune.
   * D-553 (arbitrage 8) : « Rattraper » sur une Séance non exécutée d'un créneau commencé lance cette Séance seule, rattachée à
   * son rang dans l'occurrence.
   */
  const start = (card: AgendaCard) => {
    setRevealed(null);
    const occurrence = card.occurrence;
    if (occurrence === undefined || card.sessionId === null) return;
    const origin = { routineId: occurrence.routineId, occurrenceKey: occurrence.key };
    if (card.action === "CATCH_UP_ONE") {
      router.push({ pathname: "/execution", params: executionParams([card.sessionId], 1, { ...origin, rank: card.position ?? 1 }) });
      return;
    }
    // Recette du 19/11/2026 au soir : l'Exécution est rattachée à l'occurrence (routine, date/heure d'origine, rang).
    const chain = occurrence.contents.map((content) => content.sessionId).filter((sessionId) => isPlannable(sessionId) && projections.has(sessionId));
    if (chain.length === 0) return;
    router.push({ pathname: "/execution", params: executionParams(chain, 1, origin) });
  };

  const renderCard = (card: AgendaCard, inParcours: boolean) => {
    const isExpanded = expanded.has(card.key);
    const occurrence = card.occurrence;
    const routine = occurrence === undefined ? undefined : routinesById.get(occurrence.routineId);
    const toggle = () =>
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(card.key)) next.delete(card.key);
        else next.add(card.key);
        return next;
      });
    // D-537 : un créneau commencé n'est pas supprimé ; D-553 (arbitrage 9) : une Séance de parcours non exécutée se supprime
    // seule, même dans un créneau commencé ; une Séance exécutée ne se supprime pas. Hors planification : aucune action glissée.
    const deletable = occurrence !== undefined && routine !== undefined && !card.executed && (inParcours || !occurrence.started);
    // D-568 / RM-276 (23/11/2026) : carte « Supprimée » — le glisser propose « Rétablir » tant que la date n'est pas passée, seul.
    const restoreActions: readonly SwipeAction[] =
      occurrence !== undefined && card.restorable === true
        ? [
            {
              key: "restore",
              label: t.calendar.restore,
              backgroundColor: colors.primary,
              onPress: () => {
                setRevealed(null);
                restore(occurrence.routineId, occurrence.key, inParcours ? (card.sessionIndex ?? null) : null);
              },
            },
          ]
        : [];
    const actions: readonly SwipeAction[] =
      card.deleted === true
        ? restoreActions
        : occurrence === undefined
        ? []
        : [
            { key: "duplicate", label: t.calendar.duplicate, backgroundColor: colors.movementLevelAction, onPress: () => duplicate(occurrence.routineId) },
            ...(deletable
              ? [
                  {
                    key: "delete",
                    label: t.calendar.delete,
                    backgroundColor: colors.danger,
                    onPress: () => {
                      setRevealed(null);
                      setDeleteCandidate({ routine: routine!, occurrenceKey: occurrence.key, sessionIndex: inParcours ? (card.sessionIndex ?? null) : null });
                    },
                  },
                ]
              : []),
          ];
    const startable = card.action !== null;
    // D-560 (22/11/2026), développé le 23/11/2026 : séance hors de la répétition d'une routine — Exécution hors planification ou
    // créneau ajouté hors répétition (créneau unique compris) ; astérisque collée à l'heure, annoncée au lecteur d'écran.
    const outsideMark = !card.planned ? t.calendar.unplannedAccessibility : card.addedSlot === true ? t.calendar.addedAccessibility : "";
    return (
      <View key={card.key} style={inParcours ? styles.parcoursItem : styles.item} testID={`calendar-item-${card.key}`}>
        {/* DSF Agenda § 6 : la carte glisse de 180 et découvre Dupliquer (gris) et Supprimer (rouge), 90 × 52. */}
        <SwipeActionsRow
          actions={actions}
          revealed={revealed === card.key}
          onReveal={() => setRevealed(card.key)}
          onHide={() => setRevealed((current) => (current === card.key ? null : current))}
          onPress={() => openOccurrence(card)}
          accessibilityLabel={[card.title, fillTemplate(t.calendar.timeAccessibility, { time: card.timeLabel }), card.duration, outsideMark, card.deleted === true ? t.calendar.status.deleted : ""].filter((part) => part !== "").join(", ")}
          accessibilityHint={t.calendar.openRoutine}
          accessibilityState={{ expanded: isExpanded }}
          extraAccessibilityActions={[
            { name: "toggle", label: isExpanded ? t.calendar.collapseRoutine : t.calendar.expandRoutine, onAction: toggle },
            ...(startable ? [{ name: "start", label: card.status === "MISSED" ? t.calendar.catchUp : t.calendar.start, onAction: () => start(card) }] : []),
          ]}
          actionsHeight={AGENDA_ROW_HEIGHT}
          actionWidth={AGENDA_ACTION_WIDTH}
          // Recette du 19/11/2026 au soir (s19-glisse) : coins arrondis du bloc d'actions standard et marge de 16 avec le bord
          // droit de l'écran.
          actionsRightMargin={layout.screenGutter}
          testID={`calendar-item-${card.key}-swipe`}
        >
          <RoutineAgendaCard
            time={card.timeLabel}
            duration={card.duration}
            name={card.title}
            inParcours={inParcours}
            // D-560 (22/11/2026), développé le 23/11/2026 : l'Exécution hors planification porte la spécialité comme les autres
            // cartes ; l'astérisque de l'heure la distingue. [Libellé « Hors planification » en tête de ligne 2 — remplacé.]
            // [« — » d'une Séance suivante de parcours : pas d'heure, pas d'astérisque — choix de Claude.]
            timeMarked={outsideMark !== "" && card.timeLabel !== "—"}
            detail={detailOf(card)}
            status={card.status}
            startable={startable}
            expanded={isExpanded}
            onOpen={() => openOccurrence(card)}
            onToggleExpanded={toggle}
            onStart={() => start(card)}
            testID={`calendar-item-${card.key}-card`}
          />
        </SwipeActionsRow>
        {isExpanded && card.projection !== undefined ? (
          // DSF Agenda § 6 : composition de la Séance sous la carte. D-553 : le nom de la Séance, titre de la carte, n'est pas
          // répété. [Nom de chaque séance au-dessus de sa composition (r20-recap) — remplacé.]
          <View style={styles.expandedInParcours} testID={`calendar-item-${card.key}-expanded-wrapper`}>
            {/* Contre-recette du 23/11/2026 (constat k — Hermann : « agenda, séance déployée dans un parcours : étendre les deux
                traits verticaux de couleur de la séance à gauche et à droite ») : les traits de la carte se prolongent le long de
                la composition déployée. Lot 5, 23/11/2026 (y7 — Hermann : « Ce doit être le même format pour les séances que pour
                les parcours ») : même format pour une séance hors parcours — traits prolongés (celui de gauche au bord de l'écran,
                comme celui de sa carte) et composition sans écart propre. [Format réservé aux séances de parcours — remplacé.] */}
            <View
              pointerEvents="none"
              style={[styles.expandedBar, { left: inParcours ? AGENDA_PARCOURS_FRAME_OFFSET : 0, backgroundColor: agendaBarColor(card.status) }]}
              testID={`calendar-item-${card.key}-expanded-bar-left`}
            />
            <View
              pointerEvents="none"
              style={[styles.expandedBar, { right: 0, backgroundColor: agendaBarColor(card.status) }]}
              testID={`calendar-item-${card.key}-expanded-bar-right`}
            />
            <Pressable onPress={toggle} accessible={false} style={[styles.expanded, styles.expandedContentInParcours]} testID={`calendar-item-${card.key}-expanded`}>
              {/* Recette du 21/11/2026 (a31-deploye — Hermann : « Retirer le séparateur horizontal avant le nom du circuit / de
                  l'exercice ») : composition sans filet en tête. */}
              <SessionCompositionTree tree={card.projection.tree} divider={false} testID={`calendar-item-${card.key}-composition`} />
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  // Message « semaine vide » : première semaine de la liste sans occurrence ; les semaines suivantes s'affichent dessous.
  const lastDay = useMemo(() => [...listDays].reverse().find((day) => (groupsByDay.get(day)?.length ?? 0) > 0), [listDays, groupsByDay]);
  /**
   * Recette du 21/11/2026 (constat e — Hermann : « le glissement horizontal est saccadé ; après un appui sur une date, la mise en
   * couleur du jour et le repositionnement de la liste ne sont pas immédiats ») : les sections de la liste ne dépendent ni du
   * jour choisi ni de la semaine du carrousel ; elles ne sont plus recalculées à chaque toucher d'un jour ni pendant le
   * défilement, qui ne changent que le carrousel. [Choix technique.]
   */
  /** Jour à placer en tête (recette du 22/11/2026) : sa section, ou la première qui le suit, dès sa mise en page. */
  const pendingTarget = useMemo(
    () => (pendingScrollDay === null ? undefined : listDays.find((candidate) => candidate >= pendingScrollDay && (groupsByDay.get(candidate)?.length ?? 0) > 0)),
    [pendingScrollDay, listDays, groupsByDay],
  );
  const sections = useMemo(
    () =>
      listDays.map((day) => {
        const groups = groupsByDay.get(day) ?? [];
        if (groups.length === 0) return null;
        const first = day === listDays.find((candidate) => (groupsByDay.get(candidate)?.length ?? 0) > 0);
        return (
          <View
            key={day}
            onLayout={(event) => {
              const y = event.nativeEvent.layout.y;
              sectionOffsets.current.set(day, y);
              const height = event.nativeEvent.layout.height;
              setSectionHeights((current) => (current.get(day) === height ? current : new Map(current).set(day, height)));
              // Jour tenu en tête (recette du 22/11 et du 23/11/2026) : à chaque mise en page de sa section, jusqu'au défilement de
              // l'utilisateur. [Placé une seule fois — remplacé : la liste se remettait en page ensuite et le jour descendait.]
              if (day === pendingTarget) setPendingScrollY({ y });
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
            {groups.map((group) =>
              group.parcours ? (
                // D-553 (Figma `12906:71`) : ligne « Ⓟ nom de la Routine » au-dessus de la première carte, sans heure, statut ni
                // compteur ; cartes décalées ; lien noir fin du Ⓟ jusqu'au bas de la dernière carte, sur les traits verticaux.
                <View key={group.key} style={styles.parcours} testID={`calendar-parcours-${group.key}`}>
                  <View style={styles.parcoursLink} testID={`calendar-parcours-${group.key}-link`} />
                  <View style={styles.parcoursHeader}>
                    <ParcoursBadge placement="alone" size={18} stroke={1.5} testID={`calendar-parcours-${group.key}-badge`} />
                    <Text style={styles.parcoursName} numberOfLines={1} maxFontSizeMultiplier={1.6} testID={`calendar-parcours-${group.key}-name`}>
                      {parcoursNameOf(group)}
                    </Text>
                  </View>
                  {group.cards.map((card) => renderCard(card, true))}
                </View>
              ) : (
                <View key={group.key}>{group.cards.map((card) => renderCard(card, false))}</View>
              ),
            )}
          </View>
        );
      }),
    // Les fonctions de rendu ne lisent que les valeurs ci-dessous, les références et les fonctions d'état.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listDays, groupsByDay, expanded, revealed, routinesById, projections, isPlannable, zoneName, lastDay, pendingTarget],
  );
  const bottomReserve = navigationBarTotalHeight() + insets.bottom + spacing[24];
  const anyItem = listDays.slice(0, 7).some((day) => (groupsByDay.get(day)?.length ?? 0) > 0);
  const lastSectionHeight = lastDay === undefined ? 0 : (sectionHeights.get(lastDay) ?? 0);
  const listPaddingBottom = Math.max(bottomReserve, listHeight - lastSectionHeight);

  return (
    // Haut d'écran partagé `TabbedScreen` (Hermann, 19/11/2026) : même en-tête à onglets et même bande que le Journal et les
    // Catalogues. DSF Agenda § 2 : trois lignes centrées verticalement dans la bande, espacées de 6 — mois, semaine,
    // « Aujourd'hui » et Planifier.
    <TabbedScreen
      title={t.calendar.title}
      palette={CALENDAR_PALETTE}
      tabs={calendarTabs("agenda", onChangeView)}
      // UI-FAB-01 (D-559) : bouton flottant calendrier « + » — créer un créneau unique au jour sélectionné (planification
      // pré-remplie, sans répétition : répétition « Aucune » par défaut de la planification). Même action que l'ancien
      // bouton Planifier de la zone de contexte, retiré ; le créneau porte l'astérisque « hors routine » (D-560, inchangé).
      floatingCreate={{
        variant: "calendar",
        label: strings.shared.floatingCreate.createSlot,
        onPress: () => router.push({ pathname: "/planning", params: { date: selectedDay < todayLocal() ? todayLocal() : selectedDay } }),
      }}
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
            <View style={styles.monthNavigation} pointerEvents="box-none" testID="calendar-month-navigation">
              <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel={t.calendar.previousMonth} hitSlop={6} testID="calendar-previous-month">
                <DoubleChevron source={require("../../../assets/icons/icon-precedent.svg")} />
              </Pressable>
              <Text style={styles.periodLabel} accessibilityRole="header" maxFontSizeMultiplier={1.2} numberOfLines={1} testID="calendar-month-label">
                {/* Recette du 21/11/2026 (q23-mois — Hermann : « il faut afficher le mois qui compte le plus de jours dans la
                    semaine affichée ») : mois de la semaine, comme le Plan. [Mois du jour choisi (D-538, À CLARIFIER) — remplacé.] */}
                {formatAgendaMonth(shownMonth)}
              </Text>
              <Pressable onPress={() => changeMonth(1)} accessibilityRole="button" accessibilityLabel={t.calendar.nextMonth} hitSlop={6} testID="calendar-next-month">
                <DoubleChevron source={require("../../../assets/icons/icon-suivant.svg")} />
              </Pressable>
            </View>
            {/* Ligne 1, à droite : filtre par routine (D-539, DSF Agenda § 9), entonnoir sans cercle, zone de tap 34 × 34 ;
                contour gris sans filtre, silhouette pleine bleue filtre actif. */}
            <Pressable
              // D-539 mis à jour le 20/11/2026 (Hermann) : sans filtre, ouvre la modale ; icône bleue (filtre actif) :
              // désactive le filtre, sans ouvrir la modale. [Réouverture de la modale avec les routines cochées — remplacé.]
              onPress={() => {
                setRevealed(null);
                if (routineFilter !== null) {
                  changeRoutineFilter([]);
                  return;
                }
                requestPlanningSheet({ kind: "routineFilter", onValidate: changeRoutineFilter });
                router.push("/agenda-routine-filter");
              }}
              accessibilityRole="button"
              accessibilityLabel={routineFilter === null ? t.routineFilter.open : t.routineFilter.disable}
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
            {/* Ligne 2 : flèche de semaine, sept cartes de jour, flèche de semaine, centrées sur l’écran (D-559). */}
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
                // D-568 (Figma `12906:184`) : une Séance supprimée n'a pas de point.
                const sessionsOfDay = (groupsByDay.get(day) ?? []).flatMap((group) =>
                  group.cards.filter((card) => card.deleted !== true).map((card) => ({ key: card.key, projection: card.projection })),
                );
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
            {/* [Planifier (cercle de commande, x = 352) — retiré le 24/11/2026 (D-559) : bouton flottant « Créer ».] */}
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
          // Le défilement de l'utilisateur l'emporte sur un placement en attente (recette du 22/11/2026).
          setPendingScrollDay(null);
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
        {!loadFailed && !anyItem && loadedStart === range.start ? (
          <Text style={styles.message} testID="calendar-week-empty">
            {t.calendar.emptyWeek}
          </Text>
        ) : null}
        {sections}
      </ScrollView>
      </SwipeScrollLockContext.Provider>

      {/* Recette du 20/11/2026 (constat D — Hermann : « Dans l'agenda on ne supprime que l'occurrence ») : un seul
          dialogue, titre seul ; l'occurrence est retirée, la routine reste (au Journal, grise s'il n'y a plus rien à venir).
          [Planification unique supprimée en entier ; choix « Seulement cette occurrence » / « Toutes les occurrences à
          venir » — remplacé.] */}
      {deleteCandidate !== null ? (
        <DecisionDialog
          // Recette du 20/11/2026 (Hermann : « Remettre le bouton Annuler à côté du bouton Confirmer, les deux au même format » —
          // suppression de routine et d'occurrence) : deux actions côte à côte du composant partagé. [« Annuler » en haut à gauche,
          // « Confirmer » pleine largeur (D-537) — remplacé.]
          title={deleteCandidate.sessionIndex === null ? t.deleteOccurrence.title : t.deleteOccurrence.sessionTitle}
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
            const { routine, occurrenceKey, sessionIndex } = deleteCandidate;
            runAction(() =>
              sessionIndex === null ? planning.excludeOccurrence(routine.id, occurrenceKey) : planning.removeOccurrenceSession(routine.id, occurrenceKey, sessionIndex),
            );
          }}
          testIDPrefix="planning-delete-occurrence"
        />
      ) : null}
      <PlanningNoticeHost message={planningNotice} onDismiss={() => setPlanningNotice(null)} testID="agenda-notice" />
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
  // D-559 (22/11/2026, Figma `12906:47`) : mois et doubles flèches centrés sur l'écran (x = 201). [D-555 : centrés sur la
  // rangée des jours, x = 176 — remplacé.]
  monthNavigation: { position: "absolute", left: 0, width: 370, top: 11, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  doubleChevron: { width: 30, height: 24 },
  chevron: { width: 24, height: 24 },
  chevronFirst: { position: "absolute", left: 0, top: 0 },
  chevronSecond: { position: "absolute", left: 7, top: 0 },
  // Mois : Inter 18 semi-gras.
  periodLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary, textAlign: "center", flexShrink: 1 },
  // D-559 : entonnoir en miroir de « Aujourd'hui » (x = 357 de l'écran, Figma `12906:220`), centré verticalement sur la ligne
  // du mois ; contour bleu sans filtre, plein bleu filtre actif (D-555, inchangé). [Au-dessus de la flèche de semaine
  // suivante, x = 313 (D-555) — remplacé.]
  filterSlot: { position: "absolute", left: 341, top: 6, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  filterIcon: { width: 24, height: 24 },
  // D-559 (Figma `12906:209`, `12906:210`, `12906:177`) : flèche, sept jours, flèche, centrés sur l'écran.
  // [Flèches à x = 10,25 et 318, jours à x = 41, Planifier à x = 352 — remplacés.]
  previousWeek: { position: "absolute", left: 19.75, top: 62 },
  nextWeek: { position: "absolute", left: 327.5, top: 62 },
  // Rangée des jours : sept cartes 36 × 46, rayon 10, écart 3 (270), à x = 66,5 de l'écran (D-559, centrée). [x = 41 — remplacé.]
  dayBar: { position: "absolute", left: 50.5, top: 51, width: 270, height: 46, flexDirection: "row", gap: 3 },
  dayCell: { width: 36, height: 46, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.3)", alignItems: "center", overflow: "hidden" },
  dayCellSelected: { backgroundColor: colors.selection },
  dayShort: { position: "absolute", top: 3, left: 0, right: 0, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 11, lineHeight: 14, color: colors.textLabel, textAlign: "center" },
  dayNumber: { position: "absolute", top: 14, left: 0, right: 0, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 22, color: colors.textLabel, textAlign: "center" },
  dayTextSelected: { color: colors.background },
  // Un point de 4 par séance du jour en bas de la carte (y = 39), écart 3.
  dots: { position: "absolute", top: 39, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 3 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  // Recette du 22/11/2026 (Hermann : « la zone de contexte des écrans Agenda et Plan n'ont PAS le dégressif transparent ») : la
  // liste remonte sous la part fondue de `ContextBand` et y défile, comme le Journal et les Catalogues (contrat de la bande :
  // « le corps remonte de CONTEXT_BAND_FADE_HEIGHT, à l'écran hôte de le faire »). [Liste sous la bande — remplacé.]
  list: { flex: 1, marginTop: -CONTEXT_BAND_FADE_HEIGHT },
  // D-538 : premier en-tête de jour à y = 215 (8 sous la bande), son texte à 11,5 du haut de l'en-tête ; cartes pleine
  // largeur d'écran. [Liste à 14 sous la rangée des jours — remplacé.]
  listContent: { paddingTop: spacing[8] + CONTEXT_BAND_FADE_HEIGHT },
  // Contre-recette du 23/11/2026 (constat j — Hermann : « agenda : marquer un peu plus le trait horizontal de séparation des
  // dates ») : trait de 1 au liseré des cartes (`cardsBorder`). [Trait d'un pixel #E5E8F0 — remplacé.]
  daySeparator: { height: 1, backgroundColor: colors.cardsBorder, marginHorizontal: layout.screenGutter, marginTop: spacing[16] },
  sectionHeader: { paddingHorizontal: layout.screenGutter, paddingTop: 5, paddingBottom: spacing[8] },
  sectionHeaderFirst: { paddingTop: 11 },
  // En-tête de jour : Inter 13 semi-gras gris.
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: colors.textSecondary },
  // DSF Agenda § 4 : 8 entre deux routines, aucun trait.
  item: { paddingBottom: spacing[8] },
  // D-553 (Figma `12906:71`) : groupe d'un parcours — ligne « Ⓟ » (Ⓟ de 18 centré à x = 13 sur les traits des cartes, nom à
  // x = 28), cartes espacées de 4, lien noir de 1 du bas du Ⓟ au bas de la dernière carte.
  parcours: { paddingBottom: spacing[4] },
  parcoursHeader: { flexDirection: "row", alignItems: "center", paddingLeft: 4, paddingTop: 10, paddingBottom: 4, gap: 6, paddingRight: layout.screenGutter },
  // Contre-recette du 23/11/2026, lot 4 (constat e — Hermann : « Agenda : mettre la couleur du nom des parcours en gris, et pas en
  // gras ») : Inter Regular (graisse de `type.supporting`), gris `textSecondary`, taille 15 inchangée. [Semi-gras noir — remplacé.]
  parcoursName: {
    ...type.listCardTitle,
    fontFamily: type.supporting.fontFamily,
    fontWeight: type.supporting.fontWeight,
    lineHeight: undefined,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  parcoursLink: { position: "absolute", left: 12.5, width: 1, top: 28, bottom: spacing[8], backgroundColor: "#000000" },
  parcoursItem: { paddingBottom: spacing[4] },
  expanded: { marginHorizontal: layout.screenGutter, marginTop: spacing[8], gap: spacing[8] },
  // Contre-recette du 23/11/2026 (constat k) : composition d'une Séance de parcours entre les traits prolongés de la carte, qui
  // partent du bas de la carte (écart de 8 compris) jusqu'au bas de la composition. [Hauteur des traits : celle de la composition,
  // choix technique.]
  // Contre-recette du 23/11/2026, lot 4 (constat f — Hermann : « séance déployée dans un parcours : il y a trop d'espace avant la
  // première ligne ») : la composition suit la carte sans écart propre (reste le retrait de 4 de la composition). [Écart de 8 —
  // remplacé.] Les traits prolongés (constat k) partent toujours du bas de la carte jusqu'au bas de la composition.
  // Lot 5, 23/11/2026 (y7) : appliqués aussi à une séance hors parcours (même format).
  expandedInParcours: { paddingTop: 0 },
  expandedContentInParcours: { marginTop: 0 },
  expandedBar: { position: "absolute", top: 0, bottom: 0, width: AGENDA_BAR_WIDTH },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8], paddingHorizontal: layout.screenGutter },
});
