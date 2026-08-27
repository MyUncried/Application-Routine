import { useCallback, useMemo, useState, type ReactNode } from "react";

import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import {
  SessionDraftContext,
  type SessionDraftContextValue,
} from "@/features/sessions/SessionDraftContext";

export type SessionDraftProviderProps = {
  children: ReactNode;
};

/**
 * État réel du brouillon de Composition (T01-S07) : un unique `useState`
 * local, initialisé à `createEmptyDraft()`. `updateDraft`/`resetDraft` sont
 * des références stables (`useCallback`, dépendances vides) — condition
 * nécessaire pour que `useCompositionExitGuard` (qui reçoit `resetDraft`)
 * ne resouscrive pas inutilement.
 *
 * Monté par `app/(creation)/_layout.tsx`, au-dessus d'un `Stack` imbriqué
 * (voir T01-S07-rapport-implementation-composition-seance.md) : le brouillon
 * survit à toute navigation entre écrans enfants de ce `Stack` — un
 * navigateur ne démonte pas ses ancêtres React lors d'une navigation entre
 * ses propres écrans.
 */
export function SessionDraftProvider({ children }: SessionDraftProviderProps) {
  const [draft, setDraft] = useState<SessionDraft>(() => createEmptyDraft());

  const updateDraft = useCallback((patch: Partial<SessionDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyDraft());
  }, []);

  const value = useMemo<SessionDraftContextValue>(
    () => ({ draft, updateDraft, resetDraft }),
    [draft, updateDraft, resetDraft],
  );

  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}
