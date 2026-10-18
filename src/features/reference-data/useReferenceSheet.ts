import { useRef, useState, type RefObject } from "react";
import { AccessibilityInfo, Platform, type View } from "react-native";

/**
 * PRE-4 story 4.6 (FR-22-10, AC9 ; revue) — ouverture d'une feuille de référentiel (Catégorie,
 * Zones) et retour du focus VoiceOver à l'accès qui l'a ouverte, APRÈS la fin de la fermeture.
 *
 * Sur iOS, la feuille est un `Modal` en fondu : envoyer le focus pendant le fondu le perd. La
 * feuille reste donc montée en `visible={false}` jusqu'à `onDismiss` du `Modal` (même procédé
 * que la présentation photo de la story 4.5), puis elle est démontée et le focus est envoyé.
 * Ailleurs (Android, web), elle est démontée et le focus envoyé dès la fermeture, comme avant.
 * `generation` sert de `key` : chaque ouverture monte une feuille neuve (état PRE-3 d'une
 * ouverture, jamais celui d'une feuille encore en cours de fermeture).
 */
export type ReferenceSheet = {
  /** Feuille demandée ouverte (icône pleine, état « développé » de l'accès). */
  readonly isOpen: boolean;
  /** Feuille à rendre (ouverte, ou en cours de fermeture sur iOS). */
  readonly isMounted: boolean;
  /** Clé de montage, incrémentée à chaque ouverture. */
  readonly generation: number;
  readonly open: () => void;
  /** Fermeture demandée (✕, ✓, retour système). */
  readonly close: () => void;
  /** `onDismiss` du `Modal` : fin de la fermeture animée. */
  readonly dismissed: () => void;
};

export function useReferenceSheet(triggerRef: RefObject<View | null>): ReferenceSheet {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [generation, setGeneration] = useState(0);
  const isOpenRef = useRef(false);
  const isMountedRef = useRef(false);

  function finish() {
    if (!isMountedRef.current) return;
    isMountedRef.current = false;
    setIsMounted(false);
    if (triggerRef.current) AccessibilityInfo.sendAccessibilityEvent(triggerRef.current, "focus");
  }

  return {
    isOpen,
    isMounted,
    generation,
    open() {
      isOpenRef.current = true;
      isMountedRef.current = true;
      setGeneration((current) => current + 1);
      setIsMounted(true);
      setIsOpen(true);
    },
    close() {
      if (!isOpenRef.current) return;
      isOpenRef.current = false;
      setIsOpen(false);
      if (Platform.OS !== "ios") finish();
    },
    dismissed() {
      // Une feuille rouverte entre-temps n'est pas fermée par le rappel de la précédente.
      if (isOpenRef.current) return;
      finish();
    },
  };
}
