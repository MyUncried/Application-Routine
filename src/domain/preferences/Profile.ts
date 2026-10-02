/**
 * Profil utilisateur — agrégat persistant SINGLETON (V2-PRE-1, plan §3.2) :
 * « Le Profil est un agrégat persistant singleton comprenant au minimum :
 * pause de changement de côté par défaut : 10 s ; récupération post-exercice
 * par défaut : 30 s ; compte à rebours d'Exercice par défaut : 10 s
 * (décision D-240) ; fin d'Exercice par défaut : 5 s (décision D-240). »
 *
 * Les quatre valeurs par défaut portent désormais une valeur numérique
 * normative explicite dans le contrat approuvé de cette tranche (round 3,
 * décision D-240, `docs/Specifications-fonctionnelles/07 – Registre des
 * décisions de conception.md`, complète `qualification-spec.md` §10).
 */

export const DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS = 10 as const;
export const DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS = 30 as const;
/** Décision D-240 : compte à rebours d'Exercice par défaut. */
export const DEFAULT_EXERCISE_COUNTDOWN_SECONDS = 10 as const;
/** Décision D-240 : fin d'Exercice par défaut. */
export const DEFAULT_EXERCISE_END_SECONDS = 5 as const;

export type Profile = {
  readonly id: string;
  /** Pause de changement de côté par défaut (plan §3.2) — `10` s, appliquée aux nouveaux Exercices bilatéraux. */
  readonly sideChangeRecoverySecondsDefault: number;
  /** Récupération post-exercice par défaut (plan §3.2) — `30` s, copiée dans une occurrence à sa création. */
  readonly postActivityRecoverySecondsDefault: number;
  /** Compte à rebours d'Exercice par défaut (D-240) — `10` s. */
  readonly exerciseCountdownSecondsDefault: number;
  /** Fin d'Exercice par défaut (D-240) — `5` s. */
  readonly exerciseEndSecondsDefault: number;
  readonly updatedAt: string;
};

/** Profil par défaut (première initialisation) — les quatre valeurs normatives du plan §3.2/D-240, jamais rétroactif sur un Profil déjà persisté. */
export function createDefaultProfile(id: string, updatedAt: string): Profile {
  return {
    id,
    sideChangeRecoverySecondsDefault: DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
    postActivityRecoverySecondsDefault: DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
    exerciseCountdownSecondsDefault: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
    exerciseEndSecondsDefault: DEFAULT_EXERCISE_END_SECONDS,
    updatedAt,
  };
}
