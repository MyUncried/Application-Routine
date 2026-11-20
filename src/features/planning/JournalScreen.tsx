import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatLocalDate, type Routine } from "@/domain/planning/Routine";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { useBodyZonesReferential } from "@/features/activities/useBodyZonesReferential";
import { zonesLine } from "@/features/planning/agendaFormat";
import { CALENDAR_PALETTE, calendarTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import {
  creationDateParts,
  journalCounts,
  journalSlotsLine,
  isJournalRoutineVisible,
  matchesJournalQuery,
  sortJournal,
} from "@/features/planning/journal";
import { JOURNAL_ROW_HEIGHT, JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import type { RoutineDeletionPlan } from "@/features/planning/PlanningService";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";
import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Calendrier — Journal des routines (D-535, DSF Journal du 19/11/2026 ; Figma « Calendrier — Journal — MVP »
 * `1992:5510`). Remplace la vue Jour : la liste des routines créées, et non leur planification dans le temps — une carte
 * par routine, quelle que soit sa récurrence ou son nombre de séances.
 *
 * - Zone de contexte (bande 402 × 115 inchangée, composant partagé des Catalogues `CatalogueContextZone`) : ligne 1
 *   « Planifiées N · Terminées N » (recette du 19/11 au soir ; [« Actives » — remplacé]) ; ligne 2 Rechercher, Filtre, Tri, Planifier. Aucune navigation par date.
 * - Liste : cartes espacées de 8, sans séparateur, sans date de regroupement, sans bouton d'action ni glissement.
 * - Tri par défaut : création / modification, la plus récente en haut. Le contrôle Tri reste celui des Catalogues
 *   (présent, inactif) : aucun autre ordre n'est défini.
 * - Filtres : feuille des filtres du Catalogue des séances, réutilisée telle quelle ; une routine est retenue quand
 *   l'une de ses séances l'est. [À CLARIFIER (D-535) : écran de filtre du Journal non dessiné ; « spécialité » et
 *   « programme » absents du modèle.]
 * - Toucher la carte la déploie (filet, puis composition des séances, comme l'Agenda) ; le crayon ouvre la routine.
 */
export function JournalScreen({ onChangeView }: { readonly onChangeView: (view: CalendarView) => void }) {
  const t = planningStrings.journal;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const planning = usePlanningService();
  const { state: catalogue, reload: reloadCatalogue, cancelPending } = useSessionCatalogue();
  const [routines, setRoutines] = useState<readonly Routine[] | null>(null);
  const [activeRoutines, setActiveRoutines] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [loadFailed, setLoadFailed] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SessionCatalogueFilters>(EMPTY_SESSION_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ readonly routine: Routine; readonly plan: RoutineDeletionPlan } | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const requestId = useRef(0);
  // Recette du 20/11/2026 (constat A — Hermann : « Quand on fait glisser gauche dans le journal ou l'agenda, la liste doit
  // rester figée. ») : verrou partagé des cartes à actions glissées (`SwipeScrollLockContext`), comme les Catalogues.
  const listRef = useRef<ScrollView>(null);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const lockList = useCallback((locked: boolean) => {
    try {
      listRef.current?.setNativeProps({ scrollEnabled: !locked });
    } catch {
      // Vue native indisponible (tests, démontage) : l'état de l'écran suffit.
    }
    setSwipeLocked(locked);
  }, []);

  const load = useCallback(() => {
    const id = ++requestId.current;
    // D-540 : état actif / terminé calculé par le service (créneaux commencés, rattrapables, expirés).
    Promise.all([planning.listRoutines(), planning.routineActivity()]).then(
      ([list, activity]) => {
        if (id !== requestId.current) return;
        setRoutines(list);
        setActiveRoutines(activity);
        setLoadFailed(false);
      },
      (error: unknown) => {
        if (id !== requestId.current) return;
        console.error("Le journal n'a pas pu être chargé.", error);
        setLoadFailed(true);
      },
    );
  }, [planning]);

  useFocusEffect(
    useCallback(() => {
      reloadCatalogue();
      load();
      return () => {
        cancelPending();
        setRevealed(null);
      };
    }, [reloadCatalogue, cancelPending, load]),
  );

  const projections = useMemo(() => {
    const map = new Map<string, SessionCatalogueProjection>();
    if (catalogue.status === "ready") for (const projection of catalogue.sessions) map.set(projection.id, projection);
    return map;
  }, [catalogue]);
  const bodyZones = useBodyZonesReferential();
  const zoneName = useMemo(() => new Map(bodyZones.map((zone) => [zone.id, zone.name])), [bodyZones]);

  const today = formatLocalDate(new Date());
  const all = useMemo(() => sortJournal(routines ?? []), [routines]);
  const isActive = (routine: Routine) => activeRoutines.get(routine.id) === true;
  const counts = journalCounts(all, isActive);
  const sessionsOf = (routine: Routine) =>
    routine.entries.map((entry) => projections.get(entry.sessionId)).filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
  const visible = all.filter((routine) => {
    const sessions = sessionsOf(routine);
    return matchesJournalQuery(routine, sessions, query) && isJournalRoutineVisible(isActive(routine), sessions, filters);
  });

  const tSessions = strings.screens.sessions;
  const filterSummary =
    filterLabels.length === 0
      ? null
      : filterLabels.length === 1
        ? filterLabels[0]!
        : fillTemplate(tSessions.catalogueFilters.activeSummary, { count: String(filterLabels.length) });

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const titleOf = (routine: Routine, sessions: readonly SessionCatalogueProjection[]) =>
    routine.name.trim() !== "" ? routine.name : sessions.map((session) => session.name).join(", ");

  const openRoutine = (routineId: string) => {
    setRevealed(null);
    router.push({ pathname: "/planning", params: { routineId } });
  };

  const removeRoutine = (routineId: string) => {
    setDeleteCandidate(null);
    setActionFailed(false);
    planning.deleteRoutine(routineId).then(
      () => load(),
      (error: unknown) => {
        console.error("La planification n'a pas pu être supprimée.", error);
        setActionFailed(true);
        load();
      },
    );
  };

  return (
    // Haut d'écran partagé `TabbedScreen` (Hermann, 19/11/2026) : barre de titre à onglets du Calendrier et zone de contexte
    // standard des Catalogues — ligne 1 « Planifiées N · Terminées N », ligne 2 Rechercher, Filtre, Tri, Planifier.
    <TabbedScreen
      title={planningStrings.calendar.title}
      palette={CALENDAR_PALETTE}
      tabs={calendarTabs("journal", onChangeView)}
      context={{
        kind: "catalogue",
        // Compteurs au format des Catalogues (`ContextCounters`). [Avant : ligne de texte avec espaces tapées — remplacée.]
        summary: {
          counters: [
            { label: t.active, value: routines === null ? "" : String(counts.active), testID: "journal-count-active" },
            { label: t.finished, value: routines === null ? "" : String(counts.finished), testID: "journal-count-finished" },
          ],
        },
        results: null,
        search: {
          value: query,
          onChangeText: setQuery,
          placeholder: t.searchPlaceholder,
          accessibilityLabel: t.searchAccessibility,
          clearLabel: t.searchClear,
          testID: "journal-search",
        },
        filter: (
          <FilterCommand
            label={tSessions.filterAction}
            title={tSessions.catalogueFilters.command}
            summary={filterSummary}
            clearLabel={tSessions.catalogueFilters.clearAccessibility}
            editLabel={tSessions.catalogueFilters.editAccessibility}
            onOpen={() => {
              requestFilterSheet({
                kind: "sessions",
                filters,
                // D-540 : au Journal, le statut porte sur la routine — « Actives » / « Terminées ».
                statusLabels: { active: t.filterActive, archived: t.filterFinished },
                onApply: (next, labels) => {
                  setFilters(next);
                  setFilterLabels(labels);
                },
              });
              router.push("/catalogue-filters");
            }}
            onClear={() => {
              setFilters(EMPTY_SESSION_FILTERS);
              setFilterLabels([]);
            }}
            testID="journal-filter"
          />
        ),
        sortLabel: t.sort,
        action: {
          label: planningStrings.calendar.plan,
          icon: "plan",
          onPress: () => router.push({ pathname: "/planning", params: { date: today } }),
          testID: "journal-plan",
        },
      }}
    >

      <SwipeScrollLockContext.Provider value={lockList}>
      <ScrollView
        ref={listRef}
        scrollEnabled={!swipeLocked}
        style={styles.list}
        // Comme le Catalogue : la liste remonte sous la part fondue de la bande et défile derrière elle.
        contentContainerStyle={[styles.listContent, { paddingBottom: navigationBarTotalHeight() + insets.bottom + spacing[24] }]}
        showsVerticalScrollIndicator={false}
        testID="journal-list"
      >
        {loadFailed ? (
          <Text style={styles.message} testID="journal-load-error">
            {t.loadError}
          </Text>
        ) : null}
        {routines !== null && !loadFailed && all.length === 0 ? (
          <Text style={styles.message} testID="journal-empty">
            {t.empty}
          </Text>
        ) : null}
        {actionFailed ? (
          <Text style={styles.error} accessibilityLiveRegion="polite" testID="journal-action-error">
            {planningStrings.calendar.actionError}
          </Text>
        ) : null}
        {all.length > 0 && visible.length === 0 ? (
          <Text style={styles.message} testID="journal-no-result">
            {t.noResult}
          </Text>
        ) : null}
        {visible.map((routine) => {
          const sessions = sessionsOf(routine);
          const created = creationDateParts(routine.createdAt);
          const isExpanded = expanded.has(routine.id);
          const name = titleOf(routine, sessions);
          // Recette du 19/11/2026 au soir (constat C) : glisser vers la gauche découvre Dupliquer et Supprimer, comme l'Agenda.
          const actions: readonly SwipeAction[] = [
            {
              key: "duplicate",
              label: planningStrings.calendar.duplicate,
              backgroundColor: colors.movementLevelAction,
              onPress: () => {
                setRevealed(null);
                router.push({ pathname: "/planning", params: { duplicateOf: routine.id } });
              },
            },
            {
              key: "delete",
              label: planningStrings.calendar.delete,
              backgroundColor: colors.danger,
              onPress: () => {
                setRevealed(null);
                planning.deletionPlan(routine.id).then(
                  (plan) => {
                    if (plan !== null) setDeleteCandidate({ routine, plan });
                  },
                  () => setActionFailed(true),
                );
              },
            },
          ];
          return (
            <View key={routine.id} style={styles.item} testID={`journal-item-${routine.id}`}>
              <SwipeActionsRow
                actions={actions}
                revealed={revealed === routine.id}
                onReveal={() => setRevealed(routine.id)}
                onHide={() => setRevealed((current) => (current === routine.id ? null : current))}
                onPress={() => toggle(routine.id)}
                accessibilityLabel={name}
                accessibilityState={{ expanded: isExpanded }}
                extraAccessibilityActions={[{ name: "open", label: t.edit, onAction: () => openRoutine(routine.id) }]}
                actionsHeight={JOURNAL_ROW_HEIGHT}
                actionWidth={JOURNAL_ACTION_WIDTH}
                actionsRightMargin={layout.screenGutter}
                testID={`journal-item-${routine.id}-swipe`}
              >
                <JournalRoutineCard
                  date={created?.day ?? ""}
                  year={created?.year ?? ""}
                  name={name}
                  parcours={routine.entries.length > 1}
                  detail={zonesLine(sessions.flatMap((session) => session.bodyZoneIds.map((id) => zoneName.get(id)).filter((value): value is string => value !== undefined)))}
                  slots={journalSlotsLine(routine, today, new Date())}
                  planned={isActive(routine)}
                  expanded={isExpanded}
                  onOpen={() => openRoutine(routine.id)}
                  onToggleExpanded={() => toggle(routine.id)}
                  testID={`journal-card-${routine.id}`}
                />
              </SwipeActionsRow>
              {isExpanded ? (
                // Déployé (DSF Journal § 4) : récapitulation des jours planifiés (recette du 19/11/2026 au soir, constat A),
                // puis composition. Recette du 20/11/2026 (r20-j-deploye — Hermann) : « conserver chaque lundi... retirer le
                // symbole, retirer la phrase sur le nombre de créneaux » ; « Retirer la première ligne de séparation » ;
                // « réduire un peu l'espace vertical entre le nom de la séance et la dernière ligne de la séance précédente
                // (cas du parcours) ». [Filet en tête, symbole du calendrier et ligne « N occurrences à venir · du … au … »
                // — remplacés.]
                // Recette du 20/11/2026 (r21-j-deploye — Hermann) : « Lorsqu'il n'y a pas de planification, retirer la ligne
                // vierge qui suit le cadre, retirer la séparation horizontale » ; « mettre le nom de la / des séance/s dans tous
                // les cas dans la zone déployée ». [Ligne de récurrence vide conservée ; nom réservé aux parcours — remplacé.]
                // [« Pas de planification » = pas de répétition (récurrence vide) ; filet retiré sous la première séance :
                // interprétations techniques.]
                <View style={styles.expanded} testID={`journal-item-${routine.id}-expanded`}>
                  {formatRecurrence(routine) === "" ? null : (
                    <Text style={styles.recurrence} testID={`journal-item-${routine.id}-summary`}>
                      {formatRecurrence(routine)}
                    </Text>
                  )}
                  <View style={styles.expandedSessions}>
                    {sessions.map((session, rank) => (
                      <View key={`${session.id}-${rank}`} testID={`journal-item-${routine.id}-session-${rank}`}>
                        <Text style={styles.expandedSession} testID={`journal-item-${routine.id}-session-${rank}-name`}>
                          {session.name}
                        </Text>
                        <SessionCompositionTree
                          tree={session.tree}
                          divider={!(rank === 0 && formatRecurrence(routine) === "")}
                          testID={`journal-item-${routine.id}-composition-${rank}`}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      </SwipeScrollLockContext.Provider>

      {deleteCandidate !== null ? (
        // Recette du 20/11/2026 (constat D — « Dans le Journal on supprime toutes les occurrences ») : la routine et tous ses
        // créneaux. [« Supprimer la planification ? » — remplacé.]
        // D-537 et recette du 20/11/2026 (r21-j-supprimer — Hermann : « le message ne doit pas inclure les créneaux déjà
        // exécutés dans le nombre annoncé, et ces créneaux ne doivent pas être supprimés. Seul les créneaux non exécutés
        // (passés et futurs) peuvent être effacés » ; sans créneau à supprimer : « enlever le texte et mettre dans le titre
        // "la routine <Nom de la routine> sera supprimée" »). Variantes « Titre seul » / « Titre et message ».
        <DecisionDialog
          cancelOnTop
          title={
            deleteCandidate.plan.count === 0
              ? planningStrings.deleteRoutine.titleNamed.replace("{name}", titleOf(deleteCandidate.routine, sessionsOf(deleteCandidate.routine)))
              : planningStrings.deleteRoutine.title
          }
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={deletionMessage(deleteCandidate.plan)}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={planningStrings.deleteRoutine.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={planningStrings.deleteRoutine.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => removeRoutine(deleteCandidate.routine.id)}
          testIDPrefix="journal-delete"
        />
      ) : null}
    </TabbedScreen>
  );
}

/** Message du dialogue de suppression (D-537) : sans historique, « La routine et ses N créneaux… » ; avec, archivage. */
export function deletionMessage(plan: RoutineDeletionPlan): string {
  const tDelete = planningStrings.deleteRoutine;
  if (plan.count === 0) return "";
  if (plan.history) return plan.count === 1 ? tDelete.archiveOne : tDelete.archiveMany.replace("{count}", String(plan.count));
  return plan.count === 1 ? tDelete.messageOne : tDelete.messageMany.replace("{count}", String(plan.count));
}

/** Actions glissées de la taille de l'Agenda (DSF Agenda § 6 : 90 de large), de la hauteur de la carte. */
const JOURNAL_ACTION_WIDTH = 90;

const styles = StyleSheet.create({
  // Figma : « Planifiées » (« Actives » sur la maquette) et « Terminées » en gris #595E66, nombres en #333 (14).
  list: { flex: 1, marginTop: -CONTEXT_BAND_FADE_HEIGHT },
  listContent: { paddingTop: spacing[8] + CONTEXT_BAND_FADE_HEIGHT },
  // DSF Journal § 1 : cartes espacées de 8, sans séparateur.
  item: { paddingBottom: spacing[8] },
  expanded: { marginHorizontal: layout.screenGutter, marginTop: spacing[8], gap: spacing[8] },
  // Séances d'un parcours rapprochées (r20-j-deploye, 20/11/2026).
  expandedSessions: { gap: spacing[4] },
  expandedSession: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: colors.textPrimary },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8], paddingHorizontal: layout.screenGutter },
  recurrence: { ...type.supporting, color: colors.textSecondary },
});
