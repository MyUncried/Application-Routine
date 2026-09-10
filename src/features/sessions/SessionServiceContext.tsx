import { createContext, useContext } from "react";

import type { SessionService } from "@/features/sessions/SessionService";

/**
 * Contrat React pur d'exposition de `SessionService` : aucun import
 * `expo-sqlite` ni infrastructure ici, volontairement — ce fichier doit
 * rester importable (et testable) sans charger de module natif. La
 * construction réelle du service (base SQLite, migration, Repository) vit
 * dans `SessionServiceProvider.tsx`, seul fichier de la feature à en
 * dépendre.
 */
export const SessionServiceContext = createContext<SessionService | null>(null);

/** Lève une erreur explicite si utilisé hors d'un `SessionServiceProvider`. */
export function useSessionService(): SessionService {
  const service = useContext(SessionServiceContext);
  if (!service) {
    throw new Error("useSessionService must be used within a SessionServiceProvider.");
  }
  return service;
}
