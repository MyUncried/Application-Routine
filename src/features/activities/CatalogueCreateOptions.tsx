import { Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type CatalogueCreateOptionsProps = {
  visible: boolean;
  onSelectNewActivity: () => void;
  onSelectNewSession: () => void;
  onCancel: () => void;
};

/**
 * Arbre `Créer` du Catalogue (V2-CAT-01, plan §4.1) — ancré à `Créer`,
 * affiche exactement `Une nouvelle activité`, `Une séance`, `Un circuit`,
 * `Annuler`, dans cet ordre. `Un circuit` est désactivé. `Annuler` ferme sans
 * écriture et restitue exactement le contexte courant — aucun état n'est
 * modifié par cette fermeture, ni par un appui sur le voile.
 *
 * Rendu comme un frère absolument positionné de la rangée `Créer / Filtrer /
 * Trier` (jamais un `Modal` plein écran) : la rangée qui l'a ouvert reste
 * visible sous le voile, conformément au plan (« conserve cette rangée sous
 * le scrim »).
 */
export function CatalogueCreateOptions({
  visible,
  onSelectNewActivity,
  onSelectNewSession,
  onCancel,
}: CatalogueCreateOptionsProps) {
  if (!visible) {
    return null;
  }

  const t = strings.screens.sessions.createTree;

  return (
    <>
      <Pressable
        onPress={onCancel}
        accessible={false}
        testID="catalogue-create-tree-backdrop"
        style={styles.backdrop}
      />
      <View style={styles.menu} testID="catalogue-create-tree">
        <CreateTreeOption
          label={t.newActivity}
          onPress={onSelectNewActivity}
          testID="catalogue-create-tree-new-activity"
        />
        <CreateTreeOption
          label={t.newSession}
          onPress={onSelectNewSession}
          testID="catalogue-create-tree-new-session"
        />
        <CreateTreeOption
          label={t.newCircuit}
          disabled
          accessibilityLabel={t.circuitUnavailableAccessibilityLabel}
          testID="catalogue-create-tree-new-circuit"
        />
        <CreateTreeOption label={t.cancel} onPress={onCancel} testID="catalogue-create-tree-cancel" />
      </View>
    </>
  );
}

function CreateTreeOption({
  label,
  onPress,
  disabled = false,
  accessibilityLabel = label,
  testID,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.option, disabled ? styles.optionDisabled : null]}
      testID={testID}
    >
      <Text style={[styles.optionLabel, disabled ? styles.optionLabelDisabled : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
  },
  menu: {
    position: "absolute",
    top: dimensions.contextBand.height + spacing[8],
    left: spacing[24],
    right: spacing[24],
    backgroundColor: colors.background,
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  optionLabelDisabled: {
    color: colors.disabled,
  },
});
