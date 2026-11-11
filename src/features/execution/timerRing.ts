import type { TimerView } from "@/domain/execution/projection";

/**
 * Fin de PRE-10 — chrono circulaire de l'écran d'Exécution (CE-EXEC-SESSION-01, Figma `1992:8132`, `1992:8530`,
 * `1992:8626` : « Minuteur — fond », « Chronomètre — anneau de progression (avec embouts) », repères).
 *
 * Part de l'anneau, de 0 à 1, dans le sens horaire depuis le haut :
 * - compte à rebours (Durée, pauses, récupérations) : part écoulée de l'étape ;
 * - chronomètre sans fin nominale (Répétitions sans cadence, À l'échec) : un tour par minute, puis recommence
 *   (ch08 « Exercice défini par un nombre de répétitions ») ;
 * - chronomètre avec fin nominale (Répétitions cadencées, Ri×Ci) : part de la fin nominale, bornée à 1 ;
 * - sans chrono (Point d'arrêt) : 0.
 *
 * [Interprétation du Figma, à valider en recette : l'anneau se remplit avec le temps écoulé (il ne se vide pas avec le
 * temps restant).]
 */
export function ringFraction(timer: TimerView): number {
  switch (timer.kind) {
    case "COUNTDOWN":
      return timer.totalMs <= 0 ? 0 : clamp(timer.elapsedMs / timer.totalMs);
    case "STOPWATCH":
      if (timer.nominalMs !== null && timer.nominalMs > 0) return clamp(timer.elapsedMs / timer.nominalMs);
      return (timer.elapsedMs % 60_000) / 60_000;
    case "NONE":
      return 0;
  }
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
  minorMark: { inner: 151, outer: 155, width: 1.2, color: "#BEC2CC", opacity: 0.4 },
} as const;

/** Point à `fraction` du tour (0 = haut, sens horaire), au rayon `radius`, autour de (`center`, `center`). */
export function pointAt(fraction: number, radius: number, center: number): { readonly x: number; readonly y: number } {
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
