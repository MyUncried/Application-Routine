/**
 * Métadonnées éditoriales de fiches de Mouvements (6 novembre 2026).
 *
 * Ce modèle appartient au futur catalogue de référence, PAS au plan d'exécution.
 * Il n'étend pas Movement.ts, ne change aucune API du moteur et ne transfère
 * aucun droit de propriété intellectuelle par simple déclaration.
 *
 * Une fiche éditoriale est identifiée indépendamment du Movement local :
 * plusieurs fiches peuvent documenter un même geste, même avec le même titre.
 */
export type EditorialActorKind = "LOCAL_USER" | "PERSON" | "ORGANIZATION" | "PLATFORM";

export type EditorialActorRef = {
  readonly kind: EditorialActorKind;
  /** Identifiant stable, pas le nom affiché d'une personne/organisation. */
  readonly id: string;
};

export type MovementEditorialOrigin =
  | "LOCAL_CREATED"
  | "CATALOGUE_INSTALLED"
  | "SHARED_IMPORTED"
  | "EXTERNAL_IMPORTED"
  | "LOCAL_DERIVED";

export type MovementUpstream = {
  readonly catalogueId: string;
  readonly sheetId: string;
  /** Révision exacte ayant servi à la copie / installation. */
  readonly revision: string;
};

export type EditorialReviewStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "RETIRED";
export type EditorialVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

export type MovementEditorialProvenance = {
  /** Identité de la fiche, indépendante du Movement.id local et de son nom. */
  readonly sheetId: string;
  /** Regroupement de fiches du même geste ; PAS un groupe de niveaux KODJO. */
  readonly gestureId: string | null;
  /** Mapping optionnel ; absent du catalogue Git, fixé à l'import local. */
  readonly localMovementId: string | null;
  readonly origin: MovementEditorialOrigin;
  /** Null uniquement pour une création originale non dérivée. */
  readonly upstream: MovementUpstream | null;
  /**
   * Responsable administratif de la fiche, pas preuve de titularité juridique.
   * `null` = propriétaire **inconnu**, déclaré explicitement (décision du 10/11/2026) :
   * aucune identité fictive n'est attribuée. Admis pour une fiche privée ; toute
   * diffusion (`visibility` autre que PRIVATE) exige un propriétaire identifié.
   */
  readonly owner: EditorialActorRef | null;
  /** Auteurs connus, [] = non renseigné ; aucune attribution implicite. */
  readonly authors: readonly EditorialActorRef[];
  /** Diffuseur éventuel, distinct de l'auteur et du propriétaire. */
  readonly publisher: EditorialActorRef | null;
  /** Ayant droit déclaré, éventuellement inconnu. */
  readonly rightsHolder: EditorialActorRef | null;
  /** Licence déclarée, non vérifiée par ce validateur. */
  readonly license: string | null;
  readonly revision: string;
  readonly reviewStatus: EditorialReviewStatus;
  /** Indication seulement ; aucune action réseau ou autorisation implicite. */
  readonly visibility: EditorialVisibility;
};

/** Propriétaire inconnu déclaré (aucune identité fictive) : bloque toute publication. */
export function hasUnknownOwner(record: Pick<MovementEditorialProvenance, "owner">): boolean {
  return record.owner === null;
}

export type MovementEditorialIssue = {
  readonly field: string;
  readonly code: "REQUIRED" | "UNRECOGNIZED" | "DUPLICATE" | "INCONSISTENT";
};

const ORIGINS: readonly MovementEditorialOrigin[] = [
  "LOCAL_CREATED",
  "CATALOGUE_INSTALLED",
  "SHARED_IMPORTED",
  "EXTERNAL_IMPORTED",
  "LOCAL_DERIVED",
];
const ACTOR_KINDS: readonly EditorialActorKind[] = [
  "LOCAL_USER",
  "PERSON",
  "ORGANIZATION",
  "PLATFORM",
];
const REVIEW_STATUSES: readonly EditorialReviewStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "RETIRED",
];
const VISIBILITIES: readonly EditorialVisibility[] = ["PRIVATE", "UNLISTED", "PUBLIC"];

function present(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function actorKey(actor: EditorialActorRef): string {
  return actor.kind + ":" + actor.id;
}

function validateActor(
  value: EditorialActorRef | null,
  field: string,
  issues: MovementEditorialIssue[],
  required: boolean,
): void {
  if (value === null) {
    if (required) issues.push({ field, code: "REQUIRED" });
    return;
  }
  if (typeof value !== "object" || !ACTOR_KINDS.includes(value.kind)) {
    issues.push({ field, code: "UNRECOGNIZED" });
    return;
  }
  if (!present(value.id)) issues.push({ field: field + ".id", code: "REQUIRED" });
}

/**
 * Vérification structurelle uniquement. Ne remplace ni validation clinique,
 * ni vérification de la licence, ni permission d'un service de publication.
 */
export function validateMovementEditorialProvenance(
  record: MovementEditorialProvenance,
): readonly MovementEditorialIssue[] {
  const issues: MovementEditorialIssue[] = [];
  if (!present(record.sheetId)) issues.push({ field: "sheetId", code: "REQUIRED" });
  if (record.gestureId !== null && !present(record.gestureId)) {
    issues.push({ field: "gestureId", code: "REQUIRED" });
  }
  if (record.localMovementId !== null && !present(record.localMovementId)) {
    issues.push({ field: "localMovementId", code: "REQUIRED" });
  }
  if (!ORIGINS.includes(record.origin)) issues.push({ field: "origin", code: "UNRECOGNIZED" });
  if (!present(record.revision)) issues.push({ field: "revision", code: "REQUIRED" });
  if (!REVIEW_STATUSES.includes(record.reviewStatus)) {
    issues.push({ field: "reviewStatus", code: "UNRECOGNIZED" });
  }
  if (!VISIBILITIES.includes(record.visibility)) {
    issues.push({ field: "visibility", code: "UNRECOGNIZED" });
  }
  if (record.license !== null && !present(record.license)) {
    issues.push({ field: "license", code: "REQUIRED" });
  }
  if (record.owner === undefined) {
    // Le champ doit être déclaré : `null` (inconnu) n'est pas une omission.
    issues.push({ field: "owner", code: "REQUIRED" });
  } else if (record.owner === null) {
    if (record.visibility !== "PRIVATE") issues.push({ field: "owner", code: "INCONSISTENT" });
  } else {
    validateActor(record.owner, "owner", issues, true);
  }
  validateActor(record.publisher, "publisher", issues, false);
  validateActor(record.rightsHolder, "rightsHolder", issues, false);

  if (!Array.isArray(record.authors)) {
    issues.push({ field: "authors", code: "UNRECOGNIZED" });
  } else {
    const authors = new Set<string>();
    record.authors.forEach((author, i) => {
      validateActor(author, "authors[" + i + "]", issues, true);
      if (
        author !== null &&
        typeof author === "object" &&
        ACTOR_KINDS.includes(author.kind) &&
        present(author.id)
      ) {
        const key = actorKey(author);
        if (authors.has(key)) issues.push({ field: "authors", code: "DUPLICATE" });
        authors.add(key);
      }
    });
  }

  if (record.origin === "LOCAL_CREATED") {
    if (record.upstream !== null) {
      issues.push({ field: "upstream", code: "INCONSISTENT" });
    }
  } else {
    if (record.upstream === null || typeof record.upstream !== "object") {
      issues.push({ field: "upstream", code: "REQUIRED" });
    } else {
      if (!present(record.upstream.catalogueId)) {
        issues.push({ field: "upstream.catalogueId", code: "REQUIRED" });
      }
      if (!present(record.upstream.sheetId)) {
        issues.push({ field: "upstream.sheetId", code: "REQUIRED" });
      }
      if (!present(record.upstream.revision)) {
        issues.push({ field: "upstream.revision", code: "REQUIRED" });
      }
    }
  }
  return issues;
}
