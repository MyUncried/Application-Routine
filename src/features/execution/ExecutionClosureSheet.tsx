import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FormatView } from "@/domain/execution/projection";
import { colors } from "@/shared/ui/tokens";

import { executionStrings as t, formatClock } from "./executionStrings";
import { RepetitionsWheel } from "./RepetitionsWheel";

/**
 * PRE-11 (T1) — Clôture d'un élément formaté (D3, §12.5) : la Durée maximum du For time a interrompu une série en Répétitions ;
 * les répétitions faites de cette série sont demandées.
 *
 * Recette du 15/11/2026 (Hermann, k8 : « La modale n’est pas conforme, et la roulette horizontale ne marche pas comme celle de la
 * Pause + Arrêt qui doit [être] identique » ; g7 : roulette en composant réutilisable) : même feuille que la modale de l'Arrêt
 * (`ExecutionPartialRepetitionsSheet`, Figma « P-Modale — Répétitions partielles » `8928:15098`) — en-tête « Vos résultats »,
 * nom de l'exercice, roulette partagée (`RepetitionsWheel`, 0 au départ, jusqu'à 99), bouton du bas. [Feuille « Résultat de
 * série » à poignée et rangée sans cadre fixe (Figma `8937:35362`) — remplacé.]
 *
 * Écarts assumés : pas de croix (la Clôture est bloquante, D3 : seule la validation fait avancer) ; rappel « Limite atteinte ·
 * durée » sous le nom (ligne g5) ; feuille dessinée dans l'écran, sans `Modal` natif (recette du 09/11/2026).
 */
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
  const [value, setValue] = useState(0);
  return (
    <View style={styles.layer} testID="execution-closure">
      <View style={styles.veil} />
      <View style={[styles.sheet, { marginBottom: Math.max(8, bottomInset) }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.closureTitle}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {interrupted?.name ?? format.name}
        </Text>
        <Text style={styles.recall} numberOfLines={1} testID="execution-closure-time">
          {format.capReached ? t.closureCapReached : t.forTime} · {formatClock(format.elapsedMs)}
        </Text>
        {interrupted !== null ? <RepetitionsWheel onChange={setValue} testID="execution-closure" /> : null}
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

// Mêmes mesures que `ExecutionPartialRepetitionsSheet` (recette k8 : feuilles identiques).
const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 10 },
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  sheet: { marginHorizontal: 8, backgroundColor: "#FFFFFF", borderRadius: 40, paddingHorizontal: 8, paddingBottom: 16, overflow: "hidden" },
  header: { height: 56, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -4 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary },
  name: { marginTop: 20, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 17, color: colors.textPrimary },
  recall: { marginTop: 4, fontFamily: "Inter_400Regular", fontSize: 13, color: "#7A7A80" },
  validate: { marginTop: 24, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  validateLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: "#FFFFFF" },
});
