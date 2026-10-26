/**
 * PRE-4 (story 1.1, AD-12, FR-18-20, H24) : avis de migration — trace
 * minimale laissée par `migration010` quand des Exercices illisibles ont été
 * écartés (Q19). Il porte seulement un genre, un nombre et ses dates : aucun
 * identifiant, nom ni contenu d'Exercice écarté.
 *
 * Story 1.2 : son unique lecteur d'interface est `MigrationNoticeGate`
 * (`src/features/migration/`), monté une fois à la racine, qui l'affiche
 * par une `Alert` native à un seul bouton et ne l'acquitte qu'à l'appui.
 */

/**
 * Genres d'avis : Exercices illisibles écartés par `migration010` (AD-12) ;
 * PRE-7 (A1.2, D-440 assouplie, MFN-12) : Exercices et Séances réinitialisés
 * une seule fois par `migration012` (Profil, Catégories et Zones conservés).
 */
export type MigrationNoticeKind = "UNREADABLE_EXERCISES_DROPPED" | "EXERCISES_AND_SESSIONS_RESET";

export type MigrationNotice = {
  readonly id: number;
  readonly kind: MigrationNoticeKind;
  /**
   * Nombre d'éléments concernés, ≥ 1 : Définitions et Copies écartées
   * (`UNREADABLE_EXERCISES_DROPPED`) ; Exercices du Catalogue et Séances
   * supprimés (`EXERCISES_AND_SESSIONS_RESET`).
   */
  readonly count: number;
  /** ISO 8601 UTC (`Date.prototype.toISOString()`). */
  readonly createdAt: string;
  /** ISO 8601 UTC ; `null` tant que l'avis n'a pas été fermé par son bouton. */
  readonly acknowledgedAt: string | null;
};

/** Port de persistance des avis de migration, implémenté par l'infrastructure. */
export interface MigrationNoticeRepository {
  /** Avis non acquitté le plus ancien, ou `null` (aucun Exercice écarté, ou avis déjà fermé). */
  findUnacknowledged(): Promise<MigrationNotice | null>;
  /** Écrit la date d'acquittement de l'avis ; sans effet sur un avis déjà acquitté. */
  acknowledge(id: number): Promise<void>;
}
