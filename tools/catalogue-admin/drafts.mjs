/**
 * Catalogue KODJO — brouillons d'administration locaux, jamais publiables.
 * Modèle indépendant de Movement/SQLite et du moteur d'exécution.
 */
export const AXES = ["specialties", "gesturalFamilies", "clinicalProblems", "anatomicalTargets"];
export const ACTOR_KINDS = ["LOCAL_USER", "PERSON", "ORGANIZATION", "PLATFORM"];

export function emptyDrafts() {
  return {
    schemaVersion: "0.1.0",
    kind: "KODJO_ADMIN_DRAFTS",
    publicationAllowed: false,
    movementEdits: {},
    referenceAdditions: Object.fromEntries(AXES.map((axis) => [axis, []])),
    referenceLabels: Object.fromEntries(AXES.map((axis) => [axis, {}])),
    glossary: [],
  };
}

const filled = (v) => typeof v === "string" && v.trim().length > 0;
const distinct = (items) => new Set(items).size === items.length;
const actorValid = (a) => a === null || (
  a && typeof a === "object" && !Array.isArray(a) &&
  ACTOR_KINDS.includes(a.kind) && filled(a.id) && a.id.length <= 128
);
const clinicalKinds = ["DIAGNOSIS", "SYMPTOM", "FUNCTIONAL_DEFICIT"];
const anatomicalKinds = ["MUSCLE", "MUSCLE_GROUP", "JOINT", "ANATOMICAL_STRUCTURE"];

export function canonicalTerm(value) {
  return value.trim().toLocaleLowerCase("fr")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Retourne des diagnostics structuraux. Une fiche ainsi validée reste un BROUILLON
 * éditorial : ni approbation clinique, ni droit de distribution implicite.
 */
export function validateAdminDrafts(drafts, { pilot, taxonomy, categories, zones }) {
  const errors = [];
  const err = (at, reason) => errors.push(at + ": " + reason);
  if (!drafts || typeof drafts !== "object" || Array.isArray(drafts)) return ["Invalid document"];
  if (drafts.kind !== "KODJO_ADMIN_DRAFTS" || drafts.schemaVersion !== "0.1.0") err("header", "unsupported schema");
  if (drafts.publicationAllowed !== false) err("publicationAllowed", "must remain false");

  const knownMovements = new Set(pilot.records.map((r) => r.candidateId));
  const categoryIds = new Set(categories.map((r) => r.id));
  const zoneIds = new Set(zones.map((r) => r.id));
  const available = {};
  const additions = drafts.referenceAdditions;
  const labels = drafts.referenceLabels;
  if (!additions || !labels || typeof additions !== "object" || typeof labels !== "object") {
    return [...errors, "reference sets: missing"];
  }
  for (const axis of AXES) {
    const base = taxonomy.proposedAxes[axis].values;
    const extra = additions[axis];
    const renamed = labels[axis];
    if (!Array.isArray(extra) || !renamed || typeof renamed !== "object" || Array.isArray(renamed)) {
      err(axis, "invalid reference collection");
      continue;
    }
    const baseIds = new Set(base.map((r) => r.id));
    const ids = new Set(baseIds);
    const referenceTerms = base.map((r) => canonicalTerm(renamed[r.id] ?? r.label));
    const terms = new Set(referenceTerms);
    if (terms.size !== referenceTerms.length) err(axis, "duplicate base reference label after renaming");
    for (const [id, title] of Object.entries(renamed)) {
      if (!baseIds.has(id)) err(axis + "." + id, "renaming an unknown base value");
      if (!filled(title) || title.length > 100) err(axis + "." + id, "invalid label");
    }
    for (const [i, item] of extra.entries()) {
      const at = axis + ".added[" + i + "]";
      if (!item || typeof item !== "object" || !/^[a-z][a-z0-9-]{1,63}$/.test(item.id ?? "")) {
        err(at, "invalid stable id");
        continue;
      }
      if (ids.has(item.id)) err(at, "duplicate reference id");
      ids.add(item.id);
      if (!filled(item.label) || item.label.length > 100) err(at, "invalid label");
      else {
        const key = canonicalTerm(item.label);
        if (terms.has(key)) err(at, "duplicate reference label");
        terms.add(key);
      }
      if (item.status !== "PROPOSED") err(at, "status must be PROPOSED");
      if (axis === "clinicalProblems" &&
        (!clinicalKinds.includes(item.kind) || item.requiresClinicalValidation !== true)) err(at, "invalid clinical kind");
      if (axis === "anatomicalTargets" && !anatomicalKinds.includes(item.kind)) err(at, "invalid anatomical kind");
    }
    available[axis] = ids;
  }

  if (!drafts.movementEdits || typeof drafts.movementEdits !== "object" ||
      Array.isArray(drafts.movementEdits)) return [...errors, "movementEdits: invalid"];
  const fields = ["specialtyIds", "gesturalFamilyIds", "clinicalProblemIds", "anatomicalTargetIds"];
  for (const [id, entry] of Object.entries(drafts.movementEdits)) {
    const at = "movementEdits." + id;
    if (!knownMovements.has(id)) { err(at, "unknown candidate"); continue; }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) { err(at, "invalid entry"); continue; }
    if (!filled(entry.name) || entry.name.length > 80) err(at + ".name", "invalid name");
    if (!Array.isArray(entry.steps) || entry.steps.length < 1 || entry.steps.length > 20 ||
        entry.steps.some((s) => !filled(s) || [...s].length > 65) ||
        entry.steps.join("\n").length > 1000) err(at + ".steps", "invalid steps");
    if (!Array.isArray(entry.aliases) ||
        entry.aliases.some((s) => !filled(s) || s.length > 80) ||
        !distinct((entry.aliases ?? []).map((s) => typeof s === "string" ? canonicalTerm(s) : s))) {
      err(at + ".aliases", "invalid aliases");
    }
    if (entry.categoryId !== null && !categoryIds.has(entry.categoryId)) err(at + ".categoryId", "unknown category");
    if (!Array.isArray(entry.bodyZoneIds) ||
        entry.bodyZoneIds.some((z) => !zoneIds.has(z)) ||
        !distinct(entry.bodyZoneIds ?? [])) err(at + ".bodyZoneIds", "invalid zones");
    for (const [field, axis] of fields.map((f, i) => [f, AXES[i]])) {
      const values = entry[field];
      if (!Array.isArray(values) || !distinct(values) || values.some((v) => !available[axis]?.has(v))) {
        err(at + "." + field, "unknown or duplicate reference");
      }
    }
    if (!actorValid(entry.owner)) err(at + ".owner", "invalid owner");
    if (!Array.isArray(entry.authors) || entry.authors.some((a) => !actorValid(a) || a === null) ||
        !distinct((entry.authors ?? []).map((a) => a?.kind + ":" + a?.id))) err(at + ".authors", "invalid authors");
    if (typeof entry.notes !== "string" || entry.notes.length > 2000) err(at + ".notes", "invalid notes");
    if (entry.editorialStatus !== "DRAFT") err(at + ".editorialStatus", "only DRAFT allowed");
  }

  if (!Array.isArray(drafts.glossary)) return [...errors, "glossary: invalid"];
  const ids = new Set(), terms = new Set();
  for (const [i, item] of drafts.glossary.entries()) {
    const at = "glossary[" + i + "]";
    if (!item || typeof item !== "object") { err(at, "invalid entry"); continue; }
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(item.id ?? "") || ids.has(item.id)) err(at + ".id", "invalid or duplicate id");
    ids.add(item.id);
    if (!filled(item.term) || item.term.length > 100) err(at + ".term", "invalid term");
    else {
      const key = canonicalTerm(item.term);
      if (terms.has(key)) err(at + ".term", "duplicate term");
      terms.add(key);
    }
    if (!filled(item.definition) || item.definition.length > 1000) err(at + ".definition", "invalid definition");
    if (!Array.isArray(item.synonyms) || item.synonyms.some((s) => !filled(s) || s.length > 100) ||
        !distinct((item.synonyms ?? []).map((s) => typeof s === "string" ? canonicalTerm(s) : s))) {
      err(at + ".synonyms", "invalid synonyms");
    }
    if (!Array.isArray(item.relatedCandidateIds) || !distinct(item.relatedCandidateIds) ||
        item.relatedCandidateIds.some((id) => !knownMovements.has(id))) err(at + ".relatedCandidateIds", "invalid movement references");
  }
  return errors;
}

/** Prépare le brouillon initial d'un candidat ; aucune classification proposée n'est approuvée. */
export function initialMovementDraft(candidate) {
  return {
    name: candidate.name,
    steps: [...candidate.description.steps],
    aliases: [],
    categoryId: null,
    bodyZoneIds: [],
    specialtyIds: [],
    gesturalFamilyIds: [],
    clinicalProblemIds: [],
    anatomicalTargetIds: [],
    owner: null,
    authors: [],
    notes: "",
    editorialStatus: "DRAFT",
  };
}
