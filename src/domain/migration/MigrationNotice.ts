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

/** Seul genre d'avis : Exercices illisibles écartés par `migration010` (AD-12). */
export type MigrationNoticeKind = "UNREADABLE_EXERCISES_DROPPED";

export type MigrationNotice = {
  readonly id: number;
  readonly kind: MigrationNoticeKind;
  /** Nombre de Définitions et de Copies en Séance écartées, ≥ 1. */
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
