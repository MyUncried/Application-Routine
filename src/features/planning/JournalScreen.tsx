import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatLocalDate, type Routine } from "@/domain/planning/Routine";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { useBodyZonesReferential } from "@/features/activities/useBodyZonesReferential";
import { zonesLine } from "@/features/planning/agendaFormat";
import { CalendarViewTabs, type CalendarView } from "@/features/planning/CalendarViewTabs";
import {
  creationDateParts,
  journalCounts,
  journalRecurrenceLine,
  matchesJournalFilters,
  matchesJournalQuery,
  sortJournal,
} from "@/features/planning/journal";
import { JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { usePlanningService } from "@/features/planning/PlanningServiceContext";
import { planningStrings } from "@/features/planning/planningStrings";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { isSessionCatalogueFiltered } from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { CONTEXT_TEXT_COLOR, CONTEXT_ZONE_GEOMETRY } from "@/shared/ui/catalogueContext";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Calendrier — Journal des routines (D-535, DSF Journal du 19/11/2026 ; Figma « Calendrier — Journal — MVP »
 * `1992:5510`). Remplace la vue Jour : la liste des routines créées, et non leur planification dans le temps — une carte
 * par routine, quelle que soit sa récurrence ou son nombre de séances.
 *
 * - Zone de contexte (bande 402 × 115 inchangée, composant partagé des Catalogues `CatalogueContextZone`) : ligne 1
 *   « Actives N · Terminées N » ; ligne 2 Rechercher, Filtre, Tri, Planifier. Aucune navigation par date.
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
      return () => cancelPending();
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

  return (
    <ScreenShell>
      <FixedHeader title={planningStrings.calendar.title} content={<CalendarViewTabs value="journal" onChange={onChangeView} />} layoutStyle={styles.header} />
      <ContextBand
        fadeToTransparent
        color={colors.catalogueSessionsContext}
        padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
      >
        <CatalogueContextZone
          summary={
            <Text style={styles.counts} numberOfLines={1} testID="journal-counts">
              <Text style={styles.countLabel}>{`${t.active} `}</Text>
              <Text testID="journal-count-active">{routines === null ? "" : String(counts.active)}</Text>
              <Text style={styles.countLabel}>{`  ·  ${t.finished} `}</Text>
              <Text testID="journal-count-finished">{routines === null ? "" : String(counts.finished)}</Text>
            </Text>
          }
          results={null}
          search={{
            value: query,
            onChangeText: setQuery,
            placeholder: t.searchPlaceholder,
            accessibilityLabel: t.searchAccessibility,
            clearLabel: t.searchClear,
            testID: "journal-search",
          }}
          filter={
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
          }
          sortLabel={t.sort}
          trailingCommand={
            <Pressable
              onPress={() => router.push({ pathname: "/planning", params: { date: today } })}
              accessibilityRole="button"
              accessibilityLabel={planningStrings.calendar.plan}
              hitSlop={6}
              style={styles.planButton}
              testID="journal-plan"
            >
              <Image source={require("../../../assets/icons/icon-planifier.svg")} style={styles.planIcon} accessible={false} />
            </Pressable>
          }
        />
      </ContextBand>

      <ScrollView
        style={styles.list}
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
        {all.length > 0 && visible.length === 0 ? (
          <Text style={styles.message} testID="journal-no-result">
            {t.noResult}
          </Text>
        ) : null}
        {visible.map((routine) => {
          const sessions = sessionsOf(routine);
          const created = creationDateParts(routine.createdAt);
          const isExpanded = expanded.has(routine.id);
          return (
            <View key={routine.id} style={styles.item} testID={`journal-item-${routine.id}`}>
              <JournalRoutineCard
                date={created?.day ?? ""}
                year={created?.year ?? ""}
                name={titleOf(routine, sessions)}
                detail={zonesLine(sessions.flatMap((session) => session.bodyZoneIds.map((id) => zoneName.get(id)).filter((value): value is string => value !== undefined)))}
                recurrence={journalRecurrenceLine(routine, today)}
                expanded={isExpanded}
                onToggleExpanded={() => toggle(routine.id)}
                onEdit={() => router.push({ pathname: "/planning", params: { routineId: routine.id } })}
                testID={`journal-card-${routine.id}`}
              />
              {isExpanded ? (
                // Déployé identique à l'Agenda et au catalogue des séances (DSF Journal § 4) : filet, puis composition.
                <View style={styles.expanded} testID={`journal-item-${routine.id}-expanded`}>
                  {sessions.map((session, rank) => (
                    <View key={`${session.id}-${rank}`} testID={`journal-item-${routine.id}-session-${rank}`}>
                      {sessions.length > 1 ? <Text style={styles.expandedSession}>{session.name}</Text> : null}
                      <SessionCompositionTree tree={session.tree} testID={`journal-item-${routine.id}-composition-${rank}`} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.catalogueSessionsBackground },
  // Figma : « Actives » et « Terminées » en gris #595E66, nombres en #333 (14).
  counts: { ...type.contextLine, color: CONTEXT_TEXT_COLOR },
  countLabel: { color: colors.textSecondary },
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
  list: { flex: 1 },
  listContent: { paddingTop: spacing[8] },
  // DSF Journal § 1 : cartes espacées de 8, sans séparateur.
  item: { paddingBottom: spacing[8] },
  expanded: { marginHorizontal: layout.screenGutter, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardsBorder, marginTop: spacing[8], paddingTop: spacing[8], gap: spacing[8] },
  expandedSession: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: colors.textPrimary },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
});
