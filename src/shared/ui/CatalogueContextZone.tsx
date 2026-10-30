import type { ReactNode } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { CONTEXT_SEARCH_WIDTH, CONTEXT_TEXT_COLOR, CONTEXT_ZONE_GEOMETRY } from "@/shared/ui/catalogueContext";
import { CatalogueSearchField, CommandCircle } from "@/shared/ui/CatalogueCommands";
import { dimensions, type } from "@/shared/ui/tokens";

/**
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §2 et §5 ;
 * CE-CAT-CTX-01 ; Figma `10266:20575`, `10465:23141`, `10495:24099`, `1992:9910`, `4549:6742`) —
 * contenu commun de la bande lilas « Recherche et création » des Catalogues Mouvements et Séances.
 *
 * - Ligne 1 (`y = 118`, `x = 24`) : compteurs ou bascule propres au Catalogue (`summary`) ; en état
 *   filtré ou archivé, « N résultats » à droite (bord droit `x = 378`), texte informatif.
 * - Ligne 2 (`y = 155`) : champ Rechercher (216 × 44, 107 × 44 en état filtré ou archivé) ; Filtre,
 *   Tri et Créer (visuels 34 à `y = 160`, cibles 44 × 44), alignés à droite, écart 12.
 *
 * La hauteur et les marges verticales sont portées par `ContextBand` (`CONTEXT_ZONE_GEOMETRY`).
 */
export function CatalogueContextZone({
  summary,
  results,
  search,
  filter,
  sortLabel,
  createLabel,
  onCreate,
  onCommandRowLayout,
}: {
  readonly summary: ReactNode;
  /**
   * « N résultats » ; `null` hors état filtré ou archivé (champ Rechercher pleine largeur) ; chaîne
   * vide : état filtré, liste pas encore chargée (champ réduit, aucun nombre).
   */
  readonly results: string | null;
  readonly search: {
    readonly value: string;
    readonly onChangeText: (value: string) => void;
    readonly placeholder: string;
    readonly accessibilityLabel: string;
    readonly clearLabel: string;
    readonly testID: string;
  };
  /** Commande Filtre (`FilterCommand`), propre au Catalogue. */
  readonly filter: ReactNode;
  readonly sortLabel: string;
  readonly createLabel: string;
  readonly onCreate: () => void;
  /** Largeur mesurée de la deuxième ligne (disposition de la commande Filtre étendue, Séances). */
  readonly onCommandRowLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.zone} testID="catalogue-context-zone">
      <View style={styles.line1} testID="catalogue-context-line1">
        <View style={styles.summary}>{summary}</View>
        {results !== null && results.length > 0 ? (
          <Text style={styles.results} numberOfLines={1} testID="catalogue-results">
            {results}
          </Text>
        ) : null}
      </View>
      <View style={styles.line2} onLayout={onCommandRowLayout} testID="catalogue-command-row">
        <CatalogueSearchField
          {...search}
          width={results !== null ? CONTEXT_SEARCH_WIDTH.compact : CONTEXT_SEARCH_WIDTH.default}
        />
        <View style={styles.commands} testID="catalogue-context-commands">
          {filter}
          <CommandCircle label={sortLabel} icon="sort" disabled testID="catalogue-sort-action" />
          <CommandCircle label={createLabel} icon="create" onPress={onCreate} testID="catalogue-create-action" />
        </View>
      </View>
    </View>
  );
}

const COMMAND = dimensions.catalogueCommand;

const styles = StyleSheet.create({
  zone: {
    flex: 1,
    justifyContent: "space-between",
  },
  line1: {
    height: CONTEXT_ZONE_GEOMETRY.line1Height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: COMMAND.gap,
    paddingHorizontal: CONTEXT_ZONE_GEOMETRY.line1Inset,
  },
  summary: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  results: {
    ...type.contextLine,
    flexShrink: 0,
    color: CONTEXT_TEXT_COLOR,
    textAlign: "right",
  },
  line2: {
    height: COMMAND.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Écart minimal entre le champ et Filtre : leurs cibles ne se chevauchent jamais.
    gap: COMMAND.gap,
  },
  commands: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: COMMAND.gap,
  },
});
