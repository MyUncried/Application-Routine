import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { FormatView } from "@/domain/execution/projection";
import { colors } from "@/shared/ui/tokens";

import { executionStrings as t, formatClock } from "./executionStrings";

/**
 * PRE-11 (T1) — Clôture d'un élément formaté (D3, §12.5), sur le modèle de la modale « Résultat de série » du Figma
 * (`8937:35362`) : décision de Hermann du 13/11/2026, « Réutiliser « Résultat de série » ». Feuille du bas, voile,
 * poignée, en-tête « Vos résultats », nom de l'élément et rappel du résultat calculé, rangée de valeurs, Valider.
 *
 * For time : le temps réalisé est affiché ; si la borne a fermé un travail en Répétitions, la rangée demande les
 * répétitions faites de ce travail (0 par défaut, au plus la cible − 1).
 *
 * Écarts assumés au Figma : pas de ✕ (la Clôture est bloquante, D3 : seule la validation fait avancer) ; feuille
 * dessinée dans l'écran, sans `Modal` natif (l'écran d'Exécution n'en garde qu'un, recette du 09/11/2026).
 */

/** Valeurs proposées sans cible chiffrée. */
const DEFAULT_MAX = 50;

export function ExecutionClosureSheet({
  format,
  bottomInset,
  onSubmit,
}: {
  readonly format: FormatView;
  readonly bottomInset: number;
  readonly onSubmit: (payload: { readonly partialRepetitions?: number }) => void;
}) {
  const interrupted = format.interrupted !== null && format.interrupted.mode !== "DURATION" ? format.interrupted : null;
  const max = interrupted?.target?.kind === "NUMBER" ? Math.max(0, interrupted.target.value - 1) : DEFAULT_MAX;
  const [value, setValue] = useState(0);
  const values = Array.from({ length: max + 1 }, (_, index) => index);
  return (
    <View style={styles.layer} testID="execution-closure">
      <View style={styles.veil} />
      <View style={[styles.sheet, { marginBottom: Math.max(8, bottomInset) }]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.closureTitle}</Text>
        </View>
        <View style={styles.summary}>
          <Text style={styles.name} numberOfLines={1}>
            {format.name}
          </Text>
          <Text style={styles.recall} numberOfLines={1} testID="execution-closure-time">
            {format.capReached ? t.closureCapReached : t.forTime} · {formatClock(format.elapsedMs)}
          </Text>
        </View>
        {interrupted !== null ? (
          <>
            <Text style={styles.question} numberOfLines={2}>
              {t.closurePartial(interrupted.name)}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.values} testID="execution-closure-values">
              {values.map((candidate) => {
                const selected = candidate === value;
                return (
                  <Pressable
                    key={candidate}
                    onPress={() => setValue(candidate)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t.repetitions(candidate)}
                    style={[styles.value, selected ? styles.valueSelected : null]}
                    testID={`execution-closure-value-${candidate}`}
                  >
                    <Text style={selected ? styles.valueTextSelected : styles.valueText}>{candidate}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
        <Pressable
          onPress={() => onSubmit(interrupted !== null ? { partialRepetitions: value } : {})}
          accessibilityRole="button"
          accessibilityLabel={t.validate}
          style={styles.validate}
          testID="execution-closure-validate"
        >
          <Text style={styles.validateLabel}>{t.validate}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 10 },
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  sheet: { marginHorizontal: 8, backgroundColor: "#FFFFFF", borderRadius: 40, paddingHorizontal: 8, paddingBottom: 16, overflow: "hidden" },
  handle: { alignSelf: "center", width: 50, height: 4, borderRadius: 2, backgroundColor: "#BEC2CC", marginTop: 8 },
  header: { height: 48, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -4 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary },
  summary: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 24, gap: 8 },
  name: { flexShrink: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 17, color: colors.textPrimary },
  recall: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#7A7A80" },
  question: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#7A7A80", marginTop: 12 },
  values: { gap: 0, marginTop: 8 },
  value: { width: 64, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  valueSelected: { backgroundColor: "#F0F0F7" },
  valueText: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 26, color: "rgba(154,160,173,0.9)" },
  valueTextSelected: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 30, color: colors.textPrimary },
  validate: { marginTop: 24, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  validateLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: "#FFFFFF" },
});
