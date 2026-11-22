import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout, spacing } from "@/shared/ui/tokens";

import { programStrings } from "./programStrings";

/**
 * Feuille de consentement au suivi de la douleur (D-551 ; Figma « PROG — 13b » `12848:47353`) — feuille native iOS ajustée à
 * son contenu, ouverte par-dessus la modale du programme. Explique ce qui est demandé, précise que les relevés restent sur
 * le téléphone, ne sont jamais interprétés et peuvent être effacés ; « Annuler » (gris, à gauche) et « Autoriser » (bleu, à
 * droite), côte à côte.
 */
const t = programStrings.consent;

export function PainConsentSheet({ onCancel, onAllow }: { readonly onCancel: () => void; readonly onAllow: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[24]) }]} testID="pain-consent">
      <Text style={styles.title} accessibilityRole="header">
        {t.title}
      </Text>
      <Text style={styles.body}>{t.body}</Text>
      <Text style={styles.note}>{t.note}</Text>
      <View style={styles.actions}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={t.cancel} style={[styles.action, styles.cancel]} testID="pain-consent-cancel">
          <Text style={[styles.actionLabel, styles.cancelLabel]}>{t.cancel}</Text>
        </Pressable>
        <Pressable onPress={onAllow} accessibilityRole="button" accessibilityLabel={t.allow} style={[styles.action, styles.allow]} testID="pain-consent-allow">
          <Text style={[styles.actionLabel, styles.allowLabel]}>{t.allow}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma « PROG — 13b » : titre Inter Semi Bold 22, texte 16 #141414, mention 13 #595E66, deux boutons de 48 côte à côte.
  sheet: { paddingHorizontal: layout.screenGutter + spacing[8], paddingTop: spacing[32], backgroundColor: colors.background, gap: spacing[12] },
  title: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 22, color: colors.textPrimary },
  body: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 16, lineHeight: 21, color: colors.textPrimary },
  note: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing[12], marginTop: spacing[16] },
  action: { flex: 1, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cancel: { backgroundColor: "#F3F4F6" },
  allow: { backgroundColor: colors.primary },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16 },
  cancelLabel: { color: "#111111" },
  allowLabel: { color: colors.background },
});
