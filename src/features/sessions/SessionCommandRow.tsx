import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { strings } from "@/shared/i18n";
import { CONTEXT_SEARCH_WIDTH } from "@/shared/ui/catalogueContext";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { dimensions } from "@/shared/ui/tokens";

import { commandRowLayout, type SessionCatalogueView } from "./sessionCatalogueView";
import { SessionViewToggle } from "./SessionViewToggle";

/**
 * PRE-8 (epic E, story E.4 ; spécification du 27/10 §4 ; Q-E4 option B complétée, Hermann 28/10) —
 * commandes du segment Séances. Filtre inactif : bouton rond qui ouvre le panneau ; filtre actif :
 * toujours la forme étendue, rond bleu qui réinitialise, zone texte qui ouvre ; le texte devient le
 * nombre de filtres (« 1 filtre », « N filtres ») quand le résumé ne tient pas (`commandRowLayout`,
 * largeurs MESURÉES) ; toujours une seule ligne (recette du 28/10/2026, q4-02). Réinitialiser les
 * filtres ne touche pas la bascule de vue.
 *
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026, CE-CAT-CTX-01 ;
 * Figma `1992:9910`, `4549:6742`, `1992:10848`) : zone de contexte commune
 * (`CatalogueContextZone`). Ligne 1 : « Un exercice N | Plusieurs N » (bascule inchangée, nombres
 * informatifs) et, en état filtré ou archivé, « N résultats » ; ligne 2 : Rechercher, puis Filtre,
 * Tri, Créer (Créer le plus à droite). La place de la commande étendue se calcule avec le champ
 * Rechercher réduit (107) à la place de l'ancienne bascule.
 */

const t = strings.screens.sessions;
const COMMAND = dimensions.catalogueCommand;

export function SessionCommandRow({
  view,
  onToggleView,
  counts,
  results,
  query,
  onChangeQuery,
  filterSummary,
  filterCount,
  onOpenFilters,
  onResetFilters,
  onCreate,
}: {
  readonly view: SessionCatalogueView | null;
  readonly onToggleView: (view: SessionCatalogueView) => void;
  /** Nombre réel de Séances de chaque vue ; `null` : liste non chargée. */
  readonly counts: { readonly SINGLE: number; readonly MULTIPLE: number } | null;
  /** « N résultats » en état filtré ou archivé ; `null` sinon. */
  readonly results: string | null;
  readonly query: string;
  readonly onChangeQuery: (query: string) => void;
  /** `null` : aucun filtre. */
  readonly filterSummary: string | null;
  /** Nombre de filtres (« 1 filtre », « N filtres ») quand le résumé ne tient pas ; `null` : aucun filtre. */
  readonly filterCount: string | null;
  readonly onOpenFilters: () => void;
  readonly onResetFilters: () => void;
  readonly onCreate: () => void;
}) {
  const [available, setAvailable] = useState<number | null>(null);
  const [extendedWidth, setExtendedWidth] = useState<number | null>(null);
  const width = (set: (value: number) => void) => (event: LayoutChangeEvent) => set(event.nativeEvent.layout.width);

  const filterActive = filterSummary !== null;
  const searchWidth = results !== null ? CONTEXT_SEARCH_WIDTH.compact : CONTEXT_SEARCH_WIDTH.default;
  // Avant toute mesure (premier rendu, tests) : le résumé courant.
  const layout =
    available === null || (filterActive && extendedWidth === null)
      ? { filter: filterActive ? ("EXTENDED" as const) : ("ROUND" as const), label: "SUMMARY" as const }
      : commandRowLayout({
          available,
          toggle: Math.min(searchWidth, available),
          filterActive,
          extendedFilter: extendedWidth ?? 0,
          circle: COMMAND.visual,
          gap: COMMAND.gap,
        });
  const shownSummary = layout.label === "COUNT" ? filterCount : filterSummary;

  return (
    <View style={styles.container}>
      <CatalogueContextZone
        summary={<SessionViewToggle value={view} onToggle={onToggleView} counts={counts} testID="catalogue-session-view" />}
        results={results}
        search={{
          value: query,
          onChangeText: onChangeQuery,
          placeholder: t.search.placeholder,
          accessibilityLabel: t.search.accessibilityLabel,
          clearLabel: t.search.clear,
          testID: "session-catalogue-search",
        }}
        filter={
          <FilterCommand
            label={t.filterAction}
            title={t.catalogueFilters.command}
            summary={shownSummary}
            clearLabel={t.catalogueFilters.clearAccessibility}
            editLabel={t.catalogueFilters.editAccessibility}
            onOpen={onOpenFilters}
            onClear={onResetFilters}
            testID="catalogue-filter-action"
          />
        }
        sortLabel={t.sortAction}
        createLabel={t.createAction}
        onCreate={onCreate}
        onCommandRowLayout={width(setAvailable)}
      />
      {/* Mesure hors écran de la commande étendue (largeur naturelle avec le résumé courant). */}
      {filterActive ? (
        <View style={styles.measure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View onLayout={width(setExtendedWidth)} testID="catalogue-filter-measure">
            <FilterCommand
              label={t.filterAction}
              title={t.catalogueFilters.command}
              summary={filterSummary}
              clearLabel={t.catalogueFilters.clearAccessibility}
              editLabel={t.catalogueFilters.editAccessibility}
              onOpen={() => undefined}
              onClear={() => undefined}
              testID="catalogue-filter-measure-command"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  measure: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    flexDirection: "row",
  },
});
