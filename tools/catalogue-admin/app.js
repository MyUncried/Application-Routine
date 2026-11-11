/**
 * Administration locale du catalogue KODJO (format v2) — page du navigateur.
 *
 * Les règles métier ne sont PAS réécrites ici : la page importe les modules du domaine de
 * l'application, transpilés par `build-domain.mjs` et servis par le serveur local
 * (`/domain/...`), exactement ceux qu'utilise le serveur. Les révisions sont calculées par le
 * serveur à l'enregistrement. Tout texte venant d'un fichier ou du téléphone est inséré par
 * `textContent` (jamais `innerHTML`).
 */
/* eslint-disable import/no-unresolved -- modules du domaine servis par le serveur local sous /domain/ (build-domain.mjs). */
import {
  CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS,
  CATALOGUE_MAX_MEDIA_PER_SHEET,
  parseMovementCatalogueFile,
  sheetFingerprint,
} from "/domain/src/domain/catalogue/MovementCatalogueFile.js";
import {
  addLibraryMember,
  createLibrary,
  createSheet,
  libraryFingerprint,
  moveLibraryMember,
  removeLibraryMember,
} from "/domain/src/domain/catalogue/catalogueEditing.js";
import { findInboxCollisions, proposedClassification } from "/domain/src/domain/catalogue/MovementInbox.js";
import { mountMediaEditor } from "./media.js";

const $ = (selector) => document.querySelector(selector);
const clone = (value) => JSON.parse(JSON.stringify(value));
const lines = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const el = (tag, className = "", text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, action, { primary = false, disabled = false } = {}) => {
  const node = el("button", primary ? "primary" : "", text);
  node.type = "button";
  node.disabled = disabled;
  node.addEventListener("click", action);
  return node;
};

const ACTOR_KINDS = [["", "Inconnu (null)"], ["LOCAL_USER", "Utilisateur local"], ["PERSON", "Personne"], ["ORGANIZATION", "Organisation"], ["PLATFORM", "Plateforme"]];
const ORIGIN_LABELS = { LOCAL_CREATED: "Créée localement", CATALOGUE_INSTALLED: "Installée depuis un catalogue", SHARED_IMPORTED: "Importée d'un partage", EXTERNAL_IMPORTED: "Importée d'une source externe" };
const VISIBILITY_LABELS = { PRIVATE: "Privée", UNLISTED: "Non répertoriée", PUBLIC: "Publique" };
const REVIEW_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "RETIRED"];
const VISIBILITIES = ["PRIVATE", "UNLISTED", "PUBLIC"];
const AXES = [
  ["categories", "Catégories", null],
  ["bodyZones", "Zones corporelles", "bodyZoneIds"],
  ["specialties", "Spécialités", "specialtyIds"],
  ["gesturalFamilies", "Familles gestuelles", "gesturalFamilyIds"],
  ["clinicalProblems", "Problèmes traités", "clinicalProblemIds"],
  ["anatomicalTargets", "Cibles anatomiques", "anatomicalTargetIds"],
];
/** Catégories et Zones : référentiels de l'application (identifiants partagés avec le téléphone). */
const APP_AXES = new Set(["categories", "bodyZones"]);

const state = {
  files: [], fileName: null, etag: null, original: null, working: null, warnings: [], sourceFormatVersion: null,
  canonical: true, issues: [], tab: "sheets", sheetId: null, libraryId: null, glossaryId: null, query: "",
  libraryFilter: "", inbox: [], status: null, pairing: null, devices: [], poll: null,
};

function notify(message, kind = "") {
  const node = $("#notice");
  node.textContent = message;
  node.className = "notice " + kind;
}

async function api(method, route, body) {
  const response = await fetch(route, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { status: response.status, data };
}

const isDirty = () => state.working !== null && JSON.stringify(state.working) !== JSON.stringify(state.original);
const revisionMeta = () => {
  const kind = $("#revAuthorKind").value, id = $("#revAuthorId").value.trim();
  return { author: kind && id ? { kind, id } : null, summary: $("#revSummary").value.trim() };
};
const today = () => new Date().toISOString();

// ---------- Validation partagée ----------

let validationTimer = null;
function changed() {
  clearTimeout(validationTimer);
  validationTimer = setTimeout(validate, 200);
  updateDirty();
}
function validate() {
  if (!state.working) return;
  const result = parseMovementCatalogueFile(clone(state.working));
  state.issues = result.ok ? [] : result.issues;
  state.warnings = result.ok ? result.warnings : state.warnings;
  renderIssues();
  if (state.tab === "sheets") renderSheetList();
}
function renderIssues() {
  const box = $("#issues");
  box.classList.remove("hidden");
  box.replaceChildren();
  if (!state.working) return box.classList.add("hidden");
  if (state.issues.length === 0) {
    box.className = "issues ok";
    box.textContent = "Fichier valide pour le validateur de l'application" +
      (state.warnings.length ? " · " + state.warnings.length + " signalement(s) non bloquant(s)" : "") + ".";
    return;
  }
  box.className = "issues";
  box.append(el("strong", "", state.issues.length + " problème(s) — l'enregistrement sera refusé tant qu'ils subsistent :"));
  const list = el("ul");
  for (const issue of state.issues.slice(0, 200)) {
    const item = el("li");
    item.append(el("code", "", issue.path || "(fichier)"), document.createTextNode(" — " + issue.code + (issue.detail ? " (" + issue.detail + ")" : "")));
    list.append(item);
  }
  box.append(list);
}
function updateDirty() {
  const dirty = isDirty();
  $("#dirtyState").textContent = dirty ? "Modifications non enregistrées" : "";
  $("#dirtyState").className = dirty ? "dirty" : "info";
}

// ---------- Widgets liés au fichier en cours d'édition ----------

function labeled(text, control, hint) {
  const label = el("label", "", text);
  label.append(control);
  if (hint) label.append(el("small", "", hint));
  return label;
}
function textInput(get, set, { nullable = false, multiline = false, maxLength = 2000, readOnly = false, placeholder = "" } = {}) {
  const node = el(multiline ? "textarea" : "input", "input");
  if (multiline) node.rows = 3;
  node.maxLength = maxLength;
  node.value = get() ?? "";
  node.readOnly = readOnly;
  node.placeholder = placeholder || (nullable ? "Vide = non renseigné (null)" : "");
  node.addEventListener("input", () => {
    const value = node.value;
    set(nullable && value.trim() === "" ? null : value);
    changed();
  });
  return node;
}
function linesInput(get, set, rows = 3) {
  const node = el("textarea", "input");
  node.rows = rows;
  node.value = (get() ?? []).join("\n");
  node.addEventListener("input", () => {
    set(lines(node.value));
    changed();
  });
  return node;
}
function selectInput(options, get, set, { nullable = false, nullLabel = "Aucune (null)" } = {}) {
  const node = el("select", "input");
  if (nullable) node.append(new Option(nullLabel, ""));
  for (const option of options) {
    const [value, text] = Array.isArray(option) ? option : [option, option];
    node.append(new Option(text, value));
  }
  node.value = get() ?? "";
  node.addEventListener("change", () => {
    set(nullable && node.value === "" ? null : node.value);
    changed();
  });
  return node;
}
function checkbox(text, get, set) {
  const label = el("label", "inline");
  const node = el("input");
  node.type = "checkbox";
  node.checked = get() === true;
  node.addEventListener("change", () => {
    set(node.checked);
    changed();
  });
  label.append(node, document.createTextNode(text));
  return label;
}
function chips(entries, get, set) {
  const box = el("div", "chips");
  const selected = new Set(get());
  for (const entry of entries) {
    const label = el("label", "chip");
    const node = el("input");
    node.type = "checkbox";
    node.checked = selected.has(entry.id);
    node.addEventListener("change", () => {
      const current = [...get()];
      set(node.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id));
      changed();
    });
    // Recette du 11/11 : le statut technique (ex. PROPOSED) n'est plus accolé au nom ; il reste en info-bulle.
    label.append(node, document.createTextNode(entry.label));
    if (entry.status) label.title = "Statut : " + entry.status;
    box.append(label);
  }
  // Valeurs présentes mais absentes du référentiel : affichées pour être retirées.
  for (const id of get()) {
    if (entries.some((entry) => entry.id === id)) continue;
    box.append(button("Retirer « " + id + " » (inconnu)", () => {
      set(get().filter((value) => value !== id));
      changed();
      renderTab();
    }));
  }
  return box;
}
/** Acteur `{kind, id}` ou `null` (inconnu déclaré). */
function actorInput(get, set) {
  const box = el("div", "actor");
  const kind = el("select", "input");
  for (const [value, text] of ACTOR_KINDS) kind.append(new Option(text, value));
  const id = el("input", "input");
  id.maxLength = 128;
  id.placeholder = "Identifiant stable";
  const current = get();
  kind.value = current?.kind ?? "";
  id.value = current?.id ?? "";
  const update = () => {
    id.disabled = kind.value === "";
    set(kind.value === "" ? null : { kind: kind.value, id: id.value.trim() });
    changed();
  };
  id.disabled = kind.value === "";
  kind.addEventListener("change", update);
  id.addEventListener("input", update);
  box.append(kind, id);
  return box;
}
function recordInput(get, set) {
  const node = el("textarea", "input");
  node.rows = 3;
  node.value = Object.entries(get() ?? {}).map(([key, value]) => key + " = " + value).join("\n");
  node.placeholder = "clé = valeur (une par ligne)";
  node.addEventListener("input", () => {
    const record = {};
    for (const line of lines(node.value)) {
      const at = line.indexOf("=");
      if (at > 0) record[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
    set(record);
    changed();
  });
  return node;
}
function section(title, ...children) {
  const box = el("fieldset", "section");
  box.append(el("legend", "", title), ...children);
  return box;
}
function grid(...children) {
  const box = el("div", "grid");
  box.append(...children);
  return box;
}
function readonly(text) {
  return el("div", "readonly", text);
}
/** Valeur affichée sans modification possible (tableau de Hermann du 11/11/2026 : n° 11, 17, 23, 27). */
function shown(label, text) {
  return labeled(label, readonly(text));
}

// ---------- Fichiers ----------

async function loadFiles(preferred) {
  const { status, data } = await api("GET", "/api/catalogues");
  if (status !== 200) return notify("Impossible de lister les catalogues.", "error");
  state.files = data.catalogues;
  const select = $("#fileSelect");
  select.replaceChildren(...state.files.map((file) => new Option(
    file.ok ? file.title + " — " + file.fileName : "⚠ " + file.fileName + " (invalide)", file.fileName)));
  const target = preferred ?? state.fileName ?? state.files[0]?.fileName;
  if (target) {
    select.value = target;
    await openFile(target);
  } else {
    notify("Aucun fichier dans catalogue/catalogues/.", "error");
  }
}

async function openFile(fileName) {
  const { status, data } = await api("GET", "/api/catalogues/" + encodeURIComponent(fileName));
  if (status !== 200) return notify("Ouverture impossible (" + (data?.error ?? status) + ").", "error");
  state.fileName = fileName;
  state.etag = data.etag;
  if (!data.ok) {
    state.original = state.working = null;
    state.issues = data.issues;
    renderIssues();
    $("#issues").classList.remove("hidden");
    renderTab();
    return notify("Ce fichier est refusé par le validateur de l'application : corrige-le hors de l'administration.", "error");
  }
  state.original = data.file;
  state.working = clone(data.file);
  state.warnings = data.warnings;
  state.sourceFormatVersion = data.sourceFormatVersion;
  state.canonical = data.canonical;
  state.issues = [];
  if (!state.working.sheets.some((sheet) => sheet.sheetId === state.sheetId)) state.sheetId = state.working.sheets[0]?.sheetId ?? null;
  if (!state.working.libraries.some((library) => library.libraryId === state.libraryId)) state.libraryId = state.working.libraries[0]?.libraryId ?? null;
  renderIssues();
  updateDirty();
  renderTab();
  notify("« " + state.working.catalogue.title + " » ouvert : " + state.working.sheets.length + " fiches, " +
    state.working.libraries.length + " Bibliothèque(s), révision " + state.working.catalogue.revision +
    (data.sourceFormatVersion === "1.0.0" ? " (fichier v1 relu en v2 ; il sera écrit en v2 au premier enregistrement)" : "") + ".");
}

async function save() {
  if (!state.working) return;
  if (state.issues.length > 0) return notify("Enregistrement impossible : corrige d'abord les problèmes listés.", "error");
  const { status, data } = await api("PUT", "/api/catalogues/" + encodeURIComponent(state.fileName),
    { etag: state.etag, file: state.working, meta: revisionMeta() });
  if (status === 200) {
    const summary = data.saved
      ? "Enregistré : révision du catalogue " + data.revision + " ; fiches révisées : " + data.changedSheets.length +
        " (dont " + data.createdSheets.length + " créée(s)) ; Bibliothèques révisées : " + data.changedLibraries.length +
        (data.installChangedSheets.length ? " ; rapprochements : " + data.installChangedSheets.length : "") + "."
      : "Aucun changement effectif : aucune révision créée, fichier inchangé.";
    await openFile(state.fileName);
    $("#revSummary").value = "";
    return notify(summary, "ok");
  }
  if (status === 409) return notify("Le fichier a changé sur le disque depuis son ouverture (révision périmée). Recharge-le avant de réenregistrer ; tes modifications non enregistrées seront perdues.", "error");
  if (status === 422 && data?.issues) {
    state.issues = data.issues.map((issue) => ({ path: issue.path ?? issue.id ?? "", code: issue.code, detail: issue.detail }));
    renderIssues();
    return notify("Enregistrement refusé par le serveur (" + data.error + ").", "error");
  }
  notify("Enregistrement refusé (" + (data?.error ?? status) + ").", "error");
}

// ---------- Onglets ----------

function renderTab() {
  for (const node of document.querySelectorAll(".tabs button")) node.classList.toggle("active", node.dataset.tab === state.tab);
  clearInterval(state.poll);
  state.poll = null;
  const views = $("#views");
  views.replaceChildren();
  const renderers = { sheets: renderSheets, libraries: renderLibraries, references: renderReferences, glossary: renderGlossary,
    catalogue: renderCatalogue, inbox: renderInbox, phones: renderPhones };
  if (!state.working && !["inbox", "phones"].includes(state.tab)) {
    views.append(el("p", "empty", "Aucun fichier catalogue valide ouvert."));
    return;
  }
  renderers[state.tab](views);
}

// --- Fiches ---

function sheetIssueCount(index) {
  const prefix = "sheets[" + index + "]";
  return state.issues.filter((issue) => issue.path === prefix || issue.path.startsWith(prefix + ".")).length;
}

function renderSheets(views) {
  const layout = el("div", "layout");
  const aside = el("aside", "panel aside");
  const top = el("div", "topline");
  top.append(el("span", "counter", String(state.working.sheets.length)), button("Nouvelle fiche", () => showNewSheet(form), { primary: true }));
  const search = el("input", "input");
  search.type = "search";
  search.placeholder = "Nom, alias ou identifiant";
  search.value = state.query;
  search.addEventListener("input", () => {
    state.query = search.value;
    renderSheetList();
  });
  const libraryFilter = el("select", "input");
  libraryFilter.append(new Option("Toutes les fiches", ""));
  for (const library of state.working.libraries) libraryFilter.append(new Option("Bibliothèque : " + library.title, library.libraryId));
  libraryFilter.value = state.libraryFilter;
  libraryFilter.addEventListener("change", () => {
    state.libraryFilter = libraryFilter.value;
    renderSheetList();
  });
  const list = el("div", "list");
  list.id = "sheetList";
  aside.append(top, labeled("Rechercher", search), labeled("Filtrer", libraryFilter), list);
  const form = el("section", "panel");
  form.id = "sheetPanel";
  layout.append(aside, form);
  views.append(layout);
  renderSheetList();
  renderSheetForm(form);
}

function renderSheetList() {
  const list = document.getElementById("sheetList");
  if (!list) return;
  list.replaceChildren();
  const query = state.query.trim().toLocaleLowerCase("fr");
  const library = state.working.libraries.find((entry) => entry.libraryId === state.libraryFilter);
  const originals = new Map(state.original.sheets.map((sheet) => [sheet.sheetId, sheet]));
  state.working.sheets.forEach((sheet, index) => {
    if (library && !library.members.some((m) => m.catalogueId === state.working.catalogue.id && m.sheetId === sheet.sheetId)) return;
    const haystack = [sheet.sheetId, sheet.content.name, ...sheet.content.aliases].join(" ").toLocaleLowerCase("fr");
    if (query && !haystack.includes(query)) return;
    const item = el("button", "item" + (sheet.sheetId === state.sheetId ? " selected" : ""));
    item.type = "button";
    item.append(el("strong", "", sheet.content.name || "(sans nom)"));
    const original = originals.get(sheet.sheetId);
    const info = el("small", "", sheet.sheetId + " · rév. " + sheet.revision);
    item.append(info);
    if (!original) item.append(el("small", "badge-new", "Nouvelle — non enregistrée"));
    else if (sheetFingerprint(original) !== sheetFingerprint(sheet)) item.append(el("small", "dirty", "Modifiée — nouvelle révision à l'enregistrement"));
    else if (JSON.stringify(original.install) !== JSON.stringify(sheet.install)) item.append(el("small", "dirty", "Rapprochement modifié"));
    const issues = sheetIssueCount(index);
    if (issues) item.append(el("small", "badge-error", issues + " problème(s)"));
    item.addEventListener("click", () => {
      state.sheetId = sheet.sheetId;
      renderSheetList();
      renderSheetForm(document.getElementById("sheetPanel"));
    });
    list.append(item);
  });
  if (!list.children.length) list.append(el("p", "empty", "Aucune fiche."));
}

function showNewSheet(panel) {
  const refs = state.working.references;
  const draft = { name: "", categoryId: refs.categories[0]?.id ?? "", bodyZoneIds: [], sheetId: "" };
  panel.replaceChildren();
  const box = el("div", "dialog");
  box.append(el("h2", "", "Nouvelle fiche"),
    el("p", "info", "Origine LOCAL_CREATED, privée, brouillon, non publiable ; propriétaire et auteur inconnus tant que tu ne les renseignes pas. Révision 1 attribuée par le serveur à l'enregistrement."));
  const name = el("input", "input");
  name.maxLength = 80;
  const sheetId = el("input", "input");
  sheetId.maxLength = 64;
  sheetId.placeholder = "Généré à partir du nom si vide";
  const category = el("select", "input");
  for (const entry of refs.categories) category.append(new Option(entry.label, entry.id));
  const zones = chips(refs.bodyZones, () => draft.bodyZoneIds, (value) => { draft.bodyZoneIds = value; });
  box.append(grid(labeled("Nom", name), labeled("Identifiant de fiche (facultatif)", sheetId)), labeled("Catégorie", category),
    section("Zones corporelles (au moins une)", zones));
  box.append(el("div", "split"));
  box.lastChild.append(button("Créer la fiche", () => {
    try {
      const input = { name: name.value, categoryId: category.value, bodyZoneIds: draft.bodyZoneIds };
      if (sheetId.value.trim()) input.sheetId = sheetId.value.trim();
      const meta = revisionMeta();
      const result = createSheet(state.working, input, { date: today(), author: meta.author, summary: meta.summary });
      state.working = result.file;
      state.sheetId = result.sheet.sheetId;
      changed();
      renderTab();
      notify("Fiche « " + result.sheet.content.name + " » créée (" + result.sheet.sheetId + "). Complète-la puis enregistre.", "ok");
    } catch (error) {
      notify("Création impossible : " + (error.code ?? error.message) + ".", "error");
    }
  }, { primary: true }), button("Annuler", () => renderSheetForm(panel)));
  panel.append(box);
  name.focus();
}

function renderSheetForm(panel) {
  panel.replaceChildren();
  const index = state.working.sheets.findIndex((entry) => entry.sheetId === state.sheetId);
  if (index < 0) return panel.append(el("p", "empty", "Sélectionne une fiche."));
  const sheet = state.working.sheets[index];
  const refs = state.working.references;
  const head = el("div", "rightheader");
  const title = el("div");
  title.append(el("p", "eyebrow", "Fiche éditoriale"), el("h2", "", sheet.content.name || "(sans nom)"));
  head.append(title, el("span", "code", sheet.sheetId + " · révision " + sheet.revision));
  const fields = el("div", "fields");
  const c = sheet.content, k = sheet.classification, p = sheet.provenance, s = sheet.sources;

  fields.append(section("Contenu",
    labeled("Nom du mouvement", textInput(() => c.name, (x) => { c.name = x; }, { maxLength: 80 }), "80 caractères au plus (contrat Mouvement)."),
    labeled("Alias (un par ligne, ordonnés)", linesInput(() => c.aliases, (x) => { c.aliases = x; }, 2)),
    grid(labeled("Position de départ", textInput(() => c.startingPosition, (x) => { c.startingPosition = x; }, { nullable: true })),
      labeled("Matériel", textInput(() => c.equipment, (x) => { c.equipment = x; }, { nullable: true }))),
    labeled("Étapes (une par ligne, ordonnées)", linesInput(() => c.steps, (x) => { c.steps = x; }, 5), "1 000 caractères au total, séparateurs compris (contrat Mouvement)."),
    labeled("Consignes de sécurité", textInput(() => c.safetyNotes, (x) => { c.safetyNotes = x; }, { nullable: true, multiline: true })),
    labeled("Notes éditoriales", textInput(() => c.notes, (x) => { c.notes = x; }, { multiline: true })),
  ));

  // Tableau de Hermann du 11/11/2026 : n° 6 à 9 (fondement, revue, classification et spécialités d'origine) retirés.
  const classification = section("Classification",
    labeled("Catégorie", selectInput(refs.categories.map((e) => [e.id, e.label]), () => k.categoryId, (x) => { k.categoryId = x; }, { nullable: true })),
  );
  for (const [axis, label, field] of AXES) {
    if (!field) continue;
    classification.append(section(label, chips(refs[axis], () => k[field], (x) => { k[field] = x; })));
  }
  fields.append(classification);

  const upstream = el("div", "fields");
  const renderUpstream = () => {
    upstream.replaceChildren(checkbox("Amont renseigné (obligatoire sauf création locale)", () => p.upstream !== null, (on) => {
      p.upstream = on ? { catalogueId: "", sheetId: "", revision: "" } : null;
      renderUpstream();
    }));
    if (p.upstream) {
      const u = p.upstream;
      upstream.append(el("div", "three"));
      upstream.lastChild.append(labeled("Catalogue amont", textInput(() => u.catalogueId, (x) => { u.catalogueId = x; })),
        labeled("Fiche amont", textInput(() => u.sheetId, (x) => { u.sheetId = x; })),
        labeled("Révision amont", textInput(() => u.revision, (x) => { u.revision = x; })));
    }
  };
  renderUpstream();
  fields.append(section("Provenance",
    shown("Origine", ORIGIN_LABELS[p.origin] ?? p.origin),
    upstream,
    grid(labeled("Propriétaire", actorInput(() => p.owner, (x) => { p.owner = x; }), "Inconnu = privé, jamais publiable."),
      labeled("Auteur (unique)", actorInput(() => p.author, (x) => { p.author = x; }))),
    grid(labeled("Diffuseur", actorInput(() => p.publisher, (x) => { p.publisher = x; })),
      labeled("Ayant droit", actorInput(() => p.rightsHolder, (x) => { p.rightsHolder = x; }))),
    grid(labeled("Licence", textInput(() => p.license, (x) => { p.license = x; }, { nullable: true })),
      labeled("Statut éditorial", selectInput(REVIEW_STATUSES, () => p.reviewStatus, (x) => { p.reviewStatus = x; }))),
    shown("Visibilité", VISIBILITY_LABELS[p.visibility] ?? p.visibility),
  ));

  const documentary = el("div", "fields");
  const renderDocumentary = () => {
    documentary.replaceChildren(checkbox("Référence documentaire renseignée", () => s.documentary !== null, (on) => {
      s.documentary = on ? { sourceId: null, section: null, url: null, usageStatement: null } : null;
      renderDocumentary();
    }));
    if (s.documentary) {
      const d = s.documentary;
      documentary.append(grid(labeled("Identifiant de source", textInput(() => d.sourceId, (x) => { d.sourceId = x; }, { nullable: true })),
        labeled("Section", textInput(() => d.section, (x) => { d.section = x; }, { nullable: true }))),
      grid(labeled("URL", textInput(() => d.url, (x) => { d.url = x; }, { nullable: true })),
        labeled("Conditions d'usage", textInput(() => d.usageStatement, (x) => { d.usageStatement = x; }, { nullable: true }))));
    }
  };
  renderDocumentary();
  fields.append(section("Sources", documentary,
    labeled("Contexte de prescription d'origine (non normatif)", recordInput(() => s.prescriptionContext, (x) => { s.prescriptionContext = x; }))));

  // Section « Validation » retirée (Hermann, 11/11/2026 : « je n'ai exprimé aucun besoin, alors pourquoi les
  // développer s'ils ne sont pas nécessaires »). Les valeurs existantes restent dans le fichier, inchangées.

  const mediaBox = el("div");
  fields.append(mediaBox);
  mountMediaEditor(mediaBox, {
    getMedia: () => sheet.media,
    setMedia: (media) => {
      sheet.media = media;
      changed();
    },
    validate: (media) => {
      const candidate = clone(state.working);
      candidate.sheets[index].media = media;
      const result = parseMovementCatalogueFile(candidate);
      if (result.ok) return null;
      const prefix = "sheets[" + index + "].media";
      const found = result.issues.find((issue) => issue.path.startsWith(prefix));
      return found ? (found.detail ?? found.code) + " (" + found.path + ")" : null;
    },
    notify,
    maxMedia: CATALOGUE_MAX_MEDIA_PER_SHEET,
    maxEmbeddedChars: CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS,
  });

  fields.append(section("Historique des révisions (lecture seule)",
    readonly(sheet.history.map((h) => "Révision " + h.revision + " · " + h.date + " · " +
      (h.author ? h.author.kind + ":" + h.author.id : "auteur inconnu") + " — " + h.summary).join("\n"))));
  const libraries = state.working.libraries.filter((library) =>
    library.members.some((m) => m.catalogueId === state.working.catalogue.id && m.sheetId === sheet.sheetId));
  fields.append(section("Bibliothèques contenant cette fiche",
    readonly(libraries.map((library) => library.title + " (" + library.libraryId + ")").join("\n") || "Aucune.")));
  panel.append(head, fields);
}

// --- Bibliothèques ---

function renderLibraries(views) {
  const layout = el("div", "layout");
  const aside = el("aside", "panel aside");
  const top = el("div", "topline");
  top.append(el("span", "counter", String(state.working.libraries.length)), button("Nouvelle Bibliothèque", () => {
    const title = prompt("Titre de la nouvelle Bibliothèque :");
    if (!title || !title.trim()) return;
    try {
      const meta = revisionMeta();
      const result = createLibrary(state.working, { title }, { date: today(), author: meta.author, summary: meta.summary });
      state.working = result.file;
      state.libraryId = result.library.libraryId;
      changed();
      renderTab();
    } catch (error) {
      notify("Création impossible : " + (error.code ?? error.message) + ".", "error");
    }
  }, { primary: true }));
  const list = el("div", "list");
  const originals = new Map(state.original.libraries.map((library) => [library.libraryId, library]));
  for (const library of state.working.libraries) {
    const item = el("button", "item" + (library.libraryId === state.libraryId ? " selected" : ""));
    item.type = "button";
    item.append(el("strong", "", library.title), el("small", "", library.libraryId + " · " + library.members.length + " fiche(s) · rév. " + library.revision));
    const original = originals.get(library.libraryId);
    if (!original) item.append(el("small", "badge-new", "Nouvelle — non enregistrée"));
    else if (libraryFingerprint(original) !== libraryFingerprint(library)) item.append(el("small", "dirty", "Modifiée"));
    item.addEventListener("click", () => {
      state.libraryId = library.libraryId;
      renderTab();
    });
    list.append(item);
  }
  aside.append(top, el("p", "info", "Une Bibliothèque est une collection de références vers des fiches, sans copie ; une fiche peut figurer dans plusieurs Bibliothèques."), list);
  const panel = el("section", "panel");
  layout.append(aside, panel);
  views.append(layout);
  const index = state.working.libraries.findIndex((library) => library.libraryId === state.libraryId);
  if (index < 0) return panel.append(el("p", "empty", "Sélectionne ou crée une Bibliothèque."));
  const library = state.working.libraries[index];
  const replace = (next) => {
    state.working.libraries[index] = next;
    changed();
    renderTab();
  };
  const head = el("div", "rightheader");
  const title = el("div");
  title.append(el("p", "eyebrow", "Bibliothèque"), el("h2", "", library.title));
  head.append(title, el("span", "code", library.libraryId + " · révision " + library.revision));
  const fields = el("div", "fields");
  fields.append(section("En-tête",
    labeled("Titre", textInput(() => library.title, (x) => { library.title = x; }, { maxLength: 200 })),
    labeled("Description", textInput(() => library.description, (x) => { library.description = x; }, { nullable: true, multiline: true })),
    grid(labeled("Éditeur (composition)", actorInput(() => library.editor, (x) => { library.editor = x; })),
      labeled("Propriétaire", actorInput(() => library.owner, (x) => { library.owner = x; }), "Inconnu = privée et non publiable.")),
    grid(labeled("Visibilité", selectInput(VISIBILITIES, () => library.visibility, (x) => { library.visibility = x; })),
      shown("Publication autorisée", library.publicationAllowed ? "Oui" : "Non")),
  ));
  const sheetsById = new Map(state.working.sheets.map((sheet) => [sheet.sheetId, sheet]));
  const members = el("div", "members");
  library.members.forEach((member, at) => {
    const row = el("div", "member");
    const internal = member.catalogueId === state.working.catalogue.id;
    const sheet = internal ? sheetsById.get(member.sheetId) : null;
    row.append(el("span", "", (at + 1) + ". " + (sheet ? sheet.content.name + " — " + member.sheetId :
      (internal ? "Fiche absente : " + member.sheetId : "Fiche externe : " + member.catalogueId + " / " + member.sheetId))));
    const actions = el("div", "media-actions");
    actions.append(button("↑", () => replace(moveLibraryMember(library, at, at - 1)), { disabled: at === 0 }),
      button("↓", () => replace(moveLibraryMember(library, at, at + 1)), { disabled: at === library.members.length - 1 }),
      button("Retirer", () => replace(removeLibraryMember(library, member))));
    row.append(actions);
    members.append(row);
  });
  if (!library.members.length) members.append(el("p", "info", "Aucune fiche dans cette Bibliothèque."));
  const pickerSearch = el("input", "input");
  pickerSearch.type = "search";
  pickerSearch.placeholder = "Chercher une fiche à ajouter";
  const picker = el("div", "picker");
  const renderPicker = () => {
    picker.replaceChildren();
    const query = pickerSearch.value.trim().toLocaleLowerCase("fr");
    for (const sheet of state.working.sheets) {
      if (library.members.some((m) => m.catalogueId === state.working.catalogue.id && m.sheetId === sheet.sheetId)) continue;
      if (query && !(sheet.sheetId + " " + sheet.content.name).toLocaleLowerCase("fr").includes(query)) continue;
      const row = el("div", "member");
      row.append(el("span", "", sheet.content.name + " — " + sheet.sheetId),
        button("Ajouter", () => replace(addLibraryMember(library, { catalogueId: state.working.catalogue.id, sheetId: sheet.sheetId }))));
      picker.append(row);
    }
    if (!picker.children.length) picker.append(el("p", "info", "Aucune fiche disponible."));
  };
  pickerSearch.addEventListener("input", renderPicker);
  renderPicker();
  fields.append(section("Fiches (ordonnées) — " + library.members.length, members), section("Ajouter des fiches", pickerSearch, picker),
    section("Historique (lecture seule)", readonly(library.history.map((h) => "Révision " + h.revision + " · " + h.date + " — " + h.summary).join("\n") ||
      "Aucune entrée (Bibliothèque issue de la conversion v1 ou du fichier initial).")));
  panel.append(head, fields);
}

// --- Référentiels ---

function renderReferences(views) {
  const panel = el("section", "panel");
  panel.style.margin = "0 clamp(16px,3.6vw,48px) 36px";
  panel.append(el("h2", "", "Référentiels du catalogue"),
    el("p", "tip", "Catégories et Zones : identifiants partagés avec l'application (lecture seule ici). Les autres axes sont des propositions éditoriales ; retirer une valeur encore utilisée par une fiche est signalé par le validateur."));
  for (const [axis, label] of AXES) {
    const entries = state.working.references[axis];
    const box = section(label + " (" + entries.length + ")");
    entries.forEach((entry, index) => {
      const row = el("div", "refrow");
      row.append(el("code", "", entry.id));
      if (APP_AXES.has(axis)) {
        row.append(el("span", "", entry.label), el("span"));
      } else {
        const fieldsRow = el("div", "grid");
        fieldsRow.append(textInput(() => entry.label, (x) => { entry.label = x; }, { maxLength: 100 }),
          textInput(() => entry.status, (x) => { entry.status = x; }, { nullable: true, placeholder: "Statut (ex. PROPOSED)" }));
        row.append(fieldsRow, button("Retirer", () => {
          entries.splice(index, 1);
          changed();
          renderTab();
        }));
      }
      box.append(row);
    });
    if (!APP_AXES.has(axis)) {
      const id = el("input", "input");
      id.placeholder = "identifiant-stable";
      id.maxLength = 64;
      const text = el("input", "input");
      text.placeholder = "Libellé";
      text.maxLength = 100;
      const kind = el("input", "input");
      kind.placeholder = "Nature (facultatif)";
      box.append(grid(labeled("Identifiant", id), labeled("Libellé", text)), grid(labeled("Nature", kind),
        el("div", "split")));
      box.lastChild.lastChild.append(button("Ajouter (PROPOSED)", () => {
        if (!/^[a-z][a-z0-9-]{1,63}$/.test(id.value.trim()) || !text.value.trim()) {
          return notify("Identifiant (minuscules, chiffres, tirets) et libellé requis.", "error");
        }
        entries.push({ id: id.value.trim(), label: text.value.trim(), kind: kind.value.trim() || null, status: "PROPOSED" });
        changed();
        renderTab();
      }));
    }
    panel.append(box);
  }
  views.append(panel);
}

// --- Glossaire ---

function renderGlossary(views) {
  const panel = el("section", "panel");
  panel.style.margin = "0 clamp(16px,3.6vw,48px) 36px";
  const glossary = state.working.glossary;
  panel.append(el("h2", "", "Glossaire sportif et anatomique"),
    el("p", "tip", "Distinct des alias des mouvements. Les fiches associées sont désignées par leur identifiant de fiche."));
  const list = el("div", "list");
  for (const entry of glossary) {
    const item = el("button", "item" + (entry.id === state.glossaryId ? " selected" : ""));
    item.type = "button";
    item.append(el("strong", "", entry.term), el("small", "", entry.id));
    item.addEventListener("click", () => {
      state.glossaryId = entry.id;
      renderTab();
    });
    list.append(item);
  }
  if (!glossary.length) list.append(el("p", "info", "Aucun terme."));
  const id = el("input", "input");
  id.placeholder = "identifiant-stable";
  const add = el("div", "split");
  add.append(id, button("Nouveau terme", () => {
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(id.value.trim())) return notify("Identifiant invalide (minuscules, chiffres, tirets).", "error");
    if (glossary.some((entry) => entry.id === id.value.trim())) return notify("Identifiant déjà utilisé.", "error");
    glossary.push({ id: id.value.trim(), term: id.value.trim(), definition: "", synonyms: [], relatedSheetIds: [] });
    state.glossaryId = id.value.trim();
    changed();
    renderTab();
  }));
  panel.append(add, list);
  const entry = glossary.find((candidate) => candidate.id === state.glossaryId);
  if (entry) {
    panel.append(section("Terme « " + entry.id + " »",
      labeled("Terme", textInput(() => entry.term, (x) => { entry.term = x; }, { maxLength: 100 })),
      labeled("Définition", textInput(() => entry.definition, (x) => { entry.definition = x; }, { multiline: true, maxLength: 1000 })),
      labeled("Synonymes (un par ligne)", linesInput(() => entry.synonyms, (x) => { entry.synonyms = x; }, 2)),
      labeled("Fiches associées (identifiants, un par ligne)", linesInput(() => entry.relatedSheetIds, (x) => { entry.relatedSheetIds = x; }, 3)),
      button("Retirer ce terme", () => {
        if (!confirm("Retirer ce terme du glossaire ?")) return;
        glossary.splice(glossary.indexOf(entry), 1);
        state.glossaryId = null;
        changed();
        renderTab();
      })));
  }
  views.append(panel);
}

// --- En-tête du catalogue ---

/** N° 29 : empreinte et version lue, repliées (identifier le fichier effectivement lu). */
function technicalDetails() {
  const details = el("details", "source");
  details.append(el("summary", "", "Détails techniques"),
    readonly("Empreinte du fichier (révision optimiste) : " + state.etag.slice(0, 16) + "…" +
      "\nVersion lue : " + state.sourceFormatVersion + (state.canonical ? "" : "\nForme non canonique sur disque : réécrite en sérialisation de référence au prochain enregistrement effectif.")));
  return details;
}

function renderCatalogue(views) {
  const panel = el("section", "panel");
  panel.style.margin = "0 clamp(16px,3.6vw,48px) 36px";
  const header = state.working.catalogue;
  panel.append(el("h2", "", "Catalogue"),
    section("Fichier",
      readonly("Fichier : " + state.fileName + "\nIdentifiant : " + header.id + "\nRévision : " + header.revision),
      technicalDetails(),
      readonly(state.warnings.length ? state.warnings.map((w) => w.code + " — " + w.path).join("\n") : "Aucun signalement.")),
    section("En-tête",
      labeled("Titre", textInput(() => header.title, (x) => { header.title = x; }, { maxLength: 200 })),
      grid(labeled("Propriétaire", actorInput(() => header.owner, (x) => { header.owner = x; }), "Inconnu = aucune publication."),
        labeled("Gestionnaire administratif", actorInput(() => header.manager, (x) => { header.manager = x; }))),
      grid(labeled("Diffuseur", actorInput(() => header.publisher, (x) => { header.publisher = x; })),
        shown("Publication autorisée", header.publicationAllowed ? "Oui" : "Non"))));
  views.append(panel);
}

// --- Boîte d'arrivée ---

async function renderInbox(views) {
  const panel = el("section", "panel");
  panel.style.margin = "0 clamp(16px,3.6vw,48px) 36px";
  panel.append(el("h2", "", "Boîte d'arrivée — Mouvements envoyés par le téléphone"),
    el("p", "tip", "Rien n'est ajouté automatiquement. « Ajouter au catalogue » crée une fiche LOCAL_CREATED privée, brouillon, non publiable, sans propriétaire ni auteur. « Rapprocher » rattache le Mouvement à une fiche existante (installation seulement, sans révision de la fiche). Les médias des Mouvements personnels ne sont pas transférés dans ce lot."));
  views.append(panel);
  const { status, data } = await api("GET", "/api/inbox");
  if (status !== 200) return panel.append(el("p", "warning", "Boîte d'arrivée illisible."));
  state.inbox = data.items;
  if (!state.working) return panel.append(el("p", "warning", "Ouvre un fichier catalogue valide pour traiter les Mouvements reçus."));
  const blocked = isDirty();
  if (blocked) panel.append(el("p", "warning", "Enregistre ou recharge d'abord les modifications en cours : les actions écrivent directement dans le fichier."));
  const cards = el("div", "cards");
  const ordered = [...state.inbox].sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.receivedAt.localeCompare(a.receivedAt));
  if (!ordered.length) cards.append(el("p", "empty", "Aucun Mouvement reçu."));
  for (const item of ordered) cards.append(inboxCard(item, blocked));
  panel.append(cards);
}

function inboxCard(item, blocked) {
  const m = item.movement;
  const card = el("article", "inbox-card" + (item.status === "PENDING" ? "" : " done"));
  card.append(el("strong", "", m.name), el("small", "info", "Mouvement " + m.movementId + " · reçu le " +
    new Date(item.receivedAt).toLocaleString("fr-FR") + " de « " + item.device.pairedName + " » · statut " + item.status));
  if (m.aliases.length) card.append(el("small", "", "Alias : " + m.aliases.join(", ")));
  card.append(el("small", "", "Catégorie (téléphone) : " + m.categoryLabel + " · Zones : " + m.bodyZoneLabels.join(", ") +
    " · Médias non transférés : " + m.mediaCount));
  const steps = el("ol");
  for (const step of m.steps) steps.append(el("li", "", step));
  card.append(steps);
  const collisions = findInboxCollisions(state.original, m);
  for (const collision of collisions) {
    const sheet = state.original.sheets.find((s) => s.sheetId === collision.sheetId);
    card.append(el("span", "collision", (collision.reason === "KNOWN_LOCAL_ID" ? "Déjà rapproché de " : "Même nom que ") +
      "« " + (sheet?.content.name ?? collision.sheetId) + " » (" + collision.sheetId + ")"));
  }
  if (item.status !== "PENDING") {
    if (item.result) card.append(el("small", "", "Traité : " + item.result.fileName + " / " + item.result.sheetId));
    return card;
  }
  const proposal = proposedClassification(state.original, m);
  const choice = { categoryId: proposal.categoryId ?? "", bodyZoneIds: [...proposal.bodyZoneIds] };
  const category = el("select", "input");
  category.append(new Option("Choisir une Catégorie", ""));
  for (const entry of state.original.references.categories) category.append(new Option(entry.label, entry.id));
  category.value = choice.categoryId;
  category.addEventListener("change", () => { choice.categoryId = category.value; });
  const zones = chips(state.original.references.bodyZones, () => choice.bodyZoneIds, (x) => { choice.bodyZoneIds = x; });
  const library = el("select", "input");
  library.append(new Option("Aucune Bibliothèque", ""));
  for (const entry of state.original.libraries) library.append(new Option(entry.title, entry.libraryId));
  const target = el("select", "input");
  for (const sheet of state.original.sheets) target.append(new Option(sheet.content.name + " — " + sheet.sheetId, sheet.sheetId));
  if (collisions[0]) target.value = collisions[0].sheetId;
  if (proposal.unmatchedZones.length) card.append(el("small", "warning", "Zones sans correspondance dans le catalogue : " + proposal.unmatchedZones.join(", ")));
  const act = async (action, body, question) => {
    if (!confirm(question)) return;
    const { status, data } = await api("POST", "/api/inbox/" + encodeURIComponent(item.itemId) + "/" + action,
      { ...body, fileName: state.fileName, etag: state.etag, meta: revisionMeta() });
    if (status !== 200) {
      return notify("Action refusée (" + (data?.error ?? status) + (data?.sheetId ? " : " + data.sheetId : "") + ").", "error");
    }
    await openFile(state.fileName);
    state.tab = "inbox";
    renderTab();
    notify(action === "dismiss" ? "Mouvement ignoré." : action === "add" ? "Fiche créée : " + data.sheetId + "." : "Mouvement rapproché.", "ok");
  };
  card.append(section("Ajouter au catalogue « " + state.original.catalogue.title + " »",
    grid(labeled("Catégorie", category), labeled("Bibliothèque (facultatif)", library)), labeled("Zones", zones),
    button("Ajouter au catalogue", () => {
      if (!choice.categoryId || !choice.bodyZoneIds.length) return notify("Choisis une Catégorie et au moins une Zone.", "error");
      act("add", { categoryId: choice.categoryId, bodyZoneIds: choice.bodyZoneIds, libraryId: library.value || null },
        "Créer une fiche privée à partir de « " + m.name + " » ?");
    }, { primary: true, disabled: blocked })));
  card.append(section("Rapprocher d'une fiche existante", target,
    button("Rapprocher", () => act("link", { sheetId: target.value },
      "Rattacher le Mouvement " + m.movementId + " à la fiche " + target.value + " ? Aucune révision éditoriale n'est créée."), { disabled: blocked }),
    button("Ignorer", () => act("dismiss", {}, "Ignorer ce Mouvement ?"))));
  return card;
}

// --- Téléphones ---

async function renderPhones(views) {
  const panel = el("section", "panel");
  panel.style.margin = "0 clamp(16px,3.6vw,48px) 36px";
  views.append(panel);
  const [{ data: status }, { data: devices }] = await Promise.all([api("GET", "/api/status"), api("GET", "/api/devices")]);
  state.status = status;
  panel.append(el("h2", "", "Téléphones (connexion Wi-Fi locale)"));
  if (!status.lan.enabled) {
    panel.append(el("p", "warning", "Connexion Wi-Fi désactivée. Relance le serveur avec : node tools/catalogue-admin/server.mjs --lan"));
  } else {
    panel.append(readonly("Port réseau local : " + status.lan.port + "\nTest depuis Safari (iPhone) :\n" +
      (status.lan.addresses.map((address) => "  http://" + address + ":" + status.lan.port + "/phone/test").join("\n") || "  aucune adresse IPv4 détectée")));
  }
  const codeBox = el("div", "dialog");
  const renderCode = () => {
    codeBox.replaceChildren();
    const pairing = state.pairing;
    if (pairing && Date.parse(pairing.expiresAt) > Date.now()) {
      const seconds = Math.max(0, Math.round((Date.parse(pairing.expiresAt) - Date.now()) / 1000));
      codeBox.append(el("span", "pairing-code", pairing.code),
        el("small", "", "À saisir dans l'application du téléphone. Valable encore " + Math.floor(seconds / 60) + " min " + (seconds % 60) + " s, une seule fois."),
        button("Fermer l'appairage", async () => {
          await api("DELETE", "/api/pairing");
          state.pairing = null;
          renderCode();
        }));
    } else {
      state.pairing = null;
      codeBox.append(button("Appairer un téléphone", async () => {
        const { status: code, data } = await api("POST", "/api/pairing", {});
        if (code !== 200) return notify("Code indisponible.", "error");
        state.pairing = data;
        renderCode();
      }, { primary: true, disabled: !status.lan.enabled }));
    }
  };
  renderCode();
  const list = el("div", "members");
  const renderDevices = (entries) => {
    list.replaceChildren();
    if (!entries.length) list.append(el("p", "info", "Aucun téléphone appairé."));
    for (const device of entries) {
      const row = el("div", "member");
      row.append(el("span", "", device.name + " · appairé le " + new Date(device.pairedAt).toLocaleString("fr-FR") +
        " · expire le " + new Date(device.expiresAt).toLocaleString("fr-FR") +
        (device.lastSeenAt ? " · vu le " + new Date(device.lastSeenAt).toLocaleString("fr-FR") : "")),
        button("Révoquer", async () => {
          if (!confirm("Révoquer « " + device.name + " » ? Il devra être appairé de nouveau.")) return;
          await api("DELETE", "/api/devices/" + encodeURIComponent(device.deviceId));
          renderDevices((await api("GET", "/api/devices")).data.devices);
        }));
      list.append(row);
    }
  };
  renderDevices(devices.devices);
  panel.append(section("Appairage", codeBox), section("Téléphones appairés (jeton valable 12 h)", list));
  state.poll = setInterval(async () => {
    if (state.tab !== "phones") return;
    renderCode();
    renderDevices((await api("GET", "/api/devices")).data.devices);
  }, 3000);
}

// ---------- Démarrage ----------

for (const node of document.querySelectorAll(".tabs button")) {
  node.addEventListener("click", () => {
    state.tab = node.dataset.tab;
    renderTab();
  });
}
$("#fileSelect").addEventListener("change", async (event) => {
  if (isDirty() && !confirm("Abandonner les modifications non enregistrées ?")) {
    event.target.value = state.fileName;
    return;
  }
  await openFile(event.target.value);
});
$("#reload").addEventListener("click", async () => {
  if (isDirty() && !confirm("Abandonner les modifications non enregistrées ?")) return;
  await loadFiles(state.fileName);
});
$("#save").addEventListener("click", save);
$("#export").addEventListener("click", () => {
  if (!state.fileName) return;
  if (isDirty()) notify("L'export contient le fichier enregistré, sans les modifications en cours.", "error");
  const link = document.createElement("a");
  link.href = "/api/catalogues/" + encodeURIComponent(state.fileName) + "/export";
  link.download = state.fileName;
  link.click();
});
window.addEventListener("beforeunload", (event) => {
  if (isDirty()) {
    event.preventDefault();
    event.returnValue = "";
  }
});
api("GET", "/api/status").then(({ data }) => {
  if (data?.lan?.enabled) $("#lanBadge").textContent = "Wi-Fi local actif (port " + data.lan.port + ") · aucun envoi sur Internet";
});
loadFiles().catch(() => notify("Serveur local injoignable.", "error"));
