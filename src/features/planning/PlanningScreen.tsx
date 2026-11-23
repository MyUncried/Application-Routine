import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Alert, AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

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
  moveRow,
} from "@/features/planning/planningDraft";
import { gridIssues, rowMention, togglePoint, withCycle, type PlanningGrid } from "@/features/planning/planningGrid";
import { occurrenceForm, occurrenceSessions, toggleOccurrencePoint, withOccurrenceSelection, type OccurrenceEditing } from "@/features/planning/occurrenceDraft";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { postPlanningNotice, removedSlotsNotice } from "@/features/planning/planningNotice";
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
import { DRAG_HANDLE_SIZE, DragHandleDots } from "@/features/activities/sheetTable";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import type { Program } from "@/domain/programs/Program";
import { maxEndCount, windowStartMinimum, withinWindow, type ProgramWindow } from "@/features/planning/programWindow";
import { OutsidePeriodDialog } from "@/features/programs/OutsidePeriodDialog";
import { withinProgramPeriod } from "@/domain/programs/programMembership";
import { useOptionalProgramService } from "@/features/programs/ProgramServiceContext";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
/** Recette du 22/11/2026 (c35-journal-nom — Hermann : « Il faut mettre une durée de 2s »). [Une seconde — remplacé.] */
const RENAMED_NOTICE_MS = 2000;
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

/** `addTo` + `date` (D-554, DSF Plan § 7) : ajouter à la routine `addTo` un créneau ce jour-là, hors de sa répétition. */
/** `programId` (PROG-CAT-01, D-549) : « + Planifier une séance » depuis un programme — programme présélectionné, non modifiable. */
type Params = {
  readonly routineId?: string;
  readonly duplicateOf?: string;
  readonly sessionId?: string;
  readonly date?: string;
  readonly occurrenceKey?: string;
  readonly addTo?: string;
  readonly programId?: string;
};

/** `occurrence` : modification d'une occurrence seule depuis l'Agenda (D-536, point 4, 20/11/2026). */
type Mode = { readonly kind: "create" } | { readonly kind: "edit"; readonly routineId: string } | { readonly kind: "occurrence"; readonly editing: OccurrenceEditing };

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
  const fresh = params.routineId === undefined && params.duplicateOf === undefined && params.addTo === undefined;
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
  // Une ligne du tableau est portée (réordonnancement) : le formulaire fige son défilement.
  const [reordering, setReordering] = useState(false);
  // Recette du 22/11/2026 (constat d) : message « nom du parcours changé ».
  const [notice, setNotice] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Constat E (Hermann, 20/11/2026) : « Modification dans le Journal : « N créneaux à venir seront modifiés. » ».
  const [modifyCount, setModifyCount] = useState<number | null>(null);
  // D-566 (23/11/2026) : routine d'un programme modifiée depuis le Journal — créneaux à venir hors de la période ; « Supprimer »
  // retire ces créneaux après l'enregistrement.
  const [outsideCount, setOutsideCount] = useState<number | null>(null);
  const removeOutsideRef = useRef(false);
  // RM-259 : la synthèse dont les jours ne tenaient pas, mémorisée pour passer à « X jours par semaine ».
  const [overflowing, setOverflowing] = useState<string | null>(null);
  const savingRef = useRef(false);
  // Recette du 21/11/2026 (Journal, Hermann : « Si la routine n'a pas été modifiée, valider n'affiche pas le message de
  // confirmation de modification ») : brouillon lu à l'ouverture d'une modification depuis le Journal.
  const loadedForm = useRef<FormDraft | null>(null);
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
    if (params.addTo !== undefined && params.date !== undefined) {
      // D-554 (DSF Plan § 7, point 1) : modale du créneau pré-remplie avec la date touchée et l'heure habituelle de la routine ;
      // pour un parcours, le créneau entier.
      planning.prepareAddedOccurrence(params.addTo, params.date).then((found) => {
        if (cancelled) return;
        if (found === null) {
          routerRef.current.back();
          return;
        }
        const built = occurrenceForm(found.routine, found.occurrence, () => Crypto.randomUUID());
        setMode({ kind: "occurrence", editing: { ...built.editing, adding: true } });
        setForm(built.form);
      }, () => routerRef.current.back());
    } else if (params.routineId !== undefined && params.occurrenceKey !== undefined) {
      planning.getOccurrence(params.routineId, params.occurrenceKey).then((found) => {
        if (cancelled) return;
        // D-536, point 1 : une occurrence commencée n'est pas modifiable.
        if (found === null || found.occurrence.started) {
          routerRef.current.back();
          return;
        }
        const built = occurrenceForm(found.routine, found.occurrence, () => Crypto.randomUUID());
        setMode({ kind: "occurrence", editing: built.editing });
        setForm(built.form);
      }, () => routerRef.current.back());
    } else if (params.routineId !== undefined) {
      const routineId = params.routineId;
      planning.getRoutine(routineId).then((routine) => {
        if (cancelled) return;
        if (routine === null) {
          routerRef.current.back();
          return;
        }
        setMode({ kind: "edit", routineId });
        const loaded = draftFromRoutine(routine);
        loadedForm.current = loaded;
        setForm(loaded);
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
  }, [params.routineId, params.duplicateOf, params.occurrenceKey, params.addTo, params.date, planning]);

  // PROG-CAT-01 (Hermann, 21/11/2026, point 5) : programme présélectionné (création depuis un programme) ou programme de la
  // routine modifiée ; ses dates bornent « Début le », « jusqu'au » et « pendant ». Sans service (tests isolés) : aucun.
  const programs = useOptionalProgramService();
  const [program, setProgram] = useState<Program | null>(null);
  const [routineProgramId, setRoutineProgramId] = useState<string | null>(null);
  useEffect(() => {
    if (params.routineId === undefined || params.programId !== undefined) return undefined;
    let cancelled = false;
    planning.getRoutine(params.routineId).then(
      (routine) => {
        if (!cancelled) setRoutineProgramId(routine?.programId ?? null);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [params.routineId, params.programId, planning]);
  const programId = params.programId ?? routineProgramId;
  // Recette du 23/11/2026 (h, g2 — Hermann : « Journal : je dois pouvoir attacher / détacher un programme d'une routine » ;
  // « Agenda : je dois pouvoir attacher / détacher un programme de l'occurrence d'une routine ») : programme choisi dans le menu
  // de la ligne Programme — `undefined` : inchangé ; `null` : aucun. Appliqué à l'enregistrement. Programmes proposés : ceux qui
  // ne sont pas terminés (D-545).
  const [chosenProgramId, setChosenProgramId] = useState<string | null | undefined>(undefined);
  const [programList, setProgramList] = useState<readonly Program[]>([]);
  const programChoosable = programs !== null && params.routineId !== undefined && params.programId === undefined;
  useEffect(() => {
    if (!programChoosable || programs === null) return undefined;
    let cancelled = false;
    programs.listPrograms().then(
      (list) => {
        if (!cancelled) setProgramList(list);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [programChoosable, programs]);
  const programChanged = chosenProgramId !== undefined && chosenProgramId !== routineProgramId;
  useEffect(() => {
    if (programs === null || programId === null) return undefined;
    let cancelled = false;
    programs.getProgram(programId).then(
      (found) => {
        if (!cancelled) setProgram(found);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [programs, programId]);
  const programWindow: ProgramWindow | null = program === null ? null : { start: program.startDate, end: program.endDate };
  // Programme affiché et appliqué à l'enregistrement : le choix du menu, sinon celui de la routine (ou de la création).
  const selectedProgram: Program | null =
    chosenProgramId === undefined ? program : chosenProgramId === null ? null : (programList.find((item) => item.id === chosenProgramId) ?? null);
  // Nouvelle routine d'un programme : le brouillon reste dans la fenêtre (une routine existante n'est jamais réécrite d'office).
  const boundCreation = params.programId !== undefined && mode?.kind === "create";
  // Ajustement pendant le rendu (état dérivé du programme lu) : `withinWindow` rend le même objet une fois dans la fenêtre.
  if (boundCreation && programWindow !== null && form !== null) {
    const next = withinWindow(form, programWindow, todayLocal());
    if (next !== form) setForm(next);
  }

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
  // Occurrence seule : le nom reste celui de la routine (ni saisie ni contrôle) ; au moins une séance active dans le créneau.
  const editing = mode.kind === "occurrence" ? mode.editing : null;
  const nameMissing = editing === null && name.trim() === "";
  const blocking =
    editing === null
      ? [...validateRoutineDraft(draft), ...gridIssues(shown.grid)]
      : [
          // Recette du 21/11/2026 (c22-5 — Hermann : « La règle "chaque séance doit avoir au moins une pastille" a du sens dans le
          // Journal, où l'on modifie la grille de la routine entière. Elle ne doit pas s'appliquer à la modification d'un seul
          // créneau ») : la fréquence d'une ligne sans pastille n'est pas contrôlée ici.
          ...validateRoutineDraft(draft).filter((issue) => issue !== "NAME_REQUIRED" && issue !== "INVALID_FREQUENCY"),
          ...(shown.grid.points.some((row) => row[editing.column] === true) ? [] : ["EMPTY_SLOT" as const]),
        ];
  const canSave = blocking.length === 0 && !saving && catalogue.status === "ready";
  // Recette du 23/11/2026 (d4) : en modification depuis le Journal, les dates ne sont plus bornées par la période du programme —
  // D-566 : la routine n'est pas coupée, des créneaux peuvent rester hors programme (question posée à l'enregistrement).
  // [Bornes du programme en modification (PROG-CAT-01, point 5) — remplacé ; conservées pour la création depuis un programme et
  // pour une occurrence seule.]
  // D-564 / D-567 (lot 4, x10 — Hermann : « les créneaux en dehors de la période du programme sont toujours affectés au programme
  // dans l'agenda : il faut que la valeur soit "Aucun" et qu'ils ne soient plus affectés au programme ») : une occurrence de
  // l'Agenda datée hors de la période n'appartient pas au programme — valeur « Aucun », dates non bornées par le programme.
  const occurrenceOutside = mode.kind === "occurrence" && selectedProgram !== null && !withinProgramPeriod(selectedProgram, form.startDate);
  const shownProgram = occurrenceOutside ? null : selectedProgram;
  const boundWindow = mode.kind === "edit" || occurrenceOutside ? null : programWindow;
  // Routine modifiée (au-delà du seul programme) : recette du 21/11/2026, sans changement rien n'est enregistré.
  const routineChanged = () => {
    const before = loadedForm.current;
    return before === null || JSON.stringify(toRoutineDraft(before, before.name)) !== JSON.stringify(toRoutineDraft(form, form.name));
  };
  const routineIdOf = (current: Mode) =>
    current.kind === "edit" ? current.routineId : current.kind === "occurrence" && current.editing.adding !== true ? current.editing.routineId : null;

  /** D-536, point 2 : confirmation du nombre de créneaux concernés, seulement si la routine elle-même change. */
  const askModify = (routineId: string) => {
    if (!routineChanged()) {
      commit();
      return;
    }
    planning.pendingSlotCount(routineId, draft).then(
      (count) => (count > 0 ? setModifyCount(count) : commit()),
      () => commit(),
    );
  };

  const save = () => {
    if (!canSave || savingRef.current) return;
    removeOutsideRef.current = false;
    // D-536, point 2 : modification de la routine depuis le Journal — confirmation du nombre de créneaux concernés.
    if (mode.kind === "edit" && modifyCount === null) {
      if (!routineChanged() && !programChanged) {
        // Rien n'a changé : pas de confirmation, rien n'est enregistré (la routine ne remonte pas dans le Journal).
        router.back();
        return;
      }
      const routineId = mode.routineId;
      // D-566 : routine d'un programme (actuel ou choisi) — créneaux à venir hors de sa période, brouillon compris.
      if (selectedProgram !== null) {
        planning.outsidePeriodSlotCount(routineId, selectedProgram.startDate, selectedProgram.endDate, draft).then(
          (count) => (count > 0 ? setOutsideCount(count) : askModify(routineId)),
          () => askModify(routineId),
        );
        return;
      }
      askModify(routineId);
      return;
    }
    // [Recette du 23/11/2026 (g2) : programme choisi depuis une occurrence de l'Agenda, question D-566 au rattachement — retiré
    // le 23/11/2026 (x18) : le programme n'est plus modifiable depuis l'Agenda.]
    commit();
  };

  /** D-566 : réponse à la question des créneaux hors période, puis confirmation habituelle (D-536). */
  const answerOutside = (removeOutside: boolean) => {
    setOutsideCount(null);
    removeOutsideRef.current = removeOutside;
    if (mode.kind === "edit") askModify(mode.routineId);
    else commit();
  };

  /**
   * Après l'enregistrement : programme choisi (h, g2), puis D-566 « Supprimer » — snackbar du nombre de créneaux supprimés (d3),
   * affichée par l'écran qui reprend le focus (`planningNotice`).
   */
  const afterSave = async <T extends { readonly status: string }>(result: T): Promise<T> => {
    const routineId = routineIdOf(mode);
    if (result.status !== "SAVED" || routineId === null) return result;
    if (programChanged && programs !== null) {
      if (chosenProgramId === null || chosenProgramId === undefined) await programs.detachRoutine(routineId);
      else await programs.attachRoutine(routineId, chosenProgramId);
    }
    const periodProgram = selectedProgram;
    if (removeOutsideRef.current && periodProgram !== null) {
      const removedCount = await planning.removeOutsidePeriod(routineId, periodProgram.startDate, periodProgram.endDate);
      if (removedCount > 0) postPlanningNotice(removedSlotsNotice(removedCount));
    }
    return result;
  };

  const commit = () => {
    if (savingRef.current) return;
    setModifyCount(null);
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    const write: Promise<{ readonly status: string }> =
      mode.kind === "occurrence"
        ? (mode.editing.adding === true ? planning.addOccurrence(mode.editing.routineId, {
              date: form.startDate,
              time: form.time,
              sessions: occurrenceSessions(shown, mode.editing),
              reminderMinutes: form.reminderMinutes,
            }) : planning.updateOccurrence(mode.editing.routineId, mode.editing.key, {
              date: form.startDate,
              time: form.time,
              sessions: occurrenceSessions(shown, mode.editing),
              reminderMinutes: form.reminderMinutes,
            }))
        : mode.kind === "edit"
          ? // Seul le programme change (h) : la routine n'est pas réécrite.
            routineChanged()
            ? planning.updateRoutine(mode.routineId, draft)
            : Promise.resolve({ status: "SAVED" })
          : planning.createRoutine(params.programId !== undefined ? { ...draft, programId: params.programId } : draft);
    const request = mode.kind === "create" ? write : write.then(afterSave);
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
      onValidate: (selected) => {
        if (editing !== null) {
          // Occurrence seule : les séances de la routine restent (désactivables) ; ajout ou retrait des séances ajoutées.
          const next = withOccurrenceSelection(form, editing, selected, () => Crypto.randomUUID());
          setMode({ kind: "occurrence", editing: { ...next.editing, ...(editing.adding === true ? { adding: true } : {}) } });
          setForm(next.form);
          return;
        }
        setForm((current) => (current === null ? current : withSelection(current, selected, () => Crypto.randomUUID())));
      },
    });
    router.push("/planning-selection");
  };

  // D-545 : modale « Rattacher un programme » — le programme affiché y est sélectionné ; le choix (ou « Aucun ») est appliqué à
  // l'enregistrement, avec la question D-566 si des créneaux à venir tombent hors de la période du programme choisi.
  const openProgramChoice = () => {
    requestPlanningSheet({ kind: "program", selectedId: selectedProgram?.id ?? null, onChoose: setChosenProgramId });
    router.push("/planning-program");
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
            {/* D-553 (21/11/2026) : nom généré (Séance, ou noms reliés par « + ») tant qu'il n'est pas modifié ; personnalisé
                ensuite. [D-522 / RM-258 : nom libre, unique ; copié de la séance quand une seule est planifiée — remplacé.] */}
            <TextInput
              value={name}
              onChangeText={(value) => update({ name: value, nameEdited: true })}
              placeholder={t.namePlaceholder}
              placeholderTextColor={colors.textSecondary}
              // Occurrence seule (D-536, point 1 du prompt de la mission 2) : « Le nom reste celui de la routine. »
              editable={editing === null}
              accessibilityLabel={t.nameAccessibility}
              style={styles.name}
              returnKeyType="done"
              testID="planning-name"
            />
            {/* D-553 (21/11/2026) : nom vidé → « Nom obligatoire » ; doublons autorisés. [« Ce nom est déjà utilisé » (RM-261) —
                retiré.] */}
            {nameMissing ? (
              <Text style={styles.nameError} accessibilityLiveRegion="polite" testID="planning-name-error">
                {t.nameRequired}
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
            scrollEnabled={!reordering}
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
                {/* D-545 (Hermann, 23/11/2026) : en modification depuis le Journal, la ligne ouvre la modale « Rattacher un
                    programme » (feuille native). [Menu SwiftUI natif (recette du 23/11/2026, h) — remplacé ; sa largeur, mesurée
                    une fois par `Host matchContents`, tronquait le nom après un changement de répétition (constat b).]
                    x18 (Hermann : « On ne doit pas pouvoir modifier le programme depuis l'agenda. Le champ doit être visible mais
                    non éditable. ») : occurrence de l'Agenda — valeur fixe. [Menu depuis l'Agenda (g2) — remplacé.] */}
                {programChoosable && mode.kind === "edit" ? (
                  <Pill
                    label={selectedProgram?.name ?? t.programNone}
                    onPress={openProgramChoice}
                    accessibilityLabel={fillTemplate(t.programMenuAccessibility, { value: selectedProgram?.name ?? t.programNone })}
                    testID="planning-program"
                  />
                ) : (
                  <View style={styles.pill} accessible accessibilityLabel={`${t.program} : ${shownProgram?.name ?? t.programNone}`} testID="planning-program">
                    <Text style={styles.pillText}>{shownProgram?.name ?? t.programNone}</Text>
                  </View>
                )}
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

            {/* Carte 2 (D-520, RM-257) : Répétition sans interrupteur. Absente pour une occurrence seule : la récurrence ne se
                change pas depuis l'Agenda (D-536, point 4). */}
            {editing !== null ? null : (
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
            )}

            {/* Carte 3 (D-519, RM-253 à RM-256) : Séance par créneau. */}
            <View style={styles.card} testID="planning-grid">
              <Text style={styles.label}>{t.slotsTitle}</Text>
              <SlotGrid
                grid={shown.grid}
                names={shown.entries.map((entry) => nameOf(entry.sessionId) ?? "—")}
                focusColumn={editing?.column}
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
                onMove={(from, to) => {
                  const moved = moveRow(form, form.entries.indexOf(shown.entries[from]!), form.entries.indexOf(shown.entries[to]!));
                  // Recette du 22/11/2026 (constat d, c35-journal-nom — Hermann : « le snackbar apparaît après le message de
                  // confirmation de la modification, au lieu d'apparaître dès que le changement d'ordre est effectué. Il faut mettre
                  // une durée de 2s ») : routine modifiée au nom généré — message dès le déplacement, deux secondes.
                  // [Message d'une seconde sur le Journal après l'enregistrement — remplacé.]
                  if (mode.kind === "edit" && !form.nameEdited && effectiveName(moved, nameOf) !== effectiveName(form, nameOf)) setNotice(planningStrings.journal.renamedNotice);
                  setForm(moved);
                }}
                onDraggingChange={setReordering}
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

      {outsideCount !== null ? (
        <OutsidePeriodDialog
          count={outsideCount}
          // Lot 4 (x9, x10) : programme choisi dans la modale = rattachement (« de ce programme ») ; sinon modification depuis
          // le Journal (« du programme »).
          context={programChanged ? "ATTACH" : "JOURNAL"}
          onKeep={() => answerOutside(false)}
          onDelete={() => answerOutside(true)}
          onCancel={() => setOutsideCount(null)}
          testIDPrefix="planning-outside"
        />
      ) : null}
      {modifyCount !== null ? (
        <DecisionDialog
          // Recette du 21/11/2026 (Journal, Hermann : « Dans le message de modification, mettre "Annuler" sur la même ligne que
          // "Confirmer", avec les mêmes dimensions ») : comme les fenêtres de suppression. [« Annuler » en haut — remplacé.]
          title={planningStrings.modifyRoutine.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={
            modifyCount === 1
              ? planningStrings.modifyRoutine.messageOne
              : planningStrings.modifyRoutine.messageMany.replace("{count}", String(modifyCount))
          }
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={planningStrings.modifyRoutine.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={planningStrings.modifyRoutine.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setModifyCount(null)}
          onConfirm={commit}
          testIDPrefix="planning-modify"
        />
      ) : null}

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
            values: boundWindow === null ? END_COUNTS : END_COUNTS.filter((count) => count <= maxEndCount(form.unit, form.startDate, boundWindow.end)),
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
            minimum={
              popover.kind === "START" ? (boundWindow === null ? todayLocal() : windowStartMinimum(boundWindow, todayLocal())) : form.startDate
            }
            {...(boundWindow !== null ? { maximum: boundWindow.end } : {})}
            onChange={(value) => {
              if (popover.kind === "START") changeStartDate(value);
              else setForm((current) => (current === null ? current : withEndDate(current, value)));
            }}
          />
        ) : null}
      </PlanningPopover>
      <View pointerEvents="none" style={[styles.noticeAnchor, { bottom: insets.bottom + spacing[16] }]}>
        <TransientNotification message={notice} onDismiss={() => setNotice(null)} durationMs={RENAMED_NOTICE_MS} testID="planning-renamed-notice" />
      </View>
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
/** Appui long avant de porter une ligne du tableau (même geste que l'ancienne liste des contenus et la Composition). */
const ROW_LONG_PRESS_MS = 500;

/**
 * Déplacement d'une ligne du tableau (recette du 19/11/2026 au soir, q19-deplacement) — repris de l'ancienne liste des
 * contenus (`useEntryDrag`, recette du 17/11/2026) : `Pan` natif activé après l'appui long sur la ligne ; la ligne portée
 * suit le doigt, les lignes franchies se décalent.
 */
function useRowDrag(count: number, rowHeight: number, onMove: (from: number, to: number) => void, onDraggingChange: (dragging: boolean) => void) {
  const [drag, setDrag] = useState<{ readonly index: number; readonly dy: number } | null>(null);
  const dragRef = useRef<{ readonly index: number; readonly dy: number } | null>(null);
  const setDragState = (next: { readonly index: number; readonly dy: number } | null) => {
    const was = dragRef.current !== null;
    dragRef.current = next;
    setDrag(next);
    if (was !== (next !== null)) onDraggingChange(next !== null);
  };
  const targetOf = (current: { readonly index: number; readonly dy: number }) =>
    Math.max(0, Math.min(count - 1, current.index + Math.round(current.dy / rowHeight)));
  const gesture = (index: number) =>
    Gesture.Pan()
      .enabled(count > 1)
      .activateAfterLongPress(ROW_LONG_PRESS_MS)
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
      .withTestId(`planning-row-drag-${index}`);
  const offset = (index: number) => {
    if (drag === null) return 0;
    if (index === drag.index) return drag.dy;
    const to = targetOf(drag);
    if (index > drag.index && index <= to) return -rowHeight;
    if (index < drag.index && index >= to) return rowHeight;
    return 0;
  };
  return { drag, gesture, offset };
}

function SlotGrid({
  grid,
  names,
  focusColumn,
  onChange,
  onCycle,
  onChangeSessions,
  onMove,
  onDraggingChange,
}: {
  readonly grid: PlanningGrid;
  readonly names: readonly string[];
  /**
   * Occurrence seule (D-536, point 4) : « Seul le créneau de l'occurrence ouverte est coloré (en-tête et pastille), les autres
   * sont grisés » ; seule cette colonne se modifie, sans changement de cycle ; les lignes se réordonnent (recette du 21/11/2026, c22-6).
   */
  readonly focusColumn?: number;
  readonly onChange: (grid: PlanningGrid) => void;
  readonly onCycle: (cycle: number) => void;
  readonly onChangeSessions: () => void;
  /** Réordonnancement des lignes (séances) du tableau. */
  readonly onMove: (from: number, to: number) => void;
  /** Une ligne est portée : le formulaire fige son défilement. */
  readonly onDraggingChange: (dragging: boolean) => void;
}) {
  const columns = Array.from({ length: CYCLE_MAX }, (_, index) => index);
  const [rowHeight, setRowHeight] = useState(40);
  const { drag, gesture, offset } = useRowDrag(names.length, rowHeight, onMove, onDraggingChange);
  const focused = focusColumn !== undefined;
  // Recette du 21/11/2026 (c22-6 — Hermann : « L'ordre choisi est conservé pour ce créneau seulement ») : les lignes se
  // réordonnent aussi pour un créneau seul. [Sans réordonnancement pour un créneau seul (D-536, point 4) — remplacé.]
  const reorderable = names.length > 1;
  return (
    <GestureHandlerRootView testID="planning-slot-grid">
      <View style={styles.gridHeader}>
        <Pressable onPress={onChangeSessions} accessibilityRole="button" hitSlop={8} style={styles.gridNames} testID="planning-change">
          <Text style={styles.change}>{t.change}</Text>
        </Pressable>
        {columns.map((column) => {
          const active = column < grid.cycle;
          const muted = focused && column !== focusColumn;
          return (
            <Pressable
              key={column}
              disabled={focused}
              onPress={() => onCycle(column + 1)}
              accessibilityRole="button"
              accessibilityLabel={fillTemplate(t.columnAccessibility, { n: String(column + 1) })}
              accessibilityState={{ selected: column + 1 === grid.cycle }}
              hitSlop={4}
              style={styles.gridColumn}
              testID={`planning-column-${column + 1}`}
            >
              <Text style={[styles.columnLabel, active && !muted ? null : styles.columnInactive]} testID={muted ? `planning-column-${column + 1}-muted` : undefined}>
                {fillTemplate(t.column, { n: String(column + 1) })}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {names.map((name, row) => {
        const line = grid.points[row] ?? [];
        const dy = offset(row);
        return (
          <GestureDetector key={`${row}-${name}`} gesture={gesture(row)}>
          <View
            onLayout={row === 0 ? (event) => setRowHeight(Math.max(1, event.nativeEvent.layout.height)) : undefined}
            style={[styles.gridRow, row > 0 ? styles.gridSeparator : null, dy !== 0 ? { transform: [{ translateY: dy }] } : null, drag?.index === row ? styles.rowDragging : null]}
            testID={`planning-row-${row}`}
          >
            {reorderable ? (
              <View
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={fillTemplate(t.reorderHandle, { name })}
                accessibilityActions={[
                  ...(row > 0 ? [{ name: "moveUp", label: t.moveUp }] : []),
                  ...(row < names.length - 1 ? [{ name: "moveDown", label: t.moveDown }] : []),
                ]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === "moveUp") onMove(row, row - 1);
                  if (event.nativeEvent.actionName === "moveDown") onMove(row, row + 1);
                }}
                hitSlop={8}
                style={styles.rowHandle}
                testID={`planning-row-${row}-handle`}
              >
                <View style={styles.rowHandleDots}>
                  <DragHandleDots />
                </View>
              </View>
            ) : null}
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
              const muted = focused && column !== focusColumn;
              return (
                <Pressable
                  key={column}
                  disabled={!active || muted}
                  onPress={() => onChange(focused ? toggleOccurrencePoint(grid, row, column) : togglePoint(grid, row, column))}
                  accessibilityRole="checkbox"
                  accessibilityLabel={fillTemplate(t.pointAccessibility, { name, n: String(column + 1) })}
                  accessibilityState={{ checked: played, disabled: !active }}
                  hitSlop={4}
                  style={styles.gridColumn}
                  testID={`planning-point-${row}-${column + 1}`}
                >
                  <View style={[styles.point, played ? styles.pointPlayed : null, muted ? styles.pointMuted : null]} />
                </Pressable>
              );
            })}
          </View>
          </GestureDetector>
        );
      })}
    </GestureHandlerRootView>
  );
}

/**
 * Calendrier natif (`DatePicker` graphique) du popover de date : le jour touché s'applique. Apparence claire forcée : le
 * panneau est blanc, et en mode sombre le calendrier écrivait en blanc sur blanc (recette du 19/11/2026, k19 : « on ne
 * voit rien … aucun texte, sauf la date du jour »).
 */
function DateCalendar({
  value,
  minimum,
  maximum,
  onChange,
}: {
  readonly value: LocalDate;
  readonly minimum: LocalDate;
  /** PROG-CAT-01 : fin du programme ; absent : aucune borne haute. */
  readonly maximum?: LocalDate;
  readonly onChange: (value: LocalDate) => void;
}) {
  if (Platform.OS !== "ios") return null;
  return (
    <View style={styles.calendar} testID="planning-date-panel">
      <Host matchContents colorScheme="light">
        <DatePicker
          selection={timeToDate(value, "12:00")}
          displayedComponents={["date"]}
          range={maximum === undefined ? { start: timeToDate(minimum, "00:00") } : { start: timeToDate(minimum, "00:00"), end: timeToDate(maximum, "23:59") }}
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
  // Message temporaire (constat d) : ancrage des Catalogues, en bas de l'écran.
  noticeAnchor: { position: "absolute", left: layout.screenGutter, right: layout.screenGutter, height: minTouchTarget },
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
  // Poignée de réordonnancement (`icon/poignee`, comme les lignes de la Composition), devant le nom.
  rowHandle: { width: 20, alignItems: "flex-start", justifyContent: "center" },
  // r20-ordre (20/11/2026) : six points de la modale des paramètres d'exécution, même taille et même répartition.
  rowHandleDots: { ...DRAG_HANDLE_SIZE, justifyContent: "space-between", paddingVertical: 2 },
  rowDragging: { zIndex: 1, opacity: 0.9, backgroundColor: colors.background },
  rowName: { ...type.supporting, fontFamily: type.listCardTitle.fontFamily, color: colors.textPrimary },
  rowMention: { ...type.supporting, fontSize: 10, lineHeight: 13, color: colors.textSecondary },
  point: { width: POINT_SIZE, height: POINT_SIZE, borderRadius: POINT_SIZE / 2, borderWidth: 1.5, borderColor: colors.cardsBorder },
  pointPlayed: { backgroundColor: colors.selection, borderColor: colors.selection },
  // Créneaux autres que celui de l'occurrence ouverte : grisés (D-536, point 4). [Opacité : choix technique, sans maquette.]
  pointMuted: { opacity: 0.3 },
  reminderCard: { flexDirection: "row", alignItems: "center" },
  reminderOptions: { flex: 1 },
  reminderOption: { ...type.listCardTitle },
  error: { ...type.label, color: colors.danger },
  calendar: { alignItems: "center" },
});
