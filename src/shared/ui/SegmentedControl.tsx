import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from "react-native";

import { colors, dimensions, fixedRadii, type } from "@/shared/ui/tokens";

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /** Nom accessible du segment — `label` par défaut. Utile pour annoncer explicitement un segment désactivé (D-108). */
  readonly accessibilityLabel?: string;
  /** Sous-titre facultatif sous le libellé (variante « Paramètres », Ordre des côtés — D-341). */
  readonly subtitle?: string;
};

/** Contour du cadre de la variante « Paramètres » (figés `6407-9805`, `6665-26185`). */
const PARAMETERS_BORDER_WIDTH = 1;
/** Hauteur minimale par défaut de la variante « Paramètres » (cadre figé 330×42). */
const PARAMETERS_MIN_HEIGHT = 42;

/** Épaisseur de la bordure de `styles.container` — extraite en constante pour que le centrage vertical du cadre (`indicatorTop`) la prenne en compte sans jamais dupliquer la valeur en dur (drift). */
// Complément d'alignement du 07/10 (ajout C) : le cadre standard n'a plus de
// contour (`DSF / Controls / Segmenté` `7388:13779`) ; la constante reste la
// seule source du calcul de centrage vertical.
const CONTAINER_BORDER_WIDTH = 0;

export type SegmentedControlProps<T extends string> = {
  readonly options: readonly SegmentedControlOption<T>[];
  /** `null` : aucune option choisie, aucun cadre de sélection (v13 : mode non renseigné « — »). */
  readonly value: T | null;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
  /**
   * `standard` (défaut, Catalogue) : rendu DSF inchangé, hauteur fixe 42.
   * `parameters` (feuille Paramètres, D-341 et X-1 du 12/10) : cadre blanc à
   * contour, options figées, libellés centrés sans troncature, hauteur
   * MINIMALE qui grandit avec le texte agrandi.
   */
  readonly variant?: "standard" | "parameters";
  /** Typographie des libellés (variante « Paramètres ») ; couleurs gérées par le composant. */
  readonly labelStyle?: StyleProp<TextStyle>;
  /** Hauteur minimale de la variante « Paramètres » (42 par défaut ; 60 pour l’Ordre des côtés). */
  readonly minHeight?: number;
};

/**
 * `Controls / Segmented — Source exact` (V2-CAT-01, plan §7 étape 7 ; revue
 * indépendante 5732014381, obligation 3), extrait comme composant canonique
 * partagé — auparavant deux copies locales divergentes (`ExerciseScreen.tsx`,
 * `CatalogueScreen.tsx` `ContentTypeSelector`).
 *
 * Répartit ses options par Flexbox (largeur égale, dérivée de l'espace
 * réellement disponible — mesuré via `onLayout`, jamais une largeur figée),
 * conserve la géométrie DSF canonique (`dimensions.segmentedControl`) et
 * anime un CADRE unique qui glisse continûment vers le segment sélectionné
 * (`Animated.timing`, jamais un saut brutal ni une disparition pendant la
 * transition) — le fond `colors.selection` n'est donc plus appliqué segment
 * par segment mais porté par ce seul cadre commun.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
  variant = "standard",
  labelStyle,
  minHeight = PARAMETERS_MIN_HEIGHT,
}: SegmentedControlProps<T>) {
  const parameters = variant === "parameters";
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerWidth = containerSize.width;
  const foundIndex = value === null ? -1 : options.findIndex((option) => option.value === value);
  // Standard : comportement historique conservé (valeur inconnue → premier segment).
  // `null` : aucun cadre de sélection, dans les deux variantes.
  const showIndicator = value !== null && (parameters ? foundIndex >= 0 : true);
  const selectedIndex = Math.max(0, foundIndex);
  // `useState` (jamais `useRef(...).current`) : l'instance `Animated.Value`
  // reste stable entre rendus, mais n'est jamais lue via un ref pendant le
  // rendu (`react-hooks/refs`) — seul l'initialiseur s'exécute une fois.
  const [indicatorPosition] = useState(() => new Animated.Value(selectedIndex));
  const hasMeasuredRef = useRef(false);

  useEffect(() => {
    if (!hasMeasuredRef.current) {
      // Premier rendu mesuré : positionne le cadre immédiatement sur le
      // segment déjà sélectionné, sans l'animer depuis l'index `0` (ce
      // serait un saut visible, pas un glissement continu).
      indicatorPosition.setValue(selectedIndex);
      hasMeasuredRef.current = true;
      return;
    }
    Animated.timing(indicatorPosition, {
      toValue: selectedIndex,
      duration: 220,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  function handleContainerLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  const padding = dimensions.segmentedControl.padding;
  const gap = dimensions.segmentedControl.gap;
  const borderWidth = parameters ? PARAMETERS_BORDER_WIDTH : CONTAINER_BORDER_WIDTH;
  // Variante « Paramètres » : les cadres absolus suivent la hauteur RÉELLE du
  // conteneur (texte agrandi), au lieu de la hauteur fixe standard.
  const segmentHeight = parameters
    ? Math.max(0, containerSize.height - borderWidth * 2 - padding * 2)
    : dimensions.segmentedControl.segmentHeight;
  // VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 2) : le
  // cadre coloré (positionné en absolu) se rapporte à la boîte de
  // remplissage du conteneur (bordure exclue) — `top: padding` seul
  // ignorait la bordure (`CONTAINER_BORDER_WIDTH`), décalant le cadre d'un
  // point vers le haut (marge haute 4, marge basse 2). Centré ici sur la
  // hauteur RÉELLEMENT disponible (hauteur totale moins bordure haute et
  // basse), marges haute et basse désormais rigoureusement égales.
  const indicatorTop = parameters
    ? padding
    : (dimensions.segmentedControl.height -
        CONTAINER_BORDER_WIDTH * 2 -
        dimensions.segmentedControl.segmentHeight) /
      2;
  const innerWidth = Math.max(0, containerWidth - borderWidth * 2 - padding * 2);
  const segmentWidth =
    options.length > 0 ? Math.max(0, (innerWidth - gap * (options.length - 1)) / options.length) : 0;
  const step = segmentWidth + gap;

  const translateX = indicatorPosition.interpolate({
    inputRange: options.map((_, index) => index),
    outputRange: options.map((_, index) => index * step),
  });

  // Ajout C : chaque option inactive porte un fond `#EAEAFF` de rayon 10.
  // Ces fonds sont une couche FIXE sous l'indicateur animé (l'option
  // sélectionnée est recouverte par l'indicateur), pour que le glissement de
  // la sélection reste inchangé et que les zones pressables restent
  // transparentes.
  const inactiveTiles =
    containerWidth > 0
      ? options.map((option, index) => (
          <View
            key={`tile-${option.value}`}
            pointerEvents="none"
            testID={testID ? `${testID}-tile-${option.value}` : undefined}
            style={[
              styles.tile,
              parameters ? styles.tileParameters : null,
              { left: padding + index * step, top: indicatorTop, width: segmentWidth, height: segmentHeight },
            ]}
          />
        ))
      : null;

  return (
    <View
      style={[
        styles.container,
        parameters ? [styles.containerParameters, { minHeight }] : styles.containerStandard,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleContainerLayout}
      testID={testID}
    >
      {inactiveTiles}
      {containerWidth > 0 && showIndicator ? (
        <Animated.View
          pointerEvents="none"
          testID={testID ? `${testID}-indicator` : undefined}
          style={[
            styles.indicator,
            {
              left: padding,
              top: indicatorTop,
              width: segmentWidth,
              height: segmentHeight,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = value !== null && option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: Boolean(option.disabled) }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={parameters ? [styles.segmentParameters, { minHeight: minHeight - borderWidth * 2 - padding * 2 }] : styles.segment}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <Text
              style={[
                styles.label,
                parameters ? [labelStyle, styles.labelCentered] : null,
                selected ? styles.labelSelected : null,
                option.disabled ? styles.labelDisabled : null,
              ]}
            >
              {option.label}
            </Text>
            {option.subtitle ? (
              <Text
                style={[styles.subtitle, selected ? styles.subtitleSelected : null]}
                testID={testID ? `${testID}-${option.value}-subtitle` : undefined}
              >
                {option.subtitle}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    // VISUAL_CORRECTION (obligation 2) : centrage vertical explicite des
    // segments eux-mêmes (défense en profondeur, indépendante du calcul
    // pixel exact de `indicatorTop` ci-dessus, qui ne régit que le cadre
    // coloré positionné en absolu).
    alignItems: "center",
    width: "100%",
    padding: dimensions.segmentedControl.padding,
    gap: dimensions.segmentedControl.gap,
  },
  // Standard (Catalogue) : valeurs historiques inchangées.
  containerStandard: {
    height: dimensions.segmentedControl.height,
    backgroundColor: colors.segmentedSurface,
    borderWidth: CONTAINER_BORDER_WIDTH,
    borderRadius: dimensions.segmentedControl.containerRadius,
  },
  // « Paramètres » (figés 6407-9805 / 6665-26185) : cadre blanc, contour #DBDEE3,
  // rayon 12, hauteur minimale ; les options s’étirent sur la hauteur réelle.
  containerParameters: {
    alignItems: "stretch",
    backgroundColor: colors.background,
    borderWidth: PARAMETERS_BORDER_WIDTH,
    borderColor: colors.parametersSegmentedBorder,
    borderRadius: fixedRadii[12],
  },
  tileParameters: {
    backgroundColor: colors.parametersSegmentedOption,
    borderWidth: 1,
    borderColor: colors.background,
  },
  segmentParameters: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: dimensions.segmentedControl.padding,
    paddingVertical: 2,
    borderRadius: dimensions.segmentedControl.segmentRadius,
  },
  labelCentered: {
    textAlign: "center",
  },
  subtitle: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  subtitleSelected: {
    color: colors.selectionSubtitle,
  },
  tile: {
    position: "absolute",
    height: dimensions.segmentedControl.segmentHeight,
    borderRadius: dimensions.segmentedControl.segmentRadius,
    backgroundColor: colors.segmentedInactiveSurface,
  },
  indicator: {
    position: "absolute",
    height: dimensions.segmentedControl.segmentHeight,
    borderRadius: dimensions.segmentedControl.segmentRadius,
    backgroundColor: colors.selection,
  },
  segment: {
    flex: 1,
    height: dimensions.segmentedControl.segmentHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimensions.segmentedControl.segmentRadius,
  },
  // Ajout C : libellés `type.segmentedLabel` (Semi Bold 16/20) ; texte
  // inactif `color/text-label`, sélectionné blanc (inchangé), désactivé
  // `color/disabled` (inchangé).
  label: {
    ...type.segmentedLabel,
    color: colors.textLabel,
  },
  labelSelected: {
    color: colors.background,
  },
  labelDisabled: {
    color: colors.disabled,
  },
});
