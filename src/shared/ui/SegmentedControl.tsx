import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { colors, dimensions, type } from "@/shared/ui/tokens";

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /** Nom accessible du segment — `label` par défaut. Utile pour annoncer explicitement un segment désactivé (D-108). */
  readonly accessibilityLabel?: string;
};

/** Épaisseur de la bordure de `styles.container` — extraite en constante pour que le centrage vertical du cadre (`indicatorTop`) la prenne en compte sans jamais dupliquer la valeur en dur (drift). */
// Complément d'alignement du 07/10 (ajout C) : le cadre standard n'a plus de
// contour (`DSF / Controls / Segmenté` `7388:13779`) ; la constante reste la
// seule source du calcul de centrage vertical.
const CONTAINER_BORDER_WIDTH = 0;

export type SegmentedControlProps<T extends string> = {
  readonly options: readonly SegmentedControlOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
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
}: SegmentedControlProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
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
    setContainerWidth(event.nativeEvent.layout.width);
  }

  const padding = dimensions.segmentedControl.padding;
  const gap = dimensions.segmentedControl.gap;
  // VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 2) : le
  // cadre coloré (positionné en absolu) se rapporte à la boîte de
  // remplissage du conteneur (bordure exclue) — `top: padding` seul
  // ignorait la bordure (`CONTAINER_BORDER_WIDTH`), décalant le cadre d'un
  // point vers le haut (marge haute 4, marge basse 2). Centré ici sur la
  // hauteur RÉELLEMENT disponible (hauteur totale moins bordure haute et
  // basse), marges haute et basse désormais rigoureusement égales.
  const indicatorTop =
    (dimensions.segmentedControl.height -
      CONTAINER_BORDER_WIDTH * 2 -
      dimensions.segmentedControl.segmentHeight) /
    2;
  const innerWidth = Math.max(0, containerWidth - padding * 2);
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
              { left: padding + index * step, top: indicatorTop, width: segmentWidth },
            ]}
          />
        ))
      : null;

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleContainerLayout}
      testID={testID}
    >
      {inactiveTiles}
      {containerWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          testID={testID ? `${testID}-indicator` : undefined}
          style={[
            styles.indicator,
            {
              left: padding,
              top: indicatorTop,
              width: segmentWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: Boolean(option.disabled) }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={styles.segment}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.labelSelected : null,
                option.disabled ? styles.labelDisabled : null,
              ]}
            >
              {option.label}
            </Text>
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
    height: dimensions.segmentedControl.height,
    backgroundColor: colors.segmentedSurface,
    borderWidth: CONTAINER_BORDER_WIDTH,
    borderRadius: dimensions.segmentedControl.containerRadius,
    padding: dimensions.segmentedControl.padding,
    gap: dimensions.segmentedControl.gap,
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
