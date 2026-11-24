/**
 * UI-FAB-01 (D-558, D-594 ; DSF Bouton flottant § 5) — position et physique du bouton flottant « Créer », communes à tous les
 * écrans et conservées sur l'appareil.
 *
 * Physique (audit AUDIT-FAB-PHYSIQUE du 24/11/2026, référence : bouton d'outils d'Expo, `expo-dev-menu` 57.0.15,
 * `ios/FAB/DevMenuFABView.swift`, vidéo de Hermann) : deux ressorts successifs.
 * - Pendant le glissement, le bouton est relié au doigt par un ressort raide (réponse 0,25 s, amortissement 0,85) : il suit
 *   avec un retard d'environ 0,068 s × la vitesse du doigt.
 * - Au relâchement, la cible est projetée vers l'avant (0,175 s × la vitesse) ; horizontalement, elle est rangée contre le
 *   bord vers lequel l'élan porte le bouton (décision de Hermann du 24/11/2026 : « le bouton se range tout le temps soit à
 *   droite, soit à gauche ») ; verticalement, elle est seulement bornée à l'écran (« Oui, partout »). Un ressort plus souple
 *   (réponse 0,6 s, amortissement 0,7) y conduit le bouton en partant de la vitesse du relâchement : léger dépassement, pose.
 * Conversion des ressorts d'iOS (réponse T, amortissement ζ, masse 1) : raideur = (2π / T)², amortissement = 4πζ / T.
 *
 * Stockage (classe D) : petit fichier JSON du dossier privé de l'application, comme l'appairage ; aucune migration.
 * [Hauteur comptée au-dessus de la position par défaut (`lift`), bornée au bas de la zone de contexte — remplacée le 24/11/2026
 * par la hauteur absolue (`top`).]
 */
export type FloatingSide = "LEFT" | "RIGHT";
/** `top` : haut du bouton dans l'écran ; `null` : hauteur par défaut de l'écran (au-dessus de la barre ou de « Continuer »). */
export type FloatingPosition = { readonly side: FloatingSide; readonly top: number | null };

export const DEFAULT_FLOATING_POSITION: FloatingPosition = { side: "RIGHT", top: null };

/** Rond de 60 (DSF § 2). */
export const FLOATING_BUTTON_SIZE = 60;
/** 16 du bord (DSF § 2 et § 5). */
export const FLOATING_EDGE_INSET = 16;
/** 12 au-dessus de la barre de navigation ou du bouton « Continuer » (DSF § 2). */
export const FLOATING_BOTTOM_GAP = 12;
/** Glissement reconnu au-delà de 10 pt ; en deçà, un toucher (référence : `dragThreshold`). */
export const FLOATING_DRAG_THRESHOLD = 10;
/** Élan au relâchement : décalage de la cible = vitesse (pt/s) × 0,175 s (référence : 0,35 × projection d'iOS ≈ 0,5 s). */
export const FLOATING_MOMENTUM_SECONDS = 0.175;
/** Ressort de suivi du doigt (réponse 0,25 s, amortissement 0,85). */
export const FLOATING_FOLLOW_SPRING = { mass: 1, stiffness: 632, damping: 42.7 } as const;
/** Ressort de pose (réponse 0,6 s, amortissement 0,7). */
export const FLOATING_SETTLE_SPRING = { mass: 1, stiffness: 110, damping: 14.7 } as const;

/** Limites du haut du bouton dans l'écran (bouton entier visible). */
export type FloatingBounds = { readonly width: number; readonly minTop: number; readonly maxTop: number };

export function clampTop(top: number, bounds: FloatingBounds): number {
  "worklet";
  return Math.min(Math.max(top, bounds.minTop), Math.max(bounds.minTop, bounds.maxTop));
}

/** Abscisse du bord gauche du bouton rangé de ce côté. */
export function sideLeft(side: FloatingSide, width: number): number {
  "worklet";
  return side === "LEFT" ? FLOATING_EDGE_INSET : width - FLOATING_EDGE_INSET - FLOATING_BUTTON_SIZE;
}

/**
 * Cible du relâchement : côté vers lequel l'élan porte le centre du bouton (bord le plus proche sans élan), hauteur
 * prolongée par l'élan puis bornée.
 */
export function releaseTarget(
  left: number,
  top: number,
  velocityX: number,
  velocityY: number,
  bounds: FloatingBounds,
): { readonly side: FloatingSide; readonly left: number; readonly top: number } {
  "worklet";
  const centerX = left + FLOATING_BUTTON_SIZE / 2 + velocityX * FLOATING_MOMENTUM_SECONDS;
  const side: FloatingSide = centerX < bounds.width / 2 ? "LEFT" : "RIGHT";
  return { side, left: sideLeft(side, bounds.width), top: clampTop(top + velocityY * FLOATING_MOMENTUM_SECONDS, bounds) };
}

/** Retard du bouton sur un doigt à vitesse constante (régime établi du ressort de suivi) : vitesse × amortissement / raideur. */
export function followLag(speed: number): number {
  return (speed * FLOATING_FOLLOW_SPRING.damping) / FLOATING_FOLLOW_SPRING.stiffness;
}

const FILE_NAME = "kodjo-floating-create.json";

type FileSystem = typeof import("expo-file-system");

function positionFile() {
  // Chargé à l'appel : module natif absent des tests.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require("expo-file-system") as FileSystem;
  return new File(Paths.document, FILE_NAME);
}

/** Lecture tolérante : valeur illisible → position par défaut ; ancien format (`lift`) → hauteur par défaut, côté conservé. */
export function parseFloatingPosition(raw: string): FloatingPosition {
  try {
    const value = JSON.parse(raw) as { side?: unknown; top?: unknown };
    const side = value.side === "LEFT" || value.side === "RIGHT" ? value.side : DEFAULT_FLOATING_POSITION.side;
    const top = typeof value.top === "number" && Number.isFinite(value.top) ? value.top : null;
    return { side, top };
  } catch {
    return DEFAULT_FLOATING_POSITION;
  }
}

/**
 * Recette du 24/11/2026 (Hermann, constats) : « un appui long sur le bouton pour lui faire passer d'un fond blanc symbole
 * bleu à un bouton d'un fond bleu symbole blanc (mêmes opacités) ». Couleurs conservées avec la position, dans le même
 * fichier (champ `tone`, écrit seulement pour le bleu : l'ancien fichier reste lisible).
 */
export type FloatingTone = "LIGHT" | "BLUE";

export function parseFloatingTone(raw: string): FloatingTone {
  try {
    return (JSON.parse(raw) as { tone?: unknown }).tone === "BLUE" ? "BLUE" : "LIGHT";
  } catch {
    return "LIGHT";
  }
}

let current: FloatingPosition = DEFAULT_FLOATING_POSITION;
let currentTone: FloatingTone = "LIGHT";
const toneListeners = new Set<(tone: FloatingTone) => void>();

function writeFile(): void {
  try {
    const file = positionFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(currentTone === "BLUE" ? { ...current, tone: currentTone } : current));
  } catch {
    // Écriture impossible : la valeur vaut jusqu'à la fermeture de l'application.
  }
}
let restored = false;
const listeners = new Set<(position: FloatingPosition) => void>();

export function currentFloatingPosition(): FloatingPosition {
  return current;
}

/** Position du fichier, lue une fois par lancement ; les écrans montés sont prévenus. */
export function restoreFloatingPosition(): FloatingPosition {
  if (restored) return current;
  restored = true;
  try {
    const file = positionFile();
    if (file.exists) {
      const raw = file.textSync();
      current = parseFloatingPosition(raw);
      currentTone = parseFloatingTone(raw);
      listeners.forEach((listener) => listener(current));
      toneListeners.forEach((listener) => listener(currentTone));
    }
  } catch {
    // Fichier inaccessible : position par défaut.
  }
  return current;
}

/** Nouvelle position : mémoire, écrans montés, puis fichier (un échec d'écriture garde la position du lancement). */
export function saveFloatingPosition(position: FloatingPosition): void {
  current = position;
  restored = true;
  listeners.forEach((listener) => listener(position));
  writeFile();
}

/** Couleurs du bouton, relues avec la position. */
export function restoreFloatingTone(): FloatingTone {
  restoreFloatingPosition();
  return currentTone;
}

/** Nouvelles couleurs : mémoire, écrans montés, puis fichier (position conservée). */
export function saveFloatingTone(tone: FloatingTone): void {
  restoreFloatingPosition();
  currentTone = tone;
  toneListeners.forEach((listener) => listener(tone));
  writeFile();
}

export function subscribeFloatingTone(listener: (tone: FloatingTone) => void): () => void {
  toneListeners.add(listener);
  return () => {
    toneListeners.delete(listener);
  };
}

export function subscribeFloatingPosition(listener: (position: FloatingPosition) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tests seulement. */
export function resetFloatingPositionForTests(): void {
  current = DEFAULT_FLOATING_POSITION;
  currentTone = "LIGHT";
  restored = false;
  listeners.clear();
  toneListeners.clear();
}
