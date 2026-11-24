/**
 * UI-FAB-01 (D-558, DSF Bouton flottant § 5) — position du bouton flottant « Créer », commune à tous les écrans et
 * conservée sur l'appareil.
 *
 * - `side` : bord contre lequel le bouton est rangé (à 16 du bord).
 * - `lift` : hauteur choisie, comptée au-dessus de la position par défaut (12 au-dessus de la barre de navigation, ou
 *   du bouton « Continuer » en composition). 0 = position par défaut. Chaque écran la borne à sa propre zone (entre le
 *   bas de la zone de contexte et la position par défaut).
 *
 * Choix technique (classe D) : un petit fichier JSON dans le dossier privé de l'application, comme l'appairage
 * (`pairingStore`), pour ne pas créer de migration ; aucune donnée d'entraînement n'y figure.
 */
export type FloatingSide = "LEFT" | "RIGHT";
export type FloatingPosition = { readonly side: FloatingSide; readonly lift: number };

export const DEFAULT_FLOATING_POSITION: FloatingPosition = { side: "RIGHT", lift: 0 };

/** Rond de 60 (DSF § 2). */
export const FLOATING_BUTTON_SIZE = 60;
/** 16 du bord (DSF § 2 et § 5). */
export const FLOATING_EDGE_INSET = 16;
/** 12 au-dessus de la barre de navigation ou du bouton « Continuer » (DSF § 2). */
export const FLOATING_BOTTOM_GAP = 12;

const FILE_NAME = "kodjo-floating-create.json";

type FileSystem = typeof import("expo-file-system");

function positionFile() {
  // Chargé à l'appel : module natif absent des tests.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File, Paths } = require("expo-file-system") as FileSystem;
  return new File(Paths.document, FILE_NAME);
}

/** Lecture tolérante : toute valeur illisible revient à la position par défaut. */
export function parseFloatingPosition(raw: string): FloatingPosition {
  try {
    const value = JSON.parse(raw) as Partial<FloatingPosition>;
    const side = value.side === "LEFT" || value.side === "RIGHT" ? value.side : DEFAULT_FLOATING_POSITION.side;
    const lift = typeof value.lift === "number" && Number.isFinite(value.lift) && value.lift > 0 ? value.lift : 0;
    return { side, lift };
  } catch {
    return DEFAULT_FLOATING_POSITION;
  }
}

/**
 * Rangement au relâchement (DSF § 5) : bord gauche ou droit le plus proche du centre du bouton ; hauteur conservée,
 * bornée à la zone de l'écran (`maxLift` : écart entre la position par défaut et le bas de la zone de contexte).
 */
export function settleFloatingPosition(centerX: number, containerWidth: number, lift: number, maxLift: number): FloatingPosition {
  const side: FloatingSide = centerX < containerWidth / 2 ? "LEFT" : "RIGHT";
  return { side, lift: clampLift(lift, maxLift) };
}

export function clampLift(lift: number, maxLift: number): number {
  return Math.min(Math.max(0, lift), Math.max(0, maxLift));
}

let current: FloatingPosition = DEFAULT_FLOATING_POSITION;
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
      current = parseFloatingPosition(file.textSync());
      listeners.forEach((listener) => listener(current));
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
  try {
    const file = positionFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(position));
  } catch {
    // Écriture impossible : la position vaut jusqu'à la fermeture de l'application.
  }
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
  restored = false;
  listeners.clear();
}
