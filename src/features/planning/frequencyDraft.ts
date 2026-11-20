import type { ContentFrequency } from "@/domain/planning/Routine";

/**
 * Feuille « Fréquence » (CE-UI-11, D-329, chapitre 10 « x fois sur n ») — brouillon local.
 * - Modifier x ou n remet toutes les pastilles au gris (aucune sélection automatique).
 * - x ≤ n ; bornes techniques 1..`FREQUENCY_N_MAX` (bornes à spécifier, CE-UI-11 §14).
 * - Point ouvert 1 (plafond ou mise à jour de x) non tranché : les pastilles se cochent librement ; la coche n'est
 *   active que lorsque le motif compte exactement x positions (« le motif final doit représenter x positions parmi
 *   n », CE-UI-11 §14).
 */
export const FREQUENCY_N_MAX = 10;

export type FrequencyDraft = { readonly x: number; readonly n: number; readonly positions: readonly number[] };

export function fromFrequency(frequency: ContentFrequency): FrequencyDraft {
  return { x: frequency.x, n: frequency.n, positions: [...frequency.positions].sort((a, b) => a - b) };
}

export function withX(draft: FrequencyDraft, x: number): FrequencyDraft {
  const bounded = Math.max(1, Math.min(draft.n, x));
  return bounded === draft.x ? draft : { ...draft, x: bounded, positions: [] };
}

export function withN(draft: FrequencyDraft, n: number): FrequencyDraft {
  const bounded = Math.max(1, Math.min(FREQUENCY_N_MAX, n));
  if (bounded === draft.n) return draft;
  return { x: Math.min(draft.x, bounded), n: bounded, positions: [] };
}

export function togglePosition(draft: FrequencyDraft, position: number): FrequencyDraft {
  const positions = draft.positions.includes(position)
    ? draft.positions.filter((value) => value !== position)
    : [...draft.positions, position].sort((a, b) => a - b);
  return { ...draft, positions };
}

export function isComplete(draft: FrequencyDraft): boolean {
  return draft.positions.length === draft.x;
}

export function toFrequency(draft: FrequencyDraft): ContentFrequency {
  return { x: draft.x, n: draft.n, positions: draft.positions };
}
