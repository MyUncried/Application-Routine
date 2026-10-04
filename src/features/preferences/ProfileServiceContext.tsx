import { createContext, useContext } from "react";

import type { ProfileService } from "@/features/preferences/ProfileService";

/**
 * Contrat React pur d'exposition de `ProfileService` — même patron que
 * `@/features/sessions/SessionServiceContext` : aucun import `expo-sqlite`
 * ni infrastructure ici. La construction réelle du service (même connexion
 * SQLite que `SessionService`) vit dans `SessionServiceProvider.tsx`.
 */
export const ProfileServiceContext = createContext<ProfileService | null>(null);

/** Lève une erreur explicite si utilisé hors d'un fournisseur construit par `SessionServiceProvider`. */
export function useProfileService(): ProfileService {
  const service = useContext(ProfileServiceContext);
  if (!service) {
    throw new Error("useProfileService must be used within a SessionServiceProvider.");
  }
  return service;
}
