import type { TimerView } from "@/domain/execution/projection";

/**
 * Fin de PRE-10 — chrono circulaire de l'écran d'Exécution (CE-EXEC-SESSION-01, Figma `1992:8132`, `1992:8530`,
 * `1992:8626` : « Minuteur — fond », « Chronomètre — anneau de progression (avec embouts) », repères).
 *
 * Part de l'anneau, de 0 à 1, dans le sens horaire depuis le haut :
 * - compte à rebours (Durée, pauses, récupérations) : part écoulée de
 *   l'étape ; l'anneau se remplit avec le temps écoulé (recette x3 du 11/11/2026 : OK) ;
 * - chronomètre (Répétitions, avec ou sans cadence, À l'échec) : un tour par minute, puis recommence (ch08 ; recette x4
 *   du 11/11/2026, Hermann : « Il faut que ce soit la même chose avec cadence, un tour par minute puis recommence ») ;
 * - sans chrono (Point d'arrêt), Compte à rebours initial et Fin de séance : 0, immobile (recette x2, r2).
 * [Remplacé le 11/11/2026 — chronomètre avec fin nominale : part de la fin nominale, bornée à 1.]
 */
export function ringFraction(timer: TimerView): number {
  const motion = ringMotion(timer, false);
  return displayedFraction(motion.turns, motion.wrap);
}

/**
 * Mouvement continu de l'anneau (recette x2 du 11/11/2026, Hermann : « le mouvement circulaire est saccadé, il doit
 * être fluide et continu quelque soit la durée ») : position en tours au moment de la projection, vitesse en tours
 * par milliseconde pendant que l'Exécution avance (0 en pause), et retour au départ à chaque tour (chronomètre).
 * L'anneau est animé entre deux rafraîchissements de l'écran, sans attendre le changement de seconde.
 */
export type RingMotion = { readonly turns: number; readonly ratePerMs: number; readonly wrap: boolean };

export const MINUTE_MS = 60_000;

/**
 * Recette du 11/11/2026 (Hermann, x2 : « il ne faut pas de mouvement circulaire pendant le compte à rebours et la fin
 * de séance » ; r2 : « L'anneau ne doit PAS tourner pendant le compte à rebours et la fin de séance ») : `still`
 * immobilise l'anneau, vide, pendant le Compte à rebours initial et la Fin de séance.
 * [Anneau rempli avec le temps écoulé pendant ces deux étapes — remplacé.]
 */
export function ringMotion(timer: TimerView, running: boolean, still = false): RingMotion {
  if (still) return { turns: 0, ratePerMs: 0, wrap: false };
  switch (timer.kind) {
    case "COUNTDOWN":
      if (timer.totalMs <= 0) return { turns: 0, ratePerMs: 0, wrap: false };
      return { turns: clamp(timer.elapsedMs / timer.totalMs), ratePerMs: running && timer.remainingMs > 0 ? 1 / timer.totalMs : 0, wrap: false };
    case "STOPWATCH":
      return { turns: timer.elapsedMs / MINUTE_MS, ratePerMs: running ? 1 / MINUTE_MS : 0, wrap: true };
    case "NONE":
      return { turns: 0, ratePerMs: 0, wrap: false };
  }
}

/** Part dessinée : partie fractionnaire du tour (chronomètre), sinon bornée à 1. */
export function displayedFraction(turns: number, wrap: boolean): number {
  "worklet";
  if (wrap) return turns - Math.floor(turns);
  return Math.min(1, Math.max(0, turns));
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Géométrie relevée dans Figma (anneau de 288, centre au milieu). */
export const RING = {
  /** Diamètre de l'anneau de fond. */
  size: 288,
  /** Débord des repères au-delà de l'anneau (repère de départ à 13 au-dessus). */
  outset: 13,
  trackRadius: 138,
  trackWidth: 12,
  trackColor: "#E8E8ED",
  progressRadius: 136.29,
  progressWidth: 15.43,
  progressColor: "#8283F2",
  knobRadius: 9.14,
  knobStroke: 3,
  /** Repère de départ (haut) : 3 × 8, primaire atténué à 72 %. */
  startMark: { inner: 149, outer: 157, width: 3, color: "rgba(130,131,242,0.72)" },
  /** Repères des quarts : 3 × 6. */
  quarterMark: { inner: 151, outer: 157, width: 3, color: "#BEC2CC" },
  /** Repères intermédiaires tous les 18°, hors quarts : trait de 1,2 à 40 %. */
  // Recette du 12/11/2026 (Hermann : « Foncer un peu les 16 barres autour du cercle ») : 70 %. [40 % (Figma) — remplacé.]
  minorMark: { inner: 151, outer: 155, width: 1.2, color: "#BEC2CC", opacity: 0.7 },
} as const;

/** Orange des pauses et récupérations (orange système d'iOS, celui du voile du Point d'arrêt). */
export const REST_RING_COLOR = "#FF9500";

/**
 * Couleur de l'anneau qui tourne et de sa trace — recette du 13/11/2026 (Hermann : « Le cercle qui tourne et la trace
 * doivent être orange lorsque c'est la pause, ou une récupération ») : orange pendant les pauses entre séries, entre les
 * côtés, les récupérations et les repos ; violet (Figma) ailleurs.
 */
export function ringColorOf(phase: string | null): string {
  return phase === "SERIES_PAUSE" || phase === "SIDE_RECOVERY" || phase === "POST_ACTIVITY_RECOVERY" || phase === "BLOCK_REST" || phase === "WINDOW_REST"
    ? REST_RING_COLOR
    : RING.progressColor;
}

/** Point à `fraction` du tour (0 = haut, sens horaire), au rayon `radius`, autour de (`center`, `center`). */
export function pointAt(fraction: number, radius: number, center: number): { readonly x: number; readonly y: number } {
  "worklet";
  const angle = fraction * 2 * Math.PI;
  return { x: center + radius * Math.sin(angle), y: center - radius * Math.cos(angle) };
}

/** Arc SVG du haut jusqu'à `fraction` (exclu : 0 et le tour complet, dessiné par un cercle). */
export function arcPath(fraction: number, radius: number, center: number): string {
  const start = pointAt(0, radius, center);
  const end = pointAt(fraction, radius, center);
  const largeArc = fraction > 0.5 ? 1 : 0;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return `M ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 ${largeArc} 1 ${round(end.x)} ${round(end.y)}`;
}

/** Angles (en fraction de tour) des repères intermédiaires : tous les 18°, sauf les quarts. */
export const MINOR_MARKS: readonly number[] = Array.from({ length: 20 }, (_, index) => index / 20).filter((fraction) => (fraction * 4) % 1 !== 0);
export const QUARTER_MARKS: readonly number[] = [0.25, 0.5, 0.75];
