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

/**
 * Nombre de lignes PLEINES autorisées au message (T02-S02, troisième recette
 * visuelle, point 2). Deux lignes couvrent les messages réels de
 * l'application — le plus long, `adjustedTotalDurationMessage`, en occupe
 * exactement deux à la largeur utile d'un iPhone.
 */
export const TRANSIENT_NOTIFICATION_MESSAGE_LINES = 2;

/**
 * Hauteur MINIMALE de la surface noire — de quoi afficher les deux lignes
 * pleines sans troncature, marges internes comprises. DÉRIVÉE des tokens qui
 * la composent (`type.body` pour le texte, `spacing/12` pour les marges
 * verticales) plutôt que codée en dur : changer l'un recalcule l'autre.
 *
 * Elle remplace l'ancien plancher `minTouchTarget` (`48`), qui suffisait à
 * une ligne mais tronquait la seconde.
 */
export const TRANSIENT_NOTIFICATION_MIN_HEIGHT =
  type.body.lineHeight * TRANSIENT_NOTIFICATION_MESSAGE_LINES + spacing[12] * 2;

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
 *
 * **T02-S02 (troisième recette visuelle, point 2)** — le CALQUE DE POSITION et
 * la SURFACE NOIRE sont désormais deux vues distinctes. Tant qu'elles n'en
 * formaient qu'une, la surface était contrainte à la hauteur de son parent —
 * le bouton — et le message y était tronqué au-delà d'une ligne. Le calque
 * conserve seul le positionnement ; la surface, libre en hauteur, réserve de
 * quoi afficher DEUX lignes pleines et reste centrée sur le bouton.
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
    <View style={styles.layer} accessibilityLiveRegion="polite" testID={testID}>
      <View style={styles.card} testID={`${testID}-card`}>
        <Text
          style={styles.message}
          numberOfLines={TRANSIENT_NOTIFICATION_MESSAGE_LINES}
          testID={`${testID}-message`}
        >
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
          <Text style={styles.actionLabel} numberOfLines={1}>
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // **Calque de POSITION** — superposé, jamais dans le flux :
  // `position: "absolute"` garantit qu'il ne repousse aucun contenu, et les
  // QUATRE côtés à zéro le font recouvrir exactement son parent. Dans l'écran
  // Activité, ce parent enveloppe l'action `Terminer` : la notification est
  // donc centrée verticalement sur le bouton et le masque, par construction
  // plutôt que par un calcul d'ancrage.
  //
  // T02-S02 (troisième recette, point 2) : le calque et la SURFACE NOIRE sont
  // désormais deux vues distinctes. Le calque, de la hauteur du bouton,
  // CENTRE (`justifyContent`) une surface qui peut être PLUS HAUTE que lui —
  // deux lignes de message la font légitimement dépasser. `overflow: visible`
  // laisse ce débordement s'afficher, symétriquement de part et d'autre du
  // bouton : la notification reste exactement centrée sur lui, sans être
  // tronquée par la hauteur de son ancre.
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: "center",
    overflow: "visible",
  },
  // Surface noire canonique des messages temporaires (`color.snackbar`,
  // rayon `16`). Sa hauteur est LIBRE — bornée par le bas par de quoi
  // afficher DEUX lignes pleines de message, marges comprises — et ne dépend
  // donc plus de celle du bouton qu'elle recouvre.
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    minHeight: TRANSIENT_NOTIFICATION_MIN_HEIGHT,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: 16,
    backgroundColor: colors.snackbar,
  },
  // Le message prend TOUTE la largeur que l'action laisse (`flex: 1`), et
  // s'y répartit sur deux lignes au plus — jamais sous l'action, jamais
  // par-dessus : les deux largeurs sont disjointes par construction.
  message: {
    ...type.body,
    flex: 1,
    color: colors.background,
  },
  // L'action ne rétrécit JAMAIS (`flexShrink: 0`) : sa largeur est celle de
  // son libellé, réservée avant que le message ne prenne le reste. Sans
  // cela, un message long la comprimait jusqu'à la faire passer à la ligne
  // ou la tronquer. `minWidth` lui garantit en outre la largeur tactile
  // canonique.
  action: {
    flexShrink: 0,
    minWidth: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...type.button,
    color: colors.background,
  },
});
