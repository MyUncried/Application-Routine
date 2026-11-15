/**
 * Acteurs éditables dans l'administration (logique pure, sans DOM — testée par actors.test.mjs).
 *
 * Décision de Hermann du 12/11/2026 sur l'identité des acteurs (recopiée dans la spec du lot) :
 * « Un acteur n'a de valeur que s'il est une identité stable, unique et traçable. Aucun texte libre. »
 * Le menu ne propose que « Inconnu (null) » et « Utilisateur local » ; « Personne », « Organisation »
 * et « Plateforme » reviendront avec les comptes. « Utilisateur local » = l'identité générée de cette
 * installation PC, affichée « PC Administrateur », jamais saisie.
 *
 * Concerne : en-tête d'une Bibliothèque (« Éditeur (composition) », « Propriétaire ») et section
 * « Provenance » d'une fiche (« Propriétaire », « Auteur (unique) », « Diffuseur », « Ayant droit »).
 * Une valeur déjà enregistrée hors de ces deux choix (autre type d'acteur, identifiant saisi à la main,
 * autre installation) reste lisible et inchangée tant que l'utilisateur ne choisit pas une option ;
 * elle est signalée.
 */

export const ACTOR_MENU = [["", "Inconnu (null)"], ["LOCAL_USER", "Utilisateur local"]];
export const KEPT = "KEPT";

const KIND_LABELS = { LOCAL_USER: "Utilisateur local", PERSON: "Personne", ORGANIZATION: "Organisation", PLATFORM: "Plateforme" };
const GENERATED_ID = /^pc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Acteur produit par un choix du menu : `null` ou l'identité de cette installation. */
export function actorFor(choice, installation) {
  if (choice === "LOCAL_USER") {
    if (!installation?.id) throw new Error("INSTALLATION_IDENTITY_UNAVAILABLE");
    return { kind: "LOCAL_USER", id: installation.id };
  }
  return null;
}

/**
 * Lecture d'une valeur enregistrée.
 * @returns {{ choice: "" | "LOCAL_USER" | "KEPT", label: string | null, id: string | null, warning: string | null }}
 */
export function describeActor(actor, installation) {
  if (actor === null || actor === undefined) return { choice: "", label: null, id: null, warning: null };
  if (actor.kind === "LOCAL_USER" && installation?.id && actor.id === installation.id) {
    return { choice: "LOCAL_USER", label: installation.displayName, id: actor.id, warning: null };
  }
  const kind = KIND_LABELS[actor.kind] ?? actor.kind;
  if (actor.kind === "LOCAL_USER") {
    const warning = GENERATED_ID.test(actor.id)
      ? "Utilisateur local d'une autre installation PC. Valeur conservée ; choisis « Utilisateur local » pour l'attribuer à ce PC."
      : "Identifiant saisi à la main, non conforme (aucun texte libre, décision du 12/11/2026). Valeur conservée telle quelle ; choisis « Utilisateur local » ou « Inconnu (null) » pour la remplacer.";
    return { choice: KEPT, label: kind + " : " + actor.id, id: actor.id, warning };
  }
  return {
    choice: KEPT, label: kind + " : " + actor.id, id: actor.id,
    warning: "Type d'acteur non modifiable dans le MVP (il reviendra avec les comptes). Valeur conservée ; choisir une option la remplace.",
  };
}
