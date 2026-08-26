/**
 * Orchestration applicative du cycle de vie de la Séance (T01-S03, §12.4).
 *
 * Ne dépend que du Domaine (`@/domain/sessions/*`) et de l'interface
 * `SessionRepository` — jamais de React, Expo, React Native ou d'une
 * implémentation concrète du Repository (injectée par le constructeur).
 *
 * `createSession` ne capture ni ne transforme les erreurs du Repository :
 * un brouillon invalide produit un résultat structuré par valeur (aucune
 * écriture tentée), tandis qu'une erreur du Repository — technique, ou
 * `SessionValidationError` en défense de dernier recours — se propage
 * telle quelle, sans être confondue avec ce résultat structuré.
 */

import type { Session, SessionSummary } from "@/domain/sessions/Session";
import { toCreateSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { ValidationResult } from "@/domain/sessions/errors";
import type { SessionRepository } from "@/domain/sessions/SessionRepository";

/**
 * Résultat de la création d'une Séance : succès avec la Séance persistée,
 * ou échec avec la liste structurée des violations (mêmes codes/champs que
 * le Domaine, aucun message traduit). Alias direct du contrat du Domaine.
 */
export type CreateSessionResult = ValidationResult<Session>;

export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  /**
   * Convertit le brouillon via `toCreateSessionInput` (Domaine). En cas
   * d'échec, aucune tentative d'écriture n'est faite : le résultat
   * structuré est renvoyé tel quel. En cas de succès, délègue la
   * persistance à `SessionRepository.create`.
   */
  async createSession(draft: SessionDraft): Promise<CreateSessionResult> {
    const validated = toCreateSessionInput(draft);
    if (!validated.ok) {
      return validated;
    }

    const session = await this.sessionRepository.create(validated.value);
    return { ok: true, value: session };
  }

  /**
   * Séances actives pour le futur Catalogue, déjà enrichies par le
   * Repository (Nombre d'Activités, Durée estimée) via les fonctions du
   * Domaine. Aucune transformation supplémentaire ici.
   */
  async listActiveSessions(): Promise<readonly SessionSummary[]> {
    return this.sessionRepository.listActive();
  }

  /**
   * Séance complète par identifiant. `null` si l'identifiant n'existe
   * pas — aucune exception levée pour ce cas attendu.
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findById(sessionId);
  }
}
