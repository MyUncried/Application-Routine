import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { colors, dimensions, layout, spacing } from "@/shared/ui/tokens";

import { programStrings } from "./programStrings";

/**
 * Consentement au suivi de la douleur (D-551 ; Figma « PROG — 13b » `12848:47353`). Explique ce qui est demandé, précise que
 * les relevés restent sur le téléphone, ne sont jamais interprétés et peuvent être effacés ; « Annuler » (gris, à gauche) et
 * « Autoriser » (bleu, à droite), côte à côte.
 *
 * Contre-recette du 23/11/2026 (a, Hermann : « la modale du programme ne doit pas se fermer à l'ouverture de la fenêtre de
 * confirmation puis s'ouvrir de nouveau après, elle doit rester ouverte. Cette fenêtre de confirmation doit s'ouvrir au centre
 * de l'écran, avec un voile gris apposé sur le fond de l'écran (apparition et disparition en fondu lentement) ») :
 * `PainConsentDialog`, rendue par la modale du programme dans le voile partagé (`WheelPickerOverlay` : `Modal` natif
 * transparent, fondu d'iOS, voile `overlayScrim`, contenu centré), carte aux dimensions des fenêtres de confirmation
 * (`dimensions.decisionDialog`). Contenu et couleurs de « PROG — 13b » inchangés. [Feuille native posée sur la modale du
 * programme (`app/pain-consent.tsx`) — remplacée ; `PainConsentSheet` reste exporté pour cette route, qui n'est plus ouverte.]
 */
const t = programStrings.consent;

function PainConsentContent({ onCancel, onAllow }: { readonly onCancel: () => void; readonly onAllow: () => void }) {
  return (
    <>
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
    </>
  );
}

/** Ancienne présentation en feuille native (route `pain-consent`, plus ouverte depuis la contre-recette du 23/11/2026). */
export function PainConsentSheet({ onCancel, onAllow }: { readonly onCancel: () => void; readonly onAllow: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[24]) }]} testID="pain-consent">
      <PainConsentContent onCancel={onCancel} onAllow={onAllow} />
    </View>
  );
}

/** Fenêtre de confirmation centrée sur le voile gris, posée sur la modale du programme (contre-recette du 23/11/2026, a). */
export function PainConsentDialog({ visible, onCancel, onAllow }: { readonly visible: boolean; readonly onCancel: () => void; readonly onAllow: () => void }) {
  return (
    <WheelPickerOverlay visible={visible}>
      <View style={styles.card} accessibilityViewIsModal testID="pain-consent">
        <PainConsentContent onCancel={onCancel} onAllow={onAllow} />
      </View>
    </WheelPickerOverlay>
  );
}

const styles = StyleSheet.create({
  // Figma « PROG — 13b » : titre Inter Semi Bold 22, texte 16 #141414, mention 13 #595E66, deux boutons de 48 côte à côte.
  sheet: { paddingHorizontal: layout.screenGutter + spacing[8], paddingTop: spacing[32], backgroundColor: colors.background, gap: spacing[12] },
  // Carte des fenêtres de confirmation (`DecisionDialog`) : 354 de large, rayon 18, marges 24, même ombre.
  card: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: spacing[12],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
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
