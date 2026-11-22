import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatLocalDate, parseLocalDate, type Routine } from "@/domain/planning/Routine";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { CALENDAR_PALETTE } from "@/features/planning/CalendarViewTabs";
import { creationDateParts, matchesJournalQuery, matchesRoutineSessionFilters, routineLastDate, routineTitle } from "@/features/planning/journal";
import { JournalRoutineCard } from "@/features/planning/JournalRoutineCard";
import { planningStrings } from "@/features/planning/planningStrings";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { strings } from "@/shared/i18n";
import { CatalogueSearchField, CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CONTEXT_SEARCH_WIDTH } from "@/shared/ui/catalogueContext";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { SheetFixedTop } from "@/shared/ui/SheetFixedTop";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * `active` (D-553, arbitrage 3) : routines actives proposées avant les terminées ; absent : active.
 * `lastUpcoming` : date du dernier créneau à venir (`null` : aucun).
 */
export type RoutineFilterChoice = { readonly routine: Routine; readonly upcoming: number; readonly lastUpcoming?: string | null; readonly active?: boolean };

/** « 15 novembre » : mois en toutes lettres, sans année (recette du 21/11/2026, f25-alignement). */
function dayMonthLong(day: string): string {
  const date = parseLocalDate(day);
  return `${date.getDate()} ${planningStrings.months[date.getMonth()]}`;
}

/**
 * Ligne 3 de la carte réduite (recette du 21/11/2026, f23-modale, Hermann) : « 10 créneaux à venir jusqu'au 15 novembre » ;
 * « Aucun créneau à venir » s'il n'y en a pas. « jusqu'au » : dernier créneau à venir. [D-539 : « 6 à venir, jusqu'au
 * 28/12/2026 », dernière date de la routine — remplacé.]
 */
export function routineFilterSlotsLine(choice: RoutineFilterChoice): string {
  const t = planningStrings.routineFilter;
  if (choice.upcoming === 0) return t.slotsNone;
  const date = dayMonthLong(choice.lastUpcoming ?? routineLastDate(choice.routine));
  if (choice.upcoming === 1) return fillTemplate(t.slotsOne, { date });
  return fillTemplate(t.slots, { count: String(choice.upcoming), date });
}

/**
 * Libellé du bouton (D-539, mis à jour le 20/11/2026) : « Filtrer N routines », « Filtrer 1 routine ». Sans sélection, le
 * bouton est désactivé. [« Afficher toutes les routines » — retiré.] [« Filtrer 0 routines » sur le bouton désactivé :
 * formule appliquée telle quelle, à confirmer.]
 */
export function routineFilterButtonLabel(count: number): string {
  const t = planningStrings.routineFilter;
  return count === 1 ? t.applyOne : t.applyMany.replace("{count}", String(count));
}

/**
 * Modale « Filtrer par routine » de l'Agenda (D-539, DSF Agenda § 9, 20/11/2026 ; Figma « P-Calendrier — Semaine — Filtre par
 * routine — Choix de la routine (proposition) » `12795:25088`) — version simplifiée de l'écran Journal :
 * - le fond de la zone de contexte du Journal part du haut de la modale ; l'en-tête (✕ en haut à gauche, titre) est posé
 *   dessus, puis Rechercher (largeur disponible), Filtre et Tri à droite, sans compteurs ni « Planifier » ; même
 *   fonctionnement que le Journal (recherche, feuille des filtres du Catalogue des séances, tri inactif) ;
 * - une carte du Journal par routine, réduite au nom et à « X à venir, jusqu'au jj/mm/aaaa », case à cocher à droite ;
 *   sélection multiple ; la modale s'ouvre toujours sans routine cochée (elle n'est ouverte que filtre inactif) ;
 * - en bas, « Filtrer N routines » (« Filtrer 1 routine »), désactivé sans sélection.
 * [D-539 mis à jour le 20/11/2026 (Hermann) : précoche du filtre en cours et « Afficher toutes les routines » — retirés.]
 */
export function RoutineFilterSheet({
  choices,
  loading,
  sessions,
  onClose,
  onValidate,
}: {
  readonly choices: readonly RoutineFilterChoice[];
  readonly loading: boolean;
  readonly sessions: ReadonlyMap<string, SessionCatalogueProjection>;
  readonly onClose: () => void;
  readonly onValidate: (selected: readonly string[]) => void;
}) {
  const t = planningStrings.routineFilter;
  const tJournal = planningStrings.journal;
  const tSessions = strings.screens.sessions;
  const router = useRouter();
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SessionCatalogueFilters>(EMPTY_SESSION_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const sessionsOf = (routine: Routine) =>
    routine.entries.map((entry) => sessions.get(entry.sessionId)).filter((projection): projection is SessionCatalogueProjection => projection !== undefined);
  // Recherche et filtres du Journal ; les routines terminées restent proposées (D-540, point 6), le statut est ignoré ici.
  // D-553 (21/11/2026, arbitrage 3) : une ligne par Routine — actives d'abord, puis terminées, chaque groupe par ordre alphabétique
  // du nom affiché ; plusieurs lignes peuvent porter le même nom, la sélection porte sur l'identifiant.
  const visible = useMemo(
    () =>
      choices
        .filter((choice) => {
          const routineSessions = sessionsOf(choice.routine);
          return matchesJournalQuery(choice.routine, routineSessions, query) && matchesRoutineSessionFilters(routineSessions, filters);
        })
        .map((choice) => ({ choice, title: routineTitle(choice.routine, sessionsOf(choice.routine)), active: choice.active !== false }))
        .sort((a, b) => (a.active !== b.active ? (a.active ? -1 : 1) : a.title.localeCompare(b.title, "fr", { sensitivity: "base" })))
        .map((item) => item.choice),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [choices, sessions, query, filters],
  );
  const kept = selected.filter((id) => choices.some((choice) => choice.routine.id === id));
  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const filterSummary =
    filterLabels.length === 0
      ? null
      : filterLabels.length === 1
        ? filterLabels[0]!
        : fillTemplate(tSessions.catalogueFilters.activeSummary, { count: String(filterLabels.length) });
  const today = formatLocalDate(new Date());
  // Recette du 21/11/2026 (a31-filtre-lignes) : la liste réserve la hauteur du bouton du bas ; la dernière carte reste atteignable.
  const actionZone = usePrimaryActionZone();

  return (
    <ScreenShell backgroundColor={colors.background}>
      <SheetFixedTop
        top={
          <ContextBand fadeToTransparent color={CALENDAR_PALETTE.context} backHalo={CALENDAR_PALETTE.context} padding={{ top: 0, bottom: 15 }}>
            {/* En-tête posé sur la zone de contexte (Figma : bande de 115 depuis le haut de la modale, rangée à y = 66). */}
            <View style={styles.header}>
              <FixedHeader title={t.title} closeIcon topInset={0} onBack={onClose} backAccessibilityLabel={t.close} />
            </View>
            <View style={styles.commands} testID="routine-filter-commands">
              <CatalogueSearchField
                value={query}
                onChangeText={setQuery}
                placeholder={tJournal.searchPlaceholder}
                accessibilityLabel={tJournal.searchPlaceholder}
                clearLabel={tSessions.catalogueFilters.clearAccessibility}
                width={{ fillFrom: CONTEXT_SEARCH_WIDTH.compact }}
                testID="routine-filter-search"
              />
              <View style={styles.actions}>
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
                  testID="routine-filter-filter"
                />
                <CommandCircle label={tJournal.sort} icon="sort" disabled testID="routine-filter-sort" />
              </View>
            </View>
          </ContextBand>
        }
        renderScroll={(topHeight) => (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.list, { paddingTop: topHeight + spacing[8], paddingBottom: actionZone.scrollReserve + spacing[8] }]}
            scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            testID="routine-filter-list"
          >
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {!loading && choices.length === 0 ? (
              <Text style={styles.message} testID="routine-filter-empty">
                {t.empty}
              </Text>
            ) : null}
            {!loading && choices.length > 0 && visible.length === 0 ? (
              <Text style={styles.message} testID="routine-filter-no-result">
                {t.noResult}
              </Text>
            ) : null}
            {visible.map((choice) => {
              const created = creationDateParts(choice.routine.createdAt);
              const routineSessions = sessionsOf(choice.routine);
              const name = routineTitle(choice.routine, routineSessions);
              return (
                <View key={choice.routine.id} style={styles.item}>
                  <JournalRoutineCard
                    date={created?.day ?? ""}
                    year={created?.year ?? ""}
                    name={name}
                    // D-553 (21/11/2026, § 5) : même présentation que le Journal — Ⓟ après le nom de Routine d'un parcours.
                    parcours={choice.routine.entries.length > 1}
                    detail=""
                    slots={routineFilterSlotsLine(choice)}
                    planned={choice.upcoming > 0 && routineLastDate(choice.routine) >= today}
                    expanded={false}
                    onOpen={() => undefined}
                    onToggleExpanded={() => undefined}
                    selection={{ checked: selected.includes(choice.routine.id), onToggle: () => toggle(choice.routine.id) }}
                    testID={`routine-filter-card-${choice.routine.id}`}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      />
      {/* Bouton primaire en bas, sans trait de séparation (DSF Agenda § 9). */}
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="routine-filter-action-zone">
        <PrimaryActionButton
          label={routineFilterButtonLabel(kept.length)}
          disabled={kept.length === 0}
          onPress={() => {
            if (kept.length > 0) onValidate(kept);
          }}
          testID="routine-filter-apply"
        />
      </PrimaryActionZone>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  // L'en-tête de modale occupe toute la largeur : il sort des marges de 16 de la bande.
  header: { marginHorizontal: -layout.screenGutter },
  commands: { height: dimensions.catalogueCommand.touchTarget, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: dimensions.catalogueCommand.gap },
  actions: { flexDirection: "row", alignItems: "center", gap: dimensions.catalogueCommand.gap },
  scroll: { flex: 1 },
  // Cartes espacées de 8 (Figma : 58 de pas pour des lignes de 52 + marges de 3).
  list: { paddingBottom: spacing[24] },
  item: { paddingBottom: spacing[8] + 6 },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
});
