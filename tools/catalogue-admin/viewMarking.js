/**
 * Marquage des photos (D-600) — éléments d'interface partagés par la galerie de la fiche et l'étape
 * « Marquage des photos » : cadre de la photo avec le rectangle de la vue retenue (déplaçable et
 * redimensionnable), quatre champs en pourcentage, proposition par détection (`viewDetection.js`).
 *
 * Une proposition n'est jamais écrite d'office : elle s'affiche en pointillés et n'entre dans
 * `media.view` qu'après « Accepter ». Une vue absente = image entière.
 *
 * « Vérifiée » : le format ne porte pas cet état (contrat D-600 inchangé). Il est noté dans ce
 * navigateur (localStorage), lié à la vue exacte et à la photo : toute modification de l'une ou de
 * l'autre le fait retomber à « proposée ».
 */
import { isValidCatalogueMediaView } from "/domain/src/domain/catalogue/MovementCatalogueFile.js";
import { proposeView } from "./viewDetection.js";

const el = (tag, className = "", text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const round2 = (value) => Math.round(value * 100) / 100;
const FULL = { x: 0, y: 0, width: 100, height: 100 };

/** Valeur à stocker : un rectangle couvrant toute l'image n'est pas stocké (absent = image entière). */
export const asStoredView = (view) => (view && !sameView(view, FULL) ? view : null);

export const isMarkablePhoto = (media) => media.kind === "PHOTO" && media.storage === "EMBEDDED";

export function sameView(a, b) {
  if (!a || !b) return !a && !b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

const number = (value) => String(value).replace(".", ",");
export function describeView(view) {
  if (!view) return "Image entière";
  return "x " + number(view.x) + " · y " + number(view.y) + " · largeur " + number(view.width) + " · hauteur " + number(view.height) + " (%)";
}

/** Pixels RGBA d'une photo intégrée (data: URL, même origine : canevas lisible). */
export async function loadPixels(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw Error("Traitement de l'image indisponible.");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export async function proposeForPhoto(src) {
  const pixels = await loadPixels(src);
  return proposeView(pixels.width, pixels.height, pixels.data);
}

/** Texte court d'une proposition : nombre de vues, règle, remarques. */
export function describeProposal(proposal) {
  const rule = { IMAGE_ENTIERE: "image simple, retenue entière", PLUS_A_DROITE: "vue la plus à droite", PLUS_LARGE: "vue la plus large" }[proposal.rule] ?? proposal.rule;
  return proposal.views.length + (proposal.views.length > 1 ? " vues détectées" : " vue détectée") + " — " + rule +
    (proposal.notes.length ? " — à vérifier : " + proposal.notes.join(" ; ") : "");
}

/** Vue normalisée (arrondie, contenue dans l'image), ou null si invalide. */
export function normalizeView(view) {
  const x = round2(Math.min(Math.max(view.x, 0), 99.99));
  const y = round2(Math.min(Math.max(view.y, 0), 99.99));
  const next = {
    x, y,
    width: round2(Math.min(Math.max(view.width, 0.01), 100 - x)),
    height: round2(Math.min(Math.max(view.height, 0.01), 100 - y)),
  };
  return isValidCatalogueMediaView(next) ? next : null;
}

// ---------- État « vérifiée » (navigateur) ----------

const STORE = "kodjo-admin-marquage-verifie";
const readStore = () => {
  try { return JSON.parse(localStorage.getItem(STORE) ?? "{}") ?? {}; } catch { return {}; }
};
const signature = (media) => JSON.stringify(media.view ?? null) + "|" + media.url.length + "|" + media.url.slice(-32);
const storeKey = (catalogueId, sheetId, media) => catalogueId + "|" + sheetId + "|" + media.id;

export function isVerified(catalogueId, sheetId, media) {
  return readStore()[storeKey(catalogueId, sheetId, media)] === signature(media);
}
export function setVerified(catalogueId, sheetId, media) {
  const store = readStore();
  store[storeKey(catalogueId, sheetId, media)] = signature(media);
  try { localStorage.setItem(STORE, JSON.stringify(store)); } catch { /* stockage indisponible : état non conservé */ }
}

// ---------- Cadre de la photo ----------

/**
 * Photo et rectangles en surimpression. `onChange(view)` (facultatif) rend le rectangle de la vue
 * déplaçable (glisser) et redimensionnable (poignée en bas à droite) ; appelé au relâchement.
 */
export function viewFrame({ src, alt, view, proposal = null, onChange = null, large = false }) {
  const frame = el("div", "view-frame" + (large ? " large" : ""));
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.draggable = false;
  frame.append(img);
  const place = (node, rect) => {
    node.style.left = rect.x + "%";
    node.style.top = rect.y + "%";
    node.style.width = rect.width + "%";
    node.style.height = rect.height + "%";
  };
  if (proposal && proposal.view !== undefined && !sameView(proposal.view, view)) {
    const ghost = el("div", "view-rect proposal");
    ghost.title = "Proposition (non acceptée)";
    place(ghost, proposal.view ?? FULL);
    frame.append(ghost);
  }
  const rect = el("div", "view-rect" + (view ? "" : " whole") + (onChange ? " editable" : ""));
  rect.title = describeView(view);
  let current = { ...(view ?? FULL) };
  place(rect, current);
  frame.append(rect);
  if (onChange) {
    const handle = el("span", "view-handle");
    handle.title = "Redimensionner";
    rect.append(handle);
    let drag = null;
    const start = (mode) => (event) => {
      event.preventDefault();
      event.stopPropagation();
      const box = frame.getBoundingClientRect();
      drag = { mode, box, x: event.clientX, y: event.clientY, from: { ...current } };
      rect.setPointerCapture(event.pointerId);
    };
    rect.addEventListener("pointerdown", start("move"));
    handle.addEventListener("pointerdown", start("resize"));
    rect.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = ((event.clientX - drag.x) / drag.box.width) * 100;
      const dy = ((event.clientY - drag.y) / drag.box.height) * 100;
      const f = drag.from;
      current = drag.mode === "move"
        ? { ...f, x: Math.min(Math.max(f.x + dx, 0), 100 - f.width), y: Math.min(Math.max(f.y + dy, 0), 100 - f.height) }
        : { ...f, width: Math.min(Math.max(f.width + dx, 1), 100 - f.x), height: Math.min(Math.max(f.height + dy, 1), 100 - f.y) };
      place(rect, current);
    });
    const end = () => {
      if (!drag) return;
      const moved = !sameView(drag.from, current);
      drag = null;
      if (moved) {
        const next = normalizeView(current);
        if (next) onChange(next);
      }
    };
    rect.addEventListener("pointerup", end);
    rect.addEventListener("pointercancel", end);
  }
  return frame;
}

/** Quatre champs numériques (pourcentage) ; `onChange(view)` à la validation d'un champ. */
export function viewFields(view, onChange) {
  const box = el("div", "view-fields");
  const current = { ...(view ?? FULL) };
  for (const [key, label] of [["x", "x (%)"], ["y", "y (%)"], ["width", "Largeur (%)"], ["height", "Hauteur (%)"]]) {
    const input = el("input", "input");
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.step = "0.01";
    input.value = String(current[key]);
    input.addEventListener("change", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) { input.value = String(current[key]); return; }
      const next = normalizeView({ ...current, [key]: value });
      if (!next) { input.value = String(current[key]); return; }
      onChange(next);
    });
    const wrap = el("label", "", label);
    wrap.append(input);
    box.append(wrap);
  }
  return box;
}

/**
 * Contrôles de la galerie de la fiche pour une photo intégrée : cadre avec la vue, « Proposer »,
 * « Image entière », ajustement. `setView(view | null, message)` écrit dans le média (validation par
 * la galerie) ; `rerender()` redessine la galerie.
 */
export function mountPhotoViewControls(item, { setView }) {
  const visual = el("div", "media-visual view-visual");
  const controls = el("div", "view-controls");
  let proposal = null;
  const draw = () => {
    visual.replaceChildren(viewFrame({
      src: item.url, alt: item.caption || "Photo du mouvement", view: item.view ?? null, proposal,
      onChange: (view) => setView(view, "Vue retenue ajustée (à enregistrer avec le catalogue)."),
    }));
    controls.replaceChildren();
    controls.append(el("small", "view-current", "Vue retenue : " + describeView(item.view ?? null)));
    const buttons = el("div", "media-actions");
    const button = (text, action, primary = false) => {
      const node = el("button", primary ? "primary" : "", text);
      node.type = "button";
      node.addEventListener("click", action);
      buttons.append(node);
    };
    if (proposal) {
      controls.append(el("small", "view-proposal", "Proposition : " + describeView(proposal.view) + " — " + describeProposal(proposal)));
      button("Accepter la proposition", () => setView(proposal.view, "Proposition acceptée (à enregistrer avec le catalogue)."), true);
      button("Écarter", () => { proposal = null; draw(); });
    } else {
      button("Proposer", async () => {
        try {
          proposal = await proposeForPhoto(item.url);
          draw();
        } catch (error) {
          controls.append(el("small", "media-status error", "Détection impossible : " + error.message));
        }
      });
    }
    if (item.view) button("Image entière", () => setView(null, "Image retenue entière (à enregistrer avec le catalogue)."));
    controls.append(buttons);
    const adjust = el("details", "view-adjust");
    adjust.append(el("summary", "", "Ajuster"),
      viewFields(item.view ?? null, (view) => setView(view, "Vue retenue ajustée (à enregistrer avec le catalogue).")));
    controls.append(adjust);
  };
  draw();
  return { visual, controls };
}
