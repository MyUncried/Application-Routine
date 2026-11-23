import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { formatLocalDate, occurrenceInstant, type LocalDate, type Routine } from "@/domain/planning/Routine";
import {
  draftFromProgram,
  duplicateProgramDraft,
  emptyProgramDraft,
  validateProgramDraft,
  type Program,
  type ProgramDraft,
} from "@/domain/programs/Program";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { PlanningPopover, type PopoverAnchor } from "@/features/planning/PlanningWheelPopover";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";
import { switchNudge } from "@/shared/ui/switchNudge";
import { colors, layout, spacing, switchOffColors, type } from "@/shared/ui/tokens";

import { formatDayMonthYear, routineSlotLine } from "./programPresentation";
import { requestProgramSheet, type AttachedRoutine } from "./programSheetRelay";
import { useProgramService } from "./ProgramServiceContext";
import { programStrings } from "./programStrings";

/**
 * Créer ou configurer un programme (CE-PROG-02 ; D-548, D-549, D-551 ; Figma « PROG — 13 » `12848:47314`) — modale iOS
 * (feuille native, comme la planification) au-dessus du catalogue.
 *
 * - En-tête : croix (fermer sans enregistrer), titre (« Nouveau programme » ou nom du programme), coche (D-499 : active quand
 *   le nom, la date de début et la date de fin sont renseignés et cohérents) qui enregistre.
 * - Zone de contexte Programmes : nom et objectif, modifiables d'un toucher.
 * - Période : « Du … au … », dates bleues sans cadre, calendrier natif.
 * - Planifications : routines rattachées (glisser à gauche : retirer du programme), « + Planifier une séance »,
 *   « Rattacher une routine existante ».
 * - Suivi de la douleur : interrupteur natif ; sans accord, la feuille de consentement s'ouvre (« PROG — 13b »).
 *
 * Recette du 23/11/2026 (p4-croix, Hermann : « La croix doit tout annuler ») : rattachements et retraits restent dans la modale
 * jusqu'à la coche ; la croix, ou la fermeture de la feuille par le geste, supprime les routines planifiées depuis la modale et
 * le programme enregistré pour les planifier (`ProgramService.discardModalWork`). Un nouveau programme est toujours enregistré
 * avant « + Planifier une séance » (la routine doit désigner un programme existant) ; « Rattacher… » ne l'enregistre plus.
 * [Interprétations techniques du 21/11/2026 — rattachement, retrait et planification appliqués aussitôt, croix limitée aux
 * champs du programme — remplacées.] L'accord au suivi de la douleur, valable pour toute l'application, n'est pas annulé.
 */

const t = programStrings.sheet;
const CALENDAR_MODIFIERS = [datePickerStyle("graphical"), tint(colors.primary)];
const DATE_PANEL_WIDTH = 360;
/** Figma « PROG — 13 » : objectif Inter Medium 14 #666C7E ; ligne secondaire d'une routine #9499A8. */
const OBJECTIVE_COLOR = "#666C7E";
const MUTED = "#9499A8";
const ROW_ACTION_WIDTH = 90;

type Params = { readonly programId?: string; readonly duplicateOf?: string };
type DateField = "START" | "END";

function dateAt(date: LocalDate, time: string): Date {
  return occurrenceInstant(date, time);
}

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
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [swipeLocked, setSwipeLocked] = useState(false);
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
  // Retour de la planification ou de « Rattacher… » : la liste est relue.
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines]),
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

  const save = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    persist()
      .then(async (program) => {
        if (program === null) return null;
        await programs.applyRoutineChanges(program, {
          detach: [...detaching],
          attach: attaching.map((item) => ({ routineId: item.routine.id, removeOutside: item.removeOutside })),
        });
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
        requestProgramSheet({
          kind: "consent",
          onAllow: () => {
            programs.grantPainConsent().then(
              () => update({ painTracking: true }),
              () => setSaveFailed(true),
            );
          },
          onCancel: () => undefined,
        });
        router.push("/pain-consent");
      },
      () => setSaveFailed(true),
    );
  };

  const openDate = (field: DateField) => {
    const node = (field === "START" ? startRef : endRef).current;
    node?.measureInWindow((x, y, width, height) => setPopover({ field, anchor: { x, y, width, height } }));
  };

  const title = stored === null ? t.titleNew : stored.name;

  return (
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
              {/* Période : une ligne « Du … au … », dates bleues sans cadre (D-548). */}
              <View style={[styles.card, styles.lineCard]} testID="program-period">
                <Text style={styles.label}>{t.from}</Text>
                <View ref={startRef} collapsable={false}>
                  <Pressable
                    onPress={() => openDate("START")}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.startAccessibility}, ${draft.startDate === null ? t.chooseDate : formatDayMonthYear(draft.startDate)}`}
                    hitSlop={8}
                    testID="program-start-date"
                  >
                    <Text style={styles.date}>{draft.startDate === null ? t.chooseDate : formatDayMonthYear(draft.startDate)}</Text>
                  </Pressable>
                </View>
                <Text style={styles.label}>{t.to}</Text>
                <View ref={endRef} collapsable={false}>
                  <Pressable
                    onPress={() => openDate("END")}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.endAccessibility}, ${draft.endDate === null ? t.chooseDate : formatDayMonthYear(draft.endDate)}`}
                    hitSlop={8}
                    testID="program-end-date"
                  >
                    <Text style={styles.date}>{draft.endDate === null ? t.chooseDate : formatDayMonthYear(draft.endDate)}</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t.plannings}
              </Text>
              <View style={styles.card} testID="program-plannings">
                {listed.map((routine) => (
                  <View key={routine.id}>
                    <SwipeActionsRow
                      actions={[{ key: "detach", label: t.detach, backgroundColor: colors.movementLevelAction, onPress: () => detach(routine.id) }]}
                      revealed={revealed === routine.id}
                      onReveal={() => setRevealed(routine.id)}
                      onHide={() => setRevealed((current) => (current === routine.id ? null : current))}
                      onPress={() => setRevealed(null)}
                      accessibilityLabel={`${routine.name}, ${routineSlotLine(routine)}`}
                      extraAccessibilityActions={[{ name: "detach", label: t.detachAccessibility.replace("{name}", routine.name), onAction: () => detach(routine.id) }]}
                      actionWidth={ROW_ACTION_WIDTH}
                      testID={`program-routine-${routine.id}-swipe`}
                    >
                      <View style={styles.routineRow} testID={`program-routine-${routine.id}`}>
                        <Text style={styles.routineName} numberOfLines={1}>
                          {routine.name}
                        </Text>
                        <Text style={styles.routineLine} numberOfLines={1}>
                          {routineSlotLine(routine)}
                        </Text>
                      </View>
                    </SwipeActionsRow>
                    <View style={styles.separator} />
                  </View>
                ))}
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
      <PlanningPopover anchor={popover?.anchor ?? null} width={DATE_PANEL_WIDTH} onDismiss={() => setPopover(null)} testID="program-date-popover">
        {popover !== null && Platform.OS === "ios" ? (
          <View style={styles.calendar}>
            <Host matchContents colorScheme="light">
              <DatePicker
                selection={dateAt(
                  (popover.field === "START" ? draft.startDate : draft.endDate) ?? draft.startDate ?? formatLocalDate(new Date()),
                  "12:00",
                )}
                displayedComponents={["date"]}
                {...(popover.field === "END" && draft.startDate !== null ? { range: { start: dateAt(draft.startDate, "00:00") } } : {})}
                onDateChange={(date) => {
                  const value = formatLocalDate(date);
                  if (popover.field === "START") {
                    // Fin antérieure au nouveau début : ramenée au début (période cohérente, D-499).
                    update({ startDate: value, ...(draft.endDate !== null && draft.endDate < value ? { endDate: value } : {}) });
                  } else update({ endDate: value });
                }}
                modifiers={CALENDAR_MODIFIERS}
              />
            </Host>
          </View>
        ) : null}
      </PlanningPopover>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  date: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, lineHeight: 18, color: colors.primary },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary, marginTop: spacing[8] },
  routineRow: { backgroundColor: colors.background, paddingHorizontal: spacing[12], paddingVertical: spacing[12], gap: 4 },
  routineName: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: colors.textPrimary },
  routineLine: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: MUTED },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[12] },
  linkRow: { minHeight: 40, justifyContent: "center", paddingHorizontal: spacing[12] },
  linkRowChevron: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, color: colors.primary },
  notice: { ...type.supporting, color: colors.textSecondary },
  error: { ...type.supporting, color: colors.danger },
  calendar: { width: DATE_PANEL_WIDTH },
});
