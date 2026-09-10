import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useState } from "react";

/**
 * Garde de sortie de Composition (T01-S07, plan §10.2). Utilise
 * exclusivement l'API publique `usePreventRemove` réexportée par le
 * sous-chemin public `expo-router/react-navigation` — vérifiée
 * empiriquement (chaîne de réexport tracée jusqu'à l'implémentation réelle,
 * confirmée par un test Jest ponctuel exécuté puis supprimé). Un simple
 * `navigation.addListener("beforeRemove", …)` ne suffirait pas : native-stack
 * consulte spécifiquement le `PreventRemoveContext` peuplé par ce hook pour
 * décider si le geste de glissement iOS doit être intercepté
 * (`NativeStackView.native.js`), ce qu'un écouteur `beforeRemove` isolé ne
 * peut pas fournir.
 *
 * Type de l'action interceptée dérivé structurellement de la signature de
 * `usePreventRemove` elle-même (`Parameters<...>`), plutôt qu'importé
 * directement d'un paquet `@react-navigation/*` séparé — aucune nouvelle
 * dépendance de ce type n'est ajoutée.
 */
type PreventRemoveCallback = Parameters<typeof usePreventRemove>[1];
type PreventRemoveEvent = Parameters<PreventRemoveCallback>[0];
type PendingNavigationAction = PreventRemoveEvent["data"]["action"];

export type UseCompositionExitGuardResult = {
  /** Une sortie a été interceptée : une seule modale doit être affichée. */
  readonly isPendingExit: boolean;
  /** « Continuer la création » — efface l'action interceptée, ne navigue jamais. */
  readonly cancelExit: () => void;
  /** « Abandonner » — exécute `onConfirmExit` (réinitialisation du brouillon) puis rejoue l'action interceptée, exactement une fois. */
  readonly confirmExit: () => void;
};

/**
 * @param shouldBlock Bloquer la sortie tant que vrai (brouillon modifié — `isSessionDraftDirty`).
 * @param onConfirmExit Appelé une seule fois, avant le rejeu de la navigation, lorsque l'utilisateur confirme l'abandon (typiquement `resetDraft`).
 */
export function useCompositionExitGuard(
  shouldBlock: boolean,
  onConfirmExit: () => void,
): UseCompositionExitGuardResult {
  const navigation = useNavigation();
  const [pendingAction, setPendingAction] = useState<PendingNavigationAction | null>(null);

  usePreventRemove(shouldBlock, ({ data }) => {
    setPendingAction(data.action);
  });

  const cancelExit = useCallback(() => {
    setPendingAction(null);
  }, []);

  // Lecture directe de `pendingAction` (dépendance explicite), pas un
  // updater fonctionnel de `setPendingAction` : un tel updater peut être
  // invoqué par React pendant une phase de rendu (y compris en dehors de
  // l'appel initial), et y exécuter un effet de bord (ici `onConfirmExit`,
  // qui appelle `resetDraft` — un `setState` d'un AUTRE composant — puis
  // `navigation.dispatch`) déclenche l'avertissement React « Cannot update
  // a component while rendering a different component » et n'est pas
  // sûr. `confirmExit` est lui-même toujours invoqué depuis un
  // gestionnaire d'événement (`onPress` d'`AbandonCreationModal`), jamais
  // pendant un rendu : lire `pendingAction` par fermeture y est sûr.
  const confirmExit = useCallback(() => {
    if (pendingAction === null) {
      return;
    }
    const action = pendingAction;
    // Remis à `null` avant le rejeu (§10.2, prévention des doubles
    // confirmations) : un second déclenchement de la prévention ne peut
    // survenir qu'après un nouveau blocage réel.
    setPendingAction(null);
    onConfirmExit();
    navigation.dispatch(action);
  }, [pendingAction, onConfirmExit, navigation]);

  return {
    isPendingExit: pendingAction !== null,
    cancelExit,
    confirmExit,
  };
}
