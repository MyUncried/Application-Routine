import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

export function RepetitionsWheel({
  initialValue = 0,
  max = REPETITIONS_WHEEL_MAX,
  onChange,
  testID,
}: {
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
  const shown = useRef(start);
  const values = Array.from({ length: max + 1 }, (_, index) => index);
  const side = Math.max(0, (width - ITEM) / 2);
  const select = (index: number) => {
    const next = Math.min(max, Math.max(0, index));
    if (next === shown.current) return;
    shown.current = next;
    setValue(next);
    onChange(next);
    Haptics.selectionAsync().catch(() => undefined);
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => select(Math.round(event.nativeEvent.contentOffset.x / ITEM));
  return (
    <View style={styles.wheel} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {/* Cadre gris fixe, au centre : seuls les chiffres défilent dessous. */}
      <View pointerEvents="none" style={[styles.frame, { left: side }]} testID={`${testID}-frame`} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentOffset={{ x: start * ITEM, y: 0 }}
        contentContainerStyle={[styles.values, { paddingHorizontal: side }]}
        testID={`${testID}-values`}
      >
        {values.map((candidate) => {
          const selected = candidate === value;
          return (
            <Pressable
              key={candidate}
              onPress={() => {
                scrollRef.current?.scrollTo({ x: candidate * ITEM, animated: true });
                select(candidate);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t.repetitions(candidate)}
              style={styles.value}
              testID={`${testID}-value-${candidate}`}
            >
              <Text style={selected ? styles.valueTextSelected : styles.valueText}>{candidate}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { marginTop: 8, height: ITEM },
  frame: { position: "absolute", top: 0, width: ITEM, height: ITEM, borderRadius: 16, backgroundColor: "#F0F0F7" },
  values: { gap: 0 },
  value: { width: ITEM, height: ITEM, alignItems: "center", justifyContent: "center" },
  valueText: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 26, color: "rgba(154,160,173,0.9)" },
  valueTextSelected: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 30, color: colors.textPrimary },
});
