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
 *
 * PRE-9 (A.1, D-449 / D-451) : création, modification, ouverture, consultation et duplication
 * passent par le chemin structuré (`StructuredSessionRepository`) ; aucune Séance n'est plus
 * projetée dans l'ancien modèle à Circuit unique, Cycles et plusieurs Circuits compris.
 */

import type { Session, SessionSummary } from "@/domain/sessions/Session";
import { toStructuredSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { ValidationResult, ValidationViolation } from "@/domain/sessions/errors";
import {
  isSessionCatalogueRepository,
  isStructuredSessionRepository,
  type CatalogueSessionRecord,
  type SessionCatalogueRepository,
  type SessionLifecycleOutcome,
  type SessionRepository,
  type StructuredSession,
  type StructuredSessionRepository,
} from "@/domain/sessions/SessionRepository";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";
import { markMovementCreated } from "@/features/activities/newMovementMarks";

/**
 * Résultat de la création d'une Séance : succès avec la Séance persistée,
 * ou échec avec la liste structurée des violations (mêmes codes/champs que
 * le Domaine, aucun message traduit). Alias direct du contrat du Domaine.
 */
export type CreateSessionResult = ValidationResult<StructuredSession>;

/**
 * Résultat métier discriminé d'une tentative de modification. Reprend les
 * trois issues déjà connues du Repository (`UPDATED`/`NOT_FOUND`/`ARCHIVED`)
 * et y ajoute la seule branche que le Repository ne connaît pas : un
 * brouillon invalide (`INVALID`), tranchée avant même d'atteindre le
 * Repository.
 */
export type UpdateSessionResult =
  | { readonly status: "UPDATED"; readonly session: StructuredSession }
  | { readonly status: "INVALID"; readonly violations: readonly ValidationViolation[] }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" }
  /** PRE-4 story 4.1 (AC13) : Activité existante supprimée entre-temps — voir `UpdateSessionOutcome`. */
  | { readonly status: "ACTIVITY_NOT_FOUND" };

/**
 * Résultat de l'ouverture d'une Séance en MODIFICATION (T01-S10). Une Séance
 * archivée ne produit jamais de brouillon modifiable (§3.1) ; une Séance
 * introuvable non plus. Une erreur technique du Repository se propage
 * (jamais confondue avec `NOT_FOUND`).
 */
export type LoadSessionForEditResult =
  | { readonly status: "OK"; readonly session: StructuredSession }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "ARCHIVED" };

/**
 * PRE-7 (A1.3, API-SEA-05, MFN/AC04) : issue d'une duplication de Séance.
 * `NOT_FOUND` : Séance inconnue ou non active. `INVALID` : brouillon de copie
 * refusé par la validation du Domaine (aucune écriture).
 */
export type DuplicateSessionResult =
  | { readonly status: "DUPLICATED"; readonly session: StructuredSession }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "INVALID"; readonly violations: readonly ValidationViolation[] };

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
   *
   * PRE-9 (A.1) : `newContainerId` fournit l'identité d'un Circuit créé avec la Séance
   * (`toStructuredSessionInput`) ; le câblage réel injecte `Crypto.randomUUID`
   * (`SessionServiceProvider`), à défaut `crypto.randomUUID` de l'environnement (tests).
   */
  constructor(
    private readonly sessionRepository: SessionRepository,
    _categoryRepository?: unknown,
    private readonly newContainerId: () => string = () => globalThis.crypto.randomUUID(),
  ) {}

  /**
   * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e (« Ouverture de la feuille ») : retire la
   * marque « Paramètre à vérifier » persistée de l'occurrence `activityId`. Sans effet si le dépôt
   * ne le permet pas ou si l'occurrence n'est pas enregistrée.
   */
  async acknowledgeParametersToVerify(activityId: string): Promise<void> {
    await this.sessionRepository.acknowledgeParametersToVerify?.(activityId);
  }

  /**
   * Convertit le brouillon via `toStructuredSessionInput` (Domaine). En cas
   * d'échec, aucune tentative d'écriture n'est faite : le résultat
   * structuré est renvoyé tel quel. En cas de succès, délègue la
   * persistance à `StructuredSessionRepository.createStructured`, sans
   * jamais altérer les valeurs déjà portées par chaque occurrence du brouillon.
   */
  async createSession(draft: SessionDraft): Promise<CreateSessionResult> {
    const validated = toStructuredSessionInput(draft, this.newContainerId);
    if (!validated.ok) {
      return validated;
    }

    const session = await this.structuredRepository().createStructured(validated.value);
    markDraftMovementsCreated(draft);
    return { ok: true, value: session };
  }

  /**
   * Modification bout en bout d'une Séance persistée (T01-S10, Q3-A). Le
   * `sessionId` transmis EST l'identifiant source. Convertit le brouillon via
   * `toStructuredSessionInput` (PRE-9 A.1). En cas d'échec de validation,
   * aucune tentative d'appel au Repository : un résultat `INVALID` est
   * renvoyé immédiatement. En cas de succès, délègue à
   * `StructuredSessionRepository.updateStructured` (fusion par identité ;
   * Exercices persistés à l'ouverture transmis, AC13) et renvoie son résultat
   * (`UPDATED`/`NOT_FOUND`/`ARCHIVED`/`ACTIVITY_NOT_FOUND`) tel quel. Aucune
   * erreur du Repository n'est interceptée ni transformée.
   */
  async updateSession(sessionId: string, draft: SessionDraft): Promise<UpdateSessionResult> {
    const validated = toStructuredSessionInput({ ...draft, sourceSessionId: sessionId }, this.newContainerId);
    if (!validated.ok) {
      return { status: "INVALID", violations: validated.violations };
    }

    const outcome = await this.structuredRepository().updateStructured(sessionId, {
      ...validated.value,
      ...(draft.persistedExerciseIds !== undefined ? { persistedActivityIds: [...draft.persistedExerciseIds] } : {}),
    });
    if (outcome.status === "UPDATED") markDraftMovementsCreated(draft);
    return outcome;
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
   * PRE-8 (epic E, story E.1) : Séances actives et archivées du Catalogue unifié, avec leur
   * structure générale ; projetées par `projectSessionForCatalogue` (aucune donnée dérivée stockée).
   */
  async listCatalogueSessions(): Promise<readonly CatalogueSessionRecord[]> {
    return this.catalogueRepository().listCatalogue();
  }

  /**
   * Recette E du 28/10/2026 (Hermann, e5-12, r2-02) : Séance archivée ouverte dans la Composition en
   * lecture seule, jamais en modification. Aucune écriture. PRE-9 (A.1) : structure générale.
   */
  async getSessionForConsultation(sessionId: string): Promise<StructuredSession | null> {
    return this.catalogueRepository().findForConsultation(sessionId);
  }

  /**
   * PRE-8 (epic E, story E.5 ; CE-T03-01 révisé) : archivage immédiat d'une Séance active. Aucune
   * Routine n'existe dans le code : aucune confirmation (la modale « Séance planifiée » n'a pas de
   * déclencheur). Une Séance déjà archivée renvoie `INVALID_STATE`, sans écriture.
   */
  async archiveSession(sessionId: string): Promise<SessionLifecycleOutcome> {
    return this.catalogueRepository().archive(sessionId);
  }

  /** PRE-8 (E.5) : restauration d'une Séance archivée, de retour parmi les actives. */
  async restoreSession(sessionId: string): Promise<SessionLifecycleOutcome> {
    return this.catalogueRepository().restore(sessionId);
  }

  /** PRE-8 (E.5) : suppression définitive d'une Séance archivée (confirmée par l'interface). */
  async deleteArchivedSession(sessionId: string): Promise<SessionLifecycleOutcome> {
    return this.catalogueRepository().deleteArchived(sessionId);
  }

  /** PRE-9 (A.1) : port structuré, implémenté par le repository SQLite. */
  private structuredRepository(): StructuredSessionRepository {
    if (!isStructuredSessionRepository(this.sessionRepository)) {
      throw new Error("The session repository does not provide the structured session port.");
    }
    return this.sessionRepository;
  }

  /** Repository du Catalogue unifié : le repository SQLite l'implémente (aucune migration). */
  private catalogueRepository(): SessionCatalogueRepository {
    if (!isSessionCatalogueRepository(this.sessionRepository)) {
      throw new Error("The session repository does not provide the unified catalogue.");
    }
    return this.sessionRepository;
  }

  /**
   * Séance complète par identifiant, dans l'ancien modèle. `null` si
   * l'identifiant n'existe pas — aucune exception levée pour ce cas attendu.
   * PRE-9 (A.1) : lecture de compatibilité, sans appelant de production.
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findById(sessionId);
  }

  /**
   * PRE-7 (A1.3, API-SEA-05, D-188, MFN-03, MFN/AC04) — duplique une Séance
   * active (`toDuplicateSessionDraft`) : nouvelle Séance `{nom} (copie)`
   * (suffixe libre parmi les Séances actives), nouveaux identifiants,
   * filiations des occurrences conservées à l'identique ; enregistrée par
   * `createSession` (une seule transaction, « déjà utilisé » au succès).
   * `newActivityId` fournit les identifiants d'occurrence (`expo-crypto` côté
   * appelant). Aucune erreur du Repository n'est interceptée. PRE-9 (A.1) :
   * Cycles et plusieurs Circuits copiés à l'identique.
   */
  async duplicateSession(sessionId: string, newActivityId: () => string): Promise<DuplicateSessionResult> {
    // Une Séance archivée n'est pas dupliquée (`findStructuredById` ne filtre pas le statut).
    if ((await this.sessionRepository.findSessionStatus(sessionId)) !== "ACTIVE") {
      return { status: "NOT_FOUND" };
    }
    const session = await this.structuredRepository().findStructuredById(sessionId);
    if (!session) {
      return { status: "NOT_FOUND" };
    }
    const takenNames = (await this.sessionRepository.listActive()).map((summary) => summary.name);
    const created = await this.createSession(toDuplicateSessionDraft(session, newActivityId, takenNames));
    return created.ok
      ? { status: "DUPLICATED", session: created.value }
      : { status: "INVALID", violations: created.violations };
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
    const session = await this.structuredRepository().findStructuredById(sessionId);
    if (!session) {
      return { status: "NOT_FOUND" };
    }
    return { status: "OK", session };
  }
}

/**
 * D-510 (Hermann, 06/11/2026) : une fiche Mouvement créée depuis la Composition (`NEW` dans le brouillon) n'existe qu'à
 * l'enregistrement de la Séance ; elle est alors marquée « New » pour la visite suivante du catalogue des mouvements.
 * Une fiche existante réutilisée ou corrigée (`EDITED`) n'est pas une création.
 */
function markDraftMovementsCreated(draft: SessionDraft): void {
  for (const movement of Object.values(draft.movements ?? {})) {
    if (movement.change === "NEW") markMovementCreated(movement.id);
  }
}
