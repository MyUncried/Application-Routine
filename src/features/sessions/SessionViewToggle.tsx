import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { strings } from "@/shared/i18n";
import { CONTEXT_LINE_SELECTED, CONTEXT_SEPARATOR, CONTEXT_SEPARATOR_GAP, CONTEXT_TEXT_COLOR } from "@/shared/ui/catalogueContext";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import type { SessionCatalogueView } from "./sessionCatalogueView";

/**
 * PRE-8 (epic E, story E.4 ; spécification du 27/10 §4) — bascule de vue « Un exercice | Plusieurs »,
 * deux textes simples, sans option « Toutes ». Aucune option choisie : collection complète ; toucher
 * l'option active la désélectionne (annoncé). Cibles de 44 de haut par `hitSlop` vertical, sans
 * débord horizontal entre les deux options.
 *
 * PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026 §4 ; CE-CAT-CTX-01 ;
 * Figma `1992:9910`) : première ligne de la zone de contexte, « Un exercice N · Plusieurs N ». Seul
 * le LIBELLÉ est une commande (bascule inchangée) ; le nombre `N`, accolé, est un texte informatif
 * (14 Regular `#333333`), hors de la cible. Libellés 14 pt, inactifs `#595E66` Regular, actif bleu
 * Kodjo Semi Bold ; séparateur « · » (D-503, 06/11/2026 ; avant « | » `#9499A8`). `counts` absent (liste non
 * chargée) : libellés seuls.
 */

const t = strings.screens.sessions.view;

const OPTIONS: readonly { readonly value: SessionCatalogueView; readonly label: string }[] = [
  { value: "SINGLE", label: t.single },
  { value: "MULTIPLE", label: t.multiple },
];

const LABEL_LINE = 17;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - LABEL_LINE) / 2);

export function SessionViewToggle({
  value,
  onToggle,
  counts,
  onLayout,
  testID,
}: {
  readonly value: SessionCatalogueView | null;
  readonly onToggle: (view: SessionCatalogueView) => void;
  /** Nombre réel de Séances de chaque vue ; absent : aucun nombre affiché. */
  readonly counts?: { readonly SINGLE: number; readonly MULTIPLE: number } | null;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly testID: string;
}) {
  return (
    <View style={styles.row} onLayout={onLayout} accessibilityRole="radiogroup" testID={testID}>
      {OPTIONS.map((option, index) => {
        const selected = value === option.value;
        return (
          <View key={option.value} style={styles.optionGroup}>
            {index > 0 ? (
              <Text style={styles.separator} accessible={false} importantForAccessibility="no" testID={`${testID}-separator`}>
                {CONTEXT_SEPARATOR}
              </Text>
            ) : null}
            <Pressable
              onPress={() => onToggle(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              accessibilityHint={selected ? t.deselectHint : t.selectHint}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP }}
              style={styles.option}
              testID={`${testID}-${option.value}`}
            >
              <Text style={[styles.label, selected ? styles.labelSelected : null]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
            {counts ? (
              <Text style={styles.count} numberOfLines={1} testID={`${testID}-${option.value}-count`}>
                {String(counts[option.value])}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  optionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  option: {
    minHeight: LABEL_LINE,
    justifyContent: "center",
  },
  // D-503 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §4 ; Figma `1992:9910`, `10681:20037`) :
  // « · » `#333333`, 8 pt de part et d'autre, comme le Catalogue des Mouvements.
  // [Avant : « | » `#9499A8` à 10 du nombre qui précède et du libellé qui suit (x = 127) — remplacé.]
  separator: {
    ...type.contextLine,
    color: CONTEXT_TEXT_COLOR,
    marginHorizontal: CONTEXT_SEPARATOR_GAP,
  },
  label: {
    ...type.contextLine,
    color: colors.textSecondary,
  },
  labelSelected: {
    ...CONTEXT_LINE_SELECTED,
    color: colors.primary,
  },
  // Figma : nombre à 6 du libellé (« Un exercice » 24..102, « 2 » à 108).
  count: {
    ...type.contextLine,
    color: CONTEXT_TEXT_COLOR,
    marginLeft: spacing[6],
  },
});
