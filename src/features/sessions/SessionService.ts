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
import {
  toCreateSessionInput,
  toUpdateSessionInput,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import type { ValidationResult, ValidationViolation } from "@/domain/sessions/errors";
import type { SessionRepository } from "@/domain/sessions/SessionRepository";

/**
 * Résultat de la création d'une Séance : succès avec la Séance persistée,
 * ou échec avec la liste structurée des violations (mêmes codes/champs que
 * le Domaine, aucun message traduit). Alias direct du contrat du Domaine.
 */
export type CreateSessionResult = ValidationResult<Session>;

/**
 * Résultat métier discriminé d'une tentative de modification. Reprend les
 * trois issues déjà connues du Repository (`UPDATED`/`NOT_FOUND`/`ARCHIVED`)
 * et y ajoute la seule branche que le Repository ne connaît pas : un
 * brouillon invalide (`INVALID`), tranchée avant même d'atteindre le
 * Repository.
 */
export type UpdateSessionResult =
  | { readonly status: "UPDATED"; readonly session: Session }
  | { readonly status: "INVALID"; readonly violations: readonly ValidationViolation[] }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

/**
 * Résultat de l'ouverture d'une Séance en MODIFICATION (T01-S10). Une Séance
 * archivée ne produit jamais de brouillon modifiable (§3.1) ; une Séance
 * introuvable non plus. Une erreur technique du Repository se propage
 * (jamais confondue avec `NOT_FOUND`).
 */
export type LoadSessionForEditResult =
  | { readonly status: "OK"; readonly session: Session }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

export class SessionService {
  /**
   * `categoryRepository` (T01-S09) n'a plus aucun consommateur depuis le
   * retrait de la relation historique Catégorie de Séance (V2-PRE-1, plan
   * §3.3) — le DEUXIÈME paramètre du constructeur est néanmoins PRÉSERVÉ
   * (type et position inchangés) pour ne jamais rompre la composition
   * existante de `SessionServiceProvider.tsx` (hors périmètre d'écriture de
   * cette tranche, `scope_allow`), qui construit encore
   * `new SessionService(sessionRepository, categoryRepository)`.
   *
   * **V2-PRE-2 (plan §6.3)** : chaque occurrence porte déjà sa propre
   * `postActivityRecoverySeconds`, copiée du Profil au moment de sa
   * création réelle (`ActivitySelectionScreen`, `ExerciseScreen` local) —
   * `createSession` ne la relit ni ne l'écrase plus jamais depuis le Profil
   * (abroge l'écrasement V2-PRE-1 : « sans rétroactivité »).
   */
  constructor(
    private readonly sessionRepository: SessionRepository,
    _categoryRepository?: unknown,
  ) {}

  /**
   * Convertit le brouillon via `toCreateSessionInput` (Domaine). En cas
   * d'échec, aucune tentative d'écriture n'est faite : le résultat
   * structuré est renvoyé tel quel. En cas de succès, délègue la
   * persistance à `SessionRepository.create`, sans jamais altérer les
   * valeurs déjà portées par chaque occurrence du brouillon.
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
   * Modification bout en bout d'une Séance persistée (T01-S10, Q3-A). Le
   * `sessionId` transmis EST l'identifiant source : il prime sur
   * `draft.sourceSessionId` (fixé ici avant conversion). Convertit le
   * brouillon via `toUpdateSessionInput` (jamais `toCreateSessionInput` —
   * `create()` n'est jamais appelé en modification). En cas d'échec de
   * validation, aucune tentative d'appel au Repository : un résultat
   * `INVALID` est renvoyé immédiatement. En cas de succès, délègue à
   * `SessionRepository.update` et renvoie son résultat
   * (`UPDATED`/`NOT_FOUND`/`ARCHIVED`) tel quel. Aucune erreur du Repository
   * n'est interceptée ni transformée.
   */
  async updateSession(sessionId: string, draft: SessionDraft): Promise<UpdateSessionResult> {
    const validated = toUpdateSessionInput({ ...draft, sourceSessionId: sessionId });
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }

    return this.sessionRepository.update(sessionId, validated.value);
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

  /**
   * Ouvre une Séance en MODIFICATION (T01-S10, CE-T01-S10-01/02). Lecture
   * seule : aucune écriture. Distingue `NOT_FOUND` d'`ARCHIVED` via le
   * statut brut avant tout assemblage d'agrégat. Une erreur technique du
   * Repository se propage telle quelle.
   */
  async getSessionForEdit(sessionId: string): Promise<LoadSessionForEditResult> {
    const status = await this.sessionRepository.findSessionStatus(sessionId);
    if (status === null) {
      return { status: "NOT_FOUND" };
    }
    if (status === "ARCHIVED") {
      return { status: "ARCHIVED" };
    }
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return { status: "NOT_FOUND" };
    }
    return { status: "OK", session };
  }
}
