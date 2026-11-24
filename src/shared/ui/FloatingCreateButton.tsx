import { Image } from "expo-image";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import {
  FLOATING_BOTTOM_GAP,
  FLOATING_BUTTON_SIZE,
  FLOATING_EDGE_INSET,
  clampLift,
  restoreFloatingPosition,
  saveFloatingPosition,
  settleFloatingPosition,
  subscribeFloatingPosition,
  type FloatingPosition,
} from "@/shared/ui/floatingCreatePosition";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { colors } from "@/shared/ui/tokens";

/**
 * UI-FAB-01 — bouton flottant « Créer » (D-558, D-559 ; DSF Bouton flottant du 22/11/2026 ; Figma « DSF / Actions /
 * Bouton flottant — Créer » `13039:49732`, six variantes).
 *
 * Rendu (DSF § 2, valeurs du composant Figma) : rond de 60 ; verre blanc dépoli à 65 % sur le flou natif de l'arrière-plan ;
 * ombre large et douce (`#1A1A26`, 14 %, décalage 4, flou 24) ; liseré blanc de 1,2 (blanc 95 %, valeur exportée par Figma) ;
 * contenu bleu `#0508E5` (`colors.primary`).
 * Flou : effet de verre natif d'iOS (`expo-glass-effect`, `GlassView`, déjà dans la build et utilisé par le bouton de
 * lecture de la fiche Mouvement), sans imitation. Sans effet de verre (iOS antérieur à 26, module absent) : le voile
 * blanc à 65 % seul.
 * [Liseré « irrégulier » du DSF (plus brillant en haut à gauche et en bas à droite) : dégradé conique de Figma, sans
 * équivalent natif dans les composants existants ; liseré uniforme à 95 % — écart consigné au rapport UI-FAB-01.]
 */
export type FloatingCreateVariant = "plus" | "calendar" | "movement" | "session" | "program" | "close";

export const FLOATING_CREATE_BLUE = colors.primary;
const GLASS_VEIL = "rgba(255, 255, 255, 0.65)";
const GLASS_BORDER = "rgba(255, 255, 255, 0.95)";
const GLASS_BORDER_WIDTH = 1.2;
const SHADOW = { color: "#1A1A26", opacity: 0.14, offsetY: 4, radius: 24 } as const;
/** Appui maintenu avant le déplacement (DSF § 5 : « un appui maintenu puis un glissement »). Valeur de conception. */
export const FLOATING_LONG_PRESS_MS = 400;

const CALENDAR_ICON = require("../../../assets/icons/fab-calendrier.svg");
const MOVEMENT_ICON = require("../../../assets/icons/fab-mouvement.svg");

function liquidGlassAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    // Module natif absent de la build : voile seul.
    return false;
  }
}

/** Barre bleue arrondie des pictogrammes (positions de Figma, repère du rond de 60). */
function Bar({ left, top, width, height }: { readonly left: number; readonly top: number; readonly width: number; readonly height: number }) {
  return <View style={[styles.bar, { left, top, width, height, borderRadius: Math.min(width, height) / 2 }]} />;
}

/** « + » de 10 (pictogrammes Calendrier, Mouvement, Séance, Programme), Figma : barres de 10 × 2,4. */
function SmallPlus({ left, top }: { readonly left: number; readonly top: number }) {
  return (
    <>
      <Bar left={left} top={top + 3.8} width={10} height={2.4} />
      <Bar left={left + 3.8} top={top} width={2.4} height={10} />
    </>
  );
}

/** Contenu bleu de chaque variante (Figma `13026:14915`, `13039:49710`, `13039:49721`, `13041:49880`, `13041:49893`, `13039:49727`). */
export function FloatingCreateGlyph({ variant }: { readonly variant: FloatingCreateVariant }) {
  switch (variant) {
    case "plus":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-plus">
          <Bar left={17.8} top={27.05} width={22} height={3.5} />
          <Bar left={27.05} top={17.8} width={3.5} height={22} />
        </View>
      );
    case "close":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-close">
          <View style={[styles.cross, { transform: [{ rotate: "45deg" }] }]} />
          <View style={[styles.cross, { transform: [{ rotate: "-45deg" }] }]} />
        </View>
      );
    case "calendar":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-calendar">
          <Image source={CALENDAR_ICON} style={styles.calendarIcon} contentFit="contain" accessible={false} />
          <Bar left={23.8} top={30.6} width={10} height={2.4} />
          <Bar left={27.6} top={26.8} width={2.4} height={10} />
        </View>
      );
    case "movement":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-movement">
          <Image source={MOVEMENT_ICON} style={styles.movementIcon} contentFit="contain" accessible={false} />
          <SmallPlus left={38} top={13} />
        </View>
      );
    case "session":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-session">
          {[0, 8, 16].map((top) => (
            <View key={top}>
              <View style={[styles.listMark, { left: 13.8, top: 19.8 + top }]} />
              <Bar left={21.8} top={20.6 + top} width={15} height={2.4} />
            </View>
          ))}
          <SmallPlus left={37.8} top={11.8} />
        </View>
      );
    case "program":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-program">
          <View style={styles.notebookFrame} />
          <View style={styles.notebookSpine} />
          <Bar left={24.8} top={23.8} width={7} height={2.2} />
          <Bar left={24.8} top={28.8} width={7} height={2.2} />
          <SmallPlus left={38.8} top={10.8} />
        </View>
      );
    default: {
      const unreachable: never = variant;
      return unreachable;
    }
  }
}

/** Rond de verre et son contenu, sans position (bouton flottant, et croix du menu Créer ouvert). */
export function FloatingCreateFace({ variant, testID }: { readonly variant: FloatingCreateVariant; readonly testID?: string }) {
  const [glass] = useState(liquidGlassAvailable);
  return (
    <View style={styles.shadow} pointerEvents="none" {...(testID !== undefined ? { testID } : {})}>
      <View style={styles.clip}>
        {glass ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            testID={testID === undefined ? undefined : `${testID}-glass`}
          />
        ) : null}
        <View style={styles.veil} testID={testID === undefined ? undefined : `${testID}-veil`} />
        {/* Figma place le contenu dans la boîte intérieure au liseré de 1,2. */}
        <View style={styles.content}>
          <FloatingCreateGlyph variant={variant} />
        </View>
      </View>
    </View>
  );
}

export type FloatingCreateAnchor = { readonly centerX: number; readonly centerY: number; readonly side: FloatingPosition["side"] };

/**
 * Couche du bouton flottant : posée en absolu sur l'écran (au-dessus du contenu, sous les feuilles modales natives).
 * Position par défaut : 16 du bord droit, `bottom` au-dessus du bas de la couche (12 au-dessus de la barre de navigation
 * ou du bouton « Continuer »). Déplacement (DSF § 5) : appui maintenu puis glissement ; au relâchement, rangement contre
 * le bord gauche ou droit le plus proche, à la hauteur du relâchement, entre `topLimit` (bas de la zone de contexte) et la
 * position par défaut ; position commune à tous les écrans, conservée sur l'appareil (`floatingCreatePosition`).
 * Toucher simple : l'action. Le geste ne naît que sur le bouton : le défilement des listes n'est pas touché.
 */
export function FloatingCreateButton({
  variant,
  accessibilityLabel,
  onPress,
  bottom,
  topLimit,
  disabled = false,
  hidden = false,
  onAnchorChange,
  focusRequest = 0,
  testID = "floating-create",
}: {
  readonly variant: FloatingCreateVariant;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  /** Bas du bouton à la position par défaut, compté depuis le bas de la couche. */
  readonly bottom: number;
  /** Haut de la zone permise (bas de la zone de contexte), compté depuis le haut de la couche. */
  readonly topLimit: number;
  readonly disabled?: boolean;
  /** Menu Créer ouvert : la croix du menu prend la place du bouton. */
  readonly hidden?: boolean;
  /** Centre du bouton dans la couche (menu Créer). */
  readonly onAnchorChange?: (anchor: FloatingCreateAnchor) => void;
  /** Chaque nouvelle valeur place le focus VoiceOver sur le bouton. */
  readonly focusRequest?: number;
  readonly testID?: string;
}) {
  const [position, setPosition] = useState<FloatingPosition>(restoreFloatingPosition);
  const [layer, setLayer] = useState<{ readonly width: number; readonly height: number } | null>(null);
  // Décalage du doigt pendant le déplacement (remis à zéro au relâchement, une fois la position rangée enregistrée).
  const [drag] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  useEffect(() => subscribeFloatingPosition(setPosition), []);
  const pressableRef = useRef<View>(null);
  const lastFocusRequest = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === lastFocusRequest.current) return;
    lastFocusRequest.current = focusRequest;
    if (pressableRef.current) AccessibilityInfo.sendAccessibilityEvent(pressableRef.current, "focus");
  }, [focusRequest]);

  // Avant la première mesure de la couche : position par défaut à la hauteur enregistrée (bornée dès la mesure).
  const maxLift = layer === null ? position.lift : Math.max(0, layer.height - bottom - FLOATING_BUTTON_SIZE - topLimit);
  const lift = clampLift(position.lift, maxLift);
  const buttonBottom = bottom + lift;
  const horizontal = position.side === "LEFT" ? { left: FLOATING_EDGE_INSET } : { right: FLOATING_EDGE_INSET };

  const anchorCenterX =
    layer === null ? null : position.side === "LEFT" ? FLOATING_EDGE_INSET + FLOATING_BUTTON_SIZE / 2 : layer.width - FLOATING_EDGE_INSET - FLOATING_BUTTON_SIZE / 2;
  const anchorCenterY = layer === null ? null : layer.height - buttonBottom - FLOATING_BUTTON_SIZE / 2;
  useEffect(() => {
    if (onAnchorChange === undefined || anchorCenterX === null || anchorCenterY === null) return;
    onAnchorChange({ centerX: anchorCenterX, centerY: anchorCenterY, side: position.side });
  }, [anchorCenterX, anchorCenterY, onAnchorChange, position.side]);

  // Géométrie courante lue par le geste au relâchement (le geste natif peut garder les fonctions d'un rendu antérieur).
  const geometryRef = useRef<{ readonly width: number; readonly centerX: number; readonly lift: number; readonly maxLift: number } | null>(null);
  useEffect(() => {
    geometryRef.current = layer === null || anchorCenterX === null ? null : { width: layer.width, centerX: anchorCenterX, lift, maxLift };
  }, [layer, anchorCenterX, lift, maxLift]);

  /** Relâchement : rangement contre le bord le plus proche, hauteur bornée, enregistrement (DSF § 5). */
  const settle = useCallback((translationX: number, translationY: number) => {
    const current = geometryRef.current;
    if (current === null) return;
    saveFloatingPosition(settleFloatingPosition(current.centerX + translationX, current.width, current.lift - translationY, current.maxLift));
  }, []);


  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayer((current) => (current !== null && current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <GestureHandlerRootView pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout} testID={`${testID}-layer`}>
      {!hidden ? (
        <DragDetector enabled={!disabled} testID={`${testID}-pan`} drag={drag} onRelease={settle}>
          <Animated.View
            style={[
              styles.button,
              { ...horizontal, bottom: buttonBottom, transform: drag.getTranslateTransform() },
              disabled ? styles.disabled : null,
            ]}
            testID={`${testID}-position`}
          >
            <Pressable
              ref={pressableRef}
              onPress={onPress}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ disabled }}
              style={StyleSheet.absoluteFill}
              testID={testID}
            >
              <FloatingCreateFace variant={variant} testID={`${testID}-face`} />
            </Pressable>
          </Animated.View>
        </DragDetector>
      ) : null}
    </GestureHandlerRootView>
  );
}

/**
 * Glissement du bouton (DSF § 5) : actif après l'appui maintenu — iOS annule alors le toucher du bouton, sans action ; suit le
 * doigt ; au relâchement, `onRelease` range le bouton.
 */
function DragDetector({
  enabled,
  testID,
  drag,
  onRelease,
  children,
}: {
  readonly enabled: boolean;
  readonly testID: string;
  readonly drag: Animated.ValueXY;
  readonly onRelease: (translationX: number, translationY: number) => void;
  readonly children: ReactElement;
}) {
  const pan = Gesture.Pan()
    .enabled(enabled)
    .withTestId(testID)
    .runOnJS(true)
    .activateAfterLongPress(FLOATING_LONG_PRESS_MS)
    .onUpdate((event) => drag.setValue({ x: event.translationX, y: event.translationY }))
    .onEnd((event) => onRelease(event.translationX, event.translationY))
    .onFinalize(() => drag.setValue({ x: 0, y: 0 }));
  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

/** Bas par défaut sur un écran à barre de navigation : 12 au-dessus de la barre (DSF § 2). */
export function floatingBottomAboveNavigation(navigationBarHeight: number): number {
  return navigationBarHeight + FLOATING_BOTTOM_GAP;
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
  },
  disabled: {
    opacity: UNSELECTED_OPACITY,
  },
  shadow: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    shadowColor: SHADOW.color,
    shadowOpacity: SHADOW.opacity,
    shadowOffset: { width: 0, height: SHADOW.offsetY },
    shadowRadius: SHADOW.radius / 2,
    elevation: 6,
    backgroundColor: "transparent",
  },
  clip: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    overflow: "hidden",
  },
  veil: {
    ...StyleSheet.absoluteFill,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: GLASS_VEIL,
    borderWidth: GLASS_BORDER_WIDTH,
    borderColor: GLASS_BORDER,
  },
  content: {
    position: "absolute",
    left: GLASS_BORDER_WIDTH,
    top: GLASS_BORDER_WIDTH,
    right: GLASS_BORDER_WIDTH,
    bottom: GLASS_BORDER_WIDTH,
  },
  bar: {
    position: "absolute",
    backgroundColor: FLOATING_CREATE_BLUE,
  },
  cross: {
    position: "absolute",
    left: 17.8,
    top: 27.05,
    width: 22,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: FLOATING_CREATE_BLUE,
  },
  calendarIcon: {
    position: "absolute",
    left: 14.8,
    top: 13.8,
    width: 28,
    height: 28,
  },
  // Pictogramme de 23,96 × 26 posé à (15,02 ; 18) ; l'image exportée déborde du trait (25,76 × 27,8).
  movementIcon: {
    position: "absolute",
    left: 14.12,
    top: 17.1,
    width: 25.7608,
    height: 27.8,
  },
  listMark: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: FLOATING_CREATE_BLUE,
  },
  notebookFrame: {
    position: "absolute",
    left: 14.8,
    top: 16.8,
    width: 20,
    height: 24,
    borderRadius: 3,
    borderWidth: 2.2,
    borderColor: FLOATING_CREATE_BLUE,
  },
  notebookSpine: {
    position: "absolute",
    left: 19.8,
    top: 16.8,
    width: 2.2,
    height: 24,
    backgroundColor: FLOATING_CREATE_BLUE,
  },
});
