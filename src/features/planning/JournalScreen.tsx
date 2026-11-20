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
  isRoutineActive,
  journalCounts,
  journalSlotsLine,
  routineSlotCount,
  matchesJournalFilters,
  matchesJournalQuery,
  sortJournal,
} from "@/features/planning/journal";
import { JOURNAL_ROW_HEIGHT, JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { formatRecurrence } from "@/features/planning/planningSummary";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { isSessionCatalogueFiltered } from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { CONTEXT_BAND_FADE_HEIGHT } from "@/shared/ui/ScreenShell";
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SessionCatalogueFilters>(EMPTY_SESSION_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Routine | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    planning.listRoutines().then(
      (list) => {
        if (id !== requestId.current) return;
        setRoutines(list);
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
  const counts = journalCounts(all, today);
  const sessionsOf = (routine: Routine) =>
    routine.entries.map((entry) => projections.get(entry.sessionId)).filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
  const filtered = isSessionCatalogueFiltered(filters);
  const visible = all.filter((routine) => {
    const sessions = sessionsOf(routine);
    return matchesJournalQuery(routine, sessions, query) && (!filtered || matchesJournalFilters(sessions, filters));
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

      <ScrollView
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
                setDeleteCandidate(routine);
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
                  planned={isRoutineActive(routine, today)}
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
                <View style={styles.expanded} testID={`journal-item-${routine.id}-expanded`}>
                  <Text style={styles.recurrence} testID={`journal-item-${routine.id}-summary`}>
                    {formatRecurrence(routine)}
                  </Text>
                  <View style={styles.expandedSessions}>
                    {sessions.map((session, rank) => (
                      <View key={`${session.id}-${rank}`} testID={`journal-item-${routine.id}-session-${rank}`}>
                        {sessions.length > 1 ? <Text style={styles.expandedSession}>{session.name}</Text> : null}
                        <SessionCompositionTree tree={session.tree} testID={`journal-item-${routine.id}-composition-${rank}`} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {deleteCandidate !== null ? (
        // Recette du 20/11/2026 (constat D — « Dans le Journal on supprime toutes les occurrences ») : la routine et tous ses
        // créneaux. [« Supprimer la planification ? » — remplacé.]
        <DecisionDialog
          title={planningStrings.deleteRoutine.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={
            routineSlotCount(deleteCandidate) === 1
              ? planningStrings.deleteRoutine.messageOne
              : planningStrings.deleteRoutine.messageMany.replace("{count}", String(routineSlotCount(deleteCandidate)))
          }
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={planningStrings.deleteRoutine.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={planningStrings.deleteRoutine.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => removeRoutine(deleteCandidate.id)}
          testIDPrefix="journal-delete"
        />
      ) : null}
    </TabbedScreen>
  );
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
