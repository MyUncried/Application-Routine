import { Pressable, StyleSheet, View } from "react-native";

import { SESSION_COLORS, type SessionColor } from "@/domain/sessions/Session";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui/tokens";

export type ColorPaletteProps = {
  value: SessionColor;
  onChange: (color: SessionColor) => void;
  isOpen: boolean;
  onToggle: () => void;
};

/**
 * Contrôle de couleur compact + palette de 12 couleurs en grille 4×3
 * (docs §06 « En-tête »). L'ouverture/fermeture est contrôlée par
 * `CompositionScreen` (état `openOverlay` unique, exclusivité avec les
 * sélecteurs de durée — plan §5). Sélectionner une couleur l'applique au
 * brouillon puis referme la palette automatiquement — micro-arbitrage
 * fonctionnel conventionnel validé (contre-vérification T01-S07) : la
 * couleur retenue reste visible immédiatement via le contrôle compact.
 */
export function ColorPalette({ value, onChange, isOpen, onToggle }: ColorPaletteProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={strings.screens.composition.colorPicker.label}
        accessibilityState={{ expanded: isOpen }}
        style={[styles.swatch, { backgroundColor: value }]}
      />
      {isOpen ? (
        <View
          style={styles.grid}
          accessibilityRole="radiogroup"
          accessibilityLabel={strings.screens.composition.colorPicker.paletteAccessibilityLabel}
        >
          {SESSION_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === value }}
              accessibilityLabel={`${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`}
              style={[
                styles.gridSwatch,
                { backgroundColor: color },
                color === value ? styles.gridSwatchSelected : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const SWATCH_SIZE = 32;
const GRID_SWATCH_SIZE = 40;

const styles = StyleSheet.create({
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: GRID_SWATCH_SIZE * 4 + spacing[8] * 3,
    gap: spacing[8],
    marginTop: spacing[8],
  },
  gridSwatch: {
    width: GRID_SWATCH_SIZE,
    height: GRID_SWATCH_SIZE,
    borderRadius: GRID_SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  gridSwatchSelected: {
    borderColor: colors.textPrimary,
  },
});
