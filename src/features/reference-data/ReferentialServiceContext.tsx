import { createContext, useContext } from "react";

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
