import { createContext, useContext } from "react";

import type { SessionDraft } from "@/domain/sessions/SessionDraft";

/**
 * Contrat React pur du brouillon de Composition (T01-S07), sur le même
 * patron que `SessionServiceContext.tsx` (T01-S05) : aucune dépendance
 * SQLite/Repository ici — l'état réel (et sa construction) vit dans
 * `SessionDraftProvider.tsx`.
 */
export type SessionDraftContextValue = {
  readonly draft: SessionDraft;
  /** Fusionne les champs fournis dans le brouillon courant — jamais un remplacement complet. */
  readonly updateDraft: (patch: Partial<SessionDraft>) => void;
  /** Ramène le brouillon à `createEmptyDraft()`. */
  readonly resetDraft: () => void;
};

export const SessionDraftContext = createContext<SessionDraftContextValue | null>(null);

/** Lève une erreur explicite si utilisé hors d'un `SessionDraftProvider`. */
export function useSessionDraft(): SessionDraftContextValue {
  const value = useContext(SessionDraftContext);
  if (!value) {
    throw new Error("useSessionDraft must be used within a SessionDraftProvider.");
  }
  return value;
}
