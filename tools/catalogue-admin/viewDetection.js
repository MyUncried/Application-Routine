/**
 * Marquage des photos (D-600, règle de Hermann du 24/11/2026 ; DSF Carte de séance § 1 et § 3).
 *
 * Module pur (aucune dépendance, ni DOM ni Node) : utilisé par la page d'administration (pixels d'un
 * canevas) et par `propose-views.mjs` (pixels PNG). Il PROPOSE seulement : la personne qui publie
 * vérifie et corrige avant que la vue soit écrite dans `media.view`.
 *
 * Détection : une séparation est une bande de lignes (ou de colonnes) quasi blanches sur toute la
 * longueur de la zone examinée, d'une épaisseur minimale. Les bandes au bord d'une zone sont des marges
 * et ne séparent rien. Le découpage est récursif (bande horizontale sur toute la largeur, puis bandes
 * verticales dans chaque morceau, ou l'inverse), ce qui couvre « deux vues en haut, une vue large en
 * bas ». Une vue est le rectangle compris entre les séparations (marges blanches non rognées).
 *
 * Règle de choix : une seule vue → image entière (aucune vue stockée) ; deux vues → la plus à droite ;
 * trois vues ou plus → la plus large (égalité : la plus grande, puis la plus à droite).
 */

export const VIEW_DETECTION_DEFAULTS = Object.freeze({
  /** Canal le plus sombre d'un pixel « quasi blanc » (0–255). Fond gris des illustrations ≈ 180. */
  whiteMin: 235,
  /** Part minimale de pixels quasi blancs d'une ligne pour qu'elle compte comme blanche (tolérance de compression). */
  coverage: 0.995,
  /** Épaisseur minimale d'une bande de séparation, en pixels. */
  minBand: 2,
  /** Taille minimale d'une vue, en part de la dimension de l'image (évite les lamelles). */
  minViewFraction: 0.1,
  /** Profondeur maximale du découpage récursif. */
  maxDepth: 4,
  /**
   * Écart de luminance maximal d'une ligne (ou colonne) de bord « unie » : marge de remplissage autour
   * des vues (ex. bandeau gris au-dessus des illustrations refaites au gabarit 1206 × 987).
   */
  flatRange: 10,
  /** Épaisseur maximale d'une marge unie, en part de la dimension (au-delà : c'est du contenu). */
  maxMarginFraction: 0.15,
});

const round2 = (value) => Math.round(value * 100) / 100;

/** Rectangle en pixels → pourcentage de l'image arrondi à 0,01, toujours contenu dans l'image. */
export function toPercentRect(rect, width, height) {
  const x = round2((rect.x / width) * 100);
  const y = round2((rect.y / height) * 100);
  const w = round2(Math.min((rect.width / width) * 100, 100 - x));
  const h = round2(Math.min((rect.height / height) * 100, 100 - y));
  return { x, y, width: w, height: h };
}

function whiteMask(width, height, data, whiteMin) {
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < mask.length; i += 1, p += 4) {
    const alpha = data[p + 3];
    // Pixel transparent : traité comme du blanc (fond de page).
    if (alpha < 16) { mask[i] = 1; continue; }
    mask[i] = data[p] >= whiteMin && data[p + 1] >= whiteMin && data[p + 2] >= whiteMin ? 1 : 0;
  }
  return mask;
}

/** Sommes cumulées par ligne (le long de x) et par colonne (le long de y). */
function prefixSums(mask, width, height) {
  const rows = new Int32Array((width + 1) * height);
  const cols = new Int32Array((height + 1) * width);
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    const base = y * (width + 1);
    for (let x = 0; x < width; x += 1) {
      sum += mask[y * width + x];
      rows[base + x + 1] = sum;
    }
  }
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    const base = x * (height + 1);
    for (let y = 0; y < height; y += 1) {
      sum += mask[y * width + x];
      cols[base + y + 1] = sum;
    }
  }
  return { rows, cols };
}

/**
 * Coupes d'une zone le long d'un axe : intervalles [début, fin) des morceaux séparés par des bandes
 * blanches intérieures. `horizontal` = bandes horizontales (lignes), morceaux empilés.
 */
function piecesAlong(region, horizontal, sums, width, height, settings) {
  const start = horizontal ? region.y : region.x;
  const length = horizontal ? region.height : region.width;
  const across = horizontal ? region.width : region.height;
  const tolerated = Math.floor((1 - settings.coverage) * across);
  const isWhiteLine = (index) => {
    if (horizontal) {
      const base = index * (width + 1);
      return across - (sums.rows[base + region.x + region.width] - sums.rows[base + region.x]) <= tolerated;
    }
    const base = index * (height + 1);
    return across - (sums.cols[base + region.y + region.height] - sums.cols[base + region.y]) <= tolerated;
  };
  const runs = [];
  let runStart = -1;
  for (let i = start; i <= start + length; i += 1) {
    const white = i < start + length && isWhiteLine(i);
    if (white && runStart < 0) runStart = i;
    if (!white && runStart >= 0) {
      runs.push([runStart, i]);
      runStart = -1;
    }
  }
  const minPiece = Math.max(8, Math.round(settings.minViewFraction * (horizontal ? height : width)));
  // Bandes intérieures seulement (une bande au bord est une marge), assez épaisses.
  const bands = runs.filter(([a, b]) => a > start && b < start + length && b - a >= settings.minBand);
  const pieces = [];
  let pieceStart = start;
  for (const [a, b] of bands) {
    // Une coupe n'est retenue que si les deux morceaux qu'elle crée restent des vues plausibles.
    if (a - pieceStart >= minPiece && start + length - b >= minPiece) {
      pieces.push([pieceStart, a]);
      pieceStart = b;
    }
  }
  pieces.push([pieceStart, start + length]);
  return pieces;
}

/**
 * Marges extérieures unies de l'image (lignes et colonnes de bord d'une seule teinte) : ignorées pour
 * chercher les séparations ; si l'image est découpée, les vues s'arrêtent à ces marges.
 */
function withoutFlatMargins(width, height, data, { flatRange, maxMarginFraction }) {
  const lum = (x, y) => {
    const p = (y * width + x) * 4;
    return (data[p] + data[p + 1] + data[p + 2]) / 3;
  };
  const flatLine = (horizontal, index, from, to) => {
    let min = 255, max = 0;
    for (let t = from; t < to; t += 1) {
      const v = horizontal ? lum(t, index) : lum(index, t);
      if (v < min) min = v;
      if (v > max) max = v;
      if (max - min > flatRange) return false;
    }
    return true;
  };
  const maxRows = Math.floor(maxMarginFraction * height);
  const maxCols = Math.floor(maxMarginFraction * width);
  let top = 0, bottom = height, left = 0, right = width;
  while (top < bottom && flatLine(true, top, 0, width)) top += 1;
  while (bottom > top && flatLine(true, bottom - 1, 0, width)) bottom -= 1;
  if (top > maxRows) top = 0;
  if (height - bottom > maxRows) bottom = height;
  while (left < right && flatLine(false, left, top, bottom)) left += 1;
  while (right > left && flatLine(false, right - 1, top, bottom)) right -= 1;
  if (left > maxCols) left = 0;
  if (width - right > maxCols) right = width;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function split(region, depth, sums, width, height, settings, out, inner = region) {
  if (depth < settings.maxDepth && inner.width > 0 && inner.height > 0) {
    for (const horizontal of [true, false]) {
      const pieces = piecesAlong(inner, horizontal, sums, width, height, settings);
      if (pieces.length > 1) {
        for (const [a, b] of pieces) {
          const child = horizontal
            ? { x: inner.x, y: a, width: inner.width, height: b - a }
            : { x: a, y: inner.y, width: b - a, height: inner.height };
          split(child, depth + 1, sums, width, height, settings, out);
        }
        return;
      }
    }
  }
  out.push(region);
}

/** Vues détectées, en pixels, dans l'ordre de lecture (haut puis gauche). */
export function detectViewRects(width, height, data, options = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Dimensions d'image invalides");
  }
  if (!data || data.length < width * height * 4) throw new Error("Pixels RGBA incomplets");
  const settings = { ...VIEW_DETECTION_DEFAULTS, ...options };
  const sums = prefixSums(whiteMask(width, height, data, settings.whiteMin), width, height);
  const out = [];
  const whole = { x: 0, y: 0, width, height };
  split(whole, 0, sums, width, height, settings, out, withoutFlatMargins(width, height, data, settings));
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Règle de choix (pixels). Retourne l'indice de la vue retenue, le nom de la règle et les remarques
 * qui appellent une vérification attentive.
 */
export function chooseView(rects, width, height) {
  const notes = [];
  if (rects.length <= 1) return { index: 0, rule: "IMAGE_ENTIERE", notes };
  const tieX = Math.max(1, width * 0.01);
  const area = (r) => r.width * r.height;
  let index = 0;
  if (rects.length === 2) {
    const right = (r) => r.x + r.width;
    rects.forEach((r, i) => {
      const best = rects[index];
      if (right(r) > right(best) + tieX ||
          (Math.abs(right(r) - right(best)) <= tieX && (area(r) > area(best) || (area(r) === area(best) && r.y > best.y)))) {
        index = i;
      }
    });
    if (Math.abs(rects[0].x + rects[0].width - (rects[1].x + rects[1].width)) <= tieX) {
      notes.push("deux vues superposées : « la plus à droite » ne départage pas");
    }
    return { index, rule: "PLUS_A_DROITE", notes };
  }
  rects.forEach((r, i) => {
    const best = rects[index];
    if (r.width > best.width + tieX ||
        (Math.abs(r.width - best.width) <= tieX && (area(r) > area(best) + 1 ||
          (Math.abs(area(r) - area(best)) <= 1 && r.x > best.x)))) {
      index = i;
    }
  });
  if (rects.length > 3) notes.push(rects.length + " vues : la règle ne prévoit que deux ou trois vues");
  const widest = rects[index].width;
  if (rects.filter((r) => Math.abs(r.width - widest) <= tieX).length > 1) {
    notes.push("vues de même largeur : retenue la plus grande, puis la plus à droite");
  }
  return { index, rule: "PLUS_LARGE", notes };
}

/**
 * Proposition complète pour une image.
 * @returns {{ width: number, height: number, views: {x:number,y:number,width:number,height:number}[],
 *   retainedIndex: number, retained: {x:number,y:number,width:number,height:number},
 *   view: {x:number,y:number,width:number,height:number} | null, rule: string, notes: string[] }}
 *   `views` et `retained` en pourcentage ; `view` = valeur à stocker (null : image entière).
 */
export function proposeView(width, height, data, options = {}) {
  const rects = detectViewRects(width, height, data, options);
  const choice = chooseView(rects, width, height);
  const views = rects.map((rect) => toPercentRect(rect, width, height));
  const retained = views[choice.index];
  return {
    width, height, views, retainedIndex: choice.index, retained,
    view: views.length > 1 ? retained : null,
    rule: choice.rule, notes: choice.notes,
  };
}
