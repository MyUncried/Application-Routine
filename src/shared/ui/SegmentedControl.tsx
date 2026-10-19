import { useEffect, useRef, useState, type ReactNode } from "react";
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

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { colors, dimensions, fixedRadii, type } from "@/shared/ui/tokens";

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  /** Nom accessible du segment — `label` par défaut. Utile pour annoncer explicitement un segment désactivé (D-108). */
  readonly accessibilityLabel?: string;
  /** Sous-titre facultatif sous le libellé (variante « Paramètres », Ordre des côtés — D-341). */
  readonly subtitle?: string;
  /**
   * Variante `inline` seulement (PRE-5, AD-24, FR-28, Δ33) : chevron intérieur
   * graphique, centré avec le libellé — `up` si le contenu de l'option est
   * déployé, `down` sinon. Icône existante `control-chevron-up/down` de
   * `KodjoIcon` (celle de `DisclosureControl`), jamais une flèche ni un
   * caractère. Son appui (`onChevronPress`) est distinct de la sélection.
   */
  readonly chevron?: "up" | "down";
  /** Nom accessible du chevron (variante `inline`) — `accessibilityLabel` ou `label` de l'option par défaut. */
  readonly chevronAccessibilityLabel?: string;
  /**
   * Variante `inline` seulement (AD-24, D-432) : contenu rendu à la place du
   * libellé quand l'option est sélectionnée (« n phases » et stepper révélé
   * existant, story 2.8). Le chevron éventuel reste rendu par le composant.
   */
  readonly selectedContent?: ReactNode;
  /**
   * Variante `inline` seulement (recette du 19/10, RC-6, Figma `9462:18986`) :
   * largeur propre de l'option, à la place de `optionWidth` (Avec du
   * Changement de côté, qui porte la notation de l'Enchainement). Le cadre
   * de sélection glisse et prend la largeur de l'option choisie.
   */
  readonly width?: number;
  /** Variante `inline` seulement (RC-6) : police réduite pour cette seule option (notation de l'Enchainement). */
  readonly compact?: boolean;
};

/**
 * Relevé Figma UX-DR1 de la variante `inline` (PRE-5 story 2.3, S-2), en
 * lecture seule le 19/10 : frame `8328:38193` (Feuille « Paramètres
 * d'exécution », quatre cadres), segmentés `9230:19475` (Mode),
 * `9230:19548` (Changement de côté, chevron), `9230:19557` (Enchainement,
 * police réduite) et `9230:19584` (Cadence). Constantes locales, aucun jeton
 * modifié (NFR-3).
 */
/** Hauteur du cadre (32), marge intérieure (3), écart entre options (2), rayon du cadre (8). */
const INLINE_HEIGHT = 32;
const INLINE_PADDING = 3;
const INLINE_GAP = 2;
const INLINE_RADIUS = 8;
/** Option : hauteur 26, rayon 5 ; écart libellé–chevron 4. */
const INLINE_OPTION_HEIGHT = 26;
const INLINE_OPTION_RADIUS = 5;
const INLINE_CONTENT_GAP = 4;
/** Libellés Inter 12/16 (regular non sélectionné, Semi Bold sélectionné) ; 10 en police réduite (Enchainement, FR-17). */
const INLINE_LABEL_SIZE = 12;
const INLINE_COMPACT_LABEL_SIZE = 10;
const INLINE_LABEL_LINE_HEIGHT = 16;
/** Gris regular des options non sélectionnées (`#4A4A52`, aucun jeton équivalent). */
const INLINE_UNSELECTED_LABEL_COLOR = "#4A4A52";
/**
 * Cadre du chevron 10 × 10, tracé 8 × 4 : l'icône existante (`viewBox` 24,
 * tracé 12 × 6) affichée à `chevronDisplaySize` (16) donne exactement ce
 * tracé, comme dans `DisclosureControl` ; elle déborde du cadre sans en
 * changer l'encombrement.
 */
const INLINE_CHEVRON_FRAME = 10;
/** Cible du chevron agrandie jusqu'aux bords du cadre (hauteur 32), sans empiéter sur les lignes voisines. */
const INLINE_CHEVRON_HIT_SLOP = {
  top: (INLINE_HEIGHT - INLINE_CHEVRON_FRAME) / 2,
  bottom: (INLINE_HEIGHT - INLINE_CHEVRON_FRAME) / 2,
  left: INLINE_CONTENT_GAP,
  right: INLINE_CONTENT_GAP,
};

/**
 * Largeurs d'option relevées (même largeur pour toutes les options d'un même
 * contrôle, FR-27) : `wide` 106 (Mode, Condition d'arrêt, Type de série),
 * `narrow` 62 (Phases, Charge, Cadence, et Sans du Changement de côté),
 * `notation` 146 (option Avec du Changement de côté, portant la notation de
 * l'Enchainement : recette du 19/10, RC-6 puis RC-11 et RC-12 ; 144 / 62 sous
 * RC-6, Figma `9462:18987` ; 104 / 104 sous RC-11). RC-12 : Sans de 62 comme
 * les autres Sans de la page, Avec élargi de la largeur gagnée (104 + 42 = 146),
 * segmenté de 216 inchangé, libellé sur deux lignes ; notation D-431 complète
 * Semi Bold 10 (99,5 hors « ➜ » de repli, environ 10) + écart 6 + chevron 10,
 * environ 126. Recette du 20/10 (RC-13) : Avec ne prend 146 que sélectionné à N > 1
 * (notation et chevron) ; sinon « Avec » de 62, comme Sans. La Cadence a trois
 * options de 62 depuis la recette du 19/10 (RC-10) ; l'ancienne largeur `cadence` (46,4, cinq options) est retirée.
 */
export const INLINE_OPTION_WIDTHS = { wide: 106, narrow: 62, notation: 146 } as const;

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
   * `inline` (PRE-5 story 2.3, AD-24) : segmenté en ligne de la Feuille,
   * géométrie fixe relevée sur Figma (32 / 26, `optionWidth`), aligné à
   * droite ; ignore `labelStyle`, `minHeight` et `subtitle`.
   */
  readonly variant?: "standard" | "parameters" | "inline";
  /** Typographie des libellés (variante « Paramètres ») ; couleurs gérées par le composant. */
  readonly labelStyle?: StyleProp<TextStyle>;
  /** Hauteur minimale de la variante « Paramètres » (42 par défaut ; 60 pour l’Ordre des côtés). */
  readonly minHeight?: number;
  /**
   * `inline` (PRE-5, AD-24, FR-27) : largeur commune des options —
   * `INLINE_OPTION_WIDTHS.narrow` (62) par défaut. Le contrôle mesure
   * `n × largeur + écarts + marges` et s'aligne à droite.
   */
  readonly optionWidth?: number;
  /** `inline` : appui sur le chevron d'une option (FR-28), distinct de `onChange` ; sans lui, le chevron est décoratif. */
  readonly onChevronPress?: (value: T) => void;
  /** `inline` : police réduite (FR-17, Enchainement), sans changement de géométrie. */
  readonly compact?: boolean;
  /**
   * `inline` : contrôle non interactif, annoncé comme une information non
   * modifiable (résultat dérivé de la Condition d'arrêt, FR-20). Rendu
   * atténué (PRE-5 story 2.4, UX-DR2, relevé `9230:44720`) : le contrôle
   * entier à `UNSELECTED_OPACITY` (45 %), sélection violette, texte blanc.
   */
  readonly readOnly?: boolean;
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
 *
 * Exception, variante `inline` (PRE-5 story 2.3) : la largeur des options est
 * figée par le relevé Figma (`optionWidth`) et le contrôle se dimensionne
 * lui-même, sans mesure ; le même cadre unique animé y glisse.
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
  optionWidth = INLINE_OPTION_WIDTHS.narrow,
  onChevronPress,
  compact = false,
  readOnly = false,
}: SegmentedControlProps<T>) {
  const parameters = variant === "parameters";
  const inline = variant === "inline";
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // `inline` : largeur connue d'avance (options de largeur fixe, propre à
  // l'option si elle en donne une, RC-6), sans mesure.
  const inlineWidths = options.map((option) => option.width ?? optionWidth);
  const inlineOffsets = inlineWidths.map((_, index) =>
    inlineWidths.slice(0, index).reduce((sum, width) => sum + width + INLINE_GAP, 0),
  );
  const inlineUniform = inlineWidths.every((width) => width === optionWidth);
  const inlineWidth =
    options.length > 0
      ? inlineWidths.reduce((sum, width) => sum + width, 0) + INLINE_GAP * (options.length - 1) + INLINE_PADDING * 2
      : INLINE_PADDING * 2;
  const containerWidth = inline ? inlineWidth : containerSize.width;
  const foundIndex = value === null ? -1 : options.findIndex((option) => option.value === value);
  // Standard : comportement historique conservé (valeur inconnue → premier segment).
  // `null` : aucun cadre de sélection, dans toutes les variantes ; valeur
  // inconnue : aucun cadre en `parameters` et `inline`.
  const showIndicator = value !== null && (parameters || inline ? foundIndex >= 0 : true);
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
    const animation = Animated.timing(indicatorPosition, {
      toValue: selectedIndex,
      duration: 220,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  function handleContainerLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  const padding = inline ? INLINE_PADDING : dimensions.segmentedControl.padding;
  const gap = inline ? INLINE_GAP : dimensions.segmentedControl.gap;
  const borderWidth = parameters ? PARAMETERS_BORDER_WIDTH : CONTAINER_BORDER_WIDTH;
  // Variante « Paramètres » : les cadres absolus suivent la hauteur RÉELLE du
  // conteneur (texte agrandi), au lieu de la hauteur fixe standard.
  const segmentHeight = inline
    ? INLINE_OPTION_HEIGHT
    : parameters
      ? Math.max(0, containerSize.height - borderWidth * 2 - padding * 2)
      : dimensions.segmentedControl.segmentHeight;
  // VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 2) : le
  // cadre coloré (positionné en absolu) se rapporte à la boîte de
  // remplissage du conteneur (bordure exclue) — `top: padding` seul
  // ignorait la bordure (`CONTAINER_BORDER_WIDTH`), décalant le cadre d'un
  // point vers le haut (marge haute 4, marge basse 2). Centré ici sur la
  // hauteur RÉELLEMENT disponible (hauteur totale moins bordure haute et
  // basse), marges haute et basse désormais rigoureusement égales.
  const indicatorTop =
    parameters || inline
      ? padding
      : (dimensions.segmentedControl.height -
          CONTAINER_BORDER_WIDTH * 2 -
          dimensions.segmentedControl.segmentHeight) /
        2;
  const innerWidth = Math.max(0, containerWidth - borderWidth * 2 - padding * 2);
  const segmentWidth = inline
    ? optionWidth
    : options.length > 0
      ? Math.max(0, (innerWidth - gap * (options.length - 1)) / options.length)
      : 0;
  const step = segmentWidth + gap;

  // `interpolate` exige au moins deux points : une option unique (résultat
  // dérivé « À la cible et à l'échec », FR-20) garde une plage [0, 1].
  const indexRange = options.length > 1 ? options.map((_, index) => index) : [0, 1];
  // `inline` à largeurs propres (RC-6) : position et largeur du cadre suivent
  // l'option ; largeurs communes : calcul historique inchangé.
  const offsetAt = (index: number) => (inline && !inlineUniform ? (inlineOffsets[index] ?? index * step) : index * step);
  const widthAt = (index: number) => (inline ? (inlineWidths[index] ?? optionWidth) : segmentWidth);
  const translateX = indicatorPosition.interpolate({
    inputRange: indexRange,
    outputRange: indexRange.map(offsetAt),
  });
  const indicatorWidth =
    inline && !inlineUniform
      ? indicatorPosition.interpolate({ inputRange: indexRange, outputRange: indexRange.map(widthAt) })
      : segmentWidth;

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
              inline ? styles.tileInline : null,
              { left: padding + offsetAt(index), top: indicatorTop, width: widthAt(index), height: segmentHeight },
            ]}
          />
        ))
      : null;

  const indicator =
    containerWidth > 0 && showIndicator ? (
      <Animated.View
        pointerEvents="none"
        testID={testID ? `${testID}-indicator` : undefined}
        style={[
          styles.indicator,
          inline ? styles.indicatorInline : null,
          {
            left: padding,
            top: indicatorTop,
            width: indicatorWidth,
            height: segmentHeight,
            transform: [{ translateX }],
          },
        ]}
      />
    ) : null;

  if (inline) {
    // PRE-5 story 2.3 (AD-24, FR-27, FR-28, FR-17, FR-20) : segmenté en ligne,
    // aligné à droite par sa ligne et centré verticalement (RC-8), sans
    // enveloppe blanche ; mêmes fonds fixes et même
    // cadre violet animé que les autres variantes. Chaque option superpose sa
    // zone de sélection (pleine largeur) et son contenu centré (libellé ou
    // `selectedContent`, puis chevron) : le chevron et le contenu fourni
    // restent des cibles distinctes de la sélection.
    const selectedOption = foundIndex >= 0 && value !== null ? options[foundIndex] : null;
    const readOnlyLabel = [
      accessibilityLabel,
      selectedOption ? (selectedOption.accessibilityLabel ?? selectedOption.label) : null,
    ]
      .filter(Boolean)
      .join(", ");
    return (
      <View
        style={[styles.inlineContainer, { width: inlineWidth }, readOnly ? styles.inlineReadOnly : null]}
        // Lecture seule (FR-20) : un seul élément accessible, de rôle texte,
        // qui annonce le libellé et la valeur, sans action.
        accessible={readOnly ? true : undefined}
        accessibilityRole={readOnly ? "text" : "tablist"}
        accessibilityLabel={readOnly ? readOnlyLabel : accessibilityLabel}
        testID={testID}
      >
        {inactiveTiles}
        {indicator}
        {options.map((option) => {
          const selected = value !== null && option.value === value;
          const optionTestID = testID ? `${testID}-${option.value}` : undefined;
          const showSelectedContent = selected && option.selectedContent !== undefined;
          const chevronIcon = option.chevron ? (
            <KodjoIcon
              name={option.chevron === "up" ? "control-chevron-up" : "control-chevron-down"}
              size={dimensions.catalogueDisclosure.chevronDisplaySize}
              tintColor={
                option.disabled ? colors.disabled : selected ? colors.background : INLINE_UNSELECTED_LABEL_COLOR
              }
              testID={testID ? `${testID}-${option.value}-chevron-icon` : undefined}
            />
          ) : null;
          const chevronInteractive = Boolean(option.chevron && onChevronPress && !readOnly && !option.disabled);
          return (
            <View key={option.value} style={[styles.inlineOption, { width: option.width ?? optionWidth }]}>
              {readOnly ? null : (
                <Pressable
                  disabled={option.disabled}
                  onPress={() => onChange(option.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected, disabled: Boolean(option.disabled) }}
                  accessibilityLabel={option.accessibilityLabel ?? option.label}
                  style={styles.inlinePressable}
                  testID={optionTestID}
                />
              )}
              <View pointerEvents="box-none" style={styles.inlineContent}>
                {showSelectedContent ? (
                  option.selectedContent
                ) : (
                  // Le nom est porté par la zone de sélection (ou par le
                  // conteneur en lecture seule) : le texte n'est pas annoncé
                  // une seconde fois.
                  <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Text
                      style={[
                        styles.inlineLabel,
                        compact || option.compact ? styles.inlineLabelCompact : null,
                        selected ? styles.inlineLabelSelected : null,
                        option.disabled ? styles.labelDisabled : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                )}
                {chevronIcon === null ? null : chevronInteractive ? (
                  <Pressable
                    onPress={() => onChevronPress?.(option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={option.chevronAccessibilityLabel ?? option.accessibilityLabel ?? option.label}
                    accessibilityState={{ expanded: option.chevron === "up" }}
                    hitSlop={INLINE_CHEVRON_HIT_SLOP}
                    style={styles.inlineChevron}
                    testID={testID ? `${testID}-${option.value}-chevron` : undefined}
                  >
                    {chevronIcon}
                  </Pressable>
                ) : (
                  <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={styles.inlineChevron}
                    testID={testID ? `${testID}-${option.value}-chevron` : undefined}
                  >
                    {chevronIcon}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

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
      {indicator}
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
  // PRE-5 story 2.3 — variante `inline` (relevé UX-DR1 ci-dessus).
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    // Recette du 19/10 (RC-8) : `flex-end` plaçait le contrôle au bas de sa ligne (rangée
    // horizontale de 44) ; centré verticalement avec le libellé, la ligne le pousse à
    // droite (`space-between`).
    alignSelf: "center",
    height: INLINE_HEIGHT,
    padding: INLINE_PADDING,
    gap: INLINE_GAP,
    borderRadius: INLINE_RADIUS,
  },
  // Story 2.4 (UX-DR2, `9230:44720`) : résultat dérivé, violet atténué et texte blanc.
  inlineReadOnly: {
    opacity: UNSELECTED_OPACITY,
  },
  // Fond clair des champs variables (`color/surface`, `#F5F7FA`).
  tileInline: {
    borderRadius: INLINE_OPTION_RADIUS,
    backgroundColor: colors.surface,
  },
  indicatorInline: {
    borderRadius: INLINE_OPTION_RADIUS,
  },
  inlineOption: {
    height: INLINE_OPTION_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: INLINE_OPTION_RADIUS,
  },
  inlinePressable: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: INLINE_OPTION_RADIUS,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: INLINE_CONTENT_GAP,
  },
  inlineLabel: {
    fontFamily: type.supporting.fontFamily,
    fontWeight: type.supporting.fontWeight,
    fontSize: INLINE_LABEL_SIZE,
    lineHeight: INLINE_LABEL_LINE_HEIGHT,
    color: INLINE_UNSELECTED_LABEL_COLOR,
    textAlign: "center",
  },
  inlineLabelCompact: {
    fontSize: INLINE_COMPACT_LABEL_SIZE,
  },
  inlineLabelSelected: {
    fontFamily: type.segmentedLabel.fontFamily,
    fontWeight: type.segmentedLabel.fontWeight,
    color: colors.background,
  },
  inlineChevron: {
    width: INLINE_CHEVRON_FRAME,
    height: INLINE_CHEVRON_FRAME,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Recette du 19/10 (RC-6) : habillage d'une option `inline` sélectionnée en police réduite
 * et cadre de son chevron, repris par un `selectedContent` qui reproduit le contenu de
 * l'option (notation de l'Enchainement dans le déclencheur du menu natif), sans en
 * dupliquer les valeurs.
 */
export const inlineSelectedCompactLabelStyle = [styles.inlineLabel, styles.inlineLabelCompact, styles.inlineLabelSelected];
/**
 * PRE-5 story 2.7 (AD-28) : libellé d'une option `inline` sélectionnée, police non réduite
 * (Semi Bold 12, blanc), repris par le champ de la charge commune rendu dans l'option Avec.
 */
export const inlineSelectedLabelStyle = [styles.inlineLabel, styles.inlineLabelSelected];
export const inlineChevronFrameStyle = styles.inlineChevron;
/** Hauteur d'une option `inline` (RC-6, même usage). */
export const INLINE_OPTION_CONTENT_HEIGHT = INLINE_OPTION_HEIGHT;
/** Rayon d’une option `inline` (PRE-5 story 2.7 : champ de la charge commune dans l’option Avec). */
export const INLINE_OPTION_CONTENT_RADIUS = INLINE_OPTION_RADIUS;
