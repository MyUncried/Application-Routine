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
  /**
   * Valeur historique du modèle du 06/11, conservée pour relire d'anciennes données.
   * **Interdite pour toute fiche importée ou diffusée** (A-2 du 11/11/2026 : aucune copie, dérivation
   * ni modification d'une fiche importée) : le format catalogue v2 la refuse.
   */
  | "LOCAL_DERIVED";

export type MovementUpstream = {
  readonly catalogueId: string;
  readonly sheetId: string;
  /** Révision exacte ayant servi à la copie / installation. */
  readonly revision: string;
};

/** Visibilité d'une Bibliothèque (personnelle, partagée, publique) ; la fiche n'en porte plus (MOUV-ADM n° 17). */
export type EditorialVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

/**
 * Licence de la fiche (MOUV-ADM n° 15, 17/11/2026) : `null` = « Non renseignée » ; sinon « Licence ou
 * conditions connues », avec un nom (et un lien facultatif) ou un texte. Aucune liste prédéfinie ;
 * porte sur le texte de la fiche (les médias gardent leurs droits) ; ne change aucune permission.
 */
export type MovementLicense = {
  readonly name: string | null;
  readonly url: string | null;
  readonly text: string | null;
};

export type MovementEditorialProvenance = {
  /** Identité de la fiche, indépendante du Movement.id local et de son nom. */
  readonly sheetId: string;
  /** Mapping optionnel ; absent du catalogue Git, fixé à l'import local. */
  readonly localMovementId: string | null;
  readonly origin: MovementEditorialOrigin;
  /** Null uniquement pour une création originale non dérivée. */
  readonly upstream: MovementUpstream | null;
  /**
   * Responsable administratif de la fiche, pas preuve de titularité juridique.
   * `null` = propriétaire **inconnu**, déclaré explicitement (décision du 10/11/2026) :
   * aucune identité fictive n'est attribuée ; jamais publiable.
   */
  readonly owner: EditorialActorRef | null;
  /**
   * Auteur unique de la fiche (MOUV-D1, BIB-02 ; 11/11/2026) ; `null` = inconnu, sans auteur fictif.
   * Distinct de l'auteur d'une révision (`history[].author`) et du propriétaire.
   */
  readonly author: EditorialActorRef | null;
  /** Ayant droit tiers ; `null` = le propriétaire (MOUV-ADM n° 14). */
  readonly rightsHolder: EditorialActorRef | null;
  /** Licence déclarée, non vérifiée par ce validateur ; `null` = non renseignée. */
  readonly license: MovementLicense | null;
  readonly revision: string;
  /*
   * [Retirés le 18/11/2026, MOUV-ADM-20261117 : `gestureId` (n° 10), `publisher` (n° 13),
   * `reviewStatus` (n° 16), `visibility` de la fiche (n° 17).]
   */
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

function present(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

const isHttpUrl = (value: string): boolean => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Licence connue : un nom (lien facultatif, http ou https) ou un texte, pas les deux ; `null` admis.
 * Retourne le code d'écart, `null` si la valeur est conforme.
 */
export function movementLicenseProblem(license: unknown): MovementEditorialIssue["code"] | null {
  if (license === null) return null;
  if (typeof license !== "object" || license === undefined || Array.isArray(license)) return "REQUIRED";
  const { name, url, text } = license as Record<string, unknown>;
  const keys = Object.keys(license);
  if (!keys.every((key) => key === "name" || key === "url" || key === "text")) return "UNRECOGNIZED";
  for (const value of [name, url, text]) if (value !== null && typeof value !== "string") return "UNRECOGNIZED";
  const named = present(name);
  const written = present(text);
  if (named === written) return "INCONSISTENT";
  if (!named && url !== null) return "INCONSISTENT";
  if (url !== null && !isHttpUrl(url as string)) return "UNRECOGNIZED";
  if ((name !== null && !named) || (text !== null && !written)) return "INCONSISTENT";
  return null;
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
  if (record.localMovementId !== null && !present(record.localMovementId)) {
    issues.push({ field: "localMovementId", code: "REQUIRED" });
  }
  if (!ORIGINS.includes(record.origin)) issues.push({ field: "origin", code: "UNRECOGNIZED" });
  if (!present(record.revision)) issues.push({ field: "revision", code: "REQUIRED" });
  const licenseProblem = movementLicenseProblem(record.license);
  if (licenseProblem !== null) issues.push({ field: "license", code: licenseProblem });
  if (record.owner === undefined) {
    // Le champ doit être déclaré : `null` (inconnu) n'est pas une omission.
    issues.push({ field: "owner", code: "REQUIRED" });
  } else if (record.owner !== null) {
    validateActor(record.owner, "owner", issues, true);
  }
  if (record.rightsHolder === undefined) issues.push({ field: "rightsHolder", code: "REQUIRED" });
  else validateActor(record.rightsHolder, "rightsHolder", issues, false);
  if (record.rightsHolder !== null && record.owner !== null && record.rightsHolder !== undefined && record.owner !== undefined &&
      record.rightsHolder.kind === record.owner.kind && record.rightsHolder.id === record.owner.id) {
    // Ayant droit = propriétaire : `null` (aucune double saisie).
    issues.push({ field: "rightsHolder", code: "INCONSISTENT" });
  }

  if (record.author === undefined) issues.push({ field: "author", code: "REQUIRED" });
  else validateActor(record.author, "author", issues, false);

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
