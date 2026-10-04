import { createContext, useContext, useEffect, useState } from "react";

import type { ReferentialService } from "@/features/reference-data/ReferentialService";

/**
 * Contrat React pur d'exposition de `ReferentialService` — même patron que
 * `@/features/sessions/SessionServiceContext`. La construction réelle du
 * service (même connexion SQLite que `SessionService`) vit dans
 * `SessionServiceProvider.tsx`.
 */
export const ReferentialServiceContext = createContext<ReferentialService | null>(null);

/** Lève une erreur explicite si utilisé hors d'un fournisseur construit par `SessionServiceProvider`. */
export function useReferentialService(): ReferentialService {
  const service = useContext(ReferentialServiceContext);
  if (!service) {
    throw new Error("useReferentialService must be used within a SessionServiceProvider.");
  }
  return service;
}

/**
 * R6 (CE-UI-09 L2784, L2816, L2840) : compteur de version du référentiel
 * des Zones corporelles — incrémenté par `BodyZonePickerModal` après
 * chaque création, renommage ou retrait réussi, lu par
 * `useBodyZonesReferential` de `CompositionScreen` (même rôle que le
 * `refreshToken` de `useLabelsReferential`) pour relire la liste sans
 * fermer ni rouvrir l'Exercice ni remonter la Composition. Signal module
 * global VOLONTAIRE : les deux écrans ne partagent aucun ancêtre React
 * commun au-dessus de `SessionServiceProvider`, et `useFocusEffect` réel
 * exige un `NavigationContainer` absent du harnais de test de
 * `CompositionScreen` (confirmé empiriquement).
 */
let bodyZonesReferentialVersion = 0;
const bodyZonesReferentialVersionListeners = new Set<() => void>();

export function notifyBodyZonesReferentialChanged(): void {
  bodyZonesReferentialVersion += 1;
  bodyZonesReferentialVersionListeners.forEach((listener) => listener());
}

export function useBodyZonesReferentialVersion(): number {
  const [version, setVersion] = useState(bodyZonesReferentialVersion);
  useEffect(() => {
    function handleChange() {
      setVersion(bodyZonesReferentialVersion);
    }
    bodyZonesReferentialVersionListeners.add(handleChange);
    return () => {
      bodyZonesReferentialVersionListeners.delete(handleChange);
    };
  }, []);
  return version;
}
