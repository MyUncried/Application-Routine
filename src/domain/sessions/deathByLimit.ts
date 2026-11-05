/**
 * Death by — limite de l'intervalle (complément du 5 novembre 2026, Hermann, §13 ; conception du moteur §12, §15.3).
 *
 * Contrat préparé pour le moteur spécialisé (PRE-10/11), **sans exécution** : avant chaque rang, un rang dont le travail prévu
 * connu atteint ou dépasse la fenêtre n'est pas lancé ; le défi s'arrête après le rang précédent, motif « limite de l'intervalle
 * atteinte », sans tentative, échec ni résultat partiel fictifs. Cette fin se distingue d'une fenêtre réellement tentée et non
 * tenue (fin ordinaire du Death by, D2), que seul le moteur constate. Les membres en Répétitions n'ont aucune durée déduite.
 *
 * Exemple du complément : 10 s puis + 10 s, intervalle 60 s → rangs 1 à 5 lançables (10…50 s), arrêt avant le rang 6 (60 s).
 */

/** Motif de fin d'un Death by arrêté avant un rang dont le travail prévu ne tient pas dans sa fenêtre. */
export const DEATH_BY_INTERVAL_LIMIT = "INTERVAL_LIMIT_REACHED" as const;

/** Membre d'une fenêtre : objectif de départ, incrément par rang, et travail prévu connu d'un objectif (0 en Répétitions). */
export type DeathByMember = {
  readonly start: number;
  readonly increment: number;
  /** Travail prévu connu d'un objectif de ce membre (deux côtés et pause entre côtés compris) ; 0 en Répétitions. */
  readonly workOf: (target: number) => number;
};

/** Objectif du rang `rank` (1 = premier) : départ + incrément × (rang − 1). */
export function deathByRankTarget(member: Pick<DeathByMember, "start" | "increment">, rank: number): number {
  return member.start + member.increment * (rank - 1);
}

/** Travail prévu connu du rang `rank` dans une fenêtre : somme des membres (fenêtre commune) ou membre seul. */
export function deathByRankWork(members: readonly DeathByMember[], rank: number): number {
  return members.reduce((total, member) => total + member.workOf(deathByRankTarget(member, rank)), 0);
}

/** Le rang `rank` peut-il être lancé ? Travail prévu connu strictement inférieur à la fenêtre (même seuil que l'EMOM). */
export function deathByRankLaunchable(members: readonly DeathByMember[], rank: number, windowSeconds: number): boolean {
  const work = deathByRankWork(members, rank);
  return work === 0 || work < windowSeconds;
}

/**
 * Dernier rang lançable avant la limite de l'intervalle, et motif d'arrêt. `limit` : nombre de rangs que le moteur peut lancer
 * au plus (rangs acquis s'ils sont tous tenus) ; `null` : aucune limite connue (membres en Répétitions seulement), la fin reste
 * la première fenêtre non tenue. 0 : le premier rang ne tient pas (avertissement à l'enregistrement, aucun rang lancé).
 */
export function deathByIntervalLimit(
  members: readonly DeathByMember[],
  windowSeconds: number,
  maxRanks = 10_000,
): { readonly limit: number; readonly reason: typeof DEATH_BY_INTERVAL_LIMIT } | { readonly limit: null; readonly reason: null } {
  if (members.every((member) => member.workOf(member.start) === 0 && member.workOf(member.start + member.increment) === 0)) return { limit: null, reason: null };
  for (let rank = 1; rank <= maxRanks; rank += 1) {
    if (!deathByRankLaunchable(members, rank, windowSeconds)) return { limit: rank - 1, reason: DEATH_BY_INTERVAL_LIMIT };
  }
  return { limit: null, reason: null };
}
