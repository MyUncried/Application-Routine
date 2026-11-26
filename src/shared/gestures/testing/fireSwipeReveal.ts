import { act, screen } from "@testing-library/react-native";
import { GestureDetector } from "react-native-gesture-handler";

/**
 * Tests du glisser-pour-options (`useSwipeRevealPan`). Le geste est lu sur le `GestureDetector` RENDU (identifiant
 * `panTestID`) — jamais dans le registre global de react-native-gesture-handler, qui garde les gestes des rendus démontés — et
 * ses rappels sont joués étape par étape. Un geste désactivé (`enabled(false)`) ne reçoit rien, comme sur l'appareil.
 * Jest n'exerce pas l'arbitrage des gestes d'iOS (défilement, feuille) : recette sur iPhone nécessaire.
 */
type PanEvent = { readonly translationX: number; readonly translationY: number; readonly velocityX: number };
type PanHandlers = {
  readonly onStart?: (event: PanEvent) => void;
  readonly onUpdate?: (event: PanEvent) => void;
  readonly onEnd?: (event: PanEvent, success: boolean) => void;
};
type RenderedPan = { readonly config: { readonly testId?: string; readonly enabled?: boolean }; readonly handlers: PanHandlers };

function renderedPan(panTestID: string): RenderedPan {
  const found = screen.UNSAFE_root.findAll(
    (node) => node.type === GestureDetector && (node.props.gesture as RenderedPan | undefined)?.config?.testId === panTestID,
  );
  if (found.length !== 1) throw new Error(`Geste « ${panTestID} » : ${found.length} rendu(s)`);
  return found[0]!.props.gesture as RenderedPan;
}

/** Étapes d'un glisser : activation, suivi, relâchement (chacune relit le geste rendu courant). */
export function swipeRevealSteps(panTestID: string) {
  const run = (step: (handlers: PanHandlers) => void) => {
    const pan = renderedPan(panTestID);
    if (pan.config.enabled === false) return;
    act(() => step(pan.handlers));
  };
  return {
    begin: () => run((handlers) => handlers.onStart?.({ translationX: 0, translationY: 0, velocityX: 0 })),
    update: (translationX: number, translationY = 0) => run((handlers) => handlers.onUpdate?.({ translationX, translationY, velocityX: 0 })),
    end: (translationX: number, velocityX = 0, translationY = 0) =>
      run((handlers) => handlers.onEnd?.({ translationX, translationY, velocityX }, true)),
  };
}

/** Glisser complet : activation, suivi jusqu'à `translationX` (composante verticale facultative), relâchement à `velocityX`. */
export function fireSwipeReveal(
  panTestID: string,
  translationX: number,
  { translationY = 0, velocityX = 0 }: { readonly translationY?: number; readonly velocityX?: number } = {},
) {
  const steps = swipeRevealSteps(panTestID);
  steps.begin();
  steps.update(translationX / 2, translationY / 2);
  steps.update(translationX, translationY);
  steps.end(translationX, velocityX, translationY);
}
