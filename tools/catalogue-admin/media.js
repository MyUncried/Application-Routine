/**
 * Galerie de médias d'une fiche (reprise de l'administration Web statique `static-ovh`, 07/11/2026),
 * adaptée au format v2 : la validation d'un média n'est PAS réécrite ici ; elle est confiée au
 * parseur partagé du domaine par la fonction `validate` fournie par la page.
 *
 * Photos locales : JPEG, PNG ou WebP de 8 Mo au plus, redimensionnées à 1050 px au plus et
 * réencodées en WebP (qualités 0,78 puis 0,62 puis 0,44) jusqu'à tenir dans la limite du format
 * (`CATALOGUE_MAX_EMBEDDED_PHOTO_CHARS`) ; la conversion retire les métadonnées EXIF (GPS compris).
 * Photos et vidéos par lien : HTTPS uniquement. Aucune donnée n'est envoyée ailleurs qu'au
 * serveur local au moment de l'enregistrement du fichier catalogue.
 */
const MAX_PHOTO_SOURCE_BYTES = 8 * 1024 * 1024;
const RIGHTS_LABELS = { UNVERIFIED: "Non vérifiés", PERMISSION_CONFIRMED: "Autorisation déclarée", RESTRICTED: "Utilisation interdite" };

const el = (tag, className = "", text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function freshMediaId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return "media-" + [...bytes].map((n) => n.toString(16).padStart(2, "0")).join("");
}

async function compactLocalPhoto(file, maxChars) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw Error("Choisis un JPEG, PNG ou WebP.");
  if (file.size > MAX_PHOTO_SOURCE_BYTES) throw Error("Photo supérieure à 8 Mo. Réduis-la avant import.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1050 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Traitement de l’image indisponible.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.62, 0.44]) {
      const data = canvas.toDataURL("image/webp", quality);
      if (/^data:image\/(?:webp|png);base64,/.test(data) && data.length <= maxChars) return data;
    }
    throw Error("Image encore trop volumineuse après optimisation.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function preview(item) {
  const wrap = el("div", "media-visual");
  if (item.kind === "PHOTO") {
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.alt;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => wrap.classList.add("media-broken"));
    wrap.append(img);
  } else {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.referrerPolicy = "no-referrer";
    link.textContent = "Ouvrir la vidéo source";
    wrap.append(el("span", "media-symbol", "VIDÉO"), link);
  }
  return wrap;
}

/**
 * @param {HTMLElement} container
 * @param {{ getMedia: () => object[], setMedia: (media: object[]) => void,
 *           validate: (media: object[]) => string | null, notify: (text: string, kind?: string) => void,
 *           maxMedia: number, maxEmbeddedChars: number }} options
 */
export function mountMediaEditor(container, options) {
  let editedId = null;
  const section = el("fieldset", "media-section");
  section.append(el("legend", "", "Photos et vidéos — facultatif"));
  const header = el("div", "media-header");
  const count = el("span", "info");
  header.append(el("strong", "", "Galerie de la fiche"), count);
  section.append(header, el("p", "tip",
    "Photos JPEG, PNG ou WebP optimisées et conservées dans le fichier catalogue. Vidéos : lien HTTPS uniquement. " +
    "Le statut « Autorisation déclarée » ne vérifie pas juridiquement la licence ; aucun média dont les droits ne sont pas confirmés n'est publiable."));
  const gallery = el("div", "media-gallery");
  section.append(gallery);

  const editor = el("div", "media-editor");
  const input = (labelText, element) => {
    const label = el("label", "", labelText);
    label.append(element);
    return label;
  };
  const typeSelect = el("select", "input");
  for (const [value, text] of [["PHOTO_FILE", "Photo depuis ce PC"], ["PHOTO_URL", "Photo par lien HTTPS"], ["VIDEO_URL", "Vidéo par lien HTTPS"]]) {
    typeSelect.append(new Option(text, value));
  }
  const rights = el("select", "input");
  for (const [value, text] of Object.entries(RIGHTS_LABELS)) rights.append(new Option(text, value));
  const fileInput = el("input", "input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png,image/webp";
  const urlInput = el("input", "input");
  urlInput.type = "url";
  urlInput.maxLength = 2048;
  urlInput.placeholder = "https://…";
  const field = (max, placeholder) => {
    const node = el("input", "input");
    node.maxLength = max;
    node.placeholder = placeholder;
    return node;
  };
  const sourceUrl = field(2048, "https://… (justificatif, si disponible)");
  const attribution = field(160, "Auteur ou fournisseur, si connu");
  const license = field(160, "Licence ou autorisation écrite");
  const alt = field(180, "Décrire l'image (obligatoire pour une photo)");
  const caption = field(180, "Ex. position de départ");
  const fileGroup = input("Fichier photo", fileInput);
  const urlGroup = input("URL HTTPS du média", urlInput);
  const submit = el("button", "primary", "Ajouter à la galerie");
  submit.type = "button";
  const cancel = el("button", "hidden", "Annuler la modification");
  cancel.type = "button";

  const grid = (...children) => {
    const node = el("div", "grid");
    node.append(...children);
    return node;
  };
  const actions = el("div", "split");
  actions.append(submit, cancel);
  const status = el("p", "media-status hidden");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const currentFile = el("small", "media-current-file hidden");
  const notify = (message, kind = "") => {
    options.notify(message, kind);
    status.textContent = message;
    status.className = "media-status " + kind;
  };
  editor.append(
    grid(input("Mode d'ajout", typeSelect), input("Statut des droits", rights)),
    el("small", "media-rights-hint", "« Autorisation déclarée » exige l'auteur / crédit et la licence / conditions d'utilisation."),
    fileGroup, currentFile, urlGroup,
    grid(input("Source originale / justificatif (URL)", sourceUrl), input("Auteur / fournisseur / crédit", attribution)),
    grid(input("Licence / conditions d'utilisation", license), input("Texte alternatif de la photo", alt)),
    input("Légende / position dans l'exercice", caption),
    actions,
    status,
  );
  section.append(editor);
  container.append(section);

  const showSourceFields = () => {
    fileGroup.classList.toggle("hidden", typeSelect.value !== "PHOTO_FILE");
    currentFile.classList.toggle("hidden", typeSelect.value !== "PHOTO_FILE" || !currentFile.textContent);
    urlGroup.classList.toggle("hidden", typeSelect.value === "PHOTO_FILE");
  };
  const clearEditor = () => {
    editedId = null;
    typeSelect.value = "PHOTO_FILE";
    fileInput.value = "";
    for (const node of [urlInput, sourceUrl, attribution, license, alt, caption]) node.value = "";
    rights.value = "UNVERIFIED";
    currentFile.textContent = "";
    submit.textContent = "Ajouter à la galerie";
    cancel.classList.add("hidden");
    showSourceFields();
  };

  const render = () => {
    const media = options.getMedia();
    count.textContent = media.length + (media.length > 1 ? " médias" : " média");
    gallery.replaceChildren();
    if (media.length === 0) {
      gallery.append(el("p", "info", "Aucun média pour cette fiche. Les médias sont facultatifs."));
      return;
    }
    media.forEach((item, index) => {
      const card = el("article", "media-card");
      card.append(preview(item));
      const info = el("div", "media-info");
      info.append(
        el("strong", "", (index + 1) + ". " + (item.caption || (item.kind === "PHOTO" ? "Photo" : "Vidéo"))),
        el("small", "", item.kind === "PHOTO" ? "Photo" : "Vidéo"),
        el("small", "", "Origine : " + (item.storage === "EMBEDDED" ? "fichier intégré au catalogue" : "URL externe")),
        el("small", "", "Auteur/source : " + (item.attribution || "Non renseigné")),
        el("small", "", "Licence : " + (item.license || "Non renseignée")),
        el("small", "media-rights" + (item.rightsStatus === "PERMISSION_CONFIRMED" ? " confirmed" : ""),
          "Droits : " + (RIGHTS_LABELS[item.rightsStatus] ?? "Non vérifiés")),
      );
      const buttons = el("div", "media-actions");
      const button = (text, action, disabled = false) => {
        const node = el("button", "", text);
        node.type = "button";
        node.disabled = disabled;
        node.addEventListener("click", action);
        buttons.append(node);
      };
      button("↑", () => move(index, -1), index === 0);
      button("↓", () => move(index, 1), index === media.length - 1);
      button("Modifier", () => edit(item));
      button("Retirer", () => remove(index));
      info.append(buttons);
      card.append(info);
      gallery.append(card);
    });
  };

  const commit = (next, message) => {
    const problem = options.validate(next);
    if (problem) {
      notify("Média non enregistré : " + problem + ".", "error");
      return false;
    }
    options.setMedia(next);
    render();
    if (message) notify(message, "ok");
    return true;
  };
  const move = (index, step) => {
    const media = [...options.getMedia()];
    const target = index + step;
    if (target < 0 || target >= media.length) return;
    [media[index], media[target]] = [media[target], media[index]];
    commit(media);
  };
  const remove = (index) => {
    const media = [...options.getMedia()];
    if (!confirm("Retirer « " + (media[index].caption || media[index].kind) + " » de cette fiche ?")) return;
    if (editedId === media[index].id) clearEditor();
    media.splice(index, 1);
    commit(media);
  };
  const edit = (item) => {
    editedId = item.id;
    typeSelect.value = item.storage === "EMBEDDED" ? "PHOTO_FILE" : item.kind === "VIDEO" ? "VIDEO_URL" : "PHOTO_URL";
    fileInput.value = "";
    urlInput.value = item.storage === "REMOTE" ? item.url : "";
    sourceUrl.value = item.sourceUrl ?? "";
    attribution.value = item.attribution;
    license.value = item.license;
    rights.value = item.rightsStatus;
    currentFile.textContent = item.storage === "EMBEDDED"
      ? "Fichier actuel : " + (item.fileName || "photo intégrée") + " — conservé si aucun nouveau fichier n'est choisi."
      : "";
    status.className = "media-status hidden";
    alt.value = item.alt;
    caption.value = item.caption;
    submit.textContent = "Enregistrer ce média";
    cancel.classList.remove("hidden");
    showSourceFields();
    typeSelect.focus();
  };

  submit.addEventListener("click", async () => {
    const media = [...options.getMedia()];
    if (media.length >= options.maxMedia && !editedId) return notify("Maximum de " + options.maxMedia + " médias par fiche.", "error");
    const type = typeSelect.value;
    const kind = type === "VIDEO_URL" ? "VIDEO" : "PHOTO";
    const storage = type === "PHOTO_FILE" ? "EMBEDDED" : "REMOTE";
    const old = editedId ? media.find((entry) => entry.id === editedId) : null;
    let url = "";
    if (storage === "EMBEDDED") {
      const file = fileInput.files[0];
      if (file) {
        try {
          url = await compactLocalPhoto(file, options.maxEmbeddedChars);
        } catch (error) {
          return notify(error.message, "error");
        }
      } else if (old?.storage === "EMBEDDED") {
        url = old.url;
      } else {
        return notify("Choisis d’abord un fichier photo.", "error");
      }
    } else {
      url = urlInput.value.trim();
    }
    const origin = sourceUrl.value.trim();
    const item = {
      id: old?.id ?? freshMediaId(), kind, storage, url,
      fileName: storage === "EMBEDDED" ? (fileInput.files[0]?.name ?? old?.fileName ?? "image") : "",
      caption: caption.value.trim(), alt: alt.value.trim(),
      sourceUrl: origin || (storage === "REMOTE" ? url : null),
      attribution: attribution.value.trim(), license: license.value.trim(), rightsStatus: rights.value,
    };
    if (old) media.splice(media.findIndex((entry) => entry.id === old.id), 1, item);
    else media.push(item);
    if (commit(media, old ? "Média modifié (à enregistrer avec le catalogue)." : "Média ajouté (à enregistrer avec le catalogue).")) clearEditor();
  });
  cancel.addEventListener("click", clearEditor);
  typeSelect.addEventListener("change", showSourceFields);
  clearEditor();
  render();
}
