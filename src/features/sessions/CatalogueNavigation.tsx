import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, minTouchTarget } from "@/shared/ui/tokens";

/**
 * Recette iPhone CAT.1 du 30/10/2026 (Hermann, cat-titre : « Adopter le style texte de Figma ») —
 * navigation des Catalogues Mouvements / Séances / Programmes dans l'en-tête, au style texte de
 * Figma, à la place du contrôle segmenté encadré. [Remplace, au 30/10/2026, la conservation
 * « telle quelle » du `SegmentedControl` dans l'en-tête (CAT.1).]
 *
 * D-502 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §4 ; Figma `10266:20575` :
 * `11715:12653`, `10923:19889` à `10923:19893` ; `1992:9910` : `11704:29287`, `10931:19889` à `10931:19891`) :
 * - trois emplacements fixes d'un tiers de la largeur utile (402 − 2 × 16 → 123,33 pt), libellé centré :
 *   le gras ne déplace plus rien ; plus de barres verticales ;
 * - onglet sélectionné : forme de la couleur `context` du Catalogue (`selectedColor`), posée sur la zone
 *   de contexte (bas de l'en-tête) — 43 pt de haut, coins hauts arrondis à 12, bas évasés en courbe
 *   inversée de rayon 10 de part et d'autre (débord de 10 hors de l'emplacement), raccordée à la zone ;
 *   libellé Inter Bold 17, `colors.textPrimary` ;
 * - onglets non sélectionnés (Programmes compris) : Inter Regular 17, `colors.textSecondary`.
 * [Avant : libellés groupés au centre, séparés par des traits « | » noirs 1,5 × 12,2 à 14 pt ; sélectionné
 * Bold bleu Kodjo `#0508E5`, autres Regular noir `#000000` — remplacé.]
 *
 * Comportement inchangé : un seul Catalogue sélectionné, Programmes visible et indisponible (aucune
 * navigation, annoncé indisponible) ; rôles `tablist` / `tab`, état `selected` annoncé.
 */

export type CatalogueNavigationOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
};

/** Figma `Onglet sélectionné — …` (143,33 × 43, dont 10 de débord évasé de chaque côté). */
export const CATALOGUE_TAB_GEOMETRY = { height: 43, topRadius: 12, flareRadius: 10, labelTop: 9.5 } as const;

const NAVIGATION_LINE = 21;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - CATALOGUE_TAB_GEOMETRY.height) / 2);
/** Anneau qui peint l'extérieur d'un quart de cercle de rayon 10 (courbe inversée), sans SVG. */
const FLARE = CATALOGUE_TAB_GEOMETRY.flareRadius;
const FLARE_RING = FLARE;

export function CatalogueNavigation<T extends string>({
  options,
  value,
  onChange,
  selectedColor,
  testID,
}: {
  readonly options: readonly CatalogueNavigationOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** D-502 : couleur `context` du Catalogue actif, portée par l'onglet sélectionné. */
  readonly selectedColor: string;
  readonly testID: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist" testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        const disabled = Boolean(option.disabled);
        return (
          <View key={option.value} style={styles.slot} testID={`${testID}-${option.value}-slot`}>
            {selected ? <SelectedTabShape color={selectedColor} testID={`${testID}-${option.value}-shape`} /> : null}
            <Pressable
              onPress={() => {
                if (!disabled && !selected) onChange(option.value);
              }}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              accessibilityState={{ selected, disabled }}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP }}
              style={styles.tab}
              testID={`${testID}-${option.value}`}
            >
              <Text
                style={[styles.label, selected ? styles.labelSelected : null]}
                numberOfLines={1}
                testID={`${testID}-${option.value}-label`}
              >
                {option.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Forme de l'onglet sélectionné (Figma, tracé `M0 43C5.523 43 10 38.523 10 33V12C10 5.37 15.37 0 22 0H121.33
 * C127.96 0 133.33 5.37 133.33 12V33C133.33 38.52 137.81 43 143.33 43H0Z`) : corps de la largeur de
 * l'emplacement, coins hauts 12 ; de part et d'autre, un carré de 10 au bas dont seul l'extérieur du quart
 * de cercle centré sur son coin haut intérieur est peint (anneau découpé), sans dépendre de la couleur du fond.
 */
function SelectedTabShape({ color, testID }: { readonly color: string; readonly testID: string }) {
  return (
    <View pointerEvents="none" style={styles.shape} accessible={false} importantForAccessibility="no-hide-descendants" testID={testID}>
      <View style={[styles.shapeBody, { backgroundColor: color }]} testID={`${testID}-body`} />
      <View style={[styles.flare, styles.flareLeft]} testID={`${testID}-flare-left`}>
        <View style={[styles.flareRing, styles.flareRingLeft, { borderColor: color }]} />
      </View>
      <View style={[styles.flare, styles.flareRight]} testID={`${testID}-flare-right`}>
        <View style={[styles.flareRing, styles.flareRingRight, { borderColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  slot: {
    flex: 1,
    flexBasis: 0,
    height: CATALOGUE_TAB_GEOMETRY.height,
  },
  shape: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  shapeBody: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: CATALOGUE_TAB_GEOMETRY.topRadius,
    borderTopRightRadius: CATALOGUE_TAB_GEOMETRY.topRadius,
  },
  flare: {
    position: "absolute",
    bottom: 0,
    width: FLARE,
    height: FLARE,
    overflow: "hidden",
  },
  flareLeft: {
    left: -FLARE,
  },
  flareRight: {
    right: -FLARE,
  },
  // Cercle intérieur transparent de rayon 10 centré sur le coin haut EXTÉRIEUR du carré (centre du tracé Figma
  // `(0, 33)` à gauche, `(143,33, 33)` à droite) ; l'anneau peint le reste du carré, côté onglet.
  flareRing: {
    position: "absolute",
    top: -FLARE - FLARE_RING,
    width: 2 * (FLARE + FLARE_RING),
    height: 2 * (FLARE + FLARE_RING),
    borderRadius: FLARE + FLARE_RING,
    borderWidth: FLARE_RING,
  },
  flareRingLeft: {
    left: -FLARE - FLARE_RING,
  },
  flareRingRight: {
    left: FLARE - FLARE - FLARE_RING,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: CATALOGUE_TAB_GEOMETRY.labelTop,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: NAVIGATION_LINE,
    color: colors.textSecondary,
    textAlign: "center",
  },
  labelSelected: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
