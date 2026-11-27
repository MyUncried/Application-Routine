/**
 * D-578 à D-581 / D-427 (décisions de Hermann du 27/11/2026) — finalisation d'une Exécution sur l'écran de fin de séance (CE-UI-08) :
 * ressenti à cinq niveaux (D-579, obligatoire), commentaire facultatif (≤ 200 caractères) et douleur après la séance (0–10,
 * seulement si l'option douleur du Programme est active). Enregistrement atomique et idempotent (CE-UI-08 § 15) : une seconde
 * finalisation de la même Exécution remplace la première, sans créer de seconde Exécution.
 */
export const FEEDBACK_FEELINGS = ["VERY_BAD", "BAD", "NEUTRAL", "GOOD", "VERY_GOOD"] as const;
export type FeedbackFeeling = (typeof FEEDBACK_FEELINGS)[number];

export const FEEDBACK_COMMENT_MAX = 200;

export type ExecutionFeedback = {
  readonly executionId: string;
  readonly feeling: FeedbackFeeling;
  /** Commentaire facultatif ; vide → `null`. */
  readonly comment: string | null;
  /** Douleur après la séance (D-427, option du Programme) ; `null` : non demandée. Jamais 0 par défaut. */
  readonly painAfter: number | null;
  /**
   * Photo de fin de séance (décision de Hermann du 27/11/2026, point 4) : adresse de la copie privée dans l’espace de l’application ;
   * `null` : aucune photo. Une seule photo par séance. Facultatif à l’écriture (absent = aucune photo).
   */
  readonly photoPath?: string | null;
  /**
   * Répétitions corrigées sur l'écran de fin (décision de Hermann du 27/11/2026, « Répétitions corrigées : A ») : par série
   * (`<occurrence>#<série>`), la valeur corrigée remplace la valeur d'origine. Enregistrées avec Enregistrer seulement.
   */
  readonly repetitionCorrections?: readonly RepetitionCorrection[];
};

export type RepetitionCorrection = { readonly seriesKey: string; readonly repetitions: number };

export interface ExecutionFeedbackRepository {
  save(feedback: ExecutionFeedback, at: string): Promise<void>;
  get(executionId: string): Promise<ExecutionFeedback | null>;
  /** Répétitions corrigées enregistrées de l'Exécution, par série ; vide sans correction. */
  repetitionCorrections(executionId: string): Promise<ReadonlyMap<string, number>>;
}
