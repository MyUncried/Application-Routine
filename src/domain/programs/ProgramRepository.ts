import type { Program } from "./Program";

/**
 * Port de persistance des Programmes (PROG-CAT-01, migration 035). Le rattachement d'une routine (`routines.program_id`) et
 * l'accord au suivi de la douleur (`user_privacy.pain_consent_at`, valeur de l'utilisateur, D-551) passent aussi par ce port :
 * ils n'ont de sens que pour les programmes.
 */
export interface ProgramRepository {
  list(): Promise<readonly Program[]>;
  get(programId: string): Promise<Program | null>;
  /** Crée ou remplace le programme `program.id`. */
  save(program: Program): Promise<void>;
  /** Supprime le programme ; ses routines restent, détachées (`ON DELETE SET NULL`). */
  delete(programId: string): Promise<boolean>;
  /** Rattache (`programId`) ou détache (`null`) une routine ; la routine n'est jamais supprimée. */
  setRoutineProgram(routineId: string, programId: string | null): Promise<void>;
  /** Détache toutes les routines du programme (« Garder les routines dans le calendrier », D-547). */
  detachAll(programId: string): Promise<void>;
  /**
   * Historique du programme : nombre d'exécutions lancées depuis une occurrence d'une routine rattachée, d'après la référence
   * figée sur l'exécution (`executions.program_id`, Hermann, 21/11/2026, point 3).
   */
  executionCount(programId: string): Promise<number>;
  /** Date d'accord au suivi de la douleur (D-551) ; `null` : aucun accord. */
  painConsentAt(): Promise<string | null>;
  setPainConsentAt(at: string | null): Promise<void>;
  /** Désactive le suivi de la douleur dans tous les programmes (« Retirer mon accord », D-551). */
  disablePainTrackingEverywhere(at: string): Promise<void>;
  /**
   * D-427 / D-577 (réponse de Hermann du 27/11/2026, « Oui il faut la stocker ») : douleur 0–10 avant la séance, rattachée à
   * l'Exécution (`execution_pain_readings`, migration 043) ; une seule valeur par Exécution (remplacée si répétée).
   */
  recordPainBefore(executionId: string, value: number, at: string): Promise<void>;
  /** Nombre de relevés de douleur enregistrés (Profil › Confidentialité, D-551). */
  painReadingCount(): Promise<number>;
  /** « Effacer mes relevés » (D-551) : supprime tous les relevés de douleur. */
  erasePainReadings(): Promise<void>;
}
