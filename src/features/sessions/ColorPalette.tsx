import { Pressable, StyleSheet, View } from "react-native";

import { SESSION_COLORS, type SessionColor } from "@/domain/sessions/Session";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing } from "@/shared/ui/tokens";

export type ColorPaletteProps = {
  value: SessionColor;
  onChange: (color: SessionColor) => void;
  isOpen: boolean;
  onToggle: () => void;
};

/**
 * Contrôle de couleur compact + palette de 12 couleurs en grille 4×3
 * (docs §06 « En-tête » ; CE-T01-06). L'ouverture/fermeture est contrôlée par
 * `CompositionScreen` (état `openOverlay` unique, exclusivité avec les
 * sélecteurs de durée — plan §5). Sélectionner une couleur l'applique au
 * brouillon puis referme la palette automatiquement — micro-arbitrage
 * fonctionnel conventionnel validé (contre-vérification T01-S07) : la
 * couleur retenue reste visible immédiatement via le contrôle compact.
 *
 * Corrections de conformité (audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`) :
 * - la grille est désormais `position: "absolute"`, ancrée sous le
 *   déclencheur — elle ne repousse plus le reste de l'en-tête (CE-T01-06,
 *   « ne modifie pas la disposition du contenu sous-jacent ») ;
 * - chaque pastille (déclencheur compact et cases de la grille) porte
 *   désormais une cible tactile réelle d'au moins `48 × 48` via `hitSlop`,
 *   sans agrandir sa taille visuelle (doc12 §Dimensions structurantes,
 *   doc13 §3.3) ;
 * - la couleur sélectionnée porte désormais l'icône `state-selected`
 *   (manifeste `assets/icons/manifest.json`, usage déclaré « Sélecteur de
 *   couleur »), en plus du contour distinct — un indicateur de sélection
 *   n'est jamais porté par la seule couleur (CE-T01-06).
 */
export function ColorPalette({ value, onChange, isOpen, onToggle }: ColorPaletteProps) {
  const swatchHitSlop = (minTouchTarget - SWATCH_SIZE) / 2;
  const gridSwatchHitSlop = (minTouchTarget - GRID_SWATCH_SIZE) / 2;

  return (
    <View style={styles.anchor}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={strings.screens.composition.colorPicker.label}
        accessibilityState={{ expanded: isOpen }}
        hitSlop={swatchHitSlop}
        style={[styles.swatch, { backgroundColor: value }]}
      />
      {isOpen ? (
        <View
          style={styles.popover}
          accessibilityRole="radiogroup"
          accessibilityLabel={strings.screens.composition.colorPicker.paletteAccessibilityLabel}
          testID="color-palette-popover"
        >
          <View style={styles.grid}>
            {SESSION_COLORS.map((color) => {
              const isSelected = color === value;
              return (
                <Pressable
                  key={color}
                  onPress={() => onChange(color)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`}
                  hitSlop={gridSwatchHitSlop}
                  style={[
                    styles.gridSwatch,
                    { backgroundColor: color },
                    isSelected ? styles.gridSwatchSelected : null,
                  ]}
                >
                  {isSelected ? (
                    <KodjoIcon name="state-selected" testID="color-palette-selected-icon" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const SWATCH_SIZE = 32;
const GRID_SWATCH_SIZE = 40;

const styles = StyleSheet.create({
  anchor: {
    // Contexte de positionnement du popover : React Native positionne un
    // enfant `position: "absolute"` relativement à la boîte de son parent
    // immédiat, sans exiger que ce parent porte explicitement
    // `position: "relative"` (contrairement au web).
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  popover: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: spacing[8],
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing[8],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: GRID_SWATCH_SIZE * 4 + spacing[8] * 3,
    gap: spacing[8],
  },
  gridSwatch: {
    width: GRID_SWATCH_SIZE,
    height: GRID_SWATCH_SIZE,
    borderRadius: GRID_SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  gridSwatchSelected: {
    borderColor: colors.textPrimary,
  },
});
