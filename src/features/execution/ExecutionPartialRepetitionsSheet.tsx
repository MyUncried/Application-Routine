import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors } from "@/shared/ui/tokens";

import { executionStrings as t } from "./executionStrings";
import { RepetitionsWheel } from "./RepetitionsWheel";

/**
 * PRE-11, corrections 3 et 4 de Hermann du 14/11/2026 — modale « Répétitions partielles » du For time, ouverte par l'arrêt
 * (bouton rouge, en Pause), Figma « P-Modale — Répétitions partielles » (`8928:15098`) : croix, « Vos résultats », nom de
 * l'exercice et rangée de valeurs (0 par défaut, au plus la cible − 1), « Terminer l'exercice ».
 *
 * - Pendant une série en Répétitions : les répétitions faites de cette série, enregistrées avec la synthèse partielle.
 * - Entre deux séries (pause) ou en Durée : aucune série en cours, rien à saisir ; la modale confirme l'arrêt.
 * - La croix revient à la Pause, sans rien changer.
 *
 * Recette du 14/11/2026 (Hermann : « Écran initial : Le cadre gris doit être au milieu, avec 0 à l’intérieur, les chiffres suivent
 * à droite. Défilement des chiffres : le cadre gris ne bouge pas, il reste au milieu, seuls les chiffres défilent. Un retour
 * haptique à chaque passage de chiffre sur le cadre gris, le défilement doit marquer un léger arrêt sur le cadre. (Fonctionnement
 * d’une roulette) ») : rangée en roulette horizontale — cadre gris fixe au centre, défilement cranté d'un chiffre (`snapToInterval`),
 * retour haptique de sélection à chaque chiffre qui passe sous le cadre. Aucune roulette native horizontale n'existe sur iOS (la
 * roue SwiftUI est verticale) : la rangée existante est conservée et rendue cranée. [Cadre gris sur la valeur touchée — remplacé.]
 *
 * Écarts assumés au Figma : une seule rangée (l'exercice en cours ; le Figma en montre trois) — interprétation à confirmer ;
 * feuille dessinée dans l'écran, sans `Modal` natif (l'écran d'Exécution n'en garde qu'un, recette du 09/11/2026).
 */

export function ExecutionPartialRepetitionsSheet({
  exerciseName,
  inSeries,
  bottomInset,
  onConfirm,
  onCancel,
}: {
  readonly exerciseName: string | null;
  /** [Cible − 1 comme valeur la plus haute — remplacé le 15/11/2026, recette k5 : « Mettre la Valeur limite à 99 ».] */
  readonly targetRepetitions?: number | null;
  /** Série en Répétitions en cours : la rangée de valeurs est proposée. */
  readonly inSeries: boolean;
  readonly bottomInset: number;
  readonly onConfirm: (partialRepetitions: number | null) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState(0);
  return (
    <View style={styles.layer} testID="execution-partial">
      <View style={styles.veil} />
      <View style={[styles.sheet, { marginBottom: Math.max(8, bottomInset) }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={t.partialClose} hitSlop={8} style={styles.close} testID="execution-partial-close">
            <KodjoIcon name="control-close" size={16} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.closureTitle}</Text>
        </View>
        {inSeries ? (
          <>
            <Text style={styles.name} numberOfLines={1} testID="execution-partial-name">
              {exerciseName ?? ""}
            </Text>
            <RepetitionsWheel onChange={setValue} testID="execution-partial" />
          </>
        ) : (
          <Text style={styles.none} testID="execution-partial-none">
            {t.partialNoSeries}
          </Text>
        )}
        <Pressable
          onPress={() => onConfirm(inSeries ? value : null)}
          accessibilityRole="button"
          accessibilityLabel={t.partialConfirm}
          style={styles.confirm}
          testID="execution-partial-confirm"
        >
          <Text style={styles.confirmLabel}>{t.partialConfirm}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 10 },
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  sheet: { marginHorizontal: 8, backgroundColor: "#FFFFFF", borderRadius: 40, paddingHorizontal: 8, paddingBottom: 16, overflow: "hidden" },
  header: { height: 56, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: -4 },
  close: { position: "absolute", left: 12, top: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, color: colors.textPrimary },
  name: { marginTop: 20, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 17, color: colors.textPrimary },
  none: { marginTop: 20, fontFamily: "Inter_400Regular", fontSize: 15, color: "#7A7A80" },
  confirm: { marginTop: 24, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  confirmLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: "#FFFFFF" },
});
