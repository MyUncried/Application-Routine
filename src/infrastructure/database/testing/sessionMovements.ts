import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { normalizeMovementName } from "@/domain/activities/Movement";
import type { MediaLinkInput } from "@/domain/media/ActivityMedia";
import type {
  CreateSessionActivityInput,
  CreateSessionInput,
  SessionMovementInput,
  UpdateSessionActivityInput,
  UpdateSessionInput,
} from "@/domain/sessions/Session";
import type { Database } from "@/infrastructure/database/Database";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";

/**
 * Tests seulement (PRE-7, R-3, D-445 C05) — décrire une Séance par la VUE de ses
 * occurrences (nom, description, Catégorie, Zones, médias), comme avant R-3, et
 * en dériver explicitement les Mouvements à écrire (`input.movements`) : seul
 * le Mouvement porte ce contenu ; l'occurrence n'en reçoit que la référence
 * (`sourceMovementId`) et ses paramètres propres.
 *
 * Règles de dérivation, sans aucune tolérance cachée :
 * - Exercice avec `name` : Mouvement de l'occurrence si elle est déjà persistée
 *   (référence immuable : la vue corrige son Mouvement), sinon `sourceMovementId`
 *   s'il est donné, sinon `movementIdForName(name)` (le nom est unique, C01 — deux
 *   occurrences de même nom partagent donc le même Mouvement) ; `NEW` s'il
 *   n'existe pas en base, `EDITED` sinon (contenu réécrit) ;
 * - Catégorie absente ou `null` → `TEST_MOVEMENT_CATEGORY_ID`, Zones absentes
 *   ou vides → `TEST_MOVEMENT_BODY_ZONE_IDS` (le Mouvement les exige) ;
 * - médias absents : `[]` pour un Mouvement nouveau, liens persistés conservés
 *   pour un Mouvement existant ;
 * - structure des phases = celle des paramètres de l'occurrence ;
 * - deux occurrences d'un même Mouvement au contenu différent : erreur du test
 *   (un Mouvement n'a qu'un contenu) ;
 * - Exercice sans `name` : `sourceMovementId` d'un Mouvement déjà persisté,
 *   transmis tel quel ; Récupération : aucun Mouvement.
 */

/** Vue du contenu d'une occurrence (champs retirés de l'occurrence par R-3). */
export type OccurrenceView = {
  readonly name?: string;
  readonly instruction?: string | null;
  readonly bodyZoneIds?: readonly string[];
  readonly categoryId?: string | null;
  readonly media?: readonly MediaLinkInput[];
};

export type ViewedCreateActivity = CreateSessionActivityInput & OccurrenceView;
export type ViewedUpdateActivity = UpdateSessionActivityInput & OccurrenceView;
export type ViewedCreateSessionInput = Omit<CreateSessionInput, "exercises"> & {
  readonly exercises: readonly ViewedCreateActivity[];
};
export type ViewedUpdateSessionInput = Omit<UpdateSessionInput, "activities"> & {
  readonly activities: readonly ViewedUpdateActivity[];
};

export const TEST_MOVEMENT_CATEGORY_ID = "cardio";
export const TEST_MOVEMENT_BODY_ZONE_IDS: readonly string[] = ["cuisses"];

/** Identifiant de Mouvement dérivé du nom (clé canonique, C01). */
export function movementIdForName(name: string): string {
  return `mov:${normalizeMovementName(name)}`;
}

/** Mouvement `NEW` complet pour `input.movements`, valeurs par défaut des tests. */
export function newMovementInput(
  id: string,
  overrides: Partial<Omit<SessionMovementInput, "id" | "change">> = {},
): SessionMovementInput {
  const phases = overrides.phases ?? [];
  return {
    id,
    change: "NEW",
    name: "Gainage",
    description: null,
    categoryId: TEST_MOVEMENT_CATEGORY_ID,
    bodyZoneIds: TEST_MOVEMENT_BODY_ZONE_IDS,
    media: [],
    aliases: [],
    ...overrides,
    phases,
    nextPhaseId: overrides.nextPhaseId ?? phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1,
  };
}

function phasesOf(parameters: ExecutionParametersInput): SessionMovementInput["phases"] {
  const series = (parameters as { readonly series?: { readonly workPhases?: unknown } }).series;
  const workPhases = Array.isArray(series?.workPhases) ? (series.workPhases as { id: number; label: string }[]) : [];
  return workPhases.map((phase) => ({ id: phase.id, label: phase.label }));
}

function stripView<T extends OccurrenceView>(activity: T): Omit<T, keyof OccurrenceView> {
  const { name: _name, instruction: _instruction, bodyZoneIds: _zones, categoryId: _category, media: _media, ...rest } = activity;
  return rest;
}

async function deriveMovements<T extends CreateSessionActivityInput & OccurrenceView>(
  database: Database,
  activities: readonly T[],
): Promise<{ readonly activities: CreateSessionActivityInput[]; readonly movements: SessionMovementInput[] }> {
  const movements = new Map<string, SessionMovementInput>();
  const stripped: CreateSessionActivityInput[] = [];
  for (const activity of activities) {
    const base = stripView(activity) as CreateSessionActivityInput;
    if (activity.type !== "EXERCISE" || activity.name === undefined) {
      stripped.push(base);
      continue;
    }
    // Occurrence déjà persistée : sa référence est immuable, la vue corrige SON Mouvement.
    const persisted = activity.id
      ? await database.getFirstAsync<{ source_movement_id: string }>("SELECT source_movement_id FROM activities WHERE id = ?", [
          activity.id,
        ])
      : null;
    const id = persisted?.source_movement_id ?? activity.sourceMovementId ?? movementIdForName(activity.name);
    const existing = await database.getFirstAsync<{ id: string }>("SELECT id FROM movements WHERE id = ?", [id]);
    let media = activity.media;
    if (media === undefined && existing) {
      const links = await database.getAllAsync<{ asset_id: string }>(
        "SELECT asset_id FROM movement_media WHERE movement_id = ? ORDER BY position ASC",
        [id],
      );
      media = links.map((link) => ({ assetId: link.asset_id }));
    }
    const phases = phasesOf(activity.executionParameters);
    const movement = newMovementInput(id, {
      name: activity.name,
      description: activity.instruction ?? null,
      categoryId: activity.categoryId ?? TEST_MOVEMENT_CATEGORY_ID,
      bodyZoneIds: activity.bodyZoneIds !== undefined && activity.bodyZoneIds.length > 0 ? activity.bodyZoneIds : TEST_MOVEMENT_BODY_ZONE_IDS,
      media: media ?? [],
      phases,
    });
    const derived: SessionMovementInput = { ...movement, change: existing ? "EDITED" : "NEW" };
    const previous = movements.get(id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(derived)) {
      throw new Error(`Test helper: two occurrences of movement ${id} carry different content.`);
    }
    movements.set(id, derived);
    stripped.push({ ...base, sourceMovementId: id });
  }
  return { activities: stripped, movements: [...movements.values()] };
}

/** `CreateSessionInput` explicite : Mouvements dérivés de la vue des occurrences. */
export async function withOccurrenceMovements(database: Database, input: ViewedCreateSessionInput): Promise<CreateSessionInput> {
  const derived = await deriveMovements(database, input.exercises);
  return { ...input, exercises: derived.activities, movements: [...(input.movements ?? []), ...derived.movements] };
}

/** `UpdateSessionInput` explicite : comme `withOccurrenceMovements`. */
export async function withUpdatedOccurrenceMovements(
  database: Database,
  input: ViewedUpdateSessionInput,
): Promise<UpdateSessionInput> {
  const derived = await deriveMovements(database, input.activities);
  return {
    ...input,
    activities: derived.activities as UpdateSessionActivityInput[],
    movements: [...(input.movements ?? []), ...derived.movements],
  };
}

/**
 * `SqliteSessionRepository` dont `create`/`update` acceptent la vue des
 * occurrences (`withOccurrenceMovements`) ; une entrée sans vue est transmise
 * telle quelle. Lecture inchangée.
 */
export class ViewedSessionRepository extends SqliteSessionRepository {
  constructor(
    private readonly viewDatabase: Database,
    uuidFactory?: () => string,
    now?: () => string,
  ) {
    super(viewDatabase, uuidFactory, now);
  }

  override async create(input: ViewedCreateSessionInput): Promise<Awaited<ReturnType<SqliteSessionRepository["create"]>>> {
    return super.create(await withOccurrenceMovements(this.viewDatabase, input));
  }

  override async update(
    sessionId: string,
    input: ViewedUpdateSessionInput,
  ): Promise<Awaited<ReturnType<SqliteSessionRepository["update"]>>> {
    return super.update(sessionId, await withUpdatedOccurrenceMovements(this.viewDatabase, input));
  }
}
