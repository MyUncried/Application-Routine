import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, minTouchTarget, spacing } from "@/shared/ui/tokens";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { TransientNotification } from "@/shared/ui/TransientNotification";

/**
 * Recette du 23/11/2026 (d3 — Hermann : « il faut un message snackbar après confirmation pour informer du nombre de créneaux
 * supprimés ») : message déposé par une feuille qui vient de se fermer (modale du programme après un rattachement « Supprimer »,
 * feuille « Planifier »), lu par l'écran dans son propre `useFocusEffect` (`takePlanningNotice`). Même ancrage que le Journal.
 */
export function PlanningNoticeHost({
  message,
  onDismiss,
  testID,
}: {
  readonly message: string | null;
  readonly onDismiss: () => void;
  readonly testID: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom: navigationBarTotalHeight() + insets.bottom + spacing[16] }]}>
      <TransientNotification message={message} onDismiss={onDismiss} testID={testID} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute", left: layout.screenGutter, right: layout.screenGutter, height: minTouchTarget },
});
