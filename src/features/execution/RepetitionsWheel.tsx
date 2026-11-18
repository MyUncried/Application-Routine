import * as Haptics from "expo-haptics";
import { memo, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { colors } from "@/shared/ui/tokens";

import { executionStrings as t } from "./executionStrings";

/**
 * PRE-11 — roulette horizontale des répétitions, composant partagé par la modale de l'Arrêt (« Répétitions partielles ») et par
 * la feuille de la Durée maximum atteinte (Clôture du For time).
 *
 * Recette du 14/11/2026 (Hermann : « Le cadre gris doit être au milieu, avec 0 à l’intérieur, les chiffres suivent à droite.
 * Défilement des chiffres : le cadre gris ne bouge pas, il reste au milieu, seuls les chiffres défilent. Un retour haptique à
 * chaque passage de chiffre sur le cadre gris, le défilement doit marquer un léger arrêt sur le cadre. (Fonctionnement d’une
 * roulette) ») ; recette du 15/11/2026 (g7 : « Reprendre le mode de fonctionnement de la roulette tel que déjà expliqué
 * (haptique, cadre gris au centre, valeur initiale, etc.) ce devrait être un composant réutilisable » ; k8 : « la roulette
 * horizontale ne marche pas comme celle de la Pause + Arrêt qui doit [être] identique » ; k5 : « Mettre la Valeur limite à 99 »).
 *
 * Aucune roulette native horizontale n'existe sur iOS (la roue SwiftUI est verticale) : rangée défilante cranée (`snapToInterval`).
 */

/** Valeur la plus haute proposée (recette du 15/11/2026, k5 : « Mettre la Valeur limite à 99 »). */
export const REPETITIONS_WHEEL_MAX = 99;
/** Largeur d'un chiffre de la roulette (et du cadre gris). */
const ITEM = 56;
/** Largeur d'un cran (et du cadre gris). */
export const REPETITIONS_WHEEL_ITEM = ITEM;
/** Recette du 18/11/2026 (Hermann : « réduire un peu l'espace entre les chiffres ») : pas d'un cran, plus court que le cadre. */
const STEP = 44;
/** Chiffres sur lesquels se fait l'agrandissement (« Le grossissement du chiffre n'est plus progressif et ne se fait que dans le cadre »). */
const GROWTH_STEPS = 3;
/** Recette du 18/11/2026 (Hermann : « les chiffres à droite du cadre gris de la même taille que les autres Textes, ils s'agrandisse
 * progressivement à l'approche du cadre gris ») : 18 hors du cadre (taille des textes de la feuille), 28 dans le cadre. */
// Recette du 18/11/2026 (« La police de la roulette doit être la même que les autres chiffres ») : Roboto Condensed Bold 28.
const FAR_SCALE = 18 / 28;

/**
 * Recette du 17/11/2026 (ft-arret-serie : « il manque le retour haptique à chaque passage de chiffre sur le cadre gris ») : pendant
 * l’Arrêt d’un For time, le chrono continue derrière la modale et redessinait la roulette (100 chiffres) à chaque rafraîchissement ;
 * mémorisée, elle ne se redessine plus que sur ses propres changements.
 */
export const RepetitionsWheel = memo(RepetitionsWheelView);

function RepetitionsWheelView({
  initialValue = 0,
  max = REPETITIONS_WHEEL_MAX,
  onChange,
  anchor = "center",
  testID,
}: {
  /**
   * Recette du 17/11/2026 (Hermann, modales d'arrêt du For time : « demi-roulette horizontale (elle s'arrête à gauche sur le cadre gris,
   * au milieu de l'écran, et à droite sur les chiffres croissants) ») : `start`, cadre gris au bord gauche de la roulette, chiffres à
   * sa droite seulement. `center` : cadre au milieu, comme avant.
   */
  readonly anchor?: "center" | "start";
  readonly initialValue?: number;
  readonly max?: number;
  readonly onChange: (value: number) => void;
  /** Préfixe des identifiants de test : `-frame`, `-values`, `-value-N`. */
  readonly testID: string;
}) {
  const start = Math.min(max, Math.max(0, Math.round(initialValue)));
  const [value, setValue] = useState(start);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // Recette du 18/11/2026 (Hermann : « Les chiffres grossissent lorsqu'ils sont arrêtés ou presque, cela doit être fluide pendant le
  // mouvement de la roulette ») : défilement relié à l'échelle des chiffres par le pilote natif d'animation (aucun passage par le
  // fil JavaScript) ; le JavaScript ne reçoit que le chiffre sous le cadre. [Échelle mise à jour depuis le gestionnaire JS — remplacé.]
  const [scrollX] = useState(() => new Animated.Value(start * STEP));
  const [onScroll] = useState(() =>
    Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => setValue(Math.min(max, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / STEP)))),
    }),
  );
  const shown = useRef(start);
  // Chiffre sous le cadre changé : valeur transmise et retour haptique.
  useEffect(() => {
    if (value === shown.current) return;
    shown.current = value;
    onChange(value);
    Haptics.selectionAsync().catch(() => undefined);
  }, [value, onChange]);
  const values = Array.from({ length: max + 1 }, (_, index) => index);
  const side = anchor === "start" ? 0 : Math.max(0, (width - ITEM) / 2);
  // Chaque chiffre (largeur STEP) se centre dans le cadre (largeur ITEM).
  const inset = (ITEM - STEP) / 2;
  const leading = side + inset;
  const trailing = Math.max(0, width - side - ITEM) + inset;
  return (
    <View style={styles.wheel} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {/* Cadre gris fixe, au centre : seuls les chiffres défilent dessous. */}
      <View pointerEvents="none" style={[styles.frame, { left: side }]} testID={`${testID}-frame`} />
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentOffset={{ x: start * STEP, y: 0 }}
        contentContainerStyle={[styles.values, { paddingLeft: leading, paddingRight: trailing }]}
        testID={`${testID}-values`}
      >
        {values.map((candidate) => {
          const selected = candidate === value;
          return (
            <Pressable
              key={candidate}
              onPress={() => {
                scrollRef.current?.scrollTo({ x: candidate * STEP, animated: true });
                setValue(candidate);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t.repetitions(candidate)}
              style={styles.value}
              testID={`${testID}-value-${candidate}`}
            >
              <Animated.Text
                style={[
                  styles.valueText,
                  selected ? styles.valueTextSelected : null,
                  {
                    transform: [
                      {
                        scale: scrollX.interpolate({
                          inputRange: [(candidate - GROWTH_STEPS) * STEP, candidate * STEP, (candidate + GROWTH_STEPS) * STEP],
                          outputRange: [FAR_SCALE, 1, FAR_SCALE],
                          extrapolate: "clamp",
                        }),
                      },
                    ],
                  },
                ]}
              >
                {candidate}
              </Animated.Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { height: ITEM },
  frame: { position: "absolute", top: 0, width: ITEM, height: ITEM, borderRadius: 16, backgroundColor: "#F0F0F7" },
  values: { gap: 0 },
  value: { width: STEP, height: ITEM, alignItems: "center", justifyContent: "center" },
  valueText: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 28, textAlign: "center", color: "rgba(154,160,173,0.9)", fontVariant: ["tabular-nums"] },
  valueTextSelected: { color: colors.textPrimary },
});
