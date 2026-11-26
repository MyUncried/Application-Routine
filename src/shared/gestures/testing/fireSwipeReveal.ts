import { expect } from "@jest/globals";
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

/**
 * Rangée `SwipeActionsRow` en mode `nativeGesture` (geste `${rowTestID}-pan`) : options révélées et actives (bloc d'actions
 * `${rowTestID}-actions` touchable). Une rangée qui se referme garde son bloc monté le temps de l'animation, inactif.
 */
export function isSwipeRowOpen(rowTestID: string): boolean {
  return screen.queryByTestId(`${rowTestID}-actions`)?.props.pointerEvents === "auto";
}

/**
 * Règle unique du glisser-pour-options (recette iPhone du 26/11/2026 après-midi), jouée sur une rangée fermée d'un écran :
 * glisser trop court sans effet ; geste court en diagonale qui ouvre puis ferme ; lancer qui ouvre puis ferme ; glisser dont le
 * doigt part à la verticale en cours de route, suivi jusqu'au relâchement (aucun retour arrière). `isOpen` lit l'état de l'écran.
 */
export function expectSwipeRevealRule(rowTestID: string, isOpen: () => boolean = () => isSwipeRowOpen(rowTestID)) {
  const pan = `${rowTestID}-pan`;
  expect(isOpen()).toBe(false);
  // En deçà de 24 pt, sans lancer : la position de départ est conservée.
  fireSwipeReveal(pan, -12, { translationY: 6 });
  expect(isOpen()).toBe(false);
  // Geste court (30 pt, bien moins que la course des options), doigt en diagonale : ouvre, puis ferme.
  fireSwipeReveal(pan, -30, { translationY: 20 });
  expect(isOpen()).toBe(true);
  fireSwipeReveal(pan, 30, { translationY: -20 });
  expect(isOpen()).toBe(false);
  // Lancer : son sens décide, quelle que soit la distance.
  fireSwipeReveal(pan, -12, { velocityX: -600 });
  expect(isOpen()).toBe(true);
  fireSwipeReveal(pan, 12, { velocityX: 600 });
  expect(isOpen()).toBe(false);
  // Aucun rebond : le doigt part vers le haut puis vers le bas pendant le glisser ; le geste reste suivi et ouvre au relâchement.
  const steps = swipeRevealSteps(pan);
  steps.begin();
  steps.update(-20, 30);
  steps.update(-28, -40);
  steps.update(-40, 60);
  steps.end(-40, 0, 60);
  expect(isOpen()).toBe(true);
  fireSwipeReveal(pan, 40, { translationY: -30 });
  expect(isOpen()).toBe(false);
}
