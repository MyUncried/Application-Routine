import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { formatLocalDate, type LocalDate, type Routine } from "@/domain/planning/Routine";
import {
  draftFromProgram,
  duplicateProgramDraft,
  emptyProgramDraft,
  validateProgramDraft,
  type Program,
  type ProgramDraft,
} from "@/domain/programs/Program";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { DATE_PANEL_WIDTH, DateCalendar, Pill } from "@/features/planning/PlanningControls";
import { PlanningPopover, PlanningWheelPopover, type PopoverAnchor } from "@/features/planning/PlanningWheelPopover";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";
import { switchNudge } from "@/shared/ui/switchNudge";
import { colors, layout, spacing, switchOffColors, type } from "@/shared/ui/tokens";

import {
  boundedEnd,
  datesInfoLine,
  DURATION_MAX,
  DURATION_MIN,
  DURATION_UNITS,
  durationEnd,
  durationFromDates,
  durationInfoLine,
  unitLabel,
  type DurationUnit,
  type PeriodDuration,
  type PeriodMode,
} from "./programPeriod";
import { formatDayMonthYear, routineProgramFrame, routineProgramLine } from "./programPresentation";
import { requestProgramSheet, type AttachedRoutine } from "./programSheetRelay";
import { useProgramService } from "./ProgramServiceContext";
import { postPlanningNotice, removedSlotsNotice } from "@/features/planning/planningNotice";
import { PainConsentDialog } from "./PainConsentSheet";
import { programStrings } from "./programStrings";

/**
 * Créer ou configurer un programme (CE-PROG-02 ; D-548, D-549, D-551 ; Figma « PROG — 13 » `12848:47314`) — modale iOS
 * (feuille native, comme la planification) au-dessus du catalogue.
 *
 * - En-tête : croix (fermer sans enregistrer), titre (« Créer un programme » ou « Modifier le programme », contre-recette du
 *   23/11/2026, m ; [« Nouveau programme » ou nom du programme — remplacé]), coche (D-499 : active quand
 *   le nom, la date de début et la date de fin sont renseignés et cohérents) qui enregistre.
 * - Zone de contexte Programmes : nom et objectif, modifiables d'un toucher.
 * - Période : « Du … au … » ; valeurs modifiables au format de la planification (`Pill`) et calendrier de la planification
 *   (`DateCalendar`, lot 5, 23/11/2026). [Dates bleues sans cadre, calendrier natif `UICalendarView` (D-563) — remplacés.]
 * - Planifications : routines rattachées (glisser à gauche : retirer du programme ; toucher : modifier la routine dans la
 *   planification, contre-recette du 23/11/2026, l), « + Planifier une séance », « Rattacher une routine existante ».
 * - Suivi de la douleur : interrupteur natif ; sans accord, la fenêtre de consentement (« PROG — 13b ») s'ouvre au centre, sur un
 *   voile gris, la modale restant ouverte (contre-recette du 23/11/2026, a). [Feuille native posée sur la modale — remplacée.]
 *
 * Recette du 23/11/2026 (p4-croix, Hermann : « La croix doit tout annuler ») : rattachements et retraits restent dans la modale
 * jusqu'à la coche ; la croix, ou la fermeture de la feuille par le geste, supprime les routines planifiées depuis la modale et
 * le programme enregistré pour les planifier (`ProgramService.discardModalWork`). Un nouveau programme est toujours enregistré
 * avant « + Planifier une séance » (la routine doit désigner un programme existant) ; « Rattacher… » ne l'enregistre plus.
 * [Interprétations techniques du 21/11/2026 — rattachement, retrait et planification appliqués aussitôt, croix limitée aux
 * champs du programme — remplacées.] L'accord au suivi de la douleur, valable pour toute l'application, n'est pas annulé.
 */

const t = programStrings.sheet;
/** Figma « PROG — 13 » : objectif Inter Medium 14 #666C7E ; ligne secondaire d'une routine #9499A8. */
const OBJECTIVE_COLOR = "#666C7E";
const MUTED = "#9499A8";
const ROW_ACTION_WIDTH = 90;
const DURATION_COUNTS = Array.from({ length: DURATION_MAX - DURATION_MIN + 1 }, (_, index) => DURATION_MIN + index);
/** [Interprétation] « pendant » choisi sans fin connue : 1 jour (borne basse de D-543). */
const DEFAULT_DURATION: PeriodDuration = { unit: "DAY", count: DURATION_MIN };
const tp = programStrings.period;

/** D-543 : raccourcissement confirmé (« N créneaux seront supprimés »), appliqué à la coche. */
type Shortening = { readonly count: number; readonly routineIds: readonly string[]; readonly previousEnd: LocalDate; readonly nextEnd: LocalDate };

type Params = { readonly programId?: string; readonly duplicateOf?: string };
type DateField = "START" | "END";

export function ProgramSheetScreen({ params }: { readonly params: Params }) {
  const router = useRouter();
  const programs = useProgramService();
  const [draft, setDraft] = useState<ProgramDraft | null>(() =>
    params.programId === undefined && params.duplicateOf === undefined ? emptyProgramDraft() : null,
  );
  // Programme enregistré (configuration, ou nouveau programme enregistré avant de planifier) ; `null` : création.
  const [stored, setStored] = useState<Program | null>(null);
  // Routines rattachées enregistrées ; retraits et rattachements de la modale, écrits à la coche (p4-croix).
  const [routines, setRoutines] = useState<readonly Routine[]>([]);
  const [attaching, setAttaching] = useState<readonly AttachedRoutine[]>([]);
  const [detaching, setDetaching] = useState<ReadonlySet<string>>(() => new Set());
  // Travail à défaire si la modale est fermée sans la coche : programme enregistré pour planifier, routines planifiées.
  const createdProgramRef = useRef<string | null>(null);
  const createdRoutinesRef = useRef<Set<string>>(new Set());
  const knownRoutinesRef = useRef<ReadonlySet<string> | null>(null);
  const committedRef = useRef(false);
  const programsRef = useRef(programs);
  useEffect(() => {
    programsRef.current = programs;
  }, [programs]);
  useEffect(
    () => () => {
      if (committedRef.current) return;
      const routinesToDelete = [...createdRoutinesRef.current];
      const programToDelete = createdProgramRef.current;
      if (routinesToDelete.length === 0 && programToDelete === null) return;
      programsRef.current.discardModalWork(routinesToDelete, programToDelete).catch((error: unknown) => {
        console.error("Le travail de la modale du programme n'a pas pu être annulé.", error);
      });
    },
    [],
  );
  const [popover, setPopover] = useState<{ readonly field: DateField; readonly anchor: PopoverAnchor } | null>(null);
  // D-543 : « au [date] » ou « pendant [N] [unité] » ; le mode n'est pas enregistré (le programme garde début et fin).
  const [periodMode, setPeriodMode] = useState<PeriodMode>("DATES");
  const [duration, setDuration] = useState<PeriodDuration>(DEFAULT_DURATION);
  const [countAnchor, setCountAnchor] = useState<PopoverAnchor | null>(null);
  const [shortening, setShortening] = useState<Shortening | null>(null);
  const countRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const [consentAsked, setConsentAsked] = useState(false);
  const formRef = useRef<ScrollView>(null);
  // D-565 (recette du 23/11/2026, constat f) : verrou posé tout de suite sur la vue native (comme l'Agenda) ; sinon la liste prenait
  // le geste et l'annulait — la routine revenait à sa position précédente (« rebond »).
  const lockList = useCallback((locked: boolean) => {
    try {
      formRef.current?.setNativeProps({ scrollEnabled: !locked });
    } catch {
      // Vue native indisponible (tests, démontage) : l'état de l'écran suffit.
    }
    setSwipeLocked(locked);
  }, []);
  const startRef = useRef<View>(null);
  const endRef = useRef<View>(null);
  const savingRef = useRef(false);
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Chargement : configuration (programme existant) ou copie (Dupliquer, décision de Hermann du 21/11/2026).
  useEffect(() => {
    let cancelled = false;
    const source = params.programId ?? params.duplicateOf;
    if (source === undefined) return undefined;
    programs.getProgram(source).then(
      (program) => {
        if (cancelled) return;
        if (program === null) {
          routerRef.current.back();
          return;
        }
        if (params.programId !== undefined) {
          setStored(program);
          setDraft(draftFromProgram(program));
        } else {
          setDraft(duplicateProgramDraft(program));
        }
      },
      () => routerRef.current.back(),
    );
    return () => {
      cancelled = true;
    };
  }, [params.programId, params.duplicateOf, programs]);

  const storedId = stored?.id ?? null;
  const loadRoutines = useCallback(() => {
    if (storedId === null) {
      setRoutines([]);
      return;
    }
    programs.routinesOf(storedId).then(
      (list) => {
        // Retour de « + Planifier une séance » : la routine créée est notée, pour être supprimée si la modale est annulée.
        const known = knownRoutinesRef.current;
        if (known !== null) {
          for (const routine of list) if (!known.has(routine.id)) createdRoutinesRef.current.add(routine.id);
          knownRoutinesRef.current = null;
        }
        setRoutines(list);
      },
      () => undefined,
    );
  }, [programs, storedId]);
  // Contre-recette du 23/11/2026 (l) : une routine rattachée dans la modale (pas encore enregistrée dans le programme) peut avoir
  // été modifiée depuis sa ligne ; elle est relue au retour (supprimée entre-temps : retirée de la liste).
  const attachingRef = useRef(attaching);
  useEffect(() => {
    attachingRef.current = attaching;
  }, [attaching]);
  const refreshAttaching = useCallback(() => {
    const requested = new Set(attachingRef.current.map((item) => item.routine.id));
    if (requested.size === 0) return;
    programs.routinesByIds([...requested]).then(
      (list) => {
        const fresh = new Map(list.map((routine) => [routine.id, routine]));
        setAttaching((current) =>
          current.flatMap((item) => {
            if (!requested.has(item.routine.id)) return [item];
            const routine = fresh.get(item.routine.id);
            return routine === undefined ? [] : [{ ...item, routine }];
          }),
        );
      },
      () => undefined,
    );
  }, [programs]);
  // Retour de la planification ou de « Rattacher… » : la liste est relue.
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
      refreshAttaching();
    }, [loadRoutines, refreshAttaching]),
  );

  if (draft === null) return <ScreenShell backgroundColor={colors.catalogueProgramsBackground}>{null}</ScreenShell>;

  const issues = validateProgramDraft(draft);
  const canSave = issues.length === 0 && !saving;
  const update = (patch: Partial<ProgramDraft>) => {
    setHint(false);
    setDraft((current) => (current === null ? current : { ...current, ...patch }));
  };

  /** Enregistre les champs du programme ; rend le programme enregistré, ou `null` en cas d'échec. */
  const persist = async (): Promise<Program | null> => {
    const result = stored === null ? await programs.createProgram(draft) : await programs.updateProgram(stored.id, draft);
    if (result.status !== "SAVED") return null;
    setStored(result.program);
    return result.program;
  };

  /**
   * D-543 (« Raccourcir la période : si des créneaux d'une planification dépassent la nouvelle fin, confirmation « N créneaux
   * seront supprimés » ») : la coche compte d'abord les créneaux à venir des routines du programme entre la nouvelle fin et
   * l'ancienne ; s'il y en a, la confirmation s'ouvre ; « Confirmer » enregistre et les supprime, « Annuler » n'enregistre rien.
   */
  const save = () => {
    if (!canSave || savingRef.current) return;
    const previousEnd = stored?.endDate ?? null;
    const nextEnd = draft.endDate;
    const kept = routines.filter((routine) => !detaching.has(routine.id)).map((routine) => routine.id);
    if (previousEnd === null || nextEnd === null || nextEnd >= previousEnd || kept.length === 0) {
      commit(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    programs.shortenedSlotCount(kept, previousEnd, nextEnd).then(
      (count) => {
        savingRef.current = false;
        setSaving(false);
        if (count > 0) setShortening({ count, routineIds: kept, previousEnd, nextEnd });
        else commit(null);
      },
      () => {
        savingRef.current = false;
        setSaving(false);
        setSaveFailed(true);
      },
    );
  };

  const commit = (shorten: Shortening | null) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    persist()
      .then(async (program) => {
        if (program === null) return null;
        const removed = await programs.applyRoutineChanges(program, {
          detach: [...detaching],
          attach: attaching.map((item) => ({ routineId: item.routine.id, removeOutside: item.removeOutside })),
        });
        if (shorten !== null) await programs.removeShortenedSlots(shorten.routineIds, shorten.previousEnd, shorten.nextEnd);
        // d3 (23/11, Hermann) : snackbar du nombre de créneaux supprimés, affichée par l'écran qui reprend le focus.
        if (removed > 0) postPlanningNotice(removedSlotsNotice(removed));
        return program;
      })
      .then(
      (program) => {
        savingRef.current = false;
        setSaving(false);
        if (program !== null) {
          committedRef.current = true;
          router.back();
        } else setSaveFailed(true);
      },
      (error: unknown) => {
        console.error("Le programme n'a pas pu être enregistré.", error);
        savingRef.current = false;
        setSaving(false);
        setSaveFailed(true);
      },
    );
  };

  /** Programme existant pour « + Planifier » et « Rattacher… » : un nouveau programme valide est d'abord enregistré. */
  const withStoredProgram = (then: (program: Program) => void) => {
    if (stored !== null) {
      then(stored);
      return;
    }
    if (issues.length > 0) {
      setHint(true);
      return;
    }
    persist().then(
      (program) => {
        if (program === null) {
          setSaveFailed(true);
          return;
        }
        createdProgramRef.current = program.id;
        then(program);
      },
      () => setSaveFailed(true),
    );
  };

  const plan = () =>
    withStoredProgram((program) => {
      knownRoutinesRef.current = new Set(routines.map((routine) => routine.id));
      router.push({ pathname: "/planning", params: { programId: program.id } });
    });
  /**
   * Contre-recette du 23/11/2026 (l, Hermann : « Puisque je peux créer une routine à partir de l'écran du programme, je dois
   * pouvoir la modifier de là aussi : […] appuyer sur la ligne de la routine doit l'ouvrir en modification, en modale ») : même
   * feuille de planification que le Journal (`/planning`, `routineId`). La modification est enregistrée par la planification
   * elle-même, comme depuis le Journal : la croix de la modale du programme ne l'annule pas (seules les routines planifiées
   * depuis la modale sont supprimées, p4-croix).
   */
  const edit = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { routineId } });
  };
  // p4-rattacher : plusieurs routines, rendues sans écriture ; la période du brouillon sert aux décomptes (D-566).
  const attach = () => {
    if (draft.startDate === null || draft.endDate === null || issues.length > 0) {
      setHint(true);
      return;
    }
    requestProgramSheet({
      kind: "attach",
      period: { start: draft.startDate, end: draft.endDate },
      excluded: new Set([...routines.filter((routine) => !detaching.has(routine.id)), ...attaching.map((item) => item.routine)].map((routine) => routine.id)),
      released: detaching,
      onAttach: (added) => {
        const ids = new Set(added.map((item) => item.routine.id));
        setDetaching((current) => new Set([...current].filter((id) => !ids.has(id))));
        // Une routine retirée puis rattachée de nouveau redevient une routine enregistrée du programme.
        setAttaching((current) => [...current, ...added.filter((item) => !routines.some((routine) => routine.id === item.routine.id))]);
      },
    });
    router.push("/program-attach");
  };
  const detach = (routineId: string) => {
    setRevealed(null);
    if (attaching.some((item) => item.routine.id === routineId)) {
      setAttaching((current) => current.filter((item) => item.routine.id !== routineId));
      return;
    }
    setDetaching((current) => new Set([...current, routineId]));
  };
  const listed = [...routines.filter((routine) => !detaching.has(routine.id)), ...attaching.map((item) => item.routine)];

  // D-551 : activer sans accord ouvre la feuille de consentement ; Autoriser enregistre l'accord et active l'interrupteur ;
  // Annuler le laisse désactivé. Les activations suivantes ne redemandent pas l'accord.
  const togglePain = (value: boolean) => {
    if (!value) {
      update({ painTracking: false });
      return;
    }
    programs.painConsentAt().then(
      (consent) => {
        if (consent !== null) {
          update({ painTracking: true });
          return;
        }
        // Contre-recette du 23/11/2026 (a) : fenêtre centrée sur un voile gris, la modale du programme reste ouverte.
        setConsentAsked(true);
      },
      () => setSaveFailed(true),
    );
  };
  const answerConsent = (allow: boolean) => {
    setConsentAsked(false);
    if (!allow) return;
    programs.grantPainConsent().then(
      () => update({ painTracking: true }),
      () => setSaveFailed(true),
    );
  };

  const openDate = (field: DateField) => {
    const node = (field === "START" ? startRef : endRef).current;
    node?.measureInWindow((x, y, width, height) => {
      setPopover({ field, anchor: { x, y, width, height } });
    });
  };

  // D-543 : changement de mode sans perte — de dates vers durée, en jours, ou en semaines si multiple de 7 ; de durée vers dates,
  // la fin calculée est gardée.
  const chooseMode = (mode: PeriodMode) => {
    if (mode === periodMode) return;
    if (mode === "DURATION") {
      const next = draft.startDate !== null && draft.endDate !== null ? durationFromDates(draft.startDate, boundedEnd(draft.startDate, draft.endDate)) : DEFAULT_DURATION;
      setDuration(next);
      if (draft.startDate !== null) update({ endDate: durationEnd(draft.startDate, next) });
    }
    setPeriodMode(mode);
  };
  const changeDuration = (next: PeriodDuration) => {
    setDuration(next);
    if (draft.startDate !== null) update({ endDate: durationEnd(draft.startDate, next) });
  };
  const openCount = () => {
    countRef.current?.measureInWindow((x, y, width, height) => setCountAnchor({ x, y, width, height }));
  };
  const periodInfo =
    draft.startDate === null || draft.endDate === null
      ? null
      : periodMode === "DATES"
        ? datesInfoLine(draft.startDate, boundedEnd(draft.startDate, draft.endDate))
        : durationInfoLine(draft.startDate, draft.endDate, duration.unit);
  const modeLabel = periodMode === "DATES" ? tp.modeDates : tp.modeDuration;

  // Contre-recette du 23/11/2026 (m) : « Créer un programme » (création, copie) ; « Modifier le programme » (programme ouvert
  // depuis le catalogue). Un nouveau programme enregistré pour planifier reste en création.
  const title = params.programId === undefined ? t.titleNew : t.titleEdit;

  return (
    // Contre-recette du 23/11/2026 (r3) : racine des gestes natifs propre à la feuille (formSheet, présentée hors de la vue
    // racine), comme la feuille Planifier : le glissement des routines y est porté par le Pan natif (`SwipeActionsRow`,
    // `nativeGesture`), qui empêche celui de la feuille.
    <GestureHandlerRootView style={styles.gestureRoot}>
    <ScreenShell backgroundColor={colors.catalogueProgramsBackground}>
      <NativeSheetTop
        title={title}
        onClose={() => router.back()}
        closeAccessibilityLabel={t.cancel}
        validate={{ onPress: save, enabled: canSave, accessibilityLabel: t.save }}
        headerBackground={colors.background}
        bandColor={colors.catalogueProgramsContext}
        band={
          <View style={styles.band}>
            <TextInput
              value={draft.name}
              onChangeText={(name) => update({ name })}
              placeholder={t.namePlaceholder}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.nameAccessibility}
              style={styles.name}
              returnKeyType="done"
              testID="program-name"
            />
            <TextInput
              value={draft.objective}
              onChangeText={(objective) => update({ objective })}
              placeholder={t.objectivePlaceholder}
              placeholderTextColor={MUTED}
              accessibilityLabel={t.objectiveAccessibility}
              style={styles.objective}
              returnKeyType="done"
              testID="program-objective"
            />
          </View>
        }
        renderScroll={(topHeight) => (
          <SwipeScrollLockContext.Provider value={lockList}>
            <ScrollView
              ref={formRef}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              style={styles.scroll}
              contentContainerStyle={[styles.content, { paddingTop: topHeight + spacing[12] }]}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={!swipeLocked}
              testID="program-form"
            >
              {/* Période (D-548, D-543 ; Figma « PROG — 13 », carte Période de 64) : « Du [date] », puis « au [date] » ou
                  « pendant [N] [unité] » (le mot est une valeur modifiable ; [menu natif — remplacé, lot 5, y4]), puis la ligne
                  d'information en gris, non modifiable. [Une seule ligne « Du … au … » de 44 — remplacée.] */}
              <View style={[styles.card, styles.periodCard]} testID="program-period">
              {/* Lot 5, 23/11/2026 (y4 — Hermann : « Les mots « pendant » et « semaine » sont tronqués. Il n'y a pas de démarcation
                  entre les mots éditables, prendre l'exemple du format de texte de l'écran de planification. ») : chaque valeur
                  modifiable est une `Pill` de la planification ; « au » / « pendant » et l'unité basculent d'un toucher, comme
                  « jusqu'au » / « pendant » et l'unité de la planification. [Menus SwiftUI (`Host matchContents`), qui tronquaient
                  leur libellé, et valeurs bleues sans cadre — remplacés.] */}
              <View style={styles.periodLine}>
                <Text style={styles.periodLabel}>{t.from}</Text>
                <View ref={startRef} collapsable={false}>
                  <Pill
                    label={draft.startDate === null ? t.chooseDate : formatDayMonthYear(draft.startDate)}
                    onPress={() => openDate("START")}
                    accessibilityLabel={`${t.startAccessibility}, ${draft.startDate === null ? t.chooseDate : formatDayMonthYear(draft.startDate)}`}
                    testID="program-start-date"
                  />
                </View>
                <Pill
                  label={modeLabel}
                  onPress={() => chooseMode(periodMode === "DATES" ? "DURATION" : "DATES")}
                  accessibilityLabel={tp.modeAccessibility.replace("{value}", modeLabel)}
                  testID="program-period-mode"
                />
                {periodMode === "DATES" ? (
                  <View ref={endRef} collapsable={false}>
                    <Pill
                      label={draft.endDate === null ? t.chooseDate : formatDayMonthYear(draft.endDate)}
                      onPress={() => openDate("END")}
                      accessibilityLabel={`${t.endAccessibility}, ${draft.endDate === null ? t.chooseDate : formatDayMonthYear(draft.endDate)}`}
                      testID="program-end-date"
                    />
                  </View>
                ) : (
                  <>
                    <View ref={countRef} collapsable={false}>
                      <Pill
                        label={String(duration.count)}
                        onPress={openCount}
                        accessibilityLabel={tp.countAccessibility.replace("{value}", String(duration.count))}
                        testID="program-period-count"
                      />
                    </View>
                    <Pill
                      label={unitLabel(duration.unit, duration.count)}
                      onPress={() => changeDuration({ unit: nextUnit(duration.unit), count: duration.count })}
                      accessibilityLabel={tp.unitAccessibility.replace("{value}", unitLabel(duration.unit, duration.count))}
                      testID="program-period-unit"
                    />
                  </>
                )}
              </View>
              {periodInfo === null ? null : (
                <Text style={styles.periodInfo} testID="program-period-info">
                  {periodInfo}
                </Text>
              )}
              </View>

              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t.plannings}
              </Text>
              <View style={styles.card} testID="program-plannings">
                {/* D-544 (Figma « PROG — 13 », carte Planifications) : routines au format des lignes du Journal
                    (`JournalRoutineCard` compacte), séparées de 8, puis le filet et les actions. [Nom et « créneau · N contenus »
                    séparés par un filet — remplacés.] */}
                {listed.length === 0 ? null : (
                <View style={styles.routines}>
                {listed.map((routine) => {
                  // Lot 5, 23/11/2026 (point 4, D-544) : cadre = début de la routine dans le programme ; ligne = créneaux de la
                  // routine dans la période et fin (jour, mois) bornée par celle du programme. [Date de création — remplacée.]
                  const frame = routineProgramFrame(routine, draft);
                  const line = routineProgramLine(routine, draft);
                  return (
                    <SwipeActionsRow
                      key={routine.id}
                      actions={[{ key: "detach", label: t.detach, backgroundColor: colors.movementLevelAction, onPress: () => detach(routine.id) }]}
                      revealed={revealed === routine.id}
                      onReveal={() => setRevealed(routine.id)}
                      onHide={() => setRevealed((current) => (current === routine.id ? null : current))}
                      onPress={() => edit(routine.id)}
                      accessibilityLabel={`${routine.name}, ${line}`}
                      accessibilityHint={t.routineEditAccessibility}
                      extraAccessibilityActions={[{ name: "detach", label: t.detachAccessibility.replace("{name}", routine.name), onAction: () => detach(routine.id) }]}
                      actionWidth={ROW_ACTION_WIDTH}
                      nativeGesture
                      testID={`program-routine-${routine.id}-swipe`}
                    >
                      <JournalRoutineCard
                        compact
                        date={frame.day}
                        year={frame.year}
                        name={routine.name}
                        parcours={routine.entries.length > 1}
                        detail=""
                        slots={line}
                        planned
                        expanded={false}
                        onOpen={noop}
                        onToggleExpanded={noop}
                        testID={`program-routine-${routine.id}`}
                      />
                    </SwipeActionsRow>
                  );
                })}
                </View>
                )}
                {listed.length === 0 ? null : <View style={styles.separator} />}
                <Pressable onPress={plan} accessibilityRole="button" style={styles.linkRow} testID="program-plan">
                  <Text style={styles.link}>{t.plan}</Text>
                </Pressable>
                <View style={styles.separator} />
                <Pressable onPress={attach} accessibilityRole="button" style={[styles.linkRow, styles.linkRowChevron]} testID="program-attach">
                  <Text style={styles.link}>{t.attach}</Text>
                  <KodjoIcon name="chevron-aller" />
                </Pressable>
              </View>
              {hint ? (
                <Text style={styles.notice} accessibilityLiveRegion="polite" testID="program-save-first">
                  {t.saveBeforePlanning}
                </Text>
              ) : null}

              {/* Suivi de la douleur (D-551) : interrupteur natif, désactivé par défaut. */}
              <View style={[styles.card, styles.lineCard, styles.switchCard]} testID="program-pain">
                <Text style={styles.label}>{t.painTracking}</Text>
                {/* Recette du 23/11/2026 (p4-douleur) : interrupteur au format du Profil (désactivé visible, centré sur sa ligne). */}
                <Switch
                  {...switchOffColors}
                  style={switchNudge}
                  value={draft.painTracking}
                  onValueChange={togglePain}
                  accessibilityLabel={t.painTracking}
                  testID="program-pain-switch"
                />
              </View>
              {saveFailed ? (
                <Text style={styles.error} accessibilityLiveRegion="polite" testID="program-save-error">
                  {t.saveFailed}
                </Text>
              ) : null}
            </ScrollView>
          </SwipeScrollLockContext.Provider>
        )}
      />
      {/* Lot 5, 23/11/2026 (Hermann : « Pour le calendrier du programme utilisé exactement celui de la planification (format,
          dimensions). On oublie le marquage des périodes dans le calendrier. ») : `DateCalendar` de la planification, popover de
          360, qui reste ouvert après le choix d'un jour. [Calendrier natif unique `UICalendarView` à périodes marquées (D-563) —
          remplacé.] Début sans borne basse ; fin bornée par le début. */}
      <PlanningPopover anchor={popover?.anchor ?? null} width={DATE_PANEL_WIDTH} onDismiss={() => setPopover(null)} testID="program-date-popover">
        {popover !== null ? (
          <DateCalendar
            value={(popover.field === "START" ? draft.startDate : draft.endDate) ?? draft.startDate ?? formatLocalDate(new Date())}
            {...(popover.field === "END" && draft.startDate !== null ? { minimum: draft.startDate } : {})}
            onChange={(value) => {
              if (popover.field === "START" && periodMode === "DURATION") update({ startDate: value, endDate: durationEnd(value, duration) });
              else if (popover.field === "START") {
                // Fin antérieure au nouveau début : ramenée au début (période cohérente, D-499).
                update({ startDate: value, ...(draft.endDate !== null && draft.endDate < value ? { endDate: value } : {}) });
              } else update({ endDate: value });
            }}
            testID="program-date-panel"
          />
        ) : null}
      </PlanningPopover>
      {/* D-543 : nombre de la durée, roulette native en popover près du champ (même composant que « pendant N » de la planification). */}
      <PlanningWheelPopover
        anchor={countAnchor}
        columns={[
          {
            values: DURATION_COUNTS,
            selected: duration.count,
            onChange: (count) => changeDuration({ unit: duration.unit, count }),
            accessibilityLabel: tp.countAccessibility.replace("{value}", String(duration.count)),
            testID: "program-period-count-wheel",
          },
        ]}
        onDismiss={() => setCountAnchor(null)}
        android={
          <NumberWheelPicker
            value={duration.count}
            accessibilityLabel={tp.countAccessibility.replace("{value}", String(duration.count))}
            onCancel={() => setCountAnchor(null)}
            onValidate={(count) => {
              setCountAnchor(null);
              changeDuration({ unit: duration.unit, count: Math.max(DURATION_MIN, Math.min(DURATION_MAX, count)) });
            }}
            cancelAccessibilityLabel={tp.shortenedCancel}
            validateAccessibilityLabel={tp.validate}
          />
        }
        testID="program-period-count-popover"
      />
      {shortening !== null ? (
        <DecisionDialog
          title={shortening.count === 1 ? tp.shortenedOne : tp.shortenedMany.replace("{count}", String(shortening.count))}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message=""
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={tp.shortenedCancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={tp.shortenedConfirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setShortening(null)}
          onConfirm={() => {
            const confirmed = shortening;
            setShortening(null);
            commit(confirmed);
          }}
          testIDPrefix="program-shortened"
        />
      ) : null}
      <PainConsentDialog visible={consentAsked} onCancel={() => answerConsent(false)} onAllow={() => answerConsent(true)} />
    </ScreenShell>
    </GestureHandlerRootView>
  );
}

function noop() {}

/** Lot 5, 23/11/2026 (y4) : l'unité de la durée bascule d'un toucher (jours → semaines → mois → jours). */
function nextUnit(unit: DurationUnit): DurationUnit {
  return DURATION_UNITS[(DURATION_UNITS.indexOf(unit) + 1) % DURATION_UNITS.length] ?? unit;
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  // Figma « PROG — 13 » : nom Inter Semi Bold 20 #141414, objectif 12 dessous.
  band: { paddingHorizontal: layout.screenGutter, gap: spacing[8] },
  name: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 20, color: colors.textPrimary, padding: 0 },
  objective: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: OBJECTIVE_COLOR, padding: 0 },
  scroll: { flex: 1 },
  // Cartes de 354 (marges 16), séparées de 12 (D-548).
  content: { paddingHorizontal: layout.screenGutter, paddingBottom: spacing[32], gap: spacing[12] },
  card: { backgroundColor: colors.background, borderRadius: 12, overflow: "hidden" },
  lineCard: { minHeight: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing[16], gap: spacing[8] },
  switchCard: { justifyContent: "space-between" },
  label: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: colors.textPrimary },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary, marginTop: spacing[8] },
  // D-543 (Figma « PROG — 13 », carte Période de 64) : ligne des valeurs (26), information à 6 dessous, en gris (Inter Regular 12).
  periodCard: { paddingHorizontal: spacing[16], paddingVertical: spacing[8], gap: spacing[6] },
  // Lot 5, 23/11/2026 (y4) : ligne et libellé au format de la planification (`wrapLine`, `label` 16 de `PlanningScreen`).
  periodLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing[8] },
  periodLabel: { ...type.body, fontSize: 16, lineHeight: 20, color: colors.textPrimary },
  periodInfo: { ...type.supporting, color: colors.textSecondary },
  // D-544 (Figma « PROG — 13 ») : routines à 8 du haut de la carte, 8 entre elles, filet à 8 sous la dernière.
  routines: { paddingVertical: spacing[8], gap: spacing[8] },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[12] },
  linkRow: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing[12] },
  linkRowChevron: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, color: colors.primary },
  notice: { ...type.supporting, color: colors.textSecondary },
  error: { ...type.supporting, color: colors.danger },
});
