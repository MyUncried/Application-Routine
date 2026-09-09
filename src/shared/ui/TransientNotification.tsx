import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Délai d'effacement automatique, en millisecondes.
 *
 * **Valeur NON SOURCÉE** : aucune source documentaire du projet ne publie de
 * durée pour les messages temporaires (`12 – Architecture technique.md` ne
 * donne que le fond `color.snackbar` et le rayon `16` ; RM-010 et D-136
 * décrivent le comportement, jamais la durée). `5000 ms` est retenu comme la
 * durée usuelle d'un message porteur d'une action de correction — assez long
 * pour lire et agir, assez court pour ne pas persister. Écart disclosé dans
 * le rapport de mission ; à confirmer sur appareil réel.
 */
export const TRANSIENT_NOTIFICATION_DURATION_MS = 5000;

export type TransientNotificationProps = {
  /** Message affiché. `null` = aucune notification (le composant ne rend rien). */
  message: string | null;
  /** Libellé de l'action de correction — `Annuler` dans les usages actuels (RM-010, D-136). */
  actionLabel: string;
  /** Action de correction : annule l'effet qui a motivé le message, puis referme. */
  onAction: () => void;
  /** Effacement — automatique après `TRANSIENT_NOTIFICATION_DURATION_MS`, ou immédiat après `onAction`. */
  onDismiss: () => void;
  testID?: string;
};

/**
 * **Notification noire temporaire canonique** (`12 – Architecture
 * technique.md`, `color.snackbar` `#292B33` et rayon `16` « message
 * temporaire » ; RM-010 « un message … propose temporairement `Annuler` »).
 *
 * Introduite par T02-S02 (continuation après recette visuelle) : l'ajustement
 * d'une `Durée totale` à un nombre entier de Séries (D-136) était jusqu'ici
 * rendu comme un texte PERMANENT inséré dans le corps défilant de l'écran
 * Activité — il repoussait le contenu, restait affiché indéfiniment et
 * n'offrait aucun moyen de revenir en arrière. Il devient une notification
 * temporaire superposée, porteuse de son action de correction.
 *
 * Le composant est PUREMENT présentationnel : il ne décide ni du contenu du
 * message, ni de ce qu'annule `onAction` — l'écran hôte reste seul
 * propriétaire de cet état, comme pour toutes les superpositions de ce projet
 * (`WheelPickerOverlay`, `ExerciseExitConfirmModal`).
 *
 * Il est rendu en position absolue au-dessus de son parent : il ne participe
 * donc à AUCUNE mise en page et ne déplace jamais le contenu qu'il recouvre
 * — exigence explicite de la recette (« ne pas conserver ce message en
 * permanence dans l'écran »).
 *
 * **T02-S02 (seconde recette visuelle, point 5)** — il RECOUVRE désormais
 * exactement son parent (quatre côtés à zéro) au lieu d'être ancré au bas de
 * l'écran. C'est le parent qui décide de la position : dans l'écran Activité,
 * il enveloppe l'action `Terminer`, la notification est donc centrée
 * verticalement sur ce bouton et le masque le temps de son affichage,
 * exactement comme demandé — sans qu'aucune coordonnée ne soit calculée, ni
 * recopiée depuis la géométrie du bouton.
 */
export function TransientNotification({
  message,
  actionLabel,
  onAction,
  onDismiss,
  testID = "transient-notification",
}: TransientNotificationProps) {
  useEffect(() => {
    if (message === null) {
      return;
    }
    const timeout = setTimeout(onDismiss, TRANSIENT_NOTIFICATION_DURATION_MS);
    // Nettoyage systématique : un nouveau message REMPLACE le précédent et
    // relance son propre délai, plutôt que d'hériter du décompte en cours.
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  if (message === null) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityLiveRegion="polite" testID={testID}>
      <Text style={styles.message} testID={`${testID}-message`}>
        {message}
      </Text>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={spacing[8]}
        style={styles.action}
        testID={`${testID}-action`}
      >
        <Text style={styles.actionLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Superposée, jamais dans le flux : `position: "absolute"` garantit qu'elle
  // ne repousse aucun contenu.
  //
  // T02-S02 (seconde recette, point 5) : les QUATRE côtés à zéro — elle
  // recouvre exactement son parent, qui est donc seul à décider de sa
  // position et de ses marges. Dans l'écran Activité, ce parent enveloppe
  // l'action `Terminer` : la notification est ainsi centrée verticalement
  // sur le bouton et le masque, par construction plutôt que par un calcul
  // d'ancrage. `alignItems: "center"` centre son contenu dans cette même
  // boîte. `minHeight` reste la cible tactile canonique de son action.
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    minHeight: minTouchTarget,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: 16,
    backgroundColor: colors.snackbar,
  },
  message: {
    ...type.body,
    flex: 1,
    color: colors.background,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...type.button,
    color: colors.background,
  },
});
