import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { strings } from "@/shared/i18n";
import { CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { dimensions, spacing } from "@/shared/ui/tokens";

import { commandRowLayout, type SessionCatalogueView } from "./sessionCatalogueView";
import { SessionViewToggle } from "./SessionViewToggle";

/**
 * PRE-8 (epic E, story E.4 ; spécification du 27/10 §4 ; Q-E4 option B complétée, Hermann 28/10) —
 * rangée du segment Séances : bascule « Un exercice | Plusieurs » à gauche, puis Filtre, Tri, Créer
 * à droite (Créer le plus à droite, sur la marge). Disposition calculée sur les largeurs MESURÉES
 * (`commandRowLayout`) :
 * - filtre inactif : bouton rond qui ouvre le panneau ;
 * - filtre actif étendu (toute la rangée tient) : rond bleu qui réinitialise, zone texte qui ouvre ;
 * - filtre actif compact : deux commandes distinctes, ouvrir et réinitialiser (croix) ;
 * - deux lignes si nécessaire (largeur compacte, texte agrandi), jamais de chevauchement.
 * Cibles d'au moins 44 × 44 (commandes partagées de B.9). Réinitialiser les filtres ne touche pas la
 * bascule de vue. Sur le segment Mouvements, la rangée de B.9 reste inchangée.
 */

const t = strings.screens.sessions;
const COMMAND = dimensions.catalogueCommand;

export function SessionCommandRow({
  view,
  onToggleView,
  filterSummary,
  onOpenFilters,
  onResetFilters,
  onCreate,
}: {
  readonly view: SessionCatalogueView | null;
  readonly onToggleView: (view: SessionCatalogueView) => void;
  /** `null` : aucun filtre. */
  readonly filterSummary: string | null;
  readonly onOpenFilters: () => void;
  readonly onResetFilters: () => void;
  readonly onCreate: () => void;
}) {
  const [available, setAvailable] = useState<number | null>(null);
  const [toggleWidth, setToggleWidth] = useState<number | null>(null);
  const [extendedWidth, setExtendedWidth] = useState<number | null>(null);
  const width = (set: (value: number) => void) => (event: LayoutChangeEvent) => set(event.nativeEvent.layout.width);

  const filterActive = filterSummary !== null;
  // Avant toute mesure (premier rendu, tests) : une ligne, forme étendue si un filtre est actif.
  const layout =
    available === null || toggleWidth === null || (filterActive && extendedWidth === null)
      ? { lines: 1 as const, filter: filterActive ? ("EXTENDED" as const) : ("ROUND" as const) }
      : commandRowLayout({
          available,
          toggle: toggleWidth,
          filterActive,
          extendedFilter: extendedWidth ?? 0,
          compactFilter: 2 * COMMAND.visual + COMMAND.gap,
          circle: COMMAND.visual,
          gap: COMMAND.gap,
        });

  const commands = (
    <View style={styles.commands} testID="catalogue-session-commands">
      <FilterCommand
        label={t.filterAction}
        title={t.catalogueFilters.command}
        summary={filterSummary}
        clearLabel={t.catalogueFilters.clearAccessibility}
        editLabel={t.catalogueFilters.editAccessibility}
        variant={layout.filter === "COMPACT" ? "compact" : "extended"}
        onOpen={onOpenFilters}
        onClear={onResetFilters}
        testID="catalogue-filter-action"
      />
      <CommandCircle label={t.sortAction} icon="sort" disabled testID="catalogue-sort-action" />
      <CommandCircle label={t.createAction} icon="create" onPress={onCreate} testID="catalogue-create-action" />
    </View>
  );

  return (
    <View
      style={[styles.row, layout.lines === 2 ? styles.twoLines : null]}
      onLayout={width(setAvailable)}
      testID="catalogue-command-row"
    >
      <View style={styles.toggleSlot}>
        <SessionViewToggle value={view} onToggle={onToggleView} onLayout={width(setToggleWidth)} testID="catalogue-session-view" />
      </View>
      {commands}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: COMMAND.gap,
    marginTop: spacing[8],
  },
  // Deux lignes : la bascule, puis les commandes calées à droite.
  twoLines: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0,
  },
  toggleSlot: {
    flexShrink: 0,
  },
  commands: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: COMMAND.gap,
    minHeight: COMMAND.touchTarget,
  },
  measure: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    flexDirection: "row",
  },
});
