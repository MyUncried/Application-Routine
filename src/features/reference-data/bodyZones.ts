/**
 * Référentiel HISTORIQUE des Zones corporelles (T01-S08, D-093). Périmètre
 * MVP d'origine : exactement 10 zones, sans « Corps entier », sans
 * distinction gauche/droite.
 *
 * **V2-PRE-1 (plan §3.1, UI-5FAB9AD7AB21, REQ-E7260E768F020CE0)** : ce
 * module n'est PLUS l'autorité runtime des Zones corporelles. Son seul rôle
 * restant est de fournir la liste de SEED consommée une fois, par la
 * migration SQLite qui peuple la table persistante `body_zones`
 * (`migration007.ts`) — jamais par un écran ou une présentation en
 * exécution. Toute lecture runtime (sélection, affichage d'une carte, d'une
 * ligne de composition) passe exclusivement par le référentiel persistant
 * (`@/domain/body-zones/BodyZoneRepository`, lu via
 * `SqliteBodyZoneRepository`), jamais par `BODY_ZONES` : voir
 * `BodyZoneSelector.tsx`, `ActivityCard.tsx`, `ActivitySelectionScreen.tsx`,
 * `CompositionScreen.tsx` et `ExerciseScreen.tsx`, qui n'importent plus ce
 * module comme source de données d'un rendu.
 *
 * Les valeurs ci-dessous (identifiants, libellés, ordre) sont donc
 * PRÉSERVÉES À L'IDENTIQUE de la baseline historique : les faire diverger
 * romprait la correspondance avec les lignes déjà persistées par
 * `migration007.ts` lors d'une installation neuve ou d'une convergence
 * depuis une base existante (voir `bodyZones.test.ts`, qui fige ce contrat).
 *
 * `id` est stable et n'est jamais réutilisé pour une autre zone — c'est lui
 * qui est persisté dans `body_zones.id`, jamais `name` ni `order`.
 */

/**
 * Forme du SEED historique uniquement — distincte du type runtime
 * `@/domain/body-zones/BodyZone` (`isActive`/`createdAt`, lu depuis la
 * table persistante). Nommée différemment pour qu'aucune confusion ni
 * substitution accidentelle entre les deux ne soit possible au niveau des
 * types.
 */
export type BodyZoneSeed = {
  readonly id: string;
  readonly name: string;
  /** Ordre de seed, 0-indexé — jamais relu au runtime. */
  readonly order: number;
};

export const BODY_ZONES: readonly BodyZoneSeed[] = [
  { id: "cou", name: "Cou", order: 0 },
  { id: "epaules", name: "Épaules", order: 1 },
  { id: "bras", name: "Bras", order: 2 },
  { id: "poignets-mains", name: "Poignets et mains", order: 3 },
  { id: "dos", name: "Dos", order: 4 },
  { id: "hanches-bassin", name: "Hanches et bassin", order: 5 },
  { id: "cuisses", name: "Cuisses", order: 6 },
  { id: "genoux", name: "Genoux", order: 7 },
  { id: "jambes", name: "Jambes", order: 8 },
  { id: "chevilles-pieds", name: "Chevilles et pieds", order: 9 },
] as const;
