import { Image } from "expo-image";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  FLOATING_BOTTOM_GAP,
  FLOATING_BUTTON_SIZE,
  FLOATING_DRAG_THRESHOLD,
  FLOATING_FOLLOW_SPRING,
  FLOATING_SETTLE_SPRING,
  clampTop,
  releaseTarget,
  restoreFloatingPosition,
  restoreFloatingTone,
  saveFloatingPosition,
  saveFloatingTone,
  subscribeFloatingTone,
  type FloatingTone,
  sideLeft,
  subscribeFloatingPosition,
  type FloatingBounds,
  type FloatingPosition,
} from "@/shared/ui/floatingCreatePosition";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";
import { colors } from "@/shared/ui/tokens";

/**
 * UI-FAB-01 — bouton flottant « Créer » (D-558, D-559 ; DSF Bouton flottant du 22/11/2026 ; Figma « DSF / Actions /
 * Bouton flottant — Créer » `13039:49732`, six variantes).
 *
 * Rendu (DSF § 2, valeurs du composant Figma) : rond de 60 ; verre blanc dépoli à 65 % sur le flou natif de l'arrière-plan ;
 * ombre large et douce (`#1A1A26`, 22 % depuis la recette du 24/11 [14 % de Figma], décalage 4, flou 24) ; liseré blanc de 1,2 (blanc 95 %, valeur exportée par Figma) ;
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
/**
 * Recette du 24/11/2026 (appui long, « mêmes opacités ») : fond bleu `#0508E5` au même voile de 65 %, symbole blanc.
 * Sans liseré. [Liseré, ombre et transparence d'ensemble inchangés — remplacé le même jour : sans liseré ; 70 % et ombre
 * plus sombre, valables pour les deux couleurs.]
 */
const GLASS_VEIL_BLUE = "rgba(5, 8, 229, 0.65)";
export const FLOATING_CREATE_WHITE = "#FFFFFF";
/** Couleur du symbole, portée par le rond (blanc sur fond bleu). */
const GlyphColor = createContext<string>(FLOATING_CREATE_BLUE);
/**
 * Effet lentille du 24/11/2026 (Hermann : « Oui » à la proposition d'alléger le voile pour laisser voir le verre natif ;
 * validé sur iPhone : « On garde l'effet lentille, c'est parfait »). Avec le verre natif d'iOS 26 : verre « clear » (réfraction visible, comme le bouton de lecture
 * de la fiche Mouvement), voile blanc léger à 22 % ; bouton bleu : verre teinté en bleu à 70 %, sans voile ni liseré.
 * Aucune opacité d'ensemble sur le bouton : iOS ne rend pas correctement un verre dont un parent est transparent ; la
 * transparence vient du verre lui-même. Sans verre natif : rendu précédent (voile à 65 %, bouton à 70 %).
 */
const LENS_VEIL = "rgba(255, 255, 255, 0.22)";
const LENS_TINT_BLUE = "rgba(5, 8, 229, 0.7)";
const GLASS_BORDER = "rgba(255, 255, 255, 0.95)";
const GLASS_BORDER_WIDTH = 1.2;
// Ombre assombrie le 24/11/2026 (« assombrir un peu l'ombre », deux couleurs) : 22 %. [14 % du composant Figma — remplacé.]
const SHADOW = { color: "#1A1A26", opacity: 0.22, offsetY: 4, radius: 24 } as const;
// [Appui maintenu de 400 ms avant le déplacement (`FLOATING_LONG_PRESS_MS`) — retiré le 24/11/2026 (D-594) : glissement dès 10 pt.]

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
  const color = useContext(GlyphColor);
  return <View style={[styles.bar, { left, top, width, height, borderRadius: Math.min(width, height) / 2, backgroundColor: color }]} />;
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
  const color = useContext(GlyphColor);
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
          <View style={[styles.cross, { backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
          <View style={[styles.cross, { backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
        </View>
      );
    case "calendar":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-calendar">
          <Image source={CALENDAR_ICON} style={[styles.calendarIcon, { tintColor: color }]} contentFit="contain" accessible={false} />
          <Bar left={23.8} top={30.6} width={10} height={2.4} />
          <Bar left={27.6} top={26.8} width={2.4} height={10} />
        </View>
      );
    case "movement":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-movement">
          <Image source={MOVEMENT_ICON} style={[styles.movementIcon, { tintColor: color }]} contentFit="contain" accessible={false} />
          <SmallPlus left={38} top={13} />
        </View>
      );
    case "session":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-session">
          {[0, 8, 16].map((top) => (
            <View key={top}>
              <View style={[styles.listMark, { left: 13.8, top: 19.8 + top, backgroundColor: color }]} />
              <Bar left={21.8} top={20.6 + top} width={15} height={2.4} />
            </View>
          ))}
          <SmallPlus left={37.8} top={11.8} />
        </View>
      );
    case "program":
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="floating-create-glyph-program">
          <View style={[styles.notebookFrame, { borderColor: color }]} />
          <View style={[styles.notebookSpine, { backgroundColor: color }]} />
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
export function FloatingCreateFace({
  variant,
  tone = "LIGHT",
  testID,
}: {
  readonly variant: FloatingCreateVariant;
  /** Fond blanc et symbole bleu (défaut), ou fond bleu et symbole blanc (appui long). */
  readonly tone?: FloatingTone;
  readonly testID?: string;
}) {
  const [glass] = useState(liquidGlassAvailable);
  return (
    <View style={styles.shadow} pointerEvents="none" {...(testID !== undefined ? { testID } : {})}>
      <View style={styles.clip}>
        {glass ? (
          <GlassView
            glassEffectStyle="clear"
            colorScheme="light"
            {...(tone === "BLUE" ? { tintColor: LENS_TINT_BLUE } : {})}
            pointerEvents="none"
            style={styles.glass}
            testID={testID === undefined ? undefined : `${testID}-glass`}
          />
        ) : null}
        <View
          style={[
            styles.veil,
            tone === "BLUE" ? styles.veilBlue : null,
            glass ? (tone === "BLUE" ? styles.lensVeilBlue : styles.lensVeil) : null,
          ]}
          testID={testID === undefined ? undefined : `${testID}-veil`}
        />
        {/* Figma place le contenu dans la boîte intérieure au liseré de 1,2. */}
        <View style={styles.content}>
          <GlyphColor.Provider value={tone === "BLUE" ? FLOATING_CREATE_WHITE : FLOATING_CREATE_BLUE}>
            <FloatingCreateGlyph variant={variant} />
          </GlyphColor.Provider>
        </View>
      </View>
    </View>
  );
}

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 } as const;

/**
 * Recette du 24/11/2026 (Hermann) : bouton à 70 % d'opacité, dans les deux couleurs (« Les 70% et l'ombre sont valables pour
 * les deux couleurs »). Inactif : `UNSELECTED_OPACITY`. [65 % (« à 65% d'opacité ») — remplacé le même jour.]
 */
export const FLOATING_CREATE_OPACITY = 0.7;

/**
 * Recette du 24/11/2026 (fab-partout, KO) : la couche passe au-dessus de toute bande élevée de l'écran (zone de contexte :
 * `zIndex` 1), sinon le bouton déplacé en haut passait dessous et ne répondait plus. Sous le menu Créer (`CREATE_MENU_LAYER` 10).
 */
export const FLOATING_CREATE_LAYER = 9;

/**
 * Recette du 24/11/2026 (fab-point-arret, KO ; Hermann : « Faire disparaître le bouton (fondu lent) ») : pendant le placement
 * d'un point d'arrêt, le bouton disparaît en fondu lent au lieu d'être atténué, puis réapparaît de même. Durée reprise de
 * l'apparition lente du menu Créer (600 ms).
 */
export const FLOATING_FADE_MS = 600;

export type FloatingCreateAnchor = { readonly centerX: number; readonly centerY: number; readonly side: FloatingPosition["side"] };

/**
 * Couche du bouton flottant : posée en absolu sur l'écran entier (au-dessus du contenu et, sur les écrans à onglets, de la
 * barre de navigation — `FloatingCreateHost` ; sous les feuilles modales natives).
 *
 * Déplacement (D-594, DSF § 5, audit AUDIT-FAB-PHYSIQUE ; constantes de `floatingCreatePosition`) :
 * - saisie dès 10 pt de glissement, sans appui long ; en deçà, un toucher déclenche l'action ;
 * - suivi du doigt par un ressort (retard croissant avec la vitesse), sur le fil d'interface ;
 * - relâchement : élan, rangement contre le bord gauche ou droit vers lequel l'élan porte, hauteur libre bornée à l'écran
 *   (bouton entier visible), ressort de pose avec léger dépassement ;
 * - rattrapage en vol : l'animation s'arrête au toucher et le geste repart de la position affichée, sans saut ;
 * - « Réduire les animations » : pose directe, réglage suivi en direct (`useReduceMotion`).
 *   [`ReduceMotion.System` — remplacé le 24/11/2026 (recette fab-reduire-animations, KO) : Reanimated ne lit le réglage
 *   qu'au lancement de l'application.]
 * Position commune à tous les écrans, conservée sur l'appareil ; hauteur par défaut : `bottom` au-dessus du bas de la couche.
 * [Appui maintenu de 400 ms, bouton collé au doigt, rangement immédiat au bord le plus proche de la position, hauteur bornée
 * entre la position par défaut et le bas de la zone de contexte — remplacés le 24/11/2026 (D-594).]
 */
export function FloatingCreateButton({
  variant,
  accessibilityLabel,
  onPress,
  bottom,
  disabled = false,
  hidden = false,
  faded = false,
  onAnchorChange,
  focusRequest = 0,
  testID = "floating-create",
}: {
  readonly variant: FloatingCreateVariant;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  /** Bas du bouton à la hauteur par défaut, compté depuis le bas de la couche. */
  readonly bottom: number;
  readonly disabled?: boolean;
  /** Menu Créer ouvert : la croix du menu prend la place du bouton. */
  readonly hidden?: boolean;
  /** Placement d'un point d'arrêt : bouton effacé en fondu lent, sans toucher ni VoiceOver ; réapparition en fondu. */
  readonly faded?: boolean;
  /** Centre du bouton dans la couche (menu Créer). */
  readonly onAnchorChange?: (anchor: FloatingCreateAnchor) => void;
  /** Chaque nouvelle valeur place le focus VoiceOver sur le bouton. */
  readonly focusRequest?: number;
  readonly testID?: string;
}) {
  // Zone sûre (barre d'état, barre d'accueil) ; sans fournisseur (tests), aucune marge.
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const [position, setPosition] = useState<FloatingPosition>(restoreFloatingPosition);
  // Couche mesurée ; avant la mesure, la fenêtre (la couche couvre l'écran entier).
  const window = useWindowDimensions();
  const [measured, setLayer] = useState<{ readonly width: number; readonly height: number } | null>(null);
  const layer = useMemo(
    () => measured ?? (window.width > 0 && window.height > 0 ? { width: window.width, height: window.height } : null),
    [measured, window.width, window.height],
  );
  useEffect(() => subscribeFloatingPosition(setPosition), []);
  const [tone, setTone] = useState<FloatingTone>(restoreFloatingTone);
  const [glass] = useState(liquidGlassAvailable);
  useEffect(() => subscribeFloatingTone(setTone), []);
  const pressableRef = useRef<View>(null);
  const lastFocusRequest = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === lastFocusRequest.current) return;
    lastFocusRequest.current = focusRequest;
    if (pressableRef.current) AccessibilityInfo.sendAccessibilityEvent(pressableRef.current, "focus");
  }, [focusRequest]);

  const bounds = useMemo<FloatingBounds | null>(
    () => (layer === null ? null : { width: layer.width, minTop: insets.top, maxTop: layer.height - insets.bottom - FLOATING_BUTTON_SIZE }),
    [layer, insets.top, insets.bottom],
  );
  // Place au repos : côté et hauteur enregistrés (par défaut : `bottom` au-dessus du bas), ramenés dans l'écran.
  const rest = useMemo(
    () =>
      bounds === null || layer === null
        ? null
        : {
            left: sideLeft(position.side, bounds.width),
            top: clampTop(position.top ?? layer.height - bottom - FLOATING_BUTTON_SIZE, bounds),
          },
    [bounds, layer, position, bottom],
  );

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  // Dernière destination donnée aux valeurs animées : le retour de l'enregistrement ne coupe pas une pose en cours.
  const destinationRef = useRef({ left: Number.NaN, top: Number.NaN });
  useEffect(() => {
    if (rest === null) return;
    const destination = destinationRef.current;
    if (Math.abs(destination.left - rest.left) < 0.5 && Math.abs(destination.top - rest.top) < 0.5) return;
    destinationRef.current = { left: rest.left, top: rest.top };
    x.set(rest.left);
    y.set(rest.top);
  }, [rest, x, y]);

  useEffect(() => {
    if (onAnchorChange === undefined || rest === null) return;
    onAnchorChange({ centerX: rest.left + FLOATING_BUTTON_SIZE / 2, centerY: rest.top + FLOATING_BUTTON_SIZE / 2, side: position.side });
  }, [onAnchorChange, position.side, rest]);

  const onRelease = useCallback(
    (side: FloatingPosition["side"], left: number, top: number) => {
      destinationRef.current = { left, top };
      saveFloatingPosition({ side, top });
    },
    [],
  );

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }] }));
  // Fondu sur un calque intérieur : l'opacité d'ensemble (sans verre natif) et l'atténuation se multiplient avec lui ; au
  // repos il vaut 1, le verre natif est donc rendu normalement.
  const reduceMotion = useReduceMotion();
  const fade = useSharedValue(faded ? 0 : 1);
  useEffect(() => {
    const target = faded ? 0 : 1;
    fade.set(reduceMotion ? target : withTiming(target, { duration: FLOATING_FADE_MS }));
  }, [faded, fade, reduceMotion]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const inactive = disabled || faded;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayer((current) => (current !== null && current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <GestureHandlerRootView pointerEvents="box-none" style={styles.layer} onLayout={onLayout} testID={`${testID}-layer`}>
      {!hidden && rest !== null && bounds !== null ? (
        <DragDetector enabled={!inactive} testID={`${testID}-pan`} x={x} y={y} bounds={bounds} rest={rest} onRelease={onRelease}>
          <Reanimated.View style={[styles.button, glass ? styles.lensButton : null, animatedStyle, disabled ? styles.disabled : null]} testID={`${testID}-position`}>
            <Reanimated.View
              style={[StyleSheet.absoluteFill, fadeStyle]}
              pointerEvents={faded ? "none" : "auto"}
              accessibilityElementsHidden={faded}
              importantForAccessibility={faded ? "no-hide-descendants" : "auto"}
              testID={`${testID}-fade`}
            >
              <Pressable
                ref={pressableRef}
              onPress={onPress}
              // Recette du 24/11/2026 : l'appui long (500 ms, sans glissement) inverse les couleurs, sans déclencher l'action.
              onLongPress={() => saveFloatingTone(tone === "BLUE" ? "LIGHT" : "BLUE")}
              disabled={inactive}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ disabled: inactive }}
              style={StyleSheet.absoluteFill}
              testID={testID}
            >
              <FloatingCreateFace variant={variant} tone={tone} testID={`${testID}-face`} />
              </Pressable>
            </Reanimated.View>
          </Reanimated.View>
        </DragDetector>
      ) : null}
    </GestureHandlerRootView>
  );
}

type Shared = ReturnType<typeof useSharedValue<number>>;

/**
 * Geste du bouton (D-594) : glissement dès 10 pt ; ressort de suivi ; relâchement vers la cible projetée par le ressort de
 * pose, en partant de la vitesse du doigt ; rattrapage en vol ; toucher sans glissement pendant une pose : la pose reprend.
 */
function DragDetector({
  enabled,
  testID,
  x,
  y,
  bounds,
  rest,
  onRelease,
  children,
}: {
  readonly enabled: boolean;
  readonly testID: string;
  readonly x: Shared;
  readonly y: Shared;
  readonly bounds: FloatingBounds;
  readonly rest: { readonly left: number; readonly top: number };
  readonly onRelease: (side: FloatingPosition["side"], left: number, top: number) => void;
  readonly children: ReactElement;
}) {
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragged = useSharedValue(false);
  // Limites et place de repos courantes, lues par le geste au moment où il en a besoin (jamais celles d'un rendu antérieur).
  const limits = useSharedValue<FloatingBounds>(bounds);
  const home = useSharedValue(rest);
  useEffect(() => {
    limits.set(bounds);
    home.set(rest);
  }, [bounds, rest, limits, home]);
  // « Réduire les animations » suivi en direct : pose directe, sans ressort.
  const reduceMotion = useReduceMotion() ? ReduceMotion.Always : ReduceMotion.Never;
  const follow = { ...FLOATING_FOLLOW_SPRING, reduceMotion };
  const settle = { ...FLOATING_SETTLE_SPRING, reduceMotion };
  const pan = Gesture.Pan()
    .enabled(enabled)
    .withTestId(testID)
    .minDistance(FLOATING_DRAG_THRESHOLD)
    .onBegin(() => {
      cancelAnimation(x);
      cancelAnimation(y);
      dragged.set(false);
    })
    .onStart(() => {
      dragged.set(true);
      startX.set(x.get());
      startY.set(y.get());
    })
    .onUpdate((event) => {
      x.set(withSpring(startX.get() + event.translationX, follow));
      y.set(withSpring(startY.get() + event.translationY, follow));
    })
    .onEnd((event) => {
      const target = releaseTarget(x.get(), y.get(), event.velocityX, event.velocityY, limits.get());
      x.set(withSpring(target.left, { ...settle, velocity: event.velocityX }));
      y.set(withSpring(target.top, { ...settle, velocity: event.velocityY }));
      runOnJS(onRelease)(target.side, target.left, target.top);
    })
    .onFinalize(() => {
      if (dragged.get()) return;
      x.set(withSpring(home.get().left, settle));
      y.set(withSpring(home.get().top, settle));
    });
  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

/** Bas par défaut sur un écran à barre de navigation : 12 au-dessus de la barre (DSF § 2). */
export function floatingBottomAboveNavigation(navigationBarHeight: number): number {
  return navigationBarHeight + FLOATING_BOTTOM_GAP;
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: FLOATING_CREATE_LAYER,
    elevation: FLOATING_CREATE_LAYER,
  },
  button: {
    position: "absolute",
    left: 0,
    top: 0,
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    opacity: FLOATING_CREATE_OPACITY,
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
  veilBlue: {
    backgroundColor: GLASS_VEIL_BLUE,
    borderWidth: 0,
  },
  glass: {
    ...StyleSheet.absoluteFill,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
  },
  lensVeil: {
    backgroundColor: LENS_VEIL,
  },
  lensVeilBlue: {
    backgroundColor: "transparent",
  },
  lensButton: {
    opacity: 1,
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
