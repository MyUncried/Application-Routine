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
 *   tours · groupées » / « Circuit · N tours · alternées » (PRE-9 B.1b, référence « Composition :
 *   circuits, cycles et création » §2 : l'unité reste « tour(s) », la nature est l'adjectif de
 *   l'en-tête de la Composition ; remplace « Circuit · N séries » pour un Circuit alterné).
 *   [Remplacé le 06/11/2026 par D-507 : « Cycle » + « N passages » à droite, « Circuit · séries
 *   groupées|alternées » + « N tours » à droite ; volumes « 3 × 12 rép. ».]
 * - Membres décalés de 16 par niveau, reliés par un filet vertical dans la marge dégagée (motif des
 *   familles de niveaux du Catalogue des Mouvements, B.5) ; deux décalages au plus.
 * - Nom à gauche, volume à droite ; récupérations en gris clair, à leur position, avec leur durée.
 * - La hauteur suit le contenu ; apparition et disparition par les animations communes
 *   (`SheetMotion`), neutralisées par « Réduire les animations ».
 */

const t = strings.screens.sessions.catalogueCard;
const circuitStrings = strings.screens.composition.circuit;

export function treeLineLabel(line: CatalogueTreeLine): { readonly name: string; readonly value: string | null } {
  switch (line.kind) {
    // D-507 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §6) : « Cycle » à gauche,
    // « N passages » à droite dans la colonne des volumes ; « Circuit · séries groupées|alternées » à
    // gauche, « N tours » à droite. [Avant : « Cycle · N passages », « Circuit · N tours · groupées »,
    // sans valeur à droite — remplacé.]
    case "CYCLE":
      return {
        name: t.cycleLine,
        value: fillTemplate(t.repeatValue, {
          count: String(line.repeatCount),
          unit: line.repeatCount === 1 ? t.cycleUnit.singular : t.cycleUnit.plural,
        }),
      };
    case "CIRCUIT": {
      const unit = circuitStrings.countUnit;
      return {
        name: fillTemplate(t.circuitLine, {
          // Recette iPhone n° 3 du 03/11/2026 : nom du Format ou du modèle d'origine, sinon « Circuit ».
          title: line.title ?? circuitStrings.title,
          nature: circuitStrings.natureAdjective[line.nature],
        }),
        value: fillTemplate(t.repeatValue, {
          count: String(line.repeatCount),
          unit: line.repeatCount === 1 ? unit.singular : unit.plural,
        }),
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
                <Text
                  style={[styles.value, isContainer ? styles.containerValue : null, isRecovery ? styles.muted : null]}
                  numberOfLines={1}
                >
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
  // D-507 : « N passages » / « N tours » dans la colonne des volumes, en gris comme leur conteneur
  // (Figma `6214:3696` : `#595E66`).
  containerValue: {
    color: colors.textSecondary,
  },
  muted: {
    color: colors.catalogueSessionMuted,
  },
});
