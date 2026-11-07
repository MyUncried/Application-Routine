/* Interface locale KODJO : aucun contenu non fiable n'est injecté en HTML. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const AXES = ["specialties", "gesturalFamilies", "clinicalProblems", "anatomicalTargets"];
const TITLES = {
  specialties: "Spécialités", gesturalFamilies: "Familles gestuelles",
  clinicalProblems: "Problèmes traités", anatomicalTargets: "Cibles anatomiques",
};
let source = null;
let draft = null;
let revision = "";
let selectedId = null;
let glossaryId = null;

function clone(value) { return structuredClone(value); }
function notify(message, error = false) {
  const el = $("#alert");
  el.textContent = message;
  el.classList.toggle("error", error);
}
function optionsFor(axis) {
  const originals = source.taxonomy.proposedAxes[axis].values;
  return [...originals.map((item) => ({
    ...item, label: draft.referenceLabels[axis]?.[item.id] ?? item.label, original: true,
  })), ...draft.referenceAdditions[axis].map((item) => ({ ...item, original: false }))];
}
function selectedValues(selector) {
  return $$(selector + " input:checked").map((input) => input.value);
}
function fillChecks(parent, entries, selected = []) {
  parent.replaceChildren();
  for (const item of entries) {
    const label = document.createElement("label");
    label.className = "chip-option";
    const check = document.createElement("input");
    check.type = "checkbox"; check.value = item.id; check.checked = selected.includes(item.id);
    const span = document.createElement("span");
    span.textContent = item.label;
    label.append(check, span);
    parent.append(label);
  }
}
function defaultMovement(candidate) {
  return {
    name: candidate.name, steps: [...candidate.description.steps], aliases: [],
    categoryId: null, bodyZoneIds: [], specialtyIds: [], gesturalFamilyIds: [],
    clinicalProblemIds: [], anatomicalTargetIds: [],
    owner: null, authors: [], notes: "", editorialStatus: "DRAFT",
  };
}
function renderMovementList() {
  const term = $("#search").value.trim().toLocaleLowerCase("fr");
  const filtered = source.pilot.records.filter((item) => {
    const saved = draft.movementEdits[item.candidateId];
    const haystack = [item.name, item.originalId, saved?.name, ...(saved?.aliases ?? [])]
      .filter(Boolean).join(" ").toLocaleLowerCase("fr");
    return haystack.includes(term);
  });
  $("#movement-total").textContent = String(filtered.length) + " / " + source.pilot.records.length;
  const list = $("#movement-list");
  list.replaceChildren();
  for (const item of filtered) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "movement-item" + (selectedId === item.candidateId ? " selected" : "");
    b.setAttribute("role", "option");
    b.setAttribute("aria-selected", String(selectedId === item.candidateId));
    const name = document.createElement("strong");
    name.textContent = draft.movementEdits[item.candidateId]?.name ?? item.name;
    const id = document.createElement("small"); id.textContent = item.originalId;
    b.append(name, id);
    if (draft.movementEdits[item.candidateId]) {
      const indicator = document.createElement("span"); indicator.className = "edited";
      indicator.textContent = "Brouillon"; b.append(indicator);
    }
    b.addEventListener("click", () => selectMovement(item.candidateId));
    list.append(b);
  }
}
function selectMovement(id) {
  const candidate = source.pilot.records.find((item) => item.candidateId === id);
  if (!candidate) return;
  selectedId = id;
  const edit = draft.movementEdits[id] ?? defaultMovement(candidate);
  const form = $("#movement-form");
  form.elements.name.value = edit.name;
  form.elements.steps.value = edit.steps.join("\n");
  form.elements.aliases.value = edit.aliases.join("\n");
  const select = form.elements.categoryId;
  select.replaceChildren(new Option("Non attribuée", ""));
  for (const entry of source.categories) select.add(new Option(entry.label, entry.id));
  select.value = edit.categoryId ?? "";
  fillChecks($("#zones .options"), source.zones, edit.bodyZoneIds);
  for (const axis of AXES) {
    const field = $('[data-axis="' + axis + '"] .options', form);
    fillChecks(field, optionsFor(axis), edit[{
      specialties: "specialtyIds", gesturalFamilies: "gesturalFamilyIds",
      clinicalProblems: "clinicalProblemIds", anatomicalTargets: "anatomicalTargetIds",
    }[axis]]);
  }
  form.elements.ownerKind.value = edit.owner?.kind ?? "";
  form.elements.ownerId.value = edit.owner?.id ?? "";
  form.elements.authors.value = edit.authors.map((a) => a.kind + ":" + a.id).join("\n");
  form.elements.notes.value = edit.notes;
  $("#movement-title").textContent = edit.name;
  $("#movement-id").textContent = id;
  $("#source-data").textContent = JSON.stringify({
    nomOriginal: candidate.name,
    classificationOriginale: candidate.originalClassification,
    source: candidate.evidence,
    verification: candidate.validation,
  }, null, 2);
  form.classList.remove("hidden");
  renderMovementList();
}
function parseLines(value) {
  return value.split(/\r?\n/).map((text) => text.trim()).filter(Boolean);
}
function captureMovement() {
  if (!selectedId) return false;
  const form = $("#movement-form");
  const ownerKind = form.elements.ownerKind.value.trim();
  const ownerId = form.elements.ownerId.value.trim();
  if ((ownerKind && !ownerId) || (!ownerKind && ownerId)) {
    notify("Propriétaire : renseignez à la fois son type et son identifiant.", true); return false;
  }
  const authors = [];
  for (const line of parseLines(form.elements.authors.value)) {
    const i = line.indexOf(":");
    if (i < 1 || i === line.length - 1) {
      notify("Auteur : utilisez une ligne TYPE:identifiant.", true); return false;
    }
    authors.push({ kind: line.slice(0, i), id: line.slice(i + 1) });
  }
  const obj = {
    name: form.elements.name.value.trim(),
    steps: parseLines(form.elements.steps.value),
    aliases: parseLines(form.elements.aliases.value),
    categoryId: form.elements.categoryId.value || null,
    bodyZoneIds: selectedValues("#zones .options"),
    specialtyIds: selectedValues('[data-axis="specialties"] .options'),
    gesturalFamilyIds: selectedValues('[data-axis="gesturalFamilies"] .options'),
    clinicalProblemIds: selectedValues('[data-axis="clinicalProblems"] .options'),
    anatomicalTargetIds: selectedValues('[data-axis="anatomicalTargets"] .options'),
    owner: ownerKind ? { kind: ownerKind, id: ownerId } : null,
    authors, notes: form.elements.notes.value.trim(), editorialStatus: "DRAFT",
  };
  if (!obj.name || obj.steps.length === 0) {
    notify("Le nom et au moins une étape sont nécessaires.", true); return false;
  }
  if (obj.steps.some((s) => [...s].length > 65)) {
    notify("Chaque étape doit compter 65 caractères maximum.", true); return false;
  }
  draft.movementEdits[selectedId] = obj;
  notify("Fiche conservée dans le brouillon local. Cliquez Enregistrer pour écrire le fichier.");
  renderMovementList();
  return true;
}
function renderReferences() {
  const axis = $("#ref-axis").value;
  const list = $("#reference-list");
  list.replaceChildren();
  for (const item of optionsFor(axis)) {
    const row = document.createElement("div");
    row.className = "reference-row";
    const id = document.createElement("code"); id.textContent = item.id;
    const label = document.createElement("input"); label.value = item.label;
    label.maxLength = 100; label.setAttribute("aria-label", "Libellé de " + item.id);
    const save = document.createElement("button"); save.type = "button"; save.textContent = "Modifier";
    save.addEventListener("click", () => {
      const value = label.value.trim();
      if (!value) return notify("Le libellé ne peut pas être vide.", true);
      if (item.original) draft.referenceLabels[axis][item.id] = value;
      else {
        const target = draft.referenceAdditions[axis].find((v) => v.id === item.id);
        target.label = value;
      }
      notify("Libellé conservé comme proposition ; enregistrez les brouillons.");
      renderReferences();
    });
    row.append(id, label, save);
    if (!item.original) {
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "subtle"; remove.textContent = "Retirer";
      remove.addEventListener("click", () => {
        if (!confirm("Retirer cette nouvelle valeur proposée ?")) return;
        draft.referenceAdditions[axis] = draft.referenceAdditions[axis].filter((x) => x.id !== item.id);
        notify("Valeur retirée du brouillon. Contrôlez les associations des fiches.");
        renderReferences();
      });
      row.append(remove);
    }
    list.append(row);
  }
  const kinds = $("#ref-kind");
  const kindRow = $("#ref-kind-row");
  kinds.replaceChildren();
  if (axis === "clinicalProblems" || axis === "anatomicalTargets") {
    const options = axis === "clinicalProblems" ?
      ["DIAGNOSIS", "SYMPTOM", "FUNCTIONAL_DEFICIT"] :
      ["MUSCLE", "MUSCLE_GROUP", "JOINT", "ANATOMICAL_STRUCTURE"];
    for (const kind of options) kinds.add(new Option(kind, kind));
    kindRow.classList.remove("hidden");
  } else kindRow.classList.add("hidden");
  const existing = $("#kodjo-existing");
  existing.replaceChildren();
  for (const [heading, values] of [["Catégories KODJO", source.categories], ["Zones KODJO", source.zones]]) {
    const h = document.createElement("h3"); h.textContent = heading; existing.append(h);
    const p = document.createElement("p");
    p.textContent = values.map((v) => v.label + " (" + v.id + ")").join(" · ");
    existing.append(p);
  }
}
function renderGlossary() {
  const list = $("#glossary-list"); list.replaceChildren();
  if (!draft.glossary.length) {
    const p = document.createElement("p"); p.textContent = "Aucun terme ajouté pour le moment.";
    list.append(p);
  }
  for (const entry of draft.glossary) {
    const row = document.createElement("div"); row.className = "glossary-row";
    const title = document.createElement("strong"); title.textContent = entry.term;
    const description = document.createElement("small"); description.textContent = entry.definition;
    const edit = document.createElement("button"); edit.textContent = "Modifier";
    edit.addEventListener("click", () => selectGlossary(entry.id));
    const remove = document.createElement("button"); remove.textContent = "Retirer";
    remove.className = "subtle";
    remove.addEventListener("click", () => {
      if (!confirm("Retirer ce terme du brouillon ?")) return;
      draft.glossary = draft.glossary.filter((v) => v.id !== entry.id);
      glossaryId = null; resetGlossary(); renderGlossary();
    });
    row.append(title, description, edit, remove); list.append(row);
  }
}
function selectGlossary(id) {
  const entry = draft.glossary.find((x) => x.id === id);
  if (!entry) return;
  glossaryId = id;
  const form = $("#glossary-form");
  form.elements.id.value = entry.id;
  form.elements.id.readOnly = true;
  form.elements.term.value = entry.term;
  form.elements.definition.value = entry.definition;
  form.elements.synonyms.value = entry.synonyms.join("\n");
  form.elements.relatedCandidateIds.value = entry.relatedCandidateIds.join("\n");
  $("#glossary-form-title").textContent = "Modifier un terme";
}
function resetGlossary() {
  glossaryId = null;
  const form = $("#glossary-form"); form.reset();
  form.elements.id.readOnly = false;
  $("#glossary-form-title").textContent = "Créer une définition";
}
function switchTab(tab) {
  $$(".tabs button").forEach((button) => {
    if (button.dataset.tab === tab) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  for (const section of $$(".workspace")) section.classList.toggle("hidden", section.id !== tab);
  if (tab === "references") renderReferences();
  if (tab === "glossary") renderGlossary();
}
async function saveDrafts() {
  if (selectedId && !captureMovement()) return;
  notify("Enregistrement…");
  try {
    const response = await fetch("/api/drafts", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision, drafts: draft }),
    });
    const result = await response.json();
    if (!response.ok) {
      const msg = [result.error, ...(result.details ?? []).slice(0, 8)].filter(Boolean).join(" · ");
      return notify(msg || "Échec de validation", true);
    }
    revision = result.revision;
    notify("Brouillons enregistrés localement. Aucun contenu publié.");
  } catch (error) { notify("Impossible d'enregistrer : " + error.message, true); }
}
async function start() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) throw Error("HTTP " + response.status);
    source = await response.json();
    draft = clone(source.drafts);
    revision = source.revision;
    renderMovementList();
    if (source.pilot.records.length) selectMovement(source.pilot.records[0].candidateId);
    notify(source.pilot.records.length + " fiches pilotes disponibles. Brouillons de classification non publiables.");
  } catch (error) { notify("Chargement impossible : " + error.message, true); }
}
$$(".tabs button").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
$("#search").addEventListener("input", renderMovementList);
$("#movement-form").addEventListener("submit", (event) => { event.preventDefault(); captureMovement(); });
$("#reset-movement").addEventListener("click", () => {
  if (!selectedId || !confirm("Effacer les modifications de cette fiche dans le brouillon ?")) return;
  delete draft.movementEdits[selectedId]; selectMovement(selectedId);
  notify("Fiche revenue à sa transcription d'origine, dans le brouillon.");
});
$("#ref-axis").addEventListener("change", renderReferences);
$("#new-reference").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget, axis = $("#ref-axis").value;
  const id = form.elements.id.value.trim(), label = form.elements.label.value.trim();
  if (optionsFor(axis).some((x) => x.id === id)) return notify("Identifiant de référentiel déjà utilisé.", true);
  const newItem = { id, label, status: "PROPOSED" };
  if (axis === "clinicalProblems") {
    newItem.kind = form.elements.kind.value;
    newItem.requiresClinicalValidation = true;
  }
  if (axis === "anatomicalTargets") newItem.kind = form.elements.kind.value;
  draft.referenceAdditions[axis].push(newItem);
  form.reset(); renderReferences(); notify("Valeur proposée ajoutée au brouillon.");
});
$("#glossary-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const item = {
    id: form.elements.id.value.trim(),
    term: form.elements.term.value.trim(),
    definition: form.elements.definition.value.trim(),
    synonyms: parseLines(form.elements.synonyms.value),
    relatedCandidateIds: parseLines(form.elements.relatedCandidateIds.value),
  };
  if (glossaryId) {
    const index = draft.glossary.findIndex((x) => x.id === glossaryId);
    if (index >= 0) draft.glossary[index] = item;
  } else {
    if (draft.glossary.some((v) => v.id === item.id)) return notify("Identifiant déjà utilisé.", true);
    draft.glossary.push(item);
  }
  resetGlossary(); renderGlossary(); notify("Définition enregistrée dans le brouillon.");
});
$("#cancel-glossary").addEventListener("click", resetGlossary);
$("#save").addEventListener("click", saveDrafts);
$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(draft, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = "kodjo-admin-brouillons.json";
  a.click(); URL.revokeObjectURL(url);
  notify("Brouillons exportés. Les données sources ne sont pas incluses.");
});
$("#import").addEventListener("change", async (event) => {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 1024 * 1024) return notify("Fichier trop volumineux.", true);
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.kind !== "KODJO_ADMIN_DRAFTS" || parsed.publicationAllowed !== false) {
      throw Error("format ou statut de publication incompatible");
    }
    if (!confirm("Remplacer les brouillons en mémoire par ce fichier ? Vérification à l'enregistrement.")) return;
    draft = parsed; renderMovementList(); if (selectedId) selectMovement(selectedId);
    renderReferences(); renderGlossary();
    notify("Brouillons importés en mémoire, à valider lors de l'enregistrement.");
  } catch (error) { notify("Import refusé : " + error.message, true); }
  event.target.value = "";
});
start();
