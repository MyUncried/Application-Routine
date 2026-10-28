import { StyleSheet, Text, View } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SheetMotionView } from "@/features/activities/SheetMotion";
import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import type { CatalogueTreeLine } from "@/features/sessions/sessionCatalogueProjection";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.3 ; spécification du 27/10 §2 ; DSF `6214:3696`) — composition déployée
 * d'une Séance dans sa carte du Catalogue. Lecture seule : rien n'est modifié ni lancé.
 *
 * - Sous un filet, sur toute la largeur utile de la carte (elle passe sous le visuel).
 * - Conteneurs en lignes d'en-tête grises sans valeur : « Cycle · N répétitions », « Circuit · N
 *   tours » (unité accordée à la nature du Circuit, lexique de la Composition).
 * - Membres décalés de 16 par niveau, reliés par un filet vertical dans la marge dégagée (motif des
 *   familles de niveaux du Catalogue des Mouvements, B.5) ; deux décalages au plus.
 * - Nom à gauche, volume à droite ; récupérations en gris clair, à leur position, avec leur durée.
 * - La hauteur suit le contenu ; apparition et disparition par les animations communes
 *   (`SheetMotion`), neutralisées par « Réduire les animations ».
 */

const t = strings.screens.sessions.catalogueCard;
const circuitUnits = strings.screens.composition.circuit.unit;

export function treeLineLabel(line: CatalogueTreeLine): { readonly name: string; readonly value: string | null } {
  switch (line.kind) {
    case "CYCLE":
      return {
        name: fillTemplate(t.cycleLine, {
          count: String(line.repeatCount),
          unit: line.repeatCount === 1 ? t.cycleUnit.singular : t.cycleUnit.plural,
        }),
        value: null,
      };
    case "CIRCUIT": {
      const unit = circuitUnits[line.nature];
      return {
        name: fillTemplate(t.circuitLine, { count: String(line.repeatCount), unit: line.repeatCount === 1 ? unit.singular : unit.plural }),
        value: null,
      };
    }
    case "EXERCISE":
      return { name: line.name, value: line.volume };
    case "RECOVERY":
      return { name: t.recovery, value: formatCompactDuration(line.seconds) };
    default: {
      const unreachable: never = line;
      return unreachable;
    }
  }
}

/** Texte de la composition déployée pour l'accessibilité de la carte (une ligne par élément). */
export function compositionAccessibilityText(tree: readonly CatalogueTreeLine[]): string {
  const lines = tree.map((line) => {
    const { name, value } = treeLineLabel(line);
    return value === null ? name : `${name} ${value}`;
  });
  return `${t.compositionAccessibilityLabel} : ${lines.join(", ")}`;
}

export function SessionCompositionTree({ tree, testID }: { readonly tree: readonly CatalogueTreeLine[]; readonly testID: string }) {
  return (
    <SheetMotionView testID={testID}>
      <View style={styles.divider} testID={`${testID}-divider`} />
      <View style={styles.lines}>
        {tree.map((line) => {
          const { name, value } = treeLineLabel(line);
          const isContainer = line.kind === "CYCLE" || line.kind === "CIRCUIT";
          const isRecovery = line.kind === "RECOVERY";
          return (
            <View
              key={`${line.kind}:${line.key}`}
              style={[styles.line, { paddingLeft: line.depth * INDENT }]}
              testID={`${testID}-line-${line.key}`}
            >
              {/* Filets verticaux des conteneurs englobants, un par niveau, dans la marge dégagée. */}
              {Array.from({ length: line.depth }, (_, level) => (
                <View key={level} style={[styles.rail, { left: level * INDENT + RAIL_OFFSET }]} testID={`${testID}-line-${line.key}-rail-${level + 1}`} />
              ))}
              <Text
                style={[styles.name, isContainer ? styles.containerName : null, isRecovery ? styles.muted : null]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {value !== null ? (
                <Text style={[styles.value, isRecovery ? styles.muted : null]} numberOfLines={1}>
                  {value}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </SheetMotionView>
  );
}

/** Spécification §2 : décalage de 16 par niveau. */
const INDENT = spacing[16];
/** Filet vertical au milieu de la marge dégagée par le décalage. */
const RAIL_OFFSET = 4;
const LINE_HEIGHT = 25;

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginHorizontal: spacing[8],
    backgroundColor: colors.divider,
  },
  lines: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  line: {
    minHeight: LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
  },
  rail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.movementFamilyRail,
  },
  name: {
    ...type.segmentedCompactLabel,
    flexShrink: 1,
    color: colors.textPrimary,
  },
  containerName: {
    ...type.editableValue,
    color: colors.textSecondary,
  },
  value: {
    ...type.segmentedCompactLabel,
    color: colors.textPrimary,
  },
  muted: {
    color: colors.catalogueSessionMuted,
  },
});
