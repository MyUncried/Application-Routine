import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import type { TourBoundaryChoice } from "@/domain/sessions/StopPoint";
import { strings } from "@/shared/i18n";

export type TourBoundaryChoiceDialogProps = {
  /** « Début de tour » (`HEAD`) ou « Fin de tour » (`TAIL`) : le point de l'autre limite est retiré. */
  readonly onChoose: (choice: TourBoundaryChoice) => void;
  /** « Annuler » (et, sur Android, retour système ou toucher hors du dialogue) : rien ne change. */
  readonly onCancel: () => void;
};

/**
 * PRE-6 story 7.2 (D-437, ch13 CE-T03-08 L1498) : choix « lequel conserver » quand une action ferait
 * se suivre, à N ≥ 2, un Point de début de Tour et un Point de fin de Tour entre deux Tours —
 * placement, déplacement d'un Point, déplacement d'un Exercice, passage de N = 1 à N ≥ 2.
 *
 * Primitive native (`Alert`, trois boutons) : `DecisionDialog` (dialogue de perte de séries) n'en
 * porte que deux, sur une ligne de 2 × 147. Le dialogue s'ouvre au montage, une fois par montage ;
 * l'écran le monte tant que le choix est en attente et le démonte au choix ou à l'annulation.
 * Les rappels lisent toujours les dernières props (le choix est rejoué sur l'état COURANT par
 * l'écran). Rien n'est rendu : le dialogue est celui du système.
 */
export function TourBoundaryChoiceDialog({ onChoose, onCancel }: TourBoundaryChoiceDialogProps) {
  const latest = useRef({ onChoose, onCancel });
  useEffect(() => {
    latest.current = { onChoose, onCancel };
  }, [onCancel, onChoose]);
  // Mode strict (développement) : l'effet rejoué ne rouvre pas un second dialogue.
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    const t = strings.screens.composition.tourBoundaryChoice;
    // Un seul rappel par dialogue (Android peut signaler une fermeture après un bouton).
    let settled = false;
    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      action();
    };
    Alert.alert(
      t.title,
      t.message,
      [
        { text: t.head, onPress: () => settle(() => latest.current.onChoose("HEAD")) },
        { text: t.tail, onPress: () => settle(() => latest.current.onChoose("TAIL")) },
        { text: t.cancel, style: "cancel", onPress: () => settle(() => latest.current.onCancel()) },
      ],
      { cancelable: true, onDismiss: () => settle(() => latest.current.onCancel()) },
    );
  }, []);
  return null;
}
