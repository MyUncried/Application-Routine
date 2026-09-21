import { createContext, useContext } from "react";

import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";

/**
 * Contrat React pur d'exposition de `ActivityDefinitionService` — même
 * patron que `@/features/sessions/SessionServiceContext` : aucun import
 * `expo-sqlite` ni infrastructure ici. La construction réelle du service
 * (même connexion SQLite que `SessionService`) vit dans
 * `@/features/sessions/SessionServiceProvider`, seul module autorisé à
 * compléter la composition des services (rationale d'injection SQLite du
 * plan V2-CAT-01).
 */
export const ActivityDefinitionServiceContext = createContext<ActivityDefinitionService | null>(
  null,
);

/** Lève une erreur explicite si utilisé hors d'un `ActivityDefinitionServiceProvider`. */
export function useActivityDefinitionService(): ActivityDefinitionService {
  const service = useContext(ActivityDefinitionServiceContext);
  if (!service) {
    throw new Error(
      "useActivityDefinitionService must be used within an ActivityDefinitionServiceProvider.",
    );
  }
  return service;
}
