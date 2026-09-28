import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Hauteur du séparateur sous l'en-tête (`ScreenShell.tsx`, `HeaderSeparator`,
 * `styles.separator.height`) — reprise ici en constante, jamais dupliquée
 * en dur, pour composer `menuTop` (voir plus bas).
 */
const HEADER_SEPARATOR_HEIGHT = 1;

export type CatalogueCreateOptionsProps = {
  visible: boolean;
  onSelectNewActivity: () => void;
  onSelectNewSession: () => void;
  onCancel: () => void;
};

/**
 * Arbre `Créer` du Catalogue (V2-CAT-01, plan §4.1/UI-CAT-R-001) — ancré à
 * `Créer`, affiche exactement `Une nouvelle activité`, `Une séance`, `Un
 * circuit`, `Annuler`, dans cet ordre. `Un circuit` est désactivé. `Annuler`
 * ferme sans écriture et restitue exactement le contexte courant — aucun
 * état n'est modifié par cette fermeture, ni par un appui sur le voile.
 *
 * **`Modal` natif transparent (V2-CAT-01, plan §5)** : seule primitive de
 * couche capable de couvrir le SHELL de cet écran ET la barre d'onglets
 * SŒUR du contenu — rendue par le navigateur `Tabs` (`app/(tabs)/_layout
 * .tsx`), donc hors de l'arbre React de cet écran : un simple `View` placé
 * dans `CatalogueScreen` ne peut structurellement pas la recouvrir. La
 * rangée `Créer / Filtrer / Trier` qui l'ouvre reste néanmoins visible SOUS
 * le voile — Modal se superpose au-dessus de tout, mais ne démonte rien
 * derrière lui.
 *
 * `animationType="fade"` : apparition/disparition PROGRESSIVE et RAPIDE,
 * confiée à la présentation NATIVE du système (UIKit/Android), jamais à un
 * `Animated.Value` piloté par pont JS sur une vue fraîchement montée — cause
 * exacte d'un défaut antérieur (vue créée simultanément au démarrage d'une
 * animation à pilotage natif, échouant à produire tout changement visuel
 * sur appareil réel malgré des tests JS passants). `onRequestClose` couvre
 * le bouton retour matériel Android au même titre qu'`Annuler`.
 */
export function CatalogueCreateOptions({
  visible,
  onSelectNewActivity,
  onSelectNewSession,
  onCancel,
}: CatalogueCreateOptionsProps) {
  const insets = useSafeAreaInsets();
  // VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 3) :
  // `menuTop` composait auparavant SEULEMENT `dimensions.contextBand.height`
  // — en omettant la hauteur réelle de l'en-tête fixe (`insets.top +
  // dimensions.header.contentHeight`) et de son séparateur, tous deux
  // frères PRÉCÉDENT ce composant dans `ScreenShell` (`CatalogueScreen.tsx`).
  // L'arbre se positionnait donc ~100 pt trop haut, chevauchant l'en-tête
  // au lieu d'apparaître sous la rangée `Créer` — d'où le bouton perçu comme
  // non fonctionnel (l'arbre s'ouvrait bien, mais invisible/confondu avec
  // l'en-tête). `menuTop` inclut désormais la hauteur RÉELLE cumulée des
  // trois éléments fixes qui précèdent toujours ce composant à l'écran.
  const menuTop =
    insets.top +
    dimensions.header.contentHeight +
    HEADER_SEPARATOR_HEIGHT +
    dimensions.contextBand.height +
    spacing[8];

  const t = strings.screens.sessions.createTree;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="catalogue-create-tree-modal"
    >
      {/*
       * Scrim COMPLET, INERTE (V2-CAT-01, UI-CAT-R-001) : couvre tout
       * l'écran, arrière-plan/navigation/retour/listes non interactifs tant
       * que l'arbre est visible — mais un appui SUR le voile lui-même ne
       * ferme jamais l'arbre ni n'appelle `onCancel`. Seul `Annuler` (ou le
       * bouton retour matériel Android, `onRequestClose`) ferme
       * explicitement ce parcours ; `View` (jamais `Pressable`) ne porte
       * donc aucun gestionnaire d'appui — un simple bloc opaque, qui
       * continue de capter le toucher (empêchant qu'il n'atteigne quoi que
       * ce soit derrière lui) sans jamais le traduire en fermeture.
       */}
      <View
        style={styles.backdrop}
        accessible={false}
        testID="catalogue-create-tree-scrim"
      >
        <View
          accessible={false}
          testID="catalogue-create-tree-backdrop"
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.menu, { top: menuTop }]} testID="catalogue-create-tree">
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
    </Modal>
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
    // `top` est calculé dynamiquement (`menuTop`, ci-dessus) et transmis en
    // style inline — dépend d'`insets.top`, indisponible dans cette feuille
    // de styles statique.
    position: "absolute",
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
