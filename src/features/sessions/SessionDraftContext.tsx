import { createContext, useContext } from "react";

import type { SessionDraft } from "@/domain/sessions/SessionDraft";

/**
 * Contrat React pur du brouillon de Composition (T01-S07 ; T01-S10 :
 * distinction création / modification), sur le même patron que
 * `SessionServiceContext.tsx` (T01-S05) : aucune dépendance SQLite/Repository
 * ici — l'état réel (et sa construction) vit dans `SessionDraftProvider.tsx`.
 */

/**
 * Statut de la (ré)hydratation d'un brouillon de MODIFICATION (T01-S10,
 * CE-T01-S10-01/02/09) :
 * - `"creating"` : aucune Séance source — parcours de création classique ;
 * - `"loading"` : lecture de la Séance persistée en cours ;
 * - `"ready"` : brouillon disponible (vide en création, réhydraté en
 *   modification) ;
 * - `"not-found"` : identifiant inconnu — retour sûr au Catalogue ;
 * - `"archived"` : Séance archivée — aucun brouillon modifiable ;
 * - `"error"` : échec technique de lecture — retry possible.
 */
export type SessionDraftEditStatus =
  | "creating"
  | "loading"
  | "ready"
  | "not-found"
  | "archived"
  | "error";

export type SessionDraftContextValue = {
  readonly draft: SessionDraft;
  /** Fusionne les champs fournis dans le brouillon courant — jamais un remplacement complet. */
  readonly updateDraft: (patch: Partial<SessionDraft>) => void;
  /** Ramène le brouillon à `createEmptyDraft()`. */
  readonly resetDraft: () => void;
  /**
   * T01-S10 : statut de réhydratation courant. Champs optionnels de
   * transition (livraison séquencée) — `SessionDraftProvider` les fournit
   * toujours ; un consommateur lit `editStatus ?? "creating"` et appelle
   * `hydrateFromSession?.(...)`.
   */
  readonly editStatus?: SessionDraftEditStatus;
  /**
   * T01-S10 : (ré)hydrate le brouillon depuis une Séance persistée. `null`
   * (ré)initialise un brouillon de création. Idempotent sur un même
   * `sessionId` déjà chargé ; un changement d'identifiant repart d'un
   * brouillon vierge et invalide toute réponse en vol de l'ancien.
   */
  readonly hydrateFromSession?: (sessionId: string | null) => void;
  /** T01-S10 : relance la dernière réhydratation ayant échoué (`"error"`). */
  readonly retryHydration?: () => void;
  /**
   * T01-S10 (CE-T01-S10-06) : brouillon TEL QU'IL A ÉTÉ RÉHYDRATÉ depuis la
   * Séance persistée, ou `null` en création / avant réhydratation. Sert de
   * référence à la garde de sortie en modification — le dialogue d'abandon
   * n'apparaît que si le brouillon courant en diffère.
   */
  readonly hydratedBaseline?: SessionDraft | null;
  /**
   * V2-PRE-2 (plan §6.1/§7, T18) : brouillon de CRÉATION tel qu'il a été
   * RÉELLEMENT initialisé (valeurs du Profil au moment de la création,
   * snapshot atomique) — sert de référence à `isSessionDraftDirty` en
   * création, exactement comme `hydratedBaseline` sert de référence en
   * modification. Toujours `createEmptyDraft()` (constantes du Domaine) tant
   * que le Profil n'a pas encore été lu (T19).
   */
  readonly creationBaseline?: SessionDraft;
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
