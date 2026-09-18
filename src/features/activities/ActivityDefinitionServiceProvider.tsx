import type { ReactNode } from "react";

import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";

export type ActivityDefinitionServiceProviderProps = {
  /**
   * Instance déjà construite par `SessionServiceProvider` (même connexion
   * SQLite, même cycle de migration que `SessionService`) — `null` tant
   * qu'elle n'est pas encore disponible. Ce composant ne construit jamais
   * lui-même de Repository ni de connexion : une seule composition SQLite
   * reste autorisée (rationale d'injection SQLite du plan V2-CAT-01).
   */
  service: ActivityDefinitionService | null;
  children: ReactNode;
};

/** Expose `ActivityDefinitionService` via son contexte React pur. */
export function ActivityDefinitionServiceProvider({
  service,
  children,
}: ActivityDefinitionServiceProviderProps) {
  return (
    <ActivityDefinitionServiceContext.Provider value={service}>
      {children}
    </ActivityDefinitionServiceContext.Provider>
  );
}
