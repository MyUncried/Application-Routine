import { createContext, useCallback, useContext, useEffect, useRef } from "react";

/**
 * Recette iPhone du 16/11/2026 (constats e et f, Hermann : « Lorsque dans une composition de séance je fais un glisser gauche sur une
 * carte ou un circuit, la liste ne doit pas défiler et rester stable » ; « Lorsque dans un catalogue (de mouvements / de séances) je
 * fais un glisser gauche sur une carte, la liste ne doit pas défiler et rester stable ») : la liste qui porte des cartes à actions
 * glissées fournit ce verrou ; une carte le prend dès que son glissement horizontal est engagé et le rend au relâchement. Le défilement
 * vertical reste à la liste tant qu'aucun glissement n'est engagé.
 */
export const SwipeScrollLockContext = createContext<((locked: boolean) => void) | null>(null);

/** Prise et restitution du verrou de défilement par une carte ; restitué au démontage. */
export function useSwipeScrollLock() {
  const setLocked = useContext(SwipeScrollLockContext);
  const heldRef = useRef(false);
  const hold = useCallback(() => {
    if (heldRef.current) return;
    heldRef.current = true;
    setLocked?.(true);
  }, [setLocked]);
  const release = useCallback(() => {
    if (!heldRef.current) return;
    heldRef.current = false;
    setLocked?.(false);
  }, [setLocked]);
  useEffect(() => release, [release]);
  return { hold, release };
}
